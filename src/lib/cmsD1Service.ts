import { CMSCategory, CMSProduct, CMSScenario, Evaluation, Guide, News } from "../types";

export type CMSOpsCollection =
  | "products"
  | "categories"
  | "scenarios"
  | "evaluations"
  | "guides"
  | "news"
  | "settings"
  | "all";

export interface CMSOpsOverview {
  configured: boolean;
  healthy: boolean;
  counts: Record<Exclude<CMSOpsCollection, "all">, number>;
  updatedAt: string;
}

const CMS_API_BASE = (
  import.meta.env.VITE_CMS_API_BASE_URL || import.meta.env.VITE_CMS_BACKEND_BASE_URL || ""
).replace(/\/$/, "");

function resolveCMSApiPath(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  if (typeof window !== "undefined") {
    const host = String(window.location.hostname || "").toLowerCase();
    const isLocalHost = host === "localhost" || host === "127.0.0.1" || host === "::1";
    if (!isLocalHost) {
      return path;
    }
  }

  return CMS_API_BASE ? `${CMS_API_BASE}${path}` : path;
}

function sanitizeListRows<T>(rows: unknown): T[] {
  if (!Array.isArray(rows)) return [];
  return rows.filter((item): item is T => Boolean(item && typeof item === "object"));
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const requestUrl = resolveCMSApiPath(path);
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await fetch(requestUrl, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(init?.headers || {}),
      },
      ...init,
    });

    if (!response.ok) {
      const details = await response.text().catch(() => "");
      const transient = response.status === 502 || response.status === 503 || response.status === 504;
      if (transient && attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
        continue;
      }
      lastError = new Error(details || `Request failed: ${response.status}`);
      break;
    }

    const contentType = String(response.headers.get("content-type") || "").toLowerCase();
    if (!contentType.includes("application/json")) {
      const bodyPreview = (await response.text().catch(() => "")).slice(0, 120).replace(/\s+/g, " ");
      lastError = new Error(
        `Expected JSON response from ${requestUrl}, got '${contentType || "unknown"}'. Preview: ${bodyPreview}`,
      );
      break;
    }

    return (await response.json()) as T;
  }

  throw lastError || new Error(`Request failed for ${requestUrl}`);
}

export async function getD1CMSProducts(onlyPublished = false): Promise<CMSProduct[]> {
  const query = onlyPublished ? "?onlyPublished=1" : "";
  const response = await requestJson<{ data?: CMSProduct[] }>(`/api/cms/products${query}`);
  return sanitizeListRows<CMSProduct>(response?.data);
}

export async function getD1CMSCategories(onlyPublished = false): Promise<CMSCategory[]> {
  const query = onlyPublished ? "?onlyPublished=1" : "";
  const response = await requestJson<{ data?: CMSCategory[] }>(`/api/cms/categories${query}`);
  return sanitizeListRows<CMSCategory>(response?.data);
}

export async function getD1CMSScenarios(onlyPublished = false): Promise<CMSScenario[]> {
  const query = onlyPublished ? "?onlyPublished=1" : "";
  const response = await requestJson<{ data?: CMSScenario[] }>(`/api/cms/scenarios${query}`);
  return sanitizeListRows<CMSScenario>(response?.data);
}

export async function getD1CMSEvaluations(onlyPublished = false): Promise<Evaluation[]> {
  const query = onlyPublished ? "?onlyPublished=1" : "";
  const response = await requestJson<{ data?: Evaluation[] }>(`/api/cms/evaluations${query}`);
  return sanitizeListRows<Evaluation>(response?.data);
}

export async function getD1CMSGuides(onlyPublished = false): Promise<Guide[]> {
  const query = onlyPublished ? "?onlyPublished=1" : "";
  const response = await requestJson<{ data?: Guide[] }>(`/api/cms/guides${query}`);
  return sanitizeListRows<Guide>(response?.data);
}

export async function getD1CMSNews(onlyPublished = false): Promise<News[]> {
  const query = onlyPublished ? "?onlyPublished=1" : "";
  const response = await requestJson<{ data?: News[] }>(`/api/cms/news${query}`);
  return sanitizeListRows<News>(response?.data);
}

export async function initD1CMSCategories(): Promise<{ total: number }> {
  const response = await requestJson<{ data?: { total?: number } }>("/api/cms/init/categories", {
    method: "POST",
    body: "{}",
  });
  return {
    total: response?.data?.total || 0,
  };
}

export async function initD1CMSProducts(): Promise<{ total: number; success: number }> {
  const response = await requestJson<{ data?: { total?: number; success?: number } }>("/api/cms/init/products", {
    method: "POST",
    body: "{}",
  });
  return {
    total: response?.data?.total || 0,
    success: response?.data?.success || 0,
  };
}

export async function saveD1CMSCategory(category: CMSCategory): Promise<boolean> {
  const response = await requestJson<{ data?: { saved?: boolean } }>("/api/cms/categories/save", {
    method: "POST",
    body: JSON.stringify(category),
  });
  return Boolean(response?.data?.saved);
}

export async function saveD1CMSScenario(scenario: CMSScenario): Promise<boolean> {
  const response = await requestJson<{ data?: { saved?: boolean } }>("/api/cms/scenarios/save", {
    method: "POST",
    body: JSON.stringify(scenario),
  });
  return Boolean(response?.data?.saved);
}

