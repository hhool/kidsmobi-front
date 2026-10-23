/**
 * /kids-scooter-by-age/ — which age, stated honestly.
 *
 * This page exists because the obvious version of it cannot be built. Only 2 of
 * the 7 listings carry an age label with a usable number in it ("2 years old+
 * Kids", "Age6+"), and neither gives an upper bound. The other five say
 * "Toddler", "Kid", "Little Kid" or "Youth" — marketing words with no age
 * attached. Rather than dress those up as age bands, the page reports the labels
 * verbatim and then does the one thing the labels DO support: cross-tabulating
 * them against wheel count.
 *
 * That cross-tab is the finding. Every three-wheel scooter in the catalogue is
 * labelled for a toddler or a small child; the two-wheel group is labelled
 * "Youth", "Kid" and "6+". The wheel layout, not the age text, is what actually
 * determines who a scooter suits — which is the argument this page makes for
 * reading the spec rather than the label.
 */
import { Baby, CalendarRange, Split, AlertTriangle, Table2 } from "lucide-react";
import { SCOOTER_DATASET } from "./scooterData.generated";
import { rosterLabel, type ScooterColumn } from "../components/ScooterAssetPage";

export { SCOOTER_DATASET };
export const KIDS_SCOOTER_AGE_PATH = "/kids-scooter-by-age/";

const d = SCOOTER_DATASET;
const total = d.totals.kidsScooters;

/** Marketing words that imply a child too young to balance, with no number. */
const YOUNG_WORDS = /toddler|little kid|\bkid\b/i;
const OLDER_WORDS = /youth|teen|adult/i;

export const kidsScooterAgeLabels = () => ({
  numeric: d.rows.filter((r) => r.ageMinYears !== null),
  wordOnly: d.rows.filter((r) => r.ageLabel !== "" && r.ageMinYears === null),
  unstated: d.rows.filter((r) => r.ageLabel === ""),
  threeYoung: d.rows.filter((r) => r.wheelCount === 3 && YOUNG_WORDS.test(r.ageLabel)).length,
  threeTotal: d.rows.filter((r) => r.wheelCount === 3).length,
  twoOlder: d.rows.filter((r) => r.wheelCount === 2 && (OLDER_WORDS.test(r.ageLabel) || r.ageMinYears !== null)).length,
  twoTotal: d.rows.filter((r) => r.wheelCount === 2).length,
});

export interface ScooterAgeStrings {
  eyebrow: string;
  navLabel: string;
  h1: string;
  lead: string;
  labelsTitle: string;
  labelsLead: string;
  crossTitle: string;
  crossLead: string;
  crossThree: string;
  crossTwo: string;
  gapTitle: string;
  gapLead: string;
  gapNumeric: string;
  gapUpper: string;
  gapOverlap: string;
  rosterTitle: string;
  rosterLead: string;
  colBrand: string;
  colModel: string;
  colLabel: string;
  colNumeric: string;
  colWheels: string;
  notStated: string;
  methodTitle: string;
  methodBody: string[];
}

