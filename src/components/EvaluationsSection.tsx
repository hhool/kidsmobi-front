import { useState, useMemo, useEffect } from "react";
import { Award, Filter, ShieldCheck, Scale, Search, CheckCircle, Flame, Star, Sparkles, BookOpen, ArrowRight } from "lucide-react";
import { Product } from "../types";
import { translateProduct } from "../lib/translate";
import { resolveProductImages } from "../lib/productImages";
import SmartImage from "./common/SmartImage";
import Breadcrumbs from "./Breadcrumbs";

import MultiCompareView from "./MultiCompareView";
import { Evaluation } from "../types";
import { clearJsonLd, setCollectionPageJsonLd, setJsonLd } from "../lib/seoJsonLd";

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
    // Standardize scores to 0-10 bounds
    if (evaluation && evaluation.scores) {
      return [
        { name: lang === "en" ? "Safety" : "安全保障", val: evaluation.scores.safety },
        { name: lang === "en" ? "Comfort" : "舒适减震", val: evaluation.scores.comfort },
        { name: lang === "en" ? "Portability" : "省力便携", val: evaluation.scores.portability },
        { name: lang === "en" ? "Features" : "功能拓展", val: evaluation.scores.features },
        { name: lang === "en" ? "Value" : "性价比", val: evaluation.scores.valueForMoney }
      ];
    } else if (product) {
      const comfort = product.category === "stroller" ? 10.0 : product.category === "scooter" ? 8.5 : product.tireType?.includes("充气") ? 9.5 : 6.0;
      const value = product.price < 600 ? 10.0 : product.price < 2000 ? 8.5 : product.price < 4000 ? 7.0 : 5.0;
      return [
        { name: lang === "en" ? "Safety" : "安全保障", val: product.safetyScore },
        { name: lang === "en" ? "Comfort" : "舒适减震", val: comfort },
        { name: lang === "en" ? "Weight" : "省力指数", val: product.weightScore },
        { name: lang === "en" ? "Fit" : "成长匹配", val: product.geometryScore },
        { name: lang === "en" ? "Value" : "性价比", val: value }
      ];
    }
    return [];
  }, [product, evaluation, lang]);

  const size = 180;
  const center = size / 2;
  const radius = center - 35;

  // Compute coordinate points
  const points = useMemo(() => {
    return scores.map((s, index) => {
      const angle = (index * 2 * Math.PI) / 5 - Math.PI / 2;
      const pct = s.val / 10;
      const x = center + radius * pct * Math.cos(angle);
      const y = center + radius * pct * Math.sin(angle);
      return { x, y, name: s.name, val: s.val };
    });
  }, [scores, radius, center]);

  const polyPath = useMemo(() => {
    if (points.length === 0) return "";
    return points.map(p => `${p.x},${p.y}`).join(" ");
  }, [points]);

  // Guidelines pentagons
  const guidlines = useMemo(() => {
    return [0.2, 0.4, 0.6, 0.8, 1.0].map((scale) => {
      return scores.map((s, index) => {
        const angle = (index * 2 * Math.PI) / 5 - Math.PI / 2;
        const x = center + radius * scale * Math.cos(angle);
        const y = center + radius * scale * Math.sin(angle);
        return `${x},${y}`;
      }).join(" ");
    });
  }, [scores, radius, center]);

  return (
    <div className={`flex flex-col items-center p-8 rounded-[48px] border relative overflow-hidden w-full max-w-70 mx-auto transition-transform hover:scale-[1.02] duration-500 ${isDark ? "bg-slate-800/50 border-slate-700 shadow-none text-white" : "bg-white border-slate-100 shadow-xl shadow-orange-500/5"}`}>
      <span className="text-[10px] text-orange-500 uppercase font-black tracking-[0.2em] mb-6 leading-none text-center">
        {lang === "en" ? "Performance Matrix" : "五维度综合考量"}
      </span>
      
      <svg width={size} height={size} className="overflow-visible select-none my-2 drop-shadow-sm">
        {/* Render grid lines */}
        {guidlines.map((p, i) => (
          <polygon
            key={i}
            points={p}
            fill="none"
            stroke={isDark ? "#334155" : "#f8fafc"}
            strokeWidth="1.5"
          />
        ))}

        {/* Score polygon path */}
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

        {/* Dimension title labels */}
        {points.map((p, i) => {
          const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
          const textDist = radius + 22;
          const x = center + textDist * Math.cos(angle);
          const y = center + textDist * Math.sin(angle);
          
          let textAnchor = "middle";
          if (Math.cos(angle) > 0.15) textAnchor = "start";
          else if (Math.cos(angle) < -0.15) textAnchor = "end";

          return (
            <text
              key={i}
              x={x}
              y={y + 3}
              fill={isDark ? "#94a3b8" : "#64748b"}
              fontSize="11"
              fontWeight="900"
              textAnchor={textAnchor}
              className="tracking-tighter"
            >
              {p.name}
            </text>
          );
        })}
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
];

