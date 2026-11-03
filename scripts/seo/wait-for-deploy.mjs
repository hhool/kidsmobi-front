// Wait until the live site serves the build we expect.
//
// The scheduled live probe (job ⑥ in quality-gates.yml) measures production.
// Cloudflare Pages deploys asynchronously: a push to main starts the deploy,
// and a probe that runs while the old bundle is still being served would
// report a problem that only exists in the code that has not landed yet.
//
// This script polls the live HTML, fetches the JavaScript bundles it points
// at, and waits until one of them carries the marker of the build we expect.
// The probe then measures the new code instead of the old one.
//
// The marker is the Consent Mode v2 signal set (ad_user_data and
// ad_personalization). A build without it predates the consent-mode work, so
// finding it means "the new build is live".
//
// Usage: node scripts/seo/wait-for-deploy.mjs
// Env: SEO_SITE_BASE_URL    (defaults to the production site)
//      DEPLOY_WAIT_TIMEOUT  (seconds, default 600)
//      DEPLOY_WAIT_INTERVAL (seconds, default 20)
//
// Exit 0 once the marker is found, 1 on timeout.

import { SITE_BASE } from './config.mjs';

const base = (process.env.SEO_SITE_BASE_URL || SITE_BASE).replace(/\/+$/, '');
const timeoutMs = Number(process.env.DEPLOY_WAIT_TIMEOUT || 600) * 1000;
const intervalMs = Number(process.env.DEPLOY_WAIT_INTERVAL || 20) * 1000;

// The strings a Consent Mode v2 build must contain. Property names survive
// minification, so they are a reliable marker in the shipped bundle.
const MARKERS = ['ad_user_data', 'ad_personalization', 'analytics_storage'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Every JS bundle the page points at. */
function assetUrls(html) {
  const found = new Set();
  for (const match of html.matchAll(/(?:src|href)\s*=\s*["']([^"']+\.js[^"']*)["']/gi)) {
    const url = match[1];
    if (!url) continue;
    found.add(url.startsWith('http') ? url : base + (url.startsWith('/') ? url : `/${url}`));
  }
  return Array.from(found);
}

/** Does this bundle carry the marker? */
function hasMarker(code) {
  return MARKERS.every((m) => code.includes(m));
}

/**
 * One poll: fetch the live HTML and its bundles, look for the marker.
 * Returns { live, checked, ok } — live false means the page itself did not
 * load, which is a network problem rather than a stale deploy.
 */
async function poll() {
  // The cache buster keeps an edge-cached HTML from hiding a fresh deploy.
  const res = await fetch(`${base}/?__deploy_probe=${Date.now()}`, {
    cache: 'no-store',
    headers: { 'cache-control': 'no-cache' },
  });
  if (!res.ok) return { live: false, checked: 0, ok: false };
  const html = await res.text();
  const urls = assetUrls(html);
  let checked = 0;
  for (const url of urls) {
    checked += 1;
    try {
      const asset = await fetch(url, { cache: 'no-store' });
      if (!asset.ok) continue;
      if (hasMarker(await asset.text())) return { live: true, checked, ok: true };
    } catch {
      // A bundle we cannot read is not evidence of a stale deploy.
    }
  }
  return { live: true, checked, ok: false };
}

const started = Date.now();
let last = { live: false, checked: 0, ok: false };

while (Date.now() - started < timeoutMs) {
  try {
    last = await poll();
  } catch (e) {
    console.log(`[wait] poll failed: ${String(e.message || e).slice(0, 120)}`);
  }
  if (last.ok) {
    console.log(
      `[pass] the live site serves the Consent Mode v2 build (checked ${last.checked} bundle(s) in ${Math.round((Date.now() - started) / 1000)}s)`,
    );
    process.exit(0);
  }
  console.log(
    `[wait] the live build is not the expected one yet (${last.checked} bundle(s) checked) - retrying in ${Math.round(intervalMs / 1000)}s`,
  );
  await sleep(intervalMs);
}

if (!last.live) {
  console.log(
    '[FAIL] the live site could not be reached at all - that is an outage, not a stale deploy.',
  );
} else {
  console.log(
    `[FAIL] the live site still serves a build without the Consent Mode v2 marker after ${Math.round(timeoutMs / 1000)}s. Either the deploy has not landed yet, or the new build is broken.`,
  );
}
process.exit(1);
