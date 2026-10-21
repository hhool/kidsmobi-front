# Indexing Check & "stable track" Landing-Page Migration Review — 2026-10-21 (r14)

Run time: 2026-10-21 11:53–12:0x (GMT+8). Read-only verification; no site code modified.

## 0. Executive Summary

| # | Item | Verdict |
|---|---|---|
| 1 | Are the budget / stability pages indexed? | Still **unverifiable from this sandbox** (`site:` queries ignored/polluted for the 15th/16th time). Combined evidence continues to point to "neither page indexed yet, stability evidence stronger": Bing stability `site:` returned a well-formed no-results page for the **6th** time; best Google-side evidence remains the 14/271 indexed plateau (data through 10-12) |
| 2 | Sitemap self-check | **All green** (14th consecutive run): 200 / `application/xml; charset=utf-8` / **269 URLs** / 269/269 with `<priority>` / both new pages present (priority **0.9**) / max lastmod `2026-10-20T09:04:01.807Z`. No Worker interception recurrence, no edge staleness (10-15/16 fixes stable for ~114h) |
| 3 | seo:health | **100/100** (16/16, 30s): P0 guard `prerender-meta-ownership` (10 nested routes) holding; sitemap baseline 269, delta 0; internal-links broken=0 |
| 4 | stable-track migration | **Still unconfirmed**: no new GSC Performance export (Downloads/doc unchanged since r13). Baseline remains `/` + `/products/balance-bikes/` (10-15); deterministic read window **10-22~24** |
| 5 | GSC Page indexing | No new screenshots/exports; status carries over: redirect group (4) **Started**; canonical group (9) Failed but root-caused + fixed (`3f01510`) → **no further VALIDATE FIX**; breadcrumb duplicate JSON-LD fix awaiting the user's "Validate fix" click |
| 6 | IndexNow snapshot | ✅ **Pending item closed**: snapshot refreshed 10-20T18:43:58Z to **269 URLs**, URL-set **diff = 0** vs the live sitemap (the 2-day-old "266 stale" issue from r12/r13 is resolved) |
| 7 | Outstanding content bug | `/guides` hub prerender title still mismatched ("How to Choose a Baby Stroller…"), unchanged since r12 |

## 1. Indexing Check (Bing first)

| Probe | Result | Reading |
|---|---|---|
| WebSearch `site:.../balance-bike-budget/` | 5 off-domain content-farm results, 0 on-domain | `site:` operator ignored for the **15th** time; no signal |
| WebSearch `site:.../balance-bike-stability/` | 5 off-domain results, 0 on-domain | 16th consecutive ignore |
| Bing `site:.../balance-bike-budget/` | Baidu Zhidao/Wenku Chinese spam set | **Polluted, void** |
| Bing `site:.../balance-bike-stability/` | Well-formed localized **no-results** page ("没有与此相关的结果", zh) | stability **6th** well-formed no-results (r4 ru / r8 zh / r9 es / r12 zh / r13 zh / r14 zh) → semantics consistent across 6 edge nodes; evidence for "stability not yet in Bing's index" keeps accumulating |
| Bing whole-domain control `site:balancebiketoddler.com` | mohrss.gov.cn spam set | **3rd consecutive pollution** (identical payload r12/r13/r14, same edge node) → control void; last valid control r11 (site in index) |

Conclusion: this sandbox's tampering with search-engine `site:` queries has now persisted for 14 runs; indexing status is **only determinable via GSC or a normal-network `site:` check** (as the task brief anticipates). The combined evidence (Bing 6× no-results + Google 14/271 plateau, both lagging) points to neither page being indexed yet. Both pages' own technical state (200 / indexable / self-canonical / in sitemap and IndexNow-submitted) is fully ready — only search-engine crawling is missing. Per the brief, GSC lags 2-3 days, so the **deterministic indexing read for budget/stability requires the 10-22~24 GSC export**.

## 2. Sitemap Self-Check (all green, no alarm)

Fetched with `curl --noproxy '*'` (no query) from `https://balancebiketoddler.com/sitemap.xml`, 43,281 bytes.

