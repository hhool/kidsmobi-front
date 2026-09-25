/**
 * Shared "related products" matcher used by BOTH the prerender script
 * (scripts/prerender-pages.ts) and the SPA components, so the static HTML
 * and the hydrated DOM render the same contextual product links.
 *
 * Matching is strictly token-based against real CMS fields (name / brand /
 * category label + summary). It never invents products: if no tokens match,
 * the caller is expected to render nothing.
 */

export interface RelatedProductCandidate {
  id: string;
  name?: string;
  brand?: string;
  category?: string;
  summary?: string;
}

const STOP_TOKENS = new Set([
  "review", "reviews", "single", "compare", "comparison", "with", "the", "and",
  "for", "best", "kids", "baby", "toddler", "guide", "guides", "news", "your",
  "how", "choose", "perfect", "this", "that", "from", "have", "year",
]);

/** Extracts meaningful lowercase tokens from free text. */
function tokenize(text: string): string[] {
  return String(text || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 4 && !STOP_TOKENS.has(t));
}

/**
 * Ranks products by how many of their identifying tokens appear in `text`.
 * Returns at most `limit` products, highest score first. Products with a
 * score of 0 are dropped entirely (no padding, no invented matches).
 */
export function matchProductsForText(
  text: string,
  products: RelatedProductCandidate[],
  limit = 3,
): RelatedProductCandidate[] {
  const tokens = tokenize(text);
  if (!tokens.length) return [];
  const tokenSet = new Set(tokens);

  const scored = products
    .map((product) => {
      const nameTokens = tokenize(`${product.name || ""} ${product.brand || ""}`);
      const summaryTokens = tokenize(product.summary || "");
      let score = 0;
      for (const token of nameTokens) {
        if (tokenSet.has(token)) score += 2;
      }
      for (const token of summaryTokens) {
        if (tokenSet.has(token)) score += 1;
      }
      return { product, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map((entry) => entry.product);
}
