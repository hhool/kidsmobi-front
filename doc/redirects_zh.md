# `_redirects` —— 规则、限制，以及这个文件为什么长这样

`public/_redirects` 是源文件，而且现在是刻意保持精简的：只有 API 代理和五个裸
应用根。**retired-URL 301 家族已经不住在这里了**——它整体迁到了 Worker，因为
Pages 会给这个文件封顶并静默丢弃溢出的部分，而 Worker 的路由表没有行数预算。
详见下面「各层归属」。

## 各层归属

| 层 | 负责 | 原因 |
| --- | --- | --- |
| Worker `kidsmobi-api-v1` | 全部 retired-URL 301：legacy 类目目录（`/products/balance_bike` 等）、已废止的 `/products/other/` 桶、stage-1/2 裁剪 listing、改名后的 guide/news/review slug | 同一 zone 上 Workers 路由优先于 Pages，且路由表没有行数预算 |
| Pages `_redirects` | `/api/*` → store 宿主、五个裸应用根的 shell 重写 | 小而静态——它必须保持小，因为溢出是被静默丢弃的 |

前端仓库仍然**计算** Worker 用的映射表，这样只有一份真源、不会漂移：prerender
从线上 CMS 数据推导，并发布 `dist/data/legacy-redirects.json`（44 条精确 + 10
条前缀规则）。`scripts/sync_redirects_to_worker.mjs` 把该文件镜像到
`backend/api/worker/src/legacyRedirects.generated.ts`，并重写
`backend/api/worker/wrangler.toml` 里带标记的路由区块。

商品目录有任何变化后：

```
cd front && npm run build && node scripts/sync_redirects_to_worker.mjs
# 然后重新部署 Worker（需要 Cloudflare API token；本机不存任何凭证）
```

脚本产出的路由模式刻意很少，因为每个模式都会拦截真实流量，而 Worker 对任何它
不重定向的路径都返回 404：

- 每条 1:1 前缀规则一个 `<前缀>/*`（同时覆盖带尾斜杠的形式，因为 `*` 匹配空串）；
- 一条 `/products/other/*` 通配，让桶内逐商品的 301 及其尾斜杠形式都能到达处理器；
- 其余不被上述通配覆盖的精确规则各一条精确模式。

`/products/other/` 下不在映射表里的 id 会走 Worker 里一条**窄范围透传**：它们
一向是通过 Pages 自己的兜底拿到 SPA shell 的，所以 Worker 从 Pages 部署宿主把
shell 取回来，而不是就地答 404。宿主不能是 apex——那样会用同一条路由模式重新
进入 Worker，造成死循环。

## Pages 的真实行为（按踩过的顺序）

### 1. 匹配的 `_redirects` 规则**优先于静态资产树**

这是最重要、也最反直觉的一条：**一条规则一旦匹配，静态文件就再也轮不到**。
`/products/balance-bikes` 明明有 prerender 兄弟 `dist/products/balance-bikes/
index.html`，但只要 `/products/* / 200` 在文件里，请求就被重写劫走，静态文件
不会被 consult。

本文档早期版本写的是反的（「Pages 先解析 `/x.html` 再读 `_redirects`」）。
那条结论来自一组只覆盖**未知路径**的探针，从未测试过「通配规则对阵一个有
prerender 兄弟的路径」。2026-10-21 的部署把它证伪了，代价是 255 个页面
（见下节）。

### 2. 通配规则不能以 `/index.html` 为目标

如果一条规则的**源包含 `*`**，而**目标是 `/index.html`**，Pages 会把它
**静默丢弃，不报任何错**。Pages 把根文档暴露为 `/` 并把 `/index.html` 用 308
规范化到 `/`，所以这个目标永远解析不到，规则就被扔掉了。

而构建日志指向了一个完全不同的方向，具有误导性：

```
Found invalid redirect lines:
  - #1: /about /about.html 200!
    Valid status codes are 200, 301, 302 (default), 303, 307, or 308. Got 200!.
    Maximum number of dynamic rules supported is 100. Skipping remaining 63 lines of file.
```

`200!` 那批规则确实非法，已经删掉了。但「100 dynamic rules」这行是**障眼法**：
当时文件只有 73 条规则、21 条通配规则，离任何公开上限都差得远。把文件从
184 行 / 153 条压缩到 90 行 / 73 条，**一点效果都没有**——最后十条照样是死的。

定位到它的是一组对着线上打的探针：

| 规则 | 源 | 目标 | 状态码 | 结果 |
| --- | --- | --- | --- | --- |
| `/probe-a/*` | 通配 | `/index.html` | 200 | **404（被丢弃）** |
| `/probe-c/*` | 通配 | `/index.html` | 301 | **404（被丢弃）** |
| `/probe-h/*` | 通配 | `/about/` | 200 | 308 → `/about`（生效） |
| `/probe-e/x` | **精确** | `/index.html` | 200 | 308 → `/`（生效） |

只有「通配 + `/index.html`」这个组合会失效。精确源配该目标没问题，通配源配其他
目标也没问题，与规则在文件中的位置无关。

### 3. Pages 免费做的事

- **`/x/` → 308 → `/x`。** 尾斜杠由 Pages 自行规范化。只有当目标与去掉斜杠后的
  路径不同时（例如 retired URL 必须跳到**另一个** listing），尾斜杠规则才值得占一行。
- **`200!` 强制重写后缀不被支持**，Pages 以非法状态码为由拒绝它。

