# B 轨：8 组同主题 URL —— 处置建议

日期：2026-10-22
范围：`/balance-bike-*` 资产页 与 `/guides/<topic>/<slug>` 文章，两两同主题，共 8 组
结论：**不建议做 8 组 301 合并**。它们不是重复内容，而是同主题不同角度的两个页面。301 会销毁独特内容，且方向可能与权重相反。

---

## 一、三组实测数据

### 1. 内容重叠度（8-gram Jaccard，去掉 nav/header/footer 后比对 body）

| 主题 | 资产页 | guides 文章 | 重叠度 | 判定 |
|---|---|---|---|---|
| size-chart | 995 词 | 1125 词 | 0.074 | 不重复 |
| weight | 1042 | 1005 | 0.079 | 不重复 |
| by-age | 1155 | 1239 | 0.068 | 不重复 |
| what-buyers-say | 893 | 1144 | 0.079 | 不重复 |
| safety-standards | 1002 | 1108 | 0.074 | 不重复 |
| stability | 1210 | 1319 | 0.061 | 不重复 |
| recalls | 6218 | 1058 | **0.022** | 几乎零重叠 |
| budget / price-tiers | 1181 | 1097 | 0.068 | 不重复 |

参考线：>0.30 才算可疑重复，>0.50 算实质重复。**8 组全部落在 0.02–0.08，最高 0.079。**

### 2. 内部链接数（全站 271 个 HTML）

| 目标 | 内链数 | 来源性质 |
|---|---|---|
| 各资产页（裸根） | **270** | `ReferenceClusterNav` 全站导航，模板链接 |
| 各 guides 文章 | **44** | 正文上下文链接 + 栏目页 |

单条正文内链的权重高于单条导航链接，但 270 vs 44 是 6 倍量级差。**若按「合并到更权威的一边」来做，方向并不明确**——而原计划「资产页 → guides」是把 270 条内链指向的页面，合并进只有 44 条内链的页面。

### 3. H1 语义差异（真正的竞争信号）

| 主题 | 资产页 H1 | guides H1 | 意图是否可分 |
|---|---|---|---|
| size-chart | Real Specs Compared Side by Side | Fit by Inseam | ✅ 查表 vs 怎么量 |
| weight | How much does a balance bike weigh? | Why It Matters | ✅ 数值 vs 意义 |
| recalls | Record: Every US CPSC Recall Since 2000 | A Buyer's Guide | ✅ 档案 vs 指南 |
| budget | Cheap Picks That Last | Price Tiers: What Each Buys | ✅ 推荐 vs 档位 |
| stability | …why nobody publishes the number | What Holds | ⚠️ 同主题，角度略分 |
| safety-standards | Explained | Guide | ⚠️ 标题近乎同义 |
| by-age | Which bikes actually fit at 2 years old | What Fits Each Year | ⚠️ 高度重叠 |
| what-buyers-say | What Buyers Say About Balance Bikes | What Buyers Say About Balance Bikes | ❌ **字面完全相同** |

---

## 二、这推翻了「301 合并」的前提

「重复内容合并」成立的前提是**内容重复**。实测显示：

1. **内容不重叠**（≤8%）。301 之后，被合并页的独有内容（recalls 那 6218 词的 CPSC 档案最典型）会随 301 一起消失，除非先手工并入保留页——那是内容搬家，不是合并。
2. **recalls 对尤其不能合**。资产页 6218 词 = 全站最厚的页面之一，且是全站唯一的 CPSC 召回档案；guides 那篇 1058 词是购买指南。两者重叠 0.022。把厚的并进薄的（或反之）都是净损失。
3. **真正的问题不是重复，是意图竞争**。8 组中 6 组的两个页面都在争同一个 query，Google 无法判断该排哪个，结果可能两个都排不好。竞争的解法是**让意图可分**，不是砍掉一个。

### 例外：what-buyers-say 这对确实需要处理

两页 H1 字面完全相同，小标题结构也高度相似（`What they mention` / `The three hedges` / `Every listing counted`）。这是 8 组里唯一接近真重复的。**这一对值得合并或强制改写其一。**

---

## 三、建议方案（三档，按处置强度递增）

### A 档 — 保持双页，零改动（4 组）
`size-chart`、`weight`、`recalls`、`budget`
意图已经分开，H1 与内容角度都不撞。不动。

### B 档 — 改写 H1 / TDK 强制分流（3 组）
`safety-standards`、`by-age`、`stability`
标题近乎同义，Google 难以区分。做法：
- 资产页定位为**数据/实测视角**（它本来就是这么写的：spec 对比、覆盖数、测量缺口）
- guides 文章定位为**决策/操作视角**（怎么选、怎么量、怎么做）
- 只改 H1 + title + meta description，正文不动

### C 档 — what-buyers-say 择一（1 组）
两个 H1 完全相同。二选一：
- **C1（推荐）**：guides 那篇改写为操作视角（如 "How to Read a Buyer-Sentiment Summary"），资产页保留数据视角 —— 与 B 档同一套手法，不丢内容
- **C2**：把其中一篇 301 到另一篇，并把独有段落并入保留页

### /safety/ hub（独立项）
`/safety/` 线上确认 404，0 条内链，不在 sitemap（270 条里没有它）。**当前无害**——没人链、没被提交。但它下面挂着全站最厚的 `/safety/balance-bike-recalls/`，父路径是空的，层级是孤儿。

三个选项：
- **建 hub**：正收益是主题聚合 + 给 recalls 数据页一个父级承接页；成本是新增一个要维护、要收录的页面
- **保持 404**：零成本，零收益。因为没有任何入口指向它
- **迁移**：把 recalls 数据页挪到 `/guides/risk/` 下，`/safety/` 层级整体撤掉 —— 但这会改一个已有收录页的 URL，是新的 301，与"B 轨避免 301"的初衷相悖

---

## 四、风险与验证

| 风险 | 说明 |
|---|---|
| 301 不可逆 | 需要 Worker 重部署（要 CF token）+ GSC 重新收录，波动期以周计 |
| 当前流量基数极低 | GSC 基线 US 156 展现 / 0 点击。无论合并还是分流，**短期 SEO 差异都很小**；真正的成本是工程成本与不可逆性 |
| 无 URL 级 GSC 数据 | 目前只有站点级基线，无法判断哪一侧已有排名。等 URL 级明细出来再定会更稳 |

**验收方式**（沿用三层）：
1. 静态 HTML（`curl` 原始输出）
2. 水合后 DOM（Playwright，看 SPA 是否改写）
3. 线上探针 + 静态守卫反向验证（故意改坏，守卫必须报错）

---

## 五、一句话结论

这 8 组不是重复内容，是意图撞车。**别砍页面，把意图分开。** 唯一值得动手合并的是 what-buyers-say（H1 字面相同），而且它也优先推荐用改写解决。
