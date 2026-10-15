// Balance Bike Stability & Track Width — derived entirely from the CMS product snapshot.
//
// Plan-B Asset 6. Why this page exists: the only three queries this domain ranks
// inside the top 20 for are all asking about a "stable track" balance bike (see
// doc/gsc-2026-10-13-analysis_zh.md). The dataset behind it tries to answer that
// with measurements, and the honest result is that almost no listing publishes
// any: one of fifteen states a wheel spacing at all. The page leads with that
// gap rather than papering over it.
//
// Every figure comes from src/data/stabilityData.generated.ts, produced by
// `npm run data:stability`. Nothing is typed in by hand, including the numbers
// in the SEO description below. What the source does not say, this page reports
// as not stated.

import { STABILITY_DATASET } from "./stabilityData.generated";

export { STABILITY_DATASET };

export const STABILITY_PATH = "/balance-bike-stability/";

const d = STABILITY_DATASET;
const cov = d.coverage;

export const inToCm = (inch: number) => Math.round(inch * 2.54 * 10) / 10;

/** "5.1 in" plus the metric equivalent, which half our readers use. */
export function inchLabel(inch: number | null): string {
  return inch == null ? "—" : `${inch} in (${inToCm(inch)} cm)`;
}

export interface StabilityStrings {
  eyebrow: string;
  heroTitle: string;
  heroLead: string;
  heroNote: string;
  gapTitle: string;
  gapLead: string;
  gapTrack: string;
  gapTire: string;
  gapWheelSize: string;
  gapWheelCount: string;
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
  rosterTitle: string;
  rosterLead: string;
  colBrand: string;
  colModel: string;
  colWheels: string;
  colSpacing: string;
  colWheel: string;
  colTire: string;
  colFrame: string;
  colLoad: string;
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

export const stabilityStrings: Record<"en" | "zh", StabilityStrings> = {
  en: {
    eyebrow: "Stability & track width",
    heroTitle: "What makes a stable track balance bike — and why nobody publishes the number",
    heroLead:
      "Parents search for a stable track balance bike. We went looking for the measurement behind that phrase across {scanned} products and {listed} balance bikes. {withSpacing} publishes an actual wheel spacing. That is the finding, and it is why this question is so badly served.",
    heroNote: "Figures come from seller listing copy, not from measurements we took.",
    gapTitle: "The gap, stated plainly",
    gapLead:
      "Of the {listed} balance bikes in this catalogue, this is how many publish each figure a stability question actually depends on:",
    gapTrack: "Front wheel spacing (the track width itself)",
    gapTire: "Tire material — foam or rubber, which changes grip and damping",
    gapWheelSize: "Wheel diameter",
    gapWheelCount: "Wheel count — the single largest stability decision in a first bike",
    quoteTitle: "The one listing that does publish it",
    quoteLead:
      "Read it as it appears in the seller's own words, so you can check the extraction rather than trust our parsing:",
    quoteSourceLabel: "Listing copy, quoted verbatim",
    quoteMissing: "No listing in this snapshot publishes a wheel spacing figure.",
    coverageTitle: "Coverage across every balance bike we track",
    coverageLead:
      "Counted from the {listed} balance bikes in the CMS snapshot read on {date}. " +
      "Everything below comes out of listing copy or the CMS specification fields, and anything unstated stays unstated.",
    coverStudio: "Figure",
    coverValue: "Listings that publish it",
    published: "published",
    notStated: "not stated",
    claimed: "claimed in copy",
    claimsTitle: "Claims versus measurements",
    claimsLead:
      "A word like “stable” costs a seller nothing. These counts separate the two, because they mean very different things when you are choosing a bike for a one-year-old:",
    claimStable: "Uses the word “stable” or “stability” anywhere in its copy",
    claimAntiTip: "Claims anti-tip design",
    claimWide: "Claims a wide frame or wide stance",
    claimSteering: "Claims a steering limiter",
    claimCog: "Claims a low centre of gravity",
    rosterTitle: "Every balance bike we track",
    rosterLead:
      "Sorted by how much usable stability information each listing publishes. Click a row to open the product page.",
    colBrand: "Brand",
    colModel: "Model",
    colWheels: "Wheels",
    colSpacing: "Track spacing",
    colWheel: "Wheel size",
    colTire: "Tire",
    colFrame: "Frame",
    colLoad: "Max load",
    checkTitle: "What to check at home, with no tools",
    checkLead:
      "Since the listing will not tell you the track width, these four checks measure the same thing on the floor:",
    checkBody: [
      "Tip test: with your child seated and both feet down, push the bike gently sideways from the saddle. A wider track resists further before the wheel lifts. Compare two bikes side by side and the difference is obvious even if nobody publishes a number.",
      "Foot-flat check: their feet must sit flat on the ground with a bend in the knee. A child balancing on tiptoes cannot catch themselves — this matters more than the track width itself.",
      "Steering sweep: turn the bars from lock to lock. Very free steering lets the front wheel fold sideways at low speed, which is the most common tip-over for a beginner.",
      "Surface match: wide, soft EVA wheels are forgiving on grass and gravel; narrow hard wheels track straighter on pavement. Ask what surface they will actually ride on before optimising for either.",
    ],
    methodTitle: "How these numbers were produced",
    methodBody: [
      "Source: our CMS product specification snapshot ({file}), synced from retailer and manufacturer listings, read on {date}.",
      "Scope: the {listed} products in the balance_bike category. The catalog-wide wheel-spacing count covers all {scanned} products we track.",
      "Fields read directly: Wheel Size, Item Weight, Tire, Frame Material — taken from Product_Specifications, with blank values excluded rather than imputed.",
      "Fields mined from listing copy: wheel spacing, wheel width, steering limit, maximum load and wheel count, each by a documented regular expression recorded in the generated dataset.",
      "Precision is preserved as published: 1.45 in stays 1.45 in. Nothing is rounded into looking tidier.",
      "Re-run with `npm run data:stability`. Nothing on this page is typed in by hand.",
    ],
    caveatTitle: "What this data cannot tell you",
    caveatLead: "Four limits worth knowing before you use any of it:",
    caveatBody: [
      "Wheels counts and stability claims are read out of marketing copy, so they reflect what the seller says, not what we verified. A listing may describe itself as stable and still have a narrow stance.",
      "“Ultra Lightweight” appears in the frame-material field for some listings. That is a slogan, not a material, so we record those as not stated rather than pretending they identify an alloy.",
      "Sample size is {listed} balance bikes — enough to describe how poorly the category publishes these figures, not enough to rank individual models by stability.",
      "Nothing here is measured by us. Where a decision matters, check the manufacturer's own specification sheet before buying.",
    ],
    sourceLabel: "Source",
  },
  zh: {
    eyebrow: "稳定性与轮间距",
    heroTitle: "什么让平衡车稳 —— 以及为什么几乎没人公布这个数字",
    heroLead:
      "家长们在搜「稳轮距的平衡车」。我们在 {scanned} 款商品、{listed} 款平衡车里去找这个说法背后的那个数字：{withSpacing} 款列出了真实的轮间距。这就是结论本身，也正是这个问题长期没人好好回答的原因。",
    heroNote: "数据来自商家商品页文案，不是我们实测。",
    gapTitle: "缺口，直接说清楚",
    gapLead: "在本目录 {listed} 款平衡车中，愿意公布下面每一项关键数据的情况如下：",
    gapTrack: "前轮间距（也就是轮距宽度本身）",
    gapTire: "轮胎材质 —— 发泡还是橡胶，直接影响抓地与减震",
    gapWheelSize: "轮径",
    gapWheelCount: "轮子数量 —— 一台入门平衡车最大的稳定性决策",
    quoteTitle: "唯一公布了它的一款",
    quoteLead: "下面按卖家原文照录，方便你核对我们的提取是否准确，而不是单方面相信我们的解析：",
    quoteSourceLabel: "商品文案，原文引用",
    quoteMissing: "本快照中没有任何商品公布轮间距数值。",
    coverageTitle: "我们收录的全部平衡车的数据覆盖率",
    coverageLead:
      "统计自 {date} 读取的 CMS 快照中的 {listed} 款平衡车。以下全部来自商品文案或 CMS 规格字段；未标注的，就保持未标注。",
    coverStudio: "数据项",
    coverValue: "公布该数据的商品数",
    published: "已公布",
    notStated: "未标注",
    claimed: "文案中声称",
    claimsTitle: "声称与实测的区别",
    claimsLead:
      "「稳」这种字眼对卖家没有任何成本。下面把两者分开计数，因为当你给一岁孩子挑车时，它们的分量完全不同：",
    claimStable: "文案中出现了「stable / stability」字样",
    claimAntiTip: "声称防侧翻设计",
    claimWide: "声称加宽车架或加宽轮距",
    claimSteering: "声称带转向限位",
    claimCog: "声称低重心",
    rosterTitle: "我们收录的全部平衡车",
    rosterLead: "按每条商品信息公布的有效稳定性数据量排序。点击任意一行可打开商品页。",
    colBrand: "品牌",
    colModel: "型号",
    colWheels: "轮数",
    colSpacing: "轮间距",
    colWheel: "轮径",
    colTire: "轮胎",
    colFrame: "车架",
    colLoad: "最大承重",
    checkTitle: "在家可以做的四个检查，不需要工具",
    checkLead: "既然商品页不会告诉你轮距，这四项可以在地面上测出同一件事：",
    checkBody: [
      "侧倾测试：让孩子坐上去双脚着地，从座垫侧向轻推。轮距越宽，车轮离地前能撑住的幅度越大。两台车并排一比，即使没人公布数字，差别也很明显。",
      "全脚掌着地检查：孩子的脚必须平踩地面、膝盖略有弯曲。踮着脚的孩子无法自救——这一点比轮距宽度本身更重要。",
      "转向扫掠：把车把从一个锁点打到另一个锁点。转向过松会让前轮在低速时横向折死，这是新手侧翻最常见的原因。",
      "路面匹配：宽而软的 EVA 轮在草地和碎石路上宽容度高；窄而硬的轮在铺装路面上走得更直。先确认孩子实际在哪骑，再谈优化。",
    ],
    methodTitle: "这些数字是怎么来的",
    methodBody: [
      "来源：本站 CMS 商品规格快照（{file}），同步自零售商与品牌方商品页，读取日期 {date}。",
      "范围：balance_bike 品类下的 {listed} 款商品。全站轮间距计数覆盖我们收录的全部 {scanned} 款商品。",
      "直接读取的字段：Wheel Size、Item Weight、Tire、Frame Material —— 取自 Product_Specifications，字段为空的直接排除，不做推算填补。",
      "从商品文案中提取的字段：轮间距、轮宽、转向限位、最大承重、轮子数量，各自有记录在生成数据文件中的正则表达式。",
      "精度按原文保留：1.45 英寸就是 1.45 英寸，不会为了好看而四舍五入。",
      "重新生成：`npm run data:stability`。本页所有数字都不是手写的。",
    ],
    caveatTitle: "这份数据无法告诉你的",
    caveatLead: "使用它之前，有四条限制值得知道：",
    caveatBody: [
      "轮子数量与稳定性宣称都提取自营销文案，反映的是卖家的说法，不是我们验过的结论。一条信息自述「稳」，它的轮距仍可能很窄。",
      "部分商品的「车架材质」字段填的是 Ultra Lightweight。那是广告语而不是材质，我们因此记为未标注，而不是假装它指向某种合金。",
      "样本量是 {listed} 款平衡车 —— 足以说明这个品类公布数据有多差，但不足以给单款车做稳定性排名。",
      "本页面没有任何数据是实测的。涉及重要决定时，请以品牌官方规格书为准。",
    ],
    sourceLabel: "来源",
  },
};

export const stabilitySeo = {
  en: {
    title: "Stable Track Balance Bike: Track Width",
    description:
      `We checked every balance bike we track for the measurement behind "stable track": ` +
      `${cov.withTrackSpacing} of ${cov.listed} publishes a wheel spacing, ${cov.withTireClass} publishes a tire material, ` +
      `${cov.withWheelSize} publishes a wheel size. Full table, method and honest limits.`,
    canonical: STABILITY_PATH,
    keywords: [
      "stable track balance bike",
      "balance bike stability",
      "balance bike track width",
      "balance bike wheel spacing",
      "anti-tip balance bike for toddlers",
      "4 wheel balance bike for beginners",
      "widest balance bike for 1 year old",
      "toddler balance bike steering limiter",
    ],
  },
  zh: {
    title: "平衡车稳定性：轮距宽度、轮数与卖家愿意公布的数据",
    description:
      `我们逐一核对了收录的每一款平衡车里「稳定轮距」背后的那个数字：` +
      `${cov.listed} 款中 ${cov.withTrackSpacing} 款公布轮间距，${cov.withTireClass} 款公布轮胎材质，` +
      `${cov.withWheelSize} 款公布轮径。含完整表格、取数方法与如实说明的局限。`,
    canonical: STABILITY_PATH,
    keywords: [
      "平衡车稳定性",
      "平衡车轮距",
      "平衡车轮间距",
      "防侧翻平衡车",
      "四轮平衡车",
      "加宽车架平衡车",
      "转向限位平衡车",
      "一岁宝宝平衡车",
    ],
  },
};

/** Coverage rows, rendered straight from the counts so the page cannot drift. */
export function coverageRows(t: StabilityStrings) {
  const rows = [
    { label: t.gapTrack, n: cov.withTrackSpacing },
    { label: t.gapTire, n: cov.withTireClass },
    { label: t.gapWheelSize, n: cov.withWheelSize },
    { label: t.gapWheelCount, n: cov.withWheelCount },
  ];
  return rows.map((r) => ({ ...r, of: cov.listed }));
}

/** Claim counts: the words cost nothing, so they get their own section. */
export function claimRows(t: StabilityStrings) {
  const countSignal = (key: string) => d.balanceBikes.filter((b) => b.stabilitySignals.includes(key)).length;
  return [
    { label: t.claimStable, n: cov.withStabilityClaim },
    { label: t.claimAntiTip, n: countSignal("anti_tip") },
    { label: t.claimWide, n: countSignal("wide_stance") },
    { label: t.claimSteering, n: countSignal("limited_steering") },
    { label: t.claimCog, n: countSignal("low_center_of_gravity") },
  ].map((r) => ({ ...r, of: cov.listed }));
}

export function buildStabilityDatasetSchema(pageUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Balance bike stability specifications — track width, wheel count and tire data",
    description:
      `Coverage audit of ${cov.listed} balance bikes in the BalanceBikeToddler catalogue: how many publish the ` +
      `figures a stability question depends on. ${cov.withTrackSpacing} list a front wheel spacing, ` +
      `${cov.withTireClass} list a tire material, ${cov.withWheelSize} list a wheel diameter, ` +
      `${cov.withWheelCount} state a wheel count. Derived from the CMS product snapshot read on ${d.source.retrievedAt}.`,
    url: pageUrl,
    creator: {
      "@type": "Organization",
      name: "BalanceBikeToddler",
      url: "https://balancebiketoddler.com",
    },
    dateModified: d.source.retrievedAt,
    license: "https://creativecommons.org/licenses/by/4.0/",
    keywords: [
      "balance bike stability",
      "balance bike track width",
      "wheel spacing",
      "anti-tip",
      "toddler balance bike specification coverage",
    ],
    variableMeasured: [
      {
        "@type": "PropertyValue",
        name: "Balance bikes listing a front wheel spacing",
        value: cov.withTrackSpacing,
        maxValue: cov.listed,
      },
      {
        "@type": "PropertyValue",
        name: "Balance bikes listing a tire material",
        value: cov.withTireClass,
        maxValue: cov.listed,
      },
      {
        "@type": "PropertyValue",
        name: "Balance bikes listing a wheel diameter",
        value: cov.withWheelSize,
        maxValue: cov.listed,
      },
      {
        "@type": "PropertyValue",
        name: "Balance bikes listing any numeric stability geometry",
        value: cov.withNumericGeometry,
        maxValue: cov.listed,
      },
    ],
    sourceOrganization: {
      "@type": "Organization",
      name: d.source.name,
    },
  };
}
