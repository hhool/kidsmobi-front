import { CMSCategory, CMSProduct, CMSScenario, CMSSettings, Evaluation, Guide, News } from "../types";

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

/**
 * Rotates the browser/edge cache key for CMS reads.
 *
 * The zone's edge rules hand `/api/cms/*` responses to browsers as
 * `public, max-age=14400` with no revalidation, so a visitor who loaded the
 * site before a CMS publish kept rendering the pre-publish payload for up to
 * four hours. Observed 2026-10-24: freshly deployed JS was already live while
 * the guide library still served the pre-40-guides API snapshot, which looked
 * like "the Scooter filter returns 0 guides".
 *
 * The Worker normalises its own edge-cache key to pathname + onlyPublished and
 * re-reads D1 at most once per 300s, so rotating a throwaway query param per
 * 5-minute bucket only rotates the browser/edge cache key — D1 read volume is
 * unchanged, and a reload picks up CMS edits within ~5 minutes.
 */
const CMS_BROWSER_CACHE_BUSTER_WINDOW_MS = 5 * 60 * 1000;

export function cmsCacheBustedUrl(path: string): string {
  if (!path.includes("/api/cms/")) return path;
  const bucket = Math.floor(Date.now() / CMS_BROWSER_CACHE_BUSTER_WINDOW_MS);
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}_cb=${bucket}`;
}

/**
 * #48 admin token — RUNTIME ONLY.
 *
 * Do NOT supply this through VITE_CMS_ADMIN_ALL_TOKEN in a production build:
 * Vite inlines VITE_* vars into the public JS bundle, which is exactly how this
 * secret ended up shipped in a deployed asset on 2026-11-06. Instead the
 * operator pastes it once in the Admin panel; it is kept in sessionStorage for
 * the current tab only, never persisted to disk and never logged.
 * Prefer proper session auth on the Worker when that lands; until then this
 * keeps the credential out of every publicly served file.
 */
const CMS_ADMIN_TOKEN_SESSION_KEY = "bbt-cms-admin-token";

export function getCMSAdminToken(): string {
  try {
    return String(window.sessionStorage.getItem(CMS_ADMIN_TOKEN_SESSION_KEY) || "").trim();
  } catch {
    return "";
  }
}

export function setCMSAdminToken(token: string): void {
  const value = String(token || "").trim();
  try {
    if (value) window.sessionStorage.setItem(CMS_ADMIN_TOKEN_SESSION_KEY, value);
    else window.sessionStorage.removeItem(CMS_ADMIN_TOKEN_SESSION_KEY);
  } catch {
    // Storage blocked (private mode / policy): writes will 403 with a clear hint.
  }
}

export function hasCMSAdminToken(): boolean {
  return getCMSAdminToken().length > 0;
}

export async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const hasBody = init?.body !== undefined && init?.body !== null;
  // Reads rotate their browser cache key (see cmsCacheBustedUrl); writes must
  // keep the exact URL the Worker routes on.
  const requestUrl = resolveCMSApiPath(hasBody ? path : cmsCacheBustedUrl(path));
  let lastError: Error | null = null;

  // #48: attach the admin token so gated CMS writes pass. Prefer the operator's
  // runtime token (sessionStorage, set once in the Admin panel). The legacy
  // VITE_* build var is a LOCAL-DEV fallback only — leaving it set in a
  // production build would inline the secret into publicly served JS.
  // Harmless on public GET reads.
  const adminToken =
    getCMSAdminToken() || String((import.meta as any)?.env?.VITE_CMS_ADMIN_ALL_TOKEN || "").trim();

  // Only send Content-Type when a body is actually present (hasBody above): a
  // GET marked "Content-Type: application/json" stops being a CORS-simple
  // request, which forces an extra preflight OPTIONS round trip for no benefit.
  // (Verified against the live Worker: reads worked either way because /api/*
  // is same-origin on the app host and only redirects to the Worker host, so
  // this is a tidy-up, not a bug fix.)

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await fetch(requestUrl, {
      ...init,
      // Headers must come LAST: spreading init after them replaced the whole
      // object, silently dropping the admin token and Content-Type for any
      // caller that supplied its own headers.
      headers: {
        ...(hasBody ? { "Content-Type": "application/json" } : {}),
        Accept: "application/json",
        ...(adminToken ? { "x-cms-admin-token": adminToken } : {}),
        ...(init?.headers || {}),
      },
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

export async function migrateD1CMSGuidesTaxonomy(): Promise<{ processed: number; updated: number }> {
  const response = await requestJson<{ data?: { processed?: number; updated?: number } }>("/api/cms/guides/migrate-taxonomy", {
    method: "POST",
    body: JSON.stringify({}),
  });
  return {
    processed: Number(response?.data?.processed || 0),
    updated: Number(response?.data?.updated || 0),
  };
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

export async function getD1CMSSettings(): Promise<CMSSettings | null> {
  const response = await requestJson<{ data?: CMSSettings | CMSSettings[] | null }>("/api/cms/settings");
  if (Array.isArray(response?.data)) {
    return (response.data[0] as CMSSettings) || null;
  }
  return (response?.data as CMSSettings | null) || null;
}

export async function saveD1CMSSettings(settings: CMSSettings): Promise<boolean> {
  const response = await requestJson<{ data?: { saved?: boolean } }>("/api/cms/settings/save", {
    method: "POST",
    body: JSON.stringify(settings),
  });
  return Boolean(response?.data?.saved);
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
  const requestUrl = resolveCMSApiPath(cmsCacheBustedUrl("/api/cms/ops/export?download=1"));
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

/**
 * Phase 1: per-hub publish/preview gate.
 *
 * Returns the map of hub_path -> status ("published" | "preview") from D1.
 * Hubs without a row are implicitly published (fail-open): the front prerender
 * ships every hub as crawlable HTML by default, and the Phase 2 Pages Functions
 * gateway is what demotes a "preview" hub to noindex.
 */
export async function getD1CMSHubStatus(): Promise<Record<string, string>> {
  const response = await requestJson<{ data?: Record<string, string> }>("/api/cms/hub_status");
  return response?.data || {};
}

export async function saveD1CMSHubStatus(hubPath: string, status: "published" | "preview"): Promise<boolean> {
  const response = await requestJson<{ data?: { saved?: boolean } }>("/api/cms/hub_status/save", {
    method: "POST",
    body: JSON.stringify({ hubPath, status }),
  });
  return Boolean(response?.data?.saved);
}

/**
 * Backend-editable rich-media blocks for the 20 category hubs. The shape mirrors
 * the Worker's HubMediaBlock (validated): hub_media is a JSON array of typed
 * blocks. Rendered both in the SPA (runtime fetch) and the prerender (baked at
 * build time from /api/cms/hub_media).
 */
export type HubRichMediaBlock =
  | { type: "heroImage"; url: string; alt?: string }
  | { type: "heroVideo"; url: string; poster?: string; alt?: string; caption?: string }
  | { type: "image"; url: string; alt?: string; caption?: string }
  | { type: "video"; url: string; poster?: string; alt?: string; caption?: string }
  | { type: "gallery"; items: Array<{ url: string; alt?: string; caption?: string }> }
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "cta"; label: string; href: string };

export async function getD1CMSHubMediaMap(): Promise<Record<string, HubRichMediaBlock[]>> {
  const response = await requestJson<{ data?: Record<string, HubRichMediaBlock[]> }>("/api/cms/hub_media");
  return response?.data || {};
}

export async function getD1CMSHubMedia(hubPath: string): Promise<HubRichMediaBlock[]> {
  const path = `/api/cms/hub_media${hubPath}`;
  const response = await requestJson<{ data?: { hubPath: string; blocks: HubRichMediaBlock[] } }>(path);
  return response?.data?.blocks || [];
}

export async function saveD1CMSHubMedia(hubPath: string, blocks: HubRichMediaBlock[]): Promise<boolean> {
  const response = await requestJson<{ data?: { saved?: boolean } }>("/api/cms/hub_media/save", {
    method: "POST",
    body: JSON.stringify({ hubPath, blocks }),
  });
  return Boolean(response?.data?.saved);
}
