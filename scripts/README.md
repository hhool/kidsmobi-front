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
| `media_stage_images_local.mjs` | Download manifest images to local `front/resource/` for structure review before upload (supports target path rewrite mode) | `npm run media:stage:local` |
| `media_transfer_images_to_r2.mjs` | Transfer manifest images into Cloudflare R2 | `npm run media:transfer:r2 -- --manifestPath=./tmp/front_image_transfer_manifest.json --skipExisting` |
| `generate_products_import_from_backend.mjs` | Generate Product Center JSON import payload | `npm run import:generate -- --base=https://kidsmobi-api-v1.seaman-player.workers.dev --category=stroller --limit=20` |
| `smoke_cms_d1_endpoints.mjs` | Read-only CMS endpoint smoke checks | `npm run cms:smoke -- --base=https://your-cms-api.example.com` |
| `regress_cms_d1_crud.mjs` | CRUD regression checks for CMS collections | `npm run cms:regress -- --base=https://your-cms-api.example.com` |
| `reset_cms_d1_a_scope.mjs` | Reset A-scope CMS baseline data | `npm run cms:reset:a` |
| `sample_web_vitals.mjs` | Capture Web Vitals samples | `npm run perf:sample` |
| `compare_web_vitals_trend.mjs` | Compare Web Vitals trend/gate | `npm run perf:trend` |
| `verify_smartimage_sizes.mjs` | Validate smart-image size outputs | `node scripts/verify_smartimage_sizes.mjs` |
| `seedProducts.ts` | Seed product data for local workflows | `npx tsx scripts/seedProducts.ts` |

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

## Notes

- Keep script names stable after publishing npm aliases.
- Prefer `--dryRun` before destructive or large-scale actions.
- Transfer report output path: `./tmp/front_image_transfer_report.json`.
- Local stage report output path: `./tmp/front_image_stage_report.json`.

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
