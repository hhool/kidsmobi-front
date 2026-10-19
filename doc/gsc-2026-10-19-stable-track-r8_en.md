# Indexing Check & "stable track" Landing-Page Migration Review — 2026-10-19 (r8, same-day repeat trigger)

> Related docs: `doc/gsc-2026-10-19-stable-track-r7_en.md` (today 09:00, previous run), `doc/gsc-2026-10-19-stable-track_en.md` (today r6), `doc/gsc-2026-10-18-stable-track-r3/r4/r5_en.md`, `doc/spa-canonical-overwrite-2026-10-19_en.md`, `doc/gsc-coverage-2026-10-18-analysis_en.md`
> Nature: read-only verification + documentation, **no site code modified**.
> Run window: 2026-10-19 11:49-11:58 (GMT+8); findings are a same-day delta on top of r6/r7.

## 0. Summary Table

| Check | Result |
|---|---|
| `/balance-bike-budget/` live status | ✅ 200, `index,follow,max-image-preview:large`, self-canonical, title "Budget Balance Bike: Cheap Picks That Last" |
| `/balance-bike-stability/` live status | ✅ 200, `index,follow,max-image-preview:large`, self-canonical, title "Stable Track Balance Bike: Track Width" |
| Are the two pages indexed? | ❌ Still unconfirmable from authoritative channels; most likely **NOT indexed**. WebSearch `site:` operator ignored for the 8th consecutive run (5 off-domain results each, 0 on-domain). Bing `site:` path queries: budget result tampered (void); **stability returned a well-formed localized no-results page**. **Bing whole-domain control valid this run** (first valid since r6): site IS in the index and top 10 contains no `/balance-bike-*` asset pages. Google-side best evidence remains the 10-12 Coverage export (14/271 indexed, 26-day plateau). Both pages submitted 10-15, Request Indexing 10-16; **GSC visibility window (10-19~24) is now open** |
| sitemap.xml | ✅ 200 + `application/xml; charset=utf-8` + **247 URLs** + **247/247 with `<priority>`** + both new pages + max lastmod 2026-10-16T12:22:46.520Z (8th consecutive match) → **no Worker interception recurrence, no edge staleness** |
| `npm run seo:health` | ✅ **100/100** (15/15 pass, 0 broken links in 15-link sample) |
| stable-track landing-page migration | ⏳ Unconfirmed and still mechanistically blocked (stability page itself not indexed → cannot be the landing page); 10-15 baseline (`/` + `/products/balance-bikes/`) presumed to hold. **Still no new GSC Performance export** (after 09:00, `doc/` gained only the r7 docs themselves) |
| GSC validation status | ➖ No new screenshot/export → carries over: redirect group (4) = **Started** (301 server-side backing live since r5); canonical group still Failed but **root cause fixed** (front `3f01510` deployed) → per parallel-session conclusion **do NOT re-validate**, let recrawl self-heal |
| Previous-owner spam URLs | ⚠️ Live 404 on all 4 variants (www + apex, both paths); still in Bing's index (2nd confirmation via valid control, day 8) |

## 1. Indexing Check (Bing first)

| Channel | Query | Result | Usable? |
|---|---|---|---|
| WebSearch | `site:balancebiketoddler.com/balance-bike-budget/` | 5 off-domain balance-bike articles (peggyomara ×2 / trekbikesblog / pookapages / adorablyperfect), 0 on-domain | ❌ `site:` operator ignored (known sandbox constraint, 8th consecutive) |
| WebSearch | `site:balancebiketoddler.com/balance-bike-stability/` | 5 off-domain articles (smallsmart ×2 / bisiklopedi / portcycling / bebeluxbaby), 0 on-domain | ❌ same |
| Bing (WebFetch) | `site:balancebiketoddler.com/balance-bike-budget/` | Returned canned Yandex-related Chinese content (m.yandex.com "search engine" entries), query-unrelated | ❌ tampered, void |
| Bing (WebFetch) | `site:balancebiketoddler.com/balance-bike-stability/` | **Well-formed localized no-results page**: "没有与此相关的结果: site:balancebiketoddler.com/balance-bike-stability/" | ⚠️ semi-usable: consistent with "stability not in Bing's index", but a single no-results cannot prove non-indexing given this sandbox's pollution history |
| Bing (WebFetch, whole-domain control) | `site:balancebiketoddler.com` | Site IS in the index: home / about / products / reviews + product detail pages (stroller-b078tbp298 / kids_bikes-b0b8mnbc5j / electric_vehicles-b0f5ghhdhc); no `/balance-bike-*` asset pages in top 10; both previous-owner spam URLs still listed | ✅ **valid this run** (first valid control since r6) |

