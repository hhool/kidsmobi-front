# 收录核查与 "stable track" 迁移评估 — 2026-10-18

> 关联：`doc/gsc-2026-10-15-stable-track_zh.md`（stable-track 基准导出）、`doc/stable-track-query-resolution_zh.md`（修复方案）、`doc/seo-weekly-2026-10-16_zh.md`（周健康基线）
> 性质：只读核查 + 文档，未改动任何站点代码。

## 0. 结论速览

| 核查项 | 结果 |
|---|---|
| `/balance-bike-budget/` 线上状态 | ✅ 200，`index,follow`，canonical 正确 |
| `/balance-bike-stability/` 线上状态 | ✅ 200，`index,follow`，canonical 正确，H1 含 "stable track balance bike" |
| 两页是否已被 Bing/Google 收录 | ⚠️ **本环境无法可靠验证**（搜索引擎查询被网络层拦截，详见 §1）——需 GSC / 正常网络 site: 确认 |
| sitemap.xml | ✅ 200 + `application/xml` + **247 条** + 含两新页 + lastmod 新鲜（2026-10-16）——**Worker 拦截未复发**；⚠️ 无 `<priority>`（格式偏差，见 §2） |
| `npm run seo:health` | ✅ **100/100**（14/14 通过） |
| stable-track 承载页迁移 | ⏳ 未证实。10-15 基准仍是 `/` + `/products/balance-bikes/`；无新导出，需等 GSC（滞后 2-3 天，10-19~20 复查） |
| GSC Page indexing「Validation failed」 | ⏳ 无新截图/导出，无法确认是否转通过 |

## 1. 收录核查（Bing 优先）— 环境受限，未能取得直接证据

本任务的预设路径（网页搜索 `site:` 两页）在当前沙箱**全部被网络层干扰**，逐条记录：

| 渠道 | 结果 | 可用性 |
|---|---|---|
| WebSearch `site:balancebiketoddler.com/balance-bike-budget/` | 返回 5 条**其他站点**的平衡车文章（peggyomara、trekbikesblog 等），无一条本站 | ❌ 不支持 site: 运算符 |
| WebSearch `site:balancebiketoddler.com/balance-bike-stability/` | 同上，全是外站 | ❌ |
| curl Bing（www→cn.bing.com）HTML | 结果与查询完全无关（百度知道/知乎软件话题），疑似查询级伪装响应 | ❌ 结果被污染 |
| curl Bing `format=rss` | 同样返回无关中文页面（site: 查询不可能返回百度知道） | ❌ |
| Seznam `site:.../balance-bike-budget/` | 返回 `/`、`/products/balance-bikes/`、`/about` 三页 | ⚠️ 见下方对照实验 |
| Seznam 对照实验（`site:.../balance-bike-size-chart/`，肯定已收录的老页） | **返回同样三页**，不含 size-chart | ❌ 证明其 site: 路径过滤在本客户端无效，上述三页只是域名顶级页 |
| DuckDuckGo / Brave / Yahoo / Startpage | 连接失败（HTTP 000） | ❌ |
| Mojeek | 403 | ❌ |
| Yandex | 302（验证码/重定向） | ❌ |
| Wayback Machine（archive.org） | 连接超时 | ❌ |

**间接证据（均正面）：**

- 两页线上均 200，`<meta name="robots" content="index,follow,max-image-preview:large">`，canonical 指向自身，无 noindex/noarchive 拦截。
- 两页均在线上 sitemap.xml 的 247 条 URL 中（§2）。
- IndexNow 增量提交快照 `scripts/seo/.last-indexnow.json`（updatedAt **2026-10-15T16:18:44Z**）含全部 247 条，**包括两新页**——即 10-15 已向 IndexNow/Bing/Yandex/Seznam 提交过这两条 URL。
- IndexNow 密钥文件 `dfb12ac97ad4a34c75ccf6cc4b783c7f.txt` → 200（提交通道健康）。
- 10-16 周健康检查 100/100，`/balance-bike-stability/` 的关键元数据（title/desc/keywords/canonical/JSON-LD）全部在位。
- Semrush 10-16 站点审计：sitemap 200、XML 合法、247 页全部 200、0 error。

