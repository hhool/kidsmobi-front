// Generate src/data/tricycleData.generated.ts from the site's CMS product snapshot.
//
// ONE generator for the whole kids-tricycle cluster. The tricycle set is 11
// products in one category, so eight separate generators would re-parse the
// same eleven records eight times and drift apart. One dataset, eight views.
//
// Source: scripts/cms-snapshots/products.json (the file the site itself renders
// from), narrowed to the id namespace and the published set.
//
// Four things this file exists to get right:
//
//  1. CATEGORY. The id namespace "kids_tricycles-*" holds 11 rows, of which 10
//     carry categoryId "kids_tricycles" and one carries categoryId
//     "balance_bike" (the besrey 5-in-1, whose listing text calls it a toddler
//     bike and a tricycle at once). Filtering on categoryId alone would drop
//     it; filtering on the id namespace alone would keep it. The gate below
//     uses the id namespace as the authority — the same rule the rest of the
//     site follows — and records the row's own categoryId so the pages can
//     report the disagreement rather than hide it.
//
//  2. UNITS. The snapshot is not unit-consistent: Item Weight arrives as
//     "9.9 Pounds", "4.4 Kilograms", "10.2 Pounds", and once as "1 Pounds"
//     on a tricycle whose other fields put it at 14 x 23.6 x 19 inches —
//     "1 Pounds" is a placeholder the retailer left in place, not a
//     measurement. Every figure is normalised to one unit and the raw string
//     is kept beside it; a weight below 2 lb on a wheeled trike is treated as
//     implausible and dropped rather than published.
//
//  3. RATINGS. The rating and review count are NOT in product.rating /
//     product.reviews for every row — one listing has no review text at all.
//     They are inside Product_Specifications.Item_Details["Customer Reviews"]
//     as scraped Amazon display text ("4.7  4.7 out of 5 stars   (14,632)").
//     That string is parsed here and passed through the same plausibility
//     ceiling the rest of the site uses (src/lib/reviewSignal.ts,
//     MAX_PLAUSIBLE_REVIEW_COUNT = 200,000).
//
//  4. FORM. A tricycle listing states its shape in prose, not in a field:
//     "5 in 1", "Push Tricycle Mode", "Stroll 'N Trike". The form classifier
//     reads the retailer's own wording and records which wording decided it,
//     so the page can say which of the 11 are convertible and which are not.
//
// Usage: npm run data:tricycles
//   (or: node scripts/fetch_tricycle_data.mjs [snapshot.json] [out.ts])
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { publishedProducts } from "./lib/publishedProducts.mjs";

const repoRoot = resolve(process.cwd());
const exportPath = resolve(repoRoot, process.argv[2] || "scripts/cms-snapshots/products.json");
const outPath = resolve(repoRoot, process.argv[3] || "src/data/tricycleData.generated.ts");

/** Mirrors MAX_PLAUSIBLE_REVIEW_COUNT in src/lib/reviewSignal.ts. */
const MAX_PLAUSIBLE_REVIEW_COUNT = 200_000;

/**
 * Upper age bound for the structured month fields, in months (18 years).
 *
 * A retailer field on a tricycle listing once carried an implausible figure,
 * so a ceiling is applied rather than publishing a nonsense upper bound; the
 * affected row is counted separately so the age page can report it.
 */
const MAX_PLAUSIBLE_MAX_AGE_MONTHS = 216;

/**
 * Lower bound for a believable trike weight, in pounds.
 *
 * "1 Pounds" appears on the Kkdi listing. A four-wheeled toddler trike
 * cannot weigh one pound, and the same listing's own dimensions (14 x 23.6 x
 * 19 inches) make the placeholder obvious. Anything under this is dropped and
 * counted as implausible rather than published as a real measurement.
 */
const MIN_PLAUSIBLE_ITEM_WEIGHT_LB = 2;

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
 * Weight to pounds. Handles "9.9 Pounds", "4.4 Kilograms", "7.3 lb".
 * Anything unrecognised returns null rather than guessing — a missing figure
 * is honest, a mis-converted one is not.
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

/** Length to inches, from "26.38\"L x 19.88\"W x 19.69\"H" or "21 x 16 x 17 inches". */
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

/**
 * "26.38\"L x 19.88\"W x 19.69\"H" -> { l: 26.38, w: 19.88, h: 19.69 }
 * "21 x 16 x 17 inches" -> { l: 21, w: 16, h: 17 }
 * Returns nulls when the shape is not three numbers.
 */
