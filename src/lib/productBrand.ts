/**
 * Product brand resolver — one implementation for both renderers.
 *
 * Used by BOTH (same pattern as src/lib/productFaq.ts and productAgeRange.ts):
 *  - scripts/prerender-pages.ts   (JSON-LD Brand.name, and the visible rows)
 *  - src/components/DetailedProductView.tsx / App.tsx (hydrated DOM, JSON-LD)
 *
 * The problem
 * -----------
 * 54 of 196 records store a brand truncated to its first word — "Radio" for
 * Radio Flyer, "Little" for Little Tikes, "Best" for Best Choice Products,
 * "First" for First Ride On, "Baby" for Baby Trend, "MINIATURE" for Miniature
 * Motors. The clip is in the record itself: `brand`, `en.brandText` and
 * `zh.brandText` all carry it, so every reader inherited it, including the
 * JSON-LD `Brand.name` on each product page.
 *
 * Why a reader-side fix instead of a data fix
 * -------------------------------------------
 * Correcting the CMS records would mean 54 writes derived from a heuristic.
 * The correction here is applied ONLY when it proves itself from the same
 * record, which makes it safe to compute at read time:
 *
 *   1. the listing states a brand in `Product_Specifications`
 *      (Item_Details / Additional_Details "Brand" | "Brand Name") or in
 *      `Category_Attributes.Brand`;
 *   2. that stated brand is strictly longer and begins with the stored brand
 *      as a whole word ("Radio" -> "Radio Flyer");
 *   3. the product's own NAME begins with the fuller brand.
 *
 * All three must hold. A record whose name does not start with the fuller brand
 * keeps its stored value, because condition 3 is what separates a truncated
 * brand from a genuinely different one ("Baby" is a brand prefix in "Baby Trend
 * ...", but also a category word in other names). Measured over the catalogue:
 * 54 correctable, 0 unanchored, 0 ambiguous — so this never guesses.
 */

interface BrandProductLike {
  name?: string;
  brand?: string;
  en?: { brandText?: string };
  zh?: { brandText?: string };
  Category_Attributes?: Record<string, unknown>;
  Product_Specifications?: Record<string, Record<string, unknown>>;
}

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();

/** Every brand the listing itself states, in the order it states them. */
function statedBrands(product: BrandProductLike): string[] {
  const out: string[] = [];
  const specs = product.Product_Specifications || {};
  for (const section of ["Item_Details", "Additional_Details"]) {
    const block = specs[section];
    if (!block || typeof block !== "object") continue;
    for (const key of ["Brand", "Brand Name"]) {
      const value = block[key];
      const text = typeof value === "string" ? clean(value) : "";
      if (text && !out.includes(text)) out.push(text);
    }
  }
  const fromCategory = clean(product.Category_Attributes?.Brand);
  if (fromCategory && !out.includes(fromCategory)) out.push(fromCategory);
  return out;
}

/**
 * The brand as the listing states it, not the first word of it.
 *
 * @param product     The raw product record.
 * @param storedBrand The value already on the record (`en.brandText` or
 *                    `brand`). Passed explicitly so the caller controls which
 *                    field wins, exactly as it did before this was extracted.
 */
export function resolveProductBrand(product: BrandProductLike, storedBrand?: string): string {
  const stored = clean(storedBrand ?? product.en?.brandText ?? product.brand);
  const name = clean(product.name);
  if (!stored || !name) return stored;

  const storedLower = stored.toLowerCase();
  for (const candidate of statedBrands(product)) {
    const candidateLower = candidate.toLowerCase();
    const isLonger = candidateLower.length > storedLower.length;
    const extendsStored = candidateLower.startsWith(`${storedLower} `);
    const anchoredInName = name.toLowerCase().startsWith(candidateLower);
    if (isLonger && extendsStored && anchoredInName) return candidate;
  }
  return stored;
}