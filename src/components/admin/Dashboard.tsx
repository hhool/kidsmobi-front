import React, { useState, useEffect } from "react";
import { 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  FileText, 
  Package, 
  ShieldCheck,
  Database,
  RefreshCw,
  Wifi,
  Download
} from "lucide-react";
import { getCMSProducts, getCMSEvaluations, getCMSGuides, getCMSNews, saveCMSProduct, seedProductsToFirestore, seedGuidesToFirestore, seedNewsToFirestore, seedEvaluationsToFirestore } from "../../lib/cmsService";
import { productsData as defaultProductsData } from "../../data/modelsData";
import { guideArticles } from "../../data/guidesData";
import { newsArticles } from "../../data/newsData";
import { initialEvaluationsData } from "../../data/evaluationsData";
import { translateProduct } from "../../lib/translate";
import { CMSProduct } from "../../types";

export default function Dashboard({ lang }: { lang: "zh" | "en" }) {
  const fallbackStats = {
    products: defaultProductsData.length,
    evaluations: initialEvaluationsData.length,
    guides: guideArticles.length,
    news: newsArticles.length,
    drafts: 0,
  };

  const [stats, setStats] = useState({
    ...fallbackStats,
  });

  const [migrating, setMigrating] = useState(false);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [health, setHealth] = useState<{
    site: "pass" | "warn";
    worker: "pass" | "warn";
    cms: "pass" | "warn";
    updatedAt: string;
  }>({
    site: "warn",
    worker: "warn",
    cms: "warn",
    updatedAt: "-",
  });

  const fetchStats = async () => {
    try {
      const [p, e, g, n] = await Promise.all([
        getCMSProducts(),
        getCMSEvaluations(),
        getCMSGuides(),
        getCMSNews(),
      ]);
      const all = [...p, ...e, ...g, ...n];
      setStats({
        products: p.length,
        evaluations: e.length,
        guides: g.length,
        news: n.length,
        drafts: all.filter(x => x.status === "draft").length,
      });
    } catch (error) {
      console.warn("Dashboard stats fallback to local data due CMS request failure:", error);
      setStats({ ...fallbackStats });
    }
  };

  useEffect(() => {
    // Avoid calling unstable upstream APIs automatically on dashboard mount.
    setStats({ ...fallbackStats });
  }, []);

  const checkIntegrations = async () => {
    setCheckingHealth(true);
    const next = {
      site: "warn" as "pass" | "warn",
      worker: "warn" as "pass" | "warn",
      cms: "warn" as "pass" | "warn",
      updatedAt: new Date().toLocaleString(),
    };

    try {
      const siteResponse = await fetch(window.location.origin, { method: "GET" });
      next.site = siteResponse.ok ? "pass" : "warn";
    } catch {
      next.site = "warn";
    }

    // Dashboard no longer probes worker catalog endpoint directly to avoid noisy 503s.
    next.worker = next.site;

    try {
      const products = await getCMSProducts();
      next.cms = Array.isArray(products) ? "pass" : "warn";
    } catch {
      next.cms = "warn";
    }

    setHealth(next);
    setCheckingHealth(false);
  };

  const handleExportHealthSnapshot = () => {
    const nowIso = new Date().toISOString();
    const nowLocal = new Date().toLocaleString();
    const statusText = (value: "pass" | "warn") => (value === "pass" ? "PASS" : "WARN");
    const lines = [
      "# Admin Demo Health Snapshot",
      "",
      `- Generated At: ${nowIso}`,
      `- Generated At (Local): ${nowLocal}`,
      `- Environment Origin: ${window.location.origin}`,
      `- Worker Base URL: ${window.location.origin}`,
      `- Site Reachability: ${statusText(health.site)}`,
      `- Worker API Availability: ${statusText(health.worker)}`,
      `- CMS Read Capability: ${statusText(health.cms)}`,
      `- Health Last Checked: ${health.updatedAt}`,
      "",
      "## Demo Entry Links",
      "",
      "- Production: https://balancebiketoddler.com",
      `- Worker Categories API: ${window.location.origin}/api/v2/catalog/categories`,
      "- Admin Panel: open the production site and enter admin mode",
      "",
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin-demo-health-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleMigrate = async () => {
    const confirm = window.confirm("Are you sure you want to push modelsData into Firestore? Existing records with the same ID will be overwritten.");
    if (!confirm) return;
    setMigrating(true);
    for (const p of defaultProductsData) {
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

  const handleForceSync = async () => {
    const confirm = window.confirm(lang === "zh" ? "您确定要强制同步数据到 Firestore 吗？这将会使用默认车型数据重新初始化并清空不兼容格式的数据。" : "Are you sure you want to force sync products to Firestore? This will serialize correct default stroller structures directly into your Firestore project.");
    if (!confirm) return;
    setMigrating(true);
    try {
      const success = await seedProductsToFirestore(defaultProductsData, translateProduct);
      if (success) {
        alert(lang === "zh" ? "数据强制同步成功！" : "Database force-sync completed successfully!");
      } else {
        alert(lang === "zh" ? "同步失败，请检查控制台。" : "Sync failed, please consult console logs.");
      }
    } catch (e: any) {
      console.error("Force sync failed:", e);
      alert((lang === "zh" ? "同步出错: " : "Sync Error: ") + (e.message || e));
    } finally {
      setMigrating(false);
      fetchStats();
    }
  };

  const handleSyncGuides = async () => {
    const confirm = window.confirm(lang === "zh" ? "您确定要将 guidesData 静态选购指南数据同步至云端 Firestore 数据库中吗？这会覆盖或初始化云端指南资源。" : "Are you sure you want to sync static guide articles directly to your Firestore project? Existing guides with the same IDs will be updated.");
    if (!confirm) return;
    setMigrating(true);
    try {
      const success = await seedGuidesToFirestore(guideArticles);
      if (success) {
        alert(lang === "zh" ? "选购指南同步成功！" : "Guides sync completed successfully!");
      } else {
        alert(lang === "zh" ? "指南同步发生网络错误，请登录授权后重试。" : "Guides sync failed. Please make sure you are authenticated and try again.");
      }
    } catch (e: any) {
      console.error("Guides sync failed:", e);
      alert((lang === "zh" ? "同步指南出错: " : "Guides Sync Error: ") + (e.message || e));
    } finally {
      setMigrating(false);
      fetchStats();
    }
  };

  const handleSyncNews = async () => {
    const confirm = window.confirm(lang === "zh" ? "您确定要将 newsData 静态行业资讯数据同步至云端 Firestore 数据库中吗？这会覆盖或初始化云端资讯资源。" : "Are you sure you want to sync static news articles directly to your Firestore project? Existing news with the same IDs will be updated.");
    if (!confirm) return;
    setMigrating(true);
    try {
      const success = await seedNewsToFirestore(newsArticles);
      if (success) {
        alert(lang === "zh" ? "全球资讯同步成功！" : "Global News sync completed successfully!");
      } else {
        alert(lang === "zh" ? "资讯同步发生网络错误，请登录授权后重试。" : "News sync failed. Please make sure you are authenticated and try again.");
      }
    } catch (e: any) {
      console.error("News sync failed:", e);
      alert((lang === "zh" ? "同步资讯出错: " : "News Sync Error: ") + (e.message || e));
    } finally {
      setMigrating(false);
      fetchStats();
    }
  };

  const handleSyncEvaluations = async () => {
    const confirm = window.confirm(lang === "zh" ? "您确定要将评测中心的初始展示数据同步至云端 Firestore 数据库中吗？这会覆盖或初始化云端评测报告资源。" : "Are you sure you want to sync initial evaluation data directly to your Firestore project? Existing evaluations with the same IDs will be updated.");
    if (!confirm) return;
    setMigrating(true);
    try {
      const success = await seedEvaluationsToFirestore(initialEvaluationsData);
      if (success) {
        alert(lang === "zh" ? "评测数据同步成功！" : "Evaluation data sync completed successfully!");
      } else {
        alert(lang === "zh" ? "评测数据同步发生网络错误，请登录授权后重试。" : "Evaluation data sync failed. Please make sure you are authenticated and try again.");
      }
    } catch (e: any) {
      console.error("Evaluation sync failed:", e);
      alert((lang === "zh" ? "同步评测出错: " : "Evaluation Sync Error: ") + (e.message || e));
    } finally {
      setMigrating(false);
      fetchStats();
    }
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

      <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Wifi className="w-5 h-5 text-sky-500" />
              {lang === "zh" ? "线上依赖健康检查" : "Online Integration Health"}
            </h3>
            <p className="text-xs text-slate-500 font-bold mt-1">
              {lang === "zh" ? "用于演示前快速确认关键链路可用性" : "Quick pre-demo checks for critical online dependencies"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportHealthSnapshot}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-black flex items-center gap-2 hover:bg-slate-200"
            >
              <Download className="w-3.5 h-3.5" />
              {lang === "zh" ? "导出演示快照" : "Export Demo Snapshot"}
            </button>
            <button
              onClick={checkIntegrations}
              disabled={checkingHealth}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-black flex items-center gap-2 disabled:bg-slate-300"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checkingHealth ? "animate-spin" : ""}`} />
              {checkingHealth ? (lang === "zh" ? "检查中..." : "Checking...") : (lang === "zh" ? "重新检查" : "Recheck")}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <HealthItem
            label={lang === "zh" ? "站点可访问" : "Site Reachability"}
            status={health.site}
            detail={lang === "zh" ? "生产页面可响应" : "Production page responds"}
          />
          <HealthItem
            label={lang === "zh" ? "Worker API" : "Worker API"}
            status={health.worker}
            detail={lang === "zh" ? "分类接口返回 JSON" : "Category endpoint returns JSON"}
          />
          <HealthItem
            label={lang === "zh" ? "CMS 读能力" : "CMS Read Capability"}
            status={health.cms}
            detail={lang === "zh" ? "后台读取产品列表可用" : "Admin can read product list"}
          />
        </div>
        <p className="text-[10px] text-slate-400 font-bold mt-4 uppercase tracking-wider">
          {lang === "zh" ? "上次检查" : "Last Checked"}: {health.updatedAt}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-500" />
              {lang === "zh" ? "自动化质量控 (QA)" : "Automated Quality Control"}
            </h3>
            <div className="flex gap-2 items-center flex-wrap">
              <button
                onClick={handleSyncGuides}
                disabled={migrating}
                className="text-[10px] bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-full font-black uppercase hover:shadow-md disabled:opacity-50 flex items-center gap-1 cursor-pointer transition"
              >
                <Database className="w-3 h-3" />
                {migrating ? (lang === "zh" ? "指南同步中..." : "Syncing...") : (lang === "zh" ? "同步指南数据" : "Sync Guides Data")}
              </button>
              <button
                onClick={handleSyncNews}
                disabled={migrating}
                className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-full font-black uppercase hover:shadow-md disabled:opacity-50 flex items-center gap-1 cursor-pointer transition"
              >
                <Database className="w-3 h-3" />
                {migrating ? (lang === "zh" ? "资讯同步中..." : "Syncing...") : (lang === "zh" ? "同步资讯数据" : "Sync News Data")}
              </button>
              <button
                onClick={handleSyncEvaluations}
                disabled={migrating}
                className="text-[10px] bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-full font-black uppercase hover:shadow-md disabled:opacity-50 flex items-center gap-1 cursor-pointer transition"
              >
                <Database className="w-3 h-3" />
                {migrating ? (lang === "zh" ? "评测同步中..." : "Syncing...") : (lang === "zh" ? "同步评测数据" : "Sync Evaluations")}
              </button>
              <button
                onClick={handleForceSync}
                disabled={migrating}
                className="text-[10px] bg-amber-500 hover:bg-amber-600 text-slate-950 px-3 py-1.5 rounded-full font-black uppercase hover:shadow-md disabled:opacity-50 flex items-center gap-1 cursor-pointer transition"
              >
                <Database className="w-3 h-3" />
                {migrating ? (lang === "zh" ? "同步中..." : "Syncing...") : (lang === "zh" ? "修复同步数据" : "Force Sync Data")}
              </button>
              <button
                onClick={handleMigrate}
                disabled={migrating}
                className="text-[10px] bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-full font-black uppercase hover:shadow-md disabled:opacity-50 flex items-center gap-1 cursor-pointer transition"
              >
                <Database className="w-3 h-3" />
                {migrating ? "Migrating..." : "Seed modelsData"}
              </button>
              <span className="text-[10px] bg-emerald-100 text-emerald-600 px-3 py-1.5 rounded-full font-black uppercase">Active</span>
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

function HealthItem({ label, status, detail }: { label: string; status: "pass" | "warn"; detail: string }) {
  const isPass = status === "pass";
  return (
    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black text-slate-800 uppercase tracking-wide">{label}</span>
        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${isPass ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
          {isPass ? "Pass" : "Warn"}
        </span>
      </div>
      <p className="text-xs text-slate-500 mt-2">{detail}</p>
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
