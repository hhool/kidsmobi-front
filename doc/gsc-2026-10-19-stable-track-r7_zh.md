# 收录核查 & "stable track" 承载页迁移评估 — 2026-10-19（r7，同日重复触发）

> 关联文档：`doc/gsc-2026-10-19-stable-track_zh.md`（今日 r6，01:59）、`doc/gsc-2026-10-18-stable-track-r3/r4/r5_zh.md`、`doc/spa-canonical-overwrite-2026-10-19_zh.md`（SPA canonical bug 根因 + 修复）、`doc/gsc-coverage-2026-10-18-analysis_zh.md`（10-18 Coverage 深度分析）
> 性质：只读核查 + 文档记录，**未改动任何站点代码**。
> 运行窗口：2026-10-19 09:00-09:05（GMT+8）；结论为今日 r6 的同日增量。

## 0. 结论速览

| 检查项 | 结果 |
|---|---|
| `/balance-bike-budget/` 线上状态 | ✅ 200、`index,follow,max-image-preview:large`、自指 canonical、标题 "Budget Balance Bike: Cheap Picks That Last" |
| `/balance-bike-stability/` 线上状态 | ✅ 200、`index,follow,max-image-preview:large`、自指 canonical、标题 "Stable Track Balance Bike: Track Width" |
| 两页是否已被收录 | ❌ 仍无法从本沙箱确认，大概率**未收录**。WebSearch `site:` 操作符第 7 次被忽略（两查询各 5 条站外结果、0 条本站）；**Bing 整域对照本轮首次被污染**（返回中文高校图书馆类预置内容，对照作废）；Google 侧最佳证据仍为 10-12 截止 Coverage 导出（14/271、26 天平台期）。两页 10-15 提交、10-16 Request Indexing，**今日起进入 GSC 数据可见窗口（10-19~24）** |
| sitemap.xml | ✅ 200 + `application/xml; charset=utf-8` + **247 条 URL** + **247/247 含 `<priority>`** + 含两个新页 + max lastmod 2026-10-16T12:22:46.520Z（连续第 7 次一致）→ **Worker 拦截未复发、边缘缓存未陈旧** |
| `npm run seo:health` | ✅ **100/100**（15/15 通过，23s；KEY_URLS 实测含 stability / budget / what-buyers-say + 2 个 transparency 页） |
| stable-track 承载页迁移 | ⏳ 未确认且机制上仍被阻塞（稳定页自身未收录，不可能成为承载页）；10-15 基线（`/` + `/products/balance-bikes/`）推定仍成立。**仍无新 GSC Performance 导出**（02:00 后 `doc/` 仅新增 r6 文档自身） |
| GSC validation 状态 | ➖ 无新截图/导出，延续：redirect 组（4）= **Started**（301 服务端支撑自 r5 起在位）；canonical 组仍 Failed 但**根因已修**（SPA 水合改写，front `3f01510` 已部署），按并行会话结论**无需再点 VALIDATE FIX**，等复抓自然消化 |
| 前站长垃圾 URL | ⚠️ 线上仍 404（与既往一致）；Bing 索引状态本轮因对照被污染无法复核（r6 观察为第 7 天仍在索引） |

## 1. 收录核查（Bing 优先）

| 渠道 | 查询 | 结果 | 可用？ |
|---|---|---|---|
| WebSearch | `site:balancebiketoddler.com/balance-bike-budget/` | 5 条站外 balance-bike 文章（peggyomara ×2 / propelrc / pookapages / kayakcambria），0 条本站 | ❌ `site:` 操作符被忽略（沙箱已知约束，第 7 次一致） |
| WebSearch | `site:balancebiketoddler.com/balance-bike-stability/` | 5 条站外文章（smallsmart ×2 / velomagazine / trytovi / portcycling），0 条本站 | ❌ 同上 |
| Bing（WebFetch，整域对照） | `site:balancebiketoddler.com` | 返回中文高校图书馆资源类预置结果（sync.cctr.net.cn / dm5 / ccsu / lib.jxnhu / zisu / iclass30 / xyu / hcnu / dxzyk / github），与域名完全无关 | ❌ **对照本轮被污染，作废**（r6 的整域对照有效：站点确在 Bing 索引） |

