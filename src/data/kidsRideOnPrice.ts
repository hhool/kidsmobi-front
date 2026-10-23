/**
 * /kids-ride-on-price/ — what the money does, and where the catalogue has a hole.
 *
 * All fifteen listings are priced, which makes this the only page in the cluster
 * with complete coverage — and the useful finding is not the range but the gap.
 * The prices sort into three clusters with a $84.99 hole between them: ten
 * listings under $200, four in the $285–$320 band, and one at $379.52. A buyer
 * with $250 to spend has nothing to buy.
 *
 * Second finding: price does not track rating. The most-reviewed listing in the
 * catalogue ($169.99, 21,161 reviews) carries a middling 4.3 stars, while the
 * highest rating belongs to a $129.99 truck with 233 reviews. Review count and
 * star rating are separate facts and this page keeps them apart.
 *
 * Third: the price gap and the voltage gap are the same gap. Every listing below
 * $200 is 6V or 12V, and every listing at $284.98 or above is 24V or 36V. The
 * catalogue has no mid-range machine, so "what can I get for $200" has the
 * answer "nothing, or a 24V two-seater at $284.98".
 */
import { DollarSign, Wallet, TrendingUp, AlertTriangle, Table2 } from "lucide-react";
import { RIDE_ON_DATASET } from "./rideOnData.generated";
import { rideOnLabel, type RideOnColumn } from "../components/RideOnAssetPage";

export { RIDE_ON_DATASET };
export const KIDS_RIDE_ON_PRICE_PATH = "/kids-ride-on-price/";

const d = RIDE_ON_DATASET;
const total = d.totals.rideOnCars;

/** Price bands used for the roster and for the counts. */
export const KIDS_RIDE_ON_PRICE_BANDS = [
  { key: "under100", label: "Under $100", min: 0, max: 100 },
  { key: "100to150", label: "$100 to $150", min: 100, max: 150 },
  { key: "150to250", label: "$150 to $250", min: 150, max: 250 },
  { key: "over250", label: "$250 and above", min: 250, max: Infinity },
] as const;

/** Listings in each band, cheapest first. */
export const kidsRideOnPriceBands = () =>
  KIDS_RIDE_ON_PRICE_BANDS.map((band) => {
    const rows = d.rows
      .filter((r) => typeof r.price === "number" && r.price >= band.min && r.price < band.max)
      .sort((a, b) => (a.price as number) - (b.price as number));
    return {
      ...band,
      rows,
      count: rows.length,
      voltageMix: [...new Set(rows.map((r) => `${r.voltage}V`))].sort((a, b) => parseInt(a) - parseInt(b)),
    };
  });

/**
 * The largest gap between two consecutive prices.
 *
 * This is the page's central finding, so it is computed rather than asserted:
 * a gap is a stretch of the price range where no listing sits.
 */
export const kidsRideOnPriceGaps = () => {
  const sorted = d.rows
    .filter((r) => typeof r.price === "number")
    .sort((a, b) => (a.price as number) - (b.price as number));
  const gaps: Array<{ after: number; before: number; size: number }> = [];
  for (let i = 1; i < sorted.length; i++) {
    gaps.push({
      after: sorted[i - 1].price as number,
      before: sorted[i].price as number,
      size: +((sorted[i].price as number) - (sorted[i - 1].price as number)).toFixed(2),
    });
  }
  return { gaps, widest: [...gaps].sort((a, b) => b.size - a.size)[0] };
};

/** Cheapest and dearest, and the median. */
export const kidsRideOnPriceExtremes = () => {
  const prices = d.rows.map((r) => r.price).filter((p): p is number => typeof p === "number");
  const sorted = [...prices].sort((a, b) => a - b);
  const cheapest = [...d.rows].sort((a, b) => (a.price as number) - (b.price as number))[0];
  const dearest = [...d.rows].sort((a, b) => (b.price as number) - (a.price as number))[0];
  const mid = Math.floor(sorted.length / 2);
  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    median: sorted.length % 2 ? sorted[mid] : +((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2),
    cheapest,
    dearest,
  };
};

/** The cheapest machine in each voltage tier, and what that tier's floor is. */
export const kidsRideOnPriceTierFloors = () =>
  [6, 12, 24, 36].map((v) => {
    const rows = d.rows.filter((r) => r.voltage === v);
    const prices = rows.map((r) => r.price).filter((p): p is number => typeof p === "number");
    return {
      volts: v,
      count: rows.length,
      floor: prices.length ? Math.min(...prices) : null,
      ceiling: prices.length ? Math.max(...prices) : null,
    };
  });

