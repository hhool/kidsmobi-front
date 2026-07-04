import { 
  Baby, 
  Award,
  ShieldCheck, 
  ChevronRight, 
  TrendingDown, 
  Scale, 
  Wrench, 
  Bookmark, 
  Star,
  Sparkles,
  Zap,
  Globe,
  Bell,
  ArrowRight,
  Target
} from "lucide-react";
import { useMemo, useState } from "react";
import { Product, CurrencyData } from "../types";
import { translations, translateProduct } from "../lib/translate";
import MatchingWizard from "./MatchingWizard";
import { SCRAPED_CATEGORY_CATALOG } from "../config/scrapedCategoryCatalog";
import { PRODUCT_CATEGORY_SEO_KEYWORDS } from "../config/seoKeywordMap";
import { resolveProductImages, withImageFallback, FALLBACK_PRODUCT_IMAGE } from "../lib/productImages";

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
    jogger_stroller: ["jogger_stroller", "jogger stroller"],
    balance_bike: ["balance_bike", "balance", "balance bike"],
    kids_bikes: ["kids_bikes", "bikes", "bike", "kids bike"],
    kids_tricycles: ["kids_tricycles", "tricycle", "tricycles"],
    scooters: ["scooters", "scooter"],
    kids_push_ride_ons: ["kids_push_ride_ons", "push_ride_ons", "ride_ons"],
    kids_pull_along_wagons: ["kids_pull_along_wagons", "pull_along_wagons", "wagons", "wagon"],
    electric_vehicles: ["electric_vehicles", "electric", "ev"],
    car_seat: ["car_seat", "car seat"],
    baby_carrier: ["baby_carrier", "carrier", "baby carrier"],
    high_chair: ["high_chair", "high chair"],
    playard: ["playard", "play yard"],
  };

  const normalizeCategory = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "_");
  
  const t = translations[lang];
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const scrapedCategoryCards = useMemo(() => {
    return SCRAPED_CATEGORY_CATALOG.slice(0, 8).map((entry) => ({
      ...entry,
      label: lang === "zh" ? entry.zh : entry.en,
    }));
  }, [lang]);

  const categoryHeroImageMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const entry of SCRAPED_CATEGORY_CATALOG) {
      const aliases = categoryAliasMap[entry.id] || [entry.id];
      const found = productsData.find((product) => {
        const normalized = normalizeCategory(product.category || "");
        return aliases.some((alias) => normalized.includes(normalizeCategory(alias)));
      });
      map[entry.id] = found ? resolveProductImages(found).coverUrl : FALLBACK_PRODUCT_IMAGE;
    }
    return map;
  }, [productsData]);

  const seoTrendGroups = useMemo(() => {
    const hotKeys = ["stroller", "double_stroller", "jogger_stroller", "balance_bike", "scooters", "kids_bikes"];
    return hotKeys.map((key) => ({
      id: key,
      label: lang === "zh"
        ? (SCRAPED_CATEGORY_CATALOG.find((item) => item.id === key)?.zh || key)
        : (SCRAPED_CATEGORY_CATALOG.find((item) => item.id === key)?.en || key),
      keywords: PRODUCT_CATEGORY_SEO_KEYWORDS[key]?.[lang] || [],
    }));
  }, [lang]);

  // Outstanding Selection (high scores)
  const topSelections = [...productsData].sort((a, b) => b.overallScore - a.overallScore).slice(0, 4);

  const annualAwards = [
    { 
      type: "stroller", 
      label: lang === "zh" ? "年度最佳推车" : "Best Stroller", 
      winner: productsData.find(p => p.category === "stroller") 
    },
    { 
      type: "balance", 
      label: lang === "zh" ? "年度最佳平衡车" : "Best Balance Bike", 
      winner: productsData.find(p => p.category === "balance") 
    },
    { 
      type: "value", 
      label: lang === "zh" ? "年度性价比之选" : "Best Value Pick", 
      winner: productsData.sort((a, b) => a.price - b.price)[0] 
    }
  ];

  return (
    <div id="home_layout" className="space-y-24 pb-20">
      
      {/* 1. Slogan Banner (Brand Identity) */}
      <section className="relative rounded-[48px] bg-slate-900 overflow-hidden p-10 sm:p-20 text-center max-w-7xl mx-auto shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#f97316_0%,transparent_100%)] opacity-20"></div>
        <div className="relative z-10 space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-black uppercase tracking-widest rounded-full">
            <ShieldCheck className="w-4 h-4" />
            {lang === "zh" ? "全链路安全实验室审计" : "END-TO-END SAFETY AUDIT"}
          </div>
          <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
            {lang === "zh" ? "客观科学评测" : "Objective & Scientific Reviews,"} <br />
            <span className="text-orange-500">{lang === "zh" ? "您的信心之选" : "Your Confident Choice"}</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed font-medium">
            {lang === "zh" 
              ? "KIDSMOBI 是全球领先的高端童车垂直评测平台，通过力学公式与数千小时的实测，协助家长完成每一个理性的消费决策。"
              : "KIDSMOBI is a global leading evaluation platform for premium kids mobility. We help parents make rational decisions through mechanical physics."}
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <button 
              onClick={() => setIsWizardOpen(true)}
              className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl transition-all flex items-center gap-2 shadow-xl shadow-orange-500/20 active:scale-95 group"
            >
              <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
              {lang === "zh" ? "智能匹配向导" : "Smart Match Wizard"}
            </button>
            <button 
              onClick={() => setActiveTab("guides")}
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-black border border-white/20 rounded-2xl transition-all flex items-center gap-2 active:scale-95"
            >
              {lang === "zh" ? "手动选型计算" : "Manual Calculator"}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            {['ISO 8098', 'CPSC', 'EN 71', 'GB-14746'].map(cert => (
              <span key={cert} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-slate-500 uppercase tracking-widest">{cert}</span>
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
          <button className="text-sm font-black text-slate-400 hover:text-orange-500 transition-colors uppercase tracking-widest">{lang === "zh" ? "查看完整榜单" : "Full Rankings"}</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {annualAwards.map((award, idx) => (
            <div key={idx} className="bg-white border border-slate-100 rounded-[40px] p-8 space-y-6 hover:shadow-2xl hover:shadow-slate-200/50 transition-all cursor-pointer group">
              <div className="flex justify-between items-start">
                <div className="p-4 bg-orange-50 rounded-2xl">
                  <Award className="w-8 h-8 text-orange-500" />
                </div>
                <span className="text-slate-200 font-black text-4xl group-hover:text-orange-500/10 transition-colors italic">0{idx+1}</span>
              </div>
              <div className="space-y-2">
                <h4 className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">{award.label}</h4>
                <p className="text-xl font-black text-slate-900 group-hover:text-orange-500 transition-colors">{award.winner ? translateProduct(award.winner, lang).name : "Evaluating..."}</p>
              </div>
              <button 
                onClick={() => award.winner && onSelectProduct(award.winner)}
                className="w-full py-4 bg-slate-50 hover:bg-orange-500 hover:text-white text-slate-900 font-black rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                {lang === "zh" ? "查看详细评测" : "Read Evaluation"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Featured Evaluations (热门精选评测) */}
      <section className="bg-slate-50 py-24">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-4">
            <h3 className="text-4xl font-black text-slate-900 tracking-tight">{lang === "zh" ? "深度评测专题" : "Featured Evaluations"}</h3>
            <p className="text-slate-500 font-medium">{lang === "zh" ? "拒绝营销软文。我们通过 120+ 项力学检测得出中立评分。" : "No sponsored reviews. 120+ mechanical tests for unbiased scoring."}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { id: "single", icon: Star, label: lang === "zh" ? "精品实测" : "Single Review", color: "orange" },
              { id: "compare", icon: Scale, label: lang === "zh" ? "热门横评" : "Comparison", color: "blue" },
              { id: "new", icon: Zap, label: lang === "zh" ? "新品速递" : "New Arrival", color: "emerald" },
              { id: "avoid", icon: ShieldCheck, label: lang === "zh" ? "避坑指南" : "Safe Pick", color: "rose" },
            ].map(cat => (
              <div 
                key={cat.id} 
                onClick={() => setActiveTab("evaluations")}
                className="bg-white p-8 rounded-4xl border border-slate-100 hover:border-orange-500/30 hover:shadow-xl transition-all cursor-pointer group text-center space-y-4"
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

      {/* 4. Scraped Category Launchpad (已爬取品类入口) */}
      <section className="max-w-7xl mx-auto px-6 space-y-10">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <span className="text-[10px] text-orange-500 font-black uppercase tracking-[0.2em]">
              {lang === "zh" ? "已爬取品类" : "Scraped Category Hub"}
            </span>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">
              {lang === "zh" ? "热门品类快速直达" : "Popular Category Launchpad"}
            </h3>
            <p className="text-slate-500 font-medium">
              {lang === "zh"
                ? "基于 store.poki2.online 已爬取产物，直连品类浏览与站内筛选。"
                : "Built from store.poki2.online scraped outputs with direct category navigation and in-site filtering."}
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
          {scrapedCategoryCards.map((cat) => (
            <div
              key={cat.id}
              className="group bg-white border border-slate-100 rounded-4xl overflow-hidden hover:border-orange-500/30 hover:shadow-2xl hover:shadow-slate-300/40 transition-all"
            >
              <div className="relative h-44">
                <img
                  src={categoryHeroImageMap[cat.id] || FALLBACK_PRODUCT_IMAGE}
                  alt={cat.label}
                  onError={withImageFallback}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-linear-to-t from-slate-950/80 via-slate-900/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-white font-black text-lg leading-tight tracking-tight">{cat.label}</h4>
                      <p className="text-[11px] text-slate-200 font-bold uppercase tracking-wider mt-1">
                        {lang === "zh" ? `收录 ${cat.itemCount} 条` : `${cat.itemCount} items indexed`}
                      </p>
                    </div>
                    <span className="px-2 py-1 rounded-lg text-[10px] bg-white/20 text-white font-black uppercase tracking-wider backdrop-blur-sm border border-white/20">
                      API
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-linear-to-b from-white to-slate-50/80">
                <p className="text-[12px] text-slate-500 font-medium leading-relaxed min-h-10">
                  {lang === "zh"
                    ? "覆盖参数筛选、评测联动与来源页追溯，适合快速建立选购候选清单。"
                    : "Includes filters, review linkage, and source tracing to build a shortlist faster."}
                </p>
                <div className="flex gap-2 mt-4">
                <button
                  onClick={() => {
                    onSelectCategory(cat.id);
                    setActiveTab("products");
                  }}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider hover:bg-orange-500 transition-colors"
                >
                  {lang === "zh" ? "站内查看" : "In-site"}
                </button>
                <a
                  href={cat.catalogUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-[11px] text-center font-black uppercase tracking-wider hover:bg-slate-200 transition-colors"
                >
                  {lang === "zh" ? "源目录" : "Source"}
                </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. SEO Trend Cluster (首页内容细化) */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-7xl mx-auto px-6 space-y-10">
          <div className="space-y-2">
            <span className="text-[10px] text-orange-500 font-black uppercase tracking-[0.2em]">
              {lang === "zh" ? "SEO 搜索趋势" : "SEO Search Trends"}
            </span>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">
              {lang === "zh" ? "家长高频检索关键词" : "High-Intent Parent Queries"}
            </h3>
            <p className="text-slate-500 font-medium">
              {lang === "zh"
                ? "来源于童车 SEO 词表，用于页面标题、频道内容和内链策略。"
                : "Derived from the stroller SEO workbook to guide titles, channel copy, and internal links."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {seoTrendGroups.map((group) => (
              <div key={group.id} className="bg-white border border-slate-100 rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-slate-900 font-black text-lg">{group.label}</h4>
                  <button
                    onClick={() => {
                      onSelectCategory(group.id);
                      setActiveTab("products");
                    }}
                    className="text-[10px] px-2 py-1 bg-orange-50 text-orange-500 rounded-lg font-black uppercase tracking-wider"
                  >
                    {lang === "zh" ? "去筛选" : "Filter"}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {group.keywords.slice(0, 5).map((kw) => (
                    <span
                      key={kw}
                      className="px-2.5 py-1 rounded-full text-[11px] bg-slate-100 text-slate-700 font-semibold"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Hot Products (热门产品) */}
      <section className="max-w-7xl mx-auto px-6 space-y-12">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <span className="text-[10px] text-orange-500 font-black uppercase tracking-[0.2em]">{lang === "zh" ? "社区热选" : "Trending Now"}</span>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{lang === "zh" ? "实验室推荐单品" : "Highly Rated Rides"}</h3>
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
                className="group cursor-pointer bg-white rounded-4xl border border-slate-100 overflow-hidden hover:shadow-2xl transition-all"
               >
                 <div className="h-52 bg-slate-50 overflow-hidden">
                    <img
                      src={resolveProductImages(p).coverUrl}
                      alt={dp.name}
                      onError={withImageFallback}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                 </div>
                 <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest">{dp.brand}</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-orange-500 text-orange-500" />
                        <span className="text-xs font-black">{dp.overallScore}</span>
                      </div>
                    </div>
                    <h5 className="font-black text-slate-900 group-hover:text-orange-500 transition-colors line-clamp-1">{dp.name}</h5>
                    <p className="text-[10px] text-slate-500 font-medium line-clamp-2 leading-relaxed">“{dp.editorVerdict}”</p>
                 </div>
               </div>
             );
          })}
        </div>
      </section>

      {/* 7. Real-time News (实时资讯) */}
      <section className="bg-slate-900 py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 blur-[120px] rounded-full"></div>
        <div className="max-w-7xl mx-auto px-6 space-y-12 relative z-10">
          <div className="flex justify-between items-end">
             <div className="space-y-2">
                <span className="text-[10px] text-orange-500 font-black uppercase tracking-[0.2em]">{lang === "zh" ? "全球连线" : "Global Sync"}</span>
                <h3 className="text-3xl font-black text-white tracking-tight">{lang === "zh" ? "行业及合规实时资讯" : "Real-time Industry News"}</h3>
             </div>
             <button onClick={() => setActiveTab("news")} className="text-sm font-black text-slate-500 hover:text-white transition-colors uppercase tracking-widest">{lang === "zh" ? "查看全部" : "View All"}</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {[1, 2].map(i => (
               <div key={i} className="flex gap-6 p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-colors cursor-pointer group">
                  <div className="w-24 h-24 bg-white/5 rounded-2xl shrink-0 flex items-center justify-center">
                    <Globe className="w-8 h-8 text-slate-600 group-hover:text-orange-500 transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-black text-orange-500 uppercase">
                      <span className="px-2 py-0.5 bg-orange-500/10 rounded-full">{i === 1 ? 'REGULATION' : 'NEW TECH'}</span>
                      <span className="text-slate-600">June 14, 2026</span>
                    </div>
                    <h4 className="text-white font-bold leading-tight group-hover:text-orange-500 transition-colors">
                      {i === 1 
                        ? (lang === "zh" ? "欧盟修订 ISO 8098 儿童自行车安全标准，涉及刹把间距强制性提案" : "EU Updates ISO 8098 Standards for Kids Bike Brake Reach Safety")
                        : (lang === "zh" ? "一体镁压铸技术迎来爆发：轻便童车市场平均自重下降 15%" : "Magnesium Die-casting Tech Drops Average Bike Weight by 15%")}
                    </h4>
                    <p className="text-slate-500 text-xs line-clamp-1">{lang === "zh" ? "深度分析技术变革对家庭选购的影响..." : "Deep analysis on how tech changes affect home buying..."}</p>
                  </div>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* 8. Buying Guide Quick Links (选购指南快捷入口) & 9. Global Tool Entry (全站工具入口) */}
      <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-8">
          <div className="space-y-2">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{lang === "zh" ? "智能选购场景" : "Quick Selection Scenarios"}</h3>
            <p className="text-slate-500 font-medium">{lang === "zh" ? "从成长阶段出发，为您快速匹配最佳方案。" : "Find the perfect match based on your child's growth stage."}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { id: "newborn", label: lang === "zh" ? "新生儿(0-12月) · 出行安全" : "Newborn Mobility", desc: lang === "zh" ? "侧重减震与中轴枢纽强度" : "Focus on shock absorption" },
              { id: "outdoor", label: lang === "zh" ? "户外郊游 · 越野专家" : "Outdoor Experts", desc: lang === "zh" ? "轮组抓地力与通过性专项评测" : "Grip and terrain testing" },
              { id: "commute", label: lang === "zh" ? "日常通勤 · 轻便首选" : "Daily Commute", desc: lang === "zh" ? "折叠速度与整备质量极限对比" : "Weight and folding speed" },
              { id: "growth", label: lang === "zh" ? "运动天赋 · 平衡进阶" : "Growth & Balance", desc: lang === "zh" ? "转向限位与工效几何深度拆解" : "Ergonomic geometry analysis" },
            ].map(scene => (
              <div key={scene.id} onClick={() => setActiveTab("guides")} className="p-8 bg-white border border-slate-100 rounded-4xl hover:border-orange-500 hover:shadow-xl transition-all cursor-pointer group">
                <h5 className="font-black text-slate-900 group-hover:text-orange-500 transition-colors mb-2">{scene.label}</h5>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">{scene.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="space-y-2">
             <h3 className="text-3xl font-black text-slate-900 tracking-tight">{lang === "zh" ? "效率工具" : "Smart Tools"}</h3>
             <p className="text-slate-500 font-medium">{lang === "zh" ? "用算力解决选购难题" : "Solve problems with data."}</p>
          </div>
          <div className="space-y-4">
             {[
               { id: "guides", label: lang === "zh" ? "智能选型计算器" : "Smart Sizing Calc", icon: Wrench },
               { id: "products", label: lang === "zh" ? "全维度对比矩阵" : "Comparison Matrix", icon: Scale },
               { id: "about", label: lang === "zh" ? "产品合规查询系统" : "Compliance Search", icon: ShieldCheck },
             ].map(tool => (
               <div key={tool.id} onClick={() => setActiveTab(tool.id)} className="flex items-center gap-6 p-6 bg-slate-900 rounded-4xl hover:bg-orange-500 transition-all cursor-pointer group border border-slate-800">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white group-hover:bg-white/20 transition-colors">
                    <tool.icon className="w-6 h-6" />
                  </div>
                  <span className="font-black text-white text-lg">{tool.label}</span>
               </div>
             ))}
          </div>
        </div>
      </section>

      <MatchingWizard 
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        productsData={productsData}
        onSelectProduct={(p) => {
          setIsWizardOpen(false);
          onSelectProduct(p);
        }}
        lang={lang}
        currencyData={currencyData}
      />
    </div>
  );
}
