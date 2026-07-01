# Admin 后台线上演示脚本（中文）

## 演示目标
- 展示 Product Center、Guide、News 的完整编辑与资源联动流程。
- 展示 backend 资源可视化选择与场景可视化选择。
- 展示上线前健康检查能力。

## 演示环境
- 生产站点：https://kidsmobi.pages.dev
- 最新预览站点：https://e7661ce7.kidsmobi.pages.dev
- Worker API：使用配置好的 `VITE_SCRAPE_API_BASE_URL` 或 `SCRAPE_KIDSMOBILE_API_BASE_URL`

## 演示前检查（1 分钟）
1. 进入 Admin 后台。
2. 打开 Dashboard。
3. 查看“线上依赖健康检查”卡片：
- 站点可访问：Pass
- Worker API：Pass
- CMS 读能力：Pass
4. 若非 Pass，点击“重新检查”。
5. 点击“导出演示快照”，生成当前演示状态的 Markdown 记录（可留档/发群）。

## 演示脚本（建议 8-12 分钟）

### 1. Product Center：资源可视化选取
1. 进入 Products。
2. 打开任意产品编辑页。
3. 演示以下按钮：
- 从 backend 资源选择封面
- 从 backend 资源选择图库
- 从 backend 资源选择视频
- 从 backend 资源选择（相似）产品
4. 点击应用后，展示字段自动回填结果。
5. 保存并发布。

### 2. Guide：跨模块关联 + 场景可视化选取
1. 进入 Guides。
2. 打开任意 Guide 编辑页。
3. 演示：
- 从 backend 资源选择封面图
- 从 backend 资源选择关联产品
- 可视化选择场景（Scenario Picker）
4. 展示 scenarioIds 与 relatedProductIds 回填。
5. 保存并发布。

### 3. News：跨模块关联 + 场景可视化选取
1. 进入 News。
2. 打开任意 News 编辑页。
3. 演示：
- 从 backend 资源选择封面图
- 从 backend 资源选择关联产品
- 可视化选择场景（Scenario Picker）
4. 展示回填与 SEO 区域。
5. 保存并发布。

## 验收标准
- 资源选择器可正常加载数据并可搜索。
- 场景选择器卡片可多选并回填。
- Product、Guide、News 三处均可完成保存。
- Dashboard 健康检查可显示当前链路状态。

## 常见问题与处理
- 资源列表为空：检查 Worker API 可达性与 CORS。
- 发布失败（权限不足）：需要使用真实管理员 Firebase Auth 登录。
- 线上页面可开但数据异常：优先查看 Dashboard 健康检查状态。
