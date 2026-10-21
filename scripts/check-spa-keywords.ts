/**
 * Proves the hydrated SPA and the prerender publish the same
 * <meta name="keywords">.
 *
 * The keywords used to be computed in two places: scripts/prerender-pages.ts
 * didn't emit them at all (so the static HTML Google reads had no keywords
 * meta), while src/App.tsx wrote them after hydration. Both sides now call the
 * single source in src/lib/pageKeywords.ts, which is DOM-free so this guard
 * (and the prerender) can import it.
 *
 * This check recomputes what the shared module would emit for each route and
 * compares it against the <meta name="keywords"> actually written into dist/.
 * It also asserts every prerendered page has a non-empty keywords meta, catching
 * the "prerender forgot to emit" regression that started this work.
 *
 * Scope note: section routes (home/products/reviews/guides/news/about) resolve
 * their keywords through the CMS chain (pages[].seo > settings.seo[alias] >
 * defaultSeo) in BOTH renderers since 2026-10-22 — the prerender applies the
 * resolved set via RoutePage.keywords, the SPA via resolveCmsRouteSeoConfig.
 * This guard therefore loads the live CMS settings (snapshot fallback) and
 * recomputes the section expectations through the same shared resolver, exactly
 * like check:spatitles does for title/description. Every other route keeps the
 * DEFAULT_SEO_CONFIGS-based expectations from src/lib/pageKeywords.ts, and
 * review-type hubs remain presence-only (the SPA still adds the review-type
 * label).
 *
 * Regression guard: the home keyword block is the unknown-route fallback. No
 * route except "/" may publish it — that is how every guides article, news
 * channel/article and review-type hub silently shipped "jogging stroller /
 * kids electric cars" for months while this guard stayed green (it recomputed
 * expectations with the same buggy resolver). A new route family without a
 * branch now fails the build.
 *
 * Run: npm run check:spakeywords   (after `npm run build`)
 */
import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import path from "path";
import { resolveRouteKeywords, buildProductDetailKeywords } from "../src/lib/pageKeywords";
import { resolveSectionRouteSeo } from "../src/lib/cmsSectionSeo";
import { sanitizeUnsupportedClaims } from "../src/lib/unsupportedClaims";
import type { CMSSettings } from "../src/types";

const ROOT = process.env.CHECK_SPA_KEYWORDS_ROOT || "dist";
// cwd-relative like the sibling guards and the prerender's snapshot dir.
const SETTINGS_SNAPSHOT = path.resolve("scripts", "cms-snapshots", "settings.json");
const CMS_SETTINGS_ENDPOINT =
  process.env.CMS_SETTINGS_URL || "https://balancebiketoddler.com/api/cms/settings";

const decode = (text: string) =>
  text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");

/** Reads the keywords the prerender actually wrote (split into the joined array). */
function readBuiltKeywords(route: string): string[] | null {
  const clean = route.replace(/^\/+|\/+$/g, "");
  const candidates = [path.join(ROOT, clean, "index.html"), path.join(ROOT, `${clean}.html`)];
  const file = candidates.find((candidate) => existsSync(candidate));
  if (!file) return null;
  const html = readFileSync(file, "utf8");
  const match = /<meta\s+name="keywords"\s+content="([^"]*)"/i.exec(html);
  if (!match) return null;
  const content = decode(match[1]).replace(/\s+/g, " ").trim();
  return content ? content.split(",").map((s) => s.trim()).filter(Boolean) : [];
}

/** Maps a built HTML file back to its canonical route. */
function routeFromRelFile(rel: string): string {
  const noExt = rel.replace(/index\.html$/, "").replace(/\.html$/, "");
  return `/${noExt.replace(/\\/g, "/")}`.replace(/\/+/g, "/");
}

/** Collects every prerendered HTML file under dist/ — both directory
 *  index.html files (trailing-slash routes) and bare *.html files
 *  (e.g. /reviews.html, /products.html, product-detail pages). */
function collectHtmlRoutes(): string[] {
  const routes: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) walk(full);
      else if (entry.endsWith(".html")) {
        routes.push(routeFromRelFile(path.relative(ROOT, full)));
      }
    }
  };
  walk(ROOT);
  return routes;
}

