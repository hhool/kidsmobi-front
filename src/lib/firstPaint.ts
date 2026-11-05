/**
 * Static first-screen cover, variant B (approved 2026-11-05).
 *
 * The delivered HTML already contains the full prerendered article inside
 * #root. The SPA mounts with createRoot (NOT hydrateRoot), so React used to
 * throw that entire 17,000px document away and paint a 320px skeleton in its
 * place. That single replacement is the source of both the late LCP and the
 * 0.290401 CLS: the footer jumps from ~320px to ~17100px and back.
 *
 * Variant B keeps the prerendered first screen visible in a fixed cover while
 * the SPA builds its real DOM in a hidden #root. Once the SPA's content is
 * actually present (not merely "React rendered something"), the cover is
 * removed and the SPA is shown in one frame. There is no intermediate layout,
 * so there is no layout shift.
 *
 * This is the SHIPPED implementation of the ?fpc=B prototype in
 * .runs/first-paint/measure.mjs. It is deliberately an inline, dependency-free
 * ES5 script: adding a <script src> would add a render-blocking request to
 * every page and break criterion 26. It runs synchronously at the end of the
 * body, after #root is parsed and before the deferred ES module in <head>
 * executes, so React still mounts into the same #root element as before.
 *
 * Scope: prerendered delivery HTML only. `npm run dev` serves index.html
 * directly and mounts the SPA without a static cover; that is the development
 * path, not a published page. Nothing in this file changes what either render
 * path publishes - only WHEN the reader sees one versus the other.
 */
/** Marker used by scripts/check-first-paint.mjs and for idempotence. */
export const FIRST_PAINT_SCRIPT_ID = "bbt-first-paint";

/**
 * The boot script. Kept as a string so the HTML generator and any future
 * consumer read one copy. Must not contain the literal `</script` sequence.
 *
 * Four failure paths are handled explicitly, because each of them used to
 * strand the reader:
 *
 *   1. The 16s ceiling fired while React had not mounted yet. Revealing then
 *      would have swapped the article for an EMPTY #root - a white screen.
 *      The static article now stays on screen and becomes scrollable.
 *   2. The 16s ceiling fired while the SPA was up but still showing its
 *      Suspense skeleton. Revealing then showed a permanent skeleton. The
 *      static article now stays, and the observer keeps watching so the SPA
 *      still takes over the moment its real content lands.
 *   3. The readiness test demanded more than 2,500 characters of text. That
 *      number was a guess; the shortest published page carries about 1,050
 *      characters, so a real page could never satisfy it. The test is now
 *      structural: the route's own content region must exist, must not still
 *      be a Suspense fallback, and must carry real copy.
 *   4. The readiness test only recognised one fallback string. The product
 *      detail route renders ProductDetailSkeleton instead, which announces
 *      itself with aria-busy="true" and a different label. Both are checked
 *      now, so a product page is never revealed while its skeleton is up.
 *
 * The reveal reason is published twice on purpose: as a performance mark
 * ("bbt-first-paint:<reason>") and as a data-first-paint attribute on #root.
 * A report whose mark says "static-fallback" is a page where the SPA never
 * took over - that is NOT evidence that the SPA is fast, and the audit must
 * be able to tell the two apart.
 */
