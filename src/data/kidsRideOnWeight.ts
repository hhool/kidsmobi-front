/**
 * /kids-ride-on-weight/ — the car's own weight against the rider it is rated for.
 *
 * This is where the ride-on category differs from every other wheeled toy on
 * this site, and the difference is worth stating in the first line: a balance
 * bike or a scooter is carried by a child, while a ride-on car is a vehicle
 * that a child sits inside. The car's weight is therefore not the child's
 * problem — it is the parent's, because somebody has to lift it, drag it to
 * the charger, and store it.
 *
 * The finding is the ratio, not the weight. Nine of the 15 listings publish
 * both figures, and among those nine the spread between them runs from 1.07 to
 * 10.89. The tightest is the ANPABO S323, a 60.63 lb car with a 65 lb rider
 * limit: a margin of 4.37 lb, so a 60 lb child is already at the edge of the
 * published rating. The widest multiple is the FanttikRide N7 Pro, a 13.78 lb
 * car rated for 150 lb. The widest margin in pounds is a different machine
 * again — the LIGIANT R9, 70 lb against a 264 lb limit, a 194 lb gap but a
 * ratio of only 3.77 — which is why the page names all three rather than
 * collapsing them into one "widest". A buyer reading "132 lb weight capacity"
 * on a box has no way to know which of those they are looking at unless the
 * car's own weight is published next to it — and for 4 of the 15 it is not.
 *
 * Coverage splits awkwardly too: 11 listings publish a car weight, 13 publish
 * a rider limit, and only 9 publish both. Four publish a limit with no weight
 * and two publish a weight with no limit. Every one of those six rows still
 * appears in the table, with the missing half shown as not stated.
 */
import { Scale, Users, AlertTriangle, Table2 } from "lucide-react";
import { RIDE_ON_DATASET } from "./rideOnData.generated";
import { rideOnLabel, type RideOnColumn } from "../components/RideOnAssetPage";

export { RIDE_ON_DATASET };
export const KIDS_RIDE_ON_WEIGHT_PATH = "/kids-ride-on-weight/";

const d = RIDE_ON_DATASET;
const total = d.totals.rideOnCars;

/**
 * Listings that publish both a car weight and a rider limit, with the margin
 * between them. The margin is the honest comparison: a 65 lb limit on a 60 lb
 * car is a different proposition from a 150 lb limit on a 13 lb car.
 */
export const kidsRideOnWeightPairs = () =>
  d.rows
    .filter((r) => r.itemWeightLb !== null && r.weightLimitLb !== null)
    .map((r) => ({
      id: r.id,
      label: rideOnLabel(r),
      carLb: r.itemWeightLb as number,
      limitLb: r.weightLimitLb as number,
      marginLb: +((r.weightLimitLb as number) - (r.itemWeightLb as number)).toFixed(2),
      ratio: +((r.weightLimitLb as number) / (r.itemWeightLb as number)).toFixed(2),
      voltage: r.voltage,
    }))
    .sort((a, b) => a.marginLb - b.marginLb);

/**
 * The listing with the widest margin, and the one with the widest RATIO.
 * These are not the same machine: a 264 lb limit on a 70 lb car gives the
 * biggest absolute margin, while a 150 lb limit on a 13.78 lb car gives the
 * biggest multiple. Both are worth naming, and conflating them would be wrong.
 */
export const kidsRideOnWeightExtremes = () => {
  const pairs = kidsRideOnWeightPairs();
  const widestMargin = [...pairs].sort((a, b) => b.marginLb - a.marginLb)[0];
  const widestRatio = [...pairs].sort((a, b) => b.ratio - a.ratio)[0];
  const tightest = pairs[0];
  const ratios = pairs.map((p) => p.ratio);
  return {
    tightest,
    widestMargin,
    widestRatio,
    minRatio: Math.min(...ratios),
    maxRatio: Math.max(...ratios),
    /** Second-widest ratio — the runner-up worth naming so the top figure is not read as a field of one. */
    secondWidestRatio: [...pairs].sort((a, b) => b.ratio - a.ratio)[1],
  };
};

