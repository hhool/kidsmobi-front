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
      title: "Balance Bike, Kids Bikes, Jogging Stroller, Kids Electric Scooter & Kids Electric Cars | BalanceBikeToddler",
      description: "Global review site for kids wheeled toys. Find the perfect balance bike, kids bikes, jogging stroller, kids electric scooter, and kids electric cars for your family.",
      keywords: ["balance bike", "kids bikes", "jogging stroller", "kids electric scooter", "kids electric cars"]
    },
    en: {
      title: "Balance Bike, Kids Bikes, Jogging Stroller, Kids Electric Scooter & Kids Electric Cars | BalanceBikeToddler",
      description: "Global review site for kids wheeled toys. Find the perfect balance bike, kids bikes, jogging stroller, kids electric scooter, and kids electric cars for your family.",
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
      title: "Expert Stroller Reviews, Travel Stroller Models & Toddler Bike Safety Tests | BalanceBikeToddler",
      description: "探索最客观中立的 stroller reviews。深度推荐轻便折叠旅行车 (travel stroller) 榜单、高刚性儿童自行车 (toddler bike) 实测，对比结构舒适度与刹车制动力学等指标。",
      keywords: ["travel stroller", "toddler bike", "stroller reviews", "stroller review", "toddler bicycle", "kids bike", "jogging stroller"],
    },
    en: {
      title: "Expert Stroller Reviews, Travel Stroller Models & Toddler Bike Safety Tests | BalanceBikeToddler",
      description: "Read unbiased stroller reviews, travel stroller models, heavy-duty jogging strollers, and safety-tested toddler bike ratings. Compare travel stroller frame compliance and toddler bike geometries below.",
      keywords: ["travel stroller", "toddler bike", "stroller reviews", "stroller review", "toddler bicycle", "kids bike", "jogging stroller"],
    },
  },
  guides: {
    zh: {
      title: "How to Choose a Baby Stroller & First Balance Bikes | BalanceBikeToddler",
      description: "Expert advice on how to choose a baby stroller and picking the right balance bike for 1 year old infants. Read our step-by-step buying guides today. ",
      keywords: ["how to choose a baby stroller", "balance bike for 1 year old"],
    },
    en: {
      title: "How to Choose a Baby Stroller & First Balance Bikes | BalanceBikeToddler",
      description: "Expert advice on how to choose a baby stroller and picking the right balance bike for 1 year old infants. Read our step-by-step buying guides today. ",
      keywords: ["how to choose a baby stroller", "balance bike for 1 year old"],
    },
  },
  news: {
    zh: {
      title: "Kids Electric Bikes & Foldable Scooter Global News | BalanceBikeToddler",
      description: "Get the latest global news on kids electric bike trends, electric dirt bike for kids releases, and newly launched foldable electric scooter technologies.",
      keywords: ["kids electric bike, electric dirt bike for kids, foldable electric scooter"],
    },
    en: {
      title: "Kids Electric Bikes & Foldable Scooter Global News | BalanceBikeToddler",
      description: "Get the latest global news on kids electric bike trends, electric dirt bike for kids releases, and newly launched foldable electric scooter technologies.",
      keywords: ["kids electric bike, electric dirt bike for kids, foldable electric scooter"],
    },
  },
  about: {
    zh: {
      title: "Independent Kids Bike & Stroller Safety Lab | BalanceBikeToddler",
      description: "Learn about BalanceBikeToddler's strict evaluation methodology. We independently audit every jogging stroller, balance bike, and kids scooter to ensure ultimate child safety.",
      keywords: ["BalanceBikeToddler", "independent safety lab", "child mobility safety", "evaluation methodology"],
    },
    en: {
      title: "Independent Kids Bike & Stroller Safety Lab | BalanceBikeToddler",
      description: "Learn about BalanceBikeToddler's strict evaluation methodology. We independently audit every jogging stroller, balance bike, and kids scooter to ensure ultimate child safety.",
      keywords: ["BalanceBikeToddler", "independent safety lab", "child mobility safety", "evaluation methodology"],
    },
  },
};

export const FALLBACK_FIRST_SEO_KEYS = new Set(["home", "products", "guides", "news", "evaluations", "about"]);