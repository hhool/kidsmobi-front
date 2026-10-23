import { RECALL_DATASET } from "./recallData.generated";
import { SAFETY_GATE_DATASET } from "./safetyGateData.generated";

/**
 * Types + narrative copy for the public safety recall record page.
 *
 * The raw figures come from src/data/recallData.generated.ts, which is produced
 * by `npm run data:recalls`. Nothing here may hard-code a count, a date or a
 * statistic: the page is only trustworthy while every number is derived from
 * the same dataset that ships with it.
 */

export type RecallNotice = {
  recallNumber: string;
  date: string;
  title: string;
  url: string;
  party: string;
  units: string;
  hazard: string;
  remedy: string;
};

export type TrendRow = {
  year: number;
  kidBikeNotices: number;
  kidHelmetNotices: number;
  totalNotices: number;
  sharePct: number;
};

export type PeriodRow = {
  period: string;
  kidBikeNotices: number;
  kidHelmetNotices: number;
  totalNotices: number;
  sharePct: number;
};

/**
 * The public recall record.
 *
 * It used to live at /safety/balance-bike-recalls/ — a one-page level of its
 * own, whose parent (/safety/) never existed and 404'd, leaving the site's
 * thickest page hanging off a dead path while /guides/risk already carried the
 * same topic. On 2026-10-22 the /safety/ level was retired and the record moved
 * under the risk topic where the other safety pages live.
 *
 * No trailing slash: prerender writes slashless routes as `<route>.html`, which
 * Cloudflare Pages serves at exactly this URL. It used to be a directory index,
 * which is why the old path ended in "/".
 */
export const RECALL_SAFETY_PATH = "/guides/risk/balance-bike-recall-record";

/** Retired 2026-10-22. Kept so the 301 has one source and cannot drift. */
export const LEGACY_RECALL_SAFETY_PATH = "/safety/balance-bike-recalls/";

export const recallDataset = RECALL_DATASET as {
  source: {
    name: string;
    api: string;
    publisherUrl: string;
    retrievedAt: string;
    coverageStartYear: number;
    coverageEndYear: number;
  };
  totals: {
    cpscNoticesRetrieved: number;
    kidsBikeNotices: number;
    kidHelmetNotices: number;
    balanceBikeNotices: number;
    rideOnNotices: number;
    tricycleNotices: number;
  };
  balanceBikeNotices: RecallNotice[];
  kidBikeNotices: RecallNotice[];
  kidHelmetNotices: RecallNotice[];
  rideOnNotices: RecallNotice[];
  tricycleNotices: RecallNotice[];
  hazardBreakdown: Array<{ label: string; count: number }>;
  rideOnHazardBreakdown: Array<{ label: string; count: number }>;
  tricycleHazardBreakdown: Array<{ label: string; count: number }>;
  rideOnYearlyTrend: Array<{ year: number; notices: number }>;
  tricycleYearlyTrend: Array<{ year: number; notices: number }>;
  yearlyTrend: TrendRow[];
  periodTrend: PeriodRow[];
};

export type SafetyGateAlert = {
  alertNumber: string;
  date: string;
  country: string;
  brand: string;
  productName: string;
  category: string;
  riskTypes: string[];
  riskDescription: string;
  measures: string[];
  url: string;
};

/**
 * The EU half of the record: Safety Gate (formerly RAPEX), the European
 * Commission's rapid alert system for dangerous non-food products. Same
 * discipline as the CPSC side — every count shown on the page is derived from
 * this dataset, so nothing can drift out of sync with the source it cites.
 */
export const safetyGateDataset = SAFETY_GATE_DATASET as {
  source: {
    name: string;
    api: string;
    publisherUrl: string;
    retrievedAt: string;
    note: string;
  };
  totals: {
    alertsInDatabase: number;
    alertsInCategories: number;
    nameMatches: number;
    excludedAccessories: number;
    rideOnAlerts: number;
    balanceBikeAlerts: number;
  };
  coverage: {
    databaseStartYear: number | null;
    startYear: number | null;
    endYear: number | null;
  };
  balanceBikeAlerts: SafetyGateAlert[];
  rideOnAlerts: SafetyGateAlert[];
  riskBreakdown: Array<{ label: string; count: number }>;
};

/** Earliest year the EU database reaches back to (derived, not hand-written). */
export const euSinceYear = safetyGateDataset.coverage.databaseStartYear;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function formatRecallDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  const month = MONTHS[Number(m) - 1] || m;
  return `${month} ${Number(d)}, ${y}`;
}

