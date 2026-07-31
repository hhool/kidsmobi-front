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
import { getPageCopy } from "../config/pageCopy";

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
  const businessCopy = getPageCopy(lang).products.businessCopy;
  const logicTokens = businessCopy.logicTokens;
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

  const orderedCandidates = lang === "zh"
    ? [
        isPlaceholderDescription(localizedDescription) ? "" : localizedDescription,
        isPlaceholderDescription(defaultDescription) ? "" : defaultDescription,
        evidenceDescription,
        rawProductDescription,
      ]
    : [
        rawProductDescription,
        isPlaceholderDescription(localizedDescription) ? "" : localizedDescription,
        isPlaceholderDescription(defaultDescription) ? "" : defaultDescription,
        evidenceDescription,
      ];

  const candidates = orderedCandidates.map((item) => compactSnippet(item));

  let baseDesc = candidates.find((item) => item && !isPlaceholderDescription(item) && !isCustomerReviewNarrative(item)) || "";
  if (lang === "zh" && baseDesc && !containsCjk(baseDesc)) {
    // In zh locale, avoid leaking long English marketplace copy when no translated description is present.
    baseDesc = "";
  }

  // Naturally integrate keywords based on category identification
  const catRaw = String(product.categoryId || product.category || "").toLowerCase();
  if (catRaw === "kids_bikes") {
    if (lang === "zh") {
      if (!baseDesc.includes(logicTokens.keywordPresence.kidsBike)) {
        baseDesc = businessCopy.descriptionTemplates.kidsBikeZh.replace("{base}", baseDesc);
      }
    } else {
      // Keep EN kids-bike card copy concise: show only the lead sentence and avoid appending long product titles.
      baseDesc = businessCopy.descriptionTemplates.kidsBikeEn.replace(" {base}", "").replace("{base}", "").trim();
    }
  } else if (catRaw === "balance_bike" || catRaw.includes("balance")) {
    if (lang === "zh") {
      if (!baseDesc.includes(logicTokens.keywordPresence.balanceBike)) {
        baseDesc = businessCopy.descriptionTemplates.balanceBikeZh.replace("{base}", baseDesc);
      }
    } else {
      if (!baseDesc.toLowerCase().includes(logicTokens.keywordPresence.balanceBike)) {
        baseDesc = businessCopy.descriptionTemplates.balanceBikeEn.replace("{base}", baseDesc);
      }
    }
  } else if (catRaw === "stroller") {
    const nameLower = String(product.name || "").toLowerCase();
    const isTwin = includesAny(nameLower, logicTokens.twinSignals);
    if (isTwin) {
      if (lang === "zh") {
        if (!baseDesc.includes(logicTokens.keywordPresence.twinStroller)) {
          baseDesc = businessCopy.descriptionTemplates.twinStrollerZh.replace("{base}", baseDesc);
        }
      } else {
        if (!baseDesc.toLowerCase().includes(logicTokens.keywordPresence.twinStroller)) {
          baseDesc = businessCopy.descriptionTemplates.twinStrollerEn.replace("{base}", baseDesc);
        }
      }
    }
  } else if (catRaw === "kids_scooters" || catRaw === "scooters" || catRaw.includes("scooter")) {
    const nameLower = String(product.name || "").toLowerCase();
    const isElectric = includesAny(nameLower, logicTokens.electricSignals) || includesAny(String(product.id || "").toLowerCase(), logicTokens.electricSignals);
    if (isElectric) {
      if (lang === "zh") {
        if (!baseDesc.includes(logicTokens.keywordPresence.electricScooter)) {
          baseDesc = businessCopy.descriptionTemplates.electricScooterZh.replace("{base}", baseDesc);
        }
      } else {
        if (!baseDesc.toLowerCase().includes(logicTokens.keywordPresence.electricScooter)) {
          baseDesc = businessCopy.descriptionTemplates.electricScooterEn.replace("{base}", baseDesc);
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

function includesAny(text: string, tokens: string[]): boolean {
  return tokens.some((token) => text.includes(token));
}

function containsCjk(text: string): boolean {
  return /[\u4e00-\u9fff]/.test(String(text || ""));
}

function normalizeCategoryLabelForZh(label: string): string {
  const normalized = String(label || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

  const map: Record<string, string> = {
    "stroller": "婴儿推车",
    "strollers": "婴儿推车",
    "double stroller": "双人婴儿推车",
    "double strollers": "双人婴儿推车",
    "jogger stroller": "慢跑推车",
    "jogger strollers": "慢跑推车",
    "balance bike": "平衡车",
    "balance bikes": "平衡车",
    "kids bike": "儿童自行车",
    "kids bikes": "儿童自行车",
    "bike": "儿童自行车",
    "bicycle": "儿童自行车",
    "kids scooter": "儿童滑板车",
    "kids scooters": "儿童滑板车",
    "scooter": "儿童滑板车",
    "scooters": "儿童滑板车",
    "electric vehicles": "儿童电动车",
    "electric vehicle": "儿童电动车",
    "electric car": "儿童电动车",
    "kids electric car": "儿童电动车",
    "car seat": "儿童安全座椅",
    "car seats": "儿童安全座椅",
    "kids car seat": "儿童安全座椅",
    "kids car seats": "儿童安全座椅",
    "safety seat": "儿童安全座椅",
    "tricycle": "儿童三轮车",
    "kids tricycle": "儿童三轮车",
    "kids tricycles": "儿童三轮车",
  };

  return map[normalized] || label;
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
  const businessCopy = getPageCopy(lang).products.businessCopy;
  const logicTokens = businessCopy.logicTokens;
  const name = normalizeSnippetForCompare(product.name);
  const categoryId = normalizeSnippetForCompare(String((product as Product & { categoryId?: string }).categoryId || product.category || ""));
  const hasSignal = (signals: string[]) => includesAny(name, signals) || includesAny(categoryId, signals);

  if (lang === "zh") {
    if (hasSignal(logicTokens.generatedSummarySignals.travel)) return businessCopy.generatedSummary.travelZh;
    if (hasSignal(logicTokens.generatedSummarySignals.travelSystem)) return businessCopy.generatedSummary.travelSystemZh;
    if (hasSignal(logicTokens.generatedSummarySignals.jogger)) return businessCopy.generatedSummary.joggerZh;
    if (hasSignal(logicTokens.generatedSummarySignals.twin)) return businessCopy.generatedSummary.twinZh;
    if (hasSignal(logicTokens.generatedSummarySignals.balance)) return businessCopy.generatedSummary.balanceZh;
    if (hasSignal(logicTokens.generatedSummarySignals.scooter)) return businessCopy.generatedSummary.scooterZh;
    if (hasSignal(logicTokens.generatedSummarySignals.carSeat)) return businessCopy.generatedSummary.carSeatZh;
    return businessCopy.generatedSummary.defaultZh;
  }

  if (hasSignal(logicTokens.generatedSummarySignals.travel)) return businessCopy.generatedSummary.travelEn;
  if (hasSignal(logicTokens.generatedSummarySignals.travelSystem)) return businessCopy.generatedSummary.travelSystemEn;
  if (hasSignal(logicTokens.generatedSummarySignals.jogger)) return businessCopy.generatedSummary.joggerEn;
  if (hasSignal(logicTokens.generatedSummarySignals.twin)) return businessCopy.generatedSummary.twinEn;
  if (hasSignal(logicTokens.generatedSummarySignals.balance)) return businessCopy.generatedSummary.balanceEn;
  if (hasSignal(logicTokens.generatedSummarySignals.scooter)) return businessCopy.generatedSummary.scooterEn;
  if (hasSignal(logicTokens.generatedSummarySignals.carSeat)) return businessCopy.generatedSummary.carSeatEn;
  return businessCopy.generatedSummary.defaultEn;
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
  const categorySignals = getPageCopy("en").products.businessCopy.logicTokens.categorySignals;
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
  if (includesAny(category, categorySignals.wagonOrDouble)) {
    return "150";
  }
  if (includesAny(category, categorySignals.stroller)) {
    return "50";
  }
  if (includesAny(category, [...categorySignals.bike, ...categorySignals.bicycle])) {
    return "110";
  }
  return "150";
}

function resolveCapacity(product: Product, lang: "zh" | "en"): string {
  const capacityCopy = getPageCopy(lang).products.businessCopy.capacity;
  const categorySignals = getPageCopy(lang).products.businessCopy.logicTokens.categorySignals;
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
    const template = lang === "zh" ? capacityCopy.formattedZh : capacityCopy.formattedEn;
    return template.replace("{value}", lbs).replace("{duty}", dutyStr);
  }
  const matchKg = textToSearch.match(/(\d+)\s*(?:kg|kilograms)/);
  if (matchKg) {
    const kg = matchKg[1];
    const lbs = Math.round(parseInt(kg) * 2.2);
    const dutyStr = lbs >= 100 ? "H" : "S";
    const template = lang === "zh" ? capacityCopy.formattedZh : capacityCopy.formattedEn;
    return template.replace("{value}", String(lbs)).replace("{duty}", dutyStr);
  }

  const category = (product.category || "").toLowerCase();
  const formatByLocale = (value: string, duty: string) => {
    const template = lang === "zh" ? capacityCopy.formattedZh : capacityCopy.formattedEn;
    return template.replace("{value}", value).replace("{duty}", duty);
  };
  if (includesAny(category, categorySignals.wagonOrDouble)) {
    return formatByLocale(capacityCopy.defaults.wagonDouble.value, capacityCopy.defaults.wagonDouble.duty);
  }
  if (includesAny(category, categorySignals.stroller)) {
    return formatByLocale(capacityCopy.defaults.stroller.value, capacityCopy.defaults.stroller.duty);
  }
  if (includesAny(category, [...categorySignals.bike, ...categorySignals.bicycle])) {
    return formatByLocale(capacityCopy.defaults.bike.value, capacityCopy.defaults.bike.duty);
  }
  return formatByLocale(capacityCopy.defaults.fallback.value, capacityCopy.defaults.fallback.duty);
}

function resolveKeyAudit(product: Product, lang: "zh" | "en"): string {
  const auditCopy = getPageCopy(lang).products.businessCopy.auditLabels;
  const logicTokens = getPageCopy(lang).products.businessCopy.logicTokens;
  const textToSearch = [
    product.name,
    product.description,
    ...(product.features || [])
  ].join(" ").toLowerCase();

  const category = (product.category || "").toLowerCase();
  
  if (includesAny(category, logicTokens.categorySignals.carSeatOrSafetySeat)) {
    return lang === "zh" ? auditCopy.sideImpactZh : auditCopy.sideImpactEn;
  }
  if (includesAny(textToSearch, logicTokens.auditSignals.suspension)) {
    return lang === "zh" ? auditCopy.allTerrainStableZh : auditCopy.allTerrainStableEn;
  }
  if (includesAny(category, [...logicTokens.categorySignals.stroller, ...logicTokens.categorySignals.wagonOrDouble])) {
    return lang === "zh" ? auditCopy.allTerrainSafeZh : auditCopy.allTerrainSafeEn;
  }
  if (includesAny(category, [...logicTokens.categorySignals.bike, ...logicTokens.categorySignals.scooter])) {
    return lang === "zh" ? auditCopy.lowCogZh : auditCopy.lowCogEn;
  }
  return lang === "zh" ? auditCopy.allTerrainSafeZh : auditCopy.allTerrainSafeEn;
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
  const productsCopy = getPageCopy(lang).products;
  const productLogicTokens = productsCopy.businessCopy.logicTokens;
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

  const scrollToExpertPicks = () => {
    const element = document.getElementById("expert-picks-anchor");
    if (!element) return;

    window.requestAnimationFrame(() => {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    });
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
      const backendLabel = backendCategoryNameMap[normalized];
      if (lang === "en" || containsCjk(backendLabel)) {
        return backendLabel;
      }
    }

    const fallbackMap: Record<string, string> = lang === "zh"
      ? {
          balance: "平衡车",
          balance_bike: "平衡车",
          balance_bikes: "平衡车",
          bicycle: "儿童自行车",
          kids_bikes: "儿童自行车",
          scooter: "儿童滑板车",
          scooters: "儿童滑板车",
          kids_scooters: "儿童滑板车",
          stroller: "婴儿推车",
          strollers: "婴儿推车",
          double_stroller: "双人婴儿推车",
          jogger_stroller: "慢跑推车",
          electric_car: "儿童电动车",
          electric_vehicles: "儿童电动车",
          tricycle: "儿童三轮车",
          kids_tricycles: "儿童三轮车",
          safety_seat: "儿童安全座椅",
          car_seat: "儿童安全座椅",
          car_seats: "儿童安全座椅",
        }
      : {
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

    const titleized = normalized
      .split("_")
      .filter(Boolean)
      .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
      .join(" ");
    return lang === "zh" ? normalizeCategoryLabelForZh(titleized) : titleized;
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
    const allLabel = productsCopy.allProductsLabel;
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
    const rawLabel = fromCategoryId && fromCategoryId !== categoryId
      ? fromCategoryId
      : translateCategory(categoryCode, lang);

    const label = lang === "zh" ? normalizeCategoryLabelForZh(rawLabel) : rawLabel;

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
    if (includesAny(normalized, productLogicTokens.categorySignals.stroller)) return 0;
    if (includesAny(normalized, productLogicTokens.categorySignals.balance)) return 1;
    return 2;
  };

  const getAllProductsIntentPriority = (categoryId: string, product: Product) => {
    const normalizedCategory = String(categoryId || "").trim().toLowerCase();
    const text = [product.name, product.editorVerdict, product.brand]
      .map((item) => String(item || "").toLowerCase())
      .join(" ");

    const isStroller = includesAny(normalizedCategory, productLogicTokens.categorySignals.stroller);
    const isBalanceBike = includesAny(normalizedCategory, productLogicTokens.categorySignals.balance);

    const hasTravelSignal = includesAny(text, productLogicTokens.travelSignals);
    const hasHeavySignal = includesAny(text, productLogicTokens.heavySignals);

    if (isStroller && hasTravelSignal && !hasHeavySignal) return 0;
    if (isBalanceBike) return 1;
    if (isStroller && !hasHeavySignal) return 2;
    if (isStroller && hasHeavySignal) return 4;
    return 3;
  };

  const isTravelStrollerCandidate = (categoryId: string, product: Product) => {
    const normalizedCategory = String(categoryId || "").trim().toLowerCase();
    if (!includesAny(normalizedCategory, productLogicTokens.categorySignals.stroller)) {
      return false;
    }

    const text = [product.name, product.editorVerdict, product.brand]
      .map((item) => String(item || "").toLowerCase())
      .join(" ");
    const hasTravelSignal = includesAny(text, productLogicTokens.travelSignals);
    const hasHeavySignal = includesAny(text, productLogicTokens.heavySignals);
    return hasTravelSignal && !hasHeavySignal;
  };

  const isBalanceBikeCandidate = (categoryId: string, product: Product) => {
    const normalizedCategory = String(categoryId || "").trim().toLowerCase();
    if (includesAny(normalizedCategory, productLogicTokens.categorySignals.balance)) {
      return true;
    }

    const text = [product.name, product.editorVerdict, product.brand]
      .map((item) => String(item || "").toLowerCase())
      .join(" ");
    return includesAny(text, productLogicTokens.balanceSignals);
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
      return item.sourceCategoryId === "balance_bike" || includesAny(String(item.product.category || "").toLowerCase(), productLogicTokens.categorySignals.balance);
    });

    const twinStrollerPool = sortedItems.filter((item) => {
      const isStroller = item.sourceCategoryId === "stroller" || includesAny(String(item.product.category || "").toLowerCase(), productLogicTokens.categorySignals.stroller);
      const nameLower = item.product.name.toLowerCase();
      const isTwin = includesAny(nameLower, productLogicTokens.twinSignals);
      return isStroller && isTwin;
    });

    const kidsElectricScooterPool = sortedItems.filter((item) => {
      const nameLower = item.product.name.toLowerCase();
      const isScooter = item.sourceCategoryId === "kids_scooters" || item.sourceCategoryId === "scooters";
      const isElectric = includesAny(nameLower, productLogicTokens.electricSignals) || includesAny(item.product.id.toLowerCase(), productLogicTokens.electricSignals);
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
          matchesType = includesAny(p.name.toLowerCase(), productLogicTokens.twinSignals);
        }

        let matchesPower = true;
        if (selectedPower === "electric") {
          matchesPower = includesAny(p.name.toLowerCase(), productLogicTokens.electricSignals) || includesAny(p.id.toLowerCase(), productLogicTokens.electricSignals);
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
    { id: "balance_bike_toddler", label: productsCopy.seoPills.balanceBikeToddler, target: "balance_bike" },
    { id: "twin_stroller", label: productsCopy.seoPills.twinStroller, target: "stroller" },
    { id: "toddler_bike", label: productsCopy.seoPills.toddlerBike, target: "kids_bikes" },
    { id: "kids_electric_scooter", label: productsCopy.seoPills.kidsElectricScooter, target: "kids_scooters" },
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
        showSaveTip(productsCopy.compareLimitTip);
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
      showSaveTip(productsCopy.saveTips.loginRequired);
      return;
    }

    const alreadySaved = savedProducts.some(s => s.id === product.id);
    if (alreadySaved) {
      setSavedProducts(savedProducts.filter(s => s.id !== product.id));
      showSaveTip(productsCopy.saveTips.removed);
    } else {
      setSavedProducts([...savedProducts, product]);
      showSaveTip(productsCopy.saveTips.saved);
    }
  };

  return (
    <div id="product_library" className="space-y-8 animate-fade-in text-left">
      {/* Breadcrumbs (PRD 4.2.2) */}
      {(() => {
        const items: { label: string; active: boolean; onClick?: () => void }[] = [
          {
            label: productsCopy.breadcrumbsProducts,
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
            {productsCopy.topBadge}
          </div>

          <h1 className="text-xl md:text-2xl font-black tracking-tight leading-tight max-w-5xl">
            {productsCopy.heroTitle}
          </h1>

          <div className="border-l-2 border-orange-500 pl-4 space-y-2">
            <p className="text-slate-300 text-xs md:text-sm font-semibold max-w-5xl leading-relaxed italic">
              {productsCopy.heroSubtitle}
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
                  if (pill.id === "balance_bike_toddler") {
                    searchString = "?age=toddler";
                  } else if (pill.id === "twin_stroller") {
                    searchString = "?type=twin";
                  } else if (pill.id === "toddler_bike") {
                    searchString = "?age=toddler";
                  } else if (pill.id === "kids_electric_scooter") {
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
                {productsCopy.searchLabel}
              </span>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={productsCopy.searchPlaceholder}
                  className="w-full bg-slate-50 border border-slate-150 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all uppercase tracking-tight"
                />
              </div>
            </div>

            {/* Sort */}
            <div className="space-y-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-sans">
                {productsCopy.sortLabel}
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-slate-50 border border-slate-150 rounded-2xl px-4 py-2.5 text-[10px] text-slate-900 font-black uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap"
                title={productsCopy.sortAria}
                aria-label={productsCopy.sortAria}
              >
                <option value="overallScore">{productsCopy.sortOptions.topRated}</option>
                <option value="weightAsc">{productsCopy.sortOptions.lightweight}</option>
                <option value="priceDesc">{productsCopy.sortOptions.luxuryFirst}</option>
                <option value="priceAsc">{productsCopy.sortOptions.bestValue}</option>
              </select>
            </div>

            {/* Category selection */}
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">
                {productsCopy.categoriesLabel}
              </span>
              <div className="flex flex-col gap-1">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      handleCategorySelect(c.id);
                      scrollToExpertPicks();
                    }}
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
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block pl-1">{productsCopy.ageLabel}</span>
                <div className="grid grid-cols-2 gap-1.5 font-sans">
                  {[
                    { id: "all", label: productsCopy.ageOptions.all },
                    { id: "baby", label: productsCopy.ageOptions.baby },
                    { id: "toddler", label: productsCopy.ageOptions.toddler },
                    { id: "child", label: productsCopy.ageOptions.child },
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
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block pl-1">{productsCopy.priceLabel}</span>
                <div className="grid grid-cols-2 gap-1.5 font-sans">
                  {[
                    { id: "all", label: productsCopy.priceOptions.all },
                    { id: "budget", label: productsCopy.priceOptions.budget },
                    { id: "mid", label: productsCopy.priceOptions.mid },
                    { id: "premium", label: productsCopy.priceOptions.premium },
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
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block pl-1">{productsCopy.filterFacets.brandLabel}</span>
                    <select
                      value={selectedBrand}
                      onChange={(e) => setSelectedBrand(e.target.value)}
                      title={productsCopy.filterFacets.selectBrand}
                      aria-label={productsCopy.filterFacets.selectBrand}
                      className="w-full px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-tight border bg-white text-slate-700 border-slate-200"
                    >
                      <option value="all">{productsCopy.filterFacets.allOption}</option>
                      {categoryFilterOptions.brands.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block pl-1">{productsCopy.filterFacets.frameLabel}</span>
                    <select
                      value={selectedFrameMaterial}
                      onChange={(e) => setSelectedFrameMaterial(e.target.value)}
                      title={productsCopy.filterFacets.selectFrame}
                      aria-label={productsCopy.filterFacets.selectFrame}
                      className="w-full px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-tight border bg-white text-slate-700 border-slate-200"
                    >
                      <option value="all">{productsCopy.filterFacets.allOption}</option>
                      {categoryFilterOptions.frameMaterials.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block pl-1">{productsCopy.filterFacets.tireLabel}</span>
                    <select
                      value={selectedTireType}
                      onChange={(e) => setSelectedTireType(e.target.value)}
                      title={productsCopy.filterFacets.selectTire}
                      aria-label={productsCopy.filterFacets.selectTire}
                      className="w-full px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-tight border bg-white text-slate-700 border-slate-200"
                    >
                      <option value="all">{productsCopy.filterFacets.allOption}</option>
                      {categoryFilterOptions.tireTypes.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block pl-1">{productsCopy.filterFacets.brakeLabel}</span>
                    <select
                      value={selectedBrakeSystem}
                      onChange={(e) => setSelectedBrakeSystem(e.target.value)}
                      title={productsCopy.filterFacets.selectBrake}
                      aria-label={productsCopy.filterFacets.selectBrake}
                      className="w-full px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-tight border bg-white text-slate-700 border-slate-200"
                    >
                      <option value="all">{productsCopy.filterFacets.allOption}</option>
                      {categoryFilterOptions.brakeSystems.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block pl-1">{productsCopy.filterFacets.wheelLabel}</span>
                    <select
                      value={selectedWheelSize}
                      onChange={(e) => setSelectedWheelSize(e.target.value)}
                      title={productsCopy.filterFacets.selectWheel}
                      aria-label={productsCopy.filterFacets.selectWheel}
                      className="w-full px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-tight border bg-white text-slate-700 border-slate-200"
                    >
                      <option value="all">{productsCopy.filterFacets.allOption}</option>
                      {categoryFilterOptions.wheelSizes.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block pl-1">{productsCopy.filterFacets.certificationLabel}</span>
                    <select
                      value={selectedCertification}
                      onChange={(e) => setSelectedCertification(e.target.value)}
                      title={productsCopy.filterFacets.selectCertification}
                      aria-label={productsCopy.filterFacets.selectCertification}
                      className="w-full px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-tight border bg-white text-slate-700 border-slate-200"
                    >
                      <option value="all">{productsCopy.filterFacets.allOption}</option>
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
                {productsCopy.noMatches}
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
                {productsCopy.resetFilters}
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              <div id="expert-picks-anchor" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left bg-gradient-to-r from-orange-50/20 via-slate-50/10 to-transparent p-6 rounded-3xl border border-slate-100">
                <div className="space-y-1">
                  <h2 className="text-xl font-black text-slate-900 flex flex-wrap items-center gap-2">
                    <span>{productsCopy.expertPicks}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-600 border border-orange-200/50 text-[10px] font-black">
                      {filteredProducts.length} / {categoryBaseCount}
                    </span>
                  </h2>
                  <p className="text-[10px] text-slate-400 font-semibold max-w-xl">
                    {productsCopy.metricsHint}
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
                aria-label={`${productsCopy.productCard.viewMetricsAriaPrefix} ${diProduct.name}`}
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
                              <span className="shrink-0" title={productsCopy.productCard.scoreTitle}>🧪</span>
                              <span className="text-slate-900 font-extrabold bg-amber-50 border border-amber-100/50 px-2 py-0.5 rounded text-[10px]">
                                {diProduct.overallScore ? diProduct.overallScore.toFixed(1) : "9.4"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="shrink-0" title={productsCopy.productCard.capacityTitle}>📦</span>
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
                                <span title={productsCopy.productCard.capacityTitle}>📦</span>
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
                        title={productsCopy.productCard.adminEditTitle}
                        aria-label={productsCopy.productCard.adminEditTitle}
                      >
                        {productsCopy.productCard.adminEditLabel}
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
                      title={productsCopy.productCard.compareAria}
                      aria-label={productsCopy.productCard.compareAria}
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
                      title={productsCopy.productCard.saveAria}
                      aria-label={productsCopy.productCard.saveAria}
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
              aria-label={productsCopy.pagination.prevPageAria}
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
              aria-label={productsCopy.pagination.pageAriaTemplate.replace("{current}", String(safePage)).replace("{total}", String(totalPages))}
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
              aria-label={productsCopy.pagination.nextPageAria}
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
                {productsCopy.history.title}
              </h2>
              <p className="text-slate-400 text-xs font-semibold">
                {productsCopy.history.subtitle}
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
                    <h3 className="font-extrabold text-slate-900 group-hover:text-orange-500 transition text-sm break-words">
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
