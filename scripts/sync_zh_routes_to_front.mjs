/**
 * Generates the SPA's list of routes that have a Chinese edition, from the
 * front build.
 *
 * Why this exists: the language toggle and the hreflang emitter both need to
 * answer "does this path have a /zh counterpart?". Language is a URL prefix on
 * this site, so the answer decides whether the toggle navigates to a real page
 * or flips client state, and whether the page declares en/zh/x-default
 * alternates at all.
 *
 * The SPA used to answer from the first URL segment alone ("guides" and "news"
 * are translated families, so anything under them must be too). That is true of
 * the two Chinese hubs and of translated articles, and false of everything in
 * between: /guides/<topic> and /news/<channel> channel pages never had a /zh
 * edition, and the guides category axis (/guides/<category>/ and
 * /guides/<category>/<topic>/) was built without one. Measured on a 2026-11-24
 * build: of 87 English pages under those two families, 76 carried alternates and
 * all 76 had a /zh file; the other 11 had neither. Guessing produced hreflang on
 * the 11 pointing at URLs that do not exist.
 *
 * So the list is derived instead of guessed. scripts/prerender-pages.ts already
 * decides this exactly — it builds a Chinese hub per family and a Chinese
 * article only when the CMS record carries a translated title + body — and now
 * writes the result to dist/data/zh-routes.json. This script copies it into a
 * typed module the SPA imports.
 *
 * Run after any build that changes routes or CMS translations:
 *   cd front && npm run build && node scripts/sync_zh_routes_to_front.mjs
 * then `npm run check:hreflang`, which fails if the two sides disagree.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const source = resolve(root, "dist", "data", "zh-routes.json");
const outFile = resolve(root, "src", "lib", "zhRoutes.generated.ts");

if (!existsSync(source)) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        failed: ["dist/data/zh-routes.json missing — run `npm run build` (the prerender writes it) first"],
      },
      null,
      2,
    ),
  );
  process.exit(1);
}

const routes = JSON.parse(readFileSync(source, "utf8"));
if (!Array.isArray(routes) || routes.length === 0) {
  console.error(
    JSON.stringify({ ok: false, failed: ["zh-routes.json is empty — refusing to write a module that would disable every /zh route"] }, null, 2),
  );
  process.exit(1);
}

// Guard against a manifest that is obviously wrong: every entry must carry the
// /zh prefix (it describes Chinese URLs by definition) and be a plain path.
const bad = routes.filter((route) => typeof route !== "string" || !route.startsWith("/zh/") || route.includes("?"));
if (bad.length) {
  console.error(JSON.stringify({ ok: false, failed: bad.slice(0, 10).map((r) => `not a /zh route: ${JSON.stringify(r)}`) }, null, 2));
  process.exit(1);
}

const sorted = [...new Set(routes)].sort();

const body = `/**
 * GENERATED FILE — do not edit by hand.
 *
 * Every route that has a Chinese edition, as decided by the prerender that
 * actually built them. Source: dist/data/zh-routes.json, written by
 * scripts/prerender-pages.ts, mirrored into this module by
 * scripts/sync_zh_routes_to_front.mjs.
 *
 * The language toggle and the hreflang emitter both read it, so neither can
 * announce a translation for a route the site never built. Re-run the sync
 * after any build that adds, retires, or translates a route:
 *
 *   npm run build && node scripts/sync_zh_routes_to_front.mjs
 *
 * scripts/check-hreflang.mjs compares this list against the delivered dist
 * route by route, so drift fails the build rather than shipping silently.
 *
 * ${sorted.length} route(s).
 */

export const ZH_ROUTE_PATHS: readonly string[] = [
${sorted.map((route) => `  ${JSON.stringify(route)},`).join("\n")}
];

const ZH_ROUTE_SET: ReadonlySet<string> = new Set(ZH_ROUTE_PATHS);

/** Trailing-slash-insensitive, so /zh/guides/ and /zh/guides both match. */
const normalizeRoute = (path: string): string => (String(path || "").replace(/\\/+$/, "") || "/");

/**
 * True when the site ships a Chinese edition of this exact path.
 *
 * Only two shapes qualify: the two Chinese hubs, and an article whose CMS
 * record carries a translated title + body. A topic channel page
 * (/zh/guides/beginner), a news channel page (/zh/news/industry), and anything
 * on the guides category axis have no Chinese edition and return false.
 */
export function hasGeneratedZhRoute(pathname: string): boolean {
  return ZH_ROUTE_SET.has(normalizeRoute(pathname));
}
`;

writeFileSync(outFile, body, "utf8");
console.log(
  JSON.stringify(
    {
      ok: true,
      routeCount: sorted.length,
      outFile: "src/lib/zhRoutes.generated.ts",
      sample: sorted.slice(0, 5),
    },
    null,
    2,
  ),
);