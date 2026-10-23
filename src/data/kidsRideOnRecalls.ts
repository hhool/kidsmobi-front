/**
 * /kids-ride-on-recalls/ — the CPSC and EU Safety Gate record for ride-ons.
 *
 * Sourced from the same generated CPSC dataset the balance-bike, kids-bike and
 * kids-scooter recall pages use (src/data/recallData.generated.ts via
 * safetyRecallRecord), narrowed to the ride-on bucket. No new fetch: the recall
 * corpus is category-agnostic and already retrieved, and re-querying CPSC for a
 * subset of it would produce a second number for the same notices.
 *
 * Sixteen notices name a ride-on vehicle. That is a larger count than any other
 * wheeled category on this site has, and the reason is straightforward: this is
 * the only category here with a mains charger and a lead-acid battery in the
 * box. Every one of the sixteen carries a fire, heat or battery hazard.
 *
 * Two things are reported honestly rather than inflated:
 *
 *   1. The hazard breakdown counts OVERLAP. A notice naming both a fire hazard
 *      and an injury hazard appears under both headings, so the four categories
 *      sum to more than sixteen. The page says so instead of showing a bar
 *      chart that looks like a partition of the set.
 *
 *   2. The EU Safety Gate bucket holds 16 alerts in the ride-on group, but only
 *      5 of them name a ride-on or trike. The other 11 are children's
 *      bicycles filed under the same search term. This is a property of the
 *      source filter, and the page states the real count rather than 16.
 */
import { AlertOctagon, Flame, Scale, CalendarRange, Table2 } from "lucide-react";
import { recallDataset, safetyGateDataset } from "./safetyRecallRecord";
import { RIDE_ON_DATASET } from "./rideOnData.generated";
import type { RideOnColumn } from "../components/RideOnAssetPage";

export const KIDS_RIDE_ON_RECALLS_PATH = "/kids-ride-on-recalls/";

const recall = recallDataset;
const gate = safetyGateDataset;

/** Notices in the ride-on bucket, newest first. */
export const kidsRideOnRecallNotices = () =>
  [...recall.rideOnNotices].sort((a, b) => String(b.date).localeCompare(String(a.date)));

/** The hazard breakdown, with the overlap made explicit. */
export const kidsRideOnRecallHazards = () => ({
  breakdown: recall.rideOnHazardBreakdown,
  /** Sum of the category counts, which exceeds the notice count because a
   *  notice can name more than one hazard type. */
  categorySum: recall.rideOnHazardBreakdown.reduce((a, b) => a + b.count, 0),
  notices: recall.rideOnNotices.length,
  /** Notices carrying a fire, heat or battery hazard. */
  fireNotices: recall.rideOnHazardBreakdown.find((h) => h.label === "Fire, heat or battery")?.count ?? 0,
  yearly: recall.rideOnYearlyTrend,
});

/** The unit counts as CPSC published them, summed and bounded. */
export const kidsRideOnRecallUnits = () => {
  const units = recall.rideOnNotices
    .map((n) => parseInt(String(n.units ?? "").replace(/[^0-9]/g, ""), 10))
    .filter((n) => Number.isFinite(n) && n > 0);
  return {
    total: units.reduce((a, b) => a + b, 0),
    min: units.length ? Math.min(...units) : 0,
    max: units.length ? Math.max(...units) : 0,
    largest: [...recall.rideOnNotices].sort(
      (a, b) =>
        parseInt(String(b.units ?? "").replace(/[^0-9]/g, ""), 10) -
        parseInt(String(a.units ?? "").replace(/[^0-9]/g, ""), 10)
    )[0],
  };
};

/**
 * The EU Safety Gate alerts, split into the ones that actually name a ride-on
 * or trike and the ones that are children's bicycles caught by the same search.
 */
export const kidsRideOnSafetyGateSplit = () => {
  const alerts = gate.rideOnAlerts;
  const RIDE_ON_WORD = /trike|tricycle|ride[- ]?on/i;
  const named = alerts.filter((a) => RIDE_ON_WORD.test(a.productName || ""));
  const bikes = alerts.filter((a) => !RIDE_ON_WORD.test(a.productName || ""));
  return {
    total: alerts.length,
    named: named.length,
    namedRows: named.map((a) => ({ name: a.productName, country: a.country, date: a.date })),
    bikeRows: bikes.map((a) => ({ name: a.productName, country: a.country, date: a.date })),
    bikeCount: bikes.length,
  };
};

