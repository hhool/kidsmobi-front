/**
 * /kids-stroller-size-chart/ — open and folded dimensions.
 *
 * A stroller is bought on a number of inches: will it fit through the door, in
 * the trunk, in the overhead bin? This page reports what the 45 listings
 * actually publish — every one gives open length/width/height, but only six
 * give a folded measurement, and none gives a doorway-clearance figure. The
 * gap is the point: the number a traveller needs most is the one most often
 * missing.
 */
import { Ruler, Package, DoorOpen, TriangleAlert, Table2 } from "lucide-react";
import { STROLLER_DATASET } from "./strollerData.generated";

export { STROLLER_DATASET };
export const KIDS_STROLLER_SIZE_PATH = "/kids-stroller-size-chart/";

const d = STROLLER_DATASET;
const total = d.totals.strollers;

const lengthMin = Math.min(...d.rows.map((r) => r.lengthIn));
const lengthMax = Math.max(...d.rows.map((r) => r.lengthIn));
const widthMin = Math.min(...d.rows.map((r) => r.widthIn));
const widthMax = Math.max(...d.rows.map((r) => r.widthIn));
const heightMin = Math.min(...d.rows.map((r) => r.heightIn));
const heightMax = Math.max(...d.rows.map((r) => r.heightIn));
const floorMin = Math.round(Math.min(...d.rows.map((r) => r.lengthIn * r.widthIn)));
const floorMax = Math.round(Math.max(...d.rows.map((r) => r.lengthIn * r.widthIn)));
const foldedRows = d.rows.filter((r) => r.foldedLengthIn != null);
const foldedVolMin = Math.round(
  Math.min(...foldedRows.map((r) => (r.foldedLengthIn ?? 0) * (r.foldedWidthIn ?? 0) * (r.foldedHeightIn ?? 0)))
);
const foldedVolMax = Math.round(
  Math.max(...foldedRows.map((r) => (r.foldedLengthIn ?? 0) * (r.foldedWidthIn ?? 0) * (r.foldedHeightIn ?? 0)))
);

export interface StrollerSizeStrings {
  eyebrow: string;
  navLabel: string;
  h1: string;
  lead: string;
  coverTitle: string;
  coverLead: string;
  foldTitle: string;
  foldLead: string;
  bodyTitle: string;
  bodyLead: string;
  bodyLongest: string;
  bodyWidest: string;
  bodyTallest: string;
  doorTitle: string;
  doorLead: string;
  gapTitle: string;
  gapLead: string;
  gapFold: string;
  gapClearance: string;
  gapSeat: string;
  rosterTitle: string;
  rosterLead: string;
  colBrand: string;
  colModel: string;
  colType: string;
  colLength: string;
  colWidth: string;
  colHeight: string;
  colFolded: string;
  notStated: string;
  methodTitle: string;
  methodBody: string[];
}

