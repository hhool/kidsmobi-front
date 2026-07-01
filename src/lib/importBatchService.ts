export type ImportBatchListEntry = {
  importBatchId: string;
  generatedAt: string;
  sourceBase: string;
  totalProducts: number;
  writtenProducts: number;
  failedProducts: number;
  categories: string[];
  batchIndexPath: string;
};

export type ImportBatchProductRow = {
  productId: string;
  sourceCategoryId: string;
  productDirName: string;
  media: {
    coverImages?: number;
    totalImages: number;
    galleryImages: number;
    manufacturerImages: number;
    videos: number;
    invalidVideoCount?: number;
    roleMismatchCount?: number;
  };
  review?: {
    duplicateProduct?: boolean;
    mediaIssue?: boolean;
    editorialIncomplete?: boolean;
    blocked?: boolean;
    flags?: string[];
    decision?: string;
  };
};

export type ImportBatchSummary = {
  importBatchId: string;
  sourceBase: string;
  generatedAt: string;
  categories: string[];
  totalProducts: number;
  writtenProducts: number;
  failedProducts: number;
  outputRoot: string;
  byCategory: Record<string, number>;
  products: ImportBatchProductRow[];
  duplicateProductCount?: number;
  mediaIssueCount?: number;
  editorialIncompleteCount?: number;
  blockedProductCount?: number;
  batchDecision?: string;
};

async function fetchJsonSafe<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) return fallback;
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("application/json")) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

export async function getImportBatchList(): Promise<ImportBatchListEntry[]> {
  const payload = await fetchJsonSafe<{ batches?: ImportBatchListEntry[] }>(
    "/resource/assets/backend-import/batches.index.json",
    { batches: [] }
  );
  return Array.isArray(payload?.batches) ? payload.batches : [];
}

export async function getImportBatchSummary(batchId: string): Promise<ImportBatchSummary | null> {
  const safeBatchId = String(batchId || "").trim();
  if (!safeBatchId) return null;
  const payload = await fetchJsonSafe<ImportBatchSummary | null>(
    `/resource/assets/backend-import/${safeBatchId}/batch.index.json`,
    null
  );
  if (!payload || !payload.importBatchId) return null;
  return {
    ...payload,
    products: Array.isArray(payload.products) ? payload.products : [],
    byCategory: payload.byCategory || {},
    categories: Array.isArray(payload.categories) ? payload.categories : [],
  };
}
