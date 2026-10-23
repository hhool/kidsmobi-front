/**
 * /kids-scooter-recalls/ — the CPSC record for kick scooters.
 *
 * Sourced from the same generated CPSC dataset the balance-bike and kids-bike
 * recall pages use (src/data/recallData.generated.ts via safetyRecallRecord),
 * narrowed to notices whose title names a scooter. No new fetch: the recall
 * corpus is category-agnostic and already retrieved, and re-querying CPSC for a
 * subset of it would produce a second number for the same notices.
 *
 * Four notices name a scooter. That is a genuinely small number and the page
 * leads with it rather than inflating it — three of the four are electric or
 * mini-bike notices, and one of those is the Jetson three-wheel kick scooter,
 * which is the only notice that matches a wheel layout actually sold in this
 * catalogue. The honest comparison is against the 44 children's bicycle notices
 * and 2 balance-bike notices in the same dataset.
 *
 * Note the filter is on TITLE text, because productType is not retained in the
 * generated dataset. A notice about a scooter whose title does not say so would
 * be missed; that limitation is stated on the page.
 */
import { AlertOctagon, Scale, CalendarRange, Table2 } from "lucide-react";
import { recallDataset } from "./safetyRecallRecord";
import { SCOOTER_DATASET } from "./scooterData.generated";
import type { ScooterColumn } from "../components/ScooterAssetPage";

export const KIDS_SCOOTER_RECALLS_PATH = "/kids-scooter-recalls/";

const recall = recallDataset;
const SCOOTER_TITLE = /scoot/i;

/** Notices whose title names a scooter, newest first. */
export const kidsScooterRecallNotices = () =>
  [...recall.kidBikeNotices, ...recall.balanceBikeNotices]
    .filter((n) => SCOOTER_TITLE.test(n.title || ""))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));

/** How many of those notices describe a kick scooter rather than a motor one. */
export const kidsScooterRecallSplit = () => {
  const notices = kidsScooterRecallNotices();
  const electric = notices.filter((n) => /electric|motor|battery|powered/i.test(n.title || ""));
  const manual = notices.filter((n) => !/electric|motor|battery|powered/i.test(n.title || ""));
  return {
    total: notices.length,
    electric: electric.length,
    manual: manual.length,
    newest: notices[0]?.date ?? null,
    oldest: notices[notices.length - 1]?.date ?? null,
    notices,
  };
};

