/**
 * /kids-tricycle-price/ — the price view of the tricycle cluster.
 *
 * Every one of the eleven tricycles publishes a price, so coverage is full —
 * which is rare enough in this dataset to say out loud. The prices run from
 * $37.98 to $103.99, and the spread is not random: the cheap end is a wall of
 * near-identical classic steel trikes, while the expensive end is the two
 * push-handle convertible trikes and the one stroller trike.
 *
 * The page also pairs price with the rating each trike carries. Ratings here are
 * unusually tight — every rated trike lands between 4.5 and 4.7 — so price, not
 * stars, is the axis that actually separates these products. A parent cannot use
 * the rating to choose; they can use the price band.
 */
import { DollarSign, BarChart3, Star, AlertTriangle, Table2 } from "lucide-react";
import { TRICYCLE_DATASET } from "./tricycleData.generated";
import { clusterLabel } from "../components/ClusterAssetPage";

export { TRICYCLE_DATASET };
export const KIDS_TRICYCLE_PRICE_PATH = "/kids-tricycle-price/";

const d = TRICYCLE_DATASET;
const total = d.totals.tricycles;

type TRow = typeof TRICYCLE_DATASET.rows[number];

const priced = d.rows.filter((r) => typeof r.price === "number");
const prices = priced.map((r) => r.price as number);
const priceMin = Math.min(...prices);
const priceMax = Math.max(...prices);

const band = (r: TRow) => {
  const p = r.price as number;
  if (p < 50) return "under50";
  if (p < 75) return "50to75";
  if (p < 100) return "75to100";
  return "over100";
};
const bandCounts: Record<string, number> = {
  under50: 0,
  "50to75": 0,
  "75to100": 0,
  over100: 0,
};
for (const r of priced) bandCounts[band(r)] += 1;

const ratingTally: Record<string, number> = {};
for (const r of d.rows) {
  if (r.rating == null) continue;
  ratingTally[String(r.rating)] = (ratingTally[String(r.rating)] || 0) + 1;
}
const ratingEntries = Object.entries(ratingTally)
  .map(([r, c]) => ({ rating: r, count: c }))
  .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
const bestRating = ratingEntries[0];
const mostReviewed = d.rows
  .filter((r) => r.reviewCount != null)
  .reduce((a, b) => ((b.reviewCount as number) > (a.reviewCount as number) ? b : a));
const leastReviewed = d.rows
  .filter((r) => r.reviewCount != null)
  .reduce((a, b) => ((b.reviewCount as number) < (a.reviewCount as number) ? b : a));

export const kidsTricyclePriceGaps = {
  widest: { size: priceMax - priceMin },
};

export const kidsTricyclePriceVars = {
  total,
  withPrice: d.totals.withPrice,
  priceMin,
  priceMax,
  bandCounts,
  ratingEntries,
  bestRating: bestRating.rating,
  bestRatingCount: bestRating.count,
  mostReviewedLabel: clusterLabel(mostReviewed as never),
  mostReviewedCount: mostReviewed.reviewCount as number,
  leastReviewedLabel: clusterLabel(leastReviewed as never),
  leastReviewedCount: leastReviewed.reviewCount as number,
};

export interface TricyclePriceStrings {
  eyebrow: string;
  navLabel: string;
  h1: string;
  lead: string;
  gapTitle: string;
  gapLead: string;
  gapWide: string;
  gapTier: string;
  gapReview: string;
  bandsTitle: string;
  bandsLead: string;
  bandUnder: string;
  band50to75: string;
  band75to100: string;
  bandOver100: string;
  ratingTitle: string;
  ratingLead: string;
  ratingNote: string;
  ratingBest: string;
  ratingPopular: string;
  rosterTitle: string;
  rosterLead: string;
  colBrand: string;
  colModel: string;
  colPrice: string;
  colRating: string;
  colReviews: string;
  colRank: string;
  notStated: string;
  methodTitle: string;
  methodBody: string[];
}

