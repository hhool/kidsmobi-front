/**
 * /kids-scooter-what-buyers-say/ — the retailer summaries, counted.
 *
 * The catalogue holds no verbatim reviews, so this page reports what it does
 * hold: one retailer-written sentiment summary per listing (the `customersSay`
 * field), all 7 present and all 7 distinct texts.
 *
 * What makes this dataset different from the balance-bike and kids-bike
 * equivalents is that the ratings here were recoverable. product.rating and
 * product.reviews are 0 for all 7 rows, but the scraped listing text carries
 * "4.8 out of 5 stars (33,672)" inside Item_Details, so 6 of 7 listings have a
 * star rating, a review count and a Best Sellers Rank. Those are reported as the
 * retailer's figures with their provenance stated up front, never as this site's
 * own ratings and never blended with the summary counts.
 *
 * Theme counting uses fixed literal phrase lists, kept in this file so the
 * counts are reproducible by grep — the same discipline the other review pages
 * in this repo use. A summary that praises both weight and build quality counts
 * once under each, so theme counts are mentions, not sentiment scores.
 */
import { Megaphone, Quote, ThumbsUp, Table2 } from "lucide-react";
import { SCOOTER_DATASET } from "./scooterData.generated";
import { rosterLabel, type ScooterColumn } from "../components/ScooterAssetPage";

export { SCOOTER_DATASET };
export const KIDS_SCOOTER_FEEDBACK_PATH = "/kids-scooter-what-buyers-say/";

const d = SCOOTER_DATASET;
const total = d.totals.kidsScooters;

/**
 * Fixed literal phrase lists. Changing a list changes every count on the page,
 * so the list is the definition of the theme — not a heuristic over it.
 */
const THEME_PHRASES: Record<string, string[]> = {
  assembly: ["easy to assemble", "simple to assemble", "assembly was a breeze", "no tools", "clear instructions", "easy-to-read instructions", "instructions"],
  quality: ["good quality", "high quality", "sturdy", "well-constructed", "well made", "durable"],
  value: ["great value", "good value", "value for money", "worth the price", "for its price", "great price"],
  smooth: ["smooth", "butter-like", "glides", "gliding", "rides smoothly"],
  adjustable: ["adjustable handlebars", "adjustable handlebar", "accommodate growing", "growing children"],
  wheels: ["wheels", "three wheels", "light-up wheels", "nice-sized wheels"],
  lights: ["light up", "light-up", "led", "lights"],
  folding: ["foldable", "folding", "fold"],
  balance: ["balance", "stability", "stable", "sturdy enough"],
};

/** Summaries mentioning at least one phrase in the theme. */
export const kidsScooterThemes = () =>
  Object.entries(THEME_PHRASES).map(([theme, phrases]) => {
    const matched = d.rows.filter((r) => {
      const hay = r.customersSay.toLowerCase();
      return phrases.some((p) => hay.includes(p));
    });
    return {
      theme,
      count: matched.length,
      brands: matched.map((r) => r.brand || r.name),
    };
  }).sort((a, b) => b.count - a.count);

/** Summaries that attribute a claim to one buyer, or split opinion. */
export const kidsScooterHedges = () => {
  const qualified = d.rows.filter((r) => /some (?:buyers|reviewers|parents)|a few (?:buyers|reviewers)|one reviewer|some reviewers/i.test(r.customersSay));
  const mixed = d.rows.filter((r) => /however|some (?:buyers|reviewers)|mixed|while others|but some/i.test(r.customersSay));
  const drawback = d.rows.filter((r) => /drawback|downside|con\b|however|some (?:buyers|reviewers)|not (?:very )?sturdy/i.test(r.customersSay));
  return {
    qualified: { count: qualified.length, brands: qualified.map((r) => r.brand || r.name) },
    mixed: { count: mixed.length, brands: mixed.map((r) => r.brand || r.name) },
    drawback: { count: drawback.length, brands: drawback.map((r) => r.brand || r.name) },
  };
};

export const kidsScooterRatings = () => {
  const rated = d.rows.filter((r) => r.rating !== null && r.reviewCount !== null);
  const sorted = [...rated].sort((a, b) => (b.reviewCount as number) - (a.reviewCount as number));
  return {
    rated: rated.length,
    unrated: total - rated.length,
    rows: sorted,
    highest: [...rated].sort((a, b) => (b.rating as number) - (a.rating as number))[0],
    mostReviewed: sorted[0],
  };
};

export interface ScooterFeedbackStrings {
  eyebrow: string;
  navLabel: string;
  h1: string;
  lead: string;
  provenanceTitle: string;
  provenanceBody: string[];
  ratingTitle: string;
  ratingLead: string;
  ratingNote: string;
  themeTitle: string;
  themeIntro: string;
  themeColTopic: string;
  themeColCount: string;
  themeColWho: string;
  hedgeTitle: string;
  hedgeLead: string;
  hedgeColKind: string;
  hedgeQualified: string;
  hedgeMixed: string;
  hedgeDrawback: string;
  hedgeColCount: string;
  hedgeColWho: string;
  listingTitle: string;
  listingColName: string;
  listingColStars: string;
  listingColReviews: string;
  listingColRank: string;
  listingColSummaryChars: string;
  methodTitle: string;
  methodBody: string[];
}

