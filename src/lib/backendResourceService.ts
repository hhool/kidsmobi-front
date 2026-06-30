export type BackendPickerCategory = {
  categoryId: string;
  name: string;
};

export type BackendPickerProduct = {
  id: string;
  categoryId: string;
  title: string;
  brand: string;
  coverImage?: string;
  galleryImages: string[];
  videoUrls: string[];
};

export type BackendPickerPayload = {
  categories: BackendPickerCategory[];
  products: BackendPickerProduct[];
};

type WorkerCategory = {
  categoryId: string;
  name: string;
};

type WorkerProduct = {
  productId: string;
  categoryId: string;
  title: string;
  brand: string;
  coverImage?: string;
  images?: {
    cover?: { url?: string };
    gallery?: Array<{ url?: string }>;
  };
};

type WorkerResource = {
  productId: string;
  resourceType: string;
  source?: string;
};

const DEFAULT_WORKER_BASE_URL = "https://kidsmobi-api-v1.seaman-player.workers.dev";

function getWorkerBaseUrl() {
  const env = (import.meta as any)?.env?.VITE_SCRAPE_API_BASE_URL;
  const value = typeof env === "string" && env.trim().length > 0 ? env.trim() : DEFAULT_WORKER_BASE_URL;
  return value.replace(/\/+$/, "");
}

function getBackendApiBaseUrl() {
  const env = (import.meta as any)?.env?.VITE_CMS_BACKEND_BASE_URL;
  if (typeof env !== "string") return "";
  const value = env.trim();
  return value.length > 0 ? value.replace(/\/+$/, "") : "";
}

function isHttpUrl(value?: string) {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

async function fetchWorkerJson<T>(path: string): Promise<T> {
  const response = await fetch(`${getWorkerBaseUrl()}${path}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`Worker request failed (${response.status})${details ? `: ${details}` : ""}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    const details = await response.text().catch(() => "");
    throw new Error(`Worker returned non-JSON response: ${details.slice(0, 120)}`);
  }

  return response.json();
}

async function fetchBackendJson<T>(path: string): Promise<T> {
  const base = getBackendApiBaseUrl();
  if (!base) {
    throw new Error("VITE_CMS_BACKEND_BASE_URL is not configured.");
  }

  const response = await fetch(`${base}${path}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`Backend request failed (${response.status})${details ? `: ${details}` : ""}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    const details = await response.text().catch(() => "");
    throw new Error(`Backend returned non-JSON response: ${details.slice(0, 120)}`);
  }

  return response.json();
}

async function getBackendResourcePayload(params?: { categoryId?: string; q?: string }): Promise<BackendPickerPayload> {
  const search = new URLSearchParams();
  if (params?.categoryId) search.set("categoryId", params.categoryId);
  if (params?.q) search.set("q", params.q);
  const query = search.toString();
  const path = `/api/content/resources${query ? `?${query}` : ""}`;
  const response = await fetchBackendJson<{ data?: BackendPickerPayload }>(path);
  return response?.data || { categories: [], products: [] };
}

async function getWorkerResourcePayload(params?: { categoryId?: string; q?: string }): Promise<BackendPickerPayload> {
  const requestedCategory = (params?.categoryId || "").trim();
  const keyword = (params?.q || "").trim().toLowerCase();

  const categoriesJson = await fetchWorkerJson<{ data: WorkerCategory[] }>("/api/v1/catalog/categories");
  const allCategories = Array.isArray(categoriesJson?.data) ? categoriesJson.data : [];

  const categories = requestedCategory
    ? allCategories.filter((item) => item.categoryId === requestedCategory)
    : allCategories.slice(0, 6);

  const payloads = await Promise.all(
    categories.map(async (category) => {
      const [productsJson, resourcesJson] = await Promise.all([
        fetchWorkerJson<{ data: WorkerProduct[] }>(
          `/api/v1/products?categoryId=${encodeURIComponent(category.categoryId)}&page=1&pageSize=60`
        ),
        fetchWorkerJson<{ data: WorkerResource[] }>(
          `/api/v1/resources?categoryId=${encodeURIComponent(category.categoryId)}&page=1&pageSize=120`
        ),
      ]);
      return {
        category,
        products: Array.isArray(productsJson?.data) ? productsJson.data : [],
        resources: Array.isArray(resourcesJson?.data) ? resourcesJson.data : [],
      };
    })
  );

  const products: BackendPickerProduct[] = [];

  for (const payload of payloads) {
    const videosByProduct = new Map<string, string[]>();
    for (const resource of payload.resources) {
      const isVideo = (resource.resourceType || "").toLowerCase().includes("video");
      const source = (resource.source || "").trim();
      if (!isVideo || !isHttpUrl(source)) continue;
      const current = videosByProduct.get(resource.productId) || [];
      if (!current.includes(source)) current.push(source);
      videosByProduct.set(resource.productId, current);
    }

    for (const item of payload.products) {
      const coverImage = (item.images?.cover?.url || item.coverImage || "").trim();
      const galleryImages = (item.images?.gallery || [])
        .map((img) => (img.url || "").trim())
        .filter((url) => isHttpUrl(url));

      const row: BackendPickerProduct = {
        id: item.productId,
        categoryId: item.categoryId,
        title: item.title,
        brand: item.brand,
        coverImage: isHttpUrl(coverImage) ? coverImage : undefined,
        galleryImages,
        videoUrls: videosByProduct.get(item.productId) || [],
      };

      if (keyword) {
        const text = `${row.id} ${row.title} ${row.brand}`.toLowerCase();
        if (!text.includes(keyword)) continue;
      }

      products.push(row);
    }
  }

  return {
    categories: categories.map((item) => ({ categoryId: item.categoryId, name: item.name })),
    products,
  };
}

export async function getBackendPickerPayload(params?: { categoryId?: string; q?: string }): Promise<BackendPickerPayload> {
  try {
    // Prefer backend API for CMS resource loading when configured.
    if (getBackendApiBaseUrl()) {
      return await getBackendResourcePayload(params);
    }
  } catch (error) {
    console.warn("Backend resource endpoint failed, fallback to worker aggregation:", error);
  }

  return getWorkerResourcePayload(params);
}
