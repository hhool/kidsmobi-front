/**
 * SEO for the eight /kids-tricycle-* asset pages.
 *
 * Kept in one module because the eight title stems share a constraint:
 * check-spa-titles.ts asserts the STEM survives capSeoTitle truncation, and the
 * brand suffix " | Balance Bike Toddler" costs 21 of the 65-character budget,
 * leaving 44 for the stem. Every stem below is inside 44. Shortening a stem is
 * the fix if one ever creeps over. Descriptions hold under the 155-character CMS
 * limit, and keywords are 6–10 English phrases, matching the repo convention.
 *
 * Field shape mirrors kidsRideOnSeo.ts: en/zh each carry title, description,
 * keywords and canonical. canonical is the page path.
 */
import { KIDS_TRICYCLE_SIZE_PATH, kidsTricycleSizeVars } from "./kidsTricycleSize";
import { KIDS_TRICYCLE_AGE_PATH, kidsTricycleAgeVars } from "./kidsTricycleAge";
import { KIDS_TRICYCLE_PRICE_PATH, kidsTricyclePriceVars } from "./kidsTricyclePrice";
import { KIDS_TRICYCLE_WEIGHT_PATH, kidsTricycleWeightVars } from "./kidsTricycleWeight";
import { KIDS_TRICYCLE_TYPES_PATH } from "./kidsTricycleTypes";
import { KIDS_TRICYCLE_SAFETY_PATH, kidsTricycleSafetyVars } from "./kidsTricycleSafety";
import {
  KIDS_TRICYCLE_FEEDBACK_PATH,
  kidsTricycleFeedbackVars,
} from "./kidsTricycleFeedback";
import {
  KIDS_TRICYCLE_RECALLS_PATH,
  kidsTricycleRecallVars,
} from "./kidsTricycleRecalls";
import { TRICYCLE_DATASET } from "./tricycleData.generated";

const d = TRICYCLE_DATASET;
const n = d.totals.tricycles;

export const kidsTricycleSizeSeo = {
  en: {
    title: "Kids Tricycle Size Chart and Dimensions",
    description:
      `${d.totals.withDimensions} of ${n} tricycles publish length, width and height. ` +
      `The size field is inconsistent, so dimensions are read from the record.`,
    canonical: KIDS_TRICYCLE_SIZE_PATH,
    keywords: [
      "kids tricycle size chart",
      "tricycle dimensions inches",
      "how big is a kids trike",
      "toddler tricycle length width",
      "tricycle size by age",
      "kids trike measurements",
    ],
  },
  zh: {
    title: "儿童三轮车尺寸对照与大小",
    description:
      `${n} 款三轮车中有 ${d.totals.withDimensions} 款公布长宽高。size 字段不一致，` +
      `因此尺寸从尺寸记录读取。`,
    canonical: KIDS_TRICYCLE_SIZE_PATH,
    keywords: ["儿童三轮车尺寸", "三轮车长宽高", "三轮车多大", "幼儿三轮车尺寸对照"],
  },
};

export const kidsTricycleAgeSeo = {
  en: {
    title: "Kids Tricycle Age Range by Model",
    description:
      `Only ${kidsTricycleAgeVars.numeric} of ${n} tricycles put a number on the age label; ` +
      `${kidsTricycleAgeVars.unlabelled} carry no label at all. Floors and ceilings, read from the fields.`,
    canonical: KIDS_TRICYCLE_AGE_PATH,
    keywords: [
      "what age for a tricycle",
      "kids tricycle age range",
      "tricycle for 2 year old",
      "when to buy a trike",
      "toddler tricycle age limit",
      "tricycle age label",
    ],
  },
  zh: {
    title: "儿童三轮车适龄范围按型号",
    description:
      `${n} 款中只有 ${kidsTricycleAgeVars.numeric} 款在年龄标签上标了数字，${kidsTricycleAgeVars.unlabelled} 款完全没标。` +
      `上下限从字段读取。`,
    canonical: KIDS_TRICYCLE_AGE_PATH,
    keywords: ["儿童三轮车适合年龄", "三轮车几岁能骑", "幼儿三轮车年龄", "三轮车适龄范围"],
  },
};

