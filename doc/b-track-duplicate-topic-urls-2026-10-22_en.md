# B-track: 8 same-topic URL pairs — recommendation

Date: 2026-10-22
Scope: `/balance-bike-*` asset pages paired against `/guides/<topic>/<slug>` articles — 8 pairs on the same topic
Conclusion: **do not run 8 301 merges.** These are not duplicate content; they are two pages on the same topic from different angles. A 301 destroys unique content, and the merge direction may run against the link equity.

---

## 1. Three measurements

### 1.1 Content overlap (8-gram Jaccard over body, nav/header/footer stripped)

| Topic | Asset page | guides article | Overlap | Verdict |
|---|---|---|---|---|
| size-chart | 995 w | 1125 w | 0.074 | not duplicate |
| weight | 1042 | 1005 | 0.079 | not duplicate |
| by-age | 1155 | 1239 | 0.068 | not duplicate |
| what-buyers-say | 893 | 1144 | 0.079 | not duplicate |
| safety-standards | 1002 | 1108 | 0.074 | not duplicate |
| stability | 1210 | 1319 | 0.061 | not duplicate |
| recalls | 6218 | 1058 | **0.022** | near-zero overlap |
| budget / price-tiers | 1181 | 1097 | 0.068 | not duplicate |

Reference line: >0.30 is suspicious, >0.50 is substantial duplication. **All 8 pairs land between 0.02 and 0.08, max 0.079.**

### 1.2 Internal links (271 HTML files in dist)

| Target | Links | Nature |
|---|---|---|
| each asset page (bare root) | **270** | `ReferenceClusterNav`, site-wide template link |
| each guides article | **44** | in-body contextual links + section pages |

A single contextual in-body link carries more weight than a single template nav link, but 270 vs 44 is a 6x gap. **If the rule is "merge into the stronger side," the direction is not obvious** — and the original plan "asset → guides" moves the page with 270 links into the page with 44.

### 1.3 H1 semantic divergence (the real cannibalization signal)

| Topic | Asset H1 | guides H1 | Intent separable? |
|---|---|---|---|
| size-chart | Real Specs Compared Side by Side | Fit by Inseam | yes — lookup vs how-to |
| weight | How much does a balance bike weigh? | Why It Matters | yes — number vs meaning |
| recalls | Record: Every US CPSC Recall Since 2000 | A Buyer's Guide | yes — archive vs guide |
| budget | Cheap Picks That Last | Price Tiers: What Each Buys | yes — picks vs tiers |
| stability | ...why nobody publishes the number | What Holds | partial |
| safety-standards | Explained | Guide | near-synonymous |
| by-age | Which bikes actually fit at 2 years old | What Fits Each Year | heavy overlap |
| what-buyers-say | What Buyers Say About Balance Bikes | What Buyers Say About Balance Bikes | **verbatim identical** |

---

## 2. This breaks the premise of "301 merge"

Merging duplicates only holds when the content is actually duplicated. It is not:

1. **Content does not overlap** (≤8%). After a 301, the merged page's unique content disappears with it — the 6218-word CPSC recall archive is the clearest case — unless it is first folded into the surviving page by hand. That is content relocation, not consolidation.
2. **The recalls pair especially must not merge.** 6218 words, one of the thickest pages on the site and the only CPSC recall archive we have; the guides piece is a 1058-word buyer's guide. Overlap is 0.022. Merging either direction is a net loss.
3. **The actual problem is intent collision, not duplication.** In 6 of 8 pairs both pages chase the same query, so Google cannot pick a winner and may rank neither well. The fix for collision is **making intent separable** — not deleting a page.

### Exception: what-buyers-say does need action

Both H1s are verbatim identical and the subhead structures closely mirror each other (`What they mention`, `The three hedges`, `Every listing counted`). This is the only pair close to true duplication. **This one is worth merging or forcing one side to be rewritten.**

---

## 3. Proposed plan (three tiers, by intervention strength)

### Tier A — keep both pages, no change (4 pairs)
`size-chart`, `weight`, `recalls`, `budget`
Intent is already separated; H1 and angle do not collide. Leave alone.

