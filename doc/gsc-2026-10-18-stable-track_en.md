# Indexing Check & "stable track" Migration Assessment — 2026-10-18

> Related: `doc/gsc-2026-10-15-stable-track_en.md` (stable-track baseline export), `doc/stable-track-query-resolution_en.md` (remediation plan), `doc/seo-weekly-2026-10-16_en.md` (weekly health baseline)
> Nature: read-only verification + documentation. No site code was modified.

## 0. Executive Summary

| Check | Result |
|---|---|
| `/balance-bike-budget/` live status | ✅ 200, `index,follow`, correct canonical |
| `/balance-bike-stability/` live status | ✅ 200, `index,follow`, correct canonical, H1 contains "stable track balance bike" |
| Are both pages indexed (Bing/Google) | ⚠️ Bing `site:` direct queries (10-18 evening WebFetch channel, §1.1): both URLs return "no results" — but Bing's `site:` path filtering is unreliable and cannot prove non-indexing; Google side still awaits GSC (10-19~20) |
| sitemap.xml | ✅ 200 + `application/xml` + **247 URLs** + both new pages present + fresh lastmod (2026-10-16) — **no Worker interception recurrence**; ✅ missing `<priority>` deviation fixed in code (backend `f2046bf`, see §2; goes live after the manual Worker deploy) |
| `npm run seo:health` | ✅ **100/100** (15/15 pass; budget page added to KEY_URLS) |
| stable-track landing-page migration | ⏳ Not confirmed. 10-15 baseline is still `/` + `/products/balance-bikes/`; no new export — must wait for GSC (2-3 day lag; recheck 10-19~20) |
| GSC Page indexing "Validation failed" | ⏳ No new screenshot/export provided; cannot confirm whether it passed |

## 1. Indexing Check (Bing first) — environment-blocked in the morning; channel opened in the evening (see §1.1)

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

### 1.1 Follow-up (2026-10-18 20:30) — WebFetch channel opened; direct Bing evidence obtained

The morning log's network-layer interference only affected curl / WebSearch; switching to WebFetch against `www.bing.com/search` went straight through that evening. Results:

| Query | Bing response |
|---|---|
| `site:balancebiketoddler.com/balance-bike-budget/` | **"There are no results for …"** |
| `site:balancebiketoddler.com/balance-bike-stability/` | **"There are no results for …"** |
| `site:balancebiketoddler.com` (whole-domain control) | Normal results: home, `/about`, `/products`, `/reviews` plus several detail pages listed |

**Reading (important caveat):**

- The whole-domain control proves Bing's index **does** hold this site; two empty `site:` path queries do **not** mean the pages are unindexed — Bing's `site:` path filtering is famously incomplete, and both pages were only submitted via IndexNow on 10-15, so a multi-week Bing lag is normal.
- The morning verdict stands unchanged: **"crawlable, submitted, unobstructed" confirmed; "indexed" still unproven**. The only authoritative Google-side channel remains GSC URL Inspection (10-19~20).
- The task's "normal-network `site:` recheck" goal is therefore **partially achieved** (Bing side now has direct responses); a user-side manual check can still serve as cross-confirmation — item 2 below is worth keeping.

