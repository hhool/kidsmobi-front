// Balance Bike Weight & Build — derived entirely from the CMS product snapshot.
//
// Discipline (Plan-B): every number on this page comes from
// src/data/weightData.generated.ts, produced by `npm run data:weight`. Nothing is
// typed in by hand, including the figures in the SEO description below. Where the
// source does not say something (brake type, tire type) the page says so instead
// of filling the gap with a plausible guess.

import { WEIGHT_DATASET } from "./weightData.generated";

export { WEIGHT_DATASET };

export const WEIGHT_PATH = "/balance-bike-weight/";

const d = WEIGHT_DATASET;

/** Balance-bike and pedal-bike rows, used to phrase the headline from data. */
const balanceRow = d.categories.find((c) => c.key === "balance_bike");
const kidsBikeRow = d.categories.find((c) => c.key === "kids_bikes");
const trikeRow = d.categories.find((c) => c.key === "kids_tricycles");
const pushRow = d.categories.find((c) => c.key === "kids_push_ride_ons");

export const lbToKg = (lb: number) => Math.round(lb * 0.45359237 * 10) / 10;

/** "4.6 lb" plus the metric equivalent, which half our readers use. */
export function weightLabel(lb: number | null): string {
  return lb == null ? "—" : `${lb} lb (${lbToKg(lb)} kg)`;
}

/** Derives the headline sentence from the dataset so it can never drift. */
export function headlineFacts() {
  if (!d.headline) return null;
  const h = d.headline;
  return {
    ...h,
    balanceBikeKg: lbToKg(h.balanceBikeMedianLb),
    kidsBikeKg: lbToKg(h.kidsBikeMedianLb),
    lighterByKg: lbToKg(h.lighterByLb),
    balanceBikeN: balanceRow?.withWeight ?? 0,
    kidsBikeN: kidsBikeRow?.withWeight ?? 0,
  };
}

export const weightSeo = {
  en: {
    title: "How Much Does a Balance Bike Weigh? Ride-On Weights Compared",
    description: d.headline
      ? `Seller-listed weights for ${d.totals.productsScanned} kids' ride-ons: balance bikes median ` +
        `${d.headline.balanceBikeMedianLb} lb vs pedal kids' bikes ${d.headline.kidsBikeMedianLb} lb — ` +
        `a ${d.headline.lighterByLb} lb gap. Full table, method and honest caveats.`
      : "Seller-listed weights for every kids' ride-on we track, with the method and caveats.",
    canonical: WEIGHT_PATH,
    keywords: [
      "how much does a balance bike weigh",
      "balance bike weight",
      "lightweight balance bike",
      "balance bike vs kids bike weight",
      "aluminium vs steel balance bike",
      "toddler ride-on weight chart",
      "kids bike weight by age",
    ],
  },
  zh: {
    title: "平衡车有多重？71 款儿童骑乘玩具重量对比",
    description: d.headline
      ? `来自 ${d.totals.productsScanned} 款儿童骑乘玩具的商家标称重量：平衡车中位 ` +
        `${d.headline.balanceBikeMedianLb} 磅，脚踏童车 ${d.headline.kidsBikeMedianLb} 磅，相差 ` +
        `${d.headline.lighterByLb} 磅。含完整表格、取数方法与如实说明的局限。`
      : "我们收录的每一款儿童骑乘玩具的商家标称重量，含取数方法与局限说明。",
    canonical: WEIGHT_PATH,
    keywords: [
      "平衡车重量",
      "平衡车多重",
      "轻量平衡车",
      "平衡车与童车重量对比",
      "铝合金 高碳钢 平衡车",
      "儿童骑乘玩具重量表",
    ],
  },
};

export const categoryLabels: Record<string, { en: string; zh: string }> = {
  balance_bike: { en: "Balance bike", zh: "平衡车" },
  kids_bikes: { en: "Pedal kids' bike", zh: "脚踏童车" },
  kids_tricycles: { en: "Tricycle", zh: "三轮车" },
  kids_push_ride_ons: { en: "Push / foot-to-floor ride-on", zh: "推行/滑行骑乘玩具" },
};

export const frameLabels: Record<string, { en: string; zh: string }> = {
  "High-Carbon Steel": { en: "High-carbon steel", zh: "高碳钢" },
  "Aluminum Alloy": { en: "Aluminium alloy", zh: "铝合金" },
  "Composite / Plastic": { en: "Composite / plastic", zh: "复合材质 / 塑料" },
  "Not specified": { en: "Not specified", zh: "未标注" },
};

export interface WeightStrings {
  eyebrow: string;
  heroTitle: string;
  heroLead: string;
  heroNote: string;
  headlineTitle: string;
  headlineBody: string;
  tableTitle: string;
  tableLead: string;
  colCategory: string;
  colCount: string;
  colMedian: string;
  colRange: string;
  rosterTitle: string;
  rosterLead: string;
  colBrand: string;
  colModel: string;
  colWeight: string;
  colFrame: string;
  colWheel: string;
  colPrice: string;
  notListed: string;
  frameTitle: string;
  frameLead: string;
  smallSample: string;
  unknownTitle: string;
  unknownLead: string;
  unknownBrake: string;
  unknownTire: string;
  excludedTitle: string;
  excludedLead: string;
  methodTitle: string;
  methodBody: string[];
  checkTitle: string;
  checkLead: string;
  checkBody: string[];
  sourceLabel: string;
}

