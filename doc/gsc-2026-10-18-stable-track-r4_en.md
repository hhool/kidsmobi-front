# Indexing Check & "stable track" Migration Review — 2026-10-18, Run 4 (r4)

> Related: `doc/gsc-2026-10-18-stable-track_en.md` (runs 1-2), `doc/gsc-2026-10-18-stable-track-r3_en.md` (run 3), `doc/gsc-coverage-2026-10-18-analysis_en.md` (parallel-session GSC Coverage deep-dive)
> Nature: read-only verification + documentation. No site code modified.
> Run time: 2026-10-18 22:26-22:35 (GMT+8). Fourth automated check of the day; conclusions are incremental over the documents above.

## 0. Executive Summary

| Check | Result |
|---|---|
| `/balance-bike-budget/` live state | ✅ 200, `index,follow`, self-canonical |
| `/balance-bike-stability/` live state | ✅ 200, `index,follow`, self-canonical, H1 contains "stable track balance bike" |
| Both pages indexed? | ❌ Not confirmed, most likely NOT indexed. Bing `site:` on both paths still yields no usable signal (operator/network tampering, §1); no new GSC export, so the 10-12-cutoff evidence (14/271 indexed, 26-day plateau, §4) still stands |
| sitemap.xml | ✅ 200 + `application/xml` + **247 URLs** + **247/247 with `<priority>`** + both new pages + max lastmod 2026-10-16T12:22:46.520Z (identical to the previous three runs) → **no Worker interception recurrence, no edge staleness** |
| `npm run seo:health` | ⚠️ **97/100** (14 pass / 1 warn / 0 fail): new `internal-links: sampled 15, broken=1`. **Traced to transient sandbox network flakiness (false positive)**: node fetch intermittently failed on 2 JS assets; 3/3 retries via node HEAD and all curl GET/HEAD calls returned 200 — no real broken link (§3) |
| stable-track landing-page migration | ⏳ Unconfirmed and still mechanistically blocked (stability page not indexed → cannot be the landing page); the 10-15 baseline (`/` + `/products/balance-bikes/`) presumably still holds. Await a GSC Performance export (10-19~24) |
| GSC validation status | ➖ No new screenshot/export; carries over r3 evidence: redirect group (4) = **Started** (the 10-16 re-VALIDATE FIX was accepted), canonical group (9) = **still Failed** |

## 1. Indexing Check (Bing first)

| Channel | Query | Result | Usable? |
|---|---|---|---|
| WebSearch | `site:…/balance-bike-budget/` | 5 off-site balance-bike articles (peggyomara, trekbikesblog, pookapages, adorablyperfect), none from this site | ❌ `site:` operator ignored (same as before) |
| WebSearch | `site:…/balance-bike-stability/` | 5 off-site articles (smallsmart, bisiklopedi, portcycling, bebeluxbaby) | ❌ Same |
| Bing (WebFetch) | `site:…/balance-bike-budget/` | Returned **mermaid.live** flow-chart editor results (3), completely unrelated to the query | ❌ Network-layer tampering (canned content), control void |
| Bing (WebFetch) | `site:…/balance-bike-stability/` | **Well-formed localized "no results" page** (ru locale) | ⚠️ See interpretation |
| Bing control (whole domain) | `site:balancebiketoddler.com` | 10 real results: home, /about, /products, /reviews + 3 product detail pages | ✅ **Site IS in Bing's index** |

**Interpretation:**

- The whole-domain control again proves the site is in Bing's index. The stability path returned a clean no-results page; the budget path was polluted by canned content. Consistent with prior runs: **no verdict (indexed / not indexed) can be drawn for either new path from this sandbox**; `site:` output is not evidence (known constraint, §1.1).
- No `/balance-bike-*` asset page appears in the whole-domain top 10 (budget/stability/size-chart all absent) — compatible with "asset pages not yet indexed by Bing", but a top-10 absence is not proof.
- **Previous-owner spam URLs still indexed (day 6):** `/panties/fashion-models-directory.php`, `/spanking/hardman-cnn-models.php` appear at positions 5-6 of the whole-domain control. Both 404 live and will decay naturally; optional acceleration: submit removal in Bing Webmaster Tools (user side, ~1 min).
- The authoritative Google-side signal remains the 10-12-cutoff Coverage export (14/271 indexed, 26-day plateau): both pages submitted 10-15, **most likely not yet indexed**; earliest visible effect 10-19~24.

## 2. Sitemap Self-Check

Fetched via `curl -s --noproxy '*' https://balancebiketoddler.com/sitemap.xml` (no query, no cache-buster — the exact path Google crawls).

| Check | Expected | Measured | Verdict |
|---|---|---|---|
| HTTP status | 200 | 200 | ✅ |
| Content-Type | application/xml | `application/xml; charset=utf-8` | ✅ |
| URL count | 247 | **247** (delta 0) | ✅ |
| Contains balance-bike-budget | yes | yes | ✅ |
| Contains balance-bike-stability | yes | yes | ✅ |
| Contains `<priority>` | yes | **247/247** | ✅ backend fix `f2046bf` still holding (3rd consecutive run) |
| Not JSON / not 404 / not the 260-URL legacy format | — | Max lastmod = **2026-10-16T12:22:46.520Z** (identical to the previous three runs; no new content deploy in between, as expected) | ✅ **No Worker interception recurrence, no edge staleness** |