**结论：** 可确认"可抓取、已提交、无拦截"，但"是否已被索引"无法从本环境证实。按任务预设的降级逻辑本应以 Bing site: 为准——该渠道在本环境被污染，**不作判断**。权威答案需：① GSC URL Inspection（数据滞后 2-3 天，用户 10-16 的 Request Indexing 预计 **10-19~20** 才反映）；② 用户在正常网络执行 `site:balancebiketoddler.com/balance-bike-budget/` 与 `site:balancebiketoddler.com/balance-bike-stability/`。

## 2. sitemap 自检 — 新鲜度已修复，一处格式偏差

抓取方式：`curl --noproxy '*' https://balancebiketoddler.com/sitemap.xml`（无 query、无 cache-buster）。

| 检查项 | 预期 | 实测 | 判定 |
|---|---|---|---|
| HTTP 状态 | 200 | 200 | ✅ |
| Content-Type | application/xml | `application/xml; charset=utf-8` | ✅ |
| URL 条数 | 247 | **247**（与 `SITEMAP_BASELINE_COUNT=247` 一致，delta 0） | ✅ |
| 含 balance-bike-budget | 是 | 是 | ✅ |
| 含 balance-bike-stability | 是 | 是 | ✅ |
| 非 260 条旧格式 / 非 JSON / 非 404 | — | 最新 lastmod = **2026-10-16T12:22:46.520Z**，237/247 条带 lastmod | ✅ **Worker 拦截未复发、边缘缓存不陈旧** |
| 含 `<priority>` | 是 | **0/247 条含 priority** | ⚠️ 偏差，见下 |

**关于 `<priority>` 缺失的分析：**

- 仓库的 prerender 生成器（`scripts/prerender-pages.ts`，`sitemapPriority()`）对**每条** URL 都输出 `<priority>`（资产页 0.9、balance-bike-* 0.8、平衡车详情 0.6 等）——本地 `dist/sitemap.xml`（10-17 01:58 构建）可证。
- 线上版格式是紧凑单行、home 带 lastmod 而 dist 版 home 不带（仓库生成器 `/` 路由键名 bug），且全无 priority——**线上 sitemap 由后端 Worker 的 D1 生成器产出，不是 Pages 静态文件**。按代码注释，Worker 主生成 + Pages 文件兜底本就是设计架构（"The API worker uses this Pages-hosted file as a zero-D1 fallback"）。
- 影响评估：**低**。Google 官方明确 `<priority>` 是弱提示，基本不影响抓取/排名；10-16 Semrush 全量爬取 247/247 OK 也证明无抓取障碍。10-15 的"旧格式"警报条件是 JSON/404/260 条——均未出现，**不需要按告警处理**。
- 若要对齐格式（可选，属后端 Worker 仓库，不在本 front 仓库）：给 Worker 的 sitemap 生成器补 priority 分层，或让 `/sitemap.xml` 干净路径直接返回 Pages 静态文件。

**附带记录（非新问题）：** 10 条 URL 无 lastmod，全部是资产/透明页（budget、by-age、safety-standards、size-chart、stability、weight、what-buyers-say、recalls、review-count-integrity、search-data）。仓库生成器对这些路由同样不写 lastmod，属既成设计。

## 3. 健康检查（可选体检，已执行）

`node scripts/seo/site-health-check.mjs`（即 `npm run seo:health`，沙箱出站网络正常，无需重试）：

```
SCORE: 100/100  (pass 14, warn 0, fail 0 of 14)
```

