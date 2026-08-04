#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

function parseArg(name, fallback = "") {
  const hit = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

function parseBoolArg(name, fallback = false) {
  const raw = String(parseArg(name, fallback ? "1" : "0") || "").trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}

function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function normalizeBaseUrl(raw) {
  const value = String(raw || "").trim();
  if (!value) return "";
  return value.replace(/\/+$/, "");
}

function toJsonSafe(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function callJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  const json = toJsonSafe(text);
  return {
    status: response.status,
    ok: response.ok,
    bodyText: text,
    json,
  };
}

function isRouteNotFound(result) {
  if (!result || result.status !== 404) return false;
  const code = String(result?.json?.code || "").trim();
  if (code === "404000") return true;
  return /RouteNotFound/i.test(String(result?.bodyText || ""));
}

function extractCategorySet(products) {
  const categories = new Set();
  for (const item of Array.isArray(products) ? products : []) {
    const raw = String(item?.categoryId || item?.category || "").trim();
    if (raw) categories.add(raw);
  }
  return categories;
}

function buildMarkdown(report) {
  const lines = [];
  lines.push("# M3 Preflight API Report");
  lines.push("");
  lines.push(`- Base URL: ${report.baseUrl}`);
  lines.push(`- Time: ${report.generatedAt}`);
  lines.push(`- Strict Mode: ${report.strict ? "ON" : "OFF"}`);
  lines.push(`- Global Status: ${report.globalStatus}`);
  lines.push("");
  lines.push("| Check | Status | Details |");
  lines.push("|---|---|---|");
  for (const check of report.checks) {
    lines.push(`| ${check.name} | ${check.status} | ${check.details.replace(/\|/g, "\\|")} |`);
  }
  lines.push("");
  lines.push("## Notes");
  lines.push("");
  lines.push("- FAIL: blocking issue for gray release.");
  lines.push("- WARN: non-blocking but should be reviewed.");
  lines.push("- PASS: check met expected behavior.");
  lines.push("- If RouteNotFound appears on pages domain, run this script against a front server host exposing /api/content/* routes.");
  return lines.join("\n");
}

function pushCheck(checks, name, status, details) {
  checks.push({ name, status, details });
}

function calcGlobalStatus(checks) {
  if (checks.some((item) => item.status === "FAIL")) return "FAIL";
  if (checks.some((item) => item.status === "WARN")) return "WARN";
  return "PASS";
}

async function main() {
  const defaultBase = process.env.KIDSMOBI_BASE_URL || "http://127.0.0.1:5173";
  const baseUrl = normalizeBaseUrl(parseArg("base", defaultBase));
  const token = String(parseArg("token", process.env.CMS_ADMIN_ALL_TOKEN || process.env.VITE_CMS_ADMIN_ALL_TOKEN || "")).trim();
  const probeCategory = String(parseArg("category", "kids_bikes")).trim();
  const strict = parseBoolArg("strict", false);

  if (!baseUrl) {
    console.error("Missing --base, for example: --base=https://kidsmobi.pages.dev");
    process.exit(2);
  }

  const checks = [];

  const bundleDefault = await callJson(`${baseUrl}/api/content/bundle`);
  if (!bundleDefault.ok || !bundleDefault.json) {
    if (!strict && isRouteNotFound(bundleDefault)) {
      pushCheck(
        checks,
        "bundle_default_available",
        "WARN",
        "aggregator route not exposed on this host (RouteNotFound); run preflight on front local/preview host"
      );
    } else {
      pushCheck(
        checks,
        "bundle_default_available",
        "FAIL",
        `status=${bundleDefault.status}, body=${bundleDefault.bodyText.slice(0, 120)}`
      );
    }
  } else {
    const products = bundleDefault.json.products || [];
    const categorySet = extractCategorySet(products);
    if (categorySet.size <= 1) {
      pushCheck(
        checks,
        "bundle_default_single_category",
        "PASS",
        `products=${products.length}, categories=${Array.from(categorySet).join(",") || "none"}`
      );
    } else {
      pushCheck(
        checks,
        "bundle_default_single_category",
        "FAIL",
        `expected <=1 category but got ${categorySet.size}: ${Array.from(categorySet).join(",")}`
      );
    }
  }

  const bundleByCategory = await callJson(`${baseUrl}/api/content/bundle?categoryId=${encodeURIComponent(probeCategory)}`);
  if (!bundleByCategory.ok || !bundleByCategory.json) {
    if (!strict && isRouteNotFound(bundleByCategory)) {
      pushCheck(
        checks,
        "bundle_category_scope",
        "WARN",
        "aggregator route not exposed on this host (RouteNotFound); category scope check skipped"
      );
    } else {
      pushCheck(
        checks,
        "bundle_category_scope",
        "FAIL",
        `status=${bundleByCategory.status}, body=${bundleByCategory.bodyText.slice(0, 120)}`
      );
    }
  } else {
    const products = bundleByCategory.json.products || [];
    const categorySet = extractCategorySet(products);
    const pass = categorySet.size <= 1;
    pushCheck(
      checks,
      "bundle_category_scope",
      pass ? "PASS" : "WARN",
      `requested=${probeCategory}, products=${products.length}, categories=${Array.from(categorySet).join(",") || "none"}`
    );
  }

  const allDenied = await callJson(`${baseUrl}/api/content/resources?all=1`, {
    headers: {
      "x-forwarded-for": "198.51.100.10",
      "x-real-ip": "198.51.100.10",
    },
  });
  if (allDenied.status === 403) {
    pushCheck(checks, "resources_all_denied_without_token", "PASS", "status=403 as expected");
  } else {
    if (!strict && isRouteNotFound(allDenied)) {
      pushCheck(
        checks,
        "resources_all_denied_without_token",
        "WARN",
        "aggregator route not exposed on this host (RouteNotFound); all=1 gate check skipped"
      );
    } else {
      pushCheck(
        checks,
        "resources_all_denied_without_token",
        "FAIL",
        `expected 403 but got status=${allDenied.status}`
      );
    }
  }

  if (token) {
    const allAllowed = await callJson(`${baseUrl}/api/content/resources?all=1`, {
      headers: {
        "x-cms-admin-token": token,
      },
    });
    if (allAllowed.ok) {
      pushCheck(checks, "resources_all_allowed_with_token", "PASS", `status=${allAllowed.status}`);
    } else {
      pushCheck(
        checks,
        "resources_all_allowed_with_token",
        "FAIL",
        `status=${allAllowed.status}, body=${allAllowed.bodyText.slice(0, 120)}`
      );
    }
  } else {
    pushCheck(
      checks,
      "resources_all_allowed_with_token",
      "WARN",
      "token missing, skipped authorized all=1 verification"
    );
  }

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    probeCategory,
    strict,
    checks,
    globalStatus: calcGlobalStatus(checks),
  };

  const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");
  const outDir = path.join(repoRoot, "doc", "process_milestones", "2026-08-05_M3_gray_release_raw");
  fs.mkdirSync(outDir, { recursive: true });
  const stamp = nowStamp();
  const jsonPath = path.join(outDir, `m3-preflight-${stamp}.json`);
  const mdPath = path.join(outDir, `m3-preflight-${stamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(mdPath, buildMarkdown(report));

  console.log(`M3 preflight status: ${report.globalStatus}`);
  for (const item of checks) {
    console.log(`- [${item.status}] ${item.name}: ${item.details}`);
  }
  console.log(`Report written: ${jsonPath}`);
  console.log(`Report written: ${mdPath}`);

  if (report.globalStatus === "FAIL") {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("M3 preflight script failed:", error?.message || error);
  process.exit(1);
});
