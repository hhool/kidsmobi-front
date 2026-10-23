/**
 * /kids-ride-on-by-age/ — which child this car is for.
 *
 * Age is the decision a parent makes first and the figure this category states
 * worst. Nine of the fifteen listings carry an age label, but only four of those
 * nine labels contain a number at all: the other five say "Kid", "Kids" or
 * "Baby, Kid", which is a marketing word, not a measurement.
 *
 * The finding that matters is in the structured field rather than the label. The
 * manufacturer minimum age is 36 months for eleven of the fifteen listings, 12
 * months for one and 18 months for one, and the remaining two say 37 — which is
 * the same three-year floor written with a different number. So the floor is
 * effectively constant across the catalogue even though the machines range from a
 * 12.5 lb toddler wiggle car to a 55-inch 36V UTV.
 *
 * Two listings state a maximum age of 144 months — twelve years — for toys that
 * a twelve-year-old cannot physically sit in. The upper bound is stated
 * mechanically and means nothing on these machines.
 *
 * One listing's raw maximum is 1200 months, which is a hundred years. That value
 * is implausible on its face and is dropped rather than published; the row is
 * still counted so the page can report it.
 */
import { Baby, CalendarRange, Users, AlertTriangle, Table2 } from "lucide-react";
import { RIDE_ON_DATASET } from "./rideOnData.generated";
import { rideOnLabel, type RideOnColumn } from "../components/RideOnAssetPage";

export { RIDE_ON_DATASET };
export const KIDS_RIDE_ON_AGE_PATH = "/kids-ride-on-by-age/";

const d = RIDE_ON_DATASET;
const total = d.totals.rideOnCars;

/**
 * The age label split: a label with a number in it, a label with only words.
 *
 * The distinction is the page's subject. "3-8 years" is checkable against a
 * child's age; "Kid" is not.
 */
export const kidsRideOnAgeLabels = () => {
  const labelled = d.rows.filter((r) => (r.ageLabel || "").trim());
  const numeric = labelled.filter((r) => r.ageLabelNumeric);
  const wordOnly = labelled.filter((r) => !r.ageLabelNumeric);
  const unlabelled = d.rows.filter((r) => !(r.ageLabel || "").trim());
  return {
    labelled: labelled.length,
    numeric: numeric.length,
    wordOnly: wordOnly.length,
    unlabelled: unlabelled.length,
    wordOnlyLabels: [...new Set(wordOnly.map((r) => (r.ageLabel || "").trim()))].sort(),
    numericRows: numeric.map((r) => ({
      label: rideOnLabel(r),
      ageLabel: r.ageLabel,
      minMonths: r.minAgeMonths,
      maxMonths: r.maxAgeMonths,
    })),
    unlabelledRows: unlabelled.map((r) => rideOnLabel(r)),
  };
};

/** The manufacturer minimum-age field, bucketed. */
export const kidsRideOnAgeFloors = () => {
  const buckets = new Map<number, number>();
  for (const r of d.rows) {
    const v = r.minAgeMonths;
    if (v === null || v === undefined) continue;
    buckets.set(v, (buckets.get(v) || 0) + 1);
  }
  const sorted = [...buckets.entries()].sort((a, b) => a[0] - b[0]);
  const totalFloored = sorted.reduce((a, [, n]) => a + n, 0);
  return {
    buckets: sorted.map(([months, count]) => ({ months, count })),
    /** The single most common floor, and how many listings sit on it. */
    modal: sorted.sort((a, b) => b[1] - a[1])[0],
    totalFloored,
    withoutFloor: total - totalFloored,
  };
};

/** Maximum-age statements, including the one that was dropped as implausible. */
export const kidsRideOnAgeCeilings = () => {
  const stated = d.rows
    .filter((r) => r.maxAgeMonths !== null && r.maxAgeMonths !== undefined)
    .map((r) => ({
      label: rideOnLabel(r),
      months: r.maxAgeMonths as number,
      voltage: r.voltage,
    }))
    .sort((a, b) => b.months - a.months);
  const implausible = d.rows
    .filter((r) => r.implausibleMaxAge)
    .map((r) => ({
      label: rideOnLabel(r),
      rawMonths: r.rawMaxAgeMonths as number,
      rawYears: +((r.rawMaxAgeMonths as number) / 12).toFixed(1),
    }));
  return {
    stated: stated.length,
    rows: stated,
    implausible: implausible.length,
    implausibleRows: implausible,
    /** The most generous ceiling any listing claims. */
    widest: stated[0] ?? null,
  };
};