export const kidsTricyclePriceStrings: Record<"en" | "zh", TricyclePriceStrings> = {
  en: {
    eyebrow: "Plan-B asset · price",
    navLabel: "Price",
    h1: `Kids Tricycle Prices Compared: ${total} Trikes, $${priceMin}–$${priceMax}`,
    lead: `Price is the one field every tricycle here publishes — all ${total} carry a listed price, the only fully-covered field in the set. They run from $${priceMin} to $${priceMax}, and the split is not even: six trikes sit under $50 as near-identical classic frames, while the push-handle convertibles and the single stroller trike push the top end past $70.`,
    gapTitle: "What the price does not tell you",
    gapLead: `Three things a price tag leaves open.`,
    gapWide: `The $${priceMax - priceMin} spread is almost entirely a form split: the cheap cluster is classic trikes, the expensive cluster is push-handle and stroller trikes, so price mostly encodes the body style.`,
    gapTier: `Price does not encode safety or age. The $37.98 trike and the $103.99 trike carry the same ASTM F963 mark, so paying more buys features, not a safer toy by any figure we hold.`,
    gapReview: `Price does not track the rating. Every rated trike scores between 4.5 and 4.7, so the stars cannot break a tie that the dollars can.`,
    bandsTitle: "Where the prices land",
    bandsLead: `Four bands across the eleven listings.`,
    bandUnder: `Under $50 — ${bandCounts.under50} trikes. The dense, undifferentiated bottom of the market: classic steel frames within a few dollars of each other.`,
    band50to75: `$50–$75 — ${bandCounts["50to75"]} trikes. The mid band, where the first convertible frames appear.`,
    band75to100: `$75–$100 — ${bandCounts["75to100"]} trikes. The two push-handle convertibles that steer from behind.`,
    bandOver100: `Over $100 — ${bandCounts.over100} trike. The lone stroller trike, the only one here that folds into a push chair.`,
    ratingTitle: "Rating against price",
    ratingLead: `The stars are too tight to separate the field.`,
    ratingNote: `Every rated trike scores between 4.5 and 4.7 stars, so the rating cannot break the tie that the price can — stars here are a category norm, not a differentiator.`,
    ratingBest: `${bestRating.count} of the ${d.totals.withRating} rated trikes sit at ${bestRating.rating} stars — the modal score — so a high rating is the norm, not a differentiator.`,
    ratingPopular: `The most-reviewed trike is ${kidsTricyclePriceVars.mostReviewedLabel} at ${kidsTricyclePriceVars.mostReviewedCount.toLocaleString()} reviews; the least-reviewed rated trike is ${kidsTricyclePriceVars.leastReviewedLabel} at ${kidsTricyclePriceVars.leastReviewedCount.toLocaleString()}. Review volume tracks price, not quality.`,
    rosterTitle: "Every trike, priced",
    rosterLead: `Sorted by price, cheapest first. Rating and review count sit beside the dollars.`,
    colBrand: "Brand",
    colModel: "Model",
    colPrice: "Price",
    colRating: "Rating",
    colReviews: "Reviews",
    colRank: "Rank",
    notStated: "not stated",
    methodTitle: "Method: the prices as listed, nothing discounted",
    methodBody: [
      `Source: the CMS product snapshot, gated to the id namespace kids_tricycles-* with category "kids_tricycles" — ${total} in-stock tricycles, all ${d.totals.withPrice} with a listed price.`,
      `Prices are the current listed price as the retailer publishes it; no sale, coupon or historical price was inferred, so the band counts reflect one moment in time.`,
      `Rating and review-count figures are the retailer's own numbers, parsed from the customer-reviews field; ${total - d.totals.withRating} listing carries neither.`,
      `Bands are fixed cut points ($50, $75, $100) chosen to surface the form split rather than to suggest natural price steps.`,
    ],
  },
  zh: {
    eyebrow: "Plan-B 资产页 · 价格",
    navLabel: "价格",
    h1: `儿童三轮车价格对照：${total} 款，$${priceMin}–$${priceMax}`,
    lead: `价格是这里每一款三轮车都公布的字段——全部 ${total} 款都有标价，是整集中唯一全覆盖的字段。它们从 $${priceMin} 到 $${priceMax}，分布并不均匀：6 款不到 $50 几乎是同款经典钢架，而带推行把手的 convertible 与唯一的婴儿推车式三轮车把高端推过了 $70。`,
    gapTitle: "价格没告诉你的事",
    gapLead: `价签没说清的三件事。`,
    gapWide: `$${priceMax - priceMin} 的差价几乎完全是形态差异：便宜的一簇是经典三轮车，贵的一簇是推行把手款和推车款，所以价格主要编码的是车身形态。`,
    gapTier: `价格不编码安全或年龄。$37.98 的三轮车和 $103.99 的贴着同样的 ASTM F963 标记，所以多花钱买的是功能，而不是我们掌握的任何一个「更安全」的数字。`,
    gapReview: `价格与评分无关。每款评分都在 4.5 到 4.7 之间，所以星标解不开美元能解的平局。`,
    bandsTitle: "价格落在何处",
    bandsLead: `十一款 listing 分成四个档。`,
    bandUnder: `低于 $50——${bandCounts.under50} 款。市场底部密集且无差异：彼此只差几美元的经典钢架。`,
    band50to75: `$50–$75——${bandCounts["50to75"]} 款。中间档，第一批 convertible 车架在此出现。`,
    band75to100: `$75–$100——${bandCounts["75to100"]} 款。两款从后方转向的推行把手 convertible。`,
    bandOver100: `超过 $100——${bandCounts.over100} 款。唯一的推车式三轮车，也是这里唯一能折成推行椅的。`,
    ratingTitle: "价格与评分对照",
    ratingLead: `星标太集中，分不出高下。`,
    ratingNote: `每款评分都在 4.5 到 4.7 之间，所以星标解不开价格能解的平局——星标在这里是品类常态，而非差异点。`,
    ratingBest: `已评分的 ${d.totals.withRating} 款中有 ${bestRating.count} 款是 ${bestRating.rating} 星——众数分数——所以高分是常态而非差异点。`,
    ratingPopular: `评论最多的是 ${kidsTricyclePriceVars.mostReviewedLabel}，共 ${kidsTricyclePriceVars.mostReviewedCount.toLocaleString()} 条；评论最少的已评分款是 ${kidsTricyclePriceVars.leastReviewedLabel}，共 ${kidsTricyclePriceVars.leastReviewedCount.toLocaleString()} 条。评论量随价格走，不随质量走。`,
    rosterTitle: "每一款车及其价格",
    rosterLead: `按价格排序，最便宜的在前。评分与评论数并排在价格旁。`,
    colBrand: "品牌",
    colModel: "型号",
    colPrice: "价格",
    colRating: "评分",
    colReviews: "评论",
    colRank: "排名",
    notStated: "未说明",
    methodTitle: "方法：按标价列出，无折扣推算",
    methodBody: [
      `数据源：CMS 产品快照，限定 id 命名空间 kids_tricycles-* 且 category 为 "kids_tricycles"，共 ${total} 款在售三轮车，其中 ${d.totals.withPrice} 款有标价。`,
      `价格即零售商当前公布价；未推断任何促销、优惠券或历史价，因此档位计数反映的是某一时刻。`,
      `评分与评论数均为零售商自有数字，从顾客评价字段解析；${total - d.totals.withRating} 款两者皆无。`,
      `档位采用固定切点（$50、$75、$100），目的是凸显形态差异，而非暗示自然的价格阶梯。`,
    ],
  },
};

