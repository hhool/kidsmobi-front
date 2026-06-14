import React, { useState, useEffect } from "react";
import { 
  Save, 
  Layout, 
  Trash2, 
  Plus, 
  ArrowRight,
  Monitor,
  Globe
} from "lucide-react";
import { getCMSSettings, saveCMSSettings, getCMSProducts, getCMSEvaluations, getCMSGuides } from "../../lib/cmsService";
import { CMSSettings, HomeSlot } from "../../types";

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
    
    const defaultSeo = {
      home: { zh: { title: "", description: "", keywords: [] }, en: { title: "", description: "", keywords: [] } },
      news: { zh: { title: "", description: "", keywords: [] }, en: { title: "", description: "", keywords: [] } },
      products: { zh: { title: "", description: "", keywords: [] }, en: { title: "", description: "", keywords: [] } },
      evaluations: { zh: { title: "", description: "", keywords: [] }, en: { title: "", description: "", keywords: [] } },
      guides: { zh: { title: "", description: "", keywords: [] }, en: { title: "", description: "", keywords: [] } },
      about: { zh: { title: "", description: "", keywords: [] }, en: { title: "", description: "", keywords: [] } }
    };

    const initialSettings: CMSSettings = s ? {
      ...s,
      seo: {
        ...defaultSeo,
        ...(s.seo || {})
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

  const handleSave = async () => {
    if (settings) {
      await saveCMSSettings(settings);
      alert("Store updated successfully.");
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

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-16">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{lang === "zh" ? "首页与全局配置" : "Home & Config"}</h2>
          <p className="text-slate-500 font-medium mt-1">Configure global visual identity and recommendation pools.</p>
        </div>
        <button onClick={handleSave} className="bg-slate-900 text-white px-8 py-4 rounded-3xl font-black shadow-2xl flex items-center gap-2 hover:bg-orange-500 transition-all">
          <Save className="w-5 h-5 text-orange-400" />
          Deploy Changes
        </button>
      </header>

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
              
              <div className="flex-1 grid grid-cols-2 gap-6">
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
