// Weekly GEO (Generative Engine Optimization) ops for balancebiketoddler.com.
// Answer engines (ChatGPT, Claude, Perplexity, Bing Copilot) read llms.txt,
// robots.txt crawler policy, structured data, and citation-ready factual blocks.
// This script audits those GEO signals and reports readiness.
//
// Usage: node scripts/seo/geo-ops.mjs
// Env: SEO_SITE_BASE_URL

import { SITE_BASE, ROBOTS_URL, LLMS_URL, SITEMAP_URL, note, summarize } from './config.mjs';

// Crawlers we care about for GEO / AI visibility.
const AI_CRAWLERS = [
  'GPTBot',
  'ClaudeBot',
  'PerplexityBot',
  'Google-Extended',
  'CCBot',
  'Applebot-Extended',
  'Bytespider',
  'meta-externalagent',
  'Amazonbot',
];

// These must be allowed for answer engines to read the site (GEO depends on it).
const GEO_REQUIRED = ['GPTBot', 'ClaudeBot', 'PerplexityBot'];

async function getText(url) {
  const res = await fetch(url, { redirect: 'follow' });
  return { res, text: await res.text() };
}

async function main() {
  const results = [];

  // 1. llms.txt
  try {
    const { res, text } = await getText(LLMS_URL);
    const structured = /^## /m.test(text) && /\[.*\]\(http/.test(text);
    results.push(
      note(res.ok && structured ? 'pass' : 'warn', 'llms.txt', `status=${res.status}, structured=${structured}, ${text.length} bytes`)
    );
  } catch (e) {
    results.push(note('fail', 'llms.txt', String(e).slice(0, 120)));
  }

  // 2. robots.txt crawler policy
  try {
    const { res, text } = await getText(ROBOTS_URL);
    const blocks = text.split(/User-agent:/i).slice(1);
    const disallowed = [];
    for (const b of blocks) {
      const agent = b.split('\n')[0].trim();
      if (AI_CRAWLERS.some((c) => agent.toLowerCase().includes(c.toLowerCase())) && /Disallow:\s*\//i.test(b)) {
        disallowed.push(agent);
      }
    }
    results.push(note('pass', 'robots-ai', `explicitly disallowed: ${disallowed.join(', ') || 'none'}`));
    const allowedForGeo = GEO_REQUIRED.filter((c) => !disallowed.some((d) => d.toLowerCase().includes(c.toLowerCase())));
    results.push(
      note(allowedForGeo.length === GEO_REQUIRED.length ? 'pass' : 'fail', 'geo-crawlers', `allowed for answer engines: ${allowedForGeo.join(', ') || 'NONE'}`)
    );
  } catch (e) {
    results.push(note('fail', 'robots-ai', String(e).slice(0, 120)));
  }

  // 3. JSON-LD structured data on representative page types
  let detail = '';
  let guide = '';
  try {
    const { text } = await getText(SITEMAP_URL);
    const urls = [...text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    detail = urls.find((u) => /\/products\/balance-bikes\/[^\/]+\/?$/.test(u)) || '';
    guide = urls.find((u) => /\/guides\//.test(u)) || '';
  } catch {
    /* ignore */
  }
  const checks = [
    { url: '/', label: 'home' },
    { url: '/products/balance-bikes/', label: 'category' },
    { url: '/balance-bike-stability/', label: 'asset' },
  ];
  if (detail) checks.push({ url: detail, label: 'product-detail' });
  if (guide) checks.push({ url: guide, label: 'guide' });

  for (const c of checks) {
    try {
      const url = c.url.startsWith('http') ? c.url : SITE_BASE + c.url;
      const { res, text } = await getText(url);
      const has = /application\/ld\+json/i.test(text);
      results.push(note(has ? 'pass' : 'warn', `json-ld:${c.label}`, has ? 'present' : 'missing'));
    } catch (e) {
      results.push(note('warn', `json-ld:${c.label}`, String(e).slice(0, 80)));
    }
  }

  // 4. Fact-ready blocks (FAQ / tables) on asset + transparency pages
  for (const u of ['/balance-bike-stability/', '/balance-bike-what-buyers-say/', '/transparency/testing-methodology/']) {
    try {
      const { res, text } = await getText(SITE_BASE + u);
      const factReady = /<h2|faq|question|answer|<table/i.test(text);
      results.push(note(factReady ? 'pass' : 'warn', `fact-ready:${u}`, factReady ? 'has structured/factual blocks' : 'consider adding FAQ/table'));
    } catch (e) {
      results.push(note('warn', `fact-ready:${u}`, String(e).slice(0, 80)));
    }
  }

  const s = summarize(results);
  console.log('\n=== GEO Weekly Ops ===');
  results.forEach((r) => console.log(`[${r.level.toUpperCase()}] ${r.name}: ${r.detail}`));
  console.log(`\nGEO readiness: pass ${s.pass}, warn ${s.warn}, fail ${s.fail} (score ${s.score}/100)`);
  process.exit(s.fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
