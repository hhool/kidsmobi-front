# GSC Coverage 导出分析（2026-10-18）

**数据源**：用户导出的 GSC Page indexing（Coverage）报告 `balancebiketoddler.com-Coverage-2026-10-18.zip`（Chart.csv / Critical issues.csv / Metadata.csv，Non-critical issues 为空）。
**图表数据截止 2026-10-12**（GSC 图表滞后导出日约 6 天；10-13~10-18 的动作效果最早 10-19~10-24 才可在图表看到）。
**配套站点侧取证**：线上全量抓取 247 个 sitemap URL（脚本 `tmp/gsc-coverage-2026-10-18/forensics.mjs`，结果 `coverage-forensics.json`）。

---

## 0. TL;DR

| 问题 | 答案 |
|---|---|
| 站点收录现状 | **14 / 271 已收录（5.2%）**，09-22 起 26 天钉在 13-14，零净增长 |
| /balance-bike-budget/ 与 /balance-bike-stability/ 收录了吗 | **大概率未收录**，在「Discovered - currently not indexed」（242 条）里；两页线上技术状态满分（200/自称 canonical/index,follow/sitemap 0.9 档），10-15 IndexNow + 10-16 Request Indexing 已提交，图表看不到（截止 10-12） |
| 10-13 截图里的「Validation failed」是什么 | **「Alternate page with proper canonical tag」9 条，验证失败**（#5 得到解答）；「Page with redirect」4 条验证进行中 |
| 这是技术问题吗 | **不是**。247/247 sitemap URL 线上全部 200、自称 canonical、可收录、有真实预渲染内容、hub 全量内链——站点侧干净。这是**抓取需求/站点权重**问题 |
| 本轮发现并修复 | ① cookie 弹窗 Privacy Policy 指向 404+noindex 死链（= GSC 那 1 条 noindex）② 23 条已裁剪重复 listing 404 而未按既定策略 301 到幸存者 |
| 真正能撬动的杠杆 | 外链（唯一实质杠杆）+ 小批量 Request Indexing + 时间。详见 §8 |

---

## 1. 导出数据本身

- **Known pages 271** = 14 indexed + 257 not indexed。
- 271 的构成推断：**247（sitemap）+ 23（已裁剪重复 listing）+ 1（/auth/）**。404 行不出现在这两张 CSV 里——「Not found (404)」这类原因没有 validation 状态，而本导出只含带 validation 状态的行（这与 Critical issues 6 行全部有状态、且含一条 Passed/0 行吻合）。此为推断，非导出明示。
- Impressions 日均 0-12，与 10-16 Performance 分析（US 156 展现/0 点击）一致。

## 2. 未收录原因分解（257 条）

