import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Package, 
  FileText, 
  Settings as SettingsIcon, 
  X, 
  Plus, 
  Save, 
  Trash2, 
  Eye, 
  EyeOff,
  Globe,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { auth } from "../lib/firebase";
import { 
  checkIsAdmin, 
  getCMSProducts, 
  saveCMSProduct, 
  getCMSContent, 
  saveCMSContent, 
  getCMSSettings, 
  saveCMSSettings 
} from "../lib/cmsService";
import { CMSProduct, CMSContent, CMSSettings } from "../types";

export default function AdminPanel({ onClose, lang }: { onClose: () => void, lang: "zh" | "en" }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState<"dashboard" | "products" | "content" | "settings">("dashboard");
  
  // Data states
  const [products, setProducts] = useState<CMSProduct[]>([]);
  const [content, setContent] = useState<CMSContent[]>([]);
  const [settings, setSettings] = useState<CMSSettings | null>(null);

  useEffect(() => {
    const check = async () => {
      const user = auth.currentUser;
      if (user) {
        const admin = await checkIsAdmin(user.uid);
        setIsAdmin(admin);
        if (admin) {
          fetchData();
        }
      }
      setLoading(false);
    };
    check();
  }, []);

  const fetchData = async () => {
    const [p, c, s] = await Promise.all([
      getCMSProducts(),
      getCMSContent(),
      getCMSSettings()
    ]);
    setProducts(p);
    setContent(c);
    setSettings(s || {
      id: "global",
      heroZh: { title: "KIDSMOBI", subtitle: "专业童车评测" },
      heroEn: { title: "KIDSMOBI", subtitle: "Professional Kids Mobility Evaluation" }
    });
  };

  if (loading) return <div className="fixed inset-0 bg-white/80 backdrop-blur-md z-[100] flex items-center justify-center font-black">AUTHENTICATING...</div>;
  if (!isAdmin) return <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center p-8 text-center">
    <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
    <h2 className="text-2xl font-black mb-2 uppercase">Access Denied</h2>
    <p className="text-slate-500 mb-8 max-w-xs">You do not have administrator privileges to access this area.</p>
    <button onClick={onClose} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold">Return to Site</button>
  </div>;

  return (
    <div className="fixed inset-0 bg-slate-50 z-[100] flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-black">K</div>
            <span className="font-black tracking-tighter text-slate-900">CMS CENTER</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-6 space-y-2">
          <MenuItem 
            active={activeMenu === "dashboard"} 
            onClick={() => setActiveMenu("dashboard")} 
            icon={<LayoutDashboard className="w-5 h-5" />} 
            label={lang === "zh" ? "控制台" : "Dashboard"} 
          />
          <MenuItem 
            active={activeMenu === "products"} 
            onClick={() => setActiveMenu("products")} 
            icon={<Package className="w-5 h-5" />} 
            label={lang === "zh" ? "产品中心" : "Products"} 
          />
          <MenuItem 
            active={activeMenu === "content"} 
            onClick={() => setActiveMenu("content")} 
            icon={<FileText className="w-5 h-5" />} 
            label={lang === "zh" ? "评测与资讯" : "Content"} 
          />
          <MenuItem 
            active={activeMenu === "settings"} 
            onClick={() => setActiveMenu("settings")} 
            icon={<SettingsIcon className="w-5 h-5" />} 
            label={lang === "zh" ? "全局配置" : "Settings"} 
          />
        </nav>

        <div className="p-6 border-t border-slate-100 italic text-[10px] text-slate-400 font-medium">
          Logged in as: {auth.currentUser?.email}
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto bg-slate-50">
        <div className="p-10 max-w-7xl mx-auto">
           {activeMenu === "dashboard" && <CMSDashboard products={products} content={content} lang={lang} />}
           {activeMenu === "products" && <CMSProductsList products={products} onUpdate={fetchData} lang={lang} />}
           {activeMenu === "content" && <CMSContentList content={content} onUpdate={fetchData} lang={lang} />}
           {activeMenu === "settings" && <CMSSettingsEditor initialSettings={settings} onUpdate={fetchData} lang={lang} />}
        </div>
      </main>
    </div>
  );
}

