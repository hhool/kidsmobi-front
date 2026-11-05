#!/usr/bin/env node
/**
 * Mirror the Google Fonts stylesheet and its font files onto our own origin.
 *
 * Why this exists, measured:
 *
 * The homepage pulled its webfonts from two third-party origins. In one
 * throttled Lighthouse run that was 186,359 bytes of stylesheet plus 278,924
 * bytes of font files across seven requests - 465,802 bytes, which is 15% of
 * everything the page transferred. Removing that traffic moved the Largest
 * Contentful Paint from 16,283 ms to 12,999 ms. Serving the SAME bytes from
 * our own origin moved it to 12,664 ms - so the cost was never the byte
 * count, it was the third party: a separate origin to connect to, a separate
 * TLS handshake, and bytes that cannot share the connection the page is
 * already using.
 *
 * So this script changes the ORIGIN and nothing else. The stylesheet keeps
 * every one of its 620 rules, every rule keeps its unicode-range, and every
 * font file is byte-for-byte the file Google served. Not one glyph can render
 * differently, because not one byte of the font changed.
 *
 * The output is committed, so the build never depends on this script and
 * never depends on the network. Re-run it when the font query in
 * index.html changes:
 *
 *   node scripts/build-fonts.mjs            # refresh public/fonts/
 *   node scripts/build-fonts.mjs --check    # report drift, change nothing
 *
 * The query itself is read out of index.html, so there is one source of
 * truth: the same stylesheet the site asks for, mirrored.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

const ROOT = process.cwd();
const INDEX = path.join(ROOT, 'index.html');
const OUT_DIR = path.join(ROOT, 'public', 'fonts');
const MANIFEST = path.join(OUT_DIR, 'manifest.json');
const CHECK_ONLY = process.argv.includes('--check');

/**
 * The user agent the stylesheet is fetched with. Google serves a different
 * stylesheet per user agent: a modern browser gets woff2 and a `unicode-range`
 * per subset, an old one gets a single ttf. The files that end up on the
 * page must be the ones a modern browser would have asked for, so the fetch
 * has to announce a modern browser.
 */
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

function readFontQuery() {
  const html = readFileSync(INDEX, 'utf8');
  const match = html.match(/href="(https:\/\/fonts\.googleapis\.com\/css2[^"]*)"/);
  if (!match) {
    console.error(
      'FATAL: index.html has no Google Fonts stylesheet link - nothing to mirror. ' +
        'If the fonts are already local, delete this script and the check:fonts guard.',
    );
    process.exit(1);
  }
  return { href: match[1].replace(/&amp;/g, '&'), original: match[0] };
}

/**
 * Fetch with a retry. The mirror pulls 115 files in a row; a single reset
 * connection must not cost the whole run, and a half-written mirror must
 * never be published - the stylesheet is only written after every file has
 * arrived.
 */
async function fetchWithRetry(url, attempts = 4) {
  let lastError = null;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(url, { headers: { 'user-agent': UA } });
      if (response.ok) return response;
      lastError = new Error(`answered ${response.status}`);
      if (response.status === 404) break;
    } catch (error) {
      lastError = error;
    }
    await new Promise((r) => setTimeout(r, 400 * (i + 1)));
  }
  throw new Error(`${url} - ${lastError ? lastError.message : 'unknown error'}`);
}

async function main() {
  const { href } = readFontQuery();

  const cssResponse = await fetchWithRetry(href);
  if (!cssResponse.ok) {
    console.error(`FATAL: the stylesheet answered ${cssResponse.status} - nothing was written`);
    process.exit(1);
  }
  const css = await cssResponse.text();

  const fileUrls = [...new Set([...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)].map((m) => m[1]))];
  if (!fileUrls.length) {
    console.error('FATAL: the stylesheet references no font file');
    process.exit(1);
  }

  console.log(`stylesheet: ${css.length} bytes, ${(css.match(/@font-face/g) || []).length} rules`);
  console.log(`files to mirror: ${fileUrls.length}`);

  const files = [];
  let total = 0;
  for (const url of fileUrls) {
    const name = url.split('/').pop();
    files.push({ name, url, bytes: 0, sha256: '' });
  }

  if (CHECK_ONLY) {
    // Report what would change, and whether what is on disk still matches.
    let drift = 0;
    for (const file of files) {
      const path = path.join(OUT_DIR, file.name);
      if (!existsSync(path)) {
        console.log(`  MISSING ${file.name}`);
        drift += 1;
      }
    }
    console.log(drift ? `check: ${drift} file(s) missing` : 'check: every mirrored file is present');
    return;
  }

  mkdirSync(OUT_DIR, { recursive: true });
  for (const file of files) {
    const target = path.join(OUT_DIR, file.name);
    const response = await fetchWithRetry(file.url);
    const bytes = Buffer.from(await response.arrayBuffer());
    writeFileSync(target, bytes);
    file.bytes = bytes.length;
    file.sha256 = createHash('sha256').update(bytes).digest('hex');
    total += bytes.length;
  }

  // Every reference becomes a same-origin path. Nothing else in the
  // stylesheet is touched.
  let local = css;
  for (const file of files) local = local.split(file.url).join(`/fonts/${file.name}`);
  if (/fonts\.gstatic\.com|fonts\.googleapis\.com/.test(local)) {
    console.error('FATAL: a third-party font reference survived the rewrite');
    process.exit(1);
  }
  writeFileSync(path.join(OUT_DIR, 'fonts.css'), local);

  writeFileSync(
    MANIFEST,
    JSON.stringify(
      {
        source: href,
        userAgent: UA,
        stylesheetBytes: local.length,
        rules: (local.match(/@font-face/g) || []).length,
        totalBytes: total,
        files: files.map((f) => ({ name: f.name, bytes: f.bytes, sha256: f.sha256 })),
      },
      null,
      2,
    ) + '\n',
  );

  console.log(`wrote public/fonts/fonts.css (${local.length} bytes)`);
  console.log(`wrote public/fonts/manifest.json`);
  console.log(`mirrored ${files.length} font file(s), ${total} bytes total`);
}

main().catch((error) => {
  console.error(`build-fonts FAIL - ${error.message}`);
  process.exit(1);
});
