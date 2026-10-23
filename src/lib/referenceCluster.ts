import { useSyncExternalStore } from "react";

/**
 * The balance-bike reference cluster.
 *
 * The block used to be a hardcoded array in the component and a second copy in
 * the prerender — two lists that had to be edited by hand, in code, in step.
 * It is now configuration: `settings.referenceCluster` holds an ordered list
 * the CMS can arrange (reorder, hide, retitle, repoint), and both renderers
 * resolve it through this module so the static HTML and the hydrated view can
 * never disagree.
 *
 * Cards point at CMS articles where one exists for the topic; the rest still
 * point at the data reference page. Either is just an href — the list is data.
 */
export type ReferenceClusterCard = {
  /** Stable identity for React keys and diffing; href can be repointed. */
  id: string;
  href: string;
  labelEn: string;
  labelZh: string;
  blurbEn: string;
  blurbZh: string;
  /** Set false to keep a card in the list without publishing it. */
  visible?: boolean;
};

export const DEFAULT_REFERENCE_CLUSTER: ReferenceClusterCard[] = [
  {
    id: "size-chart",
    href: "/guides/beginner/balance-bike-size-chart",
    labelEn: "Balance bike size chart",
    labelZh: "平衡车尺寸对照表",
    blurbEn: "Seat height, wheel diameter and inseam fit, measured per model.",
    blurbZh: "逐款测量的座高、轮径与内缝适配数据。",
  },
  {
    id: "kids-bike-size-chart",
    href: "/kids-bike-size-chart/",
    labelEn: "Kids bike size chart",
    labelZh: "儿童自行车尺寸对照表",
    blurbEn: "Kids bike seat height, wheel diameter and inseam fit, measured per model.",
    blurbZh: "逐款测量的儿童自行车座高、轮径与内缝适配数据。",
  },
  {
    id: "kids-bike-by-age",
    href: "/kids-bike-by-age/",
    labelEn: "Kids bike by age",
    labelZh: "按年龄选儿童自行车",
    blurbEn:
      "How many kids bikes are still rated for each age from 2 to 12, with every manufacturer age range quoted verbatim.",
    blurbZh: "从 2 岁到 12 岁每个年龄还剩几款儿童自行车标注适用，逐款原文引用厂家的年龄区间。",
  },
  {
    id: "kids-bike-price",
    href: "/kids-bike-price/",
    labelEn: "Kids bike price",
    labelZh: "按价格选儿童自行车",
    blurbEn:
      "Every priced kids bike in the catalogue, banded at $100 and $150 where the listing count actually changes slope.",
    blurbZh: "目录内全部有标价的儿童自行车，按上架数量斜率变化的 $100 与 $150 两处分档。",
  },
  {
    id: "kids-bike-safety-standards",
    href: "/kids-bike-safety-standards/",
    labelEn: "Kids bike safety standards",
    labelZh: "儿童自行车安全标准",
    blurbEn:
      "Which rules actually apply to a pedal kids' bike — 16 CFR 1512 and CPSIA govern it as a bicycle and a children's product; ASTM F963 and EN 71 do not, because it is not a toy.",
    blurbZh:
      "儿童脚踏车真正适用哪些规则——16 CFR 1512 与 CPSIA 把它作为自行车和儿童产品来管；ASTM F963 与 EN 71 不适用，因为它不是玩具。",
  },
  {
    id: "kids-bike-weight",
    href: "/kids-bike-weight/",
    labelEn: "Kids bike weight",
    labelZh: "儿童自行车重量",
    blurbEn:
      "How heavy a pedal kids' bike really is — median 19.9 lb (9.0 kg) across 23 models, about 4.2x a balance bike, with the drivetrain explaining most of the gap.",
    blurbZh:
      "儿童脚踏车到底有多重——23 款中位 19.9 磅（9.0 公斤），约为平衡车的 4.2 倍，差距主要由传动系统解释。",
  },
  {
    id: "kids-bike-stability",
    href: "/kids-bike-stability/",
    labelEn: "Kids bike stability",
    labelZh: "儿童自行车稳定性",
    blurbEn:
      "Not one of the 23 pedal kids' bikes publishes a track width — but 18 mention training wheels and only one says they come off.",
    blurbZh:
      "23 款脚踏童车中没有一款公布轮间距——但有 18 款提到辅助轮，且只有 1 款说明可以拆。",
  },
  {
    id: "kids-bike-what-buyers-say",
    href: "/kids-bike-what-buyers-say/",
    labelEn: "What buyers say about kids bikes",
    labelZh: "买家怎么说童车",
    blurbEn:
      "All 22 buyer-sentiment summaries aggregated: what they mention, and how often the praise is hedged.",
    blurbZh: "22 条买家情绪摘要的聚合：它们提到了什么，以及好评里有多少打了折扣。",
  },
  {
    id: "kids-bike-recalls",
    href: "/kids-bike-recalls/",
    labelEn: "Kids bike recalls",
    labelZh: "儿童自行车召回",
    blurbEn:
      "44 CPSC recall notices on children's bicycles since 2000 — 22x the balance-bike count — broken down by hazard and year.",
    blurbZh:
      "自 2000 年起 44 起童车 CPSC 召回通知——是平衡车（2 起）的 22 倍——按危害与年份分类。",
  },
  {
    id: "kids-scooter-wheels",
    href: "/kids-scooter-wheels/",
    labelEn: "Kids scooter wheels: 2 or 3",
    labelZh: "童车滑板车轮数",
    blurbEn:
      "Wheel count decides who can ride a scooter. All 7 on record, split two-wheel against three-wheel.",
    blurbZh: "轮数决定一台滑板车适合谁。7 款全部在册，按两轮与三轮分开对照。",
  },
  {
    id: "kids-scooter-size",
    href: "/kids-scooter-size/",
    labelEn: "Kids scooter sizing",
    labelZh: "童车滑板车尺寸",
    blurbEn:
      "Only 3 of 7 publish a handlebar height and none publish a deck height — the measurement that decides whether a toddler can stand on it.",
    blurbZh: "7 款中仅 3 款公布把手高度，踏板高度一款都没有——而这正是幼儿能否自己站上去的关键。",
  },
  {
    id: "kids-scooter-weight",
    href: "/kids-scooter-weight/",
    labelEn: "Kids scooter weight and rider limits",
    labelZh: "童车滑板车重量与承重",
    blurbEn:
      "A scooter's own weight and the rider it carries are different numbers. Both, side by side.",
    blurbZh: "滑板车的自重与它能承载的骑手，是两个不同的数字。两者并排列出。",
  },
  {
    id: "kids-scooter-price",
    href: "/kids-scooter-price/",
    labelEn: "Kids scooter prices",
    labelZh: "童车滑板车价格",
    blurbEn: "All 7 priced, and what the gap between a two-wheeler and a three-wheeler buys.",
    blurbZh: "7 款全部标上价格，以及两轮与三轮之间的价差究竟买到了什么。",
  },
  {
    id: "kids-scooter-by-age",
    href: "/kids-scooter-by-age/",
    labelEn: "Kids scooter ages",
    labelZh: "童车滑板车适龄",
    blurbEn:
      "Only 2 of 7 labels carry a number. The rest say Toddler or Youth — reported verbatim, not converted.",
    blurbZh: "7 款里只有 2 款的年龄标签带数字，其余写的是 Toddler 或 Youth——原样呈现，不做换算。",
  },
  {
    id: "kids-scooter-safety",
    href: "/kids-scooter-safety-standards/",
    labelEn: "Kids scooter safety standards",
    labelZh: "童车滑板车安全标准",
    blurbEn:
      "All 7 claim ASTM F963 and CPSC, which makes the field uninformative. What a compliance mark does not prove.",
    blurbZh: "7 款全部声称符合 ASTM F963 与 CPSC——这让该字段失去区分度。合规标记证明不了什么。",
  },
  {
    id: "kids-scooter-what-buyers-say",
    href: "/kids-scooter-what-buyers-say/",
    labelEn: "What buyers say about kids scooters",
    labelZh: "买家怎么说童用滑板车",
    blurbEn:
      "7 retailer-written summaries counted by topic, with the retailer's own ratings beside them.",
    blurbZh: "7 段零售商撰写的摘要按主题计数，并列出零售商自己公布的评分。",
  },
  {
    id: "kids-scooter-recalls",
    href: "/kids-scooter-recalls/",
    labelEn: "Kids scooter recalls",
    labelZh: "儿童滑板车召回",
    blurbEn:
      "4 CPSC notices since 2000 name a kick scooter — 3 of them powered. How that compares to children's bicycles.",
    blurbZh: "自 2000 年起 4 起 CPSC 通告提及踏板车，其中 3 起为电动。并与童车自行车对照。",
  },
  {
    id: "kids-ride-on-voltage",
    href: "/kids-ride-on-voltage/",
    labelEn: "Kids ride-on voltages: 6V to 36V",
    labelZh: "儿童电动车电压：6V 到 36V",
    blurbEn:
      "Four battery voltages across 15 ride-on cars, and the odd fact that nine of them state the voltage in the listing title rather than the specification field.",
    blurbZh:
      "15 款儿童电动车分属 4 种电池电压，还有一个反常之处：其中 9 款把电压写在标题里，而不是规格字段。",
  },
  {
    id: "kids-ride-on-weight",
    href: "/kids-ride-on-weight/",
    labelEn: "Ride-on car weight vs rider limit",
    labelZh: "电动车自重与乘员限重",
    blurbEn:
      "The car's own weight and the rider it carries are different numbers. 9 of 15 publish both; the ratio between them spans 1.07 to 10.89.",
    blurbZh:
      "车本身的重量与它承载的乘员，是两个不同的数字。15 款中 9 款同时公布两者，比值从 1.07 到 10.89。",
  },
  {
    id: "kids-ride-on-size",
    href: "/kids-ride-on-size/",
    labelEn: "Kids ride-on size and dimensions",
    labelZh: "儿童电动车尺寸",
    blurbEn:
      "The listing field called Size holds a battery voltage on 6 of 15 cars and a dimension string on 3 more. The real measurements come from the dimension record.",
    blurbZh:
      "名为 Size 的列表字段，在 15 款中有 6 款填的是电池电压，另有 3 款填的是尺寸串。真正的尺寸数据来自尺寸记录。",
  },
  {
    id: "kids-ride-on-price",
    href: "/kids-ride-on-price/",
    labelEn: "Kids ride-on prices",
    labelZh: "儿童电动车价格",
    blurbEn:
      "All 15 priced from $75.99 to $379.52 — and a $84.99 hole in the middle with nothing listed between $199.99 and $284.98.",
    blurbZh:
      "15 款全部标上价格，从 $75.99 到 $379.52——中间还有一个 $84.99 的空洞，$199.99 与 $284.98 之间一款都没有。",
  },
  {
    id: "kids-ride-on-by-age",
    href: "/kids-ride-on-by-age/",
    labelEn: "Kids ride-on age guidance",
    labelZh: "儿童电动车适龄",
    blurbEn:
      "11 of 15 list a 36-month floor, including a 55-inch UTV. Two also claim a 12-year ceiling, and one raw value reads 100 years.",
    blurbZh:
      "15 款中 11 款标注 36 个月起——其中包括一台 55 英寸的 UTV。另有两款同时声称适用到 12 岁，还有一个原始值写成了 100 岁。",
  },
  {
    id: "kids-ride-on-safety",
    href: "/kids-ride-on-safety-standards/",
    labelEn: "Kids ride-on safety standards",
    labelZh: "儿童电动车安全标准",
    blurbEn:
      "All 15 claim ASTM F963 and CPSC, which makes the compliance field uninformative. Not one listing mentions a helmet.",
    blurbZh:
      "15 款全部声称符合 ASTM F963 与 CPSC——这让合规字段失去区分度。而且没有一款提到头盔。",
  },
  {
    id: "kids-ride-on-what-buyers-say",
    href: "/kids-ride-on-what-buyers-say/",
    labelEn: "What buyers say about ride-on cars",
    labelZh: "买家怎么说儿童电动车",
    blurbEn:
      "14 retailer-written summaries counted by topic, with the retailer's own ratings, review counts and category ranks beside them.",
    blurbZh:
      "14 段零售商撰写的摘要按主题计数，并列出零售商自己公布的评分、评论量与类目排名。",
  },
  {
    id: "kids-ride-on-recalls",
    href: "/kids-ride-on-recalls/",
    labelEn: "Kids ride-on recalls",
    labelZh: "儿童电动车召回",
    blurbEn:
      "16 CPSC notices on ride-on toys since 2000, every one carrying a fire, heat or battery hazard. What the EU alert list actually names.",
    blurbZh:
      "自 2000 年起 16 起涉及儿童乘骑玩具的 CPSC 通告，每一起都带有火灾、高温或电池危害。以及欧盟警报清单真正点名的部分。",
  },
  {
    id: "buyer-feedback",
    href: "/balance-bike-what-buyers-say/",
    labelEn: "What buyers say",
    labelZh: "买家怎么说",
    blurbEn:
      "The buyer-sentiment summaries aggregated — what they mention, and where they hedge.",
    blurbZh: "买家情绪摘要的聚合——它们提到了什么，以及哪些说法打了折扣。",
  },
  {
    id: "by-age",
    href: "/balance-bike-by-age/",
    labelEn: "Which models fit at each age",
    labelZh: "各年龄适配车型",
    blurbEn: "Coverage counts from 18 months to 4 years, using each maker's own age range.",
    blurbZh: "按厂商公布的适用年龄，统计 18 个月到 4 岁的覆盖数量。",
  },
  {
    id: "stability",
    href: "/balance-bike-stability/",
    labelEn: "Stable track balance bike",
    labelZh: "稳定性与轮距",
    blurbEn: "Wheel spacing and tip-over geometry — published by only one of the fifteen.",
    blurbZh: "轮距与侧翻几何：15 款中只有 1 款公布该数据。",
  },
  {
    id: "weight",
    href: "/guides/beginner/balance-bike-weight",
    labelEn: "Weight and build",
    labelZh: "重量与结构",
    blurbEn: "Bike weight against child weight, with frame and tire material.",
    blurbZh: "车重与儿童体重对照，含车架与轮胎材质。",
  },
  {
    id: "safety-standards",
    href: "/guides/risk/balance-bike-safety-standards",
    labelEn: "Safety standards reference",
    labelZh: "安全标准参考",
    blurbEn: "What EN 71, ASTM F963 and CPSC actually require of a balance bike.",
    blurbZh: "EN 71、ASTM F963 与 CPSC 对平衡车的实际要求。",
  },
  {
    id: "recalls",
    href: "/guides/risk/balance-bike-recalls",
    labelEn: "Balance bike recall record",
    labelZh: "平衡车召回记录",
    blurbEn: "CPSC and EU Safety Gate alerts with dates, hazards and remedies.",
    blurbZh: "CPSC 与欧盟 Safety Gate 警报，含日期、危害与处理方式。",
  },
  {
    id: "budget",
    href: "/guides/budget/balance-bike-price-tiers",
    labelEn: "Budget & value balance bike",
    labelZh: "平价与性价比平衡车",
    blurbEn:
      "What each price tier buys, the frame, tire and weight trade-offs, and the checks that separate a cheap bike worth keeping.",
    blurbZh:
      "每个价位段买到什么、车架/轮胎/重量的取舍，以及区分值得买的便宜车与应跳过车的检查。",
  },
];

