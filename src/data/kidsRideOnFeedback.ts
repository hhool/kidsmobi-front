/**
 * /kids-ride-on-what-buyers-say/ — the retailer summaries, counted.
 *
 * The catalogue holds no verbatim reviews, so this page reports what it does
 * hold: one retailer-written sentiment summary per listing, the `customersSay`
 * field. Fourteen of the fifteen listings have one — the Winado WNDTRUCK657 has
 * none — and all fourteen texts are different from each other.
 *
 * What makes this dataset different from the balance-bike and kids-bike
 * equivalents is that the ratings were recoverable. product.rating and
 * product.reviews are 0 for every row, but the scraped listing text carries
 * "4.8 out of 5 stars (33,672)" inside Item_Details, so all fifteen listings
 * have a star rating, a review count and a Best Sellers Rank. Those are reported
 * as the retailer's own figures with their provenance stated up front, never as
 * this site's ratings and never blended with the summary counts.
 *
 * The theme counts are the interesting part, and they differ from the scooter
 * page in a way that is worth naming: what buyers talk about here is the
 * battery and the assembly, not the ride. Assembly is mentioned in 10 of the 14
 * summaries and the battery in 13 — the two subjects a ride-on car adds to the
 * questions a balance bike raises.
 *
 * Theme counting uses fixed literal phrase lists, kept in this file so the
 * counts are reproducible by grep — the same discipline the other review pages
 * in this repo use. A summary that praises both weight and build quality counts
 * once under each, so theme counts are mentions, not sentiment scores.
 */
import { Megaphone, Quote, ThumbsUp, Table2 } from "lucide-react";
import { RIDE_ON_DATASET } from "./rideOnData.generated";
import { rideOnLabel, type RideOnColumn } from "../components/RideOnAssetPage";

export { RIDE_ON_DATASET };
export const KIDS_RIDE_ON_FEEDBACK_PATH = "/kids-ride-on-what-buyers-say/";

const d = RIDE_ON_DATASET;
const total = d.totals.rideOnCars;

/**
 * Fixed literal phrase lists. Changing a list changes every count on the page,
 * so the list is the definition of the theme — not a heuristic over it.
 */
const THEME_PHRASES: Record<string, string[]> = {
  battery: ["battery life", "battery", "charge", "charging", "recharge"],
  assembly: [
    "easy to assemble",
    "easy assembly",
    "simple to assemble",
    "assembly was a breeze",
    "clear instructions",
    "clear directions",
    "easy to put together",
    "easy-to-read",
  ],
  remote: ["remote control", "remote", "parental"],
  sturdiness: ["well-made", "well made", "sturdy", "well-constructed", "high quality", "solid"],
  durability: ["durability", "durable", "breaks", "broke", "breaking", "lasts", "held up", "holds up"],
  appearance: ["appearance", "looks", "cute", "attractive", "design", "realistic"],
  value: ["value", "worth the price", "good price"],
  speed: ["speed", "moves quickly", "fast"],
  music: ["music", "bluetooth", "radio", "speaker"],
  weight: ["weight", "heavy", "light", "carry"],
};

/** Summaries mentioning at least one phrase in the theme. */
export const kidsRideOnThemes = () =>
  Object.entries(THEME_PHRASES).map(([theme, phrases]) => {
    const matched = d.rows.filter((r) => {
      const hay = (r.customersSay || "").toLowerCase();
      return phrases.some((p) => hay.includes(p));
    });
    return {
      theme,
      count: matched.length,
      labels: matched.map((r) => rideOnLabel(r)),
    };
  }).sort((a, b) => b.count - a.count);

/** Summaries that qualify a claim, split opinion, or name a drawback. */
export const kidsRideOnHedges = () => {
  const qualified = d.rows.filter((r) =>
    /some (?:customers|buyers|reviewers)|a few (?:customers|buyers)|one customer|others? (?:say|report|mention)|some (?:report|note)/i.test(
      r.customersSay || ""
    )
  );
  const mixed = d.rows.filter((r) => /however|mixed|while others|but some/i.test(r.customersSay || ""));
  const drawback = d.rows.filter((r) =>
    /concern|issue|problem|stop(s|ped)? working|break|struggl|doesn't|does not|durability is also mixed|not lasting|stopped working/i.test(
      r.customersSay || ""
    )
  );
  return {
    qualified: { count: qualified.length, labels: qualified.map((r) => rideOnLabel(r)) },
    mixed: { count: mixed.length, labels: mixed.map((r) => rideOnLabel(r)) },
    drawback: { count: drawback.length, labels: drawback.map((r) => rideOnLabel(r)) },
  };
};

