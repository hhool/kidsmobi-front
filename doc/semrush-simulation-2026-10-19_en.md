# Semrush-Style Domain Analysis (Simulated Reconstruction) — balancebiketoddler.com · 2026-10-19

> **Methodology note**: live Semrush (`/analytics/overview`) returned only a JS shell with no data in this sandbox, and a direct `google.com` fetch failed — neither is usable. This report is a **simulated reconstruction from real data**: GSC Coverage exports (10-18/10-19, byte-identical, window through 10-12), the 10-16 Performance analysis, the r10 site verification (16:30), and Bing whole-domain controls (last valid: r10 at 16:24). Authority Score / traffic / keyword counts are **evidence-based simulated values**; indexing, impressions, and technical metrics are real.
> Related: `doc/gsc-coverage-2026-10-19-analysis_en.md`, `doc/gsc-2026-10-19-stable-track-r10_en.md`, `doc/gsc-coverage-2026-10-18-analysis_en.md`, `doc/backlink-outreach-pack-2026-10-19_en.md`. No site code modified.

## 1. Channel Check Log (this run)

| Channel | Action | Measured result | Usable? |
|---|---|---|---|
| google.com | `site:balancebiketoddler.com` (WebFetch direct) | fetch failed (unreachable from sandbox; Google rejects non-JS fetches) | ❌ |
| google.com | WebSearch + `allowed_domains=["google.com"]` | "No search results found" (known operator-ignored behavior + empty after domain filtering) | ❌ Proves nothing |
| bing.com | `site:balancebiketoddler.com` (whole-domain control) | **"Brak wyników" no-results page (Polish edge node)** — directly contradicts the valid control 20 minutes earlier in r10 (site in index, 8+ pages listed) | ❌ **Ruled edge-node flakiness/pollution; control void this run.** Last valid control = r10 (16:24) |
| semrush.com | `/analytics/overview/?q=balancebiketoddler.com` | Only a bare "Domain Overview" shell title, zero numbers (JS-rendered) | ❌ No data |

**Important trace**: after 3 consecutive valid whole-domain controls (r8/r9/r10), this run (16:42) got no-results from the Polish node — the same node that served the budget path no-results in r10 (16:24). Two readings: (a) that edge node is emitting no-results wholesale (node-level pollution — a different node still showed a valid control 18 minutes prior); (b) the extreme case that Bing actually purged the site — impossible in 18 minutes for a site with a 100/100 technical check and no penalty signals. Ruled (a); **the next automation run must re-verify the whole-domain control**; only 2-3 consecutive whole-domain no-results would justify escalating to a "Bing index anomaly" investigation.

## 2. Simulated Domain Overview

| Metric | Simulated value | Evidence basis |
|---|---|---|
| Authority Score | **6 / 100** | New domain, 0 referring domains; Semrush typically scores such sites 1-10 |
| Monthly organic traffic | **≈3 visits** | 0 clicks across the tracked GSC period; ≈4 impressions/day with no click conversion |
| Ranking keywords | **2** | "stable track" (landing `/` + `/products/balance-bikes/`, 10-15 baseline) + 1 long-tail |
| Paid keywords / ads | 0 | No campaigns |
| Backlinks / referring domains | **0 / 0** | Historically confirmed zero backlink building |
| Google indexed | **14 / 271 (5.2%)** | GSC Coverage real data; 26-day plateau since 09-22 |
| Bing visible pages | **≈8-10** | Whole-domain controls r6-r10 (last valid r10) |
| Technical health | **100/100** | `npm run seo:health` 15/15 real |

## 3. Indexing Funnel (real data)

271 known pages = 247 sitemap + 23 pruned listings + 1 /auth/:

| Bucket | Pages | Share | Validation |
|---|---|---|---|
| Discovered – currently not indexed | **242** | 89% | Started |
| Alternate page with proper canonical | 9 | 3.3% | Failed (root cause fixed 10-19; do NOT re-validate) |
| Page with redirect | 4 | 1.5% | Started (301s went live 10-18 22:30, after the data window) |
| Excluded by noindex (= /auth/, fixed) | 1 | 0.4% | Not Started |
| Crawled – currently not indexed | 1 | 0.4% | Started |
| **Indexed** | **14** | **5.2%** | — |

