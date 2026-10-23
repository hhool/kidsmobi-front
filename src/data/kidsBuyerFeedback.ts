/**
 * Plan-B Asset — kids' bike buyer feedback, aggregated.
 *
 * The honest version of "reviews" for the pedal kids' bike category. This site
 * has no verbatim customer reviews: the catalogue carries one retailer-generated
 * buyer-sentiment summary per listing (`customersSay`), which is what the product
 * pages already publish. Publishing an aggregation of those summaries is
 * legitimate; presenting them as if they were individual reviews would not be.
 *
 * So the page counts what the summaries MENTION and states, at the top and in
 * the method section, exactly what the source is and is not.
 */
import { KIDS_REVIEW_DATASET } from "./kidsReviewData.generated";

export { KIDS_REVIEW_DATASET };

export const KIDS_BUYER_FEEDBACK_PATH = "/kids-bike-what-buyers-say/";

const d = KIDS_REVIEW_DATASET;
const total = d.kidsBikeSummaries;

const theme = (id: string) => d.themes.find((entry) => entry.id === id);
const hedge = (id: string) => d.hedges.find((entry) => entry.id === id);

const assembly = theme("assembly");
const build = theme("build");
const learning = theme("learning");
const ageFit = theme("ageFit");
const stability = theme("stability");
const weight = theme("weight");
const mixed = hedge("mixed");
const qualified = hedge("qualified");
const negative = hedge("negative");

/** The one-line answer, used in the intro and in the internal-link note. */
export const kidsBuyerFeedbackHeadline = {
  en: `All ${total} of the kids' bike listings we publish carry a buyer-sentiment summary, and every one of them mentions assembly — but ${mixed?.count ?? 0} of ${total} also record split or mixed feedback.`,
  zh: `本站上架的 ${total} 款童车全部带有买家情绪摘要，且每一条都提到了装配——但其中 ${mixed?.count ?? 0} 条同时记录了分歧或褒贬不一的反馈。`,
};

