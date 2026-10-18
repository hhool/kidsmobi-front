# 收录核查与 "stable track" 迁移评估 — 2026-10-18 第三次运行（r3）

> 关联：`doc/gsc-2026-10-18-stable-track_zh.md`（当日第一/二次运行，§1-§9）、`doc/gsc-coverage-2026-10-18-analysis_zh.md`（并行会话对 21:30 到达的 GSC Coverage 导出的深度分析）
> 性质：只读核查 + 文档，未改动任何站点代码。
> 运行时间：2026-10-18 21:32-21:50（GMT+8）。本文件为当日第三次自动核查，结论以上述两份文档为基础增量更新。

## 0. 结论速览

| 核查项 | 结果 |
|---|---|
| `/balance-bike-budget/` 线上状态 | ✅ 200，`index,follow`，canonical 自指，title 正确 |
| `/balance-bike-stability/` 线上状态 | ✅ 200，`index,follow`，canonical 自指，title 正确 |
| 两页是否已被收录 | ❌ 未证实、大概率未收录。Bing site: 两路径均「无结果」（但运算符不可靠，§1）；GSC 新导出（数据截止 10-12，§4）显示全站仅 **14/271** 收录且横盘 26 天，两页 10-15 才提交，几乎必然仍在 242 条「Discovered - currently not indexed」中。Google 侧权威确认需 GSC URL Inspection（10-19~24） |
| sitemap.xml | ✅ 200 + `application/xml` + **247 条** + **247/247 带 `<priority>`**（backend `f2046bf` 持续生效，分布与 dist 完全一致）+ 含两新页 + 最新 lastmod 2026-10-16T12:22:46.520Z（与昨日一致，无新内容部署，正常）→ **Worker 拦截未复发、边缘缓存不陈旧** |
| `npm run seo:health` | ✅ **100/100**（15/15 通过，含两新页元数据 + 15 条内链 0 断裂），无回归 |
| stable-track 承载页迁移 | ⏳ 未证实，且**机制上被阻断**：stability 页自身未收录，不可能成为 "stable track" 承载页；10-15 基准（`/` + `/products/balance-bikes/`）应仍有效。等 GSC Performance 导出（Query contains `stable track` → PAGES） |
| GSC Validation 状态 | 🆕 首次拿到直接证据：redirect 4 条 = **Started**（用户 10-16 的重新 VALIDATE FIX 已被 Google 接受、验证进行中）；canonical 9 条 = **仍 Failed**；noindex 1 条 = `/auth/`（cookie 死链，已修且线上生效） |

## 1. 收录核查（Bing 优先）

| 渠道 | 查询 | 结果 | 可用性 |
|---|---|---|---|
| WebSearch | `site:…/balance-bike-budget/` | 5 条外站平衡车文章（peggyomara、trekbikesblog、pookapages、adorablyperfect），无一条本站 | ❌ `site:` 运算符被忽略（与既往一致） |
| WebSearch | `site:…/balance-bike-stability/` | 5 条外站文章（smallsmart、bisiklopedi、portcycling、bebeluxbaby） | ❌ 同上 |
| Bing（WebFetch 直取） | `site:…/balance-bike-budget/` | **「没有与此相关的结果」**（规范 no-results 页） | ⚠️ 见判读 |
| Bing（WebFetch 直取） | `site:…/balance-bike-stability/` | **「結果がありません」**（日文区，语义同为无结果） | ⚠️ 同上 |
| Bing 对照①（整站） | `site:balancebiketoddler.com` | 10 条真实结果：首页、/about、/products、/reviews + 3 个商品详情页 | ✅ **站点确在 Bing 索引中** |
| Bing 对照②（老页） | `site:…/balance-bike-size-chart/` | 返回知乎 hip-hop 话题等**完全无关的罐头内容** | ❌ 网络层污染，对照失效（与 10-18 上午记录同款） |

**判读：**

