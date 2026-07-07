# Cloudflare D1 Initial Injection Fix Runbook (kids_scooters included)

Applicable issue:
- CMS shows product rows, but frontend `kids_scooters` page is still empty.
- D1 records exist but frontend reads with `onlyPublished=1` return no data.

## 1. Root cause summary

1. Frontend product reads are effectively publish-gated (`onlyPublished=1`).
2. If injected records are `status=draft`, they are invisible to product pages.
3. During early-site bootstrap, missing `kids_scooters` records cause category-level empty state.

## 2. Code fix delivered

File: `front/src/apiServer.ts`

Fix:
- `ops init(products, source=worker)` now writes product `status` as `published` (was `draft`).

Impact:
- Early-site initialization via CMS Ops becomes frontend-visible immediately.

## 3. CMS console injection (recommended)

CMS -> Products -> Centralized Ops Center:

1. Category: `All`
2. Source: `Worker`
3. Mode:
- first full baseline: `Replace`
- category gap fill: `Merge`
4. Click `Init`
5. Click `Refresh`

For `kids_scooters` gap:
- If category filter exists, target that category and run Init again (prefer Merge).

## 4. D1 SQL checks (Cloudflare Dashboard -> D1 Studio -> Query)

1. Total products
```sql
SELECT COUNT(*) AS total
FROM cms_records
WHERE collection = 'products';
```

2. Published products
```sql
SELECT COUNT(*) AS published_total
FROM cms_records
WHERE collection = 'products'
  AND json_extract(payload, '$.status') = 'published';
```

3. scooters / kids_scooters records
```sql
SELECT id,
       json_extract(payload, '$.categoryId') AS category_id,
       json_extract(payload, '$.category') AS category,
       json_extract(payload, '$.status') AS status,
       updated_at
FROM cms_records
WHERE collection = 'products'
  AND (
    lower(json_extract(payload, '$.categoryId')) IN ('kids_scooters', 'scooters')
    OR lower(json_extract(payload, '$.category')) IN ('scooter', 'kids_scooters')
  )
ORDER BY updated_at DESC
LIMIT 100;
```

## 5. D1 SQL remediation (promote draft to published)

If this is an early bootstrap baseline and safe to promote:

```sql
UPDATE cms_records
SET payload = json_set(payload, '$.status', 'published'),
    updated_at = datetime('now')
WHERE collection = 'products'
  AND coalesce(json_extract(payload, '$.status'), 'draft') <> 'published';
```

Scooters-only remediation:

```sql
UPDATE cms_records
SET payload = json_set(payload, '$.status', 'published'),
    updated_at = datetime('now')
WHERE collection = 'products'
  AND (
    lower(json_extract(payload, '$.categoryId')) IN ('kids_scooters', 'scooters')
    OR lower(json_extract(payload, '$.category')) IN ('scooter', 'kids_scooters')
  );
```

## 6. API injection path (scriptable)

1. Init products from worker
```bash
curl -X POST "https://dev.kidsmobi.pages.dev/api/cms/ops/init" \
  -H "content-type: application/json" \
  -d '{"collection":"products","source":"worker","mode":"replace"}'
```

2. Overview
```bash
curl "https://dev.kidsmobi.pages.dev/api/cms/ops/overview"
```

3. Published products check
```bash
curl "https://dev.kidsmobi.pages.dev/api/cms/products?onlyPublished=1"
```

### 6.1 If you hit 403 / auth boundary (common)

If terminal calls to `/api/cms/*` return 403 (typically Worker access-policy/auth boundary), use these alternatives:

1. CMS console button path (recommended)
- Products -> Centralized Ops Center -> Source=Worker -> Mode=Replace/Merge -> Init.

2. D1 Studio SQL path
- Execute SQL from sections 4 and 5 in Cloudflare Dashboard -> D1 Studio.

3. Conclusion
- A 403 here usually indicates API access constraints, not a data-model failure.

## 7. Frontend regression URLs

- https://dev.kidsmobi.pages.dev/products/kids_scooters
- https://dev.kidsmobi.pages.dev/products/balance_bike

Pass criteria:
1. Product cards are visible
2. No No matches in global database
3. Category switching remains stable

## 8. Recommended operating model

1. Day-0 bootstrap: Products via Replace for full baseline.
2. Ongoing operations: Merge for missing categories and increments.
3. Before release: run API smoke/parity checks.

## 9. Rollback SQL (reversible)

If you need to roll back scooters publish-state promotion only:

```sql
UPDATE cms_records
SET payload = json_set(payload, '$.status', 'draft'),
    updated_at = datetime('now')
WHERE collection = 'products'
  AND (
    lower(coalesce(json_extract(payload, '$.categoryId'), '')) IN ('kids_scooters', 'scooters')
    OR lower(coalesce(json_extract(payload, '$.category'), '')) IN ('scooter', 'kids_scooters')
  );
```

Note:
- After rollback, those records are hidden from frontend reads using `onlyPublished=1`.

## 10. Post-run verification SQL pack

1. scooters published count
```sql
SELECT COUNT(*) AS scooters_published
FROM cms_records
WHERE collection = 'products'
  AND json_extract(payload, '$.status') = 'published'
  AND (
    lower(coalesce(json_extract(payload, '$.categoryId'), '')) IN ('kids_scooters', 'scooters')
    OR lower(coalesce(json_extract(payload, '$.category'), '')) IN ('scooter', 'kids_scooters')
  );
```

2. latest 20 scooters records with status
```sql
SELECT id,
       json_extract(payload, '$.categoryId') AS category_id,
       json_extract(payload, '$.category') AS category,
       json_extract(payload, '$.status') AS status,
       updated_at
FROM cms_records
WHERE collection = 'products'
  AND (
    lower(coalesce(json_extract(payload, '$.categoryId'), '')) IN ('kids_scooters', 'scooters')
    OR lower(coalesce(json_extract(payload, '$.category'), '')) IN ('scooter', 'kids_scooters')
  )
ORDER BY updated_at DESC
LIMIT 20;
```
