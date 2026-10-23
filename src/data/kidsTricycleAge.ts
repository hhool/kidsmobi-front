/**
 * /kids-tricycle-by-age/ — the age-range view of the tricycle cluster.
 *
 * A tricycle's age label is the promise a parent reads first, and it is the
 * softest field in the whole dataset. Eleven tricycles are in stock; eight of
 * them attach any age wording at all, and only four of those eight put a number
 * on it. The other four say "Toddler" or "Kid" — words that name a stage, not a
 * range. The remaining three carry no age label whatsoever.
 *
 * Where a number does appear it is read from the structured min/max-age fields,
 * not from the label text, because the label ("2.5-5 Years") and the field
 * (30 to 60 months) sometimes disagree on the boundaries. The page reports the
 * structured floor and ceiling separately, and flags the listings that have one
 * but not the other.
 */
import { CalendarDays, Baby, ArrowUpRight, AlertTriangle, Table2 } from "lucide-react";
import { TRICYCLE_DATASET } from "./tricycleData.generated";
import { clusterLabel } from "../components/ClusterAssetPage";

export { TRICYCLE_DATASET };
export const KIDS_TRICYCLE_AGE_PATH = "/kids-tricycle-by-age/";

const d = TRICYCLE_DATASET;
const total = d.totals.tricycles;

type TRow = typeof TRICYCLE_DATASET.rows[number];

const labelled = d.rows.filter((r) => (r.ageLabel || "").trim().length > 0);
const numeric = labelled.filter((r) => r.ageLabelNumeric);
const wordOnly = labelled.filter((r) => !r.ageLabelNumeric);
const unlabelled = total - labelled.length;

const minMonths = d.rows
  .map((r) => r.minAgeMonths)
  .filter((v): v is number => v != null);
const maxMonths = d.rows
  .map((r) => r.maxAgeMonths)
  .filter((v): v is number => v != null);

function bucket(values: number[]): Array<{ months: number; count: number }> {
  const counts = new Map<number, number>();
  for (const v of values) counts.set(v, (counts.get(v) || 0) + 1);
  return [...counts.entries()]
    .map(([months, count]) => ({ months, count }))
    .sort((a, b) => a.months - b.months);
}

const minBuckets = bucket(minMonths);
const maxBuckets = bucket(maxMonths);
const minModal = minBuckets.reduce((a, b) => (b.count > a.count ? b : a), minBuckets[0]);
const maxModal = maxBuckets.reduce((a, b) => (b.count > a.count ? b : a), maxBuckets[0]);

export const kidsTricycleAgeVars = {
  total,
  labelled: labelled.length,
  numeric: numeric.length,
  wordOnly: wordOnly.length,
  unlabelled,
  withMin: d.totals.withMinAgeMonths,
  withMax: d.totals.withMaxAgeMonths,
  minBuckets,
  maxBuckets,
  minModalMonths: minModal.months,
  maxModalMonths: maxModal.months,
  minMonthsMin: Math.min(...minMonths),
  minMonthsMax: Math.max(...minMonths),
  maxMonthsMin: Math.min(...maxMonths),
  maxMonthsMax: Math.max(...maxMonths),
};

export interface TricycleAgeStrings {
  eyebrow: string;
  navLabel: string;
  h1: string;
  lead: string;
  labelTitle: string;
  labelLead: string;
  labelNumeric: string;
  labelWord: string;
  labelNone: string;
  floorTitle: string;
  floorLead: string;
  floorModal: string;
  floorSpread: string;
  ceilingTitle: string;
  ceilingLead: string;
  ceilingModal: string;
  ceilingGap: string;
  gapTitle: string;
  gapLead: string;
  gapNoLabel: string;
  gapCeiling: string;
  rosterTitle: string;
  rosterLead: string;
  colBrand: string;
  colModel: string;
  colLabel: string;
  colMin: string;
  colMax: string;
  colRange: string;
  notStated: string;
  methodTitle: string;
  methodBody: string[];
}

