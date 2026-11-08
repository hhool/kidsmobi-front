/**
 * Footer UI contract — 2026-11-08 owner review.
 *
 * Three findings, one root cause each:
 *   1. Global Network had only the X button; a Facebook icon was missing.
 *   2. The "Guides & News" column was to be removed whole (SPA + crawler HTML).
 *   3. The brand icon was missing — but BrandMark WAS mounted. Its SVG was
 *      squeezed to width 0 by the footer's flex row (measured 0 x 32 on both
 *      local and live). The fix is `shrink-0`, not a new asset.
 *
 * This guard reads source and built HTML. It deliberately checks the *shape*
 * of the fix rather than the rendered pixels (a browser probe covers those),
 * and every rule has a reverse assertion: feed it the old implementation and
 * the rule must go red.
 *
 * Usage: node scripts/check-footer-ui.mjs [--selftest]
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd());
const PATHS = {
  app: "src/App.tsx",
  brand: "src/components/BrandMark.tsx",
  prerender: "scripts/prerender-pages.ts",
  social: "src/lib/socialShare.ts",
  share: "src/components/common/SocialShareButtons.tsx",
  distGuides: "dist/guides.html",
  distArticle: "dist/guides/maintenance/kids-ride-on-winter-storage.html",
};

// Each rule: which file, the predicate that must hold, and a `break` function
// that restores the pre-fix implementation. A rule whose `break` does not make
// the predicate fail is not a rule — the self-test rejects it.
const RULES = [
  {
    name: "brand mark keeps shrink-0",
    file: "app+brand",
    ok: (s) => /className=\{`shrink-0 \$\{className\}`\}/.test(s.brand),
    break: (s) => ({ ...s, brand: s.brand.replace(/className=\{`shrink-0 \$\{className\}`\}/, "className={className}") }),
  },
  {
    name: "SPA footer no longer maps FOOTER_ARTICLE_LINKS",
    file: "app",
    ok: (s) => !s.app.includes("FOOTER_ARTICLE_LINKS.map") && !s.app.includes('from "./lib/footerArticles"'),
    break: (s) => ({ ...s, app: s.app + '\nimport { FOOTER_ARTICLE_LINKS } from "./lib/footerArticles";\n{FOOTER_ARTICLE_LINKS.map((a) => a.path)}\n' }),
  },
  {
    name: "SPA has no Guides & News column heading",
    file: "app",
    ok: (s) => !s.app.includes('lang === "en" ? "Guides & News"'),
    break: (s) => ({ ...s, app: s.app + '\n{lang === "en" ? "Guides & News" : "指南与动态"}\n' }),
  },
  {
    name: "SPA footer grid has 5 columns after the removal",
    file: "app",
    ok: (s) => s.app.includes("md:grid-cols-4 lg:grid-cols-5 gap-8 mb-16"),
    break: (s) => ({ ...s, app: s.app.replace("md:grid-cols-4 lg:grid-cols-5 gap-8 mb-16", "md:grid-cols-4 lg:grid-cols-6 gap-8 mb-16") }),
  },
  {
    name: "Facebook icon is rendered from the shared glyph",
    file: "app",
    ok: (s) => s.app.includes("<path d={SOCIAL_BRAND_PATHS.facebook} />"),
    break: (s) => ({ ...s, app: s.app.replace("<path d={SOCIAL_BRAND_PATHS.facebook} />", "") }),
  },
  {
    name: "Facebook icon links to a real share URL, not a placeholder",
    file: "app",
    ok: (s) => /buildSocialShareUrl\(\s*"facebook"/.test(s.app) && s.app.includes('href={buildSocialShareUrl('),
    break: (s) => ({ ...s, app: s.app.replace('href={buildSocialShareUrl(', 'href="#" data-legacy={buildSocialShareUrl(') }),
  },
  {
    name: "share glyphs live in one module",
    file: "social+share",
    ok: (s) => s.social.includes("export const SOCIAL_BRAND_PATHS") && !s.share.includes("const BRAND_PATHS"),
    break: (s) => ({ ...s, share: s.share + "\nconst BRAND_PATHS = {};\n" }),
  },
  {
    name: "crawler footer no longer prints the article row",
    file: "prerender",
    ok: (s) => !s.prerender.includes("articleLinks.map") && !s.prerender.includes("FOOTER_ARTICLE_LINKS"),
    break: (s) => ({ ...s, prerender: s.prerender + '\n<p>${articleLinks.map(link).join("")}</p>\n' }),
  },
  {
    name: "built /guides has no footer article links",
    file: "distGuides",
    ok: (s) => !s.distGuides.includes("Price Tiers Explained"),
    break: (s) => ({ ...s, distGuides: s.distGuides + "<a>Price Tiers Explained</a>" }),
  },
  {
    name: "built article page has no footer article links",
    file: "distArticle",
    ok: (s) => !s.distArticle.includes("Price Tiers Explained"),
    break: (s) => ({ ...s, distArticle: s.distArticle + "<a>Price Tiers Explained</a>" }),
  },
];

function loadSources() {
  const out = {};
  for (const [key, rel] of Object.entries(PATHS)) {
    const abs = resolve(ROOT, rel);
    out[key] = existsSync(abs) ? readFileSync(abs, "utf8") : "";
  }
  return out;
}

function runRules(sources) {
  const missing = Object.entries(PATHS).filter(([key]) => !sources[key]);
  const findings = missing.map(([key, rel]) => `missing file: ${rel} (${key}) — run npm run build first`);
  for (const rule of RULES) {
    if (!rule.ok(sources)) findings.push(rule.name);
  }
  return findings;
}

function selfTest() {
  const sources = loadSources();
  // The self-test exercises rule logic only. It always uses synthetic built
  // HTML: a stale dist from before the fix must not make the self-test fail,
  // and a fresh dist must not be able to make it pass by accident. A real
  // (non-selftest) run reads the actual build and refuses missing files.
  for (const key of ["distGuides", "distArticle"]) {
    sources[key] = "<html><footer></footer></html>";
  }
  const cases = [];

  // The real tree must pass every rule.
  for (const rule of RULES) {
    cases.push([`real source passes: ${rule.name}`, rule.ok(sources) === true]);
  }

  // Reverse assertions: restoring the old implementation must turn each rule red.
  for (const rule of RULES) {
    const broken = rule.break(sources);
    cases.push([`reverse: ${rule.name}`, rule.ok(broken) === false]);
  }

  // A missing build output must be reported, not silently treated as clean.
  cases.push([
    "a missing dist file is a finding, not a pass",
    runRules({ ...sources, distGuides: "" }).length > 0,
  ]);
  cases.push(["self-test has at least 10 reverse assertions", RULES.length >= 10]);

  const failed = cases.filter(([, ok]) => !ok);
  for (const [name, ok] of cases) console.log(`  ${ok ? "ok  " : "FAIL"} ${name}`);
  console.log(`check-footer-ui self-test ${failed.length ? "FAIL" : "PASS"} (${cases.length - failed.length}/${cases.length})`);
  return failed.length ? 1 : 0;
}

if (process.argv.includes("--selftest")) {
  process.exit(selfTest());
}

const findings = runRules(loadSources());
if (findings.length) {
  console.error("check:footer FAILED — %d finding(s)", findings.length);
  for (const f of findings) console.error("  - " + f);
  process.exit(1);
}
console.log("check:footer OK — brand mark shrink-0, 2 social icons, Guides & News column gone in both renderers");
