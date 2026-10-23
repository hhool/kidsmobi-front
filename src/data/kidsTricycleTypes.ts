/**
 * /kids-tricycle-types/ — the form-and-feature view of the tricycle cluster.
 *
 * A tricycle is sold in two body styles here: the classic trike (six of eleven)
 * and the convertible, a frame that folds through push, stroller and balance
 * modes (five of eleven). The categories a shopper might expect — a pure push
 * trike, a dedicated stroller trike, a trike that becomes a bike — are absent or
 * near-absent: zero push-only, zero stroller-only, zero bike-mode. The
 * "5-in-1" and "4-in-1" names overstate the count of real modes.
 *
 * The feature matrix is where the two styles split. Storage baskets and
 * adjustable seats appear on about half the range; push handles, canopies and
 * EVA tyres are rare. A parent choosing on features is really choosing between
 * the two body styles, because the features track the form almost perfectly.
 */
import { Layers, Shapes, ListChecks, AlertTriangle, Table2 } from "lucide-react";
import { TRICYCLE_DATASET } from "./tricycleData.generated";
import { clusterLabel } from "../components/ClusterAssetPage";

export { TRICYCLE_DATASET };
export const KIDS_TRICYCLE_TYPES_PATH = "/kids-tricycle-types/";

const d = TRICYCLE_DATASET;
const total = d.totals.tricycles;

type TRow = typeof TRICYCLE_DATASET.rows[number];

const formCounts = d.forms;
const featureCounts = d.features;

const featureDefs: Array<{ key: keyof typeof featureCounts; label: string }> = [
  { key: "storageBasket", label: "Storage basket" },
  { key: "adjustableSeat", label: "Adjustable seat" },
  { key: "pushHandle", label: "Push handle" },
  { key: "evaTyres", label: "EVA tyres" },
  { key: "foldingFrame", label: "Folding frame" },
  { key: "adjustableHandlebar", label: "Adjustable handlebar" },
  { key: "balanceBikeMode", label: "Balance-bike mode" },
  { key: "bell", label: "Bell" },
  { key: "canopy", label: "Canopy" },
  { key: "bikeMode", label: "Bike mode" },
];

const convertibleRows = d.rows.filter((r) => r.form === "convertible");
const classicRows = d.rows.filter((r) => r.form === "classic");

export const kidsTricycleTypesVars = {
  total,
  forms: formCounts,
  features: featureCounts,
  convertible: convertibleRows.length,
  classic: classicRows.length,
  featureDefs,
};

export interface TricycleTypesStrings {
  eyebrow: string;
  navLabel: string;
  h1: string;
  lead: string;
  formTitle: string;
  formLead: string;
  formClassic: string;
  formConvertible: string;
  formAbsent: string;
  featureTitle: string;
  featureLead: string;
  gapTitle: string;
  gapLead: string;
  gapPush: string;
  gapBike: string;
  rosterTitle: string;
  rosterLead: string;
  colBrand: string;
  colModel: string;
  colForm: string;
  colStorage: string;
  colAdjSeat: string;
  colPush: string;
  colEva: string;
  colFolding: string;
  yes: string;
  notStated: string;
  methodTitle: string;
  methodBody: string[];
}

