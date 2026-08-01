#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_INPUT = path.resolve("tmp/zh-final.json");
const DEFAULT_LEXICON = path.resolve("src/lib/titlePhraseLexicon.ts");
const DEFAULT_OUTPUT = path.resolve("tmp/zh-final.lexicon-converted.json");
const DEFAULT_REPORT = path.resolve("tmp/zh-final.lexicon-converted.report.json");

const TARGET_FIELDS = ["cardSummary", "description", "editorVerdict"];
const SINGLE_WORD_ALLOWLIST = new Set([
  "kids",
  "kid",
  "toddler",
  "toddlers",
  "infant",
  "newborn",
  "foldable",
  "adjustable",
  "convertible",
  "portable",
  "lightweight",
  "ergonomic",
  "bluetooth",
  "led",
  "upf",
  "lbs",
  "months",
  "inch",
  "inches",
  "year",
  "years",
]);

function parseArgs(argv) {
  const args = {
    input: DEFAULT_INPUT,
    lexicon: DEFAULT_LEXICON,
    output: DEFAULT_OUTPUT,
    report: DEFAULT_REPORT,
    minConfidence: 0.8,
    minCount: 3,
  };

  for (const arg of argv) {
    if (arg.startsWith("--input=")) args.input = path.resolve(arg.slice(8));
    else if (arg.startsWith("--lexicon=")) args.lexicon = path.resolve(arg.slice(10));
    else if (arg.startsWith("--output=")) args.output = path.resolve(arg.slice(9));
    else if (arg.startsWith("--report=")) args.report = path.resolve(arg.slice(9));
    else if (arg.startsWith("--min-confidence=")) args.minConfidence = Math.max(0, Math.min(1, Number(arg.slice(17)) || 0.8));
    else if (arg.startsWith("--min-count=")) args.minCount = Math.max(1, Number(arg.slice(12)) || 3);
    else if (arg === "--help" || arg === "-h") args.help = true;
  }

  return args;
}

