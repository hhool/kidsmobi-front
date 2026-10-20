# `_redirects` —— 规则、上限，以及文件为何长这样

`public/_redirects` 是源文件；构建时 `scripts/prerender-pages.ts` 会把生成的
retired-URL 区块注入 `dist/_redirects`。

## 坑过我们的那个上限

Cloudflare Pages 自上而下解析这个文件，并静默**丢弃大约第 120 行之后的所有内容**。
构建不会失败，只会在日志里写：

```
Found invalid redirect lines:
  - #1: /about /about.html 200!
    Valid status codes are 200, 301, 302 (default), 303, 307, or 308. Got 200!.
    Maximum number of dynamic rules supported is 100. Skipping remaining 63 lines of file.
```

由于 SPA fallback 必须放在**最后**（前缀重写要让位于上方的精确规则），一旦超限，
最先被吃掉的就是 fallback。生产环境表现为：

| 路径 | 期望 | 实际 |
| --- | --- | --- |
| `/compare` `/auth` `/search` `/evaluations` `/transparency` | 200 shell | **404** |
| 上次部署之后才在 CMS 发布的指南 / 新闻 / 评测详情页 | 200 shell | **404** |

## Pages 已经免费替我们做的事

有两条行为意味着大多数重写规则其实一直是空转：

1. **`/x` → `/x.html`。** Pages 在查阅 `_redirects` **之前**先用静态资源树解析请求。
   每个预渲染路由都有对应的 `.html` 文件，因此为它们写的精确重写规则都是白占行数。
2. **`/x/` → 308 → `/x`。** 尾斜杠由平台自行规范化。只有当跳转目标与去掉斜杠后的路径
   **不同**时（例如已下架 URL 需要落到另一个 listing），尾斜杠规则才值这一行。

还有一件 Pages **不**支持的事：**`200!` 强制重写后缀**。Pages 认为它是非法状态码，
这也是那五条 app-root 规则从未生效的原因。

## 不变量

- 文件保持在 **110 行以内**，由 `npm run check:redirects` 强制。
- 不再输出 `200!` —— 校验器会拒绝。
- 不为已预渲染的路径添加规则；静态文件会先命中。
- SPA 前缀区块（`/products/*`、`/reviews/*` ……）保持**最后**。不要用
  `/* /index.html 200` 取代它：全局兜底会把所有未知路径（包括上一个域名所有者遗留的
  `/panties/*.php` 之类的垃圾流量）都用首页 shell 配 200 应答，而 `_redirects`
  没有 404 重写可以补救。
- 前缀与 `src/App.tsx` 里 `resolveRouteState` 实际解析的根保持一致；落在这些前缀之外的
  路径本来就会渲染应用内的「未找到」视图，因此在边缘返回 404 并无损失。

## retired-URL 301 的来源

- Stage-1/stage-2 裁剪掉的 listing：`src/data/prunedProducts.generated.ts` 与
  `src/data/prunedVariantProducts.generated.ts`，由
  `scripts/sync_prune_map_to_worker.mjs` 镜像进 Worker。
- 重新归类的旧 `other` 桶详情页与旧品类根：`scripts/prerender-pages.ts` 里的
  `LEGACY_CATEGORY_301S`。

Worker 以完全相同的精确路由作为第一层（apex `routes`，见
`backend/api/worker/wrangler.toml`），因此 `_redirects` 里这些行是 Worker 不在
请求路径上时的兜底。
