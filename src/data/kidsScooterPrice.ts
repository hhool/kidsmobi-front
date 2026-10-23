/**
 * /kids-scooter-price/ — what the seven cost, and what the money buys.
 *
 * All 7 listings carry a price, so this is the one kids-scooter page with no
 * coverage gap to lead with. Its finding is a price/feature relationship instead:
 * the three-wheel scooters that parents buy for beginners are the cheap half of
 * the catalogue, and the money in this category goes into a scooter rated for a
 * rider several years older than the one learning to stand on it.
 *
 * Prices are what the CMS snapshot recorded on the generation date. They are
 * not live retailer prices and the page says so — the same caveat the other
 * asset pages in this repo carry.
 */
import { Tags, TrendingUp, AlertTriangle, Table2 } from "lucide-react";
import { SCOOTER_DATASET } from "./scooterData.generated";
import { rosterLabel, type ScooterColumn } from "../components/ScooterAssetPage";

export { SCOOTER_DATASET };
export const KIDS_SCOOTER_PRICE_PATH = "/kids-scooter-price/";

const d = SCOOTER_DATASET;
const total = d.totals.kidsScooters;

const priced = d.rows.filter((r) => r.price !== null).sort((a, b) => (a.price as number) - (b.price as number));
const cheapest = priced[0];
const dearest = priced[priced.length - 1];
const median = priced[Math.floor(priced.length / 2)];

const threeWheel = priced.filter((r) => r.wheelCount === 3);
const twoWheel = priced.filter((r) => r.wheelCount === 2);
const medianOf = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

/** Does the wheel layout — the thing parents choose on — track the price? */
export const kidsScooterPriceByWheels = () => ({
  threeMedian: medianOf(threeWheel.map((r) => r.price as number)),
  twoMedian: medianOf(twoWheel.map((r) => r.price as number)),
  dearestIsTwo: dearest?.wheelCount === 2,
  cheapestIsThree: cheapest?.wheelCount === 3,
});

export interface ScooterPriceStrings {
  eyebrow: string;
  navLabel: string;
  h1: string;
  lead: string;
  bandTitle: string;
  bandLead: string;
  wheelsTitle: string;
  wheelsLead: string;
  featureTitle: string;
  featureLead: string;
  caveatTitle: string;
  caveatBody: string[];
  rosterTitle: string;
  rosterLead: string;
  colBrand: string;
  colModel: string;
  colPrice: string;
  colWheels: string;
  colRating: string;
  colReviews: string;
  notStated: string;
  methodTitle: string;
  methodBody: string[];
}

