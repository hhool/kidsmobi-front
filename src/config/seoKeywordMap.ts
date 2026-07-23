export type SupportedLang = "zh" | "en";

interface SeoKeywordEntry {
  zh: string[];
  en: string[];
}

export const PRODUCT_CATEGORY_SEO_KEYWORDS: Record<string, SeoKeywordEntry> = {
  all: {
    zh: ["婴儿车", "儿童自行车", "平衡车", "儿童滑板车", "儿童电动车", "安全座椅"],
    en: [
      "balance bike",
      "kids bike",
      "jogging stroller",
      "toddler bike",
      "kids scooter",
      "kids electric bike",
      "foldable electric scooter",
      "how to choose a baby stroller",
    ],
  },
  strollers: {
    zh: [ "旅行婴儿车", "最佳轻便童车", "婴儿车评论", "如何选择婴儿推车", "最佳婴儿车", "便携式旅行婴儿推车", "婴儿推车（便携式旅行款）"],
    en: [
      "jogging stroller",
      "stroller travel stroller",
      "jogging stroller stroller",
      "kids stroller",
      "how to choose a baby stroller"
    ],
  },
  double_strollers: {
    zh: ["双胞胎婴儿车", "并排式双胞胎婴儿推车", "旅行双胞胎婴儿车", "双胞胎慢跑婴儿推车"],
    en: [
      "twin stroller",
      "twin strollers",
      "side by side twin stroller",
      "twin stroller for travel",
      "twin jogging stroller",
    ],
  },
  jogger_stroller: {
    zh: ["慢跑婴儿推车",   "双人慢跑婴儿推车"],
    en: ["jogging stroller", "jogging stroller stroller", "stroller travel stroller", "kids stroller"],
  },
  kids_strollers: {
    zh: ["慢跑婴儿推车", "轻便婴儿推车", "旅行婴儿推车"],
    en: ["jogging stroller", "stroller travel stroller", "jogging stroller stroller", "kids stroller"]
  },
  balance_bikes: {
    zh: ["平衡车", "幼儿平衡车", "适合1岁儿童的平衡车"],
    en: ["balance bike", "balance bike toddler", "balance bike for 1 year old"],
  },
  kids_scooters: {
    zh: ["儿童滑板车", "儿童电动滑板车", "可折叠电动滑板车", "带座椅电动滑板车"],
    en: ["kids scooter", "foldable electric scooter", "childs e scooter", "toddler scooter", "kids electric scooter", "electric scooter for kids", "electric scooter with seat"],
  },
  scooters: {
    zh: ["儿童滑板车", "儿童电动滑板车", "可折叠电动滑板车", "带座椅电动滑板车"],
    en: ["kids scooter", "foldable electric scooter", "childs e scooter", "toddler scooter", "kids electric scooter", "electric scooter for kids", "electric scooter with seat"],
  },
  kids_bikes: {
    zh: ["儿童自行车", "儿童电动自行车", "儿童越野摩托车", "儿童骑行车"],
    en: ["kids bike", "toddler bike", "kids electric bike", "electric dirt bike for kids", "kids dirt bike"],
  },
  kids_tricycles: {
    zh: ["幼儿三轮车", "成长型三轮车"],
    en: ["kids tricycles", "toddler tricycle"],
  },
  electric_vehicles: {
    zh: ["儿童电动车", "儿童骑行电动车"],
    en: ["electric vehicles for kids", "kids electric ride on"],
  },
  car_seats: {
    zh: ["儿童安全座椅", "汽车安全座椅", "婴儿安全座椅"],
    en: ["car seats", "baby car seats", "child safety seats"],
  },
};

export const REVIEW_TYPE_SEO_KEYWORDS: Record<string, SeoKeywordEntry> = {
  all: {
    zh: ["best travel stroller", "best jogging stroller", "kids dirt bike", "stroller reviews"],
    en: ["best travel stroller", "best jogging stroller", "kids dirt bike", "stroller reviews"],
  },
  single: {
    zh: ["best travel stroller", "stroller reviews", "unbiased stroller reviews", "expert stroller review"],
    en: ["best travel stroller", "stroller reviews", "unbiased stroller reviews", "expert stroller review"],
  },
  compare: {
    zh: ["best jogging stroller", "stroller comparison", "jogging stroller review", "stroller reviews"],
    en: ["best jogging stroller", "stroller comparison", "jogging stroller review", "stroller reviews"],
  },
  value: {
    zh: ["kids dirt bike", "electric kids dirt bike", "kids dirt bike safety", "off-road kids ride"],
    en: ["kids dirt bike", "electric kids dirt bike", "kids dirt bike safety", "off-road kids ride"],
  },
  ranking: {
    zh: ["stroller reviews", "best travel stroller", "best jogging stroller", "top stroller picks"],
    en: ["stroller reviews", "best travel stroller", "best jogging stroller", "top stroller picks"],
  },
  safety: {
    zh: ["kids dirt bike safety audit", "stroller safety test", "best jogging stroller stability", "stroller reviews"],
    en: ["kids dirt bike safety audit", "stroller safety test", "best jogging stroller stability", "stroller reviews"],
  },
};

export function getProductSeoKeywords(categoryId: string, lang: SupportedLang): string[] {
  const raw = (categoryId || "all").trim().toLowerCase();
  const aliasMap: Record<string, string> = {
    stroller: "strollers",
    double_stroller: "double_strollers",
    car_seat: "car_seats",
    balance_bike: "balance_bikes",
  };
  const key = aliasMap[raw] || raw;
  return PRODUCT_CATEGORY_SEO_KEYWORDS[key]?.[lang] || PRODUCT_CATEGORY_SEO_KEYWORDS.all[lang];
}

export function getReviewSeoKeywords(type: string, lang: SupportedLang): string[] {
  const key = type || "all";
  return REVIEW_TYPE_SEO_KEYWORDS[key]?.[lang] || REVIEW_TYPE_SEO_KEYWORDS.all[lang];
}
