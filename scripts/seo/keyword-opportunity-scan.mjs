// Weekly keyword opportunity scan for balancebiketoddler.com.
// Fetches every live sitemap URL, extracts title/description/keywords/h1, and
// cross-references them against the high-value query clusters in config.mjs to
// surface (a) query clusters with no dedicated coverage and (b) weak pages
// (missing keywords meta or thin title). This is a content-gap + hygiene scan,
// not a rank tracker — pair it with Search Console for true demand data.
//
// Usage: node scripts/seo/keyword-opportunity-scan.mjs
// Env: SEO_SITE_BASE_URL

import { SITE_BASE, SITEMAP_URL, QUERY_CLUSTERS } from './config.mjs';

async function fetchSitemapUrls() {
  const res = await fetch(SITEMAP_URL, { redirect: 'follow' });
  const xml = await res.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

async function getMeta(url) {
  const res = await fetch(url, { redirect: 'follow' });
  const html = await res.text();
  const pick = (re) => (html.match(re) || [])[1] || '';
  return {
    url,
    title: pick(/<title>([^<]*)<\/title>/i).trim(),
    desc: pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i).trim(),
    kw: pick(/<meta[^>]+name=["']keywords["'][^>]+content=["']([^"']*)["']/i).trim(),
    h1: pick(/<h1[^>]*>([^<]*)<\/h1>/i).trim(),
  };
}

async function main() {
  const urls = await fetchSitemapUrls();
  console.log(`Scanning ${urls.length} URLs for keyword opportunities…`);
  const pages = [];
  for (const u of urls) {
    try {
      pages.push(await getMeta(u));
    } catch {
      /* skip unreachable */
    }
  }

  const corpus = pages.map((p) => `${p.kw} ${p.title} ${p.h1}`.toLowerCase()).join(' | ');

  console.log('\n=== Query-cluster coverage ===');
  const gaps = [];
  for (const c of QUERY_CLUSTERS) {
    const hit = c.signals.some((s) => corpus.includes(s.toLowerCase()));
    console.log(`[${hit ? 'COVERED' : 'GAP   '}] ${c.id}: ${c.label}`);
    if (!hit) gaps.push(c);
  }

  console.log('\n=== Weak pages (missing keywords meta or thin title) ===');
  const weak = pages.filter((p) => !p.kw || p.title.length < 20);
  weak.slice(0, 30).forEach((p) =>
    console.log(`  ${p.url}  kw=${p.kw ? 'yes' : 'NO'} title="${p.title.slice(0, 60)}"`)
  );
  if (weak.length > 30) console.log(`  …and ${weak.length - 30} more`);

  console.log(`\nSUMMARY: ${pages.length} pages scanned, ${gaps.length} cluster gaps, ${weak.length} weak pages.`);
  if (gaps.length) {
    console.log('TOP OPPORTUNITIES:');
    gaps.forEach((g, i) => console.log(`  ${i + 1}. Cover "${g.label}" (signals: ${g.signals.join(', ')})`));
  }
}

main().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
