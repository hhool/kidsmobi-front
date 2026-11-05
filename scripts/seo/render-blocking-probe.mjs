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
//   node scripts/seo/render-blocking-probe.mjs --run [--runs 3] [--port 4181] [--chrome-port 9345] [--host localtest.me]
//   node scripts/seo/render-blocking-probe.mjs --self-test
//
// --chrome-port makes Lighthouse attach to a browser that is already running
// instead of launching one. That is the only way to get a Lighthouse run on a
// host where launching a browser is broken - see scripts/seo/browser-health.mjs.
//
// --host is the hostname the preview is reached under. The default,
// localtest.me, resolves to 127.0.0.1 but is NOT "localhost", which is the
// point: the SPA decides between its local aggregator and the production data
// path from the hostname, so measuring under "localhost" measures a different
// object than the one the live site serves. See judgeFidelity().
//
// Env:
//   LIGHTHOUSE_BIN  path to lighthouse's cli/index.js (or the npm bin)
//   CHROME_PATH     path to a Chromium/Chrome binary
//   LIGHTHOUSE_PORT attach to this DevTools port instead of launching Chrome
//
// Exit codes:
//   0  no render-blocking resource (or a clean SKIP: nothing to run against)
//   1  a render-blocking resource was reported, or the run did not measure
//      the production object
//
// A SKIP is exit 0 because the weekly audit must not fail because a browser
// or Lighthouse happens to be missing - but the SKIP line is printed loudly
// and the run is recorded as "skipped", never as "passed".

