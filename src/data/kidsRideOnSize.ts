/**
 * /kids-ride-on-size/ — will it fit through the door, and will they fit in it.
 *
 * The sizing question for a ride-on car is not rider height; it is floor space
 * and doorway width, because these are the first wheeled toys on this site that
 * are bigger than a hallway. Fourteen of the fifteen listings publish a full
 * length × width × height, and the numbers are large enough to matter: the
 * widest car here is 34.6 inches across, and the longest is 55 inches.
 *
 * The honest finding is a source-data defect that changes how the page must be
 * read. The "Size" field on these listings is supposed to hold a size. On six of
 * the fifteen it holds a battery voltage ("12V"), on three it holds a dimension
 * string instead of the dimension record, on five it holds a size adjective
 * ("Small", "Large", "Extra Large", "A-With Roof") that means nothing measurable,
 * and on one it is empty. Every dimension on this page therefore comes from the
 * dimension record, never from the size field — and the size field is reported
 * here as its own finding rather than quietly ignored.
 *
 * Second finding: dimensions track voltage almost monotonically. The 12V group
 * runs 28.34–42.9 inches long, the 24V group 44–51.4, and the single 36V
 * machine is the longest at 55. A buyer who wants a small car can use the
 * length, but the reason the small ones are small is the battery.
 */
import { Ruler, DoorOpen, SquareStack, AlertTriangle, Table2 } from "lucide-react";
import { RIDE_ON_DATASET } from "./rideOnData.generated";
import { rideOnLabel, type RideOnColumn } from "../components/RideOnAssetPage";

export { RIDE_ON_DATASET };
export const KIDS_RIDE_ON_SIZE_PATH = "/kids-ride-on-size/";

const d = RIDE_ON_DATASET;
const total = d.totals.rideOnCars;

/**
 * What the "Size" field actually holds, classified.
 *
 * This is the page's central finding, so it is computed from the raw strings
 * rather than described in prose. A size field is only useful if it means
 * something, and on this catalogue it means five different things.
 */
export const kidsRideOnSizeFieldKinds = () => {
  const rows = d.rows.map((r) => {
    const raw = (r.sizeLabelRaw || "").trim();
    let kind: "voltage" | "dimensions" | "adjective" | "empty" = "empty";
    if (!raw) kind = "empty";
    else if (/^\d+\s*V\b/i.test(raw) || /^\d+V\s*-\s*\d+\s*seater/i.test(raw)) kind = "voltage";
    else if (/\d/.test(raw) && /[x×*]/i.test(raw)) kind = "dimensions";
    else kind = "adjective";
    return { row: r, raw, kind };
  });
  const by = (k: string) => rows.filter((x) => x.kind === k);
  return {
    voltage: by("voltage").length,
    dimensions: by("dimensions").length,
    adjective: by("adjective").length,
    empty: by("empty").length,
    adjectives: [...new Set(by("adjective").map((x) => x.raw))].sort(),
    all: rows,
  };
};

/** Listings that publish a complete length × width × height. */
export const kidsRideOnSizeRows = () =>
  d.rows
    .filter((r) => r.lengthIn !== null && r.widthIn !== null && r.heightIn !== null)
    .map((r) => ({
      id: r.id,
      label: rideOnLabel(r),
      lengthIn: r.lengthIn as number,
      widthIn: r.widthIn as number,
      heightIn: r.heightIn as number,
      /** Floor area in square feet, computed here — no listing publishes it. */
      footprintSqFt: +(((r.lengthIn as number) * (r.widthIn as number)) / 144).toFixed(1),
      voltage: r.voltage,
      price: r.price,
    }))
    .sort((a, b) => a.lengthIn - b.lengthIn);

/** The longest, the widest, the tallest and the smallest footprint. */
export const kidsRideOnSizeExtremes = () => {
  const rows = kidsRideOnSizeRows();
  const longest = [...rows].sort((a, b) => b.lengthIn - a.lengthIn)[0];
  const widest = [...rows].sort((a, b) => b.widthIn - a.widthIn)[0];
  const tallest = [...rows].sort((a, b) => b.heightIn - a.heightIn)[0];
  const smallest = [...rows].sort((a, b) => a.footprintSqFt - b.footprintSqFt)[0];
  const largest = [...rows].sort((a, b) => b.footprintSqFt - a.footprintSqFt)[0];
  return { longest, widest, tallest, smallest, largest };
};