export const kidsTricyclePriceSeo = {
  en: {
    title: "Kids Tricycle Prices Compared",
    description:
      `All ${n} tricycles are priced, from $${kidsTricyclePriceVars.priceMin} to ` +
      `$${kidsTricyclePriceVars.priceMax}. The spread tracks body style, not safety or stars.`,
    canonical: KIDS_TRICYCLE_PRICE_PATH,
    keywords: [
      "kids tricycle price",
      "how much is a tricycle",
      "toddler trike cost",
      "cheap kids tricycle",
      "convertible tricycle price",
      "tricycle price comparison",
    ],
  },
  zh: {
    title: "儿童三轮车价格对照",
    description:
      `${n} 款三轮车全部标价，从 $${kidsTricyclePriceVars.priceMin} 到 $${kidsTricyclePriceVars.priceMax}。` +
      `价差随车身形态走，不随安全或星标。`,
    canonical: KIDS_TRICYCLE_PRICE_PATH,
    keywords: ["儿童三轮车价格", "三轮车多少钱", "便宜儿童三轮车", "三轮车价格对照"],
  },
};

export const kidsTricycleWeightSeo = {
  en: {
    title: "Kids Tricycle Weight and Rider Limit",
    description:
      `${d.totals.withItemWeight} of ${n} state own weight, ${d.totals.withWeightLimit} state a rider ` +
      `limit, and only ${kidsTricycleWeightVars.pairs} state both — the gap a parent should check.`,
    canonical: KIDS_TRICYCLE_WEIGHT_PATH,
    keywords: [
      "kids tricycle weight",
      "tricycle weight limit",
      "how heavy is a toddler trike",
      "tricycle rider weight capacity",
      "lightweight kids tricycle",
      "trike own weight vs load",
    ],
  },
  zh: {
    title: "儿童三轮车自重与承重",
    description:
      `${n} 款中有 ${d.totals.withItemWeight} 款标自重、${d.totals.withWeightLimit} 款标承重，` +
      `仅 ${kidsTricycleWeightVars.pairs} 款两者都标——这正是家长该核查的缺口。`,
    canonical: KIDS_TRICYCLE_WEIGHT_PATH,
    keywords: ["儿童三轮车重量", "三轮车承重", "三轮车自重", "幼儿三轮车能载多重"],
  },
};

export const kidsTricycleTypesSeo = {
  en: {
    title: "Kids Tricycle Types and Features",
    description:
      `${d.forms.classic} classic and ${d.forms.convertible} convertible trikes cover all ${n}; ` +
      `push-only, stroller-only and bike-mode styles are absent. The feature matrix, counted.`,
    canonical: KIDS_TRICYCLE_TYPES_PATH,
    keywords: [
      "types of kids tricycles",
      "convertible tricycle vs classic",
      "tricycle with push handle",
      "toddler trike features",
      "tricycle with storage basket",
      "best tricycle style",
    ],
  },
  zh: {
    title: "儿童三轮车类型与功能",
    description:
      `${d.forms.classic} 款经典加 ${d.forms.convertible} 款 convertible 覆盖全部 ${n}；` +
      `纯推行、纯推车与自行车模式均缺席。功能矩阵已计数。`,
    canonical: KIDS_TRICYCLE_TYPES_PATH,
    keywords: ["儿童三轮车类型", "可转换三轮车", "带推行把手三轮车", "三轮车功能"],
  },
};

export const kidsTricycleSafetySeo = {
  en: {
    title: "Kids Tricycle Safety Standards",
    description:
      `${kidsTricycleSafetyVars.astm} of ${n} tricycles claim ASTM F963 and ${kidsTricycleSafetyVars.noCompliance} ` +
      `claim nothing — a uniform mark that ranks nothing. The features that differ, named.`,
    canonical: KIDS_TRICYCLE_SAFETY_PATH,
    keywords: [
      "kids tricycle safety standards",
      "ASTM F963 tricycle",
      "tricycle with push handle safety",
      "toddler trike compliance",
      "safe tricycle features",
      "tricycle canopy sun",
    ],
  },
  zh: {
    title: "儿童三轮车安全标准",
    description:
      `${n} 款中有 ${kidsTricycleSafetyVars.astm} 款声称 ASTM F963、${kidsTricycleSafetyVars.noCompliance} 款什么都没声称——` +
      `统一标记无从排名。真正不同的功能在此点名。`,
    canonical: KIDS_TRICYCLE_SAFETY_PATH,
    keywords: ["儿童三轮车安全标准", "ASTM F963 三轮车", "三轮车合规", "三轮车安全功能"],
  },
};