export const kidsTricyclePriceColumns = (t: TricyclePriceStrings) => [
  {
    key: "brand",
    header: t.colBrand,
    render: (r: never) => (r as TRow).brand || t.notStated,
  },
  {
    key: "model",
    header: t.colModel,
    render: (r: never) => clusterLabel(r as never) || t.notStated,
  },
  {
    key: "price",
    header: t.colPrice,
    numeric: true,
    render: (r: never) => {
      const v = (r as TRow).price;
      return v == null ? t.notStated : `$${v}`;
    },
  },
  {
    key: "rating",
    header: t.colRating,
    numeric: true,
    render: (r: never) => {
      const v = (r as TRow).rating;
      return v == null ? t.notStated : `${v}`;
    },
  },
  {
    key: "reviews",
    header: t.colReviews,
    numeric: true,
    render: (r: never) => {
      const v = (r as TRow).reviewCount;
      return v == null ? t.notStated : String(v);
    },
  },
  {
    key: "rank",
    header: t.colRank,
    numeric: true,
    render: (r: never) => {
      const v = (r as TRow).categoryRank;
      return v == null ? t.notStated : `#${v}`;
    },
  },
];

export const kidsTricyclePriceIcons = {
  dollar: DollarSign,
  chart: BarChart3,
  star: Star,
  gap: AlertTriangle,
  table: Table2,
};
