/**
 * Regression guard: no built page may publish a review count we cannot defend.
 *
 * Some catalogue rows carry review counts around 45 million for items like a
 * playard. prerender-pages.ts filters those through credibleReviewCount(), but
 * the values can come back — a CMS re-import, a new scrape adapter, or a code
 * path added later. This scans the built output so the failure is loud at build
 * time rather than silent and indexed.
 *
 * Usage: node scripts/check-review-counts.mjs
 */
import { readFileSync, readdirSync, statSync } from "fs";
import { join, resolve } from "path";

// Read the ceiling straight from the single source of truth so this guard can
// never drift from the filter it is guarding. Plain node cannot import .ts.
const SIGNAL_SRC = readFileSync(resolve(process.cwd(), "src/lib/reviewSignal.ts"), "utf8");
const CEILING_MATCH = SIGNAL_SRC.match(/export const MAX_PLAUSIBLE_REVIEW_COUNT = (\d[\d_]*);/);
if (!CEILING_MATCH) {
  console.error(JSON.stringify({ ok: false, error: "MAX_PLAUSIBLE_REVIEW_COUNT not found in src/lib/reviewSignal.ts" }, null, 2));
  process.exit(1);
}
const MAX_PLAUSIBLE_REVIEW_COUNT = Number(CEILING_MATCH[1].replace(/_/g, ""));

const distDir = resolve(process.cwd(), "dist");

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return full.endsWith(".html") ? [full] : [];
  });
}

let files;
try {
  files = walk(distDir);
} catch {
  console.error(JSON.stringify({ ok: false, error: `dist/ not found at ${distDir}. Run the build first.` }, null, 2));
  process.exit(1);
}

const findings = [];
const CHIP_RE = /· ([\d,]+) ratings/g;
const SCHEMA_RE = /"(?:ratingCount|reviewCount)":\s*(\d+)/g;

for (const file of files) {
  const html = readFileSync(file, "utf8");
  const rel = file.slice(distDir.length).replace(/\\/g, "/");
  for (const [pattern, kind] of [
    [CHIP_RE, "visible chip"],
    [SCHEMA_RE, "JSON-LD"],
  ]) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const value = Number(String(match[1]).replace(/,/g, ""));
      if (Number.isFinite(value) && value > MAX_PLAUSIBLE_REVIEW_COUNT) {
        findings.push({ file: rel, kind, value: value.toLocaleString("en-US") });
      }
    }
  }
}

if (findings.length) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        ceiling: MAX_PLAUSIBLE_REVIEW_COUNT,
        count: findings.length,
        detail:
          "Review counts above the plausibility ceiling reached the built HTML. Route them through credibleReviewCount() in src/lib/reviewSignal.ts.",
        findings,
      },
      null,
      2,
    ),
  );
  process.exit(1);
}

console.log(
  JSON.stringify({ ok: true, scanned: files.length, ceiling: MAX_PLAUSIBLE_REVIEW_COUNT, findings: 0 }, null, 2),
);
