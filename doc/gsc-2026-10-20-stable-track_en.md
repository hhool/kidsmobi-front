# Indexing Check & "stable track" Landing-Page Migration Review — 2026-10-20 (r11)

> Nature: read-only verification + documentation. No site code modified. Run window 11:13–11:26 GMT+8.
> Context: 10-15/16 Worker sitemap-interception fix, budget/stability pages launched, IndexNow/Bing/Yandex/Seznam incremental submissions, three manual GSC actions on 10-16. On the evening of 10-19 the site published a 10-article batch (+15 URLs) and 4 CMS guides (+4 URLs) — **the sitemap baseline legitimately moved from 247 to 266**, the headline new fact of this run.

## 0. Executive Summary

| Check | Verdict |
|---|---|
| `/balance-bike-budget/` indexed | **Not confirmed**; unverifiable from this sandbox (§1); best Google-side evidence (10-12 Coverage, 14/271 plateau) points to not indexed |
| `/balance-bike-stability/` indexed | Same; and mechanistically it cannot be the stable-track landing page while unindexed |
| Sitemap self-check | **Healthy**: 200 / `application/xml` / **266 URLs** (not 247 — legitimate growth, breakdown in §2.1) / 266/266 carry `<priority>` / both new pages present / max lastmod 2026-10-19T19:04:35.959Z → no Worker interception recurrence, no edge staleness |
| `seo:health` | **97/100** (14 pass / 1 warn / 0 fail); the only WARN is a stale sitemap baseline in the script (hardcoded 247, delta +19 legitimate) — recommend updating the constant to 266 (code change, not made) |
| stable-track migration | **Unconfirmed**: no new GSC Performance export; baseline remains `/` + `/products/balance-bikes/` |
| "Validation failed" banner | No new screenshot/export; carries over r10: redirect group Started (expect Passed on next Coverage export); canonical group root-caused + fixed (`3f01510`), self-healing — **do NOT re-validate** |

## 1. Indexing Check (Bing priority)

Sandbox pollution of search-engine queries reproduced for the 11th+ time; the **whole-domain control was valid**:

| Probe | Result | Read |
|---|---|---|
| WebSearch `site:.../balance-bike-budget/` | 5 off-domain results, 0 on-domain | `site:` operator ignored (11th time; known sandbox behavior) |
| WebSearch `site:.../balance-bike-stability/` | 5 off-domain results, 0 on-domain | Same (12th time) |
| Bing `site:.../balance-bike-budget/` (WebFetch) | Zhihu/Baidu CATIA canned spam | Query replaced by pollution, **probe void** |
| Bing `site:.../balance-bike-stability/` (WebFetch) | Baidu/Zhihu Windows canned spam | Same, **probe void** |
| Bing `site:balancebiketoddler.com` (whole-domain control) | **Valid**: home, /products, /about, /reviews, /products/electric-cars, 2 product details in index; `/balance-bike-budget/`, `/balance-bike-stability/` and the 10-19 /guides/ + /news/ articles all absent from top results; 1 previous-owner spam URL (panties, day 11) still listed | Site as a whole is in Bing's index; **both asset pages and new articles absent from Bing top results** |