robots.txt（200，含 Sitemap: 与 User-agent: *）、sitemap.xml（247，delta 0）、11 个关键页元数据（含 `/balance-bike-stability/`）、llms.txt（1137B）、内链抽样 15 条 0 断裂——全部通过。与 10-16 周报一致，无回归。

小建议（本仓库内可做）：`site-health-check.mjs` 的 `KEY_URLS` 已含 `/balance-bike-stability/`，但**未含** `/balance-bike-budget/`；下轮周检前把 budget 页加进清单，让新页元数据进入每周自动监控。

## 4. "stable track" 承载页迁移评估

**本任务未附新的 GSC "Performance on Search" 导出**，按预设降级逻辑本应以 Bing site: 收录为准——该渠道在本环境不可用（§1）。因此迁移状态**未证实**，以 10-15 基准 + 时间线推断：

- **10-15 基准（最近一次有效数据）：** 承载页仅 `/products/balance-bikes/`（5 展现，均位 11.8）+ `/`（1 展现，位 14）；`/balance-bike-stability/` **未出现**在 Pages 列表。
- **10-15 之后的利好变化：** ① sitemap 干净路径修复 +  purge 复验工作流上线（10-15/16，§2 证实已生效）；② IndexNow 增量重推含两新页（10-15 16:18 快照）；③ 用户 10-16 在 GSC 对 budget+stability 点了 Request Indexing；④ stability 页的标题/H1/锚文本精确化修复（`5410fbf`）在 10-15 导出前已上线。
- **判断：** 上述条件足以让 Google 重新评估该资产，但归因迁移（Hub → 资产）需要 GSC 数据证实。**GSC 滞后 2-3 天 → 10-19~20 复查**：Performance → Query contains `stable track` → **PAGES** 页签，看 `/balance-bike-stability/` 是否开始出现。
- 若届时仍停在 Hub：按 `stable-track-query-resolution` 的后续选项，考虑把 Hub 的稳定性别段改为指向资产的摘要 + 链接，或给首页加一条正文内链（目前首页也只有 footer 链接）。
- 量级告诫（沿用 10-15）：该词簇 24h 仅 6 展现，属噪音级，勿过度优化；大盘仍是 toddler / by-age（94.7% 需求）。

## 5. GSC Page indexing 背景（2026-10-16 已知，未重查）

- **良性、无需处理：** 图1「Alternate page with proper canonical tag」= 9 页、图2「Page with redirect」= 4 页——currency / www / 下划线（`/products/balance_bike` → 301）/ guide 变体均已正确 canonical 或 301 去重，10-13 分析已实测确认行为正确，重复行会自然消退。
- **唯一遗留关注点：** 图2顶部「**Validation failed（10/11→10/13）**」。用户已于 10-16 手动重点 VALIDATE FIX，但**本任务未附新的 GSC 截图/导出，无法确认是否已转为通过**。下次用户提供新 Page indexing 截图时核对；若仍失败：再点一次 VALIDATE FIX（validation 周期通常数天），或排查那 4 个 redirect 变体的 301 链是否最终落地规范版。

## 6. 下一步建议（按优先级）

1. **10-19~20**：GSC URL Inspection 分别检查 `/balance-bike-budget/` 与 `/balance-bike-stability/` 的收录状态；同时导出一份 Performance（Query contains `stable track` → PAGES）验证承载页是否开始迁移。
2. **正常网络环境**：执行 `site:balancebiketoddler.com/balance-bike-budget/` 与 `site:balancebiketoddler.com/balance-bike-stability/`，补上本环境被阻断的 Bing 收录直接证据。
3. **（后端，可选）** Worker sitemap 生成器补 `<priority>` 分层，或让干净路径直接返回 Pages 版 sitemap——低优先级，Google 基本忽略该字段。
4. **（本仓库，可选）** 把 `/balance-bike-budget/` 加进 `site-health-check.mjs` 的 `KEY_URLS`。
5. **GSC 截图更新时**：核对「Validation failed」是否转通过；未转则重点一次或排查 redirect 变体链。
