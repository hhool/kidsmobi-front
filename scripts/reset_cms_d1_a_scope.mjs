#!/usr/bin/env node

const COLLECTIONS = [
  "categories",
  "products",
  "scenarios",
  "evaluations",
  "guides",
  "news",
];

function parseArgs(argv) {
  const args = {
    base: "",
    execute: false,
    init: true,
  };

  for (const raw of argv) {
    if (raw.startsWith("--base=")) {
      args.base = raw.slice("--base=".length);
      continue;
    }
    if (raw === "--execute") {
      args.execute = true;
      continue;
    }
    if (raw === "--no-init") {
      args.init = false;
      continue;
    }
    if (raw === "--help" || raw === "-h") {
      args.help = true;
      continue;
    }
  }

  return args;
}

function usage() {
  console.log("Usage: node scripts/reset_cms_d1_a_scope.mjs --base=<cms-api-base> [--execute] [--no-init]");
  console.log("Examples:");
  console.log("  node scripts/reset_cms_d1_a_scope.mjs --base=https://kidsmobi-api-v1.seaman-player.workers.dev");
  console.log("  node scripts/reset_cms_d1_a_scope.mjs --base=https://kidsmobi-api-v1.seaman-player.workers.dev --execute");
  console.log("  node scripts/reset_cms_d1_a_scope.mjs --base=https://kidsmobi-api-v1.seaman-player.workers.dev --execute --no-init");
}

function normalizeBase(base) {
  if (!base) return "";
  return base.replace(/\/+$/, "");
}

async function requestJson(base, path, init = undefined) {
  const url = `${base}${path}`;
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers || {}),
    },
    ...init,
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText} @ ${path} :: ${text.slice(0, 300)}`);
  }

  const contentType = String(response.headers.get("content-type") || "").toLowerCase();
  if (!contentType.includes("application/json")) {
    throw new Error(`Expected JSON @ ${path}, got '${contentType || "unknown"}' :: ${text.slice(0, 120)}`);
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Invalid JSON @ ${path} :: ${String(error)} :: ${text.slice(0, 120)}`);
  }
}

async function listCollection(base, collection) {
  const payload = await requestJson(base, `/api/cms/${collection}`);
  const rows = Array.isArray(payload?.data) ? payload.data : [];
  return rows;
}

async function deleteRecord(base, collection, id) {
  const payload = await requestJson(base, `/api/cms/${collection}/delete`, {
    method: "POST",
    body: JSON.stringify({ id }),
  });
  return Boolean(payload?.data?.deleted);
}

async function initCategories(base) {
  return requestJson(base, "/api/cms/init/categories", {
    method: "POST",
    body: "{}",
  });
}

async function initProducts(base) {
  return requestJson(base, "/api/cms/init/products", {
    method: "POST",
    body: "{}",
  });
}

function isRouteNotFound(errorMessage) {
  const text = String(errorMessage || "").toLowerCase();
  return text.includes("404") || text.includes("routenotfound") || text.includes("not found");
}

async function clearCollection(base, collection) {
  const rows = await listCollection(base, collection);
  const ids = rows.map((r) => r?.id).filter((id) => typeof id === "string" && id.trim());
  let deleted = 0;

  for (const id of ids) {
    const ok = await deleteRecord(base, collection, id);
    if (ok) deleted += 1;
  }

  const after = await listCollection(base, collection);
  return {
    before: rows.length,
    deleted,
    after: after.length,
  };
}

function printSummary(resultMap, phase) {
  console.log(`\n[reset-a] ${phase}`);
  for (const collection of COLLECTIONS) {
    const result = resultMap[collection];
    if (!result) continue;
    console.log(
      `${collection.padEnd(12)} before=${String(result.before).padStart(4)}  deleted=${String(result.deleted).padStart(4)}  after=${String(result.after).padStart(4)}`,
    );
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return;
  }

  const base = normalizeBase(args.base);
  if (!base) {
    usage();
    process.exitCode = 1;
    return;
  }

  console.log(`[reset-a] target=${base}`);
  console.log(`[reset-a] scope=${COLLECTIONS.join(", ")}`);

  const pre = {};
  for (const collection of COLLECTIONS) {
    const rows = await listCollection(base, collection);
    pre[collection] = { before: rows.length, deleted: 0, after: rows.length };
  }
  printSummary(pre, "snapshot-before");

  if (!args.execute) {
    console.log("\n[reset-a] dry-run only. Pass --execute to apply deletions.");
    return;
  }

  const cleared = {};
  for (const collection of COLLECTIONS) {
    cleared[collection] = await clearCollection(base, collection);
  }
  printSummary(cleared, "after-clear");

  if (args.init) {
    console.log("\n[reset-a] re-init categories/products ...");
    let initSupported = true;
    try {
      const initCategoryPayload = await initCategories(base);
      const initProductPayload = await initProducts(base);
      console.log(`[reset-a] init/categories => ${JSON.stringify(initCategoryPayload?.data || {})}`);
      console.log(`[reset-a] init/products   => ${JSON.stringify(initProductPayload?.data || {})}`);
    } catch (error) {
      if (isRouteNotFound(error?.message || String(error))) {
        initSupported = false;
        console.warn("[reset-a] init endpoints are not available on this base, skipping re-init.");
      } else {
        throw error;
      }
    }

    const postInit = {};
    for (const collection of COLLECTIONS) {
      const rows = await listCollection(base, collection);
      postInit[collection] = {
        before: cleared[collection]?.after ?? 0,
        deleted: 0,
        after: rows.length,
      };
    }
    printSummary(postInit, initSupported ? "after-init" : "after-clear-no-init");
  }

  console.log("\n[reset-a] completed.");
}

main().catch((error) => {
  console.error("[reset-a] failed:", error?.message || error);
  process.exitCode = 1;
});
