#!/usr/bin/env node

import { spawn } from "node:child_process";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

const DEFAULT_BASE = "https://dev.kidsmobi.pages.dev";
const ALLOWED_COLLECTIONS = [
  "products",
  "categories",
  "scenarios",
  "evaluations",
  "guides",
  "news",
  "settings",
  "pages",
];

function parseArgs(argv) {
  const result = {
    base: DEFAULT_BASE,
    input: "",
    mode: "replace",
    collections: "all",
    allowEmpty: "",
    apply: false,
  };

  for (const arg of argv) {
    if (arg.startsWith("--base=")) result.base = arg.slice("--base=".length);
    else if (arg.startsWith("--input=")) result.input = arg.slice("--input=".length);
    else if (arg.startsWith("--mode=")) result.mode = arg.slice("--mode=".length);
    else if (arg.startsWith("--collections=")) result.collections = arg.slice("--collections=".length);
    else if (arg.startsWith("--allow-empty=")) result.allowEmpty = arg.slice("--allow-empty=".length);
    else if (arg === "--apply") result.apply = true;
    else if (arg === "--help" || arg === "-h") result.help = true;
  }

  return result;
}

function normalizeBase(base) {
  return String(base || "").trim().replace(/\/+$/, "");
}

function normalizeMode(mode) {
  const value = String(mode || "replace").trim().toLowerCase();
  if (value !== "replace" && value !== "append") {
    throw new Error(`Invalid --mode: ${mode}. Use replace|append.`);
  }
  return value;
}

function parseCollectionList(raw, optionName, defaultValue = "all") {
  const value = String(raw ?? defaultValue).trim().toLowerCase();
  if (!value || value === "none") return [];
  if (value === "all") return [...ALLOWED_COLLECTIONS];

  const picked = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const invalid = picked.filter((item) => !ALLOWED_COLLECTIONS.includes(item));
  if (invalid.length > 0) {
    throw new Error(`Invalid ${optionName}: ${invalid.join(", ")}`);
  }

  return [...new Set(picked)];
}

async function loadExportCollections(inputPath) {
  const raw = await fs.readFile(inputPath, "utf8");
  const json = JSON.parse(raw);
  const collections = json?.data?.collections;
  if (!collections || typeof collections !== "object") {
    throw new Error("Invalid export JSON: missing data.collections");
  }
  return collections;
}

function printUsage() {
  console.log("cms_safe_replace_from_export.mjs");
  console.log("Usage:");
  console.log("  node scripts/cms_safe_replace_from_export.mjs --input=<cms-export.json> [options]");
  console.log("");
  console.log("Options:");
  console.log(`  --base=<url>             CMS API base (default: ${DEFAULT_BASE})`);
  console.log("  --mode=replace|append    write mode (default: replace)");
  console.log("  --collections=all|a,b    target collections (default: all)");
  console.log("  --allow-empty=all|a,b    allow empty input collections for replace");
  console.log("  --apply                  apply write; without this flag runs dry-run");
  console.log("  --help                   show this help");
  console.log("");
  console.log("Examples:");
  console.log("  node scripts/cms_safe_replace_from_export.mjs --base=https://kidsmobi-api-v1.seaman-player.workers.dev --input=../backend/env/export.json --mode=replace --collections=products --apply");
  console.log("  node scripts/cms_safe_replace_from_export.mjs --base=https://kidsmobi-api-v1.seaman-player.workers.dev --input=../backend/env/export.json --mode=replace --collections=products,categories --allow-empty=categories --apply");
}

function runBaseReplaceScript(forwardArgs) {
  return new Promise((resolve, reject) => {
    const currentFile = fileURLToPath(import.meta.url);
    const scriptPath = path.resolve(path.dirname(currentFile), "cms_replace_from_export.mjs");
    const child = spawn(process.execPath, [scriptPath, ...forwardArgs], {
      stdio: "inherit",
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code, signal) => {
      if (signal) {
        reject(new Error(`Base script terminated by signal: ${signal}`));
        return;
      }
      if (code !== 0) {
        reject(new Error(`Base script exited with code ${code}`));
        return;
      }
      resolve();
    });
  });
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

  const base = normalizeBase(args.base);
  const mode = normalizeMode(args.mode);
  const targetCollections = parseCollectionList(args.collections, "--collections", "all");
  const allowEmptyCollections = parseCollectionList(args.allowEmpty, "--allow-empty", "none");

  if (!/^https?:\/\//i.test(base)) {
    throw new Error(`Invalid --base: ${base}`);
  }
  if (targetCollections.length === 0) {
    throw new Error("No target collections selected. Use --collections=all or comma-separated names.");
  }

  const exportCollections = await loadExportCollections(args.input);
  const counts = targetCollections.map((collection) => {
    const rows = Array.isArray(exportCollections[collection]) ? exportCollections[collection] : [];
    return { collection, count: rows.length };
  });

  console.log(`[cms-safe-replace] base=${base}`);
  console.log(`[cms-safe-replace] input=${args.input}`);
  console.log(`[cms-safe-replace] mode=${mode}`);
  console.log(`[cms-safe-replace] apply=${args.apply}`);
  console.log(`[cms-safe-replace] collections=${targetCollections.join(",")}`);
  console.log(`[cms-safe-replace] allow-empty=${allowEmptyCollections.length > 0 ? allowEmptyCollections.join(",") : "none"}`);
  console.log("[cms-safe-replace] target counts:");
  for (const entry of counts) {
    console.log(`  - ${entry.collection}: ${entry.count}`);
  }

  if (mode === "replace") {
    const blocked = counts.filter((entry) => entry.count === 0 && !allowEmptyCollections.includes(entry.collection));
    if (blocked.length > 0) {
      const names = blocked.map((entry) => entry.collection);
      throw new Error(
        [
          `Blocked unsafe replace for empty collections: ${names.join(", ")}.`,
          "Replace mode purges target collections before writing.",
          `If this is intentional, add --allow-empty=${names.join(",")} (or --allow-empty=all).`,
        ].join(" "),
      );
    }
  }

  const forwardArgs = [
    `--base=${base}`,
    `--input=${args.input}`,
    `--mode=${mode}`,
    `--collections=${targetCollections.join(",")}`,
  ];
  if (args.apply) {
    forwardArgs.push("--apply");
  }

  await runBaseReplaceScript(forwardArgs);
}

main().catch((error) => {
  console.error(`[cms-safe-replace] failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
