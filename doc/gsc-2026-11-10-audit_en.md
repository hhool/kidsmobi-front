# GSC Page-Data Processing & Site Application — 2026-11-10

> Scope: `balancebiketoddler.com` only. Source data: the committed GSC exports in `doc/`
> (latest: `gsc-2026-10-21-stable-track-r14`, `gsc-indexing-simulation-2026-10-27`,
> `gsc-phase-a-checklist`, `gsc-manual-actions-2026-10-21`, `gsc-coverage-2026-10-19`).
> Method: process the exports → re-verify every flagged item against the **live** site.

## TL;DR

- **No new code-side defects.** Every technical issue previously flagged in GSC is now
  fixed and verified live: breadcrumb JSON-LD dedup, `/guides` hub title,
  `/transparency/testing_methodology` 301, the favicon raster set, and the 6 primary-term
  hubs (all 200 + self-canonical).
- **One owner action is now required because of the 11-10 sitemap change:** the sitemap URL
  set shrank **441 → 288** (all product-detail pages removed per the operator's instruction).
  Google must be told via a **sitemap re-submit / refresh in GSC**, or it will keep expecting
  the removed URLs.
- **Could not pull fresh live GSC data:** the provided "webmaster api key" alone cannot
  authenticate the Search Console API (OAuth required, none stored in the repo), and
  OpenPageRank is IP-locked from this environment (`403: key set to another IP`). Both are
  noted under §5 with how to enable them.

## 1. GSC export findings → applied to site → live status

| GSC-flagged item | Required fix | Status (live, 2026-11-10) |
|---|---|---|
| Duplicate Breadcrumb JSON-LD (~20/21 pages) | Reconcile 3 emission sources → 1 | ✅ Fixed & verified — 1 `BreadcrumbList`/page, no dup |
| `/guides` hub title mismatch ("How to Choose a Baby Stroller…") | Correct prerender title | ✅ Fixed — title now "Balance Bike Guides: Age, Size & Budget" |
| `/transparency/testing_methodology` (underscore) 404 | 301 → `/transparency/testing-methodology/` | ✅ Fixed & verified (308 → 200) |
| Grey-globe favicon (only SVG declared; `/favicon.ico` 404) | Add ICO + PNG (48/96/144/192/512) + manifest | ✅ Shipped 10-27 & verified (all 200, correct MIME) |
| 16 wagon/playard URLs were 301s (Worker resolver drift) | Resolver fix → stable under `/products/kids-tricycles/` | ✅ 200, stable (now **out of sitemap** per 11-10 rule) |
| 6 primary-term hubs not yet indexed | Internal-link weighting + Request indexing | ⚠️ Live 200 + self-canonical; **Request indexing is a manual GSC action** |
| Sitemap URL set changed (retired/added URLs) | Rebuild + re-submit in GSC | ⚠️ Rebuilt to 288 (11-10); **re-submit pending (manual)** |

## 2. Live re-verification (2026-11-10)

- **6 primary-term hubs** — 6/6 return **200** with a **self-referencing canonical**:
  `best-balance-bike-2026`, `best-double-stroller-2026`, `best-jogger-stroller-2026`,
  `best-travel-stroller-2026`, `best-electric-car-for-kids-2026`, `toddler-electric-car`.
- **wagon/playard cluster** (20 URLs) — **200**, but **NOT in the sitemap**. Expected:
  they are product-detail pages, removed from `sitemap.xml` on 11-10 per the operator's
  instruction. They remain crawlable via internal links; only the sitemap entry is gone.
- **Favicon assets** — `favicon.ico` (image/x-icon), `favicon-48/96/144/192/512x192.png`
  (image/png), `apple-touch-icon.png`, `site.webmanifest` (application/manifest+json) all
  **200** with correct MIME. (Two transient `000`s on first probe resolved to 200 on retry;
  an earlier apparent 404 was a wrong-path test — the real files use the `x192` format.)
- **Breadcrumb JSON-LD** — 1 node per page, no duplicate.
- **Sitemap** — **288 URLs**, **0 product-detail** pages; all 6 category hubs present.

## 3. Problems & fixes

### 3.1 Code-side (all resolved — nothing to change)
The three historical "fix" items from the exports are confirmed fixed in code and verified
live. No edits were made this run; the site is technically clean.

### 3.2 Triggered by the 11-10 sitemap change (needs owner action, not a code bug)
The operator's 11-10 instruction ("do not put specific product pages in sitemap.xml") dropped
all `/products/<dir>/<id>` URLs. Combined with prior cleanups this took the sitemap from
**441 → 288** (−153). This is correct per the instruction, but it means Google still holds a
stale sitemap count and expects URLs that no longer appear. The only remedy is a GSC
re-submit/refresh (§4.1). Note this also removed the 20 wagon/playard URLs that
`gsc-phase-a-checklist` §5 wanted *in* the sitemap to confirm the P1 fix — the operator's
later rule intentionally overrides that; the URLs stay 200 and crawlable.

## 4. Manual GSC actions required (owner, inside Search Console)

1. **Re-submit / Refresh `sitemap.xml` (CRITICAL).** GSC → Indexing › Sitemaps → on the
   existing `sitemap.xml` entry, ⋯ → **Refresh** (or delete + re-add). The live file is now
   288 URLs; this signals the URL-set shrink to Google.
2. **Validate the Breadcrumb fix.** Indexing › Pages → Breadcrumbs issue → confirm no
   duplicate sample URLs → **Validate fix**. (Code fix is live; the report clears only on
   validation.)
3. **Request indexing.** Paste + Request indexing for: the **home page** (drives the favicon
   recrawl) and the **6 primary-term hubs** listed in §2. Do not re-submit pages already
   indexed — saves quota.
4. **Confirm the wagon/playard cluster** now shows **Valid** (not "Page with redirect") in
   Page indexing.

## 5. What I could not do (and how to enable)

- **Live GSC API pull.** The Search Console API requires OAuth (a refresh token for
  `hhool.student@gmail.com`). The provided "webmaster api key" is insufficient on its own.
  To enable: provide a GSC OAuth client ID/secret + a refresh token, or a service-account
  JSON with property access. Then I can pull real Coverage / Performance / URL-Inspection data.
- **OpenPageRank backlink/authority metrics.** The key is IP-locked
  (`403: This free API key is set to another IP address`); this sandbox connects from a
  different IP. Run it from the whitelisted IP, or re-bind the key in
  `keywordseverywhere.com/account/openpagerank`.

## 6. Out of scope (credentials received but not used)

Per the default adopted (balancebiketoddler.com / kidsmobi only), the following were **not
touched**: `soundbuttons.cc` / `soundbuttons.click` credentials (NameCheap, Resend, Google
OAuth client secret, that project's OpenPageRank keys), the GitHub PAT, the R2 S3
access/secret keys, and the Cloudflare account-zone token (already used earlier only for the
11-10 Worker deploy). No secret was written to memory or `.env`.

---
*Generated 2026-11-10 by processing the committed GSC exports and re-verifying live. Live
GSC-side actions (§4) require the site owner's login.*
