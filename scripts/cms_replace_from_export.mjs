#!/usr/bin/env node

import fs from "node:fs/promises";

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
    apply: false,
  };

  for (const arg of argv) {
    if (arg.startsWith("--base=")) result.base = arg.slice("--base=".length);
    else if (arg.startsWith("--input=")) result.input = arg.slice("--input=".length);
    else if (arg.startsWith("--mode=")) result.mode = arg.slice("--mode=".length);
    else if (arg.startsWith("--collections=")) result.collections = arg.slice("--collections=".length);
    else if (arg === "--apply") result.apply = true;
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

function normalizeCollections(raw) {
  const value = String(raw || "all").trim().toLowerCase();
  if (value === "all") return [...ALLOWED_COLLECTIONS];

  const picked = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const invalid = picked.filter((item) => !ALLOWED_COLLECTIONS.includes(item));
  if (invalid.length > 0) {
    throw new Error(`Invalid collections: ${invalid.join(", ")}`);
  }

  return picked;
}

async function requestJson(url, init) {
  const response = await fetch(url, {
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      ...(init?.headers || {}),
    },
    ...init,
  });

  const text = await response.text();
  let parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = null;
  }

  if (!response.ok) {
    const preview = text.slice(0, 220).replace(/\s+/g, " ");
    throw new Error(`${response.status} ${response.statusText} ${url} :: ${preview}`);
  }

  return parsed;
}

async function loadExport(inputPath) {
  const raw = await fs.readFile(inputPath, "utf8");
  const json = JSON.parse(raw);
  const collections = json?.data?.collections;
  if (!collections || typeof collections !== "object") {
    throw new Error("Invalid export JSON: missing data.collections");
  }
  return collections;
}

async function purgeCollection(base, collection, apply) {
  if (!apply) {
    console.log(`[dry-run] purge ${collection}`);
    return 0;
  }

  const data = await requestJson(`${base}/api/cms/ops/purge`, {
    method: "POST",
    body: JSON.stringify({ collection }),
  });

  return Number(data?.data?.purged || 0);
}

async function saveRow(base, collection, row, apply) {
  if (!apply) return;
  await requestJson(`${base}/api/cms/${collection}/save`, {
    method: "POST",
    body: JSON.stringify(row),
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const base = normalizeBase(args.base);
  const mode = normalizeMode(args.mode);
  const targetCollections = normalizeCollections(args.collections);

  if (!args.input) {
    throw new Error("Missing --input=/path/to/cms-export.json");
  }
  if (!/^https?:\/\//i.test(base)) {
    throw new Error(`Invalid --base: ${base}`);
  }

  const collections = await loadExport(args.input);

  console.log(`[cms-replace] base=${base}`);
  console.log(`[cms-replace] input=${args.input}`);
  console.log(`[cms-replace] mode=${mode}`);
  console.log(`[cms-replace] apply=${args.apply}`);
  console.log(`[cms-replace] collections=${targetCollections.join(",")}`);

  for (const collection of targetCollections) {
    const rows = Array.isArray(collections[collection]) ? collections[collection] : [];

    if (mode === "replace") {
      const purged = await purgeCollection(base, collection, args.apply);
      if (args.apply) {
        console.log(`[cms-replace] purged ${collection}: ${purged}`);
      }
    }

    console.log(`[cms-replace] ${args.apply ? "writing" : "would write"} ${rows.length} rows -> ${collection}`);
    for (const row of rows) {
      await saveRow(base, collection, row, args.apply);
    }
  }

  console.log(`[cms-replace] done (${args.apply ? "applied" : "dry-run"})`);
}

main().catch((error) => {
  console.error(`[cms-replace] failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
