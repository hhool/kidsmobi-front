# 10 篇文章分配与逐篇规格（2026-10-19）

> 配套：`doc/backlink-outreach-pack-2026-10-19_zh.md`（外链素材来源）、`doc/spa-canonical-overwrite-2026-10-19_zh.md`（双渲染器教训）。
> 性质：**规划文档，未改动任何站点代码**。CMS 写入需 `CMS_ADMIN_ALL_TOKEN`（本地无，需用户提供或后台代操作）。
> 基线：CMS news 4 篇已发布、guides 3 篇已发布（全 beginner）+ 45 条归档桩数据；sitemap 247 URL。

---

## 0. 分配总览

| # | 集合 | 分类 | 工作标题 | 优先级 |
|---|------|------|----------|--------|
| G1 | guides | budget | Balance Bike Price Tiers: What Each Buys | P0 |
| G2 | guides | beginner | Balance Bike vs Training Wheels: What Wins | P0 |
| G3 | guides | scenario | Where to Ride a Balance Bike: A Terrain Guide | P1 |
| G4 | guides | risk | Before the First Ride: 5 Safety Checks | P1 |
| G5 | guides | maintenance | Balance Bike Maintenance: What Matters | P2 |
| G6 | guides | special | Balance Bikes for Kids Who Need Support | P2 |
| N7 | news | science | What Research Says About Balance Bikes | P1 |
| N8 | news | industry | 2026 Kids' Ride-On Safety Standard Updates | P1 |
| N9 | news | new_product | New Balance Bike Launches: 2026 Roundup | P2 |
| N10 | news | brand_news | 品牌动向（按当月真实新闻，节拍制） | P2 |

**比例理由**：guides 有 5 个空分类（scenario/budget/risk/special/maintenance 无目录页），补 6 篇激活全部分类；news 4 类各补 1 篇从单页孤儿变小簇。G1/G2 优先：G1 直接服务 GSC "stable track" 承载页 `/balance-bike-budget/`，G2 承接最高量新手意图。

**发布顺序**：G1 → G2 → G3 → G4 → G5 → G6 → N7 → N8 → N9 → N10（每周 2-3 篇，约 4 周，与外链包第 1-3 周并行）。

---

## 1. 逐篇规格

### G1 · guides / budget · P0

- **标题**：EN `Balance Bike Price Tiers: What Each Buys`（40 字符）+ 品牌后缀共 61 ✓ ｜ ZH `平衡车价格档位：各档实际买到什么`
- **slug**：`balance-bike-price-tiers`
- **description**：EN `What $50, $100 and $200 actually buy in a balance bike — frame, tire and weight trade-offs at each tier, and the checks that separate a keeper from a dud.`（154）｜ ZH `50/100/200 美元档位各买到什么：车架、轮胎与重量的真实取舍，以及区分值得留与该避开的检查项。`
- **keywords**：balance bike price, cheap balance bike, budget balance bike, is a balance bike worth it
- **目标意图**：预算决策（"cheap balance bike" / "balance bike under $100"）
- **资产内链**：`/balance-bike-budget/`，锚文本 `budget balance bike guide`（stable-track 承载页，全站锚文本优先级最高）
- **大纲**：① 三档价位分别买到什么（车架材质/轮胎类型/重量区间，全部用公开规格数据）；② 什么不随价格变化（seat height vs inseam 的适配逻辑）；③ 区分 keeper 与 dud 的检查清单；④ 延伸阅读（budget 资产页）
- **诚实约束**：只用卖家公开规格，不宣称实测；价格区间写「typical range」不断言具体车型当前售价

### G2 · guides / beginner · P0

