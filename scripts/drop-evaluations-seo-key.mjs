/**
 * Retire the redundant "evaluations" section-SEO key.
 *
 * `evaluations` was an alias of `reviews`: normalizeSeoKey("evaluations")
 * returns "reviews", so DEFAULT_SEO_CONFIGS.evaluations was never read — the
 * fallback chain resolves through the normalized key first. The copy in
 * settings.seo.evaluations was nevertheless maintained in parallel and had
 * drifted into a second source of truth (identical today, but nothing was
 * keeping it that way).
 *
 * /evaluations also existed as a URL: it is not prerendered, so it only
 * answered 200 because public/_redirects carried an exact bare-root rewrite
 * for it, and the SPA resolved that root to the reviews tab — the same page
 * at two URLs with the same TDK. The rewrite is gone, so the URL now 404s,
 * which is the correct semantics for a path with no page.
 *
 * This script removes the settings.seo.evaluations entry (GET -> merge ->
 * POST settings/save -> re-read with ?cb). Idempotent: a second run is a
 * no-op that reports absence.
 */

const API_BASE = process.env.CMS_API_BASE || "https://store.balancebiketoddler.com";
const TOKEN = process.env.CMS_ADMIN_ALL_TOKEN || "";
const APPLY = process.argv.includes("--apply");

const SETTINGS_KEY = "evaluations";
const CANONICAL_KEY = "reviews";

const getSettings = async () => {
  const res = await fetch(`${API_BASE}/api/cms/settings?cb=${Date.now()}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`settings read failed: HTTP ${res.status}`);
  const payload = await res.json();
  // The CMS returns settings wrapped in an array.
  const rows = Array.isArray(payload?.data) ? payload.data : payload?.data ? [payload.data] : [];
  if (!rows.length) throw new Error("settings collection is empty");
  return rows[0];
};

const settings = await getSettings();
const seo = settings?.seo || {};
const keys = Object.keys(seo);

console.log(`settings.seo keys (${keys.length}): ${keys.join(", ")}`);

if (!(SETTINGS_KEY in seo)) {
  console.log(`\n"${SETTINGS_KEY}" is already absent — nothing to do.`);
  process.exit(0);
}

// Refuse to drop the alias if the canonical key it aliases is missing: the
// route would silently fall through to the home block.
if (!(CANONICAL_KEY in seo)) {
  throw new Error(`"${SETTINGS_KEY}" exists but "${CANONICAL_KEY}" does not — refusing to remove the only copy`);
}

console.log(`\n  removing: "${SETTINGS_KEY}" (canonical "${CANONICAL_KEY}" remains)`);

if (!APPLY) {
  console.log("\nDry run complete. Re-run with --apply to write.");
  process.exit(0);
}
if (!TOKEN) {
  console.error("CMS_ADMIN_ALL_TOKEN is required.");
  process.exit(1);
}

const nextSeo = { ...seo };
delete nextSeo[SETTINGS_KEY];

const merged = { ...settings, seo: nextSeo, updatedAt: new Date().toISOString() };

const post = await fetch(`${API_BASE}/api/cms/settings/save`, {
  method: "POST",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "x-cms-admin-token": TOKEN,
  },
  body: JSON.stringify(merged),
});
if (!post.ok) {
  const text = await post.text().catch(() => "");
  throw new Error(`settings save failed: HTTP ${post.status} ${text.slice(0, 200)}`);
}
console.log("  saved.");

const after = await getSettings();
const afterKeys = Object.keys(after?.seo || {});
console.log(`\n  settings.seo keys now (${afterKeys.length}): ${afterKeys.join(", ")}`);

if (afterKeys.includes(SETTINGS_KEY)) {
  throw new Error(`"${SETTINGS_KEY}" survived the write — verification failed`);
}
if (!afterKeys.includes(CANONICAL_KEY)) {
  throw new Error(`"${CANONICAL_KEY}" was lost — verification failed`);
}
console.log(`\n  verified: "${SETTINGS_KEY}" gone, "${CANONICAL_KEY}" intact.`);
