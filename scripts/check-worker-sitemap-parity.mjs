/**
 * Local pre-deploy guard for the front -> Worker sitemap/redirect hand-off.
 *
 * NOT wired into CI: the backend repo is not public, so the CI runner cannot
 * check it out and this comparison cannot run there. Run it as part of the
 * manual release sequence instead:
 *
 *   cd front && npm run build
 *           && node scripts/sync_sitemap_paths_to_worker.mjs
 *           && node scripts/sync_redirects_to_worker.mjs
 *           && npm run check:workerparity
 *
 * What it protects against, all three seen on 2026-10-22:
 *
 *  1. the Worker's sitemap lists drifting from the prerender (it served a
 *     retired URL and omitted its replacement — invisible to every guard,
 *     because they read dist and the live check only counts URLs);
 *  2. a redirect rule keyed with a trailing slash, which the Worker can never
 *     match because it normalises the path before lookup;
 *  3. a Worker route pattern emitted in only one slash shape, which leaves the
 *     other shape falling through to Pages.
 *
 * Everything here is derived from dist plus the two generated backend files, so
 * it fails on drift rather than restating the prerender's own output back at
 * itself.
 */
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const root = process.cwd();
const backendWorker = resolve(root, '..', 'backend', 'api', 'worker');
const sitemapPath = resolve(root, 'dist', 'sitemap.xml');
const redirectsPath = resolve(root, 'dist', 'data', 'legacy-redirects.json');
const generatedPath = resolve(backendWorker, 'src', 'workerSitemapPaths.generated.ts');
const wranglerPath = resolve(backendWorker, 'wrangler.toml');

const missing = [sitemapPath, redirectsPath, generatedPath, wranglerPath].filter((p) => !existsSync(p));
if (missing.length > 0) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        failed: [
          {
            name: 'inputs-present',
            detail:
              'missing input(s): ' +
              missing.join(', ') +
              ' — run `npm run build` then both sync_redirects/sync_sitemap_paths scripts before this guard',
          },
        ],
      },
      null,
      2,
    ),
  );
  process.exit(1);
}

const sitemap = readFileSync(sitemapPath, 'utf8');
const entries = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => m[1]);
const pathOf = (entry) => new URL((entry.match(/<loc>([^<]+)<\/loc>/) || [])[1]).pathname;

const distAssetPaths = entries.filter((e) => e.includes('<priority>0.9</priority>')).map(pathOf);
const distNoCmsPaths = entries.filter((e) => !e.includes('<lastmod>')).map(pathOf);

// --- parse the generated backend lists ---------------------------------------
const generated = readFileSync(generatedPath, 'utf8');
const parseList = (name) => {
  const m = generated.match(new RegExp(`export const ${name}: ReadonlyArray<string> = \\[([\\s\\S]*?)\\];`));
  if (!m) return null;
  return [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
};
const workerAssetPaths = parseList('SITEMAP_ASSET_PATHS');
const workerNoCmsPaths = parseList('STATIC_NO_CMS_PATHS');

// --- parse the retired-URL table ---------------------------------------------
const redirects = JSON.parse(readFileSync(redirectsPath, 'utf8'));
const exactPairs = Array.isArray(redirects.exact) ? redirects.exact : Object.entries(redirects.exact || {});
const retiredSources = exactPairs.map(([from]) => from);

// --- parse the Worker route patterns -----------------------------------------
const wrangler = readFileSync(wranglerPath, 'utf8');
const patterns = new Set([...wrangler.matchAll(/^pattern = "([^"]+)"/gm)].map((m) => m[1]));
const hasPattern = (path) => patterns.has(`balancebiketoddler.com${path}`);

const sameSet = (a, b) =>
  Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((x) => b.includes(x));

const checks = [
  {
    name: 'worker-sitemap-asset-parity',
    ok: sameSet(distAssetPaths, workerAssetPaths),
    detail: `dist priority-0.9 URLs [${(distAssetPaths || []).join(' ')}] must equal the Worker's SITEMAP_ASSET_PATHS [${(workerAssetPaths || []).join(' ')}] — re-run scripts/sync_sitemap_paths_to_worker.mjs`,
  },
  {
    name: 'worker-sitemap-nocms-parity',
    ok: sameSet(distNoCmsPaths, workerNoCmsPaths),
    detail: `dist URLs without <lastmod> [${(distNoCmsPaths || []).join(' ')}] must equal the Worker's STATIC_NO_CMS_PATHS [${(workerNoCmsPaths || []).join(' ')}] — re-run scripts/sync_sitemap_paths_to_worker.mjs`,
  },
  {
    // Named separately even though the parity checks above imply it: this is
    // the failure that actually reached production, and it is worth seeing by
    // name. The Worker serves the sitemap Google crawls, so a retired path here
    // means telling Google to index a URL that 301s.
    name: 'worker-sitemap-no-retired-url',
    ok: [...(workerAssetPaths || []), ...(workerNoCmsPaths || [])].every(
      (p) => !retiredSources.includes(p) && !retiredSources.includes(p.replace(/\/+$/, '')),
    ),
    detail: 'no Worker sitemap path may be the source of a retired-URL 301',
  },
  {
    // The Worker strips the trailing slash before looking a path up, so a key
    // written with one can never match and the old URL 404s instead of
    // redirecting.
    name: 'redirect-keys-no-trailing-slash',
    ok: retiredSources.every((from) => from === '/' || !from.endsWith('/')),
    detail: `retired-URL keys must not end with "/": ${retiredSources.filter((f) => f !== '/' && f.endsWith('/')).join(' ') || 'none'}`,
  },
  {
    // Cloudflare matches a route pattern literally: `host/foo` does not
    // intercept `/foo/`, and a retired directory URL is requested with the
    // slash. Whichever shape is present, the other must be too.
    name: 'redirect-routes-both-slash-forms',
    ok: retiredSources.every(
      (from) => !hasPattern(from) || hasPattern(`${from.replace(/\/+$/, '')}/`),
    ),
    detail: `every Worker route for a retired URL must exist in both slash shapes; missing: ${retiredSources.filter((f) => hasPattern(f) && !hasPattern(`${f.replace(/\/+$/, '')}/`)).map((f) => `${f}/`).join(' ') || 'none'}`,
  },
];

const failed = checks.filter((c) => !c.ok);
if (failed.length > 0) {
  console.error(JSON.stringify({ ok: false, failed }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      checked: checks.map((c) => c.name),
      counts: {
        sitemapUrls: entries.length,
        assetPaths: distAssetPaths.length,
        noCmsPaths: distNoCmsPaths.length,
        retiredExactRules: retiredSources.length,
        workerRoutePatterns: patterns.size,
      },
    },
    null,
    2,
  ),
);
