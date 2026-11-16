/**
 * Editorial enrichment for four published news articles.
 *
 * WHY THIS EXISTS
 * ---------------
 * GSC's 2026-11-13 export shows nine news articles but impressions on only one
 * detail page (the October brand roundup). Round 1 treated the two thinnest —
 * the Strider/Kellys announcement and the child-safety-seat primer. Round 2
 * adds the only indexed article (the October brand roundup) and the research
 * piece, whose two cited studies carry the strongest "industry leadership"
 * material on the site. Each gets an at-a-glance panel, a comparison grid,
 * a study/age visual and a source note.
 *
 * The 2026-11-16 CMS write lengthened all four BODIES as well; these panels
 * restate that prose in scannable form and never introduce a fact it omits.
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
  "balance-bike-brand-news-october-2026",
  "balance-bike-research",
  "new-balance-bikes-2026",
  "kids-electric-bike-development-trends-2026",
  "ride-on-safety-standards-2026",
  "foldable-electric-scooter-brands-worldwide",
  "electric-dirt-bikes-for-kids",
] as const;

export type EnrichedNewsSlug = (typeof ENRICHED_NEWS_SLUGS)[number];

export function isEnrichedNewsSlug(slug: string): slug is EnrichedNewsSlug {
  return (ENRICHED_NEWS_SLUGS as readonly string[]).includes(slug);
}
