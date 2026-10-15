# The "stable track" query: who owns it, and the fix

## Background
The 2026-10-13 GSC analysis left one action open: confirm which URL actually carries `stable track`, the
only query theme this domain ranks inside the top 20 for. The 2026-10-15 GSC screenshot (Performance →
query contains `stable track` → **PAGES** tab, last 24 hours) answers it.

## Evidence

| Page | Clicks | Impressions |
|---|---|---|
| `https://balancebiketoddler.com/` | 0 | 1 |
| `https://balancebiketoddler.com/products/balance-bikes/` | 0 | 5 |

"1-2 of 2" — these two are the **only** pages carrying the query. The dedicated asset
`/balance-bike-stability/` does **not** appear at all.

## Conclusion
This is not cannibalisation (no two pages competing on the same theme). It is the opposite: the
**dedicated asset is not being recognised**. Generic pages (homepage + category hub) are absorbing the
query while the page built to answer it is not ranking.

## The three concrete gaps, and the fixes

### 1. The asset's `<title>` / `<h1>` never contained the exact phrase
- The source title was 74 chars and got truncated by `capSeoTitle()` into
  `Balance Bike Stability: Track Width, Wheel | BalanceBikeToddler` (cut mid-phrase at "Wheel").
- Changed to `Stable Track Balance Bike: Track Width` (59 chars including the brand suffix — no truncation).
- H1 changed from "What makes a balance bike stable — …" to
  "What makes a **stable track balance bike** — …".

### 2. The internal-link anchor was generic
- Was "Stability and track width" (duplicated in prerender `REFERENCE_ASSETS` and React `ReferenceClusterNav`).
- Both changed to the exact anchor **"Stable track balance bike"** (that cluster link appears on the 7 asset
  pages, balance-bike detail pages, and the hub).
- The **site-wide footer anchor is deliberately left generic** (`Stability & track width`) to avoid
  site-wide exact-match over-optimisation.

### 3. ⚠️ The most serious one: the hub's link is erased on hydration
- The hub's static HTML **does** contain the link (`clusterNavHtml()` is written into the hub body).
- But the SPA's hub branch (`activeTab === "products"` in `App.tsx`) **never renders** `ReferenceClusterNav`.
- The app entry uses `createRoot().render()` (**not** `hydrateRoot`), so hydration **wipes and rebuilds**
  the prerendered DOM inside `#root`.
- Net effect: after Google renders the JS, the hub's in-content link to the asset **disappears**, leaving
  only the site-wide footer link (a weak signal).
- Fix: render `<ReferenceClusterNav lang={lang} />` in the SPA hub branch so it matches the prerender output.

## Verification
- `npm run lint` clean.
- `seo:check` (exit 0), `check:titles` (247 pages, no truncation/dangling), `check:spatitles`
  (14 pages, SPA and prerender agree), `check:spakeywords` (247 pages, 0 missing / 0 mismatched) all pass.
- Build baseline normal: 3 guide + 4 news + 31 review detail pages, `sitemap.xml` 246 URLs.
- Verified in `dist`: the asset `<title>` / `<h1>` contain the exact phrase; the hub's in-content anchor
  reads `Stable track balance bike`.

## Optional follow-ups
- The homepage currently links the asset from the footer only; if it keeps absorbing the query, add an
  in-content link there too.
- At the next GSC review (2026-11-15), re-check **PAGES + Query contains `stable track`** to see whether the
  carrier has moved from the hub to the asset; if it is still stuck on the hub, replace the hub's stability
  paragraph with a summary that links out to the asset.
