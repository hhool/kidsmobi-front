/**
 * /kids-scooter-weight/ — two different weights, routinely confused.
 *
 * A scooter listing carries two weights that mean opposite things and are
 * published under similar keys: the weight of the scooter itself (how heavy it
 * is to carry up stairs), and the weight of the rider it will hold (how long it
 * lasts before something bends). 6 of 7 listings state both, and the spread
 * between the lightest and heaviest rider limit is wide enough to be the page.
 *
 * The reason this page exists rather than folding weight into the size page is
 * that the numbers here are about the CHILD, and the child is the one the
 * retailer knows least about: only 2 of 7 labels carry a usable age figure.
 */
import { Weight, Gauge, AlertTriangle, Table2 } from "lucide-react";
import { SCOOTER_DATASET } from "./scooterData.generated";
import { rosterLabel, type ScooterColumn } from "../components/ScooterAssetPage";

export { SCOOTER_DATASET };
export const KIDS_SCOOTER_WEIGHT_PATH = "/kids-scooter-weight/";

const d = SCOOTER_DATASET;
const total = d.totals.kidsScooters;

const withWeight = d.rows.filter((r) => r.itemWeightLb !== null);
const withLimit = d.rows.filter((r) => r.weightLimitLb !== null);

const lightest = [...withWeight].sort((a, b) => (a.itemWeightLb as number) - (b.itemWeightLb as number))[0];
const heaviest = [...withWeight].sort((a, b) => (b.itemWeightLb as number) - (a.itemWeightLb as number))[0];
const minLimit = withLimit.reduce((m, r) => Math.min(m, r.weightLimitLb as number), Infinity);
const maxLimit = withLimit.reduce((m, r) => Math.max(m, r.weightLimitLb as number), 0);

/** Do the scooter weight and its rider limit move together? They do not. */
export const kidsScooterWeightSpread = () => ({
  lightestLb: lightest?.itemWeightLb ?? null,
  lightestBrand: lightest?.brand || lightest?.name || "",
  heaviestLb: heaviest?.itemWeightLb ?? null,
  heaviestBrand: heaviest?.brand || heaviest?.name || "",
  minLimitLb: Number.isFinite(minLimit) ? minLimit : null,
  maxLimitLb: maxLimit || null,
});

export interface ScooterWeightStrings {
  eyebrow: string;
  navLabel: string;
  h1: string;
  lead: string;
  ownTitle: string;
  ownLead: string;
  limitTitle: string;
  limitLead: string;
  gapTitle: string;
  gapLead: string;
  gapAge: string;
  gapUnits: string;
  gapMissing: string;
  rosterTitle: string;
  rosterLead: string;
  colBrand: string;
  colModel: string;
  colOwnWeight: string;
  colRiderLimit: string;
  colDeclared: string;
  notStated: string;
  methodTitle: string;
  methodBody: string[];
}

