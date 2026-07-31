import React, { useState, useEffect, useMemo } from "react";
import { 
  Plus, 
  Save, 
  FileText, 
  Search, 
  AlertTriangle, 
  ListOrdered,
  Layout,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getCMSGuides, saveCMSGuide, deleteCMSGuide, getCMSProducts, getCMSScenarios, migrateCMSGuidesTaxonomy } from "../../lib/cmsService";
import { Guide, RiskCard, CMSProduct, CMSScenario, ProductCategory, GuideTopicCategory } from "../../types";
import { deleteD1CMSGuide, getD1CMSGuides, getD1CMSProducts, getD1CMSScenarios, saveD1CMSGuide, migrateD1CMSGuidesTaxonomy } from "../../lib/cmsD1Service";
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
    pinned: Boolean((guide as any).pinned || (guide as any).featured),
    featured: Boolean((guide as any).pinned || (guide as any).featured),
    category: topicCategory,
    taxonomy: {
      productCategory: fallbackProductCategory,
      hub: "all_guides",
      topicCategory: guide.taxonomy?.topicCategory || topicCategory,
      topicOrder: Number(guide.taxonomy?.topicOrder || 1),
      pinOrder: Math.max(0, Number(guide.taxonomy?.pinOrder || 0) || 0),
      hierarchyPath:
        guide.taxonomy?.hierarchyPath && guide.taxonomy.hierarchyPath.length > 0
          ? guide.taxonomy.hierarchyPath
          : [fallbackProductCategory, "all_guides", guide.taxonomy?.topicCategory || topicCategory],
    },
  };
}

