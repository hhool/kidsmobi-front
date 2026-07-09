import { useState, useEffect, useRef, FormEvent, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Baby,
  ShieldCheck,
  Send,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  MessageSquare,
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
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip
} from "recharts";
import { productsData as defaultProductsData } from "./data/modelsData";
import { guideArticles } from "./data/guidesData";
import { newsArticles } from "./data/newsData";
import { initialEvaluationsData } from "./data/evaluationsData";
import { ChildProfile, Product, ChatMessage, CMSSettings, SEOConfig, Evaluation, CMSPageConfig } from "./types";

// Import translations
import { translations, translateProduct, translateNewsArticle, translateGuideArticle, countries, getCurrencyData } from "./lib/translate";
import { formatWeight, formatHeight } from "./lib/units";
import { resolveProductImages } from "./lib/productImages";
import { loadBatchProducts } from "./lib/loadBatchProducts";

// Import modular layouts
import HomeSection from "./components/HomeSection";
import NewsSection from "./components/NewsSection";
import ProductsSection from "./components/ProductsSection";
import EvaluationsSection from "./components/EvaluationsSection";
import GuidesSection from "./components/GuidesSection";
import AboutSection from "./components/AboutSection";
import AuthSection from "./components/AuthSection";
import DetailedProductView from "./components/DetailedProductView";
import AdminPanel from "./components/AdminPanel";
import SmartImage from "./components/common/SmartImage";

import { auth } from "./lib/firebase";
import { getBookmarksFromFirestore, addBookmarkToFirestore, removeBookmarkFromFirestore } from "./lib/firestoreService";
import { checkIsAdmin, getCMSSettings, getCMSProducts, getCMSEvaluations, seedProductsToFirestore, seedEvaluationsToFirestore, seedGuidesToFirestore, seedNewsToFirestore } from "./lib/cmsService";
import { fetchContentBundle, isScrapedContentSource } from "./lib/contentSource";
import { getProductSeoKeywords, getReviewSeoKeywords } from "./config/seoKeywordMap";

