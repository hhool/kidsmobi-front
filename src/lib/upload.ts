/**
 * Client-side asset upload helper.
 *
 * Flow:
 *  1. POST /api/assets/presign  → { uploadUrl, getUrl }
 *  2. PUT <uploadUrl>            → upload the file directly to R2
 *  3. POST /api/assets/complete → { publicUrl }
 *  4. In dev, when the public URL may not yet be accessible (bucket without
 *     public access), proxy the object through the server and return a
 *     browser ObjectURL for immediate in-page preview.
 */

export interface UploadResult {
  /** The R2 object key. */
  key: string;
  /** The permanent public URL stored in the database. */
  publicUrl: string;
  /**
   * The URL to use for an immediate <img> / <video> preview.
   * In dev this is a browser blob: URL created from the server-side proxy.
   * In production this equals publicUrl.
   */
  previewUrl: string;
}

/**
 * Uploads a file to Cloudflare R2 via the server's presign API and returns
 * both a stable public URL and an immediately-usable preview URL.
 *
 * @param file        The File object to upload.
 * @param keyPrefix   Optional path prefix, e.g. "products/". Defaults to "uploads/".
 */
export async function uploadAsset(
  file: File,
  keyPrefix = "uploads/"
): Promise<UploadResult> {
  const ext = (file.name.split(".").pop() ?? "bin").toLowerCase();
  // Use crypto.randomUUID() for collision-resistant unique IDs
  const uniqueId = crypto.randomUUID();
  const key = `${keyPrefix}${uniqueId}.${ext}`;

  interface PresignErrorBody { error?: string }
  interface PresignSuccessBody { uploadUrl: string; getUrl: string }

  // --- Step 1: Obtain presigned URLs ---
  const presignRes = await fetch("/api/assets/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, contentType: file.type || "application/octet-stream" }),
  });
  if (!presignRes.ok) {
    const body: PresignErrorBody = await presignRes.json().catch(() => ({}));
    throw new Error(body.error || `Presign failed (${presignRes.status})`);
  }
  const { uploadUrl, getUrl } = (await presignRes.json()) as PresignSuccessBody;

  // --- Step 2: Upload directly to R2 ---
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!uploadRes.ok) {
    throw new Error(`R2 upload failed: ${uploadRes.status} ${uploadRes.statusText}`);
  }

  // --- Step 3: Confirm and get permanent public URL ---
  let publicUrl = getUrl; // safe fallback: presigned get URL
  try {
    const completeRes = await fetch("/api/assets/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
    if (completeRes.ok) {
      const data = (await completeRes.json()) as { publicUrl?: string };
      publicUrl = data.publicUrl || publicUrl;
    }
  } catch (err) {
    console.warn("[upload] /api/assets/complete request failed (non-fatal):", err);
  }

  // --- Step 4: Dev preview via server-side proxy ---
  let previewUrl = publicUrl;
  if ((import.meta as any).env?.DEV) {
    try {
      const proxyRes = await fetch(
        `/api/assets/fetch?key=${encodeURIComponent(key)}`
      );
      if (proxyRes.ok) {
        const blob = await proxyRes.blob();
        previewUrl = URL.createObjectURL(blob);
      }
    } catch (err) {
      console.warn("[upload] Dev proxy fetch failed, using publicUrl:", err);
    }
  }

  return { key, publicUrl, previewUrl };
}