export interface RideOnRecallsStrings {
  eyebrow: string;
  navLabel: string;
  h1: string;
  lead: string;
  hazardTitle: string;
  hazardLead: string;
  hazardFire: string;
  hazardOverlap: string;
  hazardUnits: string;
  euTitle: string;
  euLead: string;
  euNamed: string;
  euBikes: string;
  compareTitle: string;
  compareLead: string;
  methodTitle: string;
  methodBody: string[];
  rosterTitle: string;
  rosterLead: string;
  colDate: string;
  colTitle: string;
  colHazard: string;
  colUnits: string;
  notStated: string;
}

export const kidsRideOnRecallStrings: Record<"en" | "zh", RideOnRecallsStrings> = {
  en: {
    eyebrow: "Plan-B asset · recall record",
    navLabel: "Recall record",
    h1: `Kids Ride-On Recalls: ${recall.totals.rideOnNotices} CPSC Notices Since 2000`,
    lead: `The US Consumer Product Safety Commission has published ${recall.totals.rideOnNotices} recall notices since 2000 naming a children's ride-on vehicle. That is more than any other wheeled category on this site, and the reason is not that ride-on cars are the most dangerous toys made — it is that they are the only ones here that ship with a mains charger and a rechargeable battery. Every one of the ${recall.totals.rideOnNotices} notices carries a fire, heat or battery hazard.`,
    hazardTitle: "What the hazards are, and why the counts overlap",
    hazardLead: `The four hazard categories on this page are counted from each notice's own text, and one notice can land in more than one of them. That is why the categories sum to more than the number of notices, and it is stated rather than hidden behind a chart that would look like a partition.`,
    hazardFire: `Fire, heat and battery — ${kidsRideOnRecallHazards().fireNotices} of ${recall.totals.rideOnNotices} notices name overheating, an ignited circuit board, a shorted wire or a battery that smoked and melted. The four recurring mechanisms are a relay or controller failing, an accelerator pedal sticking, a vehicle moving on its own after the pedal was released, and a charger overheating.`,
    hazardOverlap: `The overlap — the four categories sum to ${kidsRideOnRecallHazards().categorySum} across ${kidsRideOnRecallHazards().notices} notices, because ${kidsRideOnRecallHazards().categorySum - kidsRideOnRecallHazards().notices} notices name more than one hazard type. The Dynacraft 2017 notice, for instance, is filed under both a fall hazard and a crash hazard in the same sentence.`,
    hazardUnits: `The scale — the unit counts CPSC published sum to about ${kidsRideOnRecallUnits().total.toLocaleString("en-US")} vehicles across these ${recall.totals.rideOnNotices} notices, from ${kidsRideOnRecallUnits().min.toLocaleString("en-US")} units in the smallest to ${kidsRideOnRecallUnits().max.toLocaleString("en-US")} in the largest. The largest is the 2000 Tek Nek Toys recall of children's riding vehicles. A unit count is a batch size, not a defect rate: a small batch of a badly made vehicle is more dangerous per unit than a large batch of a good one.`,
    euTitle: "The European record needs a caveat",
    euLead: `The EU Safety Gate dataset is filtered by product name across EU languages, and the ride-on bucket it produces is ${kidsRideOnSafetyGateSplit().total} alerts — but most of those are children's bicycles, not ride-on cars. The page reports the count that actually applies.`,
    euNamed: `The ${kidsRideOnSafetyGateSplit().named} that name a ride-on or trike — ${kidsRideOnSafetyGateSplit().namedRows.map((r) => `${r.name} (${r.country}, ${r.date})`).join("; ")}. These are the European alerts that genuinely correspond to the products on this page.`,
    euBikes: `The other ${kidsRideOnSafetyGateSplit().bikeCount} — children's bicycles and balance bikes that the same name filter caught because "bicycle" appears alongside "trike" and "ride-on" in the search term. They are not ride-on cars and are not counted as such here.`,
    compareTitle: "Where ride-ons sit against the other wheeled categories",
    compareLead: `For scale, the same CPSC corpus holds ${recall.totals.kidsBikeNotices} notices on children's bicycles, ${recall.totals.kidHelmetNotices} on children's helmets, ${recall.totals.balanceBikeNotices} on balance bikes and ${recall.totals.tricycleNotices} on tricycles. Ride-ons sit above all of them, and they differ from every one of those categories in a way that matters here: they are the only products on this site that arrive with a mains charger. A low recall count would not be good news in a category like this; the number being high is the point.`,
    methodTitle: "How the ride-on notices were isolated from the wider file",
    methodBody: [
      `Source: the site's existing CPSC recall dataset, retrieved from SaferProducts.gov across all years since 2000 and generated by scripts/fetch_recall_data.mjs. That dataset already keeps notices describing wheeled children's products, and the ride-on bucket was carved from the previously discarded pool rather than added separately, so no published total changed.`,
      `The ride-on bucket was selected on title text, because product type is not retained in the generated dataset. A notice about a ride-on car whose title does not say so would not be counted here. That limitation is stated rather than hidden.`,
      `The hazard categories are counted from each notice's hazard text and can overlap; the sum of the categories is published alongside the notice count so the difference is visible.`,
      `The EU Safety Gate figures come from the site's existing safetyGateData.generated.ts, and the ride-on-versus-bicycle split is made on the product name.`,
      `No notice was deduplicated or merged. Each row is one CPSC recall number, and the counts are of notices, not of units or of models.`,
      `A recall is not a finding that a specific product sold on this site is unsafe. It records that a manufacturer withdrew a batch.`,
    ],
    rosterTitle: "Every ride-on notice in the record",
    rosterLead: `Newest first, with the hazard and the reported unit count as CPSC published them.`,
    colDate: "Date",
    colTitle: "Recall",
    colHazard: "Hazard",
    colUnits: "Units",
    notStated: "not stated",
  },
  zh: {
    eyebrow: "Plan-B 资产页 · 召回记录",
    navLabel: "召回记录",
    h1: `童用电动车召回：2000 年以来 ${recall.totals.rideOnNotices} 起 CPSC 通告`,
    lead: `自 2000 年以来，美国消费品安全委员会（CPSC）发布了 ${recall.totals.rideOnNotices} 起标题提及童用电动车的召回通告。这比本站其他任何轮式类目都多，而原因并不是电动车是最危险的玩具——而是因为它们是这里唯一随机附带市电充电器和可充电电池的品类。${recall.totals.rideOnNotices} 起通告全都带着火灾、高温或电池类危害。`,
    hazardTitle: "危害是什么，以及计数为什么会重叠",
    hazardLead: `本页的四类危害是从每条通告自己的文字里统计的，而一条通告可能同时落进多类。这正是各类之和大于通告数的原因，这里如实说明，而不是用一张看起来像完整划分的图表把它盖过去。`,
    hazardFire: `火灾、高温与电池——${recall.totals.rideOnNotices} 起中有 ${kidsRideOnRecallHazards().fireNotices} 起提到过热、电路板起火、线路短路，或电池冒烟熔化。反复出现的四种机制是：继电器或控制器失效、油门踏板卡滞、踏板松开后车辆自行移动、以及充电器过热。`,
    hazardOverlap: `重叠——四类之和是 ${kidsRideOnRecallHazards().categorySum}，而通告只有 ${kidsRideOnRecallHazards().notices} 起，因为其中 ${kidsRideOnRecallHazards().categorySum - kidsRideOnRecallHazards().notices} 起同时提到不止一种危害。2017 年 Dynacraft 那起通告就是典型：同一句话里既有坠落危害又有碰撞危害。`,
    hazardUnits: `规模——CPSC 公布的召回数量加总约为 ${kidsRideOnRecallUnits().total.toLocaleString("en-US")} 台，覆盖这 ${recall.totals.rideOnNotices} 起通告，最小一批 ${kidsRideOnRecallUnits().min.toLocaleString("en-US")} 台，最大一批 ${kidsRideOnRecallUnits().max.toLocaleString("en-US")} 台。最大的是 2000 年 Tek Nek Toys 儿童 riding vehicle 的那起。召回数量是批次规模，不是缺陷率：一小批做坏的机器，单位风险比一大批做好的机器更高。`,
    euTitle: "欧洲记录需要一个说明",
    euLead: `EU Safety Gate 数据集按各欧盟语言的产品名筛选，筛出的"ride-on"桶有 ${kidsRideOnSafetyGateSplit().total} 条警报——但其中大多数是儿童自行车，而不是电动车。本页只报真正对得上的那个数字。`,
    euNamed: `真正提到 ride-on 或三轮车的 ${kidsRideOnSafetyGateSplit().named} 条——${kidsRideOnSafetyGateSplit().namedRows.map((r) => `${r.name}（${r.country}，${r.date}）`).join("；")}。这些才是与本页产品真正对应的欧洲警报。`,
    euBikes: `另外 ${kidsRideOnSafetyGateSplit().bikeCount} 条——儿童自行车与平衡车，被同一个名称过滤器一起捞了进来，因为搜索词里"bicycle"与"trike"、"ride-on"并列出现。它们不是电动车，这里也不按电动车计。`,
    compareTitle: "电动车在其他轮式类目中的位置",
    compareLead: `作为参照，同一份 CPSC 数据集中还有 ${recall.totals.kidsBikeNotices} 起童车自行车召回、${recall.totals.kidHelmetNotices} 起儿童头盔召回、${recall.totals.balanceBikeNotices} 起平衡车召回、${recall.totals.tricycleNotices} 起三轮车召回。电动车在它们之上，而且和上面每一个类目都有一点不同：它是本站唯一自带市电充电器的产品。在这样的类目里召回数低反而不是好消息——数字高才是重点。`,
    methodTitle: "这些电动车通告是怎么从更大的文件里分出来的",
    methodBody: [
      `数据源：本站现有的 CPSC 召回数据集，来自 SaferProducts.gov 2000 年至今的全部记录，由 scripts/fetch_recall_data.mjs 生成。该数据集已保留描述轮式儿童产品的通告，ride-on 桶是从此前被丢弃的池子里划出来的，不是另外新增，因此没有任何已公布的总数发生变化。`,
      `ride-on 桶按标题文本筛选，因为生成的数据集没有保留产品类型字段。一条关于电动车但标题未提及的通告不会被计入这里。这是筛选规则本身的局限，这里如实说明而非隐去。`,
      `危害分类是按每条通告的危害文字统计的，可能相互重叠；各类之和与通告数一并公布，好让差额可见。`,
      `EU Safety Gate 的数字来自本站现有的 safetyGateData.generated.ts，ride-on 与自行车的区分依据是产品名。`,
      `没有对通告做去重或合并。每一行是一条 CPSC 召回编号，统计的是通告数，不是召回数量，也不是型号数。`,
      `召回并不等于本站销售的某款产品不安全。它记录的是厂商撤回了某一批次。`,
    ],
    rosterTitle: "记录中每一起电动车召回",
    rosterLead: `按时间倒序，危害与召回数量按 CPSC 原文呈现。`,
    colDate: "日期",
    colTitle: "召回",
    colHazard: "危害",
    colUnits: "数量",
    notStated: "未说明",
  },
};

