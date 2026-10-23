/**
 * Kids-bike recall record — derived from the CPSC recall feed.
 *
 * The site already carries a public recall record at
 * /guides/risk/balance-bike-recall-record, built from the same
 * src/data/recallData.generated.ts. That page is the balance-bike view: it
 * reports only the {n} balance-bike notices in the feed and borrows the rest of
 * the context from sibling categories.
 *
 * The kids-bike view is different, and the difference is the whole reason this
 * page exists. In the CPSC feed, children's bicycles are NOT a rounding error:
 * {kids} notices since {startYear}, against {helmet} for helmets and {balance}
 * for balance bikes. So for a parent shopping a pedal kids' bike, the recall
 * record is not a footnote — it is one of the more informative documents about
 * the category, and this page reports it at full weight.
 *
 * Discipline: every count comes from the generated dataset. Nothing here may
 * hard-code a figure, a date or a statistic.
 */
import { recallDataset, type RecallNotice } from "./safetyRecallRecord";

export const KIDS_RECALLS_PATH = "/kids-bike-recalls/";

const d = recallDataset;

export const kidsRecallNotices: RecallNotice[] = d.kidBikeNotices;
export const kidsRecallTotal = kidsRecallNotices.length;
export const kidsRecallPeriods = d.periodTrend;

/** Newest first — the recall a buyer needs to see is the most recent one. */
export const kidsRecallSorted = [...kidsRecallNotices].sort((a, b) =>
  b.date.localeCompare(a.date),
);

/**
 * The CPSC feed is the US record. A parent elsewhere needs to know it does not
 * cover their market, and the EU equivalent is a different database — the site
 * covers that on the balance-bike recall record, so this page points there
 * rather than silently implying US coverage is worldwide.
 */
export const kidsRecallCoverage = {
  startYear: d.source.coverageStartYear,
  endYear: d.source.coverageEndYear,
  retrievedAt: d.source.retrievedAt,
  publisher: d.source.publisherUrl,
  name: d.source.name,
};

export const kidsRecallHazards = d.hazardBreakdown;

/** Notices per year, oldest first, for the trend table. */
export const kidsRecallByYear = d.yearlyTrend.map((row) => ({
  year: row.year,
  notices: row.kidBikeNotices,
}));

/** The most recent year that actually has notices — 2026 is still in progress. */
export function kidsRecallLatestYearWithNotices(): number | null {
  const years = kidsRecallByYear.filter((r) => r.notices > 0).map((r) => r.year);
  return years.length ? Math.max(...years) : null;
}

export function kidsRecallLatestNotices(count = 5): RecallNotice[] {
  return kidsRecallSorted.slice(0, count);
}

export interface KidsRecallsStrings {
  eyebrow: string;
  heroTitle: string;
  heroLead: string;
  heroNote: string;
  scopeTitle: string;
  scopeLead: string;
  scopeKids: string;
  scopeBalance: string;
  scopeHelmet: string;
  scopeTotal: string;
  coverLabel: string;
  scopeCount: string;
  latestTitle: string;
  latestLead: string;
  openNotice: string;
  hazardTitle: string;
  hazardLead: string;
  hazardColHazard: string;
  hazardColCount: string;
  trendTitle: string;
  trendLead: string;
  trendColYear: string;
  trendColNotices: string;
  periodTitle: string;
  periodLead: string;
  periodColSpan: string;
  periodColNotices: string;
  checkTitle: string;
  checkLead: string;
  checkBody: string[];
  methodTitle: string;
  methodBody: string[];
  caveatTitle: string;
  caveatLead: string;
  caveatBody: string[];
  sourceLabel: string;
  retrievedLabel: string;
  coverageLabel: string;
  clusterTitle: string;
}

