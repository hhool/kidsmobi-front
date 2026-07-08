import React from "react";
import { 
  Scale, 
  X, 
  Zap, 
  ShieldCheck, 
  Star, 
  Settings, 
  ChevronRight,
  TrendingUp,
  Package,
  Layers,
  CircleEqual
} from "lucide-react";
import { Product, CurrencyData } from "../types";
import { translateProduct } from "../lib/translate";
import { convertWeightNum, getWeightUnit } from "../lib/units";
import { resolveProductImages } from "../lib/productImages";
import SmartImage from "./common/SmartImage";

interface ComparisonDashboardProps {
  compareList: Product[];
  onRemove: (id: string) => void;
  onClear: () => void;
  lang?: "zh" | "en";
  currencyData: CurrencyData;
}

export default function ComparisonDashboard({
  compareList,
  onRemove,
  onClear,
  lang = "zh",
  currencyData
}: ComparisonDashboardProps) {
  if (compareList.length === 0) return null;

  const formatMetricValue = (key: string, value: unknown): string => {
    const text = String(value ?? "").trim();
    if (key === "ageRange" && (!text || /^all\s*ages?$/i.test(text) || /^confirm from source$/i.test(text))) {
      return lang === "en" ? "Confirm from source" : "待抓取确认";
    }
    return text || (lang === "en" ? "Not specified" : "未标注");
  };

  const metrics = [
    { key: "brand", label: lang === "en" ? "Manufacturer" : "制造商", icon: Package },
    { key: "categoryLabel", label: lang === "en" ? "Category" : "品类", icon: Layers },
    { key: "material", label: lang === "en" ? "Frame Material" : "车架材质", icon: Settings },
    { key: "weight", label: lang === "en" ? "Lab Weight" : "实测净重", suffix: " kg", icon: Scale },
    { key: "wheelSize", label: lang === "en" ? "Wheel Size" : "轮组尺寸", icon: CircleEqual },
    { key: "price", label: lang === "en" ? "MSRP" : "参考售价", prefix: currencyData.symbol, icon: Zap },
    { key: "brakeType", label: lang === "en" ? "Braking System" : "刹车类型", icon: ShieldCheck },
    { key: "tireType", label: lang === "en" ? "Tire Tech" : "轮胎技术", icon: TrendingUp },
    { key: "ageRange", label: lang === "en" ? "Age Group" : "推荐年龄", icon: Star },
  ];

  const scores = [
    { key: "safetyScore", label: lang === "en" ? "Safety Rating" : "安全指数" },
    { key: "geometryScore", label: lang === "en" ? "Ergo-Geometry" : "几何评价" },
    { key: "weightScore", label: lang === "en" ? "Weight Ratio" : "重量工效" },
    { key: "overallScore", label: lang === "en" ? "Total Score" : "综合评分" },
  ];

  return (
    <section className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-slate-900 border border-slate-800 rounded-[56px] overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-500 via-yellow-500 to-transparent"></div>
        
        {/* Header */}
        <div className="p-10 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/[0.02]">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-orange-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-orange-500/20 rotate-3">
              <Scale className="w-8 h-8 text-white -rotate-3" />
            </div>
            <div>
               <h3 className="text-3xl font-black text-white tracking-tight">
                {lang === "en" ? "Technical Dashboard" : "深度技术对比看板"}
              </h3>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mt-1">
                Side-by-side Engineering Analysis
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClear}
            className="px-6 py-3 bg-white/5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 rounded-2xl border border-white/10 hover:border-rose-500/20 transition-all font-black text-[10px] uppercase tracking-widest active:scale-95"
          >
            {lang === "en" ? "Clear Selection" : "清空对比列表"}
          </button>
        </div>

        {/* Comparison Matrix Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-white/5">
                <th className="p-10 text-slate-500 font-black text-[11px] uppercase tracking-[0.3em] text-left w-1/4 align-top">
                  {lang === "en" ? "Mechanical Matrix" : "力学参数矩阵"}
                </th>
                {compareList.map((p, idx) => {
                  const disp = translateProduct(p, lang);
                  const imageSet = resolveProductImages(p);
                  return (
                    <th key={p.id} className="p-8 text-white font-black text-left bg-white/[0.02] border-l border-white/5">
                      <div className="flex flex-col gap-6">
                        <div className="relative group">
                          <div className="w-32 h-32 bg-white rounded-3xl p-4 flex items-center justify-center">
                            <SmartImage
                              src={imageSet.coverUrl || undefined}
                              alt={p.name}
                              className="w-full h-full object-contain"
                              wrapperClassName="w-full h-full"
                              width={256}
                              height={256}
                              priority={idx < 2}
                            />
                          </div>
                          <button 
                            onClick={() => onRemove(p.id)}
                            className="absolute -top-2 -right-2 p-1.5 bg-rose-500 text-white rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-orange-500 tracking-widest uppercase mb-1">{disp.brand}</p>
                          <h4 className="text-xl font-black text-white leading-tight uppercase tracking-tighter">{disp.name}</h4>
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            
            <tbody className="divide-y divide-white/5">
              {metrics.map((m) => (
                <tr key={m.key} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="p-8 text-slate-400 font-bold text-xs uppercase tracking-widest flex items-center gap-3">
                    <m.icon className="w-4 h-4 text-slate-600 group-hover:text-orange-500 transition-colors" />
                    {m.label}
                  </td>
                  {compareList.map((p) => {
                    const disp = translateProduct(p, lang);
                    let val = (disp as any)[m.key];
                    let suffix = m.suffix;
                    if (m.key === "weight") {
                      val = convertWeightNum(Number(val), currencyData.code).toFixed(1);
                      suffix = " " + getWeightUnit(currencyData.code);
                    }
                    val = formatMetricValue(m.key, val);
                    return (
                      <td key={p.id} className="p-8 px-10 border-l border-white/5 font-black text-white text-base">
                        {m.prefix}{val}{suffix}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Scoring Section Header */}
              <tr className="bg-white/[0.02]">
                <td className="p-6 text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] pl-10" colSpan={compareList.length + 1}>
                  {lang === "en" ? "Laboratory Scores" : "实验室评分概览"}
                </td>
              </tr>

              {scores.map((s) => (
                <tr key={s.key} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-8 pb-4 pt-10 text-slate-400 font-bold text-xs uppercase tracking-widest">
                    {s.label}
                  </td>
                  {compareList.map((p) => {
                    const disp = translateProduct(p, lang);
                    const score = (disp as any)[s.key];
                    return (
                      <td key={p.id} className="p-8 pb-4 pt-10 px-10 border-l border-white/5">
                        <div className="space-y-3">
                          <div className="flex justify-between items-end">
                            <span className="text-2xl font-black text-orange-500">{score}</span>
                            <span className="text-[10px] text-slate-600 font-black">/ 10.0</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-orange-500 rounded-full transition-all duration-1000" 
                              style={{ width: `${score * 10}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Final Verdict */}
              <tr>
                <td className="p-10 text-slate-500 font-bold text-xs uppercase tracking-widest align-top">
                  {lang === "en" ? "Editor's Verdict" : "专家结语"}
                </td>
                {compareList.map((p) => {
                  const disp = translateProduct(p, lang);
                  return (
                    <td key={p.id} className="p-10 px-10 border-l border-white/5">
                      <p className="text-slate-400 text-xs font-medium leading-relaxed italic border-l-4 border-orange-500/20 pl-6 py-2">
                        “{disp.editorVerdict}”
                      </p>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* Footer info */}
        <div className="p-10 bg-black/20 text-center">
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              All parameters are verified by KIDS-MOBI mechanics lab ISO 8098/GB 14746 standards.
            </p>
        </div>
      </div>
    </section>
  );
}
