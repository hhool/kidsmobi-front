# 收录核查 & "stable track" 承载页迁移评估 — 2026-10-18 第 5 次运行（r5）

> 关联文档：`doc/gsc-2026-10-18-stable-track_zh.md`（今日第 1-2 次）、`doc/gsc-2026-10-18-stable-track-r3_zh.md`（第 3 次）、`doc/gsc-2026-10-18-stable-track-r4_zh.md`（第 4 次）、`doc/gsc-coverage-2026-10-18-analysis_zh.md`（并行会话的 GSC Coverage 深度分析）
> 性质：只读核查 + 文档记录，未改动任何站点代码。
> 运行窗口：2026-10-18 22:38-22:55（GMT+8），今日第 5 次自动运行；结论为上述文档的增量。

## 0. 结论速览

| 检查项 | 结果 |
|---|---|
| `/balance-bike-budget/` 线上状态 | ✅ 200、`index,follow,max-image-preview:large`、自指 canonical、标题正确 |
| `/balance-bike-stability/` 线上状态 | ✅ 200、`index,follow,max-image-preview:large`、自指 canonical、标题正确 |
| 两页是否已被收录 | ❌ 仍无法确认，大概率**未收录**。Bing `site:` 双路径查询依旧无可用信号（预算页返回 mermaid.live 垃圾串=网络层污染；稳定页返回格式良好的空结果页）；Google 侧最佳证据仍是 10-12 截止的 Coverage 导出（14/271 收录、26 天平台期），两页 10-15 才提交，最早 10-19~24 可见效果 |
| sitemap.xml | ✅ 200 + `application/xml` + **247 条 URL** + **247/247 含 `<priority>`**（分布与 dist 完全一致、URL 集合差集 0）+ 含两个新页 + max lastmod 2026-10-16T12:22:46.520Z → **Worker 拦截未复发、边缘缓存未陈旧**（连续第 5 次全绿） |
| `npm run seo:health` | ✅ **100/100**（15/15 通过，31s）——r4 的瞬时网络抖动 WARN 未复现，回到全绿 |
| **pruned-listing 301** | 🆕✅ **已上线**：23/23 条精简 URL 全部 301 到存活页（斜杠/无斜杠双变体均覆盖）——r3/r4 的头号待办（后端 `7a4f4db` + 前端 `57b64e9`）已部署生效 |
| stable-track 承载页迁移 | ⏳ 未确认且机制上仍被阻塞（稳定页自身未收录，不可能成为 "stable track" 的承载页）；10-15 基线（`/` + `/products/balance-bikes/`）推定仍成立。等 GSC Performance 导出（10-19~24） |
| GSC validation 状态 | ➖ 无新截图/导出，延续 r3 结论：redirect 组（4）= **Started**（10-16 重新 VALIDATE FIX 已被 Google 接受）；canonical 组（9）= **仍 Failed** |

## 1. 收录核查（Bing 优先）

| 渠道 | 查询 | 结果 | 可用？ |
|---|---|---|---|
| WebSearch | `site:…/balance-bike-budget/` | 5 条站外 balance-bike 文章（peggyomara / trekbikesblog / pookapages / adorablyperfect），无本站结果 | ❌ `site:` 操作符被忽略（与历次一致） |
| WebSearch | `site:…/balance-bike-stability/` | 5 条站外文章（smallsmart / bisiklopedi / portcycling / bebeluxbaby） | ❌ 同上 |
| Bing（WebFetch） | `site:…/balance-bike-budget/` | 返回 **mermaid.live** 流程图编辑器结果（3 条），与查询完全无关 | ❌ 网络层污染（预置内容），对照失效 |
| Bing（WebFetch） | `site:…/balance-bike-stability/` | **格式良好的本地化空结果页**（本次为俄语区 "Не удалось найти ни одного результата"） | ⚠️ 见下方解读 |
| Bing 对照①（整域） | `site:balancebiketoddler.com` | 10 条真实结果：首页、/about、/products、/reviews + 5 个商详页 | ✅ **站点确在 Bing 索引中** |
| Bing 对照②（旧页 size-chart） | `site:…/balance-bike-size-chart/` | 返回知乎阴三儿说唱帖（8 条），完全无关 | ❌ 网络层污染，对照失效 |

**解读：**