/** Ratings, review counts and category ranks as the retailer published them. */
export const kidsRideOnRatings = () => {
  const rated = d.rows.filter((r) => r.rating !== null && r.reviewCount !== null);
  const sorted = [...rated].sort((a, b) => (b.reviewCount as number) - (a.reviewCount as number));
  const byRating = [...rated].sort((a, b) => (b.rating as number) - (a.rating as number));
  return {
    rated: rated.length,
    unrated: total - rated.length,
    rows: sorted,
    highest: byRating[0],
    lowest: byRating[byRating.length - 1],
    mostReviewed: sorted[0],
    topTen: d.rows.filter((r) => r.categoryRank !== null && r.categoryRank <= 10).length,
  };
};

/** The one listing with no summary at all. */
export const kidsRideOnNoSummary = () =>
  d.rows.filter((r) => !(r.customersSay || "").trim()).map((r) => rideOnLabel(r));

/**
 * Share of all reviews in the catalogue held by the two most-reviewed listings.
 *
 * Computed rather than asserted: the two Best Choice Products cars carry tens
 * of thousands of reviews between them, and the page states the percentage
 * instead of describing the concentration in words.
 */
export const kidsRideOnTopTwoShare = () => {
  const counts = d.rows
    .map((r) => r.reviewCount)
    .filter((n): n is number => typeof n === "number")
    .sort((a, b) => b - a);
  const sum = counts.reduce((a, b) => a + b, 0);
  if (!sum || counts.length < 2) return 0;
  return (counts[0] + counts[1]) / sum;
};

export interface RideOnFeedbackStrings {
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
  gapTitle: string;
  gapLead: string;
  gapNoSummary: string;
  gapNoText: string;
  listingTitle: string;
  listingColName: string;
  listingColStars: string;
  listingColReviews: string;
  listingColRank: string;
  listingColSummaryChars: string;
  methodTitle: string;
  methodBody: string[];
}

