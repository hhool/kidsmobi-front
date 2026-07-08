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
import { getCMSProducts, saveCMSProduct, deleteCMSProduct, getCMSScenarios, checkIsAdmin } from "../../lib/cmsService";
import { CMSProduct, ComplianceTag, ProductCategory, CMSScenario } from "../../types";
import { FALLBACK_PRODUCT_IMAGE, resolveProductImages } from "../../lib/productImages";
import { validateCMSProduct } from "../../lib/productValidation";
import SmartImage from "../common/SmartImage";
import BackendResourcePicker from "./BackendResourcePicker";
import { getBackendPickerPayload } from "../../lib/backendResourceService";
import { deleteD1CMSProduct, getD1CMSProducts, saveD1CMSProduct } from "../../lib/cmsD1Service";

function normalizeCMSProductForList(item: CMSProduct): CMSProduct {
  const zhName = item?.zh?.name || item.name || item.brand || "";
  const enName = item?.en?.name || item.name || item.brand || "";
  return {
    ...item,
    customers_say: item?.customers_say || "",
    zh: {
      name: zhName,
      description: item?.zh?.description || "",
      customersSay: item?.zh?.customersSay || item?.customers_say || "",
      brandText: item?.zh?.brandText || item.brand || "",
      specsText: item?.zh?.specsText || "",
      pros: item?.zh?.pros || [],
      cons: item?.zh?.cons || [],
      editorVerdict: item?.zh?.editorVerdict || "",
    },
    en: {
      name: enName,
      description: item?.en?.description || "",
      customersSay: item?.en?.customersSay || item?.customers_say || "",
      brandText: item?.en?.brandText || item.brand || "",
      specsText: item?.en?.specsText || "",
      pros: item?.en?.pros || [],
      cons: item?.en?.cons || [],
      editorVerdict: item?.en?.editorVerdict || "",
    },
  };
}

function normalizeProductImagesForSave(product: CMSProduct): CMSProduct {
  const imageSet = resolveProductImages(product);
  const hasRealCover = imageSet.coverUrl && imageSet.coverUrl !== FALLBACK_PRODUCT_IMAGE;
  const nextVideos = (product.videos || [])
    .map((v, idx) => ({
      ...v,
      url: (v.url || "").trim(),
      order: typeof v.order === "number" ? v.order : idx,
    }))
    .filter((v) => v.url.length > 0);

  const normalizedVideoUrl = nextVideos[0]?.url || (product.videoUrl || "").trim();

  return {
    ...product,
    images: {
      cover: hasRealCover ? imageSet.images.cover : undefined,
      gallery: imageSet.images.gallery,
    },
    imageUrl: hasRealCover ? imageSet.coverUrl : "",
    galleryUrls: imageSet.galleryUrls,
    videos: nextVideos,
    videoUrl: normalizedVideoUrl,
    features: (product.features || []).map((f) => f.trim()).filter(Boolean),
    scenarios: (product.scenarios || []).map((s) => s.trim()).filter(Boolean),
    relatedProductIds: (product.relatedProductIds || []).map((id) => id.trim()).filter(Boolean),
  };
}

function buildCMSProductFromBackendPreview(item: {
  id: string;
  categoryId: string;
  title: string;
  brand: string;
  customers_say?: string;
  coverImage?: string;
  galleryImages: string[];
  videoUrls: string[];
}): CMSProduct {
  const categoryMap: Record<string, ProductCategory> = {
    balance_bike: "balance",
    scooters: "scooter",
    electric_vehicles: "electric_car",
    kids_bikes: "bicycle",
    kids_tricycles: "tricycle",
    car_seat: "safety_seat",
  };

  return {
    id: item.id,
    name: item.title,
    brand: item.brand || "Unknown",
    category: categoryMap[item.categoryId] || "stroller",
    wheelSize: "N/A",
    weight: 0,
    material: "N/A",
    brakeType: "N/A",
    tireType: "N/A",
    price: 0,
    ageRange: "0-4y",
    heightRange: [65, 120],
    compliance: ["EN1888"],
    imageUrl: item.coverImage || "",
    galleryUrls: item.galleryImages || [],
    videoUrl: item.videoUrls?.[0] || "",
    customers_say: item.customers_say || "",
    features: ["backend-imported", "cms-init"],
    scenarios: ["city-commute"],
    relatedProductIds: [],
    videos: (item.videoUrls || []).map((url, idx) => ({
      url,
      title: `init-video-${idx + 1}`,
      source: "scraped",
      order: idx,
    })),
    status: "draft",
    zh: {
      name: item.title,
      description: "由后台一键初始化写入 CMS 的产品条目。",
      customersSay: item.customers_say || "",
      brandText: item.brand || "Unknown",
      specsText: "Initialized from backend resources.",
      pros: ["backend source"],
      cons: ["needs editorial enrichment"],
      editorVerdict: "建议补充评测文案后再发布。",
    },
    en: {
      name: item.title,
      description: "Product entry initialized into CMS from backend resources.",
      customersSay: item.customers_say || "",
      brandText: item.brand || "Unknown",
      specsText: "Initialized from backend resources.",
      pros: ["backend source"],
      cons: ["needs editorial enrichment"],
      editorVerdict: "Please enrich editorial content before publishing.",
    },
    updatedAt: null,
  };
}

