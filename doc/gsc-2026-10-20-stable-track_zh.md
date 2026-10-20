# 收录核查 & "stable track" 承载页迁移评估 — 2026-10-20（r11）

> 性质：只读核查 + 文档，未改动任何站点代码。运行时间 11:13–11:26 GMT+8。
> 背景承接：10-15/16 修复 Worker 拦截 sitemap、上线 budget/stability 两页、IndexNow/Bing/Yandex/Seznam 增量提交、10-16 GSC 手动三项操作。10-19 晚间站方发布了 10-article batch（+15 URL）与 4 篇 CMS guides（+4 URL），**sitemap 基线已从 247 合法变为 266**——本运行首要新事实。

## 0. 结论速览

| 核查项 | 结论 |
|---|---|
| `/balance-bike-budget/` 收录 | **未确认已收录**；沙箱内不可证（见 §1），Google 侧最佳证据（10-12 Coverage，14/271 平台期）指向未收录 |
| `/balance-bike-stability/` 收录 | 同上；且承载页机制上未索引即不可能成为 stable-track 落地页 |
| sitemap 自检 | **正常**：200 / `application/xml` / **266 URL**（非 247——合法增量，构成见 §2.1）/ 266/266 带 `<priority>` / 含两新页 / max lastmod 2026-10-19T19:04:35.959Z → 无 Worker 拦截复发、无边缘缓存陈旧 |
| `seo:health` | **97/100**（14 过 / 1 警 / 0 败）；唯一 WARN = 脚本 sitemap 基线陈旧（写死 247，delta +19 合法）——建议把基线常量更新为 266（代码改动，本次未做） |
| stable-track 迁移 | **未确认**：无新 GSC Performance 导出；基线仍为 `/` + `/products/balance-bikes/` |
| Validation failed 横幅 | 无新截图/导出，维持 r10 结论：redirect 组 Started（等下次 Coverage 导出转 Passed）；canonical 组已根因修复（`3f01510`），自愈中，**无需再点 VALIDATE FIX** |

## 1. 收录核查（Bing 优先）

沙箱网络对搜索引擎查询的污染已连续 11+ 次复现，本运行再次全数遇到，但**全域对照有效**：

| 探针 | 结果 | 判读 |
|---|---|---|
| WebSearch `site:.../balance-bike-budget/` | 5 条站外结果，0 条站内 | `site:` 运算符第 11 次被忽略（已知沙箱行为） |
| WebSearch `site:.../balance-bike-stability/` | 5 条站外结果，0 条站内 | 同上（第 12 次） |
| Bing `site:.../balance-bike-budget/`（WebFetch） | 知乎/百度 CATIA 罐头垃圾 | 查询被污染替换，**无效探针** |
| Bing `site:.../balance-bike-stability/`（WebFetch） | 百度知道/知乎 Windows 罐头垃圾 | 同上，**无效探针** |
| Bing `site:balancebiketoddler.com`（全域对照） | **有效**：首页、/products、/about、/reviews、/products/electric-cars、2 个商详在索引；未见 `/balance-bike-budget/`、`/balance-bike-stability/`，亦无 10-19 新发的 /guides/、/news/ 文章页；1 条前站主 spam URL（panties，第 11 天）仍在索引 | 站点整体在 Bing 索引中；**两资产页与新文章均未见于 Bing 顶部结果** |

**结论**：两新页收录状态在本沙箱内不可直接验证；结合 ① Bing 全域结果中资产页缺席、② Google 侧 10-12 Coverage 的 14/271 平台期（stability 仍在 Discovered 池），判断 **budget 与 stability 均尚未被收录**，且 10-19 新发的 19 个 URL 也不会立即出现在索引里。GSC 数据滞后 2–3 天（本属性 Coverage 滞后约 6–7 天），**10-22~24 的新导出才能给出确定性读数**。

## 2. sitemap 自检

`curl --noproxy '*'`（无 query）抓取 `https://balancebiketoddler.com/sitemap.xml`：

- **HTTP 200**，Content-Type `application/xml; charset=utf-8`（非 JSON、非 404 → Worker 拦截未复发）
- **URL 总数 266**（不是任务书里的 247，也不是告警线 260 —— 是 10-19/20 两次合法发布后的新基线）
- **266/266 条带 `<priority>`**（分布 1.0×1 / 0.9×9 / 0.8×1 / 0.6×96 / 0.4×159；新增 19 条全部 0.6）
- 含 `balance-bike-budget` ✓、含 `balance-bike-stability` ✓
- max lastmod = **2026-10-19T19:04:35.959Z**（随 batch 部署刷新 → 边缘缓存不陈旧；10-15/16 修复已稳定约 104h+）
- 线上 sitemap URL 集合与本地 `dist/sitemap.xml` 构建产物 **diff = 0**（字节数 42804 vs 42805，差一个尾部换行）

### 2.1 247 → 266 增量构成（全部合法，逐条在线 200）

