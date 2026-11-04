// Render-blocking probe: does anything in the document head hold up the first
// paint, and what does Lighthouse itself say about it?
//
// There are two ways to be wrong here, and this probe exists to catch both.
//
// 1. The STATED case. The static pages used to load the Tailwind bundle as a
//    plain <link rel="stylesheet">, and the bundle used to @import the Google
//    Fonts stylesheet, so the head carried a two-hop third-party chain
//    (bundle -> fonts.googleapis.com -> fonts.gstatic.com). Lighthouse
//    measured 2,240 ms of estimated savings on that chain alone.
//
// 2. The HIDDEN case. Fixing the markup does not prove the browser agrees.
//    A stylesheet that is still fetched in the critical path, a script that
//    lost its defer/module, a font swap that lands late - those are all
//    invisible to a static scan and visible only to a real trace.
//
// So the check is deliberately two-layered:
//   - the static layer lives in scripts/check-critical-css.mjs: no prerendered
//     page may ship a blocking <link rel="stylesheet">, and the inlined
//     critical CSS must not drift from src/index.css;
//   - this probe is the DYNAMIC layer: it reads Lighthouse's own
//     "render-blocking" audit and fails if that audit reports anything.
//
// Usage:
//   node scripts/seo/render-blocking-probe.mjs --report <lighthouse.json> [...]
//   node scripts/seo/render-blocking-probe.mjs --run [--runs 3] [--port 4181]
//   node scripts/seo/render-blocking-probe.mjs --self-test
//
// Env:
//   LIGHTHOUSE_BIN  path to lighthouse's cli/index.js (or the npm bin)
//   CHROME_PATH     path to a Chromium/Chrome binary
//
// Exit codes:
//   0  no render-blocking resource (or a clean SKIP: nothing to run against)
//   1  a render-blocking resource was reported
//
// A SKIP is exit 0 because the weekly audit must not fail because a browser
// or Lighthouse happens to be missing - but the SKIP line is printed loudly
// and the run is recorded as "skipped", never as "passed".

import { spawn } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const SELF_TEST = process.argv.includes('--self-test');
const REPORT_ONLY = process.argv.includes('--report');
const RUN = process.argv.includes('--run');

// ---------------------------------------------------------------------------
// The audit keys, across Lighthouse versions.
//
// Lighthouse 13 renamed "render-blocking-resources" to "render-blocking-insight"
// and turned it into an insight: same question, new name and a new shape.
// Older reports still carry the old key, so both are read.
// ---------------------------------------------------------------------------
const AUDIT_KEYS = ['render-blocking-insight', 'render-blocking-resources'];

function findRenderBlockingAudit(report) {
  const audits = (report && report.audits) || {};
  for (const key of AUDIT_KEYS) {
    if (audits[key]) return { key, audit: audits[key] };
  }
  return null;
}

// Lighthouse reports the blocking resources as a list of items. Different
// versions name the fields differently, so every known spelling is read.
function blockingItems(audit) {
  const details = audit && audit.details;
  const items = details && Array.isArray(details.items) ? details.items : [];
  return items
    .map((item) => ({
      url: item.url || item.entity || item.source || '(unknown url)',
      wastedMs: Number(item.wastedMs || item.wastedBytes || 0) || 0,
      totalBytes: Number(item.totalBytes || item.transferSize || 0) || 0,
      durationMs: Number(item.duration || 0) || 0,
    }))
    .filter((item) => item.url !== '(unknown url)' || item.totalBytes > 0);
}

function metricMs(report, key) {
  const audit = ((report || {}).audits || {})[key];
  return audit && typeof audit.numericValue === 'number' ? audit.numericValue : null;
}

// ---------------------------------------------------------------------------
// The assertion.
// ---------------------------------------------------------------------------
export function judge(report) {
  const found = findRenderBlockingAudit(report);
  if (!found) {
    return {
      status: 'unknown',
      reason: `neither "${AUDIT_KEYS[0]}" nor "${AUDIT_KEYS[1]}" is in this report`,
      items: [],
    };
  }
  const items = blockingItems(found.audit);
  const score = found.audit.score;
  // A "not applicable" audit means Lighthouse looked and found nothing to
  // report - that is a pass, not an unknown.
  if (found.audit.scoreDisplayMode === 'notApplicable' && items.length === 0) {
    return { status: 'pass', key: found.key, items: [], reason: 'audit is not applicable' };
  }
  if (items.length > 0) {
    return { status: 'fail', key: found.key, items, reason: `${items.length} blocking resource(s)` };
  }
  // No items but a zero score: Lighthouse scored the audit 0 without listing
  // what it found. That is not a pass - it is a report we cannot read.
  if (score === 0) {
    return { status: 'unknown', key: found.key, items: [], reason: 'audit scored 0 but listed no resource' };
  }
  return { status: 'pass', key: found.key, items: [], reason: 'no render-blocking resource reported' };
}

