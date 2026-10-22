import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(process.cwd(), 'public');
const robots = readFileSync(resolve(root, 'robots.txt'), 'utf8');
const sitemap = readFileSync(resolve(root, 'sitemap.xml'), 'utf8');
const redirects = readFileSync(resolve(root, '_redirects'), 'utf8');
const expectedSiteBase = (process.env.SEO_SITE_BASE_URL || 'https://balancebiketoddler.com').replace(/\/+$/, '');

const required = [
  {
    name: 'robots-core',
    ok: robots.includes('User-agent: *') && robots.includes('Allow: /') && robots.includes('Sitemap:'),
    detail: 'robots.txt must include User-agent, Allow and Sitemap lines',
  },
  {
    // Absolute sitemap URLs are valid per the sitemaps protocol and match the
    // production setup (robots.txt is authored with the absolute URL).
    name: 'robots-sitemap-absolute',
    ok: robots.includes(`Sitemap: ${expectedSiteBase}/sitemap.xml`),
    detail: `robots.txt should reference ${expectedSiteBase}/sitemap.xml`,
  },
  {
    name: 'sitemap-xml-core',
    ok: sitemap.includes('<urlset') && sitemap.includes('<loc>'),
    detail: 'sitemap.xml must include urlset and at least one loc',
  },
  {
    name: 'sitemap-site-domain',
    ok: sitemap.includes(expectedSiteBase),
    detail: `sitemap.xml must contain expected site base: ${expectedSiteBase}`,
  },
  {
    name: 'sitemap-no-worker-domain',
    ok: !sitemap.includes('.workers.dev'),
    detail: 'sitemap.xml must not reference workers.dev domains',
  },
  {
    // robots.txt is a static Pages asset and sitemap.xml is served by the
    // Worker route on the apex host — neither needs a _redirects rule.
    name: 'redirects-api-passthrough',
    ok: redirects.includes('/api/* '),
    detail: '_redirects must include the /api/* passthrough rule',
  },
  {
    // There is no SPA prefix block any more, on purpose. A wildcard rewrite
    // takes precedence over Pages' static asset tree, so `/products/* / 200`
    // served the homepage shell for all 181 prerendered product pages (plus
    // guides, reviews, news and transparency): 255 of 269 sitemap URLs shipped
    // the homepage title with a homepage canonical. This check used to demand
    // exactly that block — first with /index.html targets (which Pages drops
    // silently, so the block was dead), then with "/" targets (which made it
    // live and shadowed the prerendered pages). A guard can be the bug.
    //
    // What must hold instead: the bare app roots — SPA-only routes with
    // no prerendered sibling — each keep an exact rewrite to "/" in BOTH URL
    // forms (Pages matches the source exactly, so the no-slash rule alone
    // leaves "/compare/" 404ing), and no wildcard rule targets a static path.
    // The "/index.html" target is not acceptable here either: an exact rule
    // with that target 308-redirects to "/" and loses the path (verified live
    // 2026-10-21 — the roots shipped that shape and /compare answered 308 -> /
    // while /compare/ answered 404).
    name: 'redirects-bare-roots-rewritten',
    ok: ['/compare', '/auth', '/search', '/transparency'].every(
      (root) =>
        redirects.includes(`${root} / 200`) && redirects.includes(`${root}/ / 200`),
    ),
    detail: '_redirects must rewrite each bare app root (/compare /auth /search /transparency) to "/" with an exact rule in both the no-slash and trailing-slash forms',
  },
  {
    // The other half of the same lesson: a wildcard rule must never target a
    // static path, because the rewrite shadows every prerendered page under
    // that prefix. Redirects to another origin (/api/*) are fine.
    name: 'redirects-no-wildcard-static-target',
    ok: !redirects
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .some((line) => {
        const [source, target] = line.split(/\s+/);
        return source.includes('*') && !/^https?:\/\//i.test(target || '');
      }),
    detail: '_redirects must not rewrite a wildcard source to a static path — it shadows every prerendered page under that prefix',
  },
  {
    // Comment-only mentions must not trip this check, hence the line-based scan.
    name: 'redirects-no-global-catchall',
    ok: !redirects
      .split('\n')
      .map((line) => line.trim())
      .some((line) => line === '/* /index.html 200' || line === '/* / 200'),
    detail: '_redirects must not contain the global /* /index.html 200 catch-all',
  },
];

const failed = required.filter((item) => !item.ok);
if (failed.length > 0) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        failed: failed.map((item) => ({ name: item.name, detail: item.detail })),
      },
      null,
      2,
    ),
  );
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      checked: required.map((item) => item.name),
      expectedSiteBase,
    },
    null,
    2,
  ),
);
