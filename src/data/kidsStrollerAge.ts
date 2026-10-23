/**
 * /kids-stroller-by-age/ — the age label.
 *
 * A stroller's age range is the first filter a parent applies, yet it is one of
 * the weakest fields here: 15 of 45 carry a usable floor, only 4 print a number
 * in the label, and not one states an upper bound. The page reports the floor
 * where it exists and is blunt that the ceiling is always absent.
 */
import { Baby, CalendarDays, ArrowUpRight, TriangleAlert, Table2 } from "lucide-react";
import { STROLLER_DATASET } from "./strollerData.generated";

export { STROLLER_DATASET };
export const KIDS_STROLLER_AGE_PATH = "/kids-stroller-by-age/";

const d = STROLLER_DATASET;
const total = d.totals.strollers;

const labelled = d.totals.withAgeLabel;
const numeric = d.totals.withNumericAge;
const wordOnly = total - labelled;
const upperStated = d.rows.filter((r) => r.maxAgeMonths != null).length;
const floorZero = d.rows.filter((r) => r.minAgeMonths === 0).length;
const floorSix = d.rows.filter((r) => r.minAgeMonths === 6).length;

export interface StrollerAgeStrings {
  eyebrow: string;
  navLabel: string;
  h1: string;
  lead: string;
  labelTitle: string;
  labelLead: string;
  labelLabelled: string;
  labelNumeric: string;
  labelWord: string;
  floorTitle: string;
  floorLead: string;
  floorZero: string;
  floorSix: string;
  ceilingTitle: string;
  ceilingLead: string;
  ceilingAbsent: string;
  gapTitle: string;
  gapLead: string;
  gapCeiling: string;
  gapWord: string;
  gapWeight: string;
  rosterTitle: string;
  rosterLead: string;
  colBrand: string;
  colModel: string;
  colType: string;
  colAgeText: string;
  colFloor: string;
  colNumeric: string;
  notStated: string;
  methodTitle: string;
  methodBody: string[];
}

