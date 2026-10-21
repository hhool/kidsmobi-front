/**
 * check:pairdrift — guard the eight same-topic URL pairs against drifting back
 * into duplication.
 *
 * Why this exists. doc/b-track-duplicate-topic-urls-2026-10-22 measured the
 * eight pairs at 0.02-0.08 whole-page 8-gram Jaccard and concluded "not
 * duplicate". That number was measuring the wrong thing: every page in the
 * reference cluster renders the same ReferenceClusterNav copy, and on a
 * ~1200-word article that boilerplate is a large share of the text, so it
 * dilutes genuine duplication into the same band where everything looks fine.
 * what-buyers-say hid two count sections restating the asset page's table that
 * way, and stayed hidden until someone compared the subheads by hand.
 *
 * So this measures document frequency first: any 8-gram appearing on many pages
 * of the site is chrome by definition, not editorial overlap. bodyOnly is the
 * Jaccard over what is left — the part a reader or a crawler would recognise as
 * the same writing. On today's build that is 0.000 for six pairs and 0.002-0.003
 * for the other two, and those few shared grams are product titles both pages
 * happen to list, not prose.
 *
 * subheadSim is the second signal, because it is what actually found the
 * duplication: the best symmetric word-bag overlap between the two pages' <h2>s,
 * ignoring the sections the renderer appends and headings of under three content
 * words. Asymmetric containment scored 1.0 on every pair the moment both had a
 * "Method" heading, which is noise.
 *
 * Reads dist only, so unlike check:workerparity it runs fine in CI.
 *
 * Usage: node scripts/check-topic-pair-drift.mjs [--df=20] [--json]
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const DF_MIN = Number(args.find((a) => a.startsWith("--df="))?.split("=")[1] ?? 20);
const AS_JSON = args.includes("--json");
const DIST = "dist";
const N = 8;

const PAIRS = [
  ["size-chart", "balance-bike-size-chart/index.html", "guides/beginner/balance-bike-size-chart.html"],
  ["weight", "balance-bike-weight/index.html", "guides/beginner/balance-bike-weight.html"],
  ["by-age", "balance-bike-by-age/index.html", "guides/beginner/balance-bike-by-age.html"],
  ["what-buyers-say", "balance-bike-what-buyers-say/index.html", "guides/beginner/balance-bike-what-buyers-say.html"],
  ["safety-standards", "balance-bike-safety-standards/index.html", "guides/risk/balance-bike-safety-standards.html"],
  ["stability", "balance-bike-stability/index.html", "guides/scenario/balance-bike-stability.html"],
  ["recalls", "guides/risk/balance-bike-recall-record.html", "guides/risk/balance-bike-recalls.html"],
  ["budget", "balance-bike-budget/index.html", "guides/budget/balance-bike-price-tiers.html"],
];

const walk = (dir, out = []) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (entry.name.endsWith(".html")) out.push(p);
  }
  return out;
};

/** Body prose only: no script/style, no nav/header/footer. */
const textOf = (html) => {
  let s = html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ");
  const body = s.match(/<body[\s\S]*?<\/body>/);
  if (body) s = body[0];
  s = s.replace(/<nav[\s\S]*?<\/nav>/g, " ").replace(/<footer[\s\S]*?<\/footer>/g, " ").replace(/<header[\s\S]*?<\/header>/g, " ");
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
};

const shingles = (text, n = N) => {
  const w = text.split(" ");
  const set = new Set();
  for (let i = 0; i + n <= w.length; i++) set.add(w.slice(i, i + n).join(" "));
  return set;
};

const jaccard = (a, b) => {
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter === 0 ? 0 : inter / (a.size + b.size - inter);
};

// Keys are dist-relative with forward slashes, so they match PAIRS on Windows too.
const rel = (p) => p.replace(/\\/g, "/").replace(/^dist\//, "");
const files = walk(DIST);
const texts = new Map();
for (const f of files) {
  try {
    texts.set(rel(f), textOf(readFileSync(f, "utf8")));
  } catch {
    /* skip unreadable */
  }
}

// Document frequency across the whole site.
const df = new Map();
for (const text of texts.values()) {
  for (const gram of shingles(text)) df.set(gram, (df.get(gram) || 0) + 1);
}
const isChrome = (gram) => (df.get(gram) || 0) >= DF_MIN;

const bodyOnly = (file) => {
  const set = new Set();
  for (const gram of shingles(texts.get(file) || "")) if (!isChrome(gram)) set.add(gram);
  return set;
};

/** Word-bag similarity of the subheads: catches parallel phrasing, not just equal strings. */
const subheadsOf = (file) =>
  [...(readFileSync(join(DIST, file), "utf8").matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g))]
    .map((m) => m[1].replace(/<[^>]+>/g, "").trim().toLowerCase())
    .filter((h) => h && !APPENDED_PREFIXES.some((p) => h.startsWith(p)));

/** Sections the renderer appends to every page in the cluster, not editorial. */
const APPENDED_PREFIXES = [
  "related reviews",
  "products mentioned",
  "balance bike reference pages",
  "further reading",
  "related datasets",
];

/**
 * Symmetric word-bag overlap between two subheads, ignoring headings with fewer
 * than three content words. Asymmetric containment scores every pair 1.0 the
 * moment both pages have a "Method" heading, which is noise; symmetric overlap
 * on substantive headings is what "these two sections do the same job" means.
 */
