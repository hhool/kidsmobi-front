/**
 * check:pairdrift — keep same-topic pages from drifting back into duplication.
 *
 * Why this exists. doc/b-track-duplicate-topic-urls-2026-10-22 measured the
 * eight asset/guide pairs at 0.02-0.08 whole-page 8-gram Jaccard and concluded
 * "not duplicate". That number was measuring the wrong thing: every page in the
 * reference cluster renders the same ReferenceClusterNav copy, and on a
 * ~1200-word article that boilerplate is a large share of the text, so it
 * dilutes genuine duplication into the same band where everything looks fine.
 * what-buyers-say hid two count sections restating the asset page's table that
 * way, and stayed hidden until someone compared the subheads by hand.
 *
 * So this measures document frequency first: any 8-gram appearing on many pages
 * of the site is chrome by definition, not editorial overlap. bodyOnly is the
 * Jaccard over what is left — the part a reader or a crawler would recognise as
 * the same writing.
 *
 * Two things were still blind spots after the first version:
 *
 *  1. df >= 20 only catches chrome that appears on a LOT of pages. A "Method
 *     and limits" block that appears on the four news articles, or the
 *     "what this data cannot tell you" section the asset pages share, is just
 *     as much template output — it simply lives in one section. Those are now
 *     stripped by heading: headings are clustered by word bag (>= 0.6, single
 *     linkage) and any cluster seen on >= 3 pages is template, so
 *     "how these counts were produced" and "how these numbers were produced"
 *     are recognised as the same section without anyone listing them by hand.
 *     Without this, two news articles that share a method note measure 0.102
 *     body overlap when their real editorial overlap is 0.046.
 *
 *  2. The pair list was hard-coded to the eight pairs B-track looked at. Two
 *     articles written later (the electric ride-on pieces) started doing the
 *     same job and nothing watched them, because they were not on the list.
 *     Phase 2 therefore derives the pair set from the build: every editorial
 *     leaf page (articles, asset pages, transparency pages) against every other
 *     one. Product pages are excluded — their spec tables legitimately repeat —
 *     and so are the listing hubs, which summarise their own children.
 *
 * subheadSim is the second signal, because it is what actually found the
 * duplication: the best symmetric word-bag overlap between the two pages' <h2>s,
 * ignoring sections the renderer appends and headings of under three content
 * words. Asymmetric containment scored 1.0 on every pair the moment both had a
 * "Method" heading, which is noise.
 *
 * Reads dist only, so unlike check:workerparity it runs fine in CI.
 *
 * Usage: node scripts/check-topic-pair-drift.mjs [--df=20] [--json]
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const DF_MIN = Number(args.find((a) => a.startsWith("--df="))?.split("=")[1] ?? 20);
const AS_JSON = args.includes("--json");
const DIST = "dist";
const N = 8;

/** A heading cluster seen on this many pages is template output, not editorial. */
const TEMPLATE_HEADING_PAGES = 3;
/** Word-bag overlap at which two headings count as the same section. */
const HEADING_LINK = 0.6;

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

/**
 * Editorial leaf pages: articles, asset pages and transparency pages. Listing
 * hubs (guides.html, news/industry.html, reviews/single.html …) are excluded
 * because a hub is supposed to repeat its children, and product pages are
 * excluded because their spec tables are the same fields with different values.
 */
const HUB_FILES = new Set([
  "index.html",
  "products.html",
  "guides.html",
  "news.html",
  "reviews.html",
  "about.html",
  "404.html",
]);
const isLeaf = (file) => {
  if (file.startsWith("products/")) return false;
  if (HUB_FILES.has(file)) return false;
  const depth = file.split("/").length;
  if (/^(guides|news|reviews)\//.test(file)) return depth >= 3;
  return true;
};

const walk = (dir, out = []) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (entry.name.endsWith(".html")) out.push(p);
  }
  return out;
};

