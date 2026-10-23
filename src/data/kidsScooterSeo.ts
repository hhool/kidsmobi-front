/**
 * SEO for the eight /kids-scooter-* asset pages.
 *
 * Kept in one module rather than beside each page's strings because the eight
 * title stems share a constraint: check-spa-titles.ts asserts the STEM survives
 * capSeoTitle truncation, and the brand suffix " | Balance Bike Toddler" costs
 * 21 characters of the 65-character budget. That leaves 44 for the stem, and
 * every stem below is well inside it. Shortening a stem is the fix when one
 * creeps over — the guard only reports past 65, so a silently truncated stem
 * fails check:spatitles instead of check:titles.
 *
 * Descriptions are held under the 155-character CMS limit for the same reason
 * the rest of the repo holds them there.
 */
import {
  KIDS_SCOOTER_WHEELS_PATH,
  kidsScooterWheelsStrings,
} from "./kidsScooterWheels";
import {
  KIDS_SCOOTER_SIZE_PATH,
  kidsScooterSizeStrings,
} from "./kidsScooterSize";
import {
  KIDS_SCOOTER_WEIGHT_PATH,
  kidsScooterWeightStrings,
} from "./kidsScooterWeight";
import {
  KIDS_SCOOTER_PRICE_PATH,
  kidsScooterPriceStrings,
} from "./kidsScooterPrice";
import {
  KIDS_SCOOTER_AGE_PATH,
  kidsScooterAgeStrings,
} from "./kidsScooterAge";
import {
  KIDS_SCOOTER_SAFETY_PATH,
  kidsScooterSafetyStrings,
} from "./kidsScooterSafety";
import {
  KIDS_SCOOTER_FEEDBACK_PATH,
  kidsScooterFeedbackStrings,
} from "./kidsScooterFeedback";
import {
  KIDS_SCOOTER_RECALLS_PATH,
  kidsScooterRecallsStrings,
  kidsScooterRecallVars,
} from "./kidsScooterRecalls";
import { SCOOTER_DATASET } from "./scooterData.generated";

const d = SCOOTER_DATASET;
const n = d.totals.kidsScooters;

export const kidsScooterWheelsSeo = {
  en: {
    title: "Kids Scooter Wheels: 2 or 3?",
    description:
      `Two wheels or three changes which child a scooter suits. All ${n} kids' kick scooters here: ` +
      `${d.wheels.two} two-wheel, ${d.wheels.three} three-wheel, and what the listings never state.`,
    canonical: KIDS_SCOOTER_WHEELS_PATH,
    keywords: [
      "2 wheel vs 3 wheel kids scooter",
      "kids kick scooter wheel count",
      "best kids scooter for balance",
      "three wheel scooter for toddlers",
    ],
  },
  zh: {
    title: "童车滑板车轮数：两轮还是三轮",
    description:
      `轮数直接决定一台滑板车适合多大的孩子。本文对照本站在售的全部 ${n} 款童用滑板车：` +
      `${d.wheels.two} 款两轮、${d.wheels.three} 款三轮，并指出 listing 从未说明的部分。`,
    canonical: KIDS_SCOOTER_WHEELS_PATH,
    keywords: ["两轮三轮滑板车区别", "儿童滑板车轮数", "幼儿三轮滑板车", "两轮滑板车推荐"],
  },
};

export const kidsScooterSizeSeo = {
  en: {
    title: "Kids Scooter Sizes: Handlebar Height",
    description:
      `Only ${d.totals.withHandleHeight} of ${n} kids' scooter listings publish a handlebar height, none a deck height. ` +
      `Sizes and adjustability, with the gaps stated.`,
    canonical: KIDS_SCOOTER_SIZE_PATH,
    keywords: [
      "kids scooter handlebar height",
      "what size kids scooter",
      "scooter deck height",
      "adjustable kids scooter",
    ],
  },
  zh: {
    title: "童车滑板车尺寸：把手高度",
    description:
      `${n} 款童用滑板车listing 中只有 ${d.totals.withHandleHeight} 款公布了把手高度，踏板高度则是0 款。` +
      `本文整理尺寸、轮径与可调性，并如实说明缺口。`,
    canonical: KIDS_SCOOTER_SIZE_PATH,
    keywords: ["儿童滑板车尺寸", "滑板车把手高度", "滑板车踏板高度", "可调节滑板车"],
  },
};