export const kidsStrollerSizeStrings: Record<"en" | "zh", StrollerSizeStrings> = {
  en: {
    eyebrow: "Plan-B asset · dimensions",
    navLabel: "Size chart",
    h1: `Stroller Sizes: Open and Folded Dimensions Across ${total} Models`,
    lead: `All ${total} strollers in this catalogue publish an open length, width and height, so the obvious bar is full. The number that actually decides a purchase — the folded size — is published by only ${d.totals.withFolded} of ${total}. This page gives every open measurement, the six folded ones, and says plainly where the figures a traveller needs are missing.`,
    coverTitle: "Open dimensions every stroller publishes",
    coverLead: `Length, width and height are present on all ${total} listings; the folded set is the rare one.`,
    foldTitle: "The folded footprint is the rarer figure",
    foldLead: `Only ${d.totals.withFolded} of ${total} strollers state a folded length, width and height. For the other ${total - d.totals.withFolded} the only folded clue is a raw string, often contradictory, that we did not parse into numbers.`,
    bodyTitle: "How the open bodies compare",
    bodyLead: `The spread is wide: the shortest is a travel frame and the longest a tandem double.`,
    bodyLongest: `Length runs from ${lengthMin} to ${lengthMax} inches. The shortest is a compact travel stroller; the longest is a tandem double that needs a wide trunk.`,
    bodyWidest: `Width runs from ${widthMin} to ${widthMax} inches. Narrow umbrella doubles sit at the low end; full-size joggers and doubles at the high end, and width is what decides a doorway, not length.`,
    bodyTallest: `Height runs from ${heightMin} to ${heightMax} inches when open, from handle to ground. Push-handle height is not given separately, so this is the only height figure on offer.`,
    doorTitle: "Doorway width is the real constraint",
    doorLead: `The catalogue publishes width, and width is what a door tests — but it never states a clearance number, so the buyer does the maths.`,
    gapTitle: "Measurements these listings leave out",
    gapLead: `Stated here because a buyer comparing two strollers will still want them answered.`,
    gapFold: `Folded size — ${d.totals.withFolded} of ${total} strollers give it. The six that do fold into between ${foldedVolMin.toLocaleString()} and ${foldedVolMax.toLocaleString()} cubic inches; the other ${total - d.totals.withFolded} make no promise about the size once collapsed.`,
    gapClearance: `Doorway and trunk clearance — nobody publishes it. Width is given, but never as a clearance against a 30-inch door or a specific cargo hold.`,
    gapSeat: `Seat width and recline angle — absent. The body is described by its outer box, not by the space a child actually sits in.`,
    rosterTitle: "All forty-five strollers, measured",
    rosterLead: `Sorted by open length. Folded shows the parsed dimensions where the listing gave them; otherwise "not stated".`,
    colBrand: "Brand",
    colModel: "Model",
    colType: "Type",
    colLength: "Length (in)",
    colWidth: "Width (in)",
    colHeight: "Height (in)",
    colFolded: "Folded (in)",
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
    eyebrow: "Plan-B 资产页 · 尺寸",
    navLabel: "尺寸对照",
    h1: `婴儿车尺寸：${total} 款的开合尺寸对照`,
    lead: `本目录 ${total} 款婴儿车全部公布了开合长、宽、高，所以最直观的那条进度条是满的。真正决定购买的数字——折叠尺寸——却只有 ${d.totals.withFolded} / ${total} 款公布。本页给出每一个展开尺寸、六个折叠尺寸，并直说旅客最需要的数字在哪里缺失。`,
    coverTitle: "每款车都公布的展开尺寸",
    coverLead: `长、宽、高在 ${total} 个 listing 上全部齐全；折叠那组才是稀缺的。`,
    foldTitle: "折叠体积才是更少见的数字",
    foldLead: `只有 ${d.totals.withFolded} / ${total} 款公布了折叠长、宽、高。其余 ${total - d.totals.withFolded} 款唯一的折叠线索是一串往往是自相矛盾的原始文本，我们未把它解析成数字。`,
    bodyTitle: "展开车身的差异有多大",
    bodyLead: `跨度很宽：最短的是旅行车架，最长的是前后双座。`,
    bodyLongest: `车长从 ${lengthMin} 到 ${lengthMax} 英寸。最短的是紧凑旅行车；最长的是需要宽大后备箱的前后双座。`,
    bodyWidest: `车宽从 ${widthMin} 到 ${widthMax} 英寸。窄巧的伞车在低端；全尺寸慢跑车和双座在高端，而决定能否进门的是宽度，不是长度。`,
    bodyTallest: `展开高度（推把到地面）从 ${heightMin} 到 ${heightMax} 英寸。推把高度没有单独给出，所以这是唯一的身高数字。`,
    doorTitle: "门宽才是真正的限制",
    doorLead: `目录公布了宽度，而门考验的正是宽度——但它从不给出"可过门"的净空数字，得由买家自己算。`,
    gapTitle: "这些 listing 漏掉的测量值",
    gapLead: `放在这里，是因为把两款车放在一起比的买家仍然会想知道。`,
    gapFold: `折叠尺寸——${d.totals.withFolded} / ${total} 款给出。给出折叠尺寸的六款，折叠体积介于 ${foldedVolMin.toLocaleString()} 到 ${foldedVolMax.toLocaleString()} 立方英寸之间；其余 ${total - d.totals.withFolded} 款对收起后多大只字未提。`,
    gapClearance: `过门与后备箱净空——没人公布。宽度给了，但从没换算成对 30 英寸门或某个行李舱的净空。`,
    gapSeat: `座宽与靠背倾角——没有。车身只以外框描述，而不是孩子真正坐进去的空间。`,
    rosterTitle: "四十五款，全部量过",
    rosterLead: `按展开车长排序。折叠列在 listing 给出解析尺寸时显示；否则标「未说明」。`,
    colBrand: "品牌",
    colModel: "型号",
    colType: "类型",
    colLength: "长(英寸)",
    colWidth: "宽(英寸)",
    colHeight: "高(英寸)",
    colFolded: "折叠(英寸)",
    notStated: "未说明",
    methodTitle: "这些数字是怎么读出来的",
    methodBody: [
      `数据源：CMS 产品快照，限定 id 命名空间 stroller-* 且 category 为 "stroller"，再剔除约 ${d.totals.droppedNonStroller} 个共享前缀却不是婴儿车的条目——安全座椅和婴儿秋千。剩下的 ${total} 款在售。`,
      `每个数字都是零售商声明的值。重量按磅、尺寸按英寸，照 listing 所写；本页没有任何内容经过称重、实测。`,
      `成员资格由 id 命名空间决定，而非营销名。自称"旅行系统"的车仍然只是一行；共享前缀的安全座椅则被剔除。`,
      `EN 1888 是本目录给全部 ${d.totals.withCompliance} 款婴儿车贴的欧洲安全标准。我们按声明记录，并未核实认证。`,
      `诸如「N / ${total}」的计数都按数据集字段重新算，而不是从摘要里四舍五入。`,
    ],
  },
};

type SRow = (typeof STROLLER_DATASET)["rows"][number];

export const kidsStrollerSizeColumns = (t: StrollerSizeStrings) => [
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
    key: "length",
    header: t.colLength,
    numeric: true,
    render: (r: never) => `${(r as SRow).lengthIn}`,
  },
  {
    key: "width",
    header: t.colWidth,
    numeric: true,
    render: (r: never) => `${(r as SRow).widthIn}`,
  },
  {
    key: "height",
    header: t.colHeight,
    numeric: true,
    render: (r: never) => `${(r as SRow).heightIn}`,
  },
  {
    key: "folded",
    header: t.colFolded,
    render: (r: never) => {
      const row = r as SRow;
      if (row.foldedLengthIn == null || row.foldedWidthIn == null || row.foldedHeightIn == null) {
        return t.notStated;
      }
      return `${row.foldedLengthIn} × ${row.foldedWidthIn} × ${row.foldedHeightIn}`;
    },
  },
];

export const kidsStrollerSizeVars = {
  total,
  withFolded: d.totals.withFolded,
  lengthMin,
  lengthMax,
  widthMin,
  widthMax,
  heightMin,
  heightMax,
  floorMin,
  floorMax,
  foldedVolMin,
  foldedVolMax,
};

export const kidsStrollerSizeIcons = {
  ruler: Ruler,
  package: Package,
  door: DoorOpen,
  gap: TriangleAlert,
  table: Table2,
};
