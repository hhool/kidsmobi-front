import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Save, 
  Star, 
  History, 
  Link as LinkIcon, 
  Triangle,
  AlertTriangle,
  Trash2,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getCMSEvaluations, saveCMSEvaluation, getCMSProducts, deleteCMSEvaluation } from "../../lib/cmsService";
import { Evaluation, CMSProduct, RadarScores } from "../../types";
import { deleteD1CMSEvaluation, getD1CMSEvaluations, getD1CMSProducts, saveD1CMSEvaluation } from "../../lib/cmsD1Service";

export default function EvaluationManager({ lang }: { lang: "zh" | "en" }) {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [products, setProducts] = useState<CMSProduct[]>([]);
  const [editingEv, setEditingEv] = useState<Evaluation | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    let evs: Evaluation[] = [];
    let prods: CMSProduct[] = [];

    try {
      evs = await getD1CMSEvaluations(false);
    } catch {
      evs = [];
    }
    if (evs.length === 0) {
      evs = await getCMSEvaluations();
    }

    try {
      prods = await getD1CMSProducts(false);
    } catch {
      prods = [];
    }
    if (prods.length === 0) {
      prods = await getCMSProducts();
    }

    setEvaluations(evs);
    setProducts(prods);
  };

  const handleDelete = async (id: string) => {
    const isZh = lang === "zh";
    const confirmMsg = isZh 
      ? "您确定要彻底删除该评测报告吗？此操作不可逆。" 
      : "Are you sure you want to permanently delete this evaluation report? This action cannot be undone.";

    if (window.confirm(confirmMsg)) {
      try {
        let success = false;
        try {
          success = await deleteD1CMSEvaluation(id);
          if (!success) {
            throw new Error("D1 delete failed");
          }
        } catch {
          success = await deleteCMSEvaluation(id);
        }
        if (success) {
          fetchData();
        } else {
          alert(isZh ? "删除失败，这通常是因为权限不足或网络异常。" : "Deletion failed. This is usually due to permission deniability or network issues.");
        }
      } catch (e: any) {
        console.error(e);
        alert(e.message || String(e));
      }
    }
  };

  const handleNew = () => {
    setEditingEv({
      id: `ev_${Date.now()}`,
      type: "single",
      productId: "",
      productIds: [],
      status: "draft",
      version: "V1.0",
      imageUrl: "",
      scores: { safety: 5, comfort: 5, portability: 5, features: 5, valueForMoney: 5 },
      zh: { title: "", verdict: "", pros: [], cons: [], changelog: "首次发布实测数据" },
      en: { title: "", verdict: "", pros: [], cons: [], changelog: "Initial review publication" },
      updatedAt: null
    });
  };

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async (ev: Evaluation) => {
    const isSingleProduct = ev.type === 'single' || ev.type === 'safety';
    if (isSingleProduct && !ev.productId) return alert("Please link a product first.");
    if (!isSingleProduct && (!ev.productIds || ev.productIds.length < 2)) return alert("Please select at least 2 products for a comparison evaluation.");
    if (!isSingleProduct && ev.productIds && ev.productIds.length > 4) return alert("You can only compare up to 4 products.");
    
    setSaving(true);
    setSaveError(null);
    try {
      try {
        const saved = await saveD1CMSEvaluation(ev);
        if (!saved) {
          throw new Error("D1 save failed");
        }
      } catch {
        await saveCMSEvaluation(ev);
      }
      setEditingEv(null);
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
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{lang === "zh" ? "评测中心" : "Evaluation Center"}</h2>
          <p className="text-slate-500 font-medium mt-1">Scientific evaluation reports and 5D radar analytics.</p>
        </div>
        <button onClick={handleNew} className="btn-primary flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-3xl font-black shadow-2xl shadow-slate-900/10 hover:-translate-y-1 transition-all">
          <Plus className="w-5 h-5 text-emerald-400" />
          {lang === "zh" ? "发布新评测" : "New Evaluation"}
        </button>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {evaluations.map((ev) => {
          const product = products.find(p => p.id === ev.productId);
          return (
            <div key={ev.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-all">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center">
                  <Star className="w-8 h-8 text-emerald-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-600 px-2.5 py-1 rounded-full">{ev.version}</span>
                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${ev.status === "published" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"}`}>
                      {ev.status}
                    </span>
                  </div>
                  <h4 className="font-black text-slate-900">{ev.zh.title || "(No Title)"}</h4>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-tight mt-0.5">Linked: {product?.zh.name || ev.productId}</p>
                </div>
              </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => setEditingEv(ev)}
                className="p-4 hover:bg-slate-100 rounded-2xl text-slate-600 transition-all text-xs font-black uppercase tracking-widest flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4 text-emerald-500" />
                Modify Report
              </button>
              <button 
                onClick={() => handleDelete(ev.id)}
                className="p-4 hover:bg-red-50 rounded-2xl text-red-400 transition-all font-bold"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {editingEv && (
          <EvaluationEditor 
            ev={editingEv} 
            products={products}
            onSave={handleSave} 
            saving={saving}
            error={saveError}
            onCancel={() => setEditingEv(null)} 
            lang={lang} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function EvaluationEditor({ ev, products, onSave, onCancel, lang, saving, error }: any) {
  const [formData, setFormData] = useState<Evaluation>(ev);
  const [activeTab, setActiveTab] = useState<"base" | "zh" | "en">("base");

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-8">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-7xl h-full bg-white rounded-[48px] shadow-2xl flex flex-col overflow-hidden"
      >
        <header className="px-10 py-8 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <Triangle className="w-8 h-8 text-emerald-500 rotate-180" />
            <div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Evaluation Studio</h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Version Persistence Registry</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onCancel} disabled={saving} className="px-8 py-3 text-slate-400 font-black hover:text-slate-900 transition-colors disabled:opacity-50">Cancel</button>
            <button 
              onClick={() => onSave(formData)}
              disabled={saving}
              className="px-8 py-3 bg-emerald-500 text-white rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-emerald-500/20 hover:scale-105 transition-all disabled:bg-slate-250 disabled:text-slate-400 cursor-pointer"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
                  <span>{lang === "zh" ? "保存中..." : "Storing..."}</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>{lang === "zh" ? "发布并存盘" : "Store Report"}</span>
                </>
              )}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row">
          {/* Controls Sidebar */}
          <div className="w-full lg:w-[480px] shrink-0 border-r border-slate-100 p-10 space-y-12">
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 bg-rose-50 border border-rose-150 rounded-[24px] flex items-start gap-4 text-rose-900 text-sm leading-relaxed shadow-sm block"
              >
                <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-black uppercase tracking-tight text-rose-900 mb-1">
                    {lang === "zh" ? "更新云端数据库出错 / Cloud Update Blocked" : "Cloud Sync Blocked"}
                  </p>
                  <p className="font-medium text-rose-800 text-xs">{error}</p>
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

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <LinkIcon className="w-3 h-3" />
                  Evaluation Type
                </label>
                <select 
                  className="w-full bg-slate-100 py-4 px-6 rounded-2xl font-black text-sm outline-none focus:bg-white border-2 border-transparent focus:border-emerald-500 transition-all"
                  value={formData.type || "single"}
                  onChange={(e) => {
                    const newType = e.target.value as any;
                    setFormData({...formData, type: newType, productIds: formData.productIds || []});
                  }}
                >
                  <option value="single">Single Product (单品评测)</option>
                  <option value="compare">Multi-Product Compare (多品横评)</option>
                  <option value="value">Cost-Effectiveness (性价比评测)</option>
                  <option value="ranking">Annual Ranking (年度排行榜评测)</option>
                  <option value="safety">🛡️ Safety Specialist (安全专项评测)</option>
                </select>
              </div>

              {( !formData.type || 
                 formData.type === "single" || 
                 formData.type === "safety"
               ) ? (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <LinkIcon className="w-3 h-3" />
                    Bind Global Product ID
                  </label>
                  <select 
                    className="w-full bg-slate-100 py-4 px-6 rounded-2xl font-black text-sm outline-none focus:bg-white border-2 border-transparent focus:border-emerald-500 transition-all"
                    value={formData.productId}
                    onChange={(e) => setFormData({...formData, productId: e.target.value})}
                  >
                    <option value="">-- SELECT PRODUCT --</option>
                    {products.map((p: CMSProduct) => <option key={p.id} value={p.id}>{p.zh.name}</option>)}
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <LinkIcon className="w-3 h-3" />
                    Bind Multiple Products (Max 4)
                  </label>
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    {products.map((p: CMSProduct) => {
                      const isChecked = (formData.productIds || []).includes(p.id);
                      return (
                        <label key={p.id} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-100 rounded-lg transition-colors">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 text-emerald-500 rounded border-slate-300 focus:ring-emerald-500"
                            checked={isChecked}
                            onChange={(e) => {
                              const currentIds = formData.productIds || [];
                              if (e.target.checked) {
                                if (currentIds.length >= 4) {
                                  alert("You can only compare up to 4 products.");
                                  return;
                                  }
                                setFormData({...formData, productIds: [...currentIds, p.id]});
                              } else {
                                setFormData({...formData, productIds: currentIds.filter(id => id !== p.id)});
                              }
                            }}
                          />
                          <span className="text-xs font-black text-slate-700">{p.zh.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {( !formData.type || 
               formData.type === "single" || 
              formData.type === "safety"
             ) && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black uppercase text-slate-900 tracking-wide">5D Radar Metrics</h4>
                  <span className="text-[10px] text-slate-400 font-bold italic">Scale 1.0 - 10.0</span>
                </div>
                <ScoreSlider label="Safety & Compliance" value={formData.scores.safety} onChange={(v) => setFormData({...formData, scores: {...formData.scores, safety: v}})} />
                <ScoreSlider label="Ergonomic Comfort" value={formData.scores.comfort} onChange={(v) => setFormData({...formData, scores: {...formData.scores, comfort: v}})} />
                <ScoreSlider label="Portability Index" value={formData.scores.portability} onChange={(v) => setFormData({...formData, scores: {...formData.scores, portability: v}})} />
                <ScoreSlider label="Feature Versatility" value={formData.scores.features} onChange={(v) => setFormData({...formData, scores: {...formData.scores, features: v}})} />
                <ScoreSlider label="Value Projection" value={formData.scores.valueForMoney} onChange={(v) => setFormData({...formData, scores: {...formData.scores, valueForMoney: v}})} />
              </div>
            )}

            <div className="p-8 bg-slate-900 rounded-[32px] text-white">
               <div className="flex items-center gap-3 mb-4">
                 <History className="w-5 h-5 text-emerald-400" />
                 <span className="text-sm font-black uppercase tracking-widest">Version Control</span>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-500 uppercase">Tag</label>
                    <input className="w-full bg-slate-800 border-none rounded-lg p-2 text-xs font-black" value={formData.version} onChange={(e) => setFormData({...formData, version: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-500 uppercase">Status</label>
                    <select className="w-full bg-slate-800 border-none rounded-lg p-2 text-xs font-black" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value as any})}>
                      <option value="draft">DRAFT</option>
                      <option value="published">LIVE</option>
                    </select>
                  </div>
               </div>
            </div>
          </div>

          {/* Main Preview/Content */}
          <div className="flex-1 p-10 bg-slate-50/30 overflow-y-auto">
            <div className="flex bg-white p-1 rounded-2xl mb-10 w-fit border border-slate-100 shadow-sm">
               <TabBtn active={activeTab === "zh"} onClick={() => setActiveTab("zh")} label="ZH Metrics" />
               <TabBtn active={activeTab === "en"} onClick={() => setActiveTab("en")} label="EN Metrics" />
            </div>

            <div className="grid grid-cols-1 gap-10">
              <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
                <RadarPreview scores={formData.scores} />
              </div>

              <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
                <Field label="Report Title" value={activeTab === "zh" ? formData.zh.title : formData.en.title} onChange={(v: string) => {
                  const next = {...formData};
                  (next as any)[activeTab].title = v;
                  setFormData(next);
                }} />
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Final Verdict</label>
                  <textarea 
                    className="w-full bg-slate-50 p-6 rounded-2xl font-bold text-sm outline-none border-2 border-transparent focus:border-emerald-500 focus:bg-white transition-all min-h-[120px]"
                    value={activeTab === "zh" ? formData.zh.verdict : formData.en.verdict}
                    onChange={(e) => {
                      const next = {...formData};
                      (next as any)[activeTab].verdict = e.target.value;
                      setFormData(next);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-red-500 italic">Version Changelog (Mandatory)</label>
                  <input 
                    className="w-full bg-slate-50 p-6 rounded-2xl font-bold text-sm outline-none border-2 border-transparent focus:border-red-500 focus:bg-white transition-all"
                    placeholder="Why are you updating this report?"
                    value={activeTab === "zh" ? formData.zh.changelog : formData.en.changelog}
                    onChange={(e) => {
                      const next = {...formData};
                      (next as any)[activeTab].changelog = e.target.value;
                      setFormData(next);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ScoreSlider({ label, value, onChange }: any) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{label}</span>
        <span className="text-sm font-black text-emerald-600">{value.toFixed(1)}</span>
      </div>
      <input 
        type="range" min="1" max="10" step="0.1" 
        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
}

function RadarPreview({ scores }: { scores: RadarScores }) {
  // Simple SVG Radar Logic
  const size = 300;
  const center = size / 2;
  const radius = size * 0.4;
  
  const getPoint = (score: number, index: number, total: number) => {
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    const factor = score / 10;
    return {
      x: center + radius * factor * Math.cos(angle),
      y: center + radius * factor * Math.sin(angle)
    };
  };

  const keys = Object.keys(scores) as (keyof RadarScores)[];
  const points = keys.map((k, i) => getPoint(scores[k], i, keys.length));
  const polygonPoints = points.map(p => `${p.x},${p.y}`).join(" ");

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="overflow-visible">
        {/* Background webs */}
        {[0.2, 0.4, 0.6, 0.8, 1].map(f => (
          <polygon 
            key={f}
            points={keys.map((_, i) => {
               const p = getPoint(f * 10, i, keys.length);
               return `${p.x},${p.y}`;
            }).join(" ")}
            className="fill-none stroke-slate-100 stroke-1"
          />
        ))}
        {/* Fill Area */}
        <polygon points={polygonPoints} className="fill-emerald-500/20 stroke-emerald-500 stroke-2" />
        {/* Dots */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={4} className="fill-emerald-600" />
        ))}
      </svg>
      <div className="flex gap-6 mt-8 text-[9px] font-black uppercase text-slate-400 tracking-tighter">
         {keys.map(k => <span key={k}>{k.replace(/([A-Z])/g, ' $1')}</span>)}
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, label }: any) {
  return (
    <button onClick={onClick} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${active ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-700"}`}>{label}</button>
  );
}

function Field({ label, value, onChange }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
      <input className="w-full bg-slate-50 py-4 px-6 rounded-2xl font-black text-sm outline-none border-2 border-transparent focus:border-emerald-500 focus:bg-white transition-all" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
