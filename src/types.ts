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

export type ComplianceTag = "CCC" | "EN1888" | "ASTM" | "GS";

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

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: ProductCategory;
  wheelSize: string;
  weight: number; 
  material: string;
  brakeType: string;
  tireType: string;
  price: number;
  ageRange: string;
  heightRange: [number, number];
  compliance?: ComplianceTag[];
  imageUrl: string;
  galleryUrls?: string[];
  videoUrl?: string;
  status?: "draft" | "published" | "archived";
  // Added evaluation fields for summary views
  overallScore?: number;
  safetyScore?: number;
  weightScore?: number;
  geometryScore?: number;
  pros?: string[];
  cons?: string[];
  safetyCertification?: string[];
  editorVerdict?: string;
}

export interface CMSProduct extends Product {
  zh: {
    name: string;
    description: string;
    brandText?: string;
    specsText?: string;
    pros?: string[];
    cons?: string[];
    editorVerdict?: string;
  };
  en: {
    name: string;
    description: string;
    brandText?: string;
    specsText?: string;
    pros?: string[];
    cons?: string[];
    editorVerdict?: string;
  };
  updatedAt: any;
}

export interface Evaluation {
  id: string;
  productId: string; // Mandatory link
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
  updatedAt: any;
}

export interface HomeSlot {
  id: string;
  type: "review" | "product" | "guide";
  targetId: string;
  imageOverride?: string;
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