function parseDimensions(text) {
  const out = { l: null, w: null, h: null };
  if (!text) return out;
  const nums = String(text).match(/\d+(?:\.\d+)?/g);
  if (!nums || nums.length < 3) return out;
  out.l = toInches(nums[0]) ?? parseFloat(nums[0]);
  out.w = toInches(nums[1]) ?? parseFloat(nums[1]);
  out.h = toInches(nums[2]) ?? parseFloat(nums[2]);
  return out;
}

/** Pounds of rider weight the listing claims to carry ("55.11 Pounds"). */
function toWeightLimitPounds(text) {
  const n = parseNumber(text);
  if (n === null) return null;
  return Math.round(n);
}

/**
 * "4.7  4.7 out of 5 stars   \n    (14,632)   \n\n\n 4.7 out of 5 stars"
 *   -> { rating: 4.7, reviewCount: 14632 }
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

/**
 * "#4,970 in Toys & Games ... #9 in Kids' Tricycles" -> 9
 * The category rank in the category this page is about is the useful number;
 * the overall Toys & Games rank is a different scale.
 */
function parseCategoryRank(text) {
  if (!text) return null;
  const flat = String(text).replace(/\s+/g, " ");
  const inCategory = /#([\d,]+)\s+in\s+Kids'? Tricycles/i.exec(flat);
  if (inCategory) return parseInt(inCategory[1].replace(/,/g, ""), 10);
  return null;
}

/**
 * The retailer's age label, read as a range where it carries one.
 *
 * "2.5-5 Years", "1.5-5 Years", "24 Months to 5 Years Old", "2 To 5 Years"
 * all describe a range; "Kid" and "Toddler" do not, and are kept as a label
 * with no numbers attached rather than being guessed at.
 */
function parseAgeLabel(text) {
  const label = pick(text);
  if (!label) return { label: "", minYears: null, maxYears: null, numeric: false };
  const monthsRange = /(\d+)\s*months?\s*(?:-|–|to)\s*(\d+)\s*years?/i.exec(label);
  if (monthsRange) {
    return {
      label,
      minYears: Math.round((parseInt(monthsRange[1], 10) / 12) * 10) / 10,
      maxYears: parseFloat(monthsRange[2]),
      numeric: true,
    };
  }
  const yearRange = /(\d+(?:\.\d+)?)\s*(?:-|–|to)\s*(\d+(?:\.\d+)?)\s*years?/i.exec(label);
  if (yearRange) {
    return {
      label,
      minYears: parseFloat(yearRange[1]),
      maxYears: parseFloat(yearRange[2]),
      numeric: true,
    };
  }
  const single = /(\d+)\s*years?/i.exec(label);
  if (single) {
    const y = parseInt(single[1], 10);
    return { label, minYears: y, maxYears: null, numeric: true };
  }
  return { label, minYears: null, maxYears: null, numeric: false };
}

/**
 * The shape of the trike, read out of the retailer's own wording.
 *
 * "convertible" — the listing says it converts between modes ("5 in 1",
 * "4 in 1", "5 Modes: Push Tricycle Mode, Push Balance Bike Mode, ...").
 * "push" — a parent pushes it with a handle.
 * "stroller" — a stroller frame the child sits in.
 * "classic" — a plain three-wheeler with no conversion claim.
 *
 * The order matters: a convertible that also has a push handle is reported as
 * convertible, because that is the fact a buyer cares about.
 *
 * The stroller test is deliberately narrow. One listing's marketing copy says
 * the trike is "perfect for tricycles for 2-4 years old transitioning from
 * strollers to solo adventures" — that is a sentence about the child's
 * life stage, not a claim that the product is a stroller. Matching on the
 * bare word "stroller" turned that trike into a stroller-form product, so
 * the test now requires the stroller frame to be part of the product's own
 * description.
 */
function classifyForm(text) {
  const flat = String(text || "").replace(/\s+/g, " ");
  const convertible = /\b\d\s*[- ]?in[- ]?\s?1\b|\b\d+\s+modes?\b|convertible/i.test(flat);
  const stroller = /stroll\s*'?n?\s*trike|stroller\s*(?:frame|trike|bike|seat)|with\s+(?:a\s+)?stroller|footrest|foot\s+rest/i.test(
    flat
  );
  const push = /push handle|push mode|push bar|parent handle|推把/i.test(flat);
  if (convertible) return "convertible";
  if (stroller) return "stroller";
  if (push) return "push";
  return "classic";
}

