# 收录核查 & "stable track" 承载页迁移评估 — 2026-10-21（r14）

运行时间：2026-10-21 11:53–12:0x (GMT+8)。只做核查与记录，未改任何站点代码。

## 0. 结论速览

| # | 项目 | 结论 |
|---|---|---|
| 1 | budget / stability 两页是否被收录 | 沙箱内**仍无法证实**（搜索引擎 `site:` 查询第 15/16 次被忽略/污染）。现有证据组合继续指向"两页均未收录、stability 证据更强"：Bing stability `site:` 第 **6** 次格式良好 no-results；Google 侧最佳证据仍为 14/271 收录坪值（数据至 10-12） |
| 2 | sitemap 自检 | **全绿**（第 14 次连续）：200 / `application/xml; charset=utf-8` / **269 URL** / 269/269 带 `<priority>` / 两页均在（priority **0.9**）/ max lastmod `2026-10-20T09:04:01.807Z`。Worker 拦截未复发、边缘缓存无陈旧（10-15/16 修复已稳定 ~114h） |
| 3 | seo:health | **100/100**（16/16，30s）：P0 守护 `prerender-meta-ownership`（10 条嵌套路由）持续生效；sitemap 基线 269、delta 0；内链 broken=0 |
| 4 | stable-track 迁移 | **仍未确认**：无新 GSC Performance 导出（Downloads/doc 自 r13 起无新文件）。基线维持 `/` + `/products/balance-bikes/`（10-15）；确定性读数窗口 **10-22~24** |
| 5 | GSC Page indexing | 无新截图/导出，状态延续：redirect 组（4）**Started**；canonical 组（9）Failed 但已根因修复（`3f01510`）→ **无需再点 VALIDATE FIX**；面包屑重复 JSON-LD 修复待用户点「验证修复」 |
| 6 | IndexNow 快照 | ✅ **遗留待办已关闭**：快照刷新至 10-20T18:43:58Z、**269 条**，与线上 sitemap URL 集 **diff = 0**（r12/r13 挂起 2 天的"266 条陈旧"问题消除） |
| 7 | 遗留内容 bug | `/guides` hub prerender title 仍张冠李戴（"How to Choose a Baby Stroller…"），r12 起未变，待修 |

## 1. 收录核查（Bing 优先）

| 探针 | 结果 | 判读 |
|---|---|---|
| WebSearch `site:.../balance-bike-budget/` | 5 条站外内容农场结果，0 条站内 | `site:` 操作符**第 15 次**被忽略，无信息量 |
| WebSearch `site:.../balance-bike-stability/` | 5 条站外结果，0 条站内 | 第 16 次被忽略 |
| Bing `site:.../balance-bike-budget/` | 百度知道/文库中文垃圾结果集 | **污染，作废** |
| Bing `site:.../balance-bike-stability/` | 格式良好的本地化 **no-results** 页（"没有与此相关的结果"，zh） | stability **第 6 次** well-formed no-results（r4 ru / r8 zh / r9 es / r12 zh / r13 zh / r14 zh）→ 跨 6 个边缘节点语义一致，"stability 尚未进 Bing 索引"证据继续累积 |
| Bing 整域控制 `site:balancebiketoddler.com` | 人社政务平台（mohrss.gov.cn）垃圾结果集 | **连续第 3 次污染**（r12/r13/r14 载荷相同，同一边缘节点）→ 控制作废；末次有效整域控制仍为 r11（站内在索引） |

结论：本沙箱对搜索引擎 `site:` 的干扰已持续 14 次运行，收录状态**只能以 GSC 或正常网络下的 `site:` 为准**（任务书前提）。现有证据组合（Bing 6×no-results + Google 14/271 坪值，数据均滞后）指向两页均未被收录；两页自身技术状态（200 / 可索引 / 自指 canonical / 在 sitemap 且 IndexNow 已提交）完全就绪，收录只差搜索引擎侧抓取。按任务书约定：GSC 滞后 2-3 天，**budget/stability 的确定性收录读数需等 10-22~24 的 GSC 导出**。

## 2. sitemap 自检（全绿，无告警）

抓取方式：`curl --noproxy '*'`（无 query）直取 `https://balancebiketoddler.com/sitemap.xml`，43,281 bytes。

