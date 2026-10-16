# CMS Write Auth Setup (#48) — Deployment Guide

Date: 2026-10-16 · Repo: `front/` · Status: **code ready, NOT deployed**

## What changed

The CMS write endpoints were completely unauthenticated (anyone who knew the URL
could overwrite settings/products or dump the whole DB via `/api/cms/ops/export`).
This change adds a shared-secret token gate:

| File | Change |
|---|---|
| `src/apiServer.ts` | New `app.use("/api/cms", ...)` middleware: blocks every POST/PUT/DELETE under `/api/cms` and `GET /api/cms/ops/export` unless `canAccessAllScope()` passes (loopback, or `x-cms-admin-token` header == `CMS_ADMIN_ALL_TOKEN` env). Public GET reads stay open. Blocked requests are logged with an `[audit]` line. |
| `src/lib/cmsD1Service.ts` | `requestJson()` now sends `x-cms-admin-token` from `VITE_CMS_ADMIN_ALL_TOKEN` so the admin UI passes the gate. |
| `scripts/_cmsAdminToken.mjs` | Shared helper for future write scripts (`adminHeaders()`). |
| 13 write scripts | All now send `x-cms-admin-token` from `CMS_ADMIN_ALL_TOKEN` env. |

Verified locally (5 probes): public GET passes (503 = D1 not configured, not 403),
loopback write passes, forwarded-IP write without token → 403, forwarded-IP write
with matching token → passes, `ops/export` without token → 403. `tsc --noEmit` clean.

## ⚠️ REQUIRED before deploying

If this code deploys **without** the env vars, every remote CMS write (admin UI
included) gets 403 — the site's admin breaks. Set both vars to the **same strong
secret** (e.g. `openssl rand -hex 32`):

1. **`CMS_ADMIN_ALL_TOKEN`** — environment variable (Production) on the project
   that serves the CMS API (the deployment behind `store.balancebiketoddler.com`).
2. **`VITE_CMS_ADMIN_ALL_TOKEN`** — build environment variable on the front-end
   Pages project (`balancebiketoddler.com`). Vite inlines it into the client
   bundle at build time, so it must exist at build time.

> Known limitation (accepted for this fast fix): `VITE_` vars are public in the
> JS bundle, so this is obscurity-level protection — it stops drive-by abuse and
> SEO spam, not a determined attacker who reads the bundle. The proper fix is
> session auth (verify-code issues a signed httpOnly cookie); tracked as the #48
> follow-up.

## Rollout sequence

1. Set both env vars (same value) in the hosting dashboards.
2. Deploy the API host first, then the front-end build (push `main`).
3. Verify:

```bash
# blocked (expect 403): write without token
curl -s -o /dev/null -w "%{http_code}\n" -X POST -H "Content-Type: application/json" \
  -d '{}' -H "X-Forwarded-For: 203.0.113.9" https://store.balancebiketoddler.com/api/cms/settings/save
# -> 403

# allowed (expect NOT 403): write with token
curl -s -o /dev/null -w "%{http_code}\n" -X POST -H "Content-Type: application/json" \
  -d '{}' -H "X-Forwarded-For: 203.0.113.9" \
  -H "x-cms-admin-token: <YOUR_TOKEN>" https://store.balancebiketoddler.com/api/cms/settings/save

# blocked (expect 403): full-DB export without token
curl -s -o /dev/null -w "%{http_code}\n" -H "X-Forwarded-For: 203.0.113.9" \
  https://store.balancebiketoddler.com/api/cms/ops/export
```

(503 on the save probes = "D1 not configured" from the `{}` body — that means the
gate let it through, which is the point. Only a 403 means blocked.)

## Ongoing operations

- Local dev (`npm run dev`): loopback is auto-allowed — no token needed.
- Any script that mutates the CMS: set `CMS_ADMIN_ALL_TOKEN` in the environment
  (the updated scripts send it automatically; new scripts should use
  `adminHeaders()` from `scripts/_cmsAdminToken.mjs`).
- `scripts/README.md` m3 gate checks already use the same env var name.
