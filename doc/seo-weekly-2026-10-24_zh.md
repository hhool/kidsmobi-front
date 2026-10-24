# 每周 SEO 健康检查 — 2026-10-24

**站点：** balancebiketoddler.com
**运行类型：** 内容缺口 + 基础健康扫描（**非**排名追踪器）
**生成时间：** 2026-10-24 22:56 GMT+8

> 请将本扫描与 Google Search Console 搭配使用，以获取真实的需求/供给信号。
> 本报告只发现*缺口与健康度回退*，不包含排名数据。

## 1. 健康评分 — 100 / 100（通过）

| 指标 | 结果 |
|---|---|
| 检查项 | 共 17 项 |
| 通过 | 17 |
| 警告 | 0 |
| 失败 | 0 |
| 评分 | **100 / 100** |

### 逐项详情
- **robots.txt** — 通过（200，已声明 Sitemap，含通配 UA）
- **sitemap.xml** — 通过，**417 个 URL**（基准 417，偏差 **0** — 完全同步，无漂移）
- **关键页元信息** — 通过，所有抽样页面均完整包含：
  `/`、`/products`、`/reviews`、`/guides`、`/news`、`/about`、
  `/balance-bike-stability/`、`/balance-bike-budget/`、`/balance-bike-what-buyers-say/`、
  `/transparency/testing-methodology/`、`/transparency/certification-lab-notes/`
  （title / description / keywords / canonical / JSON-LD）
- **prerender 元信息归属** — 通过，10 个嵌套路由各自返回独立的 title + canonical
- **裸应用根路径可达性** — 通过，4 个根路径 × 2 种形式均返回 200（`_redirects` 精确重写至 `/`）
- **llms.txt** — 通过，1137 字节
- **内部链接** — 通过，抽样 15 个，0 个失效

### 失败项
无。本周无需任何具体修复。

## 2. 关键词机会

- **扫描页面数：** 417
- **未覆盖的查询簇（内容缺口）：** **0** — 全部 10 个高价值查询簇均已覆盖。
- **弱页面（缺失 keywords 元信息或 title 过短）：** **0**

### 三项近期关注点（未现缺口 — 属维护/警戒项）
1. **按年龄的意图深度** — 按年龄是最主要的搜索意图，目前完全覆盖，但也是流量最大的入口。在扩展周边簇之前，应持续补充年龄细分内容（18 个月 / 2 岁 / 3 岁 / 4 岁）。
2. **排除「电动」簇** — 本周再次正确排除；电动*汽车* ≠ 电动*平衡车*，凡电动相关查询均为陷阱，不纳入建设清单。
3. **守护 prerender 关键词输出** — 本周全部 417 个页面的 keywords `<meta>` 均完好，无回退。若将来扫描出现缺失 `keywords` 元信息的弱页面，说明 prerender 输出出现回退 → 运行 `npm run check:spakeywords`。

> 品牌长尾（Strider/woom/kidvelo）虽已覆盖，但**不**作为独立页面的优先项 — 维持现状。

## 3. 内容 / 索引态势

- **抓取 / 重新抓取 / 索引：** 未发现问题。robots.txt 格式正确，sitemap 新鲜且与基准完全一致（417 / 偏差 0），内部链接干净。
- **prerender 关键词元信息：** 100% 扫描页面均完好 → 本周无需触发 `npm run check:spakeywords`。
- **llms.txt：** 存在（1137 B）— GEO 露出面健康。

## 基准维护
- `scripts/seo/config.mjs` 中的 `SITEMAP_BASELINE_COUNT` 已等于线上数量（417），本周无需调整。

## 结论
全面绿灯。除常规监控外无待办事项。下周再次运行；在承诺新建内容簇前，先到 GSC 核实。
