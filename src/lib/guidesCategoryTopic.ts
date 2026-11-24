/**
 * Guides category axis (/guides/<category>[/<topic>]) — single source of truth.
 *
 * The guide library has always been filterable on TWO axes, but only the topic
 * axis had a URL: /guides/<topic>/ has shipped since R46 while the category
 * filter (the wizard chips and the library's own category tiles) only ever
 * mutated React state. Clicking a chip changed the visible list but left the
 * address bar on /guides, so a refresh lost the view, a share could not
 * reproduce it, and no crawler could see the filtered document.
 *
 * This module gives the category axis real addresses:
 *
 *   /guides/<category>/             category-narrowed library
 *   /guides/<category>/<topic>/     both axes at once
 *   + the /zh prefix for the Chinese edition
 *
 * ROUTING SAFETY — the two segment vocabularies are disjoint on purpose.
 * /guides/<a>/<b> was already occupied by article detail URLs
 * (/guides/<topic>/<slug>). No topic id is also a category id, so the first
 * segment decides the route family with no ambiguity:
 *
 *   first segment in TOPIC ids    -> article detail (existing behaviour)
 *   first segment in CATEGORY ids -> category or composite channel (new)
 *
 * Keep CATEGORY_IDS exactly equal to the CMS taxonomy.productCategory values
 * the guide records actually carry. Two vocabularies coexist in this codebase
 * (guides use the short ids below, the product layer uses balance_bike /
 * kids_bikes / ...), and comparing them directly once made every chip except
 * stroller match zero guides — see PRODUCT_CATEGORY_LABELS in
 * GuidesSection.tsx. Everything in this file speaks the GUIDE vocabulary.
 *
 * Consumers:
 *   - src/App.tsx                    (route parsing, click navigation)
 *   - src/components/GuidesSection.tsx (chip + tile hrefs)
 *   - scripts/prerender-pages.ts     (static pages, sitemap)
 *   - scripts/check-guides-composite.mjs (guard)
 */

import { GUIDES_TOPIC_PAGE_IDS, type GuidesTopicPageId } from "./guidesTopicPages";

/**
 * The topic ids a URL may carry. SEVEN, not six.
 *
 * `GUIDES_TOPIC_PAGE_IDS` (six) answers a different question — "which topic
 * CHANNEL pages get built at /guides/<topic>" — and `best` is deliberately not
 * one of them: the best-of articles are a commercial cluster with no channel
 * index, so `guideChannelPageId()` returns null for it and the breadcrumbs skip
 * it. Reusing that list as the routing vocabulary was therefore wrong in a way
 * nobody saw until the category axis arrived: `best` holds 11 of the 68 live
 * guides, and /guides/stroller/best/ parsed as "category stroller + article slug
 * best" instead of "category stroller + topic best", landing on the soft-404
 * branch. The CMS taxonomy is the authority for what a topic id is; the channel
 * list is the authority for which ones have an index page.
 */
export const GUIDE_TOPIC_IDS = [
  "beginner",
  "scenario",
  "budget",
  "risk",
  "special",
  "maintenance",
  "best",
] as const;

export type GuideTopicId = (typeof GUIDE_TOPIC_IDS)[number];

/**
 * Tile labels (the button faces in the guide library).
 *
 * These are UI nouns, not sentence fragments: "Beginner Entry" reads fine on a
 * chip and wrong in prose ("guides on beginner entry"). Anything that composes
 * a sentence uses GUIDE_TOPIC_PLAIN_LABELS below instead.
 */
export const GUIDE_TOPIC_LABELS: Record<GuideTopicId, { en: string; zh: string }> = {
  beginner: { en: "Beginner Entry", zh: "新手入门" },
  scenario: { en: "Scenario Guide", zh: "场景指南" },
  budget: { en: "Budget Guide", zh: "预算指南" },
  risk: { en: "Risk ID Guide", zh: "风险甄别" },
  special: { en: "Category Special", zh: "品类专项" },
  maintenance: { en: "Maintenance", zh: "养护清单" },
  best: { en: "2026 Best Picks", zh: "年度精选" },
};

/**
 * The same seven topics as sentence-ready phrases (lowercase, no UI chrome).
 *
 * Used wherever a label is dropped into a sentence: page headings, meta
 * descriptions, intros. Kept beside the tile labels so a topic can never be
 * added to one list and forgotten in the other — TypeScript's Record ensures
 * both stay complete.
 */
