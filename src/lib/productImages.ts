import type { Product, ProductImageAsset, ProductImages } from "../types";
import type { SyntheticEvent } from "react";

export const FALLBACK_PRODUCT_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240"><rect width="320" height="240" fill="#f1f5f9"/><rect x="96" y="72" width="128" height="96" rx="10" fill="#e2e8f0"/><circle cx="128" cy="120" r="14" fill="#cbd5e1"/><path d="M154 138l20-24 28 34H118l22-26 14 16z" fill="#94a3b8"/></svg>'
  );

function normalizeUrl(raw: unknown): string {
  if (typeof raw !== "string") {
    return "";
  }
  return raw.trim();
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
  const allImageUrls = dedupeUrls([coverUrl, ...galleryUrls]);

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