const DEFAULT_SEO_CONFIGS: Record<string, { zh: SEOConfig; en: SEOConfig }> = {
  home: {
    zh: {
      title: "全新一代高端童车安全评测与科学网购决策平台 | KIDSMOBI",
      description: "KIDSMOBI 致力于为全球家庭提供科学、中立的童车评测与安全审计服务。通过严苛的物理结构负载公式和工效学实测，覆盖儿童平衡车、童车拉车、安全座椅等领域的国际质量认证、参数对比与智能选车推荐。",
      keywords: ["童车评测", "平衡车推荐", "安全座椅测评", "智能选车向导", "KIDSMOBI", "儿童滑板车评测"]
    },
    en: {
      title: "Jogging Stroller, Balance Bike & Kids Scooter | KIDSMOBI",
      description: "KIDSMOBI helps families choose a stroller & jogging stroller, balance bike, toddler bike, and kids scooter with objective safety reviews, fit guidance, and test-backed how to choose a baby stroller methods.",
      keywords: ["jogging stroller", "balance bike", "toddler bike",  "kids scootor"]
    }
  },
  news: {
    zh: {
      title: "童车行业趋势、品牌新品与科学选购资讯 | KIDSMOBI",
      description: "聚合 stroller、balance bike、kids bike、scooter 相关行业趋势、新品发布、法规政策、品牌动态与科学选购软文，帮助家长用更少时间理解市场变化。",
      keywords: ["童车行业趋势", "童车新品发布", "童车法规政策", "品牌动态", "科学选购"]
    },
    en: {
      title: "Jogging Stroller, Balance Bike & Kids Scooter ｜ KIDSMOBI",
      description: "Kids mobility news covering market trends, product launches, regulations, brand updates, and practical science tips for family buying decisions.",
      keywords: ["stroller news", "balance bike news", "kids bike news", "kids scooter news", "new launches", "brand news", "science tips"]
    }
  },
  products: {
    zh: {
      title: "童车多维参数比对矩阵 | KIDSMOBI 选车大数据库",
      description: "提供覆盖各大主流豪华及专业品牌的参数、重量系数、几何重心和刹车力度对标详情。科学排除不合理的超载或易侧翻童车款式。",
      keywords: ["童车参数对比", "平衡车挑选数据库", "童车重量对比", "几何重心分析"]
    },
    en: {
      title: "Jogging Stroller, Balance Bike & Kids Scooter | KIDSMOBI",
      description: "Compare specs for all types of kids' mobility products. Find the best kids stroller, jogging stroller, balance bike, toddler bike, and kids scooter",
      keywords: ["kids stroller", "jogging stroller", "balance bike", "toddler bike", "kids scooter"]
    }
  },
  evaluations: {
    zh: {
      title: "深度实验室评测报告 | KIDSMOBI 独家实测与专业意见",
      description: "KIDSMOBI 独家评测报告，汇聚专业工程师对力学稳定性、材料应力、舒适度指数及真实家庭磨损测试的数据可视化呈现。",
      keywords: ["工程师评测报告", "机械载重量测试", "滑行顺畅度实测", "童车优缺点分析"]
    },
    en: {
      title: "Jogging Stroller, Balance Bike Reviews | KIDSMOBI",
      description: "Read lab-grade stroller and jogging stroller reviews with structural stress tests, plus double stroller and twin stroller safety comparisons for practical travel stroller decisions.",
      keywords: ["jogging stroller", "balance bike", "toddler bike", "annual top", "safety special"]
    }
  },
  guides: {
    zh: {
      title: "专家避坑指南与选型计算中心 | KIDSMOBI 科学购车顾问",
      description: "首创儿童跨步长（Inseam）与车架结合的黄金配对算法，提供避坑防断裂模块化警示，辅助每一位父母买对不买贵。",
      keywords: ["选型指南", "避坑指南", "跨步长计算器", "车架黄金比例"]
    },
    en: {
      title: "How to Choose a Baby Stroller | KIDSMOBI",
      description: "Follow practical stroller buying guides for how to choose a baby stroller, jogging stroller fit checks, best travel stroller picks, and family-ready double stroller and twin stroller planning.",
      keywords: ["how to choose a baby stroller", "jogging stroller", "balance bike", "toddler bike", "kids scooter"]
    }
  },
  about: {
    zh: {
      title: "精致、客观而毫不妥协的评测追求 | KIDSMOBI",
      description: "深入了解 KIDSMOBI 的独立实测流程、设备校准基准与物理计算底座。我们保持彻底的中立性与极高的专业良知，保障您孩子的滑行成长路。",
      keywords: ["关于KIDSMOBI", "实验室愿景", "评测中立性声明", "团队核心成员"]
    },
    en: {
      title: "Jogging Stroller, Balance Bike & Safety Lab | KIDSMOBI",
      description: "Learn how KIDSMOBI audits stroller, jogging stroller, balance bike and toddler bike safety with independent methods and transparent family-focused evaluation standards.",
      keywords: [ "jogging stroller", "balance bike ", "toddler bike`", "stroller safety lab", "KIDSMOBI team"]
    }
  }
};

const SEO_KEY_TO_PAGE_TYPE: Record<string, CMSPageConfig["pageType"]> = {
  home: "home",
  products: "products_index",
  evaluations: "reviews_index",
  guides: "guides_index",
  news: "news_index",
  about: "about",
};

const DEFAULT_CMS_PAGE_BLUEPRINT: Record<string, CMSPageConfig> = {
  home: { pageType: "home", pageSlug: "home", pageIndex: 1, paginationPolicy: "none", indexingPolicy: "index", status: "published" },
  products: { pageType: "products_index", pageSlug: "products", pageIndex: 1, paginationPolicy: "page_path", indexingPolicy: "index", status: "published" },
  evaluations: { pageType: "reviews_index", pageSlug: "reviews", pageIndex: 1, paginationPolicy: "page_path", indexingPolicy: "index", status: "published" },
  guides: { pageType: "guides_index", pageSlug: "guides", pageIndex: 1, paginationPolicy: "page_path", indexingPolicy: "index", status: "published" },
  news: { pageType: "news_index", pageSlug: "news", pageIndex: 1, paginationPolicy: "page_path", indexingPolicy: "index", status: "published" },
  about: { pageType: "about", pageSlug: "about", pageIndex: 1, paginationPolicy: "none", indexingPolicy: "index", status: "published" },
};

