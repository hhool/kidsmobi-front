/**
 * SEO for the eight /kids-stroller-* asset pages.
 *
 * Kept in one module rather than beside each page's strings because the eight
 * title stems share a constraint: check-spa-titles.ts asserts the STEM survives
 * capSeoTitle truncation, and the brand suffix " | Balance Bike Toddler" costs
 * 21 characters of the 65-character budget. That leaves 44 for the stem, and
 * every stem below is inside it. Descriptions are held under the 155-character
 * CMS limit.
 */
import { KIDS_STROLLER_SIZE_PATH, kidsStrollerSizeStrings } from "./kidsStrollerSize";
import { KIDS_STROLLER_AGE_PATH, kidsStrollerAgeStrings } from "./kidsStrollerAge";
import { KIDS_STROLLER_PRICE_PATH, kidsStrollerPriceStrings } from "./kidsStrollerPrice";
import { KIDS_STROLLER_WEIGHT_PATH, kidsStrollerWeightStrings } from "./kidsStrollerWeight";
import { KIDS_STROLLER_TYPES_PATH, kidsStrollerTypesStrings } from "./kidsStrollerTypes";
import { KIDS_STROLLER_SAFETY_PATH, kidsStrollerSafetyStrings } from "./kidsStrollerSafety";
import { KIDS_STROLLER_FEEDBACK_PATH, kidsStrollerFeedbackStrings } from "./kidsStrollerFeedback";
import { KIDS_STROLLER_RECALLS_PATH, kidsStrollerRecallStrings } from "./kidsStrollerRecalls";
import { STROLLER_DATASET } from "./strollerData.generated";

const d = STROLLER_DATASET;
const n = d.totals.strollers;

export const kidsStrollerSizeSeo = {
  en: {
    title: "Stroller Sizes: Open and Folded Dimensions",
    description:
      `All ${n} strollers publish open length, width and height, but only ${d.totals.withFolded} ` +
      `give a folded size. The open and folded inches, and the clearance they leave out.`,
    canonical: KIDS_STROLLER_SIZE_PATH,
    keywords: [
      "stroller size chart",
      "stroller dimensions inches",
      "folded stroller size",
      "stroller width doorway",
      "compact stroller measurements",
      "travel stroller folded",
    ],
  },
  zh: {
    title: "婴儿车尺寸：展开与折叠尺寸",
    description:
      `${n} 款婴儿车都公布展开长、宽、高，但只有 ${d.totals.withFolded} 款给折叠尺寸。` +
      `本文给出展开与折叠英寸，以及它们漏掉的净空。`,
    canonical: KIDS_STROLLER_SIZE_PATH,
    keywords: ["婴儿车尺寸对照", "婴儿车长宽高", "折叠婴儿车尺寸", "婴儿车门宽", "轻便婴儿车尺寸", "旅行婴儿车折叠"],
  },
};

export const kidsStrollerAgeSeo = {
  en: {
    title: "Stroller Age Range: What Labels State",
    description:
      `Only ${d.totals.withAgeLabel} of ${n} strollers carry a usable age floor, and just ` +
      `${d.totals.withNumericAge} print a number. No upper limit is stated on any of them.`,
    canonical: KIDS_STROLLER_AGE_PATH,
    keywords: [
      "stroller age range",
      "what age stroller",
      "stroller newborn to toddler",
      "stroller age label",
      "when outgrow stroller",
      "stroller age limit",
    ],
  },
  zh: {
    title: "婴儿车适龄：标签究竟写了什么",
    description:
      `只有 ${d.totals.withAgeLabel} / ${n} 款婴儿车有可用年龄下限，其中仅 ${d.totals.withNumericAge} 款印了数字。` +
      `没有任何一款标出年龄上限。`,
    canonical: KIDS_STROLLER_AGE_PATH,
    keywords: ["婴儿车适龄", "婴儿车几个月用", "婴儿车新生儿到幼儿", "婴儿车年龄标签", "婴儿车几岁坐不下", "婴儿车年龄上限"],
  },
};

