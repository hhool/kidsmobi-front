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

/**
 * Raw category aliases -> primary category id. Mirrors PRODUCT_ROUTE_ALIASES
 * in App.tsx and PRERENDER_PRODUCT_ROUTE_ALIASES in prerender-pages.ts so the
 * article pages (guides/news/reviews) can resolve a product's detail directory
 * exactly like the product detail pages themselves do.
 */
const PRODUCT_CATEGORY_PRIMARY_ALIASES: Record<string, string> = {
  stroller: "stroller",
  balance_bike: "balance_bike",
  kids_bikes: "kids_bikes",
  kids_scooters: "kids_scooters",
  electric_vehicles: "electric_vehicles",
  car_seat: "car_seat",
  kids_tricycles: "kids_tricycles",
  playard: "playard",
  high_chair: "high_chair",
  kids_push_ride_ons: "kids_push_ride_ons",
  kids_pull_along_wagons: "kids_pull_along_wagons",
  baby_carrier: "baby_carrier",
  other: "other",
  scooters: "kids_scooters",
  scooter: "kids_scooters",
  "kids-scooters": "kids_scooters",
  "kids-bikes": "kids_bikes",
  "balance-bikes": "balance_bike",
  "electric-cars": "electric_vehicles",
  "safety-seats": "car_seat",
  "kids-tricycles": "kids_tricycles",
  tricycles: "kids_tricycles",
  tricycle: "kids_tricycles",
  balance: "balance_bike",
  "balance bike": "balance_bike",
  bicycle: "kids_bikes",
  electric_car: "electric_vehicles",
  safety_seat: "car_seat",
  strollers: "stroller",
  jogger_stroller: "stroller",
  jogging_stroller: "stroller",
  jogger: "stroller",
  jogging: "stroller",
  others: "other",
};

/**
 * Resolves a CMS product's /products detail directory slug, applying the same
 * category alias normalization + "stroller" misclassification inference used
 * by the product detail page renderer (App.tsx resolveProductCategoryId and
 * prerender resolveProductCategoryIdFull). Use this — never the raw category
 * field — when building internal links to a product detail page.
 */
export function resolveProductDetailCategorySlug(product: {
  id?: string;
  category?: string;
  categoryId?: string;
  name?: string;
  title?: string;
  description?: string;
}): string {
  const raw = String(product.categoryId || product.category || "").trim().toLowerCase();
  let normalized = PRODUCT_CATEGORY_PRIMARY_ALIASES[raw] || raw;
  if (normalized === "stroller") {
    const text = [product.name, product.title, product.category, product.description]
      .map((item) => String(item || "").toLowerCase())
      .join(" ");
    const hasStrollerSignal = /(stroller|pram|pushchair|buggy|jogger|jogging|travel\s+system|umbrella\s+stroller|double\s+stroller|twin\s+stroller|推车|婴儿车|慢跑推车|双人推车)/i.test(text);
    const hasCarSeatSignal = /(\bcar\s*seat\b|\bbooster\s*seat\b|\bconvertible\s*car\s*seat\b|\binfant\s*car\s*seat\b|安全座椅|提篮座椅)/i.test(text);
    const hasHighChairSignal = /(\bhigh\s*chair\b|feeding\s*chair|餐椅)/i.test(text);
    const hasPlayardSignal = /(\bplayard\b|\bplay\s*yard\b|\bpack\s*(n|and)\s*play\b|围栏床|游戏床)/i.test(text);
    const hasCarrierSignal = /(\bbaby\s*carrier\b|carrier\s*wrap|hip\s*seat\s*carrier|\bsling\b|背带)/i.test(text);
    const hasNurserySignal = /(\bmattress\b|\bcrib\b|\bbassinet\b|\bbaby\s*swing\b|\bswings\s*for\s*infants\b|\brocker\b|\bbouncer\b|\bsoother\b|\bplaypen\b|\bdiaper\b|\bbottle\s*warmer\b|\bbreast\s*pump\b|\bnursery\b|床垫|婴儿床|摇椅|秋千|安抚椅|尿布|奶瓶加热)/i.test(text);
    if (hasCarSeatSignal && !hasStrollerSignal) normalized = "car_seat";
    else if (hasHighChairSignal && !hasStrollerSignal) normalized = "high_chair";
    else if (hasPlayardSignal && !hasStrollerSignal) normalized = "playard";
    else if (hasCarrierSignal && !hasStrollerSignal) normalized = "baby_carrier";
    else if (hasNurserySignal && !hasStrollerSignal) normalized = "playard";
  }
  return productDetailUrlSlug(normalized, String(product.id || ""));
}
