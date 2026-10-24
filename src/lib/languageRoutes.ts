/**
 * languageRoutes.ts — the /zh URL scheme.
 *
 * The site ships an English and a Chinese edition of every guide and news
 * story (CMS `en` + `zh` fields), but until 2026-10-24 the language was pure
 * client state: `resolveInitialLang()` read localStorage and the URL never
 * changed. A crawler therefore only ever saw the English page, and the
 * Chinese content had no URL to be indexed at all.
 *
 * The scheme is a path prefix: `/zh/<english path>`. So
 *
 *   /guides/beginner/stroller-travel-airplane   (en)
 *   /zh/guides/beginner/stroller-travel-airplane (zh)
 *
 * Both are real, self-canonical pages, cross-linked with hreflang
 * (en / zh / x-default). Only the families that actually have a Chinese
 * edition get a /zh variant — see ZH_ROUTE_ROOTS.
 */

export const ZH_LANG_PREFIX = "/zh";

/** Route roots that have a Chinese edition. */
export const ZH_ROUTE_ROOTS = ["guides", "news"] as const;

/** True when the pathname is a /zh variant. */
export function isZhPath(pathname: string): boolean {
  const path = String(pathname || "").trim();
  if (!path) return false;
  const segments = path.replace(/^\/+/, "").split("/").filter(Boolean);
  return segments[0] === "zh" && segments.length > 1;
}

/** `/zh/guides/x` -> `/guides/x`; anything else is returned unchanged. */
export function stripZhPrefix(pathname: string): string {
  const path = String(pathname || "").trim();
  if (!isZhPath(path)) return path;
  const stripped = path.replace(/^\/zh(?=\/)/i, "");
  return stripped || "/";
}

/** `/guides/x` -> `/zh/guides/x`; an already-prefixed path is left alone. */
export function withZhPrefix(pathname: string): string {
  const path = String(pathname || "").trim();
  if (!path || path === "/") return ZH_LANG_PREFIX;
  if (isZhPath(path)) return path;
  return `${ZH_LANG_PREFIX}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * True when this path has a Chinese counterpart. Only the guides and news
 * families are translated today; everything else keeps the language toggle
 * as a client-side switch.
 */
export function hasZhVariant(pathname: string): boolean {
  const path = stripZhPrefix(pathname);
  const segments = path.replace(/^\/+/, "").split("/").filter(Boolean);
  const root = segments[0] || "";
  return (ZH_ROUTE_ROOTS as readonly string[]).includes(root);
}

/** The other language's URL for this path (same path, other prefix). */
export function languageAlternatePath(pathname: string): string {
  return isZhPath(pathname) ? stripZhPrefix(pathname) : withZhPrefix(pathname);
}
