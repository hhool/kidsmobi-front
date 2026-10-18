# 收录核查与 "stable track" 迁移评估 — 2026-10-18 第四次运行（r4）

> 关联：`doc/gsc-2026-10-18-stable-track_zh.md`（当日第一/二次运行）、`doc/gsc-2026-10-18-stable-track-r3_zh.md`（当日第三次运行）、`doc/gsc-coverage-2026-10-18-analysis_zh.md`（并行会话 GSC Coverage 深度分析）
> 性质：只读核查 + 文档，未改动任何站点代码。
> 运行时间：2026-10-18 22:26-22:35（GMT+8）。本文件为当日第四次自动核查，结论以上述文档为基础增量更新。

## 0. 结论速览

| 核查项 | 结果 |
|---|---|
| `/balance-bike-budget/` 线上状态 | ✅ 200，`index,follow`，canonical 自指 |
| `/balance-bike-stability/` 线上状态 | ✅ 200，`index,follow`，canonical 自指，H1 含 "stable track balance bike" |
| 两页是否已被收录 | ❌ 未证实、大概率未收录。Bing `site:` 两路径依旧无有效结果（运算符/网络层不可靠，§1）；无新 GSC 导出，10-12 截止的 14/271 横盘证据（§4）继续有效 |
| sitemap.xml | ✅ 200 + `application/xml` + **247 条** + **247/247 带 `<priority>`** + 含两新页 + 最新 lastmod 2026-10-16T12:22:46.520Z（与昨三次运行一致）→ **Worker 拦截未复发、边缘缓存不陈旧** |
| `npm run seo:health` | ⚠️ **97/100**（14 pass / 1 warn / 0 fail）：新增 `internal-links: sampled 15, broken=1`。**经定位为沙箱网络瞬时抖动误报**：node fetch 对 2 个 JS 资产偶发 `fetch failed`，重试 3/3 与 curl GET/HEAD 均 200，无真实坏链（§3） |
| stable-track 承载页迁移 | ⏳ 未证实，机制上仍被阻断（stability 页未收录，不可能是承载页）；10-15 基准（`/` + `/products/balance-bikes/`）应仍有效。等 GSC Performance 导出（10-19~24） |
| GSC Validation 状态 | ➖ 无新截图/导出，状态沿用 r3 证据：redirect 4 条 = **Started**（10-16 重新 VALIDATE FIX 已被接受）、canonical 9 条 = **仍 Failed** |

## 1. 收录核查（Bing 优先）

| 渠道 | 查询 | 结果 | 可用性 |
|---|---|---|---|
| WebSearch | `site:…/balance-bike-budget/` | 5 条外站平衡车文章（peggyomara、trekbikesblog、pookapages、adorablyperfect），无一条本站 | ❌ `site:` 运算符被忽略（与既往一致） |
| WebSearch | `site:…/balance-bike-stability/` | 5 条外站文章（smallsmart、bisiklopedi、portcycling、bebeluxbaby） | ❌ 同上 |
| Bing（WebFetch 直取） | `site:…/balance-bike-budget/` | 返回 **mermaid.live** 流程图编辑器结果 3 条，与查询完全无关 | ❌ 网络层污染（罐头内容），对照失效 |
| Bing（WebFetch 直取） | `site:…/balance-bike-stability/` | **规范 localized「无结果」页**（俄文区） | ⚠️ 见判读 |
| Bing 对照（整站） | `site:balancebiketoddler.com` | 10 条真实结果：首页、/about、/products、/reviews + 3 个商品详情页 | ✅ **站点确在 Bing 索引中** |

**判读：**

- 整站对照再次证明 Bing 索引里有本站；stability 路径拿到的是规范 no-results 页，budget 路径被罐头内容污染。与既往结论一致：**沙箱内无法对两条新页路径做出已/未收录的判定**，site: 结果不构成证据（§1.1 已知约束）。
- 整站 top 10 中**仍未出现任何 `/balance-bike-*` 资产页**（budget/stability/size-chart 均不在），与「资产页尚未被 Bing 收录」相容，但不构成证明。
- **前主人 spam URL 仍在索引（第 6 天）**：`/panties/fashion-models-directory.php`、`/spanking/hardman-cnn-models.php` 出现在整站对照第 5、6 位。线上 404，会自然清退；可选加速：Bing 站长工具提交移除（用户侧，约 1 分钟）。
- Google 侧权威信号仍以 10-12 截止的 Coverage 导出为准（14/271、横盘 26 天）：两新页 10-15 才提交，**大概率未收录**，最早 10-19~24 见效。

## 2. sitemap 自检

抓取方式：`curl -s --noproxy '*' https://balancebiketoddler.com/sitemap.xml`（无 query、无 cache-buster，即 Google 实际抓取路径）。

| 检查项 | 预期 | 实测 | 判定 |
|---|---|---|---|
| HTTP 状态 | 200 | 200 | ✅ |
| Content-Type | application/xml | `application/xml; charset=utf-8` | ✅ |
| URL 条数 | 247 | **247**（delta 0） | ✅ |
| 含 balance-bike-budget | 是 | 是 | ✅ |
| 含 balance-bike-stability | 是 | 是 | ✅ |
| 含 `<priority>` | 是 | **247/247** | ✅ backend `f2046bf` 持续生效（连续第三次运行验证） |
| 非 JSON / 非 404 / 非 260 条旧格式 | — | 最新 lastmod = **2026-10-16T12:22:46.520Z**（与昨三次运行完全相同，期间无新内容部署，属预期） | ✅ **Worker 拦截未复发、边缘缓存不陈旧** |

