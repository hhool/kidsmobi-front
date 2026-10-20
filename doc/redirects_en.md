# `_redirects` — rules, limits and why the file looks like this

`public/_redirects` is the source, and it is now deliberately tiny: the API
proxy and the five bare app roots. **The retired-URL 301 family no longer lives
here** — it moved to the Worker, because Pages caps this file and drops the
overflow without failing the build, while the Worker's route table has no
budget. See "Who owns what" below.

## Who owns what

| Layer | Owns | Why |
| --- | --- | --- |
| Worker `kidsmobi-api-v1` | every retired-URL 301: legacy category dirs (`/products/balance_bike` …), the abolished `/products/other/` bucket, pruned stage-1/2 listings, renamed guide/news/review slugs | Workers routes take precedence over Pages on the same zone, and the route table has no line budget |
| Pages `_redirects` | `/api/*` → store host, and the shell rewrite for the five bare app roots | Small and static — it must stay small, because overflow is dropped in silence |

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

Unknown ids under `/products/other/` fall through to a **scoped passthrough**:
they have always been served the SPA shell by Pages' own fallback, so the Worker
fetches the shell back from the Pages deployment host rather than answering 404
locally. That host must not be the apex — the same route pattern would re-enter
the Worker and loop.

## What Pages actually does (in the order we learned it)

### 1. A matching `_redirects` rule takes precedence over the static asset tree

The most important and most counter-intuitive one: **once a rule matches, the
static file never gets consulted.** `/products/balance-bikes` has a prerendered
sibling at `dist/products/balance-bikes/index.html`, but as long as
`/products/* / 200` sits in this file the request is rewritten away from it.

