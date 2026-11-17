/**
 * De-duplicate the travel-stroller cover images.
 *
 * Eight published guides all point at the SAME CMS imageUrl
 * (MAMAZING Ultra Air, ASIN B0FCMTQK6C). On /guides that renders eight cards
 * with one photo, and because imageUrl is also the article's og:image, all
 * eight share one social card too.
 *
 * Each guide gets a distinct cover picked from this site's own product media,
 * matched to what the guide actually covers:
 *
 *   best-travel-stroller-2026            MAMAZING Ultra Air (same model, other ASIN)
 *   stroller-travel-airplane             Graco Ready2Jet ("Overhead Friendly")
 *   best-travel-stroller-for-3-year-old  Mompush Lithe V2 (travel, bigger kid)
 *   travel-stroller-for-2-year-old       Baby Joy Lightweight Compact
 *   travel-stroller-for-cruise           Dream On Me Aero Travel Umbrella (travel, 1500px)
 *   travel-stroller-for-toddler          Chicco Liteway (compact fold)
 *   compact-travel-stroller              Ingenuity 3Dquickclose (compact fold)
 *   lightweight-travel-stroller          Ingenuity 3D Mini (lightest)
 *
 * CONTRACT (same as the news-body scripts):
 * - `seo` is copied through byte-for-byte (head frozen until 2026-11-22).
 * - The write only touches `imageUrl`; every other field is sent unchanged.
 * - Guard: the record's CURRENT imageUrl must still equal DUPLICATE_SRC before
 *   it is changed, so a human edit is never clobbered.
 * - Guard: all eight replacement URLs must be distinct, and every one must
 *   return 200 (HEAD) before the first write.
 * - Idempotent: a record already on its target URL is skipped, so re-running
 *   after a partial failure finishes the job without re-writing the rest.
 *
 * NOTE ON HEAD: imageUrl is the article's og:image, so this changes the social
 * card for these eight pages. That is the point of the fix — eight different
 * articles should not share one social image.
 *
 * Usage:
 *   CMS_ADMIN_ALL_TOKEN=<token> node scripts/fix-duplicate-guide-covers.mjs           # dry run
 *   CMS_ADMIN_ALL_TOKEN=<token> node scripts/fix-duplicate-guide-covers.mjs --apply   # write D1
 */
import { readFileSync } from "node:fs";

const APPLY = process.argv.includes("--apply");
const API_BASE = (process.env.CMS_API_BASE || "https://store.balancebiketoddler.com").replace(/\/+$/, "");
const TOKEN = String(process.env.CMS_ADMIN_ALL_TOKEN || "").trim();
const STORE = "https://store.balancebiketoddler.com";

const DUPLICATE_SRC =
  "https://store.balancebiketoddler.com/stroller/MAMAZING/Rank_Similar_ASIN_B0FCMTQK6C_MAMAZING%20Ultra%20Air%20Lightweight%20Baby%20Travel%20Strolle/images/primary.jpg";

/** Build the absolute media URL exactly like toAbsoluteMediaUrl(): encode each segment. */
function mediaUrl(relativePath) {
  return `${STORE}/${relativePath.split("/").map((s) => encodeURIComponent(s)).join("/")}`;
}

const TARGETS = {
  "best-travel-stroller-2026": mediaUrl(
    "stroller/MAMAZING/Rank_2_ASIN_B0CXXRN2QS_MAMAZING Ultra Air Lightweight Baby Travel Strolle/images/primary.jpg",
  ),
  "stroller-travel-airplane": mediaUrl(
    "stroller/Graco/Rank_6_ASIN_B0D2LXK44T_Graco Ready2Jet Compact Stroller Overhead Friendly/images/primary.jpg",
  ),
  "best-travel-stroller-for-3-year-old": mediaUrl(
    "stroller/Mompush/Rank_13_ASIN_B0B7MFS2W4_Mompush Lithe V2 Lightweight Travel Stroller Snack/images/primary.jpg",
  ),
  "travel-stroller-for-2-year-old": mediaUrl(
    "stroller/Baby/Rank_Similar_ASIN_B078TBP298_Baby Joy Lightweight Stroller Compact Toddler Trav/images/primary.jpg",
  ),
  "travel-stroller-for-cruise": mediaUrl(
    "stroller/Dream/Rank_7_ASIN_B0DC5GGJRP_Dream On Me Aero Travel Umbrella Stroller One-Hand/images/primary.jpg",
  ),
  "travel-stroller-for-toddler": mediaUrl(
    "stroller/Chicco/Rank_Similar_ASIN_B0D98VGYVZ_Chicco Liteway Stroller Compact Fold Baby Stroller/images/primary.jpg",
  ),
  "compact-travel-stroller": mediaUrl(
    "stroller/Ingenuity/Rank_Similar_ASIN_B0BSP4K34F_Ingenuity 3Dquickclose CS Compact Fold Stroller  L/images/primary.jpg",
  ),
  "lightweight-travel-stroller": mediaUrl(
    "stroller/Ingenuity/Rank_4_ASIN_B07P1YSC18_Ingenuity 3D Mini Convenience Stroller  Lightweigh/images/primary.jpg",
  ),
};

