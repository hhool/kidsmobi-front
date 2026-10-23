// Generate src/data/rideOnData.generated.ts from the site's CMS product snapshot.
//
// ONE generator for the whole kids-ride-on (electric car) cluster. Same shape
// as scripts/fetch_scooter_data.mjs: the products are few and the pages are
// many, so one dataset with several views beats one generator per page.
//
// Source: scripts/cms-snapshots/products.json (the file the site itself renders
// from), narrowed to the children's ride-on cars and then to the ids Stage-1
// keeps.
//
// Four things this file exists to get right:
//
//  1. CATEGORY. This is the tricky one. Three different CMS keys describe
//     ride-on toys, and none of them alone is the set we want:
//
//       - categoryId "electric_vehicles" also contains 6 ADULT e-scooters
//         (350W-1200W, 19-22mph) filed under category "scooter";
//       - categoryId "electric_vehicles" also contains 4 pedal push cars
//         filed under category "stroller" (VEVOR push car, Wiggle Car,
//         John Deere sit-n-scoot) — not electric at all;
//       - id prefix "electric_vehicles-" is the authoritative namespace for
//         the children's cars, and it matches 17 rows — one of which is a
//         CHILD BIKE HELMET whose categoryId is "kids_bikes" and whose
//         category was wrongly set to "electric_car".
//
//     The gate is therefore three conditions together: id namespace
//     "electric_vehicles-", category "electric_car", and categoryId
//     "electric_vehicles". The third condition is what removes the helmet;
//     dropping it would put a bike helmet on a page about ride-on cars.
//     Filtering on categoryId alone would mix 10 adult and pedal products in.
//
//  2. UNITS. The snapshot mixes pounds and kilograms for item weight
//     ("54.6 Pounds", "4.4 Kilograms"), and inches for dimensions. Every
//     figure is normalised to one unit and the raw string is kept beside it,
//     because the mixture is itself a finding the pages report rather than hide.
//
//  3. RATINGS. The rating and review count are NOT in product.rating /
//     product.reviews — those are 0 for every row. They sit inside
//     Product_Specifications.Item_Details["Customer Reviews"] as scraped
//     Amazon display text ("4.5  4.5 out of 5 stars   \n    (16,728)"). That
//     string is parsed here and passed through the same plausibility ceiling
//     the rest of the site uses (src/lib/reviewSignal.ts,
//     MAX_PLAUSIBLE_REVIEW_COUNT = 200,000) so an implausible count is dropped
//     rather than published.
//
//  4. VOLTAGE. "Size" on these listings is not a size — it is the battery
//     voltage and seat count ("12V", "24V - 2 Seater", "A-With Roof"). The
//     voltage is what separates a 12V wiggle car from a 36V two-seater, and it
//     drives the price, the footprint and the weight limit, so it is parsed
//     out here rather than left inside an opaque string.
//
//     Only 5 of the 16 listings state a voltage in a structured field. The
//     other 11 carry it in the product title ("ANPABO 3-in-1 Electric Push
//     Ride On Car, 12V Kids Ride On Toy"). The title is the retailer's own
//     wording and the voltage is a hard physical fact rather than a marketing
//     adjective, so the title is used as a second source — but the source of
//     each row is recorded, because "voltage stated in the title" is a weaker
//     claim than "voltage stated in the specification field" and the pages
//     report the difference rather than blending the two.
//
// Usage: npm run data:rideons
//   (or: node scripts/fetch_rideon_data.mjs [snapshot.json] [out.ts])
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { publishedProducts } from "./lib/publishedProducts.mjs";

const repoRoot = resolve(process.cwd());
const exportPath = resolve(repoRoot, process.argv[2] || "scripts/cms-snapshots/products.json");
const outPath = resolve(repoRoot, process.argv[3] || "src/data/rideOnData.generated.ts");

/** Mirrors MAX_PLAUSIBLE_REVIEW_COUNT in src/lib/reviewSignal.ts. */
const MAX_PLAUSIBLE_REVIEW_COUNT = 200_000;

/**
 * Upper age bound for the structured month fields, in months (18 years).
 *
 * The retailer field "Manufacturer Maximum Age (MONTHS)" is 1200 on the
 * Best Choice Products SKY9415 — one thousand two hundred months is a hundred
 * years, which is a data-entry slip rather than a statement about the child.
 * A ceiling is applied here so the age page cannot publish a nonsense upper
 * bound, and the affected row is counted separately so the pages can say how
 * many listings carried an implausible figure.
 */
const MAX_PLAUSIBLE_MAX_AGE_MONTHS = 216;

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
 * Weight to pounds. Handles "54.6 Pounds", "4.4 Kilograms", "13.78 lb",
 * "2.93 kg". Anything unrecognised returns null rather than guessing — a
 * missing figure is honest, a mis-converted one is not.
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

