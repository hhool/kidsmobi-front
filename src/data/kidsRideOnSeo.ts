/**
 * SEO for the eight /kids-ride-on-* asset pages.
 *
 * Kept in one module rather than beside each page's strings because the eight
 * title stems share a constraint: check-spa-titles.ts asserts the STEM survives
 * capSeoTitle truncation, and the brand suffix " | Balance Bike Toddler" costs
 * 21 characters of the 65-character budget. That leaves 44 for the stem, and
 * every stem below is inside it. Shortening a stem is the fix when one creeps
 * over — the guard only reports past 65, so a silently truncated stem fails
 * check:spatitles instead of check:titles.
 *
 * Descriptions are held under the 155-character CMS limit for the same reason
 * the rest of the repo holds them there.
 */
import {
  KIDS_RIDE_ON_VOLTAGE_PATH,
  kidsRideOnVoltageStrings,
} from "./kidsRideOnVoltage";
import {
  KIDS_RIDE_ON_WEIGHT_PATH,
  kidsRideOnWeightStrings,
} from "./kidsRideOnWeight";
import {
  KIDS_RIDE_ON_SIZE_PATH,
  kidsRideOnSizeStrings,
} from "./kidsRideOnSize";
import {
  KIDS_RIDE_ON_PRICE_PATH,
  kidsRideOnPriceStrings,
  kidsRideOnPriceGaps,
} from "./kidsRideOnPrice";
import {
  KIDS_RIDE_ON_AGE_PATH,
  kidsRideOnAgeStrings,
  kidsRideOnAgeLabels,
} from "./kidsRideOnAge";
import {
  KIDS_RIDE_ON_SAFETY_PATH,
  kidsRideOnSafetyStrings,
} from "./kidsRideOnSafety";
import {
  KIDS_RIDE_ON_FEEDBACK_PATH,
  kidsRideOnFeedbackStrings,
} from "./kidsRideOnFeedback";
import {
  KIDS_RIDE_ON_RECALLS_PATH,
  kidsRideOnRecallStrings,
  kidsRideOnRecallVars,
} from "./kidsRideOnRecalls";
import { RIDE_ON_DATASET } from "./rideOnData.generated";

const d = RIDE_ON_DATASET;
const n = d.totals.rideOnCars;

export const kidsRideOnVoltageSeo = {
  en: {
    title: "Kids Ride-On Voltage: 6V, 12V, 24V or 36V",
    description:
      `Which battery tier a ride-on car sits in decides its speed, seats and weight. All ${n} cars here, ` +
      `and where each voltage figure actually came from.`,
    canonical: KIDS_RIDE_ON_VOLTAGE_PATH,
    keywords: [
      "kids ride on car voltage",
      "12v vs 24v ride on car",
      "ride on car battery tier",
      "36v kids ride on car",
    ],
  },
  zh: {
    title: "童用电动车电压：6V、12V、24V、36V",
    description:
      `电池档位决定电动车的速度、座位与重量。本文覆盖 ${n} 款在售车，并说明每个电压数字究竟来自哪个字段。`,
    canonical: KIDS_RIDE_ON_VOLTAGE_PATH,
    keywords: ["儿童电动车电压", "12v 24v 电动车区别", "电动车电池档位", "36v 儿童电动车"],
  },
};

export const kidsRideOnWeightSeo = {
  en: {
    title: "Kids Ride-On Weight: Car vs Rider Limit",
    description:
      `A ride-on car's own weight and the rider it is rated for are different numbers. Across ${n} listings ` +
      `we separate them and show the ratio between.`,
    canonical: KIDS_RIDE_ON_WEIGHT_PATH,
    keywords: [
      "kids ride on car weight",
      "ride on car weight limit",
      "how much can a ride on car hold",
      "electric ride on car weight capacity",
    ],
  },
  zh: {
    title: "童用电动车重量：车重与承重对照",
    description:
      `电动车的自重与它标称的乘员承重是两个不同的数字。本文在 ${n} 款 listing 中把两者分开，并给出两者的比值。`,
    canonical: KIDS_RIDE_ON_WEIGHT_PATH,
    keywords: ["儿童电动车重量", "电动车承重", "电动车能坐多重", "电动童车承重上限"],
  },
};

