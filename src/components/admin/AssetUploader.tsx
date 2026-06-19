import React, { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { uploadAsset } from "../../lib/upload";

interface AssetUploaderProps {
  /** Current persisted URL (shown as thumbnail when no upload is in progress). */
  value: string;
  /** Called with the permanent public URL after a successful upload. */
  onChange: (publicUrl: string) => void;
  /** Optional label rendered above the dropzone. */
  label?: string;
  /** accept attribute for the hidden <input type="file">. Defaults to "image/*". */
  accept?: string;
  /** R2 key prefix, e.g. "products/". Defaults to "uploads/". */
  keyPrefix?: string;
}

/**
 * Allow only safe URL schemes for image previews to prevent XSS via
 * javascript: or data: URIs that are not images.
 */
function isSafePreviewUrl(url: string): boolean {
  return (
    url.startsWith("blob:") ||
    url.startsWith("https://") ||
    url.startsWith("http://")
  );
}

/**
 * Drag-and-drop / click-to-upload component for Cloudflare R2 assets.
 *
 * - Shows an immediate preview using a browser ObjectURL in dev (no public
 *   bucket access required) or the public URL in production.
 * - Calls onChange with the permanent public URL once the upload completes.
 */
export default function AssetUploader({
  value,
  onChange,
  label,
  accept = "image/*",
  keyPrefix = "uploads/",
}: AssetUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>(value);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    setError(null);
    // Show local preview immediately so the user sees something right away
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    try {
      const result = await uploadAsset(file, keyPrefix);
      // Replace local blob with the server-confirmed preview URL
      URL.revokeObjectURL(localPreview);
      setPreviewUrl(result.previewUrl);
      onChange(result.publicUrl);
    } catch (e: any) {
      URL.revokeObjectURL(localPreview);
      setPreviewUrl(value); // revert to last known good value
      setError(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so the same file can be re-selected after a failure
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const clearAsset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl("");
    onChange("");
    setError(null);
  };

  const displayUrl = previewUrl || value;
  // Only render URLs with safe schemes to prevent XSS
  const safeDisplayUrl = displayUrl && isSafePreviewUrl(displayUrl) ? displayUrl : "";

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {label}
        </label>
      )}

      <div
        role="button"
        aria-label={label ? `Upload ${label}` : "Upload asset"}
        tabIndex={0}
        className={`relative rounded-2xl border-2 border-dashed cursor-pointer transition-all outline-none
          focus:ring-4 focus:ring-orange-500/20
          ${uploading
            ? "border-orange-300 bg-orange-50"
            : "border-slate-200 hover:border-orange-400 hover:bg-orange-50/30"
          }`}
        onClick={() => !uploading && inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && !uploading && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleInputChange}
        />

        {safeDisplayUrl ? (
          <div className="relative group p-2">
            <img
              src={safeDisplayUrl}
              alt="Asset preview"
              className="w-full h-32 object-contain rounded-xl"
              referrerPolicy="no-referrer"
            />
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center gap-3">
              <span className="text-white text-xs font-bold">Click to replace</span>
              <button
                onClick={clearAsset}
                className="p-1.5 bg-white/20 rounded-full hover:bg-white/40 transition-colors"
                title="Remove image"
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
            {uploading && (
              <div className="absolute inset-0 bg-black/30 rounded-2xl flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 flex flex-col items-center gap-3">
            {uploading ? (
              <>
                <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-bold text-orange-500">Uploading…</p>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 text-slate-300" />
                <p className="text-xs font-bold text-slate-400">
                  Drop or click to upload
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="text-[11px] font-bold text-red-500 flex items-center gap-1">
          <X className="w-3 h-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
