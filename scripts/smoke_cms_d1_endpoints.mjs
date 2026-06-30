#!/usr/bin/env node

const DEFAULT_BASE = "https://kidsmobi.pages.dev";
const ENDPOINTS = [
  "/api/cms/d1/health",
  "/api/cms/categories",
  "/api/cms/products",
  "/api/cms/scenarios",
  "/api/cms/evaluations",
  "/api/cms/guides",
  "/api/cms/news",
];

function parseArgs(argv) {
  const result = { base: DEFAULT_BASE };
  for (const arg of argv) {
    if (arg.startsWith("--base=")) {
      result.base = arg.slice("--base=".length);
    }
  }
  return result;
}

function normalizeBase(base) {
  return String(base || "").trim().replace(/\/+$/, "");
}

async function checkEndpoint(base, endpoint) {
  const url = `${base}${endpoint}`;
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    const contentType = String(response.headers.get("content-type") || "").toLowerCase();
    const text = await response.text();
    const isJson = contentType.includes("application/json");

    let hasDataField = false;
    let hasErrorField = false;
    if (isJson) {
      try {
        const parsed = JSON.parse(text);
        hasDataField = parsed && typeof parsed === "object" && Object.prototype.hasOwnProperty.call(parsed, "data");
        hasErrorField = parsed && typeof parsed === "object" && Object.prototype.hasOwnProperty.call(parsed, "error");
      } catch {
        // Keep false; JSON parse failure should be surfaced below.
      }
    }

    const ok = response.ok && isJson;
    return {
      endpoint,
      status: response.status,
      ok,
      contentType,
      hasDataField,
      hasErrorField,
      preview: text.slice(0, 120).replace(/\s+/g, " "),
    };
  } catch (error) {
    return {
      endpoint,
      status: -1,
      ok: false,
      contentType: "",
      hasDataField: false,
      hasErrorField: false,
      preview: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const base = normalizeBase(args.base);

  if (!/^https?:\/\//i.test(base)) {
    console.error(`[cms-smoke] invalid --base: ${base}`);
    process.exit(2);
  }

  console.log(`[cms-smoke] target=${base}`);
  const results = [];

  for (const endpoint of ENDPOINTS) {
    const result = await checkEndpoint(base, endpoint);
    results.push(result);
  }

  let failed = 0;
  for (const result of results) {
    const marker = result.ok ? "PASS" : "FAIL";
    if (!result.ok) failed += 1;
    console.log(
      `${marker}\t${result.endpoint}\tstatus=${result.status}\tct=${result.contentType || "n/a"}\tdata=${result.hasDataField}\terror=${result.hasErrorField}`,
    );
    if (!result.ok) {
      console.log(`  preview: ${result.preview}`);
    }
  }

  if (failed > 0) {
    console.error(`[cms-smoke] failed=${failed}/${results.length}`);
    process.exit(1);
  }

  console.log(`[cms-smoke] all ${results.length} endpoints passed`);
}

await main();
