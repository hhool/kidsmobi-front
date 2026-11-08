#!/usr/bin/env node
/**
 * R-927 / audit H3: generate dist/llms.txt from the sitemap the build just wrote.
 *
 * The shipped file was 28 hand-picked links (6.1% of the 462 URLs), with no
 * answer pages and only 2/79 Chinese pages. An answer engine reading it could
 * not reach most of the site. This generator reads dist/sitemap.xml, classifies
 * every URL, and emits a structured llms.txt that:
 *   - covers all 462 URLs (so the file cannot silently drift out of sync),
 *   - puts the answer-shaped pages first (guides, single reviews, comparisons),
 *   - keeps the editorial frame (About / Content focus / Policies / Contact /
 *     Canonical) from public/llms.txt verbatim,
 *   - leaves the "Last updated" stamp to stamp-llms.mjs (content-derived, never
 *     a build clock).
 *
 * Deterministic: same sitemap in → same bytes out, so a future `--check` is a
 * real assertion, not a coin flip.
 *
 * Usage:
 *   node scripts/gen-llms.mjs            # write dist/llms.txt
 *   node scripts/gen-llms.mjs --check    # fail if coverage < 90% or answer/zh missing
 *
 * Must run after prerender-pages.ts (which writes dist/sitemap.xml + the HTML
 * the titles are read from) and before stamp-llms.mjs.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";

const DIST = resolve(process.cwd(), "dist");
const SITEMAP = join(DIST, "sitemap.xml");
const FRAME = resolve(process.cwd(), "public", "llms.txt");
const OUT = join(DIST, "llms.txt");
const SITE = "https://balancebiketoddler.com";

/** Read <title> from a prerendered HTML file, stripped of the site suffix. */
function titleFor(loc) {
  const pathname = new URL(loc).pathname;
  const file = pathname === "/"
    ? join(DIST, "index.html")
    : join(DIST, pathname.replace(/\/$/, ""), "index.html");
  if (!existsSync(file)) return null;
  const html = readFileSync(file, "utf8");
  const m = html.match(/<title>([^<]*)<\/title>/i);
  if (!m) return null;
  const decoded = m[1]
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
  return decoded
    .replace(/\s*[|\-—–]\s*BalanceBikeToddler.*$/i, "")
    .replace(/\s*\|\s*$/, "")
    .trim();
}

