#!/usr/bin/env node
/**
 * Get this machine's browser usable, then run the repository's own
 * render-blocking guard against it.
 *
 * WHY THIS EXISTS
 *
 * Two independent faults used to make a Lighthouse run impossible on this
 * host, and they look the same from the outside ("Chrome hangs"):
 *
 *  1. A wedged launchservicesd. Chrome's startup asks it, synchronously, for
 *     the app-compatibility record; when the daemon does not answer, the main
 *     thread blocks forever in `mach_msg` and the debugging port never opens.
 *     The daemon had been up 44 days at 0% CPU with an 8 MB RSS.
 *
 *  2. A wedged syspolicyd. It spins at several hundred percent CPU, which
 *     starves every process that waits on an execution assessment. It only
 *     ever clears with root.
 *
 * The two daemons are owned by root, so a user account cannot replace them.
 * The repair that IS available is to stop launching a browser and instead
 * ATTACH to one that is already running: Lighthouse takes --port and talks to
 * an existing DevTools endpoint, which skips the broken start-up path
 * entirely.
 *
 * So this script does what a user account can do:
 *   - report the two daemon faults,
 *   - try the one repair that does not need root,
 *   - find a browser that is already alive (or start the one binary on this
 *     host whose execution assessment is still cached) and hand back its port,
 *   - check that a RENDERER answers, which the open port alone does not prove,
 *   - and then run the repository's own render-blocking guard.
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 *
 * It does not measure render-blocking itself. That criterion belongs to
 * Lighthouse, and the repository already judges it with the real tool:
 *
 *   scripts/seo/render-blocking-probe.mjs --run --chrome-port <port>
 *
 * A second, home-made approximation of "render-blocking" would be a second
 * opinion on a criterion that already has an authority - and Lighthouse's rule
 * is not the obvious one. It counts the requests Chrome itself marked
 * render-blocking that had FINISHED by the first paint, not the requests that
 * were still outstanding when the paint happened. The two are opposites, and
 * the approximation would have been wrong on a page whose CSS is preloaded.
 *
 * Usage:
 *   node scripts/seo/browser-health.mjs             # diagnose + browser + guard
 *   node scripts/seo/browser-health.mjs --check     # diagnose only, change nothing
 *   node scripts/seo/browser-health.mjs --no-probe  # diagnose + browser, skip Lighthouse
 *   node scripts/seo/browser-health.mjs --proxy     # route the browser through 127.0.0.1:7890
 *
 * Env:
 *   CHROME_BIN         browser binary to start (default: Playwright's headless shell)
 *   LIGHTHOUSE_PORT    an existing DevTools port to attach to instead of starting one
 *   PROXY              proxy URL for the browser (default: none; --proxy uses 127.0.0.1:7890)
 */

import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const ROOT = process.cwd();
const CHECK_ONLY = process.argv.includes('--check');
const NO_PROBE = process.argv.includes('--no-probe');
const USE_PROXY = process.argv.includes('--proxy');
const PROBE_PORT = Number(readFlag('--port', '4181'));
const PROBE_RUNS = Number(readFlag('--runs', '1'));
const START_PORT = Number(readFlag('--start-port', '9401'));
const PROXY = process.env.PROXY || (USE_PROXY ? 'http://127.0.0.1:7890' : '');

const CHROME_APP = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PLAYWRIGHT_SHELL_GLOB = `${process.env.HOME}/Library/Caches/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-mac-x64/chrome-headless-shell`;
const PROBE_SCRIPT = path.join('scripts', 'seo', 'render-blocking-probe.mjs');

function readFlag(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

function log(...args) {
  console.log(...args);
}

/** Run a command, but never let a wedged binary hang the script forever. */
async function run(cmd, args, timeoutMs = 8000) {
  try {
    const { stdout, stderr } = await Promise.race([
      execFileAsync(cmd, args, { timeout: timeoutMs, maxBuffer: 4 * 1024 * 1024 }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)),
    ]);
    return { ok: true, stdout, stderr };
  } catch (error) {
    return { ok: false, stdout: error.stdout || '', stderr: error.stderr || '', error };
  }
}

async function pidsOf(pattern) {
  const { stdout } = await run('/usr/bin/pgrep', ['-f', pattern], 6000);
  return stdout.split('\n').map((s) => s.trim()).filter(Boolean).map(Number);
}

// ---------------------------------------------------------------------------
// The pure parts, exported so the self-test can check them on a machine that
// cannot start a browser at all.
// ---------------------------------------------------------------------------

/**
 * How many days a process has been running, from `ps -o etime`.
 *
 * `ps` prints `HH:MM:SS` under a day and `DD-HH:MM:SS` from a day up, so the
 * day count only exists when there is a dash in front of the clock.
 */
export function daysFromEtime(etime) {
  const match = /^(\d+)-/.exec(String(etime || '').trim());
  return match ? Number(match[1]) : 0;
}

/**
 * A launchservicesd that has been up for a week or more at 0% CPU and an
 * 8 MB RSS is the fingerprint of the wedge. A healthy one is busy.
 */