/** Latest calendar year present in the CPSC feed (may still be in progress). */
export const latestTrendYear =
  recallDataset.yearlyTrend.length > 0
    ? recallDataset.yearlyTrend[recallDataset.yearlyTrend.length - 1].year
    : recallDataset.source.coverageEndYear;

export const latestTrendRow =
  recallDataset.yearlyTrend.find((row) => row.year === latestTrendYear) || recallDataset.yearlyTrend[0];

export const topHazard = recallDataset.hazardBreakdown[0];

export const earliestBalanceNotice =
  recallDataset.balanceBikeNotices.length > 0
    ? recallDataset.balanceBikeNotices[recallDataset.balanceBikeNotices.length - 1]
    : null;

export const latestBalanceNotice = recallDataset.balanceBikeNotices[0] || null;

export const recallSeo = {
  en: {
    title: "Balance Bike Recalls: CPSC + EU Safety Gate",
    description:
      "A parent-facing record of US CPSC recall notices since 2000 and EU Safety Gate alerts, covering balance bikes, children's bicycles and kids' helmets — every row linked to the official source.",
    keywords: [
      "balance bike recall",
      "kids bike recall",
      "children's bicycle recall",
      "CPSC recall list",
      "EU Safety Gate",
      "RAPEX alert",
      "balance bike safety",
    ],
  },
  zh: {
    title: "儿童平衡车与童车召回记录：美国 CPSC + 欧盟 Safety Gate",
    description:
      "基于美国 CPSC 召回通报（2000 年起）与欧盟 Safety Gate 警报整理的儿童平衡车、童车与头盔召回记录，每一条均可回溯到官方原文。",
    keywords: [
      "平衡车召回",
      "童车召回",
      "CPSC 召回名单",
      "欧盟 Safety Gate",
      "RAPEX 警报",
      "儿童骑行安全",
    ],
  },
};

type UiStrings = {
  eyebrow: string;
  heroTitle: string;
  heroLead: string;
  heroNote: string;
  retrievedLabel: string;
  coverageLabel: string;
  findingsTitle: string;
  finding1: string;
  finding2: string;
  finding3: string;
  balanceTitle: string;
  balanceLead: string;
  bikeTableTitle: string;
  bikeTableLead: string;
  helmetTableTitle: string;
  helmetTableLead: string;
  trendTitle: string;
  trendLead: string;
  hazardTitle: string;
  hazardLead: string;
  checkTitle: string;
  checkLead: string;
  checkSteps: string[];
  methodTitle: string;
  methodBody: string[];
  euTitle: string;
  euLead: string;
  euFinding: string;
  euBalanceTitle: string;
  euBalanceLead: string;
  euTableTitle: string;
  euTableLead: string;
  euColDate: string;
  euColCountry: string;
  euColBrand: string;
  euColProduct: string;
  euColRisk: string;
  euColAlert: string;
  euMethodTitle: string;
  euMethodBody: string[];
  euSourcesLabel: string;
  disclaimerTitle: string;
  disclaimerBody: string;
  openNotice: string;
  openAlert: string;
};

