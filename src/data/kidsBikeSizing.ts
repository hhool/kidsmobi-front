import { KIDS_SIZING_DATASET } from "./kidsBikeSizeData.generated";

/**
 * Types + narrative copy for the kids-bike sizing / specification comparison
 * page (Plan-B Asset, kids-bikes counterpart of balance-bike size-chart).
 *
 * The raw figures come from src/data/kidsBikeSizeData.generated.ts, produced by
 * `npm run data:kids-sizing`. Every spec is normalized from each product's CMS
 * specification record — none are hand-written. Where a spec was not published
 * by the source (e.g. minimum seat height), the row shows "—" rather than an
 * estimate, and the methodology section tells the reader to confirm it with the
 * manufacturer. That honesty is the whole point of Plan B.
 */

export type KidsBikeSizingBike = {
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

export const KIDS_SIZING_PATH = "/kids-bike-size-chart/";

export const kidsBikeSizingDataset = KIDS_SIZING_DATASET as {
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
  bikes: KidsBikeSizingBike[];
};

export const kidsBikeSizingSeo = {
  en: {
    title: "Kids Bike Size Chart: Real Specs Compared",
    description:
      "A side-by-side comparison of kids bikes' real specifications — age range, wheel size, weight, frame and brake type — drawn from each product's specification record. Plus how to size a kids bike by inseam and weight.",
    keywords: [
      "kids bike size chart",
      "kids bike sizing",
      "kids bike specs compared",
      "what size kids bike",
      "kids bike by age",
    ],
  },
  zh: {
    title: "儿童自行车尺寸对照表与规格对比（真实参数，非估算）",
    description:
      "并排对比多款儿童自行车的真实规格——适用年龄、轮径、重量、车架与刹车类型，均取自各产品的规格记录，并说明如何按内腿长与体重为孩子选尺寸。",
    keywords: ["儿童自行车尺寸对照表", "儿童自行车怎么选尺寸", "儿童自行车规格对比", "几岁用儿童自行车"],
  },
};

export function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}