/** Which voltage tiers the youngest and oldest floors belong to. */
export const kidsRideOnAgeTiers = () =>
  [6, 12, 24, 36].map((v) => {
    const rows = d.rows.filter((r) => r.voltage === v);
    const floors = rows.map((r) => r.minAgeMonths).filter((m): m is number => typeof m === "number");
    return {
      volts: v,
      count: rows.length,
      floorMin: floors.length ? Math.min(...floors) : null,
      floorMax: floors.length ? Math.max(...floors) : null,
      labelled: rows.filter((r) => (r.ageLabel || "").trim()).length,
    };
  });

export interface RideOnAgeStrings {
  eyebrow: string;
  navLabel: string;
  h1: string;
  lead: string;
  labelTitle: string;
  labelLead: string;
  labelNumeric: string;
  labelWord: string;
  labelNone: string;
  floorTitle: string;
  floorLead: string;
  floorModal: string;
  floorSpread: string;
  ceilingTitle: string;
  ceilingLead: string;
  ceilingTwelve: string;
  ceilingImplausible: string;
  tierTitle: string;
  tierLead: string;
  gapTitle: string;
  gapLead: string;
  gapNoLabel: string;
  gapCeiling: string;
  gapWeight: string;
  rosterTitle: string;
  rosterLead: string;
  colBrand: string;
  colModel: string;
  colLabel: string;
  colMin: string;
  colMax: string;
  colTier: string;
  notStated: string;
  methodTitle: string;
  methodBody: string[];
}