export const recallStrings: Record<"en" | "zh", UiStrings> = {
  en: {
    eyebrow: "Public safety record",
    heroTitle: "Record: Every US CPSC Recall Involving Balance Bikes and Kids' Bikes Since 2000",
    heroLead:
      "We downloaded the full US Consumer Product Safety Commission recall feed and read every notice that touches children's wheeled products. Nothing on this page is an opinion or a rating — each row links straight to the CPSC notice it came from.",
    heroNote:
      "Recalls are one of the few safety signals that are verifiable rather than claimed. This page exists so parents can check a specific model before buying it second-hand, or before handing a bike down to a younger child.",
    retrievedLabel: "Data retrieved",
    coverageLabel: "Coverage",
    findingsTitle: "What the record actually shows",
    finding1: "Balance bikes themselves are almost never recalled. Across {total} CPSC notices published since {start}, exactly {bb} identify balance bikes.",
    finding2: "In {year} so far there have been {bikes} children's bicycle notices but {helmets} children's helmet notices. The protective gear is recalled far more often than the bike.",
    finding3: "Where kids' bikes are recalled, the most common theme is {hazard} — not cosmetics or paint.",
    balanceTitle: "Every balance bike notice ({count})",
    balanceLead:
      "These are the only notices in the CPSC feed that identify balance bikes specifically. Read them in full: both are practical, both are fixable, and neither means the category is unsafe.",
    bikeTableTitle: "Children's bicycle notices ({count})",
    bikeTableLead:
      "Every children's bicycle, tricycle and ride-on notice in the dataset, newest first. Helmets and pad sets are listed separately below so the two populations are not mixed.",
    helmetTableTitle: "Children's helmet and pad notices ({count})",
    helmetTableLead:
      "Kept apart from the bikes on purpose: folding helmets into the bicycle count makes it look like bicycles are being recalled more every year, and they are not.",
    trendTitle: "Notice volume by year",
    trendLead:
      "Raw counts can mislead because CPSC publishes more notices overall in some years, so the last column shows children's bicycle notices as a share of that year's total notices.",
    hazardTitle: "What goes wrong, in CPSC's own words",
    hazardLead:
      "Hazard statements were grouped by keyword. A single notice can mention more than one problem, so these counts overlap and do not sum to the notice total.",
    checkTitle: "How to check the bike you already own",
    checkLead:
      "Recalls only protect families who find out about them. This takes about five minutes per bike.",
    checkSteps: [
      "Photograph the frame: brand, model name and the production date sticker, usually under the bottom bracket or on the head tube.",
      "Search that model name on cpsc.gov/Recalls — searching the model, not the retailer, is what catches older notices.",
      "Register the product with the brand. Recall remedies (repair kits, replacement parts) are only sent to registered owners.",
      "If your balance bike has air tyres, check the sidewall for the maximum PSI and keep it at or below that. A 2016 balance bike recall was caused purely by over-inflation.",
      "Before every ride, check that the stem, handlebar and seat clamp bolts are tight — looseness there is the recurring theme across kids' bike notices.",
    ],
    methodTitle: "How this dataset was built",
    methodBody: [
      "Every notice published between January {start} and today was pulled year by year from the official SaferProducts.gov recall endpoint: {api}",
      "Notices were kept when they describe a wheeled children's product (bicycles, tricycles, scooters, ride-ons) or a children's bicycle helmet.",
      "Notices were split into three populations: balance bikes, children's bicycles/ride-ons, and children's helmets/pads.",
      "Hazard wording was read from each notice's hazard field and grouped by keyword. Groupings overlap, so percentages are not reported.",
      "Numbers change when CPSC publishes new notices. Re-running `npm run data:recalls` regenerates this page's data.",
    ],
    euTitle: "European Union: Safety Gate alerts",
    euLead:
      "The EU runs its own rapid alert system for dangerous products — Safety Gate, formerly RAPEX. We searched it the same way, so the US finding can be checked against a second, independent jurisdiction.",
    euFinding:
      "The same pattern holds in Europe: across all {scanned} Safety Gate alerts published since {since}, only {bb} identify a balance bike, and {rideon} concern a child's ride-on vehicle in total.",
    euBalanceTitle: "Balance bike alerts in the EU ({count})",
    euBalanceLead:
      "These are the only alerts in the EU system naming a balance bike — sold across Europe as a run bike, Laufrad or draisienne. Both are checks a parent can repeat by hand: gaps that can trap a foot, and small parts that can be swallowed.",
    euTableTitle: "Other children's ride-on alerts in the EU ({count})",
    euTableLead:
      "Children's bicycles, tricycles and ride-on vehicles reported by national authorities across the EU/EEA, newest first. Child bike seats and other accessories were excluded ({excluded} alerts) because the child does not ride them by themselves.",
    euColDate: "Date",
    euColCountry: "Reported by",
    euColBrand: "Brand",
    euColProduct: "Product",
    euColRisk: "Risk",
    euColAlert: "Alert",
    euMethodTitle: "How the EU numbers were built",
    euMethodBody: [
      "Every alert in the Safety Gate database ({scanned} alerts, reaching back to {since}) was searched, then narrowed to the two categories that can hold a child's ride-on product: toys and childcare articles ({cats} alerts).",
      "Alerts were kept when the product name contains a ride-on term in any EU language — bike, bicycle, tricycle, ride-on, Laufrad, draisienne, loopfiets — because an EU alert is filed in the language of the country that reported it.",
      "Seats, saddles and helmets were removed ({excluded} alerts): they are accessories, not vehicles a child rides. The exclusion is counted rather than hidden.",
      "What remained splits into {bb} balance bike alerts and {other} other children's ride-on alerts.",
      "Each row links to the official Safety Gate alert page, so every line can be checked against the Commission's own record. Re-running `npm run data:safetygate` regenerates this section.",
    ],
    euSourcesLabel: "EU data source",
    disclaimerTitle: "What this page does not tell you",
    disclaimerBody:
      "This is a record of US CPSC recall notices and EU Safety Gate alerts, not a verdict on any brand, not a ranking, and not a substitute for checking your own bike. A brand appearing here more than once may simply reflect how many units it sells. Retailer-only corrections and incident reports are not included in either dataset.",
    openNotice: "Read the CPSC notice",
    openAlert: "Read the Safety Gate alert",
  },
  zh: {
    eyebrow: "公共安全记录",
    heroTitle: "记录：2000 年以来美国 CPSC 涉及平衡车与童车的全部召回通报",
    heroLead:
      "我们抓取了美国消费品安全委员会的完整召回数据，并逐条阅读了与儿童骑行产品相关的通报。本页没有任何主观评分，每一行都可点击回溯到 CPSC 官方原文。",
    heroNote:
      "召回是少数可验证而非自我宣称的安全信号。做这一页，是为了让家长在二手购买或把车传给更小的孩子之前，能先查这个型号是否被召回过。",
    retrievedLabel: "数据抓取时间",
    coverageLabel: "覆盖年份",
    findingsTitle: "数据实际说明什么",
    finding1: "平衡车本身几乎从不被召回：自 {start} 年以来 CPSC 共发布 {total} 条通报，其中明确针对平衡车的只有 {bb} 条。",
    finding2: "{year} 年至今，儿童自行车通报 {bikes} 条，而儿童头盔通报 {helmets} 条——被召回更多的是护具，不是车。",
    finding3: "童车确实被召回时，最常见的原因是{hazard}，而不是外观或漆面问题。",
    balanceTitle: "全部平衡车通报（{count} 条）",
    balanceLead:
      "这是 CPSC 数据中仅有的明确指向平衡车的通报。建议完整阅读：两者都是具体问题、都可修复，并不意味着这个品类不安全。",
    bikeTableTitle: "儿童自行车通报（{count} 条）",
    bikeTableLead: "数据集中全部儿童自行车、三轮车与骑乘玩具通报，按时间倒序。头盔与护具单列于下，两个样本不混算。",
    helmetTableTitle: "儿童头盔与护具通报（{count} 条）",
    helmetTableLead:
      "刻意与车分开统计：若把头盔并入自行车，会得出「自行车召回逐年上升」的假结论，而事实并非如此。",
    trendTitle: "逐年通报数量",
    trendLead:
      "绝对数量容易误导——CPSC 某些年份整体通报量更大，因此最后一列给出儿童自行车通报占当年全部通报的比例。",
    hazardTitle: "CPSC 原文描述的问题类型",
    hazardLead:
      "按关键词对危害描述归类。一条通报可能同时提到多个问题，因此这些计数相互重叠，相加不等于通报总数。",
    checkTitle: "如何自查你手上的车",
    checkLead: "召回只对知情的人有保护作用。每辆车大约五分钟。",
    checkSteps: [
      "给车架拍照：品牌、型号名与生产日期贴纸，通常在五通下方或头管处。",
      "用型号名在 cpsc.gov/Recalls 搜索——搜型号而不是搜商家，才能命中较早的通报。",
      "在品牌官网注册产品。补救措施（修理包、替换件）通常只寄送给已注册用户。",
      "如果平衡车是充气胎，请看胎侧标注的最大 PSI 并保持不超限：2016 年那起平衡车召回，原因仅是充气过足。",
      "每次骑行前检查把立、车把与座管夹螺丝是否紧固——松动是童车通报里反复出现的主题。",
    ],
    methodTitle: "数据集构建方式",
    methodBody: [
      "按年份从官方 SaferProducts.gov 召回接口逐段抓取 {start} 年 1 月至今的全部通报：{api}",
      "保留描述儿童骑行产品（自行车、三轮车、滑板车、骑乘玩具）或儿童自行车头盔的通报。",
      "拆分为三个样本：平衡车、儿童自行车／骑乘玩具、儿童头盔／护具。",
      "危害描述取自各通报的 hazard 字段，按关键词归类。归类相互重叠，故不计算占比。",
      "CPSC 发布新通报后数字会变化。重跑 `npm run data:recalls` 即可重新生成本页数据。",
    ],
    euTitle: "欧盟：Safety Gate 警报",
    euLead:
      "欧盟有自己的危险产品快速预警系统——Safety Gate（原 RAPEX）。我们用同样的方法检索它，让美国的结论可以在第二个独立法域得到交叉验证。",
    euFinding:
      "欧洲呈现同样的规律：自 {since} 年以来发布的全部 {scanned} 条 Safety Gate 警报中，明确指向平衡车的只有 {bb} 条，涉及儿童骑乘车辆的合计 {rideon} 条。",
    euBalanceTitle: "欧盟的平衡车警报（{count} 条）",
    euBalanceLead:
      "这是欧盟系统中仅有的点名平衡车的警报——它在欧洲被叫作 run bike、Laufrad 或 draisienne。两条都是家长可以亲手复核的问题：可能夹住脚的缝隙，以及可能被吞下的小零件。",
    euTableTitle: "欧盟其他儿童骑乘类警报（{count} 条）",
    euTableLead:
      "由欧盟／欧洲经济区各国主管机关通报的儿童自行车、三轮车与骑乘玩具，按时间倒序。儿童自行车座椅等配件已剔除（{excluded} 条），因为孩子并不单独骑乘它们。",
    euColDate: "日期",
    euColCountry: "通报国",
    euColBrand: "品牌",
    euColProduct: "产品",
    euColRisk: "风险",
    euColAlert: "警报",
    euMethodTitle: "欧盟数据如何构建",
    euMethodBody: [
      "检索 Safety Gate 数据库中的全部警报（{scanned} 条，最早回溯到 {since} 年），再收窄到可能包含儿童骑乘产品的两个分类：玩具与儿童用品（共 {cats} 条）。",
      "保留产品名称含任意欧盟语言骑乘类词的警报——bike、bicycle、tricycle、ride-on、Laufrad、draisienne、loopfiets——因为欧盟警报以通报国语言提交。",
      "剔除座椅、鞍座与头盔（{excluded} 条）：它们是配件，不是孩子骑乘的车辆。剔除数量如实列出而非隐藏。",
      "剩余部分拆分为 {bb} 条平衡车警报与 {other} 条其他儿童骑乘警报。",
      "每行都链接到官方 Safety Gate 警报页，可逐条对照欧盟委员会原始记录核验。重跑 `npm run data:safetygate` 即可重新生成本节数据。",
    ],
    euSourcesLabel: "欧盟数据来源",
    disclaimerTitle: "本页没有告诉你的事",
    disclaimerBody:
      "这是美国 CPSC 召回通报与欧盟 Safety Gate 警报的记录，不是对任何品牌的判定，不是排名，也不能替代你对自己车辆的检查。某品牌出现次数多，可能只反映其销量更大。两份数据均未包含商家自行更正与事故报告。",
    openNotice: "查看 CPSC 原文",
    openAlert: "查看 Safety Gate 原文",
  },
};

