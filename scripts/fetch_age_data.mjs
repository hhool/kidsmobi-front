// Generate src/data/ageData.generated.ts from the site's CMS product snapshot.
//
// Plan-B Asset 7 (age fit). This answers the single largest intent cluster in
// Search Console: 27 of 68 queries — 63 of 171 impressions — carry an explicit
// child age ("balance bike for 2 year old", "best balance bikes for 4 year old",
// "balance bike 18 month old"). Nothing on the site was organised by the age of
// the child, so that demand landed on whichever page happened to rank.
//
// The age span of every row is read from the listing's OWN `classification.User_Age`
// field, which repeats the manufacturer's claim two or three times
// ("12–24 months | ages 12–24 months | 1-2 Years"). We keep the raw sentence so a
// reader can audit the parse, exactly as we do for the stability page's one
// published wheel-spacing figure.
//
// IMPORTANT: the top-level `ageRange` field ("0-8y") is identical for all 15
// balance bikes and is therefore unusable — never read it here.
//
// Usage:  npm run data:age   (or: node scripts/fetch_age_data.mjs [export.json] [out.ts])
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { publishedProducts } from "./lib/publishedProducts.mjs";

const repoRoot = resolve(process.cwd());
const exportPath = resolve(repoRoot, process.argv[2] || "doc/cms-export-1784286890682.json");
const outPath = resolve(repoRoot, process.argv[3] || "src/data/ageData.generated.ts");

const raw = JSON.parse(readFileSync(exportPath, "utf8"));
// Stage-1 duplicate prune: drop listings the site no longer publishes, keeping
// the survivor that absorbed each one. Otherwise these tables list one bike
// twice and quote a row count that includes a page nobody visits.
const { products } = publishedProducts(raw?.data?.collections?.products || []);

const CATEGORY_SLUG = {
  balance_bike: "balance-bikes",
};

/**
 * Pull the individual statements out of a listing instead of treating the field
 * as one string. `classification.User_Age` is usually several translations of
 * the same claim joined by " | ", and the numeric one is what we parse.
 */
function ageStatements(product) {
  const spec = product?.Product_Specifications || {};
  const combined = [
    spec.Features_Specs?.["Age Range"],
    product.ageRange,
    spec.Additional_Details?.["Decision Signals"],
  ]
    .filter(Boolean)
    .map((v) => (Array.isArray(v) ? v.join(" | ") : String(v)))
    .join(" | ");
  return String(combined)
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
}

/** "12-24 month" / "2 to 5 years" / "18-60 Months" -> [min, max] in months. */
function parseAgeMonths(text) {
  if (!text) return null;
  const lower = String(text).toLowerCase();
  const range = lower.match(/(\d+)\s*(?:[-–]|to)\s*(\d+)\s*(month|year|mo|yr|months|years)/);
  if (range) {
    const unit = range[3].startsWith("y") ? 12 : 1;
    return [parseInt(range[1], 10) * unit, parseInt(range[2], 10) * unit];
  }
  const single = lower.match(/(\d+)\s*(month|year|months|years)/);
  if (single) {
    const unit = single[2].startsWith("y") ? 12 : 1;
    const v = parseInt(single[1], 10) * unit;
    return [v, v];
  }
  return null;
}

function parseNumber(text, unitRe) {
  if (!text) return null;
  const m = String(text).match(unitRe);
  if (!m) return null;
  const n = parseFloat(m[1]);
  return Number.isFinite(n) ? n : null;
}

/** Months -> the label a parent would actually search for. */
function monthsToLabel(m) {
  if (m % 12 === 0) {
    const y = m / 12;
    return `${y} year${y === 1 ? "" : "s"}`;
  }
  return `${m} months`;
}

// The age bands parents actually type into a search box, drawn from this site's
// own query table rather than invented. 30 and 42 months are included because
// searches appear at 1.5 and 2.5 years.
const AGE_BANDS = [
  { months: 12, label: "1 year" },
  { months: 18, label: "18 months" },
  { months: 24, label: "2 years" },
  { months: 30, label: "2.5 years" },
  { months: 36, label: "3 years" },
  { months: 42, label: "3.5 years" },
  { months: 48, label: "4 years" },
  { months: 60, label: "5 years" },
];

