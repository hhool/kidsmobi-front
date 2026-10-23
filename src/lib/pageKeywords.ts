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
 *   - guides article detail pages  (/guides/<topic>/<slug>)
 *   - news channel + article detail pages  (/news/<channel>[/<slug>])
 *   - review type hubs  (/reviews/<type>)
 *
 * Anything not matched here falls back to the home keyword block — which is
 * how every guides article, news page and review-type hub silently published
 * "jogging stroller / kids electric cars" for months. The check:spakeywords
 * guard asserts no route other than "/" may publish the home block, so a new
 * route family that forgets a branch fails the build instead of shipping.
 *
 * Default-route keywords come from DEFAULT_SEO_CONFIGS, the same static base
 * the prerender emits. The SPA may additionally apply CMS overrides for those
 * routes (resolveCmsRouteSeoConfig); that divergence is tolerated the same way
 * the title guard tolerates it — the keyword guard verifies the prerender
 * emitted the static base correctly, not that the SPA's CMS override matches.
 */

import { SEO_TDK_LIMITS, DEFAULT_SEO_CONFIGS } from "../config/defaultSeo";
import { getProductDisplayTitle } from "./productSeoText";
import { getProductSeoKeywords, getReviewSeoKeywords } from "../config/seoKeywordMap";
import {
  SIZING_PATH,
  sizingSeo,
} from "../data/balanceBikeSizing";
import {
  KIDS_SIZING_PATH,
  kidsBikeSizingSeo,
} from "../data/kidsBikeSizing";
import { AGE_PATH, ageSeo } from "../data/balanceBikeAge";
import { KIDS_AGE_PATH, kidsAgeSeo } from "../data/kidsBikeAge";
import { KIDS_PRICE_PATH, kidsPriceSeo } from "../data/kidsBikePrice";
import { STABILITY_PATH, stabilitySeo } from "../data/balanceBikeStability";
import { BUDGET_PATH, budgetSeo } from "../data/balanceBikeBudget";
import { WEIGHT_PATH, weightSeo } from "../data/balanceBikeWeight";
import { SAFETY_PATH, safetySeo } from "../data/balanceBikeSafety";
import { KIDS_SAFETY_PATH, kidsSafetySeo } from "../data/kidsBikeSafety";
import { BUYER_FEEDBACK_PATH, buyerFeedbackSeo } from "../data/balanceBikeBuyerFeedback";
import { RECALL_SAFETY_PATH, recallSeo } from "../data/safetyRecallRecord";
import { TRANSPARENCY_PAGES, getTransparencyPageByPath } from "../data/transparencyPages";
import {
  GUIDES_TOPIC_PAGES,
  normalizeGuidesTopicId,
  type GuidesTopicPageId,
} from "./guidesTopicPages";

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
 * scripts/prerender-pages.ts (which now DERIVES its titles/descriptions from
 * this map — edit here only).
 *
 * Titles are final <title> values INCLUDING the brand suffix and must stay
 * <= 65 chars: buildDocumentTitle() (prerender) and publishSectionTitle()
 * (SPA) both leave an already-suffixed title under the cap untouched, which
 * is what keeps the two renderers byte-identical. scripts/check-spa-titles.ts
 * recomputes the SPA value from this map and fails the build on drift.
 */
export const CATEGORY_TDK_MAP: Record<
  string,
  { en: { title: string; description: string; keywords: string[] }; zh: { title: string; description: string; keywords: string[] } }
