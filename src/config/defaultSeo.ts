import type { SEOConfig } from "../types";

export const SEO_TDK_LIMITS = {
  title: 60,
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
      title: "全新一代高端童车安全评测与科学网购决策平台 | KIDSMOBI",
      description: "KIDSMOBI 致力于为全球家庭提供科学、中立的童车评测与安全审计服务。通过严苛的物理结构负载公式和工效学实测，覆盖儿童平衡车、童车拉车、安全座椅等领域的国际质量认证、参数对比与智能选车推荐。",
      keywords: ["童车评测", "平衡车推荐", "安全座椅测评", "智能选车向导", "KIDSMOBI", "儿童滑板车评测"],
    },
    en: {
      title: "Balance Bike, Jogging Stroller & Kids Scooter | KIDSMOBI",
      description: "Compare balance bike, jogging stroller, toddler bike, kids scooter, and kids electric bike with safety reviews and baby stroller guidance.",
      keywords: ["balance bike", "jogging stroller", "kids bike", "toddler bike", "kids scooter", "kids electric bike", "how to choose a baby stroller"],
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
      title: "童车多维参数比对矩阵 | KIDSMOBI 选车大数据库",
      description: "提供覆盖各大主流豪华及专业品牌的参数、重量系数、几何重心和刹车力度对标详情。科学排除不合理的超载或易侧翻童车款式。",
      keywords: ["童车参数对比", "平衡车挑选数据库", "童车重量对比", "几何重心分析"],
    },
    en: {
      title: "Balance Bike, Kids Bike & Kids Scooter | KIDSMOBI",
      description: "Compare balance bike, kids bike, jogging stroller, toddler bike, kids scooter, kids electric bike, foldable electric scooter, and kids dirt bike.",
      keywords: ["balance bike", "kids bike", "jogging stroller", "toddler bike", "kids scooter", "kids electric bike", "foldable electric scooter", "electric dirt bike for kids"],
    },
  },
  evaluations: {
    zh: {
      title: "深度实验室评测报告 | KIDSMOBI 独家实测与专业意见",
      description: "KIDSMOBI 独家评测报告，汇聚专业工程师对力学稳定性、材料应力、舒适度指数及真实家庭磨损测试的数据可视化呈现。",
      keywords: ["工程师评测报告", "机械载重量测试", "滑行顺畅度实测", "童车优缺点分析"],
    },
    en: {
      title: "Jogging Stroller, Balance Bike Reviews | KIDSMOBI",
      description: "Read jogging stroller review, balance bike review, kids bike review, toddler bike review, and kids scooter review with lab-grade safety tests.",
      keywords: ["jogging stroller review", "balance bike review", "kids bike review", "toddler bike review", "kids scooter review", "safety special"],
    },
  },
  guides: {
    zh: {
      title: "专家避坑指南与选型计算中心 | KIDSMOBI 科学购车顾问",
      description: "首创儿童跨步长（Inseam）与车架结合的黄金配对算法，提供避坑防断裂模块化警示，辅助每一位父母买对不买贵。",
      keywords: ["选型指南", "避坑指南", "跨步长计算器", "车架黄金比例"],
    },
    en: {
      title: "Baby Stroller Guide | Balance Bike & Toddler Bike",
      description: "Learn how to choose a baby stroller, then compare jogging stroller, balance bike toddler, toddler bike, kids scooter, and kids electric bike fit.",
      keywords: ["how to choose a baby stroller", "balance bike", "balance bike toddler", "jogging stroller", "toddler bike", "kids scooter", "kids electric bike"],
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