**Conclusion: all six sitemap checks green, no alert needed.** The clean-path and priority fixes from 10-15/16 have held stable for 72+ hours online.

## 3. Health Check (optional, executed, with anomaly triage)

```
SCORE: 97/100  (pass 14, warn 1, fail 0 of 15)
[WARN] internal-links: sampled 15, broken=1
```

**Triage (important — avoid mistaking this for a site regression):**

1. Replicated the script's sampling logic with node fetch (first 15 unique internal hrefs on the homepage): `/assets/guides-data-D6s27-Ak.js` and `/assets/firebase-vendor-z4G4rKeM.js` threw `TypeError: fetch failed`.
2. curl GET on both assets: **200** (16947B / 165525B); curl HEAD ×3: **all 200**.
3. node fetch HEAD retried 3× on each asset: **all 200**.
4. Verdict: `fetch failed` is a **connection-layer transient error** (sandbox network hiccup / TLS reset), not a real broken link. The script counts any such error as broken, so the 100 → 97 drop is **measurement noise, not a site regression**. All other 14 checks (robots, sitemap 247, 11 key-page metadata including both new pages, llms.txt 1137B) pass as before.

## 4. GSC Data (no new export this run)

- Inspected `doc/` and `doc/gsc-coverage-2026-10-18-export/` during the run: **no new files** (latest change still the 10-18 21:30 Coverage export, already analyzed in r3).
- Therefore neither the stable-track migration nor validation status has new evidence; r3 conclusions carry over:
  - **Migration unconfirmed**: stability page not indexed → mechanistically cannot be the "stable track" landing page; the 10-15 baseline (`/` + `/products/balance-bikes/`) presumably still holds. A Performance export (Query contains `stable track` → PAGES tab) on 10-19~24 will settle it.
  - **Validation**: redirect group (4) = Started (the 10-16 re-VALIDATE FIX was accepted by Google); canonical group (9) = still Failed; benign background unchanged.

## 5. GSC Page Indexing Background (known as of 2026-10-16, not re-checked)

- **Benign, no action**: "Alternate page with proper canonical tag" (9) and "Page with redirect" (4) — currency / www / underscore / guide variants are already correctly canonicalized or 301-deduplicated.
- **Only remaining watch item**: "Validation failed (10/11→10/13)" — r3 confirmed the redirect group's re-validation is **Started**; the canonical group is still Failed. If the user provides a new screenshot/export, confirm whether it flips to Passed; if not, prompt them to click VALIDATE FIX once more or expand the row and paste the 9 URLs for pattern identification.

## 6. Recommended Next Steps (by priority)

1. **10-19~24**: GSC URL Inspection on both pages; export Performance (Query contains `stable track` → PAGES) to verify the landing-page migration; on the next Coverage export check: indexed 14 → 15/16, redirect Validation → Passed, canonical still Failed?
2. **Deploy backend `7a4f4db`** (301s for 23 pruned listing URLs) — the only pending site-side fix (r3 verified still not deployed; `balance_bike-b0bkxshhnp` still 404). These 404 URLs have been advertised in the sitemap for 3 weeks.
3. **Backlink building** (the only real lever): the diagnostic chain (26-day plateau + 94% Discovered-not-indexed + zero backlinks) shows submission-type actions cannot move the indexing ceiling without external demand signals.
4. **(Optional) Bing Webmaster Tools removal** of the two previous-owner spam URLs (day 6 in the index; will decay naturally anyway).
5. **(Optional) Health-script tweak**: `internal-links` counts any `fetch failed` as broken; consider distinguishing connection errors from HTTP 4xx/5xx (retry once before counting) to avoid score noise from network hiccups.

## 7. Run Evidence (methods & raw data)

- Sitemap: `curl -s --noproxy '*' -w "HTTP:%{http_code} CT:%{content_type} SIZE:%{size_download}" https://balancebiketoddler.com/sitemap.xml` → 200 / `application/xml; charset=utf-8` / 39888 bytes; `grep -o '<loc>' | wc -l` = 247; `grep -o '<priority>' | wc -l` = 247; max lastmod = 2026-10-16T12:22:46.520Z (tied across three runs).
- Both pages: curl direct → 200 / `index,follow,max-image-preview:large` / self-canonical; stability H1 = "What makes a stable track balance bike — and why nobody publishes the number".
- Bing: WebFetch on `www.bing.com/search?q=site:…` ×3 (budget / stability / whole-domain control).
- Health check: `npm run seo:health` ×2 (both 97/100, WARN reproduced); triage via `/tmp/linkcheck.mjs` (replicated sampling) + curl retries; conclusion: transient network error.
- IndexNow snapshot `scripts/seo/.last-indexnow.json`: updatedAt 2026-10-15T16:18:44.835Z unchanged; both new pages within the 247 URLs.
- GSC exports: none new (`find doc -newermt "2026-10-18 21:45"` empty).
- Site side: **zero changes** this run.