export function formatAge(b: KidsBikeSizingBike): string {
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
export function buildKidsBikeSizingDatasetSchema(pageUrl: string): Record<string, unknown> {
  const { source, totals, ageSpreadMonths } = kidsBikeSizingDataset;
  const ageMin = ageSpreadMonths.min;
  const ageMax = ageSpreadMonths.max;
  const ageClause =
    ageMin != null && ageMax != null
      ? `covering roughly ${Math.floor(ageMin / 12) > 0 ? `${Math.floor(ageMin / 12)}–` : ""}${Math.ceil(ageMax / 12)} years`
      : "";
  const origin = pageUrl.split("/kids-bike-size-chart/")[0] || "/";
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `Kids bike specification comparison (${totals.balanceBikesListed} models)`,
    description:
      `${totals.balanceBikesListed} kids bikes compared on age range, wheel size, weight, frame material and brake type, ` +
      `normalized from each product's specification record ${ageClause}. ${totals.withWheelSize} list a wheel size and ${totals.withSteeringLimit} list a steering limit.`,
    url: pageUrl,
    isAccessibleForFree: true,
    dateModified: source.retrievedAt,
    keywords: [
      "kids bike size chart",
      "kids bike specs",
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

export const kidsBikeSizingStrings: Record<"en" | "zh", UiStrings> = {
  en: {
    eyebrow: "Sizing & specs",
    heroTitle: "Kids Bike Size Chart: Real Specs Compared Side by Side",
    heroLead:
      "We pulled the published specification record for every kids bike in our database and lined them up on the dimensions a first pedal bike actually turns on: wheel size, frame, weight and the stated age range. A pedal bike has more parts that decide fit than a balance bike does — and fewer of them get published, so the blank cells below carry as much information as the numbers.",
    heroNote:
      "Use the table to shortlist models, then check the two dimensions listings publish least reliably — standover height and lowest seat position — against the manufacturer. They decide whether your child can get on and off the bike at all, and we will not estimate them for you.",
    retrievedLabel: "Specifications retrieved",
    ageSpreadLabel: "Age spread",
    whyTitle: "What a spec table can settle, and what it cannot",
    whyBody:
      "Most 'best kids bike' lists rank by feel. We cannot test these, and Plan B is explicit that we will not claim tests we did not run. What published specifications can settle is narrower and still worth having: which listings actually offer a 20-inch wheel, which frame material you are paying for, and which listings publish a weight at all. What they cannot settle is fit — that needs the two measurements called out below, which is exactly why they are kept out of the table instead of being estimated into it.",
    tableTitle: `Every published spec, side by side ({count} kids bikes)`,
    tableLead:
      "Sorted by wheel size, then by starting age — wheel size is the axis this category is actually built on. “—” means the source listing did not publish that figure; we leave it blank rather than guess. Click a model for its full page.",
    colBrand: "Brand / model",
    colAge: "Age",
    colWheel: "Wheel",
    colWeight: "Weight",
    colSteering: "Steering",
    colFrame: "Frame",
    colPrice: "Price",
    colRating: "Rating",
    methodTitle: "How we normalized each spec row",
    methodBody: [
      "Each row is normalized from the product's specification record in our CMS, which is synced from retailer and manufacturer listings.",
      "Age range is parsed from the published age text; wheel size, weight and price are parsed from the listed measurements.",
      "The steering column is empty for every kids bike in this catalogue, and that is a finding rather than an omission: a limited steering arc is a strider safety feature, and pedal-bike listings do not carry it. The control that matters on a pedal bike is the brake, which listings state in their prose rather than in a comparable field.",
      "Frame material is taken verbatim. Listings in this category describe both steel and aluminium frames as 'light', which is one reason the column stays.",
      "Models with duplicate names were collapsed to one listing. Numbers can change when listings are updated.",
      "Re-running `npm run data:kids-sizing` regenerates this page from the current snapshot.",
    ],
    seatHeightTitle: "The measurement nobody publishes: standover height",
    seatHeightBody:
      "On a pedal bike the first measurement is not the seat, it is the frame. Your child has to be able to stand over the top tube with both feet flat on the ground — to mount, to dismount, and to recover from a wobble — and standover height is the dimension listings publish least. It is missing from most rows above. Before buying, find the model's standover height and compare it with your child's inside leg; if the tube sits above that, the bike is too big whatever the age range says. Lowest seat position comes next, because it sets how far the saddle can drop for a child still growing into the frame.",
    weightRuleTitle: "Why the weight column survives the gaps",
    weightRuleBody:
      "Kids bikes are heavier than balance bikes, and the children riding them are heavier too, so the percentage-of-body-weight rule that works for a balance bike stops being the useful question here. What matters is more ordinary: can your child hold the bike upright on a slight slope, steer with one hand, and get it back up after a fall without help. A steel 20-inch bike and an aluminium one at the same wheel size are different propositions, and the weight column is the only place a listing lets you tell them apart — which is why it stays in the table even where the frame measurements are missing.",
    wheelByAgeTitle: "Wheel size is the sizing axis here",
    wheelByAgeBody:
      "For kids bikes, wheel size is not a footnote to the age range — it is the axis the category is built on. A 12-inch wheel is a first pedal bike, 14 and 16 inch cover the middle years, and 20 inch is the largest most children need before an adult frame. Listings publish it far more consistently than seat or standover height, so treat it as the one number you can compare across brands. It is still not a substitute for measuring your child: a 16-inch bike with a high bottom bracket can be a worse fit than a 14-inch one with a low one.",
    disclaimerTitle: "Where a spec table stops being enough",
    disclaimerBody:
      "This is a comparison of published specifications, not a test result, not a ranking, and not medical or safety advice. Specifications come from retailer/manufacturer listings and can be wrong or out of date; always confirm standover height, lowest seat position and current price with the manufacturer or seller before purchase.",
    viewProduct: "View full page",
  },
  zh: {
    eyebrow: "尺寸与规格",
    heroTitle: "儿童自行车尺寸对照表：真实参数并排对比",
    heroLead:
      "我们把数据库中每款儿童自行车的公开规格记录取出，按第一辆脚踏车真正相关的维度并排排列：轮径、车架、重量与标称适龄区间。脚踏车比平衡车多了几样决定合身的部件，而它们被公开得反而更少——所以下表的空格和数字一样有信息量。",
    heroNote:
      "用本表先缩小候选范围，再向厂商确认那两项公开得最不一致的尺寸——上管高度（standover）与最低座高。它们决定孩子能不能自己上下车，我们不会替你估算。",
    retrievedLabel: "规格抓取时间",
    ageSpreadLabel: "年龄跨度",
    whyTitle: "规格表能确定什么，不能确定什么",
    whyBody:
      "多数「最佳儿童自行车」榜单凭手感排名。我们无法实测这些车，而 Plan B 明确规定不声称未做过的测试。公开规格能确定的范围更窄，但仍有价值：哪些 listing 真的提供 20 英寸轮、你付的钱买到的是什么车架材质、以及哪些车公布了重量。它不能确定的是合身——那需要下面单独点出的两项测量，所以它们被放在表外说明，而不是被估算了填进表里。",
    tableTitle: "已公开的规格逐项并排（{count} 款儿童自行车）",
    tableLead:
      "先按轮径、再按起始年龄排序——轮径才是这个品类真正的轴。「—」表示该商品页未公开此项，我们留空而非猜测。点击型号查看完整页面。",
    colBrand: "品牌 / 型号",
    colAge: "年龄",
    colWheel: "轮径",
    colWeight: "重量",
    colSteering: "转向",
    colFrame: "车架",
    colPrice: "价格",
    colRating: "评分",
    methodTitle: "每一行规格是怎么归一化的",
    methodBody: [
      "每一行均取自产品在 CMS 中的规格记录，该记录由商家与厂商商品页同步而来。",
      "年龄区间解析自公开的年龄文字；轮径、重量与价格解析自标注的测量值。",
      "转向列在本目录每一款儿童自行车上都是空的，这本身是个发现而不是疏漏：限制转向角是平衡车的安全设计，脚踏车商品页不写这个字段。脚踏车上真正起作用的操控件是刹车，而各家用散文描述，没有可比字段。",
      "车架材质按原文照抄。本品类的商品页把钢架和铝架都称作「轻」，这正是该列保留的原因。",
      "重复名称的型号已合并为一条。商品页更新时数字可能变化。",
      "重跑 `npm run data:kids-sizing` 即可用当前快照重新生成本页。",
    ],
    seatHeightTitle: "谁都不公开的那项测量：上管高度",
    seatHeightBody:
      "脚踏车上第一个要量的不是座垫，是车架。孩子必须能双腿平放跨站在上管之上——上车、下车、以及从晃动中恢复都靠它——而上管高度正是各商品页公开得最差的一项，上表多数行都缺。购买前请查该型号的上管高度，和孩子的跨下内腿长对比；如果上管高于它，那么无论标称年龄怎么写，这辆车都太大了。其次是最低座高，它决定座垫能为一个还在长个的孩子降到多低。",
    weightRuleTitle: "为什么重量这一列值得留在缺口旁边",
    weightRuleBody:
      "儿童自行车比平衡车重，骑它的孩子也比骑平衡车的重，所以「占体重百分比」那条对平衡车好用的法则到这里就不再是要问的问题。更要紧的是些很平常的事：孩子能不能在缓坡上把车扶正、单手扶把、摔倒了不用帮忙自己扶起来。同轮径下一辆钢架车和一辆铝架车是不同的东西，而重量列是商品页里唯一能让你把它们区分开的地方——这就是为什么即使在车架尺寸缺失的行里，它也留着。",
    wheelByAgeTitle: "轮径才是这里的尺寸轴",
    wheelByAgeBody:
      "对儿童自行车来说，轮径不是年龄区间的附注，而是这个品类建立其上的轴。12 英寸是第一辆脚踏车，14 和 16 英寸覆盖中间几年，20 英寸是多数孩子换成人车架之前需要的最大尺寸。商品页对轮径的公布远比座高或上管高度一致，所以它是唯一可以跨品牌比较的数字。它依然不能替代量孩子：一辆底架高的 16 英寸车，可能比一辆底架低的 14 英寸车更不合身。",
    disclaimerTitle: "规格表力有不逮的地方",
    disclaimerBody:
      "这是公开规格的对比，不是测试结果，不是排名，也不是医疗或安全建议。规格来自商家／厂商商品页，可能有误或过期；购买前请务必向厂商或卖家确认上管高度、最低座高与当前价格。",
    viewProduct: "查看完整页面",
  },
};
