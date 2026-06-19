# Cloudflare R2 Public Access — Setup & Troubleshooting Guide

## Overview

This project stores uploaded assets (product images, gallery photos, etc.) in a
**Cloudflare R2** bucket.  The server-side adapter (`src/lib/storage/r2Adapter.ts`)
uses the S3-compatible API with presigned URLs, so **no third-party AWS SDK is
required**.

Two access modes are supported:

| Mode | How it works | When to use |
|------|-------------|-------------|
| **Public bucket** | Objects are served directly from the R2 public URL | Production |
| **Dev proxy** | `GET /api/assets/fetch` streams the object server-side | Local dev / staging |

---

## Required Environment Variables

Add these to your `.env` file (see `.env.example` for a template):

```bash
R2_ACCOUNT_ID=<your Cloudflare account ID>
R2_ACCESS_KEY_ID=<R2 API token key ID>
R2_SECRET_ACCESS_KEY=<R2 API token secret>
R2_BUCKET_NAME=<bucket name>

# Optional — set when public access is enabled on the bucket:
R2_PUBLIC_URL=https://<bucket>.<accountId>.r2.dev
# Or a custom domain:
# R2_PUBLIC_URL=https://assets.example.com
```

> **Never commit real credentials.**  Use environment secrets in AI Studio or
> your deployment platform.

---

## Creating an R2 API Token

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com).
2. Go to **R2 Object Storage → Manage R2 API Tokens**.
3. Click **Create API Token**.
4. Grant **Object Read & Write** on the target bucket.
5. Copy the **Access Key ID** and **Secret Access Key** — you will not see the
   secret again.

---

## Enabling Public Access on a Bucket

> Skip this section if you are happy to always use the dev proxy.

1. In the Cloudflare dashboard, open **R2 → \<your bucket\> → Settings**.
2. Under **Public access**, click **Allow Access**.
3. Copy the generated URL (format: `https://<bucket>.<accountId>.r2.dev`) and
   set it as `R2_PUBLIC_URL` in your environment.
4. Optionally, attach a **custom domain** through Cloudflare DNS instead.

### Reviewing Cloudflare Policies

When public access is enabled, verify:

- **Bucket policy**: no `deny` rules that would block `s3:GetObject`.
- **Cache rules**: the default Cache Rules cache public R2 objects for 1 day.
  Purge the cache via **Caching → Purge Everything** if a newly uploaded image
  does not appear.
- **CORS**: if the browser fetches images directly, add a CORS rule that allows
  `GET` from your app's origin.

---

## Development Preview Flow

When `R2_PUBLIC_URL` is not set (or the bucket is private), the admin UI still
shows an **immediate preview** of every uploaded image:

```
Browser                   Express server              Cloudflare R2
   |                           |                            |
   |-- POST /api/assets/presign -->                         |
   |<-- { uploadUrl, getUrl } --|                           |
   |                           |                            |
   |-- PUT <uploadUrl> (file) ------------>  stored in R2  |
   |                           |                            |
   |-- POST /api/assets/complete -->                        |
   |<-- { publicUrl } ---------|                            |
   |                           |                            |
   |-- GET /api/assets/fetch?key=... -->                    |
   |           |-- GET <presigned GET URL> -->  R2 object  |
   |           |<-- binary buffer -----------              |
   |<-- binary stream ---------|                            |
   |  (displayed as blob: URL) |                            |
```

The `previewUrl` returned by `uploadAsset()` in `src/lib/upload.ts` is:

- In **production** (`import.meta.env.DEV === false`): the `publicUrl`.
- In **development** (`import.meta.env.DEV === true`): a `blob:` URL created
  from the server-side proxy response so the image renders immediately even
  without public bucket access.

---

## Endpoint Reference

### `POST /api/assets/presign`

Generates a presigned **PUT** URL (for uploading) and a presigned **GET** URL
(for reading) with a default 1-hour expiry.

**Request body**
```json
{ "key": "products/hero/1234-abcd.png", "contentType": "image/png" }
```

**Response**
```json
{
  "uploadUrl": "https://<accountId>.r2.cloudflarestorage.com/...",
  "getUrl":    "https://<accountId>.r2.cloudflarestorage.com/..."
}
```

---

### `GET /api/assets/fetch?key=<objectKey>`

Server-side proxy — streams an R2 object to the browser.  Useful in dev when
the bucket is not publicly accessible.

**Response**: binary stream with the appropriate `Content-Type` header.

---

### `POST /api/assets/complete`

Verifies the object was uploaded (via a HEAD check) and returns its permanent
public URL.  Any optional side-effects (e.g. Firestore metadata) are attempted
but a failure there does **not** cause this endpoint to return an error.

**Request body**
```json
{ "key": "products/hero/1234-abcd.png" }
```

**Response**
```json
{ "publicUrl": "https://assets.example.com/products/hero/1234-abcd.png" }
```

---

## Recommended Next Steps

1. **Toggle R2 public access** (see above) once you are ready to serve images
   directly from Cloudflare's CDN edge.
2. **Review Cloudflare policies** — bucket policy, cache rules, and CORS
   settings for your production domain.
3. **Keep dev proxy** (`/api/assets/fetch`) for local development to avoid
   exposing a public bucket during development and testing.
4. **Custom domain** — attach a Cloudflare-proxied custom domain to the bucket
   for branded URLs (e.g. `https://cdn.example.com`).
5. **Lifecycle rules** — add R2 lifecycle rules to delete old/unused objects
   automatically and keep storage costs low.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| `R2 credentials are not configured` | Missing env vars | Check all four `R2_*` variables are set |
| `Object "x" not found in R2 (status 403)` | Bucket is private, HEAD via presigned URL failing | Verify the token has `s3:GetObject` permission |
| `Upload failed: 403` | Token lacks `s3:PutObject` | Re-create the API token with Object Read & Write |
| Image 404 in the browser | Public URL not yet propagated | Wait 30 s or purge Cloudflare cache |
| `CORS error` on direct image URL | CORS not configured | Add a CORS rule in R2 bucket settings |
| Preview not showing in dev | `R2_*` vars missing locally | Ensure `.env` is loaded (`dotenv.config()` runs at startup) |
