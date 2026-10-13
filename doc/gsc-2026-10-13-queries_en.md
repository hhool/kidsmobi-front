# Top queries analysis (2026-10-13 export: 68 rows / 171 impressions)

Summarised publicly at <https://balancebiketoddler.com/transparency/search-data/> (2026-10-14).

Source: Search Console → Performance → Web → Top queries, 2026-08-13 to 2026-10-10.

## Read this first

- **171 impressions, 0 clicks, 68 rows** across three months is about 1.9 impressions a day. This is noise-level.
- **Every one of the 68 rows shows zero clicks**, including the biggest (`balance bike toddler`, 19 impressions).
  Do not read that as "our titles are bad": the US average position is around 52, and page-two-plus rankings do not earn
  clicks. Zero clicks is a **consequence of ranking depth**, not a separate defect.
- Use this data **only to read intent structure** — which queries are worth serving. It cannot evaluate any page.

## Intent clusters

| Cluster | Impr | Queries | Note |
|---|---:|---:|---|
| Bare core terms (balance bike toddler / toddler balance bike …) | 59 | 16 | Largest block, also the vaguest |
| **Age-modified, no "best"** | **45** | **16** | for 2 year old / 18 month old / for 2-3 year old … |
| best + age | 18 | 11 | best … for 2 year old / 1.5 year old / 2.5 year old … |
| best, no age | 17 | 5 | best balance bike for toddlers … |
| stable track | 9 | 3 | The only three queries ever inside the top 20 |
| Review intent | 8 | 5 | review / reviews of balance bikes … |
| Alternate names (walking bike / balansesykkel) | 6 | 4 | One Norwegian row: `balansesykkel 2 år best i test` |
| Stroller (off-domain) | 6 | 6 | babyhome / segway / adjustable handlebar … |
| Questions | 3 | 2 | are balance bikes good for babies/toddlers |

## Four conclusions

**1. Age is the single largest intent, and nothing was organised around it.**
Age-carrying queries total **27 rows / 63 impressions** (37% of impressions, 40% of queries), and **58% of them carry no
"best"** — so this is not price comparison, it is a fit question ("can my 2-year-old ride this / which one fits").
No page was organised by the age of the child, so that demand landed on whatever happened to rank.
→ This is the direct justification for Asset 7, `/balance-bike-by-age/`.

**2. Coverage halves at three, and that is itself the story.**
Counted from the manufacturer age range each listing publishes (13 of 14 publish one):

| Age | Listings still rated for it |
|---|---:|
| 18 months | 10 / 13 |
| 2 years | 13 / 13 |
| 2.5 years | 6 / 13 |
| 3 years | 6 / 13 |
| 4 years | 4 / 13 |

These denominators were recounted on 2026-10-14. The figures quoted when this page first
shipped counted 14 / 15, because every Plan-B dataset was generated before Stage-1 pruning
and still carried the duplicate Gamfeiny listing alongside the one it was merged into.
The generators now drop Stage-1 duplicates before any counting.

It does not taper — it steps down by half between two and three, and **nothing reaches past 60 months**.
The practical reading: past roughly three years old you are buying for the remaining window, not buying to grow into.

**3. Stroller queries are down to 6 impressions across 6 rows, which supports the demotion.**
After the Sept 30 change that moved every category other than balance bikes and kids bikes below a labelled
subordinate divider, stroller queries are scattered singles. No counter-evidence; nothing to roll back.

**4. The three stable-track queries (9 impressions) now have Asset 6, but attribution is still unverified.**
Those three ranked 10.71 / 11 / 20 last month — the only top-20 queries on this domain. Asset 6
`/balance-bike-stability/` shipped 2026-10-13, but **which URL actually serves them cannot be checked from here**:
in GSC, filter *query contains "stable track"* and switch to the Pages tab. If it is not the stability page, the next
step is consolidation, not another page.

## Two things to carry forward

- "electric balance bike for 3 year old" (3 impressions) and "electric bikes for 2 year olds" (1) do appear, but the
  electric-cars category here is **ride-on cars, not electric balance bikes**. Do not chase those two at the cost of
  matching intent dishonestly.
- Brand long tails (Baaltto / Avenor / Haweek / Aceger / Banana / Beberoad / Babyhome / Segway) total roughly 10
  impressions at 1–2 each, and several do not exist in the local catalogue. **Single-brand pages are not worth
  building at this volume.**