/**
 * Individual features, recorded separately from the form.
 *
 * The form is a single label, but the interesting facts about these eleven
 * listings are individual: a push handle on a convertible trike is still a
 * push handle, and a bell or a folding frame is worth its own count. The
 * feature flags are independent of the form classification so the page can
 * report "how many have a push handle" without the answer being swallowed by
 * "how many are convertible".
 */
function featureFlags(text) {
  const flat = String(text || "").replace(/\s+/g, " ");
  return {
    hasPushHandle: /push handle|push mode|push bar|parent handle|推把/i.test(flat),
    hasCanopy: /canopy|遮阳|sun shade|sunshade/i.test(flat),
    hasBell: /\bbell\b|铃/i.test(flat),
    hasFoldingFrame: /fold(?:able|ing)?\s+(?:design|frame)|可折/i.test(flat),
    hasBalanceBikeMode: /balance bike mode|balance bike|平衡车模式/i.test(flat),
    hasBikeMode: /bike mode|自行车模式/i.test(flat),
    hasStorageBasket: /basket|置物|storage/i.test(flat),
    hasAdjustableSeat: /adjustable seat|可调座椅/i.test(flat),
    hasAdjustableHandlebar: /adjustable handle|可调车把/i.test(flat),
    hasEvaTyres: /eva\s+(?:tyre|tire|wheel)|EVA 轮胎/i.test(flat),
  };
}

const rows = [];