export const kidsStrollerPriceSeo = {
  en: {
    title: "Stroller Prices: 45 Models Compared",
    description:
      `All ${n} strollers carry a price, from under $100 to a ` +
      `$${Math.max(...STROLLER_DATASET.rows.map((r) => r.price))} ceiling. Where the dollars cluster, and why rating and price are separate.`,
    canonical: KIDS_STROLLER_PRICE_PATH,
    keywords: [
      "stroller prices",
      "how much is a stroller",
      "cheap stroller",
      "expensive stroller",
      "stroller price comparison",
      "best value stroller",
    ],
  },
  zh: {
    title: `婴儿车价格：${n} 款对照`,
    description:
      `${n} 款婴儿车都有价格，从百元以下到近 $900 的顶端。本文看钱聚在哪一段，` +
      `以及为什么评分与价格是两码事。`,
    canonical: KIDS_STROLLER_PRICE_PATH,
    keywords: ["婴儿车价格", "婴儿车多少钱", "便宜婴儿车", "贵婴儿车", "婴儿车价格对比", "性价比婴儿车"],
  },
};

export const kidsStrollerWeightSeo = {
  en: {
    title: "Stroller Weight: Item and Limit",
    description:
      `${d.totals.withItemWeight} of ${n} strollers state their own weight, but only ` +
      `${d.totals.withWeightLimit} state the child weight limit. The two numbers, kept apart.`,
    canonical: KIDS_STROLLER_WEIGHT_PATH,
    keywords: [
      "stroller weight",
      "how heavy is a stroller",
      "lightweight stroller pounds",
      "stroller weight limit",
      "stroller carry limit",
      "travel stroller weight",
    ],
  },
  zh: {
    title: "婴儿车重量：自重与承重",
    description:
      `${d.totals.withItemWeight} / ${n} 款公布自重，却只有 ${d.totals.withWeightLimit} 款公布承重。` +
      `这两个数字，分开来看。`,
    canonical: KIDS_STROLLER_WEIGHT_PATH,
    keywords: ["婴儿车重量", "婴儿车有多重", "轻量婴儿车磅", "婴儿车承重", "婴儿车载重上限", "旅行婴儿车重量"],
  },
};

export const kidsStrollerTypesSeo = {
  en: {
    title: "Stroller Types: Jogger, Double, Travel",
    description:
      `The ${n} strollers split into five forms — standard, jogger, double, travel and ` +
      `lightweight. How the catalogue is shaped, and where the form tag and the scale disagree.`,
    canonical: KIDS_STROLLER_TYPES_PATH,
    keywords: [
      "stroller types",
      "jogger stroller",
      "double stroller",
      "travel stroller",
      "lightweight stroller",
      "umbrella stroller",
    ],
  },
  zh: {
    title: "婴儿车类型：慢跑、双座、旅行",
    description:
      `${n} 款婴儿车归入五种形态——标准、慢跑、双座、旅行与轻量。本文看目录的形状，` +
      `以及类型标签和电子秤在哪里对不上。`,
    canonical: KIDS_STROLLER_TYPES_PATH,
    keywords: ["婴儿车类型", "慢跑婴儿车", "双座婴儿车", "旅行婴儿车", "轻量婴儿车", "伞车"],
  },
};

export const kidsStrollerSafetySeo = {
  en: {
    title: "Stroller Safety: EN 1888 Compliance",
    description:
      `All ${n} strollers claim EN 1888, so the mark separates none. The safety features ` +
      `that actually vary — harness, brake, canopy, basket, car-seat fit.`,
    canonical: KIDS_STROLLER_SAFETY_PATH,
    keywords: [
      "stroller safety standards",
      "EN 1888 stroller",
      "stroller five point harness",
      "stroller brake",
      "stroller canopy",
      "stroller car seat compatible",
    ],
  },
  zh: {
    title: "婴儿车安全：EN 1888 合规",
    description:
      `${n} 款婴儿车都声称符合 EN 1888，所以标记分不出高下。真正有差异的安全配置——` +
      `安全带、刹车、遮阳篷、置物篮、安全座椅适配。`,
    canonical: KIDS_STROLLER_SAFETY_PATH,
    keywords: ["婴儿车安全标准", "EN 1888 婴儿车", "婴儿车五点式安全带", "婴儿车刹车", "婴儿车遮阳篷", "婴儿车兼容安全座椅"],
  },
};

