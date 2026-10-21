/**
 * Republish the /guides section TDK into CMS settings.seo.
 *
 * 2026-10-21: the live <title> of /guides was "How to Choose a Baby Stroller |
 * BalanceBikeToddler" — the CMS override (settings.seo.guides) outranks
 * src/config/defaultSeo.ts in the resolver chain (pages[].seo >
 * settings.seo[alias] > defaultSeo), so the stroller copy kept winning even
 * after the default was corrected, and the 65-char cap had amputated the
 * balance-bike half of the original string. The guide library is
 * balance-bike-first (price tiers, by-age, what-buyers-say, stability), so the
 * section copy now says that.
 *
 * The copy is imported from DEFAULT_SEO_CONFIGS.guides — the same values the
 * app falls back to if the CMS entry is ever removed — so this script cannot
 * publish a different list than the app ships.
 *
 * Usage:
 *   CMS_ADMIN_ALL_TOKEN=<token> npx tsx scripts/set-guides-section-seo.ts --dry-run
 *   CMS_ADMIN_ALL_TOKEN=<token> npx tsx scripts/set-guides-section-seo.ts --apply
 */
import { DEFAULT_SEO_CONFIGS } from "../src/config/defaultSeo";

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const API_BASE = (process.env.CMS_API_BASE || "https://store.balancebiketoddler.com").replace(/\/+$/, "");
const TOKEN = String(process.env.CMS_ADMIN_ALL_TOKEN || "").trim();

const guides = DEFAULT_SEO_CONFIGS.guides;
for (const lang of ["en", "zh"] as const) {
  const { title, description, keywords } = guides[lang];
  if (title.length > 65) throw new Error(`${lang} title too long: ${title.length}`);
  if (description.length > 155) throw new Error(`${lang} description too long: ${description.length}`);
  if (keywords.length > 10) throw new Error(`${lang} too many keywords`);
  for (const keyword of keywords) {
    if (keyword.length > 32) throw new Error(`${lang} keyword too long: ${keyword}`);
  }
}

console.log(`API base: ${API_BASE}`);
console.log(`Mode: ${APPLY ? "APPLY (writing to D1)" : "DRY RUN"}`);
for (const lang of ["en", "zh"] as const) {
  console.log(`  ${lang} title: ${guides[lang].title}`);
}

if (!APPLY) {
  console.log("\nDry run complete. Re-run with --apply to write.");
  process.exit(0);
}
if (!TOKEN) {
  console.error("CMS_ADMIN_ALL_TOKEN is required.");
  process.exit(1);
}

const get = await fetch(`${API_BASE}/api/cms/settings`, { headers: { Accept: "application/json" } });
if (!get.ok) {
  console.error(`settings read failed: HTTP ${get.status}`);
  process.exit(1);
}
const payload = (await get.json()) as { data?: unknown };
const rows = Array.isArray(payload?.data) ? (payload.data as Array<Record<string, unknown>>) : [payload?.data as Record<string, unknown>];
const current = rows[0];
if (!current || typeof current !== "object") {
  console.error("no settings record to merge into");
  process.exit(1);
}

const previous = (current.seo as Record<string, unknown> | undefined)?.guides as Record<string, unknown> | undefined;
if (previous?.en) {
  const prevTitle = (previous.en as { title?: string }).title;
  console.log(`\nreplacing CMS guides.en title: "${prevTitle}"`);
}

const merged = {
  ...current,
  seo: { ...(current.seo as Record<string, unknown> | undefined), guides },
  updatedAt: new Date().toISOString(),
};

const post = await fetch(`${API_BASE}/api/cms/settings/save`, {
  method: "POST",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "x-cms-admin-token": TOKEN,
  },
  body: JSON.stringify(merged),
});
const text = await post.text();
if (!post.ok) {
  console.error(`settings save failed: HTTP ${post.status} ${text.slice(0, 200)}`);
  process.exit(1);
}
let saved = false;
try {
  saved = Boolean((JSON.parse(text) as { data?: { saved?: boolean } })?.data?.saved);
} catch {
  /* non-JSON */
}
if (!saved) {
  console.error(`unexpected response: ${text.slice(0, 160)}`);
  process.exit(1);
}

// Read back through the same endpoint the prerender uses, so a stale edge cache
// cannot fake a success (the ?cb busts it the same way the build does).
const verify = await fetch(`${API_BASE}/api/cms/settings?cb=${Date.now()}`, { headers: { Accept: "application/json" } });
const verifyPayload = (await verify.json()) as { data?: unknown };
const verifyRows = Array.isArray(verifyPayload?.data) ? (verifyPayload.data as Array<Record<string, unknown>>) : [verifyPayload?.data as Record<string, unknown>];
const liveGuides = (verifyRows[0]?.seo as Record<string, unknown> | undefined)?.guides as Record<string, unknown> | undefined;
const liveEnTitle = (liveGuides?.en as { title?: string } | undefined)?.title;
if (liveEnTitle !== guides.en.title) {
  console.error(`verification failed: live guides.en title is "${liveEnTitle}"`);
  process.exit(1);
}
console.log(`\n[ok] settings.seo.guides published and verified live: "${liveEnTitle}"`);