- **标题**：EN `Balance Bike vs Training Wheels: What Wins`（42）｜ ZH `平衡车 vs 训练轮：到底哪个好`
- **slug**：`balance-bike-vs-training-wheels`
- **description**：EN `Balance bike or training wheels? What published research and parent reports say about which teaches balance faster, and when each one still makes sense.`（152）｜ ZH `平衡车还是训练轮？已发表研究与家长反馈怎么说，以及各自真正适用的场景。`
- **keywords**：balance bike vs training wheels, do balance bikes work, training wheels age
- **目标意图**：高量新手问句（"balance bike vs training wheels"）
- **资产内链**：`/balance-bike-by-age/`（锚 `balance bike by age`）+ `/balance-bike-safety-standards/`
- **大纲**：① 问题的两种答案各来自哪里；② 研究怎么说（引用真实研究，写作时逐条核对原文链接）；③ 适配才是前提（inseam → seat height）；④ 训练轮仍有意义的场景；⑤ 过渡时间线的合理预期
- **诚实约束**：研究必须真实可链，写清样本与局限；不用「研究证明」下绝对结论

### G3 · guides / scenario · P1

- **标题**：EN `Where to Ride a Balance Bike: Terrain Guide`（43）｜ ZH `平衡车在哪里骑：地形指南`
- **slug**：`where-to-ride-balance-bike`
- **description**：EN `Pavement, parks, grass, gravel or indoors: how each surface changes what matters in a balance bike, from tire type to frame weight.`（131）｜ ZH `人行道、公园、草地、砾石或室内：不同路面如何改变平衡车的轮胎与重量取舍。`
- **keywords**：where to ride balance bike, balance bike terrain, balance bike tires pavement grass
- **资产内链**：`/balance-bike-stability/`（锚 `what makes a stable track balance bike`——第二承载页）
- **大纲**：① 逐地形：柏油/公园小径/草地/砾石/室内；② 每种地形放大的规格（轮胎类型、重量）；③ 地形 × 重量的实际影响；④ 安全与礼仪；⑤ 本地场地建议（美英常见场景）
- **诚实约束**：地形建议基于物理与公开规格，不虚构场地测试

### G4 · guides / risk · P1

- **标题**：EN `Before the First Ride: 5 Safety Checks`（38）｜ ZH `第一次骑行前：5 项安全检查`
- **slug**：`balance-bike-safety-checks`
- **description**：EN `Five checks before the first ride: seat height vs inseam, sharp edges, loose bolts, handlebar grip, and helmet fit — with the standards behind each.`（148）｜ ZH `首骑前的 5 项检查：座高与腿长、锐边、松动螺栓、把套与头盔贴合——每项背后的标准依据。`
- **keywords**：balance bike safety, balance bike checklist, balance bike helmet age
- **资产内链**：`/balance-bike-safety-standards/` + `/safety/balance-bike-recalls/`（锚 `balance bike recall record`）
- **大纲**：① 检查 1-5（每项：怎么做/为什么/标准依据）；② 买前查召回（recalls 页）；③ 头盔：什么时候必须戴、怎么算贴合；④ 不需要做的事（不过度安全化）
- **诚实约束**：标准引用（16 CFR 1512/ASTM F963/EN 71）须与 safety-standards 资产页口径一致；不做医疗声明

### G5 · guides / maintenance · P2

- **标题**：EN `Balance Bike Maintenance: What Matters`（38）｜ ZH `平衡车保养：真正重要的事`
- **slug**：`balance-bike-maintenance`
- **description**：EN `What actually needs maintenance on a balance bike — tires, bolts, brakes if fitted — what you can ignore, and how frame material changes the upkeep.`（148）｜ ZH `平衡车真正需要保养的部分——轮胎、螺栓、刹车（如有），可以忽略的部分，以及车架材质如何改变保养量。`
- **keywords**：balance bike maintenance, balance bike tires foam air, balance bike bolts
- **资产内链**：`/balance-bike-weight/`（锚 `how much a balance bike weighs`，车架材质数据）
- **大纲**：① 短清单（真正要做的 3 件事）；② 轮胎：发泡 vs 充气的保养差异；③ 螺栓与转向；④ 有刹车型的额外项；⑤ 车架材质与保养量；⑥ 什么时候该退役
- **诚实约束**：保养建议来自制造商公开说明书口径，不虚构长期使用数据

### G6 · guides / special · P2

