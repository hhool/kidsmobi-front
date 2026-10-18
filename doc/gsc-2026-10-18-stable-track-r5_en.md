# Indexing Check & "stable track" Migration Review — 2026-10-18, Run 5 (r5)

> Related: `doc/gsc-2026-10-18-stable-track_en.md` (runs 1-2), `doc/gsc-2026-10-18-stable-track-r3_en.md` (run 3), `doc/gsc-2026-10-18-stable-track-r4_en.md` (run 4), `doc/gsc-coverage-2026-10-18-analysis_en.md` (parallel-session GSC Coverage deep-dive)
> Nature: read-only verification + documentation. No site code modified.
> Run window: 2026-10-18 22:38-22:55 (GMT+8). Fifth automated run of the day; conclusions are incremental over the documents above.

## 0. Executive Summary

| Check | Result |
|---|---|
| `/balance-bike-budget/` live state | ✅ 200, `index,follow,max-image-preview:large`, self-canonical, correct title |
| `/balance-bike-stability/` live state | ✅ 200, `index,follow,max-image-preview:large`, self-canonical, correct title |
| Both pages indexed? | ❌ Still unconfirmed, most likely NOT indexed. Bing `site:` on both paths again yields no usable signal (budget → mermaid.live canned spam = network tampering; stability → well-formed no-results page). Best Google-side evidence remains the 10-12-cutoff Coverage export (14/271 indexed, 26-day plateau); both pages submitted 10-15, earliest visible effect 10-19~24 |
| sitemap.xml | ✅ 200 + `application/xml` + **247 URLs** + **247/247 with `<priority>`** (distribution identical to dist, URL-set diff 0) + both new pages + max lastmod 2026-10-16T12:22:46.520Z → **no Worker interception recurrence, no edge staleness** (5th consecutive all-green run) |
| `npm run seo:health` | ✅ **100/100** (15/15 pass, 31s) — r4's transient network-flake WARN did not reproduce; back to full green |
| **Pruned-listing 301s** | 🆕✅ **Now live**: **23/23** retired listing URLs return 301 to their survivors (slash and no-slash forms both covered) — the top pending site-side to-do (backend `7a4f4db` + front `57b64e9`) has been deployed |
| stable-track landing-page migration | ⏳ Unconfirmed and still mechanistically blocked (stability page not indexed → cannot be the landing page); the 10-15 baseline (`/` + `/products/balance-bikes/`) presumably still holds. Await a GSC Performance export (10-19~24) |
| GSC validation status | ➖ No new screenshot/export; carries over r3: redirect group (4) = **Started** (the 10-16 re-VALIDATE FIX was accepted by Google); canonical group (9) = **still Failed** |

## 1. Indexing Check (Bing first)

| Channel | Query | Result | Usable? |
|---|---|---|---|
| WebSearch | `site:…/balance-bike-budget/` | 5 off-site balance-bike articles (peggyomara, trekbikesblog, pookapages, adorablyperfect), none from this site | ❌ `site:` operator ignored (same as all prior runs) |
| WebSearch | `site:…/balance-bike-stability/` | 5 off-site articles (smallsmart, bisiklopedi, portcycling, bebeluxbaby) | ❌ Same |
| Bing (WebFetch) | `site:…/balance-bike-budget/` | Returned **mermaid.live** flow-chart editor results (3), unrelated to the query | ❌ Network-layer tampering (canned content), control void |
| Bing (WebFetch) | `site:…/balance-bike-stability/` | **Well-formed localized "no results" page** (ru locale this run) | ⚠️ See interpretation |
| Bing control ① (whole domain) | `site:balancebiketoddler.com` | 10 real results: home, /about, /products, /reviews + 5 product detail pages | ✅ **Site IS in Bing's index** |
| Bing control ② (old page, size-chart) | `site:…/balance-bike-size-chart/` | Returned Zhihu hip-hop threads (8), completely unrelated | ❌ Network tampering, control void |

**Interpretation:**

