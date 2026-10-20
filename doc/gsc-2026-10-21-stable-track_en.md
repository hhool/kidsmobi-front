# Indexing Check & "stable track" Landing-Page Migration Review — 2026-10-21 (r12)

Run window: 2026-10-21 01:51–02:10 (GMT+8). Verification and documentation only — no site code was modified.

## 0. Summary

| # | Item | Verdict |
|---|---|---|
| 1 | 🚨 **SPA fallback swallowing prerendered pages (introduced tonight, verified live)** | **All** sub-paths under `/products/*`, `/reviews/*`, `/news/*`, `/guides/*`, `/transparency/*` etc. — **255 of 269** sitemap URLs — now return the homepage shell (homepage title + canonical pointing at the homepage). The `_redirects` rework at 10-21 00:44 changed the fallback target from `/index.html` (silently dropped by Pages) to `/`, activating the fallback for the first time and clobbering the static prerenders. **Treat as P0** (details §4) |
| 2 | Health of the two target pages themselves | Unaffected: 200 + `index,follow,max-image-preview:large` + self-canonical + correct title/H1 (stability H1 still contains "stable track balance bike") |
| 3 | Are the two pages indexed? | Still unverifiable from this sandbox. Bing: stability `site:` returned a well-formed **no-results** page for the **4th time** (zh edge node this run); budget probe polluted (Baidu spam). Whole-domain control polluted this run (Chinese gov spam) → void. Best Google-side evidence remains the 14/271 plateau (GSC data through 10-12) |
| 4 | Sitemap self-check | **All green**: 200 / `application/xml; charset=utf-8` / **269 URLs** / 269/269 with `<priority>` / both pages present / max lastmod `2026-10-20T09:04:01.807Z` / live URL-set identical to local dist. The brief's "247 / alarm at 260" baseline is obsolete (legitimately 266 since r11, now 269 after the CMS-guides batch) |
| 5 | seo:health | **100/100** (15/15, 20s; sitemap baseline already resynced to 269, delta 0, no WARN) |
| 6 | stable-track migration | **Still unconfirmed**: no new GSC Performance export (no new files in Downloads since 10-19). Baseline remains `/` + `/products/balance-bikes/` (10-15). Note: after tonight's regression `/products/balance-bikes/` still answers 200 (shell), so its landing-page role survives for now; `/guides/scenario/balance-bike-stability` now canonicalizes to the homepage and cannot become a landing page until §4 is fixed |
| 7 | GSC Page indexing | No new screenshots/exports; status carries over: redirect group (4) **Started**; canonical group (9) Failed but root-caused and fixed (`3f01510`) → **no further VALIDATE FIX needed** |

## 1. Indexing check (Bing first)

| Probe | Result | Reading |
|---|---|---|
| WebSearch `site:.../balance-bike-budget/` | 5 off-domain results, 0 on-domain | `site:` operator ignored for the **12th** consecutive run — no signal |
| WebSearch `site:.../balance-bike-stability/` | 5 off-domain results, 0 on-domain | Same |
| Bing `site:.../balance-bike-budget/` | Baidu Zhidao/Wenku Chinese spam | **Polluted, void** |
| Bing `site:.../balance-bike-stability/` | Well-formed localized **no-results** page (zh) | **4th** well-formed no-results for stability (r4 ru / r8 zh / r9 es / r12 zh) — consistent semantics across 4 edge nodes keeps supporting "stability not yet in Bing's index" |
| Bing whole-domain control `site:balancebiketoddler.com` | mohrss.gov.cn Chinese gov spam | **Polluted this run, control void**; last valid control was r11 (10-20: site in index, no `/balance-bike-*` asset pages, 2 previous-owner spam URLs day 11) |

Conclusion: this sandbox has now interfered with search-engine `site:` queries for 12+ consecutive runs. Indexing status is only authoritative via GSC or a normal-network `site:` check. The combined evidence (Bing 4×no-results + Google 14/271 plateau + 242-page Discovered pool) points to neither page being indexed yet, with stronger evidence for stability.

