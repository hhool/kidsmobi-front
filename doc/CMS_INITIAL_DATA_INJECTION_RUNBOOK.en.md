# CMS Initial Data Injection Runbook

Use this runbook during early site setup when CMS coverage is incomplete (for example, missing published entries for kids_scooters).

## 1. Goal

Inject baseline content through CMS operations so product pages render immediately, then incrementally enrich CMS content.

## 2. Preconditions

1. Admin login is active.
2. CMS header shows:
- ENV: PRODUCTION (or target env)
- ROLE: ADMIN
- D1: CONNECTED
3. Worker API is reachable.

## 3. Recommended first-time injection order

1. Products
2. Categories
3. Scenarios
4. Evaluations
5. Guides
6. News

Tip: Inject Products first to unblock frontend product visibility fastest.

## 4. Products injection steps (critical)

In CMS Products page, use Centralized Ops Center:

1. Category: All
2. Source: Worker
3. Mode: Replace (recommended for first full baseline)
4. Click Init
5. Wait for row count refresh
6. Click Refresh to re-check counts

For category-only gaps (example: kids_scooters):
1. Set Category to the missing category (if category filter is available)
2. Source: Worker
3. Mode: Replace or Merge (prefer Merge for gap-filling)
4. Click Init

## 5. Publish-state verification

In Products list, confirm:
1. Target category records exist (for example kids_scooters)
2. Status is published (or frontend-visible state)
3. Core fields exist: name, categoryId, imageUrl

## 6. Frontend regression URLs

- https://dev.kidsmobi.pages.dev/products/kids_scooters
- https://dev.kidsmobi.pages.dev/products/balance_bike

Pass criteria:
1. Product cards are visible
2. No No matches in global database state
3. Category switching still shows data

## 7. Current code-side safety net (already active)

Frontend behavior now is:
1. CMS published data remains primary
2. Missing categories are backfilled category-by-category from fallback data sources

So during early-stage setup:
- kids_scooters still renders even when CMS has no published entries for that category
- Once CMS is completed, CMS remains the primary source

## 8. Common issues

1. Init completed but page still appears empty
- Click Refresh in Ops Center
- Verify published records in target category
- Hard refresh page (or use incognito)

2. Replace reduced records unexpectedly
- Use Merge for category gap-filling
- Use Replace only for full baseline reset

3. compare returns ProductNotFound
- Use live product IDs from current products list, not stale hard-coded IDs

## 9. Suggested release gate after injection

1. Frontend visibility check for target categories
2. API smoke and contract parity checks (see backend docs)

Done criteria:
- Category pages render
- Smoke checks pass
- CMS has traceable published records for critical categories
