/**
 * /kids-stroller-types/ — the form taxonomy.
 *
 * The generator sorts every stroller into one of five forms — standard, jogger,
 * double, travel, lightweight — and separately tags how many actually weigh 15
 * pounds or less. Joggers are the largest slice, doubles are the widest, and the
 * "lightweight" form tag and the 15-pound scale disagree by two strollers. This
 * page is the map of the catalogue's shape.
 */
import { LayoutGrid, Footprints, Users, Plane, CircleDot, Table2 } from "lucide-react";
import { STROLLER_DATASET } from "./strollerData.generated";

export { STROLLER_DATASET };
export const KIDS_STROLLER_TYPES_PATH = "/kids-stroller-types/";

const d = STROLLER_DATASET;
const total = d.totals.strollers;
const f = d.forms;
const seatSingle = d.rows.filter((r) => r.seatCount === 1).length;
const seatDouble = d.rows.filter((r) => r.seatCount === 2).length;
const threeWheel = d.wheelsBuckets.three;
const fourWheel = d.wheelsBuckets.four;

export interface StrollerTypesStrings {
  eyebrow: string;
  navLabel: string;
  h1: string;
  lead: string;
  formsTitle: string;
  formsLead: string;
  formsSplit: string;
  joggerTitle: string;
  joggerLead: string;
  joggerNote: string;
  doubleTitle: string;
  doubleLead: string;
  doubleNote: string;
  travelTitle: string;
  travelLead: string;
  travelNote: string;
  wheelsTitle: string;
  wheelsLead: string;
  wheelsNote: string;
  rosterTitle: string;
  rosterLead: string;
  colBrand: string;
  colModel: string;
  colType: string;
  colSeats: string;
  colWheels: string;
  colWeight: string;
  notStated: string;
  methodTitle: string;
  methodBody: string[];
}

