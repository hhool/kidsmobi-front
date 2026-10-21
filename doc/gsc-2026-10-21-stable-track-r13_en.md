# Indexing Check & "stable track" Landing-Page Migration Review — 2026-10-21 (r13)

Run window: 2026-10-21 02:34–02:50 (GMT+8). Verification and documentation only; no site code was modified.

## 0. Executive Summary

| # | Item | Verdict |
|---|---|---|
| 1 | ✅ **r12's P0 is fixed and deployed** (`001d587`, live by ~02:0x) | The SPA-fallback shadowing of prerender pages (255/269 URLs serving the homepage shell, found in r12) is resolved: unknown sub-paths are **404** again (proper 404 title); nested prerenders like `/products/balance-bikes/` serve their own title + self-canonical again; the CMS stability guide `/guides/scenario/balance-bike-stability` canonical is back to **self-referencing** |
| 2 | Budget / stability pages' own status | Never affected by the regression: 200 + `index,follow,max-image-preview:large` + self-canonical + correct titles; stability H1 still contains "stable track balance bike" |
| 3 | Are the two pages indexed? | Still unverifiable from this sandbox. Bing: stability `site:` → **5th** well-formed no-results (zh edge node); budget probe polluted (Baidu spam). Whole-domain control polluted for the **2nd** consecutive run (mohrss spam) → void. Google-side best evidence remains the 14/271 indexed plateau (data through 10-12) |
| 4 | Sitemap self-check | **All green** (13th consecutive): 200 / `application/xml; charset=utf-8` / **269 URLs** / 269/269 with `<priority>` / both pages present / max lastmod `2026-10-20T09:04:01.807Z` / live URL-set == local dist (diff 0). No Worker-interception recurrence |
| 5 | seo:health | **100/100** (16/16; one more check than r12 — new guard `prerender-meta-ownership`: 10 nested routes serve their own title + canonical, all pass) |
| 6 | Retired-URL 301 family | After `dc2c1a5` moved the family into the Worker, live re-verification **passes**: prefix pairs (balance_bike→balance-bikes, electric_vehicles→electric-cars, …) + `/products/other/*` exact rules all 301 to survivors; unknown ids return a clean 404 (no more shell) |
| 7 | stable-track migration | **Still unconfirmed**: no new GSC Performance export (Downloads unchanged since 10-19). Baseline remains `/` + `/products/balance-bikes/`. New upside: the CMS stability guide is self-canonical again and is a natural landing-page candidate once indexed |
| 8 | GSC Page indexing | No new screenshot/export → status carries over: redirect group (4) **Started**; canonical group (9) Failed but root-caused + fixed (`3f01510`) → **no further VALIDATE FIX needed**. **New third manual action**: Breadcrumb duplicate JSON-LD fixed, awaiting "Validate fix" (see §7) |

## 1. Indexing Check (Bing first)

| Probe | Result | Reading |
|---|---|---|
| WebSearch `site:.../balance-bike-budget/` | 5 off-domain results (trekbikesblog / pookapages …), 0 on-domain | `site:` operator ignored for the **13th** time; no signal |
| WebSearch `site:.../balance-bike-stability/` | 5 off-domain results (smallsmart …), 0 on-domain | Same |
| Bing `site:.../balance-bike-budget/` | Baidu Zhidao/Wenku Chinese spam result set | **Polluted, void** (6th pollution-class observation) |
| Bing `site:.../balance-bike-stability/` | Well-formed localized **no-results** page ("没有与此相关的结果", zh) | stability **5th** well-formed no-results (r4 ru / r8 zh / r9 es / r12 zh / r13 zh) → consistent semantics across 5 edge nodes; keeps supporting "stability not yet in Bing's index" |
| Bing whole-domain control `site:balancebiketoddler.com` | mohrss.gov.cn Chinese spam result set | **Polluted 2nd consecutive run** (identical payload to r12) → void; last valid control r11 (10-20: site in index, no /balance-bike-* asset pages) |

Conclusion: sandbox interference with search-engine `site:` queries has now persisted for 13+ runs — indexing status is **only verifiable via GSC or a normal-network `site:` check**. The combined evidence (Bing 5×no-results + Google 14/271 plateau) points to: neither new page is indexed yet, with stronger evidence for stability. Both pages' technical readiness (200 / indexable / self-canonical / in sitemap) is complete; only Google-side crawling and the GSC manual requests are missing.

## 2. Sitemap Self-Check (all green)

Fetched with `curl --noproxy '*'` (no query) directly from `https://balancebiketoddler.com/sitemap.xml`.

