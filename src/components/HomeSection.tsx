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
  ArrowRight
} from "lucide-react";
import { Product } from "../types";

interface HomeSectionProps {
  productsData: Product[];
  onSelectProduct: (p: Product) => void;
  setActiveTab: (tab: any) => void;
  childProfile: any;
  setChildProfile: (p: any) => void;
}

export default function HomeSection({
  productsData,
  onSelectProduct,
  setActiveTab,
  childProfile,
  setChildProfile
}: HomeSectionProps) {
  
  // Outstanding Hot Selected products (highly evaluated)
  const hotEvaluations = productsData.filter(p => p.overallScore >= 9.5).slice(0, 3);
  
  // Popular list for Quick Previews
  const popularProducts = productsData.slice(4, 9);

  return (
    <div id="home_layout" className="space-y-12">
      
      {/* 1. Slogan Hero Banner Area */}
      <section className="relative rounded-3xl bg-slate-900 overflow-hidden border border-slate-800 shadow-2xl p-8 sm:p-12 text-left max-w-5xl mx-auto">
        <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10 items-center">
          <div className="lg:col-span-8 space-y-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black uppercase rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" />
              全球专业母婴测试标准 · ISO 8098 制动校准
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-none">
              全球专业童车 <br />
              <span className="text-amber-500">第三方实测与选购</span>官网
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm max-w-xl leading-relaxed">
              对标全球高标准测试体系（BabyGearLab），提供多维物理Q值、安全握距、制动自锁等硬核工效参数评级。自费自购、零排名公关，捍卫千万宝宝的脊髓骨体健康与骑行防线！
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2 text-xs">
              <button 
                onClick={() => setActiveTab("calculator")}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl transition flex items-center justify-center gap-1 active:scale-95 shadow-lg shadow-amber-500/10"
              >
                智能安全算力箱 🔬
                <ArrowRight className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setActiveTab("products")}
                className="px-6 py-3 bg-slate-950 hover:bg-slate-850 text-slate-300 border border-slate-800 rounded-xl font-bold transition flex items-center justify-center gap-1.5"
              >
                在库全量数据库 📂
              </button>
            </div>
          </div>
          
          {/* Right column: Quick stat check box */}
          <div className="lg:col-span-4 bg-slate-950 border border-slate-850 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-amber-500 animate-pulse" />
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">物理安全雷达公示区</span>
            </div>
            <div className="space-y-3 text-[11px] text-slate-400">
              <div className="flex justify-between">
                <span>1. 全自研称重设备精密：</span>
                <strong className="text-green-400">±5g</strong>
              </div>
              <div className="flex justify-between">
                <span>2. 避震颠震疲劳测试：</span>
                <strong className="text-green-400">10万圈次</strong>
              </div>
              <div className="flex justify-between">
                <span>3. 重载防爆抓地摩擦：</span>
                <strong className="text-green-400">45 PSI</strong>
              </div>
              <div className="flex justify-between border-t border-slate-900 pt-3 text-slate-500">
                <span>4. 已公示第三方检测：</span>
                <strong className="text-amber-500">12 款爆品</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Real-time recall warning bar ticker to fit GDPR Section 4.2 */}
      <section className="bg-slate-900/60 border border-red-500/10 rounded-2xl p-4 flex items-center justify-between text-xs gap-4 max-w-5xl mx-auto">
        <div className="flex items-center gap-2.5 text-left">
          <div className="w-8 h-8 rounded-lg bg-red-400/10 flex items-center justify-center text-red-500 shrink-0">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <strong className="text-red-400 block font-bold">行业突发安全快讯 (Real-time Recall Alert)</strong>
            <span className="text-slate-400 text-[10px]">美国 CPSC 已对4款高碳钢重合金自行车发布倾斜侧翻砸碰警告。请家长计算车重比。</span>
          </div>
        </div>
        <button 
          onClick={() => setActiveTab("news")} 
          className="text-[10px] text-amber-500 hover:underline hover:text-amber-400 font-bold shrink-0"
        >
          查看合规报告 →
        </button>
      </section>

      {/* 3. Global Annual Rankings (PRD Section 4.4.4): 2026 年度童车物理勋章榜 */}
      <section className="space-y-6 max-w-5xl mx-auto text-left">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            2026 年度物理勋章金榜 (Annual Gold Rankings)
          </h3>
          <p className="text-xs text-slate-500">历时百天连续疲劳测试，筛选出各细分品类的安全优胜标兵</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {productsData.slice(0, 3).map((p, index) => (
            <div 
              key={p.id} 
              onClick={() => onSelectProduct(p)}
              className="bg-slate-900 border border-slate-800/80 hover:border-amber-400/20 rounded-2xl p-5 flex flex-col justify-between space-y-4 cursor-pointer hover:shadow-lg transition group relative overflow-hidden"
            >
              <div className="absolute right-0 top-0 bg-amber-500 text-slate-950 font-mono text-[10px] font-black px-2 py-0.5 rounded-bl">
                RANK #0{index + 1}
              </div>

              <div className="space-y-2">
                <span className="text-[10px] bg-slate-950 text-amber-500 p-1.5 rounded uppercase font-bold">{p.brand}</span>
                <h4 className="text-sm font-black text-white mt-1 group-hover:text-amber-400 transition-colors">{p.name}</h4>
                <p className="text-slate-400 text-[11px] line-clamp-3 leading-relaxed italic">“{p.editorVerdict}”</p>
              </div>

              <div className="flex justify-between items-center text-[10px] pt-3.5 border-t border-slate-850">
                <span className="text-slate-500">安全得分: <strong className="text-amber-500 font-mono font-bold">{p.safetyScore}</strong></span>
                <span className="text-amber-500 font-bold group-hover:underline">点击查看细节 →</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Hot Featured Evaluations section (PRD Section 4.4 - 评测中心精选成果) */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 max-w-5xl mx-auto text-left">
        <div className="flex justify-between items-center flex-wrap gap-2 pb-4 border-b border-slate-800/50">
          <div>
            <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              实验室主推：实测对比报告展示区
            </h3>
            <p className="text-xs text-slate-500">深入揭露低端变形拼接车材料弊病，宣扬正向工效学设计</p>
          </div>
          <button 
            onClick={() => setActiveTab("evaluations")}
            className="text-xs text-amber-500 hover:underline hover:text-amber-400 font-bold flex items-center gap-1"
          >
            评测中心全部报告 🔍
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-4">
            <span className="text-[9px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-black uppercase">实测甄别亮点</span>
            <h4 className="font-bold text-white text-sm sm:text-base">儿童前庭颈椎安全：为什么我们坚决抵制发泡实心轮胎？</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              在我们使用台式超高频颠震滚筒仪测量中，EVA实心发泡车胎的颠阻过滤率不足橡胶打气胎的 <strong>20%</strong>。多余的颤动震力将直接沿龙头骨架钻入幼童娇嫩的在耳蜗前庭系统，引发眩晕和抗拒骑车行为。
            </p>
            <button onClick={() => setActiveTab("news")} className="text-[10px] text-amber-500 hover:underline font-bold">查看完整无痛防震报告 →</button>
          </div>

          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 space-y-4">
            <span className="text-[9px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-black uppercase">避坑警示亮点</span>
            <h4 className="font-bold text-white text-sm sm:text-base">解密拼贴式「多合一变形滑滑车」的隐匿倾覆大坑</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              多功能拼接变形车存在着大量快速装配插销，在使用3个月后空滑公差会严重松脱，公厘偏转大于 12mm。重心设置过于迁就，过弯拐角极容易让人仰马翻直接侧翻。
            </p>
            <button onClick={() => setActiveTab("guides")} className="text-[10px] text-amber-500 hover:underline font-bold">查看一车多用物理缺陷研制论 →</button>
          </div>
        </div>
      </section>

      {/* 5. Full site tool shortcut banners (PRD Section 4.1.7) */}
      <section className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-3xl p-6 shadow-xl text-slate-950 text-left max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h3 className="text-lg font-black uppercase tracking-wide">💡 您的宝宝车型规格买对了吗？</h3>
            <p className="text-xs text-slate-900 leading-relaxed font-medium">
              输入宝宝身高，系统根据脚掌踩地阻尼、大腿五通宽度自动测定最适配轮径及最高的危险车身自重限制，立刻打开智能安全算力箱！
            </p>
          </div>
          <button 
            onClick={() => setActiveTab("calculator")}
            className="px-6 py-3 bg-slate-950 text-white font-black text-xs uppercase hover:bg-slate-850 rounded-xl transition shrink-0 active:scale-95"
          >
            立即匹配宝宝黄金规格
          </button>
        </div>
      </section>

    </div>
  );
}
