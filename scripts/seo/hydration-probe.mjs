// Hydration probe: the one failure class curl-based checks cannot see.
//
// The prerender pipeline generates static HTML from the data modules and never
// renders the React components, so a component that throws at render time
// (e.g. a React.lazy target without a default export — React #306) ships a
// perfect static page and a blank "Page Recovery Mode" after hydration. tsc
// passes, the build passes, every fetch-based guard passes. Only a browser
// catches it.
//
// This probe loads a curated route set in a real browser and fails if any page
// shows the recovery boundary or throws a pageerror. Playwright is imported
// dynamically so the script degrades to a SKIP (exit 0) in environments
// without it or without a browser — the weekly health check must not fail
// just because Chrome is absent.
//
// Usage: node scripts/seo/hydration-probe.mjs
// Env: SEO_SITE_BASE_URL (falls back to config.mjs SITE_BASE)
//      CHROME_PATH (defaults to the system Chrome on Windows)

import { SITE_BASE } from './config.mjs';

// Curated route set: all Plan-B asset pages + main routes that render the
// same lazy component tree. Extend when new asset pages ship.
const ROUTES = [
  '/',
  '/products/balance-bikes/',
  '/news',
  '/guides',
  '/reviews',
  '/balance-bike-size-chart/',
  '/balance-bike-safety-standards/',
  '/balance-bike-weight/',
  '/balance-bike-stability/',
  '/balance-bike-by-age/',
  '/balance-bike-what-buyers-say/',
  '/balance-bike-budget/',
  '/safety/balance-bike-recalls/',
  '/transparency/privacy-policy/',
  // Guides topic indexes (2026-10-19: 5 new topic pages went live with the
  // 10-article batch). Channel routes hydrate onto prerendered HTML and must
  // keep their own TDK — the SPA-overwrite bug class this probe guards.
  '/guides/beginner',
  '/guides/budget',
  '/guides/scenario',
  '/guides/risk',
  '/guides/maintenance',
  '/guides/special',
  // Article detail pages from the same batch.
  '/guides/budget/balance-bike-price-tiers',
  '/guides/beginner/balance-bike-vs-training-wheels',
  '/guides/scenario/where-to-ride-balance-bike',
  '/guides/risk/balance-bike-safety-checks',
  '/guides/maintenance/balance-bike-maintenance',
  '/guides/special/balance-bikes-extra-support',
  '/news/science/balance-bike-research',
  '/news/industry/ride-on-safety-standards-2026',
  '/news/new_product/new-balance-bikes-2026',
  '/news/brand_news/balance-bike-brand-news-october-2026',
  // 2026-10-20 footer-column batch — the four CMS guides that back the
  // footer's Sizing & Buying Guide column.
  '/guides/beginner/balance-bike-size-chart',
  '/guides/beginner/balance-bike-weight',
  '/guides/risk/balance-bike-safety-standards',
  '/guides/risk/balance-bike-recalls',
];

const base = process.env.SEO_SITE_BASE_URL || SITE_BASE;
const chromePath =
  process.env.CHROME_PATH ||
  (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined);

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.log('hydration-probe SKIP — playwright not installed in this environment.');
  process.exit(0);
}

let browser;
try {
  browser = await chromium.launch(chromePath ? { executablePath: chromePath } : {});
} catch (e) {
  console.log(`hydration-probe SKIP — no usable browser (${String(e.message || e).slice(0, 100)}).`);
  process.exit(0);
}

const failures = [];
for (const route of ROUTES) {
  // Each attempt uses a fresh page: retrying goto() on a page whose previous
  // navigation timed out can raise "Navigation ... is interrupted by another
  // navigation" (the first navigation is still in flight from Playwright's
  // view). A genuinely broken page fails deterministically on both attempts —
  // recovery mode / pageerror are never retried away.
  let probe = null;
  let res = null;
  let pageErrors = [];
  let navError = null;
  for (let attempt = 1; attempt <= 2 && probe === null; attempt++) {
    const page = await browser.newPage();
    pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(String(err.message || err).slice(0, 200)));
    try {
      res = await page.goto(base + route, { waitUntil: 'load', timeout: 45000 });
      await page.waitForTimeout(3000); // let hydration + the SEO effect settle
      probe = await page.evaluate(() => {
        const body = document.body?.innerText || '';
        return {
          recovery: body.includes('Page Recovery Mode'),
          h1: document.querySelector('h1')?.textContent?.slice(0, 60) || '(none)',
        };
      });
    } catch (e) {
      navError = e;
      if (attempt === 1) console.log(`[retry] ${route} — nav failed once (${String(e.message || e).slice(0, 60)}), retrying with a fresh page`);
    } finally {
      await page.close();
    }
  }
  try {
    const bad = navError || probe.recovery || pageErrors.length > 0 || !res || res.status() >= 400;
    if (bad) {
      const why = navError ? 'nav: ' + String(navError.message || navError).slice(0, 100) : probe.recovery ? 'recovery-mode' : pageErrors.length ? pageErrors[0] : `HTTP ${res?.status()}`;
      failures.push({ route, why });
      console.log(`[FAIL] ${route} — ${why}`);
    } else {
      console.log(`[pass] ${route} — h1: ${probe.h1}`);
    }
  } catch (e) {
    failures.push({ route, why: 'eval: ' + String(e.message || e).slice(0, 100) });
    console.log(`[FAIL] ${route} — ${failures[failures.length - 1].why}`);
  }
}

await browser.close();

if (failures.length > 0) {
  console.log(`\nhydration-probe FAILED — ${failures.length}/${ROUTES.length} route(s) broken after hydration:`);
  for (const f of failures) console.log(`  ${f.route}: ${f.why}`);
  console.log('\nA broken route ships correct static HTML but crashes the hydrated SPA.');
  process.exit(1);
}
console.log(`\nhydration-probe OK — ${ROUTES.length} route(s) hydrate clean (no recovery mode, no pageerror).`);
