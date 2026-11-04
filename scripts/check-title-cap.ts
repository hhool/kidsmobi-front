/**
 * Regression guard for the <title> budget and the title cap.
 *
 * The G4 hard list (repos/wb-seo-teardown/references/technical-baseline-34.md,
 * row 1) asks for one unique title per page, 25-60 characters. The site
 * allowed 65, so 108 of the 441 rendered pages published a title Google would
 * have cut anyway — and the cap that enforced 65 cut the BRAND off the end
 * whenever a title already carried the suffix, because it capped the whole
 * string instead of the body.
 *
 * Two things are guarded here:
 *
 *   1. the cap itself — a table of titles whose capped form is decided by
 *      hand, so a change in the word lists cannot quietly re-break a title;
 *   2. the built output — every rendered page's <title> must be 25-60
 *      characters, unique across the site, and must keep the brand suffix.
 *
 * Usage: npx tsx scripts/check-title-cap.ts   (run after the build)
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  SITE_TITLE_SUFFIX,
  TITLE_MAX_CHARS,
  buildDocumentTitle,
  capSeoTitle,
} from "../src/lib/documentTitle";

const DIST = resolve("dist");

/* ------------------------------------------------------------------ *
 * 1. The cap, decided by hand.
 * ------------------------------------------------------------------ */

type CapCase = {
  /** The title as authored (no brand suffix). */
  input: string;
  /** What the cap must produce. */
  expect: string;
  /** Why this case matters. */
  why: string;
};

const CAP_CASES: CapCase[] = [
  {
    input: "Budget Balance Bike: Cheap Picks That Last",
    expect: "Budget Balance Bike: Cheap Picks",
    why: "the clause prefix that fits is a complete phrase — keep it",
  },
  {
    input: "Balance Bike by Age: Fits a 2, 3, 4 Year Old",
    expect: "Balance Bike by Age",
    why: "a cut that ends on a bare number is a broken list — drop the clause",
  },
  {
    input: "Kids Bike Weight: How Much Does It Weigh?",
    expect: "Kids Bike Weight",
    why: "'Does' is the head of a phrase, not its tail",
  },
  {
    input: "Kids Bike by Age: Fits a 2, 6 or 12 Year Old",
    expect: "Kids Bike by Age",
    why: "the clause head is authored — it must never lose 'Age'",
  },
  {
    input: "Balance Bike Recalls: CPSC + EU Safety Gate",
    expect: "Balance Bike Recalls: CPSC",
    why: "'Safety' and 'EU' both trail a phrase — the clause prefix stops at CPSC",
  },
  {
    input: "2026 Kids' Ride-On Safety Standard Updates",
    expect: "2026 Kids' Ride-On Safety Standard",
    why: "'Standard' ends a title fine — only 'Updates' is dropped",
  },
  {
    input: "Where to Ride a Balance Bike: Terrain Guide",
    expect: "Where to Ride a Balance Bike",
    why: "'Terrain' is a modifier of 'Guide'",
  },
  {
    input: "Best Balance Bike for a 1-Year-Old: Guide",
    expect: "Best Balance Bike for a 1-Year-Old",
    why: "the qualifier clause is dropped whole",
  },
  {
    input: "折叠电动滑板车（Foldable Electric Scooter）世界知名品牌汇总",
    expect: "折叠电动滑板车",
    why: "a cut that leaves an opening bracket unclosed is cut before it",
  },
  {
    input: "KRIDDO Toddler Balance Bike 2 Year Review",
    expect: "KRIDDO Toddler Balance Bike 2 Year",
    why: "dropping 'Review' loses nothing a searcher reads",
  },
  {
    input: "SEREED Baby Balance Bike Review for 1 Year Old Toddlers",
    expect: "SEREED Baby Balance Bike Review",
    why: "a cut ending on a bare number drops the number, then the dangling word",
  },
  {
    input: "Toddler Electric Car: What a 1-3 Year Old",
    expect: "Toddler Electric Car",
    why: "'1-3' is a broken number fragment — drop the clause",
  },
  {
    input: "Kids Ride-On Voltage: 6V, 12V, 24V or 36V",
    expect: "Kids Ride-On Voltage: 6V, 12V, 24V",
    why: "'24V' is a unit, not a bare number — the list may stand",
  },
];