export const kidsScooterWeightStrings: Record<"en" | "zh", ScooterWeightStrings> = {
  en: {
    eyebrow: "Plan-B asset · weight",
    navLabel: "Weight and rider limits",
    h1: `Kids Scooter Weight: ${withWeight.length} Listed, ${withLimit.length} Rider Limits`,
    lead: `Two weights travel with every kick scooter listing and they are not the same number. One is how much the scooter weighs; the other is how much rider it is rated for. Of the ${total} kids' kick scooters here, ${withWeight.length} publish their own weight and ${withLimit.length} publish a rider limit. A scooter that weighs 6 pounds and holds 240 pounds is not a contradiction — it is a scooter intended for a much older child than the one who would struggle to lift it.`,
    ownTitle: "How heavy the scooters are",
    ownLead: `The seven listings that state a weight fall in a narrow band, which is what you would expect when every one of them is a small aluminium or plastic deck. The two figures that do not fit are worth naming: the heaviest scooter here is also one of the two cheapest, and the WAYPLUS KS1 — the most expensive listing in the set — publishes no weight at all.`,
    limitTitle: "How much rider they are rated for",
    limitLead: `The rider limits do not line up with the weights. The lowest limit in the set is 110 pounds and the highest is 240 pounds, and the 240-pound scooter is the same model as the 6-plus two-wheeler, not a heavy-duty adult product. A limit this far above what a four-year-old weighs mostly indicates that the manufacturer sized the frame for the rider who will be using it in five years.`,
    gapTitle: "What the weights cannot tell you",
    gapLead: `Weight is the figure a parent can measure at home. These are the cases where it does not settle the question.`,
    gapAge: `Rider weight is not age. Only 2 of the ${total} listings carry a label with a usable number in it — "2 years old+ Kids" and "Age6+" — and neither gives an upper bound. The other five are labelled "Toddler", "Kid", "Little Kid" or "Youth", which are marketing words with no age attached.`,
    gapUnits: `Units are mixed in the source. ${d.units.itemWeightKgRows} listings state weight in kilograms and ${d.units.itemWeightLbRows} in pounds. Converted, the heaviest scooter in this set (${heaviest?.itemWeightLb} lb) is less than twice the lightest (${lightest?.itemWeightLb} lb) — a gap that a reader comparing "6" against "4.08" as raw numbers would get wrong.`,
    gapMissing: `The priciest listing states no weight of its own. A shopper carrying a scooter up a flight of stairs has to find that figure elsewhere, or ask.`,
    rosterTitle: "Both weights, side by side",
    rosterLead: `Own weight converted to pounds; rider limit as published. The declared column shows the unit the retailer used, so the mixed units stay visible.`,
    colBrand: "Brand",
    colModel: "Model",
    colOwnWeight: "Scooter weight",
    colRiderLimit: "Rider limit",
    colDeclared: "Declared as",
    notStated: "not stated",
    methodTitle: "Where the two weights come from",
    methodBody: [
      `Source: the CMS product snapshot filtered to categoryId "scooters" and to the listings Stage 1 keeps — ${total} published listings.`,
      `Own weight is read from Item Weight in the Measurements record and converted to pounds from the unit word in the same string. Rider limit is read from Weight Limit, or Weight Capacity Maximum where that is the only key present; the two fields agree wherever both exist.`,
      `The two weights are reported as separate columns and never combined into a single figure. A rider limit is a manufacturer's rating, not a measurement of this catalogue's products.`,
      `Nothing here was weighed or load-tested. Both numbers are the retailer's own claims.`,
    ],
  },
  zh: {
    eyebrow: "Plan-B 资产页 · 重量",
    navLabel: "重量与承重",
    h1: `童车滑板车重量：${withWeight.length} 款有自重，${withLimit.length} 款有承重`,
    lead: `每条滑板车listing 都带两个重量，含义完全不同：一斤是车本身有多重，另一斤是它能承载多重的骑手。在这里的 ${total} 款童用滑板车中，${withWeight.length} 款公布了自重，${withLimit.length} 款公布了承重。一台自重 6 磅、能载 240 磅的滑板车并不矛盾——它是为比"搬它上楼很费劲"的那个孩子大得多的骑手准备的。`,
    ownTitle: "这些滑板车本身有多重",
    ownLead: `公布了重量的几款都落在一个很窄的区间里，这符合预期——它们全都是小型铝合金或塑料踏板。其中两个数字值得单独指出：最重的那款同时也是最便宜的两款之一；而全组最贵的 WAYPLUS KS1 根本没有公布重量。`,
    limitTitle: "它们标称能承载多重",
    limitLead: `承重与自重并不对应。本组最低承重 110 磅、最高 240 磅，而 240 磅那台正是 6 岁以上两轮款，不是成人重型产品。这种远高于四五岁儿童体重的限重，更多说明厂家把车架按"五年后骑它的人"来设计。`,
    gapTitle: "重量数字回答不了的问题",
    gapLead: `重量是家长在家能自己称的数字。以下这些情况，它解决不了问题。`,
    gapAge: `骑手体重不等于年龄。${total} 款里只有 2 款带了可用的数字标签——"2 years old+ Kids" 和 "Age6+"——而且都没有上限。另外五款写的是 "Toddler"、"Kid"、"Little Kid"、"Youth"，都是不带年龄的营销词。`,
    gapUnits: `源数据单位不统一。${d.units.itemWeightKgRows} 款用公斤、${d.units.itemWeightLbRows} 款用磅。换算后本组最重的滑板车（${heaviest?.itemWeightLb} 磅）不到最轻那款（${lightest?.itemWeightLb} 磅）的两倍——如果直接把 "6" 和 "4.08" 当数字比较，就会得出错误结论。`,
    gapMissing: `最贵的那款没有公布自重。要把滑板车搬上楼梯的买家，只能另找数据或去问商家。`,
    rosterTitle: "两个重量并排看",
    rosterLead: `自重统一换算为磅；承重按原文呈现。"原始写法"一列显示零售商实际使用的单位，让混用单位保持可见。`,
    colBrand: "品牌",
    colModel: "型号",
    colOwnWeight: "车身自重",
    colRiderLimit: "承重上限",
    colDeclared: "原始写法",
    notStated: "未说明",
    methodTitle: "两个重量分别来自哪里",
    methodBody: [
      `数据源：CMS 产品快照筛选 categoryId 为 "scooters" 并只保留阶段一保留的 listing，共 ${total} 款。`,
      `自重读取自 Measurements 记录里的 Item Weight，并按同一字符串中的单位字样换算为磅。承重优先读 Weight Limit，仅有 Weight Capacity Maximum 时读后者；两个字段同时存在时数值一致。`,
      `两个重量分列呈现，绝不合并成一个数字。承重是厂家标称值，不是对本目录产品的实测。`,
      `本页没有做过称重或承载测试。两个数字都是零售商自己的声明。`,
    ],
  },
};

export const kidsScooterWeightColumns = (t: ScooterWeightStrings): ScooterColumn[] => [
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
    key: "own",
    header: t.colOwnWeight,
    numeric: true,
    render: (r: never) => {
      const v = (r as { itemWeightLb?: number | null }).itemWeightLb;
      return v === null || v === undefined ? t.notStated : `${v} lb`;
    },
  },
  {
    key: "limit",
    header: t.colRiderLimit,
    numeric: true,
    render: (r: never) => {
      const v = (r as { weightLimitLb?: number | null }).weightLimitLb;
      return v === null || v === undefined ? t.notStated : `${v} lb`;
    },
  },
  {
    key: "declared",
    header: t.colDeclared,
    render: (r: never) => (r as { itemWeightRaw?: string }).itemWeightRaw || t.notStated,
  },
];

export const kidsScooterWeightVars = {
  total,
  withWeight: withWeight.length,
  withLimit: withLimit.length,
  ...kidsScooterWeightSpread(),
};

export const kidsScooterWeightIcons = { weight: Weight, gauge: Gauge, gap: AlertTriangle, table: Table2 };