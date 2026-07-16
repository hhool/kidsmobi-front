import { useState, useEffect, useRef, FormEvent, useMemo, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Baby,
  ShieldCheck,
  Send,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Globe,
  Award,
  BookOpen,
  Search,
  Scale,
  LogOut,
  Settings as SettingsIcon,
  Maximize2,
  ThumbsUp,
  ThumbsDown,
  ChevronRight,
  ChevronLeft,
  Twitter,
  Facebook,
  Youtube,
  Music,
  X,
  ArrowUp
} from "lucide-react";
import { guideArticles } from "./data/guidesData";
import { newsArticles } from "./data/newsData";
import { initialEvaluationsData } from "./data/evaluationsData";
import { ChildProfile, Product, ChatMessage, CMSSettings, Evaluation, CMSPageConfig } from "./types";

// Import translations
import { translations, translateProduct, translateNewsArticle, translateGuideArticle, countries, getCurrencyData } from "./lib/translate";
import { formatWeight, formatHeight } from "./lib/units";
import { resolveProductImages } from "./lib/productImages";
import { getProductImageAlt, getProductsPageSeoTitle } from "./lib/productSeoText";
import { loadBatchProducts } from "./lib/loadBatchProducts";

import SmartImage from "./components/common/SmartImage";

const HomeSection = lazy(() => import("./components/HomeSection"));
const NewsSection = lazy(() => import("./components/NewsSection"));
const ProductsSection = lazy(() => import("./components/ProductsSection"));
const EvaluationsSection = lazy(() => import("./components/EvaluationsSection"));
const GuidesSection = lazy(() => import("./components/GuidesSection"));
const AboutSection = lazy(() => import("./components/AboutSection"));
const AuthSection = lazy(() => import("./components/AuthSection"));
const DetailedProductView = lazy(() => import("./components/DetailedProductView"));
const AdminPanel = lazy(() => import("./components/AdminPanel"));
const TransparencyPage = lazy(() => import("./components/TransparencyPage"));

import { auth } from "./lib/firebase";
import {
  addBookmarkToFirestore,
  getBookmarksFromFirestore,
  getChildProfileFromFirestore,
  removeBookmarkFromFirestore,
  saveChildProfileToFirestore,
} from "./lib/firestoreService";
import { checkIsAdmin, getCMSSettings, getCMSProducts, getCMSEvaluations, seedProductsToFirestore, seedEvaluationsToFirestore, seedGuidesToFirestore, seedNewsToFirestore } from "./lib/cmsService";
import { fetchContentBundle, isScrapedContentSource } from "./lib/contentSource";
import { DEFAULT_SEO_CONFIGS, normalizeSeoConfig } from "./config/defaultSeo";
import { getProductSeoKeywords, getReviewSeoKeywords } from "./config/seoKeywordMap";
import { getTransparencyPageByPath, TRANSPARENCY_PAGE_PATHS, type TransparencyPageKey } from "./data/transparencyPages";

const SEO_KEY_TO_PAGE_TYPE: Record<string, CMSPageConfig["pageType"]> = {
  home: "home",
  products: "products_index",
  evaluations: "reviews_index",
  guides: "guides_index",
  news: "news_index",
  about: "about",
};

let defaultProductsDataPromise: Promise<Product[]> | null = null;

function loadDefaultProductsData() {
  defaultProductsDataPromise ??= import("./data/modelsData").then(({ productsData }) => {
    return productsData.map((product) => ({
      ...product,
      status: String((product as any)?.status || "published").trim().toLowerCase() || "published",
    }));
  });
  return defaultProductsDataPromise;
}

const DEFAULT_CMS_PAGE_BLUEPRINT: Record<string, CMSPageConfig> = {
  home: { pageType: "home", pageSlug: "home", pageIndex: 1, paginationPolicy: "none", indexingPolicy: "index", status: "published" },
  products: { pageType: "products_index", pageSlug: "products", pageIndex: 1, paginationPolicy: "page_path", indexingPolicy: "index", status: "published" },
  evaluations: { pageType: "reviews_index", pageSlug: "reviews", pageIndex: 1, paginationPolicy: "page_path", indexingPolicy: "index", status: "published" },
  guides: { pageType: "guides_index", pageSlug: "guides", pageIndex: 1, paginationPolicy: "page_path", indexingPolicy: "index", status: "published" },
  news: { pageType: "news_index", pageSlug: "news", pageIndex: 1, paginationPolicy: "page_path", indexingPolicy: "index", status: "published" },
  about: { pageType: "about", pageSlug: "about", pageIndex: 1, paginationPolicy: "none", indexingPolicy: "index", status: "published" },
};

const PRODUCTS_PAGE_KEYWORDS_EN = [
  "toddler bike",
  "balance bike toddler",
  "twin stroller",
  "kids electric scooter",
];

const applyPageKeywordOverride = (seoKey: string, keywords: string[], lang: "zh" | "en", activeProductCategory = "all") => {
  if (seoKey === "products" && lang === "en" && activeProductCategory === "all") {
    return PRODUCTS_PAGE_KEYWORDS_EN;
  }
  return keywords;
};

const PRODUCT_NAV_OPTIONS: Array<{ id: string; zh: string; en: string }> = [
  { id: "all", zh: "全部品类", en: "All Categories" },
  { id: "stroller", zh: "婴儿推车", en: "Kids Stroller" },
  { id: "balance_bike", zh: "平衡车", en: "Balance Bike" },
  { id: "kids_bikes", zh: "儿童自行车", en: "Kids Bikes" },
  { id: "kids_scooters", zh: "儿童滑板车", en: "Kids Scooters" },
  { id: "electric_vehicles", zh: "儿童电动车", en: "Electric Vehicles" },
  { id: "car_seat", zh: "安全座椅", en: "Car Seat" },
];

const REVIEW_NAV_OPTIONS: Array<{ id: string; zh: string; en: string }> = [
  { id: "single", zh: "单品实测", en: "Single Test" },
  { id: "compare", zh: "多品横评", en: "Cross Compare" },
  { id: "value", zh: "性价比测评", en: "Value Rank" },
  { id: "ranking", zh: "年度榜单", en: "Annual Top" },
  { id: "safety", zh: "安全专项", en: "Safety Special" },
];

const PRODUCT_ROUTE_IDS = new Set(PRODUCT_NAV_OPTIONS.map((item) => item.id));
const REVIEW_ROUTE_IDS = new Set(REVIEW_NAV_OPTIONS.map((item) => item.id));
const PRODUCT_ROUTE_ALIASES: Record<string, string> = {
  scooters: "kids_scooters",
  scooter: "kids_scooters",
  balance: "balance_bike",
  "balance bike": "balance_bike",
  bicycle: "kids_bikes",
  tricycle: "kids_tricycles",
  electric_car: "electric_vehicles",
  safety_seat: "car_seat",
  strollers: "stroller",
  jogger_stroller: "stroller",
  jogging_stroller: "stroller",
  jogger: "stroller",
  jogging: "stroller",
};
const EXCLUDED_PRODUCT_CATEGORY_IDS = new Set([
  "playard",
  "high_chair",
  "kids_push_ride_ons",
  "kids_pull_along_wagons",
  "baby_carrier",
]);

const PRODUCT_CATEGORY_ID_ALIASES: Record<string, string> = {
  ...PRODUCT_ROUTE_ALIASES,
  strollers: "stroller",
};

const inferMisclassifiedCategoryId = (product: Product, normalizedCategoryId: string) => {
  if (normalizedCategoryId !== "stroller") return normalizedCategoryId;

  const text = [
    product.name,
    (product as any)?.title,
    product.description,
    (product as any)?.zh?.description,
    (product as any)?.en?.description,
  ]
    .map((item) => String(item || "").toLowerCase())
    .join(" ");

  const hasStrollerSignal = /(stroller|pram|pushchair|buggy|jogger|jogging|travel\s+system|umbrella\s+stroller|double\s+stroller|twin\s+stroller|推车|婴儿车|慢跑推车|双人推车)/i.test(text);
  const hasCarSeatSignal = /(\bcar\s*seat\b|\bbooster\s*seat\b|\bconvertible\s*car\s*seat\b|\binfant\s*car\s*seat\b|安全座椅|提篮座椅)/i.test(text);
  const hasHighChairSignal = /(\bhigh\s*chair\b|feeding\s*chair|餐椅)/i.test(text);
  const hasPlayardSignal = /(\bplayard\b|\bplay\s*yard\b|\bpack\s*(n|and)\s*play\b|围栏床|游戏床)/i.test(text);
  const hasCarrierSignal = /(\bbaby\s*carrier\b|carrier\s*wrap|hip\s*seat\s*carrier|\bsling\b|背带)/i.test(text);
  const hasNurserySignal = /(\bmattress\b|\bcrib\b|\bbassinet\b|\bbaby\s*swing\b|\bswings\s*for\s*infants\b|\brocker\b|\bbouncer\b|\bsoother\b|\bplaypen\b|\bdiaper\b|\bbottle\s*warmer\b|\bbreast\s*pump\b|\bnursery\b|床垫|婴儿床|摇椅|秋千|安抚椅|尿布|奶瓶加热)/i.test(text);

  if (hasCarSeatSignal && !hasStrollerSignal) return "car_seat";
  if (hasHighChairSignal && !hasStrollerSignal) return "high_chair";
  if (hasPlayardSignal && !hasStrollerSignal) return "playard";
  if (hasCarrierSignal && !hasStrollerSignal) return "baby_carrier";
  if (hasNurserySignal && !hasStrollerSignal) return "playard";

  return normalizedCategoryId;
};

const resolveProductCategoryId = (product: Product) => {
  const raw = String((product as any)?.categoryId || product?.category || "").trim().toLowerCase();
  const normalized = PRODUCT_CATEGORY_ID_ALIASES[raw] || raw;
  return inferMisclassifiedCategoryId(product, normalized);
};

