# 每周 SEO 健康检查 — 2026-10-23

**站点：** balancebiketoddler.com
**运行类型：** 内容缺口 + 站点卫生扫描（非排名追踪）
**生成时间：** 2026-10-23 09:02 GMT+8

> 真实的需求/供给信号请配合 Google Search Console 使用。
> 本报告只发现*缺口与卫生回归*，不包含排名数据。

## 1. 健康评分 — 100 / 100（PASS）

| 指标 | 结果 |
|---|---|
| 检查项 | 共 17 项 |
| 通过 | 17 |
| 警告 | 0 |
| 失败 | 0 |
| 评分 | **100 / 100** |

### 逐项明细
- **robots.txt** — 通过（200，已声明 sitemap，含通配 UA）
- **sitemap.xml** — 通过，**273 个 URL**（基线 270，差值 **+3** — 正常内容增长，未触发大幅漂移告警）
- **关键页 meta** — 通过，所有抽样页均完整：
  `/`、`/products`、`/reviews`、`/guides`、`/news`、`/about`、
  `/balance-bike-stability/`、`/balance-bike-budget/`、`/balance-bike-what-buyers-say/`、
  `/transparency/testing-methodology/`、`/transparency/certification-lab-notes/`
  （title / description / keywords / canonical / JSON-LD）
- **prerender-meta-ownership** — 通过，10 个嵌套路由各自输出 title + canonical
- **bare-app-roots-reachable** — 通过，4 个根路由 × 2 种形式均返回 200（精确 `_redirects` 重写至 `/`）
- **llms.txt** — 通过，1137 字节
- **internal-links** — 通过，抽样 15 条，0 条失效

### 失败项
无。本周无需具体修复。

## 2. 关键词机会

- **扫描页面：** 273
- **未覆盖的查询簇（内容缺口）：** **0** — 10 个高价值查询簇全部覆盖。
- **弱页面（缺失 keywords meta 或 title 过短）：** **0**

### 近期 3 项关注点（无缺口，以下为维护/警戒项）
1. **按年龄意图的深度** — by-age 是主导搜索意图且已全覆盖，但体量最大。在扩展其他旁支簇之前，持续补充年龄细分内容（18个月 / 2岁 / 3岁 / 4岁）。
2. **继续排除 "electric" 簇** — 本周依旧正确排除；电动*汽车* ≠ 电动*平衡车*，任何 electric 类查询都是陷阱，应留在不做清单中。
3. **守护 prerender 关键词输出** — 本周 273 页的 keyword `<meta>` 均完好，无回归。若后续扫描出现缺失 `keywords` meta 的弱页面，说明 prerender 输出回归 → 运行 `npm run check:spakeywords`。

> 品牌长尾（Strider/woom/kidvelo）已覆盖，但**不**作为独立页面的优先项 — 维持现状。

## 3. 内容 / 收录态势

- **抓取 / 重新抓取 / 收录：** 未发现问题。robots.txt 格式正确，sitemap 新鲜且仅小幅增长（+3）在正常范围，内链干净。
- **prerender 关键词 meta：** 扫描页 100% 完好 → 本周无需触发 `npm run check:spakeywords`。
- **llms.txt：** 存在（1137 B）— GEO 层面健康。

## 基线维护
- `scripts/seo/config.mjs` 中的 `SITEMAP_BASELINE_COUNT` 已从 **270 → 273** 对齐线上值，避免漂移累积。

## 结论
全面绿灯。除例行监控外无待办项。下周重跑；在投入新内容簇前先以 GSC 验证需求。
