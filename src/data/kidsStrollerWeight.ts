/**
 * /kids-stroller-weight/ — item weight versus rated weight limit.
 *
 * Two different weights live on a stroller listing: how heavy the stroller
 * itself is, and how much child it is rated to carry. The first is published by
 * 44 of 45; the second by only 3. The page separates them, shows the light end
 * of the catalogue, and is blunt that the number a parent lifting the thing
 * into a trunk cares about most — the carry limit — is almost never stated.
 */
import { Weight, Scale, Feather, TriangleAlert, Table2 } from "lucide-react";
import { STROLLER_DATASET } from "./strollerData.generated";

export { STROLLER_DATASET };
export const KIDS_STROLLER_WEIGHT_PATH = "/kids-stroller-weight/";

const d = STROLLER_DATASET;
const total = d.totals.strollers;

const itemWeights = d.rows.map((r) => r.itemWeightLb).filter((x): x is number => x != null);
const weightMin = Math.min(...itemWeights);
const weightMax = Math.max(...itemWeights);
const limitCount = d.totals.withWeightLimit;
const lightCount = d.lightweightCount;
const formLight = d.forms.lightweight;
const missingWeight = total - d.totals.withItemWeight;
const lightOnes = d.rows.filter((r) => r.itemWeightLb != null && r.itemWeightLb <= 15).length;

export interface StrollerWeightStrings {
  eyebrow: string;
  navLabel: string;
  h1: string;
  lead: string;
  ownTitle: string;
  ownLead: string;
  ownStated: string;
  ownRange: string;
  limitTitle: string;
  limitLead: string;
  limitCount: string;
  limitGap: string;
  lightTitle: string;
  lightLead: string;
  lightCount: string;
  lightForm: string;
  gapTitle: string;
  gapLead: string;
  gapLimit: string;
  gapMissing: string;
  gapUnit: string;
  rosterTitle: string;
  rosterLead: string;
  colBrand: string;
  colModel: string;
  colType: string;
  colItem: string;
  colLimit: string;
  notStated: string;
  methodTitle: string;
  methodBody: string[];
}

