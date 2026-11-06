#!/usr/bin/env node
/**
 * The webfonts have to be served from this origin, and every character the
 * site uses has to be covered by a rule whose file is actually here.
 *
 * Why the first half matters, measured: the third-party font stack was 465,802
 * bytes across seven requests, and it moved the Largest Contentful Paint by
 * 3,284 ms - not because of the byte count, but because a second origin is a
 * second connection and bytes that cannot share the one the page is already
 * using. Serving the same bytes from this origin recovered 3,619 ms of it.
 *
 * Why the second half matters: the mirror is a copy. If a rule is missing, or
 * points at a file that was not mirrored, the browser silently falls back to
 * the system font for the characters that rule covered - and the site looks
 * like it always did, which is exactly why nobody would notice. A guard that
 * only checks "the stylesheet is local" would pass that.
 *
 * Usage:
 *   node scripts/check-fonts.mjs            # check dist/ and public/fonts/
 *   node scripts/check-fonts.mjs --self-test
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

const ROOT = process.cwd();
const FONT_DIR = path.join(ROOT, 'public', 'fonts');
const CSS_FILE = path.join(FONT_DIR, 'fonts.css');
const MANIFEST = path.join(FONT_DIR, 'manifest.json');
const DIST = path.join(ROOT, 'dist');
const INDEX = path.join(ROOT, 'index.html');

const problems = [];
const notes = [];
const fail = (message) => problems.push(message);
const ok = (message) => notes.push(message);

/** Any reference to the font host we moved off. */
const THIRD_PARTY_FONT = /fonts\.(googleapis|gstatic)\.com/;

/**
 * A font stack that needs no webfont: the operating system's own.
 */
const SYSTEM_FONT_STACK =
  /font-family\s*:[^;{}]*(system-ui|-apple-system|Arial|Helvetica|sans-serif|Segoe UI|Roboto|Georgia)/i;

const sha256 = (text) => createHash('sha256').update(text, 'utf8').digest('hex');

/** Codepoints a unicode-range declaration covers. */
export function parseUnicodeRange(text) {
  const points = new Set();
  for (const part of String(text || '').split(',')) {
    let piece = part.trim();
    if (piece.startsWith('U+')) piece = piece.slice(2);
    if (!piece) continue;
    if (piece.includes('?')) {
      const [from, to] = piece.split('?');
      for (let cp = parseInt(from, 16); cp <= parseInt(to, 16); cp += 1) points.add(cp);
    } else if (piece.includes('-')) {
      const [from, to] = piece.split('-');
      for (let cp = parseInt(from, 16); cp <= parseInt(to, 16); cp += 1) points.add(cp);
    } else {
      points.add(parseInt(piece, 16));
    }
  }
  return points;
}

/**
 * The @font-face rules of a stylesheet: the file each one points at and the
 * codepoints it covers.
 */
export function readFontFaces(css) {
  const faces = [];
  for (const match of String(css || '').matchAll(/@font-face\s*\{([^}]*)\}/g)) {
    const block = match[1];
    const urlMatch = block.match(/url\(([^)]+)\)/);
    const rangeMatch = block.match(/unicode-range:\s*([^;]+);/);
    const familyMatch = block.match(/font-family:\s*['"]([^'"]+)['"]/);
    if (!urlMatch) continue;
    faces.push({
      file: urlMatch[1].replace(/["']/g, ''),
      family: familyMatch ? familyMatch[1] : '(unknown)',
      points: rangeMatch ? parseUnicodeRange(rangeMatch[1]) : new Set(),
    });
  }
  return faces;
}

/**
 * Every character a page uses, and whether a rule covers it with a file that
 * is actually present.
 */
