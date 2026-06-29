#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

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

function safeMetric(audits, key) {
  const v = audits?.[key]?.numericValue;
  return Number.isFinite(v) ? v : null;
}

function safeMetricAny(audits, keys) {
  for (const key of keys) {
    const value = safeMetric(audits, key);
    if (value != null) return value;
  }
  return null;
}

function average(values) {
  const valid = values.filter((v) => Number.isFinite(v));
  if (valid.length === 0) return null;
  return valid.reduce((acc, v) => acc + v, 0) / valid.length;
}

function percentile(values, p) {
  const valid = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  if (valid.length === 0) return null;
  const idx = Math.min(valid.length - 1, Math.max(0, Math.ceil((p / 100) * valid.length) - 1));
  return valid[idx];
}

function ms(v) {
  return v == null ? "n/a" : `${v.toFixed(0)} ms`;
}

function sec(v) {
  return v == null ? "n/a" : `${(v / 1000).toFixed(2)} s`;
}

function cls(v) {
  return v == null ? "n/a" : v.toFixed(3);
}

function perfScore(score) {
  return score == null ? "n/a" : String(Math.round(score * 100));
}

function formatRunMetric(value, formatter) {
  return value == null ? "n/a" : formatter(value);
}

function isQuotaError(error) {
  const msg = (error?.message || "").toLowerCase();
  return msg.includes("429") || msg.includes("quota") || msg.includes("queries per day");
}

