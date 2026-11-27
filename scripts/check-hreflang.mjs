#!/usr/bin/env node
/**
 * hreflang has to run in both directions, and it has to be in the STATIC HTML.
 *
 * The site ships an English and a Chinese edition of every guide and news
 * route (/zh/<english path>). Both editions are self-canonical and point at
 * each other, which is the only shape Google accepts: an hreflang annotation
 * that only runs one way is ignored, and an annotation that exists only after
 * hydration is one no crawler ever sees.
 *
 * That is not hypothetical. The Chinese hubs declared their alternates while
 * the English hubs (/guides, /news) declared none. The homepage once declared
 * hreflang for its three currency views (?currency=USD|GBP|EUR) — but those
 * URLs serve the same HTML whose canonical points back at "/", so Google was
 * being pointed at targets that canonicalize elsewhere, the anti-pattern it
 * ignores. Both were invisible in review - a link tag that is missing (or
 * that points at the wrong thing) looks exactly like a link tag that is fine.
 *
 * This guard reads the built dist/ and checks:
 *   1. every route that has a Chinese edition declares en / zh / x-default,
 *      and the Chinese edition declares the same set;
 *   2. the two editions point at each other - same URLs on both sides;
 *   3. no page anywhere declares an hreflang that carries a query string
 *      (the removed currency cluster), and the homepage declares none at all;
 *   4. the SPA bundle still contains the rule that emits them, so a later
 *      change cannot quietly drop the client-side half - and no longer
 *      contains the removed ?currency= cluster.
 *
 * Run: npm run check:hreflang   (after `npm run build`)
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const DIST = resolve(process.env.CHECK_HREFLANG_ROOT || "dist");
// Follow the deployment origin so the guard stays valid across a domain migration.
const SITE = (process.env.SITE_ORIGIN || "https://balancebiketoddler.com").replace(/\/$/, "");
const WANT = ["en", "zh", "x-default"];

const problems = [];
const fail = (where, msg) => problems.push(`${where} — ${msg}`);

if (!existsSync(DIST)) {
  console.error(JSON.stringify({ ok: false, failed: ["dist missing — run npm run build first"] }, null, 2));
  process.exit(1);
}

/**
 * Every route a directory holds, keyed by its SITE path.
 *
 * The key has to be the full path ("/guides/beginner/x"), not the path
 * relative to the directory ("/beginner/x"): the Chinese edition lives under
 * a different directory but has to be paired with the English one, and a
 * relative key would silently pair the wrong files.
 */
function routes(dir, routePrefix) {
  const out = new Map();
  if (!existsSync(dir)) return out;
  const walk = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name.endsWith(".html")) {
        let rel = full.slice(dir.length + 1).split("\\").join("/");
        if (rel === "index.html") rel = "";
        else if (rel.endsWith("/index.html")) rel = rel.slice(0, -"index.html".length);
        else if (rel.endsWith(".html")) rel = rel.slice(0, -".html".length);
        out.set(`${routePrefix.replace(/\/$/, "")}/${rel}`.replace(/\/+$/, "") || "/", full);
      }
    }
  };
  walk(dir);
  return out;
}

/** The hreflang declarations of a document: { en: url, zh: url, ... }. */
function alternates(file) {
  const html = readFileSync(file, "utf8");
  const out = new Map();
  for (const m of html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"\s*\/?>/g)) {
    out.set(m[1], m[2]);
  }
  return out;
}

/**
 * How many rel="alternate" tags a document carries, duplicates included.
 *
 * alternates() is a Map, so it silently collapses a route that lists the same
 * hreflang twice — which is exactly what happened when the SPA appended its own
 * set on top of the prerendered one. Counting the raw tags is what makes that
 * visible.
 */
