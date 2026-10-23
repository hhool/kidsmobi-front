// Kids Bike Stability & Training Wheels — derived entirely from the CMS product snapshot.
//
// Plan-B asset, kids-bikes category. The balance-bike stability page exists
// because "stable track" was the only query this domain ranked inside the top 20
// for. This is its pedal-bike counterpart, and the honest result is starker: of
// the {listed} pedal kids' bikes in the catalogue, ZERO state a wheel spacing, a
// tyre material, a wheel count, a steering limit or a maximum load. The page leads
// with that gap rather than papering over it, and then answers the question this
// category DOES publish — training wheels, and the age band the bike is built for.
//
// Every figure comes from src/data/kidsStabilityData.generated.ts, produced by
// `npm run data:kids-stability`. Nothing is typed in by hand, including the
// numbers in the SEO description below.

import { KIDS_STABILITY_DATASET } from "./kidsStabilityData.generated";

export { KIDS_STABILITY_DATASET };

export const KIDS_STABILITY_PATH = "/kids-bike-stability/";

const d = KIDS_STABILITY_DATASET;
const cov = d.coverage;

export const inToCm = (inch: number) => Math.round(inch * 2.54 * 10) / 10;

/** "12 in" plus the metric equivalent, which half our readers use. */
export function inchLabel(inch: number | null): string {
  return inch == null ? "—" : `${inch} in (${inToCm(inch)} cm)`;
}

export interface KidsStabilityStrings {
  eyebrow: string;
  heroTitle: string;
  heroLead: string;
  heroNote: string;
  gapTitle: string;
  gapLead: string;
  gapTrack: string;
  gapTire: string;
  gapWheelCount: string;
  gapAge: string;
  gapFrame: string;
  quoteTitle: string;
  quoteLead: string;
  quoteSourceLabel: string;
  quoteMissing: string;
  coverageTitle: string;
  coverageLead: string;
  coverStudio: string;
  coverValue: string;
  published: string;
  notStated: string;
  claimed: string;
  claimsTitle: string;
  claimsLead: string;
  claimStable: string;
  claimAntiTip: string;
  claimWide: string;
  claimSteering: string;
  claimCog: string;
  trainingTitle: string;
  trainingLead: string;
  trainingMentioned: string;
  trainingRemovable: string;
  trainingUnstated: string;
  trainingQuoteTitle: string;
  ageTitle: string;
  ageLead: string;
  rosterTitle: string;
  rosterLead: string;
  colBrand: string;
  colModel: string;
  colWheels: string;
  colTraining: string;
  colWheel: string;
  colFrame: string;
  colAge: string;
  colWeight: string;
  checkTitle: string;
  checkLead: string;
  checkBody: string[];
  methodTitle: string;
  methodBody: string[];
  caveatTitle: string;
  caveatLead: string;
  caveatBody: string[];
  sourceLabel: string;
}

