# Long-tail Hub Implementation Plan (Phase B) — 5 Site-Primary Keywords

> Premise: the 5 site-primary terms (balance bike, electric car for kids, double stroller, jogger stroller, travel stroller) have head-term Google KD mostly 50–70. Attacking them directly needs 100+ referring domains — poor ROI.
> Route (confirmed with user): **long-tail hub** — treat each primary term as a hub, capture traffic with KD 30–49, volume ≥100/mo "best X for Y / X for [age/scene]" guide pages. Higher conversion, winnable, reuses the existing guides cluster model.
> This plan is based on the estimated difficulty profile (not exact Ahrefs numbers; get those via `keyword-difficulty-checklist_en.md` and backfill to correct).

---

## 1. Priority (estimated KD × volume)

| Rank | Term | Why here | Existing assets | Long-tail play |
|---|---|---|---|---|
| 1 | **travel stroller** | Largest demand, longest tail (airplane/toddler/ultralight/2026) | Only folded into `/products/strollers/` | Build long-tail guides first |
| 2 | **electric car for kids** | Largest demand + existing kids-ride-on cluster; fix intent first | `/products/electric-cars/` + 8 ride-on pages | Add "best electric car for kids 2026" etc. |
| 3 | **balance bike** | 7 pages already; just add age/scene long-tails | 7 guides + `/products/balance-bikes/` | Age/scene long-tails |
| 4 | **double stroller** | Fold into strollers hub; target measured KD34 "best double stroller for travel" | Folded into `/products/strollers/` | Long-tail + hub |
| 5 | **jogger stroller** | Fold into strollers hub; Amazon brand concentration, slowest payoff | Folded into `/products/strollers/` | Long-tail + hub |

---

## 2. Long-tail page list (by term, with priority + estimated KD band)

### travel stroller (highest priority)
- `best travel stroller 2026` — core hub page
- `travel stroller for airplane` — high-conversion scene
- `travel stroller for toddler` — age
- `lightweight travel stroller`
- `compact travel stroller`
- `best travel stroller for airplane 2026`
- `travel stroller with car seat`
- `umbrella travel stroller`
- `travel stroller for newborn`
- `foldable travel stroller`
- `travel stroller for cruise`
- `travel stroller for 2 year old`
- `best travel stroller for 3 year old`

### electric car for kids
- `best electric car for kids 2026` — core hub page
- `12v kids electric car` — spec long-tail
- `24v ride on car`
- `electric ride on car with remote control`
- `kids electric car with parental control`
- `2 seater ride on car`
- `ride on car for 2-5 year olds`
- `cheap kids electric car`
- `kids electric car 12v with remote`
- `toddler electric car`

### balance bike (add onto existing 7)
- `balance bike for 1 year old`
- `balance bike for 2 year old`
- `balance bike for 3 year old`
- `best balance bike 2026`
- `balance bike with brakes`
- `wooden balance bike`
- `balance bike vs training wheels`
- `12 inch balance bike`
- `lightweight balance bike`
- `balance bike age range`
- `balance bike helmet`

### double stroller (fold into strollers hub)
- `best double stroller 2026`
- **`best double stroller for travel` (KD34 measured, winnable, top priority)**
- `double stroller for twins`
- `side by side double stroller`
- `double stroller for infant and toddler`
- `lightweight double stroller`
- `double jogging stroller`
- `compact double stroller`
- `double stroller for newborn and toddler`
- `tandem double stroller`
- `graco double stroller`

### jogger stroller (fold into strollers hub, slowest)
- `best jogging stroller 2026`
- `jogging stroller for trails`
- `double jogging stroller` (shared with double)
- `jogging stroller for baby`
- `lightweight jogging stroller`
- `jogging stroller with car seat`
- `bob jogging stroller`
- `jogging stroller for newborns`
- `best jogging stroller for runners`
- `affordable jogging stroller`
- `jogging stroller vs regular stroller`

---

## 3. Slug / URL architecture decisions

- **balance bike / electric car**: independent hubs already exist (`/products/balance-bikes/`, `/products/electric-cars/`) + guides clusters. Long-tail guides use the existing `/guides/<topic>/<slug>` system; no new category directory.
- **stroller three variants (jogger / double / travel)**: **no standalone slug yet**. Reason: thin pages get judged low-quality and drag the site; sharing `/products/strollers/` authority is safer. GSC observability gap (three terms mixed under one URL) is mitigated by:
  - long-tail guide title/H1 naming the exact term (double/travel/jogger), with exact-match anchor text linking to `/products/strollers/` and product pages;
  - only upgrade to a standalone slug (e.g. `/products/double-strollers/`) if a variant's real long-tail volume is large enough to justify a thick standalone page.
- **Red lines**: never target bare `electric car` (Tesla-dominated, KD80+); standardize on `double` site-wide, retire `twin`.

---

## 4. Internal linking & cluster fixes

- Long-tail guides use the **exact term** as anchor text linking to the matching `/products/` commercial page and product detail pages, passing authority.
- Reuse the published `referenceCluster` 48-card block (CMS `settings.referenceCluster`) for related-recommendation modules.
- Product-page CTAs stay as in-site guides (Amazon affiliate intentionally dormant; untouched).
- **Standardize double over twin site-wide**: code layer already fixed (`seoKeywordMap.ts` `all`/`strollers`/`double_strollers`/`jogger_stroller` + `pageKeywords.ts` `CATEGORY_TDK_MAP.stroller` — twin→double, kids electric bike→electric car for kids). **CMS live layer** (`seo.home`/`seo.products`) still lacks double/travel stroller — needs a separate sync (see milestone M1).

---

## 5. Build order (milestones)

- **M1 (optional quick win)**: CMS `seo.home` / `seo.products` add `double stroller` + `travel stroller` (en) and `双人婴儿推车` + `旅行婴儿推车` (zh). Pure addition, within KD limits, zero risk — makes site-level pages reflect all 5 primary terms directly.
- **M2**: travel stroller long-tail guides (highest priority; start with 4–6 core: airplane / toddler / lightweight / 2026 / with car seat / cruise).
- **M3**: electric car for kids long-tail guides (best 2026 / 12v / 24v / remote control / 2 seater).
- **M4**: balance bike age/scene long-tails (for 1/2/3 year old / with brakes / wooden / vs training wheels).
- **M5**: double / jogger long-tails folded into strollers hub (target KD34 best double stroller for travel).
- **M6**: after each batch, rerun `check:spakeywords` / `check:zh-english`; sitemap + GSC index + Performance/Queries watch 5 terms' Impressions / Avg Position (stable rankings take 4–6 weeks).

---

## 6. Verification loop

- After each guide batch: `npm run check:spakeywords`, `npm run check:zh-english`.
- GSC Performance → Queries, filter/regex the 5 primary terms; watch Impressions, Clicks, Avg Position.
- Data lags 2–3 days; new pages need 4–6 weeks to stabilize — don't judge on weekly data; use Compare over two 28-day windows.
- Criterion: 5 terms' Impressions go 0→present, Avg Position climbs from >50 into top 20 → strategy working.

---

## 7. Next step

M1 is an optional quick win (needs one CMS write — production-affecting, confirm before executing). M2–M5 are long-tail guide content production through the existing guides 7-layer wiring (data file + component + App.tsx + prerender + pageKeywords + referenceCluster + 4 hardcoded guard lists). On confirmation, I start M2's first travel-stroller batch.
