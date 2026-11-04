#!/usr/bin/env node
/**
 * Guard the critical CSS the prerendered pages depend on.
 *
 * Context (2026-11-04): the Tailwind bundle stopped blocking the first paint,
 * so the prerendered pages now paint on the CSS inlined in their <head>. That
 * inlined block repeats a handful of values from src/index.css - the font
 * stacks above all, because a reader sees the typeface before anything else.
 * Two copies of the same truth is one copy too many: change the font stack in
 * index.css and the prerendered pages keep the old one, which is exactly the
 * kind of drift nobody notices until the site looks wrong on a page nobody
 * opens by hand.
 *
 * So this asserts three things:
 *   1. the font stacks and the ink colour in the inlined critical CSS match
 *      the @theme block in src/index.css;
 *   2. the bundle carries no @import of an external stylesheet (an @import
 *      inside the bundle opens a third-party chain in front of every paint);
 *   3. no prerendered page ships a <link rel="stylesheet"> in its head, which
 *      is what the teardown audit counts as a render blocker.
 *
 * Run: npm run check:criticalcss
 * Self-test: node scripts/check-critical-css.mjs --self-test
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** The values that must not drift between the bundle and the inlined CSS. */
const SHARED_PROPERTIES = [
  "--font-sans",
  "--font-display",
  "--font-mono",
  "--color-km-ink",
];

/**
 * Read the custom properties out of a `@theme { ... }` block.
 * Tailwind v4 compiles @theme into a `:root` rule, so the names and the
 * values are the same either way; only the wrapper differs.
 */
