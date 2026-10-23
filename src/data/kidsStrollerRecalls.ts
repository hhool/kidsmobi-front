/**
 * /kids-stroller-recalls/ — the recall field that is not in this dataset.
 *
 * Honesty page: the CMS snapshot carries no recall records. Rather than invent
 * a list, this page reports the absence, explains what the EN 1888 mark does and
 * does not predict about safety, and points to the authorities that do hold
 * recall data (CPSC in the US, RAPEX in the EU). The roster shows all 45
 * strollers with their compliance mark and a plain "not in this snapshot" for
 * the recall field.
 */
import { FileX2, ShieldCheck, ExternalLink, TriangleAlert, Table2 } from "lucide-react";
import { STROLLER_DATASET } from "./strollerData.generated";

export { STROLLER_DATASET };
export const KIDS_STROLLER_RECALLS_PATH = "/kids-stroller-recalls/";

const d = STROLLER_DATASET;
const total = d.totals.strollers;
const enCount = d.complianceTally.EN1888;
const recallRecords = 0;

export interface StrollerRecallStrings {
  eyebrow: string;
  navLabel: string;
  h1: string;
  lead: string;
  absentTitle: string;
  absentLead: string;
  absentBody: string;
  enTitle: string;
  enLead: string;
  enBody: string;
  whereTitle: string;
  whereLead: string;
  whereBody: string;
  gapTitle: string;
  gapLead: string;
  gapField: string;
  gapScope: string;
  gapVerify: string;
  rosterTitle: string;
  rosterLead: string;
  colBrand: string;
  colModel: string;
  colType: string;
  colEn: string;
  colRecall: string;
  notStated: string;
  methodTitle: string;
  methodBody: string[];
}

