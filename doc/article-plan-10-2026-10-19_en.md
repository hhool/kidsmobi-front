# 10-Article Allocation & Per-Article Spec (2026-10-19)

> Companions: `doc/backlink-outreach-pack-2026-10-19_en.md` (outreach material source), `doc/spa-canonical-overwrite-2026-10-19_en.md` (dual-renderer lesson).
> Nature: **planning document — no site code changed.** CMS writes require `CMS_ADMIN_ALL_TOKEN` (not available locally; user must supply it or operate in the admin UI).
> Baseline: CMS news 4 published, guides 3 published (all beginner) + 45 archived stub records; sitemap 247 URLs.

---

## 0. Allocation overview

| # | Collection | Category | Working title | Priority |
|---|------------|----------|---------------|----------|
| G1 | guides | budget | Balance Bike Price Tiers: What Each Buys | P0 |
| G2 | guides | beginner | Balance Bike vs Training Wheels: What Wins | P0 |
| G3 | guides | scenario | Where to Ride a Balance Bike: A Terrain Guide | P1 |
| G4 | guides | risk | Before the First Ride: 5 Safety Checks | P1 |
| G5 | guides | maintenance | Balance Bike Maintenance: What Matters | P2 |
| G6 | guides | special | Balance Bikes for Kids Who Need Support | P2 |
| N7 | news | science | What Research Says About Balance Bikes | P1 |
| N8 | news | industry | 2026 Kids' Ride-On Safety Standard Updates | P1 |
| N9 | news | new_product | New Balance Bike Launches: 2026 Roundup | P2 |
| N10 | news | brand_news | Brand updates (real monthly news, beat-based) | P2 |

**Why 6+4**: guides has 5 empty categories (scenario/budget/risk/special/maintenance have no index pages at all) — 6 articles activate all of them; news gets one more per category to turn single-page orphans into small clusters. G1/G2 first: G1 directly serves the GSC "stable track" carrier `/balance-bike-budget/`; G2 targets the highest-volume beginner intent.

**Publish order**: G1 → G2 → G3 → G4 → G5 → G6 → N7 → N8 → N9 → N10 (2-3 per week, ~4 weeks, parallel to outreach weeks 1-3).

---

## 1. Per-article specs

### G1 · guides / budget · P0

- **Title**: EN `Balance Bike Price Tiers: What Each Buys` (40 chars) + brand suffix = 61 ✓ ｜ ZH `平衡车价格档位：各档实际买到什么`
- **slug**: `balance-bike-price-tiers`
- **description**: EN `What $50, $100 and $200 actually buy in a balance bike — frame, tire and weight trade-offs at each tier, and the checks that separate a keeper from a dud.` (154) ｜ ZH `50/100/200 美元档位各买到什么：车架、轮胎与重量的真实取舍，以及区分值得留与该避开的检查项。`
- **keywords**: balance bike price, cheap balance bike, budget balance bike, is a balance bike worth it
- **Intent**: budget decisions ("cheap balance bike" / "balance bike under $100")
- **Asset link**: `/balance-bike-budget/`, anchor `budget balance bike guide` (stable-track carrier — highest site-wide anchor priority)
- **Outline**: ① What each tier buys (frame material / tire type / weight range — published specs only); ② What doesn't change with price (seat height vs inseam fit logic); ③ The checks that separate a keeper from a dud; ④ Further reading (budget asset page)
- **Honesty guardrails**: published seller specs only, no testing claims; price ranges stated as typical ranges, no live-price assertions

### G2 · guides / beginner · P0

