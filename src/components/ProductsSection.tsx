import React, { useState, useMemo } from "react";
import { 
  Search, 
  Filter, 
  Scale, 
  CheckCircle2, 
  X, 
  Plus, 
  Maximize2, 
  ThumbsUp, 
  Bookmark, 
  BookOpen, 
  Info,
  DollarSign,
  ChevronRight,
  Star,
  ShieldCheck
} from "lucide-react";
import { Product, ProductCategory } from "../types";
import { translateProduct, translateCategory } from "../lib/translate";
import Breadcrumbs from "./Breadcrumbs";
import ComparisonDashboard from "./ComparisonDashboard";

interface ProductsSectionProps {
  productsData: Product[];
  onSelectProduct: (p: Product) => void;
  compareList: Product[];
  setCompareList: (list: Product[]) => void;
  savedProducts: Product[];
  setSavedProducts: (list: Product[]) => void;
  childProfile: any;
  userEmail: string;
  lang?: "zh" | "en";
}

export default function ProductsSection({
  productsData,
  onSelectProduct,
  compareList,
  setCompareList,
  savedProducts,
  setSavedProducts,
  childProfile,
  userEmail,
  lang = "zh"
}: ProductsSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("overallScore");
  const [showCompareDrawer, setShowCompareDrawer] = useState<boolean>(false);
  
  // Extra filters for PRD compliance
  const [selectedAge, setSelectedAge] = useState<string>("all"); // 'all', 'baby', 'toddler', 'child'
  const [selectedPrice, setSelectedPrice] = useState<string>("all"); // 'all', 'budget', 'mid', 'premium'

  // Dynamic filter label helper
  const getCategoryLabel = (cat: ProductCategory) => {
    return translateCategory(cat, lang);
  };

  const categories = lang === "en" ? [
    { id: "all", label: "📁 All Database" },
    { id: "balance", label: "🚲 Balance Bikes" },
    { id: "bicycle", label: "🚴 Pedal Bikes" },
    { id: "scooter", label: "🛹 Kick Scooters" },
    { id: "stroller", label: "👶 Baby Strollers" },
    { id: "electric_car", label: "⚡ Kids Electric Cars" },
    { id: "tricycle", label: "🧸 Tricycles" },
    { id: "safety_seat", label: "🛡️ Safety Seats" }
  ] : [
    { id: "all", label: "📁 全部产品" },
    { id: "balance", label: "🚲 平衡车" },
    { id: "bicycle", label: "🚴 自行车" },
    { id: "scooter", label: "🛹 滑板车" },
    { id: "stroller", label: "👶 推车" },
    { id: "electric_car", label: "⚡ 电动车" },
    { id: "tricycle", label: "🧸 三轮车" },
    { id: "safety_seat", label: "🛡️ 安全座椅" }
  ];

  // Filtering and sorting math
  const filteredProducts = useMemo(() => {
    return productsData
      .map(p => translateProduct(p, lang))
      .filter((p) => {
        const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
        const matchesSearch = searchQuery.trim() === "" ||
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.material.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.tireType.toLowerCase().includes(searchQuery.toLowerCase());
          
        let matchesAge = true;
        if (selectedAge !== "all") {
           const ageNum = parseFloat(p.ageRange.split("-")[0]);
           if (selectedAge === "baby") matchesAge = ageNum < 2;
           else if (selectedAge === "toddler") matchesAge = ageNum >= 2 && ageNum < 5;
           else if (selectedAge === "child") matchesAge = ageNum >= 5;
        }

        let matchesPrice = true;
        if (selectedPrice !== "all") {
           if (selectedPrice === "budget") matchesPrice = p.price < 500;
           else if (selectedPrice === "mid") matchesPrice = p.price >= 500 && p.price < 2000;
           else if (selectedPrice === "premium") matchesPrice = p.price >= 2000;
        }

        return matchesCategory && matchesSearch && matchesAge && matchesPrice;
      })
      .sort((a, b) => {
        if (sortBy === "overallScore") return b.overallScore - a.overallScore;
        if (sortBy === "weightAsc") return a.weight - b.weight;
        if (sortBy === "priceDesc") return b.price - a.price;
        if (sortBy === "priceAsc") return a.price - b.price;
        return 0;
      });
  }, [selectedCategory, searchQuery, sortBy, productsData, lang]);

  // Compare toggles (allows up to 3 items!)
  const handleToggleCompare = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    const exists = compareList.find(p => p.id === product.id);
    let newList: Product[] = [];
    if (exists) {
      newList = compareList.filter(p => p.id !== product.id);
    } else if (compareList.length >= 3) {
      if (lang === "en") {
        alert("Comparison Limit: For ideal display width, side-by-side matrices are capped at 3 models. Previous designs have been cycle replaced.");
      } else {
        alert("【对比上限提醒】为保证在移动和电脑端都能有极佳的阅读空间，横评对比最多支持 3 款同台哦！已自动替换较先加入的车款。");
      }
      newList = [compareList[1], compareList[2], product];
    } else {
      newList = [...compareList, product];
    }
    setCompareList(newList);
  };

  // Saved / Bookmark toggles
  const handleToggleSave = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userEmail) {
      if (lang === "en") {
        alert("Saved List is a free premium feature. Please click 'Register / Log in' at the top to secure an account!");
      } else {
        alert("【会员注册提醒】保存方案为专属免费特权。请点顶部‘注册登录’注册一个哈希受保护邮箱，即可秒速锁解锁特权！");
      }
      return;
    }

    const alreadySaved = savedProducts.some(s => s.id === product.id);
    if (alreadySaved) {
      setSavedProducts(savedProducts.filter(s => s.id !== product.id));
      if (lang === "en") {
        alert(`Successfully removed [${product.name}] from your saved list.`);
      } else {
        alert(`已成功将 [${product.name}] 从您的会员个人库中移除。`);
      }
    } else {
      setSavedProducts([...savedProducts, product]);
      if (lang === "en") {
        alert(`Successfully saved [${product.name}]! You can download high-res PDF datasheets dynamically inside user panel.`);
      } else {
        alert(`已成功将 [${product.name}] 妥加储存在您的会员数据库中！您可以前往“会员中心”一键下载 PDF 高清报告。`);
      }
    }
  };

  return (
    <div id="product_library" className="space-y-8 animate-fade-in text-left">
      
      {/* Breadcrumbs (PRD 4.2.2) */}
      <Breadcrumbs 
        lang={lang} 
        onHomeClick={() => (window as any).setActiveTab?.("home")}
        items={[{ label: lang === "zh" ? "产品大全" : "PRODUCT DATABASE", active: true }]} 
      />

      {/* Upper description */}
      <section className="text-center max-w-2xl mx-auto space-y-4">
        <div className="flex justify-center">
          <div className="bg-orange-100 p-3 rounded-2xl">
            <BookOpen className="w-6 h-6 text-orange-500" />
          </div>
        </div>
        <h2 className="text-3xl font-black text-slate-900">
          {lang === "en" ? "Explore the Best Rides" : "好车发现大厅"}
        </h2>
        <p className="text-sm text-slate-500 font-medium">
          {lang === "en" 
            ? "We've hand-picked and tested the safest models for your little one." 
            : "每一款入库产品都经过专人实测，只为给宝宝选择最合适的那一辆。"}
        </p>
      </section>

      {/* Control panel */}
      <div className="bg-white border border-slate-100 rounded-[48px] p-10 shadow-2xl shadow-orange-500/5 space-y-8 text-left relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-full -mr-16 -mt-16 opacity-50"></div>
        
        <div className="flex flex-col lg:flex-row gap-6 relative z-10">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-5 top-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === "en" ? "SEARCH GLOBAL DATABASE..." : "搜索全球高端数据库..."}
              className="w-full bg-slate-50 border border-slate-100 rounded-[28px] pl-14 pr-6 py-4.5 text-sm text-slate-900 font-bold placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:bg-white transition-all uppercase tracking-tighter"
            />
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-50 border border-slate-100 rounded-[28px] px-8 py-4.5 text-[10px] text-slate-900 font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-orange-500/10 cursor-pointer appearance-none"
          >
            <option value="overallScore">{lang === "en" ? "🏆 TOP RATED" : "🏆 专家综合推荐"}</option>
            <option value="weightAsc">{lang === "en" ? "⚖️ LIGHTWEIGHT" : "⚖️ 极轻量优先"}</option>
            <option value="priceDesc">{lang === "en" ? "💰 LUXURY FIRST" : "💰 顶级奢选"}</option>
            <option value="priceAsc">{lang === "en" ? "💎 BEST VALUE" : "💎 卓越性价比"}</option>
          </select>
        </div>

        {/* Categories tags list */}
        <div className="space-y-6 relative z-10">
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                  selectedCategory === c.id
                    ? "bg-orange-500 text-white border-orange-400 shadow-lg shadow-orange-500/20"
                    : "bg-white text-slate-400 border-slate-100 hover:border-slate-300 hover:text-slate-900"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-50 pt-6">
             <div className="space-y-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{lang === "zh" ? "适龄跨度" : "Age Bridge"}</span>
                <div className="flex gap-2">
                  {[
                    { id: "all", label: lang === "zh" ? "全部" : "ALL" },
                    { id: "baby", label: lang === "zh" ? "婴幼儿(0-2岁)" : "BABY" },
                    { id: "toddler", label: lang === "zh" ? "小童(2-5岁)" : "TODDLER" },
                    { id: "child", label: lang === "zh" ? "中大童(5岁+)" : "CHILD" },
                  ].map(age => (
                    <button 
                      key={age.id}
                      onClick={() => setSelectedAge(age.id)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-tight border transition-all ${
                        selectedAge === age.id ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-400 border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      {age.label}
                    </button>
                  ))}
                </div>
             </div>

             <div className="space-y-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{lang === "zh" ? "预算区间" : "Price Filter"}</span>
                <div className="flex gap-2">
                  {[
                    { id: "all", label: lang === "zh" ? "全部" : "ALL" },
                    { id: "budget", label: lang === "zh" ? "大众之选" : "BUDGET" },
                    { id: "mid", label: lang === "zh" ? "中端进阶" : "MID-RANGE" },
                    { id: "premium", label: lang === "zh" ? "极致奢选" : "PREMIUM" },
                  ].map(p => (
                    <button 
                      key={p.id}
                      onClick={() => setSelectedPrice(p.id)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-tight border transition-all ${
                        selectedPrice === p.id ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-400 border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
             </div>
          </div>
        </div>

      </div>

      {/* Comparison Dashboard (PRD Requirement: Automatic Detection) */}
      <ComparisonDashboard 
        compareList={compareList}
        lang={lang}
        onRemove={(id) => setCompareList(compareList.filter(p => p.id !== id))}
        onClear={() => setCompareList([])}
      />

      {/* Grid listing */}
      {filteredProducts.length === 0 ? (
        <div className="p-24 text-center bg-white border border-slate-100 rounded-[56px] shadow-sm">
          <p className="text-slate-400 font-black uppercase tracking-widest text-xs">
            {lang === "en" ? "No matches in global database" : "全球数据库中暂无匹配项"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredProducts.map((p) => {
            const diProduct = translateProduct(p, lang);
            const isWeightOver = (diProduct.category === "bicycle" || diProduct.category === "balance")
              ? diProduct.weight > childProfile.weight * 0.3
              : false;

            const isAlreadySaved = savedProducts.some(s => s.id === diProduct.id);
            const isAlreadyCompared = compareList.some(c => c.id === diProduct.id);

            return (
              <div
                key={diProduct.id}
                onClick={() => onSelectProduct(p)}
                className="bg-white border border-slate-100 hover:border-orange-100 rounded-[56px] p-8 flex flex-col justify-between space-y-8 hover:shadow-[0_48px_80px_-24px_rgba(249,115,22,0.12)] transition-all duration-500 group text-left cursor-pointer relative animate-fade-in overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-[60px] opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 -translate-y-4"></div>
                
                <div className="space-y-6 relative z-10">
                  <div className="flex justify-between items-center">
                    <span className="bg-orange-50 text-orange-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-orange-100">
                      {getCategoryLabel(diProduct.category)}
                    </span>
                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{diProduct.brand}</span>
                  </div>

                  <h3 className="font-black text-slate-900 text-xl leading-tight group-hover:text-orange-500 transition-colors uppercase">
                    {diProduct.name}
                  </h3>

                  <div className="grid grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-[32px] border border-slate-50 mt-2 group-hover:bg-white group-hover:shadow-lg group-hover:shadow-slate-200/50 transition-all">
                    <div className="space-y-1">
                      <span className="text-slate-400 block text-[9px] font-black uppercase tracking-widest">
                        {lang === "en" ? "MASS" : "自重"}
                      </span>
                      <strong className={`text-lg font-black tracking-tighter ${isWeightOver ? "text-orange-500" : "text-emerald-500"}`}>
                        {diProduct.weight} kg
                      </strong>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-400 block text-[9px] font-black uppercase tracking-widest">
                        {lang === "en" ? "EST. PRICE" : "参考"}
                      </span>
                      <strong className="text-lg text-slate-900 font-black tracking-tighter">
                        {lang === "en" ? "$" : "￥"}{diProduct.price}
                      </strong>
                    </div>
                  </div>

                  <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed font-bold italic">
                    “{diProduct.editorVerdict}”
                  </p>
                </div>

                {/* Card actions */}
                <div className="flex justify-between items-center gap-4 pt-6 border-t border-slate-50 relative z-10">
                  <div className="flex gap-3">
                    <button
                      onClick={(e) => handleToggleCompare(p, e)}
                      className={`p-3.5 rounded-2xl border transition-all active:scale-90 ${
                        isAlreadyCompared 
                          ? "bg-orange-500 border-orange-400 text-white shadow-xl shadow-orange-500/20"
                          : "bg-white border-slate-100 text-slate-400 hover:text-orange-500 hover:border-orange-200"
                      }`}
                    >
                      <Scale className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => handleToggleSave(p, e)}
                      className={`p-3.5 rounded-2xl border transition-all active:scale-90 ${
                        isAlreadySaved
                          ? "bg-rose-500 border-rose-400 text-white shadow-xl shadow-rose-500/20"
                          : "bg-white border-slate-100 text-slate-400 hover:text-rose-500 hover:border-rose-200"
                      }`}
                    >
                      <Bookmark className="w-5 h-5 fill-current" />
                    </button>
                  </div>
                  <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-2 group-hover:gap-3 transition-all">
                    {lang === "en" ? "Full Metrics" : "完整参数"} <ChevronRight className="w-4 h-4" />
                  </span>
                </div>

              </div>
            );
          })}
        </div>
      )}


    </div>
  );
}