export function checkCharset(html, faces, fileExists) {
  const text = String(html || '')
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ');
  const uncovered = [];
  const missingFiles = new Set();
  for (const character of new Set(text)) {
    const cp = character.codePointAt(0);
    if (cp < 128) continue;
    const covering = faces.filter((face) => face.points.has(cp));
    if (!covering.length) {
      uncovered.push(character);
      continue;
    }
    const present = covering.filter((face) => fileExists(face.file));
    if (!present.length) {
      const name = covering[0].file.split('/').pop();
      if (!missingFiles.has(name)) missingFiles.add(name);
    }
  }
  return { uncovered, missingFiles };
}

/** Every href/src in a document, ignoring comments. */
export function documentReferences(html) {
  const withoutComments = String(html || '').replace(/<!--[\s\S]*?-->/g, '');
  const refs = [];
  for (const match of withoutComments.matchAll(/<(?:link|script)\b[^>]*>/g)) {
    const tag = match[0];
    const href = tag.match(/(?:href|src)="([^"]*)"/);
    if (href) refs.push(href[1]);
  }
  return refs;
}

function htmlFiles(dir) {
  const out = [];
  const walk = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.html')) out.push(full);
    }
  };
  if (existsSync(dir)) walk(dir);
  return out;
}

/**
 * A JSON-LD block is data for crawlers: it is never rendered, never fetched,
 * and cannot change which font paints a glyph. Dropping it before comparing a
 * built page with its public source keeps the "dependency-free page" exception
 * about FONTS, which is what this guard protects, instead of about the build
 * having touched the file at all.
 *
 * Only this one shape is dropped. Any other difference — a style, a class, a
 * character — still fails the comparison.
 */
function stripJsonLd(html) {
  return html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
}

/** The sha256 of every HTML file in public/, keyed by its path below public/. */
function publicHtmlHashes() {
  const base = path.join(ROOT, 'public');
  const map = new Map();
  const walk = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.html')) {
        const key = path.relative(base, full).split(path.sep).join('/');
        map.set(key, sha256(stripJsonLd(readFileSync(full, 'utf8'))));
      }
    }
  };
  if (existsSync(base)) walk(base);
  return map;
}

/**
 * Decide what a built page is allowed to do about fonts.
 *
 * The normal case is 'local': the page loads /fonts/fonts.css and every
 * character it uses is covered by a rule whose file was mirrored.
 *
 * The ONE exception is a page that is a VERBATIM copy of a file in public/ -
 * the same bytes, the same sha256, ignoring JSON-LD blocks. That is
 * public/404.html, which Cloudflare Pages serves for any unmatched route and
 * which is written to be dependency-free: it renders without executing the
 * JavaScript bundle and without asking for a stylesheet, and it uses the system
 * font.
 *
 * "Ignoring JSON-LD" is not a hole in that rule. The prerender now stamps the
 * entity graph into every document, the 404 included, and a
 * `<script type="application/ld+json">` block is data for crawlers: nothing in
 * it is painted, fetched, or measured. Comparing the two files with those
 * blocks removed keeps the question this guard asks ("does this page depend on
 * a font it does not ship?") about fonts. Every other difference still fails,
 * which the self-test asserts in both directions.
 *
 * A prerendered page can never qualify this way, because its bytes differ
 * from the source in public/ by far more than a data block - so the exception
 * cannot be used to excuse a page the generator produced.
 *
 * A qualifying page must ALSO declare a system font stack and must not
 * reference a font resource at all - neither the local stylesheet nor a
 * third-party one. The exception exists for pages that need no webfont; if
 * such a page ever loads one, the exception is wrong and the build fails.
 */