export const kidsScooterAgeStrings: Record<"en" | "zh", ScooterAgeStrings> = {
  en: {
    eyebrow: "Plan-B asset · age",
    navLabel: "Age suitability",
    h1: `Kids Scooter Ages: ${total} Listings, ${d.totals.withNumericAge} with a Number`,
    lead: `There is no honest age chart for this category, and this page is why. Of the ${total} kids' kick scooters published here, ${d.totals.withNumericAge} attach a number to the age — "2 years old+ Kids" and "Age6+" — and both numbers are lower bounds with no upper limit attached. The other ${total - d.totals.withNumericAge} use words: Toddler, Kid, Little Kid, Youth. Those words are the retailer's, not a measurement, so they are reported here exactly as written rather than converted into age bands.`,
    labelsTitle: "The labels as published",
    labelsLead: `Six distinct labels across seven listings, with "Toddler" appearing twice and no label used by more than two scooters. Every one of them is the retailer's own wording for who the product is for. None is a size, and none has been converted into one here.`,
    crossTitle: "What the labels do agree on",
    crossLead: `Read against wheel count, the labels stop being marketing and start being consistent. The two axes line up almost perfectly in a set this small.`,
    crossThree: `Three-wheel scooters and young children: all ${kidsScooterAgeLabels().threeYoung} of the ${kidsScooterAgeLabels().threeTotal} three-wheel listings are labelled for a toddler or a small child — "2 years old+ Kids", "Toddler", "Toddler". Not one is labelled for an older rider.`,
    crossTwo: `Two-wheel scooters and older children: ${kidsScooterAgeLabels().twoOlder} of the ${kidsScooterAgeLabels().twoTotal} two-wheel listings are labelled "Youth", "Age6+" or "Kid", and the priciest one in the catalogue advertises itself for "Kids, Teens & Adults" with a 240-pound rider limit.`,
    gapTitle: "What an age chart would need, and does not have",
    gapLead: `Three things separate a usable age chart from a list of marketing words. None of them is present in this catalogue.`,
    gapNumeric: `Numbers on both ends — ${d.totals.withNumericAge} of ${total} labels contain a digit. A scooter listed as "2 years old+" may be intended for a two-year-old or a five-year-old; the label does not say, and this page does not guess.`,
    gapUpper: `Upper bounds — no listing states a maximum age or a maximum rider height. The two numeric labels are both open-ended, which means neither can rule a scooter out for an older child.`,
    gapOverlap: `Overlap between labels — "Toddler" and "Youth" are five years apart and are used on scooters whose wheel layouts differ, but nothing in the listings establishes where one stops applying and the other starts. A parent is left to infer it from the wheel count.`,
    rosterTitle: "Every listing and its age wording",
    rosterLead: `Sorted by the number in the label where one exists, then alphabetically. The parsed column shows the lower bound and only the lower bound; where a label has no number the column reads as not stated rather than guessing one.`,
    colBrand: "Brand",
    colModel: "Model",
    colLabel: "Age label as published",
    colNumeric: "Lower bound",
    colWheels: "Wheels",
    notStated: "not stated",
    methodTitle: "How the age labels were read",
    methodBody: [
      `Source: the CMS product snapshot filtered to categoryId "scooters" and to the listings Stage 1 keeps — ${total} published listings, all ${d.totals.withAgeLabel} of which carry some age wording.`,
      `Labels are reproduced verbatim from the listing's Age Range field. Where the wording contains a digit it is parsed as a lower bound in years; where it does not, no number is derived and the row reads as not stated.`,
      `No label was translated into an age band, rounded, or matched against a growth chart. A marketing word is reported as a marketing word.`,
      `The wheel-count comparison is a count of labels against a published specification field, not an inference about a child's ability.`,
    ],
  },
  zh: {
    eyebrow: "Plan-B 资产页 · 年龄",
    navLabel: "年龄适配",
    h1: `童车滑板车年龄：${total} 款listing，${d.totals.withNumericAge} 款带数字`,
    lead: `这个类目做不出一张诚实的年龄对照表，本页就是原因。在本站发布的 ${total} 款童用滑板车里，只有 ${d.totals.withNumericAge} 款的年龄标签里带数字——"2 years old+ Kids" 和 "Age6+"——而且这两个数字都只有下限、没有上限。另外 ${total - d.totals.withNumericAge} 款用的是词：Toddler、Kid、Little Kid、Youth。这些词是零售商的说法、不是测量值，所以这里原样呈现，不会把它们换算成年龄段。`,
    labelsTitle: "标签原文",
    labelsLead: `${total} 款listing 用了六种不同标签，"Toddler" 出现两次，没有任何标签被两款以上共用。每一个都是零售商自己对"这是给谁用的"的描述。它们都不是尺寸，本页也没有把它们当成尺寸。`,
    crossTitle: "这些标签真正一致的地方",
    crossLead: `和轮数放在一起看，这些标签就不再只是营销话术，而是有了内部一致性。在这个只有七款的样本里，两条线索几乎完全对齐。`,
    crossThree: `三轮滑板车与年幼孩子：${kidsScooterAgeLabels().threeTotal} 款三轮 listing 全部 ${kidsScooterAgeLabels().threeYoung} 款都标注面向幼儿或小童——"2 years old+ Kids"、"Toddler"、"Toddler"。没有一款标给更大的孩子。`,
    crossTwo: `两轮滑板车与稍大孩子：${kidsScooterAgeLabels().twoTotal} 款两轮 listing 里有 ${kidsScooterAgeLabels().twoOlder} 款标注 "Youth"、"Age6+" 或 "Kid"；而全目录最贵的那款自称适合 "Kids, Teens & Adults"，承重 240 磅。`,
    gapTitle: "一张能用的年龄表需要什么，而这里没有什么",
    gapLead: `有三样东西能把营销词变成可用的年龄对照，这份产品目录一样都没有。`,
    gapNumeric: `两端都有数字——${total} 款里只有 ${d.totals.withNumericAge} 款的标签含数字。标着 "2 years old+" 的滑板车可能给两岁也可能给五岁孩子，标签没说，本页也不猜。`,
    gapUpper: `上限——没有任何 listing 给出最大年龄或最大骑手身高。两个带数字的标签都是开口的，也就是说它们都无法用来排除年龄更大的孩子。`,
    gapOverlap: `标签之间的重叠——"Toddler" 和 "Youth" 相差约五岁，却用在了轮数不同的滑板车上，而listing 里没有任何信息能确定前者何时失效、后者何时开始生效。家长只能靠轮数去推断。`,
    rosterTitle: "每一款及其年龄说法",
    rosterLead: `有数字的按数字排序，其余按品牌排序。"下限"一列只显示下限；标签里没有数字时该列显示未说明，不会去猜一个。`,
    colBrand: "品牌",
    colModel: "型号",
    colLabel: "年龄标签原文",
    colNumeric: "下限",
    colWheels: "轮数",
    notStated: "未说明",
    methodTitle: "年龄标签是怎么读的",
    methodBody: [
      `数据源：CMS 产品快照筛选 categoryId 为 "scooters" 并只保留阶段一保留的 listing，共 ${total} 款，其中 ${d.totals.withAgeLabel} 款带年龄文字。`,
      `标签按 listing 的 Age Range 字段原样复现。文字里含数字时解析为"下限（年）"；不含数字时不推导任何数字，该行显示为未说明。`,
      `没有把任何标签翻译成年龄段、取整，或对照生长曲线比对。营销词就按营销词报告。`,
      `轮数的对比是把标签与一个已公布的规格字段做计数，不是对儿童能力的推断。`,
    ],
  },
};

