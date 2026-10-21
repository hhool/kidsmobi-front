/**
 * Retire the /safety/ level in CMS body copy (2026-10-22).
 *
 * The recall record moved from /safety/balance-bike-recalls/ to
 * /guides/risk/balance-bike-recall-record. Site chrome follows the constant and
 * needed no edit, but four CMS records carry the old URL inside their markdown
 * bodies, where it was written as literal text. Left alone those would have
 * become 404s — or, once the Worker 301 lands, ten redirects on every crawl.
 *
 * This does a literal string swap inside the record and nothing else: no copy
 * is rewritten, no anchor text is touched, and every other field is carried
 * through by the whole-record merge. Both languages are covered because a body
 * is stored per language.
 *
 * Usage:
 *   CMS_ADMIN_ALL_TOKEN=<token> npx tsx scripts/repoint-recall-links.ts --dry-run
 *   CMS_ADMIN_ALL_TOKEN=<token> npx tsx scripts/repoint-recall-links.ts --apply
 */
import { LEGACY_RECALL_SAFETY_PATH, RECALL_SAFETY_PATH } from "../src/data/safetyRecallRecord";

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const API_BASE = (process.env.CMS_API_BASE || "https://store.balancebiketoddler.com").replace(/\/+$/, "");
const TOKEN = String(process.env.CMS_ADMIN_ALL_TOKEN || "").trim();

// Widened to `string` on purpose: both constants are exported as string
// literals, so TypeScript narrows the comparison below to "no overlap" and
// fails the typecheck — the guard is still worth having for when someone edits
// one of the constants.
const OLD: string = LEGACY_RECALL_SAFETY_PATH;
const NEW: string = RECALL_SAFETY_PATH;
const COLLECTIONS = ["guides", "news"];

if (OLD === NEW) throw new Error("source and target paths are identical — nothing to repoint");

/** Counts occurrences of the old path anywhere in a JSON-serialisable value. */
const countIn = (value: unknown): number => {
  if (typeof value === "string") return value.split(OLD).length - 1;
  if (Array.isArray(value)) return value.reduce((n, item) => n + countIn(item), 0);
  if (value && typeof value === "object") return Object.values(value).reduce((n, item) => n + countIn(item), 0);
  return 0;
};

/** Deep clone with every string occurrence of the old path replaced. */
const swap = (value: unknown): unknown => {
  if (typeof value === "string") return value.split(OLD).join(NEW);
  if (Array.isArray(value)) return value.map(swap);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, swap(v)]));
  }
  return value;
};

const read = async (collection: string): Promise<Array<Record<string, unknown>>> => {
  const res = await fetch(`${API_BASE}/api/cms/${collection}?cb=${Date.now()}`, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`${collection} read failed: HTTP ${res.status}`);
  const payload = (await res.json()) as { data?: unknown };
  const rows = Array.isArray(payload?.data) ? payload.data : [];
  return rows as Array<Record<string, unknown>>;
};

const targets: Array<{ collection: string; row: Record<string, unknown>; hits: number }> = [];
for (const collection of COLLECTIONS) {
  for (const row of await read(collection)) {
    const hits = countIn(row);
    if (hits) targets.push({ collection, row, hits });
  }
}

console.log(`API base: ${API_BASE}`);
console.log(`Mode: ${APPLY ? "APPLY (writing to D1)" : "DRY RUN"}`);
console.log(`Replacing "${OLD}" -> "${NEW}"`);
let total = 0;
for (const target of targets) {
  total += target.hits;
  console.log(`  ${target.collection}/${String(target.row.id)} (${String(target.row.slug ?? "")}) — ${target.hits} ref(s)`);
}
console.log(`  total: ${total} reference(s) in ${targets.length} record(s)`);

if (!APPLY) {
  console.log("\nDry run complete. Re-run with --apply to write.");
  process.exit(0);
}
if (!TOKEN) {
  console.error("CMS_ADMIN_ALL_TOKEN is required.");
  process.exit(1);
}

let failed = false;
for (const target of targets) {
  const merged = swap(target.row) as Record<string, unknown>;
  merged.updatedAt = new Date().toISOString();
  const post = await fetch(`${API_BASE}/api/cms/${target.collection}/save`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-cms-admin-token": TOKEN,
    },
    body: JSON.stringify(merged),
  });
  const text = await post.text();
  if (!post.ok) {
    console.error(`  save failed ${target.collection}/${String(target.row.id)}: HTTP ${post.status} ${text.slice(0, 200)}`);
    failed = true;
    continue;
  }
  console.log(`  saved ${target.collection}/${String(target.row.id)}`);
}

// Read back: the old path must be gone everywhere and the new one must have
// taken its place, or a stale edge cache is being mistaken for a write.
for (const collection of COLLECTIONS) {
  for (const row of await read(collection)) {
    const remaining = countIn(row);
    if (remaining) {
      console.error(`  VERIFY FAILED ${collection}/${String(row.id)} still has ${remaining} old ref(s)`);
      failed = true;
    }
  }
}
for (const target of targets) {
  const rows = await read(target.collection);
  const row = rows.find((candidate) => String(candidate.id) === String(target.row.id));
  const newCount = row ? String(JSON.stringify(row)).split(NEW).length - 1 : 0;
  if (!row || newCount < target.hits) {
    console.error(`  VERIFY FAILED ${target.collection}/${String(target.row.id)}: expected >= ${target.hits} new refs, found ${newCount}`);
    failed = true;
  }
}

if (failed) {
  console.error("\nOne or more writes failed verification.");
  process.exit(1);
}
console.log(`\n[ok] ${total} reference(s) repointed, verified live.`);
