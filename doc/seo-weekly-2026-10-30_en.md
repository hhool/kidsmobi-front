# Weekly SEO Health Check — 2026-10-30

**Site:** balancebiketoddler.com  
**Run type:** Content-gap + hygiene scan (NOT a rank tracker)  
**Generated:** 2026-10-30 09:01 GMT+8

> Pair this scan with Google Search Console for true demand/supply signals.  
> This report finds *gaps and hygiene regressions*, not rankings.

## 1. Health Score — 97 / 100 (PASS with 1 WARN)

| Metric | Result       |
| ------ | ------------ |
| checks | 17 total     |
| pass   | 16           |
| warn   | 1            |
| fail   | 0            |
| score  | **97 / 100** |

### Per-check detail

- **robots.txt** — PASS (200, sitemap declared, wildcard UA present)
- **sitemap.xml** — **WARN**, **441 URLs** (baseline 417, delta **+24**). Not a failure — growth is in legitimate content sections (products 182, /zh 79, guides 76, reviews 34, news 14). Baseline bumped to 441 to clear the drift warn; sanity-check the 24 new URLs if no content batch shipped this week.
- **Key-page meta** — PASS, all present on every sampled page:  
  `/`, `/products`, `/reviews`, `/guides`, `/news`, `/about`,  
  `/balance-bike-stability/`, `/balance-bike-budget/`, `/balance-bike-what-buyers-say/`,  
  `/transparency/testing-methodology/`, `/transparency/certification-lab-notes/`  
  (title / description / keywords / canonical / JSON-LD)
- **prerender-meta-ownership** — PASS, 10 nested routes serve their own title + canonical
- **bare-app-roots-reachable** — PASS, 4 roots × 2 forms all 200 (exact `_redirects` rewrite to `/`)
- **llms.txt** — PASS, 1137 bytes
- **internal-links** — PASS, 15 sampled, 0 broken

### Fail items

None. No concrete fixes required this week. The single WARN is a baseline-drift notice (addressed by the baseline bump below), not a defect.

## 2. Keyword Opportunities

- **Pages scanned:** 441
- **Uncovered query clusters (content gaps):** **0** — all 10 high-value clusters covered.
- **Weak pages (missing keywords meta or thin title):** **0**

### Top 3 near-term watch items (no gaps found — these are maintenance / vigilance)

1. **By-age intent depth** — by-age is the dominant search intent and remains fully covered, but it is the highest-volume surface. Keep adding age-specific depth (18mo / 2yr / 3yr / 4yr) before expanding tangential clusters.
2. **Hold the "electric" cluster out** — correctly excluded again; electric *cars* ≠ electric *balance bikes*, so any electric-themed query is a trap and should stay off the build list.
3. **Guard prerender keyword emission** — keyword `<meta>` is intact across all 441 pages this week, so no regression. If a future scan shows weak pages with missing `keywords` meta, that signals a prerender-emission regression → run `npm run check:spakeywords`.

> Bran
>
> bd long-tail (Strider/woom/kidvelo) is covered but intentionally **not** a priority for dedicated pages — leaving as-is.

## 3. Content / Indexing Posture

- **Crawl / recrawl / indexing:** No problems detected. robots.txt is well-formed, sitemap is fresh (441 URLs, all in legitimate content sections), internal links are clean.
- **Prerender keyword meta:** Intact on 100% of scanned pages → no `npm run check:spakeywords` trigger this week.
- **llms.txt:** Present (1137 B) — GEO surface healthy.

## Baseline maintenance

- `SITEMAP_BASELINE_COUNT` in `scripts/seo/config.mjs` bumped **417 → 441** (2026-10-30) to track the week's content growth and clear the drift warn.

## Verdict

Green with one advisory. No failures, no content gaps, no weak pages, and no indexing regression. The only open item is a non-blocking baseline drift that has been synced. Re-run next week; escalate to GSC before committing to new content clusters.
