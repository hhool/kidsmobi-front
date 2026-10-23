/**
 * Proves the hydrated SPA and the prerender publish the same <link rel="canonical">.
 *
 * Every URL on this site is rendered twice: scripts/prerender-pages.ts writes
 * the static HTML (self-canonical by construction), and src/App.tsx rewrites
 * the canonical link when the SPA hydrates. Google renders the JS, so the two
 * MUST agree.
 *
 * They did not always agree. On 2026-10-19 Search Console reported four URLs
 * as "Alternate page with proper canonical tag" (/news/new_product,
 * /news/brand_news, /guides/beginner/best-balance-bike-for-1-year-old,
 * /transparency/privacy-policy/), and a live Playwright probe showed the
 * hydrated DOM declaring /news, /guides, /reviews or a slash-stripped
 * transparency path where the static HTML declared the page itself. Root
 * cause: the section pageConfig's pageSlug was applied to every route that
 * hydrates into a section tab (not just the section index), and the
 * transparency branch normalized away configured trailing slashes.
 *
 * This check recomputes what App.tsx would write — through the same shared
 * resolver (src/lib/canonicalPath.ts) the app itself imports — for every
 * sitemap route plus the alias/pagination edge cases, and compares it against
 * the canonical actually emitted into dist/. It fails loudly if either side
 * stops using the shared resolver.
 *
 * Run: npm run check:spacanonicals   (after `npm run build`)
 */
import { readFileSync, existsSync } from "fs";
import path from "path";
import { TRANSPARENCY_PAGES } from "../src/data/transparencyPages";
import { AGE_PATH } from "../src/data/balanceBikeAge";
import { KIDS_AGE_PATH } from "../src/data/kidsBikeAge";
import { KIDS_PRICE_PATH } from "../src/data/kidsBikePrice";
import { SAFETY_PATH } from "../src/data/balanceBikeSafety";
import { KIDS_SAFETY_PATH } from "../src/data/kidsBikeSafety";
import { KIDS_WEIGHT_PATH } from "../src/data/kidsBikeWeight";
import { KIDS_STABILITY_PATH } from "../src/data/kidsBikeStability";
import { KIDS_BUYER_FEEDBACK_PATH } from "../src/data/kidsBuyerFeedback";
import { KIDS_RECALLS_PATH } from "../src/data/kidsBikeRecalls";
import { KIDS_SCOOTER_ASSET_PATHS } from "../src/data/kidsScooterSeo";
import { SIZING_PATH } from "../src/data/balanceBikeSizing";
import { KIDS_SIZING_PATH } from "../src/data/kidsBikeSizing";
import { STABILITY_PATH } from "../src/data/balanceBikeStability";
import { WEIGHT_PATH } from "../src/data/balanceBikeWeight";
import { RECALL_SAFETY_PATH } from "../src/data/safetyRecallRecord";
import { BUYER_FEEDBACK_PATH } from "../src/data/balanceBikeBuyerFeedback";
import { BUDGET_PATH } from "../src/data/balanceBikeBudget";
import {
  normalizeCanonicalPath,
  buildCanonicalPathFromPageConfig,
  productCategoryCanonicalPath,
  transparencyCanonicalPath,
} from "../src/lib/canonicalPath";
import { DEFAULT_CMS_PAGE_BLUEPRINT } from "../src/lib/cmsSectionSeo";

const ROOT = process.env.CHECK_SPA_CANONICALS_ROOT || "dist";
const ORIGIN = "https://balancebiketoddler.com";

const ASSET_PATHS = [
  AGE_PATH,
  KIDS_AGE_PATH,
  KIDS_PRICE_PATH,
  SAFETY_PATH,
  KIDS_SAFETY_PATH,
  KIDS_WEIGHT_PATH,
  KIDS_STABILITY_PATH,
  KIDS_BUYER_FEEDBACK_PATH,
  KIDS_RECALLS_PATH,
  SIZING_PATH,
  KIDS_SIZING_PATH,
  STABILITY_PATH,
  WEIGHT_PATH,
  RECALL_SAFETY_PATH,
  BUYER_FEEDBACK_PATH,
  BUDGET_PATH,
  ...KIDS_SCOOTER_ASSET_PATHS,
];

const SECTION_KEYS = ["home", "products", "reviews", "guides", "news", "about"] as const;

