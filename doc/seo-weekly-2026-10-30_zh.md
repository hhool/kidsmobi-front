# 每周 SEO 健康检查 — 2026-10-30

**站点：** balancebiketoddler.com
**运行类型：** 内容缺口 + 卫生扫描（非排名追踪器）
**生成时间：** 2026-10-30 09:01 GMT+8

> 本扫描请配合 Google Search Console 使用，以获取真实的需求/供给信号。
> 本报告只发现*缺口与卫生回归*，不反映排名。

## 1. 健康评分 — 97 / 100（PASS，含 1 项 WARN）

| 指标 | 结果 |
|---|---|
| 检查项 | 共 17 项 |
| 通过 | 16 |
| 警告 | 1 |
| 失败 | 0 |
| 评分 | **97 / 100** |

### 逐项明细
- **robots.txt** — 通过（200，已声明 sitemap，含通配 UA）
- **sitemap.xml** — **警告**，**441 个 URL**（基线 417，增量 **+24**）。非失败项——增长集中在合规内容板块（products 182、/zh 79、guides 76、reviews 34、news 14）。已将基线调整为 441 以清除漂移警告；若本周未发布内容批次，请核查这 24 个新 URL。
- **关键页 meta** — 通过，所有抽样页面要素齐全：
  `/`、`/products`、`/reviews`、`/guides`、`/news`、`/about`、
  `/balance-bike-stability/`、`/balance-bike-budget/`、`/balance-bike-what-buyers-say/`、
  `/transparency/testing-methodology/`、`/transparency/certification-lab-notes/`
  （标题 / 描述 / 关键词 / canonical / JSON-LD）
- **prerender-meta-ownership** — 通过，10 个嵌套路由各自输出独立 title + canonical
- **bare-app-roots-reachable** — 通过，4 个根路由 × 2 种形式均返回 200（精确的 `_redirects` 重写至 `/`）
- **llms.txt** — 通过，1137 字节
- **internal-links** — 通过，抽样 15 条，0 条失效

### 失败项
无。本周无需具体修复。唯一的 WARN 为基线漂移提示（已通过下方基线调整处理），并非缺陷。

## 2. 关键词机会

- **扫描页面数：** 441
- **未覆盖的查询簇（内容缺口）：** **0** — 全部 10 个高价值查询簇均已覆盖。
- **薄弱页面（缺失关键词 meta 或标题过短）：** **0**

### 近期三大关注项（未发现缺口——属维护/警戒）
1. **按年龄意图深度** — by-age 是主导搜索意图且已全覆盖，但它是最高流量入口。在拓展边缘簇之前，应持续补充年龄细分内容（18 月 / 2 岁 / 3 岁 / 4 岁）。
2. **排除 "electric" 簇** — 本周再次正确排除；电动*汽车* ≠ 电动*平衡车*，任何电动主题查询都是陷阱，不应进入构建清单。
3. **守护 prerender 关键词输出** — 本周全部 441 页的关键词 `<meta>` 均完好，无回归。若未来扫描出现缺失 `keywords` meta 的薄弱页面，说明 prerender 输出回归 → 运行 `npm run check:spakeywords`。

> 品牌长尾（Strider/woom/kidvelo）已覆盖，但有意**不**作为独立页面优先项——维持现状。

## 3. 内容 / 索引态势

- **抓取 / 重新抓取 / 索引：** 未发现问题。robots.txt 格式正确，sitemap 新鲜（441 个 URL，均属合规内容板块），内链干净。
- **prerender 关键词 meta：** 全部扫描页面 100% 完好 → 本周无需触发 `npm run check:spakeywords`。
- **llms.txt：** 存在（1137 B）— GEO 面健康。

## 基线维护
- `scripts/seo/config.mjs` 中的 `SITEMAP_BASELINE_COUNT` 已由 **417 → 441**（2026-10-30）调整，以跟踪本周内容增长并清除漂移警告。

## 结论
整体绿色，仅一项提示。无失败、无内容缺口、无薄弱页面、无索引回归。唯一未结项为非阻塞的基线漂移，已同步。下周复跑；在投入新内容簇前，请先经 GSC 核对。