export const kidsRideOnSizeSeo = {
  en: {
    title: "Kids Ride-On Size: Length and Width",
    description:
      `${d.totals.withDimensions} of ${n} ride-on listings publish length, width and height. ` +
      `The sizes, the floor space they take, and a size field that holds something else.`,
    canonical: KIDS_RIDE_ON_SIZE_PATH,
    keywords: [
      "kids ride on car size",
      "electric ride on car dimensions",
      "ride on car size chart",
      "how big is a kids ride on car",
    ],
  },
  zh: {
    title: "童用电动车尺寸：车长与车宽",
    description:
      `${n} 款在售电动车中有 ${d.totals.withDimensions} 款公布长宽高。本文给出尺寸、占地面积，` +
      `并说明那个实际装着别的东西的 Size 字段。`,
    canonical: KIDS_RIDE_ON_SIZE_PATH,
    keywords: ["儿童电动车尺寸", "电动车长宽高", "电动车占地面积", "电动童车多大"],
  },
};

export const kidsRideOnPriceSeo = {
  en: {
    title: "Kids Ride-On Prices Compared",
    description:
      `All ${n} children's ride-on cars, priced — and the $${kidsRideOnPriceGaps().widest.size} gap that leaves nothing ` +
      `in the middle of the range to buy.`,
    canonical: KIDS_RIDE_ON_PRICE_PATH,
    keywords: [
      "kids ride on car price",
      "electric ride on car cost",
      "cheapest kids ride on car",
      "24v ride on car price",
    ],
  },
  zh: {
    title: "童用电动车价格对照",
    description:
      `本站在售的全部 ${n} 款童用电动车价格一览——以及中间那段 $${kidsRideOnPriceGaps().widest.size} 的空档，那里什么也买不到。`,
    canonical: KIDS_RIDE_ON_PRICE_PATH,
    keywords: ["儿童电动车价格", "电动车多少钱", "便宜儿童电动车", "24v 电动车价格"],
  },
};

export const kidsRideOnAgeSeo = {
  en: {
    title: "Kids Ride-On Ages: What Is Stated",
    description:
      `Only ${kidsRideOnAgeLabels().numeric} of ${n} ride-on listings attach a number to the age label. ` +
      `The rest say "Kid". Reported verbatim, plus what the manufacturer field really says.`,
    canonical: KIDS_RIDE_ON_AGE_PATH,
    keywords: [
      "what age for a ride on car",
      "kids ride on car age range",
      "electric ride on car for 3 year old",
      "ride on car age limit",
    ],
  },
  zh: {
    title: "童用电动车适龄：标注实况",
    description:
      `${n} 款 listing 中只有 ${kidsRideOnAgeLabels().numeric} 款的年龄标签带数字，其余写的是 "Kid"。` +
      `本文原样呈现，并说明厂商字段真正说明了什么。`,
    canonical: KIDS_RIDE_ON_AGE_PATH,
    keywords: ["儿童电动车适合年龄", "电动车几岁能开", "电动车年龄范围", "三岁儿童电动车"],
  },
};

export const kidsRideOnSafetySeo = {
  en: {
    title: "Kids Ride-On Safety Standards",
    description:
      `All ${n} listings claim ASTM F963 and a CPSC listing — which makes the field uninformative. ` +
      `What a compliance mark proves, and the safety specs that differ.`,
    canonical: KIDS_RIDE_ON_SAFETY_PATH,
    keywords: [
      "kids ride on car safety standards",
      "ASTM F963 ride on car",
      "ride on car parental remote safety",
      "electric ride on car recall safety",
    ],
  },
  zh: {
    title: "童用电动车安全标准",
    description:
      `${n} 款 listing 全部声称符合 ASTM F963 与 CPSC 登记——这恰恰说明该字段没有区分度。` +
      `本文说明合规标记能证明什么，以及真正有差异的安全规格。`,
    canonical: KIDS_RIDE_ON_SAFETY_PATH,
    keywords: ["儿童电动车安全标准", "ASTM F963 电动车", "电动车家长遥控安全", "电动车安全召回"],
  },
};