**解读：**

- 本沙箱对 `site:` 路径查询与整域对照的输出均不可信（操作符被忽略 / 预置内容污染），**无法对两个新路径下"已收录/未收录"结论**——这是已记录 7 次的环境约束，不是站点问题。权威判断只能靠 GSC URL Inspection（用户侧）或正常网络下的 `site:` 查询。
- 最近一次有效对照为今日 r6（01:59）：Bing 整域 top 10 无任何 `/balance-bike-*` 资产页（budget / stability / size-chart 均缺席），与"资产页尚未进入 Bing 索引"相容，但缺席本身不是证明。
- Google 侧最佳证据仍是 10-12 截止的 Coverage 导出（14/271 收录、26 天平台期）：两页 10-15 提交、10-16 Request Indexing，**大概率尚未收录**；按 GSC 2-3 天滞后，**今日（10-19）起进入提交效果可见窗口 10-19~24**。

## 2. sitemap 自检

抓取方式：`curl -s --noproxy '*' https://balancebiketoddler.com/sitemap.xml`（干净路径、无 query、无 cache-buster——即 Google 实际抓取的路径）。

| 检查项 | 预期 | 实测 | 判定 |
|---|---|---|---|
| HTTP 状态 | 200 | 200 | ✅ |
| Content-Type | application/xml | `application/xml; charset=utf-8` | ✅ |
| URL 数 | 247 | **247**（delta 0） | ✅ |
| 含 balance-bike-budget | 是 | 是 | ✅ |
| 含 balance-bike-stability | 是 | 是 | ✅ |
| 含 `<priority>` | 是 | **247/247** | ✅ 后端 `f2046bf` 持续生效（连续第 5 次运行确认 priority 完整） |
| 非 JSON / 非 404 / 非 260 条旧格式 | — | max lastmod = **2026-10-16T12:22:46.520Z**（连续 7 次一致；期间无新内容部署，符合预期） | ✅ **Worker 拦截未复发、边缘缓存未陈旧** |

**结论：七项检查全绿，无需告警。** 10-15/16 的干净路径修复与 priority 修复已稳定运行约 90 小时；push 后自动 purge 工作流的 sitemap 复验机制持续有效（lastmod 未漂移）。

## 3. 健康检查（可选，已执行）

```
SCORE: 100/100  (pass 15, warn 0, fail 0 of 15)
```

robots.txt、sitemap.xml（247，delta 0）、15 个关键页元数据（含两个新页）、llms.txt（1137B）、15 条抽样内链 0 断裂，用时 23s。KEY_URLS 实测清单：/、/products、/reviews、/guides、/news、/about、stability、budget、what-buyers-say、testing-methodology、certification-lab-notes——昨日补充的 budget 页已在位，本项无需再提。

## 4. stable-track 迁移（仍无新 GSC 导出）

- 运行中检查 `doc/`：02:00 之后仅新增今日 r6 的两份文档（本任务的上一轮产出），**无 GSC Performance 导出**。
- 迁移状态无新证据，r3/r5/r6 结论延续：**未确认且机制上被阻塞**——稳定页自身未收录，不可能被 Google 选为 "stable track" 的承载页；10-15 基线（`/` + `/products/balance-bikes/`）推定仍成立。
- 按 GSC 2-3 天滞后，含今日的 Performance 导出（Query contains `stable track` → PAGES 页签）在 **10-19~24** 落地；本自动化每次运行都会检查新导出，一旦落地即自动分析。

## 5. GSC Page indexing 背景（2026-10-16 已知情况，未重复查询）

