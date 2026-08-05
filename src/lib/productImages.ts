import type { Product, ProductImageAsset, ProductImages } from "../types";
import type { SyntheticEvent } from "react";

export const FALLBACK_PRODUCT_IMAGE =
  "/images/product-placeholder.svg";

const STORE_MEDIA_ORIGIN = "https://store.balancebiketoddler.com";

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
    .map((segment) => encodeURIComponent(segment))
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
    return normalized;
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
