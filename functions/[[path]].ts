/**
 * Phase 2 — per-category-hub publish/preview gate (Cloudflare Pages Function).
 *
 * The site's category hubs (/baby-stroller/, /balance-bike/, …) are prerendered
 * static HTML. This catch-all runs ONLY for those 20 routes (see _routes.json)
 * and, when a hub is in "preview" status, rewrites the DELIVERED HTML so that:
 *   1. crawlers see <meta name="robots" content="noindex,nofollow">, and
 *   2. the reader sees a fixed "PREVIEW" badge.
 *
 * WHY delivered-HTML injection (not a runtime SPA toggle): the historical
 * hydration noindex bug proved a meta tag added by client JS is not reliably
 * captured by Googlebot. The noindex MUST exist in the static HTML the edge
 * serves. Pages Functions transform that HTML before it leaves the edge, so the
 * signal is always present for bots.
 *
 * STATUS SOURCE: the hub status lives in Cloudflare D1, served by the site's
 * API Worker at https://store.balancebiketoddler.com/api/cms/hub_status (public
 * GET, no token). This Function fetches that list and caches it for 60s. We read
 * the D1-backed HTTP endpoint rather than a KV binding so the gate works with
 * zero extra Cloudflare binding configuration.
 *
 * FAIL-OPEN: if the status fetch throws or the cache is empty, every hub is
 * served as published (crawlable). Flipping a hub to preview only HIDES it; it
 * can never accidentally block a published page.
 */

const CATEGORY_HUB_PATHS = new Set<string>([
  "/baby-stroller/",
  "/baby-stroller-by-age/",
  "/baby-stroller-price/",
  "/balance-bike/",
  "/foldable-electric-scooter/",
  "/foldable-electric-scooter-price/",
  "/kids-bike/",
  "/kids-dirt-bike/",
  "/kids-dirt-bike-by-age/",
  "/kids-dirt-bike-price/",
  "/kids-dirt-bike-what-buyers-say/",
  "/kids-electric-scooter/",
  "/kids-electric-scooter-price/",
  "/kids-electric-scooter-what-buyers-say/",
  "/kids-scooter/",
  "/kids-stroller/",
  "/kids-tricycle/",
  "/twin-stroller/",
  "/twin-stroller-by-age/",
  "/twin-stroller-price/",
]);

const HUB_STATUS_ENDPOINT = "https://store.balancebiketoddler.com/api/cms/hub_status";
const STATUS_CACHE_TTL_MS = 60_000;

interface HubEnv {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

// Module-scoped cache: the Function instance is reused across requests on the
// same edge node, so a 60s TTL keeps status fresh without hammering the API.
let statusCache: { map: Record<string, string>; expires: number } | null = null;

async function getPreviewSet(): Promise<Set<string>> {
  const now = Date.now();
  if (statusCache && statusCache.expires > now) {
    const preview = new Set<string>();
    for (const [path, status] of Object.entries(statusCache.map)) {
      if (status === "preview") preview.add(path);
    }
    return preview;
  }
  try {
    const res = await fetch(HUB_STATUS_ENDPOINT, {
      headers: { accept: "application/json" },
      // Do not let a slow upstream block the page; fail-open to published.
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const json = (await res.json()) as { data?: Record<string, string> };
    const map = json.data || {};
    statusCache = { map, expires: now + STATUS_CACHE_TTL_MS };
    const preview = new Set<string>();
    for (const [path, status] of Object.entries(map)) {
      if (status === "preview") preview.add(path);
    }
    return preview;
  } catch {
    // Fail-open: treat everything as published (crawlable). An empty cache is
    // also used for the remainder of this request so we don't retry per-hub.
    statusCache = { map: {}, expires: now + STATUS_CACHE_TTL_MS };
    return new Set<string>();
  }
}

export async function onRequest(context: { request: Request; env: HubEnv }): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`;

  // Safety net: only act on known hub routes. Anything else is served straight
  // from the static asset store. (Per _routes.json this function is only
  // invoked for hub routes, but defensively pass through if routing changes.)
  if (!CATEGORY_HUB_PATHS.has(path)) {
    return env.ASSETS.fetch(request);
  }

  const assetResponse = await env.ASSETS.fetch(request);
  const contentType = assetResponse.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) {
    return assetResponse;
  }

  let isPreview = false;
  try {
    const previewSet = await getPreviewSet();
    isPreview = previewSet.has(path);
  } catch {
    isPreview = false;
  }

  if (!isPreview) {
    return assetResponse;
  }

  let html = await assetResponse.text();

  // Replace any existing robots meta with the noindex directive (avoids two
  // conflicting robots metas; Google would take the most-restrictive anyway,
  // but explicit replacement is cleaner).
  const robotsRe = /<meta\s+name=["']robots["']\s+content=["'][^"']*["']\s*\/?>/i;
  if (robotsRe.test(html)) {
    html = html.replace(robotsRe, '<meta name="robots" content="noindex,nofollow">');
  } else {
    html = html.replace(/<head>/i, '<head>\n  <meta name="robots" content="noindex,nofollow">');
  }

  // Fixed preview badge injected right after <body> so it survives React's
  // createRoot (which wipes #root but leaves body siblings untouched).
  const badge =
    '<div data-preview-badge style="position:fixed;top:0;left:0;right:0;z-index:2147483647;background:#f59e0b;color:#1f2937;font:600 13px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;text-align:center;padding:6px 10px;box-shadow:0 1px 4px rgba(0,0,0,.25)">PREVIEW — hidden from search engines (not indexed)</div>';
  html = html.replace(/<body[^>]*>/i, (match) => `${match}\n${badge}`);

  return new Response(html, {
    status: assetResponse.status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      // Preview state must always reflect the live toggle — never cache it.
      "cache-control": "no-store",
    },
  });
}
