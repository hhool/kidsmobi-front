// Generate src/data/kidsBikeAgeData.generated.ts from the site's CMS product
// snapshot, filtered to kids_bikes.
//
// Kids-bikes mirror of scripts/fetch_age_data.mjs (Plan-B Asset 7, which only
// covers balance_bike). The kids-bikes age story is materially different from
// the balance-bike one: balance bikes span roughly 1-4 years, while kids bikes
// run 2-12 years across wheel sizes. Age is still the largest intent cluster
// on the property, so it deserves its own carrier page rather than being
// folded into the balance-bike one.
//
// Age spans are read from each listing's own classification/Features_Specs age
// field, which repeats the manufacturer's claim two or three times
// ("Kids | 2-9 Years | for 2-9 Years"). The raw sentence is kept so a reader
// can audit the parse. The top-level `ageRange` value is identical across the
// category and is therefore unusable — never read it here.
//
// Usage:  npm run data:kids-age   (or: node scripts/fetch_kids_age_data.mjs [export.json] [out.ts])
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { publishedProducts } from "./lib/publishedProducts.mjs";

const repoRoot = resolve(process.cwd());
const exportPath = resolve(repoRoot, process.argv[2] || "doc/cms-export-1784286890682.json");
const outPath = resolve(repoRoot, process.argv[3] || "src/data/kidsBikeAgeData.generated.ts");

const raw = JSON.parse(readFileSync(exportPath, "utf8"));
// Stage-1 duplicate prune: drop listings the site no longer publishes, keeping
// the survivor that absorbed each one. Otherwise these tables list one bike
// twice and quote a row count that includes a page nobody visits.
const { products } = publishedProducts(raw?.data?.collections?.products || []);

const CATEGORY_SLUG = {
  kids_bikes: "kids-bikes",
};

/**
 * Pull the individual statements out of a listing instead of treating the field
 * as one string. The age field is usually several translations of the same
 * claim joined by " | ", and the numeric one is what we parse.
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

// The age bands parents actually type into a search box. Kids bikes are
// marketed in whole years from 2 up, so the balance-bike band list (which
// included 18 and 30 months) would leave most of this catalogue uncounted.
const AGE_BANDS = [
  { months: 24, label: "2 years" },
  { months: 36, label: "3 years" },
  { months: 48, label: "4 years" },
  { months: 60, label: "5 years" },
  { months: 72, label: "6 years" },
  { months: 84, label: "7 years" },
  { months: 96, label: "8 years" },
  { months: 108, label: "9 years" },
  { months: 120, label: "10 years" },
  { months: 132, label: "11 years" },
  { months: 144, label: "12 years" },
];

const kidsBikes = products.filter((p) => p?.category === "kids_bikes" && p?.status !== "draft");

const rows = [];
const unnamed = [];

for (const p of kidsBikes) {
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
    kidsBikesListed: kidsBikes.length,
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

const ts = `// AUTO-GENERATED by scripts/fetch_kids_age_data.mjs — do not edit by hand.
// Run \`npm run data:kids-age\` to refresh from the CMS snapshot.
export const KIDS_AGE_DATASET = ${JSON.stringify(dataset, null, 2)};
`;

writeFileSync(outPath, ts, "utf8");

console.log(
  `[data:kids-age] ${dataset.catalog.kidsBikesListed} kids bikes listed, ${stated} publish a numeric age range, ${unnamed.length} do not.`,
);
console.log(
  `[data:kids-age] coverage: ` +
    bands.map((b) => `${b.label}=${b.fitCount}`).join("  "),
);
console.log(`[data:kids-age] written -> ${outPath}`);
