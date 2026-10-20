# 收录核查 & "stable track" 承载页迁移评估 — 2026-10-21（r12）

运行时间：2026-10-21 01:51–02:10 (GMT+8)。只做核查与记录，未改任何站点代码。

## 0. 结论速览

| # | 项目 | 结论 |
|---|---|---|
| 1 | 🚨 **SPA 兜底吞掉 prerender 页面（今夜新引入，已验证在线）** | `/products/*`、`/reviews/*`、`/news/*`、`/guides/*`、`/transparency/*` 等前缀下**全部子路径**（**255/269** 条 sitemap URL）现在返回首页 shell：首页 title + canonical 指向首页。10-21 00:44 的 `_redirects` 重做把兜底目标从被 Pages 静默丢弃的 `/index.html` 改成 `/`，兜底**首次真正生效**，误伤静态 prerender。**建议按 P0 处理**（详见 §4） |
| 2 | budget / stability 两页自身状态 | 不受上述回归影响：200 + `index,follow,max-image-preview:large` + 自指 canonical + 正确 title/H1（stability H1 仍含 "stable track balance bike"） |
| 3 | 两页是否被收录 | 沙箱内仍无法证实/否证。Bing：stability `site:` 第 4 次拿到**格式良好的 no-results**（本次 zh 边缘节点）；budget 探针被污染（百度垃圾）。整域控制本次被污染（人社政务平台垃圾）→ 作废。Google 侧最佳证据仍是 14/271 收录坪值（GSC 数据至 10-12） |
| 4 | sitemap 自检 | **全绿**：200 / `application/xml; charset=utf-8` / **269 URL** / 269/269 带 `<priority>` / 两页均在 / max lastmod `2026-10-20T09:04:01.807Z` / 在线 URL 集与本地 dist 完全一致。任务书"247 条 / 260 告警"基线早已过期（r11 起合法为 266，今夜因 CMS guides 合法增至 269） |
| 5 | seo:health | **100/100**（15/15，20s；sitemap 基线已被并行会话同步为 269，delta 0，无 WARN） |
| 6 | stable-track 迁移 | **仍未确认**：无新 GSC Performance 导出（Downloads 自 10-19 起无新文件）。基线仍是 `/` + `/products/balance-bikes/`。注意今夜回归后 `/products/balance-bikes/` 仍返回 200（shell），承载页身份暂时还在；而 `/guides/scenario/balance-bike-stability` 的 canonical 现已指向首页，短期不可能成为承载页 |
| 7 | GSC Page indexing | 无新截图/导出，状态延续：redirect 组（4）**Started**；canonical 组（9）Failed 但已根因修复（`3f01510`）→ **无需再点 VALIDATE FIX** |

## 1. 收录核查（Bing 优先）

| 探针 | 结果 | 判读 |
|---|---|---|
| WebSearch `site:.../balance-bike-budget/` | 5 条站外结果（trekbikesblog / pookapages 等），0 条站内 | `site:` 操作符**第 12 次**被忽略，无信息量 |
| WebSearch `site:.../balance-bike-stability/` | 5 条站外结果（smallsmart 等），0 条站内 | 同上 |
| Bing `site:.../balance-bike-budget/` | 百度知道/文库中文垃圾结果集 | **污染，作废** |
| Bing `site:.../balance-bike-stability/` | 格式良好的本地化 **no-results** 页（"没有与此相关的结果"，zh） | stability **第 4 次** well-formed no-results（r4 ru / r8 zh / r9 es / r12 zh）。跨 4 个边缘节点语义一致 → 继续支持"stability 尚未进 Bing 索引" |
| Bing 整域控制 `site:balancebiketoddler.com` | 人社政务平台（mohrss.gov.cn）中文垃圾结果集 | **本次污染，控制作废**；上一次有效整域控制为 r11（10-20，站内在索引、无 /balance-bike-* 资产页、2 条前主人垃圾 URL day 11） |

结论：本沙箱对搜索引擎 `site:` 查询的干扰已持续 12+ 次运行，收录状态**只能以 GSC 或正常网络下的 `site:` 为准**。现有证据组合（Bing 4×no-results + Google 14/271 坪值 + 242 条 Discovered 池）指向：两页均未被收录，stability 证据更强。

