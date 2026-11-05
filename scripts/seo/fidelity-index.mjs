#!/usr/bin/env node
/**
 * Classify every Lighthouse report in .runs/lh/ by whether it actually
 * measured the production object.
 *
 * Why this file exists: the reports in .runs/lh/ were collected across many
 * sessions, some before the fidelity rules existed. A report that did not
 * measure the production object still carries a perfectly plausible LCP
 * number, and three of them were measured at LCP 829-844 ms - a value that
 * would have passed audit item 23 - while the real page painted its hero at
 * 6,296 ms. A number without a verdict is a trap, so the verdict is written
 * next to the numbers.
 *
 * The rules live in render-blocking-probe.mjs (judgeFidelity), which is the
 * single implementation. This script only runs them over the archive and
 * writes an index, so the attribution generator never has to re-implement
 * them - and cannot disagree with them.
 *
 * Usage:
 *   node scripts/seo/fidelity-index.mjs            # write .runs/lh/fidelity-index.json
 *   node scripts/seo/fidelity-index.mjs --print    # also print the rejected reports
 */
import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const FRONT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const LH_DIR = path.join(FRONT, '.runs/lh');
const OUT = path.join(LH_DIR, 'fidelity-index.json');

const { judgeFidelity } = await import(
  pathToFileURL(path.join(FRONT, 'scripts/seo/render-blocking-probe.mjs')).href
);

/**
 * What each measured object IS, so the rules apply to the object they were
 * written for.
 *
 *   spa      the shipped SPA homepage: the SPA takes the production data
 *            path, the first-paint cover is transient, and the largest paint
 *            is the hero photograph.
 *   spa-noh  the same page with the hero deliberately taken away, so the
 *            largest paint is a text block and that is the truth of it.
 *   document the homepage as a document: no SPA at all, so it takes no data
 *            path, and the cover is the page rather than a transient layer.
 *
 * The static-hero variant belongs to spa-noh because its hand-over destroys
 * the static hero; every other variant of the shipped page is a plain spa.
 */
const OBJECTS = {
  'static-home': { expectSpa: false, expectLcpImage: false },
  'static-home-optimized': { expectSpa: false, expectLcpImage: false },
  'static-home-critical': { expectSpa: false, expectLcpImage: false },
  'static-home-small': { expectSpa: false, expectLcpImage: false },
  'static-home-nofonts': { expectSpa: false, expectLcpImage: false },
  'static-floor': { expectSpa: false, expectLcpImage: false },
  'static-hero-test': { expectSpa: true, expectLcpImage: false },
};

/**
 * The build a report is filed under, and the fingerprints that build carries.
 *
 * A report named "<variant>-<suffix><n>.json" was measured against
 * .runs/<variant>/dist. Two fingerprints are checked:
 *
 *   - the entry bundle's hashed name (two variants patched from one build
 *     share a bundle and differ only in the HTML);
 *   - the decoded size of the built index.html, which the report's own
 *     document request carries.
 *
 * A report that carries neither is a report of some other build, and it is
 * rejected - which is how four rounds filed as the control were found to
 * have measured a leftover server's build instead.
 */
function expectedBuild(name) {
  const variant = name.replace(/-[a-z]?\d+\.json$/, '').replace(/\.json$/, '');
  const index = path.join(FRONT, '.runs', variant, 'dist', 'index.html');
  const object = OBJECTS[variant] || { expectSpa: true, expectLcpImage: true };
  if (!existsSync(index)) {
    // The object kind is known from the name even when the build that was
    // measured is no longer on disk - and then the fingerprints cannot be
    // checked, which is worth saying out loud rather than passing quietly.
    return { entry: null, documentSize: null, object, buildPresent: false };
  }
  const html = readFileSync(index, 'utf8');
  const match = html.match(/assets\/index-[A-Za-z0-9_-]+\.js/);
  return {
    entry: match ? match[0] : null,
    documentSize: Buffer.byteLength(html, 'utf8'),
    object,
    buildPresent: true,
  };
}

function looksLikeLighthouseReport(text) {
  try {
    const parsed = JSON.parse(text);
    return Boolean(parsed && parsed.audits && typeof parsed.audits === 'object');
  } catch {
    return false;
  }
}

function main() {
  if (!existsSync(LH_DIR)) {
    console.log('fidelity-index SKIP — .runs/lh/ does not exist');
    return;
  }
  mkdirSync(LH_DIR, { recursive: true });

  const index = {};
  const rejected = [];
  let readable = 0;
  let unreadable = 0;

  for (const name of readdirSync(LH_DIR).sort()) {
    if (!name.endsWith('.json')) continue;
    if (name === 'fidelity-index.json' || name === 'summary.json') continue;
    const full = path.join(LH_DIR, name);
    let text;
    try {
      text = readFileSync(full, 'utf8');
    } catch {
      continue;
    }
    if (!looksLikeLighthouseReport(text)) {
      unreadable += 1;
      continue;
    }
    readable += 1;
    let verdict;
    try {
      const expected = expectedBuild(name);
      verdict = judgeFidelity(JSON.parse(text), {
        expectedEntry: expected && expected.buildPresent ? expected.entry : null,
        expectedDocumentSize: expected && expected.buildPresent ? expected.documentSize : null,
        expectSpa: expected ? expected.object.expectSpa : true,
        expectLcpImage: expected ? expected.object.expectLcpImage : true,
      });
    } catch (error) {
      verdict = { status: 'unknown', problems: [`the report could not be judged: ${error.message}`], notes: [] };
    }
    index[name] = {
      status: verdict.status,
      problems: verdict.problems || [],
      notes: verdict.notes || [],
    };
    if (verdict.status !== 'pass') rejected.push(name);
  }

  const passed = Object.values(index).filter((v) => v.status === 'pass').length;
  const summary = {
    generated_for: 'every Lighthouse report in .runs/lh/',
    rule_source: 'scripts/seo/render-blocking-probe.mjs :: judgeFidelity()',
    counts: {
      reports: readable,
      trusted: passed,
      rejected: rejected.length,
      unreadable,
    },
    rejected,
    reports: index,
  };
  writeFileSync(OUT, `${JSON.stringify(summary, null, 2)}\n`);

  console.log(`  reports: ${readable}  trusted: ${passed}  rejected: ${rejected.length}  unreadable: ${unreadable}`);
  if (process.argv.includes('--print')) {
    for (const name of rejected) {
      console.log(`  FAIL ${name}`);
      for (const problem of index[name].problems) console.log(`       - ${problem}`);
    }
  }
  console.log(`  index: .runs/lh/fidelity-index.json`);
}

main();