export const GUIDE_TOPIC_PLAIN_LABELS: Record<GuideTopicId, { en: string; zh: string }> = {
  beginner: { en: "first-time buying", zh: "新手入门" },
  scenario: { en: "picking for a real scenario", zh: "场景化选购" },
  budget: { en: "buying on a budget", zh: "预算选购" },
  risk: { en: "safety and recall risk", zh: "安全与风险" },
  special: { en: "unusual sizes and niche needs", zh: "特殊尺寸与细分需求" },
  maintenance: { en: "care and maintenance", zh: "养护与维护" },
  best: { en: "the current best picks", zh: "当下的精选榜单" },
};

/**
 * Single-word topic nouns, for composing a heading or <title>.
 *
 * The tile labels above are already phrases ("Scenario Guide", "Risk ID
 * Guide"), so using them as a modifier produced "Baby Stroller Scenario Guide
 * Guides". A title needs the bare noun: this list supplies it, and the page
 * builders append "Guides"/"指南" exactly once.
 */
export const GUIDE_TOPIC_NOUN: Record<GuideTopicId, { en: string; zh: string }> = {
  beginner: { en: "Beginner", zh: "新手入门" },
  scenario: { en: "Scenario", zh: "场景" },
  budget: { en: "Budget", zh: "预算" },
  risk: { en: "Safety & Risk", zh: "安全与风险" },
  special: { en: "Special-Fit", zh: "专项" },
  maintenance: { en: "Maintenance", zh: "养护" },
  best: { en: "Best Picks", zh: "年度精选" },
};

/** Guide-side category ids. Mirrors CMS taxonomy.productCategory verbatim. */
export const GUIDE_CATEGORY_IDS = ["stroller", "balance", "bicycle", "scooter", "electric_car"] as const;

export type GuideCategoryId = (typeof GUIDE_CATEGORY_IDS)[number];

export const GUIDE_CATEGORY_LABELS: Record<GuideCategoryId, { en: string; zh: string }> = {
  stroller: { en: "Baby Stroller", zh: "婴儿推车" },
  balance: { en: "Balance Bike", zh: "滑步平衡车" },
  bicycle: { en: "Kids Bike", zh: "儿童自行车" },
  scooter: { en: "Kids Scooter", zh: "儿童滑板车" },
  electric_car: { en: "Electric Car", zh: "儿童电动车" },
};

const CATEGORY_ID_SET: ReadonlySet<string> = new Set(GUIDE_CATEGORY_IDS);
const TOPIC_ID_SET: ReadonlySet<string> = new Set<string>(GUIDE_TOPIC_IDS);

/**
 * Minimum published articles for a composite page to be indexable.
 *
 * A composite page lists the intersection of one category and one topic, and
 * the live library is very uneven: stroller×scenario holds 9 articles while
 * 19 of the 35 combinations hold exactly one. Publishing all 35 × 2 languages
 * as indexable URLs would add 70 thin pages to a site whose stroller guides
 * are still only ~20% indexed (GSC, 2026-11-24), spending crawl budget on
 * documents that cannot rank. Below the threshold the page still EXISTS — the
 * address is shareable and the back button works — but it self-canonicalises
 * to its parent topic page and carries robots noindex, so it never competes
 * with the pages that do have depth.
 *
 * Promote a combination by adding articles; the flag is derived at build time
 * from the live record counts, never hand-maintained.
 */
export const COMPOSITE_INDEX_THRESHOLD = 3;

/** True when the string is one of the guide category ids. */
export function isGuideCategoryId(value: unknown): value is GuideCategoryId {
  return CATEGORY_ID_SET.has(String(value || "").trim().toLowerCase());
}

/** True when the string is one of the guides topic ids (all seven). */
export function isGuideTopicId(value: unknown): value is GuideTopicId {
  return TOPIC_ID_SET.has(String(value || "").trim().toLowerCase());
}

/**
 * @deprecated Kept for existing call sites. Prefer isGuideTopicId(), which is
 * the routing question ("can this segment be a topic?"). This one is also true
 * for `best`, so it no longer means "has a channel page" — use
 * guideChannelPageId() in the prerender for that.
 */
