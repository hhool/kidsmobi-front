import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Save, 
  Globe, 
  Search, 
  MessageSquare,
  ShieldAlert,
  ArrowUpRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getCMSNews, saveCMSNews } from "../../lib/cmsService";
import { News } from "../../types";

export default function NewsManager({ lang }: { lang: "zh" | "en" }) {
  const [news, setNews] = useState<News[]>([]);
  const [editingNews, setEditingNews] = useState<News | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const data = await getCMSNews();
    setNews(data);
  };

  const handleNew = () => {
    setEditingNews({
      id: `news_${Date.now()}`,
      category: "trends",
      status: "draft",
      imageUrl: "",
      seo: {
        zh: { title: "", description: "", keywords: [] },
        en: { title: "", description: "", keywords: [] }
      },
      zh: { title: "", content: "" },
      en: { title: "", content: "" },
      updatedAt: null
    });
  };

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async (n: News) => {
    setSaving(true);
    setSaveError(null);
    try {
      await saveCMSNews(n);
      setEditingNews(null);
      fetchData();
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
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{lang === "zh" ? "全球资讯" : "Global News"}</h2>
          <p className="text-slate-500 font-medium mt-1">Policy updates, recall alerts, and industry news.</p>
        </div>
        <button onClick={handleNew} className="btn-primary flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-3xl font-black shadow-2xl shadow-slate-900/10 hover:-translate-y-1 transition-all">
          <Plus className="w-5 h-5 text-blue-400" />
          {lang === "zh" ? "发布资讯" : "Post News"}
        </button>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {news.map((n) => (
          <div key={n.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-slate-800 transition-all">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
                <Globe className="w-8 h-8 text-slate-900" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${n.category === 'safety' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>{n.category}</span>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${n.status === "published" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                    {n.status}
                  </span>
                </div>
                <h4 className="font-black text-slate-900">{n.zh.title || "(Untitled News)"}</h4>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-tight mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-md">{n.en.title}</p>
              </div>
            </div>
            <button 
              onClick={() => setEditingNews(n)}
              className="opacity-0 group-hover:opacity-100 p-4 hover:bg-slate-100 rounded-2xl text-slate-600 transition-all text-xs font-black uppercase tracking-widest"
            >
              Compose
            </button>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {editingNews && (
          <NewsEditor 
            news={editingNews} 
            onSave={handleSave} 
            saving={saving}
            error={saveError}
            onCancel={() => setEditingNews(null)} 
            lang={lang} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function NewsEditor({ news, onSave, onCancel, lang, saving, error }: any) {
  const [formData, setFormData] = useState<News>(news);
  const [activeLang, setActiveLang] = useState<"zh" | "en">("zh");

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-end">
      <motion.div 
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="w-full max-w-5xl h-full bg-white shadow-2xl flex flex-col"
      >
        <header className="px-10 py-8 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
               <ArrowUpRight className="w-5 h-5" />
             </div>
             <div>
               <h3 className="text-xl font-black text-slate-900 uppercase">Global News Wire</h3>
               <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Real-time Information Node</p>
             </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onCancel} disabled={saving} className="px-6 py-2 text-slate-400 font-black hover:text-slate-900 transition-colors uppercase text-xs disabled:opacity-50">Abort</button>
            <button 
              onClick={() => onSave(formData)}
              disabled={saving}
              className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black flex items-center gap-2 shadow-xl shadow-slate-900/20 disabled:bg-slate-200 disabled:text-slate-400 cursor-pointer"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
                  <span>{lang === "zh" ? "发布中..." : "Publishing..."}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-orange-500" />
                  <span>{lang === "zh" ? "发布至资讯流" : "Publish to Wire"}</span>
                </>
              )}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-12 py-10 space-y-12">
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 bg-rose-50 border border-rose-150 rounded-[24px] flex items-start gap-4 text-rose-900 text-sm leading-relaxed shadow-sm max-w-4xl mx-auto"
            >
              <ShieldAlert className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-black uppercase tracking-tight text-rose-900 mb-1">
                  {lang === "zh" ? "更新云端数据库出错 / Cloud Update Blocked" : "Cloud Sync Blocked"}
                </p>
                <p className="font-medium text-rose-800 text-xs">{error}</p>
                <div className="mt-3.5 pt-3.5 border-t border-rose-100 flex flex-col gap-1.5 text-[11px] text-rose-600 font-bold uppercase tracking-wider">
                  <p>💡 {lang === "zh" ? "如何在 iframe 预览中发布修改？" : "How to publish successfully inside this preview?"}</p>
                  <p className="normal-case text-rose-500 font-medium tracking-normal leading-normal">
                    {lang === "zh"
                      ? "1. 请点击预览窗口右上角的「在新标签页中打开」按钮（以绕过跨域 iframe 的安全限制）。\n2. 在新标签页的右上角点击「账户」进行 Google 真实登录，即可顺利向云数据库发布更新。"
                      : "1. Click 'Open in New Tab' at the top-right of your preview frame (to bypass iframe sandboxing limits).\n2. Navigate to 'Account' on your tab, sign in securely with Google, and try editing again."}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Metadata Section */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <MessageSquare className="w-3 h-3" />
                Category Routing
              </label>
              <select 
                className="w-full bg-slate-50 py-4 px-6 rounded-2xl font-black text-xs outline-none border-2 border-transparent focus:border-slate-900 focus:bg-white transition-all shadow-sm"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                <option value="trends">Industry Trends</option>
                <option value="policy">Policy & Compliance</option>
                <option value="safety">Safety Recall Alerts</option>
                <option value="science">Kids Mobility Science</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ShieldAlert className="w-3 h-3" />
                Persistence State
              </label>
              <select 
                className="w-full bg-slate-50 py-4 px-6 rounded-2xl font-black text-xs outline-none border-2 border-transparent focus:border-slate-900 focus:bg-white transition-all shadow-sm"
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value as any})}
              >
                <option value="draft">Internal Draft</option>
                <option value="published">Live on Website</option>
              </select>
            </div>

            <div className="space-y-1">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Localization</label>
               <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                  <button onClick={() => setActiveLang("zh")} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${activeLang === "zh" ? "bg-white shadow-sm text-slate-900" : "text-slate-400"}`}>Chinese</button>
                  <button onClick={() => setActiveLang("en")} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${activeLang === "en" ? "bg-white shadow-sm text-slate-900" : "text-slate-400"}`}>English</button>
               </div>
            </div>
          </section>

          {/* Content Section */}
          <section className="space-y-8 p-10 bg-slate-50/50 border border-slate-100 rounded-[40px]">
             <Field label="News Headline" value={formData[activeLang].title} onChange={(v: string) => {
               const next = {...formData};
               next[activeLang].title = v;
               setFormData(next);
             }} />
             
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detailed Content (Markdown Supported)</label>
                <textarea 
                  className="w-full bg-white border border-slate-200 rounded-[32px] p-8 font-medium text-slate-700 outline-none focus:ring-4 focus:ring-slate-900/5 min-h-[300px] shadow-sm leading-relaxed"
                  value={formData[activeLang].content}
                  onChange={(e) => {
                    const next = {...formData};
                    next[activeLang].content = e.target.value;
                    setFormData(next);
                  }}
                />
             </div>
          </section>

          {/* SEO Controller */}
          <section className="space-y-8">
             <div className="flex items-center gap-3">
               <div className="w-1.5 h-6 bg-slate-900 rounded-full" />
               <h4 className="text-sm font-black uppercase text-slate-900 tracking-wide">SEO TDK Controller</h4>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <Field label="Search Title (Meta Title)" value={formData.seo[activeLang].title} onChange={(v: string) => {
                    const next = {...formData};
                    next.seo[activeLang].title = v;
                    setFormData(next);
                  }} />
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descriptions (Target 160)</label>
                    <textarea 
                      className="w-full bg-slate-50 border border-slate-100 py-4 px-6 rounded-2xl font-bold text-xs outline-none focus:bg-white focus:border-slate-900 transition-all shadow-inner min-h-[100px]"
                      value={formData.seo[activeLang].description}
                      onChange={(e) => {
                        const next = {...formData};
                        next.seo[activeLang].description = e.target.value;
                        setFormData(next);
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Google SERP Preview</span>
                  <div className="bg-white px-8 py-10 rounded-[40px] shadow-2xl border border-slate-50 flex flex-col gap-1.5 overflow-hidden ring-1 ring-slate-100">
                    <div className="text-[12px] text-emerald-700 truncate">strollerlab.com › news › eu-safety-2026</div>
                    <div className="text-[20px] text-blue-800 font-medium hover:underline cursor-pointer truncate">{formData.seo[activeLang].title || "Headline Preview"}</div>
                    <div className="text-[14px] text-slate-600 line-clamp-2 leading-relaxed">
                      {formData.seo[activeLang].description || "News meta summary will appear here for audit."}
                    </div>
                  </div>
                </div>
             </div>
          </section>
        </div>
      </motion.div>
    </div>
  );
}

function Field({ label, value, onChange }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
      <input className="w-full bg-white border border-slate-200 py-4 px-6 rounded-2xl font-black text-slate-900 outline-none focus:ring-4 focus:ring-slate-900/5 transition-all shadow-sm" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
