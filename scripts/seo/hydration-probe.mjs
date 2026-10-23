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
// shows the recovery boundary, throws a pageerror, or publishes a
// <meta name="keywords"> that disagrees with the prerendered HTML (blanked by
// hydration, or resolved from a different source — both invisible to curl).
// Playwright is imported
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
  '/kids-bike-size-chart/',
  '/balance-bike-safety-standards/',
  '/balance-bike-weight/',
  '/balance-bike-stability/',
  '/balance-bike-by-age/',
  '/kids-bike-by-age/',
  '/kids-bike-price/',
  '/kids-bike-safety-standards/',
  '/kids-bike-weight/',
  '/balance-bike-what-buyers-say/',
  '/balance-bike-budget/',
  '/guides/risk/balance-bike-recall-record',
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
  // 2026-10-20 reference-cluster batch — the three guides that take the block
  // to 8/8 CMS-backed cards.
  '/guides/beginner/balance-bike-by-age',
  '/guides/beginner/balance-bike-what-buyers-say',
  '/guides/scenario/balance-bike-stability',
  // 2026-10-22 A2 batch — the industry article backing the /news hub keyword
  // "electric dirt bike for kids".
  '/news/industry/electric-dirt-bikes-for-kids',
];

// Every hub must still link its own topic indexes AFTER hydration. The
// prerendered hub HTML is not enough: everything it emits lives inside #root,
// which React replaces on mount, so a link that only exists in the prerender
// is gone from the DOM a JS-running crawler actually reads. /guides shipped
// exactly that bug (2026-10-22): the prerender linked one of six topic
// indexes, and the hydrated page linked none.
const HUB_TOPIC_CHILDREN = {
  '/guides': [
    '/guides/beginner',
    '/guides/scenario',
    '/guides/budget',
    '/guides/risk',
    '/guides/special',
    '/guides/maintenance',
  ],
  '/news': ['/news/brand_news', '/news/industry', '/news/new_product', '/news/science'],
  '/reviews': ['/reviews/compare', '/reviews/single'],
};

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
// Static-HTML reference for the keywords comparison: one shared request
// context, plain GETs (redirects, if any, are followed to the final 200).
const reqCtx = await browser.newContext();
const staticKeywordsCache = new Map();
// The prerender HTML-escapes attribute values (children&#39;s), while
// getAttribute returns the decoded string (children's). Decode the static side
// before comparing or every keyword containing an apostrophe "diverges".
function decodeEntities(s) {
  return s
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}
async function staticKeywordsFor(route) {
  if (staticKeywordsCache.has(route)) return staticKeywordsCache.get(route);
  const res = await reqCtx.request.get(base + route);
  const html = await res.text();
  const m = html.match(/<meta\s+name="keywords"\s+content="([^"]*)"/i);
  const kw = m ? decodeEntities(m[1]) : null;
  staticKeywordsCache.set(route, kw);
  return kw;
}
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
          // The hydrated keywords meta. The A1 bug blanked this (the SPA effect
          // ran with an empty array); the A2 source split had it disagree with
          // the prerendered value. Both are invisible to curl.
          keywords: document.querySelector('meta[name="keywords"]')?.getAttribute('content') || null,
          // A markdown marker that survived into the hydrated DOM means the
          // app's renderer parsed a syntax level the prerender's did (or the
          // other way round). The static HTML looked perfect the whole time.
          mdLeak: (body.match(/^#{2,4}\s+\S/gm) || []).slice(0, 3),
          // Every href in the hydrated DOM. Compared against HUB_TOPIC_CHILDREN
          // below: a hub that drops its topic-index links on hydration orphans
          // those pages, and only a browser can see it.
          hrefs: Array.from(document.querySelectorAll('a[href^="/"]')).map((a) =>
            a.getAttribute('href').split('?')[0].split('#')[0].replace(/\/$/, '')
          ),
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
    const short = (v) => String(v.message || v).slice(0, 100);
    let why = null;
    if (navError) why = `nav: ${short(navError)}`;
    else if (probe.recovery) why = 'recovery-mode';
    else if (probe.mdLeak?.length) why = `markdown leak: ${probe.mdLeak.join(', ')}`;
    else if (pageErrors.length) why = pageErrors[0];
    else if (!res || res.status() >= 400) why = `HTTP ${res?.status()}`;
    else if (!probe.keywords) why = 'hydrated keywords blank — prerender set lost after hydration (the A1 bug)';
    else {
      const staticKw = await staticKeywordsFor(route);
      if (staticKw === null) why = 'static HTML has no keywords meta — prerender stopped emitting';
      else if (staticKw !== probe.keywords) {
        why = `keywords diverge — static "${staticKw}" vs hydrated "${probe.keywords}"`;
      } else {
        const children = HUB_TOPIC_CHILDREN[route];
        if (children) {
          const missing = children.filter((c) => !probe.hrefs.includes(c));
          if (missing.length) {
            why = `hub does not link its topic index(es) after hydration: ${missing.join(', ')}`;
          }
        }
      }
    }

    if (why) {
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
console.log(`\nhydration-probe OK — ${ROUTES.length} route(s) hydrate clean (no recovery mode, no pageerror, keywords survive hydration).`);
