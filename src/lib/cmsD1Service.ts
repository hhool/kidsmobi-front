import { CMSCategory, CMSProduct } from "../types";

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
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

export async function deleteD1CMSCategory(id: string): Promise<boolean> {
  const response = await requestJson<{ data?: { deleted?: boolean } }>("/api/cms/categories/delete", {
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
