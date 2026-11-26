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
  id?: string;
  name?: string;
  brand?: string;
  en?: { brandText?: string };
  zh?: { brandText?: string };
  Category_Attributes?: Record<string, unknown>;
  Product_Specifications?: Record<string, Record<string, unknown>>;
}

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();

/**
 * Curated corrections for records where no general rule can be trusted.
 *
 * Generated from scripts/product-brand-corrections.json, which holds the
 * source that justifies each one. Inlined rather than imported so this module
 * stays dependency-free for both the bundler and the prerender's tsx runner.
 * scripts/check-brand-corrections.mjs asserts the two agree, so the ledger and
 * the code cannot drift.
 *
 * Shape: record id -> { from, to }. `from` is the value the record stores; if a
 * future import changes it, the entry stops applying rather than silently
 * renaming a different product.
 */
const CURATED_BRANDS: Record<string, { from: string; to: string }> = {
  "scooters-b0dzg3qylr": { from: "Green", to: "Campior" },
  "stroller-b078tbp298": { from: "Baby", to: "Costzon" },
  "stroller-b0d65f9ns7": { from: "Baby", to: "Monamii" },
  "stroller-b0dk4p46nf": { from: "Baby", to: "Monamii" },
  "stroller-b0dlkjfk39": { from: "Baby", to: "Hagaday" },
  "kids_push_ride_ons-b00005850h": { from: "Little", to: "Little Tikes" },
  "balance_bike-b0ccy6yrs8": { from: "Colorful", to: "WETIFY" },
  "balance_bike-b0dg8vrzbz": { from: "Colorful", to: "Doselie" },
  "electric_vehicles-b017hhkgie": { from: "Kids", to: "Lil' Rider" },
  "electric_vehicles-b07cjv1975": { from: "Kids", to: "EXCLUSKY" },
};

/** The curated brand for a record, but only while the record still stores `from`. */
function curatedBrandFor(
  id: string | undefined,
  stored: string,
  table: Record<string, { from: string; to: string }>,
): string {
  const entry = table[String(id || "").trim()];
  if (!entry) return "";
  return entry.from.toLowerCase() === stored.toLowerCase() ? entry.to : "";
}

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
 * Two corrections are applied, in this order:
 *
 *  1. A curated table entry for the record id, if one exists. Those cover the
 *     cases the general rule cannot reach — records whose stored brand is not a
 *     clipped brand at all but a first word of the TITLE ("Green" for a Campior
 *     scooter, "Baby" for a Hagaday stroller). The scraper derives Brand as
 *     `Title.split(' ')[0]`, so any brand that is a plain English or quantity
 *     word is an artefact rather than a company. Every entry in the table
 *     carries an independent source, and scripts/check-brand-corrections.mjs
 *     verifies that source still holds.
 *
 *  2. The self-proving rule below, for records whose brand really is a clipped
 *     company name ("Radio" -> "Radio Flyer").
 *
 * @param product     The raw product record.
 * @param storedBrand The value already on the record (`en.brandText` or
 *                    `brand`). Passed explicitly so the caller controls which
 *                    field wins, exactly as it did before this was extracted.
 * @param curatedTable Which curated table to consult. Defaults to the real one.
 *                    The override exists ONLY so scripts/check-brand-corrections.ts
 *                    can prove that a ledger entry actually drives the resolver,
 *                    using a fixture id that by definition is not in the shipped
 *                    table. Production callers must never pass it: a caller-side
 *                    table would be a second copy of the rule.
 */
export function resolveProductBrand(
  product: BrandProductLike,
  storedBrand?: string,
  curatedTable: Record<string, { from: string; to: string }> = CURATED_BRANDS,
): string {
  const stored = clean(storedBrand ?? product.en?.brandText ?? product.brand);

  const curated = curatedBrandFor(product.id, stored, curatedTable);
  if (curated) return curated;

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