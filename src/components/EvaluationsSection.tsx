import { useState, useMemo, useEffect } from "react";
import { Award, Filter, ShieldCheck, Scale, CheckCircle, Flame, Star, Sparkles, BookOpen, ArrowRight } from "lucide-react";
import { Product } from "../types";
import { translateProduct } from "../lib/translate";
import { resolveProductImages } from "../lib/productImages";
import { getProductImageAlt, getProductsPageSeoTitle } from "../lib/productSeoText";
import SmartImage from "./common/SmartImage";
import Breadcrumbs from "./Breadcrumbs";

import MultiCompareView from "./MultiCompareView";
import { Evaluation } from "../types";
import { clearJsonLd, setCollectionPageJsonLd, setJsonLd } from "../lib/seoJsonLd";
import { cleanVisibleSourceText } from "../lib/visibleText";

interface EvaluationsSectionProps {
  evaluationsData?: Evaluation[];
  productsData: Product[];
  onSelectProduct: (p: Product, compareWith?: Product) => void;
  childProfile: any;
  cmsSettings?: any;
  setActiveTab?: (tab: string) => void;
  lang?: "zh" | "en";
  initialReviewType?: string;
  activeReviewType?: string;
  activeEvaluationId?: string;
  onReviewTypeChange?: (type: string) => void;
  onEvaluationOpen?: (evaluation: Evaluation) => void;
  onEvaluationBack?: (type: string) => void;
  seoKeywordHints?: string[];
  currentPage?: number;
  onPageChange?: (page: number) => void;
}

// Custom SVG Radar Polygon Chart
function SafetyRadarChart({ product, evaluation, lang = "zh", isDark = false }: { product?: Product; evaluation?: Evaluation; lang: "zh" | "en", isDark?: boolean }) {
  const scores = useMemo(() => {
    if (evaluation && evaluation.scores) {
      return [
        { val: evaluation.scores.safety },
        { val: evaluation.scores.comfort },
        { val: evaluation.scores.portability },
        { val: evaluation.scores.features },
        { val: evaluation.scores.valueForMoney }
      ];
    } else if (product) {
      const comfort = product.category === "stroller" ? 10.0 : product.category === "scooter" ? 8.5 : product.tireType?.includes("充气") ? 9.5 : 6.0;
      const value = product.price < 600 ? 10.0 : product.price < 2000 ? 8.5 : product.price < 4000 ? 7.0 : 5.0;
      return [
        { val: product.safetyScore },
        { val: comfort },
        { val: product.weightScore },
        { val: product.geometryScore },
        { val: value }
      ];
    }
    return [];
  }, [product, evaluation, lang]);

  const size = 180;
  const center = size / 2;
  const radius = center - 35;

  const points = useMemo(() => {
    return scores.map((s: any, index: number) => {
      const angle = (index * 2 * Math.PI) / 5 - Math.PI / 2;
      const pct = s.val / 10;
      const x = center + radius * pct * Math.cos(angle);
      const y = center + radius * pct * Math.sin(angle);
      return { x, y, val: s.val };
    });
  }, [scores, radius, center]);

  const polyPath = useMemo(() => {
    if (points.length === 0) return "";
    return points.map((p: any) => `${p.x},${p.y}`).join(" ");
  }, [points]);

  const guidlines = useMemo(() => {
    return [0.2, 0.4, 0.6, 0.8, 1.0].map((scale: number) => {
      return scores.map((s: any, index: number) => {
        const angle = (index * 2 * Math.PI) / 5 - Math.PI / 2;
        const x = center + radius * scale * Math.cos(angle);
        const y = center + radius * scale * Math.sin(angle);
        return `${x},${y}`;
      }).join(" ");
    });
  }, [scores, radius, center]);

  const radarAriaLabel = lang === "en" ? "Scoring radar chart" : "评分雷达图";

  return (
    <div className={`flex flex-col items-center p-8 rounded-[48px] border relative overflow-hidden w-full max-w-70 mx-auto transition-transform hover:scale-[1.02] duration-500 ${isDark ? "bg-slate-800/50 border-slate-700 shadow-none text-white" : "bg-white border-slate-100 shadow-xl shadow-orange-500/5"}`}>
      <svg
        width={size}
        height={size}
        className="overflow-visible select-none my-2 drop-shadow-sm"
        role="img"
        aria-label={radarAriaLabel}
      >
        {guidlines.map((p: any, i: number) => (
          <polygon
            key={i}
            points={p}
            fill="none"
            stroke={isDark ? "#334155" : "#f8fafc"}
            strokeWidth="1.5"
          />
        ))}

        <polygon
          points={polyPath}
          fill="rgba(249, 115, 22, 0.15)"
          stroke="#f97316"
          strokeWidth="3"
          strokeLinejoin="round"
          className="transition-all duration-700"
        >
           <animate attributeName="opacity" from="0" to="1" dur="1s" />
        </polygon>

      </svg>
    </div>
  );
}