export const kidsTricycleTypesStrings: Record<"en" | "zh", TricycleTypesStrings> = {
  en: {
    eyebrow: "Plan-B asset · types",
    navLabel: "Types",
    h1: `Kids Tricycle Types: Classic vs Convertible, ${total} Trikes`,
    lead: `Two body styles cover all ${total} tricycles here: the classic trike (${classicRows.length}) and the convertible that folds through push and balance modes (${convertibleRows.length}). The styles a parent might search for — a pure push trike, a stroller trike, a trike that becomes a bike — are missing: ${formCounts.push} push-only, ${formCounts.stroller} stroller-only, ${featureCounts.bikeMode} bike-mode. The "5-in-1" names inflate the count of real modes.`,
    formTitle: "Two body styles, no push or stroller",
    formLead: `Every trike is one of two frames.`,
    formClassic: `Classic — ${classicRows.length} trikes. A fixed three-wheel frame with pedals; the only style that appears without a folding joint or a push handle.`,
    formConvertible: `Convertible — ${convertibleRows.length} trikes. Frames marketed as "4-in-1" or "5-in-1" that add a push handle and a balance-bike mode, though the number of distinct modes is smaller than the name implies.`,
    formAbsent: `Absent entirely: ${formCounts.push} push-only trikes, ${formCounts.stroller} dedicated stroller trikes, and ${featureCounts.bikeMode} trikes that become a real bike. The cluster is classic-plus-convertible, nothing else.`,
    featureTitle: "The feature matrix",
    featureLead: `Ten features, counted across the eleven.`,
    gapTitle: "Features that rarely appear",
    gapLead: `Three near-absent features.`,
    gapPush: `Push handle — ${featureCounts.pushHandle} of ${total}. Almost exclusive to the convertible style, so a parent who wants to steer from behind is really choosing a convertible.`,
    gapBike: `Bike mode — ${featureCounts.bikeMode} of ${total}. No trike here becomes a two-wheeled bike; the "balance-bike mode" that exists is a pedal-less trike, not a bike.`,
    rosterTitle: "Every trike, with its form",
    rosterLead: `Sorted by form. The feature columns mark what each frame carries.`,
    colBrand: "Brand",
    colModel: "Model",
    colForm: "Form",
    colStorage: "Basket",
    colAdjSeat: "Adj seat",
    colPush: "Push",
    colEva: "EVA",
    colFolding: "Fold",
    yes: "yes",
    notStated: "—",
    methodTitle: "Method: form and feature flags in the feed",
    methodBody: [
      `Source: the CMS product snapshot, gated to the id namespace kids_tricycles-* with category "kids_tricycles" — ${total} in-stock tricycles.`,
      `Form is the form field (classic / convertible / push / stroller); every row resolves to classic or convertible, with push and stroller both at zero.`,
      `Features are the ten has* boolean flags exactly as the feed declares them; the counts are a straight sum across rows, not an inference from the description text.`,
      `The "5-in-1" / "4-in-1" marketing names are not counted as modes; only the boolean flags are, so the named-mode count is not reproduced here.`,
    ],
  },
  zh: {
    eyebrow: "Plan-B 资产页 · 类型",
    navLabel: "类型",
    h1: `儿童三轮车类型：经典款 vs  convertible，${total} 款`,
    lead: `两种车身形态覆盖了这里的全部 ${total} 款三轮车：经典款（${classicRows.length}）和可折叠穿过推行与平衡模式的 convertible（${convertibleRows.length}）。家长可能会搜的形态——纯推行三轮车、婴儿推车式三轮车、能变自行车的三轮车——都不见了：${formCounts.push} 款纯推行、${formCounts.stroller} 款专用推车、${featureCounts.bikeMode} 款自行车模式。"5-in-1" 之类的名字夸大了真实模式的数量。`,
    formTitle: "两种车身形态，没有推行款也没有推车款",
    formLead: `每款三轮车都属两种车架之一。`,
    formClassic: `经典款——${classicRows.length} 款。带踏板的固定三轮车架；唯一不带头折叠关节或推行把手的形态。`,
    formConvertible: `Convertible——${convertibleRows.length} 款。被叫做 "4-in-1" 或 "5-in-1" 的车架，多出推行把手与平衡车模式，但真实模式数少于名字暗示。`,
    formAbsent: `完全缺席：${formCounts.push} 款纯推行三轮车、${formCounts.stroller} 款专用推车式三轮车、${featureCounts.bikeMode} 款能变真自行车的三轮车。本集群就是「经典 + convertible」，没有别的。`,
    featureTitle: "功能矩阵",
    featureLead: `十项功能，在十一款上逐一计数。`,
    gapTitle: "几乎缺席的功能",
    gapLead: `三项近乎缺席的功能。`,
    gapPush: `推行把手——${featureCounts.pushHandle} / ${total}。几乎只在 convertible 形态出现，所以想从后方掌控方向的家长其实是在选 convertible。`,
    gapBike: `自行车模式——${featureCounts.bikeMode} / ${total}。这里没有任何一款能变成两轮自行车；存在的「平衡车模式」是无踏板的三轮车，而非自行车。`,
    rosterTitle: "每一款车及其形态",
    rosterLead: `按形态排序。功能列标出每个车架带了什么。`,
    colBrand: "品牌",
    colModel: "型号",
    colForm: "形态",
    colStorage: "篮",
    colAdjSeat: "调座",
    colPush: "推行",
    colEva: "EVA",
    colFolding: "折叠",
    yes: "有",
    notStated: "—",
    methodTitle: "方法：feed 中的形态与功能标志",
    methodBody: [
      `数据源：CMS 产品快照，限定 id 命名空间 kids_tricycles-* 且 category 为 "kids_tricycles"，共 ${total} 款在售三轮车。`,
      `形态取 form 字段（classic / convertible / push / stroller）；每行都归为 classic 或 convertible，push 与 stroller 均为 0。`,
      `功能是十个 has* 布尔标志，按 feed 原样声明；计数即跨行直接求和，而非从描述文本推断。`,
      `"5-in-1" / "4-in-1" 营销名不计为模式；仅计布尔标志，因此不复现命名模式数。`,
    ],
  },
};

export const kidsTricycleTypesColumns = (t: TricycleTypesStrings) => [
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
    key: "form",
    header: t.colForm,
    render: (r: never) => (r as TRow).form || t.notStated,
  },
  {
    key: "storage",
    header: t.colStorage,
    render: (r: never) => ((r as TRow).hasStorageBasket ? t.yes : t.notStated),
  },
  {
    key: "adjseat",
    header: t.colAdjSeat,
    render: (r: never) => ((r as TRow).hasAdjustableSeat ? t.yes : t.notStated),
  },
  {
    key: "push",
    header: t.colPush,
    render: (r: never) => ((r as TRow).hasPushHandle ? t.yes : t.notStated),
  },
  {
    key: "eva",
    header: t.colEva,
    render: (r: never) => ((r as TRow).hasEvaTyres ? t.yes : t.notStated),
  },
  {
    key: "folding",
    header: t.colFolding,
    render: (r: never) => ((r as TRow).hasFoldingFrame ? t.yes : t.notStated),
  },
];

export const kidsTricycleTypesIcons = {
  layers: Layers,
  shapes: Shapes,
  checks: ListChecks,
  gap: AlertTriangle,
  table: Table2,
};