/** Listings that publish only one of the two numbers. */
export const kidsRideOnWeightHalves = () => ({
  weightOnly: d.rows
    .filter((r) => r.itemWeightLb !== null && r.weightLimitLb === null)
    .map((r) => ({ label: rideOnLabel(r), carLb: r.itemWeightLb as number })),
  limitOnly: d.rows
    .filter((r) => r.itemWeightLb === null && r.weightLimitLb !== null)
    .map((r) => ({ label: rideOnLabel(r), limitLb: r.weightLimitLb as number })),
});

export interface RideOnWeightStrings {
  eyebrow: string;
  navLabel: string;
  h1: string;
  lead: string;
  ownTitle: string;
  ownLead: string;
  ratioTitle: string;
  ratioLead: string;
  ratioTight: string;
  ratioWide: string;
  gapTitle: string;
  gapLead: string;
  gapPairs: string;
  gapHalves: string;
  gapUnits: string;
  gapStorage: string;
  rosterTitle: string;
  rosterLead: string;
  colBrand: string;
  colModel: string;
  colCarWeight: string;
  colLimit: string;
  colMargin: string;
  notStated: string;
  methodTitle: string;
  methodBody: string[];
}

export const kidsRideOnWeightStrings: Record<"en" | "zh", RideOnWeightStrings> = {
  en: {
    eyebrow: "Plan-B asset · weight and load",
    navLabel: "Weight and load",
    h1: `Kids Ride-On Weight: Car Weight Against Rider Limits, ${total} Cars`,
    lead: `A ride-on car is the only wheeled toy on this site where the child's weight is not the last number on the spec sheet. Somebody has to lift the car onto a charger and drag it back into a garage, and the machine itself has to hold the child up. Of the ${total} cars published here, ${d.totals.withItemWeight} state what the car weighs, ${d.totals.withWeightLimit} state the rider it is rated for, and only ${d.totals.withItemWeight - kidsRideOnWeightHalves().weightOnly.length} publish both — which is the only way to judge whether the two numbers leave room for a real child.`,
    ownTitle: "How heavy these cars are",
    ownLead: `Car weights run from ${Math.min(...d.rows.filter((r) => r.itemWeightLb !== null).map((r) => r.itemWeightLb as number))} lb to ${Math.max(...d.rows.filter((r) => r.itemWeightLb !== null).map((r) => r.itemWeightLb as number))} lb. Three of the four heaviest are 24V machines, and the heaviest of all is a four-seat golf cart with a roof at 70 lb — a vehicle that no child could move and that a parent may struggle to lift into a car. All ${d.totals.withItemWeight} weights arrive in pounds; not one listing in this set states a weight in kilograms.`,
    ratioTitle: "The ratio between the two numbers",
    ratioLead: `Where both figures exist, the interesting quantity is not either one but the distance between them. Among the ${kidsRideOnWeightPairs().length} listings that publish both, that ratio ranges from ${kidsRideOnWeightExtremes().minRatio} to ${kidsRideOnWeightExtremes().maxRatio}. A rating of "150 lb" is uninformative on its own; a rating of "150 lb" on a 13.78 lb car is a very different promise from "65 lb" on a 60.63 lb one.`,
    ratioTight: `Tightest — the ${kidsRideOnWeightExtremes().tightest.label}, a ${kidsRideOnWeightExtremes().tightest.carLb} lb car rated for a ${kidsRideOnWeightExtremes().tightest.limitLb} lb rider. The margin is ${kidsRideOnWeightExtremes().tightest.marginLb} lb, and the ratio ${kidsRideOnWeightExtremes().tightest.ratio}. Any child above about 60 lb is at or beyond the published limit of this machine, and the same listing says the two seats are rated for 130 lb in total. That figure is for the vehicle's combined load, not for one rider.`,
    ratioWide: `Widest by multiple — the ${kidsRideOnWeightExtremes().widestRatio.label}, a ${kidsRideOnWeightExtremes().widestRatio.carLb} lb car rated for ${kidsRideOnWeightExtremes().widestRatio.limitLb} lb, a ratio of ${kidsRideOnWeightExtremes().widestRatio.ratio} and a margin of ${kidsRideOnWeightExtremes().widestRatio.marginLb} lb. The runner-up is the ${kidsRideOnWeightExtremes().secondWidestRatio.label} at ${kidsRideOnWeightExtremes().secondWidestRatio.ratio}, a ${kidsRideOnWeightExtremes().secondWidestRatio.carLb} lb car rated for ${kidsRideOnWeightExtremes().secondWidestRatio.limitLb} lb. The widest margin in pounds is a third machine again: the ${kidsRideOnWeightExtremes().widestMargin.label}, whose ${kidsRideOnWeightExtremes().widestMargin.marginLb} lb gap comes from a ${kidsRideOnWeightExtremes().widestMargin.limitLb} lb limit on a ${kidsRideOnWeightExtremes().widestMargin.carLb} lb car — a ratio of only ${kidsRideOnWeightExtremes().widestMargin.ratio}. Margin and multiple are different questions, and this category answers them with different machines.`,
    gapTitle: "Four gaps a buyer cannot close from this catalogue",
    gapLead: `Each of these is a number the listings leave out, and each one changes what a parent can plan.`,
    gapPairs: `Both numbers — ${kidsRideOnWeightPairs().length} of ${total} listings publish a car weight and a rider limit together. The other ${total - kidsRideOnWeightPairs().length} publish one or the other, so for those rows the ratio cannot be computed at all.`,
    gapHalves: `One-sided entries — ${kidsRideOnWeightHalves().limitOnly.length} listings state a rider limit with no car weight (all four at 66 lb or 132 lb), and ${kidsRideOnWeightHalves().weightOnly.length} state a car weight with no limit. A limit without a weight is a claim about the child; a weight without a limit is a claim about the parent. Neither one is a spec.`,
    gapUnits: `Units and wording — all ${d.totals.withItemWeight} car weights arrive in pounds and all ${d.totals.withWeightLimit} limits in pounds too, so no conversion was needed here, but no listing says whether that weight includes the battery, the charger or the packaging. The three heaviest cars are quoted at 60.63 lb, 54.6 lb and 36.7 lb without stating which of those they are.`,
    gapStorage: `Storage and handling — no listing publishes a folded height, a wheel diameter, or a weight that excludes the battery, so there is no way to tell whether the 70 lb golf cart can be taken apart, or whether it can be carried upstairs, from these records. That is a question for the retailer, not for this page.`,
    rosterTitle: "Both weights, side by side",
    rosterLead: `Sorted by the margin between the car's own weight and the rider it is rated for, tightest first. The margin column is the subtraction, not a published figure.`,
    colBrand: "Brand",
    colModel: "Model",
    colCarWeight: "Car weight",
    colLimit: "Rider limit",
    colMargin: "Margin",
    notStated: "not stated",
    methodTitle: "How the weights were read",
    methodBody: [
      `Source: the CMS product snapshot, gated to the id namespace electric_vehicles-* with category "electric_car", minus the listings Stage 1 prunes — ${total} published cars.`,
      `Car weight is the item weight in the specification record; the rider limit is the published weight capacity. Each is reproduced as stated, and the raw string for both is kept in src/data/rideOnData.generated.ts.`,
      `The margin column is computed here as limit minus car weight, and the ratio as limit divided by car weight. Neither figure appears in the source data; both are arithmetic on the two published numbers.`,
      `Where a listing publishes only one of the pair, that row shows the figure it has and marks the other as not stated. No value was copied from a sibling listing of the same model.`,
      `Nothing here was weighed. These are the retailers' own figures for their own products.`,
    ],
  },
  zh: {
    eyebrow: "Plan-B 资产页 · 重量与载重",
    navLabel: "重量与载重",
    h1: `童用电动车重量：车重与承重对照，${total} 款`,
    lead: `电动车是本站唯一一种"孩子的体重不是规格表最后一栏"的轮式玩具。别的车是孩子自己扛着走的，电动车是孩子坐进去的车——于是车本身有多重就变成了家长的问题：谁把它搬去充电、谁把它拖回车库。${total} 款在售车中，${d.totals.withItemWeight} 款公布了车重，${d.totals.withWeightLimit} 款公布了承重，而两项都有的只有 ${d.totals.withItemWeight - kidsRideOnWeightHalves().weightOnly.length} 款——只有它们才能判断这两个数字之间是否还留得下一个真实孩子的空间。`,
    ownTitle: "这些车到底有多重",
    ownLead: `车重从 ${Math.min(...d.rows.filter((r) => r.itemWeightLb !== null).map((r) => r.itemWeightLb as number))} 磅到 ${Math.max(...d.rows.filter((r) => r.itemWeightLb !== null).map((r) => r.itemWeightLb as number))} 磅不等。最重的四款里有三款是 24V 机型，最重的那台是带车顶的四座高尔夫球车，70 磅——孩子根本推不动，家长恐怕也未必搬得进后备箱。${d.totals.withItemWeight} 个车重全部以磅计，本组没有任何一款用公斤。`,
    ratioTitle: "两个数字之间的比值",
    ratioLead: `两个数字都有的场合，有意义的既不是这个也不是那个，而是它们之间的距离。${kidsRideOnWeightPairs().length} 款两项俱全的 listing 里，这个比值从 ${kidsRideOnWeightExtremes().minRatio} 到 ${kidsRideOnWeightExtremes().maxRatio}。单看"承重 150 磅"没有意义；13.78 磅的车承重 150 磅，与 60.63 磅的车承重 65 磅，是完全不同的两回事。`,
    ratioTight: `最紧的一对——${kidsRideOnWeightExtremes().tightest.label}，${kidsRideOnWeightExtremes().tightest.carLb} 磅的车，承重 ${kidsRideOnWeightExtremes().tightest.limitLb} 磅，余量只有 ${kidsRideOnWeightExtremes().tightest.marginLb} 磅，比值 ${kidsRideOnWeightExtremes().tightest.ratio}。体重超过约 60 磅的孩子已经到了这台机器公布上限的边缘；而同一条 listing 又写明两个座位合计额定 130 磅。那个数字说的是整车总载重，不是单个乘员。`,
    ratioWide: `按倍数最松的一对——${kidsRideOnWeightExtremes().widestRatio.label}，${kidsRideOnWeightExtremes().widestRatio.carLb} 磅的车，承重 ${kidsRideOnWeightExtremes().widestRatio.limitLb} 磅，比值 ${kidsRideOnWeightExtremes().widestRatio.ratio}，余量 ${kidsRideOnWeightExtremes().widestRatio.marginLb} 磅。紧随其后的是 ${kidsRideOnWeightExtremes().secondWidestRatio.label}，比值 ${kidsRideOnWeightExtremes().secondWidestRatio.ratio}，${kidsRideOnWeightExtremes().secondWidestRatio.carLb} 磅的车承重 ${kidsRideOnWeightExtremes().secondWidestRatio.limitLb} 磅。而按磅数算余量最大的又是第三台机器：${kidsRideOnWeightExtremes().widestMargin.label}，承重 ${kidsRideOnWeightExtremes().widestMargin.limitLb} 磅对 ${kidsRideOnWeightExtremes().widestMargin.carLb} 磅的车重，余量 ${kidsRideOnWeightExtremes().widestMargin.marginLb} 磅——但比值只有 ${kidsRideOnWeightExtremes().widestMargin.ratio}。余量和倍数是两个问题，这个类目用不同的车来回答它们。`,
    gapTitle: "买家无法从这份目录补上的四个缺口",
    gapLead: `下面每一项都是 listing 没有给出的数字，而且每一项都会改变家长的安排。`,
    gapPairs: `两个数字齐全——${total} 款中有 ${kidsRideOnWeightPairs().length} 款同时给出车重与承重。其余 ${total - kidsRideOnWeightPairs().length} 款只给其中一个，因此这些行根本算不出比值。`,
    gapHalves: `单边条目——${kidsRideOnWeightHalves().limitOnly.length} 款只给承重没有车重（四款都是 66 磅或 132 磅），另有 ${kidsRideOnWeightHalves().weightOnly.length} 款只给车重没有承重。只给承重是对孩子的约束，只给车重是对家长的约束，两者单独都不构成规格。`,
    gapUnits: `单位与口径——${d.totals.withItemWeight} 个车重全部以磅计，${d.totals.withWeightLimit} 个承重也全部以磅计，因此本页不需要换算；但没有一款说明这个重量是否含电池、含充电器或含包装。本组最重的三台车分别写 60.63 磅、54.6 磅和 36.7 磅，却没说这是哪一种口径。`,
    gapStorage: `收纳与搬运——没有任何一款公布折叠后高度、轮径，或不含电池的重量，因此无从判断那台 70 磅的高尔夫球车能否拆开、能否上楼梯。这个问题要问零售商，不是这一页能回答的。`,
    rosterTitle: "两个重量并排看",
    rosterLead: `按车重与承重之间的余量排序，最紧的在前。余量一列是两者相减的结果，并非 listing 直接给出的数字。`,
    colBrand: "品牌",
    colModel: "型号",
    colCarWeight: "车重",
    colLimit: "承重上限",
    colMargin: "余量",
    notStated: "未说明",
    methodTitle: "这些重量是怎么读取的",
    methodBody: [
      `数据源：CMS 产品快照，限定 id 命名空间 electric_vehicles-* 且 category 为 "electric_car"，再剔除阶段一剪掉的 listing，共 ${total} 款在售。`,
      `车重取自规格记录中的 item weight，承重取自公布的载重上限。两者均按原文呈现，原始字符串保留在 src/data/rideOnData.generated.ts。`,
      `余量一列在此计算为「承重 − 车重」，比值为「承重 ÷ 车重」。这两个数字源数据里都没有，都是对两个已公布数字做的算术。`,
      `只给出其中一项的 listing，该行显示它有的那一项，另一项标为未说明。不会用同款其他 listing 的数字去补。`,
      `本页没有任何内容经过称重。这些都是零售商对自己产品的自述数据。`,
    ],
  },
};

