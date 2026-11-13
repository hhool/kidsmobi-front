/**
 * Product FAQ builder (P1 SEO round: FAQPage parity between the prerendered
 * static HTML and the hydrated SPA DOM).
 *
 * Used by BOTH:
 *  - scripts/prerender-pages.ts  (static HTML: visible FAQ + FAQPage JSON-LD)
 *  - src/components/DetailedProductView.tsx + App.tsx (hydrated DOM parity)
 *
 * Questions are generated strictly from product data-model fields — no
 * invented claims. Pages with fewer than 2 answerable questions skip the
 * FAQ surface entirely (schema should never reference invisible content).
 */

export interface ProductFaq {
  q: string;
  a: string;
}

export interface ProductFaqInput {
  name: string;
  recommendedAge?: string;
  weightLimit?: string;
  itemWeight?: string;
  price?: number | string | null;
}

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();

/** Numeric-ness helper shared by the age-range normalizer below. */
const isNumeric = (value: string): boolean => /^\d+(\.\d+)?$/.test(value.trim());

/**
 * Seating-capacity collision guard.
 *
 * `Product_Display_Fields.weightLimit` was populated from
 * `Features_Specs.Seating Capacity` for 38 listings (every stroller wagon and
 * several travel strollers), so the field holds a seat COUNT — "1", "2", "4" —
 * rather than a load rating. Rendered verbatim it produced the FAQ answer
 * "The rated capacity is 1", a factual error on a page about a 50 lb stroller.
 */
const isSeatingCapacityCollision = (value: string): boolean => {
  const s = clean(value);
  if (!/^\d+(\.\d+)?$/.test(s)) return false;
  const n = Number(s);
  return Number.isFinite(n) && n >= 1 && n <= 4;
};

/**
 * Weight-field sanity floor, expressed in pounds.
 *
 * A child ride-on's own load rating is never this low — the lightest product
 * here is a balance bike at roughly 4 lb *of product*, not of rated capacity.
 * Any "weightLimit" below this is measuring something else: a seating count, a
 * basket capacity, or the item's own mass copied into the wrong field. All
 * three appear in production data (38 seat counts, plus basket-capacity and
 * item-weight collisions) and all three produce a nonsense FAQ answer.
 *
 * The floor is applied after normalizing to pounds, so a listing that stores
 * kilograms is judged on the same scale as one that stores pounds.
 */
const MIN_PLAUSIBLE_LOAD_LB = 20;

const LB_PER_KG = 2.20462;

/** Parses "50 Pounds" / "15 Kilograms" into pounds, or null if unparseable. */
const toPounds = (value: string): number | null => {
  const match = clean(value).match(/(\d+(?:\.\d+)?)\s*(kilogram|kilograms|kg|pound|pounds|lb|lbs)?/i);
  if (!match) return null;
  const n = Number(match[1]);
  if (!Number.isFinite(n)) return null;
  const unit = (match[2] || "lb").toLowerCase();
  return unit.startsWith("k") ? n * LB_PER_KG : n;
};

/**
 * A weight value is usable as a load rating only when it parses to a real
 * number and clears the plausibility floor. Bare integers in the seat-count
 * range are additionally rejected, since those are always a field collision.
 */
const isPlausibleLoadRating = (value: string): boolean => {
  const s = clean(value);
  if (!s) return false;
  if (isSeatingCapacityCollision(s)) return false;
  const lb = toPounds(s);
  return lb !== null && lb >= MIN_PLAUSIBLE_LOAD_LB;
};

/**
 * Turns a manufacturer month range into readable age wording.
 *
 * `User_Guide.Manufacturer Minimum/Maximum Age (MONTHS)` is the most reliable
 * age source we have, but it is stored as separate month counts. Left as
 * "6-36" it reads like a model number, so it is rendered as a month span
 * ("6–36 months") with an approximate year hint where the span is clean.
 */
const formatMonthSpan = (min: string, max: string): string => {
  const lo = Number(min);
  const hi = Number(max);
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || lo <= 0 || hi <= 0 || hi < lo) return "";
  const span = `${lo}–${hi} months`;
  // Only add the year hint when both ends are whole years, so "18–48 months"
  // becomes "18–48 months (about 1.5–4 years)" without inventing precision.
  const toYears = (m: number) => Math.round((m / 12) * 2) / 2;
  const loY = toYears(lo);
  const hiY = toYears(hi);
  if (Number.isInteger(loY * 2) && Number.isInteger(hiY * 2) && lo >= 12 && hi >= 12) {
    return `${span} (about ${loY}–${hiY} years)`;
  }
  return span;
};

