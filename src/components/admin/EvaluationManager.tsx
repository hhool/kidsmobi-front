import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Save, 
  Star, 
  History, 
  Link as LinkIcon, 
  Triangle 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getCMSEvaluations, saveCMSEvaluation, getCMSProducts } from "../../lib/cmsService";
import { Evaluation, CMSProduct, RadarScores } from "../../types";

export default function EvaluationManager({ lang }: { lang: "zh" | "en" }) {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [products, setProducts] = useState<CMSProduct[]>([]);
  const [editingEv, setEditingEv] = useState<Evaluation | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [evs, prods] = await Promise.all([
      getCMSEvaluations(),
      getCMSProducts()
    ]);
    setEvaluations(evs);
    setProducts(prods);
  };

  const handleNew = () => {
    setEditingEv({
      id: `ev_${Date.now()}`,
      productId: "",
      status: "draft",
      version: "V1.0",
      imageUrl: "",
      scores: { safety: 5, comfort: 5, portability: 5, features: 5, valueForMoney: 5 },
      zh: { title: "", verdict: "", pros: [], cons: [], changelog: "首次发布实测数据" },
      en: { title: "", verdict: "", pros: [], cons: [], changelog: "Initial review publication" },
      updatedAt: null
    });
  };

  const handleSave = async (ev: Evaluation) => {
    if (!ev.productId) return alert("Please link a product first.");
    await saveCMSEvaluation(ev);
    setEditingEv(null);
    fetchData();
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
              <button 
                onClick={() => setEditingEv(ev)}
                className="opacity-0 group-hover:opacity-100 p-4 hover:bg-slate-100 rounded-2xl text-slate-600 transition-all text-xs font-black uppercase tracking-widest"
              >
                Modify Report
              </button>
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
            onCancel={() => setEditingEv(null)} 
            lang={lang} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function EvaluationEditor({ ev, products, onSave, onCancel, lang }: any) {
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
            <button onClick={onCancel} className="px-8 py-3 text-slate-400 font-black hover:text-slate-900 transition-colors">Cancel</button>
            <button 
              onClick={() => onSave(formData)}
              className="px-8 py-3 bg-emerald-500 text-white rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-emerald-500/20 hover:scale-105 transition-all"
            >
              <Save className="w-5 h-5" />
              Store Report
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row">
          {/* Controls Sidebar */}
          <div className="w-full lg:w-[480px] shrink-0 border-r border-slate-100 p-10 space-y-12">
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
