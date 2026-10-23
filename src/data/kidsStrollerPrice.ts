/**
 * /kids-stroller-price/ — the price field.
 *
 * Price is the one field every stroller publishes: all 45 carry it. The
 * interesting finding is the shape — ten sit under $100, the bulk cluster in the
 * $100–$200 band, and a thin tail runs to $900. The page also shows that star
 * rating and price are separate facts: the most-reviewed stroller is not the
 * most expensive, and a $34 umbrella scores the same band as a $250 double.
 */
import { DollarSign, BarChart3, Star, TriangleAlert, Table2 } from "lucide-react";
import { STROLLER_DATASET } from "./strollerData.generated";

export { STROLLER_DATASET };
export const KIDS_STROLLER_PRICE_PATH = "/kids-stroller-price/";

const d = STROLLER_DATASET;
const total = d.totals.strollers;

const prices = d.rows.map((r) => r.price);
const priceMin = Math.min(...prices);
const priceMax = Math.max(...prices);
const bandUnder = d.rows.filter((r) => r.price < 100).length;
const band100 = d.rows.filter((r) => r.price >= 100 && r.price < 200).length;
const band200 = d.rows.filter((r) => r.price >= 200 && r.price < 300).length;
const band300 = d.rows.filter((r) => r.price >= 300).length;
const ratings = d.rows.map((r) => r.rating);
const ratingMin = Math.min(...ratings);
const ratingMax = Math.max(...ratings);
const ratingAvg = Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 100) / 100;
const mostReviewed = d.rows.reduce((a, b) => (b.reviewCount > a.reviewCount ? b : a));
const cheapest = d.rows.reduce((a, b) => (b.price < a.price ? b : a));

export interface StrollerPriceStrings {
  eyebrow: string;
  navLabel: string;
  h1: string;
  lead: string;
  coverTitle: string;
  coverLead: string;
  bandsTitle: string;
  bandsLead: string;
  bandUnder: string;
  band100: string;
  band200: string;
  band300: string;
  ratingTitle: string;
  ratingLead: string;
  ratingSpread: string;
  ratingApart: string;
  gapTitle: string;
  gapLead: string;
  gapShipping: string;
  gapWarranty: string;
  gapHistory: string;
  rosterTitle: string;
  rosterLead: string;
  colBrand: string;
  colModel: string;
  colType: string;
  colPrice: string;
  colRating: string;
  colReviews: string;
  notStated: string;
  methodTitle: string;
  methodBody: string[];
}

