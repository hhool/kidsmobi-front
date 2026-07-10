import { 
  Award,
  ShieldCheck, 
  Scale, 
  Star,
  Zap,
  ArrowRight,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Product, CurrencyData } from "../types";
import { translations, translateProduct } from "../lib/translate";
import { SCRAPED_CATEGORY_CATALOG } from "../config/scrapedCategoryCatalog";
import { resolveProductImages, FALLBACK_PRODUCT_IMAGE } from "../lib/productImages";
import { clearJsonLd, setCollectionPageJsonLd } from "../lib/seoJsonLd";
import SeoKeywordPanel from "./common/SeoKeywordPanel";

const KIDS_BIKE_CATEGORY_DEFAULT_IMAGE =
  "https://store.poki2.online/kids_bikes/JOYSTAR/Rank_1_ASIN_B08Q7TMRWR_JOYSTAR%20Little%20Daisy%20Kids%20Bike%20for%20Girls%20Boys%20Ages/images/primary.jpg";

interface HomeSectionProps {
  productsData: Product[];
  onSelectProduct: (p: Product) => void;
  setActiveTab: (tab: any) => void;
  childProfile: any;
  setChildProfile: (p: any) => void;
  onSelectCategory: (categoryId: string) => void;
  lang?: "zh" | "en";
  currencyData: CurrencyData;
}

type ImageLoadState = {
  loaded: boolean;
  failed: boolean;
  fallback: boolean;
  retryCount: number;
};

