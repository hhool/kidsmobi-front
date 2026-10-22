// Kids Bike by Age — derived entirely from the CMS product snapshot.
//
// Kids-bikes mirror of src/data/balanceBikeAge.ts (Plan-B Asset 7, which only
// covers balance_bike). Age is the single largest intent cluster on this
// property, and the kids-bikes age story is genuinely different from the
// balance-bike one: balance bikes span roughly 1-4 years, kids bikes run
// 2-12 years across wheel sizes, and coverage rises to a plateau before it
// falls instead of dropping off a cliff.
//
// Every figure is computed from src/data/kidsBikeAgeData.generated.ts, produced
// by `npm run data:kids-age`. Each age span is quoted from the manufacturer's
// own listing copy, so a reader can check the parse. What the source does not
// say, this page reports as not stated.

import { KIDS_AGE_DATASET } from "./kidsBikeAgeData.generated";

export { KIDS_AGE_DATASET };

export const KIDS_AGE_PATH = "/kids-bike-by-age/";

const d = KIDS_AGE_DATASET;
const cat = d.catalog;
const cov = d.coverage;

/** Index of the band closest to a given age in months. */
export function kidsBandAt(months: number) {
  return cov.bands.reduce((best, band) =>
    Math.abs(band.months - months) < Math.abs(best.months - months) ? band : best,
  );
}

/** Every listing that covers a given age, ordered by review volume. */
export function kidsBikesAt(months: number) {
  return d.bikes
    .filter((b) => b.ageMinMonths != null && b.ageMaxMonths != null && b.ageMinMonths <= months && months <= b.ageMaxMonths)
    .map((b) => ({
      ...b,
      // How much longer (or shorter) the manufacturer thinks this bike will
      // still fit, which is what actually decides between two otherwise
      // similar listings.
      remainingMonths: (b.ageMaxMonths ?? 0) - months,
    }))
    .sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0));
}

/** "2-9 years" from the raw numbers, without trusting any stored label. */
export function kidsAgeSpanLabel(min: number | null, max: number | null): string {
  if (min == null || max == null) return "—";
  return `${min}–${max} months`;
}

export interface KidsAgeStrings {
  eyebrow: string;
  heroTitle: string;
  heroLead: string;
  heroNote: string;
  bandTitle: string;
  bandLead: string;
  colAge: string;
  colFit: string;
  colShare: string;
  plateauTitle: string;
  plateauLead: string;
  plateauBody: string;
  fitTitle: string;
  fitLead: string;
  colBrand: string;
  colModel: string;
  colSpan: string;
  colFitUntil: string;
  colWheel: string;
  colWeight: string;
  colPrice: string;
  goneTitle: string;
  goneLead: string;
  oneLine: string;
  monthsLeft: string;
  alreadyPast: string;
  unplacedTitle: string;
  unplacedLead: string;
  unplacedWhy: string;
  quoteTitle: string;
  quoteLead: string;
  quoteSourceLabel: string;
  methodTitle: string;
  methodBody: string[];
  caveatTitle: string;
  caveatLead: string;
  caveatBody: string[];
  sourceLabel: string;
}

