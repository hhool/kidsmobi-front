# Top queries 完整分析（2026-10-13 导出，68 行 / 171 展现）

数据来源：Search Console → Performance → Web → Top queries，2026-08-13 至 2026-10-10。

## 先看可信度

- **171 次展现、0 次点击、68 行**，覆盖 3 个月 → 平均每天约 1.9 次展现。这是噪声量级。
- **68 行全部 0 点击**，包括展现最多的 `balance bike toddler`（19 次）。这一条不要误读成"标题写得不好"：
  US 整体平均排名约 52，第二页以后的排名拿不到点击是正常的。0 点击是**排名太深的结果**，不是独立的问题。
- 结论：这份数据**只能用于判断意图结构**（哪些词值得做），不能用于评估任何页面的表现。

## 意图聚类

| 聚类 | 展现 | 查询数 | 说明 |
|---|---:|---:|---|
| 核心词裸115（balance bike toddler / toddler balance bike …） | 59 | 16 | 最大的一块，但也是最泛的 |
| **带年龄（非 best）** | **45** | **16** | for 2 year old / 18 month old / for 2-3 year old … |
| best + 年龄 | 18 | 11 | best … for 2 year old / 1.5 year old / 2.5 year old … |
| best（无年龄） | 17 | 5 | best balance bike for toddlers … |
| stable track | 9 | 3 | 唯一曾进前 20 的三个词 |
| review 意图 | 8 | 5 | review / reviews of balance bikes … |
| 别名（walking bike / balansesykkel） | 6 | 4 | 小语种 1 条：挪威语 `balansesykkel 2 år best i test` |
| 推车（与域名无关） | 6 | 6 | babyhome / segway / adjustable handlebar … |
| 疑问句 | 3 | 2 | are balance bikes good for babies/toddlers |

## 四条结论

**1｜年龄是最大的单点意图，而且我们完全没有按它组织内容。**
带年龄的查询合计 **27 条 / 63 次展现**（占展现 37%、占查询数 40%）。同时其中 **58% 不带 "best"** —— 说明这不是比价意图，
是"我家 2 岁的孩子能不能骑 / 哪款适合"这种适龄问题。此前站内没有任何一个页面是按孩子年龄组织的，这部分需求落到了偶然排上去的页面上。
→ 这就是 Asset 7 `/balance-bike-by-age/` 的直接依据。

**2｜覆盖率在三岁处腰斩，这本身就值得讲。**
按每个 listing 自己公布的厂家年龄区间统计（14/15 公布了数字区间）：

| 年龄 | 仍适用的车型 |
|---|---:|
| 18 个月 | 11 / 14 |
| 2 岁 | 14 / 14 |
| 2.5 岁 | 7 / 14 |
| 3 岁 | 7 / 14 |
| 4 岁 | 4 / 14 |

从 2 岁到 3 岁一步腰斩，且**没有任何一款超过 60 个月**。这不是平滑衰减，是有断层的。
对用户的实际含义：孩子过了三岁，买这个品类是"买剩下的窗口"，而不是"买能成长的"。

**3｜推车类只剩 6 次展现 / 6 条查询，支持上一步的降级决定。**
9 月底把所有非平衡车/童车品类降为从属板块后，推车相关查询只剩零散 6 条且每条 1 次展现。
方向上没有反证，暂时不需要回滚。

**4｜stable track 那三条（9 次展现）已经建有 Asset 6 页面，但归因仍未确认。**
这三个词上个月排名 10.71 / 11 / 20，是全站唯一进前 20 的查询。Asset 6 `/balance-bike-stability/` 已于 10-13 上线，
但**它们到底落在哪个 URL 上我无法自查** —— 需要在 GSC 里筛「查询词包含 stable track」→ 切 Pages 页签确认。
若不在 stability 页上，下一步应做合并/调整，而不是再加新页面。

## 数据结构留给后续的两个提醒

- "electric balance bike for 3 year old"（3 次展现）/ "electric bikes for 2 year olds"（1 次）确实出现了，
  但站里的 electric-cars 品类是**骑乘式电动车，不是电动平衡车**。不要为了追这两个词去误导匹配。
- 品牌长尾（Baaltto / Avenor / Haweek / Aceger / Banana / Beberoad / Babyhome / Segway）总计约 10 次展现、每条 1–2 次，
  且部分品牌在本地数据里查不到。**在这个量级上不值得为单个品牌建页。**
