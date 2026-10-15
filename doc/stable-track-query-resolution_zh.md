# 「stable track」查询归属：定位与修复

## 背景
2026-10-13 的 GSC 分析留下一个未决动作：确认全站唯一能排进前 20 的查询主题 `stable track` 究竟由哪个 URL 承载。
2026-10-15 的 GSC 截图（效果 → 查询含 `stable track` → **PAGES** 页签，近 24 小时）给出了答案。

## 证据

| 页面 | 点击 | 展现 |
|---|---|---|
| `https://balancebiketoddler.com/` | 0 | 1 |
| `https://balancebiketoddler.com/products/balance-bikes/` | 0 | 5 |

「1-2 of 2」——这两页是**唯一**承载该查询的页面。专门为此建的资产 `/balance-bike-stability/` **完全没有出现**。

## 结论
不是「内耗」（没有多页抢同一主题），而是**专用资产没被识别**：通用页（首页 + 品类 Hub）在吃这个词，专用资产反而没排上。

## 三个具体缺口与修复

### 1. 资产 `<title>` / `<h1>` 不含精确短语
- 原标题 74 字符，被 `capSeoTitle()` 截断为 `Balance Bike Stability: Track Width, Wheel | BalanceBikeToddler`（断在 "Wheel"）。
- 改为 `Stable Track Balance Bike: Track Width`（59 字符含品牌后缀，不再截断）。
- H1 由 "What makes a balance bike stable — …" 改为 "What makes a **stable track balance bike** — …"。

### 2. 内链锚文本是泛化的
- 原锚 "Stability and track width"（预渲染 `REFERENCE_ASSETS` 与 React `ReferenceClusterNav` 两处各自一份）。
- 两处均改为精确锚 **"Stable track balance bike"**（该内链出现在 7 个资产页 + 平衡车详情页 + Hub）。
- **站点级 footer 的锚文本刻意保持泛化**（`Stability & track width`），避免全站精确锚造成过度优化。

### 3. ⚠️ 最严重：Hub 的内链在客户端水合时被抹掉
- Hub 的静态 HTML **有**这条内链（`clusterNavHtml()` 写在 hub body 里）。
- 但 SPA 的 Hub 分支（`App.tsx` 中 `activeTab === "products"`）**从不渲染** `ReferenceClusterNav`。
- 而应用入口用 `createRoot().render()`（**不是** `hydrateRoot`）→ 水合会**清空并重建** `#root` 内的预渲染 DOM。
- 结果：Google 渲染 JS 后，Hub 上指向资产的正文内链**消失**，只剩站点级 footer 链接（信号弱）。
- 修复：在 SPA Hub 分支补渲染 `<ReferenceClusterNav lang={lang} />`，与预渲染输出对齐。

## 验收
- `npm run lint` 干净。
- `seo:check`（exit 0）、`check:titles`（247 页，无截断/悬空）、`check:spatitles`（14 页 SPA/prerender 一致）、`check:spakeywords`（247 页，0 缺失 / 0 不一致）全部通过。
- 构建基线正常：3 guide + 4 news + 31 review 详情页，`sitemap.xml` 246 URL。
- dist 实测：资产 `<title>` / `<h1>` 含精确短语；Hub 正文内链锚为 `Stable track balance bike`。

## 后续可选
- 首页目前同样只有 footer 链接指向该资产；若后续首页仍在吃该查询，可再加一条正文内链。
- 下次 GSC 复查（2026-11-15）时，用 **PAGES + Query contains `stable track`** 复核承载 URL 是否已从 Hub 迁移到资产；若仍停在 Hub，则考虑把 Hub 的稳定性别段整段改为指向资产的摘要 + 链接。
