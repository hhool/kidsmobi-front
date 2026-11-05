/**
 * The build-time homepage renderer.
 *
 * Why this exists
 * ---------------
 * Audit items 23 (LCP < 2000ms) and 24 (TBT < 200ms) are measured against the
 * HOMEPAGE, and the homepage is the one page where the SPA owns the entire
 * first screen: React creates the hero, the bundle blocks the paint, and the
 * simulated main thread spends ~3s there. The measured ladder in
 * 04-build/lcp-attribution.json is unambiguous - only a homepage that does
 * NOT start the SPA clears both budgets.
 *
 * But the static-home variant that measured LCP 1211ms / TBT 140ms used the
 * SEO homepage from renderHomePage(): an Arial inline-style article. That is
 * not the page a reader sees. The SPA paints a Tailwind homepage with a hero
 * carousel, safety-audit sections, category cards and a FAQ. Shipping the SEO
 * variant as the homepage would be a UI/UX regression dressed up as a
 * performance win.
 *
 * So the static homepage has to BE the React homepage. This renders it.
 *
 * Why a separate SSR bundle instead of tsx
 * ----------------------------------------
 * Five modules read import.meta.env at module scope (cmsD1Service.ts:21 and
 * four others). Under tsx that is `undefined` and the import throws before
 * the first line of the app runs. A Vite SSR build defines import.meta.env,
 * which is also what the browser build sees - so both sides read the same
 * values and cannot drift.
 *
 * Why renderToStaticMarkup and not the streaming renderers
 * ---------------------------------------------------------
 * App.tsx declares 59 lazy() boundaries. A static render has to settle every
 * one of them, and the two streaming APIs do it in ways a static document
 * cannot use:
 *
 *   - renderToStaticMarkup renders the Suspense FALLBACK for a lazy child -
 *     it does not wait. So the homepage's components have to be resolved
 *     BEFORE the render, which is what the lazySection registry does: it
 *     hands back the already-loaded component, so the boundary never has
 *     anything to wait for and never emits a fallback.
 *
 *   - renderToPipeableStream and prerender() produce a STREAMING document:
 *     React emits the Suspense fallback inline and parks the resolved markup
 *     in <div hidden id="S:0">, to be moved into place by a trailing $RC
 *     script. A static document cannot depend on that script - the first
 *     screen would be the fallback until the script ran, which is exactly
 *     the "blank then fill" pattern this whole change exists to remove.
 *
 * The renderer deliberately renders the app with NO browser globals except
 * the ones App.tsx reads in a render BODY. Each stub carries the homepage's
 * own value, so the build cannot accidentally render a different page than
 * the one it is supposed to.
 *
 * Usage:
 *   npx vite build --ssr src/ssr/home-entry.tsx --outDir .runs/home-ssr-build
 *   node .runs/home-ssr-build/home-entry.js > .runs/home-ssr/home.html
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { registerLazyResolver } from "../lib/lazySection";
import { applyResponsiveImagesToHtml } from "../lib/responsiveImages";
import { sanitizeUnsupportedClaims } from "../lib/unsupportedClaims";

/**
 * The browser globals App.tsx reads while RENDERING (not in an effect).
 * Each one carries the homepage's own value.
 */
function installBrowserStubs(): void {
  const location = {
    pathname: "/",
    search: "",
    hash: "",
    href: "https://balancebiketoddler.com/",
    origin: "https://balancebiketoddler.com",
    host: "balancebiketoddler.com",
    hostname: "balancebiketoddler.com",
    protocol: "https:",
    port: "",
    assign() {},
    replace() {},
    reload() {},
    toString() {
      return this.href;
    },
  };
  const storage: Record<string, string> = {};
  const g = globalThis as any;

  const localStorage = {
    getItem: (k: string) => (k in storage ? storage[k] : null),
    setItem: (k: string, v: string) => {
      storage[k] = String(v);
    },
    removeItem: (k: string) => {
      delete storage[k];
    },
    clear: () => {},
  };

  g.window = {
    location,
    localStorage,
    addEventListener() {},
    removeEventListener() {},
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
    scrollTo() {},
    innerWidth: 1280,
    innerHeight: 900,
  };
  g.document = {
    location,
    addEventListener() {},
    removeEventListener() {},
    querySelectorAll: () => [],
    querySelector: () => null,
    getElementById: () => null,
    createElement: () => ({ style: {}, setAttribute() {}, remove() {} }),
    head: { appendChild() {} },
    body: { appendChild() {}, classList: { add() {}, remove() {} } },
    documentElement: { classList: { add() {}, remove() {} } },
    readyState: "complete",
  };
  g.localStorage = localStorage;
  Object.defineProperty(g, "navigator", {
    configurable: true,
    writable: true,
    value: { language: "en-US", languages: ["en-US"], userAgent: "node" },
  });
  g.location = location;
  g.requestIdleCallback = (cb: any) => setTimeout(() => cb({ didTimeout: false }), 0);
  g.cancelIdleCallback = (id: any) => clearTimeout(id);
  g.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  g.matchMedia = g.window.matchMedia;
}

installBrowserStubs();

/**
 * The products the homepage renders. The SPA fetches them from
 * /api/cms/products?onlyPublished=1 at runtime; the build uses the same
 * endpoint's committed snapshot, so the static homepage and the SPA agree on
 * what the product set is.
 *
 * The snapshot is injected rather than fetched: App.tsx's useEffect never
 * runs under a static render, so without injection the homepage would ship
 * zero product cards.
 */
const FRONT = process.env.BBT_FRONT_ROOT || process.cwd();
const snapshotPath = path.join(FRONT, "scripts/cms-snapshots/products.json");

