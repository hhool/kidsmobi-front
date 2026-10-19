# 收录核查 & "stable track" 承载页迁移评估 — 2026-10-19（r6，跨日首次运行）

> 关联文档：`doc/gsc-2026-10-18-stable-track_zh.md`（10-18 第 1-2 次）、`doc/gsc-2026-10-18-stable-track-r3_zh.md` / `-r4_` / `-r5_`（10-18 第 3-5 次）、`doc/spa-canonical-overwrite-2026-10-19_zh.md`（今日并行会话：SPA canonical bug 根因 + 修复）、`doc/gsc-coverage-2026-10-18-analysis_zh.md`（10-18 Coverage 深度分析）
> 性质：只读核查 + 文档记录，**未改动任何站点代码**。
> 运行窗口：2026-10-19 01:59-02:10（GMT+8）；结论为 10-18 系列文档的跨日增量。

## 0. 结论速览

| 检查项 | 结果 |
|---|---|
| `/balance-bike-budget/` 线上状态 | ✅ 200、`index,follow,max-image-preview:large`、自指 canonical、标题 "Budget Balance Bike: Cheap Picks That Last" |
| `/balance-bike-stability/` 线上状态 | ✅ 200、`index,follow,max-image-preview:large`、自指 canonical、标题 "Stable Track Balance Bike: Track Width" |
| 两页是否已被收录 | ❌ 仍无法从本沙箱确认，大概率**未收录**。WebSearch 的 `site:` 操作符依旧被忽略（两次查询各返回 5 条站外文章、0 条本站结果）；Bing 整域对照确认站点在索引中；Google 侧最佳证据仍为 10-12 截止的 Coverage 导出（14/271、26 天平台期）。两页 10-15 才提交，最早 10-19~24 可见效果——**今天起进入 GSC 数据可见窗口** |
| sitemap.xml | ✅ 200 + `application/xml; charset=utf-8` + **247 条 URL** + **247/247 含 `<priority>`** + 含两个新页 + max lastmod 2026-10-16T12:22:46.520Z（连续第 6 次一致）→ **Worker 拦截未复发、边缘缓存未陈旧** |
| `npm run seo:health` | ✅ **100/100**（15/15 通过，内链抽样 0 断裂）；KEY_URLS 已含两个新页 |
| stable-track 承载页迁移 | ⏳ 未确认且机制上仍被阻塞（稳定页自身未收录，不可能成为承载页）；10-15 基线（`/` + `/products/balance-bikes/`）推定仍成立。**今日无新 GSC Performance 导出**（`find doc -newermt "2026-10-18 23:00"` 仅见其他自动化的 3 份文档，无 GSC 数据） |
| GSC validation 状态 | ➖ 无新截图/导出，延续 r3/r5：redirect 组（4）= **Started**；canonical 组仍 Failed。🆕 今日并行会话已定位并修复 canonical bug 根因（SPA 水合改写，front `3f01510` 已部署）——该组**无需再点 VALIDATE FIX**，等 Google 复抓自然消化 |
| 前站长垃圾 URL | ⚠️ 仍在 Bing 索引（第 7 天）：www 主机下 301 → apex 后 **404**（最终状态与既往一致，无恶化）；可选 Bing Webmaster Tools 移除申请 |

## 1. 收录核查（Bing 优先）

| 渠道 | 查询 | 结果 | 可用？ |
|---|---|---|---|
| WebSearch | `site:balancebiketoddler.com/balance-bike-budget/` | 5 条站外 balance-bike 文章（peggyomara / trekbikesblog / pookapages / adorablyperfect），0 条本站 | ❌ `site:` 操作符被忽略（沙箱已知约束，与历次一致） |
| WebSearch | `site:balancebiketoddler.com/balance-bike-stability/` | 5 条站外文章（smallsmart ×2 / bisiklopedi / portcycling / bebeluxbaby），0 条本站 | ❌ 同上 |
| Bing（WebFetch，整域对照） | `site:balancebiketoddler.com` | 10 条真实结果：首页、/about、/products、/reviews + 5 个商详页 | ✅ **站点确在 Bing 索引中**（对照有效） |

**解读：**

