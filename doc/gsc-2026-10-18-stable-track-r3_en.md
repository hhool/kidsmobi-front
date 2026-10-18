# Indexing Check & "stable track" Migration Review — 2026-10-18, Run 3 (r3)

> Related: `doc/gsc-2026-10-18-stable-track_en.md` (runs 1 & 2 today, §1-§9), `doc/gsc-coverage-2026-10-18-analysis_en.md` (parallel session's deep analysis of the GSC Coverage export that landed at 21:30)
> Nature: read-only verification + documentation. No site code modified.
> Run window: 2026-10-18 21:32-21:50 (GMT+8). This is the third automated run of the day; conclusions are incremental to the two documents above.

## 0. Summary

| Check | Result |
|---|---|
| `/balance-bike-budget/` live state | ✅ 200, `index,follow`, self-canonical, correct title |
| `/balance-bike-stability/` live state | ✅ 200, `index,follow`, self-canonical, correct title |
| Are the two pages indexed? | ❌ Unconfirmed, most likely **not indexed**. Bing `site:` on both paths returns "no results" (but the operator is unreliable, §1); the new GSC export (data through 10-12, §4) shows only **14/271** indexed site-wide with a 26-day plateau — both pages were only submitted 10-15, so they almost certainly still sit in the 242 "Discovered - currently not indexed". Authoritative confirmation needs GSC URL Inspection (10-19~24) |
| sitemap.xml | ✅ 200 + `application/xml` + **247 URLs** + **247/247 carry `<priority>`** (backend `f2046bf` still in effect; distribution identical to dist) + contains both new pages + max lastmod 2026-10-16T12:22:46.520Z (unchanged since yesterday — no new content deployed, expected) → **Worker interception not recurring, edge cache not stale** |
| `npm run seo:health` | ✅ **100/100** (15/15 pass, incl. both new pages' metadata + 15 sampled internal links, 0 broken). No regression |
| stable-track landing-page migration | ⏳ Unconfirmed, and **blocked mechanistically**: the stability page isn't indexed itself, so it cannot be the landing page for "stable track"; the 10-15 baseline (`/` + `/products/balance-bikes/`) should still hold. Await a GSC Performance export (Query contains `stable track` → PAGES) |
| GSC validation status | 🆕 First direct evidence: redirect group (4) = **Started** (the user's 10-16 re-VALIDATE FIX was accepted by Google and is running); canonical group (9) = **still Failed**; noindex (1) = `/auth/` (cookie dead link — fixed and verified live) |

## 1. Indexing check (Bing first)

| Channel | Query | Result | Usable? |
|---|---|---|---|
| WebSearch | `site:…/balance-bike-budget/` | 5 off-domain balance-bike articles (peggyomara, trekbikesblog, pookapages, adorablyperfect) | ❌ `site:` operator ignored (same as prior runs) |
| WebSearch | `site:…/balance-bike-stability/` | 5 off-domain articles (smallsmart, bisiklopedi, portcycling, bebeluxbaby) | ❌ same |
| Bing (via WebFetch) | `site:…/balance-bike-budget/` | **"没有与此相关的结果"** (well-formed no-results page) | ⚠️ see verdict |
| Bing (via WebFetch) | `site:…/balance-bike-stability/` | **"結果がありません"** (JP locale, same meaning) | ⚠️ same |
| Bing control ① (whole domain) | `site:balancebiketoddler.com` | 10 genuine results: home, /about, /products, /reviews + 3 product detail pages | ✅ **the site IS in Bing's index** |
| Bing control ② (old page) | `site:…/balance-bike-size-chart/` | Returned Zhihu hip-hop threads — completely unrelated canned content | ❌ network-layer tampering; control voided |

**Verdict:**

- The whole-domain control proves Bing indexes this site; the two new-path queries returned well-formed localized no-results pages (not canned spam), but Bing's `site:` path filtering is a known-unreliable operator and the old-page control was polluted, so **the two "no results" cannot prove non-indexing — nor can they prove indexing**. Same conclusion as yesterday (§1.1).
- No `/balance-bike-*` asset page appears anywhere in the whole-domain top 10 — consistent with asset pages not yet being in Bing's index, but a top-10 list is not proof.
- **Persisting item:** the two previous-owner spam URLs (`/panties/fashion-models-directory.php`, `/spanking/hardman-cnn-models.php`) are **still in Bing's index** (day 6; positions 5-6 of the whole-domain results). Both 404 live and will clear naturally; optional acceleration: Bing Webmaster Tools removal request (user-side, ~1 min).
- **New Google-side evidence (§4):** the GSC Coverage export that landed at 21:30 upgrades "probably not indexed" from inference to a high-confidence judgment via the official channel.

## 2. Sitemap self-check

Fetch: `curl --noproxy '*' https://balancebiketoddler.com/sitemap.xml` (no query, no cache-buster — the path Google actually crawls).

| Check | Expected | Observed | Verdict |
|---|---|---|---|
| HTTP status | 200 | 200 | ✅ |
| Content-Type | application/xml | `application/xml; charset=utf-8` | ✅ |
| URL count | 247 | **247** (matches `SITEMAP_BASELINE_COUNT=247`, delta 0) | ✅ |
| Contains balance-bike-budget | yes | yes | ✅ |
| Contains balance-bike-stability | yes | yes | ✅ |
| Contains `<priority>` | yes | **247/247** | ✅ backend `f2046bf` still in effect |
| Priority distribution | identical to dist | live: 1.0×1 / 0.9×9 / 0.8×1 / 0.6×77 / 0.4×159; dist: **identical**; URL-set `diff` = 0 | ✅ two sources fully aligned |
| Not JSON / not 404 / not 260-old-format | — | max lastmod = **2026-10-16T12:22:46.520Z** (same as yesterday; no content deployed since, expected) | ✅ **Worker interception not recurring, edge cache not stale** |

**Conclusion: all six sitemap checks green — no alert needed.** Yesterday's §8 priority fix held through 24h of live verification.

## 3. Health check (optional, executed)

```
SCORE: 100/100  (pass 15, warn 0, fail 0 of 15)
```

robots.txt, sitemap.xml (247, delta 0), 15 key pages' metadata (incl. both new pages), llms.txt (1137B), 15 sampled internal links 0 broken — fully consistent with the 10-16 weekly report and both earlier runs today. **No regression.**

## 4. Cross-validation with the new GSC Coverage export (landed 21:30; deep analysis by parallel session)

Mid-run, a new export arrived at `doc/gsc-coverage-2026-10-18-export/` (Chart.csv / Critical issues.csv / Metadata.csv / Non-critical issues.csv / coverage-forensics.json); the parallel session produced the analysis (`gsc-coverage-2026-10-18-analysis_{zh,en}.md`, commit `cdceb26`). Task-relevant cross-validation:

1. **Data through 2026-10-12** — predates the 10-15 IndexNow re-push and 10-16 Request Indexing; submission effects first readable **10-19~24**.
2. **Indexing status: 14/271, plateaued since 09-22 (26 days)** (brief dip to 13 on 10-05~09, back to 14). Both new pages only entered Google's view on 10-15, so they almost certainly remain in the 242 "Discovered - currently not indexed" — directionally consistent with the Bing-side evidence in §1.
3. **stable-track migration: blocked mechanistically.** An unindexed stability page cannot be selected as the landing page for "stable track"; the 10-15 baseline (`/` + `/products/balance-bikes/`) should still hold. Verify with a Performance export (Query contains `stable track` → PAGES tab).
4. **Validation statuses (answer to task item 5):**
   - "Page with redirect" (4): **Started** — the user's 10-16 re-VALIDATE FIX was accepted by Google and validation is running. First direct evidence of progress in three days; just wait for the cycle (usually days) to flip to Passed.
   - "Alternate page with proper canonical tag" (9): **still Failed** — benign background unchanged (currency/www/underscore/guide variants correctly canonicalized or 301'd), but validation hasn't passed. Next step: user expands the row in GSC, copies the 9 URLs, and pastes them for pattern identification.
   - "Excluded by 'noindex' tag" (1) = **`/auth/`** (cookie modal Privacy Policy dead link). Fix front `95b755f` **verified live this run**: the modal now links to `/transparency/privacy-policy/` (200, in sitemap); `/auth/` itself is 404 + noindex, so the exclusion row will clear on Google's next crawl.
5. **Pruned-listing 301 fix (backend `7a4f4db`) measured still NOT deployed**: sample `/products/balance-bikes/balance_bike-b0bkxshhnp/` still returns **404** (expected: 301 to the survivor). This is the top pending site-side to-do — these URLs have been advertised in the sitemap for 3 weeks and every 404 burns discovery equity. Deployment needs a CF token (user-provided or self-run; command in the coverage analysis §6.3).

## 5. GSC Page indexing background (known 2026-10-16, not re-queried)

- **Benign, no action needed:** "Alternate page with proper canonical tag" (9) and "Page with redirect" (4) — currency / www / underscore / guide variants all correctly canonicalized or 301'd; behavior verified on 10-13.
- **Status update vs. the 10-16 screenshot:** redirect group Failed → **Started** (§4.4); canonical group **still Failed**; new noindex row (1) (= /auth/, fixed, §4.4).

## 6. Next steps (by priority)

1. **Deploy backend `7a4f4db`** (301s for 23 pruned listings) — the only pending site-side fix; measured still not live this run.
2. **10-19~24**: GSC URL Inspection on both pages; export a Performance report (Query contains `stable track` → PAGES) to verify the landing-page migration.
3. **Canonical group still Failed**: user copies the 9 URLs from GSC for pattern analysis; leaving it also only means the benign rows persist.
4. **Redirect group Started**: wait for the cycle to flip to Passed; if still Started after several days, click VALIDATE FIX again.
5. **Backlink building** (the only real lever): the coverage analysis §7 diagnostic chain (26-day plateau + 94% Discovered-not-indexed + zero backlinks) shows submission-type actions cannot move the indexing ceiling before external demand signals appear.
6. **(Optional) Bing Webmaster Tools removal** for the two previous-owner spam URLs (day 6 still indexed; natural clearance otherwise).
7. **On the next Coverage export, check**: ① indexed 14 → 15/16 (submissions taking effect) ② redirect validation → Passed ③ canonical still Failed?

## 7. Run archive (methods & raw data)

- Sitemap: `curl -s --noproxy '*' -w "HTTP:%{http_code} CT:%{content_type}" https://balancebiketoddler.com/sitemap.xml` → 200 / `application/xml; charset=utf-8` / 39888 bytes; `grep -o '<loc>' | wc -l` = 247; `grep -o '<priority>' | wc -l` = 247; priority distribution identical tier-by-tier to `dist/sitemap.xml`; URL-set diff empty.
- Both pages: direct curl → 200 / `index,follow,max-image-preview:large` / self-canonical; titles "Budget Balance Bike: Cheap Picks That Last" and "Stable Track Balance Bike: Track Width".
- Bing: WebFetch on `www.bing.com/search?q=site:…` ×4 (two new paths + whole-domain control + old-page control).
- Health check: `npm run seo:health` → 100/100 (15/15).
- GSC export: `doc/gsc-coverage-2026-10-18-export/` (landed 21:30, fetchedAt 2026-10-18T13:10:41.335Z); all 6 rows of Critical issues.csv cross-checked; Chart.csv data ends 10-12.
- /auth/ fix verification: cookie modal privacy link = `/transparency/privacy-policy/` (200); `/auth/` = 404 + `noindex,nofollow`.
- 301 deploy verification: `/products/balance-bikes/balance_bike-b0bkxshhnp/` = 404 (not deployed); `/products/balance-bikes/balance_bike-b0blmf98s8/` is in the sitemap and 200 (not pruned — normal).
- IndexNow snapshot `scripts/seo/.last-indexnow.json`: updatedAt 2026-10-15T16:18:44.835Z unchanged (no new submissions — expected).
- git HEAD: `cdceb26` (parallel session's coverage analysis); **zero site-side changes this run**.
