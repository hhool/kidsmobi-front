#!/usr/bin/env node
/**
 * Guard the shipped variant-B static first-screen cover.
 *
 * The cover is an inline script injected by src/lib/firstPaint.ts at the one
 * place the prerender writes a page. It must be inline (a <script src> would
 * add a render-blocking request and break criterion 26), it must run after
 * #root is parsed and before the deferred entry module executes, and it must
 * never leave a reader stranded on the static page if the SPA never becomes
 * ready.
 *
 * Two halves, because the cover has two kinds of failure:
 *
 *   - Source shape (R1-R12). One copy of the script, injected once, inline,
 *     a ceiling that exists, a readiness test that looks at the route's own
 *     content rather than at a guessed character count.
 *   - Runtime behaviour (B1-B9). The cover's real hazards are runtime: a
 *     white screen if the ceiling reveals an empty #root, a permanent
 *     skeleton if it reveals a Suspense fallback, a layout shift if the
 *     cover re-enters the document flow. Those cannot be seen by reading the
 *     source, so the guard executes the shipped script against a small DOM
 *     (scripts/first-paint-dom.mjs) and asserts what the reader would have
 *     seen.
 *
 * Every rule has a mutation test in --self-test, and the mutations are
 * applied to the REAL shipped source, not to a fixture - a fixture that
 * satisfies the rules by construction proves nothing.
 *
 * Run:        node scripts/check-first-paint.mjs
 * Self-test:  node scripts/check-first-paint.mjs --self-test
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createEnv, spaReadyContent, spaSkeletonContent } from "./first-paint-dom.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT_ID = "bbt-first-paint";
const BOOT_SOURCE = "src/lib/firstPaint.ts";
const PRERENDER_SOURCE = "scripts/prerender-pages.ts";

function htmlFiles(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir).sort()) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) htmlFiles(p, out);
    else if (entry.endsWith(".html")) out.push(p);
  }
  return out;
}

/** Pull the injected inline script out of one document. */
function bootScriptOf(html) {
  const start = html.indexOf(`<script id="${SCRIPT_ID}">`);
  if (start === -1) return null;
  const from = start + `<script id="${SCRIPT_ID}">`.length;
  const end = html.indexOf("</script>", from);
  return end === -1 ? null : html.slice(from, end);
}

/**
 * The boot script as declared in src/lib/firstPaint.ts. The shipped pages
 * must carry this exact text, so a rule that reads the source and a rule
 * that reads a published page are reading the same thing.
 */
function declaredScript(source) {
  const opener = "FIRST_PAINT_BOOT_SCRIPT = `";
  const at = source ? source.indexOf(opener) : -1;
  if (at === -1) return null;
  const from = at + opener.length;
  const end = source.indexOf("`;", from);
  if (end === -1) return null;
  return source.slice(from, end);
}

/**
 * Blank out string literals and comments, keeping the length. Brace matching
 * then cannot be fooled by a brace, a quote or a comment.
 *
 * Comments matter here. The boot script explains itself in prose, and a
 * comment that quotes a phrase - "Real content" means ... - used to leave
 * this masker inside a "string" that ran on into real code. Every block
 * slice after that point came back empty and the rules went quiet instead
 * of red, which is the worst way for a guard to fail.
 */
function maskStrings(text) {
  const out = text.split("");
  let quote = null;
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (quote) {
      if (ch === "\\") {
        out[i] = " ";
        if (i + 1 < text.length) out[i + 1] = " ";
        i += 2;
        continue;
      }
      if (ch === quote) quote = null;
      out[i] = " ";
      i += 1;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === "`") {
      quote = ch;
      out[i] = " ";
      i += 1;
      continue;
    }
    if (ch === "/" && text[i + 1] === "/") {
      while (i < text.length && text[i] !== "\n") {
        out[i] = " ";
        i += 1;
      }
      continue;
    }
    if (ch === "/" && text[i + 1] === "*") {
      while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) {
        if (text[i] !== "\n") out[i] = " ";
        i += 1;
      }
      out[i] = " ";
      if (i + 1 < text.length) out[i + 1] = " ";
      i += 2;
      continue;
    }
    out[i] = text[i];
    i += 1;
  }
  return out.join("");
}

