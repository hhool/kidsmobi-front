// Generate src/data/scooterData.generated.ts from the site's CMS product snapshot.
//
// ONE generator for the whole kids-scooter cluster. Unlike the kids-bikes pages
// — which each grew their own fetch_*_data.mjs — the scooter set is 7 products
// in one category, so eight separate generators would re-parse the same seven
// records eight times and drift apart. One dataset, eight views.
//
// Source: scripts/cms-snapshots/products.json (the file the site itself renders
// from), narrowed to categoryId === "scooters" and then to the ids Stage-1 keeps.
//
// Three things this file exists to get right:
//
//  1. CATEGORY. categoryId "scooters" is the kids' kick-scooter set (7 rows).
//     The id namespace "scooters-*" also matches 6 rows filed under
//     categoryId "electric_vehicles" — adult e-scooters at 350W-1200W and
//     19-22mph, nothing to do with a 4-year-old. Filtering on the id prefix or
//     on category "scooter" pulls those in. Only categoryId separates them.
//
//  2. UNITS. The snapshot is not unit-consistent. Item Weight arrives as
//     "6 Pounds", "2.93 Kilograms", "4.08 Kilograms"; Wheel Size as
//     "4 Inches", "98 Millimeters", "4.72 Inches"; Handle Height as
//     "34 Inches". Every figure below is normalized to one unit and the raw
//     string is kept beside it, because the mixture is itself a finding the
//     pages report rather than hide.
//
//  3. RATINGS. The rating and review count are NOT in product.rating /
//     product.reviews — those are 0 for all 7 rows. They are inside
//     Product_Specifications.Item_Details["Customer Reviews"] as scraped
//     Amazon display text ("4.8  4.8 out of 5 stars   \n    (33,672)"). That
//     string is parsed here, and passed through the same plausibility ceiling
//     the rest of the site uses (src/lib/reviewSignal.ts, MAX_PLAUSIBLE_REVIEW_COUNT
//     = 200,000) so an implausible count is dropped rather than published.
//
// Usage: npm run data:scooters
//   (or: node scripts/fetch_scooter_data.mjs [snapshot.json] [out.ts])
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { publishedProducts } from "./lib/publishedProducts.mjs";

const repoRoot = resolve(process.cwd());
const exportPath = resolve(repoRoot, process.argv[2] || "scripts/cms-snapshots/products.json");
const outPath = resolve(repoRoot, process.argv[3] || "src/data/scooterData.generated.ts");

/** Mirrors MAX_PLAUSIBLE_REVIEW_COUNT in src/lib/reviewSignal.ts. */
const MAX_PLAUSIBLE_REVIEW_COUNT = 200_000;

const raw = JSON.parse(readFileSync(exportPath, "utf8"));
const allRows = Array.isArray(raw) ? raw : raw?.products || raw?.data?.collections?.products || [];
const { products } = publishedProducts(allRows);

const specs = (p) => p?.Product_Specifications || {};
const section = (p, key) => specs(p)[key] || {};
/** First non-empty value among the places a field can hide. */
const pick = (...vals) => {
  for (const v of vals) {
    const s = v === null || v === undefined ? "" : String(v).trim();
    if (s) return s;
  }
  return "";
};

