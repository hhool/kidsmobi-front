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

import { hasGeneratedZhRoute } from "./zhRoutes.generated";

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
 *
 * "Has a Chinese counterpart" is a per-PAGE fact, not a per-family one. The
 * prerender builds a /zh edition for exactly two things: the two Chinese hubs
 * (/zh/guides, /zh/news) and, for each record that carries a translated title
 * + body, the translated article. It builds NO /zh edition of
 *
 *   - a topic channel page (/zh/guides/beginner) — those never existed,
 *   - a news channel page (/zh/news/industry),
 *   - a guides category page (/zh/guides/stroller/),
 *   - any composite page (/zh/guides/<category>/<topic>/).
 *
 * Testing only the first segment claimed all of them did. That is measured, not
 * assumed: of the 87 English-prefixed guides/news pages in a 2026-11-24 build,
 * 76 carry en/zh/x-default and every one of those 76 has a real /zh file, while
 * the 11 that carry none (the 6 topic channel pages, 4 news channel pages, and
 * /guides/risk/balance-bike-recall-record, whose record is not in the CMS) have
 * no /zh file either. The two sides agree exactly.
 *
 * So the rule below reconstructs the prerender's own condition. Anything it
 * cannot prove has a translation returns false, which is the safe direction:
 * a page that declares no hreflang is merely unpaired, whereas a page that
 * declares an alternate pointing at a URL the site never built is the
 * "hreflang points at a 404" failure that earns the whole annotation set being
 * ignored.
 *
 * Keeping this in sync with scripts/prerender-pages.ts is a hard requirement.
 * scripts/check-hreflang.mjs previously only grepped the SPA bundle for the
 * string "x-default", which is why this divergence survived several rounds of
 * green guards; it now compares the two sides route by route.
 */
export function hasZhVariant(pathname: string): boolean {
  const path = stripZhPrefix(pathname);
  const segments = path.replace(/^\/+/, "").split("/").filter(Boolean);
  const root = segments[0] || "";
  if (!(ZH_ROUTE_ROOTS as readonly string[]).includes(root)) return false;

  // Both editions of a pair answer "yes": the English page has a Chinese
  // counterpart, and the Chinese page is itself a Chinese edition. So test the
  // path in both languages against the generated list rather than making every
  // caller remember to strip or add the prefix first.
  return hasGeneratedZhRoute(withZhPrefix(path)) || hasGeneratedZhRoute(stripZhPrefix(path));
}

/** The other language's URL for this path (same path, other prefix). */
export function languageAlternatePath(pathname: string): string {
  return isZhPath(pathname) ? stripZhPrefix(pathname) : withZhPrefix(pathname);
}
