#!/usr/bin/env node
// Guard: a page whose delivered HTML says `index,follow` must never expose a
// `noindex` robots meta while it hydrates.
//
// Why: the SPA used to treat "catalogue not loaded yet" as "unknown product id"
// and overwrote the delivered meta with `noindex,nofollow` for 10+ seconds.
// Google's URL Inspection live test renders the page and snapshots that state,
// so a page that is perfectly indexable in the delivered HTML reads as
// `Excluded by 'noindex' tag`. Sampling the raw HTML once cannot see this;
// only a timeline of the rendered DOM can.
//
// Usage:
//   node scripts/seo/check-rendered-robots.mjs --self-test
//   node scripts/seo/check-rendered-robots.mjs --url https://<host>/products/<bucket>/<id>
//   SEO_SITE_BASE_URL=http://127.0.0.1:3000 node scripts/seo/check-rendered-robots.mjs \
//       --path /products/electric-cars/kids_push_ride_ons-b0d8kmd5q3
//
// Exit 0 = never saw noindex; 1 = saw a noindex (or no robots meta at all);
// 2 = tool/environment error. Not wired into CI until the fix is deployed.
import { chromium } from 'playwright';
import process from 'node:process';

const DEFAULT_SAMPLES = 40;
const DEFAULT_INTERVAL = 400;
const CHROME = process.env.CHROME_PATH || undefined;

function arg(name, fallback = '') {
  const i = process.argv.indexOf(name);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : fallback;
}

export async function sampleRobots(page, samples = DEFAULT_SAMPLES, interval = DEFAULT_INTERVAL) {
  const out = [];
  for (let i = 0; i < samples; i++) {
    out.push(await page.evaluate(() => ({
      t: Math.round(performance.now()),
      robots: [...document.querySelectorAll('meta[name="robots"]')].map(m => m.getAttribute('content')),
      title: document.title,
    })));
    if (i + 1 < samples) await page.waitForTimeout(interval);
  }
  const distinct = [...new Set(out.flatMap(s => s.robots.map(v => v ?? '(null)')) )];
  const noindex = out.filter(s => s.robots.some(v => /noindex/i.test(v || '')));
  const missing = out.filter(s => s.robots.length === 0);
  const transitions = out.filter((s, i) => i === 0 || JSON.stringify(s.robots) !== JSON.stringify(out[i - 1].robots));
  return {
    ok: noindex.length === 0 && missing.length === 0,
    distinct,
    noindex_samples: noindex.length,
    missing_meta_samples: missing.length,
    first_noindex_ms: noindex.length ? noindex[0].t : null,
    transitions: transitions.map(s => ({ t: s.t, robots: s.robots, title: s.title })),
    samples: out.length,
  };
}

async function selfTest() {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'], headless: true });
  const cases = [];
  const check = async (name, html, wantOk) => {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    const r = await sampleRobots(page, 8, 250);
    cases.push({ name, got_ok: r.ok, want_ok: wantOk, pass: r.ok === wantOk, distinct: r.distinct });
    await page.close();
  };

  // 1. stays indexable -> pass
  await check('stable index,follow',
    '<html><head><meta name="robots" content="index,follow"></head><body>ok</body></html>', true);

  // 2. REVERSE ASSERTION: the old implementation's transient noindex MUST be red,
  //    even though it flips back to index,follow before the sample window ends.
  await check('transient noindex must fail',
    `<html><head><meta name="robots" content="index,follow"></head><body>ok<script>
      setTimeout(() => document.querySelector('meta[name=robots]').setAttribute('content','noindex,nofollow'), 400);
      setTimeout(() => document.querySelector('meta[name=robots]').setAttribute('content','index,follow'), 1400);
    </script></body></html>`, false);

  // 3. no robots meta at all is not a pass (absence of instrument != pass)
  await check('missing meta must fail', '<html><head></head><body>ok</body></html>', false);

  await browser.close();
  const pass = cases.every(c => c.pass);
  console.log(JSON.stringify({ self_test: pass ? 'PASS' : 'FAIL', cases }, null, 2));
  return pass ? 0 : 1;
}

async function main() {
  if (process.argv.includes('--self-test')) return selfTest();
  const base = arg('--url') || (process.env.SEO_SITE_BASE_URL
    ? process.env.SEO_SITE_BASE_URL.replace(/\/$/, '') + arg('--path', '/')
    : '');
  if (!base) {
    console.error('usage: check-rendered-robots.mjs --self-test | --url <url> | SEO_SITE_BASE_URL + --path');
    return 2;
  }
  const samples = Number(arg('--samples', String(DEFAULT_SAMPLES)));
  const interval = Number(arg('--interval', String(DEFAULT_INTERVAL)));
  // localtest.me resolves to 127.0.0.1 but is not "localhost", so the app takes
  // its production data path. The system proxy has no exception for that host,
  // so force a direct connection for local previews (measured: via ClashX the
  // request comes back as an empty 502).
  const args = ['--no-sandbox'];
  if (/localtest\.me|127\.0\.0\.1|localhost/.test(base)) {
    args.push('--proxy-server=direct://', '--proxy-bypass-list=*');
  }
  const browser = await chromium.launch({ executablePath: CHROME, args, headless: true });
  const ctx = await browser.newContext({ viewport: { width: 412, height: 823 } });
  const page = await ctx.newPage();
  let result;
  try {
    await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 30000 });
    result = await sampleRobots(page, samples, interval);
  } catch (e) {
    console.error('probe error:', e.message ?? String(e));
    result = { ok: false, error: e.message ?? String(e) };
  }
  await browser.close();
  const out = { url: base, generated_at: new Date().toISOString(), ...result };
  const jsonPath = arg('--json');
  if (jsonPath) {
    const { writeFile } = await import('node:fs/promises');
    await writeFile(jsonPath, JSON.stringify(out, null, 2) + '\n');
  }
  console.log(JSON.stringify(out, null, 2));
  return result.ok ? 0 : 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exitCode = await main();
}
