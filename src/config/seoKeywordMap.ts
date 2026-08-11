export type SupportedLang = "zh" | "en";

interface SeoKeywordEntry {
  zh: string[];
  en: string[];
}

export const PRODUCT_CATEGORY_SEO_KEYWORDS: Record<string, SeoKeywordEntry> = {
  all: {
    zh: ["婴儿车", "儿童自行车", "平衡车", "儿童滑板车", "儿童电动车"],
    en: [
      "balance bike toddler",
      "toddler bike",
      "twin stroller",
      "toddler bike",
      "kids electric bike",
    ],
  },
  strollers: {
    zh: ["慢跑婴儿推车", "旅行婴儿推车", "轻便婴儿推车", "双人婴儿推车", "婴儿推车评测"],
    en: [
      "jogging stroller",
      "travel stroller",
      "lightweight stroller",
      "twin stroller",
      "baby stroller"
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
    zh: ["慢跑婴儿推车", "双人慢跑婴儿推车", "慢跑推车评测"],
    en: ["jogging stroller", "twin jogging stroller", "jogging stroller review"],
  },
  kids_strollers: {
    zh: ["慢跑婴儿推车", "轻便婴儿推车", "旅行婴儿推车"],
    en: ["jogging stroller", "lightweight stroller", "travel stroller"]
  },
  balance_bikes: {
    zh: ["平衡车", "儿童平衡车", "适合1岁儿童的平衡车"],
    en: ["balance bike", "balance bike toddler", "balance bike for 1 year old"],
  },
  kids_scooters: {
    zh: ["儿童电动滑板车", "儿童滑板车", "可折叠电动滑板车", "带座椅电动滑板车"],
    en: ["kids electric scooter", "electric scooter for kids", "foldable electric scooter", "electric scooter with seat", "kids scooter"],
  },
  scooters: {
    zh: ["儿童电动滑板车", "儿童滑板车", "可折叠电动滑板车", "带座椅电动滑板车"],
    en: ["kids electric scooter", "electric scooter for kids", "foldable electric scooter", "electric scooter with seat", "kids scooter"],
  },
  kids_bikes: {
    zh: ["儿童自行车", "儿童电动自行车", "儿童越野摩托车", "儿童骑行车"],
    en: ["kids bike", "toddler bike", "kids electric bike", "electric dirt bike for kids", "kids dirt bike"],
  },
  kids_tricycles: {
    zh: ["儿童三轮车", "成长型三轮车"],
    en: ["kids tricycles", "toddler tricycle"],
  },
  electric_vehicles: {
    zh: ["儿童电动汽车", "儿童电动车", "儿童骑乘电动车", "12V 儿童电动车"],
    en: ["kids electric cars", "kids electric car", "kids electric ride on", "ride on toys 12v"],
  },
  car_seats: {
    zh: ["儿童安全座椅", "汽车安全座椅", "婴儿安全座椅"],
    en: ["car seats", "baby car seats", "child safety seats"],
  },
};

export const REVIEW_TYPE_SEO_KEYWORDS: Record<string, SeoKeywordEntry> = {
  all: {
    zh: ["旅行婴儿推车", "轻便婴儿推车", "幼儿自行车", "婴儿推车评测", "最佳慢跑婴儿推车", "儿童越野自行车"],
    en: ["travel stroller", "lightweight stroller", "toddler bike", "stroller reviews", "best jogging stroller", "kids dirt bike"],
  },
  single: {
    zh: ["旅行婴儿推车", "轻便婴儿推车", "幼儿自行车", "婴儿推车评测", "客观婴儿推车评测", "专家婴儿推车评测"],
    en: ["travel stroller", "lightweight stroller", "toddler bike", "stroller reviews", "unbiased stroller reviews", "expert stroller review"],
  },
  compare: {
    zh: ["旅行婴儿推车", "轻便婴儿推车", "幼儿自行车", "婴儿推车评测", "婴儿推车横向对比", "慢跑婴儿推车评测"],
    en: ["travel stroller", "lightweight stroller", "toddler bike", "stroller reviews", "stroller comparison", "jogging stroller review"],
  },
  value: {
    zh: ["儿童越野自行车", "儿童电动越野自行车", "儿童越野自行车安全", "儿童越野骑行"],
    en: ["kids dirt bike", "electric kids dirt bike", "kids dirt bike safety", "off-road kids ride"],
  },
  ranking: {
    zh: ["婴儿推车评测", "最佳旅行婴儿推车", "最佳慢跑婴儿推车", "婴儿推车榜单"],
    en: ["stroller reviews", "best travel stroller", "best jogging stroller", "top stroller picks"],
  },
  safety: {
    zh: ["儿童越野自行车安全审查", "婴儿推车安全测试", "慢跑婴儿推车稳定性", "婴儿推车评测"],
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
