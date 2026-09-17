import { saveAssetMetadata, deleteAssetMetadata } from "./assetStore";

export async function uploadAssetFile(file: File, targetKey: string) {
  // 1. Get Presigned URL (or local upload URL)
  const presignRes = await fetch("/api/assets/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key: targetKey, contentType: file.type })
  });
  
  if (!presignRes.ok) throw new Error("Failed to get presigned URL");
  const { uploadUrl, publicUrl } = await presignRes.json();

  // 2. Upload file
  if (uploadUrl.includes("/upload-local")) {
    const formData = new FormData();
    formData.append("file", file);
    const uploadRes = await fetch(uploadUrl, { method: "POST", body: formData });
    if (!uploadRes.ok) throw new Error("Local upload failed");
  } else {
    // R2 / S3 Presigned URL PUT
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file
    });
    if (!uploadRes.ok) throw new Error("Cloud upload failed");
  }

  // 3. Save metadata to D1 (via Worker API)
  await saveAssetMetadata({
    key: targetKey,
    url: publicUrl,
    size: file.size,
    contentType: file.type,
    createdAt: new Date()
  });

  return publicUrl;
}

export async function deleteAssetFile(key: string) {
  // 1. Delete from R2/Local storage via API
  const res = await fetch(`/api/assets?key=${encodeURIComponent(key)}`, {
    method: "DELETE"
  });
  
  if (!res.ok) {
    throw new Error("Failed to delete physical file from storage.");
  }
  
  // 2. Delete metadata from D1
  await deleteAssetMetadata(key);
}
