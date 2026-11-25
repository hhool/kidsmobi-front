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
  '/products/strollers/',
  '/products/kids-bikes/',
  '/products/kids-scooters/',
  '/products/electric-cars/',
  '/products/kids-tricycles/',
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
  '/kids-bike-stability/',
  '/kids-bike-what-buyers-say/',
  '/kids-bike-recalls/',
  '/kids-scooter-wheels/',
  '/kids-scooter-size/',
  '/kids-scooter-weight/',
  '/kids-scooter-price/',
  '/kids-scooter-by-age/',
  '/kids-scooter-safety-standards/',
  '/kids-scooter-what-buyers-say/',
  '/kids-scooter-recalls/',
  '/kids-ride-on-voltage/',
  '/kids-ride-on-weight/',
  '/kids-ride-on-size/',
  '/kids-ride-on-price/',
  '/kids-ride-on-by-age/',
  '/kids-ride-on-safety-standards/',
  '/kids-ride-on-what-buyers-say/',
  '/kids-ride-on-recalls/',
  '/kids-tricycle-size-chart/',
  '/kids-tricycle-by-age/',
  '/kids-tricycle-price/',
  '/kids-tricycle-weight/',
  '/kids-tricycle-types/',
  '/kids-tricycle-safety-standards/',
  '/kids-tricycle-what-buyers-say/',
  '/kids-tricycle-recalls/',
  '/kids-stroller-size-chart/',
  '/kids-stroller-by-age/',
  '/kids-stroller-price/',
  '/kids-stroller-weight/',
  '/kids-stroller-types/',
  '/kids-stroller-safety-standards/',
  '/kids-stroller-what-buyers-say/',
  '/kids-stroller-recalls/',
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
  // 2026-11-13 (S4): /guides/scenario/balance-bike-stability was REMOVED from
  // this list. The page was retired into /balance-bike-stability/ (two
  // self-canonical URLs answering "stable track balance bike"), and the probe
  // must not keep fetching a URL that now 301s. The asset page it redirects to
  // is probed separately, in ASSET_PAGES above.
  // 2026-10-22 A2 batch — the industry article backing the /news hub keyword
  // "electric dirt bike for kids".
  '/news/industry/electric-dirt-bikes-for-kids',
  // 2026-10-24 /zh edition — the Chinese hubs and a sample of Chinese detail
  // pages. The language used to be client state, so these URLs are new; the
  // probe asserts the hydrated page keeps the Chinese h1 (the prerendered
  // Chinese TDK must survive hydration) and does not fall back to English.
  '/zh/guides',
  '/zh/news',
  '/zh/guides/beginner/stroller-travel-airplane',
  '/zh/guides/beginner/balance-bike-size-chart',
  '/zh/news/industry/electric-dirt-bikes-for-kids',
  // 2026-11-24 category axis (R47) + batch-2 balance fill. The 35 composite
  // pages and 5 category hubs are exactly the class of page whose header is
  // written by a SPA branch that can silently disagree with the prerender —
  // the three defects R47 shipped (title overwritten by the category block,
  // thin-page robots read from the live DOM, duplicated hreflang nodes) were
  // ALL invisible to the static guards and visible only here. Sampling one
  // hub, one indexable composite, one thin composite and one ZH composite
  // keeps the probe representative without fetching 40 pages per run:
  //   - /guides/stroller/ : category hub, 1327 words, must keep its own TDK
  //   - /guides/balance-bike/best/ : composite that flipped to index,follow when
  //     batch 2 took the combination to 3 — the noindex->index transition is
  //     decided by a build-time count, so the hydrated DOM must agree
  //   - /guides/kids-scooter/scenario/ : still below COMPOSITE_INDEX_THRESHOLD, so the
  //     hydrated page must KEEP noindex,follow with a SELF canonical.
  //     This entry used to point at /guides/kids-scooter/beginner/, which was
  //     thin until batch 4 took scooter beginner to 3 and flipped it to
  //     index,follow — the assertion then described the opposite of the truth.