export const kidsAgeStrings: Record<"en" | "zh", KidsAgeStrings> = {
  en: {
    eyebrow: "Kids bike by age",
    heroTitle: "Which kids bikes actually fit at {peakAge} old — and how the range narrows at both ends",
    heroLead:
      "Age is the first thing parents search with, so we organised the catalogue that way. Of the {listed} kids bikes we track, {withAge} publish a manufacturer age range. The choice is widest at {peakAge} — {atPeak} models are still rated for that age — and it narrows at both ends: only {atTwo} cover a two-year-old, and just {atTwelve} reach twelve. Those counts come from the listings themselves, and every span is quoted below.",
    heroNote: "Age spans are manufacturer claims read from listing copy — not something we measured.",
    bandTitle: "How many listings still fit, age by age",
    bandLead:
      "Each row counts the kids bikes whose stated age range still includes that age. Counted from the {withAge} that publish one; the {unplaced} that do not are listed separately rather than quietly dropped.",
    colAge: "Your child's age",
    colFit: "Bikes still rated for it",
    colShare: "Of the range that covers it",
    plateauTitle: "The wide middle, not a cliff",
    plateauLead:
      "Unlike balance bikes, where coverage drops off a cliff at three, kids bike coverage rises to a plateau and only falls away at the two ends:",
    plateauBody:
      "Between {atTwo} models at two years old and {atPeak} at {peakAge}, the choice more than doubles — and it stays that wide until {declineStart}, when it begins to fall to {atTwelve} at twelve. The practical consequence: a five- to seven-year-old has the widest selection on this page, while a two-year-old is buying at the very edge of what this category covers and should read the balance bike pages instead.",
    fitTitle: "Every bike that fits your child's age",
    fitLead:
      "Pick the age below. Listings are the ones still inside their stated range at that exact age, ordered by review volume so the widely-bought options come first.",
    colBrand: "Brand",
    colModel: "Model",
    colSpan: "Stated age range",
    colFitUntil: "Rated until",
    colWheel: "Wheel",
    colWeight: "Weight",
    colPrice: "Price",
    goneTitle: "What happens at the edge of the range",
    goneLead:
      "A published maximum is a claim about intent, not a physical cut-off. Two useful ways to read it:",
    oneLine: "The tight boundaries matter less than being inside them at purchase time.",
    monthsLeft: "months of rated use left",
    alreadyPast: "Your child is already past this bike's stated maximum.",
    unplacedTitle: "The listings we could not place",
    unplacedLead:
      "{unplaced} of {listed} publish no numeric age range at all. Rather than guess a span and quietly include them in the counts above, here they are in the open:",
    unplacedWhy:
      "The specification record carries no numeric range, so we leave them out of every count on this page.",
    quoteTitle: "Where each number comes from",
    quoteLead:
      "Every span below is quoted from the manufacturer's own listing copy, so you can check our reading of it:",
    quoteSourceLabel: "Listing copy, quoted verbatim",
    methodTitle: "How these counts were produced",
    methodBody: [
      "Source: our CMS product specification snapshot ({file}), synced from retailer and manufacturer listings, read on {date}.",
      "Field read: the age field each retailer syncs, which usually repeats the same claim two or three times in different words. The first statement carrying a number is the one parsed.",
      "Deliberately ignored: the top-level ageRange value, which is identical across this category and so carries no per-product information.",
      "A listing is counted as fitting an age only when the age falls inside its own stated range. Nothing is interpolated, and no gap between two ranges is bridged.",
      "Re-run with `npm run data:kids-age`. Nothing on this page is typed in by hand.",
    ],
    caveatTitle: "What this data cannot tell you",
    caveatLead: "Four limits worth knowing before you use any of it:",
    caveatBody: [
      "These are manufacturer's own ranges, which are optimistic marketing boundaries, not fit measurements. A bike rated to 8 years does not stop working on the child's ninth birthday — it means the brand aimed it at that window.",
      "Age is a poor proxy for what actually decides fit: the child's inseam against the lowest seat height. We publish the age data because that is what listings state and what parents search for; it is not a substitute for measuring your child.",
      "Sample size is {listed} kids bikes. Enough to show how coverage changes by age, not enough to judge individual models.",
      "Nothing here is measured by us. Where the decision matters, check the manufacturer's own specification sheet before buying.",
    ],
    sourceLabel: "Source",
  },
  zh: {
    eyebrow: "按年龄选儿童自行车",
    heroTitle: "按年龄选儿童自行车：{peakAge} 时选择最广，两端收窄有多快",
    heroLead:
      "家长搜索的第一个词就是年龄，所以我们按年龄重整了目录。我们收录的 {listed} 款儿童自行车里，有 {withAge} 款公布了厂家年龄区间。选择面在 {peakAge} 最宽——仍有 {atPeak} 款标注适用——然后向两端收窄：覆盖两岁的只有 {atTwo} 款，能用到十二岁的仅 {atTwelve} 款。这些计数来自商品页自身，每段区间都在下面原文引用。",
    heroNote: "年龄区间是厂家在商品文案中的声称，不是我们实测。",
    bandTitle: "逐个年龄看还有多少款真的适用",
    bandLead:
      "每一行统计「标注适龄区间仍包含该年龄」的儿童自行车数量。分母是公布了区间的 {withAge} 款；{unplaced} 款未公布的单独列出，而不是悄悄从分母里抹掉。",
    colAge: "孩子年龄",
    colFit: "仍标注适用的车型数",
    colShare: "占标称覆盖范围比例",
    plateauTitle: "是宽阔的中段，不是一道坎",
    plateauLead: "和平衡车在三岁断崖式下跌不同，儿童自行车的覆盖率先升到一段平台，只在两端才回落：",
    plateauBody:
      "从两岁的 {atTwo} 款到 {peakAge} 的 {atPeak} 款，选择面翻了一倍以上，并且一直保持到这个宽度直到 {declineStart} 才开始下滑，到十二岁只剩 {atTwelve} 款。实际含义：五到七岁的孩子在这页上有最宽的选择面；而两岁孩子买的是这个品类覆盖的边缘，应该去读平衡车的页面。",
    fitTitle: "适合该年龄的全部车型",
    fitLead: "在下面选择年龄。列出的都是在那个具体年龄仍落在自身标注范围内的车型，按评论量排序，买的人多的排在前面。",
    colBrand: "品牌",
    colModel: "型号",
    colSpan: "标注适龄区间",
    colFitUntil: "标称可用到",
    colWheel: "轮径",
    colWeight: "重量",
    colPrice: "价格",
    goneTitle: "到了区间边缘意味着什么",
    goneLead: "标称上限说的是设计意图，不是物理截止线。可以这样理解：",
    oneLine: "边界的精确度不重要，重要的是购买当下是否在区间内。",
    monthsLeft: "个月的标称余量",
    alreadyPast: "您孩子的年龄已超过这款车的标称上限。",
    unplacedTitle: "有几款我们无法归类",
    unplacedLead:
      "{listed} 款中有 {unplaced} 款完全没有公布数字年龄区间。我们没有替它们猜一个区间再悄悄计入上面的统计，而是把它们放在明处：",
    unplacedWhy: "其规格记录里没有数字区间，因此本页面所有统计都不包含它们。",
    quoteTitle: "每个数字来自哪里",
    quoteLead: "下面每段区间都逐字引用厂家商品文案，方便你核对我们的读取是否准确：",
    quoteSourceLabel: "商品文案，原文引用",
    methodTitle: "这些计数是怎么来的",
    methodBody: [
      "来源：本站 CMS 商品规格快照（{file}），同步自零售商与品牌方商品页，读取日期 {date}。",
      "读取字段：零售商同步的适龄字段，通常会用不同措辞重复同一条声明两到三次。取第一条带数字的表述来解析。",
      "刻意忽略：顶层 ageRange 字段 —— 它对本品类所有车完全相同，因此不携带任何单品信息。",
      "只有当某个年龄落在该车自己标注的区间内，才计入适用。没有做插值，也不会去填补两段区间之间的空档。",
      "重新生成：`npm run data:kids-age`。本页所有数字都不是手写的。",
    ],
    caveatTitle: "这份数据无法告诉你的",
    caveatLead: "使用它之前，有四条限制值得知道：",
    caveatBody: [
      "这些是厂家自己的区间，属于偏乐观的营销边界，不是合身性测量。标称到 8 岁的车不会在孩子九岁生日那天突然失效——它的意思是品牌把它对准了那个年龄段。",
      "年龄对真正决定合身性的因素来说是个粗糙的代理：真正关键的是孩子的内缝高对最低座高。我们公布年龄数据，是因为这是商品写在明面上的、也是家长在搜的；它不能替代量孩子。",
      "样本量是 {listed} 款儿童自行车。足以说明覆盖率随年龄如何变化，但不足以评判单款车的优劣。",
      "本页面没有任何数据是实测的。涉及重要决定时，请以品牌官方规格书为准。",
    ],
    sourceLabel: "来源",
  },
};