- The whole-domain control again proves the site is in Bing's index. The stability path returned a clean no-results page; the budget path was polluted by canned content. Consistent with all prior runs: **no verdict (indexed / not indexed) can be drawn for either new path from this sandbox**; `site:` output is not evidence (known environment constraint).
- No `/balance-bike-*` asset page appears in the whole-domain top 10 (budget / stability / size-chart all absent) — compatible with "asset pages not yet in Bing's index", but a top-10 absence is not proof.
- **Previous-owner spam URLs still indexed (5th consecutive observation today)**: `/panties/fashion-models-directory.php`, `/spanking/hardman-cnn-models.php` still sit at positions 5-6 of the whole-domain control. Both 404 live and will decay naturally; optional acceleration: Bing Webmaster Tools removal request (user side, ~1 min).
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
| Contains `<priority>` | yes | **247/247** (0.4×159 / 0.6×77 / 0.8×1 / 0.9×9 / 1.0×1 — value-for-value identical to dist) | ✅ backend fix `f2046bf` still holding (4th consecutive run confirming) |
| Not JSON / not 404 / not the 260-URL legacy format | — | Max lastmod = **2026-10-16T12:22:46.520Z** (identical across 5 runs; no content deploy in between, as expected) | ✅ **No Worker interception recurrence, no edge staleness** |
| URL-set consistency vs. dist | aligned | `diff` = **0** | ✅ live sitemap and repo artifact fully aligned |

**Conclusion: all seven sitemap checks green, no alert needed.** The clean-path and priority fixes from 10-15/16 have held stable for 72+ hours online.

## 3. Health Check (optional, executed)

```
SCORE: 100/100  (pass 15, warn 0, fail 0 of 15)
```

robots.txt, sitemap.xml (247, delta 0), 15 key pages' metadata (incl. both new pages), llms.txt (1137B), 15 sampled internal links 0 broken — consistent with the 10-16 weekly report and all four earlier runs today. **r4's transient WARN (sandbox network flake → false-positive broken link) did not reproduce; no regression.**

## 4. 🆕 Pruned-Listing 301s: from "not deployed" to "23/23 live"

The most significant status change this run — it closes the top pending site-side to-do recorded in r3/r4:

- **Background chain**: backend `7a4f4db` (Worker 301 routes) had been measured as NOT deployed in r3/r4 (sample `balance_bike-b0bkxshhnp` still 404). Today at 22:30 the front-end commit `57b64e9` fixed two defects in `sync_prune_map_to_worker.mjs`: ① the block-replacement logic swallowed its own first `[[routes]]` entry, so every re-run duplicated all 23 routes (Cloudflare error 10020 at `wrangler deploy`, aborting the route sync); ② Cloudflare route patterns do not normalize trailing slashes, so the slash form fell through to Pages and 404'd. The commit also makes `prerender-pages.ts` emit the same trailing-slash rules into Pages `_redirects`.
- **Measured this run (from 22:38)**: curled every one of the 23 retired URLs (stage1: 18 + stage2: 5) — **23/23 return 301 pointing at their respective survivors**, across strollers, kids bikes, balance bikes, and ride-on cars; survivors re-checked 200.
  - Sample: `/products/balance-bikes/balance_bike-b0bkxshhnp/` → 301 → `…/balance_bike-b0blmf98s8/` (200); the no-slash form also 301s.
  - An initial pass showed 1×404, traced to a local category-path mapping slip (that row's category is `electric_car`, whose old advertised path segment is `electric_vehicles`); re-testing the true path `/products/electric_vehicles/electric_vehicles-b0db4wxz36/` → **301 → survivor (200)**. Nothing is missed in production.
- **Why it matters**: ① these URLs sat in the sitemap for 3 weeks; every 404 burned discovery equity — now stopped; ② with the 301s serving correctly, the GSC "Page with redirect" (4) group's Started validation now has proper server-side backing and should flip to Passed on the next Coverage export; ③ the deployment item can be closed from the r3/r4 to-do list.

## 5. stable-track Migration (no new GSC export)

- Checked `doc/` and `doc/gsc-coverage-2026-10-18-export/` during the run: **no new files** (`find doc -newermt "2026-10-18 22:35"` empty).
- No new evidence, so r3 conclusions carry over: **unconfirmed and mechanistically blocked** — an unindexed stability page cannot be selected as the landing page for "stable track"; the 10-15 baseline (`/` + `/products/balance-bikes/`) presumably still holds. A Performance export (Query contains `stable track` → PAGES tab) on 10-19~24 will settle it.

## 6. GSC Page Indexing Background (known as of 2026-10-16, not re-queried)

- **Benign, no action**: "Alternate page with proper canonical tag" (9) and "Page with redirect" (4) — currency / www / underscore / guide variants already correctly canonicalized or 301-deduplicated (behavior verified live on 10-13).
- **Only remaining watch item**: "Validation failed (10/11→10/13)" — r3 confirmed the redirect group's re-validation is **Started**; canonical still Failed. If the user provides a new screenshot/export: confirm the redirect group flips to Passed; if the canonical group still fails, prompt them to click VALIDATE FIX once more, or expand the row and paste the 9 URLs for pattern identification.
- Also: the `/auth/` noindex row (cookie-modal dead link, fixed by front `95b755f`) re-verified still 404 — the modal now points to `/transparency/privacy-policy/` (200), so the exclusion row will clear on Google's next crawl.

## 7. Recommended Next Steps (by priority)

1. **10-19~24**: GSC URL Inspection on both new pages; export Performance (Query contains `stable track` → PAGES) to verify the landing-page migration; on the next Coverage export check: ① indexed 14 → 15/16 (submissions taking effect) ② redirect validation Started → Passed ③ canonical group still Failed?
2. **Backlink building (the only real lever)**: the diagnostic chain (26-day plateau + 94% Discovered-not-indexed + zero backlinks) shows submission-type actions cannot move the indexing ceiling before external demand signals appear. With the pruned 301s now live, the site owes no further outbound-signal debt.
3. **Canonical group still Failed**: user copies the 9 URLs from GSC for pattern analysis; leaving it only means the benign rows persist.
4. **(Optional) Bing Webmaster Tools removal** of the two previous-owner spam URLs (still indexed on the 5th consecutive run today; will decay naturally anyway).
5. **(Optional) Health-script tweak**: `internal-links` counts any `fetch failed` as broken; consider distinguishing connection errors from HTTP 4xx/5xx (retry once before counting) to avoid score noise from network hiccups (caused one false 100→97 drop in r4; not reproduced this run).

## 8. Run Evidence (methods & raw data)

- Sitemap: `curl -s --noproxy '*' -w "HTTP:%{http_code} CT:%{content_type} SIZE:%{size_download}" https://balancebiketoddler.com/sitemap.xml` → 200 / `application/xml; charset=utf-8` / 39888 bytes; `grep -o '<loc>' | wc -l` = 247; `grep -o '<priority>' | wc -l` = 247; max lastmod = 2026-10-16T12:22:46.520Z (identical across 5 runs); priority distribution value-for-value identical to `dist/sitemap.xml`, URL-set diff = 0.
- Both pages: curl direct → 200 / `index,follow,max-image-preview:large` / self-canonical; budget title "Budget Balance Bike: Cheap Picks That Last", stability title "Stable Track Balance Bike: Track Width".
- Bing: WebFetch on `www.bing.com/search?q=site:…` ×4 (budget / stability / whole-domain control / old-page control).
- Health check: `npm run seo:health` ×1 → 100/100 (15/15, 31s).
- Pruned 301s: 23 URLs generated from `doc/stage1-prune-report.json` (18) + `doc/stage2-variant-report.json` (5), each curled for status + Location → 23/23 = 301; survivors re-checked 200.
- IndexNow snapshot `scripts/seo/.last-indexnow.json`: updatedAt 2026-10-15T16:18:44.835Z unchanged, 247 URLs incl. both new pages; live key file `dfb12ac97ad4a34c75ccf6cc4b783c7f.txt` → 200.
- GSC exports: none new (`find doc -newermt "2026-10-18 22:35"` empty).
- Site side: **zero changes this run** — the 301 deployment (front `57b64e9` + backend deploy) landed before this run; this run only measured.
