import React, { useState, useEffect, useMemo } from "react";
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
import { Evaluation, CMSProduct, Product, RadarScores } from "../../types";
import { deleteD1CMSEvaluation, getD1CMSEvaluations, getD1CMSProducts, saveD1CMSEvaluation } from "../../lib/cmsD1Service";
import { getFrontVisibleEvaluations } from "../EvaluationsSection";

const DEFAULT_RADAR_SCORES: RadarScores = {
  safety: 5,
  comfort: 5,
  portability: 5,
  features: 5,
  valueForMoney: 5,
};

function normalizeEvaluationRecord(ev: Partial<Evaluation> | null | undefined): Evaluation {
  return {
    id: String(ev?.id || `ev_${Date.now()}`),
    type: ev?.type || "single",
    productId: String(ev?.productId || ""),
    productIds: Array.isArray(ev?.productIds) ? ev!.productIds!.filter(Boolean) : [],
    status: (ev?.status || "draft") as Evaluation["status"],
    version: String(ev?.version || "V1.0"),
    imageUrl: String(ev?.imageUrl || ""),
    scores: {
      ...DEFAULT_RADAR_SCORES,
      ...(ev?.scores || {}),
    },
    zh: {
      title: String(ev?.zh?.title || ""),
      verdict: String(ev?.zh?.verdict || ""),
      pros: Array.isArray(ev?.zh?.pros) ? ev!.zh!.pros.filter(Boolean) : [],
      cons: Array.isArray(ev?.zh?.cons) ? ev!.zh!.cons.filter(Boolean) : [],
      changelog: String(ev?.zh?.changelog || ""),
    },
    en: {
      title: String(ev?.en?.title || ""),
      verdict: String(ev?.en?.verdict || ""),
      pros: Array.isArray(ev?.en?.pros) ? ev!.en!.pros.filter(Boolean) : [],
      cons: Array.isArray(ev?.en?.cons) ? ev!.en!.cons.filter(Boolean) : [],
      changelog: String(ev?.en?.changelog || ""),
    },
    updatedAt: ev?.updatedAt || null,
  };
}

