import { SIZING_DATASET } from "./sizeData.generated";

/**
 * Types + narrative copy for the balance-bike sizing / specification comparison
 * page (Plan-B Asset 3).
 *
 * The raw figures come from src/data/sizeData.generated.ts, produced by
 * `npm run data:sizing`. Every spec is normalized from each product's CMS
 * specification record — none are hand-written. Where a spec was not published
 * by the source (e.g. minimum seat height), the row shows "—" rather than an
 * estimate, and the methodology section tells the reader to confirm it with the
 * manufacturer. That honesty is the whole point of Plan B.
 */

export type SizingBike = {
  id: string;
  brand: string;
  name: string;
  ageText: string;
  ageMinMonths: number | null;
  ageMaxMonths: number | null;
  wheelInches: number | null;
  weightLbs: number | null;
  frameMaterial: string;
  steeringLimitDeg: number | null;
  priceUsd: number | null;
  rating: number | null;
  reviewCount: number;
  productUrl: string;
};

export const SIZING_PATH = "/balance-bike-size-chart/";

export const sizingDataset = SIZING_DATASET as {
  source: {
    name: string;
    note: string;
    exportFile: string;
    retrievedAt: string;
  };
  totals: {
    balanceBikesListed: number;
    withWheelSize: number;
    withSteeringLimit: number;
  };
  ageSpreadMonths: {
    min: number | null;
    max: number | null;
  };
  bikes: SizingBike[];
};

export const sizingSeo = {
  en: {
    title: "Balance Bike Size Chart: Real Specs Compared",
    description:
      "A side-by-side comparison of balance bikes' real specifications — age range, wheel size, weight, frame and steering limit — drawn from each product's specification record. Plus how to size a balance bike by inseam and weight.",
    keywords: [
      "balance bike size chart",
      "balance bike sizing",
      "balance bike specs compared",
      "what size balance bike",
      "balance bike by age",
    ],
  },
  zh: {
    title: "平衡车尺寸对照表：真实参数并排对比",
    description:
      "并排对比多款平衡车的真实规格——适用年龄、轮径、重量、车架与转向限制，均取自各产品的规格记录，并说明如何按内腿长与体重为孩子选尺寸。",
    keywords: ["平衡车尺寸对照表", "平衡车怎么选尺寸", "平衡车规格对比", "几岁用平衡车"],
  },
};

export function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}

export function formatAge(b: SizingBike): string {
  const { ageMinMonths, ageMaxMonths } = b;
  if (ageMinMonths == null || ageMaxMonths == null) return b.ageText || "—";
  const show = (m: number) => (m % 12 === 0 && m >= 12 ? `${m / 12} yr` : `${m} mo`);
  return ageMinMonths === ageMaxMonths ? show(ageMinMonths) : `${show(ageMinMonths)}–${show(ageMaxMonths)}`;
}

export function formatInches(v: number | null): string {
  return v == null ? "—" : `${v} in`;
}

export function formatWeight(v: number | null): string {
  return v == null ? "—" : `${v} lb`;
}

export function formatPrice(v: number | null): string {
  return v == null ? "—" : `$${v.toFixed(2)}`;
}

export function formatSteering(v: number | null): string {
  return v == null ? "—" : `${v}° limit`;
}

/**
 * Dataset schema so crawlers (and AI search surfaces) treat the comparison as a
 * machine-readable data resource rather than prose.
 */
export function buildSizingDatasetSchema(pageUrl: string): Record<string, unknown> {
  const { source, totals, ageSpreadMonths } = sizingDataset;
  const ageMin = ageSpreadMonths.min;
  const ageMax = ageSpreadMonths.max;
  const ageClause =
    ageMin != null && ageMax != null
      ? `covering roughly ${Math.floor(ageMin / 12) > 0 ? `${Math.floor(ageMin / 12)}–` : ""}${Math.ceil(ageMax / 12)} years`
      : "";
  const origin = pageUrl.split("/balance-bike-size-chart/")[0] || "/";
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `Balance bike specification comparison (${totals.balanceBikesListed} models)`,
    description:
      `${totals.balanceBikesListed} balance bikes compared on age range, wheel size, weight, frame material and steering limit, ` +
      `normalized from each product's specification record ${ageClause}. ${totals.withWheelSize} list a wheel size and ${totals.withSteeringLimit} list a steering limit.`,
    url: pageUrl,
    isAccessibleForFree: true,
    dateModified: source.retrievedAt,
    keywords: [
      "balance bike size chart",
      "balance bike specs",
      "kids bike sizing",
      "product specifications",
    ],
    creator: {
      "@type": "Organization",
      name: "BalanceBikeToddler",
      url: origin,
    },
    citation: {
      "@type": "CreativeWork",
      name: source.name,
    },
  };
}

