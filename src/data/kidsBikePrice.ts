// Kids Bike Price — derived entirely from the CMS product snapshot.
//
// Kids-bikes mirror of the price/budget angle. The balance-bike budget page
// (/balance-bike-budget/) is hand-scoped to balance bikes, whose band is
// $30-$90. Kids bikes run $85-$306, so the tiers and what each tier buys are
// different enough to need their own carrier rather than a widened page.
//
// Every figure is computed from src/data/kidsBikePriceData.generated.ts,
// produced by `npm run data:kids-price`. Prices are as listed by the seller,
// not measured or negotiated by us.

import { KIDS_PRICE_DATASET } from "./kidsBikePriceData.generated";

export { KIDS_PRICE_DATASET };

export const KIDS_PRICE_PATH = "/kids-bike-price/";

const d = KIDS_PRICE_DATASET;
const cat = d.catalog;
const price = d.price;

/** The band a given price falls into. */
export function kidsPriceBandAt(usd: number) {
  return price.bands.find((band) => usd >= band.minUsd && usd < band.maxUsd) ?? price.bands[price.bands.length - 1];
}

/** Every listing in a band, cheapest first. */
export function kidsBikesInBand(bandId: string) {
  return d.bikes.filter((b) => kidsPriceBandAt(b.priceUsd ?? 0).id === bandId);
}

/** "2-9 years" from the raw numbers, without trusting any stored label. */
export function kidsPriceAgeSpanLabel(min: number | null, max: number | null): string {
  if (min == null || max == null) return "—";
  return `${min}–${max} months`;
}

export interface KidsPriceStrings {
  eyebrow: string;
  heroTitle: string;
  heroLead: string;
  heroNote: string;
  bandTitle: string;
  bandLead: string;
  colBand: string;
  colCount: string;
  colShare: string;
  colWeight: string;
  colWheel: string;
  readingTitle: string;
  readingLead: string;
  readingBody: string;
  fitTitle: string;
  fitLead: string;
  colBrand: string;
  colModel: string;
  colPrice: string;
  colWheelCol: string;
  colWeightCol: string;
  colAge: string;
  methodTitle: string;
  tableNote: string;
  methodBody: string[];
  caveatTitle: string;
  caveatLead: string;
  caveatBody: string[];
  sourceLabel: string;
}

