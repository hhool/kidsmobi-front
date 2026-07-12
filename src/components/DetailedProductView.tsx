import React, { useState } from "react";
import { 
  ArrowLeft, 
  ShieldCheck, 
  TrendingUp, 
  TrendingDown, 
  ChevronRight, 
  Play,
  Image as ImageIcon,
  ExternalLink
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
import { cleanVisibleSourceText } from "../lib/visibleText";
import ProductCarousel from "./ProductCarousel";

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

  const candidates = [
    localized[lang]?.description,
    localized.Product_Description,
    localized.product_description,
    localized.productDescription,
    localized.description,
    localized[lang]?.customersSay,
    localized.customers_say,
    localized.customersSay,
  ]
    .map((value) => String(value || "").replace(/\s+/g, " ").trim())
    .filter(Boolean);

  for (const text of candidates) {
    const lower = text.toLowerCase();
    if (lower.includes("product description")) continue;
    if (/^rated\s+\d(?:\.\d+)?\s+out\s+of\s+5\b/i.test(text)) continue;
    if (/^backed\s+by\s+[\d,]+\s+customer\s+reviews\b/i.test(text)) continue;
    if (/^\d(?:\.\d+)?\s+\d(?:\.\d+)?\s+out\s+of\s+5\s+stars\b/i.test(text)) continue;
    if (/^\(?[\d,]+\)?\s+customer\s+reviews\b/i.test(text)) continue;
    return text;
  }

  return "";
}

function resolveVerdictText(product: Product, lang: "zh" | "en"): string {
  const verdict = String(product.editorVerdict || "").trim();
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

function cleanVisibleFieldText(value: unknown) {
  return cleanVisibleSourceText(value)
    .replace(/^editor\s+verdict\s*[:：-]\s*/i, "")
    .replace(/\s*\(\s*Features\[\d+\]\s*\)\s*/gi, " ")
    .replace(/\s*\(\s*Product\s+Feature\s*\)\s*/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatSpecKey(key: string) {
  return String(key || "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

function formatSpecValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) {
    return value.map((item) => formatSpecValue(item)).filter(Boolean).join(", ");
  }
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, entryValue]) => `${formatSpecKey(key)}: ${formatSpecValue(entryValue)}`)
      .filter((item) => item.trim())
      .join(" | ");
  }
  return cleanVisibleFieldText(value);
}

