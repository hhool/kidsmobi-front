import React, { useState } from "react";
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
  CircleEqual,
  Share2
} from "lucide-react";
import { Product, CurrencyData } from "../types";
import { translateProduct } from "../lib/translate";
import { convertUsdToCurrency } from "../lib/currency";
import { convertWeightNum, getWeightUnit } from "../lib/units";
import { resolveProductImages } from "../lib/productImages";
import { getProductImageAlt } from "../lib/productSeoText";
import { cleanVisibleSourceText } from "../lib/visibleText";
import SmartImage from "./common/SmartImage";

interface ComparisonDashboardProps {
  compareList: Product[];
  onRemove: (id: string) => void;
  onClear: () => void;
  lang?: "zh" | "en";
  currencyData: CurrencyData;
  onSelectProduct?: (p: Product) => void;
}

export default function ComparisonDashboard({
  compareList,
  onRemove,
  onClear,
  lang = "zh",
  currencyData,
  onSelectProduct
}: ComparisonDashboardProps) {
  const [onlyDifferences, setOnlyDifferences] = useState<boolean>(false);
  const [shareSuccess, setShareSuccess] = useState<boolean>(false);

  if (compareList.length === 0) return null;

  const formatScoreDisplay = (value: unknown): string => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return lang === "en" ? "N/A" : "--";
    }
    return numeric.toFixed(2);
  };

  const formatMetricValue = (key: string, value: unknown): string => {
    const text = String(value ?? "").trim();
    if (key === "ageRange" && (!text || /^all\s*ages?$/i.test(text) || /^confirm from source$/i.test(text))) {
      return lang === "en" ? "Confirm details" : "待确认";
    }
    return cleanVisibleSourceText(text) || (lang === "en" ? "Not specified" : "未标注");
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

  // Helper row difference extraction
  const getPreparedMetricValue = (product: Product, m: typeof metrics[0]): string => {
    const disp = translateProduct(product, lang);
    let val = (disp as any)[m.key];
    if (m.key === "weight") {
      val = convertWeightNum(Number(val), currencyData.code).toFixed(1);
    } else if (m.key === "price") {
      const converted = convertUsdToCurrency(val, currencyData);
      val = converted === null ? "" : converted.toFixed(2);
    }
    return formatMetricValue(m.key, val);
  };

  const isMetricRowAllSame = (m: typeof metrics[0]): boolean => {
    const vals = compareList.map(p => getPreparedMetricValue(p, m));
    return new Set(vals).size <= 1;
  };

  const isScoreRowAllSame = (s: typeof scores[0]): boolean => {
    const vals = compareList.map(p => {
      const disp = translateProduct(p, lang);
      return formatScoreDisplay((disp as any)[s.key]);
    });
    return new Set(vals).size <= 1;
  };

  const isVerdictRowAllSame = (): boolean => {
    const vals = compareList.map(p => {
      const disp = translateProduct(p, lang);
      return String(disp.editorVerdict || "").trim();
    });
    return new Set(vals).size <= 1;
  };

  const visibleMetrics = metrics.filter(m => !onlyDifferences || !isMetricRowAllSame(m));
  const visibleScores = scores.filter(s => !onlyDifferences || !isScoreRowAllSame(s));
  const showScoresHeader = visibleScores.length > 0;
  const showVerdictRow = !onlyDifferences || !isVerdictRowAllSame();

  // Social share linker helper
  const handleCopyShareLink = () => {
    const productIds = compareList.map(p => p.id).join(",");
    const shareUrl = `${window.location.origin}/compare?ids=${productIds}`;
    void navigator.clipboard.writeText(shareUrl).then(() => {
      setShareSuccess(true);
      window.setTimeout(() => setShareSuccess(false), 2000);
    });
  };

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
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Show Differences Only Toggle */}
            <div className="flex items-center gap-3 bg-white/5 px-5 py-3 rounded-2xl border border-white/10">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-300 animate-fade-in">
                <input
                  type="checkbox"
                  checked={onlyDifferences}
                  onChange={(e) => setOnlyDifferences(e.target.checked)}
                  className="rounded border-white/15 bg-white/5 text-orange-500 focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer accent-orange-500"
                />
                <span>{lang === "en" ? "Show Differences Only" : "仅显示差异项"}</span>
              </label>
            </div>

            {/* Social Share Button */}
            <button
              onClick={handleCopyShareLink}
              className={`px-5 py-3 rounded-2xl flex items-center gap-2 border text-[10px] font-black uppercase tracking-widest transition-all ${
                shareSuccess 
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-black animate-fade-in"
                  : "bg-white/5 text-slate-400 border-white/10 hover:text-white hover:bg-white/10 cursor-pointer"
              }`}
            >
              <Share2 className="w-4 h-4" />
              {shareSuccess 
                ? (lang === "en" ? "Copied!" : "链接已复制！") 
                : (lang === "en" ? "Share Link" : "分享对比页链接")}
            </button>

            <button 
              onClick={onClear}
              className="px-6 py-3 bg-white/5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 rounded-2xl border border-white/10 hover:border-rose-500/20 transition-all font-black text-[10px] uppercase tracking-widest active:scale-95 cursor-pointer"
            >
              {lang === "en" ? "Clear" : "清空对比列表"}
            </button>
          </div>
        </div>

        {/* Comparison Matrix Table */}
        <div className="overflow-x-auto custom-scrollbar max-h-[85vh]">
          <table className="w-full text-sm border-collapse min-w-[800px]">
            <thead className="sticky top-0 z-30 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
              <tr className="border-b border-white/5 bg-slate-900/95 backdrop-blur-md">
                <th className="p-10 text-slate-500 font-black text-[11px] uppercase tracking-[0.3em] text-left w-1/4 align-top">
                  {lang === "en" ? "Mechanical Matrix" : "力学参数矩阵"}
                </th>
                {compareList.map((p, idx) => {
                  const disp = translateProduct(p, lang);
                  const imageSet = resolveProductImages(p);
                  return (
                    <th key={p.id} className="p-8 text-white font-black text-left bg-white/[0.01]/70 border-l border-white/5 align-top">
                      <div className="flex flex-col gap-4">
                        <div className="relative group self-start">
                          <div className="w-20 h-24 bg-white rounded-2xl p-2 flex items-center justify-center overflow-hidden">
                            <SmartImage
                              src={imageSet.coverUrl || undefined}
                              alt={getProductImageAlt(p)}
                              className="w-full h-full object-contain"
                              wrapperClassName="w-full h-full"
                              width={128}
                              height={128}
                              priority={idx < 2}
                            />
                          </div>
                          <button 
                            onClick={() => onRemove(p.id)}
                            className="absolute -top-1.5 -right-2 p-1 bg-rose-500 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-orange-500 tracking-widest uppercase mb-0.5">{disp.brand}</p>
                          <h4 className="text-sm font-black text-white leading-tight uppercase tracking-tighter line-clamp-2 max-w-[200px]" title={disp.name}>
                            {disp.name}
                          </h4>
                          <div className="mt-1 flex items-center gap-1">
                            <span className="text-[10px] text-amber-500">🧪 Score:</span>
                            <span className="text-[11px] text-white font-bold bg-white/5 px-1.5 py-0.5 rounded">
                              {(p.overallScore || 9.4).toFixed(1)}
                            </span>
                          </div>
                          {onSelectProduct && (
                            <button
                              onClick={() => {
                                onSelectProduct(p);
                              }}
                              className="mt-3 w-full max-w-[160px] py-2 px-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-[10px] font-black uppercase tracking-widest text-white text-center transition-all shadow-lg shadow-orange-500/15 active:scale-95 cursor-pointer"
                            >
                              {lang === "en" ? "Read Review" : "查看测评"}
                            </button>
                          )}
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            
            <tbody className="divide-y divide-white/5">
              {visibleMetrics.map((m) => (
                <tr key={m.key} className="hover:bg-white/[0.015] transition-colors group">
                  <td className="p-8 text-slate-400 font-bold text-xs uppercase tracking-widest flex items-center gap-3 bg-slate-900/40">
                    <m.icon className="w-4 h-4 text-slate-600 group-hover:text-orange-500 transition-colors" />
                    {m.label}
                  </td>
                  {compareList.map((p) => {
                    const val = getPreparedMetricValue(p, m);
                    let suffix = m.suffix;
                    if (m.key === "weight") {
                      suffix = " " + getWeightUnit(currencyData.code);
                    }
                    return (
                      <td key={p.id} className="p-8 px-10 border-l border-white/5 font-black text-white text-base">
                        {m.prefix}{val}{suffix}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Scoring Section Header */}
              {showScoresHeader && (
                <tr className="bg-white/[0.02]">
                  <td className="p-6 text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] pl-10" colSpan={compareList.length + 1}>
                    {lang === "en" ? "Laboratory Scores" : "实验室评分概览"}
                  </td>
                </tr>
              )}

              {visibleScores.map((s) => (
                <tr key={s.key} className="hover:bg-white/[0.015] transition-colors">
                  <td className="p-8 pb-4 pt-10 text-slate-400 font-bold text-xs uppercase tracking-widest bg-slate-900/40">
                    {s.label}
                  </td>
                  {compareList.map((p) => {
                    const disp = translateProduct(p, lang);
                    const score = (disp as any)[s.key];
                    return (
                      <td key={p.id} className="p-8 pb-4 pt-10 px-10 border-l border-white/5">
                        <div className="space-y-3">
                          <div className="flex justify-between items-end">
                            <span className="text-2xl font-black text-orange-500">{formatScoreDisplay(score)}</span>
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
              {showVerdictRow && (
                <tr>
                  <td className="p-10 text-slate-500 font-bold text-xs uppercase tracking-widest align-top bg-slate-900/40">
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
              )}
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
