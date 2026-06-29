import React, { useMemo, useState } from "react";
import { FALLBACK_PRODUCT_IMAGE, withImageFallback } from "../../lib/productImages";

type SmartImageProps = {
  src?: string;
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

  const resolvedSrc = useMemo(() => {
    const normalized = (src || "").trim();
    return normalized || FALLBACK_PRODUCT_IMAGE;
  }, [src]);

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
        onError={(event) => {
          withImageFallback(event);
          setIsLoaded(true);
        }}
      />
    </div>
  );
}