function buildBasicInfoSections(product: Product, lang: "zh" | "en") {
  const richProduct = product as Product & {
    Product_Specifications?: Record<string, unknown>;
    Category_Attributes?: Record<string, unknown>;
    Product_Display_Fields?: Record<string, { value?: unknown; source?: unknown }>;
    specsText?: string;
  };
  const specs = richProduct.Product_Specifications || {};
  const sectionOrder = [
    "Measurements",
    "Features_Specs",
    "Materials_Care",
    "Item_Details",
    "User_Guide",
    "Additional_Details",
  ];
  const sectionLabels: Record<string, { zh: string; en: string }> = {
    Measurements: { zh: "尺寸与重量", en: "Measurements" },
    Features_Specs: { zh: "功能规格", en: "Features Specs" },
    Materials_Care: { zh: "材质与护理", en: "Materials & Care" },
    Item_Details: { zh: "商品信息", en: "Item Details" },
    User_Guide: { zh: "使用指南", en: "User Guide" },
    Additional_Details: { zh: "附加信息", en: "Additional Details" },
  };

  const sections = sectionOrder
    .map((sectionKey) => {
      const sectionValue = specs[sectionKey];
      if (!sectionValue || typeof sectionValue !== "object") return null;

      const rows = Object.entries(sectionValue as Record<string, unknown>)
        .map(([key, value]) => ({
          label: formatSpecKey(key),
          value: formatSpecValue(value),
        }))
        .filter((item) => item.value);

      if (!rows.length) return null;

      return {
        key: sectionKey,
        label: sectionLabels[sectionKey]?.zh || sectionLabels[sectionKey]?.en || formatSpecKey(sectionKey),
        labelEn: sectionLabels[sectionKey]?.en || formatSpecKey(sectionKey),
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
        label: formatSpecKey(key),
        value: formatSpecValue(itemValue),
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
      label: formatSpecKey(key),
      value: formatSpecValue(field?.value),
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
      { label: lang === "zh" ? "品牌" : "Brand", value: cleanVisibleFieldText(product.brand) },
      { label: lang === "zh" ? "类目" : "Category", value: cleanVisibleFieldText(product.category) },
      { label: lang === "zh" ? "适龄范围" : "Age Range", value: cleanVisibleFieldText(product.ageRange) },
      { label: lang === "zh" ? "重量" : "Weight", value: cleanVisibleFieldText(product.weight) },
      { label: lang === "zh" ? "材质" : "Material", value: cleanVisibleFieldText(product.material) },
      { label: lang === "zh" ? "刹车/约束" : "Brake / Restraint", value: cleanVisibleFieldText(product.brakeType) },
      { label: lang === "zh" ? "轮胎" : "Tire Type", value: cleanVisibleFieldText(product.tireType) },
      { label: lang === "zh" ? "合规" : "Compliance", value: cleanVisibleFieldText(product.compliance) },
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

  return fallbackSections;
}

function cleanEvidenceSource(value: unknown) {
  const text = cleanVisibleSourceText(value);
  if (/^Features\[\d+\]$/i.test(text)) return "";
  if (/^Product\s+Feature$/i.test(text)) return "";
  if (text === "产品特性") return "";
  return text;
}

interface DetailedProductViewProps {
  product: Product;
  onClose: () => void;
  lang: "zh" | "en";
  activeStandardDimension: string | null;
  setActiveStandardDimension: (dim: string | null) => void;
  previousTab?: string;
  cmsSettings?: CMSSettings | null;
}

export default function DetailedProductView({
  product,
  onClose,
  lang,
  activeStandardDimension,
  setActiveStandardDimension,
  previousTab,
  cmsSettings
}: DetailedProductViewProps) {
  const displayProduct = translateProduct(product, lang);
  const verdictText = resolveVerdictText(displayProduct, lang);
  const descriptionText = resolveDescriptionText(displayProduct, lang);
  const imageSet = resolveProductImages(displayProduct);
  const videoUrl = [product.videoUrl, ...(product.videos || []).map((item) => item.url)]
    .map((item) => String(item || "").trim())
    .find((item) => item && !isUnsupportedVideoUrl(item)) || "";
  const videoRenderType = getVideoRenderType(videoUrl);
  const hasVideo = videoRenderType !== "none";
  const hasFeatureImages = imageSet.featureUrls.length > 0;
  const [activeMediaTab, setActiveMediaTab] = useState<"gallery" | "feature" | "video">("gallery");
  const basicInfoSections = buildBasicInfoSections(displayProduct, lang);

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
          return "Back to Product Center";
        case "evaluations":
          return "Back to Evaluations";
        case "guides":
          return "Back to Buyer's Guide";
        case "news":
          return "Back to Global News";
        case "home":
          return "Back to Home";
        default:
          return "Back to Product Center";
      }
    }
  };

  React.useEffect(() => {
    setActiveMediaTab("gallery");
  }, [product.id]);

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

  const handleAxisLabelClick = (key: string) => {
    setActiveStandardDimension(key);
    setTimeout(() => {
      const element = document.getElementById(`std-accordion-${key}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 120);
  };

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

  const scoringIconMap: Record<string, string> = {
    safety: "🛡️",
    comfort: "🛋️",
    portability: "🎒",
  };

  const scoringLabelMap: Record<string, { zh: string; en: string }> = {
    safety: { zh: "Safety First", en: "Safety First" },
    comfort: { zh: "Riding Comfort", en: "Riding Comfort" },
    portability: { zh: "Light & Easy", en: "Light & Easy" },
  };

  const productScoringStandards = displayProduct.scoringStandards || product.scoringStandards || [];
  const scoringStandards = productScoringStandards.length > 0
    ? productScoringStandards.map((standard) => ({
        key: standard.key,
        nameZh: `${scoringIconMap[standard.key] || "•"} ${scoringLabelMap[standard.key]?.zh || standard.label}`,
        nameEn: `${scoringIconMap[standard.key] || "•"} ${scoringLabelMap[standard.key]?.en || standard.label}`,
        parentTip: cleanVisibleSourceText(standard.parentTip),
        evidence: standard.evidence || [],
      }))
    : (cmsSettings?.scoringStandards || []).slice(0, 3).map(s => ({
        key: s.id,
        nameZh: s.icon + " " + s.labelZh,
        nameEn: s.icon + " " + s.labelEn,
        parentTip: cleanVisibleSourceText(lang === "en" ? s.descriptionEn : s.descriptionZh),
        evidence: (displayProduct.scrapedEvidence || product.scrapedEvidence || []).slice(0, 3),
      }));

  return (
    <div id="detailed_product_view" className="max-w-4xl mx-auto space-y-8 animate-fade-in text-left">
      
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
          <h1 className="text-3xl font-black text-slate-900">{displayProduct.name}</h1>
        </div>
        
        <div className="flex gap-3">
          <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
             <span className="text-[10px] text-slate-400 font-bold block uppercase mb-1">{lang === "en" ? "Overall Score" : "综合评分"}</span>
             <strong className="text-2xl font-black text-orange-500">{displayProduct.overallScore}</strong>
          </div>
        </div>
      </div>
      
      {/* Media Gallery & Video Showcase */}
      <div className="bg-white border border-slate-100 rounded-[40px] overflow-hidden shadow-sm">
        <div className="flex border-b border-slate-100">
          <button 
            onClick={() => setActiveMediaTab("gallery")}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-black uppercase transition-all ${activeMediaTab === "gallery" ? "bg-orange-50 text-orange-600 border-b-2 border-orange-500" : "text-slate-400 hover:bg-slate-50"}`}
          >
            <ImageIcon className="w-4 h-4" />
            {lang === "en" ? "Image Gallery" : "产品实拍图库"}
          </button>
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
              {lang === "en" ? "Product Video" : "实物演示视频"}
            </button>
          )}
        </div>

        <div className="p-1 min-h-[400px] bg-slate-50">
          {activeMediaTab === "gallery" ? (
            <ProductCarousel 
              images={[imageSet.coverUrl, ...imageSet.galleryUrls].filter(Boolean)} 
              lang={lang}
              productName={displayProduct.name}
            />
          ) : activeMediaTab === "feature" ? (
            <ProductCarousel 
              images={imageSet.featureUrls.filter(Boolean)} 
              lang={lang}
              productName={displayProduct.name}
            />
          ) : (
            <div className="aspect-video w-full">
              {hasVideo && videoRenderType === "direct" ? (
                <video
                  src={videoUrl}
                  className="w-full h-full rounded-2xl bg-black"
                  title={`${product.name} Video`}
                  controls
                  playsInline
                  preload="metadata"
                />
              ) : hasVideo ? (
                <iframe 
                  src={videoUrl} 
                  className="w-full h-full rounded-2xl"
                  title={`${product.name} Video`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center rounded-2xl text-slate-400 font-medium">
                  {lang === "en" ? "No video available" : "暂无视频"}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Radar & Evidence (Left Column) */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white border border-slate-100 rounded-[40px] p-8 shadow-sm space-y-8">
             <div className="flex justify-between items-center border-b border-slate-50 pb-6">
                <h2 className="text-xl font-black text-slate-900">{lang === "en" ? "Performance Analysis" : "测评效能透视"}</h2>
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
                            className="cursor-pointer font-bold text-[11px] fill-slate-400 hover:fill-orange-500 transition-colors"
                            onClick={() => handleAxisLabelClick(radarData[props.index].key)}
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
             <div className="space-y-4 pt-6 border-t border-slate-50">
               <h3 className="flex items-center gap-2 text-xs font-black text-slate-700 uppercase tracking-widest">
                 <ShieldCheck className="w-4 h-4 text-orange-500" />
                 {lang === "en" ? "Product Basic Info" : "产品基本信息"}
               </h3>
               {basicInfoSections.length > 0 ? (
                 <div className="space-y-4">
                   {basicInfoSections.map((section) => (
                     <div key={section.key} className="rounded-3xl border border-slate-100 bg-slate-50/70 p-4 space-y-4">
                       <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                         <div>
                           <p className="text-sm font-black text-slate-800">{lang === "en" ? section.labelEn : section.label}</p>
                           <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{section.key}</p>
                         </div>
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
                 </div>
               ) : (
                 <div className="rounded-3xl border border-slate-100 bg-slate-50/70 p-4 text-sm text-slate-500 font-medium">
                   {lang === "en" ? "No Product_Specifications data available." : "当前暂无 Product_Specifications 结构化数据。"}
                 </div>
               )}
             </div>
          </div>

          {/* Standards Accordion */}
          <div className="bg-white border border-slate-100 rounded-[40px] p-8 shadow-sm space-y-6">
             <h2 className="text-xl font-black text-slate-900 border-b border-slate-50 pb-4">{lang === "en" ? "Scoring Standards & Logic" : "评分标准与算法详情"}</h2>
             <div className="space-y-3">
                {scoringStandards.map((std) => {
                  const isExpanded = activeStandardDimension === std.key;
                  return (
                    <div 
                      key={std.key} 
                      id={`std-accordion-${std.key}`}
                      className={`rounded-3xl border transition-all ${isExpanded ? "border-orange-200 bg-orange-50/20" : "border-slate-100 bg-slate-50/50"}`}
                    >
                      <button 
                        onClick={() => setActiveStandardDimension(isExpanded ? null : std.key)}
                        className="w-full px-6 py-4 flex justify-between items-center text-left"
                      >
                        <span className="font-bold text-slate-700 text-sm">{lang === "en" ? std.nameEn : std.nameZh}</span>
                        <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90 text-orange-500" : "text-slate-300"}`} />
                      </button>
                      {isExpanded && (
                        <div className="px-6 pb-6 space-y-4 animate-fade-in">
                           <div className="bg-white p-4 rounded-2xl border border-orange-100 text-[11px] text-orange-800 font-bold leading-relaxed shadow-sm">
                            {lang === "en" ? "Parent's Tip: " : "给家长的总结："}{cleanVisibleSourceText(std.parentTip)}
                           </div>
                          <div className="space-y-2 pl-2">
                            {std.evidence.map((item, index) => {
                              const evidenceSource = cleanEvidenceSource(item.source);
                              return (
                                <div key={`${std.key}-${index}`} className="text-xs text-slate-500 leading-relaxed font-medium bg-white/70 border border-slate-100 rounded-2xl p-3">
                                 {evidenceSource && <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{evidenceSource}</span>}
                                 {cleanVisibleFieldText(item.text)}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
             </div>
          </div>
        </div>

        {/* Technical Specs (Right Column) */}
          <div className="space-y-8">
           {/* Verdict Box */}
           <div className="bg-orange-50 border border-orange-100 rounded-[40px] p-8 space-y-4">
              <h2 className="text-xs font-black text-orange-600 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                {lang === "en" ? "Expert Summary" : "本站综合评价"}
              </h2>
              {verdictText && (
                <p className="text-sm text-slate-700 font-bold leading-relaxed italic">
                  "{verdictText}"
                </p>
              )}

              {descriptionText && (
                <div className="bg-white/80 border border-orange-100 rounded-2xl p-4 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {lang === "en" ? "Description" : "描述"}
                  </p>
                  <p className="text-xs text-slate-700 leading-relaxed font-semibold">{descriptionText}</p>
                </div>
              )}
           </div>
        </div>
      </div>

    </div>
  );
}
