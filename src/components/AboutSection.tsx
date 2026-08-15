import React from "react";
import { ShieldCheck, Award, MessageSquare, Flame, CheckCircle, Lock, Users, Handshake, ShieldAlert } from "lucide-react";
import Breadcrumbs from "./Breadcrumbs";
import { getPageCopy } from "../config/pageCopy";

interface AboutSectionProps {
  lang?: "zh" | "en";
}

export default function AboutSection({ lang = "zh" }: AboutSectionProps) {
  const isEn = lang === "en";
  const aboutCopy = getPageCopy(lang).about;
  const aboutDate = "2026-08-15";
  const aboutStats = isEn
    ? [
        { value: "12", label: "senior engineers" },
        { value: "5", label: "pediatric advisors" },
        { value: "4", label: "audit checks" },
        { value: "2026-08-15", label: "content snapshot date" },
      ]
    : [
        { value: "12", label: "名资深机械工程师" },
        { value: "5", label: "名儿科工效顾问" },
        { value: "4", label: "项核心审查" },
        { value: "2026-08-15", label: "内容更新时间" },
      ];
  const auditRows = isEn
    ? [
        { check: "1. Precision weighing", evidence: "Full riding setup, including pedals and guards", why: "Keeps factory claims honest" },
        { check: "2. Braking resistance", evidence: "Pressure sensors on hand-brake force", why: "Shows whether a child can stop safely" },
        { check: "3. Q-factor analysis", evidence: "Pedal horizontal distance measurement", why: "Flags awkward or risky leg posture" },
        { check: "4. Fatigue testing", evidence: "100k+ impact cycles on hydraulic rigs", why: "Checks long-run frame durability" },
      ]
    : [
        { check: "1. 真实整备测重", evidence: "包含脚踏与护具的完整骑行状态", why: "避免厂商宣传值失真" },
        { check: "2. 刹力阻力实测", evidence: "使用压力传感器测定手刹阻力", why: "判断儿童是否能安全制停" },
        { check: "3. Q-Factor 跨宽分析", evidence: "测量踏板左右水平偏距", why: "识别不自然或高风险踩踏姿势" },
        { check: "4. 疲劳冲击测试", evidence: "液压台架 10 万次以上冲击循环", why: "检查车架长期耐久性" },
      ];

  if (isEn) {
    return (
      <div id="about_main" className="space-y-8 animate-fade-in text-left">
        {/* Breadcrumbs (PRD 4.6.2) */}
        <Breadcrumbs 
          lang={lang} 
          onHomeClick={() => (window as any).setActiveTab?.("home")}
          items={[{ label: aboutCopy.breadcrumb, active: true }]} 
        />

        {/* Hero Banner */}
        <section className="relative rounded-[48px] bg-slate-950 border border-slate-800 overflow-hidden p-10 sm:p-20 text-center max-w-7xl mx-auto shadow-2xl min-h-[480px] flex items-center justify-center">
          {/* Ambient background with dark overlay */}
          <div className="absolute inset-0 z-0">
            <div 
              className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
              style={{
                backgroundImage: `url("https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?q=80&w=1600&auto=format&fit=crop")`,
                opacity: 0.45
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-900/40 to-slate-950/90 mix-blend-multiply"></div>
            {/* Pulsing ambient indicators */}
            <div className="absolute top-0 left-1/4 w-72 h-72 bg-orange-500/10 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-[100px] animate-pulse delay-700"></div>
          </div>

          <div className="relative z-10 space-y-8 w-full max-w-4xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-500/15 border border-orange-500/30 text-orange-400 text-[10px] h-7 font-black uppercase tracking-widest rounded-full shadow-lg backdrop-blur-md">
              <ShieldCheck className="w-4 h-4 text-orange-400" />
              {aboutCopy.heroBadge}
            </div>
            
            <h1 className="km-page-title km-home-statement-title text-white max-w-5xl mx-auto drop-shadow-md">
              {aboutCopy.heroTitle}
            </h1>
            
            <p className="km-body-copy text-slate-200 text-xs sm:text-sm md:text-base max-w-3xl mx-auto font-semibold drop-shadow-sm">
              {aboutCopy.heroDesc}
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {aboutStats.map((item) => (
            <div key={item.label} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-2xl font-black text-slate-900">{item.value}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-slate-500">{item.label}</p>
            </div>
          ))}
        </section>

        {/* The 4 Core Neutral Commitments */}
        <section className="space-y-10">
          <div className="text-center space-y-2">
            <h2 className="km-section-title text-slate-900">What makes our recommendations trustworthy?</h2>
            <p className="km-heading-copy km-body-copy text-sm text-slate-500 font-medium tracking-wide">Short answer: every recommendation is self-funded, source-linked, and reviewed against the same 4-step audit rubric.</p>
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
                  <h3 className="font-black text-slate-900 text-lg">{item.title}</h3>
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
              <h2 className="km-section-title text-slate-900 uppercase">How do we test a kids scooter or toddler bike?</h2>
              <p className="km-heading-copy km-body-copy text-sm text-slate-500 font-medium tracking-tight">Short answer: we measure, compare, and record four physical checks before any editorial judgment is published.</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-[32px] border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-700 uppercase tracking-widest text-[10px]">
                <tr>
                  <th className="px-6 py-4">Check</th>
                  <th className="px-6 py-4">Evidence</th>
                  <th className="px-6 py-4">Why it matters</th>
                </tr>
              </thead>
              <tbody>
                {auditRows.map((row) => (
                  <tr key={row.check} className="border-t border-slate-100 align-top">
                    <td className="px-6 py-5 font-black text-slate-900">{row.check}</td>
                    <td className="px-6 py-5 text-slate-600">{row.evidence}</td>
                    <td className="px-6 py-5 text-slate-600">{row.why}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ol className="grid grid-cols-1 md:grid-cols-2 gap-4 list-decimal pl-6">
            {(
              isEn
                ? [
                    "Read the short answer first.",
                    "Check the source links next.",
                    "Compare the table against the product listing.",
                    "Treat the final recommendation as the result, not the starting point.",
                  ]
                : [
                    "先看短答结论。",
                    "再核对来源链接。",
                    "把表格与商品页面逐项比对。",
                    "把最终推荐当作结果，而不是起点。",
                  ]
            ).map((step) => (
              <li key={step} className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm text-slate-600 font-medium">
                {step}
              </li>
            ))}
          </ol>

          <div className="space-y-3">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Cited sources</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><a href="https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides" className="font-semibold underline decoration-orange-300 underline-offset-4">FTC Endorsement Guides</a> — disclosure baseline for recommendation pages</li>
              <li><a href="https://www.cpsc.gov/Business--Manufacturing/Business-Education/Business-Guidance/Childrens-Products" className="font-semibold underline decoration-orange-300 underline-offset-4">CPSC Children's Products Guidance</a> — children’s safety reference</li>
              <li><a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API" className="font-semibold underline decoration-orange-300 underline-offset-4">MDN Web Storage API</a> — browser storage reference for local drafts</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">What the sources say</h3>
            <figure className="m-0 rounded-[24px] border-l-4 border-orange-500 bg-orange-50 px-4 py-4">
              <blockquote cite="https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API" className="m-0">
                <p className="m-0 text-slate-700">“The Web Storage API provides mechanisms by which browsers can store key/value pairs.”</p>
              </blockquote>
              <figcaption className="mt-2 text-sm font-semibold text-slate-500">— MDN Web Storage API</figcaption>
            </figure>
          </div>
        </section>

        {/* Content Quality Control (PRD 4.6.4) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
            <h2 className="km-section-title text-slate-900">Content Quality Control</h2>
              <p className="km-heading-copy km-body-copy text-slate-500 font-medium">
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
              <h2 className="text-xl font-black italic">Who reviews the work?</h2>
                <div className="space-y-4 relative z-10">
                    <div className="flex items-center gap-4">
                        <Users className="w-8 h-8 text-orange-500" />
                        <div>
                            <p className="text-lg font-black tracking-tight">12 senior engineers</p>
                            <p className="text-xs text-slate-400">Mechanical & Bio-mechanics</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Users className="w-8 h-8 text-orange-500" />
                        <div>
                            <p className="text-lg font-black tracking-tight">5 pediatric advisors</p>
                            <p className="text-xs text-slate-400">Ergonomics & Bone Health</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <p className="max-w-3xl mx-auto text-center text-sm text-slate-500 leading-7 font-medium">
          Want to see our methodology applied to real products? Explore our latest{" "}
          <a href="/reviews" className="text-orange-500 hover:text-orange-600 font-black underline decoration-orange-200 underline-offset-4">
            kids scooter audits
          </a>
          {" "}and independent bike reviews, where BalanceBikeToddler turns mechanical testing data into practical safety guidance for families.
        </p>

        {/* Business Cooperation (PRD 4.6.4) */}
        <section className="bg-orange-50 rounded-[48px] p-10 sm:p-14 border border-orange-100 flex flex-col items-center text-center space-y-6">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/10">
                <Handshake className="w-8 h-8 text-orange-500" />
            </div>
            <h3 className="km-section-title text-slate-900">{aboutCopy.partnershipTitle}</h3>
            <p className="km-heading-copy km-body-copy text-slate-500 text-sm font-medium max-w-xl">
              {aboutCopy.partnershipDesc}
            </p>
            <div className="flex flex-col items-center gap-3">
                <a
                  href="mailto:contact@balancebiketoddler.com"
                  className="inline-flex items-center gap-3 px-10 py-5 bg-linear-to-r from-orange-500 via-orange-500 to-amber-500 text-white text-xs md:text-sm font-black uppercase tracking-widest rounded-full shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
                >
                  {aboutCopy.contactCta}
                </a>
                <a
                  href="mailto:contact@balancebiketoddler.com"
                  className="text-sm font-semibold text-slate-700 hover:text-orange-600 underline underline-offset-4 decoration-orange-300"
                >
                  contact@balancebiketoddler.com
                </a>
            </div>
        </section>

        {/* Global GDPR */}
        <section className="bg-white p-10 rounded-[40px] border border-slate-100 text-center space-y-4 shadow-sm">
          <h3 className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Global Privacy & Security Notice</h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-3xl mx-auto font-medium">
            BalanceBikeToddler operates under a zero-tracker, zero-advertisement rulebook. Accounts and data are fully encrypted. We never share pediatric profiles or personal data with corporate affiliates.
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
      items={[{ label: aboutCopy.breadcrumb, active: true }]} 
    />

      {/* Hero Banner */}
      <section className="relative rounded-[48px] bg-slate-950 border border-slate-800 overflow-hidden p-10 sm:p-20 text-center max-w-7xl mx-auto shadow-2xl min-h-[480px] flex items-center justify-center">
        {/* Ambient background with dark overlay */}
        <div className="absolute inset-0 z-0">
          <div 
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
            style={{
              backgroundImage: `url("https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?q=80&w=1600&auto=format&fit=crop")`,
              opacity: 0.45
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-900/40 to-slate-950/90 mix-blend-multiply"></div>
          {/* Pulsing ambient indicators */}
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-orange-500/10 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-[100px] animate-pulse delay-700"></div>
        </div>

        <div className="relative z-10 space-y-10 w-full">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-500/15 border border-orange-500/30 text-orange-400 text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg backdrop-blur-md">
            <ShieldCheck className="w-4 h-4 text-orange-400" />
            {aboutCopy.heroBadge}
          </div>
          
          <h2 className="km-page-title km-home-statement-title text-white max-w-5xl mx-auto drop-shadow-md">
            {aboutCopy.heroTitle}
          </h2>
          
          <p className="km-body-copy text-slate-200 text-xs sm:text-sm md:text-base max-w-3xl mx-auto font-semibold drop-shadow-sm">
            {aboutCopy.heroDesc}
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {aboutStats.map((item) => (
          <div key={item.label} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-2xl font-black text-slate-900">{item.value}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-slate-500">{item.label}</p>
          </div>
        ))}
      </section>

      {/* The 4 Core Neutral Commitments */}
      <section className="space-y-10">
        <div className="text-center space-y-2">
          <h3 className="km-section-title text-slate-900">为什么这些原则可信？</h3>
          <p className="km-heading-copy km-body-copy text-sm text-slate-500 font-medium tracking-wide">短答：全部由自购、实测、复核、公开记录四道环节构成。</p>
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
              desc: "将实测日志、测重照片及原始数据全部长期备案，接受全国科研同行及消费者自提查验。",
              tag: "FULLY TRACEABLE"
            }
          ].map((item, i) => (
            <div key={i} className="bg-white p-8 rounded-[40px] border border-slate-100 flex flex-col justify-between space-y-6 shadow-sm hover:shadow-xl transition-all">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500">
                  {item.icon}
                </div>
                <h3 className="font-black text-slate-900 text-lg">{item.title}</h3>
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
            <h3 className="km-section-title text-slate-900 uppercase">测评体系与方法论</h3>
            <p className="km-heading-copy km-body-copy text-sm text-slate-500 font-medium tracking-tight">如何确保实验数据的严谨性与 100% 可追溯性。</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-[32px] border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700 uppercase tracking-widest text-[10px]">
              <tr>
                <th className="px-6 py-4">项目</th>
                <th className="px-6 py-4">取证方式</th>
                <th className="px-6 py-4">意义</th>
              </tr>
            </thead>
            <tbody>
              {auditRows.map((row) => (
                <tr key={row.check} className="border-t border-slate-100 align-top">
                  <td className="px-6 py-5 font-black text-slate-900">{row.check}</td>
                  <td className="px-6 py-5 text-slate-600">{row.evidence}</td>
                  <td className="px-6 py-5 text-slate-600">{row.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ol className="grid grid-cols-1 md:grid-cols-2 gap-4 list-decimal pl-6">
          {[
            "先读短答结论，再看细节表格。",
            "把来源链接和表格内容一起核对。",
            "用同一套标准比较不同产品。",
            "最后再看推荐是否适合孩子和家庭场景。",
          ].map((step) => (
            <li key={step} className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm text-slate-600 font-medium">
              {step}
            </li>
          ))}
        </ol>
      </section>

      {/* Content Quality Control (PRD 4.6.4) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
              <h3 className="km-section-title text-slate-900">严格的内容质控体系</h3>
              <p className="km-heading-copy km-body-copy text-slate-500 font-medium">
                  BalanceBikeToddler 建立了一套涵盖“匿名采购、双盲实测、儿科审核”的三审机制。确保每一行技术评估结论都经得起科学推敲。
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
              <h3 className="text-xl font-black italic">谁在复核结果？</h3>
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
            <h3 className="km-section-title text-slate-900">{aboutCopy.partnershipTitle}</h3>
          <p className="km-heading-copy km-body-copy text-slate-500 text-sm font-medium max-w-xl">
            {aboutCopy.partnershipDesc}
          </p>
          <div className="flex flex-col items-center gap-3">
                <a
                  href="mailto:contact@balancebiketoddler.com"
                  className="inline-flex items-center gap-3 px-10 py-5 bg-linear-to-r from-orange-500 via-orange-500 to-amber-500 text-white text-xs md:text-sm font-black uppercase tracking-widest rounded-full shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
                >
                  {aboutCopy.contactCta}
              </a>
              <a
                href="mailto:contact@balancebiketoddler.com"
                className="text-sm font-semibold text-slate-700 hover:text-orange-600 underline underline-offset-4 decoration-orange-300"
              >
                contact@balancebiketoddler.com
              </a>
          </div>
      </section>

      {/* Global GDPR */}
      <section className="bg-white p-10 rounded-[40px] border border-slate-100 text-center space-y-4 shadow-sm">
        <h3 className="text-slate-400 font-black text-[10px] uppercase tracking-widest">隐私安全与权利申明</h3>
        <p className="text-xs text-slate-500 leading-relaxed max-w-3xl mx-auto font-medium">
          BalanceBikeToddler 秉承无广告、无强制收集隐私方案。我们不对读者的地理位置实施强制IP拦截，不对外分享任何个人特征或宝宝体测隐私数据。
        </p>
      </section>
    </div>
  );
}