export default function EvaluationManager({ lang }: { lang: "zh" | "en" }) {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [products, setProducts] = useState<CMSProduct[]>([]);
  const [editingEv, setEditingEv] = useState<Evaluation | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "single" | "multi">("all");

  const PREFILL_STORAGE_KEY = "cms_evaluation_prefill";

  const isFrontendMultiEvaluation = (evaluation: Pick<Evaluation, "type" | "productIds">): boolean => {
    return evaluation.type === "compare" && (evaluation.productIds?.length || 0) > 1;
  };

  const getReviewBucket = (evaluation: Pick<Evaluation, "type" | "productIds">): "single" | "multi" => {
    return isFrontendMultiEvaluation(evaluation) ? "multi" : "single";
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (editingEv) return;
    if (typeof window === "undefined") return;

    const raw = window.localStorage.getItem(PREFILL_STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") {
        window.localStorage.removeItem(PREFILL_STORAGE_KEY);
        return;
      }
      setEditingEv(normalizeEvaluationRecord(parsed));
    } catch {
      // Ignore malformed payload and clear stale cache.
    } finally {
      window.localStorage.removeItem(PREFILL_STORAGE_KEY);
    }
  }, [editingEv]);

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

    setEvaluations(evs.map((item) => normalizeEvaluationRecord(item)));
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

  const resolveLinkedProduct = (ev: Evaluation) => {
    if (ev.productId) {
      return products.find((item) => item.id === ev.productId) || null;
    }
    const linkedIds = ev.productIds || [];
    const firstLinkedId = linkedIds[0];
    return firstLinkedId ? products.find((item) => item.id === firstLinkedId) || null : null;
  };

  const categoryOptions = Array.from(
    new Set(products.map((item) => String(item.category || "").trim()).filter(Boolean))
  ).sort();
  const brandOptions = Array.from(
    new Set(products.map((item) => String(item.brand || "").trim()).filter(Boolean))
  ).sort();

  const resolveLinkedProducts = (ev: Evaluation): CMSProduct[] => {
    const linkedIds = [ev.productId, ...(ev.productIds || [])].filter(Boolean);
    return linkedIds
      .map((id) => products.find((item) => item.id === id))
      .filter(Boolean) as CMSProduct[];
  };

  const resolveSingleGroup = (ev: Evaluation): "stroller" | "bike" | "balance" | "scooter" | "other" => {
    const linkedProduct = resolveLinkedProducts(ev)[0];
    const text = `${linkedProduct?.category || ""} ${linkedProduct?.id || ""} ${ev.en?.title || ""} ${ev.zh?.title || ""}`.toLowerCase();

    const isBalance = text.includes("balance") || text.includes("平衡车");
    if (isBalance) return "balance";

    const isScooter = text.includes("scooter") || text.includes("滑板车");
    if (isScooter) return "scooter";

    const isBike =
      (text.includes("bike") || text.includes("bicycle") || text.includes("kids_bikes") || text.includes("自行车")) &&
      !isBalance;
    if (isBike) return "bike";

    const isStroller = text.includes("stroller") || text.includes("jogger") || text.includes("推车") || text.includes("婴儿车");
    if (isStroller) return "stroller";

    return "other";
  };

  const persistedEvaluationIds = useMemo(() => new Set(evaluations.map((item) => item.id)), [evaluations]);

  const frontVisibleEvaluations = useMemo(
    () => getFrontVisibleEvaluations(evaluations, products as unknown as Product[]),
    [evaluations, products],
  );

  const editableEvaluations = useMemo(() => {
    const singles = frontVisibleEvaluations.filter((ev) => getReviewBucket(ev) === "single");
    const multis = frontVisibleEvaluations.filter((ev) => getReviewBucket(ev) === "multi");

    const stroller = singles.filter((ev) => resolveSingleGroup(ev) === "stroller").slice(0, 6);
    const bike = singles.filter((ev) => resolveSingleGroup(ev) === "bike").slice(0, 8);
    const balance = singles.filter((ev) => resolveSingleGroup(ev) === "balance").slice(0, 2);
    const scooter = singles.filter((ev) => resolveSingleGroup(ev) === "scooter").slice(0, 3);

    const selectedSingles = [...stroller, ...bike, ...balance, ...scooter]
      .filter((ev, index, list) => list.findIndex((next) => next.id === ev.id) === index);

    return [...selectedSingles, ...multis];
  }, [frontVisibleEvaluations]);

  const filteredEvaluations = editableEvaluations.filter((ev) => {
    const linkedProduct = resolveLinkedProduct(ev);
    const searchTarget = [
      ev.id,
      ev.version,
      ev.zh?.title,
      ev.en?.title,
      linkedProduct?.id,
      linkedProduct?.brand,
      linkedProduct?.zh?.name,
      linkedProduct?.en?.name,
      linkedProduct?.category,
    ]
      .map((item) => String(item || "").toLowerCase())
      .join(" ");
    const matchesSearch = searchTarget.includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || String(linkedProduct?.category || "") === categoryFilter;
    const matchesBrand = brandFilter === "all" || String(linkedProduct?.brand || "") === brandFilter;
    const matchesType = typeFilter === "all" || getReviewBucket(ev) === typeFilter;
    return matchesSearch && matchesCategory && matchesBrand && matchesType;
  });

  const editableSingleCount = editableEvaluations.filter((ev) => getReviewBucket(ev) === "single").length;
  const editableMultiCount = editableEvaluations.filter((ev) => getReviewBucket(ev) === "multi").length;

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setBrandFilter("all");
    setTypeFilter("all");
  };

  const getTypeLabel = (evaluation: Pick<Evaluation, "type" | "productIds">) => {
    const bucket = getReviewBucket(evaluation);
    if (bucket === "single") return lang === "zh" ? "单品评测" : "Single Review";
    return lang === "zh" ? "多品评测" : "Multi-Product Review";
  };

  const handleNew = () => {
    setEditingEv(normalizeEvaluationRecord({
      id: `ev_${Date.now()}`,
      type: "single",
      productId: "",
      productIds: [],
      status: "draft",
      version: "V1.0",
      imageUrl: "",
      scores: DEFAULT_RADAR_SCORES,
      zh: { title: "", verdict: "", pros: [], cons: [], changelog: "首次发布实测数据" },
      en: { title: "", verdict: "", pros: [], cons: [], changelog: "Initial review publication" },
      updatedAt: null
    }));
  };

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async (ev: Evaluation) => {
    const isSingleProduct = getReviewBucket(ev) === "single";
    if (isSingleProduct && !ev.productId) return alert("Please link a product first.");
    if (!isSingleProduct && (!ev.productIds || ev.productIds.length < 2)) return alert("Please select at least 2 products for a comparison evaluation.");
    if (!isSingleProduct && ev.productIds && ev.productIds.length > 4) return alert("You can only compare up to 4 products.");
    
    setSaving(true);
    setSaveError(null);
    try {
      const isVirtualGenerated = String(ev.id || "").startsWith("generated_") && !persistedEvaluationIds.has(ev.id);
      const payload = normalizeEvaluationRecord(
        isVirtualGenerated
          ? {
              ...ev,
              id: `ev_${Date.now()}`,
              status: "published",
              version: String(ev.version || "V1.0"),
            }
          : ev,
      );
      try {
        const saved = await saveD1CMSEvaluation(payload);
        if (!saved) {
          throw new Error("D1 save failed");
        }
      } catch {
        await saveCMSEvaluation(payload);
      }
      setEditingEv(null);
      fetchData();
    } catch (e: any) {
      console.error(e);
      let errorMsg = e.message || String(e);
      let niceError = errorMsg;
      if (errorMsg.includes("Missing or insufficient permissions")) {
        niceError = lang === "zh"
          ? "权限不足 (Permission Denied)：当前会话未通过可写权限验证。开发者 Bypass 模式通常为只读，请使用真实管理员登录后重试。"
          : "Permission Denied: Your current session is not validated for write access. Developer bypass mode is usually read-only; please sign in with a real admin account and retry.";
      } else if (errorMsg.includes("Operation timed out")) {
        niceError = lang === "zh"
          ? "网络超时：无法连接 CMS 接口。请检查网络/代理设置，或重新登录后再试。"
          : "Operation Timed Out: Failed to reach the CMS endpoint. Please verify network/proxy settings, then re-authenticate and retry.";
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

      <div className="bg-white border border-slate-100 rounded-[32px] p-5 shadow-sm space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center gap-4">
          <div className="flex-1 grid grid-cols-1 xl:grid-cols-[1.2fr_0.9fr_0.9fr_0.9fr] gap-4">
            <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder={lang === "zh" ? "搜索标题、版本、产品名" : "Search title, version or product"}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-16 pr-8 text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
            >
              <option value="all">{lang === "zh" ? "全部品类" : "All Categories"}</option>
              {categoryOptions.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
            >
              <option value="all">{lang === "zh" ? "全部品牌" : "All Brands"}</option>
              {brandOptions.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
            >
              <option value="all">{lang === "zh" ? "全部评测类型" : "All Review Types"}</option>
              <option value="single">{lang === "zh" ? "单品评测" : "Single Review"}</option>
              <option value="multi">{lang === "zh" ? "多品评测" : "Multi-Product Review"}</option>
            </select>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="px-4 py-3 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 font-black text-xs uppercase tracking-wider">
              {lang === "zh" ? `后台可编辑 ${filteredEvaluations.length} / ${editableEvaluations.length}` : `Editable ${filteredEvaluations.length} / ${editableEvaluations.length}`}
            </div>
            <div className="px-4 py-3 rounded-2xl bg-blue-50 text-blue-700 border border-blue-100 font-black text-xs uppercase tracking-wider">
              {lang === "zh" ? `后台可编辑 单品 ${editableSingleCount}` : `Editable Single ${editableSingleCount}`}
            </div>
            <div className="px-4 py-3 rounded-2xl bg-sky-50 text-sky-700 border border-sky-100 font-black text-xs uppercase tracking-wider">
              {lang === "zh" ? `后台可编辑 多品 ${editableMultiCount}` : `Editable Multi ${editableMultiCount}`}
            </div>
            <button
              type="button"
              onClick={clearFilters}
              className="px-4 py-3 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-wider hover:bg-emerald-500 transition-colors"
            >
              {lang === "zh" ? "清空筛选" : "Reset Filters"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredEvaluations.map((ev) => {
          const linkedIds = [ev.productId, ...(ev.productIds || [])].filter(Boolean);
          const linkedProducts = linkedIds
            .map((id) => products.find((p) => p.id === id))
            .filter(Boolean) as CMSProduct[];
          const isPersisted = persistedEvaluationIds.has(ev.id);
          const product = linkedProducts[0];
          const displayTitle = lang === "zh"
            ? (ev.zh?.title || ev.en?.title || "(No Title)")
            : (ev.en?.title || ev.zh?.title || "(No Title)");
          const linkedProductName = linkedProducts.length > 1
            ? (lang === "zh"
                ? `已关联 ${linkedProducts.length} 个产品`
                : `${linkedProducts.length} linked products`)
            : (lang === "zh"
                ? (product?.zh?.name || product?.en?.name || ev.productId)
                : (product?.en?.name || product?.zh?.name || ev.productId));
          return (
            <div key={ev.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-all">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center">
                  <Star className="w-8 h-8 text-emerald-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-600 px-2.5 py-1 rounded-full">{ev.version}</span>
                    <span className="text-[10px] font-black uppercase bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">{getTypeLabel(ev)}</span>
                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${ev.status === "published" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"}`}>
                      {ev.status}
                    </span>
                    {!isPersisted && (
                      <span className="text-[10px] font-black uppercase bg-violet-100 text-violet-700 px-2.5 py-1 rounded-full">
                        {lang === "zh" ? "前端生成" : "Generated"}
                      </span>
                    )}
                  </div>
                  <h4 className="font-black text-slate-900">{displayTitle}</h4>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-tight mt-0.5">Linked: {linkedProductName}</p>
                </div>
              </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => setEditingEv(normalizeEvaluationRecord(ev))}
                className="p-4 hover:bg-slate-100 rounded-2xl text-slate-600 transition-all text-xs font-black uppercase tracking-widest flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4 text-emerald-500" />
                {lang === "zh" ? "编辑评测" : "Modify Report"}
              </button>
              <button 
                onClick={() => {
                  if (!isPersisted) {
                    alert(lang === "zh" ? "该条目是前端生成评测，请先点击编辑并保存为 CMS 记录后再删除。" : "This row is generated from frontend logic. Save it into CMS first, then delete the persisted record.");
                    return;
                  }
                  handleDelete(ev.id);
                }}
                className={`p-4 rounded-2xl transition-all font-bold ${isPersisted ? "hover:bg-red-50 text-red-400" : "bg-slate-50 text-slate-300 cursor-not-allowed"}`}
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
  const [formData, setFormData] = useState<Evaluation>(() => normalizeEvaluationRecord(ev));
  const [activeTab, setActiveTab] = useState<"zh" | "en">(lang === "zh" ? "zh" : "en");

  useEffect(() => {
    setFormData(normalizeEvaluationRecord(ev));
    setActiveTab(lang === "zh" ? "zh" : "en");
  }, [ev, lang]);

  const updateLocalizedReviewField = (field: "title" | "verdict" | "changelog" | "pros" | "cons", value: string | string[]) => {
    const next = { ...formData };
    const currentLocale = { ...next[activeTab] };
    next[activeTab] = {
      ...currentLocale,
      [field]: value,
    };
    setFormData(next);
  };

  const localizedPros = formData[activeTab]?.pros || [];
  const localizedCons = formData[activeTab]?.cons || [];
  const reviewInsightLabel = lang === "zh" ? "评测摘要" : "Review Summary";
  const isSingleProductType = !(formData.type === "compare" && (formData.productIds?.length || 0) > 1);

  const getDefaultInsightItems = (field: "pros" | "cons", locale: "zh" | "en") => {
    const linkedIds = (isSingleProductType
      ? [formData.productId]
      : [...(formData.productIds || []), formData.productId]
    ).filter(Boolean);

    const seen = new Set<string>();
    const uniqueIds = linkedIds.filter((id) => {
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    const collected = uniqueIds
      .map((id) => products.find((p: CMSProduct) => p.id === id))
      .filter(Boolean)
      .flatMap((p: CMSProduct) => {
        const localized = (p as any)?.[locale]?.[field];
        if (Array.isArray(localized) && localized.length > 0) return localized;
        const fallback = (p as any)?.[field];
        return Array.isArray(fallback) ? fallback : [];
      })
      .map((item: unknown) => String(item || "").trim())
      .filter(Boolean);

    if (collected.length > 0) {
      return Array.from(new Set(collected)).slice(0, 6);
    }

    if (field === "pros") {
      return locale === "zh"
        ? ["默认来源为空：请从已绑定产品的核心优势中补充亮点条目。"]
        : ["Default source is empty: add highlights based on linked products' strongest advantages."];
    }
    return locale === "zh"
      ? ["默认来源为空：请从已绑定产品的已知短板中补充限制条目。"]
      : ["Default source is empty: add limitations based on known weaknesses of linked products."];
  };

  useEffect(() => {
    if (isSingleProductType) return;

    setFormData((prev) => {
      const next = { ...prev };
      let changed = false;

      (["zh", "en"] as const).forEach((locale) => {
        const localeData = { ...(next[locale] || {}) };
        const existingPros = Array.isArray(localeData.pros) ? localeData.pros : [];
        const existingCons = Array.isArray(localeData.cons) ? localeData.cons : [];

        if (existingPros.length === 0) {
          localeData.pros = getDefaultInsightItems("pros", locale);
          changed = true;
        }
        if (existingCons.length === 0) {
          localeData.cons = getDefaultInsightItems("cons", locale);
          changed = true;
        }

        next[locale] = localeData as any;
      });

      return changed ? next : prev;
    });
  }, [formData.productId, formData.productIds, isSingleProductType, products]);

  const saveWithStatus = (status: Evaluation["status"]) => {
    onSave({ ...formData, status });
  };

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
              onClick={() => saveWithStatus("draft")}
              disabled={saving}
              className="px-8 py-3 bg-slate-100 text-slate-900 rounded-2xl font-black flex items-center gap-2 shadow-sm hover:bg-slate-200 transition-all disabled:bg-slate-250 disabled:text-slate-400 cursor-pointer"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
                  <span>{lang === "zh" ? "保存中" : "Saving"}</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>{lang === "zh" ? "保存草稿" : "Save Draft"}</span>
                </>
              )}
            </button>
            <button 
              onClick={() => saveWithStatus("published")}
              disabled={saving}
              className="px-8 py-3 bg-emerald-500 text-white rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-emerald-500/20 hover:scale-105 transition-all disabled:bg-slate-250 disabled:text-slate-400 cursor-pointer"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
                  <span>{lang === "zh" ? "发布中" : "Publishing"}</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>{lang === "zh" ? "发布" : "Publish"}</span>
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
                  value={isSingleProductType ? "single" : "multi"}
                  onChange={(e) => {
                    const selectedBucket = e.target.value as "single" | "multi";
                    const nextType: Evaluation["type"] = selectedBucket === "single" ? "single" : "compare";
                    setFormData({ ...formData, type: nextType, productIds: formData.productIds || [] });
                  }}
                >
                  <option value="single">Single Product (单品评测)</option>
                  <option value="multi">Multi-Product Compare (多品评测)</option>
                </select>
                <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                  {lang === "zh"
                    ? "后台单品/多品口径现已与前台一致：只有 compare 且关联 2 个以上产品时，才归类为“多品评测”。"
                    : "Admin single/multi grouping now matches the frontend: only compare reviews linked to 2+ products are grouped as Multi-product."}
                </p>
              </div>

              {isSingleProductType ? (
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
                    {products.map((p: CMSProduct) => <option key={p.id} value={p.id}>{p.zh?.name || p.en?.name || p.id}</option>)}
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
                          <span className="text-xs font-black text-slate-700">{p.zh?.name || p.en?.name || p.id}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {isSingleProductType && (
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
              <TabBtn active={activeTab === "zh"} onClick={() => setActiveTab("zh")} label={lang === "zh" ? "中文内容" : "ZH Content"} />
              <TabBtn active={activeTab === "en"} onClick={() => setActiveTab("en")} label={lang === "zh" ? "英文内容" : "EN Content"} />
            </div>

            <div className="grid grid-cols-1 gap-10">
              <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
                <RadarPreview scores={formData.scores} />
              </div>

              <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
                <Field label={lang === "zh" ? "评测标题" : "Report Title"} value={formData[activeTab]?.title || ""} onChange={(v: string) => updateLocalizedReviewField("title", v)} />
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{reviewInsightLabel}</label>
                  <textarea 
                    className="w-full bg-slate-50 p-6 rounded-2xl font-bold text-sm outline-none border-2 border-transparent focus:border-emerald-500 focus:bg-white transition-all min-h-[120px]"
                    value={formData[activeTab]?.verdict || ""}
                    onChange={(e) => updateLocalizedReviewField("verdict", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {isSingleProductType ? (
                    <>
                      <LocalizedListEditor
                        label={lang === "zh" ? "优点 / Pros" : "Pros"}
                        items={localizedPros}
                        emptyHint={lang === "zh" ? "每行填写一个优点" : "One pro per line"}
                        onChange={(items) => updateLocalizedReviewField("pros", items)}
                      />
                      <LocalizedListEditor
                        label={lang === "zh" ? "不足 / Cons" : "Cons"}
                        items={localizedCons}
                        emptyHint={lang === "zh" ? "每行填写一个不足" : "One con per line"}
                        onChange={(items) => updateLocalizedReviewField("cons", items)}
                      />
                    </>
                  ) : (
                    <>
                      <ItemizedListEditor
                        title={lang === "zh" ? "## Overall Comparison Insights\n### Highlights" : "## Overall Comparison Insights\n### Highlights"}
                        actionLabel={lang === "zh" ? "新增亮点条目" : "Add highlight item"}
                        emptyHint={lang === "zh" ? "请输入亮点条目" : "Enter highlight item"}
                        sourceNote={lang === "zh" ? "默认来源：已绑定产品（当前语言）的 Pros 字段。" : "Default source: Pros fields from linked products in current language."}
                        applyDefaultLabel={lang === "zh" ? "使用默认来源" : "Use Default Source"}
                        defaultItems={getDefaultInsightItems("pros", activeTab)}
                        items={localizedPros}
                        onChange={(items) => updateLocalizedReviewField("pros", items)}
                      />
                      <ItemizedListEditor
                        title={lang === "zh" ? "## Overall Comparison Insights\n### Limitations" : "## Overall Comparison Insights\n### Limitations"}
                        actionLabel={lang === "zh" ? "新增限制条目" : "Add limitation item"}
                        emptyHint={lang === "zh" ? "请输入限制条目" : "Enter limitation item"}
                        sourceNote={lang === "zh" ? "默认来源：已绑定产品（当前语言）的 Cons 字段。" : "Default source: Cons fields from linked products in current language."}
                        applyDefaultLabel={lang === "zh" ? "使用默认来源" : "Use Default Source"}
                        defaultItems={getDefaultInsightItems("cons", activeTab)}
                        items={localizedCons}
                        onChange={(items) => updateLocalizedReviewField("cons", items)}
                      />
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-red-500 italic">{lang === "zh" ? "版本变更记录（必填）" : "Version Changelog (Mandatory)"}</label>
                  <input 
                    className="w-full bg-slate-50 p-6 rounded-2xl font-bold text-sm outline-none border-2 border-transparent focus:border-red-500 focus:bg-white transition-all"
                    placeholder={lang === "zh" ? "说明本次为何更新这份评测" : "Why are you updating this report?"}
                    value={formData[activeTab]?.changelog || ""}
                    onChange={(e) => updateLocalizedReviewField("changelog", e.target.value)}
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

function LocalizedListEditor({ label, items, emptyHint, onChange }: { label: string; items: string[]; emptyHint: string; onChange: (items: string[]) => void }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
      <textarea
        className="w-full bg-slate-50 p-6 rounded-2xl font-bold text-sm outline-none border-2 border-transparent focus:border-emerald-500 focus:bg-white transition-all min-h-[180px]"
        placeholder={emptyHint}
        value={items.join("\n")}
        onChange={(e) => onChange(e.target.value.split("\n").map((item) => item.trim()).filter(Boolean))}
      />
    </div>
  );
}

function ItemizedListEditor({
  title,
  actionLabel,
  emptyHint,
  sourceNote,
  applyDefaultLabel,
  defaultItems,
  items,
  onChange,
}: {
  title: string;
  actionLabel: string;
  emptyHint: string;
  sourceNote: string;
  applyDefaultLabel: string;
  defaultItems: string[];
  items: string[];
  onChange: (items: string[]) => void;
}) {
  const safeItems = Array.isArray(items) ? items : [];

  const updateItem = (index: number, value: string) => {
    const next = [...safeItems];
    next[index] = value;
    onChange(next.map((item) => item.trim()).filter(Boolean));
  };

  const removeItem = (index: number) => {
    onChange(safeItems.filter((_, idx) => idx !== index));
  };

  const addItem = () => {
    onChange([...safeItems, ""]);
  };

  const applyDefaultItems = () => {
    const normalized = (defaultItems || []).map((item) => String(item || "").trim()).filter(Boolean);
    onChange(normalized);
  };

  return (
    <div className="space-y-3 rounded-2xl border border-slate-100 p-5 bg-slate-50/60">
      <label className="text-[11px] font-black text-slate-600 whitespace-pre-line">{title}</label>
      <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">{sourceNote}</p>

      <div className="space-y-2">
        {safeItems.length === 0 && (
          <div className="text-xs text-slate-400 font-semibold">{emptyHint}</div>
        )}

        {safeItems.map((item, index) => (
          <div key={index} className="flex items-start gap-2">
            <textarea
              className="w-full bg-white p-3 rounded-xl font-semibold text-sm outline-none border border-slate-200 focus:border-emerald-500 transition-all min-h-[72px]"
              placeholder={emptyHint}
              value={item}
              onChange={(e) => updateItem(index, e.target.value)}
            />
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="mt-1 p-2 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors"
              aria-label="Remove item"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={addItem}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-black hover:border-emerald-300 hover:text-emerald-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {actionLabel}
        </button>
        <button
          type="button"
          onClick={applyDefaultItems}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-blue-200 text-blue-700 text-xs font-black hover:border-blue-300 hover:text-blue-800 transition-colors"
        >
          {applyDefaultLabel}
        </button>
      </div>
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