function summarizeMetrics(report) {
  return {
    fcp: metricMs(report, 'first-contentful-paint'),
    lcp: metricMs(report, 'largest-contentful-paint'),
    tbt: metricMs(report, 'total-blocking-time'),
    cls: metricMs(report, 'cumulative-layout-shift'),
  };
}

// ---------------------------------------------------------------------------
// Locating Lighthouse.
// ---------------------------------------------------------------------------
function lighthouseEntry() {
  if (process.env.LIGHTHOUSE_BIN && existsSync(process.env.LIGHTHOUSE_BIN)) {
    return process.env.LIGHTHOUSE_BIN;
  }
  const local = path.resolve('node_modules/lighthouse/cli/index.js');
  if (existsSync(local)) return local;

  // npx keeps one copy per (package, version) pair under ~/.npm/_npx. The
  // highest version wins: Lighthouse 13 renamed the audit, and the rename is
  // the whole reason this probe reads two keys.
  const npxRoot = path.join(process.env.HOME || '', '.npm', '_npx');
  if (existsSync(npxRoot)) {
    const found = [];
    for (const dir of readdirSync(npxRoot)) {
      const cli = path.join(npxRoot, dir, 'node_modules', 'lighthouse', 'cli', 'index.js');
      if (!existsSync(cli)) continue;
      const pkg = path.join(npxRoot, dir, 'node_modules', 'lighthouse', 'package.json');
      let version = '0.0.0';
      try {
        version = JSON.parse(readFileSync(pkg, 'utf8')).version || version;
      } catch {
        /* keep the fallback */
      }
      found.push({ cli, version });
    }
    found.sort((a, b) => (a.version < b.version ? 1 : -1));
    if (found.length) return found[0].cli;
  }
  return null;
}

// ---------------------------------------------------------------------------
// The preview server: scripts/preview-dist.mjs mimics the Cloudflare Pages
// routing rules and proxies /api to the real store, which is what the live
// site does. Lighthouse has to see the same routing the crawler sees.
// ---------------------------------------------------------------------------
async function waitForServer(port, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) return true;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

function readArg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

async function runLighthouse({ entry, runs, port }) {
  const outDir = path.resolve('.runs/lh');
  mkdirSync(outDir, { recursive: true });

  const preview = spawn(process.execPath, [path.resolve('scripts/preview-dist.mjs'), String(port)], {
    stdio: 'ignore',
    detached: false,
  });
  try {
    if (!(await waitForServer(port))) {
      throw new Error(`preview server did not come up on ${port}`);
    }
    const reports = [];
    for (let i = 1; i <= runs; i += 1) {
      const out = path.join(outDir, `render-blocking-${i}.json`);
      const code = await new Promise((resolve) => {
        const child = spawn(
          process.execPath,
          [
            entry,
            `http://127.0.0.1:${port}/`,
            '--output=json',
            `--output-path=${out}`,
            '--quiet',
            '--chrome-flags=--headless=new --no-sandbox',
          ],
          { stdio: 'ignore' },
        );
        child.on('close', resolve);
        child.on('error', () => resolve(1));
      });
      if (code !== 0 || !existsSync(out)) {
        throw new Error(`lighthouse run ${i} failed (exit ${code})`);
      }
      reports.push(JSON.parse(readFileSync(out, 'utf8')));
      console.log(`  run ${i}/${runs} -> ${path.relative(process.cwd(), out)}`);
    }
    return reports;
  } finally {
    preview.kill('SIGTERM');
  }
}

