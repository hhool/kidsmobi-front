# 收录核查 & "stable track" 承载页迁移评估 — 2026-10-21（r13）

运行时间：2026-10-21 02:34–02:50 (GMT+8)。只做核查与记录，未改任何站点代码。

## 0. 结论速览

| # | 项目 | 结论 |
|---|---|---|
| 1 | ✅ **r12 的 P0 已修复并部署**（`001d587`，02:0x 上线） | r12 发现的 SPA 兜底吞 prerender 问题（255/269 URL 返回首页 shell）已解决：未知子路径恢复 **404**（带正确 404 title）；`/products/balance-bikes/` 等嵌套 prerender 恢复自身 title + 自指 canonical；CMS 稳定性指南 `/guides/scenario/balance-bike-stability` 的 canonical 从首页**恢复自指** |
| 2 | budget / stability 两页自身状态 | 全程未受回归影响：200 + `index,follow,max-image-preview:large` + 自指 canonical + 正确 title；stability H1 仍含 "stable track balance bike" |
| 3 | 两页是否被收录 | 沙箱内仍无法证实/否证。Bing：stability `site:` 第 **5** 次格式良好 no-results（zh 边缘节点）；budget 探针被污染（百度垃圾）。整域控制连续第 **2** 次被污染（人社垃圾）→ 作废。Google 侧最佳证据仍是 14/271 收录坪值（数据至 10-12） |
| 4 | sitemap 自检 | **全绿**（第 13 次连续）：200 / `application/xml; charset=utf-8` / **269 URL** / 269/269 带 `<priority>` / 两页均在 / max lastmod `2026-10-20T09:04:01.807Z` / 在线 URL 集与本地 dist diff = 0。Worker 拦截未复发 |
| 5 | seo:health | **100/100**（16/16，本次多一项新增守卫 `prerender-meta-ownership`：10 个嵌套路由在线服务自身 title + canonical，全过） |
| 6 | retired-URL 301 家族 | `dc2c1a5` 把 301 家族移交 Worker 后**在线复验通过**：前缀对（balance_bike→balance-bikes、electric_vehicles→electric-cars 等）+ `/products/other/*` 精确规则均 301 到幸存路径；未知 id 干净 404（不再落 shell） |
| 7 | stable-track 迁移 | **仍未确认**：无新 GSC Performance 导出（Downloads 自 10-19 起无新文件）。基线仍是 `/` + `/products/balance-bikes/`。新增利好：CMS 稳定性指南已恢复自指 canonical，收录后是天然候选承载页 |
| 8 | GSC Page indexing | 无新截图/导出，状态延续：redirect 组（4）**Started**；canonical 组（9）Failed 但已根因修复（`3f01510`）→ **无需再点 VALIDATE FIX**。**新增第 3 项手动操作**：面包屑重复 JSON-LD 已修复待「验证修复」（见 §7） |

## 1. 收录核查（Bing 优先）

| 探针 | 结果 | 判读 |
|---|---|---|
| WebSearch `site:.../balance-bike-budget/` | 5 条站外结果（trekbikesblog / pookapages 等），0 条站内 | `site:` 操作符**第 13 次**被忽略，无信息量 |
| WebSearch `site:.../balance-bike-stability/` | 5 条站外结果（smallsmart 等），0 条站内 | 同上 |
| Bing `site:.../balance-bike-budget/` | 百度知道/文库中文垃圾结果集 | **污染，作废**（第 6 次被污染类观测） |
| Bing `site:.../balance-bike-stability/` | 格式良好的本地化 **no-results** 页（"没有与此相关的结果"，zh） | stability **第 5 次** well-formed no-results（r4 ru / r8 zh / r9 es / r12 zh / r13 zh）→ 跨 5 个边缘节点语义一致，继续支持"stability 尚未进 Bing 索引" |
| Bing 整域控制 `site:balancebiketoddler.com` | 人社政务平台（mohrss.gov.cn）中文垃圾结果集 | **连续第 2 次污染**（r12、r13 载荷相同）→ 控制作废；末次有效整域控制为 r11（10-20，站内在索引、无 /balance-bike-* 资产页） |

结论：本沙箱对搜索引擎 `site:` 查询的干扰已持续 13+ 次运行，收录状态**只能以 GSC 或正常网络下的 `site:` 为准**。现有证据组合（Bing 5×no-results + Google 14/271 坪值）指向：两页均未被收录，stability 证据更强。两页自身技术状态（200 / 可索引 / 自指 canonical / 在 sitemap）已完全就绪，收录只差 Google 侧抓取与 GSC 手动请求。

## 2. sitemap 自检（全绿）

抓取方式：`curl --noproxy '*'`（无 query）直取 `https://balancebiketoddler.com/sitemap.xml`。

