// Generate src/data/kidsBikePriceData.generated.ts from the site's CMS product
// snapshot, filtered to kids_bikes.
//
// Kids-bikes mirror of the price/budget angle. The balance-bike budget page
// (/balance-bike-budget/) is hand-scoped to balance bikes, whose price band is
// $30-$90; kids bikes run $85-$306, so the tiers and the conclusions are
// different and a separate carrier is warranted rather than a widened page.
//
// Every number is derived from the CMS snapshot so it can be recomputed. What
// the source does not state is reported as not stated, never interpolated.
//
// Usage:  npm run data:kids-price  (or: node scripts/fetch_kids_price_data.mjs [export.json] [out.ts])
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { publishedProducts } from "./lib/publishedProducts.mjs";

const repoRoot = resolve(process.cwd());
const exportPath = resolve(repoRoot, process.argv[2] || "doc/cms-export-1784286890682.json");
const outPath = resolve(repoRoot, process.argv[3] || "src/data/kidsBikePriceData.generated.ts");

const raw = JSON.parse(readFileSync(exportPath, "utf8"));
// Stage-1 duplicate prune: drop listings the site no longer publishes, keeping
// the survivor that absorbed each one.
const { products } = publishedProducts(raw?.data?.collections?.products || []);

const kidsBikes = products.filter((p) => p?.category === "kids_bikes" && p?.status !== "draft");

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

const rows = [];

for (const p of kidsBikes) {
  const spec = p?.Product_Specifications || {};
  const fs = spec.Features_Specs || {};
  const ms = spec.Measurements || {};
  const idt = spec.Item_Details || {};

  const ageStatements = [
    fs["Age Range"],
    p.ageRange,
    spec.Additional_Details?.["Decision Signals"],
  ]
    .filter(Boolean)
    .map((v) => (Array.isArray(v) ? v.join(" | ") : String(v)))
    .join(" | ")
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);

  let ageMin = null;
  let ageMax = null;
  let ageEvidence = null;
  for (const sentence of ageStatements) {
    const parsed = parseAgeMonths(sentence);
    if (parsed) {
      ageMin = parsed[0];
      ageMax = parsed[1];
      ageEvidence = sentence;
      break;
    }
  }

  rows.push({
    id: p.id,
    brand: fs["Brand"] || p.brand || "",
    name: p.name || "",
    material: String(fs["Frame Material"] || "").trim(),
    wheelInches: parseNumber(ms["Wheel Size"], /([\d.]+)\s*inche?/i),
    weightLbs: parseNumber(ms["Item Weight"], /([\d.]+)\s*(?:pound|lb)/i),
    priceUsd: parseNumber(ms["Price"], /\$([\d.,]+)/),
    ageMinMonths: ageMin,
    ageMaxMonths: ageMax,
    quotedAgeRange: ageEvidence,
    rating: parseNumber(idt["Rating"], /([\d.]+)/),
    reviewCount: parseNumber(idt["Review Count"], /([\d,]+)/),
    productUrl: `/products/kids-bikes/${p.id}`,
  });
}

const priced = rows.filter((r) => r.priceUsd != null).sort((a, b) => a.priceUsd - b.priceUsd);

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Price bands drawn from this catalogue's own spread, not invented round
// numbers: the observed range is ~$85 to ~$306, and the natural breaks fall
// at $100 and $150 where the listing count changes slope.
const BANDS = [
  { id: "under-100", label: "Under $100", min: 0, max: 100 },
  { id: "100-150", label: "$100 – $150", min: 100, max: 150 },
  { id: "150-250", label: "$150 – $250", min: 150, max: 250 },
  { id: "over-250", label: "Over $250", min: 250, max: Number.POSITIVE_INFINITY },
];

const bands = BANDS.map((band) => {
  const inBand = priced.filter((r) => r.priceUsd >= band.min && r.priceUsd < band.max);
  return {
    id: band.id,
    label: band.label,
    minUsd: band.min,
    maxUsd: band.max,
    count: inBand.length,
    medianWeightLb: median(inBand.map((r) => r.weightLbs).filter((v) => v != null)),
    wheelSizes: Array.from(new Set(inBand.map((r) => r.wheelInches).filter((v) => v != null))).sort((a, b) => a - b),
    ids: inBand.map((r) => r.id),
  };
});

const prices = priced.map((r) => r.priceUsd);
const weights = priced.map((r) => r.weightLbs).filter((v) => v != null);

const dataset = {
  source: {
    name: "BalanceBikeToddler CMS product specification snapshot",
    note:
      "Every price is the listed price from the CMS product specification snapshot, synced from retailer listings, read on the date below. Prices change; nothing here is measured by us.",
    exportFile: exportPath.split(/[\\/]/).pop(),
    retrievedAt: new Date().toISOString().slice(0, 10),
  },
  catalog: {
    productsScanned: products.length,
    kidsBikesListed: kidsBikes.length,
    withPrice: priced.length,
    withWeight: weights.length,
  },
  price: {
    minUsd: prices.length ? prices[0] : null,
    maxUsd: prices.length ? prices[prices.length - 1] : null,
    medianUsd: median(prices),
    medianWeightLb: median(weights),
    bands,
  },
  bikes: priced,
};

const ts = `// AUTO-GENERATED by scripts/fetch_kids_price_data.mjs — do not edit by hand.
// Run \`npm run data:kids-price\` to refresh from the CMS snapshot.
export const KIDS_PRICE_DATASET = ${JSON.stringify(dataset, null, 2)};
`;

writeFileSync(outPath, ts, "utf8");

console.log(
  `[data:kids-price] ${dataset.catalog.kidsBikesListed} kids bikes listed, ${dataset.catalog.withPrice} publish a price, ${dataset.catalog.withWeight} a weight.`,
);
console.log(
  `[data:kids-price] range $${dataset.price.minUsd} – $${dataset.price.maxUsd}, median $${dataset.price.medianUsd}.`,
);
console.log(
  `[data:kids-price] bands: ` + bands.map((b) => `${b.label}=${b.count}`).join("  "),
);
console.log(`[data:kids-price] written -> ${outPath}`);