/**
 * The body of the block that starts at `anchor`, brace-matched. Slicing by
 * anchor rather than by a bare method name: a guard that searches for
 * "contentReady" can be fed green by its own literals, and one that slices
 * the wrong function body checks nothing.
 */
function sliceBlock(text, anchor) {
  if (!text) return null;
  const at = text.indexOf(anchor);
  if (at === -1) return null;
  const open = text.indexOf("{", at);
  if (open === -1) return null;
  const masked = maskStrings(text);
  let depth = 0;
  for (let i = open; i < text.length; i += 1) {
    if (masked[i] === "{") depth += 1;
    else if (masked[i] === "}") {
      depth -= 1;
      if (depth === 0) return text.slice(open + 1, i);
    }
  }
  return null;
}

/**
 * Run every rule against one tree. `read` is injectable so the self-test can
 * feed synthetic trees without touching the working directory.
 */
function check({ htmlPaths, read, source, prerenderSource, applyTwice }) {
  const problems = [];
  const tag = `<script id="${SCRIPT_ID}">`;

  // R1: one source of truth, and the prerender must actually call its hook.
  if (!source || !source.includes("export const FIRST_PAINT_BOOT_SCRIPT")) {
    problems.push(`R1 ${BOOT_SOURCE}: no FIRST_PAINT_BOOT_SCRIPT export`);
  }
  if (!source || !source.includes("export function applyFirstPaintToHtml")) {
    problems.push(`R1 ${BOOT_SOURCE}: no applyFirstPaintToHtml export`);
  }
  if (!prerenderSource || !prerenderSource.includes("applyFirstPaintToHtml(")) {
    problems.push(`R1 ${PRERENDER_SOURCE}: hook is not called`);
  }

  // R2: the script is inline and cannot close itself early.
  const declared = declaredScript(source);
  if (!declared || /<\/script/i.test(declared)) {
    problems.push("R2 boot script is missing or contains a closing script tag");
  }
  if (declared && (/<script[^>]*\bsrc=/i.test(declared) || /document\.write/.test(declared))) {
    problems.push("R2 boot script must stay inline and free of document.write");
  }

  // R3: applying the hook twice must be a no-op.
  if (applyTwice && applyTwice !== true) {
    problems.push(`R3 hook is not idempotent: ${applyTwice}`);
  }

  // R4/R5/R6/R6b: every published HTML carries exactly one script, in the
  // body, before </body>, after #root, with the safety ceiling, and byte for
  // byte the script the source declares.
  if (!htmlPaths.length) problems.push("R4 no HTML files found");
  let reference = null;
  for (const p of htmlPaths) {
    const html = read(p);
    const count = html.split(tag).length - 1;
    // public/404.html is a static, dependency-free error page with no #root
    // and no SPA entry. It must NOT get a cover: there is nothing to reveal.
    if (!html.includes('id="root"')) {
      if (count !== 0) problems.push(`R4 ${p}: static page without #root carries a boot script`);
      continue;
    }
    if (count !== 1) {
      problems.push(`R4 ${p}: expected 1 boot script, found ${count}`);
      continue;
    }
    const at = html.indexOf(tag);
    const rootAt = html.indexOf('id="root"');
    const bodyEnd = html.lastIndexOf("</body>");
    const headEnd = html.indexOf("</head>");
    if (rootAt === -1 || at < rootAt) problems.push(`R5 ${p}: boot script runs before #root exists`);
    if (headEnd !== -1 && at < headEnd) problems.push(`R5 ${p}: boot script is in <head>`);
    if (bodyEnd === -1 || at > bodyEnd) problems.push(`R5 ${p}: boot script is not before </body>`);
    const script = bootScriptOf(html);
    if (script === null) {
      problems.push(`R5 ${p}: boot script block is not terminated`);
      continue;
    }
    if (!/setTimeout\(function \(\)[\s\S]*16000/.test(script)) {
      problems.push(`R6 ${p}: the 16s safety ceiling is missing`);
    }
    if (!script.includes("data-first-paint") || !script.includes("content-ready")) {
      problems.push(`R6 ${p}: readiness signalling is missing`);
    }
    // R6b: the page must carry the script the source declares. A source fix
    // that is never rebuilt ships an old cover, and every other rule here
    // would still be reading the new text.
    if (declared && script.trim() !== declared.trim()) {
      problems.push(`R6b ${p}: the shipped boot script differs from ${BOOT_SOURCE}`);
    }
    // All pages must ship byte-identical boot logic.
    if (reference === null) reference = script;
    else if (script !== reference) problems.push(`R6 ${p}: boot script differs from the first page`);
  }

  // R7-R12 read the declared script.
  if (declared) {
    // R7: the ceiling must never reveal. Revealing there would swap the
    // article for an empty #root (white screen) or a permanent skeleton.
    const ceiling = sliceBlock(declared, "window.setTimeout(function () {");
    if (!ceiling) {
      problems.push("R7 the 16s ceiling block is missing");
    } else {
      if (!/keepStatic\(/.test(ceiling)) {
        problems.push("R7 the ceiling must keep the static article on screen");
      }
      if (/\breveal\(/.test(ceiling)) {
        problems.push("R7 the ceiling must not reveal the SPA");
      }
      if (/disconnect/.test(ceiling)) {
        problems.push("R7 the ceiling must not stop the observer");
      }
    }

    // R8: readiness is structural. It looks at the route's own content
    // region, not at a character count - the shortest published page carries
    // about 1,050 characters, so a 2,500-character floor can never be met.
    const ready = sliceBlock(declared, "function contentReady(");
    if (!ready) {
      problems.push("R8 contentReady is missing");
    } else {
      for (const token of ["#decision_core", "#primary_tab_viewport", "footer#main_footer"]) {
        if (!ready.includes(token)) problems.push(`R8 contentReady must check ${token}`);
      }
      for (const m of ready.matchAll(/>=?\s*(\d{3,})/g)) {
        const floor = Number(m[1]);
        if (floor >= 1000) problems.push(`R8 contentReady uses a ${floor}-character floor`);
      }
    }

    // R9: the Suspense fallback is route dependent, so every route's
    // fallback has to be recognised. Missing the product-detail skeleton
    // let a product page reveal while its skeleton was still up.
    for (const token of [
      '[aria-busy="true"]',
      "Loading BalanceBikeToddler",
      "Loading review content",
      "正在加载评测内容",
    ]) {
      if (!declared.includes(token)) problems.push(`R9 the fallback check is missing ${token}`);
    }

    // R10: the reason is published, so an audit can tell a real SPA takeover
    // apart from a page that never left the static cover.
    if (!declared.includes("performance.mark('bbt-first-paint:'")) {
      problems.push("R10 the reveal reason is not published as a performance mark");
    }
    if (!declared.includes("data-first-paint")) {
      problems.push("R10 the reveal reason is not published as an attribute");
    }

    // R11: the static cover stays fixed and out of the flow. Making it
    // relative puts a 17,000px document back into the layout - which is the
    // 0.290401 CLS all over again.
    const keep = sliceBlock(declared, "function keepStatic(");
    if (!keep) {
      problems.push("R11 keepStatic is missing");
    } else {
      if (!keep.includes("overflow")) {
        problems.push("R11 the static cover must become scrollable");
      }
      if (/position/.test(keep)) {
        problems.push("R11 the static cover must stay fixed and out of the flow");
      }
    }

    // R12: a browser without MutationObserver still has to work.
    if (!/setInterval\(/.test(declared)) {
      problems.push("R12 there is no polling fallback for browsers without MutationObserver");
    }
    if (!/clearInterval\(/.test(declared)) {
      problems.push("R12 the polling fallback is never stopped");
    }
  }

  return problems;
}

/* --------------------------------------------------------- behaviour ----- */

/**
 * Execute the shipped script against the small DOM and assert what a reader
 * would have seen. These are the failure modes the source rules cannot see.
 */
function behaviourProblems(script) {
  const problems = [];
  const scenario = (name, fn) => {
    try {
      fn();
    } catch (error) {
      problems.push(`${name}: threw ${error.message}`);
    }
  };

  if (!script) {
    problems.push("B0 no boot script to execute");
    return problems;
  }

  // B1: the SPA takes over, the reader sees the SPA.
  scenario("B1", () => {
    const env = createEnv();
    env.run(script);
    if (env.revealed()) problems.push("B1: revealed before the SPA mounted");
    if (!env.cover()) {
      problems.push("B1: no cover was created");
      return;
    }
    env.mountSpa(spaReadyContent(env));
    if (!env.revealed()) problems.push("B1: did not reveal when the SPA content landed");
    if (env.reason() !== "content-ready") problems.push(`B1: reason is ${env.reason()}`);
    if (env.root.style.display !== "") problems.push("B1: #root is still hidden after the reveal");
    if (env.cover()) problems.push("B1: the cover is still in the document");
    if (!env.marks.includes("bbt-first-paint:content-ready")) {
      problems.push("B1: no reveal mark");
    }
  });

  // B2: a product detail page must not be revealed while its own skeleton
  // is up, and must be revealed once the real copy lands.
  scenario("B2", () => {
    const env = createEnv();
    env.run(script);
    env.mountSpa(spaSkeletonContent(env));
    if (env.revealed()) problems.push("B2: revealed while the product detail skeleton was up");
    env.mountSpa(spaReadyContent(env));
    if (!env.revealed()) problems.push("B2: never revealed after the real content landed");
  });

  // B3: the ceiling must not paint a white screen.
  scenario("B3", () => {
    const env = createEnv();
    env.run(script);
    env.advance(16000);
    if (env.revealed()) problems.push("B3: the ceiling revealed #root");
    if (env.root.style.display !== "none") problems.push("B3: #root became visible");
    if (!env.cover()) problems.push("B3: the cover was removed");
    if (env.reason() !== "timeout") problems.push(`B3: reason is ${env.reason()}`);
    if (env.root.getAttribute("data-first-paint") !== "timeout") {
      problems.push("B3: the timeout reason is not published");
    }
    if (!env.marks.includes("bbt-first-paint:timeout")) problems.push("B3: no timeout mark");
    const cover = env.cover();
    if (cover && cover.style.overflow !== "auto") {
      problems.push("B3: the static cover is not scrollable");
    }
  });

  // B4: a late SPA still takes over after the ceiling.
  scenario("B4", () => {
    const env = createEnv();
    env.run(script);
    env.advance(16000);
    env.mountSpa(spaReadyContent(env));
    if (!env.revealed()) problems.push("B4: the late SPA never took over");
    if (env.reason() !== "content-ready") problems.push(`B4: reason is ${env.reason()}`);
  });

  // B5: the static cover never re-enters the document flow.
  scenario("B5", () => {
    const env = createEnv();
    env.run(script);
    env.advance(16000);
    const cover = env.cover();
    if (!cover) {
      problems.push("B5: the cover was removed");
      return;
    }
    if (cover.style.position) problems.push("B5: the cover left the fixed positioning");
    if (!String(cover.style.cssText || "").includes("position:fixed")) {
      problems.push("B5: the cover is not fixed");
    }
  });

  // B6: a broken page reveals as an error instead of hanging.
  scenario("B6", () => {
    const env = createEnv();
    env.run(script);
    env.mountSpa([
      env.el("div", { id: "decision_core", text: "Page Recovery Mode" }),
      env.el("main", {
        id: "primary_tab_viewport",
        children: [env.el("p", { text: "Page Recovery Mode - the page could not be loaded" })],
      }),
      env.el("footer", { id: "main_footer", text: "footer" }),
    ]);
    if (!env.revealed()) problems.push("B6: the error path never revealed");
    if (env.reason() !== "error") problems.push(`B6: reason is ${env.reason()}`);
  });

  // B7: the polling fallback carries browsers without MutationObserver.
  scenario("B7", () => {
    const env = createEnv({ withMutationObserver: false });
    env.run(script);
    env.mountSpa(spaReadyContent(env));
    env.advance(100);
    if (!env.revealed()) problems.push("B7: the polling fallback never revealed");
  });

  // B8: a short real page is ready; a near-empty region is not.
  scenario("B8", () => {
    const short = createEnv();
    short.run(script);
    short.mountSpa([
      short.el("div", { id: "decision_core", text: "decision core" }),
      short.el("main", {
        id: "primary_tab_viewport",
        children: [short.el("p", { text: "x".repeat(1050) })],
      }),
      short.el("footer", { id: "main_footer", text: "footer" }),
    ]);
    if (!short.revealed()) {
      problems.push("B8: a 1,050-character page was not treated as ready");
    }

    const thin = createEnv();
    thin.run(script);
    thin.mountSpa([
      thin.el("div", { id: "decision_core" }),
      thin.el("main", {
        id: "primary_tab_viewport",
        children: [thin.el("p", { text: "Loading" })],
      }),
      thin.el("footer", { id: "main_footer" }),
    ]);
    if (thin.revealed()) problems.push("B8: a near-empty main region was treated as ready");
  });

  // B9: an incomplete shell - no site footer - is not a finished SPA.
  scenario("B9", () => {
    const env = createEnv();
    env.run(script);
    env.mountSpa([
      env.el("div", { id: "decision_core", text: "decision core" }),
      env.el("main", {
        id: "primary_tab_viewport",
        children: [env.el("h1", { text: "Half a page" }), env.el("p", { text: "y".repeat(400) })],
      }),
    ]);
    if (env.revealed()) problems.push("B9: revealed a shell without the site footer");
  });

  return problems;
}

const realTree = () => {
  const source = readFileSync(join(root, BOOT_SOURCE), "utf8");
  const prerenderSource = readFileSync(join(root, PRERENDER_SOURCE), "utf8");
  return {
    htmlPaths: htmlFiles(join(root, "dist")),
    read: (p) => readFileSync(p, "utf8"),
    source,
    prerenderSource,
    applyTwice: checkIdempotence(),
  };
};

/**
 * Actually execute the shipped hook. Node 22 strips the type annotations from
 * this dependency-free TS module, so this is the real function and the real
 * boot script - not a mirror of them. Applying it twice must be a no-op.
 */
function checkIdempotence() {
  const url = pathToFileURL(join(root, BOOT_SOURCE)).href;
  const closingTag = "</scr" + "ipt>";
  const probe = `
    const m = await import(${JSON.stringify(url)});
    const base = '<html><head></head><body><div id="root"></div></body></html>';
    const once = m.applyFirstPaintToHtml(base);
    const twice = m.applyFirstPaintToHtml(once);
    const at = once.indexOf('id="bbt-first-paint"');
    const ok = once === twice && at > once.indexOf('id="root"')
      && at < once.lastIndexOf('</body>')
      && m.FIRST_PAINT_BOOT_SCRIPT.includes('16000')
      && !m.FIRST_PAINT_BOOT_SCRIPT.includes(${JSON.stringify(closingTag)});
    console.log(ok ? 'ok' : 'bad');
  `;
  try {
    const out = execFileSync(
      process.execPath,
      ["--experimental-strip-types", "--input-type=module", "-e", probe],
      { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    ).trim();
    return out === "ok" ? true : `hook produced ${out}`;
  } catch (error) {
    return `hook could not be executed: ${error.message}`;
  }
}

/** A synthetic but structurally faithful tree for the rule-engine tests. */
function synthetic(overrides = {}) {
  const script = [
    "(function () {",
    "  var root = document.getElementById('root');",
    "  var cover = root;",
    "  var observer = null;",
    "  var poll = null;",
    "  function reveal(reason) {",
    "    root.setAttribute('data-first-paint', 'ready');",
    "    try { performance.mark('bbt-first-paint:' + reason); } catch (e) {}",
    "  }",
    "  function keepStatic(reason) {",
    "    cover.style.overflow = 'auto';",
    "    root.setAttribute('data-first-paint', reason);",
    "    try { performance.mark('bbt-first-paint:' + reason); } catch (e) {}",
    "  }",
    "  function fallbackPending() {",
    "    if (root.querySelector('[aria-busy=\"true\"]')) return true;",
    "    var text = root.textContent || '';",
    "    if (text.indexOf('Loading BalanceBikeToddler') !== -1) return true;",
    "    if (text.indexOf('Loading review content') !== -1) return true;",
    "    if (text.indexOf('正在加载评测内容') !== -1) return true;",
    "    return false;",
    "  }",
    "  function contentReady() {",
    "    if (!root.querySelector('#decision_core')) return false;",
    "    if (!root.querySelector('footer#main_footer')) return false;",
    "    var main = root.querySelector('#primary_tab_viewport');",
    "    if (!main) return false;",
    "    var mainText = (main.textContent || '').replace(/\\s+/g, ' ').trim();",
    "    if (main.querySelector('h1')) return true;",
    "    return mainText.length > 120;",
    "  }",
    "  function evaluate() {",
    "    if (contentReady() && !fallbackPending()) {",
    "      if (observer) observer.disconnect();",
    "      if (poll) clearInterval(poll);",
    "      reveal('content-ready');",
    "      return true;",
    "    }",
    "    return false;",
    "  }",
    "  if (typeof MutationObserver !== 'undefined') {",
    "    observer = new MutationObserver(function () { evaluate(); });",
    "    observer.observe(root, { childList: true, subtree: true, characterData: true });",
    "  } else {",
    "    poll = setInterval(function () { evaluate(); }, 100);",
    "  }",
    "  window.setTimeout(function () { keepStatic('timeout'); }, 16000);",
    "})();",
  ].join("\n");
  const source =
    "export const FIRST_PAINT_BOOT_SCRIPT = `" +
    script +
    "`;\n" +
    "export function applyFirstPaintToHtml(html) {\n" +
    "  const marker = `id=\"bbt-first-paint\"`;\n" +
    "  if (html.includes(marker)) return html;\n" +
    "  return html;\n" +
    "}\n";
  const prerenderSource = "const html = applyFirstPaintToHtml(renderDocument(page));";
  const page = (body) =>
    `<html><head><title>x</title></head><body>` +
    `<div id="root"><p>article</p></div>${body}</body></html>`;
  const boot = `<script id="${SCRIPT_ID}">\n${script}\n</script>`;
  const base = {
    htmlPaths: ["dist/index.html", "dist/a.html", "dist/b.html"],
    read: () => page(boot),
    source,
    prerenderSource,
    applyTwice: true,
  };
  return { ...base, ...overrides, script, boot, page };
}

function selfTest() {
  const s = synthetic();
  const cases = [];
  const expect = (name, ctx, shouldFail) => {
    const problems = check(ctx);
    const failed = problems.length > 0;
    cases.push({ name, ok: failed === shouldFail, problems });
  };

  expect("00 clean tree passes", s, false);
  expect("01 missing boot script fails", { ...s, read: () => s.page("") }, true);
  expect("02 duplicated boot script fails", { ...s, read: () => s.page(s.boot + s.boot) }, true);
  expect("03 boot script in <head> fails", {
    ...s,
    read: () => `<html><head>${s.boot}</head><body><div id="root"></div></body></html>`,
  }, true);
  expect("04 boot script before #root fails", {
    ...s,
    read: () => `<html><head></head><body>${s.boot}<div id="root"></div></body></html>`,
  }, true);
  expect("05 unterminated block fails", {
    ...s,
    read: () => `<html><body><div id="root"></div><script id="${SCRIPT_ID}">oops</body></html>`,
  }, true);
  expect("06 missing 16s ceiling fails", {
    ...s,
    read: () => s.page(`<script id="${SCRIPT_ID}">` + s.script.replace("16000", "200") + "</script>"),
  }, true);
  expect("07 missing readiness signal fails", {
    ...s,
    read: () => s.page(`<script id="${SCRIPT_ID}">` + s.script.replace("content-ready", "gone") + "</script>"),
  }, true);
  expect("08 hook not called fails", { ...s, prerenderSource: "const html = renderDocument(page);" }, true);
  expect("09 non-idempotent hook fails", { ...s, applyTwice: "two copies" }, true);
  expect("10 external src in boot source fails", {
    ...s,
    source: s.source.replace("var root =", '<script src="/x.js"> var root ='),
  }, true);
  expect("11 empty tree fails", { ...s, htmlPaths: [] }, true);
  expect("12 differing scripts across pages fail", {
    ...s,
    read: (p) => s.page(p === "dist/a.html" ? `<script id="${SCRIPT_ID}">${s.script}\n</script>` : s.boot),
  }, true);
  const static404 = "<html><head></head><body><h1>Not found</h1></body></html>";
  expect("13 static 404 without a cover passes", {
    ...s,
    htmlPaths: [...s.htmlPaths, "dist/404.html"],
    read: (p) => (p === "dist/404.html" ? static404 : s.page(s.boot)),
  }, false);
  expect("14 static 404 carrying a cover fails", {
    ...s,
    htmlPaths: [...s.htmlPaths, "dist/404.html"],
    read: (p) => (p === "dist/404.html" ? `<script id="${SCRIPT_ID}">${s.script}</script>` : s.page(s.boot)),
  }, true);
  expect("15 page carrying a stale script fails", {
    ...s,
    read: () => s.page(`<script id="${SCRIPT_ID}">${s.script.replace("16000", "16000 ")}\n</script>`),
  }, true);
  expect("16 ceiling that reveals fails", {
    ...s,
    source: s.source.replace("keepStatic('timeout')", "reveal('timeout')"),
    read: () => s.page(`<script id="${SCRIPT_ID}">${s.script.replace("keepStatic('timeout')", "reveal('timeout')")}\n</script>`),
  }, true);
  expect("17 static cover that re-enters the flow fails", {
    ...s,
    source: s.source.replace("cover.style.overflow = 'auto';", "cover.style.position = 'relative';"),
    read: () => s.page(`<script id="${SCRIPT_ID}">${s.script.replace("cover.style.overflow = 'auto';", "cover.style.position = 'relative';")}\n</script>`),
  }, true);
  expect("18 a 2500-character floor fails", {
    ...s,
    source: s.source.replace("mainText.length > 120", "mainText.length > 2500"),
    read: () => s.page(`<script id="${SCRIPT_ID}">${s.script.replace("mainText.length > 120", "mainText.length > 2500")}\n</script>`),
  }, true);
  expect("19 an unrecognised product skeleton fails", {
    ...s,
    source: s.source.replace(`if (root.querySelector('[aria-busy="true"]')) return true;`, ""),
    read: () => s.page(`<script id="${SCRIPT_ID}">${s.script.replace(`if (root.querySelector('[aria-busy="true"]')) return true;`, "")}\n</script>`),
  }, true);
  expect("20 no polling fallback fails", {
    ...s,
    source: s.source.replace("poll = setInterval(function () { evaluate(); }, 100);", "poll = null;"),
    read: () => s.page(`<script id="${SCRIPT_ID}">${s.script.replace("poll = setInterval(function () { evaluate(); }, 100);", "poll = null;")}\n</script>`),
  }, true);
  expect("21 readiness without the site footer fails", {
    ...s,
    source: s.source.replace("if (!root.querySelector('footer#main_footer')) return false;", ""),
    read: () => s.page(`<script id="${SCRIPT_ID}">${s.script.replace("if (!root.querySelector('footer#main_footer')) return false;", "")}\n</script>`),
  }, true);

  /* The behaviour suite and the mutation tests run against the REAL shipped
   * source. A fixture that satisfies the rules by construction proves
   * nothing; reverting the implementation has to turn the guard red. */
  const realSource = readFileSync(join(root, BOOT_SOURCE), "utf8");
  const realScript = declaredScript(realSource);
  const realPrerender = readFileSync(join(root, PRERENDER_SOURCE), "utf8");

  /** A tree whose pages carry exactly the given script. */
  const treeFor = (script) => ({
    htmlPaths: ["dist/index.html"],
    read: () =>
      `<html><head><title>x</title></head><body><div id="root"><p>article</p></div>` +
      `<script id="${SCRIPT_ID}">\n${script}\n</script></body></html>`,
    source:
      "export const FIRST_PAINT_BOOT_SCRIPT = `" +
      script +
      "`;\n" +
      "export function applyFirstPaintToHtml(html) { const marker = `id=\"bbt-first-paint\"`;" +
      " if (html.includes(marker)) return html; return html; }\n",
    prerenderSource: realPrerender,
    applyTwice: true,
  });

  const mutantCases = [];
  const expectMutant = (name, script, shouldFail) => {
    const problems = [...check(treeFor(script)), ...behaviourProblems(script)];
    const failed = problems.length > 0;
    mutantCases.push({ name, ok: failed === shouldFail, problems });
  };

  expectMutant("22 the shipped script passes every rule", realScript, false);

  const mutants = [
    {
      name: "23 the old ceiling that reveals an empty #root fails",
      edit: [["keepStatic('timeout');", "reveal('timeout');"]],
    },
    {
      name: "24 the old static cover in the document flow fails",
      edit: [["cover.style.overflow = 'auto';", "cover.style.position = 'relative';"]],
    },
    {
      name: "25 the old 2500-character floor fails",
      edit: [["mainText.length > 120", "mainText.length > 2500"]],
    },
    {
      name: "26 readiness that ignores the Suspense fallback fails",
      edit: [
        [`if (root.querySelector('[aria-busy="true"]')) return true;`, ""],
        ["if (text.indexOf('Loading review content') !== -1) return true;", ""],
        ["if (text.indexOf('正在加载评测内容') !== -1) return true;", ""],
        ["mainText.length > 120", "mainText.length > 0"],
      ],
    },
    {
      name: "27 a ceiling that stops the observer fails",
      edit: [["keepStatic('timeout');", "if (observer) observer.disconnect(); keepStatic('timeout');"]],
    },
  ];
  for (const m of mutants) {
    let script = realScript;
    let broken = false;
    for (const [from, to] of m.edit) {
      if (!script.includes(from)) {
        mutantCases.push({ name: m.name, ok: false, problems: [`mutation anchor is missing: ${from}`] });
        broken = true;
        break;
      }
      script = script.replace(from, to);
    }
    if (broken) continue;
    expectMutant(m.name, script, true);
  }

  /* The masker is the guard's own blind spot: if it loses track of a quote,
   * every block slice after it comes back empty and the rules go quiet
   * instead of red. Three cases, because all three ways happened. */
  const maskerCases = [];
  const masker = (name, text, anchor) => {
    let ok = false;
    let detail = "the block slice came back empty";
    try {
      const block = sliceBlock(text, anchor);
      ok = block !== null && block.includes("return true");
      if (ok) detail = "";
    } catch (error) {
      detail = error.message;
    }
    maskerCases.push({ name, ok, problems: ok ? [] : [detail] });
  };
  masker(
    "28 a quoted phrase in a comment does not hide the code",
    '// "Real content" means the shell\nfunction contentReady() {\n  return true;\n}\n',
    "function contentReady(",
  );
  masker(
    "29 a quote inside a string does not hide the code",
    "var a = 'has \" quote';\nfunction contentReady() {\n  return true;\n}\n",
    "function contentReady(",
  );
  masker(
    "30 a brace inside a string does not break the match",
    "var a = '}';\nfunction contentReady() {\n  return true;\n}\n",
    "function contentReady(",
  );

  let bad = 0;
  for (const c of [...cases, ...mutantCases, ...maskerCases]) {
    console.log(`${c.ok ? "ok  " : "FAIL"} ${c.name}${c.ok ? "" : " -> " + c.problems.join("; ")}`);
    if (!c.ok) bad += 1;
  }
  const total = cases.length + mutantCases.length + maskerCases.length;
  console.log(`\n${total - bad}/${total} self-tests passed`);
  return bad === 0 ? 0 : 1;
}

if (process.argv.includes("--self-test")) {
  process.exit(selfTest());
}

const tree = realTree();
const problems = [...check(tree), ...behaviourProblems(declaredScript(tree.source))];
if (problems.length) {
  for (const p of problems.slice(0, 20)) console.error("FAIL " + p);
  if (problems.length > 20) console.error(`... and ${problems.length - 20} more`);
  console.error(`\nfirst-paint guard: ${problems.length} problem(s)`);
  process.exit(1);
}
console.log(`first-paint guard: OK (${htmlFiles(join(root, "dist")).length} HTML pages)`);
