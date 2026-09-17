#!/usr/bin/env node
/**
 * Archive machine-generated guide stubs that were written into the D1 `guides`
 * collection with status=published.
 *
 * Detection rule (conservative, only matches obvious pipeline stubs):
 *   - title contains "cover image" (case-insensitive), OR
 *   - both zh/en body content is shorter than MIN_CONTENT_LENGTH
 *
 * Action: re-saves the record with status="archived" via POST /api/cms/guides/save.
 * Archiving is reversible — flip the status back in the CMS to restore.
 *
 * Usage:
 *   node scripts/cleanup_guide_stubs.mjs                 # dry run (default)
 *   node scripts/cleanup_guide_stubs.mjs --apply          # write to D1
 *   node scripts/cleanup_guide_stubs.mjs --apply --limit 5
 *
 * Environment:
 *   CMS_API_BASE   default https://store.balancebiketoddler.com
 */

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const limitArgIndex = args.indexOf("--limit");
const limit = limitArgIndex >= 0 ? Number(args[limitArgIndex + 1] || 0) : 0;

const API_BASE = (process.env.CMS_API_BASE || "https://store.balancebiketoddler.com").replace(/\/+$/, "");
const MIN_CONTENT_LENGTH = 300;

async function getJson(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: "application/json", "Content-Type": "application/json" },
  });
  if (!res.ok) {
    throw new Error(`GET ${path} failed: ${res.status} ${(await res.text()).slice(0, 200)}`);
  }
  return res.json();
}

async function saveGuide(guide) {
  const res = await fetch(`${API_BASE}/api/cms/guides/save`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(guide),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`save failed: ${res.status} ${text.slice(0, 200)}`);
  }
  let parsed = {};
  try {
    parsed = JSON.parse(text);
  } catch {
    /* non-JSON body */
  }
  return { ok: res.ok, saved: Boolean(parsed?.data?.saved), raw: text.slice(0, 200) };
}

function isStub(guide) {
  const title = `${guide?.en?.title || ""} ${guide?.zh?.title || ""}`.toLowerCase();
  if (title.includes("cover image")) return true;
  const enLen = String(guide?.en?.content || "").trim().length;
  const zhLen = String(guide?.zh?.content || "").trim().length;
  return Math.max(enLen, zhLen) < MIN_CONTENT_LENGTH;
}

async function main() {
  const { data: guides = [] } = await getJson("/api/cms/guides");
  const published = guides.filter((g) => String(g.status || "").toLowerCase() === "published");
  const stubs = published.filter(isStub);

  console.log(`API base         : ${API_BASE}`);
  console.log(`Total guides     : ${guides.length}`);
  console.log(`Published guides : ${published.length}`);
  console.log(`Detected stubs   : ${stubs.length}`);
  console.log(`Mode             : ${apply ? "APPLY (writing to D1)" : "DRY RUN"}`);
  console.log("");

  const targets = limit > 0 ? stubs.slice(0, limit) : stubs;

  for (const guide of targets) {
    const title = String(guide?.en?.title || guide?.zh?.title || "").slice(0, 70);
    if (!apply) {
      console.log(`[would archive] ${guide.id}  ${title}`);
      continue;
    }
    try {
      const result = await saveGuide({ ...guide, status: "archived" });
      console.log(`[archived:${result.saved ? "ok" : "?"}] ${guide.id}  ${title}`);
      if (!result.saved) {
        console.log(`    response: ${result.raw}`);
      }
    } catch (error) {
      console.error(`[FAILED] ${guide.id}  ${error.message}`);
    }
  }

  console.log("");
  console.log(apply ? `Done: processed ${targets.length} record(s).` : "Dry run complete. Re-run with --apply to write.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
