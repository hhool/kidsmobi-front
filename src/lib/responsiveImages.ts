/**
 * Criterion 27 (R-314): publish AVIF/WebP with a srcset of >= 2 candidates.
 *
 * `responsiveImages.generated.ts` is produced by
 * `scripts/gen-responsive-images.py`. Both the prerender and the SPA import
 * that one map, so the delivered HTML and the reader's DOM cannot drift.
 * The derivatives are ordinary static files under /images/derived/ — no
 * Cloudflare switch to flip, no paid plan, no runtime image service.
 */
import { RESPONSIVE_IMAGES, type ResponsiveImage } from "./responsiveImages.generated";

export type { ResponsiveImage } from "./responsiveImages.generated";

export const RESPONSIVE_SIZES = "(max-width: 640px) 400px, 800px";

/** The map is keyed by the exact published URL, before HTML entity escaping. */
export function responsiveImageFor(src: string | undefined | null): ResponsiveImage | null {
  if (!src) return null;
  return RESPONSIVE_IMAGES[src] || null;
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function decodeAttr(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&#38;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

const IMG_TAG = /<img\b([^>]*)>/gi;
const SRC_ATTR = /\bsrc="([^"]*)"/i;

/**
 * Rewrite every published <img> in a rendered document. Applied once, at the
 * single place the prerender writes a page, so all 442 pages are covered
 * without editing eight different HTML templates.
 *
 * `onerror` falls back to the original JPG for the handful of browsers that
 * cannot decode WebP, which is what R-314 asks for. Dead source URLs carry an
 * empty fallback: their placeholder derivative is already the honest answer.
 */
export function applyResponsiveImagesToHtml(html: string): string {
  return html.replace(IMG_TAG, (tag, attrs: string) => {
    const match = SRC_ATTR.exec(attrs);
    if (!match) return tag;
    const record = responsiveImageFor(decodeAttr(match[1]));
    if (!record) return tag;

    // The templates emit XHTML-style self-closing tags (`... />`). Appending
    // attributes to the raw tail would leave a stray `/` in front of them,
    // so drop that slash and close the tag explicitly.
    const body = attrs.replace(/\s*\/\s*$/, "");
    let next = body.replace(SRC_ATTR, `src="${escapeAttr(record.src)}"`);
    next += ` srcset="${escapeAttr(record.srcset)}" sizes="${RESPONSIVE_SIZES}"`;
    if (record.fallback) {
      next += ` data-fallback="${escapeAttr(record.fallback)}"`;
      next += ` onerror="this.onerror=null;this.src=this.dataset.fallback"`;
    }
    return `<img${next}>`;
  });
}

/** Upgrade an <img> the SPA inserted, including ones React re-renders later. */
export function upgradeDomImage(img: HTMLImageElement): void {
  const raw = img.getAttribute("src") || "";
  const record = responsiveImageFor(raw);
  // A derivative URL is not a key in the map, so the upgrade terminates
  // naturally. A one-shot flag would leave the image stranded on the remote
  // JPG whenever React re-renders and writes the original src back.
  if (!record) return;
  img.setAttribute("srcset", record.srcset);
  img.setAttribute("sizes", RESPONSIVE_SIZES);
  if (record.fallback) img.dataset.fallback = record.fallback;
  img.src = record.src;
}

/**
 * One observer covers the SPA's content images that are emitted directly in
 * JSX rather than through SmartImage. SmartImage reads the same map itself,
 * so its initial probe already fetches the derivative.
 */
export function watchResponsiveImages(root: ParentNode = document): () => void {
  const upgrade = (node: Node) => {
    if (node.nodeType !== 1) return;
    const el = node as Element;
    if (el.tagName === "IMG") upgradeDomImage(el as HTMLImageElement);
    el.querySelectorAll?.("img").forEach((img) => upgradeDomImage(img));
  };
  upgrade(root);
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === "attributes" && record.target instanceof HTMLImageElement) {
        upgradeDomImage(record.target);
      } else {
        record.addedNodes.forEach(upgrade);
      }
    }
  });
  observer.observe(root === document ? document.documentElement : (root as Node), {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["src"],
  });
  return () => observer.disconnect();
}
