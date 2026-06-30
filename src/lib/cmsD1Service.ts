import { CMSCategory, CMSProduct, CMSScenario, Evaluation, Guide, News } from "../types";

const CMS_API_BASE = (
  import.meta.env.VITE_CMS_API_BASE_URL || import.meta.env.VITE_CMS_BACKEND_BASE_URL || ""
).replace(/\/$/, "");

function resolveCMSApiPath(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  return CMS_API_BASE ? `${CMS_API_BASE}${path}` : path;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const requestUrl = resolveCMSApiPath(path);
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
    throw new Error(details || `Request failed: ${response.status}`);
  }

  const contentType = String(response.headers.get("content-type") || "").toLowerCase();
  if (!contentType.includes("application/json")) {
    const bodyPreview = (await response.text().catch(() => "")).slice(0, 120).replace(/\s+/g, " ");
    throw new Error(
      `Expected JSON response from ${requestUrl}, got '${contentType || "unknown"}'. Preview: ${bodyPreview}`,
    );
  }

  return (await response.json()) as T;
}

export async function getD1CMSProducts(onlyPublished = false): Promise<CMSProduct[]> {
  const query = onlyPublished ? "?onlyPublished=1" : "";
  const response = await requestJson<{ data?: CMSProduct[] }>(`/api/cms/products${query}`);
  return response?.data || [];
}

export async function getD1CMSCategories(onlyPublished = false): Promise<CMSCategory[]> {
  const query = onlyPublished ? "?onlyPublished=1" : "";
  const response = await requestJson<{ data?: CMSCategory[] }>(`/api/cms/categories${query}`);
  return response?.data || [];
}

export async function getD1CMSScenarios(onlyPublished = false): Promise<CMSScenario[]> {
  const query = onlyPublished ? "?onlyPublished=1" : "";
  const response = await requestJson<{ data?: CMSScenario[] }>(`/api/cms/scenarios${query}`);
  return response?.data || [];
}

export async function getD1CMSEvaluations(onlyPublished = false): Promise<Evaluation[]> {
  const query = onlyPublished ? "?onlyPublished=1" : "";
  const response = await requestJson<{ data?: Evaluation[] }>(`/api/cms/evaluations${query}`);
  return response?.data || [];
}

export async function getD1CMSGuides(onlyPublished = false): Promise<Guide[]> {
  const query = onlyPublished ? "?onlyPublished=1" : "";
  const response = await requestJson<{ data?: Guide[] }>(`/api/cms/guides${query}`);
  return response?.data || [];
}

export async function getD1CMSNews(onlyPublished = false): Promise<News[]> {
  const query = onlyPublished ? "?onlyPublished=1" : "";
  const response = await requestJson<{ data?: News[] }>(`/api/cms/news${query}`);
  return response?.data || [];
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
