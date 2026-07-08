import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FALLBACK_PRODUCT_IMAGE, withImageFallback } from "../lib/productImages";

interface ProductCarouselProps {
  images: string[];
  lang: "zh" | "en";
  productName?: string;
}

function CarouselImage({ src, alt, className }: { src?: string; alt: string; className: string }) {
  const [resolvedSrc, setResolvedSrc] = useState(src || FALLBACK_PRODUCT_IMAGE);

  useEffect(() => {
    const nextSrc = src || FALLBACK_PRODUCT_IMAGE;
    setResolvedSrc(nextSrc);
    if (nextSrc === FALLBACK_PRODUCT_IMAGE) return;

    let settled = false;
    const probe = new Image();
    const timer = window.setTimeout(() => {
      if (!settled) setResolvedSrc(FALLBACK_PRODUCT_IMAGE);
    }, 8000);
    probe.onload = () => {
      settled = true;
      window.clearTimeout(timer);
      setResolvedSrc(nextSrc);
    };
    probe.onerror = () => {
      settled = true;
      window.clearTimeout(timer);
      setResolvedSrc(FALLBACK_PRODUCT_IMAGE);
    };
    probe.referrerPolicy = "no-referrer";
    probe.src = nextSrc;

    return () => {
      settled = true;
      window.clearTimeout(timer);
    };
  }, [src]);

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      loading="lazy"
      onLoad={() => undefined}
      onError={(event) => {
        setResolvedSrc(FALLBACK_PRODUCT_IMAGE);
        withImageFallback(event);
      }}
    />
  );
}

export default function ProductCarousel({ images, lang, productName }: ProductCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [activeImageSrc, setActiveImageSrc] = useState(images[0] || FALLBACK_PRODUCT_IMAGE);

  useEffect(() => {
    const nextSrc = images[currentIndex] || FALLBACK_PRODUCT_IMAGE;
    setActiveImageSrc(nextSrc);
    if (nextSrc === FALLBACK_PRODUCT_IMAGE) return;

    let settled = false;
    const probe = new Image();
    const timer = window.setTimeout(() => {
      if (!settled) setActiveImageSrc(FALLBACK_PRODUCT_IMAGE);
    }, 8000);
    probe.onload = () => {
      settled = true;
      window.clearTimeout(timer);
      setActiveImageSrc(nextSrc);
    };
    probe.onerror = () => {
      settled = true;
      window.clearTimeout(timer);
      setActiveImageSrc(FALLBACK_PRODUCT_IMAGE);
    };
    probe.referrerPolicy = "no-referrer";
    probe.src = nextSrc;

    return () => {
      settled = true;
      window.clearTimeout(timer);
    };
  }, [currentIndex, images]);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentIndex((prev) => (prev + newDirection + images.length) % images.length);
  };

  if (!images || images.length === 0) return null;

  return (
    <div className="relative w-full h-[400px] bg-white rounded-3xl overflow-hidden group">
      {/* Main Image Viewport */}
      <div className="relative w-full h-full flex items-center justify-center p-8">
        <AnimatePresence initial={false} custom={direction}>
          <motion.img
            key={currentIndex}
            src={activeImageSrc}
            alt={productName ? `${productName} - Image ${currentIndex + 1}` : `Product image ${currentIndex + 1}`}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            className="absolute max-w-full max-h-[340px] object-contain cursor-zoom-in"
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={withImageFallback}
          />
        </AnimatePresence>
      </div>

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={() => paginate(-1)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/80 backdrop-blur-md border border-slate-200 rounded-full flex items-center justify-center text-slate-600 hover:bg-orange-500 hover:text-white hover:border-orange-400 transition-all shadow-lg opacity-0 group-hover:opacity-100"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => paginate(1)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/80 backdrop-blur-md border border-slate-200 rounded-full flex items-center justify-center text-slate-600 hover:bg-orange-500 hover:text-white hover:border-orange-400 transition-all shadow-lg opacity-0 group-hover:opacity-100"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Thumbnails Overlay */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2 px-4 py-2 bg-slate-900/10 backdrop-blur-md rounded-2xl border border-white/20">
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => {
              setDirection(idx > currentIndex ? 1 : -1);
              setCurrentIndex(idx);
            }}
            className={`w-12 h-12 rounded-lg border-2 overflow-hidden transition-all bg-white p-1 ${
              currentIndex === idx ? "border-orange-500 scale-110 shadow-md" : "border-transparent opacity-50 hover:opacity-100"
            }`}
          >
            <CarouselImage
              src={img || undefined}
              alt={productName ? `${productName} - Thumbnail ${idx + 1}` : `Thumbnail ${idx + 1}`}
              className="w-full h-full object-contain"
            />
          </button>
        ))}
      </div>

      {/* Counter */}
      <div className="absolute top-4 right-6 text-[10px] font-black font-mono text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
}