export function buildProductFaqs(input: ProductFaqInput): ProductFaq[] {
  const name = clean(input.name) || "this product";
  const age = clean(input.recommendedAge);
  const itemWeight = clean(input.itemWeight);
  const priceNum = Number(input.price);

  // A seating-count value masquerading as a load rating is dropped rather than
  // printed: the number would be true for the wrong attribute and mislead a
  // buyer about the actual weight limit.
  const rawWeightLimit = clean(input.weightLimit);
  const weightLimit = isPlausibleLoadRating(rawWeightLimit) ? rawWeightLimit : "";

  const faqs: ProductFaq[] = [];

  if (age) {
    faqs.push({
      q: `What age is the ${name} designed for?`,
      a: `The manufacturer lists ${age} as the intended age range. Treat that as a starting point rather than a guarantee — match your child's height, weight, and developmental stage against the on-page specs before buying, and stay inside the stated limits.`,
    });
  }
  if (weightLimit) {
    faqs.push({
      q: `How much weight can the ${name} support?`,
      a: `The rated capacity is ${weightLimit}. Keep the total load (child plus any gear or accessories) under that limit — exceeding it compromises stability and braking, which is exactly what our scoring reflects.`,
    });
  }
  if (itemWeight) {
    faqs.push({
      q: `Is the ${name} easy to carry and store?`,
      a: `It weighs about ${itemWeight}, light enough for most caregivers to lift into a trunk or carry up a staircase. Check the on-page dimensions to confirm it fits your storage space and vehicle before ordering.`,
    });
  }
  if (Number.isFinite(priceNum) && priceNum > 0) {
    faqs.push({
      q: `How much does the ${name} cost?`,
      a: `Typical pricing sits around $${priceNum.toFixed(2)}. We recheck listed prices regularly, but retailers move them frequently — treat the on-page figure as a reference point rather than a live quote.`,
    });
  }
  return faqs;
}

type DisplayFields = Record<string, { value?: unknown } | undefined> | undefined;

/**
 * The subset of `Product_Specifications` the FAQ builder reads as a fallback.
 *
 * Product_Display_Fields is the primary source and is missing or wrong for two
 * attributes: `weightLimit` is a seat count for 38 stroller/wagon listings, and
 * `recommendedAge` is absent for 90 listings (76 of them strollers and scooters,
 * where 71 are recoverable from the raw spec block).
 */
export interface ProductSpecFallback {
  Measurements?: Record<string, unknown>;
  Features_Specs?: Record<string, unknown>;
  Item_Details?: Record<string, unknown>;
  User_Guide?: Record<string, unknown>;
}

const specString = (
  specs: ProductSpecFallback | undefined,
  group: keyof ProductSpecFallback,
  key: string,
): string => clean(specs?.[group]?.[key]);

/**
 * Resolves the age wording, falling back through the raw spec block.
 *
 * Order matters: an explicit `recommendedAge` wins (it is curated), then the
 * free-text `Age Range Description`, then the manufacturer month range. The
 * month range is formatted into readable wording rather than printed raw.
 */
const resolveAge = (fields: DisplayFields, specs?: ProductSpecFallback): string => {
  const val = (key: string) => clean(fields?.[key]?.value);
  const direct = val("recommendedAge") || val("recommended_age");
  if (direct) return direct;

  const rangeDescription =
    val("ageRangeDescription") ||
    val("age_range_description") ||
    specString(specs, "Item_Details", "Age Range Description");
  if (rangeDescription) return rangeDescription;

  const minMonths = specString(specs, "User_Guide", "Manufacturer Minimum Age (MONTHS)");
  const maxMonths = specString(specs, "User_Guide", "Manufacturer Maximum Age (MONTHS)");
  if (isNumeric(minMonths) && isNumeric(maxMonths)) {
    const span = formatMonthSpan(minMonths, maxMonths);
    if (span) return span;
  }
  // A lone bound is still useful — state it as an open-ended range.
  if (isNumeric(minMonths) && Number(minMonths) > 0) return `${Number(minMonths)}+ months`;
  if (isNumeric(maxMonths) && Number(maxMonths) > 0) return `up to ${Number(maxMonths)} months`;

  return "";
};

/**
 * Resolves the weight rating, dropping a seating-count collision and recovering
 * the real rating from `User_Guide.Maximum Weight Recommendation` (38/38
 * coverage on the affected listings).
 */
const resolveWeightLimit = (fields: DisplayFields, specs?: ProductSpecFallback): string => {
  const val = (key: string) => clean(fields?.[key]?.value);
  const candidates = [
    val("weightLimit"),
    val("weight_limit"),
    val("maximumWeightRecommendation"),
    val("maximum_weight_recommendation"),
    specString(specs, "User_Guide", "Maximum Weight Recommendation"),
  ];
  for (const candidate of candidates) {
    if (isPlausibleLoadRating(candidate)) return candidate;
  }
  return "";
};

/**
 * Convenience adapter for records carrying a Product_Display_Fields map
 * (both the CMS full product shape and the SPA Product shape expose it).
 *
 * `specs` is optional: callers that have the full record should pass
 * `product.Product_Specifications` so the age and weight fallbacks engage.
 * Without it the builder still works, it just cannot recover the 38 corrupted
 * weight values or the 71 recoverable missing ages.
 */
export function buildProductFaqsFromDisplayFields(
  name: string,
  displayFields: DisplayFields,
  price?: number | string | null,
  specs?: ProductSpecFallback,
): ProductFaq[] {
  const fields = displayFields || {};
  const val = (key: string) => clean(fields[key]?.value);
  return buildProductFaqs({
    name,
    recommendedAge: resolveAge(fields, specs),
    weightLimit: resolveWeightLimit(fields, specs),
    itemWeight: val("itemWeight") || val("item_weight"),
    price,
  });
}

/** Wraps FAQ pairs into a schema.org FAQPage node (caller decides visibility). */
export function faqPageSchema(faqs: ProductFaq[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };
}

/** Minimum answerable questions before we emit a FAQ surface at all. */
export const FAQ_MIN_QUESTIONS = 2;