function parseThemeBlock(css) {
  return parseCustomProperties(css, /@theme\s*\{/);
}

/** Read the custom properties out of the `:root { ... }` of the inlined CSS. */
function parseInlinedRootBlock(source) {
  return parseCustomProperties(source, /:root\s*\{/);
}

/**
 * Pull `--name: value;` pairs out of the first block that starts with the
 * given opener. Values are compared as written, minus the whitespace around
 * them - the two files format them differently on purpose (one is generated,
 * one is hand-written) and that difference must not count as drift.
 */
function parseCustomProperties(text, openerPattern) {
  const start = text.search(openerPattern);
  if (start === -1) return null;

  const bodyStart = text.indexOf("{", start);
  if (bodyStart === -1) return null;

  let depth = 0;
  let bodyEnd = -1;
  for (let i = bodyStart; i < text.length; i += 1) {
    if (text[i] === "{") depth += 1;
    else if (text[i] === "}") {
      depth -= 1;
      if (depth === 0) {
        bodyEnd = i;
        break;
      }
    }
  }
  if (bodyEnd === -1) return null;

  const body = text.slice(bodyStart + 1, bodyEnd);
  const properties = new Map();
  for (const match of body.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
    properties.set(match[1], match[2].trim().replace(/\s+/g, " "));
  }
  return properties;
}

/** Every .html file under a directory tree. */
function htmlFiles(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stats = statSync(path);
    if (stats.isDirectory()) htmlFiles(path, out);
    else if (entry.endsWith(".html")) out.push(path);
  }
  return out;
}

/**
 * The head of an HTML document, or the whole thing if there is no </head>.
 * Comments are stripped: a comment that quotes a tag is text, not a tag, and
 * counting it as a blocker would be a false alarm - or, worse, hiding the
 * real one behind it.
 */
function headOf(html) {
  const end = html.indexOf("</head>");
  const head = end === -1 ? html : html.slice(0, end);
  return head.replace(/<!--[\s\S]*?-->/g, "");
}

/**
 * The inlined critical CSS is a <style> block in the prerendered head. It is
 * found by its marker rather than by position, so the block can move around
 * the template without breaking the guard.
 */
const CRITICAL_CSS_MARKER = "Critical CSS.";

function findCriticalCss(source) {
  for (const match of source.matchAll(/<style>([\s\S]*?)<\/style>/g)) {
    if (match[1].includes(CRITICAL_CSS_MARKER)) return match[1];
  }
  return null;
}

/**
 * Run every rule against one set of files. Returns the problems it found, so
 * the same rules can be pointed at the real tree and at a synthetic one.
 */
function check({ indexCss, prerenderSource, htmlPaths, readHtml }) {
  const problems = [];

  const theme = parseThemeBlock(indexCss);
  if (!theme) {
    problems.push("src/index.css: no @theme block found");
  }

  const criticalCss = findCriticalCss(prerenderSource);
  if (!criticalCss) {
    problems.push(
      "scripts/prerender-pages.ts: the inlined critical CSS block was not found",
    );
  }

  if (theme && criticalCss) {
    const inlined = parseInlinedRootBlock(criticalCss);
    if (!inlined) {
      problems.push(
        "scripts/prerender-pages.ts: the inlined critical CSS has no :root block",
      );
    } else {
      for (const property of SHARED_PROPERTIES) {
        const expected = theme.get(property);
        const actual = inlined.get(property);
        if (expected === undefined) {
          problems.push(`src/index.css: @theme does not define ${property}`);
        } else if (actual === undefined) {
          problems.push(
            `scripts/prerender-pages.ts: the inlined critical CSS does not define ${property}`,
          );
        } else if (expected !== actual) {
          problems.push(
            `${property} drifted: src/index.css says "${expected}", the inlined critical CSS says "${actual}"`,
          );
        }
      }
    }
  }

  const externalImport = indexCss.match(/@import\s+(?:url\()?["']?https?:\/\/[^"')]+/i);
  if (externalImport) {
    problems.push(
      `src/index.css: @import of an external stylesheet (${externalImport[0]}) puts a third-party request in front of the first paint`,
    );
  }

  let blocking = 0;
  for (const path of htmlPaths) {
    const html = readHtml(path);
    const head = headOf(html);
    const stylesheet = head.match(/<link\b[^>]*rel="stylesheet"[^>]*>/i);
    if (stylesheet) {
      blocking += 1;
      if (blocking <= 3) {
        problems.push(
          `${path}: a <link rel="stylesheet"> in the head blocks the first paint`,
        );
      }
    }
  }
  if (blocking > 3) {
    problems.push(`...and ${blocking - 3} more page(s) with a blocking stylesheet`);
  }

  return { problems, blocking, checkedPages: htmlPaths.length };
}

// --------------------------------------------------------------------------
// Self-test. A rule set without a self-test rots for a week before anyone
// notices, so the rules are pointed at synthetic trees that are supposed to
// fail, and the guard has to fail with them.
// --------------------------------------------------------------------------
function selfTest() {
  const good = {
    indexCss: `@theme {\n  --font-sans: "Outfit", "Noto Sans SC", ui-sans-serif;\n  --font-display: "Outfit", "Noto Sans SC", ui-sans-serif;\n  --font-mono: "JetBrains Mono", ui-monospace;\n  --color-km-ink: #101828;\n}\n`,
    prerenderSource: `<style>\n/* Critical CSS. */\n:root {\n  --font-sans: "Outfit", "Noto Sans SC", ui-sans-serif;\n  --font-display: "Outfit", "Noto Sans SC", ui-sans-serif;\n  --font-mono: "JetBrains Mono", ui-monospace;\n  --color-km-ink: #101828;\n}\n</style>`,
    htmlPaths: ["/tmp/a.html"],
    readHtml: () => `<html><head><link rel="preload" as="style" href="/x.css"></head><body></body></html>`,
  };

  const cases = [
    {
      name: "a matching tree passes",
      mutate: (input) => input,
      expectProblems: 0,
    },
    {
      name: "a drifted font stack is caught",
      mutate: (input) => ({
        ...input,
        prerenderSource: input.prerenderSource.replace(
          '--font-sans: "Outfit", "Noto Sans SC", ui-sans-serif;',
          '--font-sans: "Inter", sans-serif;',
        ),
      }),
      expectProblems: 1,
    },
    {
      name: "a missing inlined property is caught",
      mutate: (input) => ({
        ...input,
        prerenderSource: input.prerenderSource.replace(
          "  --color-km-ink: #101828;\n",
          "",
        ),
      }),
      expectProblems: 1,
    },
    {
      name: "an external @import is caught",
      mutate: (input) => ({
        ...input,
        indexCss: `@import url('https://fonts.googleapis.com/css2?family=Outfit');\n${input.indexCss}`,
      }),
      expectProblems: 1,
    },
    {
      name: "a blocking stylesheet in a page head is caught",
      mutate: (input) => ({
        ...input,
        readHtml: () =>
          `<html><head><link rel="stylesheet" href="/x.css"></head><body></body></html>`,
      }),
      expectProblems: 1,
    },
    {
      name: "a missing inlined critical CSS block is caught",
      mutate: (input) => ({
        ...input,
        prerenderSource: "<style>body { margin: 0; }</style>",
      }),
      expectProblems: 1,
    },
    {
      name: "a stylesheet quoted inside an HTML comment is not a blocker",
      mutate: (input) => ({
        ...input,
        readHtml: () =>
          `<html><head><!-- the old <link rel="stylesheet"> is gone -->` +
          `<link rel="preload" as="style" href="/x.css"></head><body></body></html>`,
      }),
      expectProblems: 0,
    },
  ];

  let failed = 0;
  for (const testCase of cases) {
    const { problems } = check(testCase.mutate(good));
    const ok = problems.length === testCase.expectProblems;
    if (!ok) failed += 1;
    console.log(
      `  ${ok ? "ok  " : "FAIL"} ${testCase.name} (expected ${testCase.expectProblems} problem(s), got ${problems.length})`,
    );
    if (!ok) for (const problem of problems) console.log(`       ${problem}`);
  }
  if (failed > 0) {
    console.error(`\ncritical CSS guard SELF-TEST FAILED (${failed} case(s))`);
    process.exit(1);
  }
  console.log(`critical CSS guard self-test OK (${cases.length} cases)`);
}

if (process.argv.includes("--self-test")) {
  selfTest();
  process.exit(0);
}

const indexCss = readFileSync(join(root, "src", "index.css"), "utf8");
const prerenderSource = readFileSync(
  join(root, "scripts", "prerender-pages.ts"),
  "utf8",
);
const distDir = join(root, "dist");
const htmlPaths = htmlFiles(distDir);

const { problems, blocking, checkedPages } = check({
  indexCss,
  prerenderSource,
  htmlPaths,
  readHtml: (path) => readFileSync(path, "utf8"),
});

for (const problem of problems) console.error(`  - ${problem}`);

if (problems.length > 0) {
  console.error("\ncritical CSS guard FAILED:");
  process.exit(1);
}

console.log(
  `critical CSS guard OK (${SHARED_PROPERTIES.length} shared values, ${checkedPages} page(s) checked, ${blocking} blocking stylesheet(s))`,
);
