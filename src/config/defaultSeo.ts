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
  if (text.length <= limit) return text;
  // Word-boundary cut. A hard slice used to chop the tail mid-word
  // ("...scored on published specificati"), which reads machine-stamped in a
  // SERP; capSeoText in documentTitle.ts already cuts this way for titles and
  // meta descriptions, so normalize here must not be stricter-but-dumber.
  const cut = text.slice(0, limit);
  const sp = cut.lastIndexOf(" ");
  return (sp > 20 ? cut.slice(0, sp) : cut).replace(/[\s,;:.–—-]+$/, "").trimEnd();
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
      // 2026-10-22 A2: keywords reorganized to category-level terms, primary
      // categories (balance bikes / kids bikes) leading, "twin stroller"
      // retired — it is a sub-model word inside the stroller category, not a
      // catalog-level one. This block is the CMS-unreachable fallback, so its
      // title/description mirror the published CMS copy (they used to lead with
      // "Twin Strollers & Electric Scooters" — stale since the demotion).
      title: "Top Kids Bikes, Strollers & Scooters | BalanceBikeToddler",
      description: "Browse our catalog of balance bikes, kids bikes, toddler bikes and kids scooters. Find the safest ride-on toys for your children.",
      keywords: ["balance bike", "kids bike", "baby stroller", "kids scooter", "kids electric car"],
    },
  },
  reviews: {
    zh: {
      title: "婴儿推车评测、旅行推车与幼儿自行车安全对比 | BalanceBikeToddler",
      description: "查看客观评测报告，覆盖旅行婴儿推车、慢跑婴儿推车与幼儿自行车，重点对比结构稳定性、制动表现与实际场景安全性。",
      // 2026-10-22 A2 微调：按 31 篇评测的真实品类分布重排——stroller 9 / bicycle 7 /
      // balance 4，评测意图词（"…评测"）领衔，产品型词随后。
      keywords: ["婴儿推车评测", "平衡车评测", "旅行婴儿推车", "幼儿自行车", "儿童自行车", "慢跑婴儿推车", "儿童平衡车"],
    },
    en: {
      title: "Expert Kids Bikes & Stroller Reviews | BalanceBikeToddler",
      description: "Read unbiased stroller reviews, travel stroller models, and heavy-duty jogging strollers, with specs and scores for every shortlisted model.",
      // 2026-10-22 A2 微调：按评测品类分布重排（stroller 9 篇 > bicycle 7 > balance 4），
      // 评测意图词领衔，平衡车词保持第二位（主品类战略）。
      keywords: ["stroller reviews", "balance bike reviews", "toddler bike", "travel stroller", "toddler balance bike"],
    },
  },
  guides: {
    zh: {
      title: "平衡车选购指南：按年龄与预算挑选 | BalanceBikeToddler",
      description: "从零开始的平衡车选购指南：按年龄选尺寸、对比价格档位、查看稳定性数据，帮 1 岁左右幼儿家庭做决定。",
      keywords: ["如何选择平衡车", "1岁平衡车", "平衡车尺寸"],
    },
    en: {
      // The guide library is balance-bike-first (price tiers, by-age,
      // what-buyers-say, stability). The old title led with "How to Choose a
      // Baby Stroller & First Balance Bikes" — stroller copy for a page whose
      // listed guides are all balance bikes, and the 65-char cap amputated the
      // balance-bike half, leaving a pure-stroller <title> in the raw HTML.
      title: "Balance Bike Guides: Age, Size & Budget | BalanceBikeToddler",
      description: "Step-by-step balance bike guides: pick the right size for your child's age, compare price tiers, and check stability data before you buy.",
      keywords: ["balance bike by age", "balance bike size guide", "balance bike price tiers", "how to choose a balance bike"],
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
      keywords: ["kids electric bike", "electric dirt bike for kids", "foldable electric scooter"],
    },
  },
  about: {
    zh: {
      title: "独立儿童骑行与推车评测方法 | BalanceBikeToddler",
      description: "了解 BalanceBikeToddler 的独立评测方法。我们持续审核慢跑婴儿推车、平衡车与儿童滑板车，帮助家庭提升出行安全。",
      keywords: ["BalanceBikeToddler", "独立评测", "儿童出行安全", "评测方法"],
    },
    en: {
      title: "Independent Kids Bike & Stroller Reviews | BalanceBikeToddler",
      description: "Learn about BalanceBikeToddler's evaluation methodology. We review every jogging stroller, balance bike, and kids scooter against published specs, recall records, and owner feedback.",
      keywords: ["BalanceBikeToddler", "independent reviews", "child mobility safety", "evaluation methodology"],
    },
  },
};

export const FALLBACK_FIRST_SEO_KEYS = new Set(["home", "products", "reviews", "guides", "news", "about"]);