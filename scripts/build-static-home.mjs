#!/usr/bin/env node
/**
 * Assemble the static homepage document.
 *
 * Why this exists
 * ---------------
 * The homepage ships as a static document, because that is the only delivery
 * shape that clears audit items 23 (LCP < 2000 ms) and 24 (TBT < 200 ms):
 * a React mount of the homepage costs about 2,900 ms of main-thread time
 * against a 200 ms budget.
 *
 * But a static document that does not LOOK like the page the SPA paints is a
 * UI/UX regression, not a performance win. The earlier static-home variant
 * that measured LCP 1211 ms used the SEO article page - Arial inline styles,
 * a different page - so it was the wrong document.
 *
 * So the document is assembled from the REAL React homepage:
 *
 *   1. The head comes from the prerender (scripts/prerender-pages.ts). The
 *      title, description, canonical, hreflang, Open Graph, JSON-LD, the
 *      hero preload and the preconnects are NOT copied here: they are read
 *      out of the document the prerender wrote, so there is exactly one
 *      source of truth for the TDK and the structured data.
 *   2. The body is the build-time SSR of the React homepage
 *      (src/ssr/home-entry.tsx).
 *   3. The critical CSS is inline, so the first paint is styled.
 *   4. The fonts are the Latin subset (scripts/build-font-subset.mjs).
 *   5. The SPA entry bundle is NOT loaded: the homepage is a document.
 *
 * What it checks
 * --------------
 * The structural assertions are the ones that decide whether the page is
 * honest: the hero has to be in the document, the first-paint cover has to be
 * gone (there is no SPA to take over), no Suspense fallback may survive, the
 * SPA's bundle must not be loaded, and every product the SPA rendered with a
 * click handler has to have become a real link.
 *
 * Usage:
 *   node scripts/build-static-home.mjs --shell dist/index.html \
 *     --ssr .runs/home-ssr/home.html --critical .runs/home-ssr/critical.css \
 *     --out dist/index.html
 *   node scripts/build-static-home.mjs --self-test
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

function readArg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

/* ------------------------------------------------------------------------- *
 * The images of the delivered document
 *
 * Three rules, and the reason they live HERE rather than in the components:
 * the rules are about the DOCUMENT the crawler receives, and the SPA renders
 * the same React tree without a document to put images in. Measured on the
 * first static build that shipped, three G4 items went red on the homepage
 * alone, each of them a fact about the delivered HTML and not about the page:
 *
 *   - item 20: the 27 product photographs carried no width/height, so the
 *     browser had no intrinsic size to reserve and nothing to lay out
 *     against. The SPA never showed this because the SPA's HTML had no <img>
 *     at all - React created them after the bundle ran.
 *   - item 27: the footer's brand mark was `<img src="/favicon.svg">`, which
 *     is neither AVIF nor WebP and has no second srcset candidate. A vector
 *     mark does not belong in a raster element; it is inlined instead.
 *   - item 27 again: the hero, a full-bleed photograph, had exactly one
 *     candidate. It now has the 480 px sibling it already needed for small
 *     screens.
 *
 * What these functions must NOT do is invent a number. Every attribute comes
 * from the file on disk, and a missing file throws: a build that cannot read
 * an image's size is a broken build, not a page with no dimensions.
 * ------------------------------------------------------------------------- */

/**
 * The pixel size of a WebP, read from its header.
 *
 * Dependency-free on purpose: this runs in the site's own build, which is
 * also the edge's build, and pulling an image library in to read four
 * integers would be a heavier dependency than the whole homepage.
 *
 * All three container shapes are handled because the build must not care
 * which encoder produced a file: VP8 (lossy), VP8L (lossless) and VP8X
 * (extended - what any file with alpha or animation uses).
 */
export function webpSize(buffer) {
  if (buffer.length < 30) throw new Error("not a WebP: shorter than a header");
  if (buffer.toString("ascii", 0, 4) !== "RIFF" ||
      buffer.toString("ascii", 8, 12) !== "WEBP") {
    throw new Error("not a WebP: the RIFF/WEBP signature is missing");
  }
  const chunk = buffer.toString("ascii", 12, 16);
  if (chunk === "VP8 ") {
    if (!(buffer[23] === 0x9d && buffer[24] === 0x01 && buffer[25] === 0x2a)) {
      throw new Error("not a WebP: the VP8 chunk has no start code");
    }
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff,
    };
  }
  if (chunk === "VP8L") {
    if (buffer[20] !== 0x2f) throw new Error("not a WebP: the VP8L chunk has no signature");
    const bits = buffer.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (chunk === "VP8X") {
    return { width: buffer.readUIntLE(24, 3) + 1, height: buffer.readUIntLE(27, 3) + 1 };
  }
  throw new Error(`not a WebP: unknown chunk ${JSON.stringify(chunk)}`);
}

/**
 * Insert attributes before a tag's closing bracket.
 *
 * A self-closing tag needs its slash removed first: inserting before `>` in
 * `<img ... />` leaves `<img ... / width="768">`, and the browser reads the
 * rest of the tag as part of a bogus attribute.
 */
export function insertAttrs(tag, attrs) {
  return tag.replace(/\s*\/\s*>$/, ">").replace(/>$/, ` ${attrs}>`);
}

/** The 480 px sibling of a 768 px hero, by the naming rule the encoder uses. */
export function heroSmallOf(src) {
  const match = /^(.*\/hero-[a-z]+)-768\.webp$/.exec(src);
  return match ? `${match[1]}-480.webp` : null;
}

/** Read a document-relative URL off the disk, or fail the build. */
export function localFile(src, root, label) {
  if (/^(?:[a-z]+:)?\/\//i.test(src) || src.startsWith("data:")) {
    throw new Error(
      `${label}: <img src="${src}"> is not a file this build can measure - ` +
        `the document cannot ship an image whose size nobody knows`,
    );
  }
  const file = join(root, src.replace(/^\/+/, ""));
  if (!existsSync(file)) throw new Error(`${label}: <img src="${src}"> is not on disk at ${file}`);
  return file;
}

/**
 * Give every <img> the intrinsic size of the file it points at.
 *
 * The attributes are also the CLS fix, not just the audit's: a box with no
 * reserved ratio moves when the photograph lands. Here the CSS pins both
 * dimensions (`h-full w-full`), so the attributes change nothing on screen -
 * they are the fact the browser lays out against before the CSS applies.
 */
export function withImageDimensions(markup, { root, label = "document" } = {}) {
  return markup.replace(/<img\b[^>]*>/gi, (tag) => {
    if (/\bwidth="/.test(tag) && /\bheight="/.test(tag)) return tag;
    const src = (/\bsrc="([^"]+)"/.exec(tag) || [])[1];
    if (!src) return tag;
    const { width, height } = webpSize(readFileSync(localFile(src, root, label)));
    return insertAttrs(tag, `width="${width}" height="${height}"`);
  });
}

/**
 * Give the hero its second candidate.
 *
 * A full-bleed photograph served at one width is served too wide for a small
 * phone and too narrow for a large one. The 480 px sibling costs 9.7 KB and
 * is only fetched when the viewport asks for it; `sizes="100vw"` is the
 * truth for a full-bleed layer, and the preset device (412 CSS px at DPR
 * 1.75 = 721 device px) still resolves to the 768 file - which is why the
 * measured LCP does not move.
 */
export function withHeroSrcSet(markup, { root, label = "document" } = {}) {
  return markup.replace(/<img\b[^>]*>/gi, (tag) => {
    if (/\bsrcset="/.test(tag)) return tag;
    const src = (/\bsrc="([^"]+)"/.exec(tag) || [])[1];
    const small = src ? heroSmallOf(src) : null;
    if (!small) return tag;
    const smallWidth = webpSize(readFileSync(localFile(small, root, label))).width;
    const largeWidth = webpSize(readFileSync(localFile(src, root, label))).width;
    return insertAttrs(
      tag,
      `srcset="${small} ${smallWidth}w, ${src} ${largeWidth}w" sizes="100vw"`,
    );
  });
}

