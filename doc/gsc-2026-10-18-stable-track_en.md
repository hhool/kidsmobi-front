# Indexing Check & "stable track" Migration Assessment — 2026-10-18

> Related: `doc/gsc-2026-10-15-stable-track_en.md` (stable-track baseline export), `doc/stable-track-query-resolution_en.md` (remediation plan), `doc/seo-weekly-2026-10-16_en.md` (weekly health baseline)
> Nature: read-only verification + documentation. No site code was modified.

## 0. Executive Summary

| Check | Result |
|---|---|
| `/balance-bike-budget/` live status | ✅ 200, `index,follow`, correct canonical |
| `/balance-bike-stability/` live status | ✅ 200, `index,follow`, correct canonical, H1 contains "stable track balance bike" |
| Are both pages indexed (Bing/Google) | ⚠️ **Not reliably verifiable from this environment** (search-engine queries are intercepted at the network layer — see §1). Needs GSC / a normal-network `site:` check |
| sitemap.xml | ✅ 200 + `application/xml` + **247 URLs** + both new pages present + fresh lastmod (2026-10-16) — **no Worker interception recurrence**; ⚠️ no `<priority>` tags (format deviation, see §2) |
| `npm run seo:health` | ✅ **100/100** (14/14 pass) |
| stable-track landing-page migration | ⏳ Not confirmed. 10-15 baseline is still `/` + `/products/balance-bikes/`; no new export — must wait for GSC (2-3 day lag; recheck 10-19~20) |
| GSC Page indexing "Validation failed" | ⏳ No new screenshot/export provided; cannot confirm whether it passed |

## 1. Indexing Check (Bing first) — environment-blocked, no direct evidence obtained

The task's planned path (web-search `site:` queries for both pages) was **interfered with at the network layer** throughout this sandbox. Full log:

| Channel | Result | Usable? |
|---|---|---|
| WebSearch `site:balancebiketoddler.com/balance-bike-budget/` | 5 results, all **other sites'** balance-bike articles; none from this domain | ❌ `site:` operator not honored |
| WebSearch `site:balancebiketoddler.com/balance-bike-stability/` | Same — all off-domain | ❌ |
| curl Bing (www→cn.bing.com) HTML | Results entirely unrelated to the query (Baidu Zhidao / Zhihu software topics) — query-level canned responses | ❌ tampered |
| curl Bing `format=rss` | Same unrelated Chinese pages (a `site:` query can never return Baidu Zhidao pages) | ❌ |
| Seznam `site:.../balance-bike-budget/` | Returned `/`, `/products/balance-bikes/`, `/about` | ⚠️ see control below |
| Seznam control (`site:.../balance-bike-size-chart/`, an older definitely-indexed page) | **Same three pages**, size-chart absent | ❌ proves Seznam's `site:` path filtering is inert from this client; the three pages are just top-level domain hits |
| DuckDuckGo / Brave / Yahoo / Startpage | Connection failed (HTTP 000) | ❌ |
| Mojeek | 403 | ❌ |
| Yandex | 302 (captcha/redirect) | ❌ |
| Wayback Machine (archive.org) | Connection timeout | ❌ |

**Indirect evidence (all positive):**

- Both pages return 200 with `<meta name="robots" content="index,follow,max-image-preview:large">`, self-referencing canonicals, and no noindex/noarchive.
- Both pages are among the 247 URLs in the live sitemap.xml (§2).
- The IndexNow delta snapshot `scripts/seo/.last-indexnow.json` (updatedAt **2026-10-15T16:18:44Z**) holds all 247 URLs **including both new pages** — i.e., both URLs were submitted to IndexNow/Bing/Yandex/Seznam on 10-15.
- IndexNow key file `dfb12ac97ad4a34c75ccf6cc4b783c7f.txt` → 200 (submission channel healthy).
- 10-16 weekly health check: 100/100; `/balance-bike-stability/` key meta (title/desc/keywords/canonical/JSON-LD) all present.
- Semrush site audit (10-16): sitemap 200, valid XML, 247/247 pages 200, 0 errors.

**Conclusion:** "Crawlable, submitted, unobstructed" is confirmed; "indexed" is **not verifiable from this environment**. The task's fallback was to defer to Bing `site:` — that channel is polluted here, so **no verdict is issued** on it. Authoritative answers: ① GSC URL Inspection (2-3 day lag; the user's 10-16 Request Indexing should surface **~10-19~20**); ② user runs `site:balancebiketoddler.com/balance-bike-budget/` and `site:balancebiketoddler.com/balance-bike-stability/` on a normal network.

## 2. Sitemap Self-Check — freshness restored, one format deviation

Fetched via `curl --noproxy '*' https://balancebiketoddler.com/sitemap.xml` (no query, no cache-buster).

| Check | Expected | Actual | Verdict |
|---|---|---|---|
| HTTP status | 200 | 200 | ✅ |
| Content-Type | application/xml | `application/xml; charset=utf-8` | ✅ |
| URL count | 247 | **247** (matches `SITEMAP_BASELINE_COUNT=247`, delta 0) | ✅ |
| Contains balance-bike-budget | yes | yes | ✅ |
| Contains balance-bike-stability | yes | yes | ✅ |
| Not the 260-URL legacy format / not JSON / not 404 | — | Max lastmod = **2026-10-16T12:22:46.520Z**; 237/247 carry lastmod | ✅ **no Worker interception recurrence, edge cache not stale** |
| Contains `<priority>` | yes | **0/247 entries carry priority** | ⚠️ deviation, see below |

**Analysis of the missing `<priority>`:**

