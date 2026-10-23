/**
 * /kids-scooter-safety/ — what the compliance field does and does not prove.
 *
 * All 7 listings carry both ASTM F963 and CPSC in their compliance field, which
 * makes this the only kids-scooter page with complete coverage — and that
 * completeness is the problem worth reporting. A compliance flag says a
 * manufacturer listed a standard. It does not say the product was tested, when,
 * or by whom, and none of these listings names a certificate, a test report or
 * a certification body.
 *
 * So this page reports the uniformity as the finding: 7 of 7 on both standards
 * means the field carries no discriminating information at all. A shopper
 * comparing two scooters cannot use it to tell them apart, and the page says so
 * rather than presenting a full bar chart as if it meant something.
 *
 * The safety-relevant specifications that ARE published — brake style, wheel
 * material, suspension — are reported alongside, because those vary and do
 * differentiate.
 */
import { ShieldCheck, FileCheck, AlertTriangle, Table2 } from "lucide-react";
import { SCOOTER_DATASET } from "./scooterData.generated";
import { rosterLabel, type ScooterColumn } from "../components/ScooterAssetPage";

export { SCOOTER_DATASET };
export const KIDS_SCOOTER_SAFETY_PATH = "/kids-scooter-safety-standards/";

const d = SCOOTER_DATASET;
const total = d.totals.kidsScooters;

const astm = d.complianceTally["ASTM F963"] ?? 0;
const cpsc = d.complianceTally["CPSC"] ?? 0;

/** Specifications that actually vary between these listings. */
export const kidsScooterSafetySpecs = () => ({
  withBrake: d.totals.withBrakeStyle,
  brakeKinds: [...new Set(d.rows.map((r) => r.brakeStyle).filter(Boolean))],
  withSuspension: d.totals.withSuspension,
  suspensionKinds: [...new Set(d.rows.map((r) => r.suspensionType).filter(Boolean))],
  wheelMaterials: [...new Set(d.rows.map((r) => r.wheelMaterial).filter(Boolean))],
  frameMaterials: [...new Set(d.rows.map((r) => r.frameMaterial).filter(Boolean))],
  allRearBrake: d.rows.filter((r) => r.brakeStyle).every((r) => /rear/i.test(r.brakeStyle)),
});

export interface ScooterSafetyStrings {
  eyebrow: string;
  navLabel: string;
  h1: string;
  lead: string;
  coverageTitle: string;
  coverageLead: string;
  proveTitle: string;
  proveLead: string;
  proveDoes: string;
  proveDoesnt: string;
  specsTitle: string;
  specsLead: string;
  specsBrake: string;
  specsWheel: string;
  specsFrame: string;
  gapTitle: string;
  gapLead: string;
  gapCert: string;
  gapTest: string;
  gapHelmet: string;
  rosterTitle: string;
  rosterLead: string;
  colBrand: string;
  colModel: string;
  colAstm: string;
  colCpsc: string;
  colBrake: string;
  colWheelMat: string;
  notStated: string;
  stated: string;
  methodTitle: string;
  methodBody: string[];
}

