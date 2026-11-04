#!/usr/bin/env node
/**
 * Self-test for scripts/seo/browser-health.mjs.
 *
 * The script has to survive a machine whose daemons are wedged, so its pure
 * parts are exported and checked here, without a browser:
 *
 *   - how a process' age is read out of `ps -o etime`,
 *   - what makes a daemon look wedged,
 *   - which ports are worth asking before starting anything,
 *   - and that the script does NOT grow its own opinion about
 *     render-blocking.
 *
 * That last one matters. Lighthouse's render-blocking audit is a criterion
 * with an authority, and the repository already asks it in
 * scripts/seo/render-blocking-probe.mjs. A second, home-made approximation
 * would be a second opinion - and a wrong one: Lighthouse counts the requests
 * Chrome marked render-blocking that had FINISHED by the first paint, not the
 * requests that were still outstanding when the paint happened.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const { daysFromEtime, looksWedged, candidatePorts } = await import('./browser-health.mjs');

let failures = 0;

function check(name, fn) {
  try {
    fn();
    console.log(`  ok  ${name}`);
  } catch (error) {
    failures += 1;
    console.log(`  FAIL ${name}`);
    console.log(`       ${String(error.message || error).slice(0, 200)}`);
  }
}

// --- reading a process' age ------------------------------------------------

const ageCases = [
  ['44-20:16:16', 44],
  ['10-00:00:00', 10],
  ['00:00:12', 0],
  ['23:59:59', 0],
  ['', 0],
  [undefined, 0],
  ['  44-01:02:03  ', 44],
];
for (const [input, want] of ageCases) {
  check(`ps etime ${JSON.stringify(input)} is ${want} day(s) old`, () => {
    assert.equal(daysFromEtime(input), want);
  });
}

// --- what a wedged daemon looks like ---------------------------------------

const daemonCases = [
  ['a 44-day daemon at 0% CPU is wedged', { cpu: 0, memMb: 8, etime: '44-19:37:19' }, true],
  ['a freshly started daemon is not wedged', { cpu: 0, memMb: 8, etime: '00:00:12' }, false],
  ['a busy daemon is not wedged', { cpu: 90, memMb: 40, etime: '44-19:37:19' }, false],
  ['a long-lived daemon with real memory is not wedged', { cpu: 1, memMb: 120, etime: '10-00:00:00' }, false],
  ['a day-old daemon is not yet wedged', { cpu: 0, memMb: 8, etime: '1-02:00:00' }, false],
];
for (const [name, daemon, want] of daemonCases) {
  check(name, () => {
    assert.equal(looksWedged(daemon), want);
  });
}

// --- which ports to ask ----------------------------------------------------

check('an explicit port is asked first', () => {
  assert.equal(candidatePorts('9401')[0], 9401);
});

check('the same port is not asked twice', () => {
  const ports = candidatePorts('9345');
  assert.equal(new Set(ports).size, ports.length);
});

check('a nonsense port is dropped', () => {
  const ports = candidatePorts('not-a-port');
  assert.ok(ports.every((p) => Number.isInteger(p) && p > 0));
  assert.ok(ports.includes(9345), 'the known-good port must stay in the list');
});

// --- the script must not grow its own criterion ----------------------------

const source = readFileSync(new URL('./browser-health.mjs', import.meta.url), 'utf8');

check('the script delegates the judgement to the repository guard', () => {
  assert.ok(source.includes('render-blocking-probe.mjs'), 'it must call the existing probe');
  assert.ok(source.includes('--chrome-port'), 'it must hand the probe the browser to attach to');
});

check('the script does not re-implement the render-blocking rule', () => {
  const forbidden = ['r.start <= fcp', 'blockingResources', 'first-contentful-paint', 'render-blocking-insight'];
  for (const needle of forbidden) {
    assert.ok(!source.includes(needle), `the script must not contain "${needle}"`);
  }
});

check('the script keeps the diagnosis and the renderer check', () => {
  assert.ok(source.includes('replaceLaunchservicesd'), 'it must keep the one user-level repair');
  assert.ok(source.includes('verifyRenderer'), 'an open port is not proof that a renderer answers');
});

// --- the repair must not fire on a healthy machine -------------------------
//
// A freshly rebooted host has a launchservicesd at ~0% CPU with a small RSS.
// The old guard was just `cpu < 5`, so it killed the healthy daemon (the
// user-level lsd IS killable, unlike the root one) on every good machine.
// These are reverse assertions: put the old condition back and they go red.
check('the repair is gated on the full wedged fingerprint, not CPU alone', () => {
  const main = source.split('\nasync function main()', 2)[1] || '';
  assert.ok(
    main.includes('if (report.launchservicesd && looksWedged(report.launchservicesd))'),
    'main() must call looksWedged() before replacing the daemon',
  );
  assert.ok(
    !main.includes('if (report.launchservicesd && report.launchservicesd.cpu < 5)'),
    'the old CPU-only condition would kill a healthy daemon after a reboot',
  );
});

check('this machine after a reboot would NOT be repaired', () => {
  const healthy = { pid: 135, user: 'root', cpu: 3.7, memMb: 7, etime: '00:05:16' };
  assert.equal(looksWedged(healthy), false);
  const wedged = { pid: 135, user: 'root', cpu: 0, memMb: 8, etime: '44-19:37:19' };
  assert.equal(looksWedged(wedged), true);
});

// After a reboot the system proxy can point at a port nobody listens on.
// Chrome must be able to ignore it, or every HTTPS navigation fails with
// ERR_PROXY_CONNECTION_FAILED and looks like a broken TLS stack.
check('the browser can be started with system proxy settings disabled', () => {
  assert.ok(source.includes('--direct'), 'the flag must be documented');
  assert.ok(source.includes("args.push('--proxy-server=direct://')"), 'the flag must reach Chrome');
  assert.ok(source.includes('const DIRECT = USE_DIRECT && !PROXY;'), '--proxy must win over --direct');
});

console.log(failures === 0 ? '\nall cases pass' : `\n${failures} case(s) fail`);
process.exit(failures === 0 ? 0 : 1);
