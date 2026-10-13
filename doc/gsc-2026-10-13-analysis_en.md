# Search Console baseline — balancebiketoddler.com

Public version of this analysis: <https://balancebiketoddler.com/transparency/search-data/> (published 2026-10-14).

**Export:** `balancebiketoddler.com-Performance-on-Search-2026-10-13.zip`
**Filter:** Search type = Web, Date = Last 3 months
**Analyzed:** 2026-10-13

---

## 0. Read this before using any number below

Three caveats that change how much weight this data can carry:

1. **The three tables do not reconcile.** Page report totals **27 clicks / 1,061 impressions**, the daily chart totals **14 clicks / 348 impressions**, and the query report totals **0 clicks / 171 impressions**. GSC thresholds and suppresses rows at this volume, and the query report has no clicks at all while the page report has 27. Conclusion: **absolute totals are unreliable; relative patterns still are.**
2. **Effectively all clicks are internal.** Every one of the 14 clicks came from China (10), Hong Kong (2), United Kingdom (1) and Japan (1), at an average position of ~1.1. Mainland China + Hong Kong accounting for 86% of clicks at position 1.1 is the signature of the operator searching their own site, not an audience.
3. **This is a pre-traffic baseline.** Two months of near-zero data on a new domain is expected. Nothing here is a trend yet — it is a starting line.

**Bottom line: treat this as evidence that nothing has traction yet, not as evidence that any page deserves protection.**

---

## 1. Totals

| Metric | Daily chart | Page report |
|---|---|---|
| Clicks | 14 | 27 |
| Impressions | 348 | 1,061 |
| Days with zero impressions | 12 of 59 | — |

Chronological split from the daily series:

| Period | Clicks | Impressions |
|---|---|---|
| Aug 13 – Sep 01 | 3 | 232 |
| Sep 02 – Sep 20 | 6 | 36 |
| Sep 21 – Oct 10 | 5 | 80 |

Impressions collapsed after the first three weeks and have not recovered.

---

## 2. Geography — where clicks come from vs. where demand is

| Country | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| China | 10 | 81 | 12.35% | 1.12 |
| Hong Kong | 2 | 23 | 8.70% | 1.48 |
| United Kingdom | 1 | 3 | 33.33% | 1.00 |
| Japan | 1 | 2 | 50.00% | 26.5 |
| **United States** | **0** | **156** | **0%** | **52.83** |
| Indonesia | 0 | 7 | 0% | 60.71 |
| Brazil | 0 | 6 | 0% | 33.83 |
| Philippines / Russia | 0 | 6 each | 0% | 61 / 64.8 |

The target market is invisible: **the US supplies the largest block of impressions (156, ~45% of all impressions) and zero clicks, at position 52.8.**

Device split points the same way: mobile 8 clicks / 74 impressions vs. desktop 6 clicks / 274 impressions — mobile has a 6x higher CTR, again consistent with a person checking rankings by hand.

---

## 3. Queries — demand is almost entirely balance-bike

68 queries, 171 impressions, **0 clicks**.

| Theme | Queries | Impressions | Share |
|---|---|---|---|
| Balance bike (incl. walking bike / balancing bicycle) | 59 | 162 | **94.7%** |
| Stroller / car seat / playard | 6 | 6 | 3.5% |
| Other (wagon, scooter) | 3 | 3 | 1.8% |

Top queries by impressions — all balance bike, all buried:

| Query | Impressions | Position |
|---|---|---|
| balance bike toddler | 19 | 55.26 |
| best balance bike for toddlers | 11 | 56.91 |
| balance bike for 2 year old | 11 | 68.36 |
| balance bikes for 2 year olds | 9 | 72.00 |
| parent approved stable track balance bike | 7 | **10.71** |
| balance bike for toddlers | 7 | 54.00 |
| toddler balance bike | 7 | 55.14 |
| baby balance bike | 7 | 56.71 |
| best balance bike for 2 year old | 7 | 74.86 |

**The site's best-ranking commercial queries are the only three inside the top 20 — and all three contain the phrase "stable track":**

| Query | Impressions | Position |
|---|---|---|
| parent approved stable track balance bike | 7 | 10.71 |
| safety features stable track kids balance bike | 1 | 11.00 |
| child safety stable track kids balance bike | 1 | 20.00 |

Note: the phrase "Stable Track Width Bounds" exists in `src/lib/translate.ts`, but inside a **scooter** cost/quality article, not on a balance-bike asset. The topic that currently ranks best for this domain is a balance-bike safety topic the site has no dedicated page for. That is the clearest concrete opportunity in this export.

**Brand queries** (`baaltto balance bike` pos 35.5, `haweek balance bike` pos 26, `avenor balance bike` pos 40.5, `banana bike toddler` pos 44, `aceger balance bike` pos 45, `beberoad love r2` pos 51, `babyhome stroller` pos 68, `segway stroller` pos 74) show Google loosely associating the site with specific makes. Most of those brand strings cannot be found in `src/data` — they may exist only in CMS records fetched at build time. Either way these are 1–2 impression long-tail rows, not a defensible traffic source.

---

## 4. Pages — only ~19 URLs have any measurable presence

