#!/usr/bin/env node
/**
 * Media URLs in the built site must be reachable, single-encoded, and traceable.
 *
 * Sixteen product covers and seven guide covers shipped pointing at store keys
 * that were never scraped. Every page still rendered: an <img> with a broken
 * src looks exactly like an <img> with a working one until someone loads it.
 * Nothing caught this because no guard ever asked whether the bytes existed —
 * check:newscovers only inspects news, and check:guidecovers checks *uniqueness*
 * (a URL can be unique and still 404).
 *
 * So this guard asserts observable facts about dist/, not intentions:
 *
 *   1. no page carries the literal `scrape_store` bucket marker — it is a
 *      storage-internal prefix, and leaking it yields /scrape_store/<key> 404s;
 *   2. no page carries a double-encoded sequence (`%25XX`) — the same URL flows
 *      through card -> page.image -> og:image, so re-encoding a segment that is
 *      already escaped silently breaks it;
 *   3. every distinct store-origin image URL returns 200 (network probe,
 *      concurrent, browser UA because Cloudflare 403s default UAs);
 *   4. every guide cover's ASIN resolves to a real product record, so a cover
 *      cannot point at a `Rank_Similar_` key that was invented rather than
 *      scraped.
 *
 * Checks 1-2 and 4 are offline. Check 3 needs the network; set
 * MEDIA_PROBE=0 to skip it (offline CI), which downgrades those findings to a
 * printed warning rather than a silent pass.
 *
 * Run: npm run check:media   (after `npm run build`)
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);

const DIST = resolve(process.env.CHECK_MEDIA_ROOT || "dist");
const CMS = (process.env.CMS_BASE || "https://store.balancebiketoddler.com").replace(/\/+$/, "");
const STORE_ORIGIN = (process.env.STORE_ORIGIN || "https://store.balancebiketoddler.com").replace(/\/+$/, "");
const TOKEN = String(process.env.CMS_ADMIN_ALL_TOKEN || "").trim();
const PROBE = String(process.env.MEDIA_PROBE ?? "1") !== "0";
const CONCURRENCY = 16;
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36";

const problems = [];
const warnings = [];
const fail = (where, msg) => problems.push(`${where} — ${msg}`);

if (!existsSync(DIST)) {
  console.error(JSON.stringify({ ok: false, failed: ["dist missing — run npm run build first"] }, null, 2));
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Walk dist for HTML.
// ---------------------------------------------------------------------------
function walkHtml(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) walkHtml(p, out);
    else if (entry.name.endsWith(".html")) out.push(p);
  }
  return out;
}
const htmlFiles = walkHtml(DIST);
if (htmlFiles.length === 0) fail("dist", "no HTML found — prerender produced nothing");

const IMAGE_RE = /https:\/\/store\.balancebiketoddler\.com\/[^\s"'<>\\)]+?\.(?:jpe?g|png|webp|avif)/gi;
const mediaPaths = new Map(); // url -> [route, ...]

for (const file of htmlFiles) {
  const rel = file.slice(DIST.length + 1);
  const html = readFileSync(file, "utf8");
  const route = "/" + rel.replace(/\.html$/, "").replace(/(^|\/)index$/, "");

  // 1. Bucket marker leaked into markup.
  const markerHits = (html.match(/scrape_store/gi) || []).length;
  if (markerHits > 0) fail(route, `contains the storage bucket marker 'scrape_store' ${markerHits}x`);

  // 2. Double-encoded sequences.
  const dblHits = [...html.matchAll(/%25[0-9a-f]{2}/gi)];
  if (dblHits.length > 0) {
    const samples = [...new Set(dblHits.map((m) => m[0]))].slice(0, 4).join(", ");
    fail(route, `double-encoded sequence(s): ${samples}`);
  }

  for (const match of html.matchAll(IMAGE_RE)) {
    const url = match[0];
    if (!mediaPaths.has(url)) mediaPaths.set(url, []);
    mediaPaths.get(url).push(route);
  }
}

// Sitemap carries its own <image:loc> copies; a 404 there is still a 404.
const sitemapPath = join(DIST, "sitemap.xml");
if (existsSync(sitemapPath)) {
  const sm = readFileSync(sitemapPath, "utf8");
  for (const match of sm.matchAll(/<image:loc>([^<]+)<\/image:loc>/g)) {
    const url = match[1].trim();
    if (!/^https:\/\/store\.balancebiketoddler\.com\//.test(url)) continue;
    if (!mediaPaths.has(url)) mediaPaths.set(url, []);
    if (!mediaPaths.get(url).includes("sitemap.xml")) mediaPaths.get(url).push("sitemap.xml");
  }
}

// ---------------------------------------------------------------------------
// 3. Probe every distinct store image URL.
// ---------------------------------------------------------------------------
async function probe(url) {
  try {
    const { stdout } = await run("curl", [
      "-s", "--noproxy", "*", "-o", "/dev/null", "-w", "%{http_code}",
      "-A", UA, url,
    ], { timeout: 30_000 });
    return String(stdout || "").trim();
  } catch {
    return "ERR";
  }
}

const urls = [...mediaPaths.keys()];
const codes = new Map();

if (PROBE && urls.length > 0) {
  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    const batch = urls.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(async (u) => [u, await probe(u)]));
    for (const [u, c] of results) codes.set(u, c);
  }
  for (const [url, code] of codes) {
    if (code === "200") continue;
    const routes = [...new Set(mediaPaths.get(url) || [])];
    fail(`dist media ${code}`, `${url}\n      referenced by ${routes.length} page(s): ${routes.slice(0, 4).join(", ")}`);
  }
} else if (!PROBE && urls.length > 0) {
  warnings.push(`MEDIA_PROBE=0 — skipped reachability check for ${urls.length} store image URL(s)`);
}

// ---------------------------------------------------------------------------
// 4. Guide covers must trace to a real product record.
// ---------------------------------------------------------------------------
async function fetchCollection(name) {
  const headers = ["-H", "Accept: application/json"];
  if (TOKEN) headers.push("-H", `x-cms-admin-token: ${TOKEN}`);
  const { stdout } = await run("curl", [
    "-s", "--noproxy", "*", "-A", UA, ...headers,
    `${CMS}/api/cms/${name}?all=1`,
  ], { timeout: 60_000, maxBuffer: 64 * 1024 * 1024 });
  const parsed = JSON.parse(stdout);
  return Array.isArray(parsed.data) ? parsed.data : [];
}

function dirKey(raw) {
  let t = decodeURIComponent(String(raw || "").trim()).replace(/\\/g, "/");
  const marker = "scrape_store/";
  const i = t.indexOf(marker);
  if (i >= 0) t = t.slice(i + marker.length);
  t = t.replace(/^https?:\/\/[^/]+\//, "").replace(/^\.+\/+/, "");
  const m = /^(.+?\/images)\//.exec(t);
  return m ? m[1] : null;
}

try {
  const [products, guides] = await Promise.all([fetchCollection("products"), fetchCollection("guides")]);
  const productDirs = new Set();
  for (const r of products) {
    for (const field of ["imageUrl", "productImageUrls", "galleryUrls", "featureImageUrls"]) {
      const v = r[field];
      const list = Array.isArray(v) ? v : typeof v === "string" ? [v] : [];
      for (const u of list) {
        const d = dirKey(u);
        if (d) productDirs.add(d);
      }
    }
  }
  const published = guides.filter((g) => g.status === "published" && String(g.imageUrl || "").trim());
  for (const g of published) {
    const d = dirKey(g.imageUrl);
    if (!d) {
      fail(`guide ${g.id}`, `cover has no /images/ segment: ${g.imageUrl}`);
    } else if (!productDirs.has(d)) {
      fail(`guide ${g.id}`, `cover points at a store key no product owns:\n      ${g.imageUrl}`);
    }
  }
  warnings.push(`traced ${published.length} guide cover(s) to ${productDirs.size} product image dir(s)`);
} catch (err) {
  fail("cms", `could not verify guide cover provenance: ${err.message}`);
}

// ---------------------------------------------------------------------------
if (problems.length) {
  console.error(`check:media FAILED — ${problems.length} finding(s)`);
  for (const p of problems) console.error("  - " + p);
  for (const w of warnings) console.error("  · " + w);
  process.exit(1);
}
console.log(
  `check:media OK — ${htmlFiles.length} page(s), ${urls.length} store image URL(s) ` +
    `(${PROBE ? "all 200" : "reachability skipped"}), 0 leaked markers, 0 double-encodes`,
);
for (const w of warnings) console.log("  · " + w);