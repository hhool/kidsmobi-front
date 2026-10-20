# `_redirects` — rules, limits and why the file looks like this

`public/_redirects` is the source; `scripts/prerender-pages.ts` injects the
generated retired-URL block into `dist/_redirects` at build time.

## The bug that bit us: wildcard rules may not target `/index.html`

A `_redirects` rule whose **source contains `*`** and whose **target is
`/index.html`** is discarded by Pages **without any error**. Pages exposes the
root document as `/` and normalises `/index.html` → `/` with a 308, so that
target never resolves and the rule is thrown away.

The build log points somewhere else entirely and is misleading:

```
Found invalid redirect lines:
  - #1: /about /about.html 200!
    Valid status codes are 200, 301, 302 (default), 303, 307, or 308. Got 200!.
    Maximum number of dynamic rules supported is 100. Skipping remaining 63 lines of file.
```

The `200!` lines were indeed invalid, and they are gone. But the "100 dynamic
rules" line is a red herring: this file has 73 rules and 21 wildcard rules,
both far under any documented cap. Compressing the file from 184 lines / 153
rules down to 90 / 73 changed nothing — the last ten rules were still dead.

What isolated it was a probe battery run against the live site:

| Rule | Source | Target | Status | Result |
| --- | --- | --- | --- | --- |
| `/probe-a/*` | wildcard | `/index.html` | 200 | **404 (dropped)** |
| `/probe-c/*` | wildcard | `/index.html` | 301 | **404 (dropped)** |
| `/probe-h/*` | wildcard | `/about/` | 200 | 308 → `/about` (fired) |
| `/probe-e/x` | exact | `/index.html` | 200 | 308 → `/` (fired) |

Only the wildcard-`*` + `/index.html` combination fails. Exact sources are fine
with that target; wildcard sources are fine with any other target. Position in
the file is irrelevant.

Because the discarded block *was* the SPA fallback, production impact was:

| Path | Expected | Actual |
| --- | --- | --- |
| `/compare` `/auth` `/search` `/evaluations` `/transparency` | 200 shell | **404** |
| any guide / news / review detail page published in the CMS after the last deploy | 200 shell | **404** |

Rewrites in this file must therefore target `/`, never `/index.html`.

## What Pages already does for free

Two behaviours mean most rewrite rules were never doing anything:

1. **`/x` → `/x.html`.** Pages resolves a request against the static asset tree
   *before* it consults `_redirects`. Every prerendered route already has a
   `.html` file, so exact rewrite rules for them are dead weight.
2. **`/x/` → 308 → `/x`.** Trailing slashes are normalised on their own. A
   trailing-slash redirect rule is only worth its line when the target differs
   from the stripped path (e.g. a retired URL that must land on a *different*
   listing).

And one thing it does **not** support: the **`200!` forced-rewrite suffix**. Pages
rejects it as an invalid status code, which is why those rewrites never fired.

## Invariants

- **Never point a wildcard rule at `/index.html`.** Target `/`. Enforced by
  `check:redirects` (`redirects-no-index-html-target`).
- Never emit `200!` again — the validator rejects it.
- Never add a rule for a path that is prerendered; the static file wins first.
- Keep the file **under 100 lines**. Size was never the cause of the outage, but
  the generated retired-URL block grows with the catalogue, so the cap exists to
  stop it drifting upward unnoticed.
- The SPA prefix block (`/products/*`, `/reviews/*`, …) stays **last**. Do not
  replace it with a global catch-all: that answers every unknown path — including
  inbound spam such as `/panties/*.php` left behind by a previous owner of the
  domain — with the homepage shell and a 200, and `_redirects` has no 404 rewrite
  to compensate.
- Prefixes mirror the roots the client router resolves in `src/App.tsx`
  (`resolveRouteState`). Anything outside them already renders an in-app
  "not found" view, so nothing is lost by 404ing at the edge.

## Where the retired-URL 301s come from

- Stage-1/stage-2 pruned listings: `src/data/prunedProducts.generated.ts` and
  `src/data/prunedVariantProducts.generated.ts`, mirrored into the Worker by
  `scripts/sync_prune_map_to_worker.mjs`. They are **no longer emitted here** —
  the Worker carries the exact pair (no-slash + trailing-slash) as the first
  layer and has no line budget, and duplicating them is what pushed this file
  past its budget in the first place.
- Re-homed legacy `other`-bucket details and legacy category roots:
  `LEGACY_CATEGORY_301S` in `scripts/prerender-pages.ts`.

The Worker is the first layer for the paths it has apex `routes` for
(`backend/api/worker/wrangler.toml`); these `_redirects` lines are the backstop for
whenever the Worker is not in the request path.

## Debugging notes

- Do **not** judge a deploy by comparing bundle hashes. The local build inlines
  gitignored `VITE_*` from `.env.local`, so local and CI hashes never match.
  Grep the live chunk for a signature string instead.
- To find out whether a rule fires at all, probe it: `curl -s -o /dev/null -w
  '%{http_code} %{redirect_url}' --noproxy '*' <url>`. A rewrite to `/` returns
  200; a rewrite to `/index.html` returns 308 → `/`; a dropped rule returns 404.
- Cloudflare Pages builds are not GitHub Actions jobs. The GH Actions workflow
  only runs quality gates and the cache purge; the Pages build log lives in the
  Cloudflare dashboard.
