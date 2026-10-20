# `_redirects` —— 规则、限制，以及这个文件为什么长这样

`public/_redirects` 是源文件；构建时 `scripts/prerender-pages.ts` 会把生成的
retired-URL 区块注入 `dist/_redirects`。

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
当前文件只有 73 条规则、21 条通配规则，离任何公开上限都差得远。把文件从
184 行 / 153 条压缩到 90 行 / 73 条，**一点效果都没有**——最后十条照样是死的。

真正定位到它的是一组对着线上打的探针：

| 规则 | 源 | 目标 | 状态码 | 结果 |
| --- | --- | --- | --- | --- |
| `/probe-a/*` | 通配 | `/index.html` | 200 | **404（被丢弃）** |
| `/probe-c/*` | 通配 | `/index.html` | 301 | **404（被丢弃）** |
| `/probe-h/*` | 通配 | `/about/` | 200 | 308 → `/about`（生效） |
| `/probe-e/x` | 精确 | `/index.html` | 200 | 308 → `/`（生效） |

只有「通配 `*` + `/index.html`」这个组合会失效。精确源配这个目标没问题；通配源配
其它目标也没问题。与文件里的位置无关。

被丢掉的正好就是 SPA 兜底块，因此线上影响是：

| 路径 | 预期 | 实际 |
| --- | --- | --- |
| `/compare`、`/auth`、`/search`、`/evaluations`、`/transparency` | 200 外壳 | **404** |
| 上次部署之后在 CMS 发布的任何指南 / 新闻 / 评测详情页 | 200 外壳 | **404** |

所以本文件里的重写规则**必须指向 `/`，绝不能指向 `/index.html`**。

## Pages 免费帮你做的事

以下两个行为说明大部分重写规则从来就没起过作用：

1. **`/x` → `/x.html`。** Pages 在查阅 `_redirects` **之前**就先拿请求去匹配静态资源树。
   每个预渲染路由都已经有 `.html` 文件，因此针对它们的精确重写规则都是白占行数。
2. **`/x/` → 308 → `/x`。** 尾斜杠是它自己规范化的。只有当目标**不等于**去掉尾斜杠
   后的路径时（例如必须落到另一个 listing 的 retired URL），尾斜杠重定向规则才值
   得占一行。

还有一个它**不支持**的东西：**`200!` 强制重写后缀**。Pages 把它当非法状态码拒收，
这正是那批重写规则从未生效的原因。

## 不变式

- **绝不能让通配规则指向 `/index.html`。** 目标要写 `/`。由 `check:redirects` 的
  `redirects-no-index-html-target` 强制。
- 再也不要输出 `200!` —— 校验器会拒。
- 绝不要为已预渲染的路径加规则；静态文件优先命中。
- 文件保持在 **100 行以内**。行数从来就不是这次故障的成因，但生成的 retired-URL
  区块会随商品目录增长，所以保留上限是为了防止它在无人注意的情况下持续膨胀。
- SPA 前缀块（`/products/*`、`/reviews/*` 等）保持在**最后**。不要换成全局 catch-all：
  那会让所有未知路径——包括域名前任主人遗留的 `/panties/*.php` 之类垃圾路径——
  都返回首页外壳和 200，而 `_redirects` 没有 404 重写来兜底。
- 前缀清单必须与客户端路由在 `src/App.tsx`（`resolveRouteState`）里解析的根保持一致。
  清单之外的路径本来就会渲染应用内「未找到」视图，所以在边缘返回 404 不损失任何东西。

## retired-URL 301 的来源

- 阶段一 / 阶段二裁剪掉的 listing：`src/data/prunedProducts.generated.ts` 与
  `src/data/prunedVariantProducts.generated.ts`，由 `scripts/sync_prune_map_to_worker.mjs`
  同步进 Worker。这批**不再输出到本文件**——Worker 作为第一层已经带了精确的一对
  （无尾斜杠 + 带尾斜杠），而且它没有行数预算；重复输出正是本文件当初超预算的原因。
- 重新归位的 legacy `other` bucket 详情页与 legacy 类目根：
  `scripts/prerender-pages.ts` 里的 `LEGACY_CATEGORY_301S`。

Worker 对它拥有 apex `routes` 的路径是第一层
（`backend/api/worker/wrangler.toml`）；本文件里的这些行是 Worker 不在请求路径上时的兜底。

## 调试备忘

- **不要**用比对 bundle hash 来判断是否部署成功。本地构建会把 gitignore 的
  `.env.local` 里的 `VITE_*` 内联进去，所以本地与 CI 的 hash 永远不相等。
  改为在线上 chunk 里 grep 特征字符串。
- 想知道某条规则到底生效没有，直接探测：`curl -s -o /dev/null -w
  '%{http_code} %{redirect_url}' --noproxy '*' <url>`。重写到 `/` 返回 200；
  重写到 `/index.html` 返回 308 → `/`；被丢弃的规则返回 404。
- Cloudflare Pages 的构建不是 GitHub Actions job。GH Actions 工作流只跑质量门和
  缓存清除；Pages 的构建日志在 Cloudflare 控制台里。