export default function ProductManager({ lang }: { lang: "zh" | "en" }) {
  const [products, setProducts] = useState<CMSProduct[]>([]);
  const [scenarios, setScenarios] = useState<CMSScenario[]>([]);
  const [backendPreviewMode, setBackendPreviewMode] = useState(false);
  const [search, setSearch] = useState("");
  const [editingProduct, setEditingProduct] = useState<CMSProduct | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    let productsData: CMSProduct[] = [];
    const scenariosData = await getCMSScenarios(true);

    try {
      productsData = await getD1CMSProducts(false);
    } catch {
      productsData = [];
    }

    if (productsData.length === 0) {
      productsData = await getCMSProducts();
    }

    if (productsData.length > 0) {
      setProducts(productsData.map((item) => normalizeCMSProductForList(item)));
      setBackendPreviewMode(false);
    } else {
      try {
        const pickerPayload = await getBackendPickerPayload();
        const fallbackProducts: CMSProduct[] = (pickerPayload.products || []).slice(0, 60).map((item) => ({
          id: item.id,
          name: item.title,
          brand: item.brand || "Unknown",
          category: "stroller",
          wheelSize: "N/A",
          weight: 0,
          material: "N/A",
          brakeType: "N/A",
          tireType: "N/A",
          price: 0,
          ageRange: "0-4y",
          heightRange: [65, 120],
          compliance: ["EN1888"],
          imageUrl: item.coverImage || "",
          galleryUrls: item.galleryImages || [],
          videoUrl: item.videoUrls?.[0] || "",
          customers_say: item.customers_say || "",
          features: ["backend-preview"],
          scenarios: ["city-commute"],
          relatedProductIds: [],
          videos: (item.videoUrls || []).map((url, idx) => ({
            url,
            title: `preview-video-${idx + 1}`,
            source: "scraped",
            order: idx,
          })),
          status: "draft",
          zh: {
            name: item.title,
            description: "CMS 空数据时自动加载的 backend 预览条目。",
            customersSay: item.customers_say || "",
            brandText: item.brand || "Unknown",
            specsText: "Preview mode",
            pros: ["backend preview"],
            cons: ["not persisted until saved"],
            editorVerdict: "请编辑后保存到 CMS。",
          },
          en: {
            name: item.title,
            description: "Backend preview item loaded because CMS is empty.",
            customersSay: item.customers_say || "",
            brandText: item.brand || "Unknown",
            specsText: "Preview mode",
            pros: ["backend preview"],
            cons: ["not persisted until saved"],
            editorVerdict: "Edit and save to persist into CMS.",
          },
          updatedAt: null,
        }));
        setProducts(fallbackProducts);
        setBackendPreviewMode(fallbackProducts.length > 0);
      } catch {
        setProducts([]);
        setBackendPreviewMode(false);
      }
    }
    setScenarios(scenariosData);
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
      images: {
        cover: undefined,
        gallery: [],
      },
      imageUrl: "",
      galleryUrls: [],
      videoUrl: "",
      customers_say: "",
      features: [],
      scenarios: [],
      relatedProductIds: [],
      videos: [],
      status: "draft",
      zh: { name: "", description: "", customersSay: "", brandText: "", specsText: "", pros: [], cons: [], editorVerdict: "" },
      en: { name: "", description: "", customersSay: "", brandText: "", specsText: "", pros: [], cons: [], editorVerdict: "" },
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
    const normalized = normalizeProductImagesForSave(p);
    const validation = validateCMSProduct(normalized);
    if (!validation.valid) {
      alert((lang === "zh" ? "发布前校验失败：\n" : "Publish validation failed:\n") + validation.errors.map((item) => `- ${item}`).join("\n"));
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      try {
        const saved = await saveD1CMSProduct(normalized);
        if (!saved) {
          throw new Error("D1 save failed");
        }
      } catch {
        await saveCMSProduct(normalized);
      }
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
        let success = false;
        try {
          success = await deleteD1CMSProduct(id);
          if (!success) {
            throw new Error("D1 delete failed");
          }
        } catch {
          success = await deleteCMSProduct(id);
        }
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
    (p.zh?.name || "").toLowerCase().includes(search.toLowerCase()) || 
    (p.en?.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.brand || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{lang === "zh" ? "产品中心" : "Product Center"}</h2>
          <p className="text-slate-500 font-medium mt-1">Structured repository for global stroller database.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleNew} className="btn-primary flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-3xl font-black shadow-2xl shadow-slate-900/20 hover:-translate-y-1 transition-all">
            <Plus className="w-5 h-5 text-orange-500" />
            {lang === "zh" ? "新增产品" : "New Product"}
          </button>
        </div>
      </header>

      {/* Filter Bar */}
      {backendPreviewMode && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3 text-xs font-bold text-amber-700">
          {lang === "zh"
            ? "当前 CMS 产品库为空，已自动展示 backend 预览条目。编辑后点击保存可写入 CMS。"
            : "CMS product collection is empty. Backend preview entries are shown automatically. Edit and save to persist into CMS."}
        </div>
      )}

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
                <SmartImage
                  src={resolveProductImages(p).coverUrl || undefined}
                  alt={p.zh.name}
                  className="w-full h-full object-contain"
                  wrapperClassName="w-full h-full"
                  width={160}
                  height={160}
                />
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
            allProducts={products}
            scenarios={scenarios}
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

function ProductEditor({ product, allProducts, scenarios, onSave, onCancel, lang, saving, error }: any) {
  const [formData, setFormData] = useState<CMSProduct>(product);
  const [activeTab, setActiveTab] = useState<"base" | "zh" | "en" | "compare">("compare");
  const [pickerMode, setPickerMode] = useState<"cover" | "gallery" | "videos" | "related" | null>(null);

  const categories: ProductCategory[] = ["balance", "bicycle", "scooter", "stroller", "electric_car", "tricycle", "safety_seat"];
  const complianceOptions: ComplianceTag[] = ["CCC", "EN1888", "ASTM", "GS"];

  const toggleCompliance = (tag: ComplianceTag) => {
    const complianceList = formData.compliance || [];
    const next = complianceList.includes(tag)
      ? complianceList.filter(t => t !== tag)
      : [...complianceList, tag];
    setFormData({ ...formData, compliance: next });
  };

  const applyResourceSelection = (selection: { imageUrls: string[]; videoUrls: string[]; relatedProductIds: string[] }) => {
    if (pickerMode === "cover") {
      const cover = selection.imageUrls[0] || "";
      setFormData((prev) => normalizeProductImagesForSave({ ...prev, imageUrl: cover }));
      return;
    }

    if (pickerMode === "gallery") {
      setFormData((prev) => {
        const current = prev.galleryUrls || [];
        const next = Array.from(new Set([...current, ...selection.imageUrls].filter(Boolean)));
        return normalizeProductImagesForSave({ ...prev, galleryUrls: next });
      });
      return;
    }

    if (pickerMode === "videos") {
      setFormData((prev) => {
        const currentVideos = prev.videos || [];
        const existing = new Set(currentVideos.map((item) => (item.url || "").trim()).filter(Boolean));
        const appended = selection.videoUrls
          .filter((url) => !existing.has(url))
          .map((url) => ({ url, title: "", source: "worker" as const }));
        const videos = [...currentVideos, ...appended].map((item, idx) => ({ ...item, order: idx }));
        return {
          ...prev,
          videos,
          videoUrl: videos[0]?.url || prev.videoUrl || "",
        };
      });
      return;
    }

    if (pickerMode === "related") {
      setFormData((prev) => {
        const current = prev.relatedProductIds || [];
        const next = Array.from(new Set([...current, ...selection.relatedProductIds].filter(Boolean)));
        return {
          ...prev,
          relatedProductIds: next,
        };
      });
    }
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

              <Section title="Product Features / Scenarios / Relations">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <TagEditor
                    title="Features"
                    items={formData.features || []}
                    addLabel="Add Feature"
                    onChange={(next) => setFormData({ ...formData, features: next })}
                  />
                  <TagEditor
                    title="Scenarios"
                    items={formData.scenarios || []}
                    addLabel="Add Scenario"
                    onChange={(next) => setFormData({ ...formData, scenarios: next })}
                    options={(scenarios || []).map((item: CMSScenario) => ({
                      value: item.code,
                      label: `${item.zh.name || item.code} / ${item.en.name || item.code}`,
                    }))}
                  />
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Similar Products (Manual)</label>
                    <button
                      onClick={() => setPickerMode("related")}
                      className="w-full py-2.5 border border-sky-200 bg-sky-50 text-sky-700 rounded-xl text-[11px] font-black hover:bg-sky-100 transition-all"
                    >
                      {lang === "zh" ? "从 backend 资源选择" : "Pick From Backend Resources"}
                    </button>
                    <div className="max-h-64 overflow-y-auto border border-slate-100 rounded-2xl p-3 bg-slate-50/50 space-y-2">
                      {allProducts
                        .filter((p: CMSProduct) => p.id !== formData.id)
                        .map((p: CMSProduct) => {
                          const checked = (formData.relatedProductIds || []).includes(p.id);
                          return (
                            <label key={p.id} className="flex items-start gap-2 p-2 rounded-xl hover:bg-white cursor-pointer">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  const current = formData.relatedProductIds || [];
                                  const next = e.target.checked
                                    ? [...current, p.id]
                                    : current.filter((id) => id !== p.id);
                                  setFormData({ ...formData, relatedProductIds: next });
                                }}
                                className="mt-1"
                              />
                              <span className="text-xs font-bold text-slate-700 leading-tight">{p.zh.name || p.en.name || p.id}</span>
                            </label>
                          );
                        })}
                    </div>
                  </div>
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
                    <Field
                      label="Primary Hero Image URL"
                      value={formData.imageUrl}
                      onChange={(v) => {
                        const next = { ...formData, imageUrl: v };
                        setFormData(normalizeProductImagesForSave(next));
                      }}
                    />
                    <button
                      onClick={() => setPickerMode("cover")}
                      className="w-full py-2.5 border border-orange-200 bg-orange-50 text-orange-700 rounded-xl text-[11px] font-black hover:bg-orange-100 transition-all"
                    >
                      {lang === "zh" ? "从 backend 资源选择封面" : "Pick Cover From Backend Resources"}
                    </button>
                    <Field label="Video showcase URL (YouTube/Direct)" value={formData.videoUrl || ""} onChange={(v) => setFormData({...formData, videoUrl: v})} />
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Video List (Structured)</label>
                      <button
                        onClick={() => setPickerMode("videos")}
                        className="w-full py-2.5 border border-sky-200 bg-sky-50 text-sky-700 rounded-xl text-[11px] font-black hover:bg-sky-100 transition-all"
                      >
                        {lang === "zh" ? "从 backend 资源选择视频" : "Pick Videos From Backend Resources"}
                      </button>
                      {(formData.videos || []).map((video, idx) => (
                        <div key={idx} className="grid grid-cols-1 sm:grid-cols-[1fr_180px_auto] gap-2">
                          <input
                            className="bg-slate-50 py-3 px-4 rounded-xl font-bold text-xs outline-none border border-transparent focus:border-orange-500 focus:bg-white transition-all"
                            placeholder="Video URL"
                            value={video.url || ""}
                            onChange={(e) => {
                              const next = [...(formData.videos || [])];
                              next[idx] = { ...next[idx], url: e.target.value };
                              setFormData({ ...formData, videos: next, videoUrl: idx === 0 ? e.target.value : formData.videoUrl });
                            }}
                          />
                          <input
                            className="bg-slate-50 py-3 px-4 rounded-xl font-bold text-xs outline-none border border-transparent focus:border-orange-500 focus:bg-white transition-all"
                            placeholder="Title"
                            value={video.title || ""}
                            onChange={(e) => {
                              const next = [...(formData.videos || [])];
                              next[idx] = { ...next[idx], title: e.target.value };
                              setFormData({ ...formData, videos: next });
                            }}
                          />
                          <button
                            onClick={() => {
                              const next = (formData.videos || []).filter((_, i) => i !== idx);
                              setFormData({ ...formData, videos: next, videoUrl: next[0]?.url || "" });
                            }}
                            className="p-3 bg-red-50 text-red-400 rounded-xl hover:bg-red-100 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => setFormData({
                          ...formData,
                          videos: [...(formData.videos || []), { url: "", title: "", source: "cms" }],
                        })}
                        className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs font-black hover:border-orange-500 hover:text-orange-500 transition-all flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Video Item
                      </button>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Asset Preview</p>
                      <div className="w-full h-36 bg-white rounded-xl border border-slate-100 p-3 flex items-center justify-center">
                        <SmartImage
                          src={resolveProductImages(formData).coverUrl || undefined}
                          alt={formData.zh.name || formData.en.name || "product"}
                          className="w-full h-full object-contain"
                          wrapperClassName="w-full h-full"
                          width={640}
                          height={360}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Image Gallery (Sub-views)</label>
                    <button
                      onClick={() => setPickerMode("gallery")}
                      className="w-full py-2.5 border border-orange-200 bg-orange-50 text-orange-700 rounded-xl text-[11px] font-black hover:bg-orange-100 transition-all"
                    >
                      {lang === "zh" ? "从 backend 资源选择图库" : "Pick Gallery From Backend Resources"}
                    </button>
                    <div className="space-y-2">
                      {(formData.galleryUrls || []).map((url, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input 
                            className="flex-1 bg-slate-50 py-3 px-4 rounded-xl font-bold text-xs outline-none border border-transparent focus:border-orange-500 focus:bg-white transition-all"
                            value={url}
                            onChange={(e) => {
                              const next = [...(formData.galleryUrls || [])];
                              next[idx] = e.target.value;
                              setFormData(normalizeProductImagesForSave({ ...formData, galleryUrls: next }));
                            }}
                          />
                          <button 
                            onClick={() => {
                              const next = (formData.galleryUrls || []).filter((_, i) => i !== idx);
                              setFormData(normalizeProductImagesForSave({ ...formData, galleryUrls: next }));
                            }}
                            className="p-3 bg-red-50 text-red-400 rounded-xl hover:bg-red-100 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => setFormData(normalizeProductImagesForSave({ ...formData, galleryUrls: [...(formData.galleryUrls || []), ""] }))}
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

      <BackendResourcePicker
        open={pickerMode !== null}
        mode={(pickerMode || "cover") as "cover" | "gallery" | "videos" | "related"}
        lang={lang}
        defaultCategoryId={formData.category}
        onClose={() => setPickerMode(null)}
        onApply={applyResourceSelection}
      />
    </div>
  );
}

function TagEditor({
  title,
  items,
  onChange,
  addLabel,
  options,
}: {
  title: string;
  items: string[];
  onChange: (items: string[]) => void;
  addLabel: string;
  options?: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</label>
      {options && options.length > 0 && (
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Preset Options</label>
          <select
            className="w-full bg-slate-50 py-3 px-4 rounded-xl font-bold text-xs outline-none border border-transparent focus:border-orange-500 focus:bg-white transition-all"
            value=""
            onChange={(e) => {
              const value = e.target.value;
              if (!value) return;
              if (!items.includes(value)) {
                onChange([...items, value]);
              }
              e.currentTarget.value = "";
            }}
          >
            <option value="">Select preset...</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      )}
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex gap-2">
            <input
              className="flex-1 bg-slate-50 py-3 px-4 rounded-xl font-bold text-xs outline-none border border-transparent focus:border-orange-500 focus:bg-white transition-all"
              value={item}
              onChange={(e) => {
                const next = [...items];
                next[idx] = e.target.value;
                onChange(next);
              }}
            />
            <button
              onClick={() => onChange(items.filter((_, i) => i !== idx))}
              className="p-3 bg-red-50 text-red-400 rounded-xl hover:bg-red-100 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button
          onClick={() => onChange([...items, ""]) }
          className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs font-black hover:border-orange-500 hover:text-orange-500 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {addLabel}
        </button>
      </div>
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