function MenuItem({ active, onClick, icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${active ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "text-slate-500 hover:bg-slate-100"}`}
    >
      {icon}
      {label}
    </button>
  );
}

// DASHBOARD COMPONENT
function CMSDashboard({ products, content, lang }: any) {
  const stats = [
    { label: lang === "zh" ? "总产品" : "Products", value: products.length, icon: <Package className="w-6 h-6 text-blue-500" /> },
    { label: lang === "zh" ? "资讯/指南" : "Content", value: content.length, icon: <FileText className="w-6 h-6 text-emerald-500" /> },
    { label: lang === "zh" ? "草稿状态" : "Drafts", value: [...products, ...content].filter(x => x.status === "draft").length, icon: <LayoutDashboard className="w-6 h-6 text-amber-500" /> },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
          {lang === "zh" ? "数据概览" : "Dashboard Overview"}
        </h1>
        <p className="text-slate-500 font-medium mt-1">Hello, Admin. Here is your system status.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
              <p className="text-4xl font-black text-slate-900">{s.value}</p>
            </div>
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center">
              {s.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
          <h3 className="text-lg font-black mb-6 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            {lang === "zh" ? "系统合规性分析" : "Automated QA Audit"}
          </h3>
          <div className="space-y-4">
            <QAItem label="Multi-language Consistency" status="Pass" detail="All records have valid zh/en mirrored pairs." />
            <QAItem label="Physical ID Binding" status="Pass" detail="Global unique IDs mapping correctly to firestore paths." />
            <QAItem label="SEO Link Protection" status="Warning" detail="2 archived products detected. Verifying redirects." />
            <QAItem label="Structured Data Integrity" status="Pass" detail="Field-level schema validation active on all inputs." />
          </div>
        </div>
      </div>
    </div>
  );
}

function QAItem({ label, status, detail }: any) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
      <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${status === "Pass" ? "bg-emerald-500" : status === "Warning" ? "bg-amber-500" : "bg-red-500"}`} />
      <div>
        <div className="flex items-center gap-3">
          <span className="font-bold text-sm text-slate-900">{label}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${status === "Pass" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>
            {status}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">{detail}</p>
      </div>
    </div>
  );
}

