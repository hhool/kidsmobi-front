/**
 * /kids-scooter-size/ — will it fit, and will they grow into it.
 *
 * The sizing question for a scooter is not rider height the way it is for a
 * bike, it is deck height versus the child's feet, and whether the handlebar
 * travels. Which makes the central finding a gap: only 3 of 7 listings publish
 * a handlebar height at all, and the figure a buyer most needs — deck height,
 * the distance from the ground to where the child stands — is published by
 * NONE of them.
 *
 * The unit inconsistency is reported rather than smoothed: item weight arrives
 * as pounds for three listings and kilograms for three more, and wheel size as
 * inches for three and millimetres for two. Both are converted here, and the raw
 * string sits beside the converted one in the generated dataset.
 */
import { Ruler, Move3d, AlertTriangle, Table2 } from "lucide-react";
import { SCOOTER_DATASET } from "./scooterData.generated";
import { rosterLabel, type ScooterColumn } from "../components/ScooterAssetPage";

export { SCOOTER_DATASET };
export const KIDS_SCOOTER_SIZE_PATH = "/kids-scooter-size/";

const d = SCOOTER_DATASET;
const total = d.totals.kidsScooters;

/** Listings that publish a handlebar height, ascending. */
export const kidsScooterHandleHeights = () =>
  d.rows
    .filter((r) => r.handleHeightIn !== null)
    .map((r) => ({
      brand: rosterLabel(r),
      inches: r.handleHeightIn as number,
      raw: r.handleHeightRaw,
      adjustable: /adjustable/i.test(r.handlebarType || "") || /adjustable/i.test(r.specialFeature || ""),
    }))
    .sort((a, b) => a.inches - b.inches);

export interface ScooterSizeStrings {
  eyebrow: string;
  navLabel: string;
  h1: string;
  lead: string;
  handleTitle: string;
  handleLead: string;
  adjustTitle: string;
  adjustLead: string;
  gapTitle: string;
  gapLead: string;
  gapDeck: string;
  gapHandle: string;
  gapUnits: string;
  rosterTitle: string;
  rosterLead: string;
  colBrand: string;
  colModel: string;
  colHandle: string;
  colAdjustable: string;
  colWheel: string;
  colDeclaredLength: string;
  notStated: string;
  yes: string;
  methodTitle: string;
  methodBody: string[];
}

