#!/usr/bin/env node
/**
 * Repoints every article cover at its ORIGINAL image (no composites).
 *
 * History: covers used to be 800x800 WebP composites - the source picture
 * scaled to fill a square canvas with a blurred mirror of its own edge
 * padding the short side (scripts/publish-article-covers.py). That is
 * "processing" the artwork: 53 of the 65 sources are not square, so most
 * covers shipped padded bands, and the earlier square-crop pass had already
 * destroyed up to 39% of some pictures inside the file.
 *
 * The decision (2026-10-25): stop processing. Article covers now point
 * straight at the original artwork, exactly like the product pages do -
 * product cards and the product detail viewport hotlink the store media
 * URLs instead of shipping derived files. Same rule here: imageUrl becomes
 * the original URL recorded in scripts/article-cover-sources.json, and the
 * page frames the original with object-contain (never cropped).
 *
 * Only `imageUrl` is written; every other field on the record is passed back
 * untouched (the CMS save endpoint replaces the record).
 *
 * Usage:
 *   CMS_ADMIN_ALL_TOKEN=<token> node scripts/set-article-cover-originals.mjs --dry-run
 *   CMS_ADMIN_ALL_TOKEN=<token> node scripts/set-article-cover-originals.mjs --apply
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APPLY = process.argv.includes("--apply");
const API_BASE = (process.env.CMS_API_BASE || "https://store.balancebiketoddler.com").replace(/\/+$/, "");
const SITE_BASE = (process.env.SEO_SITE_BASE_URL || "https://balancebiketoddler.com").replace(/\/+$/, "");
const TOKEN = String(process.env.CMS_ADMIN_ALL_TOKEN || "").trim();
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const sources = JSON.parse(readFileSync(path.join(ROOT, "scripts", "article-cover-sources.json"), "utf8"));
const ORIGINALS = new Map();
for (const group of ["guides", "news"]) {
  for (const [slug, url] of Object.entries(sources[group] || {})) {
    ORIGINALS.set(`${group}:${slug}`, String(url));
  }
}

const problems = [];
const fail = (where, msg) => problems.push(`${where}: ${msg}`);

async function fetchCollection(collection) {
  const res = await fetch(`${API_BASE}/api/cms/${collection}?cb=${Date.now()}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`${collection} fetch failed: HTTP ${res.status}`);
  const rows = await res.json();
  return Array.isArray(rows) ? rows : rows?.data || [];
}

async function save(collection, payload) {
  const res = await fetch(`${API_BASE}/api/cms/${collection}/save`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-cms-admin-token": TOKEN,
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status} ${text.slice(0, 240)}`);
  let parsed = {};
  try {
    parsed = JSON.parse(text);
  } catch {
    /* non-JSON */
  }
  return { saved: Boolean(parsed?.data?.saved), raw: text.slice(0, 160) };
}

/** Every original must be reachable and be an image - a dead URL would trade
 *  a padded composite for a broken frame, which is worse. Root-relative
 *  originals (the five news covers shipped in public/) resolve against the
 *  site base, exactly like the prerender's toPublicImageUrl does. */
async function probeOriginal(url) {
  const probeUrl = /^https?:\/\//i.test(url) ? url : `${SITE_BASE}${url.startsWith("/") ? url : `/${url}`}`;
  try {
    const res = await fetch(probeUrl, {
      method: "GET",
      headers: { Range: "bytes=0-1023" },
      signal: AbortSignal.timeout(20_000),
    });
    const type = res.headers.get("content-type") || "";
    if (!res.ok && res.status !== 206) return `HTTP ${res.status}`;
    if (!/^image\//i.test(type)) return `content-type ${type || "(none)"}`;
    return null;
  } catch (error) {
    return error?.message || "unreachable";
  }
}

async function main() {
  if (!TOKEN && APPLY) {
    console.error("CMS_ADMIN_ALL_TOKEN is required for --apply.");
    process.exit(1);
  }

  const planned = [];
  for (const collection of ["guides", "news"]) {
    const rows = await fetchCollection(collection);
    for (const row of rows) {
      const slug = String(row.slug || "");
      const key = `${collection}:${slug}`;
      if (!ORIGINALS.has(key)) continue;
      const original = ORIGINALS.get(key);
      const current = String(row.imageUrl || "").trim();
      // Only records that already carry a cover are touched: unpublished
      // drafts ship with an empty imageUrl by design and stay that way.
      if (!current) {
        console.log(`skip   ${collection}/${slug} (no cover today - left untouched)`);
        continue;
      }
      planned.push({ collection, slug, row, original, current, changed: current !== original });
    }
  }

  const expected = ORIGINALS.size;
  const withCover = planned.length;
  console.log(`\n${withCover} record(s) carry a cover (${expected} originals known; the rest are unpublished drafts).`);

  if (APPLY) {
    console.log("probing every original URL...");
    for (const item of planned) {
      const problem = await probeOriginal(item.original);
      if (problem) fail(`${item.collection}/${item.slug}`, `original unreachable: ${problem}`);
    }
    if (problems.length) {
      console.error("set-article-cover-originals FAILED (preflight)");
      for (const p of problems) console.error("  - " + p);
      process.exit(1);
    }
    console.log(`all ${planned.length} originals reachable and image-typed`);
  }

  for (const item of planned) {
    console.log(
      `${item.changed ? "write " : "skip  "} ${item.collection}/${item.slug}\n` +
        `   from: ${item.current}\n   to:   ${item.original}`,
    );
  }

  if (!APPLY) {
    console.log("\n[dry-run] no writes performed. Re-run with --apply.");
    return;
  }

  let written = 0;
  for (const item of planned) {
    if (!item.changed) continue;
    const payload = { ...item.row, imageUrl: item.original };
    const result = await save(item.collection, payload);
    written += 1;
    console.log(`saved ${item.collection}/${item.slug} saved=${result.saved} ${result.raw}`);
  }

  // Read back through the cache-buster so the verification is not served
  // from the edge copy the write just invalidated.
  let bad = 0;
  for (const collection of ["guides", "news"]) {
    const rows = await fetchCollection(collection);
    const bySlug = new Map(rows.map((r) => [String(r.slug || ""), r]));
    for (const item of planned.filter((p) => p.collection === collection)) {
      const got = String(bySlug.get(item.slug)?.imageUrl || "").trim();
      const ok = got === item.original;
      if (!ok) bad += 1;
      console.log(`${ok ? "OK  " : "FAIL"} ${collection}/${item.slug} => ${got || "(none)"}`);
    }
  }
  if (bad) {
    console.error(`verify FAILED for ${bad} record(s)`);
    process.exit(1);
  }
  console.log(`\n${written} record(s) written, ${planned.length} verified at their original URLs`);
}

main().catch((error) => {
  console.error("set-article-cover-originals error:", error?.message || error);
  process.exit(1);
});
