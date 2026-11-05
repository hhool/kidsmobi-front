/**
 * staticDocument.ts — "is this bundle the static homepage document?"
 *
 * Why this exists
 * ---------------
 * The homepage ships as a static document (src/ssr/home-entry.tsx renders the
 * REAL React homepage at build time), because that is the only delivery
 * shape that clears audit items 23 (LCP < 2000 ms) and 24 (TBT < 200 ms):
 * a React mount of the homepage costs about 2,900 ms of main-thread time
 * against a 200 ms budget.
 *
 * But the static document has no React, so every control the SPA drives with
 * a click handler has to have a native counterpart:
 *
 *   - a product card is an <a>, not a <div> with onClick;
 *   - the FAQ is <details>, not a button that flips a state variable;
 *   - the hero CTA and the quick-category chips are links;
 *   - the header's navigation is a list of links.
 *
 * Those replacements are NOT a rewrite of the components. They are the same
 * components rendering a different way, chosen by one flag, so the browser
 * build keeps its behaviour byte-for-byte and the static build produces a
 * document that works without a script.
 *
 * The flag is set by the build (src/ssr/home-entry.tsx) BEFORE any component
 * module is imported. In the browser bundle it is never set, so
 * isStaticDocument() is false and every component takes its normal path.
 *
 * The rule the flag has to obey: it may only change WHICH element is
 * rendered, never what it looks like. A reader who compares the two pages
 * has to see the same design; only the behaviour underneath differs.
 */
export function isStaticDocument(): boolean {
  return (globalThis as any).__BBT_STATIC_DOCUMENT__ === true;
}

/**
 * The destination of the hero's "find your perfect ride" call to action.
 *
 * The SPA opens an in-page matching wizard. That wizard has no route: it is
 * a component, not a page, so a document cannot link to it. The guides hub
 * does render the same Smart Wizard section, so that is where the link goes
 * - a real destination, not a button that does nothing.
 */
export const STATIC_WIZARD_HREF = "/guides/";

/**
 * The destination of the scenario cards.
 *
 * In the SPA they switch the app to the guides tab. A document cannot switch
 * tabs, so they point at the guides hub - the same content, at a URL.
 */
export const STATIC_SCENARIO_HREF = "/guides/";

/**
 * The Chinese edition's entry point.
 *
 * The homepage has no Chinese edition (the /zh tree covers guides and news
 * only, and the homepage's canonical is the English one), so the language
 * control points at the Chinese part of the site that does exist.
 */
export const STATIC_LANG_HREF = "/zh/guides/";
