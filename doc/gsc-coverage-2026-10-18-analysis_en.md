# GSC Coverage Export Analysis (2026-10-18)

**Source**: user-exported GSC Page indexing (Coverage) report `balancebiketoddler.com-Coverage-2026-10-18.zip` (Chart.csv / Critical issues.csv / Metadata.csv; Non-critical issues empty).
**Chart data ends 2026-10-12** (GSC charts lag the export date by ~6 days; actions from 10-13~10-18 first become visible ~10-19~10-24).
**Companion site-side forensics**: live crawl of all 247 sitemap URLs (script `tmp/gsc-coverage-2026-10-18/forensics.mjs`, results `coverage-forensics.json`).

---

## 0. TL;DR

| Question | Answer |
|---|---|
| Current indexing state | **14 / 271 pages indexed (5.2%)**, pinned at 13-14 for 26 days since 09-22, zero net growth |
| Are /balance-bike-budget/ and /balance-bike-stability/ indexed | **Almost certainly not** — they sit in "Discovered - currently not indexed" (242). Both pages are technically flawless live (200 / self-canonical / index,follow / sitemap priority 0.9); submitted via IndexNow 10-15 + Request Indexing 10-16; the chart can't show it (ends 10-12) |
| What was the "Validation failed" in the 10-13 screenshot | **"Alternate page with proper canonical tag" — 9 pages, validation Failed** (answers #5); "Page with redirect" (4) is Started |
| Is this a technical problem | **No.** All 247 sitemap URLs are live 200, self-canonical, indexable, with real prerendered content and full hub→detail internal linking. This is a **crawl-demand / site-authority** problem |
| Found and fixed this round | ① cookie modal's Privacy Policy pointed at a 404+noindex dead link (= GSC's 1 noindex page) ② 23 retired duplicate listings 404'd instead of 301-ing to survivors per their own documented policy |
| What actually moves the needle | External links (the only real lever) + small-batch Request Indexing + time. See §8 |

---

## 1. The export itself

- **Known pages 271** = 14 indexed + 257 not indexed.
- Composition of 271 (inferred): **247 (sitemap) + 23 (retired duplicate listings) + 1 (/auth/)**. 404 rows don't appear in these two CSVs — "Not found (404)" carries no validation state, and this export only includes rows with one (consistent with all 6 Critical rows having states, including one Passed/0). Inference, not stated by the export.
- Impressions 0-12/day, consistent with the 10-16 Performance analysis (US 156 impressions / 0 clicks).

## 2. Not-indexed breakdown (257)

