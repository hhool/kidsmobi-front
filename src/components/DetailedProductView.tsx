import React, { useState } from "react";
import { 
  ArrowLeft, 
  ShieldCheck, 
  Play,
  Image as ImageIcon,
  Maximize2
} from "lucide-react";
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer, 
  Tooltip 
} from "recharts";
import { Product, CMSSettings } from "../types";
import { translateProduct } from "../lib/translate";
import { resolveProductImages } from "../lib/productImages";
import { getProductDisplayTitle } from "../lib/productSeoText";
import { cleanVisibleSourceText } from "../lib/visibleText";
import { getSpecFieldLabel, normalizeSpecDisplayValue, toSpecKey } from "../lib/specLexicon";
import ProductCarousel from "./ProductCarousel";
import Breadcrumbs from "./Breadcrumbs";

type WorkerDetailResource = {
  resourceId?: string;
  resourceType?: string;
  title?: string;
  summary?: string;
  resourceUrl?: string;
  videoUrls?: string[];
};

const CURATED_PRODUCT_DETAIL_CONTENT: Record<string, { highlightedFeatures: string[]; productDescription: string }> = {
  b07y5vqyfw: {
    highlightedFeatures: [
      "3 strollers in 1: Infant Car Seat Carrier, Infant Pramette, and Toddler Stroller to stroll from infant to toddler",
      "Reversible stroller seat can face parent or the world, for just the right ride as baby grows",
      "Toddler seat converts to an infant pramette mode, for comfortable strolls with baby",
      "Includes the Graco SnugRide 35 Lite DLX Infant Car Seat, rear-facing for infants from 4-35 lb and up to 32\" for an easy transition from car to stroller",
      "One-hand stroller fold for easy storage and transportation",
    ],
    productDescription:
      "Discover a world of convenience for you and comfort for your child with the Graco Modes Pramette Travel System. This multi-functional set includes a Graco SnugRide 35 Infant Car Seat and a versatile stroller that converts from an Infant Car Seat Carrier to a Toddler Stroller, based on your baby's growing needs. Manufactured from sturdy and elegant polyester, this imported set makes baby's transition from car to stroller a breeze. It also includes premium features like a one-hand fold for easy storage, a reversible seat, and a removable child's tray with cup holders for ultimate convenience on every ride.",
  },
};

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

function resolveCustomersSay(product: Product, lang: "zh" | "en"): string {
  const localized = (product as Product & {
    zh?: { customersSay?: string };
    en?: { customersSay?: string };
  })[lang]?.customersSay;
  const rawText = String(localized || product.customers_say || product.customersSay || "")
    .replace(/\s+/g, " ")
    .trim();
  const lower = rawText.toLowerCase();
  if (!rawText) return "";

  const isStatsLine =
    /^rated\s+\d(?:\.\d+)?\s+out\s+of\s+5\b/.test(lower) ||
    /^backed\s+by\s+[\d,]+\s+customer\s+reviews\b/.test(lower) ||
    /^\d(?:\.\d+)?\s+\d(?:\.\d+)?\s+out\s+of\s+5\s+stars\b/.test(lower) ||
    /^\(?[\d,]+\)?\s+customer\s+reviews\b/.test(lower);

  return isStatsLine ? "" : rawText;
}

function resolveDescriptionText(product: Product, lang: "zh" | "en"): string {
  const localized = product as Product & {
    description?: string;
    Product_Description?: string;
    product_description?: string;
    productDescription?: string;
    zh?: { description?: string; customersSay?: string };
    en?: { description?: string; customersSay?: string };
  };

  const localizedCandidates = lang === "zh"
    ? [localized.zh?.description]
    : [
        localized.en?.description,
        localized.Product_Description,
        localized.product_description,
        localized.productDescription,
        localized.description,
      ];
  const candidates = [
    ...localizedCandidates,
    localized[lang]?.customersSay,
    localized.customers_say,
    localized.customersSay,
  ]
    .map((value) => String(value || "").replace(/\s+/g, " ").trim())
    .filter(Boolean);

  for (const text of candidates) {
    const lower = text.toLowerCase();
    const comparable = lower.replace(/[^a-z0-9\u4e00-\u9fff]+/g, " ").trim();
    const comparableName = String(product.name || "").toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, " ").trim();
    const comparableBrandName = `${String(product.brand || "").toLowerCase()} ${comparableName}`.replace(/\s+/g, " ").trim();
    if (lower.includes("product description")) continue;
    if (lower.includes("generated from remote fallback")) continue;
    if (text.includes("由远端数据回退生成")) continue;
    if (comparable === comparableName || comparable === comparableBrandName) continue;
    if (lang === "zh" && !/[\u4e00-\u9fff]/.test(text)) continue;
    if (/^rated\s+\d(?:\.\d+)?\s+out\s+of\s+5\b/i.test(text)) continue;
    if (/^backed\s+by\s+[\d,]+\s+customer\s+reviews\b/i.test(text)) continue;
    if (/^\d(?:\.\d+)?\s+\d(?:\.\d+)?\s+out\s+of\s+5\s+stars\b/i.test(text)) continue;
    if (/^\(?[\d,]+\)?\s+customer\s+reviews\b/i.test(text)) continue;
    return text;
  }

  return "";
}

function resolveApplicableAgeRange(product: Product, lang: "zh" | "en"): string {
  const richProduct = product as Product & {
    description?: string;
    Product_Description?: string;
    product_description?: string;
    productDescription?: string;
    en?: { description?: string };
    Product_Specifications?: Record<string, Record<string, unknown>>;
    Category_Attributes?: Record<string, unknown>;
  };
  const sources = [
    richProduct.en?.description,
    richProduct.Product_Description,
    richProduct.product_description,
    richProduct.productDescription,
    richProduct.description,
    product.name,
    richProduct.Product_Specifications?.Item_Details?.["Age Range (Description)"],
    richProduct.Product_Specifications?.Item_Details?.["Age Range Description"],
    richProduct.Category_Attributes?.["Age Range (Description)"],
    richProduct.Category_Attributes?.["Age Range Description"],
  ].map((value) => String(value || "").replace(/\s+/g, " ").trim()).filter(Boolean);
  const evidence = sources.join(" ");

  const yearRange = evidence.match(/(?:ages?\s*)?(\d+(?:\.\d+)?)\s*(?:-|–|—|to)\s*(\d+(?:\.\d+)?)\s*(?:years?|yrs?|year[ -]?olds?)/i);
  if (yearRange) {
    return lang === "zh" ? `${yearRange[1]}-${yearRange[2]}岁` : `${yearRange[1]}-${yearRange[2]} years`;
  }

  const monthRange = evidence.match(/(?:ages?\s*)?(\d+(?:\.\d+)?)\s*(?:-|–|—|to)\s*(\d+(?:\.\d+)?)\s*months?/i);
  if (monthRange) {
    return lang === "zh" ? `${monthRange[1]}-${monthRange[2]}个月` : `${monthRange[1]}-${monthRange[2]} months`;
  }

  const minimumAge = evidence.match(/(?:ages?\s*)?(\d+(?:\.\d+)?)\s*(?:years?|yrs?|year[ -]?olds?)?\s*(?:and up|or older|\+)/i);
  if (minimumAge) {
    return lang === "zh" ? `${minimumAge[1]}岁以上` : `${minimumAge[1]}+ years`;
  }

  const maximumAgeValue = richProduct.Product_Specifications?.User_Guide?.["Maximum Age Recommendation"];
  const maximumAge = Number(String(maximumAgeValue || "").match(/\d+(?:\.\d+)?/)?.[0]);
  const descriptor = evidence.toLowerCase();
  let range: [number, number] | null = null;
  if (/\bnewborn\b/.test(descriptor)) range = [0, 1];
  else if (/\binfants?\b/.test(descriptor)) range = [0, 2];
  else if (/\btoddlers?\b/.test(descriptor)) range = [2, 5];
  else if (/\bkids?\b|\bchildren\b|\bchild\b/.test(descriptor)) range = [5, 12];
  else if (/\bteens?\b/.test(descriptor)) range = [13, Number.isFinite(maximumAge) && maximumAge >= 13 ? maximumAge : 17];

  if (range) {
    return lang === "zh" ? `${range[0]}-${range[1]}岁` : `${range[0]}-${range[1]} years`;
  }

  return normalizeSpecDisplayValue(product.ageRange, "age_range", lang);
}

