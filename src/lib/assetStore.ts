import { requestJson } from "./cmsD1Service";

export interface AssetMetadata {
  key: string;
  url: string;
  size: number;
  contentType: string;
  createdAt: any;
}

function normalizeAssetRow(row: any): AssetMetadata {
  return {
    key: String(row?.key || ""),
    url: String(row?.url || ""),
    size: Number(row?.size || 0),
    contentType: String(row?.contentType || ""),
    createdAt: row?.createdAt || null,
  };
}

export const saveAssetMetadata = async (metadata: AssetMetadata) => {
  await requestJson<{ data?: { saved?: boolean } }>("/api/cms/assets/save", {
    method: "POST",
    body: JSON.stringify({
      key: metadata.key,
      url: metadata.url,
      size: metadata.size,
      contentType: metadata.contentType,
      createdAt: metadata.createdAt instanceof Date
        ? metadata.createdAt.toISOString()
        : metadata.createdAt || new Date().toISOString(),
    }),
  });
};

export const listAssetMetadata = async (): Promise<AssetMetadata[]> => {
  const response = await requestJson<{ data?: any[] }>("/api/cms/assets");
  return Array.isArray(response?.data) ? response.data.map(normalizeAssetRow) : [];
};

export const deleteAssetMetadata = async (key: string) => {
  await requestJson<{ data?: { deleted?: boolean } }>("/api/cms/assets/delete", {
    method: "POST",
    body: JSON.stringify({ key }),
  });
};