- **良性、无需处理**：「Alternate page with proper canonical tag」与「Page with redirect」——currency / www / 下划线 / guide 变体均已正确 canonical 或 301 去重。
- **唯一遗留关注点**：图2顶部「Validation failed（10/11→10/13）」——r3 已确认 redirect 组（4）重新 VALIDATE FIX 后为 **Started**；canonical 组仍 Failed。本运行无新截图/导出，状态延续。
- **canonical 组处置口径不变**：根因（SPA 水合改写）已于今日修复上线（front `3f01510`），**无需再点 VALIDATE FIX**；用户若仍看到 Failed 属良性记录，趋势递减中，等复抓自然消化。
- redirect 组：301 服务端支撑自 r5 起在位（23/23），下次 Coverage 导出应能看到 Started → Passed。
- `/auth/` noindex 行（cookie 弹窗死链，前端 `95b755f` 已修）将随 Google 下次抓取自然清除。

## 6. 下一步建议（按优先级）

1. **GSC URL Inspection 两个新页**（可见窗口今天打开）：这是唯一能对"是否收录"下权威结论的动作。若为 "Discovered – currently not indexed" 或 "Crawled – currently not indexed"，可再点一次 Request Indexing（10-16 已点过一次，建议间隔 ≥1 周）。
2. **导出 Performance（Query contains `stable track` → PAGES 页签）**验证承载页迁移；放入 `doc/` 后本自动化会自动分析。
3. **下次 Coverage 导出重点看**：① 收录数 14 → 15/16（提交生效）② redirect validation Started → Passed ③ canonical 组数量继续下降（修复后自然消化，无需干预）。
4. **外链建设仍是唯一真正的杠杆**：26 天平台期 + 94% Discovered-not-indexed + 零外链的诊断链未变；`doc/backlink-outreach-pack-2026-10-19_zh.md`（16 目标、3 梯队、4 封邮件稿）可直接启动外联。
5. **（可选）Bing Webmaster Tools 移除**两条前站长垃圾 URL（线上 404，会自然清退；Bing 侧仍可能在索引，最近一次有效观察为 r6）。
6. **（可选）后端**：无新待办——301 路由（r5 起）、priority 修复、sitemap 干净路径均已稳定。

## 7. 运行留档（方法与原始数据）

- sitemap：`curl -s --noproxy '*' -D - -o /tmp/sitemap.xml https://balancebiketoddler.com/sitemap.xml` → 200 / `application/xml; charset=utf-8` / Content-Length 39888；`grep -o '<loc>'` = 247；`grep -o '<priority>'` = 247；两个新页 `<loc>` 均在列；max lastmod = 2026-10-16T12:22:46.520Z（连续 7 次一致）。
- 两新页：curl 直查 → 200 / `index,follow,max-image-preview:large` / 自指 canonical；标题分别为 "Budget Balance Bike: Cheap Picks That Last | BalanceBikeToddler"、"Stable Track Balance Bike: Track Width | BalanceBikeToddler"。
- 搜索：WebSearch `site:` ×2（操作符被忽略，各 5 条站外结果）；WebFetch Bing 整域对照 ×1——**本轮被预置内容污染，对照作废**（r6 对照有效）。
- 健康检查：`npm run seo:health` ×1 → 100/100（15/15，23s）。
- 垃圾 URL：`curl` ×2 → `/panties/fashion-models-directory.php`、`/spanking/hardman-cnn-models.php` 均 404（线上最终状态与既往一致）。
- IndexNow 快照 `scripts/seo/.last-indexnow.json`：updatedAt 2026-10-15T16:18:44.835Z 未变，247 条 URL 含两个新页。
- git（front）：自 r6 以来无新提交（HEAD 仍为 `9c00d2e`，r6 两份文档仍未入库）；本运行**零改动**。
- GSC 导出/截图：无新增（`find doc -newermt "2026-10-19 02:00"` 仅 r6 文档自身）。
