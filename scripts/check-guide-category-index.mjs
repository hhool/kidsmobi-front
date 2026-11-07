#!/usr/bin/env node
/**
 * Delivery guard for the "Buying guides by category" index on /guides.
 *
 * Checks the built artefacts, not the intent:
 *   1. dist/guides.html contains the exact string the shared renderer emits
 *      (byte-for-byte), so the crawler document did not drift from the SPA.
 *   2. Both renderers import that shared function, and neither hand-rolls a
 *      second copy of the markup.
 *   3. Every href the index emits is in dist/sitemap.xml (no new URLs).
 *   4. The homepage no longer carries the removed Buying Guides block.
 *   5. The Chinese /zh/guides hub has no index (English UI is forbidden there).
 *   6. The Categories nav menu is gone from both nav renderers.
 *
 * Self-test: --selftest runs the same assertions against synthetic fixtures,
 * including reverse assertions where restoring the old behaviour must turn
 * the check red.
 *
 * Usage: node scripts/check-guide-category-index.mjs [--selftest]
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const FRONT = join(HERE, "..");
const DIST = join(FRONT, "dist");

const problems = [];
const fail = (msg) => problems.push(msg);

/** Import the shared TS renderer through tsx's loader when available. */
async function loadRenderer() {
  // The build runs under `npx tsx`; from plain node we ask tsx to eval it.
  const require = createRequire(import.meta.url);
  try {
    require("tsx/cjs");
  } catch {
    // tsx registered by the npm script (npx tsx) — fall through.
  }
  const mod = await import(pathToFileURL(join(FRONT, "src/lib/guideCategoryIndexHtml.ts")).href);
  return mod;
}

function assertIndexInHtml(html, expected, label) {
  if (!html.includes(expected)) {
    fail(`${label}: shared index HTML is not byte-identical (section present: ${html.includes('id="guide_category_index"')})`);
    return false;
  }
  return true;
}

function runAgainst({ guidesHtml, zhGuidesHtml, homeHtml, sitemapXml, appSrc, staticNavSrc, guidesSectionSrc, prerenderSrc, expectedHtml, hrefs }) {
  const local = [];
  const bad = (m) => local.push(m);

  if (expectedHtml) {
    if (!guidesHtml.includes(expectedHtml)) bad("/guides static HTML drifted from the shared renderer");
    if (!guidesHtml.includes('id="guide_category_index"')) bad("/guides static HTML has no index section");
  }
  if (homeHtml.includes("topic_guides_anchor")) bad("homepage still carries the removed Buying Guides block");
  if (zhGuidesHtml && zhGuidesHtml.includes("guide_category_index")) bad("Chinese hub carries the English-only index");
  if (appSrc.includes("CategoriesNavMenu")) bad("App.tsx still renders the Categories nav menu");
  if (staticNavSrc.includes('"Categories"')) bad("StaticHeaderNav still has the Categories pill");
  if (!guidesSectionSrc.includes("renderGuideCategoryIndexHtml")) bad("SPA does not consume the shared renderer");
  if (!prerenderSrc.includes("renderGuideCategoryIndexHtml")) bad("prerender does not consume the shared renderer");

  const locs = new Set(
    [...String(sitemapXml || "").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
      m[1].replace("https://balancebiketoddler.com", "").replace(/\/$/, "") || "/",
    ),
  );
  if (locs.size === 0) bad("sitemap has no <loc> entries — cannot verify hrefs");
  for (const href of hrefs) {
    const norm = href.replace(/\/$/, "") || "/";
    if (!locs.has(norm)) bad(`index href not in sitemap: ${href}`);
  }
  return local;
}

