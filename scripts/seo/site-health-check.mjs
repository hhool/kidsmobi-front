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
  '/balance-bike-what-buyers-say/',
  '/transparency/testing-methodology/',
  '/transparency/certification-lab-notes/',
];

async function getText(url) {
  const res = await fetch(url, { redirect: 'follow' });
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
    let broken = 0;
    for (const h of sample) {
      try {
        const r = await fetch(SITE_BASE + h, { method: 'HEAD', redirect: 'follow' });
        if (r.status >= 400) broken++;
      } catch {
        broken++;
      }
    }
    results.push(note(broken === 0 ? 'pass' : 'warn', 'internal-links', `sampled ${sample.length}, broken=${broken}`));
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
