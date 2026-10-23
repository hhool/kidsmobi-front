/**
 * /kids-tricycle-size-chart/ — the dimensions view of the tricycle cluster.
 *
 * A tricycle is a fixed shape: one seat, two rear wheels, one front wheel. What
 * varies is not the wheel count but the frame size around it, and the listings
 * mostly publish that as length, width and height in inches. Eleven tricycles
 * are in stock; ten of them publish all three, and the eleventh publishes none.
 *
 * The interesting wrinkle is the "size" field itself. On nine listings it holds
 * a word ("Small", "Medium", "One Size") or a marketing tag ("5-In-1", a model
 * code), but on two it holds a raw dimension string that duplicates the
 * dimension record. So the page reads dimensions from the dimension record, not
 * from the mislabeled field, and counts the field's contents separately.
 *
 * The widest trike is not the longest: the Radio Flyer 4-in-1 stroller trike is
 * the widest and tallest because it folds open into a stroller, while the
 * longest is a plain classic frame.
 */
import { Ruler, Box, MoveHorizontal, AlertTriangle, Table2 } from "lucide-react";
import { TRICYCLE_DATASET } from "./tricycleData.generated";
import { clusterLabel } from "../components/ClusterAssetPage";

export { TRICYCLE_DATASET };
export const KIDS_TRICYCLE_SIZE_PATH = "/kids-tricycle-size-chart/";

const d = TRICYCLE_DATASET;
const total = d.totals.tricycles;

type TRow = typeof TRICYCLE_DATASET.rows[number];

const dimRows = d.rows.filter(
  (r) => r.lengthIn != null && r.widthIn != null && r.heightIn != null
);
const sizeLabelRows = d.rows.filter((r) => (r.sizeLabelRaw || "").trim().length > 0);
const sizeLabelLooksLikeDimension = (r: TRow) =>
  /inche|^\s*[\d.]+\s*[x×]\s*[\d.]+\s*[x×]/.test(r.sizeLabelRaw || "");
const sizeLabelWordRows = sizeLabelRows.filter((r) => !sizeLabelLooksLikeDimension(r));
const sizeLabelDimRows = sizeLabelRows.filter((r) => sizeLabelLooksLikeDimension(r));

const lengths = dimRows.map((r) => r.lengthIn as number);
const widths = dimRows.map((r) => r.widthIn as number);
const heights = dimRows.map((r) => r.heightIn as number);

export const kidsTricycleSizeVars = {
  total,
  withDimensions: d.totals.withDimensions,
  withSizeLabel: sizeLabelRows.length,
  sizeLabelWord: sizeLabelWordRows.length,
  sizeLabelDim: sizeLabelDimRows.length,
  noDimensions: total - d.totals.withDimensions,
  lenMin: Math.min(...lengths),
  lenMax: Math.max(...lengths),
  widMin: Math.min(...widths),
  widMax: Math.max(...widths),
  heiMin: Math.min(...heights),
  heiMax: Math.max(...heights),
};

export interface TricycleSizeStrings {
  eyebrow: string;
  navLabel: string;
  h1: string;
  lead: string;
  sourceTitle: string;
  sourceLead: string;
  sourceBody: string;
  fieldTitle: string;
  fieldLead: string;
  fieldWord: string;
  fieldDim: string;
  fieldEmpty: string;
  rangeTitle: string;
  rangeLead: string;
  rangeLongest: string;
  rangeWidest: string;
  rangeTallest: string;
  gapTitle: string;
  gapLead: string;
  gapMissing: string;
  gapLabel: string;
  rosterTitle: string;
  rosterLead: string;
  colBrand: string;
  colModel: string;
  colLength: string;
  colWidth: string;
  colHeight: string;
  colDimRaw: string;
  colSizeLabel: string;
  notStated: string;
  methodTitle: string;
  methodBody: string[];
}