export const kidsRideOnAgeStrings: Record<"en" | "zh", RideOnAgeStrings> = {
  en: {
    eyebrow: "Plan-B asset · age fit",
    navLabel: "Age fit",
    h1: `Kids Ride-On Age Range: ${total} Cars, Which Child They Suit`,
    lead: `Every parent starts here and this category answers badly. ${kidsRideOnAgeLabels().labelled} of the ${total} cars carry an age label, but only ${kidsRideOnAgeLabels().numeric} of those labels contain a number — the other ${kidsRideOnAgeLabels().wordOnly} say "Kid", "Kids" or "Baby, Kid". Underneath, the structured manufacturer minimum-age field is 36 months for ${kidsRideOnAgeFloors().modal?.[1]} of the ${total} listings, so the floor barely moves even though the machines range from a 12.5 lb toddler car to a 55-inch 36V UTV.`,
    labelTitle: "What the age label actually says",
    labelLead: `Three kinds of label appear in this catalogue, and only one of them can be checked against a child.`,
    labelNumeric: `A number — ${kidsRideOnAgeLabels().numeric} listings: ${kidsRideOnAgeLabels().numericRows.map((r) => `${r.label} ("${r.ageLabel}")`).join(", ")}. These are the only rows where the stated age can be compared with the child's age and with the machine's actual size.`,
    labelWord: `A word — ${kidsRideOnAgeLabels().wordOnly} listings say ${kidsRideOnAgeLabels().wordOnlyLabels.map((l) => `"${l}"`).join(", ")}. "Kid" spans roughly three to eight years and "Baby, Kid" spans wider still, so these labels are a marketing convenience rather than a specification.`,
    labelNone: `Nothing — ${kidsRideOnAgeLabels().unlabelled} listings carry no age label at all: ${kidsRideOnAgeLabels().unlabelledRows.join(", ")}. Each of those does have a manufacturer minimum age in months, which is why the floor section below has more coverage than this one.`,
    floorTitle: "The manufacturer floor is almost constant",
    floorLead: `The structured field is where a real number lives, and it barely varies. That is the finding: a category spanning a toddler trike and a 36V utility vehicle has one age floor for almost every product in it.`,
    floorModal: `The common floor — ${kidsRideOnAgeFloors().modal?.[1]} of the ${total} listings state ${kidsRideOnAgeFloors().modal?.[0]} months, that is three years, as the manufacturer minimum age. The two ${kidsRideOnAgeFloors().buckets.find((b) => b.months === 37)?.count ?? 0} listings at 37 months are almost certainly the same floor written differently rather than a deliberate age distinction.`,
    floorSpread: `The exceptions — the floor drops to ${kidsRideOnAgeFloors().buckets.find((b) => b.months === 12)?.count ?? 0} listing at 12 months and ${kidsRideOnAgeFloors().buckets.find((b) => b.months === 18)?.count ?? 0} at 18 months. Both are 12V machines, and both are among the lightest in the catalogue, so the one field that does move tracks physical size rather than stated age.`,
    ceilingTitle: "The upper bound is stated mechanically",
    ceilingLead: `Eleven listings state a maximum age and the numbers deserve a warning label.`,
    ceilingTwelve: `Twelve years — ${kidsRideOnAgeCeilings().rows.filter((r) => r.months === 144).length} listings state a maximum of 144 months. Both are 12V cars whose own published dimensions are around 30 inches long, for a child who would be roughly four times that child's height. The upper bound appears to be a form field filled in rather than a considered limit, and it should not be read as "suitable until twelve".`,
    ceilingImplausible: `One hundred years — ${kidsRideOnAgeCeilings().implausible} listing carries a raw maximum of ${kidsRideOnAgeCeilings().implausibleRows[0]?.rawMonths ?? 0} months, which is ${kidsRideOnAgeCeilings().implausibleRows[0]?.rawYears ?? 0} years. That value is dropped rather than published, and this row is listed under the not-stated ceiling. It is counted here so the omission is visible instead of silent.`,
    tierTitle: "Age follows the machine, not the label",
    tierLead: `Reading the tiers together says the same thing as the floor section and says it more clearly: the catalogue's age information tracks the size of the machine, and the labelled age is what varies least.`,
    gapTitle: "Three gaps a parent's decision runs into",
    gapLead: `Stated because a parent comparing a 12V truck against a 24V two-seater needs all three and cannot get them from the listings.`,
    gapNoLabel: `No usable label — ${kidsRideOnAgeLabels().labelled - kidsRideOnAgeLabels().numeric} of ${total} listings have an age label with no number in it, and ${kidsRideOnAgeLabels().unlabelled} have no label at all. Only ${kidsRideOnAgeLabels().numeric} rows can be compared against a child's age directly.`,
    gapCeiling: `No meaningful ceiling — of the ${kidsRideOnAgeCeilings().stated} stated maximum ages, ${kidsRideOnAgeCeilings().rows.filter((r) => r.months >= 96).length} are 96 months or more, on machines whose own dimensions make them unusable by a child that age. A parent who reads those numbers as endorsements would be misled.`,
    gapWeight: `No age-linked weight limit — the rider weight capacity a listing publishes is not tied to the age it states. The 24V two-seaters rated for 132 lb and the 12V truck rated for 66 lb have no age guidance attached to either figure, so the two cannot be reconciled from the record.`,
    rosterTitle: "Age statements as published",
    rosterLead: `The label column is the retailer's own wording. The minimum and maximum columns are the manufacturer months from the specification record.`,
    colBrand: "Brand",
    colModel: "Model",
    colLabel: "Age label",
    colMin: "Minimum age",
    colMax: "Maximum age",
    colTier: "Battery tier",
    notStated: "not stated",
    methodTitle: "How the ages were read",
    methodBody: [
      `Source: the CMS product snapshot, gated to the id namespace electric_vehicles-* with category "electric_car", minus the listings Stage 1 prunes — ${total} published cars.`,
      `The age label is the retailer's own Age Range Description, reproduced as written. A label is counted as numeric only when it contains a figure, so "3-8 years" counts and "Kid" does not.`,
      `Minimum and maximum ages are the manufacturer month fields from the user guide record. A maximum above the site's plausibility ceiling is dropped and counted separately rather than published; the threshold is defined in scripts/fetch_rideon_data.mjs.`,
      `No age was inferred from a product title, and no value was carried across from a sibling listing of the same model.`,
      `Nothing here was checked against a real child's height or weight.`,
    ],
  },
  zh: {
    eyebrow: "Plan-B 资产页 · 年龄适配",
    navLabel: "年龄适配",
    h1: `童用电动车适用年龄：${total} 款，适合哪个孩子`,
    lead: `每位家长都从这里开始，而这个类目答得很糟。${total} 款中有 ${kidsRideOnAgeLabels().labelled} 款带年龄标签，但带数字的只有 ${kidsRideOnAgeLabels().numeric} 款——另外 ${kidsRideOnAgeLabels().wordOnly} 款写的是 "Kid"、"Kids" 或 "Baby, Kid"。再往下看，结构化的厂商最低年龄字段对 ${total} 款中的 ${kidsRideOnAgeFloors().modal?.[1]} 款都是 36 个月，所以这个下限几乎不动——而这里的机器却从 12.5 磅的幼儿车一直到 55 英寸的 36V UTV。`,
    labelTitle: "年龄标签到底说了什么",
    labelLead: `这个目录里出现三类标签，只有一类能拿来和孩子对照。`,
    labelNumeric: `带数字——${kidsRideOnAgeLabels().numeric} 款：${kidsRideOnAgeLabels().numericRows.map((r) => `${r.label}（"${r.ageLabel}"）`).join("、")}。只有这几行能把公布的年龄与孩子的年龄、以及机器的真实尺寸对照起来。`,
    labelWord: `只有词——${kidsRideOnAgeLabels().wordOnly} 款写的是 ${kidsRideOnAgeLabels().wordOnlyLabels.map((l) => `"${l}"`).join("、")}。"Kid" 大致横跨三到八岁，"Baby, Kid" 跨度更大，所以这类标签是营销上的方便说法，而不是规格。`,
    labelNone: `什么都没有——${kidsRideOnAgeLabels().unlabelled} 款完全没有年龄标签：${kidsRideOnAgeLabels().unlabelledRows.join("、")}。这几款倒是有以月计的厂商最低年龄，这也是下面下限一节的覆盖度反而更高的原因。`,
    floorTitle: "厂商给的下限几乎是一个定值",
    floorLead: `真正的数字在结构化字段里，而它几乎不变。这正是本节的结论：一个从幼儿三轮车跨到 36V 工程车的类目，几乎所有产品共用同一个年龄下限。`,
    floorModal: `最常见的下限——${total} 款中有 ${kidsRideOnAgeFloors().modal?.[1]} 款把厂商最低年龄写成 ${kidsRideOnAgeFloors().modal?.[0]} 个月，也就是三岁。那 ${kidsRideOnAgeFloors().buckets.find((b) => b.months === 37)?.count ?? 0} 款写 37 个月的，几乎可以肯定是同一个下限换了个数字，而不是刻意区分年龄。`,
    floorSpread: `例外——下限降到 12 个月的有 ${kidsRideOnAgeFloors().buckets.find((b) => b.months === 12)?.count ?? 0} 款，18 个月的有 ${kidsRideOnAgeFloors().buckets.find((b) => b.months === 18)?.count ?? 0} 款。这两款都是 12V 机器，也都是全目录最轻的几台之一——所以唯一会动的那个字段，跟踪的是体积而不是声明的年龄。`,
    ceilingTitle: "上限是机械填出来的",
    ceilingLead: `有 ${kidsRideOnAgeCeilings().stated} 款写了最高适用年龄，这些数字需要加个警告标签。`,
    ceilingTwelve: `十二岁——${kidsRideOnAgeCeilings().rows.filter((r) => r.months === 144).length} 款写最高 144 个月。这两款都是 12V 车，公布的尺寸只有约 30 英寸长，而十二岁的孩子大约是那个孩子身高的四倍。这个上限看起来是表单字段填出来的，而不是仔细考虑过的界限，不该被读成"十二岁以内都能开"。`,
    ceilingImplausible: `一百年——有 ${kidsRideOnAgeCeilings().implausible} 款的原始最高年龄是 ${kidsRideOnAgeCeilings().implausibleRows[0]?.rawMonths ?? 0} 个月，也就是 ${kidsRideOnAgeCeilings().implausibleRows[0]?.rawYears ?? 0} 年。这个值一看就不合理，因此被丢弃而不是发布；该行的上限一栏显示为未说明。这里仍然计数，是为了让这个缺失是可见的而不是无声的。`,
    tierTitle: "年龄跟着机器走，不跟着标签走",
    tierLead: `把几个档位放在一起看，说的还是下限那一节的同一件事，而且更清楚：这个目录的年龄信息跟着机器尺寸走，而被标出来的年龄反而是最不变的那一个。`,
    gapTitle: "家长的判断会撞上的三个缺口",
    gapLead: `写在这里，是因为拿 12V 卡车和 24V 双座车作比较的家长三个都需要，而 listing 里都拿不到。`,
    gapNoLabel: `没有可用的标签——${total} 款中有 ${kidsRideOnAgeLabels().labelled - kidsRideOnAgeLabels().numeric} 款的标签不含数字，另有 ${kidsRideOnAgeLabels().unlabelled} 款根本没有标签。只有 ${kidsRideOnAgeLabels().numeric} 行能直接与孩子年龄对照。`,
    gapCeiling: `没有有意义的上限——${kidsRideOnAgeCeilings().stated} 个已公布的上限里，有 ${kidsRideOnAgeCeilings().rows.filter((r) => r.months >= 96).length} 个是 96 个月以上，而这些机器自己的尺寸决定那个年龄的孩子根本坐不上去。把它当推荐来读的家长会被误导。`,
    gapWeight: `没有与年龄挂钩的承重——listing 公布的乘员承重并没有和它声明的年龄绑定。承重 132 磅的 24V 双座车和承重 66 磅的 12V 卡车，两个数字都没有附带任何年龄指引，因此无法从记录里把两者对起来。`,
    rosterTitle: "各 listing 公布的年龄",
    rosterLead: `标签一列是零售商自己的措辞。最低与最高两列取自规格记录里的厂商月数。`,
    colBrand: "品牌",
    colModel: "型号",
    colLabel: "年龄标签",
    colMin: "最低年龄",
    colMax: "最高年龄",
    colTier: "电池档位",
    notStated: "未说明",
    methodTitle: "这些年龄是怎么读取的",
    methodBody: [
      `数据源：CMS 产品快照，限定 id 命名空间 electric_vehicles-* 且 category 为 "electric_car"，再剔除阶段一剪掉的 listing，共 ${total} 款在售。`,
      `年龄标签是零售商自己的 Age Range Description，原样呈现。只有标签里含数字时才计为"带数字"，所以 "3-8 years" 计入而 "Kid" 不计入。`,
      `最低与最高年龄取自用户指南记录里的厂商月数字段。超过本站合理性上限的最高值会被丢弃并单独计数，而不是发布出来；该阈值定义在 scripts/fetch_rideon_data.mjs。`,
      `没有任何年龄是从商品标题推断的，也没有从同款其他 listing 借用数值。`,
      `本页没有任何内容与真实儿童的身高或体重做过核对。`,
    ],
  },
};

