import React, { useState, useEffect } from "react";
import {
  Plus,
  Save,
  Globe,
  Search,
  MessageSquare,
  ShieldAlert,
  ArrowUpRight,
  Trash2,
  FileText,
  Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { News } from "../../types";
import { CMSProduct } from "../../types";
import { deleteD1CMSNews, getD1CMSNews, getD1CMSProducts, saveD1CMSNews } from "../../lib/cmsD1Service";
import BackendResourcePicker from "./BackendResourcePicker";
import MediaPickerModal from "./MediaPickerModal";
import RichTextEditor from "../common/RichTextEditor";

const NEWS_CATEGORY_OPTIONS = [
  { value: "new_product", zh: "New Launches / 新品发布", en: "New Launches", path: "/news/new_product" },
  { value: "science", zh: "Science & Tips / 知识科普", en: "Science & Tips", path: "/news/science" },
  { value: "brand_news", zh: "Brand News / 品牌动态", en: "Brand News", path: "/news/brand_news" },
  { value: "industry", zh: "Industry Trends / 行业趋势", en: "Industry Trends", path: "/news/industry" },
] as const;

type ManagedNewsCategory = (typeof NEWS_CATEGORY_OPTIONS)[number]["value"];

const NEWS_CATEGORY_MAP: Record<string, ManagedNewsCategory> = {
  new_product: "new_product",
  science: "science",
  brand_news: "brand_news",
  brand_trend: "brand_news",
  brand_dynamics: "brand_news",
  regulation: "science",
  industry: "industry",
};

function normalizeNewsCategory(value: unknown): ManagedNewsCategory {
  return NEWS_CATEGORY_MAP[String(value || "").trim().toLowerCase()] || "industry";
}

function normalizeSeoKeywords(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value.split(/[,，]/).map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function parseKeywordInput(value: string): string[] {
  return value.split(/[,，\n]/).map((item) => item.trim()).filter(Boolean);
}

function slugifyNewsTitle(value: unknown, fallback = ""): string {
  const slug = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || fallback;
}

function normalizeNewsRecord(item: News): News {
  const seo = item.seo || {
    zh: { title: "", description: "", keywords: [] },
    en: { title: "", description: "", keywords: [] },
  };

  return {
    ...item,
    category: normalizeNewsCategory(item.category),
    seo: {
      zh: {
        ...seo.zh,
        keywords: normalizeSeoKeywords(seo.zh?.keywords),
      },
      en: {
        ...seo.en,
        keywords: normalizeSeoKeywords(seo.en?.keywords),
      },
    },
  };
}

export default function NewsManager({ lang }: { lang: "zh" | "en" }) {
  const [news, setNews] = useState<News[]>([]);
  const [products, setProducts] = useState<CMSProduct[]>([]);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [newsFilter, setNewsFilter] = useState<"all" | ManagedNewsCategory>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | News["status"]>("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [newsData, productsData] = await Promise.all([
      getD1CMSNews(false),
      getD1CMSProducts(false),
    ]);

    setNews(newsData.map(normalizeNewsRecord));
    setProducts(productsData);
  };

  const handleDelete = async (id: string) => {
    const isZh = lang === "zh";
    const confirmMsg = isZh 
      ? "您确定要彻底删除该资讯吗？此操作不可逆。" 
      : "Are you sure you want to permanently delete this news piece? This action cannot be undone.";

    if (window.confirm(confirmMsg)) {
      try {
        const success = await deleteD1CMSNews(id);
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
    setEditingNews(normalizeNewsRecord({
      id: `news_${Date.now()}`,
      slug: "",
      category: "industry",
      status: "draft",
      imageUrl: "",
      publishDate: new Date().toISOString().slice(0, 10),
      seo: {
        zh: { title: "", description: "", keywords: [] },
        en: { title: "", description: "", keywords: [] }
      },
      zh: { title: "", content: "" },
      en: { title: "", content: "" },
      relatedProductIds: [],
      scenarioIds: [],
      updatedAt: null
    }));
  };

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async (n: News) => {
    setSaving(true);
    setSaveError(null);
    try {
      const hasTitle = Boolean(String(n.en?.title || "").trim() || String(n.zh?.title || "").trim());
      const hasContent = Boolean(String(n.en?.content || "").trim() || String(n.zh?.content || "").trim());
      if (n.status === "published" && (!hasTitle || !hasContent)) {
        throw new Error(
          lang === "zh"
            ? "发布失败：标题和正文不能为空，请先补全中/英任一语言的内容再发布。"
            : "Publish blocked: title and content are required before a story can be published.",
        );
      }

      const payload: News = {
        ...n,
        slug: String(n.slug || "").trim() || slugifyNewsTitle(n.en?.title || n.zh?.title, n.id),
      };

      // Slug uniqueness: a duplicate slug would make two stories resolve to the
      // same /news/{category}/{slug} URL and shadow each other in the router.
      const normalizedSlug = String(payload.slug || "").toLowerCase();
      const duplicate = news.find((item) =>
        item.id !== payload.id &&
        String(item.slug || slugifyNewsTitle(item.en?.title || item.zh?.title, item.id)).toLowerCase() === normalizedSlug,
      );
      if (duplicate) {
        throw new Error(
          lang === "zh"
            ? `保存失败：URL 别名「${payload.slug}」已被《${duplicate.zh?.title || duplicate.en?.title || duplicate.id}》占用，请换一个 slug。`
            : `Save blocked: slug "${payload.slug}" is already used by "${duplicate.en?.title || duplicate.zh?.title || duplicate.id}". Pick another slug.`,
        );
      }

      const saved = await saveD1CMSNews(normalizeNewsRecord(payload));
      if (!saved) {
        throw new Error("Cloud save failed");
      }
      setEditingNews(null);
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

  const visibleNews = news
    .map(normalizeNewsRecord)
    .filter((item) => (newsFilter === "all" ? true : item.category === newsFilter))
    .filter((item) => (statusFilter === "all" ? true : (item.status || "draft") === statusFilter))
    .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{lang === "zh" ? "全球资讯" : "Global News"}</h2>
          <p className="text-slate-500 font-medium mt-1">Industry trends, launches, regulations, brand news, and science tips.</p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">{lang === "zh" ? "栏目筛选" : "Category Filter"}</label>
              <select
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700"
                value={newsFilter}
                onChange={(e) => setNewsFilter(e.target.value as "all" | ManagedNewsCategory)}
              >
                <option value="all">{lang === "zh" ? "全部文章 (/news)" : "All Articles (/news)"}</option>
                {NEWS_CATEGORY_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>{lang === "zh" ? item.zh : `${item.en} (${item.path})`}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">{lang === "zh" ? "状态筛选" : "Status Filter"}</label>
              <select
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "all" | News["status"])}
              >
                <option value="all">{lang === "zh" ? "全部状态" : "All Statuses"}</option>
                <option value="draft">{lang === "zh" ? "草稿" : "Draft"}</option>
                <option value="published">{lang === "zh" ? "已发布" : "Published"}</option>
                <option value="archived">{lang === "zh" ? "已归档" : "Archived"}</option>
              </select>
            </div>
          </div>
        </div>
        <button onClick={handleNew} className="btn-primary flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-3xl font-black shadow-2xl shadow-slate-900/10 hover:-translate-y-1 transition-all">
          <Plus className="w-5 h-5 text-blue-400" />
          {lang === "zh" ? "发布资讯" : "Post News"}
        </button>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {visibleNews.map((n) => (
          <div key={n.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-slate-800 transition-all">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
                <Globe className="w-8 h-8 text-slate-900" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">{normalizeNewsCategory(n.category)}</span>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${n.status === "published" ? "bg-emerald-500 text-white" : n.status === "archived" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>
                    {n.status === "archived" ? (lang === "zh" ? "已归档" : "archived") : n.status}
                  </span>
                </div>
                <h4 className="font-black text-slate-900">
                  {(lang === "zh" ? n.zh?.title : n.en?.title) || (lang === "zh" ? n.en?.title : n.zh?.title) || "(Untitled News)"}
                </h4>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-tight mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-md">
                  {(lang === "zh" ? n.en?.title : n.zh?.title) || ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => setEditingNews(normalizeNewsRecord(n))}
                className="p-4 hover:bg-slate-100 rounded-2xl text-slate-600 transition-all text-xs font-black uppercase tracking-widest flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4 text-blue-500" />
                Compose
              </button>
              <button 
                onClick={() => handleDelete(n.id)}
                className="p-4 hover:bg-red-50 rounded-2xl text-red-400 transition-all font-bold"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {editingNews && (
          <NewsEditor 
            news={editingNews} 
            products={products}
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

function NewsEditor({ news, products, onSave, onCancel, lang, saving, error }: any) {
  const [formData, setFormData] = useState<News>(normalizeNewsRecord(news));
  const [pickerMode, setPickerMode] = useState<"cover" | "related" | null>(null);
  const [coverLibraryOpen, setCoverLibraryOpen] = useState(false);
  const previewCategory = normalizeNewsCategory(formData.category);
  const previewId = String(formData.id || "").trim();
  const previewPath = previewId
    ? `/news/${previewCategory}/${encodeURIComponent(previewId)}`
    : `/news/${previewCategory}`;
  const previewBreadcrumb = previewPath
    .replace(/^\//, "")
    .split("/")
    .join(" › ");

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
                  <span>{lang === "zh" ? "发布中" : "Publishing"}</span>
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

          <section className="space-y-4 bg-slate-50 border border-slate-100 rounded-2xl p-6">
            <h4 className="text-sm font-black uppercase tracking-widest text-slate-700">Cross-module Linkage</h4>
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
                  className="w-full bg-white border border-slate-200 py-3 px-4 rounded-xl text-xs font-bold"
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
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">News Cover Image URL</label>
              <button
                onClick={() => setPickerMode("cover")}
                className="w-full py-2.5 border border-orange-200 bg-orange-50 text-orange-700 rounded-xl text-[11px] font-black hover:bg-orange-100 transition-all"
              >
                {lang === "zh" ? "从 backend 资源选择封面图" : "Pick Cover Image From Backend"}
              </button>
              <button
                onClick={() => setCoverLibraryOpen(true)}
                className="w-full py-2.5 border border-violet-200 bg-violet-50 text-violet-700 rounded-xl text-[11px] font-black hover:bg-violet-100 transition-all"
              >
                {lang === "zh" ? "从媒体库选择封面图 / 上传" : "Pick Cover From Media Library"}
              </button>
              <input
                className="w-full bg-white border border-slate-200 py-3 px-4 rounded-xl text-xs font-bold"
                value={formData.imageUrl || ""}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder={lang === "zh" ? "输入封面图 URL" : "Enter cover image URL"}
              />
            </div>
          </section>

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
                onChange={(e) => setFormData({...formData, category: normalizeNewsCategory(e.target.value)})}
              >
                <option value="industry">Industry Trends</option>
                <option value="new_product">New Launches</option>
                <option value="brand_news">Brand News</option>
                <option value="science">Science & Tips</option>
              </select>
              <p className="text-[10px] font-bold text-slate-400 mt-1">{`Path: /news/${normalizeNewsCategory(formData.category)}/${formData.slug || slugifyNewsTitle(formData.en?.title || formData.zh?.title, formData.id)}`}</p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ShieldAlert className="w-3 h-3" />
                {lang === "zh" ? "发布状态" : "Persistence State"}
              </label>
              <select
                className="w-full bg-slate-50 py-4 px-6 rounded-2xl font-black text-xs outline-none border-2 border-transparent focus:border-slate-900 focus:bg-white transition-all shadow-sm"
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value as any})}
              >
                <option value="draft">{lang === "zh" ? "草稿（前台不展示）" : "Internal Draft"}</option>
                <option value="published">{lang === "zh" ? "已发布（前台展示）" : "Live on Website"}</option>
                <option value="archived">{lang === "zh" ? "已归档（前台不展示）" : "Archived"}</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Calendar className="w-3 h-3" />
                {lang === "zh" ? "发布日期" : "Publish Date"}
              </label>
              <input
                type="date"
                className="w-full bg-slate-50 py-4 px-6 rounded-2xl font-black text-xs outline-none border-2 border-transparent focus:border-slate-900 focus:bg-white transition-all shadow-sm"
                value={String(formData.publishDate || "").slice(0, 10)}
                onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
              />
              <p className="text-[10px] font-bold text-slate-400 mt-1">
                {lang === "zh" ? "卡片与 sitemap 展示此日期；留空则使用最近更新时间。" : "Shown on cards and in the sitemap; falls back to the last update time."}
              </p>
            </div>
          </section>

          {/* Publishing & URL Section */}
          <section className="space-y-4 p-8 bg-white border border-slate-100 rounded-[40px]">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-700">
              {lang === "zh" ? "发布与 URL" : "Publishing & URL"}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {lang === "zh" ? "URL 别名 Slug" : "URL Slug"}
                </label>
                <input
                  className="w-full bg-slate-50 border border-slate-200 py-3 px-4 rounded-xl text-xs font-bold"
                  placeholder={slugifyNewsTitle(formData.en?.title || formData.zh?.title, formData.id)}
                  value={formData.slug || ""}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                />
                <p className="text-[10px] font-medium text-slate-400">
                  {lang === "zh"
                    ? "留空则保存时按英文标题自动生成；已发布后请勿随意修改，会造成旧链接失效。"
                    : "Leave empty to auto-generate from the English title. Do not change after publishing: old links will break."}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {lang === "zh" ? "前台地址" : "Live URL"}
                </label>
                <p className="w-full bg-slate-900 text-emerald-300 rounded-xl py-3 px-4 text-xs font-mono break-all">
                  /news/{normalizeNewsCategory(formData.category)}/{formData.slug || slugifyNewsTitle(formData.en?.title || formData.zh?.title, formData.id)}
                </p>
              </div>
            </div>
            {formData.status !== "published" && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-xs font-bold text-amber-800">
                  {lang === "zh"
                    ? `当前为「${formData.status === "archived" ? "已归档" : "草稿"}」状态：前台 /news 不会展示这篇。保存前请先在上方把状态改成「已发布」。`
                    : `This story is ${formData.status === "archived" ? "archived" : "a draft"}: it will not appear on /news. Switch Persistence State to Published before saving.`}
                </p>
              </div>
            )}
          </section>

          {/* Content Section — zh/en side by side (mirrors GuideManager) */}
          <section className="space-y-8 p-10 bg-slate-50/50 border border-slate-100 rounded-[40px]">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="space-y-4 bg-white border border-slate-100 rounded-[28px] p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">中文内容</p>
                <Field
                  label="中文标题"
                  value={formData.zh.title}
                  onChange={(v: string) => setFormData((prev: News) => ({ ...prev, zh: { ...prev.zh, title: v } }))}
                />
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">中文正文</label>
                  <RichTextEditor
                    lang="zh"
                    minHeight={360}
                    value={formData.zh.content}
                    onChange={(v: string) => setFormData((prev: News) => ({ ...prev, zh: { ...prev.zh, content: v } }))}
                  />
                </div>
              </div>

              <div className="space-y-4 bg-white border border-slate-100 rounded-[28px] p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">English Content</p>
                <Field
                  label="English Headline"
                  value={formData.en.title}
                  onChange={(v: string) => setFormData((prev: News) => ({ ...prev, en: { ...prev.en, title: v } }))}
                />
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">English Body</label>
                  <RichTextEditor
                    lang="en"
                    minHeight={360}
                    value={formData.en.content}
                    onChange={(v: string) => setFormData((prev: News) => ({ ...prev, en: { ...prev.en, content: v } }))}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* SEO Controller — zh/en side by side (mirrors GuideManager) */}
          <section className="space-y-8">
             <div className="flex items-center gap-3">
               <div className="w-1.5 h-6 bg-slate-900 rounded-full" />
               <h4 className="text-sm font-black uppercase text-slate-900 tracking-wide">{lang === "zh" ? "SEO 多语言配置" : "Search Engine Optimization Panel"}</h4>
             </div>

             <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
               <NewsSeoLocalePanel
                 lang="zh"
                 formData={formData}
                 setFormData={setFormData}
                 previewBreadcrumb={previewBreadcrumb}
                 uiLang={lang}
               />
               <NewsSeoLocalePanel
                 lang="en"
                 formData={formData}
                 setFormData={setFormData}
                 previewBreadcrumb={previewBreadcrumb}
                 uiLang={lang}
               />
             </div>
          </section>
        </div>
      </motion.div>

      <BackendResourcePicker
        open={pickerMode !== null}
        mode={(pickerMode || "cover") as "cover" | "related"}
        lang={lang}
        onClose={() => setPickerMode(null)}
        onApply={applyResourceSelection}
      />

      <MediaPickerModal
        open={coverLibraryOpen}
        lang={lang}
        accept="image"
        multiple={false}
        onClose={() => setCoverLibraryOpen(false)}
        onApply={(urls: string[]) => {
          const url = urls[0];
          if (url) setFormData((prev: News) => ({ ...prev, imageUrl: url }));
        }}
      />
    </div>
  );
}

/** One locale (zh or en) of the news SEO panel: TDK fields + SERP preview. */
function NewsSeoLocalePanel({ lang, formData, setFormData, previewBreadcrumb, uiLang }: {
  lang: "zh" | "en";
  formData: News;
  setFormData: (updater: (prev: News) => News) => void;
  previewBreadcrumb: string;
  uiLang: "zh" | "en";
}) {
  const seo = formData.seo?.[lang] || { title: "", description: "", keywords: [] };
  const updateSeo = (patch: Partial<{ title: string; description: string; keywords: string[] }>) => {
    setFormData((prev) => ({
      ...prev,
      seo: { ...prev.seo, [lang]: { ...prev.seo?.[lang], ...patch } },
    }));
  };

  return (
    <div className="bg-white p-8 rounded-[32px] border border-slate-200 space-y-6">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
        {lang === "zh" ? "中文 SEO" : "English SEO"}
      </p>
      <div className="space-y-2">
        <Field
          label={lang === "zh" ? "中文 Meta Title（建议 60 字符内）" : "English Meta Title (Target 60 chars)"}
          value={seo.title}
          onChange={(v: string) => updateSeo({ title: v })}
        />
        <div className="flex justify-end">
          <span className={`text-[10px] font-black ${seo.title.length > 60 ? "text-red-500" : "text-slate-400"}`}>{seo.title.length} / 60</span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {lang === "zh" ? "中文 Meta Description（建议 160 字符内）" : "English Meta Description (Target 160 chars)"}
        </label>
        <textarea
          className="w-full bg-slate-50 p-6 rounded-2xl font-bold text-xs outline-none border border-transparent focus:border-blue-500 focus:bg-white transition-all shadow-inner"
          value={seo.description}
          onChange={(e) => updateSeo({ description: e.target.value })}
        />
        <div className="flex justify-end">
          <span className={`text-[10px] font-black ${seo.description.length > 160 ? "text-red-500" : "text-slate-400"}`}>{seo.description.length} / 160</span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {lang === "zh" ? "中文 Keywords（逗号分隔）" : "English Keywords (comma separated)"}
        </label>
        <textarea
          className="w-full bg-slate-50 p-6 rounded-2xl font-bold text-xs outline-none border border-transparent focus:border-blue-500 focus:bg-white transition-all shadow-inner min-h-[90px]"
          value={seo.keywords.join(", ")}
          onChange={(e) => updateSeo({ keywords: parseKeywordInput(e.target.value) })}
          placeholder={uiLang === "zh" ? "例如：新闻关键词、行业趋势、产品上新" : "e.g. news keywords, industry trends, product launch"}
        />
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Google SERP Preview</p>
        <div className="bg-white px-6 py-8 rounded-[24px] shadow-lg border border-slate-100 flex flex-col gap-1.5 overflow-hidden">
          <div className="text-[12px] text-emerald-700 truncate">balancebiketoddler.com › {previewBreadcrumb}</div>
          <div className="text-[18px] text-blue-800 font-medium hover:underline cursor-pointer truncate">{seo.title || "Headline Preview"}</div>
          <div className="text-[13px] text-slate-600 line-clamp-2 leading-relaxed">
            {seo.description || "News meta summary will appear here for audit."}
          </div>
        </div>
      </div>
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