## 2. sitemap 自检（全绿）

抓取方式：`curl --noproxy '*'`（无 query）直取 `https://balancebiketoddler.com/sitemap.xml`。

| 检查项 | 结果 |
|---|---|
| HTTP 状态 | **200** |
| Content-Type | **`application/xml; charset=utf-8`** |
| URL 条数 | **269**（精确 `grep -o` 计数） |
| `<priority>` 覆盖 | **269/269**（后端 `f2046bf` 持续生效） |
| `balance-bike-budget` | ✅ 在（`/balance-bike-budget/`，priority 0.6） |
| `balance-bike-stability` | ✅ 在（`/balance-bike-stability/`，priority 0.6） |
| max lastmod | `2026-10-20T09:04:01.807Z`（CMS 批次刷新） |
| 在线 vs 本地 dist | URL 集 diff = **0**（均 269） |

### 2.1 266 → 269 增量构成（合法）

`a548b30`（10-20 17:18，"three CMS guides take the reference cluster to 8/8"）新增 3 篇 CMS 文章，均已在线验证 200：

- `/guides/beginner/balance-bike-by-age`
- `/guides/beginner/balance-bike-what-buyers-say`
- `/guides/scenario/balance-bike-stability`

**任务书中"247 条 / 出现 260 条旧格式即告警"的基线已过期**：r11（10-20）记录合法值为 266，今夜起因上述批次为 **269**。Worker 拦截未复发，边缘缓存无陈旧（10-15/16 修复已稳定 ~106h）。

### 2.2 两处小偏差（不告警）

1. **10/269 条 URL 缺 `<lastmod>`**（7 个资产 hub 含 budget/stability + `/safety/balance-bike-recalls/` + 2 个 transparency 页）；均为静态路由，影响极低。
2. `/guides` hub 的 prerender title 为 "How to Choose a Baby Stroller | BalanceBikeToddler"——与 guides  hub 语义不符，疑似 prerender 取错了标题源（本地 dist/guides.html 同样如此，属内容侧小 bug，见 §6）。

## 3. 健康检查（`npm run seo:health`，已执行）

```
SCORE: 100/100  (pass 15, warn 0, fail 0 of 15)
[PASS] sitemap.xml: 269 URLs (baseline 269, delta 0)
[PASS] internal-links: sampled 15, broken=0
```

基线常量已被并行会话同步到 269（`9ed9364` 之后的又一次更新），delta 0，无 WARN。两页均在 KEY_URLS 中且全项通过。

## 4. 🚨 新 P0：SPA 兜底通配块吞掉 255/269 个已 prerender 页面（今夜引入）

### 4.1 现象（今晚 01:51–02:10 在线实测）

以下 URL 全部返回 **HTTP 200 + 首页 shell**（`<title>Best Kids Bikes, Strollers, Scooters | BalanceBikeToddler</title>`，`<link rel="canonical" href="https://balancebiketoddler.com/">`）：

- `/products/balance-bikes/`、`/products/balance-bikes/<各商品 id>`（181 条）
- `/reviews/compare/*`、`/reviews/single/*`（33 条）
- `/news/<类型>/*`（12 条）
- `/guides/<分类>/*`（22 条，含 6 个分类 hub 与 16 篇文章）
- `/transparency/*`（7 条）

而**未被任何规则覆盖**的前缀仍正常服务 prerender：

- `/safety/balance-bike-recalls/` → 正确 prerender（正确 title + 自指 canonical）
- 裸 hub `/products`、`/reviews`、`/news`、`/guides`、`/about` → 正确 prerender
- 顶层 `/balance-bike-budget/`、`/balance-bike-stability/` 等 6 页 → 正确 prerender

即：**269 条 sitemap URL 中只有 14 条在真正服务其 prerender 内容**，其余 255 条都是首页副本。

### 4.2 根因与时间线