export const kidsStrollerPriceStrings: Record<"en" | "zh", StrollerPriceStrings> = {
  en: {
    eyebrow: "Plan-B asset · price",
    navLabel: "Price",
    h1: `Stroller Prices: ${total} Models, ${bandUnder} Under $100`,
    lead: `Price is the only field every one of the ${total} strollers publishes, so coverage is ${total} of ${total}. The shape is the story: ${bandUnder} sit under $100, ${band100} cluster in the $100–$200 band, and the rest thin out to a ${priceMax} top end. Rating and price turn out to be unrelated facts.`,
    coverTitle: "Every stroller carries a price",
    coverLead: `All ${total} listings state a price, from $${priceMin} to $${priceMax}.`,
    bandsTitle: "Where the dollars actually cluster",
    bandsLead: `The middle band holds the catalogue; the tail is thin.`,
    bandUnder: `Under $100 — ${bandUnder} strollers. The cheapest is the ${cheapest.brand} ${cheapest.model} at $${cheapest.price}, an umbrella frame with no frills.`,
    band100: `$100–$200 — ${band100} strollers, the dense heart of the catalogue where most joggers, doubles and travel frames live.`,
    band200: `$200–$300 — ${band200} strollers, the premium joggers and the better doubles.`,
    band300: `$300 and over — ${band300} strollers, the all-terrain duallies and the imported joggers that reach $${priceMax}.`,
    ratingTitle: "Stars and price do not move together",
    ratingLead: `The score band spans ${ratingMin} to ${ratingMax} across the whole price range, so paying more buys a feature, not a better score.`,
    ratingSpread: `Average rating is ${ratingAvg} and the spread is narrow — even the ${priceMax} stroller shares the ${ratingMax} ceiling with far cheaper frames.`,
    ratingApart: `The most-reviewed stroller, the ${mostReviewed.brand} ${mostReviewed.model} at $${mostReviewed.price} with ${mostReviewed.reviewCount.toLocaleString()} reviews, is not the most expensive, confirming price and popularity are separate axes.`,
    gapTitle: "What a single sticker cannot reveal",
    gapLead: `Stated because the number on the page is not the number a parent pays.`,
    gapShipping: `Shipping and returns — no listing here states them, so the ${priceMin} sticker may not be the landed cost.`,
    gapWarranty: `Warranty length — absent. A ${priceMax} stroller and a ${priceMin} one give no stated coverage difference.`,
    gapHistory: `Price history — absent. The figure is a snapshot; whether $${priceMax} is a sale or a list price is not in the data.`,
    rosterTitle: "All forty-five strollers, cheapest first",
    rosterLead: `Sorted by price. Rating and review count sit beside the sticker so the two facts can be read together.`,
    colBrand: "Brand",
    colModel: "Model",
    colType: "Type",
    colPrice: "Price",
    colRating: "Rating",
    colReviews: "Reviews",
    notStated: "not stated",
    methodTitle: "How these stroller figures were read",
    methodBody: [
      `Source: the CMS product snapshot, limited to the id namespace stroller-* with category "stroller", after dropping about ${d.totals.droppedNonStroller} items that share the prefix but are not strollers — car seats and baby swings. ${total} strollers remain in stock.`,
      `Every figure is the retailer's stated number. Item weights are in pounds and dimensions in inches as the listing gives them; nothing here was weighed, measured or tested.`,
      `Membership is decided by the id namespace, not by the marketing name. A stroller that calls itself a "travel system" is still one row; a car seat that shares the prefix is dropped.`,
      `EN 1888 is the European safety standard the catalogue attaches to all ${d.totals.withCompliance} strollers. It is recorded as stated; we did not verify certification.`,
      `Counts such as "N of ${total}" are recomputed from the dataset fields, not rounded from a summary.`,
    ],
  },
  zh: {
    eyebrow: "Plan-B 资产页 · 价格",
    navLabel: "价格",
    h1: `婴儿车价格：${total} 款，${bandUnder} 款低于 $100`,
    lead: `价格是 ${total} 款婴儿车里唯一每款都公布的字段，所以覆盖率是 ${total} / ${total}。真正有意思的是形状：${bandUnder} 款低于 $100，${band100} 款聚在 $100–$200 区间，其余稀疏地延伸到 ${priceMax} 的顶端。评分与价格最终被证明是两码事。`,
    coverTitle: "每款车都有价格",
    coverLead: `全部 ${total} 个 listing 都标了价，从 $${priceMin} 到 $${priceMax}。`,
    bandsTitle: "钱究竟花在了哪一段",
    bandsLead: `中间那档撑起整个目录；尾部很薄。`,
    bandUnder: `低于 $100——${bandUnder} 款。最便宜的是 ${cheapest.brand} ${cheapest.model}，仅 $${cheapest.price}，是无附加功能的伞车车架。`,
    band100: `$100–$200——${band100} 款，是目录最密集的心脏，多数慢跑车、双座和旅行车都在这里。`,
    band200: `$200–$300——${band200} 款，高端慢跑车与较好的双座。`,
    band300: `$300 及以上——${band300} 款，全地形双座与进口慢跑车，最高到 $${priceMax}。`,
    ratingTitle: "星级和价格并不联动",
    ratingLead: `整段价格区间里，评分跨度都是 ${ratingMin} 到 ${ratingMax}，所以多花钱买到的是功能，不是更高的分。`,
    ratingSpread: `平均评分 ${ratingAvg}，跨度很窄——连 ${priceMax} 的车也与便宜得多的车架共享 ${ratingMax} 的天花板。`,
    ratingApart: `评论最多的是 ${mostReviewed.brand} ${mostReviewed.model}，$${mostReviewed.price}、${mostReviewed.reviewCount.toLocaleString()} 条评论，却不是最贵的，印证价格与人气是两条独立的轴。`,
    gapTitle: "一个数字标贴说不清的事",
    gapLead: `放在这里，是因为页面上的价格不是家长实际付出的数字。`,
    gapShipping: `运费与退换——这里没有任何 listing 写明，所以 ${priceMin} 的标价未必是到手价。`,
    gapWarranty: `保修时长——没有。${priceMax} 的车与 ${priceMin} 的车在声明上没有覆盖差异。`,
    gapHistory: `价格历史——没有。这只是个快照；$${priceMax} 是促销价还是标价，数据里看不出。`,
    rosterTitle: "四十五款，从便宜排到贵",
    rosterLead: `按价格排序。评分与评论量放在标价旁边，两件事可一起读。`,
    colBrand: "品牌",
    colModel: "型号",
    colType: "类型",
    colPrice: "价格",
    colRating: "评分",
    colReviews: "评论数",
    notStated: "未说明",
    methodTitle: "这些数字是怎么读出来的",
    methodBody: [
      `数据源：CMS 产品快照，限定 id 命名空间 stroller-* 且 category 为 "stroller"，再剔除约 ${d.totals.droppedNonStroller} 个共享前缀却不是婴儿车的条目。剩下 ${total} 款在售。`,
      `每个数字都是零售商声明的值；重量按磅、尺寸按英寸，照 listing 所写，未经实测。`,
      `成员资格由 id 命名空间决定，而非营销名。自称"旅行系统"的车仍然只是一行；共享前缀的安全座椅则被剔除。`,
      `EN 1888 是本目录给全部 ${d.totals.withCompliance} 款婴儿车贴的欧洲安全标准，按声明记录，未核实认证。`,
      `诸如「N / ${total}」的计数都按数据集字段重新算。`,
    ],
  },
};

type SRow = (typeof STROLLER_DATASET)["rows"][number];

export const kidsStrollerPriceColumns = (t: StrollerPriceStrings) => [
  {
    key: "brand",
    header: t.colBrand,
    render: (r: never) => (r as SRow).brand || t.notStated,
  },
  {
    key: "model",
    header: t.colModel,
    render: (r: never) => {
      const row = r as SRow;
      return `${row.brand} ${row.model}`.trim() || t.notStated;
    },
  },
  {
    key: "form",
    header: t.colType,
    render: (r: never) => (r as SRow).form || t.notStated,
  },
  {
    key: "price",
    header: t.colPrice,
    numeric: true,
    render: (r: never) => `$${(r as SRow).price}`,
  },
  {
    key: "rating",
    header: t.colRating,
    numeric: true,
    render: (r: never) => `${(r as SRow).rating}`,
  },
  {
    key: "reviews",
    header: t.colReviews,
    numeric: true,
    render: (r: never) => `${(r as SRow).reviewCount.toLocaleString()}`,
  },
];

export const kidsStrollerPriceVars = {
  total,
  priceMin,
  priceMax,
  bandUnder,
  band100,
  band200,
  band300,
  ratingMin,
  ratingMax,
  ratingAvg,
};

export const kidsStrollerPriceIcons = {
  dollar: DollarSign,
  bars: BarChart3,
  star: Star,
  gap: TriangleAlert,
  table: Table2,
};
