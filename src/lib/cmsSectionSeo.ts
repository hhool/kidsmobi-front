/**
 * Section-route SEO resolution — the ONE place the title/description of the
 * structural pages (home/products/reviews/guides/news/about) is decided.
 *
 * These pages have two renderers for the same URL: scripts/prerender-pages.ts
 * writes the static HTML Google fetches, and src/App.tsx writes the hydrated
 * SPA. They used to resolve section TDK independently (prerender hardcoded
 * fullTitle strings, the SPA read the live CMS), so the static HTML and the
 * tab a parent sees drifted apart — and Google indexed whichever renderer it
 * happened to execute. The 2026-10-15/16 audit found all six section routes
 * publishing different titles after hydration.
 *
 * Both renderers now call resolveSectionRouteSeo() / publishSectionTitle() /
 * publishSectionDescription() from here, and scripts/check-spa-titles.ts
 * recomputes the SPA value through the same functions to prove the built
 * dist/ still agrees. The CMS stays the editorial entry point: update
 * settings.seo in the CMS dashboard, rerun `npm run data:settings` (or just
 * build — the prerender fetches live settings itself), and both renderers
 * publish the new copy.
 */
import type { CMSPageConfig, CMSSettings, SEOConfig } from "../types";
import { DEFAULT_SEO_CONFIGS, normalizeSeoConfig } from "../config/defaultSeo";
import { sanitizeUnsupportedClaims } from "./unsupportedClaims";
import { buildMetaDescription, capSeoTitle, SITE_TITLE_SUFFIX, TITLE_MAX_CHARS } from "./documentTitle";

/** Mirrors src/App.tsx SEO_KEY_TO_PAGE_TYPE (moved here so the resolver is pure). */
export const SEO_KEY_TO_PAGE_TYPE: Record<string, CMSPageConfig["pageType"]> = {
  home: "home",
  products: "products_index",
  evaluations: "reviews_index",
  reviews: "reviews_index",
  guides: "guides_index",
  news: "news_index",
  about: "about",
};

/** Mirrors src/App.tsx DEFAULT_CMS_PAGE_BLUEPRINT (no .seo — pure pageConfig fallback). */
export const DEFAULT_CMS_PAGE_BLUEPRINT: Record<string, CMSPageConfig> = {
  home: { pageType: "home", pageSlug: "home", pageIndex: 1, paginationPolicy: "none", indexingPolicy: "index", status: "published" },
  products: { pageType: "products_index", pageSlug: "products", pageIndex: 1, paginationPolicy: "page_path", indexingPolicy: "index", status: "published" },
  reviews: { pageType: "reviews_index", pageSlug: "reviews", pageIndex: 1, paginationPolicy: "page_path", indexingPolicy: "index", status: "published" },
  evaluations: { pageType: "reviews_index", pageSlug: "reviews", pageIndex: 1, paginationPolicy: "page_path", indexingPolicy: "index", status: "published" },
  guides: { pageType: "guides_index", pageSlug: "guides", pageIndex: 1, paginationPolicy: "page_path", indexingPolicy: "index", status: "published" },
  news: { pageType: "news_index", pageSlug: "news", pageIndex: 1, paginationPolicy: "page_path", indexingPolicy: "index", status: "published" },
  about: { pageType: "about", pageSlug: "about", pageIndex: 1, paginationPolicy: "none", indexingPolicy: "index", status: "published" },
};

export const normalizeSeoKey = (value: string) => {
  if (!value) return value;
  if (value === "evaluations") return "reviews";
  return value;
};

export const getSeoAliasKeys = (value: string): string[] => {
  const normalized = normalizeSeoKey(value);
  const keys = new Set<string>();
  if (normalized) keys.add(normalized);
  if (value) keys.add(value);
  if (normalized === "reviews") {
    keys.add("evaluations");
  }
  if (value === "evaluations") {
    keys.add("reviews");
  }
  return Array.from(keys).filter(Boolean);
};

/**
 * The CMS page-config (pagination/canonical/indexing) that backs a section
 * route. Pure: takes the settings object instead of reading React state.
 * activePageIndex only matters for CMS-configured paginated pages; the
 * prerendered base state is always page 1.
 */