export const kidsTricycleFeedbackSeo = {
  en: {
    title: "What Buyers Say About Tricycles",
    description:
      `We hold no verbatim reviews, so we counted the ${kidsTricycleFeedbackVars.withSummary} retailer summaries: ` +
      `${kidsTricycleFeedbackVars.totalReviews.toLocaleString()} reviews, ratings crushed into 4.5–4.7.`,
    canonical: KIDS_TRICYCLE_FEEDBACK_PATH,
    keywords: [
      "kids tricycle reviews",
      "what parents say about trikes",
      "best rated toddler tricycle",
      "tricycle buyer feedback",
      "tricycle easy to assemble",
      "tricycle durability reviews",
    ],
  },
  zh: {
    title: "买家怎么看三轮车",
    description:
      `本站没有逐条评论，所以聚合了 ${kidsTricycleFeedbackVars.withSummary} 条零售商摘要：` +
      `共 ${kidsTricycleFeedbackVars.totalReviews.toLocaleString()} 条评论，评分挤在 4.5–4.7。`,
    canonical: KIDS_TRICYCLE_FEEDBACK_PATH,
    keywords: ["儿童三轮车评测", "三轮车口碑", "高分幼儿三轮车", "三轮车买家评价"],
  },
};

export const kidsTricycleRecallsSeo = {
  en: {
    title: "Kids Tricycle Recall and Compliance",
    description:
      `The snapshot has no recall field, so this page reports what it holds: ${kidsTricycleRecallVars.astm} of ` +
      `${n} claim ASTM F963, ${kidsTricycleRecallVars.notices} notices matched. The silence, named.`,
    canonical: KIDS_TRICYCLE_RECALLS_PATH,
    keywords: [
      "tricycle recall",
      "kids tricycle CPSC",
      "tricycle safety recall",
      "ASTM F963 compliance",
      "tricycle hazard notice",
      "toddler trike recall check",
    ],
  },
  zh: {
    title: "儿童三轮车召回与合规",
    description:
      `快照没有召回字段，所以本页报告它掌握的：${n} 款中有 ${kidsTricycleRecallVars.astm} 款声称 ASTM F963，` +
      `匹配到 ${kidsTricycleRecallVars.notices} 条通告。沉默在此被点名。`,
    canonical: KIDS_TRICYCLE_RECALLS_PATH,
    keywords: ["儿童三轮车召回", "三轮车合规", "ASTM F963", "三轮车安全召回"],
  },
};

/** path -> seo, consumed by pageKeywords.ts ASSET_SEO_BY_PATH and App.tsx. */
export const KIDS_TRICYCLE_SEO_BY_PATH: Record<
  string,
  typeof kidsTricycleSizeSeo
> = {
  [KIDS_TRICYCLE_SIZE_PATH]: kidsTricycleSizeSeo,
  [KIDS_TRICYCLE_AGE_PATH]: kidsTricycleAgeSeo,
  [KIDS_TRICYCLE_PRICE_PATH]: kidsTricyclePriceSeo,
  [KIDS_TRICYCLE_WEIGHT_PATH]: kidsTricycleWeightSeo,
  [KIDS_TRICYCLE_TYPES_PATH]: kidsTricycleTypesSeo,
  [KIDS_TRICYCLE_SAFETY_PATH]: kidsTricycleSafetySeo,
  [KIDS_TRICYCLE_FEEDBACK_PATH]: kidsTricycleFeedbackSeo,
  [KIDS_TRICYCLE_RECALLS_PATH]: kidsTricycleRecallsSeo,
};

/** Every tricycle asset path, for prerender-pages.ts and the guard lists. */
export const KIDS_TRICYCLE_ASSET_PATHS = [
  KIDS_TRICYCLE_SIZE_PATH,
  KIDS_TRICYCLE_AGE_PATH,
  KIDS_TRICYCLE_PRICE_PATH,
  KIDS_TRICYCLE_WEIGHT_PATH,
  KIDS_TRICYCLE_TYPES_PATH,
  KIDS_TRICYCLE_SAFETY_PATH,
  KIDS_TRICYCLE_FEEDBACK_PATH,
  KIDS_TRICYCLE_RECALLS_PATH,
];

// re-exported so the page strings stay reachable from one import in App.tsx
export {
  kidsTricycleSizeStrings,
} from "./kidsTricycleSize";
export { kidsTricycleAgeStrings } from "./kidsTricycleAge";
export { kidsTricyclePriceStrings } from "./kidsTricyclePrice";
export { kidsTricycleWeightStrings } from "./kidsTricycleWeight";
export { kidsTricycleTypesStrings } from "./kidsTricycleTypes";
export { kidsTricycleSafetyStrings } from "./kidsTricycleSafety";
export { kidsTricycleFeedbackStrings } from "./kidsTricycleFeedback";
export { kidsTricycleRecallStrings } from "./kidsTricycleRecalls";
