# GSC 数据复查 — 2026-10-15 "stable track" 专项导出

> 关联：`doc/gsc-2026-10-13-analysis_zh.md`（动作 #2 的答复）、`doc/stable-track-query-resolution_zh.md`

## 1. 数据来源

- 文件：`balancebiketoddler.com-Performance-on-Search-2026-10-15.zip` / `(1).zip` / `(2).zip`
  — 用户原始 @ 了 2 份，实际 Downloads 中存在 **3 份**（含 `(2)`），**内容完全一致**（重复下载）。
- 过滤条件（`Filters.csv`）：Search type = Web (text-based)；Time range = Last 24 hours；Query = **+stable track**。
- 性质：**带过滤条件的专项导出**，不是全站导出。本窗口另有 GSC 截图显示 1 条 `balance bikes for toddlers`(1 展现)，但那不在这些 zip 内。

## 2. 查询结果（`Queries.csv`）— 5 条，全部 0 点击

| Query | Clicks | Impr | CTR | Pos |
|---|---|---|---|---|
| lightweight stable track balance bike | 0 | 2 | 0% | 12.5 |
| safety features stable track kids balance bike | 0 | 1 | 0% | 10 |
| reliable stable track balance bike | 0 | 1 | 0% | 12 |
| sturdy stable track balance bike | 0 | 1 | 0% | 12 |
| safe stable track balance bike | 0 | 1 | 0% | 14 |

合计 **6 展现 / 0 点击 / 排名 10–14.5**（Google 第 2 页）。全部为 "stable track" + 平衡车修饰词（lightweight / reliable / sturdy / safe / safety features）。

## 3. 承载页（`Pages.csv`）— 仅 2 页

| Page | Clicks | Impr | CTR | Pos |
|---|---|---|---|---|
| `https://balancebiketoddler.com/products/balance-bikes/` | 0 | 5 | 0% | 11.8 |
| `https://balancebiketoddler.com/` | 0 | 1 | 0% | 14 |

⚠️ **`/balance-bike-stability/` 专用资产页完全没出现在 Pages 列表** —— 直接印证 item 3「这个页面路径未提交 gsc 动作」。承载 "stable track" 词簇的是**通用页**（平衡车 Hub + 首页），不是为它建的专用资产。

## 4. 地域（`Countries.csv`）— 6 国各 1 展现

Brazil / Argentina / Burkina Faso / Iraq / Spain / Bangladesh 各 1 展现。说明这些展现是**零散长尾、无地理集聚**，量级在地板上（24h 仅 6 展现）。

## 5. 诊断

1. **排名太深是 0 点击的根因（非独立问题）**：词簇平均排名 10–14.5（第 2 页），即使承接页 Hub 也在第 2 页，专用资产只会更深或尚未进入前 20。与 10-13 结论一致（US 平均排名 ~52，0 点击是排名深度的症状）。
2. **资产未被 Google 关联到该词簇**：尽管 `5410fbf` 已把资产标题 / H1 / 锚文本精确化为 "stable track balance bike" 并修复 SPA Hub 内链，GSC 的 Pages 归因仍只认通用页。原因：内链权重 + 排名深度需要时间传递；且 sitemap 陈旧（见下）让 Google 抓到的资产信息滞后。
3. **Sitemap 陈旧（本次会话新发现，关键阻塞）**：
   - 不带 cache-buster 请求 `sitemap.xml` → 返回 **260 条**、**无** `balance-bike-budget`；
   - 带 `?cb=` cache-buster → 返回 **247 条**、**含** `balance-bike-budget`。
   - 即 Cloudflare zone 缓存把**旧版 sitemap**（部署 `929981a` 之前）持续回给普通请求；Google 抓 sitemap 不带 buster → 拿到陈旧版 → **发现不到新资产 / 更新**。
   - 根因：自动 purge workflow 因缺 `CLOUDFLARE_ZONE_ID` / `CLOUDFLARE_API_TOKEN` secrets 仍被跳过（10-13 已记），未配置期间须**手动 Purge Everything**。

## 6. 已采取 / 待办

- ✅ 已做（`5410fbf`）：资产标题 `Stable Track Balance Bike: Track Width`、H1 含精确短语、参考簇锚精确化、SPA Hub 补渲染 `ReferenceClusterNav` 内链。
- ⏳ **关键待办**：发版后**手动 Purge Everything**（或至少 purge `sitemap.xml` 与资产路径），让 Google 重新抓取新鲜 sitemap 与更新页。
- ⏳ 待办：新鲜 sitemap 上线后跑 IndexNow 增量提交（`budget` + `stability` 两条资产）。
- 👀 监测：词簇在第 2 页（10–14），需爬到 <10 才有点击；内容已就位，杠杆 = 抓取新鲜度 + 内链权重 + 页面精确短语密度。
- 📉 量级告诫：24h 仅 6 展现，属噪音级，**勿过度优化**。真正大盘仍是 "toddler / by age"（占需求 94.7%，本窗口仅 1 次展现）。

## 7. 与 10-13 分析的关系

本数据**回答**了 `gsc-2026-10-13-analysis` 的「动作 #2」：在 GSC **Pages** 页签筛 `stable track`，承载 URL = `/products/balance-bikes/` + `/`（非 `/balance-bike-stability/`）。结论 = **强化而非合并**（专用资产确实没被识别，非内耗）。`stable-track-query-resolution` 的修复方向正确，但归因生效依赖抓取新鲜度（见 §5.3）。