function resolveResourceDescription(resources: WorkerDetailResource[]): string {
  const overview = resources.find((item) => String(item?.resourceType || "").toLowerCase() === "product_overview");
  const candidates = [overview?.summary, overview?.title];
  for (const value of candidates) {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    if (text.length >= 80) {
      return text;
    }
  }
  return "";
}

function resolveCuratedDetailContent(product: Product): { highlightedFeatures: string[]; productDescription: string } | null {
  const asin =
    extractAsin((product as any)?.ASIN) ||
    extractAsin((product as any)?.productId) ||
    extractAsin(product.id);
  if (!asin) return null;
  return CURATED_PRODUCT_DETAIL_CONTENT[asin] || null;
}

function resolveVerdictText(product: Product, lang: "zh" | "en"): string {
  const localizedVerdict = String(((product as Product & {
    zh?: { editorVerdict?: string };
    en?: { editorVerdict?: string };
  })[lang]?.editorVerdict) || "").trim();
  // Keep detail verdict strictly locale-driven to avoid stale top-level fallback content.
  const verdict = localizedVerdict;
  const customersSay = resolveCustomersSay(product, lang);
  const isVerdictPlaceholder = isPlaceholderVerdict(verdict);

  if (!isVerdictPlaceholder && verdict) {
    return verdict;
  }
  
  if (customersSay) {
    return customersSay;
  }
  
  // Return empty string - no placeholder text for SEO health
  return "";
}

function extractAsin(value: unknown): string {
  const raw = String(value || "").trim();
  const match = raw.match(/[A-Z0-9]{10}/i);
  return match ? match[0].toLowerCase() : "";
}