export const FIRST_PAINT_BOOT_SCRIPT = `(function () {
  var root = document.getElementById('root');
  if (!root || root.getAttribute('data-first-paint-booted') === '1') return;
  root.setAttribute('data-first-paint-booted', '1');

  var state = { revealed: false, reason: null, atMs: null };
  window.__BBT_FIRST_PAINT__ = state;

  // The head ships an eight-second full-screen spinner for the old boot path.
  // The prerendered article IS the first screen now, so the spinner is retired
  // before the first paint rather than eight seconds later.
  document.documentElement.classList.remove('app-js-loading');
  var spinner = document.getElementById('app-boot-cover');
  if (spinner) spinner.style.display = 'none';

  var cover = document.createElement('div');
  cover.id = 'bbt-first-paint-cover';
  cover.style.cssText = 'position:fixed;inset:0;z-index:2147483646;overflow:hidden;background:#f8fafc;';
  var kids = Array.prototype.slice.call(root.childNodes);
  for (var i = 0; i < kids.length; i += 1) {
    if (kids[i] !== spinner) cover.appendChild(kids[i]);
  }
  document.body.appendChild(cover);
  root.style.display = 'none';

  function reveal(reason) {
    if (state.revealed) return;
    state.revealed = true;
    state.reason = reason;
    state.atMs = Math.round(performance.now());
    try { performance.mark('bbt-first-paint:' + reason); } catch (e) {}
    requestAnimationFrame(function () {
      root.style.display = '';
      if (cover.parentNode) cover.parentNode.removeChild(cover);
      root.setAttribute('data-first-paint', 'ready');
    });
  }

  // The SPA has not taken over. The prerendered article is real, readable
  // content - keep it on screen and let the reader scroll it. A frozen first
  // viewport is not a page, and revealing an empty #root would be a white
  // screen. The cover stays fixed and out of flow, so nothing on the page
  // shifts while the SPA is still working.
  function keepStatic(reason) {
    if (state.revealed) return;
    if (state.reason === null) {
      state.reason = reason;
      state.atMs = Math.round(performance.now());
      try { performance.mark('bbt-first-paint:' + reason); } catch (e) {}
    }
    cover.style.overflow = 'auto';
    root.setAttribute('data-first-paint', reason);
  }

  // "Real content" means the SPA shell is mounted, the route's own content
  // region exists, and the Suspense fallback for that route is gone. The
  // fallback is route-dependent: the generic one says "Loading
  // BalanceBikeToddler", the product detail one is ProductDetailSkeleton
  // (aria-busy="true" plus its own label). Checking only the first one let a
  // product page be revealed while its skeleton was still on screen.
  function fallbackPending() {
    if (root.querySelector('[aria-busy="true"]')) return true;
    var text = root.textContent || '';
    if (text.indexOf('Loading BalanceBikeToddler') !== -1) return true;
    if (text.indexOf('Loading review content') !== -1) return true;
    if (text.indexOf('正在加载评测内容') !== -1) return true;
    return false;
  }

  function contentReady() {
    if (!root.querySelector('#decision_core')) return false;
    if (!root.querySelector('footer#main_footer')) return false;
    if ((root.textContent || '').indexOf('Page Recovery Mode') !== -1) return false;
    if (fallbackPending()) return false;
    var main = root.querySelector('#primary_tab_viewport');
    if (!main) return false;
    var mainText = (main.textContent || '').trim();
    // A heading means the route rendered its own content. Otherwise the copy
    // has to be substantial: the shortest published page carries about 1,050
    // characters, while a Suspense fallback carries a few dozen at most.
    if (main.querySelector('h1')) return true;
    return mainText.length > 120;
  }

  function gaveUp() {
    return (root.textContent || '').indexOf('Page Recovery Mode') !== -1;
  }

  var observer = null;
  var poll = null;

  function evaluate() {
    if (state.revealed) return true;
    if (gaveUp()) {
      if (observer) observer.disconnect();
      if (poll) clearInterval(poll);
      reveal('error');
      return true;
    }
    if (contentReady()) {
      if (observer) observer.disconnect();
      if (poll) clearInterval(poll);
      reveal('content-ready');
      return true;
    }
    return false;
  }

  if (typeof MutationObserver !== 'undefined') {
    observer = new MutationObserver(function () {
      evaluate();
    });
    observer.observe(root, { childList: true, subtree: true, characterData: true });
  } else {
    // Ancient browsers: poll instead. The fallback still has to work, and a
    // poll costs nothing next to the script that is already in the page.
    poll = setInterval(function () {
      evaluate();
    }, 100);
  }

  if (evaluate()) return;

  // Hard ceiling: a slow CMS, a failed chunk, or a route with unusually short
  // copy must never strand a reader on the static page forever. This is a
  // safety valve, not the normal path. The static article stays and becomes
  // scrollable - that is a readable page, unlike an empty #root or a
  // permanent skeleton - and the observer keeps watching, so a late SPA
  // still takes over.
  window.setTimeout(function () {
    if (state.revealed) return;
    keepStatic('timeout');
  }, 16000);
})();`;

/**
 * Inject the boot script once, at the single place the prerender writes a
 * page. Returns the input untouched when the marker is already present, so
 * running the hook twice cannot produce two covers.
 */
export function applyFirstPaintToHtml(html: string): string {
  const marker = `id="${FIRST_PAINT_SCRIPT_ID}"`;
  if (html.includes(marker)) return html;
  const close = html.lastIndexOf("</body>");
  if (close === -1) return html;
  const script = `<script ${marker}>\n${FIRST_PAINT_BOOT_SCRIPT}\n</script>\n  `;
  return html.slice(0, close) + script + html.slice(close);
}
