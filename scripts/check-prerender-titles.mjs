// Guard for the one thing every search result shows: the <title>.
//
// Three defects have shipped from this repo already:
//  1. Titles cut mid-sentence ("Review Count Integrity: The Numbers We") by a
//     naive character cap — see capSeoTitle() in scripts/prerender-pages.ts.
//  2. Amazon ASINs published inside titles and meta descriptions
//     ("Mompush Lithe V2 ... Review: B0B7MFS2W4"), the clearest possible
//     fingerprint of machine-assembled pages.
//  3. Two detail pages sharing one title, which is what the collision handling
//     exists to prevent.
// `npm run check:content` cannot catch any of these — it reads visible body
// text, and none of them change the body.
//
// Usage:
//   node scripts/check-prerender-titles.mjs
//   CHECK_TITLES_ROOT=dist_prev node scripts/check-prerender-titles.mjs
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = process.env.CHECK_TITLES_ROOT || "dist";
const SITE = "https://balancebiketoddler.com";
const BRAND_SUFFIX = "| BalanceBikeToddler";
// The G4 hard list (repos/wb-seo-teardown/references/technical-baseline-34.md,
// row 1) asks for one unique title per page, 25-60 characters. This guard
// said 65, which is the budget the site used before that row was read: a
// 61-65 character title passes here and still gets cut by the search result.
// scripts/check-title-cap.ts guards the same range with the shared constant.
const MAX_TITLE = 60;
const MAX_DESCRIPTION = 158;
const ASIN = /\bB0[0-9A-Z]{8}\b/;
const DANGLING = new Set([
  "a", "an", "the", "and", "or", "but", "nor", "as", "at", "by", "for", "from",
  "in", "of", "on", "to", "with", "than", "then", "that", "this", "these",
  "those", "it", "its", "is", "are", "was", "we", "our", "you", "your", "who",
  "how", "what", "when", "where", "why", "vs", "vs.",
]);

// A dangling tail is only evidence of a CUT, not of a defect by itself:
// "Baby Stroller: What to Look For" is complete English, and capSeoTitle()
// (src/lib/documentTitle.ts) refuses to cut on a dangling word anyway. The
// historical defect this rule guards is a naive character cap that sliced at
// exactly TITLE_MAX_CHARS (60), e.g. "Review Count Integrity: The Numbers We".
// Only a title inside that length window can be such a product. Checking every
// dangling tail regardless of length reported two perfectly authored headlines
// as truncated (52 and 54 chars, both ending in "For").
const TRUNCATION_WINDOW = 4;
const TRUNCATION_MIN_LEN = MAX_TITLE - TRUNCATION_WINDOW;

function danglingTail(title) {
  const words = title.split(" ");
  const raw = title.endsWith(BRAND_SUFFIX)
    ? words.slice(0, -2).join(" ").split(" ").pop()
    : words[words.length - 1];
  return (raw || "").toLowerCase().replace(/[^a-z0-9.]/g, "");
}

/** Current rule: a dangling tail is a defect only when a cut could have made it. */
function isTruncatedDangling(title) {
  const tail = danglingTail(title);
  return !!tail && DANGLING.has(tail) && title.length >= TRUNCATION_MIN_LEN;
}

/** The pre-fix heuristic. Kept ONLY so the self-test can prove it was wrong. */
function legacyDanglingAlways(title) {
  const tail = danglingTail(title);
  return !!tail && DANGLING.has(tail);
}

function selfTest() {
  const cases = [
    { name: "authored headline ending in For", title: "Baby Stroller: What to Look For | BalanceBikeToddler", expect: false },
    { name: "second authored headline ending in For", title: "Stroller Prices: What You Pay For | BalanceBikeToddler", expect: false },
    { name: "ordinary headline", title: "Kids Bike Size Chart | BalanceBikeToddler", expect: false },
    { name: "naive 60-char cut from the historical defect", title: "Review Count Integrity: The Numbers We | BalanceBikeToddler", expect: true },
  ];
  const problems = [];
  for (const c of cases) {
    const got = isTruncatedDangling(c.title);
    if (got !== c.expect) problems.push(`${c.name}: expected ${c.expect}, got ${got}`);
  }
  // REVERSE: reverting to the old heuristic must turn these green pages red.
  // If the current rule ever degenerates into the old one, this fails.
  for (const c of cases.slice(0, 2)) {
    if (!legacyDanglingAlways(c.title)) problems.push(`REVERSE: legacy heuristic no longer misflags "${c.title}"`);
    if (isTruncatedDangling(c.title)) problems.push(`REVERSE: current rule degenerated into the legacy heuristic`);
  }
  // REVERSE: a real cut must still be caught by BOTH rules — the narrowing
  // must not have removed the defect class the guard exists for.
  const cut = cases[3];
  if (!legacyDanglingAlways(cut.title) || !isTruncatedDangling(cut.title)) {
    problems.push("REVERSE: a genuine truncated title is no longer detected");
  }
  if (cut.title.length > MAX_TITLE || cut.title.length < TRUNCATION_MIN_LEN) {
    problems.push(`fixture: genuine cut sample must be inside the ${TRUNCATION_MIN_LEN}-${MAX_TITLE} char truncation window (got ${cut.title.length})`);
  }
  if (problems.length) {
    for (const p of problems) console.error(`FAIL  ${p}`);
    console.error(`\n[titles] self-test FAILED — ${problems.length} problem(s)`);
    process.exit(1);
  }
  for (const c of cases) console.log(`PASS  ${c.name} -> ${c.expect ? "flagged" : "allowed"} (${c.title.length} chars)`);
  console.log("PASS  REVERSE: legacy heuristic misflags both authored headlines");
  console.log("PASS  REVERSE: genuine 60-char cut still detected");
  console.log(`\n[titles] self-test ${cases.length + 2}/${cases.length + 2} pass`);
  process.exit(0);
}

