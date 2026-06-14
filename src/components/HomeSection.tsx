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
import { useState } from "react";
import { Product, CurrencyData } from "../types";
import { translations, translateProduct } from "../lib/translate";
import MatchingWizard from "./MatchingWizard";

interface HomeSectionProps {
  productsData: Product[];
  onSelectProduct: (p: Product) => void;
  setActiveTab: (tab: any) => void;
  childProfile: any;
  setChildProfile: (p: any) => void;
  lang?: "zh" | "en";
  currencyData: CurrencyData;
}

export default function HomeSection({
  productsData,
  onSelectProduct,
  setActiveTab,
  childProfile,
  setChildProfile,
  lang = "zh",
  currencyData
}: HomeSectionProps) {
  
  const t = translations[lang];
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // Outstanding Selection (high scores)
  const topSelections = productsData.sort((a, b) => b.overallScore - a.overallScore).slice(0, 4);

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
            {lang === "zh" ? "客观科学评测" : "Objective Science,"} <br />
            <span className="text-orange-500">{lang === "zh" ? "您的信心之选" : "Parental Confidence"}</span>
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
                <p className="text-xl font-black text-slate-900 group-hover:text-orange-500 transition-colors">{award.winner?.name || "Evaluating..."}</p>
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
                className="bg-white p-8 rounded-[32px] border border-slate-100 hover:border-orange-500/30 hover:shadow-xl transition-all cursor-pointer group text-center space-y-4"
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

      {/* 4. Hot Products (热门产品) */}
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
            {lang === "zh" ? "进入数据库" : "View Database"} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {topSelections.map(p => {
             const dp = translateProduct(p, lang);
             return (
               <div 
                key={p.id} 
                onClick={() => onSelectProduct(p)}
                className="group cursor-pointer bg-white rounded-[32px] border border-slate-100 overflow-hidden hover:shadow-2xl transition-all"
               >
                 <div className="h-48 bg-slate-50 flex items-center justify-center group-hover:bg-orange-50 transition-colors p-8">
                    <Baby className="w-16 h-16 text-slate-200 group-hover:text-orange-500 transition-colors" />
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

      {/* 5. Real-time News (实时资讯) */}
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

      {/* 6. Buying Guide Quick Links (选购指南快捷入口) & 7. Global Tool Entry (全站工具入口) */}
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
              <div key={scene.id} onClick={() => setActiveTab("guides")} className="p-8 bg-white border border-slate-100 rounded-[32px] hover:border-orange-500 hover:shadow-xl transition-all cursor-pointer group">
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
               <div key={tool.id} onClick={() => setActiveTab(tool.id)} className="flex items-center gap-6 p-6 bg-slate-900 rounded-[32px] hover:bg-orange-500 transition-all cursor-pointer group border border-slate-800">
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
