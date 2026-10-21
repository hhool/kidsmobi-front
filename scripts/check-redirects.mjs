/**
 * Guards dist/_redirects against the two failures that actually bit us in
 * production — both of them silent, neither of them about size.
 *
 * 1. A wildcard rule whose target is "/index.html" is dropped without a word
 *    of warning (Pages exposes the root document as "/", so that target never
 *    resolves). The SPA prefix block was written that way for weeks and was
 *    dead the whole time. See redirects-no-index-html-target below.
 *
 * 2. A wildcard rule whose target is ANY static path shadows every prerendered
 *    page under that prefix, because the rewrite takes precedence over the
 *    static asset tree. Fixing (1) by retargeting the prefix block to "/"
 *    therefore took the site from "fallback silently dead" straight to
 *    "255 of 269 sitemap URLs serving the homepage shell" — title and
 *    canonical both pointing at "/". Status-code probes could not see it
 *    (everything still answered 200); only a raw-HTML title/canonical check
 *    can. See redirects-no-wildcard-static-target below.
 *
 * Pages also rejects the "200!" forced-rewrite suffix outright, and the file
 * is capped (~120 lines) with the overflow dropped silently.
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

// The bug that actually bit us, take one — and it has two faces, both verified
// live. Pages exposes the root document as "/" and normalises "/index.html"
// -> "/" with a 308. A *wildcard* rule with that target never resolves, so
// Pages drops it without a peep (the SPA prefix block was dead for weeks this
// way). An *exact* rule with that target is NOT dropped — it fires and
// 308-redirects to "/", silently losing the path: on 2026-10-21 the five bare
// roots answered 308 -> / at the no-slash form and 404 at the slash form.
// "/index.html" is therefore never a valid target for any rule shape.
for (const rule of rules) {
  const target = rule.raw.split(/\s+/)[1];
  if (target === "/index.html") {
    failures.push({
      name: "redirects-no-index-html-target",
      detail: `line ${rule.line} (${rule.source}) targets "/index.html" — Pages normalises that target to "/": a wildcard rule is dropped silently, an exact rule 308-redirects to "/" and loses the path. Target "/" instead.`,
    });
  }
}

// The bug that actually bit us, take two — and the more dangerous one, because
// the fix for take one walked straight into it. A wildcard rewrite takes
// precedence over the static asset tree, so `/products/* / 200` served the
// homepage shell for all 181 prerendered product pages (and the same for
// guides, reviews, news and transparency): 255 of 269 sitemap URLs shipped the
// homepage title with a homepage canonical. A wildcard simply cannot be made
// to lose to a static file, so no wildcard rule may target a static path at
// all. Redirects to another origin (the /api/* proxy) are fine.
const isExternal = (target) => /^https?:\/\//i.test(target);
for (const rule of rules) {
  if (!rule.source.includes("*")) continue;
  const target = rule.raw.split(/\s+/)[1];
  if (!isExternal(target)) {
    failures.push({
      name: "redirects-no-wildcard-static-target",
      detail: `line ${rule.line} (${rule.source}) targets "${target}" — a wildcard rewrite shadows every prerendered page under that prefix (Pages applies the rule before the static asset tree). Use exact rules for the few paths that have no prerendered sibling, or move the rule into the Worker.`,
    });
  }
}

// The five bare app roots are SPA-only routes: no prerendered sibling, no
// static file, so they need an exact rewrite to "/" (the shell document).
// Without it they 404. With a wildcard they would shadow their prefix — hence
// exact. TWO rules per root: Pages matches the source exactly, so the
// no-slash rule alone leaves the slash form 404ing (verified live 2026-10-21,
// when the roots carried only the no-slash form). The target must be "/", not
// "/index.html" — see redirects-no-index-html-target above; this assertion
// used to accept either, which is how the broken shape shipped.
const BARE_APP_ROOTS = ["/compare", "/auth", "/search", "/evaluations", "/transparency"];
const ruleBySource = new Map(rules.map((rule) => [rule.source, rule]));
for (const root of BARE_APP_ROOTS) {
  for (const form of [root, `${root}/`]) {
    const rule = ruleBySource.get(form);
    const target = rule ? rule.raw.split(/\s+/)[1] : null;
    if (!rule) {
      failures.push({
        name: "redirects-bare-roots-covered",
        detail: `${form} has no rewrite rule — it is a SPA-only route with no prerendered sibling, so it answers 404. Add an exact rule: "${form} / 200".`,
      });
    } else if (isExternal(target)) {
      failures.push({
        name: "redirects-bare-roots-covered",
        detail: `${form} (line ${rule.line}) redirects off-origin — it must rewrite to "/" so the SPA can render the route.`,
      });
    } else if (target !== "/") {
      failures.push({
        name: "redirects-bare-roots-covered",
        detail: `${form} (line ${rule.line}) targets "${target}" — an exact rule targeting "/index.html" 308-redirects to "/" and loses the path (verified live 2026-10-21). Target "/".`,
      });
    }
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

// There is deliberately no SPA prefix block any more: the wildcard→static
// shape above is what shadowed the prerendered pages. Unknown sub-paths under
// an app prefix answer 404, which is what the site actually did for the whole
// period the old block was being silently dropped. A real fallback (shell for
// CMS pages that are published but not yet built) has to live in the Worker,
// which can ask D1 whether a path exists — see doc/redirects_en.md.

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
      wildcardRules: rules.filter((rule) => rule.source.includes("*")).length,
    },
    null,
    2,
  ),
);