// CMS snapshot — the same fallback source the prerender uses for detail pages,
// so the recomputed detail keywords match what was actually emitted.
function loadProducts(): Array<Record<string, any>> {
  const candidates = [
    "scripts/cms-snapshots/products.json",
    "doc/cms-export-1784286890682.json",
  ];
  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    const json = JSON.parse(readFileSync(candidate, "utf8"));
    const list =
      Array.isArray(json) ? json : json?.data?.collections?.products || json?.products || [];
    if (Array.isArray(list) && list.length) return list;
  }
  return [];
}

const products = loadProducts();

function productByRouteSegment(segment: string): Record<string, any> | undefined {
  const id = segment.toLowerCase();
  return products.find((p) => String(p.id || "").toLowerCase() === id);
}

function expectedKeywords(route: string): string[] {
  const segs = route.split("/").filter(Boolean);
  if (segs[0] === "products" && segs[1] && segs[2]) {
    const product = productByRouteSegment(segs[2]);
    if (product) {
      return buildProductDetailKeywords(product, "en", String(product.categoryId || ""));
    }
  }
  return resolveRouteKeywords(route, "en");
}

const REVIEW_TYPE_HUB = /^\/reviews\/(single|compare|value|ranking|safety)\/?$/;

// --- Section routes: CMS-resolved keyword expectations ----------------------
// The six structural routes resolve keywords through the CMS chain in both
// renderers (prerender: RoutePage.keywords via applyCmsSectionSeo; SPA:
// resolveCmsRouteSeoConfig). Mirrors check:spatitles' loader: live CMS first
// (what the SPA reads at runtime), the snapshot the build wrote second.
const SECTION_ROUTES: Array<{ seoKey: string; route: string }> = [
  { seoKey: "home", route: "/" },
  { seoKey: "products", route: "/products" },
  { seoKey: "reviews", route: "/reviews" },
  { seoKey: "guides", route: "/guides" },
  { seoKey: "news", route: "/news" },
  { seoKey: "about", route: "/about" },
];
const SECTION_ROUTE_BY_PATH = new Map(SECTION_ROUTES.map((s) => [s.route, s.seoKey]));

function unwrapCmsSettings(payload: unknown): CMSSettings | null {
  const candidate =
    payload && typeof payload === "object" && Array.isArray((payload as { data?: unknown }).data)
      ? (payload as { data: unknown[] }).data[0]
      : (payload as { data?: unknown } | null)?.data ?? payload;
  if (!candidate || typeof candidate !== "object") return null;
  const settings = candidate as CMSSettings;
  return settings.seo || settings.pages ? settings : null;
}

async function loadCmsSettings(): Promise<{ settings: CMSSettings; source: string } | null> {
  try {
    const response = await fetch(CMS_SETTINGS_ENDPOINT, {
      headers: { Accept: "application/json" },
      redirect: "follow",
    });
    if (response.ok) {
      const settings = unwrapCmsSettings(await response.json());
      if (settings) return { settings, source: "live CMS" };
    }
    console.error(`check:spakeywords WARN — live ${CMS_SETTINGS_ENDPOINT} returned HTTP ${response.status}; trying snapshot.`);
  } catch (error) {
    console.error(`check:spakeywords WARN — live ${CMS_SETTINGS_ENDPOINT} unreachable (${(error as Error).message}); trying snapshot.`);
  }
  if (existsSync(SETTINGS_SNAPSHOT)) {
    try {
      const settings = unwrapCmsSettings(JSON.parse(readFileSync(SETTINGS_SNAPSHOT, "utf8")));
      if (settings) return { settings, source: `snapshot ${SETTINGS_SNAPSHOT}` };
    } catch {
      // fall through
    }
  }
  return null;
}

/** Section-route keywords through the shared resolver; null settings fall back
 *  to DEFAULT_SEO_CONFIGS, which is exactly what the prerender publishes when
 *  the CMS is unreachable at build time. */
function sectionKeywords(settings: CMSSettings | null, seoKey: string): string[] {
  return resolveSectionRouteSeo(settings, seoKey, "en").keywords;
}