const balanceBikes = products.filter((p) => p?.category === "balance_bike" && p?.status !== "draft");

const rows = [];
const unnamed = [];

for (const p of balanceBikes) {
  const spec = p?.Product_Specifications || {};
  const fs = spec.Features_Specs || {};
  const ms = spec.Measurements || {};
  const idt = spec.Item_Details || {};

  const statements = ageStatements(p);
  let min = null;
  let max = null;
  let evidence = null;
  for (const sentence of statements) {
    const parsed = parseAgeMonths(sentence);
    if (parsed) {
      min = parsed[0];
      max = parsed[1];
      evidence = sentence;
      break;
    }
  }

  const row = {
    id: p.id,
    brand: fs["Brand"] || p.brand || "",
    name: p.name || "",
    ageMinMonths: min,
    ageMaxMonths: max,
    quotedAgeRange: evidence,
    wheelInches: parseNumber(ms["Wheel Size"], /([\d.]+)\s*inche?/i),
    weightLbs: parseNumber(ms["Item Weight"], /([\d.]+)\s*(?:pound|lb)/i),
    priceUsd: parseNumber(ms["Price"], /\$([\d.,]+)/),
    rating: parseNumber(idt["Rating"], /([\d.]+)/),
    reviewCount: parseNumber(idt["Review Count"], /([\d,]+)/),
    productUrl: `/products/${CATEGORY_SLUG[p.category] || p.category}/${p.id}`,
  };

  if (min == null || max == null) unnamed.push(row);
  else rows.push(row);
}

rows.sort((a, b) => a.ageMinMonths - b.ageMinMonths || a.ageMaxMonths - b.ageMaxMonths || (b.reviewCount || 0) - (a.reviewCount || 0));

// For each band, which listings actually still cover that age? Counted against
// the rows that publish a range only — the ones that do not are listed
// separately rather than silently dropped from the denominator.
const bands = AGE_BANDS.map((band) => {
  const fit = rows
    .filter((r) => r.ageMinMonths <= band.months && band.months <= r.ageMaxMonths)
    .map((r) => r.id);
  return {
    months: band.months,
    label: band.label,
    searchLabel: monthsToLabel(band.months),
    fitCount: fit.length,
    fitIds: fit,
  };
});

const stated = rows.length;
const maxStated = rows.length ? Math.max(...rows.map((r) => r.ageMaxMonths)) : null;
const minStated = rows.length ? Math.min(...rows.map((r) => r.ageMinMonths)) : null;

const dataset = {
  source: {
    name: "BalanceBikeToddler CMS product specification snapshot",
    note:
      "Every age span is quoted from the manufacturer's own listing copy (the age field each retailer syncs), not measured or estimated by us. Verify against the manufacturer before purchase.",
    exportFile: exportPath.split(/[\\/]/).pop(),
    retrievedAt: new Date().toISOString().slice(0, 10),
  },
  catalog: {
    productsScanned: products.length,
    balanceBikesListed: balanceBikes.length,
    withStatedAgeRange: stated,
    withoutStatedAgeRange: unnamed.length,
  },
  coverage: {
    minStatedMonths: minStated,
    maxStatedMonths: maxStated,
    bands,
  },
  bikes: rows,
  unplaced: unnamed,
};

const ts = `// AUTO-GENERATED by scripts/fetch_age_data.mjs — do not edit by hand.
// Run \`npm run data:age\` to refresh from the CMS snapshot.
export const AGE_DATASET = ${JSON.stringify(dataset, null, 2)};
`;

writeFileSync(outPath, ts, "utf8");

console.log(
  `[data:age] ${dataset.catalog.balanceBikesListed} balance bikes listed, ${stated} publish a numeric age range, ${unnamed.length} do not.`,
);
console.log(
  `[data:age] coverage: ` +
    bands.map((b) => `${b.label}=${b.fitCount}`).join("  "),
);
console.log(`[data:age] written -> ${outPath}`);
