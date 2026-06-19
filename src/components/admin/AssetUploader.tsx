import React, { useState, useEffect, useRef, useMemo } from "react";
import { uploadAssetFile } from "../../lib/upload";
import { listAssetMetadata } from "../../lib/firestoreAssetHelper";
import { Copy, Check, UploadCloud, Image as ImageIcon, Video, Loader2, Folder, ChevronRight, Home } from "lucide-react";

export default function AssetUploader({ lang = "zh" }: { lang?: "zh" | "en" }) {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");
  const [dragActive, setDragActive] = useState(false);
  
  // Folder Navigation State
  const [currentPath, setCurrentPath] = useState<string>("");
  const [customUploadPath, setCustomUploadPath] = useState<string>("");
  
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

  // When current path changes, update the custom upload path to match
  useEffect(() => {
    setCustomUploadPath(currentPath);
  }, [currentPath]);

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedKey(url);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const processFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    let successCount = 0;
    
    // Ensure the custom path ends with a slash if it's not empty
    let prefix = customUploadPath.trim();
    if (prefix && !prefix.endsWith('/')) {
      prefix += '/';
    }
    
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      // Create a relatively unique key with the chosen prefix
      const safeName = f.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const key = `${prefix}${Date.now()}-${safeName}`;
      try {
        await uploadAssetFile(f, key);
        successCount++;
      } catch (err: any) {
        console.error("Upload failed for", f.name, err);
        alert((lang === "zh" ? "上传失败 " : "Upload failed for ") + f.name + ": " + err.message);
      }
    }
    
    setUploading(false);
    if (successCount > 0) {
      fetchAssets();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  // Compute Virtual Folders and Files for the Current Path
  const { folders, currentFiles } = useMemo(() => {
    const folderSet = new Set<string>();
    const fileList: any[] = [];

    assets.forEach(asset => {
      // Apply type filter first
      if (filter === "image" && !asset.contentType?.startsWith("image/")) return;
      if (filter === "video" && !asset.contentType?.startsWith("video/")) return;

      if (asset.key.startsWith(currentPath)) {
        const relativePath = asset.key.substring(currentPath.length);
        const slashIndex = relativePath.indexOf('/');
        
        if (slashIndex !== -1) {
          // It's in a subfolder
          folderSet.add(relativePath.substring(0, slashIndex + 1));
        } else {
          // It's a file exactly in the current folder
          if (relativePath.length > 0) {
            fileList.push(asset);
          }
        }
      }
    });

    return { 
      folders: Array.from(folderSet).sort(), 
      currentFiles: fileList 
    };
  }, [assets, currentPath, filter]);

  // Breadcrumbs construction
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
            {lang === "zh" ? "媒体资源管理器" : "Media Explorer"}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {lang === "zh" 
              ? "基于分类目录上传和管理多媒体资产（如：品牌、产品图、测试报告等）。" 
              : "Manage taxonomy-based assets: brands, products, reports."}
          </p>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
        <div className="mb-6 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
              {lang === "zh" ? "上传目标目录路径" : "Upload Destination Path"}
            </label>
            <div className="flex bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
              <span className="bg-slate-100 text-slate-500 px-4 py-3 text-sm font-mono border-r border-slate-200 flex items-center">
                root/
              </span>
              <input 
                type="text" 
                value={customUploadPath}
                onChange={(e) => setCustomUploadPath(e.target.value)}
                placeholder={lang === "zh" ? "例如：products/balance-bikes/woom-1/" : "e.g. products/balance-bikes/woom-1/"}
                className="flex-1 bg-transparent px-4 py-3 text-sm font-mono outline-none text-slate-700"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              {lang === "zh" ? "提示：标准根目录包括" : "Tip: Standard prefixes include"} <code className="bg-slate-100 px-1 py-0.5 rounded text-orange-600">brands/</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-orange-600">products/</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-orange-600">reports/</code>.
            </p>
          </div>
        </div>

        <div 
          className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
            dragActive ? "border-orange-500 bg-orange-50" : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <input 
            ref={fileRef} 
            type="file" 
            className="hidden" 
            multiple 
            accept="image/*,video/*"
            onChange={handleFileChange} 
          />
          
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              <p className="font-bold text-slate-700 text-sm">
                {lang === "zh" ? `正在上传至 ${customUploadPath || "根目录"}...` : `Uploading to ${customUploadPath || "root"}...`}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-400">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="font-black text-slate-900">
                  {lang === "zh" ? "点击或将文件拖拽到此处进行上传" : "Click or drag files to upload"}
                </p>
                <p className="text-slate-500 text-xs mt-1">
                  {lang === "zh" ? "文件将会保存在上方指定的目录中。" : "Files will be saved to the path specified above."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Explorer Tools */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide flex-1">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.path}>
              {idx > 0 && <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />}
              <button
                onClick={() => setCurrentPath(crumb.path)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors whitespace-nowrap shrink-0 ${
                  idx === breadcrumbs.length - 1 
                    ? "bg-slate-900 text-white" 
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {idx === 0 && <Home className="w-4 h-4" />}
                {crumb.label}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 shrink-0 border-l border-slate-200 pl-4 ml-2">
          <FilterTab active={filter === "all"} onClick={() => setFilter("all")} label={lang === "zh" ? "全部" : "All"} />
          <FilterTab active={filter === "image"} onClick={() => setFilter("image")} icon={<ImageIcon className="w-4 h-4" />} />
          <FilterTab active={filter === "video"} onClick={() => setFilter("video")} icon={<Video className="w-4 h-4" />} />
        </div>
      </div>

      {/* Grid Area */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
        </div>
      ) : folders.length === 0 && currentFiles.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-[32px] border border-slate-100 border-dashed">
          <Folder className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">
            {lang === "zh" ? "该目录下目前没有文件。" : "This folder is empty."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          
          {/* Render Folders */}
          {folders.map(folderName => (
            <div 
              key={folderName}
              onClick={() => setCurrentPath(currentPath + folderName)}
              className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md hover:border-orange-200 cursor-pointer transition-all flex flex-col items-center justify-center aspect-square gap-3 group"
            >
              <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Folder className="w-6 h-6 fill-current opacity-80" />
              </div>
              <p className="text-xs font-black text-slate-700 truncate w-full text-center px-2">
                {folderName.replace('/', '')}
              </p>
            </div>
          ))}

          {/* Render Files */}
          {currentFiles.map((asset) => {
            const fileName = asset.key.substring(currentPath.length);
            
            return (
              <div key={asset.key} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col">
                <div className="aspect-square bg-slate-100 relative">
                  {asset.contentType?.startsWith("video/") ? (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900">
                      <Video className="w-8 h-8 text-white/50" />
                    </div>
                  ) : (
                    <img 
                      src={asset.url} 
                      alt={fileName} 
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e: any) => { e.target.src = "https://placehold.co/400x400?text=Preview+Unavailable"; }}
                    />
                  )}
                  
                  {/* Overlay actions */}
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleCopy(asset.url); }}
                      className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-900 hover:bg-orange-500 hover:text-white transition-colors shadow-lg"
                      title={lang === "zh" ? "复制资源链接" : "Copy URL"}
                    >
                      {copiedKey === asset.url ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div className="p-3 flex flex-col flex-1 justify-between">
                  <p className="text-[11px] font-bold text-slate-800 break-all line-clamp-2 leading-tight" title={fileName}>
                    {fileName}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-2 font-mono">
                    {(asset.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FilterTab({ active, onClick, label, icon }: any) {
  return (
    <button 
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
        active ? "bg-slate-900 text-white" : "bg-white text-slate-500 hover:bg-slate-100 border border-slate-100"
      }`}
    >
      {icon}
      {label && <span>{label}</span>}
    </button>
  );
}
