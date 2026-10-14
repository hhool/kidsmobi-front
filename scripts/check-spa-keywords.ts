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
 * Scope note: default-route keywords come from DEFAULT_SEO_CONFIGS — the same
 * static base the prerender emits. The SPA may layer CMS overrides on top of
 * those routes (resolveCmsRouteSeoConfig); that divergence is tolerated the
 * same way the title guard tolerates it. Article-detail (guides/<id>, news/<id>)
 * and review-type hubs are SPA-only keyword additions and are asserted for
 * presence only, not exact match.
 *
 * Run: npm run check:spakeywords   (after `npm run build`)
 */
import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import path from "path";
import { resolveRouteKeywords, buildProductDetailKeywords } from "../src/lib/pageKeywords";

const ROOT = process.env.CHECK_SPA_KEYWORDS_ROOT || "dist";

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

const ARTICLE_DETAIL = /^\/(guides|news)\/[^/]+\/?$/;
const REVIEW_TYPE_HUB = /^\/reviews\/(single|compare|value|ranking|safety)\/?$/;

function equals(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const norm = (arr: string[]) => arr.map((s) => s.toLowerCase()).sort();
  const na = norm(a);
  const nb = norm(b);
  return na.every((v, i) => v === nb[i]);
}

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
  // Article-detail and review-type hubs get SPA-only keyword additions; assert
  // presence only, not exact match.
  if (ARTICLE_DETAIL.test(route) || REVIEW_TYPE_HUB.test(route)) continue;

  const expected = expectedKeywords(route);
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