/** Length range within one voltage tier — the tiers are what size the cars. */
export const kidsRideOnSizeTiers = () =>
  [6, 12, 24, 36].map((v) => {
    const rows = kidsRideOnSizeRows().filter((r) => r.voltage === v);
    return {
      volts: v,
      count: rows.length,
      lengthMin: rows.length ? Math.min(...rows.map((r) => r.lengthIn)) : null,
      lengthMax: rows.length ? Math.max(...rows.map((r) => r.lengthIn)) : null,
    };
  });

export interface RideOnSizeStrings {
  eyebrow: string;
  navLabel: string;
  h1: string;
  lead: string;
  fieldTitle: string;
  fieldLead: string;
  fieldVoltage: string;
  fieldDimensions: string;
  fieldAdjective: string;
  fieldEmpty: string;
  rangeTitle: string;
  rangeLead: string;
  rangeLongest: string;
  rangeWidest: string;
  rangeTallest: string;
  doorTitle: string;
  doorLead: string;
  tierTitle: string;
  tierLead: string;
  gapTitle: string;
  gapLead: string;
  gapAssembly: string;
  gapFold: string;
  gapTires: string;
  rosterTitle: string;
  rosterLead: string;
  colBrand: string;
  colModel: string;
  colLength: string;
  colWidth: string;
  colHeight: string;
  colFootprint: string;
  colSizeField: string;
  notStated: string;
  methodTitle: string;
  methodBody: string[];
}