const text = (value: unknown, fallback: string): string =>
  typeof value === "string" && value.trim() ? value.trim() : fallback;

/** Keeps configured entries well-formed and drops everything that cannot link. */
const sanitize = (input: unknown[]): ReferenceClusterCard[] =>
  input.flatMap((raw, index) => {
    if (!raw || typeof raw !== "object") return [];
    const card = raw as Partial<ReferenceClusterCard>;
    const href = typeof card.href === "string" ? card.href.trim() : "";
    if (!href) return [];
    return [
      {
        id: text(card.id, `card-${index + 1}`),
        href,
        labelEn: text(card.labelEn, href),
        labelZh: text(card.labelZh, text(card.labelEn, href)),
        blurbEn: text(card.blurbEn, ""),
        blurbZh: text(card.blurbZh, text(card.blurbEn, "")),
        visible: card.visible !== false,
      },
    ];
  });

/**
 * Resolves the published list: configured order wins, `visible: false` hides a
 * card without deleting it, and an empty or unusable configuration falls back
 * to the defaults rather than shipping an empty block.
 */
export function resolveReferenceCluster(configured: unknown): ReferenceClusterCard[] {
  if (!Array.isArray(configured) || configured.length === 0) return DEFAULT_REFERENCE_CLUSTER;
  const resolved = sanitize(configured).filter((card) => card.visible !== false);
  return resolved.length ? resolved : DEFAULT_REFERENCE_CLUSTER;
}

