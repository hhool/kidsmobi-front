/**
 * /kids-tricycle-weight/ — the weight view of the tricycle cluster.
 *
 * A tricycle carries two weights that parents confuse: how heavy the trike is to
 * carry, and how heavy the child it is rated for may be. They are different
 * numbers from different fields, and the dataset publishes them unevenly. Nine
 * of eleven tricycles state their own weight; six state a rider limit; only six
 * state both. The other three tell you the trike's weight but not what it will
 * hold, which is the more dangerous of the two silences.
 *
 * One listing's weight is a placeholder: a "1 Pounds" figure that the generator
 * dropped below its 2 lb floor, because no real trike weighs a pound. It is
 * reported as implausible rather than published.
 */
import { Weight, Scale, Divide, AlertTriangle, Table2 } from "lucide-react";
import { TRICYCLE_DATASET } from "./tricycleData.generated";
import { clusterLabel } from "../components/ClusterAssetPage";

export { TRICYCLE_DATASET };
export const KIDS_TRICYCLE_WEIGHT_PATH = "/kids-tricycle-weight/";

const d = TRICYCLE_DATASET;
const total = d.totals.tricycles;

type TRow = typeof TRICYCLE_DATASET.rows[number];

const ownWeightRows = d.rows.filter((r) => r.itemWeightLb != null);
const limitRows = d.rows.filter((r) => r.weightLimitLb != null);
const bothRows = d.rows.filter((r) => r.itemWeightLb != null && r.weightLimitLb != null);
const ownOnlyRows = d.rows.filter((r) => r.itemWeightLb != null && r.weightLimitLb == null);
const limitOnlyRows = d.rows.filter((r) => r.itemWeightLb == null && r.weightLimitLb != null);
const implausibleRows = d.rows.filter((r) => r.implausibleItemWeight);

const ownWeights = ownWeightRows.map((r) => r.itemWeightLb as number);
const limitWeights = limitRows.map((r) => r.weightLimitLb as number);
const ratios = bothRows.map(
  (r) => (r.weightLimitLb as number) / (r.itemWeightLb as number)
);

export const kidsTricycleWeightVars = {
  total,
  withOwn: d.totals.withItemWeight,
  withLimit: d.totals.withWeightLimit,
  pairs: bothRows.length,
  ownOnly: ownOnlyRows.length,
  limitOnly: limitOnlyRows.length,
  implausible: d.totals.withImplausibleItemWeight,
  ownMin: Math.min(...ownWeights),
  ownMax: Math.max(...ownWeights),
  limitMin: Math.min(...limitWeights),
  limitMax: Math.max(...limitWeights),
  ratioMin: Math.min(...ratios),
  ratioMax: Math.max(...ratios),
  kgRows: d.units.itemWeightKgRows,
  lbRows: d.units.itemWeightLbRows,
};

export interface TricycleWeightStrings {
  eyebrow: string;
  navLabel: string;
  h1: string;
  lead: string;
  ownTitle: string;
  ownLead: string;
  ownBody: string;
  ratioTitle: string;
  ratioLead: string;
  ratioTight: string;
  ratioWide: string;
  gapTitle: string;
  gapLead: string;
  gapPairs: string;
  gapHalves: string;
  gapUnits: string;
  gapImplausible: string;
  rosterTitle: string;
  rosterLead: string;
  colBrand: string;
  colModel: string;
  colOwn: string;
  colLimit: string;
  colRatio: string;
  colUnit: string;
  notStated: string;
  methodTitle: string;
  methodBody: string[];
}

