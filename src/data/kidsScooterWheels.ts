/**
 * /kids-scooter-wheels/ — two wheels or three.
 *
 * The first kids' scooter page because wheel count is the decision that actually
 * splits this category: a 2-wheel kick scooter is steered by body weight and
 * needs balance, a 3-wheel scooter stands up on its own and is steered by
 * leaning. Everything else on these pages is a spec detail; this one changes
 * which child the product is for.
 *
 * The honest finding is the split itself: 3 of 7 are two-wheel, 3 of 7 are
 * three-wheel, and 1 states no wheel count at all despite being a scooter. That
 * last row matters — a buyer filtering by "3 wheels for a beginner" would lose
 * the Campior Green Mini, whose own product name says "3 Wheel Scooter" while
 * the structured Number of Wheels field is empty. The page reports both.
 */
import { CircleDot, Split, AlertTriangle, Bike } from "lucide-react";
import { SCOOTER_DATASET } from "./scooterData.generated";
import { rosterLabel, type ScooterColumn } from "../components/ScooterAssetPage";

export { SCOOTER_DATASET };
export const KIDS_SCOOTER_WHEELS_PATH = "/kids-scooter-wheels/";

const d = SCOOTER_DATASET;
const total = d.totals.kidsScooters;

export interface ScooterWheelsStrings {
  eyebrow: string;
  navLabel: string;
  h1: string;
  lead: string;
  splitTitle: string;
  splitLead: string;
  twoTitle: string;
  twoLead: string;
  threeTitle: string;
  threeLead: string;
  gapTitle: string;
  gapLead: string;
  gapWheelCount: string;
  gapBrake: string;
  gapSuspension: string;
  rosterTitle: string;
  rosterLead: string;
  colBrand: string;
  colModel: string;
  colWheels: string;
  colWheelSize: string;
  colBrake: string;
  colLimit: string;
  notStated: string;
  methodTitle: string;
  methodBody: string[];
}

