/**
 * /kids-tricycle-recalls/ — the recall-relevant view of the tricycle cluster.
 *
 * The CMS snapshot that backs these pages carries no recall field. It holds no
 * CPSC notice, no European alert, no per-product recall history — so this page
 * does not invent one. What it can verify is the compliance mark each trike
 * declares, which is the closest recall-relevant signal the data actually
 * contains: ten of eleven claim ASTM F963, one claims nothing, and one is tagged
 * to the wrong category. A parent who wants a real recall check is pointed at
 * the regulator, not at a number this dataset does not have.
 *
 * The honest framing is the point. A "recalls" page built on a dataset without
 * recalls would be the easiest place to drift into invented hazards; instead the
 * page reports the signal it holds and names the silence.
 */
import { ScrollText, ShieldAlert, Ban, AlertTriangle, Table2 } from "lucide-react";
import { TRICYCLE_DATASET } from "./tricycleData.generated";
import { clusterLabel } from "../components/ClusterAssetPage";

export { TRICYCLE_DATASET };
export const KIDS_TRICYCLE_RECALLS_PATH = "/kids-tricycle-recalls/";

const d = TRICYCLE_DATASET;
const total = d.totals.tricycles;

type TRow = typeof TRICYCLE_DATASET.rows[number];

const astm = d.complianceTally["ASTM F963"] ?? 0;
const noComplianceRows = d.rows.filter((r) => !r.compliance || r.compliance.length === 0);
const mismatchRows = d.rows.filter((r) => r.declaredCategoryId !== "kids_tricycles");
/** The snapshot holds no recall field; zero notices are matched to these ids. */
const notices = 0;

export const kidsTricycleRecallVars = {
  total,
  astm,
  withCompliance: d.totals.withCompliance,
  noCompliance: noComplianceRows.length,
  mismatch: d.totals.categoryIdMismatch,
  notices,
  noComplianceLabel: noComplianceRows.map((r) => clusterLabel(r as never)),
  mismatchLabel: mismatchRows.map((r) => clusterLabel(r as never)),
};

export interface TricycleRecallStrings {
  eyebrow: string;
  navLabel: string;
  h1: string;
  lead: string;
  coverageTitle: string;
  coverageLead: string;
  coverageBody: string;
  gapTitle: string;
  gapLead: string;
  gapNoField: string;
  gapNoMark: string;
  gapMismatch: string;
  rosterTitle: string;
  rosterLead: string;
  colBrand: string;
  colModel: string;
  colCompliance: string;
  colCategory: string;
  notStated: string;
  methodTitle: string;
  methodBody: string[];
}

