# `_redirects` — rules, limits and why the file looks like this

`public/_redirects` is the source, and it is now deliberately tiny: the API
proxy, five bare app roots, and the SPA prefix fallback. **The retired-URL 301
family no longer lives here** — it moved to the Worker, because Pages caps this
file and drops the overflow without failing the build, while the Worker's route
table has no budget. See "Who owns what" below.

## Who owns what

| Layer | Owns | Why |
| --- | --- | --- |
| Worker `kidsmobi-api-v1` | every retired-URL 301: legacy category dirs (`/products/balance_bike` …), the abolished `/products/other/` bucket, pruned stage-1/2 listings, renamed guide/news/review slugs | Workers routes take precedence over Pages on the same zone, and the route table has no line budget |
| Pages `_redirects` | `/api/*` → store host, the five bare app roots, the SPA prefix fallback | Small and static — it must stay small, because overflow is dropped in silence |

The front repo still **computes** the Worker's map, so there is one source of
truth and not two: the prerender derives it from live CMS data and publishes
`dist/data/legacy-redirects.json` (44 exact + 10 prefix rules).
`scripts/sync_redirects_to_worker.mjs` mirrors that file into
`backend/api/worker/src/legacyRedirects.generated.ts` and rewrites a marked
block of `backend/api/worker/wrangler.toml`.

After any catalogue change:

```
cd front && npm run build && node scripts/sync_redirects_to_worker.mjs
# then redeploy the Worker (needs a Cloudflare API token; nothing is stored locally)
```

The route patterns the script emits are deliberately few, because every pattern
intercepts real traffic and the Worker answers 404 for anything it does not
redirect:

- one `<prefix>/*` per 1:1 prefix rule (also covers its trailing-slash form,
  since `*` matches the empty string);
- one `/products/other/*` wildcard so the bucket's per-product 301s and their
  slash forms reach the handler;
- one exact pattern per remaining rule that those wildcards do not cover.

Unknown ids under `/products/other/` fall through to a **scoped passthrough**
in the Worker: they have always served the SPA shell through Pages' own
`/products/*` fallback, so the Worker fetches the shell from the Pages
deployment host instead of answering 404. The host must not be the apex — that
would re-enter the Worker on the same route pattern and loop.

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
rules" line is a red herring: the file had 73 rules and 21 wildcard rules, both
far under any documented cap. Compressing it from 184 lines / 153 rules down to
90 / 73 changed nothing — the last ten rules were still dead.

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

Worth remembering: a guard used to *enforce* the broken pattern.
`check-seo-assets` asserted that every app route prefix rewrites to
`/index.html`, which pinned the bug in place every time someone regenerated the
file. A guard asserts what its author believed correct, not what the platform
accepts — its assertions need counter-evidence from live behaviour.

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
- Keep the file **under 100 lines** (it is 38). Size was never the cause of the
  outage, and the retired-URL block that made it grow has moved out — the cap
  is now pure alarm margin.
- The SPA prefix block (`/products/*`, `/reviews/*`, …) stays **last**. Do not
  replace it with a global catch-all: that answers every unknown path — including
  inbound spam such as `/panties/*.php` left behind by a previous owner of the
  domain — with the homepage shell and a 200, and `_redirects` has no 404 rewrite
  to compensate.
- Prefixes mirror the roots the client router resolves in `src/App.tsx`
  (`resolveRouteState`). Anything outside them already renders an in-app
  "not found" view, so nothing is lost by 404ing at the edge.

## Debugging notes

- Do **not** judge a deploy by comparing bundle hashes. The local build inlines
  gitignored `VITE_*` from `.env.local`, so local and CI hashes never match.
  Grep the live chunk for a signature string instead.
- To find out whether a rule fires at all, probe it: `curl -s -o /dev/null -w
  '%{http_code} %{redirect_url}' --noproxy '*' <url>`. A rewrite to `/` returns
  200; a rewrite to `/index.html` returns 308 → `/`; a dropped rule returns 404.
- A 301 whose `Location` is an **absolute URL** came from the Worker; Pages
  `_redirects` 301s are relative. That is the quickest way to tell which layer
  answered.
- Cloudflare Pages builds are not GitHub Actions jobs. The GH Actions workflow
  only runs quality gates and the cache purge; the Pages build log lives in the
  Cloudflare dashboard.