export const kidsScooterPriceStrings: Record<"en" | "zh", ScooterPriceStrings> = {
  en: {
    eyebrow: "Plan-B asset · price",
    navLabel: "Price and value",
    h1: `Kids Scooter Prices: All ${total} on Record`,
    lead: `Every listing here has a price, which makes this the only kids-scooter page with nothing missing. They run from $${cheapest?.price?.toFixed(2)} to $${dearest?.price?.toFixed(2)}, a spread of about ${dearest && cheapest ? Math.round(((dearest.price - cheapest.price) / cheapest.price) * 100) : 0}% across a category where the cheapest option is a three-wheeler and the most expensive is a two-wheeler for a six-year-old and up.`,
    bandTitle: "The three price bands",
    bandLead: `Under $30 covers ${priced.filter((r) => (r.price as number) < 30).length} of the ${total} listings. $30 to $50 covers ${priced.filter((r) => (r.price as number) >= 30 && (r.price as number) < 50).length}. Above $50 there are ${priced.filter((r) => (r.price as number) >= 50).length}. The median listing costs $${median?.price?.toFixed(2)}.`,
    wheelsTitle: "What the money actually buys",
    wheelsLead: `The wheel layout a scooter has — two wheels or three — is the choice parents make first, and it tracks price here in the opposite direction to intuition. The three-wheel scooters, the ones a child too small to balance rides, are the cheaper group: their median price is $${kidsScooterPriceByWheels().threeMedian?.toFixed(2)}. The two-wheel scooters median $${kidsScooterPriceByWheels().twoMedian?.toFixed(2)}. A three-wheeler is the budget choice and a two-wheeler is the upgrade.`,
    featureTitle: "Where the extra money shows up",
    featureLead: `Comparing what the top of the range adds over the bottom of it: the priciest listing carries no suspension claim, no brake specification and no weight figure at all, and what it does carry is a 240-pound rider limit against 110 pounds for two of the cheaper three-wheelers. The higher price is not buying a sturdier build for a small child — it is buying a scooter sized for a much larger rider.`,
    caveatTitle: "What these prices are",
    caveatBody: [
      `These are the prices recorded in the CMS product snapshot on ${d.meta.generatedAt}, not live retailer prices. Retail pricing moves, and a listing price here can be days or weeks out of date.`,
      `Every price is the current listing price for the specific colourway this site publishes. Colourways of the same model are separate listings and can differ.`,
      `Price is not compared against weight, rider limit or any other figure elsewhere on this page. A cheaper scooter is not thereby a better value, and this page does not try to rank them.`,
    ],
    rosterTitle: "Every listing with its price",
    rosterLead: `Cheapest first. Ratings and review counts come from the retailer's own listing text and are shown here so a price can be read next to how many buyers have rated it.`,
    colBrand: "Brand",
    colModel: "Model",
    colPrice: "Price",
    colWheels: "Wheels",
    colRating: "Rating",
    colReviews: "Reviews",
    notStated: "not stated",
    methodTitle: "How prices were read",
    methodBody: [
      `Source: the CMS product snapshot filtered to categoryId "scooters" and to the listings Stage 1 keeps — ${total} published listings, all ${priced.length} of which carry a price.`,
      `Prices are used as recorded in the snapshot, in US dollars, with no currency conversion. They are snapshot values rather than a live feed, and the snapshot date is printed above.`,
      `Ratings and review counts are parsed out of the retailer's own listing text; they are not this site's ratings. Where a listing carries no rating it is shown as not stated rather than filled in from elsewhere.`,
      `No price was checked against a retailer at publication time, and no discount, shipping or stock status is represented.`,
    ],
  },
  zh: {
    eyebrow: "Plan-B 资产页 · 价格",
    navLabel: "价格与性价比",
    h1: `童车滑板车价格：${total} 款全部有价`,
    lead: `这里的每一条 listing 都有价格，所以这是童用滑板车各页里唯一没有缺口的一页。价格从 $${cheapest?.price?.toFixed(2)} 到 $${dearest?.price?.toFixed(2)}，跨度约 ${dearest && cheapest ? Math.round(((dearest.price - cheapest.price) / cheapest.price) * 100) : 0}%，而这个类目里最便宜的是三轮、最贵的却是给六岁以上孩子骑的两轮款。`,
    bandTitle: "三个价格区间",
    bandLead: `30 美元以下有 ${priced.filter((r) => (r.price as number) < 30).length} 款；30 到 50 美元有 ${priced.filter((r) => (r.price as number) >= 30 && (r.price as number) < 50).length} 款；50 美元以上 ${priced.filter((r) => (r.price as number) >= 50).length} 款。中位价是 $${median?.price?.toFixed(2)}。`,
    wheelsTitle: "多花的钱买到了什么",
    wheelsLead: `轮数是家长最先做的选择，而它与价格的关系和直觉相反。三轮滑板车——孩子还平衡不了时骑的那一种——恰好是便宜的那一组，中位价 $${kidsScooterPriceByWheels().threeMedian?.toFixed(2)}；两轮滑板车中位价 $${kidsScooterPriceByWheels().twoMedian?.toFixed(2)}。三轮是入门选择，两轮是升级。`,
    featureTitle: "高配置段多出来的是什么",
    featureLead: `对比价格两端：高价那款没有避震说明、没有刹车规格、连自重都没公布；它给出的是 240 磅承重，而更便宜的两款三轮车只有 110 磅。多花的钱买到的不是"给小孩用的更结实"，而是一台按大得多体型设计的滑板车。`,
    caveatTitle: "这些价格是什么",
    caveatBody: [
      `这些是 ${d.meta.generatedAt} 记录在 CMS 产品快照里的价格，不是零售商的实时价格。零售价格会变，这里的数字可能已经过期数天甚至数周。`,
      `每个价格都对应本站发布的那个具体配色。同款不同配色是独立的listing，价格可能不同。`,
      `本页不把价格与自重、承重或任何其他数字做对比。更便宜的滑板车并不因此更有性价比，本页也不试图排名。`,
    ],
    rosterTitle: "每一款及其价格",
    rosterLead: `按价格从低到高。评分与评论数来自零售商自己的 listing 文本，放在价格旁边便于对照参考人数。`,
    colBrand: "品牌",
    colModel: "型号",
    colPrice: "价格",
    colWheels: "轮数",
    colRating: "评分",
    colReviews: "评论数",
    notStated: "未说明",
    methodTitle: "价格是怎么读取的",
    methodBody: [
      `数据源：CMS 产品快照筛选 categoryId 为 "scooters" 并只保留阶段一保留的 listing，共 ${total} 款，全部 ${priced.length} 款都有价格。`,
      `价格按快照中记录的原值使用，以美元计价，未做汇率换算。它们是快照值而非实时数据，快照日期已印在页面上。`,
      `评分与评论数从零售商自己的 listing 文本中解析，不是本站评分。没有评分的 listing 显示为未说明，不会从别处补。`,
      `发布时未向任何零售商核对价格，也不代表折扣、运费或库存状态。`,
    ],
  },
};

export const kidsScooterPriceColumns = (t: ScooterPriceStrings): ScooterColumn[] => [
  {
    key: "brand",
    header: t.colBrand,
    render: (r: never) => (r as { brand?: string }).brand || t.notStated,
  },
  {
    key: "name",
    header: t.colModel,
    render: (r: never) => rosterLabel(r as never) || t.notStated,
  },
  {
    key: "price",
    header: t.colPrice,
    numeric: true,
    render: (r: never) => {
      const v = (r as { price?: number | null }).price;
      return v === null || v === undefined ? t.notStated : `$${v.toFixed(2)}`;
    },
  },
  {
    key: "wheels",
    header: t.colWheels,
    numeric: true,
    render: (r: never) => {
      const n = (r as { wheelCount?: number | null }).wheelCount;
      return n === null || n === undefined ? t.notStated : String(n);
    },
  },
  {
    key: "rating",
    header: t.colRating,
    numeric: true,
    render: (r: never) => {
      const v = (r as { rating?: number | null }).rating;
      return v === null || v === undefined ? t.notStated : `${v} / 5`;
    },
  },
  {
    key: "reviews",
    header: t.colReviews,
    numeric: true,
    render: (r: never) => {
      const v = (r as { reviewCount?: number | null }).reviewCount;
      return v === null || v === undefined ? t.notStated : v.toLocaleString("en-US");
    },
  },
];

export const kidsScooterPriceVars = {
  total,
  priced: priced.length,
  cheapest: cheapest?.price?.toFixed(2) ?? "",
  dearest: dearest?.price?.toFixed(2) ?? "",
  median: median?.price?.toFixed(2) ?? "",
  date: d.meta.generatedAt,
  ...kidsScooterPriceByWheels(),
};

export const kidsScooterPriceIcons = { tags: Tags, trend: TrendingUp, caveat: AlertTriangle, table: Table2 };