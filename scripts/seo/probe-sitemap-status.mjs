// One-off live audit: probe every URL in the live sitemap.xml and bucket
// them the way Google Search Console's "Page indexing" report does.
// Detects: 3xx (redirect-in-sitemap), 4xx/5xx (error), and surfaces any
// noindex / non-self-canonical samples.
import { SITEMAP_URL } from './config.mjs';

const CONCURRENCY = 12;

async function fetchText(url) {
  const res = await fetch(url, {
    redirect: 'manual',
    headers: { 'User-Agent': 'Mozilla/5.0 GSC-Audit-Probe' },
    signal: AbortSignal.timeout(10000),
  });
  return res;
}

async function probe(loc) {
  try {
    const res = await fetchText(loc);
    const status = res.status;
    if (status >= 300 && status < 400) {
      const target = res.headers.get('location') || '';
      return { loc, bucket: 'REDIRECT', status, target };
    }
    if (status >= 400) {
      return { loc, bucket: 'ERROR', status };
    }
    // 200: sample robots + canonical
    let robots = '';
    let canonical = '';
    try {
      const html = await res.text();
      const rm = html.match(/<meta[^>]+name=["']robots["'][^>]*content=["']([^"']*)["']/i);
      if (rm) robots = rm[1];
      const cm = html.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']*)["']/i);
      if (cm) canonical = cm[1];
    } catch {}
    const noindex = /noindex/i.test(robots);
    const selfCanon = canonical === loc || canonical === loc.replace(/\/$/, '');
    return { loc, bucket: 'OK', status, robots, canonical, noindex, selfCanon };
  } catch (e) {
    return { loc, bucket: 'ERROR', status: 0, err: String(e).slice(0, 80) };
  }
}

async function main() {
  const sm = await (await fetch(SITEMAP_URL)).text();
  const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  console.error(`Sitemap: ${locs.length} URLs from ${SITEMAP_URL}`);

  const buckets = { OK: 0, REDIRECT: 0, ERROR: 0 };
  const redirects = [];
  const errors = [];
  const noindex = [];
  const nonSelfCanon = [];

  const queue = [...locs];
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) {
      const loc = queue.shift();
      const r = await probe(loc);
      buckets[r.bucket]++;
      if (r.bucket === 'REDIRECT') redirects.push(r);
      if (r.bucket === 'ERROR') errors.push(r);
      if (r.bucket === 'OK' && r.noindex) noindex.push(r.loc);
      if (r.bucket === 'OK' && r.canonical && !r.selfCanon) nonSelfCanon.push({ loc: r.loc, canonical: r.canonical });
    }
  });
  await Promise.all(workers);

  console.log('\n===== GSC "Page indexing" buckets (simulated) =====');
  console.log(`Indexed-ready (200, self-canonical): ${buckets.OK}`);
  console.log(`Page with redirect (in sitemap):     ${buckets.REDIRECT}`);
  console.log(`Error (4xx/5xx/network):             ${buckets.ERROR}`);

  if (redirects.length) {
    console.log('\n----- REDIRECT URLs (should be final 200 paths) -----');
    for (const r of redirects) console.log(`${r.status}  ${r.loc}  ->  ${r.target}`);
  }
  if (errors.length) {
    console.log('\n----- ERROR URLs -----');
    for (const r of errors) console.log(`${r.status}  ${r.loc}  ${r.err || ''}`);
  }
  if (noindex.length) {
    console.log('\n----- NOINDEX pages (in sitemap but blocked) -----');
    for (const l of noindex) console.log(l);
  }
  if (nonSelfCanon.length) {
    console.log('\n----- NON-SELF-CANONICAL (sample) -----');
    for (const r of nonSelfCanon.slice(0, 20)) console.log(`${r.loc}  ->  ${r.canonical}`);
  }
  console.log('\nDONE');
}

main().catch((e) => { console.error(e); process.exit(1); });
