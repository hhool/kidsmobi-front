# Site Primary Keyword Difficulty Research Checklist (Ahrefs / Semrush)

> Purpose: Before committing to the "5 primary site keywords" strategy, pull **real KD (Keyword Difficulty), monthly volume, CPC, and SERP profile** using your own Ahrefs / Semrush account. This file only provides copy-pasteable query lists + an SOP. **It does not replace the data** — every decision rests on the numbers you export.
>
> 5 primary terms: balance bike, electric car (for kids), double stroller, jogger stroller, travel stroller.
> Maps to site clusters: balance-bike, kids-ride-on, kids-stroller.

---

## 1. Head-terms (5 — check these first)

Paste directly into Ahrefs Keywords Explorer or Semrush Keyword Magic Tool bulk box (one per line):

```
balance bike
electric car for kids
kids electric car
double stroller
jogger stroller
travel stroller
```

⚠️ **Intent red line**: Do NOT query bare `electric car` — that belongs to Tesla/Nissan/GM (KD 80+), unrankable for a kids site. Only query `electric car for kids` / `kids electric car` (kids intent). The site's current `all` default block wrongly says `kids electric bike`; fix on implementation.

⚠️ **double vs twin**: Real volume for `double stroller` ≫ `twin stroller`. Standardize on "double" site-wide; stop using "twin".

---

## 2. Long-tail variants (grouped by head-term, ~40, bulk-import ready)

### 1) balance bike (7 pages already; add age/scene long-tails)
```
balance bike for 1 year old
balance bike for 2 year old
balance bike for 3 year old
best balance bike 2026
balance bike for toddlers
balance bike with brakes
wooden balance bike
balance bike vs training wheels
12 inch balance bike
lightweight balance bike
balance bike age range
balance bike helmet
```

### 2) electric car for kids (highest demand + existing kids-ride-on cluster)
```
electric car for kids
kids electric car
ride on car for kids
12v kids electric car
24v ride on car
electric ride on car with remote control
kids electric car with parental control
best electric car for kids 2026
toddler electric car
2 seater ride on car
ride on car for 2-5 year olds
cheap kids electric car
kids electric car 12v with remote
```

### 3) double stroller (fold into strollers hub; target winnable long-tails)
```
best double stroller 2026
double stroller for twins
side by side double stroller
double stroller for infant and toddler
lightweight double stroller
double stroller for travel
best double travel stroller
double jogging stroller
compact double stroller
double stroller for newborn and toddler
tandem double stroller
graco double stroller
```

### 4) jogger stroller (fold into strollers hub; slowest expected payoff)
```
best jogging stroller 2026
jogging stroller for trails
double jogging stroller
jogging stroller for baby
lightweight jogging stroller
jogging stroller with car seat
bob jogging stroller
jogging stroller for newborns
best jogging stroller for runners
affordable jogging stroller
jogging stroller vs regular stroller
```

### 5) travel stroller (highest demand, longest tail — do first)
```
best travel stroller 2026
travel stroller for airplane
travel stroller for toddler
lightweight travel stroller
compact travel stroller
travel stroller for 2 year old
best travel stroller for airplane 2026
travel stroller with car seat
umbrella travel stroller
travel stroller for newborn
foldable travel stroller
travel stroller for cruise
best travel stroller for 3 year old
```

---

## 3. Ahrefs SOP (recommended — clearest KD scale)

1. Log in → **Keywords Explorer**.
2. Top-right: set country (`United States`), language (`English`).
3. Paste any group (head-terms or one long-tail set) into the **"Multiple keywords"** icon → bulk analyze.
4. For each term read: **KD (0–100)**, **Volume**, **CPC**, **Clicks**, **Parent Topic**, **SERP overview (top-10 domain DR)**.
5. Export: top-right **Export → CSV**, include `Keyword, Volume, KD, CPC, Clicks, Return Rate, Parent Topic`.
6. Use **Keyword Magic Tool** → `Phrase match` with a head-term as seed to auto-expand more long-tails (this list is the curated seed set).

**KD scale (Ahrefs)**: 0–10 trivial; 10–30 easy; 30–50 medium (winnable — long-tail battleground); 50–70 hard (needs 100+ referring domains); 70+ very hard (dominated by giants).

---

## 4. Semrush SOP (alternative)

1. Log in → **Keyword Magic Tool**.
2. Enter a head-term (e.g. `travel stroller`), country `United States`, database `Organic`.
3. Read **KD%**, **Volume**, **CPC**, **Trend**, **SF (SERP features)**.
4. Select list terms → **+ Add to keyword list** → Export CSV (`Keyword, Volume, KD%, CPC, Competition`).
5. Left **Advanced filters**: `KD <= 49` to surface winnable long-tails.

**KD% bands**: 0–14 trivial; 15–29 easy; 30–49 medium; 50–69 hard; 70–100 very hard.

---

## 5. Results template (fill after export — we decide from this)

Copy the table, fill exported numbers (example rows are placeholders, not real data):

| Keyword | Volume | KD(Ahrefs)/KD% | CPC | Parent Topic | Top-10 DR | Existing page? | Verdict |
|---|---|---|---|---|---|---|---|
| balance bike | — | — | — | — | — | 7 pages | TBD |
| electric car for kids | — | — | — | — | — | kids-ride-on 8 | TBD |
| double stroller | — | — | — | — | — | strollers hub | TBD |
| jogger stroller | — | — | — | — | — | strollers hub | TBD |
| travel stroller | — | — | — | — | — | strollers hub | TBD |
| best double stroller for travel | — | 34(measured) | — | — | — | no | high pri |
| travel stroller for airplane | — | — | — | — | — | no | TBD |

---

## 6. Decision criteria (how we commit once data is in)

- **head-term KD ≥ 50**: don't attack directly; use long-tail hub route (guide pages + internal links passing authority).
- **long-tail KD 30–49 AND Volume ≥ 100/mo**: prioritize as implementation pages (high conversion, winnable).
- **long-tail KD < 30**: just build it — near-free rankings.
- **Parent Topic mismatches head-term**: intent mismatch, don't force it.
- **Output**: rank by Volume × winnability (KD≤49) → produce "priority long-tail page list" → enter Phase B (implementation plan).

---

## 7. Next step

After you export the CSV, fill Section 5 (or paste the CSV to me). I will then:
1. Rank the **priority long-tail page list**;
2. Produce a **hub + long-tail page implementation plan** per primary term (the earlier Phase B);
3. Flag which need new standalone slugs vs. fold into the existing `/products/strollers/` hub.