- 整站对照证明 Bing 索引里有本站；两条新页路径拿到的是规范的 localized no-results 页（非罐头），但 Bing 的 `site:` 路径过滤不完整是已知缺陷，且老页对照被污染无法建立基线——**两条「无结果」不能判定未收录，也无法判定已收录**。与昨日（§1.1）结论一致。
- 整站结果中**未出现任何 `/balance-bike-*` 资产页**（budget/stability/size-chart 等均不在 top 10），与「资产页尚未被 Bing 收录」的假设相容，但 top-10 本身不构成证明。
- **意外持续项：** 两条前主人 spam URL（`/panties/fashion-models-directory.php`、`/spanking/hardman-cnn-models.php`）**仍在 Bing 索引中**（第 6 天，整站对照第 5、6 位）。线上均 404，会自然清退；可选加速：Bing 站长工具提交移除（用户侧，约 1 分钟）。
- **Google 侧新增证据（§4）：** 21:30 到达的 GSC Coverage 导出从官方渠道给出更强信号——全站 14/271 收录、横盘 26 天，两新页 10-15 才提交，「未收录」从推断升级为高置信判断。

## 2. sitemap 自检

抓取方式：`curl --noproxy '*' https://balancebiketoddler.com/sitemap.xml`（无 query、无 cache-buster，即 Google 实际抓取路径）。

| 检查项 | 预期 | 实测 | 判定 |
|---|---|---|---|
| HTTP 状态 | 200 | 200 | ✅ |
| Content-Type | application/xml | `application/xml; charset=utf-8` | ✅ |
| URL 条数 | 247 | **247**（与 `SITEMAP_BASELINE_COUNT=247` 一致，delta 0） | ✅ |
| 含 balance-bike-budget | 是 | 是 | ✅ |
| 含 balance-bike-stability | 是 | 是 | ✅ |
| 含 `<priority>` | 是 | **247/247** | ✅ backend `f2046bf` 持续生效 |
| priority 分布 | 与 dist 一致 | live：1.0×1 / 0.9×9 / 0.8×1 / 0.6×77 / 0.4×159；dist：**完全相同**；URL 集合 `diff` = 0 差异 | ✅ 双源完全一致 |
| 非 JSON / 非 404 / 非 260 条旧格式 | — | 最新 lastmod = **2026-10-16T12:22:46.520Z**（与昨日相同，期间无新内容部署，属预期） | ✅ **Worker 拦截未复发、边缘缓存不陈旧** |

**结论：sitemap 六项检查全绿，无需告警。** 昨日 §8 的 priority 修复经 24 小时在线验证稳定。

## 3. 健康检查（可选体检，已执行）

```
SCORE: 100/100  (pass 15, warn 0, fail 0 of 15)
```

robots.txt、sitemap.xml（247，delta 0）、15 个关键页元数据（含两新页）、llms.txt（1137B）、内链抽样 15 条 0 断裂——与 10-16 周报、10-18 前两次运行完全一致，**无回归**。

## 4. GSC Coverage 新导出交叉验证（21:30 到达，并行会话已深度分析）

运行期间用户放入新导出 `doc/gsc-coverage-2026-10-18-export/`（Chart.csv / Critical issues.csv / Metadata.csv / Non-critical issues.csv / coverage-forensics.json），并行会话已产出分析（`gsc-coverage-2026-10-18-analysis_{zh,en}.md`，commit `cdceb26`）。本任务相关的交叉验证结论：

1. **数据截止 2026-10-12**——早于 10-15 IndexNow 重推和 10-16 Request Indexing，提交效果最早 **10-19~24** 可在图表看到。
2. **收录现状：14/271，09-22 起横盘 26 天**（10-05~09 短暂 13 后回升）。两新页 10-15 才进入 Google 视野，**几乎必然在 242 条「Discovered - currently not indexed」中**——这与 §1 的 Bing 侧证据方向一致。
3. **stable-track 迁移：机制上被阻断。** stability 页自身未收录，Google 不可能把它选为 "stable track" 的承载页；10-15 基准（`/` + `/products/balance-bikes/`）应仍有效。待 Performance 导出验证（Query contains `stable track` → PAGES 页签）。
4. **Validation 状态（本任务第 5 项的答案）：**
   - 「Page with redirect」4 条：**Started** —— 用户 10-16 的重新 VALIDATE FIX 已被 Google 接受，验证进行中。这是三日来第一次拿到「进行中」的直接证据，只需等周期（通常数天）转 Passed。
   - 「Alternate page with proper canonical tag」9 条：**仍 Failed** —— 良性背景不变（currency/www/下划线/guide 变体已正确 canonical/301），但验证未过。下一步：用户在 GSC 展开该行复制 9 条 URL 贴来，agent 识别模式。
   - 「Excluded by 'noindex' tag」1 条 = **`/auth/`**（cookie 弹窗 Privacy Policy 死链）。修复 front `95b755f` **本轮线上验证已生效**：弹窗链接已指向 `/transparency/privacy-policy/`（200，在 sitemap 内），`/auth/` 本身 404+noindex，该排除行会随 Google 复爬自然清除。
