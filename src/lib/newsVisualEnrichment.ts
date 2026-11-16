/**
 * Editorial enrichment for the two thinnest published news articles.
 *
 * WHY THIS EXISTS
 * ---------------
 * GSC's 2026-11-13 export shows nine news articles but impressions on only one
 * detail page (the October brand roundup). The two thinnest — the Strider/Kellys
 * announcement (195 EN words) and the child-safety-seat primer (264 EN words) —
 * had zero impressions and read like wire copy: a short prose block, one cover,
 * no scannable structure. This module adds an industry-leadership treatment:
 * key-fact cards, a spec grid, a stage ladder and a source note.
 *
 * GROUNDING RULE
 * --------------
 * Every figure and claim below is a restatement of a fact ALREADY in that
 * article's published CMS body. Nothing is added from memory, inference or a
 * third-party source. The source note says so on the page. The honesty guard
 * (scripts/check-honesty-claims.ts) scans the rendered dist, and the dedicated
 * scripts/check-news-enrichment.ts asserts this module cannot drift from the
 * CMS snapshot it quotes.
 *
 * FREEZE-SAFE: this is body markup only. No title, description, canonical,
 * og tag or JSON-LD is touched — those continue to come from the CMS record.
 *
 * Rendered by BOTH renderers from the same HTML string: prerender-pages.ts
 * injects it into the static body, NewsSection.tsx injects the identical string
 * through dangerouslySetInnerHTML so createRoot() cannot wipe the static block.
 */
import { renderNewsVisualEnrichmentHtml } from "./newsVisualEnrichmentHtml";

export { renderNewsVisualEnrichmentHtml };

/** Slugs promoted to the editorial treatment, with their assertion anchors. */
export const ENRICHED_NEWS_SLUGS = [
  "strider-bikes-kellys-juvenile-models",
  "choosing-and-using-child-safety-seats",
] as const;

export type EnrichedNewsSlug = (typeof ENRICHED_NEWS_SLUGS)[number];

export function isEnrichedNewsSlug(slug: string): slug is EnrichedNewsSlug {
  return (ENRICHED_NEWS_SLUGS as readonly string[]).includes(slug);
}
