import React, { useMemo } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck, Scale, Star, X } from "lucide-react";
import { Product, Evaluation, CMSSettings } from "../types";
import { translateProduct } from "../lib/translate";
import { formatWeight } from "../lib/units";
import { resolveProductImages } from "../lib/productImages";
import { getProductImageAlt } from "../lib/productSeoText";
import SmartImage from "./common/SmartImage";
import Breadcrumbs from "./Breadcrumbs";

function clampText(value: string, maxLength: number) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).replace(/[\s,;:.!?-]+$/g, "")}...`;
}

function stripBrandPrefix(text: string, brand: string) {
  const normalizedText = String(text || "").trim();
  const normalizedBrand = String(brand || "").trim();
  if (!normalizedText || !normalizedBrand) return normalizedText;
  const escapedBrand = normalizedBrand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return normalizedText.replace(new RegExp(`^${escapedBrand}\\s+`, "i"), "").trim();
}

function compactModelSegment(name: string, lang: "zh" | "en") {
  const cleaned = String(name || "").replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  if (lang === "zh") return clampText(cleaned, 18);

  const tokens = cleaned.split(" ").filter(Boolean);
  const stopWords = new Set([
    "with",
    "for",
    "and",
    "lightweight",
    "compact",
    "travel",
    "airplane",
    "friendly",
    "approved",
    "fold",
    "folding",
    "stroller",
    "jogger",
    "system",
    "months",
    "month",
    "infant",
    "toddler"
  ]);

  const chosen: string[] = [];
  for (const token of tokens) {
    const normalized = token.toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (!normalized) continue;
    if (chosen.length > 0 && stopWords.has(normalized)) break;
    chosen.push(token.replace(/[^A-Za-z0-9-]/g, ""));
    if (chosen.length >= 3) break;
  }

  const fallback = tokens.slice(0, 2).join(" ");
  return (chosen.join(" ") || fallback || cleaned).trim();
}

function getCompactCompareCardName(product: Product, lang: "zh" | "en") {
  const pt = translateProduct(product, lang);
  const brand = String(pt.brand || product.brand || "").trim();
  const name = String(pt.name || product.name || "").trim();
  const model = compactModelSegment(stripBrandPrefix(name, brand), lang);
  return clampText(`${brand} ${model}`.trim(), lang === "en" ? 32 : 24);
}

export default function MultiCompareView({
  evaluation,
  productsData,
  lang,
  reviewTypeLabel,
  onHome,
  onBack,
  onReviewTypeClick,
  onSelectProduct
}: {
  evaluation: Evaluation;
  productsData: Product[];
  lang: "zh" | "en";
  reviewTypeLabel?: string;
  onHome?: () => void;
  onBack: () => void;
  onReviewTypeClick?: () => void;
  onSelectProduct: (p: Product) => void;
}) {
  const compProducts = useMemo(() => {
    if (!evaluation.productIds) return [];
    return evaluation.productIds
      .map(id => productsData.find(p => p.id === id))
      .filter(Boolean) as Product[];
  }, [evaluation, productsData]);

  const tEv = lang === "zh" ? evaluation.zh : evaluation.en;

  if (compProducts.length === 0) {
    return <div className="p-8 text-center text-slate-500 font-bold">Products not found matching this evaluation.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in text-left">
      <Breadcrumbs 
        lang={lang} 
        onHomeClick={onHome || onBack}
        items={[
          { label: lang === "zh" ? "评测中心" : "EVALUATION CENTER", onClick: onBack },
          { label: reviewTypeLabel || (lang === "zh" ? "多品横评" : "CROSS COMPARE"), onClick: onReviewTypeClick || onBack },
          { label: tEv.title, active: true }
        ]} 
      />

      <div className="bg-slate-900 text-white p-10 rounded-[48px] relative overflow-hidden shadow-2xl">
        <div className="relative z-10 text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex py-1 px-3 bg-white/10 rounded-full text-xs font-black tracking-widest uppercase">
            {evaluation.type === "ranking" ? "Top Ranking" : evaluation.type === "value" ? "Value Pick" : "Cross Comparison"}
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">{tEv.title}</h1>
          <p className="text-slate-300 font-medium leading-relaxed italic border-l-4 border-emerald-500 pl-4 text-left mx-auto max-w-2xl mt-6 pb-2">
            "{tEv.verdict}"
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[48px] border border-slate-100 p-8 shadow-sm">
        <h2 className="sr-only">{lang === "en" ? "Compared Products" : "对比产品"}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {compProducts.map((p, idx) => {
            const pt = translateProduct(p, lang);
            const imageSet = resolveProductImages(p);
            const compactName = getCompactCompareCardName(p, lang);
            return (
              <div key={p.id} className="bg-slate-50 border border-slate-100 rounded-[32px] p-6 relative flex flex-col group hover:border-emerald-500 transition-colors">
                <div className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-black absolute -top-4 -left-4 border-4 border-white shadow-sm z-10">
                  {idx + 1}
                </div>
                <div className="w-32 h-32 mx-auto bg-white rounded-3xl p-4 mb-6 shadow-sm group-hover:scale-105 transition-transform">
                  <SmartImage
                    src={imageSet.coverUrl || undefined}
                    alt={getProductImageAlt(p)}
                    className="w-full h-full object-contain"
                    wrapperClassName="w-full h-full"
                    width={256}
                    height={256}
                    priority={idx < 2}
                  />
                </div>
                <div className="text-center mb-6">
                  <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">{pt.brand}</p>
                  <h3 className="font-extrabold text-slate-900 mt-1" title={compactName}>{compactName}</h3>
                </div>
                
                <div className="space-y-3 mb-6 flex-1">
                  <div className="flex justify-between text-xs border-b border-slate-200/50 pb-2">
                    <span className="text-slate-500 font-bold">{lang === "en" ? "Weight" : "重量"}</span>
                    <span className="font-black text-slate-900">{formatWeight(p.weight, "USD")}</span>
                  </div>
                  <div className="flex justify-between text-xs border-b border-slate-200/50 pb-2">
                    <span className="text-slate-500 font-bold">{lang === "en" ? "Brakes" : "制动"}</span>
                    <span className="font-black text-slate-900 truncate max-w-[100px]" title={pt.brakeType}>{pt.brakeType}</span>
                  </div>
                  <div className="flex justify-between text-xs border-b border-slate-200/50 pb-2">
                    <span className="text-slate-500 font-bold">{lang === "en" ? "Tires" : "轮胎"}</span>
                    <span className="font-black text-slate-900 truncate max-w-[100px]" title={pt.tireType}>{pt.tireType}</span>
                  </div>
                </div>

                <div className="mb-6 space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Pros</h4>
                    <ul className="space-y-1">
                      {pt.pros?.slice(0, 2).map((pro, i) => (
                        <li key={i} className="text-xs font-medium text-slate-600 truncate bg-emerald-50 px-2 py-1 rounded" title={pro}>{pro}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-1"><X className="w-3 h-3"/> Cons</h4>
                    <ul className="space-y-1">
                      {pt.cons?.slice(0, 2).map((con, i) => (
                        <li key={i} className="text-xs font-medium text-slate-600 truncate bg-rose-50 px-2 py-1 rounded" title={con}>{con}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <button 
                  onClick={() => onSelectProduct(p)}
                  className="w-full mt-auto py-4 bg-slate-900 text-white font-black text-[10px] tracking-widest uppercase rounded-2xl hover:bg-slate-800 transition shadow-lg"
                  aria-label={lang === "en" ? "READ FULL REPORT ->" : "查看完整报告 ->"}
                >
                  <span>{lang === "en" ? "READ FULL REPORT ->" : "查看完整报告 ->"}</span>
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-12 p-8 bg-orange-50 rounded-[32px] border border-orange-100/50 text-orange-900">
           <h2 className="text-lg font-black mb-4 flex items-center gap-2 uppercase tracking-wide">
             <Star className="w-5 h-5 text-orange-500" />
             {lang === "en" ? "Overall Comparison Insights" : "评测室综合洞察"}
           </h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div>
               <h3 className="text-xs font-black text-orange-600 uppercase tracking-widest mb-3">Highlights</h3>
               <ul className="space-y-2 list-disc list-inside opacity-90 text-sm font-medium">
                 {tEv.pros.length > 0 ? tEv.pros.map((p, i) => <li key={i}>{p}</li>) : <li className="opacity-50">No data</li>}
               </ul>
             </div>
             <div>
               <h3 className="text-xs font-black text-rose-600 uppercase tracking-widest mb-3">Limitations</h3>
               <ul className="space-y-2 list-disc list-inside opacity-90 text-sm font-medium">
                 {tEv.cons.length > 0 ? tEv.cons.map((c, i) => <li key={i}>{c}</li>) : <li className="opacity-50">No data</li>}
               </ul>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
