/**
 * SPA header navigation keeps the Chinese edition on Chinese pages.
 *
 * The URL decides the language. A Chinese-only section header that pushes a
 * bare English path therefore flips the whole page to English mid-click:
 * on /zh/news, 选购指南 used to land on /guides. Reproduced in a real browser
 * on 2026-11-20.
 *
 * Only /zh/guides and /zh/news are translated sections; /zh/reviews,
 * /zh/products and /zh/about do not exist (they 301 back to English), so the
 * Reviews button is expected to stay on the bare English path.
 *
 * Two places must agree:
 *   1. navigateToTab() -- the shared tab handler runs FIRST, so if it pushes
 *      /guides the button's later localised call is too late to avoid a
 *      spurious English history entry.
 *   2. the header buttons themselves.
 *
 * Usage: node scripts/check-header-i18n.mjs [--selftest]
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const APP = resolve(process.cwd(), "src", "App.tsx");

function evaluate(source) {
  const findings = [];

  // The shared tab handler must localise only the two translated tabs.
  if (!/tabId === "guides" \|\| tabId === "news" \? langPath\(path\) : path/.test(source)) {
    findings.push("navigateToTab no longer localises only the guides/news tabs");
  }

  // Header buttons must push the localised paths.
  for (const path of ["/guides", "/news"]) {
    if (!source.includes(`navigateToPath(langPath("${path}"))`)) {
      findings.push(`header button does not push navigateToPath(langPath("${path}"))`);
    }
  }

  // No bare English jump left for the two translated sections.
  for (const path of ["/guides", "/news"]) {
    if (source.includes(`navigateToPath("${path}")`)) {
      findings.push(`a bare navigateToPath("${path}") would drop the /zh prefix`);
    }
  }

  // Reviews has no Chinese edition: it must stay on /reviews, not /zh/reviews
  // (which 301s straight back to English anyway).
  if (!source.includes('navigateToPath("/reviews")')) {
    findings.push("Reviews button lost its /reviews target (no Chinese edition exists)");
  }

  return findings;
}

if (process.argv.includes("--selftest")) {
  const source = readFileSync(APP, "utf8");
  const cases = [
    {
      name: "shared tab handler loses its localisation",
      broken: source.replace('tabId === "guides" || tabId === "news" ? langPath(path) : path', "path"),
    },
    {
      name: "guides button drops langPath",
      broken: source.replace('navigateToPath(langPath("/guides"))', 'navigateToPath("/guides")'),
    },
    {
      name: "news button drops langPath",
      broken: source.replace('navigateToPath(langPath("/news"))', 'navigateToPath("/news")'),
    },
  ];
  const failed = cases.filter((c) => evaluate(c.broken).length === 0);
  for (const c of cases) console.log(`  ${failed.includes(c) ? "FAIL" : "PASS"} ${c.name}`);
  if (evaluate(source).length) {
    console.log("  FAIL the real source does not pass its own check");
    failed.push({ name: "real source" });
  }
  console.log(`check:headeri18n self-test ${failed.length ? "FAIL" : "PASS"}`);
  process.exit(failed.length ? 1 : 0);
}

if (!existsSync(APP)) {
  console.error("check:headeri18n FAILED — src/App.tsx is missing");
  process.exit(1);
}
const findings = evaluate(readFileSync(APP, "utf8"));
if (findings.length) {
  console.error(`check:headeri18n FAILED — ${findings.length} finding(s)`);
  for (const f of findings) console.error("  - " + f);
  process.exit(1);
}
console.log("check:headeri18n OK — guides/news keep /zh, reviews stays on /reviews");