function getVideoRenderType(url: string): "direct" | "hls" | "embed" | "none" {
  const normalized = String(url || "").trim().toLowerCase();
  if (!normalized) return "none";
  if (/\.m3u8(\?|#|$)/.test(normalized)) return "none";
  if (/\.(mp4|webm|ogg)(\?|#|$)/.test(normalized)) return "direct";
  if (/youtube\.com|youtu\.be|vimeo\.com/.test(normalized)) return "embed";
  return "embed";
}

function isUnsupportedVideoUrl(url: string) {
  return /\.m3u8(\?|#|$)/i.test(String(url || "").trim());
}

function isLikelyVideoUrl(url: string): boolean {
  const normalized = String(url || "").trim().toLowerCase();
  if (!normalized) return false;
  if (/youtube\.com|youtu\.be|vimeo\.com/.test(normalized)) return true;
  return /\.(mp4|webm|ogg|m3u8)(\?|#|$)/.test(normalized);
}

function normalizeDetailCategoryId(product: Product): string {
  const explicit = String((product as any)?.categoryId || "").trim();
  if (explicit) return explicit;

  switch (product.category) {
    case "balance":
      return "balance_bike";
    case "bicycle":
      return "kids_bikes";
    case "scooter":
      return "scooters";
    case "electric_car":
      return "electric_vehicles";
    case "tricycle":
      return "kids_tricycles";
    case "safety_seat":
      return "car_seat";
    case "stroller":
    default:
      return "stroller";
  }
}

function cleanVisibleFieldText(value: unknown) {
  return cleanVisibleSourceText(value)
    .replace(/^editor\s+verdict\s*[:：-]\s*/i, "")
    .replace(/\s*\(\s*Features\[\d+\]\s*\)\s*/gi, " ")
    .replace(/\s*\(\s*Product\s+Feature\s*\)\s*/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatSpecKey(key: string, lang: "zh" | "en") {
  return getSpecFieldLabel(key, lang);
}

function formatSpecValue(value: unknown, rawKey: string, lang: "zh" | "en"): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) {
    return value.map((item) => formatSpecValue(item, rawKey, lang)).filter(Boolean).join(", ");
  }
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, entryValue]) => {
        const nestedValue = formatSpecValue(entryValue, key, lang);
        if (!isMeaningfulStructuredValue(nestedValue)) return "";
        return `${formatSpecKey(key, lang)}: ${nestedValue}`;
      })
      .filter((item) => item.trim())
      .join(" | ");
  }

  const key = toSpecKey(rawKey);
  const text = cleanVisibleFieldText(value);
  if (!text) return "";
  return normalizeSpecDisplayValue(text, key, lang);
}

function resolveFeatureList(product: Product, lang: "zh" | "en"): string[] {
  const localizedProduct = product as Product & {
    zh?: { features?: unknown[] };
    en?: { features?: unknown[] };
    features?: unknown[];
  };

  const candidates = lang === "zh"
    ? [localizedProduct.zh?.features, localizedProduct.features]
    : [localizedProduct.en?.features, localizedProduct.features];

  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue;
    const values = candidate.map((item) => cleanVisibleFieldText(item)).filter(Boolean);
    if (values.length > 0) {
      return values;
    }
  }

  return [];
}

function buildBasicInfoSections(sourceProduct: Product, displayProduct: Product, lang: "zh" | "en", applicableAgeRange: string) {
  const richProduct = displayProduct as Product & {
    Product_Specifications?: Record<string, unknown>;
    Category_Attributes?: Record<string, unknown>;
    Product_Display_Fields?: Record<string, { value?: unknown; source?: unknown }>;
    classification?: Record<string, unknown>;
    categoryAttributes?: Record<string, unknown>;
    featureCards?: Array<{ featureLabel?: unknown; featureValue?: unknown; featureEvidence?: unknown }>;
    specsText?: string;
  };
  const specs = richProduct.Product_Specifications || {};
  const sectionOrder = [
    "Measurements",
    "Features_Specs",
    "Materials_Care",
    "User_Guide",
    "Features",
  ];
  const sectionLabels: Record<string, { zh: string; en: string }> = {
    Measurements: { zh: "尺寸与重量", en: "Measurements" },
    Features_Specs: { zh: "功能规格", en: "Features Specs" },
    Materials_Care: { zh: "材质与护理", en: "Materials & Care" },
    User_Guide: { zh: "使用指南", en: "User Guide" },
    Features: { zh: "核心亮点", en: "Top Features" },
  };

  const sections = sectionOrder
    .map((sectionKey) => {
      if (sectionKey === "Features") {
        const featureRows = resolveFeatureList(sourceProduct, lang);
        if (featureRows.length === 0) return null;

        return {
          key: sectionKey,
          label: sectionLabels[sectionKey]?.zh || sectionLabels[sectionKey]?.en || (lang === "zh" ? "核心亮点" : "Top Features"),
          labelEn: sectionLabels[sectionKey]?.en || "Top Features",
          rows: featureRows.map((value, index) => ({
            label: lang === "zh" ? "核心亮点" : "Top Features",
            value,
          })),
        };
      }

      const sectionValue = specs[sectionKey];
      if (!sectionValue || typeof sectionValue !== "object") return null;

      let rows = Object.entries(sectionValue as Record<string, unknown>)
        .map(([key, value]) => ({
          rawKey: key,
          label: formatSpecKey(key, lang),
          value: ["age_range", "age_range_description", "recommended_age"].includes(toSpecKey(key))
            ? applicableAgeRange
            : formatSpecValue(value, key, lang),
        }))
        .filter((item) => item.value);

      if (sectionKey === "Item_Details") {
        rows = rows.filter((item) => !/^(title|标题)$/i.test(String(item.label || "").trim()));
      }

      if (!rows.length) return null;

      return {
        key: sectionKey,
        label: sectionLabels[sectionKey]?.zh || sectionLabels[sectionKey]?.en || formatSpecKey(sectionKey, lang),
        labelEn: sectionLabels[sectionKey]?.en || formatSpecKey(sectionKey, lang),
        rows,
      };
    })
    .filter(Boolean) as Array<{
      key: string;
      label: string;
      labelEn: string;
      rows: Array<{ label: string; value: string }>;
    }>;

  if (sections.length > 0) {
    return sections;
  }

  const fallbackSections: Array<{
    key: string;
    label: string;
    labelEn: string;
    rows: Array<{ label: string; value: string }>;
  }> = [];

  const fallbackRowsFromObject = (value: Record<string, unknown>) =>
    Object.entries(value)
      .map(([key, itemValue]) => ({
        label: formatSpecKey(key, lang),
        value: formatSpecValue(itemValue, key, lang),
      }))
      .filter((item) => item.value);

  const categoryAttributesRows = fallbackRowsFromObject(richProduct.Category_Attributes || {});
  if (categoryAttributesRows.length > 0) {
    fallbackSections.push({
      key: "Category_Attributes",
      label: lang === "zh" ? "类目属性" : "Category Attributes",
      labelEn: "Category Attributes",
      rows: categoryAttributesRows,
    });
  }

  const displayFieldRows = Object.entries(richProduct.Product_Display_Fields || {})
    .map(([key, field]) => ({
      label: formatSpecKey(key, lang),
      value: ["age_range", "age_range_description", "recommended_age"].includes(toSpecKey(key))
        ? applicableAgeRange
        : formatSpecValue(field?.value, key, lang),
    }))
    .filter((item) => item.value);

  if (displayFieldRows.length > 0) {
    fallbackSections.push({
      key: "Product_Display_Fields",
      label: lang === "zh" ? "展示字段" : "Display Fields",
      labelEn: "Display Fields",
      rows: displayFieldRows,
    });
  }

  const classificationRows = fallbackRowsFromObject(richProduct.classification || {});
  if (classificationRows.length > 0) {
    fallbackSections.push({
      key: "classification",
      label: lang === "zh" ? "分类特征" : "Classification",
      labelEn: "Classification",
      rows: classificationRows,
    });
  }

  const rawCategoryAttributeRows = fallbackRowsFromObject(richProduct.categoryAttributes || {});
  if (rawCategoryAttributeRows.length > 0) {
    fallbackSections.push({
      key: "categoryAttributes",
      label: lang === "zh" ? "原始类目属性" : "Raw Category Attributes",
      labelEn: "Raw Category Attributes",
      rows: rawCategoryAttributeRows,
    });
  }

  const featureCardsRows = (richProduct.featureCards || [])
    .map((card, index) => {
      const label = cleanVisibleFieldText(card.featureLabel || card.featureValue) || `${lang === "zh" ? "特征" : "Feature"} ${index + 1}`;
      const value = cleanVisibleFieldText(card.featureEvidence || card.featureValue || card.featureLabel);
      return {
        label,
        value,
      };
    })
    .filter((item) => item.value);

  if (featureCardsRows.length > 0) {
    fallbackSections.push({
      key: "featureCards",
      label: lang === "zh" ? "关键特性" : "Key Features",
      labelEn: "Key Features",
      rows: featureCardsRows,
    });
  }

  const specsText = String(richProduct.specsText || "").trim();
  if (fallbackSections.length === 0 && specsText) {
    fallbackSections.push({
      key: "specsText",
      label: lang === "zh" ? "规格摘要" : "Specs Summary",
      labelEn: "Specs Summary",
      rows: [{ label: lang === "zh" ? "摘要" : "Summary", value: specsText }],
    });
  }

  if (fallbackSections.length === 0) {
    const topLevelRows = [
      { label: lang === "zh" ? "品牌" : "Brand", value: cleanVisibleFieldText(displayProduct.brand) },
      { label: lang === "zh" ? "类目" : "Category", value: cleanVisibleFieldText(displayProduct.category) },
      { label: lang === "zh" ? "适龄范围" : "Age Range", value: applicableAgeRange },
      { label: lang === "zh" ? "重量" : "Weight", value: cleanVisibleFieldText(displayProduct.weight) },
      { label: lang === "zh" ? "材质" : "Material", value: formatSpecValue(displayProduct.material, "material", lang) },
      { label: lang === "zh" ? "刹车/约束" : "Brake / Restraint", value: formatSpecValue(displayProduct.brakeType, "brake", lang) },
      { label: lang === "zh" ? "轮胎" : "Tire Type", value: formatSpecValue(displayProduct.tireType, "tire_type", lang) },
      { label: lang === "zh" ? "合规" : "Compliance", value: cleanVisibleFieldText(displayProduct.compliance) },
    ].filter((item) => item.value);

    if (topLevelRows.length > 0) {
      fallbackSections.push({
        key: "top_level_specs",
        label: lang === "zh" ? "基础规格" : "Basic Specs",
        labelEn: "Basic Specs",
        rows: topLevelRows,
      });
    }
  }

  if (fallbackSections.length === 0) {
    const minimalRows = [
      { label: "Product ID", value: String(displayProduct.id || "").trim() },
      { label: lang === "zh" ? "名称" : "Name", value: String((displayProduct as Product & { name?: string }).name || "").trim() },
      { label: lang === "zh" ? "品牌" : "Brand", value: String(displayProduct.brand || "").trim() },
      { label: lang === "zh" ? "类目" : "Category", value: String(displayProduct.category || "").trim() },
    ].filter((item) => item.value);

    if (minimalRows.length > 0) {
      fallbackSections.push({
        key: "minimal_identity",
        label: lang === "zh" ? "基础信息" : "Basic Info",
        labelEn: "Basic Info",
        rows: minimalRows,
      });
    }
  }

  return fallbackSections;
}

function cleanEvidenceSource(value: unknown) {
  const text = cleanVisibleSourceText(value);
  if (/^Features\[\d+\]$/i.test(text)) return "";
  if (/^Product\s+Feature$/i.test(text)) return "";
  if (text === "产品特性") return "";
  return text;
}

function normalizeReadableText(value: unknown): string {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/[|·]+/g, ". ")
    .replace(/([:;,.!?])(\S)/g, "$1 $2")
    .replace(/\s+([,.;!?])/g, "$1")
    .replace(/^[-•\d.)\s]+/, "")
    .trim();
}

