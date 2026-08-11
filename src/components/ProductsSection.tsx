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
import { localizeMaterialDisplayValue, localizeSafetyDisplayValue } from "../lib/specLexicon";
import { formatWeight } from "../lib/units";
import { resolveProductImages } from "../lib/productImages";
import { getProductDisplayTitle, getProductImageAlt, getProductsPageSeoTitle } from "../lib/productSeoText";
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
  return true;
}

function isCustomerReviewNarrative(value: string): boolean {
  const text = compactSnippet(value);
  if (!text) return false;
  return !isRatingStatsSummary(text);
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
        baseDesc = applyTemplate(businessCopy.descriptionTemplates.kidsBikeZh, { base: baseDesc }, "{base}");
      }
    } else {
      // Keep EN kids-bike card copy concise: show only the lead sentence and avoid appending long product titles.
      baseDesc = applyTemplate(businessCopy.descriptionTemplates.kidsBikeEn, { base: "" }, "").trim();
    }
  } else if (catRaw === "balance_bike" || catRaw.includes("balance")) {
    if (lang === "zh") {
      if (!baseDesc.includes(logicTokens.keywordPresence.balanceBike)) {
        baseDesc = applyTemplate(businessCopy.descriptionTemplates.balanceBikeZh, { base: baseDesc }, "{base}");
      }
    } else {
      if (!baseDesc.toLowerCase().includes(logicTokens.keywordPresence.balanceBike)) {
        baseDesc = applyTemplate(businessCopy.descriptionTemplates.balanceBikeEn, { base: baseDesc }, "{base}");
      }
    }
  } else if (catRaw === "stroller") {
    const nameLower = String(product.name || "").toLowerCase();
    const isTwin = includesAny(nameLower, logicTokens.twinSignals);
    if (isTwin) {
      if (lang === "zh") {
        if (!baseDesc.includes(logicTokens.keywordPresence.twinStroller)) {
          baseDesc = applyTemplate(businessCopy.descriptionTemplates.twinStrollerZh, { base: baseDesc }, "{base}");
        }
      } else {
        if (!baseDesc.toLowerCase().includes(logicTokens.keywordPresence.twinStroller)) {
          baseDesc = applyTemplate(businessCopy.descriptionTemplates.twinStrollerEn, { base: baseDesc }, "{base}");
        }
      }
    }
  } else if (catRaw === "kids_scooters" || catRaw === "scooters" || catRaw.includes("scooter")) {
    const nameLower = String(product.name || "").toLowerCase();
    const isElectric = includesAny(nameLower, logicTokens.electricSignals) || includesAny(String(product.id || "").toLowerCase(), logicTokens.electricSignals);
    if (isElectric) {
      if (lang === "zh") {
        if (!baseDesc.includes(logicTokens.keywordPresence.electricScooter)) {
          baseDesc = applyTemplate(businessCopy.descriptionTemplates.electricScooterZh, { base: baseDesc }, "{base}");
        }
      } else {
        if (!baseDesc.toLowerCase().includes(logicTokens.keywordPresence.electricScooter)) {
          baseDesc = applyTemplate(businessCopy.descriptionTemplates.electricScooterEn, { base: baseDesc }, "{base}");
        }
      }
    }
  }

  return baseDesc;
}

function compactSnippet(value: string): string {
  return String(value || "")
    .replace(/^customers\s+find\s+/i, "")
    .replace(/\s+/g, " ")
    .replace(/[“”]/g, '"')
    .trim();
}

function toLowerSafe(value: unknown): string {
  return String(value ?? "").toLowerCase();
}

function applyTemplate(
  templateValue: unknown,
  replacements: Record<string, string>,
  fallbackTemplate = ""
): string {
  const baseTemplate = String(templateValue || fallbackTemplate || "");
  return Object.entries(replacements).reduce(
    (acc, [token, replacement]) => acc.replace(new RegExp(`\\{${token}\\}`, "g"), String(replacement ?? "")),
    baseTemplate
  );
}

function includesAny(text: string, tokens: string[]): boolean {
  return tokens.some((token) => text.includes(token));
}

