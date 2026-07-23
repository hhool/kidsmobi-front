import React, { useState, useMemo, useEffect } from "react";
import { 
  Search, 
  Filter, 
  Scale, 
  CheckCircle2, 
  X, 
  Plus, 
  Maximize2, 
  ThumbsUp, 
  Bookmark, 
  BookOpen, 
  Info,
  DollarSign,
  ChevronRight,
  Star,
  ShieldCheck
} from "lucide-react";
import { Product, ProductCategory, CurrencyData } from "../types";
import { translateProduct, translateCategory } from "../lib/translate";
import { formatWeight } from "../lib/units";
import { resolveProductImages } from "../lib/productImages";
import { getProductImageAlt, getProductsPageSeoTitle } from "../lib/productSeoText";
import { getBackendPickerPayload } from "../lib/backendResourceService";
import { cleanVisibleSourceText } from "../lib/visibleText";
import { formatCurrencyFromUsd } from "../lib/currency";
import SmartImage from "./common/SmartImage";
import Breadcrumbs from "./Breadcrumbs";
import ComparisonDashboard from "./ComparisonDashboard";

const PLACEHOLDER_VERDICT_PATTERNS = [
  "pending editorial enrichment",
  "请补充评测",
  "待编辑",
  "needs editorial enrichment",
  "please enrich editorial content before publishing",
];

function isPlaceholderVerdict(value: unknown): boolean {
  const text = String(value || "").trim().toLowerCase();
  if (!text) return true;
  return PLACEHOLDER_VERDICT_PATTERNS.some((pattern) => text.includes(pattern));
}

function pickCustomersSay(product: Product, lang: "zh" | "en"): string {
  const localized = (product as Product & {
    zh?: { customersSay?: string };
    en?: { customersSay?: string };
  })[lang]?.customersSay;
  return compactSnippet(localized || product.customers_say || product.customersSay || "");
}

function isRatingStatsSummary(value: string): boolean {
  const text = compactSnippet(value).toLowerCase();
  if (!text) return true;
  return (
    /^rated\s+\d(?:\.\d+)?\s+out\s+of\s+5\b/.test(text) ||
    /^backed\s+by\s+[\d,]+\s+customer\s+reviews\b/.test(text) ||
    /^\d(?:\.\d+)?\s+\d(?:\.\d+)?\s+out\s+of\s+5\s+stars\b/.test(text) ||
    /^\(?[\d,]+\)?\s+customer\s+reviews\b/.test(text)
  );
}

function hasRealCustomersSay(product: Product, lang: "zh" | "en"): boolean {
  const customerSay = pickCustomersSay(product, lang);
  if (!customerSay || isRatingStatsSummary(customerSay)) return false;
  return /^Customers find\b/i.test(customerSay);
}

function isCustomerReviewNarrative(value: string): boolean {
  const text = compactSnippet(value);
  if (!text) return false;
  return /^customers find\b/i.test(text) || isRatingStatsSummary(text);
}

function isPlaceholderDescription(value: string): boolean {
  const text = compactSnippet(value).toLowerCase();
  if (!text) return true;
  return (
    /^primary\s+visual\s+asset\s+for\s+.+\s+in\s+[a-z_]+\.?$/i.test(text) ||
    /^backend[-\s]?imported$/i.test(text) ||
    /^backend\s+(runtime|preview|fallback)\b/i.test(text) ||
    text.includes("placeholder description") ||
    text.includes("backend preview item loaded") ||
    text.includes("来自 backend 实时数据") ||
    text.includes("generated from remote fallback")
  );
}

function pickDescriptionFromEvidence(product: Product): string {
  const evidences = Array.isArray(product.scrapedEvidence) ? product.scrapedEvidence : [];
  for (const item of evidences) {
    const source = String(item?.source || "").toLowerCase();
    const text = compactSnippet(String(item?.text || ""));
    if (!text || isPlaceholderDescription(text)) continue;
    if (source.includes("product_description") || source.includes("product description")) {
      return text;
    }
  }
  return "";
}

function pickLocalizedDescription(product: Product, lang: "zh" | "en"): string {
  const localized = (product as Product & {
    description?: string;
    Product_Description?: string;
    product_description?: string;
    productDescription?: string;
    zh?: { description?: string };
    en?: { description?: string };
    categoryId?: string;
    category?: string;
  });

  const localizedDescription = String(localized[lang]?.description || "").trim();
  const rawProductDescription = String(
    localized.Product_Description || localized.product_description || localized.productDescription || ""
  ).trim();
  const defaultDescription = String(localized.description || "").trim();
  const evidenceDescription = pickDescriptionFromEvidence(product);

  const candidates = [
    rawProductDescription,
    isPlaceholderDescription(localizedDescription) ? "" : localizedDescription,
    isPlaceholderDescription(defaultDescription) ? "" : defaultDescription,
    evidenceDescription,
  ].map((item) => compactSnippet(item));

  let baseDesc = candidates.find((item) => item && !isPlaceholderDescription(item) && !isCustomerReviewNarrative(item)) || "";

  // Naturally integrate keywords based on category identification
  const catRaw = String(product.categoryId || product.category || "").toLowerCase();
  if (catRaw === "kids_bikes") {
    if (lang === "zh") {
      if (!baseDesc.includes("toddler bike")) {
        baseDesc = `这款专为幼童研发的专业儿童自行车 toddler bike 采用高强度车架及科学防摔重心设计。 ${baseDesc}`;
      }
    } else {
      if (!baseDesc.toLowerCase().includes("toddler bike")) {
        baseDesc = `This highly certified toddler bike features premium structural geometry and superb braking safety. ${baseDesc}`;
      }
    }
  } else if (catRaw === "balance_bike" || catRaw.includes("balance")) {
    if (lang === "zh") {
      if (!baseDesc.includes("balance bike toddler")) {
        baseDesc = `这台专业婴儿平衡车 balance bike toddler 旨在安全锻炼儿童本体前庭系统和手腿协调力。 ${baseDesc}`;
      }
    } else {
      if (!baseDesc.toLowerCase().includes("balance bike toddler")) {
        baseDesc = `This ergonomic balance bike toddler leverages ultra-lightweight alloys for the ultimate safe learning experience. ${baseDesc}`;
      }
    }
  } else if (catRaw === "stroller") {
    const nameLower = String(product.name || "").toLowerCase();
    const isTwin = nameLower.includes("twin") || nameLower.includes("double") || nameLower.includes("sibling");
    if (isTwin) {
      if (lang === "zh") {
        if (!baseDesc.includes("double twin stroller")) {
          baseDesc = `这款顶级双胞胎双人婴儿车 double twin stroller 的五点式防护设计和全地形减震系统给予两个宝宝全方位的舒适与放心。 ${baseDesc}`;
        }
      } else {
        if (!baseDesc.toLowerCase().includes("double twin stroller")) {
          baseDesc = `This high-performance double twin stroller incorporates state-of-the-art shock absorption and premium responsive seating for families with multiples. ${baseDesc}`;
        }
      }
    }
  } else if (catRaw === "kids_scooters" || catRaw === "scooters" || catRaw.includes("scooter")) {
    const nameLower = String(product.name || "").toLowerCase();
    const isElectric = nameLower.includes("electric") || nameLower.includes("motorized") || nameLower.includes("battery") || nameLower.includes("e-scooter") || nameLower.includes("e-bike") || String(product.id || "").toLowerCase().includes("mx350");
    if (isElectric) {
      if (lang === "zh") {
        if (!baseDesc.includes("kids electric scooter")) {
          baseDesc = `作为一款专业且安全的儿童电动滑板车 kids electric scooter，它配备了母体优先遥控制动及安全限速熔断。 ${baseDesc}`;
        }
      } else {
        if (!baseDesc.toLowerCase().includes("kids electric scooter")) {
          baseDesc = `Engineered as an award-winning kids electric scooter, this model ensures optimal velocity limits and dynamic brake responsiveness. ${baseDesc}`;
        }
      }
    }
  }

  return baseDesc;
}

function compactSnippet(value: string): string {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/[“”]/g, '"')
    .trim();
}

