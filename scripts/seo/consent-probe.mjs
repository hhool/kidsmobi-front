// Consent probe (R-910): does the site track a reader before they agreed to
// anything, and does it count them at all afterwards?
//
// The static-HTML guard (npm run check:tracking) can prove that the prerender
// no longer writes a GA4 snippet into the pages. It cannot see what the
// browser does after hydration, and that is where the tracking actually
// happens.
//
// The site runs Google's Consent Mode v2, so the tag loads for every reader
// and the CONSENT STATE decides what it may do:
//
//   - before a decision: every signal is denied. No analytics cookie, no
//     identifier - but the visit is still counted, as a cookieless ping.
//     This is what keeps the property from going blank, which is what
//     happened when the tag was only loaded after consent ("basic consent
//     mode"): every reader who declined was simply not there any more;
//   - after "Accept All Cookies": analytics storage is granted and the rest
//     of the visit is measured in full;
//   - after "Decline Non-Essential": analytics storage stays denied, the
//     ping stays cookieless, and no cookie is written;
//   - a returning reader who already agreed gets the granted state applied
//     before the tag configures itself, so their first pageview is a full
//     one and not a ping.
//
// The probe therefore checks the CONSENT STATE (what the site told Google)
// and the COOKIE JAR (what Google was allowed to keep) - not whether a
// script tag happened to appear.
//
// The consent commands are read from a dataLayer that the probe installs
// before the page's own code runs, so the reading does not depend on what
// the Google tag does with the queue afterwards.
//
// Usage: node scripts/seo/consent-probe.mjs
// Env: SEO_SITE_BASE_URL (defaults to the production site)
//      CHROME_PATH    (path to a Chromium/Chrome binary, if not on PATH)
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
const fail = (what, why) => {
  failures.push({ what, why });
  console.log(`[FAIL] ${what} — ${why}`);
};
const pass = (what) => console.log(`[pass] ${what}`);
const note = (what) => console.log(`[note] ${what}`);

const GA_HOST = 'googletagmanager.com';
const GA_COLLECT = 'google-analytics.com';
const CONSENT_SIGNALS = ['ad_storage', 'ad_user_data', 'ad_personalization', 'analytics_storage'];

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
  const state = { gaRequests: [], collectRequests: [], configuredId: '', settingsReady: null, page };
  let markSettingsReady = () => {};
  state.settingsReady = new Promise((resolve) => {
    markSettingsReady = resolve;
  });
  page.on('request', (req) => {
    const url = req.url();
    if (url.includes(GA_HOST)) state.gaRequests.push(url);
    if (url.includes(GA_COLLECT)) state.collectRequests.push(url);
  });
  page.on('response', async (res) => {
    if (!res.url().includes('/api/cms/settings')) return;
    try {
      const id = idFromSettings(await res.json());
      if (id) state.configuredId = id;
    } catch {
      // A settings payload we cannot read simply means "no id known here".
    }
    markSettingsReady();
  });
  return { page, state };
}

/**
 * Wait for the CMS settings response, which carries the measurement id.
 *
 * A fixed wait is not good enough: the settings call crosses the internet and
 * its timing decides whether the tag has an id to load, so the probe waits
 * for the answer instead of guessing how long it takes.
 */
async function waitForSettings(state, ms = 15000) {
  await Promise.race([
    state.settingsReady,
    new Promise((resolve) => setTimeout(resolve, ms)),
  ]);
  if (state.configuredId || !state.page) return;
  // The homepage ships as a document and never mounts the SPA, so it makes no
  // /api/cms/settings request at all. The id is still there - baked into the
  // beacon element by the builder, which is where analytics-boot.js reads it -
  // and without this fallback the probe reports "no measurement id is
  // configured" on a page that carries one.
  try {
    const id = await state.page.evaluate(
      () => document.querySelector('script[src*="analytics-boot.js"]')?.getAttribute('data-ga') || '',
    );
    if (id) state.configuredId = id;
  } catch {
    // The page closed or is navigating; the id stays unknown, which the caller
    // already reports as a note.
  }
}

/** What the DOM says about the analytics script. */
const GA_STATE = () => {
  const scripts = Array.from(document.querySelectorAll('script[src*="googletagmanager.com"]')).map(
    (s) => s.getAttribute('src') || '',
  );
  const ids = scripts
    .map((src) => (/[?&]id=([A-Za-z0-9-]+)/.exec(src) || [])[1] || '')
    .filter(Boolean);
  return { scripts, ids };
};

/**
 * The consent commands the page sent to Google, oldest first.
 *
 * Read from the log the probe installed before the page's own code ran, so
 * the queue is captured whether or not the Google tag consumed it.
 */