export const kidsScooterSafetyStrings: Record<"en" | "zh", ScooterSafetyStrings> = {
  en: {
    eyebrow: "Plan-B asset · safety standards",
    navLabel: "Safety standards",
    h1: `Kids Scooter Safety Standards: ${total} of ${total} Claim ASTM F963`,
    lead: `Every kids' kick scooter in this catalogue carries the same two compliance marks: ASTM F963, the US toy safety standard, and a CPSC listing. ${astm} of ${total} state the first, ${cpsc} of ${total} the second. A perfect score on this page is therefore not a signal about any individual scooter — it means the field carries no information that would separate one product from another.`,
    coverageTitle: "The coverage, and why it is uninformative",
    coverageLead: `Two bars, both full. Uniform compliance is worth reporting precisely because it is uninformative: a shopper cannot use this field to choose between these seven scooters, and a page that presented it as a discriminator would be misleading. What the field does establish is that no listing in this set is absent from the standard entirely.`,
    proveTitle: "What a compliance mark does and does not establish",
    proveLead: `This distinction matters more than the count, because the count looks reassuring and the distinction is what a buyer actually needs.`,
    proveDoes: `A compliance entry tells you the manufacturer or retailer has declared that the product falls under a named standard. ASTM F963 is the mandatory US toy safety standard; a CPSC listing indicates the product appears in the commission's records.`,
    proveDoesnt: `It does not tell you the product was tested, when it was tested, by whom, or that it passed on the current revision of the standard. None of these ${total} listings names a certificate number, a test laboratory, or a certification body. The mark is a claim of applicability, not a published test result.`,
    specsTitle: "The safety specifications that do vary",
    specsLead: `These are the fields where the seven listings genuinely differ, and they are more useful for a safety comparison than the compliance marks are.`,
    specsBrake: `Braking — ${d.totals.withBrakeStyle} of ${total} state a brake style and ${kidsScooterSafetySpecs().allRearBrake ? "every one of them is rear braking" : "they are not uniform"}. The remaining ${total - d.totals.withBrakeStyle} listings name no braking system at all, which for a child's scooter is a more consequential omission than a missing wheel size.`,
    specsWheel: `Wheel material — ${kidsScooterSafetySpecs().wheelMaterials.length} distinct materials appear across the listings that state one: ${kidsScooterSafetySpecs().wheelMaterials.join(", ")}. Polyurethane dominates.`,
    specsFrame: `Frame material — ${kidsScooterSafetySpecs().frameMaterials.length} distinct materials: ${kidsScooterSafetySpecs().frameMaterials.join(", ")}. Aluminium is the common choice, with one listing specifying aluminium metal and engineered ABS.`,
    gapTitle: "What a safety page cannot tell you from this catalogue",
    gapLead: `Stated plainly, because a page titled "safety standards" invites the assumption that the safety question has been answered.`,
    gapCert: `No certificate — none of the ${total} listings carries a certificate number, test report reference or certification body name. The compliance field is a bare list of standard names.`,
    gapTest: `No test date — nothing in these records says when any compliance check was performed, so there is no way to tell whether a listing reflects the current standard or an older revision of it.`,
    gapHelmet: `No helmet guidance — a compliance mark covers the product, not the rider. None of these listings states whether a helmet is recommended or required, and this page does not supply one either. Helmet guidance on this site lives on the balance-bike and kids-bike safety pages, where it is sourced.`,
    rosterTitle: "Compliance and safety specifications",
    rosterLead: `The two compliance columns will look identical down the page — that is the finding. The brake and wheel material columns are where the listings actually differ.`,
    colBrand: "Brand",
    colModel: "Model",
    colAstm: "ASTM F963",
    colCpsc: "CPSC",
    colBrake: "Brake",
    colWheelMat: "Wheel material",
    notStated: "not stated",
    stated: "stated",
    methodTitle: "How compliance was read",
    methodBody: [
      `Source: the CMS product snapshot filtered to categoryId "scooters" and to the listings Stage 1 keeps — ${total} published listings.`,
      `Compliance values are taken from the listing's compliance field as recorded. They are not verified against a certificate database, and no certificate was looked up because none is referenced.`,
      `The standards are named as they appear in the source: "ASTM F963" and "CPSC". No standard has been paraphrased, expanded or mapped to a national equivalent.`,
      `Brake, suspension, wheel and frame materials are reproduced from the specification record. Nothing was tested, and no product was handled.`,
    ],
  },
  zh: {
    eyebrow: "Plan-B 资产页 · 安全标准",
    navLabel: "安全标准",
    h1: `童车滑板车安全标准：${total} 款全部声称符合 ASTM F963`,
    lead: `本目录里每一款童用滑板车都带着同样两个合规标记：ASTM F963（美国玩具安全标准）和 CPSC 登记。${total} 款中有 ${astm} 款声明前者、${cpsc} 款声明后者。所以这一页的"满分"并不说明任何一款具体产品——它只说明这个字段不含任何能把产品区分开来的信息。`,
    coverageTitle: "覆盖率，以及它为什么没有参考价值",
    coverageLead: `两条都是满格。正因为合规声明高度一致，才值得如实说明：读者无法用这个字段在这七款之间做选择；如果把它包装成选购依据，就是误导。它能确立的只有一件事——这个集合里没有任何一款是完全没有声明标准的。`,
    proveTitle: "合规标记能证明什么、不能证明什么",
    proveLead: `这个区别比计数更重要：计数看起来让人安心，而买家真正需要的恰恰是这个区别。`,
    proveDoes: `合规条目说明制造商或零售商声明该产品属于某项具名标准的范围。ASTM F963 是美国强制的玩具安全标准；CPSC 登记表示该产品出现在委员会的记录中。`,
    proveDoesnt: `它不能说明产品是否经过检测、何时检测、由谁检测，也不能说明它在标准现行版本下是否合格。这 ${total} 款 listing 中没有任何一款给出证书编号、检测实验室或认证机构。这个标记是"适用范围声明"，不是公开的检测结果。`,
    specsTitle: "真正有差异的安全规格",
    specsLead: `这些字段是七款之间确实不同的地方，用它们做安全对比比合规标记更有用。`,
    specsBrake: `刹车——${total} 款中有 ${d.totals.withBrakeStyle} 款写了刹车形式，${kidsScooterSafetySpecs().allRearBrake ? "而且全部是后刹" : "且并不统一"}。剩下 ${total - d.totals.withBrakeStyle} 款完全没写任何刹车系统——对儿童滑板车来说，这比缺一个轮径尺寸更值得在意。`,
    specsWheel: `轮子材质——写了材质的 listing 里有 ${kidsScooterSafetySpecs().wheelMaterials.length} 种不同材质：${kidsScooterSafetySpecs().wheelMaterials.join("、")}。聚氨酯（PU）占主流。`,
    specsFrame: `车架材质——共 ${kidsScooterSafetySpecs().frameMaterials.length} 种：${kidsScooterSafetySpecs().frameMaterials.join("、")}。铝合金是常见选择，其中一款写的是铝合金加工程塑料（ABS）。`,
    gapTitle: "仅凭这份目录，一页「安全标准」回答不了什么",
    gapLead: `直说，因为标题写着"安全标准"的页面，容易让人以为安全问题已经有答案了。`,
    gapCert: `没有证书——${total} 款中没有一款带证书编号、检测报告编号或认证机构名称。合规字段只是一串标准名称。`,
    gapTest: `没有检测时间——这些记录里没有任何信息说明合规检测是什么时候做的，因此无法判断某条 listing 反映的是现行标准还是更早的版本。`,
    gapHelmet: `没有头盔指引——合规标记覆盖的是产品，不是骑手。这些 listing 都没有说明是否建议或要求佩戴头盔，本页也不会自己补一个。本站关于头盔的说法在平衡车与童车安全页上，并且是有来源的。`,
    rosterTitle: "合规与安全规格",
    rosterLead: `两列合规信息从上到下一模一样——这正是本页的结论。真正有差异的是刹车与轮子材质两列。`,
    colBrand: "品牌",
    colModel: "型号",
    colAstm: "ASTM F963",
    colCpsc: "CPSC",
    colBrake: "刹车",
    colWheelMat: "轮子材质",
    notStated: "未说明",
    stated: "已声明",
    methodTitle: "合规信息是怎么读取的",
    methodBody: [
      `数据源：CMS 产品快照筛选 categoryId 为 "scooters" 并只保留阶段一保留的 listing，共 ${total} 款。`,
      `合规值按 listing 的 compliance 字段原样记录。没有与证书数据库做核对，也没有查询证书——因为没有任何一条引用了证书。`,
      `标准名称按源数据原样保留："ASTM F963" 与 "CPSC"。没有改写、扩写或对应到任何国家标准版本。`,
      `刹车、避震、轮子与车架材质均按规格记录复现。全程没有实测，也没有上手试骑。`,
    ],
  },
};

export const kidsScooterSafetyColumns = (t: ScooterSafetyStrings): ScooterColumn[] => [
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
    key: "astm",
    header: t.colAstm,
    render: (r: never) =>
      (r as { compliance?: string[] }).compliance?.includes("ASTM F963") ? t.stated : t.notStated,
  },
  {
    key: "cpsc",
    header: t.colCpsc,
    render: (r: never) =>
      (r as { compliance?: string[] }).compliance?.includes("CPSC") ? t.stated : t.notStated,
  },
  {
    key: "brake",
    header: t.colBrake,
    render: (r: never) => (r as { brakeStyle?: string }).brakeStyle || t.notStated,
  },
  {
    key: "wheelMat",
    header: t.colWheelMat,
    render: (r: never) => (r as { wheelMaterial?: string }).wheelMaterial || t.notStated,
  },
];

export const kidsScooterSafetyVars = {
  total,
  astm,
  cpsc,
  ...kidsScooterSafetySpecs(),
};

export const kidsScooterSafetyIcons = {
  shield: ShieldCheck,
  cert: FileCheck,
  gap: AlertTriangle,
  table: Table2,
};