- **标题**：EN `Balance Bikes for Kids Who Need Support`（39）｜ ZH `需要额外支持的孩子怎么选平衡车`
- **slug**：`balance-bikes-extra-support`
- **description**：EN `For kids who need extra support: inseam-first sizing, step-through frames, and the adjustments that matter more than the model you pick.`（136）｜ ZH `给需要额外支持的孩子：腿长优先的尺码逻辑、低横梁车架，以及比型号更重要的调节项。`
- **keywords**：balance bike special needs, adaptive balance bike, balance bike inseam fit
- **资产内链**：`/balance-bike-size-chart/`（锚 `balance bike size chart`）
- **大纲**：① 适配优先（inseam → seat height，引用 size-chart 方法）；② 车架几何：低横梁/窄 Q-factor；③ 重量与操控；④ 比型号更重要的 4 个调节项；⑤ 明确边界：本文不谈医疗建议，请咨询专业人士
- **诚实约束**：**零医疗/治疗宣称**；不做「适合某类状况」的绝对断言，只谈可验证的物理适配

### N7 · news / science · P1

- **标题**：EN `What Research Says About Balance Bikes`（38）｜ ZH `研究怎么看平衡车`
- **slug**：`balance-bike-research`
- **description**：EN `What published research says about balance bikes and early motor development — and the caveats that come with the studies.`（122）｜ ZH `已发表研究对平衡车与早期运动发展怎么说，以及这些研究自带的前提与局限。`
- **keywords**：balance bike research, balance bike motor development, balance bike study
- **资产内链**：`/balance-bike-by-age/`（锚 `balance bike by age`，年龄适配计数）
- **大纲**：① 研究都在测什么；② 常见发现（逐条附真实文献链接，写作时核对）；③ 研究没证明什么（诚实章节）；④ 家长怎么用这些信息
- **诚实约束**：文献必须真实存在且可链；样本量与局限必须写；这是本篇的核心价值，不是装饰

### N8 · news / industry · P1

- **标题**：EN `2026 Kids' Ride-On Safety Standard Updates`（42）｜ ZH `2026 儿童骑乘玩具安全标准更新`
- **slug**：`ride-on-safety-standards-2026`
- **description**：EN `US and EU safety standard updates affecting kids' ride-ons in 2026 — what changed, what it means for balance bikes, and how to verify compliance.`（145）｜ ZH `2026 年美欧儿童骑乘玩具安全标准更新——改了什么、对平衡车意味着什么、怎么验证合规。`
- **keywords**：kids bike safety standards, CPSC balance bike, EN 71 ride-on, balance bike regulations
- **资产内链**：`/balance-bike-safety-standards/` + `/safety/balance-bike-recalls/`
- **大纲**：① 美国侧（CPSC/ASTM 动向）；② 欧盟侧（EN 71 系列）；③ 平衡车的标准缺口（哪些要求不覆盖平衡车）；④ 验证步骤（标签/证书/召回查询）
- **诚实约束**：**发布时必须核对当年真实标准状态**，无更新则改写为「标准现状解读」；不确定的内容不写

### N9 · news / new_product · P2（节拍制）

- **标题**：EN `New Balance Bike Launches: 2026 Roundup`（39）｜ ZH `2026 新平衡车发布盘点`
- **slug**：`new-balance-bikes-2026`
- **description**：EN `The balance bike launches of 2026 worth a second look — spec changes in weight, seat range and tires, and what they mean for fit.`（129）｜ ZH `2026 年值得多看两眼的平衡车新品——重量、座高范围与轮胎的变化，以及对适配的意义。`
- **keywords**：new balance bike 2026, balance bike launches, best new balance bike
- **资产内链**：`/balance-bike-size-chart/`（锚 `balance bike size chart`）
- **大纲**：① 逐款新品（发布时按当月真实新品）；② 规格变化点（重量/座高/轮胎）；③ 对适配的影响；④ 哪些变化是营销、哪些是实质
- **诚实约束**：只写发布时真实存在的新品；规格以厂商公布为准

### N10 · news / brand_news · P2（节拍制）

- **标题**：EN `Brand News: Balance Bike Updates — [Month]`（体例沿用现有 brand_news）｜ ZH `品牌动态：平衡车本月消息`
- **slug**：`brand-news-balance-bike-[month]`
- **description**：按现有 brand_news 体例（参考已发布的折叠滑板车品牌汇总文风）
- **keywords**：balance bike brands news, strider news, woom news
- **资产内链**：`/products/balance-bikes/`（品类 hub）
- **大纲**：品牌动作汇总（发布/合作/渠道）；对本网站读者的意义
- **诚实约束**：只写可查证的真实品牌事件