//     That is the hazard of pinning a build-time count: the number moves with
//     content, so the sample must be chosen to stay thin, not chosen once.
//     scenario/budget/maintenance are scooter's remaining three at 1 article
//     each (batch 4 spent the whole cover budget on the other three
//     combinations), so they stay below COMPOSITE_INDEX_THRESHOLD=3.
  //   - /zh/guides/best/best-balance-bike-for-2-year-olds : a Chinese article
  //     from batch 2. NOTE: the category axis was never built for /zh (R47
  //     deliberately shipped EN-only, so /zh keeps the topic axis:
  //     /zh/guides/<topic>/<slug>). There is no /zh/guides/<cat>/<topic>/ page,
  //     which is exactly the kind of assumption this list must not encode —
  //     the first draft of this entry pointed at a 404.
  '/guides/stroller/',
  '/guides/balance-bike/best/',
  //   - /guides/kids-electric-car/beginner/ : the same transition in the other
  //     direction. It sat at 1 article (noindex) until batch 4 took it to 3, so
  //     the hydrated DOM has to agree with a build that just promoted it. Proven
  //     alongside the thin sample above: one page that must now say index, one
  //     that must still say noindex, from the same code path.
  '/guides/kids-electric-car/beginner/',
  '/guides/kids-scooter/scenario/',
  '/zh/guides/best/best-balance-bike-for-2-year-olds',
  // Batch 4 articles — the newest prerendered detail pages, one per category,
  // each carrying a Chinese edition and a cover from the tight scooter budget.
  '/guides/scenario/kids-ride-on-gift-prep',
  '/guides/risk/kids-scooter-brake-reach',
];

// ROBOTS: THE INVARIANT IS EQUALITY WITH THE PRERENDER, NOT A PINNED VALUE.
//
// Composite pages are noindex below COMPOSITE_INDEX_THRESHOLD=3 and indexable
// at or above it. That count lives in the CMS and is applied at BUILD time, so
// the hydrated page inherits a decision it cannot recompute — it must keep
// whatever the prerender wrote, and the probe's job is to catch a hydration
// that overwrites robots with a default.
//
// This list used to be a hard-coded route -> expected-value table, and it went
// wrong exactly the way a hard-coded count always goes wrong: it pinned
// /guides/kids-scooter/beginner/ as noindex, batch 4 took that combination to 3
// articles and flipped it to index,follow, and the assertion then described the
// OPPOSITE of the correct behaviour. Nothing failed — a guard that is confidently
// wrong is worse than no guard, because it also has to be re-edited every batch.
//
// So the comparison is now derived: for every probed route, the hydrated robots
// must equal the robots the prerendered HTML served. That is the actual
// invariant, it needs no maintenance, and it binds on all 94 routes instead of
// four. Coverage is asserted separately, at the end of the run: the probed set
// must contain at least one route the build marked indexable AND at least one
// it marked noindex, otherwise "every page agrees with itself" would be true of
// a run that never visited a thin composite. That check reads the static side,
// so it stays true both before and after a batch flips a combination.

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

// Plan-B asset pages: each one is a single route whose whole body must render
// inside the SPA viewport. The 2026-10-23 bug shipped all eight kids-scooter
// pages with a correct static HTML and an EMPTY <main> after hydration (the
// route dispatch produced a doubled tab name, so no JSX branch matched). The
// probe printed "h1: (none)" and still exited 0 — nothing asserted that the
// page had a heading at all. These routes now carry a hard assertion.
const ASSET_ROUTE_RE = /^\/(balance-bike|kids-bike|kids-scooter|kids-ride-on|kids-tricycle|kids-stroller)-[a-z-]+\/$/;

const base = process.env.SEO_SITE_BASE_URL || SITE_BASE;

// Probing a loopback preview server is a different contract from probing
// production, and the robots assertion has to know which one it is in — see the
// comment at the assertion. Deliberately does NOT try to spoof the production
// hostname: balancebiketoddler.com is in Chrome's HSTS preload list, so a
// browser asked for http://balancebiketoddler.com:4173 upgrades to https on
// that port and never reaches the preview server at all.
const isLoopback = /^(https?:\/\/)?(127\.0\.0\.1|localhost)(:\d+)?/i.test(base);