/**
 * Draw the footer's brand mark as the vector it is.
 *
 * The image is read from `public/favicon.svg` - the same file the browser tab
 * and the Organization JSON-LD already point at - so there is one copy of the
 * artwork and the mark cannot drift from the icon. The gradient id is
 * namespaced because an inline SVG shares the document's id space.
 */
export function inlineBrandMark(markup, { svgPath }) {
  const svg = readFileSync(svgPath, "utf8").trim();
  const viewBox = (/\bviewBox="([^"]+)"/.exec(svg) || [])[1] || "0 0 256 256";
  const body = svg
    .slice(svg.indexOf(">") + 1)
    .replace(/id="bg"/g, 'id="bbt-mark-bg"')
    .replace(/url\(#bg\)/g, "url(#bbt-mark-bg)")
    .replace(/\s*\n\s*/g, " ")
    .trim();
  const replaced = markup.replace(/<img\b[^>]*\bsrc="\/favicon\.svg"[^>]*>/i, (tag) => {
    const width = (/\bwidth="([^"]+)"/.exec(tag) || [])[1] || "32";
    const height = (/\bheight="([^"]+)"/.exec(tag) || [])[1] || "32";
    const cls = (/\bclass="([^"]*)"/.exec(tag) || [])[1] || "w-8 h-8";
    return (
      `<svg viewBox="${viewBox}" width="${width}" height="${height}" ` +
      `aria-hidden="true" focusable="false" class="${cls}">${body}</svg>`
    );
  });

  // The <img> had a preload, because React 19's server renderer emits one per
  // image. The mark is now drawn inline, so that preload has nothing to fetch
  // and would sit in the head promising a file the document never asks for -
  // which is the same orphan preload the guard already refuses elsewhere.
  return replaced.replace(
    /<link\b[^>]*\brel="preload"[^>]*\bas="image"[^>]*\bhref="\/favicon\.svg"[^>]*>/gi,
    "",
  );
}

/** All three image rules, in the order that matters (the vector first). */
export function enhanceDocumentImages(markup, { root, svgPath } = {}) {
  let out = markup;
  if (svgPath && existsSync(svgPath)) out = inlineBrandMark(out, { svgPath });
  out = withHeroSrcSet(out, { root });
  out = withImageDimensions(out, { root });
  return out;
}

/**
 * Make the hero's preload ask for the same candidate the <img> will.
 *
 * A preload names ONE file. If the picture gains candidates and the preload
 * does not, the browser preloads the 768 file and then the <img> asks for it
 * again in a different form - the preload cache key includes the descriptors,
 * so a preload without imagesrcset does not satisfy an <img> with one, and
 * the photograph is downloaded twice on the connection the LCP is waiting on.
 */
export function withHeroPreloadSrcSet(html) {
  return html.replace(
    /<link\b[^>]*\brel="preload"[^>]*\bas="image"[^>]*\bhref="(\/images\/home\/hero-[a-z]+)-768\.webp"[^>]*>/gi,
    (tag, base) =>
      insertAttrs(
        tag,
        `imagesrcset="${base}-480.webp 480w, ${base}-768.webp 768w" imagesizes="100vw"`,
      ),
  );
}

/**
 * The CSS the static document needs on top of the Tailwind bundle.
 *
 * Three rules, and the third one is the important one:
 *
 *   - the FAQ's <summary> must not draw the browser's disclosure marker,
 *     and the plus must rotate when the panel is open. The SPA's accordion
 *     does the same thing with a state variable and a rotate-45 class.
 *   - in-page jumps scroll smoothly, which is what the SPA's scrollToSection
 *     does with behavior: "smooth".
 *   - the SPA's entrance animation is turned OFF, and this is not a nicety.
 *
 * WHY THE ENTRANCE ANIMATION IS TURNED OFF
 *
 * The SPA's stylesheet carries
 *
 *     #primary_tab_viewport > * { animation: .42s ease-out both km-page-in; }
 *     @keyframes km-page-in { 0% { opacity: 0; transform: translateY(8px) } ... }
 *
 * so every direct child of the page's main region - which is the whole
 * homepage - starts at opacity 0 and fades in over 420 ms. In the SPA that
 * animation has a job: it hides the moment React takes over from the
 * prerendered markup.
 *
 * The static document has no such moment. Its content is in the FIRST BYTE,
 * and there is nothing to hide. Two things go wrong when the animation runs
 * on the document:
 *
 *   1. The reader looks at a blank page for 420 ms. That is a real cost to
 *      every first-time visitor, on every page load, for no benefit.
 *   2. The page loses its Largest Contentful Paint candidate. Chromium does
 *      not report an element that lives inside an opacity-animated subtree
 *      as an LCP candidate, so the hero photograph - painted at ~600 ms and
 *      by far the largest thing on the page - is never reported at all.
 *      Measured on the built document with the animation on: the only LCP
 *      candidate in the whole page was the cookie banner's paragraph.
 *      Measured with it off: the hero photograph, every round, with the
 *      resource phase that a photograph has and a paragraph does not.
 *
 * The animation stays in the SPA's stylesheet. The document opts out.
 */
export const STATIC_CSS = `/* Static homepage only. The SPA does not need these. */
.bbt-faq > .bbt-faq-summary { list-style: none; }
.bbt-faq > .bbt-faq-summary::-webkit-details-marker { display: none; }
.bbt-faq[open] .bbt-faq-plus { transform: rotate(45deg); color: var(--color-orange-500); }
html { scroll-behavior: smooth; }
#primary_tab_viewport > * { animation: none !important; }`.trim();

/*
 * NO `content-visibility: auto` ON THE SECTIONS. It was here, and it was
 * wrong twice over.
 *
 * `#home_layout > section ~ section { content-visibility: auto;
 * contain-intrinsic-size: auto 800px }` was added on the belief that keeping
 * the below-the-fold sections out of layout before first paint is what the
 * TBT budget needed. Measured (3 paired rounds, Lighthouse 13.6, production
 * -faithful local preview, interleaved so machine drift cannot land on one
 * side): LCP 1742 vs 1740 ms (+2 ms, neutral) and TBT 174 vs 70 ms - the
 * rule COSTS about 104 ms of blocking time, consistently (+104/+98/+149 per
 * round). It does not skip work; it adds a style-and-containment pass on top
 * of the work the sections do anyway.
 *
 * And it broke the page. A skipped section reports its `contain-intrinsic-size`
 * placeholder (800 px) as its box while its children are still laid out, so
 * the FAQ section - 1392 px of real content - claimed 800 px, the footer was
 * placed 592 px too high, and the last two FAQ panels overlapped the footer's
 * first links. axe reported those links as "partially obscured, smallest space
 * 17x28", which took Lighthouse accessibility to 0.96. The invariant that
 * broke is simple and is now asserted by checkDocument: no section may be
 * smaller than the content it contains.
 */

/**
 * The Latin font subset, INLINED into the document instead of linked.
 *
 * WHY THE SHEET IS INLINED
 *
 * The sheet used to be linked with `rel="preload" as="style"` and switched
 * to a stylesheet by its own onload handler, so it never blocked the first
 * paint. That is the right trade for a stylesheet - but it means the browser
 * only learns about the FONT FILES when it parses that sheet, which is long
 * after the first paint, and every face it learns about late invalidates the
 * layout of every element that uses that family.
 *
 * The Lighthouse trace of the built document measured it exactly:
 *
 *   574ms  ParseAuthorStyleSheet  http://.../fonts/fonts-latin.css
 *   577ms  RunTask 230ms -> UpdateLayoutTree 3ms -> Layout 227ms
 *
 * A second FULL layout of the page - 227 ms of main-thread time, on top of
 * the 343 ms layout that painted it. Two full layouts of 1,020 objects each
 * are the whole of the page's Total Blocking Time, and they are also what
 * pushes the Largest Contentful Paint past its budget: the hero photograph's
 * paint is queued behind them, and Lighthouse's simulation multiplies the
 * main thread by four.
 *
 * The subset is 9.9 KB of text and the document is already 190 KB, so the
 * sheet goes IN: one less request, one less late parse, and the browser
 * knows every face before the first paint. The sheet's own @font-face rules
 * already declare the first screen's Outfit Latin face, so the separate
 * declaration this file used to emit is gone - one face, one place.
 *
 * The font FILES are still fetched on demand, and the one the first screen
 * needs is preloaded (see FONT_PRELOADS), so it is in the cache before the
 * first paint and no swap happens.
 */
