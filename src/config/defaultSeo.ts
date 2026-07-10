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
      title: "Kids Electric Bike & Foldable Electric Scooter News",
      description: "Track the latest news on a kids electric bike and an electric dirt bike for kids. Plus, discover foldable electric scooter safety updates.",
      keywords: ["kids electric bike", "electric dirt bike for kids", "foldable electric scooter"],
    },
    en: {
      title: "Kids Electric Bike & Foldable Electric Scooter News",
      description: "Track the latest news on a kids electric bike and an electric dirt bike for kids. Plus, discover foldable electric scooter safety updates.",
      keywords: ["kids electric bike", "electric dirt bike for kids", "foldable electric scooter"],
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
      title: "About KIDSMOBI: Independent Kids Bike & Stroller Safety Lab",
      description: "Learn about KIDSMOBI's strict evaluation methodology. We independently audit every jogging stroller, balance bike, and kids scooter to ensure ultimate child safety.",
      keywords: ["independent kids bike lab", "stroller safety lab", "jogging stroller audit", "balance bike safety", "kids scooter testing"],
    },
    en: {
      title: "About KIDSMOBI: Independent Kids Bike & Stroller Safety Lab",
      description: "Learn about KIDSMOBI's strict evaluation methodology. We independently audit every jogging stroller, balance bike, and kids scooter to ensure ultimate child safety.",
      keywords: ["independent kids bike lab", "stroller safety lab", "jogging stroller audit", "balance bike safety", "kids scooter testing"],
    },
  },
};

export const FALLBACK_FIRST_SEO_KEYS = new Set(["home", "products", "guides", "news", "evaluations", "about"]);