- 整域对照再次证明站点在 Bing 索引中。稳定页路径返回了干净的空结果页，预算页路径被预置内容污染。与历次一致：**本沙箱内无法对两个新路径下"已收录/未收录"的结论**，`site:` 输出不构成证据（已知环境约束）。
- 整域 top 10 中无任何 `/balance-bike-*` 资产页（budget / stability / size-chart 均缺席）——与"资产页尚未进入 Bing 索引"相容，但 top 10 缺席本身不是证明。
- **前站长垃圾 URL 仍在索引中**（今日第 5 次连续观测）：`/panties/fashion-models-directory.php`、`/spanking/hardman-cnn-models.php` 仍位列整域对照第 5-6 位。两者线上均 404，会自然衰减；可选加速：Bing Webmaster Tools 移除申请（用户侧，约 1 分钟）。
- Google 侧权威信号仍是 10-12 截止的 Coverage 导出（14/271、26 天平台期）：两页 10-15 才提交，**大概率尚未收录**；最早 10-19~24 可见提交效果。

## 2. sitemap 自检

抓取方式：`curl -s --noproxy '*' https://balancebiketoddler.com/sitemap.xml`（无 query、无 cache-buster——即 Google 实际抓取的路径）。

| 检查项 | 预期 | 实测 | 判定 |
|---|---|---|---|
| HTTP 状态 | 200 | 200 | ✅ |
| Content-Type | application/xml | `application/xml; charset=utf-8` | ✅ |
| URL 数 | 247 | **247**（对基线 247，delta 0） | ✅ |
| 含 balance-bike-budget | 是 | 是 | ✅ |
| 含 balance-bike-stability | 是 | 是 | ✅ |
| 含 `<priority>` | 是 | **247/247**（0.4×159 / 0.6×77 / 0.8×1 / 0.9×9 / 1.0×1，与 dist 逐值一致） | ✅ 后端 `f2046bf` 持续生效（连续第 4 次运行确认） |
| 非 JSON / 非 404 / 非 260 条旧格式 | — | max lastmod = **2026-10-16T12:22:46.520Z**（与前 4 次完全一致；期间无新内容部署，符合预期） | ✅ **Worker 拦截未复发、边缘缓存未陈旧** |
| 与 dist 的 URL 集合一致性 | 一致 | `diff` 差集 = **0** | ✅ 线上与仓库产物完全对齐 |

**结论：七项检查全绿，无需告警。** 10-15/16 的干净路径修复与 priority 修复已稳定运行 72 小时以上。

## 3. 健康检查（可选，已执行）

```
SCORE: 100/100  (pass 15, warn 0, fail 0 of 15)
```

robots.txt、sitemap.xml（247，delta 0）、15 个关键页元数据（含两个新页）、llms.txt（1137B）、15 条抽样内链 0 断裂——与 10-16 周报及今日前 4 次运行一致。**r4 的瞬时 WARN（沙箱网络抖动导致的内链误报）未复现，无回归。**

## 4. 🆕 pruned-listing 301：从"未部署"到"23/23 上线"

这是本次运行最重大的状态变化，解决了 r3/r4 记录的头号站点侧待办：

- **背景链路**：后端 `7a4f4db`（Worker 301 路由）曾实测未部署（r3/r4 抽样 `balance_bike-b0bkxshhnp` 均 404）；今日 22:30 前端提交 `57b64e9` 修复了 `sync_prune_map_to_worker.mjs` 的两个缺陷——① 块替换逻辑会吞掉自身首个 `[[routes]]`，导致二次运行重复注册全部 23 条路由（CF 报错 10020、路由同步中断）；② Cloudflare 路由模式不归一化尾斜杠，斜杠形式会漏到 Pages 层 404。该提交同时让 `prerender-pages.ts` 向 Pages `_redirects` 写入同样的尾斜杠规则。
- **本次实测（r5，22:38 起）**：对 stage1（18 条）+ stage2（5 条）共 **23 条精简 URL 逐一 curl**：**23/23 返回 301 并指向各自的存活页**，覆盖婴儿车、儿童自行车、平衡车、电动车四个类目；存活页均 200。
  - 样例：`/products/balance-bikes/balance_bike-b0bkxshhnp/` → 301 → `…/balance_bike-b0blmf98s8/`（200）；无斜杠形式同样 301。
  - 初测有 1 条显示 404，经核对为本机类目路径映射笔误（该行 category 为 `electric_car`，旧投放路径段为 `electric_vehicles`）；按真实路径 `/products/electric_vehicles/electric_vehicles-b0db4wxz36/` 复测 → **301 → 存活页**（200）。即线上无遗漏。
- **意义**：① 这些 URL 已在 sitemap 里挂了三周，每个 404 都在烧发现权益，现在止损；② 301 生效后，GSC「Page with redirect」组（4）的 Started validation 有了正确的服务端支撑，下次 Coverage 导出应能翻正；③ r3/r4 待办清单中的部署项可关闭。

