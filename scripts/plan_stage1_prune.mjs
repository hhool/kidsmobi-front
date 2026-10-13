// Stage-1 de-duplication (Plan-B): find listings that are the *same product*
// published twice, and pick which one survives.
//
// Why this exists and how far it goes
// -----------------------------------
// Stage 1 originally targeted 197 -> <=40 product detail pages. Analysis of the
// CMS snapshot did not support that number:
//   - 195/197 records carry a card summary, pros/cons, an editorial verdict and
//     review mines — the pages are not thin in the usual sense.
//   - median review count is 1,227 and only 7 products sit under 50 reviews, so
//     there is no "zero demand" cohort to cut either.
//   - clustering found ~162 genuinely distinct products.
// Cutting to 40 would therefore have meant deleting ~122 pages that have their
// own content and their own demonstrated demand, with no Search Console data to
// say which ones earn traffic. So this stage does the only part that is
// defensible on evidence alone: remove true duplicate listings. ~18 pages.
//
// How a duplicate is decided
// --------------------------
// Same category + same brand + >= 55% 4-word shingle overlap on the product's
// own copy (title, description, pros, features, review summary). Two guards make
// this deliberately conservative:
//   - SAME BRAND only. Cross-brand lookalikes (a generic factory item sold under
//     different brand stickers) are left alone — judging those needs a human.
//   - 0.55 THRESHOLD. At 0.35 the clustering merged Step2 "Push Around Buggy"
//     with Step2 "Whisper Ride II", which are two different products. They score
//     0.354. Everything kept here is >= 0.55 and every pair shares near-identical
//     review counts, which is independent confirmation that it is one listing.
//
// cardSummary is deliberately EXCLUDED from the compared text: it is copy we
// generate from a template ("Best for: ... — class-leading pick"), so including
// it would measure our own template instead of product-level duplication.
//
// Usage:
//   node scripts/plan_stage1_prune.mjs                  # report + console summary
//   node scripts/plan_stage1_prune.mjs --write          # also emit generated TS
//   node scripts/plan_stage1_prune.mjs --threshold 0.6
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const SNAPSHOT = resolve(process.cwd(), "scripts/cms-snapshots/products.json");
const REPORT = resolve(process.cwd(), "doc/stage1-prune-report.json");
const GENERATED = resolve(process.cwd(), "src/data/prunedProducts.generated.ts");

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const THRESHOLD = parseFloat(arg("threshold", "0.55"));
const REQUIRE_SAME_BRAND = !process.argv.includes("--allow-cross-brand");
const WRITE = process.argv.includes("--write");