export const weightStrings: Record<"en" | "zh", WeightStrings> = {
  en: {
    eyebrow: "Weight & build",
    heroTitle: "How much does a balance bike weigh?",
    heroLead:
      "We took the listed weight of every child-powered ride-on in our catalogue — {scanned} products across four categories, {withWeight} of them with a usable weight — and compared them. A balance bike lands at {bbMedian} lb; a pedal kids' bike at {kbMedian} lb.",
    heroNote: "Seller-listed weights, not measured by us.",
    headlineTitle: "The short answer",
    headlineBody:
      "A balance bike is about {lighter} lb ({lighterKg} kg) lighter than a pedal kids' bike — roughly {ratio}× — because it carries no pedals, crank, chain or freewheel. That gap is most of the reason a two-year-old can pick up and control a balance bike at all.",
    tableTitle: "Weight by category",
    tableLead:
      "Median and range of seller-listed weights. n is the number of products in that category that publish a usable weight.",
    colCategory: "Category",
    colCount: "n",
    colMedian: "Median",
    colRange: "Range",
    rosterTitle: "Every balance bike we track, lightest first",
    rosterLead:
      "{n} of the {listed} balance bikes in the catalogue publish a weight. Tap a row to open the product page.",
    colBrand: "Brand",
    colModel: "Model",
    colWeight: "Weight",
    colFrame: "Frame",
    colWheel: "Wheels",
    colPrice: "Price",
    notListed: "Not listed",
    frameTitle: "Does the frame material decide the weight?",
    frameLead:
      "Splitting the {n} balance bikes that list both a weight and a frame material. The aluminium models are the lightest ones here, but the groups are small — read the counts, not just the medians.",
    smallSample: "Fewer than three models — indicative only.",
    unknownTitle: "What this data cannot tell you",
    unknownLead:
      "Two fields look useful and are not. Rather than guess, we publish the gap:",
    unknownBrake:
      "Brake — {specified} of {listed} listings name a brake type. Balance bikes are foot-braked by design, but this snapshot cannot confirm whether any specific model has one. Check the product page before you rely on it.",
    unknownTire:
      "Tire type — {specified} of {listed} listings specify it, so we publish no breakdown at all. Foam and air tires differ in grip, ride and upkeep; that belongs on the listing, not in our guess.",
    excludedTitle: "Values we threw out",
    excludedLead:
      "Weights outside {min}–{max} lb are listing errors, not products. They are excluded from every median above and listed here instead of being quietly dropped.",
    methodTitle: "How these numbers were produced",
    methodBody: [
      "Source: our CMS product specification snapshot ({file}), synced from retailer and manufacturer listings, read on {date}.",
      "Field: Product_Specifications → Measurements → \"Item Weight\". Values in kilograms are converted to pounds; anything the field leaves blank is excluded, not imputed.",
      "Categories: balance bikes, pedal kids' bikes, tricycles and push ride-ons. Scooters are excluded on purpose — the set mixes kick scooters with electric ones up to 37 lb, so one median would be meaningless.",
      "Weights below {min} lb or above {max} lb are treated as listing errors: pulled from the medians and published in the exclusion list.",
      "Re-run with `npm run data:weight`. Nothing on this page is typed in by hand.",
    ],
    checkTitle: "What to do with the number",
    checkLead:
      "A weight figure only matters next to your child. Three checks that need no equipment:",
    checkBody: [
      "Lift test: your child should be able to pick the bike up off the ground and set it down again. If they cannot, it is too heavy for them to recover after a wobble.",
      "Carry test: they should manage it across a room, and up and down a kerb. This is the one that decides whether you end up carrying it home.",
      "Stand-over test: standing over the frame in shoes, both feet flat on the ground, with a little bend in the knee. Pair this with the seat-height numbers on our size chart.",
    ],
    sourceLabel: "Source",
  },
  zh: {
    eyebrow: "重量与结构",
    heroTitle: "平衡车到底有多重？",
    heroLead:
      "我们把目录中每一款靠孩子自己驱动的骑乘玩具标称重量都取了出来——四大品类共 {scanned} 款，其中 {withWeight} 款给出了可用重量——并做了对比。平衡车中位 {bbMedian} 磅，脚踏童车 {kbMedian} 磅。",
    heroNote: "重量为商家标称值，非我们实测。",
    headlineTitle: "一句话回答",
    headlineBody:
      "平衡车比脚踏童车轻约 {lighter} 磅（{lighterKg} 公斤）——大约 {ratio} 倍——因为它没有脚踏、曲柄、链条和飞轮。这个差距正是两岁孩子能把平衡车扶起来、控制住的主要原因。",
    tableTitle: "各品类重量",
    tableLead:
      "商家标称重量的中位数与区间。n 为该品类中给出可用重量的商品数量。",
    colCategory: "品类",
    colCount: "样本数",
    colMedian: "中位数",
    colRange: "区间",
    rosterTitle: "我们收录的全部平衡车，由轻到重",
    rosterLead:
      "目录中共 {listed} 款平衡车，其中 {n} 款给出了重量。点击任意一行可打开商品页。",
    colBrand: "品牌",
    colModel: "型号",
    colWeight: "重量",
    colFrame: "车架",
    colWheel: "轮径",
    colPrice: "价格",
    notListed: "未标注",
    frameTitle: "车架材质决定重量吗？",
    frameLead:
      "以下按车架材质拆分那 {n} 款同时标注了重量与车架材质的平衡车。铝合金款在这里最轻，但各组样本都很小——请看样本数，而不只是中位数。",
    smallSample: "样本不足三款，仅供参考。",
    unknownTitle: "这份数据无法告诉你的",
    unknownLead: "有两个字段看似有用实则不可用。与其猜测，我们把缺口写出来：",
    unknownBrake:
      "刹车——{listed} 条商品信息中有 {specified} 条标注了刹车类型。平衡车在设计上靠脚刹车，但这份快照无法确认某一具体型号是否带刹车。请以商品页为准。",
    unknownTire:
      "轮胎类型——{listed} 条商品信息中有 {specified} 条标注，因此我们干脆不给出任何分布。发泡轮与充气轮在抓地、骑感和维护上差别很大，这应由商品页说明，而不是由我们猜。",
    excludedTitle: "被我们剔除的数值",
    excludedLead:
      "落在 {min}–{max} 磅之外的重量属于商品信息错误，而非真实产品。它们已从上面所有中位数中剔除，并在此列出，而不是悄悄丢掉。",
    methodTitle: "这些数字是怎么来的",
    methodBody: [
      "来源：本站 CMS 商品规格快照（{file}），同步自零售商与品牌方商品页，读取日期 {date}。",
      "字段：Product_Specifications → Measurements → \"Item Weight\"。以公斤标注的已换算为磅；字段为空的直接排除，不做推算填补。",
      "品类：平衡车、脚踏童车、三轮车、推行/滑行骑乘玩具。滑板车被刻意排除——该集合中混杂了电动款（最重 37 磅），单一中位数没有意义。",
      "低于 {min} 磅或高于 {max} 磅的重量视为商品信息错误：从所有中位数中剔除，并在剔除清单中公开列出。",
      "重新生成：`npm run data:weight`。本页所有数字都不是手写的。",
    ],
    checkTitle: "拿到这个数字之后该做什么",
    checkLead: "重量只有对照自家孩子才有意义。三个不需要任何工具的检查：",
    checkBody: [
      "提起测试：孩子应能把车从地面提起来再放下。提不动，说明车身对他来说太重，晃动后无法自救。",
      "搬运测试：他应能推着它穿过一个房间、上下路缘。这一项决定了最后是你扛回家还是他自己骑回家。",
      "跨立测试：穿鞋站在车架上，双脚平踩地面，膝盖略有弯曲。请配合我们尺寸对照页里的座高数据一起看。",
    ],
    sourceLabel: "来源",
  },
};

