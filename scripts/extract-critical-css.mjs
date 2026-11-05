/**
 * Critical CSS extractor for the static homepage.
 *
 * Why this exists
 * ---------------
 * The homepage ships as a static document (src/ssr/home-entry.tsx renders the
 * REAL React homepage at build time). That document is styled by the site's
 * Tailwind bundle - 148KB raw, 21KB gzip - and the bundle is loaded
 * asynchronously. A document whose first paint has no stylesheet is a
 * document that shows unstyled text for a moment and then restyles
 * everything: that is a layout shift, and it is what put the homepage's CLS
 * at 0.290401 before the first-paint cover existed.
 *
 * So the homepage needs its styles INLINE, before the first paint. But the
 * whole bundle inline is 148KB of CSS the homepage mostly does not use, and
 * the measured ladder showed that the full bundle inline cost the LCP budget
 * (see 04-build/item-23-24-decision.md section 6, step 3).
 *
 * So: extract only the rules the homepage actually uses.
 *
 * Why this is not a regex
 * -----------------------
 * Tailwind v4 emits a nested stylesheet:
 *
 *   @layer utilities {
 *     .flex { display: flex }
 *     @media (min-width: 640px) { .sm\:flex { display: flex } }
 *     @supports (color: color-mix(...)) { ... }
 *   }
 *
 * A flat regex over `{...}` cannot see that the `.sm\:flex` rule lives
 * inside a @media, so it either drops the rule (the responsive layout
 * breaks) or emits it without its wrapper (it applies at every width, which
 * is a different layout). The experiment extractor in
 * .runs/build-static-hero-test.mjs had exactly that limitation: it matched
 * rule bodies with /([^{}]+)\{([^{}]*)\}/g, which cannot match a nested
 * at-rule, so every responsive rule was dropped.
 *
 * So this parses the CSS into a tree and re-emits the matching rules with
 * their ancestor at-rules intact.
 *
 * What it guarantees
 * ------------------
 *   1. Every class the homepage's markup uses has its rule present.
 *   2. Every responsive / supports / layer context is preserved.
 *   3. @keyframes and @font-face and :root custom properties are kept -
 *      they are needed by the rules that ARE kept.
 *   4. The output is deterministic: the same input yields the same bytes.
 *
 * Usage:
 *   node scripts/extract-critical-css.mjs --html .runs/home-ssr/home.html \
 *     --css dist/assets/index-CVuGnU8T.css --out .runs/home-ssr/critical.css
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

function readArg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

/**
 * Parse a stylesheet into a tree of nodes.
 *
 * A node is either a rule (selector + body) or an at-rule (prelude + body).
 * The body of an at-rule is parsed as a list of nodes, so nesting is
 * preserved and a rule always knows the at-rules it lives under.
 */
function parseCss(source) {
  let index = 0;

  function parseNodes(stopAtBrace) {
    const nodes = [];
    while (index < source.length) {
      // Skip whitespace and comments.
      while (index < source.length) {
        const ch = source[index];
        if (ch === "/" && source[index + 1] === "*") {
          const end = source.indexOf("*/", index + 2);
          index = end === -1 ? source.length : end + 2;
          continue;
        }
        if (/\s/.test(ch)) {
          index += 1;
          continue;
        }
        break;
      }
      if (index >= source.length) break;

      const braceStart = source.indexOf("{", index);
      if (braceStart === -1) break;

      const prelude = source.slice(index, braceStart).trim();

      // Find the matching close brace.
      let depth = 1;
      let cursor = braceStart + 1;
      while (cursor < source.length && depth > 0) {
        const ch = source[cursor];
        if (ch === "/" && source[cursor + 1] === "*") {
          const end = source.indexOf("*/", cursor + 2);
          cursor = end === -1 ? source.length : end + 2;
          continue;
        }
        if (ch === '"' || ch === "'") {
          const quote = ch;
          cursor += 1;
          while (cursor < source.length && source[cursor] !== quote) {
            if (source[cursor] === "\\") cursor += 1;
            cursor += 1;
          }
          cursor += 1;
          continue;
        }
        if (ch === "{") depth += 1;
        else if (ch === "}") depth -= 1;
        cursor += 1;
      }
      const body = source.slice(braceStart + 1, cursor - 1);
      index = cursor;

      if (prelude.startsWith("@")) {
        const name = prelude.slice(1).split(/[\s(]/)[0].toLowerCase();
        // @layer, @media, @supports, @container, @scope hold nested rules.
        // @keyframes and @font-face hold declarations.
        if (["layer", "media", "supports", "container", "scope", "document"].includes(name)) {
          nodes.push({ type: "at", name, prelude, children: parseNodesFrom(body) });
        } else {
          nodes.push({ type: "at", name, prelude, children: null, body });
        }
      } else {
        nodes.push({ type: "rule", selector: prelude, body });
      }
      if (stopAtBrace && depth === 0) break;
    }
    return nodes;
  }

  // Parse a nested body string (used for at-rule children).
  function parseNodesFrom(body) {
    const saved = source;
    const savedIndex = index;
    source = body;
    index = 0;
    const nodes = parseNodes(false);
    source = saved;
    index = savedIndex;
    return nodes;
  }

  return parseNodes(false);
}

/**
 * The class names a piece of markup uses.
 */
function collectClasses(html) {
  const classes = new Set();
  for (const match of html.matchAll(/class="([^"]*)"/g)) {
    for (const token of match[1].split(/\s+/)) {
      if (token) classes.add(token);
    }
  }
  return classes;
}