- `public/_redirects` 的 SPA 前缀兜底块（`/products/* / 200` 等）**长期存在**，但其目标原为 `/index.html`——Cloudflare Pages 会**静默丢弃**「通配源 + `/index.html` 目标」的规则（并行会话 `doc/redirects_zh.md` 已用探针证实）。因此兜底一直是死的：未知子路径 404，已 prerender 的子路径正常服务静态文件。
- 10-21 00:44 `19b60d3`（"target `/` instead of `/index.html` in the SPA fallback"）把目标改为 `/`，兜底**首次真正生效**；01:30 `dc2c1a5` 把 retired-URL 301 家族移交 Worker。该版本**已部署**（实测未知路径 `/products/balance-bikes/zzz-not-real` 从 404 变为 200 shell，即新兜底行为的铁证）。
- 副作用：通配重写**优先于静态资产**。每个被覆盖前缀下的 prerender 文件（本地 dist 均在，如 `dist/products/balance-bikes/index.html` 带正确自指 canonical 与 "Best Toddler Balance Bikes 2026" title）都被 shell 覆盖。

### 4.3 佐证：这与 GSC 历史数据完全吻合

- GSC 收录 **14/271**（数据至 10-12）——正好等于当前能正常服务的 14 个 prerender 页；其余 242 条在 "Discovered – currently not indexed" 池。
- GSC "Alternate page with proper canonical tag" 组只有 **9 条**（currency/www/下划线/guide 变体）——若 255 条首页 canonical 副本在 10-12 前就已存在，该组应为 ~250 条。**说明此前 prerender 一直正常服务，回归是今夜引入的**，不是历史遗留。

### 4.4 影响评估

1. **255 个内容页对爬虫表现为首页重复**：raw HTML 的 title 与 canonical 均指向首页 → Google/Bing 会将其判为规范副本丢弃/不收录；已在收录流程中的页面（无）不受影响，但 242 条 Discovered 池面临被重新归类为 canonical 副本的风险。
2. **软 404 语义**：未知子路径一律 200 shell（这是兜底的预期行为，但与上一条叠加后，爬虫难以区分"真页面"与"不存在路径"）。
3. 对新发布的 CMS 文章（构建后发布、无 prerender 兄弟）而言 shell 是**正确**行为——问题只在于通配块无法区分"有 prerender"与"无 prerender"。

### 4.5 修复方向（仅建议，未动代码）

- **首选**：把兜底移进 Worker（并行会话已有 Worker 路由表与 Pages 宿主取 shell 的先例，如 `/products/other/*` 窄透传）——Worker 可以先探测候选 `.html` 是否存在，存在则透传 Pages 静态文件，不存在才答 shell。`_redirects` 无法表达"负向通配"。
- **次选**：删除前缀通配块，只为确无 prerender 的应用内路由写精确规则（`/compare`、`/auth`、`/search`、`/evaluations`、`/transparency` 裸根已在位），未知子路径回到 10-13 起的真实 404 行为；代价是构建后新发布的 CMS 详情页在下次构建前 404。
- **配套**：`doc/redirects_zh.md` 的不变量"**静态文件先赢**（绝不为已 prerender 的路径加规则）"与线上行为相反——其探针只验证了「精确源重写在 clean-URL 解析后白占行数」和「通配+`/index.html` 被丢弃」，**从未测试通配规则对阵一个有 prerender 兄弟的路径**。建议修订该文档，并给 `check:redirects` 或健康检查加一条线上断言：抽 2-3 个嵌套 prerender 路由，断言其在线 title/canonical 是自身而非首页。

### 4.6 与并行文档的关系

`doc/redirects_{zh,en}.md`（并行会话，commit `623458f` 之后）准确记录了 Pages 的三个坑（`/index.html` 通配丢弃、`200!` 非法、规则行数上限），但其"静态文件先赢"的推论被今晚的部署反证。建议两篇文档交叉引用。

## 5. stable-track 迁移评估

- **无新 GSC Performance 导出**（`find doc -newermt "2026-10-20 11:26"` 只有并行会话的 redirects 文档；Downloads 最新仍是 10-19 的 Coverage zip，且与 10-18 字节相同）→ 迁移状态**未确认**，基线维持 `/` + `/products/balance-bikes/`（10-15）。
- GSC 滞后 2-3 天，可见窗口 10-19~24 进行中，确定性读数预计 **10-22~24**。建议届时导出 Performance（Query contains "stable track" → PAGES）后复核。
- 今夜回归不改变迁移判读，但给出两个新注脚：
  - `/products/balance-bikes/` 仍返回 200（shell），短期内"承载页"身份不会丢；
  - `/guides/scenario/balance-bike-stability`（10-20 新增的 CMS 稳定性文章，标题 "Stable Track Balance Bikes: What Holds"）目前 canonical 指向首页，**在 §4 修复前不可能成为承载页**；修复后它是 stability 主题的天然候选承载页，建议纳入后续观察。

