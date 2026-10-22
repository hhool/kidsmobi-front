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