async function requestPageSpeed(url, strategy) {
  const endpoint = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  endpoint.searchParams.set("url", url);
  endpoint.searchParams.set("strategy", strategy);
  endpoint.searchParams.set("category", "performance");

  const response = await fetch(endpoint.toString(), {
    headers: {
      "User-Agent": "kidsmobi-web-vitals-sampler/1.0",
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`PageSpeed API request failed (${response.status}): ${body.slice(0, 260)}`);
  }

  return response.json();
}

function runLocalLighthouse(url, strategy) {
  const preset = strategy === "desktop" ? "desktop" : "perf";
  const outputPath = path.join(os.tmpdir(), `kidsmobi-lh-${Date.now()}-${Math.random().toString(16).slice(2)}.json`);

  const args = [
    "--yes",
    "lighthouse",
    url,
    `--preset=${preset}`,
    "--only-categories=performance",
    "--output=json",
    `--output-path=${outputPath}`,
    "--quiet",
    "--chrome-flags=--headless --no-sandbox --disable-dev-shm-usage",
  ];

  const proc = spawnSync("npx", args, {
    encoding: "utf8",
    stdio: "pipe",
  });

  if (proc.status !== 0) {
    const err = (proc.stderr || proc.stdout || "lighthouse failed").slice(0, 400);
    throw new Error(`Local Lighthouse failed: ${err}`);
  }

  const raw = fs.readFileSync(outputPath, "utf8");
  fs.rmSync(outputPath, { force: true });
  return JSON.parse(raw);
}

function buildMarkdown(report) {
  const lines = [];
  lines.push("# Web Vitals Baseline Report");
  lines.push("");
  lines.push(`- URL: ${report.url}`);
  lines.push(`- Strategy: ${report.strategy}`);
  lines.push(`- Provider: ${report.providerUsed}`);
  lines.push(`- Runs: ${report.runs}`);
  lines.push(`- Timestamp: ${report.generatedAt}`);
  lines.push("");
  lines.push("## Aggregated Lighthouse Metrics");
  lines.push("");
  lines.push("| Metric | Avg | P75 | Unit |");
  lines.push("|---|---:|---:|---|");
  lines.push(`| CLS | ${cls(report.aggregate.cls.avg)} | ${cls(report.aggregate.cls.p75)} | score |`);
  lines.push(`| LCP | ${sec(report.aggregate.lcp.avg)} | ${sec(report.aggregate.lcp.p75)} | seconds |`);
  lines.push(`| INP | ${ms(report.aggregate.inp.avg)} | ${ms(report.aggregate.inp.p75)} | ms |`);
  lines.push(`| FCP | ${sec(report.aggregate.fcp.avg)} | ${sec(report.aggregate.fcp.p75)} | seconds |`);
  lines.push(`| TTFB | ${sec(report.aggregate.ttfb.avg)} | ${sec(report.aggregate.ttfb.p75)} | seconds |`);
  lines.push("");
  lines.push("## Run Details");
  lines.push("");
  lines.push("| Run | CLS | LCP(s) | INP(ms) | FCP(s) | TTFB(s) | Perf Score |");
  lines.push("|---:|---:|---:|---:|---:|---:|---:|");
  report.samples.forEach((s, idx) => {
    lines.push(
      `| ${idx + 1} | ${cls(s.metrics.cls)} | ${formatRunMetric(s.metrics.lcp, (v) => (v / 1000).toFixed(2))} | ${formatRunMetric(s.metrics.inp, (v) => v.toFixed(0))} | ${formatRunMetric(s.metrics.fcp, (v) => (v / 1000).toFixed(2))} | ${formatRunMetric(s.metrics.ttfb, (v) => (v / 1000).toFixed(2))} | ${perfScore(s.performanceScore)} |`
    );
  });
  lines.push("");
  lines.push("## CrUX Field Data Snapshot");
  lines.push("");
  if (report.crux) {
    lines.push(`- Origin: ${report.crux.origin || "n/a"}`);
    lines.push(`- LCP p75: ${report.crux.lcpP75 ?? "n/a"}`);
    lines.push(`- INP p75: ${report.crux.inpP75 ?? "n/a"}`);
    lines.push(`- CLS p75: ${report.crux.clsP75 ?? "n/a"}`);
  } else {
    lines.push("- No CrUX field data returned by API for this run.");
  }
  lines.push("");
  lines.push("## Notes");
  lines.push("");
  lines.push("- Lighthouse API values can vary per run due to network/device simulation variance.");
  lines.push("- Use trend comparisons across multiple timestamps for release decisions.");
  return lines.join("\n");
}

function buildMarkdownZh(report) {
  const lines = [];
  lines.push("# Web Vitals 基线报告");
  lines.push("");
  lines.push(`- 站点: ${report.url}`);
  lines.push(`- 策略: ${report.strategy}`);
  lines.push(`- 采样来源: ${report.providerUsed}`);
  lines.push(`- 采样次数: ${report.runs}`);
  lines.push(`- 时间: ${report.generatedAt}`);
  lines.push("");
  lines.push("## Lighthouse 聚合指标");
  lines.push("");
  lines.push("| 指标 | 平均值 | P75 | 单位 |");
  lines.push("|---|---:|---:|---|");
  lines.push(`| CLS | ${cls(report.aggregate.cls.avg)} | ${cls(report.aggregate.cls.p75)} | 分数 |`);
  lines.push(`| LCP | ${sec(report.aggregate.lcp.avg)} | ${sec(report.aggregate.lcp.p75)} | 秒 |`);
  lines.push(`| INP | ${ms(report.aggregate.inp.avg)} | ${ms(report.aggregate.inp.p75)} | 毫秒 |`);
  lines.push(`| FCP | ${sec(report.aggregate.fcp.avg)} | ${sec(report.aggregate.fcp.p75)} | 秒 |`);
  lines.push(`| TTFB | ${sec(report.aggregate.ttfb.avg)} | ${sec(report.aggregate.ttfb.p75)} | 秒 |`);
  lines.push("");
  lines.push("## 分轮明细");
  lines.push("");
  lines.push("| 轮次 | CLS | LCP(s) | INP(ms) | FCP(s) | TTFB(s) | 性能分 |");
  lines.push("|---:|---:|---:|---:|---:|---:|---:|");
  report.samples.forEach((s, idx) => {
    lines.push(
      `| ${idx + 1} | ${cls(s.metrics.cls)} | ${formatRunMetric(s.metrics.lcp, (v) => (v / 1000).toFixed(2))} | ${formatRunMetric(s.metrics.inp, (v) => v.toFixed(0))} | ${formatRunMetric(s.metrics.fcp, (v) => (v / 1000).toFixed(2))} | ${formatRunMetric(s.metrics.ttfb, (v) => (v / 1000).toFixed(2))} | ${perfScore(s.performanceScore)} |`
    );
  });
  lines.push("");
  lines.push("## CrUX 现场数据快照");
  lines.push("");
  if (report.crux) {
    lines.push(`- 域名: ${report.crux.origin || "n/a"}`);
    lines.push(`- LCP p75: ${report.crux.lcpP75 ?? "n/a"}`);
    lines.push(`- INP p75: ${report.crux.inpP75 ?? "n/a"}`);
    lines.push(`- CLS p75: ${report.crux.clsP75 ?? "n/a"}`);
  } else {
    lines.push("- 本次未返回 CrUX 现场数据。");
  }
  lines.push("");
  lines.push("## 说明");
  lines.push("");
  lines.push("- Lighthouse 结果受网络与模拟条件影响，单轮结果会波动。");
  lines.push("- 建议按时间序列比较趋势，用于发布门禁判断。");
  return lines.join("\n");
}

async function main() {
  const url = parseArg("url", "https://kidsmobi.pages.dev");
  const strategy = parseArg("strategy", "mobile");
  const providerMode = parseArg("provider", "auto");
  const runs = Math.max(1, toNumber(parseArg("runs", "3"), 3));

  const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");
  const reportDir = path.join(repoRoot, "resource", "assets", "reports");
  const reportDirEn = path.join(reportDir, "en");
  const reportDirZh = path.join(reportDir, "zh");
  fs.mkdirSync(reportDir, { recursive: true });
  fs.mkdirSync(reportDirEn, { recursive: true });
  fs.mkdirSync(reportDirZh, { recursive: true });

  const samples = [];
  let providerUsed = providerMode === "auto" ? "pagespeed" : providerMode;
  for (let i = 0; i < runs; i += 1) {
    let data;
    let audits;
    let runProvider = providerUsed;

    if (providerMode === "local") {
      data = runLocalLighthouse(url, strategy);
      audits = data?.audits || {};
      runProvider = "local-lighthouse";
      providerUsed = "local-lighthouse";
    } else {
      try {
        data = await requestPageSpeed(url, strategy);
        audits = data?.lighthouseResult?.audits || {};
        runProvider = "pagespeed";
        providerUsed = "pagespeed";
      } catch (error) {
        if (providerMode === "pagespeed" || !isQuotaError(error)) {
          throw error;
        }
        data = runLocalLighthouse(url, strategy);
        audits = data?.audits || {};
        runProvider = "local-lighthouse";
        providerUsed = "local-lighthouse";
      }
    }

    const sample = {
      run: i + 1,
      fetchedAt: new Date().toISOString(),
      provider: runProvider,
      performanceScore:
        data?.lighthouseResult?.categories?.performance?.score ??
        data?.categories?.performance?.score ??
        null,
      metrics: {
        cls: safeMetricAny(audits, ["cumulative-layout-shift"]),
        lcp: safeMetricAny(audits, ["largest-contentful-paint"]),
        inp: safeMetricAny(audits, ["interaction-to-next-paint", "experimental-interaction-to-next-paint"]),
        fcp: safeMetricAny(audits, ["first-contentful-paint"]),
        ttfb: safeMetricAny(audits, ["server-response-time"]),
      },
      crux: data?.loadingExperience || null,
      originLoadingExperience: data?.originLoadingExperience || null,
    };

    samples.push(sample);
  }

  const metricArrays = {
    cls: samples.map((s) => s.metrics.cls),
    lcp: samples.map((s) => s.metrics.lcp),
    inp: samples.map((s) => s.metrics.inp),
    fcp: samples.map((s) => s.metrics.fcp),
    ttfb: samples.map((s) => s.metrics.ttfb),
  };

  const firstCrux = samples[0]?.originLoadingExperience || null;
  const originMetrics = firstCrux?.metrics || null;

  const report = {
    generatedAt: new Date().toISOString(),
    url,
    strategy,
    providerMode,
    providerUsed,
    runs,
    aggregate: {
      cls: { avg: average(metricArrays.cls), p75: percentile(metricArrays.cls, 75) },
      lcp: { avg: average(metricArrays.lcp), p75: percentile(metricArrays.lcp, 75) },
      inp: { avg: average(metricArrays.inp), p75: percentile(metricArrays.inp, 75) },
      fcp: { avg: average(metricArrays.fcp), p75: percentile(metricArrays.fcp, 75) },
      ttfb: { avg: average(metricArrays.ttfb), p75: percentile(metricArrays.ttfb, 75) },
    },
    crux: originMetrics
      ? {
          origin: firstCrux?.id || null,
          lcpP75: originMetrics.LARGEST_CONTENTFUL_PAINT_MS?.percentile ?? null,
          inpP75: originMetrics.INTERACTION_TO_NEXT_PAINT?.percentile ?? null,
          clsP75: originMetrics.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile ?? null,
        }
      : null,
    samples,
  };

  const stamp = formatDate(new Date());
  const baseName = `web-vitals-${strategy}-${stamp}`;
  const jsonPath = path.join(reportDir, `${baseName}.json`);
  const mdPathEn = path.join(reportDirEn, `${baseName}.md`);
  const mdPathZh = path.join(reportDirZh, `${baseName}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), "utf8");
  fs.writeFileSync(mdPathEn, buildMarkdown(report), "utf8");
  fs.writeFileSync(mdPathZh, buildMarkdownZh(report), "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        url,
        strategy,
        runs,
        providerMode,
        providerUsed,
        aggregate: report.aggregate,
        jsonReport: path.relative(repoRoot, jsonPath),
        markdownReportEn: path.relative(repoRoot, mdPathEn),
        markdownReportZh: path.relative(repoRoot, mdPathZh),
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: error?.message || String(error),
      },
      null,
      2
    )
  );
  process.exit(1);
});
