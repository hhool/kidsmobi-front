import { ArrowRight } from "lucide-react";

/**
 * Contextual navigation inside the balance-bike reference cluster.
 *
 * The reference pages answered 94.7% of this domain's Search Console
 * impressions, yet until now they linked to each other from nothing but the
 * site-wide footer. This block supplies the in-content links in both languages,
 * mirroring the same cluster rendered by scripts/prerender-pages.ts so the
 * static HTML and the hydrated view carry identical internal links.
 */
type ClusterAsset = {
  href: string;
  labelEn: string;
  labelZh: string;
  blurbEn: string;
  blurbZh: string;
};

export const REFERENCE_CLUSTER_ASSETS: ClusterAsset[] = [
  {
    href: "/balance-bike-size-chart/",
    labelEn: "Balance bike size chart",
    labelZh: "平衡车尺寸对照表",
    blurbEn: "Seat height, wheel diameter and inseam fit, measured per model.",
    blurbZh: "逐款测量的座高、轮径与内缝适配数据。",
  },
  {
    href: "/balance-bike-what-buyers-say/",
    labelEn: "What buyers say",
    labelZh: "买家怎么说",
    blurbEn:
      "The buyer-sentiment summaries aggregated — what they mention, and where they hedge.",
    blurbZh: "买家情绪摘要的聚合——它们提到了什么，以及哪些说法打了折扣。",
  },
  {
    href: "/balance-bike-by-age/",
    labelEn: "Which models fit at each age",
    labelZh: "各年龄适配车型",
    blurbEn: "Coverage counts from 18 months to 4 years, using each maker's own age range.",
    blurbZh: "按厂商公布的适用年龄，统计 18 个月到 4 岁的覆盖数量。",
  },
  {
    href: "/balance-bike-stability/",
    labelEn: "Stability and track width",
    labelZh: "稳定性与轮距",
    blurbEn: "Wheel spacing and tip-over geometry — published by only one of the fifteen.",
    blurbZh: "轮距与侧翻几何：15 款中只有 1 款公布该数据。",
  },
  {
    href: "/balance-bike-weight/",
    labelEn: "Weight and build",
    labelZh: "重量与结构",
    blurbEn: "Bike weight against child weight, with frame and tire material.",
    blurbZh: "车重与儿童体重对照，含车架与轮胎材质。",
  },
  {
    href: "/balance-bike-safety-standards/",
    labelEn: "Safety standards reference",
    labelZh: "安全标准参考",
    blurbEn: "What EN 71, ASTM F963 and CPSC actually require of a balance bike.",
    blurbZh: "EN 71、ASTM F963 与 CPSC 对平衡车的实际要求。",
  },
  {
    href: "/safety/balance-bike-recalls/",
    labelEn: "Balance bike recall record",
    labelZh: "平衡车召回记录",
    blurbEn: "CPSC and EU Safety Gate alerts with dates, hazards and remedies.",
    blurbZh: "CPSC 与欧盟 Safety Gate 警报，含日期、危害与处理方式。",
  },
];

export default function ReferenceClusterNav({
  currentPath,
  lang = "en",
  heading,
}: {
  currentPath?: string;
  lang?: "zh" | "en";
  heading?: string;
}) {
  const items = REFERENCE_CLUSTER_ASSETS.filter((asset) => asset.href !== currentPath);
  if (!items.length) return null;
  const zh = lang === "zh";

  return (
    <section className="mt-10 border-t border-slate-200 pt-6">
      <h2 className="text-base font-black text-slate-950">
        {heading || (zh ? "平衡车参考页" : "Balance bike reference pages")}
      </h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {items.map((asset) => (
          <li key={asset.href} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <a
              href={asset.href}
              className="inline-flex items-center gap-1.5 text-sm font-black text-orange-600 hover:text-orange-700"
            >
              {zh ? asset.labelZh : asset.labelEn}
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
            <p className="mt-1 text-xs text-slate-600 leading-6">{zh ? asset.blurbZh : asset.blurbEn}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
