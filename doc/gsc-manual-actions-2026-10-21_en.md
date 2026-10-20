# GSC manual actions — runbook (2026-10-21)

Three things can only be done from inside Search Console with the owner's login.
Everything else (sitemap regeneration, IndexNow, redirect/redirect-chain fixes,
JSON-LD dedup) is automated. This file is the checklist for the manual part.

Property: **balancebiketoddler.com** (domain property preferred — it covers
http/https and non-www together).

Google does **not** participate in IndexNow, so nothing we push server-side
reaches Google's index on its own. GSC is the only lever.

---

## 1. Re-submit the sitemap

**Why:** the sitemap was rebuilt and its URL set changed several times since the
last confirmed GSC read (retired URLs removed, new guides added). GSC keeps
serving a stale "last read" until the entry is re-submitted.

1. GSC → **Sitemaps** (`https://search.google.com/search-console/sitemaps?resource_id=...`)
2. If an old entry for `sitemap.xml` exists, delete it first — a stale entry can
   keep reporting the old URL count.
3. Add a new sitemap: `sitemap.xml` → **Submit**
4. Expected: status turns **成功** and "已发现的网址" climbs toward **269**.

**Sanity check before submitting** (already verified 2026-10-21):

```
curl -s https://balancebiketoddler.com/sitemap.xml | grep -o "<url>" | wc -l   # 269
curl -s -o /dev/null -w '%{http_code} %{content_type}\n' https://balancebiketoddler.com/sitemap.xml
# 200 application/xml; charset=utf-8
```

The sitemap is served from two sources in lockstep (Worker D1 build without a
buster, prerendered `dist/sitemap.xml` otherwise) — both were verified to carry
the same 269 URLs.

## 2. Validate the Breadcrumb fix

**Why:** duplicate JSON-LD nodes (three emission sources, one reconciler) caused
GSC to report duplicate Breadcrumb rows on ~20 of 21 sampled pages. The fix is
deployed; the report does not clear itself until validation is requested.

1. GSC → **网页编入索引 / 网页呈现效果** → locate the breadcrumb issue
   ("Breadcrumb" / structured-data item list)
2. Open it, confirm the "示例网址" list no longer shows duplicates
3. Click **验证修复** (Validate fix)
4. Typical turnaround: a few days to two weeks; GSC emails when done.

## 3. Request indexing for the four new pages

Google's quota is roughly 10 manual requests per day. Four URLs use less than
half of it, so there is no reason to ration:

| # | URL | Status verified 2026-10-21 |
|---|---|---|
| 1 | https://balancebiketoddler.com/guides/budget/balance-bike-price-tiers | 200, in sitemap |
| 2 | https://balancebiketoddler.com/guides/beginner/balance-bike-by-age | 200, in sitemap |
| 3 | https://balancebiketoddler.com/guides/beginner/balance-bike-what-buyers-say | 200, in sitemap |
| 4 | https://balancebiketoddler.com/guides/scenario/balance-bike-stability | 200, in sitemap |

For each URL:

1. Paste into the top search bar (URL 检查)
2. Confirm it reports **网址在 Google 上建立索引** is *not* yet true — otherwise skip it
3. **请求编入索引** → wait for the confirmation dialog

**Order matters slightly:** request #2 and #3 first — they are the topic pages
the reference cluster and footer link to, so they are the ones whose indexing
status gates the internal-link graph Google sees.

---

## What NOT to redo

- Do **not** re-submit individual product/category pages manually. They are
  covered by the sitemap and IndexNow (Bing/Yandex/Naver/Seznam only — see
  above for why Google needs GSC).
- Do **not** re-run "请求编入索引" for the four URLs above on a later day unless
  the content changed again. Repeat requests for an unchanged URL do not move
  the needle and burn quota.

## Follow-up checkpoint

The next GSC export is due **2026-10-22 ~ 24** (task board #40). It should show:
impressions for the four new guides, and whether the breadcrumb issue cleared.
If the export shows the new guides still at zero impressions, the cause is more
likely topical (they compete with the far older hub pages) than technical —
compare against the baseline in `gsc-2026-10-13-analysis_en.md`.