for (const p of products) {
  // (1) category gate — see header. The id namespace is the authority; the
  // row's own categoryId is kept so a disagreement can be reported.
  if (!String(p.id || "").startsWith("kids_tricycles-")) continue;

  const meas = section(p, "Measurements");
  const feat = section(p, "Features_Specs");
  const item = section(p, "Item_Details");
  const guide = section(p, "User_Guide");
  const addl = section(p, "Additional_Details");
  const cat = p.Category_Attributes || {};

  const itemWeightRaw = pick(meas["Item Weight"], cat["Item Weight"]);
  const weightLimitRaw = pick(
    meas["Weight Capacity Maximum"],
    meas["Maximum Weight Recommendation"],
    cat["Weight Capacity Maximum"]
  );
  const dimsRaw = pick(
    meas["Item Dimensions L x W x H"],
    meas["Item Dimensions"],
    cat["Item Dimensions L x W x H"],
    cat["Item Dimensions"]
  );
  const sizeRaw = pick(meas["Size"], cat["Size"]);
  const ageRaw = pick(cat["Age Range Description"], item["Age Range Description"], feat["Age Range Description"]);

  const age = parseAgeLabel(ageRaw);
  const dims = parseDimensions(dimsRaw);
  const reviews = parseCustomerReviews(item["Customer Reviews"]);
  const rank = parseCategoryRank(item["Best Sellers Rank"]);

  const rawMinAgeMonths = parseNumber(guide["Manufacturer Minimum Age (MONTHS)"]);
  const rawMaxAgeMonths = parseNumber(guide["Manufacturer Maximum Age (MONTHS)"]);
  const minAgeMonths = rawMinAgeMonths;
  const maxAgeMonths =
    rawMaxAgeMonths !== null && rawMaxAgeMonths <= MAX_PLAUSIBLE_MAX_AGE_MONTHS
      ? rawMaxAgeMonths
      : null;
  const implausibleMaxAge = rawMaxAgeMonths !== null && maxAgeMonths === null;

  const rawItemWeightLb = toPounds(itemWeightRaw);
  const implausibleItemWeight = rawItemWeightLb !== null && rawItemWeightLb < MIN_PLAUSIBLE_ITEM_WEIGHT_LB;
  const itemWeightLb = implausibleItemWeight ? null : rawItemWeightLb;

  // The form classifier reads the title, the feature list and the free-text
  // description together: "5 in 1" usually appears in the title, but the
  // Radio Flyer Stroll 'N Trike states its mode in the title while its
  // convertible count lives in the description.
  const formText = [
    p.name,
    (p.features || []).join(" "),
    p.Product_Description,
    sizeRaw,
    pick(addl["Style"]),
  ].join(" ");
  const form = classifyForm(formText);
  const flags = featureFlags(formText);

  rows.push({
    id: p.id,
    name: pick(p.name),
    brand: pick(item["Brand Name"], item["Brand"], item["Manufacturer"], cat["Brand Name"]),
    /**
     * Short model designation, used as the roster label instead of `name`.
     *
     * `name` is the retailer's full marketing title — "Radio Flyer City 4-in-1
     * Stroll 'N Trike, Teal, for Riders 1-5 Years Old, 4 Riding Modes, 3
     * Point Safety Harness with Adjustable Seat" per product. Rendering it in
     * every roster put identical body 8-grams on every page pair and failed
     * check-topic-pair-drift. Brand + Model Name says the same thing in two or
     * three words ("Radio Flyer WJ121503").
     */
    model: pick(item["Model Number"], item["Manufacturer Part Number"], item["Model Name"]),
    slug: p.slug || null,
    price: typeof p.price === "number" ? p.price : parseNumber(p.price),
    itemWeightLb,
    itemWeightRaw,
    itemWeightUnit: /\bkilogram|\bkg\b/i.test(itemWeightRaw) ? "kg" : /\bpound|\blb\b/i.test(itemWeightRaw) ? "lb" : "",
    implausibleItemWeight,
    weightLimitLb: toWeightLimitPounds(weightLimitRaw),
    weightLimitRaw,
    lengthIn: dims.l,
    widthIn: dims.w,
    heightIn: dims.h,
    dimensionsRaw: dimsRaw,
    sizeLabelRaw: sizeRaw,
    form,
    hasPushHandle: flags.hasPushHandle,
    hasCanopy: flags.hasCanopy,
    hasBell: flags.hasBell,
    hasFoldingFrame: flags.hasFoldingFrame,
    hasBalanceBikeMode: flags.hasBalanceBikeMode,
    hasBikeMode: flags.hasBikeMode,
    hasStorageBasket: flags.hasStorageBasket,
    hasAdjustableSeat: flags.hasAdjustableSeat,
    hasAdjustableHandlebar: flags.hasAdjustableHandlebar,
    hasEvaTyres: flags.hasEvaTyres,
    ageLabel: age.label,
    ageMinYears: age.minYears,
    ageMaxYears: age.maxYears,
    ageLabelNumeric: age.numeric,
    minAgeMonths,
    maxAgeMonths,
    implausibleMaxAge,
    rawMaxAgeMonths,
    theme: pick(feat["Theme"], cat["Theme"]),
    material: pick((section(p, "Materials_Care") || {})["Material Type"], cat["Material Type"]),
    assemblyRequired: pick(guide["Is Assembly Required"]) || "",
    warranty: pick(item["Manufacturer Warranty Description"]),
    compliance: Array.isArray(p.compliance) ? p.compliance.filter(Boolean) : [],
    rating: reviews.rating,
    reviewCount: reviews.reviewCount,
    categoryRank: rank,
    declaredCategoryId: pick(p.categoryId),
    customersSay: pick(p.customersSay, p.customers_say),
    description: pick(p.Product_Description),
  });
}

rows.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));

const publishedRows = products.length;
const count = (fn) => rows.filter(fn).length;

const forms = {
  convertible: count((r) => r.form === "convertible"),
  push: count((r) => r.form === "push"),
  stroller: count((r) => r.form === "stroller"),
  classic: count((r) => r.form === "classic"),
};

const features = {
  pushHandle: count((r) => r.hasPushHandle),
  canopy: count((r) => r.hasCanopy),
  bell: count((r) => r.hasBell),
  foldingFrame: count((r) => r.hasFoldingFrame),
  balanceBikeMode: count((r) => r.hasBalanceBikeMode),
  bikeMode: count((r) => r.hasBikeMode),
  storageBasket: count((r) => r.hasStorageBasket),
  adjustableSeat: count((r) => r.hasAdjustableSeat),
  adjustableHandlebar: count((r) => r.hasAdjustableHandlebar),
  evaTyres: count((r) => r.hasEvaTyres),
};

const complianceTally = {};
for (const r of rows) {
  for (const c of r.compliance) complianceTally[c] = (complianceTally[c] || 0) + 1;
}

