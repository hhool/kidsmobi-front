# Indexing Check & "stable track" Landing-Page Migration Review — 2026-10-19 (run 6, first cross-day run)

> Related docs: `doc/gsc-2026-10-18-stable-track_en.md` (runs 1-2 of 10-18), `doc/gsc-2026-10-18-stable-track-r3_en.md` / `-r4_` / `-r5_` (runs 3-5 of 10-18), `doc/spa-canonical-overwrite-2026-10-19_en.md` (today, parallel session: SPA canonical root-cause + fix), `doc/gsc-coverage-2026-10-18-analysis_en.md` (10-18 Coverage deep-dive)
> Nature: read-only verification + documentation. **No site code modified.**
> Run window: 2026-10-19 01:59-02:10 (GMT+8); findings are the cross-day increment to the 10-18 series.

## 0. Summary

| Check | Result |
|---|---|
| `/balance-bike-budget/` live status | ✅ 200, `index,follow,max-image-preview:large`, self-canonical, title "Budget Balance Bike: Cheap Picks That Last" |
| `/balance-bike-stability/` live status | ✅ 200, `index,follow,max-image-preview:large`, self-canonical, title "Stable Track Balance Bike: Track Width" |
| Are the two pages indexed? | ❌ Still unverifiable from this sandbox; most likely **NOT yet indexed**. WebSearch again ignores the `site:` operator (both queries returned 5 off-domain articles, 0 on-domain); Bing whole-domain control confirms the site IS indexed; best Google-side evidence remains the 10-12 Coverage export (14/271 indexed, 26-day plateau). Pages submitted 10-15 → effects visible 10-19~24 at the earliest — **that GSC visibility window opens today** |
| sitemap.xml | ✅ 200 + `application/xml; charset=utf-8` + **247 URLs** + **247/247 with `<priority>`** + both new pages + max lastmod 2026-10-16T12:22:46.520Z (6th consecutive identical reading) → **no Worker interception recurrence, no edge staleness** |
| `npm run seo:health` | ✅ **100/100** (15/15 pass, 0 broken sampled links); KEY_URLS covers both new pages |
| stable-track landing-page migration | ⏳ Unconfirmed and still mechanistically blocked (stability page itself is not indexed → cannot be the landing page); 10-15 baseline (`/` + `/products/balance-bikes/`) presumed standing. **No new GSC Performance export today** (`find doc -newermt "2026-10-18 23:00"` returned only 3 other-automation docs, no GSC data) |
| GSC validation status | ➖ No new screenshot/export; carries over r3/r5: redirect group (4) = **Started**; canonical group still Failed. 🆕 Today's parallel session root-caused and fixed the canonical bug (SPA hydration overwrite, front `3f01510`, deployed) — that group needs **no further VALIDATE FIX**; it will self-heal on Google's next crawl |
| Legacy spam URLs | ⚠️ Still in Bing's index (day 7): under the www host they 301 → apex, then **404** (final status unchanged vs. prior runs); optional Bing Webmaster Tools removal request |

## 1. Indexing check (Bing first)

| Channel | Query | Result | Usable? |
|---|---|---|---|
| WebSearch | `site:balancebiketoddler.com/balance-bike-budget/` | 5 off-domain balance-bike articles (peggyomara / trekbikesblog / pookapages / adorablyperfect), 0 on-domain | ❌ `site:` operator ignored (known sandbox constraint, consistent with all prior runs) |
| WebSearch | `site:balancebiketoddler.com/balance-bike-stability/` | 5 off-domain articles (smallsmart ×2 / bisiklopedi / portcycling / bebeluxbaby), 0 on-domain | ❌ same |
| Bing (WebFetch, whole-domain control) | `site:balancebiketoddler.com` | 10 genuine results: home, /about, /products, /reviews + 5 product detail pages | ✅ **site confirmed in Bing's index** (valid control) |

**Interpretation:**