function hasRealEditorVerdict(product: Product) {
  const verdict = String(product.editorVerdict || "").trim().toLowerCase();
  if (verdict.length < 40) return false;
  return !DEFAULT_VERDICT_PATTERNS.some((pattern) => verdict.includes(pattern));
}

function isFocusReviewProduct(product: Product) {
  const text = `${product.category || ""} ${product.categoryId || ""}`.toLowerCase();
  return text.includes("balance") || text.includes("bicycle") || text.includes("bike") || text.includes("scooter");
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
  return `${product.brand} ${product.name}`.trim();
}

function productVerdict(product: Product) {
  return String(product.editorVerdict || product.description || product.customersSay || "").trim();
}

function makeSingleEvaluation(product: Product, type: Evaluation["type"], suffix: string, zhTitle: string, enTitle: string, verdictPrefixZh = "专家摘要", verdictPrefixEn = "Expert summary"): Evaluation {
  const verdict = productVerdict(product);
  const title = getProductDisplayName(product);
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
      verdict: `${verdictPrefixZh}：${verdict}`,
      pros: (product.pros || product.features || []).slice(0, 4),
      cons: (product.cons || []).slice(0, 4),
      changelog: "由已抓取产品详情、评分字段与专家摘要自动生成。",
    },
    en: {
      title: enTitle.replace("{product}", title),
      verdict: `${verdictPrefixEn}: ${verdict}`,
      pros: (product.pros || product.features || []).slice(0, 4),
      cons: (product.cons || []).slice(0, 4),
      changelog: "Generated from scraped product details, score fields, and expert summary.",
    },
    updatedAt: new Date("2026-07-09"),
  };
}

function makeCompareEvaluation(id: string, products: Product[], zhTitle: string, enTitle: string): Evaluation {
  const scores = products.map(getProductScores);
  const average = (key: keyof ReturnType<typeof getProductScores>) => Number((scores.reduce((sum, item) => sum + item[key], 0) / Math.max(1, scores.length)).toFixed(1));
  const names = products.map(getProductDisplayName).join(" vs ");
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
      verdict: `多品评测覆盖 ${names}，按安全、舒适、便携、功能和性价比维度形成横向结果。`,
      pros: products.slice(0, 4).map((product) => `${getProductDisplayName(product)}：${product.pros?.[0] || productVerdict(product)}`),
      cons: products.slice(0, 4).map((product) => `${getProductDisplayName(product)}：${product.cons?.[0] || "建议结合年龄、身高与使用场景确认。"}`),
      changelog: "由当前产品数据自动生成多品评测结果。",
    },
    en: {
      title: enTitle,
      verdict: `Cross comparison across ${names}, scored on safety, comfort, portability, features, and value.`,
      pros: products.slice(0, 4).map((product) => `${getProductDisplayName(product)}: ${product.pros?.[0] || productVerdict(product)}`),
      cons: products.slice(0, 4).map((product) => `${getProductDisplayName(product)}: ${product.cons?.[0] || "Confirm age, height, and use case fit before buying."}`),
      changelog: "Generated from current product data as a multi-product review result.",
    },
    updatedAt: new Date("2026-07-09"),
  };
}

