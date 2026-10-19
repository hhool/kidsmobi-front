# Indexing Check & "stable track" Landing-Page Migration Review — 2026-10-19 (r7, same-day repeat trigger)

> Related: `doc/gsc-2026-10-19-stable-track_en.md` (today's r6, 01:59), `doc/gsc-2026-10-18-stable-track-r3/r4/r5_en.md`, `doc/spa-canonical-overwrite-2026-10-19_en.md` (SPA canonical bug root-cause + fix), `doc/gsc-coverage-2026-10-18-analysis_en.md` (10-18 Coverage deep-dive)
> Nature: read-only verification + documentation; **no site code modified**.
> Run window: 2026-10-19 09:00-09:05 (GMT+8); conclusions are a same-day increment over today's r6.

## 0. Summary

| Check | Result |
|---|---|
| `/balance-bike-budget/` live status | ✅ 200, `index,follow,max-image-preview:large`, self-canonical, title "Budget Balance Bike: Cheap Picks That Last" |
| `/balance-bike-stability/` live status | ✅ 200, `index,follow,max-image-preview:large`, self-canonical, title "Stable Track Balance Bike: Track Width" |
| Are the two pages indexed? | ❌ Still unverifiable from this sandbox; most likely **not yet indexed**. WebSearch `site:` operator ignored for the 7th consecutive run (5 off-domain results each, 0 on-domain); **Bing whole-domain control was tampered for the first time this run** (returned canned Chinese university-library content unrelated to the domain — control void). Best Google-side evidence remains the 10-12 Coverage export (14/271, 26-day plateau). Pages submitted 10-15, Request Indexing 10-16 — **the GSC visibility window (10-19~24) opens today** |
| sitemap.xml | ✅ 200 + `application/xml; charset=utf-8` + **247 URLs** + **247/247 with `<priority>`** + both new pages + max lastmod 2026-10-16T12:22:46.520Z (7th consecutive match) → **no Worker interception recurrence, no edge staleness** |
| `npm run seo:health` | ✅ **100/100** (15/15 pass, 23s; KEY_URLS observed to include stability / budget / what-buyers-say + 2 transparency pages) |
| stable-track landing-page migration | ⏳ Unconfirmed and still mechanistically blocked (stability page not indexed → cannot be the landing page); 10-15 baseline (`/` + `/products/balance-bikes/`) presumed to hold. **Still no new GSC Performance export** (after 02:00, `doc/` gained only r6's own docs) |
| GSC validation status | ➖ No new screenshot/export; carries over: redirect group (4) = **Started** (server-side 301 backing live since r5); canonical group still Failed but **root cause fixed** (SPA hydration overwrite, front `3f01510` deployed) — per the parallel-session conclusion, **do NOT re-trigger VALIDATE FIX**; self-heals on recrawl |
| Previous-owner spam URLs | ⚠️ Still live 404 (unchanged); Bing index status not re-verifiable this run (control tampered); last valid observation (r6): still in Bing index, day 7 |

## 1. Indexing check (Bing first)

| Channel | Query | Result | Usable? |
|---|---|---|---|
| WebSearch | `site:balancebiketoddler.com/balance-bike-budget/` | 5 off-domain balance-bike articles (peggyomara ×2 / propelrc / pookapages / kayakcambria), 0 on-domain | ❌ `site:` operator ignored (known sandbox constraint, 7th consecutive) |
| WebSearch | `site:balancebiketoddler.com/balance-bike-stability/` | 5 off-domain articles (smallsmart ×2 / velomagazine / trytovi / portcycling), 0 on-domain | ❌ Same |
| Bing (WebFetch, whole-domain control) | `site:balancebiketoddler.com` | Returned canned Chinese university-library results (sync.cctv.net.cn / dm5 / ccsu / lib.jxnhu / zisu / iclass30 / xyu / hcnu / dxzyk / github), entirely unrelated to the domain | ❌ **Control tampered this run — void** (r6's control was valid: site IS in Bing's index) |

**Reading:**

- Neither the `site:` path queries nor the whole-domain control produced trustworthy output this run (operator ignored / canned-content pollution). **No "indexed / not indexed" verdict for the two new paths is possible from this sandbox** — an environment constraint now recorded 7 times, not a site problem. The authoritative verdict requires GSC URL Inspection (user side) or a `site:` check on a normal network.
- Last valid control (today's r6, 01:59): Bing whole-domain top 10 contained no `/balance-bike-*` asset pages (budget / stability / size-chart all absent) — compatible with "asset pages not yet in Bing's index", but absence from top 10 is not proof.
- Best Google-side evidence remains the 10-12 Coverage export (14/271 indexed, 26-day plateau): pages submitted 10-15, Request Indexing 10-16 → **most likely not yet indexed**; with GSC's 2-3 day lag, **today (10-19) opens the submission-effect visibility window 10-19~24**.

## 2. Sitemap self-check

Method: `curl -s --noproxy '*' https://balancebiketoddler.com/sitemap.xml` (clean path, no query, no cache-buster — i.e. exactly what Google fetches).

| Check | Expected | Observed | Verdict |
|---|---|---|---|
| HTTP status | 200 | 200 | ✅ |
| Content-Type | application/xml | `application/xml; charset=utf-8` | ✅ |
| URL count | 247 | **247** (delta 0) | ✅ |
| Contains balance-bike-budget | yes | yes | ✅ |
| Contains balance-bike-stability | yes | yes | ✅ |
| Contains `<priority>` | yes | **247/247** | ✅ Backend `f2046bf` still holding (5th consecutive run with full priority) |
| Not JSON / not 404 / not 260-URL legacy format | — | max lastmod = **2026-10-16T12:22:46.520Z** (7th consecutive match; no new content deployed since, as expected) | ✅ **No Worker interception recurrence, no edge staleness** |

**Verdict: all seven checks green, no alert needed.** The 10-15/16 clean-path fix and the priority fix have now been stable for ~90 hours; the post-push auto-purge workflow's sitemap re-verification continues to hold (lastmod not drifting).

## 3. Health check (optional, executed)

```
SCORE: 100/100  (pass 15, warn 0, fail 0 of 15)
```

robots.txt, sitemap.xml (247, delta 0), metadata for 15 key pages (incl. both new pages), llms.txt (1137B), 15 sampled internal links 0 broken; 23s runtime. Observed KEY_URLS: /, /products, /reviews, /guides, /news, /about, stability, budget, what-buyers-say, testing-methodology, certification-lab-notes — yesterday's budget-page addition is confirmed in place; no further action on this item.

## 4. stable-track migration (still no new GSC export)

- `doc/` scanned during the run: after 02:00 the only new files are today's r6 docs (this automation's own previous output) — **no GSC Performance export**.
- No new evidence on migration status; r3/r5/r6 conclusion carries over: **unconfirmed and mechanistically blocked** — the stability page is not indexed, so Google cannot select it as the "stable track" landing page; the 10-15 baseline (`/` + `/products/balance-bikes/`) is presumed to hold.
- With GSC's 2-3 day lag, a Performance export covering today (Query contains `stable track` → PAGES tab) lands **10-19~24**; this automation re-checks for new exports on every run and analyzes them automatically once present.

## 5. GSC Page indexing background (known as of 2026-10-16, not re-queried)

- **Benign, no action needed**: "Alternate page with proper canonical tag" and "Page with redirect" — currency / www / underscore / guide variants are all correctly canonicalized or 301-deduplicated.
- **Sole remaining watch item**: the "Validation failed (10/11→10/13)" banner — r3 confirmed the redirect group (4) is **Started** after the 10-16 re-VALIDATE FIX; the canonical group is still Failed. No new screenshot/export this run; status carries over.
- **Canonical-group handling unchanged**: root cause (SPA hydration overwrite) fixed and deployed today (front `3f01510`); **no further VALIDATE FIX needed** — if the user still sees Failed, it is a benign record in a declining trend that clears on recrawl.
- Redirect group: server-side 301 backing in place since r5 (23/23); the next Coverage export should show Started → Passed.
- The `/auth/` noindex row (cookie-modal dead link, fixed by front `95b755f`) will clear on Google's next crawl.

## 6. Next steps (by priority)

1. **GSC URL Inspection for both new pages** (visibility window opens today): the only action that can authoritatively settle "indexed or not". If "Discovered – currently not indexed" or "Crawled – currently not indexed", another Request Indexing click is justified (10-16 click was a week-ago action; ≥1 week spacing recommended).
2. **Export Performance (Query contains `stable track` → PAGES tab)** to verify the landing-page migration; drop it into `doc/` and this automation analyzes it automatically.
3. **Next Coverage export — watch for**: ① indexed count 14 → 15/16 (submissions taking effect) ② redirect validation Started → Passed ③ canonical group count continuing to decline (natural decay post-fix, no intervention).
4. **Link building remains the only real lever**: the 26-day plateau + 94% Discovered-not-indexed + zero-backlinks diagnostic chain is unchanged; `doc/backlink-outreach-pack-2026-10-19_en.md` (16 targets, 3 tiers, 4 email drafts) is ready to launch.
5. **(Optional) Bing Webmaster Tools removal** for the two previous-owner spam URLs (live 404, will decay naturally; Bing-side presence last validly observed at r6).
6. **(Optional) Backend**: no new to-dos — 301 routing (since r5), priority fix, and sitemap clean path all stable.

## 7. Run archive (method + raw data)

- Sitemap: `curl -s --noproxy '*' -D - -o /tmp/sitemap.xml https://balancebiketoddler.com/sitemap.xml` → 200 / `application/xml; charset=utf-8` / Content-Length 39888; `grep -o '<loc>'` = 247; `grep -o '<priority>'` = 247; both new-page `<loc>`s present; max lastmod = 2026-10-16T12:22:46.520Z (7th consecutive match).
- New pages: direct curl → 200 / `index,follow,max-image-preview:large` / self-canonical; titles "Budget Balance Bike: Cheap Picks That Last | BalanceBikeToddler" and "Stable Track Balance Bike: Track Width | BalanceBikeToddler".
- Search: WebSearch `site:` ×2 (operator ignored, 5 off-domain results each); WebFetch Bing whole-domain control ×1 — **tampered this run, control void** (r6's control was valid).
- Health check: `npm run seo:health` ×1 → 100/100 (15/15, 23s).
- Spam URLs: `curl` ×2 → `/panties/fashion-models-directory.php` and `/spanking/hardman-cnn-models.php` both 404 (final live status unchanged).
- IndexNow snapshot `scripts/seo/.last-indexnow.json`: updatedAt 2026-10-15T16:18:44.835Z unchanged; 247 URLs incl. both new pages.
- git (front): no new commits since r6 (HEAD still `9c00d2e`; r6's two docs still untracked); this run made **zero changes**.
- GSC exports/screenshots: none new (`find doc -newermt "2026-10-19 02:00"` returns only r6's own docs).
