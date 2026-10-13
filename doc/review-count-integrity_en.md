# Review-count data integrity: 10 listings need a source fix

Public version: <https://balancebiketoddler.com/transparency/review-count-integrity/> (2026-10-14).

Date: 2026-10-13　Handling commit: `pending`
Subject: ten listings carried review counts that cannot be true (up to ~47 million). Blocked end-to-end.

## The problem

Ten listings in this catalogue carry an `Item_Details["Review Count"]` value that **cannot be real**.
For reference, the highest credible figure in the same catalogue is about 59,000 (a convertible car seat),
and the Radio Flyer wagon — one of the biggest sellers on the site — shows 14,471.
**47 million ratings for a toddler playard exceeds plausible unit sales for that category by orders of magnitude.**

Those numbers were reaching three separate surfaces:

| Output | Symptom |
|---|---|
| Visible copy | `★ 4.7/5 · 47,475,117 ratings` |
| Product JSON-LD | `aggregateRating.ratingCount: 47475117` |
| Internal ranking maths | `reviewCount / 100000` in `EvaluationsSection.productValueScore()` → one bad row added **+475** and silently reordered "top pick" lists |

The third is the quiet one: not a copy error but corrupted ordering.

## Approach

Same class of problem as `ce93535` (unsupported lab claims): **do not publish numbers we cannot defend.**
The count is dropped rather than replaced with an estimate — the star rating stays, the count and the whole
`aggregateRating` block go. An `aggregateRating` whose `ratingCount` is fabricated is a structured-data
violation; losing the rich result is the lesser cost.

Implementation: `src/lib/reviewSignal.ts` exports `credibleReviewCount()` with a ceiling of
`MAX_PLAUSIBLE_REVIEW_COUNT = 200_000`. Prerender, the App.tsx JSON-LD block, the `apiServer.ts` pros
generator, and the `EvaluationsSection` scoring all route through that one function, so a new output
path added later cannot quietly bypass the gate.

**Calibration**: the catalogue's credible ceiling is ~59k; the threshold sits an order of magnitude above
that, so legitimate movers cannot trip it. Confirmed empirically — pages publishing a count went
176 → 166, i.e. exactly the ten offenders and nothing else.

## Affected records (fix at source in the CMS)

| Page | Published count | Category | Brand |
|---|---|---|---|
| `products/strollers/stroller-b07pjmb6gf` | 47,475,530 | — | — |
| `products/strollers/playard-b07964sfw4` | 47,475,117 | playard | Baby Trend |
| `products/strollers/stroller-b09jls8lsr` | 46,465,563 | double_stroller | Mompush |
| `products/strollers/playard-b08bt16th5` | 45,455,104 | playard | Dream On Me |
| `products/strollers/stroller-b07g55y3dp` | 44,445,715 | — | — |
| `products/strollers/stroller-b008u4mku6` | 4,646,593 | double_stroller | Baby Trend |
| `products/strollers/stroller-b00gjixp5o` | 4,545,537 | — | — |
| `products/strollers/stroller-b07bb5vxbw` | 4,545,528 | double_stroller | Baby Trend |
| `products/strollers/stroller-b07kr61jvd` | 4,444,511 | double_stroller | BABY JOY |
| `products/strollers/stroller-b07b7qc8dv` | 464,652 | double_stroller | Jeep |

All ten sit in the stroller family (already demoted per the Search Console data).
**All 16 balance-bike detail pages are clean.**

The values cluster suspiciously — several records share leading digits (47,475,530 / 47,475,117;
4,444,511 / 4,444,515) — which points at a **scraper or concatenation defect rather than ten typos**.
Investigate the collector instead of hand-editing ten fields.

## Regression guard

`npm run check:reviewcounts` scans every HTML file in `dist/`, checking both visible copy and JSON-LD,
and exits non-zero if any count exceeds the ceiling. The ceiling is read out of
`src/lib/reviewSignal.ts` by regex so the guard cannot drift from the filter it guards.

When the build blocks dirty data, prerender prints the offending ids (currently the ten above) as a
reminder to fix them at source.