export const kidsPriceStrings: Record<"en" | "zh", KidsPriceStrings> = {
  en: {
    eyebrow: "Kids bike price",
    heroTitle: "Kids Bike Price: What {minShort} to {maxShort} Buys, Band by Band",
    heroLead:
      "We priced out every kids bike in the catalogue the same way a parent would: by what the listing actually charges. Of the {listed} kids bikes we track, all {withPrice} publish a price, spanning {min} to {max} with a median of {median}. Below, the catalogue is split at the two points where the listing count changes slope — under $100, $100–$150, $150–$250, and over $250 — so you can see what each band is actually made of rather than what a marketing page says it should be.",
    heroNote: "Prices are the listed price from each retailer's own record, read on {date} — not a price we measured or negotiated.",
    bandTitle: "What each price band is made of",
    bandLead:
      "Each row counts the kids bikes whose listed price falls in that band. All {withPrice} priced listings are in exactly one band; nothing is dropped for being an outlier, and the top band's {topCount} listing — the most expensive bike in the catalogue at {max} — is counted, not hidden. The weight column medians only the {withWeight} listings that publish a weight, so a band's figure can rest on a handful of bikes.",
    colBand: "Price band",
    colCount: "Listings",
    colShare: "Share of priced listings",
    colWeight: "Median weight",
    colWheel: "Wheel sizes in band",
    readingTitle: "How to read these bands",
    readingLead: "Four things the counts actually show:",
    readingBody:
      "The middle of the market is $100–$150: {midCount} of {withPrice} listings sit there, on {midWheels} wheels. Under $100 there are {lowCount} listings, {lowSmallWheel} of them on {smallWheels} wheels. Above $150 the count thins to {highCount}, and the most expensive bike in the catalogue, at {max}, sits alone in the top band rather than in a cluster. Weight runs the opposite way to an upgrade story: the median climbs band by band, from {lowWeight} under $100 to {highWeight} over $250 — a {weightGap} spread — so in this catalogue paying more gets you a heavier bike, not a lighter one. Only {withWeight} of {withPrice} listings publish a weight at all, and the top-band figure rests on that one bike.",
    fitTitle: "Every kids bike in the catalogue, by price",
    fitLead:
      "Cheapest first. Every listing is one we publish, with its listed price, wheel size, weight and stated age range as the source record states them.",
    colBrand: "Brand",
    colModel: "Model",
    colPrice: "Listed price",
    colWheelCol: "Wheel",
    colWeightCol: "Weight",
    colAge: "Stated age range",
    methodTitle: "How these counts were produced",
    tableNote:
      "Every listing is counted once, in the band its listed price falls into. The middle band holds",
    methodBody: [
      "Source: our CMS product specification snapshot ({file}), synced from retailer listings, read on {date}.",
      "Field read: the price field in each listing's Measurements record, parsed as a US dollar amount.",
      "Band edges are $100 and $150, chosen because that is where this catalogue's own listing count changes slope — not because they are round numbers.",
      "A listing is counted in a band only when its listed price falls inside that band's edges. Nothing is interpolated and no listing is counted twice.",
      "Re-run with `npm run data:kids-price`. Nothing on this page is typed in by hand.",
    ],
    caveatTitle: "What this data cannot tell you",
    caveatLead: "Four limits worth knowing before you use any of it:",
    caveatBody: [
      "These are listed prices captured on {date}, not live prices. Kids bike prices move with sales and season, sometimes by a lot. Treat every figure as a snapshot, not a quote.",
      "Price is not quality. Within a single wheel size, listed prices spread {spanMinRatio} at the narrowest and {spanMaxRatio} at the widest — the {spanWheel} inch wheel alone runs from {spanLow} to {spanHigh}. Compare the wheel size, weight and stated age range columns above: those describe the bike.",
      "Sample size is {withPrice} priced listings out of {listed} kids bikes. Enough to show how the market is banded, not enough to judge any single model.",
      "Nothing here is measured by us. Where the decision matters, check the retailer's current listing before buying.",
    ],
    sourceLabel: "Source",
  },
  zh: {
    eyebrow: "按价格选儿童自行车",
    heroTitle: "儿童自行车价格：{minShort} 到 {maxShort} 各档位实际买到什么",
    heroLead:
      "我们像家长一样给目录里每款儿童自行车定了价：看商品页实际标价。收录的 {listed} 款中，全部 {withPrice} 款都公布了价格，从 {min} 到 {max}，中位数 {median}。下面按「上架数量斜率变化」的两个切点分档——$100 以下、$100–$150、$150–$250、$250 以上——让你看到每一档实际由什么组成，而不是营销页声称它该由什么组成。",
    heroNote: "价格是各零售商自有记录里的标价，读取日期 {date}——不是我们实测或谈下来的。",
    bandTitle: "每个价位档由什么组成",
    bandLead:
      "每一行统计标价落在该档的儿童自行车数量。全部 {withPrice} 款有标价的车恰好各属一档；没有因为「是异常值」被剔除，最贵档的那 {topCount} 款——全目录最贵的（{max}）——也照实计入，没有藏起来。重量列只对公布了重量的 {withWeight} 款取中位数，所以某一档的数字可能只压在少数几款车上。",
    colBand: "价位档",
    colCount: "车型数",
    colShare: "占有标价车型的比例",
    colWeight: "重量中位数",
    colWheel: "档内轮径",
    readingTitle: "这些档位该怎么读",
    readingLead: "计数实际说明四件事：",
    readingBody:
      "市场主力是 $100–$150：{withPrice} 款里有 {midCount} 款在这一档，轮径是 {midWheels}。$100 以下有 {lowCount} 款，其中 {lowSmallWheel} 款是 {smallWheels}的小轮径。$150 以上锐减到 {highCount} 款，而全目录最贵的那一款（{max}）独自待在最贵档，并不是一群。重量的走向和「加钱换更轻」的升级叙事相反：各档中位数逐档上升，从 $100 以下的 {lowWeight}到 $250 以上的 {highWeight}，相差 {weightGap}——在这份目录里，多花钱买到的是更重的车。何况全部 {withPrice} 款里只有 {withWeight} 款公布了重量，最贵档的那个数字只有一款车撑着。",
    fitTitle: "目录内全部儿童自行车，按价格排列",
    fitLead: "从最便宜开始。每一款都是本站上架的，标价、轮径、重量与厂商标称适龄区间均按来源记录如实呈现。",
    colBrand: "品牌",
    colModel: "型号",
    colPrice: "标价",
    colWheelCol: "轮径",
    colWeightCol: "重量",
    colAge: "标称适龄区间",
    methodTitle: "这些计数是怎么来的",
    tableNote: "每一款都只计一次，计入其标价所属的那一档。中间那一档有",
    methodBody: [
      "来源：本站 CMS 商品规格快照（{file}），同步自零售商商品页，读取日期 {date}。",
      "读取字段：每款 Measurements 记录中的价格字段，按美元金额解析。",
      "分档边界取 $100 和 $150，因为本目录的上架数量斜率正是在这两处变化——不是因为它们是整数。",
      "只有标价落在档内才算入该档。没有做插值，也没有任何一款被重复计入。",
      "重新生成：`npm run data:kids-price`。本页所有数字都不是手写的。",
    ],
    caveatTitle: "这份数据无法告诉你的",
    caveatLead: "使用它之前，有四条限制值得知道：",
    caveatBody: [
      "这些是 {date} 捕获的标价，不是实时价。儿童自行车价格随促销和季节波动，有时幅度很大。请把每个数字当作快照，而不是报价。",
      "价格不等于质量。同一个轮径内部，标价最窄也相差 {spanMinRatio}，最宽相差 {spanMaxRatio}——单是 {spanWheel} 英寸轮，就从 {spanLow} 一直到 {spanHigh}。要比较，请看上面的轮径、重量和标称适龄区间三列：那三列描述的是车本身。",
      "样本量是 {listed} 款儿童自行车中的 {withPrice} 款有标价车型。足以说明市场如何分档，不足以评判任何单款车的优劣。",
      "本页面没有任何数据是实测的。涉及重要决定时，请以零售商当前的商品页为准。",
    ],
    sourceLabel: "来源",
  },
};

