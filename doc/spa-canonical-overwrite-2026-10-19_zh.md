# SPA 水合改写 canonical 导致 "Alternate page" — 2026-10-19

> 关联：`doc/gsc-coverage-2026-10-18-analysis_zh.md`（收录平台期诊断，行动项⑤）、`doc/cms-p2-hygiene-2026-10-19-closure_zh.md`（同日 CMS 数据卫生关闭）。
> 触发：用户提供 GSC「Page indexing → Alternate page with proper canonical tag」报告（Last update 10/12，Affected pages 4，示例 4 条 URL + 抓取日期）。
> 性质：根因定位 + 代码修复 + 守卫 + 线上复验。改动 front `3f01510`（已部署）。

## 0. 结论速览

GSC 报的 4 条 alternate 只是样本。实测发现一个**影响约 40 条 URL 的系统性 bug**：所有水合进栏目 tab（news/guides/reviews）但**不是栏目索引本身**的路由，canonical 都被 SPA 改写成栏目首页；transparency 页的 canonical 还被剥掉尾斜杠、指向一个 308 跳回的 URL。静态 HTML 一律自指正确——**两套渲染器自相矛盾，Google 渲染 JS 后采信了错的那个**。已修复并加守卫，线上 6 类路由复验全部自指。

## 1. GSC 报告原文要点

- 分组：Alternate page with proper canonical tag；First detected 10/5；Affected pages **4**；趋势 6→4→…→0（递减）。
- 示例（URL / 抓取日期）：
  1. `/guides/beginner/best-balance-bike-for-1-year-old` — Oct 14
  2. `/news/new_product` — Oct 11
  3. `/news/brand_news` — Oct 4
  4. `/transparency/privacy-policy/` — Sep 19

## 2. 取证过程

1. **静态侧无罪**：4 条 URL 的静态 HTML 全部 200 + 自指 canonical + `index,follow`，且都在 sitemap 里（规范形式本就如此）。
2. **变体侧干净**：news 连字符形式 404；无斜杠/尾斜杠变体 308 → 规范形。
3. **疑点转向 SPA**：入口是 `createRoot().render()`（非 hydrateRoot），水合后 SEO effect 会**改写** canonical 链接（`updateCanonicalLink` 直接 setAttribute href）。curl 只看得到静态 HTML，看不到水合后的值。
4. **代码定位**：`src/App.tsx` SEO effect 的栏目通用分支用 `buildCanonicalPathFromPageConfig(pageConfig, currentPath, …)` 定 canonical；线上 CMS settings **没有 `pages` 映射**（实测只有 `seo.{home,products,…}`）→ 落到 `DEFAULT_CMS_PAGE_BLUEPRINT`，其 `pageSlug`（news→"news"、guides→"guides"、reviews→"reviews"）被应用到**整个 tab 的所有路由**，而非仅栏目索引。transparency 分支则用 `normalizeCanonicalPath(localizedPage.path)`，把配置路径的尾斜杠剥掉。
5. **实证**：Playwright（系统 Chrome）加载 6 条代表性 URL，networkidle + 2.5s 后读 DOM：

| URL | 水合后 canonical（修复前） | 判定 |
|---|---|---|
| `/news/new_product` | `https://balancebiketoddler.com/news` | ✗ 被改写 |
| `/news/brand_news` | `…/news` | ✗ 被改写 |
| `/reviews/single/razor-a-kick-scooter-reviews-for-kids` | `…/reviews` | ✗ 被改写 |
| `/guides/beginner` | `…/guides` | ✗ 被改写 |
| `/transparency/privacy-policy/` | `…/transparency/privacy-policy`（无斜杠，308 跳回） | ✗ 被剥斜杠 |
| `/guides/beginner/best-balance-bike-for-1-year-old` | 自指 | ✓（`f0f5638` 文章分支已保护；GSC 的 Oct-14 抓取早于/恰逢该修复，属历史记录） |

## 3. 影响面（大于 GSC 样本）

- **Bug A（栏目 pageSlug 泛化）**：4 个 news 频道页 + guides 分类页 + `/reviews/<type>` ×5 + **31 条 review 详情页** ≈ **41 条 sitemap URL** 的水合 canonical 指向栏目首页。
- **Bug B（transparency 尾斜杠）**：全部 7 个 transparency 页（sitemap 中均为尾斜杠形式）。
- 连带损害：这些路由的 title/description/keywords 也被栏目首页值覆盖（news 频道页的 curated 标题如 "New Kids Bike & Stroller Launches" 水合后变成栏目标题）。

## 4. 修复（front `3f01510`）

单一真源模块 `src/lib/canonicalPath.ts`（App.tsx 改为导入）：

1. `buildCanonicalPathFromPageConfig`：pageSlug canonical **只作用于栏目索引根路径**；其余路径自指（分页保留 `/page/N`）。显式 `pageConfig.canonicalPath`（编辑 Consolidation，现无启用）仍优先。
2. `transparencyCanonicalPath`： transparency 页使用配置路径**原样**（保留尾斜杠）。
3. **频道页 TDK 保护**：news/guides/reviews 频道路由在水合时（判定条件：水合前那一刻的静态 canonical 仍匹配当前路径）直接跳过栏目 TDK 块，保留预渲染的 curated 值；客户端导航进频道（静态 canonical 属于上一个路径）维持原行为。
4. 新守卫 `npm run check:spacanonicals`：对 **247 条 sitemap 路由 + 别名/分页边界用例**，用同一共享函数重算 SPA canonical，并读取 dist 实际产出的 canonical，两侧相等才通过——本次 250 路由全部一致。这类 bug 此前能存活，是因为只有 title 有守卫（check:spatitles 只覆盖 6 个栏目索引），canonical 没有任何一致性检查。

## 5. 验证

- 构建：247 URL 基线不变；全部守卫绿（spacanonicals 250 / spatitles 28 / spakeywords 248 / titles 248 / claims 68 模式 0 / reviewcounts 0 / content / links 7416 hrefs / seo:check）。
- 线上（Pages 自动部署 + purge workflow 已完成）：Playwright 复测 6 条受影响路由**全部自指**（privacy-policy 保留尾斜杠），news/guides 频道页 curated 标题恢复；回归抽查产品 hub/详情/栏目索引/预算页/首页 canonical 均正确。`/products/other` 为边缘层真实 404（P0-2 既定行为，非回归）。
- 备注：本地 dist 与 CF 构建的 bundle hash 不同（构建环境差异，历史一贯）；判定线上版本以浏览器实测行为为准。

## 6. 给用户的 GSC 后续

1. 本组**无需点 "Done fixing?"**——这不是"修复后验证"场景，而是等 Google 复抓后自然消化（趋势本就在 6→4→…→0 递减）；修复已上线，复抓后这些 URL 会回到 "Crawled – currently not indexed" 或直接收录。
2. 若想加速，可对其中 2-3 条（如 `/news/new_product`）做 URL Inspection → Request Indexing（小批量，勿批量）。
3. 下次 Coverage 导出核对：本组数量应继续下降；收录总数 14 → 15/16 仍是主指标。

## 7. 留档

- Playwright 取证/复验脚本：`front/tmp/verify-hydrated-canonical.mjs`、`front/tmp/verify-canonical-regression.mjs`（tmp/ gitignore，仅本地）。
- 共享模块：`front/src/lib/canonicalPath.ts`；守卫：`front/scripts/check-spa-canonicals.ts`（`npm run check:spacanonicals`）。
