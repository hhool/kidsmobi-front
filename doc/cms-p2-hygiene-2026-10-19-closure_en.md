# CMS P2 Data Hygiene — Closure Verification (2026-10-19)

> Related: `doc/cms-data-audit-2026-10-16_en.md` (full audit; source of task #52's three P2 sub-items), `doc/gsc-coverage-2026-10-18-analysis_en.md` (parallel indexing analysis).
> Nature: read-only evidence gathering + documentation. No site code or CMS data changed.
> Run window: 2026-10-19 00:45-00:55 (GMT+8).

## 0. Summary

| Sub-item (from the 10-16 audit) | Re-verification | Disposition |
|---|---|---|
| top-level `category` vs `taxonomy.categoryId` mismatch ×117 | 119/213 live (see §2 for the counting basis); **zero consumers** | Closed (inert field, no fix needed) |
| `scenarioIds` missing the `scenario-` prefix ×6 | live `scenarioIds` population is **0** | Closed |
| Graco manufacturer copy without attribution | #49 already rewrote first-person "We tested" → "Graco tested its"; the remaining ProtectPlus copy is manufacturer-subject; full-library first-person claim sweep: **0 hits** | Closed |

## 1. Method

- Full pull from the public API (`GET /api/cms/products`, fresh buster + retry): **213 records**.
- Source-level consumer check: repo-wide grep for `taxonomy` across `front/src/` and `backend/api/worker/src/` — product-level `taxonomy.categoryId` has **no reader** (guide taxonomy is an unrelated field set).
- Claim sweep: 13 EN + 5 ZH first-person / unattributed testing-claim patterns × 15 text fields per product (name/description/cardSummary/editorVerdict/customersSay/features/pros/cons + zh counterparts).

## 2. Evidence per sub-item

### 2.1 category mismatch (119 records, inert)

- Raw `category` (e.g. `safety_seat`, `bicycle`) disagrees with `taxonomy.categoryId` (e.g. `car_seat`, `kids_bikes`) on **119/213** records (the audit recorded ×117; the difference is sampling time and normalization — same order of magnitude).
- But the frontend resolver `resolveProductCategoryId` (`src/lib/productCategoryPaths.ts`) reads **`categoryId || category`**: all 213 records have `categoryId`, so raw `category` never participates in resolution.
- `categoryId` vs `taxonomy.categoryId` agree **213/213** (0 mismatches).
- Conclusion: the mismatch exists only between two derived/backup representations — **zero rendering impact** (sitemap, hubs, detail paths and 301 targets are all driven by `categoryId`). Cleaning 119 records would take 119 CMS writes for zero benefit; not doing it.

### 2.2 scenarioIds prefix (0 records exist)

- All 213 products have empty `scenarioIds` arrays (the audit's ×6 were cleared by later writes or never landed); the field is not consumed by any public rendering path either.
- Conclusion: nothing to fix, closed.

### 2.3 Graco manufacturer copy

- Per-record scan of the 9 Graco products: the first-person "We tested" was already rewritten to "Graco tested its" (manufacturer-attributed) in #49 (2026-10-16); the zh counterpart "葛莱对这款……进行了全套配置测试" likewise has Graco as the subject.
- The remaining "Graco ProtectPlus Engineered to the newest testing standards for side impact" is a **manufacturer-subject engineering claim** (not a test-result claim) — the same treatment as the "(manufacturer-listed)" certification claims from #49 is sufficient.
- Full-library sweep (213 records × 15 fields): first-person / unattributed testing claims: **0 hits**.
- Conclusion: no further change needed, closed.

## 3. Two stale tasks closed while here

- **#48 (write-route auth)**: live probes in this session confirm the gate — no-token POST `/api/cms/settings/save` → **403 AdminTokenRequired**, public GET reads 200. front `f5fc164` + Worker `e02e62d` both deployed.
- **#51 (helmet category structure)**: same decision as #58 — helmets are not displayed on the site; the three `ProductsSection.isHelmetProduct` exclusion call sites (L1563/1617/1700) are intact.

## 4. Archive

- Scripts: `front/tmp/cms-p2-reverify.mjs`, `front/tmp/claim-sweep.mjs`, `front/tmp/graco-scan.mjs` (tmp/ is gitignored, local only).
- Report: `front/tmp/cms-p2-reverify-2026-10-19.json`.