async function main() {
  const selftest = process.argv.includes("--selftest");
  const { renderGuideCategoryIndexHtml, guideCategoryIndexHrefs } = await loadRenderer();
  const expectedHtml = renderGuideCategoryIndexHtml();
  const hrefs = guideCategoryIndexHrefs();

  if (selftest) {
    const read = (p) => (existsSync(p) ? readFileSync(p, "utf8") : "");
    const good = {
      guidesHtml: `<body>${expectedHtml}<footer></footer></body>`,
      zhGuidesHtml: "<html lang='zh'><h2>中文选购指南</h2></html>",
      homeHtml: "<html><section id='safety_audits_anchor'></section></html>",
      sitemapXml: `<urlset>${hrefs.map((h) => `<loc>https://balancebiketoddler.com${h}</loc>`).join("")}</urlset>`,
      appSrc: 'import StaticHeaderNav from "./components/StaticHeaderNav";',
      staticNavSrc: 'const items = [{ href: "/guides", label: t.navGuides }];',
      guidesSectionSrc: 'import { renderGuideCategoryIndexHtml } from "../lib/guideCategoryIndexHtml";',
      prerenderSrc: 'import { renderGuideCategoryIndexHtml } from "../src/lib/guideCategoryIndexHtml";',
      expectedHtml,
      hrefs,
    };
    const cases = [];
    const check = (name, fn) => {
      try { fn(); cases.push({ name, ok: true }); }
      catch (e) { cases.push({ name, ok: false, error: e.message }); }
    };
    const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

    check("clean build passes", () => {
      const p = runAgainst(good);
      assert(p.length === 0, p.join(" | "));
    });
    check("shared renderer emits 5 families + all 93 hrefs", () => {
      assert((expectedHtml.match(/<details /g) || []).length === 5, "not 5 groups");
      assert(hrefs.length === 93, `got ${hrefs.length} hrefs`);
      assert(expectedHtml.includes("Buying guides by category"), "no heading");
    });
    check("REVERSE: restoring the homepage block turns red", () => {
      const p = runAgainst({ ...good, homeHtml: "<section id='topic_guides_anchor'></section>" });
      assert(p.some((m) => m.includes("homepage still carries")), "undetected");
    });
    check("REVERSE: restoring the Categories menu turns red", () => {
      const p = runAgainst({ ...good, appSrc: "import CategoriesNavMenu from './CategoriesNavMenu';" });
      assert(p.some((m) => m.includes("Categories nav menu")), "undetected");
    });
    check("REVERSE: a stale/prerender-only markup turns red", () => {
      const p = runAgainst({ ...good, guidesHtml: '<section id="guide_category_index">old hand-written copy</section>' });
      assert(p.some((m) => m.includes("drifted")), "undetected");
    });
    check("REVERSE: a fabricated URL in the sitemap fixture turns red", () => {
      const p = runAgainst({ ...good, hrefs: [...hrefs, "/products/fake-family/"] });
      assert(p.some((m) => m.includes("not in sitemap")), "undetected");
    });
    check("REVERSE: English index leaking into /zh/guides turns red", () => {
      const p = runAgainst({ ...good, zhGuidesHtml: '<section id="guide_category_index">x</section>' });
      assert(p.some((m) => m.includes("Chinese hub carries")), "undetected");
    });
    check("REVERSE: SPA dropping the shared renderer turns red", () => {
      const p = runAgainst({ ...good, guidesSectionSrc: "const x = 1;" });
      assert(p.some((m) => m.includes("SPA does not consume")), "undetected");
    });
    for (const c of cases) console.log(`${c.ok ? "PASS" : "FAIL"}  ${c.name}${c.ok ? "" : ` — ${c.error}`}`);
    const failed = cases.filter((c) => !c.ok).length;
    console.log(`self-test: ${cases.length - failed}/${cases.length} pass`);
    if (failed) process.exit(1);
    return;
  }

  const read = (p) => (existsSync(p) ? readFileSync(p, "utf8") : "");
  const result = runAgainst({
    guidesHtml: read(join(DIST, "guides.html")),
    zhGuidesHtml: read(join(DIST, "zh/guides.html")),
    homeHtml: read(join(DIST, "index.html")),
    sitemapXml: read(join(DIST, "sitemap.xml")),
    appSrc: read(join(FRONT, "src/App.tsx")),
    staticNavSrc: read(join(FRONT, "src/components/StaticHeaderNav.tsx")),
    guidesSectionSrc: read(join(FRONT, "src/components/GuidesSection.tsx")),
    prerenderSrc: read(join(FRONT, "scripts/prerender-pages.ts")),
    expectedHtml,
    hrefs,
  });
  problems.push(...result);
  if (problems.length) {
    console.error(`check:guideindex FAILED (${problems.length} problem(s))`);
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }
  console.log(`check:guideindex OK — /guides index byte-identical to SPA renderer, ${hrefs.length} hrefs all in sitemap, homepage block removed`);
}

main().catch((e) => {
  console.error("check:guideindex ERROR", e.message);
  process.exit(1);
});
