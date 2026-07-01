# Admin Online Demo Runbook (English)

## Demo Objective
- Demonstrate end-to-end admin editing flow across Product Center, Guide, and News.
- Demonstrate backend-powered visual resource selection and visual scenario selection.
- Demonstrate pre-demo online health checks.

## Demo Environment
- Production site: https://kidsmobi.pages.dev
- Latest preview site: https://e7661ce7.kidsmobi.pages.dev
- Worker API: use the configured base URL from `VITE_SCRAPE_API_BASE_URL` or `SCRAPE_KIDSMOBILE_API_BASE_URL`

## Pre-demo Check (1 minute)
1. Open Admin panel.
2. Go to Dashboard.
3. Confirm Online Integration Health card:
- Site Reachability: Pass
- Worker API: Pass
- CMS Read Capability: Pass
4. If not Pass, click Recheck.
5. Click Export Demo Snapshot to download a Markdown status record for sharing/archive.

## Demo Script (8-12 minutes)

### 1. Product Center: visual resource selection
1. Open Products.
2. Enter any product editor.
3. Demonstrate these actions:
- Pick cover from backend resources
- Pick gallery images from backend resources
- Pick videos from backend resources
- Pick related products from backend resources
4. Show auto fill-back after Apply.
5. Save and publish.

### 2. Guide: cross-module linkage + visual scenario selection
1. Open Guides.
2. Enter any guide editor.
3. Demonstrate:
- Pick cover image from backend resources
- Pick related products from backend resources
- Visual scenario picker
4. Show scenarioIds and relatedProductIds fill-back.
5. Save and publish.

### 3. News: cross-module linkage + visual scenario selection
1. Open News.
2. Enter any news editor.
3. Demonstrate:
- Pick cover image from backend resources
- Pick related products from backend resources
- Visual scenario picker
4. Show fill-back and SEO area.
5. Save and publish.

## Acceptance Criteria
- Resource picker loads data and supports search.
- Scenario picker supports multi-select and fill-back.
- Product, Guide, and News editors all support save flow.
- Dashboard health checks reflect current dependency status.

## Common Issues and Handling
- Empty resource list: verify Worker API reachability and CORS.
- Publish failed (permission denied): use real Firebase Auth admin login.
- Page is reachable but data is broken: inspect Dashboard health check first.