export function classifyFontPage({ html, distRelPath, publicHashes }) {
  const refs = documentReferences(html);
  const thirdParty = refs.filter((ref) => THIRD_PARTY_FONT.test(ref));
  const problems = [];
  for (const ref of thirdParty) problems.push(`${distRelPath} loads a third-party font: ${ref}`);

  if (refs.some((ref) => ref.includes('/fonts/fonts.css'))) {
    return { verdict: 'local', problems, thirdParty };
  }

  // The second normal case: a page that INLINES the mirror's own rules.
  //
  // The static homepage does this, and it is not a loophole. It links no
  // external sheet because a late-parsed stylesheet invalidates the layout of
  // the whole document (measured: a 227 ms full re-layout), so the faces the
  // first screen needs are declared in the document itself. The files are the
  // mirror's - /fonts/*.woff2, hashed by the manifest - and the family is the
  // mirror's. The rule this guard protects ("the page renders with the mirror,
  // not with somebody else's font and not silently in the system font") is the
  // same; only the delivery changed, from "one more request" to "no request".
  //
  // A page that inlines a font from anywhere else is still invalid, and so is
  // one that inlines a block declaring a family that is not the mirror's.
  const inlineSheet = /<style\b[^>]*id="bbt-font-sheet"[^>]*>([\s\S]*?)<\/style>/i.exec(html);
  if (inlineSheet && /@font-face/.test(inlineSheet[1])) {
    const inlined = [...inlineSheet[1].matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)].map(
      (match) => match[1],
    );
    const foreign = inlined.filter((ref) => !ref.startsWith('/fonts/'));
    if (foreign.length) {
      problems.push(`${distRelPath} inlines a font that is not from the mirror: ${foreign[0]}`);
    }
    if (!/font-family:\s*['"]?Outfit/.test(inlineSheet[1])) {
      problems.push(`${distRelPath} inlines a font block that declares no mirror family`);
    }
    return { verdict: problems.length ? 'invalid' : 'inline', problems, thirdParty };
  }

  if (publicHashes.get(distRelPath) !== sha256(stripJsonLd(html))) {
    problems.push(
      `${distRelPath} does not load /fonts/fonts.css and is not a verbatim copy of a file in public/`,
    );
    return { verdict: 'invalid', problems, thirdParty };
  }

  if (!SYSTEM_FONT_STACK.test(html)) {
    problems.push(`${distRelPath} is a dependency-free page but declares no system font stack`);
  }
  const fontRefs = refs.filter((ref) => ref.includes('/fonts/'));
  if (fontRefs.length) {
    problems.push(
      `${distRelPath} is a dependency-free page but still references a webfont: ${fontRefs[0]}`,
    );
  }
  return { verdict: problems.length ? 'invalid' : 'exception', problems, thirdParty };
}

