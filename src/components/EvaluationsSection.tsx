import { useState, useMemo } from "react";
import { Award, Filter, ShieldCheck, Scale, Search, CheckCircle, Flame, Star, Sparkles, BookOpen, ArrowRight } from "lucide-react";
import { Product } from "../types";
import { translateProduct } from "../lib/translate";
import Breadcrumbs from "./Breadcrumbs";

interface EvaluationsSectionProps {
  productsData: Product[];
  onSelectProduct: (p: Product) => void;
  childProfile: any;
  lang?: "zh" | "en";
}

// Custom SVG Radar Polygon Chart
function SafetyRadarChart({ product, lang = "zh" }: { product: Product; lang: "zh" | "en" }) {
  const scores = useMemo(() => {
    // Standardize scores to 0-10 bounds
    const comfort = product.category === "stroller" ? 10.0 : product.category === "scooter" ? 8.5 : product.tireType.includes("充气") ? 9.5 : 6.0;
    const value = product.price < 600 ? 10.0 : product.price < 2000 ? 8.5 : product.price < 4000 ? 7.0 : 5.0;
    
    return [
      { name: lang === "en" ? "Safety" : "安全保障", val: product.safetyScore },
      { name: lang === "en" ? "Comfort" : "舒适减震", val: comfort },
      { name: lang === "en" ? "Weight" : "省力指数", val: product.weightScore },
      { name: lang === "en" ? "Fit" : "成长匹配", val: product.geometryScore },
      { name: lang === "en" ? "Value" : "性价比", val: value }
    ];
  }, [product, lang]);

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
    <div className="flex flex-col items-center bg-white p-8 rounded-[48px] border border-slate-100 shadow-xl shadow-orange-500/5 relative overflow-hidden w-full max-w-[280px] mx-auto transition-transform hover:scale-[1.02] duration-500">
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
            stroke="#f8fafc"
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
              fill="#64748b"
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

export default function EvaluationsSection({ 
  productsData, 
  onSelectProduct,
  childProfile,
  lang = "zh"
}: EvaluationsSectionProps) {
  const [selectedReviewType, setSelectedReviewType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const reviewTypes = lang === "en" ? [
    { id: "all", label: "📁 ALL REPORTS" },
    { id: "single", label: "🔬 SINGLE TEST" },
    { id: "cross", label: "⚖️ CROSS COMPARE" },
    { id: "new", label: "🆕 FIRST LOOK" },
    { id: "global", label: "🌍 EXPORT SPEC" },
    { id: "value", label: "💰 VALUE RANK" },
    { id: "annual", label: "🏆 ANNUAL TOP" }
  ] : [
    { id: "all", label: "📁 全部评估" },
    { id: "single", label: "🔬 单品实测" },
    { id: "cross", label: "⚖️ 多品横评" },
    { id: "new", label: "🆕 新品首发" },
    { id: "global", label: "🌍 跨境专项" },
    { id: "value", label: "💰 性价比测评" },
    { id: "annual", label: "🏆 年度榜单" }
  ];

  // Map products of the DB dynamically to these review types to simulate rich reviews
  const reviewsList = useMemo(() => {
    return productsData.map((p) => {
      // Dynamic mapping logic
      let reviewType = "single";
      let reviewBadge = lang === "en" ? "EXPERT REPORT" : "深度专家报告";
      
      if (p.id === "bal_2" || p.id === "bike_2") {
        reviewType = "cross";
        reviewBadge = lang === "en" ? "COMPARISON" : "横向力学对比";
      } else if (p.id === "bal_1" || p.id === "scoot_1") {
        reviewType = "new";
        reviewBadge = lang === "en" ? "NEW ARRIVAL" : "新品首发评估";
      }

      return {
        product: p,
        reviewType,
        reviewBadge
      };
    });
  }, [productsData, lang]);

  const filteredReviews = useMemo(() => {
    return reviewsList.filter((r) => {
      const pTrans = translateProduct(r.product, lang);
      const matchesType = selectedReviewType === "all" || r.reviewType === selectedReviewType;
      const matchesSearch = searchQuery.trim() === "" ||
        pTrans.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pTrans.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pTrans.editorVerdict.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [reviewsList, selectedReviewType, searchQuery, lang]);

  return (
    <div id="evaluations_hub" className="space-y-8 animate-fade-in text-left">
      
      {/* Breadcrumbs (PRD 4.3.2) */}
      <Breadcrumbs 
        lang={lang} 
        onHomeClick={() => (window as any).setActiveTab?.("home")}
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
            <>Objective Science, Parental Confidence</>
          ) : (
            <>用严苛实测，重塑选购信心</>
          )}
        </h2>
        <p className="text-slate-500 text-lg font-medium leading-relaxed">
          {lang === "en" 
            ? "We bypass marketing hype to deliver the absolute truth in kids' mobility performance." 
            : "KIDSMOBI 通过匿名采购、工业级精密设备及儿科工效学评估，为您呈现每一款童车背后的真实物理数据。"}
        </p>
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
                onClick={() => setSelectedReviewType(t.id)}
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

        <div className="bg-emerald-50/50 p-6 rounded-[32px] border border-emerald-100 flex items-center gap-4 text-xs text-emerald-700 font-black relative z-10">
          <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm">
             <ShieldCheck className="w-6 h-6 text-emerald-500 shrink-0" />
          </div>
          {lang === "en" ? "KIDSMOBI PROMISE: All samples are purchased anonymously to avoid manufacturer manipulation." : "KIDSMOBI 申明：全站测评均由专业人员通过个人账号自费购入，确保 100% 独立性与客观公平。"}
        </div>
      </div>

      {/* Grid listing */}
      {filteredReviews.length === 0 ? (
        <div className="p-24 text-center bg-white border border-slate-100 rounded-[56px] shadow-sm">
          <img src="https://api.dicebear.com/7.x/bottts/svg?seed=empty&backgroundColor=f8fafc" alt="Empty" className="w-24 h-24 mx-auto mb-6 opacity-20" />
          <p className="text-slate-400 font-black uppercase tracking-widest text-xs">
            {lang === "en" ? "No matches in current lab database" : "实验室数据库中暂无匹配项"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 text-left animate-fade-in">
          {filteredReviews.map(({ product, reviewBadge }) => {
            const diProduct = translateProduct(product, lang);

            return (
              <div
                key={diProduct.id}
                className="bg-white border border-slate-100 rounded-[56px] p-10 flex flex-col md:flex-row gap-10 justify-between transition-all group hover:shadow-[0_48px_80px_-24px_rgba(249,115,22,0.12)] shadow-sm relative overflow-hidden"
              >
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-orange-50/30 blur-[64px] rounded-full -mb-24 -mr-24 group-hover:bg-orange-100/50 transition-colors"></div>
                
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
                      <h3 className="font-black text-slate-900 text-2xl leading-tight group-hover:text-orange-500 transition-colors uppercase">
                        {diProduct.name}
                      </h3>
                    </div>

                    <div className="bg-slate-50/50 p-6 rounded-[32px] border border-slate-50">
                       <p className="text-sm text-slate-600 leading-relaxed font-bold italic">“{diProduct.editorVerdict}”</p>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectProduct(product)}
                    className="w-full py-5 bg-slate-900 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-widest rounded-[24px] transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3 active:scale-95 group-hover:shadow-orange-500/20"
                  >
                    {lang === "en" ? "OPEN FULL DOSSIER" : "开启完整测评档案"}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Column Right: Live Interactive Vector Radar Component */}
                <div className="md:w-1/2 flex items-center justify-center relative z-10">
                  <SafetyRadarChart product={product} lang={lang} />
                </div>
                
              </div>
            );
          })}
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
              ? "After filtering through 100+ stress tests and real-world durability checks, these models stand out for their exceptional safety and comfort."
              : "经历过严格实测和上万次平衡稳定性测试，我们精选出了以下几款能够真正让家长放心、孩子开心的标兵车型："}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
            <div className="bg-white p-5 rounded-3xl border border-orange-100 shadow-sm">
              <strong className="text-orange-600 block mb-1 font-black">🏆 {lang === "en" ? "Best Balance Bike" : "最佳平衡车"}</strong>
              <span className="text-slate-500 font-medium">Woom 1 (仅重 3kg，宝宝一眼爱上)</span>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-orange-100 shadow-sm">
              <strong className="text-orange-600 block mb-1 font-black">🏆 {lang === "en" ? "Best Kid Bicycle" : "最佳自行车"}</strong>
              <span className="text-slate-500 font-medium">Woom 2 (超短握距手刹，安全感拉满)</span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
