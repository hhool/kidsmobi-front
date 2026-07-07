# Cloudflare D1 建站初期注入修复手册（含 kids_scooters）

适用问题：
- CMS 控制台看起来有 products 行数，但前台 `kids_scooters` 仍不显示。
- D1 中注入后数据可查，但 `onlyPublished=1` 读取为空。

## 一、根因要点

1. 前台产品读取默认走“仅已发布”数据（`onlyPublished=1`）。
2. 若 D1 注入记录是 `status=draft`，前台会当作不可见。
3. 建站初期如果 `kids_scooters` 未注入/未发布，会出现该分类空态。

## 二、本次代码修复（已落地）

文件：`front/src/apiServer.ts`

修复内容：
- `ops init(products, source=worker)` 写入 D1 时，产品 `status` 改为 `published`（由 `draft` 改为 `published`）。

效果：
- 建站初期通过 CMS Ops Init 注入的产品可立即被前台读取。

## 三、控制台操作注入（推荐）

在 CMS -> Products -> Centralized Ops Center：

1. Category: `All`
2. Source: `Worker`
3. Mode:
- 首次全量：`Replace`
- 缺类补齐：`Merge`
4. 点击 `Init`
5. 点击 `Refresh`

针对 `kids_scooters` 缺失：
- 若 UI 支持分类过滤，切到对应分类后再次 Init（建议 Merge）。

## 四、D1 直查 SQL（Cloudflare Dashboard -> D1 Studio -> Query）

1. 检查 products 总量
```sql
SELECT COUNT(*) AS total
FROM cms_records
WHERE collection = 'products';
```

2. 检查已发布 products 数量
```sql
SELECT COUNT(*) AS published_total
FROM cms_records
WHERE collection = 'products'
  AND json_extract(payload, '$.status') = 'published';
```

3. 检查 scooters/kids_scooters 记录
```sql
SELECT id,
       json_extract(payload, '$.categoryId') AS category_id,
       json_extract(payload, '$.category') AS category,
       json_extract(payload, '$.status') AS status,
       updated_at
FROM cms_records
WHERE collection = 'products'
  AND (
    lower(json_extract(payload, '$.categoryId')) IN ('kids_scooters', 'scooters')
    OR lower(json_extract(payload, '$.category')) IN ('scooter', 'kids_scooters')
  )
ORDER BY updated_at DESC
LIMIT 100;
```

## 五、D1 批量修复 SQL（历史 draft 升级为 published）

如已确认仅用于建站初期基线，可执行：

```sql
UPDATE cms_records
SET payload = json_set(payload, '$.status', 'published'),
    updated_at = datetime('now')
WHERE collection = 'products'
  AND coalesce(json_extract(payload, '$.status'), 'draft') <> 'published';
```

仅修复 scooters 相关：

```sql
UPDATE cms_records
SET payload = json_set(payload, '$.status', 'published'),
    updated_at = datetime('now')
WHERE collection = 'products'
  AND (
    lower(json_extract(payload, '$.categoryId')) IN ('kids_scooters', 'scooters')
    OR lower(json_extract(payload, '$.category')) IN ('scooter', 'kids_scooters')
  );
```

## 六、API 注入方式（可脚本化）

通过前端服务 API（同域或配置的 CMS API base）执行：

1. 初始化 products（worker 源）
```bash
curl -X POST "https://dev.kidsmobi.pages.dev/api/cms/ops/init" \
  -H "content-type: application/json" \
  -d '{"collection":"products","source":"worker","mode":"replace"}'
```

2. 查看概览
```bash
curl "https://dev.kidsmobi.pages.dev/api/cms/ops/overview"
```

3. 检查 products（仅已发布）
```bash
curl "https://dev.kidsmobi.pages.dev/api/cms/products?onlyPublished=1"
```

### 6.1 若命中 403 / 鉴权阻断（常见）

当你从本地终端直连 `/api/cms/*` 遇到 403（通常由 Worker 访问策略或鉴权导致）时，改用以下路径：

1. CMS 控制台按钮路径（推荐）
- Products -> Centralized Ops Center -> Source=Worker -> Mode=Replace/Merge -> Init。

2. D1 Studio SQL 路径
- 在 Cloudflare Dashboard -> D1 Studio 执行本手册第 4/5 节 SQL。

3. 结论
- 403 不代表数据模型错误；通常是接口访问边界问题。

## 七、前台回归

```text
https://dev.kidsmobi.pages.dev/products/kids_scooters
https://dev.kidsmobi.pages.dev/products/balance_bike
```

通过标准：
1. 有产品卡片。
2. 无 No matches in global database。
3. 切换分类不丢数据。

## 八、建议

1. 建站首日：Products 用 Replace 做全量基线。
2. 后续日常：缺类/增量用 Merge。
3. 发布前：执行 API 冒烟与 parity 回归。

## 九、回滚 SQL（可逆操作）

若你需要回滚本次 scooters 发布状态提升（仅 scooters）：

```sql
UPDATE cms_records
SET payload = json_set(payload, '$.status', 'draft'),
    updated_at = datetime('now')
WHERE collection = 'products'
  AND (
    lower(coalesce(json_extract(payload, '$.categoryId'), '')) IN ('kids_scooters', 'scooters')
    OR lower(coalesce(json_extract(payload, '$.category'), '')) IN ('scooter', 'kids_scooters')
  );
```

说明：
- 回滚后前台读取 `onlyPublished=1` 时会隐藏这些记录。

## 十、一键核查 SQL 套件（执行后）

1. scooters 已发布数量
```sql
SELECT COUNT(*) AS scooters_published
FROM cms_records
WHERE collection = 'products'
  AND json_extract(payload, '$.status') = 'published'
  AND (
    lower(coalesce(json_extract(payload, '$.categoryId'), '')) IN ('kids_scooters', 'scooters')
    OR lower(coalesce(json_extract(payload, '$.category'), '')) IN ('scooter', 'kids_scooters')
  );
```

2. 最近 20 条 scooters 记录状态
```sql
SELECT id,
       json_extract(payload, '$.categoryId') AS category_id,
       json_extract(payload, '$.category') AS category,
       json_extract(payload, '$.status') AS status,
       updated_at
FROM cms_records
WHERE collection = 'products'
  AND (
    lower(coalesce(json_extract(payload, '$.categoryId'), '')) IN ('kids_scooters', 'scooters')
    OR lower(coalesce(json_extract(payload, '$.category'), '')) IN ('scooter', 'kids_scooters')
  )
ORDER BY updated_at DESC
LIMIT 20;
```