export const kidsRideOnSizeStrings: Record<"en" | "zh", RideOnSizeStrings> = {
  en: {
    eyebrow: "Plan-B asset · size and footprint",
    navLabel: "Size and footprint",
    h1: `Kids Ride-On Size: Length, Width and Floor Space, ${total} Cars`,
    lead: `A ride-on car is the first thing on this site that a family has to get through a doorway. Of the ${total} children's ride-on cars published here, ${d.totals.withDimensions} give a full length, width and height. The largest of them is ${kidsRideOnSizeExtremes().longest.lengthIn} inches long and ${kidsRideOnSizeExtremes().widest.widthIn} inches wide — wider than a standard interior door.`,
    fieldTitle: "The size field does not contain a size",
    fieldLead: `The catalogue has a field called "Size" and a buyer would reasonably expect a measurement in it. On these listings it holds something else, and the page classifies what it actually holds rather than reading it as a dimension. The classification is computed from the raw strings, so the counts can be checked against the generated dataset.`,
    fieldVoltage: `A battery voltage — ${kidsRideOnSizeFieldKinds().voltage} of ${total} listings put a voltage here, such as "12V" or "24V - 2 Seater". The same number appears in the product title, which is why the voltage page counts it as a title-sourced figure.`,
    fieldDimensions: `A dimension string — ${kidsRideOnSizeFieldKinds().dimensions} listings put a measurement in the size field while the dimension record holds one too. Where both exist the dimension record is used here, because it parses into three separate numbers.`,
    fieldAdjective: `A size word — ${kidsRideOnSizeFieldKinds().adjective} listings put a word or trim name here: ${kidsRideOnSizeFieldKinds().adjectives.join(", ")}. None of those can be checked against a measurement, and "Small" in this set belongs to a 28.34-inch car while "Extra Large" belongs to a 44-inch one. "A-With Roof" is not a size at all but a trim designation.`,
    fieldEmpty: `Nothing — ${kidsRideOnSizeFieldKinds().empty} listing leaves the field empty. It does publish a dimension record, so it appears in the table below; but the field a shopper would look to for a size holds no information for them.`,
    rangeTitle: "How big these cars actually are",
    rangeLead: `Lengths run from ${kidsRideOnSizeRows()[0].lengthIn} to ${kidsRideOnSizeExtremes().longest.lengthIn} inches and widths from ${Math.min(...kidsRideOnSizeRows().map((r) => r.widthIn))} to ${kidsRideOnSizeExtremes().widest.widthIn}. Heights run from ${Math.min(...kidsRideOnSizeRows().map((r) => r.heightIn))} to ${kidsRideOnSizeExtremes().tallest.heightIn} inches, and the tallest one is the only car here with a roof — that single canopy accounts for most of the difference.`,
    rangeLongest: `Longest — the ${kidsRideOnSizeExtremes().longest.label} at ${kidsRideOnSizeExtremes().longest.lengthIn} inches. It is also the most expensive listing in the catalogue and the only 36V machine in it.`,
    rangeWidest: `Widest — the ${kidsRideOnSizeExtremes().widest.label} at ${kidsRideOnSizeExtremes().widest.widthIn} inches across. A US interior door leaf is roughly 32 to 36 inches wide, so this one sits at or beyond the width of a standard doorway, and it is the only listing in this catalogue wider than 32 inches.`,
    rangeTallest: `Tallest — the ${kidsRideOnSizeExtremes().tallest.label} at ${kidsRideOnSizeExtremes().tallest.heightIn} inches, which is a roof rather than a roll bar. It is worth separating from the rest: the height of a car without a canopy is a seat-back measurement, and the height of one with a canopy is a garage measurement.`,
    doorTitle: "Floor space is the figure nobody publishes",
    doorLead: `A car's length and width decide whether it fits in a hallway; its footprint decides whether it fits in a room. No listing publishes a floor area, so the column below is computed here from the two dimensions the listings do give.`,
    tierTitle: "Size follows the battery",
    tierLead: `Length rises with voltage across the whole catalogue, which is why the size question and the battery question turn out to be the same question.`,
    gapTitle: "Three measurements that decide fit, and are not here",
    gapLead: `Stated because a parent measuring a garage will ask for exactly these.`,
    gapAssembly: `Assembled size versus packed size — ${d.totals.withAssembly} of ${total} listings say assembly is required, and every dimension on this page is presumably the assembled figure, but no listing publishes a packed size or a folded one. A car that has to be carried up a staircase exists in this catalogue and cannot be measured for that journey from these records.`,
    gapFold: `Whether it comes apart — no listing states whether the vehicle disassembles. The ${kidsRideOnSizeExtremes().widest.label} at ${kidsRideOnSizeExtremes().widest.widthIn} inches wide is the case where this matters most, and it is exactly the case no listing addresses.`,
    gapTires: `Wheel and tyre diameter — not one listing publishes a tyre size, although the descriptions mention 8-inch and 14-inch wheels in prose. The published height includes the wheels, so the ride height a child sits at cannot be derived from it.`,
    rosterTitle: "Measured cars, smallest to longest",
    rosterLead: `All figures in inches. Footprint is length times width divided by 144 — computed here, since no listing publishes it. The last column is what the size field held.`,
    colBrand: "Brand",
    colModel: "Model",
    colLength: "Length",
    colWidth: "Width",
    colHeight: "Height",
    colFootprint: "Floor area",
    colSizeField: "Size field said",
    notStated: "not stated",
    methodTitle: "How the measurements were read",
    methodBody: [
      `Source: the CMS product snapshot, gated to the id namespace electric_vehicles-* with category "electric_car", minus the listings Stage 1 prunes — ${total} published cars.`,
      `Length, width and height come from the item dimension record, parsed into three numbers. Where a listing states a dimension string in the size field instead, the dimension record is still preferred because it parses cleanly; the size field is reported separately in its own column.`,
      `Floor area is computed here as length multiplied by width, divided by 144 to convert square inches to square feet. It appears in no listing and is not a published figure.`,
      `The size-field classification is a rule applied to the raw strings in src/data/rideOnData.generated.ts: a value that starts with a voltage is a voltage, a value containing both digits and a separator is a dimension string, any other non-empty value is an adjective.`,
      `Nothing here was measured with a tape. These are the retailers' own figures for their own products.`,
    ],
  },
  zh: {
    eyebrow: "Plan-B 资产页 · 尺寸与占地",
    navLabel: "尺寸与占地",
    h1: `童用电动车尺寸：长宽与占地面积，${total} 款`,
    lead: `电动车是本站第一种必须"从门里搬进去"的玩具。在这里的 ${total} 款童用电动车中，${d.totals.withDimensions} 款给出了完整的长、宽、高。最大的一款长 ${kidsRideOnSizeExtremes().longest.lengthIn} 英寸、宽 ${kidsRideOnSizeExtremes().widest.widthIn} 英寸——比标准室内门还宽。`,
    fieldTitle: "「Size」字段里装的不是尺寸",
    fieldLead: `目录里有一个叫 "Size" 的字段，买家理所当然会以为里面是尺寸。但这些 listing 里装的是别的东西，所以本页把它实际装了什么分类统计，而不是当作尺寸来读。分类是从原始字符串算出来的，计数可以拿去和生成的数据集核对。`,
    fieldVoltage: `电池电压——${total} 款中有 ${kidsRideOnSizeFieldKinds().voltage} 款在这里填了电压，比如 "12V" 或 "24V - 2 Seater"。同样的数字也出现在商品标题里，这也正是电压页把这类数字算作"来自标题"的原因。`,
    fieldDimensions: `尺寸字符串——${kidsRideOnSizeFieldKinds().dimensions} 款把尺寸写进了 size 字段，同时尺寸记录里也有。本页一律优先用尺寸记录，因为它能解析成三个独立数字。`,
    fieldAdjective: `尺寸形容词——${kidsRideOnSizeFieldKinds().adjective} 款填的是词：${kidsRideOnSizeFieldKinds().adjectives.join("、")}。这些词都无法与某个测量值对应，而且这组里 "Small" 属于一台 28.34 英寸的车，"Extra Large" 属于一台 44 英寸的。`,
    fieldEmpty: `什么都没有——${kidsRideOnSizeFieldKinds().empty} 款留空。它同时也是唯一没有尺寸记录的一款，所以这一行既给不出测量值，也给不出尺寸词。`,
    rangeTitle: "这些车到底有多大",
    rangeLead: `车长从 ${kidsRideOnSizeRows()[0].lengthIn} 到 ${kidsRideOnSizeExtremes().longest.lengthIn} 英寸，车宽从 ${Math.min(...kidsRideOnSizeRows().map((r) => r.widthIn))} 到 ${kidsRideOnSizeExtremes().widest.widthIn} 英寸。高度从 ${Math.min(...kidsRideOnSizeRows().map((r) => r.heightIn))} 到 ${kidsRideOnSizeExtremes().tallest.heightIn} 英寸不等，而最高的那台是这里唯一带车顶的——光是那个顶篷就贡献了大部分差距。`,
    rangeLongest: `最长——${kidsRideOnSizeExtremes().longest.label}，${kidsRideOnSizeExtremes().longest.lengthIn} 英寸。它同时也是全目录最贵的一款，以及唯一的 36V 机型。`,
    rangeWidest: `最宽——${kidsRideOnSizeExtremes().widest.label}，宽 ${kidsRideOnSizeExtremes().widest.widthIn} 英寸。美国标准室内门扇大约 32 英寸宽，所以这一款得侧着身子才能进屋；而宽于 32 英寸的 ${kidsRideOnSizeRows().filter((r) => r.widthIn > 32).length} 款都需要另找路线。`,
    rangeTallest: `最高——${kidsRideOnSizeExtremes().tallest.label}，${kidsRideOnSizeExtremes().tallest.heightIn} 英寸，多出来的是车顶而不是防滚架。这一点值得单独分开说：没有顶篷的车高是座椅靠背的高度，有顶篷的车高则是车库高度。`,
    doorTitle: "占地面积这个数字没人公布",
    doorLead: `车长车宽决定它能不能进走廊，占地面积决定它能不能进房间。没有任何一款公布占地面积，所以下面这一列是用 listing 确实给了的两个尺寸在这里算出来的。`,
    tierTitle: "尺寸是跟着电池走的",
    tierLead: `整个目录里车长随电压一路上升，所以尺寸问题和电池问题其实是同一个问题。`,
    gapTitle: "三个决定能不能放下的测量值，都不在这里",
    gapLead: `写在这里，因为量车库的家长问的正是这三个。`,
    gapAssembly: `组装后尺寸与包装尺寸——${total} 款中有 ${d.totals.withAssembly} 款写明需要组装，而本页所有尺寸理应是组装后的尺寸，但没有任何一款公布包装尺寸或折叠尺寸。这个目录里确实存在需要搬上楼梯的车，而这些记录无法回答那段路该怎么过。`,
    gapFold: `能否拆开——没有一款说明车辆是否可拆卸。${kidsRideOnSizeExtremes().widest.label}（宽 ${kidsRideOnSizeExtremes().widest.widthIn} 英寸）恰恰是最需要知道答案的那一款，而没有任何一条记录提到它。`,
    gapTires: `轮胎直径——一款都没有公布，虽然商品描述里用文字提到过 8 英寸和 14 英寸轮。公布的高度是含轮子的整体高度，因此孩子实际坐上去的座高无法从中推算。`,
    rosterTitle: "有尺寸的车，按车长从短到长",
    rosterLead: `所有数值单位为英寸。占地面积为「车长 × 车宽 ÷ 144」，由本页算出，因为没有任何一款公布它。最后一列是 size 字段原本装的东西。`,
    colBrand: "品牌",
    colModel: "型号",
    colLength: "车长",
    colWidth: "车宽",
    colHeight: "车高",
    colFootprint: "占地面积",
    colSizeField: "Size 字段写的是",
    notStated: "未说明",
    methodTitle: "这些尺寸是怎么读取的",
    methodBody: [
      `数据源：CMS 产品快照，限定 id 命名空间 electric_vehicles-* 且 category 为 "electric_car"，再剔除阶段一剪掉的 listing，共 ${total} 款在售。`,
      `长、宽、高取自商品尺寸记录并解析为三个数字。若某款把尺寸字符串写在 size 字段里，这里仍然优先用尺寸记录，因为它解析得更干净；size 字段单独在它自己那一列里如实呈现。`,
      `占地面积在此计算为「车长 × 车宽 ÷ 144」，把平方英寸换成平方英尺。它不出现在任何一条 listing 里，也不是已公布的数字。`,
      `size 字段的分类规则直接作用于 src/data/rideOnData.generated.ts 里的原始字符串：以电压开头的算电压，同时含数字与分隔符的算尺寸字符串，其余非空值算形容词。`,
      `本页没有任何内容是用卷尺量出来的。这些都是零售商对自己产品的自述数据。`,
    ],
  },
};