export const kidsBuyerFeedbackStrings = {
  en: {
    eyebrow: "Plan-B asset · buyer feedback",
    navLabel: "What buyers say",
    h1: `What Buyers Say About ${total} Kids' Bikes: All Summaries, Counted`,
    lead: `Nobody wrote this page from reviews, because the catalogue holds none. What it does hold is one retailer-written buyer-sentiment paragraph per listing — and for pedal kids' bikes those paragraphs keep circling the same three subjects: how it goes together, how well it is built, and whether it wobbles. Here is every one of them, counted.`,
    provenanceTitle: "What these summaries actually are",
    provenanceBody: [
      `Each paragraph comes from the \`customersSay\` field of a listing: prose written by the retailer's own system to describe the product. It already appears on the product page, so nothing here is new evidence — it is the same text, tallied.`,
      `Nobody is quoted. Behind these numbers there are no individual ratings, dates or reviewer names, and no way to check a summary against the reviews behind it. Treat every count as a statement about the summaries, never about buyers.`,
      `A single summary can register under several subjects at once. One that calls a bike light and sturdy is counted in Weight and in Build quality, so the column will not add up to ${total} and is not meant to.`,
      `Retailer-written summaries lean positive, which is why the qualifying-language counts sit directly beneath the subject counts instead of being buried.`,
    ],
    themeTitle: "Topics the summaries bring up",
    themeIntro: `Across the ${total} kids' bike listings that carry a summary (${d.distinctKidsBikeSummaries} distinct texts):`,
    themeColTopic: "Topic",
    themeColCount: "Summaries mentioning it",
    themeColNote: "What counts as a mention",
    hedgeTitle: "When a positive line is hedged",
    hedgeIntro: `A summary can praise a bike and still hedge. ${qualified?.count ?? 0} of ${total} attribute at least one claim to a single buyer rather than to buyers generally, ${mixed?.count ?? 0} record explicitly split opinions, and ${negative?.count ?? 0} name a concrete drawback.`,
    listingTitle: "The listings in the count",
    listingColName: "Listing",
    listingColChars: "Summary length",
    methodTitle: "How the numbers were counted",
    methodBody: [
      `Source: the CMS product snapshot the site builds from, field \`customersSay\`, taken after the stage-1 and stage-2 prunes that retired duplicate and colourway listings.`,
      `${d.publishedProducts} listings are published; ${d.summariesPublished} carry a summary. ${total} of them are kids' bikes, and all ${d.distinctKidsBikeSummaries} texts are distinct. The median kids' bike summary is ${d.medianSummaryChars} characters.`,
      `Each topic is a fixed list of literal phrases (Build quality, for instance, matches "sturdy", "durable", "well-made", "solid", "good quality"). Those lists sit in scripts/fetch_kids_review_data.mjs, so any count on this page can be re-derived by grepping the same words.`,
      `${d.misfiled.length} listing filed under kids' bikes is described by its own summary as a tricycle. None here, so nothing is flagged.`,
      `Nothing on this page is measured, tested, or independently verified. It reports what a retailer's summary says about a retailer's listings.`,
    ],
    sourceLabel: "Source",
    sourceNote: `CMS snapshot · ${d.summariesPublished} summaries of ${d.publishedProducts} published listings`,
    clusterTitle: "Related datasets",
  },
  zh: {
    eyebrow: "计划-B 资产 · 买家反馈",
    navLabel: "买家怎么说",
    h1: `买家对 ${total} 款童车的评价：全部情绪摘要的统计分析`,
    lead: `本页不是从评论写出来的，因为产品库里没有评论。它有的是每个 listing 一段由零售商撰写的买家情绪描述——而在童车这一类里，这些段落翻来覆去只谈三件事：好不好装、结不结实、会不会晃。这里把 ${total} 段全部统计给你看。`,
    provenanceTitle: "这些摘要到底是什么",
    provenanceBody: [
      `每一段都来自 listing 的 \`customersSay\` 字段：由零售商自己的系统写来描述这件商品的一段话。它本来就印在商品页上，所以这里没有引入新证据——只是把同样的文字数了一遍。`,
      `没有人被引用。这些数字背后没有单条评分、日期或评论者身份，也没有办法拿一段摘要去核对它背后的那些评论。请把每个计数理解为「关于这些摘要」的陈述，而不是「关于买家」的。`,
      `一段摘要可能同时命中多个主题。一段既说车轻又说结实的摘要，会同时计入「重量」与「做工」，所以各列加起来不会等于 ${total}，本来也不该等于。`,
      `零售商撰写的摘要天然偏正面，所以「限定语气」的计数紧挨在主题计数下方，而不是被放到页面末尾。`,
    ],
    themeTitle: "摘要里谈到了什么",
    themeIntro: `在带有摘要的 ${total} 款童车中（${d.distinctKidsBikeSummaries} 段互不重复的文本）：`,
    themeColTopic: "主题",
    themeColCount: "提及的摘要数",
    themeColNote: "什么算一次提及",
    hedgeTitle: "哪些好评是打了折扣的",
    hedgeIntro: `一段摘要可以一边夸一边留余地。${qualified?.count ?? 0} / ${total} 把至少一处说法归给了「某一位买家」而不是泛泛的买家群体，${mixed?.count ?? 0} 条明确记录了分歧，${negative?.count ?? 0} 条点出了具体的缺点。`,
    listingTitle: "被计入的每一个 listing",
    listingColName: "Listing",
    listingColChars: "摘要长度",
    methodTitle: "这些数字是怎么数出来的",
    methodBody: [
      `数据源：站点构建所用的 CMS 产品快照，字段 \`customersSay\`，取自阶段一与阶段二裁剪之后（重复的 listing 与同款配色页已退役）。`,
      `共上架 ${d.publishedProducts} 个 listing，其中 ${d.summariesPublished} 个带摘要；童车 ${total} 个，${d.distinctKidsBikeSummaries} 段文本互不重复。童车摘要长度中位数为 ${d.medianSummaryChars} 字符。`,
      `每个主题对应一组固定的字面短语（例如「做工」匹配 "sturdy"、"durable"、"well-made"、"solid"、"good quality"）。同一组词在 scripts/fetch_kids_review_data.mjs 里，所以本页任一计数都可以用同样的词 grep 复现。`,
      `有 ${d.misfiled.length} 个被归入童车的 listing 被其自身摘要描述成三轮车。本页没有，因此无需标注。`,
      `本页没有任何内容是实测或独立核验的。它报告的只是零售商的摘要对零售商自家商品说了什么。`,
    ],
    sourceLabel: "来源",
    sourceNote: `CMS 快照 · ${d.publishedProducts} 个上架 listing 中的 ${d.summariesPublished} 条摘要`,
    clusterTitle: "相关数据集",
  },
};