function toFeatureCandidates(value: string): string[] {
  const text = normalizeReadableText(value);
  if (!text) return [];

  return text
    .split(/\s*\|\s*|\s*\n+\s*|\s*•\s*|\s*\u2022\s*|\s*(?<=\.)\s+(?=[A-Z\u4e00-\u9fff])/g)
    .map((item) => normalizeReadableText(item))
    .filter(Boolean);
}

type StructuredSectionRow = {
  label: string;
  value: string;
};

type StructuredSection = {
  key: string;
  label: string;
  labelEn: string;
  rows: StructuredSectionRow[];
};

function isMeaningfulStructuredValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.some((item) => isMeaningfulStructuredValue(item));
  if (typeof value === "object") return Object.values(value as Record<string, unknown>).some((item) => isMeaningfulStructuredValue(item));
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return false;
  return !/^(n\/?a|na|none|null|undefined|unknown|待补充|tbd)$/i.test(text);
}

function buildStructuredRows(record: Record<string, unknown>, lang: "zh" | "en", applicableAgeRange: string): StructuredSectionRow[] {
  return Object.entries(record)
    .map(([key, value]) => ({
      label: formatSpecKey(key, lang),
      value: ["age_range", "age_range_description", "recommended_age"].includes(toSpecKey(key))
        ? applicableAgeRange
        : formatSpecValue(value, key, lang),
    }))
    .filter((item) => isMeaningfulStructuredValue(item.value));
}

function resolveStructuredProductDescription(product: Product, lang: "zh" | "en"): string {
  const localized = product as Product & {
    zh?: { Product_Description?: string; description?: string };
    en?: { Product_Description?: string; description?: string };
  };
  const candidates = lang === "zh"
    ? [localized.zh?.Product_Description, localized.Product_Description, localized.zh?.description]
    : [localized.en?.Product_Description, localized.Product_Description, localized.en?.description, localized.description];

  const normalizedName = String(product.name || "").replace(/\s+/g, " ").trim().toLowerCase();

  for (const candidate of candidates) {
    const text = normalizeReadableText(candidate);
    if (!isMeaningfulStructuredValue(text)) continue;
    const normalizedText = text.toLowerCase();
    if (normalizedText === normalizedName) continue;
    if (normalizedText.includes("generated from remote fallback")) continue;
    if (text.length < 24) continue;
    return text;
  }

  return "";
}

function resolveStructuredFeatureRows(product: Product, lang: "zh" | "en"): string[] {
  const localized = product as Product & {
    zh?: { features?: unknown[] };
    en?: { features?: unknown[] };
  };
  const featureCandidates = lang === "zh"
    ? [localized.zh?.features, product.features]
    : [localized.en?.features, product.features];

  for (const candidate of featureCandidates) {
    if (!Array.isArray(candidate)) continue;
    const expanded = candidate.flatMap((item) => toFeatureCandidates(cleanVisibleFieldText(item)));
    const cleaned = Array.from(
      new Set(
        expanded
          .map((item) => normalizeReadableText(item))
          .filter((item) => isMeaningfulStructuredValue(item) && !/^[\d\s.-]+$/.test(item) && item.length >= 12)
      )
    );
    if (cleaned.length > 0) return cleaned;
  }

  return [];
}

function buildStructuredSpecificationSections(product: Product, lang: "zh" | "en", applicableAgeRange: string): StructuredSection[] {
  const richProduct = product as Product & {
    Product_Specifications?: Record<string, Record<string, unknown>>;
  };
  const specs = richProduct.Product_Specifications || {};
  const sectionOrder = [
    "Measurements",
    "Features_Specs",
    "Materials_Care",
    "Item_Details",
    "User_Guide",
  ];
  const sectionLabels: Record<string, { zh: string; en: string }> = {
    Measurements: { zh: "Measurements", en: "Measurements" },
    Features_Specs: { zh: "Features Specs", en: "Features Specs" },
    Materials_Care: { zh: "Materials Care", en: "Materials Care" },
    Item_Details: { zh: "Item Details", en: "Item Details" },
    User_Guide: { zh: "User Guide", en: "User Guide" },
  };

  return sectionOrder
    .map((key) => {
      const section = specs[key];
      if (!section || typeof section !== "object") return null;
      const rows = buildStructuredRows(section, lang, applicableAgeRange);
      if (rows.length === 0) return null;
      return {
        key,
        label: lang === "zh" ? sectionLabels[key].zh : sectionLabels[key].en,
        labelEn: sectionLabels[key].en,
        rows,
      } satisfies StructuredSection;
    })
    .filter(Boolean) as StructuredSection[];
}

function resolveStructuredScoringStandards(product: Product) {
  return (product.scoringStandards || [])
    .map((standard) => ({
      key: String(standard.key || "").trim(),
      label: String(standard.label || "").trim(),
      parentTip: cleanVisibleFieldText(standard.parentTip),
      evidence: (standard.evidence || [])
        .map((item) => ({
          source: cleanEvidenceSource(item.source),
          text: cleanVisibleFieldText(item.text),
        }))
        .filter((item) => isMeaningfulStructuredValue(item.text)),
    }))
    .filter((item) => isMeaningfulStructuredValue(item.parentTip) || item.evidence.length > 0);
}

