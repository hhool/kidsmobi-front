// Weekly site health check for balancebiketoddler.com.
// Covers: robots.txt, sitemap freshness, key-page meta completeness, llms.txt,
// and an internal-link sample. Outputs a pass/warn/fail report + score.
//
// Usage: node scripts/seo/site-health-check.mjs
// Env: SEO_SITE_BASE_URL

import {
  SITE_BASE,
  SITEMAP_URL,
  ROBOTS_URL,
  LLMS_URL,
  SITEMAP_BASELINE_COUNT,
  note,
  summarize,
} from './config.mjs';

// Curated high-value routes to verify (mix of hub, asset, transparency).
const KEY_URLS = [
  '/',
  '/products',
  '/reviews',
  '/guides',
  '/news',
  '/about',
  '/balance-bike-stability/',
  '/balance-bike-budget/',
  '/balance-bike-what-buyers-say/',
  '/transparency/testing-methodology/',
  '/transparency/certification-lab-notes/',
];

// Transient network blips (local proxy resets, DNS hiccups) must not be
// scored as site errors — run r4 (2026-10-18) dropped 100 -> 97 because a
// single fetch failure inside the internal-links sample counted as a broken
// link. fetchRetry retries network errors and 5xx once, then rethrows/returns
// the last outcome; callers decide how to classify it.
async function fetchRetry(url, options = {}, attempts = 2) {
  let lastError;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, options);
      if (res.status < 500 || i === attempts - 1) return res;
      lastError = new Error(`HTTP ${res.status}`);
    } catch (e) {
      lastError = e;
    }
    await new Promise((r) => setTimeout(r, 300 * (i + 1)));
  }
  throw lastError;
}

async function getText(url) {
  const res = await fetchRetry(url, { redirect: 'follow' });
  return { res, text: await res.text() };
}