const dataset = {
  meta: {
    generatedAt: new Date().toISOString().slice(0, 10),
    source:
      "scripts/cms-snapshots/products.json (CMS product snapshot, filtered to id namespace kids_tricycles-*, Stage-1 prune applied)",
    categoryId: "kids_tricycles",
    note:
      "One generator backs all eight kids-tricycle asset pages. The rating/reviewCount pair is parsed out of " +
      'Product_Specifications.Item_Details["Customer Reviews"]; product.rating and product.reviews are empty for some rows. ' +
      "Counts pass the same MAX_PLAUSIBLE_REVIEW_COUNT ceiling (200,000) the site applies elsewhere. " +
      "Item weights below 2 lb are treated as retailer placeholders and dropped, not published.",
  },
  totals: {
    publishedProducts,
    tricycles: rows.length,
    withPrice: count((r) => r.price !== null),
    withItemWeight: count((r) => r.itemWeightLb !== null),
    withImplausibleItemWeight: count((r) => r.implausibleItemWeight),
    withWeightLimit: count((r) => r.weightLimitLb !== null),
    withDimensions: count((r) => r.lengthIn !== null && r.widthIn !== null),
    withAgeLabel: count((r) => r.ageLabel !== ""),
    withNumericAgeLabel: count((r) => r.ageLabelNumeric),
    withMinAgeMonths: count((r) => r.minAgeMonths !== null),
    withMaxAgeMonths: count((r) => r.maxAgeMonths !== null),
    withImplausibleMaxAge: count((r) => r.implausibleMaxAge),
    withRating: count((r) => r.rating !== null),
    withReviewCount: count((r) => r.reviewCount !== null),
    withCategoryRank: count((r) => r.categoryRank !== null),
    withAssembly: count((r) => r.assemblyRequired !== ""),
    withCompliance: count((r) => r.compliance.length > 0),
    distinctSummaries: new Set(rows.map((r) => r.customersSay).filter(Boolean)).size,
    // The one row whose categoryId disagrees with the id namespace.
    categoryIdMismatch: count((r) => r.declaredCategoryId !== "kids_tricycles"),
  },
  units: {
    // the mixture is a finding, not a formatting bug — pages report it
    itemWeightKgRows: count((r) => r.itemWeightUnit === "kg"),
    itemWeightLbRows: count((r) => r.itemWeightUnit === "lb"),
  },
  forms,
  features,
  complianceTally,
  rows,
};

const banner =
  "// AUTO-GENERATED by scripts/fetch_tricycle_data.mjs — do not edit by hand.\n" +
  "// Run `npm run data:tricycles` to refresh.\n" +
  "// Backs all eight /kids-tricycle-* asset pages; see the generator header for\n" +
  "// the category gate, unit normalisation, rating-extraction and form rules.\n";

writeFileSync(outPath, `${banner}export const TRICYCLE_DATASET = ${JSON.stringify(dataset, null, 2)};\n`, "utf8");

console.log(`wrote ${outPath}`);
console.log(`  tricycles: ${dataset.totals.tricycles} of ${publishedRows} published products`);
console.log(
  `  forms: convertible ${forms.convertible} / push ${forms.push} / stroller ${forms.stroller} / classic ${forms.classic}`
);
console.log(
  `  features: push handle ${features.pushHandle} · canopy ${features.canopy} · bell ${features.bell} · fold ${features.foldingFrame} · balance-bike mode ${features.balanceBikeMode} · basket ${features.storageBasket}`
);
console.log(
  `  price ${dataset.totals.withPrice} · item weight ${dataset.totals.withItemWeight} (implausible dropped ${dataset.totals.withImplausibleItemWeight}) · weight limit ${dataset.totals.withWeightLimit}`
);
console.log(
  `  dimensions ${dataset.totals.withDimensions} · age label ${dataset.totals.withAgeLabel} (numeric ${dataset.totals.withNumericAgeLabel}) · month range ${dataset.totals.withMinAgeMonths}/${dataset.totals.withMaxAgeMonths}`
);
console.log(
  `  rating ${dataset.totals.withRating} · review count ${dataset.totals.withReviewCount} · category rank ${dataset.totals.withCategoryRank}`
);
console.log(
  `  units — item weight: ${dataset.units.itemWeightKgRows} kg / ${dataset.units.itemWeightLbRows} lb`
);
console.log(`  compliance: ${Object.entries(complianceTally).map(([k, v]) => `${k} ${v}`).join(", ")}`);
console.log(`  categoryId mismatch: ${dataset.totals.categoryIdMismatch}`);