/** Length to inches, from "45.3\"L x 31.7\"W x 30.7\"H" or "55 x 34.6 x 31.5 inches". */
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
 * "45.3\"L x 31.7\"W x 30.7\"H" -> { l: 45.3, w: 31.7, h: 30.7 }
 * "55 x 34.6 x 31.5 inches" -> { l: 55, w: 34.6, h: 31.5 }
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

/** Pounds of rider weight the listing claims to carry ("132 Pounds"). */
function toWeightLimitPounds(text) {
  const n = parseNumber(text);
  return n === null ? null : Math.round(n);
}

/**
 * "4.5  4.5 out of 5 stars   \n    (16,728)   \n\n\n 4.5 out of 5 stars"
 *   -> { rating: 4.5, reviewCount: 16728 }
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
 * "#855 in Toys & Games ... #1 in Kids' Electric Vehicles" -> 1
 * The category rank in the category this page is about is the useful number;
 * the overall Toys & Games rank is a different scale.
 */
function parseCategoryRank(text) {
  if (!text) return null;
  const flat = String(text).replace(/\s+/g, " ");
  const inCategory = /#([\d,]+)\s+in\s+Kids'? Electric Vehicles/i.exec(flat);
  if (inCategory) return parseInt(inCategory[1].replace(/,/g, ""), 10);
  return null;
}

/**
 * The retailer's age labels are free text and not a numeric range:
 * "Kid", "3-8 years", "37-96 Months", "1.5-4 years old". Where the label
 * carries numbers they are converted to a month range, because
 * "Manufacturer Minimum Age (MONTHS)" is a real structured field on these
 * listings and is preferred when present.
 */
