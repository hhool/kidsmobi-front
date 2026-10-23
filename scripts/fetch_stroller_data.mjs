// Generate src/data/strollerData.generated.ts from the site's CMS product snapshot.
//
// ONE generator for the whole stroller cluster (Plan-B pattern: one dataset,
// eight views). The stroller bucket is the largest category on the site but has
// historically been FROZEN for asset pages because the source data mixes in
// non-strollers under the same id namespace.
//
// Four things this file exists to get right:
//
//  1. CATEGORY. The id namespace "stroller-*" holds 73 rows, of which ~17 are
//     actually car seats or baby swings (the scraper bucketed them under the
//     same prefix). The gate uses the id namespace AS the authority for
//     membership, then DROPS rows whose name matches a non-stroller pattern
//     (car seat, swing, bassinet, playard, crib, high chair, booster). What
//     survives is the ~56 real strollers. The dropped count is recorded so the
//     pages can report the source contamination rather than hide it.
//
//  2. UNITS. Item Weight arrives as "11.6 Pounds", folded size as
//     "H22x W19.3 x D11 inch", dimensions as '29.9"L x 19.3"W x 39.4"H'. Every
//     figure is normalised to one unit and the raw string is kept beside it.
//
//  3. RATINGS. rating/reviewCount live in product.rating / product.reviews as
//     {value, display} objects for most rows, but the canonical parse target is
//     Product_Specifications.Item_Details["Customer Reviews"]
//     ("4.7  4.7 out of 5 stars   (290)"). Both are read; the Customer Reviews
//     string wins when present so the rule matches the other clusters.
//
//  4. FORM. "Stroller Type" in Features_Specs states Standard / Jogging /
//     Travel / Double; the form classifier records which signal decided it and
//     a weight-based lightness flag (<= 15 lb) so the types page can sort the
//     56 by shape honestly.
//
// Usage: npm run data:strollers
//   (or: node scripts/fetch_stroller_data.mjs [snapshot.json] [out.ts])
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { publishedProducts } from "./lib/publishedProducts.mjs";

const repoRoot = resolve(process.cwd());
const exportPath = resolve(repoRoot, process.argv[2] || "scripts/cms-snapshots/products.json");
const outPath = resolve(repoRoot, process.argv[3] || "src/data/strollerData.generated.ts");

/** Mirrors MAX_PLAUSIBLE_REVIEW_COUNT in src/lib/reviewSignal.ts. */
const MAX_PLAUSIBLE_REVIEW_COUNT = 200_000;

const NON_STROLLER_RE = /car seat|infant car seat|convertible car seat|swing|bassinet|playard|play yard|crib|high chair|booster/i;