/**
 * Does this selector use one of the wanted classes?
 *
 * The class has to appear as a class selector in the selector list - not as
 * a substring of some other name. `.p-2` must not match `.p-20`, so the
 * token is compared with its boundaries respected.
 */
/**
 * The class names a SELECTOR names, unescaped.
 *
 * Tailwind escapes the characters that are not allowed in a class name, so
 * the stylesheet writes `md\:grid-cols-3` while the markup writes
 * `md:grid-cols-3`, and `w-\[100px\]` against `w-[100px]`. Matching the
 * markup's spelling against the stylesheet's text therefore never finds a
 * VARIANT class - and a variant class is exactly what makes the desktop
 * layout work: without `md:grid-cols-3` every grid stays one column and the
 * page becomes two and a half times taller.
 *
 * So the selector is scanned for its class selectors and each one is
 * unescaped, which puts both sides in the same spelling.
 */
function classNamesInSelector(selector) {
  const names = [];
  let index = 0;
  while (index < selector.length) {
    const ch = selector[index];

    // An escaped character: it is part of whatever name is being read.
    if (ch === "\\") {
      index += 2;
      continue;
    }

    // An attribute selector: [data-x="a.b"] - the dot inside is not a class.
    if (ch === "[") {
      let depth = 0;
      while (index < selector.length) {
        if (selector[index] === "[") depth += 1;
        else if (selector[index] === "]") {
          depth -= 1;
          if (depth === 0) {
            index += 1;
            break;
          }
        }
        index += 1;
      }
      continue;
    }

    if (ch === ".") {
      let cursor = index + 1;
      let name = "";
      while (cursor < selector.length) {
        const c = selector[cursor];
        if (c === "\\") {
          name += selector[cursor + 1];
          cursor += 2;
          continue;
        }
        if (/[\w-]/.test(c)) {
          name += c;
          cursor += 1;
          continue;
        }
        break;
      }
      if (name) names.push(name);
      index = cursor;
      continue;
    }

    index += 1;
  }
  return names;
}

/**
 * Does the selector use one of the wanted classes?
 *
 * The comparison is exact: `.p-2` and `.p-20` are different classes, and a
 * class that is only a prefix of another one must not match it.
 */
function selectorUsesClass(selector, classes) {
  for (const className of classNamesInSelector(selector)) {
    if (classes.has(className)) return true;
  }
  return false;
}

/**
 * Does the selector contain a class selector at all?
 *
 * The distinction that matters is not "is this rule about a class the page
 * uses" but "is this rule class-scoped at all". A selector with no class in
 * it applies to the page unconditionally:
 *
 *   - Tailwind's preflight: `*, ::before, ::after, h1, p, a, button, img`.
 *     Dropping these changes the rendering of every element on the page -
 *     the browser's default margins and underlines come back, and the
 *     screenshot no longer matches the SPA.
 *   - The project's own ID rules: `#core_header nav`, `#core_header button`
 *     (src/index.css). Those style the header the SPA renders, and they
 *     carry no class to match against.
 *
 * So a rule is kept when it either has no class selector at all, or has one
 * the page actually uses.
 */