const EMPTY = new Set(["", "n/a", "na", "none", "null", "-", "unknown", "tbd"]);
const has = (v) => v != null && !EMPTY.has(String(v).trim());
const txt = (v) => (has(v) ? String(v).trim() : "");
const asArray = (v) => (Array.isArray(v) ? v.map(txt).filter(Boolean) : txt(v) ? [txt(v)] : []);
const key = (id) => String(id || "").trim().toLowerCase();
const ItemDetails = (p) => p?.Product_Specifications?.Item_Details || {};
const num = (v) => {
  if (v == null) return null;
  const n = parseFloat(String(v).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : null;
};

/** Review count is the tiebreaker for which listing survives, so the fallback
 *  chain must reach every field the CMS has used for it. Returning null (never
 *  NaN) matters: `??` does not fall through NaN. */
function reviewCount(p) {
  return (
    num(ItemDetails(p)["Review Count"]) ??
    num(p.reviews) ??
    num(p.reviewCount) ??
    num(p.userRating?.reviewCount) ??
    0
  );
}

function productText(p) {
  const en = p.en || {};
  return [
    txt(p.name),
    txt(p.brand),
    txt(p.Product_Description),
    txt(en.description),
    asArray(p.pros).join(" "),
    asArray(en.pros).join(" "),
    asArray(p.features).join(" "),
    asArray(en.features).join(" "),
    txt(p.customersSay),
    txt(en.customersSay),
  ]
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const SHINGLE = 4;
function shingles(text) {
  const words = text.split(" ").filter(Boolean);
  const out = new Set();
  for (let i = 0; i + SHINGLE <= words.length; i++) out.add(words.slice(i, i + SHINGLE).join(" "));
  if (out.size === 0 && words.length) out.add(words.join(" "));
  return out;
}
function jaccard(a, b) {
  let inter = 0;
  const [small, big] = a.size <= b.size ? [a, b] : [b, a];
  for (const s of small) if (big.has(s)) inter++;
  return inter / (a.size + b.size - inter || 1);
}

const products = JSON.parse(readFileSync(SNAPSHOT, "utf8"));
const enriched = products.map((p) => ({
  id: key(p.id),
  rawId: String(p.id || "").trim(),
  category: txt(p.category),
  brand: txt(p.brand),
  name: txt(p.name),
  reviews: reviewCount(p),
  shingles: shingles(productText(p)),
}));

// Strongest first, so the surviving listing is the one with the most review
// volume (the one most likely to be the canonical Amazon parent listing).
const clusters = [];
for (const p of [...enriched].sort((a, b) => b.reviews - a.reviews)) {
  let best = null;
  let bestSim = 0;
  for (const c of clusters) {
    if (c.category !== p.category) continue;
    if (REQUIRE_SAME_BRAND && c.brand !== p.brand) continue;
    const sim = jaccard(p.shingles, c.rep.shingles);
    if (sim > bestSim) {
      bestSim = sim;
      best = c;
    }
  }
  if (best && bestSim >= THRESHOLD) {
    best.members.push({ ...p, sim: Number(bestSim.toFixed(3)) });
  } else {
    clusters.push({ category: p.category, brand: p.brand, rep: p, members: [{ ...p, sim: 1 }] });
  }
}

const duplicateOf = {};
const pruned = [];
const clusterRows = [];
for (const c of clusters.filter((x) => x.members.length > 1)) {
  clusterRows.push({
    category: c.category,
    brand: c.brand,
    keepId: c.rep.rawId,
    keepReviews: c.rep.reviews,
    members: c.members.map((m) => ({ id: m.rawId, reviews: m.reviews, sim: m.sim })),
  });
  for (const m of c.members) {
    if (m.id === c.rep.id) continue;
    duplicateOf[m.id] = c.rep.id;
    pruned.push({
      id: m.rawId,
      duplicateOf: c.rep.rawId,
      category: m.category,
      brand: m.brand,
      name: m.name,
      reviews: m.reviews,
      sim: m.sim,
    });
  }
}

const keep = enriched.filter((p) => !duplicateOf[p.id]).map((p) => p.rawId);
const histogram = {};
for (const c of clusters) histogram[c.members.length] = (histogram[c.members.length] || 0) + 1;

const report = {
  generatedAt: new Date().toISOString().slice(0, 10),
  policy: "remove duplicate listings only — no pages are cut for thinness or demand",
  threshold: THRESHOLD,
  requireSameBrand: REQUIRE_SAME_BRAND,
  analysed: products.length,
  distinctProducts: clusters.length,
  pagesKept: keep.length,
  pagesPruned: pruned.length,
  clusterSizeHistogram: histogram,
  clusters: clusterRows,
  pruned,
  keep,
};

writeFileSync(REPORT, JSON.stringify(report, null, 2), "utf8");

console.log(`[stage1] analysed ${products.length} product listings`);
console.log(`[stage1] clustering: threshold=${THRESHOLD} sameBrandOnly=${REQUIRE_SAME_BRAND}`);
console.log(`[stage1] distinct products: ${clusters.length}  (cluster sizes ${JSON.stringify(histogram)})`);
console.log(`[stage1] duplicate pages to remove: ${pruned.length} -> ${keep.length} pages remain`);
const byCat = {};
for (const p of pruned) byCat[p.category] = (byCat[p.category] || 0) + 1;
console.log(`[stage1] pruned by category:`, byCat);
console.log(`[stage1] report -> ${REPORT}`);

if (WRITE) {
  const body =
    `// AUTO-GENERATED by scripts/plan_stage1_prune.mjs — do not edit by hand.\n` +
    `// Run \`npm run stage1:plan -- --write\` to regenerate.\n` +
    `// Stage-1 decision: which duplicate product listings the site no longer publishes.\n` +
    `// Every id below maps to the listing that absorbed it; see the report written to\n` +
    `// doc/stage1-prune-report.json for the evidence behind each pair.\n` +
    `export const PRUNED_PRODUCTS = ${JSON.stringify(
      {
        generatedAt: report.generatedAt,
        policy: report.policy,
        threshold: THRESHOLD,
        requireSameBrand: REQUIRE_SAME_BRAND,
        analysed: report.analysed,
        distinctProducts: report.distinctProducts,
        pagesKept: report.pagesKept,
        pagesPruned: report.pagesPruned,
        keep,
        duplicateOf,
      },
      null,
      2,
    )};\n`;
  writeFileSync(GENERATED, body, "utf8");
  console.log(`[stage1] wrote ${GENERATED}`);
}