---

## 2. 五个新 guides 目录页 TDK（文章发布即生成，须进 CMS settings.seo 单一真源）

| 目录页 | 标题（≤65） | description（≤155） |
|--------|-------------|---------------------|
| `/guides/budget/` | `Balance Bike on a Budget: Guides & Tiers \| BalanceBikeToddler` | `Budget balance bike guides: what each price tier buys, the trade-offs in frame, tires and weight, and the checks that separate a keeper from a dud.` |
| `/guides/scenario/` | `Where & How to Ride: Balance Bike Scenarios \| BalanceBikeToddler` | `Balance bike guides by riding scenario: pavement, parks, grass, gravel and indoors — how each surface changes what matters in tires and frame weight.` |
| `/guides/risk/` | `Balance Bike Safety Risks & Pre-Ride Checks \| BalanceBikeToddler` | `Balance bike safety guides: the pre-ride checks that matter, the standards behind them, and how to check recalls before you buy.` |
| `/guides/maintenance/` | `Balance Bike Maintenance & Upkeep Guides \| BalanceBikeToddler` | `Balance bike maintenance guides: what actually needs attention, what you can ignore, and how frame material changes the upkeep.` |
| `/guides/special/` | `Balance Bike Fit for Extra Support Needs \| BalanceBikeToddler` | `Balance bike fit guides for children who need extra support: inseam-first sizing, step-through frames, and the adjustments that matter most.` |

同步更新 `check:spatitles` 的期望表（新增 5 个目录页）与 `pageKeywords.ts`（如目录页关键词纳入单一真源）。

---

## 3. CMS 字段映射（实施时逐篇填写）

**guides 记录**：
- `category` 与 `taxonomy.topicCategory` ∈ 路由白名单 {beginner, scenario, budget, risk, special, maintenance}，两者必须一致
- `taxonomy.hub` = `all_guides`；`hierarchyPath` 按现有体例
- `status` = `published`；`slug` 用上表值
- `seo.en.title/description` + `seo.zh.title/description` 双语齐全；正文字段同样双语

**news 记录**：
- `category` ∈ 路由白名单 {new_product, science, brand_news, industry}
- `slug` 用上表值；`status` = `published`
- 双语 seo 字段同上

**通用约束**：title 基名 ≤44 字符（+ ` | BalanceBikeToddler` 后缀共 ≤65）；description ≤155 字符（词边界切）；keywords 5 个以内；每篇 1-2 条资产页内链，锚文本用上表指定值，不堆砌。

---

## 4. 影响面与验证清单（实施后逐项跑）

1. **sitemap 基线 247 → 262**（10 篇文章 + 5 个新目录页；news 目录页已存在）
2. `npm run check:lazyexports` + `check:hydration`（14+ 路由水合，含新分类页）
3. `check:spatitles`（期望表 +5）、`check:spakeywords`、`check:spacanonicals`（250+ 路由重算）、`check:claims`、`check:reviewcounts`
4. 诚实守卫双相位：dist 扫描 + 源码扫描均 0 命中
5. 线上 301 不涉及（本次全是新增 URL，无迁移）；旧 `/guides/beginner/*` 三篇保持不动
6. 部署 + purge 后，周三 IndexNow 自动收录新 URL；GSC 侧建议对 10 条新 URL Request Indexing（用户操作）
7. 归档桩数据清理（45 条 beginner 归档记录）为可选后台卫生项，不影响前端

---

## 5. 实施前提

- CMS 写令牌 `CMS_ADMIN_ALL_TOKEN`（本地无）——用户提供后我可生成逐篇 payload 并写入；或由用户在后台按本文档字段录入
- N9/N10 两篇按节拍制：发布周当月有真实素材才写，没有就顺延，不凑数
- 每篇发布前过一遍诚实约束清单（尤其是 N7 的文献、N8 的标准状态、G6 的零医疗宣称）
