# CMS Write-Endpoint Authentication (#48) — Setup Guide

Date: 2026-10-16 · Repos: `front/` + `backend/` · Status: **front deployed; backend Worker gate implemented, pending deploy**

## Production architecture (important correction)

The CMS API at `store.balancebiketoddler.com/api/*` is served by the **Cloudflare
Worker `kidsmobi-api-v1`** from the **backend repo** (`backend/api/worker/`, routes in
its `wrangler.toml`), deployed **manually** via `backend/scripts/deploy_worker_api.sh`
— pushing the front repo does **not** update it. The front repo's `src/apiServer.ts`
(via `api/index.ts` on Vercel) is only a test host.

The #48 gate therefore exists on both sides: front (done, shipped with `f5fc164`)
and the backend Worker (added now, pending deploy).

## What changed

### front repo (`f5fc164`, pushed & deployed)

| File | Change |
|---|---|
| `src/apiServer.ts` | `app.use("/api/cms")` middleware: blocks all POST/PUT/DELETE and `GET /api/cms/ops/export` unless `canAccessAllScope()` passes. `[audit]` log on 403. |
| `src/lib/cmsD1Service.ts` | `requestJson()` now sends `x-cms-admin-token` from `VITE_CMS_ADMIN_ALL_TOKEN`. |
| `scripts/_cmsAdminToken.mjs` | Shared helper for write scripts (`adminHeaders()`). |
| 13 write scripts | Send the token from the `CMS_ADMIN_ALL_TOKEN` env var. |

### backend repo (`backend/api/worker/src/index.ts`, pending deploy)

| Location | Change |
|---|---|
| `Env` | Added `CMS_ADMIN_ALL_TOKEN?: string`. |
| `isCMSAdminScope()` | Mirrors front's `canAccessAllScope()`: matching token passes; missing/loopback `cf-connecting-ip` (wrangler dev) passes. |
| Top of `handleRequest()` | POST/PUT/DELETE under `/api/cms/` and `GET /api/cms/ops/export` without a passing scope → `403 AdminTokenRequired`. Public GET reads (collections, ops/overview, ops/events, assets, d1/health) stay open. 403s naturally skip the R42 post-mutation edge-cache purge. |

`tsc --noEmit` passes. Local workerd smoke-testing is unavailable on this machine
(known Windows VC++ issue) — rely on the live probes below after deploy.

## ⚠️ Before deploying

Set the **same strong random value** (`openssl rand -hex 32`) in both places:

1. **Worker secret**: `CMS_ADMIN_ALL_TOKEN` → `kidsmobi-api-v1`
   (`cd backend/api/worker && npx wrangler secret put CMS_ADMIN_ALL_TOKEN`,
   or dashboard → Workers → kidsmobi-api-v1 → Settings → Variables).
2. **`VITE_CMS_ADMIN_ALL_TOKEN`**: build env var of the frontend Pages project
   (inlined into the client bundle at build time; already configured — the
   `f5fc164` Pages build includes it).

> Known limitation (accepted for the quick fix): `VITE_` variables are readable in
> the public JS bundle → "security by obscurity". Stops drive-by tampering and SEO
> spam writes, not a determined attacker who reads the bundle. The thorough fix is
> session auth (#48 follow-up).

## Deploy order (Worker)

```bash
cd backend/api/worker
npx wrangler secret put CMS_ADMIN_ALL_TOKEN   # paste the strong random value
npx wrangler deploy                            # code-only change, no R2 data sync needed
# or bash ../../scripts/deploy_worker_api.sh (requires CLOUDFLARE_API_TOKEN/ACCOUNT_ID)
```

## Post-deploy verification (all harmless probes)

```bash
# 1. Public read unaffected → expect 200
curl -s -o /dev/null -w "%{http_code}\n" "https://store.balancebiketoddler.com/api/cms/products?cb=$(date +%s)"

# 2. Full-DB export without token → expect 403 (proof the gate is live)
curl -s -o /dev/null -w "%{http_code}\n" "https://store.balancebiketoddler.com/api/cms/ops/export?cb=$(date +%s)"

# 3. Write without token → expect 403 (gate fires before routing, touches nothing)
curl -s -o /dev/null -w "%{http_code}\n" -X POST -H "Content-Type: application/json" -d '{}' \
  "https://store.balancebiketoddler.com/api/cms/no-such-collection/save?cb=$(date +%s)"

# 4. Same probe with token → expect 404 (gate passed, collection doesn't exist — harmless)
curl -s -o /dev/null -w "%{http_code}\n" -X POST -H "Content-Type: application/json" -d '{}' \
  -H "x-cms-admin-token: <YOUR_TOKEN>" \
  "https://store.balancebiketoddler.com/api/cms/no-such-collection/save?cb=$(date +%s)"
```

> ⚠️ Never probe production with "no-token POST `/api/cms/settings/save` + `{}`":
> if the gate isn't live yet, `{}` gets written into settings for real and corrupts
> the live config. Use the nonexistent-collection probes above instead.

## Day-to-day

- **Admin UI**: sends the token embedded via `VITE_CMS_ADMIN_ALL_TOKEN` — passes automatically.
- **Write scripts** (front/scripts): set `CMS_ADMIN_ALL_TOKEN` in the environment;
  updated scripts attach it automatically; new scripts should use `adminHeaders()`
  from `scripts/_cmsAdminToken.mjs`.
- **Local dev**: loopback / absent `cf-connecting-ip` passes automatically.
- The Worker auto-purges the CMS edge cache after successful POSTs (R42) — no manual purge needed.