type UiStrings = {
  eyebrow: string;
  heroTitle: string;
  heroLead: string;
  heroNote: string;
  retrievedLabel: string;
  ageSpreadLabel: string;
  whyTitle: string;
  whyBody: string;
  tableTitle: string;
  tableLead: string;
  colBrand: string;
  colAge: string;
  colWheel: string;
  colWeight: string;
  colSteering: string;
  colFrame: string;
  colPrice: string;
  colRating: string;
  methodTitle: string;
  methodBody: string[];
  seatHeightTitle: string;
  seatHeightBody: string;
  weightRuleTitle: string;
  weightRuleBody: string;
  wheelByAgeTitle: string;
  wheelByAgeBody: string;
  disclaimerTitle: string;
  disclaimerBody: string;
  viewProduct: string;
};

export const sizingStrings: Record<"en" | "zh", UiStrings> = {
  en: {
    eyebrow: "Sizing & specs",
    heroTitle: "Balance Bike Size Chart: Real Specs Compared Side by Side",
    heroLead:
      "We pulled the published specification record for every balance bike in our database and lined them up on the dimensions that actually decide the fit: age range, wheel size, weight, frame and steering limit. No guesses, no invented measurements.",
    heroNote:
      "Use the table to shortlist models, then confirm the one number that matters most for fit — the minimum seat height — against the manufacturer, because that figure is not published consistently and we will not estimate it for you.",
    retrievedLabel: "Specifications retrieved",
    ageSpreadLabel: "Age spread",
    whyTitle: "Why a spec table instead of a ranking",
    whyBody:
      "Most 'best balance bike' lists rank by feel. We cannot test these, and Plan B is explicit that we will not claim tests we did not run. A comparison of published specifications is something we can stand behind: every cell is traceable to the product's own listing.",
    tableTitle: `Specification comparison ({count} balance bikes)`,
    tableLead:
      "Sorted by starting age. “—” means the source listing did not publish that figure; we leave it blank rather than guess. Click a model for its full page.",
    colBrand: "Brand / model",
    colAge: "Age",
    colWheel: "Wheel",
    colWeight: "Weight",
    colSteering: "Steering",
    colFrame: "Frame",
    colPrice: "Price",
    colRating: "Rating",
    methodTitle: "How this comparison was built",
    methodBody: [
      "Each row is normalized from the product's specification record in our CMS, which is synced from retailer and manufacturer listings.",
      "Age range is parsed from the published age text; wheel size and weight are parsed from the listed measurements.",
      "Steering limit is read from the product's safety copy (e.g. a 135° limit that stops the front wheel from turning flat).",
      "Models with duplicate names were collapsed to one listing. Numbers can change when listings are updated.",
      "Re-running `npm run data:sizing` regenerates this page from the current snapshot.",
    ],
    seatHeightTitle: "The number we will not guess: minimum seat height",
    seatHeightBody:
      "Seat height is the single most important fit dimension — the child must be able to sit with feet flat and a slight bend. Manufacturers publish it inconsistently, so it is absent from many rows above. Before buying, look up the model's minimum seat height and make sure it is at or below your child's inseam (the distance from the floor to the crotch, measured with shoes off). If the seat is higher than the inseam, the bike is too big.",
    weightRuleTitle: "The weight rule most parents miss",
    weightRuleBody:
      "A useful rule of thumb: the bike should weigh no more than about 30% of the child's body weight. A 30 lb toddler paired with a 9 lb bike is at the edge; lighter is easier to control, pick up after a fall, and carry. That is why the Weight column is in the table even when the seat height is not.",
    wheelByAgeTitle: "Wheel size by age (rough guide)",
    wheelByAgeBody:
      "Where a wheel size is listed, it tracks age: 7–10 in wheels suit roughly 10–36 months, 12 in wheels suit about 2–4 years, and larger wheels suit older children. Treat wheel size as a check on the age range, not a replacement for measuring your child.",
    disclaimerTitle: "What this page is and is not",
    disclaimerBody:
      "This is a comparison of published specifications, not a test result, not a ranking, and not medical or safety advice. Specifications come from retailer/manufacturer listings and can be wrong or out of date; always confirm the minimum seat height and current price with the manufacturer or seller before purchase.",
    viewProduct: "View full page",
  },
  zh: {
    eyebrow: "尺寸与规格",
    heroTitle: "平衡车尺寸对照表：真实参数并排对比",
    heroLead:
      "我们把数据库中每款平衡车的公开规格记录取出，按真正决定合身度的维度并排排列：适用年龄、轮径、重量、车架与转向限制。不猜测，不虚构测量值。",
    heroNote:
      "用本表先缩小候选范围，再向厂商确认那项对合身度最关键的数值——最低座高，因为它并非各家都一致公开，我们不会替你估算。",
    retrievedLabel: "规格抓取时间",
    ageSpreadLabel: "年龄跨度",
    whyTitle: "为什么用规格表而不是排名",
    whyBody:
      "多数「最佳平衡车」榜单凭手感排名。我们无法实测这些车，而 Plan B 明确规定不声称未做过的测试。公开规格的对比是我们能够负责的内容：每个单元格都可回溯到产品自己的商品页。",
    tableTitle: "规格对比（{count} 款平衡车）",
    tableLead:
      "按起始年龄排序。「—」表示该商品页未公开此项，我们留空而非猜测。点击型号查看完整页面。",
    colBrand: "品牌 / 型号",
    colAge: "年龄",
    colWheel: "轮径",
    colWeight: "重量",
    colSteering: "转向",
    colFrame: "车架",
    colPrice: "价格",
    colRating: "评分",
    methodTitle: "本对比如何构建",
    methodBody: [
      "每一行均取自产品在 CMS 中的规格记录，该记录由商家与厂商商品页同步而来。",
      "年龄区间解析自公开的的年龄文字；轮径与重量解析自标注的测量值。",
      "转向限制读取自产品的安全说明（如 135° 限制，防止前轮翻转）。",
      "重复名称的型号已合并为一条。商品页更新时数字可能变化。",
      "重跑 `npm run data:sizing` 即可用当前快照重新生成本页。",
    ],
    seatHeightTitle: "我们不会猜的数字：最低座高",
    seatHeightBody:
      "座高是合身度最关键的维度——孩子必须能坐上去、双脚平放且膝盖微弯。厂商公开得不一致，因此上表许多行缺失。购买前请查该型号的最低座高，并确保它≤孩子的内腿长（光脚从地面到胯下的距离）。若座高高于内腿长，说明车过大。",
    weightRuleTitle: "多数家长忽略的重量法则",
    weightRuleBody:
      "一个实用的经验法则：车重不应超过孩子体重的约 30%。30 磅幼儿配 9 磅车已接近上限；越轻越容易操控、摔倒后扶起、以及搬运。这正是即使缺少座高，重量列也保留在表内的原因。",
    wheelByAgeTitle: "按年龄看轮径（粗略参考）",
    wheelByAgeBody:
      "凡标注了轮径，它大致跟随年龄：7–10 英寸轮适合约 10–36 个月，12 英寸轮适合约 2–4 岁，更大轮径适合更大孩子。把轮径当作对年龄区间的校验，而非替代对孩子实际身高的测量。",
    disclaimerTitle: "本页是什么，不是什么",
    disclaimerBody:
      "这是公开规格的对比，不是测试结果，不是排名，也不是医疗或安全建议。规格来自商家／厂商商品页，可能有误或过期；购买前请务必向厂商或卖家确认最低座高与当前价格。",
    viewProduct: "查看完整页面",
  },
};
