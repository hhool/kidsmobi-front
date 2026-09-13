import React, { useState, useEffect, useMemo, useRef } from "react";
import { X, Search, UploadCloud, Loader2, Image as ImageIcon, FileText, Check, Copy } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { listAssetMetadata as listAssetCatalog } from "../../lib/firestoreAssetHelper";
import { uploadAssetFile } from "../../lib/upload";

export type MediaPickerAccept = "image" | "video" | "all";

type AssetMeta = {
  key: string;
  url: string;
  size: number;
  contentType: string;
};

/**
 * Unified media library picker.
 * Lists everything stored via the asset pipeline (R2 / local + metadata),
 * supports search, type filtering, direct upload, and returns selected URLs.
 */
export default function MediaPickerModal({
  open,
  lang,
  accept = "all",
  multiple = false,
  title,
  onClose,
  onApply,
}: {
  open: boolean;
  lang?: "zh" | "en";
  accept?: MediaPickerAccept;
  multiple?: boolean;
  title?: string;
  onClose: () => void;
  onApply: (urls: string[]) => void;
}) {
  const isZh = lang !== "en";
  const [assets, setAssets] = useState<AssetMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "image" | "video" | "pdf">("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const data = await listAssetCatalog();
      setAssets(data as AssetMeta[]);
    } catch (err) {
      console.error("Failed to load media library", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setSelected([]);
      setSearch("");
      setTypeFilter(accept === "all" ? "all" : accept);
      fetchAssets();
    }
  }, [open, accept]);

  const kindOf = (asset: AssetMeta): "image" | "video" | "pdf" | "other" => {
    const type = String(asset.contentType || "");
    if (type.startsWith("image/")) return "image";
    if (type.startsWith("video/")) return "video";
    if (type.includes("pdf")) return "pdf";
    return "other";
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return assets.filter((asset) => {
      const kind = kindOf(asset);
      if (typeFilter !== "all" && kind !== typeFilter) return false;
      if (accept === "image" && kind !== "image") return false;
      if (accept === "video" && kind !== "video") return false;
      if (query && !asset.key.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [assets, search, typeFilter, accept]);

  const toggleSelected = (url: string) => {
    if (!multiple) {
      onApply([url]);
      onClose();
      return;
    }
    setSelected((prev) => (prev.includes(url) ? prev.filter((item) => item !== url) : [...prev, url]));
  };

  const processFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "-").toLowerCase();
        const prefix = "cms/media/";
        await uploadAssetFile(file, `${prefix}${Date.now()}-${safeName}`);
      }
      await fetchAssets();
    } catch (err: any) {
      alert((isZh ? "上传失败: " : "Upload failed: ") + (err?.message || err));
    } finally {
      setUploading(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[150] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          className="w-full max-w-5xl h-[80vh] bg-white rounded-[40px] shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <header className="px-8 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                {title || (isZh ? "媒体资源库" : "Media Library")}
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                {isZh ? "统一管理图片 / 视频 / 文档资源 · 点击选择" : "Unified image / video / doc assets · click to select"}
              </p>
            </div>
            <button onClick={onClose} className="p-2.5 hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </header>

          {/* Toolbar */}
          <div className="px-8 py-4 border-b border-slate-100 flex flex-wrap items-center gap-3 shrink-0">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isZh ? "按文件名搜索…" : "Search by filename…"}
                className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-2.5 rounded-2xl text-xs font-bold outline-none focus:border-slate-900 transition"
              />
            </div>
            {accept === "all" && (
              <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                {([
                  { value: "all", label: isZh ? "全部" : "All" },
                  { value: "image", label: isZh ? "图片" : "Images" },
                  { value: "video", label: isZh ? "视频" : "Videos" },
                  { value: "pdf", label: "PDF" },
                ] as const).map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setTypeFilter(item.value)}
                    className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition ${typeFilter === item.value ? "bg-white shadow-sm text-slate-900" : "text-slate-400"}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-wider hover:bg-slate-800 transition disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
              {isZh ? "上传新资源" : "Upload"}
            </button>
            {multiple && (
              <button
                onClick={() => {
                  if (selected.length > 0) {
                    onApply(selected);
                    onClose();
                  }
                }}
                disabled={selected.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-wider hover:bg-emerald-600 transition disabled:opacity-40"
              >
                <Check className="w-4 h-4" />
                {isZh ? `应用所选 (${selected.length})` : `Apply (${selected.length})`}
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              multiple
              accept="image/*,video/*,application/pdf"
              onChange={(e) => {
                if (e.target.files) processFiles(e.target.files);
                if (fileRef.current) fileRef.current.value = "";
              }}
            />
          </div>

          {/* Grid */}
          <div
            className="flex-1 overflow-y-auto p-8"
            onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              if (e.dataTransfer.files?.length) processFiles(e.dataTransfer.files);
            }}
          >
            {loading ? (
              <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 text-slate-300 animate-spin" /></div>
            ) : filtered.length === 0 ? (
              <div className={`h-full flex flex-col items-center justify-center text-center rounded-[32px] border-2 border-dashed transition ${dragActive ? "border-orange-400 bg-orange-50" : "border-slate-100"}`}>
                <ImageIcon className="w-12 h-12 text-slate-200 mb-4" />
                <p className="text-slate-500 font-bold text-sm">{isZh ? "暂无匹配资源，拖拽文件到此处即可上传" : "No matching assets. Drop files here to upload."}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
                {filtered.map((asset) => {
                  const kind = kindOf(asset);
                  const isSelected = selected.includes(asset.url);
                  const name = asset.key.split("/").pop() || asset.key;
                  return (
                    <button
                      key={asset.key}
                      onClick={() => toggleSelected(asset.url)}
                      className={`group relative bg-white rounded-3xl border overflow-hidden text-left transition-all ${isSelected ? "border-emerald-400 ring-2 ring-emerald-100" : "border-slate-100 hover:border-slate-300"}`}
                    >
                      <div className="aspect-square bg-slate-100 relative">
                        {kind === "image" ? (
                          <img src={asset.url} alt={name} loading="lazy" className="w-full h-full object-cover" />
                        ) : kind === "video" ? (
                          <video src={asset.url} muted playsInline preload="metadata" className="w-full h-full object-cover bg-slate-900" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-red-50">
                            <FileText className="w-8 h-8 text-red-400" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span
                            className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-slate-900"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(asset.url);
                              setCopiedUrl(asset.url);
                              setTimeout(() => setCopiedUrl(null), 1500);
                            }}
                          >
                            {copiedUrl === asset.url ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="p-2.5">
                        <p className="text-[10px] font-bold text-slate-700 truncate" title={asset.key}>{name}</p>
                        <p className="text-[9px] text-slate-400 font-mono mt-0.5">{(asset.size / 1024).toFixed(0)} KB</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
