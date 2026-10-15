# GSC Data Review — 2026-10-15 "stable track" Filtered Export

> Related: `doc/gsc-2026-10-13-analysis_en.md` (answers action #2), `doc/stable-track-query-resolution_en.md`

## 1. Data Source

- Files: `balancebiketoddler.com-Performance-on-Search-2026-10-15.zip` / `(1).zip` / `(2).zip`
  — the user attached 2, but **3 identical copies** exist in Downloads (incl. `(2)`); all contain the same export.
- Filters (`Filters.csv`): Search type = Web (text-based); Time range = Last 24 hours; Query = **+stable track**.
- Nature: a **filtered sub-export**, not a full-site export. A separate GSC screenshot for this window also showed 1 impression for `balance bikes for toddlers`, but that query is not inside these zips.

## 2. Queries (`Queries.csv`) — 5 rows, all 0 clicks

| Query | Clicks | Impr | CTR | Pos |
|---|---|---|---|---|
| lightweight stable track balance bike | 0 | 2 | 0% | 12.5 |
| safety features stable track kids balance bike | 0 | 1 | 0% | 10 |
| reliable stable track balance bike | 0 | 1 | 0% | 12 |
| sturdy stable track balance bike | 0 | 1 | 0% | 12 |
| safe stable track balance bike | 0 | 1 | 0% | 14 |

Total **6 impressions / 0 clicks / positions 10–14.5** (Google page 2). All are "stable track" + balance-bike modifiers (lightweight / reliable / sturdy / safe / safety features).

## 3. Landing Pages (`Pages.csv`) — only 2

| Page | Clicks | Impr | CTR | Pos |
|---|---|---|---|---|
| `https://balancebiketoddler.com/products/balance-bikes/` | 0 | 5 | 0% | 11.8 |
| `https://balancebiketoddler.com/` | 0 | 1 | 0% | 14 |

⚠️ **`/balance-bike-stability/` (the dedicated asset) is entirely absent from the Pages list** — directly confirming item 3 ("this page path was not submitted/attributed in GSC"). The "stable track" cluster is carried by **generic pages** (the balance-bikes hub + homepage), not by the dedicated asset built for it.

## 4. Countries (`Countries.csv`) — 1 impression each across 6 countries

Brazil / Argentina / Burkina Faso / Iraq / Spain / Bangladesh — one impression each. These are **scattered long-tail impressions with no geographic concentration**; volume is on the floor (6 impressions in 24h).

## 5. Diagnosis

1. **Ranking too deep is the root cause of 0 clicks (not a separate problem)**: the cluster averages positions 10–14.5 (page 2); even the carrying hub is on page 2, so the asset would rank even lower or not yet appear in the top 20. Consistent with the 10-13 conclusion (US avg position ~52; 0 clicks are a symptom of ranking depth).
2. **The asset is not yet associated by Google with this cluster**: although `5410fbf` already refined the asset title / H1 / anchor text to "stable track balance bike" and fixed the SPA hub internal link, GSC's Pages attribution still only credits generic pages. Reasons: internal-link equity + ranking depth take time to propagate; and the stale sitemap (below) makes Google's view of the asset lag.
3. **Stale sitemap (newly found this session — critical blocker)**:
   - Requesting `sitemap.xml` **without** a cache-buster → returns **260 URLs**, **no** `balance-bike-budget`;
   - Requesting with `?cb=` cache-buster → returns **247 URLs**, **includes** `balance-bike-budget`.
   - i.e. the Cloudflare zone cache keeps serving the **old sitemap** (pre-`929981a` deploy) to ordinary requests; Google fetches the sitemap without a buster → gets the stale version → **cannot discover new assets / updates**.
   - Root cause: the auto-purge workflow is still skipped because `CLOUDFLARE_ZONE_ID` / `CLOUDFLARE_API_TOKEN` secrets are missing (noted on 10-13); until configured, a **manual Purge Everything** is required after each deploy.

## 6. Done / To-do

- ✅ Done (`5410fbf`): asset title `Stable Track Balance Bike: Track Width`, H1 with exact phrase, precise reference-cluster anchor, SPA hub now renders the `ReferenceClusterNav` internal link.
- ⏳ **Critical to-do**: after each deploy, **manually Purge Everything** (or at least purge `sitemap.xml` and the asset paths) so Google re-fetches the fresh sitemap and updated pages.
- ⏳ To-do: once the fresh sitemap is live, run the IndexNow delta submission for the two assets (`budget` + `stability`).
- 👀 Monitor: the cluster sits on page 2 (10–14); it needs to climb below 10 to earn clicks. Content is in place; the lever is crawl-freshness + internal-link equity + on-page exact-phrase density.
- 📉 Volume caveat: only 6 impressions in 24h — noise level. **Do not over-optimize.** The real volume is still "toddler / by age" (94.7% of demand, only 1 impression this window).

## 7. Relationship to the 10-13 analysis

This data **answers** action #2 of `gsc-2026-10-13-analysis`: in GSC's **Pages** tab filtered by `stable track`, the carrying URLs are `/products/balance-bikes/` + `/` (not `/balance-bike-stability/`). Conclusion = **strengthen, not merge** (the dedicated asset is genuinely not being recognized, not cannibalizing). The `stable-track-query-resolution` fix direction is correct, but attribution only takes effect once crawl-freshness is restored (see §5.3).