function extractDirectVideoUrls(value: unknown): string[] {
  if (!value) return [];
  if (typeof value === "string") {
    return /\.mp4(\?|#|$)/i.test(value.trim()) ? [value.trim()] : [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => extractDirectVideoUrls(item));
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return [
      record.Video_URL,
      record.videoUrl,
      record.video_url,
      record.url,
      record.Local_Video_Path,
      record.Local_Video_Paths,
    ].flatMap((item) => extractDirectVideoUrls(item));
  }
  return [];
}

interface DetailedProductViewProps {
  product: Product;
  onClose: () => void;
  isAdmin?: boolean;
  onOpenAdminProductEditor?: (product: Product) => void;
  lang: "zh" | "en";
  activeStandardDimension: string | null;
  setActiveStandardDimension: (dim: string | null) => void;
  previousTab?: string;
  cmsSettings?: CMSSettings | null;
}

export default function DetailedProductView({
  product,
  onClose,
  isAdmin = false,
  onOpenAdminProductEditor,
  lang,
  previousTab,
  cmsSettings
}: DetailedProductViewProps) {
  // Rule set v1: detail textual blocks must come from product data model fields first.
  // This prevents runtime drift from remote overlays and keeps rendering deterministic.
  const displayProduct = translateProduct(product, lang);
  const displayTitle = getProductDisplayTitle(displayProduct, lang);
  const [liveCmsLocalized, setLiveCmsLocalized] = useState({
    zh: { description: "", editorVerdict: "" },
    en: { description: "", editorVerdict: "" },
  });
  const [detailResources, setDetailResources] = useState<WorkerDetailResource[]>([]);
  const verdictText = resolveVerdictText(displayProduct, lang);
  const descriptionText = resolveDescriptionText(displayProduct, lang);
  const imageSet = resolveProductImages(displayProduct);
  const applicableAgeRange = resolveApplicableAgeRange(product, lang);
  const structuredDescriptionText = resolveStructuredProductDescription(displayProduct, lang);
  const structuredFeatureRows = resolveStructuredFeatureRows(displayProduct, lang);
  const structuredSpecSections = buildStructuredSpecificationSections(displayProduct, lang, applicableAgeRange);
  const visibleStructuredSpecSections = structuredSpecSections
    .map((section) => ({
      ...section,
      rows: section.rows.filter((row) => isMeaningfulStructuredValue(row?.value)),
    }))
    .filter((section) => section.rows.length > 0);
  const structuredScoringStandards = resolveStructuredScoringStandards(displayProduct);
  const categoryAttributeRows = buildStructuredRows(
    (((displayProduct as Product & { Category_Attributes?: Record<string, unknown> }).Category_Attributes) || {}),
    lang,
    applicableAgeRange
  );

  const modelGalleryImages = Array.from(
    new Set(
      [
        String(displayProduct.imageUrl || "").trim(),
        ...(displayProduct.galleryUrls || []).map((item) => String(item || "").trim()),
        ...(displayProduct.productImageUrls || []).map((item) => String(item || "").trim()),
        ...(((displayProduct.images?.gallery || []).map((item) => String(item?.url || "").trim()))),
        ...(((displayProduct.images?.all || []).map((item) => String(item?.url || "").trim()))),
        String(displayProduct.images?.cover?.url || "").trim(),
      ].filter(Boolean)
    )
  );

  const modelFeatureImages = Array.from(
    new Set(
      [
        ...(displayProduct.featureImageUrls || []).map((item) => String(item || "").trim()),
        ...(((displayProduct.images?.feature || []).map((item) => String(item?.url || "").trim()))),
      ].filter(Boolean)
    )
  );

  const galleryImagesToRender = modelGalleryImages.length > 0 ? modelGalleryImages : imageSet.allImageUrls.filter(Boolean);
  const featureImagesToRender = modelFeatureImages.length > 0 ? modelFeatureImages : imageSet.featureUrls.filter(Boolean);
  const hasGalleryImages = galleryImagesToRender.length > 0;
  const weightText = Number.isFinite(Number(displayProduct.weight)) && Number(displayProduct.weight) > 0
    ? `${Number(displayProduct.weight).toFixed(2).replace(/\.00$/, "")} kg`
    : "";
  const resourceVideoAssets = detailResources
    .flatMap((resource) => {
      const type = String(resource?.resourceType || "").toLowerCase();
      const fromList = Array.isArray(resource?.videoUrls) ? resource.videoUrls : [];
      const fromResourceUrl = (type.includes("video") || isLikelyVideoUrl(String(resource?.resourceUrl || ""))) && resource?.resourceUrl
        ? [resource.resourceUrl]
        : [];
      const urls = [...fromList, ...fromResourceUrl]
        .map((item) => String(item || "").trim())
        .filter((item) => item && isLikelyVideoUrl(item) && !isUnsupportedVideoUrl(item));
      return urls.map((url, index) => ({
        url,
        title: String(resource?.title || `resource-video-${index + 1}`).trim(),
      }));
    })
    .filter((item, index, list) => list.findIndex((next) => next.url === item.url) === index);

  const rawProductMp4Assets = [
    ...extractDirectVideoUrls((product as any)?.Product_Videos_MP4),
    ...extractDirectVideoUrls((product as any)?.Product_Videos_Detail),
    ...extractDirectVideoUrls((displayProduct as any)?.Product_Videos_MP4),
    ...extractDirectVideoUrls((displayProduct as any)?.Product_Videos_Detail),
  ].map((url, index) => ({
    url,
    title: `mp4-video-${index + 1}`,
  }));

  const videoAssets = [
    ...rawProductMp4Assets,
    product.videoUrl ? { url: product.videoUrl, title: "primary-video" } : null,
    ...((product.videos || []).map((item, index) => ({
      url: String(item?.url || "").trim(),
      title: String(item?.title || `video-${index + 1}`).trim(),
    }))),
    ...resourceVideoAssets,
  ]
    .filter((item): item is { url: string; title: string } => Boolean(item?.url) && /\.mp4(\?|#|$)/i.test(item.url))
    .filter((item, index, list) => list.findIndex((candidate) => candidate.url === item.url) === index);
  const firstVideoUrl = videoAssets[0]?.url || "";
  const [activeVideoUrl, setActiveVideoUrl] = useState<string>(videoAssets[0]?.url || "");
  const videoUrl = activeVideoUrl || firstVideoUrl;
  const videoRenderType = getVideoRenderType(videoUrl);
  const hasVideo = videoRenderType !== "none";
  const hasFeatureImages = featureImagesToRender.length > 0;
  const hasAnyMedia = hasGalleryImages || hasFeatureImages || hasVideo;
  const availableMediaTabs: Array<"gallery" | "feature" | "video"> = [
    ...(hasGalleryImages ? ["gallery" as const] : []),
    ...(hasFeatureImages ? ["feature" as const] : []),
    ...(hasVideo ? ["video" as const] : []),
  ];
  const [activeMediaTab, setActiveMediaTab] = useState<"gallery" | "feature" | "video">("gallery");
  const getBackLabel = () => {
    if (lang === "zh") {
      switch (previousTab) {
        case "products":
          return "返回产品中心";
        case "evaluations":
          return "返回评测中心";
        case "guides":
          return "返回选购指南";
        case "news":
          return "返回全球资讯";
        case "home":
          return "返回首页";
        default:
          return "返回产品中心";
      }
    } else {
      switch (previousTab) {
        case "products":
          return "Back to Products";
        case "evaluations":
          return "Back to Evaluations";
        case "guides":
          return "Back to Buyer's Guide";
        case "news":
          return "Back to Global News";
        case "home":
          return "Back to Home";
        default:
          return "Back to Products";
      }
    }
  };

  React.useEffect(() => {
    if (!hasAnyMedia) return;
    if (!availableMediaTabs.includes(activeMediaTab)) {
      setActiveMediaTab(availableMediaTabs[0]);
    }
  }, [product.id, hasAnyMedia, activeMediaTab, availableMediaTabs]);

  React.useEffect(() => {
    setActiveVideoUrl(firstVideoUrl);
  }, [product.id, firstVideoUrl]);

  React.useEffect(() => {
    let disposed = false;

    const loadDetailResources = async () => {
      const categoryId = normalizeDetailCategoryId(product);
      const productId = String((product as any)?.productId || product.id || "").trim();
      if (!categoryId || !productId) {
        if (!disposed) setDetailResources([]);
        return;
      }

      try {
        const query = new URLSearchParams({
          categoryId,
          productId,
          page: "1",
          pageSize: "60",
        });
        const response = await fetch(`/api/v2/resources?${query.toString()}`, {
          headers: { Accept: "application/json" },
        });
        if (!response.ok) {
          if (!disposed) setDetailResources([]);
          return;
        }
        const payload = await response.json().catch(() => null);
        const rows = Array.isArray(payload?.data) ? payload.data : [];
        if (!disposed) {
          setDetailResources(rows);
        }
      } catch {
        if (!disposed) setDetailResources([]);
      }
    };

    setDetailResources([]);
    void loadDetailResources();

    return () => {
      disposed = true;
    };
  }, [product.id, (product as any)?.productId, (product as any)?.categoryId, product.category]);

  const curatedContent = resolveCuratedDetailContent(displayProduct);
  const resourceDescription = resolveResourceDescription(detailResources);
  const liveDescriptionProduct = {
    ...product,
    [lang]: { ...(product as any)?.[lang], description: lang === "zh" ? liveCmsLocalized.zh.description : liveCmsLocalized.en.description },
  } as Product;
  const liveDescriptionText = resolveDescriptionText(liveDescriptionProduct, lang);
  // Rule 1 confirmation: description fallback is limited to model-carried fields only.
  // We intentionally avoid curated/resource overlays here.
  const effectiveDescriptionText = descriptionText;

  React.useEffect(() => {
    let disposed = false;

    const loadLatestCmsVerdict = async () => {
      try {
        const response = await fetch("/api/cms/products?onlyPublished=1", {
          headers: {
            Accept: "application/json",
          },
        });
        if (!response.ok) return;

        const payload = await response.json().catch(() => null);
        const rows = Array.isArray(payload?.data) ? payload.data : [];
        if (!rows.length) return;

        const currentId = String(product.id || "").trim().toLowerCase();
        const currentAsin =
          extractAsin((product as any)?.ASIN) ||
          extractAsin((product as any)?.productId) ||
          extractAsin(product.id);

        const matched = rows.find((item: any) => {
          const itemId = String(item?.id || "").trim().toLowerCase();
          if (currentId && itemId && currentId === itemId) return true;

          const itemAsin =
            extractAsin(item?.ASIN) ||
            extractAsin(item?.productId) ||
            extractAsin(item?.id);
          return Boolean(currentAsin && itemAsin && currentAsin === itemAsin);
        });

        if (!matched || disposed) return;

        setLiveCmsLocalized({
          zh: {
            description: String(matched?.zh?.description || "").trim(),
            editorVerdict: String(matched?.zh?.editorVerdict || "").trim(),
          },
          en: {
            description: String(matched?.en?.description || "").trim(),
            editorVerdict: String(matched?.en?.editorVerdict || "").trim(),
          },
        });
      } catch {
        // Ignore transient CMS fetch errors and keep local fallback text.
      }
    };

    setLiveCmsLocalized({
      zh: { description: "", editorVerdict: "" },
      en: { description: "", editorVerdict: "" },
    });
    void loadLatestCmsVerdict();

    return () => {
      disposed = true;
    };
  }, [product.id, (product as any)?.ASIN, (product as any)?.productId]);

  const hashSeed = (input: string) => {
    let hash = 0;
    for (let i = 0; i < input.length; i += 1) {
      hash = (hash << 5) - hash + input.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  };

  const getStableRandomScore = (seedKey: string, min = 6.2, max = 9.2) => {
    const productSeed = String((product as any)?.productId || (product as any)?.ASIN || product.id || product.name || "unknown");
    const seed = hashSeed(`${productSeed}:${seedKey}`);
    const normalized = (seed % 10000) / 10000;
    return Number((min + (max - min) * normalized).toFixed(1));
  };

  const resolveScore = (value: unknown, seedKey: string, min = 6.2, max = 9.2) => {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) {
      return Number(numeric.toFixed(1));
    }
    return getStableRandomScore(seedKey, min, max);
  };

  const formatScoreDisplay = (value: unknown, seedKey = "overall") => {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) {
      return numeric.toFixed(2);
    }
    return getStableRandomScore(seedKey, 6.5, 9.4).toFixed(2);
  };

  // Function to extract 5-dimension scores
  const getProductScores = (p: Product) => {
    const safety = resolveScore(p.safetyScore, "safety");
    const comfortRaw = p.category === "stroller" ? 10.0 : p.category === "scooter" ? 8.5 : p.tireType?.includes("充气") ? 9.5 : undefined;
    const comfort = resolveScore(comfortRaw, "comfort");
    const portability = resolveScore(p.weightScore, "portability");
    const overallBase = resolveScore(p.overallScore, "overall", 6.5, 9.4);
    
    // Functionality Score
    const isMulti = (p.pros || []).some(pro => 
      pro.includes("多功能") || pro.includes("三合一") || pro.includes("3合1") || pro.includes("3-in-1") || pro.includes("all-in-one") || pro.includes("多用途")
    );
    const certWeight = (p.safetyCertification || []).length * 0.5;
    const functionalityRaw = Number(Math.min(10, Math.max(5.5, (overallBase * 0.6) + certWeight + (isMulti ? 1.5 : 0) + ((p.pros || []).length * 0.3))).toFixed(1));
    const functionality = resolveScore(functionalityRaw, "functionality");
    
    // Cost-effectiveness Score
    let priceFactor = 1000;
    if (p.category === "balance") priceFactor = 1500;
    else if (p.category === "bicycle") priceFactor = 2500;
    else if (p.category === "scooter") priceFactor = 600;
    else if (p.category === "stroller") priceFactor = 3000;
    const ratio = Number(p.price) / priceFactor;
    const costEffRaw = Number(Math.min(10, Math.max(5.2, (10 - ratio * 2.5) * 0.35 + (overallBase * 0.65))).toFixed(1));
    const costEff = resolveScore(costEffRaw, "value");

    return { safety, comfort, portability, functionality, costEff };
  };

  const scoresA = getProductScores(product);
  const overallScoreDisplay = formatScoreDisplay(displayProduct.overallScore, "overall");

  const radarData = lang === "en" ? [
    { subject: "Safety", scoreA: scoresA.safety, key: "safety" },
    { subject: "Comfort", scoreA: scoresA.comfort, key: "comfort" },
    { subject: "Portability", scoreA: scoresA.portability, key: "portability" },
    { subject: "Functionality", scoreA: scoresA.functionality, key: "functionality" },
    { subject: "Value", scoreA: scoresA.costEff, key: "value" }
  ] : [
    { subject: "安全性", scoreA: scoresA.safety, key: "safety" },
    { subject: "舒适度", scoreA: scoresA.comfort, key: "comfort" },
    { subject: "便携性", scoreA: scoresA.portability, key: "portability" },
    { subject: "功能性", scoreA: scoresA.functionality, key: "functionality" },
    { subject: "性价比", scoreA: scoresA.costEff, key: "value" }
  ];

  const getCategoryLabel = (cat: string, l: "zh" | "en"): string => {
    const normalized = String(cat || "").trim().toLowerCase();
    const mapZh: Record<string, string> = {
      stroller: "婴儿推车",
      balance: "平衡车",
      balance_bike: "平衡车",
      bicycle: "儿童自行车",
      kids_bikes: "儿童自行车",
      scooter: "儿童滑板车",
      kids_scooters: "儿童滑板车",
      electric_car: "儿童电动车",
      electric_vehicles: "儿童电动车",
      safety_seat: "安全座椅",
      car_seat: "安全座椅",
    };
    const mapEn: Record<string, string> = {
      stroller: "Kids Stroller",
      balance: "Balance Bike",
      balance_bike: "Balance Bike",
      bicycle: "Kids Bike",
      kids_bikes: "Kids Bike",
      scooter: "Kids Scooter",
      kids_scooters: "Kids Scooter",
      electric_car: "Kids Electric Car",
      electric_vehicles: "Kids Electric Car",
      safety_seat: "Car Seat",
      car_seat: "Car Seat",
    };
    return l === "zh" ? (mapZh[normalized] || "产品中心") : (mapEn[normalized] || "Products");
  };

  const normalizePriceValue = (value: unknown) => {
    const numeric = Number(String(value ?? "").replace(/[^\d.]/g, ""));
    return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
  };

  const displayPrice = (() => {
    const numeric = normalizePriceValue((displayProduct as Product & { price?: unknown }).price);
    if (!numeric) return lang === "zh" ? "待补充" : "TBD";
    return lang === "zh" ? `¥${numeric.toLocaleString("zh-CN")}` : `$${numeric.toLocaleString("en-US")}`;
  })();

  const modelOverviewRows = [
    { label: lang === "zh" ? "品牌" : "Brand", value: cleanVisibleFieldText(displayProduct.brand) },
    { label: lang === "zh" ? "品类" : "Category", value: getCategoryLabel((displayProduct as any).categoryId || displayProduct.category || "", lang) },
    { label: lang === "zh" ? "重量" : "Weight", value: weightText },
    { label: lang === "zh" ? "适龄范围" : "Age Range", value: applicableAgeRange },
    { label: lang === "zh" ? "参考价格" : "Reference Price", value: displayPrice },
  ].filter((item) => isMeaningfulStructuredValue(item.value));
  const visibleModelOverviewRows = modelOverviewRows.filter((row) => isMeaningfulStructuredValue(row?.value));
  const visibleCategoryAttributeRows = categoryAttributeRows.filter((row) => isMeaningfulStructuredValue(row?.value));

  const CustomRadarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xl space-y-2 text-xs pointer-events-none z-50">
          <div className="font-bold text-slate-800 border-b border-slate-50 pb-2 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
            {data.subject}
          </div>
          <div className="space-y-1.5">
            {payload.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between gap-8">
                <span className="text-slate-500 font-medium">{item.name}:</span>
                <span className={`${item.dataKey === "scoreA" ? "text-orange-600" : "text-indigo-600"} font-black text-right`}>{item.value} / 10</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="detailed_product_view" className="max-w-4xl mx-auto space-y-8 animate-fade-in text-left">
      <Breadcrumbs
        lang={lang}
        onHomeClick={() => (window as any).setActiveTab?.("home")}
        items={[
          {
            label: lang === "zh" ? "产品中心" : "PRODUCTS",
            active: false,
            onClick: onClose,
          },
          {
            label: getCategoryLabel(product.category || "", lang),
            active: false,
            onClick: onClose,
          },
          {
            label: displayTitle,
            active: true,
          }
        ]}
      />

      {/* Header with Back Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white border border-slate-100 rounded-[40px] p-8 shadow-sm">
        <div className="space-y-2">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-xs text-orange-500 hover:text-orange-600 font-black uppercase mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            {getBackLabel()}
          </button>
          <div className="flex items-center gap-3">
            <span className="text-[10px] bg-orange-50 text-orange-600 font-bold px-3 py-1 rounded-full uppercase border border-orange-100">
              {displayProduct.brand}
            </span>
          </div>
          <h1 className="km-page-title text-slate-900">{displayTitle}</h1>
        </div>
        
        <div className="flex gap-3 items-center">
          {isAdmin && onOpenAdminProductEditor && (
            <button
              onClick={() => onOpenAdminProductEditor(product)}
              className="px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-colors"
            >
              {lang === "en" ? "Edit in Admin" : "后台编辑"}
            </button>
          )}
          <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
             <span className="text-[10px] text-slate-400 font-bold block uppercase mb-1">{lang === "en" ? "Overall Score" : "综合评分"}</span>
             <strong className="text-2xl font-black text-orange-500">{overallScoreDisplay}</strong>
          </div>
        </div>
      </div>

      {/* Media Gallery & Video Showcase */}
      {hasAnyMedia && (
      <div id="product_media_section" className="bg-white border border-slate-100 rounded-[40px] overflow-hidden shadow-sm scroll-mt-24">
        <div className="flex border-b border-slate-100">
          {hasGalleryImages && (
          <button 
            onClick={() => setActiveMediaTab("gallery")}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-black uppercase transition-all ${activeMediaTab === "gallery" ? "bg-orange-50 text-orange-600 border-b-2 border-orange-500" : "text-slate-400 hover:bg-slate-50"}`}
          >
            <ImageIcon className="w-4 h-4" />
            {lang === "en" ? "Image Gallery" : "产品实拍图库"}
          </button>
          )}
          {hasFeatureImages && (
            <button 
              onClick={() => setActiveMediaTab("feature")}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-black uppercase transition-all ${activeMediaTab === "feature" ? "bg-orange-50 text-orange-600 border-b-2 border-orange-500" : "text-slate-400 hover:bg-slate-50"}`}
            >
              <Maximize2 className="w-4 h-4" />
              {lang === "en" ? "Feature Images" : "特性图解"}
            </button>
          )}
          {hasVideo && (
            <button 
              onClick={() => setActiveMediaTab("video")}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-black uppercase transition-all ${activeMediaTab === "video" ? "bg-orange-50 text-orange-600 border-b-2 border-orange-500" : "text-slate-400 hover:bg-slate-50"}`}
            >
              <Play className="w-4 h-4" />
              {lang === "en" ? "PRODUCT VIDEO" : "实物演示视频"}
            </button>
          )}
        </div>

        <div className="p-1 min-h-[400px] bg-slate-50">
          {activeMediaTab === "gallery" && hasGalleryImages ? (
            <ProductCarousel 
              images={galleryImagesToRender}
              lang={lang}
              productName={displayTitle}
            />
          ) : activeMediaTab === "feature" && hasFeatureImages ? (
            <ProductCarousel 
              images={featureImagesToRender}
              lang={lang}
              productName={displayTitle}
            />
          ) : (
            <div className="space-y-4">
              <div className="aspect-video w-full">
                {hasVideo && videoRenderType === "direct" ? (
                  <video
                    src={videoUrl}
                    className="w-full h-full rounded-2xl bg-black"
                    title={`${displayTitle} Video`}
                    controls
                    playsInline
                    preload="metadata"
                  />
                ) : hasVideo ? (
                  <iframe 
                    src={videoUrl} 
                    className="w-full h-full rounded-2xl"
                    title={`${displayTitle} Video`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center rounded-2xl text-slate-400 font-medium">
                    {lang === "en" ? "No video available" : "暂无视频"}
                  </div>
                )}
              </div>
              {videoAssets.length > 1 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {videoAssets.map((asset, index) => {
                    const active = asset.url === videoUrl;
                    return (
                      <button
                        key={`${asset.url}-${index}`}
                        onClick={() => setActiveVideoUrl(asset.url)}
                        className={`rounded-2xl border px-4 py-3 text-left transition ${active ? "border-orange-500 bg-orange-50 text-orange-700" : "border-slate-200 bg-white text-slate-600 hover:border-orange-200 hover:bg-orange-50/40"}`}
                      >
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                          <Play className="w-3.5 h-3.5" />
                          {lang === "en" ? `Video ${index + 1}` : `视频 ${index + 1}`}
                        </div>
                        <div className="mt-1 text-xs font-semibold leading-relaxed break-words">
                          {asset.title || (lang === "en" ? `Clip ${index + 1}` : `片段 ${index + 1}`)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Radar & Evidence (Left Column) */}
        <div className="lg:col-span-2 space-y-8">
          <div id="product_analysis_section" className="bg-white border border-slate-100 rounded-[40px] p-8 shadow-sm space-y-8 scroll-mt-24">
             <div className="flex justify-between items-center border-b border-slate-50 pb-6">
                <h2 className="km-section-title text-slate-900">{lang === "en" ? "Performance Analysis" : "测评效能透视"}</h2>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {lang === "en" ? "Single Product Evidence" : "单品证据评估"}
                </div>
             </div>

             <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      tick={(props: any) => {
                        const { payload, x, y, textAnchor, verticalAnchor, ...rest } = props;
                        return (
                          <text
                            {...rest}
                            x={x}
                            y={y}
                            textAnchor={textAnchor}
                            className="font-bold text-[11px] fill-slate-400"
                          >
                            {payload.value}
                          </text>
                        );
                      }}
                    />
                    <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
                    <Tooltip content={<CustomRadarTooltip />} />
                    <Radar
                      name={product.brand}
                      dataKey="scoreA"
                      stroke="#f97316"
                      fill="#f97316"
                      fillOpacity={0.2}
                      strokeWidth={3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
             </div>

             {/* Product Basic Info Section */}
             <div id="product_basic_info_section" className="space-y-4 pt-6 border-t border-slate-50 scroll-mt-24">
               <h3 className="flex items-center gap-2 text-xs font-black text-slate-700 uppercase tracking-widest">
                 <ShieldCheck className="w-4 h-4 text-orange-500" />
                 {lang === "en" ? "Product Data Model" : "产品数据模型"}
               </h3>
               <div className="space-y-4">
                 {visibleModelOverviewRows.length > 0 && (
                   <div className="rounded-3xl border border-slate-100 bg-slate-50/70 p-4 space-y-4">
                     <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                       <p className="text-sm font-black text-slate-800">{lang === "en" ? "Overview" : "基础字段"}</p>
                       <span className="text-[10px] font-black px-2 py-1 rounded-full bg-white text-slate-500 border border-slate-200">{visibleModelOverviewRows.length}</span>
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                       {visibleModelOverviewRows.map((row, index) => (
                         <div key={`overview-${row.label}-${index}`} className="rounded-2xl bg-white border border-slate-100 p-3 space-y-1">
                           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{row.label}</p>
                           <p className="text-sm text-slate-700 font-semibold leading-relaxed break-words">{row.value}</p>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}

                 {structuredDescriptionText && (
                   <div className="rounded-3xl border border-slate-100 bg-slate-50/70 p-4 space-y-4">
                     <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                       <p className="text-sm font-black text-slate-800">Product_Description</p>
                     </div>
                     <div className="rounded-2xl bg-white border border-slate-100 p-3 text-sm text-slate-700 font-semibold leading-relaxed break-words">
                       {structuredDescriptionText}
                     </div>
                   </div>
                 )}

                 {visibleCategoryAttributeRows.length > 0 && (
                   <div className="rounded-3xl border border-slate-100 bg-slate-50/70 p-4 space-y-4">
                     <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                       <p className="text-sm font-black text-slate-800">Category_Attributes</p>
                       <span className="text-[10px] font-black px-2 py-1 rounded-full bg-white text-slate-500 border border-slate-200">{visibleCategoryAttributeRows.length}</span>
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                       {visibleCategoryAttributeRows.map((row, index) => (
                         <div key={`category-attribute-${row.label}-${index}`} className="rounded-2xl bg-white border border-slate-100 p-3 space-y-1">
                           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{row.label}</p>
                           <p className="text-sm text-slate-700 font-semibold leading-relaxed break-words">{row.value}</p>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}

                 {visibleStructuredSpecSections.map((section) => (
                   <div key={section.key} className="rounded-3xl border border-slate-100 bg-slate-50/70 p-4 space-y-4">
                     <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                       <p className="text-sm font-black text-slate-800">{section.labelEn}</p>
                       <span className="text-[10px] font-black px-2 py-1 rounded-full bg-white text-slate-500 border border-slate-200">{section.rows.length}</span>
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                       {section.rows.map((row, index) => (
                         <div key={`${section.key}-${row.label}-${index}`} className="rounded-2xl bg-white border border-slate-100 p-3 space-y-1">
                           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{row.label}</p>
                           <p className="text-sm text-slate-700 font-semibold leading-relaxed break-words">{row.value}</p>
                         </div>
                       ))}
                     </div>
                   </div>
                 ))}

                 {structuredScoringStandards.length > 0 && (
                   <div className="rounded-3xl border border-slate-100 bg-slate-50/70 p-4 space-y-4">
                     <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                       <p className="text-sm font-black text-slate-800">scoringStandards</p>
                       <span className="text-[10px] font-black px-2 py-1 rounded-full bg-white text-slate-500 border border-slate-200">{structuredScoringStandards.length}</span>
                     </div>
                     <div className="space-y-3">
                       {structuredScoringStandards.map((standard) => (
                         <div key={standard.key || standard.label} className="rounded-2xl bg-white border border-slate-100 p-4 space-y-3">
                           {standard.label && <p className="text-sm font-black text-slate-800">{standard.label}</p>}
                           {standard.parentTip && <p className="text-sm text-slate-600 font-semibold leading-relaxed">{standard.parentTip}</p>}
                           {standard.evidence.length > 0 && (
                             <div className="space-y-2">
                               {standard.evidence.map((evidence, index) => (
                                 <div key={`${standard.key}-${index}`} className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                                   {evidence.source && <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{evidence.source}</p>}
                                   <p className="mt-1 text-sm text-slate-700 font-medium leading-relaxed">{evidence.text}</p>
                                 </div>
                               ))}
                             </div>
                           )}
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
               </div>
             </div>
          </div>

        </div>

        {/* Technical Specs (Right Column) */}
          <div className="space-y-8">
           {/* Verdict Box */}
           {isMeaningfulStructuredValue(verdictText) && (
           <div id="product_expert_summary_section" className="bg-orange-50 border border-orange-100 rounded-[40px] p-8 space-y-4 scroll-mt-24">
              <h2 className="text-xs font-black text-orange-600 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                {lang === "en" ? "Expert Summary" : "本站综合评价"}
              </h2>
              <p className="text-sm text-slate-700 font-bold leading-relaxed italic">
                "{verdictText}"
              </p>
           </div>
           )}

           {!structuredDescriptionText && isMeaningfulStructuredValue(effectiveDescriptionText) && (
             <div id="product_description_section" className="bg-white border border-slate-100 rounded-[32px] p-6 space-y-2 shadow-sm scroll-mt-24">
               <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                 {lang === "en" ? "Product Description" : "产品描述"}
               </p>
               <p className="km-heading-copy km-body-copy text-sm text-slate-700 font-semibold">{effectiveDescriptionText}</p>
             </div>
           )}
        </div>
      </div>

    </div>
  );
}