- The repo's prerender generator (`scripts/prerender-pages.ts`, `sitemapPriority()`) emits `<priority>` for **every** URL (assets 0.9, balance-bike-* 0.8, balance-bike detail 0.6, etc.) — provable from the local `dist/sitemap.xml` (built 10-17 01:58).
- The live sitemap is compact single-line, carries lastmod on home (the dist build does not, due to a `/` route-key quirk in the repo generator), and has no priority anywhere — **the live sitemap is produced by the backend Worker's D1 generator, not the Pages static file**. Per the code comment, Worker-primary with the Pages file as fallback is the designed architecture ("The API worker uses this Pages-hosted file as a zero-D1 fallback").
- Impact: **low**. Google officially treats `<priority>` as a weak hint; it barely affects crawling or ranking, and Semrush's 10-16 full crawl (247/247 OK) proves no crawl obstruction. The 10-15 alert criteria (JSON / 404 / 260-URL legacy format) are all absent — **no alarm warranted**.
- Optional alignment (backend Worker repo, not this front repo): add priority tiers to the Worker's sitemap generator, or have the clean `/sitemap.xml` path return the Pages static file.

**Side note (pre-existing, not new):** 10 URLs lack lastmod — all asset/transparency pages (budget, by-age, safety-standards, size-chart, stability, weight, what-buyers-say, recalls, review-count-integrity, search-data). The repo generator also omits lastmod for these routes; this is by design, not a regression.

## 3. Health Check (optional step, executed)

`node scripts/seo/site-health-check.mjs` (a.k.a. `npm run seo:health`; sandbox outbound network was fine, no retry needed):

```
SCORE: 100/100  (pass 14, warn 0, fail 0 of 14)
```

robots.txt (200, `Sitemap:` + `User-agent: *`), sitemap.xml (247, delta 0), 11 key pages' meta (including `/balance-bike-stability/`), llms.txt (1137B), 15 sampled internal links 0 broken — all green. Consistent with the 10-16 weekly report; no regression.

Minor suggestion (this repo): `site-health-check.mjs`'s `KEY_URLS` includes `/balance-bike-stability/` but **not** `/balance-bike-budget/`; add the budget page to the list so its meta enters weekly automated monitoring.

## 4. "stable track" Landing-Page Migration Assessment

**No new GSC "Performance on Search" export was attached to this task**, and the Bing `site:` fallback is unusable here (§1). Migration is therefore **unconfirmed**; assessment rests on the 10-15 baseline plus the timeline:

- **10-15 baseline (most recent valid data):** landing pages only `/products/balance-bikes/` (5 impressions, avg pos 11.8) + `/` (1 impression, pos 14); `/balance-bike-stability/` **absent** from the Pages list.
- **Favorable changes since 10-15:** ① clean-path sitemap fix + post-push purge re-verification workflow (10-15/16, confirmed effective in §2); ② IndexNow incremental resubmission including both new pages (10-15 16:18 snapshot); ③ user's 10-16 GSC Request Indexing for budget + stability; ④ the stability page's title/H1/anchor exact-phrase fixes (`5410fbf`) were already live before the 10-15 export.
- **Verdict:** these conditions suffice for Google to re-evaluate the asset, but attribution migration (Hub → asset) must be proven by GSC data. **2-3 day lag → recheck 10-19~20**: Performance → Query contains `stable track` → **PAGES** tab; look for `/balance-bike-stability/` to start appearing.
- If it still sits on the Hub then: per `stable-track-query-resolution`'s follow-up options, consider converting the Hub's stability paragraph into a summary + link to the asset, or add a body-text internal link from the homepage (today the homepage only has the footer link).
- Scale caveat (carried from 10-15): this cluster saw just 6 impressions/24h — noise-level; do not over-optimize. The volume remains toddler / by-age (94.7% of demand).

## 5. GSC Page Indexing Background (known as of 2026-10-16, not re-investigated)

- **Benign, no action:** Fig. 1 "Alternate page with proper canonical tag" = 9 pages; Fig. 2 "Page with redirect" = 4 pages — currency / www / underscore (`/products/balance_bike` → 301) / guide variants are all correctly canonicalized or 301-deduplicated; the 10-13 analysis already verified the live behavior, and duplicate rows will fade naturally.
- **Sole open item:** Fig. 2's top line "**Validation failed (10/11→10/13)**". The user manually re-ran VALIDATE FIX on 10-16, but **no new GSC screenshot/export was attached to this task, so pass/fail could not be confirmed**. Check it when the user next provides a Page indexing screenshot; if still failing: click VALIDATE FIX once more (validation cycles typically take days), or inspect whether the 301 chains of those 4 redirect variants land on the canonical version.

## 6. Recommended Next Steps (priority order)

1. **10-19~20:** GSC URL Inspection for `/balance-bike-budget/` and `/balance-bike-stability/`; export Performance (Query contains `stable track` → PAGES) to verify whether landing pages have started migrating.
2. **Normal network:** run `site:balancebiketoddler.com/balance-bike-budget/` and `site:balancebiketoddler.com/balance-bike-stability/` to supply the direct Bing indexing evidence this environment could not.
3. **(Backend, optional)** Add `<priority>` tiers to the Worker's sitemap generator, or serve the clean path from the Pages sitemap — low priority; Google largely ignores the field.
4. **(This repo, optional)** Add `/balance-bike-budget/` to `KEY_URLS` in `site-health-check.mjs`.
5. **When new GSC screenshots arrive:** check whether "Validation failed" flipped to passed; if not, re-trigger validation or debug the redirect-variant chains.