function normalizeSnippetForCompare(value: string): string {
  return compactSnippet(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripRepeatedBrandPrefix(text: string, brand: string): string {
  const brandText = compactSnippet(brand);
  let next = compactSnippet(text);
  if (!brandText) return next;

  const escapedBrand = brandText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const repeatedBrandPattern = new RegExp(`^(?:${escapedBrand}\\s+){1,3}`, "i");
  return next.replace(repeatedBrandPattern, "").trim();
}

function isTitleDuplicateSnippet(value: string, product: Product): boolean {
  const text = normalizeSnippetForCompare(value);
  const name = normalizeSnippetForCompare(product.name);
  const brand = normalizeSnippetForCompare(product.brand);
  if (!text || !name) return true;

  const textWithoutBrand = brand ? text.replace(new RegExp(`^(?:${brand}\\s+){1,3}`), "").trim() : text;
  return (
    text === name ||
    textWithoutBrand === name ||
    name.startsWith(textWithoutBrand) ||
    textWithoutBrand.startsWith(name.slice(0, Math.min(name.length, 80)))
  );
}

function resolveGeneratedCardSummary(product: Product, lang: "zh" | "en"): string {
  const name = normalizeSnippetForCompare(product.name);
  const categoryId = normalizeSnippetForCompare(String((product as Product & { categoryId?: string }).categoryId || product.category || ""));

  if (lang === "zh") {
    if (/airplane|airline|compact|travel/.test(name)) return "适合出行场景的轻便旅行推车，强调紧凑收纳、机场携带与日常快速折叠。";
    if (/car seat|travel system|infant/.test(name)) return "旅行系统套装，兼顾婴儿安全座椅衔接、家庭通勤与新生儿出行便利性。";
    if (/jogger|jogging|runner/.test(name) || categoryId.includes("jogger")) return "面向户外慢跑和公园路面的三轮推车，重点关注稳定性、轮组通过性与推行控制。";
    if (/double|twin/.test(name) || categoryId.includes("double")) return "双座推车方案，适合双胞胎或二孩家庭，重点关注座舱空间与转向稳定性。";
    if (/balance/.test(name) || categoryId.includes("balance")) return "幼儿平衡车入门选择，帮助建立低速控车、转向协调与初期骑行信心。";
    if (/scooter/.test(name) || categoryId.includes("scooter")) return "儿童滑板车方案，适合短途玩耍与平衡训练，重点关注转向反馈和低龄稳定性。";
    if (/car seat/.test(name) || categoryId.includes("car seat")) return "儿童安全座椅选择，重点关注安装兼容性、侧向防护与日常乘车安全。";
    return "基于品类参数与家庭使用场景整理的候选产品，适合进一步比较重量、价格与安全配置。";
  }

  if (/airplane|airline|compact|travel/.test(name)) return "Compact travel stroller for airport trips, fold-friendly storage, and everyday lightweight handling.";
  if (/car seat|travel system|infant/.test(name)) return "Travel system bundle pairing stroller mobility with infant car seat compatibility for daily family trips.";
  if (/jogger|jogging|runner/.test(name) || categoryId.includes("jogger")) return "Jogging stroller option for park paths and active families, focused on stability, wheel control, and smoother pushing.";
  if (/double|twin/.test(name) || categoryId.includes("double")) return "Twin stroller pick for twins or two-child families, balancing cabin space, steering stability, and shared outings.";
  if (/balance/.test(name) || categoryId.includes("balance")) return "Toddler balance bike focused on early confidence, low-speed control, and first-ride coordination.";
  if (/scooter/.test(name) || categoryId.includes("scooter")) return "Kids scooter option for short rides and balance practice, with emphasis on steering feedback and beginner stability.";
  if (/car seat/.test(name) || categoryId.includes("car seat")) return "Child car seat option focused on installation fit, side-impact protection, and everyday passenger safety.";
  return "Curated product candidate for comparing weight, price, safety configuration, and family-use fit.";
}

function isGenericCardSnippet(value: string): boolean {
  const text = compactSnippet(value).toLowerCase();
  if (!text) return true;

  const genericPatterns = [
    "product entry initialized into cms",
    "backend preview item loaded",
    "backend-imported",
    "primary visual asset for",
    "来自 backend 实时数据",
    "generated from remote fallback",
    "independently verified kids stroller or bicycle setup",
    "由后台一键初始化写入 cms",
    "cms 空数据时自动加载",
    "请编辑后保存到 cms",
  ];

  return genericPatterns.some((pattern) => text.includes(pattern));
}

function truncateCardSnippet(value: string, maxLength: number): string {
  const text = compactSnippet(value);
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim();
}

function ensureSummarySentenceEnd(value: string): string {
  const text = compactSnippet(value);
  if (!text) return "";
  if (/[.。！？!?]$/.test(text)) return text;
  return `${text}.`;
}

function stripVisibleFieldLabels(value: string): string {
  return cleanVisibleSourceText(compactSnippet(value))
    .replace(/^(?:editor\s+verdict|auto-generated\s+verdict|自动生成评语)\s*[:：-]\s*/i, "")
    .replace(/\s*\(\s*Features\[\d+\]\s*\)\s*/gi, " ")
    .trim();
}

function resolveCapacityNumeric(product: Product): string {
  const textToSearch = [
    product.name,
    product.description,
    ...(product.features || []),
    Object.values(product.Product_Specifications || {}).join(" ")
  ].join(" ").toLowerCase();

  const matchLbs = textToSearch.match(/(\d+)\s*(?:lbs|lb|pounds)/);
  if (matchLbs) {
    return matchLbs[1];
  }
  const matchKg = textToSearch.match(/(\d+)\s*(?:kg|kilograms)/);
  if (matchKg) {
    const kg = matchKg[1];
    return String(Math.round(parseInt(kg) * 2.2));
  }

  const category = (product.category || "").toLowerCase();
  if (category.includes("wagon") || category.includes("double")) {
    return "150";
  }
  if (category.includes("stroller")) {
    return "50";
  }
  if (category.includes("bike") || category.includes("bicycle")) {
    return "110";
  }
  return "150";
}

function resolveCapacity(product: Product, lang: "zh" | "en"): string {
  const textToSearch = [
    product.name,
    product.description,
    ...(product.features || []),
    Object.values(product.Product_Specifications || {}).join(" ")
  ].join(" ").toLowerCase();

  const matchLbs = textToSearch.match(/(\d+)\s*(?:lbs|lb|pounds)/);
  if (matchLbs) {
    const lbs = matchLbs[1];
    const dutyStr = parseInt(lbs) >= 100 ? "H" : "S";
    return lang === "zh" ? `${lbs} 磅 (${dutyStr})` : `${lbs}# (${dutyStr})`;
  }
  const matchKg = textToSearch.match(/(\d+)\s*(?:kg|kilograms)/);
  if (matchKg) {
    const kg = matchKg[1];
    const lbs = Math.round(parseInt(kg) * 2.2);
    const dutyStr = lbs >= 100 ? "H" : "S";
    return lang === "zh" ? `${lbs} 磅 (${dutyStr})` : `${lbs}# (${dutyStr})`;
  }

  const category = (product.category || "").toLowerCase();
  if (category.includes("wagon") || category.includes("double")) {
    return lang === "zh" ? "150 磅 (H)" : "150# (H)";
  }
  if (category.includes("stroller")) {
    return lang === "zh" ? "50 磅 (S)" : "50# (S)";
  }
  if (category.includes("bike") || category.includes("bicycle")) {
    return lang === "zh" ? "110 磅 (H)" : "110# (H)";
  }
  return lang === "zh" ? "150 磅 (H)" : "150# (H)";
}

function resolveKeyAudit(product: Product, lang: "zh" | "en"): string {
  const textToSearch = [
    product.name,
    product.description,
    ...(product.features || [])
  ].join(" ").toLowerCase();

  const category = (product.category || "").toLowerCase();
  
  if (category.includes("car_seat") || category.includes("safety_seat")) {
    return lang === "zh" ? "侧向防护结构认证" : "SideImpact";
  }
  if (textToSearch.includes("suspension") || textToSearch.includes("all-terrain") || textToSearch.includes("shock")) {
    return lang === "zh" ? "全地形避震稳定" : "AllTerrain";
  }
  if (category.includes("stroller") || category.includes("wagon")) {
    return lang === "zh" ? "全地形安全避震" : "AllTerrain";
  }
  if (category.includes("bike") || category.includes("scooter")) {
    return lang === "zh" ? "低重心控车安全" : "LowCOG";
  }
  return lang === "zh" ? "全地形安全避震" : "AllTerrain";
}

function resolveCardSummary(product: Product, lang: "zh" | "en"): string {
  const description = pickLocalizedDescription(product, lang);
  const customersSay = pickCustomersSay(product, lang);
  const candidates = [description, customersSay]
    .map((item) => compactSnippet(item))
    .map((item) => stripVisibleFieldLabels(item))
    .map((item) => stripRepeatedBrandPrefix(item, product.brand))
    .filter((item) => item && !isRatingStatsSummary(item) && !isPlaceholderVerdict(item) && !isCustomerReviewNarrative(item) && !isGenericCardSnippet(item));

  const summary = candidates[0] || resolveGeneratedCardSummary(product, lang);
  if (!summary) return "";

  return truncateCardSnippet(summary, 480);
}

function resolveCardVerdict(product: Product, lang: "zh" | "en"): string {
  const verdict = String(product.editorVerdict || "").trim();
  const isVerdictPlaceholder = isPlaceholderVerdict(verdict);

  if (!isVerdictPlaceholder && verdict) {
    return verdict;
  }
  
  // Return empty string - no placeholder text for SEO health
  return "";
}

function formatPriceDisplay(price: unknown, currencyData: CurrencyData, lang: "zh" | "en"): string {
  return formatCurrencyFromUsd(price, currencyData, lang);
}

function formatMassDisplay(weight: unknown, countryCode: string, lang: "zh" | "en"): string {
  const numeric = typeof weight === "number" ? weight : Number(weight);
  if (Number.isFinite(numeric) && numeric > 0) {
    return formatWeight(numeric, countryCode);
  }
  return "";
}

interface ProductsSectionProps {
  productsData: Product[];
  onSelectProduct: (p: Product) => void;
  compareList: Product[];
  setCompareList: (list: Product[]) => void;
  savedProducts: Product[];
  setSavedProducts: (list: Product[]) => void;
  childProfile: any;
  userEmail: string;
  isAdmin?: boolean;
  onOpenAdminProductEditor?: (p: Product) => void;
  lang?: "zh" | "en";
  currencyData: CurrencyData;
  viewHistory?: Product[];
  initialCategory?: string;
  activeCategory?: string;
  onCategoryChange?: (categoryId: string) => void;
  seoKeywordHints?: string[];
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onCompareOpen?: (ids: string[]) => void;
}

export default function ProductsSection({
  productsData,
  onSelectProduct,
  compareList,
  setCompareList,
  savedProducts,
  setSavedProducts,
  childProfile,
  userEmail,
  isAdmin = false,
  onOpenAdminProductEditor,
  lang = "zh",
  currencyData,
  viewHistory,
  initialCategory = "all",
  activeCategory,
  onCategoryChange,
  seoKeywordHints = [],
  currentPage = 1,
  onPageChange,
  onCompareOpen
}: ProductsSectionProps) {
  const excludedCategoryIds = new Set([
    "playard",
    "high_chair",
    "kids_push_ride_ons",
    "kids_pull_along_wagons",
    "baby_carrier",
  ]);
  const hiddenCategoryOptionIds = new Set(["kids_tricycles", "double_stroller", "jogger_stroller"]);
  const preferredVisibleCategoryIds = [
    "stroller",
    "balance_bike",
    "kids_bikes",
    "kids_scooters",
    "electric_vehicles",
    "car_seat",
  ];

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || "all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("overallScore");
  const [showCompareDrawer, setShowCompareDrawer] = useState<boolean>(false);
  
  // Extra filters for PRD compliance
  const [selectedAge, setSelectedAge] = useState<string>("all"); // 'all', 'baby', 'toddler', 'child'
  const [selectedPrice, setSelectedPrice] = useState<string>("all"); // 'all', 'budget', 'mid', 'premium'
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [selectedFrameMaterial, setSelectedFrameMaterial] = useState<string>("all");
  const [selectedTireType, setSelectedTireType] = useState<string>("all");
  const [selectedBrakeSystem, setSelectedBrakeSystem] = useState<string>("all");
  const [selectedWheelSize, setSelectedWheelSize] = useState<string>("all");
  const [selectedCertification, setSelectedCertification] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<"all" | "twin">("all");
  const [selectedPower, setSelectedPower] = useState<string>("all"); // 'all', 'electric'
  const [backendCategoryNameMap, setBackendCategoryNameMap] = useState<Record<string, string>>({});
  const [hintFlash, setHintFlash] = useState<string | null>(null);
  const [saveTip, setSaveTip] = useState<string | null>(null);
  const [pendingCategoryConflict, setPendingCategoryConflict] = useState<{
    product: Product;
    currentCategoryLabel: string;
    newCategoryLabel: string;
  } | null>(null);
  const categoryAliasMap: Record<string, string> = {
    scooters: "kids_scooters",
    scooter: "kids_scooters",
    balance: "balance_bike",
    "balance bike": "balance_bike",
    bicycle: "kids_bikes",
    tricycle: "kids_tricycles",
    electric_car: "electric_vehicles",
    safety_seat: "car_seat",
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

    if (hasCarSeatSignal && !hasStrollerSignal) return "car_seat";
    if (hasHighChairSignal && !hasStrollerSignal) return "high_chair";
    if (hasPlayardSignal && !hasStrollerSignal) return "playard";
    if (hasCarrierSignal && !hasStrollerSignal) return "baby_carrier";

    return normalizedCategoryId;
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const payload = await getBackendPickerPayload({ includeAll: true });
        if (!mounted) return;
        const nextMap: Record<string, string> = {};
        for (const item of payload.categories || []) {
          const key = String(item.categoryId || "").trim().toLowerCase();
          const name = String(item.name || "").trim();
          if (key && name) {
            nextMap[key] = name;
          }
        }
        setBackendCategoryNameMap(nextMap);
      } catch {
        if (!mounted) return;
        setBackendCategoryNameMap({});
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (activeCategory && activeCategory !== selectedCategory) {
      setSelectedCategory(activeCategory);
    }
  }, [activeCategory, selectedCategory]);

  useEffect(() => {
    if (localStorage.getItem("scrollToExpertPicks") === "true") {
      localStorage.removeItem("scrollToExpertPicks");
      setTimeout(() => {
        const element = document.getElementById("expert-picks-anchor");
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 150);
    }
  }, [selectedCategory]);

  useEffect(() => {
    setSelectedBrand("all");
    setSelectedFrameMaterial("all");
    setSelectedTireType("all");
    setSelectedBrakeSystem("all");
    setSelectedWheelSize("all");
    setSelectedCertification("all");

    // Dynamic router-level parsing for search parameters
    const params = new URLSearchParams(window.location.search);
    const age = params.get("age");
    const type = params.get("type");
    const size = params.get("size");
    const power = params.get("power");

    if (age) {
      setSelectedAge(age);
    } else {
      setSelectedAge("all");
    }

    if (type === "twin") {
      setSelectedType(type);
    } else {
      setSelectedType("all");
    }

    if (size) {
      if (size === "12-inch" || size === "12") {
        setSelectedWheelSize("12 Inch");
      } else {
        setSelectedWheelSize(size);
      }
    } else {
      setSelectedWheelSize("all");
    }

    if (power) {
      setSelectedPower(power);
    } else {
      setSelectedPower("all");
    }
  }, [selectedCategory, window.location.search]);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    onCategoryChange?.(categoryId);
  };

  const getProductCategoryId = (product: Product): string => {
    const raw = String((product as any)?.categoryId || product?.category || "").trim().toLowerCase();
    const normalized = categoryAliasMap[raw] || raw;
    return inferMisclassifiedCategoryId(product, normalized);
  };

  const humanizeCategoryId = (rawCategoryId: string): string => {
    const normalized = rawCategoryId.trim().toLowerCase();
    if (!normalized) return rawCategoryId;
    const normalizedKey = normalized.replace(/[\s-]+/g, "_");

    if (lang === "en") {
      const englishDisplayMap: Record<string, string> = {
        balance: "Balance Bike",
        balance_bike: "Balance Bike",
        balance_bikes: "Balance Bike",
        car_seat: "Kids Car Seat",
        car_seats: "Kids Car Seat",
        safety_seat: "Kids Car Seat",
        stroller: "Kids Stroller",
        strollers: "Kids Stroller",
        double_stroller: "Twin Stroller",
        double_strollers: "Twin Stroller",
        jogger_stroller: "Jogging Stroller",
        jogger_strollers: "Jogging Stroller",
        electric_vehicles: "Kids Electric Car",
        electric_car: "Kids Electric Car",
        kids_scooters: "Kids Scooter",
        scooters: "Kids Scooter",
      };
      if (englishDisplayMap[normalized]) {
        return englishDisplayMap[normalized];
      }
      if (englishDisplayMap[normalizedKey]) {
        return englishDisplayMap[normalizedKey];
      }
    }

    if (backendCategoryNameMap[normalized]) {
      return backendCategoryNameMap[normalized];
    }

    const fallbackMap: Record<string, string> = {
      balance: "Balance Bike",
      bicycle: "Pedal Bike",
      scooter: "Kick Scooter",
      stroller: "Kids Stroller",
      electric_car: "Kids Electric Car",
      tricycle: "Tricycle",
      safety_seat: "Kids Car Seat",
      kids_tricycles: "Kids Tricycle",
      kids_bikes: "Kids Bike",
      balance_bike: "Balance Bike",
      car_seat: "Kids Car Seat",
      electric_vehicles: "Kids Electric Car",
      kids_scooters: "Kids Scooter",
      scooters: "Kids Scooter",
    };
    if (fallbackMap[normalized]) {
      return fallbackMap[normalized];
    }

    return normalized
      .split("_")
      .filter(Boolean)
      .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
      .join(" ");
  };

  const parseAgeRangeYears = (ageRange: string): { min: number; max: number } | null => {
    const text = String(ageRange || "").toLowerCase().trim();
    if (!text) return null;

    const matches = Array.from(text.matchAll(/(\d+(?:\.\d+)?)\s*(m|mo|mos|month|months|月|y|yr|yrs|year|years|岁)?/g));
    if (!matches.length) return null;

    const years = matches
      .map((match) => {
        const value = Number(match[1]);
        if (!Number.isFinite(value)) return Number.NaN;
        const unit = (match[2] || "").toLowerCase();
        if (unit === "m" || unit === "mo" || unit === "mos" || unit === "month" || unit === "months" || unit === "月") {
          return value / 12;
        }
        return value;
      })
      .filter((value) => Number.isFinite(value));

    if (!years.length) return null;

    const plusStyle = text.includes("+") || text.includes("up") || text.includes("以上");
    if (plusStyle) {
      return { min: years[0], max: Number.POSITIVE_INFINITY };
    }

    const min = Math.min(...years);
    const max = Math.max(...years);
    return { min, max };
  };

  const intersectsAgeBucket = (range: { min: number; max: number } | null, bucket: "baby" | "toddler" | "child") => {
    if (!range) {
      return true;
    }

    if (bucket === "baby") {
      return range.min < 2;
    }
    if (bucket === "toddler") {
      return range.max >= 2 && range.min <= 5;
    }
    return range.max >= 5;
  };

  const categories = useMemo(() => {
    const allLabel = lang === "en" ? "📁 All Products" : "📁 全部产品";
    const idSet = new Set<string>();

    for (const id of preferredVisibleCategoryIds) {
      if (!excludedCategoryIds.has(id) && !hiddenCategoryOptionIds.has(id)) {
        idSet.add(id);
      }
    }

    for (const item of productsData) {
      const id = getProductCategoryId(item);
      if (id && !excludedCategoryIds.has(id) && !hiddenCategoryOptionIds.has(id)) {
        idSet.add(id);
      }
    }

    const preferredOrder = new Map(preferredVisibleCategoryIds.map((id, index) => [id, index]));
    const ids = Array.from(idSet.values());
    ids.sort((a, b) => {
      const orderA = preferredOrder.has(a) ? preferredOrder.get(a)! : Number.MAX_SAFE_INTEGER;
      const orderB = preferredOrder.has(b) ? preferredOrder.get(b)! : Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) return orderA - orderB;
      return humanizeCategoryId(a).localeCompare(humanizeCategoryId(b));
    });

    return [
      { id: "all", label: allLabel },
      ...ids.map((id) => ({ id, label: humanizeCategoryId(id) })),
    ];
  }, [productsData, lang, backendCategoryNameMap]);

  const getCategoryLabel = (categoryId: string, categoryCode: ProductCategory) => {
    const fromCategoryId = humanizeCategoryId(categoryId);
    const label = fromCategoryId && fromCategoryId !== categoryId
      ? fromCategoryId
      : translateCategory(categoryCode, lang);

    if (lang !== "en") return label;
    const singularMap: Record<string, string> = {
      "Strollers": "Stroller",
      "Double Strollers": "Twin Stroller",
      "Jogger Strollers": "Jogger Stroller",
      "Balance Bikes": "Balance Bike",
      "Kids Bikes": "Kids Bike",
      "Kids Scooters": "Kids Scooter",
      "Kids Tricycles": "Kids Tricycle",
      "Electric Vehicles": "Kids Electric Car",
      "Kids Electric Vehicles": "Kids Electric Car",
      "Kids Electric Vehicle": "Kids Electric Car",
      "Car Seats": "Car Seat",
      "Kids Car Seats": "Kids Car Seat",
      "Push Ride Ons": "Push Ride On",
      "Pull Along Wagons": "Pull Along Wagon",
      "Kids Pull Along Wagons": "Kids Pull Along Wagon",
      "Kids Push Ride Ons": "Kids Push Ride On",
    };
    return singularMap[label] || label;
  };

  const getCategoryPriority = (categoryId: string) => {
    const normalized = String(categoryId || "").trim().toLowerCase();
    if (normalized.includes("stroller")) return 0;
    if (normalized.includes("balance")) return 1;
    return 2;
  };

  const getAllProductsIntentPriority = (categoryId: string, product: Product) => {
    const normalizedCategory = String(categoryId || "").trim().toLowerCase();
    const text = [product.name, product.editorVerdict, product.brand]
      .map((item) => String(item || "").toLowerCase())
      .join(" ");

    const isStroller = normalizedCategory.includes("stroller");
    const isBalanceBike = normalizedCategory.includes("balance");

    const travelSignals = ["travel stroller", "lightweight stroller", "umbrella stroller", "compact stroller", "cabin", "portable", "travel", "lightweight", "umbrella", "轻便", "旅行", "便携"];
    const heavySignals = ["jogger", "jogging", "double twin stroller", "double", "twin stroller", "twin", "双人", "慢跑"];

    const hasTravelSignal = travelSignals.some((kw) => text.includes(kw));
    const hasHeavySignal = heavySignals.some((kw) => text.includes(kw));

    if (isStroller && hasTravelSignal && !hasHeavySignal) return 0;
    if (isBalanceBike) return 1;
    if (isStroller && !hasHeavySignal) return 2;
    if (isStroller && hasHeavySignal) return 4;
    return 3;
  };

  const isTravelStrollerCandidate = (categoryId: string, product: Product) => {
    const normalizedCategory = String(categoryId || "").trim().toLowerCase();
    if (!normalizedCategory.includes("stroller")) {
      return false;
    }

    const text = [product.name, product.editorVerdict, product.brand]
      .map((item) => String(item || "").toLowerCase())
      .join(" ");
    const travelSignals = ["travel stroller", "lightweight stroller", "umbrella stroller", "compact stroller", "cabin", "portable", "travel", "lightweight", "umbrella", "轻便", "旅行", "便携"];
    const heavySignals = ["jogger", "jogging", "double twin stroller", "double", "twin stroller", "twin", "双人", "慢跑"];

    const hasTravelSignal = travelSignals.some((kw) => text.includes(kw));
    const hasHeavySignal = heavySignals.some((kw) => text.includes(kw));
    return hasTravelSignal && !hasHeavySignal;
  };

  const isBalanceBikeCandidate = (categoryId: string, product: Product) => {
    const normalizedCategory = String(categoryId || "").trim().toLowerCase();
    if (normalizedCategory.includes("balance")) {
      return true;
    }

    const text = [product.name, product.editorVerdict, product.brand]
      .map((item) => String(item || "").toLowerCase())
      .join(" ");
    return text.includes("balance bike") || text.includes("平衡车");
  };

  const rebalanceFirstPageIntentMix = (
    sortedItems: Array<{ sourceCategoryId: string; sourceProduct: Product; product: Product }>,
    firstPageSize: number
  ) => {
    if (sortedItems.length <= 1) {
      return sortedItems;
    }

    const travelCandidates = sortedItems.filter((item) =>
      isTravelStrollerCandidate(item.sourceCategoryId, item.product)
    );
    const balanceCandidates = sortedItems.filter((item) =>
      isBalanceBikeCandidate(item.sourceCategoryId, item.product)
    );
    const otherCandidates = sortedItems.filter(
      (item) =>
        !isTravelStrollerCandidate(item.sourceCategoryId, item.product) &&
        !isBalanceBikeCandidate(item.sourceCategoryId, item.product)
    );

    const targetTravel = Math.ceil(firstPageSize / 2);
    const targetBalance = Math.floor(firstPageSize / 2);

    const firstPageTravel = travelCandidates.slice(0, targetTravel);
    const firstPageBalance = balanceCandidates.slice(0, targetBalance);
    let firstPage = [...firstPageTravel, ...firstPageBalance];

    if (firstPage.length < firstPageSize) {
      const travelOverflow = travelCandidates.slice(firstPageTravel.length);
      const balanceOverflow = balanceCandidates.slice(firstPageBalance.length);
      const refillPool = [...travelOverflow, ...balanceOverflow, ...otherCandidates];
      firstPage = [...firstPage, ...refillPool.slice(0, firstPageSize - firstPage.length)];
    }

    const firstPageIdSet = new Set(firstPage.map((item) => item.product.id));
    const rest = sortedItems.filter((item) => !firstPageIdSet.has(item.product.id));
    return [...firstPage, ...rest];
  };

  const rebalanceFirstPageAllPillMix = (
    sortedItems: Array<{ sourceCategoryId: string; sourceProduct: Product; product: Product }>,
    firstPageSize: number
  ) => {
    if (sortedItems.length <= 1) {
      return sortedItems;
    }

    const toddlerBikePool = sortedItems.filter((item) => {
      return item.sourceCategoryId === "kids_bikes";
    });

    const balanceToddlerPool = sortedItems.filter((item) => {
      return item.sourceCategoryId === "balance_bike" || String(item.product.category || "").toLowerCase().includes("balance");
    });

    const twinStrollerPool = sortedItems.filter((item) => {
      const isStroller = item.sourceCategoryId === "stroller" || String(item.product.category || "").toLowerCase().includes("stroller");
      const nameLower = item.product.name.toLowerCase();
      const isTwin = nameLower.includes("twin") || nameLower.includes("double") || nameLower.includes("sibling");
      return isStroller && isTwin;
    });

    const kidsElectricScooterPool = sortedItems.filter((item) => {
      const nameLower = item.product.name.toLowerCase();
      const isScooter = item.sourceCategoryId === "kids_scooters" || item.sourceCategoryId === "scooters";
      const isElectric = nameLower.includes("electric") || nameLower.includes("motorized") || nameLower.includes("battery") || nameLower.includes("e-scooter") || nameLower.includes("e-bike") || item.product.id.toLowerCase().includes("mx350");
      return isScooter && isElectric;
    });

    const selectedToddlerBike = toddlerBikePool.slice(0, 8);
    const selectedBalance = balanceToddlerPool.slice(0, 8);
    const selectedTwin = twinStrollerPool.slice(0, 8);
    const selectedElectricScooter = kidsElectricScooterPool.slice(0, 8);

    // Dynamic interleaved list to keep variety engaging
    let firstPage: Array<{ sourceCategoryId: string; sourceProduct: Product; product: Product }> = [];
    for (let i = 0; i < 8; i++) {
      if (selectedToddlerBike[i]) firstPage.push(selectedToddlerBike[i]);
      if (selectedBalance[i]) firstPage.push(selectedBalance[i]);
      if (selectedTwin[i]) firstPage.push(selectedTwin[i]);
      if (selectedElectricScooter[i]) firstPage.push(selectedElectricScooter[i]);
    }

    const selectedIds = new Set(firstPage.map((item) => item.product.id));
    if (firstPage.length < 32) {
      const refillPool = sortedItems.filter((item) => !selectedIds.has(item.product.id));
      firstPage = [...firstPage, ...refillPool.slice(0, 32 - firstPage.length)];
    } else {
      // Crop exactly at 32 items
      firstPage = firstPage.slice(0, 32);
    }

    const finalPageIdSet = new Set(firstPage.map((item) => item.product.id));
    const rest = sortedItems.filter((item) => !finalPageIdSet.has(item.product.id));
    return [...firstPage, ...rest];
  };

  const normalizeFacetValue = (value?: string) => {
    const text = String(value || "").trim();
    if (!text) return "Unknown";
    return text;
  };

  const normalizeFacetList = (values: Array<string | undefined>) => {
    return Array.from(
      new Set(
        values
          .map((value) => normalizeFacetValue(value))
          .filter((value) => value && value.toLowerCase() !== "unknown")
      )
    ).sort((a, b) => a.localeCompare(b));
  };

  const matchesKidsScootersBoundary = (sourceProduct: Product, translatedProduct: Product) => {
    const text = [
      sourceProduct.name,
      sourceProduct.editorVerdict,
      translatedProduct.name,
      translatedProduct.editorVerdict,
    ]
      .map((item) => String(item || "").toLowerCase())
      .join(" ");

    const required = ["scooter", "kick scooter", "滑板车"];
    const blocked = [
      "stroller",
      "travel system",
      "pram",
      "umbrella stroller",
      "car seat",
      "推车",
      "婴儿车",
      "安全座椅",
    ];

    const hasRequired = required.some((kw) => text.includes(kw));
    const hasBlocked = blocked.some((kw) => text.includes(kw));
    return hasRequired && !hasBlocked;
  };

  const selectedCategoryProducts = useMemo<Product[]>(() => {
    if (!selectedCategory || selectedCategory === "all") {
      return [] as Product[];
    }
    return productsData
      .map((item) => ({
        categoryId: getProductCategoryId(item),
        product: translateProduct(item, lang),
      }))
      .filter(({ categoryId }) => categoryId === selectedCategory)
      .map(({ product }) => product);
  }, [productsData, lang, selectedCategory]);

  const categoryFilterOptions = useMemo(() => {
    const brands = normalizeFacetList(selectedCategoryProducts.map((item: Product) => item.brand));
    const frameMaterials = normalizeFacetList(selectedCategoryProducts.map((item: Product) => item.material));
    const tireTypes = normalizeFacetList(selectedCategoryProducts.map((item: Product) => item.tireType));
    const brakeSystems = normalizeFacetList(selectedCategoryProducts.map((item: Product) => item.brakeType));
    const wheelSizes = normalizeFacetList(selectedCategoryProducts.map((item: Product) => item.wheelSize));
    const certifications = normalizeFacetList(
      selectedCategoryProducts.flatMap((item: Product) => item.compliance || [])
    );
    return { brands, frameMaterials, tireTypes, brakeSystems, wheelSizes, certifications };
  }, [selectedCategoryProducts]);

  const categoryBaseCount = useMemo(() => {
    return productsData
      .map((sourceProduct) => ({
        sourceCategoryId: getProductCategoryId(sourceProduct),
        sourceProduct,
        translatedProduct: translateProduct(sourceProduct, lang),
      }))
      .filter(({ sourceCategoryId, sourceProduct, translatedProduct }) => {
        if (excludedCategoryIds.has(sourceCategoryId)) {
          return false;
        }
        const matchesCategory = selectedCategory === "all" || sourceCategoryId === selectedCategory;
        const matchesScooterBoundary =
          selectedCategory !== "kids_scooters" || matchesKidsScootersBoundary(sourceProduct, translatedProduct);
        return matchesCategory && matchesScooterBoundary;
      }).length;
  }, [productsData, lang, selectedCategory]);

  const getSeoHintTarget = (hint: string) => {
    const normalized = hint.trim().toLowerCase();
    const hintMap: Record<string, string> = {
      stroller: "stroller",
      strollers: "stroller",
      "kids strollers": "stroller",
      "kids stroller": "stroller",
      "婴儿车": "stroller",
      "婴儿推车": "stroller",
      "stroller travel stroller": "stroller",
      "travel stroller": "stroller",
      "travel strollers": "stroller",
      "traval strollers": "stroller",
      "lightweight strollers": "stroller",
      "leightweight strollers": "stroller",
      "jogging stroller": "jogger_stroller",
      "jogging stroller stroller": "jogger_stroller",
      "jogger stroller": "jogger_stroller",
      "jogger strollers": "jogger_stroller",
      "jogger strolles": "jogger_stroller",
      "twin stroller": "double_stroller",
      "side by side twin stroller": "double_stroller",
      "twin stroller for travel": "double_stroller",
      "stroller jogging twin": "double_stroller",
      "twin strollers": "double_stroller",
      "balance bike": "balance_bike",
      "balance bike toddler": "balance_bike",
      "balance bikes": "balance_bike",
      "平衡车": "balance_bike",
      "kids bike": "kids_bikes",
      "kids bikes": "kids_bikes",
      "toddler bike": "kids_bikes",
      "儿童自行车": "kids_bikes",
      "kids scooter": "kids_scooters",
      "kids scooters": "kids_scooters",
      "toddler scooter": "kids_scooters",
      "kids electric scooter": "kids_scooters",
      "electric scooter for kids": "kids_scooters",
      "electric scooters for kids": "kids_scooters",
      "electric scooter with seat": "kids_scooters",
      "foldable electric scooter": "kids_scooters",
      "childs e scooter": "kids_scooters",
      "儿童滑板车": "scooters",
      "electric vehicles": "electric_vehicles",
      "electric vehicle": "electric_vehicles",
      "kids electric vehicles": "electric_vehicles",
      "kids electric bike": "electric_vehicles",
      "electric bike for kids": "electric_vehicles",
      "electric dirt bike for kids": "electric_vehicles",
      "kids dirt bike": "electric_vehicles",
      "kids electric vehicle": "electric_vehicles",
      "car seats": "car_seat",
      "car seat": "car_seat",
      "儿童电动车": "electric_vehicles",
    };

    return hintMap[normalized] || hintMap[hint] || null;
  };

  // Filtering and sorting math
  const filteredProducts = useMemo(() => {
    const sortedItems = productsData
      .map((sourceProduct) => ({
        sourceCategoryId: getProductCategoryId(sourceProduct),
        sourceProduct,
        product: translateProduct(sourceProduct, lang),
      }))
      .filter(({ product: p, sourceCategoryId, sourceProduct }) => {
        if (excludedCategoryIds.has(sourceCategoryId)) {
          return false;
        }
        const matchesCategory = selectedCategory === "all" || sourceCategoryId === selectedCategory;
        const matchesSearch = searchQuery.trim() === "" ||
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.material.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.tireType || "").toLowerCase().includes(searchQuery.toLowerCase());
          
        let matchesAge = true;
        if (selectedAge !== "all") {
            const ageRange = parseAgeRangeYears(p.ageRange);
            if (selectedAge === "baby" || selectedAge === "toddler" || selectedAge === "child") {
             matchesAge = intersectsAgeBucket(ageRange, selectedAge);
            }
        }

        let matchesPrice = true;
        if (selectedPrice !== "all") {
           if (selectedPrice === "budget") matchesPrice = p.price < 500;
           else if (selectedPrice === "mid") matchesPrice = p.price >= 500 && p.price < 2000;
           else if (selectedPrice === "premium") matchesPrice = p.price >= 2000;
        }

        let matchesType = true;
        if (selectedType === "twin") {
          matchesType = p.name.toLowerCase().includes("twin") || p.name.toLowerCase().includes("double") || p.name.toLowerCase().includes("sibling");
        }

        let matchesPower = true;
        if (selectedPower === "electric") {
          matchesPower = p.name.toLowerCase().includes("electric") || p.name.toLowerCase().includes("motorized") || p.name.toLowerCase().includes("battery") || p.name.toLowerCase().includes("e-scooter") || p.name.toLowerCase().includes("e-bike") || p.id.toLowerCase().includes("mx350");
        }

        const needsCategoryFacetFilter = selectedCategory !== "all";
        const matchesBrand = !needsCategoryFacetFilter || selectedBrand === "all" || normalizeFacetValue(p.brand) === selectedBrand;
        const matchesFrameMaterial = !needsCategoryFacetFilter || selectedFrameMaterial === "all" || normalizeFacetValue(p.material) === selectedFrameMaterial;
        const matchesTireType = !needsCategoryFacetFilter || selectedTireType === "all" || normalizeFacetValue(p.tireType) === selectedTireType;
        const matchesBrakeSystem = !needsCategoryFacetFilter || selectedBrakeSystem === "all" || normalizeFacetValue(p.brakeType) === selectedBrakeSystem;
        let matchesWheelSize = true;
        if (needsCategoryFacetFilter && selectedWheelSize !== "all") {
          const valStr = normalizeFacetValue(p.wheelSize).toLowerCase();
          const targetStr = selectedWheelSize.toLowerCase();
          if (targetStr === "12" || targetStr === "12-inch" || targetStr === "12inch" || targetStr.includes("12")) {
            matchesWheelSize = valStr.includes("12");
          } else {
            matchesWheelSize = valStr === targetStr || valStr.includes(targetStr);
          }
        }

        const matchesCertification =
          !needsCategoryFacetFilter ||
          selectedCertification === "all" ||
          (p.compliance || []).map((item: string) => normalizeFacetValue(item)).includes(selectedCertification);

        const matchesScooterBoundary =
          selectedCategory !== "kids_scooters" || matchesKidsScootersBoundary(sourceProduct, p);

        return (
          matchesCategory &&
          matchesSearch &&
          matchesAge &&
          matchesPrice &&
          matchesBrand &&
          matchesFrameMaterial &&
          matchesTireType &&
          matchesBrakeSystem &&
          matchesWheelSize &&
          matchesCertification &&
          matchesScooterBoundary &&
          matchesType &&
          matchesPower
        );
      })
      .sort((a, b) => {
        const left = a.product;
        const right = b.product;

        const useIntentPriority = selectedCategory === "all" && sortBy === "overallScore";
        const priorityDelta = useIntentPriority
          ? getAllProductsIntentPriority(a.sourceCategoryId, left) - getAllProductsIntentPriority(b.sourceCategoryId, right)
          : getCategoryPriority(a.sourceCategoryId) - getCategoryPriority(b.sourceCategoryId);

        if (sortBy === "overallScore") {
          if (priorityDelta !== 0) return priorityDelta;
          const customerSayDelta = Number(hasRealCustomersSay(right, lang)) - Number(hasRealCustomersSay(left, lang));
          if (customerSayDelta !== 0) return customerSayDelta;
          return right.overallScore - left.overallScore;
        }
        if (sortBy === "weightAsc") {
          if (priorityDelta !== 0) return priorityDelta;
          return left.weight - right.weight;
        }
        if (sortBy === "priceDesc") {
          if (priorityDelta !== 0) return priorityDelta;
          return right.price - left.price;
        }
        if (sortBy === "priceAsc") {
          if (priorityDelta !== 0) return priorityDelta;
          return left.price - right.price;
        }
        return 0;
      });

    const useIntentPriority = selectedCategory === "all" && sortBy === "overallScore";
    if (useIntentPriority) {
      const isDefaultState = searchQuery.trim() === "" &&
        selectedAge === "all" &&
        selectedPrice === "all" &&
        selectedBrand === "all" &&
        selectedFrameMaterial === "all" &&
        selectedTireType === "all" &&
        selectedBrakeSystem === "all" &&
        selectedWheelSize === "all" &&
        selectedCertification === "all";

      if (isDefaultState) {
        return rebalanceFirstPageAllPillMix(sortedItems, 32);
      }
      return rebalanceFirstPageIntentMix(sortedItems, 32);
    }
    return sortedItems;
  }, [
    selectedCategory,
    searchQuery,
    sortBy,
    selectedAge,
    selectedPrice,
    selectedBrand,
    selectedFrameMaterial,
    selectedTireType,
    selectedBrakeSystem,
    selectedWheelSize,
    selectedCertification,
    productsData,
    lang,
    backendCategoryNameMap,
  ]);

  const pageSize = selectedCategory === "all" ? 32 : 9;
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const pagedProducts = filteredProducts.slice((safePage - 1) * pageSize, safePage * pageSize);
  const productsSeoPillTags = [
    { label: "BALANCE BIKE TODDLER", target: "balance_bike" },
    { label: "TWIN STROLLER", target: "stroller" },
    { label: "TODDLER BIKE", target: "kids_bikes" },
    { label: "KIDS ELECTRIC SCOOTER", target: "kids_scooters" },
  ];

  // Compare toggles (allows up to 4 items!)
  const handleToggleCompare = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    const exists = compareList.find(p => p.id === product.id);
    let newList: Product[] = [];
    if (exists) {
      newList = compareList.filter(p => p.id !== product.id);
    } else {
      // 1. Cross-category validation check
      if (compareList.length > 0) {
        const baseProduct = compareList[0];
        const baseCategoryId = getProductCategoryId(baseProduct);
        const thisCategoryId = getProductCategoryId(product);
        if (baseCategoryId !== thisCategoryId) {
          const currentCategoryLabel = getCategoryLabel(baseCategoryId, baseProduct.category);
          const newCategoryLabel = getCategoryLabel(thisCategoryId, product.category);
          setPendingCategoryConflict({
            product,
            currentCategoryLabel,
            newCategoryLabel,
          });
          return;
        }
      }

      // 2. Max limits warning toast
      if (compareList.length >= 4) {
        showSaveTip(
          lang === "en" 
            ? "Limit reached: You can compare up to 4 models. Please remove one first." 
            : "【对比上限提醒】最多只能同时对比 4 款，请先在下方移除一个。"
        );
        return;
      }
      newList = [...compareList, product];
    }
    setCompareList(newList);
  };

  const showSaveTip = (message: string) => {
    setSaveTip(message);
    window.setTimeout(() => {
      setSaveTip((current: string | null) => (current === message ? null : current));
    }, 3000);
  };

  // Saved / Bookmark toggles
  const handleToggleSave = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userEmail) {
      showSaveTip(lang === "en" ? "Log in to save products." : "请先注册/登录后收藏产品。");
      return;
    }

    const alreadySaved = savedProducts.some(s => s.id === product.id);
    if (alreadySaved) {
      setSavedProducts(savedProducts.filter(s => s.id !== product.id));
      showSaveTip(lang === "en" ? "Removed from saved list." : "已从收藏列表移除。");
    } else {
      setSavedProducts([...savedProducts, product]);
      showSaveTip(lang === "en" ? "Saved. View it in your member center." : "已收藏，可在会员中心查看。");
    }
  };

  return (
    <div id="product_library" className="space-y-8 animate-fade-in text-left">
      {/* Breadcrumbs (PRD 4.2.2) */}
      {(() => {
        const items: { label: string; active: boolean; onClick?: () => void }[] = [
          {
            label: lang === "zh" ? "产品列表" : "PRODUCTS",
            active: selectedCategory === "all",
            onClick: () => handleCategorySelect("all"),
          },
        ];
        if (selectedCategory && selectedCategory !== "all") {
          items.push({
            label: humanizeCategoryId(selectedCategory),
            active: true,
          });
        }
        return (
          <Breadcrumbs
            lang={lang}
            onHomeClick={() => (window as any).setActiveTab?.("home")}
            items={items}
          />
        );
      })()}

      {/* Compact Atmospheric Title Description Block (PRD 4.2.1) */}
      <section className="relative rounded-[32px] bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white overflow-hidden p-8 md:p-12 text-left max-w-7xl mx-auto shadow-xl space-y-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(249,115,22,0.15),transparent)]"></div>
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-widest rounded-full shadow-inner font-mono">
            ★ OFFICIAL MOBILITY BASELINE DATABASE
          </div>

          <h1 className="text-xl md:text-2xl font-black tracking-tight leading-tight max-w-5xl">
            {lang === "zh"
              ? "专家产品中心：儿童自行车、双胞胎双人推车及儿童电动车"
              : "Expert Product Hub: Kids' Bike, Twin Stroller & Kids Electric Scooter"}
          </h1>

          <div className="border-l-2 border-orange-500 pl-4 space-y-2">
            <p className="text-slate-300 text-xs md:text-sm font-semibold max-w-5xl leading-relaxed italic">
              {lang === "zh"
                ? "经过独立实验室物理安全检测的儿童自行车、平衡车、双胞胎双人手推车及儿童电动滑板车的科学测评数据整合模型。"
                : "Independent lab-tested evaluations for toddler bike, balance bike, twin stroller, and kids electric scooter."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/60">
            {productsSeoPillTags.map((pill) => (
              <button
                key={pill.label}
                type="button"
                onClick={() => {
                  setHintFlash(null);
                  window.requestAnimationFrame(() => setHintFlash(pill.label));
                  window.setTimeout(() => setHintFlash((current) => (current === pill.label ? null : current)), 300);
                  
                  let targetPath = `/products/${pill.target}`;
                  let searchString = "";
                  if (pill.label === "BALANCE BIKE TODDLER") {
                    searchString = "?age=toddler";
                  } else if (pill.label === "TWIN STROLLER") {
                    searchString = "?type=twin";
                  } else if (pill.label === "TODDLER BIKE") {
                    searchString = "?age=toddler";
                  } else if (pill.label === "KIDS ELECTRIC SCOOTER") {
                    searchString = "?power=electric";
                  }

                  // Force routing transition inside SPA context
                  window.history.pushState(null, "", `${targetPath}${searchString}`);
                  window.dispatchEvent(new PopStateEvent("popstate"));

                  // Scroll smoothly to ## Expert Product Picks list
                  setTimeout(() => {
                    const element = document.getElementById("expert-picks-anchor");
                    if (element) {
                      element.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                  }, 100);
                }}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black tracking-wider uppercase shadow-sm cursor-pointer group transition-all duration-300 border ${
                  hintFlash === pill.label
                    ? "bg-orange-500 text-white border-orange-500 scale-105"
                    : pill.target === selectedCategory
                      ? "border-orange-500/20 text-orange-400 bg-orange-500/5"
                      : "bg-slate-800/40 border-slate-700/60 text-slate-300 hover:border-slate-500 hover:text-white"
                }`}
              >
                <span>{pill.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 2-Column Responsive Layout for Filters on Left & Products Grid on Right (PRD 4.3) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start max-w-7xl mx-auto pt-6">
        
        {/* Left Sidebar: Filter Panel */}
        <aside className="lg:col-span-1 space-y-6 lg:sticky lg:top-24 bg-white border border-slate-100/90 rounded-[32px] p-6 shadow-xl shadow-slate-200/40 text-left relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-full -mr-12 -mt-12 opacity-50"></div>
          
          <div className="space-y-6 relative z-10">
            {/* Search */}
            <div className="space-y-2 text-left">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                {lang === "zh"
                  ? "搜索童车和婴儿推车"
                  : "Search Products"}
              </span>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={lang === "en" ? "SEARCH PRODUCTS..." : "搜寻型号..."}
                  className="w-full bg-slate-50 border border-slate-150 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all uppercase tracking-tight"
                />
              </div>
            </div>

            {/* Sort */}
            <div className="space-y-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-sans">
                {lang === "zh" ? "排序条件规划" : "SORT ORDER"}
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-slate-50 border border-slate-150 rounded-2xl px-4 py-2.5 text-[10px] text-slate-900 font-black uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap"
                title={lang === "en" ? "Sort products" : "排序产品"}
                aria-label={lang === "en" ? "Sort products" : "排序产品"}
              >
                <option value="overallScore">{lang === "en" ? "🏆 TOP RATED" : "🏆 专家综合推荐"}</option>
                <option value="weightAsc">{lang === "en" ? "⚖️ LIGHTWEIGHT" : "⚖️ 极轻量优先"}</option>
                <option value="priceDesc">{lang === "en" ? "💰 LUXURY FIRST" : "💰 顶级奢选"}</option>
                <option value="priceAsc">{lang === "en" ? "💎 BEST VALUE" : "💎 卓越性价比"}</option>
              </select>
            </div>

            {/* Category selection */}
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">
                {lang === "zh" ? "核心品类精选" : "Categories"}
              </span>
              <div className="flex flex-col gap-1">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleCategorySelect(c.id)}
                    className={`w-full text-left px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                      selectedCategory === c.id
                        ? "bg-orange-500 text-white border-orange-400 shadow-md shadow-orange-500/10"
                        : "bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Filters */}
            <div className="space-y-4 border-t border-slate-100 pt-4">
              <div className="space-y-1.5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block pl-1">{lang === "zh" ? "适龄跨度" : "Age Bridge"}</span>
                <div className="grid grid-cols-2 gap-1.5 font-sans">
                  {[
                    { id: "all", label: lang === "zh" ? "全部" : "ALL" },
                    { id: "baby", label: lang === "zh" ? "婴幼儿" : "0-2 Y" },
                    { id: "toddler", label: lang === "zh" ? "小童" : "2-5 Y" },
                    { id: "child", label: lang === "zh" ? "中大童" : "5+ Y" },
                  ].map(age => (
                    <button 
                      key={age.id}
                      onClick={() => setSelectedAge(age.id)}
                      className={`py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all border ${
                        selectedAge === age.id ? "bg-slate-900 text-white border-slate-900 shadow-sm" : "bg-white text-slate-400 border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      {age.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block pl-1">{lang === "zh" ? "预算区间" : "Price Filter"}</span>
                <div className="grid grid-cols-2 gap-1.5 font-sans">
                  {[
                    { id: "all", label: lang === "zh" ? "全部" : "ALL" },
                    { id: "budget", label: lang === "zh" ? "大众" : "BUDGET" },
                    { id: "mid", label: lang === "zh" ? "中端" : "MID" },
                    { id: "premium", label: lang === "zh" ? "极致" : "PREMIUM" },
                  ].map(p => (
                    <button 
                      key={p.id}
                      onClick={() => setSelectedPrice(p.id)}
                      className={`py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all border ${
                        selectedPrice === p.id ? "bg-slate-900 text-white border-slate-900 shadow-sm" : "bg-white text-slate-400 border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {selectedCategory !== "all" && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block pl-1">{lang === "zh" ? "品牌" : "Brand"}</span>
                    <select
                      value={selectedBrand}
                      onChange={(e) => setSelectedBrand(e.target.value)}
                      title={lang === "zh" ? "选择品牌" : "Select brand"}
                      aria-label={lang === "zh" ? "选择品牌" : "Select brand"}
                      className="w-full px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-tight border bg-white text-slate-700 border-slate-200"
                    >
                      <option value="all">{lang === "zh" ? "全部" : "ALL"}</option>
                      {categoryFilterOptions.brands.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block pl-1">{lang === "zh" ? "车架材质" : "Frame"}</span>
                    <select
                      value={selectedFrameMaterial}
                      onChange={(e) => setSelectedFrameMaterial(e.target.value)}
                      title={lang === "zh" ? "选择车架材质" : "Select frame material"}
                      aria-label={lang === "zh" ? "选择车架材质" : "Select frame material"}
                      className="w-full px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-tight border bg-white text-slate-700 border-slate-200"
                    >
                      <option value="all">{lang === "zh" ? "全部" : "ALL"}</option>
                      {categoryFilterOptions.frameMaterials.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block pl-1">{lang === "zh" ? "轮胎类型" : "Tire"}</span>
                    <select
                      value={selectedTireType}
                      onChange={(e) => setSelectedTireType(e.target.value)}
                      title={lang === "zh" ? "选择轮胎类型" : "Select tire type"}
                      aria-label={lang === "zh" ? "选择轮胎类型" : "Select tire type"}
                      className="w-full px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-tight border bg-white text-slate-700 border-slate-200"
                    >
                      <option value="all">{lang === "zh" ? "全部" : "ALL"}</option>
                      {categoryFilterOptions.tireTypes.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block pl-1">{lang === "zh" ? "制动系统" : "Brake"}</span>
                    <select
                      value={selectedBrakeSystem}
                      onChange={(e) => setSelectedBrakeSystem(e.target.value)}
                      title={lang === "zh" ? "选择制动系统" : "Select braking system"}
                      aria-label={lang === "zh" ? "选择制动系统" : "Select braking system"}
                      className="w-full px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-tight border bg-white text-slate-700 border-slate-200"
                    >
                      <option value="all">{lang === "zh" ? "全部" : "ALL"}</option>
                      {categoryFilterOptions.brakeSystems.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block pl-1">{lang === "zh" ? "轮径" : "Wheel"}</span>
                    <select
                      value={selectedWheelSize}
                      onChange={(e) => setSelectedWheelSize(e.target.value)}
                      title={lang === "zh" ? "选择轮径" : "Select wheel size"}
                      aria-label={lang === "zh" ? "选择轮径" : "Select wheel size"}
                      className="w-full px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-tight border bg-white text-slate-700 border-slate-200"
                    >
                      <option value="all">{lang === "zh" ? "全部" : "ALL"}</option>
                      {categoryFilterOptions.wheelSizes.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block pl-1">{lang === "zh" ? "安全认证" : "Certification"}</span>
                    <select
                      value={selectedCertification}
                      onChange={(e) => setSelectedCertification(e.target.value)}
                      title={lang === "zh" ? "选择安全认证" : "Select certification"}
                      aria-label={lang === "zh" ? "选择安全认证" : "Select certification"}
                      className="w-full px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-tight border bg-white text-slate-700 border-slate-200"
                    >
                      <option value="all">{lang === "zh" ? "全部" : "ALL"}</option>
                      {categoryFilterOptions.certifications.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Right Listings Column */}
        <section className="lg:col-span-3 space-y-8 min-w-0">
          {filteredProducts.length === 0 ? (
            <div className="p-20 text-center bg-white border border-slate-100 rounded-3xl shadow-sm">
              <span className="text-3xl block mb-3">🔍</span>
              <p className="text-slate-400 font-extrabold uppercase tracking-wide text-xs">
                {lang === "en" ? "No matches in global database" : "全球数据库中暂无特定匹配项"}
              </p>
              <button 
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedAge("all");
                  setSelectedPrice("all");
                  setSelectedBrand("all");
                  setSelectedFrameMaterial("all");
                  setSelectedTireType("all");
                  setSelectedBrakeSystem("all");
                  setSelectedWheelSize("all");
                  setSelectedCertification("all");
                }}
                className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white hover:bg-orange-500 rounded-full text-xs font-bold transition-colors cursor-pointer"
              >
                {lang === "en" ? "Reset All Filters" : "清空全部过滤条件"}
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              <div id="expert-picks-anchor" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left bg-gradient-to-r from-orange-50/20 via-slate-50/10 to-transparent p-6 rounded-3xl border border-slate-100">
                <div className="space-y-1">
                  <h2 className="text-xl font-black text-slate-900 flex flex-wrap items-center gap-2">
                    <span>{lang === "en" ? "Expert Product Picks" : "专家产品精选"}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-600 border border-orange-200/50 text-[10px] font-black">
                      {filteredProducts.length} / {categoryBaseCount}
                    </span>
                  </h2>
                  <p className="text-[10px] text-slate-400 font-semibold max-w-xl">
                    {lang === "en" 
                      ? "📊 Metrics index: 🧪 Score | 📦 Capacity limits | 🛡️ Compliance certified"
                      : "📊 物理实测：🧪 实验室综合评分 | 📦 承重性能参数 | 🛡️ 全球体系安全准入合规验证"}
                  </p>
                </div>
              </div>

              {/* Grid map listings */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 items-start">
                {pagedProducts.map(({ product: p, sourceCategoryId }, idx) => {
                  const diProduct = p;
                  const imageSet = resolveProductImages(diProduct);
                  const cardSummary = resolveCardSummary(diProduct, lang);
                  const priceText = formatPriceDisplay(diProduct.price, currencyData, lang);
                  const productSeoTitle = getProductsPageSeoTitle(p);

                  const isAlreadySaved = savedProducts.some(s => s.id === diProduct.id);
                  const isAlreadyCompared = compareList.some(c => c.id === diProduct.id);

                  return (
                    <div
                      key={diProduct.id}
                onClick={() => onSelectProduct(p)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelectProduct(p);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={lang === "en" ? `View full metrics for ${diProduct.name}` : `查看 ${diProduct.name} 的完整参数`}
                className="bg-white border border-slate-100 hover:border-orange-100 rounded-[56px] p-8 flex flex-col justify-between space-y-8 hover:shadow-[0_48px_80px_-24px_rgba(249,115,22,0.12)] transition-all duration-500 group text-left cursor-pointer relative animate-fade-in overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-[60px] opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 -translate-y-4"></div>
                
                <div className="space-y-6 relative z-10">
                  <div className="w-full h-52 bg-slate-50 border border-slate-100 rounded-[28px] p-4 flex items-center justify-center overflow-hidden">
                    <SmartImage
                      src={imageSet.coverUrl || undefined}
                      fallbackSrcs={imageSet.galleryUrls}
                      alt={productSeoTitle || getProductImageAlt(p)}
                      className="w-full h-full object-contain"
                      wrapperClassName="w-full h-full"
                      width={640}
                      height={416}
                      priority={idx < 3}
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="bg-orange-50 text-orange-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-orange-100">
                      {getCategoryLabel(sourceCategoryId, diProduct.category)}
                    </span>
                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{diProduct.brand}</span>
                  </div>

                  <h3 className="font-black text-slate-900 text-lg leading-tight group-hover:text-orange-500 transition-colors">
                    {productSeoTitle}
                  </h3>

                  {cardSummary && (
                    <div className="space-y-4 pt-1">
                      {selectedCategory === "all" ? (
                        <>
                          <div className="space-y-1.5">
                            <p className="text-slate-600 text-xs leading-relaxed font-semibold whitespace-normal break-words">
                              {cardSummary}
                            </p>
                          </div>

                          <div className="pt-3 border-t border-dashed border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
                            <div className="flex items-center gap-1">
                              <span className="shrink-0" title={lang === "zh" ? "综合评分" : "Score"}>🧪</span>
                              <span className="text-slate-900 font-extrabold bg-amber-50 border border-amber-100/50 px-2 py-0.5 rounded text-[10px]">
                                {diProduct.overallScore ? diProduct.overallScore.toFixed(1) : "9.4"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="shrink-0" title={lang === "zh" ? "承载重量" : "Capacity"}>📦</span>
                              <span className="text-slate-700 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded text-[10px] font-extrabold">
                                {resolveCapacityNumeric(diProduct)}
                              </span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="space-y-1.5">
                            <p className="text-slate-600 text-xs leading-relaxed font-semibold whitespace-normal break-words">
                              {cardSummary}
                            </p>
                          </div>

                          <div className="pt-3 border-t border-dashed border-slate-100 space-y-3 text-xs text-slate-600">
                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-[10px] font-black text-slate-400">
                                <span>🧪 {diProduct.overallScore ? diProduct.overallScore.toFixed(1) : "9.4"}</span>
                              </div>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className="bg-orange-500 h-full rounded-full transition-all duration-350" 
                                  style={{ width: `${(diProduct.overallScore || 9.4) * 10}%` }}
                                ></div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-xs font-bold">
                              <div className="flex items-center gap-1">
                                <span title={lang === "zh" ? "承载重量" : "Capacity"}>📦</span>
                                <span className="px-2 py-0.5 rounded bg-slate-50 border border-slate-100 text-[10px] font-extrabold text-slate-700">
                                  {resolveCapacityNumeric(diProduct)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                </div>

                {/* Card actions */}
                <div className="flex justify-between items-center gap-4 pt-6 border-t border-slate-50 relative z-10">
                  <strong className="text-lg text-slate-900 font-black tracking-tighter shrink-0">
                    {priceText}
                  </strong>
                  <div className="flex gap-3 items-center">
                    {isAdmin && onOpenAdminProductEditor && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAdminProductEditor(p);
                        }}
                        className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-colors"
                        title={lang === "en" ? "Edit in Admin" : "后台编辑"}
                        aria-label={lang === "en" ? "Edit in Admin" : "后台编辑"}
                      >
                        {lang === "en" ? "Admin Edit" : "后台编辑"}
                      </button>
                    )}
                    <button
                      onClick={(e) => handleToggleCompare(p, e)}
                      disabled={!isAlreadyCompared && compareList.length >= 4}
                      className={`p-3.5 rounded-2xl border transition-all active:scale-90 ${
                        isAlreadyCompared 
                          ? "bg-orange-500 border-orange-400 text-white shadow-xl shadow-orange-500/20"
                          : compareList.length >= 4
                            ? "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed"
                          : "bg-white border-slate-100 text-slate-400 hover:text-orange-500 hover:border-orange-200"
                      }`}
                      title={lang === "en" ? "Add to compare" : "加入对比"}
                      aria-label={lang === "en" ? "Add to compare" : "加入对比"}
                    >
                      <Scale className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => handleToggleSave(p, e)}
                      className={`p-3.5 rounded-2xl border transition-all active:scale-90 ${
                        isAlreadySaved
                          ? "bg-rose-500 border-rose-400 text-white shadow-xl shadow-rose-500/20"
                          : "bg-white border-slate-100 text-slate-400 hover:text-rose-500 hover:border-rose-200"
                      }`}
                      title={lang === "en" ? "Save product" : "收藏产品"}
                      aria-label={lang === "en" ? "Save product" : "收藏产品"}
                    >
                      <Bookmark className="w-5 h-5 fill-current" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onPageChange?.(Math.max(1, safePage - 1))}
              disabled={safePage <= 1}
              className="w-10 h-10 rounded-2xl border border-slate-200 bg-white text-slate-600 disabled:opacity-40 flex items-center justify-center"
              aria-label={lang === "en" ? "Go to previous page" : "上一页"}
            >
              <svg aria-hidden="true" viewBox="0 0 20 20" className="w-4 h-4" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.5 4.5L7 10L12.5 15.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div
              className="w-24 h-2 rounded-full bg-slate-100 overflow-hidden"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={totalPages}
              aria-valuenow={safePage}
              aria-label={lang === "en" ? `Page ${safePage} of ${totalPages}` : `第 ${safePage} 页，共 ${totalPages} 页`}
            >
              <div
                className="h-full bg-slate-900 rounded-full transition-all"
                style={{ width: `${Math.max(8, (safePage / totalPages) * 100)}%` }}
              />
            </div>
            <button
              onClick={() => onPageChange?.(Math.min(totalPages, safePage + 1))}
              disabled={safePage >= totalPages}
              className="w-10 h-10 rounded-2xl border border-slate-200 bg-white text-slate-600 disabled:opacity-40 flex items-center justify-center"
              aria-label={lang === "en" ? "Go to next page" : "下一页"}
            >
              <svg aria-hidden="true" viewBox="0 0 20 20" className="w-4 h-4" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.5 4.5L13 10L7.5 15.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        )}
        </div>
      )}
      </section>
      </div>

      {viewHistory && viewHistory.length > 0 && (
        <section className="mt-20 border-t border-slate-100 pt-16 space-y-8">
          <div className="flex gap-3 items-center">
            <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-500 shadow-sm">
              <span className="font-sans text-lg">🕒</span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {lang === "zh" ? "最近浏览车款" : "Recently Viewed Product"}
              </h2>
              <p className="text-slate-400 text-xs font-semibold">
                {lang === "zh" ? "您最近查看过的物理测试细节档案（保存在浏览器中）" : "Quickly retrieve strollers you investigated recently (Cached in your browser)"}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {viewHistory.slice(0, 4).map(p => {
              const dp = translateProduct(p, lang);
              const historySeoTitle = getProductsPageSeoTitle(p);
              const imageSet = resolveProductImages(dp);
              return (
                <div 
                  key={p.id}
                  onClick={() => onSelectProduct(p)}
                  className="bg-white border border-slate-100 hover:border-orange-200 rounded-4xl p-5 flex items-center gap-4 cursor-pointer hover:shadow-xl transition duration-300 group"
                >
                  <div className="w-16 h-16 bg-slate-50 border border-slate-100/50 rounded-2xl flex items-center justify-center p-2 shrink-0 group-hover:bg-orange-50/50 transition">
                    <SmartImage
                      src={imageSet.coverUrl || undefined}
                      fallbackSrcs={imageSet.galleryUrls}
                      alt={historySeoTitle || getProductImageAlt(p)}
                      className="w-full h-full object-contain"
                      wrapperClassName="w-full h-full"
                      width={128}
                      height={128}
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-slate-900 group-hover:text-orange-500 transition truncate text-sm">
                      {historySeoTitle}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                      {dp.brand}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

    </div>
  );
}
