import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Save, 
  FileText, 
  Search, 
  AlertTriangle, 
  ListOrdered,
  Layout,
  Search as SearchIcon,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getCMSGuides, saveCMSGuide, deleteCMSGuide, getCMSProducts, getCMSScenarios } from "../../lib/cmsService";
import { Guide, RiskCard, SEOConfig, CMSProduct, CMSScenario, ProductCategory, GuideTopicCategory } from "../../types";
import { deleteD1CMSGuide, getD1CMSGuides, getD1CMSProducts, getD1CMSScenarios, saveD1CMSGuide } from "../../lib/cmsD1Service";
import BackendResourcePicker from "./BackendResourcePicker";
import ScenarioPicker from "./ScenarioPicker";

const GUIDE_PRODUCT_CATEGORY_OPTIONS: ProductCategory[] = [
  "stroller",
  "balance",
  "bicycle",
  "scooter",
  "electric_car",
  "tricycle",
  "safety_seat",
];

const GUIDE_TOPIC_OPTIONS: Array<{ value: GuideTopicCategory; zh: string; en: string }> = [
  { value: "beginner", zh: "Beginner Entry / 新手入门", en: "Beginner Entry" },
  { value: "budget", zh: "Budget Guide / 预算指南", en: "Budget Guide" },
  { value: "special", zh: "Category Special / 品类专项", en: "Category Special" },
  { value: "best", zh: "2026 Best Picks / 年度评测大奖", en: "2026 Best Picks" },
  { value: "scenario", zh: "Scenario Guide / 场景指南", en: "Scenario Guide" },
  { value: "risk", zh: "Risk ID Guide / 风险识别", en: "Risk ID Guide" },
  { value: "maintenance", zh: "Maintenance / 养护清单", en: "Maintenance" },
];

function normalizeGuideTaxonomy(guide: Guide): Guide {
  const validProductCategories = new Set<string>(GUIDE_PRODUCT_CATEGORY_OPTIONS);
  const fallbackProductCategory = validProductCategories.has(String(guide.taxonomy?.productCategory || ""))
    ? (guide.taxonomy?.productCategory as ProductCategory)
    : "stroller";
  const fallbackCategory = (guide.category || "beginner") as GuideTopicCategory;
  const topicCategory = GUIDE_TOPIC_OPTIONS.some((item) => item.value === fallbackCategory)
    ? fallbackCategory
    : "beginner";

  return {
    ...guide,
    category: topicCategory,
    taxonomy: {
      productCategory: fallbackProductCategory,
      hub: "all_guides",
      topicCategory: guide.taxonomy?.topicCategory || topicCategory,
      topicOrder: Number(guide.taxonomy?.topicOrder || 1),
      hierarchyPath:
        guide.taxonomy?.hierarchyPath && guide.taxonomy.hierarchyPath.length > 0
          ? guide.taxonomy.hierarchyPath
          : [fallbackProductCategory, "all_guides", guide.taxonomy?.topicCategory || topicCategory],
    },
  };
}

