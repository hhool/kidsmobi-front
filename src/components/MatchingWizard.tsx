import React, { useState, useMemo } from "react";
import { 
  Baby, 
  Map, 
  Wallet, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Star, 
  ShieldCheck,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { Product, CurrencyData } from "../types";
import { translateProduct } from "../lib/translate";

interface MatchingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  productsData: Product[];
  onSelectProduct: (p: Product) => void;
  lang?: "zh" | "en";
  currencyData: CurrencyData;
}

type WizardStep = "age" | "environment" | "budget" | "results";

export default function MatchingWizard({
  isOpen,
  onClose,
  productsData,
  onSelectProduct,
  lang = "zh",
  currencyData
}: MatchingWizardProps) {
  const [step, setStep] = useState<WizardStep>("age");
  const [selections, setSelections] = useState({
    age: "",
    environment: "",
    budget: "" // affordable, standard, premium
  });

  if (!isOpen) return null;

  const ageOptions = [
    { id: "0-12m", zh: "0-12个月", en: "0-12 Months", desc: "新生儿/幼儿", category: "stroller" },
    { id: "1-2y", zh: "1-2岁", en: "1-2 Years", desc: "学步/平衡启蒙", category: "balance" },
    { id: "2-4y", zh: "2-4岁", en: "2-4 Years", desc: "平衡/技巧进阶", category: "balance" },
    { id: "4y+", zh: "4岁以上", en: "4+ Years", desc: "正式骑行", category: "bicycle" }
  ];

  const environmentOptions = [
    { id: "indoor", zh: "居家/室内", en: "Indoor/Home", icon: Baby },
    { id: "park", zh: "公园/平整路面", en: "Park/Pavement", icon: Map },
    { id: "trail", zh: "郊外/越野全地形", en: "Trail/Off-road", icon: ShieldCheck }
  ];

  const budgetOptions = [
    { id: "affordable", zh: "高性价比", en: "Budget Friendly", desc: "注重实用与耐用" },
    { id: "standard", zh: "主流精选", en: "Mid-range", desc: "平衡品牌与性能" },
    { id: "premium", zh: "顶尖旗舰", en: "Premium/Flagship", desc: "追求极致轻量与工艺" }
  ];

  const filteredResults = useMemo(() => {
    if (step !== "results") return [];

    let filtered = productsData;

    // 1. Filter by Category mapping from Age
    const selectedAge = ageOptions.find(a => a.id === selections.age);
    if (selectedAge) {
      if (selectedAge.category === "bicycle") {
        filtered = filtered.filter(p => p.category === "bicycle");
      } else if (selectedAge.category === "stroller") {
        filtered = filtered.filter(p => ["stroller", "tricycle"].includes(p.category));
      } else {
        filtered = filtered.filter(p => p.category === "balance");
      }
    }

    // 2. Filter by Price tier (very rough estimation based on existing data)
    // affordable < 1000, standard 1000-3000, premium > 3000 (CNY values assumed)
    if (selections.budget === "affordable") {
      filtered = filtered.filter(p => p.price < 1500);
    } else if (selections.budget === "standard") {
      filtered = filtered.filter(p => p.price >= 1500 && p.price <= 3500);
    } else if (selections.budget === "premium") {
      filtered = filtered.filter(p => p.price > 3500);
    }

    // 3. Environment (Filter by weight/tires)
    if (selections.environment === "trail") {
      filtered = filtered.filter(p => p.overallScore > 90); // Offroad needs higher build quality
    } else if (selections.environment === "indoor") {
      filtered = filtered.filter(p => p.weight < 5); // Indoor bikes should be light
    }

    return filtered.sort((a, b) => b.overallScore - a.overallScore).slice(0, 3);
  }, [step, selections, productsData]);

  const handleNext = () => {
    if (step === "age") setStep("environment");
    else if (step === "environment") setStep("budget");
    else if (step === "budget") setStep("results");
  };

  const handleBack = () => {
    if (step === "environment") setStep("age");
    else if (step === "budget") setStep("environment");
    else if (step === "results") setStep("budget");
  };

  const reset = () => {
    setStep("age");
    setSelections({ age: "", environment: "", budget: "" });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-xl bg-white rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-orange-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 leading-tight">
                {lang === "zh" ? "智能匹配向导" : "Smart Match Wizard"}
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                {lang === "zh" ? `第 ${step === "results" ? 4 : step === "age" ? 1 : step === "environment" ? 2 : 3} 步` : `Step ${step === "results" ? 4 : step === "age" ? 1 : step === "environment" ? 2 : 3}`} of 4
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 min-h-[400px]">
          
          {step === "age" && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-1">
                <h4 className="text-2xl font-black text-slate-900 leading-tight">{lang === "zh" ? "宝宝现在多大？" : "How old is your child?"}</h4>
                <p className="text-sm text-slate-500 font-medium">{lang === "zh" ? "年龄决定了合适的骑行姿态与轮距标准" : "Age determines the riding posture and wheel size."}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ageOptions.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setSelections(prev => ({...prev, age: opt.id}))}
                    className={`p-6 rounded-[32px] border-2 transition-all text-left flex flex-col gap-2 ${
                      selections.age === opt.id 
                        ? "border-orange-500 bg-orange-50/50 ring-4 ring-orange-500/10 scale-[1.02]" 
                        : "border-slate-100 hover:border-slate-200 bg-white"
                    }`}
                  >
                    <span className="font-black text-slate-900">{lang === "zh" ? opt.zh : opt.en}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === "environment" && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-1">
                <h4 className="text-2xl font-black text-slate-900 leading-tight">{lang === "zh" ? "主要在什么地方骑行？" : "Where will they mostly ride?"}</h4>
                <p className="text-sm text-slate-500 font-medium">{lang === "zh" ? "环境决定了对自重、抓地力及耐用度的要求" : "Environment impacts requirements for weight, grip, and durability."}</p>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {environmentOptions.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setSelections(prev => ({...prev, environment: opt.id}))}
                    className={`p-6 rounded-[32px] border-2 transition-all text-left flex items-center justify-between gap-6 ${
                      selections.environment === opt.id 
                        ? "border-orange-500 bg-orange-50/50 ring-4 ring-orange-500/10" 
                        : "border-slate-100 hover:border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl ${selections.environment === opt.id ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-400"}`}>
                        <opt.icon className="w-6 h-6" />
                      </div>
                      <span className="font-black text-slate-900">{lang === "zh" ? opt.zh : opt.en}</span>
                    </div>
                    {selections.environment === opt.id && <CheckCircle2 className="w-5 h-5 text-orange-500" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === "budget" && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-1">
                <h4 className="text-2xl font-black text-slate-900 leading-tight">{lang === "zh" ? "您的预期预算范围？" : "Your expected budget range?"}</h4>
                <p className="text-sm text-slate-500 font-medium">{lang === "zh" ? "我们将在此范围内为您锁定实验室最高分的单品" : "We will lock in the highest lab score items in this range."}</p>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {budgetOptions.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setSelections(prev => ({...prev, budget: opt.id}))}
                    className={`p-6 rounded-[32px] border-2 transition-all text-left flex items-center justify-between gap-6 ${
                      selections.budget === opt.id 
                        ? "border-orange-500 bg-orange-50/50 ring-4 ring-orange-500/10" 
                        : "border-slate-100 hover:border-slate-200 bg-white"
                    }`}
                  >
                    <div className="space-y-1">
                      <p className="font-black text-slate-900">{lang === "zh" ? opt.zh : opt.en}</p>
                      <p className="text-xs text-slate-400 font-medium">{opt.desc}</p>
                    </div>
                    {selections.budget === opt.id && <CheckCircle2 className="w-5 h-5 text-orange-500" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === "results" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black tracking-widest uppercase rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {lang === "zh" ? "匹配完成" : "MATCH COMPLETE"}
                </div>
                <h4 className="text-2xl font-black text-slate-900 leading-tight">
                  {lang === "zh" ? "实验室为您推荐以下车型" : "Lab Recommendations for You"}
                </h4>
                <p className="text-sm text-slate-500 font-medium">
                  {lang === "zh" ? "基于海量工效数据与您的需求筛选得出" : "Filtered based on ergonomic data and your needs."}
                </p>
              </div>
              
              <div className="space-y-4">
                {filteredResults.length > 0 ? (
                  filteredResults.map(p => {
                    const dp = translateProduct(p, lang);
                    return (
                      <div 
                        key={p.id}
                        onClick={() => onSelectProduct(p)}
                        className="p-4 bg-white border border-slate-100 rounded-3xl hover:border-orange-500 transition-all cursor-pointer flex items-center gap-4 group hover:shadow-xl shadow-sm"
                      >
                        <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center p-4 group-hover:bg-orange-50 transition-colors">
                          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black text-orange-500 tracking-widest uppercase">{dp.brand}</span>
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 fill-orange-500 text-orange-500" />
                              <span className="text-xs font-black">{p.overallScore}</span>
                            </div>
                          </div>
                          <h5 className="font-black text-slate-900 leading-tight truncate">{dp.name}</h5>
                          <p className="text-[10px] text-slate-400 font-bold uppercase truncate">{dp.categoryLabel}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-12 text-center bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs">
                      {lang === "zh" ? "暂无完美匹配项，建议放宽筛选条件" : "No exact matches. Try relaxing criteria."}
                    </p>
                  </div>
                )}
              </div>

              <button 
                onClick={reset}
                className="w-full py-4 text-slate-400 hover:text-orange-500 font-black text-[10px] uppercase tracking-widest transition-colors"
              >
                {lang === "zh" ? "重新匹配" : "Restart Wizard"}
              </button>
            </div>
          )}

        </div>

        {/* Footer Navigation */}
        {step !== "results" && (
          <div className="p-8 border-t border-slate-50 flex justify-between items-center bg-slate-50/50">
            {step !== "age" ? (
              <button 
                onClick={handleBack}
                className="flex items-center gap-2 px-6 py-3 text-slate-500 font-black text-xs uppercase tracking-widest hover:text-slate-900 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                {lang === "zh" ? "上一步" : "Back"}
              </button>
            ) : (
              <div /> // Spacer
            )}
            
            <button 
              onClick={handleNext}
              disabled={
                (step === "age" && !selections.age) ||
                (step === "environment" && !selections.environment) ||
                (step === "budget" && !selections.budget)
              }
              className="flex items-center gap-2 px-8 py-4 bg-slate-900 disabled:bg-slate-200 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-slate-900/10 transition-all hover:bg-orange-500 active:scale-95 disabled:scale-100"
            >
              {lang === "zh" ? "继续" : "Continue"}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
