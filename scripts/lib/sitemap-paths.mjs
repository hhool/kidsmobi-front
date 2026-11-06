/**
 * The one definition of the path lists the Worker's sitemap is built from.
 *
 * There used to be two. The generator preferred `dist/sitemap-static-paths.json`
 * — the prerender's own statement of "these routes have no CMS record" — and
 * fell back to a "no <lastmod>" proxy when that manifest was missing. The guard
 * re-implemented only the proxy. Once the static pages got honest lastmods from
 * their source files, the proxy counted zero such routes while the manifest
 * still listed 56, so the guard went red on a tree the generator had just
 * refreshed (2026-11-06). A false alarm is not harmless: it teaches the
 * operator to ignore the guard, and the next real drift goes unnoticed. A rule
 * with two implementations has two answers.
 *
 * So both scripts import this module, and which signal was used is reported in
 * `source` rather than being implicit in each caller.
 */
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

export const STATIC_MANIFEST = 'sitemap-static-paths.json';

/** Parse `dist/sitemap.xml` into one string per `<url>` element. */
export function readSitemap(distDir) {
  const sitemapPath = resolve(distDir, 'sitemap.xml');
  const sitemap = readFileSync(sitemapPath, 'utf8');
  const entries = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => m[1]);
  return { sitemapPath, entries };
}

const locOf = (entry) => (entry.match(/<loc>([^<]+)<\/loc>/) || [])[1];
const pathOf = (loc) => new URL(loc).pathname;

/**
 * The two lists the Worker keeps, derived from what the prerender emitted.
 *
 * - `assetPaths`: every URL at `<priority>0.9`, the tier the prerender reserves
 *   for the pages this domain stands behind. Read out of the XML instead of
 *   re-deriving `sitemapPriority()`, so a change there shows up here for free.
 * - `staticNoCmsPaths`: routes with no CMS record. The manifest is the honest
 *   signal; the `<lastmod>` proxy is kept only for builds that predate it.
 */
export function deriveSitemapPaths(distDir) {
  const { entries } = readSitemap(distDir);
  const assetPaths = entries
    .filter((e) => e.includes('<priority>0.9</priority>'))
    .map((e) => pathOf(locOf(e)));

  const manifestPath = resolve(distDir, STATIC_MANIFEST);
  const source = existsSync(manifestPath) ? 'manifest' : 'lastmod-proxy';
  const staticNoCmsPaths = source === 'manifest'
    ? JSON.parse(readFileSync(manifestPath, 'utf8'))
    : entries.filter((e) => !e.includes('<lastmod>')).map((e) => pathOf(locOf(e)));

  return { assetPaths, staticNoCmsPaths, source, urlCount: entries.length };
}