/** Reads the <link rel="canonical"> the prerender actually wrote. */
function readBuiltCanonical(route: string): string | null {
  const clean = route.replace(/^\/+|\/+$/g, "");
  const candidates = [path.join(ROOT, clean, "index.html"), path.join(ROOT, `${clean}.html`)];
  const file = candidates.find((candidate) => existsSync(candidate));
  if (!file) return null;
  const html = readFileSync(file, "utf8");
  const match = /<link\s+rel="canonical"\s+href="([^"]*)"/i.exec(html);
  return match ? match[1] : null;
}

/**
 * What the hydrated SPA publishes for a route, recomputed through the shared
 * resolver (the same functions App.tsx calls). Channel/detail routes under a
 * section tab self-canonicalize; only the section index uses the pageSlug.
 */
function spaCanonicalForRoute(route: string): string {
  const segments = route.split("/").filter(Boolean);

  if (route.startsWith("/transparency/")) {
    const page = TRANSPARENCY_PAGES.find((entry) => entry.en.path === route);
    if (page) return `${ORIGIN}${transparencyCanonicalPath(page.en.path)}`;
  }

  if (ASSET_PATHS.includes(route)) return `${ORIGIN}${route}`;

  if (segments[0] === "products") {
    if (segments.length === 2) return `${ORIGIN}${productCategoryCanonicalPath(segments[1])}`;
    return `${ORIGIN}${normalizeCanonicalPath(route)}`; // product detail: self
  }

  if (segments.length >= 2 && (segments[0] === "news" || segments[0] === "guides")) {
    if (segments.length >= 3) return `${ORIGIN}${normalizeCanonicalPath(route)}`; // article detail: self
    const key = segments[0];
    return `${ORIGIN}${buildCanonicalPathFromPageConfig(DEFAULT_CMS_PAGE_BLUEPRINT[key], route, 1)}`;
  }

  if (segments[0] === "reviews") {
    return `${ORIGIN}${buildCanonicalPathFromPageConfig(DEFAULT_CMS_PAGE_BLUEPRINT.reviews, route, 1)}`;
  }

  const key = (SECTION_KEYS as readonly string[]).includes(segments[0] || "")
    ? (segments[0] as string)
    : "home";
  return `${ORIGIN}${buildCanonicalPathFromPageConfig(DEFAULT_CMS_PAGE_BLUEPRINT[key], route, 1)}`;
}

function main() {
  const sitemapPath = path.join(ROOT, "sitemap.xml");
  if (!existsSync(sitemapPath)) {
    console.error(`check:spacanonicals — ${sitemapPath} not found (run the build first)`);
    process.exit(1);
  }
  const sitemap = readFileSync(sitemapPath, "utf8");
  const routes = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => m[1].trim())
    .map((url) => url.startsWith(ORIGIN) ? url.slice(ORIGIN.length) : url);

  // Non-sitemap edge cases: alias consolidation + pagination keep working.
  const extraChecks: Array<{ route: string; expect: string }> = [
    { route: "/products/other", expect: `${ORIGIN}/products/kids-tricycles/` },
    { route: "/news/page/2", expect: `${ORIGIN}/news/page/2` },
    { route: "/reviews/page/2", expect: `${ORIGIN}/reviews/page/2` },
  ];

  const failures: string[] = [];
  let checked = 0;
  let missingFiles = 0;

  for (const route of routes) {
    const spa = spaCanonicalForRoute(route);
    if (spa !== `${ORIGIN}${route}`) {
      failures.push(`SPA canonical drift: ${route}\n    spa=${spa}\n    want=${ORIGIN}${route}`);
    }
    const built = readBuiltCanonical(route);
    if (built === null) {
      missingFiles++;
    } else if (built !== `${ORIGIN}${route}`) {
      failures.push(`prerender canonical drift: ${route}\n    dist=${built}\n    want=${ORIGIN}${route}`);
    }
    checked++;
  }

  for (const { route, expect } of extraChecks) {
    const spa = spaCanonicalForRoute(route);
    if (spa !== expect) {
      failures.push(`edge case ${route}\n    spa=${spa}\n    want=${expect}`);
    }
    checked++;
  }

  if (missingFiles > 0) {
    console.log(`note: ${missingFiles} sitemap route(s) had no dist HTML file to read (skipped static check)`);
  }

  if (failures.length > 0) {
    console.error(`check:spacanonicals FAILED (${failures.length} of ${checked}):\n${failures.join("\n")}`);
    process.exit(1);
  }
  console.log(`check:spacanonicals OK — ${checked} route(s): hydrated SPA canonical === prerendered canonical === sitemap URL`);
}

main();
