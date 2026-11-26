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
 * Validates that a product's id prefix matches its expected category.
 * This catches CMS miscategorizations where categoryId disagrees with id prefix.
 * Returns true if the product appears to be correctly categorized.
 */
function isValidProductCategory(product: RelatedProductCandidate): boolean {
  const id = String(product.id || "");
  const category = String(product.category || "");
  
  // Extract id prefix (everything before the first hyphen)
  const idPrefix = id.split("-")[0].toLowerCase();
  
  // Common category mappings
  const categoryMap: Record<string, string[]> = {
    "balance_bike": ["balance-bike", "balance_bike"],
    "kids_bikes": ["kids-bike", "kids_bikes", "bicycle"],
    "kids_scooters": ["scooter", "scooters", "kids-scooter", "kids_scooters"],
    "electric_vehicles": ["electric-car", "electric_vehicle", "electric_vehicles", "electric-car"],
    "stroller": ["stroller", "strollers"],
    "car_seat": ["car-seat", "car_seat", "safety-seat", "safety_seat"],
    "kids_tricycles": ["tricycle", "tricycles", "kids-tricycle", "kids_tricycles"],
  };
  
  // Check if id prefix matches category
  const expectedCategories = categoryMap[idPrefix] || [idPrefix];
  const normalizedCategory = category.toLowerCase().replace(/[_-]/g, "");
  
  // If category is provided and doesn't match id prefix, it's likely miscategorized
  if (category && !expectedCategories.some(cat => cat.toLowerCase().replace(/[_-]/g, "") === normalizedCategory)) {
    return false;
  }
  
  return true;
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
    .filter((product) => isValidProductCategory(product))
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