246 URLs are in the sitemap. The page report contains **19 rows**.

| Page | Clicks | Impressions | CTR | Position |
|---|---|---|---|---|
| `/` | 8 | 167 | 4.79% | 16.29 |
| `/products/balance-bikes/` | 5 | 158 | 3.16% | 25.28 |
| `/transparency/privacy-policy` (no slash) | 3 | 97 | 3.09% | 5.45 |
| `/products` | 2 | 129 | 1.55% | 11.97 |
| `/products/balance_bike` | 2 | 109 | 1.83% | 57.08 |
| `/transparency/testing-methodology/` | 2 | 99 | 2.02% | 6.01 |
| `/about` | 2 | 55 | 3.64% | 3.27 |
| `/guides` | 1 | 53 | 1.89% | 2.06 |
| `/products/strollers/` | 1 | 23 | 4.35% | 5.83 |
| `/transparency/privacy-policy/` (canonical) | 1 | 6 | 16.67% | 5.67 |

Verified live behavior of the non-canonical variants (all correct today — these are historical rows that should age out):

- `/products/balance_bike` → **301** → `/products/balance-bikes/`
- `/transparency/privacy-policy` → **308** → `/transparency/privacy-policy/`
- `http://…` → **301** → `https://…`; `https://www.…` → **301** → apex

**No product detail page earned a single impression** in the window. Category hubs rank better than any individual product page.

Also noted: Search appearance reports **Product snippets, 70 impressions, 0 clicks, position 56.39** — Google is parsing Product structured data but showing it nowhere useful.

---

## 5. The structural mismatch

This is the most decision-relevant finding, and it comes from joining GSC with the sitemap:

| Signal | Value |
|---|---|
| Share of query impressions that are balance-bike related | **94.7%** |
| Product detail pages that are balance bikes | **16 of 179 (8.9%)** |
| Product detail pages that are strollers | **78 of 179 (43.6%)** |
| Detail pages for electric cars / tricycles / scooters / car seats | 61 |

The domain is named `balancebiketoddler.com`. Search demand against it is 95% balance-bike. The published inventory is 91% something else. Whatever the commercial reason for carrying those catalogs, from a search standpoint the site is answering a different question than the one being asked.

---

## 6. What this means for the pruning decision

Stage 1 pruning was deliberately paused until traffic data existed. The data is now in, and it says:

- **No page has real traffic, so "don't prune X, it gets clicks" cannot be argued from this export.** Every click was from CN/HK/UK/JP at position ~1.
- **227 of 246 URLs attracted zero measurable impressions over ~2 months.** That is a genuine crawl-efficiency argument for cutting — a new domain with no authority asking Google to process 179 near-identical product templates will not be rewarded for breadth.
- **But it is also not proof that those pages are harmful.** Absence of impressions on a domain nobody knows about is the default state, not damage. Pruning to 40 pages will not, by itself, move a single ranking.
- The one real constraint the data imposes: **if we prune further, do not remove the ~16 balance-bike detail pages or anything matching the brand queries above.** They are the only inventory-aligned pages the site has.

Recommendation: the cheap, reversible aggressive-prune is now *permissible* on crawl-budget grounds, but expectations should be set at "removes drag", not "creates traffic". The leverage is in items 1–3 of section 7, not in further deletion.

---

## 7. Recommended actions, in order of leverage

1. **Build the page that the top-20 queries are asking for.** Three queries about "stable track" balance-bike safety already sit at position 10–20. A dedicated, dataset-backed balance-bike *stability / track-width* asset — using the same template as the size-chart and weight assets — has the shortest path of anything in this report.
2. **First, confirm which page actually serves those queries.** In GSC: filter *Query contains "stable track"*, switch to the **Pages** tab. Do this before writing anything.
3. **Fix the topical imbalance.** Decide whether the stroller / tricycle / electric-car / car-seat catalogs belong on this domain. If they stay, they should be a clearly subordinate section, not 78 of the first pages a crawler meets. If they go, → 47 pages remaining (16 balance + 24 kids-bikes + 7 scooters), which satisfies the original Stage 1 target without touching anything balance-bike related.
4. **Keep doing what Plan-B already validated.** The three newest assets (`/balance-bike-size-chart/`, `/balance-bike-safety-standards/`, `/balance-bike-weight/`) target exactly the query cluster that supplies 95% of impressions. They were deployed Oct 10–11 — the trailing edge of this window — so they have effectively **no data yet**. Do not judge them from this export.
5. **Nothing to fix on URL variants.** http / www / trailing-slash all 301 correctly; the duplicate rows are historical and will consolidate.

---

## 8. Re-measurement checklist

Re-export with the identical filter (Web, Last 3 months) in **~30 days** and compare:

- [ ] US impressions and average position (currently 156 / 52.83 — this is the only number that matters)
- [ ] Whether any of the three newest assets have entered the page report
- [ ] Whether top-20 queries have grown past the 3 "stable track" rows
- [ ] Whether clicks from outside CN/HK exist at all
- [ ] Whether the non-canonical rows (`/products/balance_bike`, `/transparency/privacy-policy` sans slash) have dropped out