export const kidsScooterWheelsStrings: Record<"en" | "zh", ScooterWheelsStrings> = {
  en: {
    eyebrow: "Plan-B asset · wheel layout",
    navLabel: "Two or three wheels",
    h1: `Kids Scooter Wheels: 2-Wheel vs 3-Wheel, ${total} on Record`,
    lead: `A kick scooter's wheel count decides who can ride it. Two wheels means the rider steers with body weight and balances it alone; three wheels means the deck stands up on its own and the rider leans to turn. Of the ${total} kids' kick scooters this site publishes, ${d.wheels.two} are two-wheel, ${d.wheels.three} are three-wheel, and ${d.wheels.unstated} records no wheel count at all.`,
    splitTitle: "How the ${total} split",
    splitLead: `Half the catalogue each way, which is unusual for a category that usually skews one way. The three-wheel group is also the cheaper half: every three-wheel scooter here sits at the lower end of the price range, while the dearest listing is a two-wheel model.`,
    twoTitle: `The ${d.wheels.two} two-wheel scooters`,
    twoLead: `Balance is the skill being learned, so a two-wheel scooter suits a child who can already walk steadily and is willing to spend time falling over. Two of the ${d.wheels.two} list a rear brake; the third lists neither a brake nor a suspension type. Only ${d.totals.withHandleHeight} of all ${total} listings publish a handlebar height, and for this group it is ${d.rows.filter((r) => r.wheelCount === 2 && r.handleHeightIn !== null).length}.`,
    threeTitle: `The ${d.wheels.three} three-wheel scooters`,
    threeLead: `The deck is supported at both ends, so a three-wheel scooter is the common first scooter for a child too young to balance. All ${d.wheels.three} of them state a rear brake. Two are also labelled for toddlers, and one advertises front suspension where the two-wheel group has rigid or rear suspension.`,
    gapTitle: "What the listings leave out",
    gapLead: `Two figures a buyer would want before choosing are missing from most of these records.`,
    gapWheelCount: `Wheel count — ${d.totals.kidsScooters - d.wheels.unstated} of ${total} state it. The ${d.wheels.unstated} that does not is the Campior Green Mini, whose product name says "3 Wheel Scooter" while its structured field is empty.`,
    gapBrake: `Brake style — ${d.totals.withBrakeStyle} of ${total} name a braking system, all of them rear braking. No listing in this catalogue states a hand brake or a brake on the front wheel.`,
    gapSuspension: `Suspension — ${d.totals.withSuspension} of ${total} state it: one front suspension, one rear suspension, the rest rigid.`,
    rosterTitle: "Every scooter in the count",
    rosterLead: `Sorted by price. Wheel size is shown in inches, converted from the millimetre and inch figures the listings use inconsistently.`,
    colBrand: "Brand",
    colModel: "Model",
    colWheels: "Wheels",
    colWheelSize: "Wheel size",
    colBrake: "Brake",
    colLimit: "Rider limit",
    notStated: "not stated",
    methodTitle: "How these counts were made",
    methodBody: [
      `Source: the CMS product snapshot the site builds from, filtered to categoryId "scooters" and to the listings Stage 1 kept. ${total} published listings qualify.`,
      `Wheel count is read from Number of Wheels in the specification record, which is the retailer's own structured field rather than our classification. Where it is empty the listing is counted as unstated, not guessed from the product name.`,
      `Wheel sizes arrive in inches and millimetres in the same column and are converted to inches here; the raw string for each is kept in the generated dataset so the conversion can be checked.`,
      `Wheel counts are as the retailer states them. Nothing here is tested, measured, or independently verified.`,
    ],
  },
  zh: {
    eyebrow: "Plan-B 资产页 · 轮组结构",
    navLabel: "两轮还是三轮",
    h1: `童车滑板车轮数：两轮 vs 三轮，${total} 款在售`,
    lead: `轮数决定了谁能骑。两轮滑板车靠身体重心转向、需要自己保持平衡；三轮滑板车车身能自己站住、靠倾斜转向。本站在售的 ${total} 款童用滑板车中，${d.wheels.two} 款两轮、${d.wheels.three} 款三轮，另有 ${d.wheels.unstated} 款完全没有公布轮数。`,
    splitTitle: `${total} 款是怎么分的`,
    splitLead: `两类几乎各占一半，这在滑板车类目里并不常见（通常会明显偏向其中一种）。三轮那组也正好是便宜的那一组：三轮款全部落在价格区间低端，而最贵的一款是两轮。`,
    twoTitle: `${d.wheels.two} 款两轮滑板车`,
    twoLead: `平衡本身就是要练的技能，所以两轮更适合已经能走稳、并且愿意多摔几跤的孩子。${d.wheels.two} 款中有两款写了后刹；第三款既没写刹车也没写避震类型。全部 ${total} 款里只有 ${d.totals.withHandleHeight} 款公布了把手高度，这一组里是 ${d.rows.filter((r) => r.wheelCount === 2 && r.handleHeightIn !== null).length} 款。`,
    threeTitle: `${d.wheels.three} 款三轮滑板车`,
    threeLead: `车身两端都有支撑，所以三轮通常是还平衡不好的孩子的第一台滑板车。${d.wheels.three} 款全部写了后刹。其中两款还标注适用幼儿年龄段，一款带前避震——而两轮那组是刚性或后避震。`,
    gapTitle: "listing 没有说明的部分",
    gapLead: `有两个数字是买家下手前想看、但多数记录里没有的。`,
    gapWheelCount: `轮数——${total} 款里有 ${d.totals.kidsScooters - d.wheels.unstated} 款写了。那 ${d.wheels.unstated} 款没写的是 Campior Green Mini：它的商品名叫 "3 Wheel Scooter"，但结构化字段是空的。`,
    gapBrake: `刹车形式——${total} 款里有 ${d.totals.withBrakeStyle} 款写了，而且全是后刹。本品类没有任何一款写了手刹或前轮刹车。`,
    gapSuspension: `避震——${total} 款里有 ${d.totals.withSuspension} 款写了：一款前避震、一款后避震，其余为刚性。`,
    rosterTitle: "被计入的每一款滑板车",
    rosterLead: `按价格排序。轮径统一换算成英寸——原始 listing 里英寸和毫米混用。`,
    colBrand: "品牌",
    colModel: "型号",
    colWheels: "轮数",
    colWheelSize: "轮径",
    colBrake: "刹车",
    colLimit: "承重上限",
    notStated: "未说明",
    methodTitle: "这些计数是怎么来的",
    methodBody: [
      `数据源：站点构建所用的 CMS 产品快照，筛选 categoryId 为 "scooters" 并只保留阶段一保留的 listing，共 ${total} 款。`,
      `轮数读取自规格记录里的 Number of Wheels，这是零售商自己的结构化字段，而不是我们的归类。该字段为空时计为"未说明"，不会根据商品名去猜。`,
      `轮径在同一列里混用英寸和毫米，这里统一换算为英寸；每条的原始字符串都保留在生成的数据集里，换算可以复核。`,
      `轮数以零售商声明为准。本页没有任何内容经过实测或独立核验。`,
    ],
  },
};

/** Roster columns. Wheel count is the page's subject, so it leads. */
export const kidsScooterWheelsColumns = (t: ScooterWheelsStrings): ScooterColumn[] => [
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
    key: "wheels",
    header: t.colWheels,
    numeric: true,
    render: (r: never) => {
      const n = (r as { wheelCount?: number | null }).wheelCount;
      return n === null || n === undefined ? t.notStated : String(n);
    },
  },
  {
    key: "wheelSize",
    header: t.colWheelSize,
    numeric: true,
    render: (r: never) => {
      const v = (r as { wheelSizeIn?: number | null }).wheelSizeIn;
      return v === null || v === undefined ? t.notStated : `${v} in`;
    },
  },
  {
    key: "brake",
    header: t.colBrake,
    render: (r: never) => (r as { brakeStyle?: string }).brakeStyle || t.notStated,
  },
  {
    key: "limit",
    header: t.colLimit,
    numeric: true,
    render: (r: never) => {
      const v = (r as { weightLimitLb?: number | null }).weightLimitLb;
      return v === null || v === undefined ? t.notStated : `${v} lb`;
    },
  },
];

/** Vars consumed by fillTemplate in the page component. */
export const kidsScooterWheelsVars = {
  total,
  two: d.wheels.two,
  three: d.wheels.three,
  unstated: d.wheels.unstated,
};

export const kidsScooterWheelsIcons = {
  split: Split,
  two: CircleDot,
  three: Bike,
  gap: AlertTriangle,
};