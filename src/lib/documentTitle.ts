/**
 * The one place a page's <title> and meta description are built.
 *
 * The site has two renderers for the same URL: scripts/prerender-pages.ts
 * writes the static HTML Google fetches, and src/App.tsx writes the hydrated
 * SPA a visitor's browser shows. They used to compute titles independently,
 * which is how /transparency/* shipped a <title> with no brand suffix in the
 * SPA while the prerendered HTML of the same URL had one — two different
 * answers to "what is this page called", chosen by whoever loaded it.
 *
 * Both sides now call buildDocumentTitle() / buildMetaDescription() from here.
 * scripts/check-spa-titles.ts fails the build if they ever drift again.
 */

export const SITE_TITLE_SUFFIX = " | BalanceBikeToddler";

/** Semrush/SERP budget. Titles longer than this get elided by Google anyway. */
export const TITLE_MAX_CHARS = 65;
export const DESCRIPTION_MAX_CHARS = 158;

/** Word-boundary truncation for SEO text. */
export function capSeoText(text: string, maxChars: number): string {
  const raw = String(text || "").trim().replace(/\s+/g, " ");
  if (raw.length <= maxChars) return raw;
  const cut = raw.slice(0, maxChars);
  const sp = cut.lastIndexOf(" ");
  return (sp > 20 ? cut.slice(0, sp) : cut).replace(/[\s,;:.–—-]+$/, "");
}

/**
 * Words that must never be the LAST word of a truncated <title>.
 *
 * `capSeoText` alone is fine for meta descriptions but produces junk titles:
 * it cut "Review Count Integrity: The Numbers We Refused to Publish" down to
 * "…The Numbers We", and "Finding the Best Balance Bike for a 1-Year-Old" to
 * "…for a". In a search result those read like a machine stopped mid-sentence —
 * exactly the "auto-generated content" impression the whole site is trying to
 * avoid. Dropping one more word costs almost no keyword coverage, so the list
 * is deliberately narrow: conjunctions, prepositions, articles and the pronouns
 * that only ever appear mid-clause.
 */
const TITLE_DANGLING_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "nor", "as", "at", "by", "for", "from",
  "in", "of", "on", "to", "with", "than", "then", "that", "this", "these",
  "those", "it", "its", "is", "are", "was", "we", "our", "you", "your", "who",
  "how", "what", "when", "where", "why", "vs", "vs.", "&", "&amp;", "|",
]);

/** Title-safe capping: word boundary, then no dangling connector word. */
export function capSeoTitle(text: string, maxChars: number): string {
  const capped = capSeoText(text, maxChars);
  const words = capped.split(" ");
  if (words.length < 2) return capped;
  const start = words.length;
  while (words.length > 1 && TITLE_DANGLING_WORDS.has(words[words.length - 1].toLowerCase())) {
    words.pop();
  }
  if (words.length === start) return capped;
  return words.join(" ").replace(/[\s,;:.–—|&+\-]+$/, "").trim() || capped;
}

/** Cuts meta description to ≤maxChars at a word boundary. */
export function capMetaDescription(text: string, maxChars = DESCRIPTION_MAX_CHARS): string {
  return capSeoText(text, maxChars);
}

/**
 * Amazon ASINs inside meta descriptions ("… (ASIN B07P1YSC18) is an ultra-light
 * umbrella stroller…") come from CMS review copy. The snippet is the first
 * sentence a parent reads, and an opaque marketplace ID there is the clearest
 * tell that the text was harvested. The identifier stays on the page where it
 * actually does something — it identifies the listing in the body copy.
 */
export function stripCatalogueIds(text: string): string {
  return String(text || "")
    .replace(/\(?\b(?:ASIN|amazon)\s*[:#]?\s*B0[0-9A-Z]{8}\b\)?/gi, "")
    .replace(/\(\s*B0[0-9A-Z]{8}\s*\)/gi, "")
    .replace(/\(\s*\)/g, "")
    .replace(/\s+([,.;:)])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * The full <title> tag for a page.
 *
 * `override` is an explicit full title (used when collision handling had to
 * rewrite one); it wins and is returned untouched. Otherwise the brand suffix
 * is appended and the whole thing capped, so the suffix survives truncation —
 * a title that loses its brand is a title nobody can attribute.
 *
 * Idempotent: passing an already-suffixed title does not double it up, because
 * both renderers call this and the SPA can run over a title the prerender
 * already produced.
 */
export function buildDocumentTitle(title: string, override?: string | null): string {
  if (override) return override;
  const stem = String(title || "").trim().replace(/\s+/g, " ");
  if (!stem) return stem;
  if (stem.endsWith(SITE_TITLE_SUFFIX)) {
    return stem.length <= TITLE_MAX_CHARS
      ? stem
      : capSeoTitle(stem, TITLE_MAX_CHARS);
  }
  const full = `${stem}${SITE_TITLE_SUFFIX}`;
  if (full.length <= TITLE_MAX_CHARS) return full;
  return `${capSeoTitle(stem, TITLE_MAX_CHARS - SITE_TITLE_SUFFIX.length)}${SITE_TITLE_SUFFIX}`;
}

/** The meta description for a page: ASINs stripped, then capped. */
export function buildMetaDescription(
  description: string,
  scrub: (text: string) => string = (text) => text,
): string {
  return capMetaDescription(scrub(stripCatalogueIds(description)));
}
