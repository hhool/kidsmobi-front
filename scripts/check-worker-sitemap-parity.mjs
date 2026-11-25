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

import { deriveSitemapPaths } from './lib/sitemap-paths.mjs';

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

// The two path lists are derived by the same module the generator writes with.
// They used to be re-implemented here, and the copy that lived here only knew
// the older "no <lastmod>" proxy — so on 2026-11-06 this guard reported 54
// stale Worker paths on a tree that had just been regenerated correctly. One
// definition, imported twice, is the only version of this that cannot drift.
const { assetPaths: distAssetPaths, staticNoCmsPaths: distNoCmsPaths,
        source: nocmsSource, urlCount } = deriveSitemapPaths(resolve(root, 'dist'));

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

// --- parse the Worker's retired-GUIDE module ---------------------------------
// S4: CMS guides retired into a non-guide page are excluded from the Worker's
// D1 sitemap build by their own generated module, not by the two static path
// lists above — a guide comes from a D1 row, so no static list can cover it.
// This asserts the module exists and carries every retired route from the
// front's registry, so the Worker cannot silently start advertising a URL the
// front already 301s.
const retiredGuidesPath = resolve(backendWorker, 'src', 'retiredGuides.generated.ts');
const frontRetiredGuidesPath = resolve(root, 'src/data/balanceBikeStability.ts');
let retiredGuideCheck = { name: 'worker-sitemap-no-retired-guide', ok: true, detail: 'no retired CMS guides declared' };
if (existsSync(retiredGuidesPath) && existsSync(frontRetiredGuidesPath)) {
  const workerRetired = readFileSync(retiredGuidesPath, 'utf8');
  const workerRetiredSources = [...workerRetired.matchAll(/^\s*"(\/[^"]+)":\s*"/gm)].map((m) => m[1]);
  const frontSrc = readFileSync(frontRetiredGuidesPath, 'utf8');
  const frontBlock = /RETIRED_STABILITY_GUIDE_PATHS[^=]*=\s*\[([\s\S]*?)\n\];/.exec(frontSrc);
  const frontRetired = frontBlock
    ? [...frontBlock[1].matchAll(/\[\s*"(\/[^"]+)"\s*,/g)].map((m) => m[1].replace(/\/+$/, ''))
    : [];
  retiredGuideCheck = {
    name: 'worker-sitemap-no-retired-guide',
    ok: frontRetired.every((from) => workerRetiredSources.includes(from)),
    detail:
      `the Worker's retiredGuides.generated.ts [${workerRetiredSources.join(' ')}] must carry every ` +
      `retired guide route declared in the front [${frontRetired.join(' ')}]` +
      `${existsSync(retiredGuidesPath) ? '' : ' — missing file; run scripts/sync_retired_guides_to_worker.mjs'}`,
  };
}