export const kidsStabilityStrings: Record<"en" | "zh", KidsStabilityStrings> = {
  en: {
    eyebrow: "Pedal-bike stability",
    heroTitle: "What makes a kids' bike stable — and why not one listing tells you",
    heroLead:
      "Stability is the first question about a pedal kids' bike, so we went looking for the numbers behind it across {scanned} products and {listed} kids-bike listings. {withSpacing} publish a wheel spacing. {withTire} publish a tyre material. None state a steering limit or a maximum load. What they do publish is training wheels ({withTraining} of {listed}) and the age band the bike is built for — so that is what this page is built on.",
    heroNote: "Figures come from seller listing copy, not from measurements we took.",
    gapTitle: "Where the catalogue is silent",
    gapLead:
      "Out of the {listed} pedal kids' bikes in this catalogue, this is how many publish each figure a stability question actually turns on:",
    gapTrack: "Wheel spacing or track width — the measurement itself",
    gapTire: "Tyre material, which decides grip and damping",
    gapWheelCount: "Wheel count",
    gapAge: "Age range the bike is built for",
    gapFrame: "Frame material",
    quoteTitle: "Nobody publishes the number",
    quoteLead:
      "The balance-bike page in this cluster quotes the one listing that states a track width. On the pedal-bike side there is no such listing to quote:",
    quoteSourceLabel: "Listing copy, quoted verbatim",
    quoteMissing:
      "No kids-bike listing in this snapshot publishes a wheel spacing, tyre width, steering limit or maximum load. We are not going to estimate one from the photos.",
    coverageTitle: "How often each figure appears",
    coverageLead:
      "Counted from the {listed} pedal kids' bikes in the CMS snapshot read on {date}. Anything unstated stays unstated rather than being filled in.",
    coverStudio: "Figure",
    coverValue: "Listings that publish it",
    published: "published",
    notStated: "not stated",
    claimed: "claimed in copy",
    claimsTitle: "Words sellers use versus figures they list",
    claimsLead:
      "A word like “stable” costs a seller nothing. These counts keep the two apart, because on a pedal bike the difference decides whether a two-year-old can put a foot down:",
    claimStable: "Uses the word “stable” or “stability” anywhere in its copy",
    claimAntiTip: "Claims anti-tip design",
    claimWide: "Claims a wide frame or wide stance",
    claimSteering: "Claims a steering limiter",
    claimCog: "Claims a low centre of gravity",
    trainingTitle: "Training wheels are the real answer",
    trainingLead:
      "A balance bike has no third wheel to remove, so its stability question is about geometry. A pedal bike's is about the training wheels: {withTraining} of {listed} listings mention them, and only {withRemovable} say they come off. That single sentence is the most consequential line on a kids-bike listing, and almost none of them write it.",
    trainingMentioned: "mention training wheels (or stabiliser / support wheels)",
    trainingRemovable: "say the training wheels can be removed or adjusted",
    trainingUnstated: "say nothing either way about training wheels",
    trainingQuoteTitle: "What a training-wheel mention actually looks like",
    ageTitle: "Stability is a function of size",
    ageLead:
      "The ages these bikes are built for run from {minAge} to {maxAge} years, and that band is the real stability boundary: a 12-inch bike with training wheels and a 20-inch bike without them are not answering the same question. Wheel sizes in this catalogue run {wheelSpread}, and our size chart maps wheel size to fit in detail.",
    rosterTitle: "The whole kids-bike roster",
    rosterLead:
      "Sorted by how much usable stability information each listing publishes. Click a row to open the product page.",
    colBrand: "Brand",
    colModel: "Model",
    colWheels: "Wheels",
    colTraining: "Training wheels",
    colWheel: "Wheel size",
    colFrame: "Frame",
    colAge: "Age range",
    colWeight: "Weight",
    checkTitle: "Four floor checks, no tools needed",
    checkLead:
      "Since the listing will not give you a track width, these four checks measure the same thing yourself:",
    checkBody: [
      "Foot-flat check: with the child seated, both feet must reach the ground flat with a bend in the knee. On a pedal bike this is harder than it sounds, because the frame and the cranks are in the way — a child who cannot plant a foot cannot catch a fall.",
      "Training-wheel check: confirm whether the stabilisers are removable and how they are adjusted. A fixed set on a 20-inch bike is a different purchase from a set that comes off once the child is ready, and the listing usually does not say which one you are getting.",
      "Low-speed balance: walk the bike alongside the child at walking pace and let go briefly. If they cannot hold a line for a few seconds with the training wheels off, they are not ready to have them off.",
      "Surface match: narrow hard tyres track straighter on pavement; wide soft tyres are more forgiving on grass and gravel. Ask what surface they will actually ride on before deciding which matters more.",
    ],
    methodTitle: "Counting these figures: our method",
    methodBody: [
      "Source: our CMS product specification snapshot ({file}), synced from retailer and manufacturer listings, read on {date}.",
      "Scope: the {listed} products in the kids_bikes category. The catalog-wide wheel-spacing count covers all {scanned} products we track.",
      "Fields read directly: Wheel Size, Item Weight, Tire, Frame Material, Age Range — taken from Product_Specifications, with blank values excluded rather than imputed.",
      "Fields mined from listing copy: wheel spacing, tyre width, steering limit, maximum load, wheel count, training wheels and whether they are removable, each by a regular expression recorded in the generated dataset.",
      "Precision is preserved as published: 1.45 in stays 1.45 in. Nothing is rounded into looking tidier.",
      "Re-run with `npm run data:kids-stability`. Nothing on this page is typed in by hand.",
    ],
    caveatTitle: "Four things this data cannot settle",
    caveatLead: "Four limits worth knowing before you use any of it:",
    caveatBody: [
      "Training wheels are read out of marketing copy. A listing that mentions them may include them, offer them as an accessory, or fit them only to certain sizes — the words alone do not settle it. Treat the count as a lead, not a specification.",
      "We record “removable” only when the copy says so. The listings that mention training wheels without addressing it are reported as unstated, not as fixed.",
      "Sample size is {listed} pedal kids' bikes — enough to describe how little this category publishes, not enough to rank individual models by stability.",
      "Nothing here is measured by us. Where a decision matters, check the manufacturer's own specification sheet before buying.",
    ],
    sourceLabel: "Source",
  },
  zh: {
    eyebrow: "脚踏童车稳定性",
    heroTitle: "什么让儿童自行车稳 —— 以及为什么一款商品都没告诉你",
    heroLead:
      "稳定性是选脚踏童车时的第一个问题，所以我们在 {scanned} 款商品、{listed} 款童车里去找支撑它的数字：{withSpacing} 款公布轮间距，{withTire} 款公布轮胎材质，没有一款标注转向限位或最大承重。真正被公布的是辅助轮（{withTraining} / {listed}）以及这辆车对应的年龄区间——本页就建立在这些之上。",
    heroNote: "数据来自商家商品文案，不是我们实测。",
    gapTitle: "目录里沉默的部分",
    gapLead: "在本目录 {listed} 款脚踏童车中，愿意公布下面每一项关键数据的情况如下：",
    gapTrack: "轮间距 / 轮距宽度 —— 也就是那个测量值本身",
    gapTire: "轮胎材质，决定抓地与减震",
    gapWheelCount: "轮子数量",
    gapAge: "这辆车对应的年龄区间",
    gapFrame: "车架材质",
    quoteTitle: "没有人公布那个数字",
    quoteLead:
      "本组中的平衡车页面会引用唯一一款标了轮距的商品。脚踏童车这一侧没有可引用的对象：",
    quoteSourceLabel: "商品文案，原文引用",
    quoteMissing:
      "本快照中没有任何一款脚踏童车公布轮间距、轮宽、转向限位或最大承重。我们不会从图片里去估算一个数字出来。",
    coverageTitle: "我们收录的全部儿童自行车的数据覆盖率",
    coverageLead:
      "统计自 {date} 读取的 CMS 快照中的 {listed} 款脚踏童车。未标注的，就保持未标注，而不是补上。",
    coverStudio: "数据项",
    coverValue: "公布该数据的商品数",
    published: "已公布",
    notStated: "未标注",
    claimed: "文案中声称",
    claimsTitle: "声称与实测的区别",
    claimsLead:
      "「稳」这种字眼对卖家没有任何成本。下面把两者分开计数，因为在一辆脚踏车上，这个差别决定两岁孩子能不能把脚落地：",
    claimStable: "文案中出现了「stable / stability」字样",
    claimAntiTip: "声称防侧翻设计",
    claimWide: "声称加宽车架或加宽轮距",
    claimSteering: "声称带转向限位",
    claimCog: "声称低重心",
    trainingTitle: "辅助轮才是真正的答案",
    trainingLead:
      "平衡车没有第三条轮子可以拆，所以它的稳定性问题在几何；脚踏车的问题在辅助轮：{listed} 款中有 {withTraining} 款提到辅助轮，只有 {withRemovable} 款说明可以拆。这句话是童车商品页上最有分量的一句，而几乎没有人写。",
    trainingMentioned: "提到辅助轮（或稳定轮 / 支撑轮）",
    trainingRemovable: "说明辅助轮可以拆卸或调节",
    trainingUnstated: "对辅助轮只字未提",
    trainingQuoteTitle: "「提到辅助轮」在文案里长什么样",
    ageTitle: "稳定性是尺寸的函数",
    ageLead:
      "这些车对应的年龄从 {minAge} 岁到 {maxAge} 岁，这一段区间才是真正的稳定性边界：一辆带辅助轮的 12 英寸车和一辆不带辅助轮的 20 英寸车，回答的不是同一个问题。本目录的轮径覆盖 {wheelSpread}，我们的尺寸对照页把轮径与适配关系讲得更细。",
    rosterTitle: "我们收录的全部儿童自行车",
    rosterLead: "按每条商品信息公布的有效稳定性数据量排序。点击任意一行可打开商品页。",
    colBrand: "品牌",
    colModel: "型号",
    colWheels: "轮数",
    colTraining: "辅助轮",
    colWheel: "轮径",
    colFrame: "车架",
    colAge: "年龄区间",
    colWeight: "重量",
    checkTitle: "在地面就能做的四项检查，不需要工具",
    checkLead: "既然商品页不会给你轮距，这四项可以自己测出同一件事：",
    checkBody: [
      "全脚掌着地检查：让孩子坐上去，双脚必须平踩地面、膝盖略有弯曲。在脚踏车上这件事比看上去难，因为车架和曲柄挡在前面——一个踩不到地的孩子，摔倒时无法自救。",
      "辅助轮检查：确认辅助轮是否可拆、如何调节。一辆 20 英寸车配固定辅助轮，和一辆孩子准备好后可以拆掉辅助轮的车，是两笔完全不同的采购，而商品页通常不写你拿到的是哪一种。",
      "低速平衡测试：推着车跟孩子并排走，在步行速度下让他短暂松手。如果拆掉辅助轮后连几秒都走不直，就还没到可以拆的时候。",
      "路面匹配：窄而硬的轮胎在铺装路面上走得更直；宽而软的轮胎在草地和碎石路上更宽容。先确认孩子实际在哪骑，再决定哪个更重要。",
    ],
    methodTitle: "这些数字是怎么来的",
    methodBody: [
      "来源：本站 CMS 商品规格快照（{file}），同步自零售商与品牌方商品页，读取日期 {date}。",
      "范围：kids_bikes 品类下的 {listed} 款商品。全站轮间距计数覆盖我们收录的全部 {scanned} 款商品。",
      "直接读取的字段：Wheel Size、Item Weight、Tire、Frame Material、Age Range —— 取自 Product_Specifications，字段为空的直接排除，不做推算填补。",
      "从商品文案中提取的字段：轮间距、轮宽、转向限位、最大承重、轮子数量、辅助轮及其是否可拆，各自有记录在生成数据文件中的正则表达式。",
      "精度按原文保留：1.45 英寸就是 1.45 英寸，不会为了好看而四舍五入。",
      "重新生成：`npm run data:kids-stability`。本页所有数字都不是手写的。",
    ],
    caveatTitle: "这份数据无法告诉你的",
    caveatLead: "使用它之前，有四条限制值得知道：",
    caveatBody: [
      "辅助轮信息提取自营销文案。提到辅助轮的 listing，可能是标配、可能是选配，也可能只在某些尺寸上装——单看这些词无法确定。请把它当作线索，而不是规格。",
      "只有在文案明确说明时，我们才记为「可拆」。提到辅助轮却未提及的，我们记为未标注，而不是「固定式」。",
      "样本量是 {listed} 款脚踏童车 —— 足以说明这个品类公布数据有多差，但不足以给单款车做稳定性排名。",
      "本页面没有任何数据是实测的。涉及重要决定时，请以品牌官方规格书为准。",
    ],
    sourceLabel: "来源",
  },
};

