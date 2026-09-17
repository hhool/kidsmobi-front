/**
 * Shared helpers for article-level SEO metadata (guides / news detail views).
 *
 * The prerender writes correct <title>/<meta>/canonical tags for static detail
 * pages, but once the SPA hydrates, the global SEO effect in App.tsx used to
 * overwrite them with the section-homepage values. Sections now report the
 * active article's metadata up to App (via an `onActiveArticleMeta` callback),
 * and App applies it instead of the section defaults while a detail view is
 * open.
 */

export interface ArticleSeoMeta {
  /** Fully formatted <title> (brand suffix included). */
  title: string;
  /** Plain-text meta description, <= ~155 chars. */
  description: string;
  /** Optional og:image URL. */
  image?: string;
  /** Absolute path (starting with "/") that the canonical URL should point to. */
  canonicalPath: string;
  keywords?: string[];
}

const BRAND = "BalanceBikeToddler";

/** Appends the brand suffix unless the title already contains it. */
export function buildArticleSeoTitle(title: string): string {
  const clean = String(title || "").trim();
  if (!clean) return "";
  return clean.includes(BRAND) ? clean : `${clean} | ${BRAND}`;
}

/**
 * Converts markdown-ish article content into a plain-text meta description.
 * Strips HTML tags, markdown markers, and collapses whitespace.
 */
export function buildArticleSeoDescription(raw: string, maxLen = 155): string {
  const text = String(raw || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#>*`_[\]()~|]/g, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return "";
  return text.length > maxLen ? `${text.slice(0, maxLen - 1).trimEnd()}…` : text;
}