| 检查项 | 结果 |
|---|---|
| HTTP 状态 | **200** |
| Content-Type | **`application/xml; charset=utf-8`** |
| URL 条数 | **269**（精确 `grep -o` 计数） |
| `<priority>` 覆盖 | **269/269**（分布 1.0×1 / 0.9×9 / 0.8×1 / 0.6×99 / 0.4×159，与 r11–r13 完全一致） |
| `<lastmod>` 覆盖 | 259/269（10 条静态路由缺 lastmod，影响极低，状态未变） |
| `balance-bike-budget` | ✅ 在，priority **0.9** |
| `balance-bike-stability` | ✅ 在，priority **0.9** |
| max lastmod | `2026-10-20T09:04:01.807Z`（与 r11 起相同，无新批次发布） |
| 在线 URL 集 vs IndexNow 快照 | **diff = 0**（269 = 269，完全同步——本次新增交叉校验） |

**任务书基线说明**：任务书中"247 条 URL / 出现 260 条旧格式即告警"的基线已于 r11 起过期——10-19/10-20 两次合法内容发布使计数 247 → 266 → **269**。本次 269 = 预期值，**未出现 JSON / 404 / 260 条旧格式中的任何一种，不触发告警**；Worker 拦截未复发，边缘缓存无陈旧。

小修正：r13 文档速览表将两页 priority 记为 0.6；本次直接从线上样本核对为 **0.9**（`<loc>.../balance-bike-budget/</loc><priority>0.9</priority>`、同 stability）。全量 priority 分布与 r13 逐一相同（99×0.6 未减、9×0.9 未增），可证线上 sitemap 未变，r13 该处为文档笔误。

## 3. 健康检查（`npm run seo:health`，已执行，30s）

```
SCORE: 100/100  (pass 16, warn 0, fail 0 of 16)
[PASS] sitemap.xml: 269 URLs (baseline 269, delta 0)
[PASS] prerender-meta-ownership: 10 nested route(s) serve their own title + canonical
[PASS] internal-links: sampled 15, broken=0
```

- 两页均在 KEY_URLS 且 title/desc/keywords/canonical/json-ld 全项通过。
- `prerender-meta-ownership` 守卫持续拦截 r12 类 P0（SPA 通配符吞 prerender）复发，本次全过。
- 基线常量已与 269 同步，delta 0，无 WARN（r11 的假阳性已随并行会话改常量消除）。

## 4. 两页在线状态复验（未受任何回归影响）

| 页 | 状态 | meta robots | canonical | title / H1 |
|---|---|---|---|---|
| `/balance-bike-budget/` | 200（32,133 B） | `index,follow,max-image-preview:large` | 自指 | "Budget Balance Bike: Cheap Picks That Last\|BalanceBikeToddler"；H1 一致 |
| `/balance-bike-stability/` | 200（52,764 B） | `index,follow,max-image-preview:large` | 自指 | "Stable Track Balance Bike: Track Width\|BalanceBikeToddler"；H1 仍含 "stable track balance bike" |

r13 闭环的 P0 修复（`001d587`）本运行无需重复全量复验——`prerender-meta-ownership` 自动守卫（10 条嵌套路由全过）+ 两页自身探针已构成持续证据；seo:health 同分通过。

## 5. IndexNow 快照（遗留待办 ✅ 关闭）

- `scripts/seo/.last-indexnow.json`：updatedAt **2026-10-20T18:43:58.401Z**，**269 条 URL**。
- 与线上 sitemap URL 集逐一 diff = **0**：10-20 的 3 篇 CMS guides（`/guides/beginner/balance-bike-by-age`、`/guides/beginner/balance-bike-what-buyers-say`、`/guides/scenario/balance-bike-stability`）已在快照内——r12/r13 挂起的"266 条陈旧、3 篇未提交"问题**已消除**（并行会话已于 10-20 晚间补提交）。
- key 文件 `dfb12ac97ad4a34c75ccf6cc4b783c7f.txt` 在线 200。

## 6. stable-track 迁移评估