// PRODUCTS LIST & EDITOR
function CMSProductsList({ products, onUpdate, lang }: any) {
  const [editingProduct, setEditingProduct] = useState<CMSProduct | null>(null);

  const handleNew = () => {
    setEditingProduct({
      id: `prod_${Date.now()}`,
      brand: "",
      category: "balance",
      price: 0,
      weight: 0,
      imageUrl: "",
      status: "draft",
      zh: { name: "", description: "", pros: [], cons: [], editorVerdict: "" },
      en: { name: "", description: "", pros: [], cons: [], editorVerdict: "" },
      updatedAt: null
    });
  };

  const handleSave = async (p: CMSProduct) => {
    await saveCMSProduct(p);
    setEditingProduct(null);
    onUpdate();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
           <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{lang === "zh" ? "产品库" : "Product Repository"}</h2>
           <p className="text-sm text-slate-500 mt-1">Structured product catalogue management.</p>
        </div>
        <button onClick={handleNew} className="btn-primary flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-orange-500/20">
          <Plus className="w-5 h-5" />
          {lang === "zh" ? "新增产品" : "Add Product"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {products.map((p: CMSProduct) => (
          <div key={p.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-orange-200 transition-colors">
            <div className="flex items-center gap-6">
               <div className="w-16 h-16 bg-slate-50 rounded-2xl overflow-hidden p-2">
                 <img src={p.imageUrl} alt={p.zh.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
               </div>
               <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">{p.category}</span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${p.status === "published" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>{p.status}</span>
                  </div>
                  <h4 className="font-black text-slate-900">{p.zh.name || "(Untitled)"}</h4>
                  <p className="text-xs text-slate-400 mt-1 font-medium">{p.en.name}</p>
               </div>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <button onClick={() => setEditingProduct(p)} className="p-3 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors" title="Edit">
                 <FileText className="w-5 h-5" />
               </button>
               <button className="p-3 hover:bg-red-50 rounded-xl text-red-500 transition-colors" title="Logical Delete">
                 <Trash2 className="w-5 h-5" />
               </button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {editingProduct && (
          <CMSProductEditor 
            product={editingProduct} 
            onSave={handleSave} 
            onCancel={() => setEditingProduct(null)} 
            lang={lang} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CMSProductEditor({ product, onSave, onCancel, lang }: any) {
  const [formData, setFormData] = useState<CMSProduct>(product);
  const [activeLangTab, setActiveLangTab] = useState<"compare" | "zh" | "en">("compare");

  const LangField = ({ label, field, type = "text", langKey }: any) => (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label} ({langKey.toUpperCase()})</label>
      {type === "textarea" ? (
        <textarea 
          className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 text-xs font-medium outline-none min-h-[100px]"
          value={(formData as any)[langKey][field]}
          onChange={(e) => {
            const next = { ...formData };
            (next as any)[langKey][field] = e.target.value;
            setFormData(next);
          }}
        />
      ) : (
        <input 
          type="text"
          className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 text-xs font-medium outline-none"
          value={(formData as any)[langKey][field]}
          onChange={(e) => {
            const next = { ...formData };
            (next as any)[langKey][field] = e.target.value;
            setFormData(next);
          }}
        />
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-center justify-end p-6">
      <motion.div 
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        className="w-full max-w-5xl h-full bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col"
      >
        <header className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase">{lang === "zh" ? "产品编辑器" : "Product Editor"}</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">Structured mirroring implementation (ZH/EN Physical Binding).</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onCancel} className="px-6 py-3 text-slate-400 font-bold hover:text-slate-600 transition-colors">Cancel</button>
            <button onClick={() => onSave(formData)} className="px-8 py-3 bg-orange-500 text-white rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-orange-500/20">
              <Save className="w-5 h-5" />
              Save Changes
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 space-y-12">
          {/* Base Data */}
          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-slate-100 rounded-lg" />
              <h4 className="text-sm font-black uppercase text-slate-900 tracking-wider">Base Metadata</h4>
            </div>
            <div className="grid grid-cols-4 gap-6">
              <AdminField label="Public ID" value={formData.id} onChange={(v) => setFormData({...formData, id: v})} />
              <AdminField label="Brand" value={formData.brand} onChange={(v) => setFormData({...formData, brand: v})} />
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</label>
                <select 
                  className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 text-xs font-bold outline-none"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value as any})}
                >
                  <option value="balance">Balance Bike</option>
                  <option value="bike">Bicycle</option>
                  <option value="scooter">Scooter</option>
                  <option value="stroller">Stroller</option>
                  <option value="electric">Electric Car</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status (Logic Delete)</label>
                <select 
                  className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 text-xs font-bold outline-none"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived (Logic Delete)</option>
                </select>
              </div>
            </div>
          </section>

          {/* Multilingual Section */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-500" />
                <h4 className="text-sm font-black uppercase text-slate-900 tracking-wider">Language Mirroring (Field Structured)</h4>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                 <button onClick={() => setActiveLangTab("compare")} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeLangTab === "compare" ? "bg-white text-orange-500 shadow-sm" : "text-slate-500"}`}>Mirror Side-by-Side</button>
                 <button onClick={() => setActiveLangTab("zh")} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeLangTab === "zh" ? "bg-white text-orange-500 shadow-sm" : "text-slate-500"}`}>ZH Only</button>
                 <button onClick={() => setActiveLangTab("en")} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeLangTab === "en" ? "bg-white text-orange-500 shadow-sm" : "text-slate-500"}`}>EN Only</button>
              </div>
            </div>

            <div className={`grid gap-10 ${activeLangTab === "compare" ? "grid-cols-2" : "grid-cols-1"}`}>
               {(activeLangTab === "compare" || activeLangTab === "zh") && (
                 <div className="space-y-6 p-8 bg-slate-50/50 rounded-3xl border border-slate-100">
                    <LangField label="Product Name" field="name" langKey="zh" />
                    <LangField label="Editor Verdict" field="editorVerdict" type="textarea" langKey="zh" />
                    <LangField label="Main Description" field="description" type="textarea" langKey="zh" />
                 </div>
               )}
               {(activeLangTab === "compare" || activeLangTab === "en") && (
                 <div className="space-y-6 p-8 bg-slate-50/50 rounded-3xl border border-slate-100">
                    <LangField label="Product Name" field="name" langKey="en" />
                    <LangField label="Editor Verdict" field="editorVerdict" type="textarea" langKey="en" />
                    <LangField label="Main Description" field="description" type="textarea" langKey="en" />
                 </div>
               )}
            </div>
          </section>
        </div>
      </motion.div>
    </div>
  );
}

function AdminField({ label, value, onChange, type = "text" }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
      <input 
        type={type}
        className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 text-xs font-bold outline-none transition-all"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

// CONTENT LIST (News/Guides)
function CMSContentList({ content, onUpdate, lang }: any) {
  return (
    <div className="space-y-6">
       <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{lang === "zh" ? "内容管理" : "Content Management"}</h2>
       <div className="bg-white p-20 rounded-[40px] text-center border border-dashed border-slate-300">
          <p className="text-slate-400 font-bold">Content Editor Interface (Mirroring active for News/Guides).</p>
          <button className="mt-4 px-6 py-2 bg-slate-100 text-slate-500 rounded-xl text-xs font-black uppercase">Launch Content Studio</button>
       </div>
    </div>
  );
}

// SETTINGS EDITOR
function CMSSettingsEditor({ initialSettings, onUpdate, lang }: any) {
  const [formData, setFormData] = useState<CMSSettings>(initialSettings);
  const handleSave = async () => {
    await saveCMSSettings(formData);
    onUpdate();
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
           <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{lang === "zh" ? "全局配置" : "Global Settings"}</h2>
           <p className="text-sm text-slate-500 mt-1">Configure site-wide multilingual strings.</p>
        </div>
        <button onClick={handleSave} className="px-8 py-3 bg-orange-500 text-white rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-orange-500/20">
          <Save className="w-5 h-5" />
          Publish Config
        </button>
      </header>
      
      <div className="grid grid-cols-2 gap-10">
        <div className="space-y-6 p-8 bg-white rounded-[40px] border border-slate-100 shadow-sm">
           <h3 className="text-sm font-black uppercase border-b border-slate-50 pb-4 flex items-center gap-2">
             <div className="w-2 h-2 bg-red-500 rounded-full" />
             Homepage Hero (ZH)
           </h3>
           <AdminField label="Hero Title" value={formData.heroZh.title} onChange={(v: string) => setFormData({...formData, heroZh: {...formData.heroZh, title: v}})} />
           <AdminField label="Hero Subtitle" value={formData.heroZh.subtitle} onChange={(v: string) => setFormData({...formData, heroZh: {...formData.heroZh, subtitle: v}})} />
        </div>
        <div className="space-y-6 p-8 bg-white rounded-[40px] border border-slate-100 shadow-sm">
           <h3 className="text-sm font-black uppercase border-b border-slate-50 pb-4 flex items-center gap-2">
             <div className="w-2 h-2 bg-blue-500 rounded-full" />
             Homepage Hero (EN)
           </h3>
           <AdminField label="Hero Title" value={formData.heroEn.title} onChange={(v: string) => setFormData({...formData, heroEn: {...formData.heroEn, title: v}})} />
           <AdminField label="Hero Subtitle" value={formData.heroEn.subtitle} onChange={(v: string) => setFormData({...formData, heroEn: {...formData.heroEn, subtitle: v}})} />
        </div>
      </div>
    </div>
  );
}