export const kidsStabilitySeo = {
  en: {
    // Stem = "Kids Bike Stability: What Listings Publish" (42 chars, <=44 budget).
    title: "Kids Bike Stability: What Listings Publish",
    description:
      `Across ${cov.listed} pedal kids' bikes, ${cov.withTrackSpacing} publish a wheel spacing and ` +
      `${cov.withTireClass} a tyre material. ${cov.mentionsTrainingWheels} mention training wheels. ` +
      `Full table, method and honest limits.`,
    canonical: KIDS_STABILITY_PATH,
    keywords: [
      "kids bike stability",
      "kids bike training wheels",
      "balance training wheels for kids bike",
      "kids bike wheel size and age",
      "are training wheels necessary on a kids bike",
      "kids bike without training wheels",
      "removable training wheels kids bike",
    ],
  },
  zh: {
    title: "儿童自行车稳定性：辅助轮与商家愿意公布的数据",
    description:
      `${cov.listed} 款脚踏童车中，${cov.withTrackSpacing} 款公布轮间距，${cov.withTireClass} 款公布轮胎材质，` +
      `${cov.mentionsTrainingWheels} 款提到辅助轮。含完整表格、取数方法与如实说明的局限。`,
    canonical: KIDS_STABILITY_PATH,
    keywords: [
      "儿童自行车稳定性",
      "儿童自行车辅助轮",
      "自行车辅助轮有必要吗",
      "儿童自行车轮径与年龄",
      "两岁儿童自行车",
      "可拆卸辅助轮",
    ],
  },
};

