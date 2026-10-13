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
const MAX_TITLE = 65;
const MAX_DESCRIPTION = 158;
const ASIN = /\bB0[0-9A-Z]{8}\b/;
const DANGLING = new Set([
  "a", "an", "the", "and", "or", "but", "nor", "as", "at", "by", "for", "from",
  "in", "of", "on", "to", "with", "than", "then", "that", "this", "these",
  "those", "it", "its", "is", "are", "was", "we", "our", "you", "your", "who",
  "how", "what", "when", "where", "why", "vs", "vs.",
]);

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
    if (lastMeaningful && DANGLING.has(lastMeaningful)) {
      findings.push({ file: rel, rule: "dangling-title", detail: `"${title}" ends on "${lastMeaningful}" after truncation` });
    }
  } else if (!rel.startsWith("products/") && rel !== "index.html") {
    findings.push({ file: rel, rule: "missing-brand-suffix", detail: `"${title}"` });
  } else if (tail && DANGLING.has(tail) && !rel.startsWith("products/")) {
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