| Check | Result |
|---|---|
| HTTP status | **200** |
| Content-Type | **`application/xml; charset=utf-8`** |
| URL count | **269** (exact `grep -o` count) |
| `<priority>` coverage | **269/269** (distribution 1.0×1 / 0.9×9 / 0.8×1 / 0.6×99 / 0.4×159, identical to dist) |
| `<lastmod>` coverage | 259/269 (10 static routes lack lastmod; negligible) |
| `balance-bike-budget` | ✅ present (priority 0.6) |
| `balance-bike-stability` | ✅ present (priority 0.6) |
| max lastmod | `2026-10-20T09:04:01.807Z` (same as r11/r12; no new batch) |
| Live vs local dist | URL-set diff = **0** |

**Task-brief baseline note**: the brief's "247 URLs / alarm at 260" baseline went stale at r11 — two legitimate content batches (10-19/10-20) moved the count 247 → 266 → **269** (recorded and adjudged legitimate in r11/r12). 269 is the expected value this run — **no alarm**; no Worker interception recurrence, no edge staleness (10-15/16 fixes stable for ~110h).

## 3. Health Check (`npm run seo:health`, executed)

```
SCORE: 100/100  (pass 16, warn 0, fail 0 of 16)
[PASS] sitemap.xml: 269 URLs (baseline 269, delta 0)
[PASS] prerender-meta-ownership: 10 nested route(s) serve their own title + canonical
[PASS] internal-links: sampled 15, broken=0
```

