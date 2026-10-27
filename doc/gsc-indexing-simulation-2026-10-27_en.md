# GSC Indexing Simulation Report — 2026-10-27

> Site: `https://balancebiketoddler.com` (Cloudflare Pages)
> Basis: live `robots.txt` + `sitemap.xml` full status probe + hop-by-hop trace of the 6 URLs in the screenshot's "Page indexing › Page with redirect"
> Nature: a **simulated bucketing** of the site's real state, not Google's actual index data; real GSC numbers lag behind crawl frequency (days to weeks).

---

## 1. Summary

- **Indexing health: good.** The sitemap has **441 URLs, 425 of which (96.4%) return 200 with a self-referential canonical** — indexable as-is.
- **The "Page with redirect (6)" in your screenshot is benign.** 5 are correct canonicalization redirects (http→https, www→non-www, legacy underscore path→hyphenated product hub, currency-param strip) — the desired state, **no fix needed**; only 1 (`testing_methodology`) now 404s and should get a 301.
- **The real fix is inside the sitemap: 16 URLs that 301** (`kids_pull_along_wagons` ×13 + `playard` ×3 emitted under `/products/strollers/…` while their canonical lives at `/products/kids-tricycles/…`). Caused by category inference drifting from the page canonical.
- No **noindex** misfires and no **duplicate canonical** issues in the sample.

---

## 2. Method

| Item | Approach |
|---|---|
| Sitemap | Fetch `sitemap.xml` (single-file urlset), extract all `<loc>` |
| Status probe | `HEAD` all 441 URLs (manual redirect), tally 200 / 3xx / 4xx |
| Quality sample | `GET` one representative page per directory group (home, about, root asset pages, guides, news, products, reviews, transparency, zh); check `<link rel=canonical>`, `<meta name=robots>`, JSON-LD |
| Redirect trace | Follow the 6 screenshot URLs hop by hop (301/308) until 200/404 |
| robots.txt | Validate allow/disallow rules and the sitemap declaration |

---

## 3. Simulated coverage buckets (GSC "Page indexing" lens)

| GSC bucket | Count | Notes |
|---|---:|---|
| **Indexed-ready** (200 + self-canonical) | **425** | Clean sitemap URLs, indexable |
| Page with redirect (in sitemap — fixable) | **16** | Stale category paths → kids-tricycles (see §5) |
| Page with redirect (site-level canonicalization — benign) | **5** | http/www/underscore/currency, see §4 |
| Not found (404) | **1** | `transparency/testing_methodology` |
| Excluded by noindex | 0 | Sample all `noindex=false` |
| Duplicate / alternate canonical | 0 | Sample all self-canonical |

> Full sitemap status distribution: **200 × 425 / 301 × 16**, no 4xx, no 5xx.

---

## 4. The 6 screenshot URLs, one by one

| # | URL (listed by GSC) | Live | Target | Verdict | Action |
|---|---|---|---|---|---|
| 1 | `/products/balance_bike` | 301 | `/products/balance-bikes/` | ✅ Correct: legacy underscore path → balance-bike hub | None |
| 2 | `http://balancebiketoddler.com/` | 301 | `https://balancebiketoddler.com/` | ✅ Correct: http → https | None |
| 3 | `/transparency/testing_methodology` | **404** | `/transparency/testing-methodology/` | ⚠️ Anomaly: no longer a redirect; GSC tag is stale. Correct page is the hyphenated trailing-slash one (200) | Add 301 |
| 4 | `http://www.balancebiketoddler.com/` | 301 | `https://balancebiketoddler.com/` | ✅ Correct: http+www → https non-www | None |
| 5 | `https://www.balancebiketoddler.com/` | 301 | `https://balancebiketoddler.com/` | ✅ Correct: www → non-www | None |
| 6 | `https://www.…/?currency=EUR` | 301 | `https://balancebiketoddler.com/?currency=EUR` | ✅ Correct: drop www; currency param is retired and ignored | None |

**Takeaway:** "Validation failed" on this "Page with redirect" item is the **expected outcome** — you can't and shouldn't make these URLs return 200 (that would expose duplicate addresses). Except for #3, treat the other 5 as "canonicalization done", no action.

---

## 5. Real finding: 16 sitemap URLs that 301 (P1, fixable)

**Symptom:** the 16 product URLs below sit under `/products/strollers/` in the sitemap, but 301 to `/products/kids-tricycles/`, whose pages are 200 with a self-canonical.

