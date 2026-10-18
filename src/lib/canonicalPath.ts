/**
 * Hydrated-SPA canonical resolution — the ONE place a route's canonical URL is
 * decided at runtime.
 *
 * Every URL on this site is rendered twice: scripts/prerender-pages.ts writes
 * the static HTML (self-canonical by construction — the prerender emits
 * `page.route` verbatim), and src/App.tsx rewrites the canonical link when the
 * SPA hydrates. The two must agree, because Google renders the JS and indexes
 * whatever canonical it finds there.
 *
 * They did not always agree. On 2026-10-19 Search Console reported four URLs
 * as "Alternate page with proper canonical tag", and a Playwright probe of the
 * live site showed why: every route that hydrates into a section tab
 * (news/guides/reviews/about) but is NOT the section index itself —
 * /news/new_product, /news/brand_news, /guides/beginner, /reviews/single,
 * /reviews/single/<slug>, … — had its canonical rewritten to the section
 * homepage (/news, /guides, /reviews), because the section pageConfig's
 * pageSlug was applied to the whole tab instead of just the index route. The
 * prerendered pages kept their own self-canonicals, so the static HTML said one
 * thing and the hydrated DOM said another. Separately, the transparency branch
 * stripped the trailing slash off configured paths like
 * /transparency/privacy-policy/, pointing the canonical at the no-slash form
 * that Cloudflare Pages 308-redirects straight back.
 *
 * scripts/check-spa-canonicals.ts recomputes these functions for every
 * sitemap route and fails the build if either side drifts again.
 */
import { productCategoryUrlSlug } from "./productCategoryPaths";

/** Trailing-slash-stripped pathname, "/" for the root. */
export const normalizePathname = (pathname: string): string => {
  const cleaned = pathname.replace(/\/+$/, "");
  return cleaned || "/";
};

/** Absolute-path form of a route, e.g. "/news/new_product". */
export const normalizeCanonicalPath = (path: string): string => {
  const normalized = normalizePathname(path || "/");
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
};

/** Minimal shape of the CMS page config this module needs. */
export interface CanonicalPageConfig {
  pageSlug?: string;
  canonicalPath?: string;
  paginationPolicy?: string;
}

/**
 * Canonical for a route that hydrates into one of the section tabs
 * (home/products/reviews/guides/news/about).
 *
 * The section pageConfig (DEFAULT_CMS_PAGE_BLUEPRINT when the CMS has no
 * `pages` map — the live case) describes the section INDEX. Its pageSlug
 * therefore only canonicalizes the index itself; every deeper route that
 * hydrates into the same tab keeps its own prerendered self-canonical.
 * An explicit pageConfig.canonicalPath (editorial consolidation, currently
 * unused) still wins when present.
 */
export function buildCanonicalPathFromPageConfig(
  pageConfig: CanonicalPageConfig | undefined,
  currentPath: string,
  activePageIndex = 1,
): string {
  const current = normalizeCanonicalPath(currentPath || "/");

  if (pageConfig?.canonicalPath) {
    return normalizeCanonicalPath(pageConfig.canonicalPath);
  }

  const slug = String(pageConfig?.pageSlug || "").trim();
  if (!slug || slug === "home") return current;

  const normalizedSlug = slug.replace(/^\/+|\/+$/g, "");
  const sectionRoot = `/${normalizedSlug}`;
  const page = Math.max(1, activePageIndex || 1);

  // Pagination of the section index keeps its /page/N form.
  if (pageConfig?.paginationPolicy === "page_path" && page > 1 && current === sectionRoot) {
    return `${sectionRoot}/page/${page}`;
  }

  // The pageSlug canonical applies to the section index and nothing else.
  if (current === sectionRoot) return sectionRoot;
  return current;
}

/**
 * Product-hub canonical: id-form and alias variants of a category consolidate
 * onto the prerendered slug-form URL (/products/<slug>/), which is what the
 * static HTML and the sitemap already use.
 */
export function productCategoryCanonicalPath(activeProductCategory: string): string | undefined {
  if (!activeProductCategory || activeProductCategory === "all") return undefined;
  return `/products/${productCategoryUrlSlug(activeProductCategory)}/`;
}

/**
 * Transparency pages keep their configured path VERBATIM. Those paths carry a
 * trailing slash (Pages 308s the no-slash form onto it), so normalizing it
 * away made the hydrated canonical point at a redirecting URL — the exact
 * confusion that landed /transparency/privacy-policy/ in the alternates group.
 */
export function transparencyCanonicalPath(configuredPath: string): string {
  const raw = String(configuredPath || "").trim();
  if (!raw) return "/";
  return raw.startsWith("/") ? raw : `/${raw}`;
}
