# `_redirects` —— 规则、限制，以及这个文件为什么长这样

`public/_redirects` 是源文件，而且现在是刻意保持精简的：只有 API 代理、五个裸
应用根，以及 SPA 前缀兜底。**retired-URL 301 家族已经不住在这里了**——它整体迁到
了 Worker，因为 Pages 会给这个文件封顶并静默丢弃溢出的部分，而 Worker 的路由表
没有行数预算。详见下面「各层归属」。

## 各层归属

| 层 | 负责 | 原因 |
| --- | --- | --- |
| Worker `kidsmobi-api-v1` | 全部 retired-URL 301：legacy 类目目录（`/products/balance_bike` 等）、已废止的 `/products/other/` 桶、stage-1/2 裁剪 listing、改名后的 guide/news/review slug | 同一 zone 上 Workers 路由优先于 Pages，且路由表没有行数预算 |
| Pages `_redirects` | `/api/*` → store 宿主、五个裸应用根、SPA 前缀兜底 | 小而静态——它必须保持小，因为溢出是被静默丢弃的 |

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
一向是通过 Pages 自己的 `/products/*` 兜底拿到 SPA shell 的，所以 Worker 从
Pages 部署宿主把 shell 取回来，而不是就地答 404。宿主不能是 apex——那样会用同一
条路由模式重新进入 Worker，造成死循环。

## 真正踩到的坑：通配规则不能以 `/index.html` 为目标

如果一条 `_redirects` 规则的**源包含 `*`**，而**目标是 `/index.html`**，Pages 会
把它**静默丢弃，不报任何错**。Pages 把根文档暴露为 `/` 并把 `/index.html` 用 308
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

真正定位到它的是一组对着线上打的探针：

| 规则 | 源 | 目标 | 状态码 | 结果 |
| --- | --- | --- | --- | --- |
| `/probe-a/*` | 通配 | `/index.html` | 200 | **404（被丢弃）** |
| `/probe-c/*` | 通配 | `/index.html` | 301 | **404（被丢弃）** |
| `/probe-h/*` | 通配 | `/about/` | 200 | 308 → `/about`（生效） |
| `/probe-e/x` | **精确** | `/index.html` | 200 | 308 → `/`（生效） |

只有「通配 + `/index.html`」这个组合会失效。精确源配该目标没问题，通配源配其他
目标也没问题，与规则在文件中的位置无关。

由于被丢弃的整块正是 SPA 兜底，线上影响是：

| 路径 | 预期 | 实际 |
| --- | --- | --- |
| `/compare` `/auth` `/search` `/evaluations` `/transparency` | 200 shell | **404** |
| 上次部署后在 CMS 新发布的任何 guide / news / review 详情页 | 200 shell | **404** |

所以这个文件里的重写目标必须是 `/`，绝不能是 `/index.html`。

值得记住的一点：曾经有一条守卫在**主动固化**这个错误写法。
`check-seo-assets` 断言每个应用路由前缀都要重写到 `/index.html`，等于每次重新生
成文件时都把 bug 钉回去。守卫断言的是其作者「认为正确」的写法，不等于平台真正
接受的写法——它的断言需要拿线上真实行为反证。

## Pages 免费就做的事

有两个行为意味着大多数重写规则从来什么都没干：

1. **`/x` → `/x.html`。** Pages 在查 `_redirects` **之前**先按静态资源树解析请求。
   每个 prerender 路由都已有对应 `.html` 文件，所以为它们写的精确重写都是白占行数。
2. **`/x/` → 308 → `/x`。** 尾斜杠由 Pages 自行规范化。只有当目标与去掉斜杠后的
   路径不同时（例如 retired URL 必须跳到**另一个** listing），尾斜杠规则才值得占一行。

还有一件它**不支持**的事：**`200!` 强制重写后缀**。Pages 以非法状态码为由拒绝它，
这就是那批重写从未生效的原因。

## 不变量

- **绝不让通配规则指向 `/index.html`**，目标写 `/`。由 `check:redirects`
  （`redirects-no-index-html-target`）强制。
- 绝不再产出 `200!`——构建校验器直接拒绝。
- 绝不为已 prerender 的路径加规则；静态文件先赢。
- 文件保持 **100 行以内**（当前 38 行）。行数从来不是事故根因，而导致它增长的
  retired-URL 区块已经迁走——这个上限现在纯粹是报警余量。
- SPA 前缀块（`/products/*`、`/reviews/*`……）必须留在**最后**。不要换成全局兜底：
   那会让所有未知路径——包括域名前主人留下的 `/panties/*.php` 这类垃圾流量——
   都拿到首页 shell 和 200，而 `_redirects` 没有 404 重写可以补偿。
- 前缀集合与客户端路由在 `src/App.tsx`（`resolveRouteState`）里解析的根保持一致。
  它们之外的路径本来就会渲染应用内「未找到」视图，所以在边缘 404 不会丢任何东西。

## 调试备忘

- **不要**用 bundle hash 判断是否部署成功。本地构建会把 gitignore 的 `.env.local`
  里的 `VITE_*` 内联进去，本地与 CI 的 hash 永远对不上。改成在线上 chunk 里 grep
  特征串。
- 想确认一条规则到底有没有生效，直接探：`curl -s -o /dev/null -w
  '%{http_code} %{redirect_url}' --noproxy '*' <url>`。重写到 `/` 返回 200；重写到
  `/index.html` 返回 308 → `/`；被丢弃的规则返回 404。
- `Location` 是**绝对 URL** 的 301 来自 Worker；Pages `_redirects` 的 301 是相对
  路径。这是分辨「哪一层在应答」最快的办法。
- Cloudflare Pages 构建不是 GitHub Actions 作业。GH Actions 工作流只跑质量门和缓存
  purge；Pages 构建日志在 Cloudflare 面板里。