export const kidsTricycleSizeStrings: Record<"en" | "zh", TricycleSizeStrings> = {
  en: {
    eyebrow: "Plan-B asset · dimensions",
    navLabel: "Size chart",
    h1: `Kids Tricycle Size Chart: ${total} Trikes by Length and Width`,
    lead: `A tricycle is a fixed three-wheel shape, so what separates one from another is the frame size around the seat. Of the ${total} tricycles this site stocks, ${d.totals.withDimensions} publish a length, a width and a height in inches; the remaining one publishes no dimensions at all. The page reads those three numbers from the dimension record and leaves the marketing "size" tag alone.`,
    sourceTitle: "Dimensions as the listings publish them",
    sourceLead: `Every figure below is the retailer's own measurement, reproduced verbatim. Nothing was measured by us.`,
    sourceBody: `${d.totals.withDimensions} of ${total} listings carry a full length × width × height; the one that does not is a near-empty duplicate listing that omits every physical attribute.`,
    fieldTitle: "The size-label field is not a size",
    fieldLead: `Nine listings fill the "size" field, but it rarely holds a measurement.`,
    fieldWord: `${sizeLabelWordRows.length} listings put a word or a tag there — "Small", "Medium", "Large", "One Size", "5-In-1", or a bare model code. None of those tell a parent how big the trike is.`,
    fieldDim: `${sizeLabelDimRows.length} listings put a raw dimension string in the size field that simply duplicates the dimension record, so the field is inconsistent even where it is present.`,
    fieldEmpty: `One listing leaves the size field blank alongside its missing dimensions.`,
    rangeTitle: "Shortest, widest, tallest",
    rangeLead: `The extremes come from two different kinds of trike.`,
    rangeLongest: `Longest is ${kidsTricycleSizeVars.lenMax}" (a classic steel frame); shortest is ${kidsTricycleSizeVars.lenMin}" (the Radio Flyer stroller trike, which is short because it folds).`,
    rangeWidest: `Widest is ${kidsTricycleSizeVars.widMax}" — again the stroller trike, open into its push mode — while the narrowest is ${kidsTricycleSizeVars.widMin}".`,
    rangeTallest: `Tallest is ${kidsTricycleSizeVars.heiMax}" (the stroller trike upright); shortest to the handlebar is ${kidsTricycleSizeVars.heiMin}". The widest and tallest are the same product, which is the exception that proves the rule that frame size, not wheel count, is what varies.`,
    gapTitle: "Where the size page stops",
    gapLead: `Two gaps a parent comparing trikes will hit.`,
    gapMissing: `One listing carries no dimensions, no size label and no weight — it is a placeholder row and cannot be placed on a size chart.`,
    gapLabel: `The "size" field is unreliable: it holds a word on ${sizeLabelWordRows.length} listings and a duplicate dimension string on ${sizeLabelDimRows.length}, so it is reported separately rather than trusted as a measurement.`,
    rosterTitle: "Every trike, with its stated size",
    rosterLead: `Sorted by length. The size-label column shows the raw field contents so the inconsistency is visible.`,
    colBrand: "Brand",
    colModel: "Model",
    colLength: "Length",
    colWidth: "Width",
    colHeight: "Height",
    colDimRaw: "As listed",
    colSizeLabel: "Size field",
    notStated: "not stated",
    methodTitle: "Method: reading dimensions from the dimension record",
    methodBody: [
      `Source: the CMS product snapshot, gated to the id namespace kids_tricycles-* with category "kids_tricycles", minus the listings Stage 1 prunes — ${total} in-stock tricycles.`,
      `Length, width and height are read from the dimension record (dimensionsRaw) where all three are present; the listing with no dimensions is counted as a gap, not inferred.`,
      `The "size" field is read separately and classified as a word, a raw dimension string, or empty, because on two listings it duplicates the dimension record rather than naming a size.`,
      `All measurements are in inches as the retailers state them; nothing was measured, photographed or test-fit by us.`,
    ],
  },
  zh: {
    eyebrow: "Plan-B 资产页 · 尺寸",
    navLabel: "尺寸对照",
    h1: `儿童三轮车尺寸对照：按长宽高列出 ${total} 款`,
    lead: `三轮车是固定的三轮造型，所以款式之间的差异在于座垫周围的车架大小。本站在售的 ${total} 款三轮车中，有 ${d.totals.withDimensions} 款公布了长、宽、高（英寸）；剩下 1 款完全没有公布尺寸。本页只从尺寸记录读取这三个数字，营销用的「尺寸」标签另作处理。`,
    sourceTitle: "listing 公布的尺寸",
    sourceLead: `下列每个数字都是零售商自己的测量值，原样呈现，非本站复测。`,
    sourceBody: `${total} 款中有 ${d.totals.withDimensions} 款带有完整的长×宽×高；缺尺寸的那款是几乎空白的重复 listing，所有物理属性都没填。`,
    fieldTitle: "Size 字段里装的并不是尺寸",
    fieldLead: `有 9 款填写了「size」字段，但它很少装的是测量值。`,
    fieldWord: `${sizeLabelWordRows.length} 款在那里填的是词或标签——"Small"、"Medium"、"Large"、"One Size"、"5-In-1"，或者干脆一个型号代码。这些都不告诉家长车有多大。`,
    fieldDim: `${sizeLabelDimRows.length} 款在 size 字段里填的是原始尺寸字符串，只是把尺寸记录又抄了一遍，所以这个字段即便填了也不一致。`,
    fieldEmpty: `有 1 款 size 字段空白，尺寸也一并缺失。`,
    rangeTitle: "最短、最宽、最高",
    rangeLead: `两个极端来自两种不同形态的三轮车。`,
    rangeLongest: `最长的是 ${kidsTricycleSizeVars.lenMax} 英寸（经典钢架）；最短的是 ${kidsTricycleSizeVars.lenMin} 英寸（Radio Flyer 婴儿推车式三轮车，因可折叠而短）。`,
    rangeWidest: `最宽的是 ${kidsTricycleSizeVars.widMax} 英寸——同样是那款推车式三轮车展开成推行模式时；最窄的是 ${kidsTricycleSizeVars.widMin} 英寸。`,
    rangeTallest: `最高的是 ${kidsTricycleSizeVars.heiMax} 英寸（推车式三轮车竖起时）；到车把最低的是 ${kidsTricycleSizeVars.heiMin} 英寸。最宽与最高是同一款车，这恰恰说明真正在变的是车架大小，而不是轮子数量。`,
    gapTitle: "尺寸页的边界",
    gapLead: `家长对照尺寸时会撞到的两处缺口。`,
    gapMissing: `有 1 款既无尺寸、也无尺寸标签、也无重量——它是占位行，无法放上尺寸对照表。`,
    gapLabel: `"size" 字段不可靠：在 ${sizeLabelWordRows.length} 款里它是词，在 ${sizeLabelDimRows.length} 款里它是重复的维度字符串，因此单独报告，不当作测量值。`,
    rosterTitle: "每一款车及其公布尺寸",
    rosterLead: `按长度排序。Size 字段列显示原始内容，便于看出不一致。`,
    colBrand: "品牌",
    colModel: "型号",
    colLength: "长",
    colWidth: "宽",
    colHeight: "高",
    colDimRaw: "原值",
    colSizeLabel: "Size 字段",
    notStated: "未说明",
    methodTitle: "方法：从尺寸记录读取尺寸",
    methodBody: [
      `数据源：CMS 产品快照，限定 id 命名空间 kids_tricycles-* 且 category 为 "kids_tricycles"，再剔除阶段一剪掉的 listing，共 ${total} 款在售三轮车。`,
      `长、宽、高从尺寸记录（dimensionsRaw）读取，要求三者齐全；没有尺寸的 listing 计为缺口，而非推断。`,
      `"size" 字段单独读取并分类为「词」「原始维度字符串」或「空白」，因为在两款 listing 里它只是把尺寸记录又抄了一遍。`,
      `所有测量单位均为英寸，按零售商声明；非本站复测、拍照或试装。`,
    ],
  },
};

export const kidsTricycleSizeColumns = (t: TricycleSizeStrings) => [
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
    key: "length",
    header: t.colLength,
    numeric: true,
    render: (r: never) => {
      const v = (r as TRow).lengthIn;
      return v == null ? t.notStated : `${v}"`;
    },
  },
  {
    key: "width",
    header: t.colWidth,
    numeric: true,
    render: (r: never) => {
      const v = (r as TRow).widthIn;
      return v == null ? t.notStated : `${v}"`;
    },
  },
  {
    key: "height",
    header: t.colHeight,
    numeric: true,
    render: (r: never) => {
      const v = (r as TRow).heightIn;
      return v == null ? t.notStated : `${v}"`;
    },
  },
  {
    key: "dimraw",
    header: t.colDimRaw,
    render: (r: never) => (r as TRow).dimensionsRaw || t.notStated,
  },
  {
    key: "sizelabel",
    header: t.colSizeLabel,
    render: (r: never) => (r as TRow).sizeLabelRaw || t.notStated,
  },
];

export const kidsTricycleSizeIcons = {
  ruler: Ruler,
  box: Box,
  move: MoveHorizontal,
  gap: AlertTriangle,
  table: Table2,
};
