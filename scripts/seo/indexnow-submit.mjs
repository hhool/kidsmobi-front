// IndexNow weekly submission for balancebiketoddler.com.
//
// Fetches the live sitemap, computes a delta vs the last submitted snapshot, and
// POSTs new/changed URLs to the IndexNow hub + Bing + Yandex + Seznam.
//
// Usage:
//   node scripts/seo/indexnow-submit.mjs                 # delta submit (default)
//   node scripts/seo/indexnow-submit.mjs --full          # submit ALL urls
//   node scripts/seo/indexnow-submit.mjs --force         # resubmit even if no delta
//   node scripts/seo/indexnow-submit.mjs --dry-run       # parse only, no POST
//   node scripts/seo/indexnow-submit.mjs --sitemap=public/sitemap.xml --dry-run
//
// Env: SEO_SITE_BASE_URL, INDEXNOW_KEY

import {
  SITE_BASE,
  SITEMAP_URL,
  INDEXNOW_KEY,
  INDEXNOW_KEY_LOCATION,
  INDEXNOW_ENDPOINTS,
} from './config.mjs';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SNAPSHOT = resolve(__dirname, '.last-indexnow.json');

async function loadUrls(sitemapArg) {
  if (sitemapArg && existsSync(sitemapArg)) {
    const xml = readFileSync(sitemapArg, 'utf8');
    return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()).filter(Boolean);
  }
  const res = await fetch(SITEMAP_URL, { redirect: 'follow' });
  if (!res.ok) throw new Error(`sitemap fetch failed: HTTP ${res.status}`);
  const xml = await res.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()).filter(Boolean);
}

function loadSnapshot() {
  if (!existsSync(SNAPSHOT)) return { urls: [] };
  try {
    return JSON.parse(readFileSync(SNAPSHOT, 'utf8'));
  } catch {
    return { urls: [] };
  }
}

function saveSnapshot(urls) {
  mkdirSync(dirname(SNAPSHOT), { recursive: true });
  writeFileSync(SNAPSHOT, JSON.stringify({ updatedAt: new Date().toISOString(), urls }, null, 2));
}

async function postOne(endpoint, payload) {
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    return { endpoint, status: res.status, ok: res.ok, body: text.slice(0, 200) };
  } catch (e) {
    return { endpoint, ok: false, error: String(e).slice(0, 200) };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');
  const full = args.includes('--full');
  const sitemapArg = args.find((a) => a.startsWith('--sitemap='))?.split('=')[1];

  console.log(
    `IndexNow submit | site=${SITE_BASE} key=${INDEXNOW_KEY.slice(0, 8)}… dryRun=${dryRun} force=${force} full=${full}`
  );

  const urls = await loadUrls(sitemapArg);
  console.log(`sitemap URLs: ${urls.length}`);

  const snap = loadSnapshot();
  const prev = new Set(snap.urls);
  let toSubmit = urls;
  if (!full) {
    const added = urls.filter((u) => !prev.has(u));
    const removed = [...prev].filter((u) => !urls.includes(u));
    toSubmit = added;
    console.log(`delta: +${added.length} added, -${removed.length} removed (previous ${prev.size})`);
    if (added.length === 0 && removed.length === 0 && !force) {
      console.log('No changes since last submission. Use --force to resubmit all, or --full.');
      return;
    }
  }

  if (toSubmit.length === 0) {
    console.log('Nothing to submit.');
    return;
  }

  if (dryRun) {
    console.log('[dry-run] would submit:');
    toSubmit.slice(0, 20).forEach((u) => console.log('  ' + u));
    if (toSubmit.length > 20) console.log(`  …and ${toSubmit.length - 20} more`);
    return;
  }

  const payload = {
    host: new URL(SITE_BASE).host,
    key: INDEXNOW_KEY,
    keyLocation: INDEXNOW_KEY_LOCATION,
    urlList: toSubmit,
  };

  const results = [];
  for (const ep of INDEXNOW_ENDPOINTS) {
    results.push(await postOne(ep, payload));
  }
  results.forEach((r) =>
    console.log(`${r.ok ? 'OK ' : 'ERR'} ${r.status ?? ''} ${r.endpoint} ${r.body || r.error || ''}`)
  );

  saveSnapshot(urls);
  const allOk = results.every((r) => r.ok);
  console.log(allOk ? 'DONE: all endpoints accepted.' : 'DONE: some endpoints failed (see above).');
  process.exit(allOk ? 0 : 1);
}

main().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
