#!/usr/bin/env node
/**
 * The homepage hero image must be discoverable in the initial document.
 *
 * The hero's Largest Contentful Paint is a CSS `background-image` on a div
 * that only exists once React mounts. The HTML parser cannot see a
 * background-image, so the browser learned about the 141 KB file only after
 * the SPA had mounted - which put the download behind the whole entry
 * bundle. Measured on the production site: the image request did not start
 * until 2,083 ms, and the paint landed around 3,550 ms.
 *
 * The prerender therefore emits
 *
 *   <link rel="preconnect" href="https://plus.unsplash.com" />
 *   <link rel="preload" as="image" href="<hero image>" fetchpriority="high" />
 *
 * on the homepage only. That starts the request in parallel with the
 * scripts: the measured image discovery time fell from about 2,083 ms to
 * 27 ms.
 *
 * Three ways this can silently rot, all of them checked here:
 *
 *   1. The preload is dropped from the prerender. The guard reads the built
 *      page, so a dropped tag is a red build, not a slow page.
 *   2. The URL in the prerender drifts from the URL the SPA renders. Then
 *      the preload fetches a file nobody uses and the real hero still starts
 *      late - the worst outcome, because it looks fine and costs bytes. The
 *      guard reads the SPA's own module and compares.
 *   3. The preload spreads to every page. The hero only appears on the
 *      homepage, and a third-party handshake on 441 pages that never ask for
 *      the image is a waste. The guard checks the other pages too.
 *
 * Usage:
 *   node scripts/check-hero-preload.mjs            # check dist/
 *   node scripts/check-hero-preload.mjs --self-test
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const HERO_MODULE = "src/lib/heroImages.ts";
const HERO_SECTION = "src/components/HomeSection.tsx";
const PRERENDER_SOURCE = "scripts/prerender-pages.ts";
const DIST = "dist";

const problems = [];
const notes = [];

function fail(message) {
  problems.push(message);
}

function ok(message) {
  notes.push(message);
}

/**
 * The hero image URLs, read out of the shared module. Parsed rather than
 * imported: the module is TypeScript, and this guard has to run as plain
 * node in CI without a loader.
 *
 * The URLs are read from the exported constants themselves, not from a
 * pattern that happens to match today's host. The hero used to be a
 * third-party photograph and is now served from /images/home/ (see
 * src/lib/heroImages.ts for why), and the rule this guard protects - "the
 * document preloads exactly the picture the page paints" - is the same rule
 * either way. A guard that only knows one host stops being a guard the day
 * the host changes.
 */
function readHeroImages() {
  const path = join(ROOT, HERO_MODULE);
  if (!existsSync(path)) {
    fail(`${HERO_MODULE} is missing - the hero image URL must have one home`);
    return null;
  }
  const source = readFileSync(path, "utf8");
  const exported = new Map();
  const constantPattern = /export const (HERO_BG_[A-Z_]+)\s*=\s*"([^"]+)"/g;
  let match;
  while ((match = constantPattern.exec(source))) {
    exported.set(match[1], match[2]);
  }
  const exportMatch = source.match(/HERO_BG_IMAGES[^\n]*=\s*\[([^\]]*)\]/);
  if (!exportMatch) {
    fail(`${HERO_MODULE} does not export HERO_BG_IMAGES as an array`);
    return null;
  }
  const listed = [...exportMatch[1].matchAll(/HERO_BG_[A-Z_]+/g)].map((m) => m[0]);
  if (!listed.length) {
    fail(`${HERO_MODULE} HERO_BG_IMAGES does not name any image`);
    return null;
  }
  const urls = listed.map((name) => exported.get(name)).filter(Boolean);
  if (urls.length !== listed.length) {
    fail(
      `${HERO_MODULE} names ${listed.join(", ")} in HERO_BG_IMAGES but ` +
        `${listed.filter((n) => !exported.has(n)).join(", ")} is not exported as a URL`,
    );
    return null;
  }
  return { urls, listed, source };
}

/** Every .html file under dist/, paired with its path. */
function htmlFiles(dir) {
  const out = [];
  const walk = (current) => {
    let entries;
    try {
      entries = readdirSync(current);
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = join(current, entry);
      let st;
      try {
        st = statSync(full);
      } catch {
        continue;
      }
      if (st.isDirectory()) walk(full);
      else if (entry.endsWith(".html")) out.push(full);
    }
  };
  walk(dir);
  return out;
}