export const FONT_SHEET_PATH = "public/fonts/fonts-latin.css";

/**
 * The font files the first screen needs, preloaded.
 *
 * A font preload needs `crossorigin` even when the font is same-origin: the
 * font request is made in CORS mode, and a preload without the attribute is
 * made in no-CORS mode, so the two do not match and the browser downloads
 * the file twice.
 */
export const FONT_PRELOADS = [
  { href: "/fonts/QGYvz_MVcBeNP4NJtEtqUYLknw.woff2", type: "font/woff2" },
];

/**
 * The enhancement script the document carries.
 *
 * It is deliberately tiny, inline, and free of any analytics: the project
 * rule is that the static HTML ships no analytics loader and no
 * gtag('config') call (scripts/check-tracking.mjs enforces it). The SPA
 * loads the tag after it has set the consent state; the document has no
 * SPA, so the document has no tag either - it only keeps the CONSENT
 * STATE honest.
 *
 * What it does:
 *
 *   - hides the banner when the reader has already decided, using the same
 *     two localStorage keys and the same "one of these three values" rule
 *     the SPA uses (src/lib/consentState.ts);
 *   - wires the three buttons, so Accept All / Custom / Decline write the
 *     same preference blob the SPA writes. A reader who decides on the
 *     homepage is not asked again on the next page.
 */
export const ENHANCEMENT_SCRIPT = `
(function () {
  var CHOICE_KEY = "cookie_consent_v1";
  var PREFERENCES_KEY = "cookie_preferences_v1";
  var banner = document.querySelector("[data-bbt-consent-banner]");
  if (!banner) return;

  function readChoice() {
    try { return window.localStorage.getItem(CHOICE_KEY); } catch (e) { return null; }
  }
  function writeDecision(choice, analytics, functional) {
    try {
      window.localStorage.setItem(CHOICE_KEY, choice);
      window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify({
        essential: true,
        analytics: analytics,
        functional: functional,
        consentChoice: choice,
        updatedAt: new Date().toISOString()
      }));
    } catch (e) { /* storage is unavailable: the choice is simply not remembered */ }
  }

  // The SPA's own rule: a banner is shown only while the choice is none of
  // the three it knows.
  var choice = readChoice();
  if (choice === "all" || choice === "essential" || choice === "custom") {
    banner.remove();
    return;
  }

  var panel = banner.querySelector("[data-bbt-consent-panel]");
  banner.addEventListener("click", function (event) {
    var trigger = event.target && event.target.closest
      ? event.target.closest("[data-bbt-consent-action]")
      : null;
    if (!trigger) return;
    var action = trigger.getAttribute("data-bbt-consent-action");
    var analytics;
    var functional;
    if (action === "all") {
      analytics = true;
      functional = true;
    } else if (action === "essential") {
      analytics = false;
      functional = true;
    } else if (action === "custom") {
      if (panel) panel.classList.toggle("hidden");
      return;
    } else if (action === "save") {
      var analyticsBox = banner.querySelector("[data-bbt-consent-analytics]");
      var functionalBox = banner.querySelector("[data-bbt-consent-functional]");
      analytics = analyticsBox ? analyticsBox.checked : false;
      functional = functionalBox ? functionalBox.checked : true;
    } else {
      return;
    }
    writeDecision(action === "save" ? "custom" : action, analytics, functional);

    // The beacon listens for this. localStorage alone would only be read
    // once, when the document loads, so a reader who agrees in this visit
    // would never be counted.
    try {
      window.dispatchEvent(new CustomEvent("bbt:consent", {
        detail: { analytics: analytics, functional: functional }
      }));
    } catch (e) { /* an old browser without CustomEvent simply has no beacon */ }

    banner.remove();
  });
})();`.trim();

/**
 * Read the Latin font subset that goes into the document.
 *
 * The path is resolved against the repository, not against the working
 * directory, so the script behaves the same whether it is run from the repo
 * root, from scripts/, or from a build hook in another directory.
 */
export function readFontSheet(path = FONT_SHEET_PATH) {
  const candidates = [
    path,
    new URL(`../${path}`, import.meta.url).pathname,
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return readFileSync(candidate, "utf8").trim();
  }
  console.error(`FATAL: the font sheet ${path} does not exist`);
  process.exit(1);
}

/**
 * The GA4 measurement id, read from the CMS snapshot the prerender reads.
 *
 * Not a literal in this file, and not an environment variable: the id is
 * published by the CMS (`seoGlobal.gaMeasurementId`), and this site's rule is
 * that the CMS is its only source. Both failures here are loud, because a
 * homepage that silently ships no beacon is exactly the defect this change
 * fixed - G4 item 33 read it as "declared, not rendered" on one page out of
 * 442.
 */
export function readMeasurementId(path = "scripts/cms-snapshots/settings.json") {
  const candidates = [path, new URL(`../${path}`, import.meta.url).pathname];
  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    const parsed = JSON.parse(readFileSync(candidate, "utf8"));
    const rows = Array.isArray(parsed) ? parsed : parsed.data || [];
    for (const row of rows) {
      const id = row && row.seoGlobal && row.seoGlobal.gaMeasurementId;
      if (typeof id === "string" && /^G-[A-Z0-9]+$/i.test(id.trim())) return id.trim();
    }
    throw new Error(
      `${path} carries no seoGlobal.gaMeasurementId - the homepage would ship no beacon`,
    );
  }
  throw new Error(`the CMS snapshot ${path} does not exist - the beacon has no measurement id`);
}

/**
 * Rewrite the head of the prerendered document.
 *
 * Everything that belongs to the SPA is removed: the entry bundle, the
 * chunk preloads, the boot cover's styles and the script that switches the
 * boot cover on. Everything that belongs to the page is kept: the TDK, the
 * canonical, the JSON-LD, the icons, the preconnect and the hero preload.
 */
