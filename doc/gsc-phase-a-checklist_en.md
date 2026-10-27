# GSC Phase A Action Checklist — Indexing Health Confirmation

> Companion doc: `gsc-indexing-simulation-2026-10-27_en.md` (simulated coverage-bucket report).
> This checklist covers **Phase A only**: confirm indexing health after the "5 primary-term hubs + toddler-electric-car scenario page + sitemap fix" went live.
> Division of labor: **URLs and the triage table here are generated / verified live by the Agent**; **sitemap refresh, Request indexing, and reading the Page indexing panel are done manually by you in GSC**.

---

## 1. Goal

- Confirm the rebuilt live sitemap is clean (offline re-check: **441/441 all 200, 0×3xx, 0×4xx**).
- Push the 6 new primary-term pages to Google for crawl/index (Request indexing).
- Cross-check real GSC "Page indexing" state against the simulation report to verify the P1 fix (the former 16 301s no longer appear as redirects).

---

## 2. Refresh the Sitemap (manual)

1. Open **Google Search Console → Indexing › Sitemaps**.
2. On the existing entry, click **⋯ → Refresh** (sitemap filename `sitemap.xml`, full URL `https://balancebiketoddler.com/sitemap.xml`).
3. Purpose: signal "something changed" to Google, faster than waiting for automatic crawl. No file change needed — the sitemap is already clean.

---

## 3. Request indexing list (manual, core action)

For each of the **6 English canonical URLs** below:
1. Paste the URL into the GSC top search bar → wait for load.
2. Confirm it shows **"URL is on Google"** or "URL is not on Google".
3. Only click **Request indexing** when it says "not on Google" or you want to speed things up (don't re-submit already-indexed URLs — wastes quota).

> Quota: ~tens of "request indexing" per property per day; 6 URLs is well within limit. **Submit only these 6 English canonical URLs** and save quota for the pages that matter most for ranking; let the `/zh` variants be discovered naturally (the sitemap also carries 26 `/zh/guides/...` best/scenario variants — don't waste quota on them).

```
https://balancebiketoddler.com/guides/best/best-balance-bike-2026
https://balancebiketoddler.com/guides/best/best-double-stroller-2026
https://balancebiketoddler.com/guides/best/best-jogger-stroller-2026
https://balancebiketoddler.com/guides/best/best-travel-stroller-2026
https://balancebiketoddler.com/guides/best/best-electric-car-for-kids-2026
https://balancebiketoddler.com/guides/scenario/toddler-electric-car
```

> Note: the real canonical hub paths are `/guides/best/` and `/guides/scenario/` (**not** root-level `/best-…`). All 6 above are verified live as **200, no redirect**.

---

## 4. Page indexing status triage table (you read the panel, triage per this)

Path: **GSC → Indexing › Pages**. Bucket the real numbers by the table below:

| GSC status | Meaning | Action |
|---|---|---|
| **Valid** (green) | Indexed, canonical | Healthy — record as baseline |
| **Page with redirect** | Redirected | Mostly **benign** (http→https / www→non-www / underscore→hyphen / currency strip). Verify only these kinds appear, no loops / wrong targets |
| **Discovered – currently not indexed** | Found, not crawled | Normal for new pages; rely on internal-link weighting (#228) + sitemap; wait a few days |
| **Crawled – currently not indexed** | Crawled, not indexed | Quality / duplicate signal; check thin content or wrong canonical |
| **Excluded by ‘noindex’** | noindexed | Check for accidental leak (pages that shouldn't be noindex) |
| **Soft 404** | Soft 404 | Check `/zh` untranslated pages for clean soft-404 handling |
| **Alternate page with canonical tag** | Canonical duplicate | Confirm canonical points to intended (en primary) version; hreflang mutual refs correct |

---

## 5. Must-check: wagon / playard product cluster (direct evidence of P1 fix)

The **16 product URLs that were 301s** in the simulation (wagons + playards, caused by the Worker resolver drift that 301'd them to `/products/kids-tricycles/`) are now stable under that path after deploy. In GSC "Page indexing", **spot-check that they no longer appear under "Page with redirect"** — they should show **Valid**.

The live sitemap currently carries **20** such URLs (17 wagons + 3 playards) — slightly more than the simulated estimate of 16 (catalog likely grew); trust the live count:

```
https://balancebiketoddler.com/products/kids-tricycles/kids_pull_along_wagons-b084zglh27
https://balancebiketoddler.com/products/kids-tricycles/kids_pull_along_wagons-b08q1svprp
https://balancebiketoddler.com/products/kids-tricycles/kids_pull_along_wagons-b08vf98fss
https://balancebiketoddler.com/products/kids-tricycles/kids_pull_along_wagons-b09gj7hvfh
https://balancebiketoddler.com/products/kids-tricycles/kids_pull_along_wagons-b09hjtbqjf
https://balancebiketoddler.com/products/kids-tricycles/kids_pull_along_wagons-b0c5434m8d
https://balancebiketoddler.com/products/kids-tricycles/kids_pull_along_wagons-b0c5435km9
https://balancebiketoddler.com/products/kids-tricycles/kids_pull_along_wagons-b0clwwpdml
https://balancebiketoddler.com/products/kids-tricycles/kids_pull_along_wagons-b0djy3jh8d
https://balancebiketoddler.com/products/kids-tricycles/kids_pull_along_wagons-b0dxfg3954
https://balancebiketoddler.com/products/kids-tricycles/kids_pull_along_wagons-b0fcy4wm8m
https://balancebiketoddler.com/products/kids-tricycles/kids_pull_along_wagons-b0ffm5p1sf
https://balancebiketoddler.com/products/kids-tricycles/kids_pull_along_wagons-b0fqtztc84
https://balancebiketoddler.com/products/kids-tricycles/kids_pull_along_wagons-b0g1c38c3t
https://balancebiketoddler.com/products/kids-tricycles/kids_pull_along_wagons-b0g1zf9z63
https://balancebiketoddler.com/products/kids-tricycles/kids_pull_along_wagons-b0g2yvks6m
https://balancebiketoddler.com/products/kids-tricycles/kids_pull_along_wagons-b0gqxf73jz
https://balancebiketoddler.com/products/kids-tricycles/playard-b07964sfw4
https://balancebiketoddler.com/products/kids-tricycles/playard-b07wpw1yyc
https://balancebiketoddler.com/products/kids-tricycles/playard-b08bt16th5
```

---

## 6. Snapshot template (for 4–6 week comparison)

| Date | Valid | Page with redirect | Discovered-not-indexed | Crawled-not-indexed | noindex | Soft 404 | Alternate-canonical | Notes |
|---|---|---|---|---|---|---|---|---|
| 2026-10-27 (baseline · offline re-check) | 441 | 0 | — | — | — | 0 | — | sitemap all 200 |
|  |  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |

---

## 7. Notes

- **Don't "fix" benign redirects**: http→https, www→non-www, underscore→hyphen, and currency-strip 301/308s are normal site-canonicalization results; GSC showing "Page with redirect" for those is not a problem.
- **`/zh` untranslated pages**: soft 404 / thin content may be flagged — check alongside (see Phase D internationalization check).
- **transparency old URL**: `/transparency/testing_methodology` (underscore) now 301s to `/transparency/testing-methodology/` (shipped with this phase's fix); GSC should show the old URL as redirect and the new URL as Valid.

---

*This checklist was generated by the Agent based on live verification (hubs 6/6 = 200, sitemap 441/441 = 200, transparency 301 verified); GSC manual actions require the site owner.*