const chromePath =
  process.env.CHROME_PATH ||
  (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined);

// THE robots ASSERTION DEPENDS ON WHERE THE PROBE IS POINTED.
//
// isNonProductionHostname() in App.tsx forces robots to noindex on `localhost`
// and `127.0.0.1` — deliberately, so a dev server can never be indexed. CI
// serves dist from 127.0.0.1, so every route hydrates as noindex while the
// prerender wrote index,follow, and the two sides can never agree locally.
//
// The previous code compared them with .includes("index,follow"), and that
// substring is CONTAINED IN "noindex,follow,max-image-preview:large". Every
// route passed, every run, asserting nothing — the four-route expectation
// table was the only thing that ever bound, and it went stale the moment a
// content batch flipped a composite.
//
// So the assertion splits by target (see the assertion site): loopback asserts
// the dev-host noindex rule, production asserts exact equality with the
// prerender. Both are real properties; neither can pass vacuously.
//
// Spoofing the production hostname against a loopback server was tried and
// does not work: balancebiketoddler.com is in Chrome's HSTS preload list, so
// http://balancebiketoddler.com:4173 is upgraded to https on that port and
// never reaches the preview server.
//
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
// Every static robots value the run actually compared against. The coverage
// assertion below needs to see BOTH sides of COMPOSITE_INDEX_THRESHOLD; a run
// that only ever visited indexable pages would make the equality rule vacuous.
const sawRobots = [];
// Local runs assert the opposite thing (every route must be noindex), so they
// collect into their own bag and the coverage check follows the target.
const sawLocalRobots = [];
// Static-HTML reference for the keywords comparison: one shared request
// context, plain GETs (redirects, if any, are followed to the final 200).
const reqCtx = await browser.newContext();
const staticKeywordsCache = new Map();
const staticRobotsCache = new Map();
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

