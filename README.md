<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

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