**Interpretation:**

- This sandbox's `site:` path-query outputs remain untrustworthy (operator ignored / canned-content pollution), but **the whole-domain control was valid this run**, making the observation "site is in Bing's index, yet neither new path appears in the top 10" more reliable than in r7.
- The stability path query returned a **well-formed no-results page** (same as r4); combined with the valid control, **Bing-side evidence tilts slightly toward "stability not yet indexed"** — still not conclusive on its own (sandbox pollution history demands caution).
- The budget path query was tampered — no new information.
- Google-side best evidence remains the 10-12 Coverage export (14/271 indexed, 26-day plateau): both pages submitted 10-15, Request Indexing 10-16 → **most likely not yet indexed**; with GSC's 2-3 day lag, **now is exactly the visibility window (10-19~24)** — every run from today should first check for new exports.

## 2. Sitemap Self-Check

Fetch method: `curl -s --noproxy '*' https://balancebiketoddler.com/sitemap.xml` (clean path, no query, no cache-buster — the path Google actually fetches).

| Check | Expected | Measured | Verdict |
|---|---|---|---|
| HTTP status | 200 | 200 | ✅ |
| Content-Type | application/xml | `application/xml; charset=utf-8` | ✅ |
| URL count | 247 | **247** (delta 0) | ✅ |
| Contains balance-bike-budget | yes | yes | ✅ |
| Contains balance-bike-stability | yes | yes | ✅ |
| Contains `<priority>` | yes | **247/247** (distribution 1.0×1 / 0.9×9 / 0.8×1 / 0.6×77 / 0.4×159, identical to dist) | ✅ backend `f2046bf` still holding (6th consecutive run with full priority) |
| Not JSON / not 404 / not 260-URL old format | — | max lastmod = **2026-10-16T12:22:46.520Z** (8th consecutive match; no new content deployed since, as expected) | ✅ **no Worker interception recurrence, no edge staleness** |

**Conclusion: all seven checks green, no alert needed.** The 10-15/16 clean-path fix and priority fix have been stable for ~96 hours; the post-push auto-purge workflow's sitemap re-verification continues to hold (lastmod not drifting).

## 3. Health Check (optional, executed)

```
SCORE: 100/100  (pass 15, warn 0, fail 0 of 15)
```

robots.txt, sitemap.xml (247, delta 0), metadata on 15 key pages (incl. both new pages), llms.txt, **0 broken links** in the 15-link sample. The r4 transient network-flake false positive (fixed in front `c3a457f`) has not reproduced in 4 consecutive runs.

## 4. stable-track Migration (still no new GSC export)

- Checked `doc/` during the run: after 09:00 only today's r7 docs were added (previous run's output of this automation) — **no GSC Performance export**.
- No new evidence; r3/r5/r6/r7 conclusion carries over: **unconfirmed and mechanistically blocked** — the stability page itself is not indexed, so it cannot be selected as the landing page for "stable track"; the 10-15 baseline (`/` + `/products/balance-bikes/`) is presumed to hold.
- With GSC's 2-3 day lag, a Performance export including today (Query contains `stable track` → PAGES tab) should land **10-19~24**; this automation checks for new exports on every run and will analyze automatically once one lands.