- **Title**: EN `Balance Bike vs Training Wheels: What Wins` (42) ｜ ZH `平衡车 vs 训练轮：到底哪个好`
- **slug**: `balance-bike-vs-training-wheels`
- **description**: EN `Balance bike or training wheels? What published research and parent reports say about which teaches balance faster, and when each one still makes sense.` (152) ｜ ZH `平衡车还是训练轮？已发表研究与家长反馈怎么说，以及各自真正适用的场景。`
- **keywords**: balance bike vs training wheels, do balance bikes work, training wheels age
- **Intent**: highest-volume beginner question
- **Asset links**: `/balance-bike-by-age/` (anchor `balance bike by age`) + `/balance-bike-safety-standards/`
- **Outline**: ① Where each answer comes from; ② What the research says (real studies, links verified at writing time); ③ Fit is the prerequisite (inseam → seat height); ④ When training wheels still make sense; ⑤ Realistic transition timeline
- **Honesty guardrails**: studies must be real and linked; sample sizes and limits stated; no absolute "research proves" conclusions

### G3 · guides / scenario · P1

- **Title**: EN `Where to Ride a Balance Bike: Terrain Guide` (43) ｜ ZH `平衡车在哪里骑：地形指南`
- **slug**: `where-to-ride-balance-bike`
- **description**: EN `Pavement, parks, grass, gravel or indoors: how each surface changes what matters in a balance bike, from tire type to frame weight.` (131) ｜ ZH `人行道、公园、草地、砾石或室内：不同路面如何改变平衡车的轮胎与重量取舍。`
- **keywords**: where to ride balance bike, balance bike terrain, balance bike tires pavement grass
- **Asset link**: `/balance-bike-stability/` (anchor `what makes a stable track balance bike` — second carrier page)
- **Outline**: ① Surface by surface: pavement / park paths / grass / gravel / indoors; ② Which specs each surface amplifies (tire type, weight); ③ Terrain × weight in practice; ④ Safety and etiquette; ⑤ Typical US/UK venues
- **Honesty guardrails**: terrain advice grounded in physics and published specs; no invented field tests

### G4 · guides / risk · P1

- **Title**: EN `Before the First Ride: 5 Safety Checks` (38) ｜ ZH `第一次骑行前：5 项安全检查`
- **slug**: `balance-bike-safety-checks`
- **description**: EN `Five checks before the first ride: seat height vs inseam, sharp edges, loose bolts, handlebar grip, and helmet fit — with the standards behind each.` (148) ｜ ZH `首骑前的 5 项检查：座高与腿长、锐边、松动螺栓、把套与头盔贴合——每项背后的标准依据。`
- **keywords**: balance bike safety, balance bike checklist, balance bike helmet age
- **Asset links**: `/balance-bike-safety-standards/` + `/safety/balance-bike-recalls/` (anchor `balance bike recall record`)
- **Outline**: ① Checks 1-5 (how / why / standard behind each); ② Check recalls before buying; ③ Helmets: when required, what fit means; ④ What not to do (no over-safety)
- **Honesty guardrails**: standard references (16 CFR 1512 / ASTM F963 / EN 71) must match the safety-standards asset page; no medical claims

### G5 · guides / maintenance · P2

- **Title**: EN `Balance Bike Maintenance: What Matters` (38) ｜ ZH `平衡车保养：真正重要的事`
- **slug**: `balance-bike-maintenance`
- **description**: EN `What actually needs maintenance on a balance bike — tires, bolts, brakes if fitted — what you can ignore, and how frame material changes the upkeep.` (148) ｜ ZH `平衡车真正需要保养的部分——轮胎、螺栓、刹车（如有），可以忽略的部分，以及车架材质如何改变保养量。`
- **keywords**: balance bike maintenance, balance bike tires foam air, balance bike bolts
- **Asset link**: `/balance-bike-weight/` (anchor `how much a balance bike weighs` — frame material data)
- **Outline**: ① The short list (3 things that actually matter); ② Tires: foam vs air upkeep; ③ Bolts and steering; ④ Extra items for brake-equipped models; ⑤ Frame material vs upkeep; ⑥ When to retire
- **Honesty guardrails**: maintenance advice follows manufacturer published manuals; no invented long-term usage data

### G6 · guides / special · P2