export const kidsTricycleAgeStrings: Record<"en" | "zh", TricycleAgeStrings> = {
  en: {
    eyebrow: "Plan-B asset · age range",
    navLabel: "By age",
    h1: `Kids Tricycle Age Range: ${total} Trikes and Their Labels`,
    lead: `The age label is the first promise a parent reads, and the softest field here. Of the ${total} tricycles in stock, ${labelled.length} carry any age wording at all, and only ${numeric.length} of those put a number on it — the rest say "Toddler" or "Kid". The other ${unlabelled} carry no age label whatsoever, so their floor and ceiling have to be read from the structured fields instead.`,
    labelTitle: "What the age label actually says",
    labelLead: `Three outcomes for eleven listings.`,
    labelNumeric: `${numeric.length} listings attach a numeric range ("2.5-5 Years"); those are the only ones a parent can place on a calendar without guessing.`,
    labelWord: `${wordOnly.length} listings use a stage word — "Toddler" twice and "Kid" twice — which names who the trike is for but never says when to retire it.`,
    labelNone: `${unlabelled} listings carry no age label at all, leaving the structured min/max fields as the only source.`,
    floorTitle: "The youngest a trike starts",
    floorLead: `Read from the structured minimum-age field, where it exists.`,
    floorModal: `The common starting point is ${kidsTricycleAgeVars.minModalMonths} months — ${minModal.count} of the ${d.totals.withMinAgeMonths} listings that state a floor begin there, so a one-year-old is the de-facto entry age for this category.`,
    floorSpread: `Stated floors run from ${kidsTricycleAgeVars.minMonthsMin} to ${kidsTricycleAgeVars.minMonthsMax} months, and ${total - d.totals.withMinAgeMonths} listing states no floor at all.`,
    ceilingTitle: "The oldest a trike claims",
    ceilingLead: `Read from the structured maximum-age field.`,
    ceilingModal: `The common ceiling is ${kidsTricycleAgeVars.maxModalMonths} months — ${maxModal.count} listings end there — which is also where the label "5 Years" tends to land.`,
    ceilingGap: `${total - d.totals.withMaxAgeMonths} listings state no maximum age, so for those the trike is "outgrown when it no longer fits" rather than "outgrown at a date". None of the ceilings here is implausible; the generator flagged zero.`,
    gapTitle: "The labels we could not read",
    gapLead: `Two gaps in the age data.`,
    gapNoLabel: `${unlabelled} listings have no age label, so a parent comparing them on age has only the min/max fields, and one of those listings has neither.`,
    gapCeiling: `${total - d.totals.withMaxAgeMonths} listings state a minimum age but no maximum, which is the more common gap than the reverse and means "how long will this last" is unanswered for them.`,
    rosterTitle: "Every trike, with its age window",
    rosterLead: `Sorted by minimum age. The range column combines the structured floor and ceiling.`,
    colBrand: "Brand",
    colModel: "Model",
    colLabel: "Label",
    colMin: "Min",
    colMax: "Max",
    colRange: "Window",
    notStated: "not stated",
    methodTitle: "Method: parsing the age field retailers publish",
    methodBody: [
      `Source: the CMS product snapshot, gated to the id namespace kids_tricycles-* with category "kids_tricycles" — ${total} in-stock tricycles.`,
      `Labelled, numeric and word-only counts come from the ageLabel string and its numeric flag; a label is "numeric" only when it carries a number, not when it merely says "Kid".`,
      `Floors and ceilings are read from the structured minAgeMonths / maxAgeMonths fields, which are treated as authoritative over the free-text label when the two disagree.`,
      `The generator flagged ${d.totals.withImplausibleMaxAge} implausible maximum ages across the set, so none were dropped; all ages are as the retailers state them.`,
    ],
  },
  zh: {
    eyebrow: "Plan-B 资产页 · 适龄",
    navLabel: "按年龄",
    h1: `儿童三轮车适龄范围：${total} 款的标签实况`,
    lead: `年龄标签是家长最先读到的承诺，也是这里最软的字段。在售的 ${total} 款三轮车中，只有 ${labelled.length} 款带任何年龄文字，而其中仅 ${numeric.length} 款标了数字——其余写的是 "Toddler" 或 "Kid"。另外 ${unlabelled} 款完全没写年龄标签，所以它们的上下限只能从结构化字段去读。`,
    labelTitle: "年龄标签到底说了什么",
    labelLead: `十一款 listing 的三种结局。`,
    labelNumeric: `${numeric.length} 款带数字区间（"2.5-5 Years"）；只有这些能让家长不用猜就能排到日历上。`,
    labelWord: `${wordOnly.length} 款用的是阶段词——"Toddler" 两次、"Kid" 两次——说明这车是给谁用的，却从不说什么时候该退场。`,
    labelNone: `${unlabelled} 款完全没有年龄标签，结构化 min/max 字段成了唯一来源。`,
    floorTitle: "三轮车最早从几岁开始",
    floorLead: `从结构化的「最小年龄」字段读取（若有）。`,
    floorModal: `最常见的起点是 ${kidsTricycleAgeVars.minModalMonths} 个月——在标明下限的 ${d.totals.withMinAgeMonths} 款里有 ${minModal.count} 款都从此开始，所以一岁是这个品类事实上的入门年龄。`,
    floorSpread: `标明的最小年龄从 ${kidsTricycleAgeVars.minMonthsMin} 到 ${kidsTricycleAgeVars.minMonthsMax} 个月，另有 ${total - d.totals.withMinAgeMonths} 款完全没标下限。`,
    ceilingTitle: "三轮车声称用到几岁",
    ceilingLead: `从结构化的「最大年龄」字段读取。`,
    ceilingModal: `最常见的上限是 ${kidsTricycleAgeVars.maxModalMonths} 个月——有 ${maxModal.count} 款止步于此——这也正是 "5 Years" 标签通常落到的地方。`,
    ceilingGap: `有 ${total - d.totals.withMaxAgeMonths} 款没标最大年龄，因此对它们来说三轮车是「骑不下去了就退」，而不是「到某个日期退」。这里的任何上限都无不合理之处；生成器标记了 0 个。`,
    gapTitle: "我们读不出的标签",
    gapLead: `年龄数据里的两处缺口。`,
    gapNoLabel: `${unlabelled} 款没有年龄标签，按年龄对照的家长只能看 min/max 字段，而其中有一款两者皆无。`,
    gapCeiling: `${total - d.totals.withMaxAgeMonths} 款标了最小年龄却没标最大年龄，这比反过来更常见，意味着「这车能用多久」对它们而言没有答案。`,
    rosterTitle: "每一款车及其适龄区间",
    rosterLead: `按最小年龄排序。区间列合并了结构化的下限与上限。`,
    colBrand: "品牌",
    colModel: "型号",
    colLabel: "标签",
    colMin: "最小",
    colMax: "最大",
    colRange: "区间",
    notStated: "未说明",
    methodTitle: "方法：解析零售商公布的年龄字段",
    methodBody: [
      `数据源：CMS 产品快照，限定 id 命名空间 kids_tricycles-* 且 category 为 "kids_tricycles"，共 ${total} 款在售三轮车。`,
      `带标签 / 数字 / 纯词三类计数来自 ageLabel 字符串及其数字标志；只有带数字的才算「数字」，单纯写 "Kid" 不算。`,
      `下限与上限从结构化 minAgeMonths / maxAgeMonths 字段读取，当它与自由文本标签不一致时，以结构化字段为准。`,
      `生成器在全集中标记了 ${d.totals.withImplausibleMaxAge} 个不合理的最大年龄，因此没有丢弃任何一条；所有年龄均按零售商声明。`,
    ],
  },
};

export const kidsTricycleAgeColumns = (t: TricycleAgeStrings) => [
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
    key: "label",
    header: t.colLabel,
    render: (r: never) => (r as TRow).ageLabel || t.notStated,
  },
  {
    key: "min",
    header: t.colMin,
    numeric: true,
    render: (r: never) => {
      const v = (r as TRow).minAgeMonths;
      return v == null ? t.notStated : `${v} mo`;
    },
  },
  {
    key: "max",
    header: t.colMax,
    numeric: true,
    render: (r: never) => {
      const v = (r as TRow).maxAgeMonths;
      return v == null ? t.notStated : `${v} mo`;
    },
  },
  {
    key: "range",
    header: t.colRange,
    render: (r: never) => {
      const a = (r as TRow).minAgeMonths;
      const b = (r as TRow).maxAgeMonths;
      if (a == null && b == null) return t.notStated;
      return `${a == null ? "?" : `${a}mo`} – ${b == null ? "?" : `${b}mo`}`;
    },
  },
];

export const kidsTricycleAgeIcons = {
  calendar: CalendarDays,
  baby: Baby,
  up: ArrowUpRight,
  gap: AlertTriangle,
  table: Table2,
};