function parseAgeLabel(text) {
  const label = pick(text);
  if (!label) return { label: "", minYears: null, maxYears: null, numeric: false };
  const range = /(\d+(?:\.\d+)?)\s*(?:-|–|to)\s*(\d+(?:\.\d+)?)\s*year/i.exec(label);
  if (range) {
    return {
      label,
      minYears: parseFloat(range[1]),
      maxYears: parseFloat(range[2]),
      numeric: true,
    };
  }
  const months = /(\d+)\s*-\s*(\d+)\s*months?/i.exec(label);
  if (months) {
    return {
      label,
      minYears: Math.round((parseInt(months[1], 10) / 12) * 10) / 10,
      maxYears: Math.round((parseInt(months[2], 10) / 12) * 10) / 10,
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
 * "12V", "24V - 2 Seater", "36V" -> { voltage: 24, seats: 2 }
 * The Size field on these listings holds the battery voltage; the seat count
 * only appears on some of them and only when it is more than one.
 */
function parseVoltageAndSeats(text) {
  const label = pick(text);
  if (!label) return { voltage: null, seats: null, raw: "" };
  const vMatch = /\b(\d{1,3})\s*v(?:olt)?\b/i.exec(label);
  const sMatch = /\b(\d)\s*[- ]?seater\b/i.exec(label);
  return {
    voltage: vMatch ? parseInt(vMatch[1], 10) : null,
    seats: sMatch ? parseInt(sMatch[1], 10) : null,
    raw: label,
  };
}

/**
 * The same two values, read out of a product title.
 *
 * Only 5 of the 16 listings state the voltage in a structured field; the rest
 * carry it in the title ("ANPABO 3-in-1 Electric Push Ride On Car, 12V Kids
 * Ride On Toy"). Titles are the retailer's own wording, so this is a
 * legitimate second source — but a weaker one than a specification field, and
 * `voltageSource` records which was used for each row.
 *
 * "6V" is picked up by the same pattern: the Lil' Rider 3-wheel motorcycle is
 * a real 6V product, and treating 6V as unparseable would hide it.
 */
function parseVoltageFromTitle(title) {
  if (!title) return { voltage: null, seats: null };
  const flat = String(title).replace(/\s+/g, " ");
  // "24V", "24 Volt", "24-Volt" — but not "24V8" style part numbers.
  const vMatch = /(?:^|[^\d-])(\d{1,3})\s*[- ]?v(?:olt)?\b/i.exec(flat);
  const sMatch = /\b(\d)\s*[- ]?seater\b/i.exec(flat);
  return {
    voltage: vMatch ? parseInt(vMatch[1], 10) : null,
    seats: sMatch ? parseInt(sMatch[1], 10) : null,
  };
}

/**
 * "1.5 Hours", "122 minutes", "50 minutes", "1 Hour" -> minutes
 * Runtime is published in three different units across these listings; the
 * pages need one comparable number, and the raw string stays in the dataset.
 */
function toRuntimeMinutes(text) {
  if (!text) return null;
  const n = parseNumber(text);
  if (n === null) return null;
  const t = String(text).toLowerCase();
  if (/hour|\bh\b/.test(t)) return Math.round(n * 60);
  if (/min/.test(t)) return Math.round(n);
  return null;
}

const rows = [];

for (const p of products) {
  // (1) category gate — see header. Three conditions together: the id
  // namespace, the category, and the categoryId. The third is what removes a
  // bike helmet that was filed under category "electric_car".
  if (!String(p.id || "").startsWith("electric_vehicles-")) continue;
  if (p.category !== "electric_car") continue;
  if (p.categoryId !== "electric_vehicles") continue;

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
  const batteryLifeRaw = pick(feat["Battery Average Life"], cat["Battery Average Life"]);
  const ageRaw = pick(
    cat["Age Range Description"],
    item["Age Range Description"],
    feat["Age Range Description"]
  );

  const age = parseAgeLabel(ageRaw);
  const volt = parseVoltageAndSeats(sizeRaw);
  const titleVolt = parseVoltageFromTitle(p.name);
  // A structured field beats a title; the title is the fallback.
  const voltage = volt.voltage ?? titleVolt.voltage;
  const voltageSource = volt.voltage !== null ? "specification" : voltage !== null ? "title" : "";
  const seats = volt.seats ?? titleVolt.seats;
  const dims = parseDimensions(dimsRaw);
  const reviews = parseCustomerReviews(item["Customer Reviews"]);
  const rank = parseCategoryRank(item["Best Sellers Rank"]);

  // The structured month range is the strongest age signal on these listings.
  const rawMinAgeMonths = parseNumber(guide["Manufacturer Minimum Age (MONTHS)"]);
  const rawMaxAgeMonths = parseNumber(guide["Manufacturer Maximum Age (MONTHS)"]);
  // An implausible upper bound is dropped rather than published; the row is
  // still counted in totals.withImplausibleMaxAge so the page can report it.
  const minAgeMonths = rawMinAgeMonths;
  const maxAgeMonths =
    rawMaxAgeMonths !== null && rawMaxAgeMonths <= MAX_PLAUSIBLE_MAX_AGE_MONTHS
      ? rawMaxAgeMonths
      : null;
  const implausibleMaxAge = rawMaxAgeMonths !== null && maxAgeMonths === null;

  rows.push({
    id: p.id,
    name: pick(p.name),
    brand: pick(item["Brand Name"], item["Brand"], item["Manufacturer"], cat["Brand Name"]),
    /**
     * Short model designation, used as the roster label instead of `name`.
     *
     * `name` is the retailer's full marketing title — 15+ words of "12V 2
     * Seater Kids Electric Ride On Car with Remote, Music, LED" per product.
     * Rendering it in every roster put ~100 identical body 8-grams on every
     * page pair and failed check-topic-pair-drift. Brand + Model Name says the
     * same thing in two or three words ("ANPABO S323", "LIGIANT R9").
     *
     * See the `model` field comment in scripts/fetch_scooter_data.mjs.
     */
    model: pick(item["Model Number"], item["Manufacturer Part Number"], item["Model Name"]),
    slug: p.slug || null,
    price: typeof p.price === "number" ? p.price : parseNumber(p.price),
    itemWeightLb: toPounds(itemWeightRaw),
    itemWeightRaw,
    itemWeightUnit: /\bkilogram|\bkg\b/i.test(itemWeightRaw) ? "kg" : /\bpound|\blb\b/i.test(itemWeightRaw) ? "lb" : "",
    weightLimitLb: toWeightLimitPounds(weightLimitRaw),
    weightLimitRaw,
    lengthIn: dims.l,
    widthIn: dims.w,
    heightIn: dims.h,
    dimensionsRaw: dimsRaw,
    voltage,
    voltageSource,
    seats,
    sizeLabelRaw: volt.raw,
    batteryLifeMinutes: toRuntimeMinutes(batteryLifeRaw),
    batteryLifeRaw,
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
    customersSay: pick(p.customersSay, p.customers_say),
    description: pick(p.Product_Description),
  });
}

rows.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));

const publishedRows = products.length;
const count = (fn) => rows.filter(fn).length;

const volts = {
  v6: count((r) => r.voltage === 6),
  v12: count((r) => r.voltage === 12),
  v24: count((r) => r.voltage === 24),
  v36: count((r) => r.voltage === 36),
  other: count((r) => r.voltage !== null && ![6, 12, 24, 36].includes(r.voltage)),
  unstated: count((r) => r.voltage === null),
};

const complianceTally = {};
for (const r of rows) {
  for (const c of r.compliance) complianceTally[c] = (complianceTally[c] || 0) + 1;
}

const dataset = {
  meta: {
    generatedAt: new Date().toISOString().slice(0, 10),
    source:
      "scripts/cms-snapshots/products.json (CMS product snapshot, filtered to id namespace electric_vehicles-* AND category=electric_car, Stage-1 prune applied)",
    categoryId: "electric_vehicles",
    note:
      "One generator backs all eight kids-ride-on asset pages. The rating/reviewCount pair is parsed out of " +
      'Product_Specifications.Item_Details["Customer Reviews"]; product.rating and product.reviews are 0 for every row. ' +
      "Counts pass the same MAX_PLAUSIBLE_REVIEW_COUNT ceiling (200,000) the site applies elsewhere. " +
      'The "Size" field on these listings holds the battery voltage, not a size, so voltage and seat count are parsed out of it.',
  },
  totals: {
    publishedProducts,
    rideOnCars: rows.length,
    withPrice: count((r) => r.price !== null),
    withItemWeight: count((r) => r.itemWeightLb !== null),
    withWeightLimit: count((r) => r.weightLimitLb !== null),
    withDimensions: count((r) => r.lengthIn !== null && r.widthIn !== null),
    withVoltage: count((r) => r.voltage !== null),
    voltageFromSpec: count((r) => r.voltageSource === "specification"),
    voltageFromTitle: count((r) => r.voltageSource === "title"),
    withSeats: count((r) => r.seats !== null),
    withBatteryLife: count((r) => r.batteryLifeMinutes !== null),
    withAgeLabel: count((r) => r.ageLabel !== ""),
    withMinAgeMonths: count((r) => r.minAgeMonths !== null),
    withMaxAgeMonths: count((r) => r.maxAgeMonths !== null),
    withImplausibleMaxAge: count((r) => r.implausibleMaxAge),
    withRating: count((r) => r.rating !== null),
    withReviewCount: count((r) => r.reviewCount !== null),
    withCategoryRank: count((r) => r.categoryRank !== null),
    withAssembly: count((r) => r.assemblyRequired !== ""),
    withCompliance: count((r) => r.compliance.length > 0),
    distinctSummaries: new Set(rows.map((r) => r.customersSay).filter(Boolean)).size,
  },
  units: {
    // the mixture is a finding, not a formatting bug — pages report it
    itemWeightKgRows: count((r) => r.itemWeightUnit === "kg"),
    itemWeightLbRows: count((r) => r.itemWeightUnit === "lb"),
    runtimeHourRows: count((r) => /hour|\bh\b/i.test(r.batteryLifeRaw)),
    runtimeMinuteRows: count((r) => /min/i.test(r.batteryLifeRaw)),
  },
  volts,
  complianceTally,
  rows,
};

const banner =
  "// AUTO-GENERATED by scripts/fetch_rideon_data.mjs — do not edit by hand.\n" +
  "// Run `npm run data:rideons` to refresh.\n" +
  "// Backs all eight /kids-ride-on-* asset pages; see the generator header for\n" +
  "// the category gate, unit normalisation and rating-extraction rules.\n";

writeFileSync(outPath, `${banner}export const RIDE_ON_DATASET = ${JSON.stringify(dataset, null, 2)};\n`, "utf8");

console.log(`wrote ${outPath}`);
console.log(`  ride-on cars: ${dataset.totals.rideOnCars} of ${publishedRows} published products`);
console.log(
  `  voltage: 6V ${volts.v6} / 12V ${volts.v12} / 24V ${volts.v24} / 36V ${volts.v36} / other ${volts.other} / unstated ${volts.unstated}`
);
console.log(
  `  voltage source: specification ${dataset.totals.voltageFromSpec} / title ${dataset.totals.voltageFromTitle}`
);
console.log(
  `  price ${dataset.totals.withPrice} · item weight ${dataset.totals.withItemWeight} · weight limit ${dataset.totals.withWeightLimit}`
);
console.log(
  `  dimensions ${dataset.totals.withDimensions} · battery life ${dataset.totals.withBatteryLife} · seats ${dataset.totals.withSeats}`
);
console.log(
  `  age label ${dataset.totals.withAgeLabel} · min-age months ${dataset.totals.withMinAgeMonths} · max-age months ${dataset.totals.withMaxAgeMonths}`
);
console.log(
  `  rating ${dataset.totals.withRating} · review count ${dataset.totals.withReviewCount} · category rank ${dataset.totals.withCategoryRank}`
);
console.log(
  `  units — item weight: ${dataset.units.itemWeightKgRows} kg / ${dataset.units.itemWeightLbRows} lb · runtime: ${dataset.units.runtimeHourRows} h / ${dataset.units.runtimeMinuteRows} min`
);
console.log(`  compliance: ${Object.entries(complianceTally).map(([k, v]) => `${k} ${v}`).join(", ")}`);
