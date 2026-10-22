# 三个 hub 的水合态孤儿：主题索引页从未被真正链接

日期：2026-10-22
范围：`/guides`、`/news`、`/reviews` 三个栏目 hub 与其 12 个主题索引子页
结论：prerender 里"看起来有"的链接，水合后一条都不剩。修的是水合态，不是 prerender。

---

## 1. 起因

上一轮做完派生重复扫描后，我追问：扫描排除了商品页，那**链接层面**有没有同样的盲区。于是做了一次内链分布普查，把链接分成两层：

- `chrome`：`<nav>/<header>/<footer>` 里的链接（每页都有，几乎不传递上下文）
- `content`：正文里的链接（真正告诉爬虫"这页重要"的那一层）

结果里 `/guides/budget`、`/guides/risk`、`/guides/scenario`、`/guides/maintenance`、`/guides/special` 五页的 `content` 计数是 **0**。

## 2. 第一层误判（差一点就这么結了）

第一次统计给出"21 条 0 内链"，其中包含全部 7 个品类 hub 和 7 个资产页。这是**假的**：sitemap 里的 URL 保留尾斜杠（`/products/balance-bikes/`），而我把链接规范化成了无斜杠，两侧对不上。

改成两侧统一规范化、并剥离 `nav/header/footer` 之后，21 条塌缩成 11 条，且剩下的都是真孤儿。

**教训**：做链接普查时，URL 规范化必须在"链接侧"和"清单侧"用同一个函数，否则全表噪声。

## 3. 真正的发现：prerender 的链接活不到水合之后

`/guides` 的 prerender 里确实写着一行：

```
... in the library. Browse by topic: <a href="/guides/beginner">Beginner guides</a>.
```

只有 beginner 一条。而 `/news` 的同款代码列全了 4 个频道。看起来只是"guides 漏写了 5 个"。

但这一段在 `<div id="root">` 内部。本项目入口是 `createRoot().render()` 而非 `hydrateRoot`，**React 挂载时会替换掉 `#root` 的全部内容**——所以 prerender 写的任何东西，只要 SPA 不镜像，水合后就没了。

用无头 Chrome 抓水合后的真实 DOM 验证：

| 页面 | prerender 里的主题索引链接 | 水合后 |
|---|---|---|
| `/guides` | 1/6（只有 beginner） | **0/6** |
| `/news` | 4/4 | **0/4** |
| `/reviews` | 2/2 | **0/2** |

也就是说：三个 hub 在 Google 真正渲染到的那个 DOM 里，**一个主题索引页都没链**。12 个索引页全部只靠「自己子文章的面包屑」倒着进来。

而且 `/news`、`/reviews` 的根因和 `/guides` 还不一样——它们的 prerender 是完整的，坏在**频道切换用的是 `<button>`**，压根不是链接。

## 4. 处置

不是"补一行链接"，而是让链接存在于**水合后**的 DOM 里，且不能再靠手写清单漂移：

| 位置 | 改法 |
|---|---|
| `GuidesSection.tsx` | hub 区块加主题索引行，从 `GUIDES_TOPIC_PAGE_IDS` 派生（不是硬编码 6 条） |
| `prerender-pages.ts:1682` | `Browse by topic` 同样改为从 `GUIDES_TOPIC_PAGE_IDS` 派生，与 news 同款写法对齐 |
| `NewsSection.tsx` | 频道切换 `<button>` → `<a href="/news/<channel>">`，保留 `preventDefault` 与原地筛选，UI 零变化 |
| `EvaluationsSection.tsx` | single/compare 两个 `<button>` → `<a href="/reviews/single|compare">`，同上 |

后两处选择"把按钮改成真链接"而不是"另加一行链接"，是因为 UI 已经存在，加一行会重复；而按钮加 `href` + `preventDefault` 对用户体验没有任何影响，对爬虫则凭空多出一条真实链接。

## 5. 守卫：只查水合态

新增断言进 `hydration-probe.mjs`（CI 已经在跑这个探针，浏览器基础设施现成）：

```js
const HUB_TOPIC_CHILDREN = {
  '/guides': [...6 个], '/news': [...4 个], '/reviews': [...2 个],
};
```

在 `page.evaluate` 里收集全部 `a[href^="/"]`，逐个比对；缺任一条即 FAIL。

**为什么不在 prerender 上查**：这个项目已经栽过三次——守卫断言的往往是"我认为正确的写法"，而不是平台真正呈现的东西。这里尤其致命：prerender 侧查会全绿，而真实缺陷正是 prerender 存在、水合后消失。断言必须落在浏览器里跑完 React 之后的 DOM 上。

## 6. 反向验证

- **天然反证**：加完守卫第一次跑就红了 2 条 —— `/news` 缺 4 个、`/reviews` 缺 2 个。这是守卫在真实缺陷上亮红灯，不是人为注入。
- **针对 `/guides` 的注入反证**：`/guides` 是在加守卫之前就修好的，从没见它红过。给它的期望清单加一条不存在的 `/guides/REVERSE-VERIFY-BOGUS`，守卫立即报 `hub does not link its topic index(es) after hydration: /guides/REVERSE-VERIFY-BOGUS`，退出码 1。确认该路径不是空过。

## 7. 验证结果

- 水合探针 **38/38 通过**
- 水合后实测三个 hub 的链接：`/guides` 6/6、`/news` 4/4、`/reviews` 2/2
- 14 项静态守卫全绿、`tsc --noEmit` 0 错
- sitemap 仍 **270**，legacy 重定向仍 **46 exact + 10 prefix**

## 8. 复用的两条规则

1. **prerender 里有的链接，不等于线上有。** 本项目 `#root` 会被 React 整体替换，判"某页有没有链到某页"必须看浏览器水合后的 DOM，`curl` 和读 `dist/*.html` 都会给出错误答案。
2. **筛选器用 `<button>` 就是自断内链。** 任何"频道/分类/类型"切换 UI，都应该写成 `href` + `preventDefault` + 原地处理：用户无感，爬虫可见。
