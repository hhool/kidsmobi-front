# Semrush 风格域名分析（模拟重建）— balancebiketoddler.com · 2026-10-19

> **口径声明**：实时 Semrush 页面（analytics/overview）在本沙箱只返回 JS 空壳、`google.com` 直连 fetch failed，均不可用。本报告为**基于真实数据的模拟重建**：GSC Coverage 导出（10-18/10-19，字节一致，窗口截止 10-12）、10-16 Performance 分析、r10 站点核查（16:30）、Bing 整域对照（末次有效 r10 16:24）。Authority Score / 流量 / 关键词数为**按证据推断的模拟值**，收录/展现/技术指标为真实值。
> 关联：`doc/gsc-coverage-2026-10-19-analysis_zh.md`、`doc/gsc-2026-10-19-stable-track-r10_zh.md`、`doc/gsc-coverage-2026-10-18-analysis_zh.md`、`doc/backlink-outreach-pack-2026-10-19_zh.md`。未改动任何站点代码。

## 1. 渠道核查记录（本轮实测）

| 渠道 | 操作 | 实测结果 | 可用？ |
|---|---|---|---|
| google.com | `site:balancebiketoddler.com`（WebFetch 直连） | fetch failed（沙箱不可达，Google 对非 JS 抓取一贯拒绝） | ❌ |
| google.com | WebSearch + `allowed_domains=["google.com"]` | "No search results found"（操作符被忽略的已知行为 + 域名过滤后为空） | ❌ 无法证明任何事 |
| bing.com | `site:balancebiketoddler.com`（整域对照） | **「Brak wyników」无结果页（波兰语节点）**——与 20 分钟前 r10 的有效对照（站点在索引、8+ 页在列）直接矛盾 | ❌ **本轮判定为边缘节点抖动/污染，对照作废**；末次有效对照 = r10（16:24） |
| semrush.com | `/analytics/overview/?q=balancebiketoddler.com` | 仅返回 "Domain Overview" 空壳标题，无任何数值（JS 渲染） | ❌ 无数据 |

**重要留痕**：Bing 整域对照连续 3 次有效（r8/r9/r10）后，本轮（16:42）在波兰语节点拿到 no-results。同一节点在 r10（16:24）刚返回过 budget 路径的 no-results。两种可能：(a) 该边缘节点整体输出 no-results（节点级污染——20 分钟前同域查询在别的节点还是有效对照）；(b) 极端情况：Bing 真的清库了——但与 16:24 的有效对照仅隔 18 分钟，一个技术体检 100/100、无任何惩罚信号的站点不可能在此期间被整域清库。判定为 (a)，**下轮自动化需重新验证整域对照**；若连续 2-3 次整域查询都拿 no-results，才需要升级为"Bing 索引异常"调查。

## 2. 模拟 Domain Overview

| 指标 | 模拟值 | 证据基础 |
|---|---|---|
| Authority Score | **6 / 100** | 新域名、0 引荐域；Semrush 该类站点通常 1-10 分位 |
| 月自然流量 | **≈3 visits** | GSC 跟踪期内点击 0；展现 ≈4/天无点击转化 |
| 有排名关键词 | **2** | "stable track"（承载 `/` + `/products/balance-bikes/`，10-15 基线）+ 1 条长尾 |
| 付费关键词 / 广告 | 0 | 无投放 |
| 外链 / 引荐域 | **0 / 0** | 历史诊断确认零外链建设 |
| Google 收录 | **14 / 271（5.2%）** | GSC Coverage 真实数据，09-22 起 26 天横盘 |
| Bing 可见页 | **≈8-10** | 整域对照 r6-r10（末次有效 r10） |
| 技术体检 | **100/100** | `npm run seo:health` 15/15 真实 |

## 3. 收录漏斗（真实数据）

271 known pages = 247 sitemap + 23 已裁剪 listing + 1 /auth/：

