/**
 * Brand-correction ledger guard.
 *
 * Three things must stay true, and each has burned this repo before in a
 * different form:
 *
 *  1. The ledger (scripts/product-brand-corrections.json) and the code
 *     (CURATED_BRANDS in src/lib/productBrand.ts) must agree. A correction
 *     living in only one of them means the justification and the behaviour have
 *     come apart — the code renames a product with no recorded reason, or the
 *     ledger documents a fix that never runs.
 *
 *  2. Every entry's `from` must still be what the record stores, and its `to`
 *     must still be what the resolver returns. If a future CMS import resets a
 *     brand, the entry silently stops applying (by design) — this guard is what
 *     makes that visible instead of quiet.
 *
 *  3. Every entry still needs its evidence. A correction justified by the
 *     product NAME alone is not permitted, because the name is exactly what the
 *     broken `Title.split(' ')[0]` rule read. Entries must cite an independent
 *     field (URL slug, Brand/Brand Name/Manufacturer, or the record's own
 *     editorial text) and that citation must still be present on the record.
 *
 * Run:      npx tsx scripts/check-brand-corrections.ts
 * Self-test: npx tsx scripts/check-brand-corrections.ts --self-test
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { resolveProductBrand } from "../src/lib/productBrand.ts";

const ROOT = import.meta.dirname ?? ".";
const LEDGER = resolve(join(ROOT, "product-brand-corrections.json"));
const SNAPSHOT = resolve(join(ROOT, "cms-snapshots", "products.json"));

interface Correction {
  id: string;
  from: string;
  to: string;
  evidence: string;
}

interface Problem {
  id: string;
  detail: string;
}

/** The curated table, read back out of the source so the two cannot drift. */
function curatedFromSource(): Record<string, { from: string; to: string }> {
  const source = readFileSync(resolve(join(ROOT, "..", "src", "lib", "productBrand.ts")), "utf8");
  const block = /const CURATED_BRANDS: Record<string, \{ from: string; to: string \}> = \{([\s\S]*?)\n\};/.exec(source);
  if (!block) return {};
  const out: Record<string, { from: string; to: string }> = {};
  for (const m of block[1].matchAll(/"([^"]+)":\s*\{\s*from:\s*"([^"]*)",\s*to:\s*"([^"]*)"\s*\}/g)) {
    out[m[1]] = { from: m[2], to: m[3] };
  }
  return out;
}

function flatSpecValues(record: Record<string, unknown>): Record<string, string> {
  const specs = (record.Product_Specifications || {}) as Record<string, unknown>;
  const out: Record<string, string> = {};
  for (const section of Object.values(specs)) {
    if (!section || typeof section !== "object") continue;
    for (const [key, value] of Object.entries(section as Record<string, unknown>)) {
      if (typeof value !== "string") continue;
      const trimmed = value.trim();
      if (trimmed && !out[key]) out[key] = trimmed;
    }
  }
  return out;
}

/**
 * Fields that can justify a brand, other than the product name.
 * Returns the ones that actually contain the claimed brand.
 */