export const kidsStrollerAgeStrings: Record<"en" | "zh", StrollerAgeStrings> = {
  en: {
    eyebrow: "Plan-B asset · age range",
    navLabel: "By age",
    h1: `Stroller Age Range: What the Labels Actually State`,
    lead: `Only ${labelled} of ${total} strollers carry a usable age floor, and just ${numeric} print a number in the label — the rest say only a word like "Baby" or "Kid". Not one of the ${total} states an upper age limit. This page separates the few real floors from the bare words and is blunt about the ceiling.`,
    labelTitle: "How the age labels are actually written",
    labelLead: `Most labels are a word; a minority carry a parseable floor.`,
    labelLabelled: `${labelled} of ${total} strollers carry a usable age floor (a month value we could read). The remaining ${wordOnly} give only a word such as "Infant", "Baby", "Toddler" or "Kid".`,
    labelNumeric: `Just ${numeric} of ${total} print a number inside the label itself — typically a range like "6-36 months". The other ${labelled - numeric} usable floors were read from a phrase such as "Less than 36 months", not from a printed figure.`,
    labelWord: `${wordOnly} labels say nothing measurable. A word tells a parent the intent ("Baby") but not the month a child may ride, so these cannot be compared on a timeline.`,
    floorTitle: "The youngest-usable floor is the firmer one",
    floorLead: `Where a floor exists it is usually newborn or six months; above that the label goes quiet.`,
    floorZero: `${floorZero} strollers open at newborn (0 months) — these are the reversible-seat and pramette models meant to carry a baby from birth.`,
    floorSix: `${floorSix} open at six months, the common lower bound for umbrella and travel frames that will not lie flat.`,
    ceilingTitle: "Where the upper age goes unstated",
    ceilingLead: `The catalogue never closes the range; every upper limit is absent.`,
    ceilingAbsent: `${upperStated} of ${total} strollers state a maximum age. Because none do, the "up to" figure a parent needs — when a toddler outgrows the seat — is simply not in this data.`,
    gapTitle: "Gaps a parent hits on age",
    gapLead: `Stated because the timeline a buyer builds from the label breaks at these points.`,
    gapCeiling: `No upper limit — ${upperStated} of ${total} state a maximum age, so "outgrows at 3" cannot be confirmed from the listing.`,
    gapWord: `Word-only labels — ${wordOnly} of ${total} give a word with no month, so two "Baby" strollers may fit very different age spans.`,
    gapWeight: `Weight limit is the real ceiling — but only ${d.totals.withWeightLimit} of ${total} state it, so the number that actually ends use is missing on ${total - d.totals.withWeightLimit} strollers.`,
    rosterTitle: "Age labels as the catalogue prints them",
    rosterLead: `Sorted by the floor we could read; "not stated" means the label was a word only.`,
    colBrand: "Brand",
    colModel: "Model",
    colType: "Type",
    colAgeText: "Label as written",
    colFloor: "Floor (mo)",
    colNumeric: "Number in label",
    notStated: "not stated",
    methodTitle: "How these stroller figures were read",
    methodBody: [
      `Source: the CMS product snapshot, limited to the id namespace stroller-* with category "stroller", after dropping about ${d.totals.droppedNonStroller} items that share the prefix but are not strollers — car seats and baby swings. ${total} strollers remain in stock.`,
      `Every figure is the retailer's stated number. Item weights are in pounds and dimensions in inches as the listing gives them; nothing here was weighed, measured or tested.`,
      `Membership is decided by the id namespace, not by the marketing name. A stroller that calls itself a "travel system" is still one row; a car seat that shares the prefix is dropped.`,
      `EN 1888 is the European safety standard the catalogue attaches to all ${d.totals.withCompliance} strollers. It is recorded as stated; we did not verify certification.`,
      `Counts such as "N of ${total}" are recomputed from the dataset fields, not rounded from a summary.`,
    ],
  },
  zh: {
    eyebrow: "Plan-B 资产页 · 适龄",
    navLabel: "按年龄",
    h1: `婴儿车适龄：标签到底写了什么`,
    lead: `只有 ${labelled} / ${total} 款婴儿车带有可用的年龄下限，其中仅 ${numeric} 款在标签里打印了数字——其余只写"Baby""Kid"之类的词。${total} 款里没有任何一款标出年龄上限。本页把少数真实下限与单纯的词分开，并对上限直言不讳。`,
    labelTitle: "年龄标签到底是怎么写的",
    labelLead: `多数标签是个词；少数才带可解析的下限。`,
    labelLabelled: `${labelled} / ${total} 款带有可用的年龄下限（我们能读到的月份值）。剩下 ${wordOnly} 款只给一个词，如 "Infant""Baby""Toddler" 或 "Kid"。`,
    labelNumeric: `只有 ${numeric} / ${total} 款在标签本身里打印了数字——通常像 "6-36 months" 这样的区间。其余 ${labelled - numeric} 个可用下限是从"Less than 36 months"这类话里读出来的，不是印出来的数字。`,
    labelWord: `${wordOnly} 个标签毫无可量化内容。一个词告诉家长意图（"Baby"），却不告诉几个月的宝宝能坐，因此无法按时间轴比较。`,
    floorTitle: "最早可用下限反而更靠谱",
    floorLead: `凡有下限，多半是新生儿或六个月；再往上标签就沉默了。`,
    floorZero: `${floorZero} 款从新生儿（0 个月）开始——这些是前后可反向、可作睡篮的型号，意在从出生就用。`,
    floorSix: `${floorSix} 款从六个月开始，是伞车与旅行车架常见的下限，因为它们不能放平。`,
    ceilingTitle: "年龄上限在哪里都不写",
    ceilingLead: `目录从不收口区间；每个上限都缺失。`,
    ceilingAbsent: `${upperStated} / ${total} 款标出最大年龄。因为一款都没有，家长需要的"几岁坐不下"的数字，根本不在这份数据里。`,
    gapTitle: "家长在年龄上会撞上的缺口",
    gapLead: `放在这里，是因为买家照标签搭出的时间轴会在这些点上断裂。`,
    gapCeiling: `没有上限——${upperStated} / ${total} 款标出最大年龄，所以"三岁坐不下"无法从 listing 确认。`,
    gapWord: `只有词的标签——${wordOnly} / ${total} 款只给词不给月，于是两款"Baby"可能适用完全不同的年龄跨度。`,
    gapWeight: `承重才是真正的上限——但只有 ${d.totals.withWeightLimit} / ${total} 款写明，所以真正决定何时停用的数字在 ${total - d.totals.withWeightLimit} 款上缺失。`,
    rosterTitle: "年龄标签按目录原样呈现",
    rosterLead: `按我们能读到的下限排序；「未说明」表示标签只有一个词。`,
    colBrand: "品牌",
    colModel: "型号",
    colType: "类型",
    colAgeText: "标签原文",
    colFloor: "下限(月)",
    colNumeric: "标签含数字",
    notStated: "未说明",
    methodTitle: "这些数字是怎么读出来的",
    methodBody: [
      `数据源：CMS 产品快照，限定 id 命名空间 stroller-* 且 category 为 "stroller"，再剔除约 ${d.totals.droppedNonStroller} 个共享前缀却不是婴儿车的条目。剩下的 ${total} 款在售。`,
      `每个数字都是零售商声明的值；重量按磅、尺寸按英寸，照 listing 所写，未经实测。`,
      `成员资格由 id 命名空间决定，而非营销名。自称"旅行系统"的车仍然只是一行；共享前缀的安全座椅则被剔除。`,
      `EN 1888 是本目录给全部 ${d.totals.withCompliance} 款婴儿车贴的欧洲安全标准，按声明记录，未核实认证。`,
      `诸如「N / ${total}」的计数都按数据集字段重新算。`,
    ],
  },
};

type SRow = (typeof STROLLER_DATASET)["rows"][number];

export const kidsStrollerAgeColumns = (t: StrollerAgeStrings) => [
  {
    key: "brand",
    header: t.colBrand,
    render: (r: never) => (r as SRow).brand || t.notStated,
  },
  {
    key: "model",
    header: t.colModel,
    render: (r: never) => {
      const row = r as SRow;
      return `${row.brand} ${row.model}`.trim() || t.notStated;
    },
  },
  {
    key: "form",
    header: t.colType,
    render: (r: never) => (r as SRow).form || t.notStated,
  },
  {
    key: "ageText",
    header: t.colAgeText,
    render: (r: never) => (r as SRow).ageText || t.notStated,
  },
  {
    key: "floor",
    header: t.colFloor,
    numeric: true,
    render: (r: never) => {
      const v = (r as SRow).minAgeMonths;
      return v == null ? t.notStated : String(v);
    },
  },
  {
    key: "numeric",
    header: t.colNumeric,
    render: (r: never) => ((r as SRow).ageLabelNumeric ? "yes" : "no"),
  },
];

export const kidsStrollerAgeVars = {
  total,
  labelled,
  numeric,
  wordOnly,
  upperStated,
  floorZero,
  floorSix,
};

export const kidsStrollerAgeIcons = {
  baby: Baby,
  calendar: CalendarDays,
  ceiling: ArrowUpRight,
  gap: TriangleAlert,
  table: Table2,
};
