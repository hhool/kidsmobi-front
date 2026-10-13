# 评论量数据完整性：10 条 listing 的源数据需要修

日期：2026-10-13　处理 commit：`待提交`
主题：部分 listing 携带不可信的评论量（最高约 4,700 万条），已在前台全链路拦截。

## 问题

本目录中 10 条 listing 的 `Item_Details["Review Count"]` 是**不可能为真**的数值。作为参照：
本目录里可信的最高值是一款 convertible car seat 的约 5.9 万条； Radio Flyer 经典小拖车（同站销量级最高之一）1.4 万条。
**4,700 万条 toddlers playard 的评分量，比该品类可能的销量还高若干个数量级。**

这些数字此前同时出现在三处：

| 出口 | 表现 |
|---|---|
| 可见文案 | `★ 4.7/5 · 47,475,117 ratings` |
| Product JSON-LD | `aggregateRating.ratingCount: 47475117` |
| 内部排序数学 | `EvaluationsSection.productValueScore()` 里 `reviewCount / 100000` → 一条脏数据带来 **+475 分**加成，悄悄改写推荐排序 |

第三处尤其隐蔽：它不是文案错误，而是让排序结果失真。

## 处理原则

与 `ce93535`（撤掉不实实验室宣称）同一类问题：**不能证明为真的数字不要发。**
做法是把数字**删掉而不是改成一个估计值**——星级保留，评论量与 `aggregateRating` 整块去掉。
`aggregateRating` 缺 `ratingCount` 本身在 schema 里不合规，宁可不要这个富媒体结果，也不要发一个编造感的计数。

实现：`src/lib/reviewSignal.ts` 提供 `credibleReviewCount()`，上限 `MAX_PLAUSIBLE_REVIEW_COUNT = 200_000`。
预渲染、`App.tsx` 的 JSON-LD、`apiServer.ts` 生成 pros、以及 `EvaluationsSection` 的加成计算统一走这一个函数，
避免将来新增出口时漏网。

**校准依据**：本目录可信上限约 5.9 万，阈值设在 20 万，比它高一个数量级，正常商品不可能误伤。
实测确实零误伤——改动前后发布计数的页面数是 176 → 166，只少了那 10 个。

## 受影响记录（请在 CMS 源头修）

| 页面 | 发布过的计数 | 品类 | 品牌 |
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

全部落在 stroller 家族（已按 GSC 数据降为从属板块），**16 个平衡车详情页全部干净**。

数值呈现明显的成串特征（多条记录共享前几位数字，如 47,475,530 / 47,475,117、4,444,511 / 4,444,515），
**更像抓取/拼接环节的缺陷，而不是逐条手误**——建议从采集器着手查，而不是手工改 10 个字段。

## 防回归

`npm run check:reviewcounts` 扫描 `dist/` 下的所有 HTML，同时检查可见文案与 JSON-LD，
发现超过阈值的计数即以非零状态退出。阈值从 `src/lib/reviewSignal.ts` 里正则读出，不会两头漂移。

构建时若拦截到脏数据，`prerender` 会打印被拦截的 id 列表（当前为上述 10 条），提示去源头修。
