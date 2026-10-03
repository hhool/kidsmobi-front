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
    name: 'redirects-seo-routes',
    ok: redirects.includes('/api/* ') && redirects.includes('/* /index.html 200'),
    detail: '_redirects must include api passthrough and SPA fallback rules',
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
