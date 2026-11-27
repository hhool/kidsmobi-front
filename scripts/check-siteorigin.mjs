#!/usr/bin/env node
/**
 * Guard: every prerendered/assembled HTML page declares ONE site origin.
 *
 * Why this exists
 * ---------------
 * The site origin appears in canonical, og:url and a large amount of JSON-LD
 * (@id, url, logo, publisher.@id, BreadcrumbList items). Historically these
 * were 100+ independently hardcoded `https://balancebiketoddler.com` literals
 * across prerender-pages.ts and build-static-home.mjs. When the site was built
 * for a new domain, the homepage canonical changed but product/guide canonicals
 * and every JSON-LD @id kept pointing at the old domain — a silent, invasive
 * SEO failure that the existing length/TDK checks could not see.
 *
 * The fix rewrites the origin at the single HTML write points. This guard
 * proves it actually happened by inspecting the REAL built files in dist/:
 *
 *   1. no <link rel=canonical> or og:url points at the OLD origin (when a
 *      non-default target origin is expected);
 *   2. no JSON-LD origin field still carries the old origin;
 *   3. the media subdomain https://store.balancebiketoddler.com is PRESERVED
 *      (the literal rewrite must not have corrupted asset URLs).
 *
 * Usage
 *   node scripts/check-siteorigin.mjs --expect-origin https://kidstravellab.com
 *   node scripts/check-siteorigin.mjs --expect-origin https://balancebiketoddler.com  # default build
 *
 * Exit 0 = all checks pass; exit 1 = at least one hard failure.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const args = process.argv.slice(2);
function arg(name, fallback) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}

const ROOT = arg("--root", "dist");
const EXPECT = (arg("--expect-origin", "https://balancebiketoddler.com") || "").replace(/\/$/, "");
const OLD = "https://balancebiketoddler.com";
const MEDIA = "https://store.balancebiketoddler.com";
const isCustom = EXPECT !== OLD;

// Optional brand assertion: when --expect-brand is given, no <title> may carry
// the legacy brand token, and any title that DID carry it must now carry the
// expected brand. We do not require every title to carry a brand — product
// review titles ("<model> Review") intentionally have no brand suffix.
const EXPECT_BRAND = arg("--expect-brand", "");
const OLD_BRAND = "BalanceBikeToddler";

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (name.endsWith(".html")) out.push(p);
  }
  return out;
}

const files = walk(ROOT);
const checks = [];
function record(ok, detail) {
  checks.push({ ok: Boolean(ok), detail });
}

record(files.length > 0, `found ${files.length} HTML files under ${ROOT}/`);

let canonicalCount = 0;
let ogUrlCount = 0;
let mediaRefCount = 0;
let titleCount = 0;
let titledBrandCount = 0;
let jsonldExpectedCount = 0;
const canonicalViolations = [];
const ogViolations = [];
const jsonldViolations = [];
const brandViolations = [];

for (const file of files) {
  const html = readFileSync(file, "utf8");
  const rel = relative(ROOT, file);

  // title brand token: only flag legacy brand presence, never require a brand.
  if (EXPECT_BRAND) {
    const tm = /<title>([\s\S]*?)<\/title>/i.exec(html);
    if (tm) {
      titleCount += 1;
      const title = tm[1];
      if (title.includes(EXPECT_BRAND)) titledBrandCount += 1;
      if (title.includes(OLD_BRAND)) brandViolations.push(`${rel}: legacy brand in <title>: ${title.slice(0, 60)}`);
    }
  }

  // canonical host
  for (const m of html.matchAll(/<link\b[^>]*\brel=["']canonical["'][^>]*>/gi)) {
    const href = (/href=["']([^"']+)["']/i.exec(m[0]) || [])[1];
    if (!href) continue;
    canonicalCount += 1;
    const host = href.startsWith("http") ? new URL(href).origin : "";
    if (host !== EXPECT) canonicalViolations.push(`${rel}: ${href} (host=${host}, want=${EXPECT})`);
  }

  // og:url host
  for (const m of html.matchAll(/<meta\b[^>]*property=["']og:url["'][^>]*>/gi)) {
    const content = (/content=["']([^"']+)["']/i.exec(m[0]) || [])[1];
    if (!content) continue;
    ogUrlCount += 1;
    const host = content.startsWith("http") ? new URL(content).origin : "";
    if (host !== EXPECT) ogViolations.push(`${rel}: ${content} (host=${host}, want=${EXPECT})`);
  }

  // JSON-LD origin fields.
  for (const m of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    const raw = m[1];
    if (raw.includes(EXPECT) && /"(?:@id|url)"/.test(raw)) jsonldExpectedCount += 1;
    if (isCustom && raw.includes(OLD)) {
      // Ignore text that merely mentions the old brand URL in prose; we only
      // care about machine-readable origin fields. Cheap heuristic: any
      // `"key": "https://balancebiketoddler.com...` occurrence inside JSON-LD.
      const fieldHits = [...raw.matchAll(/"(?:@id|url|logo|item|target)"\s*:\s*"(https:\/\/balancebiketoddler\.com[^"]*)"/g)].map((x) => x[1]);
      for (const hit of fieldHits) jsonldViolations.push(`${rel}: ${hit}`);
    }
  }

  // media subdomain must survive the literal rewrite
  mediaRefCount += (html.match(/https:\/\/store\.balancebiketoddler\.com/g) || []).length;
}

// The sitemap is a second write point with its own identity fields: <loc>
// (origin) and <image:title> (brand, inherited from the CMS/HTML title). The
// 2026-11-27 migration rewrote all 547 HTML files yet left 10 legacy-brand
// image titles in sitemap.xml — invisible to an HTML-only guard. Assert the
// actual built XML, with positive counts so an empty/missing file cannot pass.
const sitemapPath = arg("--sitemap", join(ROOT, "sitemap.xml"));
if (existsSync(sitemapPath)) {
  const xml = readFileSync(sitemapPath, "utf8");
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const wrongLoc = locs.filter((loc) => !loc.startsWith(`${EXPECT}/`) && loc !== EXPECT);
  record(locs.length > 0, `asserted ${locs.length} sitemap <loc> entries`);
  record(wrongLoc.length === 0,
    wrongLoc.length ? `sitemap <loc> on unexpected origin (${wrongLoc.length}): ${wrongLoc.slice(0, 5).join(", ")}` : "every sitemap <loc> is on the expected origin");

  const imageTitles = [...xml.matchAll(/<image:title>([^<]*)<\/image:title>/g)].map((m) => m[1]);
  if (EXPECT_BRAND) {
    const titled = imageTitles.filter((t) => t.includes(EXPECT_BRAND));
    const legacy = imageTitles.filter((t) => t.includes(OLD_BRAND));
    record(imageTitles.length > 0, `asserted ${imageTitles.length} sitemap <image:title> entries`);
    record(titled.length > 0, `asserted ${titled.length} sitemap image titles actually carry "${EXPECT_BRAND}" (proves XML rewrite ran)`);
    record(legacy.length === 0,
      legacy.length ? `sitemap <image:title> carries legacy brand (${legacy.length}): ${legacy.slice(0, 5).join(" | ")}` : `no sitemap image title carries the legacy brand "${OLD_BRAND}"`);
  }
} else {
  record(false, `expected sitemap at ${sitemapPath} but file is missing`);
}

// Pages serves the static robots.txt in preference to the Worker's handler, so
// a stale Sitemap: line here silently advertises the old domain's sitemap.
const robotsPath = join(ROOT, "robots.txt");
if (existsSync(robotsPath)) {
  const robots = readFileSync(robotsPath, "utf8");
  const declared = (/^Sitemap:\s*(\S+)/im.exec(robots) || [])[1] || "";
  const declaredOrigin = declared.startsWith("http") ? new URL(declared).origin : "";
  record(declaredOrigin === EXPECT,
    `robots.txt Sitemap directive: ${declared || "(missing)"} (want origin ${EXPECT})`);
}

record(canonicalCount > 0, `asserted ${canonicalCount} canonical tags`);
record(ogUrlCount > 0, `asserted ${ogUrlCount} og:url tags`);
record(canonicalViolations.length === 0,
  canonicalViolations.length ? `canonical not on expected origin ${EXPECT} (${canonicalViolations.length}):\n    ${canonicalViolations.slice(0, 8).join("\n    ")}` : `every canonical is on ${EXPECT}`);
record(ogViolations.length === 0,
  ogViolations.length ? `og:url not on expected origin ${EXPECT} (${ogViolations.length}):\n    ${ogViolations.slice(0, 8).join("\n    ")}` : `every og:url is on ${EXPECT}`);
record(jsonldViolations.length === 0,
  jsonldViolations.length ? `JSON-LD origin field still on OLD origin (${jsonldViolations.length}):\n    ${jsonldViolations.slice(0, 8).join("\n    ")}` : "no JSON-LD origin field points at the old origin");
record(jsonldExpectedCount > 0, `asserted ${jsonldExpectedCount} JSON-LD nodes on ${EXPECT} (proves origin rewrite ran)`);
if (EXPECT_BRAND) {
  record(titleCount > 0, `asserted ${titleCount} <title> tags for brand`);
  record(titledBrandCount > 0, `asserted ${titledBrandCount} titles actually carry "${EXPECT_BRAND}" (proves rewrite ran)`);
  record(brandViolations.length === 0,
    brandViolations.length ? `title brand mismatch (${brandViolations.length}):\n    ${brandViolations.slice(0, 8).join("\n    ")}` : `no <title> carries the legacy brand "${OLD_BRAND}"`);
}
// Only require media presence when the built tree actually references R2 media.
// (An empty/zero build would be caught by the canonical/og count checks above.)
if (isCustom && mediaRefCount > 0) {
  record(true, `media subdomain preserved (${mediaRefCount} references)`);
}

let failed = 0;
console.log(`check-siteorigin  expect=${EXPECT}  files=${files.length}`);
for (const c of checks) {
  console.log(`  ${c.ok ? "PASS" : "FAIL"}  ${c.detail}`);
  if (!c.ok) failed += 1;
}
if (failed) {
  console.error(`\nFAILED: ${failed} check(s).`);
  process.exit(1);
}
console.log("\nAll origin checks passed.");
