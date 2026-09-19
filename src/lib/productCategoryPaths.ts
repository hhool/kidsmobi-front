/**
 * Single source of truth for the /products URL family (P0-2 kebab-case
 * refactor). Mirrored by scripts/prerender-pages.ts and the Worker sitemap —
 * all three must stay in lockstep.
 *
 * URL canonical families:
 *   category hub  -> /products/<slug>/          (trailing-slash directory)
 *   product page  -> /products/<detailSlug>/<product.id>
 *
 * Secondary buckets (tricycles, push ride-ons, wagons, playard, legacy
 * "other") no longer get an /products/other/ directory: every product is
 * re-homed under the kebab-case directory that matches its physical
 * category, inferred from the raw categoryId or (for legacy "other" rows)
 * from the product id prefix.
 */

export const PRODUCT_CATEGORY_URL_SLUGS: Record<string, string> = {
  // primary category ids
  stroller: "strollers",
  balance_bike: "balance-bikes",
  kids_bikes: "kids-bikes",
  kids_scooters: "kids-scooters",
  scooters: "kids-scooters",
  electric_vehicles: "electric-cars",
  electric_car: "electric-cars",
  car_seat: "safety-seats",
  safety_seat: "safety-seats",
  // secondary / legacy ids -> physical-directory re-homing
  kids_tricycles: "kids-tricycles",
  tricycle: "kids-tricycles",
  tricycles: "kids-tricycles",
  kids_push_ride_ons: "kids-tricycles",
  kids_pull_along_wagons: "kids-tricycles",
  playard: "strollers",
  other: "kids-tricycles",
  // slug identity entries so slug-form inputs normalize to themselves
  strollers: "strollers",
  "balance-bikes": "balance-bikes",
  "kids-bikes": "kids-bikes",
  "kids-scooters": "kids-scooters",
  "electric-cars": "electric-cars",
  "safety-seats": "safety-seats",
  "kids-tricycles": "kids-tricycles",
};

/** Directory slug for a category hub link (accepts ids and slug forms). */
export function productCategoryUrlSlug(categoryIdOrSlug: string): string {
  const raw = String(categoryIdOrSlug || "").trim().toLowerCase();
  return PRODUCT_CATEGORY_URL_SLUGS[raw] || "kids-tricycles";
}

/**
 * Directory slug for a product detail URL. Legacy "other"-bucket rows are
 * re-homed by their id prefix (e.g. stroller-b00fzp3e8a -> strollers,
 * kids_push_ride_ons-b001nqhn7s -> kids-tricycles).
 */
export function productDetailUrlSlug(categoryId: string, productId: string): string {
  const raw = String(categoryId || "").trim().toLowerCase();
  if (raw && PRODUCT_CATEGORY_URL_SLUGS[raw] && raw !== "other") {
    return PRODUCT_CATEGORY_URL_SLUGS[raw];
  }
  const prefix = String(productId || "").split("-")[0].trim().toLowerCase();
  if (PRODUCT_CATEGORY_URL_SLUGS[prefix]) {
    return PRODUCT_CATEGORY_URL_SLUGS[prefix];
  }
  return "kids-tricycles";
}

/** Category hub path for in-app navigation (address-bar canonical form). */
export function productCategoryPath(categoryIdOrSlug: string): string {
  return `/products/${productCategoryUrlSlug(categoryIdOrSlug)}`;
}

/** Detail page path for in-app navigation and internal links. */
export function productDetailPath(categoryId: string, productId: string): string {
  return `/products/${productDetailUrlSlug(categoryId, productId)}/${productId}`;
}
