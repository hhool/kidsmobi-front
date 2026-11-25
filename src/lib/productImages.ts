import type { Product, ProductImageAsset, ProductImages } from "../types";
import type { SyntheticEvent } from "react";

export const FALLBACK_PRODUCT_IMAGE =
  "/images/product-placeholder.svg";

const STORE_MEDIA_ORIGIN = "https://store.balancebiketoddler.com";

/**
 * Characters that are illegal in a URL but reach us verbatim in a few CMS media
 * records (an already-absolute imageUrl whose path still contains literal
 * spaces). Leaving them raw yields an invalid <img src> that fails to load.
 * Existing %XX escapes are preserved.
 */
const UNSAFE_URL_CHARS = /[\s<>"{}|\\^`[\]]/g;

/**
 * Encodes one path segment, preserving any %XX escape it already carries.
 *
 * encodeURIComponent() turns an already-escaped segment into a double escape
 * ("Mompush%20Lithe" -> "Mompush%2520Lithe"), pointing at a key that does not
 * exist. The CMS holds most media keys raw but some records are already
 * encoded, and the same URL passes through this resolver more than once on the
 * way to the page, so this has to be idempotent.
 *
 * Mirrors encodeUrlSegment() in scripts/prerender-pages.ts.
 */
function encodeUrlSegment(segment: string): string {
  return String(segment || "")
    .split(/(%[0-9a-f]{2})/gi)
    .map((chunk) => (/^%[0-9a-f]{2}$/i.test(chunk) ? chunk : encodeURIComponent(chunk)))
    .join("");
}

function encodeUnsafeUrlChars(raw: string): string {
  return String(raw || "").replace(UNSAFE_URL_CHARS, (ch) => encodeURIComponent(ch));
}

/**
 * Drops the bucket-name segment from an ALREADY-ABSOLUTE store media URL.
 *
 * `scrape_store/` marks "this key lives in the media bucket", and the relative
 * branch below strips it before rebuilding the URL. The absolute branch used to
 * pass such a URL straight through, so 11 guides whose CMS imageUrl was stored
 * as https://store.balancebiketoddler.com/scrape_store/kids_bikes/.../primary.jpg
 * rendered an <img src> that 404s — the bucket serves `kids_bikes/...` and has
 * no `scrape_store/` prefix. Only our own media host is rewritten; an external
 * URL that happens to contain the string is left alone.
 *
 * Mirrors dropStoreBucketPrefix() in scripts/prerender-pages.ts. The two exist
 * because the static build and the SPA bundle cannot share a module here; keep
 * them in lockstep.
 */
function dropStoreBucketPrefix(absoluteUrl: string): string {
  const match = /^(https?:\/\/[^/]+)\/scrape_store\/(.+)$/i.exec(absoluteUrl);
  if (!match) return absoluteUrl;
  const [, origin, rest] = match;
  if (!/^https?:\/\/(?:store\.)?balancebiketoddler\.com$/i.test(origin)) return absoluteUrl;
  return `${origin}/${rest}`;
}

function toStoreMediaUrl(rawPath: string): string {
  const text = String(rawPath || "").trim().replace(/\\/g, "/");
  if (!text) return "";

  const marker = "scrape_store/";
  const markerIndex = text.indexOf(marker);
  const mediaPath = markerIndex >= 0
    ? text.slice(markerIndex + marker.length)
    : text.replace(/^\.\.\/+/, "").replace(/^\/+/, "");

  if (!mediaPath) return "";
  const encodedPath = mediaPath
    .split("/")
    .filter(Boolean)
    .map(encodeUrlSegment)
    .join("/");

  return encodedPath ? `${STORE_MEDIA_ORIGIN}/${encodedPath}` : "";
}

function normalizeUrl(raw: unknown): string {
  if (typeof raw !== "string") {
    return "";
  }
  const normalized = raw.trim();
  if (!normalized) {
    return "";
  }
  const lower = normalized.toLowerCase();
  if (lower.startsWith("about:blank") || lower.includes("external-url-removed")) {
    return "";
  }
  if (lower.startsWith("data:image/svg+xml")) {
    return "";
  }

  if (/^https?:\/\//i.test(normalized) || normalized.startsWith("/")) {
    return encodeUnsafeUrlChars(dropStoreBucketPrefix(normalized));
  }

  if (lower.includes("scrape_store/")) {
    return toStoreMediaUrl(normalized);
  }

  if (
    lower.startsWith("balance_bike/") ||
    lower.startsWith("kids_bikes/") ||
    lower.startsWith("scooters/") ||
    lower.startsWith("stroller/") ||
    lower.startsWith("double_stroller/") ||
    lower.startsWith("jogger_stroller/") ||
    lower.startsWith("electric_vehicles/") ||
    lower.startsWith("car_seat/") ||
    lower.startsWith("kids_tricycles/") ||
    lower.startsWith("playard/") ||
    lower.startsWith("high_chair/") ||
    lower.startsWith("baby_carrier/")
  ) {
    return toStoreMediaUrl(normalized);
  }

  return normalized;
}

export function normalizeMediaUrl(raw: unknown): string {
  return normalizeUrl(raw);
}

function dedupeUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const url of urls) {
    const normalized = normalizeUrl(url);
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
}

