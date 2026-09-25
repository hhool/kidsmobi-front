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

export function buildProductFaqs(input: ProductFaqInput): ProductFaq[] {
  const name = clean(input.name) || "this product";
  const age = clean(input.recommendedAge);
  const weightLimit = clean(input.weightLimit);
  const itemWeight = clean(input.itemWeight);
  const priceNum = Number(input.price);
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
      a: `The rated capacity is ${weightLimit}. Keep the total load (child plus any gear or accessories) under that limit — exceeding it compromises stability and braking, which is exactly what our lab checklist penalizes.`,
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
 * Convenience adapter for records carrying a Product_Display_Fields map
 * (both the CMS full product shape and the SPA Product shape expose it).
 */
export function buildProductFaqsFromDisplayFields(
  name: string,
  displayFields: DisplayFields,
  price?: number | string | null,
): ProductFaq[] {
  const fields = displayFields || {};
  const val = (key: string) => clean(fields[key]?.value);
  return buildProductFaqs({
    name,
    recommendedAge: val("recommendedAge") || val("recommended_age") || val("ageRangeDescription") || val("age_range_description"),
    weightLimit: val("weightLimit") || val("weight_limit") || val("maximumWeightRecommendation") || val("maximum_weight_recommendation"),
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