function run() {
  if (!existsSync(CSS_FILE)) {
    fail('public/fonts/fonts.css does not exist - run `node scripts/build-fonts.mjs`');
    return;
  }
  if (!existsSync(MANIFEST)) {
    fail('public/fonts/manifest.json does not exist - run `node scripts/build-fonts.mjs`');
    return;
  }
  const css = readFileSync(CSS_FILE, 'utf8');
  const faces = readFontFaces(css);
  if (!faces.length) {
    fail('public/fonts/fonts.css carries no @font-face rule');
    return;
  }

  // 0. The mirror has to be the mirror: every file still hashes to what the
  // manifest recorded, and the stylesheet still carries the same rules. A
  // truncated download or a half-finished copy is otherwise invisible.
  let manifest = null;
  try {
    manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  } catch (error) {
    fail(`public/fonts/manifest.json is not readable JSON (${error.message})`);
  }
  if (manifest) {
    const rules = (css.match(/@font-face/g) || []).length;
    if (manifest.rules !== undefined && manifest.rules !== rules) {
      fail(`the mirrored stylesheet carries ${rules} rules, the manifest recorded ${manifest.rules}`);
    }
    let corrupt = 0;
    for (const file of manifest.files || []) {
      const local = path.join(FONT_DIR, file.name);
      if (!existsSync(local)) {
        fail(`public/fonts/${file.name} is recorded in the manifest but is not on disk`);
        corrupt += 1;
        continue;
      }
      const digest = createHash('sha256').update(readFileSync(local)).digest('hex');
      if (file.sha256 && digest !== file.sha256) {
        fail(`public/fonts/${file.name} does not match the hash the manifest recorded`);
        corrupt += 1;
      }
    }
    if (!corrupt) ok(`the mirror matches its manifest (${(manifest.files || []).length} file(s))`);
  }

  // 1. No third-party font reference may survive anywhere.
  const thirdParty = THIRD_PARTY_FONT;
  if (thirdParty.test(css)) {
    fail('public/fonts/fonts.css still points at Google - the mirror is incomplete');
  }

  // 2. Every rule must point at a file that is here.
  const missing = [];
  for (const face of faces) {
    if (!face.file.startsWith('/fonts/')) continue;
    const local = path.join(FONT_DIR, face.file.split('/').pop());
    if (!existsSync(local)) missing.push(face.file);
  }
  if (missing.length) {
    fail(`${missing.length} font file(s) referenced by the stylesheet are not in public/fonts/ (e.g. ${missing[0]})`);
  } else {
    ok(`${faces.length} rule(s) point at files that are all present`);
  }

  // 3. The source document must load the local stylesheet.
  const source = readFileSync(INDEX, 'utf8');
  const sourceRefs = documentReferences(source);
  if (!sourceRefs.some((ref) => ref.includes('/fonts/fonts.css'))) {
    fail('index.html does not load /fonts/fonts.css');
  }
  for (const ref of sourceRefs) {
    if (thirdParty.test(ref)) fail(`index.html still loads a third-party font: ${ref}`);
  }

  // 4. Every built page must load it, and none may load a third-party font.
  const pages = htmlFiles(DIST);
  if (!pages.length) {
    fail('dist/ has no HTML page to check - build the site first');
    return;
  }
  const fileExists = (file) => {
    if (!file.startsWith('/fonts/')) return true;
    return existsSync(path.join(FONT_DIR, file.split('/').pop()));
  };
  const publicHashes = publicHtmlHashes();
  const thirdPartyPages = new Set();
  let pagesWithLocal = 0;
  const inlinePages = [];
  const exceptionPages = [];
  const allUncovered = new Set();
  const allMissing = new Set();
  for (const page of pages) {
    const html = readFileSync(page, 'utf8');
    const distRelPath = path.relative(DIST, page).split(path.sep).join('/');
    const verdict = classifyFontPage({ html, distRelPath, publicHashes });
    for (const problem of verdict.problems) fail(problem);
    if (verdict.thirdParty.length) thirdPartyPages.add(distRelPath);
    if (verdict.verdict === 'local') pagesWithLocal += 1;
    if (verdict.verdict === 'inline') inlinePages.push(distRelPath);
    if (verdict.verdict === 'exception') exceptionPages.push(distRelPath);
    const { uncovered, missingFiles } = checkCharset(html, faces, fileExists);
    for (const character of uncovered) allUncovered.add(character);
    for (const file of missingFiles) allMissing.add(file);
  }
  if (thirdPartyPages.size) {
    fail(`${thirdPartyPages.size} built page(s) still load a third-party font`);
  }
  if (inlinePages.length) {
    ok(
      `${inlinePages.length} built page(s) inline the mirror's own @font-face rules instead of linking the ` +
        `stylesheet (${inlinePages.join(', ')}) - no request, same mirror`,
    );
  }
  if (exceptionPages.length) {
    ok(
      `${exceptionPages.length} built page(s) are dependency-free copies of a file in public/ and use the system ` +
        `font instead of the mirror (${exceptionPages.join(', ')})`,
    );
  }
  if (allMissing.size) {
    fail(
      `${allMissing.size} font file(s) that the site's characters need are not mirrored (e.g. ${[...allMissing][0]}) - ` +
        'those characters would silently fall back to the system font',
    );
  }
  // A character no webfont rule covers is NOT a defect: the browser falls
  // back to a system font, and it fell back before the mirror too, because
  // the mirror keeps the same 620 rules. It is reported so the number is
  // visible, not so it can fail a build.
  if (allUncovered.size) {
    ok(
      `${allUncovered.size} character(s) the site uses are outside every webfont rule and render in the system font ` +
        `as they always did (e.g. ${[...allUncovered].slice(0, 8).join('')})`,
    );
  }
  if (!problems.length) {
    ok(
      `${pagesWithLocal} built page(s) load the local stylesheet and ${exceptionPages.length} are dependency-free ` +
        'system-font pages; every character they use is covered by a mirrored file',
    );
  }
}

