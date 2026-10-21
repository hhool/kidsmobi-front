/**
 * A2 (2026-10-22): publish the reorganized /products and /reviews hub keyword
 * sets into CMS settings.seo, and keep the `evaluations` alias in sync.
 *
 * Why the CMS and not just defaultSeo.ts: the resolver chain is
 * pages[].seo > settings.seo[alias] > defaultSeo, and since 2026-10-22 the
 * prerender publishes the CMS-resolved keywords for the six section routes
 * (RoutePage.keywords via applyCmsSectionSeo) — so a keyword set that lives
 * only in defaultSeo.ts would be overridden by whatever the CMS still holds.
 * The values are imported from DEFAULT_SEO_CONFIGS so the published set and the
 * CMS-unreachable fallback can never drift apart.
 *
 * What changed vs the live CMS:
 *   products.en  ["kids bike","toddler bike","kids scooter"]
 *             -> ["balance bike","kids bike","baby stroller","kids scooter","kids electric car"]
 *               (category-level terms, primary categories first; "twin stroller"
 *               retired as a sub-model word)
 *   products.zh  3 words -> the 6 category-level words from defaultSeo
 *   reviews.en   ["travel stroller","toddler bike","stroller reviews"]
 *             -> ["stroller reviews","balance bike reviews","toddler bike","travel stroller","toddler balance bike"]
 *               (ordered by the real evaluation mix: stroller 9 / bicycle 7 / balance 4)
 *   reviews.zh / evaluations.*  same reordered sets as reviews (alias parity)
 *   news.en      the CMS entry was missing "electric dirt bike for kids" — the
 *               DEFAULT (and therefore the raw HTML Google reads) set has all
 *               three hub keywords, so the CMS is topped up to match. With the
 *               2026-10-22 source unification the prerender now publishes the
 *               CMS set, and dropping the third word here would have silently
 *               removed a keyword the user decided to keep.
 *   news.zh      topped up to the 3-word DEFAULT set the same way
 *   about.en     the CMS entry carried "independent safety testing" — a phrase
 *               the prerender's whole-document claim scrub rewrites to
 *               "spec-based comparisons", so the static HTML and the hydrated
 *               SPA published different /about keywords. Synced to the
 *               scrub-clean DEFAULT set ("independent reviews").
 *
 * Only the `keywords` arrays are written — titles and descriptions in the CMS
 * stay exactly as published.
 *
 * Usage:
 *   CMS_ADMIN_ALL_TOKEN=<token> npx tsx scripts/set-hub-keywords-a2.ts --dry-run
 *   CMS_ADMIN_ALL_TOKEN=<token> npx tsx scripts/set-hub-keywords-a2.ts --apply
 */
import { DEFAULT_SEO_CONFIGS } from "../src/config/defaultSeo";

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const API_BASE = (process.env.CMS_API_BASE || "https://store.balancebiketoddler.com").replace(/\/+$/, "");
const TOKEN = String(process.env.CMS_ADMIN_ALL_TOKEN || "").trim();

// Section key -> keyword set (from defaultSeo, the fallback source of truth).
// `evaluations` mirrors `reviews`: getSeoAliasKeys("reviews") resolves both,
// and the two CMS entries are duplicates by design.
const SECTIONS: Array<{ key: "products" | "reviews" | "evaluations" | "news" | "about"; source: "products" | "reviews" | "news" | "about" }> = [
  { key: "products", source: "products" },
  { key: "reviews", source: "reviews" },
  { key: "evaluations", source: "reviews" },
  { key: "news", source: "news" },
  { key: "about", source: "about" },
];

for (const section of SECTIONS) {
  for (const lang of ["en", "zh"] as const) {
    const keywords = DEFAULT_SEO_CONFIGS[section.source][lang].keywords;
    if (keywords.length === 0) throw new Error(`${section.key}.${lang}: empty keyword set`);
    if (keywords.length > 10) throw new Error(`${section.key}.${lang}: ${keywords.length} keywords > 10`);
    for (const keyword of keywords) {
      if (keyword.length > 32) throw new Error(`${section.key}.${lang}: keyword "${keyword}" > 32 chars`);
    }
  }
}

console.log(`API base: ${API_BASE}`);
console.log(`Mode: ${APPLY ? "APPLY (writing to D1)" : "DRY RUN"}`);
for (const section of SECTIONS) {
  for (const lang of ["en", "zh"] as const) {
    console.log(`  ${section.key}.${lang}: ${DEFAULT_SEO_CONFIGS[section.source][lang].keywords.join(", ")}`);
  }
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

const currentSeo = (current.seo as Record<string, unknown> | undefined) || {};
const mergedSeo: Record<string, unknown> = { ...currentSeo };
for (const section of SECTIONS) {
  const existing = (mergedSeo[section.key] as Record<string, unknown> | undefined) || {};
  const next: Record<string, unknown> = { ...existing };
  for (const lang of ["en", "zh"] as const) {
    const existingLang = (existing[lang] as Record<string, unknown> | undefined) || {};
    next[lang] = { ...existingLang, keywords: [...DEFAULT_SEO_CONFIGS[section.source][lang].keywords] };
    const before = (existingLang.keywords as string[] | undefined)?.join(", ");
    console.log(`  replacing ${section.key}.${lang}.keywords: "${before ?? "(none)"}"`);
  }
  mergedSeo[section.key] = next;
}

const merged = {
  ...current,
  seo: mergedSeo,
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
const verifySeo = (verifyRows[0]?.seo as Record<string, unknown> | undefined) || {};
let failed = false;
for (const section of SECTIONS) {
  for (const lang of ["en", "zh"] as const) {
    const live = ((verifySeo[section.key] as Record<string, unknown> | undefined)?.[lang] as { keywords?: string[] } | undefined)?.keywords;
    const expected = DEFAULT_SEO_CONFIGS[section.source][lang].keywords;
    if (!live || live.length !== expected.length || live.some((kw, i) => kw !== expected[i])) {
      console.error(`verification failed: live ${section.key}.${lang}.keywords = ${JSON.stringify(live)}`);
      failed = true;
    }
  }
}
if (failed) process.exit(1);
console.log("\n[ok] products/reviews/evaluations keyword sets published and verified live.");