/** Coverage rows, rendered straight from the counts so the page cannot drift. */
export function kidsStabilityCoverageRows(t: KidsStabilityStrings) {
  const rows = [
    { label: t.gapTrack, n: cov.withTrackSpacing },
    { label: t.gapTire, n: cov.withTireClass },
    { label: t.gapWheelCount, n: cov.withWheelCount },
    { label: t.gapAge, n: cov.withAgeRange },
    { label: t.gapFrame, n: cov.withFrameMaterial },
  ];
  return rows.map((r) => ({ ...r, of: cov.listed }));
}

/** Claim counts: the words cost nothing, so they get their own section. */
export function kidsStabilityClaimRows(t: KidsStabilityStrings) {
  const countSignal = (key: string) => d.kidsBikes.filter((b) => b.stabilitySignals.includes(key)).length;
  return [
    { label: t.claimStable, n: cov.withStabilityClaim },
    { label: t.claimAntiTip, n: countSignal("anti_tip") },
    { label: t.claimWide, n: countSignal("wide_stance") },
    { label: t.claimSteering, n: countSignal("limited_steering") },
    { label: t.claimCog, n: countSignal("low_center_of_gravity") },
  ].map((r) => ({ ...r, of: cov.listed }));
}

/** Training-wheel counts, kept apart because "mentions" and "removable" differ. */
export function kidsStabilityTrainingRows(t: KidsStabilityStrings) {
  return [
    { label: t.trainingMentioned, n: cov.mentionsTrainingWheels },
    { label: t.trainingRemovable, n: cov.trainingWheelsRemovable },
    { label: t.trainingUnstated, n: Math.max(0, cov.listed - cov.mentionsTrainingWheels) },
  ].map((r) => ({ ...r, of: cov.listed }));
}

