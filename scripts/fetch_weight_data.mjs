// Generate src/data/weightData.generated.ts from the site's CMS product snapshot.
//
// Plan-B Asset 5 (weight & build). Nothing here is hand-written: every number is
// normalized from a product's specification record in the CMS export (synced from
// retailer/manufacturer listings). Where the source does not say something — brake
// type, tire type — the dataset records that it is unknown rather than guessing,
// and the page says so out loud.
//
// Usage:  npm run data:weight
//         (or: node scripts/fetch_weight_data.mjs [export.json] [out.ts])
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { publishedProducts } from "./lib/publishedProducts.mjs";
import { dirname, resolve } from "node:path";

const repoRoot = resolve(process.cwd());
const exportPath = resolve(repoRoot, process.argv[2] || "doc/cms-export-1784286890682.json");
const OUT_FILE = resolve(repoRoot, process.argv[3] || "src/data/weightData.generated.ts");

// Only the four categories a toddler actually rides. Scooters are left out on
// purpose: the set mixes kick scooters with electric ones (up to 37 lb), which
// would make the category median meaningless.
const CATEGORY_KEYS = ["balance_bike", "kids_bikes", "kids_tricycles", "kids_push_ride_ons"];

// A ride-on a toddler can straddle does not weigh 1 lb, and does not weigh 100 lb.
// Values outside this band are a listing error, not a product; they are pulled out
// of the medians and listed publicly instead of being quietly dropped.
const PLAUSIBLE_MIN_LB = 1.5;
const PLAUSIBLE_MAX_LB = 100;

const CATEGORY_SLUG = {
  balance_bike: "balance-bikes",
  kids_bikes: "kids-bikes",
  kids_tricycles: "kids-tricycles",
  kids_push_ride_ons: "ride-ons",
  kids_pull_along_wagons: "wagons",
  electric_vehicles: "electric-cars",
  scooters: "kids-scooters",
};

const EMPTY = new Set(["", "n/a", "na", "none", "null", "-", "0", "unknown", "unspecified"]);
const isEmpty = (v) => !v || EMPTY.has(String(v).trim().toLowerCase());

function median(nums) {
  if (!nums.length) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : round1((s[mid - 1] + s[mid]) / 2);
}
const round1 = (n) => Math.round(n * 10) / 10;

/** "3.5 Pounds" -> 3.5 ; "2.4 Kilograms" -> 5.3 (converted) */
function parseWeightLb(text) {
  if (isEmpty(text)) return null;
  const raw = String(text).trim();
  const num = parseFloat(raw.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(num) || num <= 0) return null;
  if (/kilo|\bkg\b/i.test(raw)) return round1(num * 2.20462);
  return round1(num);
}

function parseInches(text) {
  if (isEmpty(text)) return null;
  const m = String(text).match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : null;
}

function parsePrice(text) {
  if (isEmpty(text)) return null;
  const m = String(text).match(/(\d+(?:\.\d{1,2})?)/);
  return m ? parseFloat(m[1]) : null;
}

function shortName(name, max = 68) {
  const s = String(name || "").trim();
  return s.length <= max ? s : s.slice(0, max - 1).trimEnd() + "…";
}

const M = (p) => p?.Product_Specifications?.Measurements || {};
const F = (p) => p?.Product_Specifications?.Features_Specs || {};
const C = (p) => p?.Product_Specifications?.Materials_Care || {};
const D = (p) => p?.Product_Specifications?.Item_Details || {};

function summarize(weights) {
  if (!weights.length) return { n: 0, medianLb: null, minLb: null, maxLb: null };
  const s = [...weights].sort((a, b) => a - b);
  return { n: s.length, medianLb: median(s), minLb: s[0], maxLb: s[s.length - 1] };
}