function die(message) {
  console.error(`ABORT: ${message}`);
  process.exit(1);
}

// --- Pre-flight: the plan itself must be coherent --------------------------
const urls = Object.values(TARGETS);
if (urls.length !== 8) die(`expected 8 targets, got ${urls.length}`);
if (new Set(urls).size !== urls.length) die("two guides would share the same cover again");
if (urls.includes(DUPLICATE_SRC)) die("a target still points at the duplicate image");

/** HEAD each candidate so we never write a URL that 404s. */
async function assertReachable(url) {
  const res = await fetch(url, { method: "HEAD", headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) die(`image not reachable (${res.status}): ${url}`);
  const type = res.headers.get("content-type") || "";
  if (!/^image\//i.test(type)) die(`not an image (${type}): ${url}`);
}

async function fetchGuides() {
  const res = await fetch(`${API_BASE}/api/cms/guides?cb=${Date.now()}`, {
    headers: { "x-cms-admin-token": TOKEN },
  });
  if (!res.ok) die(`GET /api/cms/guides -> ${res.status}`);
  const payload = await res.json();
  const rows = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
  if (!rows.length) die("GET /api/cms/guides returned no rows");
  return rows;
}

async function writeGuide(record) {
  // Writes go to the /save action: a bare POST /api/cms/guides is a 404
  // RouteNotFound (the worker only routes GET on the collection path).
  const res = await fetch(`${API_BASE}/api/cms/guides/save`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-cms-admin-token": TOKEN },
    body: JSON.stringify(record),
  });
  if (!res.ok) die(`POST /api/cms/guides/save (${record.slug}) -> ${res.status} ${await res.text().catch(() => "")}`);
}

const summary = [];
for (const [slug, target] of Object.entries(TARGETS)) {
  const snapshot = JSON.parse(readFileSync(new URL("../scripts/cms-snapshots/guides.json", import.meta.url), "utf8"));
  const local = snapshot.find((r) => r.slug === slug);
  if (!local) die(`slug not found in snapshot: ${slug}`);
  summary.push({ slug, from: local.imageUrl, to: target });
}

console.log(APPLY ? "=== APPLY (writing D1) ===" : "=== DRY RUN (no writes) ===");
const label = (url) => {
  const parts = decodeURI(url).split("/");
  return parts.length >= 5 ? `${parts[3]} / ${parts[4].replace(/^Rank[^_]*_ASIN_[A-Z0-9]+_/, "").slice(0, 46)}` : url;
};
for (const row of summary) {
  const same = row.from === row.to;
  console.log(`${same ? "skip " : "set  "} ${row.slug}`);
  if (!same) console.log(`       -> ${label(row.to)}`);
}

if (!APPLY) {
  console.log("\ndry run complete — re-run with --apply to write.");
  process.exit(0);
}

if (!TOKEN) die("CMS_ADMIN_ALL_TOKEN is not set");

// Every candidate must be reachable before the first write.
for (const [slug, url] of Object.entries(TARGETS)) {
  await assertReachable(url);
  console.log(`reachable ${slug}`);
}

const rows = await fetchGuides();
let changed = 0;
for (const [slug, target] of Object.entries(TARGETS)) {
  const record = rows.find((r) => r.slug === slug);
  if (!record) die(`live record not found: ${slug}`);
  if (record.imageUrl === target) {
    console.log(`skip   ${slug} (already correct)`);
    continue;
  }
  if (record.imageUrl !== DUPLICATE_SRC) {
    die(`${slug} has an unexpected imageUrl (not the duplicate) — refusing to overwrite:\n  ${record.imageUrl}`);
  }
  const seoBefore = JSON.stringify(record.seo);
  const next = { ...record, imageUrl: target };
  if (JSON.stringify(next.seo) !== seoBefore) die(`seo changed while editing ${slug}`);
  await writeGuide(next);
  changed += 1;
  console.log(`wrote  ${slug}`);
}
console.log(`\nDONE — ${changed} record(s) updated.`);