- 本沙箱内 `site:` 双路径查询依旧不产出可用信号（操作符被忽略 / 预置内容污染），**无法对两个新路径下"已收录/未收录"结论**——这是已记录 6 次的环境约束，不是站点问题。权威判断只能靠 GSC URL Inspection（用户侧）或正常网络下的 `site:` 查询。
- 整域 top 10 中依旧无任何 `/balance-bike-*` 资产页（budget / stability / size-chart 均缺席）——与"资产页尚未进入 Bing 索引"相容，但 top 10 缺席本身不是证明。
- Google 侧最佳证据仍是 10-12 截止的 Coverage 导出（14/271 收录、26 天平台期）：两页 10-15 提交、10-16 Request Indexing，**大概率尚未收录**；按 GSC 2-3 天滞后，**10-19~24 是提交效果可见窗口，今天起进入该窗口**。

## 2. sitemap 自检

抓取方式：`curl -s --noproxy '*' https://balancebiketoddler.com/sitemap.xml`（干净路径、无 query、无 cache-buster——即 Google 实际抓取的路径）。

| 检查项 | 预期 | 实测 | 判定 |
|---|---|---|---|
| HTTP 状态 | 200 | 200 | ✅ |
| Content-Type | application/xml | `application/xml; charset=utf-8` | ✅ |
| URL 数 | 247 | **247**（delta 0） | ✅ |
| 含 balance-bike-budget | 是 | 是 | ✅ |
| 含 balance-bike-stability | 是 | 是 | ✅ |
| 含 `<priority>` | 是 | **247/247** | ✅ 后端 `f2046bf` 持续生效（连续第 4 次运行确认 priority 完整） |
| 非 JSON / 非 404 / 非 260 条旧格式 | — | max lastmod = **2026-10-16T12:22:46.520Z**（连续 6 次一致；期间无新内容部署，符合预期） | ✅ **Worker 拦截未复发、边缘缓存未陈旧** |

**结论：七项检查全绿，无需告警。** 10-15/16 的干净路径修复与 priority 修复已稳定运行 80 小时以上；push 后自动 purge 工作流的 sitemap 复验机制持续有效（lastmod 未漂移）。

## 3. 健康检查（可选，已执行）

```
SCORE: 100/100  (pass 15, warn 0, fail 0 of 15)
```

robots.txt、sitemap.xml（247，delta 0）、15 个关键页元数据（含两个新页）、llms.txt（1137B）、15 条抽样内链 0 断裂。备注：今日前端 `c3a457f` 已修掉 r4 暴露的脚本缺陷（网络抖动被计为断链），本类假跌风险解除。

## 4. 🆕 SPA canonical bug：根因已修复（来自今日并行会话）

与收录核查直接相关的今日最大站点侧变化（front `3f01510`，已部署，详见 `doc/spa-canonical-overwrite-2026-10-19_zh.md`）：

- **bug**：所有水合进栏目 tab（news/guides/reviews）的非栏目索引路由，canonical 被 SPA 改写成栏目首页；transparency 页 canonical 被剥尾斜杠。影响约 **41 条 sitemap URL + 7 个 transparency 页**。Google 渲染 JS 后采信了错的那个——这正是 GSC「Alternate page with proper canonical tag」样本（`/guides/beginner/best-balance-bike-for-1-year-old`、`/news/new_product` 等）的根因。
- **修复**：单一真源模块 `src/lib/canonicalPath.ts` + 新守卫 `npm run check:spacanonicals`（250 路由全部一致）。
- **对本任务的两个意义**：① 线上回归复测确认**预算页/稳定页水合后 canonical 均正确自指**，两新页的收录通路无菌；② 该 GSC 分组**不需要**再点 "Done fixing?" / VALIDATE FIX——不是"修复后验证"场景，趋势本就在 6→4→…→0 递减，等 Google 复抓自然消化（详见该文档 §6）。

## 5. stable-track 迁移（无新 GSC 导出）

- 运行中检查 `doc/`：`find doc -newermt "2026-10-18 23:00"` 仅返回今日其他自动化的 3 份文档（backlink outreach pack / cms-p2-hygiene closure / spa-canonical），**无 GSC Performance 导出**。
- 因此迁移状态无新证据，r3/r5 结论延续：**未确认且机制上被阻塞**——稳定页自身未收录，不可能被选为 "stable track" 的承载页；10-15 基线（`/` + `/products/balance-bikes/`）推定仍成立。
- 按 GSC 2-3 天滞后，含今日的 Performance 导出（Query contains `stable track` → PAGES 页签）在 **10-19~24** 落地；本自动化每次运行都会检查新导出。