- In this sandbox the per-path `site:` queries again produced no usable signal (operator ignored / canned content). **No "indexed / not indexed" verdict is possible for the two new paths from here** — a constraint now documented across 6 runs, not a site issue. The authoritative verdict requires GSC URL Inspection (user-side) or a `site:` check from a normal network.
- The whole-domain top 10 still contains no `/balance-bike-*` asset page (budget / stability / size-chart all absent) — compatible with "asset pages not yet in Bing's index", but top-10 absence is not proof.
- Best Google-side evidence remains the 10-12 Coverage export (14/271 indexed, 26-day plateau): pages submitted 10-15, Request Indexing 10-16 → **most likely not yet indexed**; with GSC's 2-3 day lag, **10-19~24 is the visibility window for the submission, opening today**.

## 2. Sitemap self-check

Fetch method: `curl -s --noproxy '*' https://balancebiketoddler.com/sitemap.xml` (clean path, no query, no cache-buster — i.e. exactly what Google fetches).

| Check | Expected | Measured | Verdict |
|---|---|---|---|
| HTTP status | 200 | 200 | ✅ |
| Content-Type | application/xml | `application/xml; charset=utf-8` | ✅ |
| URL count | 247 | **247** (delta 0) | ✅ |
| Contains balance-bike-budget | yes | yes | ✅ |
| Contains balance-bike-stability | yes | yes | ✅ |
| Contains `<priority>` | yes | **247/247** | ✅ backend `f2046bf` still holding (4th consecutive full-priority confirmation) |
| Not JSON / not 404 / not 260-URL legacy format | — | max lastmod = **2026-10-16T12:22:46.520Z** (identical across 6 runs; no new content deployed since, as expected) | ✅ **no Worker interception recurrence, no edge staleness** |

**Conclusion: all seven checks green, no alert needed.** The 10-15/16 clean-path fix and the priority fix have now been stable for 80+ hours; the post-push auto-purge workflow's sitemap re-verification continues to hold (lastmod has not drifted).

## 3. Health check (optional, executed)

```
SCORE: 100/100  (pass 15, warn 0, fail 0 of 15)
```

robots.txt, sitemap.xml (247, delta 0), 15 key-page metadata sets (both new pages included), llms.txt (1137B), 15 sampled internal links with 0 broken. Note: today's front `c3a457f` fixed the script flaw exposed in r4 (network blips counted as broken links), removing that false-dip risk.

## 4. 🆕 SPA canonical bug: root-caused and fixed (from today's parallel session)

The biggest site-side change today, directly relevant to this check (front `3f01510`, deployed; details in `doc/spa-canonical-overwrite-2026-10-19_en.md`):

- **Bug**: every route hydrated into a section tab (news/guides/reviews) that was not the section index itself had its canonical overwritten by the SPA to the section home; transparency pages had the trailing slash stripped. ~**41 sitemap URLs + 7 transparency pages** affected. Google renders JS and trusted the wrong renderer — this is the root cause of the GSC "Alternate page with proper canonical tag" samples (`/guides/beginner/best-balance-bike-for-1-year-old`, `/news/new_product`, etc.).
- **Fix**: single-source module `src/lib/canonicalPath.ts` + new guard `npm run check:spacanonicals` (250 routes all consistent).
- **Two implications for this task**: ① live regression re-test confirms the **budget and stability pages' hydrated canonicals are correct self-references** — the two new pages' path to indexing is clean; ② that GSC group needs **no** "Done fixing?" / VALIDATE FIX click — it is not a fix-then-validate scenario; the trend was already declining (6→4→…→0) and will self-heal on Google's next crawl (see that doc §6).

## 5. stable-track migration (no new GSC export)

- Checked `doc/` during the run: `find doc -newermt "2026-10-18 23:00"` returned only today's 3 other-automation docs (backlink outreach pack / cms-p2-hygiene closure / spa-canonical), **no GSC Performance export**.
- Migration status therefore carries over r3/r5: **unconfirmed and mechanistically blocked** — the stability page itself is not indexed, so it cannot be selected as the landing page for "stable track"; the 10-15 baseline (`/` + `/products/balance-bikes/`) is presumed standing.
- With GSC's 2-3 day lag, a Performance export including today (Query contains `stable track` → PAGES tab) should land **10-19~24**; this automation checks for a new export on every run.

