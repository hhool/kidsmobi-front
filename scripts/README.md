# Front Scripts Guide

This folder contains operational scripts for CMS bootstrap, media migration, CMS validation, and performance checks.

## Naming Convention

- Pattern: `<domain>_<action>_<target>[_qualifier].mjs`
- Examples:
  - `cms_import_full_from_backend_v2.mjs`
  - `media_transfer_images_to_r2.mjs`
  - `smoke_cms_d1_endpoints.mjs`

## Script Catalog

| Script | Purpose | Typical Command |
| --- | --- | --- |
| `cms_import_full_from_backend_v2.mjs` | Import backend `/api/v2` data into CMS collections and generate image manifest | `npm run import:cms -- --perCategory=12 --manifestPath=./tmp/front_image_transfer_manifest.json` |
| `cms_safe_replace_from_export.mjs` | Safe wrapper for `cms_replace_from_export.mjs`; blocks empty-collection replace by default unless explicitly allowed | `npm run cms:replace:safe -- --base=https://kidsmobi-api-v1.seaman-player.workers.dev --input=../backend/env/cms-export.json --mode=replace --collections=products --apply` |
| `media_stage_images_local.mjs` | Download manifest images to local `front/resource/` for structure review before upload (supports target path rewrite mode) | `npm run media:stage:local` |
| `media_transfer_images_to_r2.mjs` | Transfer manifest images into Cloudflare R2 | `npm run media:transfer:r2 -- --manifestPath=./tmp/front_image_transfer_manifest.json --skipExisting` |
| `generate_products_import_from_backend.mjs` | Generate Product Center JSON import payload | `npm run import:generate -- --base=https://kidsmobi-api-v1.seaman-player.workers.dev --category=stroller --limit=20` |
| `smoke_cms_d1_endpoints.mjs` | Read-only CMS endpoint smoke checks | `npm run cms:smoke -- --base=https://your-cms-api.example.com` |
| `regress_cms_d1_crud.mjs` | CRUD regression checks for CMS collections | `npm run cms:regress -- --base=https://your-cms-api.example.com` |
| `reset_cms_d1_a_scope.mjs` | Reset A-scope CMS baseline data | `npm run cms:reset:a` |
| `sample_web_vitals.mjs` | Capture Web Vitals samples | `npm run perf:sample` |
| `compare_web_vitals_trend.mjs` | Compare Web Vitals trend/gate | `npm run perf:trend` |
| `m3_gray_release_preflight.mjs` | Run M3 API guardrail preflight (single-category bundle + all=1 authorization gate) and output report files | `npm run m3:preflight -- --base=https://kidsmobi.pages.dev --category=stroller` |
| `m3_official_token_gate_check.mjs` | Run official-token strict gate check (preflight + snapshot) in one command | `CMS_ADMIN_ALL_TOKEN=<official-token> npm run m3:preflight:official -- --base=<target-host> --category=stroller` |
| `m3_generate_decision_snapshot.mjs` | Aggregate latest M3 preflight reports and generate a GO/HOLD/NO-GO suggestion snapshot | `npm run m3:snapshot` |
| `verify_smartimage_sizes.mjs` | Validate smart-image size outputs | `node scripts/verify_smartimage_sizes.mjs` |
| `seedProducts.ts` | Seed product data for local workflows | `npx tsx scripts/seedProducts.ts` |
| `product_enrich_zh_from_export.mjs` | Batch-generate zh product copy (name/description/verdict/specs) with coverage report | `node scripts/product_enrich_zh_from_export.mjs --input=../env/cms-export.json --start=1 --count=30 --report=./tmp/zh-batch-1-report.json` |

## Recommended Execution Order (Bootstrap + Media)

1. Validate config and endpoints:
   - `npm run cms:smoke -- --base=<cms-base>`
2. One-command init bootstrap (default production worker base):
   - `npm run import:cms:init`
3. One-command init + local stage (recommended first upload workflow):
   - `npm run import:cms:init:stage`
4. Dry run import:
   - `npm run import:cms -- --dryRun --perCategory=5 --manifestPath=./tmp/front_image_transfer_manifest.dryrun.json`
5. Full import:
   - `npm run import:cms -- --perCategory=12 --manifestPath=./tmp/front_image_transfer_manifest.json`
6. Stage assets locally first (recommended):
   - `npm run media:stage:local`
7. Optional rewrite mode (category/product/kind):
   - `npm run media:stage:local:cpk`
8. Review local directory structure under `front/resource/assets/backend-import/<importBatchId>/...`
9. Upload using staged manifest (local-only):
   - `npm run media:transfer:r2:staged`
10. Upload using rewritten staged manifest:
   - `npm run media:transfer:r2:staged:cpk`

## Batch zh Enrichment (150-180 scale)

Use `product_enrich_zh_from_export.mjs` in batches to avoid one-shot risk and keep review manageable.

Examples:

```bash
# 1) Dry-run first 30 products, report only
node scripts/product_enrich_zh_from_export.mjs \
   --input=../env/cms-export.json \
   --start=1 --count=30 \
   --dry-run \
   --report=./tmp/zh-batch-1-report.json

# 2) Apply batch 1 (write enriched export)
node scripts/product_enrich_zh_from_export.mjs \
   --input=../env/cms-export.json \
   --start=1 --count=30 \
   --output=./tmp/cms-export.zh-batch-1.json \
   --report=./tmp/zh-batch-1-report.json

# 3) Apply batch 2 using same source range shift
node scripts/product_enrich_zh_from_export.mjs \
   --input=../env/cms-export.json \
   --start=31 --count=30 \
   --output=./tmp/cms-export.zh-batch-2.json \
   --report=./tmp/zh-batch-2-report.json
```

