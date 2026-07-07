# CMS 建站初期数据注入操作手册

适用场景：
- 新站点初期，CMS 中某些分类（例如 kids_scooters）尚无已发布条目。
- 前台需要先可展示，再逐步补齐 CMS 精编内容。

## 一、目标

通过 CMS 管理台操作完成首轮数据注入，确保前台产品页可展示；并建立后续的可重复初始化流程。

## 二、前置条件

1. 已登录 Admin 账号。
2. CMS 管理台顶部状态显示：
- ENV: PRODUCTION（或目标环境）
- ROLE: ADMIN
- D1: CONNECTED
3. Worker API 可用。

## 三、推荐注入顺序（首次建站）

1. Products
2. Categories
3. Scenarios
4. Evaluations
5. Guides
6. News

说明：先注入 Products，可最快解除前台分类空白问题。

## 四、Products 注入操作（关键）

在 CMS 左侧进入 Products，使用 Centralized Ops Center：

1. 选择 Category：All。
2. 选择 Source：Worker。
3. 选择 Mode：Replace（首轮初始化建议 Replace，保证一致基线）。
4. 点击 Init。
5. 等待 total rows 更新。
6. 点击 Refresh 复核计数变化。

如果仅某分类缺失（例如 kids_scooters）：
1. 将 Category 切换为该分类（若支持分类过滤）。
2. Source 仍选 Worker。
3. Mode 选 Replace 或 Merge（建议：缺类补齐用 Merge）。
4. 点击 Init。

## 五、发布状态校验（防止前台无数据）

在 Products 列表页确认：
1. 目标分类存在记录（例如 kids_scooters）。
2. 记录状态为 published（或系统可前台可见状态）。
3. 至少有封面图和基础字段（name/categoryId）。

## 六、前台回归检查

回归 URL：
- https://dev.kidsmobi.pages.dev/products/kids_scooters
- https://dev.kidsmobi.pages.dev/products/balance_bike

通过标准：
1. 页面存在产品卡片。
2. 不出现 No matches in global database。
3. 切换分类后仍有数据。

## 七、当前代码侧兜底策略（已生效）

当前前端已实现：
1. CMS 有已发布数据时，优先使用 CMS。
2. 若 CMS 缺失某分类，会按分类粒度从 fallback 数据源自动补齐。

这意味着：
- 建站初期即使 CMS 没有 kids_scooters 发布条目，前台仍可显示该分类。
- CMS 补齐后会继续以 CMS 为主。

## 八、常见问题与处理

1. 问题：Init 后前台仍空白。
处理：
- 先点击 Refresh，确认行数变化。
- 检查目标分类是否真的有 published 条目。
- 强刷前台页面（无痕窗口）。

2. 问题：某分类数据被替换后减少。
处理：
- 缺类补齐优先使用 Merge。
- 全量重建基线才使用 Replace。

3. 问题：compare 调用报 ProductNotFound。
处理：
- 使用当前实时 products 列表中的 productId，不要写死历史 ID。

## 九、建议的发布门禁

每次注入后执行：
1. 前台目标分类页面可见性回归。
2. API 冒烟与契约一致性回归（参考 backend 文档）。

完成标准：
- 前台分类可见。
- API 冒烟通过。
- 关键分类在 CMS 中有可追踪条目。
