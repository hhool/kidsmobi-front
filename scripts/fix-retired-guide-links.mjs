/**
 * fix-retired-guide-links.mjs — retarget inbound CMS links at retired guide URLs.
 *
 * S4 (2026-11-13) retired /guides/scenario/balance-bike-stability into
 * /balance-bike-stability/: two self-canonical URLs were answering the same
 * "stable track balance bike" query (~30% vocabulary overlap, same
 * measurement-gap framing, same single 5.1-inch case study), which is the
 * cannibalisation pattern Google settles by ranking neither. The guide's two
 * unique sections were merged into the asset page BEFORE the redirect went in,
 * so retargeting a link hands the reader a superset of what it used to.
 *
 * WHY THIS SCRIPT EXISTS
 * ----------------------
 * The prerender drops the retired record from generation, but the URL also
 * appears inside OTHER records' prose and inside settings.referenceCluster.
 * Those are CMS data, not code — a code change cannot reach them. Until they
 * are rewritten the site keeps shipping 65 internal links to a URL that 301s,
 * which is exactly the "internal link pointing at a redirect" signal the
 * retirement was meant to remove.
 *
 * Only the exact retired href is rewritten. A prefix rule here would be wrong:
 * /guides/scenario/ is still a live channel page.
 *
 * Usage:
 *   CMS_ADMIN_ALL_TOKEN=<token> node scripts/fix-retired-guide-links.mjs
 *   CMS_ADMIN_ALL_TOKEN=<token> node scripts/fix-retired-guide-links.mjs --apply
 *
 * Without --apply it is a dry run: it reports what it WOULD change and writes
 * nothing.
 */
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const API_BASE = (process.env.CMS_API_BASE || "https://store.balancebiketoddler.com").replace(/\/+$/, "");
const TOKEN = String(process.env.CMS_ADMIN_ALL_TOKEN || "").trim();

const RETIRED = "/guides/scenario/balance-bike-stability";
const SUCCESSOR = "/balance-bike-stability/";

/** Markdown link + JSON/quoted-href forms, so both shapes are caught. */
const REPLACEMENTS = [
  [`](${RETIRED})`, `](${SUCCESSOR})`],
  [`"${RETIRED}"`, `"${SUCCESSOR}"`],
];

const adminHeaders = { "x-cms-admin-token": TOKEN };

async function main() {
  if (!TOKEN) {
    console.error("CMS_ADMIN_ALL_TOKEN is required (or use --from-snapshot to preview against the checked-in snapshot)");
    process.exit(1);
  }

  const res = await fetch(`${API_BASE}/api/cms/ops/export`, { headers: adminHeaders });
  if (!res.ok) throw new Error(`export HTTP ${res.status}`);
  const collections = (await res.json())?.data?.collections || {};

  const plan = [];

  // 1. Guide prose — every record except the retired one itself.
  const guides = collections.guides || [];
  for (const guide of guides) {
    if (String(guide?.slug || "") === "balance-bike-stability") continue;
    const en = { ...(guide.en || {}) };
    const zh = { ...(guide.zh || {}) };
    const applied = [];
    for (const lang of [
      ["en", en],
      ["zh", zh],
    ]) {
      const [, body] = lang;
      let content = String(body.content || "");
      const before = content;
      for (const [from, to] of REPLACEMENTS) content = content.split(from).join(to);
      if (content !== before) {
        body.content = content;
        applied.push(lang[0]);
      }
    }
    if (applied.length) plan.push({ kind: "guide", id: guide.id, slug: guide.slug, langs: applied, payload: { ...guide, en, zh } });
  }

  // 2. settings.referenceCluster — the stability card still names the retired URL.
  const settingsRows = Array.isArray(collections.settings)
    ? collections.settings
    : collections.settings
      ? [collections.settings]
      : [];
  const settingsPayloads = [];
  for (const row of settingsRows) {
    const cluster = row?.referenceCluster;
    if (!Array.isArray(cluster) || !cluster.length) continue;
    let touched = 0;
    const next = cluster.map((card) => {
      if (card?.href !== RETIRED) return card;
      touched += 1;
      return { ...card, href: SUCCESSOR };
    });
    if (touched) {
      settingsPayloads.push({ id: row.id, count: touched, payload: { ...row, referenceCluster: next } });
    }
  }

  // Report
  console.log(`API base: ${API_BASE}`);
  console.log(`Mode: ${APPLY ? "APPLY (writing to D1)" : "DRY RUN"}`);
  console.log("");
  if (!plan.length && !settingsPayloads.length) {
    console.log("Nothing to retarget — the retired URL is no longer referenced from CMS data.");
    return;
  }
  for (const item of plan) {
    console.log(`  guide ${item.slug} (${item.id}) — rewrite prose in: ${item.langs.join(", ")}`);
  }
  for (const item of settingsPayloads) {
    console.log(`  settings ${item.id} — repoint ${item.count} reference-cluster card(s) to ${SUCCESSOR}`);
  }

  if (!APPLY) {
    console.log("\nDry run complete. Re-run with --apply to write.");
    return;
  }

  for (const item of plan) {
    const save = await fetch(`${API_BASE}/api/cms/guides/save`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json", ...adminHeaders },
      body: JSON.stringify(item.payload),
    });
    if (!save.ok) {
      console.error(`save failed for guide ${item.slug}: HTTP ${save.status} ${(await save.text()).slice(0, 200)}`);
      process.exit(1);
    }
    console.log(`  ✓ guide ${item.slug}`);
  }

  for (const item of settingsPayloads) {
    const save = await fetch(`${API_BASE}/api/cms/settings/save`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json", ...adminHeaders },
      body: JSON.stringify(item.payload),
    });
    if (!save.ok) {
      console.error(`settings save failed: HTTP ${save.status} ${(await save.text()).slice(0, 200)}`);
      process.exit(1);
    }
    console.log(`  ✓ settings ${item.id}`);
  }

  console.log("\nDone. Re-run the prerender so the static HTML picks up the rewritten prose.");
}

// Local dry-run fixture support: --from-snapshot reads the checked-in snapshot
// instead of the live API, so the rewrite can be validated without credentials.
async function fromSnapshot() {
  const raw = JSON.parse(readFileSync("scripts/cms-snapshots/guides.json", "utf8"));
  const guides = Array.isArray(raw) ? raw : raw?.data || [];
  let total = 0;
  for (const guide of guides) {
    if (String(guide?.slug || "") === "balance-bike-stability") continue;
    for (const lang of ["en", "zh"]) {
      const content = String(guide?.[lang]?.content || "");
      const before = content;
      let next = content;
      for (const [from, to] of REPLACEMENTS) next = next.split(from).join(to);
      if (next !== before) {
        total += (before.split(RETIRED).length - 1);
        console.log(`  guide ${guide.slug} [${lang}]`);
      }
    }
  }
  console.log(`snapshot: ${total} occurrence(s) across ${guides.length} guide records`);
}

if (args.includes("--from-snapshot")) {
  await fromSnapshot();
} else {
  await main();
}