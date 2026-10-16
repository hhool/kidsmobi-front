interface ProductDetailSkeletonProps {
  lang?: "zh" | "en";
}

/**
 * Full-height skeleton for the product_detail route.
 *
 * Rendered while CMS data is still resolving (selectedProduct === null) and as
 * the Suspense fallback for the lazy DetailedProductView chunk. Its height is
 * deliberately tall (>= first viewport) so the footer sits below the fold from
 * the first paint; when the real content mounts, nothing visible in the
 * viewport moves and the footer shift happens off-screen. This collapses the
 * 3-wave render (80px -> 400px -> full) that produced CLS 0.554 on detail pages.
 *
 * The top structure mirrors DetailedProductView's above-the-fold layout
 * (breadcrumb / media 400px / title+CTA column) to keep replacement shifts
 * minimal.
 */
export default function ProductDetailSkeleton({ lang = "en" }: ProductDetailSkeletonProps) {
  const loadingLabel = lang === "zh" ? "正在加载评测内容…" : "Loading review content…";

  return (
    <div aria-busy="true" aria-live="polite" className="space-y-8">
      <p className="sr-only">{loadingLabel}</p>

      {/* Breadcrumb row */}
      <div className="flex items-center gap-2" aria-hidden="true">
        <div className="h-4 w-24 rounded bg-slate-100 animate-pulse" />
        <div className="h-4 w-4 rounded bg-slate-100 animate-pulse" />
        <div className="h-4 w-40 rounded bg-slate-100 animate-pulse" />
      </div>

      {/* Above-the-fold grid: media + info column */}
      <div className="grid gap-8 lg:grid-cols-2">
        <div
          aria-hidden="true"
          className="relative h-[400px] w-full rounded-3xl border border-slate-100 bg-slate-100 animate-pulse"
        />
        <div aria-hidden="true" className="space-y-5">
          <div className="h-5 w-28 rounded bg-orange-100 animate-pulse" />
          <div className="h-9 w-full rounded bg-slate-100 animate-pulse" />
          <div className="h-9 w-3/4 rounded bg-slate-100 animate-pulse" />
          <div className="flex items-center gap-3">
            <div className="h-5 w-32 rounded bg-slate-100 animate-pulse" />
            <div className="h-5 w-24 rounded bg-slate-100 animate-pulse" />
          </div>
          <div className="h-10 w-44 rounded bg-slate-100 animate-pulse" />
          <div className="flex gap-3 pt-2">
            <div className="h-12 w-44 rounded-full bg-orange-100 animate-pulse" />
            <div className="h-12 w-36 rounded-full bg-slate-100 animate-pulse" />
          </div>
          <div className="grid grid-cols-2 gap-3 pt-4 sm:grid-cols-4">
            <div className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
            <div className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
            <div className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
            <div className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Below-the-fold section cards keep total height well past the viewport
          so the footer never enters the viewport while loading. */}
      <div aria-hidden="true" className="space-y-6">
        {[0, 1, 2].map((block) => (
          <div key={block} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="h-6 w-52 rounded bg-slate-100 animate-pulse" />
            <div className="mt-4 space-y-3">
              <div className="h-4 w-full rounded bg-slate-50 animate-pulse" />
              <div className="h-4 w-11/12 rounded bg-slate-50 animate-pulse" />
              <div className="h-4 w-4/5 rounded bg-slate-50 animate-pulse" />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="h-24 rounded-2xl bg-slate-50 animate-pulse" />
              <div className="h-24 rounded-2xl bg-slate-50 animate-pulse" />
              <div className="h-24 rounded-2xl bg-slate-50 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
