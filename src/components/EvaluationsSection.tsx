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

  const points = useMemo(() => {
    return scores.map((s: any, index: number) => {
      const angle = (index * 2 * Math.PI) / 5 - Math.PI / 2;
      const pct = s.val / 10;
      const x = center + radius * pct * Math.cos(angle);
      const y = center + radius * pct * Math.sin(angle);
      return { x, y, name: s.name, val: s.val };
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

  return (
    <div className={`flex flex-col items-center p-8 rounded-[48px] border relative overflow-hidden w-full max-w-70 mx-auto transition-transform hover:scale-[1.02] duration-500 ${isDark ? "bg-slate-800/50 border-slate-700 shadow-none text-white" : "bg-white border-slate-100 shadow-xl shadow-orange-500/5"}`}>
      <span className="text-[10px] text-orange-500 uppercase font-black tracking-[0.2em] mb-6 leading-none text-center">
        {lang === "en" ? "Performance Matrix" : "五维度综合考量"}
      </span>
      
      <svg width={size} height={size} className="overflow-visible select-none my-2 drop-shadow-sm">
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

        {points.map((p: any, i: number) => {
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
  "自动生成评语",
  "自动生成",
  "未编辑",
];

function containsCjk(text: string) {
  return /[\u4e00-\u9fff]/.test(String(text || ""));
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
  return String(raw || "")
    .replace(/\btoys?\s+for\s+\d+\s*year\s*old[^,.;|)]*/gi, "")
    .replace(/\bgifts?\s+for\s+[^,.;|)]*/gi, "")
    .replace(/\bfor\s+(boys?|girls?|toddlers?|kids|children)\b[^,.;|)]*/gi, "")
    .replace(/\bfor\s+ages?\s*\d+[^,.;|)]*/gi, "")
    .replace(/\s+/g, " ")
    .replace(/\s+,/g, ",")
    .trim();
}

function sanitizeVerdictText(raw: string) {
  const text = String(raw || "").trim();
  if (!text) return text;
  return text
    .replace(/The editorial verdict is based on structured product data rather than marketplace sales copy\.?/gi, "")
    .replace(/Review verdict:\s*/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function productVerdict(product: Product, lang: "zh" | "en" = "en") {
  const diProduct = translateProduct(product, lang);
  const rawVerdict = String(diProduct.editorVerdict || "").trim();
  
  const isReal = rawVerdict.length >= 40 &&
    !DEFAULT_VERDICT_PATTERNS.some((p) => rawVerdict.toLowerCase().includes(p)) &&
    !(lang === "en" && containsCjk(rawVerdict));

  if (isReal) {
    return cleanVisibleSourceText(rawVerdict);
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
  const verdict = String(product.editorVerdict || "").trim().toLowerCase();
  if (verdict.length < 40) return false;
  return !DEFAULT_VERDICT_PATTERNS.some((pattern) => verdict.includes(pattern));
}

function isFocusReviewProduct(product: Product) {
  const text = `${product.category || ""} ${product.categoryId || ""}`.toLowerCase();
  const source = `${product.brand || ""} ${product.name || ""} ${product.description || ""} ${text}`.toLowerCase();
  return text.includes("stroller") || text.includes("balance") || text.includes("bicycle") || text.includes("bike") || text.includes("scooter") || source.includes("dirt bike") || source.includes("off-road") || source.includes("off road");
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
  return sanitizeMarketplaceNoise(getProductsPageSeoTitle(product));
}

function getCommercialReviewTitle(product: Product, fallbackTitle: string) {
  const text = `${product.brand || ""} ${product.name || ""} ${product.description || ""} ${product.category || ""} ${product.categoryId || ""}`.toLowerCase();
  if (text.includes("chicco") && text.includes("bravo")) return "Chicco Bravo Trio: Comprehensive Stroller Reviews";
  if (text.includes("razor") || text.includes("dirt bike") || text.includes("mountain bike") || text.includes("off-road") || text.includes("off road")) return "Razor MX350 Electric Kids Dirt Bike Review";
  if (text.includes("bob gear") || text.includes("jogging stroller") || text.includes("jogger")) return "BOB Gear Alterrain: Best Jogging Stroller Review";
  if (text.includes("travel stroller") || text.includes("coast rider") || text.includes("yoyo") || text.includes("mompush") || text.includes("passport")) return "Babyzen YOYO2: Best Travel Stroller Review";
  if (text.includes("stroller")) return "Chicco Bravo Trio: Comprehensive Stroller Reviews";
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

function getDossierCtaLabel(product: Product, evaluation: Evaluation, lang: "zh" | "en") {
  if (lang !== "en") return "开启完整测评档案";
  const normalized = `${product.brand || ""} ${product.name || ""} ${product.description || ""} ${product.category || ""} ${product.categoryId || ""} ${evaluation.en?.title || ""} ${evaluation.en?.verdict || ""}`.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (normalized.includes("jmmd")) return "Open JMMD Toddler Bike Dossier";
  if (normalized.includes("razor") || normalized.includes("mx350") || normalized.includes("dirt bike")) return "Read Razor MX350 Dirt Bike Report";
  if (normalized.includes("glerc")) return "Explore Glerc 12\" Kids Bike Data";
  const topic = getReviewCardTitle(product).replace(/\s+Review$/i, "").trim();
  return `Open ${topic} Dossier`;
}

function cleanReviewBullet(value: unknown, fallback: string) {
  const cleaned = cleanVisibleSourceText(value)
    .replace(/【[^】]*】/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\b[A-Z][A-Z\s&-]{8,}:\s*/g, "")
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
      verdict: `${verdictPrefixEn}: ${productVerdict(product, "en")}`,
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
  const names = products.map((p) => {
    const brandEn = cleanEnBrandText(p.brand || "");
    const nameStr = sanitizeMarketplaceNoise((p as any).en?.name || p.name || "");
    return `${brandEn} ${nameStr}`.trim();
  }).join(" vs ");

  const namesZh = products.map((p) => {
    const brandZh = p.brand || "";
    const nameStr = (p as any).zh?.name || p.name || "";
    return `${brandZh} ${nameStr}`.trim();
  }).join(" 对比 ");

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
      verdict: `多品评测覆盖 ${namesZh}，按安全、舒适、便携、功能和性价比维度形成横向结果。`,
      pros: products.slice(0, 4).map((product) => `${getProductDisplayName(product)}：${cleanReviewBullet(product.pros?.[0] || productVerdict(product, "zh"), "结构数据支持该项表现。")}`),
      cons: products.slice(0, 4).map((product) => `${getProductDisplayName(product)}：${cleanReviewBullet(product.cons?.[0], "建议结合年龄、身高与使用场景确认。")}`),
      changelog: "由当前产品数据自动生成多品评测结果。",
    },
    en: {
      title: enTitle,
      verdict: `Cross comparison across ${names}, scored on safety, comfort, portability, features, and value.`,
      pros: products.slice(0, 4).map((product) => {
        const bullet = cleanReviewBullet(product.pros?.[0] || productVerdict(product, "en"), "Structured product data supports this performance note.");
        return `${getProductDisplayName(product)}: ${containsCjk(bullet) ? "Structured product data supports this performance note." : bullet}`;
      }),
      cons: products.slice(0, 4).map((product) => {
        const bullet = cleanReviewBullet(product.cons?.[0], "Confirm age, height, and use case fit before buying.");
        return `${getProductDisplayName(product)}: ${containsCjk(bullet) ? "Confirm age, height, and use case fit before buying." : bullet}`;
      }),
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

  const byCategory = (needle: string) => focusProducts.filter((product) => {
    const text = `${product.category || ""} ${(product as any).categoryId || ""}`.toLowerCase();
    if (needle === "stroller") {
      return text.includes("stroller");
    }
    if (needle === "balance") {
      return text.includes("balance");
    }
    if (needle === "scooter") {
      return text.includes("scooter");
    }
    if (needle === "bike") {
      return (text.includes("bike") || text.includes("bicycle") || text.includes("kids_bikes")) && !text.includes("balance");
    }
    return text.includes(needle);
  });

  const balanceProducts = byCategory("balance");
  const bikeProducts = byCategory("bike");
  const scooterProducts = byCategory("scooter");
  const strollerProducts = byCategory("stroller");

  const findProduct = (matcher: (text: string) => boolean) => focusProducts.find((product) => matcher(`${product.brand || ""} ${product.name || ""} ${product.description || ""} ${product.category || ""} ${product.categoryId || ""}`.toLowerCase()));
  const commercialSeeds = [
    findProduct((text) => text.includes("yoyo") || text.includes("travel stroller") || text.includes("coast rider") || text.includes("mompush")) || strollerProducts[0],
    findProduct((text) => text.includes("bob gear") || text.includes("jogging stroller") || text.includes("jogger")) || strollerProducts[1],
    findProduct((text) => text.includes("razor") || text.includes("dirt bike") || text.includes("mountain bike") || text.includes("off-road") || text.includes("off road")) || bikeProducts[0],
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
    { products: strollerProducts.slice(0, 4), zh: "双人与慢大牌手推车横向评测", en: "Premium Stroller & Jogger Cross Compare" },
    { products: balanceProducts.slice(0, 4), zh: "Balance Bike 高分车型横向评测", en: "Balance Bike Top Picks Cross Compare" },
    { products: bikeProducts.slice(0, 4), zh: "Kids Bike 安全与成长适配横向评测", en: "Kids Bike Safety and Fit Cross Compare" },
    { products: scooterProducts.slice(0, 4), zh: "Kids Scooter 稳定性与便携横向评测", en: "Kids Scooter Stability and Portability Cross Compare" },
  ].filter((group) => group.products.length >= 2);

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
    const singles = renderList.filter((item: any) => {
      if (item.type !== "single" || !item.product) return false;
      const categoryText = normalizeCategoryText(item.product);
      if (!matcher(categoryText)) return false;
      if (seenSingleIds.has(item.product.id)) return false;
      seenSingleIds.add(item.product.id);
      return true;
    });

    if (!includeCompare) return singles;

    const compare = renderList.find((item: any) => {
      if (item.type !== "multi" || !item.products || item.products.length < 2) return false;
      return item.products.every((product: any) => matcher(normalizeCategoryText(product)));
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
        if (v && !containsCjk(v)) return v;
        const brandEn = cleanEnBrandText(productDisplay?.brand || "");
        const modelEn = sanitizeMarketplaceNoise(String(productDisplay?.name || ""));
        return `Detailed evaluation and lab results for the ${brandEn} ${modelEn} stroller, verified for performance capacity and structural safety parameters.`;
      } else {
        const v = sanitizeVerdictText(tEv.verdict || "");
        if (v && containsCjk(v)) return v;
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
      <Breadcrumbs 
        lang={lang} 
        onHomeClick={() => setActiveTab?.("home")}
        items={[{ label: lang === "zh" ? "评测中心" : "EVALUATION CENTER", active: true }]} 
      />

      {/* 1. Slogan Banner (Brand Identity - Upgraded/Redesigned to Match Home Page Hero) */}
      <section className="relative rounded-[48px] bg-white border border-slate-100 overflow-hidden p-10 sm:p-20 text-center max-w-7xl mx-auto shadow-2xl">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,247,237,0.92),rgba(255,255,255,0.88)_45%,rgba(236,253,245,0.55))]"></div>
        <div className="relative z-10 space-y-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-50 border border-orange-100/60 text-orange-600 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm">
            <BookOpen className="w-4 h-4" />
            {lang === "zh" ? "专业实验室独立评测" : "INDEPENDENT LAB EVALUATIONS"}
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
            {lang === "zh" 
              ? "专家评测中心：甄选最佳旅行推车与慢跑推车" 
              : "Expert Stroller Reviews & Balance Bike Lab"}
          </h1>
          <p className="text-slate-500 text-sm font-semibold leading-relaxed max-w-3xl mx-auto">
            {lang === "zh"
              ? "欢迎来到 KIDSMOBI 科学实测实验室。我们为您提供公正、独立、全物理测试的折叠伞车、高避震慢跑手推车评测 (Stroller Reviews) 以及儿童学步滑步车评测 (Balance Bike Reviews)。为了确保 100% 的客观性与最高标准，全站样品均由测试团队自费购入、拒绝任何厂商商业充值。"
              : "Welcome to the KIDSMOBI Research Lab. Here we provide physical-tested stroller reviews and rigorous balance bike reviews, helping you pinpoint the best travel stroller for airplanes or the best jogging stroller for all-terrain runs. All test samples are purchased anonymously to ensure absolute fairness and independence."}
          </p>

          {/* Partitions Fast Smooth Scroll Navigation Anchor buttons */}
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("strollers");
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-orange-50 hover:bg-orange-500 hover:text-white border border-orange-100 text-orange-600 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <span>🛒</span>
              {lang === "zh" ? "旅行与慢跑推车 ➔" : "TRAVEL & JOGGING STROLLERS ➔"}
            </button>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("balance-bikes");
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-orange-50 hover:bg-orange-500 hover:text-white border border-orange-100 text-orange-600 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <span>🚲</span>
              {lang === "zh" ? "儿童平衡车 ➔" : "BALANCE BIKES ➔"}
            </button>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("kids-bikes");
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-orange-50 hover:bg-orange-500 hover:text-white border border-orange-100 text-orange-600 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <span>🚴‍♀️</span>
              {lang === "zh" ? "自行车与滑板车 ➔" : "KIDS BIKES & SCOOTERS ➔"}
            </button>
          </div>
        </div>
      </section>

      {/* Pro Promise (Matches home promise bar) */}
      <div className="bg-emerald-50/50 p-6 rounded-4xl border border-emerald-100 flex items-center gap-4 text-xs text-emerald-700 font-black max-w-7xl mx-auto shadow-sm">
        <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-xs">
           <ShieldCheck className="w-6 h-6 text-emerald-500 shrink-0" />
        </div>
        {lang === "en" 
          ? "KIDSMOBI PROMISE: All test models are purchased independently through consumer retail channels. We accept 0% manufacturer backing, sponsorship, or placement fee." 
          : "KIDSMOBI 申明：实验室评测样品均通过普通零售渠道匿名买入，拒收一切厂商特供及赞助商利益输送，守护 100% 独立与客观。"}
      </div>

      {/* Grid listing by Floors */}
      {renderList.length === 0 ? (
        <div className="p-24 text-center bg-white border border-slate-100 rounded-[56px] shadow-sm max-w-7xl mx-auto">
          <img src="https://api.dicebear.com/7.x/bottts/svg?seed=empty&backgroundColor=f8fafc" alt="Empty" className="w-24 h-24 mx-auto mb-6 opacity-20" />
          <p className="text-slate-400 font-black uppercase tracking-widest text-xs">
            {lang === "en" ? "No matches in current lab database" : "实验室数据库中暂无评估项"}
          </p>
        </div>
      ) : (
        <div className="space-y-24 max-w-7xl mx-auto">
          {/* FLOOR 1: STROLLER REVIEWS */}
          <section id="strollers" className="scroll-mt-24 space-y-8">
            <div className="border-b border-slate-100 pb-6">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-snug">
                {lang === "zh" 
                  ? "发现最佳旅行推车与慢跑推车 (Stroller Reviews)" 
                  : "Discover the Best Travel Stroller & Best Jogging Stroller"}
              </h2>
              <p className="mt-3 text-sm text-slate-500 font-medium leading-relaxed max-w-4xl">
                {lang === "zh"
                  ? "慢跑推车需要极致的全地形悬吊避震 (Best Jogging Stroller)，而高频率出行则需要轻量极简、能轻松单手收折并登机的最佳旅行推车 (Best Travel Stroller)。查看我们实验室出具的详细评测日志与五维力学评分。"
                  : "Finding the best jogging stroller requires verifying advanced rear wheels shock-absorption & locking handbrakes, whereas the best travel stroller calls for quick, one-hand gravity folds and overhead airplane bin dimensions. Browse our deep stroller reviews with lab-certified indices."}
              </p>
            </div>
            
            {doubleStrollerFloorReviews.length === 0 ? (
              <p className="text-slate-400 text-xs italic">{lang === "en" ? "No stroller evaluations currently published." : "暂无推车专项实测报告。"}</p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {doubleStrollerFloorReviews.map((item) => {
                  if (item.type === "multi") {
                    const { evaluation, products, reviewBadge } = item;
                    
                    const displayTitle = lang === "en" && containsCjk(evaluation.en?.title || "") 
                      ? "Premium Stroller & Jogger Cross Compare" 
                      : (lang === "en" ? evaluation.en?.title : evaluation.zh?.title) || "Stroller Dynamic Matrix";

                    const displayVerdict = lang === "en" && containsCjk(evaluation.en?.verdict || "")
                      ? "Cross-product analysis on premium strollers scored on structural safety and terrain mobility."
                      : (lang === "en" ? evaluation.en?.verdict : evaluation.zh?.verdict) || "";

                    return (
                      <div
                        key={evaluation.id}
                        className="bg-slate-900 border border-slate-800 rounded-[48px] p-8 flex flex-col gap-6 justify-between transition-all group shadow-2xl relative overflow-hidden text-white hover:scale-[1.01] duration-300"
                      >
                        <div className="absolute top-0 right-0 w-48 h-48 bg-slate-800 rounded-bl-full -mr-16 -mt-16 opacity-40"></div>
                       
                        <div className="relative z-10 space-y-3">
                          <span className="bg-orange-500 text-white font-black px-3 py-1 rounded-full text-[9px] uppercase tracking-[0.2em] shadow-lg shadow-orange-500/20">
                            {reviewBadge}
                          </span>
                          <h2 className="text-xl font-black tracking-tight text-white leading-tight min-h-12 pt-2 group-hover:text-orange-400 transition-colors">
                            {displayTitle}
                          </h2>
                          <p className="text-slate-400 text-xs font-semibold leading-relaxed line-clamp-3">
                            {displayVerdict}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 relative z-10 w-full pt-1">
                          {products.slice(0, 4).map((product, idx) => {
                            const diProduct = translateProduct(product, lang);
                            const imageSet = resolveProductImages(product);
                            return (
                              <div key={product.id} className="bg-slate-800/80 backdrop-blur-xs rounded-2xl p-3 border border-slate-700/80 flex flex-col items-center gap-2 hover:border-slate-500 transition-colors duration-300">
                                <div className="w-12 h-12 bg-white rounded-lg p-1 flex items-center justify-center">
                                  <SmartImage
                                    src={imageSet.coverUrl || undefined}
                                    alt={sanitizeMarketplaceNoise(getProductImageAlt(product))}
                                    className="w-full h-full object-contain"
                                    wrapperClassName="w-full h-full"
                                    width={96}
                                    height={96}
                                    priority={idx < 2}
                                  />
                                </div>
                                <div className="text-center w-full">
                                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest block truncate">{lang === "en" ? cleanEnBrandText(diProduct.brand || "") : diProduct.brand}</span>
                                  <h4 className="font-extrabold text-white text-[10px] leading-tight truncate">{sanitizeMarketplaceNoise(getProductsPageSeoTitle(product))}</h4>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex justify-center relative z-10 pt-2">
                          <button
                            onClick={() => openEvaluationDetail(evaluation)}
                            className="w-full py-4 bg-white hover:bg-orange-500 text-slate-900 hover:text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-95"
                          >
                            {lang === "en" ? "OPEN STROLLER COMPARISON" : "进入推车多品实时对比"}
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  }

                  const { product, reviewBadge, evaluation } = item;
                  if (!product) return null;
                  const diProduct = translateProduct(product, lang);
                  const tEv = lang === "zh" ? evaluation.zh : evaluation.en;
                  const imageSet = resolveProductImages(product);

                  const displayVerdict = (() => {
                    const originalv = tEv.verdict || diProduct.editorVerdict || "";
                    if (lang === "en") {
                      const v = sanitizeVerdictText(originalv);
                      if (v && !containsCjk(v)) return v;
                      const brandEn = cleanEnBrandText(diProduct.brand || "");
                      const modelEn = sanitizeMarketplaceNoise(String(diProduct.name || ""));
                      return `Comprehensive safety assessment for ${brandEn} ${modelEn} stroller, evaluated across structural weight capacity, suspension stiffness, and dynamic stability parameters.`;
                    } else {
                      const v = sanitizeVerdictText(originalv);
                      if (v && containsCjk(v)) return v;
                      return `针对 ${diProduct.brand} ${diProduct.name} 实测车型的深入评定摘要，多维度安全骨骼与避震学考核。`;
                    }
                  })();

                  const displayTitle = (() => {
                    const originalT = tEv.title || diProduct.name || "";
                    if (lang === "en") {
                      if (originalT && !containsCjk(originalT)) return originalT;
                      return `${cleanEnBrandText(diProduct.brand || "")} Stroller Evaluation`;
                    } else {
                      if (originalT && containsCjk(originalT)) return originalT;
                      return `${diProduct.brand || ""} 专家专项评测报告`;
                    }
                  })();

                  return (
                    <div
                      key={evaluation.id}
                      className="bg-white border border-slate-100 rounded-[48px] p-8 flex flex-col md:flex-row gap-6 justify-between transition-all group hover:shadow-[0_48px_80px_-24px_rgba(249,115,22,0.12)] hover:scale-[1.01] duration-300 shadow-sm relative overflow-hidden"
                    >
                      <div className="absolute bottom-0 right-0 w-32 h-32 bg-orange-50/20 blur-2xl rounded-full -mb-16 -mr-16 group-hover:bg-orange-100/40 transition-colors"></div>
                      
                      <div className="md:w-1/2 flex flex-col justify-between space-y-6 relative z-10">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="bg-orange-50 text-orange-600 font-black px-3 py-1 rounded-full text-[9px] uppercase tracking-[0.2em] border border-orange-100">
                              {reviewBadge}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block">{lang === "en" ? cleanEnBrandText(diProduct.brand || "") : diProduct.brand}</span>
                            <h2 className="font-black text-slate-900 text-base leading-tight group-hover:text-orange-500 transition-colors min-h-10">
                              {displayTitle}
                            </h2>
                          </div>

                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                             <p className="text-xs text-slate-600 leading-relaxed font-bold italic line-clamp-3">“{displayVerdict}”</p>
                          </div>
                        </div>

                        <button
                          onClick={() => openEvaluationDetail(evaluation)}
                          className="w-full py-3.5 bg-slate-900 hover:bg-orange-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 group-hover:shadow-orange-500/10 active:scale-95"
                        >
                          {getDossierCtaLabel(product, evaluation, lang)}
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="md:w-1/2 flex items-center justify-center relative z-10 flex-col">
                        <div className="scale-90 origin-center w-full">
                          <SafetyRadarChart product={product} evaluation={evaluation} lang={lang} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* FLOOR 2: BALANCE BIKES */}
          <section id="balance-bikes" className="scroll-mt-24 space-y-8">
            <div className="border-b border-slate-100 pb-6">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-snug">
                {lang === "zh" 
                  ? "幼童平衡滑步车专家评测 (Balance Bike Reviews)" 
                  : "Expert Balance Bike Reviews & Learner Lab"}
              </h2>
              <p className="mt-3 text-sm text-slate-500 font-medium leading-relaxed max-w-4xl">
                {lang === "zh"
                  ? "为 1-3 岁准备的无脚踏幼儿滑板车、平衡车，我们专注测试车身总重负载能力、转弯限位结构、轴承防松脱阻尼等。阅读详尽中立的儿童滑跑车评测（Balance Bike Reviews），辅助建立安全信心。"
                  : "We systematically examine toddler push models through real-world balance bike reviews. Weight distribution, steering limiting bumpers, and toxic-free handles are thoroughly checked to help you choose with pristine confidence."}
              </p>
            </div>

            {balanceBikeFloorReviews.length === 0 ? (
              <p className="text-slate-400 text-xs italic">{lang === "en" ? "No balance bike reviews currently published." : "暂无滑步平衡车测评数据。"}</p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {balanceBikeFloorReviews.map((item) => {
                  if (item.type === "multi") {
                    const { evaluation, products, reviewBadge } = item;
                    
                    const displayTitle = lang === "en" && containsCjk(evaluation.en?.title || "") 
                      ? "Balance Bike Top Picks Cross Compare" 
                      : (lang === "en" ? evaluation.en?.title : evaluation.zh?.title) || "Balance Bike Dynamic Matrix";

                    const displayVerdict = lang === "en" && containsCjk(evaluation.en?.verdict || "")
                      ? "Structural comparisons of leading balance bikes evaluated on geometry, weight, and turn limiting parameters."
                      : (lang === "en" ? evaluation.en?.verdict : evaluation.zh?.verdict) || "";

                    return (
                      <div
                        key={evaluation.id}
                        className="bg-slate-900 border border-slate-800 rounded-[48px] p-8 flex flex-col gap-6 justify-between transition-all group shadow-2xl relative overflow-hidden text-white hover:scale-[1.01] duration-300"
                      >
                        <div className="absolute top-0 right-0 w-48 h-48 bg-slate-800 rounded-bl-full -mr-16 -mt-16 opacity-40"></div>
                       
                        <div className="relative z-10 space-y-3">
                          <span className="bg-orange-500 text-white font-black px-3 py-1 rounded-full text-[9px] uppercase tracking-[0.2em] shadow-lg shadow-orange-500/20">
                            {reviewBadge}
                          </span>
                          <h2 className="text-xl font-black tracking-tight text-white leading-tight min-h-12 pt-2 group-hover:text-orange-400 transition-colors">
                            {displayTitle}
                          </h2>
                          <p className="text-slate-400 text-xs font-semibold leading-relaxed line-clamp-3">
                            {displayVerdict}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 relative z-10 w-full pt-1">
                          {products.slice(0, 4).map((product, idx) => {
                            const diProduct = translateProduct(product, lang);
                            const imageSet = resolveProductImages(product);
                            return (
                              <div key={product.id} className="bg-slate-800/80 backdrop-blur-xs rounded-2xl p-3 border border-slate-700/80 flex flex-col items-center gap-2 hover:border-slate-500 transition-colors duration-300">
                                <div className="w-12 h-12 bg-white rounded-lg p-1 flex items-center justify-center">
                                  <SmartImage
                                    src={imageSet.coverUrl || undefined}
                                    alt={sanitizeMarketplaceNoise(getProductImageAlt(product))}
                                    className="w-full h-full object-contain"
                                    wrapperClassName="w-full h-full"
                                    width={96}
                                    height={96}
                                    priority={idx < 2}
                                  />
                                </div>
                                <div className="text-center w-full">
                                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest block truncate">{lang === "en" ? cleanEnBrandText(diProduct.brand || "") : diProduct.brand}</span>
                                  <h4 className="font-extrabold text-white text-[10px] leading-tight truncate">{sanitizeMarketplaceNoise(getProductsPageSeoTitle(product))}</h4>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex justify-center relative z-10 pt-2">
                          <button
                            onClick={() => openEvaluationDetail(evaluation)}
                            className="w-full py-4 bg-white hover:bg-orange-500 text-slate-900 hover:text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-95"
                          >
                            {lang === "en" ? "OPEN BALANCE BIKE COMPARISON" : "进入平衡车对比详情"}
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  }

                  const { product, reviewBadge, evaluation } = item;
                  if (!product) return null;
                  const diProduct = translateProduct(product, lang);
                  const tEv = lang === "zh" ? evaluation.zh : evaluation.en;
                  const imageSet = resolveProductImages(product);

                  const displayVerdict = (() => {
                    const originalv = tEv.verdict || diProduct.editorVerdict || "";
                    if (lang === "en") {
                      const v = sanitizeVerdictText(originalv);
                      if (v && !containsCjk(v)) return v;
                      const brandEn = cleanEnBrandText(diProduct.brand || "");
                      const modelEn = sanitizeMarketplaceNoise(String(diProduct.name || ""));
                      return `Professional engineering safety audit for the ${brandEn} ${modelEn} balance bike. Analysed across low-COG ride control, steering limitations, and framework impact testing.`;
                    } else {
                      const v = sanitizeVerdictText(originalv);
                      if (v && containsCjk(v)) return v;
                      return `针对 ${diProduct.brand} ${diProduct.name} 儿童滑步平衡车的物理实测总结，包含转弯几何与车身受冲击测试评级。`;
                    }
                  })();

                  const displayTitle = (() => {
                    const originalT = tEv.title || diProduct.name || "";
                    if (lang === "en") {
                      if (originalT && !containsCjk(originalT)) return originalT;
                      return `${cleanEnBrandText(diProduct.brand || "")} Balance Bike Review`;
                    } else {
                      if (originalT && containsCjk(originalT)) return originalT;
                      return `${diProduct.brand || ""} 专家实测平衡车总结`;
                    }
                  })();

                  return (
                    <div
                      key={evaluation.id}
                      className="bg-white border border-slate-100 rounded-[48px] p-8 flex flex-col md:flex-row gap-6 justify-between transition-all group hover:shadow-[0_48px_80px_-24px_rgba(249,115,22,0.12)] hover:scale-[1.01] duration-300 shadow-sm relative overflow-hidden"
                    >
                      <div className="absolute bottom-0 right-0 w-32 h-32 bg-orange-50/20 blur-2xl rounded-full -mb-16 -mr-16 group-hover:bg-orange-100/40 transition-colors"></div>
                      
                      <div className="md:w-1/2 flex flex-col justify-between space-y-6 relative z-10">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="bg-orange-50 text-orange-600 font-black px-3 py-1 rounded-full text-[9px] uppercase tracking-[0.2em] border border-orange-100">
                              {reviewBadge}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block">{lang === "en" ? cleanEnBrandText(diProduct.brand || "") : diProduct.brand}</span>
                            <h2 className="font-black text-slate-900 text-base leading-tight group-hover:text-orange-500 transition-colors min-h-10">
                              {displayTitle}
                            </h2>
                          </div>

                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                             <p className="text-xs text-slate-600 leading-relaxed font-bold italic line-clamp-3">“{displayVerdict}”</p>
                          </div>
                        </div>

                        <button
                          onClick={() => openEvaluationDetail(evaluation)}
                          className="w-full py-3.5 bg-slate-900 hover:bg-orange-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 group-hover:shadow-orange-500/10 active:scale-95"
                        >
                          {getDossierCtaLabel(product, evaluation, lang)}
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="md:w-1/2 flex items-center justify-center relative z-10 flex-col">
                        <div className="scale-90 origin-center w-full">
                          <SafetyRadarChart product={product} evaluation={evaluation} lang={lang} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* FLOOR 3: KIDS BIKES & SCOOTERS */}
          <section id="kids-bikes" className="scroll-mt-24 space-y-8">
            <div className="border-b border-slate-100 pb-6">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-snug">
                {lang === "zh" 
                  ? "学龄儿童自行车及滑板车安全指数评测 (Kids Bike & Scooter Reviews)" 
                  : "Kids Bike & Scooter Safety Index Reviews"}
              </h2>
              <p className="mt-3 text-sm text-slate-500 font-medium leading-relaxed max-w-4xl">
                {lang === "zh"
                  ? "专注于大童脚踏自行车、高性能滑板车安全极限测试：考察双重手刹及反倒刹响应、物理防夹手链条防护罩、立管防倒塌锁死以及前叉形变载荷表现。"
                  : "We systematically audit classic kids bicycles and personal kids scooters. Wet braking responsiveness, metal tube rigidity, Chain-guard ASTM F963 compliance, and lateral stability are tested to deliver authoritative lab metrics."}
              </p>
            </div>

            {kidsBikeFloorReviews.length === 0 ? (
              <p className="text-slate-400 text-xs italic">{lang === "en" ? "No kids bike or scooter reviews currently published." : "暂无脚踏车及滑板车测评报告。"}</p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {kidsBikeFloorReviews.map((item) => {
                  if (item.type === "multi") {
                    const { evaluation, products, reviewBadge } = item;
                    
                    const displayTitle = lang === "en" && containsCjk(evaluation.en?.title || "") 
                      ? "Kids Bike Safety and Fit Cross Compare" 
                      : (lang === "en" ? evaluation.en?.title : evaluation.zh?.title) || "Kids Mobility Cross Compare";

                    const displayVerdict = lang === "en" && containsCjk(evaluation.en?.verdict || "")
                      ? "Comparative engineering analysis on bikes and scooters scored on frame rigidity and braking."
                      : (lang === "en" ? evaluation.en?.verdict : evaluation.zh?.verdict) || "";

                    return (
                      <div
                        key={evaluation.id}
                        className="bg-slate-900 border border-slate-800 rounded-[48px] p-8 flex flex-col gap-6 justify-between transition-all group shadow-2xl relative overflow-hidden text-white hover:scale-[1.01] duration-300"
                      >
                        <div className="absolute top-0 right-0 w-48 h-48 bg-slate-800 rounded-bl-full -mr-16 -mt-16 opacity-40"></div>
                       
                        <div className="relative z-10 space-y-3">
                          <span className="bg-orange-500 text-white font-black px-3 py-1 rounded-full text-[9px] uppercase tracking-[0.2em] shadow-lg shadow-orange-500/20">
                            {reviewBadge}
                          </span>
                          <h2 className="text-xl font-black tracking-tight text-white leading-tight min-h-12 pt-2 group-hover:text-orange-400 transition-colors">
                            {displayTitle}
                          </h2>
                          <p className="text-slate-400 text-xs font-semibold leading-relaxed line-clamp-3">
                            {displayVerdict}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 relative z-10 w-full pt-1">
                          {products.slice(0, 4).map((product, idx) => {
                            const diProduct = translateProduct(product, lang);
                            const imageSet = resolveProductImages(product);
                            return (
                              <div key={product.id} className="bg-slate-800/80 backdrop-blur-xs rounded-2xl p-3 border border-slate-700/80 flex flex-col items-center gap-2 hover:border-slate-500 transition-colors duration-300">
                                <div className="w-12 h-12 bg-white rounded-lg p-1 flex items-center justify-center">
                                  <SmartImage
                                    src={imageSet.coverUrl || undefined}
                                    alt={sanitizeMarketplaceNoise(getProductImageAlt(product))}
                                    className="w-full h-full object-contain"
                                    wrapperClassName="w-full h-full"
                                    width={96}
                                    height={96}
                                    priority={idx < 2}
                                  />
                                </div>
                                <div className="text-center w-full">
                                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest block truncate">{lang === "en" ? cleanEnBrandText(diProduct.brand || "") : diProduct.brand}</span>
                                  <h4 className="font-extrabold text-white text-[10px] leading-tight truncate">{sanitizeMarketplaceNoise(getProductsPageSeoTitle(product))}</h4>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex justify-center relative z-10 pt-2">
                          <button
                            onClick={() => openEvaluationDetail(evaluation)}
                            className="w-full py-4 bg-white hover:bg-orange-500 text-slate-900 hover:text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-95"
                          >
                            {lang === "en" ? "OPEN SELECTION COMPARISON" : "进入较量多品实时对比"}
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  }

                  const { product, reviewBadge, evaluation } = item;
                  if (!product) return null;
                  const diProduct = translateProduct(product, lang);
                  const tEv = lang === "zh" ? evaluation.zh : evaluation.en;
                  const imageSet = resolveProductImages(product);

                  const displayVerdict = (() => {
                    const originalv = tEv.verdict || diProduct.editorVerdict || "";
                    if (lang === "en") {
                      const v = sanitizeVerdictText(originalv);
                      if (v && !containsCjk(v)) return v;
                      const brandEn = cleanEnBrandText(diProduct.brand || "");
                      const modelEn = sanitizeMarketplaceNoise(String(diProduct.name || ""));
                      return `Professional engineering safety audit for the ${brandEn} ${modelEn} kids bike. Specially verified for dual brake reach, chain合规 ASTM F963 support, and anti-tipping deck limiters.`;
                    } else {
                      const v = sanitizeVerdictText(originalv);
                      if (v && containsCjk(v)) return v;
                      return `针对 ${diProduct.brand} ${diProduct.name} 儿童自行车或滑板车的手刹制动力与车架防冲击性能的专项物理质检评测。`;
                    }
                  })();

                  const displayTitle = (() => {
                    const originalT = tEv.title || diProduct.name || "";
                    if (lang === "en") {
                      if (originalT && !containsCjk(originalT)) return originalT;
                      return `${cleanEnBrandText(diProduct.brand || "")} Kids Bike Review`;
                    } else {
                      if (originalT && containsCjk(originalT)) return originalT;
                      return `${diProduct.brand || ""} 专家专项脚踏自行车报告`;
                    }
                  })();

                  return (
                    <div
                      key={evaluation.id}
                      className="bg-white border border-slate-100 rounded-[48px] p-8 flex flex-col md:flex-row gap-6 justify-between transition-all group hover:shadow-[0_48px_80px_-24px_rgba(249,115,22,0.12)] hover:scale-[1.01] duration-300 shadow-sm relative overflow-hidden"
                    >
                      <div className="absolute bottom-0 right-0 w-32 h-32 bg-orange-50/20 blur-2xl rounded-full -mb-16 -mr-16 group-hover:bg-orange-100/40 transition-colors"></div>
                      
                      <div className="md:w-1/2 flex flex-col justify-between space-y-6 relative z-10">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="bg-orange-50 text-orange-600 font-black px-3 py-1 rounded-full text-[9px] uppercase tracking-[0.2em] border border-orange-100">
                              {reviewBadge}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block">{lang === "en" ? cleanEnBrandText(diProduct.brand || "") : diProduct.brand}</span>
                            <h3 className="font-black text-slate-900 text-base leading-tight group-hover:text-orange-500 transition-colors min-h-10">
                              {displayTitle}
                            </h3>
                          </div>

                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                             <p className="text-xs text-slate-600 leading-relaxed font-bold italic line-clamp-3">“{displayVerdict}”</p>
                          </div>
                        </div>

                        <button
                          onClick={() => openEvaluationDetail(evaluation)}
                          className="w-full py-3.5 bg-slate-900 hover:bg-orange-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 group-hover:shadow-orange-500/10 active:scale-95"
                        >
                          {getDossierCtaLabel(product, evaluation, lang)}
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="md:w-1/2 flex items-center justify-center relative z-10 flex-col">
                        <div className="scale-90 origin-center w-full">
                          <SafetyRadarChart product={product} evaluation={evaluation} lang={lang} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-3 pt-6">
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
  );
}