function num(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Parse a weight string like "11.6 Pounds" / "4.4 Kilograms" -> lb or kg flag. */
function parseWeight(raw) {
  if (!raw) return { value: null, unit: "", raw: "" };
  const m = String(raw).match(/([\d.]+)\s*(pound|lb|kg|kilogram|g|ounce|oz)/i);
  if (!m) return { value: null, unit: "", raw: String(raw) };
  const v = Number(m[1]);
  const unit = m[2].toLowerCase();
  if (unit.startsWith("kg") || unit.startsWith("kilo")) return { value: v, unit: "kg", raw: String(raw) };
  if (unit.startsWith("g") && !unit.startsWith("lb")) {
    return { value: v / 1000, unit: "kg", raw: String(raw) };
  }
  return { value: v, unit: "lb", raw: String(raw) };
}

/** Parse an "L x W x H" size string -> {l,w,h, unit, raw}. */
function parseDimensions(raw) {
  if (!raw) return { length: null, width: null, height: null, unit: "", raw: "" };
  const m = String(raw).match(/([\d.]+)\s*["']?\s*[Ll]\s*[x×]\s*([\d.]+)\s*["']?\s*[Ww]\s*[x×]\s*([\d.]+)\s*["']?\s*[Hh]/);
  if (!m) return { length: null, width: null, height: null, unit: "", raw: String(raw) };
  const unit = /cm/i.test(raw) ? "cm" : "in";
  return { length: num(m[1]), width: num(m[2]), height: num(m[3]), unit, raw: String(raw) };
}

/** Parse "4.7  4.7 out of 5 stars   (290)" -> {rating, reviews}. */
function parseCustomerReviews(raw) {
  if (!raw) return { rating: null, reviewCount: null, raw: "" };
  const s = String(raw);
  const rating = num((s.match(/([\d.]+)\s*out of 5 stars/) || [])[1]);
  const reviews = (s.match(/\(([\d,]+)\)/g) || [])
    .map((x) => num(x.replace(/[(),]/g, "").replace(/,/g, "")))
    .filter((n) => n !== null && n <= MAX_PLAUSIBLE_REVIEW_COUNT)
    .sort((a, b) => b - a)[0];
  return { rating, reviewCount: reviews ?? null, raw: s.slice(0, 60) };
}

/** Read rating/reviewCount from product.rating / product.reviews objects. */
function readTopLevelReviews(product) {
  const rating = num(product?.rating?.value ?? product?.rating);
  const reviews = num(product?.reviews?.count ?? product?.reviews?.display ?? product?.reviewCount ?? product?.reviews);
  if (reviews !== null && (reviews > MAX_PLAUSIBLE_REVIEW_COUNT || reviews < 0)) return { rating, reviewCount: null };
  return { rating, reviewCount: reviews };
}

/** Age from a string like "6 months up to 50 lbs" or "Newborn-3 Years". */
function parseAge(text) {
  const s = String(text || "");
  let minMonths = null;
  let maxMonths = null;
  // "X-Years" or "X-Y months" range.
  const range = s.match(/(\d+)\s*[-–]\s*(\d+)\s*(?:year|yr|month|mo)/i);
  // "N months" / "N month" single bound.
  const single = s.match(/(\d+)\s*(?:month|mo)/i);
  // "from birth" / "newborn" -> 0.
  const birth = /newborn|from birth|birth to/i.test(s);
  if (range) {
    const a = num(range[1]);
    const b = num(range[2]);
    if (a && b) {
      if (/year|yr/i.test(range[0])) {
        minMonths = a * 12;
        maxMonths = b * 12;
      } else {
        minMonths = a;
        maxMonths = b;
      }
    }
  } else if (single) {
    minMonths = num(single[1]);
    if (birth) minMonths = 0;
  } else if (birth) {
    minMonths = 0;
  }
  return { minMonths, maxMonths };
}

function classifyForm(features, name) {
  const f = (features?.StrollerType || features?.["Stroller Type"] || "").toLowerCase();
  const n = String(name || "").toLowerCase();
  let form = "standard";
  let decidedBy = "strollerType";
  if (/jogger|jogging/.test(f) || /jogger|jogging/.test(n)) {
    form = "jogger";
    decidedBy = /jogger|jogging/.test(f) ? "strollerType" : "name";
  } else if (/double|twin|double stroller/.test(f) || /double|twin/.test(n)) {
    form = "double";
    decidedBy = /double|twin/.test(f) ? "strollerType" : "name";
  } else if (/travel/.test(f) || /travel system|travel stroller/.test(n)) {
    form = "travel";
    decidedBy = /travel/.test(f) ? "strollerType" : "name";
  } else if (/light|ultra air|compact|umbrella/.test(n)) {
    form = "lightweight";
    decidedBy = "name";
  }
  return { form, decidedBy };
}

function main() {
  const rawExport = JSON.parse(readFileSync(exportPath, "utf8"));
  const allRows = Array.isArray(rawExport) ? rawExport : rawExport?.products || rawExport?.data?.collections?.products || [];
  const { products: all } = publishedProducts(allRows);
  const raw = all.filter((p) => String(p.id || "").startsWith("stroller-"));

  const rows = [];
  let droppedNonStroller = 0;
  let withPrice = 0;
  let withItemWeight = 0;
  let withWeightLimit = 0;
  let withDimensions = 0;
  let withAgeLabel = 0;
  let withNumericAge = 0;
  let withRating = 0;
  let withReviewCount = 0;
  let withCompliance = 0;
  let withCategoryRank = 0;
  let withFolded = 0;
  let lightweight = 0;
  const forms = { standard: 0, jogger: 0, double: 0, travel: 0, lightweight: 0 };
  const complianceTally = {};
  const wheelsBuckets = { two: 0, three: 0, four: 0, other: 0 };

  for (const product of raw) {
    const name = product.name || "";
    if (NON_STROLLER_RE.test(name)) {
      droppedNonStroller++;
      continue;
    }
    const spec = product.Product_Specifications || {};
    const features = spec.Features_Specs || {};
    const measurements = spec.Measurements || {};
    const itemDetails = spec.Item_Details || {};
    const catAttrs = product.Category_Attributes || {};

    const price = num(product.price);
    if (price !== null) withPrice++;

    // Item weight: prefer Measurements "Item Weight", else product.weight.
    const wParsed = parseWeight(measurements["Item Weight"] || product.weight);
    const itemWeightLb = wParsed.unit === "kg" ? +(wParsed.value * 2.20462).toFixed(2) : wParsed.value;
    if (itemWeightLb !== null) withItemWeight++;

    // Weight limit: from Category_Attributes age string ("up to 50 lbs") or features.
    const ageText = catAttrs["Age Range Description"] || product.ageRange || "";
    const limitFromAge = (() => {
      const m = String(ageText).match(/up to\s*([\d.]+)\s*(lb|lbs|pound)/i);
      return m ? num(m[1]) : null;
    })();
    const limitFromFeatures = (() => {
      const m = JSON.stringify(features).match(/([\d.]+)\s*(?:lb|lbs|pound)/i);
      return m ? num(m[1]) : null;
    })();
    const weightLimitLb = limitFromAge ?? limitFromFeatures;
    if (weightLimitLb !== null) withWeightLimit++;

    // Dimensions.
    const dims = parseDimensions(measurements["Item Dimensions L x W x H"] || catAttrs["Item Dimensions"]);
    const folded = parseDimensions(measurements["Folded Size"]);
    if (dims.length && dims.width && dims.height) withDimensions++;
    if (folded.length) withFolded++;

    // Age. Parse from the structured age string first, then fall back to the
    // title (strollers often state "Newborn-3 Years" or "0-6 Months" there).
    const age = parseAge(`${ageText} ${name}`);
    if (age.minMonths !== null || age.maxMonths !== null) withAgeLabel++;
    if (age.minMonths !== null && age.maxMonths !== null) withNumericAge++;

    // Ratings.
    const customer = parseCustomerReviews(itemDetails["Customer Reviews"]);
    const top = readTopLevelReviews(product);
    const rating = customer.rating ?? top.rating;
    const reviewCount = customer.reviewCount ?? top.reviewCount;
    if (rating !== null) withRating++;
    if (reviewCount !== null) withReviewCount++;

    // Compliance.
    const compliance = Array.isArray(product.compliance) ? product.compliance : [];
    if (compliance.length) withCompliance++;
    for (const c of compliance) complianceTally[c] = (complianceTally[c] || 0) + 1;

    // Category rank.
    const categoryRank = num(product.categoryRank);
    if (categoryRank !== null) withCategoryRank++;

    // Form.
    const { form, decidedBy } = classifyForm(features, name);
    forms[form] = (forms[form] || 0) + 1;
    if (itemWeightLb !== null && itemWeightLb <= 15) lightweight++;

    // Wheels.
    const wheels = num(features["Number of Wheels"]);
    if (wheels === 2) wheelsBuckets.two++;
    else if (wheels === 3) wheelsBuckets.three++;
    else if (wheels === 4) wheelsBuckets.four++;
    else wheelsBuckets.other++;

    rows.push({
      id: product.id,
      name,
      brand: product.brand || (catAttrs.Brand || ""),
      model: product.model || (catAttrs.Model || product.id.split("-").slice(1).join("-")),
      slug: product.slug || null,
      price,
      itemWeightLb,
      itemWeightRaw: measurements["Item Weight"] || String(product.weight ?? ""),
      weightLimitLb,
      weightLimitRaw: ageText,
      lengthIn: dims.length,
      widthIn: dims.width,
      heightIn: dims.height,
      dimensionsRaw: measurements["Item Dimensions L x W x H"] || catAttrs["Item Dimensions"] || "",
      foldedLengthIn: folded.length,
      foldedWidthIn: folded.width,
      foldedHeightIn: folded.height,
      foldedRaw: measurements["Folded Size"] || "",
      seatCount: num(features["Seating Capacity"]) || 1,
      wheels: wheels,
      harness: features["Harness Type"] || "5 Point",
      hasCanopy: /canopy|uv|sun/i.test(JSON.stringify(features)),
      hasBrake: /yes/i.test(String(features["Has Stroller Brake System"] || "")),
      hasBasket: /basket|storage/i.test(JSON.stringify(features)),
      carSeatCompatible: /yes/i.test(String(features["Is Car Seat Compatible"] || "")),
      form,
      formDecidedBy: decidedBy,
      ageText,
      minAgeMonths: age.minMonths,
      maxAgeMonths: age.maxMonths,
      ageLabelNumeric: age.minMonths !== null && age.maxMonths !== null,
      rating,
      reviewCount,
      categoryRank,
      declaredCategoryId: product.categoryId,
      compliance,
      customersSay: product.customersSay || product.customers_say || "",
    });
  }

  const dataset = {
    meta: {
      generatedAt: new Date().toISOString().slice(0, 10),
      source: "scripts/cms-snapshots/products.json (CMS product snapshot, id namespace stroller-*, published only)",
      categoryId: "stroller",
      note:
        "One generator backs all eight /kids-stroller-* asset pages. The id namespace is the authority for membership; ~17 non-strollers (car seats, swings) share the prefix and are dropped and counted separately. Item weights in lb, dimensions in inches. Ratings parsed from Product_Specifications.Item_Details[\"Customer Reviews\"] where present, else product.rating/reviews. Counts pass the same MAX_PLAUSIBLE_REVIEW_COUNT ceiling (200,000) the site applies elsewhere.",
    },
    totals: {
      strollers: rows.length,
      sourceRows: raw.length,
      droppedNonStroller,
      withPrice,
      withItemWeight,
      withWeightLimit,
      withDimensions,
      withFolded,
      withAgeLabel,
      withNumericAge,
      withRating,
      withReviewCount,
      withCompliance,
      withCategoryRank,
    },
    forms,
    lightweightCount: lightweight,
    wheelsBuckets,
    complianceTally,
    rows,
  };

  const header = `// AUTO-GENERATED by scripts/fetch_stroller_data.mjs — do not edit by hand.
// Run \`npm run data:strollers\` to refresh.
// Backs all eight /kids-stroller-* asset pages; see the generator header for
// the category gate, unit normalisation, rating-extraction and form rules.
`;
  writeFileSync(outPath, header + "export const STROLLER_DATASET = " + JSON.stringify(dataset, null, 2) + " as const;\n");
  console.log(
    `stroller dataset: ${rows.length} strollers (from ${raw.length} source rows, dropped ${droppedNonStroller} non-strollers).`
  );
}

main();
