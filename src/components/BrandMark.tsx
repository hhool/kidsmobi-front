/**
 * The brand mark, drawn inline instead of loaded as an image.
 *
 * This used to be `<img src="/favicon.svg" width={32} height={32}>`. Three
 * reasons it is not:
 *
 * 1. It was a second request for a file the browser already has as the tab
 *    icon, and React 19's server renderer emitted a `<link rel=preload>` for
 *    it, so the head promised a fetch the first paint had to wait behind.
 * 2. An `<img>` whose src is the favicon is counted as a content image by
 *    every image rule. The homepage's parity gate compares the SPA against
 *    the delivered document, and the document inlines this mark - so the two
 *    halves disagreed by one image (27 vs 26) and the gate failed. Drawing it
 *    in both halves is what makes them the same page.
 * 3. At 32 px the mark is a rounded square with four circles and two paths;
 *    the bytes are smaller inline than the round trip.
 *
 * The geometry is copied from public/favicon.svg, which stays the source for
 * the tab icon. `scripts/build-static-home.mjs` used to substitute this
 * markup into the delivered document after the fact; it now finds no `<img>`
 * to replace, which is the point - there is one implementation, not two.
 *
 * The gradient id carries a `bbt-mark-` prefix because it ends up in the same
 * document as the rest of the page, and a bare `id="bg"` is a name collision
 * waiting to happen.
 */
export default function BrandMark({ className = "w-8 h-8" }: { className?: string }) {
  // The footer puts this mark in `flex items-center gap-2` next to a 173 px
  // wordmark. Without shrink-0 the flex algorithm squeezes the SVG to width 0
  // (measured 0 x 32 on both local and live, 2026-11-08), so the brand icon
  // silently disappeared while the wordmark stayed put. The certification
  // badges already carry shrink-0 for the same reason.
  return (
    <svg
      viewBox="0 0 256 256"
      width={32}
      height={32}
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id="bbt-mark-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF9A2F" />
          <stop offset="100%" stopColor="#F45B2A" />
        </linearGradient>
      </defs>

      <rect x="12" y="12" width="232" height="232" rx="52" fill="url(#bbt-mark-bg)" />

      <circle cx="82" cy="170" r="24" fill="#1F2937" opacity="0.96" />
      <circle cx="174" cy="170" r="24" fill="#1F2937" opacity="0.96" />
      <circle cx="82" cy="170" r="9" fill="#FFF7EE" />
      <circle cx="174" cy="170" r="9" fill="#FFF7EE" />

      <path
        d="M70 74h46c25 0 41 12 41 33 0 15-9 25-22 30 16 4 27 15 27 32 0 23-19 40-47 40H70V74zm25 21v30h18c14 0 22-5 22-15 0-10-8-15-22-15H95zm0 53v32h21c15 0 25-6 25-16 0-11-10-16-25-16H95z"
        fill="#FFF9F2"
      />

      <path d="M147 58l28 15-4 12-33-17 9-10z" fill="#FFF9F2" opacity="0.96" />
      <circle cx="149" cy="82" r="7" fill="#FFF9F2" opacity="0.96" />
    </svg>
  );
}
