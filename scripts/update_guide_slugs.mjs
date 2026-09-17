#!/usr/bin/env node
/**
 * Fix semantically wrong guide slugs left over from the import pipeline.
 *
 * Those records inherited a slug derived from the Amazon ASIN of the product row
 * that happened to seed them (e.g. "...-b0cs2zykc4image" for a stroller article),
 * which makes the public URL meaningless and hurts SEO. The CMS editor can now
 * edit slugs by hand; this script does the same thing for the existing records.
 *
 * Because the site is not yet indexed for these URLs, renaming is safe today.
 *
 * Usage:
 *   node scripts/update_guide_slugs.mjs                 # dry run (default)
 *   node scripts/update_guide_slugs.mjs --apply         # write to D1
 *   node scripts/update_guide_slugs.mjs --apply --set "guide-XXX:image=my-new-slug"
 *
 * Environment:
 *   CMS_API_BASE   default https://store.balancebiketoddler.com
 */

const args = process.argv.slice(2);
const apply = args.includes("--apply");

const API_BASE = (process.env.CMS_API_BASE || "https://store.balancebiketoddler.com").replace(/\/+$/, "");

/** id -> desired slug. Only ids listed here are touched. */
const SLUG_TABLE = {
  // "Finding the Best Balance Bike for a 1-Year-Old"
  "guide-B0CS2ZYKC4:overview": "best-balance-bike-for-1-year-old",
  // "The Ultimate Guide: How to Choose the Perfect Baby Stroller"
  "guide-B0CS2ZYKC4:image": "how-to-choose-the-perfect-baby-stroller",
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

async function saveGuide(guide) {
  const res = await fetch(`${API_BASE}/api/cms/guides/save`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(guide),
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

function guidePath(guide, slug) {
  const topic = String(guide?.taxonomy?.topicCategory || guide?.category || "beginner").trim() || "beginner";
  return `/guides/${topic}/${slug}`;
}

async function main() {
  const { data: guides = [] } = await getJson("/api/cms/guides");

  for (const slug of Object.values(SLUG_TABLE)) assertValidSlug(slug);

  const byId = new Map(guides.map((guide) => [String(guide.id || ""), guide]));
  const takenSlugs = new Map(
    guides.map((guide) => [String(guide.slug || "").trim().toLowerCase(), String(guide.id || "")]),
  );

  const plan = [];
  const problems = [];

  for (const [id, nextSlug] of Object.entries(SLUG_TABLE)) {
    const guide = byId.get(id);
    if (!guide) {
      problems.push(`${id}: not found in D1`);
      continue;
    }
    const currentSlug = String(guide.slug || "").trim();
    if (currentSlug === nextSlug) continue;

    const holder = takenSlugs.get(nextSlug.toLowerCase());
    if (holder && holder !== id) {
      problems.push(`${id}: slug "${nextSlug}" is already used by ${holder}`);
      continue;
    }
    const title = String(guide?.en?.title || guide?.zh?.title || "").slice(0, 60);
    plan.push({
      id,
      status: guide.status,
      title,
      from: guidePath(guide, currentSlug || "(none)"),
      to: guidePath(guide, nextSlug),
      nextSlug,
    });
  }

  console.log(`API base    : ${API_BASE}`);
  console.log(`Guides      : ${guides.length}`);
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
    const guide = byId.get(item.id);
    try {
      const result = await saveGuide({ ...guide, slug: item.nextSlug });
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
