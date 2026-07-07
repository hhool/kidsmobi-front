import React, { useMemo, useState } from "react";
import { FALLBACK_PRODUCT_IMAGE, withImageFallback } from "../../lib/productImages";

function buildStoreMirrorCandidates(rawUrl: string): string[] {
  const url = String(rawUrl || "").trim();
  if (!url) return [];

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return [];
  }

  if (parsed.hostname !== "store.poki2.online") {
    return [url];
  }

  const candidates = new Set<string>();
  const basePath = parsed.pathname || "";
  const pathVariants = new Set<string>([basePath]);

  if (basePath.includes("/kids_scooters/")) {
    pathVariants.add(basePath.replace("/kids_scooters/", "/scooters/"));
  }
  if (basePath.includes("/scooters/")) {
    pathVariants.add(basePath.replace("/scooters/", "/kids_scooters/"));
  }

  const expandedPathVariants = new Set<string>();
  for (const pathName of pathVariants) {
    expandedPathVariants.add(pathName);
    expandedPathVariants.add(pathName.replace(/%20/g, "+"));
    expandedPathVariants.add(pathName.replace(/\+/g, "%20"));
  }

  for (const pathName of expandedPathVariants) {
    const next = new URL(parsed.toString());
    next.pathname = pathName;
    candidates.add(next.toString());
  }

  return Array.from(candidates);
}

type SmartImageProps = {
  src?: string;
  fallbackSrcs?: string[];
  alt: string;
  className?: string;
  wrapperClassName?: string;
  width?: number;
  height?: number;
  referrerPolicy?: React.ImgHTMLAttributes<HTMLImageElement>["referrerPolicy"];
  loading?: React.ImgHTMLAttributes<HTMLImageElement>["loading"];
  priority?: boolean;
};

export default function SmartImage({
  src,
  fallbackSrcs = [],
  alt,
  className,
  wrapperClassName,
  width = 640,
  height = 640,
  referrerPolicy = "no-referrer",
  loading = "lazy",
  priority = false,
}: SmartImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [fallbackIndex, setFallbackIndex] = useState(0);

  const candidates = useMemo(() => {
    const list = [src, ...fallbackSrcs]
      .flatMap((item) => buildStoreMirrorCandidates(String(item || "")))
      .map((item) => item.trim())
      .filter(Boolean);
    return Array.from(new Set(list));
  }, [src, fallbackSrcs]);

  const resolvedSrc = useMemo(() => {
    const candidate = candidates[fallbackIndex];
    if (candidate) {
      return candidate;
    }
    const normalized = (src || "").trim();
    return normalized || FALLBACK_PRODUCT_IMAGE;
  }, [candidates, fallbackIndex, src]);

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    if (fallbackIndex < candidates.length - 1) {
      setFallbackIndex((idx) => idx + 1);
      return;
    }
    withImageFallback(event);
    setIsLoaded(true);
  };

  return (
    <div className={`relative ${wrapperClassName || ""}`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-slate-100 animate-pulse" aria-hidden="true" />
      )}
      <img
        src={resolvedSrc}
        alt={alt}
        width={width}
        height={height}
        className={`${className || ""} ${isLoaded ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}
        referrerPolicy={referrerPolicy}
        loading={priority ? "eager" : loading}
        fetchPriority={priority ? "high" : "auto"}
        decoding={priority ? "sync" : "async"}
        onLoad={() => setIsLoaded(true)}
        onError={handleImageError}
      />
    </div>
  );
}