/**
 * Price against the published star rating.
 *
 * Kept separate from review count on purpose: a high rating on a cheap listing
 * is not the same claim as a high rating on a popular one.
 */
export const kidsRideOnPriceRatings = () => {
  const rows = d.rows.filter((r) => typeof r.rating === "number");
  const best = [...rows].sort((a, b) => (b.rating as number) - (a.rating as number))[0];
  const mostReviewed = [...rows].sort(
    (a, b) => (b.reviewCount as number) - (a.reviewCount as number)
  )[0];
  return { best, mostReviewed };
};

export interface RideOnPriceStrings {
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
  band100to150: string;
  band150to250: string;
  bandOver250: string;
  ratingTitle: string;
  ratingLead: string;
  ratingBest: string;
  ratingPopular: string;
  gapNoteTitle: string;
  gapNoteLead: string;
  gapNoteShipping: string;
  gapNoteWarranty: string;
  gapNoteHistory: string;
  rosterTitle: string;
  rosterLead: string;
  colBrand: string;
  colModel: string;
  colPrice: string;
  colTier: string;
  colSeats: string;
  colRating: string;
  colReviews: string;
  notStated: string;
  methodTitle: string;
  methodBody: string[];
}

export const kidsRideOnPriceStrings: Record<"en" | "zh", RideOnPriceStrings> = {
  en: {
    eyebrow: "Plan-B asset · price structure",
    navLabel: "Price structure",
    h1: `Kids Ride-On Price: ${total} Cars, Four Price Bands`,
    lead: `Every one of the ${total} children's ride-on cars in this catalogue carries a price, which makes this the one page in the cluster with nothing missing. The interesting part is the shape rather than the range: prices run from $${kidsRideOnPriceExtremes().min} to $${kidsRideOnPriceExtremes().max}, but they do not fill that range. There is a $${kidsRideOnPriceGaps().widest.size} gap between the $${kidsRideOnPriceGaps().widest.after} machine and the $${kidsRideOnPriceGaps().widest.before} one, and nothing at all in between.`,
    gapTitle: "The hole in the middle of the price range",
    gapLead: `A price range is usually reported as a minimum and a maximum. For this catalogue that would be misleading, because the gap between the cheapest and the dearest contains the largest single step in the whole set.`,
    gapWide: `The $${kidsRideOnPriceGaps().widest.size} gap — between the $${kidsRideOnPriceGaps().widest.after} Best Choice Products SKY7413 and the $${kidsRideOnPriceGaps().widest.before} Best Choice Products SKY9415 there is no listing whatsoever. A buyer who has set aside $250 has nothing in this catalogue to spend it on; the next machine up costs $${kidsRideOnPriceGaps().widest.before}.`,
    gapTier: `The gap is a voltage gap — all ten listings under $200 are 6V or 12V, and all five listings from $284.98 upward are 24V or 36V. The step from $199.99 to $284.98 is the step from a single-seat truck to a two-seat vehicle with a parent remote, and the catalogue offers nothing in between.`,
    gapReview: `Price does not buy rating — the dearest listing in the catalogue, at $${kidsRideOnPriceExtremes().max}, carries a ${kidsRideOnPriceExtremes().dearest.rating}-star average and ${kidsRideOnPriceExtremes().dearest.reviewCount} reviews, and the highest star rating in the set belongs to a $${kidsRideOnPriceRatings().best.price} truck with ${kidsRideOnPriceRatings().best.reviewCount} reviews. The most-reviewed listing in the catalogue is the $${kidsRideOnPriceRatings().mostReviewed.price} SKY5506 with ${kidsRideOnPriceRatings().mostReviewed.reviewCount.toLocaleString("en-US")} reviews and a ${kidsRideOnPriceRatings().mostReviewed.rating}-star average — the middle of the star scale rather than the top of it.`,
    bandsTitle: "Where the money actually goes",
    bandsLead: `Four bands, cut at round numbers a buyer would use. Note that the two middle bands are the thin ones, and that the $150-to-$250 band is entirely one 12V machine plus one more.`,
    bandUnder: `Under $100 — ${kidsRideOnPriceBands()[0].count} listings, ${kidsRideOnPriceBands()[0].voltageMix.join(" and ")}. These are the 6V trike and three 12V wiggle cars and small trucks, and they are the only machines here light enough for a child to reposition alone.`,
    band100to150: `$100 to $150 — ${kidsRideOnPriceBands()[1].count} listings, all 12V. This is where the parent-remote trucks start, and it holds the highest-rated listing in the catalogue.`,
    band150to250: `$150 to $250 — ${kidsRideOnPriceBands()[2].count} listings, both 12V. The band with the most room in it and the thinnest content: the two cars at the top of the 12V range, priced well above every other 12V machine and far below anything with two seats.`,
    bandOver250: `$250 and above — ${kidsRideOnPriceBands()[3].count} listings, ${kidsRideOnPriceBands()[3].voltageMix.join(" and ")}. Four 24V vehicles — three two-seaters and the four-seat golf cart — and one 36V machine. Every one of them states a seat count, and the $${kidsRideOnPriceExtremes().max} 36V listing is the only one in the catalogue with no parental remote.`,
    ratingTitle: "Rating and price are separate facts",
    ratingLead: `Two comparisons a buyer is likely to make, kept apart because they answer different questions and the data does not support merging them.`,
    ratingBest: `Highest rating — the ${kidsRideOnPriceRatings().best.brand} ${kidsRideOnPriceRatings().best.model} at ${kidsRideOnPriceRatings().best.rating} stars and $${kidsRideOnPriceRatings().best.price}, with ${kidsRideOnPriceRatings().best.reviewCount} reviews behind it.`,
    ratingPopular: `Most reviewed — the ${kidsRideOnPriceRatings().mostReviewed.brand} ${kidsRideOnPriceRatings().mostReviewed.model} at $${kidsRideOnPriceRatings().mostReviewed.price} with ${kidsRideOnPriceRatings().mostReviewed.reviewCount.toLocaleString("en-US")} reviews and ${kidsRideOnPriceRatings().mostReviewed.rating} stars. It is the ninth-cheapest car in the catalogue and its 4.3 stars sit mid-scale rather than at the top, which is the point worth holding on to: the listing with by far the most owners behind it is not the best-rated one.`,
    gapNoteTitle: "Three things a price on a listing cannot tell you",
    gapNoteLead: `A sticker price is the most complete number in this dataset, and it is still incomplete.`,
    gapNoteShipping: `Shipping — no listing states a shipping charge, and these are large, heavy boxes. The most expensive car here is the one a parent is least likely to want delivered at the curb.`,
    gapNoteWarranty: `Warranty — only ${d.rows.filter((r) => r.warranty).length} of ${total} listings publish a warranty statement at all, and the ones that do cover a period of months rather than a replacement commitment. That matters most at the top of the price range, where a failure means a $300-plus replacement rather than a $30 one.`,
    gapNoteHistory: `Price history — nothing here records what a listing cost before. The $${kidsRideOnPriceRatings().mostReviewed.price} machine has ${kidsRideOnPriceRatings().mostReviewed.reviewCount.toLocaleString("en-US")} reviews and the catalogue has no way to say whether it is a launch price, a permanent price or a discount.`,
    rosterTitle: "Every car, cheapest first",
    rosterLead: `Prices as the retailer lists them. Seats and rating come from the same listing record and are shown so the price bands can be read against what the money buys.`,
    colBrand: "Brand",
    colModel: "Model",
    colPrice: "Price",
    colTier: "Battery tier",
    colSeats: "Seats",
    colRating: "Stars",
    colReviews: "Reviews",
    notStated: "not stated",
    methodTitle: "How the price figures were read",
    methodBody: [
      `Source: the CMS product snapshot, gated to the id namespace electric_vehicles-* with category "electric_car", minus the listings Stage 1 prunes — ${total} published cars, all ${d.totals.withPrice} of them priced.`,
      `Bands are cut at $100, $150 and $250 and cover every listing exactly once. A price of exactly $100 or $150 falls into the higher band; no listing sits on a boundary, so the rule changes nothing here.`,
      `Gaps are computed between consecutive prices after sorting, so the widest gap is a property of the catalogue rather than of a chosen band.`,
      `Star ratings and review counts are the retailer's own marketplace figures, parsed from the listing text, and are not ratings collected by this site.`,
      `Nothing here was bought, priced independently, or checked against another retailer.`,
    ],
  },
  zh: {
    eyebrow: "Plan-B 资产页 · 价格结构",
    navLabel: "价格结构",
    h1: `童用电动车价格：${total} 款，三个价格带`,
    lead: `这里的 ${total} 款童用电动车全部标了价，因此这是本集群里唯一没有缺口的一页。有意思的不是价格区间，而是区间的形状：价格从 $${kidsRideOnPriceExtremes().min} 到 $${kidsRideOnPriceExtremes().max}，但这段区间并没有被填满。在 $${kidsRideOnPriceGaps().widest.after} 那台车和 $${kidsRideOnPriceGaps().widest.before} 那台车之间有 $${kidsRideOnPriceGaps().widest.size} 的空档，中间什么都没有。`,
    gapTitle: "价格区间中间的那个洞",
    gapLead: `价格区间通常只报最低价和最高价。对这份目录来说那样会误导人，因为最便宜和最贵之间那一段里，藏着全表最大的一步跳跃。`,
    gapWide: `$${kidsRideOnPriceGaps().widest.size} 的空档——在 $${kidsRideOnPriceGaps().widest.after} 的 Best Choice Products SKY7413 和 $${kidsRideOnPriceGaps().widest.before} 的 Best Choice Products SKY9415 之间，一条 listing 都没有。已经攒了 $250 的买家在这份目录里无车可选；再往上就要 $${kidsRideOnPriceGaps().widest.before}。`,
    gapTier: `这个洞就是电压的洞——$200 以下的十款全是 6V 或 12V，$284.98 起的五款全是 24V 或 36V。从 $199.99 跳到 $284.98，就是从单座卡车跳到带家长遥控的双座车，而中间什么都没有。`,
    gapReview: `价格买不到高评分——全目录最贵的那台（$${kidsRideOnPriceExtremes().max}）评分是 ${kidsRideOnPriceExtremes().dearest.rating} 星、${kidsRideOnPriceExtremes().dearest.reviewCount} 条评论；而全表最高分属于一台 $${kidsRideOnPriceRatings().best.price} 的卡车，只有 ${kidsRideOnPriceRatings().best.reviewCount} 条评论。评论数最多的是 $${kidsRideOnPriceRatings().mostReviewed.price} 的 SKY5506，${kidsRideOnPriceRatings().mostReviewed.reviewCount.toLocaleString("en-US")} 条评论、${kidsRideOnPriceRatings().mostReviewed.rating} 星——在星级上是中游，而不是顶端。`,
    bandsTitle: "钱究竟花在了哪一段",
    bandsLead: `四档，用买家自己会用的整数切分。注意中间两档内容都薄，而 $150–$250 那一档实际上只有两台 12V。`,
    bandUnder: `$100 以下——${kidsRideOnPriceBands()[0].count} 款，${kidsRideOnPriceBands()[0].voltageMix.join(" 与 ")}。分别是那台 6V 三轮和几台 12V 滑板摇摇车与小卡车，它们是这里唯一轻到孩子自己就能挪动的机器。`,
    band100to150: `$100–$150——${kidsRideOnPriceBands()[1].count} 款，全是 12V。带家长遥控的卡车从这里开始，而全目录评分最高的那一款也在这里。`,
    band150to250: `$150–$250——${kidsRideOnPriceBands()[2].count} 款，都是 12V。这一档区间最宽、内容却最薄：两台排在 12V 顶端的车，价格远高于其他所有 12V 机型，又远低于任何双座车。`,
    bandOver250: `$250 及以上——${kidsRideOnPriceBands()[3].count} 款，${kidsRideOnPriceBands()[3].voltageMix.join(" 与 ")}。四台 24V 双座车加一台 36V。它们全都写了座位数，而 $${kidsRideOnPriceExtremes().max} 那台 36V 是全目录唯一没有家长遥控的。`,
    ratingTitle: "评分和价格是两件事",
    ratingLead: `买家大概率会做的两种比较，因为回答的是不同问题、且数据不支持把它们合并，所以这里分开呈现。`,
    ratingBest: `评分最高——${kidsRideOnPriceRatings().best.brand} ${kidsRideOnPriceRatings().best.model}，${kidsRideOnPriceRatings().best.rating} 星，$${kidsRideOnPriceRatings().best.price}，背后有 ${kidsRideOnPriceRatings().best.reviewCount} 条评论。`,
    ratingPopular: `评论最多——${kidsRideOnPriceRatings().mostReviewed.brand} ${kidsRideOnPriceRatings().mostReviewed.model}，$${kidsRideOnPriceRatings().mostReviewed.price}，${kidsRideOnPriceRatings().mostReviewed.reviewCount.toLocaleString("en-US")} 条评论，${kidsRideOnPriceRatings().mostReviewed.rating} 星。它在全目录里排第九便宜，而 4.3 星属于星级中游而非顶端——这正是值得记住的一点：背后拥有者最多的那条 listing，并不是评分最高的那条。`,
    gapNoteTitle: "listing 上的价格告诉不了你的三件事",
    gapNoteLead: `标价是这份数据里最完整的一个数字，而它仍然不完整。`,
    gapNoteShipping: `运费——没有任何一款写明运费，而这些是大而重的箱子。这里最贵的那台，恰恰是最不适合送货到门口的一台。`,
    gapNoteWarranty: `保修——只有 ${total} 款中的 ${d.rows.filter((r) => r.warranty).length} 款公布了保修说明，而且写的是几个月的保修期，而不是更换承诺。这一点在价格区间顶端最要紧：那里一次故障意味着三百多美元的替换，而底部只有三十美元。`,
    gapNoteHistory: `价格历史——这里不记录任何 listing 之前卖多少钱。那台 $${kidsRideOnPriceRatings().mostReviewed.price} 的机器有 ${kidsRideOnPriceRatings().mostReviewed.reviewCount.toLocaleString("en-US")} 条评论，而目录无法说明它是首发价、长期价还是折扣价。`,
    rosterTitle: "每一款车，从便宜排到贵",
    rosterLead: `价格为零售商标价。座位数与评分来自同一条 listing 记录，一并列出，是为了让人能对着"这个钱买到什么"来看价格带。`,
    colBrand: "品牌",
    colModel: "型号",
    colPrice: "价格",
    colTier: "电池档位",
    colSeats: "座位数",
    colRating: "星级",
    colReviews: "评论数",
    notStated: "未说明",
    methodTitle: "这些价格数字是怎么读取的",
    methodBody: [
      `数据源：CMS 产品快照，限定 id 命名空间 electric_vehicles-* 且 category 为 "electric_car"，再剔除阶段一剪掉的 listing，共 ${total} 款在售，全部 ${d.totals.withPrice} 款有价格。`,
      `价格带按 $100、$150、$250 切分，每条 listing 恰好落进一档。恰好等于 $100 或 $150 的归入较高一档；本组没有任何一款落在分界点上，所以这条规则在此不影响结果。`,
      `空档是在排序后按相邻价格算出来的，因此最大的那一段是目录本身的性质，而不是某条人为选定的分档。`,
      `星级与评论数是零售商自己的电商平台数据，从 listing 文本解析而来，不是本站收集的评分。`,
      `本页没有任何内容是实际购买、比价或跨零售商核对过的。`,
    ],
  },
};

