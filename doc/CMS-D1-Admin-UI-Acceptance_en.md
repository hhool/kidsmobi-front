# CMS D1 Admin UI Manual Click-Through Acceptance (English)

Timestamp: 2026-06-30 16:08 CST

Target page:

1. https://kidsmobi.pages.dev/#cms

Validation method:

1. Enter Admin via the "developer one-click quick login" path.
2. Click through all six business modules in the left sidebar.
3. Trigger one "create -> save" interaction in Product Center to verify pre-submit behavior.

Deployment note:

1. Keep `VITE_CMS_API_BASE_URL` pinned to the deployed Worker CMS API for stable acceptance runs.
2. Keep `VITE_SCRAPE_API_BASE_URL` or `SCRAPE_KIDSMOBILE_API_BASE_URL` pinned to the deployed Worker API for backend resource checks.

## 1. Module Reachability

Result: all six modules were reachable, with expected headings and primary action buttons visible.

1. Product Center: heading visible; actions include init/import/export/add.
2. Category Management: heading visible; actions include init/add.
3. Scenario Management: heading visible; add action visible.
4. Evaluation Center: heading visible; publish action visible.
5. Buying Guides: heading visible; create guide action visible.
6. Global News: heading visible; publish news action visible.

Conclusion: navigation and page rendering passed.

## 2. Interaction Check

Product creation flow:

1. Clicked "Add Product" to enter edit mode.
2. Clicked "Save and Publish" and received validation alert: `Please enter product name in both languages.`

Conclusion: client-side pre-submit validation is working as expected.

## 3. Runtime Observations and Anomalies

Under developer quick-login mode:

1. Repeated Firestore errors in console: `Missing or insufficient permissions` (`operationType=list`, `path=scenarios`).
2. Top status badge displayed: `D1: Unavailable` (shown as Chinese text in UI snapshot).
3. Banner explicitly indicates shadow/dev account mode with publish/sync restrictions.

Interpretation:

1. Dev quick-login is a UI preview shortcut, not equivalent to real admin authentication.
2. Persistent write verification should be performed with a real admin login and/or stable deployment config with `VITE_CMS_API_BASE_URL` pinned to Worker CMS API.

## 4. Acceptance Conclusion

Staged conclusion:

1. UI reachability: PASS.
2. Module navigation: PASS.
3. Form validation guardrails: PASS.
4. Persistent write in dev quick-login mode: NOT PASS (expected limitation, not a regression defect).

## 5. Next Recommendations

1. Run one additional manual acceptance pass using a real admin Google account (focus: save/edit/delete success feedback and list refresh).
2. Pin frontend deployment variables in the deployment environment instead of relying on hardcoded example domains.
3. Add a final "real-admin UI acceptance" report as release gate evidence.
