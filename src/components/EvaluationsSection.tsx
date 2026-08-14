import { useState, useMemo, useEffect } from "react";
import { Award, Filter, ShieldCheck, Scale, CheckCircle, Flame, Star, Zap, BookOpen, ArrowRight } from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Product, Evaluation } from "../types";
import { translateProduct } from "../lib/translate";
import { resolveProductImages } from "../lib/productImages";
import { getProductImageAlt, getProductsPageSeoTitle } from "../lib/productSeoText";
import SmartImage from "./common/SmartImage";
import Breadcrumbs from "./Breadcrumbs";
import { getPageCopy } from "../config/pageCopy";
import MultiCompareView from "./MultiCompareView";
import { clearJsonLd, setCollectionPageJsonLd, setJsonLd } from "../lib/seoJsonLd";
import { cleanVisibleSourceText } from "../lib/visibleText";

function SafetyRadarChart({ product, evaluation, lang = "zh", isDark = false }: { product?: Product; evaluation?: Evaluation; lang: "zh" | "en", isDark?: boolean }) {
  const clampScore = (value: unknown, fallback: number) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) return fallback;
    return Math.max(0, Math.min(10, numeric));
  };

  const fallbackScores = useMemo(() => {
    if (!product) {
      return { safety: 7.8, comfort: 7.8, portability: 7.8, features: 7.8, valueForMoney: 7.8 };
    }
    const comfort = product.category === "stroller"
      ? 9.1
      : product.category === "scooter"
        ? 8.3
        : String(product.tireType || "").includes("充气")
          ? 8.9
          : 7.4;
    const valueForMoney = Number(product.price || 0) < 600
      ? 9.4
      : Number(product.price || 0) < 2000
        ? 8.6
        : Number(product.price || 0) < 4000
          ? 7.6
          : 6.9;
    return {
      safety: Number(product.safetyScore || product.overallScore || 7.8),
      comfort,
      portability: Number(product.weightScore || 7.8),
      features: Number(product.geometryScore || product.overallScore || 7.8),
      valueForMoney,
    };
  }, [product]);

  const radarData = useMemo(() => {
    const safety = clampScore(evaluation?.scores?.safety ?? product?.safetyScore, fallbackScores.safety);
    const comfort = clampScore(evaluation?.scores?.comfort, fallbackScores.comfort);
    const portability = clampScore(evaluation?.scores?.portability ?? product?.weightScore, fallbackScores.portability);
    const features = clampScore(evaluation?.scores?.features ?? product?.geometryScore, fallbackScores.features);
    const valueForMoney = clampScore(evaluation?.scores?.valueForMoney, fallbackScores.valueForMoney);

    if (lang === "en") {
      return [
        { subject: "Safety", scoreA: safety },
        { subject: "Comfort", scoreA: comfort },
        { subject: "Portability", scoreA: portability },
        { subject: "Functionality", scoreA: features },
        { subject: "Value", scoreA: valueForMoney },
      ];
    }

    return [
      { subject: "安全性", scoreA: safety },
      { subject: "舒适度", scoreA: comfort },
      { subject: "便携性", scoreA: portability },
      { subject: "功能性", scoreA: features },
      { subject: "性价比", scoreA: valueForMoney },
    ];
  }, [evaluation?.scores, fallbackScores, lang, product?.geometryScore, product?.safetyScore, product?.weightScore]);

  const CustomRadarTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xl space-y-2 text-xs pointer-events-none z-50">
        <div className="font-bold text-slate-800 border-b border-slate-50 pb-2 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
          {data.subject}
        </div>
        <div className="flex items-center justify-between gap-8">
          <span className="text-slate-500 font-medium">Score:</span>
          <span className="text-orange-600 font-black text-right">{Number(data.scoreA).toFixed(1)} / 10</span>
        </div>
      </div>
    );
  };

  const radarAriaLabel = getPageCopy(lang).reviews.radarAriaLabel;
  const seriesName = lang === "zh" ? "维度得分" : "Dimension Score";

  return (
    <div className={`h-[300px] w-full rounded-[32px] border p-4 ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-100"}`} role="img" aria-label={radarAriaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis
            dataKey="subject"
            tick={(props: any) => {
              const { payload, x, y, textAnchor, ...rest } = props;
              return (
                <text
                  {...rest}
                  x={x}
                  y={y}
                  textAnchor={textAnchor}
                  className={`font-bold text-[11px] ${isDark ? "fill-slate-300" : "fill-slate-400"}`}
                >
                  {payload.value}
                </text>
              );
            }}
          />
          <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
          <Tooltip content={<CustomRadarTooltip />} />
          <Radar
            name={seriesName}
            dataKey="scoreA"
            stroke="#f97316"
            fill="#f97316"
            fillOpacity={0.2}
            strokeWidth={3}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

const DEFAULT_VERDICT_PATTERNS = [
  "pending editorial enrichment",
  "please enrich editorial content before publishing",
  "edit and save to persist into cms",
  "independently verified stroller or bicycle setup",
  "generated from remote fallback content source",
  "static fallback product",
  "请补充评测",
  "请编辑后保存到 cms",
  "待编辑",
  "自动生成评语",
  "自动生成",
  "未编辑",
  "auto-generated",
  "auto-generated verdict",
  "categorized as",
  "reference price of",
  "check fit against age",
  "amazon exclusive",
  "lean-to-steer mechanism",
  "motion-activated led wheels",
  "balances speed with handling stability",
  "quick-fold portability",
  "a top-tier scooter"
];

function containsCjk(text: string) {
  return /[\u4e00-\u9fff]/.test(String(text || ""));
}

function isRealVerdict(text: string) {
  const v = String(text || "").trim().toLowerCase();
  if (v.length < 45) return false;
  return !DEFAULT_VERDICT_PATTERNS.some((p) => v.includes(p));
}

function localizeEnglishModelTermsForZh(text: string): string {
  return String(text || "")
    .replace(/travel\s*system/gi, "出行系统")
    .replace(/jogging\s*stroller|jogger\s*stroller/gi, "慢跑推车")
    .replace(/double\s*stroller|twin\s*stroller/gi, "双人推车")
    .replace(/stroller/gi, "推车")
    .replace(/balance\s*bike/gi, "平衡车")
    .replace(/kids?\s*bike|bicycle/gi, "儿童自行车")
    .replace(/kids?\s*scooter|scooter/gi, "儿童滑板车")
    .replace(/electric\s*car|electric\s*vehicle/gi, "儿童电动车")
    .replace(/car\s*seat/gi, "安全座椅")
    .replace(/\s+/g, " ")
    .trim();
}

function buildZhReviewDisplayTitle(product: Product, detailTitleSuffix: string): string {
  const localized = translateProduct(product, "zh");
  const brand = String((product as any).zh?.brand || localized.brand || product.brand || "").trim();
  const rawName = String((product as any).zh?.name || localized.name || product.name || "").trim();
  const shortName = localizeEnglishModelTermsForZh(sanitizeMarketplaceNoise(rawName))
    .replace(/^\W+|\W+$/g, "")
    .slice(0, 48)
    .trim();
  const base = `${brand} ${shortName}`.replace(/\s+/g, " ").trim();
  return `${base || "该产品"} ${detailTitleSuffix}`.trim();
}

function isMixedLanguageTitleTooNoisy(title: string): boolean {
  const text = String(title || "").trim();
  if (!text) return false;
  const latinChunks = text.match(/[A-Za-z]{3,}/g) || [];
  return text.length > 34 && latinChunks.length >= 4;
}

function getLocalizedReviewTitle(product: Product, evaluation: Evaluation, lang: "zh" | "en", detailTitleSuffix: string): string {
  if (lang === "en") {
    const enTitle = String(evaluation.en?.title || "").trim();
    if (enTitle && !containsCjk(enTitle)) return enTitle;
    return getReviewCardTitle(product);
  }

  const zhTitle = String(evaluation.zh?.title || "").trim();
  if (zhTitle && containsCjk(zhTitle)) {
    const normalizedZhTitle = localizeEnglishModelTermsForZh(zhTitle);
    if (!isMixedLanguageTitleTooNoisy(normalizedZhTitle)) return normalizedZhTitle;
  }

  return buildZhReviewDisplayTitle(product, detailTitleSuffix);
}

function getLocalizedReviewVerdict(product: Product, evaluation: Evaluation, lang: "zh" | "en"): string {
  if (lang === "en") {
    const enVerdict = sanitizeVerdictText(String(evaluation.en?.verdict || ""));
    if (enVerdict && !containsCjk(enVerdict) && isRealVerdict(enVerdict)) return enVerdict;
    const fallback = sanitizeVerdictText(productVerdict(product, "en"));
    return fallback || "Detailed evaluation and lab results verified from structured product data.";
  }

  const zhVerdict = sanitizeVerdictText(String(evaluation.zh?.verdict || ""));
  if (zhVerdict && containsCjk(zhVerdict) && isRealVerdict(zhVerdict)) return zhVerdict;

  const fallback = sanitizeVerdictText(productVerdict(product, "zh"));
  if (fallback && containsCjk(fallback)) return fallback;

  const zhName = String((product as any).zh?.name || product.name || "").trim();
  return `针对${zhName || "该产品"}的结构化安全与操控评估，建议结合年龄、身高与使用场景进一步确认。`;
}

function cleanEnBrandText(brand: string) {
  const lowercase = String(brand || "").toLowerCase();
  if (lowercase.includes("gamfeiny")) return "Gamfeiny";
  if (lowercase.includes("umatoll")) return "Umatoll";
  if (lowercase.includes("sereed")) return "Sereed";
  if (lowercase.includes("kriddo")) return "Kriddo";
  if (lowercase.includes("joystar")) return "Joystar";
  if (lowercase.includes("royalbaby") || lowercase.includes("优贝")) return "RoyalBaby";
  if (lowercase.includes("glerc")) return "Glerc";
  if (lowercase.includes("weize")) return "Weize";
  if (lowercase.includes("retrospec")) return "Retrospec";
  if (lowercase.includes("chicco")) return "Chicco";
  if (lowercase.includes("baby trend")) return "Baby Trend";
  if (lowercase.includes("bob gear") || lowercase.includes("bob")) return "BOB Gear";
  if (lowercase.includes("yoyo") || lowercase.includes("babyzen")) return "Babyzen";
  if (lowercase.includes("mompush")) return "Mompush";
  if (lowercase.includes("infans")) return "Infans";
  if (lowercase.includes("razor")) return "Razor";
  if (lowercase.includes("dream on me")) return "Dream On Me";
  if (/[\u4e00-\u9fff]/.test(brand)) {
    return brand.replace(/[\u4e00-\u9fff]/g, "").trim() || "BalanceBikeToddler";
  }
  return brand;
}

function sanitizeMarketplaceNoise(raw: string) {
  let text = String(raw || "").trim();
  if (!text) return "";
  
  // Special explicit overrides for known long-tail spam products
  const lowercase = text.toLowerCase();
  if (lowercase.includes("mamazing") && lowercase.includes("ultra air")) {
    return "MAMAZING Ultra Air Lightweight Travel Stroller";
  }
  if (lowercase.includes("colorful led") || lowercase.includes("gamfeiny")) {
    if (lowercase.includes("illuminated")) return "Gamfeiny Illuminated Balance Bike";
    return "Gamfeiny LED Balance Bike";
  }
  if (lowercase.includes("umatoll")) {
    return "Umatoll Toddler Balance Bike";
  }
  if (lowercase.includes("sereed")) {
    return "Sereed Toddler Balance Bike";
  }
  if (lowercase.includes("kriddo")) {
    return "Kriddo Kids Balance Bike";
  }
  if (lowercase.includes("cubsala")) {
    return "Cubsala BMX Kids Bike";
  }
  if (lowercase.includes("besrey")) {
    return "Besrey Kids Scooter";
  }
  if (lowercase.includes("hurtle")) {
    return "Hurtle 3-Wheel Scooter";
  }
  if (lowercase.includes("dream on me")) {
    return "Dream On Me Aero Travel Umbrella Stroller";
  }
  if (lowercase.includes("razor") && lowercase.includes("mx350")) {
    return "Razor MX350 Electric Dirt Bike";
  }
  if (lowercase.includes("colorful lighting") || lowercase.includes("colorful glow")) {
    return "Colorful Glow-Wheel Baby Balance Bike";
  }

  // Pre-trimming Amazon titles separated by commas, semicolons, or parenthetical items
  // Since Amazon sellers append long strings of keyword specs after a comma or dash.
  const separators = [",", ";", " - ", " – "];
  for (const sep of separators) {
    if (text.includes(sep)) {
      const parts = text.split(sep);
      const firstSegment = parts[0].trim();
      if (firstSegment.length >= 12) {
        text = firstSegment;
        break;
      }
    }
  }

  // Generic cleanup to strip off detailed specification lists often found in Amazon titles
  text = text
    .replace(/\bwith\s+Carbon\s+Fiber\s+Frame[^,.;|)]*/gi, "")
    .replace(/\bCompact\s*&\s*Airplane-Friendly[^,.;|)]*/gi, "")
    .replace(/\bOne-Handed\s+Fold[^,.;|)]*/gi, "")
    .replace(/\bOrganizer\s*&\s*Cushion\s+Included[^,.;|)]*/gi, "")
    .replace(/\btoys?\s+for\s+\d+\s*year\s*old[^,.;|)]*/gi, "")
    .replace(/\bgifts?\s+for\s+[^,.;|)]*/gi, "")
    .replace(/\bfor\s+(boys?|girls?|toddlers?|kids|children)\b[^,.;|)]*/gi, "")
    .replace(/\bfor\s+ages?\s*\d+[^,.;|)]*/gi, "")
    .replace(/\b\d+(\.\d+)?\s*(lbs|kg)\b[^,.;|)]*/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  // Strip off common trailing clauses after "with", "for", ",", ";"
  const cutOffs = [" with ", " for ", " - ", " – "];
  for (const cut of cutOffs) {
    const idx = text.toLowerCase().indexOf(cut);
    if (idx > 15) {
      text = text.substring(0, idx).trim();
    }
  }
  
  // Strip off any trailing commas/marks
  text = text.replace(/[,.;|)]+$/, "").trim();
  return text;
}

