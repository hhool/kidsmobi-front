# Front 脚本指南

本目录包含 CMS 初始化导入、媒体迁移、CMS 校验与性能检查相关的运维脚本。

## 命名规范

- 模式：`<domain>_<action>_<target>[_qualifier].mjs`
- 示例：
  - `cms_import_full_from_backend_v2.mjs`
  - `media_transfer_images_to_r2.mjs`
  - `smoke_cms_d1_endpoints.mjs`

## 脚本清单

| 脚本 | 用途 | 常用命令 |
| --- | --- | --- |
| `cms_import_full_from_backend_v2.mjs` | 将 backend `/api/v2` 数据导入 CMS 各集合并生成图片转存清单 | `npm run import:cms -- --perCategory=12 --manifestPath=./tmp/front_image_transfer_manifest.json` |
| `product_stage_specs_from_backend_v2.mjs` | 抓取 backend 产品全参数并落盘 raw/editable/publish 占位文件 | `npm run specs:stage:product:init` |
| `media_stage_images_local.mjs` | 先把 manifest 中图片下载到本地 `front/resource/`，用于目录结构确认（支持 targetPath 重写模式） | `npm run media:stage:local` |
| `media_transfer_images_to_r2.mjs` | 将 manifest 中的图片转存到 Cloudflare R2 | `npm run media:transfer:r2 -- --manifestPath=./tmp/front_image_transfer_manifest.json --skipExisting` |
| `generate_products_import_from_backend.mjs` | 生成 Product Center 可用的 JSON 导入文件 | `npm run import:generate -- --base=https://kidsmobi-api-v1.seaman-player.workers.dev --category=stroller --limit=20` |
| `smoke_cms_d1_endpoints.mjs` | 执行 CMS 只读冒烟检查 | `npm run cms:smoke -- --base=https://your-cms-api.example.com` |
| `regress_cms_d1_crud.mjs` | 执行 CMS 各集合 CRUD 回归检查 | `npm run cms:regress -- --base=https://your-cms-api.example.com` |
| `reset_cms_d1_a_scope.mjs` | 重置 A-scope CMS 基线数据 | `npm run cms:reset:a` |
| `sample_web_vitals.mjs` | 采集 Web Vitals 样本 | `npm run perf:sample` |
| `compare_web_vitals_trend.mjs` | 对比 Web Vitals 趋势与阈值 | `npm run perf:trend` |
| `verify_smartimage_sizes.mjs` | 校验 smart-image 尺寸产物 | `node scripts/verify_smartimage_sizes.mjs` |
| `seedProducts.ts` | 本地流程的产品种子数据脚本 | `npx tsx scripts/seedProducts.ts` |

## 推荐执行顺序（初始化导入 + 媒体迁移）

1. 先验证配置与端点：
   - `npm run cms:smoke -- --base=<cms-base>`
2. 一条命令执行初始化导入（默认线上 worker 基址）：
   - `npm run import:cms:init`
3. 一条命令执行“初始化导入 + 本地落地”（推荐首轮流程）：
   - `npm run import:cms:init:stage`
4. Dry run 导入（不写入）：
   - `npm run import:cms -- --dryRun --perCategory=5 --manifestPath=./tmp/front_image_transfer_manifest.dryrun.json`
5. 全量导入：
   - `npm run import:cms -- --perCategory=12 --manifestPath=./tmp/front_image_transfer_manifest.json`
6. 产品参数占位落盘（供后续人工编辑）：
   - `npm run specs:stage:product:init`
7. 先本地落地图片（推荐）：
   - `npm run media:stage:local`
8. 可选重写模式（按品类/产品/类型分层）：
   - `npm run media:stage:local:cpk`
9. 在 `front/resource/assets/backend-import/<importBatchId>/...` 下确认目录结构
10. 使用本地落地清单上传（仅本地文件）：
   - `npm run media:transfer:r2:staged`
11. 使用重写后的本地清单上传：
   - `npm run media:transfer:r2:staged:cpk`

## 说明

- npm 别名发布后，尽量保持脚本文件名稳定。
- 涉及大规模或潜在破坏性动作前，优先先跑 `--dryRun`。
- 媒体迁移报告输出路径：`./tmp/front_image_transfer_report.json`。
- 本地落地报告输出路径：`./tmp/front_image_stage_report.json`。
- 产品参数批次索引路径：`./resource/assets/backend-import/<importBatchId>/batch.index.json`。

## 导入审核规则

- 同一批次内同一 `productId + sourceCategoryId` 默认只允许 1 条主记录；`-dupN` 一律视为重复异常。
- `cover` 必须恰好 1 张。
- `gallery` 只允许普通展示图，不能混入 `manufacturer` 图。
- `manufacturer` 图必须保留独立角色，不得并入 `gallery`。
- `videos` 只接受真实视频资源，非视频条目一律标记为异常。
- 编辑字段、SEO 字段与标签为空时，默认需要复核，不可直接进入 CMS 发布。

## R2 命名方式

- 主路径模式：`resources/<resource-id>/<normalized-file-name>`
- 回退路径模式：`products/<product-id>/<kind>/<normalized-file-name>`
- `<resource-id>` 与 `<product-id>` 统一转换为小写 slug。
- `<kind>` 通常为 `cover` 或 `gallery`。
- 该命名可保证对象 key 在重复导入/重复上传时保持稳定，便于幂等执行。

## 本地落地路径模式

- `keep`：保持 manifest 原始 `targetPath`。
- `category-product-kind`：重写为 `categories/<category>/products/<product>/<kind>/<file>`，便于人工审核与多轮确认目录结构。

## 快速开始：从 Backend 导入初始数据

1. 进入 front 工作目录：
   - `cd front`
2. 执行一条命令初始化导入：
   - `npm run import:cms:init`
3. 验证结果：
   - 终端输出中检查 `counts` 与 `importStats`
   - 确认 manifest 文件存在：`./tmp/front_image_transfer_manifest.init.json`
