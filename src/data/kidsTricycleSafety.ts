/**
 * /kids-tricycle-safety-standards/ — the compliance view of the tricycle cluster.
 *
 * Safety marking here is almost uniform: ten of the eleven tricycles claim ASTM
 * F963, the US toy-safety standard, and the eleventh claims nothing at all. That
 * near-unanimity is the finding, not a reassurance — when every toy in a
 * category carries the same mark, the mark stops separating the safe from the
 * unsafe and becomes a category cost of entry.
 *
 * The page also reports the one product that declares no compliance, the one
 * product whose category id disagrees with its namespace, and the safety-relevant
 * features that actually differ between trikes (push-handle steering control,
 * a sun canopy, grippy EVA tyres) — because those, not the mark, are what a
 * parent can use to tell two trikes apart on safety.
 */
import { ShieldCheck, BadgeCheck, Umbrella, AlertTriangle, Table2 } from "lucide-react";
import { TRICYCLE_DATASET } from "./tricycleData.generated";
import { clusterLabel } from "../components/ClusterAssetPage";

export { TRICYCLE_DATASET };
export const KIDS_TRICYCLE_SAFETY_PATH = "/kids-tricycle-safety-standards/";

const d = TRICYCLE_DATASET;
const total = d.totals.tricycles;

type TRow = typeof TRICYCLE_DATASET.rows[number];

const complianceTally = d.complianceTally;
const astm = complianceTally["ASTM F963"] ?? 0;
const noComplianceRows = d.rows.filter((r) => !r.compliance || r.compliance.length === 0);
const mismatchRows = d.rows.filter((r) => r.declaredCategoryId !== "kids_tricycles");

export const kidsTricycleSafetyVars = {
  total,
  withCompliance: d.totals.withCompliance,
  astm,
  noCompliance: noComplianceRows.length,
  mismatch: d.totals.categoryIdMismatch,
  pushHandle: d.features.pushHandle,
  canopy: d.features.canopy,
  evaTyres: d.features.evaTyres,
  balanceBikeMode: d.features.balanceBikeMode,
  withAssembly: d.totals.withAssembly,
};

export interface TricycleSafetyStrings {
  eyebrow: string;
  navLabel: string;
  h1: string;
  lead: string;
  coverageTitle: string;
  coverageLead: string;
  featureTitle: string;
  featureLead: string;
  featPush: string;
  featCanopy: string;
  featEva: string;
  featBalance: string;
  gapTitle: string;
  gapLead: string;
  gapCert: string;
  gapNoMark: string;
  gapMismatch: string;
  rosterTitle: string;
  rosterLead: string;
  colBrand: string;
  colModel: string;
  colCompliance: string;
  colAssembly: string;
  colPush: string;
  colCanopy: string;
  yes: string;
  notStated: string;
  methodTitle: string;
  methodBody: string[];
}