function clampText(value: string, maxLength: number) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/[\s,;:.!?-]+$/g, "").trim();
}

function stripBrandPrefix(text: string, brand: string) {
  const normalizedText = String(text || "").trim();
  const normalizedBrand = String(brand || "").trim();
  if (!normalizedText || !normalizedBrand) return normalizedText;
  const escapedBrand = normalizedBrand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const cleaned = normalizedText.replace(new RegExp(`^${escapedBrand}(?:\\s+|[-:|]+\\s*)`, "i"), "").trim();
  return cleaned || normalizedText;
}

function compactModelSegment(name: string, lang: "zh" | "en") {
  const cleaned = String(name || "").replace(/\s+/g, " ").trim();
  if (!cleaned) return "";

  if (lang === "zh") {
    return clampText(cleaned, 18);
  }

  const tokens = cleaned.split(" ").filter(Boolean);
  const stopWords = new Set([
    "with",
    "for",
    "and",
    "lightweight",
    "compact",
    "travel",
    "airplane",
    "friendly",
    "approved",
    "fold",
    "folding",
    "stroller",
    "jogger",
    "system",
    "months",
    "month",
    "infant",
    "toddler"
  ]);

  const chosen: string[] = [];
  for (const token of tokens) {
    const normalized = token.toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (!normalized) continue;
    if (chosen.length > 0 && stopWords.has(normalized)) break;
    chosen.push(token.replace(/[^A-Za-z0-9-]/g, ""));
    if (chosen.length >= 3) break;
  }

  const fallback = tokens.slice(0, 2).join(" ");
  return (chosen.join(" ") || fallback || cleaned).trim();
}

function getCompactCompareDisplayName(product: Product, lang: "zh" | "en" = "en") {
  if (lang === "zh") {
    const brand = String(product.brand || "").trim();
    const localizedName = String((product as any).zh?.name || product.name || "").trim();
    const modelRaw = stripBrandPrefix(localizedName, brand);
    const model = compactModelSegment(modelRaw, "zh");
    return clampText(`${brand} ${model}`.trim(), 24);
  }

  const brand = cleanEnBrandText(product.brand || "");
  const localizedName = String((product as any).en?.name || product.name || "").trim();
  const sanitizedName = sanitizeMarketplaceNoise(localizedName);
  const modelRaw = stripBrandPrefix(sanitizedName, brand);
  const model = compactModelSegment(modelRaw, "en");
  return clampText(`${brand} ${model}`.trim(), 32);
}