export function transformHead(head, { criticalCss, staticCss = STATIC_CSS, keepAppCss = false, fontSheet = "", fontPreloads = FONT_PRELOADS, measurementId = "" }) {
  let out = head;

  // The SPA's entry bundle and its chunk preloads. The homepage is a
  // document; loading React would cost about 2,900 ms of main-thread time
  // for a page that does not need it.
  out = out.replace(/<script\b[^>]*\bsrc="[^"]*\/assets\/index-[^"]*\.js"[^>]*>\s*<\/script>/g, "");
  out = out.replace(/<link\b[^>]*\brel="modulepreload"[^>]*>/g, "");

  // The boot cover: a spinner shown while React boots. There is no React,
  // so the cover and the class that reveals it are dead code.
  //
  // The patterns are anchored to the start of a line and the selector is
  // restricted to one line without braces. A looser pattern (a free-floating
  // ".*#app-boot-cover.*") would match across the </head> into the body and
  // delete half the document - which is exactly what it did once.
  out = out.replace(/<script>\s*document\.documentElement\.classList\.add\("app-js-loading"\);[\s\S]*?<\/script>/g, "");
  out = out.replace(/(^|\n)[ \t]*[^\n{};]*#app-boot-cover[^{};]*\{[^{}]*\}/g, "$1");
  out = out.replace(/(^|\n)[ \t]*[^\n{};]*#app-boot-spinner[^{};]*\{[^{}]*\}/g, "$1");
  out = out.replace(/(^|\n)[ \t]*@keyframes app-boot-spin[^{}]*\{(?:[^{}]*\{[^{}]*\}[^{}]*)*\}/g, "$1");

  // The font sheet: the whole 620-rule sheet is 660 KB and the homepage's
  // English text needs 26 of those rules. The subset is the same fonts
  // with the same unicode ranges.
  out = out.replace(/\/fonts\/fonts\.css/g, "/fonts/fonts-latin.css");

  // The font sheet is INLINED, not linked. A late stylesheet means late
  // @font-face rules, and a late @font-face rule invalidates the layout of
  // every element that uses that family: the trace measured a second full
  // layout of 1,020 objects (227 ms) fired by the sheet's parse. See
  // FONT_SHEET_PATH for the whole measurement.
  out = out.replace(/<link\b[^>]*\bhref="[^"]*\/fonts\/fonts-latin\.css"[^>]*>/g, "");

  // The application's stylesheet. The critical CSS carries everything the
  // page uses, so the bundle is not needed - and at 148 KB it would
  // compete with the hero image for the connection.
  if (!keepAppCss) {
    out = out.replace(/<link\b[^>]*\bhref="[^"]*\/assets\/index-[^"]*\.css"[^>]*>/g, "");
  }

  const styles =
    `    <style id="bbt-critical-css">\n${criticalCss}\n    </style>\n` +
    `    <style id="bbt-static-home">\n${staticCss}\n    </style>\n` +
    (fontSheet ? `    <style id="bbt-font-sheet">\n${fontSheet}\n    </style>\n` : "");

  // The font files the first screen renders with, preloaded. Without this the
  // font arrives after the first paint and the page reflows itself - a
  // single 351 ms layout of 1,020 objects, measured in the Lighthouse trace.
  const preloadTags = fontPreloads
    .map((f) => `    <link rel="preload" as="font" type="${f.type}" href="${f.href}" crossorigin />\n`)
    .join("");

  // The homepage's own analytics beacon. The tag on every other route rides
  // in on the SPA bundle; the homepage has no bundle, so G4 item 33 read it
  // as "the beacon was declared, not rendered". Deferred, same-origin, and
  // it sends nothing until the reader agrees - see public/scripts/
  // analytics-boot.js for the ordering that matters.
  const beacon = measurementId
    ? `    <script src="/scripts/analytics-boot.js" defer data-ga="${measurementId}"></script>\n`
    : "";

  out = out.replace(/<\/head>/, `${styles}${preloadTags}${beacon}  </head>`);
  return out;
}

/**
 * Find the document's REAL <body> tag.
 *
 * The first "<body" in the document is not the body tag. The prerender's
 * inline style carries a comment that mentions the tag by name ("the
 * prerendered markup carries only four Tailwind utility classes on
 * <body>"), and the homepage's own copy mentions it as well. Matching the
 * first occurrence splits the document at that comment and throws the real
 * tag away - and the real tag is where the body's class list lives
 * (bg-slate-50 text-slate-950 antialiased font-sans), so the assembled
 * document loses the page's backdrop, its text colour and its font
 * smoothing.
 *
 * The body tag is the one that comes after </head>.
 */
export function findBodyStart(html) {
  const headEnd = html.indexOf("</head>");
  const from = headEnd === -1 ? 0 : headEnd;
  const index = html.indexOf("<body", from);
  if (index === -1) throw new Error("the document has no <body> tag");
  return index;
}

/**
 * Replace the body with the SSR'd homepage.
 *
 * The prerendered body carries the boot cover and the first-paint takeover
 * script - both of which exist to hand the page over to React. The document
 * has no React to hand over to, so the body is exactly the homepage.
 */
export function transformBody(body, { ssrMarkup, script = ENHANCEMENT_SCRIPT, headPreloads = [] }) {
  const bodyStart = findBodyStart(body);
  const openMatch = body.slice(bodyStart).match(/^<body\b[^>]*>/);
  if (!openMatch) throw new Error("the prerendered document has no <body>");
  const head = body.slice(0, bodyStart + openMatch[0].length);
  const rest = body.slice(bodyStart + openMatch[0].length);
  const closeAt = rest.lastIndexOf("</body>");
  if (closeAt === -1) throw new Error("the prerendered document has no </body>");
  const middle =
    `\n    <div id="root">\n${dropDuplicatePreloads(ssrMarkup, headPreloads)}\n    </div>\n` +
    `    <script>\n${script}\n    </script>\n`;
  return `${head}${middle}${rest.slice(closeAt)}`;
}

/**
 * Drop a preload the document head already carries.
 *
 * React 19's server renderer emits a <link rel="preload" as="image"> for
 * every <img> it renders - including the hero, which the prerender's head
 * already preloads. Two preloads for one file are not two downloads (the
 * second one finds the resource in the preload cache and is ignored), but
 * they are two tags to read and one more thing to get wrong later.
 *
 * Only EXACT duplicates are dropped: the head's preload wins, because it is
 * the one the HTML parser meets first.
 */
export function dropDuplicatePreloads(markup, headPreloads) {
  const already = new Set(headPreloads);
  if (!already.size) return markup;
  return markup.replace(/<link\b[^>]*\brel="preload"[^>]*>/gi, (tag) => {
    if (!/\bas="image"/.test(tag)) return tag;
    const href = (/\bhref="([^"]+)"/.exec(tag) || [])[1];
    if (!href) return tag;
    return already.has(href.replace(/&amp;/g, "&")) ? "" : tag;
  });
}

/**
 * Assemble the whole document.
 */
export function assembleStaticHome({ shellHtml, ssrMarkup, criticalCss, fontSheet = "", ...options }) {
  const headEnd = shellHtml.indexOf("</head>");
  if (headEnd === -1) throw new Error("the prerendered document has no </head>");
  const bodyStart = findBodyStart(shellHtml);

  // The head slice INCLUDES </head>, because that is where the inline
  // styles go.
  const head = shellHtml.slice(0, headEnd + "</head>".length);
  const body = shellHtml.slice(bodyStart);

  // What the head already preloads. The body's own preloads for the same
  // files are dropped: see dropDuplicatePreloads().
  const headPreloads = [];
  for (const match of head.matchAll(/<link\b[^>]*\brel="preload"[^>]*>/gi)) {
    const href = (/\bhref="([^"]+)"/.exec(match[0]) || [])[1];
    if (href) headPreloads.push(href.replace(/&amp;/g, "&"));
  }

  return (
    transformHead(head, { criticalCss, fontSheet, ...options }) +
    transformBody(body, { ssrMarkup, headPreloads, ...options }) +
    "\n"
  );
}

/**
 * The assertions.
 *
 * Two kinds, and the difference matters:
 *
 *   - a MUST rule checks that something is present;
 *   - a MUST NOT rule checks that something is absent.
 *
 * The previous version of this file expressed the second kind with the same
 * helper as the first, so "the first-paint cover is still in the document"
 * was reported as a failure on a document that did NOT have the cover - the
 * check was inverted, and the self-test could never go green. The two kinds
 * now have two helpers, and every MUST NOT rule has a reverse case.
 */