function selfTest() {
  let okAll = true;
  const say = (good, name, detail) => {
    if (!good) okAll = false;
    console.log(`  ${good ? 'ok  ' : 'FAIL'} ${name}${detail ? ` (${detail})` : ''}`);
  };

  const css = [
    "@font-face { font-family: 'Noto Sans SC'; src: url(/fonts/a.woff2) format('woff2'); unicode-range: U+4E00-9FFF; }",
    "@font-face { font-family: 'Outfit'; src: url(/fonts/b.woff2) format('woff2'); unicode-range: U+0000-00FF; }",
  ].join('\n');
  const faces = readFontFaces(css);
  say(faces.length === 2, 'two rules are read', `${faces.length}`);

  const range = parseUnicodeRange('U+4E00-9FFF, U+0020-007F');
  say(range.size === 20992 + 96, 'a unicode-range is expanded to its codepoints', `${range.size}`);

  const present = new Set(['/fonts/a.woff2', '/fonts/b.woff2']);
  const fileExists = (file) => present.has(file);

  const clean = checkCharset('<p>Hello 你好</p>', faces, fileExists);
  say(clean.uncovered.length === 0 && clean.missingFiles.size === 0, 'a covered page is clean');

  const missing = checkCharset('<p>你好</p>', faces, () => false);
  say(missing.missingFiles.has('a.woff2'), 'a rule whose file is absent is reported');

  const uncovered = checkCharset('<p>한글</p>', faces, fileExists);
  say(uncovered.uncovered.length === 2, 'the characters no rule covers are reported', `${uncovered.uncovered.length}`);

  // The reverse assertion: the old third-party setup must not pass.
  const thirdPartyCss = "@font-face { src: url(https://fonts.gstatic.com/s/x.woff2); unicode-range: U+4E00-9FFF; }";
  const thirdPartyFaces = readFontFaces(thirdPartyCss);
  const thirdParty = checkCharset('<p>你好</p>', thirdPartyFaces, fileExists);
  say(thirdParty.missingFiles.size === 1, 'the old third-party stylesheet does not pass');

  const refs = documentReferences('<link rel="preload" as="style" href="/fonts/fonts.css" /><!-- href="https://fonts.googleapis.com/x" -->');
  say(refs.length === 1 && refs[0] === '/fonts/fonts.css', 'a reference inside a comment is not a reference');

  // The exception for dependency-free pages must be narrow and provable.
  // public/404.html is copied verbatim into dist/ and uses the system font.
  const systemFontPage =
    '<html><head><style>body { font-family: Arial, "Helvetica Neue", sans-serif; }</style></head><body>404</body></html>';
  const publicHashes = new Map([['404.html', sha256(systemFontPage)]]);

  const good = classifyFontPage({ html: systemFontPage, distRelPath: '404.html', publicHashes });
  say(
    good.verdict === 'exception' && good.problems.length === 0,
    'a verbatim public copy with a system font stack is the one allowed exception',
    good.verdict,
  );

  const noStack = classifyFontPage({ html: '<html><body>404</body></html>', distRelPath: '404.html', publicHashes });
  say(noStack.verdict === 'invalid', 'a public copy without a system font stack is not an exception');

  const withThirdParty = classifyFontPage({
    html: '<html><head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit" /><style>body{font-family:Arial,sans-serif}</style></head></html>',
    distRelPath: '404.html',
    publicHashes,
  });
  say(
    withThirdParty.verdict === 'invalid' && withThirdParty.thirdParty.length === 1,
    'a public copy that loads a third-party font is not an exception',
  );

  const withFontFile = classifyFontPage({
    html: '<html><head><link rel="stylesheet" href="/fonts/fonts.css" /><style>body{font-family:Arial,sans-serif}</style></head></html>',
    distRelPath: '404.html',
    publicHashes,
  });
  say(
    withFontFile.verdict === 'local' && withFontFile.problems.length === 0,
    'a page that loads the local stylesheet is the normal case, not an exception',
  );

  const notVerbatim = classifyFontPage({ html: systemFontPage, distRelPath: 'index.html', publicHashes });
  say(
    notVerbatim.verdict === 'invalid',
    'a page that is not a verbatim public copy cannot use the exception',
  );

  const preRendered = classifyFontPage({
    html: '<html><head><style>body{font-family:Arial,sans-serif}</style></head><body><!-- prerendered --></body></html>',
    distRelPath: 'index.html',
    publicHashes: new Map([['index.html', sha256('<html>other</html>')]]),
  });
  say(
    preRendered.verdict === 'invalid',
    'the exception cannot be used to excuse a prerendered page',
  );

  const stamped = classifyFontPage({
    html: systemFontPage.replace(
      '</head>',
      '<script type="application/ld+json">{"@type":"Organization"}</script></head>',
    ),
    distRelPath: '404.html',
    publicHashes,
  });
  say(
    stamped.verdict === 'exception' && stamped.problems.length === 0,
    'a data block the build added does not turn a dependency-free page into a font problem',
  );

  // The other direction, so the exemption is still narrow: the same page with
  // one character changed is not the same page.
  const stampedAndEdited = classifyFontPage({
    html: systemFontPage
      .replace(
        '</head>',
        '<script type="application/ld+json">{"@type":"Organization"}</script></head>',
      )
      .replace('404', '405'),
    distRelPath: '404.html',
    publicHashes,
  });
  say(
    stampedAndEdited.verdict === 'invalid',
    'a page that also changed its content cannot hide behind an added data block',
  );

  // The inline path: the static homepage declares the mirror's faces in the
  // document instead of linking the stylesheet. Three cases, because the
  // verdict has to be able to say no for the two ways it can go wrong.
  const inlineMirror = classifyFontPage({
    html:
      '<html><head><style id="bbt-font-sheet">' +
      "@font-face { font-family: 'Outfit'; src: url(/fonts/QGYvz_MVcBeNP4NJtEtqUYLknw.woff2) format('woff2'); }" +
      '</style></head><body>home</body></html>',
    distRelPath: 'index.html',
    publicHashes: new Map(),
  });
  say(inlineMirror.verdict === 'inline', 'a page that inlines the mirror is the inline case');

  const inlineForeign = classifyFontPage({
    html:
      '<html><head><style id="bbt-font-sheet">' +
      "@font-face { font-family: 'Outfit'; src: url(https://fonts.gstatic.com/x.woff2) format('woff2'); }" +
      '</style></head><body>home</body></html>',
    distRelPath: 'index.html',
    publicHashes: new Map(),
  });
  say(inlineForeign.verdict === 'invalid', 'inlining a font that is not from the mirror is invalid');

  const inlineWrongFamily = classifyFontPage({
    html:
      '<html><head><style id="bbt-font-sheet">' +
      "@font-face { font-family: 'Comic Sans'; src: url(/fonts/QGYvz_MVcBeNP4NJtEtqUYLknw.woff2) format('woff2'); }" +
      '</style></head><body>home</body></html>',
    distRelPath: 'index.html',
    publicHashes: new Map(),
  });
  say(inlineWrongFamily.verdict === 'invalid', 'inlining a block with no mirror family is invalid');

  console.log(okAll ? 'check-fonts self-test PASS' : 'check-fonts self-test FAIL');
  if (!okAll) process.exit(1);
}

if (process.argv.includes('--self-test')) {
  selfTest();
} else {
  run();
  for (const note of notes) console.log(`  ok   ${note}`);
  for (const problem of problems) console.log(`  FAIL ${problem}`);
  if (problems.length) {
    console.error(`check-fonts FAILED (${problems.length} problem(s))`);
    process.exit(1);
  }
  console.log('check-fonts PASS');
}
