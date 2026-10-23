# Weekly SEO Health Check — 2026-10-23

**Site:** balancebiketoddler.com
**Run type:** Content-gap + hygiene scan (NOT a rank tracker)
**Generated:** 2026-10-23 09:02 GMT+8

> Pair this scan with Google Search Console for true demand/supply signals.
> This report finds *gaps and hygiene regressions*, not rankings.

## 1. Health Score — 100 / 100 (PASS)

| Metric | Result |
|---|---|
| checks | 17 total |
| pass | 17 |
| warn | 0 |
| fail | 0 |
| score | **100 / 100** |

### Per-check detail
- **robots.txt** — PASS (200, sitemap declared, wildcard UA present)
- **sitemap.xml** — PASS, **273 URLs** (baseline 270, delta **+3** — normal content growth, no large-drift warning)
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
None. No concrete fixes required this week.

## 2. Keyword Opportunities

- **Pages scanned:** 273
- **Uncovered query clusters (content gaps):** **0** — all 10 high-value clusters covered.
- **Weak pages (missing keywords meta or thin title):** **0**

### Top 3 near-term watch items (no gaps found — these are maintenance / vigilance)
1. **By-age intent depth** — by-age is the dominant search intent and remains fully covered, but it is the highest-volume surface. Keep adding age-specific depth (18mo / 2yr / 3yr / 4yr) before expanding tangential clusters.
2. **Hold the "electric" cluster out** — correctly excluded again; electric *cars* ≠ electric *balance bikes*, so any electric-themed query is a trap and should stay off the build list.
3. **Guard prerender keyword emission** — keyword `<meta>` is intact across all 273 pages this week, so no regression. If a future scan shows weak pages with missing `keywords` meta, that signals a prerender-emission regression → run `npm run check:spakeywords`.

> Brand long-tail (Strider/woom/kidvelo) is covered but intentionally **not** a priority for dedicated pages — leaving as-is.

## 3. Content / Indexing Posture

- **Crawl / recrawl / indexing:** No problems detected. robots.txt is well-formed, sitemap is fresh and only grew (+3) within normal bounds, internal links are clean.
- **Prerender keyword meta:** Intact on 100% of scanned pages → no `npm run check:spakeywords` trigger this week.
- **llms.txt:** Present (1137 B) — GEO surface healthy.

## Baseline maintenance
- `SITEMAP_BASELINE_COUNT` in `scripts/seo/config.mjs` updated **270 → 273** to match live and prevent drift accumulation.

## Verdict
Green across the board. No action items beyond routine monitoring. Re-run next week; escalate to GSC before committing to new content clusters.