## 2. Sitemap self-check (all green)

Fetched with `curl --noproxy '*'` (no query) directly from `https://balancebiketoddler.com/sitemap.xml`.

| Check | Result |
|---|---|
| HTTP status | **200** |
| Content-Type | **`application/xml; charset=utf-8`** |
| URL count | **269** (exact `grep -o` count) |
| `<priority>` coverage | **269/269** (backend `f2046bf` still holding) |
| `balance-bike-budget` | ✅ present (`/balance-bike-budget/`, priority 0.6) |
| `balance-bike-stability` | ✅ present (`/balance-bike-stability/`, priority 0.6) |
| max lastmod | `2026-10-20T09:04:01.807Z` (CMS batch refresh) |
| live vs local dist | URL-set diff = **0** (both 269) |

### 2.1 The 266 → 269 delta (legitimate)

`a548b30` (10-20 17:18, "three CMS guides take the reference cluster to 8/8") added 3 CMS articles, all verified live 200:

- `/guides/beginner/balance-bike-by-age`
- `/guides/beginner/balance-bike-what-buyers-say`
- `/guides/scenario/balance-bike-stability`

**The brief's "247 URLs / alarm at 260" baseline is obsolete**: r11 recorded 266 as the legitimate count; as of tonight the CMS batch makes it **269**. No Worker interception recurrence, no edge staleness (~106h of stability since the 10-15/16 fixes).

### 2.2 Two minor deviations (no alarm)

1. **10 of 269 URLs lack `<lastmod>`** (7 asset hubs incl. budget/stability + `/safety/balance-bike-recalls/` + 2 transparency pages); all static routes, negligible impact.
2. The `/guides` hub prerender title is "How to Choose a Baby Stroller | BalanceBikeToddler" — semantically mismatched for the guides hub, suspected wrong title source in the prerender (local `dist/guides.html` shows the same; content-side minor bug, see §6).

## 3. Health check (`npm run seo:health`, executed)

```
SCORE: 100/100  (pass 15, warn 0, fail 0 of 15)
[PASS] sitemap.xml: 269 URLs (baseline 269, delta 0)
[PASS] internal-links: sampled 15, broken=0
```

The baseline constant was already resynced to 269 by the parallel session; delta 0, no WARN. Both target pages are in KEY_URLS and pass every check.

## 4. 🚨 New P0: the SPA fallback wildcard block is swallowing 255/269 prerendered pages (introduced tonight)

### 4.1 Observation (live probes, tonight 01:51–02:10)

All of the following now answer **HTTP 200 + the homepage shell** (`<title>Best Kids Bikes, Strollers, Scooters | BalanceBikeToddler</title>`, `<link rel="canonical" href="https://balancebiketoddler.com/">`):

- `/products/balance-bikes/` and `/products/balance-bikes/<product ids>` (181 URLs)
- `/reviews/compare/*`, `/reviews/single/*` (33 URLs)
- `/news/<type>/*` (12 URLs)
- `/guides/<category>/*` (22 URLs — 6 category hubs + 16 articles)
- `/transparency/*` (7 URLs)

Prefixes covered by **no** rule still serve their prerenders correctly:

- `/safety/balance-bike-recalls/` → correct prerender (correct title + self-canonical)
- Bare hubs `/products`, `/reviews`, `/news`, `/guides`, `/about` → correct prerenders
- Top-level `/balance-bike-budget/`, `/balance-bike-stability/` + 4 sibling asset pages → correct prerenders

Net: **only 14 of 269 sitemap URLs actually serve their prerendered content**; the other 255 are homepage duplicates.

### 4.2 Root cause and timeline

