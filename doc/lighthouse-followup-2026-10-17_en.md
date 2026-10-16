# Lighthouse Follow-up Fixes — 2026-10-17

Follow-up to `doc/lighthouse-audit-2026-10-16.html`. Fixes the two actionable
findings from that audit: detail-page CLS (0.554) and accessibility failures
(a11y 96–97).

## Results (local dist, Lighthouse 13.5.0)

| Page | a11y before | a11y after | CLS (detail) |
|---|---|---|---|
| Home `/` | 96 | **100** | — |
| Hub `/products/balance-bikes/` | 97 | **100** | — |
| Detail (b0ccy6yrs8) | 96 | **100** | **0.554 → 0.000** |

CLS verified independently with a CDP `PerformanceObserver` probe
(`tmp/lighthouse-2026-10-17/verify-final.mjs`): **zero layout-shift entries**
on the detail route. MAIN height now goes skeleton (1898px, footer below the
fold) → full content (6118px) with nothing visible moving.

## 1. Detail-page CLS — 3-wave render collapsed

Root cause (CDP probe, previous session): at t≈330ms the hydrated app rendered
an empty detail route (CMS data still loading, `selectedProduct === null`), so
`<main>` collapsed to its 80px padding with the footer inside the first
viewport; the footer was then pushed twice (80→400→5170) = CLS 0.554.

Fixes:

- **`src/components/ProductDetailSkeleton.tsx` (new)** — tall skeleton
  mirroring the detail top layout (breadcrumb / 400px media / title+CTA
  column / section cards). Rendered while `activeTab === "product_detail" &&
  !selectedProduct`, and used as the Suspense fallback for the lazy
  `DetailedProductView` chunk. The footer sits below the fold from the first
  paint, so later content mounts off-screen.
- **`src/components/ProductCarousel.tsx`** — empty state now reserves the
  400px carousel footprint (pulsing placeholder) instead of `return null`.

## 2. Accessibility 96/97/96 → 100/100/100

### 2a. The big one: unlayered `a { color: #ea580c }` in the prerender shell

`scripts/prerender-pages.ts` injected `<style> a { color: #ea580c; } </style>`
**without a cascade layer**. Unlayered styles beat every `@layer` rule, so
this single line overrode **every Tailwind `text-*` class on every `<a>`**
site-wide — anchors rendered #ea580c regardless of their classes. This is why
all remaining contrast failures were anchors whose source classes looked
correct.

Fix: the shell now declares `@layer theme, base, components, utilities;` up
front and moves the anchor color into `@layer utilities` — it still beats
preflight's `a { color: inherit }` (base layer) but loses to any `text-*`
class. `body` stays unlayered to preserve the exact current backdrop.

### 2b. Color token fixes

- **`src/index.css`** — `#primary_tab_viewport :is(.text-orange-500,
  .text-orange-600)` forced to `#c2410c` (orange-700, 5.2:1 on white, 4.9:1 on
  orange-50). Tailwind v4's oklch orange-500 (#ff6900) = 2.88:1 — far below
  the 4.5:1 required for small text. Dark heroes use `text-orange-400` and are
  unaffected; the one dark-section link on `text-orange-600`
  (EvaluationsSection CTA) was pinned to `text-orange-400`.
- **`text-slate-400` → `text-slate-600`** (Tailwind v4 slate-400 #90a1b9 =
  2.5–2.6:1) in the five light-surface components: `ProductsSection`,
  `DetailedProductView`, `HomeSection`, `Breadcrumbs`,
  `common/CategoryComparisonTable`, plus the `ProductCarousel` counter.
- **Header nav** (outside the CSS-override scope): active tab
  `text-orange-500` → `text-orange-700`.
- **Footer** (dark `bg-slate-900`): muted text lightened instead —
  `slate-500/600` → `slate-400`, currency value `text-orange-500` → `orange-400`.
- **Cookie modal**: Privacy Policy link → `text-orange-700`; ACCEPT button
  `bg-orange-500` → `bg-orange-700` (white on orange-500 = 2.88:1).
- **ProductsSection** active category filter: `bg-orange-500 text-white` →
  `bg-orange-700 text-white`.

### 2c. Structural a11y

- **`td-has-header`** (hub comparison table): `scope="col"` added to all
  `<th>`; the previously empty last column header got an sr-only
  "Actions / 操作" label (empty headers cannot associate cells).
- **`label-content-name-mismatch`**: the home FEATURED badge button's
  `aria-label` now includes the visible "FEATURED" text; the hub product-card
  `role="button"` dropped its override `aria-label` so the accessible name is
  derived from content (a concise label can never contain a rich card's full
  visible text).

## Verification

- Lighthouse a11y: home/hub/detail = **100/100/100**, `fails: []` on all three.
- CDP probe: detail CLS = **0.000**.
- Guards: `check:spatitles` OK (28 pages), `check:spakeywords` OK (248 pages,
  0 mismatch), `check:claims` 0 findings, `check:reviewcounts` 0 findings.
- Build baseline intact: sitemap 247 URLs, 174 detail pages, 3/4/31
  guide/news/review details.

Reusable tooling: `tmp/lighthouse-2026-10-17/{reaudit,verify-final}.mjs`.
