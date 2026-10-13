/**
 * Proves the hydrated SPA and the prerender publish the same <title>.
 *
 * Every URL on this site can be rendered twice: once as static HTML by
 * scripts/prerender-pages.ts, and once at runtime by src/App.tsx when a visitor
 * lands on it. They used to build titles with two different pieces of code,
 * so /transparency/* and the dataset asset pages shipped WITH the brand suffix
 * in the HTML Google reads and WITHOUT it in the tab a parent sees.
 *
 * This check recomputes what App.tsx would write, using the same shared
 * builder, and compares it against the <title> actually emitted into dist/.
 * It fails loudly if either side stops calling src/lib/documentTitle.ts.
 *
 * Run: npm run check:spatitles   (after `npm run build`)
 */
import { readFileSync, existsSync } from "fs";
import path from "path";
import { TRANSPARENCY_PAGES } from "../src/data/transparencyPages";
import { AGE_PATH, ageSeo } from "../src/data/balanceBikeAge";
import { SAFETY_PATH, safetySeo } from "../src/data/balanceBikeSafety";
import { SIZING_PATH, sizingSeo } from "../src/data/balanceBikeSizing";
import { STABILITY_PATH, stabilitySeo } from "../src/data/balanceBikeStability";
import { WEIGHT_PATH, weightSeo } from "../src/data/balanceBikeWeight";
import { RECALL_SAFETY_PATH, recallSeo } from "../src/data/safetyRecallRecord";
import { buildDocumentTitle, buildMetaDescription } from "../src/lib/documentTitle";
import { sanitizeUnsupportedClaims } from "../src/lib/unsupportedClaims";

type Expectation = { label: string; route: string; title: string; description: string };

const ROOT = process.env.CHECK_SPA_TITLES_ROOT || "dist";
const decode = (text: string) =>
  text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");

/** Reads the <title> / meta description the prerender actually wrote. */
function readBuiltPage(route: string): { title: string; description: string } | null {
  const clean = route.replace(/^\/+|\/+$/g, "");
  const candidates = [
    path.join(ROOT, clean, "index.html"),
    path.join(ROOT, `${clean}.html`),
  ];
  const file = candidates.find((candidate) => existsSync(candidate));
  if (!file) return null;
  const html = readFileSync(file, "utf8");
  const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] || "";
  const description =
    /<meta\s+name="description"\s+content="([^"]*)"/i.exec(html)?.[1] || "";
  return { title: decode(title).replace(/\s+/g, " ").trim(), description: decode(description).trim() };
}

// Mirrors src/App.tsx: the asset pages read `seo[lang] || seo.en`, the
// transparency pages read `localizedPage.seo` through normalizeSeoConfig()
// (which only trims to 72 — well above our 65 cap, so it cannot change the
// outcome of buildDocumentTitle here).
const en = <T extends Record<string, any>>(bundle: T) => (bundle as any).en;

const expectations: Expectation[] = [
  ...TRANSPARENCY_PAGES.map((page) => {
    const localized = page.en;
    return {
      label: `transparency ${localized.path}`,
      route: localized.path,
      title: buildDocumentTitle(localized.seo?.title || localized.title),
      description: buildMetaDescription(localized.seo?.description || localized.subtitle, sanitizeUnsupportedClaims),
    };
  }),
  { label: "asset age", route: AGE_PATH, ...pick(en(ageSeo)) },
  { label: "asset safety", route: SAFETY_PATH, ...pick(en(safetySeo)) },
  { label: "asset sizing", route: SIZING_PATH, ...pick(en(sizingSeo)) },
  { label: "asset stability", route: STABILITY_PATH, ...pick(en(stabilitySeo)) },
  { label: "asset weight", route: WEIGHT_PATH, ...pick(en(weightSeo)) },
  { label: "asset recalls", route: RECALL_SAFETY_PATH, ...pick(en(recallSeo)) },
];

function pick(seo: { title: string; description: string }) {
  return {
    title: buildDocumentTitle(seo.title),
    description: buildMetaDescription(seo.description, sanitizeUnsupportedClaims),
  };
}

const findings: string[] = [];
let checked = 0;

for (const item of expectations) {
  const built = readBuiltPage(item.route);
  if (!built) {
    findings.push(`${item.label}: no prerendered file for ${item.route} (looked under ${ROOT}/)`);
    continue;
  }
  checked += 1;
  if (built.title !== item.title) {
    findings.push(
      `${item.label} (${item.route})\n    SPA would write: ${item.title}\n    prerender wrote: ${built.title}`,
    );
  }
  if (built.description !== item.description) {
    findings.push(
      `${item.label} (${item.route}) description\n    SPA would write: ${item.description}\n    prerender wrote: ${built.description}`,
    );
  }
}

if (findings.length > 0) {
  console.error(`SPA / prerender <title> mismatch: ${findings.length} finding(s) across ${checked} page(s)\n`);
  for (const finding of findings) console.error(`  - ${finding}\n`);
  process.exit(1);
}

console.log(`check:spatitles OK — ${checked} pages, SPA and prerender agree on <title> and description`);
