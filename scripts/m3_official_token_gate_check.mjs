#!/usr/bin/env node

import { spawnSync } from "node:child_process";

function parseArg(name, fallback = "") {
  const hit = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

function isTruthy(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

function runOrFail(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

const baseUrl = String(parseArg("base", process.env.M3_BASE_URL || "")).trim();
const category = String(parseArg("category", "stroller")).trim();
const strict = isTruthy(parseArg("strict", "1"));
const token = String(
  parseArg(
    "token",
    process.env.CMS_ADMIN_ALL_TOKEN || process.env.VITE_CMS_ADMIN_ALL_TOKEN || "",
  ),
).trim();

if (!baseUrl) {
  console.error("Missing --base=<target-host>. Example: --base=https://dev.kidsmobi.pages.dev");
  process.exit(2);
}

if (!token || token.includes("<official-token>") || token.toLowerCase() === "todo") {
  console.error("Missing official admin token. Provide --token=... or set CMS_ADMIN_ALL_TOKEN.");
  process.exit(2);
}

const preflightArgs = [
  "scripts/m3_gray_release_preflight.mjs",
  `--base=${baseUrl}`,
  `--category=${category}`,
  `--strict=${strict ? "1" : "0"}`,
  `--token=${token}`,
];

console.log("[m3:official] Running strict preflight with admin token...");
runOrFail("node", preflightArgs);

console.log("[m3:official] Refreshing decision snapshot...");
runOrFail("node", ["scripts/m3_generate_decision_snapshot.mjs"]);

console.log("[m3:official] Completed: preflight + snapshot");