export const kidsScooterFeedbackStrings: Record<"en" | "zh", ScooterFeedbackStrings> = {
  en: {
    eyebrow: "Plan-B asset · buyer feedback",
    navLabel: "What buyers say",
    h1: `What Buyers Say About ${total} Kids' Scooters, Counted`,
    lead: `No page on this site can quote an individual buyer, because the catalogue stores no verbatim reviews. What it does store is one retailer-generated sentiment summary per listing. All ${total} of these listings have one, and all ${total} texts are different from each other. This page counts what those summaries mention and, separately, reports the star ratings the retailer published alongside them.`,
    provenanceTitle: "What these summaries are, and where the ratings come from",
    provenanceBody: [
      `The summaries are the \`customersSay\` field: one paragraph per listing, written by the retailer's own tooling from its review corpus, and already published on each product page. They are second-hand descriptions of reviews, not quotes — there are no reviewer names, dates or individual ratings behind them.`,
      `The star ratings and review counts are a separate field. product.rating and product.reviews are 0 for every one of these listings; the figures come from a "4.8 out of 5 stars (33,672)" string inside the scraped listing text. They are the retailer's marketplace figures, not ratings collected by this site, and they are shown beside the summaries rather than merged with them.`,
      `Counts below are mentions, not sentiment scores. A summary that calls a scooter both light and well made counts once under each theme, so the theme counts sum to more than the number of summaries.`,
      `Summaries of this kind skew positive, because they are generated to describe a listing. Treat the theme counts as a map of what sellers mention, not as a verdict on the products.`,
    ],
    ratingTitle: "Ratings the retailer published",
    ratingLead: `${kidsScooterRatings().rated} of the ${total} listings carry a star rating and a review count. They span ${kidsScooterRatings().highest?.rating} stars down to the lowest, and the review counts run from ${kidsScooterRatings().mostReviewed?.reviewCount?.toLocaleString("en-US")} downward. One listing — the priciest in the catalogue — carries no rating at all.`,
    ratingNote: `These counts pass the same plausibility ceiling this site applies elsewhere (200,000 reviews). The largest figure here is ${kidsScooterRatings().mostReviewed?.reviewCount?.toLocaleString("en-US")}, comfortably inside it. A marketplace review count reflects every listing that shares a product family, not this specific colourway, and the best-sellers rank is the retailer's own category position.`,
    themeTitle: "Topics the summaries bring up",
    themeIntro: `Across the ${total} summaries, counting each fixed phrase list below:`,
    themeColTopic: "Topic",
    themeColCount: "Summaries mentioning it",
    themeColWho: "Which listings",
    hedgeTitle: "When a positive line is hedged",
    hedgeLead: `A summary can praise a scooter and still hedge. These counts sit next to the theme counts rather than at the bottom of the page, because how often a claim is qualified is part of what the summary says.`,
    hedgeColKind: "Kind of hedge",
    hedgeQualified: "attributes a claim to some buyers rather than all",
    hedgeMixed: "records explicitly split opinion",
    hedgeDrawback: "names a concrete drawback",
    hedgeColCount: "Summaries",
    hedgeColWho: "Which listings",
    listingTitle: "Every listing in the count",
    listingColName: "Listing",
    listingColStars: "Stars",
    listingColReviews: "Reviews",
    listingColRank: "Category rank",
    listingColSummaryChars: "Summary length",
    methodTitle: "How these counts were made",
    methodBody: [
      `Source: the CMS product snapshot filtered to categoryId "scooters" and to the listings Stage 1 keeps — ${total} published listings, all ${total} carrying a summary, all ${d.totals.distinctSummaries} texts distinct.`,
      `Each theme is a fixed list of literal phrases, defined in src/data/kidsScooterFeedback.ts. The lists are in that one file, so every count here can be reproduced by grepping the generated dataset rather than by re-running this page.`,
      `Ratings and review counts are parsed from the retailer's own listing text and pass the site's MAX_PLAUSIBLE_REVIEW_COUNT gate. Where a listing has none, the row reads as not stated rather than being filled in from a sibling listing of the same model.`,
      `Nothing here is measured, tested or independently verified. It reports what a retailer's summaries say about a retailer's listings.`,
    ],
  },
  zh: {
    eyebrow: "Plan-B 资产页 · 买家反馈",
    navLabel: "买家怎么说",
    h1: `买家怎么看这 ${total} 款童用滑板车：逐项计数`,
    lead: `本站没有任何一页能引用某位买家的原话，因为产品库里不存逐条评论原文。它存的是每个 listing 一条由零售商生成的情绪摘要。这 ${total} 款全部都有摘要，且 ${total} 段文本互不重复。本页统计这些摘要提到了什么，并单独列出零售商同时公布的星级评分。`,
    provenanceTitle: "这些摘要是什么，评分又来自哪里",
    provenanceBody: [
      `摘要来自 \`customersSay\` 字段：每个 listing 一段话，由零售商自己的工具从其评论语料生成，已经原样印在各自的产品页上。它们是对评论的二手描述而非引述——背后没有评论者身份、日期或单条评分。`,
      `星级与评论数来自另一个字段。这 ${total} 款的 product.rating 与 product.reviews 全为 0，数字实际藏在抓取到的 listing 文本里，形如 "4.8 out of 5 stars (33,672)"。它们是零售商的电商平台数据，不是本站收集的评分，因此与摘要并排呈现，不做合并。`,
      `下面的计数是"提到"，不是情感打分。一段同时说车轻和做工好的摘要，会在两个主题下各计一次，所以主题计数之和会超过摘要段数。`,
      `这类摘要天然偏正面，因为它们是用来描述商品的。请把主题计数当作"卖家在说什么"的地图，而不是对产品的结论。`,
    ],
    ratingTitle: "零售商公布的评分",
    ratingLead: `${total} 款中有 ${kidsScooterRatings().rated} 款带星级和评论数。区间从 ${kidsScooterRatings().highest?.rating} 星到最低分，评论数从 ${kidsScooterRatings().mostReviewed?.reviewCount?.toLocaleString("en-US")} 往下走。全目录最贵的那一款则完全没有评分。`,
    ratingNote: `这些评论数都通过了本站其他地方使用的合理性上限（20 万）。这里最大的是 ${kidsScooterRatings().mostReviewed?.reviewCount?.toLocaleString("en-US")}，远在上限之内。电商平台的评论数统计的是共用同一产品族的所有 listing，而不是这个具体配色；畅销排名也是零售商自己给的类目位置。`,
    themeTitle: "摘要里提到了什么",
    themeIntro: `在 ${total} 段摘要中，按下面每一组固定短语列表计数：`,
    themeColTopic: "主题",
    themeColCount: "提及的摘要数",
    themeColWho: "涉及哪些 listing",
    hedgeTitle: "哪些好评是打了折扣的",
    hedgeLead: `一段摘要可以一边夸一边留余地。这类计数紧挨着主题计数，而不是丢在页尾——因为一句话被打折扣的频率，本身就是这段摘要的一部分信息。`,
    hedgeColKind: "折扣类型",
    hedgeQualified: "把某一处说法归给部分买家而非全部",
    hedgeMixed: "明确记录了分歧意见",
    hedgeDrawback: "点出了具体缺点",
    hedgeColCount: "摘要数",
    hedgeColWho: "涉及哪些 listing",
    listingTitle: "被计入的每一款",
    listingColName: "Listing",
    listingColStars: "星级",
    listingColReviews: "评论数",
    listingColRank: "类目排名",
    listingColSummaryChars: "摘要长度",
    methodTitle: "这些计数是怎么来的",
    methodBody: [
      `数据源：CMS 产品快照筛选 categoryId 为 "scooters" 并只保留阶段一保留的 listing，共 ${total} 款，全部带摘要，${d.totals.distinctSummaries} 段文本互不重复。`,
      `每个主题对应一组固定的字面短语，定义在 src/data/kidsScooterFeedback.ts。这些列表集中在该文件里，因此本页每个计数都可以直接在生成的数据集上 grep 复现，不必重跑整个页面。`,
      `评分与评论数从零售商自己的 listing 文本中解析，并经过本站的 MAX_PLAUSIBLE_REVIEW_COUNT 闸门。没有评分的 listing 显示为未说明，不会用同款其他 listing 的数字补上。`,
      `本页没有任何内容是实测或独立核验的。它报告的只是零售商的摘要对零售商自家商品说了什么。`,
    ],
  },
};