if (process.argv.includes("--self-test")) selfTest();

// The words the CAP refuses to end a cut on (src/lib/documentTitle.ts,
// TITLE_TAIL_FRAGMENTS) are deliberately NOT here. They describe a cut, not a
// title: "Balance Bike Budget: Guides & Tiers" is an authored headline that
// happens to end on "Tiers", and putting the word in this set reported 19
// perfectly good titles as broken. The cap already guarantees that a cut
// never lands on one of them.

// Titles go through escapeHtml(), so "&amp;" and "&#39;" are what lands in the
// file while a searcher (and every length limit) sees "&" and "'". Measuring the
// raw string reported false "too long"/"too short" values on every page that
// contains an ampersand, which is how a real 163-char description hid behind a
// 158-char check.
const ENTITIES = { "&amp;": "&", "&quot;": '"', "&#39;": "'", "&apos;": "'", "&lt;": "<", "&gt;": ">", "&nbsp;": " " };
const decode = (value) =>
  String(value)
    .replace(/&(?:amp|quot|#39|apos|lt|gt|nbsp);/g, (entity) => ENTITIES[entity] ?? entity)
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (entry.endsWith(".html")) out.push(full);
  }
  return out;
}

const files = walk(ROOT).sort();
const findings = [];
const byTitle = new Map();

for (const file of files) {
  const rel = file.split(path.sep).join("/").replace(`${ROOT}/`, "");
  const html = readFileSync(file, "utf8");
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/);
  if (!titleMatch) {
    findings.push({ file: rel, rule: "missing-title", detail: "no <title> found" });
    continue;
  }
  const title = decode(titleMatch[1]).replace(/\s+/g, " ").trim();
  const description = decode((html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "").trim();

  if (!title) findings.push({ file: rel, rule: "empty-title", detail: "empty <title>" });

  const key = title.toLowerCase();
  const previous = byTitle.get(key);
  if (previous) findings.push({ file: rel, rule: "duplicate-title", detail: `"${title}" already used by ${previous}`, fatal: true });
  else byTitle.set(key, rel);

  if (title.length > MAX_TITLE) {
    findings.push({ file: rel, rule: "title-too-long", detail: `${title.length} chars (>${MAX_TITLE}): "${title}"` });
  }
  if (/\s{2,}/.test(title)) {
    findings.push({ file: rel, rule: "double-space", detail: `"${title}"` });
  }
  if (ASIN.test(title)) {
    findings.push({ file: rel, rule: "asin-in-title", detail: `"${title}"` });
  }
  if (ASIN.test(description)) {
    findings.push({ file: rel, rule: "asin-in-description", detail: (description || "").slice(0, 90) });
  }
  const words = title.split(" ");
  const tail = words[words.length - 1]?.toLowerCase().replace(/[^a-z0-9.]/g, "");
  if (title.endsWith(BRAND_SUFFIX)) {
    const before = words.slice(0, -2).join(" ");
    const lastMeaningful = before.split(" ").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (isTruncatedDangling(title)) {
      findings.push({ file: rel, rule: "dangling-title", detail: `"${title}" ends on "${danglingTail(title)}" after truncation` });
    }
  } else if (!rel.startsWith("products/") && rel !== "index.html") {
    findings.push({ file: rel, rule: "missing-brand-suffix", detail: `"${title}"` });
  } else if (tail && isTruncatedDangling(title) && !rel.startsWith("products/")) {
    findings.push({ file: rel, rule: "dangling-title", detail: `"${title}"` });
  }
  if (/&\s*\|/.test(title) || /\|\s*\|/.test(title) || /\.\s*\|/.test(title)) {
    findings.push({ file: rel, rule: "broken-punctuation", detail: `"${title}"` });
  }
  if (description.length > MAX_DESCRIPTION) {
    findings.push({ file: rel, rule: "description-too-long", detail: `${description.length} chars (>${MAX_DESCRIPTION})` });
  }
}

console.log(`[titles] scanned ${files.length} page(s) in ${ROOT}`);
if (!findings.length) {
  console.log(`[titles] ok — no machine-stamped or truncated titles`);
  process.exit(0);
}

const grouped = new Map();
for (const finding of findings) {
  const key = finding.rule;
  grouped.set(key, [...(grouped.get(key) || []), finding]);
}
for (const [rule, list] of grouped) {
  console.log(`\n[${rule}] ${list.length}`);
  for (const finding of list.slice(0, 12)) console.log(`  ${finding.file} :: ${finding.detail}`);
  if (list.length > 12) console.log(`  … ${list.length - 12} more`);
}
console.log(`\n[titles] FAILED — ${findings.length} finding(s)`);
process.exit(1);
