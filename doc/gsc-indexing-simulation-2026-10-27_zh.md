# GSC 收录模拟报告 — 2026-10-27

> 目标站点：`https://balancebiketoddler.com`（Cloudflare Pages）
> 依据：线上 `robots.txt` + `sitemap.xml` 全量状态探测 + 截图「Page indexing › Page with redirect」6 条逐跳追踪
> 性质：对站点实况的**模拟分桶**，非 Google 爬虫真实索引数据；GSC 真实数字会受抓取频率影响，通常滞后数天至数周。

---

## 一、结论速览

- **收录健康度：良好。** sitemap 共 **441 条 URL，其中 425 条（96.4%）返回 200 且 canonical 自指**，可直接被索引。
- **截图里的「Page with redirect（6 条）」是良性的。** 5 条是正确的规范化重定向（http→https、www→非 www、历史下划线路径→驼峰复数 hub、去 currency 参数），属期望状态，**不需要修**；仅 1 条（`testing_methodology`）实际已 404，建议补 301。
- **真正应修的问题在 sitemap 里：16 条 301 重定向 URL**（`kids_pull_along_wagons`×13 + `playard`×3 被写成 `/products/strollers/…`，实际 canonical 在 `/products/kids-tricycles/…`）。这是品类推断与页面 canonical 失配导致的，需修 Worker sitemap。
- 抽样未见 **noindex** 误伤，未见**重复 canonical** 问题。

---

## 二、扫描口径

| 项 | 做法 |
|---|---|
| 站点地图 | 抓取 `sitemap.xml`（单文件 urlset），提取全部 `<loc>` |
| 状态探测 | 对 441 条逐条 `HEAD`（manual 跳转），统计 200 / 3xx / 4xx |
| 质量抽样 | 按目录分组（首页、about、root 资产页、guides、news、products、reviews、transparency、zh）各取代表页 `GET`，校验 `<link rel=canonical>`、`<meta name=robots>`、JSON-LD |
| 重定向链 | 对截图 6 条 URL 逐跳追踪 301/308，直到 200/404 |
| robots.txt | 校验允许/禁止规则与 sitemap 声明 |

---

## 三、模拟覆盖分桶（GSC「Page indexing」口径）

| GSC 分桶 | 条数 | 说明 |
|---|---:|---|
| **Indexed-ready**（200 + 自指 canonical） | **425** | sitemap 干净 URL，抓取即具备索引条件 |
| Page with redirect（sitemap 内，应修） | **16** | 过时品类路径，301 到 kids-tricycles（详见第五节） |
| Page with redirect（站点级规范化，良性） | **5** | http/www/下划线/currency，见第四节 |
| Not found（404） | **1** | `transparency/testing_methodology` |
| Excluded by noindex | 0 | 抽样全部 `noindex=false` |
| Duplicate / alternate canonical | 0 | 抽样全部 canonical 自指 |

> sitemap 全量状态分布：**200 × 425 / 301 × 16**，无 4xx、无 5xx。

---

## 四、截图 6 条逐条判定

| # | URL（GSC 列出） | 实况 | 目标 | 判定 | 动作 |
|---|---|---|---|---|---|
| 1 | `/products/balance_bike` | 301 | `/products/balance-bikes/` | ✅ 正确：历史下划线路径 → 平衡车 hub | 无需 |
| 2 | `http://balancebiketoddler.com/` | 301 | `https://balancebiketoddler.com/` | ✅ 正确：http → https | 无需 |
| 3 | `/transparency/testing_methodology` | **404** | `/transparency/testing-methodology/` | ⚠️ 异常：已不是重定向，GSC 归类滞后；正解是连字符带尾斜杠页（200） | 建议补 301 |
| 4 | `http://www.balancebiketoddler.com/` | 301 | `https://balancebiketoddler.com/` | ✅ 正确：http+www → https 非 www | 无需 |
| 5 | `https://www.balancebiketoddler.com/` | 301 | `https://balancebiketoddler.com/` | ✅ 正确：www → 非 www | 无需 |
| 6 | `https://www.…/?currency=EUR` | 301 | `https://balancebiketoddler.com/?currency=EUR` | ✅ 正确：去 www；currency 参数已废弃、被忽略 | 无需 |

**要点：** GSC 里这条「Page with redirect」显示「Validation failed」是**预期结果**——你无法、也不该让这些 URL 返回 200（那会把重复地址放出来）。除第 3 条外，其余 5 条应视为「已完成规范化」，无需处理。

---

## 五、真实发现：sitemap 内 16 条 301（P1，应修）

**现象**：以下 16 条产品 URL 在 sitemap 里挂在 `/products/strollers/`，访问时 301 到 `/products/kids-tricycles/`，目标页 200 且 canonical 自指。

