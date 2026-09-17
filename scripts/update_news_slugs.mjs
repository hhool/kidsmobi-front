#!/usr/bin/env node
/**
 * Give the published news stories real, human-readable slugs.
 *
 * Three of the four live stories have no slug at all, so their public URL falls
 * back to the raw D1 id (e.g. /news/industry/news_1786363572306). The fourth
 * inherited a slug derived from the Amazon ASIN that seeded it
 * ("kidspullalongwagons-b0cs2zykc4image") — meaningless for a Strider brand story.
 *
 * The route matcher accepts either the slug or the id, so rewriting a slug never
 * breaks previously shared id-based links; only the canonical URL changes.
 *
 * Usage:
 *   node scripts/update_news_slugs.mjs                 # dry run (default)
 *   node scripts/update_news_slugs.mjs --apply         # write to D1
 *   node scripts/update_news_slugs.mjs --apply --set "news_123=my-slug"
 *
 * Environment:
 *   CMS_API_BASE   default https://store.balancebiketoddler.com
 */

const args = process.argv.slice(2);
const apply = args.includes("--apply");

const API_BASE = (process.env.CMS_API_BASE || "https://store.balancebiketoddler.com").replace(/\/+$/, "");

/** id -> desired slug. Only ids listed here are touched. */
const SLUG_TABLE = {
  // "Kids' Electric Bike Development Trends Whitepaper 2026: ..."
  "news_1786363572306": "kids-electric-bike-development-trends-2026",
  // "Strider Bikes now selling Kellys juvenile models"
  "news-B0CS2ZYKC4:image": "strider-bikes-kellys-juvenile-models",
  // "Foldable Electric Scooter Brands Worldwide"
  "news_1785524737447": "foldable-electric-scooter-brands-worldwide",
  // "Guide to Choosing and Using Child Safety Seats"
  "news_1785530823571": "choosing-and-using-child-safety-seats",
};

for (let i = 0; i < args.length; i += 1) {
  if (args[i] === "--set" && args[i + 1]) {
    const [id, slug] = String(args[i + 1]).split("=");
    if (id && slug) SLUG_TABLE[id.trim()] = slug.trim();
    i += 1;
  }
}

function assertValidSlug(slug) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(`"${slug}" is not a URL-safe slug (lowercase letters, digits, single hyphens).`);
  }
}

async function getJson(path) {
  const res = await fetch(`${API_BASE}${path}`, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`GET ${path} failed: ${res.status} ${(await res.text()).slice(0, 200)}`);
  }
  return res.json();
}

async function saveNews(item) {
  const res = await fetch(`${API_BASE}/api/cms/news/save`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`save failed: ${res.status} ${text.slice(0, 200)}`);
  }
  let parsed = {};
  try {
    parsed = JSON.parse(text);
  } catch {
    /* non-JSON body */
  }
  return { saved: Boolean(parsed?.data?.saved), raw: text.slice(0, 200) };
}

/** Mirrors the Worker's deriveContentPath() for news. */
function newsPath(item, slug) {
  const channel = String(item?.category || item?.subtype || "industry").trim() || "industry";
  return `/news/${channel}/${slug}`;
}

async function main() {
  const { data: news = [] } = await getJson("/api/cms/news");

  for (const slug of Object.values(SLUG_TABLE)) assertValidSlug(slug);

  const byId = new Map(news.map((item) => [String(item.id || ""), item]));
  const takenSlugs = new Map(
    news.map((item) => [String(item.slug || "").trim().toLowerCase(), String(item.id || "")]),
  );

  const plan = [];
  const problems = [];

  for (const [id, nextSlug] of Object.entries(SLUG_TABLE)) {
    const item = byId.get(id);
    if (!item) {
      problems.push(`${id}: not found in D1`);
      continue;
    }
    const currentSlug = String(item.slug || "").trim();
    if (currentSlug === nextSlug) continue;

    const holder = takenSlugs.get(nextSlug.toLowerCase());
    if (holder && holder !== id) {
      problems.push(`${id}: slug "${nextSlug}" is already used by ${holder}`);
      continue;
    }
    const title = String(item?.en?.title || item?.zh?.title || "").slice(0, 62);
    plan.push({
      id,
      status: item.status,
      title,
      from: newsPath(item, currentSlug || String(item.id)),
      to: newsPath(item, nextSlug),
      nextSlug,
    });
  }

  console.log(`API base    : ${API_BASE}`);
  console.log(`News rows   : ${news.length}`);
  console.log(`Mode        : ${apply ? "APPLY (writing to D1)" : "DRY RUN"}`);
  console.log("");
  for (const item of plan) {
    console.log(`[${item.status}] ${item.title}`);
    console.log(`   ${item.from}`);
    console.log(`-> ${item.to}`);
  }
  if (plan.length === 0) console.log("Nothing to change.");
  for (const problem of problems) console.error(`[SKIPPED] ${problem}`);

  if (!apply) {
    console.log("\nDry run complete. Re-run with --apply to write.");
    return;
  }

  console.log("");
  for (const item of plan) {
    const record = byId.get(item.id);
    try {
      const result = await saveNews({ ...record, slug: item.nextSlug });
      console.log(`[${result.saved ? "ok" : "?"}] ${item.id} -> ${item.nextSlug}`);
      if (!result.saved) console.log(`    response: ${result.raw}`);
    } catch (error) {
      console.error(`[FAILED] ${item.id}: ${error.message}`);
    }
  }
  console.log(`\nDone: ${plan.length} record(s) processed.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
