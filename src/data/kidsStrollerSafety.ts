/**
 * /kids-stroller-safety-standards/ — the compliance mark and the safety
 * features that actually vary.
 *
 * Every stroller in the catalogue claims EN 1888, so the mark separates nothing
 * — it is present on all 45. The page therefore turns to the features that do
 * vary: the harness is five-point on 44 of 45, but a brake is stated on only 25,
 * a canopy on 18, a basket on 14, and car-seat compatibility on 10. The honest
 * message is that the one badge everyone shares proves less than the features
 * that differ.
 */
import { ShieldCheck, BadgeCheck, Lock, Umbrella, TriangleAlert, Table2 } from "lucide-react";
import { STROLLER_DATASET } from "./strollerData.generated";

export { STROLLER_DATASET };
export const KIDS_STROLLER_SAFETY_PATH = "/kids-stroller-safety-standards/";

const d = STROLLER_DATASET;
const total = d.totals.strollers;
const enCount = d.complianceTally.EN1888;
const fivePoint = d.rows.filter((r) => r.harness === "5 Point").length;
const threePoint = d.rows.filter((r) => r.harness === "3 Point").length;
const canopy = d.rows.filter((r) => r.hasCanopy).length;
const brake = d.rows.filter((r) => r.hasBrake).length;
const basket = d.rows.filter((r) => r.hasBasket).length;
const carSeat = d.rows.filter((r) => r.carSeatCompatible).length;

export interface StrollerSafetyStrings {
  eyebrow: string;
  navLabel: string;
  h1: string;
  lead: string;
  markTitle: string;
  markLead: string;
  coverTitle: string;
  coverLead: string;
  coverBody: string;
  harnessTitle: string;
  harnessLead: string;
  harnessBody: string;
  featuresTitle: string;
  featuresLead: string;
  featuresBrake: string;
  featuresCanopy: string;
  featuresBasket: string;
  featuresCarSeat: string;
  gapTitle: string;
  gapLead: string;
  gapProve: string;
  gapTest: string;
  gapRegion: string;
  rosterTitle: string;
  rosterLead: string;
  colBrand: string;
  colModel: string;
  colEn: string;
  colHarness: string;
  colCanopy: string;
  colBrake: string;
  colBasket: string;
  colCarSeat: string;
  notStated: string;
  methodTitle: string;
  methodBody: string[];
}