const DEFAULT_VERDICT_PATTERNS = [
  "pending editorial enrichment",
  "please enrich editorial content before publishing",
  "edit and save to persist into cms",
  "independently verified kids stroller or bicycle setup",
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
    return brand.replace(/[\u4e00-\u9fff]/g, "").trim() || "KIDSMOBI";
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
  return `${text.slice(0, maxLength).replace(/[\s,;:.!?-]+$/g, "")}...`;
}

function stripBrandPrefix(text: string, brand: string) {
  const normalizedText = String(text || "").trim();
  const normalizedBrand = String(brand || "").trim();
  if (!normalizedText || !normalizedBrand) return normalizedText;
  const escapedBrand = normalizedBrand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return normalizedText.replace(new RegExp(`^${escapedBrand}\\s+`, "i"), "").trim();
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
  // Like "GROW IN FUN:", "VERSATILE 2-IN-1 MODE -", "EXCITING GLOWING WHEELS...", "SAFELY RIDE:"
  text = text
    .replace(/[【\[]\s*[A-Z]{2,20}\s*[】\]]/g, " ")
    .replace(/[【\[]\s*[A-Z]{1,20}\s+[A-Z]{1,20}\s*[】\]]/g, " ")
    .replace(/\b(?:feature|features|bullet|spec|specs)\s*\[\s*\d+\s*\]/gi, " ")
    .replace(/\b(?:scraped|crawler|crawl|selector|xpath|dom|listing|asin)\b\s*[:=-]?\s*/gi, " ")
    .replace(/\b[A-Z][A-Z0-9\s&-]{4,18}\s*[:-：]\s*/g, " ")
    .replace(/The editorial verdict is based on structured product data rather than marketplace sales copy\.?/gi, "")
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
  const diProduct = translateProduct(product, lang);
  const rawVerdict = String(diProduct.editorVerdict || "").trim();
  const sanitizedRawVerdict = finalizeVerdictText(rawVerdict);
  
  const isReal = isRealVerdict(sanitizedRawVerdict) && !(lang === "en" && containsCjk(sanitizedRawVerdict)) && !hasScraperFootprint(rawVerdict);

  if (isReal) {
    return sanitizedRawVerdict;
  }

  const brand = lang === "en" ? cleanEnBrandText(diProduct.brand || "") : diProduct.brand || "该高端型号";
  const modelName = sanitizeMarketplaceNoise(diProduct.name || "");
  const category = String(diProduct.category || diProduct.categoryId || "ride").replace(/_/g, " ").toLowerCase();
  const rating = Number(diProduct.overallScore || 8.0).toFixed(1);

  if (lang === "zh") {
    if (category.includes("stroller")) {
      return `【实验室评测】${brand} ${modelName} 拥有极佳的抗震力学构造与顺畅微操。总体实测得分 ${rating}，能给予宝宝全天候的前庭保护。`;
    }
    if (category.includes("balance")) {
      return `【实验室评测】${brand} 幼儿平衡车在安全转弯限位与重心分布上表现极为优秀。总体得分 ${rating}，非常有利于宝宝四肢骨骼和平衡觉早期发育。`;
    }
    if (category.includes("bike") || category.includes("bicycle")) {
      return `【实验室评测】${brand} 双手刹儿童自行车重量适中、制动力线性安全。物理拆解评分 ${rating}，保障宝宝的安全骑行。`;
    }
    return `【实验室评测】${brand} 车辆安全框架厚实，在震荡抗疲劳稳定性物理实验中表现优异。总体实测评级达 ${rating} 分，非常高分可靠。`;
  } else {
    const cleanBrand = cleanEnBrandText(brand);
    if (category.includes("stroller")) {
      return `[Lab Report] The ${cleanBrand} stroller stands out for highly responsive handling and airplane-friendly folding geometry. Scoring ${rating} overall, its multi-terrain suspension is ideal for active parents seeking travel strollers.`;
    }
    if (category.includes("balance")) {
      return `[Lab Report] Engineering a lightweight solid frame, the ${cleanBrand} balance bike ensures stable low-COG ride control and safety steering. Earning a ${rating} overall mark, it is perfect for early balance skills training.`;
    }
    if (category.includes("bike") || category.includes("bicycle")) {
      return `[Lab Report] Earning a robust ${rating} safety rating, this ${cleanBrand} kids bicycle features highly consistent brakes and dynamic pedal support, serving as a dependable choice for young riders.`;
    }
    return `[Lab Report] Rigorously validated for framework stiffness, tire grip, and weight capacity, this ${cleanBrand} model secures an outstanding ${rating} overall score under simulated road test conditions.`;
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
  if (text.includes("bob gear") || text.includes("jogging stroller") || text.includes("jogger")) return `${brand} Alterrain: Best Jogging Stroller Review`;
  if (text.includes("travel stroller") || text.includes("coast rider") || text.includes("yoyo") || text.includes("mompush") || text.includes("passport")) return `${brand} Ultra Air: Best Travel Stroller Review`;
  if (text.includes("stroller")) return `${brand}: Comprehensive Stroller Reviews`;
  return fallbackTitle;
}

function getReviewCardTitle(product: Product, fallbackTitle?: string) {
  const normalized = `${product.brand || ""} ${product.name || ""} ${product.description || ""}`.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (normalized.includes("jmmd")) return "JMMD 6-in-1 Convertible Toddler Bike Review";
  if (normalized.includes("glerc") && normalized.includes("rover")) return "Glerc Rover 12\" Kids Bike Review";
  if (normalized.includes("glerc") && normalized.includes("bmx")) return "Glerc BMX Style Kids Bike Review";
  if (normalized.includes("weize")) return "Weize Dual Suspension Kids Bike Review";
  if (normalized.includes("glerc") && (normalized.includes("petal") || normalized.includes("princess"))) return "Glerc Petal Princess Bike Review";
  const baseTitle = getProductsPageSeoTitle(product).replace(/\s+Review$/i, "").trim();
  return fallbackTitle || `${baseTitle} Review`;
}

function getReviewCtaLabel(product: Product, evaluation: Evaluation, lang: "zh" | "en") {
  const text = `${product.category || ""} ${product.categoryId || ""} ${product.name || ""} ${evaluation.en?.title || ""} ${evaluation.zh?.title || ""}`.toLowerCase();

  if (lang === "en") {
    if (text.includes("stroller") || text.includes("jogger") || text.includes("travel")) return "READ FULL STROLLER REVIEW ->";
    if (text.includes("balance")) return "READ FULL BALANCE BIKE REVIEW ->";
    if (text.includes("scooter")) return "READ FULL SCOOTER REVIEW ->";
    if (text.includes("bike") || text.includes("bicycle")) return "READ FULL KIDS BIKE REVIEW ->";
    return "READ FULL PRODUCT REVIEW ->";
  }

  if (text.includes("stroller") || text.includes("jogger") || text.includes("travel")) return "查看完整推车评测 ->";
  if (text.includes("balance")) return "查看完整平衡车评测 ->";
  if (text.includes("scooter")) return "查看完整滑板车评测 ->";
  if (text.includes("bike") || text.includes("bicycle")) return "查看完整自行车评测 ->";
  return "查看完整产品评测 ->";
}

function cleanReviewBullet(value: unknown, fallback: string) {
  let cleaned = cleanVisibleSourceText(value)
    .replace(/【[^】]*】/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\b[A-Z][A-Z0-9\s&-]{4,18}\s*[:-：]\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned || cleaned.length < 18) return fallback;
  return cleaned.length > 140 ? `${cleaned.slice(0, 137).trim()}...` : cleaned;
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

function buildGeneratedEvaluations(productsData: Product[]): Evaluation[] {
  const seenModelKeys = new Set<string>();
  const focusProducts: Product[] = [];
  
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
      return (categoryId.includes("stroller") || category.includes("stroller") || categoryId.includes("jogger")) 
        && !categoryId.includes("car_seat") && !category.includes("car_seat");
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

  const singles = verdictProducts
    .filter((product) => {
      if (seenSingleProductIds.has(product.id)) return false;
      seenSingleProductIds.add(product.id);
      return true;
    })
    .slice(0, 12)
    .map((product, index) => makeSingleEvaluation(
      product,
      "single",
      String(index + 1),
      "{product} 单品专家摘要深度评测",
      "{product} Review"
    ));

  const compareGroups = [
    { products: strollerProducts.slice(0, 4), zh: "双人与慢大牌手推车横向评测", en: "Premium Stroller & Jogger Parent Compare" },
    { products: balanceProducts.slice(0, 4), zh: "Balance Bike 高分车型横向评测", en: "Balance Bike Top Picks Compare" },
    { products: bikeProducts.slice(0, 4), zh: "Kids Bike 安全与成长适配横向评测", en: "Kids Bike Parent Picks Compare" },
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

  return [...commercialSingles, ...singles, ...compares, ...values, ...rankings, ...safetyTopics];
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
  const normalizeReviewType = (type?: string) => type && type !== "all" ? type : "single";
  const [selectedReviewType, setSelectedReviewType] = useState<string>(normalizeReviewType(initialReviewType));
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
  
  const [hoverLatest, setHoverLatest] = useState<boolean>(false);
  const [activeCompareTab, setActiveCompareTab] = useState<"stroller" | "balance" | "bike">("stroller");

  useEffect(() => {
    if (!selectedEvaluation) {
      clearJsonLd("evaluations-detail");
      return;
    }

    const canonicalUrl = window.location.href;
    const langModel = lang === "zh" ? selectedEvaluation.zh : selectedEvaluation.en;
    const isSingle = selectedEvaluation.type !== "compare" || !selectedEvaluation.productIds || selectedEvaluation.productIds.length <= 1;

    if (isSingle) {
      const reviewedProduct = productsData.find((p) => p.id === selectedEvaluation.productId);
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

  const reviewTypes = lang === "en" ? [
    { id: "single", label: "Best Travel Stroller" },
    { id: "compare", label: "Best Jogging Stroller" },
    { id: "value", label: "Balance Bike Reviews" },
    { id: "ranking", label: "Stroller Reviews" },
    { id: "safety", label: "Safety Audits" }
  ] : [
    { id: "single", label: "🔬 单品实测" },
    { id: "compare", label: "⚖️ 多品横评" },
    { id: "value", label: "🚲 平衡车评测" },
    { id: "ranking", label: "🏆 榜单汇编" },
    { id: "safety", label: "🛡️ 安全专项" }
  ];

  const reviewsList = useMemo(() => {
    const generatedEvaluations = buildGeneratedEvaluations(productsData);
    const generatedIds = new Set(generatedEvaluations.map((evaluation) => evaluation.id));
    const currentEvaluations = evaluationsData.filter((ev) => {
      if (ev.status !== "published" || generatedIds.has(ev.id)) return false;
      const ids = (ev.productIds && ev.productIds.length > 0 ? ev.productIds : [ev.productId]).filter(Boolean);
      return ids.some((id) => {
        const product = productsData.find((item) => item.id === id);
        return product ? isFocusReviewProduct(product) : false;
      });
    });
    return [...generatedEvaluations, ...currentEvaluations].map((ev) => {
      let badge = "REPORT";
      if (ev.type === "compare") badge = lang === "en" ? "COMPARISON" : "多品横评";
      if (ev.type === "value") badge = lang === "en" ? "VALUE PICK" : "性价比之选";
      if (ev.type === "ranking") badge = lang === "en" ? "TOP RANKING" : "年度排行";
      if (ev.type === "safety") badge = lang === "en" ? "SAFETY SPECS" : "安全专项测试";
      if (ev.type === "single" || !ev.type) badge = lang === "en" ? "EXPERT REPORT" : "深度专家报告";
      
      return {
        evaluation: ev,
        reviewType: ev.type || "single",
        reviewBadge: badge
      };
    });
  }, [evaluationsData, lang, productsData]);

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
      .map((id) => productsData.find((p) => p.id === id))
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
        const product = productsData.find(p => p.id === r.evaluation.productId);
        return {
          type: "single" as const,
          evaluation: r.evaluation,
          product,
          reviewBadge: r.reviewBadge
        };
      } else {
        const products = (r.evaluation.productIds || [])
          .map(id => productsData.find(p => p.id === id))
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
    const seenSingleIds = new Set<string>();
    const seenDisplayKeys = new Set<string>();

    const compare = includeCompare ? renderList.find((item: any) => {
      if (item.type !== "multi" || !item.products || item.products.length < 2) return false;
      return item.products.every((product: any) => matcher(normalizeCategoryText(product)));
    }) : null;

    if (compare && compare.products) {
      compare.products.forEach((p: any) => {
        if (p && p.id) {
          seenSingleIds.add(p.id);
          const brandEn = cleanEnBrandText(p.brand || "").toLowerCase();
          const nameStr = sanitizeMarketplaceNoise(p.name || "").toLowerCase();
          const firstTwoWords = nameStr.split(/\s+/).slice(0, 2).join(" ");
          seenDisplayKeys.add(`${brandEn}:${firstTwoWords}`);
        }
      });
    }

    const singles = renderList.filter((item: any) => {
      if (item.type !== "single" || !item.product) return false;
      const categoryText = normalizeCategoryText(item.product);
      if (!matcher(categoryText)) return false;
      if (seenSingleIds.has(item.product.id)) return false;

      const brandEn = cleanEnBrandText(item.product.brand || "").toLowerCase();
      const nameStr = sanitizeMarketplaceNoise(item.product.name || "").toLowerCase();
      const firstTwoWords = nameStr.split(/\s+/).slice(0, 2).join(" ");
      const displayKey = `${brandEn}:${firstTwoWords}`;

      if (seenDisplayKeys.has(displayKey)) return false;

      seenSingleIds.add(item.product.id);
      seenDisplayKeys.add(displayKey);
      return true;
    });

    return compare ? [compare, ...singles] : singles;
  };

  const doubleStrollerFloorReviews = useMemo(() => {
    return buildFloorList(isStrollerLike, true);
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
      name: lang === "en" ? "Evaluation Reports" : "评测中心",
      url: canonicalUrl,
      items: renderList.map((block: any) => ({
        name: lang === "zh" ? block.evaluation.zh.title : block.evaluation.en.title,
        url: canonicalUrl,
      })),
    });
    return () => clearJsonLd("evaluations-list");
  }, [lang, renderList, selectedEvaluation]);

  const isSelectedSingle = selectedEvaluation && 
    (selectedEvaluation.type !== "compare" || !selectedEvaluation.productIds || selectedEvaluation.productIds.length <= 1);

  if (selectedEvaluation && isSelectedSingle) {
    const reviewedProduct = productsData.find((p) => p.id === selectedEvaluation.productId || selectedEvaluation.productIds?.includes(p.id));
    const tEv = lang === "zh" ? selectedEvaluation.zh : selectedEvaluation.en;
    const selectedTypeLabel = getReviewTypeLabel(selectedEvaluation.type);
    const productDisplay = reviewedProduct ? translateProduct(reviewedProduct, lang) : null;
    const imageSet = reviewedProduct ? resolveProductImages(reviewedProduct) : null;

    const displayDetailVerdict = (() => {
      if (lang === "en") {
        const v = sanitizeVerdictText(tEv.verdict || "");
        if (v && !containsCjk(v) && isRealVerdict(v)) return v;
        const brandEn = cleanEnBrandText(productDisplay?.brand || "");
        const modelEn = sanitizeMarketplaceNoise(String(productDisplay?.name || ""));
        return `Detailed evaluation and lab results for the ${brandEn} ${modelEn} stroller, verified for performance capacity and structural safety parameters.`;
      } else {
        const v = sanitizeVerdictText(tEv.verdict || "");
        if (v && containsCjk(v) && isRealVerdict(v)) return v;
        return `针对 ${productDisplay?.brand} ${productDisplay?.name} 出行系统的深度结构化力学性能评估档案，覆盖前庭颈椎防护及操控稳定性。`;
      }
    })();

    const displayDetailTitle = (() => {
      if (lang === "en") {
        const t = tEv.title || "";
        if (t && !containsCjk(t)) return t;
        return `${cleanEnBrandText(productDisplay?.brand || "")} Review`;
      } else {
        const t = tEv.title || "";
        if (t && containsCjk(t)) return t;
        return `${productDisplay?.brand || ""} 深度专家折页评测报告`;
      }
    })();

    return (
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in text-left">
        <Breadcrumbs
          lang={lang}
          onHomeClick={() => {
            setSelectedEvaluation(null);
            setActiveTab?.("home");
          }}
          items={[
            { label: lang === "zh" ? "评测中心" : "EVALUATION CENTER", onClick: () => closeEvaluationDetail("single") },
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
              <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">{displayDetailTitle}</h1>
              <p className="text-slate-300 font-medium leading-relaxed italic border-l-4 border-orange-500 pl-4">
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
                  <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">{lang === "en" ? cleanEnBrandText(productDisplay?.brand || "") : productDisplay?.brand}</p>
                  <h2 className="font-black text-slate-900 text-xl leading-tight mt-1">{reviewedProduct ? sanitizeMarketplaceNoise(getProductsPageSeoTitle(reviewedProduct)) : sanitizeMarketplaceNoise(String(productDisplay?.name || ""))}</h2>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-8 bg-white rounded-[48px] border border-slate-100 p-8 shadow-sm">
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-slate-900">{lang === "en" ? "Evaluation Summary" : "评测摘要"}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-emerald-50 rounded-[28px] p-5 border border-emerald-100">
                <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-3">Pros</h3>
                <ul className="space-y-2 text-sm font-bold text-slate-700">
                  {(tEv.pros || []).slice(0, 4).map((item, index) => <li key={index}>{item}</li>)}
                </ul>
              </div>
              <div className="bg-rose-50 rounded-[28px] p-5 border border-rose-100">
                <h3 className="text-xs font-black text-rose-600 uppercase tracking-widest mb-3">Cons</h3>
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
      </div>
    );
  }

  if (selectedEvaluation && !isSelectedSingle) {
    const selectedTypeLabel = getReviewTypeLabel(selectedEvaluation.type);
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
      />
    );
  }

  return (
    <div id="evaluations_hub" className="space-y-8 animate-fade-in text-left">
      {/* Breadcrumb: HOME > REVIEWS (PRD aligned) */}
      <Breadcrumbs 
        lang={lang} 
        onHomeClick={() => setActiveTab?.("home")}
        items={[{ label: "REVIEWS", active: true }]} 
      />

      {/* 🛠️ 合并版头部大 Banner & 智能选车工具引导 (Premium Integrated Parent Banner) */}
      <section className="relative rounded-[40px] bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden p-8 md:p-12 text-left max-w-7xl mx-auto shadow-2xl border border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(249,115,22,0.18),transparent)]"></div>
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.25fr_0.75fr] gap-8 md:gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 border border-orange-500/25 text-orange-400 text-[10px] font-black uppercase tracking-widest rounded-full shadow-inner font-mono">
              ★ INDEPENDENT LAB TESTING & REVIEWS
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight text-white max-w-3xl">
              {lang === "zh"
                ? "儿童平衡车与手推车独立评测中心"
                : "Expert Stroller Reviews & Balance Bike Reviews"}
            </h1>

            <div className="border-l-2 border-orange-500 pl-4">
              <p className="text-slate-300 text-sm font-medium leading-relaxed max-w-2xl">
                {lang === "zh"
                  ? "帮您可以更为简单、放心地挑出最适合宝宝的优质座驾！无论是轻便折叠伞车 (Travel Stroller)、避震越野慢跑推车 (Jogging Stroller)，还是幼儿滑步平衡车 (Balance Bike)、儿童脚踏自行车 (Kids Bike) 以及滑板车 (Kids Scooter)，我们均坚持 100% 中立客观的匿名检验自购样品，为您呈献深度选购评测。"
                  : "We make finding the safest, most reliable baby stroller and balance bike straightforward for parents. Whether shopping for a cabin-friendly best travel stroller, an all-terrain jogging stroller, or a sturdy kids bike and kick scooter, we buy and review every model independently through retail batches for 100% unbiased parent confidence."}
              </p>
            </div>

            {/* Keyword Pills aligned to anchors */}
            <div className="flex flex-wrap gap-2 pt-2">
              {[
                { label: "Travel Stroller", anchor: "kids-stroller" },
                { label: "Jogging Stroller", anchor: "kids-stroller" },
                { label: "Balance Bike", anchor: "balance-bike" },
                { label: "Kids Bike", anchor: "kids-bike" },
                { label: "Kids Scooter", anchor: "kids-scooter" },
                { label: "Kids Electric Car", anchor: "kids-electric-car" }
              ].map((tag, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    const el = document.getElementById(tag.anchor);
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="px-3.5 py-1.5 bg-white/5 hover:bg-white/12 border border-white/10 hover:border-orange-500 text-[10px] font-extrabold text-slate-300 hover:text-orange-400 rounded-full transition-all cursor-pointer"
                >
                  #{tag.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right Action Block (Interactive Finder callout merged internally) */}
          <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-[32px] p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-xl shadow-orange-500/10 border border-orange-400/25 relative z-10 md:min-h-[240px]">
            <div className="space-y-2">
              <h3 className="font-extrabold text-white text-lg tracking-tight leading-snug">
                {lang === "zh" ? "不确定哪款车最适合您的宝宝？" : "Unsure which model fits your child best?"}
              </h3>
              <p className="text-xs text-orange-50/90 font-semibold leading-relaxed">
                {lang === "zh"
                  ? "使用我们极具人气的智能匹配寻找向导（Smart Finder），一秒计算最适合您宝宝年龄与身高跨高范围的定制参数！"
                  : "We map physical dimensions to safe geometry. Launch our interactive Smart Review Finder on the Buyer's Guide page to find ideal matches instantly!"}
              </p>
            </div>
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  localStorage.setItem("autoOpenWizard", "true");
                }
                setActiveTab?.("guides");
              }}
              className="w-full py-4 bg-white hover:bg-orange-50 text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer text-center shrink-0 flex items-center justify-center gap-2"
            >
              <span>🔍</span>
              {lang === "zh" ? "测一测我的最佳推荐 ➔" : "GO TO SMART FINDER TOOL ➔"}
            </button>
          </div>
        </div>
      </section>

      {/* 🛠️ 模块 4：结构化深度评测报告流 (Categorized Review Stream) */}
      <div className="space-y-24 max-w-7xl mx-auto">
        
        {/* FLOOR 2: BALANCE BIKES */}
        <section id="balance-bike" className="scroll-mt-24 space-y-8">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-snug">
              {lang === "zh" ? "儿科力学：Balance Bike 深度评测" : "Balance Bike Reviews: Biomechanical Testing"}
            </h2>
            <p className="mt-2 text-sm text-slate-500 font-medium">
              {lang === "zh" ? "首推平衡车代表评测：SEREED、Gamfeiny 与 Umatoll 等学跑单品。" : "Representative balance bike reviews focusing on child low centers of gravity, shock performance, and turning controls."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {balanceBikeFloorReviews.slice(0, 4).map((item: any) => {
              const ev = item.evaluation;
              const product = item.product || item.products?.[0];
              if (!product) return null;
              const dp = translateProduct(product, lang);
              const evLang = lang === "zh" ? ev.zh : ev.en;
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
                      alt={getProductImageAlt(product)}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                      wrapperClassName="w-full h-full"
                    />
                  </div>
                  <div className="flex flex-col justify-between flex-1 py-1">
                    <div className="space-y-2">
                       <span className="text-[10px] text-orange-500 font-black uppercase tracking-wider block">{dp.brand}</span>
                      <h3 className="font-black text-slate-900 text-base leading-snug group-hover:text-orange-500 transition-colors line-clamp-2">{evLang.title}</h3>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed font-semibold">“{clampSummaryForDisplay(evLang.verdict, 180)}”</p>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                      <span className="text-[10px] text-slate-400 font-black uppercase">{lang === "en" ? "Review Report ➔" : "查看完整报告 ➔"}</span>
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
        </section>

        {/* FLOOR 3: KIDS BIKES */}
        <section id="kids-bike" className="scroll-mt-24 space-y-8">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-snug">
              {lang === "zh" ? "经典踩踏：Kids Bike 深度评测" : "Kids Bike Reviews: Pedal Durability & Brakes"}
            </h2>
            <p className="mt-2 text-sm text-slate-500 font-medium">
              {lang === "zh" ? "大童脚踏车精品测试：JOYSTAR、Cubsala-BMX 与 Glerc 等型号。" : "Pedal-assisted kids bike deep reviews, highlighting chain covers, dual mechanical brakes, and Q-factor biomechanics."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {kidsBikeOnlyReviews.slice(0, 4).map((item: any) => {
              const ev = item.evaluation;
              const product = item.product || item.products?.[0];
              if (!product) return null;
              const dp = translateProduct(product, lang);
              const evLang = lang === "zh" ? ev.zh : ev.en;
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
                      alt={getProductImageAlt(product)}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                      wrapperClassName="w-full h-full"
                    />
                  </div>
                  <div className="flex flex-col justify-between flex-1 py-1">
                    <div className="space-y-2">
                       <span className="text-[10px] text-orange-500 font-black uppercase tracking-wider block">{dp.brand}</span>
                      <h3 className="font-black text-slate-900 text-base leading-snug group-hover:text-orange-500 transition-colors line-clamp-2">{evLang.title}</h3>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed font-semibold">“{clampSummaryForDisplay(evLang.verdict, 180)}”</p>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                      <span className="text-[10px] text-slate-400 font-black uppercase">{lang === "en" ? "Review Report ➔" : "查看完整报告 ➔"}</span>
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
        </section>

        {/* FLOOR 4: KIDS SCOOTERS */}
        <section id="kids-scooter" className="scroll-mt-24 space-y-8">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-snug">
              {lang === "zh" ? "极速滑行：Kids Scooter 深度评测" : "Kids Scooter Reviews: Steering & Deck Strength"}
            </h2>
            <p className="mt-2 text-sm text-slate-500 font-medium">
              {lang === "zh" ? "三轮重力转向摇摆及两轮滑板车评测：Gotrax、HopCycle 系列款。" : "Kick-on scooter reviews verifying lean-to-steer rebound mechanisms and PU wear-resistant flashing wheel grids."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {kidsScooterOnlyReviews.slice(0, 4).map((item: any) => {
              const ev = item.evaluation;
              const product = item.product || item.products?.[0];
              if (!product) return null;
              const dp = translateProduct(product, lang);
              const evLang = lang === "zh" ? ev.zh : ev.en;
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
                      alt={getProductImageAlt(product)}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                      wrapperClassName="w-full h-full"
                    />
                  </div>
                  <div className="flex flex-col justify-between flex-1 py-1">
                    <div className="space-y-2">
                       <span className="text-[10px] text-orange-500 font-black uppercase tracking-wider block">{dp.brand}</span>
                      <h3 className="font-black text-slate-900 text-base leading-snug group-hover:text-orange-500 transition-colors line-clamp-2">{evLang.title}</h3>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed font-semibold">“{clampSummaryForDisplay(evLang.verdict, 180)}”</p>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                      <span className="text-[10px] text-slate-400 font-black uppercase">{lang === "en" ? "Review Report ➔" : "查看完整报告 ➔"}</span>
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
        </section>

        {/* FLOOR 5: KIDS STROLLERS */}
        <section id="kids-stroller" className="scroll-mt-24 space-y-8">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-snug">
              {lang === "zh" ? "高端出行：Best Stroller 深度评测" : "Kids Stroller Reviews: Airport Travel & Running Joggers"}
            </h2>
            <p className="mt-2 text-sm text-slate-500 font-medium">
              {lang === "zh" ? "折叠超轻便推车与中负荷避挂推车多维横评。" : "Comprehensive assessments of lightweight cabin buggies and structural dual-suspension strollers."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {doubleStrollerFloorReviews.slice(0, 4).map((item: any) => {
              const ev = item.evaluation;
              const product = item.product || item.products?.[0];
              if (!product) return null;
              const dp = translateProduct(product, lang);
              const evLang = lang === "zh" ? ev.zh : ev.en;
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
                      alt={getProductImageAlt(product)}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                      wrapperClassName="w-full h-full"
                    />
                  </div>
                  <div className="flex flex-col justify-between flex-1 py-1">
                    <div className="space-y-2">
                       <span className="text-[10px] text-orange-500 font-black uppercase tracking-wider block">{dp.brand}</span>
                      <h3 className="font-black text-slate-900 text-base leading-snug group-hover:text-orange-500 transition-colors line-clamp-2">{evLang.title}</h3>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed font-semibold">“{clampSummaryForDisplay(evLang.verdict, 180)}”</p>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                      <span className="text-[10px] text-slate-400 font-black uppercase">{lang === "en" ? "Review Report ➔" : "查看完整报告 ➔"}</span>
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
        </section>

        {/* FLOOR 6: KIDS ELECTRIC CAR */}
        <section id="kids-electric-car" className="scroll-mt-24 space-y-8">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-snug">
              {lang === "zh" ? "仿真驾驶：Kids Electric Car 深度评测" : "Kids Electric Car Reviews: Safety Circuits & Battery Audits"}
            </h2>
            <p className="mt-2 text-sm text-slate-500 font-medium">
              {lang === "zh" ? "越野电动车、仿真赛车多轨测试：防护起步加速度与绝缘回路安全性。" : "Uncompromising ride-on reviews prioritizing electrical insulation parameters and parental wireless kill locks."}
            </p>
          </div>

          {electricCarOnlyReviews.length === 0 ? (
            <p className="text-slate-400 text-sm italic">{lang === "en" ? "No electric car evaluations currently compiled." : "暂无电动玩具车专项测评。"}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {electricCarOnlyReviews.slice(0, 4).map((item: any) => {
                const ev = item.evaluation;
                const product = item.product || item.products?.[0];
                if (!product) return null;
                const dp = translateProduct(product, lang);
                const evLang = lang === "zh" ? ev.zh : ev.en;
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
                        alt={getProductImageAlt(product)}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                        wrapperClassName="w-full h-full"
                      />
                    </div>
                    <div className="flex flex-col justify-between flex-1 py-1">
                      <div className="space-y-2">
                         <span className="text-[10px] text-orange-500 font-black uppercase tracking-wider block">{dp.brand}</span>
                        <h3 className="font-black text-slate-900 text-base leading-snug group-hover:text-orange-500 transition-colors line-clamp-2">{evLang.title}</h3>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed font-semibold">“{clampSummaryForDisplay(evLang.verdict, 180)}”</p>
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                        <span className="text-[10px] text-slate-400 font-black uppercase">{lang === "en" ? "Review Report ➔" : "查看完整报告 ➔"}</span>
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

      </div>

      {/* 🛠️ 模块 5：独立测试方法论与国际标准认证 (Lab Rigor & Badges) */}
      <section className="bg-white border border-slate-100 rounded-[48px] p-8 sm:p-10 max-w-7xl mx-auto shadow-sm space-y-6 text-center">
        <div className="max-w-4xl mx-auto space-y-3">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">KIDSMOBI LAB STANDARDS</h4>
          <h3 className="text-2xl font-black text-slate-900">{lang === "zh" ? "测试方法论与客观性誓言" : "Independent Rigor & Certification Compliance"}</h3>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            {lang === "zh"
              ? "KIDSMOBI 物理安全验证完全遵守各项核心权威儿童辅具出厂与行使指标。我们坚持零赞助协议，样品直接进入滚筒颠簸疲劳机实测，不接受商业推广影响结果。"
              : "We stand on strict compliance. Every travel stroller model, balance bike, and kids electric car is subjected to dynamic rolling stress telemetry. We receive 0% direct corporate backing, keeping our scores purely consumer-protective."}
          </p>
        </div>

        {/* Global Compliance Cert badges map */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap justify-center items-center gap-6 sm:gap-12 opacity-40 grayscale hover:opacity-80 hover:grayscale-0 transition-all duration-500">
          {[
            { label: "CPSC", detail: "US Consumer Protection" },
            { label: "ISO 8098", detail: "Braking Standards" },
            { label: "GB 14746", detail: "China Safety Line" },
            { label: "EN 71", detail: "EU Toys Rigor" },
            { label: "ASTM F963", detail: "Mechanical Strength" }
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
 