export const kidsScooterWeightSeo = {
  en: {
    title: "Kids Scooter Weight and Rider Limits",
    description:
      `A scooter's own weight and its rider limit are different numbers. We separate them across ${n} listings ` +
      `and convert the mixed kg/lb units the source uses.`,
    canonical: KIDS_SCOOTER_WEIGHT_PATH,
    keywords: [
      "kids scooter weight",
      "kids scooter weight limit",
      "how much can a kids scooter hold",
      "lightweight kids scooter",
    ],
  },
  zh: {
    title: "童车滑板车重量与承重",
    description:
      `滑板车的自重与承重是两个不同的数字。本文在 ${n} 款 listing 中把两者分开列示，` +
      `并统一换算源数据中混用的公斤与磅。`,
    canonical: KIDS_SCOOTER_WEIGHT_PATH,
    keywords: ["儿童滑板车重量", "滑板车承重", "滑板车能多重", "轻便儿童滑板车"],
  },
};

export const kidsScooterPriceSeo = {
  en: {
    title: "Kids Scooter Prices Compared",
    description:
      `All ${n} kids' kick scooters we publish, priced. We show what the price gap between two-wheel and ` +
      `three-wheel models actually buys.`,
    canonical: KIDS_SCOOTER_PRICE_PATH,
    keywords: [
      "kids scooter price",
      "cheap kids scooter",
      "best value kids scooter",
      "three wheel vs two wheel scooter price",
    ],
  },
  zh: {
    title: "童车滑板车价格对照",
    description:
      `本站在售的全部 ${n} 款童用滑板车价格一览，并说明三轮与两轮之间的价差究竟买到了什么。`,
    canonical: KIDS_SCOOTER_PRICE_PATH,
    keywords: ["儿童滑板车价格", "便宜滑板车", "性价比儿童滑板车", "三轮两轮滑板车差价"],
  },
};

export const kidsScooterAgeSeo = {
  en: {
    title: "Kids Scooter Ages: What Is Stated",
    description:
      `Only ${d.totals.withNumericAge} of ${n} kids' scooter listings attach a number to the age; the rest say ` +
      `"Toddler" or "Youth". Reported verbatim, with what they do agree on.`,
    canonical: KIDS_SCOOTER_AGE_PATH,
    keywords: [
      "what age for a kids scooter",
      "kids scooter age range",
      "toddler scooter age",
      "scooter for 3 year old",
    ],
  },
  zh: {
    title: "童车滑板车适龄：标注实况",
    description:
      `${n} 款 listing 中只有 ${d.totals.withNumericAge} 款的年龄带数字，其余写的是 "Toddler" 或 "Youth"。` +
      `本文原样呈现这些标签，并指出它们真正一致的地方。`,
    canonical: KIDS_SCOOTER_AGE_PATH,
    keywords: ["儿童滑板车适合年龄", "幼儿滑板车几岁", "滑板车年龄范围", "三岁滑板车"],
  },
};

export const kidsScooterSafetySeo = {
  en: {
    title: "Kids Scooter Safety Standards",
    description:
      `All ${n} listings claim ASTM F963 and a CPSC listing — which makes the field uninformative. ` +
      `What a compliance mark proves, and the specs that differ.`,
    canonical: KIDS_SCOOTER_SAFETY_PATH,
    keywords: [
      "kids scooter safety standards",
      "ASTM F963 scooter",
      "CPSC scooter recall",
      "scooter brake safety",
    ],
  },
  zh: {
    title: "童车滑板车安全标准",
    description:
      `${n} 款 listing 全部声称符合 ASTM F963 与 CPSC 登记——这恰恰说明该字段没有区分度。` +
      `本文说明合规标记能证明什么，以及真正有差异的刹车与材质规格。`,
    canonical: KIDS_SCOOTER_SAFETY_PATH,
    keywords: ["儿童滑板车安全标准", "ASTM F963", "滑板车刹车安全", "CPSC 滑板车"],
  },
};