| URL in sitemap (301s) | Actual canonical (200) |
|---|---|
| `/products/strollers/kids_pull_along_wagons-b09hjtbqjf` | `/products/kids-tricycles/kids_pull_along_wagons-b09hjtbqjf` |
| `/products/strollers/kids_pull_along_wagons-b0c5434m8d` | `/products/kids-tricycles/kids_pull_along_wagons-b0c5434m8d` |
| `/products/strollers/kids_pull_along_wagons-b0c5435km9` | `/products/kids-tricycles/kids_pull_along_wagons-b0c5435km9` |
| `/products/strollers/kids_pull_along_wagons-b0clwwpdml` | `/products/kids-tricycles/kids_pull_along_wagons-b0clwwpdml` |
| `/products/strollers/kids_pull_along_wagons-b0djy3jh8d` | `/products/kids-tricycles/kids_pull_along_wagons-b0djy3jh8d` |
| `/products/strollers/kids_pull_along_wagons-b0dxfg3954` | `/products/kids-tricycles/kids_pull_along_wagons-b0dxfg3954` |
| `/products/strollers/kids_pull_along_wagons-b0fcy4wm8m` | `/products/kids-tricycles/kids_pull_along_wagons-b0fcy4wm8m` |
| `/products/strollers/kids_pull_along_wagons-b0ffm5p1sf` | `/products/kids-tricycles/kids_pull_along_wagons-b0ffm5p1sf` |
| `/products/strollers/kids_pull_along_wagons-b0fqtztc84` | `/products/kids-tricycles/kids_pull_along_wagons-b0fqtztc84` |
| `/products/strollers/kids_pull_along_wagons-b0g1c38c3t` | `/products/kids-tricycles/kids_pull_along_wagons-b0g1c38c3t` |
| `/products/strollers/kids_pull_along_wagons-b0g1zf9z63` | `/products/kids-tricycles/kids_pull_along_wagons-b0g1zf9z63` |
| `/products/strollers/kids_pull_along_wagons-b0g2yvks6m` | `/products/kids-tricycles/kids_pull_along_wagons-b0g2yvks6m` |
| `/products/strollers/kids_pull_along_wagons-b0gqxf73jz` | `/products/kids-tricycles/kids_pull_along_wagons-b0gqxf73jz` |
| `/products/strollers/playard-b07964sfw4` | `/products/kids-tricycles/playard-b07964sfw4` |
| `/products/strollers/playard-b07wpw1yyc` | `/products/kids-tricycles/playard-b07wpw1yyc` |
| `/products/strollers/playard-b08bt16th5` | `/products/kids-tricycles/playard-b08bt16th5` |

**Root cause:** the Worker sitemap's category inference classifies the `kids_pull_along_wagons` / `playard` series as `strollers`, while the front-end route and page canonical classify them as `kids-tricycles`. That is exactly the known drift "category inference implemented in 5 places must stay in sync (front-end 4 + Worker sitemap)".

**Impact:**
1. Each crawl pays a 301 on all 16 URLs — **wasted crawl budget**;
2. As Google crawls, GSC will **gain 16 more "Page with redirect" entries** (affected pages would jump from 6 to ~22);
3. The true canonical path (kids-tricycles) is **not in the sitemap**, so discovery is slower.

**Fix:** have the sitemap emit the final 200 path (`/products/kids-tricycles/…`), or align Worker category inference with the front-end rule. Then `wrangler deploy` + an empty commit to rebuild the sitemap.

---

## 6. Recommended actions (by priority)

| Priority | Action | Acceptance |
|---|---|---|
| **P1 (this week)** | Fix the 16 sitemap 301s: sync Worker category inference (or emit the kids-tricycles final path directly) | Re-fetch `sitemap.xml`; HEAD every URL → **0 × 3xx** |
| **P2 (opportunistic)** | Add 301: `/transparency/testing_methodology` → `/transparency/testing-methodology/` | That URL returns 301, landing page 200 |
| **None** | The 5 http/www/currency canonicalization redirects | Leave as-is; "Validation failed" is expected |

---

## 7. Health snapshot (sample — all pass)

- **Coverage:** home, `/about`, root asset pages (balance-bike-* / kids-*-*), `/guides`, `/news`, `/products`, `/reviews`, `/transparency/*`, `/zh/guides`, `/guides/best/best-travel-stroller-2026`, `/products/strollers/`.
- **Result:** all **200**, `noindex=false`, **JSON-LD present**, **self-canonical**.
- **robots.txt:** whole site allowed; only `?sort/price/age/filter/wizard/category=` params blocked; AI crawler policy (allow Google-Extended / CCBot; block Bytespider / Applebot-Extended / meta-externalagent; Amazonbot only `/products/` and `/api/paapi/`) matches intent; `Sitemap:` declaration correct.

---

*This report is a simulated bucketing to surface fixable issues early; actual "Page indexing" numbers should be read from Google Search Console.*