## 6. GSC Page indexing 背景（2026-10-16 已知情况，未重复查询）

- **良性、无需处理**：「Alternate page with proper canonical tag」与「Page with redirect」——currency / www / 下划线 / guide 变体均已正确 canonical 或 301 去重。
- **唯一遗留关注点**：图2顶部「Validation failed（10/11→10/13）」——r3 已确认 redirect 组（4）重新 VALIDATE FIX 后为 **Started**；canonical 组仍 Failed。本运行无新截图/导出，状态延续。
- 🆕 **canonical 组的处置已变化**：今日根因修复上线后，按并行会话结论**无需再点 VALIDATE FIX**；若用户仍看到该组 Failed，属良性记录，等复抓自然消化（趋势递减中）。
- redirect 组：301 服务端支撑自 r5 起已就位（23/23），下次 Coverage 导出应能看到 Started → Passed。
- 另：`/auth/` noindex 行（cookie 弹窗死链，前端 `95b755f` 已修）将随 Google 下次抓取自然清除。

## 7. 下一步建议（按优先级）

1. **GSC URL Inspection 两个新页**（今天起数据窗口打开）：这是唯一能对"是否收录"下权威结论的动作。若为 "Discovered – currently not indexed" 或 "Crawled – currently not indexed"，可再点一次 Request Indexing（10-16 已点过一次，建议间隔 ≥1 周）。
2. **导出 Performance（Query contains `stable track` → PAGES 页签）**验证承载页迁移；放入 `doc/` 后本自动化会自动分析。
3. **下次 Coverage 导出重点看**：① 收录数 14 → 15/16（提交生效）② redirect validation Started → Passed ③ canonical 组数量继续下降（修复后自然消化，无需干预）。
4. **外链建设仍是唯一真正的杠杆**：26 天平台期 + 94% Discovered-not-indexed + 零外链的诊断链未变；今日已备好 `doc/backlink-outreach-pack-2026-10-19_zh.md`（16 目标、3 梯队、4 封邮件稿），可直接启动外联。
5. **（可选）Bing Webmaster Tools 移除**两条前站长垃圾 URL（第 7 天仍在索引；www 下 301→apex 404，最终状态与既往一致；不处理也会自然衰减）。
6. **（可选）后端**：无新待办——301 路由（r5 起）、priority 修复、sitemap 干净路径均已稳定。

## 8. 运行留档（方法与原始数据）

- sitemap：`curl -s --noproxy '*' -D - -o /tmp/sitemap.xml https://balancebiketoddler.com/sitemap.xml` → 200 / `application/xml; charset=utf-8` / Content-Length 39888 / CF-RAY a4c970b1eb4875a3-LAX；`grep -o '<loc>' | wc -l` = 247；`grep -o '<priority>' | wc -l` = 247；max lastmod = 2026-10-16T12:22:46.520Z（连续 6 次一致）。
- 两新页：curl 直查 → 200 / `index,follow,max-image-preview:large` / 自指 canonical；标题分别为 "Budget Balance Bike: Cheap Picks That Last | BalanceBikeToddler"、"Stable Track Balance Bike: Track Width | BalanceBikeToddler"。
- Bing：WebSearch `site:` ×2（操作符被忽略，站外结果）；WebFetch Bing 整域对照 ×1（站点在索引，top10 无 /balance-bike-* 资产页）。
- 健康检查：`npm run seo:health` ×1 → 100/100（15/15）。
- 垃圾 URL：`curl -I` ×2 → www 主机 301 → apex 同路径 → 404（最终状态 404，与既往一致；仍在 Bing 索引第 7 天）。
- IndexNow 快照 `scripts/seo/.last-indexnow.json`：updatedAt 2026-10-15T16:18:44.835Z 未变，247 条 URL 含两个新页。
- git（front）：今日新增 `3f01510` SPA canonical 修复、`c3a457f` 健康脚本误报修复、`21ae969`/`13ee52a`/`9c00d2e` 文档与 gitignore 提交；本运行**零改动**。
- GSC 导出/截图：无新增（`find doc -newermt "2026-10-18 23:00"` 无 GSC 数据文件）。