- **Title**: EN `Balance Bikes for Kids Who Need Support` (39) ｜ ZH `需要额外支持的孩子怎么选平衡车`
- **slug**: `balance-bikes-extra-support`
- **description**: EN `For kids who need extra support: inseam-first sizing, step-through frames, and the adjustments that matter more than the model you pick.` (136) ｜ ZH `给需要额外支持的孩子：腿长优先的尺码逻辑、低横梁车架，以及比型号更重要的调节项。`
- **keywords**: balance bike special needs, adaptive balance bike, balance bike inseam fit
- **Asset link**: `/balance-bike-size-chart/` (anchor `balance bike size chart`)
- **Outline**: ① Fit first (inseam → seat height, citing the size-chart method); ② Frame geometry: step-through, narrow Q-factor; ③ Weight and handling; ④ Four adjustments that matter more than the model; ⑤ Explicit boundary: no medical advice — consult professionals
- **Honesty guardrails**: **zero medical/therapy claims**; no absolute "suitable for condition X" assertions — verifiable physical fit only

### N7 · news / science · P1

- **Title**: EN `What Research Says About Balance Bikes` (38) ｜ ZH `研究怎么看平衡车`
- **slug**: `balance-bike-research`
- **description**: EN `What published research says about balance bikes and early motor development — and the caveats that come with the studies.` (122) ｜ ZH `已发表研究对平衡车与早期运动发展怎么说，以及这些研究自带的前提与局限。`
- **keywords**: balance bike research, balance bike motor development, balance bike study
- **Asset link**: `/balance-bike-by-age/` (anchor `balance bike by age` — age-fit counts)
- **Outline**: ① What the studies measure; ② Common findings (each with a real, linkable citation, verified at writing time); ③ What the research does NOT show (the honesty section); ④ How parents should use this
- **Honesty guardrails**: every citation real and linkable; sample sizes and limitations stated — this section is the article's core value, not decoration

### N8 · news / industry · P1

- **Title**: EN `2026 Kids' Ride-On Safety Standard Updates` (42) ｜ ZH `2026 儿童骑乘玩具安全标准更新`
- **slug**: `ride-on-safety-standards-2026`
- **description**: EN `US and EU safety standard updates affecting kids' ride-ons in 2026 — what changed, what it means for balance bikes, and how to verify compliance.` (145) ｜ ZH `2026 年美欧儿童骑乘玩具安全标准更新——改了什么、对平衡车意味着什么、怎么验证合规。`
- **keywords**: kids bike safety standards, CPSC balance bike, EN 71 ride-on, balance bike regulations
- **Asset links**: `/balance-bike-safety-standards/` + `/safety/balance-bike-recalls/`
- **Outline**: ① US side (CPSC/ASTM); ② EU side (EN 71 series); ③ The balance-bike standards gap; ④ Verification steps (labels / certificates / recall lookup)
- **Honesty guardrails**: **verify the real standard status at publish time**; if nothing changed, rewrite as a "current standards explainer"; never write unverified claims

### N9 · news / new_product · P2 (beat-based)

- **Title**: EN `New Balance Bike Launches: 2026 Roundup` (39) ｜ ZH `2026 新平衡车发布盘点`
- **slug**: `new-balance-bikes-2026`
- **description**: EN `The balance bike launches of 2026 worth a second look — spec changes in weight, seat range and tires, and what they mean for fit.` (129) ｜ ZH `2026 年值得多看两眼的平衡车新品——重量、座高范围与轮胎的变化，以及对适配的意义。`
- **keywords**: new balance bike 2026, balance bike launches, best new balance bike
- **Asset link**: `/balance-bike-size-chart/` (anchor `balance bike size chart`)
- **Outline**: ① Model by model (real launches at publish time); ② Spec deltas (weight / seat range / tires); ③ Fit implications; ④ Which changes are marketing vs substantive
- **Honesty guardrails**: only real products available at publish time; specs from manufacturer publications

### N10 · news / brand_news · P2 (beat-based)