export function isGuidesTopicId(value: unknown): value is GuideTopicId {
  return isGuideTopicId(value);
}

export interface GuidesRouteMatch {
  /** Category segment when the route carries one, else "". */
  category: GuideCategoryId | "";
  /** Topic segment when the route carries one, else "". */
  topic: GuideTopicId | "";
  /** Article slug on a detail route, else "". */
  articleSlug: string;
}

/**
 * Classify /guides/<a>/<b>/... segments.
 *
 * Returns null when the segments are not a guides channel at all (the caller
 * keeps its own article/detail fallbacks). A first segment that is neither a
 * topic nor a category is left to the caller: it is an article id written
 * without its topic (the legacy /guides/<slug> form), which the SPA resolves
 * by lookup.
 *
 * TOPIC BEFORE CATEGORY in both positions. The two vocabularies are disjoint
 * (no string is both), so order does not decide the outcome — but `best` is a
 * topic that has NO channel page, and it must still be recognised as a topic
 * here, otherwise /guides/stroller/best/ decodes as category + article slug and
 * every best-of article loses its composite listing. Routing vocabulary and
 * channel-page vocabulary are two different questions; see GUIDE_TOPIC_IDS.
 */
export function matchGuidesChannelRoute(segments: string[]): GuidesRouteMatch | null {
  const [first = "", second = "", third = ""] = segments;

  // /guides — no axis selected.
  if (!first) return { category: "", topic: "", articleSlug: "" };

  // /guides/<topic> — topic channel (existing).
  if (isGuideTopicId(first)) {
    return { category: "", topic: first, articleSlug: second || third || "" };
  }

  // /guides/<category> — category channel (new).
  if (isGuideCategoryId(first)) {
    const category = first as GuideCategoryId;
    if (!second) return { category, topic: "", articleSlug: "" };
    // /guides/<category>/<topic> — composite channel (new).
    if (isGuideTopicId(second)) {
      return { category, topic: second, articleSlug: third || "" };
    }
    // /guides/<category>/<slug> is NOT a route family: category channels have
    // no article layer (articles live under their topic). Treat the second
    // segment as an article slug so the miss surfaces as a soft 404 instead of
    // silently rendering the category list.
    return { category, topic: "", articleSlug: second };
  }

  // /guides/<slug> — legacy article id without a topic segment.
  return { category: "", topic: "", articleSlug: first };
}

/** "/guides/<category>/" for an English route. */
export function guidesCategoryPath(category: GuideCategoryId | ""): string {
  return category ? `/guides/${category}/` : "/guides";
}

/**
 * "/guides/<category>/<topic>/" for an English route. Falls back to whichever
 * single axis is set so callers can use one builder for all three shapes.
 */
export function guidesCompositePath(
  category: GuideCategoryId | "",
  topic: GuideTopicId | "",
): string {
  if (category && topic) return `/guides/${category}/${topic}/`;
  if (category) return `/guides/${category}/`;
  if (topic) return `/guides/${topic}/`;
  return "/guides";
}

/**
 * The URL a click should push for the current pair of filters.
 *
 * `topic` is only meaningful together with a category: a bare topic already
 * has its own channel page, so /guides/<topic>/ is the canonical shape there.
 */
export function guidesFilterPath(
  category: GuideCategoryId | "",
  topic: GuideTopicId | "",
): string {
  return guidesCompositePath(category, topic);
}

/** Both axes set — the only shape that is a "composite" channel. */
export function isCompositeChannel(category: string, topic: string): boolean {
  return Boolean(category && topic);
}

/**
 * Whether a topic has its own channel page at /guides/<topic>.
 *
 * Six of the seven do. `best` does not — the best-of articles are a commercial
 * cluster with no index page, and no Chinese topic page is built at all — so a
 * composite page whose topic is `best` cannot self-canonicalise to a parent
 * topic page that exists. It canonicalises to /guides instead (the library
 * index, which lists every article). Keep this the single test for "does the
 * parent exist", so the prerender's canonical choice cannot drift from the
 * channel-page build.
 */
export function hasTopicChannelPage(topic: string): boolean {
  return (GUIDES_TOPIC_PAGE_IDS as readonly string[]).includes(String(topic || "").trim());
}