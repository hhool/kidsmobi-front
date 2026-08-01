#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_INPUT = path.resolve("tmp/title_phrase_lexicon.json");
const DEFAULT_OUTPUT = path.resolve("tmp/title_phrase_pending.top200.json");
const DEFAULT_MARKDOWN = path.resolve("tmp/title_phrase_pending.top200.md");

function parseArgs(argv) {
  const args = {
    input: DEFAULT_INPUT,
    output: DEFAULT_OUTPUT,
    markdown: DEFAULT_MARKDOWN,
    top: 200,
    minCount: 2,
  };

  for (const arg of argv) {
    if (arg.startsWith("--input=")) args.input = path.resolve(arg.slice(8));
    else if (arg.startsWith("--output=")) args.output = path.resolve(arg.slice(9));
    else if (arg.startsWith("--markdown=")) args.markdown = path.resolve(arg.slice(11));
    else if (arg.startsWith("--top=")) args.top = Math.max(20, Number(arg.slice(6)) || 200);
    else if (arg.startsWith("--min-count=")) args.minCount = Math.max(1, Number(arg.slice(12)) || 2);
    else if (arg === "--help" || arg === "-h") args.help = true;
  }
  return args;
}

function printHelp() {
  console.log(`Usage: node scripts/export_title_phrase_pending.mjs [options]\n\nOptions:\n  --input=<path>       title phrase lexicon json (default: ${DEFAULT_INPUT})\n  --output=<path>      pending json output (default: ${DEFAULT_OUTPUT})\n  --markdown=<path>    pending markdown output (default: ${DEFAULT_MARKDOWN})\n  --top=<n>            top N pending entries (default: 200)\n  --min-count=<n>      minimum frequency (default: 2)\n`);
}

function toMarkdown(rows) {
  const lines = [];
  lines.push("# Title Phrase Pending Top List");
  lines.push("");
  lines.push("| Rank | EN Phrase | Count | Example 1 | Example 2 |");
  lines.push("| --- | --- | ---: | --- | --- |");

  rows.forEach((row, index) => {
    const e1 = (row.examples?.[0] || "").replace(/\|/g, "\\|");
    const e2 = (row.examples?.[1] || "").replace(/\|/g, "\\|");
    lines.push(`| ${index + 1} | ${row.en.replace(/\|/g, "\\|")} | ${row.count} | ${e1} | ${e2} |`);
  });

  lines.push("");
  return lines.join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const raw = await fs.readFile(args.input, "utf8");
  const payload = JSON.parse(raw);
  const entries = Array.isArray(payload?.entries) ? payload.entries : [];

  const pending = entries
    .filter((entry) => {
      const zh = String(entry?.zh || "").trim();
      const source = String(entry?.source || "");
      const count = Number(entry?.count || 0);
      return count >= args.minCount && (!zh || source === "pending");
    })
    .sort((a, b) => Number(b.count || 0) - Number(a.count || 0) || String(a.en || "").localeCompare(String(b.en || "")))
    .slice(0, args.top)
    .map((entry) => ({
      key: String(entry.key || ""),
      en: String(entry.en || ""),
      count: Number(entry.count || 0),
      examples: Array.isArray(entry.examples) ? entry.examples.slice(0, 3) : [],
    }));

  const out = {
    generatedAt: new Date().toISOString(),
    input: args.input,
    top: args.top,
    minCount: args.minCount,
    pendingCount: pending.length,
    rows: pending,
  };

  await Promise.all([
    fs.mkdir(path.dirname(args.output), { recursive: true }),
    fs.mkdir(path.dirname(args.markdown), { recursive: true }),
  ]);

  await Promise.all([
    fs.writeFile(args.output, `${JSON.stringify(out, null, 2)}\n`, "utf8"),
    fs.writeFile(args.markdown, `${toMarkdown(pending)}\n`, "utf8"),
  ]);

  console.log(`[title-pending] input=${args.input}`);
  console.log(`[title-pending] pending=${pending.length}`);
  console.log(`[title-pending] json=${args.output}`);
  console.log(`[title-pending] markdown=${args.markdown}`);
}

main().catch((error) => {
  console.error(`[title-pending] ${error.message}`);
  process.exitCode = 1;
});
