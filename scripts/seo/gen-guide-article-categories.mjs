#!/usr/bin/env node
/**
 * Generate src/data/guideArticleCategories.generated.ts from the CMS snapshot.
 *
 * WHY A GENERATED MODULE
 * ----------------------
 * src/lib/pageKeywords.ts resolves <meta name="keywords"> from a URL path
 * alone. It has no access to CMS data, so guides article pages used to inherit
 * the topic's (balance-bike) keyword set regardless of the product family the
 * article actually covers. A slug -> productCategory lookup closes that gap,
 * but hand-writing 21 slugs in the resolver would drift the moment an editor
 * publishes or re-categorises a guide. The snapshot is refreshed by every
 * build, so generating from it keeps the resolver and the CMS in lockstep.
 *
 * The generator is deliberately read-only about everything except its one
 * output file. Run `--check` to verify the committed module still matches the
 * snapshot (used by npm run check:guidekw in CI).
 *
 * Run: npm run seo:guide-categories
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SNAPSHOT = join(ROOT, "scripts", "cms-snapshots", "guides.json");
const OUTPUT = join(ROOT, "src", "data", "guideArticleCategories.generated.ts");
const HEADER = `// GENERATED FILE — do not edit. Run: npm run seo:guide-categories
// Source: scripts/cms-snapshots/guides.json (published guides only).
// The keyword resolver is path-only; this is its only view of the CMS taxonomy.
`;

function collect() {
  if (!existsSync(SNAPSHOT)) throw new Error(`missing CMS snapshot: ${SNAPSHOT}`);
  const rows = JSON.parse(readFileSync(SNAPSHOT, "utf8"));
  if (!Array.isArray(rows)) throw new Error("guides snapshot is not an array");
  const byCategory = new Map();
  for (const row of rows) {
    if (row?.status !== "published") continue;
    const slug = String(row?.slug || "").trim().toLowerCase();
    const category = String(row?.taxonomy?.productCategory || "").trim().toLowerCase();
    if (!slug || !category) continue;
    if (!byCategory.has(category)) byCategory.set(category, new Set());
    byCategory.get(category).add(slug);
  }
  return Object.fromEntries(
    [...byCategory.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([category, slugs]) => [category, [...slugs].sort()]),
  );
}

function render(map) {
  const body = Object.entries(map)
    .map(([category, slugs]) => `  ${JSON.stringify(category)}: [\n${slugs.map((s) => `    ${JSON.stringify(s)},`).join("\n")}\n  ],`)
    .join("\n");
  return `${HEADER}
export const GUIDE_SLUGS_BY_CATEGORY: Readonly<Record<string, readonly string[]>> = {
${body}
} as const;

/** Set form for O(1) lookup in the path-only keyword resolver. */
export const GUIDE_SLUG_CATEGORY: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(GUIDE_SLUGS_BY_CATEGORY).flatMap(([category, slugs]) =>
    slugs.map((slug) => [slug, category]),
  ),
);
`;
}

const check = process.argv.includes("--check");
const content = render(collect());
if (check) {
  const current = existsSync(OUTPUT) ? readFileSync(OUTPUT, "utf8") : "";
  if (current !== content) {
    console.error("check:guidekw — guideArticleCategories.generated.ts is stale; run npm run seo:guide-categories");
    process.exit(1);
  }
  const stroller = collect().stroller || [];
  console.log(`check:guidekw — generated module matches snapshot (${stroller.length} stroller slugs)`);
  process.exit(0);
}
writeFileSync(OUTPUT, content);
console.log(`seo:guide-categories — wrote ${Object.keys(collect()).length} categories to ${OUTPUT}`);