export const kidsRecallsStrings: Record<"en" | "zh", KidsRecallsStrings> = {
  en: {
    eyebrow: "Recall record · pedal kids' bikes",
    heroTitle: "How many children's bikes get recalled, and what goes wrong",
    heroLead:
      "Between {startYear} and {endYear} the US CPSC published {kids} recall notices on children's bicycles. That is more than {balanceRatio}x the {balance} notices on balance bikes. For a category where a child is strapped to the frame, the recall record is worth reading before you buy.",
    heroNote:
      "US CPSC data only. Recalls outside the US are published by other authorities and are not in this count.",
    scopeTitle: "Where children's bikes sit in the feed",
    scopeLead:
      "The same {total} CPSC notices the site pulls every build are split by what they cover. These are the counts, so you can see whether a category is genuinely risky or merely well indexed:",
    scopeKids: "Children's bicycles and bicycle-related children's products",
    scopeBalance: "Balance bikes",
    scopeHelmet: "Children's bicycle helmets",
    scopeTotal: "All notices retrieved from the CPSC feed",
    coverLabel: "Product category in the feed",
    scopeCount: "Notices",
    latestTitle: "The most recent notices",
    latestLead:
      "Straight from the CPSC feed, newest first. Every line links to the official notice — read the remedy, because a recall that has no consumer remedy is still a signal about the model.",
    openNotice: "Read the official CPSC notice",
    hazardTitle: "What actually goes wrong",
    hazardLead:
      "Every children's-bike notice in the feed is classified into one hazard family. This is the distribution, counted from the notice text:",
    hazardColHazard: "Hazard family",
    hazardColCount: "Notices",
    trendTitle: "Year by year",
    trendLead:
      "Notices per calendar year across the whole feed window. The current year is always partial, so a drop at the end is a reporting artefact, not a safety improvement.",
    trendColYear: "Year",
    trendColNotices: "Children's-bike notices",
    periodTitle: "Two periods, side by side",
    periodLead:
      "The same feed, split into an earlier and a later window. Volume alone does not prove improvement; the reporting culture around a category changes too.",
    periodColSpan: "Years",
    periodColNotices: "Notices",
    checkTitle: "What to do before you buy",
    checkLead: "The feed is public and searchable. Four things worth doing:",
    checkBody: [
      "Search the model. CPSC recall search covers the model number, the brand and the retailer. Searching the brand alone catches re-badges of the same product under different names.",
      "Check the date on the notice, not just the fact of it. A 2014 recall on a model still in production is a different question from one that has been superseded by a newer design.",
      "Read the remedy. Refund, repair, replacement and 'no remedy offered' are different outcomes, and the last one is not a reason to skip the model — but it does mean nobody is paying for a fault.",
      "Look for the model number on the frame, not the box. Recalls identify the product, and the number is usually stamped or printed on the frame or fork.",
    ],
    methodTitle: "Where these counts come from",
    methodBody: [
      "Source: the US Consumer Product Safety Commission's SaferProducts.gov recall API, queried for {startYear}–{endYear} and read on {retrievedAt}.",
      "Scope: the {total} notices returned by that query. Each notice is classified into children's bicycle, children's helmet, or balance bike by matching the product title and category text against patterns recorded in the generator.",
      "Counts are of notices, not of units. A single notice can cover a run of hundreds of thousands of bikes, and a model can appear in more than one notice over time.",
      "Re-run with `npm run data:recalls`. Nothing on this page is typed in by hand.",
    ],
    caveatTitle: "What this record cannot tell you",
    caveatLead: "Three limits before you rely on it:",
    caveatBody: [
      "This is US data. The EU publishes its own alerts through Safety Gate and other markets have their own registers; a bike sold elsewhere will not appear here.",
      "Recall data measures what was reported, not what was dangerous. A well-marketed product can be safer than a quiet one and still show up more often simply because more units were sold.",
      "A model with no notice is not proven safe — only untested by this record. Absence of evidence is not evidence of absence.",
    ],
    sourceLabel: "Source",
    retrievedLabel: "Retrieved",
    coverageLabel: "Coverage",
    clusterTitle: "Related datasets",
  },
  zh: {
    eyebrow: "召回记录 · 脚踏童车",
    heroTitle: "儿童自行车召回有多少起，问题出在哪",
    heroLead:
      "{startYear} 至 {endYear} 年间，美国 CPSC 发布了 {kids} 起儿童自行车召回通知，是平衡车（{balance} 起）的 {balanceRatio} 倍。对于一个要把孩子绑在车架上的品类，召回记录值得在购买前先读一遍。",
    heroNote: "仅含美国 CPSC 数据。其他市场的召回由各自机构发布，不计入此统计。",
    scopeTitle: "童车在这份数据里的位置",
    scopeLead:
      "站点每次构建会拉取同样的 {total} 条 CPSC 通知，按涵盖对象拆分后如下。把计数摊开，是为了让你看清一个品类是真的风险高，还是仅仅被记录得更完整：",
    scopeKids: "儿童自行车及自行车相关儿童用品",
    scopeBalance: "平衡车",
    scopeHelmet: "儿童自行车头盔",
    scopeTotal: "从 CPSC 数据源检索到的全部通知",
    coverLabel: "数据源中的品类",
    scopeCount: "通知数",
    latestTitle: "最近的通知",
    latestLead:
      "直接来自 CPSC 数据源，按时间倒序。每一行都链接到官方通知——请读一下 remedies，因为没有消费者补救措施的召回同样是对该型号的一个信号。",
    openNotice: "阅读 CPSC 官方通知",
    hazardTitle: "实际出问题的地方",
    hazardLead: "数据源里每一起童车通知都归入一个危害类别。以下是按通知正文统计的分布：",
    hazardColHazard: "危害类别",
    hazardColCount: "通知数",
    trendTitle: "逐年分布",
    trendLead:
      "整个覆盖窗口内每年的通知数。当前年度永远是未完整统计的，所以末尾的下降是统计口径问题，不是安全形势改善。",
    trendColYear: "年份",
    trendColNotices: "童车召回通知数",
    periodTitle: "两个时期并排看",
    periodLead:
      "同一份数据源，按早期与近期两个窗口拆分。单看数量并不能证明改进——一个品类的上报文化也在变。",
    periodColSpan: "年份区间",
    periodColNotices: "通知数",
    checkTitle: "购买前该做的事",
    checkLead: "这份数据是公开且可检索的。有四件事值得做：",
    checkBody: [
      "按型号搜索。CPSC 召回检索覆盖型号、品牌与零售商。只搜品牌也能抓到同一款产品换个名字重新贴牌的情况。",
      "看通知上的日期，而不只是「有没有」。2014 年针对某个仍在生产的型号的召回，和一个已被更新设计取代的召回，是两个不同的问题。",
      "读补救措施。退款、维修、替换和「不提供补救」是不同的结果；最后一种不能成为跳过该型号的理由，但它确实意味着没人会为这个缺陷买单。",
      "在车架上找型号数字，而不是看包装盒。召回针对的是产品，而编号通常冲压或印在车架或前叉上。",
    ],
    methodTitle: "这些数字是怎么来的",
    methodBody: [
      "来源：美国消费品安全委员会（CPSC）SaferProducts.gov 召回 API，查询区间 {startYear}–{endYear}，读取日期 {retrievedAt}。",
      "范围：该次查询返回的 {total} 条通知。每条通知按产品标题与类别文本匹配生成器中记录的规则，归入童车、儿童头盔或平衡车。",
      "计数单位是「通知」而非「件数」。一起通知可能覆盖数十万辆车，同一型号也可能随时间出现在多起通知中。",
      "重新生成：`npm run data:recalls`。本页所有数字都不是手写的。",
    ],
    caveatTitle: "这份记录无法告诉你的",
    caveatLead: "使用它之前，有三条限制值得知道：",
    caveatBody: [
      "这是美国数据。欧盟通过 Safety Gate 发布自己的预警，其他市场也有各自的登记系统；在别处销售的车型不会出现在这里。",
      "召回数据衡量的是「被报告过」，而不是「有危险」。一个推广做得好的产品可能比一个安静的产品更安全，却因为销量更大而出现得更频繁。",
      "没有通知的型号并不代表被证明安全——只是这份记录没有检验过它。证据缺失不等于证据为否。",
    ],
    sourceLabel: "来源",
    retrievedLabel: "读取日期",
    coverageLabel: "覆盖区间",
    clusterTitle: "相关数据集",
  },
};