async function main() {
  const results = [];

  // 1. robots.txt
  try {
    const { res, text } = await getText(ROBOTS_URL);
    const ok = res.ok && text.includes('Sitemap:') && text.includes('User-agent: *');
    results.push(
      note(ok ? 'pass' : 'fail', 'robots.txt', `status=${res.status}, sitemap=${text.includes('Sitemap:')}, wildcard=${text.includes('User-agent: *')}`)
    );
  } catch (e) {
    results.push(note('fail', 'robots.txt', String(e).slice(0, 120)));
  }

  // 2. sitemap
  let sitemapUrls = [];
  try {
    const { res, text } = await getText(SITEMAP_URL);
    sitemapUrls = [...text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
    if (res.ok && sitemapUrls.length > 0) {
      const delta = sitemapUrls.length - SITEMAP_BASELINE_COUNT;
      const lvl = Math.abs(delta) <= 10 ? 'pass' : 'warn';
      results.push(
        note(lvl, 'sitemap.xml', `${sitemapUrls.length} URLs (baseline ${SITEMAP_BASELINE_COUNT}, delta ${delta > 0 ? '+' : ''}${delta})`)
      );
    } else {
      results.push(note('fail', 'sitemap.xml', `status=${res.status}, urls=${sitemapUrls.length}`));
    }
  } catch (e) {
    results.push(note('fail', 'sitemap.xml', String(e).slice(0, 120)));
  }

  // 3. key pages meta completeness
  for (const u of KEY_URLS) {
    const url = SITE_BASE + u;
    try {
      const { res, text } = await getText(url);
      if (!res.ok) {
        results.push(note('fail', `page ${u}`, `HTTP ${res.status}`));
        continue;
      }
      const title = /<title>([^<]*)<\/title>/i.test(text);
      const desc = /<meta[^>]+name=["']description["'][^>]*>/i.test(text);
      const kw = /<meta[^>]+name=["']keywords["'][^>]*>/i.test(text);
      const canon = /rel=["']canonical["']/i.test(text);
      const jsonld = /application\/ld\+json/i.test(text);
      const missing = [];
      if (!title) missing.push('title');
      if (!desc) missing.push('description');
      if (!kw) missing.push('keywords');
      if (!canon) missing.push('canonical');
      if (!jsonld) missing.push('json-ld');
      const lvl = missing.length === 0 ? 'pass' : missing.length <= 1 ? 'warn' : 'fail';
      results.push(
        note(lvl, `page ${u}`, missing.length ? `missing: ${missing.join(', ')}` : 'title/desc/keywords/canonical/json-ld all present')
      );
    } catch (e) {
      results.push(note('fail', `page ${u}`, String(e).slice(0, 120)));
    }
  }

  // 3b. Nested prerender routes must serve their OWN meta, not the homepage's.
  // A wildcard rewrite in _redirects takes precedence over Pages' static asset
  // tree, so a stray `/products/* / 200` answers every prerendered page under
  // that prefix with the homepage shell: HTTP 200, title and canonical both
  // pointing at "/". Neither a status-code probe nor the hydration probe can
  // see it (the SPA repairs the DOM after hydration), so this reads the raw
  // HTML and compares against the homepage's signature. This is the check
  // that was missing when 255/269 URLs shipped as homepage copies.
  try {
    const { text: homeText } = await getText(SITE_BASE + '/');
    const homeTitle = (/<title>([^<]*)<\/title>/i.exec(homeText) || [])[1]?.trim() || '';
    const homeCanon = (/rel=["']canonical["'][^>]*href=["']([^"']+)["']/i.exec(homeText) || [])[1]?.trim() || '';
    // Nested = under an app prefix with at least one further segment, so the
    // bare hubs (which Pages serves natively) are excluded.
    const nested = sitemapUrls
      .map((u) => { try { return new URL(u).pathname; } catch { return ''; } })
      .filter((p) => /^\/(products|guides|reviews|news|transparency)\/[^/]+/.test(p));
    // Spread the sample across prefixes so one broken prefix cannot hide
    // behind another healthy one.
    const byPrefix = new Map();
    for (const p of nested) {
      const key = p.split('/')[1];
      if (!byPrefix.has(key)) byPrefix.set(key, []);
      byPrefix.get(key).push(p);
    }
    const sample = [...byPrefix.values()].flatMap((list) => list.slice(0, 2)).slice(0, 10);
    let shadowed = 0;
    const offenders = [];
    for (const p of sample) {
      try {
        const { res, text } = await getText(SITE_BASE + p);
        if (!res.ok) { shadowed++; offenders.push(`${p} (HTTP ${res.status})`); continue; }
        const title = (/<title>([^<]*)<\/title>/i.exec(text) || [])[1]?.trim() || '';
        const canon = (/rel=["']canonical["'][^>]*href=["']([^"']+)["']/i.exec(text) || [])[1]?.trim() || '';
        const isHome = (homeTitle && title === homeTitle) || (homeCanon && canon === homeCanon);
        if (isHome || !canon) {
          shadowed++;
          offenders.push(`${p} (title="${title.slice(0, 40)}", canonical="${canon || 'missing'}")`);
        }
      } catch (e) {
        offenders.push(`${p} (fetch failed: ${String(e).slice(0, 40)})`);
      }
    }
    const netOnly = offenders.length > 0 && offenders.every((o) => o.includes('fetch failed'));
    const lvl = shadowed === 0 ? 'pass' : netOnly ? 'warn' : 'fail';
    results.push(
      note(
        lvl,
        'prerender-meta-ownership',
        shadowed === 0
          ? `${sample.length} nested route(s) serve their own title + canonical`
          : `${shadowed}/${sample.length} nested route(s) serve the homepage shell — a wildcard _redirects rule is shadowing the prerendered pages: ${offenders.slice(0, 4).join('; ')}`
      )
    );
  } catch (e) {
    results.push(note('warn', 'prerender-meta-ownership', `could not sample: ${String(e).slice(0, 80)}`));
  }

  // 3c. The five bare app roots must actually be reachable. They are SPA-only
  // routes with no prerendered sibling, served by exact "_redirects" rewrites
  // to "/". This family broke on 2026-10-21 in a way no other check could see:
  // the exact rules targeted "/index.html", so the no-slash form 308-redirected
  // to "/" (path lost, SPA showed the homepage) while the slash form 404ed —
  // an exact source matches only the form written. Probes that follow
  // redirects saw 200 at the homepage and missed both. Fetched with
  // redirect:'manual' so a 308 surfaces as a 308, and BOTH URL forms are
  // asserted.
  try {
    const BARE_ROOTS = ['/compare', '/auth', '/search', '/evaluations', '/transparency'];
    const broken = [];
    for (const root of BARE_ROOTS) {
      for (const form of [root, `${root}/`]) {
        const res = await fetchRetry(SITE_BASE + form, { redirect: 'manual' });
        if (res.status !== 200) broken.push(`${form} (HTTP ${res.status})`);
      }
    }
    results.push(
      note(
        broken.length === 0 ? 'pass' : 'fail',
        'bare-app-roots-reachable',
        broken.length === 0
          ? `${BARE_ROOTS.length} root(s) x 2 forms all answer 200 (exact _redirects rewrite to "/")`
          : `${broken.length}/10 form(s) unreachable — each bare app root needs an exact rewrite to "/" in BOTH URL forms: ${broken.join('; ')}`
      )
    );
  } catch (e) {
    results.push(note('warn', 'bare-app-roots-reachable', `could not probe: ${String(e).slice(0, 80)}`));
  }

  // 4. llms.txt
  try {
    const { res, text } = await getText(LLMS_URL);
    if (res.ok && text.trim().length > 50) results.push(note('pass', 'llms.txt', `${text.length} bytes`));
    else results.push(note('fail', 'llms.txt', `status=${res.status}, len=${text.length}`));
  } catch (e) {
    results.push(note('fail', 'llms.txt', String(e).slice(0, 120)));
  }

  // 5. internal-link sample from homepage
  try {
    const { text } = await getText(SITE_BASE + '/');
    const hrefs = [...text.matchAll(/href=["'](\/[^"']*)["']/g)].map((m) => m[1]).filter((h) => !h.includes('?'));
    const sample = [...new Set(hrefs)].slice(0, 15);
    // broken = the server answered with 4xx/5xx (a real dead link);
    // netFailed = fetch itself kept failing after one retry (local network
    // trouble, not evidence about the link). Only "broken" counts against
    // the score; netFailed is reported for visibility.
    let broken = 0;
    let netFailed = 0;
    for (const h of sample) {
      try {
        const r = await fetchRetry(SITE_BASE + h, { method: 'HEAD', redirect: 'follow' });
        if (r.status >= 400) broken++;
      } catch {
        netFailed++;
      }
    }
    const systemic = sample.length > 0 && netFailed === sample.length;
    const lvl = broken > 0 || systemic ? 'warn' : 'pass';
    const detail =
      `sampled ${sample.length}, broken=${broken}` +
      (netFailed ? `, net-unresolved=${netFailed} (retried, not counted as broken)` : '');
    results.push(note(lvl, 'internal-links', detail));
  } catch (e) {
    results.push(note('warn', 'internal-links', `could not sample: ${String(e).slice(0, 80)}`));
  }

  const s = summarize(results);
  console.log('\n=== Site Health Check ===');
  results.forEach((r) => console.log(`[${r.level.toUpperCase()}] ${r.name}: ${r.detail}`));
  console.log(`\nSCORE: ${s.score}/100  (pass ${s.pass}, warn ${s.warn}, fail ${s.fail} of ${s.total})`);
  process.exit(s.fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
