// Consent probe (R-910): does the site track a reader before they agreed to
// anything?
//
// The static-HTML guard (npm run check:tracking) can prove that the prerender
// no longer writes a GA4 snippet into the pages. It cannot see what the
// browser does after hydration, and that is where the tracking actually
// started: the static HTML loaded G-52MH8KHF9T the moment it was parsed, the
// SPA loaded a second property after consent, and nobody could tell from the
// inside which of the two was reporting.
//
// This probe loads the site in Chromium and watches the network:
//
//   1. a fresh visitor: no request to googletagmanager.com, no GA script in
//      the DOM - the consent banner is still open;
//   2. after "Accept All Cookies": the GA script appears, with the id the
//      site is configured with;
//   3. a visitor who declines: still nothing, ever;
//   4. a returning visitor who already agreed: the script comes back on the
//      next visit, because the decision is stored (R-910: "consent state
//      stored and respected across sessions").
//
// Usage: node scripts/seo/consent-probe.mjs
// Env: SEO_SITE_BASE_URL (defaults to the production site)
//
// Playwright and the browser are imported dynamically so the probe degrades
// to a SKIP (exit 0) where they are missing - the weekly audit must not fail
// because Chrome is absent.

import { SITE_BASE } from './config.mjs';

const base = process.env.SEO_SITE_BASE_URL || SITE_BASE;
const chromePath =
  process.env.CHROME_PATH ||
  (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined);

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.log('consent-probe SKIP — playwright not installed in this environment.');
  process.exit(0);
}

let browser;
try {
  browser = await chromium.launch(chromePath ? { executablePath: chromePath } : {});
} catch (e) {
  console.log(`consent-probe SKIP — no usable browser (${String(e.message || e).slice(0, 100)}).`);
  process.exit(0);
}

const failures = [];
const notes = [];
const fail = (what, why) => {
  failures.push({ what, why });
  console.log(`[FAIL] ${what} — ${why}`);
};
const pass = (what) => console.log(`[pass] ${what}`);

const GA_HOST = 'googletagmanager.com';

/** The measurement id the site is configured with, read off the CMS call. */
function idFromSettings(payload) {
  const data = Array.isArray(payload?.data) ? payload.data[0] : payload?.data;
  const id = String(data?.seoGlobal?.gaMeasurementId || '').trim();
  return /^G-[A-Za-z0-9]{4,20}$/.test(id) ? id : '';
}

/**
 * Opens a page, records every request to Google's tag host, and remembers
 * the measurement id the CMS hands out.
 */
async function openPage(context) {
  const page = await context.newPage();
  const state = { gaRequests: [], configuredId: '' };
  page.on('request', (req) => {
    if (req.url().includes(GA_HOST)) state.gaRequests.push(req.url());
  });
  page.on('response', async (res) => {
    if (!res.url().includes('/api/cms/settings')) return;
    try {
      const id = idFromSettings(await res.json());
      if (id) state.configuredId = id;
    } catch {
      // A settings payload we cannot read simply means "no id known here".
    }
  });
  return { page, state };
}

/** What the DOM says about the analytics script. */
const GA_STATE = () => {
  const scripts = Array.from(document.querySelectorAll('script[src*="googletagmanager.com"]')).map(
    (s) => s.getAttribute('src') || '',
  );
  const ids = scripts
    .map((src) => (/[?&]id=([A-Za-z0-9-]+)/.exec(src) || [])[1] || '')
    .filter(Boolean);
  return { scripts, ids, dataLayer: (window.dataLayer || []).length };
};

async function visit(url) {
  const { page, state } = await openPage(await browser.newContext());
  await page.goto(url, { waitUntil: 'load', timeout: 45000 });
  await page.waitForTimeout(3500); // hydration + the CMS settings round-trip
  await waitForBanner(page);
  return { page, state };
}

/** The consent banner is rendered by React, so it arrives with hydration. */
async function waitForBanner(page) {
  await page
    .locator('button:has-text("Accept All Cookies")')
    .first()
    .waitFor({ state: 'visible', timeout: 15000 })
    .catch(() => {});
}

// ---------------------------------------------------------------- 1. fresh visitor
{
  const { page, state } = await visit(base + '/');
  const ga = await page.evaluate(GA_STATE);
  const banner = await page.locator('text=Accept All Cookies').count();

  if (!banner) {
    fail('fresh visitor', 'the cookie banner did not appear — there is nothing to consent to');
  } else if (state.gaRequests.length || ga.scripts.length) {
    fail(
      'fresh visitor',
      `the analytics script loaded before any consent (${ga.scripts.length} script(s), ${state.gaRequests.length} request(s))`,
    );
  } else {
    pass('fresh visitor — no analytics script, no request to Google');
  }

  // ---------------------------------------------------------------- 2. accept
  if (banner) {
    await page.locator('button:has-text("Accept All Cookies")').first().click();
    await page.waitForTimeout(2500);
    const after = await page.evaluate(GA_STATE);
    if (!state.configuredId) {
      notes.push('no measurement id is configured on the site — the accept path was not exercised');
    } else if (!after.ids.length) {
      fail('after accepting', 'the analytics script did not load even though consent was granted');
    } else if (after.ids.some((id) => id !== state.configuredId)) {
      fail('after accepting', `the site loaded ${after.ids.join(", ")} but is configured with ${state.configuredId}`);
    } else {
      pass(`after accepting — ${after.ids[0]} loaded`);
    }
  }
  await page.close();
}

// ---------------------------------------------------------------- 3. decline
{
  const { page, state } = await visit(base + '/');
  const banner = await page.locator('text=Accept All Cookies').count();
  if (banner) {
    await page.locator('button:has-text("Decline Non-Essential")').first().click();
    await page.waitForTimeout(2500);
  }
  const ga = await page.evaluate(GA_STATE);
  if (ga.scripts.length || state.gaRequests.length) {
    fail('after declining', `the analytics script loaded anyway (${ga.scripts.length} script(s))`);
  } else {
    pass('after declining — still no analytics script');
  }
  await page.close();
}

// ---------------------------------------------------------------- 4. returning visitor
{
  const context = await browser.newContext();
  const { page, state } = await openPage(context);
  await page.goto(base + '/', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.evaluate(() => {
    localStorage.setItem('cookie_consent_v1', 'all');
    localStorage.setItem(
      'cookie_preferences_v1',
      JSON.stringify({ essential: true, analytics: true, functional: true, consentChoice: 'all' }),
    );
  });
  await page.reload({ waitUntil: 'load', timeout: 45000 });
  await page.waitForTimeout(3500);
  const ga = await page.evaluate(GA_STATE);
  if (!state.configuredId) {
    notes.push('no measurement id is configured on the site — the returning-reader path was not exercised');
  } else if (!ga.ids.length) {
    fail('returning reader', 'the stored consent was not honoured — the analytics script did not come back');
  } else {
    pass(`returning reader — ${ga.ids[0]} loaded from the stored decision`);
  }
  await page.close();
  await context.close();
}

await browser.close();

for (const note of notes) console.log(`[note] ${note}`);

if (failures.length > 0) {
  console.log(`\nconsent-probe FAILED — ${failures.length} consent problem(s):`);
  for (const f of failures) console.log(`  ${f.what}: ${f.why}`);
  console.log('\nR-910: non-essential tracking must not fire before the reader grants consent.');
  process.exit(1);
}
console.log('\nconsent-probe OK — no tracking before consent, tracking after it, and the decision is remembered.');