function parseKeywordInput(value: string): string[] {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function stringifyKeywords(keywords: unknown): string {
  if (!Array.isArray(keywords)) return "";
  return keywords.map((item) => String(item || "").trim()).filter(Boolean).join(", ");
}

export default function GuideManager({ lang, focusGuideId, onFocusGuideHandled }: { lang: "zh" | "en", focusGuideId?: string, onFocusGuideHandled?: () => void }) {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [products, setProducts] = useState<CMSProduct[]>([]);
  const [scenarios, setScenarios] = useState<CMSScenario[]>([]);
  const [editingGuide, setEditingGuide] = useState<Guide | null>(null);
  const [migratingTaxonomy, setMigratingTaxonomy] = useState(false);
  const [autoPinning, setAutoPinning] = useState(false);
  const [topicFilter, setTopicFilter] = useState<"all" | GuideTopicCategory>("all");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!focusGuideId) return;
    const matchedGuide = guides.find((guide) => guide.id === focusGuideId);
    if (!matchedGuide) return;

    setEditingGuide(normalizeGuideTaxonomy(matchedGuide));
    onFocusGuideHandled?.();
  }, [focusGuideId, guides, onFocusGuideHandled]);

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
        pinOrder: 0,
        hierarchyPath: ["stroller", "all_guides", "beginner"],
      },
      pinned: false,
      featured: false,
      updatedAt: null
    }));
  };

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleMigrateTaxonomy = async () => {
    if (migratingTaxonomy) return;
    const isZh = lang === "zh";
    const ok = window.confirm(
      isZh
        ? "确认对现有指南执行 taxonomy 迁移吗？系统将自动补齐品类、层级与排序字段。"
        : "Run taxonomy migration for existing guides? Missing category hierarchy fields will be auto-filled.",
    );
    if (!ok) return;

    setMigratingTaxonomy(true);
    try {
      let result: { processed: number; updated: number } | null = null;
      try {
        result = await migrateD1CMSGuidesTaxonomy();
      } catch {
        result = await migrateCMSGuidesTaxonomy();
      }

      alert(
        isZh
          ? `迁移完成：共扫描 ${result.processed} 篇，更新 ${result.updated} 篇。`
          : `Migration complete: processed ${result.processed}, updated ${result.updated}.`,
      );
      await fetchData();
    } catch (e: any) {
      console.error(e);
      alert(e.message || String(e));
    } finally {
      setMigratingTaxonomy(false);
    }
  };

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
          ? "权限不足 (Permission Denied)：当前会话未通过可写权限验证。开发者 Bypass 模式通常为只读，请使用真实管理员登录后重试。"
          : "Permission Denied: The current session is not authorized for write access. Developer bypass is typically read-only. Please sign in with a real admin account and retry.";
      } else if (errorMsg.includes("Operation timed out")) {
        niceError = lang === "zh"
          ? "网络超时：无法连接 CMS 接口。请检查网络/代理设置，或重新登录后再试。"
          : "Operation Timed Out: Failed to reach CMS endpoints. Please check your network/proxy settings or sign in again.";
      }
      setSaveError(niceError);
    } finally {
      setSaving(false);
    }
  };

  const saveGuideRecord = async (g: Guide) => {
    try {
      const saved = await saveD1CMSGuide(g);
      if (!saved) {
        throw new Error("D1 save failed");
      }
    } catch {
      await saveCMSGuide(g);
    }
  };

  const getGuideUpdatedAtMillis = (value: any): number => {
    if (!value) return 0;
    if (typeof value === "number") return Number(value);
    if (typeof value === "string") {
      const t = Date.parse(value);
      return Number.isNaN(t) ? 0 : t;
    }
    if (value instanceof Date) return value.getTime();
    if (typeof value === "object" && value.seconds) {
      return Number(value.seconds || 0) * 1000;
    }
    return 0;
  };

  const handleAutoPinOrder = async () => {
    if (autoPinning) return;
    const isZh = lang === "zh";
    const ok = window.confirm(
      isZh
        ? "确认自动补齐全品类 pinOrder 吗？系统将仅对“尚未配置 pinOrder>0”的品类自动挑选 1 篇指南并写入 pinOrder=1。"
        : "Auto-fill all-category pinOrder now? This only updates categories that do not yet have any guide with pinOrder>0.",
    );
    if (!ok) return;

    setAutoPinning(true);
    try {
      const normalized = guides.map(normalizeGuideTaxonomy);
      const updates: Array<{ category: ProductCategory; guide: Guide }> = [];

      for (const category of GUIDE_PRODUCT_CATEGORY_OPTIONS) {
        const inCategory = normalized.filter((guide) => (guide.taxonomy?.productCategory || "stroller") === category);
        if (inCategory.length === 0) continue;

        const hasPinConfigured = inCategory.some((guide) => Number(guide.taxonomy?.pinOrder || 0) > 0);
        if (hasPinConfigured) continue;

        const picked = [...inCategory].sort((a, b) => {
          const statusDiff = Number(String(b.status || "") === "published") - Number(String(a.status || "") === "published");
          if (statusDiff !== 0) return statusDiff;
          const topicDiff = Number(a.taxonomy?.topicOrder || 9999) - Number(b.taxonomy?.topicOrder || 9999);
          if (topicDiff !== 0) return topicDiff;
          const updatedDiff = getGuideUpdatedAtMillis(b.updatedAt) - getGuideUpdatedAtMillis(a.updatedAt);
          if (updatedDiff !== 0) return updatedDiff;
          return String(a.id || "").localeCompare(String(b.id || ""));
        })[0];

        if (!picked) continue;

        const nextGuide: Guide = normalizeGuideTaxonomy({
          ...picked,
          pinned: true,
          featured: true,
          taxonomy: {
            ...(picked.taxonomy || {}),
            productCategory: category,
            hub: "all_guides",
            topicCategory: (picked.taxonomy?.topicCategory || picked.category || "beginner") as GuideTopicCategory,
            topicOrder: Number(picked.taxonomy?.topicOrder || 1),
            pinOrder: 1,
            hierarchyPath: [category, "all_guides", (picked.taxonomy?.topicCategory || picked.category || "beginner") as string],
          },
        });
        updates.push({ category, guide: nextGuide });
      }

      if (updates.length === 0) {
        alert(isZh ? "无需自动补齐：所有有内容的品类都已配置 pinOrder。" : "No update needed: all populated categories already have pinOrder configured.");
        return;
      }

      for (const item of updates) {
        await saveGuideRecord(item.guide);
      }

      await fetchData();
      alert(
        isZh
          ? `自动补齐完成：共更新 ${updates.length} 个品类（${updates.map((x) => x.category).join(", ")}）。`
          : `Auto pinOrder completed: updated ${updates.length} categories (${updates.map((x) => x.category).join(", ")}).`,
      );
    } catch (e: any) {
      console.error(e);
      alert(e.message || String(e));
    } finally {
      setAutoPinning(false);
    }
  };

  const visibleGuides = useMemo(() => {
    return guides
      .map(normalizeGuideTaxonomy)
      .filter((guide) => {
        if (topicFilter === "all") return true;
        return (guide.taxonomy?.topicCategory || guide.category) === topicFilter;
      })
      .sort((a, b) => {
        const topicA = Number(a.taxonomy?.topicOrder || 9999);
        const topicB = Number(b.taxonomy?.topicOrder || 9999);
        if (topicA !== topicB) return topicA - topicB;
        return String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""));
      });
  }, [guides, topicFilter]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{lang === "zh" ? "选购指南" : "Buying Guides"}</h2>
          <p className="text-slate-500 font-medium mt-1">SEOized cornerstone content for global conversion.</p>
          <div className="mt-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
              {lang === "zh" ? "三级栏目筛选" : "Topic Filter"}
            </label>
            <select
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700"
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value as "all" | GuideTopicCategory)}
            >
              <option value="all">{lang === "zh" ? "全部栏目" : "All Topics"}</option>
              {GUIDE_TOPIC_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>{lang === "zh" ? item.zh : item.en}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleAutoPinOrder}
            disabled={autoPinning}
            className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-6 py-4 rounded-3xl font-black shadow-sm hover:-translate-y-1 transition-all disabled:opacity-60"
          >
            <ListOrdered className="w-5 h-5 text-emerald-500" />
            {autoPinning
              ? (lang === "zh" ? "补齐中" : "Auto-filling")
              : (lang === "zh" ? "自动补齐 pinOrder" : "Auto Fill pinOrder")}
          </button>

          <button
            onClick={handleMigrateTaxonomy}
            disabled={migratingTaxonomy}
            className="flex items-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 px-6 py-4 rounded-3xl font-black shadow-sm hover:-translate-y-1 transition-all disabled:opacity-60"
          >
            <Save className="w-5 h-5 text-amber-500" />
            {migratingTaxonomy
              ? (lang === "zh" ? "迁移中" : "Migrating")
              : (lang === "zh" ? "一键迁移 taxonomy" : "Migrate Taxonomy")}
          </button>

          <p className="max-w-[420px] text-[11px] leading-relaxed text-amber-700/90 font-semibold">
            {lang === "zh"
              ? "用途：把旧指南自动补齐 taxonomy（topicCategory / topicOrder / productCategory）。适用：升级到 CMS 2.0 或导入历史数据后。结果：processed=扫描总数，updated=实际写入数。"
              : "Purpose: auto-fill missing taxonomy fields (topicCategory / topicOrder / productCategory) for legacy guides. Run this after CMS 2.0 upgrades or historical imports. Result: processed = scanned guides, updated = actually updated guides."}
          </p>

          <button onClick={handleNew} className="btn-primary flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-3xl font-black shadow-2xl shadow-slate-900/10 hover:-translate-y-1 transition-all">
            <Plus className="w-5 h-5 text-blue-400" />
            {lang === "zh" ? "撰写指南" : "Compose Guide"}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {visibleGuides.map((g) => (
          <div key={g.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
                <ListOrdered className="w-8 h-8 text-blue-500" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-black uppercase bg-blue-100 text-blue-600 px-2.5 py-1 rounded-full">{g.taxonomy?.topicCategory || g.category}</span>
                  <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">{g.taxonomy?.productCategory || "stroller"}</span>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${Number(g.taxonomy?.pinOrder || 0) > 0 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {`pin:${Number(g.taxonomy?.pinOrder || 0)}`}
                  </span>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${g.status === "published" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"}`}>
                    {g.status}
                  </span>
                </div>
                <h4 className="font-black text-slate-900">{(lang === "zh" ? g.zh?.title : g.en?.title) || (lang === "zh" ? g.en?.title : g.zh?.title) || "(No Title)"}</h4>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-tight mt-0.5">
                  {(lang === "zh" ? g.en?.title : g.zh?.title) || `${g.riskCards.length} Risk Cards Active`}
                </p>
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
  const [activeTab, setActiveTab] = useState<"content" | "risk">("content");
  const [pickerMode, setPickerMode] = useState<"cover" | "related" | null>(null);
  const [scenarioPickerOpen, setScenarioPickerOpen] = useState(false);
  const previewTopic = String(formData.taxonomy?.topicCategory || formData.category || "beginner").trim().toLowerCase();
  const previewGuideId = String(formData.id || "").trim();
  const previewPath = previewGuideId
    ? `/guides/${previewTopic}/${encodeURIComponent(previewGuideId)}`
    : `/guides/${previewTopic}`;
  const previewBreadcrumb = previewPath
    .replace(/^\//, "")
    .split("/")
    .join(" › ");

  const updateGuideLocale = (locale: "zh" | "en", key: "title" | "content", value: string) => {
    setFormData((prev) => ({
      ...prev,
      [locale]: {
        ...prev[locale],
        [key]: value,
      },
    }));
  };

  const updateSeoLocale = (locale: "zh" | "en", key: "title" | "description" | "keywords", value: string | string[]) => {
    setFormData((prev) => ({
      ...prev,
      seo: {
        ...prev.seo,
        [locale]: {
          ...prev.seo[locale],
          [key]: value,
        },
      },
    }));
  };

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
                  <span>{lang === "zh" ? "发布中" : "Publishing"}</span>
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
            <NavBtn active={activeTab === "content"} onClick={() => setActiveTab("content")} label={lang === "zh" ? "正文编辑" : "Main Content"} icon={<FileText className="w-4 h-4" />} />
            <NavBtn active={activeTab === "risk"} onClick={() => setActiveTab("risk")} label={lang === "zh" ? "风险模块" : "Risk Modules"} icon={<AlertTriangle className="w-4 h-4" />} />
            
            <div className="mt-auto border-t border-slate-100 pt-8 bg-slate-50 p-3 rounded-2xl">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{lang === "zh" ? "中英同屏编辑模式" : "Side-by-side bilingual mode"}</p>
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
                        ? "1. 请点击预览窗口右上角的「在新标签页中打开」按钮（以绕过跨域 iframe 的安全限制）。\n2. 在浏览器新标签页中点击「账户」进行 Google 真实登录，即可顺利向云数据库发布更新。"
                        : "1. Click 'Open in New Tab' at the top-right of your preview frame (to bypass iframe sandboxing limits).\n2. Navigate to 'Account' on your tab, sign in securely with Google, and try editing again."}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "content" && (
              <div className="max-w-3xl mx-auto space-y-10">
                <section className="space-y-4 bg-white border border-slate-100 rounded-2xl p-6">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-700">{lang === "zh" ? "跨模块关联" : "Cross-module Linkage"}</h4>
                    <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{lang === "zh" ? "置顶文章" : "Pinned Guide"}</p>
                        <p className="text-xs font-bold text-slate-700 mt-1">{lang === "zh" ? "勾选后，这篇指南会优先显示在对应品类列表最前。" : "When checked, this guide will appear first in its category list."}</p>
                      </div>
                      <label className="inline-flex items-center gap-2 cursor-pointer select-none shrink-0">
                        <input
                          type="checkbox"
                          checked={Boolean(formData.pinned || formData.featured)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setFormData((prev) => ({
                              ...prev,
                              pinned: checked,
                              featured: checked,
                            }));
                          }}
                          className="h-4 w-4 accent-amber-500"
                        />
                        <span className="text-xs font-black text-slate-700 uppercase tracking-widest">{lang === "zh" ? "置顶" : "Pinned"}</span>
                      </label>
                    </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lang === "zh" ? "指南产品类目" : "Guide Product Category"}</label>
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
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lang === "zh" ? "指南聚合页" : "Guide Hub"}</label>
                      <input
                        className="w-full bg-slate-100 border border-slate-200 py-3 px-4 rounded-xl text-xs font-bold text-slate-600"
                        value={formData.taxonomy?.hub || "all_guides"}
                        readOnly
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lang === "zh" ? "主题层级（L3）" : "Topic Level (L3)"}</label>
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
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lang === "zh" ? "主题排序" : "Topic Order"}</label>
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

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lang === "zh" ? "全品类置顶序号" : "All-Category Pin Order"}</label>
                      <input
                        type="number"
                        min={0}
                        className="w-full bg-slate-50 border border-slate-200 py-3 px-4 rounded-xl text-xs font-bold"
                        value={Number(formData.taxonomy?.pinOrder || 0)}
                        onChange={(e) => {
                          const pinOrder = Math.max(0, parseInt(e.target.value, 10) || 0);
                          setFormData((prev) => ({
                            ...prev,
                            taxonomy: {
                              ...(prev.taxonomy || {}),
                              productCategory: prev.taxonomy?.productCategory || "stroller",
                              hub: "all_guides",
                              topicCategory: prev.taxonomy?.topicCategory || "beginner",
                              topicOrder: Number(prev.taxonomy?.topicOrder || 1),
                              pinOrder,
                              hierarchyPath: [prev.taxonomy?.productCategory || "stroller", "all_guides", prev.taxonomy?.topicCategory || "beginner"],
                            },
                          }));
                        }}
                      />
                      <p className="text-[10px] text-slate-400 font-bold">{lang === "zh" ? "0 = 不参与全品类置顶；1/2/3+ = 参与并按序号优先。" : "0 = excluded from all-category pinning; 1/2/3+ = included and prioritized by order."}</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{lang === "zh" ? "层级预览" : "Hierarchy Preview"}</p>
                    <p className="text-xs font-bold text-slate-700 mt-1">
                      {(formData.taxonomy?.productCategory || "stroller") + " -> all_guides -> " + (formData.taxonomy?.topicCategory || "beginner")}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lang === "zh" ? "关联产品" : "Related Products"}</label>
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
                        <option value="">{lang === "zh" ? "选择产品" : "Select product"}</option>
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
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lang === "zh" ? "关联场景" : "Related Scenarios"}</label>
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
                        <option value="">{lang === "zh" ? "选择场景" : "Select scenario"}</option>
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
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lang === "zh" ? "指南封面图 URL" : "Guide Cover Image URL"}</label>
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

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className="space-y-4 bg-white border border-slate-100 rounded-[28px] p-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">中文内容</p>
                    <Field label="中文标题" value={formData.zh.title} onChange={(v: string) => updateGuideLocale("zh", "title", v)} />
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">中文正文</label>
                      <textarea 
                        className="w-full bg-white border border-slate-200 p-6 rounded-3xl font-medium text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 min-h-[420px] shadow-sm leading-relaxed"
                        placeholder="请输入中文指南正文"
                        value={formData.zh.content}
                        onChange={(e) => updateGuideLocale("zh", "content", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4 bg-white border border-slate-100 rounded-[28px] p-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">English Content</p>
                    <Field label="English Title" value={formData.en.title} onChange={(v: string) => updateGuideLocale("en", "title", v)} />
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Guide Narrative</label>
                      <textarea 
                        className="w-full bg-white border border-slate-200 p-6 rounded-3xl font-medium text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 min-h-[420px] shadow-sm leading-relaxed"
                        placeholder="Start writing scientific guide content..."
                        value={formData.en.content}
                        onChange={(e) => updateGuideLocale("en", "content", e.target.value)}
                      />
                    </div>
                  </div>
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
                       <textarea className="w-full bg-blue-50 p-4 rounded-xl text-xs font-bold font-blue-600 outline-none border border-transparent focus:bg-white focus:border-blue-500" placeholder="Expert purchase advice" value={card.advice} onChange={(e) => updateRiskCard(i, {...card, advice: e.target.value})} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "content" && (
              <div className="max-w-6xl mx-auto space-y-12">
                 <h4 className="text-xl font-black text-slate-900 tracking-tight">{lang === "zh" ? "SEO 多语言配置" : "Search Engine Optimization Panel"}</h4>
                 <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                   <div className="bg-white p-8 rounded-[32px] border border-slate-200 space-y-6">
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">中文 SEO</p>
                     <Field label="中文 Meta Title（建议 60 字符内）" value={formData.seo.zh.title} onChange={(v: string) => updateSeoLocale("zh", "title", v)} />
                     <div className="space-y-1 flex justify-end">
                       <span className={`text-[10px] font-black ${formData.seo.zh.title.length > 60 ? "text-red-500" : "text-slate-400"}`}>{formData.seo.zh.title.length} / 60</span>
                     </div>

                     <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">中文 Meta Description（建议 160 字符内）</label>
                       <textarea 
                         className="w-full bg-slate-50 p-6 rounded-2xl font-bold text-xs outline-none border border-transparent focus:border-blue-500 focus:bg-white transition-all shadow-inner"
                         value={formData.seo.zh.description}
                         onChange={(e) => updateSeoLocale("zh", "description", e.target.value)}
                       />
                       <div className="flex justify-end">
                         <span className={`text-[10px] font-black ${formData.seo.zh.description.length > 160 ? "text-red-500" : "text-slate-400"}`}>{formData.seo.zh.description.length} / 160</span>
                       </div>
                     </div>

                     <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">中文 Keywords（逗号分隔）</label>
                       <textarea
                         className="w-full bg-slate-50 p-6 rounded-2xl font-bold text-xs outline-none border border-transparent focus:border-blue-500 focus:bg-white transition-all shadow-inner min-h-[90px]"
                         value={stringifyKeywords(formData.seo.zh.keywords)}
                         onChange={(e) => updateSeoLocale("zh", "keywords", parseKeywordInput(e.target.value))}
                       />
                     </div>
                   </div>

                   <div className="bg-white p-8 rounded-[32px] border border-slate-200 space-y-6">
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">English SEO</p>
                     <Field label="English Meta Title (Target 60 chars)" value={formData.seo.en.title} onChange={(v: string) => updateSeoLocale("en", "title", v)} />
                     <div className="space-y-1 flex justify-end">
                       <span className={`text-[10px] font-black ${formData.seo.en.title.length > 60 ? "text-red-500" : "text-slate-400"}`}>{formData.seo.en.title.length} / 60</span>
                     </div>

                     <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">English Meta Description (Target 160 chars)</label>
                       <textarea 
                         className="w-full bg-slate-50 p-6 rounded-2xl font-bold text-xs outline-none border border-transparent focus:border-blue-500 focus:bg-white transition-all shadow-inner"
                         value={formData.seo.en.description}
                         onChange={(e) => updateSeoLocale("en", "description", e.target.value)}
                       />
                       <div className="flex justify-end">
                         <span className={`text-[10px] font-black ${formData.seo.en.description.length > 160 ? "text-red-500" : "text-slate-400"}`}>{formData.seo.en.description.length} / 160</span>
                       </div>
                     </div>

                     <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">English Keywords (comma separated)</label>
                       <textarea
                         className="w-full bg-slate-50 p-6 rounded-2xl font-bold text-xs outline-none border border-transparent focus:border-blue-500 focus:bg-white transition-all shadow-inner min-h-[90px]"
                         value={stringifyKeywords(formData.seo.en.keywords)}
                         onChange={(e) => updateSeoLocale("en", "keywords", parseKeywordInput(e.target.value))}
                       />
                     </div>
                   </div>
                 </div>

                 {/* SERP Preview */}
                 <div className="space-y-4">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Google SERP Simulator</p>
                   <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
                     <div className="bg-white px-8 py-10 rounded-[32px] shadow-xl border border-slate-100 flex flex-col gap-1.5 overflow-hidden h-full">
                      <div className="text-[12px] text-slate-500 truncate">balancebiketoddler.com › {previewBreadcrumb}</div>
                      <div className="text-[20px] text-blue-600 font-medium hover:underline cursor-pointer truncate">{formData.seo.zh.title || "中文预览标题"}</div>
                      <div className="text-[14px] text-slate-600 line-clamp-2 leading-relaxed">
                        {formData.seo.zh.description || "输入中文 Meta Description 后将在此预览。"}
                      </div>
                     </div>

                     <div className="bg-white px-8 py-10 rounded-[32px] shadow-xl border border-slate-100 flex flex-col gap-1.5 overflow-hidden h-full">
                      <div className="text-[12px] text-slate-500 truncate">balancebiketoddler.com › {previewBreadcrumb}</div>
                      <div className="text-[20px] text-blue-600 font-medium hover:underline cursor-pointer truncate">{formData.seo.en.title || "English preview title"}</div>
                      <div className="text-[14px] text-slate-600 line-clamp-2 leading-relaxed">
                        {formData.seo.en.description || "Compose an English meta description to preview the snippet."}
                      </div>
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
