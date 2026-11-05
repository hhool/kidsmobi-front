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
 */
function readHeroImages() {
  const path = join(ROOT, HERO_MODULE);
  if (!existsSync(path)) {
    fail(`${HERO_MODULE} is missing - the hero image URL must have one home`);
    return null;
  }
  const source = readFileSync(path, "utf8");
  const urls = [];
  const pattern = /https:\/\/plus\.unsplash\.com\/[^"'\s]+/g;
  let match;
  while ((match = pattern.exec(source))) {
    urls.push(match[0]);
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
    if (/https:\/\/plus\.unsplash\.com/.test(section)) {
      fail(
        `${HERO_SECTION} contains a literal unsplash URL - it must take the ` +
          `image from ${HERO_MODULE}, or the prerendered preload and the ` +
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
    if (/preloadImage:\s*["']https/.test(prerender)) {
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

  if (!/<link rel="preconnect" href="https:\/\/plus\.unsplash\.com"/.test(home)) {
    fail(`${DIST}/index.html does not preconnect to the hero image origin`);
  } else {
    ok(`the homepage preconnects to the hero image origin`);
  }

  // The hero only appears on the homepage. A preload on the other pages
  // would spend a third-party handshake on pages that never ask for it.
  let leaked = 0;
  for (const file of files) {
    if (file === homePath) continue;
    const html = readFileSync(file, "utf8");
    if (/rel="preload" as="image" href="https:\/\/plus\.unsplash\.com/.test(html)) {
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

  const fakeHero = {
    urls: ["https://plus.unsplash.com/premium_photo-1?fm=jpg&q=60&w=960"],
    listed: ["HERO_BG_STROLLER"],
    source: "",
  };

  // The rule under test: does the homepage preload the URL the SPA paints?
  const judge = (html, hero) => {
    const problems = [];
    const tag = html.match(/<link rel="preload" as="image" href="([^"]+)" fetchpriority="high"/);
    if (!tag) {
      problems.push("no preload tag");
      return problems;
    }
    const preloaded = tag[1].replace(/&amp;/g, "&");
    if (preloaded !== hero.urls[0]) problems.push("preloaded a different image");
    if (!/<link rel="preconnect" href="https:\/\/plus\.unsplash\.com"/.test(html)) {
      problems.push("no preconnect");
    }
    return problems;
  };

  const good = `<head>
    <link rel="preconnect" href="https://plus.unsplash.com" />
    <link rel="preload" as="image" href="https://plus.unsplash.com/premium_photo-1?fm=jpg&amp;q=60&amp;w=960" fetchpriority="high" />
  </head>`;

  cases.push(["a preloaded hero passes", judge(good, fakeHero).length === 0, judge(good, fakeHero)]);
  cases.push([
    "a missing preload fails",
    judge(`<head><link rel="preconnect" href="https://plus.unsplash.com" /></head>`, fakeHero).length > 0,
    judge(`<head></head>`, fakeHero),
  ]);
  cases.push([
    "a preload of another image fails",
    judge(good.replace("premium_photo-1", "premium_photo-2"), fakeHero).length > 0,
    judge(good.replace("premium_photo-1", "premium_photo-2"), fakeHero),
  ]);
  cases.push([
    "a preload without fetchpriority fails",
    judge(good.replace(' fetchpriority="high"', ""), fakeHero).length > 0,
    judge(good.replace(' fetchpriority="high"', ""), fakeHero),
  ]);

  // The source rules.
  const sourceJudge = (section, prerender) => {
    const out = [];
    if (/https:\/\/plus\.unsplash\.com/.test(section)) out.push("literal URL in the section");
    if (!/from "\.\.\/src\/lib\/heroImages"/.test(prerender)) out.push("prerender does not import the module");
    if (/preloadImage:\s*["']https/.test(prerender)) out.push("prerender hard-codes a preload URL");
    return out;
  };
  const goodSection = 'import { HERO_BG_IMAGES } from "../lib/heroImages";\nconst bgImages = HERO_BG_IMAGES;';
  const goodPrerender = 'import { HERO_BG_IMAGES } from "../src/lib/heroImages";\npreloadImage: HERO_BG_IMAGES[0],';
  cases.push(["shared sources pass", sourceJudge(goodSection, goodPrerender).length === 0, sourceJudge(goodSection, goodPrerender)]);
  cases.push([
    "a literal URL in the section fails",
    sourceJudge('const bg = "https://plus.unsplash.com/x";', goodPrerender).length > 0,
    sourceJudge('const bg = "https://plus.unsplash.com/x";', goodPrerender),
  ]);
  cases.push([
    "a prerender that does not import the module fails",
    sourceJudge(goodSection, "preloadImage: 'https://x'").length > 0,
    sourceJudge(goodSection, "preloadImage: 'https://x'"),
  ]);
  cases.push([
    "a hard-coded preload URL fails",
    sourceJudge(goodSection, 'import { HERO_BG_IMAGES } from "../src/lib/heroImages";\npreloadImage: "https://plus.unsplash.com/x",').length > 0,
    sourceJudge(goodSection, 'import { HERO_BG_IMAGES } from "../src/lib/heroImages";\npreloadImage: "https://plus.unsplash.com/x",'),
  ]);

  // The leak rule.
  const leakJudge = (files) => files.filter((f) => f !== "index.html" && /unsplash/.test(f)).length;
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
