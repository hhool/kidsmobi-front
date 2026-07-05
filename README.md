# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/27c530d6-bbc0-421c-9c99-92d08d510671

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Optional Content Source

The app keeps the current Firestore / local-data flow by default.

To switch the main product and evaluation load path to the scraped content bundle:

1. Set `VITE_CONTENT_SOURCE=scraped` in [.env.local](.env.local)
2. Set `SCRAPE_KIDSMOBILE_API_BASE_URL` to the upstream kidsmobi worker base URL, such as `https://kidsmobi-api-v1.seaman-player.workers.dev`
3. Restart the app so the server can aggregate the worker's `/api/v1/*` endpoints into `/api/content/bundle`

If the bundle request fails or returns incomplete data, the app falls back to the existing CMS / local-data path.

## CMS Resource API (Backend First)

Admin CMS resource picker (cover/gallery/video/related product) supports backend-first mode.

1. Set `VITE_CMS_BACKEND_BASE_URL` in `.env.local` (for example: `https://your-backend.example.com`)
2. The picker will prefer `${VITE_CMS_BACKEND_BASE_URL}/api/content/resources`
3. If backend is unavailable or non-JSON, it automatically falls back to worker aggregation (`/api/v1/catalog/categories`, `/api/v1/products`, `/api/v1/resources`)

Worker base URL precedence for admin and content helpers:

1. `VITE_SCRAPE_API_BASE_URL` (preferred for worker-backed `/api/v1/*` requests)
2. `VITE_CMS_BACKEND_BASE_URL` for CMS backend-first flows
3. Built-in worker fallback `https://kidsmobi-api-v1.seaman-player.workers.dev`

## CMS D1 Configuration (Admin D1-First)

Admin CMS pages now prefer D1-backed endpoints for read/write and automatically fall back to the previous CMS channel when D1 is unavailable.

For static-domain deployments (for example Cloudflare Pages static hosting), set `VITE_CMS_API_BASE_URL` to an API host that serves `/api/cms/*`. The D1 client will use this base instead of relative `/api/cms/*` paths, preventing HTML fallback from static route rewrites.

Base URL precedence for D1 client:

1. `VITE_CMS_API_BASE_URL` (recommended for `/api/cms/*`)
2. `VITE_CMS_BACKEND_BASE_URL` (fallback)
3. Relative `/api/cms/*` on current origin

1. Set the following values in `.env.local`:
   - `VITE_CMS_API_BASE_URL` (recommended when frontend host cannot serve `/api/cms/*` directly)
   - `VITE_CMS_BACKEND_BASE_URL` (optional fallback/shared base)
    - `CLOUDFLARE_ACCOUNT_ID`
    - `CLOUDFLARE_D1_DATABASE_ID`
    - `CLOUDFLARE_API_TOKEN`
2. Restart the local server after updating env variables.
3. Optional health check endpoint:
    - `/api/cms/d1/health`

Main D1-backed endpoints:

- List:
   - `/api/cms/categories`
   - `/api/cms/products`
   - `/api/cms/scenarios`
   - `/api/cms/evaluations`
   - `/api/cms/guides`
   - `/api/cms/news`
- Initialize:
   - `/api/cms/init/categories`
   - `/api/cms/init/products`
- Save/Delete:
   - `/api/cms/categories/save|delete`
   - `/api/cms/products/save|delete`
   - `/api/cms/scenarios/save|delete`
   - `/api/cms/evaluations/save|delete`
   - `/api/cms/guides/save|delete`
   - `/api/cms/news/save|delete`

Smoke check command:

```bash
npm run cms:smoke -- --base=https://your-cms-api.example.com
```

The command verifies `/api/cms/d1/health` and six list endpoints, and fails fast when an endpoint returns non-JSON (for example static HTML fallback).

CRUD regression command:

```bash
npm run cms:regress -- --base=https://your-cms-api.example.com
```

The command validates full write/read/delete cycles (`save -> list -> delete -> list`) across all six CMS collections.

SEO static-asset check:

```bash
npm run seo:check
```

Optional expected domain override:

```bash
SEO_SITE_BASE_URL=https://your-site.example.com npm run seo:check
```

The command validates `public/robots.txt`, `public/sitemap.xml`, and `public/_redirects`, including checks for site-domain sitemap URLs and accidental `.workers.dev` sitemap regressions.

## Product Bulk Import JSON

Use Product Center -> `Import JSON` with an array payload.

- Ready sample file: `doc/products-import-sample.json`
- Import behavior: per-row validation + upsert by `id` (partial success supported)

Generate a fresh import array from backend APIs:

```bash
npm run import:generate -- --base=https://kidsmobi-api-v1.seaman-player.workers.dev --category=stroller --limit=20 --output=doc/products-import-sample.json
```

Parameters:

- `--base`: backend API base URL
- `--category`: category id (for example `stroller`)
- `--limit`: max products to include
- `--output`: output JSON path for Product Center import

## Full CMS Bootstrap From Backend v2

Script reference and naming catalog:

- `scripts/README.md`

One-command initial import:

```bash
npm run import:cms:init
```

Run full-category bootstrap import from backend `/api/v2` into CMS collections:

```bash
npm run import:cms -- --sourceBase=https://kidsmobi-api-v1.seaman-player.workers.dev --cmsBase=https://kidsmobi-api-v1.seaman-player.workers.dev --perCategory=12 --manifestPath=./tmp/front_image_transfer_manifest.json
```

Safe preview mode (no write):

```bash
npm run import:cms -- --dryRun --perCategory=5 --manifestPath=./tmp/front_image_transfer_manifest.dryrun.json
```

The import script now outputs:

- import stats by collection (`created`, `updated`, `failed`)
- image transfer manifest for R2 migration (`manifestPath`)
- script file: `scripts/cms_import_full_from_backend_v2.mjs`

Stage backend product full-parameter placeholders locally for later editing:

```bash
npm run specs:stage:product:init
```

The command writes per-product files under `front/resource/assets/backend-import/<importBatchId>/products/<productId>/`:

- `product.raw.json`
- `resource.raw.json`
- `product.editable.json`
- `product.publish.json`
- `media.manifest.json`
- `ingest.meta.json`

## Transfer Imported Images To R2

Use the generated manifest to upload image assets into Cloudflare R2:

```bash
npm run media:transfer:r2 -- --manifestPath=./tmp/front_image_transfer_manifest.json --concurrency=3 --skipExisting
```

Dry-run transfer preview (no upload):

```bash
npm run media:transfer:r2 -- --dryRun --manifestPath=./tmp/front_image_transfer_manifest.dryrun.json
```

Recommended local-first workflow (stage to `front/resource/` before upload):

```bash
npm run media:stage:local
npm run media:transfer:r2:staged
```

Transfer report output:

- `./tmp/front_image_transfer_report.json`
- script file: `scripts/media_transfer_images_to_r2.mjs`