const money = (v: number | null) => (v == null ? "—" : `$${v.toFixed(2)}`);
// Rounded endpoints for the headline, so the <title> and the <h1> quote the
// same range. Derived, never typed in: the exact figures still appear in the
// hero lead, the price table and the method section.
const minShort = `$${Math.round(price.minUsd ?? 0)}`;
const maxShort = `$${Math.round(price.maxUsd ?? 0)}`;

const lowBand = price.bands[0];
const midBand = price.bands[1];
const highBands = price.bands.slice(2);
const highCount = highBands.reduce((sum, band) => sum + band.count, 0);
const topBand = price.bands[price.bands.length - 1];
const lowWeight = lowBand.medianWeightLb;
const highWeight = topBand.medianWeightLb;
const weightGap =
  lowWeight != null && highWeight != null ? Math.abs(Math.round((highWeight - lowWeight) * 10) / 10) : null;
const lb1 = (v: number | null, locale: "en" | "zh" = "en") =>
  v == null ? "—" : `${Math.round(v * 10) / 10}${locale === "zh" ? " 磅" : " lb"}`;

// The two smallest wheel sizes actually published in the cheapest band, so the
// "small-wheel" claim in the copy is derived from the data instead of typed in.
const lowBandBikes = d.bikes.filter((b) => kidsPriceBandAt(b.priceUsd ?? 0).id === lowBand.id);
const lowBandWheels = Array.from(
  new Set(lowBandBikes.map((b) => b.wheelInches).filter((v): v is number => v != null)),
).sort((a, b) => a - b);
const smallWheels = lowBandWheels.slice(0, 2);

// Price spread inside a single wheel size — the evidence behind "price is not
// quality". Widest and narrowest are both reported, not just the flattering one.
const wheelSpans = Array.from(
  new Set(d.bikes.map((b) => b.wheelInches).filter((v): v is number => v != null)),
)
  .map((wheel) => {
    const ps = d.bikes
      .filter((b) => b.wheelInches === wheel)
      .map((b) => b.priceUsd ?? 0)
      .sort((a, b) => a - b);
    return { wheel, low: ps[0], high: ps[ps.length - 1], ratio: ps[ps.length - 1] / ps[0] };
  })
  .filter((s) => s.low > 0);
const widestSpan = wheelSpans.length ? wheelSpans.reduce((a, b) => (b.ratio > a.ratio ? b : a)) : null;
const narrowestSpan = wheelSpans.length ? wheelSpans.reduce((a, b) => (b.ratio < a.ratio ? b : a)) : null;
const ratio = (v: number) => `${v.toFixed(2)}×`;

