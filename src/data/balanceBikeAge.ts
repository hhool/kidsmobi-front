// Balance Bike by Age — derived entirely from the CMS product snapshot.
//
// Plan-B Asset 7. This one exists because Search Console told us to: 27 of the
// 68 queries this domain appears for carry an explicit child age, and together
// they account for 63 of 171 impressions — the largest intent cluster on the
// property. Before this page, nothing was organised by the age of the child.
//
// Every figure is computed from src/data/ageData.generated.ts, produced by
// `npm run data:age`. Each age span is quoted from the manufacturer's own
// listing copy, so a reader can check the parse. What the source does not say,
// this page reports as not stated.

import { AGE_DATASET } from "./ageData.generated";

export { AGE_DATASET };

export const AGE_PATH = "/balance-bike-by-age/";

const d = AGE_DATASET;
const cat = d.catalog;
const cov = d.coverage;

/** Index of the band closest to a given age in months. */
export function bandAt(months: number) {
  return cov.bands.reduce((best, band) =>
    Math.abs(band.months - months) < Math.abs(best.months - months) ? band : best,
  );
}

/** Every listing that covers a given age, ordered by review volume. */
export function bikesAt(months: number) {
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

/** "10-36 months" from the raw numbers, without trusting any stored label. */
export function ageSpanLabel(min: number | null, max: number | null): string {
  if (min == null || max == null) return "—";
  return `${min}–${max} months`;
}

export interface AgeStrings {
  eyebrow: string;
  heroTitle: string;
  heroLead: string;
  heroNote: string;
  bandTitle: string;
  bandLead: string;
  colAge: string;
  colFit: string;
  colShare: string;
  dropTitle: string;
  dropLead: string;
  dropBody: string;
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

export const ageStrings: Record<"en" | "zh", AgeStrings> = {
  en: {
    eyebrow: "Balance bike by age",
    heroTitle: "Which balance bikes actually fit at {peakAge} old — and how quickly the choice disappears",
    heroLead:
      "Age is the first thing parents search with, so we organised the catalogue that way. Of the {listed} balance bikes we track, {withAge} publish a manufacturer age range. {atTwo} of them cover a two-year-old; by four years old only {atFour} are still rated for the job. Those counts come from the listings themselves, and every span is quoted below.",
    heroNote: "Age spans are manufacturer claims read from listing copy — not something we measured.",
    bandTitle: "How many listings still fit, age by age",
    bandLead:
      "Each row counts the balance bikes whose stated age range still includes that age. Counted from the {withAge} that publish one; the {unplaced} that do not are listed separately rather than quietly dropped.",
    colAge: "Your child's age",
    colFit: "Bikes still rated for it",
    colShare: "Of the range that covers it",
    dropTitle: "The cliff at three",
    dropLead:
      "Coverage does not taper off gently — it halves in one step. That single step decides how you should shop:",
    dropBody:
      "Between two and three years the number of suitable listings drops from {atTwo} to {atThree}. Nothing extends past {maxMonths} months. So for a child already past three, this is a category you buy for the remaining window rather than one you buy to grow into — and for a one-year-old, most of what is sold as a balance bike is aimed squarely at the toddler year, not the baby year.",
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
    unplacedTitle: "The one listing we could not place",
    unplacedLead:
      "{unplaced} of {listed} publishes no numeric age range at all. Rather than guess a span and quietly include it in the counts above, here it is in the open:",
    unplacedWhy:
      "Its title mentions an age but its specification record carries no numeric range, so we leave it out of every count on this page.",
    quoteTitle: "Where each number comes from",
    quoteLead:
      "Every span below is quoted from the manufacturer's own listing copy, so you can check our reading of it:",
    quoteSourceLabel: "Listing copy, quoted verbatim",
    methodTitle: "How these counts were produced",
    methodBody: [
      "Source: our CMS product specification snapshot ({file}), synced from retailer and manufacturer listings, read on {date}.",
      "Field read: the age field each retailer syncs, which usually repeats the same claim two or three times in different words. The first statement carrying a number is the one parsed.",
      "Deliberately ignored: the top-level ageRange value, which is identical for all {listed} balance bikes and so carries no per-product information.",
      "A listing is counted as fitting an age only when the age falls inside its own stated range. Nothing is interpolated, and no gap between two ranges is bridged.",
      "Re-run with `npm run data:age`. Nothing on this page is typed in by hand.",
    ],
    caveatTitle: "What this data cannot tell you",
    caveatLead: "Four limits worth knowing before you use any of it:",
    caveatBody: [
      "These are manufacturer's own ranges, which are optimistic marketing boundaries, not fit measurements. A bike rated to 24 months does not stop working on day 731 — it means the brand aimed it at that window.",
      "Age is a poor proxy for what actually decides fit: the child's inseam against the lowest seat height. We publish the age data because that is what listings state and what parents search for; it is not a substitute for measuring your child.",
      "Sample size is {listed} balance bikes. Enough to show how coverage changes by age, not enough to judge individual models.",
      "Nothing here is measured by us. Where the decision matters, check the manufacturer's own specification sheet before buying.",
    ],
    sourceLabel: "Source",
  },
  zh: {
    eyebrow: "按年龄选平衡车",
    heroTitle: "按年龄选平衡车：每个年龄段还剩几款真的适用 —— 以及可选范围消失得有多快",
    heroLead:
      "家长搜索的第一个词就是年龄，所以我们按年龄重整了目录。我们收录的 {listed} 款平衡车里，有 {withAge} 款公布了厂家年龄区间；其中 {atTwo} 款覆盖两岁，但到四岁只剩 {atFour} 款仍在标注范围内。这些计数来自商品页自身，每段区间都在下面原文引用。",
    heroNote: "年龄区间是厂家在商品文案中的声称，不是我们实测。",
    bandTitle: "逐个年龄看还有多少款真的适用",
    bandLead:
      "每一行统计「标注适龄区间仍包含该年龄」的平衡车数量。分母是公布了区间的 {withAge} 款；{unplaced} 款未公布的单独列出，而不是悄悄从分母里抹掉。",
    colAge: "孩子年龄",
    colFit: "仍标注适用的车型数",
    colShare: "占标称覆盖范围比例",
    dropTitle: "三岁那道坎",
    dropLead: "覆盖率不是平滑下降的，而是一步腰斩。这一步直接改变了你该怎么买：",
    dropBody:
      "两岁到三岁之间，可选的车型从 {atTwo} 款掉到 {atThree} 款；而且没有任何一款超过 {maxMonths} 个月。所以如果孩子已经过了三岁，这个品类是「买剩下的窗口」而不是「买能成长的」；而对一岁孩子来说，市面上大部分号称平衡车的产品对准的是学步的那一年，并不是更小的那一年。",
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
    unplacedTitle: "有一款我们无法归类",
    unplacedLead:
      "{listed} 款中有 {unplaced} 款完全没有公布数字年龄区间。我们没有替它猜一个区间再悄悄计入上面的统计，而是把它放在明处：",
    unplacedWhy: "它的标题提到了年龄，但规格记录里没有数字区间，因此本页面所有统计都不包含它。",
    quoteTitle: "每个数字来自哪里",
    quoteLead: "下面每段区间都逐字引用厂家商品文案，方便你核对我们的读取是否准确：",
    quoteSourceLabel: "商品文案，原文引用",
    methodTitle: "这些计数是怎么来的",
    methodBody: [
      "来源：本站 CMS 商品规格快照（{file}），同步自零售商与品牌方商品页，读取日期 {date}。",
      "读取字段：零售商同步的适龄字段，通常会用不同措辞重复同一条声明两到三次。取第一条带数字的表述来解析。",
      "刻意忽略：顶层 ageRange 字段 —— 它对所有 {listed} 款平衡车完全相同，因此不携带任何单品信息。",
      "只有当某个年龄落在该车自己标注的区间内，才计入适用。没有做插值，也不会去填补两段区间之间的空档。",
      "重新生成：`npm run data:age`。本页所有数字都不是手写的。",
    ],
    caveatTitle: "这份数据无法告诉你的",
    caveatLead: "使用它之前，有四条限制值得知道：",
    caveatBody: [
      "这些是厂家自己的区间，属于偏乐观的营销边界，不是合身性测量。标称到 24 个月的车不会在第 731 天突然失效——它的意思是品牌把它对准了那个年龄段。",
      "年龄对真正决定合身性的因素来说是个粗糙的代理：真正关键的是孩子的内缝高对最低座高。我们公布年龄数据，是因为这是商品写在明面上的、也是家长在搜的；它不能替代量孩子。",
      "样本量是 {listed} 款平衡车。足以说明覆盖率随年龄如何变化，但不足以评判单款车的优劣。",
      "本页面没有任何数据是实测的。涉及重要决定时，请以品牌官方规格书为准。",
    ],
    sourceLabel: "来源",
  },
};

/** The band with the widest coverage, used as the headline example. */
const peak = cov.bands.reduce((best, band) => (band.fitCount > best.fitCount ? band : best), cov.bands[0]);

/**
 * Template variables for the copy above. Keeping them here means no prose and
 * no number can drift apart.
 */
export function ageVars() {
  return {
    listed: cat.balanceBikesListed,
    withAge: cat.withStatedAgeRange,
    unplaced: cat.withoutStatedAgeRange,
    atTwo: bandAt(24).fitCount,
    atThree: bandAt(36).fitCount,
    atFour: bandAt(48).fitCount,
    peakAge: peak.searchLabel,
    maxMonths: cov.maxStatedMonths,
    file: d.source.exportFile,
    date: d.source.retrievedAt,
  };
}

export const ageSeo = {
  en: {
    title: "Balance Bike by Age: Fits a 2, 3, 4 Year Old",
    description:
      `Age is the first thing parents search with, so we counted it: of ${cat.balanceBikesListed} balance bikes, ` +
      `${bandAt(24).fitCount} are still rated for a 2-year-old but only ${bandAt(48).fitCount} for a 4-year-old. ` +
      `Manufacturer age ranges for every model, quoted verbatim, plus what the numbers cannot tell you.`,
    canonical: AGE_PATH,
    keywords: [
      "balance bike for 2 year old",
      "balance bike for 3 year old",
      "balance bike 18 month old",
      "best balance bike for 4 year old",
      "balance bike age range",
      "balance bike for 1 year old",
      "toddler balance bike by age",
      "when can a toddler use a balance bike",
    ],
  },
  zh: {
    title: "按年龄选平衡车：真正适合 2 岁、3 岁、4 岁的还剩几款",
    description:
      `年龄是家长搜索的第一个词，所以我们把它数了一遍：${cat.balanceBikesListed} 款平衡车中，` +
      `仍标注适合两岁的有 ${bandAt(24).fitCount} 款，适合四岁的只剩 ${bandAt(48).fitCount} 款。` +
      `逐款列出厂家标称适龄区间并原文引用，同时说明这些数字无法告诉你的部分。`,
    canonical: AGE_PATH,
    keywords: [
      "两岁平衡车",
      "三岁平衡车",
      "18个月平衡车",
      "四岁平衡车推荐",
      "平衡车适用年龄",
      "一岁平衡车",
      "按年龄选平衡车",
      "宝宝几岁可以骑平衡车",
    ],
  },
};

export function buildAgeDatasetSchema(pageUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Balance bike age fit by child age — manufacturer-stated ranges",
    description:
      `Coverage of ${cat.balanceBikesListed} balance bikes by child age, using the age range each manufacturer ` +
      `publishes. ${cat.withStatedAgeRange} state a numeric range; ${cat.withoutStatedAgeRange} does not and is excluded ` +
      `from the counts. ${bandAt(24).fitCount} are rated for a 24-month-old, ${bandAt(36).fitCount} for 36 months and ` +
      `${bandAt(48).fitCount} for 48 months. Derived from the CMS product snapshot read on ${d.source.retrievedAt}.`,
    url: pageUrl,
    creator: {
      "@type": "Organization",
      name: "BalanceBikeToddler",
      url: "https://balancebiketoddler.com",
    },
    dateModified: d.source.retrievedAt,
    license: "https://creativecommons.org/licenses/by/4.0/",
    keywords: [
      "balance bike age range",
      "balance bike for 2 year old",
      "balance bike for 3 year old",
      "toddler balance bike by age",
    ],
    variableMeasured: cov.bands.map((band) => ({
      "@type": "PropertyValue",
      name: `Balance bikes still rated for a ${band.searchLabel} old`,
      value: band.fitCount,
      maxValue: cat.withStatedAgeRange,
    })),
    sourceOrganization: {
      "@type": "Organization",
      name: d.source.name,
    },
  };
}