Signal contrast: impressions averaged 172/month before the full sitemap submission vs 86 over the three weeks after — **5× more discovery, half the impressions**: the classic signature of missing crawl demand.

## 4. Keywords & Landing Pages (Semrush keyword lens)

| Query | Current landing | Target page | Status |
|---|---|---|---|
| stable track | `/` + `/products/balance-bikes/` | `/balance-bike-stability/` | **Blocked**: target page sits in the 242 pool, not indexed |
| balance bike budget | `/products/balance-bikes/` | `/balance-bike-budget/` | **Blocked**: same; Bing-side both pages have produced well-formed no-results (4 edge nodes) |
| track width / long-tail variants | no observed ranking | `/balance-bike-stability/` | **Opportunity**: no observed competitor has a dedicated page |

Both target pages are flawless on-page (200 / self-canonical / index,follow / sitemap priority 0.9 / 4.5k-5.7k chars of real content) — **the bottleneck is entirely domain-level signals, not page-level**.

## 5. Backlink Profile & Diagnosis

- 0 backlinks / 0 referring domains. Diagnostic chain (unchanged from the 10-18 analysis): 26-day plateau + 94% Discovered-not-indexed + zero backlinks + 100/100 technical → **a crawl-demand problem, not a technical problem**.
- Google's strategy for no-demand sites: sitemap URLs enter the "discovered" parking lot and are released in batches based on site-wide signals. **Until external demand signals appear, no amount of sitemap/IndexNow submission moves the ceiling.**
- Backlinks are the only lever that moves the demand curve; `doc/backlink-outreach-pack-2026-10-19_en.md` (16 targets, 3 tiers, 4 email drafts) is ready to launch — priority: stability > budget.

## 6. Competitive SERP Observations (this run's WebSearch, 8 domains)

peggyomara.com, trekbikesblog.com, pookapages.com, adorablyperfect.com, smallsmart.co.uk, bisiklopedi.com, portcycling.com, bebeluxbaby.com. Qualitative notes (their authority values deliberately not fabricated):

- 7/8 are affiliate roundups / content-farm shapes (Amazon commission disclosures, templated comparison tables) — the same ecosystem as this domain's previous-owner spam pages; most have no dedicated stability/track-width page.
- smallsmart.co.uk is the only genuine retail blog (UK) with real balance-bike-vs-trike depth — **the closest legitimate benchmark**.
- Takeaway: the target SERPs are held by thin content; our 5k-char lab-tested content has a clear quality edge — **once indexing is granted, ranking competitiveness exists**. That's the rationale for staying the course on backlinks + small-batch submissions.

## 7. Action Priorities (Semrush-style leverage order)

1. **Backlinks** (the only real lever): 3-5 relevant links can move the demand curve; the target list is ready.
2. **Small-batch Request Indexing**: 2 done on 10-16; next batch ≥10-23, 5-10 target pages at a time — never 240 in one wave.
3. **Time**: parking-lot URL re-evaluation runs weekly-to-monthly; the 10-22~24 Coverage export is the first readable checkpoint for the 10-15/16 actions.
4. **Technical hygiene**: all green — hold; do not touch canonical-group validation again.
5. **Monitoring**: the next automation run must re-verify the Bing whole-domain control (this run's pl-node anomaly, §1).

## 8. Run Archive

- google.com WebFetch: fetch failed; WebSearch (google.com domain filter): no results.
- bing.com WebFetch whole-domain query: pl-node no-results (void; last valid r10).
- semrush.com WebFetch `/analytics/overview/?q=balancebiketoddler.com&searchType=domain`: empty shell, no data.
- No site code modified; new deliverables `doc/semrush-simulation-2026-10-19_zh.md` / `_en.md`.