| sitemap 中的 URL（会 301） | 实际 canonical（200） |
|---|---|
| `/products/strollers/kids_pull_along_wagons-b09hjtbqjf` | `/products/kids-tricycles/kids_pull_along_wagons-b09hjtbqjf` |
| `/products/strollers/kids_pull_along_wagons-b0c5434m8d` | `/products/kids-tricycles/kids_pull_along_wagons-b0c5434m8d` |
| `/products/strollers/kids_pull_along_wagons-b0c5435km9` | `/products/kids-tricycles/kids_pull_along_wagons-b0c5435km9` |
| `/products/strollers/kids_pull_along_wagons-b0clwwpdml` | `/products/kids-tricycles/kids_pull_along_wagons-b0clwwpdml` |
| `/products/strollers/kids_pull_along_wagons-b0djy3jh8d` | `/products/kids-tricycles/kids_pull_along_wagons-b0djy3jh8d` |
| `/products/strollers/kids_pull_along_wagons-b0dxfg3954` | `/products/kids-tricycles/kids_pull_along_wagons-b0dxfg3954` |
| `/products/strollers/kids_pull_along_wagons-b0fcy4wm8m` | `/products/kids-tricycles/kids_pull_along_wagons-b0fcy4wm8m` |
| `/products/strollers/kids_pull_along_wagons-b0ffm5p1sf` | `/products/kids-tricycles/kids_pull_along_wagons-b0ffm5p1sf` |
| `/products/strollers/kids_pull_along_wagons-b0fqtztc84` | `/products/kids-tricycles/kids_pull_along_wagons-b0fqtztc84` |
| `/products/strollers/kids_pull_along_wagons-b0g1c38c3t` | `/products/kids-tricycles/kids_pull_along_wagons-b0g1c38c3t` |
| `/products/strollers/kids_pull_along_wagons-b0g1zf9z63` | `/products/kids-tricycles/kids_pull_along_wagons-b0g1zf9z63` |
| `/products/strollers/kids_pull_along_wagons-b0g2yvks6m` | `/products/kids-tricycles/kids_pull_along_wagons-b0g2yvks6m` |
| `/products/strollers/kids_pull_along_wagons-b0gqxf73jz` | `/products/kids-tricycles/kids_pull_along_wagons-b0gqxf73jz` |
| `/products/strollers/playard-b07964sfw4` | `/products/kids-tricycles/playard-b07964sfw4` |
| `/products/strollers/playard-b07wpw1yyc` | `/products/kids-tricycles/playard-b07wpw1yyc` |
| `/products/strollers/playard-b08bt16th5` | `/products/kids-tricycles/playard-b08bt16th5` |

**根因**：Worker sitemap 的品类推断把 `kids_pull_along_wagons` / `playard` 两个系列判为 `strollers`，而前端路由与页面 canonical 判为 `kids-tricycles`。这正是长期笔记里那条「分类推断 5 处实现要同步（前端 4 + Worker sitemap）」的失配点。

**影响**：
1. 16 条 URL 每次抓取都走一次 301，**白耗抓取预算**；
2. 随 Google 抓取推进，GSC 会**新增 16 条「Page with redirect」**（届时「受影响页」会从 6 跳到 ~22）；
3. 真正的 canonical 路径（kids-tricycles）反而没进 sitemap，**发现变慢**。

**修法**：让 sitemap 输出最终 200 路径（`/products/kids-tricycles/…`），或在 Worker 品类推断里与前端规则对齐。改完 `wrangler deploy` + 推空提交让 sitemap 重建。

---

## 六、建议动作（按优先级）

| 优先级 | 动作 | 验收 |
|---|---|---|
| **P1（本周）** | 修 sitemap 16 条 301：Worker 品类推断同步前端（或 sitemap 直接输出 kids-tricycles 最终路径） | 重新抓 `sitemap.xml`，逐条 HEAD 应 **0 条 3xx** |
| **P2（顺手）** | 加 301：`/transparency/testing_methodology` → `/transparency/testing-methodology/` | 该 URL 返回 301，落地页 200 |
| **无需** | http/www/currency 共 5 条规范化重定向 | 保持现状；GSC「Validation failed」属预期 |

---

## 七、健康快照（抽样，全部通过）

- **覆盖**：首页、`/about`、root 资产页（balance-bike-* / kids-*-*）、`/guides`、`/news`、`/products`、`/reviews`、`/transparency/*`、`/zh/guides`、`/guides/best/best-travel-stroller-2026`、`/products/strollers/`。
- **结果**：全部 **200**、`noindex=false`、**JSON-LD 存在**、**canonical 自指**。
- **robots.txt**：允许全站；仅禁 `?sort/price/age/filter/wizard/category=` 参数；AI 爬虫策略（允许 Google-Extended / CCBot，拦 Bytespider / Applebot-Extended / meta-externalagent，Amazonbot 仅放行 `/products/` 与 `/api/paapi/`）符合既定意图；`Sitemap:` 声明正确。

---

*本报告为模拟分桶，用于提前定位可修问题；Google Search Console 真实「Page indexing」数字以官方后台为准。*
