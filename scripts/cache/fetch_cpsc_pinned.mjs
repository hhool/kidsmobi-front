/**
 * Rebuild the CPSC corpus exactly as it was on the published dataset's
 * retrieval date (2026-10-13), so extending the recall script cannot change
 * any already-published number.
 *
 * The live API has drifted forward (8,346 notices today vs 8,335 published).
 * Fetching 2026 with RecallDateEnd=2026-10-13 and unioning it with the full
 * 2000-2025 years reproduces the published corpus exactly.
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import path from "node:path";

const API = "https://www.saferproducts.gov/RestWebServices/Recall";
const PIN_END = "2026-10-13";
const OUT = path.resolve("scripts/cache/cpsc-pinned.json");

async function fetchRange(start, end) {
  const url = `${API}?format=json&RecallDateStart=${start}&RecallDateEnd=${end}`;
  const res = await fetch(url, { headers: { "User-Agent": "balancebiketoddler-recall-research/1.0" } });
  if (!res.ok) throw new Error(`CPSC ${start}..${end} -> HTTP ${res.status}`);
  return res.json();
}

async function main() {
  if (existsSync(OUT) && process.argv.includes("--force") === false) {
    const cached = JSON.parse(readFileSync(OUT, "utf8"));
    console.log(`[cpsc-pin] cached corpus present: ${cached.length} notices`);
    return;
  }
  const corpus = new Map();
  for (let y = 2000; y <= 2025; y += 1) {
    const rows = await fetchRange(`${y}-01-01`, `${y}-12-31`);
    for (const r of rows) corpus.set(r.RecallID, r);
    console.log(`[cpsc-pin] ${y}: ${rows.length} (unique ${corpus.size})`);
  }
  const rows2026 = await fetchRange("2026-01-01", PIN_END);
  for (const r of rows2026) corpus.set(r.RecallID, r);
  console.log(`[cpsc-pin] 2026 (to ${PIN_END}): ${rows2026.length} (unique ${corpus.size})`);

  const all = [...corpus.values()];
  mkdirSync(path.dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(all), "utf8");
  console.log(`[cpsc-pin] wrote ${OUT}: ${all.length} notices`);
}

main().catch((e) => {
  console.error("[cpsc-pin] failed:", e);
  process.exit(1);
});