// Keys are dist-relative with forward slashes, so they match PAIRS on Windows too.
const rel = (p) => p.replace(/\\/g, "/").replace(/^dist\//, "");
const files = walk(DIST).map(rel);
const htmlOf = (file) => readFileSync(join(DIST, file), "utf8");

// ---------------------------------------------------------------------------
// Template sections.
// ---------------------------------------------------------------------------
const headingText = (h) =>
  h.replace(/<[^>]+>/g, "").replace(/&[a-z#0-9]+;/g, " ").replace(/\s+/g, " ").trim().toLowerCase();

/** heading -> pages carrying it. */
const headingPages = new Map();
for (const file of files) {
  const seen = new Set(
    [...htmlOf(file).matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => headingText(m[1])).filter(Boolean)
  );
  for (const h of seen) {
    if (!headingPages.has(h)) headingPages.set(h, new Set());
    headingPages.get(h).add(file);
  }
}

const words = (s) => new Set(s.replace(/[^a-z0-9 ]/g, " ").split(" ").filter((w) => w.length > 2));
const bagOverlap = (x, y) => {
  const wx = words(x);
  const wy = words(y);
  if (wx.size < 3 || wy.size < 3) return 0;
  let inter = 0;
  for (const w of wx) if (wy.has(w)) inter++;
  return inter / (wx.size + wy.size - inter);
};

// Single-linkage clustering: two headings are the same section when their word
// bags mostly agree, which is how "how these counts were produced" joins
// "how these numbers were produced" without either being listed by hand.
const headings = [...headingPages.keys()];
const parent = new Map(headings.map((h) => [h, h]));
const find = (x) => {
  while (parent.get(x) !== x) {
    parent.set(x, parent.get(parent.get(x)));
    x = parent.get(x);
  }
  return x;
};
for (let i = 0; i < headings.length; i++) {
  for (let j = i + 1; j < headings.length; j++) {
    if (bagOverlap(headings[i], headings[j]) >= HEADING_LINK) {
      const a = find(headings[i]);
      const b = find(headings[j]);
      if (a !== b) parent.set(a, b);
    }
  }
}
const clusters = new Map();
for (const h of headings) {
  const root = find(h);
  if (!clusters.has(root)) clusters.set(root, []);
  clusters.get(root).push(h);
}
const clusterPages = new Map();
for (const [root, members] of clusters) {
  const pages = new Set();
  for (const m of members) for (const p of headingPages.get(m)) pages.add(p);
  clusterPages.set(root, pages);
}
const templateHeadings = new Set();
for (const [root, members] of clusters) {
  if ((clusterPages.get(root)?.size ?? 0) >= TEMPLATE_HEADING_PAGES) for (const m of members) templateHeadings.add(m);
}

/** Sections the renderer appends to every page in the cluster, not editorial. */
const APPENDED_PREFIXES = [
  "related reviews",
  "products mentioned",
  "balance bike reference pages",
  "further reading",
  "related datasets",
];
const isTemplateHeading = (h) => templateHeadings.has(h) || APPENDED_PREFIXES.some((p) => h.startsWith(p));

/** Body prose only: no script/style, no chrome, no template sections, no byline. */
const textOf = (html) => {
  let s = html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ");
  const body = s.match(/<body[\s\S]*?<\/body>/);
  if (body) s = body[0];
  s = s
    .replace(/<nav[\s\S]*?<\/nav>/g, " ")
    .replace(/<footer[\s\S]*?<\/footer>/g, " ")
    .replace(/<header[\s\S]*?<\/header>/g, " ");
  s = s
    .split(/(?=<h2[\s>])/i)
    .filter((chunk) => {
      const m = chunk.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
      if (!m) return true;
      return !isTemplateHeading(headingText(m[1]));
    })
    .join(" ");
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/g, " ")
    // The byline is template output too, and its date makes it unique enough
    // that no document-frequency threshold can ever recognise it as chrome.
    .replace(/editorial team[^.]*\d{4}-\d{2}-\d{2}/g, " ")
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

const texts = new Map();
for (const f of files) {
  try {
    texts.set(f, textOf(htmlOf(f)));
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
  [...htmlOf(file).matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)]
    .map((m) => headingText(m[1]))
    .filter((h) => h && !isTemplateHeading(h));

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

const measure = (a, b) => {
  const aRaw = shingles(texts.get(a) || "");
  const bRaw = shingles(texts.get(b) || "");
  const aBody = bodyOnly(a);
  const bBody = bodyOnly(b);
  const shared = [...aBody].filter((x) => bBody.has(x));
  const sm = subheadMatch(subheadsOf(a), subheadsOf(b));
  return {
    raw: +jaccard(aRaw, bRaw).toFixed(3),
    bodyOnly: +jaccard(aBody, bBody).toFixed(3),
    sharedGrams: shared.length,
    grams: `${aBody.size}+${bBody.size}`,
    subheadSim: sm.score,
    subheadPair: sm.pair,
    sample: shared.slice(0, 3),
  };
};

/**
 * Thresholds, both set above today's worst measured value so the guard is not
 * already at its limit: bodyOnly peaks at 0.003 and subheadSim at 0.50 on the
 * named pairs. 0.05 is roughly ten times the worst prose overlap currently on
 * the site, and shared product titles (which are legitimate) sit an order of
 * magnitude below it.
 */
const BODY_MAX = 0.05;
const SUBHEAD_MAX = 0.6;
/**
 * The derived scan is looser than the named pairs on purpose. It compares pages
 * nobody has sat down and separated, including sibling asset pages that share
 * product names and comparison pages that quote the single reviews they rank;
 * today's worst editorial leaf pair sits at 0.046 body, so 0.08 still leaves
 * headroom while being far below anything a reader would call the same writing.
 */
const SCAN_BODY_MAX = 0.08;

const failures = [];

// --- phase 1: the eight pairs B-track separated on purpose ------------------
const rows = [];
for (const [name, asset, guide] of PAIRS) {
  if (!texts.has(asset) || !texts.has(guide)) {
    failures.push(`${name}: missing from dist (${texts.has(asset) ? "" : asset + " "}${texts.has(guide) ? "" : guide})`);
    continue;
  }
  const m = measure(asset, guide);
  rows.push({
    pair: name,
    assetWords: (texts.get(asset) || "").split(" ").length,
    guideWords: (texts.get(guide) || "").split(" ").length,
    ...m,
  });
}
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

// --- phase 2: every editorial leaf page against every other one -------------
const leaves = files.filter(isLeaf);
const postings = new Map();
for (const f of leaves) {
  for (const gram of shingles(texts.get(f) || "")) {
    let arr = postings.get(gram);
    if (!arr) postings.set(gram, (arr = []));
    arr.push(f);
  }
}
const pairKey = (a, b) => (a < b ? a + "\u0000" + b : b + "\u0000" + a);
const sharedCounts = new Map();
for (const [gram, pages] of postings) {
  if (pages.length >= DF_MIN) continue;
  for (let i = 0; i < pages.length; i++) {
    for (let j = i + 1; j < pages.length; j++) {
      const k = pairKey(pages[i], pages[j]);
      sharedCounts.set(k, (sharedCounts.get(k) || 0) + 1);
    }
  }
}
const leafSets = new Map();
for (const f of leaves) leafSets.set(f, bodyOnly(f));
const leafSubs = new Map(leaves.map((f) => [f, subheadsOf(f)]));

const scan = [];
for (const [k, inter] of sharedCounts) {
  const [a, b] = k.split("\u0000");
  const j = inter / (leafSets.get(a).size + leafSets.get(b).size - inter);
  if (j <= 0.01) continue;
  const sm = subheadMatch(leafSubs.get(a), leafSubs.get(b));
  scan.push({ a, b, bodyOnly: +j.toFixed(3), sharedGrams: inter, subheadSim: sm.score, subheadPair: sm.pair });
}
scan.sort((x, y) => y.bodyOnly - x.bodyOnly);
for (const s of scan) {
  if (s.bodyOnly > SCAN_BODY_MAX) {
    failures.push(
      `derived pair: bodyOnly ${s.bodyOnly} > ${SCAN_BODY_MAX} — ${s.a} <-> ${s.b} (${s.sharedGrams} shared body 8-grams)`
    );
  }
  if (s.subheadSim > SUBHEAD_MAX) {
    failures.push(
      `derived pair: subheads ${s.subheadSim} > ${SUBHEAD_MAX} — ${s.a} <-> ${s.b} — "${s.subheadPair?.[0]}" <-> "${s.subheadPair?.[1]}"`
    );
  }
}

if (AS_JSON) {
  console.log(JSON.stringify({ rows, scan: scan.slice(0, 10), failures }, null, 2));
} else {
  console.log(`df threshold: a gram is chrome when it appears on >= ${DF_MIN} of ${texts.size} pages`);
  console.log(
    `template sections: ${templateHeadings.size} heading(s) clustered as template (seen on >= ${TEMPLATE_HEADING_PAGES} pages)\n`
  );
  console.log("pair              raw    bodyOnly  shared/grams      subheadSim  asset/guide words");
  for (const r of rows) {
    const flag = r.bodyOnly > BODY_MAX || r.subheadSim > SUBHEAD_MAX ? "  <-- FAIL" : "";
    console.log(
      `${r.pair.padEnd(17)} ${String(r.raw).padEnd(6)} ${String(r.bodyOnly).padEnd(9)} ${String(`${r.sharedGrams}/${r.grams}`).padEnd(17)} ${String(r.subheadSim).padEnd(11)} ${r.assetWords}/${r.guideWords}${flag}`
    );
  }
  console.log("\nclosest subhead pair on each page pair:");
  for (const r of rows) {
    console.log(`  ${r.pair.padEnd(17)} ${r.subheadSim}  ${r.subheadPair ? `"${r.subheadPair[0]}" <-> "${r.subheadPair[1]}"` : "none"}`);
  }

  console.log(`\nderived scan: ${leaves.length} editorial leaf pages, ${sharedCounts.size} pair(s) sharing any body gram`);
  console.log(`top ${Math.min(8, scan.length)} by bodyOnly (fail > ${SCAN_BODY_MAX} body, > ${SUBHEAD_MAX} subheads):`);
  for (const s of scan.slice(0, 8)) {
    const flag = s.bodyOnly > SCAN_BODY_MAX || s.subheadSim > SUBHEAD_MAX ? "  <-- FAIL" : "";
    console.log(`  ${String(s.bodyOnly).padEnd(6)} ${String(s.subheadSim).padEnd(5)} ${s.a} <-> ${s.b}${flag}`);
  }
  if (!scan.length) console.log("  (none above 0.01)");

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
if (!AS_JSON) console.log(`\n[ok] ${rows.length} named pairs + ${scan.length} derived pair(s) stay distinct.`);