- The SPA prefix fallback block in `public/_redirects` (`/products/* / 200` etc.) has existed for a long time, but its target was `/index.html` — Cloudflare Pages **silently drops** any rule with a wildcard source and an `/index.html` target (already proven with live probes by the parallel session, documented in `doc/redirects_zh.md`). The fallback was therefore dead: unknown sub-paths 404'd, prerendered sub-paths served their static files.
- 10-21 00:44 `19b60d3` ("target `/` instead of `/index.html` in the SPA fallback") changed the target to `/`, **activating the fallback for the first time**; 01:30 `dc2c1a5` moved the retired-URL 301 family into the Worker. This version is **deployed** (smoking gun: the unknown path `/products/balance-bikes/zzz-not-real` flipped from 404 to a 200 shell — the new fallback behavior).
- Side effect: wildcard rewrites **take precedence over static assets**. Every covered prefix's prerendered file (all present in local dist, e.g. `dist/products/balance-bikes/index.html` with a correct self-canonical and "Best Toddler Balance Bikes 2026" title) is being shadowed by the shell.

### 4.3 Corroboration from GSC history

- GSC shows **14/271 indexed** (data through 10-12) — exactly the 14 prerendered pages that still serve correctly today; the other 242 sit in the "Discovered – currently not indexed" pool.
- The GSC "Alternate page with proper canonical tag" group has only **9** entries (currency/www/underscore/guide variants) — had 255 homepage-canonical duplicates existed before 10-12, that group would be ~250. **This indicates the prerenders were being served correctly before tonight and the regression was introduced by tonight's deploy**, not a long-standing condition.

### 4.4 Impact

1. **255 content pages now look like homepage duplicates to crawlers**: raw-HTML title and canonical both point at the homepage → Google/Bing will treat them as canonical copies and drop/never index them. Nothing currently indexed is lost, but the 242-page Discovered pool risks being reclassified as canonical duplicates.
2. **Soft-404 semantics**: every unknown sub-path answers 200 shell (intended fallback behavior, but stacked on the above it makes "real page" vs "nonexistent path" indistinguishable to crawlers).
3. For CMS articles published after a build (no prerendered sibling) the shell is the **correct** behavior — the problem is purely that a wildcard block cannot distinguish "has prerender" from "has no prerender".

### 4.5 Fix directions (suggestions only — no code touched)

- **Preferred**: move the fallback into the Worker (the parallel session already has Worker routing plus a precedent of fetching the shell from the Pages host for `/products/other/*`): the Worker can probe whether the candidate `.html` exists, pass through to the Pages static file when it does, and answer the shell only when it does not. `_redirects` cannot express negative wildcards.
- **Alternative**: drop the prefix wildcard block and write exact rules only for the genuinely app-only routes (`/compare`, `/auth`, `/search`, `/evaluations`, `/transparency` bare roots are already in place), letting unknown sub-paths return to the honest 404 behavior established on 10-13; the cost is that CMS detail pages published between builds 404 until the next build.
- **Guardrail**: `doc/redirects_zh.md`'s invariant "**static files win** (never add rules for already-prerendered paths)" is contradicted by live behavior — its probes only proved that exact-source rewrites are dead weight after clean-URL resolution and that wildcard+`/index.html` is dropped; a wildcard rule was **never tested against a path that has a prerendered sibling**. Recommend revising that doc and adding a live assertion (to `check:redirects` or the health check) that samples 2–3 nested prerendered routes and asserts their online title/canonical are self-referential rather than the homepage's.

### 4.6 Relation to the parallel doc

`doc/redirects_{zh,en}.md` (parallel session, after commit `623458f`) accurately documents the three Pages pitfalls (wildcard `/index.html` dropping, `200!` rejection, rule-count cap), but its "static files win" inference is disproven by tonight's deploy. Cross-referencing both docs is recommended.

## 5. stable-track migration assessment