const CONSENT_LOG = () => (window.__bbConsentLog || []).map((entry) => {
  const args = Array.from(entry || []);
  const action = args[1];
  const payload = args[2] || {};
  const signals = {};
  // The signal names are written out here on purpose: this function is
  // serialised into the browser, where the module scope does not exist.
  for (const name of ['ad_storage', 'ad_user_data', 'ad_personalization', 'analytics_storage']) {
    signals[name] = payload[name] || '(unset)';
  }
  // Google reads a command from the dataLayer only when it arrives as an
  // `arguments` object. A command pushed as a plain array is ignored by
  // gtag.js, so the tag loads, applies no consent state and sends nothing.
  const isCommand =
    Object.prototype.toString.call(entry) === '[object Arguments]' ||
    Object.prototype.toString.call(entry) === '[object Array]';
  const isArguments = Object.prototype.toString.call(entry) === '[object Arguments]';
  return { action, signals, isCommand, isArguments };
});

/** The analytics cookies in the jar. Empty when nothing was stored. */
const GA_COOKIES = () =>
  document.cookie
    .split(';')
    .map((part) => part.trim())
    .filter((part) => part.startsWith('_ga'))
    .map((part) => part.split('=')[0]);

/**
 * Can the Google tag actually run in this environment?
 *
 * Some networks (and this machine's sandbox proxy) answer the tag URL with
 * an empty body, and a <script> that loads nothing never runs. The tag then
 * never sends anything, so no cookie can ever appear and asserting on the
 * cookie jar would fail for a reason that has nothing to do with the site.
 *
 * The probe therefore does not guess from the response body: it watches the
 * network. A tag that runs sends a collect request - a cookieless ping when
 * consent is denied - and that request is the proof.
 */
function tagIsRunning(state) {
  return state.collectRequests.length > 0;
}

/** A context whose dataLayer records every command the page pushes. */
async function contextWithConsentLog(browser) {
  const context = await browser.newContext();
  await context.addInitScript(() => {
    window.__bbConsentLog = [];
    const queue = [];
    const push = queue.push.bind(queue);
    queue.push = (...items) => {
      for (const item of items) window.__bbConsentLog.push(item);
      return push(...items);
    };
    window.dataLayer = queue;
  });
  return context;
}