export const kidsStrollerWeightStrings: Record<"en" | "zh", StrollerWeightStrings> = {
  en: {
    eyebrow: "Plan-B asset · weight",
    navLabel: "Weight",
    h1: `Stroller Weight: Item and Rated Limit Across ${total}`,
    lead: `Two weights sit on a stroller listing and they are not the same: how heavy the stroller is, and how much child it carries. ${d.totals.withItemWeight} of ${total} publish the first; only ${d.totals.withWeightLimit} publish the second. This page keeps them apart and shows where the catalogue goes quiet.`,
    ownTitle: "The empty weight almost everyone publishes",
    ownLead: `The stroller's own weight is present on ${d.totals.withItemWeight} of ${total} listings.`,
    ownStated: `${d.totals.withItemWeight} of ${total} strollers state an item weight. The one that does not is a Baby Trend frame whose weight field was left at zero.`,
    ownRange: `Item weight runs from ${weightMin} to ${weightMax} pounds — the lightest is an umbrella stroller you can sling over a shoulder, the heaviest a double all-terrain jogger.`,
    limitTitle: "The rated weight limit is the rare number",
    limitLead: `How much child the seat holds is stated on only ${d.totals.withWeightLimit} of ${total}.`,
    limitCount: `Just ${d.totals.withWeightLimit} of ${total} strollers print a weight limit, and the three that do all land at 45 or 50 pounds. The other ${total - d.totals.withWeightLimit} leave the "up to" figure blank.`,
    limitGap: `Because the limit is absent on ${total - d.totals.withWeightLimit} strollers, the question "will my toddler still fit next year" cannot be answered from the listing at all.`,
    lightTitle: "How the lightweights compare",
    lightLead: `Lightness is tracked two ways, and they do not agree.`,
    lightCount: `${lightCount} strollers actually weigh 15 pounds or less, the figure that matters for carrying and overhead bins.`,
    lightForm: `Only ${formLight} are tagged "lightweight" in their type, so ${lightCount - formLight} strollers weigh as little as the labelled ones without wearing the word — the form tag and the scale disagree.`,
    gapTitle: "Gaps a weight question runs into",
    gapLead: `Stated because the number a parent lifting the thing cares about is the one missing.`,
    gapLimit: `Rated limit — ${d.totals.withWeightLimit} of ${total} state it; the carry capacity that ends use is the rarest weight here.`,
    gapMissing: `One stroller omits its own weight entirely, so even the easier figure is not quite ${total} of ${total}.`,
    gapUnit: `Units — weights arrive in pounds and in kilograms on different listings; both are normalised to pounds here, but the raw string is kept in the dataset.`,
    rosterTitle: "All forty-five strollers, by weight",
    rosterLead: `Sorted by item weight where stated; the carry limit shows only where the listing printed it.`,
    colBrand: "Brand",
    colModel: "Model",
    colType: "Type",
    colItem: "Item (lb)",
    colLimit: "Limit (lb)",
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
    eyebrow: "Plan-B 资产页 · 重量",
    navLabel: "重量",
    h1: `婴儿车重量：${total} 款的自重与承重`,
    lead: `婴儿车 listing 上有两个重量，而且不是一回事：车有多重，以及它能载多重的孩子。${d.totals.withItemWeight} / ${total} 款公布了前者；只有 ${d.totals.withWeightLimit} 款公布了后者。本页把两者分开，并指出目录在哪里沉默。`,
    ownTitle: "几乎人人都公布的自重",
    ownLead: `车的自重出现在 ${d.totals.withItemWeight} / ${total} 个 listing 上。`,
    ownStated: `${d.totals.withItemWeight} / ${total} 款婴儿车标了自重。唯一没标的是一款 Baby Trend 车架，其重量字段被留成了零。`,
    ownRange: `自重从 ${weightMin} 到 ${weightMax} 磅——最轻的是可以甩上肩的伞车，最重的是全地形双座慢跑车。`,
    limitTitle: "标称承重才是稀罕数字",
    limitLead: `座椅能载多重的孩子在 ${d.totals.withWeightLimit} / ${total} 款上才有。`,
    limitCount: `只有 ${d.totals.withWeightLimit} / ${total} 款打印了承重，而且这三款都在 45 或 50 磅。其余 ${total - d.totals.withWeightLimit} 款把"上限"留空。`,
    limitGap: `因为 ${total - d.totals.withWeightLimit} 款都没标上限，所以"宝宝明年还坐得下吗"这个问题，从 listing 根本答不了。`,
    lightTitle: "轻量车之间的差异",
    lightLead: `轻，有两个口径，而且它们并不一致。`,
    lightCount: `${lightCount} 款实际重量在 15 磅或以下——这才是搬运与上飞机行李架真正要紧的数字。`,
    lightForm: `只有 ${formLight} 款在类型里标了"lightweight"，于是另有 ${lightCount - formLight} 款和那些标了名的车一样轻，却没挂这个词——类型标签和电子秤对不上。`,
    gapTitle: "重量问题会撞上的缺口",
    gapLead: `放在这里，是因为家长搬动时最关心的数字，恰恰是缺失的那个。`,
    gapLimit: `承重——${d.totals.withWeightLimit} / ${total} 款写明；真正决定何时停用的载重量，是这里最稀缺的重量。`,
    gapMissing: `有一款连自重都完全没标，所以连更易得的数字都不是 ${total} / ${total}。`,
    gapUnit: `单位——不同 listing 有的用磅、有的用公斤；这里都归一化为磅，原始字符串保留在数据集里。`,
    rosterTitle: "四十五款，按重量排",
    rosterLead: `按标明的自重排序；承重只在 listing 打印过时才显示。`,
    colBrand: "品牌",
    colModel: "型号",
    colType: "类型",
    colItem: "自重(磅)",
    colLimit: "承重(磅)",
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

export const kidsStrollerWeightColumns = (t: StrollerWeightStrings) => [
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
    key: "item",
    header: t.colItem,
    numeric: true,
    render: (r: never) => {
      const v = (r as SRow).itemWeightLb;
      return v == null ? t.notStated : `${v}`;
    },
  },
  {
    key: "limit",
    header: t.colLimit,
    numeric: true,
    render: (r: never) => {
      const v = (r as SRow).weightLimitLb;
      return v == null ? t.notStated : `${v}`;
    },
  },
];

export const kidsStrollerWeightVars = {
  total,
  withItemWeight: d.totals.withItemWeight,
  withWeightLimit: d.totals.withWeightLimit,
  weightMin,
  weightMax,
  lightCount,
  formLight,
  missingWeight,
};

export const kidsStrollerWeightIcons = {
  weight: Weight,
  scale: Scale,
  feather: Feather,
  gap: TriangleAlert,
  table: Table2,
};