export function resolveCmsPageConfigForRoute(
  settings: CMSSettings | null | undefined,
  seoKey: string,
  activePageIndex = 1,
): CMSPageConfig {
  const normalizedKey = normalizeSeoKey(seoKey);
  const aliasKeys = new Set(getSeoAliasKeys(seoKey));
  const pageType = SEO_KEY_TO_PAGE_TYPE[normalizedKey] || SEO_KEY_TO_PAGE_TYPE[seoKey];
  const configuredPages = Object.values(settings?.pages || {}).filter(Boolean) as CMSPageConfig[];
  const publishedPages = configuredPages.filter((item) => !item.status || item.status === "published");
  const candidatePool = publishedPages.length > 0 ? publishedPages : configuredPages;

  const matchedByType = candidatePool.filter((item) => item.pageType === pageType);
  const matchedBySlug = candidatePool.filter((item) => {
    const pageSlug = String(item.pageSlug || "").trim().toLowerCase();
    return Array.from(aliasKeys).some((key) => key && pageSlug === key.toLowerCase());
  });
  const matched = [...matchedByType, ...matchedBySlug];

  if (matched.length === 0) {
    return DEFAULT_CMS_PAGE_BLUEPRINT[normalizedKey] || DEFAULT_CMS_PAGE_BLUEPRINT[seoKey] || DEFAULT_CMS_PAGE_BLUEPRINT.home;
  }

  const currentIndex = Math.max(1, activePageIndex || 1);
  const exact = matched.find((item) => Number(item.pageIndex || 1) === currentIndex);
  if (exact) {
    return exact;
  }

  const firstPage = matched.find((item) => Number(item.pageIndex || 1) === 1);
  return firstPage || matched[0];
}

/**
 * Section-route SEO resolution chain (identical to what the hydrated SPA does
 * at runtime): per-page CMS seo  >  settings.seo[alias]  >  defaultSeo.ts.
 */
export function resolveCmsRouteSeoConfig(
  settings: CMSSettings | null | undefined,
  seoKey: string,
  lang: "zh" | "en",
  activePageIndex = 1,
): { seo: SEOConfig; pageConfig: CMSPageConfig } {
  const normalizedKey = normalizeSeoKey(seoKey);
  const pageConfig = resolveCmsPageConfigForRoute(settings, seoKey, activePageIndex);
  const fallbackSeo =
    DEFAULT_SEO_CONFIGS[normalizedKey]?.[lang] || DEFAULT_SEO_CONFIGS[seoKey]?.[lang] || DEFAULT_SEO_CONFIGS.home[lang];

  const pageSeo = pageConfig?.seo?.[lang];
  if (pageSeo) {
    return { seo: pageSeo, pageConfig };
  }

  const routeSeo = getSeoAliasKeys(seoKey)
    .map((key) => settings?.seo?.[key]?.[lang])
    .find(Boolean);
  if (routeSeo) {
    return { seo: routeSeo as SEOConfig, pageConfig };
  }

  return { seo: fallbackSeo, pageConfig };
}

/**
 * The <title> a section route publishes. The prerender injects this as the
 * page.fullTitle override (returned untouched by buildDocumentTitle) and then
 * runs its whole-document claim scrub over the HTML; sanitizeUnsupportedClaims
 * is idempotent (no replacement contains a matchable phrase), so applying it
 * here as well is a no-op for the static pass and keeps the hydrated SPA — which
 * must NOT publish an unsupported claim the prerender scrubbed — byte-identical.
 *
 * The scrub can LENGTHEN a title ("Safety Lab" -> "Safety Source-based"), so
 * the Semrush 65-char budget is enforced here too, brand-suffix-aware exactly
 * like buildDocumentTitle(): a title that loses its brand is a title nobody can
 * attribute. Both renderers call this function, so they truncate identically.
 */
export function publishSectionTitle(title: string): string {
  const scrubbed = sanitizeUnsupportedClaims(String(title || "").trim().replace(/\s+/g, " "));
  if (!scrubbed) return scrubbed;
  if (scrubbed.length <= TITLE_MAX_CHARS) return scrubbed;
  if (scrubbed.endsWith(SITE_TITLE_SUFFIX)) {
    const stem = scrubbed.slice(0, -SITE_TITLE_SUFFIX.length);
    return `${capSeoTitle(stem, TITLE_MAX_CHARS - SITE_TITLE_SUFFIX.length)}${SITE_TITLE_SUFFIX}`;
  }
  return capSeoTitle(scrubbed, TITLE_MAX_CHARS);
}

/**
 * The meta description a section route publishes. Identical call to the one
 * renderDocument() makes for every other page: ASINs stripped, claims scrubbed,
 * capped at a word boundary. normalizeSeoConfig already trimmed to 155, so the
 * 158-char cap never cuts further here.
 */
export function publishSectionDescription(description: string): string {
  return buildMetaDescription(description, sanitizeUnsupportedClaims);
}

/**
 * Full section-route TDK from a CMS settings object. Called by:
 *  - scripts/prerender-pages.ts (build time, live-fetched settings)
 *  - scripts/check-spa-titles.ts (recomputes what the SPA would write)
 *  - src/App.tsx (via publishSectionTitle/Description on the resolved config)
 */
export function resolveSectionRouteSeo(
  settings: CMSSettings | null | undefined,
  seoKey: string,
  lang: "zh" | "en" = "en",
): { title: string; description: string; keywords: string[] } {
  const { seo } = resolveCmsRouteSeoConfig(settings, seoKey, lang);
  const normalized = normalizeSeoConfig(seo);
  return {
    title: publishSectionTitle(normalized.title),
    description: publishSectionDescription(normalized.description),
    keywords: normalized.keywords,
  };
}