> = {
  stroller: {
    en: {
      title: "Best Jogging Stroller & Travel Stroller | BalanceBikeToddler",
      description: "Compare evidence-based jogging stroller, travel stroller, and twin stroller models with safety scores, stability metrics, and foldability insights.",
      keywords: ["jogging stroller", "travel stroller", "lightweight stroller", "twin stroller", "baby stroller"],
    },
    zh: {
      title: "2026 慢跑婴儿推车与旅行推车评测 | BalanceBikeToddler",
      description: "对照公开规格比较慢跑婴儿推车、旅行推车与双人推车，重点查看安全评分、稳定性指标与折叠便携表现。",
      keywords: ["慢跑婴儿推车", "旅行婴儿推车", "轻便婴儿推车", "双人婴儿推车", "婴儿推车"],
    },
  },
  balance_bike: {
    en: {
      title: "Best Toddler Balance Bikes 2026 | BalanceBikeToddler",
      description: "Compare published specifications and safety records for the safest toddler balance bikes. Compare weight capacity, stability scores, and features for top ride-on brands.",
      keywords: ["toddler balance bike", "kids balance bike", "1 year old balance bike", "ride-on balance bike"],
    },
    zh: {
      title: "2026最佳儿童无脚踏平衡车深度评测 | BalanceBikeToddler",
      description: "探索BalanceBikeToddler无脚踏儿童滑步平衡车评分矩阵。深度比较车重工效、几何结构与核心通过性指数，助您科学决策。",
      keywords: ["儿童平衡车", "儿童滑步车", "1岁平衡车", "平衡训练车", "BalanceBikeToddler"],
    },
  },
  kids_bikes: {
    en: {
      title: "Best Kids Bikes & Toddler Bicycles 2026 | BalanceBikeToddler",
      // Every attribute named here is backed by the published set — see
      // scripts/count-kids-bikes-figures.mjs. The previous description claimed
      // "dual suspension"; the Suspension Type attribute is Rigid on 17 of 24
      // published listings and Dual on exactly one, so the claim is gone.
      description: "Compare kids bikes by wheel size (12-24 inch), brake style and rider age 2-14 — including BMX style bikes with training wheels and cruiser frames.",
      keywords: ["kids bike training wheels", "12 inch kids bike", "kids bmx bike", "coaster brake kids bike", "toddler bicycle"],
    },
    zh: {
      title: "2026最佳适龄儿童自行车与充气轮单车深度评测 | BalanceBikeToddler",
      description: "获取2至14岁最适合最安全的儿童自行车候选数据库。极速对比辅助轮装配、前叉避震、机械双刹等力学客观指标。",
      keywords: ["儿童自行车", "儿童单车", "BMX儿童自行车", "带辅助轮自行车", "BalanceBikeToddler"],
    },
  },
  kids_scooters: {
    en: {
      // The 7 published listings in this category are all kick scooters — the
      // CMS does carry 6 adult electric scooters under the same raw category,
      // but none of them is published here. Three of the four previous
      // keywords promised "electric", which the page cannot back up.
      title: "Best Kids Kick Scooters & 3-Wheel Scooters | BalanceBikeToddler",
      description: "Compare source-reviewed kids kick scooters and 3-wheel scooters, including foldable frames, lean-to-steer starters and LED wheel models.",
      keywords: ["kids kick scooter", "3 wheel scooter for kids", "foldable kids scooter", "toddler scooter", "lean to steer scooter"],
    },
    zh: {
      title: "2026 儿童脚踏滑板车与三轮滑板车评测 | BalanceBikeToddler",
      description: "基于公开规格对照儿童脚踏滑板车与三轮滑板车，覆盖折叠收纳、倾斜转向入门稳定性与 LED 发光轮等配置。",
      keywords: ["儿童滑板车", "儿童脚踏滑板车", "三轮儿童滑板车", "可折叠儿童滑板车", "倾斜转向滑板车"],
    },
  },
  electric_vehicles: {
    en: {
      title: "Best Kids Electric Cars & Ride-On Toys | BalanceBikeToddler",
      description: "Review evidence-based kids electric cars, 12V/24V ride-on toys, and electric ride-on options with battery safety, braking control, and runtime benchmarks.",
      keywords: ["kids electric cars", "kids electric car", "kids ride on", "ride on toys 12v"],
    },
    zh: {
      title: "2026 儿童电动汽车与骑乘电动车评测 | BalanceBikeToddler",
      description: "对照公开资料评估儿童电动汽车与 12V/24V 骑乘电动车，重点关注电池安全、制动控制与续航稳定性。",
      keywords: ["儿童电动汽车", "儿童电动车", "儿童骑乘电动车", "12V 儿童电动车"],
    },
  },
  car_seat: {
    en: {
      title: "Best Convertible & Toddler Car Seats 2026 | BalanceBikeToddler",
      description: "Find the safest convertible and booster car seats for your child. Compare evidence-based scores, weight limits, and safety features for top brands like Graco and Evenflo.",
      keywords: ["convertible car seat", "booster car seat", "infant car seat", "child safety car seat"],
    },
    zh: {
      title: "2026最佳儿童汽车安全提篮与成长座椅深度评测 | BalanceBikeToddler",
      description: "探求最安全的儿童汽车安全座椅（安全提篮/增高垫）。对比侧向撞击防护技术、ISOFIX 硬接口安装兼容性等公开规格。",
      keywords: ["安全座椅", "儿童安全提篮", "成长型安全座椅", "侧向防护座椅", "BalanceBikeToddler"],
    },
  },
  // Legacy "other" bucket re-homed (P0-2): tricycles + push ride-ons +
  // pull-along wagons live under /products/kids-tricycles/. The SPA resolves
  // this key for activeProductCategory === "kids_tricycles"; the prerender
  // keeps its internal categoryId "other_tricycles" for detail-page grouping.
  kids_tricycles: {
    en: {
      title: "Best Kids Tricycles & Push Ride-On Toys | BalanceBikeToddler",
      description: "Browse evidence-based kids tricycles, push ride-on cars, and pull-along wagons with stability scores, weight limits, and age-fit guidance for toddlers.",
      keywords: ["kids tricycle", "ride on toys", "pull along wagon", "tricycle for toddlers"],
    },
    zh: {
      title: "儿童三轮车与滑行玩具 2026 精选 | BalanceBikeToddler",
      description: "浏览已覆盖的儿童三轮车、滑行汽车与拉货车，包含稳定性评分、承重上限与适龄建议。",
      keywords: ["儿童三轮车", "儿童骑乘玩具", "拉货车", "三轮车"],
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

// News channels (/news/<channel> and /news/<channel>/<slug>). Canonical ids
// mirror NEWS_ROUTE_CATEGORY_IDS in src/App.tsx; the alias map mirrors
// NEWS_ROUTE_CATEGORY_ALIASES so a URL segment and the SPA's activeNewsCategory
// resolve to the same set. These are deliberately fresh copy — the /news hub
// keywords in DEFAULT_SEO_CONFIGS are still the five-category legacy block
// (tracked separately), and articles must not inherit THOSE either.
const NEWS_CHANNEL_KEYWORDS: Record<string, Record<KeywordLang, string[]>> = {
  industry: {
    en: ["balance bike industry news", "kids bike market trends", "ride-on toy industry news", "balance bike market report"],
    zh: ["平衡车行业资讯", "儿童自行车市场趋势", "骑乘玩具行业新闻"],
  },
  new_product: {
    en: ["new balance bike releases", "kids bike launches", "new ride-on toys", "balance bike new model"],
    zh: ["平衡车新品发布", "儿童自行车新品", "新骑乘玩具"],
  },
  brand_news: {
    en: ["balance bike brand news", "kids bike brand updates", "balance bike manufacturer news"],
    zh: ["平衡车品牌动态", "儿童自行车品牌资讯"],
  },
  science: {
    en: ["balance bike safety research", "kids bike safety studies", "child development research", "balance bike standards news"],
    zh: ["平衡车安全研究", "儿童自行车安全标准", "儿童发展研究"],
  },
};

// Union of the alias maps that exist for news categories — App.tsx's
// NEWS_ROUTE_CATEGORY_ALIASES (routing) and NewsSection's normalizeNewsCategory
// (article loading) — so a raw CMS category in a prerendered URL and the SPA's
// canonical activeNewsCategory always resolve to the same set.
const NEWS_CHANNEL_ALIASES: Record<string, string> = {
  brand_trend: "brand_news",
  brand_dynamics: "brand_news",
  trends: "industry",
  policy: "science",
  regulation: "science",
  regulations: "science",
  new: "new_product",
  launches: "new_product",
};

/** Keyword set for a news channel, resolved from a URL segment or a CMS
 *  category value. Unknown channels fall back to the /news hub set, never to
 *  the home block. */
export function newsChannelKeywords(channelSegment: string, lang: KeywordLang): string[] {
  const raw = String(channelSegment || "").trim().toLowerCase().replace(/[-\s]+/g, "_");
  const canonical = NEWS_CHANNEL_ALIASES[raw] || raw;
  const channel = NEWS_CHANNEL_KEYWORDS[canonical];
  return channel ? [...channel[lang]] : defaultKeywords("news", lang);
}

/**
 * Keyword set for a guides article detail page (/guides/<topic>/<slug>),
 * resolved by its topic segment. Mirrors GuidesSection's topic normalisation
 * so the prerendered meta and the hydrated one publish the same set.
 */
export function guidesArticleKeywords(topicSegment: string, lang: KeywordLang): string[] {
  const topic = normalizeGuidesTopicId(topicSegment);
  const page = GUIDES_TOPIC_PAGES[topic as GuidesTopicPageId];
  return page ? [...page.keywords[lang]] : [...GUIDES_TOPIC_PAGES.beginner.keywords[lang]];
}

/**
 * Asset routes are keyed without a trailing slash. They are not all one shape:
 * six are directory indexes ("/balance-bike-weight/") but the recall record
 * became a file route when it moved under /guides/risk/ (2026-10-22), and a
 * lookup done with the raw path missed it — the record fell through to the
 * /guides/<topic>/<slug> branch and published the risk topic's keywords in the
 * static HTML while the hydrated SPA published its own. Keying both sides the
 * same way keeps that from depending on how a route happens to be written.
 */
const assetKey = (path: string): string => `/${String(path || "").replace(/^\/+|\/+$/g, "")}`;

const ASSET_SEO_BY_PATH: Record<string, { en: { keywords: readonly string[] }; zh: { keywords: readonly string[] } }> = {
  [assetKey(SIZING_PATH)]: sizingSeo,
  [assetKey(KIDS_SIZING_PATH)]: kidsBikeSizingSeo,
  [assetKey(AGE_PATH)]: ageSeo,
  [assetKey(KIDS_AGE_PATH)]: kidsAgeSeo,
  [assetKey(KIDS_PRICE_PATH)]: kidsPriceSeo,
  [assetKey(STABILITY_PATH)]: stabilitySeo,
  [assetKey(BUDGET_PATH)]: budgetSeo,
  [assetKey(WEIGHT_PATH)]: weightSeo,
  [assetKey(SAFETY_PATH)]: safetySeo,
  [assetKey(KIDS_SAFETY_PATH)]: kidsSafetySeo,
  [assetKey(BUYER_FEEDBACK_PATH)]: buyerFeedbackSeo,
  [assetKey(RECALL_SAFETY_PATH)]: recallSeo,
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
  const asset = ASSET_SEO_BY_PATH[assetKey(routePath)];
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

  // Guides topic pages: /guides/<topic>. Without this branch every topic
  // index silently published the home keywords (the unknown-route fallback) —
  // /guides/beginner included. Values come from GUIDES_TOPIC_PAGES, the same
  // module the prerender builds the filter pages from.
  const guidesTopicMatch = /^\/guides\/([^/]+)\/?$/.exec(clean);
  if (guidesTopicMatch) {
    const topic = guidesTopicMatch[1] as GuidesTopicPageId;
    const page = GUIDES_TOPIC_PAGES[topic];
    if (page) return [...page.keywords[lang]];
  }

  // Guides article detail pages: /guides/<topic>/<slug>. Same unknown-route
  // fallback bug as the topic indexes had: every CMS article published the
  // home keyword block — retired-category words ("jogging stroller", "kids
  // electric cars") included — until this branch landed. Articles inherit
  // their topic's set; the topic segment is normalised the same way
  // GuidesSection normalises the CMS taxonomy value.
  const guidesArticleMatch = /^\/guides\/([^/]+)\/([^/]+)\/?$/.exec(clean);
  if (guidesArticleMatch) {
    return guidesArticleKeywords(guidesArticleMatch[1], lang);
  }

  // News channel pages and article detail pages: /news/<channel>[/<slug>].
  // The same fallback bug — both shapes published the home block. Channels
  // resolve through the shared alias map so an aliased URL segment and the
  // SPA's canonical activeNewsCategory land on the same set.
  const newsChannelMatch = /^\/news\/([^/]+)(?:\/[^/]+)?\/?$/.exec(clean);
  if (newsChannelMatch) {
    return newsChannelKeywords(newsChannelMatch[1], lang);
  }

  // Review type hubs: /reviews/<type>. Mirrors what the SPA adds on hydration
  // (App.tsx): the reviews-hub set plus the type's own keywords. Without this
  // branch the prerender published the home block while hydration published
  // something else entirely.
  const reviewTypeMatch = /^\/reviews\/(single|compare|value|ranking|safety)\/?$/.exec(clean);
  if (reviewTypeMatch) {
    return Array.from(new Set([...defaultKeywords("reviews", lang), ...getReviewSeoKeywords(reviewTypeMatch[1], lang)]));
  }

  // Generic index routes. `clean` carries a trailing slash (e.g. "/reviews/"),
  // so strip it before the lookup — otherwise every generic route silently
  // falls through to the home fallback and publishes the home keywords.
  const indexMap: Record<string, string> = {
    "/": "home",
    "/products": "products",
    "/reviews": "reviews",
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
