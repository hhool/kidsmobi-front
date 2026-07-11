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
import { getProductImageAlt } from "../lib/productSeoText";
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

  const seoProductCards = useMemo(() => {
    const targets = [
      { key: "infans", title: "INFANS All-Terrain Jogging Stroller", snapshot: "Lab Snapshot: air-filled tire damping and frame-fold stability reviewed for daily jogging stroller use.", match: (product: Product) => normalizeCategory(`${product.brand} ${product.name}`).includes("infans") },
      { key: "jmmd", title: "JMMD Convertible Balance Bike", snapshot: "Lab Snapshot: conversion hardware, push-handle control, and balance bike fit range checked across toddler stages.", match: (product: Product) => normalizeCategory(`${product.brand} ${product.name}`).includes("jmmd") },
      { key: "glerc", title: "Glerc Rover 12\" Kids Bike", snapshot: "Lab Snapshot: tire width, braking response, and frame geometry reviewed for first-pedal kids bike control.", match: (product: Product) => normalizeCategory(`${product.brand} ${product.name}`).includes("glerc") && normalizeCategory(product.name).includes("rover") },
      { key: "green-mini", title: "Green Mini 3-Wheel Kids Scooter", snapshot: "Lab Snapshot: lean-to-steer response, deck stability, and wheel visibility checked for kids scooter handling.", match: (product: Product) => normalizeCategory(product.name).includes("green_mini") },
    ];
    return targets.map((target, index) => ({
      title: target.title,
      snapshot: target.snapshot,
      product: productsData.find(target.match) || topSelections[index] || topSelections[0],
    })).filter((item): item is { title: string; snapshot: string; product: Product } => Boolean(item.product));
  }, [productsData, topSelections]);

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
      label: englishLabelOverrides[entry.id] || entry.en,
    }));
  }, []);

  const annualAwards = [
    { 
      type: "stroller", 
      label: "Jogging Stroller Pick", 
      title: "INFANS All-Terrain Jogging Stroller",
      winner: seoProductCards.find(card => card.title === "INFANS All-Terrain Jogging Stroller")?.product
    },
    { 
      type: "balance", 
      label: "Balance Bike Pick", 
      title: "JMMD Convertible Balance Bike",
      winner: seoProductCards.find(card => card.title === "JMMD Convertible Balance Bike")?.product
    },
    { 
      type: "value", 
      label: "Kids Scooter Pick", 
      title: "Green Mini 3-Wheel Kids Scooter",
      winner: seoProductCards.find(card => card.title === "Green Mini 3-Wheel Kids Scooter")?.product
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
      {/* 1. Slogan Banner (Brand Identity) */}
      <section className="relative rounded-[48px] bg-white border border-slate-100 overflow-hidden p-10 sm:p-20 text-center max-w-7xl mx-auto shadow-2xl">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,247,237,0.92),rgba(255,255,255,0.88)_45%,rgba(236,253,245,0.55))]"></div>
        <div className="relative z-10 space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-50 border border-orange-100 text-orange-600 text-[10px] font-black uppercase tracking-widest rounded-full">
            <ShieldCheck className="w-4 h-4" />
            {lang === "zh" ? "全链路安全实验室审计" : "END-TO-END SAFETY AUDIT"}
          </div>
          <h1 className="text-3xl font-black text-slate-950 tracking-tight leading-tight">
            Expert Reviews: Jogging Stroller, Balance Bike, Kids Bike & Kids Scooter
          </h1>
          <p className="text-slate-600 text-sm max-w-2xl mx-auto leading-relaxed font-medium">
            Access unbiased mechanical data across our lab-tested jogging stroller, balance bike, kids bike, and kids scooter database.
          </p>
          <SeoKeywordPanel
            variant="orange"
            columns="four"
            align="left"
            className="max-w-3xl mx-auto pt-2 text-left"
            keywords={[
              "jogging stroller",
              "balance bike",
              "kids bike",
              "kids scooter",
            ]}
          />
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
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">2026 Awards: Top Jogging Stroller & Balance Bike</h2>
          </div>
          <button
            onClick={() => setActiveTab("evaluations")}
            className="text-sm font-black text-slate-400 hover:text-orange-500 transition-colors uppercase tracking-widest"
          >
            {lang === "zh" ? "查看完整榜单" : "Full Rankings"}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {annualAwards.map((award, idx) => (
            <div
              key={idx}
              onClick={() => {
                if (award.winner) {
                  onSelectProduct(award.winner);
                  return;
                }
                setActiveTab("evaluations");
              }}
              className="group h-full min-h-90 bg-white border border-slate-100 rounded-[32px] overflow-hidden hover:border-orange-500/40 hover:shadow-2xl hover:shadow-orange-100/70 transition-all duration-300 flex flex-col cursor-pointer"
            >
              <div className="relative h-52 bg-slate-50 overflow-hidden">
                {(() => {
                  const imageKey = `award-${idx}`;
                  const sourceUrl = award.winner ? resolveProductImages(award.winner).coverUrl : FALLBACK_PRODUCT_IMAGE;
                  const state = imageLoadState[imageKey];
                  return (
                    <>
                <img
                  src={resolveStableImageSrc(imageKey, sourceUrl)}
                  alt={award.winner ? award.title : award.label}
                  onLoad={() => handleCardImageLoad(imageKey)}
                  onError={() => handleCardImageError(imageKey, sourceUrl)}
                  className="w-full h-full object-contain p-5 transition-transform duration-500 group-hover:scale-[1.08]"
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
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/90 text-orange-600 font-black uppercase backdrop-blur-sm border border-orange-100 shadow-sm flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" />
                  <span className="text-[10px]">{lang === "zh" ? "大奖" : "Award"}</span>
                </div>
                <span className="absolute top-4 right-4 px-3 py-1 rounded-full bg-white/90 text-[10px] text-slate-400 font-black uppercase backdrop-blur-sm border border-slate-100 shadow-sm">0{idx+1}</span>
              </div>
              <div className="p-6 bg-white flex-1 flex flex-col gap-4">
                <div className="space-y-2">
                  <h3 className="text-slate-950 font-black text-lg leading-tight group-hover:text-orange-500 transition-colors">
                    {award.winner ? award.title : (lang === "zh" ? "评测中" : "Evaluating")}
                  </h3>
                  <p className="text-sm text-slate-500 font-semibold">
                    {award.label}
                  </p>
                </div>
                <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-[10px] font-black uppercase text-slate-400">
                    {lang === "zh" ? "查看详细评测" : "Read Evaluation"}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Featured Evaluations (热门精选评测) */}
      <section className="bg-slate-50 py-24">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-4">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{lang === "zh" ? "深度评测专题" : "Featured Evaluations"}</h3>
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
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Explore by Category: Find Your Perfect Ride
            </h2>
            <p className="text-slate-500 font-medium">
              When testing a kids bike or a balance bike, KIDSMOBI compares frame geometry, braking confidence, and ride posture beside jogging stroller and kids scooter safety data.
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
              <div className="relative h-52 bg-slate-50 overflow-hidden">
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
                <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] bg-white/90 text-orange-600 font-black uppercase backdrop-blur-sm border border-orange-100 shadow-sm">
                  {lang === "zh" ? "精选" : "Featured"}
                </span>
              </div>

              <div className="p-6 bg-white flex-1 flex flex-col gap-4">
                <div className="space-y-2">
                  <h3 className="text-slate-950 font-black text-lg leading-tight">{cat.label}</h3>
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
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Safety Audits: Best Kids Bike & Kids Scooter</h2>
            <p className="text-slate-500 font-medium">
              Every jogging stroller, balance bike, kids bike, and kids scooter card below uses a short lab title so families can compare core ride types faster.
            </p>
          </div>
          <button 
            onClick={() => setActiveTab("products")}
            className="flex items-center gap-2 text-sm font-black text-slate-400 hover:text-orange-500 transition-colors uppercase tracking-widest"
          >
            {lang === "zh" ? "进入库" : "View Products"} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
           {seoProductCards.map(({ product: p, title, snapshot }) => {
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
                      alt={getProductImageAlt(title)}
                      onLoad={() => handleCardImageLoad(imageKey)}
                      onError={() => handleCardImageError(imageKey, sourceUrl)}
                      className="w-full h-full object-contain p-5 transition-transform duration-500 group-hover:scale-[1.08]"
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
                    <h3 className="font-black text-slate-900 group-hover:text-orange-500 transition-colors line-clamp-2 min-h-12">{title}</h3>
                    <p className="text-[10px] text-slate-500 font-medium line-clamp-3 leading-relaxed min-h-12">{snapshot}</p>
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