function checkSources(hero) {
  const sectionPath = join(ROOT, HERO_SECTION);
  if (existsSync(sectionPath)) {
    const section = readFileSync(sectionPath, "utf8");
    const literal = hero.urls.find((url) => section.includes(`"${url}"`));
    if (literal) {
      fail(
        `${HERO_SECTION} contains a literal hero URL (${literal}) - it must take ` +
          `the image from ${HERO_MODULE}, or the prerendered preload and the ` +
          `painted hero will drift apart`,
      );
    } else {
      ok(`${HERO_SECTION} takes the hero image from the shared module`);
    }
    if (!/HERO_BG_IMAGES/.test(section)) {
      fail(`${HERO_SECTION} does not reference HERO_BG_IMAGES`);
    }
  } else {
    fail(`${HERO_SECTION} is missing`);
  }

  const prerenderPath = join(ROOT, PRERENDER_SOURCE);
  if (existsSync(prerenderPath)) {
    const prerender = readFileSync(prerenderPath, "utf8");
    if (!/from "\.\.\/src\/lib\/heroImages"/.test(prerender)) {
      fail(
        `${PRERENDER_SOURCE} does not import ${HERO_MODULE} - the prerender ` +
          `has to name the same URL the SPA paints`,
      );
    } else {
      ok(`${PRERENDER_SOURCE} imports the shared hero module`);
    }
    if (/preloadImage:\s*["'`]/.test(prerender)) {
      fail(
        `${PRERENDER_SOURCE} hard-codes a preload URL - it must use ` +
          `HERO_BG_IMAGES[0] so the two cannot drift`,
      );
    }
  } else {
    fail(`${PRERENDER_SOURCE} is missing`);
  }
}

function checkBuiltPages(hero) {
  const distDir = join(ROOT, DIST);
  if (!existsSync(distDir)) {
    fail(`${DIST}/ is missing - run the build before this guard`);
    return;
  }
  const files = htmlFiles(distDir);
  if (!files.length) {
    fail(`${DIST}/ carries no HTML`);
    return;
  }

  const homePath = join(distDir, "index.html");
  if (!existsSync(homePath)) {
    fail(`${DIST}/index.html is missing`);
    return;
  }
  const home = readFileSync(homePath, "utf8");

  // The homepage must preload the hero image the SPA actually paints.
  const preloadTag = home.match(
    /<link rel="preload" as="image" href="([^"]+)" fetchpriority="high"/,
  );
  if (!preloadTag) {
    fail(
      `${DIST}/index.html has no <link rel="preload" as="image" ` +
        `fetchpriority="high"> - the hero is a background-image, so without ` +
        `this the browser only learns about it after the SPA mounts`,
    );
    return;
  }
  const preloaded = preloadTag[1].replace(/&amp;/g, "&");
  const expected = hero.urls[0];
  if (preloaded !== expected) {
    fail(
      `${DIST}/index.html preloads ${preloaded} but the shared module names ` +
        `${expected} - the preload would fetch a file the page never paints`,
    );
  } else {
    ok(`the homepage preloads the hero image the SPA paints`);
  }

  // The preconnect is scoped by WHERE the hero lives.
  //
  // A third-party hero has to be warmed up: the handshake and the DNS
  // lookup are otherwise paid on the critical path, and the measurement in
  // 04-build/item-23-24-decision.md showed the third party swinging the
  // simulated Largest Contentful Paint by +/- 5,000 ms.
  //
  // A first-party hero does not: the connection is already open, so a
  // preconnect to our own host spends a header and buys nothing. Carrying
  // one is not a failure of the rule - it is dead weight in the head.
  const heroIsThirdParty = /^https?:\/\//i.test(expected);
  const preconnect = /<link rel="preconnect" href="([^"]+)"/.exec(home);
  if (heroIsThirdParty) {
    if (!preconnect) {
      fail(`${DIST}/index.html does not preconnect to the hero image origin`);
    } else {
      const origin = new URL(preconnect[1]).origin;
      const heroOrigin = new URL(expected).origin;
      if (origin !== heroOrigin) {
        fail(
          `${DIST}/index.html preconnects to ${origin} but the hero is served from ${heroOrigin}`,
        );
      } else {
        ok(`the homepage preconnects to the hero image origin`);
      }
    }
  } else if (preconnect) {
    fail(
      `${DIST}/index.html preconnects to ${preconnect[1]} but the hero is served from ` +
        `this origin - a preconnect to our own host buys nothing`,
    );
  } else {
    ok(`the hero is served from this origin, so the homepage carries no preconnect`);
  }

  // The hero only appears on the homepage. A preload on the other pages
  // would spend a handshake on pages that never ask for the image.
  let leaked = 0;
  for (const file of files) {
    if (file === homePath) continue;
    const html = readFileSync(file, "utf8");
    if (new RegExp(`rel="preload" as="image" href="${expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(html)) {
      leaked += 1;
      if (leaked <= 3) {
        fail(`${relative(distDir, file)} preloads the hero image - only the homepage shows it`);
      }
    }
  }
  if (!leaked) {
    ok(`the other ${files.length - 1} page(s) do not preload the hero image`);
  }
}

// ---------------------------------------------------------------------------
// Self-test: every rule must be able to fail.
// ---------------------------------------------------------------------------
function selfTest() {
  const cases = [];

  // Two heroes, two shapes: one served by a third party and one served by
  // this origin. The rule is the same in both cases - the document preloads
  // exactly the picture the page paints - and only the preconnect differs,
  // because only a third-party host has a handshake worth warming up.
  const thirdPartyHero = {
    urls: ["https://plus.unsplash.com/premium_photo-1?fm=jpg&q=60&w=960"],
    listed: ["HERO_BG_STROLLER"],
    source: "",
  };
  const firstPartyHero = {
    urls: ["/images/home/hero-stroller-960.webp"],
    listed: ["HERO_BG_STROLLER"],
    source: "",
  };

  const judge = (html, hero) => {
    const problems = [];
    const tag = html.match(/<link rel="preload" as="image" href="([^"]+)" fetchpriority="high"/);
    if (!tag) {
      problems.push("no preload tag");
      return problems;
    }
    const preloaded = tag[1].replace(/&amp;/g, "&");
    if (preloaded !== hero.urls[0]) problems.push("preloaded a different image");
    const preconnect = /<link rel="preconnect" href="([^"]+)"/.exec(html);
    if (/^https?:\/\//i.test(hero.urls[0])) {
      if (!preconnect) problems.push("no preconnect");
      else if (new URL(preconnect[1]).origin !== new URL(hero.urls[0]).origin) {
        problems.push("preconnects to another origin");
      }
    } else if (preconnect) {
      problems.push("preconnects to our own host");
    }
    return problems;
  };

  const thirdPartyGood = `<head>
    <link rel="preconnect" href="https://plus.unsplash.com" />
    <link rel="preload" as="image" href="https://plus.unsplash.com/premium_photo-1?fm=jpg&amp;q=60&amp;w=960" fetchpriority="high" />
  </head>`;
  const firstPartyGood = `<head>
    <link rel="preload" as="image" href="/images/home/hero-stroller-960.webp" fetchpriority="high" />
  </head>`;

  cases.push(["a preloaded third-party hero passes", judge(thirdPartyGood, thirdPartyHero).length === 0, judge(thirdPartyGood, thirdPartyHero)]);
  cases.push(["a preloaded first-party hero passes", judge(firstPartyGood, firstPartyHero).length === 0, judge(firstPartyGood, firstPartyHero)]);
  cases.push([
    "a missing preload fails",
    judge(`<head><link rel="preconnect" href="https://plus.unsplash.com" /></head>`, thirdPartyHero).length > 0,
    judge(`<head></head>`, thirdPartyHero),
  ]);
  cases.push([
    "a preload of another image fails",
    judge(thirdPartyGood.replace("premium_photo-1", "premium_photo-2"), thirdPartyHero).length > 0,
    judge(thirdPartyGood.replace("premium_photo-1", "premium_photo-2"), thirdPartyHero),
  ]);
  cases.push([
    "a preload without fetchpriority fails",
    judge(thirdPartyGood.replace(' fetchpriority="high"', ""), thirdPartyHero).length > 0,
    judge(thirdPartyGood.replace(' fetchpriority="high"', ""), thirdPartyHero),
  ]);
  cases.push([
    "a third-party hero without a preconnect fails",
    judge(`<head><link rel="preload" as="image" href="${thirdPartyHero.urls[0]}" fetchpriority="high" /></head>`, thirdPartyHero).length > 0,
    judge(`<head><link rel="preload" as="image" href="${thirdPartyHero.urls[0]}" fetchpriority="high" /></head>`, thirdPartyHero),
  ]);
  cases.push([
    "a first-party hero with a preconnect fails",
    judge(`<head><link rel="preconnect" href="https://balancebiketoddler.com" /><link rel="preload" as="image" href="${firstPartyHero.urls[0]}" fetchpriority="high" /></head>`, firstPartyHero).length > 0,
    judge(`<head><link rel="preconnect" href="https://balancebiketoddler.com" /><link rel="preload" as="image" href="${firstPartyHero.urls[0]}" fetchpriority="high" /></head>`, firstPartyHero),
  ]);
  cases.push([
    "a preconnect to another origin fails",
    judge(thirdPartyGood.replace('href="https://plus.unsplash.com"', 'href="https://example.com"'), thirdPartyHero).length > 0,
    judge(thirdPartyGood.replace('href="https://plus.unsplash.com"', 'href="https://example.com"'), thirdPartyHero),
  ]);

  // The source rules.
  const sourceJudge = (section, prerender, hero) => {
    const out = [];
    if (section.includes(`"${hero.urls[0]}"`)) out.push("literal hero URL in the section");
    if (!/from "\.\.\/src\/lib\/heroImages"/.test(prerender)) out.push("prerender does not import the module");
    if (/preloadImage:\s*["'`]/.test(prerender)) out.push("prerender hard-codes a preload URL");
    return out;
  };
  const goodSection = 'import { HERO_BG_IMAGES } from "../lib/heroImages";\nconst bgImages = HERO_BG_IMAGES;';
  const goodPrerender = 'import { HERO_BG_IMAGES } from "../src/lib/heroImages";\npreloadImage: HERO_BG_IMAGES[0],';
  cases.push(["shared sources pass", sourceJudge(goodSection, goodPrerender, firstPartyHero).length === 0, sourceJudge(goodSection, goodPrerender, firstPartyHero)]);
  cases.push([
    "a literal URL in the section fails",
    sourceJudge('const bg = "/images/home/hero-stroller-960.webp";', goodPrerender, firstPartyHero).length > 0,
    sourceJudge('const bg = "/images/home/hero-stroller-960.webp";', goodPrerender, firstPartyHero),
  ]);
  cases.push([
    "a prerender that does not import the module fails",
    sourceJudge(goodSection, "preloadImage: '/x'", firstPartyHero).length > 0,
    sourceJudge(goodSection, "preloadImage: '/x'", firstPartyHero),
  ]);
  cases.push([
    "a hard-coded preload URL fails",
    sourceJudge(goodSection, 'import { HERO_BG_IMAGES } from "../src/lib/heroImages";\npreloadImage: "/images/home/hero-stroller-960.webp",', firstPartyHero).length > 0,
    sourceJudge(goodSection, 'import { HERO_BG_IMAGES } from "../src/lib/heroImages";\npreloadImage: "/images/home/hero-stroller-960.webp",', firstPartyHero),
  ]);

  // The leak rule.
  const leakJudge = (files) => files.filter((f) => f !== "index.html" && /unsplash|hero-/.test(f)).length;
  cases.push(["a homepage-only preload passes", leakJudge(["index.html", "about.html"]) === 0, []]);
  cases.push([
    "a leaked preload fails",
    leakJudge(["index.html", "about.html with unsplash preload"]) === 1,
    [],
  ]);

  let bad = 0;
  for (const [name, good_, detail] of cases) {
    const detailText = Array.isArray(detail) && detail.length ? ` -> ${detail.join("; ")}` : "";
    console.log(`${good_ ? "ok  " : "FAIL"} ${name}${good_ ? "" : detailText}`);
    if (!good_) bad += 1;
  }
  console.log(`\n${cases.length - bad}/${cases.length} self-tests passed`);
  return bad === 0 ? 0 : 1;
}

if (process.argv.includes("--self-test")) {
  process.exit(selfTest());
}

const hero = readHeroImages();
if (hero) {
  checkSources(hero);
  checkBuiltPages(hero);
} else {
  fail(`${HERO_MODULE} could not be read`);
}

for (const note of notes) console.log(`ok   ${note}`);
if (problems.length) {
  for (const problem of problems) console.error(`FAIL ${problem}`);
  console.error(`\ncheck-hero-preload FAILED — ${problems.length} problem(s)`);
  process.exit(1);
}
console.log("check-hero-preload PASS");