## 6. 其他次级发现

1. `/guides` hub prerender title 疑张冠李戴（"How to Choose a Baby Stroller…"），本地 dist 同样如此——内容侧小 bug，建议排查 prerender 取数源。
2. IndexNow 快照 `scripts/seo/.last-indexnow.json` 仍为 **266 URL**（updatedAt 10-19T19:46:11.992Z）——10-20 的 3 篇 CMS guides **尚未提交**增量；key 文件在线 200。建议补提交 3 条。
3. 前主人垃圾 URL 状态不变：apex 404，www 301→apex→404（Bing 索引侧上次有效观察为 r11：day 11 仍在，本次控制探针被污染无法复核）。

## 7. GSC Page indexing 背景（2026-10-16 已知，未重复查询）

- 图1「Alternate page with proper canonical tag」= 9 页、图2「Page with redirect」= 4 页均为良性（currency/www/下划线/guide 变体已正确 canonical/301 去重）。
- 唯一遗留关注点：图2顶部「Validation failed（10/11→10/13）」。结合 10-18/10-19 Coverage 导出：redirect 组（4）状态为 **Started**（10-16 的重新 VALIDATE FIX 已被 Google 接受；301 服务端支撑自 r5 起在线）；canonical 组（9）仍 Failed 但根因（SPA canonical 覆写）已由 `3f01510` 修复并部署，**无需再次 VALIDATE FIX**，等待重抓自愈（趋势 6→4→…→0）。
- 本运行无新截图/导出，以上状态延续。**注意**：今夜 §4 回归若持续，可能在下一轮 Coverage 中制造新的 canonical 副本组——这是尽快修复 §4 的另一个理由。

## 8. 下一步建议（按优先级）

1. **P0 — 立即处理 §4 SPA 兜底吞 prerender**：按 §4.5 首选方案把兜底移入 Worker（存在性探测），或临时删掉前缀通配块恢复 10-13 的 404 行为；每延迟一小时，255 个内容页就以首页副本形态被爬一次。修复后按 §4.5 配套建议加线上断言防复发。
2. **P1 — 10-22~24 导出 GSC Performance**（Query contains "stable track" → PAGES），确认承载页是否仍只在 `/` + `/products/balance-bikes/`；同时导出一份 Coverage 看 redirect 组是否转 Passed、有无新 canonical 组。
3. **P2 — 补提交 IndexNow 增量**（3 篇 CMS guides），保持提交快照与 sitemap 同步。
4. **P2 — 修 `/guides` hub 的 prerender title**。
5. **P3 — 沙箱内 Bing `site:` 核查已连续 12+ 次受干扰**：收录结论以 GSC 为准；如需 Bing 侧佐证，请在正常网络下执行 `site:balancebiketoddler.com/balance-bike-stability/` 与 budget 对应查询。

## 9. 运行留档（方法与原始数据）

- 探针均带 `--noproxy '*'`、无 query；时间 2026-10-21 01:51–02:10 GMT+8。
- sitemap：`/tmp/sitemap-check.xml`（43281 bytes，269 loc / 269 priority / 259 lastmod）。
- 在线对照：`/tmp/live-urls.txt`（269 条 URL 集，与 dist diff 0）。
- 受污染探针（本次作废）：WebSearch site: ×2（操作符忽略）、Bing budget site:（百度垃圾）、Bing 整域控制（人社垃圾）。
- 有效读数：Bing stability site: = well-formed no-results（zh）；sitemap 全项；两页 200 + 自指 canonical；seo:health 100/100；§4 全部探针（含 `.html` 直连、未知子路径、未覆盖前缀对照）。
- 无站点代码修改；HEAD 期间出现并行会话提交（`623458f` 等 redirects 相关工作）。
