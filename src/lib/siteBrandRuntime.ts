import { SITE_BRAND } from "./entityGraph";

/**
 * Runtime half of the site rename.
 *
 * The prerender rewrites every finished HTML document at its single write
 * point, so curl sees only the new brand. A createRoot app, however, replaces
 * #root with React output afterwards, and dozens of historical copy strings
 * still spell the launch brand ("Editorial Team", header subtitle, FAQ prose).
 * The result is a page that looks perfect to a static crawler and reverts to
 * the old brand in a real browser — the same two-sided failure we hit with
 * product field parsers.
 *
 * This is the single runtime sink for that token. It does not try to rewrite
 * data modules (they remain byte-stable for the default deployment); it
 * normalizes what actually reaches the DOM, including JSON-LD script bodies
 * and the meta tags a component writes directly. Lowercase
 * `balancebiketoddler` (domains, email addresses) is deliberately untouched.
 */
const LEGACY_BRAND = "BalanceBikeToddler";
const ATTRIBUTES = ["content", "title", "aria-label", "alt", "placeholder"];

export function localizeSiteBrand(text: string): string {
  return SITE_BRAND === LEGACY_BRAND ? text : text.split(LEGACY_BRAND).join(SITE_BRAND);
}

function scan(root: ParentNode): void {
  if (SITE_BRAND === LEGACY_BRAND) return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const parent = node.parentElement;
    // Ordinary <script>/<style> bodies are code, not copy; JSON-LD is copy that
    // search engines read and must carry the same brand as the visible page.
    if (parent && /^(SCRIPT|STYLE)$/.test(parent.tagName) && parent.getAttribute("type") !== "application/ld+json") {
      continue;
    }
    const value = node.nodeValue;
    if (value && value.includes(LEGACY_BRAND)) node.nodeValue = localizeSiteBrand(value);
  }

  const elements = root.querySelectorAll<HTMLElement>("meta[content], [title], [aria-label], [alt], [placeholder], script[type='application/ld+json']");
  elements.forEach((element) => {
    if (element.tagName === "SCRIPT") {
      const json = element.textContent;
      if (json && json.includes(LEGACY_BRAND)) element.textContent = localizeSiteBrand(json);
      return;
    }
    for (const attr of ATTRIBUTES) {
      const value = element.getAttribute(attr);
      if (value && value.includes(LEGACY_BRAND)) element.setAttribute(attr, localizeSiteBrand(value));
    }
  });
}

/**
 * Install once at app mount. Returns a disposer so hot reload / tests cannot
 * leave duplicate observers behind.
 */
export function installSiteBrandRuntime(): () => void {
  if (typeof document === "undefined" || SITE_BRAND === LEGACY_BRAND) return () => {};

  let queued = false;
  const flush = () => {
    queued = false;
    scan(document);
  };
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(flush);
  };

  scan(document);
  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
  });
  return () => observer.disconnect();
}
