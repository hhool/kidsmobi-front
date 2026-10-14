// Generate src/data/reviewData.generated.ts from the site's CMS product snapshot.
//
// Plan-B Asset 2 (buyer feedback). Search Console shows 8 impressions across 5
// review-intent queries ("review", "reviews of balance bikes"), and the site had
// nothing for them because the catalogue carries no verbatim reviews.
//
// This generator does NOT invent reviews. What the catalogue genuinely has is
// one retailer-generated buyer-sentiment summary per listing (`customersSay`,
// the "Customers find…" paragraph already published on each product page). That
// is a real, citable artefact — and it is a SECOND-HAND summary, not a quote.
// So the asset built from it is an aggregation of what those summaries mention,
// with the provenance stated on the page itself.
//
// Everything here is a count over a documented keyword pattern, so a reader can
// audit every number by grepping the same words.
//
// Usage:  npm run data:reviews   (or: node scripts/fetch_review_data.mjs [snapshot.json] [out.ts])
//
// The default source is scripts/cms-snapshots/products.json — the file the
// prerender writes on every build from the live CMS API. The older
// doc/cms-export-*.json snapshots predate the `customersSay` field entirely and
// carry fewer listings, so reading one of those silently produces a table with
// the wrong denominator. (See the note at the bottom of this file.)
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { publishedProducts } from "./lib/publishedProducts.mjs";

const repoRoot = resolve(process.cwd());
const exportPath = resolve(repoRoot, process.argv[2] || "scripts/cms-snapshots/products.json");
const outPath = resolve(repoRoot, process.argv[3] || "src/data/reviewData.generated.ts");

const parsed = JSON.parse(readFileSync(exportPath, "utf8"));
const rawProducts = Array.isArray(parsed)
  ? parsed
  : parsed?.data?.collections?.products || [];

// Stage-1 + stage-2 prunes: count only listings the site still publishes, or
// every "N of M" sentence below is inflated by pages that only 301.
const { products } = publishedProducts(rawProducts);

const BALANCE_BIKE = "balance_bike";

const clean = (value) => String(value ?? "").replace(/\s+/g, " ").trim();

/**
 * Theme -> the exact surface forms counted.
 *
 * Deliberately literal rather than stemmed: "easy to assemble" is what the
 * summaries actually say, and a regex a reader can paste into a search box is
 * the only kind worth publishing. A summary can hit several themes, so these
 * counts are "mentions", never "share of opinion".
 */