export const kidsRideOnFeedbackStrings: Record<"en" | "zh", RideOnFeedbackStrings> = {
  en: {
    eyebrow: "Plan-B asset · buyer feedback",
    navLabel: "What buyers say",
    h1: `What Buyers Say About ${total} Kids Ride-On Cars, Counted`,
    lead: `No page on this site can quote an individual buyer, because the catalogue stores no verbatim reviews. What it does store is one retailer-generated sentiment summary per listing. ${kidsRideOnRatings().rated} of the ${total} cars carry one — ${d.totals.distinctSummaries} of them are different texts from each other — and every one of the ${total} listings carries a star rating, a review count and a category rank. This page counts what the summaries mention, and reports the retailer's ratings beside them.`,
    provenanceTitle: "What the retailer wrote, and which numbers it published",
    provenanceBody: [
      `The summaries are the \`customersSay\` field: one paragraph per listing, written by the retailer's own tooling from its review corpus, and already published on each product page. They are second-hand descriptions of reviews, not quotes — there are no reviewer names, dates or individual ratings behind them.`,
      `The star ratings and review counts are a separate field. product.rating and product.reviews are 0 for every one of these listings; the figures come from a "4.8 out of 5 stars (33,672)" string inside the scraped listing text. They are the retailer's marketplace figures, not ratings collected by this site, and they are shown beside the summaries rather than merged with them.`,
      `Counts below are mentions, not sentiment scores. A summary that calls a car both light and well made counts once under each theme, so the theme counts sum to more than the number of summaries.`,
      `Summaries of this kind skew positive, because they are generated to describe a listing. Treat the theme counts as a map of what sellers mention, not as a verdict on the products.`,
    ],
    ratingTitle: "The star ratings and review counts, as published",
    ratingLead: `All ${total} listings carry a star rating, and they run from ${kidsRideOnRatings().lowest?.rating} stars up to ${kidsRideOnRatings().highest?.rating}. The review counts behind them are far less evenly spread: the most-reviewed car has ${kidsRideOnRatings().mostReviewed?.reviewCount?.toLocaleString("en-US")} reviews and the least-reviewed has ${kidsRideOnRatings().rows[kidsRideOnRatings().rows.length - 1]?.reviewCount?.toLocaleString("en-US")}. ${kidsRideOnRatings().topTen} of the ${total} listings sit in the top ten of their category.`,
    ratingNote: `Two figures dominate this catalogue in a way the ratings table alone does not show: the Best Choice Products SKY5506 carries ${kidsRideOnRatings().mostReviewed?.reviewCount?.toLocaleString("en-US")} reviews and the SKY9415 ${kidsRideOnRatings().rows.find((r) => r.model.includes("SKY9415"))?.reviewCount?.toLocaleString("en-US")}, together ${Math.round(kidsRideOnTopTwoShare() * 100)}% of every review recorded across all ${total} cars. The other thirteen listings split the remainder, and the least-reviewed of them has ${kidsRideOnRatings().rows[kidsRideOnRatings().rows.length - 1]?.reviewCount?.toLocaleString("en-US")}. All of these counts sit inside the 200,000-review plausibility ceiling this site applies elsewhere, so none is rejected — but a review count here measures how long a listing has been selling on a marketplace, not how many parents have tested the machine. The category rank is the retailer's own position in its own catalogue, and is reported for completeness rather than as a quality signal.`,
    themeTitle: "What these ride-on summaries talk about",
    themeIntro: `Across the ${kidsRideOnRatings().rated} summaries, counting each fixed phrase list below:`,
    themeColTopic: "Topic",
    themeColCount: "Summaries mentioning it",
    themeColWho: "Which listings",
    hedgeTitle: "Where the praise is qualified",
    hedgeLead: `A summary can praise a car and still hedge. These counts sit next to the theme counts rather than at the bottom of the page, because how often a claim is qualified is part of what the summary says.`,
    hedgeColKind: "Kind of hedge",
    hedgeQualified: "attributes a claim to some buyers rather than all",
    hedgeMixed: "records explicitly split opinion",
    hedgeDrawback: "names a concrete drawback",
    hedgeColCount: "Summaries",
    hedgeColWho: "Which listings",
    gapTitle: "Two things the summaries cannot answer",
    gapLead: `Stated because a summary reads like a verdict and is not one.`,
    gapNoSummary: `One listing has no summary — ${kidsRideOnNoSummary().join(", ")}. It carries a rating, a review count and a rank like the others, so the retailer clearly has review data for it; what is missing is the prose summary, and that listing is therefore absent from every theme count on this page.`,
    gapNoText: `No text behind the number — a star average and a review count say nothing about which of the ${kidsRideOnRatings().rated} listings had the one review that mentioned a fault. The retailer publishes the average and the summary, and keeps the individual reviews.`,
    listingTitle: "All fifteen listings, one row each",
    listingColName: "Listing",
    listingColStars: "Stars",
    listingColReviews: "Reviews",
    listingColRank: "Category rank",
    listingColSummaryChars: "Summary length",
    methodTitle: "How the theme counts and the ratings were extracted",
    methodBody: [
      `Source: the CMS product snapshot, gated to the id namespace electric_vehicles-* with category "electric_car", minus the listings Stage 1 prunes — ${total} published cars, ${kidsRideOnRatings().rated} carrying a summary, ${d.totals.distinctSummaries} distinct summary texts.`,
      `Each theme is a fixed list of literal phrases, defined in src/data/kidsRideOnFeedback.ts. The lists are in that one file, so every count here can be reproduced by grepping the generated dataset rather than by re-running this page.`,
      `Ratings and review counts are parsed from the retailer's own listing text and pass the site's MAX_PLAUSIBLE_REVIEW_COUNT gate. Where a listing has none, the row reads as not stated rather than being filled in from a sibling listing of the same model.`,
      `Nothing here is measured, tested or independently verified. It reports what a retailer's summaries say about a retailer's listings.`,
    ],
  },
  zh: {
    eyebrow: "Plan-B 资产页 · 买家反馈",
    navLabel: "买家怎么说",
    h1: `买家怎么看这 ${total} 款童用电动车：逐项计数`,
    lead: `本站没有任何一页能引用某位买家的原话，因为产品库里不存逐条评论原文。它存的是每个 listing 一条由零售商生成的情绪摘要。${total} 款中有 ${kidsRideOnRatings().rated} 款带摘要——${d.totals.distinctSummaries} 段文本互不重复——而全部 ${total} 款都带星级、评论数与类目排名。本页统计这些摘要提到了什么，并把零售商的评分并排呈现。`,
    provenanceTitle: "零售商写了什么，又公布了哪些数字",
    provenanceBody: [
      `摘要来自 \`customersSay\` 字段：每个 listing 一段话，由零售商自己的工具从其评论语料生成，已经原样印在各自的产品页上。它们是对评论的二手描述而非引述——背后没有评论者身份、日期或单条评分。`,
      `星级与评论数来自另一个字段。这 ${total} 款的 product.rating 与 product.reviews 全为 0，数字实际藏在抓取到的 listing 文本里，形如 "4.8 out of 5 stars (33,672)"。它们是零售商的电商平台数据，不是本站收集的评分，因此与摘要并排呈现，不做合并。`,
      `下面的计数是"提到"，不是情感打分。一段同时说车轻和做工好的摘要，会在两个主题下各计一次，所以主题计数之和会超过摘要段数。`,
      `这类摘要天然偏正面，因为它们是用来描述商品的。请把主题计数当作"卖家在说什么"的地图，而不是对产品的结论。`,
    ],
    ratingTitle: "公布的星级与评论量",
    ratingLead: `${total} 款全部带星级，区间从 ${kidsRideOnRatings().lowest?.rating} 星到 ${kidsRideOnRatings().highest?.rating} 星。但背后的评论数分布极不均匀：评论最多的那台有 ${kidsRideOnRatings().mostReviewed?.reviewCount?.toLocaleString("en-US")} 条，最少的只有 ${kidsRideOnRatings().rows[kidsRideOnRatings().rows.length - 1]?.reviewCount?.toLocaleString("en-US")} 条。${total} 款中有 ${kidsRideOnRatings().topTen} 款排在自己类目的前十。`,
    ratingNote: `有两个数字以排名表本身看不出来的方式主导了这份目录：Best Choice Products 的 SKY5506 有 ${kidsRideOnRatings().mostReviewed?.reviewCount?.toLocaleString("en-US")} 条评论，SKY9415 有 ${kidsRideOnRatings().rows.find((r) => r.model.includes("SKY9415"))?.reviewCount?.toLocaleString("en-US")} 条，两者合计占全部 ${total} 款评论总量的 ${Math.round(kidsRideOnTopTwoShare() * 100)}%。其余十三款分剩下的部分，其中评论最少的一款只有 ${kidsRideOnRatings().rows[kidsRideOnRatings().rows.length - 1]?.reviewCount?.toLocaleString("en-US")} 条。这些数字都没有超过本站别处使用的 20 万条合理性上限，因此没有任何一条被剔除——但这里的评论数衡量的是一个 listing 在电商平台上卖了多久，而不是有多少家长真的试过这台车。类目排名是零售商在自己目录里的位置，列出是为了完整，不作为质量信号。`,
    themeTitle: "这些电动车摘要谈到了什么",
    themeIntro: `在 ${kidsRideOnRatings().rated} 段摘要中，按下面每一组固定短语列表计数：`,
    themeColTopic: "主题",
    themeColCount: "提及的摘要数",
    themeColWho: "涉及哪些 listing",
    hedgeTitle: "好评在哪里被打了折扣",
    hedgeLead: `一段摘要可以一边夸一边留余地。这类计数紧挨着主题计数，而不是丢在页尾——因为一句话被打折扣的频率，本身就是这段摘要的一部分信息。`,
    hedgeColKind: "折扣类型",
    hedgeQualified: "把某一处说法归给部分买家而非全部",
    hedgeMixed: "明确记录了分歧意见",
    hedgeDrawback: "点出了具体缺点",
    hedgeColCount: "摘要数",
    hedgeColWho: "涉及哪些 listing",
    gapTitle: "摘要回答不了的两件事",
    gapLead: `写在这里，是因为摘要读起来像结论，而它不是。`,
    gapNoSummary: `有一款没有摘要——${kidsRideOnNoSummary().join("、")}。它和其他款一样带评分、评论数与排名，说明零售商手里明明有它的评论数据，缺的只是那段散文式摘要。因此这一款不出现在本页任何主题计数里。`,
    gapNoText: `数字背后没有文字——星级均分和评论数说明不了 ${kidsRideOnRatings().rated} 款里究竟是哪一款收到了那唯一一条提到故障的评论。零售商公开的是均分与摘要，逐条评论则留在了自己那边。`,
    listingTitle: "十五款全部，每款一行",
    listingColName: "Listing",
    listingColStars: "星级",
    listingColReviews: "评论数",
    listingColRank: "类目排名",
    listingColSummaryChars: "摘要长度",
    methodTitle: "这些计数是怎么来的",
    methodBody: [
      `数据源：CMS 产品快照，限定 id 命名空间 electric_vehicles-* 且 category 为 "electric_car"，再剔除阶段一剪掉的 listing，共 ${total} 款在售，其中 ${kidsRideOnRatings().rated} 款带摘要、${d.totals.distinctSummaries} 段摘要文本互不重复。`,
      `每个主题对应一组固定的字面短语，定义在 src/data/kidsRideOnFeedback.ts。这些列表集中在该文件里，因此本页每个计数都可以直接在生成的数据集上 grep 复现，不必重跑整个页面。`,
      `评分与评论数从零售商自己的 listing 文本中解析，并经过本站的 MAX_PLAUSIBLE_REVIEW_COUNT 闸门。没有评分的 listing 显示为未说明，不会用同款其他 listing 的数字补上。`,
      `本页没有任何内容是实测或独立核验的。它报告的只是零售商的摘要对零售商自家商品说了什么。`,
    ],
  },
};

export const kidsRideOnFeedbackColumns = (t: RideOnFeedbackStrings): RideOnColumn[] => [
  {
    key: "brand",
    header: t.listingColName,
    render: (r: never) => rideOnLabel(r as never),
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

export const kidsRideOnFeedbackVars = {
  total,
  themes: kidsRideOnThemes(),
  hedges: kidsRideOnHedges(),
  ratings: kidsRideOnRatings(),
};

export const kidsRideOnFeedbackIcons = {
  megaphone: Megaphone,
  quote: Quote,
  thumbs: ThumbsUp,
  table: Table2,
};
