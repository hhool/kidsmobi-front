#!/usr/bin/env node
/**
 * Delivery guard for the stroller guide keyword + category-chip round (A+C).
 *
 * What it proves against the BUILT artefacts, not the intent:
 *   1. src/data/guideArticleCategories.generated.ts still matches the CMS
 *      snapshot (a published/re-categorised guide cannot silently drift).
 *   2. Every published stroller guide's static HTML publishes stroller terms
 *      and ZERO balance-bike terms — the 21/21 mismatch that started this work.
 *   3. The 21 pages are not all publishing one identical keyword string.
 *   4. The static /guides document carries the six crawlable category chips.
 *   5. Source invariants: the SPA passes the slug to the resolver and the
 *      wizard chips are anchors with real hrefs, not JS-only buttons.
 *
 * --selftest runs the source-invariant checks against synthetic sources,
 * including reverse assertions where restoring the old code must turn red.
 *
 * Run after `npm run build`: npm run check:guidekw
 */
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const FRONT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(FRONT, "dist");
const SNAPSHOT = join(FRONT, "scripts", "cms-snapshots", "guides.json");
const GENERATOR = join(FRONT, "scripts", "seo", "gen-guide-article-categories.mjs");
const CATEGORY_CHIPS = [
  "/guides",
  "/products/balance-bikes/",
  "/products/kids-bikes/",
  "/products/kids-scooters/",
  "/products/strollers/",
  "/products/electric-cars/",
];

/** The three core stroller families specified 2026-11-23. */
const CORE_TERMS = ["travel stroller", "jogging stroller", "lightweight stroller"];
const CORE_MIN = { "travel stroller": 10, "jogging stroller": 2, "lightweight stroller": 2 };

const decode = (s) =>
  s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

/** Source invariants, extracted so --selftest can feed synthetic sources. */
function sourceProblems(guidesSectionSrc) {
  const out = [];
  if (!/guidesArticleKeywords\(found\.category, lang, getGuideArticleRouteId\(found\)\)/.test(guidesSectionSrc)) {
    out.push("GuidesSection no longer passes the article slug to guidesArticleKeywords");
  }
  // The chip must carry a REAL href — an anchor whose target resolves to a
  // guides route, not a JS-only button. This used to assert the literal
  // `href={cat.href}`; R48 (2026-11-24) replaced that static per-chip href with
  // `href={localizedGuidesPath(lang, guidesFilterPath(cat.id, topic))}` so the
  // address bar reflects the chosen category. Asserting the old literal tested
  // the expression, not the property that matters, so it is now tested on the
  // behaviour: an <a> whose href is built from guidesFilterPath.
  const chipHref = /href=\{[^}]*guidesFilterPath\([^}]*\}/.test(guidesSectionSrc);
  if (!chipHref && !/href=\{cat\.href\}/.test(guidesSectionSrc)) {
    out.push("wizard category chips lost their crawlable href");
  }
  if (/<button[\s\S]{0,400}onClick=\{\(\) => setWizardCategory\(cat\.id\)\}/.test(guidesSectionSrc)) {
    out.push("wizard category chips reverted to JS-only buttons");
  }
  return out;
}

/** Keyword invariants, extracted so --selftest can feed synthetic HTML. */
function keywordProblems(htmlBySlug, expectedSlugs) {
  const out = [];
  const seen = new Set();
  for (const slug of expectedSlugs) {
    const html = htmlBySlug[slug];
    if (!html) { out.push(`no built HTML for stroller guide ${slug}`); continue; }
    const match = /<meta\s+name="keywords"\s+content="([^"]*)"/i.exec(html);
    if (!match) { out.push(`${slug}: no keywords meta in static HTML`); continue; }
    const kw = decode(match[1]);
    if (/balance[ -]bike|walking bike|kids bike/i.test(kw)) {
      out.push(`${slug}: still publishes balance-bike keywords → ${kw.slice(0, 90)}`);
    }
    if (!/stroller|推车/i.test(kw)) {
      out.push(`${slug}: no stroller term in keywords → ${kw.slice(0, 90)}`);
    }
    seen.add(kw);
  }
  if (seen.size < 3) out.push(`keyword sets collapsed (${seen.size} distinct across ${expectedSlugs.length} pages)`);
  return out;
}

/**
 * Core-family invariants. Each detail page carries exactly one of the three
 * core terms in the base slot; the counts below stop a future edit from
 * silently reverting to "travel stroller on all 21" (which had left
 * lightweight stroller at 0/21 and jogging stroller at 2/21).
 */
