/**
 * backfill-publish-dates.mjs — give every published guide a real publish date.
 *
 * The CMS save endpoint stamps `updatedAt: new Date()` on every write and never
 * sets `publishedAt`, so all 56 guides carried publishedAt=null and the cards
 * fell back to updatedAt. The image-assignment pass (2026-10-24) re-saved every
 * guide, which flattened all 56 updatedAt values to that same day — every card
 * in /guides showed an identical "2026-10-24" and the 16 legacy guides lost the
 * per-article edit dates they had before (10-15 / 10-19 / 10-21).
 *
 * This script backfills `publishedAt` (a client-sent value survives the save
 * endpoint's `...input` spread; only updatedAt is overwritten):
 *   - guides present in the oldest committed snapshot (76ca8af, taken before
 *     the image pass) are the legacy 16: their pre-image `updatedAt` is the
 *     best available evidence of when they entered the library.
 *   - every other guide belongs to the 40-guide batch first published today,
 *     so today is their genuine publish date.
 *
 * Display now prefers publishedAt over updatedAt (prerender + SPA), so cards
 * show each guide's own date again instead of one flattened day.
 *
 * Usage:
 *   CMS_ADMIN_ALL_TOKEN=<token> node scripts/backfill-publish-dates.mjs            # dry run
 *   CMS_ADMIN_ALL_TOKEN=<token> node scripts/backfill-publish-dates.mjs --write
 */

import { execFileSync } from "node:child_process";

const API_BASE = "https://store.balancebiketoddler.com";
const TOKEN = process.env.CMS_ADMIN_ALL_TOKEN || "";
const WRITE = process.argv.includes("--write");

/** Oldest committed snapshot = state before the 2026-10-24 image pass. */
const SNAPSHOT_REF = "76ca8af";
const SNAPSHOT_PATH = "scripts/cms-snapshots/guides.json";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function loadLegacyDatesFromSnapshot() {
  const raw = execFileSync("git", ["show", `${SNAPSHOT_REF}:${SNAPSHOT_PATH}`], {
    encoding: "utf-8",
    maxBuffer: 32 * 1024 * 1024,
  });
  const rows = JSON.parse(raw);
  const map = new Map();
  for (const row of rows) {
    const id = String(row?.id || "").trim();
    const updatedAt = String(row?.updatedAt || "").trim();
    if (id && updatedAt) map.set(id, updatedAt.slice(0, 10));
  }
  return map;
}

async function main() {
  if (!TOKEN) {
    console.error("CMS_ADMIN_ALL_TOKEN is required.");
    process.exit(1);
  }

  const legacyDates = loadLegacyDatesFromSnapshot();
  console.log(`legacy guides in snapshot ${SNAPSHOT_REF}: ${legacyDates.size}`);

  const res = await fetch(`${API_BASE}/api/cms/ops/export`, {
    headers: { "x-cms-admin-token": TOKEN },
  });
  if (!res.ok) throw new Error(`export HTTP ${res.status}`);
  const allGuides = (await res.json())?.data?.collections?.guides || [];
  // Only published guides reach the library (and therefore need a publish
  // date); archived drafts keep their null publishedAt.
  const guides = allGuides.filter((g) => String(g?.status || "").trim().toLowerCase() === "published");
  console.log(`live guides: ${allGuides.length} total, ${guides.length} published`);

  const today = todayIso();
  const plan = [];
  for (const g of guides) {
    const id = String(g?.id || "").trim();
    const slug = String(g?.slug || "").trim();
    const current = String(g?.publishedAt || "").trim();
    if (current) {
      plan.push({ id, slug, publishedAt: current, source: "already-set", skip: true });
      continue;
    }
    const legacy = legacyDates.get(id);
    const publishedAt = legacy || today;
    plan.push({
      id,
      slug,
      publishedAt,
      source: legacy ? "snapshot-updatedAt" : "first-published-today",
      skip: false,
    });
  }

  const pending = plan.filter((p) => !p.skip);
  const bySource = pending.reduce((acc, p) => {
    acc[p.source] = (acc[p.source] || 0) + 1;
    return acc;
  }, {});
  console.log(`need backfill: ${pending.length}`, bySource);
  for (const p of pending) {
    console.log(`  ${p.publishedAt}  ${p.source.padEnd(22)} ${p.slug}`);
  }

  if (!WRITE) {
    console.log("\nDry run. Re-run with --write to patch publishedAt into CMS.");
    return;
  }

  let ok = 0;
  const failed = [];
  for (const p of pending) {
    const record = guides.find((g) => String(g?.id || "").trim() === p.id);
    if (!record) {
      failed.push(`${p.slug}: not in export`);
      continue;
    }
    const payload = { ...record, publishedAt: p.publishedAt };
    const save = await fetch(`${API_BASE}/api/cms/guides/save`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-cms-admin-token": TOKEN,
      },
      body: JSON.stringify(payload),
    });
    if (!save.ok) {
      failed.push(`${p.slug}: HTTP ${save.status} ${(await save.text()).slice(0, 120)}`);
      continue;
    }
    ok += 1;
  }
  console.log(`\nwritten: ${ok}/${pending.length}`);
  if (failed.length) {
    console.log("FAILED:");
    failed.forEach((f) => console.log(`  - ${f}`));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