const signature = (list: ReferenceClusterCard[]): string =>
  JSON.stringify(list.map((card) => [card.id, card.href, card.labelEn, card.labelZh, card.blurbEn, card.blurbZh]));

let snapshot: ReferenceClusterCard[] = DEFAULT_REFERENCE_CLUSTER;
let snapshotSignature = signature(snapshot);
const listeners = new Set<() => void>();

/** Called once CMS settings arrive; no-ops when the published list is unchanged. */
export function setReferenceClusterConfig(configured: unknown): void {
  const next = resolveReferenceCluster(configured);
  const nextSignature = signature(next);
  if (nextSignature === snapshotSignature) return;
  snapshot = next;
  snapshotSignature = nextSignature;
  for (const listener of listeners) listener();
}

const subscribe = (notify: () => void) => {
  listeners.add(notify);
  return () => {
    listeners.delete(notify);
  };
};

/** Subscribes a component to the published list (defaults until settings load). */
export function useReferenceCluster(): ReferenceClusterCard[] {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => DEFAULT_REFERENCE_CLUSTER,
  );
}

/** Trailing-slash-insensitive comparison; the canonical form has no slash. */
export const samePath = (a: string, b: string): boolean => {
  const norm = (value: string) => value.replace(/\/+$/, "") || "/";
  return norm(a) === norm(b);
};
