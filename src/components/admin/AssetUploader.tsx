import React, { useState, useEffect, useRef, useMemo } from "react";
import { uploadAssetFile, deleteAssetFile } from "../../lib/upload";
import { listAssetMetadata } from "../../lib/firestoreAssetHelper";
import { Copy, Check, UploadCloud, Image as ImageIcon, Video, Loader2, Folder, ChevronRight, Home, Trash2, FileText } from "lucide-react";

export default function AssetUploader({ lang = "zh", onUploaded }: { lang?: "zh" | "en", onUploaded?: (url: string, key: string) => void }) {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  // Folder Navigation State
  const [currentPath, setCurrentPath] = useState<string>("");
  
  // Taxonomy State (For Upload Path Builder)
  const [rootType, setRootType] = useState<"brands" | "products" | "reports">("products");
  const [brandName, setBrandName] = useState("");
  const [productCategory, setProductCategory] = useState("balance-bikes");
  const [productName, setProductName] = useState("");
  const [productAssetType, setProductAssetType] = useState<"gallery" | "details">("gallery");
  const [reportLang, setReportLang] = useState<"zh" | "en">("zh");

  const fileRef = useRef<HTMLInputElement | null>(null);

  const fetchAssets = async () => {
    try {
      const data = await listAssetMetadata();
      setAssets(data);
    } catch (err) {
      console.error("Failed to fetch assets", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedKey(url);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDelete = async (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    if (!window.confirm(lang === "zh" ? "确定要删除此文件吗？它将从对象存储中永久移除。" : "Are you sure you want to delete this file permanently?")) return;
    
    setDeleting(key);
    try {
      await deleteAssetFile(key);
      await fetchAssets();
    } catch (err: any) {
      alert((lang === "zh" ? "删除失败: " : "Delete failed: ") + err.message);
    } finally {
      setDeleting(null);
    }
  };

  // Build the target folder path based on taxonomy
  const buildUploadPath = () => {
    let prefix = "";
    if (rootType === "brands") {
      prefix = `brands/${brandName.trim().replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase()}/`;
    } else if (rootType === "products") {
      const safeProduct = productName.trim().replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase() || "unnamed-product";
      prefix = `products/${productCategory}/${safeProduct}/${productAssetType}/`;
    } else if (rootType === "reports") {
      prefix = `reports/${reportLang}/`;
    }
    // Remove double slashes just in case
    return prefix.replace(/\/\//g, '/');
  };

  const currentComputedPath = buildUploadPath();

  const processFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    let successCount = 0;
    
    const prefix = currentComputedPath;
    
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      // Enforce R2 PRD: lowercase, hyphen instead of underscore
      const safeName = f.name.replace(/[^a-zA-Z0-9.-]/g, "-").toLowerCase();
      const key = `${prefix}${Date.now()}-${safeName}`;
      try {
        const publicUrl = await uploadAssetFile(f, key);
        if (onUploaded) onUploaded(publicUrl, key);
        successCount++;
      } catch (err: any) {
        console.error("Upload failed for", f.name, err);
        alert((lang === "zh" ? "上传失败 " : "Upload failed for ") + f.name + ": " + err.message);
      }
    }
    
    setUploading(false);
    if (successCount > 0) {
      fetchAssets();
      // Auto-navigate to the uploaded folder
      setCurrentPath(prefix);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) processFiles(e.dataTransfer.files);
  };

  const { folders, currentFiles } = useMemo(() => {
    const folderSet = new Set<string>();
    const fileList: any[] = [];

    assets.forEach(asset => {
      if (asset.key.startsWith(currentPath)) {
        const relativePath = asset.key.substring(currentPath.length);
        const slashIndex = relativePath.indexOf('/');
        if (slashIndex !== -1) {
          folderSet.add(relativePath.substring(0, slashIndex + 1));
        } else if (relativePath.length > 0) {
          fileList.push(asset);
        }
      }
    });

    return { folders: Array.from(folderSet).sort(), currentFiles: fileList };
  }, [assets, currentPath]);

  const breadcrumbs = useMemo(() => {
    const parts = currentPath.split('/').filter(Boolean);
    const crumbs = [{ label: lang === "zh" ? '根目录' : 'Root', path: '' }];
    let builtPath = '';
    for (const p of parts) {
      builtPath += p + '/';
      crumbs.push({ label: p, path: builtPath });
    }
    return crumbs;
  }, [currentPath, lang]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      
      {/* Upload Zone (PRD Specific Taxonomy) */}
      <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-orange-500" />
          {lang === "zh" ? "分类上传策略构建器 (Taxonomy Builder)" : "Taxonomy Builder"}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500">{lang === "zh" ? "资产类别" : "Root Type"}</label>
            <select 
              value={rootType} onChange={(e: any) => setRootType(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
            >
              <option value="brands">{lang === "zh" ? "Brands (品牌资产库)" : "Brands"}</option>
              <option value="products">{lang === "zh" ? "Products (核心产品资产)" : "Products"}</option>
              <option value="reports">{lang === "zh" ? "Reports (评测报告)" : "Reports"}</option>
            </select>
          </div>

          {rootType === "brands" && (
            <div className="flex flex-col gap-2 md:col-span-3">
              <label className="text-xs font-bold text-slate-500">{lang === "zh" ? "品牌名称 (全小写英文)" : "Brand Name"}</label>
              <input 
                list="brandList" value={brandName} onChange={(e) => setBrandName(e.target.value.toLowerCase())}
                placeholder="woom, kokua, strider..."
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono text-slate-700 outline-none focus:border-orange-500"
              />
              <datalist id="brandList">
                {["woom", "kokua", "strider", "specialized", "micro", "decathlon", "bugaboo", "peg-perego", "poynton", "doona", "britax"].map(b => <option key={b} value={b} />)}
              </datalist>
            </div>
          )}

          {rootType === "reports" && (
            <div className="flex flex-col gap-2 md:col-span-3">
              <label className="text-xs font-bold text-slate-500">{lang === "zh" ? "报告语言" : "Report Language"}</label>
              <select 
                value={reportLang} onChange={(e: any) => setReportLang(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono text-slate-700 outline-none focus:border-orange-500"
              >
                <option value="zh">zh (中文实测报告)</option>
                <option value="en">en (英文实测报告)</option>
              </select>
            </div>
          )}

          {rootType === "products" && (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-500">{lang === "zh" ? "品类 (Category)" : "Category"}</label>
                <select 
                  value={productCategory} onChange={(e) => setProductCategory(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono text-slate-700 outline-none focus:border-orange-500"
                >
                  <option value="balance-bikes">balance-bikes (平衡车)</option>
                  <option value="bicycles">bicycles (自行车)</option>
                  <option value="scooters">scooters (滑板车)</option>
                  <option value="tricycles">tricycles (三轮车)</option>
                  <option value="electric-vehicles">electric-vehicles (电摩/卡丁车)</option>
                  <option value="strollers">strollers (婴儿推车)</option>
                  <option value="car-seats">car-seats (安全座椅)</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-500">{lang === "zh" ? "产品代号 (如: woom-1)" : "Product ID"}</label>
                <input 
                  value={productName} onChange={(e) => setProductName(e.target.value.toLowerCase())}
                  placeholder="woom-1-classic"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono text-slate-700 outline-none focus:border-orange-500"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-500">{lang === "zh" ? "资产类型" : "Asset Type"}</label>
                <select 
                  value={productAssetType} onChange={(e: any) => setProductAssetType(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono text-slate-700 outline-none focus:border-orange-500"
                >
                  <option value="gallery">gallery (前台轮播展示大图)</option>
                  <option value="details">details (细节拆解图)</option>
                </select>
              </div>
            </>
          )}
        </div>

        <div className="mb-6 p-4 bg-slate-900 text-slate-300 rounded-xl flex items-center font-mono text-sm overflow-x-auto shadow-inner">
          <span className="text-emerald-400 mr-2 shrink-0">TARGET R2 PATH:</span>
          <span>{currentComputedPath}</span>
        </div>

        <div 
          className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
            dragActive ? "border-orange-500 bg-orange-50" : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100"
          }`}
          onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" className="hidden" multiple accept="image/*,video/*,application/pdf" onChange={handleFileChange} />
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              <p className="font-bold text-slate-700 text-sm">
                {lang === "zh" ? `正在安全部署至 Cloudflare R2...` : `Deploying to Cloudflare R2...`}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-400">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="font-black text-slate-900">
                {lang === "zh" ? "拖拽文件到此处，或点击上传 (规范命名，全网加速)" : "Drag files or click to upload (R2 CDN)"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Explorer Tools */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide flex-1">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.path}>
              {idx > 0 && <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />}
              <button
                onClick={() => setCurrentPath(crumb.path)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors whitespace-nowrap shrink-0 ${
                  idx === breadcrumbs.length - 1 ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {idx === 0 && <Home className="w-4 h-4" />}
                {crumb.label}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Grid Area */}
      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 text-slate-300 animate-spin" /></div>
      ) : folders.length === 0 && currentFiles.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-[32px] border border-slate-100 border-dashed">
          <Folder className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">{lang === "zh" ? "该目录下目前没有任何资源。" : "This folder is empty."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          
          {/* Folders */}
          {folders.map(folderName => (
            <div 
              key={folderName} onClick={() => setCurrentPath(currentPath + folderName)}
              className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md hover:border-orange-200 cursor-pointer transition-all flex flex-col items-center justify-center aspect-square gap-3 group"
            >
              <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Folder className="w-6 h-6 fill-current opacity-80" />
              </div>
              <p className="text-xs font-black text-slate-700 truncate w-full text-center px-2">{folderName.replace('/', '')}</p>
            </div>
          ))}

          {/* Files */}
          {currentFiles.map((asset) => {
            const fileName = asset.key.substring(currentPath.length);
            const isVideo = asset.contentType?.startsWith("video/");
            const isPdf = asset.contentType?.includes("pdf");
            
            return (
              <div key={asset.key} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col relative">
                <div className="aspect-square bg-slate-100 relative">
                  {isVideo ? (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900"><Video className="w-8 h-8 text-white/50" /></div>
                  ) : isPdf ? (
                    <div className="w-full h-full flex items-center justify-center bg-red-50"><FileText className="w-10 h-10 text-red-500/50" /></div>
                  ) : (
                    <img src={asset.url} alt={fileName} className="w-full h-full object-cover" loading="lazy" />
                  )}
                  
                  {/* Hover Actions: Copy & Delete */}
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleCopy(asset.url); }}
                      className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-900 hover:bg-orange-500 hover:text-white transition-colors shadow-lg"
                      title={lang === "zh" ? "复制资源链接" : "Copy URL"}
                    >
                      {copiedKey === asset.url ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                    <button 
                      onClick={(e) => handleDelete(e, asset.key)}
                      disabled={deleting === asset.key}
                      className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-colors shadow-lg"
                      title={lang === "zh" ? "永久删除" : "Delete"}
                    >
                      {deleting === asset.key ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="p-3 flex flex-col flex-1 justify-between bg-white">
                  <p className="text-[11px] font-bold text-slate-800 break-all line-clamp-2 leading-tight" title={fileName}>{fileName}</p>
                  <p className="text-[10px] text-slate-400 mt-2 font-mono">{(asset.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