function independentSources(record: Record<string, unknown>, brand: string): string[] {
  const flat = flatSpecValues(record);
  const category = (record.Category_Attributes || {}) as Record<string, unknown>;
  const editorial = [
    ...(Array.isArray((record as { en?: { features?: unknown[] } }).en?.features)
      ? ((record as { en?: { features?: string[] } }).en?.features as string[])
      : []),
    ...(Array.isArray((record as { en?: { pros?: unknown[] } }).en?.pros)
      ? ((record as { en?: { pros?: string[] } }).en?.pros as string[])
      : []),
    String((record as { en?: { description?: string } }).en?.description || ""),
  ].join(" ");

  const sources: string[] = [];
  for (const key of ["Brand", "Brand Name", "Sub Brand", "Manufacturer"]) {
    if (String(flat[key] || "").toLowerCase().includes(brand.toLowerCase())) sources.push(`Product_Specifications.${key}`);
  }
  if (String(category.Brand || "").toLowerCase().includes(brand.toLowerCase())) sources.push("Category_Attributes.Brand");
  if (new RegExp(brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(editorial)) sources.push("en editorial text");
  return sources;
}

function check(records: Map<string, Record<string, unknown>>, ledger: Correction[], curated: Record<string, { from: string; to: string }>) {
  const problems: Problem[] = [];

  // 1. ledger <-> code agreement
  const ledgerIds = new Set(ledger.map((c) => c.id));
  for (const c of ledger) {
    const inCode = curated[c.id];
    if (!inCode) {
      problems.push({ id: c.id, detail: "in the ledger but not in CURATED_BRANDS — the fix never runs" });
      continue;
    }
    if (inCode.from !== c.from || inCode.to !== c.to) {
      problems.push({
        id: c.id,
        detail: `ledger says ${JSON.stringify(c.from)}->${JSON.stringify(c.to)} but CURATED_BRANDS says ${JSON.stringify(inCode.from)}->${JSON.stringify(inCode.to)}`,
      });
    }
  }
  for (const id of Object.keys(curated)) {
    if (!ledgerIds.has(id)) {
      problems.push({ id, detail: "in CURATED_BRANDS but not in the ledger — the code renames with no recorded reason" });
    }
  }

  // 2. the correction still applies and produces the claimed value
  for (const c of ledger) {
    const record = records.get(c.id);
    if (!record) {
      problems.push({ id: c.id, detail: "record is not in the products snapshot — the correction is orphaned" });
      continue;
    }
    const stored = String(
      (record as { en?: { brandText?: string } }).en?.brandText || record.brand || "",
    ).trim();
    if (stored.toLowerCase() !== c.from.toLowerCase()) {
      problems.push({
        id: c.id,
        detail: `record now stores brand ${JSON.stringify(stored)}, not the ledger's ${JSON.stringify(c.from)} — re-check and update the entry`,
      });
      continue;
    }
    // Resolve through the injected table, not the module-level one, so this
    // step proves the LEDGER's values drive the outcome. With the real table
    // passed in from main() the two are identical; with a fixture table it
    // means an entry can only pass if the ledger actually causes the rename.
    const resolved = resolveProductBrand(
      record as Parameters<typeof resolveProductBrand>[0],
      stored,
      curated,
    );
    if (resolved !== c.to) {
      problems.push({ id: c.id, detail: `resolver returns ${JSON.stringify(resolved)}, ledger claims ${JSON.stringify(c.to)}` });
    }
  }

  // 3. evidence must be independent of the product name, and must still exist
  for (const c of ledger) {
    const record = records.get(c.id);
    if (!record) continue;
    const sources = independentSources(record, c.to);
    if (sources.length === 0) {
      problems.push({
        id: c.id,
        detail: `no independent source on the record mentions ${JSON.stringify(c.to)} — the name alone is not evidence (it is what the broken rule read)`,
      });
    }
  }

  // 4. the injectable table must stay a test seam, never a production input.
  //    A caller that passes its own CURATED table has rebuilt the second copy
  //    of the rule that this whole module exists to prevent — and it would keep
  //    passing every check above while renaming products from nowhere.
  //    Deliberately NOT part of check(): this is a source-code invariant, not a
  //    data invariant, so it stays out of the fixture-based probes.
  return problems;
}

/**
 * Every production call site of the resolver that passes the 3rd argument.
 *
 * A bare arity split is enough here as long as trailing commas are trimmed:
 * a multi-line call ends its last argument with `,\n    )`, which a naive
 * splitter counts as an empty 3rd argument. Verified by sabotage — reintroducing
 * the 3rd argument into DetailedProductView must turn this red.
 */
function injectedTableCallSites(): string[] {
  const files = [
    "src/App.tsx",
    "src/components/DetailedProductView.tsx",
    "src/components/EvaluationsSection.tsx",
    "scripts/prerender-pages.ts",
  ];
  const out: string[] = [];
  for (const rel of files) {
    const path = resolve(join(ROOT, "..", rel));
    if (!existsSync(path)) continue;
    const source = readFileSync(path, "utf8");
    for (const match of source.matchAll(/resolveProductBrand\s*\(/g)) {
      const start = (match.index ?? 0) + match[0].length;
      // Collect the whole argument list, balancing parens only. Generic type
      // params (`Parameters<...>[0]`) carry no parens, so depth 1 really does
      // mean "top level of this call".
      let depth = 1;
      let end = start;
      for (; end < source.length && depth > 0; end += 1) {
        if (source[end] === "(") depth += 1;
        else if (source[end] === ")") depth -= 1;
      }
      const body = source.slice(start, end - 1);
      // Split at top-level commas, dropping the empty piece a trailing comma
      // leaves behind. Without this, a 2-arg call reads as 3.
      let inner = 0;
      let args = 1;
      for (const ch of body) {
        if (ch === "(") inner += 1;
        else if (ch === ")") inner -= 1;
        else if (ch === "," && inner === 0) args += 1;
      }
      if (args > 1 && /,\s*$/.test(body)) args -= 1;
      if (args > 2) {
        const line = source.slice(0, match.index).split("\n").length;
        out.push(`${rel}:${line} passes a custom curated table to resolveProductBrand — production callers must use the one in src/lib/productBrand.ts`);
      }
    }
  }
  return out;
}

function loadLedger(): Correction[] {
  const parsed = JSON.parse(readFileSync(LEDGER, "utf8"));
  return Array.isArray(parsed.corrections) ? parsed.corrections : [];
}

function loadRecords(): Map<string, Record<string, unknown>> {
  const raw = JSON.parse(readFileSync(SNAPSHOT, "utf8"));
  const list = Array.isArray(raw) ? raw : raw.records || raw.data || Object.values(raw);
  const map = new Map<string, Record<string, unknown>>();
  for (const record of list as Record<string, unknown>[]) {
    const id = String(record?.id || "").trim();
    if (id) map.set(id, record);
  }
  return map;
}

function selfTest() {
  const probes: Array<{ name: string; ok: boolean }> = [];
  const base = {
    id: "probe-x",
    brand: "Baby",
    en: { brandText: "Baby", description: "the Hagaday stroller is roomy", features: [], pros: [] },
    Product_Specifications: { Item_Details: { Brand: "Hagaday" } },
  };
  const records = new Map<string, Record<string, unknown>>([["probe-x", base]]);
  const curated = { "probe-x": { from: "Baby", to: "Hagaday" } };

  // A correct, sourced entry passes.
  probes.push({
    name: "valid-entry-passes",
    ok: check(records, [{ id: "probe-x", from: "Baby", to: "Hagaday", evidence: "Item_Details.Brand" }], curated).length === 0,
  });

  // Evidence that exists only in the product NAME is rejected.
  const nameOnly = new Map<string, Record<string, unknown>>([
    ["probe-x", { id: "probe-x", brand: "Baby", name: "Baby Joy Stroller", en: { brandText: "Baby", description: "", features: [], pros: [] } }],
  ]);
  probes.push({
    name: "name-only-evidence-rejected",
    ok: check(nameOnly, [{ id: "probe-x", from: "Baby", to: "Baby Joy", evidence: "name" }], { "probe-x": { from: "Baby", to: "Baby Joy" } }).some((p) => /no independent source/.test(p.detail)),
  });

  // A ledger entry with no matching code entry is reported.
  probes.push({
    name: "ledger-without-code-reported",
    ok: check(records, [{ id: "probe-x", from: "Baby", to: "Hagaday", evidence: "x" }], {}).some((p) => /never runs/.test(p.detail)),
  });

  // A code entry with no matching ledger entry is reported.
  probes.push({
    name: "code-without-ledger-reported",
    ok: check(records, [], curated).some((p) => /no recorded reason/.test(p.detail)),
  });

  // A stale `from` (record re-imported with a different brand) is reported.
  const stale = new Map<string, Record<string, unknown>>([
    ["probe-x", { ...base, brand: "Costzon", en: { brandText: "Costzon", description: "Hagaday", features: [], pros: [] } }],
  ]);
  probes.push({
    name: "stale-from-reported",
    ok: check(stale, [{ id: "probe-x", from: "Baby", to: "Hagaday", evidence: "x" }], curated).some((p) => /now stores brand/.test(p.detail)),
  });

  const failed = probes.filter((p) => !p.ok);
  console.log(JSON.stringify({ ok: failed.length === 0, selfTest: true, probes, failed }, null, 2));
  process.exit(failed.length === 0 ? 0 : 1);
}

function main() {
  if (process.argv.includes("--self-test")) return selfTest();
  if (!existsSync(LEDGER)) {
    console.log(JSON.stringify({ ok: false, problems: ["ledger missing"] }, null, 2));
    process.exit(1);
  }
  const ledger = loadLedger();
  const records = loadRecords();
  const curated = curatedFromSource();
  const problems = check(records, ledger, curated);
  for (const detail of injectedTableCallSites()) problems.push({ id: "src", detail });
  const ok = problems.length === 0;
  console.log(
    JSON.stringify(
      { ok, entries: ledger.length, codeEntries: Object.keys(curated).length, problems },
      null,
      2,
    ),
  );
  process.exit(ok ? 0 : 1);
}

main();