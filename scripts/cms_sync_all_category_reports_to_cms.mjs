#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const DEFAULT_BASE = "https://store.balancebiketoddler.com";
const DEFAULT_REPORTS_ROOT = "../backend/.deploy/worker-api-data/api-data";

const CATEGORY_ALIAS = {
  strollers: "stroller",
};

function parseArgs(argv) {
  const result = {
    base: DEFAULT_BASE,
    reportsRoot: DEFAULT_REPORTS_ROOT,
    apply: false,
    retries: undefined,
    timeoutMs: undefined,
    include: [],
    exclude: [],
  };

  for (const arg of argv) {
    if (arg.startsWith("--base=")) result.base = arg.slice("--base=".length);
    else if (arg.startsWith("--reportsRoot=")) result.reportsRoot = arg.slice("--reportsRoot=".length);
    else if (arg.startsWith("--retries=")) result.retries = arg.slice("--retries=".length);
    else if (arg.startsWith("--timeoutMs=")) result.timeoutMs = arg.slice("--timeoutMs=".length);
    else if (arg.startsWith("--include=")) {
      result.include = arg
        .slice("--include=".length)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    } else if (arg.startsWith("--exclude=")) {
      result.exclude = arg
        .slice("--exclude=".length)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    } else if (arg === "--apply") {
      result.apply = true;
    }
  }

  return result;
}

function normalizeBase(base) {
  return String(base || "").trim().replace(/\/+$/, "");
}

function inferCategoryIdFromReportFile(filePath) {
  const baseName = path.basename(filePath).toLowerCase();
  if (!baseName.endsWith("_report.json")) return "";
  const raw = baseName.slice(0, -"_report.json".length);
  return CATEGORY_ALIAS[raw] || raw;
}

async function walkDir(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const abs = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkDir(abs)));
    } else if (entry.isFile() && entry.name.endsWith("_report.json")) {
      files.push(abs);
    }
  }

  return files;
}

function runOneSync({ syncScriptPath, base, reportFile, categoryId, apply, retries, timeoutMs }) {
  const args = [
    syncScriptPath,
    `--base=${base}`,
    `--input=${reportFile}`,
    `--categoryId=${categoryId}`,
  ];

  if (apply) args.push("--apply");
  if (retries) args.push(`--retries=${retries}`);
  if (timeoutMs) args.push(`--timeoutMs=${timeoutMs}`);

  return new Promise((resolve) => {
    const child = spawn(process.execPath, args, {
      stdio: "inherit",
      cwd: process.cwd(),
      env: process.env,
    });

    child.on("close", (code) => {
      resolve(Number(code || 0));
    });
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const base = normalizeBase(args.base);
  const reportsRoot = path.resolve(process.cwd(), String(args.reportsRoot || DEFAULT_REPORTS_ROOT));
  const syncScriptPath = path.resolve(process.cwd(), "scripts/cms_sync_category_report_to_cms.mjs");

  if (!/^https?:\/\//i.test(base)) {
    throw new Error(`Invalid --base: ${base}`);
  }

  const discovered = (await walkDir(reportsRoot)).sort((a, b) => a.localeCompare(b));
  const planned = discovered
    .map((reportFile) => ({
      reportFile,
      categoryId: inferCategoryIdFromReportFile(reportFile),
    }))
    .filter((item) => item.categoryId);

  const includeSet = new Set(args.include.map((item) => item.toLowerCase()));
  const excludeSet = new Set(args.exclude.map((item) => item.toLowerCase()));

  const filtered = planned.filter((item) => {
    const category = item.categoryId.toLowerCase();
    if (includeSet.size > 0 && !includeSet.has(category)) return false;
    if (excludeSet.has(category)) return false;
    return true;
  });

  console.log(`[cms-sync-all-reports] base=${base}`);
  console.log(`[cms-sync-all-reports] reportsRoot=${reportsRoot}`);
  console.log(`[cms-sync-all-reports] apply=${args.apply}`);
  console.log(`[cms-sync-all-reports] found=${planned.length} selected=${filtered.length}`);

  if (filtered.length === 0) {
    console.log("[cms-sync-all-reports] nothing to run");
    return;
  }

  const failures = [];
  let success = 0;

  for (let i = 0; i < filtered.length; i += 1) {
    const item = filtered[i];
    console.log(`[cms-sync-all-reports] (${i + 1}/${filtered.length}) category=${item.categoryId} file=${item.reportFile}`);
    const exitCode = await runOneSync({
      syncScriptPath,
      base,
      reportFile: item.reportFile,
      categoryId: item.categoryId,
      apply: args.apply,
      retries: args.retries,
      timeoutMs: args.timeoutMs,
    });

    if (exitCode === 0) {
      success += 1;
      console.log(`[cms-sync-all-reports] success category=${item.categoryId}`);
    } else {
      failures.push({ categoryId: item.categoryId, reportFile: item.reportFile, exitCode });
      console.log(`[cms-sync-all-reports] failed category=${item.categoryId} exit=${exitCode}`);
    }
  }

  console.log(`[cms-sync-all-reports] finished success=${success} failed=${failures.length}`);
  if (failures.length > 0) {
    for (const failure of failures) {
      console.log(`[cms-sync-all-reports] failure category=${failure.categoryId} file=${failure.reportFile} exit=${failure.exitCode}`);
    }
    process.exit(2);
  }
}

main().catch((error) => {
  console.error(`[cms-sync-all-reports] failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
