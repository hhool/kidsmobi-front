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
      // 2026-11-03 中文段按新版英文 TDK 重译：原先这里直接放的是英文标题
      // （"Best Kids Bikes, Strollers, Scooters | …"），中文首页拿不到中文标题。
      // 中文标题同样自带品牌后缀，整串需 ≤65 字符（publishSectionTitle 的上限）。
      title: "最佳儿童自行车、婴儿推车与滑板车 | BalanceBikeToddler",
      description: "独立、基于公开规格参数的对比与安全评测，覆盖平衡车、儿童自行车、慢跑婴儿推车、儿童滑板车与儿童电动汽车。",
      keywords: ["儿童平衡车", "儿童滑板车", "儿童自行车", "慢跑婴儿推车", "儿童电动汽车"]
    },
    en: {
      // 2026-11-02 首页/目录页 TDK 分家：/products 改为 "Kids Mobility Product Hub & Specs"
      // 承接目录意图，首页这才可以回到纯品类标题（原先两页都以 "…Kids Bikes, Strollers
      // & Scooters" 开头，近似同题互相稀释）。
      // 主干必须 ≤44 字符 = TITLE_MAX_CHARS(65) - " | BalanceBikeToddler"(21)，否则
      // buildDocumentTitle 会按词截断主干、吃掉尾部词（实测 46 字符主干带 ": Reviews"
      // 时，线上发布成 "Best Kids Bikes, Strollers & Scooters"，后缀整段消失且不报错）。
      // 注意：线上真源是 CMS seo.home，本处仅兜底，需与 CMS 同步，否则 CMS 覆盖后线上不变。
      title: "Best Kids Bikes, Strollers & Scooters | BalanceBikeToddler",
      description: "Independent, spec-based comparisons and safety reviews of balance bikes, kids bikes, jogging strollers, kids scooters and kids electric cars.",
      keywords: ["balance bike", "kids scooter", "kids bike", "jogging stroller", "kids electric car"]
    },
  },
  products: {
    zh: {
      // 2026-11-03 与英文新题（Kids Mobility Product Hub & Specs）对齐：中文标题
      // 由"品类罗列"改为"产品库 + 规格参数"，和中文首页的品类标题区分开。
      title: "童车产品库：规格参数与对比 | BalanceBikeToddler",
      description: "按技术规格筛选并对比幼儿自行车、幼儿平衡车、双人婴儿推车与儿童电动滑板车，快速锁定适合孩子的童车。",
      keywords: ["幼儿自行车", "幼儿平衡车", "双人婴儿推车", "儿童电动滑板车"],
    },
    en: {
      // 2026-11-02 目录意图独立成题：原先 /products 与首页同以 "…Kids Bikes, Strollers
      // & Scooters" 开头（只差 Top/Best），两页互相稀释。改为 "Kids Mobility Product
      // Hub & Specs"，由目录页独占"筛选+规格对比"意图，首页回归品类词。
      // 关键词回到目录级长尾（toddler bike / balance bike toddler / twin stroller /
      // kids electric scooter）——"twin stroller" 在 10-22 曾因"是推车子型号而非目录词"
      // 被退役，此处按 2026-11-02 新稿恢复为目录页关键词。
      title: "Kids Mobility Product Hub & Specs | BalanceBikeToddler",
      description: "Filter and compare technical specifications for toddler bikes, balance bikes for toddlers, twin strollers, and kids electric scooters.",
      keywords: ["toddler bike", "balance bike toddler", "twin stroller", "kids electric scooter"],
    },
  },
  reviews: {
    zh: {
      // 2026-11-03 与英文新稿（Expert Kids Bikes & Stroller Reviews / 生物力学
      // 安全审计）对齐重译，中文关键词按 travel / jogging stroller、kids dirt
      // bike 与推车评测四类重排。
      title: "儿童自行车与婴儿推车专业评测 | BalanceBikeToddler",
      description: "深度评测与生物力学安全审计，覆盖旅行婴儿推车、慢跑婴儿推车、儿童越野摩托车与骑乘玩具。",
      keywords: ["旅行婴儿推车", "慢跑婴儿推车", "儿童越野摩托车", "婴儿推车评测"],
    },
    en: {
      // 2026-11-02 新稿：description 换成"深度评测 + 生物力学安全审计"口径，关键词按
      // 评测页真实品类（travel / jogging stroller、kids dirt bike、ride-on）重排。
      // 注：11-01 曾把这句校准成 "Read unbiased stroller reviews, travel stroller
      // models, and heavy-duty jogging strollers…"，本次按用户新稿整体替换（如需回滚，
      // 该句在 commit 82b06be 之前的历史里）。
      title: "Expert Kids Bikes & Stroller Reviews | BalanceBikeToddler",
      description: "In-depth reviews and biomechanical safety audits for travel strollers, jogging strollers, kids dirt bikes, and ride-on toys.",
      keywords: ["travel stroller", "jogging stroller", "kids dirt bike", "stroller reviews"],
    },
  },
  guides: {
    zh: {
      // 2026-11-03 与英文新稿（Age, Size & Budget / 推车选择 + 1 岁平衡车 +
      // 尺寸表与内缝计算器）对齐：补回英文标题里的"尺寸"，描述覆盖三件事。
      title: "平衡车指南：年龄、尺寸与预算 | BalanceBikeToddler",
      description: "手把手教你挑选婴儿推车、为 1 岁宝宝选对平衡车，并用尺寸对照表与腿长（内缝）计算器核对坐高。",
      keywords: ["如何挑选婴儿推车", "1岁宝宝平衡车", "平衡车尺寸对照表"],
    },
    en: {
      // 2026-11-02 新稿：description 回到"stroller 选择 + 1 岁平衡车 + 尺寸表/内缝
      // 计算器"三件事。注意指南库本身是平衡车优先（价格档/按年龄/what-buyers-say/
      // 稳定性），stroller 只在少数篇目出现——若后续 GSC 显示该页 stroller 词点击差、
      // 平衡车词曝光高，应把首句换回平衡车。
      title: "Balance Bike Guides: Age, Size & Budget | BalanceBikeToddler",
      description: "Learn how to choose a baby stroller, pick the best balance bike for a 1-year-old, and use our size charts and inseam calculators.",
      keywords: ["how to choose a baby stroller", "balance bike for 1 year old", "balance bike size chart"],
    },
  },
  news: {
    zh: {
      // 2026-11-03 与英文新题（News, Standards & Recalls）对齐：中文标题从
      // "电动出行资讯"扩到"资讯 + 安全标准 + 召回"，与站点实际产出的电池安全
      // 标准、CPSC 召回内容一致。
      title: "儿童出行资讯、安全标准与召回 | BalanceBikeToddler",
      description: "儿童电动自行车、儿童越野电动车与可折叠滑板车的最新资讯、电池安全标准与召回动态。",
      keywords: ["儿童电动自行车", "儿童越野电动车", "可折叠电动滑板车"],
    },
    en: {
      // 2026-11-02 新稿：标题从"电动自行车/滑板车资讯"扩到"资讯 + 标准 + 召回"，
      // 与站点实际产出的电池安全标准、CPSC 召回内容对齐（原题只覆盖电动品类）。
      title: "Kids Mobility News, Standards & Recalls | BalanceBikeToddler",
      description: "Latest news, battery safety standards, and recall updates for kids electric bikes, electric dirt bikes, and foldable scooters.",
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
      title: "Independent Reviews of Kids Bikes & Strollers | BalanceBikeToddler",
      description: "Learn about BalanceBikeToddler's evaluation methodology. We review every jogging stroller, balance bike, and kids scooter against published specs, recall records, and owner feedback.",
      keywords: ["BalanceBikeToddler", "independent reviews", "child mobility safety", "evaluation methodology"],
    },
  },
};

export const FALLBACK_FIRST_SEO_KEYS = new Set(["home", "products", "reviews", "guides", "news", "about"]);