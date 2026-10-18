# SPA hydration rewrote canonicals into "Alternate page" — 2026-10-19

> Related: `doc/gsc-coverage-2026-10-18-analysis_en.md` (indexing plateau diagnosis, action item 5), `doc/cms-p2-hygiene-2026-10-19-closure_en.md` (CMS data hygiene closed the same day).
> Trigger: the user supplied a GSC "Page indexing → Alternate page with proper canonical tag" report (last update 10/12, 4 affected pages, 4 example URLs with crawl dates).
> Nature: root-cause analysis + code fix + guard + live re-verification. Shipped in front `3f01510` (deployed).

## 0. Summary

The four URLs GSC listed are only a sample. Investigation found a **systematic bug affecting ~40 URLs**: every route that hydrates into a section tab (news/guides/reviews) but is NOT the section index had its canonical rewritten to the section homepage by the SPA; transparency pages additionally had their trailing slash stripped, pointing the canonical at a URL that 308-redirects straight back. The static HTML was always correctly self-canonical — **the two renderers contradicted each other, and Google (which renders JS) trusted the wrong one**. Fixed, guarded, and re-verified live across six route families.

## 1. The GSC report

- Group: "Alternate page with proper canonical tag"; first detected 10/5; **4** affected pages; trend 6→4→…→0 (declining).
- Examples (URL / last crawled):
  1. `/guides/beginner/best-balance-bike-for-1-year-old` — Oct 14
  2. `/news/new_product` — Oct 11
  3. `/news/brand_news` — Oct 4
  4. `/transparency/privacy-policy/` — Sep 19

## 2. Evidence trail

1. **Static side is innocent**: all four URLs serve 200 + self-canonical + `index,follow`, and all are in the sitemap (they ARE the canonical forms).
2. **Variants are clean**: hyphenated news forms 404; no-slash/slash variants 308 onto the canonical form.
3. **Suspicion moves to the SPA**: the app mounts with `createRoot().render()` (not hydrateRoot), and the SEO effect **rewrites** the canonical link after hydration (`updateCanonicalLink` sets the href directly). curl only ever sees the static HTML — never the hydrated value.
4. **Code trace**: App.tsx's generic section branch derives the canonical from `buildCanonicalPathFromPageConfig(pageConfig, currentPath, …)`. Live CMS settings have **no `pages` map** (verified: only `seo.{home,products,…}`) → the resolver falls back to `DEFAULT_CMS_PAGE_BLUEPRINT`, whose `pageSlug` (news→"news", guides→"guides", reviews→"reviews") was applied to **every route in the tab**, not just the section index. The transparency branch additionally stripped the trailing slash via `normalizeCanonicalPath(localizedPage.path)`.
5. **Empirical proof** (Playwright + system Chrome, networkidle + 2.5s, reading the hydrated DOM):

| URL | hydrated canonical (before fix) | verdict |
|---|---|---|
| `/news/new_product` | `https://balancebiketoddler.com/news` | rewritten |
| `/news/brand_news` | `…/news` | rewritten |
| `/reviews/single/razor-a-kick-scooter-reviews-for-kids` | `…/reviews` | rewritten |
| `/guides/beginner` | `…/guides` | rewritten |
| `/transparency/privacy-policy/` | `…/transparency/privacy-policy` (no slash, 308s back) | slash stripped |
| `/guides/beginner/best-balance-bike-for-1-year-old` | self | OK (article branch `f0f5638`; GSC's Oct-14 crawl predates/coincides with that fix — historical) |

## 3. Blast radius (larger than the GSC sample)

- **Bug A (section pageSlug generalized)**: 4 news channel pages + the guides category page + `/reviews/<type>` ×5 + **31 review detail pages** ≈ **41 sitemap URLs** whose hydrated canonical pointed at the section homepage.
- **Bug B (transparency trailing slash)**: all 7 transparency pages (all trailing-slash in the sitemap).
- Collateral: those routes' title/description/keywords were also overwritten with section-homepage values (e.g. the curated "New Kids Bike & Stroller Launches" title became the section title after hydration).

## 4. The fix (front `3f01510`)

Single-source module `src/lib/canonicalPath.ts` (App.tsx now imports it):

1. `buildCanonicalPathFromPageConfig`: the pageSlug canonical applies **only at the section root**; every deeper route self-canonicalizes (pagination keeps `/page/N`). An explicit `pageConfig.canonicalPath` (editorial consolidation, currently unused) still wins.
2. `transparencyCanonicalPath`: transparency pages use their configured path **verbatim** (trailing slash preserved).
3. **Channel-page TDK preservation**: news/guides/reviews channel routes skip the section TDK block on hydration (detected via the untouched static canonical still matching the current path), keeping their curated prerendered values; client-side navigation into a channel keeps the previous behavior.
4. **New guard** `npm run check:spacanonicals`: recomputes the SPA canonical for **all 247 sitemap routes + alias/pagination edge cases** through the shared functions and compares against the canonical actually emitted into dist/ — 250 routes verified identical on both sides. This bug class survived because only titles had a guard (check:spatitles covers just the 6 section indexes); canonicals had no consistency check at all.

## 5. Verification

- Build: 247-URL baseline unchanged; all guards green (spacanonicals 250 / spatitles 28 / spakeywords 248 / titles 248 / claims 68 patterns 0 findings / reviewcounts 0 / content / links 7416 hrefs / seo:check).
- Live (Pages auto-deploy + purge workflow completed): Playwright re-test of the six affected routes — **all self-canonical** (privacy-policy keeps its slash), curated channel titles restored; regression spot-checks on product hub/detail, section indexes, the budget asset and the homepage all correct. `/products/other` is a genuine edge-level 404 (P0-2 behavior, not a regression).
- Note: local dist and the CF build produce different bundle hashes (build-environment difference, long-standing); the live version is judged by browser-observed behavior.

## 6. GSC follow-ups for the user

1. **Do not click "Done fixing?"** on this group — this is not a fix-validation scenario; the group drains naturally as Google recrawls (the trend was already 6→4→…→0). The fix is live; recrawled URLs return to "Crawled – currently not indexed" or get indexed.
2. To accelerate, run URL Inspection → Request Indexing on 2–3 of them (e.g. `/news/new_product`) — small batches only.
3. Next Coverage export: this group should keep shrinking; the headline metric remains indexed count 14 → 15/16.

## 7. Archive

- Playwright evidence/verification scripts: `front/tmp/verify-hydrated-canonical.mjs`, `front/tmp/verify-canonical-regression.mjs` (tmp/ is gitignored, local only).
- Shared module: `front/src/lib/canonicalPath.ts`; guard: `front/scripts/check-spa-canonicals.ts` (`npm run check:spacanonicals`).