**Verdict**: indexing of the two new pages is not directly verifiable from this sandbox; combining ① absence of asset pages from Bing whole-domain results and ② the 10-12 Coverage plateau (14/271, stability still in the Discovered pool), the working conclusion is **neither budget nor stability is indexed yet**, and the 19 URLs published on 10-19 will not surface immediately. GSC lags 2–3 days (this property's Coverage lags ~6–7 days); a **deterministic read comes with the 10-22~24 exports**.

## 2. Sitemap Self-Check

`curl --noproxy '*'` (no query) on `https://balancebiketoddler.com/sitemap.xml`:

- **HTTP 200**, Content-Type `application/xml; charset=utf-8` (not JSON, not 404 → Worker interception NOT recurring)
- **266 URLs total** (not the 247 in the task brief, not the 260 alarm line — it is the new legitimate baseline after two publishes on 10-19/20)
- **266/266 carry `<priority>`** (distribution 1.0×1 / 0.9×9 / 0.8×1 / 0.6×96 / 0.4×159; all 19 new URLs at 0.6)
- Contains `balance-bike-budget` ✓, contains `balance-bike-stability` ✓
- max lastmod = **2026-10-19T19:04:35.959Z** (refreshed with the batch deploy → edge cache not stale; 10-15/16 fixes stable for ~104h+)
- Live sitemap URL set == local `dist/sitemap.xml` build output, **diff = 0** (42,804 vs 42,805 bytes = one trailing newline)

### 2.1 Composition of 247 → 266 (all legitimate; every new URL live 200)

| Source | Commit | Count | URLs |
|---|---|---|---|
| Baseline | — | 247 | 10-15 IndexNow snapshot set |
| 10-article batch | `47c2724` (10-19 23:45) | +15 | 5 guides topic indexes (budget/scenario/risk/maintenance/special) + 6 guides (price-tiers, vs-training-wheels, where-to-ride, safety-checks, maintenance, extra-support) + 4 news (science/industry/new_product/brand_news) |
| 4 CMS guides | `f3a2824` (10-20 03:10) | +4 | /guides/beginner/balance-bike-size-chart, /guides/beginner/balance-bike-weight, /guides/risk/balance-bike-safety-standards, /guides/risk/balance-bike-recalls (backing the footer's new Sizing & Buying Guide column) |
| **Total** | | **266** | All 19 new URLs individually curl-verified this run: **all 200** |

### 2.2 One minor deviation (no alarm)

**10 of 266 URLs lack `<lastmod>`**: 7 top-level asset hubs (budget, by-age, safety-standards, size-chart, **stability**, weight, what-buyers-say) + /safety/balance-bike-recalls/ + 2 transparency pages. Static/hub pages; Google does not penalize missing lastmod. Optional backend backfill of fixed lastmods for static routes (low priority).

## 3. Health Check (`npm run seo:health`, executed)

**SCORE 97/100 (pass 14 / warn 1 / fail 0)**; the only change from yesterday's 100/100:

```
[WARN] sitemap.xml: 266 URLs (baseline 247, delta +19)
```

- Verdict: **false positive**. The script's sitemap baseline constant is hardcoded at 247 and was not updated for the legitimate 10-19/20 publishes; §2 proves 266 is correct.
- Recommendation (code change, not made per task constraints): update the baseline constant in `scripts/seo/site-health-check.mjs` to 266; going forward, sync it after every batch publish — or better, compare against the dist build instead of a hardcoded number.
- All other 14 checks pass: both asset pages have full TDK/canonical/JSON-LD; robots.txt 200 and declares the sitemap; llms.txt 1,137 bytes; internal-link sample of 15 with broken=0.

## 4. Stable-Track Migration Assessment

- No new GSC export found in `doc/` after 17:00 (only parallel-workstream article-plan / backlink docs). **No Performance export → migration unconfirmed**.
- 10-15 baseline stands: stable-track landing pages remain `/` + `/products/balance-bikes/`.
- Mechanistic blocker unchanged: stability page not confirmed indexed → it cannot be the landing page. The 10-19 batch pages were deliberately interlinked (G1 /guides/budget/balance-bike-price-tiers and G3 /guides/scenario/where-to-ride-balance-bike both link to the asset pages with stable-track-relevant anchors), which should accelerate migration once indexed.
- GSC visibility window 10-19~24 is open: export Performance (Query contains "stable track" → PAGES) and Coverage inside it — that is the first chance to observe migration starting.

## 5. GSC Page Indexing Background (known as of 2026-10-16, not re-queried)

- "Alternate page with proper canonical tag" = 9 and "Page with redirect" = 4 remain benign (currency/www/underscore/guide variants correctly canonicalized/301-deduplicated); no action needed.
- "Validation failed (10/11→10/13)": no new screenshot/export; r10 conclusions carry over —
  - redirect group (4): Started; server-side 301 backing live since r5; expect **Passed** on the next Coverage export (~10-22~24);
  - canonical group (9): root cause (SPA canonical overwrite) fixed and deployed (`3f01510`), trend 6→4→…→0 self-healing; **no further VALIDATE FIX needed**.
- If a new screenshot arrives: only check whether the redirect group flipped to Passed; if the canonical group has not regressed, keep observing.

## 6. Recommended Next Steps (by priority)

1. **Export GSC Performance + Coverage on 10-22~24** (user action): Query contains "stable track" → PAGES, verify whether `/balance-bike-stability/` starts appearing as a landing page; also whether indexed count leaves the 14/271 plateau and stability leaves the Discovered pool.
2. **Update the seo:health sitemap baseline constant 247 → 266** (one-line change; sync after each batch publish going forward).
3. (Optional) Backend sitemap generator: emit lastmods for the 10 static routes.
4. Keep the IndexNow cadence: this batch's 266 URLs were submitted 10-19 19:46 (snapshot updatedAt proves it); key file live 200.
5. Previous-owner spam URL (panties/fashion-models-directory.php) sits in Bing's index for day 11, live status 404 unchanged; Bing removal request still pending (low priority, no self-serve channel).

## 7. Run Archive (method & raw data)

- Environment constraint (carried over r1~r10, reconfirmed): WebSearch ignores `site:`; Bing `site:` via WebFetch gets replaced by canned spam (this run budget→CATIA spam, stability→Windows spam); whole-domain control valid (4th consecutive valid control).
- Raw data: live sitemap 266 URLs / 266 priorities / 256 lastmods / both new pages listed; 19 new URLs all 200; both asset pages 200 + `index,follow,max-image-preview:large` + self-canonical + correct titles ("Budget Balance Bike: Cheap Picks That Last" / "Stable Track Balance Bike: Track Width"); IndexNow key 200; seo:health 97/100.
- No site code modified; working tree gained only the zh/en docs in this folder.