function printHelp() {
  console.log(`Usage: node scripts/convert_export_text_by_title_lexicon.mjs [options]\n\nOptions:\n  --input=<path>            Input export JSON (default: ${DEFAULT_INPUT})\n  --lexicon=<path>          titlePhraseLexicon.ts path (default: ${DEFAULT_LEXICON})\n  --output=<path>           converted export output (default: ${DEFAULT_OUTPUT})\n  --report=<path>           conversion report output (default: ${DEFAULT_REPORT})\n  --min-confidence=<0-1>    minimum lexicon confidence to apply (default: 0.8)\n  --min-count=<n>           minimum lexicon frequency to apply (default: 3)\n`);
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function escapeRegex(text) {
  return String(text || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildBoundaryPattern(phrase) {
  const normalized = normalizeText(phrase).toLowerCase();
  const escaped = escapeRegex(normalized).replace(/\s+/g, "\\s+");
  return new RegExp(`\\b${escaped}\\b`, "gi");
}

async function readLexiconEntries(tsPath) {
  const content = await fs.readFile(tsPath, "utf8");
  const rowPattern = /\{\s*key:\s*("[^"]+"),\s*en:\s*("[^"]+"),\s*zh:\s*("[^"]*"),\s*count:\s*(\d+),\s*source:\s*("[^"]+"),\s*confidence:\s*([0-9.]+)\s*\}/g;
  const rows = [];
  let match;
  while ((match = rowPattern.exec(content)) !== null) {
    rows.push({
      key: JSON.parse(match[1]),
      en: JSON.parse(match[2]),
      zh: JSON.parse(match[3]),
      count: Number(match[4]),
      source: JSON.parse(match[5]),
      confidence: Number(match[6]),
    });
  }
  return rows;
}

function applyReplacements(text, replacers) {
  let output = String(text || "");
  const hits = [];

  for (const replacer of replacers) {
    let localCount = 0;
    output = output.replace(replacer.pattern, (segment) => {
      localCount += 1;
      return segment.replace(new RegExp(escapeRegex(replacer.en), "i"), replacer.zh);
    });
    if (localCount > 0) {
      hits.push({ en: replacer.en, zh: replacer.zh, count: localCount, key: replacer.key });
    }
  }

  return { output, hits };
}

function splitLeadingIdentitySegment(text) {
  const raw = String(text || "");
  const match = raw.match(/[，,。！？!?]/);
  if (!match || typeof match.index !== "number") {
    return { head: "", tail: raw };
  }

  const cut = match.index;
  const head = raw.slice(0, cut + 1);
  const tail = raw.slice(cut + 1);
  const hasAsciiPrefix = /[A-Za-z]/.test(head);

  if (!hasAsciiPrefix) {
    return { head: "", tail: raw };
  }

  return { head, tail };
}

function sortReplacers(entries) {
  return [...entries].sort((a, b) => {
    const lenDiff = b.en.length - a.en.length;
    if (lenDiff !== 0) return lenDiff;
    const countDiff = b.count - a.count;
    if (countDiff !== 0) return countDiff;
    return a.en.localeCompare(b.en);
  });
}

function shouldApplyEntry(entry) {
  const en = normalizeText(entry.en).toLowerCase();
  if (!en) return false;
  const tokens = en.split(/\s+/).filter(Boolean);
  if (tokens.length > 1) return true;
  if (/\d/.test(en)) return true;
  return SINGLE_WORD_ALLOWLIST.has(en);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const [rawExport, lexiconRows] = await Promise.all([
    fs.readFile(args.input, "utf8"),
    readLexiconEntries(args.lexicon),
  ]);

  const payload = JSON.parse(rawExport);
  const products = payload?.data?.collections?.products;
  if (!Array.isArray(products)) {
    throw new Error("Invalid export: missing data.collections.products");
  }

  const replacers = sortReplacers(
    lexiconRows
      .filter((row) => row.zh && row.en && row.confidence >= args.minConfidence && row.count >= args.minCount)
      .filter((row) => shouldApplyEntry(row))
      .map((row) => ({
        ...row,
        pattern: buildBoundaryPattern(row.en),
      }))
  );

  const reportRows = [];
  let changedProducts = 0;
  let changedFields = 0;

  for (const product of products) {
    const zh = product?.zh;
    if (!zh || typeof zh !== "object") continue;

    const changes = [];

    for (const field of TARGET_FIELDS) {
      const before = normalizeText(zh[field]);
      if (!before) continue;

      const { head, tail } = splitLeadingIdentitySegment(before);
      const converted = applyReplacements(tail, replacers);
      const after = normalizeText(`${head}${converted.output}`);
      if (!after || after === before) continue;

      zh[field] = after;
      changedFields += 1;
      changes.push({ field, before, after, hits: converted.hits.slice(0, 20) });
    }

    if (changes.length > 0) {
      changedProducts += 1;
      reportRows.push({ id: String(product.id || ""), changes });
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    input: args.input,
    output: args.output,
    lexicon: args.lexicon,
    minConfidence: args.minConfidence,
    minCount: args.minCount,
    totalProducts: products.length,
    changedProducts,
    changedFields,
    appliedEntries: replacers.length,
    rows: reportRows,
  };

  await Promise.all([
    fs.mkdir(path.dirname(args.output), { recursive: true }),
    fs.mkdir(path.dirname(args.report), { recursive: true }),
  ]);

  await Promise.all([
    fs.writeFile(args.output, `${JSON.stringify(payload, null, 2)}\n`, "utf8"),
    fs.writeFile(args.report, `${JSON.stringify(report, null, 2)}\n`, "utf8"),
  ]);

  console.log(`[text-convert] products=${products.length} changedProducts=${changedProducts} changedFields=${changedFields}`);
  console.log(`[text-convert] appliedEntries=${replacers.length}`);
  console.log(`[text-convert] output=${args.output}`);
  console.log(`[text-convert] report=${args.report}`);
}

main().catch((error) => {
  console.error(`[text-convert] ${error.message}`);
  process.exitCode = 1;
});