**结论：sitemap 六项检查全绿，无需告警。** 10-15/16 修复的干净路径与 priority 问题经 72+ 小时在线验证保持稳定。

## 3. 健康检查（可选体检，已执行，含异常定位）

```
SCORE: 97/100  (pass 14, warn 1, fail 0 of 15)
[WARN] internal-links: sampled 15, broken=1
```

**异常定位过程（重要，避免误判为站点回归）：**

1. 手工复刻脚本抽样逻辑（node fetch，首页前 15 个去重内链）：`/assets/guides-data-D6s27-Ak.js` 与 `/assets/firebase-vendor-z4G4rKeM.js` 报 `TypeError: fetch failed`。
2. curl GET 两资产：**200**（16947B / 165525B）；curl HEAD ×3：**全部 200**。
3. node fetch HEAD 重试两资产各 3 次：**全部 200**。
4. 判定：`fetch failed` 为**连接层瞬时错误**（沙箱网络抖动/TLS 重置），非真实坏链。脚本对该类错误一律计 broken，故 100 → 97 是**度量噪声，不是站点回归**。其余 14 项（robots、sitemap 247、11 个关键页元数据含两新页、llms.txt 1137B）全部通过，与既往一致。

## 4. GSC 数据（本轮无新导出）

- 运行期间检查 `doc/` 与 `doc/gsc-coverage-2026-10-18-export/`：**无新文件**（最后改动仍为 10-18 21:30 的 Coverage 导出，r3 已分析）。
- 因此 stable-track 迁移与 Validation 状态**均无新证据**，沿用 r3 结论：
  - **迁移未证实**：stability 页未收录 → 机制上不可能成为 "stable track" 承载页；10-15 基准（`/` + `/products/balance-bikes/`）应仍有效。10-19~24 导出一份 Performance（Query contains `stable track` → PAGES 页签）即可定论。
  - **Validation**：redirect 4 条 = Started（10-16 重新 VALIDATE FIX 已被 Google 接受）；canonical 9 条 = 仍 Failed；良性背景不变。

## 5. GSC Page indexing 背景（2026-10-16 已知，未重查）

- **良性、无需处理**：「Alternate page with proper canonical tag」9 条、「Page with redirect」4 条——currency / www / 下划线 / guide 变体均已正确 canonical 或 301 去重。
- **唯一遗留关注点**：「Validation failed（10/11→10/13）」——r3 已确认 redirect 组重新验证 = **Started**（进行中），canonical 组仍 Failed。若用户届时提供新截图/导出，确认是否转 Passed；未转则提示再点一次 VALIDATE FIX 或展开该行贴出 9 条 URL 识别模式。

## 6. 下一步建议（按优先级）

1. **10-19~24**：GSC URL Inspection 查两页收录；导出 Performance（Query contains `stable track` → PAGES）验证承载页迁移；下次 Coverage 导出核对 indexed 14 → 15/16、redirect Validation 转 Passed、canonical 是否仍 Failed。
2. **部署 backend `7a4f4db`**（23 条已裁剪 listing 补 301）——站点侧唯一待部署修复（r3 实测仍未上线，`balance_bike-b0bkxshhnp` 仍 404），这些 404 URL 已被 sitemap 广告 3 周。
3. **外链建设**（唯一实质杠杆）：26 天横盘 + 94% Discovered-not-indexed + 零外链的诊断链表明，提交类动作无法改变收录天花板。
4. **（可选）Bing 站长工具移除**两条前主人 spam URL（第 6 天仍在索引；不处置也会自然清退）。
5. **健康检查脚本小改进（可选）**：`internal-links` 对 `fetch failed` 一律计 broken，建议区分「连接错误」与「HTTP 4xx/5xx」（重试一次后再计），避免网络抖动造成分数噪声。

## 7. 本轮核查留档（方法与原始数据）

- sitemap：`curl -s --noproxy '*' -w "HTTP:%{http_code} CT:%{content_type} SIZE:%{size_download}" https://balancebiketoddler.com/sitemap.xml` → 200 / `application/xml; charset=utf-8` / 39888 字节；`grep -o '<loc>' | wc -l` = 247；`grep -o '<priority>' | wc -l` = 247；max lastmod = 2026-10-16T12:22:46.520Z（三次并列）。
- 两页：curl 直取 → 200 / `index,follow,max-image-preview:large` / canonical 自指；stability H1 = "What makes a stable track balance bike — and why nobody publishes the number"。
- Bing：WebFetch 直取 `www.bing.com/search?q=site:…` ×3（budget / stability / 整站对照）。
- 健康检查：`npm run seo:health` ×2（均 97/100，WARN 复现）；定位脚本 `/tmp/linkcheck.mjs`（复刻抽样）+ curl 重试，结论为瞬时网络错误。
- IndexNow 快照 `scripts/seo/.last-indexnow.json`：updatedAt 2026-10-15T16:18:44.835Z 未变，两新页均在 247 条内。
- GSC 导出：无新增（`find doc -newermt "2026-10-18 21:45"` 为空）。
- 站点侧本轮**零改动**。
