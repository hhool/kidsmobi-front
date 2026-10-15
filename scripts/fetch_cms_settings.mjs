// Fetches the live CMS settings (which carries the section-page SEO that the
// SPA resolves at runtime via resolveCmsRouteSeoConfig) and writes it to
// scripts/cms-snapshots/settings.json. The prerender reads this snapshot so the
// static HTML matches what the hydrated SPA (and therefore Google after JS
// render) publishes. Run this BEFORE `npm run build` whenever CMS section SEO
// changes, otherwise the snapshot drifts from the live CMS.
//
// Usage: node scripts/fetch_cms_settings.mjs
import { writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "cms-snapshots", "settings.json");
// The public site 307-redirects /api/cms/* to the store subdomain; follow it.
const ENDPOINT = process.env.CMS_SETTINGS_URL || "https://balancebiketoddler.com/api/cms/settings";

async function main() {
  const res = await fetch(ENDPOINT, { redirect: "follow" });
  if (!res.ok) throw new Error(`settings fetch failed: HTTP ${res.status} ${res.statusText}`);
  const text = await res.text();
  // sanity: must be JSON with data[].seo
  const parsed = JSON.parse(text);
  const settings = Array.isArray(parsed?.data) ? parsed.data[0] : parsed?.data || parsed;
  if (!settings || typeof settings !== "object" || !settings.seo) {
    throw new Error("settings payload missing .seo — refusing to write a broken snapshot");
  }
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(parsed, null, 2));
  const seoKeys = Object.keys(settings.seo || {});
  console.log(`settings snapshot written: ${OUT}`);
  console.log(`  seo routes: ${seoKeys.join(", ")} | updatedAt: ${settings.updatedAt || "?"}`);
}

main().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});