export async function saveD1CMSEvaluation(evaluation: Evaluation): Promise<boolean> {
  const response = await requestJson<{ data?: { saved?: boolean } }>("/api/cms/evaluations/save", {
    method: "POST",
    body: JSON.stringify(evaluation),
  });
  return Boolean(response?.data?.saved);
}

export async function saveD1CMSGuide(guide: Guide): Promise<boolean> {
  const response = await requestJson<{ data?: { saved?: boolean } }>("/api/cms/guides/save", {
    method: "POST",
    body: JSON.stringify(guide),
  });
  return Boolean(response?.data?.saved);
}

export async function saveD1CMSNews(news: News): Promise<boolean> {
  const response = await requestJson<{ data?: { saved?: boolean } }>("/api/cms/news/save", {
    method: "POST",
    body: JSON.stringify(news),
  });
  return Boolean(response?.data?.saved);
}

export async function deleteD1CMSCategory(id: string): Promise<boolean> {
  const response = await requestJson<{ data?: { deleted?: boolean } }>("/api/cms/categories/delete", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
  return Boolean(response?.data?.deleted);
}

export async function deleteD1CMSScenario(id: string): Promise<boolean> {
  const response = await requestJson<{ data?: { deleted?: boolean } }>("/api/cms/scenarios/delete", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
  return Boolean(response?.data?.deleted);
}

export async function deleteD1CMSEvaluation(id: string): Promise<boolean> {
  const response = await requestJson<{ data?: { deleted?: boolean } }>("/api/cms/evaluations/delete", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
  return Boolean(response?.data?.deleted);
}

export async function deleteD1CMSGuide(id: string): Promise<boolean> {
  const response = await requestJson<{ data?: { deleted?: boolean } }>("/api/cms/guides/delete", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
  return Boolean(response?.data?.deleted);
}

export async function deleteD1CMSNews(id: string): Promise<boolean> {
  const response = await requestJson<{ data?: { deleted?: boolean } }>("/api/cms/news/delete", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
  return Boolean(response?.data?.deleted);
}

export async function saveD1CMSProduct(product: CMSProduct): Promise<boolean> {
  const response = await requestJson<{ data?: { saved?: boolean } }>("/api/cms/products/save", {
    method: "POST",
    body: JSON.stringify(product),
  });
  return Boolean(response?.data?.saved);
}

export async function deleteD1CMSProduct(id: string): Promise<boolean> {
  const response = await requestJson<{ data?: { deleted?: boolean } }>("/api/cms/products/delete", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
  return Boolean(response?.data?.deleted);
}

export async function getD1Health(): Promise<{ configured: boolean; healthy: boolean }> {
  const response = await requestJson<{ data?: { configured?: boolean; healthy?: boolean } }>("/api/cms/d1/health");
  return {
    configured: Boolean(response?.data?.configured),
    healthy: Boolean(response?.data?.healthy),
  };
}

export async function getCMSOpsOverview(): Promise<CMSOpsOverview> {
  const response = await requestJson<{ data?: CMSOpsOverview }>("/api/cms/ops/overview");
  const data = response?.data;
  return {
    configured: Boolean(data?.configured),
    healthy: Boolean(data?.healthy),
    counts: {
      products: Number(data?.counts?.products || 0),
      categories: Number(data?.counts?.categories || 0),
      scenarios: Number(data?.counts?.scenarios || 0),
      evaluations: Number(data?.counts?.evaluations || 0),
      guides: Number(data?.counts?.guides || 0),
      news: Number(data?.counts?.news || 0),
      settings: Number(data?.counts?.settings || 0),
    },
    updatedAt: String(data?.updatedAt || new Date().toISOString()),
  };
}

export async function initCMSOpsCollection(
  collection: CMSOpsCollection,
  mode: "append" | "replace" = "append",
  source: "worker" | "baseline" = "worker",
): Promise<{ collection: CMSOpsCollection; initialized: number }> {
  const response = await requestJson<{ data?: { collection?: CMSOpsCollection; initialized?: number } }>("/api/cms/ops/init", {
    method: "POST",
    body: JSON.stringify({ collection, mode, source }),
  });
  return {
    collection: (response?.data?.collection || collection) as CMSOpsCollection,
    initialized: Number(response?.data?.initialized || 0),
  };
}

export async function purgeCMSOpsCollection(collection: CMSOpsCollection): Promise<{ collection: CMSOpsCollection; purged: number }> {
  const response = await requestJson<{ data?: { collection?: CMSOpsCollection; purged?: number } }>("/api/cms/ops/purge", {
    method: "POST",
    body: JSON.stringify({ collection }),
  });
  return {
    collection: (response?.data?.collection || collection) as CMSOpsCollection,
    purged: Number(response?.data?.purged || 0),
  };
}

export async function dedupeD1CMSCategories(): Promise<{ removed: number; remaining: number }> {
  const response = await requestJson<{ data?: { removed?: number; remaining?: number } }>("/api/cms/categories/dedupe", {
    method: "POST",
    body: "{}",
  });
  return {
    removed: Number(response?.data?.removed || 0),
    remaining: Number(response?.data?.remaining || 0),
  };
}

export async function downloadCMSOpsExport(): Promise<void> {
  const requestUrl = resolveCMSApiPath("/api/cms/ops/export?download=1");
  const response = await fetch(requestUrl, {
    headers: {
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(details || `Request failed: ${response.status}`);
  }

  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition") || "";
  const match = disposition.match(/filename=\"?([^\";]+)\"?/i);
  const filename = match?.[1] || `cms-export-${Date.now()}.json`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
