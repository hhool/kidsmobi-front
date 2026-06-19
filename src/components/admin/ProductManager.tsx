import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Globe, 
  Save, 
  FileText, 
  Search,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getCMSProducts, saveCMSProduct, deleteCMSProduct } from "../../lib/cmsService";
import { CMSProduct, ComplianceTag, ProductCategory } from "../../types";
import AssetUploader from "./AssetUploader";

export default function ProductManager({ lang }: { lang: "zh" | "en" }) {
  const [products, setProducts] = useState<CMSProduct[]>([]);
  const [search, setSearch] = useState("");
  const [editingProduct, setEditingProduct] = useState<CMSProduct | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const data = await getCMSProducts();
    setProducts(data);
  };

  const handleNew = () => {
    setEditingProduct({
      id: `prod_${Date.now()}`,
      brand: "",
      category: "stroller",
      wheelSize: "",
      weight: 0,
      material: "",
      brakeType: "",
      tireType: "",
      price: 0,
      ageRange: "",
      heightRange: [70, 120],
      compliance: [],
      imageUrl: "",
      galleryUrls: [],
      videoUrl: "",
      status: "draft",
      zh: { name: "", description: "", brandText: "", specsText: "", pros: [], cons: [], editorVerdict: "" },
      en: { name: "", description: "", brandText: "", specsText: "", pros: [], cons: [], editorVerdict: "" },
      updatedAt: null
    });
  };

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async (p: CMSProduct) => {
    // Basic Quality Check
    if (!p.zh.name || !p.en.name) {
      alert("Please enter product name in both languages.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await saveCMSProduct(p);
      setEditingProduct(null);
      fetchProducts();
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

  const handleDelete = async (id: string) => {
    const isZh = lang === "zh";
    const confirmMsg = isZh 
      ? "您确定要彻底删除该产品吗？此操作不可逆。" 
      : "Are you sure you want to permanently delete this product? This action cannot be undone.";
    
    if (window.confirm(confirmMsg)) {
      try {
        const success = await deleteCMSProduct(id);
        if (success) {
          fetchProducts();
        } else {
          alert(isZh ? "删除失败，这通常是因为权限不足或网络异常。" : "Deletion failed. This is usually due to permission deniability or network issues.");
        }
      } catch (e: any) {
        console.error(e);
        alert(e.message || String(e));
      }
    }
  };

  const filtered = products.filter(p => 
    p.zh.name.toLowerCase().includes(search.toLowerCase()) || 
    p.en.name.toLowerCase().includes(search.toLowerCase()) ||
    p.brand.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{lang === "zh" ? "产品中心" : "Product Center"}</h2>
          <p className="text-slate-500 font-medium mt-1">Structured repository for global stroller database.</p>
        </div>
        <button onClick={handleNew} className="btn-primary flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-3xl font-black shadow-2xl shadow-slate-900/20 hover:-translate-y-1 transition-all">
          <Plus className="w-5 h-5 text-orange-500" />
          {lang === "zh" ? "新增产品" : "New Product"}
        </button>
      </header>

      {/* Filter Bar */}
      <div className="relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
        <input 
          type="text" 
          placeholder={lang === "zh" ? "搜索品牌、型号或 ID..." : "Search brand, model or ID..."}
          className="w-full bg-white border border-slate-100 rounded-3xl py-5 pl-16 pr-8 text-sm font-bold outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Product List */}
      <div className="grid grid-cols-1 gap-4">
        {filtered.map((p) => (
          <div key={p.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-orange-200 transition-all">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-slate-50 rounded-2xl p-2 shrink-0">
                <img src={p.imageUrl || undefined} alt={p.zh.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full">{p.category}</span>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${p.status === "published" ? "bg-emerald-50 text-emerald-600" : p.status === "archived" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"}`}>
                    {p.status}
                  </span>
                </div>
                <h4 className="font-black text-slate-900 group-hover:text-orange-500 transition-colors">{p.zh.name || "(No Name)"}</h4>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-tight mt-0.5">{p.brand} • {p.en.name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => setEditingProduct(p)}
                className="p-4 hover:bg-slate-100 rounded-2xl text-slate-600 transition-all font-bold text-xs flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Edit
              </button>
              <button 
                onClick={() => handleDelete(p.id)}
                className="p-4 hover:bg-red-50 rounded-2xl text-red-400 transition-all font-bold"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {editingProduct && (
          <ProductEditor 
            product={editingProduct} 
            onSave={handleSave} 
            saving={saving}
            error={saveError}
            onCancel={() => setEditingProduct(null)} 
            lang={lang} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ProductEditor({ product, onSave, onCancel, lang, saving, error }: any) {
  const [formData, setFormData] = useState<CMSProduct>(product);
  const [activeTab, setActiveTab] = useState<"base" | "zh" | "en" | "compare">("compare");

  const categories: ProductCategory[] = ["balance", "bicycle", "scooter", "stroller", "electric_car", "tricycle", "safety_seat"];
  const complianceOptions: ComplianceTag[] = ["CCC", "EN1888", "ASTM", "GS"];

  const toggleCompliance = (tag: ComplianceTag) => {
    const complianceList = formData.compliance || [];
    const next = complianceList.includes(tag)
      ? complianceList.filter(t => t !== tag)
      : [...complianceList, tag];
    setFormData({ ...formData, compliance: next });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-8">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="w-full max-w-7xl h-full bg-white rounded-[48px] shadow-2xl flex flex-col overflow-hidden"
      >
        <header className="px-10 py-8 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Product Architect</h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Structured Mirroring Mode Active</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onCancel} disabled={saving} className="px-8 py-3 text-slate-400 font-black hover:text-slate-900 transition-colors disabled:opacity-50">Abort</button>
            <button 
              onClick={() => onSave(formData)}
              disabled={saving}
              className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-slate-900/10 hover:bg-orange-500 transition-all disabled:bg-slate-200 disabled:text-slate-400 cursor-pointer"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
                  <span>{lang === "zh" ? "发布中..." : "Publishing..."}</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 text-orange-400" />
                  <span>{lang === "zh" ? "保存并发布" : "Publish Changes"}</span>
                </>
              )}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-10 py-10">
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8 p-6 bg-rose-50 border border-rose-150 rounded-[24px] flex items-start gap-4 text-rose-900 text-sm leading-relaxed shadow-sm max-w-4xl mx-auto"
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
                      ? "1. 请点击预览窗口右上角的「在新标签页中打开」按钮（以绕过跨域 iframe 的安全限制）。\n2. 在新标签页的右上角点击「账户」进行 Google 真实登录，即可顺利向云数据库发布更新。"
                      : "1. Click 'Open in New Tab' at the top-right of your preview frame (to bypass iframe sandboxing limits).\n2. Navigate to 'Account' on your tab, sign in securely with Google, and try editing again."}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          <div className="flex bg-slate-100 p-1.5 rounded-3xl mb-10 w-fit mx-auto border border-slate-200">
            <TabBtn active={activeTab === "compare"} onClick={() => setActiveTab("compare")} label="Multi-Language Mirror" />
            <TabBtn active={activeTab === "base"} onClick={() => setActiveTab("base")} label="Structured Data" />
            <TabBtn active={activeTab === "zh"} onClick={() => setActiveTab("zh")} label="ZH Profile" />
            <TabBtn active={activeTab === "en"} onClick={() => setActiveTab("en")} label="EN Profile" />
          </div>

          {activeTab === "compare" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <LangSector 
                lang="zh" 
                title="中文物理绑定" 
                data={formData.zh} 
                onChange={(zh) => setFormData({...formData, zh})} 
              />
              <LangSector 
                lang="en" 
                title="English Mirror" 
                data={formData.en} 
                onChange={(en) => setFormData({...formData, en})} 
              />
            </div>
          )}

          {activeTab === "base" && (
            <div className="space-y-12">
              <Section title="Physical Specs (Base Info)">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Field label="Global Model UID" value={formData.id} disabled />
                  <Field label="Brand Name" value={formData.brand} onChange={(v) => setFormData({...formData, brand: v})} />
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</label>
                    <select 
                      className="w-full bg-slate-50 py-4 px-6 rounded-2xl font-bold text-sm outline-none border border-transparent focus:border-orange-500 focus:bg-white transition-all ring-0"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value as any})}
                    >
                      {categories.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Status</label>
                    <select 
                      className="w-full bg-slate-50 py-4 px-6 rounded-2xl font-bold text-sm outline-none border border-transparent focus:border-red-500 focus:bg-white transition-all ring-0"
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                    >
                      <option value="draft">DRAFT (INTERNAL)</option>
                      <option value="published">PUBLISHED (LIVE)</option>
                      <option value="archived">ARCHIVED (LOGIC DELETE)</option>
                    </select>
                  </div>
                </div>
              </Section>

              <Section title="Technical parameters">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Field label="Net Weight (kg)" type="number" value={formData.weight} onChange={(v) => setFormData({...formData, weight: parseFloat(v) || 0})} />
                  <Field label="Wheel Size / Config" value={formData.wheelSize} onChange={(v) => setFormData({...formData, wheelSize: v})} />
                  <Field label="Material / Chassis" value={formData.material} onChange={(v) => setFormData({...formData, material: v})} />
                  <Field label="Price Mapping (CNY)" type="number" value={formData.price} onChange={(v) => setFormData({...formData, price: parseFloat(v) || 0})} />
                </div>
              </Section>

              <Section title="Evaluation Summary Scores (0-10)">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Field label="Overall Score" type="number" value={formData.overallScore || 0} onChange={(v) => setFormData({...formData, overallScore: parseFloat(v) || 0})} />
                  <Field label="Safety Score" type="number" value={formData.safetyScore || 0} onChange={(v) => setFormData({...formData, safetyScore: parseFloat(v) || 0})} />
                  <Field label="Weight Score" type="number" value={formData.weightScore || 0} onChange={(v) => setFormData({...formData, weightScore: parseFloat(v) || 0})} />
                  <Field label="Geometry Score" type="number" value={formData.geometryScore || 0} onChange={(v) => setFormData({...formData, geometryScore: parseFloat(v) || 0})} />
                </div>
              </Section>

              <Section title="Compliance & Safety Standards">
                 <div className="flex flex-wrap gap-4">
                   {complianceOptions.map(tag => (
                     <button 
                        key={tag}
                        onClick={() => toggleCompliance(tag)}
                        className={`px-8 py-4 rounded-2xl font-black text-xs border-2 transition-all ${(formData.compliance || []).includes(tag) ? "bg-orange-500 border-orange-500 text-white shadow-xl shadow-orange-500/20" : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"}`}
                     >
                       {tag} CERTIFIED
                     </button>
                   ))}
                 </div>
              </Section>

              <Section title="Visual & Media Assets">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <AssetUploader
                      label="Primary Hero Image"
                      value={formData.imageUrl}
                      onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                      keyPrefix="products/hero/"
                    />
                    <Field label="Video showcase URL (YouTube/Direct)" value={formData.videoUrl || ""} onChange={(v) => setFormData({...formData, videoUrl: v})} />
                  </div>
                  
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Image Gallery (Sub-views)</label>
                    <div className="space-y-4">
                      {(formData.galleryUrls || []).map((url, idx) => (
                        <div key={idx} className="relative">
                          <AssetUploader
                            label={`Gallery Image ${idx + 1}`}
                            value={url}
                            onChange={(newUrl) => {
                              const next = [...(formData.galleryUrls || [])];
                              next[idx] = newUrl;
                              setFormData({ ...formData, galleryUrls: next });
                            }}
                            keyPrefix="products/gallery/"
                          />
                          <button
                            onClick={() => {
                              const next = (formData.galleryUrls || []).filter((_, i) => i !== idx);
                              setFormData({ ...formData, galleryUrls: next });
                            }}
                            className="absolute top-0 right-0 p-1.5 bg-red-50 text-red-400 rounded-full hover:bg-red-100 transition-all"
                            title="Remove gallery image"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => setFormData({...formData, galleryUrls: [...(formData.galleryUrls || []), ""]})}
                        className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs font-black hover:border-orange-500 hover:text-orange-500 transition-all flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Gallery Image
                      </button>
                    </div>
                  </div>
                </div>
              </Section>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function TabBtn({ active, onClick, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase transition-all tracking-tight ${active ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10" : "text-slate-400 hover:text-slate-600"}`}
    >
      {label}
    </button>
  );
}

function Section({ title, children }: any) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-6 bg-orange-500 rounded-full" />
        <h4 className="text-sm font-black uppercase text-slate-900 tracking-wide">{title}</h4>
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", disabled = false }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
      <input 
        type={type}
        disabled={disabled}
        className={`w-full bg-slate-50 py-4 px-6 rounded-2xl font-bold text-sm outline-none border border-transparent transition-all ring-0 ${disabled ? "opacity-50 cursor-not-allowed" : "focus:border-orange-500 focus:bg-white"}`}
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
      />
    </div>
  );
}

function LangSector({ lang, title, data, onChange }: any) {
  return (
    <div className="bg-slate-50/50 p-10 rounded-[40px] border border-slate-100 space-y-8">
      <div className="flex items-center gap-3 mb-4">
        <CheckCircle2 className="w-6 h-6 text-orange-500" />
        <h3 className="font-black text-lg uppercase tracking-tighter">{title}</h3>
      </div>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Model Name ({lang.toUpperCase()})</label>
          <input 
            className="w-full bg-white border border-slate-200 py-4 px-6 rounded-2xl font-black text-slate-900 outline-none focus:border-orange-500 transition-all shadow-sm"
            value={data.name}
            onChange={(e) => onChange({...data, name: e.target.value})}
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Marketing Copy / Description</label>
          <textarea 
            className="w-full bg-white border border-slate-200 py-4 px-6 rounded-2xl font-bold text-slate-600 outline-none focus:border-orange-500 transition-all shadow-sm min-h-[120px]"
            value={data.description}
            onChange={(e) => onChange({...data, description: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Editor Verdict (Short)</label>
          <textarea 
            className="w-full bg-white border border-slate-200 py-4 px-6 rounded-2xl font-bold text-slate-600 outline-none focus:border-orange-500 transition-all shadow-sm min-h-[80px]"
            value={data.editorVerdict}
            onChange={(e) => onChange({...data, editorVerdict: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Pros List</label>
            <div className="space-y-2">
              {(data.pros || []).map((pro: string, idx: number) => (
                <div key={idx} className="flex gap-2">
                  <input 
                    className="flex-1 bg-white border border-slate-200 py-2 px-4 rounded-xl font-bold text-xs"
                    value={pro}
                    onChange={(e) => {
                      const next = [...(data.pros || [])];
                      next[idx] = e.target.value;
                      onChange({...data, pros: next});
                    }}
                  />
                  <button onClick={() => {
                    const next = (data.pros || []).filter((_: any, i: number) => i !== idx);
                    onChange({...data, pros: next});
                  }} className="text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              <button onClick={() => onChange({...data, pros: [...(data.pros || []), ""]})} className="text-[10px] font-black text-emerald-600 uppercase">+ Add Pro</button>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Cons List</label>
            <div className="space-y-2">
              {(data.cons || []).map((con: string, idx: number) => (
                <div key={idx} className="flex gap-2">
                  <input 
                    className="flex-1 bg-white border border-slate-200 py-2 px-4 rounded-xl font-bold text-xs"
                    value={con}
                    onChange={(e) => {
                      const next = [...(data.cons || [])];
                      next[idx] = e.target.value;
                      onChange({...data, cons: next});
                    }}
                  />
                  <button onClick={() => {
                    const next = (data.cons || []).filter((_: any, i: number) => i !== idx);
                    onChange({...data, cons: next});
                  }} className="text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              <button onClick={() => onChange({...data, cons: [...(data.cons || []), ""]})} className="text-[10px] font-black text-rose-600 uppercase">+ Add Con</button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Brand Narrative</label>
          <input 
            className="w-full bg-white border border-slate-200 py-4 px-6 rounded-2xl font-bold text-slate-500 outline-none focus:border-orange-500 transition-all shadow-sm"
            value={data.brandText}
            onChange={(e) => onChange({...data, brandText: e.target.value})}
          />
        </div>
      </div>
    </div>
  );
}