export const kidsBuyerFeedbackSeo = {
  en: {
    title: `What Buyers Say About ${total} Kids' Bikes`,
    description:
      `No reviews exist on this site, so we tallied what does: ${total} retailer-written buyer-sentiment paragraphs for our kids' bike listings. ` +
      `${build?.count ?? 0} name build quality, ${assembly?.count ?? 0} assembly, ${stability?.count ?? 0} stability, ` +
      `${negative?.count ?? 0} a named drawback. Method and limits included.`,
    canonical: KIDS_BUYER_FEEDBACK_PATH,
    keywords: [
      "kids bike reviews",
      "what parents say about kids bikes",
      "kids bike buyer feedback",
      "are kids bikes worth it",
      "kids bike for 5 year old reviews",
      "pedal bike complaints",
      "best rated kids bike",
    ],
  },
  zh: {
    title: `买家怎么看这 ${total} 款童车`,
    description:
      `本站没有评论原文，所以我们统计了确实有的东西：为上架童车撰写的 ${total} 段买家情绪描述。` +
      `${build?.count ?? 0} 段提到做工，${assembly?.count ?? 0} 段提到装配，${stability?.count ?? 0} 段提到稳定性，` +
      `${negative?.count ?? 0} 段点出了具体缺点。含取数方法与局限说明。`,
    canonical: KIDS_BUYER_FEEDBACK_PATH,
    keywords: [
      "童车评测",
      "童车买家评价",
      "童车值不值得买",
      "儿童脚踏车口碑",
      "童车缺点",
      "五岁童车推荐",
    ],
  },
};

export type KidsBuyerFeedbackStrings = typeof kidsBuyerFeedbackStrings.en;

/** Dataset JSON-LD so the counts are machine-readable, as on the other assets. */
export function buildKidsBuyerFeedbackDatasetSchema(canonicalUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Kids' bike buyer-sentiment summaries (aggregated)",
    description: kidsBuyerFeedbackSeo.en.description,
    url: canonicalUrl,
    license: "https://balancebiketoddler.com/transparency/terms/",
    creator: { "@type": "Organization", name: "BalanceBikeToddler" },
    variableMeasured: [
      ...d.themes.map((entry) => ({
        "@type": "PropertyValue",
        name: entry.label,
        value: entry.count,
        unitText: `summaries of ${total}`,
        description: entry.note,
      })),
      ...d.hedges.map((entry) => ({
        "@type": "PropertyValue",
        name: `Hedge: ${entry.label}`,
        value: entry.count,
        unitText: `summaries of ${total}`,
      })),
    ],
  };
}

/** Exposed so the SPA can render the same numbers without a second parser. */
export const kidsBuyerFeedbackFacts = {
  total,
  publishedProducts: d.publishedProducts,
  summariesPublished: d.summariesPublished,
  themes: d.themes,
  hedges: d.hedges,
  listings: d.listings,
};