export const kidsScooterAgeColumns = (t: ScooterAgeStrings): ScooterColumn[] => [
  {
    key: "brand",
    header: t.colBrand,
    render: (r: never) => (r as { brand?: string }).brand || t.notStated,
  },
  {
    key: "name",
    header: t.colModel,
    render: (r: never) => rosterLabel(r as never) || t.notStated,
  },
  {
    key: "label",
    header: t.colLabel,
    render: (r: never) => (r as { ageLabel?: string }).ageLabel || t.notStated,
  },
  {
    key: "min",
    header: t.colNumeric,
    numeric: true,
    render: (r: never) => {
      const v = (r as { ageMinYears?: number | null }).ageMinYears;
      return v === null || v === undefined ? t.notStated : `${v}+`;
    },
  },
  {
    key: "wheels",
    header: t.colWheels,
    numeric: true,
    render: (r: never) => {
      const n = (r as { wheelCount?: number | null }).wheelCount;
      return n === null || n === undefined ? t.notStated : String(n);
    },
  },
];

export const kidsScooterAgeVars = {
  total,
  numeric: d.totals.withNumericAge,
  wordOnly: total - d.totals.withNumericAge,
  ...kidsScooterAgeLabels(),
};

export const kidsScooterAgeIcons = { baby: Baby, calendar: CalendarRange, split: Split, gap: AlertTriangle, table: Table2 };