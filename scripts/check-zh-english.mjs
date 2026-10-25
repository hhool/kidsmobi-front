/**
 * Chinese-page English-leak guard.
 *
 * A /zh page is a Chinese page: the article body, the section labels, the
 * card meta, the byline and the footer all have to be Chinese. English is
 * legitimate in exactly three places — product names (the CMS catalogue is
 * English-only), brand/standard names inside translated prose (Strider,
 * "EN 71", ASINs), and the hrefs of links to English-only pages. Everything
 * else is a leak.
 *
 * The leaks this was written after were all invisible in review because each
 * one looked like content rather than chrome:
 *   - the prerendered footer was a hardcoded English block on every /zh page;
 *   - the "related reviews" matcher preferred e.en.title although every
 *     evaluation carries a Chinese title;
 *   - the /zh hub card meta printed the raw topic slug ("beginner · date");
 *   - the cluster nav used labelEn/blurbEn although labelZh/blurbZh exist;
 *   - the article byline hardcoded "BalanceBikeToddler Editorial Team";
 *   - the prerender's inline renderer only converted absolute-URL markdown
 *     links, so 320 relative links shipped as literal "[text](/path)".
 *
 * This guard scans every built /zh page for those classes:
 *   1. literal markdown link syntax "](...)";
 *   2. a blocklist of English UI strings (section labels, footer, byline);
 *   3. English topic slugs / news channel names in card meta ("beginner · ").
 *
 * Product names are NOT blockable (they are the data), so this guard is a
 * floor, not a ceiling: a new English UI string that nobody adds to the
 * blocklist will pass. Add strings as they are found.
 *
 * Run: npm run check:zh-english   (after `npm run build`)
 */
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const DIST = "dist";
const ZH_ROOT = join(DIST, "zh");

/** English strings that must never appear in a built Chinese page's HTML. */
const BLOCKED_STRINGS = [
  // section labels
  "Related Reviews",
  "Products Mentioned in This Guide",
  "Back to Guides",
  "Continue browsing",
  "full guide library",
  "the news hub",
  // byline / team
  "Editorial Team",
  // footer — section links
  "Recall record",
  "Size chart",
  "Safety standards",
  "Weight & build",
  "Stability & track width",
  "Balance bike by age",
  "What buyers say",
  "Budget & value",
  // footer — trust links
  "Testing Methodology",
  "Certification & Standards Notes",
  "Editorial Disclaimer",
  "Privacy Policy",
  "Terms of Use",
  "Search Data",
  "Review Count Integrity",
  // footer — tagline
  "evidence-based analysis of kids ride-on",
  // hub / channel labels
  "Industry Trends",
  "New Products",
  "Science &amp; Safety",
  "Brand news",
  "Brand News",
];

/** English topic slug or news channel name in a card meta line. */
const META_SLUG = /\b(beginner|scenario|budget|risk|maintenance|special|best|category_spec|industry|new_product|science|brand_news)\s*·/;

/** Literal markdown link syntax: [text](/path) or [text](https://…). */
const MARKDOWN_LINK = /\]\((?:\/|https?:\/\/)/;

function walk(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (entry.endsWith(".html")) out.push(full);
  }
  return out;
}

const problems = [];
let checked = 0;

if (!existsSync(ZH_ROOT)) {
  console.error("check:zh-english FAILED — dist/zh does not exist (run `npm run build` first)");
  process.exit(1);
}

for (const file of walk(ZH_ROOT)) {
  checked += 1;
  const route = "/" + file.replace(DIST + "/", "").replace(/\\/g, "/").replace(/\.html$/, "");
  // Strip script blocks so an inline script can never false-positive (the GA
  // snippet and the boot cover are the only inline scripts on these pages).
  const visible = readFileSync(file, "utf8")
    .replace(/<script[\s\S]*?<\/script>/gi, "\n")
    .replace(/<style[\s\S]*?<\/style>/gi, "\n");

  for (const needle of BLOCKED_STRINGS) {
    if (visible.includes(needle)) {
      problems.push(`${route}: English UI string "${needle}" is still in the page`);
    }
  }
  const slugHit = visible.match(META_SLUG);
  if (slugHit) {
    problems.push(`${route}: card meta carries an English topic/channel label ("${slugHit[0]}")`);
  }
  const mdHit = visible.match(MARKDOWN_LINK);
  if (mdHit) {
    const at = visible.indexOf(mdHit[0]);
    problems.push(
      `${route}: literal markdown link syntax near "${visible.slice(Math.max(0, at - 40), at + 40).replace(/\s+/g, " ")}"`,
    );
  }
}

if (problems.length > 0) {
  console.error(`check:zh-english FAILED (${problems.length} problem(s) over ${checked} pages)`);
  for (const problem of problems.slice(0, 25)) console.error(`  - ${problem}`);
  if (problems.length > 25) console.error(`  ... and ${problems.length - 25} more`);
  process.exit(1);
}

console.log(`check:zh-english OK — ${checked} Chinese pages carry no blocked English UI`);
