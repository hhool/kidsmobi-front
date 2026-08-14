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
      title: "Trusted Kids Mobility Reviews | BalanceBikeToddler",
      description: "全球儿童轮式出行评测站，提供平衡车、儿童自行车、慢跑婴儿推车、儿童电动滑板车与儿童电动汽车的可信评测。",
      keywords: ["儿童平衡车", "儿童自行车", "慢跑婴儿推车", "儿童电动滑板车", "儿童电动汽车"]
    },
    en: {
      title: "Trusted Kids Mobility Reviews | BalanceBikeToddler",
      description: "Global review site for kids wheeled toys. Find trusted balance bike, kids bikes, jogging stroller, kids electric scooter, and kids electric cars reviews for your family.",
      keywords: ["balance bike", "kids bikes", "jogging stroller", "kids electric scooter", "kids electric cars"]
    },
  },
  products: {
    zh: {
      title: "童车产品库：平衡车、婴儿推车、自行车与滑板车 | BalanceBikeToddler",
      description: "浏览 BalanceBikeToddler 产品库，按品类查看儿童平衡车、婴儿推车、儿童自行车、滑板车、电动车与安全座椅，快速筛选更安全的童车方案。",
      keywords: ["婴儿推车", "儿童平衡车", "儿童自行车", "儿童滑板车", "儿童电动车", "儿童安全座椅"],
    },
    en: {
      title: "Top Toddler Bikes, Twin Strollers & Electric Scooters | BalanceBikeToddler",
      description: "Browse our catalog of toddler bikes, balance bike toddler models, twin strollers, and kids electric scooters. Find the safest ride-on toys for your children.",
      keywords: ["kids bike", "balance bike", "twin stroller", "kids electric scooter"],
    },
  },
  evaluations: {
    zh: {
      title: "婴儿推车评测、旅行推车与幼儿自行车安全测试 | BalanceBikeToddler",
      description: "查看客观评测报告，覆盖旅行婴儿推车、慢跑婴儿推车与幼儿自行车，重点对比结构稳定性、制动表现与实际场景安全性。",
      keywords: ["旅行婴儿推车", "慢跑婴儿推车", "婴儿推车评测", "幼儿自行车", "儿童自行车"],
    },
    en: {
      title: "Expert Stroller Reviews, Travel Stroller Models & Toddler Bike Safety Tests | BalanceBikeToddler",
      description: "Read unbiased stroller reviews, travel stroller models, heavy-duty jogging strollers, and safety-tested toddler bike ratings. Compare travel stroller frame compliance and toddler bike geometries below.",
      keywords: ["travel stroller", "toddler bike", "stroller reviews"],
    },
  },
  reviews: {
    zh: {
      title: "婴儿推车评测、旅行推车与幼儿自行车安全测试 | BalanceBikeToddler",
      description: "查看客观评测报告，覆盖旅行婴儿推车、慢跑婴儿推车与幼儿自行车，重点对比结构稳定性、制动表现与实际场景安全性。",
      keywords: ["旅行婴儿推车", "慢跑婴儿推车", "婴儿推车评测", "幼儿自行车", "儿童自行车"],
    },
    en: {
      title: "Expert Kids Bikes & Stroller Reviews | BalanceBikeToddler",
      description: "Read unbiased stroller reviews, travel stroller models, heavy-duty jogging strollers, and safety-tested toddler bike ratings.",
      keywords: ["travel stroller", "toddler bike", "stroller reviews"],
    },
  },
  guides: {
    zh: {
      title: "婴儿推车选购与平衡车入门指南 | BalanceBikeToddler",
      description: "提供从零开始的选购建议，帮助家长理解婴儿推车关键参数，并为 1 岁左右幼儿选择合适的平衡车。",
      keywords: ["如何选择婴儿推车", "1岁平衡车", "平衡车入门"],
    },
    en: {
      title: "How to Choose a Baby Stroller & First Balance Bikes | BalanceBikeToddler",
      description: "Expert advice on how to choose a baby stroller and picking the right balance bike for 1 year old infants. Read our step-by-step buying guides today. ",
      keywords: ["how to choose a baby stroller", "balance bike for 1 year old"],
    },
  },
  news: {
    zh: {
      title: "儿童电动出行与折叠滑板车全球资讯 | BalanceBikeToddler",
      description: "追踪儿童电动自行车、儿童越野电动车与可折叠电动滑板车的新品发布、技术趋势与行业动态。",
      keywords: ["儿童电动自行车", "儿童越野电动车", "可折叠电动滑板车"],
    },
    en: {
      title: "Kids Electric Bikes & Foldable Scooter Global News | BalanceBikeToddler",
      description: "Get the latest global news on kids electric bike trends, electric dirt bike for kids releases, and newly launched foldable electric scooter technologies.",
      keywords: ["kids electric bike, electric dirt bike for kids, foldable electric scooter"],
    },
  },
  about: {
    zh: {
      title: "独立儿童骑行与推车安全实验室 | BalanceBikeToddler",
      description: "了解 BalanceBikeToddler 的独立评测方法。我们持续审核慢跑婴儿推车、平衡车与儿童滑板车，帮助家庭提升出行安全。",
      keywords: ["BalanceBikeToddler", "独立安全实验室", "儿童出行安全", "评测方法"],
    },
    en: {
      title: "Independent Kids Bike & Stroller Safety Lab | BalanceBikeToddler",
      description: "Learn about BalanceBikeToddler's strict evaluation methodology. We independently audit every jogging stroller, balance bike, and kids scooter to ensure ultimate child safety.",
      keywords: ["BalanceBikeToddler", "independent safety lab", "child mobility safety", "evaluation methodology"],
    },
  },
};

export const FALLBACK_FIRST_SEO_KEYS = new Set(["home", "products", "reviews", "guides", "news", "evaluations", "about"]);