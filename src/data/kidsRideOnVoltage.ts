/**
 * /kids-ride-on-voltage/ — the battery tier, which is the decision that splits
 * this category.
 *
 * A children's ride-on car is bought on the promise of a number on the box:
 * 6V, 12V, 24V, 36V. That number sets the top speed, the number of seats, how
 * long the charge lasts and how much the thing weighs, so it is the closest
 * thing this category has to a wheel count on a scooter. It is also the first
 * page in this cluster because the split is unusually clean — and unusually
 * unverified.
 *
 * The honest finding is about where the number comes from. Every one of the 15
 * listings publishes a voltage, so coverage is 15 of 15 — but only 6 state it
 * in the specification field, while 9 state it only in the product title. A
 * title is marketing copy; a specification field is a structured attribute.
 * The page reports both counts separately rather than presenting a single
 * 100% bar.
 *
 * Second finding: voltage does not sort price inside a tier. The 12V group runs
 * from $75.99 to $199.99 — a 2.6x spread inside the same battery tier — which
 * means "12V" tells a buyer almost nothing about what they will pay.
 *
 * Third: seat count appears only above 12V. All five listings that state a
 * seat count are 24V or 36V machines, and no 6V or 12V listing says how many
 * children it seats.
 */
import { BatteryCharging, Zap, Armchair, AlertTriangle, Table2 } from "lucide-react";
import { RIDE_ON_DATASET } from "./rideOnData.generated";
import { rideOnLabel, type RideOnColumn } from "../components/RideOnAssetPage";

export { RIDE_ON_DATASET };
export const KIDS_RIDE_ON_VOLTAGE_PATH = "/kids-ride-on-voltage/";

const d = RIDE_ON_DATASET;
const total = d.totals.rideOnCars;

/** Listings in one voltage tier, cheapest first. */
export const kidsRideOnVoltageTier = (volts: number) =>
  d.rows.filter((r) => r.voltage === volts).sort((a, b) => (a.price ?? 0) - (b.price ?? 0));

/** The four tiers, with the figures each one publishes. */
export const kidsRideOnVoltageTiers = () =>
  [
    { volts: 6, count: d.volts.v6 },
    { volts: 12, count: d.volts.v12 },
    { volts: 24, count: d.volts.v24 },
    { volts: 36, count: d.volts.v36 },
  ].map((tier) => {
    const rows = kidsRideOnVoltageTier(tier.volts);
    const prices = rows.map((r) => r.price).filter((p): p is number => typeof p === "number");
    return {
      ...tier,
      rows,
      priceMin: prices.length ? Math.min(...prices) : null,
      priceMax: prices.length ? Math.max(...prices) : null,
      withSeats: rows.filter((r) => r.seats !== null).length,
      withRuntime: rows.filter((r) => r.batteryLifeMinutes !== null).length,
      fromSpecification: rows.filter((r) => r.voltageSource === "specification").length,
      fromTitle: rows.filter((r) => r.voltageSource === "title").length,
    };
  });

export interface RideOnVoltageStrings {
  eyebrow: string;
  navLabel: string;
  h1: string;
  lead: string;
  sourceTitle: string;
  sourceLead: string;
  tierTitle: string;
  tierLead: string;
  tierSix: string;
  tierTwelve: string;
  tierTwentyFour: string;
  tierThirtySix: string;
  seatsTitle: string;
  seatsLead: string;
  gapTitle: string;
  gapLead: string;
  gapSource: string;
  gapPrice: string;
  gapRuntime: string;
  rosterTitle: string;
  rosterLead: string;
  colBrand: string;
  colModel: string;
  colVoltage: string;
  colVoltageFrom: string;
  colPrice: string;
  colSeats: string;
  colRuntime: string;
  notStated: string;
  methodTitle: string;
  methodBody: string[];
}