| 检查项 | 结果 |
|---|---|
| HTTP 状态 | **200** |
| Content-Type | **`application/xml; charset=utf-8`** |
| URL 条数 | **269**（精确 `grep -o` 计数） |
| `<priority>` 覆盖 | **269/269**（分布 1.0×1 / 0.9×9 / 0.8×1 / 0.6×99 / 0.4×159，与 dist 一致） |
| `<lastmod>` 覆盖 | 259/269（10 条静态路由缺 lastmod，影响极低） |
| `balance-bike-budget` | ✅ 在（priority 0.6） |
| `balance-bike-stability` | ✅ 在（priority 0.6） |
| max lastmod | `2026-10-20T09:04:01.807Z`（与 r11/r12 相同，无新批次） |
| 在线 vs 本地 dist | URL 集 diff = **0** |

**任务书基线说明**：任务书中"247 条 URL / 出现 260 条旧格式即告警"的基线已于 r11 起过期——10-19/10-20 两次合法内容发布使计数 247 → 266 → **269**（r11/r12 已记录并判读为合法）。本次 269 = 预期值，**不触发告警**；Worker 拦截未复发，边缘缓存无陈旧（10-15/16 修复已稳定 ~110h）。

## 3. 健康检查（`npm run seo:health`，已执行）

```
SCORE: 100/100  (pass 16, warn 0, fail 0 of 16)
[PASS] sitemap.xml: 269 URLs (baseline 269, delta 0)
[PASS] prerender-meta-ownership: 10 nested route(s) serve their own title + canonical
[PASS] internal-links: sampled 15, broken=0
```

- 检查项从 15 增至 16：新增的 `prerender-meta-ownership` 正是 r12 §4.5 配套建议的线上断言（嵌套 prerender 路由的 title/canonical 必须是自身而非首页），本次全过，**P0 复发已有自动防线**。
- 基线常量已与 269 同步，delta 0，无 WARN。两页均在 KEY_URLS 中且全项通过。

## 4. P0 修复复验（r12 §4 的闭环）

`001d587`（"fix(redirects): drop the SPA prefix block that shadowed 255 prerender pages"）删除前缀通配块后在线实测：

| 探针 | r12（回归态） | r13（修复态） |
|---|---|---|
| `/products/balance-bikes/zzz-not-real-xyz` | 200 + 首页 shell | **404**（"Page Not Found (404) | BalanceBikeToddler"） |
| `/products/balance-bikes/` | 200 + 首页 title/canonical | **200 + 自身 title** "Best Toddler Balance Bikes 2026" + 自指 canonical |
| `/guides/scenario/balance-bike-stability` | canonical → 首页 | **自身 title** "Stable Track Balance Bikes: What Holds" + **自指 canonical** |
| `/products/other/unknown-id-zzz999` | 200 shell | **404**（Worker 接管后的干净行为） |

**retired-URL 301 家族**（`dc2c1a5` 移交 Worker，本次用真实规则复验）：

- `/products/balance_bike/balance_bike-b0bkxshhnp` → 301 → `/products/balance-bikes/balance_bike-b0bkxshhnp` ✅
- `/products/other/stroller-b0d65f9ns7` → 301 → `/products/strollers/stroller-b0d65f9ns7` ✅
- `/products/other/kids_push_ride_ons-b001nqhn7s` → 301 → `/products/kids-tricycles/kids_push_ride_ons-b001nqhn7s` ✅
- `/products/electric_vehicles/ride_on_xyz` → 301 → `/products/electric-cars/ride_on_xyz` ✅（r5 曾误报的行段，现确认真实 301）
- 当前 map：44 条精确规则 + 10 组 1:1 前缀对（dist/data/legacy-redirects.json）

**GSC 影响推断**：10-12 之前的收录坪值 14/271 说明回归前 prerender 一直正常服务；本次回归在线窗口仅 ~2 小时（00:44–02:0x），且 r12 已提示"若持续可能在下一轮 Coverage 制造新 canonical 组"——现已修复，**预计不会在 GSC 数据中留下痕迹**（Coverage 数据本身也滞后到 10-12）。

## 5. stable-track 迁移评估

- **无新 GSC Performance 导出**（`find doc -newermt "2026-10-21 02:05"` 只有并行会话的 redirects/manual-actions 文档；Downloads 最新仍是 10-19 的 Coverage zip）→ 迁移状态**未确认**，基线维持 `/` + `/products/balance-bikes/`（10-15）。
- GSC 滞后 2-3 天，可见窗口 10-19~24 进行中，确定性读数预计 **10-22~24**（与 runbook 的任务板 #40 一致）。建议届时导出 Performance（Query contains "stable track" → PAGES）后复核。
- 迁移的机制前提（stability 页被收录）尚未满足，与 §1 判读一致。
- **新增候选观察对象**：`/guides/scenario/balance-bike-stability`（10-20 上线的 CMS 稳定性文章）随 P0 修复恢复自指 canonical，标题即 "Stable Track Balance Bikes: What Holds"——一旦被收录，它是 stability 主题的天然承载页候选，建议纳入下次迁移复核。