export const kidsRideOnFeedbackSeo = {
  en: {
    title: "What Buyers Say About Ride-On Cars",
    description:
      `We hold no verbatim reviews, so we counted what we do have: ${n} retailer-written buyer ` +
      `summaries for our ride-on listings, and the ratings beside them.`,
    canonical: KIDS_RIDE_ON_FEEDBACK_PATH,
    keywords: [
      "kids ride on car reviews",
      "what parents say about ride on cars",
      "electric ride on car buyer feedback",
      "best rated kids ride on car",
    ],
  },
  zh: {
    title: "买家怎么看童用电动车",
    description:
      `本站没有逐条评论原文，所以聚合了确实有的东西：零售商为我们 ${n} 款电动车 listing 撰写的买家摘要，` +
      `以及零售商同时公布的评分。`,
    canonical: KIDS_RIDE_ON_FEEDBACK_PATH,
    keywords: ["儿童电动车评测", "电动车口碑", "电动车买家评价", "高分儿童电动车"],
  },
};

export const kidsRideOnRecallsSeo = {
  en: {
    title: "Kids Ride-On Recalls: CPSC Record",
    description:
      `${kidsRideOnRecallVars.notices} CPSC recall notices since 2000 name a ride-on car, every one with a ` +
      `fire or battery hazard. The record, and the European alerts that match.`,
    canonical: KIDS_RIDE_ON_RECALLS_PATH,
    keywords: [
      "ride on car recall",
      "kids electric car recall CPSC",
      "ride on toy fire hazard recall",
      "Power Wheels recall",
    ],
  },
  zh: {
    title: "童用电动车召回：CPSC 记录",
    description:
      `2000 年以来有 ${kidsRideOnRecallVars.notices} 起 CPSC 召回通告提及童用电动车，且全部涉及火灾或电池危害。` +
      `本文给出记录本身，以及真正对得上的欧洲警报。`,
    canonical: KIDS_RIDE_ON_RECALLS_PATH,
    keywords: ["儿童电动车召回", "电动车召回 CPSC", "电动童车火灾召回", "Power Wheels 召回"],
  },
};

/** path -> seo, consumed by pageKeywords.ts ASSET_SEO_BY_PATH and App.tsx. */
export const KIDS_RIDE_ON_SEO_BY_PATH: Record<string, typeof kidsRideOnVoltageSeo> = {
  [KIDS_RIDE_ON_VOLTAGE_PATH]: kidsRideOnVoltageSeo,
  [KIDS_RIDE_ON_WEIGHT_PATH]: kidsRideOnWeightSeo,
  [KIDS_RIDE_ON_SIZE_PATH]: kidsRideOnSizeSeo,
  [KIDS_RIDE_ON_PRICE_PATH]: kidsRideOnPriceSeo,
  [KIDS_RIDE_ON_AGE_PATH]: kidsRideOnAgeSeo,
  [KIDS_RIDE_ON_SAFETY_PATH]: kidsRideOnSafetySeo,
  [KIDS_RIDE_ON_FEEDBACK_PATH]: kidsRideOnFeedbackSeo,
  [KIDS_RIDE_ON_RECALLS_PATH]: kidsRideOnRecallsSeo,
};

/** Every ride-on asset path, for prerender-pages.ts and the guard lists. */
export const KIDS_RIDE_ON_ASSET_PATHS = [
  KIDS_RIDE_ON_VOLTAGE_PATH,
  KIDS_RIDE_ON_WEIGHT_PATH,
  KIDS_RIDE_ON_SIZE_PATH,
  KIDS_RIDE_ON_PRICE_PATH,
  KIDS_RIDE_ON_AGE_PATH,
  KIDS_RIDE_ON_SAFETY_PATH,
  KIDS_RIDE_ON_FEEDBACK_PATH,
  KIDS_RIDE_ON_RECALLS_PATH,
];

// re-exported so the page strings stay reachable from one import in App.tsx
export {
  kidsRideOnVoltageStrings,
  kidsRideOnWeightStrings,
  kidsRideOnSizeStrings,
  kidsRideOnPriceStrings,
  kidsRideOnAgeStrings,
  kidsRideOnSafetyStrings,
  kidsRideOnFeedbackStrings,
  kidsRideOnRecallStrings,
};
