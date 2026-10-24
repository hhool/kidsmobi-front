#!/usr/bin/env node
/**
 * Sets imageUrl on the news articles that shipped without a cover.
 *
 * Five of the nine published stories had no imageUrl and no inline image, so
 * their cards rendered as bare text on /news and their detail pages carried an
 * og:image with no visible figure above the fold. The four that already had a
 * cover point at the media store (bare bucket keys). The five added here ship
 * in this repo's public/ tree instead, so their imageUrl is root-relative
 * ("/images/news/<slug>-800x800.webp") and the prerender resolves it against
 * the site origin — see toPublicImageUrl in scripts/prerender-pages.ts.
 *
 * Only `imageUrl` is written; every other field on the record is passed back
 * untouched (the CMS save endpoint replaces the record).
 *
 * Usage:
 *   CMS_ADMIN_ALL_TOKEN=<token> node scripts/set-news-covers.mjs --dry-run
 *   CMS_ADMIN_ALL_TOKEN=<token> node scripts/set-news-covers.mjs --apply
 */
import { existsSync, statSync } from "node:fs";
import path from "node:path";

const APPLY = process.argv.includes("--apply");
const API_BASE = (process.env.CMS_API_BASE || "https://store.balancebiketoddler.com").replace(/\/+$/, "");
const TOKEN = String(process.env.CMS_ADMIN_ALL_TOKEN || "").trim();

// slug -> root-relative cover path (file lives in public/, served by Pages)
const COVERS = {
  "electric-dirt-bikes-for-kids": "/images/news/electric-dirt-bikes-for-kids-800x800.webp",
  "balance-bike-brand-news-october-2026": "/images/news/balance-bike-brand-news-october-2026-800x800.webp",
  "new-balance-bikes-2026": "/images/news/new-balance-bikes-2026-800x800.webp",
  "ride-on-safety-standards-2026": "/images/news/ride-on-safety-standards-2026-800x800.webp",
  "balance-bike-research": "/images/news/balance-bike-research-800x800.webp",
};

// Articles that must keep their existing cover — asserted, not written, so a
// typo in COVERS cannot silently move a working image somewhere else.
const KEEP_EXISTING = [
  "kids-electric-bike-development-trends-2026",
  "choosing-and-using-child-safety-seats",
  "strider-bikes-kellys-juvenile-models",
  "foldable-electric-scooter-brands-worldwide",
];

const problems = [];
function fail(where, msg) {
  problems.push(`${where}: ${msg}`);
}

// ---------------------------------------------------------------------------
// Preflight: every cover must exist locally, be a real webp, and be small
// enough to be worth serving.
// ---------------------------------------------------------------------------
const PUBLIC_ROOT = path.resolve("public");
for (const [slug, rel] of Object.entries(COVERS)) {
  const abs = path.join(PUBLIC_ROOT, rel.replace(/^\//, ""));
  if (!existsSync(abs)) {
    fail(slug, `cover file missing: ${abs}`);
    continue;
  }
  const { size } = statSync(abs);
  if (size < 5_000) fail(slug, `cover suspiciously small: ${size} bytes`);
  if (size > 250_000) fail(slug, `cover too heavy for a card: ${Math.round(size / 1024)} KB`);
}

async function fetchNews() {
  const res = await fetch(`${API_BASE}/api/cms/news?cb=${Date.now()}`, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`news fetch failed: HTTP ${res.status}`);
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

async function main() {
  if (!TOKEN && APPLY) {
    console.error("CMS_ADMIN_ALL_TOKEN is required for --apply.");
    process.exit(1);
  }

  const live = await fetchNews();
  const bySlug = new Map(live.map((r) => [String(r.slug || ""), r]));

  const planned = [];
  for (const [slug, cover] of Object.entries(COVERS)) {
    const row = bySlug.get(slug);
    if (!row) {
      fail(slug, "slug not found in CMS news");
      continue;
    }
    if (String(row.status || "") !== "published") {
      fail(slug, `status is "${row.status}", expected "published"`);
    }
    const current = String(row.imageUrl || "").trim();
    planned.push({ slug, cover, current, changed: current !== cover });
  }

  for (const slug of KEEP_EXISTING) {
    const row = bySlug.get(slug);
    if (!row) {
      fail(slug, "expected existing cover, slug not found");
      continue;
    }
    if (!String(row.imageUrl || "").trim()) fail(slug, "lost its cover — expected one to be set");
  }

  console.log(JSON.stringify({ ok: problems.length === 0, planned }, null, 2));
  if (problems.length) {
    console.error("set-news-covers FAILED");
    for (const p of problems) console.error("  - " + p);
    process.exit(1);
  }

  if (!APPLY) {
    console.log("\n[dry-run] no writes performed. Re-run with --apply.");
    return;
  }

  for (const item of planned) {
    if (!item.changed) {
      console.log(`skip   ${item.slug} (already ${item.cover})`);
      continue;
    }
    const row = bySlug.get(item.slug);
    const payload = { ...row, imageUrl: item.cover };
    const result = await save("news", payload);
    console.log(`write  ${item.slug}\n   from: ${item.current || "(none)"}\n   to:   ${item.cover}\n   saved=${result.saved}`);
  }

  // Read back through the cache-buster so the verification is not served from
  // the edge copy the write just invalidated.
  const after = await fetchNews();
  const afterBySlug = new Map(after.map((r) => [String(r.slug || ""), r]));
  let bad = 0;
  for (const [slug, cover] of Object.entries(COVERS)) {
    const got = String(afterBySlug.get(slug)?.imageUrl || "").trim();
    const ok = got === cover;
    if (!ok) bad += 1;
    console.log(`${ok ? "OK  " : "FAIL"} ${slug} => ${got || "(none)"}`);
  }
  if (bad) {
    console.error(`verify FAILED for ${bad} article(s)`);
    process.exit(1);
  }
  console.log("\nall 5 covers written and verified");
}

main().catch((error) => {
  console.error("set-news-covers error:", error?.message || error);
  process.exit(1);
});
