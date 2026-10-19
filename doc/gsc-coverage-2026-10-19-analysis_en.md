# GSC Coverage Export Analysis (2026-10-19)

**Data source**: user-exported GSC Page indexing (Coverage) report `balancebiketoddler.com-Coverage-2026-10-19.zip` (Chart.csv / Critical issues.csv / Metadata.csv / Non-critical issues.csv).
**Core fact: this export is byte-identical to the 10-18 export** (all four CSVs share the same md5; both zips are 1095 bytes) — **it contains no new data, and no regression either**. Chart data still ends **2026-10-12**.
**Prior context**: `doc/gsc-coverage-2026-10-18-analysis_en.md` (full 10-18 analysis; this document is the incremental update only).

---

## 0. TL;DR

| Question | Answer |
|---|---|
| Does the export carry new information? | **No.** md5-identical to the 10-18 export (Chart / Critical issues / Non-critical / Metadata all match); the GSC Coverage data window is still frozen at 10-12 — roughly a 6-7 day lag for this property |
| Did the "Validation failed" clear (the 10-16 re-VALIDATE FIX)? | **Not yet.** The redirect group (4) is still **Started** (not Passed); the canonical group (9) is still **Failed**. But both groups' decisive fixes postdate this data window (301s went live 10-18 22:30; the canonical root cause was only fixed on 10-19) — **invisibility of the effect is expected, not a regression** |
| Are the two new pages indexed? | **Still not.** indexed remains 14/271 (frozen since 09-22); the stability page is still in the 242-page "Discovered - currently not indexed" pool → stable-track migration remains mechanistically blocked |
| Keep re-exporting daily? | **No need.** The window is frozen; another export now would be the same data. **Re-export around 10-22–24** (by then the chart should advance to ~10-15–18, first covering the 10-15 IndexNow / 10-16 Request Indexing / 10-16 re-validation / 10-18 301 rollout) |

## 1. Export Identity Check (method archive)

```bash
diff doc/gsc-coverage-2026-10-18-export/*.csv doc/gsc-coverage-2026-10-19-export/*.csv   # zero differences
md5sum  # Chart.csv a358b179…, Critical issues.csv d58020fa… — identical across both days' exports
```

- Both zips are 1095 bytes; Chart.csv's last row is 2026-10-12 in both (indexed 14 / not indexed 257 / impressions 8).
- Critical issues.csv's six rows are identical: canonical(9) Failed / noindex(1) Not Started / redirect(4) **Started** / Discovered(242) Started / Crawled(1) Started / Duplicate-without-canonical(0) **Passed**.
- Non-critical issues.csv is an empty table on both days; Metadata.csv is "All known pages" on both.
- No other GSC exports in Downloads (no Performance export; the stable-track migration verdict still lacks Performance data).

## 2. Answers to the Four Open Questions

**① Has the redirect group (4) validation passed? — No, still Started.**
After the user's 10-16 re-VALIDATE FIX, Google accepted the validation start (confirmed as Started in r3); three days later it still hasn't flipped to Passed. The reasonable explanation: validation requires Google to recrawl and confirm the redirect chain, and the 301 server-side backing (23 retired listings → survivors) **only went live 10-18 22:30** (backend `7a4f4db` deployed, recorded in r5) — after this data window. **No regression; expect Passed once the data advances.**

**② Canonical group (9) still Failed? — Yes, and do NOT re-run VALIDATE FIX.**
The "Validation failed (10/11→10/13)" banner from the 10-13 screenshot corresponds to this group (answered in 10-18 analysis §5). The root cause (SPA hydration overwriting canonicals) was only fixed and deployed **today (10-19, front `3f01510`)** — after this data window. Per the established guidance: **do not click VALIDATE FIX again**; it self-heals on recrawl, with the trend already declining.

**③ Are the two new pages indexed? — No, still in the parking lot.**
indexed remains 14/271 with zero net growth for 26 consecutive days (since the 09-22 full sitemap submission); the 10-05~10-09 dip to 13 and back (single-page churn, benign, recorded in 10-18 analysis §3). The 10-15 IndexNow submission and 10-16 Request Indexing effects are **physically invisible** in a window ending 10-12. Bing-side corroboration (r10): both new paths have produced well-formed no-results pages (across 4 edge nodes).

**④ stable-track migration? — Still blocked.**
The stability page itself is not indexed → it cannot be the landing page for "stable track"; the 10-15 baseline (`/` + `/products/balance-bikes/`) is presumed to still hold. A Performance export is still missing (Query contains "stable track" → PAGES tab); with the GSC 2-3 day lag it should land around 10-22–24.

## 3. Actions After This Data Window (through 10-12) — None Reflected

| Date | Action | First visible ~ |
|---|---|---|
| 10-15 | IndexNow incremental submission (both new pages) | 10-22~24 |
| 10-16 | budget+stability Request Indexing; redirect group re-VALIDATE FIX | 10-22~24 |
| 10-18 22:30 | 23 retired-listing 301s live (backend `7a4f4db`) | 10-24~26 (needs recrawl) |
| 10-19 | SPA canonical root-cause fix live (front `3f01510`) | 10-25~27 |
| 10-15/16 | sitemap clean-path fix + priority fix (stable ~104h, verified in r10) | continuously in effect |

## 4. Recommendations (user-side)

1. **Re-export Coverage around 10-22–24** (no need to export daily — the window is frozen, you'd get the same data). Check three things: ① indexed 14 → 15/16 ② redirect Started → Passed ③ canonical group count declining.
2. **GSC URL Inspection on both new pages**: still the only authoritative verdict (data from 10-19~20 reflects the 10-16 submission).
3. **Export Performance** (Query contains "stable track" → PAGES) to verify the landing-page migration; drop it into `doc/` and the automation will analyze it.
4. **Do NOT click VALIDATE FIX again for the canonical group** (root cause fixed, awaiting recrawl); if the redirect group is still Started next export while the 301s are live (they are), one more validation click is acceptable.
5. **Backlink building remains the only real lever** (26-day plateau + 94% Discovered-not-indexed + zero backlinks diagnostic chain unchanged); `doc/backlink-outreach-pack-2026-10-19_en.md` is ready to launch.
6. (Optional) Bing Webmaster Tools removal of the two previous-owner spam URLs (live 404/301 fully re-verified; still in Bing's index on day 10).

## 5. Run Archive

- Extraction: `doc/gsc-coverage-2026-10-19-export/` (four CSVs); diff against the 10-18 export = zero differences; md5 identical.
- Downloads re-check: only Coverage zips ×2 (10-18 21:03 / 10-19 16:36, both 1095 bytes); no Performance export.
- No new site-side actions this run (the r10 run at 16:30 just completed an all-green verification: sitemap 247/247, both pages 200 self-canonical, seo:health 100/100).
- No site code modified.
