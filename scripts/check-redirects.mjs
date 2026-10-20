/**
 * Guards dist/_redirects against the failure that silently ate the SPA
 * fallback in production.
 *
 * The root cause was NOT size. It was a rule shape: Pages drops any rule whose
 * source contains `*` and whose target is `/index.html`, without a word of
 * warning. The SPA prefix block is written exactly that way when aimed at
 * `/index.html`, and it has to sit last — prefix rewrites must lose to the exact
 * rules above them — so the whole block went: /compare and friends answered
 * 404, and so did every guide/news/review detail page published in the CMS
 * after the last deploy. See redirects-no-index-html-target below.
 *
 * Pages also resolves a request against the static asset tree before it reads
 * this file (/x -> /x.html) and normalises trailing slashes itself (/x/ -> 308
 * -> /x), so rules that just restate those are dead weight. And it rejects the
 * "200!" forced-rewrite suffix outright.
 *
 * The retired-URL 301 family used to be generated into this file and was what
 * made it grow; it lives in the Worker now (sync_redirects_to_worker.mjs), so
 * the line budget below is alarm margin, not a real constraint.
 *
 * Long-form rationale lives in doc/redirects_en.md + doc/redirects_zh.md.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const redirectsPath = resolve(root, "dist", "_redirects");

if (!existsSync(redirectsPath)) {
  console.error(
    JSON.stringify({ ok: false, failed: [{ name: "redirects-present", detail: "dist/_redirects is missing — run the build first" }] }, null, 2),
  );
  process.exit(1);
}

const text = readFileSync(redirectsPath, "utf8");
const lines = text.split("\n");
const rules = [];
for (let i = 0; i < lines.length; i += 1) {
  const raw = lines[i].trim();
  if (!raw || raw.startsWith("#")) continue;
  rules.push({ line: i + 1, raw, source: raw.split(/\s+/)[0] });
}

// Hard-ish ceiling. The generated retired-URL block grows with the catalogue,
// so without a cap this file drifts upward unnoticed. The real failure mode we
// hit was not size, though — see redirects-no-index-html-target below.
const MAX_LINES = 100;
const failures = [];

if (lines.length > MAX_LINES) {
  failures.push({
    name: "redirects-line-budget",
    detail: `dist/_redirects has ${lines.length} lines; Pages drops everything past ~120 (limit ${MAX_LINES}). Move retired-URL 301s into the Worker or collapse them into wildcard rules.`,
  });
}

// Pages' validator rejects the "!" suffix, so these rules never fire.
for (const rule of rules) {
  if (/\s200!\s*$/.test(rule.raw)) {
    failures.push({
      name: "redirects-no-forced-rewrite",
      detail: `line ${rule.line} uses "200!" — Pages rejects it as an invalid status code. Use a plain 200 rewrite or ship the page as a static file.`,
    });
  }
}

// The bug that actually bit us. Pages exposes the root document as "/" and
// normalises "/index.html" -> "/" with a 308, but a *wildcard* rule whose target
// is "/index.html" never resolves, so Pages drops the rule without a peep — the
// build log only ever mentioned an unrelated "100 dynamic rules" cap. The whole
// SPA prefix block vanished this way: /compare, /auth, /search, /evaluations and
// /transparency answered 404, and so did every guide/news/review detail page
// published in the CMS after the last deploy.
for (const rule of rules) {
  if (!rule.source.includes("*")) continue;
  const target = rule.raw.split(/\s+/)[1];
  if (target === "/index.html") {
    failures.push({
      name: "redirects-no-index-html-target",
      detail: `line ${rule.line} (${rule.source}) targets "/index.html" — Pages drops wildcard rules with that target silently. Target "/" instead.`,
    });
  }
}

const seen = new Map();
for (const rule of rules) {
  if (seen.has(rule.source)) {
    failures.push({
      name: "redirects-no-duplicate-source",
      detail: `line ${rule.line} repeats source "${rule.source}" (first seen on line ${seen.get(rule.source)}) — the second rule is unreachable.`,
    });
  } else {
    seen.set(rule.source, rule.line);
  }
}

// The prefix block must be the last thing in the file, or an overflow (or a stray
// append) silently removes it.
const prefixRules = rules.filter((rule) => rule.source.endsWith("/*"));
if (prefixRules.length === 0) {
  failures.push({
    name: "redirects-spa-fallback-present",
    detail: "no prefix rewrite rules found — the SPA fallback is missing.",
  });
} else {
  const lastPrefixLine = prefixRules[prefixRules.length - 1].line;
  const trailingRules = rules.filter((rule) => rule.line > lastPrefixLine);
  if (trailingRules.length > 0) {
    failures.push({
      name: "redirects-spa-fallback-last",
      detail: `${trailingRules.length} rule(s) sit below the SPA prefix block (first: line ${trailingRules[0].line}) — move them above it or they will be truncated.`,
    });
  }
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failed: failures }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      lines: lines.length,
      budget: MAX_LINES,
      rules: rules.length,
      prefixRules: prefixRules.length,
    },
    null,
    2,
  ),
);