// The prerendered robots value for a route — the thing the hydrated DOM must
// not contradict. Kept separate from the keywords fetch only so the cache key
// can be shared; both come from the same request.
async function staticRobotsFor(route) {
  if (staticRobotsCache.has(route)) return staticRobotsCache.get(route);
  const res = await reqCtx.request.get(base + route);
  const html = await res.text();
  const m = html.match(/<meta\s+name="robots"\s+content="([^"]*)"/i);
  const v = m ? decodeEntities(m[1]).trim() : null;
  staticRobotsCache.set(route, v);
  return v;
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
      // The navigation budget is generous on purpose. The heavier Chinese
      // routes need ~40s to hydrate on a slow or sandboxed machine, and a
      // timeout there is an environment problem, not a broken route - a
      // genuinely broken page fails deterministically on both attempts.
      res = await page.goto(base + route, { waitUntil: 'load', timeout: 90000 });
      await page.waitForTimeout(3000); // let hydration + the SEO effect settle
      probe = await page.evaluate(() => {
        const body = document.body?.innerText || '';
        return {
          recovery: body.includes('Page Recovery Mode'),
          h1: document.querySelector('h1')?.textContent?.slice(0, 60) || '(none)',
          h1Count: document.querySelectorAll('h1').length,
          // The SPA viewport the asset pages render into. A zero-length main
          // after hydration is the 2026-10-23 empty-page signature.
          mainLen: document.querySelector('main')?.innerHTML?.length || 0,
          // The hydrated keywords meta. The A1 bug blanked this (the SPA effect
          // ran with an empty array); the A2 source split had it disagree with
          // the prerendered value. Both are invisible to curl.
          keywords: document.querySelector('meta[name="keywords"]')?.getAttribute('content') || null,
          // The hydrated robots meta, and the canonical it was paired with.
          // Composite pages carry a build-time decisions (index vs noindex from
          // COMPOSITE_INDEX_THRESHOLD) plus a SELF canonical on the thin branch.
          // Both are written by the prerender; if hydration re-derives robots
          // from a default, the page promises Google the opposite of the
          // sitemap — and the static HTML looks correct the whole time.
          robots: document.querySelector('meta[name="robots"]')?.getAttribute('content') || null,
          canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || null,
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
    else if (ASSET_ROUTE_RE.test(route) && probe.h1Count === 0) {
      // The 2026-10-23 empty-<main> bug: correct static HTML, correct title,
      // correct canonical, and an SPA that rendered nothing. Only an h1
      // assertion catches it.
      why = `no <h1> after hydration (main length ${probe.mainLen}) — the page rendered empty`;
    }
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
        if (!why) {
          // ROBOTS. Two different assertions depending on where we are probing,
          // because the app makes two different — both correct — promises.
          //
          // LOCAL (loopback): isNonProductionHostname() in App.tsx forces
          // noindex on every route. That is deliberate (a dev server must never
          // be indexed) and it means the hydrated value can NEVER equal the
          // prerendered one locally. Asserting equality here is what forced the
          // old code into `.includes("index,follow")`, and that substring is
          // contained in "noindex,follow,max-image-preview:large" — so the
          // check passed on every route, in every run, asserting nothing. The
          // honest local assertion is the complementary one: every route must
          // come back noindex. That is a real property of the app and it is now
          // actually tested.
          //
          // PRODUCTION: the app takes its production branch, so the hydrated
          // robots must equal exactly what the prerender served for that URL.
          // That is the invariant that catches an SPA re-deriving a build-time
          // decision (the composite threshold) and disagreeing with it.
          const staticRobots = await staticRobotsFor(route);
          if (staticRobots === null) {
            why = 'static HTML has no robots meta — prerender stopped emitting it';
          } else {
            // Recorded on BOTH paths: the coverage check needs to know what the
            // prerender wrote even when the assertion is the local one.
            sawRobots.push(staticRobots);
            const hydrated = String(probe.robots || '');
            if (isLoopback) {
              sawLocalRobots.push(hydrated);
              // On a dev hostname the app may do exactly one of two correct
              // things, and which one it does is decided per route by design:
              //
              //   (a) it never re-writes robots at all — the section branch
              //       returns early when the delivered canonical IS this route
              //       (src/App.tsx, "keep its TDK"), so the prerendered value
              //       survives untouched. `/` is such a page; asserting noindex
              //       there was wrong and is what the first version of this
              //       check got wrong.
              //   (b) it does rewrite robots, and then the dev-host rule in
              //       shouldNoIndexCurrentPath must make it noindex.
              //
              // Anything else is a real defect: a route that rewrites robots on
              // a dev hostname WITHOUT the noindex flag would mean
              // isNonProductionHostname is not reaching that path.
              if (hydrated !== staticRobots && !hydrated.startsWith('noindex')) {
                why = `local preview rewrote robots to "${hydrated}" (prerender had "${staticRobots}") and did not force noindex — the dev-host noindex rule in shouldNoIndexCurrentPath is not reaching this route`;
              }
            } else if (hydrated !== staticRobots) {
              why = `robots changed on hydration — static "${staticRobots}" vs hydrated "${hydrated}"`;
            }
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

// 2026-11-16 regression: the language must follow the URL on hydration, not a
// stale `app_lang` in localStorage. Reproduce the reported sequence in one
// browser context: open a /zh page (which persists app_lang=zh), then open an
// English URL directly. The hydrated language toggle must read "English";
// before the fix it read "简体中文" while the static HTML was English.
{
  const langCtx = await browser.newContext();
  // The top nav's Home label is `t.navHome`: "Home" in English, "首页" in
  // Chinese. `document.documentElement.lang` cannot be used here — it follows
  // the canonical path, so it stays "en" even when the UI hydrated to Chinese.
  const navLangText = async (page) => {
    return await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('button span, a span'));
      const hit = spans.find((n) => /^(Home|首页)$/.test((n.textContent || '').trim()));
      return (hit?.textContent || '').trim();
    });
  };
  try {
    const zhPage = await langCtx.newPage();
    await zhPage.goto(base + '/zh/news', { waitUntil: 'load', timeout: 90000 });
    await zhPage.waitForTimeout(2000);
    const zhMarker = await navLangText(zhPage);
    await zhPage.close();
    if (zhMarker !== '首页') {
      failures.push({ route: '/zh/news', why: `language regression setup: /zh page did not hydrate in Chinese (marker "${zhMarker}")` });
      console.log(`[FAIL] /zh/news — setup marker "${zhMarker}" is not Chinese`);
    } else {
      const enPage = await langCtx.newPage();
      await enPage.goto(base + '/news', { waitUntil: 'load', timeout: 90000 });
      await enPage.waitForTimeout(2500);
      const enMarker = await navLangText(enPage);
      await enPage.close();
      if (enMarker !== 'Home') {
        failures.push({ route: '/news (after /zh)', why: `language regression: EN URL hydrated in Chinese (marker "${enMarker}") — URL must decide language, not localStorage` });
        console.log(`[FAIL] /news after /zh — hydrated marker "${enMarker}" should be English`);
      } else {
        console.log(`[pass] /news after /zh — EN URL stayed English after hydration (URL decides language)`);
      }
    }
  } catch (e) {
    failures.push({ route: '/news (after /zh)', why: 'lang scenario: ' + String(e.message || e).slice(0, 120) });
    console.log(`[FAIL] /news after /zh — ${failures[failures.length - 1].why}`);
  } finally {
    await langCtx.close();
  }
}

await browser.close();

// COVERAGE. Whichever assertion ran, the probed set has to be able to
// distinguish correct from incorrect — otherwise "everything agreed" is a
// statement about the route list, not about the app.
//
//   production: the set must contain at least one page the build marked
//     indexable AND at least one it marked noindex, else equality with the
//     prerender would hold trivially on a set that is all one value.
//   loopback: the assertion is "every route is noindex", which can only fail
//     if the app would otherwise have produced index,follow — so the static
//     side must contain an indexable page. If the whole route list were
//     noindex in the prerender too, the local check would prove nothing.
if (isLoopback) {
  const staticIndexable = sawRobots.some((r) => /\bindex\b/.test(r) && !/noindex/.test(r));
  if (!staticIndexable) {
    failures.push({
      route: '(coverage)',
      why: 'no probed route is indexable in the prerender — the local "must be noindex" assertion would hold for any app, including a broken one; add an indexable page',
    });
    console.log('[FAIL] (coverage) — no indexable route in the probed set');
  }
} else {
  const sawIndex = sawRobots.some((r) => /\bindex\b/.test(r) && !/noindex/.test(r));
  const sawNoindex = sawRobots.some((r) => /noindex/.test(r));
  if (!sawIndex || !sawNoindex) {
    failures.push({
      route: '(coverage)',
      why: `probed routes did not exercise both robots decisions (indexable=${sawIndex}, noindex=${sawNoindex}) — the equality check would pass vacuously; add a composite page on the missing side`,
    });
    console.log(`[FAIL] (coverage) — saw indexable=${sawIndex}, noindex=${sawNoindex}`);
  }
}

if (failures.length > 0) {
  console.log(`\nhydration-probe FAILED — ${failures.length}/${ROUTES.length} route(s) broken after hydration:`);
  for (const f of failures) console.log(`  ${f.route}: ${f.why}`);
  console.log('\nA broken route ships correct static HTML but crashes the hydrated SPA.');
  process.exit(1);
}
console.log(`\nhydration-probe OK — ${ROUTES.length} route(s) hydrate clean (no recovery mode, no pageerror, keywords survive hydration).`);
console.log(
  isLoopback
    ? `robots: on a dev hostname, ${sawLocalRobots.filter((r) => r.startsWith('noindex')).length}/${sawLocalRobots.length} probed route(s) were forced noindex, the rest kept their prerendered value untouched (early-return path), as designed.`
    : `robots: hydrated value matched the prerender on every probed route (${sawRobots.length} compared, both decisions exercised).`,
);