export const kidsScooterFeedbackSeo = {
  en: {
    title: "What Buyers Say About Kids Scooters",
    description:
      `We hold no verbatim reviews, so we counted what we do have: ${n} retailer-written buyer ` +
      `summaries for our kids' scooter listings, and the ratings beside them.`,
    canonical: KIDS_SCOOTER_FEEDBACK_PATH,
    keywords: [
      "kids scooter reviews",
      "what parents say about kids scooters",
      "kids scooter buyer feedback",
      "best rated kids scooter",
    ],
  },
  zh: {
    title: "买家怎么看童车滑板车",
    description:
      `本站没有逐条评论原文，所以聚合了确实有的东西：零售商为我们 ${n} 款童用滑板车listing 撰写的买家摘要，` +
      `以及零售商同时公布的评分。`,
    canonical: KIDS_SCOOTER_FEEDBACK_PATH,
    keywords: ["儿童滑板车评测", "童车滑板车口碑", "滑板车买家评价", "高分儿童滑板车"],
  },
};

export const kidsScooterRecallsSeo = {
  en: {
    title: "Kids Scooter Recalls: CPSC Record",
    description:
      `${kidsScooterRecallVars.total} CPSC recall notices since 2000 name a kick scooter. ` +
      `How many are powered rather than manual, and how that compares to children's bicycles.`,
    canonical: KIDS_SCOOTER_RECALLS_PATH,
    keywords: [
      "kids scooter recall",
      "kick scooter recall CPSC",
      "scooter safety recall",
      "Jetson scooter recall",
    ],
  },
  zh: {
    title: "童用滑板车召回：CPSC 记录",
    description:
      `2000 年以来有 ${kidsScooterRecallVars.total} 起 CPSC 召回通告提及踏板车。本文区分电动与手动，` +
      `并与童车自行车的召回数量对照。`,
    canonical: KIDS_SCOOTER_RECALLS_PATH,
    keywords: ["儿童滑板车召回", "滑板车召回 CPSC", "Jetson 滑板车召回", "滑板车安全召回"],
  },
};

/** path -> seo, consumed by pageKeywords.ts ASSET_SEO_BY_PATH and App.tsx. */
export const KIDS_SCOOTER_SEO_BY_PATH: Record<string, typeof kidsScooterWheelsSeo> = {
  [KIDS_SCOOTER_WHEELS_PATH]: kidsScooterWheelsSeo,
  [KIDS_SCOOTER_SIZE_PATH]: kidsScooterSizeSeo,
  [KIDS_SCOOTER_WEIGHT_PATH]: kidsScooterWeightSeo,
  [KIDS_SCOOTER_PRICE_PATH]: kidsScooterPriceSeo,
  [KIDS_SCOOTER_AGE_PATH]: kidsScooterAgeSeo,
  [KIDS_SCOOTER_SAFETY_PATH]: kidsScooterSafetySeo,
  [KIDS_SCOOTER_FEEDBACK_PATH]: kidsScooterFeedbackSeo,
  [KIDS_SCOOTER_RECALLS_PATH]: kidsScooterRecallsSeo,
};

/** Every scooter asset path, for prerender-pages.ts and the guard lists. */
export const KIDS_SCOOTER_ASSET_PATHS = [
  KIDS_SCOOTER_WHEELS_PATH,
  KIDS_SCOOTER_SIZE_PATH,
  KIDS_SCOOTER_WEIGHT_PATH,
  KIDS_SCOOTER_PRICE_PATH,
  KIDS_SCOOTER_AGE_PATH,
  KIDS_SCOOTER_SAFETY_PATH,
  KIDS_SCOOTER_FEEDBACK_PATH,
  KIDS_SCOOTER_RECALLS_PATH,
];

// re-exported so the page strings stay reachable from one import in App.tsx
export {
  kidsScooterWheelsStrings,
  kidsScooterSizeStrings,
  kidsScooterWeightStrings,
  kidsScooterPriceStrings,
  kidsScooterAgeStrings,
  kidsScooterSafetyStrings,
  kidsScooterFeedbackStrings,
  kidsScooterRecallsStrings,
};