const resolveProductMergeKey = (product: Product) => {
  const raw = String((product as any)?.productId || (product as any)?.ASIN || product.id || "").trim();
  const asinMatch = raw.match(/[A-Z0-9]{10}/i);
  if (asinMatch) {
    return asinMatch[0].toLowerCase();
  }

  const normalizedName = String(product.name || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
  const normalizedBrand = String(product.brand || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
  const normalizedCategory = String((product as any)?.categoryId || product.category || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
  const compositeKey = [normalizedBrand, normalizedName, normalizedCategory].filter(Boolean).join("|");
  return compositeKey || raw.toLowerCase();
};

const chooseMoreCompleteProductName = (previous: Product, incoming: Product) => {
  const previousName = String(previous.name || "").trim();
  const incomingName = String(incoming.name || "").trim();
  if (!previousName) return incomingName;
  if (!incomingName) return previousName;

  const previousLower = previousName.toLowerCase();
  const incomingLower = incomingName.toLowerCase();
  if (previousLower.startsWith(incomingLower) && previousName.length > incomingName.length) {
    return previousName;
  }
  if (incomingLower.startsWith(previousLower) && incomingName.length > previousName.length) {
    return incomingName;
  }

  return incomingName;
};

const choosePreferredText = (...values: unknown[]) => {
  for (const value of values) {
    const text = String(value || "").trim();
    if (text) return text;
  }
  return "";
};

const mergeDuplicateProductRecords = (previous: Product, incoming: Product): Product => {
  const name = chooseMoreCompleteProductName(previous, incoming);
  const previousZh = (previous as any).zh || {};
  const previousEn = (previous as any).en || {};
  const incomingZh = (incoming as any).zh || {};
  const incomingEn = (incoming as any).en || {};
  const mergedCategoryId = choosePreferredText(
    (incoming as any)?.categoryId,
    (previous as any)?.categoryId,
    incoming.category,
    previous.category,
  ).toLowerCase();
  const mergedCategory = choosePreferredText(
    incoming.category,
    previous.category,
    (incoming as any)?.categoryId,
    (previous as any)?.categoryId,
  ).toLowerCase();

  return {
    ...incoming,
    ...previous,
    id: previous.id || incoming.id,
    categoryId: mergedCategoryId || undefined,
    category: mergedCategory as any,
    name,
    description: choosePreferredText(previous.description, previousZh.description, incoming.description, incomingZh.description),
    customers_say: choosePreferredText(previous.customers_say, previousZh.customersSay, incoming.customers_say, incomingZh.customersSay),
    editorVerdict: choosePreferredText(
      previous.editorVerdict,
      previousZh.editorVerdict,
      previousEn.editorVerdict,
      incoming.editorVerdict,
      incomingZh.editorVerdict,
      incomingEn.editorVerdict,
    ),
    zh: {
      ...incomingZh,
      ...previousZh,
      name: choosePreferredText(previousZh.name, incomingZh.name, name),
      description: choosePreferredText(previousZh.description, incomingZh.description, previous.description, incoming.description),
      customersSay: choosePreferredText(previousZh.customersSay, incomingZh.customersSay, previous.customers_say, incoming.customers_say),
      editorVerdict: choosePreferredText(previousZh.editorVerdict, incomingZh.editorVerdict, previous.editorVerdict, incoming.editorVerdict),
    },
    en: {
      ...incomingEn,
      ...previousEn,
      name: choosePreferredText(previousEn.name, incomingEn.name, name),
      description: choosePreferredText(previousEn.description, incomingEn.description, previous.description, incoming.description),
      customersSay: choosePreferredText(previousEn.customersSay, incomingEn.customersSay, previous.customers_say, incoming.customers_say),
      editorVerdict: choosePreferredText(previousEn.editorVerdict, incomingEn.editorVerdict, previous.editorVerdict, incoming.editorVerdict),
    },
  } as Product;
};

const findLatestProductMatch = (products: Product[], item: Product) => {
  const matchedById = products.find((product) => product.id === item.id);
  if (matchedById) return matchedById;

  const itemMergeKey = resolveProductMergeKey(item);
  if (!itemMergeKey) return null;

  return products.find((product) => resolveProductMergeKey(product) === itemMergeKey) || null;
};

const mergeBatchProductsIntoBase = (baseProducts: Product[], batchProducts: Product[]) => {
  if (!batchProducts.length) return baseProducts;

  const isPublishedStatus = (product: Product) => {
    return String((product as any)?.status || "").trim().toLowerCase() === "published";
  };

  const mergedById = new Map(baseProducts.map(product => [product.id, product]));
  const idByMergeKey = new Map(baseProducts.map(product => [resolveProductMergeKey(product), product.id]));
  for (const product of batchProducts) {
    const mergeKey = resolveProductMergeKey(product);
    const previousId = idByMergeKey.get(mergeKey);
    if (previousId) {
      const previousProduct = mergedById.get(previousId);
      if (previousProduct) {
        mergedById.set(previousId, mergeDuplicateProductRecords(previousProduct, product));
      } else if (isPublishedStatus(product)) {
        mergedById.set(previousId, product);
      }
      idByMergeKey.set(mergeKey, previousId);
    } else {
      if (isPublishedStatus(product)) {
        mergedById.set(product.id, product);
        idByMergeKey.set(mergeKey, product.id);
      }
    }
  }
  return Array.from(mergedById.values());
};

const filterExcludedProductCategories = (products: Product[]) => {
  return products.filter((product) => !EXCLUDED_PRODUCT_CATEGORY_IDS.has(resolveProductCategoryId(product)));
};

const isPublishedProduct = (product: Product) => {
  return String((product as any)?.status || "").trim().toLowerCase() === "published";
};

const mergeCmsWithFallbackByCategory = (cmsProducts: Product[], fallbackProducts: Product[]) => {
  const merged = [...cmsProducts];
  const seenIds = new Set(cmsProducts.map((item) => item.id));
  const mergeKeyToIndex = new Map<string, number>();

  merged.forEach((item, index) => {
    const mergeKey = resolveProductMergeKey(item);
    if (mergeKey) {
      mergeKeyToIndex.set(mergeKey, index);
    }
  });

  for (const item of fallbackProducts) {
    const mergeKey = resolveProductMergeKey(item);
    const existingIndex = mergeKey ? mergeKeyToIndex.get(mergeKey) : undefined;

    if (existingIndex !== undefined) {
      merged[existingIndex] = mergeDuplicateProductRecords(merged[existingIndex], item);
      continue;
    }

    if (seenIds.has(item.id)) {
      continue;
    }

    merged.push(item);
    seenIds.add(item.id);

    if (mergeKey) {
      mergeKeyToIndex.set(mergeKey, merged.length - 1);
    }
  }

  return merged;
};

const dedupeProductsForDisplay = (products: Product[]) => {
  const byKey = new Map<string, Product>();

  for (const item of products) {
    const key = resolveProductMergeKey(item);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, item);
      continue;
    }
    byKey.set(key, mergeDuplicateProductRecords(existing, item));
  }

  return Array.from(byKey.values());
};

const normalizePathname = (pathname: string) => {
  const cleaned = pathname.replace(/\/+$/, "");
  return cleaned || "/";
};

const normalizeProductRouteCategory = (value: string) => {
  const normalized = String(value || "").trim().toLowerCase();
  return PRODUCT_ROUTE_ALIASES[normalized] || normalized;
};

const normalizeCanonicalPath = (path: string) => {
  const normalized = normalizePathname(path || "/");
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
};

const buildCanonicalPathFromPageConfig = (
  pageConfig: CMSPageConfig | undefined,
  fallbackPath: string,
  activePage: number,
) => {
  if (pageConfig?.canonicalPath) {
    return normalizeCanonicalPath(pageConfig.canonicalPath);
  }

  const slug = String(pageConfig?.pageSlug || "").trim();
  if (!slug || slug === "home") {
    return normalizeCanonicalPath(fallbackPath || "/");
  }

  const normalizedSlug = slug.replace(/^\/+|\/+$/g, "");
  const page = Math.max(1, activePage || 1);
  if (pageConfig?.paginationPolicy === "page_path" && page > 1) {
    return `/${normalizedSlug}/page/${page}`;
  }

  return `/${normalizedSlug}`;
};

const isSearchOrAuthPath = (path: string) => {
  return path.startsWith("/search") || path.startsWith("/auth");
};

const isNonProductionHostname = (hostname: string) => {
  const normalized = String(hostname || "").trim().toLowerCase();
  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1"
  );
};

const shouldNoIndexCurrentPath = (path: string, search: string, hostname?: string) => {
  const params = new URLSearchParams(search);
  if (hostname && isNonProductionHostname(hostname)) {
    return true;
  }
  if (isSearchOrAuthPath(path)) {
    return true;
  }
  const nonIndexParams = ["sort", "filter", "query", "q"];
  return nonIndexParams.some((key) => params.has(key));
};

const safeStorageGet = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeStorageSet = (key: string, value: string): void => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage write failures to avoid runtime crashes.
  }
};

const isDevAdminBypassEnabled = (): boolean => {
  return safeStorageGet("dev_admin_bypass") === "true";
};

const resolveInitialLang = (): "zh" | "en" => {
  const saved = safeStorageGet("app_lang");
  return saved === "zh" || saved === "en" ? saved : "en";
};

const resolveRouteState = (pathname: string, hash: string) => {
  if (hash.startsWith("#cms") || hash === "#cm") {
    return {
      activeTab: "admin",
      activeProductCategory: "all",
      activeReviewType: "all",
      activeEvaluationId: "",
      activePageIndex: 1,
      currentPath: normalizePathname(pathname),
    };
  }

  const currentPath = normalizePathname(pathname);
  const segments = currentPath.split("/").filter(Boolean);
  const [root, sub] = segments;
  const transparencyPage = getTransparencyPageByPath(currentPath);

  if (transparencyPage) {
    return {
      activeTab: "transparency",
      activeProductCategory: "all",
      activeReviewType: "all",
      activeEvaluationId: "",
      activePageIndex: 1,
      currentPath,
    };
  }

  if (!root) {
    return {
      activeTab: "home",
      activeProductCategory: "all",
      activeReviewType: "all",
      activeEvaluationId: "",
      activePageIndex: 1,
      currentPath,
    };
  }

  if (root === "products") {
    const pageSegmentIndex = segments.indexOf("page");
    const activePageIndex = pageSegmentIndex >= 0 ? Number(segments[pageSegmentIndex + 1] || 1) : 1;
    const normalizedCategory = normalizeProductRouteCategory(sub || "");
    const activeProductCategory = normalizedCategory && PRODUCT_ROUTE_IDS.has(normalizedCategory) ? normalizedCategory : "all";
    return {
      activeTab: "products",
      activeProductCategory,
      activeReviewType: "all",
      activeEvaluationId: "",
      activePageIndex,
      currentPath,
    };
  }

  if (root === "reviews" || root === "evaluations") {
    const pageSegmentIndex = segments.indexOf("page");
    const activePageIndex = pageSegmentIndex >= 0 ? Number(segments[pageSegmentIndex + 1] || 1) : 1;
    const activeReviewType = sub && REVIEW_ROUTE_IDS.has(sub) ? sub : "single";
    const activeEvaluationId = pageSegmentIndex >= 0 ? "" : (sub && REVIEW_ROUTE_IDS.has(sub) ? segments[2] : sub) || "";
    return {
      activeTab: "evaluations",
      activeProductCategory: "all",
      activeReviewType,
      activeEvaluationId,
      activePageIndex,
      currentPath,
    };
  }

  if (root === "guides") {
    const pageSegmentIndex = segments.indexOf("page");
    const activePageIndex = pageSegmentIndex >= 0 ? Number(segments[pageSegmentIndex + 1] || 1) : 1;
    return {
      activeTab: "guides",
      activeProductCategory: "all",
      activeReviewType: "all",
      activeEvaluationId: "",
      activePageIndex,
      currentPath,
    };
  }

  if (root === "news") {
    const pageSegmentIndex = segments.indexOf("page");
    const activePageIndex = pageSegmentIndex >= 0 ? Number(segments[pageSegmentIndex + 1] || 1) : 1;
    return {
      activeTab: "news",
      activeProductCategory: "all",
      activeReviewType: "all",
      activeEvaluationId: "",
      activePageIndex,
      currentPath,
    };
  }

  if (root === "about") {
    return {
      activeTab: "about",
      activeProductCategory: "all",
      activeReviewType: "all",
      activeEvaluationId: "",
      activePageIndex: 1,
      currentPath,
    };
  }

  if (root === "compare") {
    return {
      activeTab: "compare",
      activeProductCategory: "all",
      activeReviewType: "all",
      activeEvaluationId: "",
      activePageIndex: 1,
      currentPath,
    };
  }

  if (root === "auth") {
    return {
      activeTab: "auth",
      activeProductCategory: "all",
      activeReviewType: "all",
      activeEvaluationId: "",
      activePageIndex: 1,
      currentPath,
    };
  }

  return {
    activeTab: "home",
    activeProductCategory: "all",
    activeReviewType: "all",
    activeEvaluationId: "",
    activePageIndex: 1,
    currentPath: "/",
  };
};