export const kidsStrollerSafetyStrings: Record<"en" | "zh", StrollerSafetyStrings> = {
  en: {
    eyebrow: "Plan-B asset · safety",
    navLabel: "Safety standards",
    h1: `Stroller Safety: EN 1888 Compliance on All ${total}`,
    lead: `All ${total} strollers in this catalogue claim EN 1888, so the badge is present on every row and separates nothing. The page turns instead to the safety features that actually differ — the harness is five-point on ${fivePoint} of ${total}, but a brake is stated on only ${brake}, a canopy on ${canopy}, a basket on ${basket} and car-seat compatibility on ${carSeat}.`,
    markTitle: "Every stroller claims EN 1888",
    markLead: `The compliance mark is universal here, which is why it cannot rank a stroller.`,
    coverTitle: "What the EN 1888 mark actually covers",
    coverLead: `A badge that is on all ${total} strollers is worth understanding, not just counting.`,
    coverBody: `EN 1888 is the European standard for wheeled child conveyances — it sets requirements for the brake, the restraint, the stability and the structural strength of a stroller. ${enCount} of ${total} strollers carry it. Because it is universal in this catalogue, it tells a parent a stroller cleared a baseline, not that one stroller is safer than another.`,
    harnessTitle: "The harness is almost always five-point",
    harnessLead: `The restraint is the one safety feature that is near-universal.`,
    harnessBody: `${fivePoint} of ${total} strollers use a five-point harness; only ${threePoint} uses a three-point. The five-point is the stronger restraint, so this is the feature a parent can count on almost everywhere.`,
    featuresTitle: "Brakes, canopies and baskets vary widely",
    featuresLead: `These are stated per listing and the spread is wide.`,
    featuresBrake: `Brake stated — ${brake} of ${total}. More than ${total - brake} strollers do not state a brake in the structured fields, so on those the parking brake is unknown from the listing.`,
    featuresCanopy: `Canopy stated — ${canopy} of ${total}. A sun shade is absent or unstated on ${total - canopy}, which matters for a newborn in direct sun.`,
    featuresBasket: `Basket stated — ${basket} of ${total}. Under-seat storage is the feature most often missing from the lighter frames.`,
    featuresCarSeat: `Car-seat compatible — ${carSeat} of ${total}. The rest are not listed as a travel system, so an infant carrier will not click in.`,
    gapTitle: "What a compliance mark cannot prove",
    gapLead: `Stated because the badge answers the wrong question for a buyer.`,
    gapProve: `The mark proves a baseline, not a ranking — ${enCount} of ${total} carry EN 1888, so it cannot separate one stroller from another.`,
    gapTest: `No test report is named — the catalogue records the mark but not the certificate or the lab, so the claim is unverified here.`,
    gapRegion: `Region mismatch — EN 1888 is European; a stroller sold elsewhere may meet a different standard that the listing does not state.`,
    rosterTitle: "EN 1888 marks beside the safety features",
    rosterLead: `Sorted by form. The features show "yes" only where the listing stated them.`,
    colBrand: "Brand",
    colModel: "Model",
    colEn: "EN 1888",
    colHarness: "Harness",
    colCanopy: "Canopy",
    colBrake: "Brake",
    colBasket: "Basket",
    colCarSeat: "Car seat",
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
    eyebrow: "Plan-B 资产页 · 安全",
    navLabel: "安全标准",
    h1: `婴儿车安全：全部 ${total} 款均符合 EN 1888`,
    lead: `本目录全部 ${total} 款婴儿车都声称符合 EN 1888，所以徽章每行都有，分不出高下。本页转而看真正有差异的安全配置——${fivePoint} / ${total} 款用五点式安全带，但写明刹车的只有 ${brake} 款、遮阳篷 ${canopy} 款、置物篮 ${basket} 款、兼容安全座椅 ${carSeat} 款。`,
    markTitle: "每款车都声称符合 EN 1888",
    markLead: `合规标记在这里是普适的，这正是它无法给车排名的原因。`,
    coverTitle: "EN 1888 标记到底覆盖什么",
    coverLead: `一个 ${total} 款全有的徽章，值得去理解，而不只是计数。`,
    coverBody: `EN 1888 是针对轮式儿童运载工具的欧洲标准——它对婴儿车的刹车、约束装置、稳定性与结构强度提出要求。${enCount} / ${total} 款带有它。因为它在本目录里是普适的，它告诉家长某款车过了基线，而不是某款比另一款更安全。`,
    harnessTitle: "安全带几乎总是五点式",
    harnessLead: `约束装置是唯一近乎普适的安全配置。`,
    harnessBody: `${fivePoint} / ${total} 款用五点式安全带；只有 ${threePoint} 款用三点式。五点式是更强的约束，所以这是家长几乎处处可以指望的配置。`,
    featuresTitle: "刹车、遮阳篷与置物篮差异很大",
    featuresLead: `这些都是按 listing 声明的，而且跨度很大。`,
    featuresBrake: `写明刹车——${brake} / ${total}。超过 ${total - brake} 款没在结构化字段里写刹车，所以那些车的驻车刹车从 listing 看是未知的。`,
    featuresCanopy: `写明遮阳篷——${canopy} / ${total}。${total - canopy} 款缺失或未写明遮阳篷，对直晒下的新生儿很要紧。`,
    featuresBasket: `写明置物篮——${basket} / ${total}。座下储物是轻量车架最常缺失的配置。`,
    featuresCarSeat: `兼容安全座椅——${carSeat} / ${total}。其余未列为旅行系统，所以婴儿提篮无法咔哒装入。`,
    gapTitle: "合规标记证明不了的事",
    gapLead: `放在这里，是因为徽章回答的是买家问错的问题。`,
    gapProve: `徽章证明的是基线，不是排名——${enCount} / ${total} 款都带 EN 1888，所以它无法把一款车从另一款里分出来。`,
    gapTest: `没点名任何测试报告——目录记录了标记，却没记录证书或实验室，所以这个声明在此未经核实。`,
    gapRegion: `地区错配——EN 1888 是欧洲的；销往别处的车可能符合另一个 listing 没写的标准。`,
    rosterTitle: "EN 1888 标记与其旁边的安全配置",
    rosterLead: `按形态排序。配置只在 listing 写明时才显示"是"。`,
    colBrand: "品牌",
    colModel: "型号",
    colEn: "EN 1888",
    colHarness: "安全带",
    colCanopy: "遮阳篷",
    colBrake: "刹车",
    colBasket: "置物篮",
    colCarSeat: "安全座椅",
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

export const kidsStrollerSafetyColumns = (t: StrollerSafetyStrings) => [
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
    key: "en",
    header: t.colEn,
    render: (r: never) => ((r as SRow).compliance.includes("EN1888") ? "yes" : "no"),
  },
  {
    key: "harness",
    header: t.colHarness,
    render: (r: never) => (r as SRow).harness || t.notStated,
  },
  {
    key: "canopy",
    header: t.colCanopy,
    render: (r: never) => ((r as SRow).hasCanopy ? "yes" : "no"),
  },
  {
    key: "brake",
    header: t.colBrake,
    render: (r: never) => ((r as SRow).hasBrake ? "yes" : "no"),
  },
  {
    key: "basket",
    header: t.colBasket,
    render: (r: never) => ((r as SRow).hasBasket ? "yes" : "no"),
  },
  {
    key: "carSeat",
    header: t.colCarSeat,
    render: (r: never) => ((r as SRow).carSeatCompatible ? "yes" : "no"),
  },
];

export const kidsStrollerSafetyVars = {
  total,
  enCount,
  fivePoint,
  threePoint,
  canopy,
  brake,
  basket,
  carSeat,
};

export const kidsStrollerSafetyIcons = {
  shield: ShieldCheck,
  badge: BadgeCheck,
  lock: Lock,
  umbrella: Umbrella,
  gap: TriangleAlert,
  table: Table2,
};
