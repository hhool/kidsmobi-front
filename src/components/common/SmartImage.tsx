import React, { useEffect, useMemo, useRef, useState } from "react";
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
  const [isLoaded, setIsLoaded] = useState(true);
  const [resolvedSrc, setResolvedSrc] = useState(FALLBACK_PRODUCT_IMAGE);
  const [isNearViewport, setIsNearViewport] = useState(priority || loading !== "lazy");
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const candidates = useMemo(() => {
    const list = [src, ...fallbackSrcs]
      .flatMap((item) => buildStoreMirrorCandidates(String(item || "")))
      .map((item) => item.trim())
      .filter(Boolean);
    return Array.from(new Set(list));
  }, [src, fallbackSrcs]);

  useEffect(() => {
    if (priority || loading !== "lazy") {
      setIsNearViewport(true);
      return;
    }

    const node = wrapperRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: "160px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [loading, priority]);

  useEffect(() => {
    let cancelled = false;
    let timer: number | null = null;
    const list = candidates.length > 0 ? candidates : [(src || "").trim()].filter(Boolean);

    setResolvedSrc(FALLBACK_PRODUCT_IMAGE);
    setIsLoaded(true);

    if (!isNearViewport) return;

    const loadCandidate = (index: number) => {
      if (cancelled) return;
      const candidate = list[index];
      if (!candidate) return;

      const probe = new Image();
      timer = window.setTimeout(() => loadCandidate(index + 1), priority ? 16000 : 12000);
      probe.onload = () => {
        if (timer) window.clearTimeout(timer);
        if (!cancelled) {
          setResolvedSrc(candidate);
          setIsLoaded(true);
        }
      };
      probe.onerror = () => {
        if (timer) window.clearTimeout(timer);
        loadCandidate(index + 1);
      };
      probe.referrerPolicy = referrerPolicy;
      probe.src = candidate;
    };

    loadCandidate(0);

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [candidates, isNearViewport, priority, referrerPolicy, src]);

  const markLoaded = () => {
    setIsLoaded(true);
  };

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    if (resolvedSrc !== FALLBACK_PRODUCT_IMAGE) {
      setResolvedSrc(FALLBACK_PRODUCT_IMAGE);
    }
    withImageFallback(event);
    setIsLoaded(true);
  };

  return (
    <div ref={wrapperRef} className={`relative ${wrapperClassName || ""}`}>
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
        onLoad={markLoaded}
        onError={handleImageError}
      />
    </div>
  );
}