function sanitizeVerdictText(raw: string) {
  let text = String(raw || "").trim();
  if (!text) return text;
  
  // Strip off typical Amazon Bullet Point capitalized headers and marketing jargon
  // Like "GROW IN FUN:", "VERSATILE 2-IN-1 MODE -", "EXCITING GLOWING WHEELS", "SAFELY RIDE:"
  text = text
    .replace(/[【\[]\s*[A-Z]{2,20}\s*[】\]]/g, " ")
    .replace(/[【\[]\s*[A-Z]{1,20}\s+[A-Z]{1,20}\s*[】\]]/g, " ")
    .replace(/\b(?:feature|features|bullet|spec|specs)\s*\[\s*\d+\s*\]/gi, " ")
    .replace(/\b(?:scraped|crawler|crawl|selector|xpath|dom|listing|asin)\b\s*[:=-]?\s*/gi, " ")
    .replace(/\b[A-Z][A-Z0-9\s&-]{4,18}\s*[:-：]\s*/g, " ")
    .replace(/The editorial verdict is based on structured product data rather than marketplace sales copy\.?/gi, "")
    .replace(/^["“”']?\s*Review\s+Lab\s+Insight\s*[:：-]\s*/i, "")
    .replace(/\bReview\s+Lab\s+Insight\b\s*[:：-]?\s*/gi, "")
    .replace(/^["“”'\[]?\s*(?:Review\s+)?Lab\s+Report\]?\s*[:：-]\s*/i, "")
    .replace(/\b(?:Review\s+)?Lab\s+Report\b\s*[:：-]?\s*/gi, "")
    .replace(/Review verdict:\s*/gi, "")
    .replace(/\s+/g, " ")
    .trim();
    
  return text;
}

function hasScraperFootprint(text: string) {
  const value = String(text || "").trim();
  if (!value) return false;
  return (
    /[【\[]\s*[A-Z]{2,20}(?:\s+[A-Z]{2,20})*\s*[】\]]/.test(value) ||
    /\b(?:feature|features|bullet|spec|specs)\s*\[\s*\d+\s*\]/i.test(value) ||
    /\b(?:scraped|crawler|crawl|selector|xpath|dom|listing|asin)\b/i.test(value) ||
    /\b(?:SIGN|KIDS|BABY|TODDLER|FOLD|TRAVEL)\b\s*[】\]]/.test(value)
  );
}

function finalizeVerdictText(raw: string) {
  const cleaned = sanitizeVerdictText(cleanVisibleSourceText(raw || ""));
  if (!cleaned) return "";
  return cleaned.length > 480 ? cleaned.slice(0, 480).trim() : cleaned;
}

function ensureSentenceEnd(text: string) {
  const cleaned = String(text || "").trim();
  if (!cleaned) return cleaned;
  if (/[.。！？!?]$/.test(cleaned)) return cleaned;
  return `${cleaned}.`;
}

function clampSummaryForDisplay(text: string, maxLength = 480) {
  const cleaned = String(text || "").replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.slice(0, maxLength).trim();
}

function productVerdict(product: Product, lang: "zh" | "en" = "en") {
  const reviewBusinessCopy = getPageCopy(lang).reviews.businessCopy;
  const diProduct = translateProduct(product, lang);
  const rawVerdict = String(diProduct.editorVerdict || "").trim();
  const sanitizedRawVerdict = finalizeVerdictText(rawVerdict);
  
  const isReal = isRealVerdict(sanitizedRawVerdict) && !(lang === "en" && containsCjk(sanitizedRawVerdict)) && !hasScraperFootprint(rawVerdict);

  if (isReal) {
    return sanitizedRawVerdict;
  }

  const brand = lang === "en" ? cleanEnBrandText(diProduct.brand || "") : diProduct.brand || reviewBusinessCopy.fallbackBrandZh;
  const modelName = sanitizeMarketplaceNoise(diProduct.name || "");
  const category = String(diProduct.category || diProduct.categoryId || "ride").replace(/_/g, " ").toLowerCase();
  const rating = Number(diProduct.overallScore || 8.0).toFixed(1);

  if (lang === "zh") {
    if (category.includes("stroller")) {
      return reviewBusinessCopy.verdictTemplates.strollerZh
        .replace("{brand}", brand)
        .replace("{modelName}", modelName)
        .replace("{rating}", rating);
    }
    if (category.includes("balance")) {
      return reviewBusinessCopy.verdictTemplates.balanceZh
        .replace("{brand}", brand)
        .replace("{modelName}", modelName)
        .replace("{rating}", rating);
    }
    if (category.includes("bike") || category.includes("bicycle")) {
      return reviewBusinessCopy.verdictTemplates.bikeZh
        .replace("{brand}", brand)
        .replace("{modelName}", modelName)
        .replace("{rating}", rating);
    }
    return reviewBusinessCopy.verdictTemplates.defaultZh
      .replace("{brand}", brand)
      .replace("{modelName}", modelName)
      .replace("{rating}", rating);
  } else {
    const cleanBrand = cleanEnBrandText(brand);
    if (category.includes("stroller")) {
      return reviewBusinessCopy.verdictTemplates.strollerEn
        .replace("{cleanBrand}", cleanBrand)
        .replace("{brand}", brand)
        .replace("{modelName}", modelName)
        .replace("{rating}", rating);
    }
    if (category.includes("balance")) {
      return reviewBusinessCopy.verdictTemplates.balanceEn
        .replace("{cleanBrand}", cleanBrand)
        .replace("{brand}", brand)
        .replace("{modelName}", modelName)
        .replace("{rating}", rating);
    }
    if (category.includes("bike") || category.includes("bicycle")) {
      return reviewBusinessCopy.verdictTemplates.bikeEn
        .replace("{cleanBrand}", cleanBrand)
        .replace("{brand}", brand)
        .replace("{modelName}", modelName)
        .replace("{rating}", rating);
    }
    return reviewBusinessCopy.verdictTemplates.defaultEn
      .replace("{cleanBrand}", cleanBrand)
      .replace("{brand}", brand)
      .replace("{modelName}", modelName)
      .replace("{rating}", rating);
  }
}

function hasRealEditorVerdict(product: Product) {
  return isRealVerdict(product.editorVerdict || "");
}

function isFocusReviewProduct(product: Product) {
  const text = `${product.category || ""} ${product.categoryId || ""}`.toLowerCase();
  const source = `${product.brand || ""} ${product.name || ""} ${product.description || ""} ${text}`.toLowerCase();
  
  // Exclude Kid Dirt Bikes from the review section entirely
  if (source.includes("dirt bike") || source.includes("dirtbike") || source.includes("motocross") || source.includes("motorcycle")) {
    return false;
  }
  
  return text.includes("stroller") || text.includes("balance") || text.includes("bicycle") || text.includes("bike") || text.includes("scooter") || source.includes("off-road") || source.includes("off road");
}

function getProductScores(product: Product) {
  const safety = Number(product.safetyScore || product.overallScore || 8.2);
  const comfort = product.category === "scooter" ? 8.5 : product.tireType?.toLowerCase().includes("pneumatic") || product.tireType?.includes("充气") ? 9.4 : 8.1;
  const portability = Number(product.weightScore || (product.weight > 0 ? Math.max(6.2, 10 - product.weight / 8) : 8));
  const features = Number(product.geometryScore || product.overallScore || 8.1);
  const valueForMoney = Number(Math.min(10, Math.max(6, (product.overallScore || 8) + (product.price > 0 ? Math.max(-1.5, 1.2 - product.price / 1200) : 0.4))).toFixed(1));
  return { safety, comfort, portability, features, valueForMoney };
}

function productValueScore(product: Product) {
  const score = Number(product.overallScore || 8);
  const price = Number(product.price || 0);
  const priceBoost = price > 0 ? Math.max(0, 3 - price / 500) : 1;
  return score + priceBoost + Number(product.reviewCount || 0) / 100000;
}

function getProductDisplayName(product: Product) {
  const brand = cleanEnBrandText(product.brand || "");
  let pName = sanitizeMarketplaceNoise(product.name || "");
  const brandLower = brand.toLowerCase();
  if (pName.toLowerCase().startsWith(brandLower)) {
    pName = pName.substring(brandLower.length).trim();
  }
  return `${brand} ${pName}`;
}

function getCommercialReviewTitle(product: Product, fallbackTitle: string) {
  const text = `${product.brand || ""} ${product.name || ""} ${product.description || ""} ${product.category || ""} ${product.categoryId || ""}`.toLowerCase();
  const brand = cleanEnBrandText(product.brand || "");
  if (text.includes("chicco") && text.includes("bravo")) return "Chicco Bravo Trio: Comprehensive Stroller Reviews";
  if (text.includes("bob gear") || text.includes("jogging stroller") || text.includes("jogger")) return `${brand} Alterrain: Best Jogging Stroller Reviews`;
  if (text.includes("travel stroller") || text.includes("coast rider") || text.includes("yoyo") || text.includes("mompush") || text.includes("passport")) return `${brand} Ultra Air: Best Travel Stroller Review`;
  if (text.includes("stroller")) return `${brand}: Comprehensive Stroller Reviews`;
  return fallbackTitle;
}

function getReviewCardTitle(product: Product, fallbackTitle?: string) {
  const normalized = `${product.brand || ""} ${product.name || ""} ${product.description || ""}`.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (normalized.includes("jmmd")) return "JMMD 6-in-1 Convertible Toddler Bike Reviews";
  if (normalized.includes("glerc") && normalized.includes("rover")) return "Glerc Rover 12\" Kids Bike Reviews";
  if (normalized.includes("glerc") && normalized.includes("bmx")) return "Glerc BMX Style Kids Bike Reviews";
  if (normalized.includes("weize")) return "Weize Dual Suspension Kids Bike Review";
  if (normalized.includes("glerc") && (normalized.includes("petal") || normalized.includes("princess"))) return "Glerc Petal Princess Bike Reviews";
  const baseTitle = getProductsPageSeoTitle(product).replace(/\s+Review$/i, "").trim();
  return fallbackTitle || `${baseTitle} Review`;
}

function getReviewCtaLabel(product: Product, evaluation: Evaluation, lang: "zh" | "en") {
  const ctaCopy = getPageCopy(lang).reviews.businessCopy.dynamicCta;
  const text = `${product.category || ""} ${product.categoryId || ""} ${product.name || ""} ${evaluation.en?.title || ""} ${evaluation.zh?.title || ""}`.toLowerCase();

  if (lang === "en") {
    if (text.includes("stroller") || text.includes("jogger") || text.includes("travel")) return ctaCopy.strollerEn;
    if (text.includes("balance")) return ctaCopy.balanceEn;
    if (text.includes("scooter")) return ctaCopy.scooterEn;
    if (text.includes("bike") || text.includes("bicycle")) return ctaCopy.bikeEn;
    return ctaCopy.defaultEn;
  }

  if (text.includes("stroller") || text.includes("jogger") || text.includes("travel")) return ctaCopy.strollerZh;
  if (text.includes("balance")) return ctaCopy.balanceZh;
  if (text.includes("scooter")) return ctaCopy.scooterZh;
  if (text.includes("bike") || text.includes("bicycle")) return ctaCopy.bikeZh;
  return ctaCopy.defaultZh;
}

function cleanReviewBullet(value: unknown, fallback: string) {
  let cleaned = cleanVisibleSourceText(value)
    .replace(/【[^】]*】/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\b[A-Z][A-Z0-9\s&-]{4,18}\s*[:-：]\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned || cleaned.length < 18) return fallback;
  return cleaned.length > 140 ? cleaned.slice(0, 140).trim() : cleaned;
}

function makeSingleEvaluation(product: Product, type: Evaluation["type"], suffix: string, zhTitle: string, enTitle: string, verdictPrefixZh = "专家摘要", verdictPrefixEn = "Expert summary"): Evaluation {
  const title = getProductDisplayName(product);
  const cleanTitle = getReviewCardTitle(product, enTitle.includes("{product}") ? undefined : enTitle);
  const prosSource = (product.pros || product.features || []).slice(0, 4);
  const consSource = (product.cons || []).slice(0, 4);
  const pros = prosSource.length > 0
    ? prosSource.map((item) => cleanReviewBullet(item, "Structured product data supports this performance note."))
    : ["Structured scoring shows a balanced safety and usability profile."];
  const cons = consSource.length > 0
    ? consSource.map((item) => cleanReviewBullet(item, "Confirm fit, terrain, and supervision needs before buying."))
    : ["Confirm fit, terrain, and supervision needs before buying."];

  const zhPros = pros.map((item) => containsCjk(item) ? item : "结构数据支持该项表现。");
  const zhCons = cons.map((item) => containsCjk(item) ? item : "建议结合年龄、身高与使用场景确认。");
  const enPros = pros.map((item) => containsCjk(item) ? "Structured product data supports this performance note." : item);
  const enCons = cons.map((item) => containsCjk(item) ? "Confirm fit, terrain, and supervision needs before buying." : item);

  return {
    id: `generated_${type}_${suffix}_${product.id}`.replace(/[^a-zA-Z0-9_-]/g, "_"),
    type,
    productId: product.id,
    productIds: [product.id],
    status: "published",
    version: "V2026.7",
    scores: getProductScores(product),
    imageUrl: product.imageUrl || product.galleryUrls?.[0] || "",
    zh: {
      title: zhTitle.replace("{product}", title),
      verdict: `${verdictPrefixZh}：${productVerdict(product, "zh")}`,
      pros: zhPros,
      cons: zhCons,
      changelog: "由产品详情、评分字段与专家摘要自动生成。",
    },
    en: {
      title: cleanTitle,
      verdict: `${finalizeVerdictText(productVerdict(product, "en"))}`,
      pros: enPros,
      cons: enCons,
      changelog: "Generated from product details, score fields, and expert summary.",
    },
    updatedAt: new Date("2026-07-09"),
  };
}

function makeCompareEvaluation(id: string, products: Product[], zhTitle: string, enTitle: string): Evaluation {
  const scores = products.map(getProductScores);
  const average = (key: keyof ReturnType<typeof getProductScores>) => Number((scores.reduce((sum, item) => sum + item[key], 0) / Math.max(1, scores.length)).toFixed(1));
  const names = products.map((p) => getCompactCompareDisplayName(p, "en")).join(" vs ");
  const namesZh = products.map((p) => getCompactCompareDisplayName(p, "zh")).join(" 对比 ");

  return {
    id,
    type: "compare",
    productId: products[0].id,
    productIds: products.map((product) => product.id),
    status: "published",
    version: "V2026.7",
    scores: {
      safety: average("safety"),
      comfort: average("comfort"),
      portability: average("portability"),
      features: average("features"),
      valueForMoney: average("valueForMoney"),
    },
    imageUrl: products[0].imageUrl || products[0].galleryUrls?.[0] || "",
    zh: {
      title: zhTitle,
      verdict: clampText(`多品评测覆盖 ${namesZh}，按安全、舒适、便携、功能和性价比维度形成横向结果。`, 120),
      pros: products.slice(0, 4).map((product) => `${getCompactCompareDisplayName(product, "zh")}：${cleanReviewBullet(product.pros?.[0] || productVerdict(product, "zh"), "结构数据支持该项表现。")}`),
      cons: products.slice(0, 4).map((product) => `${getCompactCompareDisplayName(product, "zh")}：${cleanReviewBullet(product.cons?.[0], "建议结合年龄、身高与使用场景确认。")}`),
      changelog: "由当前产品数据自动生成多品评测结果。",
    },
    en: {
      title: enTitle,
      verdict: clampText(`Cross comparison across ${names} with five-factor scoring and practical fit notes.`, 200),
      pros: products.slice(0, 4).map((product) => {
        const bullet = cleanReviewBullet(product.pros?.[0] || productVerdict(product, "en"), "Structured product data supports this performance note.");
        return `${getCompactCompareDisplayName(product, "en")}: ${containsCjk(bullet) ? "Structured product data supports this performance note." : bullet}`;
      }),
      cons: products.slice(0, 4).map((product) => {
        const bullet = cleanReviewBullet(product.cons?.[0], "Confirm age, height, and use case fit before buying.");
        return `${getCompactCompareDisplayName(product, "en")}: ${containsCjk(bullet) ? "Confirm age, height, and use case fit before buying." : bullet}`;
      }),
      changelog: "Generated from current product data as a multi-product review result.",
    },
    updatedAt: new Date("2026-07-09"),
  };
}

export function buildGeneratedEvaluations(productsData: Product[]): Evaluation[] {
  const seenModelKeys = new Set<string>();
  const focusProducts: Product[] = [];
  const isStrollerCompareCandidate = (product: Product) => {
    const categoryId = String(product.categoryId || "").toLowerCase().trim();
    const category = String(product.category || "").toLowerCase().trim();
    const signalText = [
      product.brand,
      product.name,
      product.description,
      product.Product_Description,
      product.editorVerdict,
      product.category,
      product.categoryId,
    ]
      .map((item) => String(item || "").toLowerCase())
      .join(" ");

    const allowedCategoryIds = new Set(["stroller", "double_stroller", "jogger_stroller"]);
    const hasAllowedCategory = allowedCategoryIds.has(categoryId) || category === "stroller";
    if (!hasAllowedCategory) return false;

    const hasStrollerSignal =
      signalText.includes("stroller") ||
      signalText.includes("jogger") ||
      signalText.includes("jogging stroller") ||
      signalText.includes("travel system") ||
      signalText.includes("double stroller") ||
      signalText.includes("twin stroller");

    if (!hasStrollerSignal) return false;

    const hasSeatOnlySignal =
      signalText.includes("car seat") ||
      signalText.includes("booster seat") ||
      signalText.includes("infant seat") ||
      signalText.includes("convertible car seat") ||
      signalText.includes("safety seat") ||
      categoryId === "car_seat" ||
      category === "safety_seat";

    return !hasSeatOnlySignal;
  };
  
  const sortedRawFocus = productsData
    .filter((product) => product.status !== "archived" && isFocusReviewProduct(product))
    .sort((a, b) => Number(b.overallScore || 0) - Number(a.overallScore || 0));

  for (const product of sortedRawFocus) {
    const brand = String(product.brand || "").toLowerCase().trim();
    const cleanName = sanitizeMarketplaceNoise(product.name || "").toLowerCase();
    const nameWords = cleanName.split(/\s+/).slice(0, 3).join(" ");
    const modelKey = `${brand}:${nameWords}`;
    
    if (seenModelKeys.has(modelKey)) {
      continue;
    }
    seenModelKeys.add(modelKey);
    focusProducts.push(product);
  }

  const verdictProducts = focusProducts.filter(hasRealEditorVerdict);

  const byCategory = (needle: string) => focusProducts.filter((product) => {
    const categoryId = String(product.categoryId || "").toLowerCase();
    const category = String(product.category || "").toLowerCase();
    
    if (needle === "stroller") {
      return isStrollerCompareCandidate(product);
    }
    if (needle === "balance") {
      return categoryId.includes("balance") || category.includes("balance");
    }
    if (needle === "scooter") {
      return categoryId.includes("scooter") || category.includes("scooter");
    }
    if (needle === "bike") {
      return (categoryId === "kids_bikes" || categoryId === "bicycle" || category === "bicycle" || category === "kids_bikes") 
        && !categoryId.includes("balance") && !category.includes("balance")
        && !categoryId.includes("tricycle") && !category.includes("tricycle")
        && !categoryId.includes("scooter") && !category.includes("scooter");
    }
    return categoryId.includes(needle) || category.includes(needle);
  });

  const balanceProducts = byCategory("balance");
  const bikeProducts = byCategory("bike");
  const scooterProducts = byCategory("scooter");
  const strollerProducts = byCategory("stroller");

  const isJoggingStrollerCandidate = (product: Product) => {
    const categoryId = String(product.categoryId || "").toLowerCase().trim();
    const category = String(product.category || "").toLowerCase().trim();
    const text = [
      product.brand,
      product.name,
      product.description,
      product.Product_Description,
      product.editorVerdict,
      product.category,
      product.categoryId,
    ]
      .map((item) => String(item || "").toLowerCase())
      .join(" ");

    const hasJoggingSignal =
      categoryId === "jogger_stroller" ||
      text.includes("jogging stroller") ||
      text.includes("jogger stroller") ||
      text.includes("jogger") ||
      text.includes("running stroller") ||
      text.includes("all-terrain stroller") ||
      text.includes("all terrain stroller") ||
      text.includes("alterrain") ||
      text.includes("expedition") ||
      text.includes("summit");

    if (!hasJoggingSignal) return false;

    const hasBlockedSignal = text.includes("wagon") || text.includes("car seat");

    if (hasBlockedSignal) return false;

    return category === "stroller" || categoryId.includes("stroller") || categoryId === "jogger_stroller";
  };

  const joggingPoolFromRaw = sortedRawFocus.filter(isJoggingStrollerCandidate);
  const joggingPoolWithFallback = joggingPoolFromRaw.length > 0 ? joggingPoolFromRaw : strollerProducts.filter(isJoggingStrollerCandidate);
  const strollerCompareProducts = joggingPoolWithFallback.slice(0, 4);

  const findProduct = (matcher: (text: string) => boolean) => focusProducts.find((product) => matcher(`${product.brand || ""} ${product.name || ""} ${product.description || ""} ${product.category || ""} ${product.categoryId || ""}`.toLowerCase()));
  const commercialSeeds = [
    findProduct((text) => text.includes("yoyo") || text.includes("travel stroller") || text.includes("coast rider") || text.includes("mompush")) || strollerProducts[0],
    findProduct((text) => text.includes("bob gear") || text.includes("jogging stroller") || text.includes("jogger")) || strollerProducts[1],
    findProduct((text) => text.includes("chicco") && text.includes("bravo")) || strollerProducts[2],
  ].filter(Boolean) as Product[];

  const seenSingleProductIds = new Set<string>();

  const commercialSingles = commercialSeeds
    .filter((product) => {
      if (seenSingleProductIds.has(product.id)) return false;
      seenSingleProductIds.add(product.id);
      return true;
    })
    .map((product, index) => makeSingleEvaluation(
      product,
      "single",
      `commercial_${index + 1}`,
      "{product} 高转化实验室评测",
      getCommercialReviewTitle(product, "{product} Stroller Reviews"),
      "评测结论",
      "Review verdict"
    ));

  const toddlerBikeSingles = bikeProducts
    .filter((product) => {
      if (seenSingleProductIds.has(product.id)) return false;
      seenSingleProductIds.add(product.id);
      return true;
    })
    .slice(0, 10)
    .map((product, index) => makeSingleEvaluation(
      product,
      "single",
      `bike_${index + 1}`,
      "{product} 童车单品深度评测",
      "{product} Toddler Bike Review"
    ));

  const singles = verdictProducts
    .filter((product) => {
      if (seenSingleProductIds.has(product.id)) return false;
      seenSingleProductIds.add(product.id);
      return true;
    })
    .slice(0, 120)
    .map((product, index) => makeSingleEvaluation(
      product,
      "single",
      String(index + 1),
      "{product} 单品专家摘要深度评测",
      "{product} Review"
    ));

  const compareGroups = [
    { products: strollerCompareProducts, zh: "慢跑推车横向评测", en: "Jogging Stroller Parent Compare" },
    { products: balanceProducts.slice(0, 4), zh: "Balance Bike 高分车型横向评测", en: "Balance Bike Top Picks Compare" },
    { products: bikeProducts.slice(0, 4), zh: "Kids Bike 安全与成长适配横向评测", en: "Toddler Bike Parent Picks Compare" },
    { products: scooterProducts.slice(0, 4), zh: "Kids Scooter 稳定性与便携横向评测", en: "Kids Scooter Parent Picks Compare" },
  ].filter((group) => group.products.length >= 3);

  const compares = compareGroups.map((group, index) => makeCompareEvaluation(`generated_compare_${index + 1}`, group.products, group.zh, group.en));

  const values = [...verdictProducts]
    .sort((a, b) => productValueScore(b) - productValueScore(a))
    .filter((product) => {
      if (seenSingleProductIds.has(product.id)) return false;
      seenSingleProductIds.add(product.id);
      return true;
    })
    .slice(0, 4)
    .map((product, index) => makeSingleEvaluation(
      product,
      "value",
      String(index + 1),
      "{product} 性价比最高推荐",
      "{product} Value Bank Pick",
      "性价比结论",
      "Value verdict"
    ));

  const rankingSeeds = [
    { product: focusProducts[0], zh: "季度排行冠军：{product}", en: "Quarterly Top Pick: {product}" },
    { product: [...focusProducts].sort((a, b) => Number(b.safetyScore || 0) - Number(a.safetyScore || 0))[0], zh: "半年安全排行冠军：{product}", en: "Half-Year Safety Leader: {product}" },
    { product: [...focusProducts].sort((a, b) => productValueScore(b) - productValueScore(a))[0], zh: "年度综合排行冠军：{product}", en: "Annual Overall Leader: {product}" },
  ].filter((item) => item.product && !seenSingleProductIds.has(item.product.id));

  const rankings = rankingSeeds.map((item, index) => {
    seenSingleProductIds.add(item.product!.id);
    return makeSingleEvaluation(
      item.product!,
      "ranking",
      String(index + 1),
      item.zh,
      item.en,
      "排行依据",
      "Ranking basis"
    );
  });

  const safetyTopics = verdictProducts
    .filter((product) => {
      if (seenSingleProductIds.has(product.id)) return false;
      seenSingleProductIds.add(product.id);
      return true;
    })
    .slice(0, 4)
    .map((product, index) => makeSingleEvaluation(
      product,
      "safety",
      String(index + 1),
      "{product} 专业安全知识专项",
      "{product} Safety Special Knowledge Brief",
      "安全知识",
      "Safety note"
    ));

  return [...commercialSingles, ...toddlerBikeSingles, ...singles, ...compares, ...values, ...rankings, ...safetyTopics];
}

export function getFrontVisibleEvaluations(evaluationsData: Evaluation[], productsData: Product[]): Evaluation[] {
  const resolveProductByReference = (rawId?: string) => {
    const normalized = String(rawId || "").trim().toLowerCase();
    if (!normalized) return null;

    return productsData.find((p) => {
      const productId = String(p.id || "").trim().toLowerCase();
      if (!productId) return false;
      if (productId === normalized) return true;
      const tail = productId.split("-").pop();
      return tail === normalized;
    }) || null;
  };

  const isMultiEvaluation = (ev: Evaluation) => ev.type === "compare" && (ev.productIds?.length || 0) > 1;

  const generatedEvaluations = buildGeneratedEvaluations(productsData);
  const generatedIds = new Set(generatedEvaluations.map((evaluation) => evaluation.id));
  const currentEvaluations = evaluationsData.filter((ev) => {
    if (ev.status !== "published" || generatedIds.has(ev.id)) return false;
    const ids = (ev.productIds && ev.productIds.length > 0 ? ev.productIds : [ev.productId]).filter(Boolean);
    return ids.some((id) => Boolean(resolveProductByReference(String(id))));
  });

  const singleKeysFromCurrent = new Set<string>();
  const compareKeysFromCurrent = new Set<string>();

  for (const ev of currentEvaluations) {
    const ids = (ev.productIds && ev.productIds.length > 0 ? ev.productIds : [ev.productId])
      .filter(Boolean)
      .map((id) => String(id));
    if (ev.type === "compare" && ids.length > 1) {
      const normalizedIds = ids
        .map((id) => resolveProductByReference(id)?.id || id)
        .sort();
      compareKeysFromCurrent.add(normalizedIds.join("|"));
    } else if (ids[0]) {
      singleKeysFromCurrent.add(resolveProductByReference(ids[0])?.id || ids[0]);
    }
  }

  const filteredGenerated = generatedEvaluations.filter((ev) => {
    const ids = (ev.productIds && ev.productIds.length > 0 ? ev.productIds : [ev.productId])
      .filter(Boolean)
      .map((id) => String(id));
    if (ev.type === "compare" && ids.length > 1) {
      const normalizedIds = ids
        .map((id) => resolveProductByReference(id)?.id || id)
        .sort();
      return !compareKeysFromCurrent.has(normalizedIds.join("|"));
    }
    const singleKey = ids[0] ? (resolveProductByReference(ids[0])?.id || ids[0]) : "";
    return !(singleKey && singleKeysFromCurrent.has(singleKey));
  });

  const combinedEvaluations = [...currentEvaluations, ...filteredGenerated];
  const seenRenderKeys = new Set<string>();

  return combinedEvaluations.filter((ev) => {
    const ids = (ev.productIds && ev.productIds.length > 0 ? ev.productIds : [ev.productId])
      .filter(Boolean)
      .map((id) => resolveProductByReference(String(id))?.id || String(id))
      .sort();
    const normalizedType = isMultiEvaluation(ev) ? "compare" : (ev.type || "single");
    const zhTitle = String(ev.zh?.title || "").trim().toLowerCase();
    const enTitle = String(ev.en?.title || "").trim().toLowerCase();
    const key = [normalizedType, ids.join("|"), zhTitle, enTitle].join("::");
    if (seenRenderKeys.has(key)) {
      return false;
    }
    seenRenderKeys.add(key);
    return true;
  });
}

function buildFallbackStructuredScoringStandards(product: Product, lang: "zh" | "en") {
  const localized = translateProduct(product, lang);
  const compliance = Array.isArray((product as any).safetyCertification)
    ? (product as any).safetyCertification
    : String((product as any).safetyCertification || "")
        .split(/[+,/|;]/)
        .map((item) => item.trim())
        .filter(Boolean);

  const comfortSignals = Array.isArray(localized.features)
    ? localized.features.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 2)
    : [];

  if (lang === "zh") {
    return [
      {
        key: "safety",
        label: "安全与合规",
        parentTip: "优先确认认证信息、制动结构与整体稳定性，再判断是否适合当前年龄段。",
        evidence: [
          { source: "认证", text: `认证信息：${(compliance.length ? compliance : ["待补充来源验证"]).join("、")}` },
          { source: "制动", text: `制动结构：${String((localized as any).brakeType || "待补充")}` },
        ],
      },
      {
        key: "comfort",
        label: "舒适与操控",
        parentTip: "重点看轮胎、座舱或把手设定，以及日常推行或骑行时的震动过滤表现。",
        evidence: [
          { source: "轮胎", text: `轮胎配置：${String((localized as any).tireType || "待补充")}` },
          { source: "亮点", text: `舒适信号：${(comfortSignals.length ? comfortSignals : ["等待补充座舱与避震说明"]).join("；")}` },
        ],
      },
      {
        key: "portability",
        label: "便携与日常使用",
        parentTip: "通勤、收纳与搬运场景里，重量与日常维护成本通常决定长期体验。",
        evidence: [
          { source: "重量", text: `整车重量：${String((product as any).weight || localized.weight || "待补充")}` },
          { source: "结论", text: String((localized as any).editorVerdict || "等待补充日常使用结论").trim() },
        ],
      },
    ];
  }

  return [
    {
      key: "safety",
      label: "Safety & Compliance",
      parentTip: "Verify certifications, braking hardware, and basic chassis stability before judging fit.",
      evidence: [
        { source: "Compliance", text: `Compliance: ${(compliance.length ? compliance : ["Pending source verification"]).join(", ")}` },
        { source: "Braking", text: `Brake setup: ${String((localized as any).brakeType || "Pending")}` },
      ],
    },
    {
      key: "comfort",
      label: "Comfort & Control",
      parentTip: "Look at tire setup, cockpit ergonomics, and whether daily ride comfort signals are actually present.",
      evidence: [
        { source: "Tires", text: `Tire setup: ${String((localized as any).tireType || "Pending")}` },
        { source: "Features", text: `Comfort signals: ${(comfortSignals.length ? comfortSignals : ["Awaiting seat and suspension notes"]).join("; ")}` },
      ],
    },
    {
      key: "portability",
      label: "Portability & Daily Use",
      parentTip: "Weight, carrying effort, and maintenance practicality shape everyday ownership more than spec sheets do.",
      evidence: [
        { source: "Weight", text: `Item weight: ${String((product as any).weight || localized.weight || "Pending")}` },
        { source: "Verdict", text: String((localized as any).editorVerdict || "Awaiting daily-use verdict").trim() },
      ],
    },
  ];
}

function buildEvaluationOnlyStructuredScoringStandards(evaluation: Evaluation, lang: "zh" | "en") {
  const verdict = sanitizeVerdictText(String((lang === "zh" ? evaluation.zh?.verdict : evaluation.en?.verdict) || ""));
  const safetyScore = Number(evaluation.scores?.safety || 0).toFixed(1);
  const comfortScore = Number(evaluation.scores?.comfort || 0).toFixed(1);
  const portabilityScore = Number(evaluation.scores?.portability || 0).toFixed(1);
  const featuresScore = Number(evaluation.scores?.features || 0).toFixed(1);
  const valueScore = Number(evaluation.scores?.valueForMoney || 0).toFixed(1);

  if (lang === "zh") {
    return [
      {
        key: "safety",
        label: "安全与稳定",
        parentTip: "当产品明细缺失时，先依据本次评测的安全、操控与结构结论确认基本风险边界。",
        evidence: [
          { source: "安全得分", text: `安全维度评分：${safetyScore}/10；功能维度评分：${featuresScore}/10。` },
          { source: "评测摘要", text: verdict || "当前评测已生成，等待补充更完整的产品证据链。" },
        ],
      },
      {
        key: "comfort",
        label: "舒适与使用体验",
        parentTip: "舒适度与便携性共同决定日常使用体验，尤其适合通勤和高频外出场景。",
        evidence: [
          { source: "舒适得分", text: `舒适维度评分：${comfortScore}/10；便携维度评分：${portabilityScore}/10。` },
        ],
      },
      {
        key: "value",
        label: "综合价值判断",
        parentTip: "在缺少结构化产品资料时，可先使用当前评测的综合打分作为阶段性决策参考。",
        evidence: [
          { source: "性价比得分", text: `性价比维度评分：${valueScore}/10。` },
        ],
      },
    ];
  }

  return [
    {
      key: "safety",
      label: "Safety & Stability",
      parentTip: "When product-level details are missing, start from the evaluation's safety, control, and structural judgment.",
      evidence: [
        { source: "Safety score", text: `Safety: ${safetyScore}/10; Features: ${featuresScore}/10.` },
        { source: "Review verdict", text: verdict || "This review is published while richer product evidence is still being completed." },
      ],
    },
    {
      key: "comfort",
      label: "Comfort & Daily Use",
      parentTip: "Comfort and portability together shape whether the product works in real daily routines.",
      evidence: [
        { source: "Comfort score", text: `Comfort: ${comfortScore}/10; Portability: ${portabilityScore}/10.` },
      ],
    },
    {
      key: "value",
      label: "Overall Value",
      parentTip: "When structured product records are incomplete, use the current evaluation scores as the interim buying baseline.",
      evidence: [
        { source: "Value score", text: `Value for money: ${valueScore}/10.` },
      ],
    },
  ];
}

function resolveStructuredScoringStandards(product: Product | undefined, lang: "zh" | "en", evaluation?: Evaluation) {
  if (!product) {
    return evaluation ? buildEvaluationOnlyStructuredScoringStandards(evaluation, lang) : [];
  }

  const standards = Array.isArray((product as any).scoringStandards)
    ? (product as any).scoringStandards
    : [];

  const normalized = standards
    .map((standard: any) => {
      const evidence = (Array.isArray(standard?.evidence) ? standard.evidence : [])
        .map((item: any) => ({
          source: cleanVisibleSourceText(item?.source),
          text: cleanVisibleSourceText(item?.text),
        }))
        .filter((item: { source: string; text: string }) => item.text.length >= 10);

      const parentTip = cleanVisibleSourceText(standard?.parentTip);
      return {
        key: String(standard?.key || "").trim(),
        label: cleanVisibleSourceText(standard?.label),
        parentTip,
        evidence,
      };
    })
    .filter((item: { parentTip: string; evidence: Array<{ source: string; text: string }> }) => item.parentTip.length >= 10 || item.evidence.length > 0);

  return normalized.length > 0
    ? normalized
    : buildFallbackStructuredScoringStandards(product, lang);
}

export default function EvaluationsSection({ 
  evaluationsData = [],
  productsData, 
  onSelectProduct,
  childProfile,
  cmsSettings,
  setActiveTab,
  lang = "zh",
  initialReviewType = "all",
  activeReviewType,
  activeEvaluationId,
  onReviewTypeChange,
  onEvaluationOpen,
  onEvaluationBack,
  currentPage = 1,
  onPageChange
}: EvaluationsSectionProps) {
  const reviewsCopy = getPageCopy(lang).reviews;
  const normalizeReviewType = (type?: string) => type && type !== "all" ? type : "single";
  function isMultiEvaluation(ev: Evaluation) {
    return ev.type === "compare" && (ev.productIds?.length || 0) > 1;
  }
  const [selectedReviewType, setSelectedReviewType] = useState<string>(normalizeReviewType(initialReviewType));
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
  
  const [hoverLatest, setHoverLatest] = useState<boolean>(false);
  const [activeCompareTab, setActiveCompareTab] = useState<"stroller" | "balance" | "bike">("stroller");

  const queueEditableComparePrefill = (evaluation: Evaluation) => {
    if (typeof window === "undefined") return;
    const prefill = {
      ...evaluation,
      id: `eval_${Date.now()}`,
      type: "compare" as const,
      status: "draft" as const,
      version: `${String(evaluation.version || "V2026.7")}-EDIT`,
      updatedAt: null,
      zh: {
        title: String(evaluation.zh?.title || ""),
        verdict: String(evaluation.zh?.verdict || ""),
        pros: Array.isArray(evaluation.zh?.pros) ? evaluation.zh.pros : [],
        cons: Array.isArray(evaluation.zh?.cons) ? evaluation.zh.cons : [],
        changelog: "由自动横评转入 CMS 编辑",
      },
      en: {
        title: String(evaluation.en?.title || ""),
        verdict: String(evaluation.en?.verdict || ""),
        pros: Array.isArray(evaluation.en?.pros) ? evaluation.en.pros : [],
        cons: Array.isArray(evaluation.en?.cons) ? evaluation.en.cons : [],
        changelog: "Imported from generated comparison for CMS editing",
      },
    };
    window.localStorage.setItem("cms_evaluation_prefill", JSON.stringify(prefill));
    setActiveTab?.("admin");
  };

  const resolveProductByReference = (rawId?: string) => {
    const normalized = String(rawId || "").trim().toLowerCase();
    if (!normalized) return null;

    return productsData.find((p) => {
      const productId = String(p.id || "").trim().toLowerCase();
      if (!productId) return false;
      if (productId === normalized) return true;
      const tail = productId.split("-").pop();
      return tail === normalized;
    }) || null;
  };

  useEffect(() => {
    if (!selectedEvaluation) {
      clearJsonLd("evaluations-detail");
      return;
    }

    const canonicalUrl = window.location.href;
    const langModel = lang === "zh" ? selectedEvaluation.zh : selectedEvaluation.en;
    const isSingle = selectedEvaluation.type !== "compare" || !selectedEvaluation.productIds || selectedEvaluation.productIds.length <= 1;

    if (isSingle) {
      const reviewedProduct = resolveProductByReference(selectedEvaluation.productId);
      setJsonLd("evaluations-detail", {
        "@context": "https://schema.org",
        "@type": "Review",
        name: langModel.title,
        reviewBody: langModel.verdict,
        inLanguage: lang,
        itemReviewed: reviewedProduct
          ? {
              "@type": "Product",
              name: translateProduct(reviewedProduct, lang).name,
              brand: translateProduct(reviewedProduct, lang).brand,
              url: canonicalUrl,
            }
          : undefined,
        mainEntityOfPage: canonicalUrl,
        url: canonicalUrl,
      });
    } else {
      setJsonLd("evaluations-detail", {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: langModel.title,
        numberOfItems: selectedEvaluation.productIds?.length || 0,
        mainEntityOfPage: canonicalUrl,
        url: canonicalUrl,
      });
    }

    return () => clearJsonLd("evaluations-detail");
  }, [selectedEvaluation, lang, productsData]);

  useEffect(() => {
    const normalizedActiveReviewType = normalizeReviewType(activeReviewType);
    if (normalizedActiveReviewType !== selectedReviewType) {
      setSelectedReviewType(normalizedActiveReviewType);
    }
  }, [activeReviewType, selectedReviewType]);

  const handleReviewTypeSelect = (type: string) => {
    const normalizedType = normalizeReviewType(type);
    setSelectedReviewType(normalizedType);
    setSelectedEvaluation(null);
    onReviewTypeChange?.(normalizedType);
  };

  const reviewTypes = [
    { id: "single", label: reviewsCopy.reviewTypes.single },
    { id: "compare", label: reviewsCopy.reviewTypes.compare },
    { id: "value", label: reviewsCopy.reviewTypes.value },
    { id: "ranking", label: reviewsCopy.reviewTypes.ranking },
    { id: "safety", label: reviewsCopy.reviewTypes.safety }
  ];

  const reviewsList = useMemo(() => {
    const visibleEvaluations = getFrontVisibleEvaluations(evaluationsData, productsData);

    return visibleEvaluations
      .map((ev) => {
      let badge = reviewsCopy.reportBadges.report;
      if (ev.type === "compare") badge = reviewsCopy.reportBadges.comparison;
      if (ev.type === "value") badge = reviewsCopy.reportBadges.valuePick;
      if (ev.type === "ranking") badge = reviewsCopy.reportBadges.topRanking;
      if (ev.type === "safety") badge = reviewsCopy.reportBadges.safetySpecs;
      if (ev.type === "single" || !ev.type) badge = reviewsCopy.reportBadges.expertReport;
      
      return {
        evaluation: ev,
        reviewType: ev.type || "single",
        reviewBadge: badge
      };
    });
  }, [evaluationsData, lang, productsData, reviewsCopy.reportBadges]);

  const reviewModeCopy = useMemo(() => {
    return lang === "zh"
      ? {
          single: "单品评测",
          multi: "多品横评",
          singleHint: "按具体品类查看评测",
          multiHint: "同场对比 2+ 产品",
          multiCountSuffix: "品对比",
        }
      : {
          single: "Single Review",
          multi: "Multi Compare",
          singleHint: "",
          multiHint: "Head-to-head across 2+ products",
          multiCountSuffix: "products compared",
        };
  }, [lang]);

  const getSingleCategoryBadge = (groupId: string) => {
    if (groupId === "single-stroller") return lang === "zh" ? "推车评测" : "Stroller Reviews";
    if (groupId === "single-bike") return lang === "zh" ? "童车评测" : "Toddler Bike Reviews";
    if (groupId === "single-balance") return lang === "zh" ? "平衡车评测" : "Balance Bike Reviews";
    if (groupId === "single-scooter") return lang === "zh" ? "滑板车评测" : "Kids Scooter Reviews";
    return reviewModeCopy.single;
  };

  const getReviewModeLabel = (ev: Evaluation) => {
    return isMultiEvaluation(ev) ? reviewModeCopy.multi : reviewModeCopy.single;
  };

  const getReviewModeMeta = (ev: Evaluation) => {
    if (isMultiEvaluation(ev)) {
      const count = ev.productIds?.length || 2;
      return lang === "zh"
        ? `${count}${reviewModeCopy.multiCountSuffix}`
        : `${count} ${reviewModeCopy.multiCountSuffix}`;
    }
    return "";
  };

  const displayMode = selectedReviewType === "single" ? "single" : "compare";

  const filteredReviews = useMemo(() => {
    const scoped = reviewsList.filter((r: any) => {
      const evLang = lang === "zh" ? r.evaluation.zh : r.evaluation.en;
      const matchesType = r.reviewType === selectedReviewType;
      const matchesSearch = searchQuery.trim() === "" ||
        evLang.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evLang.verdict.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });

    const seenSingleIds = new Set<string>();
    const seenCompareSignatures = new Set<string>();

    return scoped.filter((item: any) => {
      const ev = item.evaluation;
      const ids = (ev.productIds && ev.productIds.length > 0 ? ev.productIds : [ev.productId])
        .filter(Boolean)
        .map((id: any) => String(id));

      if ((ev.type || "single") === "compare") {
        const signature = [...ids].sort().join("|");
        if (!signature) return false;
        if (seenCompareSignatures.has(signature)) return false;
        seenCompareSignatures.add(signature);
        return true;
      }

      const singleId = ids[0] || "";
      if (!singleId) return false;
      if (seenSingleIds.has(singleId)) return false;
      seenSingleIds.add(singleId);
      return true;
    });
  }, [reviewsList, selectedReviewType, searchQuery, lang]);

  useEffect(() => {
    if (!activeEvaluationId) {
      if (selectedEvaluation) {
        setSelectedEvaluation(null);
      }
      return;
    }
    const matchedEvaluation = reviewsList.find((item: any) => item.evaluation.id === activeEvaluationId)?.evaluation;
    if (matchedEvaluation && selectedEvaluation?.id !== matchedEvaluation.id) {
      setSelectedEvaluation(matchedEvaluation);
      setSelectedReviewType(normalizeReviewType(matchedEvaluation.type));
    }
  }, [activeEvaluationId, reviewsList, selectedEvaluation]);

  const getReviewTypeLabel = (type?: string) => {
    const normalizedType = normalizeReviewType(type);
    return (reviewTypes.find((item) => item.id === normalizedType)?.label || normalizedType)
      .replace(/^[^A-Za-z0-9\u4e00-\u9fff]+/, "")
      .trim();
  };

  const openEvaluationDetail = (evaluation: Evaluation) => {
    setSelectedEvaluation(evaluation);
    setSelectedReviewType(normalizeReviewType(evaluation.type));
    onEvaluationOpen?.(evaluation);
  };

  const closeEvaluationDetail = (type?: string) => {
    const normalizedType = normalizeReviewType(type || selectedEvaluation?.type || selectedReviewType);
    setSelectedEvaluation(null);
    onEvaluationBack?.(normalizedType);
  };

  const getCategoryPriority = (categoryValue?: string) => {
    const normalized = String(categoryValue || "").trim().toLowerCase();
    if (normalized.includes("balance")) return 0;
    if (normalized.includes("bicycle") || normalized.includes("bike")) return 1;
    if (normalized.includes("scooter")) return 2;
    return 2;
  };

  const getEvaluationPriority = (ev: Evaluation) => {
    const ids = (ev.productIds && ev.productIds.length > 0 ? ev.productIds : [ev.productId]).filter(Boolean);
    if (ids.length === 0) return 2;
    const priorities = ids
      .map((id) => resolveProductByReference(String(id)))
      .filter(Boolean)
      .map((p) => getCategoryPriority((p as Product).category));
    return priorities.length > 0 ? Math.min(...priorities) : 2;
  };

  const renderList = useMemo(() => {
    const prioritizedReviews = [...reviewsList].sort((a, b) => {
      const pa = getEvaluationPriority(a.evaluation);
      const pb = getEvaluationPriority(b.evaluation);
      if (pa !== pb) {
        return pa - pb;
      }
      const scoreA = a.evaluation.scores?.safety || 0;
      const scoreB = b.evaluation.scores?.safety || 0;
      return scoreB - scoreA;
    });

    return prioritizedReviews.map(r => {
      const isSingle = r.reviewType !== "compare";
      if (isSingle) {
        const product = resolveProductByReference(r.evaluation.productId);
        return {
          type: "single" as const,
          evaluation: r.evaluation,
          product,
          reviewBadge: r.reviewBadge
        };
      } else {
        const products = (r.evaluation.productIds || [])
          .map(id => resolveProductByReference(String(id)))
          .filter(Boolean) as Product[];
        return {
          type: "multi" as const,
          evaluation: r.evaluation,
          products,
          reviewBadge: r.reviewBadge
        };
      }
    });
  }, [reviewsList, productsData]);

  const isStrollerLike = (value: string) => value.includes("stroller") || value.includes("wagon") || value.includes("jogger");
  const isBalanceLike = (value: string) => value.includes("balance");
  const isBikeLike = (value: string) => (value.includes("bike") || value.includes("bicycle") || value.includes("kids_bikes")) && !value.includes("balance");
  const isScooterLike = (value: string) => value.includes("scooter");

  const normalizeCategoryText = (product?: Product) => String(product?.categoryId || product?.category || "").toLowerCase();

  const buildFloorList = (
    matcher: (value: string) => boolean,
    includeCompare = true
  ) => {
    if (!includeCompare) return [];

    const singleFallback = renderList
      .filter((item: any) => item.type === "single" && item.product)
      .filter((item: any) => matcher(normalizeCategoryText(item.product)))
      .slice(0, 12);

    const compareOnly = renderList.filter((item: any) => {
      if (item.type !== "multi" || !item.products || item.products.length < 2) return false;
      // A mixed-category comparison should still be visible on a floor
      // if at least one linked product belongs to that floor category.
      return item.products.some((product: any) => matcher(normalizeCategoryText(product)));
    });

    if (compareOnly.length === 0) {
      return singleFallback;
    }

    if (compareOnly.length <= 1) return compareOnly;

    return [...compareOnly].sort((a: any, b: any) => {
      const scoreA = a?.evaluation?.scores?.safety || 0;
      const scoreB = b?.evaluation?.scores?.safety || 0;
      return scoreB - scoreA;
    });
  };

  const renderEmptyFloorNotice = () => (
    <div className="rounded-[28px] border border-slate-100 bg-slate-50 px-6 py-8 text-center">
      <p className="km-heading-copy km-body-copy text-sm text-slate-500 font-medium">
        {lang === "zh"
          ? "当前分组暂无可展示评测，已在后台生成可编辑草稿后将自动展示。"
          : "No visible reviews in this group yet. Once editable backend drafts are generated, this section will auto-populate."}
      </p>
    </div>
  );

  const dedupeFloorItems = (items: any[]) => {
    const seen = new Set<string>();
    return items.filter((item: any) => {
      const ev = item?.evaluation;
      if (!ev) return false;
      const ids = (ev.productIds && ev.productIds.length > 0 ? ev.productIds : [ev.productId])
        .filter(Boolean)
        .map((id: any) => resolveProductByReference(String(id))?.id || String(id))
        .sort();
      const key = [String(ev.type || "single"), ids.join("|"), String(ev.en?.title || "").trim().toLowerCase()].join("::");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const doubleStrollerFloorReviews = useMemo(() => {
    const list = buildFloorList(isStrollerLike, true);

    // Split into 11 Travel and 4 Jogging strollers naturally using text criteria
    const travelList = list.filter((item: any) => {
      const p = item.product || item.products?.[0];
      if (!p) return false;
      const text = `${p.name} ${item.evaluation.en?.title || ""}`.toLowerCase();
      return text.includes("travel") || text.includes("butterfly") || text.includes("lightweight") || text.includes("compact");
    }).slice(0, 11);

    const joggingList = list.filter((item: any) => {
      const p = item.product || item.products?.[0];
      if (!p) return false;
      const text = `${p.name} ${item.evaluation.en?.title || ""}`.toLowerCase();
      return text.includes("jogger") || text.includes("jogging") || text.includes("gt2") || text.includes("expedition");
    }).slice(0, 4);

    // Dynamic interleaved list to keep variety engaging (11 Travel & 4 Jogging)
    const combined: any[] = [];
    for (let i = 0; i < 11; i++) {
      if (travelList[i]) combined.push(travelList[i]);
      if (joggingList[i]) combined.push(joggingList[i]);
    }

    if (combined.length > 0) {
      return dedupeFloorItems(combined);
    }
    return dedupeFloorItems(list);
  }, [renderList]);

  const balanceBikeFloorReviews = useMemo(() => {
    return buildFloorList(isBalanceLike, true);
  }, [renderList]);

  const kidsBikeFloorReviews = useMemo(() => {
    return buildFloorList((value) => isBikeLike(value) || isScooterLike(value), true);
  }, [renderList]);

  const kidsBikeOnlyReviews = useMemo(() => {
    return buildFloorList(isBikeLike, true);
  }, [renderList]);

  const kidsScooterOnlyReviews = useMemo(() => {
    return buildFloorList(isScooterLike, true);
  }, [renderList]);

  const electricCarOnlyReviews = useMemo(() => {
    return buildFloorList((value) => value.includes("electric") || value.includes("car") || value.includes("vehicle"), true);
  }, [renderList]);

  const cmsSingleReviews = useMemo(() => {
    const dedupeSingles = (list: any[]) => {
      const seenProductIds = new Set<string>();
      const seenDisplayKeys = new Set<string>();
      return list.filter((item: any) => {
        const product = item?.product;
        if (!product) return false;

        const productId = String(product.id || "").trim();
        const brandKey = cleanEnBrandText(String(product.brand || "")).toLowerCase();
        const nameKey = sanitizeMarketplaceNoise(String(product.name || "")).toLowerCase();
        const displayKey = `${brandKey}:${nameKey}`;

        if (productId && seenProductIds.has(productId)) return false;
        if (seenDisplayKeys.has(displayKey)) return false;

        if (productId) seenProductIds.add(productId);
        seenDisplayKeys.add(displayKey);
        return true;
      });
    };

    const singlePool = renderList.filter((item: any) => item.type === "single" && item.product);
    const cmsSingles = singlePool.filter((item: any) => String(item.evaluation?.id || "").startsWith("eval-"));
    if (cmsSingles.length === 0) {
      return dedupeSingles(singlePool);
    }

    const nonCmsSingles = singlePool.filter((item: any) => !String(item.evaluation?.id || "").startsWith("eval-"));
    return dedupeSingles([...cmsSingles, ...nonCmsSingles]);
  }, [renderList]);

  const sortStrollerSingles = (list: any[]) => {
    const priority = (item: any) => {
      const text = `${item?.evaluation?.en?.title || ""} ${item?.evaluation?.zh?.title || ""} ${item?.product?.name || ""}`.toLowerCase();
      if (text.includes("travel stroller")) return 0;
      if (text.includes("jogging stroller") || text.includes("jogger")) return 1;
      if (text.includes("stroller")) return 2;
      return 3;
    };

    return [...list].sort((a, b) => priority(a) - priority(b));
  };

  const resolveSingleReviewGroup = (item: any) => {
    const categoryValue = normalizeCategoryText(item.product);
    const signalText = `${item?.evaluation?.id || ""} ${item?.evaluation?.en?.title || ""} ${item?.evaluation?.zh?.title || ""}`.toLowerCase();

    const isElectric =
      categoryValue.includes("electric") ||
      categoryValue.includes("car") ||
      categoryValue.includes("vehicle") ||
      signalText.includes("electric") ||
      signalText.includes("电动");
    if (isElectric) return "electric";

    const isBalance =
      isBalanceLike(categoryValue) ||
      signalText.includes("balance bike") ||
      signalText.includes("balance_bike") ||
      signalText.includes("平衡车");
    if (isBalance) return "balance";

    const isScooter =
      isScooterLike(categoryValue) ||
      signalText.includes("scooter") ||
      signalText.includes("滑板车");
    if (isScooter) return "scooter";

    const isBike =
      (isBikeLike(categoryValue) ||
        signalText.includes("kids bike") ||
        signalText.includes("bicycle") ||
        signalText.includes("kids_bikes") ||
        signalText.includes("自行车")) &&
      !isBalance;
    if (isBike) return "bike";

    const isStroller =
      isStrollerLike(categoryValue) ||
      signalText.includes("stroller") ||
      signalText.includes("jogger") ||
      signalText.includes("jogging") ||
      signalText.includes("推车") ||
      signalText.includes("婴儿车");
    if (isStroller) return "stroller";

    return "other";
  };

  const singleStrollerReviews = useMemo(() => {
    const strollerOnly = cmsSingleReviews.filter((item: any) => resolveSingleReviewGroup(item) === "stroller");
    return sortStrollerSingles(strollerOnly);
  }, [cmsSingleReviews]);

  const singleBalanceReviews = useMemo(() => {
    return cmsSingleReviews.filter((item: any) => resolveSingleReviewGroup(item) === "balance");
  }, [cmsSingleReviews]);

  const singleBikeReviews = useMemo(() => {
    return cmsSingleReviews.filter((item: any) => resolveSingleReviewGroup(item) === "bike");
  }, [cmsSingleReviews]);

  const singleScooterReviews = useMemo(() => {
    return cmsSingleReviews.filter((item: any) => resolveSingleReviewGroup(item) === "scooter");
  }, [cmsSingleReviews]);

  const getSingleCategoryLabelByEvaluation = (evaluation: Evaluation) => {
    const matchedProduct =
      resolveProductByReference(evaluation.productId) ||
      (evaluation.productIds || [])
        .map((id) => resolveProductByReference(String(id)))
        .find(Boolean) ||
      null;

    const group = resolveSingleReviewGroup({ evaluation, product: matchedProduct });
    if (group === "stroller") return lang === "zh" ? "推车评测" : "Stroller Review";
    if (group === "bike") return lang === "zh" ? "童车评测" : "Toddler Bike Review";
    if (group === "balance") return lang === "zh" ? "平衡车评测" : "Balance Bike Review";
    if (group === "scooter") return lang === "zh" ? "滑板车评测" : "Kids Scooter Review";
    return reviewModeCopy.single;
  };

  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(renderList.length / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const pagedRenderList = renderList.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    if (selectedEvaluation) {
      return;
    }
    const canonicalUrl = window.location.href;
    setCollectionPageJsonLd("evaluations-list", {
      name: reviewsCopy.heroTitle,
      url: canonicalUrl,
      items: renderList.map((block: any) => {
        const dp = block.product ? translateProduct(block.product, lang) : null;
        const customTitle = dp ? `${dp.brand} ${dp.name} ${reviewsCopy.detailTitleSuffix}` : (lang === "zh" ? block.evaluation.zh.title : block.evaluation.en.title);
        return {
          name: customTitle,
          url: canonicalUrl,
        };
      }),
    });
    return () => clearJsonLd("evaluations-list");
  }, [lang, renderList, selectedEvaluation, reviewsCopy.heroTitle, reviewsCopy.detailTitleSuffix]);

  const isSelectedSingle = selectedEvaluation && 
    (selectedEvaluation.type !== "compare" || !selectedEvaluation.productIds || selectedEvaluation.productIds.length <= 1);

  if (selectedEvaluation && isSelectedSingle) {
    const isTargetedBikeDetail = String(selectedEvaluation.id || "").startsWith("generated_single_bike_1_");
    const reviewedProduct =
      resolveProductByReference(selectedEvaluation.productId) ||
      (selectedEvaluation.productIds || [])
        .map((id) => resolveProductByReference(String(id)))
        .find(Boolean) ||
      null;
    const tEv = lang === "zh" ? selectedEvaluation.zh : selectedEvaluation.en;
    const selectedTypeLabel = isTargetedBikeDetail
      ? (lang === "zh" ? "童车评测" : "Kids Bike Reviews")
      : getSingleCategoryLabelByEvaluation(selectedEvaluation);
    const productDisplay = reviewedProduct ? translateProduct(reviewedProduct, lang) : null;
    const imageSet = reviewedProduct ? resolveProductImages(reviewedProduct) : null;
    const detailBrandLabel = lang === "en" ? cleanEnBrandText(productDisplay?.brand || "") : String(productDisplay?.brand || "");
    const detailProductTitleRaw = reviewedProduct ? sanitizeMarketplaceNoise(getProductsPageSeoTitle(reviewedProduct)) : sanitizeMarketplaceNoise(String(productDisplay?.name || ""));
    const detailProductTitle = stripBrandPrefix(detailProductTitleRaw, detailBrandLabel);

    const baseDetailVerdict = reviewedProduct
      ? getLocalizedReviewVerdict(reviewedProduct, selectedEvaluation, lang)
      : sanitizeVerdictText(tEv.verdict || "");
    const displayDetailVerdict = isTargetedBikeDetail && lang === "en"
      ? `toddler bike review: ${baseDetailVerdict}`
      : baseDetailVerdict;

    const displayDetailTitle = reviewedProduct
      ? getLocalizedReviewTitle(reviewedProduct, selectedEvaluation, lang, reviewsCopy.detailTitleSuffix)
      : (lang === "zh" ? selectedEvaluation.zh.title : selectedEvaluation.en.title);
    const detailScoringStandards = resolveStructuredScoringStandards(reviewedProduct || productDisplay || undefined, lang, selectedEvaluation);

    return (
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in text-left">
        <Breadcrumbs
          lang={lang}
          onHomeClick={() => {
            setSelectedEvaluation(null);
            setActiveTab?.("home");
          }}
          items={[
            { label: reviewsCopy.breadcrumb, onClick: () => closeEvaluationDetail("single") },
            { label: selectedTypeLabel, onClick: () => closeEvaluationDetail(selectedEvaluation.type) },
            { label: displayDetailTitle, active: true },
          ]}
        />

        <section className="bg-slate-900 text-white p-8 sm:p-10 rounded-[48px] relative overflow-hidden shadow-2xl">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center">
            <div className="space-y-5">
              <div className="inline-flex py-1 px-3 bg-white/10 rounded-full text-xs font-black tracking-widest uppercase">
                {selectedTypeLabel}
              </div>
              <h1 className="km-page-title">{displayDetailTitle}</h1>
              <p className="km-body-copy text-slate-300 font-medium italic border-l-4 border-orange-500 pl-4">
                "{displayDetailVerdict}"
              </p>
            </div>
            {reviewedProduct && imageSet && (
              <div className="bg-white rounded-[36px] p-6 shadow-2xl shadow-slate-950/20">
                <SmartImage
                  src={imageSet.coverUrl || undefined}
                  alt={reviewedProduct ? sanitizeMarketplaceNoise(getProductImageAlt(reviewedProduct)) : sanitizeMarketplaceNoise(displayDetailTitle)}
                  className="w-full h-56 object-contain"
                  wrapperClassName="w-full h-56"
                  width={448}
                  height={224}
                  priority
                />
                <div className="text-center mt-4">
                  <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">{detailBrandLabel}</p>
                  <h2 className="font-black text-slate-900 text-xl leading-tight mt-1">{detailProductTitle}</h2>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-8 bg-white rounded-[48px] border border-slate-100 p-8 shadow-sm">
          <div className="space-y-6">
            <h2 className="km-section-title text-slate-900">{reviewsCopy.summaryTitle}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-emerald-50 rounded-[28px] p-5 border border-emerald-100">
                <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-3">{reviewsCopy.prosTitle}</h3>
                <ul className="space-y-2 text-sm font-bold text-slate-700">
                  {(tEv.pros || []).slice(0, 4).map((item, index) => <li key={index}>{item}</li>)}
                </ul>
              </div>
              <div className="bg-rose-50 rounded-[28px] p-5 border border-rose-100">
                <h3 className="text-xs font-black text-rose-600 uppercase tracking-widest mb-3">{reviewsCopy.consTitle}</h3>
                <ul className="space-y-2 text-sm font-bold text-slate-700">
                  {(tEv.cons || []).slice(0, 4).map((item, index) => <li key={index}>{item}</li>)}
                </ul>
              </div>
            </div>
            {reviewedProduct && (
              <button
                type="button"
                onClick={() => onSelectProduct(reviewedProduct)}
                className="w-full py-4 bg-slate-900 hover:bg-orange-500 text-white rounded-2xl transition-all shadow-lg flex items-center justify-center active:scale-95"
                aria-label={getReviewCtaLabel(reviewedProduct, selectedEvaluation, lang)}
                title={getReviewCtaLabel(reviewedProduct, selectedEvaluation, lang)}
              >
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>
          <SafetyRadarChart product={reviewedProduct} evaluation={selectedEvaluation} lang={lang} />
        </section>

        {detailScoringStandards.length > 0 && (
          <details className="bg-white border border-slate-100 rounded-[40px] p-8 shadow-sm group" open={true}>
            <summary className="list-none cursor-pointer flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <h2 className="km-section-title text-slate-900">scoringStandards</h2>
              <span className="inline-flex items-center gap-2">
                <span className="text-[10px] font-black px-2 py-1 rounded-full bg-slate-50 text-slate-500 border border-slate-200">
                  {detailScoringStandards.length}
                </span>
                <span className="text-slate-400 text-xs font-black transition-transform group-open:rotate-180">⌄</span>
              </span>
            </summary>

            <div className="space-y-5 pt-6">
              {detailScoringStandards.map((standard) => (
                <article key={standard.key || standard.label} className="rounded-3xl border border-slate-100 bg-slate-50/70 p-6 space-y-4">
                  {standard.label && <h3 className="text-xl sm:text-2xl font-black text-slate-800 leading-tight">{standard.label}</h3>}
                  {standard.parentTip && <p className="km-body-copy text-sm sm:text-base text-slate-600 font-semibold leading-relaxed">{standard.parentTip}</p>}
                  {standard.evidence.length > 0 && (
                    <div className="space-y-3">
                      {standard.evidence.map((evidence, index) => (
                        <div key={`${standard.key || standard.label}-${index}`} className="rounded-2xl bg-white border border-slate-200 px-5 py-4 space-y-1">
                          {evidence.source && <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{evidence.source}</p>}
                          <p className="km-body-copy text-sm sm:text-base text-slate-700 font-semibold leading-relaxed break-words">{evidence.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </details>
        )}
      </div>
    );
  }

  if (selectedEvaluation && !isSelectedSingle) {
    const selectedTypeLabel = getReviewTypeLabel(selectedEvaluation.type);
    const canCreateEditableCompare = String(selectedEvaluation.id || "").startsWith("generated_compare_");
    return (
      <MultiCompareView 
        evaluation={selectedEvaluation}
        productsData={productsData}
        lang={lang}
        reviewTypeLabel={selectedTypeLabel}
        onHome={() => {
          setSelectedEvaluation(null);
          setActiveTab?.("home");
        }}
        onBack={() => closeEvaluationDetail(selectedEvaluation.type)}
        onReviewTypeClick={() => closeEvaluationDetail(selectedEvaluation.type)}
        onSelectProduct={onSelectProduct}
        canCreateEditableCompare={canCreateEditableCompare}
        onCreateEditableCompare={() => queueEditableComparePrefill(selectedEvaluation)}
      />
    );
  }

  return (
    <div id="evaluations_hub" className="space-y-8 animate-fade-in text-left">
      {/* Breadcrumb: HOME > REVIEWS (PRD aligned) */}
      <Breadcrumbs 
        lang={lang} 
        onHomeClick={() => setActiveTab?.("home")}
        items={[{ label: reviewsCopy.breadcrumb, active: true }]} 
      />

      {/* 🛠️ 合并版头部大 Banner & 智能选车工具引导 (Premium Integrated Parent Banner) */}
      <section className="relative rounded-[40px] bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden p-8 md:p-12 text-left max-w-7xl mx-auto shadow-2xl border border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(249,115,22,0.18),transparent)]"></div>
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.25fr_0.75fr] gap-8 md:gap-12 items-center">
          <div className="space-y-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-500/15 border border-orange-500/30 text-orange-400 text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg backdrop-blur-md">
              <ShieldCheck className="w-4 h-4 text-orange-400" />
              {reviewsCopy.badge}
            </div>

            <h1 className="km-page-title km-home-statement-title text-white max-w-5xl drop-shadow-md">
              {reviewsCopy.heroTitle}
            </h1>

            <div className="border-l-2 border-orange-500 pl-4">
              <p className="km-body-copy text-slate-200 text-sm md:text-base max-w-3xl font-semibold drop-shadow-sm leading-relaxed">
                {reviewsCopy.heroDescription}
              </p>
            </div>

            <div className="flex flex-wrap gap-4 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  handleReviewTypeSelect("single");
                  const el = document.getElementById("single-reviews");
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-[11px] font-black tracking-widest uppercase shadow-md transition-all cursor-pointer group backdrop-blur-md ${displayMode === "single" ? "bg-white/20 border border-white/45 text-slate-100" : "bg-white/10 hover:bg-white/20 border border-white/25 text-slate-100 hover:border-white/45"}`}
              >
                {reviewModeCopy.single}
              </button>
              <button
                type="button"
                onClick={() => {
                  handleReviewTypeSelect("compare");
                  const el = document.getElementById("kids-stroller");
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-[11px] font-black tracking-widest uppercase shadow-md transition-all cursor-pointer group backdrop-blur-md ${displayMode === "compare" ? "bg-white/20 border border-white/45 text-slate-100" : "bg-white/10 hover:bg-white/20 border border-white/25 text-slate-100 hover:border-white/45"}`}
              >
                {reviewModeCopy.multi}
              </button>
            </div>
          </div>

          {/* Right Action Block (Interactive Finder callout merged internally) */}
          <div className="bg-white/10 border border-white/25 rounded-[36px] p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-2xl shadow-slate-950/30 backdrop-blur-md relative z-10 md:min-h-[260px]">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-300 text-[10px] font-black uppercase tracking-widest">
                <Zap className="w-3.5 h-3.5 text-orange-300 fill-orange-300 animate-pulse" />
                {lang === "zh" ? "智能匹配向导" : "Smart Finder"}
              </div>
              <h2 className="font-extrabold text-white text-lg md:text-xl tracking-tight leading-snug drop-shadow-sm">
                {reviewsCopy.smartFinderTitle}
              </h2>
              <p className="text-sm text-slate-200 font-semibold leading-relaxed">
                {reviewsCopy.smartFinderDescription}
              </p>
            </div>
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  localStorage.setItem("autoOpenWizard", "true");
                }
                setActiveTab?.("guides");
              }}
              className="w-full inline-flex items-center justify-center gap-3 px-10 py-5 bg-linear-to-r from-orange-500 via-orange-500 to-amber-500 text-white text-xs md:text-sm font-black uppercase tracking-widest rounded-full shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer group"
            >
              <Zap className="w-4 h-4 text-white fill-white animate-pulse" />
              {reviewsCopy.smartFinderCta}
            </button>
          </div>
        </div>
      </section>

      {/* 🛠️ 模块 4：结构化深度评测报告流 (Categorized Review Stream) */}
      <div className="space-y-24 max-w-7xl mx-auto">
        
        
        
        {/* FLOOR 5: KIDS STROLLERS */}
        <section id="kids-stroller" className={`scroll-mt-24 space-y-8 ${displayMode === "single" ? "hidden" : ""}`}>
          <div className="border-b border-slate-100 pb-4">
            <h2 className="km-section-title text-slate-900">
              {reviewsCopy.sections.strollerTitle}
            </h2>
            <p className="km-heading-copy km-body-copy text-sm text-slate-500 font-medium">
              {reviewsCopy.sections.strollerDesc}
            </p>
          </div>

          {(doubleStrollerFloorReviews.slice(0, 15).some((item: any) => Boolean(item?.product || item?.products?.[0]))) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {doubleStrollerFloorReviews.slice(0, 15).map((item: any) => {
              const ev = item.evaluation;
              const product = item.product || item.products?.[0];
              if (!product) return null;
              const dp = translateProduct(product, lang);
              const evLang = {
                title: getLocalizedReviewTitle(product, ev, lang, reviewsCopy.detailTitleSuffix),
                verdict: getLocalizedReviewVerdict(product, ev, lang)
              };
              const imageSet = resolveProductImages(product);

              return (
                <div
                  key={ev.id}
                  onClick={() => openEvaluationDetail(ev)}
                  className="bg-white border border-slate-100 rounded-[36px] p-6 hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row gap-6 cursor-pointer group"
                >
                  <div className="md:w-2/5 h-44 bg-slate-50 rounded-2xl p-4 flex items-center justify-center overflow-hidden shrink-0">
                    <SmartImage
                      src={imageSet.coverUrl || undefined}
                      alt={`${dp.brand} ${dp.name} Reviews`}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                      wrapperClassName="w-full h-full"
                    />
                  </div>
                  <div className="flex flex-col justify-between flex-1 py-1">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] text-orange-500 font-black uppercase tracking-wider block">{dp.brand}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase border ${isMultiEvaluation(ev) ? "text-sky-600 border-sky-200 bg-sky-50" : "text-emerald-600 border-emerald-200 bg-emerald-50"}`}>
                          {getReviewModeLabel(ev)}
                        </span>
                      </div>
                      <h3 className="km-card-title text-slate-900 group-hover:text-orange-500 transition-colors">{stripBrandPrefix(evLang.title, String(dp.brand || "")) || evLang.title}</h3>
                      <p className="km-heading-copy km-body-copy text-[11px] text-slate-400 font-semibold">“{clampSummaryForDisplay(evLang.verdict, 180)}”</p>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                      <span className="text-[10px] text-slate-400 font-black uppercase hover:text-orange-500 transition-colors">{getReviewModeMeta(ev)}</span>
                      {ev.scores?.safety && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-orange-500 text-orange-500" />
                          <span className="text-[11px] font-black text-slate-800">{ev.scores.safety.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          ) : renderEmptyFloorNotice()}
        </section>

        {/* FLOOR 3: KIDS BIKES */}
        <section id="kids-bike" className={`scroll-mt-24 space-y-8 ${displayMode === "single" ? "hidden" : ""}`}>
          <div className="border-b border-slate-100 pb-4">
            <h2 className="km-section-title text-slate-900">
              {reviewsCopy.sections.bikeTitle}
            </h2>
            <p className="km-heading-copy km-body-copy text-sm text-slate-500 font-medium">
              {reviewsCopy.sections.bikeDesc}
            </p>
          </div>

          {(kidsBikeOnlyReviews.slice(0, 6).some((item: any) => Boolean(item?.product || item?.products?.[0]))) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {kidsBikeOnlyReviews.slice(0, 6).map((item: any) => {
              const ev = item.evaluation;
              const product = item.product || item.products?.[0];
              if (!product) return null;
              const dp = translateProduct(product, lang);
              const evLang = {
                title: getLocalizedReviewTitle(product, ev, lang, reviewsCopy.detailTitleSuffix),
                verdict: getLocalizedReviewVerdict(product, ev, lang)
              };
              const imageSet = resolveProductImages(product);

              return (
                <div
                  key={ev.id}
                  onClick={() => openEvaluationDetail(ev)}
                  className="bg-white border border-slate-100 rounded-[36px] p-6 hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row gap-6 cursor-pointer group"
                >
                  <div className="md:w-2/5 h-44 bg-slate-50 rounded-2xl p-4 flex items-center justify-center overflow-hidden shrink-0">
                    <SmartImage
                      src={imageSet.coverUrl || undefined}
                      alt={`${dp.brand} ${dp.name} Reviews`}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                      wrapperClassName="w-full h-full"
                    />
                  </div>
                  <div className="flex flex-col justify-between flex-1 py-1">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] text-orange-500 font-black uppercase tracking-wider block">{dp.brand}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase border ${isMultiEvaluation(ev) ? "text-sky-600 border-sky-200 bg-sky-50" : "text-emerald-600 border-emerald-200 bg-emerald-50"}`}>
                          {getReviewModeLabel(ev)}
                        </span>
                      </div>
                      <h3 className="km-card-title text-slate-900 group-hover:text-orange-500 transition-colors">{stripBrandPrefix(evLang.title, String(dp.brand || "")) || evLang.title}</h3>
                      <p className="km-heading-copy km-body-copy text-[11px] text-slate-400 font-semibold">“{clampSummaryForDisplay(evLang.verdict, 180)}”</p>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                      <span className="text-[10px] text-slate-400 font-black uppercase hover:text-orange-500 transition-colors">{getReviewModeMeta(ev)}</span>
                      {ev.scores?.safety && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-orange-500 text-orange-500" />
                          <span className="text-[11px] font-black text-slate-800">{ev.scores.safety.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          ) : renderEmptyFloorNotice()}
        </section>

        {/* FLOOR 2: BALANCE BIKES */}
        <section id="balance-bike" className={`scroll-mt-24 space-y-8 ${displayMode === "single" ? "hidden" : ""}`}>
          <div className="border-b border-slate-100 pb-4">
            <h2 className="km-section-title text-slate-900">
              {reviewsCopy.sections.balanceTitle}
            </h2>
            <p className="km-heading-copy km-body-copy text-sm text-slate-500 font-medium">
              {reviewsCopy.sections.balanceDesc}
            </p>
          </div>

          {(balanceBikeFloorReviews.slice(0, 2).some((item: any) => Boolean(item?.product || item?.products?.[0]))) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {balanceBikeFloorReviews.slice(0, 2).map((item: any) => {
              const ev = item.evaluation;
              const product = item.product || item.products?.[0];
              if (!product) return null;
              const dp = translateProduct(product, lang);
              const evLang = {
                title: getLocalizedReviewTitle(product, ev, lang, reviewsCopy.detailTitleSuffix),
                verdict: getLocalizedReviewVerdict(product, ev, lang)
              };
              const imageSet = resolveProductImages(product);

              return (
                <div
                  key={ev.id}
                  onClick={() => openEvaluationDetail(ev)}
                  className="bg-white border border-slate-100 rounded-[36px] p-6 hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row gap-6 cursor-pointer group"
                >
                  <div className="md:w-2/5 h-44 bg-slate-50 rounded-2xl p-4 flex items-center justify-center overflow-hidden shrink-0">
                    <SmartImage
                      src={imageSet.coverUrl || undefined}
                      alt={`${dp.brand} ${dp.name} Reviews`}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                      wrapperClassName="w-full h-full"
                    />
                  </div>
                  <div className="flex flex-col justify-between flex-1 py-1">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] text-orange-500 font-black uppercase tracking-wider block">{dp.brand}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase border ${isMultiEvaluation(ev) ? "text-sky-600 border-sky-200 bg-sky-50" : "text-emerald-600 border-emerald-200 bg-emerald-50"}`}>
                          {getReviewModeLabel(ev)}
                        </span>
                      </div>
                      <h3 className="km-card-title text-slate-900 group-hover:text-orange-500 transition-colors">{stripBrandPrefix(evLang.title, String(dp.brand || "")) || evLang.title}</h3>
                      <p className="km-heading-copy km-body-copy text-[11px] text-slate-400 font-semibold">“{clampSummaryForDisplay(evLang.verdict, 180)}”</p>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                      <span className="text-[10px] text-slate-400 font-black uppercase hover:text-orange-500 transition-colors">{getReviewModeMeta(ev)}</span>
                      {ev.scores?.safety && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-orange-500 text-orange-500" />
                          <span className="text-[11px] font-black text-slate-800">{ev.scores.safety.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          ) : renderEmptyFloorNotice()}
        </section>

        {/* FLOOR 4: KIDS SCOOTERS */}
        <section id="kids-scooter" className={`scroll-mt-24 space-y-8 ${displayMode === "single" ? "hidden" : ""}`}>
          <div className="border-b border-slate-100 pb-4">
            <h2 className="km-section-title text-slate-900">
              {reviewsCopy.sections.scooterTitle}
            </h2>
            <p className="km-heading-copy km-body-copy text-sm text-slate-500 font-medium">
              {reviewsCopy.sections.scooterDesc}
            </p>
          </div>

          {(kidsScooterOnlyReviews.slice(0, 4).some((item: any) => Boolean(item?.product || item?.products?.[0]))) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {kidsScooterOnlyReviews.slice(0, 4).map((item: any) => {
              const ev = item.evaluation;
              const product = item.product || item.products?.[0];
              if (!product) return null;
              const dp = translateProduct(product, lang);
              const evLang = {
                title: getLocalizedReviewTitle(product, ev, lang, reviewsCopy.detailTitleSuffix),
                verdict: getLocalizedReviewVerdict(product, ev, lang)
              };
              const imageSet = resolveProductImages(product);

              return (
                <div
                  key={ev.id}
                  onClick={() => openEvaluationDetail(ev)}
                  className="bg-white border border-slate-100 rounded-[36px] p-6 hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row gap-6 cursor-pointer group"
                >
                  <div className="md:w-2/5 h-44 bg-slate-50 rounded-2xl p-4 flex items-center justify-center overflow-hidden shrink-0">
                    <SmartImage
                      src={imageSet.coverUrl || undefined}
                      alt={`${dp.brand} ${dp.name} Reviews`}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                      wrapperClassName="w-full h-full"
                    />
                  </div>
                  <div className="flex flex-col justify-between flex-1 py-1">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] text-orange-500 font-black uppercase tracking-wider block">{dp.brand}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase border ${isMultiEvaluation(ev) ? "text-sky-600 border-sky-200 bg-sky-50" : "text-emerald-600 border-emerald-200 bg-emerald-50"}`}>
                          {getReviewModeLabel(ev)}
                        </span>
                      </div>
                      <h3 className="km-card-title text-slate-900 group-hover:text-orange-500 transition-colors">{stripBrandPrefix(evLang.title, String(dp.brand || "")) || evLang.title}</h3>
                      <p className="km-heading-copy km-body-copy text-[11px] text-slate-400 font-semibold">“{clampSummaryForDisplay(evLang.verdict, 180)}”</p>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                      <span className="text-[10px] text-slate-400 font-black uppercase hover:text-orange-500 transition-colors">{getReviewModeMeta(ev)}</span>
                      {ev.scores?.safety && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-orange-500 text-orange-500" />
                          <span className="text-[11px] font-black text-slate-800">{ev.scores.safety.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          ) : renderEmptyFloorNotice()}
        </section>

        {/* FLOOR 6: KIDS ELECTRIC CAR */}
        <section id="kids-electric-car" className={`scroll-mt-24 space-y-8 ${displayMode === "single" ? "hidden" : ""}`}>
          <div className="border-b border-slate-100 pb-4">
            <h2 className="km-section-title text-slate-900">
              {reviewsCopy.sections.electricTitle}
            </h2>
            <p className="km-heading-copy km-body-copy text-sm text-slate-500 font-medium">
              {reviewsCopy.sections.electricDesc}
            </p>
          </div>

          {electricCarOnlyReviews.length === 0 ? (
            <p className="text-slate-400 text-sm italic">{reviewsCopy.sections.noElectricData}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {electricCarOnlyReviews.slice(0, 4).map((item: any) => {
                const ev = item.evaluation;
                const product = item.product || item.products?.[0];
                if (!product) return null;
                const dp = translateProduct(product, lang);
                const evLang = {
                  title: getLocalizedReviewTitle(product, ev, lang, reviewsCopy.detailTitleSuffix),
                  verdict: getLocalizedReviewVerdict(product, ev, lang)
                };
                const imageSet = resolveProductImages(product);

                return (
                  <div
                    key={ev.id}
                    onClick={() => openEvaluationDetail(ev)}
                    className="bg-white border border-slate-100 rounded-[36px] p-6 hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row gap-6 cursor-pointer group"
                  >
                    <div className="md:w-2/5 h-44 bg-slate-50 rounded-2xl p-4 flex items-center justify-center overflow-hidden shrink-0">
                      <SmartImage
                        src={imageSet.coverUrl || undefined}
                        alt={`${dp.brand} ${dp.name} Reviews`}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                        wrapperClassName="w-full h-full"
                      />
                    </div>
                    <div className="flex flex-col justify-between flex-1 py-1">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] text-orange-500 font-black uppercase tracking-wider block">{dp.brand}</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase border ${isMultiEvaluation(ev) ? "text-sky-600 border-sky-200 bg-sky-50" : "text-emerald-600 border-emerald-200 bg-emerald-50"}`}>
                            {getReviewModeLabel(ev)}
                          </span>
                        </div>
                        <h3 className="km-card-title text-slate-900 group-hover:text-orange-500 transition-colors">{stripBrandPrefix(evLang.title, String(dp.brand || "")) || evLang.title}</h3>
                        <p className="km-heading-copy km-body-copy text-[11px] text-slate-400 font-semibold">“{clampSummaryForDisplay(evLang.verdict, 180)}”</p>
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                        <span className="text-[10px] text-slate-400 font-black uppercase hover:text-orange-500 transition-colors">{getReviewModeMeta(ev)}</span>
                        {ev.scores?.safety && (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-orange-500 text-orange-500" />
                            <span className="text-[11px] font-black text-slate-800">{ev.scores.safety.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section id="single-reviews" className={`scroll-mt-24 space-y-12 ${displayMode === "single" ? "" : "hidden"}`}>

          {cmsSingleReviews.length === 0 ? (
            <p className="text-slate-400 text-sm italic">{lang === "zh" ? "暂无可展示的单品评测。" : "No publishable single reviews yet."}</p>
          ) : (
            <div className="space-y-12">
              {[
                { id: "single-stroller", title: reviewsCopy.sections.strollerTitle, desc: reviewsCopy.sections.strollerDesc, items: singleStrollerReviews },
                {
                  id: "single-bike",
                  title: lang === "zh" ? reviewsCopy.sections.bikeTitle : "Kids Bike Reviews",
                  desc: reviewsCopy.sections.bikeDesc,
                  items: singleBikeReviews,
                },
                {
                  id: "single-balance",
                  title: lang === "zh" ? reviewsCopy.sections.balanceTitle : "Balance Bike Reviews",
                  desc: reviewsCopy.sections.balanceDesc,
                  items: singleBalanceReviews,
                },
                { id: "single-scooter", title: reviewsCopy.sections.scooterTitle, desc: reviewsCopy.sections.scooterDesc, items: singleScooterReviews },
              ]
                .map((group) => (
                <section key={group.id} className="space-y-8">
                  <div className="border-b border-slate-100 pb-4">
                    <h3 className="km-section-title text-slate-900">{group.title}</h3>
                    <p className="km-heading-copy km-body-copy text-sm text-slate-500 font-medium">{group.desc}</p>
                  </div>

                  {group.items.length === 0 ? (
                    <p className="text-slate-400 text-sm italic">
                      {lang === "zh" ? "当前分组暂无单品评测条目。" : "No single-review entries in this category yet."}
                    </p>
                  ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {(group.id === "single-stroller"
                      ? group.items.slice(0, 6)
                      : group.id === "single-bike"
                        ? group.items.slice(0, 8)
                        : group.id === "single-balance"
                          ? group.items.slice(0, 2)
                        : group.items.slice(0, 3)).map((item: any) => {
                      const ev = item.evaluation;
                      const product = item.product;
                      if (!product) return null;
                      const dp = translateProduct(product, lang);
                      const evLang = {
                        title: getLocalizedReviewTitle(product, ev, lang, reviewsCopy.detailTitleSuffix),
                        verdict: getLocalizedReviewVerdict(product, ev, lang)
                      };
                      const imageSet = resolveProductImages(product);

                      return (
                        <div
                          key={`single-${group.id}-${ev.id}`}
                          onClick={() => openEvaluationDetail(ev)}
                          className="bg-white border border-slate-100 rounded-[36px] p-6 hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row gap-6 cursor-pointer group"
                        >
                          <div className="md:w-2/5 h-44 bg-slate-50 rounded-2xl p-4 flex items-center justify-center overflow-hidden shrink-0">
                            <SmartImage
                              src={imageSet.coverUrl || undefined}
                              alt={`${dp.brand} ${dp.name} Review`}
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                              wrapperClassName="w-full h-full"
                            />
                          </div>
                          <div className="flex flex-col justify-between flex-1 py-1">
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[10px] text-orange-500 font-black uppercase tracking-wider block">{dp.brand}</span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase border text-emerald-600 border-emerald-200 bg-emerald-50">
                                  {getSingleCategoryBadge(group.id)}
                                </span>
                              </div>
                              <h4 className="km-card-title text-slate-900 group-hover:text-orange-500 transition-colors">{stripBrandPrefix(evLang.title, String(dp.brand || "")) || evLang.title}</h4>
                              <p className="km-heading-copy km-body-copy text-[11px] text-slate-400 font-semibold">“{clampSummaryForDisplay(evLang.verdict, 180)}”</p>
                            </div>
                            <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                              <span className="text-[10px] text-slate-400 font-black uppercase hover:text-orange-500 transition-colors">{reviewModeCopy.singleHint}</span>
                              {ev.scores?.safety && (
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 fill-orange-500 text-orange-500" />
                                  <span className="text-[11px] font-black text-slate-800">{ev.scores.safety.toFixed(1)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  )}
                </section>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* 🛠️ 模块 5：独立测试方法论与国际标准认证 (Lab Rigor & Badges) */}
      <section className="bg-white border border-slate-100 rounded-[48px] p-8 sm:p-10 max-w-7xl mx-auto shadow-sm space-y-6 text-center">
        <div className="max-w-4xl mx-auto space-y-3">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">{reviewsCopy.standardsSubtitle}</h2>
          <h3 className="km-section-title text-slate-900">{reviewsCopy.standardsTitle}</h3>
          <p className="km-heading-copy km-body-copy text-xs text-slate-500 font-medium">
            {reviewsCopy.standardsDesc}
          </p>
        </div>

        {/* Global Compliance Cert badges map */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap justify-center items-center gap-6 sm:gap-12 opacity-40 grayscale hover:opacity-80 hover:grayscale-0 transition-all duration-500">
          {[
            { label: "CPSC", detail: lang === "zh" ? "美国消费安全" : "US Consumer Protection" },
            { label: "ISO 8098", detail: lang === "zh" ? "制动测试标准" : "Braking Standards" },
            { label: "GB 14746", detail: lang === "zh" ? "中国安全基线" : "China Safety Line" },
            { label: "EN 71", detail: lang === "zh" ? "欧盟玩具规范" : "EU Toys Rigor" },
            { label: "ASTM F963", detail: lang === "zh" ? "结构强度规范" : "Mechanical Strength" }
          ].map((cert, index) => (
            <div key={index} className="flex flex-col items-center gap-1">
              <span className="text-sm font-black text-slate-900 tracking-wider font-display uppercase">{cert.label}</span>
              <span className="text-[8px] font-bold text-slate-400 block tracking-normal leading-none">{cert.detail}</span>
            </div>
          ))}
        </div>
      </section>


    </div>
  );
}
 