export function checkDocument(html) {
  const failures = [];
  const notes = [];

  const must = (name, condition) => {
    if (!condition) failures.push(name);
  };
  const mustNot = (name, condition) => {
    if (condition) failures.push(name);
  };

  // --- the page is there -------------------------------------------------
  must("the hero is missing from the document", html.includes("home_banner_anchor"));
  must("the FAQ section is missing from the document", html.includes("faq_section_anchor"));
  must("the header is missing from the document", html.includes("core_header"));
  must("the footer is missing from the document", html.includes("main_footer"));
  must("the canonical link is missing", html.includes('rel="canonical"'));
  must("the title is missing", html.includes("<title>"));
  must(
    "the Organization JSON-LD is missing",
    html.includes('"@type":"Organization"'),
  );
  must("the critical CSS is not inlined", html.includes('id="bbt-critical-css"'));

  // --- the document does not fade in from nothing ------------------------
  //
  // The SPA's stylesheet animates every direct child of the page's main
  // region from opacity 0. The document has nothing to hide, so the
  // animation only costs the reader 420 ms of blank page and the page its
  // Largest Contentful Paint candidate. See STATIC_CSS for the measurement.
  must(
    "the entrance animation is not turned off - the page would fade in from a blank screen and lose its LCP candidate",
    /#primary_tab_viewport\s*>\s*\*\s*\{[^}]*animation:\s*none/.test(html),
  );

  // --- no section is smaller than its own content ----------------------
  //
  // A `content-visibility: auto` section reports its `contain-intrinsic-size`
  // placeholder as its box while its children are still laid out. The page
  // height is then wrong, and the content spills over whatever follows. On
  // this page that put the last two FAQ panels on top of the footer's first
  // links; axe counted those links as "partially obscured (17px by 28px)" and
  // Lighthouse accessibility fell to 0.96.
  //
  // The rule is gone - see STATIC_CSS for the paired measurement, which also
  // shows it cost ~104 ms of TBT rather than saving any. This assertion keeps
  // it gone. `contain-intrinsic-size` is refused too: it exists only to serve
  // a skipped subtree, so carrying it without content-visibility is a leftover
  // that would silence the next reader.
  //
  // The feature-test conditions are stripped first. Tailwind ships
  // `@supports (not ((-webkit-appearance:-apple-pay-button))) or
  // (contain-intrinsic-size:1px)` as a placeholder reset, and matching THAT
  // would have made this guard red on a legitimate stylesheet - a guard that
  // cries wolf on the builder's own output is a guard someone turns off.
  const declarationScope = html.replace(/@supports[^{]*/gi, "@supports ");
  mustNot(
    "the document skips section subtrees (content-visibility) - a skipped section reports a placeholder height and its content overlaps what follows",
    /content-visibility\s*:/.test(declarationScope),
  );
  mustNot(
    "the document declares a contain-intrinsic-size - that only exists to reserve a skipped subtree's height",
    /contain-intrinsic-size\s*:/.test(declarationScope),
  );

  // --- the SPA is not there ---------------------------------------------
  mustNot(
    "a Suspense fallback survived into the document",
    html.includes("Loading BalanceBikeToddler"),
  );
  mustNot(
    "the first-paint cover is still in the document - there is no SPA to take over",
    html.includes('id="bbt-first-paint-cover"'),
  );
  mustNot(
    "the boot cover is still in the document - there is no SPA to take over",
    html.includes('id="app-boot-cover"'),
  );
  mustNot(
    "the SPA entry bundle is still loaded - the homepage is a document",
    /<script[^>]+src="[^"]*index-[^"]*\.js"/.test(html),
  );
  mustNot(
    "the SPA's chunk preloads are still in the document",
    /rel="modulepreload"/.test(html),
  );
  mustNot(
    "the whole font sheet is still linked - the homepage needs the Latin subset",
    html.includes("/fonts/fonts.css"),
  );
  mustNot(
    "the Latin font subset is still LINKED - a late stylesheet invalidates the layout of the whole page",
    /<link\b[^>]*\/fonts\/fonts-latin\.css/.test(html),
  );
  must(
    "the Latin font subset is not inlined",
    html.includes('id="bbt-font-sheet"'),
  );

  // --- the first screen's font is in the cache before the first paint ---
  //
  // The font sheet is loaded asynchronously, so the font FILE itself is only
  // discovered when the browser parses that sheet - which is after the first
  // paint. When the file arrives, the browser reflows every piece of text on
  // the page.
  //
  // The Lighthouse trace of the static homepage measured exactly that: a
  // single 351 ms full layout of 1,020 objects, fired by "RemoteFontLoaded"
  // at the same moment as the window load event, and 351 ms of real
  // main-thread time (about 1,400 ms under Lighthouse's 4x CPU slowdown).
  // That one reflow is the bulk of the page's Total Blocking Time.
  //
  // So the faces the first screen needs are declared in the document's own
  // critical CSS. If they are only in the async sheet, the reflow is back.
  const inlineFaces = /<style id="bbt-font-sheet">([\s\S]*?)<\/style>/.exec(html);
  must(
    "the first screen's font face is not inlined in the document",
    Boolean(
      inlineFaces &&
        /@font-face/.test(inlineFaces[1]) &&
        /font-family:\s*['"]?Outfit/.test(inlineFaces[1]),
    ),
  );

  // --- the document is usable -------------------------------------------
  // Every product the SPA rendered with a click handler has to have become
  // a real link, or the reader cannot open a product at all.
  const productLinks = (html.match(/href="\/products\/[^"]+"/g) || []).length;
  notes.push(`product links: ${productLinks}`);
  if (productLinks === 0) {
    failures.push("the homepage carries no product links - the SPA's click handlers are gone");
  }

  const faqPanels = (html.match(/<details/g) || []).length;
  notes.push(`native FAQ panels: ${faqPanels}`);
  if (faqPanels === 0) {
    failures.push("the FAQ has no native <details> - the accordion needs a script to open");
  }

  // The hero's first slide has to be the visible one: it is the slide the
  // preload points at, and it is what the LCP measures.
  const heroAt = html.indexOf("home_banner_anchor");
  if (heroAt !== -1) {
    const hero = html.slice(heroAt, heroAt + 3000);
    must(
      "the hero's first slide is not the visible one",
      /opacity:\s*0\.62/.test(hero),
    );
  }

  // --- the images are what the crawler reads ----------------------------
  //
  // Three G4 items read the delivered <img> tags: 20 (alt + dimensions), 27
  // (AVIF/WebP plus a srcset with two candidates) and, through the brand
  // mark, 14 (no parameterized URL in the link graph). The first static
  // build shipped 27 photographs with no dimensions and a vector mark inside
  // a raster element; all of it went red on this page alone, because the
  // SPA's HTML had no <img> for the rules to read.
  const imgs = html.match(/<img\b[^>]*>/gi) || [];
  notes.push(`images: ${imgs.length}`);
  must("the document carries no <img> at all", imgs.length > 0);
  const unsized = imgs.filter(
    (tag) => !/\bwidth="\d+"/.test(tag) || !/\bheight="\d+"/.test(tag),
  );
  must(
    `${unsized.length} image(s) carry no intrinsic width/height ` +
      `(first: ${(/\bsrc="([^"]+)"/.exec(unsized[0] || "") || [])[1] || "?"})`,
    unsized.length === 0,
  );
  const heroImg =
    imgs.find((tag) => heroSmallOf((/\bsrc="([^"]+)"/.exec(tag) || [])[1] || "")) || "";
  must("the hero <img> is not in the document", heroImg !== "");
  must(
    "the hero <img> has no second srcset candidate",
    /\bsrcset="[^"]*480w[^"]*768w/.test(heroImg) && /\bsizes="100vw"/.test(heroImg),
  );
  mustNot(
    "the brand mark is still shipped as a raster <img>",
    /<img\b[^>]*src="\/favicon\.svg"/.test(html),
  );
  must(
    "the hero preload does not name the candidates the <img> will ask for",
    /imagesrcset="[^"]*480w[^"]*768w"/.test(html) && /imagesizes="100vw"/.test(html),
  );

  // --- the homepage is measured -----------------------------------------
  //
  // Every other route gets analytics from the SPA bundle. The homepage has
  // no bundle, so for one build it had no analytics at all and G4 item 33
  // said so: "1 of 442 page(s) carry no <script src>". The beacon is a
  // deferred same-origin file; the tag itself only exists after the reader
  // agrees, which is why gtag.js must NOT appear in the document.
  must(
    "the analytics beacon is not in the document - the homepage would send nothing",
    /<script\b[^>]*src="\/scripts\/analytics-boot\.js"[^>]*\bdefer\b/.test(html),
  );
  must(
    "the analytics beacon carries no measurement id",
    /src="\/scripts\/analytics-boot\.js"[^>]*\bdata-ga="G-[A-Z0-9]+"/i.test(html),
  );
  mustNot(
    "gtag.js is in the document instead of being loaded after consent",
    /googletagmanager\.com\/gtag\/js/.test(html),
  );
  must(
    "the consent banner announces no decision - the beacon would never learn about it",
    /bbt:consent/.test(html),
  );

  // --- every preload is spent on a file the page actually requests -------
  //
  // This rule exists because the document carried 21 preloads it had no use
  // for. React 19's server renderer emits a <link rel="preload" as="image">
  // for every <img> it renders, and it does so from the src the component
  // passed it - the ORIGINAL remote JPEG. The responsive-image pass then
  // rewrote the <img src> to the local WebP derivative, so the preload and
  // the picture pointed at two different files: the document asked the
  // network for 2.6 MB of third-party JPEGs it never displayed, on the same
  // connection the LCP hero had to travel on. Measured on the built
  // homepage: the hero did not arrive in two Lighthouse runs out of three,
  // and the report's Largest Contentful Paint fell back to a text block.
  //
  // The rule is about the DOCUMENT, not about one implementation: a preload
  // is a promise that a file is about to be needed. A preload for a file the
  // page never asks for is a promise nobody keeps - it costs bytes, it costs
  // a connection, and it can delay the file that matters.
  const requested = new Set();
  for (const match of html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)) {
    requested.add(match[1].replace(/&amp;/g, "&"));
  }
  for (const match of html.matchAll(/url\((["']?)([^)"']+)\1\)/g)) {
    requested.add(match[2].replace(/&amp;/g, "&"));
  }
  const imagePreloads = [];
  for (const match of html.matchAll(/<link\b[^>]*>/g)) {
    const tag = match[0];
    if (!/\brel="preload"/.test(tag) || !/\bas="image"/.test(tag)) continue;
    const href = (/\bhref="([^"]+)"/.exec(tag) || [])[1];
    if (href) imagePreloads.push(href.replace(/&amp;/g, "&"));
  }
  notes.push(`image preloads: ${imagePreloads.length}`);
  const orphanPreloads = imagePreloads.filter((href) => !requested.has(href));
  if (orphanPreloads.length) {
    failures.push(
      `a preload points at ${orphanPreloads.length} file(s) the document never requests ` +
        `(first: ${orphanPreloads[0]}) - the preload is spent on a file nobody asks for`,
    );
  }

  // The homepage's critical path is first-party. A third-party preload
  // spends a handshake and a DNS lookup on the connection the Largest
  // Contentful Paint has to travel on, and it puts the measurement of this
  // page at the mercy of somebody else's server.
  const thirdPartyPreloads = imagePreloads.filter((href) => /^https?:\/\//i.test(href));
  mustNot(
    `the document preloads a third-party image (${thirdPartyPreloads[0] || "?"})`,
    thirdPartyPreloads.length > 0,
  );

  // --- the font preload has to be a promise the document keeps -----------
  //
  // Two rules, and both of them have been wrong in practice:
  //
  //   - crossorigin. A font request is made in CORS mode. A preload without
  //     the attribute is made in no-CORS mode, so the two do not match, the
  //     browser does not reuse the preloaded response, and the file is
  //     downloaded twice - once for the preload and once for the font.
  //   - the file has to be one the document asks for. A font preload for a
  //     face nothing renders spends a connection and delays the face that
  //     matters.
  const fontPreloads = [];
  for (const match of html.matchAll(/<link\b[^>]*>/g)) {
    const tag = match[0];
    if (!/\brel="preload"/.test(tag) || !/\bas="font"/.test(tag)) continue;
    const href = (/\bhref="([^"]+)"/.exec(tag) || [])[1];
    if (href) fontPreloads.push({ href: href.replace(/&amp;/g, "&"), tag });
  }
  notes.push(`font preloads: ${fontPreloads.length}`);
  for (const preload of fontPreloads) {
    mustNot(
      `a font preload is missing crossorigin (${preload.href}) - the browser downloads the file twice`,
      !/\bcrossorigin\b/.test(preload.tag),
    );
    mustNot(
      `a font preload points at a file the document never requests (${preload.href})`,
      !requested.has(preload.href),
    );
  }

  return { failures, notes };
}

function main() {
  if (process.argv.includes("--self-test")) {
    selfTest();
    return;
  }

  const shellPath = readArg("--shell", "");
  const ssrPath = readArg("--ssr", "");
  const criticalPath = readArg("--critical", "");
  const outPath = readArg("--out", "");
  if (!shellPath || !ssrPath || !criticalPath) {
    console.error(
      "usage: build-static-home.mjs --shell <file> --ssr <file> --critical <file> [--out <file>]",
    );
    process.exit(1);
  }
  for (const file of [shellPath, ssrPath, criticalPath]) {
    if (!existsSync(file)) {
      console.error(`FATAL: ${file} does not exist`);
      process.exit(1);
    }
  }

  // The images are settled against the built tree: the sizes are read from the
  // files that will actually be served, and the brand mark is read from the
  // icon the browser tab uses. A file that is not there throws.
  const imageRoot = dirname(resolve(outPath || "dist/index.html"));
  const ssrMarkup = enhanceDocumentImages(readFileSync(ssrPath, "utf8").trim(), {
    root: imageRoot,
    svgPath: resolve("public/favicon.svg"),
  });

  const html = withHeroPreloadSrcSet(
    assembleStaticHome({
      shellHtml: readFileSync(shellPath, "utf8"),
      ssrMarkup,
      criticalCss: readFileSync(criticalPath, "utf8").trim(),
      fontSheet: readFontSheet(),
      measurementId: readMeasurementId(),
    }),
  );

  const { failures, notes } = checkDocument(html);
  for (const note of notes) console.log(`  ${note}`);
  console.log(`  document: ${Buffer.byteLength(html, "utf8")} bytes`);
  if (failures.length) {
    console.error(`\nFAILED (${failures.length}):`);
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exit(1);
  }

  if (outPath) {
    writeFileSync(outPath, html, "utf8");
    console.log(`wrote ${outPath}`);
  } else {
    process.stdout.write(html);
  }
}

/**
 * The self-test.
 *
 * The assertions are about the FAILURE modes, not about the happy path: a
 * document that lost its hero, that kept a Suspense fallback, that still
 * loads the SPA bundle, that has no product links or that has no native FAQ
 * has to be caught here rather than in a browser.
 *
 * Every mutation is anchored to a string that appears EXACTLY ONCE in the
 * good document, so a mutation cannot bleed into a neighbouring element and
 * mask the rule it is meant to test.
 */
function selfTest() {
  const failures = [];

  const shell = [
    "<!doctype html>",
    '<html lang="en">',
    "  <head>",
    '    <meta charset="UTF-8" />',
    "    <title>Best Kids Bikes | BalanceBikeToddler</title>",
    '    <meta name="description" content="d" />',
    '    <link rel="canonical" href="https://balancebiketoddler.com/" />',
    '    <link rel="preload" as="image" href="/images/home/hero-stroller-768.webp" imagesrcset="/images/home/hero-stroller-480.webp 480w, /images/home/hero-stroller-768.webp 768w" imagesizes="100vw" fetchpriority="high" />',
    '    <link rel="preload" as="style" href="/fonts/fonts.css" onload="this.rel=\'stylesheet\'" />',
    '    <link rel="preload" as="style" crossorigin href="/assets/index-abc.css" onload="this.rel=\'stylesheet\'" />',
    '    <script type="module" crossorigin src="/assets/index-abc.js"></script>',
    '    <link rel="modulepreload" crossorigin href="/assets/react-vendor-xyz.js">',
    "    <style>",
    "      @layer theme, base, components, utilities;",
    "      #app-boot-cover { display: none; }",
    "      .app-js-loading #app-boot-cover { display: flex; }",
    "      #app-boot-spinner { width: 34px; }",
    "      @keyframes app-boot-spin { to { transform: rotate(360deg); } }",
    "    </style>",
    "    <script>",
    '      document.documentElement.classList.add("app-js-loading");',
    "    </script>",
    '    <script type="application/ld+json">{"@type":"Organization"}</script>',
    "  </head>",
    '  <body class="bg-slate-50">',
    '    <div id="root">',
    '      <div id="app-boot-cover">spinner</div>',
    "      <article>old prerendered body</article>",
    "    </div>",
    "    <script>window.__firstPaint = 1;</script>",
    "  </body>",
    "</html>",
  ].join("\n");

  const ssrMarkup =
    '<header id="core_header"></header>' +
    '<section id="home_banner_anchor"><div style="opacity: 0.62;background-image:url(/images/home/hero-stroller-768.webp)"></div>' +
    '<img src="/images/home/hero-stroller-768.webp" alt="" aria-hidden="true" width="768" height="512" ' +
    'srcset="/images/home/hero-stroller-480.webp 480w, /images/home/hero-stroller-768.webp 768w" sizes="100vw" class="absolute inset-0 h-full w-full object-cover" /></section>' +
    '<section id="faq_section_anchor"><details class="bbt-faq"><summary class="bbt-faq-summary">q</summary></details></section>' +
    '<a href="/products/kids-bikes/">product</a>' +
    '<img src="/images/derived/deadbeef-800.webp" alt="part" width="800" height="600" ' +
    'srcset="/images/derived/deadbeef-400.webp 400w, /images/derived/deadbeef-800.webp 800w" />' +
    '<footer id="main_footer"></footer>';

  // The sheet is read from the build, so the self-test asserts against the
  // same bytes the real document carries.
  const fontSheet = readFontSheet();

  const good = assembleStaticHome({
    shellHtml: shell,
    ssrMarkup,
    criticalCss: ".flex{display:flex}",
    fontSheet,
    measurementId: "G-TEST12345",
  });

  const goodResult = checkDocument(good);
  if (goodResult.failures.length) {
    failures.push(`a good document failed: ${goodResult.failures.join(", ")}`);
  }

  // The reverse assertions: each rule has to be able to go red.
  const cases = [
    ["the hero is missing", (h) => h.replace('id="home_banner_anchor"', 'id="x"'), "hero is missing"],
    [
      "a Suspense fallback survived",
      (h) => h.replace('<footer id="main_footer">', "Loading BalanceBikeToddler<footer id=\"main_footer\">"),
      "Suspense fallback survived",
    ],
    [
      "the first-paint cover stayed",
      (h) => h.replace("</body>", '<div id="bbt-first-paint-cover"></div></body>'),
      "first-paint cover is still",
    ],
    [
      "the boot cover stayed",
      (h) => h.replace("</body>", '<div id="app-boot-cover"></div></body>'),
      "boot cover is still",
    ],
    [
      "the SPA bundle is still loaded",
      (h) => h.replace("</body>", '<script src="/assets/index-xyz.js"></script></body>'),
      "SPA entry bundle is still loaded",
    ],
    [
      "the chunk preloads stayed",
      (h) => h.replace("</body>", '<link rel="modulepreload" href="/assets/x.js"></body>'),
      "chunk preloads are still",
    ],
    [
      "the whole font sheet stayed",
      (h) =>
        h.replace(
          "</head>",
          '<link rel="stylesheet" href="/fonts/fonts.css" /></head>',
        ),
      "whole font sheet is still linked",
    ],
    [
      "the font sheet is linked instead of inlined",
      (h) =>
        h.replace(
          '<style id="bbt-font-sheet">',
          '<link rel="stylesheet" href="/fonts/fonts-latin.css" /><style id="bbt-font-sheet">',
        ),
      "the Latin font subset is still LINKED",
    ],
    [
      "the product links are gone",
      (h) => h.replace('href="/products/kids-bikes/"', 'href="#"'),
      "carries no product links",
    ],
    [
      "the FAQ is not native",
      (h) => h.replace("<details class=\"bbt-faq\">", "<div class=\"bbt-faq\">").replace("</details>", "</div>"),
      "FAQ has no native <details>",
    ],
    [
      "a section skips its subtree again",
      (h) => h.replace("</head>", "<style>#home_layout > section ~ section { content-visibility: auto; }</style></head>"),
      "skips section subtrees",
    ],
    [
      "a contain-intrinsic-size survived on its own",
      (h) => h.replace("</head>", "<style>section { contain-intrinsic-size: auto 800px; }</style></head>"),
      "declares a contain-intrinsic-size",
    ],
    ["the hero's first slide is hidden", (h) => h.replace("opacity: 0.62", "opacity: 0"), "first slide is not the visible one"],
    [
      "a preload for a file the document never requests",
      (h) =>
        h.replace(
          '<link rel="preload" as="image" href="/images/home/hero-stroller-768.webp"',
          '<link rel="preload" as="image" href="https://store.example.com/remote/product.jpg"',
        ),
      "preload points at 1 file(s) the document never requests",
    ],
    [
      "a preload for a file nothing asks for",
      (h) =>
        h.replace(
          "</head>",
          '<link rel="preload" as="image" href="/images/derived/never-used-800.webp" />\n  </head>',
        ),
      "preload points at 1 file(s) the document never requests",
    ],
    [
      "a third-party preload",
      (h) =>
        h.replace(
          '<link rel="preload" as="image" href="/images/home/hero-stroller-768.webp"',
          '<link rel="preload" as="image" href="https://plus.unsplash.com/hero.jpg"',
        ),
      "the document preloads a third-party image",
    ],
    [
      "the first screen's font face was not inlined",
      (h) => h.replace(/<style id="bbt-font-sheet">[\s\S]*?<\/style>/, ""),
      "the first screen's font face is not inlined",
    ],
    [
      "the font preload lost its crossorigin",
      (h) =>
        h.replace(
          '<link rel="preload" as="font" type="font/woff2" href="/fonts/QGYvz_MVcBeNP4NJtEtqUYLknw.woff2" crossorigin />',
          '<link rel="preload" as="font" type="font/woff2" href="/fonts/QGYvz_MVcBeNP4NJtEtqUYLknw.woff2" />',
        ),
      "a font preload is missing crossorigin",
    ],
    [
      "a font preload for a file the document never requests",
      (h) =>
        h.replace(
          'href="/fonts/QGYvz_MVcBeNP4NJtEtqUYLknw.woff2" crossorigin',
          'href="/fonts/never-requested.woff2" crossorigin',
        ),
      "a font preload points at a file the document never requests",
    ],
    [
      "the entrance animation was left on",
      (h) => h.replace("#primary_tab_viewport > * { animation: none !important; }", ""),
      "the entrance animation is not turned off",
    ],
    [
      "an image has no dimensions",
      (h) => h.replace(' width="800" height="600"', ""),
      "carry no intrinsic width/height",
    ],
    [
      "the hero has a single candidate",
      (h) =>
        h.replace(
          ' srcset="/images/home/hero-stroller-480.webp 480w, /images/home/hero-stroller-768.webp 768w"',
          "",
        ),
      "no second srcset candidate",
    ],
    [
      "the brand mark's preload was left behind",
      (h) =>
        h.replace(
          '<footer id="main_footer">',
          '<link rel="preload" as="image" href="/favicon.svg" /><footer id="main_footer">',
        ),
      "preload points at 1 file(s) the document never requests",
    ],
    [
      "the brand mark is still a raster image",
      (h) =>
        h.replace(
          '<footer id="main_footer">',
          '<img src="/favicon.svg" alt="" width="32" height="32" /><footer id="main_footer">',
        ),
      "brand mark is still shipped as a raster",
    ],
    [
      "the hero preload lost its candidates",
      (h) => h.replace(/ imagesrcset="[^"]*" imagesizes="100vw"/, ""),
      "hero preload does not name the candidates",
    ],
    [
      "the homepage ships no analytics beacon",
      (h) =>
        h.replace(
          '<script src="/scripts/analytics-boot.js" defer data-ga="G-TEST12345"></script>',
          "",
        ),
      "analytics beacon is not in the document",
    ],
    [
      "the beacon is not deferred",
      (h) => h.replace('src="/scripts/analytics-boot.js" defer', 'src="/scripts/analytics-boot.js"'),
      "analytics beacon is not in the document",
    ],
    [
      "the beacon has no measurement id",
      (h) => h.replace(' data-ga="G-TEST12345"', ""),
      "analytics beacon carries no measurement id",
    ],
    [
      "gtag.js is inlined",
      (h) =>
        h.replace(
          "</head>",
          '<script src="https://www.googletagmanager.com/gtag/js?id=G-TEST12345"></script></head>',
        ),
      "gtag.js is in the document",
    ],
    [
      "the consent banner stops announcing decisions",
      (h) => h.replace("bbt:consent", "bbt-consent"),
      "consent banner announces no decision",
    ],
  ];

  for (const [name, mutate, expected] of cases) {
    const mutated = mutate(good);
    const result = checkDocument(mutated);
    const caught = result.failures.some((f) => f.includes(expected));
    if (!caught) {
      failures.push(`the guard did not catch: ${name} (failures: ${result.failures.join(" | ")})`);
    }
  }

  // The transformations themselves, stated as facts about the good document.
  // Each condition must hold for the document to be correct.
  const facts = [
    ["the entry bundle was not removed", !good.includes("/assets/index-abc.js")],
    ["the chunk preloads were not removed", !good.includes("modulepreload")],
    ["the app stylesheet was not removed", !good.includes("/assets/index-abc.css")],
    ["the boot cover was not removed", !good.includes("app-boot-cover")],
    ["the boot spinner keyframes were not removed", !good.includes("app-boot-spin")],
    ["the critical CSS was not inlined", good.includes(".flex{display:flex}")],
    ["the prerendered body survived in the document", !good.includes("old prerendered body")],
    ["the layer order statement was dropped", good.includes("@layer theme, base, components, utilities;")],
    ["the body's own class list was dropped", good.includes('<body class="bg-slate-50">')],
    ["the first screen's font face was not inlined", good.includes('id="bbt-font-sheet"')],
    ["the font sheet was not inlined", good.includes("font-family: 'Outfit'")],
    [
      "the font sheet is linked as well as inlined",
      !/<link\b[^>]*\/fonts\/fonts-latin\.css/.test(good),
    ],
    [
      "the font file was not preloaded",
      good.includes('<link rel="preload" as="font" type="font/woff2" href="/fonts/QGYvz_MVcBeNP4NJtEtqUYLknw.woff2" crossorigin />'),
    ],
    [
      "the hero has no small candidate",
      /srcset="\/images\/home\/hero-stroller-480\.webp 480w/.test(good),
    ],
    [
      "the hero image has no intrinsic size",
      /hero-stroller-768\.webp[^>]*width="768"[^>]*height="512"/.test(good),
    ],
    [
      "the hero preload does not carry the same candidates",
      /imagesrcset="\/images\/home\/hero-stroller-480\.webp 480w/.test(good),
    ],
  ];

  for (const [name, ok] of facts) {
    if (!ok) failures.push(name);
  }

  // The image helpers, exercised on bytes rather than on prose. A reader that
  // cannot tell a WebP from a PNG would put a nonsense size on the page, and
  // a "not a WebP" error is the only thing standing between the build and a
  // document full of wrong dimensions.
  const heroFile = resolve("public/images/home/hero-stroller-768.webp");
  if (existsSync(heroFile)) {
    const size = webpSize(readFileSync(heroFile));
    if (size.width !== 768 || size.height !== 512) {
      failures.push(`webpSize misread the hero: ${size.width}x${size.height}, expected 768x512`);
    }
    const smallFile = resolve("public/images/home/hero-stroller-480.webp");
    if (!existsSync(smallFile)) {
      failures.push("the hero's 480 px candidate is missing from public/images/home/");
    } else if (webpSize(readFileSync(smallFile)).width !== 480) {
      failures.push("the hero's 480 px candidate is not 480 px wide");
    }
  } else {
    failures.push("public/images/home/hero-stroller-768.webp is missing");
  }
  const notWebp = (() => {
    try {
      webpSize(readFileSync(resolve("public/favicon.svg")));
      return false;
    } catch {
      return true;
    }
  })();
  if (!notWebp) failures.push("webpSize accepted an SVG as a WebP - the size would be nonsense");

  if (insertAttrs('<link rel="preload" as="image" href="/x.webp" />', 'width="1"') !==
      '<link rel="preload" as="image" href="/x.webp" width="1">') {
    failures.push("insertAttrs left the self-closing slash in place");
  }

  // The reverse assertion for the body tag: the prerender's inline style
  // mentions "<body>" in a comment, and the first "<body" in the document
  // is that comment. Splitting there drops the real tag and its class
  // list - which is what the page's backdrop, text colour and font
  // smoothing hang on. The good document below carries the same comment,
  // so the fact above can only hold if the real tag is the one that is
  // kept.
  const withComment = shell.replace(
    "      @layer theme, base, components, utilities;",
    "      /* the markup carries four utility classes on <body> */\n      @layer theme, base, components, utilities;",
  );
  const withCommentDocument = assembleStaticHome({
    shellHtml: withComment,
    ssrMarkup,
    criticalCss: ".flex{display:flex}",
    fontSheet,
  });
  if (!withCommentDocument.includes('<body class="bg-slate-50">')) {
    failures.push("a <body> mentioned in a comment was taken for the body tag");
  }

  // The duplicate-preload rule: the head's preload wins and the body's copy
  // of the same preload goes. A document that carries the hero's preload
  // twice is not broken - the browser ignores the second one - but it is two
  // tags for one file, and the rule that says "every preload points at a
  // file the page requests" is easier to trust when there is one preload per
  // file.
  const duplicated = assembleStaticHome({
    shellHtml: shell,
    ssrMarkup:
      '<link rel="preload" as="image" href="/images/home/hero-stroller-768.webp" />' +
      '<header id="core_header"></header>' +
      '<section id="home_banner_anchor"><div style="opacity: 0.62;background-image:url(/images/home/hero-960.webp)"></div></section>' +
      '<section id="faq_section_anchor"><details class="bbt-faq"><summary class="bbt-faq-summary">q</summary></details></section>' +
      '<a href="/products/kids-bikes/">product</a>' +
      '<footer id="main_footer"></footer>',
    criticalCss: ".flex{display:flex}",
    fontSheet,
  });
  const heroPreloadCount = (
    duplicated.match(/rel="preload" as="image" href="\/images\/home\/hero-stroller-768\.webp"/g) || []
  ).length;
  if (heroPreloadCount !== 1) {
    failures.push(
      `the hero is preloaded ${heroPreloadCount} times - the head's preload wins and the body's copy goes`,
    );
  }

  // The other direction of the content-visibility rule: a stylesheet that only
  // MENTIONS contain-intrinsic-size inside a feature test must not trip it.
  // Tailwind ships exactly that as a placeholder reset, so the first version
  // of this guard was red on the builder's own output. A guard that cries wolf
  // on the legitimate case is a guard that gets deleted.
  const tailwindReset = assembleStaticHome({
    shellHtml: shell,
    ssrMarkup,
    criticalCss:
      "@supports (not ((-webkit-appearance:-apple-pay-button))) or (contain-intrinsic-size:1px){::placeholder{color:currentColor}}",
    fontSheet,
  });
  const resetResult = checkDocument(tailwindReset);
  const falsePositive = resetResult.failures.filter((f) => /contain-intrinsic-size|content-visibility/.test(f));
  if (falsePositive.length) {
    failures.push(
      `a Tailwind @supports feature test was taken for a declaration: ${falsePositive.join(", ")}`,
    );
  }

  if (failures.length) {
    console.error(`SELF-TEST FAILED (${failures.length}):`);
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exit(1);
  }
  console.log(`SELF-TEST PASSED (${cases.length} reverse assertions, ${facts.length} facts)`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