export const kidsStrollerRecallStrings: Record<"en" | "zh", StrollerRecallStrings> = {
  en: {
    eyebrow: "Plan-B asset · recalls",
    navLabel: "Recalls",
    h1: `Stroller Recalls: What the Record Shows in This Data`,
    lead: `This catalogue holds ${recallRecords} recall records. The CMS snapshot that backs these eight pages carries no recall field, so this page reports the absence plainly, explains what the EN 1888 mark does and does not predict, and points to the authorities that actually hold recall data.`,
    absentTitle: "This snapshot carries no recall records",
    absentLead: `The honest finding is a missing field, not a clean bill of health.`,
    absentBody: `Across all ${total} strollers, the dataset records ${recallRecords} recall notices. The generator captured price, weight, dimensions, age, form, compliance and the buyer summary — but no recall or safety-alert field. So this page can say what is present, and must say that recalls are not among it.`,
    enTitle: "What EN 1888 compliance does and does not predict",
    enLead: `The one safety mark we do have is universal, and it is not a recall signal.`,
    enBody: `${enCount} of ${total} strollers carry EN 1888. A standard every stroller meets tells you nothing about whether a specific model was later recalled — a recall concerns a production batch or a design fault, not the baseline standard. The mark and a future recall are independent facts.`,
    whereTitle: "Where to look for stroller recalls",
    whereLead: `The data that answers a recall question lives outside this catalogue.`,
    whereBody: `In the United States the Consumer Product Safety Commission (CPSC) publishes stroller recalls; in the European Union it is the RAPEX rapid-alert system. Neither is mirrored in this snapshot, so a buyer checking a specific model should consult those authorities directly rather than this page.`,
    gapTitle: "What the absence of a field means",
    gapLead: `Stated so the gap is not mistaken for a guarantee.`,
    gapField: `No recall field — ${recallRecords} records are present, so "never recalled" cannot be claimed for any of the ${total} strollers.`,
    gapScope: `Scope — this is one retailer's catalogue at one moment; it is not a safety register and was never meant to be.`,
    gapVerify: `No verification — compliance marks and summaries are as the retailer stated them; we did not check them against a regulator's list.`,
    rosterTitle: "All forty-five strollers, with the recall field shown",
    rosterLead: `Sorted by form. The recall column is "not in this snapshot" on every row by construction.`,
    colBrand: "Brand",
    colModel: "Model",
    colType: "Type",
    colEn: "EN 1888",
    colRecall: "Recall record",
    notStated: "not in this snapshot",
    methodTitle: "How these stroller figures were read",
    methodBody: [
      `Source: the CMS product snapshot, limited to the id namespace stroller-* with category "stroller", after dropping about ${d.totals.droppedNonStroller} items that share the prefix but are not strollers — car seats and baby swings. ${total} strollers remain in stock.`,
      `Every figure is the retailer's stated number. Item weights are in pounds and dimensions in inches as the listing gives them; nothing here was weighed, measured or tested.`,
      `Membership is decided by the id namespace, not by the marketing name. A stroller that calls itself a "travel system" is still one row; a car seat that shares the prefix is dropped.`,
      `EN 1888 is the European safety standard the catalogue attaches to all ${d.totals.withCompliance} strollers. It is recorded as stated; we did not verify certification.`,
      `Recalls are not a field in this snapshot, so the recall count is ${recallRecords} by construction; we did not import CPSC or RAPEX data.`,
    ],
  },
  zh: {
    eyebrow: "Plan-B 资产页 · 召回",
    navLabel: "召回",
    h1: `婴儿车召回：这份数据里记录显示了什么`,
    lead: `本目录含有 ${recallRecords} 条召回记录。支撑这八页的 CMS 快照没有任何召回字段，所以本页直说缺失，解释 EN 1888 标记能预测和不能预测什么，并指向真正持有召回数据的权威机构。`,
    absentTitle: "这份快照不含召回记录",
    absentLead: `诚实的结论是一个缺失的字段，而不是"没问题"的健康证。`,
    absentBody: `在全部 ${total} 款婴儿车里，数据集记录了 ${recallRecords} 起召回通告。生成器采集了价格、重量、尺寸、年龄、形态、合规与买家摘要——但没有召回或安全警报字段。所以本页能说有什么，也必须说召回不在其中。`,
    enTitle: "EN 1888 合规能预测、不能预测什么",
    enLead: `我们唯一有的安全标记是普适的，而且它不是召回信号。`,
    enBody: `${enCount} / ${total} 款带 EN 1888。每款车都符合的标准，无法告诉你某款具体型号后来是否被召回——召回关乎生产批次或设计缺陷，而非基线标准。标记与未来的召回是两件独立的事。`,
    whereTitle: "去哪里查婴儿车召回",
    whereLead: `能回答召回问题的数据，在这份目录之外。`,
    whereBody: `美国由消费品安全委员会（CPSC）发布婴儿车召回；欧盟是 RAPEX 快速预警系统。两者都未镜像到这份快照里，所以核对具体型号的买家应当直接去查那些权威机构，而不是本页。`,
    gapTitle: "一个字段的缺失意味着什么",
    gapLead: `放在这里，是不让缺口被误当成保证。`,
    gapField: `没有召回字段——现有 ${recallRecords} 条记录，所以 ${total} 款里任何一款都不能声称"从未被召回"。`,
    gapScope: `范围——这只是某零售商某一时刻的目录；它不是安全登记册，也从未被设计成那样。`,
    gapVerify: `未核实——合规标记与摘要都照零售商所写；我们没拿它们去和监管机构的清单比对。`,
    rosterTitle: "四十五款，并展示召回字段",
    rosterLead: `按形态排序。召回列每一行按构造都是"本快照未含"。`,
    colBrand: "品牌",
    colModel: "型号",
    colType: "类型",
    colEn: "EN 1888",
    colRecall: "召回记录",
    notStated: "本快照未含",
    methodTitle: "这些数字是怎么读出来的",
    methodBody: [
      `数据源：CMS 产品快照，限定 id 命名空间 stroller-* 且 category 为 "stroller"，再剔除约 ${d.totals.droppedNonStroller} 个共享前缀却不是婴儿车的条目。剩下 ${total} 款在售。`,
      `每个数字都是零售商声明的值；重量按磅、尺寸按英寸，照 listing 所写，未经实测。`,
      `成员资格由 id 命名空间决定，而非营销名。自称"旅行系统"的车仍然只是一行；共享前缀的安全座椅则被剔除。`,
      `EN 1888 是本目录给全部 ${d.totals.withCompliance} 款婴儿车贴的欧洲安全标准，按声明记录，未核实认证。`,
      `召回不是这份快照里的字段，所以召回计数按构造就是 ${recallRecords}；我们未导入 CPSC 或 RAPEX 数据。`,
    ],
  },
};

type SRow = (typeof STROLLER_DATASET)["rows"][number];

export const kidsStrollerRecallColumns = (t: StrollerRecallStrings) => [
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
    key: "en",
    header: t.colEn,
    render: (r: never) => ((r as SRow).compliance.includes("EN1888") ? "yes" : "no"),
  },
  {
    key: "recall",
    header: t.colRecall,
    render: () => t.notStated,
  },
];

export const kidsStrollerRecallVars = {
  total,
  enCount,
  recallRecords,
};

export const kidsStrollerRecallIcons = {
  file: FileX2,
  shield: ShieldCheck,
  link: ExternalLink,
  gap: TriangleAlert,
  table: Table2,
};