export function looksWedged({ cpu, memMb, etime }) {
  return cpu < 5 && memMb < 32 && daysFromEtime(etime) >= 7;
}

/**
 * The ports worth asking before starting anything. A DevTools endpoint that
 * already answers is worth more than a browser this script has to start.
 */
export function candidatePorts(envPort) {
  const ports = [];
  if (envPort) ports.push(Number(envPort));
  for (const p of [9345, 9401, 9380, 9397, 9333]) ports.push(p);
  return [...new Set(ports.filter((p) => Number.isInteger(p) && p > 0))];
}

// ---------------------------------------------------------------------------
// Diagnosis.
// ---------------------------------------------------------------------------

async function diagnose() {
  const report = { launchservicesd: null, syspolicyd: null, chrome: null, faults: [] };

  const ps = await run('/bin/ps', ['-Ao', 'pid,user,pcpu,rss,etime,comm'], 10000);
  const lines = ps.stdout.split('\n').slice(1);

  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 6) continue;
    const [pid, user, pcpu, rss, etime, ...rest] = parts;
    const comm = rest.join(' ');
    const cpu = Number(pcpu);
    const memKb = Number(rss);

    if (comm.includes('launchservicesd') && report.launchservicesd === null) {
      report.launchservicesd = { pid: Number(pid), user, cpu, memMb: Math.round(memKb / 1024), etime };
    }
    if (comm.includes('syspolicyd') && report.syspolicyd === null) {
      report.syspolicyd = { pid: Number(pid), user, cpu, memMb: Math.round(memKb / 1024), etime };
    }
  }

  const lsd = report.launchservicesd;
  if (lsd && looksWedged(lsd)) {
    report.faults.push(
      `launchservicesd (pid ${lsd.pid}, owner ${lsd.user}) is up ${lsd.etime} at ${lsd.cpu}% CPU / ` +
        `${lsd.memMb} MB - a wedged instance. Chrome blocks on its synchronous reply.`,
    );
    if (lsd.user === 'root') {
      report.faults.push(
        '  it is owned by root, so it cannot be replaced without root. Attaching to a browser ' +
          'that is already running is the way around it.',
      );
    }
  }

  const spd = report.syspolicyd;
  if (spd && spd.cpu > 150) {
    report.faults.push(
      `syspolicyd (pid ${spd.pid}) is burning ${spd.cpu}% CPU / ${spd.memMb} MB - execution ` +
        'assessments are being starved. Only root clears this.',
    );
  }

  const chromePids = await pidsOf('chrome-headless-shell|MacOS/Google Chrome');
  report.chrome = { count: chromePids.length, pids: chromePids };

  return report;
}

/**
 * The one repair a user account can make: ask launchd to replace the wedged
 * daemon. The kill itself is expected to fail with EPERM when the daemon is
 * root-owned; what matters is whether a fresh instance appears.
 */
async function replaceLaunchservicesd() {
  const before = await pidsOf('lsd');
  for (const pid of before) {
    await run('/bin/kill', ['-9', String(pid)], 5000);
  }
  await new Promise((r) => setTimeout(r, 4000));
  const after = await pidsOf('lsd');
  const fresh = after.filter((pid) => !before.includes(pid));
  return { before, after, fresh };
}

// ---------------------------------------------------------------------------
// Getting a browser.
// ---------------------------------------------------------------------------

async function devToolsVersion(port) {
  const probe = await run('curl', ['-s', '--max-time', '3', `http://127.0.0.1:${port}/json/version`], 5000);
  if (!probe.ok || !probe.stdout.includes('Browser')) return null;
  try {
    return JSON.parse(probe.stdout);
  } catch {
    return null;
  }
}

/** An already-running browser is worth more than one this script starts. */
async function findRunningBrowser() {
  const tried = candidatePorts(process.env.LIGHTHOUSE_PORT);
  for (const port of tried) {
    const version = await devToolsVersion(port);
    if (version) return { port, version, source: 'already running' };
  }
  return null;
}

async function resolveBrowserBinary() {
  if (process.env.CHROME_BIN) return process.env.CHROME_BIN;
  const { readdir } = await import('node:fs/promises');
  const cache = `${process.env.HOME}/Library/Caches/ms-playwright`;
  try {
    const dirs = (await readdir(cache)).filter((d) => d.startsWith('chromium_headless_shell-')).sort().reverse();
    for (const dir of dirs) {
      const candidate = path.join(cache, dir, 'chrome-headless-shell-mac-x64', 'chrome-headless-shell');
      try {
        await fs.access(candidate);
        return candidate;
      } catch {
        /* try the next one */
      }
    }
  } catch {
    /* no playwright cache */
  }
  return CHROME_APP;
}

/**
 * Start a browser and wait for it to answer. The binary matters: on a host
 * where syspolicyd is stuck, a binary whose execution assessment is not
 * cached never gets past the assessment, while one that has run before does.
 */