export const kidsTricycleRecallStrings: Record<"en" | "zh", TricycleRecallStrings> = {
  en: {
    eyebrow: "Plan-B asset · recalls",
    navLabel: "Recalls",
    h1: `Kids Tricycle Recalls: What the Data Actually Holds`,
    lead: `The snapshot behind these pages carries no recall field — no CPSC notice, no European alert, no per-product history — so this page reports the recall-relevant signal it can verify rather than inventing one. Of the ${total} tricycles, ${astm} declare ASTM F963, ${noComplianceRows.length} declares no compliance at all, and ${d.totals.categoryIdMismatch} is tagged to the wrong category. Zero recall notices are matched to these ids.`,
    coverageTitle: "Compliance as the only recall signal we hold",
    coverageLead: `What the data can and cannot say about recalls.`,
    coverageBody: `${astm} of ${total} trikes carry the ASTM F963 toy-safety mark; that is the one recall-adjacent fact the feed contains. It is a self-declared mark, not a clean recall record, so it shows conformance intent, not a verified safety history.`,
    gapTitle: "Where the recall record stops",
    gapLead: `Three silences a parent should know.`,
    gapNoField: `The snapshot has no recall field at all — ${notices} notices are matched to these ids, because none exist in the source to match. A real recall check means going to CPSC directly.`,
    gapNoMark: `${noComplianceRows.length} trike (${kidsTricycleRecallVars.noComplianceLabel.join(", ")}) declares no compliance string, so even the self-declared signal is absent for it — the clearest gap in the cluster.`,
    gapMismatch: `${d.totals.categoryIdMismatch} trike (${kidsTricycleRecallVars.mismatchLabel.join(", ")}) is tagged to category "balance_bike" inside the kids_tricycles namespace, a tagging error that would mis-route any recall lookup keyed on category.`,
    rosterTitle: "Every trike, with its compliance",
    rosterLead: `Sorted by brand. The category column shows the declared id, where it disagrees with the namespace.`,
    colBrand: "Brand",
    colModel: "Model",
    colCompliance: "Compliance",
    colCategory: "Declared id",
    notStated: "not stated",
    methodTitle: "Method: what the snapshot does and does not hold",
    methodBody: [
      `Source: the CMS product snapshot, gated to the id namespace kids_tricycles-* with category "kids_tricycles" — ${total} in-stock tricycles.`,
      `The snapshot contains no recall, CPSC or alert field, so notices is reported as zero rather than fabricated; this page makes no hazard claim the source cannot support.`,
      `The only recall-adjacent figure is the self-declared compliance array; ASTM F963 is tallied from it and an empty array is counted as "no mark".`,
      `Category mismatches are counted from declaredCategoryId against the kids_tricycles namespace; ${d.totals.categoryIdMismatch} such row is a tagging error, not a recall event.`,
    ],
  },
  zh: {
    eyebrow: "Plan-B 资产页 · 召回",
    navLabel: "召回",
    h1: `儿童三轮车召回：数据实际掌握了什么`,
    lead: `支撑这些页面的快照没有召回字段——没有 CPSC 通告、没有欧洲警报、没有逐产品历史——所以本页报告它能核实的、与召回相关的信号，而不是凭空编造。${total} 款三轮车中，${astm} 款声明 ASTM F963，${noComplianceRows.length} 款完全未声明合规，还有 ${d.totals.categoryIdMismatch} 款被打到了错误的类目。匹配到这些 id 的召回通告为 0。`,
    coverageTitle: "合规是本页唯一掌握的召回信号",
    coverageLead: `数据在召回方面能说与不能说的事。`,
    coverageBody: `${total} 款中有 ${astm} 款带有 ASTM F963 玩具安全标记；这是 feed 里唯一与召回相邻的事实。它是自我声明的标记，而非干净的召回记录，因此只表明合规意图，而非经过核实的安全历史。`,
    gapTitle: "召回记录的边界",
    gapLead: `家长应当知道的三种沉默。`,
    gapNoField: `快照根本没有召回字段——匹配到这些 id 的通告为 ${notices} 条，因为源数据里本就没有可匹配的内容。真正的召回核查需要直接去 CPSC。`,
    gapNoMark: `${noComplianceRows.length} 款（${kidsTricycleRecallVars.noComplianceLabel.join("、")}）未声明任何合规字符串，因此连自我声明的信号都对它缺席——这是本集群里最清楚的缺口。`,
    gapMismatch: `${d.totals.categoryIdMismatch} 款（${kidsTricycleRecallVars.mismatchLabel.join("、")}）在 kids_tricycles 命名空间内被打成了 "balance_bike" 类目，这一打标错误会让任何按类目检索的召回查找走错路。`,
    rosterTitle: "每一款车及其合规",
    rosterLead: `按品牌排序。类目列显示声明的 id，及其与命名空间不符之处。`,
    colBrand: "品牌",
    colModel: "型号",
    colCompliance: "合规",
    colCategory: "声明 id",
    notStated: "未说明",
    methodTitle: "方法：快照掌握与未掌握的内容",
    methodBody: [
      `数据源：CMS 产品快照，限定 id 命名空间 kids_tricycles-* 且 category 为 "kids_tricycles"，共 ${total} 款在售三轮车。`,
      `快照不含召回、CPSC 或警报字段，因此通告数按零报告而非编造；本页不做源数据无法支撑的危害声明。`,
      `唯一与召回相邻的数字是自我声明的 compliance 数组；ASTM F963 由此统计，空数组计为「无标记」。`,
      `类目不符按 declaredCategoryId 与 kids_tricycles 命名空间比对计数；${d.totals.categoryIdMismatch} 条属打标错误，而非召回事件。`,
    ],
  },
};

export const kidsTricycleRecallColumns = (t: TricycleRecallStrings) => [
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
    key: "compliance",
    header: t.colCompliance,
    render: (r: never) => {
      const c = (r as TRow).compliance;
      return !c || c.length === 0 ? t.notStated : c.join(", ");
    },
  },
  {
    key: "category",
    header: t.colCategory,
    render: (r: never) => (r as TRow).declaredCategoryId || t.notStated,
  },
];

export const kidsTricycleRecallIcons = {
  scroll: ScrollText,
  shield: ShieldAlert,
  ban: Ban,
  gap: AlertTriangle,
  table: Table2,
};