export const kidsTricycleSafetyStrings: Record<"en" | "zh", TricycleSafetyStrings> = {
  en: {
    eyebrow: "Plan-B asset · safety",
    navLabel: "Safety",
    h1: `Kids Tricycle Safety Standards: ASTM F963 on ${total} Trikes`,
    lead: `Safety marking in this cluster is almost a monotone: ${astm} of the ${total} tricycles claim ASTM F963, the US toy-safety standard, and the remaining ${noComplianceRows.length} claims nothing. Near-unanimity is the result worth stating — when every toy carries the same mark, the mark stops ranking the safe against the unsafe and becomes the price of admission to the category.`,
    coverageTitle: "What the compliance mark covers",
    coverageLead: `Three facts about the safety strings.`,
    featureTitle: "Safety-relevant features present",
    featureLead: `The marks that actually differ between trikes.`,
    featPush: `Push handle — ${d.features.pushHandle} of ${total}. Adult steering control from behind, the single feature that changes who is in command of the trike.`,
    featCanopy: `Sun canopy — ${d.features.canopy} of ${total}. One trike only; shade is otherwise absent from the cluster.`,
    featEva: `EVA tyres — ${d.features.evaTyres} of ${total}. Foam tyres that grip better than solid plastic on hard floors.`,
    featBalance: `Balance-bike mode — ${d.features.balanceBikeMode} of ${total}. Pedal-less riding for the youngest riders, only on the convertible frames.`,
    gapTitle: "What the mark does not prove",
    gapLead: `Three gaps behind a uniform compliance field.`,
    gapCert: `No listing names a certificate or a test-report number. ASTM F963 is asserted, not evidenced, on every trike that carries it.`,
    gapNoMark: `${noComplianceRows.length} trike carries no compliance string at all — a near-empty duplicate listing that also omits dimensions, weight and age, so its absence is part of a broader gap.`,
    gapMismatch: `${d.totals.categoryIdMismatch} trike declares a category id ("balance_bike") that disagrees with its kids_tricycles namespace, a tagging error rather than a safety finding, but it shows the feed is not internally consistent.`,
    rosterTitle: "Every trike, with its compliance",
    rosterLead: `Sorted by brand. Assembly and the two adult-control features sit beside the mark.`,
    colBrand: "Brand",
    colModel: "Model",
    colCompliance: "Compliance",
    colAssembly: "Assembly",
    colPush: "Push",
    colCanopy: "Canopy",
    yes: "yes",
    notStated: "not stated",
    methodTitle: "Method: compliance strings exactly as declared",
    methodBody: [
      `Source: the CMS product snapshot, gated to the id namespace kids_tricycles-* with category "kids_tricycles" — ${total} in-stock tricycles.`,
      `Compliance is the compliance array exactly as each listing declares it; the tally counts ASTM F963 occurrences and treats an empty array as "no mark".`,
      `No certificate, test-report id or accreditation body is named in the feed, so "asserted, not evidenced" is reported rather than inferred.`,
      `Category-id mismatches are counted from declaredCategoryId against the kids_tricycles namespace; ${d.totals.categoryIdMismatch} such row exists and is a tagging error, not a safety claim.`,
    ],
  },
  zh: {
    eyebrow: "Plan-B 资产页 · 安全",
    navLabel: "安全",
    h1: `儿童三轮车安全标准：${total} 款上的 ASTM F963`,
    lead: `本集群的安全标记几乎是单声部：${astm} / ${total} 款三轮车声称符合美国玩具安全标准 ASTM F963，剩下 ${noComplianceRows.length} 款什么都没声称。近乎一致本身就是值得说的结果——当每款玩具都贴同一标记，标记就不再是区分安全与否的标尺，而成了进入这个品类的门票。`,
    coverageTitle: "合规标记覆盖了什么",
    coverageLead: `关于安全字符串的三件事。`,
    featureTitle: "真正存在差异的安全相关功能",
    featureLead: `在款式之间真正不同的标记。`,
    featPush: `推行把手——${d.features.pushHandle} / ${total}。成人从后方掌控方向，是唯一改变「谁在指挥这辆车」的功能。`,
    featCanopy: `遮阳篷——${d.features.canopy} / ${total}。仅一款；遮阳在本集群内基本缺席。`,
    featEva: `EVA 轮胎——${d.features.evaTyres} / ${total}。在硬地板上比实心塑料更抓地的泡沫胎。`,
    featBalance: `平衡车模式——${d.features.balanceBikeMode} / ${total}。最小骑手的无踏板骑行，仅出现在 convertible 车架上。`,
    gapTitle: "标记无法证明的事",
    gapLead: `统一合规字段背后的三处缺口。`,
    gapCert: `没有任何 listing 给出证书或测试报告编号。贴了 ASTM F963 的每款都是「声称」而非「举证」。`,
    gapNoMark: `${noComplianceRows.length} 款完全没有任何合规字符串——那是一个几乎空白的重复 listing，连尺寸、重量、年龄也一并缺失，所以它的缺位是一个更大缺口的一部分。`,
    gapMismatch: `${d.totals.categoryIdMismatch} 款声明的 category id（"balance_bike"）与其 kids_tricycles 命名空间不符，这是打标错误而非安全结论，但它说明 feed 内部并不一致。`,
    rosterTitle: "每一款车及其合规",
    rosterLead: `按品牌排序。装配与两项成人掌控功能并排在标记旁。`,
    colBrand: "品牌",
    colModel: "型号",
    colCompliance: "合规",
    colAssembly: "装配",
    colPush: "推行",
    colCanopy: "遮阳",
    yes: "有",
    notStated: "未说明",
    methodTitle: "方法：合规字符串按声明原样处理",
    methodBody: [
      `数据源：CMS 产品快照，限定 id 命名空间 kids_tricycles-* 且 category 为 "kids_tricycles"，共 ${total} 款在售三轮车。`,
      `合规取每个 listing 声明的 compliance 数组；统计 ASTM F963 出现次数，空数组视为「无标记」。`,
      `feed 中未出现任何证书、测试报告编号或认可机构，因此报告为「声称而非举证」，而非推断。`,
      `类目 id 不符按 declaredCategoryId 与 kids_tricycles 命名空间比对计数；存在 ${d.totals.categoryIdMismatch} 条，属打标错误而非安全声明。`,
    ],
  },
};

export const kidsTricycleSafetyColumns = (t: TricycleSafetyStrings) => [
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
    key: "assembly",
    header: t.colAssembly,
    render: (r: never) => (r as TRow).assemblyRequired || t.notStated,
  },
  {
    key: "push",
    header: t.colPush,
    render: (r: never) => ((r as TRow).hasPushHandle ? t.yes : t.notStated),
  },
  {
    key: "canopy",
    header: t.colCanopy,
    render: (r: never) => ((r as TRow).hasCanopy ? t.yes : t.notStated),
  },
];

export const kidsTricycleSafetyIcons = {
  shield: ShieldCheck,
  badge: BadgeCheck,
  canopy: Umbrella,
  gap: AlertTriangle,
  table: Table2,
};