export default function HomeSection({
  productsData,
  onSelectProduct,
  setActiveTab,
  childProfile,
  setChildProfile,
  onSelectCategory,
  lang = "zh",
  currencyData
}: HomeSectionProps) {

  const categoryAliasMap: Record<string, string[]> = {
    stroller: ["stroller"],
    double_stroller: ["double_stroller", "double stroller"],
    jogger_stroller: ["jogger_stroller", "jogging stroller"],
    balance_bike: ["balance_bike", "balance", "balance bike"],
    kids_bikes: ["kids_bikes", "bikes", "bike", "kids bike"],
    kids_tricycles: ["kids_tricycles", "tricycle", "tricycles"],
    scooters: ["scooters", "scooter"],
    electric_vehicles: ["electric_vehicles", "electric", "ev"],
    car_seat: ["car_seat", "car seat"],
  };

  const normalizeCategory = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "_");
  const isStrictKidsBikeProduct = (product: Product) => {
    const category = normalizeCategory(product.category || "");
    const categoryId = normalizeCategory(product.categoryId || "");
    const searchable = normalizeCategory([product.category, product.categoryId, product.name, product.brand].filter(Boolean).join(" "));
    if (searchable.includes("mountain") || searchable.includes("dirt") || searchable.includes("balance") || searchable.includes("electric")) {
      return false;
    }
    return category === "kids_bikes" || category === "kids_bike" || categoryId === "kids_bikes" || categoryId === "kids_bike";
  };
  
  const t = translations[lang];
  const [imageLoadState, setImageLoadState] = useState<Record<string, ImageLoadState>>({});

  const resolveStableImageSrc = (imageKey: string, sourceUrl: string) => {
    const state = imageLoadState[imageKey];
    if (state?.fallback) {
      return FALLBACK_PRODUCT_IMAGE;
    }
    const safeSource = sourceUrl || FALLBACK_PRODUCT_IMAGE;
    if ((state?.retryCount || 0) > 0 && safeSource !== FALLBACK_PRODUCT_IMAGE) {
      const separator = safeSource.includes("?") ? "&" : "?";
      return `${safeSource}${separator}retry=${state?.retryCount}`;
    }
    return safeSource;
  };

  const handleCardImageLoad = (imageKey: string) => {
    setImageLoadState((prev) => ({
      ...prev,
      [imageKey]: {
        ...(prev[imageKey] || { retryCount: 0 }),
        loaded: true,
        failed: false,
        fallback: false,
      },
    }));
  };

  const handleCardImageError = (imageKey: string, sourceUrl: string) => {
    setImageLoadState((prev) => {
      const current = prev[imageKey] || { loaded: false, failed: false, fallback: false, retryCount: 0 };
      if (current.retryCount < 1 && sourceUrl && sourceUrl !== FALLBACK_PRODUCT_IMAGE) {
        return {
          ...prev,
          [imageKey]: {
            ...current,
            loaded: false,
            failed: false,
            fallback: false,
            retryCount: current.retryCount + 1,
          },
        };
      }
      return {
        ...prev,
        [imageKey]: {
          ...current,
          loaded: true,
          failed: true,
          fallback: true,
        },
      };
    });
  };

  const scrapedCategoryCards = useMemo(() => {
    return SCRAPED_CATEGORY_CATALOG.slice(0, 8).map((entry) => ({
      ...entry,
      label: lang === "zh" ? entry.zh : entry.en,
    }));
  }, [lang]);

  const categoryTopProductMap = useMemo(() => {
    const map: Record<string, Product> = {};
    for (const entry of SCRAPED_CATEGORY_CATALOG) {
      const aliases = categoryAliasMap[entry.id] || [entry.id];
      const found = productsData.find((product) => {
        const normalized = normalizeCategory(product.category || "");
        return aliases.some((alias) => normalized.includes(normalizeCategory(alias)));
      });
      if (found) map[entry.id] = found;
    }
    return map;
  }, [productsData]);

  const getCategoryPriority = (rawCategory?: string) => {
    const normalized = normalizeCategory(rawCategory || "");
    if (normalized.includes("stroller")) return 0;
    if (normalized.includes("balance")) return 1;
    return 2;
  };

  // Outstanding Selection (high scores)
  const topSelections = [...productsData]
    .filter(p => isStrictKidsBikeProduct(p))
    .sort((a, b) => {
      return (b.overallScore || 0) - (a.overallScore || 0);
    })
    .slice(0, 4);

  const prioritizedCategoryCards = useMemo(() => {
    const englishLabelOverrides: Record<string, string> = {
      jogger_stroller: "Jogging Stroller",
      kids_bikes: "Kids Bike",
      scooters: "Kids Scooter",
      kids_scooters: "Kids Scooter",
    };
    return SCRAPED_CATEGORY_CATALOG.filter(c => {
      const idStr = c.id.toLowerCase();
      if (idStr.includes("jogger")) return true;
      if (idStr.includes("balance")) return true;
      if (idStr.includes("scooter")) return true;
      if (idStr.includes("bike") && !idStr.includes("balance")) return true;
      return false;
    }).slice(0, 4).map((entry) => ({
      ...entry,
      label: lang === "zh" ? entry.zh : englishLabelOverrides[entry.id] || entry.en,
    }));
  }, [lang]);

  const annualAwards = [
    { 
      type: "stroller", 
      label: lang === "zh" ? "慢跑推车精选" : "Jogging Stroller Pick", 
      winner: productsData.find(p => {
        const cat = normalizeCategory(p.category || "");
        return cat.includes("jogger") || cat.includes("jogging");
      })
    },
    { 
      type: "balance", 
      label: lang === "zh" ? "平衡车精选" : "Balance Bike Pick", 
      winner: productsData.find(p => p.category === "balance") 
    },
    { 
      type: "value", 
      label: lang === "zh" ? "儿童滑板车精选" : "Kids Scooter Pick", 
      winner: [...productsData]
        .filter(p => normalizeCategory(p.category || "").includes("scooter"))
        .sort((a, b) => a.price - b.price)[0]
    }
  ];

  useEffect(() => {
    const canonicalUrl = window.location.origin + "/";
    const homepageItems = [
      ...topSelections.slice(0, 4).map((product) => ({
        name: translateProduct(product, lang).name,
        url: canonicalUrl,
      })),
      ...prioritizedCategoryCards.slice(0, 4).map((category) => ({
        name: category.label,
        url: canonicalUrl,
      })),
    ];

    setCollectionPageJsonLd("home-list", {
      name: lang === "zh" ? "KIDSMOBI 首页" : "KIDSMOBI Home",
      url: canonicalUrl,
      items: homepageItems,
    });

    return () => clearJsonLd("home-list");
  }, [lang, topSelections, prioritizedCategoryCards]);

  return (
    <div id="home_layout" className="space-y-24 pb-20">
      <h1 className="sr-only">
        {lang === "zh"
          ? "stroller、jogging stroller、balance bike 与 kids scooter 科学选购平台"
          : "Balance Bike, Jogging Stroller, Kids Bike and Kids Scooter Review Platform"}
      </h1>
      
      {/* 1. Slogan Banner (Brand Identity) */}
      <section className="relative rounded-[48px] bg-white border border-slate-100 overflow-hidden p-10 sm:p-20 text-center max-w-7xl mx-auto shadow-2xl">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,247,237,0.92),rgba(255,255,255,0.88)_45%,rgba(236,253,245,0.55))]"></div>
        <div className="relative z-10 space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-50 border border-orange-100 text-orange-600 text-[10px] font-black uppercase tracking-widest rounded-full">
            <ShieldCheck className="w-4 h-4" />
            {lang === "zh" ? "全链路安全实验室审计" : "END-TO-END SAFETY AUDIT"}
          </div>
          <h2 className="text-4xl sm:text-6xl font-black text-slate-950 tracking-tight leading-tight">
            {lang === "zh" ? "客观科学评测" : "Balance Bike & Jogging Stroller Reviews,"} <br />
            <span className="text-orange-500">{lang === "zh" ? "您的信心之选" : "Your Confident Choice"}</span>
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto leading-relaxed font-medium">
            {lang === "zh" 
              ? "KIDSMOBI 是全球领先的高端童车垂直评测平台，通过力学公式与数千小时的实测，协助家长完成每一个理性的消费决策。"
              : "KIDSMOBI helps families compare balance bike, jogging stroller, kids bike, toddler bike, kids scooter, and kids electric bike options with practical how to choose a baby stroller guidance."}
          </p>
          {lang === "en" && (
            <SeoKeywordPanel
              variant="orange"
              columns="four"
              align="left"
              className="max-w-3xl mx-auto pt-2 text-left"
              keywords={[
                "balance bike review",
                "jogging stroller review",
                "kids bike guide",
                "toddler bike fit",
                "kids scooter pick",
                "kids electric bike",
                "baby stroller guide",
                "foldable electric scooter",
              ]}
            />
          )}
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            {['ISO 8098', 'CPSC', 'EN 71', 'GB-14746'].map(cert => (
              <span key={cert} className="px-4 py-2 bg-white/80 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-500 uppercase tracking-widest shadow-sm">{cert}</span>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Annual Rankings (权威榜单) */}
      <section className="max-w-7xl mx-auto px-6 space-y-12">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <span className="text-[10px] text-orange-500 font-black uppercase tracking-[0.2em]">{lang === "zh" ? "权威发布" : "Annual Authority"}</span>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{lang === "zh" ? "2026 年度童车大奖" : "2026 Annual Awards"}</h3>
          </div>
          <button
            onClick={() => setActiveTab("evaluations")}
            className="text-sm font-black text-slate-400 hover:text-orange-500 transition-colors uppercase tracking-widest"
          >
            {lang === "zh" ? "查看完整榜单" : "Full Rankings"}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {annualAwards.map((award, idx) => (
            <div key={idx} className="h-full min-h-90 bg-white border border-slate-100 rounded-[40px] overflow-hidden hover:shadow-2xl hover:shadow-slate-200/50 transition-all cursor-pointer group flex flex-col">
              <div className="relative h-44">
                {(() => {
                  const imageKey = `award-${idx}`;
                  const sourceUrl = award.winner ? resolveProductImages(award.winner).coverUrl : FALLBACK_PRODUCT_IMAGE;
                  const state = imageLoadState[imageKey];
                  return (
                    <>
                <img
                  src={resolveStableImageSrc(imageKey, sourceUrl)}
                  alt={award.winner ? translateProduct(award.winner, lang).name : award.label}
                  onLoad={() => handleCardImageLoad(imageKey)}
                  onError={() => handleCardImageError(imageKey, sourceUrl)}
                  className="w-full h-full object-contain p-4 bg-white transition-transform duration-500 group-hover:scale-105"
                />
                      {!state?.loaded && (
                        <div className="absolute inset-0 animate-pulse bg-linear-to-r from-slate-200 via-slate-100 to-slate-200" />
                      )}
                      {state?.failed && (
                        <span className="absolute bottom-3 left-3 px-2 py-1 rounded-md bg-slate-900/80 text-white text-[10px] font-bold">
                          {lang === "zh" ? "已回退占位图" : "Fallback active"}
                        </span>
                      )}
                    </>
                  );
                })()}
                <div className="absolute inset-0 bg-linear-to-t from-slate-950/70 via-slate-900/10 to-transparent" />
                <div className="absolute top-4 left-4 p-3 bg-white/85 rounded-xl backdrop-blur-sm border border-white/70">
                  <Award className="w-6 h-6 text-orange-500" />
                </div>
                <span className="absolute top-4 right-4 text-white/80 font-black text-4xl group-hover:text-orange-200 transition-colors italic">0{idx+1}</span>
              </div>
              <div className="p-7 space-y-5 bg-linear-to-b from-white to-slate-50/70 flex-1 flex flex-col">
                <div className="space-y-2 min-h-20">
                <h4 className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">{award.label}</h4>
                <p className="text-xl font-black text-slate-900 group-hover:text-orange-500 transition-colors">{award.winner ? translateProduct(award.winner, lang).name : "Evaluating..."}</p>
                </div>
                <button 
                  onClick={() => {
                    if (award.winner) {
                      onSelectProduct(award.winner);
                      return;
                    }
                    setActiveTab("evaluations");
                  }}
                  className="w-full py-4 bg-slate-900 hover:bg-orange-500 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 mt-auto"
                >
                  {lang === "zh" ? "查看详细评测" : "Read Evaluation"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Featured Evaluations (热门精选评测) */}
      <section className="bg-slate-50 py-24">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-4">
            <h3 className="text-4xl font-black text-slate-900 tracking-tight">{lang === "zh" ? "深度评测专题" : "Featured Evaluations"}</h3>
            <p className="text-slate-500 font-medium">{lang === "zh" ? "从结构稳定到骑行舒适，我们把关键差异讲清楚再给结论。" : "From structural stability to ride comfort, we explain the differences before giving a verdict."}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { id: "single", icon: Star, label: lang === "zh" ? "精品实测" : "Single Review", color: "orange", path: "/reviews/single" },
              { id: "compare", icon: Scale, label: lang === "zh" ? "热门横评" : "Comparison", color: "blue", path: "/reviews/compare" },
              { id: "new", icon: Zap, label: lang === "zh" ? "新品速递" : "New Arrival", color: "emerald", path: "/news/page/1" },
              { id: "avoid", icon: ShieldCheck, label: lang === "zh" ? "避坑指南" : "Safe Pick", color: "rose", path: "/reviews/safety" },
            ].map(cat => (
              <div 
                key={cat.id} 
                onClick={() => {
                  window.history.pushState(null, "", cat.path);
                  window.dispatchEvent(new PopStateEvent("popstate"));
                }}
                className="h-full min-h-55 bg-white p-8 rounded-4xl border border-slate-100 hover:border-orange-500/30 hover:shadow-xl transition-all cursor-pointer group text-center flex flex-col justify-center gap-4"
              >
                <div className={`mx-auto w-16 h-16 bg-${cat.color}-50 rounded-2xl flex items-center justify-center text-${cat.color}-500 group-hover:scale-110 transition-transform`}>
                  <cat.icon className="w-8 h-8" />
                </div>
                <span className="block font-black text-slate-900 text-lg">{cat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Category Launchpad (品类入口) */}
      <section className="max-w-7xl mx-auto px-6 space-y-10">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <span className="text-[10px] text-orange-500 font-black uppercase tracking-[0.2em]">
              {lang === "zh" ? "精选品类" : "Category Highlights"}
            </span>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">
              {lang === "zh" ? "热门品类快速直达" : "Popular Category Launchpad"}
            </h3>
            <p className="text-slate-500 font-medium">
              {lang === "zh"
                ? "围绕真实出行场景整理的品类入口，帮助你更快锁定候选方向。"
                : "Category cards curated around real mobility scenarios to help you narrow down options faster."}
            </p>
          </div>
          <button
            onClick={() => setActiveTab("products")}
            className="text-sm font-black text-slate-400 hover:text-orange-500 transition-colors uppercase tracking-widest"
          >
            {lang === "zh" ? "进入产品中心" : "Open Product Center"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {prioritizedCategoryCards.map((cat) => (
            <div
              key={cat.id}
              onClick={() => {
                onSelectCategory(cat.id);
                setActiveTab("products");
              }}
              className="group h-full min-h-90 bg-white border border-slate-100 rounded-[32px] overflow-hidden hover:border-orange-500/40 hover:shadow-2xl hover:shadow-orange-100/70 transition-all duration-300 flex flex-col cursor-pointer"
            >
              <div className="relative h-50 bg-slate-50">
                {(() => {
                  const imageKey = `category-${cat.id}`;
                  const topProduct = categoryTopProductMap[cat.id];
                  const sourceUrl = cat.id === "kids_bikes"
                    ? KIDS_BIKE_CATEGORY_DEFAULT_IMAGE
                    : topProduct
                      ? resolveProductImages(topProduct).coverUrl
                      : FALLBACK_PRODUCT_IMAGE;
                  const state = imageLoadState[imageKey];
                  return (
                    <>
                      <img
                        src={resolveStableImageSrc(imageKey, sourceUrl)}
                        alt={cat.label}
                        onLoad={() => handleCardImageLoad(imageKey)}
                        onError={() => handleCardImageError(imageKey, sourceUrl)}
                        className="w-full h-full object-contain p-5 transition-transform duration-500 group-hover:scale-[1.08]"
                      />
                      {!state?.loaded && (
                        <div className="absolute inset-0 animate-pulse bg-linear-to-r from-slate-200 via-slate-100 to-slate-200" />
                      )}
                    </>
                  );
                })()}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-white via-white/88 to-transparent" />
                <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] bg-white/90 text-orange-600 font-black uppercase backdrop-blur-sm border border-orange-100 shadow-sm">
                  {lang === "zh" ? "精选" : "Featured"}
                </span>
              </div>

              <div className="p-6 bg-white flex-1 flex flex-col gap-4">
                <div className="space-y-2">
                  <h4 className="text-slate-950 font-black text-xl leading-tight">{cat.label}</h4>
                  <p className="text-sm text-slate-500 font-semibold">
                    {lang === "zh" ? `当前参考 ${cat.itemCount} 款高相关产品` : `${cat.itemCount} curated picks for this scenario`}
                  </p>
                </div>
                <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-[10px] font-black uppercase text-slate-400">
                    {lang === "zh" ? "品类入口" : "Category"}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Hot Products (热门产品) */}
      <section className="max-w-7xl mx-auto px-6 space-y-12">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <span className="text-[10px] text-orange-500 font-black uppercase tracking-[0.2em]">{lang === "zh" ? "社区热选" : "Trending Now"}</span>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{lang === "zh" ? "实验室推荐单品" : "Highly Rated Kids Rides"}</h3>
          </div>
          <button 
            onClick={() => setActiveTab("products")}
            className="flex items-center gap-2 text-sm font-black text-slate-400 hover:text-orange-500 transition-colors uppercase tracking-widest"
          >
            {lang === "zh" ? "进入库" : "View Products"} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {topSelections.map(p => {
             const dp = translateProduct(p, lang);
             return (
               <div 
                key={p.id} 
                onClick={() => onSelectProduct(p)}
                className="group h-full min-h-90 cursor-pointer bg-white rounded-4xl border border-slate-100 overflow-hidden hover:shadow-2xl transition-all flex flex-col"
               >
                 <div className="relative h-52 bg-slate-50 overflow-hidden">
                    {(() => {
                      const imageKey = `product-${p.id}`;
                      const sourceUrl = resolveProductImages(p).coverUrl;
                      const state = imageLoadState[imageKey];
                      return (
                        <>
                    <img
                      src={resolveStableImageSrc(imageKey, sourceUrl)}
                      alt={dp.name}
                      onLoad={() => handleCardImageLoad(imageKey)}
                      onError={() => handleCardImageError(imageKey, sourceUrl)}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                          {!state?.loaded && (
                            <div className="absolute inset-0 animate-pulse bg-linear-to-r from-slate-200 via-slate-100 to-slate-200" />
                          )}
                          {state?.failed && (
                            <span className="absolute bottom-3 left-3 px-2 py-1 rounded-md bg-slate-900/80 text-white text-[10px] font-bold">
                              {lang === "zh" ? "已回退占位图" : "Fallback active"}
                            </span>
                          )}
                        </>
                      );
                    })()}
                 </div>
                 <div className="p-6 space-y-4 flex-1 flex flex-col">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest">{dp.brand}</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-orange-500 text-orange-500" />
                        <span className="text-xs font-black">{dp.overallScore}</span>
                      </div>
                    </div>
                    <h4 className="font-black text-slate-900 group-hover:text-orange-500 transition-colors line-clamp-2 min-h-12">{dp.name}</h4>
                    <p className="text-[10px] text-slate-500 font-medium line-clamp-3 leading-relaxed min-h-12">“{dp.editorVerdict}”</p>
                 </div>
               </div>
             );
          })}
        </div>
      </section>

      {/* 6. Buying Guide Quick Links (选购指南快捷入口) */}
      <section className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="space-y-2 text-center max-w-2xl mx-auto">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{lang === "zh" ? "智能选购场景" : "Quick Selection Scenarios"}</h3>
            <p className="text-slate-500 font-medium">{lang === "zh" ? "从成长阶段出发，为您快速匹配最佳方案。" : "Find the perfect match based on your child's growth stage."}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { id: "newborn", label: lang === "zh" ? "新生儿(0-12月) · 出行安全" : "Newborn Mobility", desc: lang === "zh" ? "侧重减震与中轴枢纽强度" : "Focus on shock absorption" },
              { id: "outdoor", label: lang === "zh" ? "户外郊游 · 越野专家" : "Outdoor Experts", desc: lang === "zh" ? "轮组抓地力与通过性专项评测" : "Grip and terrain testing" },
              { id: "commute", label: lang === "zh" ? "日常通勤 · 轻便首选" : "Daily Commute", desc: lang === "zh" ? "折叠速度与整备质量极限对比" : "Weight and folding speed" },
            ].map(scene => (
              <div key={scene.id} onClick={() => setActiveTab("guides")} className="p-8 bg-white border border-slate-100 rounded-4xl hover:border-orange-500 hover:shadow-xl transition-all cursor-pointer group">
                <h4 className="font-black text-slate-900 group-hover:text-orange-500 transition-colors mb-2">{scene.label}</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">{scene.desc}</p>
              </div>
            ))}
          </div>
      </section>
    </div>
  );
}