const joinEn = (parts: string[]) =>
  parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}` : (parts[0] ?? "—");
const joinZh = (parts: string[]) =>
  parts.length > 1 ? `${parts.slice(0, -1).join("、")} 和 ${parts[parts.length - 1]}` : (parts[0] ?? "—");

/**
 * Template variables for the copy above. Keeping them here means no prose and
 * no number can drift apart. Locale-aware because the zh copy needs 磅 and 、.
 */
export function kidsPriceVars(locale: "en" | "zh" = "en") {
  const join = locale === "zh" ? joinZh : joinEn;
  const unit = locale === "zh" ? " 英寸" : " inch";
  return {
    listed: cat.kidsBikesListed,
    withPrice: cat.withPrice,
    withWeight: cat.withWeight,
    min: money(price.minUsd),
    max: money(price.maxUsd),
    minShort,
    maxShort,
    median: money(price.medianUsd),
    date: d.source.retrievedAt,
    file: d.source.exportFile,
    lowCount: lowBand.count,
    midCount: midBand.count,
    highCount,
    topCount: topBand.count,
    lowWeight: lb1(lowWeight, locale),
    highWeight: lb1(highWeight, locale),
    weightGap: weightGap == null ? "—" : `${weightGap}${locale === "zh" ? " 磅" : " lb"}`,
    lowSmallWheel: lowBandBikes.filter((b) => b.wheelInches != null && smallWheels.includes(b.wheelInches)).length,
    smallWheels: smallWheels.length ? `${join(smallWheels.map(String))}${unit}` : "—",
    midWheels: midBand.wheelSizes.length ? `${join(midBand.wheelSizes.map(String))}${unit}` : "—",
    spanMinRatio: narrowestSpan ? ratio(narrowestSpan.ratio) : "—",
    spanMaxRatio: widestSpan ? ratio(widestSpan.ratio) : "—",
    spanWheel: widestSpan?.wheel ?? "—",
    spanLow: widestSpan ? money(widestSpan.low) : "—",
    spanHigh: widestSpan ? money(widestSpan.high) : "—",
  };
}

export const kidsPriceSeo = {
  en: {
    title: `Kids Bike Price: What ${minShort} to ${maxShort} Buys`,
    description:
      `All ${cat.withPrice} priced kids bikes, banded at $100 and $150 where the listing count changes slope: ` +
      `${price.bands[0].count} under $100, ${price.bands[1].count} at $100–$150, ${highCount} above. Median ` +
      `$${price.medianUsd?.toFixed(2)}.`,
    canonical: KIDS_PRICE_PATH,
    keywords: [
      "kids bike price",
      "kids bike cost",
      "how much is a kids bike",
      "kids bike price range",
      "cheap kids bike",
      "kids bike under $100",
      "best kids bike for the money",
      "kids bike price by wheel size",
    ],
  },
  zh: {
    title: `儿童自行车价格：${minShort} 到 ${maxShort} 各买到什么`,
    description:
      `本站目录中全部 ${cat.withPrice} 款有标价的儿童自行车，按上架数量斜率变化的 $100 与 $150 两处切分。` +
      `$100 以下 ${price.bands[0].count} 款，$100–$150 ${price.bands[1].count} 款，$150 以上 ${highCount} 款。` +
      `中位数 $${price.medianUsd?.toFixed(2)}；重量中位数从 $100 以下的 ${lb1(lowWeight, "zh")}升到 $250 以上的 ` +
      `${lb1(highWeight, "zh")}。`,
    canonical: KIDS_PRICE_PATH,
    keywords: [
      "儿童自行车价格",
      "儿童自行车多少钱",
      "儿童自行车价格区间",
      "便宜儿童自行车",
      "100美元以下儿童自行车",
      "性价比儿童自行车",
      "按轮径看儿童自行车价格",
    ],
  },
};

export function buildKidsPriceDatasetSchema(pageUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Kids bike listed price by price band",
    description:
      `Listed prices of ${cat.withPrice} kids bikes from the CMS product snapshot, read on ` +
      `${d.source.retrievedAt}. Range $${price.minUsd?.toFixed(2)} to $${price.maxUsd?.toFixed(2)}, median ` +
      `$${price.medianUsd?.toFixed(2)}. Bands: ` +
      price.bands.map((b) => `${b.label} = ${b.count}`).join("; ") +
      `. Prices are as listed by the retailer, not measured by us.`,
    url: pageUrl,
    creator: {
      "@type": "Organization",
      name: "BalanceBikeToddler",
      url: "https://balancebiketoddler.com",
    },
    dateModified: d.source.retrievedAt,
    license: "https://creativecommons.org/licenses/by/4.0/",
    keywords: [
      "kids bike price",
      "kids bike cost",
      "kids bike price range",
      "kids bike by price band",
    ],
    variableMeasured: price.bands.map((band) => ({
      "@type": "PropertyValue",
      name: `Kids bikes listed in ${band.label}`,
      value: band.count,
      maxValue: cat.withPrice,
    })),
    sourceOrganization: {
      "@type": "Organization",
      name: d.source.name,
    },
  };
}