/** Category rows joined with their display labels, ready to render. */
export const weightCategoryRows = [balanceRow, kidsBikeRow, trikeRow, pushRow]
  .filter((c): c is NonNullable<typeof c> => Boolean(c))
  .map((c) => ({ ...c, label: categoryLabels[c.key] ?? { en: c.key, zh: c.key } }));

export function frameLabel(material: string) {
  return frameLabels[material] ?? { en: material, zh: material };
}

export function buildWeightDatasetSchema(pageUrl: string) {
  const h = d.headline;
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Kids' ride-on weights — balance bikes, pedal kids' bikes, tricycles and push ride-ons",
    description: h
      ? `Seller-listed weights for ${d.totals.productsScanned} child-powered ride-ons: balance bikes median ` +
        `${h.balanceBikeMedianLb} lb (n=${balanceRow?.withWeight ?? 0}) vs pedal kids' bikes ` +
        `${h.kidsBikeMedianLb} lb (n=${kidsBikeRow?.withWeight ?? 0}). Every figure is derived from the ` +
        `CMS product specification snapshot read on ${d.source.retrievedAt}.`
      : "Seller-listed weights for every child-powered ride-on in the BalanceBikeToddler catalogue, with medians per category and the method used to derive them.",
    url: pageUrl,
    creator: {
      "@type": "Organization",
      name: "BalanceBikeToddler",
      url: "https://balancebiketoddler.com",
    },
    dateModified: d.source.retrievedAt,
    license: "https://creativecommons.org/licenses/by/4.0/",
    keywords: [
      "balance bike weight",
      "kids bike weight",
      "ride-on weight comparison",
      "toddler bike frame material",
    ],
    variableMeasured: d.categories.map((c) => ({
      "@type": "PropertyValue",
      name: `${categoryLabels[c.key]?.en ?? c.key} — median listed weight`,
      value: c.medianLb,
      unitText: "lb",
      minValue: c.minLb,
      maxValue: c.maxLb,
    })),
    sourceOrganization: {
      "@type": "Organization",
      name: d.source.name,
    },
  };
}