- **无新 GSC Performance 导出**：`find doc -newermt "2026-10-21 02:55"` 为空；Downloads 最新仍是 10-19 的 Coverage zip（且该 zip 与 10-18 版逐字节相同，数据窗口冻结于 10-12）→ 迁移状态**未确认**，基线维持 `/` + `/products/balance-bikes/`（10-15 基线）。
- 按任务书约定，暂无导出时以 Bing `site:` 收录为准 + 提示等 GSC：Bing 侧 stability 第 6 次 no-results 佐证该页未被收录 → **机制上 stability 页暂时不可能成为 "stable track" 的承载页**；迁移确认必须等 GSC。
- GSC 可见窗口 10-19~24 进行中，确定性读数预计 **10-22~24**（runbook 任务板 #40）。建议届时导出 Performance（Query contains "stable track" → PAGES）+ Coverage（看 14/271 坪值是否松动、redirect 组是否转 Passed）。
- 候选观察对象（r13 起）：`/guides/scenario/balance-bike-stability`（CMS 稳定性文章，已自指 canonical、标题 "Stable Track Balance Bikes: What Holds"），收录后是 stability 主题天然承载页候选，建议纳入 10-22~24 的迁移复核。

## 7. GSC Page indexing 背景（2026-10-16 已知，未重复查询）

- 图1「Alternate page with proper canonical tag」= 9 页、图2「Page with redirect」= 4 页均为良性（currency/www/下划线/guide 变体已正确 canonical/301 去重），无需处理。
- 唯一遗留关注点「Validation failed（10/11→10/13）」：结合既有导出，redirect 组（4）状态为 **Started**（10-16 重新 VALIDATE FIX 已被 Google 接受；301 服务端支撑自 r5 起在线并经 Worker 移交 `dc2c1a5` 复验）→ 等下一轮导出验证是否转 Passed。
- canonical 组（9）仍 Failed 但根因（SPA canonical 覆写）已由 `3f01510` 修复部署 → **无需再次 VALIDATE FIX**，等待重抓自愈。
- **第三项手动操作**（r13 新增，待用户执行）：面包屑重复 JSON-LD 修复已部署但不会自动消失——需用户在 GSC「网页呈现效果」确认示例无重复后点**验证修复**（见 `doc/gsc-manual-actions-2026-10-21_zh.md` 第 2 节）。
- 本运行无新截图/导出，以上状态全部延续；未发现新问题。

## 8. 下一步建议（按优先级）

1. **P1 — 用户执行 GSC 手动操作**（10-22 前）：① 面包屑修复点「验证修复」；② 删旧条目重提 sitemap.xml（预期"已发现的网址"爬向 269）；③ 对 10-19/20 新发布的指南页「请求编入索引」（budget/stability 10-16 已请求过，无需重复烧配额）。
2. **P1 — 10-22~24 导出 GSC Performance**（Query contains "stable track" → PAGES）确认承载页迁移；同时导 Coverage 看 redirect 组是否转 Passed、面包屑组是否清空、14/271 坪值是否松动。
3. **P2 — 修 `/guides` hub 的 prerender title**（"How to Choose a Baby Stroller…" 张冠李戴，r12 起未变；疑 prerender 取数源取了子路由数据）。
4. **P3 — 沙箱内 Bing `site:` 核查已连续 14 次受干扰**（整域控制连续 3 次被同一人社垃圾节点污染）：收录结论以 GSC 为准；如需 Bing 侧佐证，请在正常网络下执行 `site:balancebiketoddler.com/balance-bike-stability/` 与 budget 对应查询。
5. **P3 — 如 GSC 10-22~24 导出显示 stability 已收录但 "stable track" 承载页仍未迁移**，检查该页与 `/products/balance-bikes/` 的内链锚文本（承载页迁移通常需要站内锚文本配合）。

## 9. 运行留档（方法与原始数据）

- 探针均带 `--noproxy '*'`、无 query；时间 2026-10-21 11:53–12:0x GMT+8。
- sitemap：线上原文存档 `tmp/sitemap-check-r14.xml`（43,281 bytes；269 loc / 269 priority / 259 lastmod；两页 priority 0.9）；在线 URL 集 `tmp/live-sitemap-urls-r14.txt` 与 IndexNow 快照 `tmp/indexnow-urls-r14.txt` diff = 0。
- 受污染探针（本次作废）：WebSearch site: ×2（操作符忽略）、Bing budget site:（百度垃圾）、Bing 整域控制（人社垃圾，连续第 3 次）。
- 有效读数：Bing stability site: = well-formed no-results（zh，第 6 次）；sitemap 全项；两页 200 + meta robots + 自指 canonical；seo:health 100/100（16/16）；IndexNow 快照 269 条与 sitemap 一致；key 文件 200。
- 期间 HEAD：`001d587`（无新提交，与 r13 相同）——本运行未改任何站点代码。