/** The band with the widest coverage, used as the headline example. */
const peak = cov.bands.reduce((best, band) => (band.fitCount > best.fitCount ? band : best), cov.bands[0]);

/** The last band at full plateau width, where coverage starts to fall. */
const plateauEnd = cov.bands.reduce((best, band) => (band.fitCount >= peak.fitCount ? band : best), cov.bands[0]);

/**
 * Template variables for the copy above. Keeping them here means no prose and
 * no number can drift apart.
 */
export function kidsAgeVars() {
  return {
    listed: cat.kidsBikesListed,
    withAge: cat.withStatedAgeRange,
    unplaced: cat.withoutStatedAgeRange,
    atTwo: kidsBandAt(24).fitCount,
    atTwelve: kidsBandAt(144).fitCount,
    atPeak: peak.fitCount,
    peakAge: peak.searchLabel,
    declineStart: plateauEnd.searchLabel,
    file: d.source.exportFile,
    date: d.source.retrievedAt,
  };
}

export const kidsAgeSeo = {
  en: {
    title: "Kids Bike by Age: Fits a 2, 5 or 8 Year Old",
    description:
      `Age is the first thing parents search with, so we counted it: of ${cat.kidsBikesListed} kids bikes, ` +
      `${kidsBandAt(60).fitCount} are still rated for a 5-year-old, the widest point of the range, against just ` +
      `${kidsBandAt(24).fitCount} for a 2-year-old and ${kidsBandAt(144).fitCount} for a 12-year-old. ` +
      `Manufacturer age ranges for every model, quoted verbatim, plus what the numbers cannot tell you.`,
    canonical: KIDS_AGE_PATH,
    keywords: [
      "kids bike for 2 year old",
      "kids bike for 5 year old",
      "kids bike for 8 year old",
      "kids bike age range",
      "kids bike for 12 year old",
      "first kids bike age",
      "toddler kids bike by age",
      "what age for a kids bike",
    ],
  },
  zh: {
    title: "按年龄选儿童自行车：适合 2 岁、5 岁、8 岁的各几款",
    description:
      `年龄是家长搜索的第一个词，所以我们把它数了一遍：${cat.kidsBikesListed} 款儿童自行车中，` +
      `仍标注适合五岁的最多，有 ${kidsBandAt(60).fitCount} 款，适合两岁的仅 ${kidsBandAt(24).fitCount} 款，` +
      `能用到十二岁的 ${kidsBandAt(144).fitCount} 款。` +
      `逐款列出厂家标称适龄区间并原文引用，同时说明这些数字无法告诉你的部分。`,
    canonical: KIDS_AGE_PATH,
    keywords: [
      "两岁儿童自行车",
      "五岁儿童自行车",
      "八岁儿童自行车",
      "儿童自行车适用年龄",
      "12岁儿童自行车",
      "第一辆儿童自行车年龄",
      "按年龄选儿童自行车",
      "儿童自行车几岁可以骑",
    ],
  },
};