export default function GuideManager({ lang }: { lang: "zh" | "en" }) {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [products, setProducts] = useState<CMSProduct[]>([]);
  const [scenarios, setScenarios] = useState<CMSScenario[]>([]);
  const [editingGuide, setEditingGuide] = useState<Guide | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    let guidesData: Guide[] = [];
    let productsData: CMSProduct[] = [];
    let scenariosData: CMSScenario[] = [];

    try {
      guidesData = await getD1CMSGuides(false);
    } catch {
      guidesData = [];
    }
    if (guidesData.length === 0) {
      guidesData = await getCMSGuides();
    }

    try {
      productsData = await getD1CMSProducts(false);
    } catch {
      productsData = [];
    }
    if (productsData.length === 0) {
      productsData = await getCMSProducts();
    }

    try {
      scenariosData = await getD1CMSScenarios(true);
    } catch {
      scenariosData = [];
    }
    if (scenariosData.length === 0) {
      scenariosData = await getCMSScenarios(true);
    }

    setGuides(guidesData);
    setProducts(productsData);
    setScenarios(scenariosData);
  };

  const handleDelete = async (id: string) => {
    const isZh = lang === "zh";
    const confirmMsg = isZh 
      ? "您确定要彻底删除该指南吗？此操作不可逆。" 
      : "Are you sure you want to permanently delete this guide? This action cannot be undone.";

    if (window.confirm(confirmMsg)) {
      try {
        let success = false;
        try {
          success = await deleteD1CMSGuide(id);
          if (!success) {
            throw new Error("D1 delete failed");
          }
        } catch {
          success = await deleteCMSGuide(id);
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
    setEditingGuide(normalizeGuideTaxonomy({
      id: `guide_${Date.now()}`,
      category: "beginner",
      status: "draft",
      imageUrl: "",
      riskCards: [],
      seo: {
        zh: { title: "", description: "", keywords: [] },
        en: { title: "", description: "", keywords: [] }
      },
      zh: { title: "", content: "" },
      en: { title: "", content: "" },
      relatedProductIds: [],
      scenarioIds: [],
      taxonomy: {
        productCategory: "stroller",
        hub: "all_guides",
        topicCategory: "beginner",
        topicOrder: 1,
        hierarchyPath: ["stroller", "all_guides", "beginner"],
      },
      updatedAt: null
    }));
  };

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async (g: Guide) => {
    setSaving(true);
    setSaveError(null);
    try {
      try {
        const saved = await saveD1CMSGuide(g);
        if (!saved) {
          throw new Error("D1 save failed");
        }
      } catch {
        await saveCMSGuide(g);
      }
      setEditingGuide(null);
      fetchData();
    } catch (e: any) {
      console.error(e);
      let errorMsg = e.message || String(e);
      let niceError = errorMsg;
      if (errorMsg.includes("Missing or insufficient permissions")) {
        niceError = lang === "zh"
          ? "权限不足 (Permission Denied)：您当前没有在 Firebase Auth 进行真实登录。本地 Bypass 模式仅有只读权限。请点击右上角「我的账户」使用 Google 账号进行登录后再试."
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
                <h4 className="font-black text-slate-900">{g.zh?.title || g.en?.title || "(No Title)"}</h4>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-tight mt-0.5">{g.riskCards.length} Risk Cards Active</p>
              </div>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => setEditingGuide(normalizeGuideTaxonomy(g))}
                className="p-4 hover:bg-slate-100 rounded-2xl text-slate-600 transition-all text-xs font-black uppercase tracking-widest flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4 text-blue-500" />
                Open Editor
              </button>
              <button 
                onClick={() => handleDelete(g.id)}
                className="p-4 hover:bg-red-50 rounded-2xl text-red-400 transition-all font-bold"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {editingGuide && (
          <GuideEditor 
            guide={editingGuide} 
            products={products}
            scenarios={scenarios}
            onSave={handleSave} 
            saving={saving}
            error={saveError}
            onCancel={() => setEditingGuide(null)} 
            lang={lang} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function GuideEditor({ guide, products, scenarios, onSave, onCancel, lang, saving, error }: any) {
  const [formData, setFormData] = useState<Guide>(normalizeGuideTaxonomy(guide));
  const [activeTab, setActiveTab] = useState<"content" | "risk" | "seo">("content");
  const [activeLang, setActiveLang] = useState<"zh" | "en">("zh");
  const [pickerMode, setPickerMode] = useState<"cover" | "related" | null>(null);
  const [scenarioPickerOpen, setScenarioPickerOpen] = useState(false);

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

  const applyResourceSelection = (selection: { imageUrls: string[]; videoUrls: string[]; relatedProductIds: string[] }) => {
    if (pickerMode === "cover") {
      setFormData((prev) => ({ ...prev, imageUrl: selection.imageUrls[0] || prev.imageUrl || "" }));
      return;
    }
    if (pickerMode === "related") {
      setFormData((prev) => ({
        ...prev,
        relatedProductIds: Array.from(new Set([...(prev.relatedProductIds || []), ...selection.relatedProductIds].filter(Boolean))),
      }));
    }
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
            <button onClick={onCancel} disabled={saving} className="px-8 py-3 text-slate-400 font-black hover:text-slate-900 transition-colors disabled:opacity-50">Discard</button>
            <button 
              onClick={() => onSave(formData)}
              disabled={saving}
              className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-slate-900/10 hover:bg-blue-600 transition-all disabled:bg-slate-200 disabled:text-slate-400 cursor-pointer"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
                  <span>{lang === "zh" ? "发布中..." : "Publishing..."}</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 text-blue-400" />
                  <span>{lang === "zh" ? "保存并发布" : "Commit Guide"}</span>
                </>
              )}
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
                        ? "1. 请点击预览窗口右上角的「在新标签页中打开」按钮（以绕过跨域 iframe 的安全限制）。\n2. 在新标签页 of your browser page点击「账户」进行 Google 真实登录，即可顺利向云数据库发布更新。"
                        : "1. Click 'Open in New Tab' at the top-right of your preview frame (to bypass iframe sandboxing limits).\n2. Navigate to 'Account' on your tab, sign in securely with Google, and try editing again."}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "content" && (
              <div className="max-w-3xl mx-auto space-y-10">
                <section className="space-y-4 bg-white border border-slate-100 rounded-2xl p-6">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-700">Cross-module Linkage</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Guide Product Category</label>
                      <select
                        className="w-full bg-slate-50 border border-slate-200 py-3 px-4 rounded-xl text-xs font-bold"
                        value={formData.taxonomy?.productCategory || "stroller"}
                        onChange={(e) => {
                          const nextCategory = e.target.value as ProductCategory;
                          setFormData((prev) => ({
                            ...prev,
                            taxonomy: {
                              ...(prev.taxonomy || {}),
                              productCategory: nextCategory,
                              hub: "all_guides",
                              topicCategory: prev.taxonomy?.topicCategory || "beginner",
                              topicOrder: Number(prev.taxonomy?.topicOrder || 1),
                              hierarchyPath: [nextCategory, "all_guides", prev.taxonomy?.topicCategory || "beginner"],
                            },
                          }));
                        }}
                      >
                        {GUIDE_PRODUCT_CATEGORY_OPTIONS.map((code) => (
                          <option key={code} value={code}>{code}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Guide Hub</label>
                      <input
                        className="w-full bg-slate-100 border border-slate-200 py-3 px-4 rounded-xl text-xs font-bold text-slate-600"
                        value={formData.taxonomy?.hub || "all_guides"}
                        readOnly
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Topic Level (L3)</label>
                      <select
                        className="w-full bg-slate-50 border border-slate-200 py-3 px-4 rounded-xl text-xs font-bold"
                        value={formData.taxonomy?.topicCategory || "beginner"}
                        onChange={(e) => {
                          const topicCategory = e.target.value as GuideTopicCategory;
                          setFormData((prev) => ({
                            ...prev,
                            category: topicCategory,
                            taxonomy: {
                              ...(prev.taxonomy || {}),
                              productCategory: prev.taxonomy?.productCategory || "stroller",
                              hub: "all_guides",
                              topicCategory,
                              topicOrder: Number(prev.taxonomy?.topicOrder || 1),
                              hierarchyPath: [prev.taxonomy?.productCategory || "stroller", "all_guides", topicCategory],
                            },
                          }));
                        }}
                      >
                        {GUIDE_TOPIC_OPTIONS.map((item) => (
                          <option key={item.value} value={item.value}>{lang === "zh" ? item.zh : item.en}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Topic Order</label>
                      <input
                        type="number"
                        min={1}
                        className="w-full bg-slate-50 border border-slate-200 py-3 px-4 rounded-xl text-xs font-bold"
                        value={Number(formData.taxonomy?.topicOrder || 1)}
                        onChange={(e) => {
                          const topicOrder = Math.max(1, parseInt(e.target.value, 10) || 1);
                          setFormData((prev) => ({
                            ...prev,
                            taxonomy: {
                              ...(prev.taxonomy || {}),
                              productCategory: prev.taxonomy?.productCategory || "stroller",
                              hub: "all_guides",
                              topicCategory: prev.taxonomy?.topicCategory || "beginner",
                              topicOrder,
                              hierarchyPath: [prev.taxonomy?.productCategory || "stroller", "all_guides", prev.taxonomy?.topicCategory || "beginner"],
                            },
                          }));
                        }}
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Hierarchy Preview</p>
                    <p className="text-xs font-bold text-slate-700 mt-1">
                      {(formData.taxonomy?.productCategory || "stroller") + " -> all_guides -> " + (formData.taxonomy?.topicCategory || "beginner")}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Related Products</label>
                      <button
                        onClick={() => setPickerMode("related")}
                        className="w-full py-2.5 border border-sky-200 bg-sky-50 text-sky-700 rounded-xl text-[11px] font-black hover:bg-sky-100 transition-all"
                      >
                        {lang === "zh" ? "从 backend 资源选择产品" : "Pick Related Products From Backend"}
                      </button>
                      <select
                        className="w-full bg-slate-50 border border-slate-200 py-3 px-4 rounded-xl text-xs font-bold"
                        value=""
                        onChange={(e) => {
                          const value = e.target.value;
                          if (!value) return;
                          const next = Array.from(new Set([...(formData.relatedProductIds || []), value]));
                          setFormData({ ...formData, relatedProductIds: next });
                          e.currentTarget.value = "";
                        }}
                      >
                        <option value="">Select product...</option>
                        {products.map((p: CMSProduct) => (
                          <option key={p.id} value={p.id}>{p.zh?.name || p.en?.name || p.id}</option>
                        ))}
                      </select>
                      <div className="flex flex-wrap gap-2">
                        {(formData.relatedProductIds || []).map((id) => (
                          <button
                            key={id}
                            onClick={() => setFormData({ ...formData, relatedProductIds: (formData.relatedProductIds || []).filter((item) => item !== id) })}
                            className="px-2 py-1 rounded-full text-[10px] font-black bg-slate-200 text-slate-700"
                          >
                            {id} ×
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Related Scenarios</label>
                      <button
                        onClick={() => setScenarioPickerOpen(true)}
                        className="w-full py-2.5 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-xl text-[11px] font-black hover:bg-emerald-100 transition-all"
                      >
                        {lang === "zh" ? "可视化选择场景" : "Visual Scenario Picker"}
                      </button>
                      <select
                        className="w-full bg-slate-50 border border-slate-200 py-3 px-4 rounded-xl text-xs font-bold"
                        value=""
                        onChange={(e) => {
                          const value = e.target.value;
                          if (!value) return;
                          const next = Array.from(new Set([...(formData.scenarioIds || []), value]));
                          setFormData({ ...formData, scenarioIds: next });
                          e.currentTarget.value = "";
                        }}
                      >
                        <option value="">Select scenario...</option>
                        {scenarios.map((s: CMSScenario) => (
                          <option key={s.id} value={s.code}>{s.zh?.name || s.en?.name || s.code}</option>
                        ))}
                      </select>
                      <div className="flex flex-wrap gap-2">
                        {(formData.scenarioIds || []).map((id) => (
                          <button
                            key={id}
                            onClick={() => setFormData({ ...formData, scenarioIds: (formData.scenarioIds || []).filter((item) => item !== id) })}
                            className="px-2 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700"
                          >
                            {id} ×
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Guide Cover Image URL</label>
                    <button
                      onClick={() => setPickerMode("cover")}
                      className="w-full py-2.5 border border-orange-200 bg-orange-50 text-orange-700 rounded-xl text-[11px] font-black hover:bg-orange-100 transition-all"
                    >
                      {lang === "zh" ? "从 backend 资源选择封面图" : "Pick Cover Image From Backend"}
                    </button>
                    <input
                      className="w-full bg-white border border-slate-200 py-3 px-4 rounded-xl text-xs font-bold"
                      value={formData.imageUrl || ""}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder={lang === "zh" ? "输入封面图 URL" : "Enter cover image URL"}
                    />
                  </div>
                </section>

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

      <BackendResourcePicker
        open={pickerMode !== null}
        mode={(pickerMode || "cover") as "cover" | "related"}
        lang={lang}
        onClose={() => setPickerMode(null)}
        onApply={applyResourceSelection}
      />

      <ScenarioPicker
        open={scenarioPickerOpen}
        lang={lang}
        scenarios={scenarios || []}
        selectedCodes={formData.scenarioIds || []}
        onClose={() => setScenarioPickerOpen(false)}
        onApply={(scenarioCodes) => setFormData((prev) => ({ ...prev, scenarioIds: Array.from(new Set(scenarioCodes.filter(Boolean))) }))}
      />
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