function buildGeneratedEvaluations(productsData: Product[]): Evaluation[] {
  const focusProducts = productsData
    .filter((product) => product.status !== "archived" && isFocusReviewProduct(product))
    .sort((a, b) => Number(b.overallScore || 0) - Number(a.overallScore || 0));
  const verdictProducts = focusProducts.filter(hasRealEditorVerdict);
  const byCategory = (needle: string) => focusProducts.filter((product) => `${product.category} ${product.categoryId}`.toLowerCase().includes(needle));
  const balanceProducts = byCategory("balance");
  const bikeProducts = focusProducts.filter((product) => /bicycle|bike|kids_bikes/.test(`${product.category} ${product.categoryId}`.toLowerCase()));
  const scooterProducts = byCategory("scooter");

  const singles = verdictProducts.slice(0, 12).map((product, index) => makeSingleEvaluation(
    product,
    "single",
    String(index + 1),
    "{product} 单品专家摘要深度评测",
    "{product} Single Product Expert Summary Review"
  ));

  const compareGroups = [
    { products: balanceProducts.slice(0, 4), zh: "Balance Bike 高分车型横向评测", en: "Balance Bike Top Picks Cross Compare" },
    { products: bikeProducts.slice(0, 4), zh: "Kids Bike 安全与成长适配横向评测", en: "Kids Bike Safety and Fit Cross Compare" },
    { products: scooterProducts.slice(0, 4), zh: "Kids Scooter 稳定性与便携横向评测", en: "Kids Scooter Stability and Portability Cross Compare" },
    { products: focusProducts.slice(0, 4), zh: "童车高分安全榜多品评测", en: "Highest Safety Kids Mobility Cross Compare" },
    { products: [...focusProducts].sort((a, b) => Number(b.weightScore || 0) - Number(a.weightScore || 0)).slice(0, 4), zh: "轻便省力车型多品评测", en: "Light and Easy Product Cross Compare" },
  ].filter((group) => group.products.length >= 2);
  const compares = compareGroups.slice(0, 5).map((group, index) => makeCompareEvaluation(`generated_compare_${index + 1}`, group.products, group.zh, group.en));

  const values = [...verdictProducts]
    .sort((a, b) => productValueScore(b) - productValueScore(a))
    .slice(0, 5)
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
  ].filter((item) => item.product);
  const rankings = rankingSeeds.map((item, index) => makeSingleEvaluation(
    item.product,
    "ranking",
    String(index + 1),
    item.zh,
    item.en,
    "排行依据",
    "Ranking basis"
  ));

  const safetyTopics = verdictProducts.slice(0, 6).map((product, index) => makeSingleEvaluation(
    product,
    "safety",
    String(index + 1),
    "{product} 专业安全知识专项",
    "{product} Safety Special Knowledge Brief",
    "安全知识",
    "Safety note"
  ));

  return [...singles, ...compares, ...values, ...rankings, ...safetyTopics];
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
  seoKeywordHints = [],
  currentPage = 1,
  onPageChange
}: EvaluationsSectionProps) {
  const normalizeReviewType = (type?: string) => type && type !== "all" ? type : "single";
  const [selectedReviewType, setSelectedReviewType] = useState<string>(normalizeReviewType(initialReviewType));
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);

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
    { id: "single", label: "🔬 SINGLE TEST" },
    { id: "compare", label: "⚖️ CROSS COMPARE" },
    { id: "value", label: "💰 VALUE RANK" },
    { id: "ranking", label: "🏆 ANNUAL TOP" },
    { id: "safety", label: "🛡️ SAFETY SPECIAL" }
  ] : [
    { id: "single", label: "🔬 单品实测" },
    { id: "compare", label: "⚖️ 多品横评" },
    { id: "value", label: "💰 性价比测评" },
    { id: "ranking", label: "🏆 年度榜单" },
    { id: "safety", label: "🛡️ 安全专项" }
  ];

  // Map real evaluations instead of products
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
    return reviewsList.filter((r) => {
      const evLang = lang === "zh" ? r.evaluation.zh : r.evaluation.en;
      const matchesType = r.reviewType === selectedReviewType;
      const matchesSearch = searchQuery.trim() === "" ||
        evLang.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evLang.verdict.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [reviewsList, selectedReviewType, searchQuery, lang]);

  useEffect(() => {
    if (!activeEvaluationId) {
      if (selectedEvaluation) {
        setSelectedEvaluation(null);
      }
      return;
    }
    const matchedEvaluation = reviewsList.find((item) => item.evaluation.id === activeEvaluationId)?.evaluation;
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
    const prioritizedReviews = [...filteredReviews].sort((a, b) => {
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
          type: "single",
          evaluation: r.evaluation,
          product,
          reviewBadge: r.reviewBadge
        };
      } else {
        const products = (r.evaluation.productIds || [])
          .map(id => productsData.find(p => p.id === id))
          .filter(Boolean) as Product[];
        return {
          type: "multi",
          evaluation: r.evaluation,
          products,
          reviewBadge: r.reviewBadge
        };
      }
    });
  }, [filteredReviews, productsData]);

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
      items: pagedRenderList.map((block) => ({
        name: lang === "zh" ? block.evaluation.zh.title : block.evaluation.en.title,
        url: canonicalUrl,
      })),
    });
    return () => clearJsonLd("evaluations-list");
  }, [lang, pagedRenderList, selectedEvaluation]);

  const isSelectedSingle = selectedEvaluation && 
    (selectedEvaluation.type !== "compare" || !selectedEvaluation.productIds || selectedEvaluation.productIds.length <= 1);

  if (selectedEvaluation && isSelectedSingle) {
    const reviewedProduct = productsData.find((p) => p.id === selectedEvaluation.productId || selectedEvaluation.productIds?.includes(p.id));
    const tEv = lang === "zh" ? selectedEvaluation.zh : selectedEvaluation.en;
    const selectedTypeLabel = getReviewTypeLabel(selectedEvaluation.type);
    const productDisplay = reviewedProduct ? translateProduct(reviewedProduct, lang) : null;
    const imageSet = reviewedProduct ? resolveProductImages(reviewedProduct) : null;

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
            { label: tEv.title, active: true },
          ]}
        />

        <section className="bg-slate-900 text-white p-8 sm:p-10 rounded-[48px] relative overflow-hidden shadow-2xl">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center">
            <div className="space-y-5">
              <div className="inline-flex py-1 px-3 bg-white/10 rounded-full text-xs font-black tracking-widest uppercase">
                {selectedTypeLabel}
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">{tEv.title}</h1>
              <p className="text-slate-300 font-medium leading-relaxed italic border-l-4 border-orange-500 pl-4">
                "{tEv.verdict}"
              </p>
            </div>
            {reviewedProduct && imageSet && (
              <div className="bg-white rounded-[36px] p-6 shadow-2xl shadow-slate-950/20">
                <SmartImage
                  src={imageSet.coverUrl || undefined}
                  alt={productDisplay?.name || tEv.title}
                  className="w-full h-56 object-contain"
                  wrapperClassName="w-full h-56"
                  width={448}
                  height={224}
                  priority
                />
                <div className="text-center mt-4">
                  <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">{productDisplay?.brand}</p>
                  <h2 className="font-black text-slate-900 text-xl leading-tight mt-1">{productDisplay?.name}</h2>
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
                onClick={() => onSelectProduct(reviewedProduct)}
                className="w-full py-4 bg-slate-900 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {lang === "en" ? "Open Product Dossier" : "打开产品档案"}
                <ArrowRight className="w-4 h-4" />
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
      <h1 className="sr-only">
        {lang === "en"
          ? "Balance Bike, Kids Bike and Kids Scooter Evaluation Reports"
          : "balance bike、kids bike 与 kids scooter 实验室评测报告"}
      </h1>
      
      {/* Breadcrumbs (PRD 4.3.2) */}
      <Breadcrumbs 
        lang={lang} 
        onHomeClick={() => setActiveTab?.("home")}
        items={[{ label: lang === "zh" ? "评测中心" : "EVALUATION CENTER", active: true }]} 
      />

      {/* Upper header details */}
      <section className="text-center max-w-3xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-50 border border-orange-100 text-orange-600 text-[10px] font-black uppercase tracking-widest rounded-full">
          <BookOpen className="w-4 h-4" />
          {lang === "zh" ? "专业实测报告" : "VERIFIED REPORTS"}
        </div>
        <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          {lang === "en" ? (
            <>Stroller, Balance Bike & Kids Scooter Expert Reviews</>
          ) : (
            <>用严苛实测，重塑选购信心</>
          )}
        </h2>
        <p className="text-slate-500 text-lg font-medium leading-relaxed">
          {lang === "en" 
            ? "Real-world testing meets parenting reality. Discover our top-rated jogging stroller, balance bike, and kids scooter, rigorously evaluated for your child's safety and comfort."
            : "KIDSMOBI 通过匿名采购、工业级精密设备及儿科工效学评估，为您呈现每一款童车背后的真实物理数据。"}
        </p>
        {lang === "en" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-left">
            {[
              "jogging stroller review and stroller safety test",
              "balance bike review and toddler bike fit report",
              "kids scooter review and kids electric bike safety audit",
              "annual top balance bike, kids bike, and kids scooter ranking",
              "single product review for stroller, balance bike, and kids scooter",
              "cross compare reports for kids dirt bike and electric dirt bike for kids",
            ].map((item) => (
              <p key={item} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-[11px] font-bold leading-relaxed text-slate-500">
                {item}
              </p>
            ))}
          </div>
        )}
        {seoKeywordHints.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {seoKeywordHints.slice(0, 10).map((kw) => (
              <span
                key={kw}
                className="px-3 py-1 rounded-full text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200"
              >
                {kw}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Sifting control dashboard */}
      <div className="bg-white border border-slate-100 rounded-[48px] p-10 shadow-2xl shadow-orange-500/5 space-y-8 text-left relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-full -mr-16 -mt-16 opacity-50"></div>
        
        <div className="flex flex-col lg:flex-row gap-6 relative z-10">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-5 top-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === "en" ? "Search premium brands, safety indices..." : "搜索全球高端品牌、安全特征或关键型号..."}
              className="w-full bg-slate-50 border border-slate-100 rounded-[28px] pl-14 pr-6 py-4.5 text-sm text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:bg-white transition-all"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {reviewTypes.map((t) => (
              <button
                key={t.id}
                onClick={() => handleReviewTypeSelect(t.id)}
                className={`px-6 py-4 rounded-[28px] text-[10px] font-black uppercase tracking-widest transition-all border ${
                  selectedReviewType === t.id
                    ? "bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-900/10"
                    : "bg-white text-slate-400 border-slate-100 hover:border-slate-200 hover:text-slate-900"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-emerald-50/50 p-6 rounded-4xl border border-emerald-100 flex items-center gap-4 text-xs text-emerald-700 font-black relative z-10">
          <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm">
             <ShieldCheck className="w-6 h-6 text-emerald-500 shrink-0" />
          </div>
          {lang === "en" ? "KIDSMOBI PROMISE: All samples are purchased anonymously to avoid manufacturer manipulation." : "KIDSMOBI 申明：全站测评均由专业人员通过个人账号自费购入，确保 100% 独立性与客观公平。"}
        </div>
      </div>

      {/* Grid listing */}
      {renderList.length === 0 ? (
        <div className="p-24 text-center bg-white border border-slate-100 rounded-[56px] shadow-sm">
          <img src="https://api.dicebear.com/7.x/bottts/svg?seed=empty&backgroundColor=f8fafc" alt="Empty" className="w-24 h-24 mx-auto mb-6 opacity-20" />
          <p className="text-slate-400 font-black uppercase tracking-widest text-xs">
            {lang === "en" ? "No matches in current lab database" : "实验室数据库中暂无匹配项"}
          </p>
        </div>
      ) : (
        <div className="space-y-12 text-left animate-fade-in">
          {pagedRenderList.map((block) => {
            if (block.type === "multi") {
              const { evaluation, products, reviewBadge } = block;
              const tEv = lang === "zh" ? evaluation.zh : evaluation.en;
              return (
                <div
                  key={evaluation.id}
                  className="bg-slate-900 border border-slate-800 rounded-[56px] p-8 md:p-12 flex flex-col gap-10 justify-between transition-all group shadow-2xl relative overflow-hidden text-white"
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800 rounded-bl-full -mr-24 -mt-24 opacity-50"></div>
                 
                  <div className="relative z-10 text-center mb-2">
                    <span className="bg-orange-500 text-white font-black px-4 py-1.5 rounded-full text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-orange-500/20">
                      {reviewBadge}
                    </span>
                    <h3 className="text-3xl md:text-5xl mt-6 font-black tracking-tight text-white leading-tight">
                      {tEv.title}
                    </h3>
                    <p className="text-slate-400 mt-3 text-sm max-w-lg mx-auto leading-relaxed">
                      {tEv.verdict}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10 w-full mt-4">
                    {products.map((product, idx) => {
                      const diProduct = translateProduct(product, lang);
                      const imageSet = resolveProductImages(product);
                      return (
                        <div key={product.id} className="bg-slate-800/80 backdrop-blur-sm rounded-4xl p-6 border border-slate-700/80 flex flex-col items-center gap-4 hover:border-slate-500 transition-colors duration-300">
                          <div className="w-20 h-20 bg-white rounded-2xl p-2 flex items-center justify-center">
                            <SmartImage
                              src={imageSet.coverUrl || undefined}
                              alt={diProduct.name}
                              className="w-full h-full object-contain"
                              wrapperClassName="w-full h-full"
                              width={160}
                              height={160}
                              priority={idx < 2}
                            />
                          </div>
                          <div className="text-center">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{diProduct.brand}</span>
                            <h4 className="font-extrabold text-white text-xs leading-snug uppercase line-clamp-1">{diProduct.name}</h4>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-center relative z-10">
                    <button
                      onClick={() => openEvaluationDetail(evaluation)}
                      className="px-8 py-4.5 bg-white hover:bg-orange-500 text-slate-900 hover:text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-md flex items-center gap-2"
                    >
                      {lang === "en" ? "OPEN DIRECT REALTIME COMPARISON" : "进入多品实时对比"}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            }

            const { product, reviewBadge, evaluation } = block;
            if (!product) return null;
            const diProduct = translateProduct(product, lang);
            const tEv = lang === "zh" ? evaluation.zh : evaluation.en;
            return (
              <div
                key={evaluation.id}
                className="bg-white border border-slate-100 rounded-[56px] p-10 flex flex-col md:flex-row gap-10 justify-between transition-all group hover:shadow-[0_48px_80px_-24px_rgba(249,115,22,0.12)] shadow-sm relative overflow-hidden"
              >
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-orange-50/30 blur-3xl rounded-full -mb-24 -mr-24 group-hover:bg-orange-100/50 transition-colors"></div>
                
                {/* Column Left: Text info */}
                <div className="md:w-1/2 flex flex-col justify-between space-y-8 relative z-10">
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <span className="bg-orange-50 text-orange-600 font-black px-4 py-1.5 rounded-full text-[9px] uppercase tracking-[0.2em] border border-orange-100">
                        {reviewBadge}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{diProduct.brand}</span>
                      <h3 className="font-black text-slate-900 text-3xl md:text-2xl lg:text-3xl leading-tight group-hover:text-orange-500 transition-colors uppercase">
                        {tEv.title || diProduct.name}
                      </h3>
                    </div>

                    <div className="bg-slate-50/50 p-6 rounded-4xl border border-slate-50">
                       <p className="text-[15px] sm:text-sm text-slate-600 leading-relaxed font-bold italic">“{tEv.verdict || diProduct.editorVerdict}”</p>
                    </div>
                  </div>

                  <button
                    onClick={() => openEvaluationDetail(evaluation)}
                    className="w-full py-5 bg-slate-900 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-widest rounded-3xl transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3 active:scale-95 group-hover:shadow-orange-500/20"
                  >
                    {lang === "en" ? "OPEN FULL DOSSIER" : "开启完整测评档案"}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Column Right: Live Interactive Vector Radar Component */}
                <div className="md:w-1/2 flex items-center justify-center relative z-10">
                  <SafetyRadarChart product={product} evaluation={evaluation} lang={lang} />
                </div>
                
              </div>
            );
          })}

          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => onPageChange?.(Math.max(1, safePage - 1))}
                disabled={safePage <= 1}
                className="px-4 py-2 rounded-2xl border border-slate-200 bg-white text-slate-600 font-black text-xs disabled:opacity-40"
              >
                {lang === "en" ? "Previous" : "上一页"}
              </button>
              <span className="text-xs font-black text-slate-400">
                {safePage} / {totalPages}
              </span>
              <button
                onClick={() => onPageChange?.(Math.min(totalPages, safePage + 1))}
                disabled={safePage >= totalPages}
                className="px-4 py-2 rounded-2xl border border-slate-200 bg-white text-slate-600 font-black text-xs disabled:opacity-40"
              >
                {lang === "en" ? "Next" : "下一页"}
              </button>
            </div>
          )}
        </div>
      )}


      {/* Annual Awards Section refurbished for B2C */}
      <section className="bg-orange-50 border border-orange-100 rounded-[48px] p-10 mt-12 relative overflow-hidden text-left shadow-sm">
        <div className="absolute right-0 bottom-0 opacity-10">
          <Award className="w-64 h-64 text-orange-200" />
        </div>
        
        <div className="space-y-6 relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-orange-100 text-orange-600 text-xs font-bold rounded-full">
            <Star className="w-3.5 h-3.5 fill-current" />
            {lang === "en" ? "2026 Annual Best Picks" : "2026 年度家长推荐榜单"}
          </div>
          <h3 className="text-3xl font-black text-slate-900">
            {lang === "en" ? "Top Safety Performers" : "那些值得入手的“尖子生”"}
          </h3>
          <p className="text-sm text-slate-500 font-medium leading-relaxed">
            {lang === "en" 
              ? "After filtering through 100+ stress tests and real-world ride validation checks, these models stand out for their exceptional safety and comfort."
              : "经历过严格实测和上万次平衡稳定性测试，我们精选出了以下几款能够真正让家长放心、孩子开心的标兵车型："}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
            <div className="bg-white p-5 rounded-3xl border border-orange-100 shadow-sm">
              <strong className="text-orange-600 block mb-1 font-black">🏆 {lang === "en" ? "Best Balance Bike" : "最佳平衡车"}</strong>
              <span className="text-slate-500 font-medium">{lang === "en" ? "Woom 1 (Only 3kg, toddlers love it)" : "Woom 1 (仅重 3kg，宝宝一眼爱上)"}</span>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-orange-100 shadow-sm">
              <strong className="text-orange-600 block mb-1 font-black">🏆 {lang === "en" ? "Best Kid Bicycle" : "最佳自行车"}</strong>
              <span className="text-slate-500 font-medium">{lang === "en" ? "Woom 2 (Micro-reach brakes for maximum safety)" : "Woom 2 (超短握距手刹，安全感拉满)"}</span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
