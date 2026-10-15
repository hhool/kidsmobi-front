/**
 * Single source of truth for <meta name="keywords"> on every route.
 *
 * Mirrors src/lib/documentTitle.ts: the prerender (scripts/prerender-pages.ts)
 * and the hydrated SPA (src/App.tsx) used to compute keywords with two
 * different code paths, so the static HTML Google reads had no keywords meta at
 * all while a visitor's browser tab did. Both sides now call the functions here,
 * which are DOM-free so node scripts (prerender + the check:spakeywords guard)
 * can import them too.
 *
 * Route families this module resolves:
 *   - home / products / reviews / evaluations / guides / news / about
 *   - category hubs  (/products/<slug>/)
 *   - the 7 Plan-B reference assets
 *   - transparency pages
 *   - product detail pages  (via buildProductDetailKeywords with the product)
 *   - review detail pages  (/reviews/<type>/<id> add a fixed keyword set)
 *
 * Default-route keywords come from DEFAULT_SEO_CONFIGS, the same static base
 * the prerender emits. The SPA may additionally apply CMS overrides for those
 * routes (resolveCmsRouteSeoConfig); that divergence is tolerated the same way
 * the title guard tolerates it — the keyword guard verifies the prerender
 * emitted the static base correctly, not that the SPA's CMS override matches.
 */

import { SEO_TDK_LIMITS, DEFAULT_SEO_CONFIGS } from "../config/defaultSeo";
import { getProductDisplayTitle } from "./productSeoText";
import { getProductSeoKeywords } from "../config/seoKeywordMap";
import {
  SIZING_PATH,
  sizingSeo,
} from "../data/balanceBikeSizing";
import { AGE_PATH, ageSeo } from "../data/balanceBikeAge";
import { STABILITY_PATH, stabilitySeo } from "../data/balanceBikeStability";
import { BUDGET_PATH, budgetSeo } from "../data/balanceBikeBudget";
import { WEIGHT_PATH, weightSeo } from "../data/balanceBikeWeight";
import { SAFETY_PATH, safetySeo } from "../data/balanceBikeSafety";
import { BUYER_FEEDBACK_PATH, buyerFeedbackSeo } from "../data/balanceBikeBuyerFeedback";
import { RECALL_SAFETY_PATH, recallSeo } from "../data/safetyRecallRecord";
import { TRANSPARENCY_PAGES, getTransparencyPageByPath } from "../data/transparencyPages";

export type KeywordLang = "zh" | "en";

/** Local copy of the trimToLimit helper — kept out of the defaultSeo export so
 *  the prerender/guard stay free of app-only surface area. */