export const kidsRideOnVoltageStrings: Record<"en" | "zh", RideOnVoltageStrings> = {
  en: {
    eyebrow: "Plan-B asset · battery tier",
    navLabel: "Battery tier",
    h1: `Kids Ride-On Voltage: 6V, 12V, 24V or 36V, ${total} Cars Compared`,
    lead: `The number on the box is the first thing a buyer reads and the last thing a listing explains. Of the ${total} children's ride-on cars this site publishes, ${d.volts.v6} run on 6V, ${d.volts.v12} on 12V, ${d.volts.v24} on 24V and ${d.volts.v36} on 36V — and within the largest of those tiers the price runs from $${kidsRideOnVoltageTiers()[1].priceMin} to $${kidsRideOnVoltageTiers()[1].priceMax}. The tier tells you what class of machine you are buying; it does not tell you what it will cost, and in most of these listings it does not even come from a structured field.`,
    sourceTitle: "Where the voltage figure actually comes from",
    sourceLead: `Every listing on this page carries a voltage, so the obvious presentation is a full bar. That would hide the part a buyer needs: ${d.totals.voltageFromTitle} of the ${total} listings state their battery size only in the product title, which is marketing copy, while ${d.totals.voltageFromSpec} state it in the specification field, which is a structured attribute. The two are not equally reliable, so they are counted apart here.`,
    tierTitle: "The four tiers, and what each one buys",
    tierLead: `The tiers are nested rather than scattered, which is the clearest signal that this is one product family scaled up rather than four unrelated categories. Every 36V machine is a two-seat vehicle with four driven wheels, and every 6V machine is a small single-seat trike.`,
    tierSix: `6V — ${d.volts.v6} listing, $${kidsRideOnVoltageTiers()[0].priceMin}. A three-wheel police-decal motorcycle for children aged three and over, rated at 1.75 mph. It is the smallest machine here and the only one that states no runtime at all.`,
    tierTwelve: `12V — ${d.volts.v12} listings, $${kidsRideOnVoltageTiers()[1].priceMin} to $${kidsRideOnVoltageTiers()[1].priceMax}. The bulk of the catalogue and the widest price spread in it. This group includes both a 12.5 lb wiggle car and a 32 lb truck with a parent remote, so the tier spans everything from a push-along toy to a vehicle with a 3.5 mph top speed.`,
    tierTwentyFour: `24V — ${d.volts.v24} listings, $${kidsRideOnVoltageTiers()[2].priceMin} to $${kidsRideOnVoltageTiers()[2].priceMax}. Two-seaters with real ground clearance: one is a 45.3-inch-long two-seat truck, one a licensed Ford F-150 with four 100W motors, one a four-seat golf cart with a roof. This is the tier where seat count starts to appear.`,
    tierThirtySix: `36V — ${d.volts.v36} listing, $${kidsRideOnVoltageTiers()[3].priceMin}. A metal-frame two-seat UTV with a variable throttle pedal, 14-inch wheels and a stated 5–8 mph range. It is also the only machine here with no parental remote: the description says so in as many words, and it is aimed at children aged six and up rather than toddlers.`,
    seatsTitle: "Seat count appears only above 12V",
    seatsLead: `Only ${d.totals.withSeats} of the ${total} listings state how many children ride in the vehicle, and every one of them is a 24V or 36V machine. The ${d.volts.v6 + d.volts.v12} cars in the two lower tiers say nothing about passenger count, which means the question "can my two children share this?" cannot be answered from those listings at all.`,
    gapTitle: "Three things the voltage does not settle",
    gapLead: `Stated here because a buyer who has decided on a tier will still want these answered.`,
    gapSource: `Source of the figure — ${d.totals.voltageFromTitle} of ${total} listings give the voltage only in the product title, ${d.totals.voltageFromSpec} in the specification field. Titles are rewritten for search; specification fields are not. Both are reproduced here, and the column shows which one carried the number.`,
    gapPrice: `Price within a tier — the 12V group alone spans $${kidsRideOnVoltageTiers()[1].priceMin} to $${kidsRideOnVoltageTiers()[1].priceMax}. A tier narrows the field to a class of machine; it does not narrow it to a price.`,
    gapRuntime: `Runtime — ${d.totals.withBatteryLife} of ${total} listings state a battery life, but none of them states a charge time, and the 6V and 36V machines state no runtime at all. A runtime without a charging time does not tell a parent whether the car will be ready for a weekend.`,
    rosterTitle: "Every car, with the tier it belongs to",
    rosterLead: `Sorted by tier and then by price. Runtime is the minutes figure as the listing states it, converted from hours where necessary.`,
    colBrand: "Brand",
    colModel: "Model",
    colVoltage: "Voltage",
    colVoltageFrom: "Stated in",
    colPrice: "Price",
    colSeats: "Seats",
    colRuntime: "Runtime",
    notStated: "not stated",
    methodTitle: "How the tier counts were made",
    methodBody: [
      `Source: the CMS product snapshot, gated to the id namespace electric_vehicles-* with category "electric_car", minus the listings Stage 1 prunes — ${total} published cars.`,
      `Voltage is read from the specification field where it carries a number, otherwise from the product title. The source of each figure is recorded per row so the two can be counted separately; no voltage was inferred from a battery description.`,
      `On these listings the "Size" field holds the battery voltage rather than a measurement, which is why the size page reads dimensions from the dimension record instead. That mislabelling is a property of the source data and is reported on the size page.`,
      `Runtime figures arrive in hours for ${d.units.runtimeHourRows} listings and in minutes for ${d.units.runtimeMinuteRows}; both are converted to minutes here and the raw string is kept in src/data/rideOnData.generated.ts.`,
      `Voltages are as the retailers state them. Nothing here was measured, charged or driven.`,
    ],
  },
  zh: {
    eyebrow: "Plan-B 资产页 · 电池档位",
    navLabel: "电池档位",
    h1: `童用电动车电压：6V、12V、24V、36V，${total} 款对照`,
    lead: `盒子上的那串数字是买家第一个读到的数字，也是 listing 最少解释的一个数字。本站在售的 ${total} 款童用电动车中，${d.volts.v6} 款是 6V、${d.volts.v12} 款是 12V、${d.volts.v24} 款是 24V、${d.volts.v36} 款是 36V——而其中最大的一档内部，价格从 $${kidsRideOnVoltageTiers()[1].priceMin} 一路拉到 $${kidsRideOnVoltageTiers()[1].priceMax}。电压告诉你买的是哪一类机器，但不告诉你会花多少钱，而且在多数 listing 里它甚至不是来自结构化字段。`,
    sourceTitle: "电压数字究竟从哪里来",
    sourceLead: `这一页的每一条 listing 都有电压，所以最直观的呈现方式是画一条满格。但那样会盖住买家真正需要的部分：${total} 款里有 ${d.totals.voltageFromTitle} 款只在商品标题里写了电池规格，那是营销文案；只有 ${d.totals.voltageFromSpec} 款写在规格字段里，那是结构化属性。两者可靠性不同，所以这里分开计数。`,
    tierTitle: "四个档位，各自买到什么",
    tierLead: `这几个档位是层层嵌套的，而不是散落各处——这清楚说明它们是同一个产品家族向上扩展，而不是四个互不相干的类目。每一台 36V 都是双座四驱车，每一台 6V 都是小型单座三轮摩托。`,
    tierSix: `6V——${d.volts.v6} 款，$${kidsRideOnVoltageTiers()[0].priceMin}。一辆带警灯贴纸的三轮电动摩托，适合三岁以上儿童，标称时速 1.75 英里。它是这里最小的机器，也是唯一完全没有公布续航的一款。`,
    tierTwelve: `12V——${d.volts.v12} 款，$${kidsRideOnVoltageTiers()[1].priceMin} 到 $${kidsRideOnVoltageTiers()[1].priceMax}。这是目录的大头，也是其中价差最大的一组。同一个档位里既有 12.5 磅的滑板摇摇车，也有 32 磅、带家长遥控、时速 3.5 英里的卡车。`,
    tierTwentyFour: `24V——${d.volts.v24} 款，$${kidsRideOnVoltageTiers()[2].priceMin} 到 $${kidsRideOnVoltageTiers()[2].priceMax}。都是能坐两人的、有真实离地间隙的车：一款是车长 45.3 英寸的双座卡车，一款是四个 100W 电机的福特 F-150 授权版，还有一款是带车顶的四座高尔夫球车。座位数正是从这一档开始出现的。`,
    tierThirtySix: `36V——${d.volts.v36} 款，$${kidsRideOnVoltageTiers()[3].priceMin}。一台金属车架双座 UTV，配可变油门踏板、14 英寸车轮，标称 5–8 英里时速。它也是这里唯一没有家长遥控的机器——listing 原文就是这么写的，而且它面向六岁以上儿童，而不是幼儿。`,
    seatsTitle: "座位数只在 12V 以上出现",
    seatsLead: `只有 ${total} 款中的 ${d.totals.withSeats} 款写明能坐几个孩子，而且全部是 24V 或 36V 机型。${d.volts.v6 + d.volts.v12} 款低档车型对乘员人数只字未提，也就是说"两个孩子能不能一起坐"这个问题，在这些 listing 里根本无法回答。`,
    gapTitle: "电压解决不了的三件事",
    gapLead: `放在这里说，是因为已经选定档位的买家仍然会想问。`,
    gapSource: `数字来源——${total} 款里有 ${d.totals.voltageFromTitle} 款只在标题中给出电压，${d.totals.voltageFromSpec} 款写在规格字段里。标题会为了搜索而改写，规格字段不会。两者这里都原样列出，表格也标出了每个数字的出处。`,
    gapPrice: `同档位内的价格——光是 12V 这一组就横跨 $${kidsRideOnVoltageTiers()[1].priceMin} 到 $${kidsRideOnVoltageTiers()[1].priceMax}。档位把范围收窄到一类机器，却没收窄到某个价位。`,
    gapRuntime: `续航——${total} 款里有 ${d.totals.withBatteryLife} 款公布电池续航，但没有一款公布充电时间，而 6V 与 36V 两款连续航都没有。只给续航不给充电时长，家长就无法判断周末出发前车是否充满。`,
    rosterTitle: "每一款车及其所属档位",
    rosterLead: `先按档位、再按价格排序。续航统一为分钟，小时制已换算。`,
    colBrand: "品牌",
    colModel: "型号",
    colVoltage: "电压",
    colVoltageFrom: "标注位置",
    colPrice: "价格",
    colSeats: "座位数",
    colRuntime: "续航",
    notStated: "未说明",
    methodTitle: "这些档位计数是怎么来的",
    methodBody: [
      `数据源：CMS 产品快照，限定 id 命名空间 electric_vehicles-* 且 category 为 "electric_car"，再剔除阶段一剪掉的 listing，共 ${total} 款在售。`,
      `电压优先读规格字段中的数值，没有才退回商品标题。每一行都记录了数字出处，因此两种来源可以分别计数；没有任何电压是从电池描述推断出来的。`,
      `这些 listing 的 "Size" 字段装的是电池电压而不是尺寸，因此尺寸页改从尺寸记录里取数。这一字段错位属于源数据本身的问题，尺寸页会如实说明。`,
      `续航有 ${d.units.runtimeHourRows} 款以小时计、${d.units.runtimeMinuteRows} 款以分钟计，这里统一换算为分钟，原始字符串保留在 src/data/rideOnData.generated.ts。`,
      `电压均按零售商声明呈现。本页没有任何内容经过实测、充电或试驾。`,
    ],
  },
};

