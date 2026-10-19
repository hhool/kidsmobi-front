# Indexing Check & "stable track" Landing-Page Migration Review — 2026-10-19 (r10, same-day repeat trigger)

> Related docs: `doc/gsc-2026-10-19-stable-track-r9_en.md` (previous run today 14:15), `doc/gsc-2026-10-19-stable-track-r8_en.md`, `doc/gsc-2026-10-19-stable-track-r7_en.md`, `doc/gsc-2026-10-19-stable-track_en.md`, `doc/gsc-2026-10-18-stable-track-r3/r4/r5_en.md`, `doc/spa-canonical-overwrite-2026-10-19_en.md`, `doc/gsc-coverage-2026-10-18-analysis_en.md`
> Nature: read-only verification + documentation. **No site code was modified.**
> Run window: 2026-10-19 16:22–16:30 (GMT+8); incremental to today's r6–r9.

## 0. Executive Summary

| Check | Result |
|---|---|
| `/balance-bike-budget/` live status | ✅ 200, `index,follow,max-image-preview:large`, self-canonical, title "Budget Balance Bike: Cheap Picks That Last" |
| `/balance-bike-stability/` live status | ✅ 200, `index,follow,max-image-preview:large`, self-canonical, title "Stable Track Balance Bike: Track Width" |
| Are the two pages indexed? | ❌ Still unconfirmable from authoritative channels; most likely **NOT indexed**. WebSearch `site:` operator ignored for the 10th consecutive time; **Bing budget path query returned a well-formed no-results page for the first time** (Polish locale, same class as stability's ru/zh/es in r4/r8/r9) — new-path no-results observations now total 4 across 4 distinct edge nodes with consistent semantics; evidence that **neither** new page is in Bing's index continues to strengthen. Bing stability path query was polluted this run (canned Chinese tax-site content), void. **Whole-domain control valid** (site in index, no `/balance-bike-*` asset pages). Google-side best evidence remains the 10-12 Coverage export (14/271 indexed, 26-day plateau). **GSC visibility window (10-19–24) in progress** |
| sitemap.xml | ✅ 200 + `application/xml; charset=utf-8` + **247 URLs** + **247/247 with `<priority>`** + both new pages + max lastmod 2026-10-16T12:22:46.520Z (10th consecutive identical run) → **no Worker interception recurrence, no edge staleness** |
| `npm run seo:health` | ✅ **100/100** (15/15 pass, 23s, sampled internal links broken=0) |
| stable-track landing-page migration | ⏳ Unconfirmed and still mechanistically blocked (the stability page itself is not indexed, so it cannot be the landing page); the 10-15 baseline (`/` + `/products/balance-bikes/`) is presumed to still hold. **Still no new GSC Performance export** (zero new files in `doc/` since 14:26) |
| GSC validation status | ➖ No new screenshot/export; carries over: redirect group (4) = **Started** (301 server-side backing in place); canonical group still Failed but **root-caused + fixed** (front `3f01510` deployed) → **do NOT re-run VALIDATE FIX**, self-heals on recrawl |
| Previous-owner spam URLs | ⚠️ Live: apex pair 404, www pair 301 → apex → 404 (final status unchanged, all four variants re-verified this run); still in Bing's index (day 10, confirmed by this run's valid control) |

## 1. Indexing Check (Bing first)

