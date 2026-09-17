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

/**
 * Extracts the first image URL embedded in article content. Understands both
 * markdown image syntax `![alt](url)` and inline HTML `<img src="url">`.
 * Data-URI and inline SVG sources are ignored.
 */
export function extractFirstContentImage(content: string): string {
  const raw = String(content || "");
  const markdown = raw.match(/!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/);
  if (markdown?.[1] && !markdown[1].startsWith("data:")) return markdown[1];
  const html = raw.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (html?.[1] && !html[1].startsWith("data:")) return html[1];
  return "";
}

/**
 * Card image resolution order: explicit cover image first, then the first
 * image embedded in the body. Empty string means "no image available" and the
 * card should render the shared placeholder block.
 */
export function resolveCardImage(imageUrl: string, content: string): string {
  const cover = String(imageUrl || "").trim();
  if (cover) return cover;
  return extractFirstContentImage(content);
}

/**
 * Card excerpt decoupled from the SEO description: use the first meaningful
 * paragraph of the body (headings/images/markup stripped), falling back to the
 * stored summary when the body has no usable text.
 */
export function buildCardExcerpt(content: string, fallbackSummary: string, maxLen = 110): string {
  const paragraphs = String(content || "")
    .split(/\n+/)
    .map((line) =>
      line
        .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/[#>*`_[\]~]/g, " ")
        .replace(/https?:\/\/\S+/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter((line) => line.length >= 24 && !/^\d+[.)]\s*$/.test(line));
  const text = paragraphs[0] || String(fallbackSummary || "").trim();
  if (!text) return "";
  return text.length > maxLen ? `${text.slice(0, maxLen - 1).trimEnd()}…` : text;
}
