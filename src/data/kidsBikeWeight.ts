// Kids Bike Weight & Build — derived entirely from the CMS product snapshot.
//
// Discipline (Plan-B): every number on this page comes from
// src/data/weightData.generated.ts, produced by `npm run data:weight`. Nothing is
// typed in by hand, including the figures in the SEO description below. This is
// the kids-bikes (pedal bike) counterpart of balanceBikeWeight; it reuses the
// same single source so the two comparison rows can never drift apart.
//
// Where the source does not say something (a pedal-bike frame split, brake or
// tyre type) the page says so instead of filling the gap with a guess.

import { WEIGHT_DATASET } from "./weightData.generated";

export const KIDS_WEIGHT_PATH = "/kids-bike-weight/";

/** Re-exported under a unique name so prerender-pages.ts can use it without
 * colliding with balanceBikeWeight's `WEIGHT_DATASET` export. */
export const KIDS_WEIGHT_DATASET = WEIGHT_DATASET;

const d = WEIGHT_DATASET;

const kidsRow = d.categories.find((c) => c.key === "kids_bikes");
const balanceRow = d.categories.find((c) => c.key === "balance_bike");
const trikeRow = d.categories.find((c) => c.key === "kids_tricycles");
const pushRow = d.categories.find((c) => c.key === "kids_push_ride_ons");

export const lbToKg = (lb: number) => Math.round(lb * 0.45359237 * 10) / 10;

export const categoryLabels: Record<string, { en: string; zh: string }> = {
  kids_bikes: { en: "Pedal kids' bike", zh: "脚踏童车" },
  balance_bike: { en: "Balance bike", zh: "平衡车" },
  kids_tricycles: { en: "Tricycle", zh: "三轮车" },
  kids_push_ride_ons: { en: "Push / foot-to-floor ride-on", zh: "推行/滑行骑乘玩具" },
};

/** Four-category comparison rows, joined with their display labels. */
export const kidsWeightCategoryRows = [kidsRow, balanceRow, trikeRow, pushRow]
  .filter((c): c is NonNullable<typeof c> => Boolean(c))
  .map((c) => ({ ...c, label: categoryLabels[c.key] ?? { en: c.key, zh: c.key } }));

/** Headline facts derived from the dataset so they can never drift. */
export function kidsWeightHeadline() {
  const h = d.headline;
  return {
    kbMedian: h.kidsBikeMedianLb,
    kbMedianKg: lbToKg(h.kidsBikeMedianLb),
    bbMedian: h.balanceBikeMedianLb,
    lighter: h.lighterByLb,
    lighterKg: lbToKg(h.lighterByLb),
    ratio: h.ratio,
    kbListed: kidsRow?.listed ?? 0,
    kbWithWeight: kidsRow?.withWeight ?? 0,
    kbMin: kidsRow?.minLb ?? 0,
    kbMax: kidsRow?.maxLb ?? 0,
  };
}

/** The only measured frame split in the snapshot is the balance-bike subset;
 * pedal bikes are not split by frame, so we surface the subset honestly. */
export function kidsWeightFrameNote() {
  const steel = d.frameBreakdown.find((f) => f.material === "High-Carbon Steel");
  const alu = d.frameBreakdown.find((f) => f.material === "Aluminum Alloy");
  return {
    steelMed: steel?.medianLb ?? null,
    aluMed: alu?.medianLb ?? null,
  };
}

export const kidsWeightSeo = {
  en: {
    // Stem = 41 chars (<=44 budget); full title with suffix = 62 (<65).
    title: "Kids Bike Weight: How Much Does It Weigh?",
    description:
      "Weights for 23 pedal kids' bikes (14 listed): median 19.9 lb (9.0 kg), range " +
      "9.4-29.6 lb - about 4.2x a balance bike. Method and honest caveats.",
    canonical: KIDS_WEIGHT_PATH,
    keywords: [
      "how much does a kids bike weigh",
      "kids bike weight",
      "pedal bike weight",
      "kids bike vs balance bike weight",
      "lightweight kids bike",
      "kids bike weight by age",
      "steel vs aluminium kids bike",
    ],
  },
  zh: {
    title: "儿童自行车重量：一辆到底有多重？",
    description:
      "来自 23 款脚踏童车的商家标称重量（14 款给出）：中位 19.9 磅（9.0 公斤），" +
      "区间 9.4–29.6 磅，约为平衡车的 4.2 倍。含取数方法与如实说明的局限。",
    canonical: KIDS_WEIGHT_PATH,
    keywords: [
      "儿童自行车重量",
      "儿童脚踏车多重",
      "儿童自行车与平衡车重量",
      "轻量儿童自行车",
      "儿童自行车重量对照",
    ],
  },
};

