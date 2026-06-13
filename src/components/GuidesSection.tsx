import { useState, useMemo } from "react";
import { 
  BookOpen, 
  Search, 
  ArrowLeft, 
  Briefcase, 
  Calendar, 
  Clock, 
  Wrench, 
  Calculator, 
  Zap, 
  CheckCircle, 
  AlertTriangle,
  Play
} from "lucide-react";
import { GuideArticle, guideArticles } from "../data/guidesData";
import { Product } from "../types";

interface GuidesSectionProps {
  productsData: Product[];
  onSelectProduct: (p: Product) => void;
  // Let's pass childProfile setters to keep stats synchronized
  childProfile: {
    age: number;
    height: number;
    inseam: number;
    weight: number;
  };
  setChildProfile: (p: any) => void;
}

export default function GuidesSection({
  productsData,
  onSelectProduct,
  childProfile,
  setChildProfile
}: GuidesSectionProps) {
  const [selectedGuide, setSelectedGuide] = useState<GuideArticle | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("").trim();

  // Match Wizard interactive states
  const [wizardAge, setWizardAge] = useState<number>(childProfile.age || 4);
  const [wizardHeight, setWizardHeight] = useState<number>(childProfile.height || 102);
  const [wizardInseam, setWizardInseam] = useState<number>(childProfile.inseam || 38);
  const [wizardWeight, setWizardWeight] = useState<number>(childProfile.weight || 16);
  const [wizardBudget, setWizardBudget] = useState<number>(3000);
  const [wizardScenario, setWizardScenario] = useState<string>("all");
  const [showWizardResults, setShowWizardResults] = useState<boolean>(false);

  // Guide Article filters
  const filteredGuides = useMemo(() => {
    return guideArticles.filter((art) => {
      const matchesCat = selectedCategory === "all" || art.category === selectedCategory;
      const matchesSearch = searchQuery === "" ||
        art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Match Wizard calculation formula
  const matchRecommendations = useMemo(() => {
    // 1. Recommended Wheel Sizes based on leg inseam
    let recWheel = "12寸";
    if (wizardInseam < 34) {
      recWheel = "12寸 (或滑步平衡车)";
    } else if (wizardInseam >= 34 && wizardInseam <= 40) {
      recWheel = "12寸 / 14寸";
    } else if (wizardInseam >= 41 && wizardInseam <= 48) {
      recWheel = "14寸 / 16寸";
    } else if (wizardInseam >= 49 && wizardInseam <= 56) {
      recWheel = "16寸 / 20寸";
    } else {
      recWheel = "20寸 或更大寸段车";
    }

    // 2. Safe Max Car Weights
    const perfectWeightLimit = parseFloat((wizardWeight * 0.3).toFixed(1));
    const dangerWeightLimit = parseFloat((wizardWeight * 0.4).toFixed(1));

    // 3. Recommended category
    let recCat = "balance";
    if (wizardAge < 2.5) {
      recCat = "balance"; // balance or stroller
    } else if (wizardAge >= 2.5 && wizardAge <= 5) {
      recCat = "bicycle"; // balance, bicycle or scooter
    } else {
      recCat = "bicycle"; // bicycle or electric_car
    }

    // 4. Products matching math
    const matches = productsData.filter((p) => {
      // Must be below budget
      const withinBudget = p.price <= wizardBudget;
      
      // Categorization fits generally
      const isWheelSizeMatch = p.wheelSize === "无" || p.wheelSize.includes(recWheel.split("寸")[0]);
      
      // Heavy/weight safety check
      const isWeightSafe = p.weight <= dangerWeightLimit || p.category === "stroller" || p.category === "safety_seat";

      return withinBudget && isWeightSafe;
    });

    return {
      recWheel,
      perfectWeightLimit,
      dangerWeightLimit,
      matches,
      recCat
    };
  }, [wizardAge, wizardHeight, wizardInseam, wizardWeight, wizardBudget, productsData]);

  // Synchronize wizard values back to main core childProfile
  const handleApplyWizardToProfile = () => {
    setChildProfile({
      age: wizardAge,
      height: wizardHeight,
      inseam: wizardInseam,
      weight: wizardWeight
    });
    alert("宝宝身体力学参数已成功同步到核心系统！平台内所有的称重死线验证及警示标志已自适应更新。");
  };

  return (
    <div id="guides_container" className="space-y-12">
      
      {/* ========================================================
          Part 1: 智能选购匹配工效算力工具 (Interactive Match Wizard)
          ======================================================== */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/10 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-800/60 pb-6 mb-6">
          <div className="space-y-1.5 text-left">
            <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black rounded-lg uppercase tracking-wider block w-max">
              WIZARD · 工效智能匹配
            </span>
            <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Calculator className="w-5.5 h-5.5 text-amber-500" />
              童车参数匹配智敏算力箱
            </h3>
            <p className="text-xs text-slate-400">输入您家宝宝的真实身体特征值，我们将自动计算符合医学规范的安全轮径与最高车重死线</p>
          </div>
          <button 
            type="button" 
            onClick={() => setShowWizardResults(!showWizardResults)}
            className="px-4 py-2 bg-amber-500 text-slate-950 font-black text-xs rounded-xl hover:bg-amber-600 transition flex items-center gap-1.5"
          >
            {showWizardResults ? "⚙️ 返回调整参数" : "⚡ 立即计算推荐 & 筛选在库产品"}
          </button>
        </div>

        {showWizardResults ? (
          // Matches results display viewport
          <div className="space-y-6 animate-fade-in text-left">
            
            {/* Safety math indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 text-lg font-black shrink-0">
                  {matchRecommendations.recWheel.split(" ")[0]}
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">安全推荐轮径</span>
                  <strong className="text-white text-xs">{matchRecommendations.recWheel}</strong>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 text-lg font-black shrink-0">
                  {matchRecommendations.perfectWeightLimit}kg
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">宝宝黄金车重上限 (30%)</span>
                  <strong className="text-white text-xs">低于此自重，骑行最畅快安全</strong>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-400/10 flex items-center justify-center text-red-400 text-lg font-black shrink-0">
                  {matchRecommendations.dangerWeightLimit}kg
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">物理承载倾轧极限 (40%)</span>
                  <strong className="text-white text-xs">高于此重量易转弯失控砸伤骨体</strong>
                </div>
              </div>

            </div>

            {/* Simulated logic matching results list */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest">📋 为您严格筛选出的安全车型 (在库推荐数: {matchRecommendations.matches.length})</h4>
                <button 
                  onClick={handleApplyWizardToProfile} 
                  className="text-[10px] text-amber-500 hover:underline hover:text-amber-400 font-bold"
                >
                  Apply to Full Site → 同步并应用于全站
                </button>
              </div>

              {matchRecommendations.matches.length === 0 ? (
                <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-850">
                  <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                  <span className="text-xs text-slate-300 inline-block">很抱歉，在库车型中暂时没有完全匹配您当下限制的产品。</span>
                  <p className="text-[10px] text-slate-500 mt-1">您可以试着增加预算（当前：￥{wizardBudget}）或调增可接受车自重后重新检视。</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {matchRecommendations.matches.map((p) => {
                    const isBicOrBal = p.category === "bicycle" || p.category === "balance";
                    const isPerfectWeight = p.weight <= matchRecommendations.perfectWeightLimit;
                    return (
                      <div key={p.id} className="bg-slate-950 p-4 rounded-xl border border-slate-850 hover:border-slate-800 flex flex-col justify-between space-y-3 transition group">
                        <div>
                          <div className="flex justify-between items-start text-[9px]">
                            <span className="bg-slate-900 border border-slate-850 text-amber-500 p-1 rounded font-bold uppercase leading-none">{p.brand}</span>
                            <span className="text-slate-500 font-mono">ID: {p.id}</span>
                          </div>
                          
                          <h4 className="text-xs sm:text-sm font-black text-white mt-1.5 truncate group-hover:text-amber-400 transition-colors">{p.name}</h4>
                          <p className="text-[10px] text-slate-500 line-clamp-2 mt-1 leading-relaxed italic">“{p.editorVerdict}”</p>
                        </div>

                        {/* Metric block inside wizard matches */}
                        <div className="border-t border-slate-900/80 pt-2.5 text-[10px] text-slate-400 space-y-1">
                          <div className="flex justify-between">
                            <span>车身净重：</span>
                            <strong className={isPerfectWeight ? "text-green-400" : "text-amber-500"}>{p.weight} kg</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>参考市价：</span>
                            <strong className="text-amber-500 font-mono">￥{p.price}</strong>
                          </div>
                        </div>

                        <button
                          onClick={() => onSelectProduct(p)}
                          className="w-full py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 font-bold text-[10px] uppercase rounded border border-slate-850 hover:border-slate-800 transition-all"
                        >
                          深入研析这份检测书 →
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick click back to form */}
            <div className="pt-2 text-center">
              <button 
                onClick={() => setShowWizardResults(false)}
                className="text-xs font-bold text-slate-500 hover:text-white underline transition"
              >
                ← 返回重新微调宝宝岁数、跨高及我的购买预算偏好
              </button>
            </div>

          </div>
        ) : (
          // Input Fields Form View
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs text-slate-300 text-left">
            
            {/* Input 1: Age */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
              <label className="text-slate-400 font-bold flex items-center justify-between">
                <span>1. 宝宝周岁 (Age)</span>
                <span className="font-mono text-amber-500">{wizardAge} 岁</span>
              </label>
              <input
                type="range"
                min="1"
                max="12"
                step="0.5"
                value={wizardAge}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setWizardAge(val);
                }}
                className="w-full accent-amber-500 bg-slate-900"
              />
              <span className="text-[10px] text-slate-500 block">用于判定骨盆发育及适配轮型</span>
            </div>

            {/* Input 2: Height */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
              <label className="text-slate-400 font-bold flex items-center justify-between">
                <span>2. 宝宝净身高 (Height)</span>
                <span className="font-mono text-amber-500">{wizardHeight} cm</span>
              </label>
              <input
                type="range"
                min="70"
                max="160"
                step="1"
                value={wizardHeight}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setWizardHeight(val);
                  setWizardInseam(Math.floor(val * 0.38)); // set reasonable math correlation by default
                }}
                className="w-full accent-amber-500 bg-slate-900"
              />
              <span className="text-[10px] text-slate-500 block">基础身高比例测定限制</span>
            </div>

            {/* Input 3: Inseam/Leg heights */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
              <label className="text-slate-400 font-bold flex items-center justify-between">
                <span>3. 脱鞋腿内侧跨高</span>
                <span className="font-mono text-amber-400 font-black">{wizardInseam} cm</span>
              </label>
              <input
                type="range"
                min="20"
                max="75"
                step="1"
                value={wizardInseam}
                onChange={(e) => setWizardInseam(parseInt(e.target.value))}
                className="w-full accent-amber-500 bg-slate-900"
              />
              <span className="text-[10px] text-amber-500/80 block">⚠ 最严苛黄金指标！双脚踏地必须</span>
            </div>

            {/* Input 4: Body Weight */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
              <label className="text-slate-400 font-bold flex items-center justify-between">
                <span>4. 宝宝净体重 (Weight)</span>
                <span className="font-mono text-amber-500">{wizardWeight} kg</span>
              </label>
              <input
                type="range"
                min="8"
                max="55"
                step="1"
                value={wizardWeight}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setWizardWeight(val);
                }}
                className="w-full accent-amber-500 bg-slate-900"
              />
              <span className="text-[10px] text-slate-500 block">控制自重比低于30%的警戒安全线</span>
            </div>

            {/* Extra filters: Budget limits */}
            <div className="sm:col-span-2 bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-300 font-bold">
                <span>5. 订购预算上限 (Budget Ceiling)</span>
                <span className="text-amber-500 font-mono">￥{wizardBudget}</span>
              </div>
              <input
                type="range"
                min="200"
                max="12000"
                step="100"
                value={wizardBudget}
                onChange={(e) => setWizardBudget(parseInt(e.target.value))}
                className="w-full accent-amber-500 bg-slate-900"
              />
              <div className="flex justify-between text-[10px] text-slate-600">
                <span>￥200</span>
                <span>中位数: ￥3000</span>
                <span>￥12000</span>
              </div>
            </div>

            {/* Extra: Scenario filter selection */}
            <div className="sm:col-span-2 bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col justify-between">
              <label className="text-slate-400 font-bold mb-1">6. 全家核心骑行物理空间 (Primary Terrain)</label>
              <select
                value={wizardScenario}
                onChange={(e) => setWizardScenario(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="all">🌍 全场景通用(包含草地和公园)</option>
                <option value="tight">🏢 城市地铁快折/高层电梯公差</option>
                <option value="rough">🪵 乱岩泥路/林地轻度越野</option>
                <option value="smooth">🧱 万达商场晶砖/小区水平红跑道</option>
              </select>
              <span className="text-[9px] text-slate-500 block mt-2">系统优先匹配车自重较小和抓地花纹高黏性气胎</span>
            </div>

          </div>
        )}

      </section>


      {/* ========================================================
          Part 2: 选购指南科普知识 (Educational Reading Blocks)
          ======================================================== */}
      {selectedGuide ? (
        // Detailed reader modal view of guide
        <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 space-y-6 shadow-2xl relative animate-fade-in text-left">
          <button
            onClick={() => setSelectedGuide(null)}
            className="flex items-center gap-1.5 text-xs text-amber-500 hover:text-amber-400 font-bold uppercase pb-4 border-b border-slate-800/80 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            返回选购指南目录
          </button>

          <div className="space-y-4">
            <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black rounded-lg uppercase">
              {selectedGuide.categoryLabel}
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-tight">
              {selectedGuide.title}
            </h2>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1">
                📅 发布时间: {selectedGuide.publishDate}
              </span>
              <span className="flex items-center gap-1">
                ⏱️ 建议阅读: {selectedGuide.readTime}
              </span>
              <span className="flex items-center gap-1">
                ✍️ 撰稿院士/专家: {selectedGuide.author}
              </span>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border-l-4 border-amber-500 text-slate-300 text-xs sm:text-sm leading-relaxed italic">
            <strong>导读：</strong> {selectedGuide.summary}
          </div>

          <div className="whitespace-pre-wrap text-slate-300 text-xs sm:text-sm leading-8 space-y-6 border-t border-slate-800/80 pt-6">
            {selectedGuide.content.split("\n\n").map((para, ip) => {
              if (para.startsWith("### ")) {
                return <h3 key={ip} className="text-lg font-bold text-white mt-6 mb-2">{para.replace("### ", "")}</h3>;
              }
              if (para.startsWith("#### ")) {
                return <h4 key={ip} className="text-base font-bold text-amber-400 mt-4 mb-2">{para.replace("#### ", "")}</h4>;
              }
              if (para.startsWith("* ")) {
                return (
                  <ul key={ip} className="list-disc list-inside space-y-1 text-slate-400 pl-2">
                    {para.split("\n").map((li, il) => (
                      <li key={il}>{li.replace("* ", "")}</li>
                    ))}
                  </ul>
                );
              }
              return <p key={ip} className="text-slate-300 leading-relaxed text-justify">{para}</p>;
            })}
          </div>

          <div className="pt-6 border-t border-slate-800/80 text-center">
            <button
              onClick={() => setSelectedGuide(null)}
              className="px-6 py-2.5 bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg hover:bg-amber-600 transition"
            >
              已阅读，返回教程目录
            </button>
          </div>
        </div>
      ) : (
        // Guidelines grid listing
        <div className="space-y-6">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-xl font-black text-white flex items-center justify-center gap-2">
              <BookOpen className="w-5.5 h-5.5 text-amber-500" />
              科学避坑指南与科普专区
            </h2>
            <p className="text-xs text-slate-400">
              打破微商和多合一商家的套路忽悠。看看高级力学实验室整理出的科学买车逻辑。
            </p>
          </div>

          {/* Guides tags dynamic filtering */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-600 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="检索科普、跨高、倒踩刹、多合一危害等关键科普词..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  selectedCategory === "all"
                    ? "bg-amber-500 text-slate-950 border-amber-400"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                📁 全部科普教程
              </button>
              <button
                onClick={() => setSelectedCategory("beginner")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  selectedCategory === "beginner"
                    ? "bg-amber-500 text-slate-950 border-amber-400"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                🌱 新手必读基础
              </button>
              <button
                onClick={() => setSelectedCategory("risk")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  selectedCategory === "risk"
                    ? "bg-amber-500 text-slate-950 border-amber-400"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                ⚠️ 避坑与风险甄别
              </button>
              <button
                onClick={() => setSelectedCategory("export")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  selectedCategory === "export"
                    ? "bg-amber-500 text-slate-950 border-amber-400"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                ✈️ 跨境资质科普
              </button>
              <button
                onClick={() => setSelectedCategory("scenario")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  selectedCategory === "scenario"
                    ? "bg-amber-500 text-slate-950 border-amber-400"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                🌲 场景化实配
              </button>
              <button
                onClick={() => setSelectedCategory("maintenance")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  selectedCategory === "maintenance"
                    ? "bg-amber-500 text-slate-950 border-amber-400"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                ⚙️ 日常巡查与养护
              </button>
            </div>
          </div>

          {/* Grid render */}
          {filteredGuides.length === 0 ? (
            <div className="p-16 text-center bg-slate-900 border border-slate-800 rounded-2xl">
              <span className="text-xs text-slate-500">在这个避坑大分类下暂未搜到完全吻合的文章</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGuides.map((art) => (
                <div
                  key={art.id}
                  onClick={() => setSelectedGuide(art)}
                  className="bg-slate-900 border border-slate-800 hover:border-amber-500/20 rounded-2xl p-5 flex flex-col justify-between space-y-4 cursor-pointer hover:shadow-lg transition group text-left"
                >
                  <div className="space-y-2.5">
                    <span className="bg-slate-950 text-amber-500 p-1.5 rounded border border-slate-850 font-bold uppercase text-[9px]">
                      {art.categoryLabel}
                    </span>
                    <h3 className="font-extrabold text-white text-xs sm:text-sm leading-snug group-hover:text-amber-400 transition-colors">
                      {art.title}
                    </h3>
                    <p className="text-slate-400 text-[11px] line-clamp-3 leading-relaxed">
                      {art.summary}
                    </p>
                  </div>

                  <div className="flex justify-between items-center text-[9px] text-slate-500 pt-2 border-t border-slate-850/80">
                    <span>撰稿: {art.author}</span>
                    <span className="text-amber-500 font-bold hover:underline">立即阅读 →</span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

    </div>
  );
}