function parseNumber(text) {
  if (!text) return null;
  const m = String(text).match(/-?\d+(?:\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}

/**
 * Weight to pounds. Handles "6 Pounds", "2.93 Kilograms", "6 lb", "2.8 kg",
 * "1.2 g". Anything unrecognised returns null rather than guessing — a missing
 * figure is honest, a mis-converted one is not.
 */
function toPounds(text) {
  if (!text) return null;
  const n = parseNumber(text);
  if (n === null) return null;
  const t = String(text).toLowerCase();
  if (/\bkg\b|kilogram/.test(t)) return Math.round(n * 2.2046226218 * 100) / 100;
  if (/\bg\b|gram/.test(t)) return Math.round((n / 1000) * 2.2046226218 * 100) / 100;
  if (/\blb\b|pound/.test(t)) return Math.round(n * 100) / 100;
  return null;
}

/** Length to inches, from "4 Inches", "98 Millimeters", "120 mm", "4.5 in". */
function toInches(text) {
  if (!text) return null;
  const n = parseNumber(text);
  if (n === null) return null;
  const t = String(text).toLowerCase();
  if (/\bmm\b|millimet/.test(t)) return Math.round((n / 25.4) * 100) / 100;
  if (/\bcm\b|centimet/.test(t)) return Math.round((n / 2.54) * 100) / 100;
  if (/\bm\b(?!m)/.test(t) && !/\bmil/.test(t)) return Math.round((n / 39.3701) * 100) / 100;
  if (/\binch|\bin\b|"/.test(t)) return Math.round(n * 100) / 100;
  return null;
}

/** Pounds of rider weight the listing claims to carry ("132 Pounds"). */
function toWeightLimitPounds(text) {
  const n = parseNumber(text);
  return n === null ? null : Math.round(n);
}

/**
 * "4.8  4.8 out of 5 stars   \n    (33,672)   \n\n\n 4.8 out of 5 stars"
 *   -> { rating: 4.8, reviewCount: 33672 }
 * Returns nulls when the count is absent or fails the plausibility ceiling.
 */
function parseCustomerReviews(text) {
  if (!text) return { rating: null, reviewCount: null };
  const flat = String(text).replace(/\s+/g, " ").trim();
  const ratingMatch = /(\d(?:\.\d)?)\s+out of 5 stars/i.exec(flat);
  const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;
  const countMatch = /\(\s*([\d,]+)\s*\)/.exec(flat);
  if (!countMatch) return { rating, reviewCount: null };
  const count = parseInt(countMatch[1].replace(/,/g, ""), 10);
  const credible = Number.isFinite(count) && count > 0 && count <= MAX_PLAUSIBLE_REVIEW_COUNT;
  return { rating, reviewCount: credible ? count : null };
}

/** "#586 in Sports & Outdoors ... #2 in Kick Scooters" -> 2 */
function parseCategoryRank(text) {
  if (!text) return null;
  const flat = String(text).replace(/\s+/g, " ");
  const inCategory = /#([\d,]+)\s+in\s+Kick\s+Scooters/i.exec(flat);
  if (inCategory) return parseInt(inCategory[1].replace(/,/g, ""), 10);
  return null;
}

/**
 * The retailer age labels are free text and not a numeric range:
 * "Youth", "Age6+", "Little Kid", "Toddler", "Kid", "2 years old+ Kids".
 * Only the ones carrying a digit can be turned into a lower bound, so the
 * pages report the label verbatim AND a parsed minimum age where one exists.
 */
function parseAgeLabel(text) {
  const label = pick(text);
  if (!label) return { label: "", minYears: null, numeric: false };
  const digits = label.match(/(\d+)\s*(?:years?|yrs?|yr)/i);
  if (digits) {
    return { label, minYears: parseInt(digits[1], 10), numeric: true };
  }
  const plusDigits = label.match(/(\d+)\s*\+/);
  if (plusDigits) {
    return { label, minYears: parseInt(plusDigits[1], 10), numeric: true };
  }
  return { label, minYears: null, numeric: false };
}

const rows = [];

for (const p of products) {
  // (1) category gate — see header. Do not widen this to the id namespace.
  if (p.categoryId !== "scooters") continue;

  const meas = section(p, "Measurements");
  const feat = section(p, "Features_Specs");
  const mat = section(p, "Materials_Care");
  const item = section(p, "Item_Details");
  const addl = section(p, "Additional_Details");
  const cat = p.Category_Attributes || {};

  const itemWeightRaw = pick(meas["Item Weight"]);
  const wheelSizeRaw = pick(cat["Wheel Size"], meas["Wheel Size"]);
  const handleHeightRaw = pick(meas["Handle Height"]);
  const weightLimitRaw = pick(meas["Weight Limit"], meas["Weight Capacity Maximum"], cat["Weight Limit"]);

  const ageRaw = pick(cat["Age Range Description"], cat["Age Range (Description)"], feat["Age Range Description"], feat["Age Range (Description)"]);
  const age = parseAgeLabel(ageRaw);

  const wheelCountRaw = pick(item["Number of Wheels"], cat["Number of Wheels"]);
  const wheelCount = wheelCountRaw ? parseInt(wheelCountRaw, 10) : null;

  const reviews = parseCustomerReviews(item["Customer Reviews"]);
  const rank = parseCategoryRank(item["Best Sellers Rank"]);

  rows.push({
    id: p.id,
    name: pick(p.name),
    brand: pick(item["Brand"], item["Brand Name"], cat["Brand"]),
    /**
     * Short model designation, used as the roster label instead of `name`.
     *
     * `name` is the retailer's full marketing title — 15+ words of "light-up
     * wheels, adjustable handlebar, wide anti-slip deck" per product. Rendering
     * it in all eight rosters put ~100 identical body 8-grams on every page pair
     * and failed check-topic-pair-drift (bodyOnly 0.103 > 0.08): the shared text
     * was product-name boilerplate, not editorial overlap, but the guard cannot
     * tell the difference. Brand + Model Name identifies the same product in two
     * or three words ("Razor A", "Gotrax KS1"), so the roster stays readable and
     * the pages stop tripping the duplication check.
     */
    model: pick(item["Model Name"]),
    slug: p.slug || null,
    price: typeof p.price === "number" ? p.price : parseNumber(p.price),
    // normalized + raw, so the unit-mixing stays visible to the pages
    itemWeightLb: toPounds(itemWeightRaw),
    itemWeightRaw,
    itemWeightUnit: /\bkilogram|\bkg\b/i.test(itemWeightRaw) ? "kg" : /\bpound|\blb\b/i.test(itemWeightRaw) ? "lb" : "",
    weightLimitLb: toWeightLimitPounds(weightLimitRaw),
    weightLimitRaw,
    wheelCount,
    wheelSizeIn: toInches(wheelSizeRaw),
    wheelSizeRaw,
    wheelSizeUnit: /\bmillimet|\bmm\b/i.test(wheelSizeRaw) ? "mm" : /\binch|\bin\b/i.test(wheelSizeRaw) ? "in" : "",
    handleHeightIn: toInches(handleHeightRaw),
    handleHeightRaw,
    // overall L x W x H, kept exactly as published (mixed decimal/rounded inches)
    productDimensions: pick(meas["Product Dimensions"], meas["Item Dimensions L x W x H"], meas["Item Dimensions"]),
    wheelMaterial: pick(mat["Wheel Material"], cat["Wheel Material"]),
    frameMaterial: pick(mat["Frame Material"], mat["Frame Material Type"], cat["Frame Material"]),
    brakeStyle: pick(addl["Brake Style"], cat["Brake Style"]),
    suspensionType: pick(feat["Suspension Type"], cat["Suspension Type"]),
    wheelType: pick(feat["Wheel Type"], cat["Wheel Type"]),
    handlebarType: pick(feat["Handlebar Type"]),
    specialFeature: pick(feat["Special Feature"]),
    gripType: pick(feat["Grip Type"]),
    recommendedUse: pick(feat["Recommended Uses For Product"]),
    color: pick(addl["Color"], cat["Color"]),
    ageLabel: age.label,
    ageMinYears: age.minYears,
    ageLabelNumeric: age.numeric,
    compliance: Array.isArray(p.compliance) ? p.compliance.filter(Boolean) : [],
    rating: reviews.rating,
    reviewCount: reviews.reviewCount,
    categoryRank: rank,
    customersSay: pick(p.customersSay, p.customers_say),
    description: pick(p.Product_Description),
  });
}

rows.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));

const publishedRows = products.length;
const count = (fn) => rows.filter(fn).length;

const wheels = {
  two: count((r) => r.wheelCount === 2),
  three: count((r) => r.wheelCount === 3),
  other: count((r) => r.wheelCount !== null && r.wheelCount !== 2 && r.wheelCount !== 3),
  unstated: count((r) => r.wheelCount === null),
};

const complianceTally = {};
for (const r of rows) {
  for (const c of r.compliance) complianceTally[c] = (complianceTally[c] || 0) + 1;
}

const dataset = {
  meta: {
    generatedAt: new Date().toISOString().slice(0, 10),
    source: "scripts/cms-snapshots/products.json (CMS product snapshot, filtered to categoryId=scooters, Stage-1 prune applied)",
    categoryId: "scooters",
    note:
      "One generator backs all eight kids-scooter asset pages. The rating/reviewCount pair is parsed out of " +
      'Product_Specifications.Item_Details["Customer Reviews"]; product.rating and product.reviews are 0 for all rows. ' +
      "Counts pass the same MAX_PLAUSIBLE_REVIEW_COUNT ceiling (200,000) the site applies elsewhere.",
  },
  totals: {
    publishedProducts,
    kidsScooters: rows.length,
    withPrice: count((r) => r.price !== null),
    withItemWeight: count((r) => r.itemWeightLb !== null),
    withWeightLimit: count((r) => r.weightLimitLb !== null),
    withWheelSize: count((r) => r.wheelSizeIn !== null),
    withHandleHeight: count((r) => r.handleHeightIn !== null),
    withAgeLabel: count((r) => r.ageLabel !== ""),
    withNumericAge: count((r) => r.ageMinYears !== null),
    withRating: count((r) => r.rating !== null),
    withReviewCount: count((r) => r.reviewCount !== null),
    withCategoryRank: count((r) => r.categoryRank !== null),
    withBrakeStyle: count((r) => r.brakeStyle !== ""),
    withSuspension: count((r) => r.suspensionType !== ""),
    withCompliance: count((r) => r.compliance.length > 0),
    distinctSummaries: new Set(rows.map((r) => r.customersSay).filter(Boolean)).size,
  },
  units: {
    // the mixture is a finding, not a formatting bug — pages report it
    itemWeightKgRows: count((r) => r.itemWeightUnit === "kg"),
    itemWeightLbRows: count((r) => r.itemWeightUnit === "lb"),
    wheelSizeMmRows: count((r) => r.wheelSizeUnit === "mm"),
    wheelSizeInRows: count((r) => r.wheelSizeUnit === "in"),
  },
  wheels,
  complianceTally,
  rows,
};

const banner =
  "// AUTO-GENERATED by scripts/fetch_scooter_data.mjs — do not edit by hand.\n" +
  "// Run `npm run data:scooters` to refresh.\n" +
  "// Backs all eight /kids-scooter-* asset pages; see the generator header for\n" +
  "// the category gate, unit normalisation and rating-extraction rules.\n";

writeFileSync(outPath, `${banner}export const SCOOTER_DATASET = ${JSON.stringify(dataset, null, 2)};\n`, "utf8");

console.log(`wrote ${outPath}`);
console.log(`  kids scooters: ${dataset.totals.kidsScooters} of ${publishedRows} published products`);
console.log(`  wheels: 2-wheel ${wheels.two} / 3-wheel ${wheels.three} / other ${wheels.other} / unstated ${wheels.unstated}`);
console.log(`  price ${dataset.totals.withPrice} · item weight ${dataset.totals.withItemWeight} · weight limit ${dataset.totals.withWeightLimit}`);
console.log(`  wheel size ${dataset.totals.withWheelSize} · handle height ${dataset.totals.withHandleHeight} · age label ${dataset.totals.withAgeLabel} (numeric ${dataset.totals.withNumericAge})`);
console.log(`  rating ${dataset.totals.withRating} · review count ${dataset.totals.withReviewCount} · category rank ${dataset.totals.withCategoryRank}`);
console.log(`  units — item weight: ${dataset.units.itemWeightKgRows} kg / ${dataset.units.itemWeightLbRows} lb · wheel size: ${dataset.units.wheelSizeMmRows} mm / ${dataset.units.wheelSizeInRows} in`);
console.log(`  compliance: ${Object.entries(complianceTally).map(([k, v]) => `${k} ${v}`).join(", ")}`);