| 来源 | 提交 | 数量 | URL |
|---|---|---|---|
| 基线 | — | 247 | 10-15 IndexNow 快照集 |
| 10-article batch | `47c2724`（10-19 23:45） | +15 | 5 个 guides 主题索引（budget/scenario/risk/maintenance/special）+ 6 篇 guides（price-tiers、vs-training-wheels、where-to-ride、safety-checks、maintenance、extra-support）+ 4 篇 news（science/industry/new_product/brand_news） |
| 4 篇 CMS guides | `f3a2824`（10-20 03:10） | +4 | /guides/beginner/balance-bike-size-chart、/guides/beginner/balance-bike-weight、/guides/risk/balance-bike-safety-standards、/guides/risk/balance-bike-recalls（支撑 footer 新增 Sizing & Buying Guide 栏） |
| **合计** | | **266** | 19 条新 URL 本次逐一 curl 验证，**全部 200** |

### 2.2 一处小偏差（不告警）

266 条中 **10 条缺 `<lastmod>`**：7 个顶层资产页（budget、by-age、safety-standards、size-chart、**stability**、weight、what-buyers-say）+ /safety/balance-bike-recalls/ + 2 个 transparency 页。属静态/中心页，Google 对缺失 lastmod 不惩罚；如需整齐可在后端生成器里为静态路由补固定 lastmod（可选，低优先）。

## 3. 健康检查（`npm run seo:health`，已执行）

**SCORE 97/100（pass 14 / warn 1 / fail 0）**，较昨日 100/100 的唯一变化：

```
[WARN] sitemap.xml: 266 URLs (baseline 247, delta +19)
```

- 判定：**假阳性**。脚本内 sitemap 基线常量写死 247，未随 10-19/20 合法发布更新。内容侧核查（§2）证明 266 完全正确。
- 建议（代码改动，本次按约束未做）：将 `scripts/seo/site-health-check.mjs` 的 sitemap 基线常量改为 266；今后每次批量发布后同步该常量，或改为"与 dist 构建产物比对"而非写死数字。
- 其余 14 项全过：两资产页 TDK/canonical/JSON-LD 齐全；robots.txt 200 且声明 sitemap；llms.txt 1137 bytes；内链抽样 15 条 broken=0。

## 4. stable-track 迁移评估

- 本轮检索 `doc/`（17:00 后）无新 GSC 导出——仅有并行工作流的 article-plan / backlink 文档。**无 Performance 导出 → 迁移未确认**。
- 维持 10-15 基线：stable-track 查询承载页仍应为 `/` + `/products/balance-bikes/`。
- 机制性阻碍仍在：stability 页未确认收录 → 不可能成为该查询的落地页。10-19 发布的 G1（/guides/budget/balance-bike-price-tiers）与 G3（scenario/where-to-ride）均按计划内链至两资产页（锚文本含 stable-track 承载页），收录后有助于加速迁移。
- GSC 可见性窗口 10-19~24 进行中：请在该窗口内导出 Performance（Query contains "stable track" → PAGES）与 Coverage，届时可首次验证迁移是否启动。

## 5. GSC Page indexing 背景（2026-10-16 已知，未重复查询）

- 「Alternate page with proper canonical tag」= 9、「Page with redirect」= 4：维持良性判定（currency/www/下划线/guide 变体已正确 canonical/301 去重），无需处理。
- 「Validation failed（10/11→10/13）」：无新截图/导出，状态维持 r10 结论——
  - redirect 组（4）：Started，301 服务端支撑自 r5 起在线，预计下次 Coverage 导出（~10-22~24）转 **Passed**；
  - canonical 组（9）：根因（SPA canonical 覆写）已由 `3f01510` 修复并部署，趋势 6→4→…→0 自愈中，**无需再点 VALIDATE FIX**。
- 若届时收到新截图：只需确认 redirect 组是否转 Passed；canonical 组若无回落可继续观察。

## 6. 下一步建议（按优先级）

1. **10-22~24 导出 GSC Performance + Coverage**（用户操作）：Query contains "stable track" → PAGES，验证承载页是否出现 `/balance-bike-stability/`；同时看 indexed 数是否离开 14/271 平台期、stability 是否离开 Discovered 池。
2. **更新 seo:health 的 sitemap 基线常量 247 → 266**（一行代码；今后批量发布后同步）。
3. （可选）后端 sitemap 生成器为 10 个静态路由补 lastmod。
4. 维持 IndexNow 增量提交节奏：本批 266 条已于 10-19 19:46 提交（快照 updatedAt 可证），key 文件在线 200。
5. 前站主 spam URL（panties/fashion-models-directory.php）Bing 索引第 11 天仍在，线上 404 不变；可继续在 Bing 后台提交删除请求（低优先，无自操通道）。

## 7. 运行留档（方法与原始数据）

- 环境约束（承接 r1~r10，本运行再次确认）：WebSearch 忽略 `site:`；Bing `site:` 经 WebFetch 被替换为罐头垃圾（本次 budget→CATIA 垃圾、stability→Windows 垃圾）；全域对照有效（第 4 次连续有效）。
- 原始数据：live sitemap 266 URL / 266 priority / 256 lastmod / 两新页在列；19 条新 URL 全 200；两资产页 200 + `index,follow,max-image-preview:large` + 自指 canonical + 标题正确（"Budget Balance Bike: Cheap Picks That Last" / "Stable Track Balance Bike: Track Width"）；IndexNow key 200；seo:health 97/100。
- 未修改任何站点代码；工作树仅新增本目录下中英双语文档。
