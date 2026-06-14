import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Save, 
  FileText, 
  Search, 
  AlertTriangle, 
  ListOrdered,
  Layout,
  Search as SearchIcon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getCMSGuides, saveCMSGuide } from "../../lib/cmsService";
import { Guide, RiskCard, SEOConfig } from "../../types";

export default function GuideManager({ lang }: { lang: "zh" | "en" }) {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [editingGuide, setEditingGuide] = useState<Guide | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const data = await getCMSGuides();
    setGuides(data);
  };

  const handleNew = () => {
    setEditingGuide({
      id: `guide_${Date.now()}`,
      category: "buying_tips",
      status: "draft",
      imageUrl: "",
      riskCards: [],
      seo: {
        zh: { title: "", description: "", keywords: [] },
        en: { title: "", description: "", keywords: [] }
      },
      zh: { title: "", content: "" },
      en: { title: "", content: "" },
      updatedAt: null
    });
  };

  const handleSave = async (g: Guide) => {
    await saveCMSGuide(g);
    setEditingGuide(null);
    fetchData();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{lang === "zh" ? "选购指南" : "Buying Guides"}</h2>
          <p className="text-slate-500 font-medium mt-1">SEOized cornerstone content for global conversion.</p>
        </div>
        <button onClick={handleNew} className="btn-primary flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-3xl font-black shadow-2xl shadow-slate-900/10 hover:-translate-y-1 transition-all">
          <Plus className="w-5 h-5 text-blue-400" />
          {lang === "zh" ? "撰写指南" : "Compose Guide"}
        </button>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {guides.map((g) => (
          <div key={g.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
                <ListOrdered className="w-8 h-8 text-blue-500" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-black uppercase bg-blue-100 text-blue-600 px-2.5 py-1 rounded-full">{g.category}</span>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${g.status === "published" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"}`}>
                    {g.status}
                  </span>
                </div>
                <h4 className="font-black text-slate-900">{g.zh.title || "(No Title)"}</h4>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-tight mt-0.5">{g.riskCards.length} Risk Cards Active</p>
              </div>
            </div>
            <button 
              onClick={() => setEditingGuide(g)}
              className="opacity-0 group-hover:opacity-100 p-4 hover:bg-slate-100 rounded-2xl text-slate-600 transition-all text-xs font-black uppercase tracking-widest"
            >
              Open Editor
            </button>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {editingGuide && (
          <GuideEditor 
            guide={editingGuide} 
            onSave={handleSave} 
            onCancel={() => setEditingGuide(null)} 
            lang={lang} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function GuideEditor({ guide, onSave, onCancel, lang }: any) {
  const [formData, setFormData] = useState<Guide>(guide);
  const [activeTab, setActiveTab] = useState<"content" | "risk" | "seo">("content");
  const [activeLang, setActiveLang] = useState<"zh" | "en">("zh");

  const addRiskCard = () => {
    setFormData({
      ...formData,
      riskCards: [...formData.riskCards, { title: "", pattern: "", detection: "", advice: "" }]
    });
  };

  const updateRiskCard = (index: number, card: RiskCard) => {
    const next = [...formData.riskCards];
    next[index] = card;
    setFormData({ ...formData, riskCards: next });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-8">
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className="w-full h-full bg-white rounded-[48px] shadow-2xl flex flex-col overflow-hidden"
      >
        <header className="px-10 py-8 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <Layout className="w-8 h-8 text-blue-500" />
            <div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Content Studio</h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Guide & Scientific Outreach</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onCancel} className="px-8 py-3 text-slate-400 font-black hover:text-slate-900 transition-colors">Discard</button>
            <button 
              onClick={() => onSave(formData)}
              className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-slate-900/10 hover:bg-blue-600 transition-all"
            >
              <Save className="w-5 h-5 text-blue-400" />
              Commit Guide
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto flex flex-col sm:flex-row">
          {/* Navigation */}
          <aside className="w-full sm:w-64 shrink-0 border-r border-slate-100 p-8 flex flex-col gap-2">
            <NavBtn active={activeTab === "content"} onClick={() => setActiveTab("content")} label="Main Content" icon={<FileText className="w-4 h-4" />} />
            <NavBtn active={activeTab === "risk"} onClick={() => setActiveTab("risk")} label="Risk Modules" icon={<AlertTriangle className="w-4 h-4" />} />
            <NavBtn active={activeTab === "seo"} onClick={() => setActiveTab("seo")} label="SEO Controller" icon={<SearchIcon className="w-4 h-4" />} />
            
            <div className="mt-auto border-t border-slate-100 pt-8 flex bg-slate-50 p-2 rounded-2xl">
               <button onClick={() => setActiveLang("zh")} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${activeLang === "zh" ? "bg-white shadow-sm" : "text-slate-400"}`}>ZH</button>
               <button onClick={() => setActiveLang("en")} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${activeLang === "en" ? "bg-white shadow-sm" : "text-slate-400"}`}>EN</button>
            </div>
          </aside>

          {/* Main Workspace */}
          <div className="flex-1 p-6 md:p-16 overflow-y-auto bg-slate-50/20">
            {activeTab === "content" && (
              <div className="max-w-3xl mx-auto space-y-10">
                <Field label="Post Title" value={formData[activeLang].title} onChange={(v: string) => {
                  const next = {...formData};
                  next[activeLang].title = v;
                  setFormData(next);
                }} />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Guide Narrative</label>
                    <span className="text-[10px] font-bold text-blue-500 italic">Use H2/H3 for auto-navigation indexing</span>
                  </div>
                  <textarea 
                    className="w-full bg-white border border-slate-200 p-10 rounded-[40px] font-medium text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 min-h-[500px] shadow-sm leading-relaxed"
                    placeholder="Start writing scientific guide content..."
                    value={formData[activeLang].content}
                    onChange={(e) => {
                      const next = {...formData};
                      next[activeLang].content = e.target.value;
                      setFormData(next);
                    }}
                  />
                </div>
              </div>
            )}

            {activeTab === "risk"}
            {activeTab === "risk" && (
              <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                  <h4 className="text-xl font-black tracking-tight text-slate-900">Risk Identification Modules</h4>
                  <button onClick={addRiskCard} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase">+ Add Module</button>
                </div>
                
                <div className="grid grid-cols-1 gap-6">
                  {formData.riskCards.map((card, i) => (
                    <div key={i} className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
                       <Field label="Module Title / Core Scam" value={card.title} onChange={(v: string) => updateRiskCard(i, {...card, title: v})} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <textarea className="w-full bg-slate-50 p-4 rounded-xl text-xs font-bold outline-none border border-transparent focus:bg-white focus:border-blue-500 min-h-[100px]" placeholder="Pattern of deception..." value={card.pattern} onChange={(e) => updateRiskCard(i, {...card, pattern: e.target.value})} />
                          <textarea className="w-full bg-slate-50 p-4 rounded-xl text-xs font-bold outline-none border border-transparent focus:bg-white focus:border-blue-500 min-h-[100px]" placeholder="Real-world detection method..." value={card.detection} onChange={(e) => updateRiskCard(i, {...card, detection: e.target.value})} />
                       </div>
                       <textarea className="w-full bg-blue-50 p-4 rounded-xl text-xs font-bold font-blue-600 outline-none border border-transparent focus:bg-white focus:border-blue-500" placeholder="Expert purchase advice..." value={card.advice} onChange={(e) => updateRiskCard(i, {...card, advice: e.target.value})} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "seo" && (
              <div className="max-w-2xl mx-auto space-y-12">
                 <h4 className="text-xl font-black text-slate-900 tracking-tight">Search Engine Optimization Panel</h4>
                 <div className="bg-white p-10 rounded-[40px] border border-slate-200 space-y-8">
                   <Field label="Meta Title (Target 60 chars)" value={formData.seo[activeLang].title} onChange={(v: string) => {
                     const next = {...formData};
                     next.seo[activeLang].title = v;
                     setFormData(next);
                   }} />
                   <div className="space-y-1 flex justify-end">
                     <span className={`text-[10px] font-black ${formData.seo[activeLang].title.length > 60 ? "text-red-500" : "text-slate-400"}`}>{formData.seo[activeLang].title.length} / 60</span>
                   </div>
                   
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Meta Description (Target 160 chars)</label>
                     <textarea 
                       className="w-full bg-slate-50 p-6 rounded-2xl font-bold text-xs outline-none border border-transparent focus:border-blue-500 focus:bg-white transition-all shadow-inner"
                       value={formData.seo[activeLang].description}
                       onChange={(e) => {
                        const next = {...formData};
                        next.seo[activeLang].description = e.target.value;
                        setFormData(next);
                       }}
                     />
                     <div className="flex justify-end">
                       <span className={`text-[10px] font-black ${formData.seo[activeLang].description.length > 160 ? "text-red-500" : "text-slate-400"}`}>{formData.seo[activeLang].description.length} / 160</span>
                     </div>
                   </div>
                 </div>

                 {/* SERP Preview */}
                 <div className="space-y-4">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Google SERP Simulator</span>
                   <div className="bg-white px-8 py-10 rounded-[40px] shadow-xl border border-slate-100 flex flex-col gap-1.5 overflow-hidden">
                      <div className="text-[12px] text-slate-500 truncate">https://strollerlab.com/guide/2026-high-landscape...</div>
                      <div className="text-[20px] text-blue-600 font-medium hover:underline cursor-pointer truncate">{formData.seo[activeLang].title || "Preview Title Will Appear Here"}</div>
                      <div className="text-[14px] text-slate-600 line-clamp-2 leading-relaxed">
                        {formData.seo[activeLang].description || "Compose a meta description to see how your guide will appear in Google Search result snippets."}
                      </div>
                   </div>
                 </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function NavBtn({ active, onClick, label, icon }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-xs transition-all ${active ? "bg-slate-900 text-white shadow-xl shadow-slate-900/10 scale-[1.02]" : "text-slate-400 hover:bg-slate-50"}`}
    >
      <div className={active ? "text-blue-400" : ""}>{icon}</div>
      {label}
    </button>
  );
}

function Field({ label, value, onChange }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
      <input className="w-full bg-slate-50 border border-slate-100 py-4 px-6 rounded-2xl font-black text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all shadow-sm" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