## 5. GSC Page Indexing Background (known as of 2026-10-16, not re-queried)

- **Benign, no action**: "Alternate page with proper canonical tag" and "Page with redirect" — currency / www / underscore / guide variants are all properly canonicalized or 301-deduplicated.
- **Only remaining watch item**: top of Figure 2, "Validation failed (10/11→10/13)" — r3 confirmed the redirect group (4) is **Started** after the 10-16 re-VALIDATE FIX; the canonical group is still Failed. No new screenshot/export this run → status carries over.
- **Canonical group handling unchanged**: root cause (SPA hydration overwriting canonicals) fixed and deployed today (front `3f01510`) → **do NOT re-validate**; a user-visible Failed is a benign record, the trend is declining, recrawl will clear it.
- Redirect group: 301 server-side backing live since r5 (23/23); the next Coverage export should show Started → Passed.
- The `/auth/` noindex row (cookie-modal dead link, fixed in front `95b755f`) will clear naturally on Google's next crawl.

## 6. Recommended Next Steps (by priority)

1. **GSC URL Inspection on both new pages** (visibility window 10-19~24 now open): the only action that can authoritatively answer "indexed or not". If "Discovered – currently not indexed" or "Crawled – currently not indexed", Request Indexing can be clicked once more (already clicked 10-16; keep ≥1 week spacing).
2. **Export Performance (Query contains `stable track` → PAGES tab)** to verify the landing-page migration; drop it into `doc/` and this automation will analyze it automatically.
3. **Next Coverage export — watch for**: ① indexed count 14 → 15/16 (submission taking effect) ② redirect validation Started → Passed ③ canonical group count continuing to decline (self-heals post-fix, no intervention).
4. **Backlink building remains the only real lever**: the diagnostic chain (26-day plateau + 94% Discovered-not-indexed + zero backlinks) is unchanged; `doc/backlink-outreach-pack-2026-10-19_zh.md` (16 targets, 3 tiers, 4 email drafts) is ready to launch.
5. **(Optional) Bing Webmaster Tools removal** of the two previous-owner spam URLs (live 404 verified on all variants; still in Bing's index on day 8, re-confirmed via this run's valid control).
6. **(Optional) Backend**: no new to-dos — 301 routing (since r5), priority fix, and sitemap clean path all stable.

## 7. Run Archive (method & raw data)

- Sitemap: `curl -s --noproxy '*' -o /tmp/sitemap_check.xml https://balancebiketoddler.com/sitemap.xml` → 200 / `application/xml; charset=utf-8` / 39888 bytes; `grep -o '<loc>'` = 247; `grep -o '<priority>'` = 247; both new pages present; max lastmod = 2026-10-16T12:22:46.520Z (8th consecutive match).
- Two new pages: curl on HTML → 200 / `index,follow,max-image-preview:large` / self-canonical; titles "Budget Balance Bike: Cheap Picks That Last | BalanceBikeToddler" and "Stable Track Balance Bike: Track Width | BalanceBikeToddler".
- Search: WebSearch `site:` ×2 (operator ignored, 5 off-domain results each); WebFetch Bing path queries ×2 (budget tampered/void; stability well-formed no-results) + whole-domain control ×1 (**valid**: site in index, no `/balance-bike-*` pages in top 10, both spam URLs day 8 still listed).
- Health check: `npm run seo:health` ×1 → 100/100 (15/15).
- Spam URLs: `curl` ×4 → www + apex forms of `/panties/fashion-models-directory.php` and `/spanking/hardman-cnn-models.php` all 404 (live final status unchanged).
- IndexNow snapshot `scripts/seo/.last-indexnow.json`: updatedAt 2026-10-15T16:18:44.835Z unchanged, 247 URLs incl. both new pages.
- git (front): no new commits since r6 (HEAD still `9c00d2e`; the four r6/r7 docs remain untracked); this run made **zero changes**.
- GSC exports/screenshots: none new (`find doc -newermt "2026-10-19 09:00"` = only the r7 docs themselves).