const PRODUCTS_PAGE_KEYWORDS_EN = [
  "kids stroller",
  "jogging stroller",
  "balance bike",
  "toddler bike",
  "kids scooter",
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

const resolveProductCategoryId = (product: Product) => {
  const raw = String((product as any)?.categoryId || product?.category || "").trim().toLowerCase();
  return PRODUCT_CATEGORY_ID_ALIASES[raw] || raw;
};

const resolveProductMergeKey = (product: Product) => {
  const raw = String((product as any)?.productId || (product as any)?.ASIN || product.id || "").trim();
  const asinMatch = raw.match(/[A-Z0-9]{10}/i);
  if (asinMatch) {
    return asinMatch[0].toLowerCase();
  }
  return raw.toLowerCase();
};

const mergeBatchProductsIntoBase = (baseProducts: Product[], batchProducts: Product[]) => {
  if (!batchProducts.length) return baseProducts;

  const mergedById = new Map(baseProducts.map(product => [product.id, product]));
  const idByMergeKey = new Map(baseProducts.map(product => [resolveProductMergeKey(product), product.id]));
  for (const product of batchProducts) {
    const mergeKey = resolveProductMergeKey(product);
    const previousId = idByMergeKey.get(mergeKey);
    if (previousId && previousId !== product.id) {
      mergedById.set(previousId, product);
    } else {
      mergedById.set(product.id, product);
    }
    idByMergeKey.set(mergeKey, product.id);
  }
  return Array.from(mergedById.values());
};

const filterExcludedProductCategories = (products: Product[]) => {
  return products.filter((product) => !EXCLUDED_PRODUCT_CATEGORY_IDS.has(resolveProductCategoryId(product)));
};

const mergeCmsWithFallbackByCategory = (cmsProducts: Product[], fallbackProducts: Product[]) => {
  const merged = [...cmsProducts];
  const seenIds = new Set(cmsProducts.map((item) => item.id));
  const coveredCategories = new Set(cmsProducts.map((item) => resolveProductCategoryId(item)).filter(Boolean));

  for (const item of fallbackProducts) {
    const categoryId = resolveProductCategoryId(item);
    if (!categoryId || coveredCategories.has(categoryId) || seenIds.has(item.id)) {
      continue;
    }
    merged.push(item);
    seenIds.add(item.id);
  }

  return merged;
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
    normalized === "127.0.0.1" ||
    normalized.startsWith("dev.")
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
  return saved === "zh" || saved === "en" ? saved : "zh";
};

const resolveRouteState = (pathname: string, hash: string) => {
  if (hash === "#cms" || hash === "#cm") {
    return {
      activeTab: "admin",
      activeProductCategory: "all",
      activeReviewType: "all",
      activePageIndex: 1,
      currentPath: normalizePathname(pathname),
    };
  }

  const currentPath = normalizePathname(pathname);
  const segments = currentPath.split("/").filter(Boolean);
  const [root, sub] = segments;

  if (!root) {
    return {
      activeTab: "home",
      activeProductCategory: "all",
      activeReviewType: "all",
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
      activePageIndex,
      currentPath,
    };
  }

  if (root === "reviews" || root === "evaluations") {
    const pageSegmentIndex = segments.indexOf("page");
    const activePageIndex = pageSegmentIndex >= 0 ? Number(segments[pageSegmentIndex + 1] || 1) : 1;
    const activeReviewType = sub && REVIEW_ROUTE_IDS.has(sub) ? sub : "single";
    return {
      activeTab: "evaluations",
      activeProductCategory: "all",
      activeReviewType,
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
      activePageIndex,
      currentPath,
    };
  }

  if (root === "about") {
    return {
      activeTab: "about",
      activeProductCategory: "all",
      activeReviewType: "all",
      activePageIndex: 1,
      currentPath,
    };
  }

  if (root === "auth") {
    return {
      activeTab: "auth",
      activeProductCategory: "all",
      activeReviewType: "all",
      activePageIndex: 1,
      currentPath,
    };
  }

  return {
    activeTab: "home",
    activeProductCategory: "all",
    activeReviewType: "all",
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
  const [activePageIndex, setActivePageIndex] = useState<number>(initialRouteState.activePageIndex);
  const [currentPath, setCurrentPath] = useState<string>(initialRouteState.currentPath);
  const [newsPaginationTotalPages, setNewsPaginationTotalPages] = useState<number | null>(null);
  const [guidesPaginationTotalPages, setGuidesPaginationTotalPages] = useState<number | null>(null);
  const activeTabRef = useRef<string>(initialRouteState.activeTab);
  const batchProductsRef = useRef<Product[]>([]);

  const applyBatchProducts = (products: Product[]) => {
    return mergeBatchProductsIntoBase(products, batchProductsRef.current);
  };

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  const syncRouteStateFromLocation = () => {
    const routeState = resolveRouteState(window.location.pathname, window.location.hash);
    setActiveTab(routeState.activeTab);
    setActiveProductCategory(routeState.activeProductCategory);
    setActiveReviewType(routeState.activeReviewType);
    setActivePageIndex(routeState.activePageIndex);
    setCurrentPath(routeState.currentPath);
  };

  const navigateToPath = (path: string, options?: { replace?: boolean; preserveScroll?: boolean }) => {
    const normalizedPath = normalizePathname(path);
    const shouldReplace = options?.replace ?? false;
    const preserveScroll = options?.preserveScroll ?? false;
    const hasChanged = window.location.pathname !== normalizedPath || window.location.hash === "#cms";

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
        // Asynchronously save to Firebase
        import("./lib/firestoreService").then(({ saveChildProfileToFirestore }) => {
          saveChildProfileToFirestore(currentUser.uid, newProfile);
        }).catch(err => console.error("Dynamic import failed", err));
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
  const [productsData, setProductsData] = useState<Product[]>(defaultProductsData);
  const [evaluationsData, setEvaluationsData] = useState<Evaluation[]>([]);

  // Cache compareList and viewHistory on change and keep them fresh relative to database updates
  useEffect(() => {
    try {
      localStorage.setItem("unauth_compare_list", JSON.stringify(compareList));
    } catch (e) {
      console.error("Failed to write to unauth_compare_list", e);
    }
  }, [compareList]);

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
          const matched = productsData.find(p => p.id === item.id);
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
          const matched = productsData.find(p => p.id === item.id);
          if (matched && JSON.stringify(matched) !== JSON.stringify(item)) {
            changed = true;
            return matched;
          }
          return item;
        });
        return changed ? updated : prev;
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
        let nextProducts = filterExcludedProductCategories(publishedProducts);
        const publishedCategories = new Set(nextProducts.map((item) => resolveProductCategoryId(item)).filter(Boolean));
        const requiredCategories = PRODUCT_NAV_OPTIONS.map((item) => item.id).filter(
          (id) => id !== "all" && !EXCLUDED_PRODUCT_CATEGORY_IDS.has(id)
        );
        const missingCategories = requiredCategories.filter((id) => !publishedCategories.has(id));

        if (missingCategories.length > 0) {
          // Keep CMS as primary source, but fill category gaps from runtime fallback data.
          try {
            const bundle = await fetchContentBundle();
            if (!isActive) return;
            const fallbackProducts =
              bundle.products && bundle.products.length > 0
                ? filterExcludedProductCategories(bundle.products)
                : filterExcludedProductCategories(defaultProductsData);
            nextProducts = mergeCmsWithFallbackByCategory(nextProducts, fallbackProducts);
          } catch {
            if (!isActive) return;
            nextProducts = mergeCmsWithFallbackByCategory(
              nextProducts,
              filterExcludedProductCategories(defaultProductsData)
            );
          }
        }

        setProductsData(applyBatchProducts(nextProducts));
      } else {
        // If initialization imported draft-only products, avoid a blank Product Center.
        const allProducts = await getCMSProducts(false);
        if (!isActive) return;
        if (allProducts && allProducts.length > 0) {
          setProductsData(applyBatchProducts(filterExcludedProductCategories(allProducts)));
        } else {
          // Final fallback: bootstrap from backend bundle so category pages never render empty.
          try {
            const bundle = await fetchContentBundle();
            if (!isActive) return;
            if (bundle.products && bundle.products.length > 0) {
              setProductsData(applyBatchProducts(filterExcludedProductCategories(bundle.products)));
            } else {
              setProductsData(applyBatchProducts(filterExcludedProductCategories(defaultProductsData)));
            }
          } catch {
            if (!isActive) return;
            setProductsData(applyBatchProducts(filterExcludedProductCategories(defaultProductsData)));
          }
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
              setProductsData(applyBatchProducts(filterExcludedProductCategories(bundle.products)));
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
          setProductsData(applyBatchProducts(filterExcludedProductCategories(bundle.products)));
          setEvaluationsData(bundle.evaluations);
          return;
        }

        throw new Error("Content bundle is incomplete.");
      } catch (err) {
        console.warn("Failed to load scraped content bundle, falling back to CMS data:", err);
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
            return mergeBatchProductsIntoBase(prev, batchProducts);
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
          const successProd = await seedProductsToFirestore(defaultProductsData, translateProduct);
          if (successProd) {
            const freshProducts = await getCMSProducts(true);
            if (freshProducts && freshProducts.length > 0) {
              setProductsData(filterExcludedProductCategories(freshProducts));
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
          const { getChildProfileFromFirestore } = await import("./lib/firestoreService");
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
    const pageSeo = pageConfig?.seo?.[lang];
    if (pageSeo) {
      return { seo: pageSeo, pageConfig };
    }

    const routeSeo = cmsSettings?.seo?.[seoKey]?.[lang];
    if (routeSeo) {
      return { seo: routeSeo, pageConfig };
    }

    const fallbackSeo = DEFAULT_SEO_CONFIGS[seoKey]?.[lang] || DEFAULT_SEO_CONFIGS.home[lang];
    return { seo: fallbackSeo, pageConfig };
  };

  // Dynamic SEO Page Meta Configuration (Title, Keywords, Description)
  useEffect(() => {
    // Determine active tab database key
    let seoKey = activeTab;
    if (activeTab === "product_detail") {
      if (selectedProduct) {
        const name = selectedProduct.name;
        const brand = selectedProduct.brand;
        const cat = selectedProduct.category;

        const title = lang === "zh"
          ? `${brand} ${name} 独家深度客观安全评测报告 | KIDSMOBI`
          : `${brand} ${name} Exclusive Safety Evaluation & Specs | KIDSMOBI`;

        const desc = lang === "zh"
          ? `${brand} ${name} (${selectedProduct.ageRange})的物理材料、轮径比、刹车制动等详细性能参数，结合KIDSMOBI实验室工程师的独家拆解观点与真实优缺点分析。`
          : `Meticulous safety verification for the ${brand} ${name} kids mobility. Comprehensive parameters, raw materials, pros/cons, and engineer reviews.`;

        const kws = lang === "zh"
          ? [name, brand, cat, "童车数据评测", "KIDSMOBI"]
          : [name, brand, cat, "parameters", "product evaluation", "KIDSMOBI"];

        document.title = title;
        updateMetaTag("description", desc);
        updateMetaTag("keywords", kws.join(", "));
        const canonicalPath = normalizeCanonicalPath(currentPath);
        const canonicalUrl = `${window.location.origin}${canonicalPath}`;
        const noIndex = shouldNoIndexCurrentPath(canonicalPath, window.location.search, window.location.hostname);
        updateCanonicalLink(canonicalUrl);
        updateMetaProperty("og:url", canonicalUrl);
        updateMetaProperty("og:type", "article");
        updateMetaProperty("og:title", title);
        updateMetaProperty("og:description", desc);
        updateMetaTag("robots", noIndex ? "noindex,follow,max-image-preview:large" : "index,follow,max-image-preview:large");

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

    // Default to mapped key if valid, fallback to 'home'
    const validKeys = ["home", "news", "products", "evaluations", "guides", "about"];
    if (!validKeys.includes(seoKey)) {
      seoKey = "home";
    }

    const { seo: resolvedSEO, pageConfig } = resolveCmsRouteSeoConfig(seoKey);
    let titleStr = resolvedSEO.title;
    let descStr = resolvedSEO.description;
    let keywordsArr = resolvedSEO.keywords;

    if (activePageIndex > 1 && ["products", "evaluations", "guides", "news"].includes(seoKey)) {
      titleStr = lang === "zh" ? `${titleStr} - 第 ${activePageIndex} 页` : `${titleStr} - Page ${activePageIndex}`;
      descStr = lang === "zh"
        ? `${descStr} 当前为第 ${activePageIndex} 页分页内容。`
        : `${descStr} This is paginated page ${activePageIndex}.`;
    }

    if (seoKey === "products" && activeProductCategory !== "all") {
      const selectedCategory = productNavOptions.find((item) => item.id === activeProductCategory)?.label || activeProductCategory;
      titleStr = lang === "zh"
        ? `${selectedCategory} 参数 | KIDSMOBI 产品中心`
        : `${selectedCategory} Specs | KIDSMOBI Products`;
      descStr = lang === "zh"
        ? `聚焦 ${selectedCategory} 的参数、安全与选购建议，结合实测数据快速筛选更适合宝宝的车型。`
        : `Focused insights for ${selectedCategory}: specs, safety metrics, and buying recommendations powered by real test data.`;
      keywordsArr = getProductSeoKeywords(activeProductCategory, lang);
    }

    if (seoKey === "evaluations" && activeReviewType !== "all") {
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
    updateMetaTag("robots", noIndex ? "noindex,follow,max-image-preview:large" : "index,follow,max-image-preview:large");

    const canonicalOrigin =
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
    <div id="decision_core" className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-orange-200 selection:text-slate-900 flex flex-col justify-between">
      
      {/* 2026 Consumer Safe Notice banner */}
      <div id="alert_banner" className="bg-orange-500 text-white px-4 py-2 text-center text-[12px] font-bold tracking-normal flex items-center justify-center gap-2 shadow-sm">
        <ShieldCheck className="w-4 h-4" />
        <span>{lang === "zh" ? "宝宝安全红线：车重请务必控制在体重的 30% 以内哦！" : "Safety Tip: Keep bike weight under 30% of your child's body weight!"}</span>
      </div>

      {/* Main sticky navigation header bar (B2C Refined) */}
      <header id="core_header" className="border-b border-slate-200 bg-white/95 backdrop-blur sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          
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
                <p className="hidden sm:block text-[11px] text-slate-500 font-medium tracking-normal">{lang === "zh" ? "更科学、更贴心的童车导购助手" : "Your Smart & Safe Kids Bike Guide"}</p>
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
              <button
                onClick={() => setShowAiDrawer(!showAiDrawer)}
                className="bg-slate-900 text-white p-2 rounded-xl flex items-center justify-center w-10 h-10 transition-all shadow-lg"
                title={showAiDrawer ? t.closeAdvisor : t.connectAdvisor}
                aria-label={showAiDrawer ? t.closeAdvisor : t.connectAdvisor}
              >
                <MessageSquare className="w-5 h-5" />
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
                            alt={p.name}
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

                <button
                  onClick={() => setShowAiDrawer(!showAiDrawer)}
                  className="bg-slate-900 hover:bg-slate-800 text-white p-2 sm:px-4 sm:py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-slate-900/10"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span className="hidden sm:inline text-xs">{showAiDrawer ? t.closeAdvisor : t.connectAdvisor}</span>
                </button>
              </div>
            </div>
          </div>


        </div>
      </header>

      {/* Primary content area container */}
      <main id="primary_tab_viewport" className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full position-relative">
        
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
            lang={lang}
            currencyData={currencyData}
            viewHistory={viewHistory}
            initialCategory="all"
            activeCategory={activeProductCategory}
            onCategoryChange={(categoryId) => navigateToPath(categoryId === "all" ? "/products" : `/products/${categoryId}`, { preserveScroll: false })}
            seoKeywordHints={productSeoHints}
            currentPage={activePageIndex}
            onPageChange={(page) => {
              const categoryPath = activeProductCategory === "all" ? "/products" : `/products/${activeProductCategory}`;
              navigateToPath(page <= 1 ? categoryPath : `${categoryPath}/page/${page}`, { preserveScroll: false });
            }}
          />
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
            onReviewTypeChange={(reviewTypeId) => navigateToPath(reviewTypeId === "single" ? "/reviews" : `/reviews/${reviewTypeId}`, { preserveScroll: true })}
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
            lang={lang}
            currencyData={currencyData}
            activeStandardDimension={activeStandardDimension}
            setActiveStandardDimension={setActiveStandardDimension}
            previousTab={previousTab}
            cmsSettings={cmsSettings}
          />
        )}

        {activeTab === "about" && (
          <AboutSection lang={lang} />
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

      </main>

      {/* FLOAT DRAWER FOR AI ASSISTANT (B2C Friendly) */}
      {showAiDrawer && (
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

            {/* Column 2: Quick Links */}
            <div className="space-y-6">
              <h4 className="text-white font-bold uppercase tracking-widest text-[10px]">
                {lang === "en" ? "Review Categories" : "评测分类"}
              </h4>
              <ul className="space-y-3 font-medium">
                <li 
                  className="hover:text-orange-500 transition-colors cursor-pointer text-slate-400"
                  onClick={() => navigateToPath("/products/balance_bike")}
                >
                  {lang === "en" ? "Balance Bikes" : "平衡车系列"}
                </li>
                <li 
                  className="hover:text-orange-500 transition-colors cursor-pointer text-slate-400"
                  onClick={() => navigateToPath("/products/kids_bikes")}
                >
                  {lang === "en" ? "Pedal Cycles" : "脚踏车系列"}
                </li>
                <li 
                  className="hover:text-orange-500 transition-colors cursor-pointer text-slate-400"
                  onClick={() => navigateToTab("guides")}
                >
                  {lang === "en" ? "Sizing Guide" : "智能选型系统"}
                </li>
              </ul>
            </div>

            {/* Column 3: Policy & Support */}
            <div className="space-y-6">
              <h4 className="text-white font-bold uppercase tracking-widest text-[10px]">
                {lang === "en" ? "Transparency" : "透明度与标准"}
              </h4>
              <ul className="space-y-3 font-medium">
                <li 
                  className="hover:text-orange-500 transition-colors cursor-pointer text-slate-400"
                  onClick={() => {
                    if (lang === "en") {
                      alert("Disclaimer: All score indexes, rim-size suggestions, load ratios are academic biomechanic predictions and do not substitute legal certifications.");
                    } else {
                      alert("【免责声明】KIDSMOBI 所有的分值和轮径、车重警示公式均为客观力学与学术判定推演，不代指法律强制判定。");
                    }
                  }}
                >
                  {lang === "en" ? "Disclaimer" : "免责声明专栏"}
                </li>
                <li 
                  className="hover:text-orange-500 transition-colors cursor-pointer text-slate-400"
                  onClick={() => navigateToTab("about")}
                >
                  {lang === "en" ? "Certification Lab" : "实验室认证说明"}
                </li>
                <li 
                  className="hover:text-orange-500 transition-colors cursor-pointer text-slate-400"
                  onClick={() => navigateToTab("about")}
                >
                  {lang === "en" ? "Privacy Policy" : "隐私与数据政策"}
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
