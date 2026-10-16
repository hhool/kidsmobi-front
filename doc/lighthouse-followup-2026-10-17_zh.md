# Lighthouse 跟进修复 — 2026-10-17

承接 `doc/lighthouse-audit-2026-10-16.html`，落地该次审计的两个可执行发现：
详情页 CLS（0.554）与无障碍失败项（a11y 96–97）。

## 结果（本地 dist，Lighthouse 13.5.0）

| 页面 | a11y 修复前 | a11y 修复后 | CLS（详情页） |
|---|---|---|---|
| 首页 `/` | 96 | **100** | — |
| 品类 hub `/products/balance-bikes/` | 97 | **100** | — |
| 详情页（b0ccy6yrs8） | 96 | **100** | **0.554 → 0.000** |

CLS 另用 CDP `PerformanceObserver` 探针独立验证
（`tmp/lighthouse-2026-10-17/verify-final.mjs`）：详情路由 **零 layout-shift
条目**。MAIN 高度从骨架（1898px，页脚在首屏之下）→ 完整内容（6118px），
视口内没有任何可见元素移动。

## 1. 详情页 CLS — 三波渲染收敛

根因（上一轮 CDP 探针）：t≈330ms 水合后的 app 渲染空详情路由（CMS 数据未
返回、`selectedProduct === null`），`<main>` 塌缩到 80px 内边距，页脚在首屏
可见；随后页脚被推两次（80→400→5170）= CLS 0.554。

修复：

- **`src/components/ProductDetailSkeleton.tsx`（新增）** — 镜像详情页首屏
  结构的高骨架（面包屑 / 400px 媒体位 / 标题+CTA 列 / 内容卡）。在
  `activeTab === "product_detail" && !selectedProduct` 时渲染，并作为懒加载
  `DetailedProductView` chunk 的 Suspense fallback。首帧起页脚就在首屏之外，
  后续内容在屏下挂载。
- **`src/components/ProductCarousel.tsx`** — 空态改为保留 400px 轮播占位
  （脉冲占位块），不再 `return null`。

## 2. 无障碍 96/97/96 → 100/100/100

### 2a. 最大元凶：预渲染 shell 里未分层的 `a { color: #ea580c }`

`scripts/prerender-pages.ts` 注入的 `<style> a { color: #ea580c; } </style>`
**没有任何 cascade layer**。CSS 层叠规则中，未分层样式优先于所有 `@layer`
规则 —— 这一行覆盖了**全站所有 `<a>` 上的所有 Tailwind `text-*` 类**，锚点
一律被画成 #ea580c。这就是为什么剩余对比度失败全是 `<a>`、而其源码类名看着
明明是对的。

修复：shell 现在先声明 `@layer theme, base, components, utilities;`，并把
锚点颜色放进 `@layer utilities` —— 仍能盖过 preflight 的
`a { color: inherit }`（base 层），但会被任何 `text-*` 类覆盖。`body` 保持
未分层，确保当前背景观感完全不变。

### 2b. 颜色 token 修复

- **`src/index.css`** — `#primary_tab_viewport :is(.text-orange-500,
  .text-orange-600)` 强制为 `#c2410c`（orange-700，白底 5.2:1、orange-50 底
  4.9:1）。Tailwind v4 的 oklch orange-500（#ff6900）只有 2.88:1，远低于
  小字要求的 4.5:1。深色 hero 用的是 `text-orange-400` 不受影响；深色区块里
  唯一用 `text-orange-600` 的链接（EvaluationsSection CTA）单独钉为
  `text-orange-400`。
- **`text-slate-400` → `text-slate-600`**（v4 slate-400 #90a1b9 仅
  2.5–2.6:1）：五个浅色底组件 `ProductsSection`、`DetailedProductView`、
  `HomeSection`、`Breadcrumbs`、`common/CategoryComparisonTable`，以及
  `ProductCarousel` 计数器。
- **顶部导航**（在 CSS 覆盖作用域之外）：激活页签 `text-orange-500` →
  `text-orange-700`。
- **页脚**（深色 `bg-slate-900`）：方向是调亮而非调暗 —— `slate-500/600` →
  `slate-400`，货币值 `text-orange-500` → `orange-400`。
- **Cookie 弹窗**：Privacy Policy 链接 → `text-orange-700`；ACCEPT 按钮
  `bg-orange-500` → `bg-orange-700`（白字配 orange-500 仅 2.88:1）。
- **ProductsSection** 激活品类筛选按钮：`bg-orange-500 text-white` →
  `bg-orange-700 text-white`。

### 2c. 结构性 a11y

- **`td-has-header`**（hub 对比表）：所有 `<th>` 加 `scope="col"`；原本为
  空的最后一列表头补了 sr-only 的「Actions / 操作」标签（空表头无法关联
  单元格）。
- **`label-content-name-mismatch`**：首页 FEATURED 徽章按钮的 `aria-label`
  补入可见文本 "FEATURED"；hub 商品卡 `role="button"` 移除覆盖性的
  `aria-label`，让可访问名称从内容派生（简短 label 永远装不下富卡片全文）。

## 验证

- Lighthouse a11y：home/hub/detail = **100/100/100**，三者 `fails: []`。
- CDP 探针：详情页 CLS = **0.000**。
- 守卫：`check:spatitles` OK（28 页）、`check:spakeywords` OK（248 页 0 差
  异）、`check:claims` 0 findings、`check:reviewcounts` 0 findings。
- 构建基线不变：sitemap 247 URL、174 详情页、3/4/31 guide/news/review 详情。

可复用工具：`tmp/lighthouse-2026-10-17/{reaudit,verify-final}.mjs`。
