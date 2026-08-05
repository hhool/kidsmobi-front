#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

function parseArg(name, fallback = "") {
  const hit = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

function nowStamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function listPreflightFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  return fs
    .readdirSync(dirPath)
    .filter((name) => /^m3-preflight-\d{8}-\d{6}\.json$/.test(name))
    .map((name) => path.join(dirPath, name));
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function sortByGeneratedAtDesc(items) {
  return [...items].sort((a, b) => {
    const ta = new Date(a.generatedAt || 0).getTime();
    const tb = new Date(b.generatedAt || 0).getTime();
    return tb - ta;
  });
}

function reportShowsAggregatorNotExposed(report) {
  const checks = Array.isArray(report?.checks) ? report.checks : [];
  if (checks.length === 0) return false;

  const byName = new Map(checks.map((check) => [String(check?.name || "").trim(), check]));
  const bundleDefault = String(byName.get("bundle_default_available")?.details || "");
  const bundleCategory = String(byName.get("bundle_category_scope")?.details || "");

  // On static hosts, both bundle probes typically return RouteNotFound.
  if (/RouteNotFound|aggregator route not exposed/i.test(bundleDefault) && /RouteNotFound|aggregator route not exposed/i.test(bundleCategory)) {
    return true;
  }

  const resourcesDenied = String(byName.get("resources_all_denied_without_token")?.details || "");
  if (/aggregator route not exposed/i.test(resourcesDenied)) {
    return true;
  }

  return false;
}

function pickDecisionAnchorReport(reports) {
  if (!reports.length) return null;
  const strictReports = reports.filter((item) => item?.strict === true);
  const strictEligible = strictReports.filter((item) => !reportShowsAggregatorNotExposed(item));
  if (strictEligible.length > 0) {
    return strictEligible[0];
  }
  if (strictReports.length > 0) {
    return strictReports[0];
  }
  return reports[0];
}

function classifyStatus(anchorReport) {
  if (!anchorReport) return "NO_DATA";
  const latestStatus = String(anchorReport?.globalStatus || "").toUpperCase();

  if (latestStatus === "FAIL") return "NO-GO";
  if (latestStatus === "WARN") return "HOLD";
  if (latestStatus === "PASS") return "GO";
  return "HOLD";
}

function collectCheckStats(reports) {
  const map = new Map();
  for (const report of reports) {
    for (const check of report.checks || []) {
      const key = String(check.name || "").trim();
      if (!key) continue;
      const current = map.get(key) || { PASS: 0, WARN: 0, FAIL: 0, latestDetails: "" };
      const status = String(check.status || "").toUpperCase();
      if (status === "PASS" || status === "WARN" || status === "FAIL") {
        current[status] += 1;
      }
      if (!current.latestDetails) {
        current.latestDetails = String(check.details || "");
      }
      map.set(key, current);
    }
  }
  return map;
}

function buildMarkdown(snapshot) {
  const lines = [];
  lines.push("# M3 Decision Snapshot");
  lines.push("");
  lines.push(`- Generated at: ${snapshot.generatedAt}`);
  lines.push(`- Reports analyzed: ${snapshot.reportCount}`);
  lines.push(`- Decision basis: ${snapshot.decisionBasis}`);
  lines.push(`- Suggested decision: ${snapshot.suggestedDecision}`);
  lines.push(`- Historical FAIL count (excluding latest): ${snapshot.historicalFailCount}`);
  lines.push("");

  if (snapshot.latest) {
    lines.push("## Latest Preflight");
    lines.push("");
    lines.push(`- File: ${snapshot.latest.fileName}`);
    lines.push(`- Base URL: ${snapshot.latest.baseUrl}`);
    lines.push(`- Category: ${snapshot.latest.probeCategory}`);
    lines.push(`- Status: ${snapshot.latest.globalStatus}`);
    lines.push("");
  }

  lines.push("## Check Statistics");
  lines.push("");
  lines.push("| Check | PASS | WARN | FAIL | Latest Details |");
  lines.push("|---|---:|---:|---:|---|");
  for (const [name, stats] of snapshot.checkStats.entries()) {
    lines.push(`| ${name} | ${stats.PASS} | ${stats.WARN} | ${stats.FAIL} | ${String(stats.latestDetails).replace(/\|/g, "\\|")} |`);
  }
  lines.push("");

  lines.push("## Action Hints");
  lines.push("");
  if (snapshot.suggestedDecision === "NO-GO") {
    lines.push("- At least one FAIL exists. Stop gray expansion and execute rollback checklist.");
  } else if (snapshot.suggestedDecision === "HOLD") {
    lines.push("- WARN exists. Run strict preflight on front local/preview host before GO decision.");
  } else if (snapshot.suggestedDecision === "GO") {
    lines.push("- No FAIL/WARN in preflight reports. Continue with batch release and KPI observation.");
  } else {
    lines.push("- No preflight report found. Run m3 preflight first.");
  }
  if (snapshot.historicalFailCount > 0) {
    lines.push("- Historical FAIL exists in older reports; review context before final sign-off.");
  }
  return lines.join("\n");
}

async function main() {
  const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");
  const defaultRawDir = path.join(repoRoot, "doc", "process_milestones", "2026-08-05_M3_gray_release_raw");
  const rawDir = path.resolve(parseArg("rawDir", defaultRawDir));

  const files = listPreflightFiles(rawDir);
  const reports = sortByGeneratedAtDesc(
    files.map((filePath) => ({
      filePath,
      fileName: path.basename(filePath),
      ...readJson(filePath),
    }))
  );

  const latest = pickDecisionAnchorReport(reports);
  const decisionBasis = latest?.strict === true
    ? (reportShowsAggregatorNotExposed(latest) ? "latest-strict-host-mismatch" : "latest-strict")
    : "latest-any";
  const checkStats = collectCheckStats(reports);
  const suggestedDecision = classifyStatus(latest);
  const historicalFailCount = reports
    .filter((item) => item !== latest)
    .filter((item) => String(item.globalStatus || "").toUpperCase() === "FAIL").length;

  const snapshot = {
    generatedAt: new Date().toISOString(),
    reportCount: reports.length,
    latest,
    decisionBasis,
    checkStats,
    historicalFailCount,
    suggestedDecision,
  };

  const stamp = nowStamp();
  const outJson = path.join(rawDir, `m3-decision-snapshot-${stamp}.json`);
  const outMd = path.join(rawDir, `m3-decision-snapshot-${stamp}.md`);

  fs.mkdirSync(rawDir, { recursive: true });
  fs.writeFileSync(
    outJson,
    JSON.stringify(
      {
        generatedAt: snapshot.generatedAt,
        reportCount: snapshot.reportCount,
        latest: latest
          ? {
              fileName: latest.fileName,
              baseUrl: latest.baseUrl,
              probeCategory: latest.probeCategory,
              strict: Boolean(latest.strict),
              globalStatus: latest.globalStatus,
            }
          : null,
        decisionBasis: snapshot.decisionBasis,
        checkStats: Object.fromEntries(snapshot.checkStats),
        historicalFailCount: snapshot.historicalFailCount,
        suggestedDecision: snapshot.suggestedDecision,
      },
      null,
      2
    )
  );
  fs.writeFileSync(outMd, buildMarkdown(snapshot));

  console.log(`M3 decision snapshot generated: ${snapshot.suggestedDecision}`);
  if (snapshot.historicalFailCount > 0) {
    console.log(`Historical FAIL reports (excluding latest): ${snapshot.historicalFailCount}`);
  }
  console.log(`Report written: ${outJson}`);
  console.log(`Report written: ${outMd}`);
}

main().catch((error) => {
  console.error("Failed to generate M3 decision snapshot:", error?.message || error);
  process.exit(1);
});