| Reason | Pages | Validation | Reading |
|---|---|---|---|
| Discovered - currently not indexed | **242** | Started | Google knows the URLs (sitemap) but hasn't scheduled crawls. **The bottleneck** |
| Alternate page with proper canonical tag | 9 | **Failed** | Off-sitemap URL variants (see §5) |
| Page with redirect | 4 | Started | Redirecting; likely to pass |
| Excluded by 'noindex' tag | 1 | Not Started | **= /auth/** (cookie-modal dead link, fixed this round, §6) |
| Crawled - currently not indexed | 1 | Started | Crawled but not indexed — single-page quality/authority signal; needs the GSC URL list to identify |

## 3. The 26-day plateau: chart inflection points × key dates

| Date | Chart event | Corresponding action |
|---|---|---|
| 08-14 | First data: indexed 8 | — |
| 08-29 | Indexed slides to 5 | — |
| 09-15 | Not-indexed 13→47 | — |
| **09-22** | **Not-indexed 47→257, indexed 5→14** | Full sitemap submission (Metadata: "All known pages") — Google discovered everything at once but indexed only 14 |
| 09-22→10-12 | **21 days flat at 13-14** | The 10-13/14 product prune, 10-15 IndexNow and 10-16 Request Indexing produced **no visible chart change** (chart ends 10-12; and the plateau already ran 21 days) |
| 10-05~10-09 | Indexed 14→13→14 brief dip | One page in/out; no action needed |

Impressions comparison: 172 in the month before the sitemap vs 86 in the three weeks after — **5× more discovery, half the impressions**. The classic signature of a site with no crawl demand.

## 4. Status verdict for the two target pages

Live probes (this round):

- `https://balancebiketoddler.com/balance-bike-budget/` → 200, `<link rel="canonical" href=".../balance-bike-budget/">` (self), `robots: index,follow,max-image-preview:large`, title fine
- `https://balancebiketoddler.com/balance-bike-stability/` → same, all clean
- Both are in the 247-URL sitemap at priority 0.9 (same tier as recalls + the 7 plan-B assets)

Verdict: both pages are **certainly among the 242 "Discovered - currently not indexed"** (submitted via IndexNow only on 10-15; the chart ends 10-12; and the site-wide ceiling is 14). GSC URL Inspection is the only channel that can confirm directly (user-side; 10-19~20 before the 10-16 submissions surface).

## 5. Answer to #5 + the 9 alternates

The 10-13 screenshot's "Validation failed (10/11→10-13)" maps to **Alternate page with proper canonical tag (9 pages, Failed)** — the user's 10-16 VALIDATE FIX re-check still failed. "Page with redirect" (4 pages) is Started, not a failure.

Site-side finding: **all 247 sitemap URLs are self-canonical (verified live one by one, 0 exceptions)**, so the 9 alternates are off-sitemap URL variants (legacy forms / variants Google discovered itself). The prerendered HTML contains **zero parameterized internal links** (grep-verified), so there is nothing further to pin down site-side — **open the issue row in the GSC UI and copy the 9 URLs**; paste them and the pattern can be identified.

## 6. Site-side forensics and two fixes

### 6.1 Full live forensics (247/247)

| Check | Result |
|---|---|
| HTTP status | 247/247 = 200 |
| noindex | **0** |
| Non-self canonical | **0** |
| Prerendered visible text | detail pages 4.5k-5.7k chars, hubs 7k — not thin |
| hub→detail internal links | balance-bikes hub links all 15 details; kids-bikes hub links all 24 — no depth problem |
| Parameterized internal links | 0 |

### 6.2 Fix ①: cookie-modal dead link (front `95b755f`, auto-deploys to Pages)

`CookieConsentModal`'s "Privacy Policy" pointed at `/auth` — a **404 wearing noindex,nofollow**. That is exactly GSC's 1 "Excluded by noindex" page, and every first-time visitor was sent to the dead link. Now points at the real `/transparency/privacy-policy/` (200, index,follow, in the sitemap).

### 6.3 Fix ②: 301s for the 23 retired listings (backend `7a4f4db`, **pending manual Worker deploy**)

The stage-1/stage-2 prune maps only fed sitemap exclusion — **the retired URLs themselves 404'd live** (no Pages rule; the Worker never saw those paths). Yet the stage reports state the policy outright: variants are "301'd to the listing with the most reviews". And these URLs were advertised in the sitemap for three weeks (09-22 → 10-13/14); Google's known set of 271 = 247+23+1 fits exactly, so three weeks of discovery burned on 404s.

The fix (three parts, single source of truth):
- `front/scripts/sync_prune_map_to_worker.mjs` now also emits `PRUNED_PRODUCT_REDIRECTS` (full path → full path; categories resolved from the stage reports via `PRODUCT_CATEGORY_URL_SLUGS`, hard-failing on a missing category instead of guessing paths) and keeps the matching wrangler.toml route block in lockstep
- Worker `handleRequest` consults both redirect maps, normalizing trailing slashes (slash-form variants also land on the survivor)
- wrangler.toml gains 23 exact routes (45→68)

**Deploy command** (needs a CF token; same discipline as before — env vars only, never on disk):

```bash
cd /d/project/kidsmobi/backend/api/worker && CLOUDFLARE_API_TOKEN=<token> CLOUDFLARE_ACCOUNT_ID=b40383bf3afb30ccc7c9a13d6c9b6868 npx wrangler deploy
```

## 7. Diagnosis: crawl demand, not technology

Evidence chain:
1. 26-day plateau at 13-14 indexed (after the 09-22 full sitemap submission)
2. 247/247 technically flawless (§6.1)
3. Impressions 86/3 weeks (~4/day) — zero demand signal reaching Google from this site
4. New domain, zero backlinks (confirmed in prior sessions)
5. "Discovered - currently not indexed" = 94% of not-indexed — Google's own phrasing is "known, not scheduled"

Google's strategy for no-demand sites: sitemap URLs go to a discovery parking lot and are released in batches based on whole-site signals. **Until the site generates external demand signals, no amount of sitemap/IndexNow submission raises the ceiling.**

## 8. Recommended actions (by leverage)

1. **External links (the only real lever)**: even 3-5 relevant links (parenting forums, buying-guide roundups, HARO/expert queries) bend the crawl-demand curve. User-side operation; the agent cannot do this.
2. **Small-batch Request Indexing**: 2 done (10-16). Submit the top 5-10 target pages in small batches (a few per day, not 240 at once — bulk patterns get deprioritized), via GSC URL Inspection → Request Indexing.
3. **Wait out the cycle**: Google re-evaluates parked URLs on a weeks-to-months cycle. The 10-15/16 submissions first become readable ~10-19~10-24.
4. **Keep technical hygiene green** (done; nothing further to do).
5. On the next Coverage export, check: ① indexed 14 → 15/16 (the two submissions landing) ② "Page with redirect" validation flipping to Passed ③ whether "Alternate page" still fails (if so, expand and copy the 9 URLs to the agent).

## 9. User-side checklist

| # | Action | Est. time |
|---|---|---|
| 1 | GSC URL Inspection for both pages (10-19~20 before the 10-16 submissions surface) | 2 min |
| 2 | Expand the "Alternate page with proper canonical tag" row in GSC, copy the 9 URLs to the agent | 1 min |
| 3 | (Optional) Bing Webmaster Tools removal for the two previous-owner residue URLs (/panties/…, /spanking/…, 404 for five days) | 1 min |
| 4 | Deploy Worker backend `7a4f4db` (paste a CF token for the agent to run it, or run the §6.3 command yourself) | 1 min |
| 5 | (Strategic) Start link building | ongoing |