function stripEnglishArticles(text: string): string {
  return String(text || "")
    .replace(/\b(?:a|an|the)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsCjk(text: string): boolean {
  return /[\u4e00-\u9fff]/.test(String(text || ""));
}

function hasHelmetSignal(text: string): boolean {
  return /(\bhelmets?\b|头盔)/i.test(String(text || ""));
}

function stripLeadingBrandFromTitle(title: string, brand: string): string {
  const normalizedTitle = String(title || "").trim();
  const normalizedBrand = String(brand || "").trim();
  if (!normalizedTitle || !normalizedBrand) return normalizedTitle;

  const escapedBrand = normalizedBrand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const leadingBrandPattern = new RegExp(`^${escapedBrand}(?:\\s+|[-:|]+\\s*)`, "i");
  const cleaned = normalizedTitle.replace(leadingBrandPattern, "").trim();
  return cleaned || normalizedTitle;
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
  return stripEnglishArticles(compactSnippet(value))
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

function localizeCardTitleZh(rawTitle: string): string {
  let text = stripEnglishArticles(compactSnippet(rawTitle));
  if (!text) return "";

  const replacements: Array<[RegExp, string]> = [
    [/\ball[\s-]*terrain\b/gi, "全地形"],
    [/\bwagon\b/gi, "拖车"],
    [/\bremy\b/gi, "瑞米"],
    [/\bbravo\b/gi, "博睿"],
    [/\b3\s*-\s*in\s*-\s*1\b/gi, "三合一"],
    [/\btrio\b/gi, "三件套"],
    [/\btravel\s+system\b/gi, "出行系统"],
    [/\binfant\s+car\s+seat\b/gi, "婴儿安全座椅"],
    [/\bcar\s+seat\b/gi, "安全座椅"],
    [/\bbalance\s+bike\b/gi, "平衡车"],
    [/\bkids?\s+bikes?\b/gi, "儿童自行车"],
    [/\bbikes?\b/gi, "自行车"],
    [/\btravel\s+stroller\b/gi, "旅行推车"],
    [/\bjogging\s+stroller\b/gi, "慢跑推车"],
    [/\blightweight\s+stroller\b/gi, "轻便推车"],
    [/\bstroller\b/gi, "推车"],
    [/\bkids?\s+scooters?\b/gi, "儿童滑板车"],
    [/\bscooters?\b/gi, "滑板车"],
    [/\belectric\s+vehicles?\b/gi, "儿童电动车"],
    [/\belectric\s+cars?\b/gi, "儿童电动车"],
    [/\bcar\s+seats?\b/gi, "儿童安全座椅"],
    [/\bsafety\s+seats?\b/gi, "儿童安全座椅"],
    [/\btoddler\b/gi, "幼儿"],
    [/\bdouble\s+twin\s+stroller\b/gi, "双人推车"],
    [/\btwin\s+stroller\b/gi, "双人推车"],
    [/\bglow\s+wheel\b/gi, "发光轮"],
    [/\bcolorful\s+led\b/gi, "彩色灯光"],
    [/\billuminated\b/gi, "发光"],
  ];

  for (const [pattern, replacement] of replacements) {
    text = text.replace(pattern, replacement);
  }

  return text.replace(/\s+/g, " ").trim();
}

function removeLatinFragmentsWhenZhPresent(rawTitle: string, brand: string): string {
  const title = compactSnippet(rawTitle);
  if (!title) return "";
  if (!containsCjk(title) || !/[A-Za-z]{2,}/.test(title)) return title;

  const escapedBrand = compactSnippet(brand).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  let next = title;
  if (escapedBrand) {
    next = next.replace(new RegExp(escapedBrand, "gi"), " ");
  }

  next = next
    .replace(/\b[A-Za-z][A-Za-z0-9'\-]{2,}\b/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^[\s\-–—|/:,]+|[\s\-–—|/:,]+$/g, "")
    .trim();

  return containsCjk(next) ? next : title;
}

function sanitizeZhCardSummary(summary: string, brand: string): string {
  let text = compactSnippet(summary);
  if (!text) return "";

  text = localizeCardTitleZh(text)
    .replace(/\b([23])\s*-\s*in\s*-\s*1\b/gi, (_, n: string) => (n === "2" ? "二合一" : "三合一"))
    .replace(/\btravel\s+system\b/gi, "出行系统")
    .replace(/\boverhead\b/gi, "登机")
    .replace(/\bcompact\b/gi, "紧凑")
    .replace(/\bready\b/gi, "即用")
    .replace(/\bez\b/gi, "易用");

  // When mixed EN/ZH still remains in the leading name phrase, force a zh-leading clause.
  const chunks = text.split(/([，,])/);
  if (chunks.length > 0) {
    const head = removeLatinFragmentsWhenZhPresent(chunks[0], brand);
    if (head && containsCjk(head)) {
      const lead = brand ? `${compactSnippet(brand)} ${head}`.trim() : head;
      chunks[0] = lead;
      text = chunks.join("");
    }
  }

  return text.replace(/\s+/g, " ").trim();
}

function buildCardDisplayTitle(product: Product, lang: "zh" | "en"): string {
  const localized = product as Product & {
    zh?: { name?: string };
    en?: { name?: string };
  };
  const zhName = String(localized.zh?.name || "").trim();
  const rawName = lang === "zh"
    ? (containsCjk(zhName) ? zhName : (localized.name || localized.en?.name || zhName))
    : localized.en?.name || localized.name || localized.zh?.name;
  const brand = compactSnippet(localized.brand || "");
  const name = stripEnglishArticles(stripRepeatedBrandPrefix(String(rawName || ""), brand));
  const resolvedName = lang === "zh"
    ? removeLatinFragmentsWhenZhPresent(localizeCardTitleZh(name), brand)
    : stripEnglishArticles(name);

  if (!brand) return resolvedName;
  if (!resolvedName) return brand;
  return `${brand} ${resolvedName}`.trim();
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
    "independently verified stroller or bicycle setup",
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

function pickLeadSentence(value: string): string {
  const text = compactSnippet(value);
  if (!text) return "";

  // Prefer a natural first sentence when punctuation exists.
  const sentenceMatch = text.match(/^([\s\S]*?[。！？!?.])(?=\s|$)/);
  if (sentenceMatch && sentenceMatch[1]) {
    return compactSnippet(sentenceMatch[1]);
  }

  // Fallback: split long marketplace-style names at common separators.
  const segmented = text.split(/(?:\s+\|\s+|\s+-\s+|\s*\/\s*|[，,;；])/).map((part) => compactSnippet(part)).filter(Boolean);
  return segmented[0] || text;
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
    return applyTemplate(template, { value: lbs, duty: dutyStr }, "{value} ({duty})");
  }
  const matchKg = textToSearch.match(/(\d+)\s*(?:kg|kilograms)/);
  if (matchKg) {
    const kg = matchKg[1];
    const lbs = Math.round(parseInt(kg) * 2.2);
    const dutyStr = lbs >= 100 ? "H" : "S";
    const template = lang === "zh" ? capacityCopy.formattedZh : capacityCopy.formattedEn;
    return applyTemplate(template, { value: String(lbs), duty: dutyStr }, "{value} ({duty})");
  }

  const category = (product.category || "").toLowerCase();
  const formatByLocale = (value: string, duty: string) => {
    const template = lang === "zh" ? capacityCopy.formattedZh : capacityCopy.formattedEn;
    return applyTemplate(template, { value, duty }, "{value} ({duty})");
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
  const localizedCardSummary = compactSnippet((product as Product & {
    zh?: { cardSummary?: string };
    en?: { cardSummary?: string };
  })[lang]?.cardSummary || product.cardSummary || "");
  const description = pickLocalizedDescription(product, lang);
  const customersSay = pickCustomersSay(product, lang);
  const candidates = [description, customersSay]
    .map((item) => compactSnippet(item))
    .map((item) => stripVisibleFieldLabels(item))
    .map((item) => stripRepeatedBrandPrefix(item, product.brand))
    .filter((item) => item && !isRatingStatsSummary(item) && !isPlaceholderVerdict(item) && !isCustomerReviewNarrative(item) && !isGenericCardSnippet(item));

  const summary = localizedCardSummary || candidates[0] || resolveGeneratedCardSummary(product, lang);
  if (!summary) return "";

  const localizedSummary = lang === "zh" ? sanitizeZhCardSummary(summary, product.brand || "") : summary;
  const leadSentence = pickLeadSentence(localizedSummary);
  return truncateCardSnippet(leadSentence, 220);
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
  const adminOnlyCategoryId = "other";
  const publicCategoryIdSet = new Set(preferredVisibleCategoryIds);

  const canAccessCategory = (categoryId: string) => {
    if (!categoryId) return false;
    if (categoryId === adminOnlyCategoryId) return false;
    return true;
  };

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
  const [selectedWheelCount, setSelectedWheelCount] = useState<string>("all");
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
    others: "other",
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
        const payload = await getBackendPickerPayload();
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
      if (canAccessCategory(activeCategory)) {
        setSelectedCategory(activeCategory);
      } else {
        setSelectedCategory("all");
      }
    }
  }, [activeCategory, selectedCategory, isAdmin]);

  const alignModuleToViewportTop = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    const absoluteTop = element.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: Math.max(0, absoluteTop), behavior: "smooth" });
  };

  useEffect(() => {
    if (localStorage.getItem("scrollToExpertPicks") === "true") {
      localStorage.removeItem("scrollToExpertPicks");
      setTimeout(() => {
        alignModuleToViewportTop("expert-picks-anchor");
      }, 150);
    }
  }, [selectedCategory, currentPage]);

  useEffect(() => {
    setSelectedBrand("all");
    setSelectedFrameMaterial("all");
    setSelectedTireType("all");
    setSelectedBrakeSystem("all");
    setSelectedWheelCount("all");
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
    if (!canAccessCategory(categoryId)) {
      setSelectedCategory("all");
      onCategoryChange?.("all");
      return;
    }
    setSelectedCategory(categoryId);
    onCategoryChange?.(categoryId);
  };

  const scrollToExpertPicks = () => {
    window.requestAnimationFrame(() => {
      alignModuleToViewportTop("expert-picks-anchor");
    });
  };

  const handlePageNavigate = (targetPage: number) => {
    localStorage.setItem("scrollToExpertPicks", "true");
    onPageChange?.(targetPage);
  };

  const getProductCategoryId = (product: Product): string => {
    const raw = String((product as any)?.categoryId || product?.category || "").trim().toLowerCase();
    const normalized = categoryAliasMap[raw] || raw;
    const inferred = inferMisclassifiedCategoryId(product, normalized);
    return publicCategoryIdSet.has(inferred) ? inferred : adminOnlyCategoryId;
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
        stroller: "Stroller",
        strollers: "Stroller",
        double_stroller: "Twin Stroller",
        double_strollers: "Twin Stroller",
        jogger_stroller: "Jogging Stroller",
        jogger_strollers: "Jogging Stroller",
        electric_vehicles: "Kids Electric Car",
        electric_car: "Kids Electric Car",
        kids_scooters: "Kids Scooter",
        scooters: "Kids Scooter",
        other: "Other",
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
          other: "其他",
        }
      : {
          balance: "Balance Bike",
          bicycle: "Pedal Bike",
          scooter: "Kick Scooter",
          stroller: "Stroller",
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
          other: "Other",
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
      if (id && id !== adminOnlyCategoryId && !excludedCategoryIds.has(id) && !hiddenCategoryOptionIds.has(id)) {
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

    const uniqueIds = Array.from(new Set(ids));

    return [
      { id: "all", label: allLabel },
      ...uniqueIds.map((id) => ({ id, label: humanizeCategoryId(id) })),
    ];
  }, [productsData, lang, backendCategoryNameMap]);

  const translatedProductsData = useMemo<Array<{ sourceCategoryId: string; sourceProduct: Product; product: Product }>>(() => {
    return productsData.map((sourceProduct) => ({
      sourceCategoryId: getProductCategoryId(sourceProduct),
      sourceProduct,
      product: translateProduct(sourceProduct, lang),
    }));
  }, [productsData, lang]);

  const translatedById = useMemo(() => {
    const map = new Map<string, Product>();
    translatedProductsData.forEach(({ sourceProduct, product }) => {
      map.set(String(sourceProduct.id || ""), product);
    });
    return map;
  }, [translatedProductsData]);

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

    const strollerPool = sortedItems.filter((item) => {
      return item.sourceCategoryId === "stroller" || includesAny(String(item.product.category || "").toLowerCase(), productLogicTokens.categorySignals.stroller);
    });

    const kidsScooterPool = sortedItems.filter((item) => {
      return item.sourceCategoryId === "kids_scooters" || item.sourceCategoryId === "scooters";
    });

    const selectedToddlerBike = toddlerBikePool.slice(0, 8);
    const selectedBalance = balanceToddlerPool.slice(0, 8);
    const selectedStroller = strollerPool.slice(0, 8);
    const selectedScooter = kidsScooterPool.slice(0, 8);

    // Dynamic interleaved list to keep variety engaging
    let firstPage: Array<{ sourceCategoryId: string; sourceProduct: Product; product: Product }> = [];
    for (let i = 0; i < 8; i++) {
      if (selectedToddlerBike[i]) firstPage.push(selectedToddlerBike[i]);
      if (selectedBalance[i]) firstPage.push(selectedBalance[i]);
      if (selectedStroller[i]) firstPage.push(selectedStroller[i]);
      if (selectedScooter[i]) firstPage.push(selectedScooter[i]);
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

  const isValidFacetValue = (value?: string) => {
    const normalized = String(value || "").trim().toLowerCase();
    return normalized.length > 0 && ![
      "n/a",
      "na",
      "none",
      "null",
      "undefined",
      "unknown",
      "not applicable",
      "not available",
      "not specified",
      "not provided",
      "unavailable",
      "-",
      "--",
    ].includes(normalized);
  };

  const normalizeFacetList = (values: Array<string | undefined>) => {
    return Array.from(
      new Set(
        values
          .map((value) => normalizeFacetValue(value))
          .filter((value) => isValidFacetValue(value))
      )
    ).sort((a, b) => a.localeCompare(b));
  };

  const normalizeBrandKey = (value?: string) => {
    return String(value || "")
      .normalize("NFKC")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  };

  const resolveCanonicalBrand = (product: Product): string => {
    const brandRaw = String(product.brand || "")
      .normalize("NFKC")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    const searchable = [
      brandRaw,
      product.name,
      product.description,
      (product as any)?.zh?.description,
      (product as any)?.en?.description,
    ]
      .map((item) => String(item || "").toLowerCase())
      .join(" ");

    if (searchable.includes("baby trend")) return "Baby Trend";
    if (/^baby$/i.test(brandRaw) && searchable.includes("trend")) return "Baby Trend";
    if (searchable.includes("bob gear") || /^bob$/i.test(brandRaw)) return "BOB Gear";
    if (searchable.includes("babyzen") || searchable.includes(" yoyo ")) return "Babyzen";
    if (searchable.includes("royalbaby") || searchable.includes("优贝")) return "RoyalBaby";
    return brandRaw;
  };

  const buildBrandFacetList = (products: Product[]) => {
    const byKey = new Map<string, string>();
    for (const product of products) {
      const label = resolveCanonicalBrand(product);
      if (!isValidFacetValue(label)) continue;
      const key = normalizeBrandKey(label);
      if (!key) continue;
      if (!byKey.has(key)) {
        byKey.set(key, label);
      }
    }
    return Array.from(byKey.values()).sort((a, b) => a.localeCompare(b));
  };

  const localizeMechanicalFacetValue = (value: string, facet: "tire" | "brake") => {
    if (lang !== "zh") return value;

    if (facet === "brake") {
      return localizeSafetyDisplayValue(value, lang);
    }

    const normalized = String(value ?? "").trim().toLowerCase();
    const tireMap: Record<string, string> = {
      "eva solid": "EVA 实心胎",
      "eva foam": "EVA 发泡胎",
      "eva foam / flat-free": "EVA 免充气发泡胎",
      "foam": "发泡胎",
      "honeycomb solid": "蜂窝实心胎",
      "pneumatic": "充气轮胎",
      "pu": "PU 实心轮",
      "rubber": "橡胶轮胎",
      "solid": "实心轮胎",
    };
    const mappedValue = tireMap[normalized];
    if (mappedValue) return mappedValue;
    return localizeMaterialDisplayValue(value, lang);
  };

  const localizeFrameMaterialValue = (value: string) => {
    return localizeMaterialDisplayValue(value, lang);
  };

  const resolveWheelCount = (value?: string) => {
    const normalized = String(value || "").trim().toLowerCase();
    const explicitCount = normalized.match(/^(\d+)\s*(?:-|_)?\s*(?:wheels?|轮)(?:\s*(?:count|个))?$/i);
    if (explicitCount) return explicitCount[1];
    if (/^[3-6]$/.test(normalized)) return normalized;
    return null;
  };

  const toFacetStrings = (value: unknown): string[] => {
    if (Array.isArray(value)) return value.flatMap(toFacetStrings);
    const text = String(value || "").trim();
    return text ? [text] : [];
  };

  const getWheelFacetValues = (product: Product): string[] => {
    const richProduct = product as Product & {
      Product_Specifications?: Record<string, Record<string, unknown>>;
      Category_Attributes?: Record<string, unknown>;
      Product_Display_Fields?: Record<string, { value?: unknown }>;
    };
    return Array.from(new Set([
      ...toFacetStrings(product.wheelSize),
      ...toFacetStrings(richProduct.Product_Specifications?.Measurements?.["Wheel Size"]),
      ...toFacetStrings(richProduct.Product_Specifications?.Category_Attributes?.wheelSize),
      ...toFacetStrings(richProduct.Category_Attributes?.wheelSize),
      ...toFacetStrings(richProduct.Product_Display_Fields?.wheelSize?.value),
    ].filter(isValidFacetValue)));
  };

  const resolveFrameMaterialClasses = (value: unknown): string[] => {
    const text = toFacetStrings(value).join(" | ").toLowerCase();
    if (!isValidFacetValue(text)) return [];

    const classes: string[] = [];
    if (/\balum(?:inum|inium|mum)\b|铝|鋁/.test(text)) classes.push("ALUMINUM");
    if (/carbon[\s-]*fiber|carbon[\s-]*fibre|碳纤维|碳纖維/.test(text)) classes.push("CARBON FIBER");
    if (/\bsteel\b|碳钢|钢|鋼/.test(text)) classes.push("STEEL");
    if (/engineering[\s-]*plastic|\b(?:abs|hdpe|pe|pp)\b|polyethylene|polypropylene|thermoplastic|plastic|resin|工程塑料|工程塑膠|树脂|樹脂|塑料|塑膠/.test(text)) {
      classes.push("ENGINEERING PLASTIC");
    }
    return classes;
  };

  const getFrameMaterialClasses = (product: Product): string[] => {
    const richProduct = product as Product & {
      Product_Specifications?: Record<string, Record<string, unknown>>;
      Category_Attributes?: Record<string, unknown>;
      Product_Display_Fields?: Record<string, { value?: unknown }>;
    };
    return resolveFrameMaterialClasses([
      product.material,
      richProduct.Product_Specifications?.Features_Specs?.["Frame Material"],
      richProduct.Product_Specifications?.Materials_Care?.Material,
      richProduct.Product_Specifications?.Category_Attributes?.materialClass,
      richProduct.Category_Attributes?.materialClass,
      richProduct.Product_Display_Fields?.frameMaterial?.value,
    ]);
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

  const isHelmetProduct = (sourceProduct: Product, translatedProduct: Product) => {
    const text = [
      sourceProduct.name,
      sourceProduct.description,
      sourceProduct.editorVerdict,
      translatedProduct.name,
      translatedProduct.description,
      translatedProduct.editorVerdict,
      sourceProduct.brand,
      translatedProduct.brand,
      sourceProduct.category,
      (sourceProduct as Product & { categoryId?: string }).categoryId,
    ]
      .map((item) => String(item || "").toLowerCase())
      .join(" ");

    return hasHelmetSignal(text);
  };

  const shouldExcludeFromElectricVehicles = (sourceProduct: Product, translatedProduct: Product) => {
    const text = [
      sourceProduct.name,
      sourceProduct.description,
      sourceProduct.editorVerdict,
      translatedProduct.name,
      translatedProduct.description,
      translatedProduct.editorVerdict,
      sourceProduct.brand,
      translatedProduct.brand,
      sourceProduct.category,
      (sourceProduct as Product & { categoryId?: string }).categoryId,
    ]
      .map((item) => String(item || "").toLowerCase())
      .join(" ");

    const hasHelmetSignalMatched = hasHelmetSignal(text);
    const hasRideOnPushCarSignal = /(ride[-\s]*on\s+push\s+car|\bpush\s+car\b|推行车|推车玩具)/i.test(text);
    const hasWiggleCarSignal = /(\bwiggle\s+car\b|扭扭车)/i.test(text);
    return hasHelmetSignalMatched || hasRideOnPushCarSignal || hasWiggleCarSignal;
  };

  const matchesStrollerBoundary = (sourceProduct: Product, translatedProduct: Product) => {
    const text = [
      sourceProduct.name,
      sourceProduct.description,
      sourceProduct.editorVerdict,
      translatedProduct.name,
      translatedProduct.description,
      translatedProduct.editorVerdict,
      sourceProduct.category,
      (sourceProduct as Product & { categoryId?: string }).categoryId,
    ]
      .map((item) => String(item || "").toLowerCase())
      .join(" ");

    const hasStrollerSignal = /(stroller|pram|pushchair|buggy|jogger|jogging|travel\s+system|umbrella\s+stroller|double\s+stroller|twin\s+stroller|推车|婴儿车|慢跑推车|双人推车)/i.test(text);
    const hasBlockedSignal = /(wagon|wagons|pull\s+along|ride[-\s]*on|push\s*ride\s*on|\bpush\s+car\b|playard|play\s*yard|pack\s*(?:n|and)\s*play|travel\s*crib|crib|bassinet|推行车|推骑|拖车|拉车|游戏床|婴儿床|睡床|扭扭车|wiggle\s+car)/i.test(text);
    return hasStrollerSignal && !hasBlockedSignal;
  };

  const selectedCategoryProducts = useMemo<Product[]>(() => {
    if (!selectedCategory || selectedCategory === "all") {
      return [] as Product[];
    }
    if (!canAccessCategory(selectedCategory)) {
      return [] as Product[];
    }
    return translatedProductsData
      .filter(({ sourceCategoryId, sourceProduct, product }) => {
        if (sourceCategoryId !== selectedCategory) return false;
        if (isHelmetProduct(sourceProduct, product)) return false;
        if (selectedCategory === "stroller" && !matchesStrollerBoundary(sourceProduct, product)) return false;
        if (selectedCategory === "electric_vehicles" && shouldExcludeFromElectricVehicles(sourceProduct, product)) {
          return false;
        }
        return true;
      })
      .map(({ product }) => product);
  }, [translatedProductsData, selectedCategory, isAdmin]);

  const categoryFilterOptions = useMemo(() => {
    const brands = buildBrandFacetList(selectedCategoryProducts);
    const frameMaterials = Array.from(
      new Set<string>(selectedCategoryProducts.flatMap((item: Product) => getFrameMaterialClasses(item)))
    ).sort((left, right) => ["ALUMINUM", "CARBON FIBER", "STEEL", "ENGINEERING PLASTIC"].indexOf(left) - ["ALUMINUM", "CARBON FIBER", "STEEL", "ENGINEERING PLASTIC"].indexOf(right));
    const tireTypes = normalizeFacetList(selectedCategoryProducts.map((item: Product) => item.tireType));
    const brakeSystems = normalizeFacetList(selectedCategoryProducts.map((item: Product) => item.brakeType));
    const rawWheelValues = normalizeFacetList(selectedCategoryProducts.flatMap((item: Product) => getWheelFacetValues(item)));
    const wheelCounts = Array.from(
      new Set(rawWheelValues.map((value) => resolveWheelCount(value)).filter((value): value is string => Boolean(value)))
    ).sort((left, right) => Number(left) - Number(right));
    const wheelSizes = rawWheelValues.filter((value) => resolveWheelCount(value) === null);
    const certifications = normalizeFacetList(
      selectedCategoryProducts.flatMap((item: Product) => item.compliance || [])
    );
    return { brands, frameMaterials, tireTypes, brakeSystems, wheelCounts, wheelSizes, certifications };
  }, [selectedCategoryProducts]);

  const mechanicalFacetCategories = new Set([
    "stroller",
    "balance_bike",
    "kids_bikes",
    "kids_scooters",
    "electric_vehicles",
  ]);
  const categoryFacetVisibility = {
    brand: categoryFilterOptions.brands.length > 0,
    frame: mechanicalFacetCategories.has(selectedCategory) && categoryFilterOptions.frameMaterials.length > 0,
    tire: mechanicalFacetCategories.has(selectedCategory) && categoryFilterOptions.tireTypes.length > 0,
    brake: mechanicalFacetCategories.has(selectedCategory) && categoryFilterOptions.brakeSystems.length > 0,
    wheelCount: mechanicalFacetCategories.has(selectedCategory) && categoryFilterOptions.wheelCounts.length > 0,
    wheel: mechanicalFacetCategories.has(selectedCategory) && categoryFilterOptions.wheelSizes.length > 0,
    certification: categoryFilterOptions.certifications.length > 0,
  };

  const categoryBaseCount = useMemo(() => {
    return translatedProductsData
      .filter(({ sourceCategoryId, sourceProduct, product }) => {
        if (!canAccessCategory(sourceCategoryId)) {
          return false;
        }
        if (excludedCategoryIds.has(sourceCategoryId)) {
          return false;
        }
        if (isHelmetProduct(sourceProduct, product)) {
          return false;
        }
        const matchesCategory = selectedCategory === "all" || sourceCategoryId === selectedCategory;
        const matchesScooterBoundary =
          selectedCategory !== "kids_scooters" || matchesKidsScootersBoundary(sourceProduct, product);
        const matchesStrollerBoundaryFilter =
          selectedCategory !== "stroller" || matchesStrollerBoundary(sourceProduct, product);
        const matchesElectricVehiclesBoundary =
          selectedCategory !== "electric_vehicles" || !shouldExcludeFromElectricVehicles(sourceProduct, product);
        return matchesCategory && matchesScooterBoundary && matchesStrollerBoundaryFilter && matchesElectricVehiclesBoundary;
      }).length;
  }, [translatedProductsData, selectedCategory, isAdmin]);

  const getSeoHintTarget = (hint: string) => {
    const normalized = String(hint ?? "").trim().toLowerCase();
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
    const sortedItems = translatedProductsData
      .filter(({ product: p, sourceCategoryId, sourceProduct }) => {
        if (!canAccessCategory(sourceCategoryId)) {
          return false;
        }
        if (excludedCategoryIds.has(sourceCategoryId)) {
          return false;
        }
        if (isHelmetProduct(sourceProduct, p)) {
          return false;
        }
        const matchesCategory = selectedCategory === "all" || sourceCategoryId === selectedCategory;
        const normalizedQuery = searchQuery.trim().toLowerCase();
        const matchesSearch = normalizedQuery === "" ||
          toLowerSafe(p.name).includes(normalizedQuery) ||
          toLowerSafe(p.brand).includes(normalizedQuery) ||
          toLowerSafe(p.material).includes(normalizedQuery) ||
          toLowerSafe(p.tireType).includes(normalizedQuery);
          
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
          matchesType = includesAny(toLowerSafe(p.name), productLogicTokens.twinSignals);
        }

        let matchesPower = true;
        if (selectedPower === "electric") {
          matchesPower = includesAny(toLowerSafe(p.name), productLogicTokens.electricSignals) || includesAny(toLowerSafe(p.id), productLogicTokens.electricSignals);
        }

        const needsCategoryFacetFilter = selectedCategory !== "all";
        const matchesBrand = !needsCategoryFacetFilter || !categoryFacetVisibility.brand || selectedBrand === "all" || resolveCanonicalBrand(p) === selectedBrand;
        const matchesFrameMaterial = !needsCategoryFacetFilter || !categoryFacetVisibility.frame || selectedFrameMaterial === "all" || getFrameMaterialClasses(p).includes(selectedFrameMaterial);
        const matchesTireType = !needsCategoryFacetFilter || !categoryFacetVisibility.tire || selectedTireType === "all" || normalizeFacetValue(p.tireType) === selectedTireType;
        const matchesBrakeSystem = !needsCategoryFacetFilter || !categoryFacetVisibility.brake || selectedBrakeSystem === "all" || normalizeFacetValue(p.brakeType) === selectedBrakeSystem;
        const wheelFacetValues = getWheelFacetValues(p);
        const matchesWheelCount = !needsCategoryFacetFilter || !categoryFacetVisibility.wheelCount || selectedWheelCount === "all" || wheelFacetValues.some((value) => resolveWheelCount(value) === selectedWheelCount);
        let matchesWheelSize = true;
        if (needsCategoryFacetFilter && categoryFacetVisibility.wheel && selectedWheelSize !== "all") {
          const targetStr = selectedWheelSize.toLowerCase();
          matchesWheelSize = wheelFacetValues
            .filter((value) => resolveWheelCount(value) === null)
            .some((value) => {
              const valStr = normalizeFacetValue(value).toLowerCase();
              if (targetStr === "12" || targetStr === "12-inch" || targetStr === "12inch" || targetStr.includes("12")) {
                return valStr.includes("12");
              }
              return valStr === targetStr || valStr.includes(targetStr);
            });
        }

        const matchesCertification =
          !needsCategoryFacetFilter ||
          !categoryFacetVisibility.certification ||
          selectedCertification === "all" ||
          (p.compliance || []).map((item: string) => normalizeFacetValue(item)).includes(selectedCertification);

        const matchesScooterBoundary =
          selectedCategory !== "kids_scooters" || matchesKidsScootersBoundary(sourceProduct, p);
        const matchesStrollerBoundaryFilter =
          selectedCategory !== "stroller" || matchesStrollerBoundary(sourceProduct, p);
        const matchesElectricVehiclesBoundary =
          selectedCategory !== "electric_vehicles" || !shouldExcludeFromElectricVehicles(sourceProduct, p);

        return (
          matchesCategory &&
          matchesSearch &&
          matchesAge &&
          matchesPrice &&
          matchesBrand &&
          matchesFrameMaterial &&
          matchesTireType &&
          matchesBrakeSystem &&
          matchesWheelCount &&
          matchesWheelSize &&
          matchesCertification &&
          matchesScooterBoundary &&
          matchesStrollerBoundaryFilter &&
          matchesElectricVehiclesBoundary &&
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
        selectedWheelCount === "all" &&
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
    selectedWheelCount,
    selectedWheelSize,
    selectedCertification,
    translatedProductsData,
    backendCategoryNameMap,
    isAdmin,
  ]);

  const pageSize = selectedCategory === "all" ? 32 : 9;
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const pagedProducts = filteredProducts.slice((safePage - 1) * pageSize, safePage * pageSize);
  const productsSeoPillTags = [
    { id: "balance_bike_toddler", label: productsCopy.seoPills.balanceBikeToddler, target: "balance_bike" },
    { id: "twin_stroller", label: productsCopy.seoPills.twinStroller, target: "stroller" },
    { id: "toddler_bike", label: productsCopy.seoPills.toddlerBike, target: "kids_bikes" },
    { id: "kids_electric_scooter", label: productsCopy.seoPills.kidsScooter, target: "kids_scooters" },
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
            items={items.map((item, index) => index === 0 && lang === "zh" && item.label === "产品列表" ? { ...item, label: "产品中心" } : item)}
          />
        );
      })()}

      {/* Compact Atmospheric Title Description Block (PRD 4.2.1) */}
      <section className="relative rounded-[32px] bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white overflow-hidden p-8 md:p-12 text-left max-w-7xl mx-auto shadow-xl space-y-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(249,115,22,0.15),transparent)]"></div>
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-500/15 border border-orange-500/30 text-orange-400 text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg backdrop-blur-md">
            {productsCopy.topBadge}
          </div>

          <h1 className="km-page-title km-home-statement-title text-white max-w-5xl drop-shadow-md">
            {productsCopy.heroTitle}
          </h1>

          <div className="border-l-2 border-orange-500 pl-4 space-y-2">
            <p className="km-body-copy text-slate-200 text-sm md:text-base font-semibold max-w-5xl drop-shadow-sm">
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
                  
                  const targetPath = `/products/${pill.target}`;

                  // Force routing transition inside SPA context
                  window.history.pushState(null, "", targetPath);
                  window.dispatchEvent(new PopStateEvent("popstate"));

                  // Scroll smoothly to ## Expert Product Picks list
                  setTimeout(() => {
                    const element = document.getElementById("expert-picks-anchor");
                    if (element) {
                      alignModuleToViewportTop("expert-picks-anchor");
                    }
                  }, 100);
                }}
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-[11px] font-black tracking-widest uppercase shadow-md cursor-pointer group transition-all duration-300 border backdrop-blur-md ${
                  hintFlash === pill.label
                    ? "bg-orange-500 text-white border-orange-300 scale-105 shadow-orange-500/25"
                    : pill.target === selectedCategory
                      ? "bg-orange-500/90 text-white border-orange-300 shadow-orange-500/20"
                      : "bg-white/10 hover:bg-white/20 border-white/25 text-slate-100 hover:border-white/45"
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
                  {categoryFacetVisibility.brand && <div className="space-y-1">
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
                  </div>}

                  {categoryFacetVisibility.frame && <div className="space-y-1">
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
                        <option key={item} value={item}>{localizeFrameMaterialValue(item)}</option>
                      ))}
                    </select>
                  </div>}

                  {categoryFacetVisibility.tire && <div className="space-y-1">
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
                        <option key={item} value={item}>{localizeMechanicalFacetValue(item, "tire")}</option>
                      ))}
                    </select>
                  </div>}

                  {categoryFacetVisibility.brake && <div className="space-y-1">
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
                        <option key={item} value={item}>{localizeMechanicalFacetValue(item, "brake")}</option>
                      ))}
                    </select>
                  </div>}

                  {categoryFacetVisibility.wheelCount && <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block pl-1">{productsCopy.filterFacets.wheelCountLabel}</span>
                    <select
                      value={selectedWheelCount}
                      onChange={(e) => setSelectedWheelCount(e.target.value)}
                      title={productsCopy.filterFacets.selectWheelCount}
                      aria-label={productsCopy.filterFacets.selectWheelCount}
                      className="w-full px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-tight border bg-white text-slate-700 border-slate-200"
                    >
                      <option value="all">{productsCopy.filterFacets.allOption}</option>
                      {categoryFilterOptions.wheelCounts.map((item) => (
                        <option key={item} value={item}>{lang === "zh" ? `${item} 轮` : `${item}-WHEEL`}</option>
                      ))}
                    </select>
                  </div>}

                  {categoryFacetVisibility.wheel && <div className="space-y-1">
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
                  </div>}

                  {categoryFacetVisibility.certification && <div className="space-y-1">
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
                  </div>}
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
                  setSelectedWheelCount("all");
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
                  <h2 className="km-section-title text-slate-900 flex flex-wrap items-center gap-2">
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
                  const productSeoTitle = getProductDisplayTitle(p, lang);
                  const productCardTitle = buildCardDisplayTitle(diProduct, lang) || productSeoTitle;

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
                aria-label={`${productsCopy.productCard.viewMetricsAriaPrefix} ${productCardTitle}`}
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

                  <h3 className="km-card-title text-slate-900 group-hover:text-orange-500 transition-colors">
                    {productCardTitle}
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
              onClick={() => handlePageNavigate(Math.max(1, safePage - 1))}
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
              aria-label={applyTemplate(productsCopy.pagination.pageAriaTemplate, { current: String(safePage), total: String(totalPages) }, `Page ${safePage} of ${totalPages}`)}
            >
              <div
                className="h-full bg-slate-900 rounded-full transition-all"
                style={{ width: `${Math.max(8, (safePage / totalPages) * 100)}%` }}
              />
            </div>
            <button
              onClick={() => handlePageNavigate(Math.min(totalPages, safePage + 1))}
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
              <h2 className="km-section-title text-slate-900">
                {productsCopy.history.title}
              </h2>
              <p className="km-heading-copy km-body-copy text-slate-400 text-xs font-semibold">
                {productsCopy.history.subtitle}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {viewHistory.slice(0, 4).map(p => {
              const dp = translatedById.get(String(p.id || "")) || translateProduct(p, lang);
              const historySeoTitle = getProductDisplayTitle(p, lang);
              const historyDisplayTitle = buildCardDisplayTitle(dp, lang) || historySeoTitle;
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
                      {historyDisplayTitle}
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