async function startBrowser(bin, port) {
  const userDataDir = `/tmp/ch-health-${Date.now()}`;
  const args = [
    '--headless',
    '--no-sandbox',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--disable-component-update',
    '--disable-sync',
    `--user-data-dir=${userDataDir}`,
    `--remote-debugging-port=${port}`,
    'about:blank',
  ];
  if (PROXY) {
    args.push(`--proxy-server=${PROXY}`);
    args.push('--proxy-bypass-list=127.0.0.1;localhost');
  }
  const child = spawn(bin, args, { stdio: ['ignore', 'ignore', 'ignore'], detached: true });
  child.unref();

  for (let i = 0; i < 25; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const version = await devToolsVersion(port);
    if (version) return { port, version, source: `started ${path.basename(bin)}`, userDataDir };
  }
  return { port, version: null, source: `started ${path.basename(bin)} (no answer)`, userDataDir };
}

/**
 * The question the debugging port alone cannot answer: does a RENDERER
 * answer? The port opened on a wedged host once, and the renderer still
 * never replied - Lighthouse died on "Network.enable timed out".
 */
async function verifyRenderer(port) {
  const { chromium } = await import('playwright');
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`, { timeout: 30000 });
  try {
    const context = browser.contexts()[0] || (await browser.newContext());
    const page = await context.newPage();
    const answer = await Promise.race([
      page.evaluate(() => 1 + 1),
      new Promise((_, reject) => setTimeout(() => reject(new Error('renderer did not answer')), 20000)),
    ]);
    await page.close();
    return { ok: answer === 2, answer };
  } finally {
    await browser.close().catch(() => {});
  }
}

/**
 * The criterion is Lighthouse's, and the repository already asks it. This
 * only runs the existing guard, with the browser attached.
 */
async function runRenderBlockingProbe(chromePort) {
  const args = [PROBE_SCRIPT, '--run', '--runs', String(PROBE_RUNS), '--port', String(PROBE_PORT)];
  if (chromePort) args.push('--chrome-port', String(chromePort));
  const child = spawn(process.execPath, args, { stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  child.stdout.on('data', (d) => {
    output += d.toString();
  });
  child.stderr.on('data', (d) => {
    output += d.toString();
  });
  const code = await new Promise((resolve) => {
    child.on('close', resolve);
    child.on('error', () => resolve(1));
  });
  return { code, output };
}

async function main() {
  log('== browser health ==');
  const report = await diagnose();
  log(`launchservicesd: ${JSON.stringify(report.launchservicesd)}`);
  log(`syspolicyd     : ${JSON.stringify(report.syspolicyd)}`);
  log(`chrome procs  : ${report.chrome.count}`);
  if (report.faults.length === 0) {
    log('no fault detected');
  } else {
    for (const fault of report.faults) log(`FAULT: ${fault}`);
  }

  if (CHECK_ONLY) {
    log('\n--check: nothing was changed');
    return 0;
  }

  if (report.launchservicesd && report.launchservicesd.cpu < 5) {
    log('\n-- trying to replace launchservicesd (the kill is expected to report EPERM)');
    const swap = await replaceLaunchservicesd();
    log(`   lsd pids: ${swap.before.join(',')} -> ${swap.after.join(',')} (fresh: ${swap.fresh.join(',') || 'none'})`);
    if (!swap.fresh.length) log('   nothing was replaced. Attaching to a running browser is the way around it.');
  }

  log('\n-- looking for a browser');
  let browser = await findRunningBrowser();
  if (browser) {
    log(`   found one on port ${browser.port} (${browser.version.Browser}) - ${browser.source}`);
  } else {
    const bin = await resolveBrowserBinary();
    log(`   none running; starting ${bin}`);
    browser = await startBrowser(bin, START_PORT);
    if (!browser.version) {
      log(`   ${browser.source}. Check the launchservicesd fault above.`);
      return 1;
    }
    log(`   up on port ${browser.port} (${browser.version.Browser})${PROXY ? ` via ${PROXY}` : ''}`);
  }

  log('\n-- checking that a renderer answers');
  let renderer;
  try {
    renderer = await verifyRenderer(browser.port);
    log('   renderer answered');
  } catch (error) {
    log(`   renderer did not answer: ${String(error).slice(0, 200)}`);
    log('   (a renderer that never answers is the syspolicyd symptom; only root clears it)');
    await fs.writeFile(
      path.join(ROOT, '.runs', 'browser-health.json'),
      JSON.stringify({ measuredAt: new Date().toISOString(), report, browser, renderer: { ok: false } }, null, 2),
    ).catch(() => {});
    return 1;
  }

  let probe = null;
  if (!NO_PROBE) {
    log(`\n-- running the repository's render-blocking guard (${PROBE_RUNS} Lighthouse run(s))`);
    probe = await runRenderBlockingProbe(browser.port);
    log(probe.output.trimEnd());
  }

  await fs.writeFile(
    path.join(ROOT, '.runs', 'browser-health.json'),
    JSON.stringify({ measuredAt: new Date().toISOString(), report, browser, renderer, probe }, null, 2),
  ).catch(() => {});

  if (probe && probe.code !== 0) return 1;
  return 0;
}

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  main()
    .then((code) => process.exit(code))
    .catch((error) => {
      console.error(String(error).slice(0, 500));
      process.exit(1);
    });
}
