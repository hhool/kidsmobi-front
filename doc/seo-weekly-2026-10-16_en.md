# SEO Weekly Report — balancebiketoddler.com

**Date:** 2026-10-16 (automated run)
**Scope:** Site health check + keyword opportunity scan + content/indexing audit
**Tools:** `scripts/seo/site-health-check.mjs`, `scripts/seo/keyword-opportunity-scan.mjs`

> This is a **content-gap + hygiene scan, not a rank tracker**. True demand data
> still comes from Google Search Console — pair this report with GSC.

---

## 1. Site Health Score: 100/100 (PASS)

All 14 checks passed; **0 warn, 0 fail**.

| Check | Result | Detail |
|-------|--------|--------|
| robots.txt | PASS | 200, `Sitemap:` present, `User-agent: *` present |
| sitemap.xml | PASS | 247 URLs (baseline 247, delta 0) — no drift |
| page `/` | PASS | title/desc/keywords/canonical/json-ld all present |
| page `/products` | PASS | all 5 meta tags present |
| page `/reviews` | PASS | all 5 meta tags present |
| page `/guides` | PASS | all 5 meta tags present |
| page `/news` | PASS | all 5 meta tags present |
| page `/about` | PASS | all 5 meta tags present |
| page `/balance-bike-stability/` | PASS | all 5 meta tags present |
| page `/balance-bike-what-buyers-say/` | PASS | all 5 meta tags present |
| page `/transparency/testing-methodology/` | PASS | all 5 meta tags present |
| page `/transparency/certification-lab-notes/` | PASS | all 5 meta tags present |
| llms.txt | PASS | 1137 bytes |
| internal-links | PASS | sampled 15 on homepage, broken=0 |

**Fail items:** none. No concrete fixes required this week.

---

## 2. Keyword Opportunity Scan

**247 pages scanned → 0 cluster gaps, 0 weak pages.**

| Cluster | Coverage |
|---------|----------|
| by-age (2yr, 3yr, 18mo, toddler) | COVERED |
| best / top picks | COVERED |
| training / first bike | COVERED |
| size / fit / height | COVERED |
| safety / standards | COVERED |
| vs / comparisons | COVERED |
| weight / lightweight | COVERED |
| tire / wheel type | COVERED |
| budget / cheap | COVERED |
| brand long-tail (Strider, woom, …) | COVERED (not a priority — see notes) |

**Top 3 opportunities:** none flagged by the scan. There are no uncovered clusters
and no weak pages (every page has a `keywords` meta tag and a title ≥ 20 chars).

> This week's scan is a clean bill of health. The remaining lever is **depth and
> quality**, not new pages: confirm the age-specific pages (the dominant search
> intent) are comprehensive and actually ranking via GSC, rather than adding more.

---

## 3. Content / Indexing Posture

- **Crawl / recrawl:** No broken internal links in the homepage sample (0/15).
  Sitemap count is stable at 247 (delta 0 vs baseline) — no sudden drop or surge
  that would signal an indexing regression.
- **Indexing:** All key pages return 200 with complete meta + JSON-LD, so there is
  no sign of a prerender/keyword-emission regression this week. The `keywords`
  meta is present site-wide — the `npm run check:spakeywords` guard is not needed
  this cycle.
- **llms.txt:** Present and non-trivial (1137 bytes) — good for GEO/AI-citation.

**No crawl, recrawl, or indexing problems detected.**

---

## 4. Notes & Caveats

- The keyword scan uses **naive substring matching** against the
  keywords+title+h1 corpus. "COVERED" means a cluster signal appears *somewhere*
  on the site — it is a presence check, not a depth/quality guarantee. A "GAP"
  would mean no signal at all, which did not occur.
- The **`electric` cluster is intentionally excluded** from `QUERY_CLUSTERS`
  (electric *cars* ≠ electric balance bikes) — it is a known trap and should stay
  out of content planning.
- **Brand long-tail** (`strider` cluster) showing COVERED is fine — brand terms
  are *not* worth a dedicated page per strategy; their presence in the corpus is
  incidental and acceptable.
- `SITEMAP_BASELINE_COUNT` in `config.mjs` is 247, matching live. Keep this in
  sync so the health check only flags real regressions (large drift), not
  normal weekly additions.

## 5. Recommended Next Steps

1. Pair this with **Google Search Console** for true query demand and ranking.
2. Spot-check the **age-by-age** pages for depth/comprehensiveness (dominant intent).
3. No code, content, or config changes required this week.