**Unexpected finding (security check, live risk ruled out):** the whole-domain Bing results surfaced two spam-injection-style URLs — `/panties/fashion-models-directory.php` and `/spanking/hardman-cnn-models.php` (spam pages wearing this site's title and description). Live probes: www 301 → apex, apex returns **404** (SPA fallback) on both — **the site is not currently compromised; this is stale Bing index residue**. Optional user-side action: file URL-removal requests for both in Bing Webmaster Tools to accelerate cleanup; treat any 200 variant as an intrusion and respond accordingly.

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
| Contains `<priority>` | yes | 0/247 (morning measurement) | ✅ fixed, see below |

**Analysis of the missing `<priority>`:**

- The repo's prerender generator (`scripts/prerender-pages.ts`, `sitemapPriority()`) emits `<priority>` for **every** URL (assets 0.9, balance-bike-* 0.8, balance-bike detail 0.6, etc.) — provable from the local `dist/sitemap.xml` (built 10-17 01:58).
- The live sitemap is compact single-line, carries lastmod on home (the dist build does not, due to a `/` route-key quirk in the repo generator), and has no priority anywhere — **the live sitemap is produced by the backend Worker's D1 generator, not the Pages static file**. Per the code comment, Worker-primary with the Pages file as fallback is the designed architecture ("The API worker uses this Pages-hosted file as a zero-D1 fallback").
- Impact: **low**. Google officially treats `<priority>` as a weak hint; it barely affects crawling or ranking, and Semrush's 10-16 full crawl (247/247 OK) proves no crawl obstruction. The 10-15 alert criteria (JSON / 404 / 260-URL legacy format) are all absent — **no alarm warranted**.
- **Fixed (2026-10-18, backend commit `f2046bf`):** the "add priority tiers" option was taken — the Worker generator gains `sitemapPriority()`, tier-for-tier identical to front's `prerender-pages.ts` (1.0 / 0.9 / 0.8 / 0.6 / 0.4); tsc clean. The Worker deploys **manually** (`cd backend/api/worker && npx wrangler deploy`, requires `CLOUDFLARE_API_TOKEN`); after deploy the live sitemap's priority distribution matches the dist build exactly. Until then the live sitemap still carries 0 priority tags. The alternative (serve the clean path from the Pages static file) was not adopted.

**Side note (pre-existing, not new):** 10 URLs lack lastmod — all asset/transparency pages (budget, by-age, safety-standards, size-chart, stability, weight, what-buyers-say, recalls, review-count-integrity, search-data). The repo generator also omits lastmod for these routes; this is by design, not a regression.

## 3. Health Check (optional step, executed)

`node scripts/seo/site-health-check.mjs` (a.k.a. `npm run seo:health`; sandbox outbound network was fine, no retry needed):

```
SCORE: 100/100  (pass 15, warn 0, fail 0 of 15)
```

robots.txt (200, `Sitemap:` + `User-agent: *`), sitemap.xml (247, delta 0), 12 key pages' meta (now including both `/balance-bike-stability/` and `/balance-bike-budget/`), llms.txt (1137B), 15 sampled internal links 0 broken — all green. Consistent with the 10-16 weekly report; no regression.

**Suggestion implemented (2026-10-18, front commit `595c53e`):** `/balance-bike-budget/` was added to `KEY_URLS`; the weekly check grew from 14 to 15 items and re-ran at 100/100 — the new page's meta is now under weekly automated monitoring.

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
2. ~~**Normal network:** run `site:balancebiketoddler.com/balance-bike-budget/` and `site:balancebiketoddler.com/balance-bike-stability/`~~ ✅ **Done via follow-up (10-18 evening, WebFetch channel opened, §1.1)**: both paths return "no results", the whole domain is listed — direct Bing-side evidence obtained, but the `site:` operator is unreliable (reading in §1.1); the Google side still rides on item 1.
3. ~~**(Backend, optional)** Add `<priority>` tiers to the Worker's sitemap generator, or serve the clean path from the Pages sitemap~~ ✅ **Done (10-18, backend `f2046bf`; tsc clean; pending manual deploy)**: the "add priority tiers" option, tier-for-tier identical to front; deploy needs `CLOUDFLARE_API_TOKEN`. The alternative option was not adopted.
4. ~~**(This repo, optional)** Add `/balance-bike-budget/` to `KEY_URLS` in `site-health-check.mjs`~~ ✅ **Done (10-18, front `595c53e`)**: weekly check 15/15 at 100.
5. **When new GSC screenshots arrive:** check whether "Validation failed" flipped to passed; if not, re-trigger validation or debug the redirect-variant chains.