function coreProblems(pageKeywordsSrc, htmlBySlug, slugs, min) {
  const out = [];
  for (const term of CORE_TERMS) {
    if (!pageKeywordsSrc.includes(`"${term}"`)) out.push(`pageKeywords.ts lost core keyword "${term}"`);
  }
  if (!/strollerCoreFamily\(/.test(pageKeywordsSrc)) out.push("pageKeywords.ts lost the core-family split");
  const counts = Object.fromEntries(CORE_TERMS.map((t) => [t, 0]));
  for (const slug of slugs) {
    const html = htmlBySlug[slug];
    if (!html) continue;
    const match = /<meta\s+name="keywords"\s+content="([^"]*)"/i.exec(html);
    if (!match) continue;
    const kw = decode(match[1]).toLowerCase();
    for (const term of CORE_TERMS) if (kw.includes(term)) counts[term]++;
  }
  for (const term of CORE_TERMS) {
    if (counts[term] < min[term]) {
      out.push(`core keyword "${term}" appears on only ${counts[term]}/${slugs.length} stroller guides (min ${min[term]})`);
    }
  }
  return out;
}

function navProblems(guidesHtml) {
  const out = [];
  for (const href of CATEGORY_CHIPS) {
    if (!guidesHtml.includes(`href="${href}"`)) out.push(`static /guides missing category chip ${href}`);
  }
  if (!guidesHtml.includes("Browse by category:")) out.push("static /guides lost the category nav label");
  if (guidesHtml.includes(">More Picks</a>")) out.push("generic More Picks anchor returned");
  return out;
}

/**
 * Cross-family keyword contamination on the CATEGORY axis.
 *
 * /guides/<category>/ and /guides/<category>/<topic>/ are structurally
 * identical to the pre-existing topic and article shapes, so with no resolver
 * branch of their own they were parsed as articles and published the
 * balance-bike beginner keyword block — every stroller composite page, on the
 * live site, for the whole of 2026-11-24. This assertion is the one that would
 * have caught it: it compares each page's keyword tag against the product
 * family its URL names, instead of merely checking that SOME keyword exists.
 *
 * Deliberately URL-driven, not page-driven: deriving the family from the page's
 * own copy would agree with a mislabelled page.
 */
const FAMILY_KEYWORD = {
  stroller: /stroller|推车/i,
  balance: /balance[ -]bike|平衡车|滑步/i,
  bicycle: /kids bike|bicycle|儿童自行车/i,
  scooter: /scooter|滑板车/i,
  electric_car: /electric car|电动车|ride-?on/i,
};

function crossFamilyProblems(htmlByRoute) {
  const out = [];
  for (const [route, html] of Object.entries(htmlByRoute)) {
    // "/guides/<family>/..." -> filter(Boolean) = ["guides", family, ...], so the
    // family is index 1. Index 2 is the topic on a composite and undefined on a
    // category page, and using it here made the whole check a no-op that
    // reported itself green.
    const family = route.split("/").filter(Boolean)[1];
    if (!FAMILY_KEYWORD[family]) continue;
    const match = /<meta\s+name="keywords"\s+content="([^"]*)"/i.exec(html);
    if (!match) { out.push(`${route}: no keywords meta`); continue; }
    const kw = decode(match[1]).trim();
    if (!kw) { out.push(`${route}: empty keywords meta`); continue; }
    for (const [other, re] of Object.entries(FAMILY_KEYWORD)) {
      if (other !== family && re.test(kw)) {
        out.push(`${route}: ${family} page publishes ${other} keywords -> ${kw.slice(0, 90)}`);
      }
    }
  }
  return out;
}

