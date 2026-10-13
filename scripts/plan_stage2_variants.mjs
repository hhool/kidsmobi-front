// Stage-2 variant consolidation (Plan-B): several published detail pages are
// the SAME manufacturer model listed under different colourways. Stage 1 could
// not merge them — their scraped descriptions differ enough that neither looks
// like a copy of the other — so they survived as separate URLs that then needed
// an Amazon ASIN in the <title> to be told apart.
//
// What makes this different from Stage 1
// --------------------------------------
// Stage 1 matched each listing's own copy (≥55% 4-word shingle overlap) and so
// only caught re-listed identical records. Stage 2 does not compare copy at
// all: it trusts the manufacturer's own identifier,
// Product_Specifications.Item_Details["Model Number"]. "S66" is printed by
// MAMAZING; five separate listings carry it. That is not an inference about
// writing style, it is the product telling us it is one product.
//
// Three guards keep it conservative
// ---------------------------------
//  - SAME CATEGORY + SAME BRAND + NON-EMPTY MODEL NUMBER only.
//  - NAME SIMILARITY ≥ 0.65 against the survivor as well. This is what kept the
//    "First Ride On Ford Bronco 24V" pair apart: it shares model number FB001
//    but scores 0.474 (a 2-seater vs a licensed Raptor), so it stays published.
//  - SURVIVOR = MOST REVIEWED LISTING, the parent listing a reader is most
//    likely looking for. Nothing is deleted: every retired URL gets a 301.
//
// Usage:
//   node scripts/plan_stage2_variants.mjs              # report + console summary
//   node scripts/plan_stage2_variants.mjs --write      # also emit generated TS
//   node scripts/plan_stage2_variants.mjs --similarity 0.7
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const SNAPSHOT = resolve(process.cwd(), "scripts/cms-snapshots/products.json");
const STAGE1 = resolve(process.cwd(), "src/data/prunedProducts.generated.ts");
const REPORT = resolve(process.cwd(), "doc/stage2-variant-report.json");
const GENERATED = resolve(process.cwd(), "src/data/prunedVariantProducts.generated.ts");

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const MIN_SIMILARITY = parseFloat(arg("similarity", "0.65"));
const WRITE = process.argv.includes("--write");

const JUNK = new Set(["", "n/a", "na", "none", "null", "-", "unknown", "undefined", "nan"]);
const txt = (value) => (value == null ? "" : String(value).trim());
const clean = (value) => txt(value).replace(/\s+/g, " ");
const key = (value) => clean(value).toLowerCase();
const has = (value) => !JUNK.has(txt(value).toLowerCase());

/** A .mjs cannot import the .ts and copying the threshold would let it drift. */
function readStage1PrunedIds() {
  const source = readFileSync(STAGE1, "utf8");
  const section = source.slice(source.indexOf("duplicateOf"));
  return new Set(
    [...section.matchAll(/"([a-z0-9_]+-(?:b0|w[0-9])[a-z0-9]+)":\s*"[^"]+"/gi)].map((match) => match[1].toLowerCase()),
  );
}

function modelNumber(product) {
  const value = txt(product?.Product_Specifications?.Item_Details?.["Model Number"]);
  return has(value) ? value : "";
}

function productName(product) {
  return clean(product?.en?.name || product?.name || "");
}

function reviewCount(product) {
  const candidates = [
    product?.reviewCount,
    product?.reviews,
    product?.userRating?.reviewCount,
    product?.Product_Specifications?.Item_Details?.["Review Count"],
  ];
  for (const value of candidates) {
    const num = parseFloat(String(value ?? "").replace(/[^0-9.]/g, ""));
    if (Number.isFinite(num)) return num;
  }
  return 0;
}

const tokens = (value) => new Set(clean(value).toLowerCase().match(/[a-z0-9]+/g) || []);
function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  const [small, big] = a.size <= b.size ? [a, b] : [b, a];
  for (const token of small) if (big.has(token)) intersection += 1;
  return intersection / (a.size + b.size - intersection);
}

function physicalSpecs(product) {
  const measurements = product?.Product_Specifications?.Measurements || {};
  const pick = (label) => clean(measurements[label]).toLowerCase().replace(/\s+/g, "");
  return [pick("Item Weight"), pick("Item Dimensions L x W x H"), pick("Folded Size")].filter(Boolean);
}

/**
 * Two listings of one model that weigh the same and measure the same ARE one
 * product, whatever their scraped blurbs say. This runs when the marketing copy
 * is too different for the name test — e.g. MAMAZING S66, where one listing has
 * no description at all, a pipe-separated name and a broken $36.99 price.
 */
function samePhysicalProduct(a, b) {
  const left = a.specs;
  const right = b.specs;
  return left.length >= 2 && left.length === right.length && left.every((value, index) => value === right[index]);
}

const stage1Pruned = readStage1PrunedIds();
const products = JSON.parse(readFileSync(SNAPSHOT, "utf8"));
// Stage-1 duplicates are already off the site; counting them here would report
// numbers that can never ship.
const published = products.filter((product) => !stage1Pruned.has(key(product?.id)));