export const kidsStrollerFeedbackSeo = {
  en: {
    title: "What Buyers Say About Strollers",
    description:
      `The catalogue holds no verbatim reviews, only a retailer summary per stroller plus ` +
      `stars on all ${n}. What those summaries talk about, and where the praise is hedged.`,
    canonical: KIDS_STROLLER_FEEDBACK_PATH,
    keywords: [
      "stroller reviews",
      "what parents say stroller",
      "best rated stroller",
      "stroller pros and cons",
      "stroller buyer feedback",
      "stroller customer say",
    ],
  },
  zh: {
    title: "买家怎么看婴儿车",
    description:
      `目录里没有逐条评论原文，只有每款车的零售商摘要，外加 ${n} 款都有的星级。` +
      `这些摘要在讲什么，以及好评在哪里被打了折扣。`,
    canonical: KIDS_STROLLER_FEEDBACK_PATH,
    keywords: ["婴儿车评测", "家长怎么看婴儿车", "高分婴儿车", "婴儿车优缺点", "婴儿车买家评价", "婴儿车买家说"],
  },
};

export const kidsStrollerRecallsSeo = {
  en: {
    title: "Stroller Recalls: What the Record Shows",
    description:
      `This snapshot carries no recall records, so this page reports the absence plainly, ` +
      `explains what EN 1888 does not predict, and points to CPSC and RAPEX.`,
    canonical: KIDS_STROLLER_RECALLS_PATH,
    keywords: [
      "stroller recall",
      "stroller CPSC recall",
      "stroller safety recall",
      "EN 1888 recall",
      "RAPEX stroller",
      "stroller safety alert",
    ],
  },
  zh: {
    title: "婴儿车召回：记录显示了什么",
    description:
      `这份快照不含召回记录，所以本页直说缺失，解释 EN 1888 预测不了什么，` +
      `并指向 CPSC 与 RAPEX。`,
    canonical: KIDS_STROLLER_RECALLS_PATH,
    keywords: ["婴儿车召回", "婴儿车 CPSC 召回", "婴儿车安全召回", "EN 1888 召回", "RAPEX 婴儿车", "婴儿车安全警报"],
  },
};

/** path -> seo, consumed by pageKeywords.ts ASSET_SEO_BY_PATH and App.tsx. */
export const KIDS_STROLLER_SEO_BY_PATH: Record<string, typeof kidsStrollerSizeSeo> = {
  [KIDS_STROLLER_SIZE_PATH]: kidsStrollerSizeSeo,
  [KIDS_STROLLER_AGE_PATH]: kidsStrollerAgeSeo,
  [KIDS_STROLLER_PRICE_PATH]: kidsStrollerPriceSeo,
  [KIDS_STROLLER_WEIGHT_PATH]: kidsStrollerWeightSeo,
  [KIDS_STROLLER_TYPES_PATH]: kidsStrollerTypesSeo,
  [KIDS_STROLLER_SAFETY_PATH]: kidsStrollerSafetySeo,
  [KIDS_STROLLER_FEEDBACK_PATH]: kidsStrollerFeedbackSeo,
  [KIDS_STROLLER_RECALLS_PATH]: kidsStrollerRecallsSeo,
};

/** Every stroller asset path, for prerender-pages.ts and the guard lists. */
export const KIDS_STROLLER_ASSET_PATHS = [
  KIDS_STROLLER_SIZE_PATH,
  KIDS_STROLLER_AGE_PATH,
  KIDS_STROLLER_PRICE_PATH,
  KIDS_STROLLER_WEIGHT_PATH,
  KIDS_STROLLER_TYPES_PATH,
  KIDS_STROLLER_SAFETY_PATH,
  KIDS_STROLLER_FEEDBACK_PATH,
  KIDS_STROLLER_RECALLS_PATH,
];

// re-exported so the page strings stay reachable from one import in App.tsx
export {
  kidsStrollerSizeStrings,
  kidsStrollerAgeStrings,
  kidsStrollerPriceStrings,
  kidsStrollerWeightStrings,
  kidsStrollerTypesStrings,
  kidsStrollerSafetyStrings,
  kidsStrollerFeedbackStrings,
  kidsStrollerRecallStrings,
};