### Tier B — rewrite H1 / TDK to force separation (3 pairs)
`safety-standards`, `by-age`, `stability`
Titles are near-synonymous. Approach:
- asset page = **data / measured angle** (which is how it is already written: spec comparison, coverage counts, measurement gaps)
- guides article = **decision / action angle** (how to choose, how to measure, what to do)
- change H1 + title + meta description only; body untouched

### Tier C — what-buyers-say, pick one (1 pair)
Both H1s identical. Choose:
- **C1 (recommended, executed)**: rewrite the guides piece into an action angle (e.g. "How to Read a Buyer-Sentiment Summary"), keep the asset page on the data angle — same technique as Tier B, no content lost
- **C2 (not taken)**: 301 one into the other, folding unique paragraphs into the survivor first

**What C1 actually changed (2026-10-22)**

Retitling alone would have treated the symptom. The real duplication was in the body: `What they mention` and `The three hedges` restated the asset page's count table with the same figures.

1. Both count sections removed from the guide. The numbers are not lost — they stay on `/balance-bike-what-buyers-say/`, and the guide now links there instead of repeating them.
2. New section `When a summary tells you nothing` (no summary / a reused one / unqualified praise). Its figures are catalogue-wide — 10 of 174 products carry no summary, 5 of 164 summaries are reused — while the asset page only counts the 14 balance bikes, so this is new information rather than a re-cut of existing copy.
3. `How to read one in sixty seconds` and `What summaries cannot tell you` kept: they are the guide's actual job and have no counterpart on the asset page.

| | asset page | guide |
|---|---|---|
| H1 | What Buyers Say About Balance Bikes: All 14 Summaries, Counted | How to Read Balance Bike Buyer Reviews |
| body | 893 words (untouched) | 1149 → 1351 words |
| 8-gram overlap | — | 0.079 → **0.067** |

Headings are now fully disjoint apart from `Method`. The residual overlap was checked shingle by shingle: every remaining shared span comes from the `ReferenceClusterNav` block both pages render, not from body copy. 0.067 therefore needs no further work — it sits inside the 0.02–0.08 band the other seven pairs were already in.

### /safety/ hub (separate item)
`/safety/` returns 404 live, has 0 internal links, and is absent from the sitemap (not among the 270). **Currently harmless** — nothing links to it and nothing submits it. But the site's thickest page, `/safety/balance-bike-recalls/`, sits under it, so the parent path is empty and the hierarchy is orphaned.

Three options:
- **Build the hub**: upside is topical aggregation plus a parent page to carry the recall archive; cost is one more page to maintain and get indexed
- **Leave it 404**: zero cost, zero gain, since no entry point references it
- **Migrate**: move the recall archive under `/guides/risk/` and drop the `/safety/` level — but that changes the URL of an already-indexed page, i.e. a fresh 301, which contradicts the whole point of avoiding redirects here

---

## 4. Risk and verification

| Risk | Note |
|---|---|
| 301 is irreversible | needs a Worker redeploy (CF token) plus re-crawl; the fluctuation window is measured in weeks |
| Traffic base is tiny | GSC baseline: US 156 impressions / 0 clicks. Merge or separation — **the short-term SEO delta is small either way**; the real cost is engineering effort and irreversibility |
| No URL-level GSC data | only a site-level baseline exists, so we cannot tell which side already ranks. Deciding after URL-level detail lands would be safer |

**Verification** (the usual three layers):
1. raw static HTML (`curl`)
2. hydrated DOM (Playwright — does the SPA rewrite it?)
3. live probes plus reverse-verification of the static guard (break it on purpose, the guard must fail)

---

## 5. One-line conclusion

These 8 pairs are not duplicate content, they are intent collisions. **Do not delete pages — separate the intent.** The only pair worth merging is what-buyers-say (verbatim identical H1), and even there a rewrite is the better first move — done under C1, and the rewrite went to the body, not just the title.

> **Lesson**: fixing an H1 collision can treat the symptom. For this pair the duplication lived in two count sections of the body. The signal that found it was *are the subheads parallel* and *is the same set of figures written twice* — not word count, and not the whole-page Jaccard, which site-wide nav copy dilutes into looking normal.