| Check | Result |
|---|---|
| HTTP status | **200** |
| Content-Type | **`application/xml; charset=utf-8`** |
| URL count | **269** (exact `grep -o` count) |
| `<priority>` coverage | **269/269** (distribution 1.0×1 / 0.9×9 / 0.8×1 / 0.6×99 / 0.4×159 — identical to r11–r13) |
| `<lastmod>` coverage | 259/269 (10 static routes lack lastmod; negligible, unchanged) |
| `balance-bike-budget` | ✅ present, priority **0.9** |
| `balance-bike-stability` | ✅ present, priority **0.9** |
| max lastmod | `2026-10-20T09:04:01.807Z` (same as since r11; no new batch) |
| Live URL set vs IndexNow snapshot | **diff = 0** (269 = 269, fully synchronized — new cross-check this run) |

**Task-brief baseline note**: the brief's "247 URLs / alarm at 260 old-format" baseline has been stale since r11 — two legitimate content publishes on 10-19/10-20 moved the count 247 → 266 → **269**. This run's 269 is the expected value: **none of the alarm conditions (JSON / 404 / 260 old format) occurred — no alarm**. Worker interception has not recurred; no edge staleness.

Minor correction: r13's summary table recorded the two pages' priority as 0.6; direct live-sample verification this run shows **0.9** (`<loc>.../balance-bike-budget/</loc><priority>0.9</priority>`, same for stability). The full priority distribution is count-for-count identical to r13 (99×0.6 undiminished, 9×0.9 un-increased), proving the live sitemap did not change — r13's line was a doc typo.

## 3. Health Check (`npm run seo:health`, executed, 30s)

```
SCORE: 100/100  (pass 16, warn 0, fail 0 of 16)
[PASS] sitemap.xml: 269 URLs (baseline 269, delta 0)
[PASS] prerender-meta-ownership: 10 nested route(s) serve their own title + canonical
[PASS] internal-links: sampled 15, broken=0
```