async function visit(url, context) {
  const { page, state } = await openPage(context || (await contextWithConsentLog(browser)));
  await page.goto(url, { waitUntil: 'load', timeout: 45000 });
  await waitForSettings(state); // the CMS settings carry the measurement id
  await page.waitForTimeout(3500); // hydration
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

/** The last consent command for an action, or null. */
function lastConsent(log, action) {
  const matches = log.filter((entry) => entry.action === action);
  return matches.length ? matches[matches.length - 1] : null;
}

/** Are all four signals denied in this consent command? */
function allDenied(entry) {
  return CONSENT_SIGNALS.every((name) => entry.signals[name] === 'denied');
}

// ---------------------------------------------------------------- 1. fresh visitor
let tagRuns = false;
{
  const context = await contextWithConsentLog(browser);
  const { page, state } = await visit(base + '/', context);
  const banner = await page.locator('button:has-text("Accept All Cookies")').count();
  const log = await page.evaluate(CONSENT_LOG);
  const defaultEntry = lastConsent(log, 'default');
  const cookies = await page.evaluate(GA_COOKIES);

  tagRuns = tagIsRunning(state);
  if (!tagRuns) {
    note(
      'the Google tag never reached Google from this environment (no collect request), so the cookie-jar checks are skipped - the consent commands are still checked',
    );
  }

  if (!banner) {
    fail('fresh visitor', 'the cookie banner did not appear — there is nothing to consent to');
  }
  if (!defaultEntry) {
    fail('fresh visitor', 'the site never sent a consent default — the tag would measure with no state at all');
  } else if (!allDenied(defaultEntry)) {
    fail(
      'fresh visitor',
      `the consent default is not a full denial (${JSON.stringify(defaultEntry.signals)}) - the tag would measure before anybody agreed`,
    );
  }
  if (defaultEntry && defaultEntry.isArguments === false) {
    fail(
      'fresh visitor',
      'the consent command was queued as a plain array - gtag.js reads a command only when it arrives as an `arguments` object, so it ignores this one and the tag measures nothing',
    );
  }
  if (cookies.length) {
    fail('fresh visitor', `analytics cookies were written before consent (${cookies.join(', ')})`);
  }
  if (state.configuredId) {
    const ga = await page.evaluate(GA_STATE);
    const wrong = ga.ids.filter((id) => id !== state.configuredId);
    if (wrong.length) {
      fail('fresh visitor', `the site loaded ${wrong.join(', ')} but is configured with ${state.configuredId}`);
    }
  }
  if (banner && defaultEntry && allDenied(defaultEntry) && !cookies.length) {
    pass('fresh visitor — every signal denied, no analytics cookie written');
  }

  // ---------------------------------------------------------------- 2. accept
  if (banner) {
    await page.locator('button:has-text("Accept All Cookies")').first().click();
    await page.waitForTimeout(2500);
    const afterLog = await page.evaluate(CONSENT_LOG);
    const update = lastConsent(afterLog, 'update');
    const afterCookies = await page.evaluate(GA_COOKIES);

    if (!update) {
      fail('after accepting', 'the site never sent a consent update — the reader agreed and the tag was not told');
    } else if (update.signals.analytics_storage !== 'granted') {
      fail(
        'after accepting',
        `the consent update left analytics storage at "${update.signals.analytics_storage}" - the reader agreed and the tag was not told`,
      );
    }
    if (update && update.isArguments === false) {
      fail(
        'after accepting',
        'the consent update was queued as a plain array - gtag.js would ignore it and keep the denied state',
      );
    }
    if (update && update.signals.analytics_storage === 'granted') {
      pass('after accepting — analytics storage granted');
    }

    // The cookie is written when the tag runs a granted measurement, so the
    // page is loaded once more with the stored decision: that is the same
    // path a returning reader takes, and it is deterministic.
    if (tagRuns) {
      await page.reload({ waitUntil: 'load', timeout: 45000 });
      await waitForSettings(state);
      await page.waitForTimeout(4000);
      const grantedCookies = await page.evaluate(GA_COOKIES);
      if (!grantedCookies.length) {
        fail('after accepting', 'analytics storage was granted but no analytics cookie was written');
      } else {
        pass(`after accepting — the analytics cookie was written (${grantedCookies[0]})`);
      }
    }
  }
  await page.close();
  await context.close();
}

// ---------------------------------------------------------------- 3. decline
{
  const context = await contextWithConsentLog(browser);
  const { page } = await visit(base + '/', context);
  const banner = await page.locator('button:has-text("Accept All Cookies")').count();
  if (banner) {
    await page.locator('button:has-text("Decline Non-Essential")').first().click();
    await page.waitForTimeout(2500);
  }
  const log = await page.evaluate(CONSENT_LOG);
  const update = lastConsent(log, 'update');
  const cookies = await page.evaluate(GA_COOKIES);

  if (banner && !update) {
    fail('after declining', 'the site never sent a consent update — the decision was recorded but not handed to the tag');
  } else if (update && update.signals.analytics_storage !== 'denied') {
    fail(
      'after declining',
      `the consent update granted analytics storage ("${update.signals.analytics_storage}") - the reader declined`,
    );
  }
  if (cookies.length) {
    fail('after declining', `analytics cookies were written although consent was declined (${cookies.join(', ')})`);
  }
  if (banner && update && update.signals.analytics_storage === 'denied' && !cookies.length) {
    pass('after declining — analytics storage stays denied, no cookie written');
  }
  await page.close();
  await context.close();
}

// ---------------------------------------------------------------- 4. returning visitor
{
  const context = await contextWithConsentLog(browser);
  const { page, state } = await openPage(context);
  await page.goto(base + '/', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.evaluate(() => {
    localStorage.setItem('cookie_consent_v1', 'all');
    localStorage.setItem(
      'cookie_preferences_v1',
      JSON.stringify({ essential: true, analytics: true, functional: true, consentChoice: 'all' }),
    );
  });
  // domcontentloaded, not load -- same as the goto above, and for the same
  // reason: what this scenario grades is the consent command handed to the tag,
  // a dataLayer fact. `load` also waits for subresources, and a granted state
  // makes the tag fire its GA4 collect as an image request. On a network where
  // google-analytics.com does not answer, that request never completes, `load`
  // never fires, and the probe dies on a timeout after printing nothing --
  // reading a blocked beacon as a consent defect. The settle budget below is
  // what actually gives the page time to configure itself.
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 45000 });
  await waitForSettings(state);
  await page.waitForTimeout(3500);
  const log = await page.evaluate(CONSENT_LOG);
  const update = lastConsent(log, 'update');
  const cookies = await page.evaluate(GA_COOKIES);

  if (!state.configuredId) {
    note('no measurement id is configured on the site — the returning-reader path was not exercised');
  } else if (!update) {
    fail('returning reader', 'the stored decision was not applied — the tag would count them as a cookieless ping');
  } else if (update.signals.analytics_storage !== 'granted') {
    fail(
      'returning reader',
      `the stored decision left analytics storage at "${update.signals.analytics_storage}" - the reader had agreed`,
    );
  }
  if (tagRuns && update && update.signals.analytics_storage === 'granted' && !cookies.length) {
    fail('returning reader', 'analytics storage was granted but no analytics cookie was written');
  }
  if (update && update.signals.analytics_storage === 'granted') {
    pass('returning reader — the stored decision is applied on the next visit');
  }
  await page.close();
  await context.close();
}

await browser.close();

if (failures.length > 0) {
  console.log(`\nconsent-probe FAILED — ${failures.length} consent problem(s):`);
  for (const f of failures) console.log(`  ${f.what}: ${f.why}`);
  console.log('\nR-910: the consent state must deny everything until the reader grants it.');
  process.exit(1);
}
console.log(
  '\nconsent-probe OK — nothing is stored before consent, the decision is handed to the tag, and a reader who agreed is counted in full.',
);