/** Roster columns. The three published dimensions lead. */
export const kidsRideOnSizeColumns = (t: RideOnSizeStrings): RideOnColumn[] => [
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
    key: "length",
    header: t.colLength,
    numeric: true,
    render: (r: never) => {
      const v = (r as { lengthIn?: number | null }).lengthIn;
      return v === null || v === undefined ? t.notStated : `${v} in`;
    },
  },
  {
    key: "width",
    header: t.colWidth,
    numeric: true,
    render: (r: never) => {
      const v = (r as { widthIn?: number | null }).widthIn;
      return v === null || v === undefined ? t.notStated : `${v} in`;
    },
  },
  {
    key: "height",
    header: t.colHeight,
    numeric: true,
    render: (r: never) => {
      const v = (r as { heightIn?: number | null }).heightIn;
      return v === null || v === undefined ? t.notStated : `${v} in`;
    },
  },
  {
    key: "footprint",
    header: t.colFootprint,
    numeric: true,
    render: (r: never) => {
      const l = (r as { lengthIn?: number | null }).lengthIn;
      const w = (r as { widthIn?: number | null }).widthIn;
      if (l === null || l === undefined || w === null || w === undefined) return t.notStated;
      return `${((l * w) / 144).toFixed(1)} sq ft`;
    },
  },
  {
    key: "sizeField",
    header: t.colSizeField,
    render: (r: never) => (r as { sizeLabelRaw?: string }).sizeLabelRaw || t.notStated,
  },
];

export const kidsRideOnSizeVars = {
  total,
  withDims: d.totals.withDimensions,
  fieldKinds: kidsRideOnSizeFieldKinds(),
  extremes: kidsRideOnSizeExtremes(),
  tiers: kidsRideOnSizeTiers(),
};

export const kidsRideOnSizeIcons = {
  ruler: Ruler,
  door: DoorOpen,
  area: SquareStack,
  gap: AlertTriangle,
  table: Table2,
};