/** Roster columns. Voltage leads, because it is the page's subject. */
export const kidsRideOnVoltageColumns = (t: RideOnVoltageStrings): RideOnColumn[] => [
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
    key: "voltage",
    header: t.colVoltage,
    numeric: true,
    render: (r: never) => {
      const v = (r as { voltage?: number | null }).voltage;
      return v === null || v === undefined ? t.notStated : `${v} V`;
    },
  },
  {
    key: "from",
    header: t.colVoltageFrom,
    render: (r: never) => {
      const src = (r as { voltageSource?: string }).voltageSource;
      if (!src) return t.notStated;
      return src === "specification" ? "spec field" : "title";
    },
  },
  {
    key: "price",
    header: t.colPrice,
    numeric: true,
    render: (r: never) => {
      const v = (r as { price?: number | null }).price;
      return v === null || v === undefined ? t.notStated : `$${v}`;
    },
  },
  {
    key: "seats",
    header: t.colSeats,
    numeric: true,
    render: (r: never) => {
      const v = (r as { seats?: number | null }).seats;
      return v === null || v === undefined ? t.notStated : String(v);
    },
  },
  {
    key: "runtime",
    header: t.colRuntime,
    numeric: true,
    render: (r: never) => {
      const v = (r as { batteryLifeMinutes?: number | null }).batteryLifeMinutes;
      return v === null || v === undefined ? t.notStated : `${v} min`;
    },
  },
];

export const kidsRideOnVoltageVars = {
  total,
  tiers: kidsRideOnVoltageTiers(),
  fromTitle: d.totals.voltageFromTitle,
  fromSpec: d.totals.voltageFromSpec,
};

export const kidsRideOnVoltageIcons = {
  battery: BatteryCharging,
  zap: Zap,
  seat: Armchair,
  gap: AlertTriangle,
  table: Table2,
};