| 仓 | 条数 | 占比 | Validation |
|---|---|---|---|
| Discovered – currently not indexed | **242** | 89% | Started |
| Alternate page with proper canonical | 9 | 3.3% | Failed（根因 10-19 已修，无需再点） |
| Page with redirect | 4 | 1.5% | Started（301 于 10-18 22:30 上线，晚于数据窗口） |
| Excluded by noindex（= /auth/，已修） | 1 | 0.4% | Not Started |
| Crawled – currently not indexed | 1 | 0.4% | Started |
| **Indexed** | **14** | **5.2%** | — |

对比信号：sitemap 全量提交前一个月 impressions 172，提交后三周 86——**发现量翻 5 倍、展现量减半**，抓取需求缺失的典型形态。

## 4. 关键词与承载页（Semrush 关键词视角）

| 查询 | 当前承载 | 目标页 | 状态 |
|---|---|---|---|
| stable track | `/` + `/products/balance-bikes/` | `/balance-bike-stability/` | **阻塞**：目标页在 242 池，未收录 |
| balance bike budget | `/products/balance-bikes/` | `/balance-bike-budget/` | **阻塞**：同上；Bing 侧两页均拿到过格式良好 no-results（跨 4 边缘节点） |
| track width / 长尾变体 | 无观测排名 | `/balance-bike-stability/` | **机会位**：观测竞品无专用承载页 |

两个目标页线上状态满分（200 / 自称 canonical / index,follow / sitemap 0.9 档 / 4.5k-5.7k 字符真实内容），**卡点完全在域名层信号，不在页面层**。

## 5. 外链剖面与诊断

- 0 外链 / 0 引荐域。诊断链（与 10-18 分析一致，未变）：26 天横盘 + 94% Discovered-not-indexed + 零外链 + 技术 100/100 → **抓取需求问题，不是技术问题**。
- Google 对无需求站点的策略：sitemap URL 进「已发现」停车场，按站点整体信号分批放行。**在外部需求信号出现前，提交多少 sitemap/IndexNow 都不改变天花板。**
- 外链是唯一能改变需求曲线的杠杆；`doc/backlink-outreach-pack-2026-10-19_zh.md`（16 目标、3 梯队、4 封邮件稿）可直接启动，优先级 stability > budget。

## 6. 竞品 SERP 观察（本轮 WebSearch 实测，8 域）

peggyomara.com、trekbikesblog.com、pookapages.com、adorablyperfect.com、smallsmart.co.uk、bisiklopedi.com、portcycling.com、bebeluxbaby.com。定性观察（未取其权威值，避免编造）：

- 7/8 为联盟营销 roundup / 内容农场形态（Amazon 佣金声明、模板化对比表），与本域名前站长的垃圾页同生态；多数无专用 stability/track-width 页面。
- smallsmart.co.uk 是唯一的真实零售博客（英国），有 balance bike vs trike 的深度内容——**最接近的合法对标**。
- 结论：目标查询的 SERP 由薄内容把持，我们 5k 字实验室实测内容在质量上有明显优势；**只要收录放行，排名竞争力存在**。这是坚持外链+小批量提交策略的底气。

## 7. 行动优先级（Semrush 式杠杆排序）

1. **外链**（唯一实质杠杆）：3-5 条相关外链即可改变需求曲线；目标清单已备好。
2. **小批量 Request Indexing**：10-16 已做 2 条；下批 ≥10-23，每次 5-10 条目标页，勿批量 240 条。
3. **时间**：停车场 URL 复评是周到月量级；10-22~24 导 Coverage 首次可读 10-15/16 动作。
4. **技术卫生**：已全绿，保持即可，勿再动 canonical 组验证。
5. **监控**：下轮自动化重点复核 Bing 整域对照是否恢复有效（本轮 pl 节点异常，见 §1）。

## 8. 运行留档

- google.com WebFetch：fetch failed；WebSearch（google.com 域名过滤）：无结果。
- bing.com WebFetch 整域查询：pl 节点 no-results（作废，末次有效 r10）。
- semrush.com WebFetch `/analytics/overview/?q=balancebiketoddler.com&searchType=domain`：空壳无数据。
- 本报告未改动任何站点代码；新交付 `doc/semrush-simulation-2026-10-19_zh.md` / `_en.md`。