function main() {
  const selftest = process.argv.includes("--selftest");
  const problems = [];

  if (selftest) {
    const goodSrc = [
      'keywords: guidesArticleKeywords(found.category, lang, getGuideArticleRouteId(found)),',
      '<a href={localizedGuidesPath(lang, guidesFilterPath(cat.id, ""))} onClick={(event) => { event.preventDefault(); handleProductCategoryClick(cat.id); }}>',
    ].join("\n");
    const goodHtml = (slug) =>
      `<meta name="keywords" content="stroller buying guide, travel stroller, holiday travel stroller, ${slug}">`;
    const slugs = ["a", "b", "c", "d"];
    const bySlug = Object.fromEntries(slugs.map((s, i) => [s, goodHtml(["holiday", "cabin", "newborn", "budget"][i])]));
    const goodNav = CATEGORY_CHIPS.map((h) => `<a href="${h}">x</a>`).join("") + "Browse by category:";

    const cases = [];
    const check = (name, ok) => cases.push({ name, ok });
    check("clean artefacts pass",
      sourceProblems(goodSrc).length === 0 && keywordProblems(bySlug, slugs).length === 0 && navProblems(goodNav).length === 0);
    check("REVERSE: dropping the slug argument turns red",
      sourceProblems(goodSrc.replace("getGuideArticleRouteId(found)", "found.category")).length > 0);
    check("REVERSE: JS-only chips turn red",
      sourceProblems(goodSrc.replace('<a href={localizedGuidesPath(lang, guidesFilterPath(cat.id, ""))} ', "<button ")).length > 0);
    check("REVERSE: balance-bike keywords turn red",
      keywordProblems({ ...bySlug, a: '<meta name="keywords" content="balance bike guide, balance bike size chart">' }, slugs).length > 0);
    check("REVERSE: identical keyword sets turn red",
      keywordProblems(Object.fromEntries(slugs.map((s) => [s, goodHtml("same")])), slugs).length > 0);
    check("REVERSE: missing category chip turns red",
      navProblems(goodNav.replace('href="/products/strollers/"', 'href="/elsewhere/"')).length > 0);

    const coreSrc = 'const STROLLER_CORE_KEYWORDS = { travel: { en: "travel stroller" }, jogging: { en: "jogging stroller" }, lightweight: { en: "lightweight stroller" } }; function strollerCoreFamily(slug) {}';
    const coreHtml = (t) => `<meta name="keywords" content="stroller buying guide, ${t}, stroller safety">`;
    const coreBySlug = {
      a: coreHtml("travel stroller"),
      b: coreHtml("jogging stroller"),
      c: coreHtml("lightweight stroller"),
      d: coreHtml("travel stroller"),
    };
    const coreMin = { "travel stroller": 1, "jogging stroller": 1, "lightweight stroller": 1 };
    check("core keyword invariants pass", coreProblems(coreSrc, coreBySlug, slugs, coreMin).length === 0);
    check("REVERSE: dropping lightweight from source turns red",
      coreProblems(coreSrc.replace('"lightweight stroller"', '"x"'), coreBySlug, slugs, coreMin).length > 0);
    check("REVERSE: all pages back on travel-only turns red",
      coreProblems(coreSrc, Object.fromEntries(slugs.map((s) => [s, coreHtml("travel stroller")])), slugs, coreMin).length > 0);

    // Category-axis cross-family check. The defect it guards shipped to
    // production on 2026-11-24, so both directions are asserted.
    const kwPage = (kw) => `<meta name="keywords" content="${kw}">`;
    const axisGood = {
      "/guides/stroller/": kwPage("baby stroller guides, baby stroller buying guide"),
      "/guides/stroller/budget/": kwPage("baby stroller guides, baby stroller budget guide"),
      "/guides/balance/": kwPage("balance bike guides, balance bike buying guide"),
      "/guides/electric_car/special/": kwPage("electric car guides, electric car special-fit"),
    };
    check("category-axis families pass", crossFamilyProblems(axisGood).length === 0);
    check("REVERSE: the shipped defect (stroller composite on balance-bike keywords) turns red",
      crossFamilyProblems({
        ...axisGood,
        "/guides/stroller/budget/": kwPage("balance bike guide, first balance bike, balance bike for beginners"),
      }).length > 0);
    check("REVERSE: a balance page on stroller keywords turns red",
      crossFamilyProblems({ ...axisGood, "/guides/balance/": kwPage("baby stroller guides, travel stroller") }).length > 0);
    check("REVERSE: an empty keywords tag on a family page turns red",
      crossFamilyProblems({ ...axisGood, "/guides/scooter/": kwPage("") }).length > 0);

    for (const c of cases) console.log(`  ${c.ok ? "OK  " : "FAIL"} ${c.name}`);
    const failed = cases.filter((c) => !c.ok);
    if (failed.length) process.exit(1);
    console.log(`check:guidekw selftest — ${cases.length}/${cases.length} passed`);
    return;
  }

  // 1. generated module freshness.
  try {
    execFileSync(process.execPath, [GENERATOR, "--check"], { cwd: FRONT, stdio: "pipe" });
  } catch {
    problems.push("guideArticleCategories.generated.ts is stale — run npm run seo:guide-categories");
  }

  if (!existsSync(SNAPSHOT)) problems.push(`missing CMS snapshot ${SNAPSHOT}`);
  const rows = existsSync(SNAPSHOT) ? JSON.parse(readFileSync(SNAPSHOT, "utf8")) : [];
  const strollerSlugs = rows
    .filter((r) => r?.status === "published" && r?.taxonomy?.productCategory === "stroller")
    .map((r) => String(r.slug).trim().toLowerCase())
    .sort();
  // The stroller set is the scope of the 2026-11-23 keyword review, which is
  // why this used to assert a literal 21. That literal was a "scope changed,
  // go look again" tripwire, and it did its job — but a literal blocks every
  // legitimate content addition, and the 2026-11-24 gap-fill (R48, +7 stroller
  // guides) is exactly that. What the check actually needs is not a number but
  // two properties, both of which hold however large the library grows:
  //
  //   1. the snapshot and the generated module agree (already asserted above by
  //      running the generator with --check);
  //   2. every stroller guide in the snapshot has built HTML that passes the
  //      keyword assertions below — so a slug the build silently dropped cannot
  //      hide behind a passing count.
  //
  // The floor stays: if the snapshot collapses to near-nothing, something is
  // wrong with the import and the assertions below would pass vacuously.
  const STROLLER_FLOOR = 21;
  if (strollerSlugs.length < STROLLER_FLOOR) {
    problems.push(`only ${strollerSlugs.length} published stroller guides in the snapshot (floor ${STROLLER_FLOOR}) — the import is probably broken`);
  }

  // 2/3. built HTML for each stroller guide.
  const htmlBySlug = {};
  const guidesDir = join(DIST, "guides");
  const topics = existsSync(guidesDir) ? readdirSync(guidesDir) : [];
  for (const topic of topics) {
    const dir = join(guidesDir, topic);
    // dist/guides/ mixes topic index files (beginner.html) with article
    // directories; readdirSync on a file throws ENOTDIR.
    if (!existsSync(dir) || !statSync(dir).isDirectory()) continue;
    for (const file of readdirSync(dir)) {
      if (!file.endsWith(".html")) continue;
      const slug = file.slice(0, -5);
      if (strollerSlugs.includes(slug)) htmlBySlug[slug] = readFileSync(join(dir, file), "utf8");
    }
  }
  problems.push(...keywordProblems(htmlBySlug, strollerSlugs));
  problems.push(...coreProblems(
    readFileSync(join(FRONT, "src", "lib", "pageKeywords.ts"), "utf8"),
    htmlBySlug,
    strollerSlugs,
    CORE_MIN,
  ));

  // 4. static /guides category nav.
  const guidesHtmlPath = join(DIST, "guides.html");
  if (!existsSync(guidesHtmlPath)) problems.push("dist/guides.html missing — run npm run build");
  else problems.push(...navProblems(readFileSync(guidesHtmlPath, "utf8")));

  // 4b. category-axis keyword families. Walks every built /guides/<family>/**
  // index (the category page and all of its composites) and asserts the keyword
  // tag belongs to the family the URL names.
  const axisHtml = {};
  if (existsSync(guidesDir)) {
    for (const family of readdirSync(guidesDir)) {
      const familyDir = join(guidesDir, family);
      if (!existsSync(familyDir) || !statSync(familyDir).isDirectory()) continue;
      const catIndex = join(familyDir, "index.html");
      if (existsSync(catIndex)) axisHtml[`/guides/${family}/`] = readFileSync(catIndex, "utf8");
      for (const sub of readdirSync(familyDir)) {
        const subIndex = join(familyDir, sub, "index.html");
        if (existsSync(subIndex)) axisHtml[`/guides/${family}/${sub}/`] = readFileSync(subIndex, "utf8");
      }
    }
  }
  problems.push(...crossFamilyProblems(axisHtml));

  // 5. source invariants.
  const guidesSectionPath = join(FRONT, "src", "components", "GuidesSection.tsx");
  problems.push(...sourceProblems(readFileSync(guidesSectionPath, "utf8")));

  if (problems.length) {
    console.error("check:guidekw FAILED");
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }
  console.log(`check:guidekw — ${strollerSlugs.length} stroller guides carry stroller terms, 6 category chips crawlable, generated module fresh`);
}

main();
