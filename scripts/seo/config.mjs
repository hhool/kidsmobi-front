// Shared configuration for balancebiketoddler.com SEO / GEO ops scripts.
// All scripts live in scripts/seo/ and run against the live production site.

export const SITE_BASE =
  (process.env.SEO_SITE_BASE_URL || 'https://balancebiketoddler.com').replace(/\/+$/, '');

export const SITEMAP_URL = `${SITE_BASE}/sitemap.xml`;
export const ROBOTS_URL = `${SITE_BASE}/robots.txt`;
export const LLMS_URL = `${SITE_BASE}/llms.txt`;

// IndexNow — the key file is publicly hosted at public/<KEY>.txt (deployed to
// the site root). The key value equals the filename; IndexNow keys are meant to
// be public, so committing it is standard and safe.
export const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'dfb12ac97ad4a34c75ccf6cc4b783c7f';
export const INDEXNOW_KEY_LOCATION = `${SITE_BASE}/${INDEXNOW_KEY}.txt`;

// IndexNow hub + the major engines that honor the protocol. Same payload posts
// to all of them.
export const INDEXNOW_ENDPOINTS = [
  'https://api.indexnow.org/indexnow',
  'https://www.bing.com/indexnow',
  'https://yandex.com/indexnow',
  'https://search.seznam.cz/indexnow',
];

// Build baseline sitemap URL count (sanity check). The live sitemap was ~246 at
// one baseline; it has since grown. Keep this roughly in sync with the current
// live count so the health check only flags real regressions (large drift), not
// normal week-to-week additions.
// 2026-10-20: synced to 266 after the 10-article batch (10 articles + 5 guides
// topic indexes) and the 4 CMS guides backing the footer column.
// 2026-10-20 (later): 269 after the 3 guides that take the reference cluster
// to 8/8 CMS-backed cards (by-age, what-buyers-say, stability).
// 2026-10-22: 270 after the A2 news article backing the /news hub keyword
// "electric dirt bike for kids" (news/electric-dirt-bikes-for-kids).
export const SITEMAP_BASELINE_COUNT = 270;

// High-value balance-bike query clusters for opportunity gap analysis.
// Derived from the GSC intent study: age is the single biggest intent; the
// "electric" cluster is a trap (electric cars != electric balance bikes); brand
// long-tail is not worth a dedicated page. Keep these as plain English signals.
export const QUERY_CLUSTERS = [
  { id: 'by-age', label: 'By age (2 year old, 3 year old, 18 months, toddler)', signals: ['year old', 'months', 'age', 'toddler'] },
  { id: 'best', label: 'Best / top picks', signals: ['best', 'top', 'recommend'] },
  { id: 'training', label: 'Learning to ride / first bike', signals: ['learn', 'first', 'training', 'start'] },
  { id: 'size-fit', label: 'Size, fit, height', signals: ['size', 'fit', 'height', 'inch', 'cm'] },
  { id: 'safety', label: 'Safety / standards', signals: ['safety', 'standard', 'certif', 'helmet'] },
  { id: 'vs', label: 'Comparisons (balance bike vs ...)', signals: ['vs', 'versus', 'compare', 'difference'] },
  { id: 'weight', label: 'Lightweight / weight', signals: ['light', 'weight', 'heavy'] },
  { id: 'tire', label: 'Tire / wheel type (air vs foam)', signals: ['tire', 'tyre', 'wheel', 'air', 'foam', 'pneumatic'] },
  { id: 'budget', label: 'Budget / cheap', signals: ['cheap', 'budget', 'affordable', 'under'] },
  { id: 'strider', label: 'Brand long-tail (Strider, woom, kidvelo)', signals: ['strider', 'woom', 'kidvelo', 'kazam'] },
];

export const note = (level, name, detail) => ({ level, name, detail });

export function summarize(results) {
  const fail = results.filter((r) => r.level === 'fail').length;
  const warn = results.filter((r) => r.level === 'warn').length;
  const pass = results.filter((r) => r.level === 'pass').length;
  const total = results.length;
  const score = total ? Math.round(((pass + warn * 0.5) / total) * 100) : 0;
  return { score, pass, warn, fail, total };
}