const words = (s) => new Set(s.replace(/[^a-z0-9 ]/g, " ").split(" ").filter((w) => w.length > 2));
const bagOverlap = (x, y) => {
  const wx = words(x);
  const wy = words(y);
  if (wx.size < 3 || wy.size < 3) return 0;
  let inter = 0;
  for (const w of wx) if (wy.has(w)) inter++;
  return inter / (wx.size + wy.size - inter);
};
const subheadMatch = (a, b) => {
  let best = 0;
  let pair = null;
  for (const x of a) {
    for (const y of b) {
      const s = bagOverlap(x, y);
      if (s > best) {
        best = s;
        pair = [x, y];
      }
    }
  }
  return { score: +best.toFixed(2), pair };
};

const rows = [];
const failures = [];
for (const [name, asset, guide] of PAIRS) {
  if (!texts.has(asset) || !texts.has(guide)) {
    failures.push(`${name}: missing from dist (${texts.has(asset) ? "" : asset + " "}${texts.has(guide) ? "" : guide})`);
    continue;
  }
  const aRaw = shingles(texts.get(asset) || "");
  const bRaw = shingles(texts.get(guide) || "");
  const aBody = bodyOnly(asset);
  const bBody = bodyOnly(guide);
  const shared = [...aBody].filter((x) => bBody.has(x));
  const sa = subheadsOf(asset);
  const sb = subheadsOf(guide);
  const sm = subheadMatch(sa, sb);
  rows.push({
    pair: name,
    assetWords: (texts.get(asset) || "").split(" ").length,
    guideWords: (texts.get(guide) || "").split(" ").length,
    raw: +jaccard(aRaw, bRaw).toFixed(3),
    bodyOnly: +jaccard(aBody, bBody).toFixed(3),
    sharedGrams: shared.length,
    assetGrams: aBody.size,
    guideGrams: bBody.size,
    subheadSim: sm.score,
    subheadPair: sm.pair,
    sample: shared.slice(0, 3),
  });
}

/**
 * Thresholds, both set above today's worst measured value so the guard is not
 * already at its limit: bodyOnly peaks at 0.003 and subheadSim at 0.50. They are
 * not arbitrary round numbers — 0.05 is roughly ten times the worst prose overlap
 * currently on the site, and shared product titles (which are legitimate) sit an
 * order of magnitude below it.
 */
const BODY_MAX = 0.05;
const SUBHEAD_MAX = 0.6;

for (const r of rows) {
  if (r.bodyOnly > BODY_MAX) {
    failures.push(`${r.pair}: bodyOnly ${r.bodyOnly} > ${BODY_MAX} (${r.sharedGrams} shared body 8-grams)`);
  }
  if (r.subheadSim > SUBHEAD_MAX) {
    failures.push(
      `${r.pair}: subheads ${r.subheadSim} > ${SUBHEAD_MAX} — "${r.subheadPair?.[0]}" <-> "${r.subheadPair?.[1]}"`
    );
  }
}

if (AS_JSON) {
  console.log(JSON.stringify({ rows, failures }, null, 2));
} else {
  console.log(`df threshold: a gram is chrome when it appears on >= ${DF_MIN} of ${texts.size} pages\n`);
  console.log("pair              raw    bodyOnly  shared/grams      subheadSim  asset/guide words");
  for (const r of rows) {
    const flag = r.bodyOnly > BODY_MAX || r.subheadSim > SUBHEAD_MAX ? "  <-- FAIL" : "";
    console.log(
      `${r.pair.padEnd(17)} ${String(r.raw).padEnd(6)} ${String(r.bodyOnly).padEnd(9)} ${String(`${r.sharedGrams}/${r.assetGrams}+${r.guideGrams}`).padEnd(17)} ${String(r.subheadSim).padEnd(11)} ${r.assetWords}/${r.guideWords}${flag}`
    );
  }
  console.log("\nclosest subhead pair on each page pair:");
  for (const r of rows) {
    console.log(`  ${r.pair.padEnd(17)} ${r.subheadSim}  ${r.subheadPair ? `"${r.subheadPair[0]}" <-> "${r.subheadPair[1]}"` : "none"}`);
  }
  console.log("\nraw       = whole-page 8-gram Jaccard, chrome included (the number that hid the problem)");
  console.log(`bodyOnly  = same measure with site-wide boilerplate removed (fail > ${BODY_MAX})`);
  console.log(`subheadSim = best word-bag match between the two pages' <h2>s (fail > ${SUBHEAD_MAX})`);
  for (const r of rows.filter((x) => x.sharedGrams > 0)) {
    console.log(`\n${r.pair} — shared body spans:`);
    r.sample.forEach((s) => console.log(`    ${s.slice(0, 100)}`));
  }
}

if (failures.length) {
  console.error(`\n[FAIL] ${failures.length} pair(s) drifting into duplication:`);
  for (const f of failures) console.error(`  - ${f}`);
  console.error("\nTwo pages on one topic are starting to say the same thing. Separate the intent:");
  console.error("the asset page keeps the data angle, the guide takes the action angle.");
  process.exit(1);
}
if (!AS_JSON) console.log(`\n[ok] ${rows.length} same-topic pairs stay distinct.`);
