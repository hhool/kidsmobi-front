import { User } from "firebase/auth";
import { auth } from "./firebase";
import { CMSCategory, CMSProduct, CMSScenario, CMSSettings, Evaluation, Guide, News } from "../types";

const CMS_API_BASE = (
  import.meta.env.VITE_CMS_API_BASE_URL || import.meta.env.VITE_CMS_BACKEND_BASE_URL || ""
).replace(/\/$/, "");

function resolveCMSApiPath(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
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

function cleanUndefinedValues<T>(value: T): T {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) {
    return value.map((item) => cleanUndefinedValues(item)) as T;
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) out[k] = cleanUndefinedValues(v);
    }
    return out as T;
  }
  return value;
}

function normalizeText(value: unknown): string {
  return String(value || "").trim().toLowerCase();
}

function getAllowedAdminEmails(): string[] {
  const configured = String(import.meta.env.VITE_ADMIN_EMAIL_ALLOWLIST || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  if (configured.length > 0) return configured;
  return ["hhool.student@gmail.com"];
}

export async function checkIsAdmin(_uid: string, user?: User | null): Promise<boolean> {
  const targetUser = user || auth.currentUser;
  const email = String(targetUser?.email || "").trim().toLowerCase();
  if (!email) return false;
  return getAllowedAdminEmails().includes(email);
}

export async function getCMSProducts(onlyPublished = false): Promise<CMSProduct[]> {
  const query = onlyPublished ? "?onlyPublished=1" : "";
  const response = await requestJson<{ data?: CMSProduct[] }>(`/api/cms/products${query}`);
  return response?.data || [];
}

export async function saveCMSProduct(product: CMSProduct) {
  await requestJson<{ data?: { saved?: boolean } }>("/api/cms/products/save", {
    method: "POST",
    body: JSON.stringify(cleanUndefinedValues({ ...product, updatedAt: new Date().toISOString() })),
  });
}

export async function seedProductsToFirestore(productsData: any[], translateProductFn: any): Promise<boolean> {
  try {
    for (const p of productsData) {
      const pZh = translateProductFn(p, "zh");
      const pEn = translateProductFn(p, "en");
      const cmsProd: CMSProduct = {
        ...p,
        status: "published",
        zh: {
          name: pZh.name || "",
          description: pZh.description || "",
          brandText: pZh.brand || "",
          specsText: "",
          pros: pZh.pros || [],
          cons: pZh.cons || [],
          editorVerdict: pZh.editorVerdict || "",
        },
        en: {
          name: pEn.name || "",
          description: pEn.description || "",
          brandText: pEn.brand || "",
          specsText: "",
          pros: pEn.pros || [],
          cons: pEn.cons || [],
          editorVerdict: pEn.editorVerdict || "",
        },
        updatedAt: new Date().toISOString(),
      };
      await saveCMSProduct(cmsProd);
    }
    return true;
  } catch (error) {
    console.error("Cloudflare D1 seed products failed:", error);
    return false;
  }
}

export async function getCMSEvaluations(onlyPublished = false): Promise<Evaluation[]> {
  const query = onlyPublished ? "?onlyPublished=1" : "";
  const response = await requestJson<{ data?: Evaluation[] }>(`/api/cms/evaluations${query}`);
  return response?.data || [];
}

export async function saveCMSEvaluation(ev: Evaluation) {
  await requestJson<{ data?: { saved?: boolean } }>("/api/cms/evaluations/save", {
    method: "POST",
    body: JSON.stringify(cleanUndefinedValues({ ...ev, updatedAt: new Date().toISOString() })),
  });
}

export async function seedEvaluationsToFirestore(evaluationsData: Evaluation[]): Promise<boolean> {
  try {
    for (const ev of evaluationsData) {
      await saveCMSEvaluation({ ...ev, updatedAt: new Date().toISOString() } as Evaluation);
    }
    return true;
  } catch (error) {
    console.error("Cloudflare D1 seed evaluations failed:", error);
    return false;
  }
}

export async function getCMSGuides(onlyPublished = false): Promise<Guide[]> {
  const query = onlyPublished ? "?onlyPublished=1" : "";
  const response = await requestJson<{ data?: Guide[] }>(`/api/cms/guides${query}`);
  return response?.data || [];
}

export async function saveCMSGuide(guide: Guide) {
  await requestJson<{ data?: { saved?: boolean } }>("/api/cms/guides/save", {
    method: "POST",
    body: JSON.stringify(cleanUndefinedValues({ ...guide, updatedAt: new Date().toISOString() })),
  });
}

export async function seedGuidesToFirestore(guidesData: any[]): Promise<boolean> {
  try {
    for (const g of guidesData) {
      const cmsGuide: Guide = {
        id: g.id,
        category: g.category,
        status: "published",
        imageUrl: "",
        riskCards: [],
        seo: {
          zh: {
            title: g.title,
            description: g.summary,
            keywords: [g.categoryLabel || "指南"],
          },
          en: {
            title: g.title,
            description: g.summary,
            keywords: [g.categoryLabel || "Guide"],
          },
        },
        zh: {
          title: g.title,
          content: g.content,
        },
        en: {
          title: g.title,
          content: g.content,
        },
        updatedAt: new Date().toISOString(),
      };
      await saveCMSGuide(cmsGuide);
    }
    return true;
  } catch (error) {
    console.error("Cloudflare D1 seed guides failed:", error);
    return false;
  }
}

export async function seedNewsToFirestore(newsData: any[]): Promise<boolean> {
  try {
    for (const n of newsData) {
      const cmsNews: News = {
        id: n.id,
        category: n.category,
        status: "published",
        imageUrl: "",
        seo: {
          zh: {
            title: n.title,
            description: n.summary,
            keywords: [n.categoryLabel || "资讯"],
          },
          en: {
            title: n.title,
            description: n.summary,
            keywords: [n.categoryLabel || "News"],
          },
        },
        zh: {
          title: n.title,
          content: n.content,
        },
        en: {
          title: n.title,
          content: n.content,
        },
        updatedAt: new Date().toISOString(),
      };
      await saveCMSNews(cmsNews);
    }
    return true;
  } catch (error) {
    console.error("Cloudflare D1 seed news failed:", error);
    return false;
  }
}

export async function getCMSNews(onlyPublished = false): Promise<News[]> {
  const query = onlyPublished ? "?onlyPublished=1" : "";
  const response = await requestJson<{ data?: News[] }>(`/api/cms/news${query}`);
  return response?.data || [];
}

export async function saveCMSNews(news: News) {
  await requestJson<{ data?: { saved?: boolean } }>("/api/cms/news/save", {
    method: "POST",
    body: JSON.stringify(cleanUndefinedValues({ ...news, updatedAt: new Date().toISOString() })),
  });
}

export async function getCMSCategories(onlyPublished = false): Promise<CMSCategory[]> {
  const query = onlyPublished ? "?onlyPublished=1" : "";
  const response = await requestJson<{ data?: CMSCategory[] }>(`/api/cms/categories${query}`);
  return response?.data || [];
}

export async function saveCMSCategory(category: CMSCategory) {
  await requestJson<{ data?: { saved?: boolean } }>("/api/cms/categories/save", {
    method: "POST",
    body: JSON.stringify(cleanUndefinedValues({ ...category, updatedAt: new Date().toISOString() })),
  });
}

export async function getCMSScenarios(onlyPublished = false): Promise<CMSScenario[]> {
  const query = onlyPublished ? "?onlyPublished=1" : "";
  const response = await requestJson<{ data?: CMSScenario[] }>(`/api/cms/scenarios${query}`);
  return response?.data || [];
}

export async function saveCMSScenario(scenario: CMSScenario) {
  await requestJson<{ data?: { saved?: boolean } }>("/api/cms/scenarios/save", {
    method: "POST",
    body: JSON.stringify(cleanUndefinedValues({ ...scenario, updatedAt: new Date().toISOString() })),
  });
}

export async function getCMSSettings(): Promise<CMSSettings | null> {
  const response = await requestJson<{ data?: CMSSettings | CMSSettings[] | null }>("/api/cms/settings");
  if (Array.isArray(response?.data)) {
    return (response.data[0] as CMSSettings) || null;
  }
  return (response?.data as CMSSettings | null) || null;
}

export async function saveCMSSettings(settings: CMSSettings) {
  await requestJson<{ data?: { saved?: boolean } }>("/api/cms/settings/save", {
    method: "POST",
    body: JSON.stringify(cleanUndefinedValues(settings)),
  });
}

export async function deleteCMSProduct(id: string): Promise<boolean> {
  const response = await requestJson<{ data?: { deleted?: boolean } }>("/api/cms/products/delete", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
  return Boolean(response?.data?.deleted);
}

export async function deleteCMSEvaluation(id: string): Promise<boolean> {
  const response = await requestJson<{ data?: { deleted?: boolean } }>("/api/cms/evaluations/delete", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
  return Boolean(response?.data?.deleted);
}

export async function deleteCMSGuide(id: string): Promise<boolean> {
  const response = await requestJson<{ data?: { deleted?: boolean } }>("/api/cms/guides/delete", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
  return Boolean(response?.data?.deleted);
}

export async function deleteCMSNews(id: string): Promise<boolean> {
  const response = await requestJson<{ data?: { deleted?: boolean } }>("/api/cms/news/delete", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
  return Boolean(response?.data?.deleted);
}

export async function deleteCMSCategory(id: string): Promise<boolean> {
  const response = await requestJson<{ data?: { deleted?: boolean } }>("/api/cms/categories/delete", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
  return Boolean(response?.data?.deleted);
}

export async function deleteCMSScenario(id: string): Promise<boolean> {
  const response = await requestJson<{ data?: { deleted?: boolean } }>("/api/cms/scenarios/delete", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
  return Boolean(response?.data?.deleted);
}

export async function dedupeCMSCategoriesByCode(): Promise<{ removed: number; remaining: number }> {
  try {
    const response = await requestJson<{ data?: { removed?: number; remaining?: number } }>("/api/cms/categories/dedupe", {
      method: "POST",
      body: JSON.stringify({}),
    });
    if (response?.data) {
      return {
        removed: Number(response.data.removed || 0),
        remaining: Number(response.data.remaining || 0),
      };
    }
  } catch {
    // Fallback for environments where backend dedupe endpoint is unavailable.
  }

  const rows = await getCMSCategories(false);
  const groups = new Map<string, CMSCategory[]>();

  for (const row of rows) {
    const key = normalizeText(row.code);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  let removed = 0;
  for (const [code, items] of groups.entries()) {
    if (items.length <= 1) continue;

    const keep =
      items.find((it) => it.id === `cat_${code}`) ||
      items.find((it) => it.status === "published") ||
      [...items].sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))[0];

    for (const item of items) {
      if (item.id === keep.id) continue;
      const ok = await deleteCMSCategory(item.id);
      if (ok) removed += 1;
    }
  }

  const remainingRows = await getCMSCategories(false);
  return { removed, remaining: remainingRows.length };
}