/** Roster columns. Weight and limit lead because they are the page's subject. */
export const kidsRideOnWeightColumns = (t: RideOnWeightStrings): RideOnColumn[] => [
  {
    key: "brand",
    header: t.colBrand,
    render: (r: never) => (r as { brand?: string }).brand || t.notStated,
  },
  {
    key: "name",
    header: t.colModel,
    render: (r: never) => rideOnLabel(r as never) || t.notStated,
  },
  {
    key: "car",
    header: t.colCarWeight,
    numeric: true,
    render: (r: never) => {
      const v = (r as { itemWeightLb?: number | null }).itemWeightLb;
      return v === null || v === undefined ? t.notStated : `${v} lb`;
    },
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
  {
    key: "margin",
    header: t.colMargin,
    numeric: true,
    render: (r: never) => {
      const car = (r as { itemWeightLb?: number | null }).itemWeightLb;
      const lim = (r as { weightLimitLb?: number | null }).weightLimitLb;
      if (car === null || car === undefined || lim === null || lim === undefined) {
        return t.notStated;
      }
      return `${(lim - car).toFixed(2)} lb`;
    },
  },
];

export const kidsRideOnWeightVars = {
  total,
  pairs: kidsRideOnWeightPairs(),
  halves: kidsRideOnWeightHalves(),
};

export const kidsRideOnWeightIcons = {
  scale: Scale,
  users: Users,
  gap: AlertTriangle,
  table: Table2,
};