| 原因 | 条数 | Validation | 解读 |
|---|---|---|---|
| Discovered - currently not indexed | **242** | Started | Google 知道 URL（sitemap）但没排上抓取。**主瓶颈** |
| Alternate page with proper canonical tag | 9 | **Failed** | 非 sitemap URL 变体（见 §5） |
| Page with redirect | 4 | Started | 重定向中，大概率将通过 |
| Excluded by 'noindex' tag | 1 | Not Started | **= /auth/**（cookie 弹窗死链，本轮已修，§6） |
| Crawled - currently not indexed | 1 | Started | 抓了但判定不收录——单页质量/权重信号，需 GSC URL 清单定位 |

## 3. 26 天平台期：图表拐点 × 关键日期

| 日期 | 图表事件 | 对应动作 |
|---|---|---|
| 08-14 | 首条数据：indexed 8 | — |
| 08-29 | indexed 滑到 5 | — |
| 09-15 | not-indexed 13→47 | — |
| **09-22** | **not-indexed 47→257，indexed 5→14** | sitemap 全量提交（Metadata: "All known pages"）——Google 一次性发现全部页面，但只收 14 条 |
| 09-22→10-12 | **21 天 13-14 横盘** | 10-13/14 商品裁剪、10-15 IndexNow、10-16 Request Indexing 均**未在图表产生可见变化**（图表截止 10-12，且横盘已 21 天） |
| 10-05~10-09 | indexed 14→13→14 短暂回落 | 单页进出，无需处置 |

Impressions 对比：sitemap 提交前一个月 172，提交后三周 86——**发现量翻 5 倍，展现量反而减半**。这是「抓不到需求」的典型信号。

## 4. 两个目标页的状态判定

线上实测（本轮）：

- `https://balancebiketoddler.com/balance-bike-budget/` → 200，`<link rel="canonical" href=".../balance-bike-budget/">`（自称），`robots: index,follow,max-image-preview:large`，title 正常
- `https://balancebiketoddler.com/balance-bike-stability/` → 同上，全部正常
- 两页均在 sitemap 247 中，priority 0.9（与 recalls、7 个 plan-B 资产同档）

判定：两页**必然在 242 条「Discovered - currently not indexed」中**（10-15 才经 IndexNow 提交，图表截止 10-12 不可能反映；且全站天花板就是 14）。GSC URL Inspection 是唯一能直接确认的渠道（用户侧，10-19~20 数据才反映 10-16 的 Request Indexing）。

## 5. #5 的答案 + 9 个 alternates

10-13 截图里「Validation failed（10/11→10/13）」对应的是 **Alternate page with proper canonical tag（9 条，Failed）**——用户 10-16 重点的 VALIDATE FIX 复检后仍未过。「Page with redirect（4 条）」是 Started，不是失败项。

站点侧排查结论：**247 个 sitemap URL 全部自称 canonical（线上逐条验证，0 条例外）**，所以这 9 条是 sitemap 之外的 URL 变体（旧形态/Google 自行发现的参数或路径变体）。全站预渲染 HTML 中**没有任何带查询参数的内链**（已 grep 验证），无从进一步定位——**需要 GSC 网页端点开该问题行复制 9 条 URL**，贴来即可识别模式。

## 6. 本轮站点侧取证与两个修复

### 6.1 全量在线取证（247/247）

| 检查项 | 结果 |
|---|---|
| HTTP 状态 | 247/247 = 200 |
| noindex | **0** |
| 非自称 canonical | **0** |
| 预渲染可见文本量 | 详情页 4.5k-5.7k 字符，hub 7k——非薄内容 |
| hub→详情内链 | balance-bikes hub 链全部 15 条详情，kids-bikes hub 链全部 24 条——无深度问题 |
| 带参内链 | 0 |

### 6.2 修复①：cookie 弹窗死链（front `95b755f`，Pages 自动部署）

`CookieConsentModal` 的「Privacy Policy」指向 `/auth`——该页是 **404 + noindex,nofollow**。这正好是 GSC 那 1 条「Excluded by noindex」，且每个首次访问者都会被弹窗引导去死链。已改为指向真实存在的 `/transparency/privacy-policy/`（200、index,follow、在 sitemap 内）。

### 6.3 修复②：23 条已裁剪 listing 补 301（backend `7a4f4db`，**待手动部署 Worker**）

stage-1/stage-2 的裁剪映射只喂了 sitemap 排除，** retired URL 本身线上是 404**（Pages 无规则、Worker 看不到这些路径）。而阶段报告白纸黑字写着策略是「301'd to the listing with the most reviews」；且这些 URL 经 sitemap 被广告了 3 周（09-22→10-13/14），Google 的 271 已知集正好 = 247+23+1，三周的发现度被 404 烧掉。

修复（三处联动，单一真源）：
- `front/scripts/sync_prune_map_to_worker.mjs` 新增生成 `PRUNED_PRODUCT_REDIRECTS`（完整路径→完整路径；分类从阶段报告经 `PRODUCT_CATEGORY_URL_SLUGS` 解析，缺分类直接报错而非静默猜路径），并同步维护 wrangler.toml 的生成路由段
- Worker `handleRequest` 合并查询两张 redirect map，并归一化尾斜杠（斜杠形态变体也落到幸存者）
- wrangler.toml +23 条精确路由（45→68）

**部署命令**（需 CF token，同前纪律：只走环境变量不落盘）：

```bash
cd /d/project/kidsmobi/backend/api/worker && CLOUDFLARE_API_TOKEN=<token> CLOUDFLARE_ACCOUNT_ID=b40383bf3afb30ccc7c9a13d6c9b6868 npx wrangler deploy
```

## 7. 诊断：抓取需求问题，不是技术问题

证据链：
1. 26 天收录横盘 13-14（09-22 sitemap 全量提交后）
2. 247/247 技术状态满分（§6.1）
3. Impressions 86/3 周（≈4 条/天）——Google 没有任何来自这个站的需求信号
4. 新域名、零外链（历史对话确认无外链建设）
5. 「Discovered - currently not indexed」占未收录的 94%——Google 的官方含义就是「知道了，没排上」

Google 对无需求站点的策略：sitemap 里的 URL 先进「已发现」停车场，按站点整体信号分批放行。**在站点产生外部需求信号之前，提交多少 sitemap/IndexNow 都不会改变天花板。**

## 8. 行动建议（按杠杆排序）

1. **外链（唯一实质杠杆）**：哪怕 3-5 条相关外链（育儿论坛、选购指南 roundup、HARO/专家约稿）就能改变抓取需求曲线。这是用户侧运营动作， agent 无法代做。
2. **小批量 Request Indexing**：已完成 2 条（10-16）。建议对最优先的 5-10 条目标页分批提交（隔天几条，不要 240 条一波——批量模式会被降权），渠道：GSC URL Inspection → Request Indexing。
3. **等周期**：Google 对停车场 URL 的复评是周到月量级。10-15/16 的两条提交效果 10-19~10-24 首次可读。
4. **技术卫生保持全绿**（已做到，无需再动）。
5. 下次导出 Coverage 时核对：① indexed 14 → 15/16（两页提交见效）② 「Page with redirect」Validation 转 Passed ③「Alternate page」是否仍 Failed（若仍失败，展开复制 9 条 URL 给 agent）。

## 9. 待用户侧操作清单

| # | 动作 | 预计耗时 |
|---|---|---|
| 1 | GSC URL Inspection 查两页收录状态（10-19~20 数据才反映 10-16 提交） | 2 分钟 |
| 2 | GSC 展开「Alternate page with proper canonical tag」行，复制 9 条 URL 贴给 agent | 1 分钟 |
| 3 | （可选）Bing 站长工具移除两条前主人残留 URL（/panties/…、/spanking/…，已 404 五天） | 1 分钟 |
| 4 | Worker 部署 backend `7a4f4db`（贴 CF token 给 agent 代跑，或自己执行 §6.3 命令） | 1 分钟 |
| 5 | （战略）启动外链建设 | 持续 |