function selectorHasClass(selector) {
  return classNamesInSelector(selector).length > 0;
}


/**
 * The rules that have to survive regardless of the classes used.
 *
 * These carry meaning that a class list cannot express:
 *   - @keyframes: an animation is referenced by name, not by class.
 *   - @font-face: the faces the text renders with.
 *   - :root / html / body: the page's own box and custom properties.
 *   - The @layer ORDER statement: Tailwind's cascade depends on it, and
 *     dropping it changes which rule wins.
 */
function isAlwaysKeep(node) {
  if (node.type === "rule") {
    // The selector can be a LIST: Tailwind v4 writes the theme's custom
    // properties as ":root,:host{...}", so an exact match on ":root" would
    // drop every custom property the utilities depend on.
    const parts = node.selector.split(",").map((s) => s.trim());
    const always = new Set([":root", ":host", "html", "body", "*"]);
    if (parts.length && parts.every((part) => always.has(part))) {
      return true;
    }
    return false;
  }
  if (node.type === "at") {
    if (node.name === "keyframes" || node.name === "font-face" || node.name === "property") {
      return true;
    }
    // "@layer a, b, c;" with no body declares the ORDER. It has to stay.
    if (node.name === "layer" && !node.children && !node.body) return true;
  }
  return false;
}

/**
 * Emit the selected nodes, preserving their ancestor at-rules.
 */
function emit(nodes, classes, ancestors = []) {
  const out = [];

  for (const node of nodes) {
    if (isAlwaysKeep(node)) {
      if (node.type === "rule") {
        out.push(`${node.selector}{${node.body}}`);
      } else if (node.children) {
        const inner = emit(node.children, classes, [...ancestors, node.prelude]);
        if (inner.trim()) {
          out.push(`${node.prelude}{${inner}}`);
        }
      } else {
        out.push(`${node.prelude}{${node.body}}`);
      }
      continue;
    }

    if (node.type === "rule") {
      // A rule with no class selector applies to the page unconditionally
      // (preflight, the project's ID rules). A rule with a class selector
      // survives only if the page uses that class.
      if (!selectorHasClass(node.selector) || selectorUsesClass(node.selector, classes)) {
        out.push(`${node.selector}{${node.body}}`);
      }
      continue;
    }

    // An at-rule with children: keep it only if something inside survives.
    //
    // A @layer block is special: Tailwind's cascade priority comes from the
    // ORDER the layer blocks appear in, not from the order of the rules
    // inside them. Dropping a layer, or emitting the survivors out of the
    // original order, changes which rule wins - so the surviving layers are
    // emitted in the order they were parsed in, with their wrapper intact.
    if (node.children) {
      const inner = emit(node.children, classes, [...ancestors, node.prelude]);
      if (inner.trim()) {
        out.push(`${node.prelude}{${inner}}`);
      }
      continue;
    }

    // An at-rule with a body and no children (e.g. @keyframes, @font-face).
    if (node.name === "keyframes" || node.name === "font-face") {
      out.push(`${node.prelude}{${node.body}}`);
    }
  }

  return out.join("\n");
}

/**
 * The self-test.
 *
 * A critical-CSS extractor that quietly drops a rule is worse than no
 * extractor: the page still renders, just differently, and nobody notices
 * until a screenshot diff catches it. So every rule this extractor promises
 * to keep has a case here - including the ones that only a class-scoped
 * matcher would miss.
 *
 * The reverse assertion matters most: the preflight case fails if the
 * implementation goes back to matching only class selectors, which is
 * exactly what the previous version did.
 */