5. **裁剪 listing 301 修复（backend `7a4f4db`）本轮实测仍未部署**：抽样 `/products/balance-bikes/balance_bike-b0bkxshhnp/` 仍返回 **404**（预期 301 到幸存者）。这是当前站点侧头号待办——这些 URL 已被 sitemap 广告 3 周，404 持续烧掉发现度。部署需 CF token（用户侧提供或自行执行，命令见 coverage 分析文档 §6.3）。

## 5. GSC Page indexing 背景（2026-10-16 已知，未重查）

- **良性、无需处理：** 「Alternate page with proper canonical tag」9 条、「Page with redirect」4 条——currency / www / 下划线 / guide 变体均已正确 canonical 或 301 去重，10-13 分析已实测确认行为正确。
- **状态更新（相对 10-16 截图）：** redirect 组验证 Failed → **Started**（§4.4）；canonical 组验证**仍 Failed**；新增 noindex 1 条（= /auth/，已修，§4.4）。

## 6. 下一步建议（按优先级）

1. **部署 backend `7a4f4db`**（23 条已裁剪 listing 补 301）——站点侧唯一待部署修复，本轮实测仍未上线。
2. **10-19~24**：GSC URL Inspection 查两页收录状态；导出一份 Performance（Query contains `stable track` → PAGES）验证承载页迁移。
3. **canonical 9 条仍 Failed**：用户在 GSC 展开该行复制 9 条 URL 贴给 agent 识别模式；暂不处置也只会自然存在（良性）。
4. **redirect 4 条 Started**：等周期转 Passed；若数日后仍 Started，再点一次 VALIDATE FIX。
5. **外链建设**（唯一实质杠杆）：coverage 分析 §7 的诊断链（26 天横盘 + 94% Discovered-not-indexed + 零外链）表明，在外部需求信号出现前，提交类动作无法改变收录天花板。
6. **（可选）Bing 站长工具移除**两条前主人 spam URL（第 6 天仍在索引；不处置也会自然清退）。
7. **下次 Coverage 导出时核对**：① indexed 14 → 15/16（两页提交见效）② redirect Validation 转 Passed ③ canonical 是否仍 Failed。

## 7. 本轮核查留档（方法与原始数据）

- sitemap：`curl -s --noproxy '*' -w "HTTP:%{http_code} CT:%{content_type}" https://balancebiketoddler.com/sitemap.xml` → 200 / `application/xml; charset=utf-8` / 39888 字节；`grep -o '<loc>' | wc -l` = 247；`grep -o '<priority>' | wc -l` = 247；priority 分布与 `dist/sitemap.xml` 逐档一致；URL 集合 diff 为空。
- 两页：curl 直取 → 200 / `index,follow,max-image-preview:large` / canonical 自指；title 分别为 "Budget Balance Bike: Cheap Picks That Last" 与 "Stable Track Balance Bike: Track Width"。
- Bing：WebFetch 直取 `www.bing.com/search?q=site:…` ×4（两新页 + 整站对照 + 老页对照）。
- 健康检查：`npm run seo:health` → 100/100（15/15）。
- GSC 导出：`doc/gsc-coverage-2026-10-18-export/`（21:30 到达，fetchedAt 2026-10-18T13:10:41.335Z）；Critical issues.csv 原文 6 行已核对；Chart.csv 数据截止 10-12。
- /auth/ 修复验证：弹窗 privacy 链接 = `/transparency/privacy-policy/`（200）；`/auth/` = 404 + `noindex,nofollow`。
- 301 部署验证：`/products/balance-bikes/balance_bike-b0bkxshhnp/` = 404（未部署）；`/products/balance-bikes/balance_bike-b0blmf98s8/` 在 sitemap 内、200（未裁剪，正常）。
- IndexNow 快照 `scripts/seo/.last-indexnow.json`：updatedAt 2026-10-15T16:18:44.835Z 未变（无新提交，符合预期）。
- git HEAD：`cdceb26`（并行会话的 coverage 分析）；站点侧本轮**零改动**。