export const kidsTricycleWeightStrings: Record<"en" | "zh", TricycleWeightStrings> = {
  en: {
    eyebrow: "Plan-B asset · weight",
    navLabel: "Weight",
    h1: `Kids Tricycle Weight: Own Heft vs Rider Limit`,
    lead: `A tricycle publishes two weights that parents mix up: how heavy the trike itself is, and how heavy the child it is rated for may be. Of the ${total} tricycles, ${d.totals.withItemWeight} state their own weight and ${d.totals.withWeightLimit} state a rider limit, but only ${bothRows.length} state both — so ${ownOnlyRows.length} tell you the trike's heft without saying what it will carry.`,
    ownTitle: "Own weight against rated load",
    ownLead: `Two fields, counted apart.`,
    ownBody: `Own weights run from ${kidsTricycleWeightVars.ownMin} to ${kidsTricycleWeightVars.ownMax} lb across the nine that publish one; rider limits run from ${kidsTricycleWeightVars.limitMin} to ${kidsTricycleWeightVars.limitMax} lb across the six that publish one. The fields answer different questions and are never summed.`,
    ratioTitle: "The ratio that matters",
    ratioLead: `For the six trikes that state both, how many times the trike's own weight the child may be.`,
    ratioTight: `Tightest is ${kidsTricycleWeightVars.ratioMin.toFixed(1)}× — the trike that is itself heavy (12 lb) but rated for only 30 lb, so the child may weigh two and a half times the toy.`,
    ratioWide: `Widest is ${kidsTricycleWeightVars.ratioMax.toFixed(1)}× — the light trike (7.3 lb) rated for 55 lb, where the child may outweigh the toy by more than seven times. A higher ratio is not safer; it is just a lighter toy rated for a heavier child.`,
    gapTitle: "Where the weight goes missing",
    gapLead: `Four gaps in the weight data.`,
    gapPairs: `${ownOnlyRows.length} trikes give their own weight but no rider limit, so a parent cannot check whether their child is within load.`,
    gapHalves: `${limitOnlyRows.length} trike gives a rider limit with no own weight; none here, which means the silence is always "how heavy is the toy", never "how heavy is the child".`,
    gapUnits: `Units are mixed: ${d.units.itemWeightLbRows} weights are in pounds and ${d.units.itemWeightKgRows} is in kilograms (converted to lb for display), so the column is not in one unit in the source.`,
    gapImplausible: `One listing carried a "1 Pounds" weight, below the generator's 2 lb floor, and was dropped as a placeholder rather than published — counted as implausible, not as a real figure.`,
    rosterTitle: "Every trike, weighed",
    rosterLead: `Sorted by own weight. The ratio column shows rider-limit ÷ own-weight for the six that state both.`,
    colBrand: "Brand",
    colModel: "Model",
    colOwn: "Own lb",
    colLimit: "Rider lb",
    colRatio: "Ratio",
    colUnit: "Unit",
    notStated: "not stated",
    methodTitle: "Method: own weight against rated rider load",
    methodBody: [
      `Source: the CMS product snapshot, gated to the id namespace kids_tricycles-* with category "kids_tricycles" — ${total} in-stock tricycles.`,
      `Own weight is itemWeightLb where present; the one "1 Pounds" figure is flagged implausible by the generator's 2 lb floor and excluded, counted separately instead of published.`,
      `Rider limit is weightLimitLb, a different field from own weight; the two are never added, and "both" means both fields are non-empty on the same row.`,
      `Kilogram weights (${d.units.itemWeightKgRows} row) are converted to pounds for display; the source mixes units and is reported as such.`,
    ],
  },
  zh: {
    eyebrow: "Plan-B 资产页 · 重量",
    navLabel: "重量",
    h1: `儿童三轮车重量：自重与承重对照`,
    lead: `三轮车公布两个家长常混淆的重量：车自身多重，以及它标称能载的孩子多重。在 ${total} 款中，${d.totals.withItemWeight} 款公布自重，${d.totals.withWeightLimit} 款公布承重，但只有 ${bothRows.length} 款两者都公布——于是 ${ownOnlyRows.length} 款只告诉你车多重，却不说明它能载多重。`,
    ownTitle: "自重与标称承重",
    ownLead: `两个字段，分开计数。`,
    ownBody: `公布自重的 9 款自重从 ${kidsTricycleWeightVars.ownMin} 到 ${kidsTricycleWeightVars.ownMax} 磅；公布承重的 6 款承重从 ${kidsTricycleWeightVars.limitMin} 到 ${kidsTricycleWeightVars.limitMax} 磅。两个字段回答不同问题，从不相加。`,
    ratioTitle: "真正要紧的比值",
    ratioLead: `对两者都公布的 6 款，孩子体重可达车自重的倍数。`,
    ratioTight: `最紧的是 ${kidsTricycleWeightVars.ratioMin.toFixed(1)} 倍——车本身重（12 磅）却只标称载 30 磅，所以孩子体重可达玩具的 2.5 倍。`,
    ratioWide: `最松的是 ${kidsTricycleWeightVars.ratioMax.toFixed(1)} 倍——轻车（7.3 磅）标称载 55 磅，孩子体重可超玩具七倍多。比值越高不代表越安全，只是玩具更轻、标称载更重。`,
    gapTitle: "重量数据的缺口",
    gapLead: `重量数据里的四处缺口。`,
    gapPairs: `${ownOnlyRows.length} 款给了自重却没给承重，家长无法核对自家孩子是否在载荷内。`,
    gapHalves: `${limitOnlyRows.length} 款给了承重却没给自重；这里没有，说明沉默始终是「玩具多重」，而不是「孩子多重」。`,
    gapUnits: `单位不统一：${d.units.itemWeightLbRows} 个重量用磅，${d.units.itemWeightKgRows} 个用千克（显示时换算为磅），所以源数据并非同一单位。`,
    gapImplausible: `有 1 款标 "1 Pounds"，低于生成器的 2 磅下限，作为占位值被丢弃而非公布——计为不合理，不当作真实数字。`,
    rosterTitle: "每一款车，称过重量",
    rosterLead: `按自重排序。比值列显示「承重 ÷ 自重」，仅对两者都公布的 6 款有效。`,
    colBrand: "品牌",
    colModel: "型号",
    colOwn: "自重 lb",
    colLimit: "承重 lb",
    colRatio: "比值",
    colUnit: "单位",
    notStated: "未说明",
    methodTitle: "方法：自重对比标称乘员载荷",
    methodBody: [
      `数据源：CMS 产品快照，限定 id 命名空间 kids_tricycles-* 且 category 为 "kids_tricycles"，共 ${total} 款在售三轮车。`,
      `自重取 itemWeightLb（若有）；"1 Pounds" 那一条被生成器的 2 磅下限标记为不合理并排除，单独计数而非公布。`,
      `乘员承重是 weightLimitLb，与自重是不同的字段；两者从不相加，「两者都公布」指同一行两个字段皆非空。`,
      `千克重量（${d.units.itemWeightKgRows} 条）显示时换算为磅；源数据单位混杂，如实说明。`,
    ],
  },
};

export const kidsTricycleWeightColumns = (t: TricycleWeightStrings) => [
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
    key: "own",
    header: t.colOwn,
    numeric: true,
    render: (r: never) => {
      const v = (r as TRow).itemWeightLb;
      return v == null ? t.notStated : `${v}`;
    },
  },
  {
    key: "limit",
    header: t.colLimit,
    numeric: true,
    render: (r: never) => {
      const v = (r as TRow).weightLimitLb;
      return v == null ? t.notStated : `${v}`;
    },
  },
  {
    key: "ratio",
    header: t.colRatio,
    numeric: true,
    render: (r: never) => {
      const o = (r as TRow).itemWeightLb;
      const l = (r as TRow).weightLimitLb;
      if (o == null || l == null) return t.notStated;
      return `${(l / o).toFixed(1)}×`;
    },
  },
  {
    key: "unit",
    header: t.colUnit,
    render: (r: never) => (r as TRow).itemWeightUnit || t.notStated,
  },
];

export const kidsTricycleWeightIcons = {
  weight: Weight,
  scale: Scale,
  divide: Divide,
  gap: AlertTriangle,
  table: Table2,
};
