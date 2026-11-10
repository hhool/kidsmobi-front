# GSC 页面数据处理与落地到站点 — 2026-11-10

> 范围：仅 `balancebiketoddler.com`。数据来源：仓库内已提交的 GSC 导出文档 `doc/`
> （最新：`gsc-2026-10-21-stable-track-r14`、`gsc-indexing-simulation-2026-10-27`、
> `gsc-phase-a-checklist`、`gsc-manual-actions-2026-10-21`、`gsc-coverage-2026-10-19`）。
> 方法：处理这些导出 → 对**线上**站点逐项复核。

## 摘要

- **没有新的代码侧问题。** GSC 此前标记的技术问题现已全部修复并线上验证：Breadcrumb
  JSON-LD 去重、`/guides` hub 标题、`/transparency/testing_methodology` 301 跳转、
  favicon 位图资源集，以及 6 个主词 hub（全部 200 + 自引用 canonical）。
- **因 11-10 的 sitemap 变更，现需要所有者做一次操作：** sitemap 的 URL 集合由 **441 → 288**
  收缩（按操作者要求移除了所有产品详情页）。必须在 GSC 内**重新提交 / 刷新 `sitemap.xml`**，
  否则 Google 会继续期待那些已被移除的 URL。
- **无法拉取 GSC 实时数据：** 提供的 "webmaster api key" 单独无法鉴权 Search Console API
  （需要 OAuth，仓库内未存储）；OpenPageRank 在本环境被 IP 锁定（`403: 该密钥绑定了其他 IP`）。
  两者见 §5，含启用方法。

## 1. GSC 导出问题 → 落地到站点 → 线上状态

| GSC 标记项 | 所需修复 | 状态（2026-11-10 线上） |
|---|---|---|
| Breadcrumb JSON-LD 重复（约 20/21 页） | 3 个输出源合并为 1 | ✅ 已修复并验证——每页 1 个 `BreadcrumbList`，无重复 |
| `/guides` hub 标题错位（"How to Choose a Baby Stroller…"） | 修正预渲染标题 | ✅ 已修复——现标题 "Balance Bike Guides: Age, Size & Budget" |
| `/transparency/testing_methodology`（下划线）404 | 301 → `/transparency/testing-methodology/` | ✅ 已修复并验证（308 → 200） |
| 灰色地球图标（只声明 SVG；`/favicon.ico` 404） | 增加 ICO + PNG（48/96/144/192/512）+ manifest | ✅ 10-27 已上线并验证（全部 200，MIME 正确） |
| 16 个 wagon/playard URL 曾是 301（Worker 解析漂移） | 解析修复 → 稳定在 `/products/kids-tricycles/` | ✅ 200 稳定（按 11-10 规则**已移出 sitemap**） |
| 6 个主词 hub 尚未收录 | 内链加权 + 请求收录 | ⚠️ 线上 200 + 自引用 canonical；**请求收录是 GSC 手动操作** |
| sitemap URL 集合变化（下线/新增 URL） | 重建 + 在 GSC 重新提交 | ⚠️ 11-10 已重建为 288；**重新提交待办（手动）** |

## 2. 线上复核（2026-11-10）

- **6 个主词 hub** — 6/6 返回 **200** 且 **canonical 自引用**：
  `best-balance-bike-2026`、`best-double-stroller-2026`、`best-jogger-stroller-2026`、
  `best-travel-stroller-2026`、`best-electric-car-for-kids-2026`、`toddler-electric-car`。
- **wagon/playard 集群**（20 个 URL） — **200**，但 **不在 sitemap 中**。符合预期：
  它们是产品详情页，按操作者 11-10 指令已从 `sitemap.xml` 移除。仍可通过内链被抓取，
  仅 sitemap 条目消失。
- **favicon 资源** — `favicon.ico`（image/x-icon）、`favicon-48/96/144/192/512x192.png`
  （image/png）、`apple-touch-icon.png`、`site.webmanifest`（application/manifest+json）
  全部 **200** 且 MIME 正确。（首次探测有两次瞬时 `000`，重试后均为 200；早前一次看似 404
  是路径写错——真实文件用的是 `x192` 格式。）
- **Breadcrumb JSON-LD** — 每页 1 个节点，无重复。
- **Sitemap** — **288 个 URL**，**0 个产品详情页**；6 个分类 hub 均在。

## 3. 问题与修复

### 3.1 代码侧（均已解决——无需改动）
导出中的三个历史"修复"项已确认在代码中修复并线上验证。本次未做任何编辑，站点技术状态干净。

### 3.2 由 11-10 sitemap 变更触发（需所有者操作，非代码 bug）
操作者 11-10 指令（"具体产品页不放入 sitemap.xml"）下线了所有 `/products/<dir>/<id>`。
叠加此前清理，sitemap 由 **441 → 288**（−153）。这符合指令，但意味着 Google 仍持有过时的
sitemap 计数并期待已不出现的 URL。唯一补救是在 GSC 重新提交/刷新（§4.1）。注意：这也移除了
`gsc-phase-a-checklist` §5 希望*保留*在 sitemap 中、用于确认 P1 修复的 20 个 wagon/playard
URL——操作者后续规则有意覆盖该点；这些 URL 仍 200 且可被抓取。

## 4. 需在 GSC 内由所有者手动执行的操作

1. **重新提交 / 刷新 `sitemap.xml`（关键）。** GSC → 索引 › Sitemaps → 在现有 `sitemap.xml`
   条目上 ⋯ → **刷新**（或删除后重新添加）。线上文件现为 288 个 URL；这会把 URL 集合收缩
   告知 Google。
2. **验证 Breadcrumb 修复。** 索引 › Pages → Breadcrumbs 问题 → 确认示例 URL 无重复 →
   **验证修复**。（代码修复已上线；报告仅在校验后清除。）
3. **请求收录。** 对以下 URL 粘贴并请求收录：**首页**（触发 favicon 重新抓取）以及 §2 列出的
   **6 个主词 hub**。已收录的页面不要重复提交——节省配额。
4. **确认 wagon/playard 集群** 在 Page indexing 中现显示 **有效**（而非"存在重定向的网页"）。

## 5. 我未能执行的操作（及启用方式）

- **GSC API 实时拉取。** Search Console API 需要 OAuth（`hhool.student@gmail.com` 的刷新令牌）。
  提供的 "webmaster api key" 单独不够。启用方式：提供 GSC OAuth 客户端 ID/密钥 + 刷新令牌，
  或具有属性访问权限的服务账号 JSON。之后我即可拉取真实的 Coverage / Performance /
  URL  inspections 数据。
- **OpenPageRank 反向链接/权重指标。** 密钥被 IP 锁定（`403: 该免费 API 密钥绑定了其他 IP`）；
  本沙箱从不同 IP 连接。请在白名单 IP 上运行，或在 `keywordseverywhere.com/account/openpagerank`
  重新绑定密钥。

## 6. 不在范围内（收到但未使用的凭据）

按所采用的默认范围（仅 balancebiketoddler.com / kidsmobi），以下**未触动**：`soundbuttons.cc`
/ `soundbuttons.click` 凭据（NameCheap、Resend、Google OAuth 客户端密钥、该项目自己的
OpenPageRank 密钥）、GitHub PAT、R2 S3 访问/私密密钥，以及 Cloudflare 账户级令牌（此前仅用于
11-10 的 Worker 部署）。任何密钥均未写入内存或 `.env`。

---
*2026-11-10 生成，依据仓库内已提交的 GSC 导出处理并线上复核。GSC 侧实时操作（§4）需站点所有者登录。*