### 4. 行数封顶，溢出静默丢弃

Pages 给这个文件封顶（约 120 行 / 100 条动态规则），超出部分被丢弃，而构建
**不失败**——只在日志里留一行告警。这就是 retired-URL 家族必须搬去 Worker 的
原因：它是这个文件里唯一随商品目录增长的部分。

## 2026-10-21 P0：兜底从「死」变成「活」，吞掉 255 个 prerender 页面

时间线：

1. 上面第 2 条的修复把 SPA 前缀兜底的目标从 `/index.html` 改成 `/`。兜底
   **首次真正生效**。
2. 但规则一旦生效就匹配一切——包括有 prerender 兄弟的路径（第 1 条）。
3. 结果：269 条 sitemap URL 里 **255 条**返回首页 shell：首页 `<title>` +
   `<link rel="canonical" href="https://balancebiketoddler.com/">`。

线上实测（2026-10-21 01:51–02:10，自动化健康检查 r12）：

| 路径 | 期望 | 实际 |
| --- | --- | --- |
| `/products/balance-bikes/` 及 181 条商品/类目页 | 自身 title + 自指 canonical | 首页 shell |
| `/reviews/compare/*`、`/reviews/single/*`（33 条） | 同上 | 首页 shell |
| `/news/<类型>/*`（12 条） | 同上 | 首页 shell |
| `/guides/<分类>/*`（22 条，含 6 个 hub） | 同上 | 首页 shell |
| `/transparency/*`（7 条） | 同上 | 首页 shell |
| 裸 hub `/products` `/reviews` `/news` `/guides` `/about` | 自身 | 正常（裸路径不匹配 `<前缀>/*`） |
| 顶层 `/balance-bike-stability/` 等 | 自身 | 正常（不在任何前缀下） |

**两个历史数据完美佐证了这是新回归而非历史遗留**：GSC 收录数长期停在
**14/271**——正好等于当前能正常服务 prerender 的页面数；且「Alternate page
with proper canonical tag」组只有 9 条，如果 255 个首页副本早就存在，该组应该
是 ~250 条。

**为什么此前的验证都没发现**：

- 状态码探测只验 200——而首页 shell 也是 200。
- 水合探针读的是**水合后**的 DOM——SPA 会根据 URL 自行渲染正确内容，
  `curl` 拿到的 raw HTML 才是爬虫看到的东西。
- `site-health-check` 只查 title/canonical **是否存在**，不查**是否属于该页**。

修复：删掉整个 SPA 前缀兜底块，只保留五个裸应用根的**精确**重写。未知子路径
回到 404——这正是兜底被静默丢弃的那几周里网站的真实行为，因此不构成回归。
真正有价值的兜底（CMS 已发布但尚未构建的详情页）只能由 Worker 提供：它可以
查 D1 判断路径是否存在，再决定透传静态文件还是答 shell。`_redirects` 表达不了
「负向通配」，这是它的根本限制。

**防复制的检查**：`site-health-check.mjs` 新增 `prerender-meta-ownership`
断言——从 sitemap 抽各前缀下的嵌套路由，逐个取其 raw HTML 的 title 与
canonical，与首页签名比对。任何一条变成首页副本即 FAIL。该断言已用线上坏版本
反向验证过（10/10 命中）。

## 不变量

- **绝不让通配规则指向任何静态路径**（不只是 `/index.html`）。通配重写会遮住
  该前缀下**每一个** prerender 页面。由 `check:redirects`
  （`redirects-no-wildcard-static-target`）和 `check-seo-assets`
  （同名检查）双重强制。
- 只有**确无 prerender 兄弟**的路径才配重写，且必须是**精确源**。五个裸应用根
  （`/compare` `/auth` `/search` `/evaluations` `/transparency`）就是这种情况，
  由 `redirects-bare-roots-covered` 强制。
- 绝不再产出 `200!`——构建校验器直接拒绝。
- 文件保持 **100 行以内**（当前 29 行）。行数从来不是事故根因，而导致它增长的
  retired-URL 区块已经迁走——这个上限现在纯粹是报警余量。
- 未知子路径下的 404 是**正确语义**，不要为了消灭它 reintroduce 通配兜底。

## 调试备忘

- **不要**用 bundle hash 判断是否部署成功。本地构建会把 gitignore 的 `.env.local`
  里的 `VITE_*` 内联进去，本地与 CI 的 hash 永远对不上。改成在线上 chunk 里 grep
  特征串，或探测新构建独有的静态文件（如 `/data/legacy-redirects.json`）。
- 想确认一条规则到底有没有生效，直接探：`curl -s -o /dev/null -w
  '%{http_code} %{redirect_url}' --noproxy '*' <url>`。重写到 `/` 返回 200；重写到
  `/index.html` 返回 308 → `/`；被丢弃的规则返回 404。
- **验重定向必须验内容，不能只验状态码。** 至少抽一条嵌套 prerender 路由，
  比对 raw HTML 的 `<title>` 与 canonical 是否属于该页自身——
  `node scripts/seo/site-health-check.mjs` 现在每周自动做这件事。
- `Location` 是**绝对 URL** 的 301 来自 Worker；Pages `_redirects` 的 301 是相对
  路径。分不清是哪一层在响应时，看这个头就能定性。

## 相关文档

- `gsc-2026-10-21-stable-track_zh.md`（r12）——本事故的独立发现与影响评估，
  含 GSC 历史数据佐证。
- `redirects_en.md`——本文档的英文版。