export const kidsRideOnRecallColumns = (t: RideOnRecallsStrings): RideOnColumn[] => [
  {
    key: "date",
    header: t.colDate,
    render: (r: never) => String((r as { date?: string }).date || t.notStated),
  },
  {
    key: "title",
    header: t.colTitle,
    render: (r: never) => (r as { title?: string }).title || t.notStated,
  },
  {
    key: "hazard",
    header: t.colHazard,
    render: (r: never) => (r as { hazard?: string }).hazard || t.notStated,
  },
  {
    key: "units",
    header: t.colUnits,
    numeric: true,
    render: (r: never) => {
      const u = (r as { units?: number | string }).units;
      return u ? String(u) : t.notStated;
    },
  },
];

export const kidsRideOnRecallVars = {
  ...kidsRideOnRecallHazards(),
  noticesList: kidsRideOnRecallNotices(),
  units: kidsRideOnRecallUnits(),
  gate: kidsRideOnSafetyGateSplit(),
  catalogue: RIDE_ON_DATASET.totals.rideOnCars,
  kidBike: recall.totals.kidsBikeNotices,
  helmets: recall.totals.kidHelmetNotices,
  balanceBike: recall.totals.balanceBikeNotices,
  tricycle: recall.totals.tricycleNotices,
};

export const kidsRideOnRecallIcons = {
  alert: AlertOctagon,
  flame: Flame,
  scale: Scale,
  calendar: CalendarRange,
  table: Table2,
};