async function main() {
  const raw = JSON.parse(readFileSync(exportPath, "utf8"));
  // Same Stage-1 prune filter as fetch_age_data.mjs — see scripts/lib/publishedProducts.mjs.
  const { products } = publishedProducts(raw?.data?.collections?.products || []);
  const retrievedAt = new Date().toISOString().slice(0, 10);

  const categories = [];
  const balanceBikes = [];
  const excludedSuspect = [];
  let productsScanned = 0;

  for (const key of CATEGORY_KEYS) {
    const rows = products.filter((p) => p.category === key);
    productsScanned += rows.length;

    const weights = [];
    for (const p of rows) {
      const lb = parseWeightLb(M(p)["Item Weight"]);
      if (lb == null) continue;
      if (lb < PLAUSIBLE_MIN_LB || lb > PLAUSIBLE_MAX_LB) {
        excludedSuspect.push({
          category: key,
          brand: p.brand || null,
          name: shortName(p.name),
          rawWeight: String(M(p)["Item Weight"]),
          reason:
            lb < PLAUSIBLE_MIN_LB
              ? "below 1.5 lb — lighter than a ride-on can be, almost certainly a listing error"
              : "above 100 lb — outside the range for a child-powered ride-on",
        });
        continue;
      }
      weights.push(lb);

      if (key === "balance_bike") {
        balanceBikes.push({
          id: p.id,
          brand: p.brand || null,
          name: shortName(p.name),
          weightLb: lb,
          frameMaterial: isEmpty(F(p)["Frame Material"]) ? null : F(p)["Frame Material"],
          wheelInches: parseInches(M(p)["Wheel Size"]),
          priceUsd: parsePrice(M(p)["Price"] ?? p.price),
          ageText: isEmpty(F(p)["Age Range"]) ? null : String(F(p)["Age Range"]).split("|").pop().trim(),
          rating: isEmpty(D(p)["Rating"]) ? null : parseFloat(D(p)["Rating"]),
          reviewCount: isEmpty(D(p)["Review Count"]) ? null : parseInt(String(D(p)["Review Count"]).replace(/[^0-9]/g, ""), 10),
          productUrl: `/products/${CATEGORY_SLUG[key]}/${p.id}`,
        });
      }
    }

    categories.push({
      key,
      listed: rows.length,
      withWeight: weights.length,
      ...summarize(weights),
      frameSpecified: rows.filter((p) => !isEmpty(F(p)["Frame Material"])).length,
      brakeSpecified: rows.filter((p) => !isEmpty(F(p)["Brake"])).length,
      tireSpecified: rows.filter((p) => !isEmpty(C(p)["Tire"])).length,
    });
  }

  balanceBikes.sort((a, b) => a.weightLb - b.weightLb);

  // Frame material -> weight, balance bikes only. Groups smaller than 3 are kept
  // but flagged so the page does not present them as a reliable comparison.
  const byFrame = new Map();
  for (const b of balanceBikes) {
    const k = b.frameMaterial || "Not specified";
    if (!byFrame.has(k)) byFrame.set(k, []);
    byFrame.get(k).push(b.weightLb);
  }
  const frameBreakdown = [...byFrame.entries()]
    .map(([material, w]) => ({ material, ...summarize(w), smallSample: w.length < 3 }))
    .sort((a, b) => (b.n ?? 0) - (a.n ?? 0));

  const bb = categories.find((c) => c.key === "balance_bike");
  const kb = categories.find((c) => c.key === "kids_bikes");
  const headline =
    bb?.medianLb != null && kb?.medianLb != null
      ? {
          balanceBikeMedianLb: bb.medianLb,
          kidsBikeMedianLb: kb.medianLb,
          lighterByLb: round1(kb.medianLb - bb.medianLb),
          ratio: round1(kb.medianLb / bb.medianLb),
        }
      : null;

  const dataset = {
    source: {
      name: "BalanceBikeToddler CMS product specification snapshot",
      exportFile: "cms-export-1784286890682.json",
      retrievedAt,
      note:
        "Each row is normalized from a product's specification record in the site's CMS, synced from retailer/manufacturer listings. Weights are as listed by the seller, not measured by us. Verify against the manufacturer before purchase.",
    },
    method: {
      categoriesIncluded: CATEGORY_KEYS,
      weightField: "Product_Specifications.Measurements['Item Weight']",
      plausibleBandLb: [PLAUSIBLE_MIN_LB, PLAUSIBLE_MAX_LB],
      scootersExcludedBecause:
        "the scooter set mixes kick scooters with electric ones (up to 37 lb), which would make a single median misleading",
      outlierPolicy: "values outside the plausible band are excluded from medians and listed publicly",
    },
    totals: {
      productsScanned,
      withWeight: categories.reduce((n, c) => n + c.withWeight, 0),
      balanceBikesListed: bb?.listed ?? 0,
      balanceBikesWithWeight: bb?.withWeight ?? 0,
      excludedSuspect: excludedSuspect.length,
    },
    headline,
    categories,
    balanceBikes,
    frameBreakdown,
    excludedSuspect,
  };

  mkdirSync(dirname(OUT_FILE), { recursive: true });
  writeFileSync(
    OUT_FILE,
    `// AUTO-GENERATED by scripts/fetch_weight_data.mjs — do not edit by hand.\n` +
      `// Run \`npm run data:weight\` to refresh from the CMS snapshot.\n` +
      `export const WEIGHT_DATASET = ${JSON.stringify(dataset, null, 2)};\n`,
    "utf8",
  );

  console.log(
    `[weight] wrote ${OUT_FILE}: scanned ${productsScanned} products across ` +
      `${CATEGORY_KEYS.length} categories, ${dataset.totals.withWeight} usable weights, ` +
      `${dataset.totals.excludedSuspect} suspect values excluded.`,
  );
  if (headline) {
    console.log(
      `[weight] balance bike median ${headline.balanceBikeMedianLb} lb vs pedal kids bike ` +
        `${headline.kidsBikeMedianLb} lb (${headline.lighterByLb} lb lighter, ${headline.ratio}x).`,
    );
  }
}

main().catch((err) => {
  console.error("[weight] failed:", err);
  process.exit(1);
});