- Both pages are in KEY_URLS and pass every item (title/desc/keywords/canonical/json-ld).
- The `prerender-meta-ownership` guard continues to tripwire r12-class P0 regressions (SPA wildcard swallowing prerenders); all 10 routes pass.
- Baseline constant already synced to 269, delta 0, no WARN (r11's false positive eliminated when the parallel session updated the constant).

## 4. Live Status Re-verification of the Two Pages (no regression exposure)

| Page | Status | meta robots | canonical | title / H1 |
|---|---|---|---|---|
| `/balance-bike-budget/` | 200 (32,133 B) | `index,follow,max-image-preview:large` | self | "Budget Balance Bike: Cheap Picks That Last \| BalanceBikeToddler"; H1 matches |
| `/balance-bike-stability/` | 200 (52,764 B) | `index,follow,max-image-preview:large` | self | "Stable Track Balance Bike: Track Width \| BalanceBikeToddler"; H1 still contains "stable track balance bike" |

r13's closed-loop P0 fix (`001d587`) did not need full re-verification this run: the automatic `prerender-meta-ownership` guard (10/10 nested routes) plus the two pages' own probes constitute continuous evidence; seo:health passed at the same score.

## 5. IndexNow Snapshot (pending item ✅ closed)

- `scripts/seo/.last-indexnow.json`: updatedAt **2026-10-20T18:43:58.401Z**, **269 URLs**.
- URL-set diff vs the live sitemap = **0**: the three 10-20 CMS guides (`/guides/beginner/balance-bike-by-age`, `/guides/beginner/balance-bike-what-buyers-say`, `/guides/scenario/balance-bike-stability`) are included — the "266 stale / 3 unsubmitted" issue pending since r12/r13 is **resolved** (the parallel session back-submitted on the evening of 10-20).
- Key file `dfb12ac97ad4a34c75ccf6cc4b783c7f.txt` live 200.

## 6. stable-track Migration Assessment

- **No new GSC Performance export**: `find doc -newermt "2026-10-21 02:55"` empty; newest Downloads item is still the 10-19 Coverage zip (byte-identical to the 10-18 one, window frozen at 10-12) → migration status **unconfirmed**; baseline remains `/` + `/products/balance-bikes/` (10-15).
- Per the brief, absent an export the Bing `site:` indexing evidence governs plus a wait-for-GSC note: the stability page's 6th Bing no-results corroborates that it is not indexed → **mechanistically it cannot yet be the "stable track" landing page**; migration confirmation must await GSC.
- The GSC visibility window 10-19~24 is in progress; the deterministic read is expected **10-22~24** (runbook task board #40). Recommended then: export Performance (Query contains "stable track" → PAGES) + Coverage (check whether the 14/271 plateau loosens and whether the redirect group turns Passed).
- Candidate to watch (since r13): `/guides/scenario/balance-bike-stability` (CMS stability article; self-canonical, titled "Stable Track Balance Bikes: What Holds") — once indexed it is a natural stability-topic landing-page candidate; include it in the 10-22~24 migration review.

## 7. GSC Page indexing Background (known 2026-10-16, not re-queried)

- Figure 1 "Alternate page with proper canonical tag" = 9 pages and Figure 2 "Page with redirect" = 4 pages are both benign (currency/www/underscore/guide variants correctly canonicalized / 301-deduplicated) — no action needed.
- The one remaining concern, "Validation failed (10/11→10/13)": combined with existing exports, the redirect group (4) is **Started** (the 10-16 re-VALIDATE FIX was accepted by Google; server-side 301 backing live since r5 and re-verified after the Worker handover `dc2c1a5`) → await the next export to see whether it turns Passed.
- The canonical group (9) is still Failed but the root cause (SPA canonical overwrite) was fixed and deployed via `3f01510` → **no further VALIDATE FIX**; it self-heals on recrawl.
- **Third manual action** (added r13, awaiting the user): the breadcrumb duplicate JSON-LD fix is deployed but will not disappear automatically — the user must confirm clean examples in GSC "Enhancements" and click **Validate fix** (see `doc/gsc-manual-actions-2026-10-21_en.md` §2).
- No new screenshots/exports this run; all statuses carry over; no new issues found.

## 8. Next Steps (by priority)

1. **P1 — User GSC manual actions** (before 10-22): ① click "Validate fix" for the breadcrumb repair; ② remove the old entry and resubmit sitemap.xml (expect "Discovered URLs" to climb toward 269); ③ "Request indexing" for the 10-19/20 newly published guide pages (budget/stability were already requested on 10-16 — don't burn quota repeating).
2. **P1 — Export GSC Performance 10-22~24** (Query contains "stable track" → PAGES) to confirm landing-page migration; also export Coverage to see whether the redirect group turns Passed, the breadcrumb group clears, and the 14/271 plateau loosens.
3. **P2 — Fix the `/guides` hub prerender title** ("How to Choose a Baby Stroller…" mismatch, unchanged since r12; suspected prerender data-source picking up child-route data).
4. **P3 — Sandbox Bing `site:` checks have been tampered for 14 consecutive runs** (whole-domain control polluted 3× by the same mohrss node): indexing conclusions rest on GSC; for Bing-side corroboration, run `site:balancebiketoddler.com/balance-bike-stability/` and the budget counterpart from a normal network.
5. **P3 — If the 10-22~24 export shows stability indexed but "stable track" still not migrated**, inspect internal-link anchor text between the page and `/products/balance-bikes/` (landing-page migration usually needs supporting in-site anchor text).

## 9. Run Archive (method & raw data)

- All probes used `--noproxy '*'`, no query; run time 2026-10-21 11:53–12:0x GMT+8.
- Sitemap: live copy archived at `tmp/sitemap-check-r14.xml` (43,281 bytes; 269 loc / 269 priority / 259 lastmod; both pages priority 0.9); live URL set `tmp/live-sitemap-urls-r14.txt` vs IndexNow snapshot `tmp/indexnow-urls-r14.txt` diff = 0.
- Polluted probes (void this run): WebSearch site: ×2 (operator ignored), Bing budget site: (Baidu spam), Bing whole-domain control (mohrss spam, 3rd consecutive).
- Valid readings: Bing stability site: = well-formed no-results (zh, 6th); all sitemap items; both pages 200 + meta robots + self-canonical; seo:health 100/100 (16/16); IndexNow snapshot 269 URLs matching the sitemap; key file 200.
- HEAD during run: `001d587` (no new commits, same as r13) — no site code modified this run.
