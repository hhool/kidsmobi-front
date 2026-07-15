#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const PLACEHOLDER_PATTERNS = [
  "pending editorial enrichment",
  "请补充评测",
  "待编辑",
  "needs editorial enrichment",
  "please enrich editorial content before publishing",
];

function parseArgs(argv) {
  const result = {
    input: "",
    output: "",
    write: false,
  };

  for (const arg of argv) {
    if (arg.startsWith("--input=")) result.input = arg.slice("--input=".length);
    else if (arg.startsWith("--output=")) result.output = arg.slice("--output=".length);
    else if (arg === "--write") result.write = true;
    else if (arg === "--help" || arg === "-h") result.help = true;
  }

  return result;
}

function printUsage() {
  console.log("promote_products_by_editor_verdict.mjs");
  console.log("Usage:");
  console.log("  node scripts/promote_products_by_editor_verdict.mjs --input=<cms-export.json> [--write] [--output=<file>]");
  console.log("");
  console.log("Rules:");
  console.log("  - If both zh.editorVerdict and en.editorVerdict are non-empty and not placeholder text,");
  console.log("    status will be set to published.");
  console.log("");
  console.log("Options:");
  console.log("  --input=<path>   required input JSON file");
  console.log("  --write          persist changes to file");
  console.log("  --output=<path>  optional output file path; defaults to input path when --write is set");
  console.log("  --help           show this help");
}

function isMeaningfulVerdict(value) {
  const text = String(value || "").trim();
  if (!text) return false;
  const lower = text.toLowerCase();
  return !PLACEHOLDER_PATTERNS.some((pattern) => lower.includes(pattern));
}

function normalizeStatus(value) {
  return String(value || "").trim().toLowerCase();
}

function extractProductsContainer(payload) {
  if (Array.isArray(payload)) {
    return { products: payload, kind: "array" };
  }

  const collectionsProducts = payload?.data?.collections?.products;
  if (Array.isArray(collectionsProducts)) {
    return { products: collectionsProducts, kind: "collections" };
  }

  throw new Error("Unsupported JSON shape: expected array or data.collections.products");
}

function applyStatusPromotion(products) {
  let eligibleCount = 0;
  let updatedCount = 0;
  let alreadyPublishedCount = 0;
  const updatedIds = [];

  for (const product of products) {
    const zhVerdict = product?.zh?.editorVerdict;
    const enVerdict = product?.en?.editorVerdict;
    const eligible = isMeaningfulVerdict(zhVerdict) && isMeaningfulVerdict(enVerdict);

    if (!eligible) continue;
    eligibleCount += 1;

    const currentStatus = normalizeStatus(product?.status);
    if (currentStatus === "published") {
      alreadyPublishedCount += 1;
      continue;
    }

    product.status = "published";
    updatedCount += 1;
    updatedIds.push(String(product?.id || "").trim());
  }

  return {
    total: products.length,
    eligibleCount,
    updatedCount,
    alreadyPublishedCount,
    skippedCount: products.length - eligibleCount,
    updatedIds,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    return;
  }

  if (!args.input) {
    throw new Error("Missing --input=/path/to/cms-export.json");
  }

  const inputPath = path.resolve(args.input);
  const raw = await fs.readFile(inputPath, "utf8");
  const payload = JSON.parse(raw);

  const { products } = extractProductsContainer(payload);
  const summary = applyStatusPromotion(products);

  console.log(`[publish-status-tool] input=${inputPath}`);
  console.log(`[publish-status-tool] total=${summary.total}`);
  console.log(`[publish-status-tool] eligible=${summary.eligibleCount}`);
  console.log(`[publish-status-tool] updated=${summary.updatedCount}`);
  console.log(`[publish-status-tool] already_published=${summary.alreadyPublishedCount}`);
  console.log(`[publish-status-tool] skipped=${summary.skippedCount}`);

  if (summary.updatedIds.length > 0) {
    console.log(`[publish-status-tool] updated_ids=${summary.updatedIds.join(",")}`);
  }

  if (!args.write) {
    console.log("[publish-status-tool] dry-run only; use --write to persist changes");
    return;
  }

  const outputPath = args.output ? path.resolve(args.output) : inputPath;
  await fs.writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`[publish-status-tool] wrote=${outputPath}`);
}

main().catch((error) => {
  console.error(`[publish-status-tool] failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
