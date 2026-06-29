#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

function parseArg(name, defaultValue) {
  const hit = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  if (!hit) return defaultValue;
  return hit.slice(name.length + 3);
}

function toNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function formatDate(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function fmtSec(ms) {
  if (ms == null) return "n/a";
  return `${(ms / 1000).toFixed(2)}s`;
}

function fmtMs(ms) {
  if (ms == null) return "n/a";
  return `${ms.toFixed(0)}ms`;
}

function fmtCls(v) {
  if (v == null) return "n/a";
  return v.toFixed(3);
}

function fmtPercent(v) {
  if (v == null) return "n/a";
  return `${Math.round(v * 100)}%`;
}

function diff(now, prev) {
  if (now == null || prev == null) return null;
  return now - prev;
}

function trendArrow(value, lowerIsBetter = true) {
  if (value == null) return "-";
  if (value === 0) return "→";
  if (lowerIsBetter) return value < 0 ? "↑" : "↓";
  return value > 0 ? "↑" : "↓";
}

function listReportFiles(reportDir) {
  return fs
    .readdirSync(reportDir)
    .filter((name) => /^web-vitals-(mobile|desktop)-\d{8}-\d{6}\.json$/.test(name))
    .map((name) => path.join(reportDir, name));
}

function readReport(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(raw);
  const strategy = data.strategy;
  const stamp = data.generatedAt || "";
  return {
    filePath,
    strategy,
    generatedAt: stamp,
    providerUsed: data.providerUsed || "unknown",
    runs: data.runs || 0,
    aggregate: data.aggregate || {},
  };
}

function sortByTimeDesc(items) {
  return [...items].sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
}

function gateStatus(latest, thresholds) {
  const checks = [];

  const cls = latest?.aggregate?.cls?.p75 ?? null;
  const lcp = latest?.aggregate?.lcp?.p75 ?? null;
  const fcp = latest?.aggregate?.fcp?.p75 ?? null;
  const ttfb = latest?.aggregate?.ttfb?.p75 ?? null;
  const inp = latest?.aggregate?.inp?.p75 ?? null;

  checks.push({ metric: "CLS", pass: cls != null && cls <= thresholds.cls, actual: cls, limit: thresholds.cls });
  checks.push({ metric: "LCP", pass: lcp != null && lcp <= thresholds.lcp, actual: lcp, limit: thresholds.lcp });
  checks.push({ metric: "FCP", pass: fcp != null && fcp <= thresholds.fcp, actual: fcp, limit: thresholds.fcp });
  checks.push({ metric: "TTFB", pass: ttfb != null && ttfb <= thresholds.ttfb, actual: ttfb, limit: thresholds.ttfb });
  checks.push({ metric: "INP", pass: inp != null && inp <= thresholds.inp, actual: inp, limit: thresholds.inp, optional: true });

  const required = checks.filter((c) => !c.optional);
  const requiredPass = required.every((c) => c.pass);
  const missingRequired = required.some((c) => c.actual == null);

  let status = "PASS";
  if (!requiredPass || missingRequired) status = "WARN";
  return { status, checks };
}

function buildHistoryRows(reports) {
  return reports.map((r) => ({
    generatedAt: r.generatedAt,
    providerUsed: r.providerUsed,
    runs: r.runs,
    clsP75: r.aggregate?.cls?.p75 ?? null,
    lcpP75: r.aggregate?.lcp?.p75 ?? null,
    inpP75: r.aggregate?.inp?.p75 ?? null,
    fcpP75: r.aggregate?.fcp?.p75 ?? null,
    ttfbP75: r.aggregate?.ttfb?.p75 ?? null,
  }));
}

function buildMarkdownEn(summary) {
  const lines = [];
  lines.push("# Web Vitals Trend Report");
  lines.push("");
  lines.push(`- Generated at: ${summary.generatedAt}`);
  lines.push(`- History window: ${summary.windowSize}`);
  lines.push("");

  for (const strategy of ["mobile", "desktop"]) {
    const section = summary[strategy];
    lines.push(`## ${strategy.toUpperCase()} Summary`);
    if (!section.latest) {
      lines.push("");
      lines.push("No report found.");
      lines.push("");
      continue;
    }

    lines.push("");
    lines.push(`- Latest report: ${section.latest.generatedAt}`);
    lines.push(`- Provider: ${section.latest.providerUsed}`);
    lines.push(`- Gate status: ${section.gate.status}`);
    lines.push("");
    lines.push("| Metric | Latest P75 | Prev P75 | Delta | Trend | Threshold | Gate |");
    lines.push("|---|---:|---:|---:|---:|---:|---|");

    const rows = [
      ["CLS", section.latest.clsP75, section.previous?.clsP75 ?? null, section.delta.cls, true, section.thresholds.cls, section.gateMap.CLS],
      ["LCP", section.latest.lcpP75, section.previous?.lcpP75 ?? null, section.delta.lcp, true, section.thresholds.lcp, section.gateMap.LCP],
      ["INP", section.latest.inpP75, section.previous?.inpP75 ?? null, section.delta.inp, true, section.thresholds.inp, section.gateMap.INP],
      ["FCP", section.latest.fcpP75, section.previous?.fcpP75 ?? null, section.delta.fcp, true, section.thresholds.fcp, section.gateMap.FCP],
      ["TTFB", section.latest.ttfbP75, section.previous?.ttfbP75 ?? null, section.delta.ttfb, true, section.thresholds.ttfb, section.gateMap.TTFB],
    ];

    for (const [name, now, prev, d, lowerBetter, threshold, gate] of rows) {
      const formatter = name === "CLS" ? fmtCls : name === "INP" ? fmtMs : fmtSec;
      const limit = name === "CLS" ? fmtCls(threshold) : name === "INP" ? fmtMs(threshold) : fmtSec(threshold);
      const deltaFmt = d == null ? "n/a" : (name === "CLS" ? d.toFixed(3) : name === "INP" ? `${d.toFixed(0)}ms` : `${(d / 1000).toFixed(2)}s`);
      lines.push(`| ${name} | ${formatter(now)} | ${formatter(prev)} | ${deltaFmt} | ${trendArrow(d, lowerBetter)} | ${limit} | ${gate} |`);
    }

    lines.push("");
    lines.push("### History");
    lines.push("");
    lines.push("| Time | Provider | Runs | CLS p75 | LCP p75 | INP p75 | FCP p75 | TTFB p75 |");
    lines.push("|---|---|---:|---:|---:|---:|---:|---:|");
    for (const h of section.history) {
      lines.push(`| ${h.generatedAt} | ${h.providerUsed} | ${h.runs} | ${fmtCls(h.clsP75)} | ${fmtSec(h.lcpP75)} | ${fmtMs(h.inpP75)} | ${fmtSec(h.fcpP75)} | ${fmtSec(h.ttfbP75)} |`);
    }

    lines.push("");
  }

  lines.push("## Decision");
  lines.push("");
  lines.push(`- Mobile: ${summary.mobile?.gate?.status || "WARN"}`);
  lines.push(`- Desktop: ${summary.desktop?.gate?.status || "WARN"}`);
  lines.push(`- Global: ${summary.globalStatus}`);
  return lines.join("\n");
}

function buildMarkdownZh(summary) {
  const lines = [];
  lines.push("# Web Vitals 趋势报告");
  lines.push("");
  lines.push(`- 生成时间: ${summary.generatedAt}`);
  lines.push(`- 历史窗口: ${summary.windowSize}`);
  lines.push("");

  for (const strategy of ["mobile", "desktop"]) {
    const section = summary[strategy];
    lines.push(`## ${strategy.toUpperCase()} 概览`);
    if (!section.latest) {
      lines.push("");
      lines.push("未找到可用报告。");
      lines.push("");
      continue;
    }

    lines.push("");
    lines.push(`- 最新报告: ${section.latest.generatedAt}`);
    lines.push(`- 采样来源: ${section.latest.providerUsed}`);
    lines.push(`- 门禁结论: ${section.gate.status}`);
    lines.push("");
    lines.push("| 指标 | 最新 P75 | 上一版 P75 | 差值 | 趋势 | 阈值 | 门禁 |");
    lines.push("|---|---:|---:|---:|---:|---:|---|");

    const rows = [
      ["CLS", section.latest.clsP75, section.previous?.clsP75 ?? null, section.delta.cls, true, section.thresholds.cls, section.gateMap.CLS],
      ["LCP", section.latest.lcpP75, section.previous?.lcpP75 ?? null, section.delta.lcp, true, section.thresholds.lcp, section.gateMap.LCP],
      ["INP", section.latest.inpP75, section.previous?.inpP75 ?? null, section.delta.inp, true, section.thresholds.inp, section.gateMap.INP],
      ["FCP", section.latest.fcpP75, section.previous?.fcpP75 ?? null, section.delta.fcp, true, section.thresholds.fcp, section.gateMap.FCP],
      ["TTFB", section.latest.ttfbP75, section.previous?.ttfbP75 ?? null, section.delta.ttfb, true, section.thresholds.ttfb, section.gateMap.TTFB],
    ];

    for (const [name, now, prev, d, lowerBetter, threshold, gate] of rows) {
      const formatter = name === "CLS" ? fmtCls : name === "INP" ? fmtMs : fmtSec;
      const limit = name === "CLS" ? fmtCls(threshold) : name === "INP" ? fmtMs(threshold) : fmtSec(threshold);
      const deltaFmt = d == null ? "n/a" : (name === "CLS" ? d.toFixed(3) : name === "INP" ? `${d.toFixed(0)}ms` : `${(d / 1000).toFixed(2)}s`);
      lines.push(`| ${name} | ${formatter(now)} | ${formatter(prev)} | ${deltaFmt} | ${trendArrow(d, lowerBetter)} | ${limit} | ${gate} |`);
    }

    lines.push("");
    lines.push("### 历史明细");
    lines.push("");
    lines.push("| 时间 | 来源 | 次数 | CLS p75 | LCP p75 | INP p75 | FCP p75 | TTFB p75 |");
    lines.push("|---|---|---:|---:|---:|---:|---:|---:|");
    for (const h of section.history) {
      lines.push(`| ${h.generatedAt} | ${h.providerUsed} | ${h.runs} | ${fmtCls(h.clsP75)} | ${fmtSec(h.lcpP75)} | ${fmtMs(h.inpP75)} | ${fmtSec(h.fcpP75)} | ${fmtSec(h.ttfbP75)} |`);
    }

    lines.push("");
  }

  lines.push("## 发布建议");
  lines.push("");
  lines.push(`- 移动端: ${summary.mobile?.gate?.status || "WARN"}`);
  lines.push(`- 桌面端: ${summary.desktop?.gate?.status || "WARN"}`);
  lines.push(`- 总结论: ${summary.globalStatus}`);
  return lines.join("\n");
}

function summarizeStrategy(reports, thresholds) {
  const sorted = sortByTimeDesc(reports);
  const latest = sorted[0] || null;
  const previous = sorted[1] || null;

  if (!latest) {
    return {
      latest: null,
      previous: null,
      delta: { cls: null, lcp: null, inp: null, fcp: null, ttfb: null },
      history: [],
      gate: { status: "WARN", checks: [] },
      gateMap: {},
      thresholds,
    };
  }

  const latestRow = {
    generatedAt: latest.generatedAt,
    providerUsed: latest.providerUsed,
    runs: latest.runs,
    clsP75: latest.aggregate?.cls?.p75 ?? null,
    lcpP75: latest.aggregate?.lcp?.p75 ?? null,
    inpP75: latest.aggregate?.inp?.p75 ?? null,
    fcpP75: latest.aggregate?.fcp?.p75 ?? null,
    ttfbP75: latest.aggregate?.ttfb?.p75 ?? null,
    perfAvg: null,
  };

  const prevRow = previous
    ? {
        generatedAt: previous.generatedAt,
        providerUsed: previous.providerUsed,
        runs: previous.runs,
        clsP75: previous.aggregate?.cls?.p75 ?? null,
        lcpP75: previous.aggregate?.lcp?.p75 ?? null,
        inpP75: previous.aggregate?.inp?.p75 ?? null,
        fcpP75: previous.aggregate?.fcp?.p75 ?? null,
        ttfbP75: previous.aggregate?.ttfb?.p75 ?? null,
      }
    : null;

  const gate = gateStatus(latest, thresholds);
  const gateMap = Object.fromEntries(gate.checks.map((c) => [c.metric, c.pass ? "PASS" : c.actual == null ? "N/A" : "WARN"]));

  return {
    latest: latestRow,
    previous: prevRow,
    delta: {
      cls: diff(latestRow.clsP75, prevRow?.clsP75 ?? null),
      lcp: diff(latestRow.lcpP75, prevRow?.lcpP75 ?? null),
      inp: diff(latestRow.inpP75, prevRow?.inpP75 ?? null),
      fcp: diff(latestRow.fcpP75, prevRow?.fcpP75 ?? null),
      ttfb: diff(latestRow.ttfbP75, prevRow?.ttfbP75 ?? null),
    },
    history: buildHistoryRows(sorted),
    gate,
    gateMap,
    thresholds,
  };
}

function main() {
  const windowSize = Math.max(1, toNumber(parseArg("window", "5"), 5));

  const mobileThresholds = {
    cls: toNumber(parseArg("mobile-cls", "0.1"), 0.1),
    lcp: toNumber(parseArg("mobile-lcp", "4000"), 4000),
    inp: toNumber(parseArg("mobile-inp", "200"), 200),
    fcp: toNumber(parseArg("mobile-fcp", "3000"), 3000),
    ttfb: toNumber(parseArg("mobile-ttfb", "800"), 800),
  };

  const desktopThresholds = {
    cls: toNumber(parseArg("desktop-cls", "0.1"), 0.1),
    lcp: toNumber(parseArg("desktop-lcp", "2500"), 2500),
    inp: toNumber(parseArg("desktop-inp", "200"), 200),
    fcp: toNumber(parseArg("desktop-fcp", "1800"), 1800),
    ttfb: toNumber(parseArg("desktop-ttfb", "800"), 800),
  };

  const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");
  const reportDir = path.join(repoRoot, "resource", "assets", "reports");
  const reportDirEn = path.join(reportDir, "en");
  const reportDirZh = path.join(reportDir, "zh");

  fs.mkdirSync(reportDir, { recursive: true });
  fs.mkdirSync(reportDirEn, { recursive: true });
  fs.mkdirSync(reportDirZh, { recursive: true });

  const allReports = listReportFiles(reportDir).map(readReport);
  const mobile = allReports.filter((r) => r.strategy === "mobile");
  const desktop = allReports.filter((r) => r.strategy === "desktop");

  const summary = {
    generatedAt: new Date().toISOString(),
    windowSize,
    totalReports: allReports.length,
    mobile: summarizeStrategy(sortByTimeDesc(mobile).slice(0, windowSize), mobileThresholds),
    desktop: summarizeStrategy(sortByTimeDesc(desktop).slice(0, windowSize), desktopThresholds),
  };

  const globalStatus = [summary.mobile.gate.status, summary.desktop.gate.status].every((s) => s === "PASS")
    ? "PASS"
    : "WARN";
  summary.globalStatus = globalStatus;

  const stamp = formatDate(new Date());
  const baseName = `web-vitals-trend-${stamp}`;
  const jsonPath = path.join(reportDir, `${baseName}.json`);
  const mdPathEn = path.join(reportDirEn, `${baseName}.md`);
  const mdPathZh = path.join(reportDirZh, `${baseName}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2), "utf8");
  fs.writeFileSync(mdPathEn, buildMarkdownEn(summary), "utf8");
  fs.writeFileSync(mdPathZh, buildMarkdownZh(summary), "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        globalStatus,
        mobileStatus: summary.mobile.gate.status,
        desktopStatus: summary.desktop.gate.status,
        mobileLatest: summary.mobile.latest,
        desktopLatest: summary.desktop.latest,
        trendJson: path.relative(repoRoot, jsonPath),
        trendReportEn: path.relative(repoRoot, mdPathEn),
        trendReportZh: path.relative(repoRoot, mdPathZh),
      },
      null,
      2
    )
  );

  if (globalStatus !== "PASS") {
    process.exitCode = 2;
  }
}

main();