## 5. stable-track 迁移（无新 GSC 导出）

- 运行中检查 `doc/` 与 `doc/gsc-coverage-2026-10-18-export/`：**无新文件**（`find doc -newermt "2026-10-18 22:35"` 为空）。
- 因此迁移状态无新证据，r3 结论延续：**未确认且机制上被阻塞**——稳定页自身未收录，不可能被选为 "stable track" 的承载页；10-15 基线（`/` + `/products/balance-bikes/`）推定仍成立。待用户提供 Performance 导出（Query contains `stable track` → PAGES 页签），预计 10-19~24 数据可用。

## 6. GSC Page indexing 背景（2026-10-16 已知情况，未重复查询）

- **良性、无需处理**：「Alternate page with proper canonical tag」(9) 与「Page with redirect」(4)——currency / www / 下划线 / guide 变体均已正确 canonical 或 301 去重（10-13 已线上验证行为）。
- **唯一遗留关注点**：图2顶部「Validation failed（10/11→10/13）」——r3 已确认 redirect 组重新 VALIDATE FIX 后为 **Started**，canonical 组仍 Failed。用户若提供新截图/导出：确认 redirect 组是否翻正为 Passed；canonical 组若仍未过，提示再点一次 VALIDATE FIX，或展开该行复制 9 条 URL 做模式识别。
- 另：`/auth/` noindex 行（cookie 弹窗死链，前端 `95b755f` 已修）本次复验仍为 404——弹窗现已指向 `/transparency/privacy-policy/`（200），该排除行将随 Google 下次抓取自然清除。

## 7. 下一步建议（按优先级）

1. **10-19~24**：GSC URL Inspection 两个新页；导出 Performance（Query contains `stable track` → PAGES）验证承载页迁移；下次 Coverage 导出重点看：① 收录数 14 → 15/16（提交生效）② redirect validation Started → Passed ③ canonical 组是否仍 Failed。
2. **外链建设（唯一真正的杠杆）**：诊断链（26 天平台期 + 94% Discovered-not-indexed + 零外链）表明，在出现外部需求信号前，提交类动作无法推高收录天花板。pruned 301 已上线，站点侧对外信号已无欠账。
3. **canonical 组仍 Failed**：用户在 GSC 展开该行复制 9 条 URL 做模式分析；放任不管也只是良性记录长期存在。
4. **（可选）Bing Webmaster Tools 移除**两条前站长垃圾 URL（今日第 5 次观测仍在索引；不处理也会自然衰减）。
5. **（可选）健康脚本微调**：`internal-links` 把任何 `fetch failed` 都计为 broken；建议区分连接错误与 HTTP 4xx/5xx（计数前重试一次），避免网络抖动造成分数噪声（r4 曾触发一次 100→97 的假跌，本次未复现）。

## 8. 运行留档（方法与原始数据）

- sitemap：`curl -s --noproxy '*' -w "HTTP:%{http_code} CT:%{content_type} SIZE:%{size_download}" https://balancebiketoddler.com/sitemap.xml` → 200 / `application/xml; charset=utf-8` / 39888 字节；`grep -o '<loc>' | wc -l` = 247；`grep -o '<priority>' | wc -l` = 247；max lastmod = 2026-10-16T12:22:46.520Z（连续 5 次一致）；priority 分布与 `dist/sitemap.xml` 逐值一致、URL 集合 diff = 0。
- 两新页：curl 直查 → 200 / `index,follow,max-image-preview:large` / 自指 canonical；预算页标题 "Budget Balance Bike: Cheap Picks That Last"，稳定页标题 "Stable Track Balance Bike: Track Width"。
- Bing：WebFetch `www.bing.com/search?q=site:…` ×4（预算 / 稳定 / 整域对照 / 旧页对照）。
- 健康检查：`npm run seo:health` ×1 → 100/100（15/15，31s）。
- pruned 301：由 `doc/stage1-prune-report.json`（18 条）+ `doc/stage2-variant-report.json`（5 条）生成 23 条 URL 逐一 curl 状态码 + Location 头 → 23/23 = 301；存活页复测 200。
- IndexNow 快照 `scripts/seo/.last-indexnow.json`：updatedAt 2026-10-15T16:18:44.835Z 未变，247 条 URL 含两个新页；线上 key 文件 `dfb12ac97ad4a34c75ccf6cc4b783c7f.txt` 200。
- GSC 导出：无新增（`find doc -newermt "2026-10-18 22:35"` 为空）。
- 站点侧：本次运行**零改动**（301 部署系 22:30 的前端提交 `57b64e9` + 后端部署在运行前已生效，本运行仅观测）。