export const kidsStrollerTypesStrings: Record<"en" | "zh", StrollerTypesStrings> = {
  en: {
    eyebrow: "Plan-B asset · form",
    navLabel: "Types",
    h1: `Stroller Types: Jogger, Double, Travel and Lightweight`,
    lead: `The generator sorts all ${total} strollers into one of five forms. Joggers are the largest slice at ${f.jogger}, doubles the widest at ${f.double}, and the "lightweight" form tag (${f.lightweight}) disagrees with the scale, which counts ${d.lightweightCount} strollers at 15 pounds or under. This page is the shape of the catalogue.`,
    formsTitle: "Five forms, one catalogue",
    formsLead: `Every stroller is filed under exactly one form; the counts sum to ${total}.`,
    formsSplit: `Standard ${f.standard}, jogger ${f.jogger}, double ${f.double}, travel ${f.travel}, lightweight ${f.lightweight}. The five are mutually exclusive — a stroller is one of them, decided by its type field or its name.`,
    joggerTitle: "Joggers lead the line-up",
    joggerLead: `The biggest slice, and the one most likely to carry air-filled tyres and a fixed front wheel.`,
    joggerNote: `${f.jogger} of ${total} strollers are joggers. They are the sportiest frame here, usually with three wheels and a hand brake, aimed at parents who run.`,
    doubleTitle: "Doubles and the wider body",
    doubleLead: `Two seats, and the body that comes with them.`,
    doubleNote: `${f.double} are doubles — side-by-side or tandem — and they are the widest strollers in the set, the ones a doorway actually tests. ${seatDouble} strollers carry two seats.`,
    travelTitle: "Travel and lightweight share a goal",
    travelLead: `Both trade features for a small folded size and an easy carry.`,
    travelNote: `${f.travel} are filed as travel and ${f.lightweight} as lightweight by name, yet ${d.lightweightCount} actually weigh 15 pounds or less — so ${d.lightweightCount - f.lightweight} "travel" strollers are as light as the labelled lightweights without wearing the word.`,
    wheelsTitle: "Wheel counts split the floor",
    wheelsLead: `Three wheels marks a jogger; four marks everything else; the rest are odd counts or unstated.`,
    wheelsNote: `${threeWheel} strollers run on three wheels and ${fourWheel} on four. The remaining ${total - threeWheel - fourWheel} use two, five, six or leave the count blank — small numbers, but they break the neat split.`,
    rosterTitle: "Every stroller and the form it was sorted into",
    rosterLead: `Sorted by form, then brand. Seats, wheels and item weight sit beside the type.`,
    colBrand: "Brand",
    colModel: "Model",
    colType: "Type",
    colSeats: "Seats",
    colWheels: "Wheels",
    colWeight: "Item (lb)",
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
    eyebrow: "Plan-B 资产页 · 形态",
    navLabel: "类型",
    h1: `婴儿车类型：慢跑、双座、旅行与轻量`,
    lead: `生成器把全部 ${total} 款婴儿车归入五种形态之一。慢跑车占比最大（${f.jogger}），双座最宽（${f.double}），而"轻量"类型标签（${f.lightweight}）和电子秤对不上——秤上 15 磅及以下的共有 ${d.lightweightCount} 款。本页是这份目录的形状图。`,
    formsTitle: "五种形态，一份目录",
    formsLead: `每款车只归入一种形态；各项相加等于 ${total}。`,
    formsSplit: `标准 ${f.standard}、慢跑 ${f.jogger}、双座 ${f.double}、旅行 ${f.travel}、轻量 ${f.lightweight}。五种互斥——每款车是其中一种，由其 type 字段或名称决定。`,
    joggerTitle: "慢跑车领跑阵容",
    joggerLead: `最大的一块，也最可能是充气胎加固定前轮。`,
    joggerNote: `${f.jogger} / ${total} 款是慢跑车。它们是这里最运动的车架，通常三轮加手刹，面向跑步的家长。`,
    doubleTitle: "双座与更宽的车身",
    doubleLead: `两个座位，以及随之而来的车身。`,
    doubleNote: `${f.double} 款是双座——并排或前后——它们是这套里最宽的，也是真正考验门的车。${seatDouble} 款可载两个座位。`,
    travelTitle: "旅行与轻量共享一个目标",
    travelLead: `两者都用功能换更小的折叠体积和更轻松的搬运。`,
    travelNote: `${f.travel} 款按名称归为旅行，${f.lightweight} 款归为轻量，然而实际 15 磅及以下的却有 ${d.lightweightCount} 款——于是有 ${d.lightweightCount - f.lightweight} 款"旅行"车和标了名的轻量车一样轻，却没挂这个词。`,
    wheelsTitle: "轮数把地面分开",
    wheelsLead: `三轮是慢跑车的标记；四轮是其余一切；剩下的要么是奇数轮，要么没写。`,
    wheelsNote: `${threeWheel} 款用三轮，${fourWheel} 款用四轮。其余 ${total - threeWheel - fourWheel} 款用两轮、五轮、六轮，或干脆留空——数量不大，但打破了整齐的二分。`,
    rosterTitle: "每款车及其被归入的形态",
    rosterLead: `先按形态、再按品牌排序。座位数、轮数和自重放在类型旁边。`,
    colBrand: "品牌",
    colModel: "型号",
    colType: "类型",
    colSeats: "座位数",
    colWheels: "轮数",
    colWeight: "自重(磅)",
    notStated: "未说明",
    methodTitle: "这些数字是怎么读出来的",
    methodBody: [
      `数据源：CMS 产品快照，限定 id 命名空间 stroller-* 且 category 为 "stroller"，再剔除约 ${d.totals.droppedNonStroller} 个共享前缀却不是婴儿车的条目。剩下 ${total} 款在售。`,
      `每个数字都是零售商声明的值；重量按磅、尺寸按英寸，照 listing 所写，未经实测。`,
      `成员资格由 id 命名空间决定，而非营销名。自称"旅行系统"的车仍然只是一行；共享前缀的安全座椅则被剔除。`,
      `EN 1888 是本目录给全部 ${d.totals.withCompliance} 款婴儿车贴的欧洲安全标准，按声明记录，未核实认证。`,
      `诸如「N / ${total}」的计数都按数据集字段重新算。`,
    ],
  },
};

type SRow = (typeof STROLLER_DATASET)["rows"][number];

export const kidsStrollerTypesColumns = (t: StrollerTypesStrings) => [
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
    key: "seats",
    header: t.colSeats,
    numeric: true,
    render: (r: never) => String((r as SRow).seatCount),
  },
  {
    key: "wheels",
    header: t.colWheels,
    numeric: true,
    render: (r: never) => {
      const v = (r as SRow).wheels;
      return v == null ? t.notStated : String(v);
    },
  },
  {
    key: "weight",
    header: t.colWeight,
    numeric: true,
    render: (r: never) => {
      const v = (r as SRow).itemWeightLb;
      return v == null ? t.notStated : `${v}`;
    },
  },
];

export const kidsStrollerTypesVars = {
  total,
  forms: d.forms,
  seatSingle,
  seatDouble,
  threeWheel,
  fourWheel,
};

export const kidsStrollerTypesIcons = {
  grid: LayoutGrid,
  footprints: Footprints,
  users: Users,
  plane: Plane,
  wheels: CircleDot,
  table: Table2,
};