## 6. GSC Page indexing background (known as of 2026-10-16, not re-queried)

- **Benign, no action**: "Alternate page with proper canonical tag" and "Page with redirect" — currency / www / underscore / guide variants are all correctly canonicalized or 301-deduplicated.
- **Sole remaining watch item**: the top-of-figure-2 "Validation failed (10/11→10/13)" banner — r3 confirmed the redirect group (4) is **Started** after the 10-16 re-VALIDATE FIX; the canonical group remains Failed. No new screenshot/export this run, so status carries over.
- 🆕 **Canonical group handling has changed**: with today's root-cause fix deployed, per the parallel session's conclusion **do not click VALIDATE FIX again**; if the group still shows Failed for the user, it is a benign record that will clear on recrawl (trend already declining).
- Redirect group: server-side 301 backing has been in place since r5 (23/23); the next Coverage export should show Started → Passed.
- Also: the `/auth/` noindex row (cookie-modal dead link, fixed by front `95b755f`) will clear on Google's next crawl.

## 7. Next steps (by priority)

1. **GSC URL Inspection on both new pages** (data window opens today): the only action that yields an authoritative indexed/not-indexed verdict. If "Discovered – currently not indexed" or "Crawled – currently not indexed", Request Indexing can be clicked once more (10-16 already clicked once; keep ≥1 week spacing).
2. **Export Performance (Query contains `stable track` → PAGES tab)** to verify the landing-page migration; drop it into `doc/` and this automation will analyze it automatically.
3. **Next Coverage export, watch for**: ① indexed count 14 → 15/16 (submission taking effect) ② redirect validation Started → Passed ③ canonical group count continuing to decline (self-healing post-fix, no intervention needed).
4. **Backlinks remain the only real lever**: the diagnostic chain (26-day plateau + 94% Discovered-not-indexed + zero backlinks) is unchanged; today's `doc/backlink-outreach-pack-2026-10-19_en.md` (16 targets, 3 tiers, 4 email drafts) is ready to launch outreach from.
5. **(Optional) Bing Webmaster Tools removal** for the two legacy spam URLs (day 7 still indexed; www 301→apex 404, final status unchanged; they would decay naturally anyway).
6. **(Optional) Backend**: nothing pending — 301 routes (since r5), priority fix, and sitemap clean path are all stable.

## 8. Run archive (method & raw data)

- Sitemap: `curl -s --noproxy '*' -D - -o /tmp/sitemap.xml https://balancebiketoddler.com/sitemap.xml` → 200 / `application/xml; charset=utf-8` / Content-Length 39888 / CF-RAY a4c970b1eb4875a3-LAX; `grep -o '<loc>' | wc -l` = 247; `grep -o '<priority>' | wc -l` = 247; max lastmod = 2026-10-16T12:22:46.520Z (identical across 6 runs).
- Two new pages: direct curl → 200 / `index,follow,max-image-preview:large` / self-canonical; titles "Budget Balance Bike: Cheap Picks That Last | BalanceBikeToddler" and "Stable Track Balance Bike: Track Width | BalanceBikeToddler".
- Bing: WebSearch `site:` ×2 (operator ignored, off-domain results); WebFetch Bing whole-domain control ×1 (site in index, top 10 free of /balance-bike-* asset pages).
- Health check: `npm run seo:health` ×1 → 100/100 (15/15).
- Spam URLs: `curl -I` ×2 → www host 301 → apex same path → 404 (final status 404, unchanged; still in Bing's index on day 7).
- IndexNow snapshot `scripts/seo/.last-indexnow.json`: updatedAt 2026-10-15T16:18:44.835Z unchanged, 247 URLs incl. both new pages.
- git (front): today added `3f01510` SPA canonical fix, `c3a457f` health-script false-positive fix, `21ae969`/`13ee52a`/`9c00d2e` docs & gitignore commits; **this run made zero changes**.
- GSC exports/screenshots: none new (`find doc -newermt "2026-10-18 23:00"` contains no GSC data files).
