/**
 * Dead navigation paths stay retired.
 *
 * Two URLs answered a genuine 404 with noindex,nofollow for anyone arriving
 * directly, while being requested by crawlers (or pushed by the SPA) every
 * week:
 *
 *   /sitemap_index.xml  - Yoast-style sitemap index bots probe by habit
 *                          (80 hits in the 2026-11-20 AI Crawl Control export)
 *   /news/page/1        - the Global News header button used to push this,
 *                          then an effect replaceState'd it to /news; any
 *                          reload / shared link / new tab landed on a 404
 *
 * Both are now exact 301s in public/_redirects, and the SPA pushes /news
 * directly. This guard runs offline against the built dist plus the source,
 * so a future refactor cannot quietly reintroduce the dead stop.
 *
 * Usage: node scripts/check-dead-nav-paths.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const findings = [];

const redirectsPath = resolve(root, "dist", "_redirects");
if (!existsSync(redirectsPath)) {
  findings.push("dist/_redirects is missing — run the build first");
} else {
  const rules = readFileSync(redirectsPath, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

  const expected = [
    "/sitemap_index.xml /sitemap.xml 301",
    "/news/page/1 /news 301",
  ];
  for (const rule of expected) {
    if (!rules.includes(rule)) findings.push(`dist/_redirects is missing "${rule}"`);
  }
}

const appPath = resolve(root, "src", "App.tsx");
if (!existsSync(appPath)) {
  findings.push("src/App.tsx is missing");
} else {
  const app = readFileSync(appPath, "utf8");
  if (app.includes('navigateToPath("/news/page/1")')) {
    findings.push('src/App.tsx still pushes navigateToPath("/news/page/1") — use the canonical /news');
  }
}

if (findings.length) {
  console.error(`check:deadpaths FAILED — ${findings.length} finding(s)`);
  for (const f of findings) console.error("  - " + f);
  process.exit(1);
}
console.log("check:deadpaths OK — sitemap_index.xml and /news/page/1 are 301s; SPA pushes /news");
