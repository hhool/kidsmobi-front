import React, { useState, useEffect } from "react";
import { 
  Save, 
  Layout, 
  Trash2, 
  Plus, 
  ArrowRight,
  Monitor,
  Globe,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import { motion } from "motion/react";
import { getCMSSettings, saveCMSSettings, getCMSProducts, getCMSEvaluations, getCMSGuides } from "../../lib/cmsService";
import { CMSSettings, HomeSlot } from "../../types";
import { DEFAULT_SEO_CONFIGS } from "../../config/defaultSeo";
import { OPS_COPY } from "./operationsConfig";

const OPS_COLLECTION_KEYS = ["all", "products", "categories", "scenarios", "evaluations", "guides", "news", "settings"] as const;

const OPS_COLLECTION_LABEL_DEFAULTS = {
  zh: {
    all: "全站",
    products: "产品中心",
    categories: "品类管理",
    scenarios: "场景管理",
    evaluations: "评测中心",
    guides: "选购指南",
    news: "全球资讯",
    settings: "首页与配置",
  },
  en: {
    all: "All",
    products: "Products",
    categories: "Categories",
    scenarios: "Scenarios",
    evaluations: "Evaluations",
    guides: "Guides",
    news: "News",
    settings: "Settings",
  },
} as const;

const OPS_COPY_EDITABLE_KEYS = [
  "title",
  "subtitle",
  "refresh",
  "d1Config",
  "d1Health",
  "totalRows",
  "sourceBaseline",
  "sourceWorker",
  "modeReplace",
  "modeAppend",
  "init",
  "purge",
  "exportJson",
  "dedupe",
  "forceSync",
] as const;

const OPS_COPY_KEY_LABELS: Record<typeof OPS_COPY_EDITABLE_KEYS[number], string> = {
  title: "Title",
  subtitle: "Subtitle",
  refresh: "Refresh Button",
  d1Config: "D1 Config Label",
  d1Health: "D1 Health Label",
  totalRows: "Total Rows Label",
  sourceBaseline: "Source Baseline",
  sourceWorker: "Source Worker",
  modeReplace: "Mode Replace",
  modeAppend: "Mode Append",
  init: "Init Button",
  purge: "Purge Button",
  exportJson: "Export Button",
  dedupe: "Dedupe Button",
  forceSync: "Force Sync Button",
};

function buildDefaultOpsCenter() {
  const fromCopy = (locale: "zh" | "en") => {
    const source = OPS_COPY[locale];
    const out: Record<string, string> = {};
    for (const key of OPS_COPY_EDITABLE_KEYS) {
      out[key] = source[key];
    }
    return out;
  };

  return {
    copy: {
      zh: fromCopy("zh"),
      en: fromCopy("en"),
    },
    collectionLabels: {
      zh: { ...OPS_COLLECTION_LABEL_DEFAULTS.zh },
      en: { ...OPS_COLLECTION_LABEL_DEFAULTS.en },
    },
    featureFlags: {
      showEmptyScoringStandardsSection: false,
    },
  };
}

export default function SettingsManager({ lang }: { lang: "zh" | "en" }) {
  const [settings, setSettings] = useState<CMSSettings | null>(null);
  const [pool, setPool] = useState<{ id: string; name: string; type: string }[]>([]);
  const [selectedSeoPage, setSelectedSeoPage] = useState<string>("home");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [s, p, e, g] = await Promise.all([
      getCMSSettings(),
      getCMSProducts(),
      getCMSEvaluations(),
      getCMSGuides()
    ]);
    
    const defaultSeo = DEFAULT_SEO_CONFIGS;

    const initialSettings: CMSSettings = s ? {
      ...s,
      seo: {
        ...(s.seo || {}),
        ...defaultSeo
      }
    } : {
      id: "global",
      hero: {
        zh: { title: "全球专业童车评测与选购决策平台", subtitle: "权威实测 | 科学选购 | 全球资讯" },
        en: { title: "Global Kids Mobility Evaluation & Decision Platform", subtitle: "Authority Review | Scientific Guide | Global Trends" }
      },
      homeSlots: [],
      seo: defaultSeo
    };

    setSettings(initialSettings);

    const combinedPool = [
      ...p.map(x => ({ id: x.id, name: x.zh.name || x.en.name, type: "product" })),
      ...e.map(x => ({ id: x.id, name: x.zh.title || x.en.title, type: "review" })),
      ...g.map(x => ({ id: x.id, name: x.zh.title || x.en.title, type: "guide" }))
    ];
    setPool(combinedPool);
  };

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const ensureOpsCenter = () => {
    const defaults = buildDefaultOpsCenter();
    const current = settings?.opsCenter || {};
    return {
      copy: {
        zh: {
          ...defaults.copy.zh,
          ...(current.copy?.zh || {}),
        },
        en: {
          ...defaults.copy.en,
          ...(current.copy?.en || {}),
        },
      },
      collectionLabels: {
        zh: {
          ...defaults.collectionLabels.zh,
          ...(current.collectionLabels?.zh || {}),
        },
        en: {
          ...defaults.collectionLabels.en,
          ...(current.collectionLabels?.en || {}),
        },
      },
      featureFlags: {
        ...defaults.featureFlags,
        ...(current.featureFlags || {}),
      },
    };
  };

  const updateOpsCopyField = (locale: "zh" | "en", key: string, value: string) => {
    if (!settings) return;
    const merged = ensureOpsCenter();
    setSettings({
      ...settings,
      opsCenter: {
        ...merged,
        copy: {
          ...merged.copy,
          [locale]: {
            ...merged.copy[locale],
            [key]: value,
          },
        },
      },
    });
  };

  const updateOpsCollectionLabel = (
    locale: "zh" | "en",
    key: typeof OPS_COLLECTION_KEYS[number],
    value: string,
  ) => {
    if (!settings) return;
    const merged = ensureOpsCenter();
    setSettings({
      ...settings,
      opsCenter: {
        ...merged,
        collectionLabels: {
          ...merged.collectionLabels,
          [locale]: {
            ...merged.collectionLabels[locale],
            [key]: value,
          },
        },
      },
    });
  };

  const updateOpsFeatureFlag = (key: "showEmptyScoringStandardsSection", value: boolean) => {
    if (!settings) return;
    const merged = ensureOpsCenter();
    setSettings({
      ...settings,
      opsCenter: {
        ...merged,
        featureFlags: {
          ...merged.featureFlags,
          [key]: value,
        },
      },
    });
  };

  const handleSave = async () => {
    if (settings) {
      setSaving(true);
      setSaveError(null);
      setSaveSuccess(null);
      try {
        await saveCMSSettings(settings);
        setSaveSuccess(lang === "zh" ? "店铺配置更新成功！已成功同步持久化至云端 Firestore。" : "Store configuration updated successfully and deployed to Cloud Firestore.");
        setTimeout(() => setSaveSuccess(null), 4000);
      } catch (e: any) {
        console.error(e);
        let errorMsg = e.message || String(e);
        let niceError = errorMsg;
        if (errorMsg.includes("Missing or insufficient permissions")) {
          niceError = lang === "zh"
            ? "权限不足 (Permission Denied)：您当前没有在 Firebase Auth 进行真实登录。本地 Bypass 模式仅有只读权限。请点击右上角「我的账户」使用 Google 账号进行登录后再试。"
            : "Permission Denied: You are not security-authenticated on the Firebase Auth backend. Developer Bypass session is read-only. Please authenticate via Google popup under the 'Account' section first.";
        } else if (errorMsg.includes("Operation timed out")) {
          niceError = lang === "zh"
            ? "网络超时：无法连接到 Firestore 数据库。请检查您的网络连接、代理，或重新登录过期的账户 session 后尝试。"
            : "Operation Timed Out: Failed to reach Firestore database. Please verify your connection/proxy settings, or re-authenticate your expired session.";
        }
        setSaveError(niceError);
      } finally {
        setSaving(false);
      }
    }
  };

  const addSlot = () => {
    if (settings) {
      setSettings({
        ...settings,
        homeSlots: [...settings.homeSlots, { id: `slot_${Date.now()}`, type: "product", targetId: "" }]
      });
    }
  };

  const removeSlot = (id: string) => {
    if (settings) {
      setSettings({
        ...settings,
        homeSlots: settings.homeSlots.filter(s => s.id !== id)
      });
    }
  };

  const updateSlot = (id: string, updates: Partial<HomeSlot>) => {
    if (settings) {
      setSettings({
        ...settings,
        homeSlots: settings.homeSlots.map(s => s.id === id ? { ...s, ...updates } : s)
      });
    }
  };

  const updateSeoValue = (pageKey: string, langKey: "zh" | "en", field: "title" | "description" | "keywords", value: any) => {
    if (!settings) return;
    
    const currentSeo = settings.seo || {};
    const pageSeo = currentSeo[pageKey] || { 
      zh: { title: "", description: "", keywords: [] }, 
      en: { title: "", description: "", keywords: [] } 
    };
    const langSeo = pageSeo[langKey] || { title: "", description: "", keywords: [] };
    
    let finalVal = value;
    if (field === "keywords" && typeof value === "string") {
      finalVal = value.split(/[,，]/).map(k => k.trim()).filter(Boolean);
    }
    
    const updatedSeo = {
      ...currentSeo,
      [pageKey]: {
        ...pageSeo,
        [langKey]: {
          ...langSeo,
          [field]: finalVal
        }
      }
    };
    
    setSettings({
      ...settings,
      seo: updatedSeo
    });
  };

  if (!settings) return null;

  const opsCenterConfig = ensureOpsCenter();

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-16">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{lang === "zh" ? "首页与全局配置" : "Home & Config"}</h2>
          <p className="text-slate-500 font-medium mt-1">Configure global visual identity and recommendation pools.</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-slate-900 hover:bg-orange-500 disabled:bg-slate-200 text-white disabled:text-slate-400 px-8 py-4 rounded-3xl font-black shadow-2xl flex items-center gap-2 cursor-pointer transition-all"
        >
          {saving ? (
            <>
              <div className="w-5 h-5 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
              <span>{lang === "zh" ? "部署中..." : "Deploying..."}</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5 text-orange-400" />
              <span>{lang === "zh" ? "部署更改" : "Deploy Changes"}</span>
            </>
          )}
        </button>
      </header>

      {saveSuccess && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 bg-emerald-50 border border-emerald-150 rounded-[24px] flex items-start gap-4 text-emerald-950 text-sm leading-relaxed shadow-sm max-w-5xl"
        >
          <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-black uppercase tracking-tight text-emerald-950 mb-1">
              {lang === "zh" ? "部署成功 / Cloud Deploy Succeeded" : "Cloud Deploy Succeeded"}
            </p>
            <p className="font-semibold text-emerald-800 text-xs">{saveSuccess}</p>
          </div>
        </motion.div>
      )}

      {saveError && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 bg-rose-50 border border-rose-150 rounded-[24px] flex items-start gap-4 text-rose-900 text-sm leading-relaxed shadow-sm max-w-5xl"
        >
          <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-black uppercase tracking-tight text-rose-900 mb-1">
              {lang === "zh" ? "更新全局配置部署出错 / Cloud Deploy Blocked" : "Cloud Deploy Blocked"}
            </p>
            <p className="font-medium text-rose-800 text-xs">{saveError}</p>
            <div className="mt-3.5 pt-3.5 border-t border-rose-100 flex flex-col gap-1.5 text-[11px] text-rose-600 font-bold uppercase tracking-wider">
              <p>💡 {lang === "zh" ? "如何在 iframe 预览中发布修改？" : "How to publish successfully inside this preview?"}</p>
              <p className="normal-case text-rose-500 font-medium tracking-normal leading-normal">
                {lang === "zh"
                  ? "1. 请点击预览窗口右上角的「在新标签页中打开」按钮（以绕过跨域 iframe 的安全限制）。\n2. 在新标签页点击「账户」进行 Google 真实登录，即可顺利向云数据库发布更新。"
                  : "1. Click 'Open in New Tab' at the top-right of your preview frame (to bypass iframe sandboxing limits).\n2. Navigate to 'Account' on your tab, sign in securely with Google, and try editing again."}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Hero Section Config */}
      <section className="space-y-8">
        <div className="flex items-center gap-3">
          <Monitor className="w-6 h-6 text-slate-900" />
          <h3 className="font-black text-lg uppercase tracking-tight">Main Hero Configuration</h3>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
            <h4 className="text-[10px] font-black text-orange-500 uppercase">Chinese (ZH) Hero</h4>
            <Field label="Hero Slogan" value={settings.hero.zh.title} onChange={(v: string) => setSettings({...settings, hero: {...settings.hero, zh: {...settings.hero.zh, title: v}}})} />
            <Field label="Hero Sub-slogan" value={settings.hero.zh.subtitle} onChange={(v: string) => setSettings({...settings, hero: {...settings.hero, zh: {...settings.hero.zh, subtitle: v}}})} />
          </div>
          <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
            <h4 className="text-[10px] font-black text-blue-500 uppercase">English (EN) Hero</h4>
            <Field label="Hero Slogan" value={settings.hero.en.title} onChange={(v: string) => setSettings({...settings, hero: {...settings.hero, en: {...settings.hero.en, title: v}}})} />
            <Field label="Hero Sub-slogan" value={settings.hero.en.subtitle} onChange={(v: string) => setSettings({...settings, hero: {...settings.hero, en: {...settings.hero.en, subtitle: v}}})} />
          </div>
        </div>
      </section>

      {/* Slots Section */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Layout className="w-6 h-6 text-slate-900" />
            <h3 className="font-black text-lg uppercase tracking-tight">Home Recommend Slots (Annual Rankings)</h3>
          </div>
          <button onClick={addSlot} className="flex items-center gap-2 px-6 py-2 bg-slate-100 rounded-xl text-[10px] font-black uppercase text-slate-900 hover:bg-slate-200 transition-colors">
            <Plus className="w-4 h-4" /> Add Recommend Slot
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {settings.homeSlots.map((slot, index) => (
            <div key={slot.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-8 group">
              <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black">
                {index + 1}
              </div>
              
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase">Slot Type</label>
                    <select 
                      className="w-full bg-slate-50 p-3 rounded-xl font-bold text-xs border border-transparent focus:bg-white focus:border-slate-900 transition-all"
                      value={slot.type}
                      onChange={(e) => updateSlot(slot.id, { type: e.target.value as any })}
                    >
                      <option value="product">Product Card</option>
                      <option value="review">Review Report</option>
                      <option value="guide">Buying Guide</option>
                    </select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase">Linked Object ID</label>
                    <select 
                      className="w-full bg-slate-50 p-3 rounded-xl font-bold text-xs border border-transparent focus:bg-white focus:border-slate-900 transition-all"
                      value={slot.targetId}
                      onChange={(e) => updateSlot(slot.id, { targetId: e.target.value })}
                    >
                      <option value="">-- UNLINKED --</option>
                      {pool.filter(p => p.type === slot.type).map(p => (
                        <option key={p.id} value={p.id}>{p.name} (ID#{p.id})</option>
                      ))}
                    </select>
                 </div>
              </div>

              <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity pr-4">
                  <div className="px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-black text-slate-400 flex items-center gap-2">
                    Visual Mapping <ArrowRight className="w-3 h-3" />
                  </div>
                  <button onClick={() => removeSlot(slot.id)} className="p-3 bg-red-50 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all">
                    <Trash2 className="w-5 h-5" />
                  </button>
              </div>
            </div>
          ))}

          {settings.homeSlots.length === 0 && (
            <div className="bg-slate-50/50 p-20 rounded-[40px] border border-dashed border-slate-200 text-center">
               <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No slots configured. Home rankings will appear empty.</p>
            </div>
          )}
        </div>
      </section>

      {/* SEO Controller Section */}
      <section className="space-y-8 border-t border-slate-100 pt-12">
        <div className="flex items-center gap-3">
          <Globe className="w-6 h-6 text-slate-900" />
          <h3 className="font-black text-lg uppercase tracking-tight">
            {lang === "zh" ? "全局页面 SEO 与头标签配置" : "Global SEO & Title Configurations"}
          </h3>
        </div>

        {/* Page selector Tabs */}
        <div className="flex flex-wrap gap-2 bg-slate-50 p-2 rounded-3xl max-w-fit border border-slate-100">
          {[
            { id: "home", labelZh: "首页", labelEn: "Home" },
            { id: "news", labelZh: "资讯/行业前沿", labelEn: "News" },
            { id: "products", labelZh: "参数矩阵", labelEn: "Products" },
            { id: "evaluations", labelZh: "深度实测报告", labelEn: "Evaluations" },
            { id: "guides", labelZh: "选型指南", labelEn: "Guides" },
            { id: "about", labelZh: "关于/科研愿景", labelEn: "About" }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedSeoPage(p.id)}
              className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase transition-all duration-300 ${
                selectedSeoPage === p.id
                  ? "bg-slate-900 text-white shadow-md"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {lang === "zh" ? p.labelZh : p.labelEn}
            </button>
          ))}
        </div>

        {/* Dual columns for ZH and EN SEO parameters */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Chinese Column */}
          <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <span className="text-xs font-black text-orange-500 uppercase tracking-widest">Chinese (ZH) Metadata</span>
              <span className="text-[10px] text-slate-400 font-bold">🎯 Will display in Chinese rendering</span>
            </div>
            
            <Field 
              label="Page Head Title (浏览器标题)" 
              value={settings.seo?.[selectedSeoPage]?.zh?.title || ""} 
              onChange={(v: string) => updateSeoValue(selectedSeoPage, "zh", "title", v)} 
              placeholder="请输入中文标题"
            />
            
            <Field 
              label="Keywords (关键字 - 用英文逗号隔开)" 
              value={settings.seo?.[selectedSeoPage]?.zh?.keywords?.join(", ") || ""} 
              onChange={(v: string) => updateSeoValue(selectedSeoPage, "zh", "keywords", v)} 
              placeholder="例如: 童车评测, 选购指南, 安全座椅"
            />
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Page Description (中文网页描述)</label>
              <textarea 
                className="w-full bg-slate-50 border border-slate-100 py-4 px-6 rounded-2xl font-bold text-slate-900 text-sm outline-none focus:ring-4 focus:ring-slate-900/5 focus:bg-white transition-all min-h-[120px] resize-none"
                value={settings.seo?.[selectedSeoPage]?.zh?.description || ""} 
                onChange={(e) => updateSeoValue(selectedSeoPage, "zh", "description", e.target.value)}
                placeholder="请输入网页核心描述，利于百度谷歌等搜索引擎收录..."
              />
            </div>
          </div>

          {/* English Column */}
          <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <span className="text-xs font-black text-blue-500 uppercase tracking-widest">English (EN) Metadata</span>
              <span className="text-[10px] text-slate-400 font-bold">🎯 Will display in English rendering</span>
            </div>
            
            <Field 
              label="Page Head Title (Browser Title)" 
              value={settings.seo?.[selectedSeoPage]?.en?.title || ""} 
              onChange={(v: string) => updateSeoValue(selectedSeoPage, "en", "title", v)} 
              placeholder="Enter page browser title"
            />
            
            <Field 
              label="Keywords (Keywords - Split by Comma)" 
              value={settings.seo?.[selectedSeoPage]?.en?.keywords?.join(", ") || ""} 
              onChange={(v: string) => updateSeoValue(selectedSeoPage, "en", "keywords", v)} 
              placeholder="e.g. kid bicycles, safety test, ratings, kidsmobi"
            />
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Page Description (English Page Description)</label>
              <textarea 
                className="w-full bg-slate-50 border border-slate-100 py-4 px-6 rounded-2xl font-bold text-slate-900 text-sm outline-none focus:ring-4 focus:ring-slate-900/5 focus:bg-white transition-all min-h-[120px] resize-none"
                value={settings.seo?.[selectedSeoPage]?.en?.description || ""} 
                onChange={(e) => updateSeoValue(selectedSeoPage, "en", "description", e.target.value)}
                placeholder="Enter full English page description for global indexing..."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Operations Center Config */}
      <section className="space-y-8 border-t border-slate-100 pt-12">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-slate-900" />
          <h3 className="font-black text-lg uppercase tracking-tight">
            {lang === "zh" ? "集中辅助操作中心远端配置" : "Operations Center Remote Config"}
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-5">
            <div className="text-xs font-black text-orange-500 uppercase tracking-widest">ZH Copy Overrides</div>
            {OPS_COPY_EDITABLE_KEYS.map((key) => (
              <Field
                key={`zh-${key}`}
                label={OPS_COPY_KEY_LABELS[key]}
                value={String(opsCenterConfig.copy.zh[key] || "")}
                onChange={(v: string) => updateOpsCopyField("zh", key, v)}
              />
            ))}
          </div>

          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-5">
            <div className="text-xs font-black text-blue-500 uppercase tracking-widest">EN Copy Overrides</div>
            {OPS_COPY_EDITABLE_KEYS.map((key) => (
              <Field
                key={`en-${key}`}
                label={OPS_COPY_KEY_LABELS[key]}
                value={String(opsCenterConfig.copy.en[key] || "")}
                onChange={(v: string) => updateOpsCopyField("en", key, v)}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-5">
            <div className="text-xs font-black text-orange-500 uppercase tracking-widest">ZH Collection Labels</div>
            {OPS_COLLECTION_KEYS.map((key) => (
              <Field
                key={`label-zh-${key}`}
                label={key}
                value={String(opsCenterConfig.collectionLabels.zh[key] || "")}
                onChange={(v: string) => updateOpsCollectionLabel("zh", key, v)}
              />
            ))}
          </div>

          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-5">
            <div className="text-xs font-black text-blue-500 uppercase tracking-widest">EN Collection Labels</div>
            {OPS_COLLECTION_KEYS.map((key) => (
              <Field
                key={`label-en-${key}`}
                label={key}
                value={String(opsCenterConfig.collectionLabels.en[key] || "")}
                onChange={(v: string) => updateOpsCollectionLabel("en", key, v)}
              />
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
          <div className="text-xs font-black text-slate-900 uppercase tracking-widest">
            {lang === "zh" ? "Feature Flags" : "Feature Flags"}
          </div>
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4">
            <div className="space-y-1">
              <p className="text-sm font-black text-slate-800">
                {lang === "zh" ? "无评分标准时仍显示评分区块" : "Show scoring section when standards are empty"}
              </p>
              <p className="text-xs text-slate-500 font-semibold">
                {lang === "zh"
                  ? "关闭后将隐藏空白“评分标准与算法详情”模块。"
                  : "When disabled, the empty 'Scoring Standards & Logic' module is hidden."}
              </p>
            </div>
            <button
              type="button"
              aria-pressed={Boolean(opsCenterConfig.featureFlags?.showEmptyScoringStandardsSection)}
              onClick={() =>
                updateOpsFeatureFlag(
                  "showEmptyScoringStandardsSection",
                  !Boolean(opsCenterConfig.featureFlags?.showEmptyScoringStandardsSection)
                )
              }
              className={`relative inline-flex h-8 w-16 shrink-0 rounded-full border transition-all ${
                opsCenterConfig.featureFlags?.showEmptyScoringStandardsSection
                  ? "bg-orange-500 border-orange-500"
                  : "bg-slate-200 border-slate-300"
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-all mt-[3px] ${
                  opsCenterConfig.featureFlags?.showEmptyScoringStandardsSection ? "translate-x-8" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
      <input 
        className="w-full bg-slate-50 border border-slate-100 py-4 px-6 rounded-2xl font-bold text-slate-900 outline-none focus:ring-4 focus:ring-slate-900/5 focus:bg-white transition-all text-sm" 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        placeholder={placeholder}
      />
    </div>
  );
}