/** Fill {placeholders} without letting a missing key crash the page. */
export function fillTemplate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    key in values ? String(values[key]) : match,
  );
}

/**
 * Dataset schema for the recall record. Google uses this markup to decide
 * whether to surface a data resource in search surfaces that index datasets,
 * and it tells crawlers the numbers are machine-readable rather than prose.
 */
/** en-US thousands separators, e.g. 8335 -> "8,335". */
export function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}

export function buildDatasetSchema(pageUrl: string): Record<string, unknown> {
  const { source, totals } = recallDataset;
  const eu = safetyGateDataset;
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name:
      `Balance bike and children's bicycle safety alerts, US CPSC ${source.coverageStartYear}-${latestTrendYear} ` +
      `and EU Safety Gate ${euSinceYear ?? ""}-${eu.coverage.endYear ?? ""}`,
    description:
      `${totals.kidsBikeNotices} children's bicycle, ${totals.balanceBikeNotices} balance bike and ` +
      `${totals.kidHelmetNotices} children's helmet recall notices extracted from the US CPSC recall feed ` +
      `(${totals.cpscNoticesRetrieved} notices reviewed), plus EU Safety Gate: ` +
      `${eu.totals.balanceBikeAlerts} balance bike and ${eu.totals.rideOnAlerts} children's ride-on alerts ` +
      `found across ${eu.totals.alertsInDatabase} alerts. Every row links to its official notice or alert.`,
    url: pageUrl,
    isAccessibleForFree: true,
    dateModified: source.retrievedAt,
    temporalCoverage: `${source.coverageStartYear}-01-01/..`,
    keywords: [
      "CPSC recalls",
      "EU Safety Gate",
      "RAPEX",
      "balance bike recalls",
      "children's bicycles",
      "product safety",
      "recall notices",
    ],
    creator: {
      "@type": "Organization",
      name: "BalanceBikeToddler",
      url: pageUrl.split("/safety/")[0] || "/",
    },
    citation: [
      {
        "@type": "CreativeWork",
        name: source.name,
        url: source.publisherUrl,
      },
      {
        "@type": "CreativeWork",
        name: eu.source.name,
        url: eu.source.publisherUrl,
      },
    ],
    distribution: [
      {
        "@type": "DataDownload",
        name: "US CPSC recall feed",
        encodingFormat: "application/json",
        contentUrl: source.api,
      },
      {
        "@type": "DataDownload",
        name: "EU Safety Gate alerts",
        encodingFormat: "application/json",
        contentUrl: eu.source.api,
      },
    ],
  };
}