function loadProducts(): unknown[] {
  const parsed = JSON.parse(readFileSync(snapshotPath, "utf8"));
  if (!Array.isArray(parsed)) throw new Error("products snapshot is not an array");
  return parsed;
}

(globalThis as any).__BBT_SSR_PRODUCTS__ = loadProducts();

/**
 * The static-document flag.
 *
 * Set BEFORE any component module is imported, because the components read
 * it at module-evaluation time (src/lib/staticDocument.ts). It tells the
 * header, the product cards and the FAQ to render their native counterparts
 * - links instead of click handlers, <details> instead of a state variable -
 * so the delivered document works without a script.
 *
 * The browser bundle never sets it, so the SPA is unaffected.
 */
(globalThis as any).__BBT_STATIC_DOCUMENT__ = true;

// The build target does not allow top-level await, so the render runs inside
// an async function. The static import of App.tsx is deliberate: a dynamic
// import would be a second chunk, and the module graph has to be settled
// before prerender() starts or a lazy boundary could resolve late.
async function render(): Promise<void> {
  /**
   * The components on the homepage's render path, loaded eagerly so the
   * static render emits them synchronously.
   *
   * App.tsx's lazySection() asks the registry for a component BEFORE it falls
   * back to React.lazy. When the registry answers, the component is returned
   * as-is and no Suspense boundary is ever created - which is what makes the
   * output a settled document rather than a streaming one.
   *
   * Only the components the homepage actually renders are registered. The
   * other 58 lazy boundaries are never reached on this route, so they keep
   * their normal lazy behaviour and this registry stays small.
   */
  const HOME_COMPONENTS: Array<[string, () => Promise<{ default: any }>]> = [
    ["./components/HomeSection", () => import("../components/HomeSection")],
  ];

  const loadedComponents: Record<string, any> = {};
  for (const [modulePath, loader] of HOME_COMPONENTS) {
    const mod = await loader();
    loadedComponents[modulePath] = mod.default;
  }

  // Registered BEFORE App.tsx is imported: lazySection reads the registry at
  // module-evaluation time, when the lazy definitions are created.
  registerLazyResolver((modulePath) => loadedComponents[modulePath]);

  const { default: App } = await import("../App.tsx");

  // renderToStaticMarkup emits ONE settled document: no Suspense fallback,
  // no hidden boundary, no trailing script. The homepage's components are
  // already resolved by the registry above, so the <Suspense> boundary in
  // App.tsx never has anything to wait for and never emits a fallback.
  const markup = renderToStaticMarkup(React.createElement(App));
  if (process.env.BBT_SSR_RAW) {
    const { writeFileSync } = await import("node:fs");
    writeFileSync(process.env.BBT_SSR_RAW, markup, "utf8");
  }

  // The same post-processing every other page gets, applied at the same
  // place - with ONE exception. The prerender runs these three in order:
  //
  //   sanitizeUnsupportedClaims  -> the honesty pass (criterion 27's
  //                                 sibling): the document must not claim
  //                                 more than the sources support.
  //   applyResponsiveImagesToHtml-> every published <img> becomes the local
  //                                 AVIF/WebP derivatives with a srcset.
  //   applyFirstPaintToHtml     -> the takeover cover. NOT applied here: the
  //                                 document has no SPA to take over from,
  //                                 and the cover would sit on top of a page
  //                                 that is already final.
  const processed = collapseHeroCarousel(
    applyResponsiveImagesToHtml(sanitizeUnsupportedClaims(markup)),
  );
  process.stdout.write(processed);
}

/**
 * The document ships ONE hero frame, not the whole carousel.
 *
 * The homepage rotates through two photographs once JavaScript runs, and the
 * component renders both so the switch is a cross-fade instead of a load. A
 * document has no rotation: the second frame is a photograph the reader never
 * sees, and it is still downloaded. It also made the visual-parity gate fail
 * ("the document ships 3 hero frames - it is a document, so it ships one"),
 * which is the gate doing its job.
 *
 * Fixing it here rather than inside the component keeps the SPA's fade
 * intact, and the frame that survives is the one the SPA shows first - the
 * gate checks that too ("the document's hero is not the SPA's first frame").
 */
function collapseHeroCarousel(html: string): string {
  const marker = 'id="home_banner_anchor"';
  const at = html.indexOf(marker);
  if (at < 0) return html;
  const open = html.lastIndexOf("<section", at);
  if (open < 0) return html;

  // Find the end of this section with a depth walk. The hero has no nested
  // <section> today, but taking the first "</section>" would silently
  // truncate a document that grew one.
  let depth = 0;
  let cursor = open;
  let end = -1;
  while (cursor < html.length) {
    const next = html.slice(cursor).search(/<\/?section\b/);
    if (next < 0) break;
    const tagAt = cursor + next;
    const closing = html[tagAt + 1] === "/";
    const tagEnd = html.indexOf(">", tagAt) + 1;
    if (tagEnd <= 0) break;
    if (closing) {
      depth -= 1;
      if (depth === 0) {
        end = tagEnd;
        break;
      }
    } else {
      depth += 1;
    }
    cursor = tagEnd;
  }
  if (end < 0) return html;

  const hero = html.slice(open, end);
  let seen = 0;
  const collapsed = hero.replace(/<img\b[^>]*>/g, (tag) => {
    seen += 1;
    return seen === 1 ? tag : "";
  });
  return html.slice(0, open) + collapsed + html.slice(end);
}

render().catch((error) => {
  console.error(error);
  process.exit(1);
});