export interface KidsWeightStrings {
  eyebrow: string;
  heroTitle: string;
  heroLead: string;
  heroNote: string;
  shortTitle: string;
  shortBody: string;
  compareTitle: string;
  compareLead: string;
  colCategory: string;
  colCount: string;
  colMedian: string;
  colRange: string;
  mechTitle: string;
  mechLead: string;
  wheelTitle: string;
  wheelLead: string;
  frameTitle: string;
  frameLead: string;
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

export const kidsWeightStrings: Record<"en" | "zh", KidsWeightStrings> = {
  en: {
    eyebrow: "Weight & build",
    heroTitle: "How much does a pedal kids' bike weigh?",
    heroLead:
      "We pulled the listed weight of every child-powered ride-on in our catalogue - " +
      "{scanned} products across four categories, {withWeight} with a usable weight - and " +
      "looked at the pedal bikes on their own. A pedal kids' bike lands at {kbMedian} lb " +
      "({kbMedianKg} kg); a balance bike, by comparison, is {bbMedian} lb.",
    heroNote: "Seller-listed weights, not measured by us.",
    shortTitle: "The number, in one line",
    shortBody:
      "A pedal kids' bike weighs about {kbMedian} lb ({kbMedianKg} kg) at the median - " +
      "roughly {ratio}x a balance bike's {bbMedian} lb. The extra mass is the drivetrain: " +
      "pedals, cranks, a chain or belt, a freewheel, and on most models a set of gears. A " +
      "two-year-old can muscle a {bbMedian} lb balance bike; that same child is not lifting a " +
      "{kbMedian} lb bike, which is exactly why pedal bikes start at the bigger sizes.",
    compareTitle: "Pedal bikes next to the other ride-ons",
    compareLead:
      "Median and range of seller-listed weights. n is the number of products in that " +
      "category that publish a usable weight.",
    colCategory: "Category",
    colCount: "n",
    colMedian: "Median",
    colRange: "Range",
    mechTitle: "What makes a pedal bike heavy",
    mechLead:
      "Strip a pedal bike down and the weight lands where a balance bike has nothing. The " +
      "drivetrain alone - pedals, crank arms, bottom bracket, chain or belt drive, freewheel " +
      "and, on geared models, a derailleur and cassette - accounts for most of the {lighter} " +
      "lb gap to a balance bike. Then the frame: a pedal bike's diamond frame and fork are " +
      "larger and heavier than a balance bike's minimalist loop. Wheels grow too, from 12-inch " +
      "first bikes through 20-inch models, and every inch of rim, tyre and spoke counts. What " +
      "you do not pay for in weight is suspension - on these kids' bikes it is absent by design.",
    wheelTitle: "Weight, wheel size and age",
    wheelLead:
      "The {kbMin}-{kbMax} lb spread lines up with wheel size. The lightest pedal bikes sit " +
      "near the 12-inch first-bike end; the heaviest near the 20-inch geared end, with 14- and " +
      "16-inch bikes in between. Wheel size, not age alone, is what drives the number - our " +
      "size chart maps both. And the lift test below applies at every size.",
    frameTitle: "Steel or aluminium: the frame's share",
    frameLead:
      "All {kbListed} pedal-bike listings name a frame material, but the snapshot does not " +
      "split pedal bikes by it. The only measured frame split we have is the balance-bike " +
      "subset: steel medians {steelMed} lb against aluminium {aluMed} lb, so aluminium is the " +
      "lighter build where both are listed. Pedal bikes follow the same direction - an " +
      "aluminium-frame bike of a given size will be lighter than a steel one - so if weight is " +
      "the priority, read the frame line on the listing.",
    unknownTitle: "The blanks we leave open",
    unknownLead: "Two fields look useful and are not. Rather than guess, we publish the gap:",
    unknownBrake:
      "Brake type - 0 of {kbListed} pedal-bike listings name one. Coaster (pedal) brakes and " +
      "hand brakes both exist on kids' bikes; this snapshot cannot confirm which a model uses. " +
      "Check the product page before you rely on it.",
    unknownTire:
      "Tyre type - 0 of {kbListed} listings specify it, so we publish no breakdown at all. " +
      "Pneumatic and foam tyres differ in grip, ride and upkeep; that belongs on the listing, " +
      "not in our guess.",
    excludedTitle: "What we set aside, and why",
    excludedLead:
      "Weights outside {minBand}-{maxBand} lb are listing errors, not products. The single " +
      "excluded value in this snapshot was a tricycle listed at 1 lb - not a pedal bike - so " +
      "no pedal-bike weight was dropped. It is excluded from the tricycle median, not ours.",
    methodTitle: "Counting the weights: our method",
    methodBody: [
      "Source: our CMS product specification snapshot ({file}), synced from retailer and " +
        "manufacturer listings, read on {date}.",
      "Field: Product_Specifications -> Measurements -> \"Item Weight\". Kilogram values are " +
        "converted to pounds; blanks are excluded, not guessed.",
      "We isolated the pedal-bike category (kids_bikes) and set it against the balance-bike, " +
        "tricycle and push-ride-on categories in the same snapshot. Scooters are excluded - the " +
        "set mixes kick and electric models up to 37 lb, so one median would mislead.",
      "Pedal-bike weights below {minBand} lb or above {maxBand} lb are treated as listing " +
        "errors. None qualified here, so nothing was removed from the pedal-bike figures.",
      "Re-run with `npm run data:weight`. Nothing on this page is typed in by hand.",
    ],
    checkTitle: "Three checks before you buy",
    checkLead: "A weight only matters next to your child. None of these need tools:",
    checkBody: [
      "Lift test: your child should pick the bike up off the ground and set it down again. At a " +
        "median of about 20 lb, a pedal bike is far heavier than a balance bike - if they cannot " +
        "lift it after a tip, it is too much bike for them.",
      "Carry test: they should manage it across a room and up a kerb. This is the one that " +
        "decides whether you end up carrying it home, not them.",
      "Stand-over test: standing over the frame in shoes, both feet flat on the ground, with a " +
        "little bend in the knee. Pair this with the seat-height numbers on our size chart.",
    ],
    sourceLabel: "Source",
  },
  zh: {
    eyebrow: "重量与结构",
    heroTitle: "一辆儿童脚踏车到底有多重？",
    heroLead:
      "我们把目录中每一款靠孩子自己驱动的骑乘玩具标称重量都取了出来——四大品类共 {scanned} 款，" +
      "其中 {withWeight} 款给出了可用重量——并单独看脚踏童车。一辆儿童脚踏车中位 {kbMedian} 磅" +
      "（{kbMedianKg} 公斤）；作为对照，平衡车是 {bbMedian} 磅。",
    heroNote: "重量为商家标称值，非我们实测。",
    shortTitle: "一句话说清",
    shortBody:
      "儿童脚踏车中位约 {kbMedian} 磅（{kbMedianKg} 公斤）——大约是平衡车 {bbMedian} 磅的 {ratio} 倍。" +
      "多出来的重量来自传动系统：脚踏、曲柄、链条或皮带、飞轮，以及多数车型上的一套齿轮。两岁孩子能" +
      "拎起一辆 {bbMedian} 磅的平衡车；同一个孩子拎不动一辆 {kbMedian} 磅的脚踏车，这正是脚踏车从更大" +
      "尺寸起步的原因。",
    compareTitle: "脚踏童车与其他骑乘玩具并排看",
    compareLead:
      "商家标称重量的中位数与区间。n 为该品类中给出可用重量的商品数量。",
    colCategory: "品类",
    colCount: "样本数",
    colMedian: "中位数",
    colRange: "区间",
    mechTitle: "是什么让脚踏车更重",
    mechLead:
      "把脚踏车拆开，重量都落在平衡车没有的地方。仅传动系统——脚踏、曲柄、五通、链条或皮带传动、" +
      "飞轮，以及带齿轮车型上的变速器与飞轮组——就占了与平衡车之间 {lighter} 磅差距的大部分。其次是车架：" +
      "脚踏车的菱形车架与前叉比平衡车极简的环形车架更大更重。轮子也变大，从 12 英寸入门车到 20 英寸车型，" +
      "轮圈、轮胎和每根辐条都在加重量。你不会在重量上付出的，是避震——这些儿童车在设计上就没有。",
    wheelTitle: "重量、轮径与年龄",
    wheelLead:
      "{kbMin}–{kbMax} 磅的跨度与轮径对应。最轻的脚踏车落在 12 英寸入门车一端；最重的靠近 20 英寸带齿轮" +
      "车型一端，14 与 16 英寸的在中间。决定这个数字的是轮径，而非年龄本身——我们的尺寸对照页把两者都标了出来。" +
      "下面这个提起测试在所有尺寸上都适用。",
    frameTitle: "高碳钢还是铝合金：车架占多少",
    frameLead:
      "{kbListed} 款脚踏童车全部标注了车架材质，但快照并未按车架对脚踏车做拆分。我们手头唯一实测的车架" +
      "拆分来自平衡车子集合：高碳钢中位 {steelMed} 磅，铝合金 {aluMed} 磅，因此在两者都标注的车型里铝合金更轻。" +
      "脚踏车遵循同一方向——同尺寸下铝合金车架款会比钢架款轻——所以如果重量是优先项，请读商品页上的车架一行。",
    unknownTitle: "我们留白的字段",
    unknownLead: "有两个字段看似有用实则不可用。与其猜测，我们把缺口写出来：",
    unknownBrake:
      "刹车类型——{kbListed} 款脚踏童车商品信息中，0 款标注了它。轴传动（脚刹）和手刹在儿童车上都存在；" +
      "这份快照无法确认某款用的是哪一种。请以商品页为准。",
    unknownTire:
      "轮胎类型——{kbListed} 款商品信息中，0 款标注，因此我们干脆不给出任何分布。充气轮与发泡轮在抓地、" +
      "骑感和维护上差别很大，这应由商品页说明，而不是由我们猜。",
    excludedTitle: "我们剔除的数值，及原因",
    excludedLead:
      "落在 {minBand}–{maxBand} 磅之外的重量属于商品信息错误，而非真实产品。本快照中唯一被剔除的数值是一款" +
      "标称 1 磅的三轮车——不是脚踏车——因此没有任何脚踏车重量被丢弃。它从三轮车的 median 中剔除，而不是我们的。",
    methodTitle: "数重量：我们的方法",
    methodBody: [
      "来源：本站 CMS 商品规格快照（{file}），同步自零售商与品牌方商品页，读取日期 {date}。",
      "字段：Product_Specifications → Measurements → \"Item Weight\"。以公斤标注的已换算为磅；字段为空的" +
        "直接排除，不做推算填补。",
      "我们把脚踏童车品类（kids_bikes）单独拎出来，与同一快照里的平衡车、三轮车、推行/滑行骑乘玩具做对比。" +
        "滑板车被刻意排除——该集合混杂了电动款（最重 37 磅），单一中位数会误导。",
      "低于 {minBand} 磅或高于 {maxBand} 磅的脚踏车重量视为商品信息错误。本页没有符合者，因此脚踏车数字" +
        "未做任何剔除。",
      "重新生成：`npm run data:weight`。本页所有数字都不是手写的。",
    ],
    checkTitle: "购买前的三个检查",
    checkLead: "重量只有对照自家孩子才有意义。以下三项都不需要工具：",
    checkBody: [
      "提起测试：孩子应能把车从地面提起来再放下。中位约 20 磅的脚踏车远比平衡车重——如果晃动后他提不动，" +
        "说明这车对他来说太重。",
      "搬运测试：他应能推着它穿过一个房间、上下路缘。这一项决定了最后是你扛回家还是他自己骑回家。",
      "跨立测试：穿鞋站在车架上，双脚平踩地面，膝盖略有弯曲。请配合我们尺寸对照页里的座高数据一起看。",
    ],
    sourceLabel: "来源",
  },
};

export function buildKidsBikeWeightDatasetSchema(pageUrl: string) {
  const h = d.headline;
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Pedal kids' bike weights — compared with balance bikes, tricycles and push ride-ons",
    description:
      `Seller-listed weights for ${kidsRow?.listed ?? 0} pedal kids' bikes ` +
      `(n=${kidsRow?.withWeight ?? 0}): median ${h.kidsBikeMedianLb} lb, range ` +
      `${kidsRow?.minLb ?? 0}-${kidsRow?.maxLb ?? 0} lb, about ${h.ratio}x a balance bike ` +
      `(${h.balanceBikeMedianLb} lb). Every figure is derived from the CMS product ` +
      `specification snapshot read on ${d.source.retrievedAt}.`,
    url: pageUrl,
    creator: {
      "@type": "Organization",
      name: "BalanceBikeToddler",
      url: "https://balancebiketoddler.com",
    },
    dateModified: d.source.retrievedAt,
    license: "https://creativecommons.org/licenses/by/4.0/",
    keywords: [
      "kids bike weight",
      "pedal bike weight",
      "ride-on weight comparison",
      "kids bike frame material",
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