/** Roster columns. The label leads because it is what the retailer shows. */
export const kidsRideOnAgeColumns = (t: RideOnAgeStrings): RideOnColumn[] => [
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
    key: "label",
    header: t.colLabel,
    render: (r: never) => (r as { ageLabel?: string }).ageLabel || t.notStated,
  },
  {
    key: "min",
    header: t.colMin,
    numeric: true,
    render: (r: never) => {
      const v = (r as { minAgeMonths?: number | null }).minAgeMonths;
      return v === null || v === undefined ? t.notStated : `${v} mo`;
    },
  },
  {
    key: "max",
    header: t.colMax,
    numeric: true,
    render: (r: never) => {
      const v = (r as { maxAgeMonths?: number | null }).maxAgeMonths;
      return v === null || v === undefined ? t.notStated : `${v} mo`;
    },
  },
  {
    key: "tier",
    header: t.colTier,
    numeric: true,
    render: (r: never) => {
      const v = (r as { voltage?: number | null }).voltage;
      return v === null || v === undefined ? t.notStated : `${v} V`;
    },
  },
];

export const kidsRideOnAgeVars = {
  total,
  labels: kidsRideOnAgeLabels(),
  floors: kidsRideOnAgeFloors(),
  ceilings: kidsRideOnAgeCeilings(),
  tiers: kidsRideOnAgeTiers(),
};

export const kidsRideOnAgeIcons = {
  baby: Baby,
  calendar: CalendarRange,
  users: Users,
  gap: AlertTriangle,
  table: Table2,
};
