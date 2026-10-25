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
 * the English hubs (/guides, /news) declared none, and the homepage declared
 * its currency editions in the SPA but not in the static HTML. Both were
 * invisible in review - a link tag that is missing looks exactly like a link
 * tag that is fine.
 *
 * This guard reads the built dist/ and checks:
 *   1. every route that has a Chinese edition declares en / zh / x-default,
 *      and the Chinese edition declares the same set;
 *   2. the two editions point at each other - same URLs on both sides;
 *   3. the homepage declares its currency editions in the static HTML too;
 *   4. the SPA bundle still contains the rule that emits them, so a later
 *      change cannot quietly drop the client-side half.
 *
 * Run: npm run check:hreflang   (after `npm run build`)
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const DIST = resolve(process.env.CHECK_HREFLANG_ROOT || "dist");
const SITE = "https://balancebiketoddler.com";
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
  if (!zhFile) continue; // no Chinese edition for this route
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

// The homepage prices the catalogue in three currencies, so it has three
// regional editions plus an x-default. The SPA declared them; the static HTML
// used not to.
const homeFile = join(DIST, "index.html");
if (existsSync(homeFile)) {
  const homeAlts = alternates(homeFile);
  for (const lang of ["en-US", "en-GB", "en-DE", "x-default"]) {
    if (!homeAlts.has(lang)) {
      fail("/", `the homepage does not declare hreflang="${lang}" in the static HTML — only the SPA had it`);
    }
  }
  for (const [lang, url] of homeAlts) {
    if (!url.startsWith(SITE)) fail("/", `hreflang="${lang}" points outside the site: "${url}"`);
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
      checked: ["English/Chinese reciprocity", "homepage currency editions", "SPA rule"],
      problems,
    },
    null,
    2,
  ),
);
process.exit(ok ? 0 : 1);