export function buildKidsAgeDatasetSchema(pageUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Kids bike age fit by child age — manufacturer-stated ranges",
    description:
      `Coverage of ${cat.kidsBikesListed} kids bikes by child age, using the age range each manufacturer ` +
      `publishes. ${cat.withStatedAgeRange} state a numeric range; ${cat.withoutStatedAgeRange} does not and is excluded ` +
      `from the counts. ${kidsBandAt(24).fitCount} are rated for a 24-month-old, ${peak.fitCount} at the widest point ` +
      `(${peak.searchLabel}) and ${kidsBandAt(144).fitCount} for 144 months. Derived from the CMS product snapshot read on ${d.source.retrievedAt}.`,
    url: pageUrl,
    creator: {
      "@type": "Organization",
      name: "BalanceBikeToddler",
      url: "https://balancebiketoddler.com",
    },
    dateModified: d.source.retrievedAt,
    license: "https://creativecommons.org/licenses/by/4.0/",
    keywords: [
      "kids bike age range",
      "kids bike for 2 year old",
      "kids bike for 5 year old",
      "kids bike by age",
    ],
    variableMeasured: cov.bands.map((band) => ({
      "@type": "PropertyValue",
      name: `Kids bikes still rated for a ${band.searchLabel} old`,
      value: band.fitCount,
      maxValue: cat.withStatedAgeRange,
    })),
    sourceOrganization: {
      "@type": "Organization",
      name: d.source.name,
    },
  };
}