/** Humanize a path segment as a fallback link label. */
function humanize(pathname) {
  const last = pathname.replace(/\/+$/, "").split("/").pop() || "Home";
  return last
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function classify(loc) {
  const p = new URL(loc).pathname;
  if (p === "/") return "home";
  if (p.startsWith("/zh/")) return "zh";
  if (p.startsWith("/transparency/")) return "transparency";
  // Family landing + topic pages (/balance-bike/, /kids-scooter-by-age/, ...):
  // answer-oriented content (size charts, by-age, safety, recalls) that must not
  // fall into the catch-all. A family name is followed by either "/" (the hub)
  // or "-" (a hyphenated sub-page like /balance-bike-size-chart/); product
  // detail pages live under /products/<family>/<slug> and are therefore excluded.
  if (FAMILY_HUBS.some((f) => p.startsWith(`/${f}`))) return "family";
  if (/^\/products\/[^\/]+\/[^\/]+$/.test(p)) return "productDetail";
  if (/^\/products\/[^\/]+\/?$/.test(p)) return "productCategory";
  if (p.startsWith("/reviews/single/")) return "singleReview";
  if (p.startsWith("/reviews/compare")) return "compare";
  if (p.startsWith("/reviews")) return "reviewHub";
  if (p.startsWith("/guides/") && p !== "/guides") return "guide";
  if (p.startsWith("/guides")) return "guideHub";
  if (p.startsWith("/news/") && p !== "/news") return "newsChannel";
  if (p.startsWith("/news")) return "newsHub";
  if (p === "/about") return "about";
  if (p === "/products") return "productTopHub";
  return "other";
}

const FAMILY_HUBS = [
  "balance-bike",
  "kids-bike",
  "kids-scooter",
  "kids-stroller",
  "kids-tricycle",
  "kids-ride-on",
  "baby-stroller",
  "twin-stroller",
  "foldable-electric-scooter",
  "kids-dirt-bike",
  "kids-electric-scooter",
];

const SECTION_ORDER = [
  ["Pages", ["home", "productTopHub", "reviewHub", "guideHub", "newsHub", "about"]],
  ["Answer guides", ["guide"]],
  ["Single reviews", ["singleReview"]],
  ["Comparisons", ["compare"]],
  ["Family & buyer's guides", ["family"]],
  ["Product detail", ["productDetail"]],
  ["Product categories", ["productCategory"]],
  ["News channels", ["newsChannel"]],
  ["Chinese editions", ["zh"]],
  ["Transparency", ["transparency"]],
  ["Other", ["other"]],
];

function buildBody(urls) {
  const byCat = new Map();
  const unclassified = [];
  for (const { loc } of urls) {
    const cat = classify(loc);
    if (!byCat.has(cat)) byCat.set(cat, []);
    byCat.get(cat).push(loc);
  }
  let out = "";
  for (const [label, cats] of SECTION_ORDER) {
    const items = cats.flatMap((c) => byCat.get(c) || []);
    if (items.length === 0) continue;
    out += `\n## ${label}\n`;
    for (const loc of items.sort()) {
      const title = titleFor(loc) || humanize(new URL(loc).pathname);
      out += `- [${title}](${loc})\n`;
    }
  }
  return out;
}

function main() {
  if (!existsSync(SITEMAP)) {
    console.error(`${SITEMAP} not found — run the prerender first`);
    process.exit(1);
  }
  const xml = readFileSync(SITEMAP, "utf8");
  const urls = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => {
    const e = m[1];
    const loc = (e.match(/<loc>([^<]+)<\/loc>/) || [])[1];
    return { loc };
  }).filter((u) => u.loc);

  const frame = readFileSync(FRAME, "utf8");
  const pagesIdx = frame.indexOf("## Pages");
  const contactIdx = frame.indexOf("## Contact");
  if (pagesIdx === -1 || contactIdx === -1) {
    console.error("public/llms.txt missing ## Pages or ## Contact markers");
    process.exit(1);
  }
  const head = frame.slice(0, pagesIdx);
  const tail = frame.slice(contactIdx);

  const body = buildBody(urls);
  const llms = `${head}${body}\n${tail}`;
  // --check is read-only: it must not rewrite the file (that would strip the
  // "Last updated" stamp stamp-llms.mjs adds afterwards, breaking check:llms
  // and any re-run of it). Only the write mode (npm run gen:llms / the build)
  // emits dist/llms.txt; --check only asserts coverage.
  if (!process.argv.includes("--check")) {
    writeFileSync(OUT, llms, "utf8");
  }

  const covered = urls.filter((u) => classify(u.loc) !== "other").length;
  const hasAnswer = urls.some((u) => classify(u.loc) === "guide" || classify(u.loc) === "singleReview");
  const hasZh = urls.some((u) => classify(u.loc) === "zh");
  console.log(
    `gen-llms: ${urls.length} URL(s) → dist/llms.txt (covered ${covered}, answer=${hasAnswer}, zh=${hasZh})`,
  );

  if (process.argv.includes("--check")) {
    const coverage = covered / urls.length;
    const problems = [];
    if (coverage < 0.9) problems.push(`coverage ${(coverage * 100).toFixed(1)}% < 90%`);
    if (!hasAnswer) problems.push("no answer pages (guides/single reviews)");
    if (!hasZh) problems.push("no /zh pages");
    if (problems.length) {
      console.error(`gen-llms --check FAIL: ${problems.join("; ")}`);
      process.exit(1);
    }
    console.log("gen-llms --check: pass");
  }
}

main();