- Checks grew 15 → 16: the new `prerender-meta-ownership` assertion is exactly the live guard recommended in r12 §4.5 (nested prerender routes must serve their own title/canonical, not the homepage's). All pass — **the P0 class of regression now has an automated tripwire**.
- Baseline constant resynced to 269, delta 0, no WARN. Both target pages are in KEY_URLS and pass every check.

## 4. P0 Fix Re-verification (closing r12 §4)

`001d587` ("fix(redirects): drop the SPA prefix block that shadowed 255 prerender pages") dropped the prefix wildcard block. Live probes:

| Probe | r12 (regressed) | r13 (fixed) |
|---|---|---|
| `/products/balance-bikes/zzz-not-real-xyz` | 200 + homepage shell | **404** ("Page Not Found (404) | BalanceBikeToddler") |
| `/products/balance-bikes/` | 200 + homepage title/canonical | **200 + own title** "Best Toddler Balance Bikes 2026" + self-canonical |
| `/guides/scenario/balance-bike-stability` | canonical → homepage | **own title** "Stable Track Balance Bikes: What Holds" + **self-canonical** |
| `/products/other/unknown-id-zzz999` | 200 shell | **404** (clean behavior after Worker handoff) |

**Retired-URL 301 family** (`dc2c1a5` handed it to the Worker; re-verified with real rules):

- `/products/balance_bike/balance_bike-b0bkxshhnp` → 301 → `/products/balance-bikes/balance_bike-b0bkxshhnp` ✅
- `/products/other/stroller-b0d65f9ns7` → 301 → `/products/strollers/stroller-b0d65f9ns7` ✅
- `/products/other/kids_push_ride_ons-b001nqhn7s` → 301 → `/products/kids-tricycles/kids_push_ride_ons-b001nqhn7s` ✅
- `/products/electric_vehicles/ride_on_xyz` → 301 → `/products/electric-cars/ride_on_xyz` ✅ (the row segment r5 had false-flagged now genuinely 301s)
- Current map: 44 exact rules + 10 one-to-one prefix pairs (dist/data/legacy-redirects.json)

**GSC impact inference**: the 14/271 indexed plateau (data through 10-12) proves prerenders were served correctly before tonight; this regression was live only ~2 hours (00:44–~02:0x). r12 warned it could mint a new canonical group in the next Coverage export if it persisted — with the prompt fix, **no GSC trace is expected** (Coverage data itself lags to 10-12 anyway).

## 5. stable-track Migration Assessment

- **No new GSC Performance export** (`find doc -newermt "2026-10-21 02:05"` = only parallel-session redirects/manual-actions docs; Downloads latest remains the 10-19 Coverage zip) → migration status **unconfirmed**; baseline remains `/` + `/products/balance-bikes/` (10-15).
- GSC's 2–3 day lag means the visibility window 10-19~24 is in progress; deterministic read expected **10-22~24** (matches task-board #40 in the runbook). Export Performance (Query contains "stable track" → PAGES) then and re-check.
- The mechanistic precondition for migration (stability page indexed) is not yet met — consistent with §1.
- **New candidate to watch**: `/guides/scenario/balance-bike-stability` (CMS stability article, live since 10-20) regained its self-canonical with the P0 fix; its title is literally "Stable Track Balance Bikes: What Holds" — once indexed it is the natural landing-page candidate for this topic cluster. Include it in the next migration review.

## 6. Minor Findings

1. **IndexNow snapshot still frozen at 266 URLs** (updatedAt 10-19T19:46:11.992Z) — the 3 CMS guides from 10-20 are not yet submitted; key file live 200. The GSC runbook covers Google-side requests, but the Bing/Yandex/Seznam side should get these 3 URLs submitted.
2. `/guides` hub prerender title looks mismatched ("How to Choose a Baby Stroller…"), same in local dist — minor content-side bug in the prerender title source (carried over from r12, unchanged).
3. Previous-owner spam URL: `panties-sexy.html` still 404 live (final status unchanged); Bing index status not re-verifiable this run (control polluted); last valid observation r11 = day 11 still indexed.
4. Parallel session added `doc/gsc-manual-actions-2026-10-21_{zh,en}.md` (`c308689`): the checklist for the three manual GSC actions (re-submit sitemap / validate Breadcrumb fix / request indexing for 4 new pages). Cross-referenced in §7.

## 7. GSC Page indexing Background (known as of 2026-10-16; not re-queried)

- Fig. 1 "Alternate page with proper canonical tag" = 9 pages and Fig. 2 "Page with redirect" = 4 pages are both benign (currency/www/underscore/guide variants correctly canonicalized/301-deduplicated).
- Sole remaining watch item: Fig. 2's top banner "Validation failed (10/11→10/13)". Per the 10-18/10-19 Coverage exports: redirect group (4) = **Started** (the 10-16 re-VALIDATE FIX was accepted by Google; server-side 301 backing live since r5, and re-confirmed this run after the Worker handoff) → check whether it flips to Passed on the next export.
- Canonical group (9) still Failed, but the root cause (SPA canonical overwrite) was fixed and deployed via `3f01510` → **no further VALIDATE FIX**; it self-heals on recrawl.
- **New third item**: a parallel session fixed the duplicate Breadcrumb JSON-LD rows (three emitting sources; GSC reported duplicates on ~20 of 21 sampled pages). The fix is deployed but **the report will not clear on its own** — the owner must confirm no duplicates remain in "Example URLs" in GSC (Page indexing → Page experience) and click **Validate fix** (takes days to two weeks). See `doc/gsc-manual-actions-2026-10-21_en.md` §2.
- No new screenshots/exports this run; statuses carry over. r12's worry that the regression would mint a new canonical group is expected not to materialize (regression live only ~2h).

## 8. Next Steps (by priority)

1. **P1 — Owner executes the three manual GSC actions** (before 10-22), per `doc/gsc-manual-actions-2026-10-21_en.md`: ① delete the stale sitemap entry and re-submit sitemap.xml (expect "Discovered URLs" to climb toward 269); ② click **Validate fix** on the Breadcrumb fix; ③ **Request indexing** for the 4 new guide pages (#2/#3 topic pages first). The budget/stability pages were already requested on 10-16 — do not re-burn the ~10/day quota on unchanged URLs.
2. **P1 — Export GSC Performance 10-22~24** (Query contains "stable track" → PAGES) to confirm the landing-page migration; also export Coverage to check whether the redirect group flips to Passed, whether the Breadcrumb group clears, and whether the 14/271 plateau moves.
3. **P2 — Submit the IndexNow increment** (3 CMS guides) to keep the submission snapshot in sync with the sitemap.
4. **P2 — Fix the `/guides` hub prerender title**.
5. **P3 — Sandbox Bing `site:` checks have been interfered with for 13+ consecutive runs** (this run's whole-domain control was also polluted twice in a row): rely on GSC for indexing conclusions; if Bing-side corroboration is needed, run `site:balancebiketoddler.com/balance-bike-stability/` (and the budget equivalent) from a normal network.

## 9. Run Archive (method and raw data)

- All probes used `--noproxy '*'`, no query; window 2026-10-21 02:34–02:50 GMT+8.
- Sitemap: `/tmp/sitemap_check.xml` (43281 bytes, 269 loc / 269 priority / 259 lastmod); live URL-set `/tmp/live_urls.txt`, diff vs dist = 0.
- Polluted probes (void this run): WebSearch site: ×2 (operator ignored), Bing budget site: (Baidu spam), Bing whole-domain control (mohrss spam).
- Valid readings: Bing stability site: = well-formed no-results (zh, 5th time); all sitemap checks; both pages 200 + meta robots `index,follow,max-image-preview:large` + self-canonical; seo:health 100/100 (16/16); all §4 P0-fix re-verification probes (incl. 5 real retired-URL 301 probes).
- HEAD during run: `001d587` (P0 fix), `c308689` (GSC runbook), `dc2c1a5` (301 family to Worker) — all parallel-session commits; this run modified no site code.