import { spawn } from 'node:child_process';
import dns from 'node:dns/promises';
import { existsSync, readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

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
// Measurement fidelity.
//
// A local Lighthouse report is only evidence about the live site if the thing
// it measured IS the live site. Two things used to differ, and both pushed
// the local numbers in the wrong direction:
//
//   - The preview server served the raw bytes while the edge compresses
//     them. The entry JavaScript transferred 1,217,247 bytes locally against
//     319,270 in production.
//   - The SPA chose its data path from the hostname. Under "localhost" it
//     asked the local aggregator for /api/content/bundle, got a 404 from the
//     store, and fell back to a worker host this machine cannot reach. The
//     live site uses same-origin /api/v2/*. A report taken under the wrong
//     hostname therefore measured a page whose data never arrived.
//
// So the report itself is checked: the production data path has to be there,
// the unreachable fallback must not be, no request may have failed, and the
// text assets must have arrived compressed. A report that fails this is not
// evidence about the live site, and saying so is worth more than the number
// it carries.
// ---------------------------------------------------------------------------
export function networkItems(report) {
  const audit = ((report || {}).audits || {})['network-requests'];
  const items = audit && audit.details && Array.isArray(audit.details.items) ? audit.details.items : [];
  return items;
}

/**
 * The node the Largest Contentful Paint metric names.
 *
 * Lighthouse 13 reports it inside the `lcp-breakdown-insight` audit as a
 * `node` item; older reports carry it in `largest-contentful-paint-element`.
 * Both are read, and the first one that answers wins.
 */
/**
 * The phases of the Largest Contentful Paint, as Lighthouse reports them.
 *
 * The phase names matter: a report whose LCP element is an image carries
 * `resourceLoadDelay` and `resourceLoadDuration`; a report whose LCP element
 * is a paragraph of text carries neither, because a text block has no
 * resource to load.
 */
export function lcpPhases(report) {
  const audits = (report || {}).audits || {};
  const insight = audits['lcp-breakdown-insight'];
  const items = insight && insight.details && Array.isArray(insight.details.items) ? insight.details.items : [];
  const phases = {};
  for (const item of items) {
    if (!item || item.type !== 'table') continue;
    for (const row of Array.isArray(item.items) ? item.items : []) {
      if (row && row.subpart) phases[row.subpart] = Number(row.duration || 0);
    }
  }
  return phases;
}

export function lcpElementNode(report) {
  const audits = (report || {}).audits || {};
  const insight = audits['lcp-breakdown-insight'];
  const insightItems = insight && insight.details && Array.isArray(insight.details.items) ? insight.details.items : [];
  for (const item of insightItems) {
    if (item && item.type === 'node' && item.selector) {
      return { selector: item.selector, boundingRect: item.boundingRect || null, snippet: item.snippet || '' };
    }
  }
  const legacy = audits['largest-contentful-paint-element'];
  const legacyItems = legacy && legacy.details && Array.isArray(legacy.details.items) ? legacy.details.items : [];
  for (const item of legacyItems) {
    const node = item && item.node;
    if (node && node.selector) {
      return { selector: node.selector, boundingRect: node.boundingRect || null, snippet: node.snippet || '' };
    }
  }
  return null;
}

export function judgeFidelity(report, options = {}) {
  const items = networkItems(report);
  if (!items.length) {
    return {
      status: 'unknown',
      problems: ['the report carries no network-requests audit'],
      notes: [],
    };
  }
  // The rules are scoped by the OBJECT that was measured, not by how strict
  // the caller feels. A variant that is a document has no SPA to take the
  // production data path, and a variant whose hero is deliberately absent
  // has a text block as its largest paint. Both are different objects, not
  // worse measurements - and every rule still applies to the object it was
  // written for.
  const expectSpa = options.expectSpa !== false;
  const expectLcpImage = options.expectLcpImage !== false;
  const problems = [];
  const notes = [];

  // The report must have measured the build it is filed under. A leftover
  // preview server on the port answers with a DIFFERENT build, and every
  // number it produces is perfectly plausible - this was measured: four
  // rounds filed as the as-shipped control were in fact the no-fonts variant,
  // which reports LCP 829ms.
  //
  // The fingerprint is the document itself: its decoded size is the size of
  // the built index.html, so a report of another build cannot carry it. The
  // hashed entry bundle is checked too, because two variants patched from
  // one build share a bundle and differ only in the HTML.
  if (options.expectedDocumentSize) {
    const document =
      items.find((item) => (item.resourceType || '') === 'Document') ||
      items.find((item) => {
        const url = String(item.url || '');
        if (!/^https?:\/\/[^/]+\/(?:$|[?#])/.test(url)) return false;
        return !/\.(js|css|woff2?|png|jpe?g|webp|gif|svg|ico|json|xml)(\?|$)/i.test(url);
      });
    const served = document ? Number(document.resourceSize || 0) : 0;
    if (!served) {
      problems.push('the report carries no document request, so the build it measured cannot be identified');
    } else if (served !== options.expectedDocumentSize) {
      problems.push(
        `the report's document is ${served} bytes but it is filed as a build whose document is ` +
          `${options.expectedDocumentSize} bytes - it is a report of a different build`,
      );
    }
  }
  if (options.expectedEntry) {
    const served = items
      .map((item) => String(item.url || ''))
      .map((url) => (url.match(/assets\/index-[A-Za-z0-9_-]+\.js/) || [])[0])
      .filter(Boolean);
    const unique = [...new Set(served)];
    if (!unique.length) {
      problems.push('the report carries no entry bundle request, so the build it measured cannot be identified');
    } else if (!unique.includes(options.expectedEntry)) {
      problems.push(
        `the report measured ${unique.join(', ')} but it is filed as ${options.expectedEntry} - it is a ` +
          'report of a different build',
      );
    }
  }

  const productionPath = items.filter((item) => /\/api\/v2\//.test(String(item.url || '')));
  if (expectSpa && !productionPath.length) {
    problems.push('the SPA never called /api/v2/ - it did not take the production data path');
  }
  const unreachable = items.filter((item) => /workers\.dev/.test(String(item.url || '')));
  if (unreachable.length) {
    problems.push(`${unreachable.length} request(s) went to the unreachable workers.dev fallback`);
  }

  // A request that failed on the page's own origin means the page did not
  // receive what it was served - that is a different object. A third-party
  // failure is environment noise (this machine cannot reach some CDNs); it is
  // reported, but it does not make the page a different object.
  const finalUrl = report.finalUrl || report.requestedUrl || '';
  let origin = '';
  try {
    origin = new URL(finalUrl).origin;
  } catch {
    origin = '';
  }
  const originOf = (url) => {
    try {
      return new URL(String(url || '')).origin;
    } catch {
      return '';
    }
  };
  const failed = items.filter((item) => Number(item.statusCode) < 0);
  const failedOwn = failed.filter((item) => origin && originOf(item.url) === origin);
  const failedOther = failed.filter((item) => !(origin && originOf(item.url) === origin));
  if (failedOwn.length) {
    problems.push(
      `${failedOwn.length} request(s) failed on the page's own origin (${failedOwn[0].url})`,
    );
  }
  if (failedOther.length) {
    notes.push(
      `${failedOther.length} third-party request(s) failed in this environment (${failedOther[0].url.split('?')[0]})`,
    );
  }

  const uncompressed = items.filter((item) => {
    const url = String(item.url || '');
    if (!/\.(js|css|html|json)(\?|$)/.test(url)) return false;
    const resource = Number(item.resourceSize || 0);
    const transfer = Number(item.transferSize || 0);
    if (resource <= 50000) return false;
    return transfer / resource > 0.6;
  });
  for (const item of uncompressed) {
    problems.push(
      `${item.url} transferred ${item.transferSize} of ${item.resourceSize} bytes - compression is not on`,
    );
  }

  // The metric has to describe something the reader can still see. Two
  // measured ways this goes wrong, both of them produce a number that looks
  // excellent and means nothing:
  //
  //   - The LCP element is gone by the time the report is written. The
  //     first-paint cover is destroyed at the hand-over, so a candidate that
  //     came from inside it is measured at a 0x0 box - the metric names an
  //     element that is no longer on the page.
  //   - The LCP element is inside the cover in the first place, because the
  //     app behind it had not rendered when the trace ended. A page whose
  //     SPA never mounted reports the cover's paragraph as its largest
  //     paint, and an audit that reads the number calls that a pass.
  //
  // Both were measured on this site. A build with the third-party font
  // traffic removed closed the trace before the homepage rendered and
  // reported LCP 829 ms, while the real page painted its hero at 6,296 ms.
  // That report would have passed item 23.
  const lcpNode = lcpElementNode(report);
  if (lcpNode) {
    const rect = lcpNode.boundingRect || {};
    if (!rect.width || !rect.height) {
      problems.push(
        `the LCP element (${lcpNode.selector}) has a ${rect.width || 0}x${rect.height || 0} box - it is not on the page any more, so the metric describes nothing`,
      );
    }
    if (expectSpa && /bbt-first-paint-cover/.test(lcpNode.selector)) {
      problems.push(
        `the LCP element is inside the first-paint cover (${lcpNode.selector}) - the cover is transient and the app behind it had not rendered when the trace ended`,
      );
    }
  } else {
    // A report that carries the LCP breakdown but does not name the element
    // cannot be shown to describe the page that was measured. Two of the
    // false-green reports were caught exactly here: Lighthouse could not
    // name the element at all, because the trace closed before the homepage
    // had rendered. A report with no LCP breakdown at all is a different
    // matter - it simply does not carry the information.
    const audits = report.audits || {};
    if (audits['lcp-breakdown-insight'] || audits['largest-contentful-paint-element']) {
      problems.push(
        'the report does not name the LCP element, so it cannot be shown to describe the page that was measured',
      );
    }
  }

  // The LCP element must be an image, not a paragraph of text. On the
  // homepage the largest painted content is the hero's background
  // photograph, so a report whose LCP is a text block is a report whose
  // trace ended before the homepage had rendered - the same failure as
  // above, in the shape Lighthouse reports when it cannot name the element
  // at all.
  //
  // Every report of the real page carries both resource phases; the two
  // false-green reports do not carry either. A variant whose hero is
  // deliberately absent is a different object: there the largest paint IS
  // a text block, and the rule would misread it as a broken run.
  const phases = lcpPhases(report);
  if (
    expectLcpImage &&
    Object.keys(phases).length &&
    !('resourceLoadDuration' in phases) &&
    !('resourceLoadDelay' in phases)
  ) {
    problems.push(
      'the LCP breakdown carries no resource phase - the LCP element is a text block, so the trace ended before the page\'s main image was painted',
    );
  }

  return {
    status: problems.length ? 'fail' : 'pass',
    problems,
    notes,
    productionCalls: productionPath.length,
    requests: items.length,
  };
}

/**
 * The preview is reached under a hostname that resolves to the loopback
 * interface. Anything else would measure a different machine.
 */
export async function assertLoopbackHost(host) {
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return { host, addresses: ['loopback'] };
  let addresses;
  try {
    addresses = await dns.lookup(host, { all: true });
  } catch (error) {
    throw new Error(`--host ${host} does not resolve (${error.message})`);
  }
  if (!addresses.length) throw new Error(`--host ${host} does not resolve`);
  const offHost = addresses.filter((entry) => entry.address !== '127.0.0.1' && entry.address !== '::1');
  if (offHost.length) {
    throw new Error(`--host ${host} resolves off the loopback interface (${offHost[0].address})`);
  }
  return { host, addresses: addresses.map((entry) => entry.address) };
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
async function waitForServer(port, fingerprint, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = '';
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(2000) });
      if (!res.ok) {
        lastError = `status ${res.status}`;
      } else {
        const html = await res.text();
        const digest = createHash('sha256').update(html, 'utf8').digest('hex');
        if (fingerprint && digest !== fingerprint.sha256) {
          // The port already had a server on it and that server answers with
          // a different build. The numbers would be plausible and wrong.
          throw new Error(
            `the server on port ${port} is serving a DIFFERENT build - expected ${fingerprint.entry} ` +
              `(${fingerprint.size} bytes), got ${(html.match(/assets\/index-[A-Za-z0-9_-]+\.js/) || ['an unknown bundle'])[0]} ` +
              `(${Buffer.byteLength(html, 'utf8')} bytes)`,
          );
        }
        return true;
      }
    } catch (error) {
      if (error.message.includes('DIFFERENT build')) throw error;
      lastError = `${error.message}${error.cause ? ` / ${error.cause.message}` : ''}`;
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  console.log(`  waitForServer(${port}) gave up; last error: ${lastError}`);
  return false;
}

/** The fingerprint of the document this probe is supposed to measure. */
function documentFingerprint() {
  const file = path.resolve('dist/index.html');
  if (!existsSync(file)) return null;
  const html = readFileSync(file, 'utf8');
  return {
    entry: (html.match(/assets\/index-[A-Za-z0-9_-]+\.js/) || [])[0] || null,
    sha256: createHash('sha256').update(html, 'utf8').digest('hex'),
    size: Buffer.byteLength(html, 'utf8'),
  };
}

/** Is this port free? A busy port is a failed measurement, not a warning. */
function portFree(port) {
  return new Promise((resolve) => {
    const probe = net.createServer();
    probe.once('error', () => resolve(false));
    probe.once('listening', () => probe.close(() => resolve(true)));
    probe.listen(port, '127.0.0.1');
  });
}

function readArg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

async function runLighthouse({ entry, runs, port, chromePort, host }) {
  const outDir = path.resolve('.runs/lh');
  mkdirSync(outDir, { recursive: true });
  const base = `http://${host}:${port}`;

  const preview = spawn(process.execPath, [path.resolve('scripts/preview-dist.mjs'), String(port)], {
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
  });
  // The server's own output is the only diagnosis when it refuses to come up.
  let previewNoise = '';
  preview.stdout.on('data', (d) => {
    previewNoise += d.toString();
  });
  preview.stderr.on('data', (d) => {
    previewNoise += d.toString();
  });
  try {
    const fingerprint = documentFingerprint();
    if (!fingerprint) {
      throw new Error('dist/index.html does not exist - build the site first');
    }
    if (!(await portFree(port))) {
      throw new Error(
        `port ${port} is already in use - a leftover preview server would be measured instead of this ` +
          'build. Free the port and run again.',
      );
    }
    if (!(await waitForServer(port, fingerprint))) {
      throw new Error(`preview server did not come up on ${port}${previewNoise ? `: ${previewNoise.trim()}` : ''}`);
    }
    console.log(`  serving ${fingerprint.entry} (${fingerprint.size} bytes) on ${port}`);
    await warmPreview(base);
    const reports = [];
    for (let i = 1; i <= runs; i += 1) {
      const out = path.join(outDir, `render-blocking-${i}.json`);
      // A browser that is already running can be attached to. On a host where
      // launching a browser is broken (a wedged launchservicesd makes Chrome
      // hang before it opens its debugging port), attaching is the only way
      // to get a Lighthouse run at all.
      const attach = chromePort ? ['--port=' + chromePort] : ['--chrome-flags=--headless=new --no-sandbox'];
      const code = await new Promise((resolve) => {
        const child = spawn(
          process.execPath,
          [
            entry,
            `${base}/`,
            '--output=json',
            `--output-path=${out}`,
            '--quiet',
            ...attach,
          ],
          { stdio: ['ignore', 'pipe', 'pipe'] },
        );
        let noise = '';
        child.stdout.on('data', (d) => {
          noise += d.toString();
        });
        child.stderr.on('data', (d) => {
          noise += d.toString();
        });
        child.on('close', (c) => resolve({ code: c, noise }));
        child.on('error', () => resolve({ code: 1, noise }));
      });
      if (code.code !== 0 || !existsSync(out)) {
        const tail = code.noise.trim().split('\n').slice(-4).join(' | ');
        throw new Error(`lighthouse run ${i} failed (exit ${code.code})${tail ? `: ${tail}` : ''}`);
      }
      reports.push(JSON.parse(readFileSync(out, 'utf8')));
      console.log(`  run ${i}/${runs} -> ${path.relative(process.cwd(), out)}`);
    }
    return reports;
  } finally {
    preview.kill('SIGTERM');
  }
}

/**
 * Warm the preview before the measured runs.
 *
 * The preview compresses on the fly and caches the result. Without this the
 * first Lighthouse run pays for compressing the entry bundle inside a
 * measured request, and the number it records belongs to the preview server
 * rather than to the page. The warm-up asks for the same brotli encoding the
 * browser will ask for, so the cache holds the bytes the run will send.
 */
async function warmPreview(base) {
  const headers = { 'accept-encoding': 'br' };
  const response = await fetch(`${base}/`, { headers });
  if (!response.ok) throw new Error(`warm-up of ${base}/ answered ${response.status}`);
  const html = await response.text();
  const urls = new Set();
  for (const match of html.matchAll(/(?:src|href)="(\/[^"]+)"/g)) urls.add(match[1]);
  // The lazy route chunks are not in the HTML, so warm the whole asset
  // directory as well - it is ninety files.
  const assetDir = path.resolve('dist/assets');
  if (existsSync(assetDir)) {
    for (const file of readdirSync(assetDir)) {
      if (/\.(js|css)$/.test(file)) urls.add(`/assets/${file}`);
    }
  }
  await Promise.all(
    [...urls].map((url) => fetch(`${base}${url}`, { headers }).catch(() => null)),
  );
  console.log(`  warm-up: ${urls.size} asset(s) cached at ${base}`);
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

  // Fidelity: the report has to describe the live site, not a local
  // approximation of it.
  const net = (list, finalUrl) => ({
    finalUrl: finalUrl || 'http://localtest.me:4181/',
    audits: { 'network-requests': { details: { type: 'table', items: list } } },
  });
  const faithful = net([
    { url: 'http://localtest.me:4181/', transferSize: 7635, resourceSize: 28479, statusCode: 200 },
    { url: 'http://localtest.me:4181/assets/index-OASAr2mz.js', transferSize: 326735, resourceSize: 1217070, statusCode: 200 },
    { url: 'http://localtest.me:4181/api/v2/categories?withStats=false', transferSize: 462, resourceSize: 462, statusCode: 200 },
    { url: 'http://localtest.me:4181/api/v2/products?categoryId=stroller&page=1&pageSize=12', transferSize: 18161, resourceSize: 18161, statusCode: 200 },
  ]);
  const localOnly = net(
    [
      { url: 'http://127.0.0.1:4181/', transferSize: 28479, resourceSize: 28479, statusCode: 200 },
      { url: 'http://127.0.0.1:4181/api/content/bundle', transferSize: 92, resourceSize: 92, statusCode: 404 },
      { url: 'https://kidsmobi-api-v1.seaman-player.workers.dev/api/v2/categories', transferSize: 0, resourceSize: 0, statusCode: -1 },
    ],
    'http://127.0.0.1:4181/',
  );
  const uncompressed = net([
    { url: 'http://localtest.me:4181/api/v2/categories?withStats=false', transferSize: 462, resourceSize: 462, statusCode: 200 },
    { url: 'http://localtest.me:4181/assets/index-OASAr2mz.js', transferSize: 1217070, resourceSize: 1217070, statusCode: 200 },
  ]);
  const thirdPartyFailed = net([
    { url: 'http://localtest.me:4181/api/v2/categories?withStats=false', transferSize: 462, resourceSize: 462, statusCode: 200 },
    { url: 'http://localtest.me:4181/assets/index-OASAr2mz.js', transferSize: 326735, resourceSize: 1217070, statusCode: 200 },
    { url: 'https://apis.google.com/js/api.js?onload=x', transferSize: 0, resourceSize: 0, statusCode: -1 },
  ]);
  const ownOriginFailed = net([
    { url: 'http://localtest.me:4181/api/v2/categories?withStats=false', transferSize: 462, resourceSize: 462, statusCode: 200 },
    { url: 'http://localtest.me:4181/assets/index-OASAr2mz.js', transferSize: 0, resourceSize: 1217070, statusCode: -1 },
  ]);
  // A run whose Largest Contentful Paint names a node. The shape is the one
  // Lighthouse 13 writes; the values are the ones a measured report carried.
  const withLcpNode = (selector, rect, phases) => {
    const report = net([
      { url: 'http://localtest.me:4181/', transferSize: 7635, resourceSize: 28479, statusCode: 200 },
      { url: 'http://localtest.me:4181/api/v2/categories?withStats=false', transferSize: 462, resourceSize: 462, statusCode: 200 },
    ]);
    const items = [];
    if (phases) {
      items.push({
        type: 'table',
        items: Object.entries(phases).map(([subpart, duration]) => ({ subpart, duration })),
      });
    }
    if (selector) items.push({ type: 'node', selector, boundingRect: rect });
    report.audits['lcp-breakdown-insight'] = { details: { type: 'list', items } };
    return report;
  };
  const heroPhases = {
    timeToFirstByte: 11,
    resourceLoadDelay: 956,
    resourceLoadDuration: 5190,
    elementRenderDelay: 445,
  };
  const lcpOnThePage = withLcpNode(
    'div#home_layout > section#home_banner_anchor > div.absolute > div.absolute',
    { top: 225, bottom: 990, left: 17, right: 395, width: 378, height: 765 },
    heroPhases,
  );
  const lcpDestroyed = withLcpNode(
    'div#bbt-first-paint-cover > article > section > p',
    { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0 },
    heroPhases,
  );
  const lcpInsideTheCover = withLcpNode(
    'div#bbt-first-paint-cover > article > section > p',
    { top: 120, bottom: 180, left: 20, right: 380, width: 360, height: 60 },
    heroPhases,
  );
  // A text block has no resource to load, so the breakdown carries no
  // resource phase at all. Lighthouse does not name the element in this
  // shape, and the report describes a page whose hero never painted.
  const lcpTextBlock = withLcpNode(null, null, {
    timeToFirstByte: 15,
    elementRenderDelay: 498,
  });
  const fidelityCases = [
    ['a production-shaped run is faithful', judgeFidelity(faithful), 'pass'],
    ['a run stuck on the local aggregator is not', judgeFidelity(localOnly), 'fail'],
    ['a run without compression is not', judgeFidelity(uncompressed), 'fail'],
    ['a third-party failure is a note, not a different object', judgeFidelity(thirdPartyFailed), 'pass'],
    ['a failure on the page own origin is a different object', judgeFidelity(ownOriginFailed), 'fail'],
    ['a report without network requests cannot be cleared', judgeFidelity(empty), 'unknown'],
    ['an LCP element that is on the page is faithful', judgeFidelity(lcpOnThePage), 'pass'],
    ['an LCP element that is no longer on the page is not', judgeFidelity(lcpDestroyed), 'fail'],
    ['an LCP element inside the transient cover is not', judgeFidelity(lcpInsideTheCover), 'fail'],
    ['an LCP element that is a text block is not', judgeFidelity(lcpTextBlock), 'fail'],
    // The build fingerprint. A leftover preview server on the port answers
    // with a different build and produces perfectly plausible numbers; the
    // document's decoded size is what tells the two apart.
    [
      'a report of the build it is filed under is faithful',
      judgeFidelity(faithful, { expectedDocumentSize: 28479, expectedEntry: 'assets/index-OASAr2mz.js' }),
      'pass',
    ],
    [
      'a report of ANOTHER build is not',
      judgeFidelity(faithful, { expectedDocumentSize: 30716, expectedEntry: 'assets/index-OASAr2mz.js' }),
      'fail',
    ],
    [
      'a report whose entry bundle is another build is not',
      judgeFidelity(faithful, { expectedDocumentSize: 28479, expectedEntry: 'assets/index-OTHER.js' }),
      'fail',
    ],
  ];
  for (const [name, got, want] of fidelityCases) {
    const good = got.status === want;
    if (!good) ok = false;
    console.log(`  ${good ? 'ok  ' : 'FAIL'} ${name} (got ${got.status}, want ${want})`);
  }
  const unreachableCaught = judgeFidelity(localOnly).problems.some((p) => /workers\.dev/.test(p));
  if (!unreachableCaught) ok = false;
  console.log(`  ${unreachableCaught ? 'ok  ' : 'FAIL'} the unreachable worker fallback is named`);

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
    const chromePort = readArg('--chrome-port', process.env.LIGHTHOUSE_PORT || '');
    const host = readArg('--host', 'localtest.me');
    try {
      const resolved = await assertLoopbackHost(host);
      console.log(`render-blocking-probe — ${runs} Lighthouse run(s) against ${host}:${port}` +
        ` (${resolved.addresses.join(', ')})` +
        (chromePort ? ` (attaching to the browser on :${chromePort})` : ''));
    } catch (error) {
      console.log(`render-blocking-probe FAIL — ${error.message}`);
      console.log('  The preview has to be reachable under a hostname that resolves to the');
      console.log('  loopback interface, because the SPA picks its data path from the');
      console.log('  hostname. A run under "localhost" measures the local aggregator, not');
      console.log('  the live site.');
      process.exit(1);
    }
    try {
      reports.push(...(await runLighthouse({ entry, runs, port, chromePort, host })));
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
  let unfaithful = false;
  const summaryRuns = [];
  // The probe measures dist/ - so the reports it judges have to be reports
  // of that build, and the fingerprint says so.
  const fingerprint = documentFingerprint();
  reports.forEach((report, i) => {
    const verdict = judge(report);
    const fidelity = judgeFidelity(report, {
      expectedEntry: fingerprint ? fingerprint.entry : null,
      expectedDocumentSize: fingerprint ? fingerprint.size : null,
    });
    const metrics = summarizeMetrics(report);
    const label = report.finalUrl || report.requestedUrl || `report ${i + 1}`;
    summaryRuns.push({
      file: path.relative(process.cwd(), path.join('.runs/lh', `render-blocking-${i + 1}.json`)),
      fcp_ms: metrics.fcp,
      lcp_ms: metrics.lcp,
      tbt_ms: metrics.tbt,
      cls: metrics.cls,
      render_blocking: verdict.status,
      fidelity: fidelity.status,
      fidelity_problems: fidelity.problems || [],
      fidelity_notes: fidelity.notes || [],
    });
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
    if (fidelity.status === 'pass') {
      console.log(`  fidelity: PASS — measured the production object (${fidelity.requests} requests, ${fidelity.productionCalls} production API calls)`);
      for (const note of fidelity.notes || []) console.log(`    note: ${note}`);
    } else if (fidelity.status === 'fail') {
      unfaithful = true;
      console.log('  fidelity: FAIL — this report does not describe the live site:');
      for (const problem of fidelity.problems) console.log(`    ${problem}`);
    } else {
      unfaithful = true;
      console.log(`  fidelity: FAIL — ${fidelity.problems.join('; ')}`);
    }
  });

  // Write down what was measured. The baseline picks one report out of these
  // by the median LCP, and that choice has to be auditable instead of
  // remembered.
  const medianOf = (key) => {
    const values = summaryRuns.map((r) => r[key]).filter((v) => typeof v === 'number').sort((a, b) => a - b);
    if (!values.length) return null;
    const mid = Math.floor(values.length / 2);
    return values.length % 2 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
  };
  const medianLcp = medianOf('lcp_ms');
  const selected = summaryRuns.find((r) => r.lcp_ms === medianLcp) || summaryRuns[0] || null;
  const summary = {
    generated_at: new Date().toISOString(),
    note:
      'Local Lighthouse against the preview. The fidelity column says whether the run ' +
      'measured the production object (same-origin /api/v2 data path, compressed assets).',
    runs: summaryRuns,
    median: {
      fcp_ms: medianOf('fcp_ms'),
      lcp_ms: medianLcp,
      tbt_ms: medianOf('tbt_ms'),
      cls: medianOf('cls'),
    },
    selected_report: selected ? selected.file : null,
    selected_by: 'median LCP',
  };
  try {
    mkdirSync(path.resolve('.runs/lh'), { recursive: true });
    writeFileSync(path.resolve('.runs/lh/summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
    console.log(`  summary: .runs/lh/summary.json (selected ${summary.selected_report} by ${summary.selected_by})`);
  } catch (error) {
    console.log(`  summary could not be written: ${error.message}`);
  }

  if (failed) process.exit(1);
  if (unfaithful) {
    console.log('render-blocking-probe FAIL — the run did not measure the production object.');
    process.exit(1);
  }
  if (unknown) {
    console.log('render-blocking-probe SKIP — a report could not be read.');
    process.exit(0);
  }
  console.log('render-blocking-probe PASS');
}

// Only measure when this file is the entry point. Other scripts import
// judgeFidelity() from here, and importing must not start a measurement.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