| Channel | Query | Result | Usable? |
|---|---|---|---|
| WebSearch | `site:balancebiketoddler.com/balance-bike-budget/` | 5 off-domain balance-bike articles (peggyomara ×2 / trekbikesblog / pookapages / adorablyperfect), 0 on-domain | ❌ `site:` operator ignored (known sandbox constraint, 10th consecutive confirmation; result set identical to r9) |
| WebSearch | `site:balancebiketoddler.com/balance-bike-stability/` | 5 off-domain articles (smallsmart ×2 / bisiklopedi / portcycling / bebeluxbaby), 0 on-domain | ❌ Same |
| Bing (WebFetch) | `site:balancebiketoddler.com/balance-bike-budget/` | **Well-formed no-results page** (Polish locale: "Brak wyników na temat: site:balancebiketoddler.com/balance-bike-budget/") | ⚠️ **First well-formed no-results for the budget path**; new-path no-results now total 4 (r4 stability ru / r8 stability zh / r9 stability es / r10 budget pl), consistent across 4 edge nodes → two-sided evidence that neither new page is in Bing's index |
| Bing (WebFetch) | `site:balancebiketoddler.com/balance-bike-stability/` | Returned canned chinatax.gov.cn content, unrelated to the query | ❌ Polluted, void (stability's no-results evidence is carried by the prior 3 observations) |
| Bing (WebFetch, whole-domain control) | `site:balancebiketoddler.com` | Site is in the index: home / products / reviews / about / electric-cars / 2 product detail pages; **no `/balance-bike-*` asset pages**; 2 previous-owner spam URLs still listed (day 10) | ✅ **Valid this run** (3rd consecutive valid control) |

**Interpretation:**

- This sandbox's `site:` path-query output remains untrustworthy (operator ignored / canned-content pollution), but the **whole-domain control has now been valid 3 consecutive runs**: "the site is in Bing's index and neither new path appears in top results" is a stable observation.
- **New key evidence this run: the budget path query returned a well-formed no-results page (Polish locale) for the first time.** Both new paths have now each produced well-formed no-results pages — 4 observations total across 4 distinct locale edge nodes (ru/zh/es/pl). If these were sandbox pollution, keeping the same semantics (no-results) across nodes would be unlikely; **Bing-side evidence now cuts both ways: both budget and stability are most likely not yet indexed by Bing.**
- Google-side best evidence remains the 10-12 Coverage export (14/271 indexed, 26-day plateau): both pages submitted 10-15 and Request Indexing on 10-16, **most likely not yet indexed**; the GSC visibility window (10-19–24) is in progress — only GSC URL Inspection can give an authoritative answer.

## 2. Sitemap Self-Check

Fetch method: `curl -s --noproxy '*' https://balancebiketoddler.com/sitemap.xml` (clean path, no query, no cache-buster — the path Google actually crawls).

| Item | Expected | Measured | Verdict |
|---|---|---|---|
| HTTP status | 200 | 200 | ✅ |
| Content-Type | application/xml | `application/xml; charset=utf-8` | ✅ |
| URL count | 247 | **247** (delta 0) | ✅ |
| Contains balance-bike-budget | yes | yes | ✅ |
| Contains balance-bike-stability | yes | yes | ✅ |
| Contains `<priority>` | yes | **247/247** | ✅ Backend fix `f2046bf` holding (8th consecutive run with complete priority) |
| Not JSON / not 404 / not 260-URL legacy format | — | max lastmod = **2026-10-16T12:22:46.520Z** (identical for 10 consecutive runs; no new content deployed since, as expected) | ✅ **No Worker interception recurrence, no edge staleness** |

**Verdict: all seven checks green, no alert needed.** The 10-15/16 clean-path fix and the priority fix have been stable for ~104 hours; the post-push auto-purge workflow's sitemap re-verification continues to hold (lastmod has not drifted).

## 3. Health Check (optional, executed)

```
SCORE: 100/100  (pass 15, warn 0, fail 0 of 15)
```

robots.txt, sitemap.xml (247, delta 0), metadata on 15 key pages (including both new pages), llms.txt (1137 bytes), 15 sampled internal links **0 broken**. The r4 transient network-flake false positive (fixed by front `c3a457f`) has not recurred for 6 consecutive runs.

## 4. stable-track Migration (still no new GSC export)

- Checked `doc/` during the run: **zero new files** since 14:26; no GSC Performance export.
- No new evidence; r3/r5/r6/r7/r8/r9 conclusions carry over: **unconfirmed and mechanistically blocked** — the stability page itself is not indexed, so Google cannot select it as the landing page for "stable track"; the 10-15 baseline (`/` + `/products/balance-bikes/`) is presumed to still hold.
- Given the GSC 2–3 day lag, a Performance export including today (Query contains `stable track` → PAGES tab) should land in the **10-19–24** window; this automation checks for new exports on every run and will analyze it automatically once it appears.

## 5. GSC Page Indexing Background (known as of 2026-10-16, not re-queried)

- **Benign, no action needed**: "Alternate page with proper canonical tag" (9 pages) and "Page with redirect" (4 pages) — currency / www / underscore / guide variants are already correctly canonicalized or 301-deduplicated.
- **Only remaining watch item**: the "Validation failed (10/11→10/13)" banner at the top of figure 2 — r3 confirmed the redirect group (4) shows **Started** after the 10-16 re-VALIDATE FIX; the canonical group is still Failed. No new screenshot/export this run; status carries over.
- **Canonical group handling unchanged**: the root cause (SPA hydration overwrite) was fixed and deployed today (front `3f01510`) → **do NOT re-run VALIDATE FIX**; a persisting "Failed" is a benign record in a declining trend; it clears on recrawl.
- Redirect group: 301 server-side backing in place (23/23); the next Coverage export should show Started → Passed.
- The `/auth/` noindex row (cookie-modal dead link, fixed by front `95b755f`) will clear naturally on Google's next crawl.

## 6. Recommended Next Steps (by priority)

1. **GSC URL Inspection on both new pages** (visibility window 10-19–24 in progress): the only action that can authoritatively settle "indexed or not". If the status is "Discovered – currently not indexed" or "Crawled – currently not indexed", Request Indexing can be clicked once more (already done 10-16; **next click ≥10-23**).
2. **Export Performance (Query contains `stable track` → PAGES tab)** to verify the landing-page migration; drop it into `doc/` and this automation will analyze it automatically.
3. **Next Coverage export — watch for**: ① indexed count 14 → 15/16 (submission taking effect) ② redirect validation Started → Passed ③ canonical group count continuing to decline (self-healing after the fix, no intervention). Based on prior cadence it should land around 10-21, and should cover 10-15/16 for the first time.
4. **Backlink building remains the only real lever**: the diagnostic chain (26-day plateau + 94% Discovered-not-indexed + zero backlinks) is unchanged; `doc/backlink-outreach-pack-2026-10-19_en.md` (16 targets, 3 tiers, 4 email drafts) is ready to launch. Priority: stability page > budget page.
5. **(Optional) Bing Webmaster Tools removal** of the two previous-owner spam URLs (live 404/301 fully re-verified; still in Bing's index on day 10, confirmed by 3 consecutive valid controls).
6. **(Optional) Backend**: no new to-dos — 301 routes, priority fix, and sitemap clean path have all been stable for ~104 hours.

## 7. Run Archive (method & raw data)

- Sitemap: `curl -s --noproxy '*' -o /tmp/sitemap_r10.xml https://balancebiketoddler.com/sitemap.xml` → 200 / `application/xml; charset=utf-8` / 39888 bytes; `grep -o '<loc>'` = 247; `grep -o '<priority>'` = 247; both new pages' `<loc>` present; max lastmod = 2026-10-16T12:22:46.520Z (identical for 10 consecutive runs).
- Both new pages: direct curl of HTML → 200 / `index,follow,max-image-preview:large` / self-canonical; titles "Budget Balance Bike: Cheap Picks That Last | BalanceBikeToddler" and "Stable Track Balance Bike: Track Width | BalanceBikeToddler".
- Search: WebSearch `site:` ×2 (operator ignored, 5 off-domain results each, result sets identical to r9); WebFetch Bing path queries ×2 (budget **first well-formed no-results**, Polish locale; stability canned chinatax.gov.cn content, void) + whole-domain control ×1 (**valid**: site in index, no `/balance-bike-*` pages, both spam URLs day 10 still listed).
- Health check: `npm run seo:health` ×1 → 100/100 (15/15, 23s).
- Spam URLs: `curl` ×4 → apex pair 404; www pair 301 (→ apex → 404, final status unchanged).
- IndexNow snapshot `scripts/seo/.last-indexnow.json`: updatedAt 2026-10-15T16:18:44.835Z unchanged, 247 URLs including both new pages.
- git (front): no new commits (HEAD still `9c00d2e`; the eight r6–r9 docs are still untracked); **zero changes** this run.
- GSC exports/screenshots: none new (`find doc -newermt "2026-10-19 14:26"` empty).

## 8. Post-run Addendum (16:36, user submitted the 10-19 Coverage export)

- The user submitted `balancebiketoddler.com-Coverage-2026-10-19.zip` at 16:36; extracted to `doc/gsc-coverage-2026-10-19-export/` and analyzed: **byte-identical to the 10-18 export** (all four CSVs same md5; both zips 1095 bytes) — the data window still ends 10-12, **no new information and no regression**.
- Impact on this report's conclusions: ① indexing verdict unchanged — indexed still 14/271 (26-day plateau), the stability page still in the 242-page Discovered pool, stable-track migration still mechanistically blocked; ② validation: redirect group still **Started** (not Passed, but the 301s only went live 10-18 22:30, after the data window — expected), canonical group still Failed (root cause only fixed 10-19, after the window — **do NOT re-run VALIDATE FIX**); ③ recommend the user re-export Coverage around 10-22–24 (re-exporting during the frozen window is pointless) and add a Performance export to complete the stable-track verdict.
- Details: `doc/gsc-coverage-2026-10-19-analysis_en.md`.
