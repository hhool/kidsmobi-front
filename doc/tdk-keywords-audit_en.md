# Site TDK Keyword Audit (2026-10-14)

> Source: scanned `src/config/defaultSeo.ts`, the `categoryTdkMap` in `src/App.tsx`,
> and the `keywords` arrays inside `src/data/balanceBike*.ts` + `safetyRecallRecord.ts`
> (seven reference assets). This audit only lists the **TDK (Title / Description /
> Keywords) actually emitted by deployed pages** — no extrapolation or volume assumptions.
>
> ⚠️ House rule: a number without a source and a denominator is not a signal. Except for
> balance bikes, no category on this site has any real GSC or keyword-tool volume data, so
> what follows is "current keyword coverage", not a "popularity ranking".

---

## 0. One premise to state up front

Google has not used `<meta name="keywords">` as a ranking signal since 2019, but Bing /
Yandex / DuckDuckGo still reference it, and the keyword arrays themselves feed internal
anchor text and synonym coverage. This site **still maintains** keyword arrays and writes
them dynamically after hydration via the SPA.

But the audit found: among the prerendered static `dist/*.html` files, **all 247 pages
have no keywords meta** — it is written only by `App.tsx` after browser hydration. This is
the **same class of bug** as the earlier "static vs hydrated title" split (see the
2026-10-14 title-unification commit). The static page crawlers receive has T+D but no K.

---

## 1. Current keyword coverage by section

### 1.1 Default TDK — fallback for routes without a bespoke page (`defaultSeo.ts`)

| Section | EN keywords | ZH keywords |
|---|---|---|
| Home | balance bike · kids bikes · jogging stroller · kids electric scooter · kids electric cars | 儿童平衡车 · 儿童自行车 · 慢跑婴儿推车 · 儿童电动滑板车 · 儿童电动汽车 |
| /products (generic fallback) | kids bike · balance bike · twin stroller · kids electric scooter | 婴儿推车 · 儿童平衡车 · 儿童自行车 · 儿童滑板车 · 儿童电动车 · 儿童安全座椅 |
| /reviews | travel stroller · toddler bike · stroller reviews | 旅行婴儿推车 · 慢跑婴儿推车 · 婴儿推车评测 · 幼儿自行车 · 儿童自行车 |
| /evaluations | travel stroller · toddler bike · stroller reviews | 旅行婴儿推车 · 慢跑婴儿推车 · 婴儿推车评测 · 幼儿自行车 · 儿童自行车 |
| /guides | how to choose a baby stroller · balance bike for 1 year old | 如何选择婴儿推车 · 1岁平衡车 · 平衡车入门 |
| /news | ⚠️ **`"kids electric bike, electric dirt bike for kids, foldable electric scooter"`** (one comma string — see issue ③) | 儿童电动自行车 · 儿童越野电动车 · 可折叠电动滑板车 |
| /about | BalanceBikeToddler · independent safety lab · child mobility safety · evaluation methodology | BalanceBikeToddler · 独立安全实验室 · 儿童出行安全 · 评测方法 |

### 1.2 Category hub bespoke TDK (`categoryTdkMap` in `App.tsx`)

Normalized id comes from `normalizeProductRouteCategory`: `/products/kids-tricycles/`
→ `kids_tricycles`, `/products/electric-cars/` → `electric_vehicles`, etc.

| Category | slug | normalized id | bespoke TDK | EN keywords | ZH keywords |
|---|---|---|:--:|---|---|
| Strollers | /products/strollers/ | stroller | ✅ | jogging / travel / lightweight / twin stroller · baby stroller | 慢跑/旅行/轻便/双人婴儿推车 · 婴儿推车 |
| Balance bikes | /products/balance-bikes/ | balance_bike | ✅ | toddler / kids balance bike · 1 year old · ride-on | 儿童平衡车 · 儿童滑步车 · 1岁 · 平衡训练车 |
| Kids bikes | /products/kids-bikes/ | kids_bikes | ✅ | kids bmx bike · toddler bicycle · training wheels · pedal bike | 儿童自行车 · 儿童单车 · BMX · 带辅助轮 |
| Scooters | /products/kids-scooters/ | kids_scooters | ✅ | kids electric/kick scooter · foldable electric scooter | 儿童电动/脚踏滑板车 · 可折叠 · 三轮 |
| Electric cars | /products/electric-cars/ | electric_vehicles | ✅ | kids electric cars · kids ride on · ride on toys 12v | 儿童电动汽车/电动车 · 12V |
| Safety seats | /products/safety-seats/ | car_seat | ✅ | convertible / booster / infant · child safety car seat | 安全座椅 · 安全提篮 · 成长型 · 侧向防护 |
| **Tricycles** | /products/kids-tricycles/ | **kids_tricycles** | ❌ **missing** | falls back to generic /products (stroller/bike words, **no "tricycle"**) | same, no tricycle words |

### 1.3 Reference assets (7 pages, most complete EN+ZH)

