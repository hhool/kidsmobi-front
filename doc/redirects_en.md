# `_redirects` — rules, limits and why the file looks like this

`public/_redirects` is the source; `scripts/prerender-pages.ts` injects the
generated retired-URL block into `dist/_redirects` at build time.

## The limit that bit us

Cloudflare Pages parses this file top-down and silently **drops every line past
roughly 120**. It does not fail the build — it logs:

```
Found invalid redirect lines:
  - #1: /about /about.html 200!
    Valid status codes are 200, 301, 302 (default), 303, 307, or 308. Got 200!.
    Maximum number of dynamic rules supported is 100. Skipping remaining 63 lines of file.
```

Because the SPA fallback must sit **last** (prefix rewrites have to lose to the
exact rules above them), overflow always eats the fallback first. In production
that meant:

| Path | Expected | Actual |
| --- | --- | --- |
| `/compare` `/auth` `/search` `/evaluations` `/transparency` | 200 shell | **404** |
| any guide / news / review detail page published in the CMS after the last deploy | 200 shell | **404** |

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
rejects it as an invalid status code, which is why the five app-root rewrites
never fired.

## Invariants

- Keep the file **under 110 lines**. `npm run check:redirects` enforces it.
- Never emit `200!` again — the validator rejects it.
- Never add a rule for a path that is prerendered; the static file wins first.
- The SPA prefix block (`/products/*`, `/reviews/*`, …) stays **last**. Do not
  replace it with `/* /index.html 200`: a global catch-all answers every
  unknown path — including inbound spam such as `/panties/*.php` left behind
  by a previous owner of the domain — with the homepage shell and a 200, and
  `_redirects` has no 404 rewrite to compensate.
- Prefixes mirror the roots the client router resolves in `src/App.tsx`
  (`resolveRouteState`). Anything outside them already renders an in-app
  "not found" view, so nothing is lost by 404ing at the edge.

## Where the retired-URL 301s come from

- Stage-1/stage-2 pruned listings: `src/data/prunedProducts.generated.ts` and
  `src/data/prunedVariantProducts.generated.ts`, mirrored into the Worker by
  `scripts/sync_prune_map_to_worker.mjs`.
- Re-homed legacy `other`-bucket details and legacy category roots:
  `LEGACY_CATEGORY_301S` in `scripts/prerender-pages.ts`.

The Worker carries the exact same pairs as the first layer (apex `routes` in
`backend/api/worker/wrangler.toml`), so these `_redirects` lines are the backstop
for whenever the Worker is not in the request path.
