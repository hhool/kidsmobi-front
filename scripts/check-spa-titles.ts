/**
 * Proves the hydrated SPA and the prerender publish the same <title> and
 * meta description.
 *
 * Every URL on this site can be rendered twice: once as static HTML by
 * scripts/prerender-pages.ts, and once at runtime by src/App.tsx when a visitor
 * lands on it. They used to build titles with two different pieces of code,
 * so /transparency/* and the dataset asset pages shipped WITH the brand suffix
 * in the HTML Google reads and WITHOUT it in the tab a parent sees.
 *
 * This check recomputes what App.tsx would write, using the same shared
 * builders, and compares it against the <title>/<meta description> actually
 * emitted into dist/. It fails loudly if either side stops calling
 * src/lib/documentTitle.ts.
 *
 * Section routes (home/products/reviews/guides/news/about) resolve their
 * title/description from the CMS at runtime (App.tsx resolveCmsRouteSeoConfig
 * -> cmsSettings.seo[alias]), and the prerender now publishes the SAME values
 * through the shared resolver in src/lib/cmsSectionSeo.ts. This check therefore
 * loads the live CMS settings (falling back to the local snapshot the build
 * wrote) and recomputes the section TDK through that shared resolver —
 * catching both a prerender that stops reading CMS and a CMS value that
 * changed since the last build.
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
import { BUYER_FEEDBACK_PATH, buyerFeedbackSeo } from "../src/data/balanceBikeBuyerFeedback";
import { BUDGET_PATH, budgetSeo } from "../src/data/balanceBikeBudget";
import { buildDocumentTitle, buildMetaDescription } from "../src/lib/documentTitle";
import { sanitizeUnsupportedClaims } from "../src/lib/unsupportedClaims";
import { resolveSectionRouteSeo } from "../src/lib/cmsSectionSeo";
import type { CMSSettings } from "../src/types";

type Expectation = { label: string; route: string; title: string; description: string };

const ROOT = process.env.CHECK_SPA_TITLES_ROOT || "dist";
// cwd-relative like the sibling guards and the prerender's snapshot dir.
const SETTINGS_SNAPSHOT = path.resolve("scripts", "cms-snapshots", "settings.json");
const CMS_SETTINGS_ENDPOINT =
  process.env.CMS_SETTINGS_URL || "https://balancebiketoddler.com/api/cms/settings";

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
  { label: "asset buyer feedback", route: BUYER_FEEDBACK_PATH, ...pick(en(buyerFeedbackSeo)) },
  { label: "asset budget", route: BUDGET_PATH, ...pick(en(budgetSeo)) },
];

function pick(seo: { title: string; description: string }) {
  return {
    title: buildDocumentTitle(seo.title),
    description: buildMetaDescription(seo.description, sanitizeUnsupportedClaims),
  };
}

// --- Section routes: recompute the SPA value from the CMS settings ----------
// The SPA resolves these through resolveCmsRouteSeoConfig (pages[].seo >
// settings.seo[alias] > defaultSeo) and publishes via publishSectionTitle /
// publishSectionDescription; the prerender does the same through
// src/lib/cmsSectionSeo.ts. Same functions in, same values out.
const SECTION_ROUTES: Array<{ label: string; seoKey: string; route: string }> = [
  { label: "section home", seoKey: "home", route: "/" },
  { label: "section products", seoKey: "products", route: "/products" },
  { label: "section reviews", seoKey: "reviews", route: "/reviews" },
  { label: "section guides", seoKey: "guides", route: "/guides" },
  { label: "section news", seoKey: "news", route: "/news" },
  { label: "section about", seoKey: "about", route: "/about" },
];

function unwrapCmsSettings(payload: unknown): CMSSettings | null {
  const candidate =
    payload && typeof payload === "object" && Array.isArray((payload as { data?: unknown }).data)
      ? (payload as { data: unknown[] }).data[0]
      : (payload as { data?: unknown } | null)?.data ?? payload;
  if (!candidate || typeof candidate !== "object") return null;
  const settings = candidate as CMSSettings;
  return settings.seo || settings.pages ? settings : null;
}

/** Live CMS first (what the SPA reads at runtime), local snapshot second. */
async function loadCmsSettings(): Promise<{ settings: CMSSettings; source: string } | null> {
  try {
    const response = await fetch(CMS_SETTINGS_ENDPOINT, {
      headers: { Accept: "application/json" },
      redirect: "follow",
    });
    if (response.ok) {
      const settings = unwrapCmsSettings(await response.json());
      if (settings) return { settings, source: "live CMS" };
    }
    console.error(`check:spatitles WARN — live ${CMS_SETTINGS_ENDPOINT} returned HTTP ${response.status}; trying snapshot.`);
  } catch (error) {
    console.error(`check:spatitles WARN — live ${CMS_SETTINGS_ENDPOINT} unreachable (${(error as Error).message}); trying snapshot.`);
  }
  if (existsSync(SETTINGS_SNAPSHOT)) {
    try {
      const settings = unwrapCmsSettings(JSON.parse(readFileSync(SETTINGS_SNAPSHOT, "utf8")));
      if (settings) return { settings, source: `snapshot ${SETTINGS_SNAPSHOT}` };
    } catch {
      // fall through
    }
  }
  return null;
}

async function main() {
  const loaded = await loadCmsSettings();
  if (loaded) {
    for (const section of SECTION_ROUTES) {
      const resolved = resolveSectionRouteSeo(loaded.settings, section.seoKey, "en");
      expectations.push({
        label: section.label,
        route: section.route,
        title: resolved.title,
        description: resolved.description,
      });
    }
    console.log(`check:spatitles — section TDK expectations from ${loaded.source}.`);
  } else {
    console.error(
      "check:spatitles FAIL — could not load CMS settings (live fetch failed and no snapshot at " +
        `${SETTINGS_SNAPSHOT}). Section routes cannot be verified; the last build may have published ` +
        "bundled TDK that the hydrated SPA will overwrite. Restore network access or run `npm run data:settings`.",
    );
    process.exit(1);
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
    console.error(
      "If the CMS values look newer than the build, the CMS changed since `npm run build` ran — " +
        "rerun `npm run data:settings && npm run build`.",
    );
    process.exit(1);
  }

  console.log(`check:spatitles OK — ${checked} pages, SPA and prerender agree on <title> and description`);
}

main();