- **Size chart** `balance-bike-size-chart`: EN `balance bike size chart / sizing / specs compared / what size / by age`; ZH `平衡车尺寸对照表 / 怎么选尺寸 / 规格对比 / 几岁用`
- **By age** `balance-bike-by-age`: EN `for 2/3 year old / 18 month / best for 4 / age range / for 1 / toddler by age / when can use`; ZH `两岁/三岁/18个月/四岁 / 适用年龄 / 一岁 / 按年龄选 / 宝宝几岁可以骑`
- **Stability · track width** `balance-bike-stability`: EN `stable track / stability / track width / wheel spacing / anti-tip / 4 wheel / widest / steering limiter`; ZH `稳定性 / 轮距 / 轮间距 / 防侧翻 / 四轮 / 加宽车架 / 转向限位`
- **Weight** `balance-bike-weight`: EN `how much weigh / weight / lightweight / vs kids bike / aluminium vs steel / ride-on weight chart / by age`; ZH `重量 / 多重 / 轻量 / 与童车对比 / 铝合金高碳钢 / 重量表`
- **Safety standards** `balance-bike-safety-standards`: EN `safety standards / CPSC 16 CFR 1512 / CPSIA / ASTM F963-23 / EN 71 / compliance / regulations`; ZH `安全标准 / CPSIA 铅邻苯 / EN 71 / 合规 / 法规`
- **Buyer feedback** `balance-bike-what-buyers-say` (Asset 2): EN `reviews / what parents say / buyer feedback / worth it / for 2 year old reviews / complaints / best rated`; ZH `评测 / 买家评价 / 值不值得买 / 口碑 / 缺点 / 两岁推荐`
- **Recalls** `safety/balance-bike-recalls`: EN `recall / CPSC recall list / EU Safety Gate / RAPEX / safety`; ZH `召回 / CPSC 名单 / 欧盟 Safety Gate / RAPEX / 骑行安全`

### 1.4 Transparency pages (7 pages)

disclaimer · testing-methodology · certification-lab-notes · terms · privacy ·
search-data · review-count-integrity — all brand/compliance words (BalanceBikeToddler,
CPSC, ASTM F963, ISO 8098). No commercial keywords.

---

## 2. Three real issues (visible from the TDK alone)

1. **keywords meta absent from static HTML** (247 pages, all zero).
   `App.tsx` writes `<meta name="keywords">` after hydration, but no prerendered static
   page does. Same "static vs hydrated two copies" inconsistency as the title bug.
   Googlebot renders JS and eventually sees it, but static crawlers / edge-cache copies
   have no K.

2. **Tricycles hub has no bespoke TDK**.
   `categoryTdkMap` covers only 6 ids; `kids_tricycles` is absent, so the hub for 26
   product pages falls back to the generic `/products` TDK — whose words are all
   stroller/bike and **don't even include "tricycle"**. Effectively naked.

3. **News EN keyword format error**.
   Written as `["kids electric bike, electric dirt bike for kids, foldable electric scooter"]`
   — one comma string treated as **a single** keyword instead of three. Needs splitting.

### Bonus strategic mismatch (not a bug, but worth noting)

- GSC confirms: **94.7% of impressions are balance bikes**. Yet the default TDK in 1.1
  (home/products/reviews/evaluations) leans heavily toward stroller/bike.
- `/reviews` and `/evaluations` default keywords contain **no balance bike at all**, even
  though balance bikes are the primary category with the richest reference content. The
  review-center entry words and the actual primary content don't line up.

---

## 3. Fix list (by priority; P0 = pure config, P1 needs sign-off)

**P0 (one-line change, do immediately)**
- Fix News EN keyword format: `["kids electric bike", "electric dirt bike for kids", "foldable electric scooter"]`.
- Add a `kids_tricycles` entry to `categoryTdkMap` (EN+ZH), respecting `SEO_TDK_LIMITS`:
  max 10 words, ≤32 chars each, ≤255 chars total. Suggest EN `tricycle / push tricycle /
  ride-on tricycle / toddler tricycle`, ZH `儿童三轮车 / 脚踏三轮车 / 遛娃三轮车`.

**P1 (needs sign-off; touches prerender script)**
- Emit the keyword array into prerendered static HTML (same fix as titles: have
  `prerender-pages.ts` also emit `<meta name="keywords">`), eliminating the static/hydrated split.
- Add balance-bike keywords to `/reviews` and `/evaluations` default keywords to align
  with the primary content.

**P2 (strategic, pending GSC validation)**
- Whether to build reference clusters for secondary categories (esp. strollers, 74 in
  stock but demoted) — must first confirm real demand via each category's own GSC data,
  or it repeats the "demote but don't touch links" contradiction.

---

## 4. Conclusion

The site has **no single primary keyword**; it is a decision-intent long-tail cluster rooted
at `balance bike` (平衡车) and split by **attribute dimensions** (size / age / stability /
weight / safety / recalls / buyer voice) — concentrated in the seven reference asset pages
with complete EN+ZH coverage. The other six category hubs have only a "Best [category] 2026"
head term plus sub-types named in the description, and Tricycles doesn't even have bespoke
TDK; the default-route TDK leans stroller/bike and mismatches the balance-bike primary
strategy. Landing the two P0 pure-config fixes is the highest-leverage move.