export const kidsScooterSizeStrings: Record<"en" | "zh", ScooterSizeStrings> = {
  en: {
    eyebrow: "Plan-B asset · sizing",
    navLabel: "Sizing and fit",
    h1: `Kids Scooter Size: Handlebar Heights, ${total} Listings`,
    lead: `A scooter has to fit twice: the child's feet have to reach the deck from the ground, and their hands have to reach the bar. Of the ${total} kids' kick scooters here, ${d.totals.withHandleHeight} publish a handlebar height, ${d.totals.withWheelSize} publish a wheel size, and none publish a deck height — the one measurement that decides whether a toddler can stand on it unaided.`,
    handleTitle: `The ${d.totals.withHandleHeight} listings that give a handlebar height`,
    handleLead: `Handlebar heights span a narrow band, and all three sit near the same figure, which suggests the category has settled on one adult-relative bar height rather than sizing deliberately for a child's stature. Two of the three state that the bar adjusts; the third also lists adjustable handlebar height as a feature but does not give the measurement.`,
    adjustTitle: "Handlebars that move",
    adjustLead: `An adjustable bar is what lets one scooter cover a growth spurt, and it is the most commonly claimed feature in this set: ${d.rows.filter((r) => /adjustable/i.test(r.specialFeature || "")).length} of ${total} listings mention an adjustable handlebar somewhere in their feature text. Only ${d.totals.withHandleHeight} put a number on it. A claim without a measurement cannot be checked against a child's reach.`,
    gapTitle: "Three figures that would settle the question",
    gapLead: `These are the gaps, stated first because a buyer working from this catalogue cannot close them from the listings alone.`,
    gapDeck: `Deck height — published by 0 of ${total}. Without it there is no way to know whether a two-year-old can reach the footboard from the ground, which is the whole difficulty of learning to stand on a scooter.`,
    gapHandle: `Handlebar height — published by ${d.totals.withHandleHeight} of ${total}. The ${total - d.totals.withHandleHeight} listings without it include both three-wheel scooters aimed at toddlers and the priciest two-wheel model in the set.`,
    gapUnits: `Units — item weight arrives in kilograms for ${d.units.itemWeightKgRows} listings and pounds for ${d.units.itemWeightLbRows}; wheel size in millimetres for ${d.units.wheelSizeMmRows} and inches for ${d.units.wheelSizeInRows}. Everything on this page is converted to inches and pounds, and the raw string for each listing is kept alongside it.`,
    rosterTitle: "Sizing figures as published",
    rosterLead: `Handlebar height and wheel size in inches; overall length as each listing states it. A blank means the listing does not carry that measurement.`,
    colBrand: "Brand",
    colModel: "Model",
    colHandle: "Handlebar height",
    colAdjustable: "Adjustable",
    colWheel: "Wheel size",
    colDeclaredLength: "Overall L×W×H",
    notStated: "not stated",
    yes: "yes",
    methodTitle: "How the measurements were normalised",
    methodBody: [
      `Source: the CMS product snapshot filtered to categoryId "scooters" and to the listings Stage 1 kept — ${total} published listings.`,
      `Lengths are converted to inches and weights to pounds using the unit word in each raw string. A value whose unit cannot be read is left unstated rather than assumed; the raw string is retained in src/data/scooterData.generated.ts for checking.`,
      `Overall dimensions are shown as published, which means they mix decimal inches with rounded inches and are not adjusted for the unit difference.`,
      `Adjustable is counted only where the listing's own text says the handlebar adjusts. No measurement was taken and no figure was interpolated.`,
    ],
  },
  zh: {
    eyebrow: "Plan-B 资产页 · 尺寸适配",
    navLabel: "尺寸与适配",
    h1: `童车滑板车尺寸：把手高度，${total} 款 listing`,
    lead: `滑板车要同时适配两点：孩子的脚要能从地面踩上踏板，手要够得着车把。在这里的 ${total} 款童用滑板车中，${d.totals.withHandleHeight} 款公布了把手高度、${d.totals.withWheelSize} 款公布了轮径，而踏板高度一款都没有——恰恰是这个数字决定幼儿能否自己站上去。`,
    handleTitle: `公布了把手高度的 ${d.totals.withHandleHeight} 款`,
    handleLead: `把手高度集中在很窄的区间内，三款都落在同一个数值附近，说明这个类目已经默认了一个偏成人参照的车把高度，而不是针对孩子身高做尺寸设计。其中两款写明车把可调；第三款虽然把"可调车把"列为卖点，却没给数值。`,
    adjustTitle: "可以调的���把",
    adjustLead: `可调车把是让一台滑板车"用几年"的关键，也是这组数据里最常出现的卖点：${total} 款里有 ${d.rows.filter((r) => /adjustable/i.test(r.specialFeature || "")).length} 款在卖点文字里提到了把手高度可调。但只有 ${d.totals.withHandleHeight} 款给了数值。只有口号没有尺寸的卖点，无法拿来核对孩子的够得着的高度。`,
    gapTitle: "三个本可以定论的数字",
    gapLead: `缺口先说在前面——只靠这份产品目录，买家无法自行补上。`,
    gapDeck: `踏板高度——${total} 款中0 款公布。没有它就无法判断两岁孩子能否从地面踩上踏板，而这正是学站滑板车最难的那一步。`,
    gapHandle: `把手高度——${total} 款中 ${d.totals.withHandleHeight} 款公布。没公布的这 ${total - d.totals.withHandleHeight} 款里，既包括面向幼儿的三轮车，也包括本组最贵的两轮车型。`,
    gapUnits: `单位——商品重量有 ${d.units.itemWeightKgRows} 款用公斤、${d.units.itemWeightLbRows} 款用磅；轮径有 ${d.units.wheelSizeMmRows} 款用毫米、${d.units.wheelSizeInRows} 款用英寸。本页统一换算为英寸和磅，每条的原始字符串都保留在旁边。`,
    rosterTitle: "各 listing 公布的尺寸",
    rosterLead: `把手高度与轮径统一为英寸；整体尺寸按各 listing 原样呈现。空白表示该 listing 没有这个尺寸。`,
    colBrand: "品牌",
    colModel: "型号",
    colHandle: "把手高度",
    colAdjustable: "可调",
    colWheel: "轮径",
    colDeclaredLength: "整体 长×宽×高",
    notStated: "未说明",
    yes: "是",
    methodTitle: "尺寸是怎么归一化的",
    methodBody: [
      `数据源：CMS 产品快照筛选 categoryId 为 "scooters" 并只保留阶段一保留的 listing，共 ${total} 款。`,
      `长度按各原始字符串里的单位字样换算为英寸，重量换算为磅。单位读不出来的值留空而不做假设；原始字符串保留在 src/data/scooterData.generated.ts 里可复核。`,
      `整体尺寸按各 listing 原文呈现，因此其中混有小数英寸与取整英寸，未因单位差异做调整。`,
      `"可调"只在 listing 自己的文字提到车把可调时才计入。全程没有实测，也没有插值补全任何数值。`,
    ],
  },
};

export const kidsScooterSizeColumns = (t: ScooterSizeStrings): ScooterColumn[] => [
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
    key: "handle",
    header: t.colHandle,
    numeric: true,
    render: (r: never) => {
      const v = (r as { handleHeightIn?: number | null }).handleHeightIn;
      return v === null || v === undefined ? t.notStated : `${v} in`;
    },
  },
  {
    key: "adjustable",
    header: t.colAdjustable,
    render: (r: never) =>
      /adjustable/i.test(
        `${(r as { specialFeature?: string }).specialFeature || ""} ${(r as { handlebarType?: string }).handlebarType || ""}`
      )
        ? t.yes
        : t.notStated,
  },
  {
    key: "wheel",
    header: t.colWheel,
    numeric: true,
    render: (r: never) => {
      const v = (r as { wheelSizeIn?: number | null }).wheelSizeIn;
      return v === null || v === undefined ? t.notStated : `${v} in`;
    },
  },
  {
    key: "dims",
    header: t.colDeclaredLength,
    render: (r: never) =>
      (r as { productDimensions?: string }).productDimensions || t.notStated,
  },
];

export const kidsScooterSizeVars = {
  total,
  withHandle: d.totals.withHandleHeight,
  withWheel: d.totals.withWheelSize,
};

export const kidsScooterSizeIcons = { ruler: Ruler, move: Move3d, gap: AlertTriangle, table: Table2 };