function mapAssetsToUrls(assets: ProductImageAsset[] | undefined): string[] {
  if (!assets || assets.length === 0) {
    return [];
  }
  return assets.map((item) => normalizeUrl(item?.url)).filter(Boolean);
}

export function resolveProductImages(product: Partial<Product> | null | undefined): {
  coverUrl: string;
  galleryUrls: string[];
  featureUrls: string[];
  allImageUrls: string[];
  images: ProductImages;
} {
  const images = product?.images;
  const coverCandidates = [
    normalizeUrl(product?.imageUrl),
    normalizeUrl(images?.cover?.url),
  ].filter(Boolean);

  const galleryCandidates = dedupeUrls([
    ...mapAssetsToUrls(images?.all),
    ...mapAssetsToUrls(images?.gallery),
    ...((product?.productImageUrls || []).map((x) => normalizeUrl(x))),
    ...((product?.galleryUrls || []).map((x) => normalizeUrl(x))),
  ]);

  const featureUrls = dedupeUrls([
    ...mapAssetsToUrls(images?.feature),
    ...((product?.featureImageUrls || []).map((x) => normalizeUrl(x))),
  ]);

  const coverUrl = coverCandidates[0] || galleryCandidates[0] || FALLBACK_PRODUCT_IMAGE;
  const galleryUrls = dedupeUrls(galleryCandidates.filter((url) => url !== coverUrl));
  const allImageUrls = dedupeUrls([coverUrl, ...galleryUrls, ...featureUrls]);

  return {
    coverUrl,
    galleryUrls,
    featureUrls,
    allImageUrls,
    images: {
      cover: {
        url: coverUrl,
        source: images?.cover?.source || "unknown",
        order: 0,
      },
      gallery: galleryUrls.map((url, index) => ({
        url,
        source: images?.gallery?.find((item) => normalizeUrl(item.url) === url)?.source || "unknown",
        order: index + 1,
      })),
      feature: featureUrls.map((url, index) => ({
        url,
        source: images?.feature?.find((item) => normalizeUrl(item.url) === url)?.source || "unknown",
        order: index,
      })),
      all: allImageUrls.map((url, index) => ({
        url,
        source: index === 0 ? images?.cover?.source || "unknown" : images?.gallery?.find((item) => normalizeUrl(item.url) === url)?.source || "unknown",
        order: index,
      })),
    },
  };
}

export function withImageFallback(event: SyntheticEvent<HTMLImageElement>) {
  const target = event.currentTarget;
  if (target.src === FALLBACK_PRODUCT_IMAGE) {
    return;
  }
  target.src = FALLBACK_PRODUCT_IMAGE;
}