/** Roster columns. Price leads. */
export const kidsRideOnPriceColumns = (t: RideOnPriceStrings): RideOnColumn[] => [
  {
    key: "brand",
    header: t.colBrand,
    render: (r: never) => (r as { brand?: string }).brand || t.notStated,
  },
  {
    key: "name",
    header: t.colModel,
    render: (r: never) => rideOnLabel(r as never) || t.notStated,
  },
  {
    key: "price",
    header: t.colPrice,
    numeric: true,
    render: (r: never) => {
      const v = (r as { price?: number | null }).price;
      return v === null || v === undefined ? t.notStated : `$${v}`;
    },
  },
  {
    key: "tier",
    header: t.colTier,
    numeric: true,
    render: (r: never) => {
      const v = (r as { voltage?: number | null }).voltage;
      return v === null || v === undefined ? t.notStated : `${v} V`;
    },
  },
  {
    key: "seats",
    header: t.colSeats,
    numeric: true,
    render: (r: never) => {
      const v = (r as { seats?: number | null }).seats;
      return v === null || v === undefined ? t.notStated : String(v);
    },
  },
  {
    key: "rating",
    header: t.colRating,
    numeric: true,
    render: (r: never) => {
      const v = (r as { rating?: number | null }).rating;
      return v === null || v === undefined ? t.notStated : `${v}`;
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

export const kidsRideOnPriceVars = {
  total,
  bands: kidsRideOnPriceBands(),
  extremes: kidsRideOnPriceExtremes(),
  tierFloors: kidsRideOnPriceTierFloors(),
};

export const kidsRideOnPriceIcons = {
  dollar: DollarSign,
  wallet: Wallet,
  trend: TrendingUp,
  gap: AlertTriangle,
  table: Table2,
};