## 6. 其他次级发现

1. **IndexNow 快照仍停在 266 URL**（updatedAt 10-19T19:46:11.992Z）——10-20 的 3 篇 CMS guides 尚未提交增量；key 文件在线 200。runbook 的 GSC 手动请求清单已覆盖 Google 侧，但 Bing/Yandex/Seznam 侧建议补提交这 3 条。
2. `/guides` hub prerender title 疑张冠李戴（"How to Choose a Baby Stroller…"），本地 dist 同样如此——内容侧小 bug，待排查 prerender 取数源（r12 遗留，未变）。
3. 前主人垃圾 URL：`panties-sexy.html` 仍在线 404（终态不变）；Bing 索引侧因对照探针连续被污染无法复核（末次有效观察 r11：day 11 仍在索引）。
4. 并行会话新增 `doc/gsc-manual-actions-2026-10-21_{zh,en}.md`（`c308689`）：GSC 三项手动操作清单（重提 sitemap / 验证面包屑修复 / 请求 4 新页收录），本报告 §7 与之交叉引用。

## 7. GSC Page indexing 背景（2026-10-16 已知，未重复查询）

- 图1「Alternate page with proper canonical tag」= 9 页、图2「Page with redirect」= 4 页均为良性（currency/www/下划线/guide 变体已正确 canonical/301 去重）。
- 唯一遗留关注点：图2顶部「Validation failed（10/11→10/13）」。结合 10-18/10-19 Coverage 导出：redirect 组（4）状态为 **Started**（10-16 的重新 VALIDATE FIX 已被 Google 接受；301 服务端支撑自 r5 起在线，本次又确认 Worker 接管后仍正常）→ 等下一轮导出验证是否转 Passed。
- canonical 组（9）仍 Failed 但根因（SPA canonical 覆写）已由 `3f01510` 修复并部署，**无需再次 VALIDATE FIX**，等待重抓自愈。
- **新增第三项**：并行会话修复了 JSON-LD 三发射源导致的面包屑重复行（GSC 抽样 21 页中约 20 页报重复 Breadcrumb），修复已部署但**报告不会自动消失**——需用户在 GSC「网页呈现效果」中确认示例网址无重复后点**验证修复**（周期数天到两周）。见 `doc/gsc-manual-actions-2026-10-21_zh.md` 第 2 节。
- 本运行无新截图/导出，以上状态延续；r12 担心的"回归制造新 canonical 组"因修复及时（在线 ~2h）预计不会兑现。

## 8. 下一步建议（按优先级）

1. **P1 — 用户执行 GSC 三项手动操作**（10-22 前）：按 `doc/gsc-manual-actions-2026-10-21_zh.md`：① 删旧条目重提 sitemap.xml（预期"已发现的网址"爬向 269）；② 面包屑修复点「验证修复」；③ 对 4 个新指南页「请求编入索引」（先 #2/#3 主题页）。budget/stability 两页 10-16 已请求过，无需重复烧配额。
2. **P1 — 10-22~24 导出 GSC Performance**（Query contains "stable track" → PAGES）确认承载页迁移；同时导 Coverage 看 redirect 组是否转 Passed、面包屑组是否清空、14/271 坪值是否松动。
3. **P2 — 补提交 IndexNow 增量**（3 篇 CMS guides），保持提交快照与 sitemap 同步。
4. **P2 — 修 `/guides` hub 的 prerender title**。
5. **P3 — 沙箱内 Bing `site:` 核查已连续 13+ 次受干扰**（本次整域控制还连续 2 次被污染）：收录结论以 GSC 为准；如需 Bing 侧佐证，请在正常网络下执行 `site:balancebiketoddler.com/balance-bike-stability/` 与 budget 对应查询。

## 9. 运行留档（方法与原始数据）

- 探针均带 `--noproxy '*'`、无 query；时间 2026-10-21 02:34–02:50 GMT+8。
- sitemap：`/tmp/sitemap_check.xml`（43281 bytes，269 loc / 269 priority / 259 lastmod）；在线 URL 集 `/tmp/live_urls.txt` 与 dist diff 0。
- 受污染探针（本次作废）：WebSearch site: ×2（操作符忽略）、Bing budget site:（百度垃圾）、Bing 整域控制（人社垃圾）。
- 有效读数：Bing stability site: = well-formed no-results（zh，第 5 次）；sitemap 全项；两页 200 + meta robots `index,follow,max-image-preview:large` + 自指 canonical；seo:health 100/100（16/16）；§4 全部 P0 修复复验探针（含真实 retired-URL 301 家族 5 探针）。
- 期间 HEAD：`001d587`（P0 修复）、`c308689`（GSC runbook）、`dc2c1a5`（301 家族移交 Worker）——均为并行会话提交；本运行未改任何站点代码。
