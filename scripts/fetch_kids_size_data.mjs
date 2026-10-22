// Generate src/data/kidsBikeSizeData.generated.ts from the site's CMS product snapshot.
//
// Plan-B Asset (sizing / spec comparison) for the kids-bikes category. The
// figures are NOT hand-written: every row is normalized from each product's
// specification record in the CMS export (synced from retailer/manufacturer
// listings). See src/data/kidsBikeSizing.ts for the methodology note and the
// "verify against the manufacturer" caveat.
//
// This is a category-filtered variant of scripts/fetch_size_data.mjs (which
// produces the balance-bike dataset). Keeping the two scripts separate avoids
// touching the already-shipping balance-bike pipeline.
//
// Usage:  npm run data:kids-sizing   (or: node scripts/fetch_kids_size_data.mjs [export.json] [out.ts])
import { readFileSync, writeFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { publishedProducts } from "./lib/publishedProducts.mjs";

const repoRoot = resolve(process.cwd());
const exportPath = resolve(repoRoot, process.argv[2] || "doc/cms-export-1784286890682.json");
const outPath = resolve(repoRoot, process.argv[3] || "src/data/kidsBikeSizeData.generated.ts");

const raw = JSON.parse(readFileSync(exportPath, "utf8"));
// Same Stage-1 prune filter as fetch_age_data.mjs — see scripts/lib/publishedProducts.mjs.
const { products } = publishedProducts(raw?.data?.collections?.products || []);

// category key -> site URL slug (mirrors src/lib/productCategoryPaths.ts)
const CATEGORY_SLUG = {
  balance_bike: "balance-bikes",
  kids_bikes: "kids-bikes",
  kids_tricycles: "kids-tricycles",
  electric_vehicles: "electric-cars",
  scooters: "kids-scooters",
  jogger_stroller: "joggers",
  double_stroller: "double-strollers",
  stroller: "strollers",
};

function parseAgeMonths(text) {
  if (!text) return null;
  const lower = String(text).toLowerCase();
  // explicit range: "12-24 month", "2 to 5 years", "10–36 month"
  const range = lower.match(/(\d+)\s*(?:[-–]|to)\s*(\d+)\s*(month|year|mo|yr|months|years)/);
  if (range) {
    const unit = range[3].startsWith("y") ? 12 : 1;
    return [parseInt(range[1], 10) * unit, parseInt(range[2], 10) * unit];
  }
  const single = lower.match(/(\d+)\s*(month|year|mo|yr|months|years)/);
  if (single) {
    const unit = single[2].startsWith("y") ? 12 : 1;
    const v = parseInt(single[1], 10) * unit;
    return [v, v];
  }
  return null;
}

function parseInches(text) {
  if (!text) return null;
  const m = String(text).match(/([\d.]+)\s*inche?/i);
  return m ? parseFloat(m[1]) : null;
}

function parsePounds(text) {
  if (!text) return null;
  const m = String(text).match(/([\d.]+)\s*(?:pound|lb)/i);
  return m ? parseFloat(m[1]) : null;
}

function parseUsd(text) {
  if (!text) return null;
  const m = String(text).match(/\$?\s*([\d.]+)/);
  return m ? parseFloat(m[1]) : null;
}

function parseSteering(text) {
  if (!text) return null;
  const m = String(text).match(/(\d{2,3})\s*°/);
  return m ? parseInt(m[1], 10) : null;
}

function normName(n) {
  return String(n || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

const rows = [];
const seen = new Set();
let withWheel = 0;
let withSteering = 0;

for (const p of products) {
  if (p.category !== "kids_bikes") continue;
  const ps = p.Product_Specifications || {};
  const fs = ps.Features_Specs || {};
  const ms = ps.Measurements || {};
  const idt = ps.Item_Details || {};
  const feat = (p.features || []).join(" | ");

  const ageText = [fs["Age Range"], p.ageRange].filter(Boolean).join(" | ");
  const age = parseAgeMonths(ageText);
  const wheel = parseInches(ms["Wheel Size"]);
  const weight = parsePounds(ms["Item Weight"]);
  const price = parseUsd(ms["Price"]);
  const steering = parseSteering(feat);
  const reviews = parseInt(String(idt["Review Count"] || "0").replace(/[^0-9]/g, ""), 10) || 0;
  const rating = parseFloat(String(idt["Rating"] || "").replace(/[^0-9.]/g, "")) || null;

  if (wheel) withWheel += 1;
  if (steering) withSteering += 1;

  const slug = CATEGORY_SLUG[p.category] || p.category;
  const key = normName(p.name);
  // keep the variant with the most reviews when a name is duplicated
  if (seen.has(key)) continue;
  seen.add(key);

  rows.push({
    id: p.id,
    brand: fs["Brand"] || p.brand || "",
    name: p.name || "",
    ageText: String(ageText || "").split("|").map((s) => s.trim()).filter(Boolean)[0] || "",
    ageMinMonths: age ? age[0] : null,
    ageMaxMonths: age ? age[1] : null,
    wheelInches: wheel,
    weightLbs: weight,
    frameMaterial: fs["Frame Material"] || "",
    steeringLimitDeg: steering,
    priceUsd: price,
    rating,
    reviewCount: reviews,
    productUrl: `/products/${slug}/${p.id}`,
  });
}

rows.sort((a, b) => (a.ageMinMonths ?? 999) - (b.ageMinMonths ?? 999) || (b.reviewCount - a.reviewCount));

const retrievedAt = new Date().toISOString().slice(0, 10);
const ageMins = rows.map((r) => r.ageMinMonths).filter((x) => x != null);
const ageMaxs = rows.map((r) => r.ageMaxMonths).filter((x) => x != null);

const dataset = {
  source: {
    name: "BalanceBikeToddler CMS product specification snapshot",
    note:
      "Each row is normalized from the product's specification record in the site's CMS, synced from retailer/manufacturer listings. Verify exact minimum seat height / fit against the manufacturer before purchase.",
    exportFile: exportPath.split(/[\\/]/).pop(),
    retrievedAt,
  },
  totals: {
    balanceBikesListed: rows.length,
    withWheelSize: withWheel,
    withSteeringLimit: withSteering,
  },
  ageSpreadMonths: {
    min: ageMins.length ? Math.min(...ageMins) : null,
    max: ageMaxs.length ? Math.max(...ageMaxs) : null,
  },
  bikes: rows,
};

const ts = `// AUTO-GENERATED by scripts/fetch_kids_size_data.mjs — do not edit by hand.
// Run \`npm run data:kids-sizing\` to refresh from the CMS snapshot.
export const KIDS_SIZING_DATASET = ${JSON.stringify(dataset, null, 2)};

export type KidsBikeSizingBike = (typeof KIDS_SIZING_DATASET.bikes)[number];
`;

writeFileSync(outPath, ts, "utf8");
console.log(
  `[kids-sizing] wrote ${rows.length} kids bikes (wheel:${withWheel}, steering:${withSteering}) -> ${outPath}`,
);