/* ------------------------------------------------------------------ *
 * 2. The built output.
 * ------------------------------------------------------------------ */

function htmlFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...htmlFiles(full));
    else if (entry.endsWith(".html")) out.push(full);
  }
  return out;
}

function titleOf(html: string): string {
  const m = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (!m) return "";
  return m[1]
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

const failures: string[] = [];

for (const testCase of CAP_CASES) {
  const got = capSeoTitle(testCase.input, TITLE_MAX_CHARS - SITE_TITLE_SUFFIX.length);
  if (got !== testCase.expect) {
    failures.push(
      `capSeoTitle(${JSON.stringify(testCase.input)})\n  expected: ${JSON.stringify(testCase.expect)}\n  got:      ${JSON.stringify(got)}\n  why:      ${testCase.why}`,
    );
  }
}

// The brand suffix must survive a cap. Before the fix, capping an
// already-suffixed title cut the brand off the end.
{
  const capped = buildDocumentTitle("Independent Kids Bike & Stroller Reviews | BalanceBikeToddler");
  if (!capped.endsWith(SITE_TITLE_SUFFIX)) {
    failures.push(`buildDocumentTitle() dropped the brand suffix: ${JSON.stringify(capped)}`);
  }
  if (capped.length > TITLE_MAX_CHARS) {
    failures.push(`buildDocumentTitle() returned ${capped.length} chars: ${JSON.stringify(capped)}`);
  }
}

// The house rule: the brand suffix stays, and the authored wording is kept
// as far as the budget allows. A title that needs the room loses its clause
// ("…: What Wins"), but it does not lose the brand and it does not lose its
// head — the head is what the page is about.
{
  const got = buildDocumentTitle("Balance Bike vs Training Wheels: What Wins");
  if (!got.endsWith(SITE_TITLE_SUFFIX)) {
    failures.push(`buildDocumentTitle() dropped the brand suffix: ${JSON.stringify(got)}`);
  }
  if (!got.startsWith("Balance Bike vs Training Wheels")) {
    failures.push(`buildDocumentTitle() cut the head of the title: ${JSON.stringify(got)}`);
  }
  if (got.length > TITLE_MAX_CHARS) {
    failures.push(`buildDocumentTitle() returned ${got.length} chars: ${JSON.stringify(got)}`);
  }
}

// The brand still rides along when there is room for it.
{
  const got = buildDocumentTitle("Best Kids Bikes, Strollers & Scooters");
  if (!got.endsWith(SITE_TITLE_SUFFIX)) {
    failures.push(`buildDocumentTitle() dropped the brand suffix: ${JSON.stringify(got)}`);
  }
}

const titles = new Map<string, string[]>();
let rendered = 0;
const CAPS_ONLY = process.argv.includes("--caps-only");
try {
  if (!CAPS_ONLY) {
    for (const file of htmlFiles(DIST)) {
      const html = readFileSync(file, "utf8");
      const title = titleOf(html);
      if (!title) continue;
      rendered += 1;
      const rel = file.slice(DIST.length + 1);
      titles.set(title, [...(titles.get(title) || []), rel]);
      if (title.length < 25 || title.length > TITLE_MAX_CHARS) {
        failures.push(`${rel}: title is ${title.length} chars — ${JSON.stringify(title)}`);
      }
    }
  }
} catch (error) {
  console.error(`[check-title-cap] cannot read ${DIST}: ${(error as Error).message}`);
  process.exit(1);
}

for (const [title, files] of titles) {
  if (files.length > 1) {
    failures.push(`${files.length} pages share one title ${JSON.stringify(title)}: ${files.slice(0, 5).join(", ")}`);
  }
}

if (failures.length) {
  console.error(`[check-title-cap] ${failures.length} problem(s):`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(
  `[check-title-cap] ${CAP_CASES.length} cap cases, ${rendered} rendered titles: all ${TITLE_MAX_CHARS} chars or fewer, all unique`,
);