// ---------------------------------------------------------------------------
// Self-test: the guard must have teeth. Two fixtures, one clean and one
// blocked, plus a report that carries no render-blocking audit at all.
// ---------------------------------------------------------------------------
function selfTest() {
  const clean = {
    audits: {
      'render-blocking-insight': {
        score: 1,
        scoreDisplayMode: 'numeric',
        details: { type: 'list', items: [] },
      },
    },
  };
  const blocked = {
    audits: {
      'render-blocking-insight': {
        score: 0,
        scoreDisplayMode: 'numeric',
        details: {
          type: 'list',
          items: [
            {
              url: 'https://fonts.googleapis.com/css2?family=Outfit',
              totalBytes: 186707,
              wastedMs: 2240,
            },
          ],
        },
      },
    },
  };
  const legacy = {
    audits: {
      'render-blocking-resources': {
        score: 0,
        details: {
          type: 'list',
          items: [{ url: '/assets/index.css', totalBytes: 149006, wastedMs: 1200 }],
        },
      },
    },
  };
  const empty = { audits: {} };

  const cases = [
    ['clean insight report passes', judge(clean), 'pass'],
    ['blocked insight report fails', judge(blocked), 'fail'],
    ['legacy audit key is still read', judge(legacy), 'fail'],
    ['report without the audit is unknown, not a pass', judge(empty), 'unknown'],
  ];
  let ok = true;
  for (const [name, got, want] of cases) {
    const good = got.status === want;
    if (!good) ok = false;
    console.log(`  ${good ? 'ok  ' : 'FAIL'} ${name} (got ${got.status}, want ${want})`);
  }
  const items = blockingItems(blocked.audits['render-blocking-insight']);
  const bytesOk = items.length === 1 && items[0].totalBytes === 186707 && items[0].wastedMs === 2240;
  if (!bytesOk) ok = false;
  console.log(`  ${bytesOk ? 'ok  ' : 'FAIL'} savings and byte counts are read off the items`);
  console.log(ok ? 'render-blocking-probe self-test PASS' : 'render-blocking-probe self-test FAIL');
  process.exit(ok ? 0 : 1);
}

// ---------------------------------------------------------------------------
// Main.
// ---------------------------------------------------------------------------
async function main() {
  if (SELF_TEST) return selfTest();

  const reports = [];

  if (RUN) {
    const entry = lighthouseEntry();
    if (!entry) {
      console.log('render-blocking-probe SKIP — no Lighthouse installation found.');
      console.log('  Set LIGHTHOUSE_BIN, or install lighthouse (npm i -g lighthouse).');
      process.exit(0);
    }
    const runs = Number(readArg('--runs', '3'));
    const port = Number(readArg('--port', '4181'));
    console.log(`render-blocking-probe — ${runs} Lighthouse run(s) against the local preview on :${port}`);
    try {
      reports.push(...(await runLighthouse({ entry, runs, port })));
    } catch (e) {
      console.log(`render-blocking-probe SKIP — Lighthouse could not run: ${String(e.message || e)}`);
      process.exit(0);
    }
  }

  if (!reports.length) {
    // --report mode: every --report value is one report.
    const values = [];
    process.argv.forEach((arg, i) => {
      if (arg === '--report' && process.argv[i + 1]) values.push(process.argv[i + 1]);
    });
    for (const file of values) {
      if (!existsSync(file)) {
        console.log(`render-blocking-probe FAIL — report not found: ${file}`);
        process.exit(1);
      }
      reports.push(JSON.parse(readFileSync(file, 'utf8')));
    }
  }

  if (!reports.length) {
    console.log('render-blocking-probe SKIP — nothing to check (pass --report or --run).');
    process.exit(0);
  }

  let failed = false;
  let unknown = false;
  reports.forEach((report, i) => {
    const verdict = judge(report);
    const metrics = summarizeMetrics(report);
    const label = report.finalUrl || report.requestedUrl || `report ${i + 1}`;
    const m = [];
    if (metrics.fcp != null) m.push(`FCP ${Math.round(metrics.fcp)}ms`);
    if (metrics.lcp != null) m.push(`LCP ${Math.round(metrics.lcp)}ms`);
    if (metrics.tbt != null) m.push(`TBT ${Math.round(metrics.tbt)}ms`);
    if (metrics.cls != null) m.push(`CLS ${metrics.cls.toFixed(3)}`);
    console.log(`${label}`);
    console.log(`  metrics: ${m.join('  ')}`);
    if (verdict.status === 'pass') {
      console.log('  render-blocking: PASS — no render-blocking resource reported');
    } else if (verdict.status === 'fail') {
      failed = true;
      console.log(`  render-blocking: FAIL — ${verdict.reason} (${verdict.key})`);
      for (const item of verdict.items) {
        console.log(`    ${item.url}  wasted ${Math.round(item.wastedMs)}ms  ${item.totalBytes} bytes`);
      }
    } else {
      unknown = true;
      console.log(`  render-blocking: UNKNOWN — ${verdict.reason}`);
    }
  });

  if (failed) process.exit(1);
  if (unknown) {
    console.log('render-blocking-probe SKIP — a report could not be read.');
    process.exit(0);
  }
  console.log('render-blocking-probe PASS');
}

main();
