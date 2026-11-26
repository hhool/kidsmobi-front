#!/usr/bin/env node
/**
 * Point the two orphan-ASIN reviews at their generated covers.
 *
 * The cover is stored as a ROOT-RELATIVE path (/images/evaluations/...), the
 * same convention the news covers already use. Both resolvers handle it: the
 * SPA's normalizeUrl() returns a leading-slash value unchanged, and the
 * prerender's toPublicImageUrl() prefixes PUBLIC_SITE_BASE for og:image.
 *
 * Sends the FULL record back (the CMS accepts partial payloads and would
 * silently save a truncated one), then reads the record back to confirm.
 *
 * Usage:
 *   node scripts/point-evaluation-covers.mjs            # dry run
 *   node scripts/point-evaluation-covers.mjs --write
 */
import { execFileSync } from "node:child_process";
import { adminHeaders } from "./_cmsAdminToken.mjs";

const API_BASE = "https://store.balancebiketoddler.com";
const COVERS = {
  "eval-single-electric_vehicles-B0G5KD8BTZ":
    "/images/evaluations/eval-single-electric-vehicles-b0g5kd8btz-800x800.webp",
  "eval-single-car_seat-B0BDRKG478":
    "/images/evaluations/eval-single-car-seat-b0bdrkg478-800x800.webp",
};

// node's fetch is intercepted by the local proxy; curl is not.
function curl(args) {
  return execFileSync("curl", ["-s", "--noproxy", "*", ...args], {
    maxBuffer: 64 * 1024 * 1024,
    encoding: "utf8",
  });
}

function listEvaluations() {
  const raw = curl([`${API_BASE}/api/cms/evaluations?cb=${Date.now()}`]);
  const parsed = JSON.parse(raw);
  const data = parsed.data ?? parsed;
  return Array.isArray(data) ? data : data.records ?? data.items ?? [];
}

function saveEvaluation(record) {
  const headers = adminHeaders({ "Content-Type": "application/json" });
  const headerArgs = Object.entries(headers).flatMap(([k, v]) => ["-H", `${k}: ${v}`]);
  const raw = curl([
    "-s", "-X", "POST",
    ...headerArgs,
    "-d", JSON.stringify(record),
    `${API_BASE}/api/cms/evaluations/save`,
  ]);
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = { raw: raw.slice(0, 200) };
  }
  // A 403 AdminTokenRequired body is also valid JSON with no `ok` field, so
  // "no ok:false" is not proof of success. The success ack is nested
  // ({"data":{"id":..,"saved":true}}), so a top-level-only check reports a
  // perfectly good write as a failure — require the flag wherever it sits.
  const ackBody = parsed && typeof parsed === "object" ? parsed.data ?? parsed : {};
  const acknowledged =
    Boolean(parsed) &&
    (parsed.ok === true || parsed.saved === true || ackBody.ok === true || ackBody.saved === true);
  return { parsed, acknowledged };
}

/**
 * ORDER MATTERS, and it has a visible failure mode.
 *
 * The cover files ship with the FRONT-END deploy; the CMS pointer is a live
 * database write. Writing the pointer first would publish a card whose
 * <img src> 404s until the next build, and a broken image is worse than the
 * text-only card it replaces. So the --write path probes the deployed file
 * first and refuses to point at anything that is not already live.
 */
const write = process.argv.includes("--write");
if (write && !process.env.CMS_ADMIN_ALL_TOKEN) {
  console.error(
    "CMS_ADMIN_ALL_TOKEN is required for --write — without it the save returns\n" +
      "403 AdminTokenRequired and nothing changes. Set it (Worker secret) and re-run.",
  );
  process.exit(1);
}
const records = listEvaluations();
const byId = new Map(records.map((r) => [r.id, r]));

let changed = 0;
for (const [id, coverPath] of Object.entries(COVERS)) {
  const record = byId.get(id);
  if (!record) {
    console.error(`MISSING record ${id}`);
    process.exitCode = 1;
    continue;
  }
  const current = String(record.imageUrl || "").trim();
  if (current === coverPath) {
    console.log(`= ${id} already ${coverPath}`);
    continue;
  }
  // Refuse to make a live record point at a file that is not deployed yet.
  if (write) {
    const code = execFileSync(
      "curl",
      ["-s", "--noproxy", "*", "-o", "/dev/null", "-w", "%{http_code}", `https://balancebiketoddler.com${coverPath}`],
      { encoding: "utf8" },
    ).trim();
    if (code !== "200") {
      console.error(`SKIP ${id}: cover not deployed yet (HTTP ${code}) — deploy dist/ first`);
      process.exitCode = 1;
      continue;
    }
  }

  console.log(`${write ? ">" : "~"} ${id}`);
  console.log(`    from ${current || "(empty)"}`);
  console.log(`    to   ${coverPath}   (scores: ${Object.keys(record.scores || {}).length} axes)`);
  if (!write) continue;

  const payload = { ...record, imageUrl: coverPath };
  const { parsed, acknowledged } = saveEvaluation(payload);
  if (!acknowledged) {
    console.error(`    SAVE NOT ACKNOWLEDGED ${JSON.stringify(parsed).slice(0, 200)}`);
    process.exitCode = 1;
    continue;
  }
  changed += 1;
}

if (write) {
  if (changed === 0) {
    console.error("\nNothing was saved, so there is nothing to verify.");
    process.exit(1);
  }
  // Read back rather than trusting the write response. The CMS serves reads
  // through a 300s cache, so a miss here right after a save is expected to
  // clear on its own; the cache-busting query below is what makes it decidable.
  const after = new Map(listEvaluations().map((r) => [r.id, r]));
  let verified = 0;
  for (const [id, coverPath] of Object.entries(COVERS)) {
    const got = String(after.get(id)?.imageUrl || "").trim();
    if (got === coverPath) verified += 1;
    else console.error(`VERIFY FAILED ${id}: ${got || "(empty)"}`);
  }
  console.log(`\nsaved ${changed}, verified ${verified}/${Object.keys(COVERS).length}`);

  // A cover that does not fetch is worse than no cover: the card shows a
  // broken image instead of nothing. The pre-save probe already required 200,
  // so this is a final confirmation rather than a new condition.
  for (const coverPath of Object.values(COVERS)) {
    const code = execFileSync(
      "curl",
      ["-s", "--noproxy", "*", "-o", "/dev/null", "-w", "%{http_code}", `https://balancebiketoddler.com${coverPath}`],
      { encoding: "utf8" },
    ).trim();
    console.log(`  probe ${code} ${coverPath}`);
    if (code !== "200") process.exitCode = 1;
  }
  if (verified !== Object.keys(COVERS).length) process.exitCode = 1;
} else {
  console.log(`\nDry run over ${records.length} evaluations. Re-run with --write.`);
}