An earlier version of this document claimed the opposite ("Pages resolves
`/x` to `/x.html` before it reads `_redirects`"). That conclusion came from a
probe battery that only ever exercised **unknown** paths; nobody had tested a
wildcard rule against a path that *has* a prerendered sibling. The 2026-10-21
deploy falsified it, at the cost of 255 pages (next section).

### 2. A wildcard rule must not target `/index.html`

If a rule's **source contains `*`** and its **target is `/index.html`**, Pages
**drops it in silence, with no error anywhere**. Pages exposes the root document
as `/` and normalises `/index.html` → `/` with a 308, so that target never
resolves and the rule is thrown away.

The build log pointed somewhere else entirely, which was misleading:

```
Found invalid redirect lines:
  - #1: /about /about.html 200!
    Valid status codes are 200, 301, 302 (default), 303, 307, or 308. Got 200!.
    Maximum number of dynamic rules supported is 100. Skipping remaining 63 lines of file.
```

The `200!` rules really were invalid and are gone. But the "100 dynamic rules"
line was a **red herring**: the file had 73 rules and 21 wildcards at the time,
nowhere near any published limit. Compressing it from 184 lines / 153 rules to
90 / 73 changed **nothing** — the last ten rules stayed dead.

What actually located it was a probe battery fired at the live site:

| Rule | Source | Target | Status | Result |
| --- | --- | --- | --- | --- |
| `/probe-a/*` | wildcard | `/index.html` | 200 | **404 (dropped)** |
| `/probe-c/*` | wildcard | `/index.html` | 301 | **404 (dropped)** |
| `/probe-h/*` | wildcard | `/about/` | 200 | 308 → `/about` (fired) |
| `/probe-e/x` | **exact** | `/index.html` | 200 | 308 → `/` (fired) |

Only the "wildcard + `/index.html`" combination fails. An exact source is fine
with that target, and a wildcard source is fine with any other target — position
in the file is irrelevant.

### 3. What Pages does for free

- **`/x/` → 308 → `/x`.** Trailing slashes are normalised by Pages itself. A
  trailing-slash rule only earns its line when the target differs from the
  stripped path (e.g. a retired URL that must land on a *different* listing).
- **The `200!` forced-rewrite suffix is not supported** — Pages rejects it as an
  invalid status code.

### 4. A line cap, with the overflow dropped in silence

Pages caps this file (roughly 120 lines / 100 dynamic rules) and discards the
rest **without failing the build** — one warning line in the log is all you get.
That is why the retired-URL family had to move to the Worker: it was the only
part of this file that grows with the catalogue.

## 2026-10-21 P0: the fallback went from dead to live and ate 255 prerendered pages

Timeline:

1. The fix for §2 retargeted the SPA prefix fallback from `/index.html` to `/`.
   The fallback **fired for the first time**.
2. But a rule that fires matches everything — including paths that have a
   prerendered sibling (§1).
3. Result: **255 of 269** sitemap URLs answered with the homepage shell:
   homepage `<title>` + `<link rel="canonical" href="https://balancebiketoddler.com/">`.

Measured live 2026-10-21 01:51–02:10 by the automated health check (r12):

| Path | Expected | Actual |
| --- | --- | --- |
| `/products/balance-bikes/` + 181 product/category pages | own title + self canonical | homepage shell |
| `/reviews/compare/*`, `/reviews/single/*` (33) | same | homepage shell |
| `/news/<type>/*` (12) | same | homepage shell |
| `/guides/<category>/*` (22, incl. 6 hubs) | same | homepage shell |
| `/transparency/*` (7) | same | homepage shell |
| bare hubs `/products` `/reviews` `/news` `/guides` `/about` | own | fine (a bare path does not match `<prefix>/*`) |
| top-level `/balance-bike-stability/` etc. | own | fine (under no prefix) |

**Two historical data points confirm this was a fresh regression, not something
long-standing**: GSC indexing sat at **14/271** — exactly the number of pages
that can currently serve their own prerender — and the "Alternate page with
proper canonical tag" group held only 9 entries, where ~250 would be expected
if 255 homepage copies had existed all along.

**Why every earlier verification missed it**:

- Status-code probes only check for 200 — and the homepage shell is also a 200.
- The hydration probe reads the **hydrated** DOM — the SPA renders the correct
  content from the URL, while the raw HTML `curl` sees is what a crawler gets.
- `site-health-check` checked whether title/canonical **existed**, never
  whether they **belonged to the page**.

The fix: delete the whole SPA prefix fallback block and keep only **exact**
rewrites for the five bare app roots. Unknown sub-paths go back to answering
404 — which is what the site genuinely did for the whole period the fallback was
being silently dropped, so nothing regresses. A fallback that is actually worth
having (CMS pages published but not yet built) can only live in the Worker,
which can ask D1 whether a path exists before deciding to pass the static file
through or answer with the shell. `_redirects` cannot express a "negative
wildcard"; that is its fundamental limit here.

**The check that now guards it**: `site-health-check.mjs` gained a
`prerender-meta-ownership` assertion — it samples nested routes under each app
prefix from the sitemap, pulls each one's raw HTML title and canonical, and
compares them against the homepage signature. Any page that degrades into a
homepage copy fails the check. It was reverse-verified against the broken live
site (10/10 hits).

## Invariants

- **No wildcard rule may target any static path** — not just `/index.html`. A
  wildcard rewrite shadows **every** prerendered page under that prefix.
  Enforced twice over by `check:redirects`
  (`redirects-no-wildcard-static-target`) and `check-seo-assets` (same name).
- Only paths that **provably have no prerendered sibling** get a rewrite, and
  only with an **exact** source. The five bare app roots (`/compare` `/auth`
  `/search` `/evaluations` `/transparency`) are exactly that case, enforced by
  `redirects-bare-roots-covered`.
- Never emit `200!` again — the build validator rejects it outright.
- Keep the file under **100 lines** (currently 29). The line count was never the
  root cause of any incident, and the block that made it grow has moved out —
  the cap is pure alarm margin now.
- A 404 for an unknown sub-path is **correct semantics**. Do not reintroduce a
  wildcard fallback to get rid of it.

## Debugging notes

- **Do not** use bundle hashes to decide whether a deploy landed. Local builds
  inline `VITE_*` from the gitignored `.env.local`, so local and CI hashes can
  never match. Grep the live chunk for a feature string instead, or probe a
  static file only the new build emits (e.g. `/data/legacy-redirects.json`).
- To find out whether a rule fires, just probe: `curl -s -o /dev/null -w
  '%{http_code} %{redirect_url}' --noproxy '*' <url>`. A rewrite to `/` answers
  200; a rewrite to `/index.html` answers 308 → `/`; a dropped rule answers 404.
- **Verify redirects by content, never by status code alone.** At minimum, pull
  one nested prerender route and compare its raw HTML `<title>` and canonical
  against the page's own — `node scripts/seo/site-health-check.mjs` now does
  this weekly on its own.
- A 301 whose `Location` is an **absolute URL** comes from the Worker; Pages'
  `_redirects` 301s are relative. When you cannot tell which layer answered,
  that header settles it.

## Related

- `gsc-2026-10-21-stable-track_en.md` (r12) — the independent discovery and
  impact assessment of this incident, including the GSC evidence.
- `redirects_zh.md` — the Chinese version of this document.
