# GSC 阶段 A 行动清单 — 收录健康确认

> 配套文档：`gsc-indexing-simulation-2026-10-27_zh.md`（模拟覆盖分桶报告）。
> 本清单只覆盖 **A 阶段**：用真实 GSC 数据确认「5 主词 hub + toddler-electric-car 场景页 + sitemap 修复」上线后的收录健康。
> 执行分工：**本清单的 URL 与 triage 表由我生成 / 线上已实测**；**sitemap 刷新、Request indexing、读 Page indexing 面板由你在 GSC 后台手动操作**。

---

## 1. 目标

- 确认重建后线上 sitemap 干净（已离线复核：**441/441 全部 200，0×3xx、0×4xx**）。
- 把 6 个新建主词页推给 Google 抓取/收录（Request indexing）。
- 在 GSC「Page indexing」核对真实状态，对照模拟报告验证 P1 修复效果（原 16 条 301 不再出现于 redirect）。

---

## 2. 刷新 Sitemap（你手动）

1. 打开 **Google Search Console → Indexing › Sitemaps**。
2. 在现有项上点 **⋯ → Refresh**（sitemap 文件名 `sitemap.xml`，完整 URL `https://balancebiketoddler.com/sitemap.xml`）。
3. 作用：给 Google 一个「有变化」信号，比等自动抓取快。无需改文件——sitemap 已干净。

---

## 3. Request indexing 清单（你手动，核心动作）

对以下 **6 条英文规范 URL** 逐个：
1. 把 URL 粘进 GSC 顶部搜索框 → 等加载。
2. 确认显示 **“URL is on Google”** 或 “URL is not on Google”。
3. 仅当显示“not on Google”或想加速时，点 **Request indexing**（已收录的别重复点，浪费配额）。

> 配额：单属性每天“请求收录”约限几十次，6 条完全够。建议**只提交这 6 条英文规范 URL**，把配额留给最该排名的主词页；`/zh` 变体交给 sitemap 自然发现（sitemap 里另有 26 条 `/zh/guides/...` best/scenario 变体，勿浪费配额）。

```
https://balancebiketoddler.com/guides/best/best-balance-bike-2026
https://balancebiketoddler.com/guides/best/best-double-stroller-2026
https://balancebiketoddler.com/guides/best/best-jogger-stroller-2026
https://balancebiketoddler.com/guides/best/best-travel-stroller-2026
https://balancebiketoddler.com/guides/best/best-electric-car-for-kids-2026
https://balancebiketoddler.com/guides/scenario/toddler-electric-car
```

> 注：hub 真实规范路径是 `/guides/best/` 与 `/guides/scenario/`（**不是**根目录 `/best-…`）。以上 6 条已线上实测 **200、无重定向**。

---

## 4. Page indexing 状态 Triage 表（你读面板，按此处置）

路径：**GSC → Indexing › Pages**。把真实数字按下表归类：

| GSC 状态 | 含义 | 处置 |
|---|---|---|
| **Valid**（绿） | 已收录、规范 | 健康，记录基线 |
| **Page with redirect** | 重定向中 | 多半**良性**（http→https / www→非 www / 下划线→连字符 / currency 剥离）。核对是否仅这几类，无循环 / 错目标 |
| **Discovered – currently not indexed** | 已发现未抓取 | 新页常态；靠内链加权（#228）+ sitemap 拉，等几天 |
| **Crawled – currently not indexed** | 已抓未收录 | 质量 / 重复信号；查内容是否过薄、canonical 是否指错 |
| **Excluded by ‘noindex’** | 被 noindex | 查是否误泄漏（不该 noindex 的页） |
| **Soft 404** | 软 404 | 重点查 `/zh` 未翻译页的 soft-404 处理是否干净 |
| **Alternate page with canonical tag** | 有 canonical 副本 | 确认 canonical 指向预期（en 主版），hreflang 互指正确 |

---

## 5. 必核项：wagon / playard 产品集群（P1 修复的直接证据）

模拟报告里的 **16 条曾经 301 的产品 URL**（wagons + playards，原由 Worker 解析漂移导致 301 到 `/products/kids-tricycles/`），部署后现已稳定在该路径下。请在 GSC「Page indexing」**抽样确认它们不再出现在 “Page with redirect”**，应显示 **Valid**。

线上 sitemap 当前实际携带该集群 **20 条**（17 wagons + 3 playards）——比模拟估算的 16 多，应为目录增长；以线上为准：

```
https://balancebiketoddler.com/products/kids-tricycles/kids_pull_along_wagons-b084zglh27
https://balancebiketoddler.com/products/kids-tricycles/kids_pull_along_wagons-b08q1svprp
https://balancebiketoddler.com/products/kids-tricycles/kids_pull_along_wagons-b08vf98fss
https://balancebiketoddler.com/products/kids-tricycles/kids_pull_along_wagons-b09gj7hvfh
https://balancebiketoddler.com/products/kids-tricycles/kids_pull_along_wagons-b09hjtbqjf
https://balancebiketoddler.com/products/kids-tricycles/kids_pull_along_wagons-b0c5434m8d
https://balancebiketoddler.com/products/kids-tricycles/kids_pull_along_wagons-b0c5435km9
https://balancebiketoddler.com/products/kids-tricycles/kids_pull_along_wagons-b0clwwpdml
https://balancebiketoddler.com/products/kids-tricycles/kids_pull_along_wagons-b0djy3jh8d
https://balancebiketoddler.com/products/kids-tricycles/kids_pull_along_wagons-b0dxfg3954
https://balancebiketoddler.com/products/kids-tricycles/kids_pull_along_wagons-b0fcy4wm8m
https://balancebiketoddler.com/products/kids-tricycles/kids_pull_along_wagons-b0ffm5p1sf
https://balancebiketoddler.com/products/kids-tricycles/kids_pull_along_wagons-b0fqtztc84
https://balancebiketoddler.com/products/kids-tricycles/kids_pull_along_wagons-b0g1c38c3t
https://balancebiketoddler.com/products/kids-tricycles/kids_pull_along_wagons-b0g1zf9z63
https://balancebiketoddler.com/products/kids-tricycles/kids_pull_along_wagons-b0g2yvks6m
https://balancebiketoddler.com/products/kids-tricycles/kids_pull_along_wagons-b0gqxf73jz
https://balancebiketoddler.com/products/kids-tricycles/playard-b07964sfw4
https://balancebiketoddler.com/products/kids-tricycles/playard-b07wpw1yyc
https://balancebiketoddler.com/products/kids-tricycles/playard-b08bt16th5
```

