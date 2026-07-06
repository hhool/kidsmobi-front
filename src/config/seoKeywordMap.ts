export type SupportedLang = "zh" | "en";

interface SeoKeywordEntry {
  zh: string[];
  en: string[];
}

export const PRODUCT_CATEGORY_SEO_KEYWORDS: Record<string, SeoKeywordEntry> = {
  all: {
    zh: ["婴儿车", "儿童自行车", "平衡车", "儿童滑板车", "儿童电动车", "童车评测"],
    en: ["stroller", "kids bike", "balance bike", "kids scooter", "kids electric vehicle", "kids mobility"],
  },
  stroller: {
    zh: [ "旅行婴儿车", "最佳轻便童车", "婴儿车评论", "如何选择婴儿推车", "最佳婴儿车", "便携式旅行婴儿推车", "婴儿推车（便携式旅行款）"],
    en: [
      "travel stroller",
      "lightweight stroller",
      "jogging stroller",
      "twin stroller"
    ],
  },
  double_stroller: {
    zh: ["双人婴儿推车", "双胞胎婴儿车", "并排式双人婴儿推车", "旅行双人婴儿车", "双人慢跑婴儿车", "三人座婴儿推车"],
    en: [
      "double stroller",
      "twin stroller",
      "triple stroller",
      "side by side double stroller",
      "best double stroller for travel",
      "stroller jogging double",
      "double stroller stroller",
    ],
  },
  jogger_stroller: {
    zh: ["慢跑婴儿推车", "婴儿与慢跑婴儿推车", "最佳慢跑婴儿车", "慢跑推车评测", "双人慢跑婴儿推车"],
    en: ["jogging stroller", "best jogging stroller", "infants and jogging strollers", "jogger stroller reviews", "jogging stroller stroller"],
  },
  kids_strollers: {
    zh: ["慢跑婴儿推车", "慢跑婴儿推车", "慢跑婴儿推车"],
    en: ["jogging stroller", "lightweight stroller", "travel stroller"]
  },
  balance_bike: {
    zh: ["平衡车", "幼儿平衡车", "适合1岁儿童的平衡车", "平衡车选购"],
    en: ["balance bike", "balance bike toddler", "balance bike for 1 year old"],
  },
  kids_scooters: {
    zh: ["儿童滑板车", "儿童电动滑板车", "可折叠电动滑板车", "带座椅电动滑板车"],
    en: ["kids scooter", "kids scooters", "electric scooters for kids", "foldable electric scooter", "electric scooter with seat"],
  },
  scooters: {
    zh: ["儿童滑板车", "儿童电动滑板车", "可折叠电动滑板车", "带座椅电动滑板车"],
    en: ["kids scooter", "kids scooters", "electric scooters for kids", "foldable electric scooter", "electric scooter with seat"],
  },
  kids_bikes: {
    zh: ["儿童自行车", "儿童电动自行车", "儿童越野摩托车", "儿童骑行车"],
    en: ["kids bike", "kids bikes", "kids electric bike", "electric bike for kids", "electric dirt bike for kids"],
  },
  kids_tricycles: {
    zh: ["儿童三轮车", "幼儿三轮车", "成长型三轮车"],
    en: ["kids tricycle", "kids tricycles", "toddler tricycle"],
  },
  electric_vehicles: {
    zh: ["儿童电动车", "儿童电动越野车", "儿童骑行电动车"],
    en: ["electric vehicles for kids", "kids electric vehicle", "kids electric ride on"],
  },
  car_seat: {
    zh: ["儿童安全座椅", "汽车安全座椅", "婴儿安全座椅"],
    en: ["car seat", "baby car seat", "child safety seat"],
  },
};

export const REVIEW_TYPE_SEO_KEYWORDS: Record<string, SeoKeywordEntry> = {
  all: {
    zh: ["婴儿车评测", "童车评测", "安全专项评测"],
    en: ["stroller reviews", "kids mobility reviews", "safety reviews"],
  },
  single: {
    zh: ["单品实测", "深度评测", "真实使用评测", "单款童车评测"],
    en: ["single product review", "in-depth review", "hands-on stroller review", "expert report"],
  },
  compare: {
    zh: ["多品横评", "同类产品对比", "童车对比评测", "参数对比"],
    en: ["cross compare", "stroller comparison", "head to head review", "specs compare"],
  },
  value: {
    zh: ["性价比评测", "高性价比童车", "预算友好婴儿车"],
    en: ["value rank", "best value stroller", "budget friendly stroller"],
  },
  ranking: {
    zh: ["年度榜单", "最佳童车推荐", "Top 推荐"],
    en: ["annual top", "best stroller ranking", "top picks"],
  },
  safety: {
    zh: ["安全专项", "结构安全测试", "婴儿车安全评测"],
    en: ["safety special", "stroller safety test", "safety audit"],
  },
};

export function getProductSeoKeywords(categoryId: string, lang: SupportedLang): string[] {
  const key = categoryId || "all";
  return PRODUCT_CATEGORY_SEO_KEYWORDS[key]?.[lang] || PRODUCT_CATEGORY_SEO_KEYWORDS.all[lang];
}

export function getReviewSeoKeywords(type: string, lang: SupportedLang): string[] {
  const key = type || "all";
  return REVIEW_TYPE_SEO_KEYWORDS[key]?.[lang] || REVIEW_TYPE_SEO_KEYWORDS.all[lang];
}