- **Title**: EN `Brand News: Balance Bike Updates — [Month]` (follows existing brand_news conventions) ｜ ZH `品牌动态：平衡车本月消息`
- **slug**: `brand-news-balance-bike-[month]`
- **description**: follow the existing brand_news style (see the published foldable-scooter brand roundup)
- **keywords**: balance bike brands news, strider news, woom news
- **Asset link**: `/products/balance-bikes/` (category hub)
- **Outline**: brand moves (launches / partnerships / distribution); what they mean for our readers
- **Honesty guardrails**: verifiable real events only

---

## 2. TDK for the five new guides index pages (created on first article publish; must enter CMS settings.seo as single source)

| Index page | Title (≤65) | Description (≤155) |
|------------|-------------|---------------------|
| `/guides/budget/` | `Balance Bike on a Budget: Guides & Tiers \| BalanceBikeToddler` | `Budget balance bike guides: what each price tier buys, the trade-offs in frame, tires and weight, and the checks that separate a keeper from a dud.` |
| `/guides/scenario/` | `Where & How to Ride: Balance Bike Scenarios \| BalanceBikeToddler` | `Balance bike guides by riding scenario: pavement, parks, grass, gravel and indoors — how each surface changes what matters in tires and frame weight.` |
| `/guides/risk/` | `Balance Bike Safety Risks & Pre-Ride Checks \| BalanceBikeToddler` | `Balance bike safety guides: the pre-ride checks that matter, the standards behind them, and how to check recalls before you buy.` |
| `/guides/maintenance/` | `Balance Bike Maintenance & Upkeep Guides \| BalanceBikeToddler` | `Balance bike maintenance guides: what actually needs attention, what you can ignore, and how frame material changes the upkeep.` |
| `/guides/special/` | `Balance Bike Fit for Extra Support Needs \| BalanceBikeToddler` | `Balance bike fit guides for children who need extra support: inseam-first sizing, step-through frames, and the adjustments that matter most.` |

Also update the `check:spatitles` expectation table (+5 index pages) and `pageKeywords.ts` if index-page keywords enter the single source.

---

## 3. CMS field mapping (fill per article at implementation)

**guides records**:
- `category` and `taxonomy.topicCategory` ∈ route whitelist {beginner, scenario, budget, risk, special, maintenance}; both must match
- `taxonomy.hub` = `all_guides`; `hierarchyPath` per existing convention
- `status` = `published`; `slug` per the table above
- `seo.en.title/description` + `seo.zh.title/description` both required; body fields bilingual too

**news records**:
- `category` ∈ route whitelist {new_product, science, brand_news, industry}
- `slug` per the table above; `status` = `published`
- Bilingual seo fields as above

**Universal constraints**: title base ≤44 chars (+ ` | BalanceBikeToddler` suffix = ≤65); description ≤155 chars (word-boundary truncation); ≤5 keywords; 1-2 asset-page links per article with the specified anchors, no stuffing.

---

## 4. Impact & verification checklist (run after implementation)

1. **Sitemap baseline 247 → 262** (10 articles + 5 new index pages; news index pages already exist)
2. `npm run check:lazyexports` + `check:hydration` (14+ routes including the new index pages)
3. `check:spatitles` (expectation table +5), `check:spakeywords`, `check:spacanonicals` (250+ routes recomputed), `check:claims`, `check:reviewcounts`
4. Honesty guard dual phase: dist scan + source scan both 0 findings
5. No 301s involved (all new URLs, no migration); the three existing `/guides/beginner/*` articles stay untouched
6. After deploy + purge, Wednesday IndexNow picks up the new URLs automatically; GSC-side Request Indexing for the 10 new URLs is a user action
7. Cleaning the 45 archived beginner stub records is optional CMS housekeeping; no frontend impact

---

## 5. Implementation prerequisites

- CMS write token `CMS_ADMIN_ALL_TOKEN` (not available locally) — once provided I can generate per-article payloads and write them; or the user enters fields per this document in the admin UI
- N9/N10 are beat-based: write only when real material exists that week; otherwise slip — no filler
- Every article passes the honesty checklist before publish (especially N7 citations, N8 standard status, G6 zero medical claims)