export const kidsRecallsSeo = {
  en: {
    // Stem = "Kids Bike Recalls: CPSC Record" (32 chars, <=44 budget).
    title: "Kids Bike Recalls: CPSC Record",
    description:
      `${kidsRecallTotal} CPSC recall notices on children's bicycles since ${kidsRecallCoverage.startYear}, ` +
      `against ${d.totals.balanceBikeNotices} on balance bikes. Hazard breakdown, year-by-year trend ` +
      `and what to search before you buy.`,
    canonical: KIDS_RECALLS_PATH,
    keywords: [
      "kids bike recalls",
      "childrens bike recall list",
      "cpsc bicycle recall",
      "recall on kids bicycle",
      "kids bike safety recall check",
      "pedal bike recall",
    ],
  },
  zh: {
    title: "儿童自行车召回记录：CPSC 公布了什么",
    description:
      `自 ${kidsRecallCoverage.startYear} 年起，CPSC 共发布 ${kidsRecallTotal} 起儿童自行车召回通知，` +
      `而平衡车仅 ${d.totals.balanceBikeNotices} 起。含危害分类、逐年分布与购买前的检索建议。`,
    canonical: KIDS_RECALLS_PATH,
    keywords: [
      "儿童自行车召回",
      "童车召回名单",
      "cpsc 自行车召回",
      "儿童自行车安全召回查询",
      "脚踏童车召回",
    ],
  },
};

export function buildKidsRecallsDatasetSchema(pageUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Children's bicycle recall notices from the US CPSC",
    description:
      `${kidsRecallTotal} children's-bicycle recall notices published by the US Consumer Product Safety ` +
      `Commission between ${kidsRecallCoverage.startYear} and ${kidsRecallCoverage.endYear}, with hazard ` +
      `classification, year-by-year counts and direct links to each official notice. Retrieved ${kidsRecallCoverage.retrievedAt}.`,
    url: pageUrl,
    creator: {
      "@type": "Organization",
      name: "BalanceBikeToddler",
      url: "https://balancebiketoddler.com",
    },
    dateModified: kidsRecallCoverage.retrievedAt,
    license: "https://creativecommons.org/licenses/by/4.0/",
    keywords: ["kids bike recalls", "CPSC bicycle recall", "children's bicycle safety"],
    variableMeasured: [
      {
        "@type": "PropertyValue",
        name: "Children's-bicycle recall notices",
        value: kidsRecallTotal,
      },
      {
        "@type": "PropertyValue",
        name: "Balance-bike recall notices in the same feed",
        value: d.totals.balanceBikeNotices,
      },
      {
        "@type": "PropertyValue",
        name: "Children's-helmet recall notices in the same feed",
        value: d.totals.kidHelmetNotices,
      },
      ...kidsRecallHazards.map((h) => ({
        "@type": "PropertyValue",
        name: `Hazard family: ${h.label}`,
        value: h.count,
      })),
    ],
    sourceOrganization: {
      "@type": "Organization",
      name: kidsRecallCoverage.name,
      url: kidsRecallCoverage.publisher,
    },
  };
}