// The prerender runs its whole-document claim scrub over the emitted HTML, so a
// CMS keyword containing a banned phrase ("independent safety testing" ->
// "spec-based comparisons") gets rewritten in the static meta while the
// hydrated SPA publishes the raw CMS string — the exact divergence this guard
// exists to catch. A scrub-triggering keyword is therefore a build failure with
// an actionable message, not a mystery mismatch on one section route.
function assertScrubCleanKeywords(settings: CMSSettings | null): string[] {
  const offenders: string[] = [];
  for (const section of SECTION_ROUTES) {
    for (const keyword of sectionKeywords(settings, section.seoKey)) {
      if (sanitizeUnsupportedClaims(keyword) !== keyword) {
        offenders.push(`${section.route} -> "${keyword}"`);
      }
    }
  }
  return offenders;
}

// The home keyword block is the unknown-route fallback in resolveRouteKeywords.
// Every guides article, news channel/article and review-type hub silently
// published it for months — the guard could not see it because it recomputed
// expectations with the same buggy resolver (same-source blind spot). These
// routes now have real branches, so any route that still publishes the home
// block is a regression: a new route family that forgot its branch. Home itself
// resolves through the CMS chain, so the comparison follows the CMS value.

function equals(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const norm = (arr: string[]) => arr.map((s) => s.toLowerCase()).sort();
  const na = norm(a);
  const nb = norm(b);
  return na.every((v, i) => v === nb[i]);
}

async function main() {
  const loaded = await loadCmsSettings();
  if (!loaded) {
    console.error(
      "check:spakeywords FAIL — could not load CMS settings (live fetch failed and no snapshot at " +
        `${SETTINGS_SNAPSHOT}). Section routes cannot be verified.`,
    );
    process.exit(1);
  }
  const settings = loaded.settings;
  const scrubOffenders = assertScrubCleanKeywords(settings);
  if (scrubOffenders.length > 0) {
    console.error(
      "check:spakeywords FAIL — CMS keyword(s) contain a claim phrase the prerender scrub rewrites " +
        "(static HTML and hydrated SPA would publish different keywords):",
    );
    for (const offender of scrubOffenders) console.error("  - " + offender);
    process.exit(1);
  }
  const homeKeywords = sectionKeywords(settings, "home");
  console.log(`check:spakeywords — section keyword expectations from ${loaded.source}.`);

  const routes = collectHtmlRoutes();
  let missing = 0;
  let mismatched = 0;
  const mismatchedExamples: string[] = [];

  for (const route of routes) {
    // The static 404.html is a noindex shell with no keywords meta — it is not a
    // content route, so skip it rather than reporting a false missing-meta failure.
    if (route === "/404") continue;
    const built = readBuiltKeywords(route);
    if (built === null) {
      missing += 1;
      mismatchedExamples.push(`${route} — MISSING keywords meta`);
      continue;
    }
    if (built.length === 0) {
      missing += 1;
      mismatchedExamples.push(`${route} — EMPTY keywords meta`);
      continue;
    }
    // No route except the home page itself may publish the home keyword block —
    // it is the unknown-route fallback, so seeing it means this route's family
    // has no branch in resolveRouteKeywords (the guides/news/review bug).
    if (route !== "/" && equals(built, homeKeywords)) {
      missing += 1;
      mismatchedExamples.push(`${route} — publishes the HOME fallback keyword block (unknown route in resolveRouteKeywords?)`);
      continue;
    }
    // Review-type hubs still get an SPA-only keyword addition (the review-type
    // label, App.tsx); assert presence only for them. Guides/news article detail
    // pages used to be in this bucket too — they now resolve through the same
    // branches on both sides, so they take the exact-match path above.
    if (REVIEW_TYPE_HUB.test(route)) continue;

    const sectionKey = SECTION_ROUTE_BY_PATH.get(route);
    const expected = sectionKey ? sectionKeywords(settings, sectionKey) : expectedKeywords(route);
    if (!equals(built, expected)) {
      mismatched += 1;
      if (mismatchedExamples.length < 25) {
        mismatchedExamples.push(
          `${route}\n    built:    ${JSON.stringify(built)}\n    expected: ${JSON.stringify(expected)}`,
        );
      }
    }
  }

  const ok = missing === 0 && mismatched === 0;
  console.log(
    JSON.stringify({
      ok,
      pagesChecked: routes.length,
      missingOrEmpty: missing,
      mismatched,
    }),
  );
  if (!ok) {
    console.error("check:spakeywords FAILED");
    for (const example of mismatchedExamples) console.error("  - " + example);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
