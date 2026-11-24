/**
 * Composite channel pages (/guides/<category>/<topic>/) — head copy, single
 * source.
 *
 * WHY THIS MODULE EXISTS
 * ----------------------
 * A composite page is the intersection of one product category and one topic:
 * "Baby Stroller × Beginner Entry". It renders in two places that must publish
 * the same thing:
 *
 *   - scripts/prerender-pages.ts  -> the static HTML a crawler reads
 *   - src/components/GuidesSection.tsx -> the hydrated SPA a reader sees
 *
 * main.tsx mounts with createRoot().render(), so the prerendered DOM inside
 * #root is discarded on hydration. Anything the static page claims about
 * itself (h1, title, description) has to be re-rendered by React, or the two
 * views disagree — and the crawler's copy is the one that got indexed.
 *
 * /guides/<topic> and /guides/<category> already had their copy in
 * guidesTopicPages.ts and the SPA's own chip labels. The composite shape had
 * none, so it lives here and both renderers import it.
 *
 * COPY RULES
 * ----------
 * Authored from the two axes, never from the records: a page's heading is not
 * allowed to change because an article was added yesterday. The counts DO
 * change and are rendered separately, as a fact ("4 guides"), so the prose
 * stays stable while the number stays honest.
 *
 * No keyword stuffing: the title repeats the category and the topic because
 * that is the query, and nothing else is repeated for its own sake.
 */

import {
  GUIDE_CATEGORY_LABELS,
  GUIDE_TOPIC_NOUN,
  GUIDE_TOPIC_PLAIN_LABELS,
  type GuideCategoryId,
  type GuideTopicId,
} from "./guidesCategoryTopic";

export interface GuidesCompositeCopy {
  /** Visible <h1>. */
  h1: string;
  /** Full <title> (already carries the brand suffix, <= 60 chars). */
  fullTitle: string;
  /** Meta description (<= 155 chars). */
  description: string;
  /** Heading over the article list. */
  listHeading: string;
  /** One paragraph under the h1, naming what the page narrows. */
  intro: string;
}

/** Topic-specific angle, so 35 pages are not the same sentence reshuffled. */
const TOPIC_ANGLE: Record<GuideTopicId, { en: string; zh: string }> = {
  beginner: {
    en: "starting from a first purchase: what fit, standards and features to check before anything is added to a shortlist.",
    zh: "从第一次购买开始：在把任何型号放进候补名单之前，先确认尺寸、标准与功能。",
  },
  scenario: {
    en: "matched to a real routine — the school run, a park afternoon, a flight — rather than to a best-case demo.",
    zh: "按真实使用路线来选——接送、公园半天、一次飞行——而不是按演示环境来选。",
  },
  budget: {
    en: "sorted by what each price tier actually buys, and where the cheap option stops being safe.",
    zh: "按每个价位真正买到什么来排序，以及便宜的那一档从哪里开始不安全。",
  },
  risk: {
    en: "covering recalls, standard coverage and the pre-ride checks that catch a failure before it matters.",
    zh: "覆盖召回、标准符合情况，以及能在问题发生前发现故障的骑行前检查。",
  },
  maintenance: {
    en: "keeping brakes, tyres and joints working through the seasons instead of replacing the product early.",
    zh: "让刹车、轮胎与连接件跨季度保持工作状态，而不是提前换新。",
  },
  special: {
    en: "for the cases the general guides skip: unusual sizes, adaptive needs and niche configurations.",
    zh: "讲通用指南跳过的情况：特殊尺寸、适配需求与细分配置。",
  },
  best: {
    en: "the shortlist a buyer can act on now, and the reason each pick holds its place.",
    zh: "当下就能照着买的候补名单，以及每一个入选型号排在那里的理由。",
  },
};

/**
 * Copy for one composite page.
 *
 * The <title> budget is 60 characters INCLUDING the 22-char brand suffix, so
 * the trunk only has ~36 to work with. "Baby Stroller Beginner Guides" (31) fits
 * with room for the suffix; "Kids Scooter Maintenance Guides" (33) also fits.
 * Longer pairs ("Baby Stroller Maintenance Guides", 33) still fit — the cap in
 * documentTitle.ts is the backstop, not the first resort.
 */
export function buildGuidesCompositeCopy(
  category: GuideCategoryId,
  topic: GuideTopicId,
  lang: "en" | "zh",
): GuidesCompositeCopy {
  const categoryLabel = GUIDE_CATEGORY_LABELS[category][lang];
  // Bare noun for the <h1>/<title>; plain phrase when the label sits in prose.
  // GUIDE_TOPIC_LABELS is deliberately NOT used here: it is the tile face
  // ("Scenario Guide"), and as a modifier it produced "Scenario Guide Guides".
  const topicNoun = GUIDE_TOPIC_NOUN[topic][lang];
  const topicPlain = GUIDE_TOPIC_PLAIN_LABELS[topic][lang];
  const angle = TOPIC_ANGLE[topic][lang];

  if (lang === "zh") {
    return {
      h1: `${categoryLabel}${topicNoun}指南`,
      fullTitle: `${categoryLabel}${topicNoun}指南 | BalanceBikeToddler`,
      description: `${categoryLabel}选购指南·${topicPlain}：${angle}`.slice(0, 155),
      listHeading: `${categoryLabel} · ${topicNoun} 收录的文章`,
      intro: `这一页只列「${categoryLabel}」与「${topicPlain}」同时成立的文章：${angle}`,
    };
  }

  return {
    h1: `${categoryLabel} ${topicNoun} Guides`,
    fullTitle: `${categoryLabel} ${topicNoun} Guides | BalanceBikeToddler`,
    description: `${categoryLabel} guides on ${topicPlain} — ${angle}`.slice(0, 155),
    listHeading: `${categoryLabel} guides on ${topicPlain}`,
    intro: `This page narrows the ${categoryLabel.toLowerCase()} guides to one question — ${topicPlain}: ${angle}`,
  };
}

/**
 * Copy for a bare category channel (/guides/<category>/).
 *
 * Same reasoning as above: the category axis shipped without a static page, so
 * a reader who clicked a chip landed on the library with an URL that described
 * a narrower scope than the page showed. This gives that URL its own heading.
 */
export function buildGuidesCategoryCopy(
  category: GuideCategoryId,
  lang: "en" | "zh",
): { h1: string; fullTitle: string; description: string; intro: string } {
  const label = GUIDE_CATEGORY_LABELS[category][lang];

  if (lang === "zh") {
    return {
      h1: `${label}选购指南`,
      fullTitle: `${label}选购指南 | BalanceBikeToddler`,
      description: `按${label}分类的全部指南：尺寸与年龄适配、安全标准、预算分级、养护与风险核查，每篇都标注适用范围。`.slice(0, 155),
      intro: `这里收录全部${label}相关的指南，按话题分组，从第一次选购到日常养护都能顺着读下去。`,
    };
  }

  return {
    h1: `${label} Buying Guides`,
    fullTitle: `${label} Buying Guides | BalanceBikeToddler`,
    description: `Every ${label.toLowerCase()} guide in one place: sizing and age fit, safety standards, budget tiers, care and risk checks, each labelled with the age range it applies to.`.slice(0, 155),
    intro: `Every ${label.toLowerCase()} guide on the site, grouped by topic — from a first purchase through to care and inspection.`,
  };
}