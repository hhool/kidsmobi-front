/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ProductCategory = 
  | "balance" 
  | "bicycle" 
  | "scooter" 
  | "stroller" 
  | "electric_car" 
  | "tricycle" 
  | "safety_seat";

export type ComplianceTag = "CCC" | "EN1888" | "ASTM" | "ASTM F963" | "GS" | "CPC" | "CE" | "CPSC";

export interface SEOConfig {
  title: string;
  description: string;
  keywords: string[];
}

export interface RadarScores {
  safety: number;
  comfort: number;
  portability: number;
  features: number;
  valueForMoney: number;
}

export interface ProductImageAsset {
  url: string;
  source?: "cms" | "scraped" | "unknown";
  order?: number;
}

export interface ProductVideoAsset {
  url: string;
  title?: string;
  source?: "cms" | "scraped" | "unknown";
  order?: number;
}

export interface ScrapedEvidenceItem {
  source: string;
  text: string;
}

export interface ProductScoringStandard {
  key: "safety" | "comfort" | "portability" | string;
  label: string;
  parentTip: string;
  evidence: ScrapedEvidenceItem[];
}

export interface ProductImages {
  cover?: ProductImageAsset;
  gallery?: ProductImageAsset[];
  feature?: ProductImageAsset[];
  all?: ProductImageAsset[];
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: ProductCategory;
  categoryId?: string;
  wheelSize: string;
  weight: number; 
  material: string;
  brakeType: string;
  tireType: string;
  price: number;
  ageRange: string;
  heightRange: [number, number];
  compliance?: ComplianceTag[];
  images?: ProductImages;
  imageUrl: string;
  productImageUrls?: string[];
  galleryUrls?: string[];
  featureImageUrls?: string[];
  videoUrl?: string;
  features?: string[];
  scenarios?: string[];
  relatedProductIds?: string[];
  videos?: ProductVideoAsset[];
  status?: "draft" | "published" | "archived";
  // Added evaluation fields for summary views
  overallScore?: number;
  safetyScore?: number;
  weightScore?: number;
  geometryScore?: number;
  rating?: { display?: string; value?: number };
  reviews?: { display?: string; count?: number };
  userRating?: number;
  reviewCount?: number;
  description?: string;
  specsText?: string;
  Product_Specifications?: Record<string, any>;
  pros?: string[];
  cons?: string[];
  customers_say?: string;
  customersSay?: string;
  safetyCertification?: string[];
  editorVerdict?: string;
  scrapedEvidence?: ScrapedEvidenceItem[];
  scoringStandards?: ProductScoringStandard[];
}

export interface CMSProduct extends Product {
  zh: {
    name: string;
    description: string;
    customersSay?: string;
    brandText?: string;
    specsText?: string;
    pros?: string[];
    cons?: string[];
    editorVerdict?: string;
  };
  en: {
    name: string;
    description: string;
    customersSay?: string;
    brandText?: string;
    specsText?: string;
    pros?: string[];
    cons?: string[];
    editorVerdict?: string;
  };
  updatedAt: any;
}

export interface CMSCategory {
  id: string;
  code: ProductCategory;
  status: "draft" | "published" | "archived";
  sortOrder: number;
  icon?: string;
  zh: {
    name: string;
    description?: string;
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string;
  };
  en: {
    name: string;
    description?: string;
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string;
  };
  updatedAt: any;
}

export interface CMSScenario {
  id: string;
  code: string;
  status: "draft" | "published" | "archived";
  sortOrder: number;
  zh: {
    name: string;
    description?: string;
  };
  en: {
    name: string;
    description?: string;
  };
  updatedAt: any;
}

export interface Evaluation {
  id: string;
  type?: "single" | "compare" | "value" | "ranking" | "safety";
  productIds?: string[];
  productId: string; // Maintain for backward compatibility
  status: "draft" | "published" | "archived";
  version: string; // e.g. "V1.1"
  scores: RadarScores;
  imageUrl: string;
  zh: {
    title: string;
    verdict: string;
    pros: string[];
    cons: string[];
    changelog: string;
  };
  en: {
    title: string;
    verdict: string;
    pros: string[];
    cons: string[];
    changelog: string;
  };
  updatedAt: any;
}

export interface RiskCard {
  title: string;
  pattern: string;
  detection: string;
  advice: string;
}

export interface Guide {
  id: string;
  category: string;
  status: "draft" | "published" | "archived";
  imageUrl: string;
  riskCards: RiskCard[];
  seo: {
    zh: SEOConfig;
    en: SEOConfig;
  };
  zh: {
    title: string;
    content: string; // Rich text
  };
  en: {
    title: string;
    content: string;
  };
  relatedProductIds?: string[];
  scenarioIds?: string[];
  updatedAt: any;
}

export interface News {
  id: string;
  category: string;
  status: "draft" | "published" | "archived";
  imageUrl: string;
  seo: {
    zh: SEOConfig;
    en: SEOConfig;
  };
  zh: {
    title: string;
    content: string;
  };
  en: {
    title: string;
    content: string;
  };
  relatedProductIds?: string[];
  scenarioIds?: string[];
  updatedAt: any;
}

export interface HomeSlot {
  id: string;
  type: "review" | "product" | "guide";
  targetId: string;
  imageOverride?: string;
}

export interface CMSPageSEO {
  zh: SEOConfig;
  en: SEOConfig;
}

export interface CMSPageConfig {
  id?: string;
  pageType?: "home" | "products_index" | "reviews_index" | "guides_index" | "news_index" | "about";
  pageSlug?: string;
  templateKey?: string;
  pageGroup?: string;
  pageOrder?: number;
  pageIndex?: number;
  paginationPolicy?: "none" | "page_path" | "query_param";
  indexingPolicy?: "index" | "noindex";
  canonicalPath?: string;
  contentBlocks?: unknown[];
  relatedIds?: string[];
  locale?: "zh" | "en";
  status?: "draft" | "review" | "published" | "offline";
  seo?: CMSPageSEO;
}

export interface CMSSettings {
  id: "global";
  hero: {
    zh: { title: string; subtitle: string };
    en: { title: string; subtitle: string };
  };
  homeSlots: HomeSlot[]; // For the drag-and-drop recommender
  scoringStandards?: {
    id: string;
    labelZh: string;
    labelEn: string;
    descriptionZh: string;
    descriptionEn: string;
    icon: string;
  }[];
  seo?: {
    [key: string]: {
      zh: SEOConfig;
      en: SEOConfig;
    };
  };
  seoGlobal?: {
    siteOrigin?: string;
    googleSiteVerification?: string;
    defaultRobots?: string;
  };
  pages?: {
    [key: string]: CMSPageConfig;
  };
  opsCenter?: {
    copy?: {
      zh?: Record<string, string>;
      en?: Record<string, string>;
    };
    collectionLabels?: {
      zh?: Record<string, string>;
      en?: Record<string, string>;
    };
    featureFlags?: {
      showEmptyScoringStandardsSection?: boolean;
    };
  };
}

export interface CurrencyData {
  code: string;
  name: string;
  nameEn: string;
  currency: string;
  symbol: string;
}

export interface ChildProfile {
  age: number;
  height: number;
  inseam: number | "";
  weight: number;
  experience: "beginner" | "intermediate" | "advanced";
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}
