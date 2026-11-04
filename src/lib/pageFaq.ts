/**
 * The visible FAQ for the section pages that publish FAQPage schema.
 *
 * The G4 hard list (repos/wb-seo-teardown/references/technical-baseline-34.md,
 * row 17) asks that every schema question maps to a visible Q&A. Three pages
 * published FAQPage JSON-LD whose questions appeared NOWHERE in the rendered
 * text — the schema was the only place the questions existed, which is the
 * "invented entries" the row is written against.
 *
 * So the questions and their answers live HERE, once, and both renderers read
 * them:
 *
 *   - scripts/prerender-pages.ts      (the static HTML a crawler fetches)
 *   - src/components/AboutSection.tsx, NewsSection.tsx, EvaluationsSection.tsx
 *                                     (what a reader actually sees after
 *                                     hydration — the app mounts with
 *                                     createRoot(), so the SPA is the live
 *                                     page, not the prerendered one)
 *
 * The schema node is built from the same pairs that are rendered visibly, so
 * a question cannot be in the JSON-LD without being on the page. That is the
 * whole point: the two were written separately and drifted.
 */

/** One question and the answer shown under it. */
export interface PageFaq {
  q: string;
  a: string;
}

/**
 * /about — who is speaking and how a reader can check the work.
 *
 * The answers name the site's own practice (named sources, quotations, a
 * comparison table) rather than describing a generic editorial policy.
 */
export const ABOUT_FAQS: PageFaq[] = [
  {
    q: "Who wrote this page?",
    a: "It is written by the BalanceBikeToddler Editorial Team with published and updated dates attached.",
  },
  {
    q: "How can readers verify the content?",
    a: "The page provides source links, short quotations, and a table readers can compare directly against the product page.",
  },
  {
    q: "Why include dates and author information?",
    a: "Those fields help search systems and AI platforms understand freshness and accountability.",
  },
];

export const ABOUT_FAQS_ZH: PageFaq[] = [
  {
    q: "这篇页面是谁写的？",
    a: "由 BalanceBikeToddler 编辑团队撰写，并标注了发布与更新日期。",
  },
  {
    q: "读者如何核验这些内容？",
    a: "页面给出来源链接、原文引用，以及一张可直接与商品页面对照的表格。",
  },
  {
    q: "为什么要标注日期与作者信息？",
    a: "这些字段帮助搜索引擎与 AI 平台判断内容的新鲜度与责任归属。",
  },
];

/**
 * /news — what the page tracks, and why a story carries a source.
 */
export const NEWS_FAQS: PageFaq[] = [
  {
    q: "Which updates matter to families?",
    a: "The page tracks launches, standards, and industry changes that can alter what parents should buy or avoid.",
  },
  {
    q: "Which stories are most citable?",
    a: "The stories with named sources, clear dates, and concise summaries are easiest for readers and AI systems to cite.",
  },
  {
    q: "Why include a quote on the news page?",
    a: "A short attributed quote gives the page a source-backed sentence that crawlers can reuse with context.",
  },
];

export const NEWS_FAQS_ZH: PageFaq[] = [
  {
    q: "哪些更新与家庭真正相关？",
    a: "页面追踪新品发布、标准变化与行业动向——这些都可能改变家长的选购判断。",
  },
  {
    q: "哪些报道最容易被引用？",
    a: "有明确来源、清晰日期和简明摘要的报道，最便于读者与 AI 系统引用。",
  },
  {
    q: "为什么新闻页要放带出处的原话？",
    a: "一句带出处的短引文，能给页面留下一条有来源支撑、可被检索系统带上下文复用的句子。",
  },
];

/**
 * /reviews — how a verdict is defended and why it is dated.
 */
export const REVIEWS_FAQS: PageFaq[] = [
  {
    q: "How do reviews stay defensible?",
    a: "Each verdict is tied to a visible score, a named source, and a clear use case so readers can trace the judgment back to evidence.",
  },
  {
    q: "Which standards guide each verdict?",
    a: "The page uses FTC disclosure guidance, CPSC children's product context, and bicycle safety references to anchor the review language.",
  },
  {
    q: "Why add dates and author information?",
    a: "Dates and author attribution help readers and AI systems judge freshness and accountability.",
  },
];

export const REVIEWS_FAQS_ZH: PageFaq[] = [
  {
    q: "评测结论凭什么站得住？",
    a: "每条结论都对应可见的评分、具名来源与明确使用场景，读者可以顺着证据回溯判断。",
  },
  {
    q: "每条结论依据哪些标准？",
    a: "页面以 FTC 披露指引、CPSC 儿童产品合规背景与自行车安全标准来约束评测措辞。",
  },
  {
    q: "为什么要加日期与作者信息？",
    a: "日期与署名帮助读者与 AI 系统判断内容的新鲜度与责任归属。",
  },
];

/**
 * The FAQ set for a section route, or undefined when the route publishes none.
 *
 * The route keys are the prerender's own routes (`/about`, `/news`,
 * `/reviews`). The Chinese editions of those pages (/zh/news exists,
 * /zh/about and /zh/reviews do not) publish their own schema, so they are
 * not served from here.
 */
export function sectionFaqsFor(
  route: string,
  lang: "en" | "zh" = "en",
): PageFaq[] | undefined {
  if (route === "/about") return lang === "zh" ? ABOUT_FAQS_ZH : ABOUT_FAQS;
  if (route === "/news") return lang === "zh" ? NEWS_FAQS_ZH : NEWS_FAQS;
  if (route === "/reviews") return lang === "zh" ? REVIEWS_FAQS_ZH : REVIEWS_FAQS;
  return undefined;
}