export const kidsScooterFeedbackColumns = (t: ScooterFeedbackStrings): ScooterColumn[] => [
  {
    key: "brand",
    header: t.listingColName,
    render: (r: never) => rosterLabel(r as never),
  },
  {
    key: "stars",
    header: t.listingColStars,
    numeric: true,
    render: (r: never) => {
      const v = (r as { rating?: number | null }).rating;
      return v === null || v === undefined ? "—" : `${v}`;
    },
  },
  {
    key: "reviews",
    header: t.listingColReviews,
    numeric: true,
    render: (r: never) => {
      const v = (r as { reviewCount?: number | null }).reviewCount;
      return v === null || v === undefined ? "—" : v.toLocaleString("en-US");
    },
  },
  {
    key: "rank",
    header: t.listingColRank,
    numeric: true,
    render: (r: never) => {
      const v = (r as { categoryRank?: number | null }).categoryRank;
      return v === null || v === undefined ? "—" : `#${v}`;
    },
  },
  {
    key: "chars",
    header: t.listingColSummaryChars,
    numeric: true,
    render: (r: never) => `${((r as { customersSay?: string }).customersSay || "").length}`,
  },
];

export const kidsScooterFeedbackVars = {
  total,
  themes: kidsScooterThemes(),
  hedges: kidsScooterHedges(),
  ratings: kidsScooterRatings(),
};

export const kidsScooterFeedbackIcons = {
  megaphone: Megaphone,
  quote: Quote,
  thumbs: ThumbsUp,
  table: Table2,
};