- **No new GSC Performance export** (`find doc -newermt "2026-10-20 11:26"` returns only the parallel session's redirects docs; the newest Downloads item is still the 10-19 Coverage zip, byte-identical to 10-18) → migration status **unconfirmed**; baseline remains `/` + `/products/balance-bikes/` (10-15).
- GSC lags 2–3 days; the visibility window 10-19~24 is open, with a deterministic read expected **10-22~24**. Recommend exporting Performance (Query contains "stable track" → PAGES) then and re-checking.
- Tonight's regression does not change the migration verdict, but adds two footnotes:
  - `/products/balance-bikes/` still answers 200 (shell), so its landing-page identity survives short-term;
  - `/guides/scenario/balance-bike-stability` (new CMS stability article from 10-20, title "Stable Track Balance Bikes: What Holds") currently canonicalizes to the homepage — **until §4 is fixed it cannot become a landing page**; once fixed it is the natural candidate landing page for the stability topic and should be watched.

## 6. Secondary findings

1. `/guides` hub prerender title is suspected mismatched ("How to Choose a Baby Stroller…"); local dist shows the same — minor content bug, worth tracing the prerender's title source.
2. IndexNow snapshot `scripts/seo/.last-indexnow.json` still lists **266 URLs** (updatedAt 10-19T19:46:11.992Z) — the 3 CMS guides from 10-20 are **not yet submitted**; key file is live 200. Recommend submitting the 3-URL increment.
3. Previous-owner spam URLs unchanged: apex 404, www 301→apex→404 (last valid Bing-index observation r11: day 11 still listed; this run's control probe was polluted).

## 7. GSC Page indexing background (known as of 2026-10-16, not re-queried)

- Fig.1 "Alternate page with proper canonical tag" = 9 pages and Fig.2 "Page with redirect" = 4 pages are both benign (currency/www/underscore/guide variants correctly canonicalized/301-deduplicated).
- The only remaining watch item: Fig.2's top banner "Validation failed (10/11→10/13)". Combined with the 10-18/10-19 Coverage exports: the redirect group (4) is **Started** (the 10-16 re-VALIDATE FIX was accepted by Google; server-side 301 backing live since r5); the canonical group (9) is still Failed but root-caused and fixed (`3f01510`, deployed) → **no further VALIDATE FIX**; self-heals on recrawl (trend 6→4→…→0).
- No new screenshots/exports this run; the above carries over. **Caveat**: if tonight's §4 regression persists, the next Coverage export may surface a new canonical-duplicate group — another reason to fix §4 promptly.

## 8. Recommended next steps (by priority)

1. **P0 — fix §4 (SPA fallback swallowing prerenders) immediately**: either move the fallback into the Worker with existence probing (§4.5 preferred) or temporarily remove the prefix wildcard block to restore the 10-13 404 behavior. Every hour of delay means 255 content pages get crawled once more as homepage duplicates. After the fix, add the live assertion from §4.5 to prevent recurrence.
2. **P1 — export GSC Performance on 10-22~24** (Query contains "stable track" → PAGES) to confirm whether the landing page is still only `/` + `/products/balance-bikes/`; also export Coverage to see whether the redirect group turns Passed and whether any new canonical group appears.
3. **P2 — submit the IndexNow increment** (3 CMS guides) to keep the submission snapshot in sync with the sitemap.
4. **P2 — fix the `/guides` hub prerender title**.
5. **P3 — Bing `site:` checks from this sandbox have been interfered with for 12+ consecutive runs**: treat GSC as the source of truth for indexing; for a Bing-side cross-check, run `site:balancebiketoddler.com/balance-bike-stability/` and the budget equivalent from a normal network.

## 9. Run archive (method and raw data)

- All probes used `--noproxy '*'` with no query; window 2026-10-21 01:51–02:10 GMT+8.
- Sitemap: `/tmp/sitemap-check.xml` (43281 bytes; 269 loc / 269 priority / 259 lastmod).
- Live URL set: `/tmp/live-urls.txt` (269 URLs, diff 0 vs dist).
- Polluted probes (void this run): WebSearch site: ×2 (operator ignored), Bing budget site: (Baidu spam), Bing whole-domain control (gov spam).
- Valid readings: Bing stability site: = well-formed no-results (zh); all sitemap checks; both target pages 200 + self-canonical; seo:health 100/100; all §4 probes (incl. direct `.html` requests, unknown sub-path, and uncovered-prefix controls).
- No site code modified; HEAD moved during the run via parallel-session commits (`623458f` etc., redirects work).