const enriched = published
  .filter((product) => modelNumber(product))
  .map((product) => ({
    id: txt(product.id),
    rawId: txt(product.id),
    category: txt(product.categoryId || product.category),
    brand: txt(product.brand),
    modelNumber: modelNumber(product),
    name: productName(product),
    price: product?.price ?? null,
    reviews: reviewCount(product),
    tokens: tokens(productName(product)),
    specs: physicalSpecs(product),
  }))
  .sort((a, b) => b.reviews - a.reviews || a.name.localeCompare(b.name));

const clusters = [];
for (const product of enriched) {
  const candidates = clusters.filter(
    (cluster) =>
      cluster.category === product.category &&
      key(cluster.brand) === key(product.brand) &&
      cluster.modelNumber.toUpperCase() === product.modelNumber.toUpperCase(),
  );
  let best = null;
  let bestSimilarity = 0;
  for (const cluster of candidates) {
    const similarity = jaccard(product.tokens, cluster.rep.tokens);
    if (similarity > bestSimilarity) {
      bestSimilarity = similarity;
      best = cluster;
    }
  }
  if (bestSimilarity < MIN_SIMILARITY) {
    for (const cluster of candidates) {
      if (samePhysicalProduct(product, cluster.source)) {
        best = cluster;
        bestSimilarity = 1;
        break;
      }
    }
  }
  if (best && bestSimilarity >= MIN_SIMILARITY) {
    best.members.push({ ...product, similarity: Number(bestSimilarity.toFixed(3)) });
    continue;
  }
  clusters.push({
    category: product.category,
    brand: product.brand,
    modelNumber: product.modelNumber,
    rep: product,
    source: product,
    members: [{ ...product, similarity: 1 }],
  });
}

const duplicateOf = {};
const retired = [];
const clusterRows = [];
for (const cluster of clusters.filter((entry) => entry.members.length > 1)) {
  clusterRows.push({
    category: cluster.category,
    brand: cluster.brand,
    modelNumber: cluster.modelNumber,
    keepId: cluster.rep.id,
    keepReviews: cluster.rep.reviews,
    members: cluster.members.map((member) => ({
      id: member.id,
      reviews: member.reviews,
      price: member.price,
      similarity: member.similarity,
      name: member.name.slice(0, 120),
    })),
  });
  for (const member of cluster.members) {
    if (member.id === cluster.rep.id) continue;
    duplicateOf[member.id] = cluster.rep.id;
    retired.push({
      id: member.id,
      duplicateOf: cluster.rep.id,
      category: member.category,
      brand: member.brand,
      modelNumber: member.modelNumber,
      name: member.name.slice(0, 120),
      reviews: member.reviews,
      similarity: member.similarity,
    });
  }
}

const remaining = published.length - retired.length;
const histogram = {};
for (const cluster of clusters) histogram[cluster.members.length] = (histogram[cluster.members.length] || 0) + 1;

const report = {
  generatedAt: new Date().toISOString().slice(0, 10),
  policy: "one page per manufacturer model number — colourway/packaging variants are 301'd to the listing with the most reviews",
  evidence: [
    "Product_Specifications.Item_Details['Model Number'] is the manufacturer's own identifier",
    `name token similarity >= ${MIN_SIMILARITY} against the surviving listing`,
    "same category + same brand",
  ],
  minSimilarity: MIN_SIMILARITY,
  publishedBefore: published.length,
  stage1AlreadyWithheld: products.length - published.length,
  pagesRetired: retired.length,
  pagesRemaining: remaining,
  clusterSizeHistogram: histogram,
  clusters: clusterRows,
  retired,
};

writeFileSync(REPORT, JSON.stringify(report, null, 2), "utf8");

console.log(`[stage2] published listings before this stage: ${published.length} (${products.length - published.length} already withheld by stage 1)`);
console.log(`[stage2] model-number clusters: ${clusters.length} with >1 member: ${Object.keys(histogram).filter((n) => Number(n) > 1).length}`);
console.log(`[stage2] variant pages retired: ${retired.length} -> ${remaining} detail pages remain`);
const byCategory = {};
for (const row of retired) byCategory[row.category] = (byCategory[row.category] || 0) + 1;
console.log(`[stage2] retired by category:`, byCategory);
for (const cluster of clusterRows) {
  console.log(`   ${cluster.brand} ${cluster.modelNumber}: kept ${cluster.keepId} (${cluster.keepReviews} reviews), retired ${cluster.members.length - 1}`);
}
console.log(`[stage2] report -> ${REPORT}`);

if (WRITE) {
  const body =
    `// AUTO-GENERATED by scripts/plan_stage2_variants.mjs — do not edit by hand.\n` +
    `// Run \`npm run stage2:variants -- --write\` to regenerate.\n` +
    `// Stage-2 decision: colourway/packaging listings that are one manufacturer model.\n` +
    `// They are 301'd to the most-reviewed listing of that model; nothing is deleted.\n` +
    `// Evidence for each pair is written to doc/stage2-variant-report.json.\n` +
    `export const PRUNED_VARIANT_PRODUCTS = ${JSON.stringify(
      {
        generatedAt: report.generatedAt,
        policy: report.policy,
        minSimilarity: MIN_SIMILARITY,
        publishedBefore: report.publishedBefore,
        pagesRetired: report.pagesRetired,
        pagesRemaining: report.pagesRemaining,
        duplicateOf,
      },
      null,
      2,
    )};\n`;
  writeFileSync(GENERATED, body, "utf8");
  console.log(`[stage2] wrote ${GENERATED}`);
}