function alternateTagCount(file) {
  const html = readFileSync(file, "utf8");
  return [...html.matchAll(/<link rel="alternate"[^>]*hreflang="[^"]+"/g)].length;
}

// The English and Chinese article families live in the same place.
const en = new Map([...routes(join(DIST, "guides"), "/guides"), ...routes(join(DIST, "news"), "/news")]);
en.set("/guides", join(DIST, "guides.html"));
en.set("/news", join(DIST, "news.html"));
const zh = new Map([
  ...routes(join(DIST, "zh", "guides"), "/zh/guides"),
  ...routes(join(DIST, "zh", "news"), "/zh/news"),
]);
zh.set("/zh/guides", join(DIST, "zh", "guides.html"));
zh.set("/zh/news", join(DIST, "zh", "news.html"));

let pairs = 0;
for (const [route, file] of en) {
  const zhRoute = `/zh${route}`;
  const zhFile = zh.get(zhRoute);
  if (!zhFile) {
    // No Chinese edition of this route exists, so nothing may claim one. This
    // is the check that was missing, and the reason a real defect survived
    // several rounds of green guards: the old loop simply `continue`d here, so
    // the 11 English routes with no /zh file were never inspected at all — and
    // one of them was shipping hreflang at build time (the SPA emitted it from
    // the URL root, hid the static "no alternates" fact from every static
    // guard, and only a browser probe could see it).
    const strayAlts = alternates(file);
    if (strayAlts.size > 0) {
      const listed = [...strayAlts].map(([lang, url]) => `${lang}=${url}`).join(", ");
      fail(
        route,
        `declares ${strayAlts.size} hreflang alternate(s) (${listed}) but no /zh edition of this route was built — every target is a 404`,
      );
    }
    continue;
  }
  pairs += 1;

  const enAlts = alternates(file);
  const zhAlts = alternates(zhFile);
  const rel = route === "/" ? "/" : route;

  for (const lang of WANT) {
    if (!enAlts.has(lang)) {
      fail(rel, `the English page does not declare hreflang="${lang}" — the annotation only runs one way`);
    }
    if (!zhAlts.has(lang)) {
      fail(zhRoute, `the Chinese page does not declare hreflang="${lang}"`);
    }
  }
  for (const lang of WANT) {
    if (!enAlts.has(lang) || !zhAlts.has(lang)) continue;
    if (enAlts.get(lang) !== zhAlts.get(lang)) {
      fail(
        rel,
        `hreflang="${lang}" disagrees between the editions: "${enAlts.get(lang)}" vs "${zhAlts.get(lang)}"`,
      );
    }
  }
  // The values must point at the two editions of THIS route.
  const enUrl = enAlts.get("en");
  const zhUrl = enAlts.get("zh");
  if (enUrl && !enUrl.endsWith(route)) fail(rel, `hreflang="en" points at "${enUrl}", not this route`);
  if (zhUrl && !zhUrl.endsWith(zhRoute)) fail(rel, `hreflang="zh" points at "${zhUrl}", not the Chinese edition`);
}

// Duplicate declarations: a route may list each hreflang once.
//
// alternates() is keyed by language, so a second tag for the same language is
// invisible to every reciprocity check above. That is precisely how the SPA's
// hydration bug hid: the prerendered tags carry no data- attribute, the SPA's
// cleanup selector only matched its own marked nodes, so hydrating APPENDED a
// duplicate set (measured: 6 tags / 3 pairs on /guides and on a translated
// article) and the copies disagreed about the origin. Google reports duplicate
// hreflang for one language as an error, so this has to be caught statically.
for (const [route, file] of [...en, ...zh]) {
  const declared = alternates(file).size;
  const tags = alternateTagCount(file);
  if (tags > declared) {
    fail(route, `${tags} hreflang tag(s) for ${declared} language(s) — duplicate declarations for the same language`);
  }
}

// The SPA's copy of "which routes have a Chinese edition" must equal the set
// the prerender actually built.
//
// This is the assertion that was missing, and its absence let a real defect
// ship: the SPA derived translations from the URL root alone, so it declared
// alternates for every guides/news route — topic channel pages, news channel
// pages, the whole guides category axis — none of which has a /zh file. The
// bundle check further down only grepped for the string "x-default", so a
// "right rule, wrong set" bug looked identical to a healthy build.
//
// The two sides are now generated from one place (dist/data/zh-routes.json,
// written by the prerender, mirrored into src/lib/zhRoutes.generated.ts by
// scripts/sync_zh_routes_to_front.mjs). This compares them anyway, because a
// generated file that was not regenerated after a build is a silent drift.
const manifestFile = join(DIST, "data", "zh-routes.json");
const generatedModule = resolve("src/lib/zhRoutes.generated.ts");
if (!existsSync(manifestFile)) {
  fail("zh-routes", "dist/data/zh-routes.json is missing — run `npm run build`");
} else if (!existsSync(generatedModule)) {
  fail("zh-routes", "src/lib/zhRoutes.generated.ts is missing — run `node scripts/sync_zh_routes_to_front.mjs`");
} else {
  const built = JSON.parse(readFileSync(manifestFile, "utf8"));
  const source = readFileSync(generatedModule, "utf8");
  const listed = new Set([...source.matchAll(/"(\/zh\/[^"]*)"/g)].map((m) => m[1]));
  const builtSet = new Set(built);
  for (const route of builtSet) {
    if (!listed.has(route)) {
      fail("zh-routes", `the prerender built ${route} but src/lib/zhRoutes.generated.ts does not list it — the SPA would not offer its Chinese edition`);
    }
  }
  for (const route of listed) {
    if (!builtSet.has(route)) {
      fail("zh-routes", `src/lib/zhRoutes.generated.ts lists ${route} but no such Chinese edition was built — the SPA would advertise a 404`);
    }
  }
}

// The homepage declares no alternates: it has no translated edition, and its
// currency views are the same HTML canonicalizing back to "/". The cluster
// that used to sit here pointed hreflang at non-canonical targets, which
// Google ignores - removed 2026-10-25.
const homeFile = join(DIST, "index.html");
if (existsSync(homeFile)) {
  const homeAlts = alternates(homeFile);
  if (homeAlts.size > 0) {
    const listed = [...homeAlts].map(([lang, url]) => `${lang}=${url}`).join(", ");
    fail("/", `the homepage declares ${homeAlts.size} hreflang alternate(s) (${listed}) — it has no translated or currency edition to point at`);
  }
}

// No page may declare an hreflang that carries a query string. Query-param
// "editions" are the anti-pattern that was removed from the homepage; this
// keeps it from coming back on any other route. Every target must also be
// same-origin: a cross-origin hreflang is ignored just the same.
for (const [route, file] of [...en, ...zh]) {
  for (const [lang, url] of alternates(file)) {
    if (url !== SITE && !url.startsWith(`${SITE}/`)) {
      fail(route, `hreflang="${lang}" points outside the site: "${url}"`);
    }
    if (url.includes("?")) {
      fail(route, `hreflang="${lang}" points at a query-string URL "${url}" — query-param editions are not valid hreflang targets`);
    }
  }
}

// The client-side half has to keep emitting the same set, or the browser and
// the crawler disagree about which pages are translations of each other.
const assets = join(DIST, "assets");
if (existsSync(assets)) {
  const appChunk = readdirSync(assets).find((f) => f.startsWith("index-") && f.endsWith(".js"));
  if (appChunk) {
    const code = readFileSync(join(assets, appChunk), "utf8");
    if (!code.includes("x-default")) {
      fail("spa", "the SPA bundle no longer contains the x-default hreflang rule");
    }
    if (code.includes("?currency=")) {
      fail("spa", "the SPA bundle still contains the removed ?currency= hreflang cluster");
    }
  } else {
    fail("spa", "the application bundle was not found in dist/assets");
  }
}

const ok = problems.length === 0;
console.log(
  JSON.stringify(
    {
      ok,
      routePairsChecked: pairs,
      checked: ["English/Chinese reciprocity", "homepage declares no alternates", "no query-string hreflang", "SPA rule"],
      problems,
    },
    null,
    2,
  ),
);
process.exit(ok ? 0 : 1);