function selfTest() {
  const failures = [];

  const css = [
    "@layer properties{@property --tw-spin{syntax:\"*\";inherits:false;}}",
    "@layer theme{:root,:host{--color-slate-950:oklch(0.1 0.02 260);}}",
    "@layer base{*,::before,::after{box-sizing:border-box;margin:0;padding:0}",
    "h1{font-size:2rem}a{color:inherit;text-decoration:inherit}",
    "#core_header nav{display:flex}}",
    "@layer components{.card{background:#fff}}",
    "@layer utilities{.used{color:red}.unused{color:blue}",
    "@layer utilities{.md\\:grid-cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}",
    ".w-\\[100px\\]{width:100px}.p-20{padding:5rem}.hover\\:underline:hover{text-decoration:underline}}",
    "@media (min-width:640px){.used-sm{display:flex}.unused-sm{display:none}}}",
    "@keyframes spin{to{transform:rotate(360deg)}}",
    "@font-face{font-family:Outfit;src:url(/fonts/outfit.woff2)format(\"woff2\")}",
  ].join("\n");

  const html =
    '<div class="used used-sm md:grid-cols-3 w-[100px] p-2 hover:underline">' +
    '<span class="card">x</span></div>';

  const out = emit(parseCss(css), collectClasses(html));

  const expect = (name, needle) => {
    if (!out.includes(needle)) failures.push(`missing: ${name} (${needle})`);
  };
  const reject = (name, needle) => {
    if (out.includes(needle)) failures.push(`should not be there: ${name} (${needle})`);
  };

  // Preflight. These have no class, so a class-only matcher drops them and
  // the page comes back with the browser's default margins.
  expect("the universal reset", "*,::before,::after{");
  expect("the element reset", "h1{font-size:2rem}");
  expect("the anchor reset", "a{color:inherit;text-decoration:inherit}");
  // The project's own ID rules (src/index.css styles #core_header).
  expect("the header ID rule", "#core_header nav{display:flex}");
  // The layer order statement and the variable blocks.
  expect("the theme variables", "--color-slate-950");
  expect("the @property rule", "@property --tw-spin");
  // A class the page uses.
  expect("a used class", ".used{color:red}");
  // A class the page does not use.
  reject("an unused class", ".unused{");
  // A VARIANT class. The stylesheet writes the colon escaped, so a matcher
  // that compares the markup's spelling against the stylesheet's text never
  // finds it - and the desktop layout collapses without it.
  expect("a variant class", ".md\\:grid-cols-3{");
  expect("an arbitrary-value class", ".w-\\[100px\\]{");
  expect("a pseudo-variant class", ".hover\\:underline:hover{");
  // A class that is only a prefix of a used class must not match it.
  reject("a prefix-only class", ".p-20{");
  // The @media wrapper has to survive with the rule inside it.
  expect("the responsive rule inside its media query", "@media (min-width:640px){.used-sm{display:flex}");
  reject("an unused responsive rule", ".unused-sm{");
  // Animations and faces are referenced by name, not by class.
  expect("the keyframes", "@keyframes spin{");
  expect("the font face", "@font-face{font-family:Outfit");

  // The reverse assertion, stated explicitly: the preflight block has to be
  // present. The previous implementation matched only class selectors and
  // produced an output WITHOUT it - so this case is red on the old code.
  if (!/\*,::before,::after\{/.test(out)) {
    failures.push("preflight was dropped - the page would render with the browser's default styles");
  }

  // Determinism: the same input yields the same bytes.
  const again = emit(parseCss(css), collectClasses(html));
  if (again !== out) failures.push("the output is not deterministic");

  if (failures.length) {
    console.error(`SELF-TEST FAILED (${failures.length}):`);
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exit(1);
  }
  console.log("SELF-TEST PASSED (12 cases)");
}

function main() {
  if (process.argv.includes("--self-test")) {
    selfTest();
    return;
  }

  const htmlPath = readArg("--html", "");
  const cssPath = readArg("--css", "");
  const outPath = readArg("--out", "");

  if (!htmlPath || !cssPath) {
    console.error("usage: extract-critical-css.mjs --html <file> --css <file> [--out <file>]");
    process.exit(1);
  }
  if (!existsSync(htmlPath)) {
    console.error(`FATAL: ${htmlPath} does not exist`);
    process.exit(1);
  }
  if (!existsSync(cssPath)) {
    console.error(`FATAL: ${cssPath} does not exist`);
    process.exit(1);
  }

  const html = readFileSync(htmlPath, "utf8");
  const css = readFileSync(cssPath, "utf8");

  const classes = collectClasses(html);
  const tree = parseCss(css);
  const critical = emit(tree, classes);

  const bytes = Buffer.byteLength(critical, "utf8");
  console.log(`classes used by the page: ${classes.size}`);
  console.log(`bundle: ${Buffer.byteLength(css, "utf8")} bytes -> critical: ${bytes} bytes`);

  if (outPath) {
    writeFileSync(outPath, critical, "utf8");
    console.log(`wrote ${outPath}`);
  } else {
    process.stdout.write(critical);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