export default function App() {
  // Lang toggle state
  const [lang, setLang] = useState<"zh" | "en">(() => resolveInitialLang());

  // Admin access state
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return isDevAdminBypassEnabled();
  });
  const [authLoading, setAuthLoading] = useState<boolean>(() => {
    return !isDevAdminBypassEnabled();
  });

  const initialRouteState = resolveRouteState(window.location.pathname, window.location.hash);

  // 2. Active Tab Router: home, news, products, evaluations, guides, about, auth
  const [activeTab, setActiveTab] = useState<string>(initialRouteState.activeTab);
  const [activeProductCategory, setActiveProductCategory] = useState<string>(initialRouteState.activeProductCategory);
  const [activeReviewType, setActiveReviewType] = useState<string>(initialRouteState.activeReviewType);
  const [activeEvaluationId, setActiveEvaluationId] = useState<string>(initialRouteState.activeEvaluationId);
  const [activePageIndex, setActivePageIndex] = useState<number>(initialRouteState.activePageIndex);
  const [currentPath, setCurrentPath] = useState<string>(initialRouteState.currentPath);
  const [newsPaginationTotalPages, setNewsPaginationTotalPages] = useState<number | null>(null);
  const [guidesPaginationTotalPages, setGuidesPaginationTotalPages] = useState<number | null>(null);
  const activeTabRef = useRef<string>(initialRouteState.activeTab);
  const batchProductsRef = useRef<Product[]>([]);

  const applyBatchProducts = (products: Product[]) => {
    return mergeBatchProductsIntoBase(products, batchProductsRef.current);
  };

  const enforcePublishedVisibility = (products: Product[]) => {
    return dedupeProductsForDisplay(filterExcludedProductCategories(products).filter(isPublishedProduct));
  };

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  const syncRouteStateFromLocation = () => {
    const routeState = resolveRouteState(window.location.pathname, window.location.hash);
    setActiveTab(routeState.activeTab);
    setActiveProductCategory(routeState.activeProductCategory);
    setActiveReviewType(routeState.activeReviewType);
    setActiveEvaluationId(routeState.activeEvaluationId);
    setActivePageIndex(routeState.activePageIndex);
    setCurrentPath(routeState.currentPath);
  };

  const navigateToPath = (path: string, options?: { replace?: boolean; preserveScroll?: boolean }) => {
    const normalizedPath = normalizePathname(path);
    const shouldReplace = options?.replace ?? false;
    const preserveScroll = options?.preserveScroll ?? false;
    const hasChanged = window.location.pathname !== normalizedPath || window.location.hash.startsWith("#cms");

    if (hasChanged) {
      if (shouldReplace) {
        window.history.replaceState(null, "", normalizedPath);
      } else {
        window.history.pushState(null, "", normalizedPath);
      }
    }

    syncRouteStateFromLocation();
    if (!preserveScroll) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (activeTab !== "news") {
      return;
    }
    if (currentPath !== "/news") {
      return;
    }
    navigateToPath("/news/page/1", { replace: true, preserveScroll: true });
  }, [activeTab, currentPath]);

  useEffect(() => {
    if (activeTab !== "products") {
      return;
    }
    if (currentPath !== "/products/scooters") {
      return;
    }
    navigateToPath("/products/kids_scooters", { replace: true, preserveScroll: true });
  }, [activeTab, currentPath]);

  const navigateToTab = (tabId: string) => {
    if (tabId === "admin") {
      if (window.location.hash !== "#cms") {
        window.location.hash = "cms";
      } else {
        syncRouteStateFromLocation();
      }
      return;
    }

    const tabPathMap: Record<string, string> = {
      home: "/",
      products: "/products",
      evaluations: "/reviews",
      guides: "/guides",
      news: "/news/page/1",
      about: "/about",
      auth: "/auth",
    };

    navigateToPath(tabPathMap[tabId] || "/");
  };

  const openAdminProductEditor = (product: Product) => {
    const productId = encodeURIComponent(String(product?.id || "").trim());
    const nextHash = productId ? `#cms?menu=products&productId=${productId}` : "#cms?menu=products";

    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash;
    } else {
      syncRouteStateFromLocation();
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    // Backward compatibility for legacy child components that still call window.setActiveTab.
    (window as any).setActiveTab = navigateToTab;
    return () => {
      if ((window as any).setActiveTab === navigateToTab) {
        delete (window as any).setActiveTab;
      }
    };
  }, [navigateToTab]);

  useEffect(() => {
    const handleLocationUpdate = () => {
      if (activeTabRef.current === "product_detail") {
        setSelectedProduct(null);
      }
      syncRouteStateFromLocation();
    };

    window.addEventListener("popstate", handleLocationUpdate);
    window.addEventListener("hashchange", handleLocationUpdate);
    return () => {
      window.removeEventListener("popstate", handleLocationUpdate);
      window.removeEventListener("hashchange", handleLocationUpdate);
    };
  }, []);

  // Country & Currency State
  const [countryCode, setCountryCode] = useState<string>(() => {
    const saved = safeStorageGet("app_country");
    const allowedCountries = ["US", "DE", "GB"];
    if (saved && allowedCountries.includes(saved)) {
      return saved;
    }
    try {
      const locale = Intl.DateTimeFormat().resolvedOptions().locale;
      const detected = locale.split("-")[1]?.toUpperCase();
      return allowedCountries.includes(detected) ? detected : "US"; // Baseline is US (USD)
    } catch {
      return "US";
    }
  });

  useEffect(() => {
    safeStorageSet("app_lang", lang);
  }, [lang]);

  useEffect(() => {
    safeStorageSet("app_country", countryCode);
  }, [countryCode]);

  const t = translations[lang] || translations.zh;
  const currencyData = getCurrencyData(countryCode);
  const productNavOptions = PRODUCT_NAV_OPTIONS.map((item) => ({
    id: item.id,
    label: lang === "zh" ? item.zh : item.en,
  }));
  const reviewNavOptions = REVIEW_NAV_OPTIONS.map((item) => ({
    id: item.id,
    label: lang === "zh" ? item.zh : item.en,
  }));
  const productSeoHints = useMemo(
    () => getProductSeoKeywords(activeProductCategory, lang),
    [activeProductCategory, lang]
  );
  const reviewSeoHints = useMemo(
    () => getReviewSeoKeywords(activeReviewType, lang),
    [activeReviewType, lang]
  );

  const handlePrimaryTabClick = (tabId: string) => {
    navigateToTab(tabId);
  };

  const handleHomeCategorySelect = (categoryId: string) => {
    const normalizedCategoryId = normalizeProductRouteCategory(categoryId);
    navigateToPath(normalizedCategoryId === "all" ? "/products" : `/products/${normalizedCategoryId}`);
  };

  // 1. Core child mechanics states
  const [childProfile, setChildProfileState] = useState<ChildProfile>({
    age: 4,
    height: 102,
    inseam: 38,
    weight: 16,
    experience: "beginner",
  });

  const setChildProfile = (profileOrUpdater: ChildProfile | ((prev: ChildProfile) => ChildProfile)) => {
    setChildProfileState(prev => {
      const newProfile = typeof profileOrUpdater === 'function' ? profileOrUpdater(prev) : profileOrUpdater;
      
      const currentUser = auth.currentUser;
      const isBypass = isDevAdminBypassEnabled();
      if (currentUser && !isBypass) {
        void saveChildProfileToFirestore(currentUser.uid, newProfile);
      }
      
      return newProfile;
    });
  };

  // 3. User local bookmarks, up to 3 compares, and session login email
  const [savedProducts, setSavedProducts] = useState<Product[]>([]);
  const [compareList, setCompareList] = useState<Product[]>(() => {
    try {
      const cached = localStorage.getItem("unauth_compare_list");
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.error("Failed to parse unauth_compare_list", e);
    }
    return [];
  });

  const [viewHistory, setViewHistory] = useState<Product[]>(() => {
    try {
      const cached = localStorage.getItem("unauth_view_history");
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.error("Failed to parse unauth_view_history", e);
    }
    return [];
  });

  const [userEmail, setUserEmail] = useState<string>(() => {
    const isBypass = isDevAdminBypassEnabled();
    return isBypass ? "hhool.student@gmail.com" : "";
  });

  // Global CMS settings, Products, and Evaluations state
  const [cmsSettings, setCmsSettings] = useState<CMSSettings | null>(null);
  const [productsData, setProductsData] = useState<Product[]>([]);
  const [evaluationsData, setEvaluationsData] = useState<Evaluation[]>([]);

  // Cache compareList and viewHistory on change and keep them fresh relative to database updates
  useEffect(() => {
    try {
      localStorage.setItem("unauth_compare_list", JSON.stringify(compareList));
    } catch (e) {
      console.error("Failed to write to unauth_compare_list", e);
    }
  }, [compareList]);

  // Load compared products from URL search query on direct access or shared URL
  useEffect(() => {
    if (productsData.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const idsParam = params.get("ids");
      if (idsParam) {
        const ids = idsParam.split(",").map(id => id.trim()).filter(Boolean);
        const matched = ids
          .map(id => productsData.find(p => p.id === id))
          .filter((p): p is Product => !!p);
        if (matched.length > 0) {
          const matchedIds = matched.map(m => m.id).join(",");
          const currentIds = compareList.map(c => c.id).join(",");
          if (matchedIds !== currentIds) {
            setCompareList(matched);
          }
        }
      }
    }
  }, [productsData, currentPath]);

  useEffect(() => {
    try {
      localStorage.setItem("unauth_view_history", JSON.stringify(viewHistory));
    } catch (e) {
      console.error("Failed to write to unauth_view_history", e);
    }
  }, [viewHistory]);

  useEffect(() => {
    if (productsData.length > 0) {
      setCompareList(prev => {
        let changed = false;
        const updated = prev.map(item => {
          const matched = findLatestProductMatch(productsData, item);
          if (matched && JSON.stringify(matched) !== JSON.stringify(item)) {
            changed = true;
            return matched;
          }
          return item;
        });
        return changed ? updated : prev;
      });

      setViewHistory(prev => {
        let changed = false;
        const updated = prev.map(item => {
          const matched = findLatestProductMatch(productsData, item);
          if (matched && JSON.stringify(matched) !== JSON.stringify(item)) {
            changed = true;
            return matched;
          }
          return item;
        });
        return changed ? updated : prev;
      });

      setSelectedProduct(prev => {
        if (!prev) return prev;
        const matched = findLatestProductMatch(productsData, prev);
        if (!matched) return prev;
        return JSON.stringify(matched) === JSON.stringify(prev) ? prev : matched;
      });
    }
  }, [productsData]);

  // Load CMS settings, Products, and Evaluations on mount / tab change
  useEffect(() => {
    let isActive = true;

    const loadCmsData = async () => {
      const s = await getCMSSettings();
      if (!isActive) return;
      if (s) {
        setCmsSettings(s);
      }

      const publishedProducts = await getCMSProducts(true);
      if (!isActive) return;
      if (publishedProducts && publishedProducts.length > 0) {
        let nextProducts = enforcePublishedVisibility(publishedProducts);
        try {
          const bundle = await fetchContentBundle();
          if (!isActive) return;
          const fallbackProducts = bundle.products && bundle.products.length > 0
            ? enforcePublishedVisibility(bundle.products)
            : enforcePublishedVisibility(await loadDefaultProductsData());
          if (!isActive) return;
          nextProducts = mergeCmsWithFallbackByCategory(nextProducts, fallbackProducts);
        } catch {
          if (!isActive) return;
          const defaultProducts = await loadDefaultProductsData();
          if (!isActive) return;
          nextProducts = mergeCmsWithFallbackByCategory(
            nextProducts,
            enforcePublishedVisibility(defaultProducts)
          );
        }

        const withBatch = applyBatchProducts(nextProducts);
        const finalProducts = enforcePublishedVisibility(withBatch);
        setProductsData(finalProducts);
      } else {
        try {
          const bundle = await fetchContentBundle();
          if (!isActive) return;
          if (bundle.products && bundle.products.length > 0) {
            const withBatch = applyBatchProducts(bundle.products);
            const finalProducts = enforcePublishedVisibility(withBatch);
            setProductsData(finalProducts);
          } else {
            const defaultProducts = await loadDefaultProductsData();
            if (!isActive) return;
            const withBatch = applyBatchProducts(defaultProducts);
            const finalProducts = enforcePublishedVisibility(withBatch);
            setProductsData(finalProducts);
          }
        } catch {
          if (!isActive) return;
          const defaultProducts = await loadDefaultProductsData();
          if (!isActive) return;
          const withBatch = applyBatchProducts(defaultProducts);
          const finalProducts = enforcePublishedVisibility(withBatch);
          setProductsData(finalProducts);
        }
      }

      const evs = await getCMSEvaluations(true);
      if (!isActive) return;
      setEvaluationsData(evs);
    };

    const fetchData = async () => {
      if (!isScrapedContentSource()) {
        try {
          await loadCmsData();
        } catch (err) {
          console.error("Failed to load CMS data:", err);
          try {
            const bundle = await fetchContentBundle();
            if (!isActive) return;
            if (bundle.settings) {
              setCmsSettings(bundle.settings);
            }
            if (bundle.products && bundle.products.length > 0) {
              const withBatch = applyBatchProducts(bundle.products);
              const finalProducts = enforcePublishedVisibility(withBatch);
              setProductsData(finalProducts);
            }
            if (bundle.evaluations && bundle.evaluations.length > 0) {
              setEvaluationsData(bundle.evaluations);
            }
          } catch (bundleErr) {
            console.error("Fallback content bundle load failed:", bundleErr);
          }
        }
        return;
      }

      try {
        const bundle = await fetchContentBundle();
        if (!isActive) return;

        if (bundle.settings && bundle.products.length > 0 && bundle.evaluations.length > 0) {
          setCmsSettings(bundle.settings);
          const withBatch = applyBatchProducts(bundle.products);
          const finalProducts = enforcePublishedVisibility(withBatch);
          setProductsData(finalProducts);
          setEvaluationsData(bundle.evaluations);
          return;
        }

        throw new Error("Content bundle is incomplete.");
      } catch (err) {
        console.warn("Failed to load content bundle, falling back to CMS data:", err);
        try {
          await loadCmsData();
        } catch (fallbackErr) {
          console.error("Failed to load CMS fallback data:", fallbackErr);
        }
      }
    };
    fetchData();
    return () => {
      isActive = false;
    };
  }, [activeTab]);

  // Load batch products from report files to supplement CMS data
  useEffect(() => {
    let isActive = true;

    const loadBatchData = async () => {
      try {
        console.log("Loading batch products from reports...");
        const batchProducts = await loadBatchProducts();
        if (!isActive) return;
        
        if (batchProducts && batchProducts.length > 0) {
          console.log(`Loaded ${batchProducts.length} batch products, merging with existing data`);
          batchProductsRef.current = batchProducts;
          // Merge batch products with existing data, preferring batch if duplicate IDs exist
          setProductsData(prev => {
            const merged = mergeBatchProductsIntoBase(prev, batchProducts);
            const finalProducts = enforcePublishedVisibility(merged);
            return finalProducts;
          });
        }
      } catch (err) {
        console.error("Failed to load batch products:", err);
      }
    };

    // Delay batch load slightly to let CMS data load first
    const timer = setTimeout(() => {
      loadBatchData();
    }, 1000);

    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, []);

  // Synchronize bookmarked products whenever productsData or login state changes
  useEffect(() => {
    const syncBookmarks = async () => {
      const currentUser = auth.currentUser;
      if (currentUser && productsData.length > 0) {
        try {
          const bookmarkedIds = await getBookmarksFromFirestore(currentUser.uid);
          const mappedProducts = productsData.filter((p) => bookmarkedIds.includes(p.id));
          setSavedProducts(mappedProducts);
        } catch (error) {
          console.error("加载云端收藏夹失败:", error);
        }
      } else {
        const isBypass = isDevAdminBypassEnabled();
        if (!currentUser && !isBypass) {
          setSavedProducts([]);
        }
      }
    };
    syncBookmarks();
  }, [productsData, userEmail]);

  // Auto-seed if database is empty of products and currently logged-in as admin
  useEffect(() => {
    const autoSeedIfEmpty = async () => {
      if (!isAdmin) return;
      try {
        const allProducts = await getCMSProducts(false); // get ALL including drafts
        if (allProducts.length === 0) {
          console.log("Admin logged in & D1 content is empty. Auto-seeding comprehensive dataset...");
          // Seed Products
          const defaultProducts = await loadDefaultProductsData();
          const successProd = await seedProductsToFirestore(defaultProducts, translateProduct);
          if (successProd) {
            const freshProducts = await getCMSProducts(true);
            if (freshProducts && freshProducts.length > 0) {
              setProductsData(enforcePublishedVisibility(freshProducts));
            }
          }
          // Seed Evaluations
          await seedEvaluationsToFirestore(initialEvaluationsData);
          const freshEvs = await getCMSEvaluations(true);
          if (freshEvs && freshEvs.length > 0) {
            setEvaluationsData(freshEvs);
          }
          // Seed Guides and News
          await seedGuidesToFirestore(guideArticles);
          await seedNewsToFirestore(newsArticles);
        }
      } catch (err) {
        console.error("Failed to auto-seed comprehensive dataset:", err);
      }
    };
    autoSeedIfEmpty();
  }, [isAdmin]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const isBypass = isDevAdminBypassEnabled();
    if (isBypass) {
      setUserEmail("hhool.student@gmail.com");
      setIsAdmin(true);
      setAuthLoading(false);
      return;
    }

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setAuthLoading(true);
      if (user) {
        setUserEmail(user.email || "");

        // Admin verification logic
        try {
          const adminStatus = await checkIsAdmin(user.uid, user);
          setIsAdmin(adminStatus);
        } catch (error) {
          console.error("Admin check failed:", error);
          setIsAdmin(false);
        }

        // Fetch user's child profile
        try {
          const profile = await getChildProfileFromFirestore(user.uid);
          if (profile) {
            setChildProfileState(profile); // Bypass the save logic since we just fetched it
          }
        } catch (err) {
          console.error("Failed to load child profile:", err);
        }
      } else {
        setUserEmail("");
        setIsAdmin(false);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Interceptor wrapper to synchronize bookmark additions/removals with Firebase
  const updateSavedProductsAndFirestore = async (newProducts: Product[]) => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const currentIds = savedProducts.map(p => p.id);
      const newIds = newProducts.map(p => p.id);
      
      // Check which items were added
      const added = newProducts.filter(p => !currentIds.includes(p.id));
      for (const item of added) {
        await addBookmarkToFirestore(currentUser.uid, item.id);
      }
      
      // Check which items were removed
      const removed = savedProducts.filter(p => !newIds.includes(p.id));
      for (const item of removed) {
        await removeBookmarkFromFirestore(currentUser.uid, item.id);
      }
    }
    setSavedProducts(newProducts);
  };

  // 4. Detail view state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeStandardDimension, setActiveStandardDimension] = useState<string | null>(null);
  const [previousTab, setPreviousTab] = useState<string>("home");

  // Helper inside App to update/inject dynamic meta tags
  const updateMetaTag = (name: string, content: string) => {
    let element = document.querySelector(`meta[name="${name}"]`);
    if (!element) {
      element = document.createElement("meta");
      element.setAttribute("name", name);
      document.head.appendChild(element);
    }
    element.setAttribute("content", content);
  };

  const removeMetaTag = (name: string) => {
    document.querySelectorAll(`meta[name="${name}"]`).forEach((node) => node.remove());
  };

  const updateMetaProperty = (property: string, content: string) => {
    let element = document.querySelector(`meta[property="${property}"]`);
    if (!element) {
      element = document.createElement("meta");
      element.setAttribute("property", property);
      document.head.appendChild(element);
    }
    element.setAttribute("content", content);
  };

  const updateCanonicalLink = (href: string) => {
    let link = document.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", href);
  };

  const removeJsonLdScripts = () => {
    document.querySelectorAll("script[data-seo-jsonld='true']").forEach((node) => node.remove());
  };

  const injectJsonLd = (schemas: Record<string, unknown>[]) => {
    removeJsonLdScripts();
    for (const schema of schemas) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-seo-jsonld", "true");
      script.text = JSON.stringify(schema);
      document.head.appendChild(script);
    }
  };

  const resolveCmsPageConfigForRoute = (seoKey: string) => {
    const pageType = SEO_KEY_TO_PAGE_TYPE[seoKey];
    const configuredPages = Object.values(cmsSettings?.pages || {}).filter(Boolean) as CMSPageConfig[];
    const publishedPages = configuredPages.filter((item) => !item.status || item.status === "published");
    const candidatePool = publishedPages.length > 0 ? publishedPages : configuredPages;

    const matchedByType = candidatePool.filter((item) => item.pageType === pageType);
    const matchedBySlug = candidatePool.filter((item) => item.pageSlug === seoKey);
    const matched = [...matchedByType, ...matchedBySlug];

    if (matched.length === 0) {
      return DEFAULT_CMS_PAGE_BLUEPRINT[seoKey] || DEFAULT_CMS_PAGE_BLUEPRINT.home;
    }

    const currentIndex = Math.max(1, activePageIndex || 1);
    const exact = matched.find((item) => Number(item.pageIndex || 1) === currentIndex);
    if (exact) {
      return exact;
    }

    const firstPage = matched.find((item) => Number(item.pageIndex || 1) === 1);
    return firstPage || matched[0];
  };

  const resolveCmsRouteSeoConfig = (seoKey: string) => {
    const pageConfig = resolveCmsPageConfigForRoute(seoKey);
    const fallbackSeo = DEFAULT_SEO_CONFIGS[seoKey]?.[lang] || DEFAULT_SEO_CONFIGS.home[lang];

    const pageSeo = pageConfig?.seo?.[lang];
    if (pageSeo) {
      return { seo: pageSeo, pageConfig };
    }

    const routeSeo = cmsSettings?.seo?.[seoKey]?.[lang];
    if (routeSeo) {
      return { seo: routeSeo, pageConfig };
    }

    return { seo: fallbackSeo, pageConfig };
  };

  // Dynamic SEO Page Meta Configuration (Title, Keywords, Description)
  useEffect(() => {
    const gscVerification = String(cmsSettings?.seoGlobal?.googleSiteVerification || "").trim();
    if (gscVerification) {
      updateMetaTag("google-site-verification", gscVerification);
    } else {
      removeMetaTag("google-site-verification");
    }

    const defaultRobotsIndex = String(
      cmsSettings?.seoGlobal?.defaultRobots || "index,follow,max-image-preview:large"
    ).trim() || "index,follow,max-image-preview:large";

    // Determine active tab database key
    let seoKey = activeTab;
    if (activeTab === "product_detail") {
      if (selectedProduct) {
        const name = selectedProduct.name;
        const brand = selectedProduct.brand;
        const dedupedDisplayTitle = getProductsPageSeoTitle(selectedProduct);
        const cat = selectedProduct.category;

        const title = lang === "zh"
          ? `${dedupedDisplayTitle} 独家深度客观安全评测报告 | KIDSMOBI`
          : `${dedupedDisplayTitle} Exclusive Safety Evaluation & Specs | KIDSMOBI`;

        const desc = lang === "zh"
          ? `${dedupedDisplayTitle} (${selectedProduct.ageRange})的物理材料、轮径比、刹车制动等详细性能参数，结合KIDSMOBI实验室工程师的独家拆解观点与真实优缺点分析。`
          : `Meticulous safety verification for the ${dedupedDisplayTitle} kids mobility. Comprehensive parameters, raw materials, pros/cons, and engineer reviews.`;

        const kws = lang === "zh"
          ? [name, brand, cat, "童车数据评测", "KIDSMOBI"]
          : [name, brand, cat, "parameters", "product evaluation", "KIDSMOBI"];

        document.title = title;
        updateMetaTag("description", desc);
        updateMetaTag("keywords", kws.join(", "));
        const canonicalPath = normalizeCanonicalPath(currentPath);
        const canonicalOrigin =
          cmsSettings?.seoGlobal?.siteOrigin ||
          (cmsSettings as any)?.siteOrigin ||
          (import.meta.env.VITE_PRIMARY_SITE_ORIGIN as string | undefined) ||
          window.location.origin;
        const canonicalUrl = `${canonicalOrigin}${canonicalPath}`;
        const noIndex = shouldNoIndexCurrentPath(canonicalPath, window.location.search, window.location.hostname);
        updateCanonicalLink(canonicalUrl);
        updateMetaProperty("og:url", canonicalUrl);
        updateMetaProperty("og:type", "article");
        updateMetaProperty("og:title", title);
        updateMetaProperty("og:description", desc);
        updateMetaTag("robots", noIndex ? "noindex,follow,max-image-preview:large" : defaultRobotsIndex);

        injectJsonLd([
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: `${window.location.origin}/`,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Products",
                item: `${window.location.origin}/products`,
              },
              {
                "@type": "ListItem",
                position: 3,
                name: selectedProduct.name,
                item: canonicalUrl,
              },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "Product",
            name: selectedProduct.name,
            brand: selectedProduct.brand,
            image: selectedProduct.imageUrl,
            url: canonicalUrl,
            description: desc,
          },
        ]);
      }
      return;
    }

    if (activeTab === "transparency") {
      const transparencyPage = getTransparencyPageByPath(currentPath);
      if (transparencyPage) {
        const localizedPage = transparencyPage[lang];
        const normalizedSEO = normalizeSeoConfig(localizedPage.seo);
        const canonicalPath = normalizeCanonicalPath(localizedPage.path);
        const canonicalOrigin =
          cmsSettings?.seoGlobal?.siteOrigin ||
          (cmsSettings as any)?.siteOrigin ||
          (import.meta.env.VITE_PRIMARY_SITE_ORIGIN as string | undefined) ||
          window.location.origin;
        const canonicalUrl = `${canonicalOrigin}${canonicalPath}`;
        const noIndex = shouldNoIndexCurrentPath(canonicalPath, window.location.search, window.location.hostname);

        document.title = normalizedSEO.title;
        updateMetaTag("description", normalizedSEO.description);
        updateMetaTag("keywords", normalizedSEO.keywords.join(", "));
        updateMetaTag("robots", noIndex ? "noindex,follow,max-image-preview:large" : defaultRobotsIndex);
        updateCanonicalLink(canonicalUrl);
        updateMetaProperty("og:url", canonicalUrl);
        updateMetaProperty("og:type", "article");
        updateMetaProperty("og:title", normalizedSEO.title);
        updateMetaProperty("og:description", normalizedSEO.description);

        injectJsonLd([
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "KIDSMOBI",
            url: `${window.location.origin}/`,
            logo: `${window.location.origin}/favicon.ico`,
          },
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: normalizedSEO.title,
            url: canonicalUrl,
            description: normalizedSEO.description,
            inLanguage: lang,
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: `${window.location.origin}/`,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: localizedPage.navLabel,
                item: canonicalUrl,
              },
            ],
          },
        ]);
      }
      return;
    }

    // Default to mapped key if valid, fallback to 'home'
    const validKeys = ["home", "news", "products", "evaluations", "guides", "about"];
    if (!validKeys.includes(seoKey)) {
      seoKey = "home";
    }

    const { seo: resolvedSEO, pageConfig } = resolveCmsRouteSeoConfig(seoKey);
    const normalizedSEO = normalizeSeoConfig(resolvedSEO);
    let titleStr = normalizedSEO.title;
    let descStr = normalizedSEO.description;
    let keywordsArr = normalizedSEO.keywords;

    if (activePageIndex > 1 && ["products", "evaluations", "guides", "news"].includes(seoKey)) {
      titleStr = lang === "zh" ? `${titleStr} - 第 ${activePageIndex} 页` : `${titleStr} - Page ${activePageIndex}`;
      descStr = lang === "zh"
        ? `${descStr} 当前为第 ${activePageIndex} 页分页内容。`
        : `${descStr} This is paginated page ${activePageIndex}.`;
    }

    const isReviewsIndexPath = /^\/reviews(?:\/page\/\d+)?\/?$/.test(currentPath);
    if (seoKey === "evaluations" && activeReviewType !== "all" && !isReviewsIndexPath) {
      const selectedReview = reviewNavOptions.find((item) => item.id === activeReviewType)?.label || activeReviewType;
      titleStr = lang === "zh"
        ? `${selectedReview} 专题评测 | KIDSMOBI Reviews`
        : `${selectedReview} Review Reports | KIDSMOBI Evaluations`;
      descStr = lang === "zh"
        ? `查看 ${selectedReview} 相关实验室报告，覆盖安全、结构稳定与真实场景表现等关键评测维度。`
        : `Explore ${selectedReview} lab reports spanning safety, structural stability, and real-world usability benchmarks.`;
      keywordsArr = Array.from(new Set([...keywordsArr, selectedReview, ...getReviewSeoKeywords(activeReviewType, lang)]));
    }

    keywordsArr = applyPageKeywordOverride(seoKey, keywordsArr, lang, activeProductCategory);
    const finalSEO = normalizeSeoConfig({ title: titleStr, description: descStr, keywords: keywordsArr });
    titleStr = finalSEO.title;
    descStr = finalSEO.description;
    keywordsArr = finalSEO.keywords;

    // 3. Set values
    const resolvePaginationTotalPages = (): number | null => {
      if (seoKey === "products") {
        const routeProducts = activeProductCategory === "all"
          ? productsData
          : productsData.filter((product) => {
              const categoryId = String((product as any)?.categoryId || product?.category || "").trim().toLowerCase();
              return normalizeProductRouteCategory(categoryId) === activeProductCategory;
            });
        return Math.max(1, Math.ceil(routeProducts.length / 9));
      }

      if (seoKey === "evaluations") {
        const publishedEvaluations = evaluationsData.filter((evaluation) => evaluation.status === "published");
        const normalizedReviewType = activeReviewType === "all" ? "single" : activeReviewType;
        const routeEvaluations = publishedEvaluations.filter((evaluation) => (evaluation.type || "single") === normalizedReviewType);
        const targetProducts = productsData.filter((product) => {
          const text = `${product.category || ""} ${(product as any).categoryId || ""}`.toLowerCase();
          return text.includes("balance") || text.includes("bike") || text.includes("bicycle") || text.includes("scooter");
        });
        const generatedCountByType: Record<string, number> = {
          single: Math.min(12, targetProducts.length),
          compare: 5,
          value: Math.min(5, targetProducts.length),
          ranking: Math.min(3, targetProducts.length),
          safety: Math.min(6, targetProducts.length),
        };
        return Math.max(1, Math.ceil(Math.max(routeEvaluations.length, generatedCountByType[normalizedReviewType] || 0) / 6));
      }

      if (seoKey === "news") {
        return newsPaginationTotalPages;
      }

      if (seoKey === "guides") {
        return guidesPaginationTotalPages;
      }

      return null;
    };

    document.title = titleStr;
    updateMetaTag("description", descStr);
    updateMetaTag("keywords", keywordsArr.join(", "));
    const canonicalPath = buildCanonicalPathFromPageConfig(pageConfig, currentPath, activePageIndex);
    const totalPages = resolvePaginationTotalPages();
    const isOutOfRangePagination = totalPages !== null && activePageIndex > totalPages;
    const noIndex =
      shouldNoIndexCurrentPath(canonicalPath, window.location.search, window.location.hostname) ||
      isOutOfRangePagination ||
      pageConfig?.indexingPolicy === "noindex";
    updateMetaTag("robots", noIndex ? "noindex,follow,max-image-preview:large" : defaultRobotsIndex);

    const canonicalOrigin =
      cmsSettings?.seoGlobal?.siteOrigin ||
      (cmsSettings as any)?.siteOrigin ||
      (import.meta.env.VITE_PRIMARY_SITE_ORIGIN as string | undefined) ||
      window.location.origin;
    const canonicalUrl = `${canonicalOrigin}${canonicalPath}`;
    updateCanonicalLink(canonicalUrl);
    updateMetaProperty("og:url", canonicalUrl);
    updateMetaProperty("og:type", "website");
    updateMetaProperty("og:title", titleStr);
    updateMetaProperty("og:description", descStr);

    const orgSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "KIDSMOBI",
      url: `${window.location.origin}/`,
      logo: `${window.location.origin}/favicon.ico`,
    };

    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: canonicalPath === "/"
        ? [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: `${window.location.origin}/`,
            },
          ]
        : [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: `${window.location.origin}/`,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: titleStr,
              item: canonicalUrl,
            },
          ],
    };

    const itemListItems = (() => {
      const getPagedSlice = <T,>(items: T[], pageSize: number) => {
        const page = Math.max(1, activePageIndex);
        const start = (page - 1) * pageSize;
        return items.slice(start, start + pageSize);
      };

      if (seoKey === "guides") {
        return getPagedSlice(guideArticles, 8).map((article, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: translateGuideArticle(article, lang).title,
          url: canonicalUrl,
        }));
      }
      if (seoKey === "news") {
        return getPagedSlice(newsArticles, 8).map((article, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: translateNewsArticle(article, lang).title,
          url: canonicalUrl,
        }));
      }
      if (seoKey === "evaluations") {
        return (getPagedSlice(evaluationsData, 6) as Evaluation[]).map((evaluation, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: lang === "zh" ? evaluation.zh.title : evaluation.en.title,
          url: canonicalUrl,
        }));
      }
      if (seoKey === "products") {
        return getPagedSlice(productsData, 9).map((product, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: translateProduct(product, lang).name,
          url: canonicalUrl,
        }));
      }
      return [] as Array<Record<string, unknown>>;
    })();

    const isCollectionSeoKey = ["guides", "news", "evaluations", "products"].includes(seoKey);
    const collectionSchema = isCollectionSeoKey
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: titleStr,
          numberOfItems: itemListItems.length,
          url: canonicalUrl,
          itemListElement: itemListItems,
        }
      : null;

    const webPageSchema = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: titleStr,
      url: canonicalUrl,
      description: descStr,
      inLanguage: lang,
    };

    injectJsonLd([orgSchema, webPageSchema, breadcrumbSchema, ...(collectionSchema ? [collectionSchema] : [])]);

  }, [activeTab, lang, cmsSettings, selectedProduct, activeProductCategory, activeReviewType, activePageIndex, productNavOptions, reviewNavOptions, productsData, evaluationsData, currentPath, newsPaginationTotalPages, guidesPaginationTotalPages]);

  const handleSelectProduct = (product: Product | null) => {
    if (product) {
      setPreviousTab(activeTab);
      setSelectedProduct(product);
      window.history.pushState({ ...(window.history.state || {}), kidsmobiProductDetail: true }, "", window.location.href);
      setActiveTab("product_detail");
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Update browsing records automatically
      setViewHistory(prev => {
        const filtered = prev.filter(p => p.id !== product.id);
        return [product, ...filtered].slice(0, 12); // Keep last 12 items for memory safety
      });
    } else {
      setSelectedProduct(null);
      setActiveTab(previousTab);
    }
  };

  const handleAxisLabelClick = (key: string) => {
    if (!key) return;
    setActiveStandardDimension(key);
    setTimeout(() => {
      const element = document.getElementById(`std-accordion-${key}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 120);
  };

  // 5. Drawer AI consultation controls
  const [showAiDrawer, setShowAiDrawer] = useState<boolean>(false);
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [globalSearchTerm, setGlobalSearchTerm] = useState<string>("");
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [expertNotice, setExpertNotice] = useState<string>("");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Scroll to Top state
  const [showBackToTop, setShowBackToTop] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > window.innerHeight);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Update suggestions based on search term
  useEffect(() => {
    if (globalSearchTerm.trim().length > 0) {
      const term = globalSearchTerm.toLowerCase();
      const filtered = productsData.filter(p => 
        p.name.toLowerCase().includes(term) ||
        p.brand.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term)
      ).slice(0, 5);
      setSuggestions(filtered);
      setHighlightedIndex(-1);
    } else {
      setSuggestions([]);
      setHighlightedIndex(-1);
    }
  }, [globalSearchTerm]);

  // Handle suggestion click
  const handleSuggestionClick = (product: Product) => {
    setGlobalSearchTerm(product.name);
    setSuggestions([]);
    setIsSearchFocused(false);
    handleSelectProduct(product);
  };

  // Initialize consultation chat with standard introduction
  useEffect(() => {
    if (lang === "zh") {
      setChatMessages([
        {
          id: "wel_1",
          role: "assistant",
          content: `您好呀！我是您的专属育儿选车顾问。😊

我正在查看宝宝的小档案：
- **宝宝年龄**：${childProfile.age} 岁
- **宝宝身高**：${formatHeight(childProfile.height, countryCode)}
- **腿长/跨高**：${childProfile.inseam ? formatHeight(childProfile.inseam, countryCode) : "还没测？没关系~"}
- **宝宝体重**：${formatWeight(childProfile.weight, countryCode)}

作为家长的贴心帮手，我特别给您两个建议：
1. **轻便最重要**：车重最好控制在 **${formatWeight(childProfile.weight * 0.3, countryCode)}** 以內。这样宝宝摔倒容易自立，推行也不费劲。
2. **刹车要好捏**：3岁以上的孩子手劲小，我会帮您盯着那些“短间距刹把”的车，让宝宝更有掌控感。

您是想了解 Woom、迪卡侬还是闪电的对比，还是想让我直接推荐最适合现在的车型？`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    } else {
      setChatMessages([
        {
          id: "wel_1",
          role: "assistant",
          content: `Hi there! I'm your friendly kids' bike expert. 😊

I'm looking at your little one's profile:
- **Age**: ${childProfile.age} years
- **Height**: ${formatHeight(childProfile.height, countryCode)}
- **Inseam**: ${childProfile.inseam ? formatHeight(childProfile.inseam, countryCode) : "Not measured yet"}
- **Weight**: ${formatWeight(childProfile.weight, countryCode)}

Here are my top "parent-to-parent" tips:
1. **Lightweight is Best**: Aim for a bike under **${formatWeight(childProfile.weight * 0.3, countryCode)}**. It's much safer and easier for them to handle.
2. **Small Hands, Easy Brakes**: I'll help you find bikes with "short-reach" levers so your child can stop safely and confidently.

Would you like to compare brands like Woom, Specialized, or Decathlon, or should I just show you the best fits?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    }
  }, [childProfile.age, childProfile.height, childProfile.inseam, childProfile.weight, lang, countryCode]);

  // Auto scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Call API for backend consultation
  const triggerAiResponse = async (messagesHistory: any[]) => {
    setIsAiLoading(true);
    setExpertNotice("");
    try {
      const cleanedMessagesForApi = messagesHistory.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: cleanedMessagesForApi,
          childProfile: childProfile,
          lang: lang
        })
      });

      if (!res.ok) {
        throw new Error(lang === "en" ? "Model response failed. Lab line down." : "模型响应失败，实验室专线故障。");
      }

      const data = await res.json();
      setChatMessages(prev => [
        ...prev,
        {
          id: `ai_${Date.now()}`,
          role: "assistant",
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    } catch (err: any) {
      console.error(err);
      if (lang === "en") {
        setExpertNotice("Failed to reach lab servers. Activating local offline fallback module.");
        const safeLimit = (childProfile.weight * 0.3).toFixed(1);
        setChatMessages(prev => [
          ...prev,
          {
            id: `ai_fallback_${Date.now()}`,
            role: "assistant",
            content: `⚠️ [Local Security Backup Engaged] Connection offline. Safety lab fallback module active:

**Custom safety guidelines for your child:**
*   **Max Dead Weight**: Vehicle must be strictly limited under **${safeLimit} kg**! Do not purchase heavy carbon steel frames.
*   **Short Reach Lever**: Choose dual hand V-brakes or discs with reaches of approx. **48mm**, instead of Coaster rear-pedal hub brakes brakes.
*   **Pneumatic Tires**: Pressure dampening on air-elastic tires is 80% more efficient than solid PVC/EVA foam tires. Protects the delicate spine & inner vestibular nerves of young toddlers.

*Cloud AI endpoint is currently disabled. Core recommendations remain available in local fallback mode.*`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        ]);
      } else {
        setExpertNotice("未能连上 KIDSMOBI 安全实验室专网，正在启动本地工效计算库。");
        const safeLimit = (childProfile.weight * 0.3).toFixed(1);
        setChatMessages(prev => [
          ...prev,
          {
            id: `ai_fallback_${Date.now()}`,
            role: "assistant",
            content: `⚠️【检测到本地安全备份】连线受阻，KIDSMOBI 启动脱机算力为您解答：

**结合宝宝特征的专属规约：**
*   **极限配重**：车辆必须限制在 **${safeLimit} kg** 以内，请勿网购过重的大铁架车。
*   **短距刹把**：选择手刹连杆在 **40mm 左右**的手拉V刹，而非Coaster脚倒刹。
*   **气橡胶胎**：橡胶轮胎因富弹性，泄压缓冲比PVC发泡胎好80%以上，更利于支撑小屁股并降低前庭震荡。

*当前已关闭 Google AI 接口，系统继续提供本地安全建议兜底能力。*`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        ]);
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isAiLoading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: "user",
      content: userInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setUserInput("");

    await triggerAiResponse(updatedMessages);
  };

  const clearSavedBookmarks = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        for (const item of savedProducts) {
          await removeBookmarkFromFirestore(currentUser.uid, item.id);
        }
      } catch (error) {
        console.error("清除云端收藏夹失败:", error);
      }
    }
    setSavedProducts([]);
  };

  return (
    <div id="decision_core" className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans selection:bg-orange-200 selection:text-slate-900 flex flex-col justify-between">
      
      {/* 2026 Consumer Safe Notice banner */}
      <div id="alert_banner" className="bg-orange-500 text-white px-4 py-2 text-center text-[12px] font-bold tracking-normal flex items-center justify-center gap-2 shadow-sm">
        <ShieldCheck className="w-4 h-4" />
        <span>{lang === "zh" ? "宝宝安全红线：车重请务必控制在体重的 30% 以内哦！" : "Safety Tip: Keep bike weight under 30% of your child's body weight!"}</span>
      </div>

      {/* Main sticky navigation header bar (B2C Refined) */}
      <header id="core_header" className="border-b border-slate-200 bg-white/95 backdrop-blur-xl sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row justify-between items-center gap-4">
          
          <div className="flex w-full md:w-auto items-center justify-between">
            {/* Brand Logo and custom version stamp */}
            <div className="flex items-center gap-3 cursor-pointer select-none shrink-0" onClick={() => navigateToTab("home")}>
              <div className="bg-orange-500 p-2 sm:p-2.5 rounded-2xl shadow-lg shadow-orange-500/20">
                <Baby className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[2.5]" />
              </div>
              <div className="text-left">
                <div className="text-lg sm:text-xl font-display font-black tracking-tight text-slate-900 flex items-center gap-2">
                  {t.brandTitle} <span className="hidden sm:inline-block text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase">{t.versionStamp}</span>
                </div>
                <p className="hidden sm:block text-[11px] text-slate-500 font-medium tracking-normal">Your Smart & Safe Kids' Mobility Lab</p>
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="flex md:hidden items-center gap-2 shrink-0">
              <button 
                onClick={() => setLang(prev => prev === "zh" ? "en" : "zh")} 
                className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 font-bold border border-slate-200 active:scale-95 transition-all flex items-center justify-center w-10 h-10"
                title={lang === "zh" ? "Switch to English" : "切换至中文"}
                aria-label={lang === "zh" ? "Switch to English" : "切换至中文"}
              >
                <span className="text-[10px] uppercase font-black">{lang === "zh" ? "EN" : "ZH"}</span>
              </button>
              <button
                onClick={() => navigateToTab("auth")}
                className={`p-2 rounded-xl transition-all border w-10 h-10 flex items-center justify-center ${
                  activeTab === "auth" 
                    ? "bg-orange-500 text-white border-orange-400" 
                    : userEmail 
                      ? "text-emerald-600 border-emerald-100 bg-emerald-50"
                      : "text-slate-500 border-slate-200 hover:text-slate-900 bg-white"
                }`}
                title={userEmail ? (lang === "zh" ? "我的收藏" : "My Space") : (lang === "zh" ? "登录" : "Sign In")}
                aria-label={userEmail ? (lang === "zh" ? "我的收藏" : "My Space") : (lang === "zh" ? "登录" : "Sign In")}
              >
                <Award className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs & Desktop Actions */}
          <div className="flex items-center gap-4 lg:gap-6 w-full md:w-auto overflow-x-auto no-scrollbar pb-1 md:pb-0 justify-start md:justify-end relative">
            <div className="relative w-full md:w-auto">
              <nav className="flex items-center bg-slate-100 p-1 rounded-2xl gap-1 text-xs shrink-0 whitespace-nowrap overflow-x-auto mx-auto md:mx-0">
                <button
                  onClick={() => handlePrimaryTabClick("home")}
                  className={`px-3 py-2 rounded-xl font-bold transition-all ${
                    activeTab === "home" ? "bg-white text-orange-500 shadow-sm" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {t.navHome}
                </button>

                <button
                  onClick={() => handlePrimaryTabClick("products")}
                  title={lang === "zh" ? "进入产品中心" : "Open products"}
                  className={`px-3 py-2 rounded-xl font-bold transition-all ${
                    activeTab === "products" ? "bg-white text-orange-500 shadow-sm" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {t.navProducts}
                </button>

                <button
                  onClick={() => handlePrimaryTabClick("evaluations")}
                  title={lang === "zh" ? "进入评测中心" : "Open reviews"}
                  className={`px-3 py-2 rounded-xl font-bold transition-all ${
                    activeTab === "evaluations" ? "bg-white text-orange-500 shadow-sm" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {t.navEvaluations}
                </button>

                <button
                  onClick={() => handlePrimaryTabClick("guides")}
                  className={`px-3 py-2 rounded-xl font-bold transition-all ${
                    activeTab === "guides" ? "bg-white text-orange-500 shadow-sm" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {t.navGuides}
                </button>

                <button
                  onClick={() => handlePrimaryTabClick("news")}
                  className={`px-3 py-2 rounded-xl font-bold transition-all ${
                    activeTab === "news" ? "bg-white text-orange-500 shadow-sm" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {t.navNews}
                </button>

                <button
                  onClick={() => handlePrimaryTabClick("about")}
                  className={`px-3 py-2 rounded-xl font-bold transition-all ${
                    activeTab === "about" ? "bg-white text-orange-500 shadow-sm" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {t.navAbout}
                </button>

                <button
                  onClick={() => handlePrimaryTabClick(isAdmin ? "admin" : "auth")}
                  title={isAdmin ? (lang === "zh" ? "进入管理后台" : "Open admin") : (lang === "zh" ? "登录后进入管理后台" : "Sign in to access admin")}
                  className={`px-3 py-2 rounded-xl font-bold transition-all ${
                    activeTab === "admin"
                      ? "bg-white text-orange-500 shadow-sm"
                      : isAdmin
                        ? "text-slate-500 hover:text-slate-900"
                        : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  {lang === "zh" ? "管理后台" : "Admin"}
                </button>
              </nav>
            </div>

            {/* Header Search & Auth & Lang (Desktop) */}
            <div className="hidden md:flex items-center gap-3 shrink-0">
              <div className="relative group hidden md:block">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors z-10 pointer-events-none ${isSearchFocused ? "text-orange-500" : "text-slate-400"}`} />
                <input 
                  type="text" 
                  value={globalSearchTerm}
                  onChange={(e) => setGlobalSearchTerm(e.target.value)}
                  placeholder={isSearchFocused ? (lang === "zh" ? "搜索..." : "Search...") : ""}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                  className={`pl-10 pr-0 py-2 bg-slate-100 border-transparent transition-all duration-500 ease-out focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 rounded-xl text-xs font-medium outline-none cursor-pointer focus:cursor-text focus:pr-4 ${isSearchFocused ? "w-64" : "w-10"}`}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                      setHighlightedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
                    } else if (e.key === "ArrowUp") {
                      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1));
                    } else if (e.key === "Enter") {
                      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
                        handleSuggestionClick(suggestions[highlightedIndex]);
                      } else {
                          navigateToTab("products");
                        setIsSearchFocused(false);
                      }
                    } else if (e.key === "Escape") {
                      setIsSearchFocused(false);
                    }
                  }}
                />
                
                {/* Autocomplete Dropdown */}
                {isSearchFocused && suggestions.length > 0 && (
                  <div className="absolute top-full mt-2 left-0 w-64 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {suggestions.map((p, idx) => (
                      <button
                        key={p.id}
                        onClick={() => handleSuggestionClick(p)}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                        className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors border-b border-slate-50 last:border-0 ${highlightedIndex === idx ? "bg-orange-50" : "hover:bg-slate-50"}`}
                      >
                        <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center shrink-0">
                          <SmartImage
                            src={resolveProductImages(p).coverUrl || undefined}
                            alt={getProductImageAlt(p)}
                            className="w-6 h-6 object-contain"
                            wrapperClassName="w-6 h-6"
                            width={24}
                            height={24}
                          />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-[11px] font-black text-slate-900 truncate uppercase">{translateProduct(p, lang).brand}</p>
                          <p className="text-[10px] text-slate-500 truncate">{translateProduct(p, lang).name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setLang(prev => prev === "zh" ? "en" : "zh")} 
                  className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 font-bold border border-slate-200 active:scale-95 transition-all flex items-center gap-1.5"
                  title={lang === "zh" ? "Switch to English" : "切换至中文"}
                >
                  <Globe className="w-4 h-4" />
                  <span className="text-[10px] uppercase">{lang === "zh" ? "EN" : "ZH"}</span>
                </button>
                
                <button
                  onClick={() => navigateToTab("auth")}
                  className={`p-2 rounded-xl font-bold transition-all border ${
                    activeTab === "auth" 
                      ? "bg-orange-500 text-white border-orange-400" 
                      : userEmail 
                        ? "text-emerald-600 border-emerald-100 bg-emerald-50"
                        : "text-slate-500 border-slate-200 hover:text-slate-900 bg-white"
                  }`}
                  title={userEmail ? (lang === "zh" ? "我的收藏" : "My Space") : (lang === "zh" ? "登录" : "Sign In")}
                >
                  <Award className="w-5 h-5" />
                </button>

              </div>
            </div>
          </div>


        </div>
      </header>

      {/* Primary content area container */}
      <main id="primary_tab_viewport" className="flex-1 max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full relative">
        <Suspense fallback={<div className="min-h-80 rounded-3xl border border-slate-100 bg-white/80 p-8 text-center text-sm font-bold text-slate-500 shadow-sm">Loading KIDSMOBI...</div>}>
        
        {activeTab === "home" && (
          <HomeSection 
            productsData={productsData} 
            onSelectProduct={handleSelectProduct} 
            setActiveTab={navigateToTab}
            childProfile={childProfile}
            setChildProfile={setChildProfile}
            onSelectCategory={handleHomeCategorySelect}
            lang={lang}
            currencyData={currencyData}
          />
        )}

        {activeTab === "news" && (
          <NewsSection
            lang={lang}
            currentPage={activePageIndex}
            onPageChange={(page) => navigateToPath(page <= 1 ? "/news/page/1" : `/news/page/${page}`, { preserveScroll: true })}
            onPaginationMetaChange={(meta) => setNewsPaginationTotalPages(meta.totalPages)}
          />
        )}

        {activeTab === "products" && (
          <ProductsSection 
            productsData={productsData}
            onSelectProduct={handleSelectProduct}
            compareList={compareList}
            setCompareList={setCompareList}
            savedProducts={savedProducts}
            setSavedProducts={updateSavedProductsAndFirestore}
            childProfile={childProfile}
            userEmail={userEmail}
            isAdmin={isAdmin}
            onOpenAdminProductEditor={openAdminProductEditor}
            lang={lang}
            currencyData={currencyData}
            viewHistory={viewHistory}
            initialCategory="all"
            activeCategory={activeProductCategory}
            onCategoryChange={(categoryId) => navigateToPath(categoryId === "all" ? "/products" : `/products/${categoryId}`, { preserveScroll: false })}
            seoKeywordHints={productSeoHints}
            currentPage={activePageIndex}
            onCompareOpen={(ids) => navigateToPath(`/compare?ids=${ids.join(",")}`)}
            onPageChange={(page) => {
              const categoryPath = activeProductCategory === "all" ? "/products" : `/products/${activeProductCategory}`;
              navigateToPath(page <= 1 ? categoryPath : `${categoryPath}/page/${page}`, { preserveScroll: false });
            }}
          />
        )}

        {activeTab === "compare" && (
          <div className="space-y-8 animate-fade-in text-left max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigateToPath("/products")}
                className="inline-flex items-center gap-2 text-slate-500 hover:text-orange-500 font-bold text-xs uppercase tracking-widest transition-colors cursor-pointer"
              >
                ← {lang === "en" ? "Back to Products" : "返回产品中心"}
              </button>
            </div>
            <ComparisonDashboard
              compareList={compareList}
              lang={lang}
              currencyData={currencyData}
              onSelectProduct={(p) => {
                handleSelectProduct(p);
              }}
              onRemove={(id) => {
                const nextList = compareList.filter(p => p.id !== id);
                setCompareList(nextList);
                const params = new URLSearchParams(window.location.search);
                if (nextList.length === 0) {
                  navigateToPath("/products");
                } else {
                  params.set("ids", nextList.map(p => p.id).join(","));
                  navigateToPath(`/compare?${params.toString()}`);
                }
              }}
              onClear={() => {
                setCompareList([]);
                navigateToPath("/products");
              }}
            />
          </div>
        )}

        {activeTab === "evaluations" && (
          <EvaluationsSection 
            evaluationsData={evaluationsData}
            productsData={productsData}
            onSelectProduct={handleSelectProduct}
            childProfile={childProfile}
            lang={lang}
            cmsSettings={cmsSettings}
            setActiveTab={navigateToTab}
            initialReviewType="single"
            activeReviewType={activeReviewType}
            activeEvaluationId={activeEvaluationId}
            onReviewTypeChange={(reviewTypeId) => navigateToPath(reviewTypeId === "single" ? "/reviews" : `/reviews/${reviewTypeId}`, { preserveScroll: true })}
            onEvaluationOpen={(evaluation) => {
              const reviewType = evaluation.type && evaluation.type !== "single" ? evaluation.type : "single";
              navigateToPath(reviewType === "single" ? `/reviews/single/${evaluation.id}` : `/reviews/${reviewType}/${evaluation.id}`);
            }}
            onEvaluationBack={(reviewTypeId) => navigateToPath(reviewTypeId === "single" ? "/reviews" : `/reviews/${reviewTypeId}`, { preserveScroll: true })}
            seoKeywordHints={reviewSeoHints}
            currentPage={activePageIndex}
            onPageChange={(page) => {
              const reviewPath = activeReviewType === "single" || activeReviewType === "all" ? "/reviews" : `/reviews/${activeReviewType}`;
              navigateToPath(page <= 1 ? reviewPath : `${reviewPath}/page/${page}`, { preserveScroll: true });
            }}
          />
        )}

        {activeTab === "guides" && (
          <GuidesSection 
            productsData={productsData}
            onSelectProduct={handleSelectProduct}
            childProfile={childProfile}
            setChildProfile={setChildProfile}
            lang={lang}
            currencyData={currencyData}
            currentPage={activePageIndex}
            onPageChange={(page) => navigateToPath(page <= 1 ? "/guides" : `/guides/page/${page}`, { preserveScroll: true })}
            onPaginationMetaChange={(meta) => setGuidesPaginationTotalPages(meta.totalPages)}
          />
        )}

        {activeTab === "product_detail" && selectedProduct && (
          <DetailedProductView
            product={selectedProduct}
            onClose={() => handleSelectProduct(null)}
            isAdmin={isAdmin}
            onOpenAdminProductEditor={openAdminProductEditor}
            lang={lang}
            activeStandardDimension={activeStandardDimension}
            setActiveStandardDimension={setActiveStandardDimension}
            previousTab={previousTab}
            cmsSettings={cmsSettings}
          />
        )}

        {activeTab === "about" && (
          <AboutSection lang={lang} />
        )}

        {activeTab === "transparency" && (
          <TransparencyPage pageKey={(getTransparencyPageByPath(currentPath)?.key || "disclaimer") as TransparencyPageKey} lang={lang} />
        )}

        {activeTab === "auth" && (
          <AuthSection 
            userEmail={userEmail}
            setUserEmail={setUserEmail}
            savedProducts={savedProducts}
            setSavedProducts={updateSavedProductsAndFirestore}
            onClearSaved={clearSavedBookmarks}
            productsData={productsData}
            lang={lang}
            currencyData={currencyData}
            viewHistory={viewHistory}
            compareList={compareList}
            setCompareList={setCompareList}
            onSelectProduct={handleSelectProduct}
            showDeveloperAdminBypass={isNonProductionHostname(window.location.hostname)}
          />
        )}

        {activeTab === "admin" && (
          <AdminPanel 
            onClose={() => navigateToTab("home")} 
            onRedirectAuth={() => navigateToTab("auth")}
            lang={lang}
            isAdmin={isAdmin}
            loading={authLoading}
            onDeveloperBypass={() => {
              safeStorageSet("dev_admin_bypass", "true");
              setUserEmail("hhool.student@gmail.com");
              setIsAdmin(true);
              setAuthLoading(false);
            }}
          />
        )}
        </Suspense>

      </main>

      {/* FLOAT DRAWER FOR AI ASSISTANT (B2C Friendly) */}
      {false && showAiDrawer && (
        <div id="ai_advisor_drawer" className="fixed bottom-6 right-6 z-40 w-96 max-h-[80vh] bg-white border border-slate-200 rounded-4xl shadow-2xl flex flex-col justify-between overflow-hidden animate-fade-in ring-1 ring-slate-900/5">
          
          {/* Drawer top banner */}
          <div className="bg-orange-50 p-5 border-b border-orange-100 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm shadow-orange-500/30"></div>
              <strong className="text-orange-950 font-bold">{t.advisorTitle}</strong>
            </div>
            <button 
              onClick={() => setShowAiDrawer(false)}
              className="text-orange-300 hover:text-orange-600 p-1.5 rounded-full hover:bg-white transition-colors"
              title={lang === "zh" ? "关闭顾问面板" : "Close advisor panel"}
              aria-label={lang === "zh" ? "关闭顾问面板" : "Close advisor panel"}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages viewport */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 max-h-[50vh] text-sm">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col space-y-1.5 ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                <div className={`max-w-[85%] p-4 rounded-2xl leading-relaxed whitespace-pre-wrap shadow-sm ${
                  msg.role === "user" 
                    ? "bg-orange-500 text-white rounded-tr-none" 
                    : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/50"
                }`}>
                  {msg.content}
                </div>
                <span className="text-[10px] text-slate-400 font-bold px-1">{msg.timestamp}</span>
              </div>
            ))}
            
            {isAiLoading && (
              <div className="text-left py-2 flex items-center gap-2 text-slate-400 text-[11px] font-medium">
                <RefreshCw className="w-4 h-4 animate-spin text-orange-500" />
                {t.advisorLoading}
              </div>
            )}
            
            {expertNotice && (
              <div className="p-3 bg-orange-50 text-orange-600 rounded-xl text-[11px] text-center border border-orange-100">
                {expertNotice}
              </div>
            )}

            <div ref={chatBottomRef}></div>
          </div>

          {/* Form area */}
          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={lang === "en" ? "Ask a question..." : "问问专家建议..."}
              className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            />
            <button 
              type="submit"
              disabled={isAiLoading || !userInput.trim()}
              className="p-2.5 bg-orange-500 disabled:bg-slate-200 text-white rounded-2xl font-bold transition-all shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95"
              title={lang === "zh" ? "发送消息" : "Send message"}
              aria-label={lang === "zh" ? "发送消息" : "Send message"}
            >
              <Send className="w-5 h-5" />
            </button>
          </form>

        </div>
      )}

      {/* Persistent global Foot Trust copyright (PRD Footer Column Section 4.1.8) */}
      {activeTab !== "admin" && (
      <footer id="main_footer" className="bg-slate-900 border-t border-slate-800 pt-20 pb-10 text-xs">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            {/* Column 1: Brand */}
            <div className="md:col-span-1 space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-black text-lg">K</span>
                </div>
                <span className="text-xl font-display font-black text-white tracking-tighter">KIDSMOBI</span>
              </div>
              <p className="text-slate-500 leading-relaxed font-medium pr-4">
                {lang === "en" 
                  ? "Global safety benchmark lab for premium kids mobility. We turn mechanical data into parenting confidence."
                  : "全球高端童车安全基准实验室。我们将繁琐的机械数据转化为父母的选购自信。"}
              </p>
            </div>

            {/* Column 2: Review pathways */}
            <div className="space-y-6">
              <h4 className="text-white font-bold uppercase tracking-widest text-[10px]">
                {lang === "en" ? "Review Categories" : "评测分类"}
              </h4>
              <ul className="space-y-3 font-medium">
                <li>
                  <a href="/reviews" className="hover:text-orange-500 transition-colors text-slate-400">
                    {lang === "en" ? "Balance Bike Reviews" : "平衡车评测"}
                  </a>
                </li>
                <li>
                  <a href="/products" className="hover:text-orange-500 transition-colors text-slate-400">
                    {lang === "en" ? "Kids Bike Product Hub" : "儿童自行车产品库"}
                  </a>
                </li>
                <li>
                  <a href="/products" className="hover:text-orange-500 transition-colors text-slate-400">
                    {lang === "en" ? "Kids Scooter Product Hub" : "儿童滑板车产品库"}
                  </a>
                </li>
                <li>
                  <a href="/guides" className="hover:text-orange-500 transition-colors text-slate-400">
                    {lang === "en" ? "Sizing & Buying Guide" : "尺寸与选购指南"}
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Policy & transparency */}
            <div className="space-y-6">
              <h4 className="text-white font-bold uppercase tracking-widest text-[10px]">
                {lang === "en" ? "Transparency" : "透明度与标准"}
              </h4>
              <ul className="space-y-3 font-medium">
                <li>
                  <a
                    href={TRANSPARENCY_PAGE_PATHS.disclaimer}
                    className="hover:text-orange-500 transition-colors text-slate-400"
                    onClick={(event) => {
                      event.preventDefault();
                      navigateToPath(TRANSPARENCY_PAGE_PATHS.disclaimer);
                    }}
                  >
                    Disclaimer
                  </a>
                </li>
                <li>
                  <a
                    href={TRANSPARENCY_PAGE_PATHS["testing-methodology"]}
                    className="hover:text-orange-500 transition-colors text-slate-400"
                    onClick={(event) => {
                      event.preventDefault();
                      navigateToPath(TRANSPARENCY_PAGE_PATHS["testing-methodology"]);
                    }}
                  >
                    Testing Methodology
                  </a>
                </li>
                <li>
                  <a
                    href={TRANSPARENCY_PAGE_PATHS.certification}
                    className="hover:text-orange-500 transition-colors text-slate-400"
                    onClick={(event) => {
                      event.preventDefault();
                      navigateToPath(TRANSPARENCY_PAGE_PATHS.certification);
                    }}
                  >
                    Certification & Lab Notes
                  </a>
                </li>
                <li>
                  <a
                    href={TRANSPARENCY_PAGE_PATHS["privacy-policy"]}
                    className="hover:text-orange-500 transition-colors text-slate-400"
                    onClick={(event) => {
                      event.preventDefault();
                      navigateToPath(TRANSPARENCY_PAGE_PATHS["privacy-policy"]);
                    }}
                  >
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4: Connectivity */}
            <div className="space-y-6">
              <h4 className="text-white font-bold uppercase tracking-widest text-[10px]">
                {lang === "en" ? "Global Network" : "社交分享"}
              </h4>
              <div className="flex flex-wrap gap-3">
                <a 
                  href={`https://x.com/intent/tweet?text=${encodeURIComponent(lang === "en" ? "Check out KIDSMOBI - Premium Kids Mobility Evaluation Platform! #KidsMobility #Safety" : "推荐一个高端垂直童车评测平台 KIDSMOBI，专注安全与工效！#童车评测 #育儿")}&url=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all border border-slate-700 hover:border-orange-500/50"
                  title="Share on X (Twitter)"
                >
                  <Twitter className="w-4 h-4" />
                </a>
                <a 
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all border border-slate-700 hover:border-orange-500/50"
                  title="Share on Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a 
                  href="https://youtube.com/@kidsmobi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all border border-slate-700 hover:border-orange-500/50"
                  title="YouTube"
                >
                  <Youtube className="w-4 h-4" />
                </a>
                <a 
                  href="https://tiktok.com/@kidsmobi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all border border-slate-700 hover:border-orange-500/50"
                  title="TikTok"
                >
                  <Music className="w-4 h-4" />
                </a>
              </div>
              <div className="pt-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  <span className="text-[10px] text-green-500 font-bold tracking-tight">
                    {lang === "en" ? "NODES ONLINE" : "实验室节点在线"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-10 border-t border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <span className="font-extrabold text-slate-400 block">
                  {lang === "en" 
                    ? "© 2026 KIDSMOBI Global Safety Lab & Buyer's Decision Advisory Portal, Inc."
                    : "© 2026 KIDSMOBI · 全球高端垂直童车评测决策平台 · 版权所有"}
                </span>
                <p className="text-[10px] text-slate-600">
                  {lang === "en" ? "Automated 24h testing telemetry lab servers active" : "KIDSMOBI 全球安全实验室系统备案：322407969155-AIS-K2"}
                </p>
                {isAdmin && (
                  <button 
                    onClick={() => navigateToTab("admin")}
                    className="flex items-center gap-2 mt-2 px-3 py-1 bg-slate-800 text-slate-400 hover:text-white border border-slate-700 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all w-fit"
                  >
                    <SettingsIcon className="w-3 h-3 text-orange-500" />
                    {lang === "en" ? "Admin Console" : "管理后台"}
                  </button>
                )}
              </div>

              {/* Country & Currency Selector */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  <select 
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="bg-transparent text-slate-300 font-bold outline-none cursor-pointer hover:text-white transition-colors"
                    title={lang === "zh" ? "选择国家与货币" : "Select country and currency"}
                    aria-label={lang === "zh" ? "选择国家与货币" : "Select country and currency"}
                  >
                    {countries
                      .filter((c) => ["US", "DE", "GB"].includes(c.code))
                      .map((c) => (
                        <option key={c.code} value={c.code} className="bg-slate-900">
                          {lang === "zh" ? c.name : c.nameEn} ({c.currency})
                        </option>
                      ))}
                  </select>
                </div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-800">
                  {lang === "zh" ? "结算货币：" : "Currency:"}{" "}
                  <span className="text-orange-500">
                    {currencyData?.symbol} {currencyData?.currency} 
                    {currencyData?.rate !== 1 && ` (1 USD = ${currencyData?.rate} ${currencyData?.currency})`}
                  </span>
                </div>
              </div>
            </div>
            
            <p className="max-w-2xl text-[10px] text-slate-600 leading-relaxed text-left md:text-right italic">
              {lang === "en"
                ? "Unbiased Oath: We do not accept sponsorship insertions or marketing fees. All scores are objective biomechanical results."
                : "独立性声明：KIDSMOBI 拒绝任何商业品牌广告植入。所有评分均基于生物力学客观公式得出。"}
            </p>
          </div>

          <div className="mt-8 text-center">
            <p className="max-w-5xl mx-auto text-[9px] text-slate-750 uppercase tracking-[0.2em] opacity-30">
              CPSC · ISO 8098 · GB 14746 · EN 71 · ASTM F963 · PHYS-DATA INTEGRITY COMPLIANT
            </p>
          </div>
        </div>
      </footer>
      )}

      {/* Back to Top Button */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-24 right-8 z-40 p-4 bg-orange-500 text-white rounded-2xl shadow-2xl shadow-orange-500/20 border border-orange-400 hover:bg-orange-600 transition-colors focus:outline-none focus:ring-4 focus:ring-orange-500/20 active:scale-95"
            title={lang === "en" ? "Back to Top" : "回到顶部"}
          >
            <ArrowUp className="w-5 h-5 stroke-3" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