const THEMES = [
  {
    id: "assembly",
    label: "Assembly",
    note: "the summary says it goes together easily, or needs no tools",
    patterns: [/easy to assemble/gi, /no tools?/gi, /clear instructions/gi, /easy assembly/gi],
  },
  {
    id: "build",
    label: "Build quality",
    note: "sturdiness, durability or a solid feel is mentioned",
    patterns: [/\bsturdy\b/gi, /\bdurable\b/gi, /well[- ]?(?:made|built|engineered)/gi, /\bsolid\b/gi, /good quality/gi],
  },
  {
    id: "weight",
    label: "Weight",
    note: "the bike being light — or heavy — comes up",
    patterns: [/lightweight/gi, /\blight\b/gi, /\bheavy\b/gi, /weight capacity/gi],
  },
  {
    id: "stability",
    label: "Stability",
    note: "tipping, balance or a stable footprint is discussed",
    patterns: [/\bstability\b/gi, /\bstable\b/gi, /tip(?:ping|s|ped)?\b/gi, /doesn'?t tip/gi],
  },
  {
    id: "ageFit",
    label: "Age fit",
    note: "the summary names the age the bike suited",
    patterns: [/\d+\s*(?:-|to|–)\s*\d+\s*(?:year|month)/gi, /for (?:one|two|three|1|2|3|4)[- ]year[- ]olds?/gi, /\d+[- ]month[- ]old/gi],
  },
  {
    id: "learning",
    label: "Learning to ride",
    note: "balance, coordination or confidence is named as an outcome",
    patterns: [/\bbalance\b/gi, /coordination/gi, /confidence/gi, /learn(?:ed|ing|s)? to (?:ride|balance)/gi],
  },
  {
    id: "noise",
    label: "Noise / wheels",
    note: "quiet wheels or wheel noise is called out",
    patterns: [/silent wheels/gi, /\bquiet\b/gi, /noisy/gi],
  },
  {
    id: "extras",
    label: "Lights, sound and extras",
    note: "light-up wheels, music, sounds or a basket get a mention",
    patterns: [/light(?:s|ing)? up/gi, /\blights?\b/gi, /\bmusic\b/gi, /sounds?\b/gi, /\bbasket\b/gi],
  },
];

/**
 * Hedging and disagreement markers.
 *
 * These summaries are written by the retailer's own tooling from its reviews,
 * and they lean positive. Counting the hedges is the honest counterweight: it
 * tells a reader how much of the corpus is unqualified praise.
 */
const HEDGES = [
  { id: "mixed", label: "mixed or split feedback", patterns: [/mixed (?:feedback|reviews?)/gi, /\bhowever\b/gi, /while (?:some|others)/gi, /some .{0,30}others/gi] },
  { id: "qualified", label: "attributed to a single buyer", patterns: [/one customer/gi, /some customers/gi, /one (?:noting|mentioning|reviewer)/gi] },
  { id: "negative", label: "an explicit drawback", patterns: [/downside/gi, /disappoint/gi, /difficult to/gi, /hard to/gi, /\bflimsy\b/gi, /too (?:small|big|heavy|light)\b/gi] },
];

function summarise(list) {
  return list
    .map((product) => ({
      id: clean(product?.id),
      name: clean(product?.en?.name || product?.name),
      summary: clean(product?.customersSay || product?.customers_say),
    }))
    .filter((entry) => entry.summary.length > 0);
}

function countThemes(entries) {
  return THEMES.map((theme) => {
    const hits = entries.filter((entry) =>
      theme.patterns.some((pattern) => {
        pattern.lastIndex = 0;
        return pattern.test(entry.summary);
      }),
    );
    return {
      id: theme.id,
      label: theme.label,
      note: theme.note,
      count: hits.length,
      examples: hits.slice(0, 2).map((entry) => entry.summary.slice(0, 180)),
    };
  }).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function countHedges(entries) {
  return HEDGES.map((hedge) => {
    const hits = entries.filter((entry) =>
      hedge.patterns.some((pattern) => {
        pattern.lastIndex = 0;
        return pattern.test(entry.summary);
      }),
    );
    return { id: hedge.id, label: hedge.label, count: hits.length };
  });
}

const allEntries = summarise(products);
const balanceEntries = summarise(products.filter((product) => product?.categoryId === BALANCE_BIKE));

/**
 * One listing is filed under balance bikes but its buyer summary describes a
 * tricycle. It is kept in the count (that is what the catalogue says) and
 * flagged, because silently dropping it would make the table cleaner than the
 * data is.
 */
// Only a tricycle counts as misfiled. A convertible bike whose pedals and
// training wheels snap on and off is sold in this category on purpose, so
// flagging "pedals" would produce a false positive.
const misfiled = balanceEntries
  .filter((entry) => /\btrikes?|tricycles?\b/i.test(entry.summary) && !/balance bike/i.test(entry.summary))
  .map((entry) => ({ id: entry.id, name: entry.name.slice(0, 90) }));

const distinctAll = new Set(allEntries.map((entry) => entry.summary)).size;
const distinctBalance = new Set(balanceEntries.map((entry) => entry.summary)).size;

const lengths = balanceEntries.map((entry) => entry.summary.length).sort((a, b) => a - b);
// True median: with an even sample the two middle values are averaged. Taking
// lengths[n/2] instead would report 393 rather than 391 for a 14-item set —
// off by two characters, and trivially checkable by anyone who counts them.
const median = !lengths.length
  ? 0
  : lengths.length % 2
    ? lengths[(lengths.length - 1) / 2]
    : Math.round((lengths[lengths.length / 2 - 1] + lengths[lengths.length / 2]) / 2);

const payload = {
  generatedFrom: "CMS product snapshot (customersSay), stage-1 + stage-2 pruned",
  publishedProducts: products.length,
  summariesPublished: allEntries.length,
  distinctSummaries: distinctAll,
  balanceBikesPublished: products.filter((p) => p?.categoryId === BALANCE_BIKE).length,
  balanceBikeSummaries: balanceEntries.length,
  distinctBalanceBikeSummaries: distinctBalance,
  medianSummaryChars: median,
  themes: countThemes(balanceEntries),
  hedges: countHedges(balanceEntries),
  misfiled,
  listings: balanceEntries.map((entry) => ({
    id: entry.id,
    name: entry.name.slice(0, 90),
    chars: entry.summary.length,
  })),
};

const ts = `// AUTO-GENERATED by scripts/fetch_review_data.mjs — do not edit by hand.
// Source: CMS product snapshot, field \`customersSay\` (one retailer-generated
// buyer-sentiment summary per listing), after the stage-1 and stage-2 prunes.
// Regenerate with: npm run data:reviews

export const REVIEW_DATASET = ${JSON.stringify(payload, null, 2)} as const;

export type ReviewDataset = typeof REVIEW_DATASET;
`;

writeFileSync(outPath, ts, "utf8");

console.log(
  `[data:reviews] ${payload.summariesPublished} summary(ies) of ${payload.publishedProducts} published listing(s); ` +
    `${payload.balanceBikeSummaries} balance bike(s), ${payload.distinctBalanceBikeSummaries} distinct.`,
);
console.log(`[data:reviews] wrote ${outPath}`);
for (const theme of payload.themes) {
  console.log(`  ${theme.label.padEnd(26)} ${theme.count}/${payload.balanceBikeSummaries}`);
}
console.log(
  `  ${"hedged or negative".padEnd(26)} ${payload.hedges.map((h) => `${h.id}=${h.count}`).join(" ")}`,
);
if (misfiled.length) console.log(`  misfiled listing(s): ${misfiled.map((m) => m.id).join(", ")}`);
