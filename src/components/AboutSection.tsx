import React from "react";
import { ShieldCheck, Award, MessageSquare, Flame, CheckCircle, Lock, Users, Handshake, ShieldAlert } from "lucide-react";
import Breadcrumbs from "./Breadcrumbs";
import SeoKeywordPanel from "./common/SeoKeywordPanel";

interface AboutSectionProps {
  lang?: "zh" | "en";
}

export default function AboutSection({ lang = "zh" }: AboutSectionProps) {
  const isEn = lang === "en";

  if (isEn) {
    return (
      <div id="about_main" className="space-y-8 animate-fade-in text-left">
        <h1 className="sr-only">Jogging Stroller, Balance Bike and Kids Scooter Safety Lab</h1>
        
        {/* Breadcrumbs (PRD 4.6.2) */}
        <Breadcrumbs 
          lang={lang} 
          onHomeClick={() => (window as any).setActiveTab?.("home")}
          items={[{ label: "ABOUT US", active: true }]} 
        />

        {/* Hero Banner */}
        <div className="relative bg-white border border-slate-100 rounded-[48px] overflow-hidden p-10 sm:p-16 shadow-xl shadow-orange-500/5 text-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-100/30 blur-[100px] rounded-full -mr-20 -mt-20"></div>
          
          <div className="space-y-6 relative z-10">
            <span className="px-4 py-1.5 bg-orange-50 border border-orange-100 text-orange-600 text-[10px] font-black uppercase rounded-full tracking-wider">
              ESTABLISHED IN 2026 · Independent Premium Platform
            </span>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              KIDSMOBI · Jogging Stroller <br />
              <span className="text-orange-500">Balance Bike & Kids Scooter Safety Lab</span>
            </h2>
            <p className="text-slate-500 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-medium">
              We audit jogging stroller, balance bike, toddler bike, kids scooter, and kids electric bike safety with independent methods to solve one simple question:
              <span className="text-slate-900 font-bold block"> "Is this design truly safe for your child's growth and healthy riding?"</span>
            </p>
            <SeoKeywordPanel
              variant="orange"
              keywords={[
                "stroller safety lab",
                "jogging stroller audit",
                "balance bike safety",
                "toddler bike ergonomics",
                "kids scooter testing",
                "kids electric bike review",
                "independent KIDSMOBI team",
              ]}
            />
          </div>
        </div>

        {/* The 4 Core Neutral Commitments */}
        <section className="space-y-10">
          <div className="text-center space-y-2">
            <h3 className="text-3xl font-black text-slate-900">4 Strict Core Commitments</h3>
            <p className="text-sm text-slate-500 font-medium tracking-wide">Free from commercial sponsorships, protecting selection integrity from the source</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <ShieldCheck className="w-6 h-6" />,
                title: "Anonymous Purchase",
                desc: "Every product is purchased anonymously on commercial platforms using our own funds. We refuse free manufacturer samples.",
                tag: "100% SELF-FUNDED"
              },
              {
                icon: <CheckCircle className="w-6 h-6" />,
                title: "Zero-Fee Rankings",
                desc: "Platform scores are derived mathematically from physical dimensions and safety coefficients. No PR adjustments allowed.",
                tag: "ALGORITHMIC FAIRNESS"
              },
              {
                icon: <Flame className="w-6 h-6" />,
                title: "Ad-Free Interface",
                desc: "No flashy banners or corporate tracking. We ensures a clean, focus-driven informational area for parents.",
                tag: "PREMIUM EXPERIENCE"
              },
              {
                icon: <Award className="w-6 h-6" />,
                title: "Full Transparency",
                desc: "Physical metrics, lab photos, and raw audit logs are fully filed and accessible for anyone seeking the truth.",
                tag: "FULLY TRACEABLE"
              }
            ].map((item, i) => (
              <div key={i} className="bg-white p-8 rounded-[40px] border border-slate-100 flex flex-col justify-between space-y-6 shadow-sm hover:shadow-xl transition-all">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500">
                    {item.icon}
                  </div>
                  <h4 className="font-black text-slate-900 text-lg">{item.title}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">
                    {item.desc}
                  </p>
                </div>
                <span className="text-[10px] text-orange-500 font-black tracking-widest">{item.tag}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Methodology */}
        <section className="bg-slate-50 border border-slate-100 rounded-[56px] p-8 sm:p-14 space-y-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-500 text-white rounded-2xl shadow-lg shadow-orange-500/20">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 uppercase">Evaluation Methodology</h3>
              <p className="text-sm text-slate-500 font-medium tracking-tight">Open sourcing our laboratory rigorous checking procedures.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { title: "1. Precision Weighing", desc: "We weigh products in full riding setup (including pedals/guards), ignoring optimistic factory values." },
              { title: "2. Braking Resistance", desc: "Using pressure sensors to measure hand-braking force. Grips requiring >5.5kg are flagged as unsafe." },
              { title: "3. Q-Factor Analysis", desc: "Measuring pedal horizontal distance. Excessive widths cause permanent pediatric joint strain." },
              { title: "4. Fatigue Testing", desc: "Simulated 100k+ impact cycles using hydraulic rigs to check for micro-cracks in weld points." }
             ].map((item, i) => (
              <div key={i} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                <h4 className="text-slate-900 font-black text-lg mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  {item.title}
                </h4>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Content Quality Control (PRD 4.6.4) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
                <h3 className="text-3xl font-black text-slate-900">Content Quality Control</h3>
                <p className="text-slate-500 font-medium leading-relaxed">
                    Our "Three-Phased Audit" ensures that every single sentence is verified by mechanics experts and pediatricians before publishing.
                </p>
                <ul className="space-y-4">
                    {[
                        "Standard Lab Protocols for every category",
                        "24/7 Monitoring for Product Recalls",
                        "Dynamic Data Updates for new models",
                        "Cross-checking by Independent Reviewers"
                    ].map(u => (
                        <li key={u} className="flex items-center gap-3 text-sm text-slate-600 font-bold">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                            {u}
                        </li>
                    ))}
                </ul>
            </div>
            <div className="bg-slate-900 p-8 rounded-[48px] text-white space-y-6 relative overflow-hidden">
                <ShieldAlert className="absolute top-10 right-10 w-24 h-24 text-white/5" />
                <h4 className="text-xl font-black italic">Lab Team Strength</h4>
                <div className="space-y-4 relative z-10">
                    <div className="flex items-center gap-4">
                        <Users className="w-8 h-8 text-orange-500" />
                        <div>
                            <p className="text-lg font-black tracking-tight">12+ Senior Engineers</p>
                            <p className="text-xs text-slate-400">Mechanical & Bio-mechanics</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Users className="w-8 h-8 text-orange-500" />
                        <div>
                            <p className="text-lg font-black tracking-tight">5 Pediatric Advisors</p>
                            <p className="text-xs text-slate-400">Ergonomics & Bone Health</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* Business Cooperation (PRD 4.6.4) */}
        <section className="bg-orange-50 rounded-[48px] p-10 sm:p-14 border border-orange-100 flex flex-col items-center text-center space-y-6">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/10">
                <Handshake className="w-8 h-8 text-orange-500" />
            </div>
            <h3 className="text-3xl font-black text-slate-900">Partnerships & Cooperation</h3>
            <p className="text-slate-500 text-sm font-medium max-w-xl leading-relaxed">
                We welcome meaningful collaborations that prioritize child safety. This includes lab certification sharing, industry report syndication, and media partnerships.
            </p>
            <div className="flex gap-4">
                <button className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-xl shadow-slate-900/10">
                    Contact Us
                </button>
            </div>
        </section>

        {/* Global GDPR */}
        <section className="bg-white p-10 rounded-[40px] border border-slate-100 text-center space-y-4 shadow-sm">
          <h4 className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Global Privacy & Security Notice</h4>
          <p className="text-xs text-slate-500 leading-relaxed max-w-3xl mx-auto font-medium">
            KIDSMOBI operates under a zero-tracker, zero-advertisement rulebook. Accounts and data are fully encrypted. We never share pediatric profiles or personal data with corporate affiliates.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div id="about_main" className="space-y-8 animate-fade-in text-left">
      <h1 className="sr-only">stroller 与 jogging stroller 安全实验室</h1>
      
    {/* Breadcrumbs (PRD 4.6.2) */}
    <Breadcrumbs 
      lang={lang} 
      onHomeClick={() => (window as any).setActiveTab?.("home")}
      items={[{ label: "关于我们", active: true }]} 
    />

      {/* Hero Banner */}
      <div className="relative bg-white border border-slate-100 rounded-[48px] overflow-hidden p-10 sm:p-16 shadow-xl shadow-orange-500/5 text-center">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-100/30 blur-[100px] rounded-full -mr-20 -mt-20"></div>
        
        <div className="space-y-6 relative z-10">
          <span className="px-4 py-1.5 bg-orange-50 border border-orange-100 text-orange-600 text-[10px] font-black uppercase rounded-full tracking-wider">
            ESTABLISHED IN 2026 · 高端垂直童车导购平台
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            KIDSMOBI · 高端垂直 <br />
            <span className="text-orange-500">高端垂直童车评测平台</span>
          </h2>
          <p className="text-slate-500 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-medium">
            我们100%对标全球最严苛的儿童健康测试体系，只为解答一个纯粹的问题：
            <span className="text-slate-900 font-bold block">“这辆车真的对宝宝的骨骼安全、健康骑行无害吗？”</span>
          </p>
          <SeoKeywordPanel
            variant="orange"
            keywords={[
              "jogging stroller 安全实验室",
              "balance bike 安全评测",
              "toddler bike 工效测试",
              "kids scooter 稳定性测试",
              "kids electric bike 安全审计",
            ]}
          />
        </div>
      </div>

      {/* The 4 Core Neutral Commitments */}
      <section className="space-y-10">
        <div className="text-center space-y-2">
          <h3 className="text-3xl font-black text-slate-900">4 大极严苛中立运营原则</h3>
          <p className="text-sm text-slate-500 font-medium tracking-wide">杜绝一切商业化侵染，用独立实测捍卫平台甄选公信力</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              icon: <ShieldCheck className="w-6 h-6" />,
              title: "匿名个人自购",
              desc: "全站评测涉及的所有车型，均通过匿名个人账号、自费全额付款采购。谢绝一切品牌赞助样车。",
              tag: "100% SELF-FUNDED"
            },
            {
              icon: <CheckCircle className="w-6 h-6" />,
              title: "算法公正评分",
              desc: "评分由 Q-Factor 物理间距、制动把阻力比、车重安全比（≤30%）等经典测算得出，严禁人工修改。",
              tag: "ALGORITHMIC FAIRNESS"
            },
            {
              icon: <Flame className="w-6 h-6" />,
              title: "零硬性广告",
              desc: "平台不接入任何横幅弹窗广告，拒绝品牌赞助首页推荐位。让家长的阅读体验回归纯净与安稳。",
              tag: "PREMIUM EXPERIENCE"
            },
            {
              icon: <Award className="w-6 h-6" />,
              title: "全流程可溯源",
              desc: "我们将实测日志、测重照片及原始数据全部长期备案，接受全国科研同行及消费者自提查验。",
              tag: "FULLY TRACEABLE"
            }
          ].map((item, i) => (
            <div key={i} className="bg-white p-8 rounded-[40px] border border-slate-100 flex flex-col justify-between space-y-6 shadow-sm hover:shadow-xl transition-all">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500">
                  {item.icon}
                </div>
                <h4 className="font-black text-slate-900 text-lg">{item.title}</h4>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  {item.desc}
                </p>
              </div>
              <span className="text-[10px] text-orange-500 font-black tracking-widest">{item.tag}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Methodology */}
      <section className="bg-slate-50 border border-slate-100 rounded-[56px] p-8 sm:p-14 space-y-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-500 text-white rounded-2xl shadow-lg shadow-orange-500/20">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 uppercase">测评体系与方法论</h3>
            <p className="text-sm text-slate-500 font-medium tracking-tight">我们如何确保实验数据的严谨性与 100% 可追溯性。</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            { title: "1. 真实整备测重 (±5g)", desc: "剥离厂商宣传水分。在标准湿度实验室中，对包含脚踏、护具在内的全装配状态进行精密称重。" },
            { title: "2. 刹力与握距实测", desc: "利用高精度压力传感器测定指捏阻力。如果握力需求超过 5.5kg，即判定为对学龄前儿童不安全的重闸。" },
            { title: "3. Q-Factor 跨宽判定", desc: "踏板间绝对水平偏距。Q-Factor 超标会强迫儿童膝关节内扣骑行，造成骨化中心的不可逆损伤。" },
            { title: "4. 高低频疲劳模拟", desc: "利用液压龙门架对骨架进行 10万次非对称冲击。通过超声波探测微晶断层裂纹以判定整车真实寿命。" }
           ].map((item, i) => (
            <div key={i} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
              <h4 className="text-slate-900 font-black text-lg mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                {item.title}
              </h4>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Content Quality Control (PRD 4.6.4) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
              <h3 className="text-3xl font-black text-slate-900">严格的内容质控体系</h3>
              <p className="text-slate-500 font-medium leading-relaxed">
                  KIDSMOBI 建立了一套涵盖“匿名采购、双盲实测、儿科审核”的三审机制。确保每一行技术评估结论都经得起科学推敲。
              </p>
              <ul className="space-y-4">
                  {[
                      "全品类标准化实测规程 (Standardized Protocol)",
                      "全球范围内的童车安全召回 24h 同步机制",
                      "基于新品入库的动态数据更新策略",
                      "独立行研员与资深家长的交叉验证"
                  ].map(u => (
                      <li key={u} className="flex items-center gap-3 text-sm text-slate-600 font-bold">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          {u}
                      </li>
                  ))}
              </ul>
          </div>
          <div className="bg-slate-900 p-8 rounded-[48px] text-white space-y-6 relative overflow-hidden">
              <ShieldAlert className="absolute top-10 right-10 w-24 h-24 text-white/5" />
              <h4 className="text-xl font-black italic">科研团队储备</h4>
              <div className="space-y-4 relative z-10 text-left">
                  <div className="flex items-center gap-4">
                      <Users className="w-8 h-8 text-orange-500" />
                      <div>
                          <p className="text-lg font-black tracking-tight">12 名资深机械工程师</p>
                          <p className="text-xs text-slate-400">专注生物力学与结构稳固度研究</p>
                      </div>
                  </div>
                  <div className="flex items-center gap-4">
                      <Users className="w-8 h-8 text-orange-500" />
                      <div>
                          <p className="text-lg font-black tracking-tight">5 名儿科工效咨询顾问</p>
                          <p className="text-xs text-slate-400">专注儿童骨骼发育与运动健康</p>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* Business Cooperation (PRD 4.6.4) */}
      <section className="bg-orange-50 rounded-[48px] p-10 sm:p-14 border border-orange-100 flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/10">
              <Handshake className="w-8 h-8 text-orange-500" />
          </div>
          <h3 className="text-3xl font-black text-slate-900">评测合作与媒体联动</h3>
          <p className="text-slate-500 text-sm font-medium max-w-xl leading-relaxed">
              我们欢迎任何以“守护儿童骑行安全”为前提的共建合作。包括实验室认证互认、行业报告联合发布以及媒体专项评测。
          </p>
          <div className="flex gap-4">
              <button className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-xl shadow-slate-900/10">
                  联系我们
              </button>
          </div>
      </section>

      {/* Global GDPR */}
      <section className="bg-white p-10 rounded-[40px] border border-slate-100 text-center space-y-4 shadow-sm">
        <h4 className="text-slate-400 font-black text-[10px] uppercase tracking-widest">隐私安全与权利申明</h4>
        <p className="text-xs text-slate-500 leading-relaxed max-w-3xl mx-auto font-medium">
          KIDSMOBI 秉承无广告、无强制收集隐私方案。我们不对读者的地理位置实施强制IP拦截，不对外分享任何个人特征或宝宝体测隐私数据。
        </p>
      </section>
    </div>
  );
}
