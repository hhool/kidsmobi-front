# Derived duplication scan: closing the "only eight pairs" blind spot

Date: 2026-10-22
Trigger: while closing B-track the user pointed out that only the what-buyers-say pair had ever been measured for real body duplication. Measuring the other seven raised the obvious question: **the pair list is hard-coded to eight — who watches anything written after that?**
Answer: nobody. Deriving the pair set from the build surfaced two real problems inside minutes, and one of them exposed published figures that the catalog does not support.

---

## 1. Method: fix the measurement before believing the result

The first version of `check:pairdrift` had two blind spots, either of which is enough to distort the answer.

### 1.1 `df >= 20` cannot see boilerplate that lives on 4-9 pages

Document frequency assumes boilerplate appears on many pages. This site has template output that belongs to one section only:

| Template heading | Pages |
| --- | --- |
| `Method and limits` (news) | 4 |
| `What this data cannot tell you` / `What this guide cannot tell you` (asset pages) | 4 |
| `How these numbers were produced` / `How these counts were produced` (asset pages) | 3 |

None of those can ever reach 20, so they counted as editorial. This was measured, not assumed: the two electric ride-on articles came out at **0.102** body overlap, and a line-by-line check of the shared 8-grams showed more than half of it was the method note repeated verbatim. Real editorial overlap: **0.046**.

Fix: cluster headings by word bag (>= 0.6, single linkage) and treat any cluster seen on >= 3 pages as a template section, dropping it from both the body text and the subhead comparison. That is how `How these counts were produced` joins `How these numbers were produced` without anyone listing either. The byline carries a date, so no df threshold can ever recognise it; it is stripped by pattern.

### 1.2 The pair list was eight hard-coded rows

Anything written later was never compared. The pair set is now derived from dist: **every editorial leaf page against every other one** (articles, asset pages, transparency pages). Two exclusions:

- product detail pages — their spec tables are the same fields with different values;
- listing pages (hubs, section indexes, type pages) — a hub restating its children is what a hub is for.

Thresholds: `bodyOnly > 0.08`, `subheadSim > 0.6`. Today's worst pair sits at 0.053 / 0.2.

---

## 2. Finding 1: the two electric ride-on articles were doing the same job

Top of the derived scan: `electric-dirt-bikes-for-kids` vs `kids-electric-bike-development-trends-2026` — body **0.046**, subheads **0.6** (`Five checks that transfer` vs `Three checks that transfer`).

Reading them side by side turned up something worse than overlap: **both publish counts the catalog does not support, and the two pages contradict each other.**

| Figure | Both articles said | Catalog says |
| --- | --- | --- |
| voltage in title | 14/16 (12V x8, 24V x4, 36V x1, 6V x1); the two without are a wiggle car and a helmet | **15/16** (12V x8, **24V x5**, 36V x1, 6V x1); the one without is a wiggle car |
| parental remote | 10/16 titles | **11/16** titles (12V 6 of 8, 24V 5 of 5) |
| charging time | stated in 6 spec sheets | **0/16** — no listing states one |
| weight capacity | 13/16 | **14/16** (55-264 lb) |
| minimum age | 15/16, 13 of them >= 36 months | **16/16**, **14** of them >= 36 months (13 at 36, one at 37) |
| assembly required | 15/16 | **16/16** |
| 12V speeds | "the 12V models state 1.5-4 MPH in title copy" | two 12V titles state **1.5** and **3.5** MPH; the **4 MPH** figure is on a wiggle car with no stated voltage |

That last row is the clearest one: `1.5-4` comes from `for Toddlers 1.5-4` in the Gotrax RT1 title. It is an **age range**, not a speed.

Both articles also mixed the 16 counted listings with the helmet: **17** listings carry the electric ride-on tag, one of them a helmet the category page does not show, which is why every count covers **16**.

**What was done:**

1. Every figure corrected to the recount, English and Chinese (`scripts/fix-electric-news-figures.mjs`; dry run, then `?cb` re-read verification).
2. The figures made **recomputable**: `scripts/count-electric-rideon-figures.mjs` reprints the same table from the live catalog, so nobody has to trust them next time.
3. Intent separated: the off-road article's section is now `Five checks before it goes off-road`, every check is scoped to leaving pavement, and the age/capacity checks point at the voltage article's tier-by-tier numbers with a cross-link.

Result: subheads **0.6 -> 0.2**. Body went 0.046 -> 0.053 — both pages now have to cite the same recounted figures, which is overlap the shared dataset forces, still far below 0.08.

## 3. Finding 2: two research pages with a byte-identical subhead

`guides/beginner/balance-bike-vs-training-wheels` vs `news/science/balance-bike-research` at `subheadSim = 1.0` — both carry a section headed **`What the studies measured`**, both walk through the same two Portuguese studies with the same figures (4.16 / 5.97 / 7.27 years, 100% vs ~77%).

Body 8-gram overlap stayed low only because the phrasing differs. In substance it is the same research written twice — precisely the what-buyers-say failure mode.

**What was done:** the buying guide keeps the finding the decision rests on, compressed to one paragraph, and hands study design, sample sizes and the reviewers' objections to the research page, linking to it (`scripts/separate-research-duplication.mjs`). No number was deleted; the long version lives in one place.

---

## 4. Lessons

1. **Figures have to be recomputable, not just trusted.** They were counted once, by hand, at writing time, and never checked again. Two articles contradicted each other and the catalog while both claimed every figure was counted from the published catalog. Now a script backs that sentence.
2. **A hard-coded pair list misses everything written afterwards.** Deriving the pairs costs a pairwise pass over 71 pages (seconds) and means new articles are covered the day they ship.
3. **Reverse verification has to confirm the payload lands where the guard can see it.** Three consecutive "the guard stayed green" results were my payload's fault: inside `<header>`, inside a trailing template section, and simply too short. Real prose before the first `<h2>` produced `bodyOnly 0.23 > 0.08` immediately.
4. **A new way for a guard to be silently green:** the first derived scan spread `...subheadMatch()`, so the field was named `score`, not `subheadSim`. `undefined > 0.6` is always false — the scan looked clean while the subhead check had never run once. Renaming the field made the research pair report 1.0 the same minute. **A wrong field name in an object spread does not throw; it just does nothing.**

## 5. Verification

- 14 static guards green, `tsc --noEmit` clean, hydration probe 38/38.
- `check:pairdrift`: 8 named pairs + 13 derived pairs pass; the top two derived pairs are 0.053 and 0.043 against a 0.08 threshold.
- Reverse verification: 3000 characters of real research-article prose pasted into the off-road article reports exactly `bodyOnly 0.23`; restoring turns it green.
- Sitemap still 270 URLs; legacy redirects unchanged at 45 exact + 10 prefix.