---

## 6. 快照记录模板（4–6 周后对比用）

| 日期 | Valid | Page with redirect | Discovered-not-indexed | Crawled-not-indexed | noindex | Soft 404 | Alternate-canonical | 备注 |
|---|---|---|---|---|---|---|---|---|
| 2026-10-27（基线·离线复核） | 441 | 0 | — | — | — | 0 | — | sitemap 全 200 |
|  |  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |

---

## 7. 注意事项

- **良性重定向别误修**：http→https、www→非 www、下划线→连字符、currency 剥离这几类 301/308 是站点规范化的正常结果，GSC 显示 “Page with redirect” 不算问题。
- **`/zh` 未翻译页**：软 404 / 薄内容可能被 GSC 标记，建议顺带核（见阶段 D 国际化校验）。
- **transparency 旧 URL**：`/transparency/testing_methodology`（下划线）现已 301 到 `/transparency/testing-methodology/`（已随本阶段修复部署），GSC 应显示该旧 URL 为 redirect、新 URL 为 Valid。

---

## 8. 内部链接加权进度（#228，已执行 2026-10-27）

已通过 CMS 向 **23 篇** 同簇现有指南注入指向 6 个主词 hub 的上下文中链接（英文正文末段一句话回链，锚文本为各 hub 主词），分布：

| Hub | 注入篇数 | 目标指南（部分） |
|---|---|---|
| best-jogger-stroller-2026 | 4 | jogging / all-terrain / safety / under-200 |
| best-travel-stroller-2026 | 6 | travel-system / airplane / lightweight / compact / best-travel-3yo 等 |
| best-double-stroller-2026 | 3 | double / how-to-choose / newborn |
| best-balance-bike-2026 | 5 | by-age / size-chart / vs-training-wheels / maintenance / best-1yo |
| best-electric-car-for-kids-2026 | 5 | best-3 / remote / 12v-vs-24v / under-200 / best-24v-2seater |
| toddler-electric-car | 4 | weight / battery / tires / best-3 |

注入已入 live CMS（save 验证全部通过）。预渲染 HTML 待本提交触发的 CF Pages 重建后烘焙进静态页，供爬虫直接读取；SPA 运行时已可读取。重建后可在 Page indexing 观察各 hub 的「入站内链」信号增强。

## 7. 搜索结果图标（favicon）— 已修，待 Google 重抓

**问题**：`site:balancebiketoddler.com` 的结果全部显示 Google 默认灰色地球图标。

**根因（线上实测）**：
1. 站点唯一声明的图标是 `/favicon.svg`；Google 官方「搜索 favicon 支持格式」为 BMP / GIF / ICO / PNG / JPEG / PPM / TIFF，**不含 SVG**。
2. 根目录 `/favicon.ico` 返回 **404** —— 这是 Google 与所有旧浏览器探测 host 级图标时的兜底路径。
3. `apple-touch-icon` 与 `shortcut icon` 当时也指向 SVG（iOS 不解析）。

**已做（2026-10-27）**：由 `public/favicon.svg` 光栅化出 `favicon-48/96/144/192/512x512.png`（48 的倍数，符合 Google 尺寸规则）、`apple-touch-icon.png`(180)、多尺寸 `favicon.ico`(16/32/48)、`site.webmanifest`；`index.html` 与 prerender 模板双处声明 ICO + PNG + manifest；结构化数据 `Organization.logo` 改用 512 方图；`_headers` 显式固定 MIME。线上已验证：8 个资源全部 200、MIME 正确、Googlebot-Image 可抓。守卫 `npm run check:favicons` 已进 CI。

**你要做的**：
1. 在 GSC 对**首页**（`https://balancebiketoddler.com/`）执行 URL Inspection → **Request indexing**。Google 只在重抓首页时更新 host 级 favicon，抓其它页面无效。
2. 等 **几天到数周**（官方口径：数天到数周），再搜 `site:` 看图标是否出现。这一项**不会**在 Page indexing 报表里有任何体现，属于搜索外观，无法在 GSC 里主动查进度。
3. 若数周后仍未出现：检查是否仍为灰色地球 → 复核 `favicon.ico` 是否 200（`curl -I .../favicon.ico`）、是否被 CDN/代理改写 MIME。URL 一旦确定就**不要再改**（Google 要求 favicon URL 稳定）。

---

*本清单由 Agent 基于线上实测（hub 6/6 = 200、sitemap 441/441 = 200、transparency 301 已验证）生成；GSC 后台手动动作需本人操作。*