New flags:

- `--start=<n>`: 1-based start index for batch processing.
- `--count=<n>`: number of products in this batch.
- `--dry-run`: writes report only; does not write enriched export.
- `--limit=<n>`: backward-compatible alias for `--count` when `--start=1`.

Brand rule:

- Brand names are preserved from source and are not translated into Chinese.
- The script now records a brand-preservation block reason if `zh.brandText` diverges from detected source brand.

## Quality Gates (CI: `.github/workflows/quality-gates.yml`)

每次 push/PR 与每周一 09:00 (GMT+8) 定时运行的全维度检测。7 个 job：

| Job | 维度 | 内容 |
| --- | --- | --- |
| ① `diff-review` | 代码审核 | `scripts/ci/diff-review.mjs`：对本次 diff 风险分级 + 规则模式审核（诚实宣称 / UiStrings `as const` / canonical 绕过 / TDK 超限 / 密钥字面量 / CMS 写脚本缺 token / infra 爆炸半径）。纯 git+node，秒级，无需安装依赖 |
| ② `static-gates` | 快速门 | `check:lazyexports`（React #306 类）、`tsc --noEmit`、`seo:check`（robots/sitemap/_redirects） |
| ③ `build-gates` | 构建门 | build（`PRERENDER_ALLOW_STALE=1`）+ dist 守卫：`check:content` / `check:reviewcounts` / `check:spatitles` / `check:spakeywords` / `check:spacanonicals` / `check:claims` / `check:links` / `check:titles` |
| ④ `hydration` | 水合探针 | 本地起 dist 静态服务，Playwright 逐路由查 "Page Recovery Mode" / pageerror（curl 类守卫看不见的失败类） |
| ⑤ `weekly-audit` | 线上审计（仅定时） | `seo:health` / `seo:geo` / `seo:keywords` 只读报告，附件保留 30 天 |
| ⑥ `hydration-live` | 生产探针（仅定时） | 直接探测生产站水合状态 |
| ⑦ `alert` | 告警（仅定时） | 任一 job 失败 → 自动开/续 `[ci-alert]` issue |

本地手动跑（与 CI 同一脚本）：

```bash
npm run check:diffreview          # 代码审核（自动选 base：origin/main → HEAD~1）
DIFF_BASE=<ref> npm run check:diffreview   # 指定范围
npm run check:diffreview -- --strict       # 警告也失败
```

diff-review 规则级别：`fail` = 该形态在本仓库造成过生产事故（合并阻断）；`warn` = 必须人工看一眼（默认不阻断）；`info` = 提示。报告同时写入 `$GITHUB_STEP_SUMMARY`（GitHub 运行摘要页）。

分支保护建议（仓库设置 → Branches → main）：要求 status check `Quality Gates / ① Diff review`、`② Static gates`、`③ Build + dist guards`、`④ Hydration probe` 通过——这样 ①–④ 成为合并前门；push main 的同名运行为发布后验证。

## Notes

- Keep script names stable after publishing npm aliases.
- Prefer `--dryRun` before destructive or large-scale actions.
- Transfer report output path: `./tmp/front_image_transfer_report.json`.
- Local stage report output path: `./tmp/front_image_stage_report.json`.
- M3 preflight strict mode: `npm run m3:preflight:strict` (for local/preview hosts where `/api/content/*` must be reachable).
- Official-token one-command gate check: `CMS_ADMIN_ALL_TOKEN=<official-token> npm run m3:preflight:official -- --base=<target-host> --category=stroller`.

## Safe Replace Guardrail

- Script: `scripts/cms_safe_replace_from_export.mjs`
- NPM alias: `npm run cms:replace:safe -- <args>`
- Safety rule: in `--mode=replace`, any target collection with `0` input rows is blocked by default (because replace purges first).
- Explicit override: `--allow-empty=<collection1,collection2>` or `--allow-empty=all`

Examples:

```bash
# 1) Dry-run with guardrail (default)
npm run cms:replace:safe -- --base=https://kidsmobi-api-v1.seaman-player.workers.dev --input=../backend/env/cms-export-1784056120.before-full-reset.json --mode=replace --collections=products,categories

# 2) Apply write with strict non-empty replace
npm run cms:replace:safe -- --base=https://kidsmobi-api-v1.seaman-player.workers.dev --input=../backend/env/cms-export-1784056120.before-full-reset.json --mode=replace --collections=products --apply

# 3) Intentionally allow empty categories and apply
npm run cms:replace:safe -- --base=https://kidsmobi-api-v1.seaman-player.workers.dev --input=../backend/env/cms-export-1784056120.before-full-reset.json --mode=replace --collections=products,categories --allow-empty=categories --apply
```

## R2 Naming Strategy

- Primary path pattern: `resources/<resource-id>/<normalized-file-name>`
- Fallback path pattern: `products/<product-id>/<kind>/<normalized-file-name>`
- `<resource-id>` and `<product-id>` are normalized to lowercase slug format.
- `<kind>` is typically `cover` or `gallery`.
- This naming keeps object keys stable and idempotent across re-import/re-upload runs.

## Local Staging Path Mode

- `keep`: keep original manifest `targetPath`.
- `category-product-kind`: rewrite to `categories/<category>/products/<product>/<kind>/<file>` for human review and collaborative confirmation.

## Quick Start: Initial Import From Backend

1. Enter front workspace:
   - `cd front`
2. Run one-command init import:
   - `npm run import:cms:init`
3. Verify output:
   - check `counts` and `importStats` in terminal output
   - confirm manifest exists at `./tmp/front_image_transfer_manifest.init.json`