/** One listing's training-wheel sentence, quoted so the extraction is checkable. */
export function kidsStabilityTrainingQuote() {
  return d.kidsBikes.find((b) => b.trainingWheelEvidence) ?? null;
}

/** Wheel sizes actually present, as a readable spread for the age section. */
export function kidsStabilityWheelSpread(): string {
  const sizes = Object.keys(d.wheelSizeGroups)
    .filter((k) => k !== "not listed")
    .map((k) => parseInt(k, 10))
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);
  if (!sizes.length) return "—";
  return sizes.length === 1 ? `${sizes[0]}-inch` : `${sizes[0]}- to ${sizes[sizes.length - 1]}-inch`;
}

export function buildKidsBikeStabilityDatasetSchema(pageUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Kids bike stability data — training wheels, wheel size and specification coverage",
    description:
      `Coverage audit of ${cov.listed} pedal kids' bikes in the BalanceBikeToddler catalogue: how many publish the ` +
      `figures a stability question turns on. ${cov.withTrackSpacing} list a wheel spacing, ` +
      `${cov.withTireClass} list a tyre material, ${cov.withWheelSize} list a wheel diameter, ` +
      `${cov.mentionsTrainingWheels} mention training wheels and ${cov.trainingWheelsRemovable} say they are removable. ` +
      `Derived from the CMS product snapshot read on ${d.source.retrievedAt}.`,
    url: pageUrl,
    creator: {
      "@type": "Organization",
      name: "BalanceBikeToddler",
      url: "https://balancebiketoddler.com",
    },
    dateModified: d.source.retrievedAt,
    license: "https://creativecommons.org/licenses/by/4.0/",
    keywords: [
      "kids bike stability",
      "kids bike training wheels",
      "wheel size and age",
      "pedal bike specification coverage",
    ],
    variableMeasured: [
      {
        "@type": "PropertyValue",
        name: "Kids bikes listing a wheel spacing",
        value: cov.withTrackSpacing,
        maxValue: cov.listed,
      },
      {
        "@type": "PropertyValue",
        name: "Kids bikes listing a tyre material",
        value: cov.withTireClass,
        maxValue: cov.listed,
      },
      {
        "@type": "PropertyValue",
        name: "Kids bikes listing a wheel diameter",
        value: cov.withWheelSize,
        maxValue: cov.listed,
      },
      {
        "@type": "PropertyValue",
        name: "Kids bikes mentioning training wheels",
        value: cov.mentionsTrainingWheels,
        maxValue: cov.listed,
      },
      {
        "@type": "PropertyValue",
        name: "Kids bikes whose training wheels are stated to be removable",
        value: cov.trainingWheelsRemovable,
        maxValue: cov.listed,
      },
    ],
    sourceOrganization: {
      "@type": "Organization",
      name: d.source.name,
    },
  };
}