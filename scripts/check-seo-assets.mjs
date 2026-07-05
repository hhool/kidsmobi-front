import { readFileSync } from 'fs';
import { resolve } from 'path';

const root = resolve(process.cwd(), 'public');
const robots = readFileSync(resolve(root, 'robots.txt'), 'utf8');
const sitemap = readFileSync(resolve(root, 'sitemap.xml'), 'utf8');
const redirects = readFileSync(resolve(root, '_redirects'), 'utf8');
const expectedSiteBase = (process.env.SEO_SITE_BASE_URL || 'https://kidsmobi.pages.dev').replace(/\/+$/, '');

const required = [
  {
    name: 'robots-core',
    ok: robots.includes('User-agent: *') && robots.includes('Allow: /') && robots.includes('Sitemap:'),
    detail: 'robots.txt must include User-agent, Allow and Sitemap lines',
  },
  {
    name: 'robots-sitemap-relative',
    ok: robots.includes('Sitemap: /sitemap.xml'),
    detail: 'robots.txt should keep sitemap reference site-relative',
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
    name: 'redirects-seo-routes',
    ok:
      redirects.includes('/robots.txt ') &&
      redirects.includes('/sitemap.xml ') &&
      redirects.includes('/api/* ') &&
      redirects.includes('/* /index.html 200'),
    detail: '_redirects must include robots, sitemap, api passthrough and SPA fallback rules',
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