const trimSeoText = (value: string, limit: number): string => {
  const text = String(value || "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length <= limit ? text : text.slice(0, limit - 1).trimEnd();
};

/** Trims each candidate to the per-keyword cap and keeps the total under limit. */
export function fitKeywordsToLimit(keywords: string[], totalLimit: number): string[] {
  return keywords.reduce<string[]>((acc, keyword) => {
    const trimmed = trimSeoText(keyword, SEO_TDK_LIMITS.keyword);
    if (!trimmed) return acc;
    const next = [...acc, trimmed].join(", ");
    return next.length <= totalLimit ? [...acc, trimmed] : acc;
  }, []);
}

export const PRODUCT_DETAIL_KEYWORD_TEXT_LIMIT = 100;

/**
 * Keywords for a single product detail page. Accepts a pre-resolved categoryId
 * so the DOM-free callers (prerender, the guard) don't have to re-run category
 * inference — the SPA still passes resolveProductCategoryId(product).
 */
export function buildProductDetailKeywords(
  product: { brand?: unknown; [key: string]: unknown },
  lang: KeywordLang,
  categoryId?: string,
): string[] {
  const dedupedDisplayTitle = String(getProductDisplayTitle(product as any, lang) || "");
  const rawBrand = String(product.brand || "").trim();
  const categoryKeywords = getProductSeoKeywords(categoryId || "all", lang);
  const genericKeywords =
    lang === "zh"
      ? ["产品评测", "产品参数", "BalanceBikeToddler"]
      : ["product review", "product specs", "BalanceBikeToddler"];

  const rawCandidates = [
    dedupedDisplayTitle,
    dedupedDisplayTitle.toLowerCase().includes(rawBrand.toLowerCase()) ? "" : rawBrand,
    ...categoryKeywords.slice(0, 3),
    ...genericKeywords,
  ]
    .map((item) => String(item || "").trim())
    .filter(Boolean);

  const deduped = Array.from(new Set(rawCandidates));
  return fitKeywordsToLimit(deduped, PRODUCT_DETAIL_KEYWORD_TEXT_LIMIT);
}

/**
 * Bespoke TDK for /products/:category hubs. Kept in this shared module so the
 * prerender and the SPA can't drift apart. Mirrors PRODUCT_CATEGORY_PAGES in
 * scripts/prerender-pages.ts.
 */
export const CATEGORY_TDK_MAP: Record<
  string,
  { en: { title: string; description: string; keywords: string[] }; zh: { title: string; description: string; keywords: string[] } }
> = {
  stroller: {
    en: {
      title: "Best Jogging Stroller & Travel Stroller Reviews 2026 | BalanceBikeToddler",
      description: "Compare evidence-based jogging stroller, travel stroller, and twin stroller models with safety scores, stability metrics, and foldability insights.",
      keywords: ["jogging stroller", "travel stroller", "lightweight stroller", "twin stroller", "baby stroller"],
    },
    zh: {
      title: "2026 慢跑婴儿推车与旅行推车评测 | BalanceBikeToddler",
      description: "对照实验室数据比较慢跑婴儿推车、旅行推车与双人推车，重点查看安全评分、稳定性指标与折叠便携表现。",
      keywords: ["慢跑婴儿推车", "旅行婴儿推车", "轻便婴儿推车", "双人婴儿推车", "婴儿推车"],
    },
  },
  balance_bike: {
    en: {
      title: "Best Toddler Balance Bikes 2026: Evidence-Based Buying Guide - BalanceBikeToddler",
      description: "Compare published specifications and safety records for the safest toddler balance bikes. Compare weight capacity, stability scores, and features for top ride-on brands.",
      keywords: ["toddler balance bike", "kids balance bike", "1 year old balance bike", "ride-on balance bike"],
    },
    zh: {
      title: "2026最佳儿童无脚踏平衡车实验室深度评测 | BalanceBikeToddler",
      description: "探索BalanceBikeToddler无脚踏儿童滑步平衡车评分矩阵。深度比较车重工效、几何结构与核心通过性指数，助您科学决策。",
      keywords: ["儿童平衡车", "儿童滑步车", "1岁平衡车", "平衡训练车", "BalanceBikeToddler"],
    },
  },
  kids_bikes: {
    en: {
      title: "Best Kids Bikes & Toddler Bicycles 2026: Evidence-Based Buying Guide - BalanceBikeToddler",
      description: "Discover the safest and top-rated kids bikes for ages 2-14. Explore the database to compare BMX style, training wheels, and dual suspension bicycles.",
      keywords: ["kids bmx bike", "toddler bicycle", "kids bike training wheels", "pedal bike for children"],
    },
    zh: {
      title: "2026最佳适龄儿童自行车与充气轮单车深度评测 | BalanceBikeToddler",
      description: "获取2至14岁最适合最安全的儿童自行车候选数据库。极速对比辅助轮装配、前叉避震、机械双刹等力学客观指标。",
      keywords: ["儿童自行车", "儿童单车", "BMX儿童自行车", "带辅助轮自行车", "BalanceBikeToddler"],
    },
  },
  kids_scooters: {
    en: {
      title: "Best Kids Electric Scooter & Kick Scooter Reviews 2026 | BalanceBikeToddler",
      description: "Find source-reviewed kids electric scooter and kick scooter options, including foldable models, 3-wheel starters, and seated configurations.",
      keywords: ["kids electric scooter", "electric scooter for kids", "kids kick scooter", "foldable electric scooter"],
    },
    zh: {
      title: "2026 儿童电动滑板车与脚踏滑板车评测 | BalanceBikeToddler",
      description: "基于实验室测试对照儿童电动滑板车与脚踏滑板车，覆盖折叠便携、三轮入门稳定性与座椅配置等关键维度。",
      keywords: ["儿童电动滑板车", "儿童滑板车", "可折叠电动滑板车", "三轮儿童滑板车"],
    },
  },
  electric_vehicles: {
    en: {
      title: "Best Kids Electric Cars & Ride-On Toys Reviews 2026 | BalanceBikeToddler",
      description: "Review evidence-based kids electric cars, 12V/24V ride-on toys, and electric ride-on options with battery safety, braking control, and runtime benchmarks.",
      keywords: ["kids electric cars", "kids electric car", "kids ride on", "ride on toys 12v"],
    },
    zh: {
      title: "2026 儿童电动汽车与骑乘电动车评测 | BalanceBikeToddler",
      description: "对照实验室报告评估儿童电动汽车与 12V/24V 骑乘电动车，重点关注电池安全、制动控制与续航稳定性。",
      keywords: ["儿童电动汽车", "儿童电动车", "儿童骑乘电动车", "12V 儿童电动车"],
    },
  },
  car_seat: {
    en: {
      title: "Best Convertible & Toddler Car Seats 2026: Evidence-Based Buying Guide - BalanceBikeToddler",
      description: "Find the safest convertible and booster car seats for your child. Compare evidence-based scores, weight limits, and safety features for top brands like Graco and Evenflo.",
      keywords: ["convertible car seat", "booster car seat", "infant car seat", "child safety car seat"],
    },
    zh: {
      title: "2026最佳儿童汽车安全提篮与成长座椅深度评测 | BalanceBikeToddler",
      description: "探求最安全的儿童汽车安全座椅（安全提篮/增高垫）。涵盖侧向撞击防护技术、ISOFIX硬接口安装兼容性等专家质检数据。",
      keywords: ["安全座椅", "儿童安全提篮", "成长型安全座椅", "侧向防护座椅", "BalanceBikeToddler"],
    },
  },
};

const SLUG_TO_CATEGORY_ID: Record<string, string> = {
  strollers: "stroller",
  "balance-bikes": "balance_bike",
  "kids-bikes": "kids_bikes",
  "kids-scooters": "kids_scooters",
  "electric-cars": "electric_vehicles",
  "safety-seats": "car_seat",
  "kids-tricycles": "kids_tricycles",
};

// Review detail pages append the same five keywords regardless of which
// evaluation they cover — they're static, so the guard and prerender can both
// reproduce them without the evaluations dataset.
const REVIEW_DETAIL_KEYWORDS: Record<KeywordLang, string[]> = {
  en: ["travel stroller", "lightweight stroller", "toddler bike", "stroller reviews", "jogging stroller"],
  zh: ["旅行婴儿推车", "轻便婴儿推车", "幼儿自行车", "婴儿推车评测", "慢跑婴儿推车"],
};

const ASSET_SEO_BY_PATH: Record<string, { en: { keywords: readonly string[] }; zh: { keywords: readonly string[] } }> = {
  [SIZING_PATH]: sizingSeo,
  [AGE_PATH]: ageSeo,
  [STABILITY_PATH]: stabilitySeo,
  [BUDGET_PATH]: budgetSeo,
  [WEIGHT_PATH]: weightSeo,
  [SAFETY_PATH]: safetySeo,
  [BUYER_FEEDBACK_PATH]: buyerFeedbackSeo,
  [RECALL_SAFETY_PATH]: recallSeo,
};

function defaultKeywords(seoKey: string, lang: KeywordLang): string[] {
  const block = DEFAULT_SEO_CONFIGS[seoKey]?.[lang] || DEFAULT_SEO_CONFIGS.home[lang];
  return block.keywords;
}

/**
 * Keywords a prerendered static page (or the hydrated SPA) should publish for a
 * route. Used by both scripts/prerender-pages.ts and scripts/check-spa-keywords.ts.
 */
export function resolveRouteKeywords(
  routePath: string,
  lang: KeywordLang,
  categoryId?: string,
): string[] {
  const clean = `/${String(routePath || "").replace(/^\/+|\/+$/g, "")}/`;

  // Asset pages.
  const asset = ASSET_SEO_BY_PATH[clean];
  if (asset) return [...asset[lang].keywords];

  // Transparency pages.
  const transparencyPage = getTransparencyPageByPath(clean);
  if (transparencyPage) return transparencyPage[lang].seo?.keywords || [];

  // Category hubs: /products/<slug>/.
  const productsMatch = /^\/products\/([^/]+)\/?$/.exec(clean);
  if (productsMatch) {
    const slug = productsMatch[1];
    const catId = categoryId || SLUG_TO_CATEGORY_ID[slug];
    if (catId && CATEGORY_TDK_MAP[catId]) return CATEGORY_TDK_MAP[catId][lang].keywords;
    return defaultKeywords("products", lang);
  }

  // Review detail pages: /reviews/<type>/<id>.
  const reviewDetailMatch = /^\/reviews\/(single|compare|value|ranking|safety)\/[^/]+\/?$/.exec(clean);
  if (reviewDetailMatch) {
    return Array.from(new Set([...defaultKeywords("reviews", lang), ...REVIEW_DETAIL_KEYWORDS[lang]]));
  }

  // Generic index routes. `clean` carries a trailing slash (e.g. "/reviews/"),
  // so strip it before the lookup — otherwise every generic route silently
  // falls through to the home fallback and publishes the home keywords.
  const indexMap: Record<string, string> = {
    "/": "home",
    "/products": "products",
    "/reviews": "reviews",
    "/evaluations": "evaluations",
    "/guides": "guides",
    "/news": "news",
    "/about": "about",
  };
  const normKey = clean.replace(/\/+$/, "") || "/";
  if (indexMap[normKey]) return defaultKeywords(indexMap[normKey], lang);

  // Unknown route — fall back to home so the prerender at least emits something.
  return defaultKeywords("home", lang);
}

/** Convenience: join keywords the way the meta tag is written. */
export function keywordsToMetaContent(keywords: string[]): string {
  return keywords.join(", ");
}

export { TRANSPARENCY_PAGES };
