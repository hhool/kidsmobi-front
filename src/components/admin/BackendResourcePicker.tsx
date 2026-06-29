import React, { useEffect, useMemo, useState } from "react";
import { X, Search, Check, Image as ImageIcon, Video, Link as LinkIcon } from "lucide-react";
import { BackendPickerProduct, getBackendPickerPayload } from "../../lib/backendResourceService";

type PickerMode = "cover" | "gallery" | "videos" | "related";

type PickerSelection = {
  imageUrls: string[];
  videoUrls: string[];
  relatedProductIds: string[];
};

export default function BackendResourcePicker({
  open,
  lang,
  mode,
  defaultCategoryId,
  onClose,
  onApply,
}: {
  open: boolean;
  lang: "zh" | "en";
  mode: PickerMode;
  defaultCategoryId?: string;
  onClose: () => void;
  onApply: (selection: PickerSelection) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState(defaultCategoryId || "");
  const [categories, setCategories] = useState<Array<{ categoryId: string; name: string }>>([]);
  const [products, setProducts] = useState<BackendPickerProduct[]>([]);

  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setCategoryId(defaultCategoryId || "");
  }, [defaultCategoryId, open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const payload = await getBackendPickerPayload({ categoryId, q });
        if (cancelled) return;
        setCategories(payload.categories || []);
        setProducts(payload.products || []);
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message || String(err));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [open, categoryId, q]);

  const imageCandidates = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      if (p.coverImage) set.add(p.coverImage);
      (p.galleryImages || []).forEach((url) => set.add(url));
    }
    return Array.from(set);
  }, [products]);

  const videoCandidates = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      (p.videoUrls || []).forEach((url) => set.add(url));
    }
    return Array.from(set);
  }, [products]);

  function apply() {
    onApply({
      imageUrls: selectedImages,
      videoUrls: selectedVideos,
      relatedProductIds: selectedProducts,
    });
    onClose();
  }

  function toggle(list: string[], setter: (value: string[]) => void, value: string, single = false) {
    if (single) {
      setter([value]);
      return;
    }
    if (list.includes(value)) {
      setter(list.filter((item) => item !== value));
      return;
    }
    setter([...list, value]);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[130] flex items-center justify-center p-6">
      <div className="w-full max-w-6xl h-[88vh] bg-white rounded-[32px] border border-slate-100 shadow-2xl flex flex-col overflow-hidden">
        <header className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
              {lang === "zh" ? "Backend 资源选择器" : "Backend Resource Picker"}
            </h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {mode.toUpperCase()} MODE
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="px-6 py-4 border-b border-slate-100 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-3">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-black"
          >
            <option value="">{lang === "zh" ? "全部品类" : "All Categories"}</option>
            {categories.map((item) => (
              <option key={item.categoryId} value={item.categoryId}>{item.name}</option>
            ))}
          </select>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={lang === "zh" ? "搜索标题、品牌或产品ID" : "Search title, brand or product id"}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-xs font-bold"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading && <p className="text-sm font-bold text-slate-500">{lang === "zh" ? "加载中..." : "Loading..."}</p>}
          {error && <p className="text-sm font-bold text-red-500">{error}</p>}

          {!loading && !error && mode === "related" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => {
                const checked = selectedProducts.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => toggle(selectedProducts, setSelectedProducts, p.id)}
                    className={`text-left p-4 rounded-2xl border transition-all ${checked ? "border-emerald-500 bg-emerald-50" : "border-slate-100 bg-white hover:border-slate-300"}`}
                  >
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">{p.categoryId}</p>
                    <h4 className="font-black text-slate-900 text-sm line-clamp-2">{p.title}</h4>
                    <p className="text-[11px] font-bold text-slate-500 mt-1">{p.brand}</p>
                    {checked && <Check className="w-4 h-4 text-emerald-500 mt-2" />}
                  </button>
                );
              })}
            </div>
          )}

          {!loading && !error && (mode === "cover" || mode === "gallery") && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {imageCandidates.map((url) => {
                const checked = selectedImages.includes(url);
                return (
                  <button
                    key={url}
                    onClick={() => toggle(selectedImages, setSelectedImages, url, mode === "cover")}
                    className={`rounded-2xl border overflow-hidden transition-all ${checked ? "border-orange-500 ring-2 ring-orange-200" : "border-slate-100 hover:border-slate-300"}`}
                  >
                    <div className="w-full h-28 bg-slate-50 flex items-center justify-center">
                      <img src={url} alt="resource" className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <div className="px-2 py-2 flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1"><ImageIcon className="w-3 h-3" />IMG</span>
                      {checked && <Check className="w-3 h-3 text-orange-500" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {!loading && !error && mode === "videos" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {videoCandidates.map((url) => {
                const checked = selectedVideos.includes(url);
                return (
                  <button
                    key={url}
                    onClick={() => toggle(selectedVideos, setSelectedVideos, url)}
                    className={`text-left p-4 rounded-2xl border transition-all ${checked ? "border-sky-500 bg-sky-50" : "border-slate-100 bg-white hover:border-slate-300"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase text-slate-400 mb-1 flex items-center gap-1"><Video className="w-3 h-3" />VIDEO</p>
                        <p className="text-xs font-bold text-slate-700 truncate">{url}</p>
                      </div>
                      {checked && <Check className="w-4 h-4 text-sky-500 shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <footer className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-500 flex items-center gap-3">
            <span>{lang === "zh" ? "已选图片" : "Images"}: {selectedImages.length}</span>
            <span>{lang === "zh" ? "已选视频" : "Videos"}: {selectedVideos.length}</span>
            <span>{lang === "zh" ? "已选产品" : "Products"}: {selectedProducts.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-black">{lang === "zh" ? "取消" : "Cancel"}</button>
            <button onClick={apply} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-black flex items-center gap-1">
              <LinkIcon className="w-3 h-3" />
              {lang === "zh" ? "应用选择" : "Apply"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