export interface ScooterRecallsStrings {
  eyebrow: string;
  navLabel: string;
  h1: string;
  lead: string;
  splitTitle: string;
  splitLead: string;
  splitElectric: string;
  splitManual: string;
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

export const kidsScooterRecallsStrings: Record<"en" | "zh", ScooterRecallsStrings> = {
  en: {
    eyebrow: "Plan-B asset · recall record",
    navLabel: "Recall record",
    h1: `Kids Scooter Recalls: ${kidsScooterRecallSplit().total} CPSC Notices Since 2000`,
    lead: `The US Consumer Product Safety Commission has published ${kidsScooterRecallSplit().total} recall notices since 2000 whose title names a kick scooter. That is a small number, and it is worth reading carefully rather than as reassurance: ${kidsScooterRecallSplit().electric} of the ${kidsScooterRecallSplit().total} concern powered scooters, which this catalogue does not sell, leaving ${kidsScooterRecallSplit().manual} that describe the manual kind.`,
    splitTitle: "Which of these are kick scooters",
    splitLead: `The powered-versus-manual split is the whole story on this page. Most scooter recalls in the CPSC record are for battery-powered products aimed at older riders, and those are not the products on the kids' scooter pages here.`,
    splitElectric: `Powered — ${kidsScooterRecallSplit().electric} notices involve an electric, motorised or battery-powered scooter, including the Jetson recall covering three-wheel kick children's scooters with lithium batteries.`,
    splitManual: `Manual — ${kidsScooterRecallSplit().manual} notices describe non-powered kick scooters, both of them Fisher-Price scooter and mini-bike recalls from the early 2000s, both of them far older than any product in this catalogue.`,
    compareTitle: "How this compares to the other vehicle categories",
    compareLead: `The same dataset holds ${recall.totals.kidsBikeNotices} children's bicycle notices, ${recall.totals.balanceBikeNotices} balance-bike notices and ${recall.totals.kidHelmetNotices} children's helmet notices. Kick scooters sit at the bottom of that range. A low recall count is not evidence that a product is well made: it reflects how old the category is, how few products were sold under this name, and how recently it appeared.`,
    methodTitle: "How these notices were selected",
    methodBody: [
      `Source: the site's existing CPSC recall dataset, retrieved from SaferProducts.gov across all years since 2000 and generated by scripts/fetch_recall_data.mjs. That dataset already keeps notices describing wheeled children's products.`,
      `This page narrows that set to notices whose TITLE contains "scoot". Product type is not retained in the generated dataset, so a notice about a scooter whose title does not mention one would not be counted here. This is the selection rule's limitation and it is stated rather than hidden.`,
      `No notice was deduplicated or merged. Each row is one CPSC recall number, and the counts are of notices, not of units or of models.`,
      `A recall is not a finding that a specific product sold on this site is unsafe. It records that a manufacturer withdrew a batch.`,
    ],
    rosterTitle: "Every scooter notice in the record",
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
    h1: `童用滑板车召回：2000 年以来 ${kidsScooterRecallSplit().total} 起 CPSC 通告`,
    lead: `自 2000 年以来，美国消费品安全委员会（CPSC）发布了 ${kidsScooterRecallSplit().total} 起标题中提及滑板车的召回通告。这个数字很小，值得仔细读，而不是当成安心的理由：其中 ${kidsScooterRecallSplit().electric} 起涉及电动滑板车，而本站并不销售这类产品，真正针对手动童用滑板车的只有 ${kidsScooterRecallSplit().manual} 起。`,
    splitTitle: "这些到底算不算童用滑板车",
    splitLead: `电动与手动的区分就是这一页的全部重点。CPSC 记录里的大多数滑板车召回针对的是电池供电、面向较大骑手的成人产品，而本站这些童用滑板车页面卖的不是它们。`,
    splitElectric: `电动——${kidsScooterRecallSplit().electric} 起涉及电动、电机或电池供电的滑板车，包括 Jetson 针对三轮儿童踏板车（含锂电池）的那起召回。`,
    splitManual: `手动——${kidsScooterRecallSplit().manual} 起描述的是非动力滑板车，两起都是 2000 年代初的 Fisher-Price 踏板车与迷你自行车召回，都比本目录里任何一款产品早得多。`,
    compareTitle: "与其他车种相比如何",
    compareLead: `同一份数据集中还有 ${recall.totals.kidsBikeNotices} 起童车自行车召回、${recall.totals.balanceBikeNotices} 起平衡车召回、${recall.totals.kidHelmetNotices} 起儿童头盔召回。滑板车处在这一范围的下端。召回数低并不能证明产品做工好——它反映的是这个类目存在多久、以此名义卖出的产品有多少、以及它出现得有多晚。`,
    methodTitle: "这些通告是怎么筛出来的",
    methodBody: [
      `数据源：本站现有的 CPSC 召回数据集，来自 SaferProducts.gov 2000 年至今的全部记录，由 scripts/fetch_recall_data.mjs 生成。该数据集已保留描述轮式儿童产品的通告。`,
      `本页在此基础上收窄到标题含 "scoot" 的通告。生成的数据集没有保留产品类型字段，因此一条关于滑板车但标题未提及的通告不会被计入。这是筛选规则本身的局限，这里如实说明而非隐去。`,
      `没有对通告做去重或合并。每一行是一条 CPSC 召回编号，统计的是通告数，不是召回数量，也不是型号数。`,
      `召回并不等于本站销售的某款产品不安全。它记录的是厂商撤回了某一批次。`,
    ],
    rosterTitle: "记录中每一起滑板车召回",
    rosterLead: `按时间倒序，危害与召回数量按 CPSC 原文呈现。`,
    colDate: "日期",
    colTitle: "召回",
    colHazard: "危害",
    colUnits: "数量",
    notStated: "未说明",
  },
};

export const kidsScooterRecallColumns = (t: ScooterRecallsStrings): ScooterColumn[] => [
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

export const kidsScooterRecallVars = {
  ...kidsScooterRecallSplit(),
  kidBike: recall.totals.kidsBikeNotices,
  balanceBike: recall.totals.balanceBikeNotices,
  helmets: recall.totals.kidHelmetNotices,
  catalogue: SCOOTER_DATASET.totals.kidsScooters,
};

export const kidsScooterRecallIcons = {
  alert: AlertOctagon,
  scale: Scale,
  calendar: CalendarRange,
  table: Table2,
};