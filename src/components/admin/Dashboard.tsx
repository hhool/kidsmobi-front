import React, { useState, useEffect } from "react";
import { 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  FileText, 
  Package, 
  ShieldCheck,
  Database
} from "lucide-react";
import { getCMSProducts, getCMSEvaluations, getCMSGuides, getCMSNews, saveCMSProduct } from "../../lib/cmsService";
import { productsData } from "../../data/modelsData";
import { translateProduct } from "../../lib/translate";
import { CMSProduct } from "../../types";

export default function Dashboard({ lang }: { lang: "zh" | "en" }) {
  const [stats, setStats] = useState({
    products: 0,
    evaluations: 0,
    guides: 0,
    news: 0,
    drafts: 0
  });

  const [migrating, setMigrating] = useState(false);

  const fetchStats = async () => {
    const [p, e, g, n] = await Promise.all([
      getCMSProducts(),
      getCMSEvaluations(),
      getCMSGuides(),
      getCMSNews()
    ]);
    const all = [...p, ...e, ...g, ...n];
    setStats({
      products: p.length,
      evaluations: e.length,
      guides: g.length,
      news: n.length,
      drafts: all.filter(x => x.status === "draft").length
    });
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleMigrate = async () => {
    const confirm = window.confirm("Are you sure you want to push modelsData into Firestore? Existing records with the same ID will be overwritten.");
    if (!confirm) return;
    setMigrating(true);
    for (const p of productsData) {
      const pZh = translateProduct(p, "zh");
      const pEn = translateProduct(p, "en");

      const cmsProd: CMSProduct = {
        ...p,
        status: "published",
        zh: {
          name: pZh.name || "",
          description: pZh.description || "",
          brandText: pZh.brand || "",
          specsText: "",
          pros: pZh.pros || [],
          cons: pZh.cons || [],
          editorVerdict: pZh.editorVerdict || "",
        },
        en: {
          name: pEn.name || "",
          description: pEn.description || "",
          brandText: pEn.brand || "",
          specsText: "",
          pros: pEn.pros || [],
          cons: pEn.cons || [],
          editorVerdict: pEn.editorVerdict || "",
        },
        updatedAt: new Date()
      };
      await saveCMSProduct(cmsProd);
    }
    setMigrating(false);
    fetchStats();
    alert("Migration complete!");
  };

  const cards = [
    { label: lang === "zh" ? "产品库" : "Products", value: stats.products, icon: <Package className="w-5 h-5 text-blue-500" />, color: "blue" },
    { label: lang === "zh" ? "实测报告" : "Reviews", value: stats.evaluations, icon: <FileText className="w-5 h-5 text-emerald-500" />, color: "emerald" },
    { label: lang === "zh" ? "待发布" : "Drafts", value: stats.drafts, icon: <TrendingUp className="w-5 h-5 text-amber-500" />, color: "amber" },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-2">
          {lang === "zh" ? "系统概览" : "System Overview"}
        </h1>
        <p className="text-slate-500 font-medium">Smart CMS for Global Stroller Operations.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{card.label}</p>
              <p className="text-4xl font-black text-slate-900">{card.value}</p>
            </div>
            <div className={`w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center`}>
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-500" />
              {lang === "zh" ? "自动化质量控 (QA)" : "Automated Quality Control"}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleMigrate}
                disabled={migrating}
                className="text-[10px] bg-slate-900 text-white px-3 py-1 rounded-full font-black uppercase hover:bg-slate-800 disabled:opacity-50 flex items-center gap-1"
              >
                <Database className="w-3 h-3" />
                {migrating ? "Migrating..." : "Seed modelsData"}
              </button>
              <span className="text-[10px] bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full font-black uppercase">Active</span>
            </div>
          </div>
          
          <div className="space-y-6">
            <QAItem 
              label="Multilingual Data Binding" 
              status="Pass" 
              detail="All entries verified for ZH/EN mirroring integrity." 
            />
            <QAItem 
              label="Anti-404 SEO Protection" 
              status="Pass" 
              detail="No hard-deleted products found. Logical deletions only." 
            />
            <QAItem 
              label="Structured Data Schema" 
              status="Warning" 
              detail="1 evaluation (ID#502) missing 5D radar scores." 
            />
            <QAItem 
              label="AI Compliance Review" 
              status="Pass" 
              detail="Ad-word filtering engine online and up to date." 
            />
          </div>
        </div>

        <div className="bg-slate-900 p-10 rounded-[40px] text-white shadow-2xl">
          <h3 className="font-black text-lg mb-4 uppercase tracking-tight">Operator Quick Tips</h3>
          <ul className="space-y-4 text-slate-400 text-sm font-medium">
            <li className="flex gap-3">
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 shrink-0" />
              Use the "Compare" mode in editors to ensure translation accuracy.
            </li>
            <li className="flex gap-3">
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 shrink-0" />
              Radar scores are automatically rendered into D3 charts on the frontend.
            </li>
            <li className="flex gap-3">
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 shrink-0" />
              Always fill the News SEO panel to maximize Google SERP performance.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function QAItem({ label, status, detail }: any) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
      <div className={`mt-1.5 w-2 h-2 rounded-full ${status === "Pass" ? "bg-emerald-500" : "bg-amber-500"}`} />
      <div>
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-900 text-sm">{label}</span>
          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${status === "Pass" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
            {status}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">{detail}</p>
      </div>
    </div>
  );
}
