import React, { useState } from "react";
import { 
  X, 
  ArrowLeft, 
  ShieldCheck, 
  TrendingUp, 
  TrendingDown, 
  Scale, 
  ChevronRight, 
  CheckCircle2, 
  ThumbsUp, 
  ThumbsDown,
  Maximize2,
  Play,
  Image as ImageIcon
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
import { Product, CurrencyData } from "../types";
import { translateProduct } from "../lib/translate";
import { productsData } from "../data/modelsData";
import ProductCarousel from "./ProductCarousel";

interface DetailedProductViewProps {
  product: Product;
  onClose: () => void;
  lang: "zh" | "en";
  currencyData: CurrencyData;
  comparedProduct: Product | null;
  setComparedProduct: (p: Product | null) => void;
  activeStandardDimension: string | null;
  setActiveStandardDimension: (dim: string | null) => void;
}

export default function DetailedProductView({
  product,
  onClose,
  lang,
  currencyData,
  comparedProduct,
  setComparedProduct,
  activeStandardDimension,
  setActiveStandardDimension
}: DetailedProductViewProps) {
  const displayProduct = translateProduct(product, lang);
  const [activeMediaTab, setActiveMediaTab] = useState<"gallery" | "video">("gallery");

  React.useEffect(() => {
    setActiveMediaTab("gallery");
  }, [product.id]);
  
  // Function to extract 5-dimension scores
  const getProductScores = (p: Product) => {
    const safety = p.safetyScore;
    const comfort = p.category === "stroller" ? 10.0 : p.category === "scooter" ? 8.5 : p.tireType.includes("充气") ? 9.5 : 6.0;
    const portability = p.weightScore;
    
    // Functionality Score
    const isMulti = (p.pros || []).some(pro => 
      pro.includes("多功能") || pro.includes("三合一") || pro.includes("3合1") || pro.includes("3-in-1") || pro.includes("all-in-one") || pro.includes("多用途")
    );
    const certWeight = (p.safetyCertification || []).length * 0.5;
    const functionality = Number(Math.min(10, Math.max(5.5, (p.overallScore * 0.6) + certWeight + (isMulti ? 1.5 : 0) + ((p.pros || []).length * 0.3))).toFixed(1));
    
    // Cost-effectiveness Score
    let priceFactor = 1000;
    if (p.category === "balance") priceFactor = 1500;
    else if (p.category === "bicycle") priceFactor = 2500;
    else if (p.category === "scooter") priceFactor = 600;
    else if (p.category === "stroller") priceFactor = 3000;
    const ratio = p.price / priceFactor;
    const costEff = Number(Math.min(10, Math.max(5.2, (10 - ratio * 2.5) * 0.35 + (p.overallScore * 0.65))).toFixed(1));

    return { safety, comfort, portability, functionality, costEff };
  };

  const scoresA = getProductScores(product);
  const scoresB = comparedProduct ? getProductScores(comparedProduct) : null;

  const radarData = lang === "en" ? [
    { subject: "Safety", scoreA: scoresA.safety, scoreB: scoresB?.safety, key: "safety" },
    { subject: "Comfort", scoreA: scoresA.comfort, scoreB: scoresB?.comfort, key: "comfort" },
    { subject: "Portability", scoreA: scoresA.portability, scoreB: scoresB?.portability, key: "portability" },
    { subject: "Functionality", scoreA: scoresA.functionality, scoreB: scoresB?.functionality, key: "functionality" },
    { subject: "Value", scoreA: scoresA.costEff, scoreB: scoresB?.costEff, key: "value" }
  ] : [
    { subject: "安全性", scoreA: scoresA.safety, scoreB: scoresB?.safety, key: "safety" },
    { subject: "舒适度", scoreA: scoresA.comfort, scoreB: scoresB?.comfort, key: "comfort" },
    { subject: "便携性", scoreA: scoresA.portability, scoreB: scoresB?.portability, key: "portability" },
    { subject: "功能性", scoreA: scoresA.functionality, scoreB: scoresB?.functionality, key: "functionality" },
    { subject: "性价比", scoreA: scoresA.costEff, scoreB: scoresB?.costEff, key: "value" }
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

  const scoringStandards = [
    {
      key: "safety",
      nameZh: "🛡️ 安全防护 (更省心)",
      nameEn: "🛡️ Safety First",
      formulaZh: "给家长的总结：我们测试了紧急刹车时的稳当程度，以及车架在碰撞时会不会轻易变形。",
      formulaEn: "Parent's Tip: We tested how quickly and safely it stops, and frame strength.",
      descZh: "选用更软、更好握的刹车系统，配合加固的合金车架，即使宝宝骑得飞快，也能稳稳停住。",
      descEn: "Designed with easy-to-pull brakes and a sturdy frame so your child stays safe."
    },
    {
      key: "comfort",
      nameZh: "🛋️ 骑行舒适 (不累腰)",
      nameEn: "🛋️ Riding Comfort",
      formulaZh: "给家长的总结：测试了座包的柔软度，以及骑行时震手不震手。保证孩子不喊累。",
      formulaEn: "Parent's Tip: We checked seat softness and how well it handles bumpy paths.",
      descZh: "针对孩子发育的窄跨距设计，保护膝盖不外八字。配合减震轮胎，让颠簸路面更舒服。",
      descEn: "Ergonomic seating protects little knees and makes bumpy rides a breeze."
    },
    {
       key: "portability",
       nameZh: "🎒 轻便省力 (好拿取)",
       nameEn: "🎒 Light & Easy",
       formulaZh: "给家长的总结：实测了车重。确保妈妈一个人也能轻松拎进后备箱。",
       formulaEn: "Parent's Tip: We weighed every bike for ease of lifting into a trunk.",
       descZh: "坚持“轻量化”原则。大部分车型都轻得离谱，哪怕是老人带娃，搬运也无压力。",
       descEn: "Built with lightweight materials so anyone can easily carry it upstairs or store it."
    }
  ];

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
            {lang === "en" ? "Back to Products" : "返回产品大厅"}
          </button>
          <div className="flex items-center gap-3">
            <span className="text-[10px] bg-orange-50 text-orange-600 font-bold px-3 py-1 rounded-full uppercase border border-orange-100">
              {displayProduct.brand}
            </span>
          </div>
          <h2 className="text-3xl font-black text-slate-900">{displayProduct.name}</h2>
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
          {product.videoUrl && (
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
              images={[product.imageUrl, ...(product.galleryUrls || [])].filter(Boolean)} 
              lang={lang} 
            />
          ) : (
            <div className="aspect-video w-full">
              <iframe 
                src={product.videoUrl} 
                className="w-full h-full rounded-2xl"
                title={`${product.name} Video`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Radar & Comparison (Left Column) */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white border border-slate-100 rounded-[40px] p-8 shadow-sm space-y-8">
             <div className="flex justify-between items-center border-b border-slate-50 pb-6">
                <h3 className="text-xl font-black text-slate-900">{lang === "en" ? "Performance Analysis" : "测评效能透视"}</h3>
                <div className="flex items-center gap-2">
                  <select
                    value={comparedProduct?.id || ""}
                    onChange={(e) => setComparedProduct(productsData.find(p => p.id === e.target.value) || null)}
                    className="bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase px-4 py-2 cursor-pointer focus:ring-2 focus:ring-orange-500/20"
                  >
                    <option value="">{lang === "en" ? "Compare With..." : "选择对比型号..."}</option>
                    {productsData.filter(p => p.id !== product.id && p.category === product.category).map(p => (
                      <option key={p.id} value={p.id}>{p.brand} {p.name}</option>
                    ))}
                  </select>
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
                    {comparedProduct && (
                      <Radar
                        name={comparedProduct.brand}
                        dataKey="scoreB"
                        stroke="#6366f1"
                        fill="#6366f1"
                        fillOpacity={0.15}
                        strokeWidth={3}
                      />
                    )}
                  </RadarChart>
                </ResponsiveContainer>
             </div>

             {/* Pros & Cons Section */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-50">
                <div className="space-y-4">
                  <h4 className="flex items-center gap-2 text-xs font-black text-emerald-600 uppercase">
                    <ThumbsUp className="w-4 h-4" />
                    {lang === "en" ? "Pros" : "产品亮点"}
                  </h4>
                  <ul className="space-y-2">
                    {displayProduct.pros?.map((pro, i) => (
                      <li key={i} className="flex gap-3 text-sm text-slate-600 font-medium bg-emerald-50/50 p-3 rounded-2xl border border-emerald-50">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-4">
                  <h4 className="flex items-center gap-2 text-xs font-black text-rose-500 uppercase">
                    <ThumbsDown className="w-4 h-4" />
                    {lang === "en" ? "Cons" : "留意事项"}
                  </h4>
                  <ul className="space-y-2">
                    {displayProduct.cons?.map((con, i) => (
                      <li key={i} className="flex gap-3 text-sm text-slate-600 font-medium bg-rose-50/50 p-3 rounded-2xl border border-rose-50">
                        <X className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>
             </div>
          </div>

          {/* Standards Accordion */}
          <div className="bg-white border border-slate-100 rounded-[40px] p-8 shadow-sm space-y-6">
             <h3 className="text-xl font-black text-slate-900 border-b border-slate-50 pb-4">{lang === "en" ? "Scoring Standards & Logic" : "评分标准与算法详情"}</h3>
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
                              {lang === "en" ? std.formulaEn : std.formulaZh}
                           </div>
                           <p className="text-xs text-slate-500 leading-relaxed font-medium pl-2">{lang === "en" ? std.descEn : std.descZh}</p>
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
           <div className="bg-slate-950 border border-slate-850 rounded-[40px] p-8 shadow-xl text-white space-y-8">
              <div>
                <h3 className="text-lg font-black flex items-center gap-2 mb-2">
                  <Maximize2 className="w-5 h-5 text-orange-500" />
                  {lang === "en" ? "Live Specs" : "物理规格清单"}
                </h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{lang === "en" ? "Laboratory Verified" : "实验室深度测定数据"}</p>
              </div>

              <div className="space-y-5">
                 {[
                   { label: lang === "en" ? "Weight" : "整车自重", val: `${displayProduct.weight} kg`, highlight: displayProduct.weight < 6 },
                   { label: lang === "en" ? "Tires" : "轮胎材质", val: displayProduct.tireType },
                   { label: lang === "en" ? "Frame" : "主要架构", val: displayProduct.material },
                   { label: lang === "en" ? "Wheel Size" : "轮毂规格", val: displayProduct.wheelSize },
                   { label: lang === "en" ? "Brakes" : "制动系统", val: displayProduct.brakes },
                   { label: lang === "en" ? "Saddle Height" : "鞍座范围", val: displayProduct.saddleHeightRange },
                   { label: lang === "en" ? "MSRP" : "参考售价", val: `${currencyData.symbol}${displayProduct.price}` }
                 ].map((item, i) => (
                   <div key={i} className="flex justify-between items-center text-xs border-b border-white/5 pb-3 last:border-0">
                      <span className="text-slate-500 font-bold">{item.label}</span>
                      <strong className={`font-mono ${item.highlight ? "text-emerald-400" : "text-white"}`}>{item.val}</strong>
                   </div>
                 ))}
              </div>

              <div className="pt-4">
                 <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2">
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block">{lang === "en" ? "Safety Certifications" : "核心准入验证"}</span>
                    <div className="flex flex-wrap gap-2">
                       {displayProduct.safetyCertification?.map((cert, j) => (
                         <span key={j} className="px-2 py-0.5 bg-orange-500/10 text-orange-500 rounded text-[9px] font-black border border-orange-500/20">{cert}</span>
                       ))}
                    </div>
                 </div>
              </div>
           </div>

           {/* Verdict Box */}
           <div className="bg-orange-50 border border-orange-100 rounded-[40px] p-8 space-y-4">
              <h4 className="text-xs font-black text-orange-600 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                {lang === "en" ? "Editor Verdict" : "本站终极评价"}
              </h4>
              <p className="text-sm text-slate-700 font-bold leading-relaxed italic">
                “{displayProduct.editorVerdict}”
              </p>
           </div>
        </div>
      </div>

    </div>
  );
}
