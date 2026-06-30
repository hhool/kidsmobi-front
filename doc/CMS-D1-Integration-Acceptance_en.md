# CMS D1 End-to-End Staged Acceptance Report (English)

Updated at: 2026-06-30 16:03:33 CST

## 1. Scope

This acceptance run covers:

1. Frontend admin D1 client routing behavior with dedicated API base support.
2. Cloudflare Worker rollout status for `/api/cms/*`.
3. D1 binding and read/write availability via `cms_records`.
4. Full write/read lifecycle (`save -> list -> delete -> list`) across six collections.

Collections in scope:

1. categories
2. products
3. scenarios
4. evaluations
5. guides
6. news

## 2. Architecture Status

The current architecture is operational:

1. Frontend admin points to Worker domain via `VITE_CMS_API_BASE_URL`.
2. Worker serves `/api/cms/d1/health`, `/api/cms/{collection}`, and `/api/cms/{collection}/save|delete`.
3. Worker binds D1 (`CMS_DB`) and auto-ensures `cms_records` table exists.
4. Frontend no longer depends on same-origin `/api/cms/*` under static Pages domain, avoiding HTML fallback issues.

## 3. Validation Results

### 3.1 Read-only Smoke (health + list)

Command:

```bash
npm run cms:smoke -- --base=https://kidsmobi-api-v1.seaman-player.workers.dev
```

Results:

1. `/api/cms/d1/health` PASS (200 + JSON)
2. `/api/cms/categories` PASS
3. `/api/cms/products` PASS
4. `/api/cms/scenarios` PASS
5. `/api/cms/evaluations` PASS
6. `/api/cms/guides` PASS
7. `/api/cms/news` PASS

Conclusion: 7/7 PASS.

### 3.2 Full CRUD Regression

Command:

```bash
npm run cms:regress -- --base=https://kidsmobi-api-v1.seaman-player.workers.dev
```

Results:

1. categories: PASS
2. products: PASS
3. scenarios: PASS
4. evaluations: PASS
5. guides: PASS
6. news: PASS

Each collection satisfied:

1. save=200
2. listAfterSave=200 with foundAfterSave=true
3. delete=200
4. listAfterDelete=200 with foundAfterDelete=false

Conclusion: 6/6 PASS.

## 4. Release and Version Trace

Backend:

1. `feat(worker): add d1-backed cms api endpoints` (b055743)
2. `chore(worker): bind cms d1 database for api routes` (44c3098)

Frontend:

1. `fix(cms): support configurable D1 API base on static hosts` (1ed97cb)
2. `feat(cms): add dedicated API base for D1 endpoints` (4b5f626)
3. `docs(env): sync .env.example with cms api base and d1 vars` (7c05ecf)
4. `chore(cms): add reusable d1 endpoint smoke command` (e570927)
5. `test(cms): add full crud regression command` (7733812)

Online endpoints:

1. Frontend production: `https://kidsmobi.pages.dev`
2. Worker API: `https://kidsmobi-api-v1.seaman-player.workers.dev`

## 5. Residual Risks and Recommendations

Non-blocking risks:

1. D1 currently uses `my_d1_j13_binder` (temporary naming); recommend migrating to a production-named DB with a migration script.
2. Frontend must inject `VITE_CMS_API_BASE_URL` at build/deploy time; recommend platform-level env pinning.
3. API regression is green, but UI click-through evidence is not yet archived; recommend one manual admin walkthrough with screenshots/video.

## 6. Staged Conclusion

Conclusion: CMS D1 end-to-end path (Worker API + D1 + frontend routing) is functional and stable under automated checks. The project is ready for manual admin UI acceptance and production environment hardening.