// --- parse the Worker route patterns -----------------------------------------
const wrangler = readFileSync(wranglerPath, 'utf8');
const patterns = new Set([...wrangler.matchAll(/^pattern = "([^"]+)"/gm)].map((m) => m[1]));
const hasPattern = (path) => patterns.has(`balancebiketoddler.com${path}`);

// --- parse the directory-index prefix families -------------------------------
// The 2026-11-25 guides rename shipped two defects that no existing check could
// see, because both live in the *expansion* of the table rather than in the
// table itself:
//
//   1. The Worker emits `<from>/*` zone routes, and Cloudflare's `*` matches the
//      remainder AFTER a slash — so `/guides/bicycle/*` intercepts
//      `/guides/bicycle/` and everything below it, but NOT `/guides/bicycle`.
//      The bare form fell through to Pages, the directory no longer existed,
//      and all four bare URLs answered 404. The product families were never
//      exposed to this because their entries are also exact rules, which get a
//      bare pattern of their own.
//   2. The prefix targets were emitted without a trailing slash and the handler
//      expanded them verbatim, so every one of the 35 composites 301'd to its
//      no-slash form and then took a second 308 back to the slash.
//
// Both are asserted here against the generated artefact, so a change to the
// prerender or the sync script fails before the Worker is deployed.
const prefixDirPairs = (redirects.prefixDir || []).map(([from, to]) => [String(from), String(to)]);
const rawFilePrefixes = (redirects.prefix || []).map(([from]) => String(from));

const guidePrefixChecks = [
  {
    // Defect 1. A `*`-suffixed pattern does not cover the bare prefix.
    name: 'redirect-guide-prefix-bare-route',
    ok: prefixDirPairs.every(([from]) => hasPattern(from)),
    detail:
      `every guide category prefix needs a BARE Worker route as well as its wildcard, because ` +
      `Cloudflare's "*" does not match the empty remainder without a slash — missing: ` +
      `${prefixDirPairs.filter(([from]) => !hasPattern(from)).map(([from]) => from).join(' ') || 'none'} ` +
      `(re-run scripts/sync_redirects_to_worker.mjs)`,
  },
  {
    // Defect 2. Directory children are directory indexes; their canonical URL
    // ends in a slash, so a slashless target guarantees a second hop.
    name: 'redirect-guide-prefix-target-terminated',
    ok: prefixDirPairs.every(([, to]) => to.endsWith('/')),
    detail:
      `every guide category prefix target must end with "/" — the children are directory indexes and ` +
      `a slashless target costs an extra 308 per URL: ` +
      `${prefixDirPairs.filter(([, to]) => !to.endsWith('/')).map(([f, t]) => `${f} -> ${t}`).join(' ') || 'none'}`,
  },
  {
    // The two families must stay disjoint. A path in both tables would be
    // expanded twice with different shapes and the winner would depend on loop
    // order — the exact class of bug this split exists to prevent.
    name: 'redirect-prefix-families-disjoint',
    ok: prefixDirPairs.every(([from]) => !rawFilePrefixes.includes(from)),
    detail:
      `no path may appear in both the file and the directory prefix tables: ` +
      `${prefixDirPairs.filter(([from]) => rawFilePrefixes.includes(from)).map(([from]) => from).join(' ') || 'none'}`,
  },
];

const sameSet = (a, b) =>
  Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((x) => b.includes(x));

const checks = [
  retiredGuideCheck,
  ...guidePrefixChecks,
  {
    name: 'worker-sitemap-asset-parity',
    ok: sameSet(distAssetPaths, workerAssetPaths),
    detail: `dist priority-0.9 URLs [${(distAssetPaths || []).join(' ')}] must equal the Worker's SITEMAP_ASSET_PATHS [${(workerAssetPaths || []).join(' ')}] — re-run scripts/sync_sitemap_paths_to_worker.mjs`,
  },
  {
    name: 'worker-sitemap-nocms-parity',
    ok: sameSet(distNoCmsPaths, workerNoCmsPaths),
    detail: `dist no-CMS routes (via ${nocmsSource}) [${(distNoCmsPaths || []).join(' ')}] must equal the Worker's STATIC_NO_CMS_PATHS [${(workerNoCmsPaths || []).join(' ')}] — re-run scripts/sync_sitemap_paths_to_worker.mjs`,
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
    // LASTMOD COVERAGE, the class of drift that shipped on 2026-11-25.
    //
    // The parity checks above compare which URLs each side lists. They do not
    // compare whether each side can DATE them — and that gap is exactly what
    // went wrong: the front's prerender dated all 38 guides axis/composite
    // pages, the Worker had no rule for them, so the live sitemap (the one
    // Google fetches) emitted 38 undated URLs. Google's URL Inspection then
    // reported all 38 as "URL is unknown to Google" — never seen at all.
    //
    // This asserts the reverse direction on the paths the Worker builds itself:
    // every no-CMS path the front dates must be datable by a rule named in the
    // Worker source. It reads the source for the rule FUNCTION names rather
    // than re-implementing the matching, so a renamed/removed rule fails here
    // instead of silently leaving URLs undated again.
    name: 'worker-sitemap-lastmod-coverage',
    // NOTE on shape: this returns a BOOLEAN, not an Error. An earlier version
    // returned `new Error(msg)` as `ok`, and an Error object is truthy — so
    // `checks.filter(c => !c.ok)` never fired and the check passed while
    // reporting nothing. Caught by sabotage: renaming the Worker's dating rule
    // left the guard green. Boolean in `ok`, reason in `detail`.
    ...(() => {
      const fail = (detail) => ({ ok: false, detail });
      const distXml = readFileSync(sitemapPath, 'utf8');
      const dated = new Set();
      for (const block of distXml.match(/<url>[\s\S]*?<\/url>/g) || []) {
        const loc = (block.match(/<loc>([^<]*)<\/loc>/) || [])[1];
        if (loc && block.includes('<lastmod>')) {
          dated.add(loc.replace('https://balancebiketoddler.com', ''));
        }
      }
      const workerSrc = readFileSync(resolve(backendWorker, 'src', 'index.ts'), 'utf8');
      // A rule must be both DEFINED and CALLED in the static-path fallback
      // chain. Looking for the name anywhere is not enough — the call site
      // satisfies a substring search on its own.
      const ruleNames = ['assetFamilyLastmod', 'familyHubLastmod', 'recallLastmod', 'guidesAxisLastmod'];
      const broken = ruleNames.filter(
        (n) => !workerSrc.includes(`const ${n} =`) || !workerSrc.includes(`${n}(staticPath)`),
      );
      if (broken.length) {
        return fail(`Worker dating rule(s) missing or uncalled in the static-path chain: ${broken.join(' ')}`);
      }
      // The guides axis + composite shapes have no CMS record and no
      // asset-family prefix, so they depend entirely on guidesAxisLastmod.
      // Assert the front dates all of them (the Worker side is covered by the
      // rule-exists check above plus the workerparity list comparison).
      const AXIS_SLUGS = ['stroller', 'balance-bike', 'kids-bikes', 'kids-scooter', 'kids-electric-car'];
      const TOPICS = ['beginner', 'budget', 'special', 'best', 'scenario', 'risk', 'maintenance'];
      const axisPaths = (distNoCmsPaths || []).filter((p) =>
        AXIS_SLUGS.some((s) => p === `/guides/${s}/` || TOPICS.some((t) => p === `/guides/${s}/${t}/`)),
      );
      const undated = axisPaths.filter((p) => !dated.has(p));
      if (undated.length) {
        return fail(
          `guides axis/composite paths in the Worker's no-CMS list that the front sitemap leaves undated: ${undated.join(' ')}`,
        );
      }
      if (axisPaths.length === 0) {
        return fail('found no guides axis/composite paths to check — the derivation is broken, not the site');
      }
      return {
        ok: true,
        detail: `all ${axisPaths.length} guides axis/composite no-CMS paths are dated by the front and the Worker has a rule for them`,
      };
    })(),
  },
  {
    // R55. The sitemap dates each collection's hubs with that collection's
    // "latest edit". The front derives it from its published-only snapshot;
    // the Worker scanned every row. The two agreed only while every row
    // happened to be published, so the first withhold (one product flipped to
    // draft) pushed 9 product URLs' lastmod to the withhold timestamp on the
    // live sitemap while the front kept the real date. That is the R52 shape
    // again: a sitemap signal Google reads, silently disagreeing with the one
    // this repo builds.
    //
    // The assertion is on the Worker source because that is the side that
    // cannot be imported here. It checks that pickRecordLastmod is called
    // INSIDE a published-status branch — a bare `includes('pickRecordLastmod')`
    // would pass on the call site alone, and reading the comment above would
    // pass on prose. Both of those are how the last two guards in this family
    // lied, so the shape is asserted, not the vocabulary.
    name: 'worker-collection-lastmod-published-only',
    ...(() => {
      const workerSrc = readFileSync(resolve(backendWorker, 'src', 'index.ts'), 'utf8');
      // Narrow to buildSitemapXml's collection loop so a published-only
      // filter anywhere else in the file cannot satisfy this.
      const start = workerSrc.indexOf('async function buildSitemapXml');
      const end = workerSrc.indexOf('Phase 2: collect category hubs', start);
      if (start < 0 || end < 0) {
        return { ok: false, detail: 'could not locate the buildSitemapXml collection loop to inspect' };
      }
      const loopSrc = workerSrc.slice(start, end);
      // The gate must be both present and guarding the max tracking.
      const gate = /const\s+isPublishedRow\s*=\s*rowStatus\s*===\s*"published"/.test(loopSrc);
      const guardedMax = /if\s*\(\s*isPublishedRow\s*\)\s*\{[^}]*pickRecordLastmod/.test(loopSrc);
      const skipsDrafts = /if\s*\(\s*!\s*isPublishedRow\s*\)\s*\{[^}]*continue;/.test(loopSrc);
      const missingParts = [
        !gate && 'no `isPublishedRow = rowStatus === "published"` gate',
        !guardedMax && 'pickRecordLastmod is not called inside the isPublishedRow branch',
        !skipsDrafts && 'non-published rows are not skipped before path derivation',
      ].filter(Boolean);
      if (missingParts.length) {
        return { ok: false, detail: `Worker sitemap collection loop must count only published rows: ${missingParts.join('; ')}` };
      }
      return {
        ok: true,
        detail: 'the Worker derives each collection\'s latest-edit date from published rows only, matching the front snapshot',
      };
    })(),
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
        sitemapUrls: urlCount,
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
