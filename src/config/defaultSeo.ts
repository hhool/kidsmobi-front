import type { SEOConfig } from "../types";

export const SEO_TDK_LIMITS = {
  title: 72,
  description: 155,
  keywords: 10,
  keyword: 32,
  keywordText: 255,
} as const;

function trimToLimit(value: string, limit: number): string {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length <= limit ? text : text.slice(0, limit - 1).trimEnd();
}

export function normalizeSeoConfig(config: SEOConfig): SEOConfig {
  const keywords = Array.from(new Set((config.keywords || []).map((item) => trimToLimit(item, SEO_TDK_LIMITS.keyword)).filter(Boolean)))
    .slice(0, SEO_TDK_LIMITS.keywords)
    .reduce<string[]>((acc, keyword) => {
      const next = [...acc, keyword].join(", ");
      return next.length <= SEO_TDK_LIMITS.keywordText ? [...acc, keyword] : acc;
    }, []);

  return {
    title: trimToLimit(config.title, SEO_TDK_LIMITS.title),
    description: trimToLimit(config.description, SEO_TDK_LIMITS.description),
    keywords,
  };
}

export const DEFAULT_SEO_CONFIGS: Record<string, { zh: SEOConfig; en: SEOConfig }> = {
  home: {
    zh: {
      title: "Jogging Stroller, Balance Bike, Kids Bike & Kids Scooter | KIDSMOBI",
      description: "Compare lab-tested safety metrics for your next jogging stroller, balance bike, kids bike, or kids scooter. Access unbiased reviews to ride safely.",
      keywords: ["jogging stroller", "balance bike", "kids scooter", "kids bike"],
    },
    en: {
      title: "Jogging Stroller, Balance Bike, Kids Bike & Kids Scooter | KIDSMOBI",
      description: "Compare lab-tested safety metrics for your next jogging stroller, balance bike, kids bike, or kids scooter. Access unbiased reviews to ride safely.",
      keywords: ["jogging stroller", "balance bike", "kids scooter", "kids bike"],
    },
  },
  news: {
    zh: {
      title: "童车行业趋势、品牌新品与科学选购资讯 | KIDSMOBI",
      description: "聚合 stroller、balance bike、kids bike、scooter 相关行业趋势、新品发布、法规政策、品牌动态与科学选购软文，帮助家长用更少时间理解市场变化。",
      keywords: ["童车行业趋势", "童车新品发布", "童车法规政策", "品牌动态", "科学选购"],
    },
    en: {
      title: "Kids Bike, Kids Scooter & Balance Bike News | KIDSMOBI",
      description: "Track kids bike, kids electric bike, kids scooter, balance bike, and jogging stroller launches, regulations, brand updates, and science tips.",
      keywords: ["kids bike news", "kids electric bike launches", "kids scooter news", "balance bike trends", "jogging stroller safety news", "kids dirt bike updates"],
    },
  },
  products: {
    zh: {
      title: "Toddler Bike, Twin Stroller & Kids Electric Scooter | KIDSMOBI",
      description: "Search our lab database for the safest twin stroller, toddler bike, and kids electric scooter. Compare test metrics for your next toddler balance bike.",
      keywords: ["toddler bike", "balance bike toddler", "twin stroller", "kids electric scooter"],
    },
    en: {
      title: "Toddler Bike, Twin Stroller & Kids Electric Scooter | KIDSMOBI",
      description: "Search our lab database for the safest twin stroller, toddler bike, and kids electric scooter. Compare test metrics for your next toddler balance bike.",
      keywords: ["toddler bike", "balance bike toddler", "twin stroller", "kids electric scooter"],
    },
  },
  evaluations: {
    zh: {
      title: "Best Stroller Reviews, Kids Bike & Dirt Bike Lab | KIDSMOBI",
      description: "Read our unbiased stroller reviews to find the best travel stroller and best jogging stroller. Plus, explore lab-tested kids dirt bike options for off-road fun.",
      keywords: ["best travel stroller", "best jogging stroller", "kids dirt bike", "stroller reviews", "kids bike review"],
    },
    en: {
      title: "Best Stroller Reviews, Kids Bike & Dirt Bike Lab | KIDSMOBI",
      description: "Read our unbiased stroller reviews to find the best travel stroller and best jogging stroller. Plus, explore lab-tested kids dirt bike options for off-road fun.",
      keywords: ["best travel stroller", "best jogging stroller", "kids dirt bike", "stroller reviews", "kids bike review"],
    },
  },
  guides: {
    zh: {
      title: "How to Choose a Baby Stroller & 1-Year-Old Bike Guide",
      description: "Learn how to choose a baby stroller with our lab-tested sizing wizard. Discover the safest balance bike for 1 year old riders based on real data.",
      keywords: ["how to choose a baby stroller", "balance bike for 1 year old", "toddler bike sizing guide"],
    },
    en: {
      title: "How to Choose a Baby Stroller & 1-Year-Old Bike Guide",
      description: "Learn how to choose a baby stroller with our lab-tested sizing wizard. Discover the safest balance bike for 1 year old riders based on real data.",
      keywords: ["how to choose a baby stroller", "balance bike for 1 year old", "toddler bike sizing guide"],
    },
  },
  about: {
    zh: {
      title: "精致、客观而毫不妥协的评测追求 | KIDSMOBI",
      description: "深入了解 KIDSMOBI 的独立实测流程、设备校准基准与物理计算底座。我们保持彻底的中立性与极高的专业良知，保障您孩子的滑行成长路。",
      keywords: ["关于KIDSMOBI", "实验室愿景", "评测中立性声明", "团队核心成员"],
    },
    en: {
      title: "Jogging Stroller, Balance Bike & Safety Lab | KIDSMOBI",
      description: "Learn how KIDSMOBI audits jogging stroller, balance bike, toddler bike, kids scooter, and kids electric bike safety with independent methods.",
      keywords: ["stroller safety lab", "jogging stroller audit", "balance bike safety", "toddler bike ergonomics", "kids scooter testing", "kids electric bike review"],
    },
  },
};

export const FALLBACK_FIRST_SEO_KEYS = new Set(["home", "products", "guides", "news", "evaluations", "about"]);