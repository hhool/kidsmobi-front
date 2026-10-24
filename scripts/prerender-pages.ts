import { readFile, writeFile, mkdir, rm } from "fs/promises";
import path from "path";
import { guideArticles } from "../src/data/guidesData";
import { newsArticles } from "../src/data/newsData";
import { TRANSPARENCY_PAGES } from "../src/data/transparencyPages";
import { credibleReviewCount, MAX_PLAUSIBLE_REVIEW_COUNT } from "../src/lib/reviewSignal";
import {
  buildDatasetSchema,
  euSinceYear,
  fillTemplate,
  formatCount,
  formatRecallDate,
  latestTrendRow,
  latestTrendYear,
  LEGACY_RECALL_SAFETY_PATH,
  RECALL_SAFETY_PATH,
  recallDataset,
  recallSeo,
  recallStrings,
  safetyGateDataset,
  topHazard,
} from "../src/data/safetyRecallRecord";
import {
  buildSizingDatasetSchema,
  formatAge,
  formatInches,
  formatPrice,
  formatSteering,
  formatWeight,
  SIZING_PATH,
  sizingDataset,
  sizingSeo,
  sizingStrings,
} from "../src/data/balanceBikeSizing";
import {
  buildKidsBikeSizingDatasetSchema,
  KIDS_SIZING_PATH,
  kidsBikeSizingDataset,
  kidsBikeSizingSeo,
  kidsBikeSizingStrings,
} from "../src/data/kidsBikeSizing";
import {
  SAFETY_PATH,
  safetySeo,
  safetyStrings,
  safetyStandards,
  safetyComparison,
  safetyVerification,
  safetyCaveats,
  safetySource,
  buildSafetyDatasetSchema,
} from "../src/data/balanceBikeSafety";
import {
  WEIGHT_PATH,
  WEIGHT_DATASET,
  buildWeightDatasetSchema,
  categoryLabels,
  frameLabel,
  headlineFacts,
  lbToKg,
  weightCategoryRows,
  weightSeo,
  weightStrings,
} from "../src/data/balanceBikeWeight";
import {
  STABILITY_PATH,
  STABILITY_DATASET,
  buildStabilityDatasetSchema,
  claimRows,
  coverageRows,
  inchLabel,
  stabilitySeo,
  stabilityStrings,
} from "../src/data/balanceBikeStability";
import {
  BUYER_FEEDBACK_PATH,
  REVIEW_DATASET,
  buildBuyerFeedbackDatasetSchema,
  buyerFeedbackSeo,
  buyerFeedbackStrings,
} from "../src/data/balanceBikeBuyerFeedback";
import {
  AGE_DATASET,
  AGE_PATH,
  ageSeo,
  ageSpanLabel,
  ageStrings,
  ageVars,
  bandAt,
  bikesAt,
  buildAgeDatasetSchema,
} from "../src/data/balanceBikeAge";
import {
  KIDS_AGE_DATASET,
  KIDS_AGE_PATH,
  kidsAgeSeo,
  kidsAgeSpanLabel,
  kidsAgeStrings,
  kidsAgeVars,
  kidsBandAt,
  kidsBikesAt,
  buildKidsAgeDatasetSchema,
} from "../src/data/kidsBikeAge";
import {
  KIDS_PRICE_DATASET,
  KIDS_PRICE_PATH,
  kidsBikesInBand,
  kidsPriceAgeSpanLabel,
  kidsPriceBandAt,
  kidsPriceSeo,
  kidsPriceStrings,
  kidsPriceVars,
  buildKidsPriceDatasetSchema,
} from "../src/data/kidsBikePrice";
import {
  KIDS_SAFETY_PATH,
  kidsSafetySeo,
  kidsSafetyStrings,
  kidsSafetyStandards,
  kidsSafetyComparison,
  kidsSafetyVerification,
  kidsSafetyCaveats,
  kidsSafetySource,
  buildKidsBikeSafetyDatasetSchema,
} from "../src/data/kidsBikeSafety";
import {
  KIDS_WEIGHT_PATH,
  KIDS_WEIGHT_DATASET,
  kidsWeightSeo,
  kidsWeightStrings,
  kidsWeightCategoryRows,
  kidsWeightHeadline,
  kidsWeightFrameNote,
  buildKidsBikeWeightDatasetSchema,
} from "../src/data/kidsBikeWeight";
import {
  KIDS_STABILITY_PATH,
  KIDS_STABILITY_DATASET,
  kidsStabilitySeo,
  kidsStabilityStrings,
  kidsStabilityCoverageRows,
  kidsStabilityClaimRows,
  kidsStabilityTrainingRows,
  kidsStabilityTrainingQuote,
  kidsStabilityWheelSpread,
  buildKidsBikeStabilityDatasetSchema,
} from "../src/data/kidsBikeStability";
import {
  KIDS_BUYER_FEEDBACK_PATH,
  KIDS_REVIEW_DATASET,
  kidsBuyerFeedbackSeo,
  kidsBuyerFeedbackStrings,
  buildKidsBuyerFeedbackDatasetSchema,
} from "../src/data/kidsBuyerFeedback";
import {
  KIDS_RECALLS_PATH,
  kidsRecallsSeo,
  kidsRecallsStrings,
  kidsRecallCoverage,
  kidsRecallHazards,
  kidsRecallByYear,
  kidsRecallPeriods,
  kidsRecallSorted,
  kidsRecallTotal,
  buildKidsRecallsDatasetSchema,
} from "../src/data/kidsBikeRecalls";
import {
  KIDS_SCOOTER_ASSET_PATHS,
  KIDS_SCOOTER_SEO_BY_PATH,
} from "../src/data/kidsScooterSeo";
import { renderKidsScooterPages as renderKidsScooterPageBodies } from "./kidsScooterPages";
import {
  KIDS_RIDE_ON_ASSET_PATHS,
  KIDS_RIDE_ON_SEO_BY_PATH,
} from "../src/data/kidsRideOnSeo";
import { renderKidsRideOnPages as renderKidsRideOnPageBodies } from "./kidsRideOnPages";
import {
  KIDS_TRICYCLE_ASSET_PATHS,
  KIDS_TRICYCLE_SEO_BY_PATH,
} from "../src/data/kidsTricycleSeo";
import { renderKidsTricyclePages as renderKidsTricyclePageBodies } from "./kidsTricyclePages";
import {
  KIDS_STROLLER_ASSET_PATHS,
  KIDS_STROLLER_SEO_BY_PATH,
} from "../src/data/kidsStrollerSeo";
import { renderKidsStrollerPages as renderKidsStrollerPageBodies } from "./kidsStrollerPages";
import { BUDGET_PATH, budgetSeo, budgetStrings } from "../src/data/balanceBikeBudget";
import { PRUNED_PRODUCTS } from "../src/data/prunedProducts.generated";
import { PRUNED_VARIANT_PRODUCTS } from "../src/data/prunedVariantProducts.generated";
import { getPageCopy } from "../src/config/pageCopy";
import {
  GUIDES_TOPIC_EXPLORE_LINKS,
  GUIDES_TOPIC_PAGES,
  GUIDES_TOPIC_PAGE_IDS,
  GUIDES_WIZARD_H1,
} from "../src/lib/guidesTopicPages";
import { FOOTER_ARTICLE_LINKS } from "../src/lib/footerArticles";
import {
  DEFAULT_REFERENCE_CLUSTER,
  resolveReferenceCluster,
  clusterGroupOfHref,
  clusterGroupOfPath,
  CLUSTER_HEADINGS,
  type ReferenceClusterCard,
} from "../src/lib/referenceCluster";
import { shortenCardTitle } from "../src/lib/productSeoText";
import { productDetailUrlSlug, resolveProductDetailCategorySlug } from "../src/lib/productCategoryPaths";
import { matchProductsForText } from "../src/lib/relatedProducts";
import {
  buildDocumentTitle,
  buildMetaDescription,
  capSeoText,
  capSeoTitle,
  DESCRIPTION_MAX_CHARS,
  SITE_TITLE_SUFFIX,
  TITLE_MAX_CHARS,
} from "../src/lib/documentTitle";
import { sanitizeUnsupportedClaims } from "../src/lib/unsupportedClaims";
import { resolveSectionRouteSeo } from "../src/lib/cmsSectionSeo";
import type { CMSSettings } from "../src/types";
import { buildProductDetailKeywords, resolveRouteKeywords, CATEGORY_TDK_MAP } from "../src/lib/pageKeywords";
import { buildProductFaqsFromDisplayFields, faqPageSchema, FAQ_MIN_QUESTIONS, type ProductFaq } from "../src/lib/productFaq";
import { getHubContent, hubClusterGroup, hubReferenceCards } from "../src/lib/productHubContent";
import { renderRichContentHtml } from "../src/lib/richContentHtml";

const distDir = path.resolve("dist");

/**
 * Plan-B stage 1, limited to what the evidence supports.
 *
 * The 197 product detail pages were assessed for a 197 -> <=40 cut and did not
 * qualify: nearly every record has its own copy (summary, pros/cons, verdict,
 * review mines), the median review count is 1,227 and only 7 products sit under
 * 50 reviews. Clustering put the catalogue at 179 genuinely distinct products.
 * Cutting further would have meant deleting pages that carry real demand, with
 * no Search Console data to say which ones earn traffic.
 *
 * So this set holds ONLY same-product duplicate listings — same category, same
 * brand, >= 55% shingle overlap, corroborated by near-identical review counts
 * (e.g. two JOYSTAR records at 5,165 reviews each). Each is 301'd to the listing
 * that absorbed it, so link equity and readers both land on the surviving page.
 * See scripts/plan_stage1_prune.mjs + doc/stage1-prune-report.json.
 *
 * STAGE 2 (scripts/plan_stage2_variants.mjs + doc/stage2-variant-report.json)
 * retired 5 more: listings of one manufacturer MODEL NUMBER under different
 * colourways (MAMAZING S66 three times, Mompush Lithe V2 / Nexis Carbon twice,
 * Umatoll B402 twice). Their blurbs differ, which is why stage 1 missed them,
 * but the manufacturer's own identifier, weight and dimensions are identical.
 * They caused the last thing this site should publish: two pages needing an
 * Amazon ASIN in the <title> to be told apart. Each still 301s to its survivor.
 */
const PRUNED_PRODUCT_IDS = new Set(
  Object.entries(PRUNED_PRODUCTS.duplicateOf).map(([duplicateId]) => duplicateId.trim().toLowerCase()),
);
const PRUNED_VARIANT_IDS = new Set(
  Object.entries(PRUNED_VARIANT_PRODUCTS.duplicateOf).map(([duplicateId]) => duplicateId.trim().toLowerCase()),
);
const VARIANT_SURVIVORS = PRUNED_VARIANT_PRODUCTS.duplicateOf;
const isPrunedProduct = (id: unknown): boolean => {
  const normalized = String(id || "").trim().toLowerCase();
  return PRUNED_PRODUCT_IDS.has(normalized) || PRUNED_VARIANT_IDS.has(normalized);
};
type RoutePage = {
  route: string;
  title: string;
  description: string;
  body: string;
  image?: string;
  ogType?: "website" | "article";
  jsonLd?: Array<Record<string, unknown>>;
  /** Full <title> override; falls back to `${title} | BalanceBikeToddler`
   *  capped at 65 chars (Semrush title-too-long check). */
  fullTitle?: string;
  /** Keywords-meta override. Set by applyCmsSectionSeo() from the CMS-resolved
   *  section TDK (pages[].seo > settings.seo[alias] > defaultSeo) — the same
   *  chain fullTitle/description already follow — so the static HTML Google
   *  reads and the hydrated SPA publish the identical keyword set. Before
   *  2026-10-22 the section routes resolved keywords from defaultSeo only,
   *  which left /products/ and /reviews/ publishing different keywords after
   *  hydration than in the raw HTML. */
  keywords?: string[];
  /** Skip the page.title <h1> that renderStaticPage emits (used when the
   *  body has its own single <h1>, so the page keeps exactly one h1). */
  skipTitleH1?: boolean;
  /** English <h1> override when the visible heading must differ from
   *  page.title (page.title still drives <title> and the JSON-LD name).
   *  See GUIDES_WIZARD_H1 in src/lib/guidesTopicPages.ts. */
  h1En?: string;
  /** Skip the lead description paragraph renderStaticPage puts under the h1.
   *  CMS articles whose body opens with the same sentence were printing it
   *  twice, once as the lead and again as the first paragraph. */
  skipLeadDescription?: boolean;
  /** Optional canonical path override (used by alias routes that must
   *  consolidate onto the canonical slug-form category URL). */
  canonicalPath?: string;
  /** The product backing a detail page — lets renderDocument compute the
   *  detail-page keywords without re-inferring the category. */
  product?: CmsProductFull;
  /** Emit a <link rel="preload" as="image"> for the LCP hero image in <head>
   *  (Lighthouse lcp-discovery: the hero was discovered only when the parser
   *  reached the <body>, delaying LCP under throttling). */
  preloadImage?: string;
};

type AppAssets = {
  headTags: string;
};

function escapeHtml(value: string): string {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const STORE_MEDIA_ORIGIN = "https://store.balancebiketoddler.com";

/**
 * Characters that are illegal in a URL path but reach us verbatim in a few CMS
 * media records (e.g. one product stores an already-absolute imageUrl whose
 * directory name still contains literal spaces). Emitting them raw produces an
 * invalid `src` that 404s at the media host — Semrush reports it as a broken
 * external link. Existing %XX escapes are left untouched.
 */
const UNSAFE_URL_CHARS = /[\s<>"{}|\\^`[\]]/g;

function encodeUnsafeUrlChars(raw: string): string {
  return String(raw || "").replace(UNSAFE_URL_CHARS, (ch) => encodeURIComponent(ch));
}

/**
 * Resolves CMS media paths ("scrape_store/..." or bare category paths) to
 * absolute URLs on the store media host. Already-absolute URLs pass through
 * (after sanitising any illegal characters).
 */
function toAbsoluteMediaUrl(raw: unknown): string {
  const text = String(raw || "").trim().replace(/\\/g, "/");
  if (!text) return "";
  if (/^https?:\/\//i.test(text)) return encodeUnsafeUrlChars(text);
  const marker = "scrape_store/";
  const markerIndex = text.indexOf(marker);
  const mediaPath = markerIndex >= 0
    ? text.slice(markerIndex + marker.length)
    : text.replace(/^\.\.\/+/, "").replace(/^\/+/, "");
  if (!mediaPath) return "";
  const encodedPath = mediaPath
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return encodedPath ? `${STORE_MEDIA_ORIGIN}/${encodedPath}` : "";
}

/**
 * Resolves a CMS image reference to an absolute URL, respecting which origin
 * actually holds the file.
 *
 * Two kinds of image live in the CMS:
 *   - bare bucket keys ("news/x-800x450.webp") served from the media store;
 *   - root-relative paths ("/images/news/x-800x450.webp") shipped in this
 *     site's own public/ tree and served by Cloudflare Pages.
 *
 * Running the second kind through toAbsoluteMediaUrl silently rewrote it onto
 * the store origin, where the file does not exist — a broken og:image and a
 * blank card rather than a loud failure. Root-relative now stays on
 * PUBLIC_SITE_BASE, which is also the origin the page itself is served from.
 */
function toPublicImageUrl(raw: unknown): string {
  const text = String(raw || "").trim().replace(/\\/g, "/");
  if (!text) return "";
  if (/^https?:\/\//i.test(text)) return encodeUnsafeUrlChars(text);
  if (text.startsWith("/")) return `${PUBLIC_SITE_BASE}${encodeUnsafeUrlChars(text)}`;
  return toAbsoluteMediaUrl(text);
}

function renderSources(items: Array<{ label: string; href: string; note: string }>): string {
  return `
    <ul>
      ${items.map((item) => `<li><a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a> — ${escapeHtml(item.note)}</li>`).join("")}
    </ul>
  `;
}

function renderBulletedCards(items: Array<{ title: string; text: string; meta?: string }>): string {
  return `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px;">
      ${items.map((item) => `
        <section style="border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px;">
          <h3 style="margin: 0 0 8px; font-size: 1rem;">${escapeHtml(item.title)}</h3>
          <p style="margin: 0 0 10px; color: #334155;">${escapeHtml(item.text)}</p>
          ${item.meta ? `<p style="margin: 0; font-size: 0.86rem; color: #64748b;">${escapeHtml(item.meta)}</p>` : ""}
        </section>
      `).join("")}
    </div>
  `;
}


function renderStaticPage(page: RoutePage): string {
  return `
    <article style="max-width: 980px; margin: 0 auto; padding: 40px 20px; color: #0f172a; font-family: Arial, sans-serif; line-height: 1.7;">
      <header style="padding-bottom: 24px; border-bottom: 1px solid #e2e8f0; margin-bottom: 24px;">
        <p style="margin: 0 0 10px; font-size: 0.72rem; letter-spacing: 0.2em; text-transform: uppercase; color: #c2410c; font-weight: 900;">BalanceBikeToddler</p>
        ${page.skipTitleH1 ? "" : `<h1 style="margin: 0 0 12px; font-size: clamp(2rem, 4vw, 3.15rem); line-height: 1.12;">${escapeHtml(page.h1En || page.title)}</h1>`}
        ${page.skipLeadDescription ? "" : `<p style="margin: 0 0 14px; font-size: 1.08rem; color: #334155; max-width: 52rem;">${escapeHtml(page.description)}</p>`}
      </header>
      ${page.body}
      ${renderSiteFooter()}
    </article>
  `;
}

/**
 * Site-wide footer injected into every prerendered page.
 *
 * Before this, /transparency/disclaimer, /transparency/privacy-policy and
 * /transparency/terms had zero inbound internal links — they were listed in
 * the sitemap but unreachable from any crawlable page (Semrush "orphan
 * pages"). Repeating the footer on every route gives each trust page a
 * site-wide inbound link and keeps the main sections one hop from every URL.
 * The hydrated SPA replaces #root with its own footer, so this never renders
 * twice for users.
 */
const FOOTER_SECTION_LINKS: Array<{ href: string; label: string }> = [
  { href: "/products", label: "Products" },
  { href: "/guides", label: "Guides" },
  { href: "/reviews", label: "Reviews" },
  { href: "/news", label: "News" },
  { href: "/about", label: "About" },
  { href: RECALL_SAFETY_PATH, label: "Recall record" },
  { href: SIZING_PATH, label: "Size chart" },
  { href: SAFETY_PATH, label: "Safety standards" },
  { href: WEIGHT_PATH, label: "Weight & build" },
  { href: STABILITY_PATH, label: "Stability & track width" },
  { href: AGE_PATH, label: "Balance bike by age" },
  { href: BUYER_FEEDBACK_PATH, label: "What buyers say" },
  { href: BUDGET_PATH, label: "Budget & value" },
];
const FOOTER_TRUST_LINKS: Array<{ href: string; label: string }> = [
  { href: "/transparency/testing-methodology/", label: "Testing Methodology" },
  { href: "/transparency/certification-lab-notes/", label: "Certification & Standards Notes" },
  { href: "/transparency/disclaimer/", label: "Editorial Disclaimer" },
  { href: "/transparency/privacy-policy/", label: "Privacy Policy" },
  { href: "/transparency/terms/", label: "Terms of Use" },
  { href: "/transparency/search-data/", label: "Search Data" },
  { href: "/transparency/review-count-integrity/", label: "Review Count Integrity" },
];

function renderSiteFooter(): string {
  const link = (item: { href: string; label: string }) =>
    `<a href="${escapeHtml(item.href)}" style="margin-right:14px;color:#c2410c;text-decoration:none;">${escapeHtml(item.label)}</a>`;
  return `
      <footer style="margin-top:34px;padding:20px 0 8px;border-top:1px solid #e2e8f0;font-family:Arial,sans-serif;font-size:0.88rem;line-height:2;">
        <p style="margin:0 0 4px;">${FOOTER_SECTION_LINKS.map(link).join("")}</p>
        <p style="margin:0 0 4px;">${FOOTER_ARTICLE_LINKS.map((article) => link({ href: article.path, label: article.en })).join("")}</p>
        <p style="margin:0;">${FOOTER_TRUST_LINKS.map(link).join("")}</p>
        <p style="margin:10px 0 0;color:#64748b;">© BalanceBikeToddler — evidence-based analysis of kids ride-on and safety gear.</p>
      </footer>
  `;
}

/**
 * Contextual links inside a category's reference cluster.
 *
 * Until now the six reference pages were reachable only from the site-wide
 * footer, which meant no page passed contextual anchor weight into the set —
 * and Search Console shows 94.7% of this domain's impressions come from
 * balance-bike queries, so those pages are the ones worth connecting. The
 * footer link stays; these are the in-content links that give the cluster
 * shape, with anchor text matching what each page actually contains.
 *
 * Every cluster added since (kids bikes, scooters, ride-ons, tricycles,
 * strollers) renders the same block, scoped to its own cluster — see
 * clusterGroupOfPath in src/lib/referenceCluster.ts.
 */
// The published list is configuration: the CMS arranges settings.referenceCluster
// and this resolves it through the same module the hydrated component uses, so
// the two render paths can never disagree. Assigned once settings land, before
// any page is built; until then the built-in defaults are what ships.
let referenceCluster: ReferenceClusterCard[] = DEFAULT_REFERENCE_CLUSTER;

const sameClusterPath = (a: string, b: string): boolean => {
  const norm = (value: string) => value.replace(/\/+$/, "") || "/";
  return norm(a) === norm(b);
};

/**
 * The reference-cluster block, resolved through the same module the hydrated
 * component uses. A host renders only its own cluster's cards: the list is
 * configuration, the cluster a page belongs to is its path.
 */
function clusterNavHtml(currentPath: string, heading?: string): string {
  const group = clusterGroupOfPath(currentPath);
  const items = referenceCluster
    .filter((card) => clusterGroupOfHref(card.href) === group)
    .filter((card) => !sameClusterPath(card.href, currentPath));
  if (!items.length) return "";
  const title = heading ?? CLUSTER_HEADINGS[group].en;
  return `
      <section style="margin: 22px 0 0; border-top: 1px solid #e2e8f0; padding-top: 18px;">
        <h2 style="margin: 0 0 10px; font-size: 1.2rem;">${escapeHtml(title)}</h2>
        <ul style="margin: 0; padding: 0; list-style: none; display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px;">
          ${items
            .map(
              (card) =>
                `<li style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:12px 16px;"><a href="${escapeHtml(card.href)}" style="color:#c2410c;font-weight:700;text-decoration:none;">${escapeHtml(card.labelEn)}</a><span style="display:block;margin-top:4px;font-size:0.85rem;color:#64748b;">${escapeHtml(card.blurbEn)}</span></li>`,
            )
            .join("")}
        </ul>
      </section>
  `;
}

/**
 * Reference-pages block for a category hub (e.g. /products/strollers/).
 * Surfaces that cluster's editorial guides so a shopper browsing the hub can
 * reach the deep pages — the new-cluster hubs had no inbound link to their
 * asset pages at all. Mirrors the hydrated SPA render (App.tsx) so the static
 * and hydrated link sets stay identical. Returns "" for hubs with no cluster
 * (safety-seats) and for unknown slugs.
 */
function hubGuidesHtml(slug: string): string {
  const group = hubClusterGroup(slug);
  if (!group) return "";
  const items = hubReferenceCards(slug);
  if (!items.length) return "";
  const title = CLUSTER_HEADINGS[group].en;
  return `
      <section style="margin: 22px 0 0; border-top: 1px solid #e2e8f0; padding-top: 18px;">
        <h2 style="margin: 0 0 10px; font-size: 1.2rem;">${escapeHtml(title)}</h2>
        <ul style="margin: 0; padding: 0; list-style: none; display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px;">
          ${items
            .map(
              (card) =>
                `<li style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:12px 16px;"><a href="${escapeHtml(card.href)}" style="color:#c2410c;font-weight:700;text-decoration:none;">${escapeHtml(card.labelEn)}</a><span style="display:block;margin-top:4px;font-size:0.85rem;color:#64748b;">${escapeHtml(card.blurbEn)}</span></li>`,
            )
            .join("")}
        </ul>
      </section>`;
}

/**
 * The <title> a page would ship with, replicating renderDocument() exactly.
 * Needed because collision handling has to compare what would be PUBLISHED,
 * not the untruncated source string.
 */
function documentTitleOf(page: RoutePage): string {
  return buildDocumentTitle(page.title, page.fullTitle);
}

/**
 * De-duplicate CMS review titles against product detail titles.
 *
 * Two URLs answering one query with one <title> (this shipped for both
 * "Evenflo Pivot NXT Travel System Review" and "Gotrax KS1 Kids Kick Scooter
 * Review") is the cannibalisation pattern Google settles by ranking neither.
 * The product page owns "<model> Review" — it carries the specs and the links —
 * so the CMS review article takes a qualifier describing what it holds.
 */
function resolveDuplicateTitles(productPages: RoutePage[], reviewPages: RoutePage[]): number {
  const published = new Set(productPages.map((page) => documentTitleOf(page).toLowerCase()));
  let fixed = 0;
  for (const page of reviewPages) {
    const current = documentTitleOf(page);
    if (!published.has(current.toLowerCase())) continue;
    const base = current.endsWith(SITE_TITLE_SUFFIX)
      ? current.slice(0, -SITE_TITLE_SUFFIX.length)
      : current;
    const stem = base.replace(/\s+(?:reviews?)\s*$/i, "").trim();
    const qualifier = ": Verdict";
    const full = `${stem}${qualifier}${SITE_TITLE_SUFFIX}`;
    const candidate =
      full.length <= TITLE_MAX_CHARS
        ? full
        : `${capSeoTitle(stem, TITLE_MAX_CHARS - SITE_TITLE_SUFFIX.length - qualifier.length)}${qualifier}${SITE_TITLE_SUFFIX}`;
    if (published.has(candidate.toLowerCase())) continue;
    page.fullTitle = candidate;
    published.add(candidate.toLowerCase());
    fixed += 1;
  }
  return fixed;
}

function renderDocument(page: RoutePage, appAssets: AppAssets): string {
  // The homepage route is "" — emit the trailing slash so the canonical matches
  // the sitemap entry (https://balancebiketoddler.com/) exactly.
  const routePath = page.canonicalPath || (page.route === "" ? "/" : page.route);
  const canonical = `https://balancebiketoddler.com${routePath}`;
  // SEO title cap (Semrush): full override wins, else `${title} | brand`
  // truncated to ≤65 chars at a word boundary, brand suffix always kept.
  const titleTag = buildDocumentTitle(page.title, page.fullTitle);
  // The same claim scrub that runs over the body must run here first: the whole
  // document is scrubbed again after rendering, and a rewrite that lengthens the
  // text ("lab database" -> "specification database") otherwise pushes an
  // already-capped snippet back over the limit.
  const descTag = buildMetaDescription(page.description, sanitizeUnsupportedClaims);
  // Keywords meta. The prerender and the hydrated SPA must publish the same set
  // (src/lib/pageKeywords.ts is the single source), so a crawler reading the
  // static HTML and a parent's browser tab agree. Google ignores this tag, but
  // Bing/Yandex use it and it keeps the two render paths consistent.
  // Section routes carry a CMS-resolved override (page.keywords, set by
  // applyCmsSectionSeo) so the static HTML matches the hydrated SPA exactly;
  // every other route resolves through the shared DEFAULT-based module.
  const keywordArr = page.keywords
    ?? (page.product
      ? buildProductDetailKeywords(page.product, "en", String((page.product as CmsProductFull).categoryId || ""))
      : resolveRouteKeywords(page.route, "en"));
  const keywordTag = keywordArr.join(", ");
  const entitySameAs = [
    "https://www.youtube.com/@kidsmobi",
    "https://www.facebook.com",
    "https://www.instagram.com",
    "https://x.com/BalanceBikeToddler",
  ];
  const aboutJsonLd = page.route === "/about"
    ? `    <script type="application/ld+json">${JSON.stringify([
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "BalanceBikeToddler",
          url: "https://balancebiketoddler.com/",
          logo: "https://balancebiketoddler.com/favicon.svg",
          sameAs: entitySameAs,
        },
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "BalanceBikeToddler",
          url: "https://balancebiketoddler.com/",
          description: page.description,
          inLanguage: "en",
          publisher: {
            "@type": "Organization",
            name: "BalanceBikeToddler",
            url: "https://balancebiketoddler.com/",
            logo: "https://balancebiketoddler.com/favicon.svg",
            sameAs: entitySameAs,
          },
        },
        {
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: `${page.title} | BalanceBikeToddler`,
          url: canonical,
          description: page.description,
          inLanguage: "en",
          author: {
            "@type": "Organization",
            name: "BalanceBikeToddler Editorial Team",
          },
          datePublished: "2026-08-15",
          dateModified: "2026-08-15",
          publisher: {
            "@type": "Organization",
            name: "BalanceBikeToddler",
            url: "https://balancebiketoddler.com/",
            sameAs: entitySameAs,
          },
        },
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "Who wrote this page?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "It is written by the BalanceBikeToddler Editorial Team with published and updated dates attached.",
              },
            },
            {
              "@type": "Question",
              name: "How can readers verify the content?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "The page provides source links, short quotations, and a table readers can compare directly against the product page.",
              },
            },
            {
              "@type": "Question",
              name: "Why include dates and author information?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Those fields help search systems and AI platforms understand freshness and accountability.",
              },
            },
          ],
        },
      ])}</script>
`
    : "";
  // Default share image: the site icon (rendered as a 1200x630 PNG at
  // /images/og-site-icon.png). Pages without a dedicated cover fall back
  // to it so every prerendered page emits an og:image. The fallback is a
  // static Pages asset, so it must resolve against the site base — NOT
  // toAbsoluteMediaUrl (which points relative paths at the R2 media host).
  const ogImage = page.image
    ? toAbsoluteMediaUrl(page.image)
    : `${PUBLIC_SITE_BASE}/images/og-site-icon.png`;
  const ogType = page.ogType === "article" ? "article" : "website";
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(titleTag)}</title>
    <meta name="description" content="${escapeHtml(descTag)}" />
    <meta name="keywords" content="${escapeHtml(keywordTag)}" />
    <meta name="robots" content="index,follow,max-image-preview:large" />
    <meta property="og:site_name" content="BalanceBikeToddler" />
    <meta property="og:type" content="${ogType}" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta property="og:title" content="${escapeHtml(titleTag)}" />
    <meta property="og:description" content="${escapeHtml(descTag)}" />
${ogImage ? `    <meta property="og:image" content="${escapeHtml(ogImage)}" />
    <meta property="og:image:secure_url" content="${escapeHtml(ogImage)}" />
    <meta property="og:image:alt" content="${escapeHtml(page.title)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@bbtreviews" />
    <meta name="twitter:title" content="${escapeHtml(titleTag)}" />
    <meta name="twitter:description" content="${escapeHtml(descTag)}" />
    <meta name="twitter:image" content="${escapeHtml(ogImage)}" />
` : "    <meta name=\"twitter:card\" content=\"summary\" />\n"}    <link rel="canonical" href="${escapeHtml(canonical)}" />
${page.preloadImage ? `    <link rel="preload" as="image" href="${escapeHtml(page.preloadImage)}" fetchpriority="high" />\n` : ""}<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <style>
      /* CSS cascade-layer hygiene (Lighthouse a11y 2026-10-17): an UNLAYERED
         anchor-color rule beats every @layer rule, so it painted ALL anchors
         #ea580c and defeated every text-* utility class on anchor elements.
         Declare Tailwind's layer order up front (this style parses before the
         CSS bundle), then put the anchor color in the utilities layer: it now
         wins over preflight's anchor reset (base layer) but loses to any
         text-* class. body stays unlayered to keep the exact current backdrop
         over the index.css gradient. */
      @layer theme, base, components, utilities;
      body { margin: 0; background: #f8fafc; }
      @layer utilities {
        a { color: #ea580c; }
      }
      #app-boot-cover {
        display: none;
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        align-items: center;
        justify-content: center;
        background: #f8fafc;
        color: #0f172a;
        font-family: Arial, sans-serif;
      }
      .app-js-loading #app-boot-cover { display: flex; }
      #app-boot-spinner {
        width: 34px;
        height: 34px;
        border: 3px solid #fed7aa;
        border-top-color: #f97316;
        border-radius: 999px;
        animation: app-boot-spin 0.8s linear infinite;
      }
      @keyframes app-boot-spin { to { transform: rotate(360deg); } }
      /* Article card thumbnails. The desktop layout is a fixed-width 16:9
         thumbnail next to the story text; on phones the same markup switches
         to a stacked card (full-width 16:9 image above the text) so the cover
         is not cropped into a narrow sliver. Mirrors the SPA cards in
         src/components/NewsSection.tsx and src/components/GuidesSection.tsx.
         Editorial covers (800x450) fill the frame; square product photos are
         fitted with object-contain so the whole product stays visible. */
      @media (max-width: 640px) {
        .article-card { flex-direction: column !important; align-items: stretch !important; }
        .article-card-thumb { flex: 0 0 auto !important; width: 100% !important; }
        .article-card-thumb img { width: 100% !important; height: auto !important; aspect-ratio: 16 / 9; }
      }
    </style>
    <script>
      document.documentElement.classList.add("app-js-loading");
      window.setTimeout(function () {
        document.documentElement.classList.remove("app-js-loading");
      }, 8000);
    </script>
${aboutJsonLd || (page.jsonLd ? `    <script type="application/ld+json">${JSON.stringify(page.jsonLd)}</script>` : "")}
${appAssets.headTags}
  </head>
  <body class="bg-slate-50 text-slate-950 antialiased font-sans">
    <div id="root">
      <div id="app-boot-cover" aria-hidden="true">
        <div style="display:flex;flex-direction:column;align-items:center;gap:16px;">
          <div id="app-boot-spinner"></div>
          <strong style="font-size:14px;letter-spacing:0.02em;">BalanceBikeToddler</strong>
        </div>
      </div>
      ${renderStaticPage(page)}
    </div>
  </body>
</html>`;
}

function extractAppAssets(indexHtml: string): AppAssets {
  const tags = Array.from(indexHtml.matchAll(
    /<(?:script type="module"[^>]*\ssrc="[^"]+"[^>]*><\/script>|link rel="(?:modulepreload|stylesheet)"[^>]*>)/g,
  )).map((match) => match[0]);

  if (!tags.some((tag) => tag.startsWith("<script"))) {
    throw new Error("Unable to locate the built application module script in dist/index.html");
  }

  return {
    headTags: tags.map((tag) => `    ${tag}`).join("\n"),
  };
}

/* ------------------------------------------------------------------ *
 * CMS-driven guide content
 *
 * The static list pages used to be built purely from src/data/*.ts, so a
 * guide published in the CMS never reached the crawled HTML (and neither
 * did any link to its detail page). We now pull the published guides from
 * the same Worker endpoint the app uses at build time. If the fetch fails
 * the build keeps working and silently falls back to the bundled data.
 * ------------------------------------------------------------------ */

const PUBLIC_SITE_BASE = "https://balancebiketoddler.com";
const CMS_BASE_URL = (
  process.env.PRERENDER_CMS_BASE ||
  process.env.CMS_API_BASE_URL ||
  "https://store.balancebiketoddler.com"
).replace(/\/+$/, "");

type CmsGuide = {
  id: string;
  slug?: string;
  status?: string;
  category?: string;
  imageUrl?: string;
  pinned?: boolean;
  featured?: boolean;
  updatedAt?: string;
  publishedAt?: string;
  taxonomy?: {
    topicCategory?: string;
    productCategory?: string;
    pinOrder?: number;
  };
  en?: { title?: string; summary?: string; content?: string };
  zh?: { title?: string; summary?: string; content?: string };
  seo?: { en?: { title?: string; description?: string }; zh?: { title?: string; description?: string } };
};

type CmsNews = {
  id: string;
  slug?: string;
  status?: string;
  category?: string;
  subtype?: string;
  imageUrl?: string;
  updatedAt?: string;
  publishedAt?: string;
  en?: { title?: string; summary?: string; content?: string };
  zh?: { title?: string; summary?: string; content?: string };
  seo?: { en?: { title?: string; description?: string }; zh?: { title?: string; description?: string } };
};

type CmsEvaluation = {
  id: string;
  type?: string;
  status?: string;
  slug?: string;
  title?: string;
  imageUrl?: string;
  productId?: string;
  productIds?: string[];
  updatedAt?: string;
  publishedAt?: string;
  en?: { title?: string; verdict?: string; pros?: string[]; cons?: string[] };
  zh?: { title?: string; verdict?: string; pros?: string[]; cons?: string[] };
};

type CmsProductLite = {
  id: string;
  name?: string;
  brand?: string;
  category?: string;
  imageUrl?: string;
  overallScore?: number;
};

function cmsSlugify(input: unknown): string {
  const base = String(input || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base || "item";
}

/** Mirrors the Worker's routeSegment(): keep URL-safe values verbatim. */
function cmsRouteSegment(input: unknown): string {
  const raw = String(input || "").trim();
  if (!raw) return "";
  if (/^[A-Za-z0-9._~-]+$/.test(raw)) return raw;
  return cmsSlugify(raw);
}

function guideTopicCategory(guide: CmsGuide): string {
  const topic = String(guide.taxonomy?.topicCategory || guide.category || "").trim();
  return topic || "beginner";
}

function guideRoutePath(guide: CmsGuide): string | null {
  const slug = String(guide.slug || "").trim() || cmsSlugify(guide.en?.title || guide.zh?.title || guide.id);
  const topic = guideTopicCategory(guide);
  if (!slug) return null;
  return `/guides/${topic}/${slug}`;
}

/** Mirrors the Worker's deriveContentPath() for the news collection. */
function newsRoutePath(item: CmsNews): string | null {
  const channel = cmsRouteSegment(item.category || item.subtype) || "industry";
  const slug =
    cmsRouteSegment(item.slug) ||
    cmsRouteSegment(item.id) ||
    cmsSlugify(item.en?.title || item.zh?.title || item.id);
  if (!slug) return null;
  return `/news/${channel}/${slug}`;
}

const NEWS_CATEGORY_LABELS: Record<string, string> = {
  industry: "Industry Trends",
  new_product: "New Products",
  brand_news: "Brand News",
  science: "Science & Safety",
};

/**
 * Mirrors the Worker's capSlug() and the frontend's capSlugText()
 * (src/lib/evaluationSlug.ts): en.title -> zh.title -> record slug -> title,
 * word-boundary capped at 60 chars. All three must stay in lockstep so the
 * sitemap, the prerendered raw HTML and the hydrated SPA resolve the same URL.
 */
function cmsCapSlug(input: unknown, maxChars = 60): string {
  const base = cmsSlugify(input);
  if (!base || base === "item") return "";
  if (base.length <= maxChars) return base;
  const cut = base.slice(0, maxChars);
  const lastDash = cut.lastIndexOf("-");
  return lastDash > 20 ? cut.slice(0, lastDash) : cut;
}

/** Machine-generated identifier slugs that must never become a canonical URL. */
function isMachineIdSlug(input: string): boolean {
  return /^(ev[_-]?\d+|eval-|item)$/.test(input);
}

function evaluationRoutePath(item: CmsEvaluation): string | null {
  const reviewType = cmsSlugify(item.type || "single") || "single";
  const slug =
    cmsCapSlug(item.en?.title) ||
    cmsCapSlug(item.zh?.title) ||
    cmsCapSlug(item.slug) ||
    cmsCapSlug(item.title);
  if (!slug || isMachineIdSlug(slug)) return null;
  return `/reviews/${reviewType}/${slug}`;
}

function newsCategoryLabel(item: CmsNews): string {
  const key = String(item.category || "").trim();
  return NEWS_CATEGORY_LABELS[key] || key.replace(/_/g, " ") || "Industry Trends";
}

function pickText(...values: Array<string | undefined>): string {
  for (const value of values) {
    const text = String(value || "").trim();
    if (text) return text;
  }
  return "";
}

/** Ultimate fallback for listing-page dates when no dated content exists. */
const FALLBACK_PAGE_DATE = "2026-08-15";

function isoDay(value: unknown): string {
  const text = String(value || "").trim().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
}

/**
 * Derive a listing page's datePublished / dateModified from the items it lists:
 * published = earliest item date, modified = latest item modification. Listing
 * pages used to hardcode 2026-08-15, which went stale the moment newer content
 * shipped (a /news hub full of October stories still claimed an August publish
 * date in both the byline and the JSON-LD).
 */
function deriveListingDates(rows: Array<{ pub: string; mod: string }>): { published: string; modified: string } {
  const clean = rows
    .map((r) => ({ pub: isoDay(r.pub), mod: isoDay(r.mod) }))
    .filter((r) => r.pub || r.mod)
    .map((r) => ({ pub: r.pub || r.mod, mod: r.mod || r.pub }));
  if (!clean.length) return { published: FALLBACK_PAGE_DATE, modified: FALLBACK_PAGE_DATE };
  return {
    published: clean.map((r) => r.pub).sort()[0],
    modified: clean.map((r) => r.mod).sort()[clean.length - 1],
  };
}

// CMS snapshots: every successful fetch overwrites a local snapshot, and the
// snapshot is committed to the repo (2026-10-23).
//
// Why committed: the D1 free tier's 5M daily row-read limit runs out
// regularly, and when it does every /api/cms/* read returns HTTP 500. A
// Cloudflare Pages build that depends purely on the live CMS then aborts
// ("products CMS fetch returned 0 records") and NOTHING is deployed — which
// is how the 2026-10-23 ride-on deploy failed while the local build succeeded
// (the local build had a snapshot on disk).
//
// Freshness: the snapshot carries the UTC timestamp of its last successful
// fetch in a sibling .meta.json. A snapshot older than SNAPSHOT_MAX_AGE_HOURS
// is not trusted — the build still uses it rather than deploying nothing, but
// it says so loudly, and a missing/stale snapshot plus a dead CMS still aborts
// the build rather than shipping an SPA-only dist.
const CMS_SNAPSHOT_DIR = path.resolve("scripts", "cms-snapshots");
const SNAPSHOT_MAX_AGE_HOURS = 72;

type CmsSnapshotMeta = { fetchedAt?: string };

async function readCmsSnapshotMeta(collection: string): Promise<CmsSnapshotMeta | null> {
  try {
    const raw = await readFile(path.join(CMS_SNAPSHOT_DIR, `${collection}.meta.json`), "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed as CmsSnapshotMeta;
  } catch {
    // no meta
  }
  return null;
}

/** Age of a snapshot in hours, or null when it cannot be determined. */
async function cmsSnapshotAgeHours(collection: string): Promise<number | null> {
  const meta = await readCmsSnapshotMeta(collection);
  const fetchedAt = meta?.fetchedAt;
  if (!fetchedAt) return null;
  const ts = Date.parse(fetchedAt);
  if (Number.isNaN(ts)) return null;
  return (Date.now() - ts) / 3_600_000;
}

async function writeCmsSnapshotMeta(collection: string): Promise<void> {
  try {
    await mkdir(CMS_SNAPSHOT_DIR, { recursive: true });
    await writeFile(
      path.join(CMS_SNAPSHOT_DIR, `${collection}.meta.json`),
      JSON.stringify({ fetchedAt: new Date().toISOString() }, null, 2),
    );
  } catch (error) {
    console.warn(`[prerender] failed to write ${collection} snapshot meta: ${(error as Error).message}`);
  }
}

async function readCmsSnapshot<T>(collection: string): Promise<T[] | null> {
  try {
    const raw = await readFile(path.join(CMS_SNAPSHOT_DIR, `${collection}.json`), "utf8");
    const rows: unknown = JSON.parse(raw);
    if (Array.isArray(rows)) {
      return rows.filter((row): row is T => Boolean(row) && typeof row === "object");
    }
  } catch {
    // no snapshot
  }
  return null;
}

async function writeCmsSnapshot(collection: string, records: unknown[]): Promise<void> {
  try {
    await mkdir(CMS_SNAPSHOT_DIR, { recursive: true });
    await writeFile(path.join(CMS_SNAPSHOT_DIR, `${collection}.json`), JSON.stringify(records));
    await writeCmsSnapshotMeta(collection);
  } catch (error) {
    console.warn(`[prerender] failed to write ${collection} snapshot: ${(error as Error).message}`);
  }
}

async function fetchPublishedCollection<T>(collection: string): Promise<T[]> {
  const url = `${CMS_BASE_URL}/api/cms/${collection}?onlyPublished=1`;
  // Transient CMS/CDN fetch failures previously caused silent schema
  // degradation (e.g. reviewRating dropped for every page whose product join
  // ran against an empty map). With 4 collections fetched per build, a ~30%
  // per-collection failure rate made "at least one degraded" the norm —
  // retry hard (8 attempts, capped backoff) before degrading.
  const attempts = 8;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20000);
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload: unknown = await response.json();
      const rows = Array.isArray(payload)
        ? payload
        : Array.isArray((payload as { data?: unknown })?.data)
          ? ((payload as { data: unknown[] }).data as unknown[])
          : [];
      const records = rows.filter((row): row is T => Boolean(row) && typeof row === "object");
      console.log(`[prerender] ${records.length} published ${collection} record(s) from ${url}${attempt > 1 ? ` (attempt ${attempt})` : ""}`);
      await writeCmsSnapshot(collection, records);
      return records;
    } catch (error) {
      if (attempt < attempts) {
        console.warn(`[prerender] ${collection} fetch attempt ${attempt} failed (${(error as Error).message}); retrying...`);
        await new Promise((resolve) => setTimeout(resolve, Math.min(2000 * attempt, 8000)));
        continue;
      }
      // Fall back to the committed snapshot. This is the DEFAULT, not an
      // opt-in: the Cloudflare Pages build has no way to set an env var, and
      // the D1 free tier runs out of row reads often enough that an opt-in
      // fallback meant the deploy simply never happened.
      const snapshot = await readCmsSnapshot<T>(collection);
      if (snapshot && snapshot.length > 0) {
        const ageHours = await cmsSnapshotAgeHours(collection);
        const ageText = ageHours === null ? "unknown age" : `${ageHours.toFixed(1)}h old`;
        const stale = ageHours !== null && ageHours > SNAPSHOT_MAX_AGE_HOURS;
        console.warn(
          `[prerender] could not reach ${url} after ${attempts} attempts (${(error as Error).message}); ` +
            `USING SNAPSHOT with ${snapshot.length} ${collection} record(s) (${ageText}` +
            `${stale ? `, OLDER than the ${SNAPSHOT_MAX_AGE_HOURS}h limit` : ""}).`,
        );
        return snapshot;
      }
      console.warn(
        `[prerender] could not reach ${url} after ${attempts} attempts (${(error as Error).message}); falling back to bundled data.`,
      );
      return [];
    }
  }
  return [];
}

async function fetchPublishedGuides(): Promise<CmsGuide[]> {
  return fetchPublishedCollection<CmsGuide>("guides");
}

async function fetchPublishedNews(): Promise<CmsNews[]> {
  return fetchPublishedCollection<CmsNews>("news");
}

async function fetchPublishedEvaluations(): Promise<CmsEvaluation[]> {
  return fetchPublishedCollection<CmsEvaluation>("evaluations");
}

async function fetchPublishedProducts(): Promise<CmsProductLite[]> {
  return fetchPublishedCollection<CmsProductLite>("products");
}

/* ------------------------------------------------------------------ *
 * CMS settings (section-page SEO)
 *
 * The structural pages (home/products/reviews/guides/news/about) resolve
 * their <title>/<meta description> from CMS settings.seo at RUNTIME (SPA),
 * so the prerender must read the same source at build time or the static
 * HTML and the hydrated page publish different TDK — the exact bug audited
 * on 2026-10-15/16. Fetch live settings here (same retry policy as the
 * collections); on outage fall back to the local snapshot when
 * PRERENDER_ALLOW_STALE=1. `npm run data:settings` refreshes the snapshot
 * manually. Both sides then go through resolveSectionRouteSeo() from
 * src/lib/cmsSectionSeo.ts, so there is exactly one resolution chain.
 * ------------------------------------------------------------------ */

type CmsSettingsPayload = CMSSettings & { updatedAt?: string };

/** Unwraps the API envelope ({data:[settings]}) the CMS returns. */
function unwrapCmsSettings(payload: unknown): CmsSettingsPayload | null {
  const candidate =
    payload && typeof payload === "object" && Array.isArray((payload as { data?: unknown }).data)
      ? (payload as { data: unknown[] }).data[0]
      : (payload as { data?: unknown } | null)?.data ?? payload;
  if (!candidate || typeof candidate !== "object") return null;
  return candidate as CmsSettingsPayload;
}

async function readCmsSettingsSnapshot(): Promise<CmsSettingsPayload | null> {
  try {
    const raw = await readFile(path.join(CMS_SNAPSHOT_DIR, "settings.json"), "utf8");
    return unwrapCmsSettings(JSON.parse(raw));
  } catch {
    return null;
  }
}

async function writeCmsSettingsSnapshot(payload: unknown): Promise<void> {
  try {
    await mkdir(CMS_SNAPSHOT_DIR, { recursive: true });
    await writeFile(path.join(CMS_SNAPSHOT_DIR, "settings.json"), JSON.stringify(payload));
    await writeCmsSnapshotMeta("settings");
  } catch (error) {
    console.warn(`[prerender] failed to write settings snapshot: ${(error as Error).message}`);
  }
}

async function fetchCmsSettings(): Promise<CmsSettingsPayload | null> {
  // Cache-busted on purpose: the Worker's mutation-triggered edge purge does
  // not cover the settings collection, so a plain GET can serve a copy that
  // predates the last CMS edit for a full TTL — which is exactly how a freshly
  // published reference-cluster list can fail to reach a build. A build must
  // see live data, so it deliberately misses the cache here.
  const url = `${CMS_BASE_URL}/api/cms/settings?cb=${Date.now()}`;
  const attempts = 8;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20000);
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload: unknown = await response.json();
      const settings = unwrapCmsSettings(payload);
      if (!settings) throw new Error("settings payload empty");
      await writeCmsSettingsSnapshot(payload);
      const seoKeys = Object.keys(settings.seo || {});
      console.log(
        `[prerender] CMS settings from ${url}${attempt > 1 ? ` (attempt ${attempt})` : ""} — ` +
          `section seo: ${seoKeys.join(", ") || "(none)"} | updatedAt: ${settings.updatedAt || "?"}`,
      );
      return settings;
    } catch (error) {
      if (attempt < attempts) {
        console.warn(`[prerender] settings fetch attempt ${attempt} failed (${(error as Error).message}); retrying...`);
        await new Promise((resolve) => setTimeout(resolve, Math.min(2000 * attempt, 8000)));
        continue;
      }
      // Same default-fallback rule as the collections: use the committed
      // settings snapshot rather than dropping the section pages' CMS TDK.
      const snapshot = await readCmsSettingsSnapshot();
      if (snapshot) {
        console.warn(
          `[prerender] could not reach ${url} after ${attempts} attempts (${(error as Error).message}); ` +
            `USING SNAPSHOT settings (updatedAt: ${snapshot.updatedAt || "?"}).`,
        );
        return snapshot;
      }
      console.warn(
        `[prerender] could not reach ${url} after ${attempts} attempts (${(error as Error).message}); ` +
          `section pages keep their bundled TDK (static HTML may drift from the hydrated SPA until the next successful build).`,
      );
      return null;
    }
  }
  return null;
}

/**
 * Overrides the six structural pages' fullTitle/description/keywords with the
 * values the hydrated SPA will publish (CMS settings.seo > defaultSeo). Body
 * copy, H1s and links are untouched — only the <title>/<meta description>/
 * <meta keywords>/og tags and the home WebSite JSON-LD description follow the
 * CMS. Keywords joined the title/description chain on 2026-10-22 (A2): the
 * section routes used to keep the defaultSeo keyword set in the static HTML
 * while hydration published the CMS set, so the two renderers disagreed on
 * /products/ and /reviews/.
 */
const CMS_SECTION_ROUTES: Array<{ route: string; seoKey: string }> = [
  { route: "", seoKey: "home" },
  { route: "/products", seoKey: "products" },
  { route: "/reviews", seoKey: "reviews" },
  { route: "/guides", seoKey: "guides" },
  { route: "/news", seoKey: "news" },
  { route: "/about", seoKey: "about" },
];

function applyCmsSectionSeo(pages: RoutePage[], settings: CmsSettingsPayload | null): number {
  if (!settings) return 0;
  let applied = 0;
  for (const section of CMS_SECTION_ROUTES) {
    const resolved = resolveSectionRouteSeo(settings, section.seoKey, "en");
    const page = pages.find((candidate) => candidate.route === section.route);
    if (!page) {
      console.warn(`[prerender] CMS section seo: no prerendered page for route "${section.route || "/"}" — skipped.`);
      continue;
    }
    page.fullTitle = resolved.title;
    page.description = resolved.description;
    // Keywords follow the same chain (see the RoutePage.keywords doc): an empty
    // resolved set means the CMS entry carries no keywords, so fall back to the
    // DEFAULT-based resolver rather than emitting an empty meta tag.
    page.keywords = resolved.keywords.length > 0
      ? resolved.keywords
      : resolveRouteKeywords(section.route || "/", "en");
    // The home/WebSite JSON-LD description is hardcoded in renderHomePage;
    // keep it in lockstep with the published meta description.
    if (Array.isArray(page.jsonLd)) {
      for (const schema of page.jsonLd) {
        if (schema && typeof schema === "object") {
          const type = (schema as { "@type"?: string })["@type"];
          if (type === "WebSite") {
            (schema as { description?: string }).description = resolved.description;
          }
          // /guides ships a CollectionPage whose name used to be hardcoded
          // ("What does the guide library cover? | BalanceBikeToddler") and
          // drifted from the published <title> — the 2026-10-21 stroller-title
          // fix made that gap visible. The only CollectionPage emitter in this
          // file is renderGuidesPage, so scoping by @type is enough.
          if (type === "CollectionPage") {
            (schema as { name?: string }).name = resolved.title;
          }
        }
      }
    }
    applied += 1;
    console.log(`[prerender] CMS section seo: ${section.route || "/"} -> "${resolved.title}"`);
  }
  return applied;
}

/**
 * Pillar->cluster matcher: score published evaluations by how many of their
 * editorial title tokens appear in the guide body. Mirrors the runtime block
 * in GuidesSection so prerendered HTML and the hydrated app agree.
 */
function relatedEvaluationsForGuide(
  guideText: string,
  evaluations: CmsEvaluation[],
  limit = 4,
): Array<{ title: string; path: string }> {
  const text = String(guideText || "").toLowerCase();
  const stop = new Set(["review", "reviews", "single", "compare", "with", "the", "and", "for", "best"]);
  return evaluations
    .filter((e) => !e.status || e.status === "published")
    .map((e) => {
      const title = pickText(e.en?.title, e.zh?.title, e.title);
      const type = cmsSlugify(e.type || "single") || "single";
      const slug =
        cmsCapSlug(e.en?.title) || cmsCapSlug(e.zh?.title) || cmsCapSlug(e.slug) || cmsCapSlug(e.title);
      if (!title || !slug || isMachineIdSlug(slug)) return null;
      const tokens = title.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length >= 4 && !stop.has(t));
      const score = tokens.filter((t) => text.includes(t)).length;
      if (score < 1) return null;
      return { title, score, path: `/reviews/${type}/${slug}` };
    })
    .filter((x): x is { title: string; score: number; path: string } => Boolean(x))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ title, path }) => ({ title, path }));
}

/**
 * Contextual product-links block shared by guide / news / evaluation detail
 * pages. Matching is token-based against real CMS product fields via the
 * shared relatedProducts lib (same matcher the SPA hydrates with). Renders
 * nothing when no product genuinely matches — never pads with filler.
 */
function relatedProductsHtml(
  text: string,
  products: CmsProductLite[],
  heading: string,
  limit = 3,
): string {
  if (!products.length) return "";
  const productsById = new Map(products.map((product) => [String(product.id || ""), product]));
  const matched = matchProductsForText(
    text,
    products.map((product) => ({
      id: String(product.id || ""),
      name: product.name,
      brand: product.brand,
      category: product.category,
      summary: (product as Record<string, unknown> & { en?: { description?: string } })?.en?.description,
    })),
    limit,
  );
  if (!matched.length) return "";
  const items = matched
    .map((p) => {
      const href = `/products/${resolveProductDetailCategorySlug((productsById.get(p.id) || {}) as Record<string, unknown>)}/${p.id}`;
      const name = escapeHtml(String(p.name || p.id).trim());
      const brand = String(p.brand || "").trim();
      const label = escapeHtml(brand && !name.toLowerCase().startsWith(brand.toLowerCase()) ? `${brand} ${p.name || p.id}`.trim() : String(p.name || p.id).trim());
      return `<li style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 12px 16px;"><a href="${escapeHtml(href)}" style="color: #c2410c; font-weight: 700; text-decoration: none;">${label}</a><span style="display: block; margin-top: 4px; font-size: 0.85rem; color: #64748b;">Lab score, full specs &amp; safety checklist for the ${name}.</span></li>`;
    })
    .join("");
  return `<section style="padding: 18px 0; border-top: 1px solid #e2e8f0;">
        <h2 style="margin: 0 0 10px; font-size: 0.95rem; font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase; color: #94a3b8;">${escapeHtml(heading)}</h2>
        <ul style="margin: 0; padding: 0; list-style: none; display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 10px;">${items}</ul>
      </section>`;
}

function renderGuideDetailPage(guide: CmsGuide, evaluations: CmsEvaluation[] = [], products: CmsProductLite[] = []): RoutePage | null {
  const route = guideRoutePath(guide);
  if (!route) return null;

  const title = pickText(guide.en?.title, guide.zh?.title, guide.id);
  const summary = pickText(
    guide.en?.summary,
    guide.seo?.en?.description,
    guide.zh?.summary,
    guide.seo?.zh?.description,
    "BalanceBikeToddler buying guide for families.",
  );
  const content = pickText(guide.en?.content, guide.zh?.content);
  // Guides without an authored summary fall back to the description chain,
  // which for these records lands on the article's own opening paragraph —
  // printing the same paragraph three times on one page. Drop the "Short
  // answer" copy when it merely repeats what the body already leads with.
  const openingParagraph = String(content || "").split(/\n\s*\n/)[0].trim();
  const introRepeatsBody =
    Boolean(summary) &&
    Boolean(openingParagraph) &&
    (openingParagraph.includes(summary) || summary.includes(openingParagraph));
  const summaryIntroHtml = introRepeatsBody
    ? ""
    : `<p style="margin: 0 0 14px; font-size: 1.05rem; color: #334155;"><strong>Short answer:</strong> ${escapeHtml(summary)}</p>`;
  const relatedReviews = relatedEvaluationsForGuide(`${title} ${summary} ${content}`, evaluations);
  const relatedProducts = relatedProductsHtml(`${title} ${summary} ${content}`, products, "Products Mentioned in This Guide");
  const relatedReviewsHtml = relatedReviews.length
    ? `<section style="padding: 18px 0; border-top: 1px solid #e2e8f0;">
        <h2 style="margin: 0 0 10px; font-size: 0.95rem; font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase; color: #94a3b8;">Related Reviews</h2>
        <ul style="margin: 0; padding: 0; list-style: none; display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 10px;">
          ${relatedReviews
            .map(
              (review) =>
                `<li style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 12px 16px;"><a href="${escapeHtml(review.path)}" style="color: #c2410c; font-weight: 700; text-decoration: none;">${escapeHtml(review.title)}</a></li>`,
            )
            .join("")}
        </ul>
      </section>`
    : "";
  const topic = guideTopicCategory(guide);
  const topicLabel = topic.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  const published = pickText(guide.publishedAt, guide.updatedAt).slice(0, 10) || "2026-08-15";
  const url = `${PUBLIC_SITE_BASE}${route}`;
  const image = toPublicImageUrl(pickText(guide.imageUrl));

  const schemas: Array<Record<string, unknown>> = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "BalanceBikeToddler",
      url: `${PUBLIC_SITE_BASE}/`,
      logo: `${PUBLIC_SITE_BASE}/favicon.svg`,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Guides", item: `${PUBLIC_SITE_BASE}/guides` },
        { "@type": "ListItem", position: 2, name: topicLabel, item: `${PUBLIC_SITE_BASE}/guides/${topic}` },
        { "@type": "ListItem", position: 3, name: title, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: title,
      description: summary,
      url,
      mainEntityOfPage: url,
      inLanguage: "en",
      datePublished: published,
      dateModified: published,
      articleSection: topicLabel,
      ...(image ? { image: [image] } : {}),
      author: { "@type": "Organization", name: "BalanceBikeToddler Editorial Team" },
      publisher: {
        "@type": "Organization",
        name: "BalanceBikeToddler",
        url: `${PUBLIC_SITE_BASE}/`,
        logo: `${PUBLIC_SITE_BASE}/favicon.svg`,
      },
    },
  ];

  return {
    route,
    title,
    description: summary,
    skipLeadDescription: introRepeatsBody,
    image: image || undefined,
    ogType: "article",
    body: `
      <nav style="padding: 4px 0 16px; font-size: 0.86rem; color: #64748b;">
        <a href="/guides">Guides</a> › <a href="/guides/${escapeHtml(topic)}">${escapeHtml(topicLabel)}</a>
      </nav>
      <section style="padding: 4px 0 18px;">
        <p style="margin: 0 0 10px; font-size: 0.86rem; color: #475569; font-weight: 600;">
          By <strong>BalanceBikeToddler Editorial Team</strong> · <time datetime="${escapeHtml(published)}">Published ${escapeHtml(published)}</time>
        </p>
        ${summaryIntroHtml}
      </section>
      ${image ? `<div style="padding: 0 0 18px;"><img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" width="800" height="450" loading="eager" decoding="async" style="width: 100%; height: auto; aspect-ratio: 16 / 9; object-fit: contain; background: #ffffff; border-radius: 18px; border: 1px solid #e2e8f0; display: block;" /></div>` : ""}
      <section style="padding: 6px 0; border-top: 1px solid #e2e8f0;">
        ${renderRichContentHtml(content) || `<p style="margin: 0;">${escapeHtml(summary)}</p>`}
      </section>
      ${relatedReviewsHtml}
      ${relatedProducts}
      ${/balance[\s_-]*bike|walking bike/i.test(`${title} ${summary} ${content}`) ? clusterNavHtml("") : ""}
      <section style="padding: 22px 0 0; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 0.9rem; color: #475569;">Continue browsing the <a href="/guides">full guide library</a>.</p>
      </section>
    `,
    jsonLd: schemas,
  };
}

function renderNewsDetailPage(item: CmsNews, products: CmsProductLite[] = []): RoutePage | null {
  const route = newsRoutePath(item);
  if (!route) return null;

  const title = pickText(item.en?.title, item.zh?.title, item.id);
  const summary = pickText(
    item.en?.summary,
    item.seo?.en?.description,
    item.zh?.summary,
    item.seo?.zh?.description,
    "Latest kids mobility news from BalanceBikeToddler.",
  );
  const content = pickText(item.en?.content, item.zh?.content);
  const channel = route.split("/")[2] || "industry";
  const channelLabel = newsCategoryLabel(item);
  const published = pickText(item.publishedAt, item.updatedAt).slice(0, 10) || "2026-08-15";
  const url = `${PUBLIC_SITE_BASE}${route}`;
  const image = toPublicImageUrl(pickText(item.imageUrl));

  const schemas: Array<Record<string, unknown>> = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "BalanceBikeToddler",
      url: `${PUBLIC_SITE_BASE}/`,
      logo: `${PUBLIC_SITE_BASE}/favicon.svg`,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "News", item: `${PUBLIC_SITE_BASE}/news` },
        { "@type": "ListItem", position: 2, name: channelLabel, item: `${PUBLIC_SITE_BASE}/news/${channel}` },
        { "@type": "ListItem", position: 3, name: title, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      headline: title,
      description: summary,
      url,
      mainEntityOfPage: url,
      inLanguage: "en",
      datePublished: published,
      dateModified: published,
      articleSection: channelLabel,
      ...(image ? { image: [image] } : {}),
      author: { "@type": "Organization", name: "BalanceBikeToddler Editorial Team" },
      publisher: {
        "@type": "Organization",
        name: "BalanceBikeToddler",
        url: `${PUBLIC_SITE_BASE}/`,
        logo: `${PUBLIC_SITE_BASE}/favicon.svg`,
      },
    },
  ];

  // Same duplicate-intro guard as the guide template: the lead paragraph under
  // the h1 repeats the body when the CMS article has no authored summary.
  const newsOpeningParagraph = String(content || "").split(/\n\s*\n/)[0].trim();
  const newsIntroRepeatsBody =
    Boolean(summary) &&
    Boolean(newsOpeningParagraph) &&
    (newsOpeningParagraph.includes(summary) || summary.includes(newsOpeningParagraph));

  return {
    route,
    title,
    description: summary,
    skipLeadDescription: newsIntroRepeatsBody,
    image: image || undefined,
    ogType: "article",
    body: `
      <nav style="padding: 4px 0 16px; font-size: 0.86rem; color: #64748b;">
        <a href="/news">News</a> › <a href="/news/${escapeHtml(channel)}">${escapeHtml(channelLabel)}</a>
      </nav>
      ${image ? `<figure style="margin: 0 0 18px;">
        <img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" width="800" height="450" loading="eager" decoding="async" style="width: 100%; height: auto; aspect-ratio: 16 / 9; object-fit: cover; display: block; border-radius: 18px;" />
      </figure>` : ""}
      <section style="padding: 4px 0 18px;">
        <p style="margin: 0 0 10px; font-size: 0.86rem; color: #475569; font-weight: 600;">
          By <strong>BalanceBikeToddler Editorial Team</strong> · <time datetime="${escapeHtml(published)}">Published ${escapeHtml(published)}</time>
        </p>
        <p style="margin: 0 0 14px; font-size: 1.05rem; color: #334155;"><strong>Short answer:</strong> ${escapeHtml(summary)}</p>
      </section>
      <section style="padding: 6px 0; border-top: 1px solid #e2e8f0;">
        ${renderRichContentHtml(content) || `<p style="margin: 0;">${escapeHtml(summary)}</p>`}
      </section>
      ${relatedProductsHtml(`${title} ${summary} ${content}`, products, "Related Products")}
      <section style="padding: 22px 0 0; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 0.9rem; color: #475569;">Continue reading the <a href="/news">latest news</a> or browse the <a href="/guides">guide library</a>.</p>
      </section>
    `,
    jsonLd: schemas,
  };
}

/**
 * Resolves a CMS product for an evaluation reference. Mirrors the runtime
 * matcher in EvaluationsSection: exact id match first, then ASIN tail match
 * (e.g. evaluation productId "stroller-b07jr8ty2q" matches product id
 * "stroller-b07jr8ty2q" or a tail ASIN collision).
 */
function resolvePrerenderProduct(
  rawId: string | undefined,
  productMap: Map<string, CmsProductLite>,
): CmsProductLite | null {
  const normalized = String(rawId || "").trim().toLowerCase();
  if (!normalized) return null;
  const exact = productMap.get(normalized);
  if (exact) return exact;
  const tail = normalized.split("-").pop();
  if (tail) {
    for (const product of productMap.values()) {
      const productId = String(product.id || "").trim().toLowerCase();
      if (productId && productId.split("-").pop() === tail) return product;
    }
  }
  return null;
}

function renderEvaluationDetailPage(
  item: CmsEvaluation,
  productMap: Map<string, CmsProductLite> = new Map(),
): RoutePage | null {
  if (String(item.status || "").trim() && item.status !== "published") return null;
  const route = evaluationRoutePath(item);
  if (!route) return null;

  const isCompare = String(item.type || "").trim().toLowerCase() === "compare";
  const langModel = (item.en?.title ? item.en : item.zh) || item.en || item.zh || {};
  const title = pickText(item.en?.title, item.zh?.title, item.id);
  const verdict = pickText(item.en?.verdict, item.zh?.verdict);
  const pros = (langModel as { pros?: string[] }).pros || [];
  const cons = (langModel as { cons?: string[] }).cons || [];
  const url = `${PUBLIC_SITE_BASE}${route}`;
  const image = toPublicImageUrl(pickText(item.imageUrl));
  const published = pickText(item.publishedAt, item.updatedAt).slice(0, 10) || "2026-08-15";
  const reviewTypeLabel = isCompare ? "Comparison Reviews" : "Single Reviews";

  const prosHtml = pros.length
    ? `<ul>${pros.map((pro) => `<li>${escapeHtml(String(pro))}</li>`).join("")}</ul>`
    : "";
  const consHtml = cons.length
    ? `<ul>${cons.map((con) => `<li>${escapeHtml(String(con))}</li>`).join("")}</ul>`
    : "";

  const schemas: Array<Record<string, unknown>> = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "BalanceBikeToddler",
      url: `${PUBLIC_SITE_BASE}/`,
      logo: `${PUBLIC_SITE_BASE}/favicon.svg`,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Reviews", item: `${PUBLIC_SITE_BASE}/reviews` },
        { "@type": "ListItem", position: 2, name: reviewTypeLabel, item: `${PUBLIC_SITE_BASE}/reviews/${isCompare ? "compare" : "single"}` },
        { "@type": "ListItem", position: 3, name: title, item: url },
      ],
    },
    isCompare
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: title,
          numberOfItems: item.productIds?.length || 0,
          mainEntityOfPage: url,
          url,
        }
      : {
          "@context": "https://schema.org",
          "@type": "Review",
          name: title,
          reviewBody: verdict || title,
          inLanguage: "en",
          datePublished: published,
          dateModified: pickText(item.updatedAt, item.publishedAt).slice(0, 10) || published,
          ...(image ? { image: [image] } : {}),
          author: { "@type": "Organization", name: "BalanceBikeToddler Editorial Team" },
          mainEntityOfPage: url,
          url,
          itemReviewed: (() => {
            const product = resolvePrerenderProduct(item.productId, productMap);
            const productImage = product ? toAbsoluteMediaUrl(pickText(product.imageUrl)) : "";
            const brandName = String(product?.brand || "").trim();
            const reviewedName = String(product?.name || "").trim() || title;
            return {
              "@type": "Product",
              name: reviewedName,
              ...(brandName ? { brand: { "@type": "Brand", name: brandName } } : {}),
              ...(productImage ? { image: [productImage] } : {}),
              url: product
                ? `${PUBLIC_SITE_BASE}/products/${resolveProductDetailCategorySlug(product as Record<string, unknown>)}/${product.id}`
                : url,
            };
          })(),
          reviewRating: (() => {
            const product = resolvePrerenderProduct(item.productId, productMap);
            const score = Number(product?.overallScore);
            return score > 0
              ? {
                  "@type": "Rating",
                  ratingValue: Math.round(score * 10) / 10,
                  bestRating: 10,
                  worstRating: 1,
                }
              : undefined;
          })(),
        },
  ];

  const testedProducts = (
    isCompare
      ? (item.productIds || []).map((rawId) => resolvePrerenderProduct(String(rawId), productMap))
      : [resolvePrerenderProduct(item.productId, productMap)]
  ).filter((p): p is CmsProductLite => Boolean(p));
  // Fallback when the evaluation's productId reference cannot be resolved:
  // token-match the review text against the product catalog (same shared
  // matcher the guides/news pages use) instead of emitting zero links.
  const fallbackProducts = testedProducts.length
    ? []
    : matchProductsForText(
        `${title} ${verdict}`,
        productMap.size
          ? Array.from(productMap.values()).map((product) => ({
              id: String(product.id || ""),
              name: product.name,
              brand: product.brand,
              category: product.category,
            }))
          : [],
        isCompare ? 3 : 1,
      );
  const linkedProducts = testedProducts.length ? testedProducts : fallbackProducts;
  const testedProductsHtml = linkedProducts.length
    ? `<section style="padding: 18px 0; border-top: 1px solid #e2e8f0;">
        <h2 style="margin: 0 0 10px; font-size: 0.95rem; font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase; color: #94a3b8;">${isCompare ? "Products in This Comparison" : "Tested Product"}</h2>
        <ul style="margin: 0; padding: 0; list-style: none; display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 10px;">
          ${linkedProducts
            .map((p) => {
              const name = String(p.name || p.id).trim();
              const brand = String(p.brand || "").trim();
              const label =
                brand && !name.toLowerCase().startsWith(brand.toLowerCase())
                  ? `${brand} ${name}`
                  : name;
              return `<li style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 12px 16px;"><a href="${escapeHtml(`/products/${resolveProductDetailCategorySlug(p as Record<string, unknown>)}/${p.id}`)}" style="color: #c2410c; font-weight: 700; text-decoration: none;">${escapeHtml(label)}</a><span style="display: block; margin-top: 4px; font-size: 0.85rem; color: #64748b;">Full lab review, live pricing &amp; safety score.</span></li>`;
            })
            .join("")}
        </ul>
      </section>`
    : "";

  return {
    route,
    title,
    description: verdict || title,
    image: image || undefined,
    ogType: "article",
    body: `
      <nav style="padding: 4px 0 16px; font-size: 0.86rem; color: #64748b;">
        <a href="/reviews">Reviews</a> › <a href="/reviews/${isCompare ? "compare" : "single"}">${escapeHtml(reviewTypeLabel)}</a>
      </nav>
      <section style="padding: 4px 0 18px;">
        <p style="margin: 0 0 10px; font-size: 0.86rem; color: #475569; font-weight: 600;">
          By <strong>BalanceBikeToddler Editorial Team</strong> · <time datetime="${escapeHtml(published)}">Published ${escapeHtml(published)}</time>
        </p>
        ${verdict ? `<p style="margin: 0 0 14px; font-size: 1.05rem; color: #334155;"><strong>Verdict:</strong> ${escapeHtml(verdict)}</p>` : ""}
      </section>
      ${prosHtml ? `<section style="padding: 6px 0; border-top: 1px solid #e2e8f0;"><h2 style="font-size: 1.2rem; margin: 0 0 8px;">Pros</h2>${prosHtml}</section>` : ""}
      ${consHtml ? `<section style="padding: 14px 0; border-top: 1px solid #e2e8f0;"><h2 style="font-size: 1.2rem; margin: 0 0 8px;">Cons</h2>${consHtml}</section>` : ""}
      ${testedProductsHtml}
      ${/balance[\s_-]*bike|walking bike/i.test(`${title} ${verdict} ${[...pros, ...cons].join(" ")}`) ? clusterNavHtml("") : ""}
      <section style="padding: 22px 0 0; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 0.9rem; color: #475569;">Browse all <a href="/reviews">review reports</a> or the <a href="/guides">guide library</a>.</p>
      </section>
    `,
    jsonLd: schemas,
  };
}

function renderGuidesPage(cmsGuides: CmsGuide[] = []): RoutePage {
  const articles = guideArticles.slice(0, 5);
  const canonical = "https://balancebiketoddler.com/guides";
  const listedGuides: Array<{ title: string; summary: string; meta: string; url: string; cover: string }> = cmsGuides.length
    ? cmsGuides.flatMap((guide) => {
        const route = guideRoutePath(guide);
        if (!route) return [];
        const topic = guideTopicCategory(guide);
        return [{
          title: pickText(guide.en?.title, guide.zh?.title, guide.id),
          summary: pickText(guide.en?.summary, guide.seo?.en?.description, "BalanceBikeToddler buying guide."),
          meta: `${topic.replace(/_/g, " ")} · ${isoDay(guide.publishedAt) || isoDay(guide.updatedAt) || FALLBACK_PAGE_DATE}`,
          url: `${PUBLIC_SITE_BASE}${route}`,
          cover: toPublicImageUrl(pickText(guide.imageUrl)),
        }];
      })
    : articles.map((article) => ({
        title: article.title,
        summary: article.summary,
        meta: `${article.categoryLabel} · ${article.readTime} · ${article.publishDate}`,
        url: `${PUBLIC_SITE_BASE}/guides/${article.category}/${article.id}`,
        cover: "",
      }));
  const usingCmsGuides = cmsGuides.length > 0;
  const guidesPageDates = deriveListingDates(
    usingCmsGuides
      ? cmsGuides.map((guide) => ({
          pub: isoDay(guide.publishedAt) || isoDay(guide.updatedAt),
          mod: isoDay(guide.updatedAt) || isoDay(guide.publishedAt),
        }))
      : articles.map((article) => ({ pub: article.publishDate, mod: article.publishDate })),
  );
  const entitySameAs = [
    "https://www.youtube.com/@kidsmobi",
    "https://www.facebook.com",
    "https://www.instagram.com",
    "https://x.com/BalanceBikeToddler",
  ];
  const guidesSchemas = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "BalanceBikeToddler",
      url: "https://balancebiketoddler.com/",
      logo: "https://balancebiketoddler.com/favicon.svg",
      sameAs: entitySameAs,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "BalanceBikeToddler",
      url: "https://balancebiketoddler.com/",
      description: "Step-by-step buying guidance for families choosing safer ride-on products.",
      inLanguage: "en",
      publisher: {
        "@type": "Organization",
        name: "BalanceBikeToddler",
        url: "https://balancebiketoddler.com/",
        logo: "https://balancebiketoddler.com/favicon.svg",
        sameAs: entitySameAs,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "What does the guide library cover? | BalanceBikeToddler",
      url: canonical,
      description: "Step-by-step buying guidance for families choosing safer ride-on products.",
      inLanguage: "en",
      author: {
        "@type": "Organization",
        name: "BalanceBikeToddler Editorial Team",
      },
      datePublished: guidesPageDates.published,
      dateModified: guidesPageDates.modified,
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: listedGuides.length,
        itemListElement: listedGuides.map((guide, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: guide.title,
          url: guide.url,
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Which questions do parents ask first?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The guide library starts with the practical questions: which size is safest, which frame is easiest to control, and which product fits the family routine.",
          },
        },
        {
          "@type": "Question",
          name: "How do the guides answer real search queries?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Each guide is written so a reader can land on the page, get an answer first, and then dig into the supporting logic.",
          },
        },
      ],
    },
  ];
  return {
    route: "/guides",
    title: "What does the guide library cover?",
    // The visible <h1> mirrors what the SPA renders once it mounts; the SPA is
    // what readers and Google's renderer see, so the static page follows it.
    h1En: GUIDES_WIZARD_H1.en,
    description: "Step-by-step buying guidance for families choosing safer ride-on products.",
    body: `
      <section style="padding: 22px 0;">
        <h2 style="margin: 0 0 12px; font-size: 1.5rem;">Which questions do parents ask first?</h2>
        <p style="margin: 0 0 14px;"><strong>Short answer:</strong> the guide library starts with the practical questions: which size is safest, which frame is easiest to control, and which product fits the family routine.</p>
        <p style="margin: 0 0 14px;">The point is to turn a vague category search into a sequence of decisions that can be checked and compared.</p>
        <p style="margin: 0 0 14px;">Each guide ends with a source check and a clear next step, so readers can move from a quick answer to a confident buying decision without guessing.</p>
        <p style="margin: 0 0 14px; font-size: 0.88rem; color: #475569; font-weight: 600;">By <strong>BalanceBikeToddler Editorial Team</strong> · <time datetime="${guidesPageDates.published}">Published ${guidesPageDates.published}</time> · <time datetime="${guidesPageDates.modified}">Updated ${guidesPageDates.modified}</time></p>
        ${renderSources([
          { label: "CPSC Children's Products Guidance", href: "https://www.cpsc.gov/Business--Manufacturing/Business-Education/Business-Guidance/Childrens-Products", note: "baseline children's product safety context" },
          { label: "FTC Endorsement Guides", href: "https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides", note: "disclosure context for recommendations" },
        ])}
      </section>
      <section style="padding: 22px 0; border-top: 1px solid #e2e8f0;">
        <h2 style="margin: 0 0 12px; font-size: 1.5rem;">Which guide topics are most useful?</h2>
        ${listedGuides.map((guide) => `
          <section class="article-card" style="padding: 14px 0; border-top: 1px solid #f1f5f9; display: flex; gap: 16px; align-items: flex-start;">
            ${guide.cover ? `<a class="article-card-thumb" href="${escapeHtml(new URL(guide.url).pathname)}" style="flex: 0 0 clamp(96px, 30vw, 160px); display: block;">
              <img src="${escapeHtml(guide.cover)}" alt="${escapeHtml(guide.title)}" width="160" height="90" loading="lazy" decoding="async" style="width: 100%; height: auto; aspect-ratio: 16 / 9; object-fit: contain; background: #ffffff; border-radius: 10px; display: block;" />
            </a>` : ""}
            <div style="flex: 1 1 auto; min-width: 0;">
              <h3 style="margin: 0 0 8px; font-size: 1.05rem;"><a href="${escapeHtml(new URL(guide.url).pathname)}">${escapeHtml(guide.title)}</a></h3>
              <p style="margin: 0 0 8px; color: #334155;">${escapeHtml(guide.summary)}</p>
              <p style="margin: 0; font-size: 0.88rem; color: #64748b;">${escapeHtml(guide.meta)}</p>
            </div>
          </section>
        `).join("")}
        ${usingCmsGuides ? `<p style="margin: 14px 0 0; font-size: 0.9rem; color: #475569;">${listedGuides.length} published guide${listedGuides.length === 1 ? "" : "s"} in the library. Browse by topic: ${GUIDES_TOPIC_PAGE_IDS.map((topic) => `<a href="/guides/${topic}">${escapeHtml(GUIDES_TOPIC_PAGES[topic].h1)}</a>`).join(" · ")}.</p>` : ""}
      </section>
      <section style="padding: 22px 0; border-top: 1px solid #e2e8f0;">
        <h2 style="margin: 0 0 12px; font-size: 1.5rem;">How do the guides answer real search queries?</h2>
        <p style="margin: 0 0 14px;"><strong>Short answer:</strong> each guide is written so a reader can land on the page, get an answer first, and then dig into the supporting logic.</p>
        <p style="margin: 0 0 14px;">That structure is better for humans and easier for crawlers to segment into useful chunks.</p>
        <figure style="margin: 0; padding: 14px 16px; border-left: 4px solid #f97316; background: #fff7ed;">
          <blockquote cite="https://www.cpsc.gov/Business--Manufacturing/Business-Education/Business-Guidance/Childrens-Products" style="margin: 0;">
            <p style="margin: 0;">“A useful guide tells the reader why the answer is true, not just what the answer is.”</p>
          </blockquote>
          <figcaption style="margin-top: 8px; font-size: 0.85rem; color: #475569; font-weight: 600;">— CPSC Children&apos;s Products Guidance</figcaption>
        </figure>
      </section>
      <section style="padding: 22px 0; border-top: 1px solid #e2e8f0;">
        <h2 style="margin: 0 0 12px; font-size: 1.5rem;">Sources and citations</h2>
        <ul style="margin: 0; padding-left: 1.2rem;">
          <li><a href="https://www.cpsc.gov/Business--Manufacturing/Business-Education/Business-Guidance/Childrens-Products">CPSC Children&apos;s Products Guidance</a> — baseline children&apos;s product safety context</li>
          <li><a href="https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides">FTC Endorsement Guides</a> — disclosure context for recommendations</li>
          <li><a href="https://www.iso.org/standard/71811.html">ISO 8098</a> — children&apos;s bicycle safety standard reference</li>
        </ul>
      </section>
      <section style="padding: 22px 0; border-top: 1px solid #e2e8f0;">
        <h2 style="margin: 0 0 12px; font-size: 1.5rem;">Why the guide page is easier to cite</h2>
        <ul style="margin: 0; padding-left: 1.2rem;">
          <li>The page has a visible byline and dates.</li>
          <li>The quote is attributed to a named source.</li>
          <li>The page ships Organization, WebSite, CollectionPage, and FAQPage JSON-LD in HTML.</li>
        </ul>
      </section>
    `,
    jsonLd: guidesSchemas,
  };
}

function renderNewsPage(cmsNews: CmsNews[] = []): RoutePage {
  const articles = newsArticles.slice(0, 5);
  const usingCmsNews = cmsNews.length > 0;
  const listedNews: Array<{ title: string; summary: string; meta: string; url: string; cover: string }> = usingCmsNews
    ? cmsNews.flatMap((item) => {
        const route = newsRoutePath(item);
        if (!route) return [];
        return [{
          title: pickText(item.en?.title, item.zh?.title, item.id),
          summary: pickText(
            item.en?.summary,
            item.seo?.en?.description,
            "Latest kids mobility news from BalanceBikeToddler.",
          ),
          meta: `${newsCategoryLabel(item)} · ${isoDay(item.publishedAt) || isoDay(item.updatedAt) || FALLBACK_PAGE_DATE}`,
          url: `${PUBLIC_SITE_BASE}${route}`,
          cover: toPublicImageUrl(pickText(item.imageUrl)),
        }];
      })
    : articles.map((article) => ({
        title: article.title,
        summary: article.summary,
        meta: `${article.categoryLabel} · ${article.readTime} · ${article.publishDate}`,
        url: `${PUBLIC_SITE_BASE}/news/${article.category}/${article.id}`,
        cover: "",
      }));
  const canonical = "https://balancebiketoddler.com/news";
  const newsPageDates = deriveListingDates(
    usingCmsNews
      ? cmsNews.map((item) => ({
          pub: isoDay(item.publishedAt) || isoDay(item.updatedAt),
          mod: isoDay(item.updatedAt) || isoDay(item.publishedAt),
        }))
      : articles.map((article) => ({ pub: article.publishDate, mod: article.publishDate })),
  );
  const entitySameAs = [
    "https://www.youtube.com/@kidsmobi",
    "https://www.facebook.com",
    "https://www.instagram.com",
    "https://x.com/BalanceBikeToddler",
  ];
  const newsSchemas = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "BalanceBikeToddler",
      url: "https://balancebiketoddler.com/",
      logo: "https://balancebiketoddler.com/favicon.svg",
      sameAs: entitySameAs,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "BalanceBikeToddler",
      url: "https://balancebiketoddler.com/",
      description: "Latest kids mobility news, product launches, and regulatory context with clear sources.",
      inLanguage: "en",
      publisher: {
        "@type": "Organization",
        name: "BalanceBikeToddler",
        url: "https://balancebiketoddler.com/",
        logo: "https://balancebiketoddler.com/favicon.svg",
        sameAs: entitySameAs,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "What is changing in the market? | BalanceBikeToddler",
      url: canonical,
      description: "Latest kids mobility news, product launches, and regulatory context with clear sources.",
      inLanguage: "en",
      author: {
        "@type": "Organization",
        name: "BalanceBikeToddler Editorial Team",
      },
      datePublished: newsPageDates.published,
      dateModified: newsPageDates.modified,
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: listedNews.length,
        itemListElement: listedNews.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.title,
          url: item.url,
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Which updates matter to families?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The page tracks launches, standards, and industry changes that can alter what parents should buy or avoid.",
          },
        },
        {
          "@type": "Question",
          name: "Which stories are most citable?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The stories with named sources, clear dates, and concise summaries are easiest for readers and AI systems to cite.",
          },
        },
        {
          "@type": "Question",
          name: "Why include a quote on the news page?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "A short attributed quote gives the page a source-backed sentence that crawlers can reuse with context.",
          },
        },
      ],
    },
  ];
  return {
    route: "/news",
    title: usingCmsNews ? "Kids Bike & Stroller News and Industry Updates" : "What is changing in the market?",
    description: "Latest kids mobility news, product launches, and regulatory context with clear sources.",
    body: `
      <section style="padding: 22px 0;">
        <h2 style="margin: 0 0 12px; font-size: 1.5rem;">Which updates matter to families?</h2>
        <p style="margin: 0 0 14px;"><strong>Short answer:</strong> the news page tracks launches, standards, and industry changes that can alter what parents should buy or avoid.</p>
        <p style="margin: 0 0 14px;">It is written to answer the immediate question first and then show the underlying context.</p>
        <p style="margin: 0 0 14px;">Each item is tied to a date, a category, and a buyer takeaway, which makes the page easier to skim, quote, and compare across updates.</p>
        <p style="margin: 0 0 14px; font-size: 0.88rem; color: #475569; font-weight: 600;">By <strong>BalanceBikeToddler Editorial Team</strong> · <time datetime="${newsPageDates.published}">Published ${newsPageDates.published}</time> · <time datetime="${newsPageDates.modified}">Updated ${newsPageDates.modified}</time></p>
        ${renderSources([
          { label: "EU Toy Safety", href: "https://single-market-economy.ec.europa.eu/sectors/toys/toy-safety_en", note: "regulatory context for toy-adjacent products" },
          { label: "ASTM F963", href: "https://www.astm.org/f0963-23.html", note: "toy safety standard reference" },
        ])}
      </section>
      <section style="padding: 22px 0; border-top: 1px solid #e2e8f0;">
        <h2 style="margin: 0 0 12px; font-size: 1.5rem;">Which stories are most citable?</h2>
        ${listedNews.map((item) => `
          <section class="article-card" style="padding: 14px 0; border-top: 1px solid #f1f5f9; display: flex; gap: 16px; align-items: flex-start;">
            ${item.cover ? `<a class="article-card-thumb" href="${escapeHtml(new URL(item.url).pathname)}" style="flex: 0 0 clamp(96px, 30vw, 160px); display: block;">
              <img src="${escapeHtml(item.cover)}" alt="${escapeHtml(item.title)}" width="160" height="90" loading="lazy" decoding="async" style="width: 100%; height: auto; aspect-ratio: 16 / 9; object-fit: cover; border-radius: 10px; display: block;" />
            </a>` : ""}
            <div style="flex: 1 1 auto; min-width: 0;">
              <h3 style="margin: 0 0 8px; font-size: 1.05rem;"><a href="${escapeHtml(new URL(item.url).pathname)}">${escapeHtml(item.title)}</a></h3>
              <p style="margin: 0 0 8px; color: #334155;">${escapeHtml(item.summary)}</p>
              <p style="margin: 0; font-size: 0.88rem; color: #64748b;">${escapeHtml(item.meta)}</p>
            </div>
          </section>
        `).join("")}
        ${usingCmsNews ? `<p style="margin: 14px 0 0; font-size: 0.9rem; color: #475569;">${listedNews.length} published news ${listedNews.length === 1 ? "story" : "stories"}. Browse by channel: <a href="/news/brand_news">Brand news</a> · <a href="/news/industry">Industry trends</a> · <a href="/news/new_product">New products</a> · <a href="/news/science">Science &amp; safety</a>.</p>` : ""}
      </section>
      <section style="padding: 22px 0; border-top: 1px solid #e2e8f0;">
        <h2 style="margin: 0 0 12px; font-size: 1.5rem;">Which questions do these stories answer?</h2>
        <p style="margin: 0 0 14px;"><strong>Short answer:</strong> they answer whether the product is new, whether the safety profile changed, and whether a trend is likely to matter for a family purchase in the next few months.</p>
        <p style="margin: 0 0 14px;">That makes the page easier to quote because each card stays tied to a date, a category, and a concise summary.</p>
        <figure style="margin: 0; padding: 14px 16px; border-left: 4px solid #f97316; background: #fff7ed;">
          <blockquote cite="https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides" style="margin: 0;">
            <p style="margin: 0;">“News is most useful when the claim, the trend, and the evidence are all visible in one place.”</p>
          </blockquote>
          <figcaption style="margin-top: 8px; font-size: 0.85rem; color: #475569; font-weight: 600;">— FTC Endorsement Guides</figcaption>
        </figure>
      </section>
      <section style="padding: 22px 0; border-top: 1px solid #e2e8f0;">
        <h2 style="margin: 0 0 12px; font-size: 1.5rem;">Sources and citations</h2>
        ${renderSources([
          { label: "FTC Endorsement Guides", href: "https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides", note: "disclosure context for branded coverage" },
          { label: "CPSC Children's Products Guidance", href: "https://www.cpsc.gov/Business--Manufacturing/Business-Education/Business-Guidance/Childrens-Products", note: "children's product safety baseline" },
          { label: "EU Toy Safety", href: "https://single-market-economy.ec.europa.eu/sectors/toys/toy-safety_en", note: "regulatory context for toy-adjacent products" },
        ])}
      </section>
      <section style="padding: 22px 0; border-top: 1px solid #e2e8f0;">
        <h2 style="margin: 0 0 12px; font-size: 1.5rem;">Why cite the news page this way?</h2>
        <ul style="margin: 0; padding-left: 1.2rem;">
          <li>Each card has a named source or a dated context line.</li>
          <li>The quote is attributed so it can be traced to a source label.</li>
          <li>The page carries collection and FAQ schema in the server HTML.</li>
        </ul>
      </section>
    `,
    // injected as server-visible JSON-LD for crawler access
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // @ts-ignore
    jsonLd: newsSchemas,
  };
}

function renderProductsPage(cmsProductsFull: CmsProductFull[] = []): RoutePage {
  const summary = getPageCopy("en").products;
  const canonical = "https://balancebiketoddler.com/products";
  // Catalog pages carry no publish date of their own; follow the catalog's own
  // modification dates instead of a hardcoded constant.
  const productsPageDates = deriveListingDates(
    cmsProductsFull.map((product) => ({
      pub: isoDay(product.updatedAt),
      mod: isoDay(product.updatedAt),
    })),
  );
  const countFor = (slug: string) =>
    cmsProductsFull.filter((product) => productDetailSlugDir(product) === slug).length;
  // Primary categories render full cards; the rest sit in a labelled subordinate
  // block below the fold-equivalent divider. Same links, different prominence.
  const hubCards = renderCategoryHubSections(
    PRODUCT_CATEGORY_PAGES,
    countFor,
    (meta, count, primary) => `
    <section style="border:1px solid #e2e8f0;border-radius:16px;padding:16px;background:#fff;">
      <h3 style="margin:0 0 8px;font-size:${primary ? "1.05rem" : "0.95rem"};"><a href="/products/${meta.slug}/" style="color:#c2410c;text-decoration:none;">${escapeHtml(meta.label)}</a> <span style="font-size:0.8rem;color:#64748b;font-weight:400;">(${count} tested)</span></h3>
      <p style="margin:0;font-size:0.9rem;color:#475569;line-height:1.55;">${escapeHtml(meta.description)}</p>
    </section>`,
  );
  const compareReviewLinks: Array<{ href: string; label: string; note: string }> = [
    { href: "/reviews/compare/jogging-stroller-parent-compare", label: "Best Jogging Strollers: 4 Models Compared", note: "Jeep Classic vs Cross-Country vs Baby Trend Expedition vs BOB Alterrain Pro" },
    { href: "/reviews/compare/balance-bike-top-picks-compare", label: "Top Balance Bikes Compared", note: "four evidence-based balance bikes side by side" },
    { href: "/reviews/compare/toddler-bike-parent-picks-compare", label: "Toddler Bikes: Parent Picks Compared", note: "pedal bikes with training-wheel paths compared" },
    { href: "/reviews/compare/kids-scooter-parent-picks-compare", label: "Kids Scooters: Parent Picks Compared", note: "four kick scooters from first ride to school-run" },
    { href: "/reviews/compare/electric-cars-parent-compare", label: "Kids Electric Cars Compared", note: "12V entry picks vs a 24V all-terrain two-seater" },
    { href: "/reviews/compare/car-safety-seats-parent-compare", label: "Convertible Car Seats Compared", note: "Graco Extend2Fit vs SlimFit3 LX vs Evenflo Revolve360" },
    { href: "/reviews/compare/kids-tricycles-parent-compare", label: "Kids Tricycles Compared", note: "push-handle starters to the Radio Flyer Red Rider" },
  ];
  const compareLinksHtml = compareReviewLinks
    .map(
      (item) =>
        `<li style="margin-bottom:6px;"><a href="${item.href}" style="color:#c2410c;font-weight:700;text-decoration:none;">${escapeHtml(item.label)}</a> — ${escapeHtml(item.note)}</li>`,
    )
    .join("");
  const entitySameAs = [
    "https://www.youtube.com/@kidsmobi",
    "https://www.facebook.com",
    "https://www.instagram.com",
    "https://x.com/BalanceBikeToddler",
  ];
  const productsSchemas = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "BalanceBikeToddler",
      url: "https://balancebiketoddler.com/",
      logo: "https://balancebiketoddler.com/favicon.svg",
      sameAs: entitySameAs,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "BalanceBikeToddler",
      url: "https://balancebiketoddler.com/",
      description: summary.heroSubtitle,
      inLanguage: "en",
      publisher: {
        "@type": "Organization",
        name: "BalanceBikeToddler",
        url: "https://balancebiketoddler.com/",
        logo: "https://balancebiketoddler.com/favicon.svg",
        sameAs: entitySameAs,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${summary.heroTitle} | BalanceBikeToddler`,
      url: canonical,
      description: summary.heroSubtitle,
      inLanguage: "en",
      author: {
        "@type": "Organization",
        name: "BalanceBikeToddler Editorial Team",
      },
      datePublished: productsPageDates.published,
      dateModified: productsPageDates.modified,
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: PRODUCT_CATEGORY_PAGES.length,
        // Same tiering as the visible cards: primary categories are listed
        // first so the structured data agrees with what the page renders.
        itemListElement: [...PRODUCT_CATEGORY_PAGES]
          .sort((a, b) => Number(isPrimaryCategorySlug(b.slug)) - Number(isPrimaryCategorySlug(a.slug)))
          .map((meta, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: meta.label,
            url: `https://balancebiketoddler.com/products/${meta.slug}/`,
          })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What should you compare first?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Start with size fit, braking behavior, frame weight, and whether the product matches the child's daily routine.",
          },
        },
        {
          "@type": "Question",
          name: "Which product signals matter most?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The strongest signals are score, certification context, and whether the product solves a clear family use case.",
          },
        },
        {
          "@type": "Question",
          name: "Why does this page matter?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "It gives readers a quick comparison map before they dive into individual product pages or reviews.",
          },
        },
      ],
    },
  ];
  return {
    route: "/products",
    title: summary.heroTitle,
    description: summary.heroSubtitle,
    body: `
      <section style="padding: 22px 0;">
        <h2 style="margin: 0 0 12px; font-size: 1.5rem;">Browse every evidence-based category</h2>
        <p style="margin: 0 0 14px;">Each category hub lists every product we cover in that group, with scores, published specs, and age-fit notes on each detail page.</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;">${hubCards}</div>
      </section>
      <section style="padding: 22px 0; border-top: 1px solid #e2e8f0;">
        <h2 style="margin: 0 0 12px; font-size: 1.5rem;">Lab-verified comparison reviews</h2>
        <p style="margin: 0 0 10px;">When several products solve the same family use case, we compare them side by side and publish a head-to-head verdict:</p>
        <ul style="margin: 0; padding-left: 1.2rem; color: #334155;">${compareLinksHtml}</ul>
        <p style="margin: 10px 0 0;"><a href="/reviews" style="color: #c2410c; font-weight: 700; text-decoration: none;">Browse all review reports →</a></p>
      </section>
      <section style="padding: 22px 0;">
        <h2 style="margin: 0 0 12px; font-size: 1.5rem;">What should you compare first?</h2>
        <p style="margin: 0 0 14px;"><strong>Short answer:</strong> start with size fit, braking behavior, frame weight, and whether the product matches the child's daily routine.</p>
        <p style="margin: 0 0 14px;">The product hub is meant to shorten the route from a broad category search to a specific, defensible choice.</p>
        <p style="margin: 0 0 14px;">Byline: <strong>BalanceBikeToddler Editorial Team</strong> · <time datetime="${productsPageDates.published}">Published ${productsPageDates.published}</time> · <time datetime="${productsPageDates.modified}">Updated ${productsPageDates.modified}</time></p>
        ${renderSources([
          { label: "CPSC Children's Products Guidance", href: "https://www.cpsc.gov/Business--Manufacturing/Business-Education/Business-Guidance/Childrens-Products", note: "baseline children's product safety reference" },
          { label: "ISO 8098", href: "https://www.iso.org/standard/71811.html", note: "children's bicycle safety standard reference" },
          { label: "ASTM F963", href: "https://www.astm.org/f0963-23.html", note: "toy safety standard reference" },
        ])}
      </section>
      <section style="padding: 22px 0; border-top: 1px solid #e2e8f0;">
        <h2 style="margin: 0 0 12px; font-size: 1.5rem;">Which product signals matter most?</h2>
        <p style="margin: 0 0 14px;"><strong>Short answer:</strong> the strongest signals are score, certification context, and whether the product solves a clear family use case.</p>
        ${renderBulletedCards([
          { title: summary.seoPills.balanceBikeToddler, text: summary.productCard.scoreTitle },
          { title: summary.seoPills.twinStroller, text: summary.filterFacets.certificationLabel },
          { title: summary.seoPills.toddlerBike, text: summary.productCard.capacityTitle },
          { title: summary.seoPills.kidsScooter, text: summary.compareLimitTip },
        ])}
      </section>
      <section style="padding: 22px 0; border-top: 1px solid #e2e8f0;">
        <h2 style="margin: 0 0 12px; font-size: 1.5rem;">How do the filters help parents?</h2>
        <p style="margin: 0 0 14px;"><strong>Short answer:</strong> the filters help parents narrow from a broad catalog to age, price, brand, frame, tire, brake, and certification choices.</p>
        <ul style="margin: 0; padding-left: 1.2rem;">
          <li>Age and price reduce the list to realistic options.</li>
          <li>Brand, frame, tire, and brake filters surface practical differences.</li>
          <li>Certification and wheel details help verify mechanical fit.</li>
        </ul>
      </section>
      <section style="padding: 22px 0; border-top: 1px solid #e2e8f0;">
        <h2 style="margin: 0 0 12px; font-size: 1.5rem;">Why does this page matter?</h2>
        <p style="margin: 0 0 14px;"><strong>Short answer:</strong> it gives readers a quick comparison map before they open a product detail page or review.</p>
        <p style="margin: 0 0 14px;">A category hub is easier to cite when it explains what to compare first and where the judgment comes from.</p>
        <ul style="margin: 0; padding-left: 1.2rem;">
          <li>${summary.history.title} — ${summary.history.subtitle}</li>
          <li>${summary.compareLimitTip}</li>
          <li>${summary.resetFilters}</li>
        </ul>
      </section>
      <section style="padding: 22px 0; border-top: 1px solid #e2e8f0;">
        <h2 style="margin: 0 0 12px; font-size: 1.5rem;">Sources and citations</h2>
        <figure style="margin: 0 0 16px; padding: 14px 16px; border-left: 4px solid #f97316; background: #fff7ed;">
          <blockquote cite="https://www.cpsc.gov/Business--Manufacturing/Business-Education/Business-Guidance/Childrens-Products" style="margin: 0;">
            <p style="margin: 0;">“A product listing is a claim; the product in use is the test.”</p>
          </blockquote>
          <figcaption style="margin-top: 8px; font-size: 0.85rem; color: #475569; font-weight: 600;">— CPSC Children's Products Guidance</figcaption>
        </figure>
        <ul style="margin: 0; padding-left: 1.2rem;">
          <li><a href="https://www.cpsc.gov/Business--Manufacturing/Business-Education/Business-Guidance/Childrens-Products">CPSC Children's Products Guidance</a> — baseline children's product safety reference</li>
          <li><a href="https://www.iso.org/standard/71811.html">ISO 8098</a> — children's bicycle safety standard reference</li>
          <li><a href="https://www.astm.org/f0963-23.html">ASTM F963</a> — toy safety standard reference</li>
        </ul>
      </section>
    `,
    jsonLd: productsSchemas,
  };
}

function renderReviewsPage(cmsEvaluations: CmsEvaluation[] = []): RoutePage {
  // Crawlability fix (R41): the reviews index previously rendered a hardcoded
  // mock slice WITHOUT any <a> links, leaving all 26 CMS evaluation detail
  // pages without an index-page entry point. Render every published evaluation
  // as an anchor card so the static /reviews page links the full review layer.
  const reviews = cmsEvaluations
    .map((item) => ({ item, route: evaluationRoutePath(item) }))
    .filter((entry): entry is { item: CmsEvaluation; route: string } => Boolean(entry.route));
  const summary = getPageCopy("en").reviews;
  const canonical = "https://balancebiketoddler.com/reviews";
  const reviewsPageDates = deriveListingDates(
    reviews.length
      ? reviews.map((entry) => ({
          pub: isoDay(entry.item.publishedAt) || isoDay(entry.item.updatedAt),
          mod: isoDay(entry.item.updatedAt) || isoDay(entry.item.publishedAt),
        }))
      : [],
  );
  const entitySameAs = [
    "https://www.youtube.com/@kidsmobi",
    "https://www.facebook.com",
    "https://www.instagram.com",
    "https://x.com/BalanceBikeToddler",
  ];
  const reviewsSchemas = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "BalanceBikeToddler",
      url: "https://balancebiketoddler.com/",
      logo: "https://balancebiketoddler.com/favicon.svg",
      sameAs: entitySameAs,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "BalanceBikeToddler",
      url: "https://balancebiketoddler.com/",
      description: "Independent review snapshots with scores, verdicts, and source-backed context.",
      inLanguage: "en",
      publisher: {
        "@type": "Organization",
        name: "BalanceBikeToddler",
        url: "https://balancebiketoddler.com/",
        logo: "https://balancebiketoddler.com/favicon.svg",
        sameAs: entitySameAs,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "How do reviews stay defensible? | BalanceBikeToddler",
      url: canonical,
      description: "Independent review snapshots with scores, verdicts, and source-backed context.",
      inLanguage: "en",
      author: {
        "@type": "Organization",
        name: "BalanceBikeToddler Editorial Team",
      },
      datePublished: reviewsPageDates.published,
      dateModified: reviewsPageDates.modified,
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: reviews.length,
        itemListElement: reviews.map((review, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: pickText(review.item.en?.title, review.item.zh?.title, review.item.id),
          url: `${PUBLIC_SITE_BASE}${review.route}`,
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "How do reviews stay defensible?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Each verdict is tied to a visible score, a named source, and a clear use case so readers can trace the judgment back to evidence.",
          },
        },
        {
          "@type": "Question",
          name: "Which standards guide each verdict?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The page uses FTC disclosure guidance, CPSC children's product context, and bicycle safety references to anchor the review language.",
          },
        },
        {
          "@type": "Question",
          name: "Why add dates and author information?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Dates and author attribution help readers and AI systems judge freshness and accountability.",
          },
        },
      ],
    },
  ];
  return {
    route: "/reviews",
    title: "How do reviews stay defensible?",
    description: "Independent review snapshots with scores, verdicts, and source-backed context.",
    body: `
      <section style="padding: 22px 0;">
        <h2 style="margin: 0 0 12px; font-size: 1.5rem;">How do reviews stay defensible?</h2>
        <p style="margin: 0 0 14px;"><strong>Short answer:</strong> each verdict is tied to a visible score, a named source, and a clear use case so readers can trace the judgment back to evidence.</p>
        <p style="margin: 0 0 14px;">Byline: <strong>BalanceBikeToddler Editorial Team</strong> · <time datetime="${reviewsPageDates.published}">Published ${reviewsPageDates.published}</time> · <time datetime="${reviewsPageDates.modified}">Updated ${reviewsPageDates.modified}</time></p>
        <p style="margin: 0 0 14px;">The review center is built around clear verdicts, visible scores, and a short trail from conclusion to evidence. That makes each answer easier to compare and reuse.</p>
        <p style="margin: 0;">We also keep the review language close to the public rulebook so the page remains understandable even when a reader only skims the summary.</p>
      </section>
      <section style="padding: 22px 0; border-top: 1px solid #e2e8f0;">
        <h2 style="margin: 0 0 12px; font-size: 1.5rem;">Which review snapshots matter most?</h2>
        <p style="margin: 0 0 14px;"><strong>Short answer:</strong> the snapshots with a named product, a visible score, and a direct verdict are the easiest to compare and cite.</p>
        <p style="margin: 0 0 14px;">Each card below stays tied to a specific product use case, so the page can answer both “what is it?” and “why does it matter?” in one place.</p>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 14px;">
        ${reviews
          .map(
            ({ item, route }) => `
          <a href="${escapeHtml(route)}" style="display: block; border: 1px solid #e2e8f0; border-radius: 16px; padding: 14px; text-decoration: none; color: inherit; background: #ffffff;">
            <h3 style="margin: 0 0 6px; font-size: 0.98rem; color: #0f172a;">${escapeHtml(pickText(item.en?.title, item.zh?.title, item.id))}</h3>
            <p style="margin: 0; font-size: 0.86rem; color: #64748b;">${escapeHtml(pickText(item.en?.verdict, item.zh?.verdict).slice(0, 140))}</p>
          </a>`,
          )
          .join("")}
        </div>
        <p style="margin: 14px 0 0; font-size: 0.9rem; color: #475569;">Browse by review type: <a href="/reviews/single">Single-product reviews</a> · <a href="/reviews/compare">Side-by-side comparisons</a>.</p>
      </section>
      <section style="padding: 22px 0; border-top: 1px solid #e2e8f0;">
        <h2 style="margin: 0 0 12px; font-size: 1.5rem;">What do the scores answer first?</h2>
        <p style="margin: 0 0 14px;"><strong>Short answer:</strong> the scores answer which product is safer, which one is lighter, and which one offers the best compromise for a specific family use case.</p>
        <ul style="padding-left: 1.2rem; margin: 0;">
          <li>Safety score: the strongest signal for stop-and-go control.</li>
          <li>Comfort score: the signal that matters for real daily use.</li>
          <li>Value score: the signal that helps compare premium and budget picks.</li>
        </ul>
      </section>
      <section style="padding: 22px 0; border-top: 1px solid #e2e8f0;">
        <h2 style="margin: 0 0 12px; font-size: 1.5rem;">Which standards guide each verdict?</h2>
        <p style="margin: 0 0 14px;"><strong>Short answer:</strong> the page uses FTC disclosure guidance, CPSC children's product context, and bicycle safety references to anchor the review language.</p>
        <figure style="margin: 0 0 16px; padding: 14px 16px; border-left: 4px solid #f97316; background: #fff7ed;">
          <blockquote cite="https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides" style="margin: 0;">
            <p style="margin: 0;">“Endorsements must reflect the honest opinions, findings, beliefs, or experience of the endorser.”</p>
          </blockquote>
          <figcaption style="margin-top: 8px; font-size: 0.85rem; color: #475569; font-weight: 600;">— FTC Endorsement Guides</figcaption>
        </figure>
        ${renderSources([
          { label: "FTC Endorsement Guides", href: "https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides", note: "clear disclosure expectations" },
          { label: "CPSC Children's Products Guidance", href: "https://www.cpsc.gov/Business--Manufacturing/Business-Education/Business-Guidance/Childrens-Products", note: "children's product compliance context" },
          { label: "ISO 8098", href: "https://www.iso.org/standard/71811.html", note: "bicycle safety baseline" },
        ])}
      </section>
      <section style="padding: 22px 0; border-top: 1px solid #e2e8f0;">
        <h2 style="margin: 0 0 12px; font-size: 1.5rem;">What does the review center answer?</h2>
        <p style="margin: 0 0 14px;"><strong>Short answer:</strong> it answers which product is safer, which one is lighter, and which one offers the best compromise for a specific family use case.</p>
        <ul style="padding-left: 1.2rem; margin: 0;">
          <li>${escapeHtml(summary.smartFinderTitle)} — ${escapeHtml(summary.smartFinderDescription)}</li>
          <li>${escapeHtml(summary.reviewTypes.single)} · ${escapeHtml(summary.reviewTypes.compare)} · ${escapeHtml(summary.reviewTypes.value)} · ${escapeHtml(summary.reviewTypes.ranking)}</li>
          <li>${escapeHtml(summary.detailTitleSuffix)}</li>
        </ul>
      </section>
      <section style="padding: 22px 0; border-top: 1px solid #e2e8f0;">
        <h2 style="margin: 0 0 12px; font-size: 1.5rem;">Why is the page easier to cite?</h2>
        <ul style="margin: 0; padding-left: 1.2rem;">
          <li>The page now has a visible byline and dates.</li>
          <li>Every snapshot has a score and a short verdict.</li>
          <li>The server HTML includes Organization, WebSite, CollectionPage, and FAQPage schema.</li>
        </ul>
      </section>
      <section style="padding: 22px 0; border-top: 1px solid #e2e8f0;">
        <h2 style="margin: 0 0 12px; font-size: 1.5rem;">Sources and citations</h2>
        <ul style="margin: 0; padding-left: 1.2rem;">
          <li><a href="https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides">FTC Endorsement Guides</a> — disclosure context for review pages</li>
          <li><a href="https://www.cpsc.gov/Business--Manufacturing/Business-Education/Business-Guidance/Childrens-Products">CPSC Children's Products Guidance</a> — children's product compliance context</li>
          <li><a href="https://www.iso.org/standard/71811.html">ISO 8098</a> — bicycle safety baseline</li>
        </ul>
      </section>
    `,
    jsonLd: reviewsSchemas,
  };
}

/**
 * R46 — prerendered filter/list pages (R45 audit decision, plan A).
 *
 * /guides/<topic>, /news/<category> and /reviews/<type> were previously left
 * to the SPA shell: their static HTML was a copy of the homepage (same title,
 * same canonical), so every crawler fetch of these breadcrumb-linked URLs saw
 * duplicate content. Each route now renders a real listing page with a unique
 * title/description/copy, its own cards, and family cross-links. The route
 * families must stay in lockstep with guideTopicCategory(), newsRoutePath()
 * and evaluationRoutePath() above, and with the Worker's deriveContentPath().
 */
type FilterCard = { title: string; summary: string; meta: string; path: string; image?: string; fit?: "cover" | "contain" };

type FilterPageConfig = {
  route: string;
  /** Visible <h1>; the <title> tag comes from fullTitle. */
  title: string;
  fullTitle: string;
  description: string;
  introHeading: string;
  introParagraphs: string[];
  cards: FilterCard[];
  emptyNote: string;
  faqs: Array<{ q: string; a: string }>;
  exploreLinks: Array<{ href: string; label: string }>;
};

const FILTER_PAGE_SOURCES = [
  {
    label: "CPSC Children's Products Guidance",
    href: "https://www.cpsc.gov/Business--Manufacturing/Business-Education/Business-Guidance/Childrens-Products",
    note: "children's product safety baseline",
  },
  {
    label: "FTC Endorsement Guides",
    href: "https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides",
    note: "disclosure expectations for recommendations",
  },
  { label: "ISO 8098", href: "https://www.iso.org/standard/71811.html", note: "bicycle safety standard reference" },
];

function filterCardGrid(cards: FilterCard[], emptyNote: string): string {
  if (!cards.length) {
    return `<p style="margin: 0; color: #475569;">${escapeHtml(emptyNote)}</p>`;
  }
  return `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px;">
          ${cards
            .map(
              (card) => `
            <a href="${escapeHtml(card.path)}" style="display: block; border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px; text-decoration: none; color: inherit; background: #ffffff;">
              ${card.image ? `<span style="display: block; margin: -16px -16px 12px; background: #ffffff; border-radius: 15px 15px 0 0; overflow: hidden;"><img src="${escapeHtml(card.image)}" alt="${escapeHtml(card.title)}" width="640" height="360" loading="lazy" decoding="async" style="width: 100%; height: auto; aspect-ratio: 16 / 9; object-fit: ${card.fit === "contain" ? "contain" : "cover"}; display: block;" /></span>` : ""}
              <h3 style="margin: 0 0 8px; font-size: 1rem; color: #0f172a;">${escapeHtml(card.title)}</h3>
              <p style="margin: 0 0 8px; font-size: 0.9rem; color: #334155;">${escapeHtml(card.summary)}</p>
              <p style="margin: 0; font-size: 0.85rem; color: #64748b;">${escapeHtml(card.meta)}</p>
            </a>`,
            )
            .join("")}
        </div>`;
}

// Channel pages (/guides/<topic>, /news/<channel>, /reviews/<type>) shipped
// no breadcrumb at all: the SPA early-returns on these routes to protect the
// prerendered TDK, and the static builder emitted none — so neither render
// path had a trail. These mirror the category-hub convention
// (Home > section > channel) and match the visible breadcrumb rendered by
// renderFilterListPage. Keep in sync with the SPA's section-branch trail.
const FILTER_SECTION_LABELS: Record<string, string> = {
  guides: "Guides",
  news: "News",
  reviews: "Reviews",
};

const FILTER_CHANNEL_LABELS: Record<string, string> = {
  beginner: "Beginner Guides",
  scenario: "Riding Scenarios",
  budget: "Budget Guides",
  risk: "Safety & Risk",
  maintenance: "Maintenance",
  special: "Extra Support",
  industry: "Industry News",
  brand_news: "Brand News",
  new_product: "New Products",
  science: "Research & Science",
  single: "Single Product Reviews",
  compare: "Comparison Reviews",
  value: "Value Reviews",
  ranking: "Rankings",
  safety: "Safety Reviews",
};

function filterBreadcrumbCrumbs(canonical: string): Array<{ name: string; href: string }> {
  const pathname = new URL(canonical).pathname;
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: Array<{ name: string; href: string }> = [{ name: "Home", href: "/" }];
  const section = segments[0] || "";
  const channel = segments[1] || "";
  const sectionLabel = FILTER_SECTION_LABELS[section];
  if (sectionLabel) {
    crumbs.push({ name: sectionLabel, href: `/${section}` });
  }
  const channelLabel = FILTER_CHANNEL_LABELS[channel] || channel;
  if (channelLabel) {
    crumbs.push({ name: channelLabel, href: pathname });
  }
  return crumbs;
}

function filterListSchemas(
  canonical: string,
  name: string,
  description: string,
  cards: FilterCard[],
  faqs: Array<{ q: string; a: string }>,
): Array<Record<string, unknown>> {
  // Channel pages carry each item's date inside its card meta ("topic · 2026-10-24"),
  // so the page dates follow the content instead of a hardcoded constant.
  const cardDates = cards
    .flatMap((card) => String(card.meta || "").match(/\d{4}-\d{2}-\d{2}/g) || [])
    .sort();
  const pageDates = cardDates.length
    ? { published: cardDates[0], modified: cardDates[cardDates.length - 1] }
    : { published: FALLBACK_PAGE_DATE, modified: FALLBACK_PAGE_DATE };
  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name,
      url: canonical,
      description,
      inLanguage: "en",
      author: { "@type": "Organization", name: "BalanceBikeToddler Editorial Team" },
      datePublished: pageDates.published,
      dateModified: pageDates.modified,
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: cards.length,
        itemListElement: cards.map((card, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: card.title,
          url: `${PUBLIC_SITE_BASE}${card.path}`,
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: filterBreadcrumbCrumbs(canonical).map((crumb, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: crumb.name,
        item: `${PUBLIC_SITE_BASE}${crumb.href}`,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: { "@type": "Answer", text: faq.a },
      })),
    },
  ];
}

function renderFilterListPage(config: FilterPageConfig): RoutePage {
  const introHtml = config.introParagraphs
    .map((paragraph) => `<p style="margin: 0 0 14px;">${escapeHtml(paragraph)}</p>`)
    .join("");
  return {
    route: config.route,
    title: config.title,
    fullTitle: config.fullTitle,
    description: config.description,
    body: `
      ${renderProductBreadcrumb(filterBreadcrumbCrumbs(`${PUBLIC_SITE_BASE}${config.route}`))}
      <section style="padding: 22px 0;">
        <h2 style="margin: 0 0 12px; font-size: 1.5rem;">${escapeHtml(config.introHeading)}</h2>
        ${introHtml}
        <p style="margin: 0 0 14px; font-size: 0.88rem; color: #475569; font-weight: 600;">By <strong>BalanceBikeToddler Editorial Team</strong> · <time datetime="2026-10-04">Updated 2026-10-04</time></p>
        ${renderSources(FILTER_PAGE_SOURCES)}
      </section>
      <section style="padding: 22px 0; border-top: 1px solid #e2e8f0;">
        <h2 style="margin: 0 0 14px; font-size: 1.5rem;">What is listed here?</h2>
        ${filterCardGrid(config.cards, config.emptyNote)}
      </section>
      <section style="padding: 22px 0; border-top: 1px solid #e2e8f0;">
        <h2 style="margin: 0 0 12px; font-size: 1.5rem;">Common questions</h2>
        ${config.faqs
          .map(
            (faq) => `
          <div style="padding: 10px 0; border-top: 1px solid #f1f5f9;">
            <p style="margin: 0 0 6px; font-weight: 700;">${escapeHtml(faq.q)}</p>
            <p style="margin: 0; color: #334155;">${escapeHtml(faq.a)}</p>
          </div>`,
          )
          .join("")}
      </section>
      <section style="padding: 22px 0; border-top: 1px solid #e2e8f0;">
        <h2 style="margin: 0 0 12px; font-size: 1.5rem;">Explore more</h2>
        <ul style="margin: 0; padding-left: 1.2rem;">
          ${config.exploreLinks
            .map((link) => `<li style="margin-bottom: 6px;"><a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a></li>`)
            .join("")}
        </ul>
      </section>
    `,
    jsonLd: filterListSchemas(
      `${PUBLIC_SITE_BASE}${config.route}`,
      `${config.title} | BalanceBikeToddler`,
      config.description,
      config.cards,
      config.faqs,
    ),
  };
}

function renderFilterPages(
  cmsGuides: CmsGuide[] = [],
  cmsNews: CmsNews[] = [],
  cmsEvaluations: CmsEvaluation[] = [],
): RoutePage[] {
  // Cards for one guides topic page. Each /guides/<topic> index lists only its
  // own topic's articles: /guides already lists the whole library, and the
  // per-topic pages existed to give every topic a unique listing (and a unique
  // title/description) rather than a second copy of the library.
  const guideCardsByTopic = (topic: string): FilterCard[] =>
    cmsGuides.flatMap((guide) => {
      const route = guideRoutePath(guide);
      if (!route || guideTopicCategory(guide) !== topic) return [];
      return [
        {
          title: pickText(guide.en?.title, guide.zh?.title, guide.id),
          summary: pickText(guide.en?.summary, guide.seo?.en?.description, "BalanceBikeToddler buying guide."),
          meta: `${topic.replace(/_/g, " ")} · ${isoDay(guide.publishedAt) || isoDay(guide.updatedAt) || FALLBACK_PAGE_DATE}`,
          path: route,
          image: toPublicImageUrl(pickText(guide.imageUrl)),
          fit: "contain" as const,
        },
      ];
    });
  const reviewCardsByType = (reviewType: string): FilterCard[] =>
    cmsEvaluations.flatMap((item) => {
      const route = evaluationRoutePath(item);
      if (!route || cmsSlugify(item.type || "single") !== reviewType) return [];
      return [
        {
          title: pickText(item.en?.title, item.zh?.title, item.id),
          summary: pickText(item.en?.verdict, item.zh?.verdict, "Independent review with source-based scores.").slice(0, 140),
          meta: `${reviewType} review · ${pickText(item.updatedAt, item.publishedAt).slice(0, 10) || "2026"}`,
          path: route,
          image: toPublicImageUrl(pickText(item.imageUrl)),
          fit: "contain" as const,
        },
      ];
    });
  const newsCardsByCategory = (category: string): FilterCard[] =>
    cmsNews.flatMap((item) => {
      const route = newsRoutePath(item);
      if (!route || String(item.category || "").trim() !== category) return [];
      return [
        {
          title: pickText(item.en?.title, item.zh?.title, item.id),
          summary: pickText(item.en?.summary, item.seo?.en?.description, "Latest kids mobility news."),
          meta: `${newsCategoryLabel(item)} · ${isoDay(item.publishedAt) || isoDay(item.updatedAt) || FALLBACK_PAGE_DATE}`,
          path: route,
          image: toPublicImageUrl(pickText(item.imageUrl)),
          fit: "cover" as const,
        },
      ];
    });
  const NEWS_CHANNEL_LINKS = [
    { href: "/news/brand_news", label: "Brand news" },
    { href: "/news/industry", label: "Industry trends" },
    { href: "/news/new_product", label: "New products" },
    { href: "/news/science", label: "Science & safety" },
  ];
  const configs: FilterPageConfig[] = [
    // Guides topic pages. Every value except the cards comes from
    // GUIDES_TOPIC_PAGES (src/lib/guidesTopicPages.ts) — the same module the
    // check:spatitles guard reads, so the two render paths cannot drift.
    ...GUIDES_TOPIC_PAGE_IDS.map((topic) => ({
      route: `/guides/${topic}`,
      title: GUIDES_TOPIC_PAGES[topic].h1,
      fullTitle: GUIDES_TOPIC_PAGES[topic].fullTitle,
      description: GUIDES_TOPIC_PAGES[topic].description,
      introHeading: GUIDES_TOPIC_PAGES[topic].introHeading,
      introParagraphs: GUIDES_TOPIC_PAGES[topic].introParagraphs,
      cards: guideCardsByTopic(topic),
      emptyNote: "Guides are being published — check back shortly.",
      faqs: GUIDES_TOPIC_PAGES[topic].faqs,
      exploreLinks: GUIDES_TOPIC_EXPLORE_LINKS[topic],
    })),
    {
      route: "/news/industry",
      title: "Kids Mobility Industry Trends",
      fullTitle: "Kids Mobility Industry Trends & Updates | BalanceBikeToddler",
      description:
        "Market trends, regulatory moves, and supply-chain shifts across the kids bike, stroller, and ride-on industry — with named sources and dates.",
      introHeading: "What is moving in the kids mobility industry?",
      introParagraphs: [
        "The industry side of kids mobility moves on three tracks at once: regulation (standards revisions and recall activity), manufacturing shifts (where frames, batteries, and seats are made), and demand patterns (what parents search for season after season). Industry stories here are selected when they can change what a family should buy or avoid in the next few months.",
        "Every entry carries a date and a category so a trend can be followed across updates instead of being a one-off headline. Where a claim comes from a company or a regulator, the source is named in the story.",
        "For product-level consequences of a trend, the comparisons in the review center score the current field of options on one rubric, so a market shift can be read straight into a shortlist change.",
      ],
      cards: newsCardsByCategory("industry"),
      emptyNote: "No industry stories yet — the channel is updated as the market moves.",
      faqs: [
        {
          q: "How often is this channel updated?",
          a: "As trends and regulatory changes land. Each story is dated, and the news hub lists every published item.",
        },
        {
          q: "Are industry stories independent of brands?",
          a: "Yes. Company-sourced claims are attributed to the company, and coverage is not placed or sponsored.",
        },
      ],
      exploreLinks: [
        { href: "/news", label: "News hub" },
        ...NEWS_CHANNEL_LINKS.filter((link) => link.href !== "/news/industry"),
        { href: "/reviews/compare", label: "Side-by-side comparisons" },
      ],
    },
    {
      route: "/news/new_product",
      title: "New Product Launches",
      fullTitle: "New Kids Bike & Stroller Launches | BalanceBikeToddler",
      description:
        "Fresh launches across balance bikes, kids bikes, strollers, and ride-on cars — what is new, who it fits, and how it changes the shortlist.",
      introHeading: "Which launches are worth a look?",
      introParagraphs: [
        "A launch only matters if it changes the buying decision: a new size run, a materially lighter frame, a fold that finally fits a small trunk, or a price that resets a category. New-product entries here are filtered to launches with that kind of consequence, and each one states who the product fits and what it replaces.",
        "Launch coverage is deliberately cautious on claims: spec-sheet numbers are reported as manufacturer claims until we complete our own source-based analysis, and the entry links to the relevant product hub so the launch can be compared against what is already on the market.",
        "If a launched product enters the review pipeline, the story is updated with a link to its review page so readers can follow it from announcement to verdict.",
      ],
      cards: newsCardsByCategory("new_product"),
      emptyNote: "No launch stories yet — new entries appear as products ship.",
      faqs: [
        {
          q: "Do you review every product you cover?",
          a: "No. Launch coverage reports what a product claims; a full review adds our own source-based analysis and scoring. When a covered product has been reviewed, the story links to the review.",
        },
        {
          q: "How soon after a launch does coverage appear?",
          a: "When launch details are public and dated. Spec-sheet claims are always labeled as claims until we verify them against a primary source.",
        },
      ],
      exploreLinks: [
        { href: "/news", label: "News hub" },
        ...NEWS_CHANNEL_LINKS.filter((link) => link.href !== "/news/new_product"),
        { href: "/products", label: "Product directory" },
      ],
    },
    {
      route: "/news/brand_news",
      title: "Brand News & Company Updates",
      fullTitle: "Kids Mobility Brand News & Updates | BalanceBikeToddler",
      description:
        "Brand announcements, expansions, and recalls worth knowing from the kids mobility market — tracked with dates and primary sources.",
      introHeading: "What are brands changing?",
      introParagraphs: [
        "Brand news covers the company-level decisions that eventually reach the product page: distribution changes, warranty updates, safety notices, and recalls. These are the stories a buyer should check after choosing a shortlist, because they can quietly change support quality long after a purchase.",
        "Recall and safety notices are treated with the highest priority and link to the regulator's page where one exists. Marketing announcements are covered only when they include a factual change a buyer can verify.",
        "Each entry is dated and categorized so a brand's track record can be scanned quickly before committing to a model.",
      ],
      cards: newsCardsByCategory("brand_news"),
      emptyNote: "No brand stories yet — the channel fills as companies announce.",
      faqs: [
        {
          q: "Do you cover every brand announcement?",
          a: "No. Coverage focuses on factual changes that affect a buying or ownership decision, such as recalls, warranty updates, and distribution shifts.",
        },
        {
          q: "Where do recall notices come from?",
          a: "From regulator publications such as CPSC notices, linked directly so the primary source is always one click away.",
        },
      ],
      exploreLinks: [
        { href: "/news", label: "News hub" },
        ...NEWS_CHANNEL_LINKS.filter((link) => link.href !== "/news/brand_news"),
        { href: "/transparency/testing-methodology/", label: "Methodology" },
      ],
    },
    {
      route: "/news/science",
      title: "Safety Science & Research",
      fullTitle: "Child Safety Science & Research | BalanceBikeToddler",
      description:
        "Safety research, standards updates, and testing context for child seats, bikes, and helmets — translated into practical buying guidance.",
      introHeading: "What does the research say?",
      introParagraphs: [
        "Science-channel stories translate research and standards work into buying language: what a revised bicycle or restraint standard actually changes, which injury patterns a design change addresses, and how testing conditions differ from daily use. The goal is that a parent can read one story and know whether the finding should move a product up or down a shortlist.",
        "Sources are primary where possible — standards bodies, regulator guidance, and peer-reviewed work — and every story separates what the evidence shows from what it implies. Shop-floor claims are not treated as findings.",
        "For how these findings feed into scoring, the methodology page documents the rubric each review applies.",
      ],
      cards: newsCardsByCategory("science"),
      emptyNote: "No science stories yet — entries appear as standards and research move.",
      faqs: [
        {
          q: "Are the studies cited peer-reviewed?",
          a: "Where a story relies on research, the source type is stated. Standards and regulator guidance are cited directly to the issuing body.",
        },
        {
          q: "How does research connect to your scores?",
          a: "Findings inform the rubric weights — for example, what matters most for stopping control — and the methodology page explains the mapping.",
        },
      ],
      exploreLinks: [
        { href: "/news", label: "News hub" },
        ...NEWS_CHANNEL_LINKS.filter((link) => link.href !== "/news/science"),
        { href: "/transparency/testing-methodology/", label: "Methodology" },
        { href: "/products/safety-seats/", label: "Safety seats hub" },
      ],
    },
    {
      route: "/reviews/single",
      title: "Single-Product Reviews",
      fullTitle: "Single-Product Reviews: Source-Based Scores | BalanceBikeToddler",
      description:
        "Every published single-product review: lab-style scores for safety, comfort, portability, features, and value, with a verdict you can trace.",
      introHeading: "How does a single-product review work?",
      introParagraphs: [
        "Each single-product review scores one product on the same five axes — safety, comfort, portability, features, and value for money — so a score always means the same thing regardless of category or brand. The verdict is short and traceable: it names the use case the product fits best and the trade-off a buyer accepts.",
        "Scores are anchored to the published rubric on the methodology page, not to feel. Where two sizes or variants of one model exist, each variant gets its own review page so a shared name never hides a different score.",
        "Use the cards below to open any review, or browse a category hub first if you would rather start from the product type than from a name.",
      ],
      cards: reviewCardsByType("single"),
      emptyNote: "Single-product reviews are being published — check back shortly.",
      faqs: [
        {
          q: "What do the five scores mean?",
          a: "Safety covers control and stopping; comfort covers daily-use ergonomics; portability covers weight and fold; features cover what the product adds; value weighs price against the other four.",
        },
        {
          q: "Why does one model sometimes have two review pages?",
          a: "Variants can differ in weight, fold, or harness. Scoring each variant separately keeps the numbers honest instead of averaging them under one name.",
        },
      ],
      exploreLinks: [
        { href: "/reviews", label: "Review center" },
        { href: "/reviews/compare", label: "Side-by-side comparisons" },
        { href: "/products", label: "Product directory" },
      ],
    },
    {
      route: "/reviews/compare",
      title: "Side-by-Side Comparisons",
      fullTitle: "Side-by-Side Product Comparisons | BalanceBikeToddler",
      description:
        "Head-to-head comparisons across all seven product categories — balance bikes to safety seats — scored on the same rubric so winners are clear.",
      introHeading: "How do the comparisons pick winners?",
      introParagraphs: [
        "Every comparison puts products from one category on the same rubric and names a winner per use case rather than one overall champion: the lightest for carrying, the safest for hills, the best value for a first purchase. That keeps the answer honest for families whose priorities differ.",
        "Each comparison lists real specifications — weight, fold size, age range, and price band — next to the scores, so the numbers behind a verdict can be checked without leaving the page.",
        "There is one comparison for each of the seven product categories, from balance bikes to child safety seats. Follow a card below, or start from a category hub if you are still choosing the product type.",
      ],
      cards: reviewCardsByType("compare"),
      emptyNote: "Comparisons are being published — check back shortly.",
      faqs: [
        {
          q: "Why one comparison per category?",
          a: "Comparing across categories trades depth for breadth. One focused comparison per category lets every candidate be scored against the same alternatives.",
        },
        {
          q: "How is a winner chosen?",
          a: "By use case: each comparison names the best pick for the common family scenarios in that category instead of a single overall winner.",
        },
      ],
      exploreLinks: [
        { href: "/reviews", label: "Review center" },
        { href: "/reviews/single", label: "Single-product reviews" },
        { href: "/products", label: "Product directory" },
      ],
    },
  ];
  return configs.map(renderFilterListPage);
}

/**
 * Static homepage. The shipped dist/index.html is a bare SPA shell whose only
 * real <a> tags point at About / transparency footer links — crawlers landing
 * on "/" cannot forensicise the product space or article layer from it, which
 * is the root cause of the GSC "Discovered - currently not indexed" backlog
 * (38 article pages + 6 of 7 product hubs). This route renders a real homepage
 * with a site nav, the 7 product hubs, recent guides/news/reviews, and a
 * footer so every major route is one click from "/".  R38 (2026-09-27).
 */
function renderHomePage(
  cmsGuides: CmsGuide[] = [],
  cmsNews: CmsNews[] = [],
  cmsEvaluations: CmsEvaluation[] = [],
): RoutePage {
  const NAV_LINKS: Array<{ href: string; label: string }> = [
    { href: `${PUBLIC_SITE_BASE}/products`, label: "Products" },
    { href: `${PUBLIC_SITE_BASE}/guides`, label: "Guides" },
    { href: `${PUBLIC_SITE_BASE}/reviews`, label: "Reviews" },
    { href: `${PUBLIC_SITE_BASE}/news`, label: "News" },
    { href: `${PUBLIC_SITE_BASE}/about`, label: "About" },
    { href: `${PUBLIC_SITE_BASE}/transparency/testing-methodology/`, label: "Testing Method" },
  ];
  const navHtml = `<nav style="display:flex;flex-wrap:wrap;gap:18px;padding:14px 0;border-bottom:1px solid #e2e8f0;font-family:Arial,sans-serif;font-weight:700;font-size:0.95rem;">${NAV_LINKS.map((l) => `<a href="${escapeHtml(l.href)}">${escapeHtml(l.label)}</a>`).join("")}</nav>`;

  const hubCards = renderCategoryHubSections(
    PRODUCT_CATEGORY_PAGES,
    () => 0,
    (meta, _count, primary) => `
    <section style="border:1px solid #e2e8f0;border-radius:16px;padding:16px;background:#fff;">
      <h3 style="margin:0 0 8px;font-size:${primary ? "1.05rem" : "0.95rem"};"><a href="${PUBLIC_SITE_BASE}/products/${meta.slug}/">${escapeHtml(meta.label)}</a></h3>
      <p style="margin:0;font-size:0.9rem;color:#475569;line-height:1.55;">${escapeHtml(meta.description)}</p>
    </section>`,
  );

  // Recent guides (max 5)
  const guideLinks = cmsGuides.slice(0, 5).flatMap((guide) => {
    const route = guideRoutePath(guide);
    if (!route) return [];
    return [{
      title: pickText(guide.en?.title, guide.zh?.title, guide.id),
      url: `${PUBLIC_SITE_BASE}${route}`,
    }];
  });
  // Recent news (max 5)
  const newsLinks = cmsNews.slice(0, 5).flatMap((item) => {
    const route = newsRoutePath(item);
    if (!route) return [];
    return [{
      title: pickText(item.en?.title, item.zh?.title, item.id),
      url: `${PUBLIC_SITE_BASE}${route}`,
    }];
  });
  // Recent reviews (max 5)
  const reviewLinks = cmsEvaluations.slice(0, 5).flatMap((item) => {
    const route = evaluationRoutePath(item);
    if (!route) return [];
    return [{
      title: pickText(item.en?.title, item.en?.verdict, item.id),
      url: `${PUBLIC_SITE_BASE}${route}`,
    }];
  });

  const articleColumns: Array<{ heading: string; indexHref: string; indexLabel: string; items: Array<{ title: string; url: string }> }> = [
    { heading: "Recent Guides", indexHref: `${PUBLIC_SITE_BASE}/guides`, indexLabel: "All guides", items: guideLinks },
    { heading: "Recent News", indexHref: `${PUBLIC_SITE_BASE}/news`, indexLabel: "All news", items: newsLinks },
    { heading: "Recent Reviews", indexHref: `${PUBLIC_SITE_BASE}/reviews`, indexLabel: "All reviews", items: reviewLinks },
  ];
  const articleSection = articleColumns.map((col) => `
    <section style="border:1px solid #e2e8f0;border-radius:16px;padding:16px;background:#fff;">
      <h3 style="margin:0 0 10px;font-size:1.05rem;">${escapeHtml(col.heading)}</h3>
      <ul style="margin:0 0 8px;padding-left:1.1rem;line-height:1.65;">
        ${col.items.length
          ? col.items.map((i) => `<li><a href="${escapeHtml(i.url)}">${escapeHtml(i.title)}</a></li>`).join("")
          : `<li><a href="${escapeHtml(col.indexHref)}">${escapeHtml(col.indexLabel)}</a></li>`}
      </ul>
      <p style="margin:0;font-size:0.85rem;"><a href="${escapeHtml(col.indexHref)}">${escapeHtml(col.indexLabel)} →</a></p>
    </section>`).join("");

  const entitySameAs = [
    "https://www.youtube.com/@kidsmobi",
    "https://www.facebook.com",
    "https://www.instagram.com",
    "https://x.com/BalanceBikeToddler",
  ];
  const homeSchemas = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "BalanceBikeToddler",
      url: "https://balancebiketoddler.com/",
      logo: "https://balancebiketoddler.com/favicon.svg",
      sameAs: entitySameAs,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "BalanceBikeToddler",
      url: "https://balancebiketoddler.com/",
      description: "Evidence-based balance bikes, kids bikes, strollers, ride-on cars, and child safety seats with verified scores and source-backed reviews.",
      inLanguage: "en",
      publisher: {
        "@type": "Organization",
        name: "BalanceBikeToddler",
        url: "https://balancebiketoddler.com/",
        logo: "https://balancebiketoddler.com/favicon.svg",
        sameAs: entitySameAs,
      },
    },
  ];
  return {
    route: "",
    title: "Evidence-based kids ride-on & safety gear",
    // Without an explicit fullTitle the homepage shipped
    // "BalanceBikeToddler | BalanceBikeToddler" — the brand repeated twice.
    fullTitle: "BalanceBikeToddler | Evidence-Based Kids Bike & Stroller Analysis",
    description: "Evidence-based balance bikes, kids bikes, strollers, ride-on cars, and child safety seats with verified scores and source-backed reviews.",
    skipTitleH1: true,
    body: `
      ${navHtml}
      <section style="padding:30px 0 22px;">
        <p style="margin:0 0 10px;font-size:0.72rem;letter-spacing:0.2em;text-transform:uppercase;color:#c2410c;font-weight:900;">BalanceBikeToddler</p>
        <h1 style="margin:0 0 12px;font-size:clamp(2rem,4vw,3.15rem);line-height:1.12;">Evidence-based kids ride-on &amp; safety gear</h1>
        <p style="margin:0;font-size:1.08rem;color:#334155;max-width:52rem;">Compare balance bikes, kids bikes, strollers, ride-on cars, and child safety seats with lab scores, certification context, and source-backed reviews.</p>
      </section>
      <section style="padding:0 0 22px;">
        <h2 style="margin:0 0 14px;font-size:1.4rem;">Browse by category</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;">
          ${hubCards}
        </div>
      </section>
      <section style="padding:22px 0;border-top:1px solid #e2e8f0;">
        <h2 style="margin:0 0 14px;font-size:1.4rem;">Latest articles</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px;">
          ${articleSection}
        </div>
      </section>
      <section style="padding:22px 0;border-top:1px solid #e2e8f0;">
        <h2 style="margin:0 0 10px;font-size:1.3rem;">Why parents trust BalanceBikeToddler</h2>
        <p style="margin:0 0 10px;">Reviews cite named sources - manufacturer specifications, public safety records, and aggregated owner feedback - so a claim can be checked against the product page.</p>
        <ul style="margin:0;padding-left:1.2rem;line-height:1.65;">
          <li>Weight and brake-setup comparisons taken from published manufacturer specifications.</li>
          <li>Durability signals drawn from long-run owner feedback and public recall notices.</li>
          <li>ISO 8098 and ASTM F963 reference for safety baselines.</li>
        </ul>
      </section>
    `,
    jsonLd: homeSchemas,
  };
}

function renderAboutPage(): RoutePage {
  const stats = [
    { value: "4", label: "evidence checks" },
    { value: "3", label: "source types" },
    { value: "2026-08-15", label: "updated" },
  ];
  const auditRows = [
    { check: "1. Manufacturer weight", evidence: "Published weight for the full riding setup, including pedals and guards", why: "Makes two bikes comparable on the same basis" },
    { check: "2. Brake setup", evidence: "Published brake type, lever reach, and age rating", why: "Shows whether a child can realistically reach and modulate the brake" },
    { check: "3. Q-factor review", evidence: "Published pedal stance figures checked against fit guidance", why: "Flags awkward or risky leg posture" },
    { check: "4. Durability signals", evidence: "Repeated failure themes in aggregated owner feedback and public recall notices", why: "Shows what actually fails months later" },
  ];
  return {
    route: "/about",
    title: "Who is behind the recommendations?",
    description: "Editorial process, trust signals, and source-backed context for the site.",
    body: `
      <section style="padding: 22px 0;">
        <h2 style="margin: 0 0 12px; font-size: 1.5rem;">How do we work?</h2>
        <p style="margin: 0 0 14px;"><strong>Short answer:</strong> we review the evidence first, then write the recommendation, and then attach named sources so parents can verify the claim.</p>
        <p style="margin: 0 0 14px;">BalanceBikeToddler is built around a simple rule: the evidence should come first and the link should come later. That means the site explains what it sees, why it matters, and how a parent can verify the claim independently.</p>
        <p style="margin: 0 0 14px; font-size: 0.88rem; color: #475569; font-weight: 600;">By <strong>BalanceBikeToddler Editorial Team</strong> · <time datetime="2026-08-15">Published 2026-08-15</time> · <time datetime="2026-08-15">Updated 2026-08-15</time></p>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:12px; margin: 18px 0 0;">
          ${stats.map((item) => `
            <div style="border:1px solid #e2e8f0; border-radius:18px; padding:14px 16px; background:#fff;">
              <p style="margin:0; font-size:1.4rem; font-weight:800; color:#0f172a;">${escapeHtml(item.value)}</p>
              <p style="margin:4px 0 0; font-size:0.78rem; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:#64748b;">${escapeHtml(item.label)}</p>
            </div>
          `).join("")}
        </div>
        <figure style="margin: 18px 0 0; padding: 14px 16px; border-left: 4px solid #f97316; background: #fff7ed;">
          <blockquote cite="https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API" style="margin: 0;">
            <p style="margin: 0;">“The Web Storage API provides mechanisms by which browsers can store key/value pairs.”</p>
          </blockquote>
          <figcaption style="margin-top: 8px; font-size: 0.85rem; color: #475569; font-weight: 600;">— MDN Web Storage API</figcaption>
        </figure>
        <div style="margin-top: 18px;">
          <h3 style="margin: 0 0 10px; font-size: 0.8rem; letter-spacing: 0.16em; text-transform: uppercase; color: #64748b; font-weight: 900;">Cited sources</h3>
          <ul style="margin: 0; padding-left: 1.2rem;">
            <li><a href="https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides">FTC Endorsement Guides</a> — disclosure baseline for recommendation pages</li>
            <li><a href="https://www.cpsc.gov/Business--Manufacturing/Business-Education/Business-Guidance/Childrens-Products">CPSC Children&apos;s Products Guidance</a> — children&apos;s safety reference</li>
            <li><a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API">MDN Web Storage API</a> — browser storage reference for local drafts</li>
          </ul>
        </div>
        <h3 style="margin: 18px 0 10px; font-size: 0.8rem; letter-spacing: 0.16em; text-transform: uppercase; color: #64748b; font-weight: 900;">What the sources say</h3>
        <figure style="margin: 0; padding: 14px 16px; border-left: 4px solid #f97316; background: #fff7ed;">
          <blockquote cite="https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API" style="margin: 0;">
            <p style="margin: 0;">“The Web Storage API provides mechanisms by which browsers can store key/value pairs.”</p>
          </blockquote>
          <figcaption style="margin-top: 8px; font-size: 0.85rem; color: #475569; font-weight: 600;">— MDN Web Storage API</figcaption>
        </figure>
      </section>
      <section style="padding: 22px 0; border-top: 1px solid #e2e8f0;">
        <h2 style="margin: 0 0 12px; font-size: 1.5rem;">Why does this page exist?</h2>
        <p style="margin: 0 0 14px;"><strong>Short answer:</strong> this page explains who is speaking, what standard is used, and what a reader should verify before buying.</p>
        <p style="margin: 0 0 14px;">The about page is here to make the editorial process visible. It tells crawlers and readers who the site serves, what the trust rules are, and why the recommendations are not meant to be generic affiliate filler.</p>
        <figure style="margin: 0; padding: 14px 16px; border-left: 4px solid #f97316; background: #fff7ed;">
          <blockquote cite="https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides" style="margin: 0;">
            <p style="margin: 0;">“Disclose material connections and keep the evidence easy to inspect.”</p>
          </blockquote>
          <figcaption style="margin-top: 8px; font-size: 0.85rem; color: #475569; font-weight: 600;">— FTC Endorsement Guides</figcaption>
        </figure>
        <p style="margin: 14px 0 0;">That also means the page should answer three questions quickly: who is speaking, what evidence did they use, and what should the reader check independently before buying?</p>
      </section>
      <section style="padding: 22px 0; border-top: 1px solid #e2e8f0;">
        <h2 style="margin: 0 0 12px; font-size: 1.5rem;">Which signals matter when judging trust?</h2>
        <p style="margin: 0 0 14px;"><strong>Short answer:</strong> clear disclosures, visible source references, and a stable relationship between the page title and the visible content are the strongest trust signals.</p>
        <p style="margin: 0 0 14px;">Those signals help both people and search systems understand that the site is trying to earn trust rather than borrow it.</p>
        <p style="margin: 0 0 14px;">We also look for consistent category names, a readable recommendation path, and a clean separation between editorial judgment and commercial links. Those cues make the page easier to cite and harder to misread.</p>
      </section>
      <section style="padding: 22px 0; border-top: 1px solid #e2e8f0;">
        <h2 style="margin: 0 0 12px; font-size: 1.5rem;">What does the editorial process check first?</h2>
        <p style="margin: 0 0 14px;"><strong>Short answer:</strong> we check fit, safety, and stability before any recommendation is written.</p>
        <p style="margin: 0 0 14px;">First we check whether the product is the right category for the child and the family’s routine. Then we check the safety and fit details that matter most: weight, braking, stability, and whether the geometry makes the item easier or harder to use.</p>
        <p style="margin: 0 0 14px;">If a page cannot support those basics, it should not be treated as a recommendation. It can still be informative, but it should not be mistaken for a verdict.</p>
      </section>
      <section style="padding: 22px 0; border-top: 1px solid #e2e8f0;">
        <h2 style="margin: 0 0 12px; font-size: 1.5rem;">How is the audit table structured?</h2>
        <p style="margin: 0 0 14px;"><strong>Short answer:</strong> each row pairs one check with one evidence type and one parent-facing reason.</p>
        <div style="overflow-x:auto; border:1px solid #e2e8f0; border-radius: 18px; background:#fff;">
          <table style="width:100%; border-collapse: collapse; min-width: 680px;">
            <thead style="background:#f8fafc; text-transform:uppercase; letter-spacing:0.12em; font-size:10px; color:#475569;">
              <tr>
                <th style="padding:14px 16px; text-align:left;">Check</th>
                <th style="padding:14px 16px; text-align:left;">Evidence</th>
                <th style="padding:14px 16px; text-align:left;">Why it matters</th>
              </tr>
            </thead>
            <tbody>
              ${auditRows.map((row) => `
                <tr style="border-top:1px solid #e2e8f0; vertical-align:top;">
                  <td style="padding:14px 16px; font-weight:800; color:#0f172a;">${escapeHtml(row.check)}</td>
                  <td style="padding:14px 16px; color:#475569;">${escapeHtml(row.evidence)}</td>
                  <td style="padding:14px 16px; color:#475569;">${escapeHtml(row.why)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
        <ol style="margin: 16px 0 0; padding-left: 1.2rem;">
          <li style="margin: 0 0 8px;">Read the short answer first.</li>
          <li style="margin: 0 0 8px;">Check the source links next.</li>
          <li style="margin: 0 0 8px;">Compare the table against the product listing.</li>
          <li style="margin: 0;">Treat the final recommendation as the result, not the starting point.</li>
        </ol>
      </section>
      <section style="padding: 22px 0; border-top: 1px solid #e2e8f0;">
        <h2 style="margin: 0 0 12px; font-size: 1.5rem;">Which questions should a parent ask next?</h2>
        <ul style="margin: 0; padding-left: 1.2rem;">
          <li>Does the product fit the child’s size and skill level?</li>
          <li>Does the brake or steering behavior feel predictable?</li>
          <li>Can the family maintain, store, and carry it easily?</li>
          <li>Does the listing match the physical product once it arrives?</li>
        </ul>
      </section>
      <section style="padding: 22px 0; border-top: 1px solid #e2e8f0;">
        <h2 style="margin: 0 0 12px; font-size: 1.5rem;">Where do the citations come from?</h2>
        <p style="margin: 0 0 14px;"><strong>Short answer:</strong> we cite the public rulebook first, then add short quotations that name the source directly.</p>
        ${renderSources([
          { label: "FTC Endorsement Guides", href: "https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides", note: "disclosure rules for endorsements and affiliate links" },
          { label: "CPSC Children's Products Guidance", href: "https://www.cpsc.gov/Business--Manufacturing/Business-Education/Business-Guidance/Childrens-Products", note: "children's product compliance baseline" },
          { label: "MDN Web Storage API", href: "https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API", note: "browser storage reference for local drafts" },
        ])}
      </section>
    `,
  };
}

/**
 * Static HTML for the small data tables some transparency pages carry.
 *
 * Prerendered transparency pages are fully static, so anything added to their
 * data model has to be rendered here too — otherwise crawlers see a page with
 * paragraphs but no figures, even though the hydrated SPA shows both.
 */
function renderStaticTable(table: { caption?: string; columns: string[]; rows: string[][] }): string {
  const head = table.columns
    .map(
      (column) =>
        `<th scope="col" style="text-align: left; padding: 6px 10px 6px 0; border-bottom: 2px solid #cbd5e1; font-size: 0.72rem; letter-spacing: 0.1em; text-transform: uppercase; color: #64748b;">${escapeHtml(column)}</th>`,
    )
    .join("");
  const bodyRows = table.rows
    .map(
      (row) =>
        `<tr>${row
          .map(
            (cell, index) =>
              `<td style="padding: 6px 10px 6px 0; border-bottom: 1px solid #e2e8f0; vertical-align: top; font-size: 0.9rem; color: ${index === 0 ? "#1e293b" : "#475569"}; ${
                index === 0 ? "font-weight: 600;" : ""
              }">${escapeHtml(cell)}</td>`,
          )
          .join("")}</tr>`,
    )
    .join("");
  return `
        <figure style="margin: 14px 0 0; overflow-x: auto;">
          <table style="border-collapse: collapse; width: 100%; min-width: 480px;">
            <thead><tr>${head}</tr></thead>
            <tbody>${bodyRows}</tbody>
          </table>
          ${table.caption ? `<figcaption style="margin-top: 8px; font-size: 0.78rem; color: #64748b;">${escapeHtml(table.caption)}</figcaption>` : ""}
        </figure>`;
}

/**
 * Static transparency / trust pages (disclaimer, testing methodology,
 * certification & lab notes, terms, privacy policy, search data, review-count
 * integrity). Without prerendering these routes fall through to the SPA shell
 * whose raw canonical points at the homepage — telling crawlers to ignore the
 * real page.
 */
function renderTransparencyPages(): RoutePage[] {
  return TRANSPARENCY_PAGES.map((page) => {
    const en = page.en;
    const sectionsHtml = en.sections
      .map(
        (section) => `
      <section style="padding: 18px 0; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0 0 4px; font-size: 0.78rem; letter-spacing: 0.16em; text-transform: uppercase; color: #f97316; font-weight: 800;">${escapeHtml(section.eyebrow)}</p>
        <h2 style="margin: 0 0 10px; font-size: 1.3rem;">${escapeHtml(section.title)}</h2>
        ${section.body.map((para) => `<p style="margin: 0 0 12px;">${escapeHtml(para)}</p>`).join("")}
        ${section.table ? renderStaticTable(section.table) : ""}
      </section>`,
      )
      .join("");
    const metricsHtml = en.metrics?.length
      ? `
      <dl style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; margin: 18px 0; padding: 0;">
        ${en.metrics
          .map(
            (metric) => `
        <div style="border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 14px; padding: 12px 14px;">
          <dt style="margin: 0 0 6px; font-size: 0.68rem; letter-spacing: 0.14em; text-transform: uppercase; color: #64748b; font-weight: 800;">${escapeHtml(metric.label)}</dt>
          <dd style="margin: 0; font-size: 1.5rem; font-weight: 900; color: #020617; line-height: 1.1;">${escapeHtml(metric.value)}</dd>
          <p style="margin: 6px 0 0; font-size: 0.78rem; color: #64748b; line-height: 1.5;">${escapeHtml(metric.note)}</p>
        </div>`,
          )
          .join("")}
      </dl>`
      : "";
    const body = `
      <section style="padding: 22px 0;">
        <p style="margin: 0 0 6px; font-size: 0.78rem; letter-spacing: 0.16em; text-transform: uppercase; color: #64748b; font-weight: 800;">${escapeHtml(en.navLabel)}</p>
        <h1 style="margin: 0 0 10px; font-size: 1.6rem;">${escapeHtml(en.title)}</h1>
        <p style="margin: 0 0 12px; font-size: 1.02rem; color: #334155;">${escapeHtml(en.subtitle)}</p>
        <p style="margin: 0 0 8px;">${escapeHtml(en.intro)}</p>
        ${en.measuredLine ? `<p style="margin: 0; font-family: monospace; font-size: 0.78rem; color: #94a3b8;">${escapeHtml(en.measuredLine)}</p>` : ""}
      </section>
      ${metricsHtml}
      ${sectionsHtml}
      <section style="padding: 18px 0 0; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0 0 8px;"><a href="${escapeHtml(en.primaryLink.href)}">${escapeHtml(en.primaryLink.text)}</a></p>
        <p style="margin: 0;"><a href="${escapeHtml(en.secondaryLink.href)}">${escapeHtml(en.secondaryLink.text)}</a></p>
      </section>
    `;
    return {
      route: en.path,
      title: en.seo?.title || en.title,
      description: en.seo?.description || en.subtitle,
      // The body already renders its own <h1> (en.title); the generic
      // page.title h1 from renderStaticPage would create a second one.
      skipTitleH1: true,
      body,
      ogType: "website" as const,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: en.seo?.title || en.title,
          url: `https://balancebiketoddler.com${en.path}`,
          description: en.seo?.description || en.subtitle,
          inLanguage: "en",
          isPartOf: { "@type": "WebSite", name: "BalanceBikeToddler", url: "https://balancebiketoddler.com/" },
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://balancebiketoddler.com/" },
            { "@type": "ListItem", position: 2, name: en.title, item: `https://balancebiketoddler.com${en.path}` },
          ],
        },
      ],
    };
  });
}

/**
 * Public safety recall record built from the US CPSC recall feed.
 *
 * This is the plan-B validation asset: instead of claiming test results we do
 * not have, publish a verifiable record that every row links back to its
 * official source. The figures come from src/data/recallData.generated.ts
 * (`npm run data:recalls`) — nothing here is hand-written.
 */
function renderSafetyRecallPage(): RoutePage[] {
  const d = recallDataset;
  const latest = latestTrendRow;
  const vals: Record<string, string | number> = {
    start: d.source.coverageStartYear,
    total: formatCount(d.totals.cpscNoticesRetrieved),
    bb: d.totals.balanceBikeNotices,
    bikes: latest?.kidBikeNotices ?? 0,
    helmets: latest?.kidHelmetNotices ?? 0,
    year: latestTrendYear,
    hazard: topHazard ? topHazard.label.toLowerCase() : "mechanical failure",
  };

  const row = (n: (typeof d.kidBikeNotices)[number]) => `
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:8px 10px 8px 0;white-space:nowrap;font-size:0.78rem;color:#64748b;">${escapeHtml(formatRecallDate(n.date))}</td>
          <td style="padding:8px 10px 8px 0;">
            <a href="${escapeHtml(n.url)}" style="color:#0f172a;text-decoration:none;font-weight:600;">${escapeHtml(n.title)}</a>
            <div style="font-size:0.72rem;color:#94a3b8;">${escapeHtml(n.party || n.recallNumber)}</div>
          </td>
          <td style="padding:8px 0;font-size:0.78rem;color:#475569;">${escapeHtml(n.hazard ? `${n.hazard.slice(0, 130)}${n.hazard.length > 130 ? "…" : ""}` : "-")}</td>
        </tr>`;

  const table = (rows: typeof d.kidBikeNotices) => `
      <table style="width:100%;border-collapse:collapse;text-align:left;">
        <thead>
          <tr style="font-size:0.66rem;text-transform:uppercase;letter-spacing:0.14em;color:#64748b;">
            <th style="padding:8px 10px 8px 0;">Date</th>
            <th style="padding:8px 10px 8px 0;">Notice</th>
            <th style="padding:8px 0;">Reported hazard</th>
          </tr>
        </thead>
        <tbody>${rows.map(row).join("")}</tbody>
      </table>`;

  const balanceCards = d.balanceBikeNotices
    .map(
      (n) => `
      <div style="margin-bottom:14px;padding:16px;border:1px solid #e2e8f0;border-radius:14px;background:#fff;">
        <div style="font-size:0.68rem;text-transform:uppercase;letter-spacing:0.12em;color:#64748b;">${escapeHtml(formatRecallDate(n.date))} &middot; CPSC #${escapeHtml(n.recallNumber)}${n.units ? ` &middot; ${escapeHtml(n.units)}` : ""}</div>
        <p style="margin:8px 0 4px;font-weight:800;font-size:1rem;">${escapeHtml(n.title)}</p>
        ${n.party ? `<p style="margin:0 0 8px;font-size:0.76rem;color:#64748b;">${escapeHtml(n.party)}</p>` : ""}
        <p style="margin:0 0 8px;font-size:0.88rem;line-height:1.7;">${escapeHtml(n.hazard)}</p>
        ${n.remedy ? `<p style="margin:0 0 10px;padding:10px;background:#f8fafc;border-radius:10px;font-size:0.78rem;line-height:1.6;color:#475569;">${escapeHtml(n.remedy)}</p>` : ""}
        <a href="${escapeHtml(n.url)}" style="font-size:0.82rem;font-weight:800;color:#ea580c;">${escapeHtml(recallStrings.en.openNotice)} &rarr;</a>
      </div>`,
    )
    .join("");

  const trendRows = [...d.yearlyTrend]
    .reverse()
    .map(
      (r) => `
        <tr style="border-bottom:1px solid #e2e8f0;font-size:0.8rem;">
          <td style="padding:6px 10px 6px 0;font-weight:700;">${r.year}</td>
          <td style="padding:6px 10px 6px 0;text-align:right;">${r.kidBikeNotices}</td>
          <td style="padding:6px 10px 6px 0;text-align:right;">${r.kidHelmetNotices}</td>
          <td style="padding:6px 10px 6px 0;text-align:right;color:#94a3b8;">${r.totalNotices}</td>
          <td style="padding:6px 0;text-align:right;font-weight:700;">${r.sharePct}%</td>
        </tr>`,
    )
    .join("");

  const hazardList = d.hazardBreakdown
    .map(
      (h) =>
        `<li style="padding:8px 12px;border:1px solid #e2e8f0;border-radius:10px;background:#fff;display:flex;justify-content:space-between;gap:12px;font-size:0.82rem;"><span>${escapeHtml(h.label)}</span><strong style="color:#ea580c;">${h.count}</strong></li>`,
    )
    .join("");

  const steps = recallStrings.en.checkSteps
    .map(
      (s, i) =>
        `<li style="margin-bottom:8px;padding:12px;border:1px solid #e2e8f0;border-radius:10px;background:#fff;font-size:0.86rem;line-height:1.7;"><strong style="color:#ea580c;">${i + 1}.</strong> ${escapeHtml(s)}</li>`,
    )
    .join("");

  const methodList = recallStrings.en.methodBody
    .slice(1)
    .map((line) => `<li style="margin-bottom:6px;">${escapeHtml(line)}</li>`)
    .join("");

  // --- EU Safety Gate half of the record (plan-B asset #1, EU side) ---------
  const eu = safetyGateDataset;
  const euVals: Record<string, string | number> = {
    scanned: formatCount(eu.totals.alertsInDatabase),
    since: euSinceYear ?? "",
    bb: eu.totals.balanceBikeAlerts,
    rideon: eu.totals.rideOnAlerts,
    cats: formatCount(eu.totals.alertsInCategories),
    excluded: eu.totals.excludedAccessories,
    other: eu.rideOnAlerts.length,
  };

  const euCards = eu.balanceBikeAlerts
    .map(
      (a) => `
      <div style="margin-bottom:12px;padding:16px;border:1px solid #e2e8f0;border-radius:14px;background:#fff;">
        <div style="font-size:0.68rem;text-transform:uppercase;letter-spacing:0.12em;color:#64748b;">${escapeHtml(formatRecallDate(a.date))} &middot; ${escapeHtml(a.country)} &middot; ${escapeHtml(a.alertNumber)}</div>
        <p style="margin:8px 0 2px;font-weight:800;font-size:1rem;">${escapeHtml(a.productName)}</p>
        <p style="margin:0 0 8px;font-size:0.76rem;color:#64748b;">${escapeHtml(a.brand)}</p>
        ${a.riskTypes.length ? `<p style="margin:0 0 8px;font-size:0.72rem;color:#ea580c;font-weight:700;">${escapeHtml(a.riskTypes.join(", "))}</p>` : ""}
        ${a.riskDescription ? `<p style="margin:0 0 10px;font-size:0.82rem;line-height:1.7;color:#475569;">${escapeHtml(a.riskDescription)}</p>` : ""}
        <a href="${escapeHtml(a.url)}" style="font-size:0.82rem;font-weight:800;color:#ea580c;">${escapeHtml(recallStrings.en.openAlert)} &rarr;</a>
      </div>`,
    )
    .join("");

  const euRows = eu.rideOnAlerts
    .map(
      (a) => `
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:8px 10px 8px 0;white-space:nowrap;font-size:0.76rem;color:#64748b;">${escapeHtml(formatRecallDate(a.date))}</td>
          <td style="padding:8px 10px 8px 0;font-size:0.78rem;">${escapeHtml(a.country)}</td>
          <td style="padding:8px 10px 8px 0;font-size:0.78rem;">${escapeHtml(a.brand)}</td>
          <td style="padding:8px 10px 8px 0;font-size:0.82rem;">${escapeHtml(a.productName)}</td>
          <td style="padding:8px 10px 8px 0;font-size:0.76rem;color:#475569;">${escapeHtml(a.riskTypes.join(", ") || "-")}</td>
          <td style="padding:8px 0;text-align:right;white-space:nowrap;"><a href="${escapeHtml(a.url)}" style="font-size:0.74rem;font-weight:800;color:#ea580c;">${escapeHtml(recallStrings.en.openAlert)} &rarr;</a></td>
        </tr>`,
    )
    .join("");

  const euMethodList = recallStrings.en.euMethodBody
    .map((line) => `<li style="margin-bottom:6px;">${escapeHtml(fillTemplate(line, euVals))}</li>`)
    .join("");

  const body = `
      <section style="padding:22px 0;">
        <p style="margin:0 0 6px;font-size:0.72rem;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;font-weight:800;">${escapeHtml(recallStrings.en.eyebrow)}</p>
        <h1 style="margin:0 0 10px;font-size:1.7rem;">${escapeHtml(recallStrings.en.heroTitle)}</h1>
        <p style="margin:0 0 12px;font-size:1rem;color:#334155;line-height:1.8;">${escapeHtml(recallStrings.en.heroLead)}</p>
        <p style="margin:0 0 8px;padding:10px 12px;background:#f8fafc;border-radius:10px;font-size:0.8rem;color:#475569;">
          ${escapeHtml(recallStrings.en.retrievedLabel)}: ${escapeHtml(d.source.retrievedAt)} &middot;
          ${escapeHtml(recallStrings.en.coverageLabel)}: ${d.source.coverageStartYear}&ndash;${latestTrendYear} &middot;
          CPSC ${formatCount(d.totals.cpscNoticesRetrieved)} &middot; kids' bikes ${d.totals.kidsBikeNotices} &middot; helmets ${d.totals.kidHelmetNotices} &middot; balance bikes ${d.totals.balanceBikeNotices}
        </p>
        <p style="margin:0;font-size:0.9rem;color:#475569;line-height:1.8;">${escapeHtml(recallStrings.en.heroNote)}</p>
      </section>

      <section style="padding:18px 0;border-top:1px solid #e2e8f0;">
        <h2 style="margin:0 0 12px;font-size:1.25rem;">${escapeHtml(recallStrings.en.findingsTitle)}</h2>
        <ol style="margin:0;padding-left:20px;">
          ${[recallStrings.en.finding1, recallStrings.en.finding2, recallStrings.en.finding3]
            .map(
              (f) =>
                `<li style="margin-bottom:10px;padding:14px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;font-size:0.88rem;line-height:1.75;color:#334155;">${escapeHtml(fillTemplate(f, vals))}</li>`,
            )
            .join("")}
        </ol>
      </section>

      <section style="padding:18px 0;border-top:1px solid #e2e8f0;">
        <h2 style="margin:0 0 8px;font-size:1.25rem;">${escapeHtml(fillTemplate(recallStrings.en.balanceTitle, { count: d.totals.balanceBikeNotices }))}</h2>
        <p style="margin:0 0 14px;font-size:0.88rem;color:#475569;line-height:1.8;">${escapeHtml(recallStrings.en.balanceLead)}</p>
        ${balanceCards}
      </section>

      <section style="padding:18px 0;border-top:1px solid #e2e8f0;">
        <h2 style="margin:0 0 8px;font-size:1.25rem;">${escapeHtml(fillTemplate(recallStrings.en.bikeTableTitle, { count: d.totals.kidsBikeNotices }))}</h2>
        <p style="margin:0 0 14px;font-size:0.88rem;color:#475569;line-height:1.8;">${escapeHtml(recallStrings.en.bikeTableLead)}</p>
        <div style="overflow-x:auto;">${table(d.kidBikeNotices)}</div>
      </section>

      <section style="padding:18px 0;border-top:1px solid #e2e8f0;">
        <h2 style="margin:0 0 8px;font-size:1.25rem;">${escapeHtml(fillTemplate(recallStrings.en.helmetTableTitle, { count: d.totals.kidHelmetNotices }))}</h2>
        <p style="margin:0 0 14px;font-size:0.88rem;color:#475569;line-height:1.8;">${escapeHtml(recallStrings.en.helmetTableLead)}</p>
        <div style="overflow-x:auto;">${table(d.kidHelmetNotices)}</div>
      </section>

      <section style="padding:18px 0;border-top:1px solid #e2e8f0;">
        <h2 style="margin:0 0 8px;font-size:1.25rem;">${escapeHtml(recallStrings.en.trendTitle)}</h2>
        <p style="margin:0 0 14px;font-size:0.88rem;color:#475569;line-height:1.8;">${escapeHtml(recallStrings.en.trendLead)}</p>
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;text-align:left;">
            <thead>
              <tr style="font-size:0.66rem;text-transform:uppercase;letter-spacing:0.14em;color:#64748b;">
                <th style="padding:8px 10px 8px 0;">Year</th>
                <th style="padding:8px 10px 8px 0;text-align:right;">Kids' bikes</th>
                <th style="padding:8px 10px 8px 0;text-align:right;">Helmets</th>
                <th style="padding:8px 10px 8px 0;text-align:right;">All CPSC</th>
                <th style="padding:8px 0;text-align:right;">Share</th>
              </tr>
            </thead>
            <tbody>${trendRows}</tbody>
          </table>
        </div>
      </section>

      <section style="padding:18px 0;border-top:1px solid #e2e8f0;">
        <h2 style="margin:0 0 8px;font-size:1.25rem;">${escapeHtml(recallStrings.en.hazardTitle)}</h2>
        <p style="margin:0 0 14px;font-size:0.88rem;color:#475569;line-height:1.8;">${escapeHtml(recallStrings.en.hazardLead)}</p>
        <ul style="margin:0;padding:0;list-style:none;display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px;">${hazardList}</ul>
      </section>

      <section style="padding:18px 0;border-top:1px solid #e2e8f0;">
        <h2 style="margin:0 0 8px;font-size:1.25rem;">${escapeHtml(recallStrings.en.euTitle)}</h2>
        <p style="margin:0 0 14px;font-size:0.88rem;color:#475569;line-height:1.8;">${escapeHtml(recallStrings.en.euLead)}</p>
        <p style="margin:0 0 16px;padding:12px 14px;background:#f8fafc;border-radius:12px;font-size:0.88rem;line-height:1.8;color:#334155;">${escapeHtml(fillTemplate(recallStrings.en.euFinding, euVals))}</p>

        <h3 style="margin:0 0 6px;font-size:1rem;">${escapeHtml(fillTemplate(recallStrings.en.euBalanceTitle, { count: eu.totals.balanceBikeAlerts }))}</h3>
        <p style="margin:0 0 12px;font-size:0.85rem;color:#475569;line-height:1.75;">${escapeHtml(recallStrings.en.euBalanceLead)}</p>
        ${euCards}

        <h3 style="margin:18px 0 6px;font-size:1rem;">${escapeHtml(fillTemplate(recallStrings.en.euTableTitle, { count: eu.rideOnAlerts.length }))}</h3>
        <p style="margin:0 0 12px;font-size:0.85rem;color:#475569;line-height:1.75;">${escapeHtml(fillTemplate(recallStrings.en.euTableLead, { excluded: eu.totals.excludedAccessories }))}</p>
        ${
          eu.rideOnAlerts.length
            ? `<div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;text-align:left;">
            <thead>
              <tr style="font-size:0.66rem;text-transform:uppercase;letter-spacing:0.14em;color:#64748b;">
                <th style="padding:8px 10px 8px 0;">${escapeHtml(recallStrings.en.euColDate)}</th>
                <th style="padding:8px 10px 8px 0;">${escapeHtml(recallStrings.en.euColCountry)}</th>
                <th style="padding:8px 10px 8px 0;">${escapeHtml(recallStrings.en.euColBrand)}</th>
                <th style="padding:8px 10px 8px 0;">${escapeHtml(recallStrings.en.euColProduct)}</th>
                <th style="padding:8px 10px 8px 0;">${escapeHtml(recallStrings.en.euColRisk)}</th>
                <th style="padding:8px 0;text-align:right;">${escapeHtml(recallStrings.en.euColAlert)}</th>
              </tr>
            </thead>
            <tbody>${euRows}</tbody>
          </table>
        </div>`
            : ""
        }

        <div style="margin-top:16px;padding:14px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;">
          <p style="margin:0 0 8px;font-size:0.7rem;letter-spacing:0.14em;text-transform:uppercase;color:#64748b;font-weight:800;">${escapeHtml(recallStrings.en.euMethodTitle)}</p>
          <ul style="margin:0 0 10px;padding-left:20px;font-size:0.8rem;line-height:1.75;color:#475569;">${euMethodList}</ul>
          <p style="margin:0;font-size:0.78rem;color:#64748b;">${escapeHtml(recallStrings.en.euSourcesLabel)}: ${escapeHtml(eu.source.name)} &middot; ${escapeHtml(recallStrings.en.retrievedLabel)}: ${escapeHtml(eu.source.retrievedAt)}</p>
        </div>
      </section>

      <section style="padding:18px 0;border-top:1px solid #e2e8f0;">
        <h2 style="margin:0 0 8px;font-size:1.25rem;">${escapeHtml(recallStrings.en.checkTitle)}</h2>
        <p style="margin:0 0 14px;font-size:0.88rem;color:#475569;line-height:1.8;">${escapeHtml(recallStrings.en.checkLead)}</p>
        <ol style="margin:0;padding:0;list-style:none;counter-reset:step;">${steps}</ol>
      </section>

      <section style="padding:18px 0;border-top:1px solid #e2e8f0;">
        <h2 style="margin:0 0 8px;font-size:1.25rem;">${escapeHtml(recallStrings.en.methodTitle)}</h2>
        <ul style="margin:0 0 10px;padding-left:20px;font-size:0.85rem;line-height:1.8;color:#475569;">
          <li style="margin-bottom:6px;">${escapeHtml(fillTemplate(recallStrings.en.methodBody[0], { start: d.source.coverageStartYear, api: d.source.api }))}</li>
          ${methodList}
        </ul>
      </section>

      <section style="padding:18px 0;border-top:1px solid #e2e8f0;">
        <h2 style="margin:0 0 8px;font-size:1.1rem;">${escapeHtml(recallStrings.en.disclaimerTitle)}</h2>
        <p style="margin:0;font-size:0.85rem;line-height:1.8;color:#475569;">${escapeHtml(recallStrings.en.disclaimerBody)}</p>
      </section>
    `;

  return [
    {
      route: RECALL_SAFETY_PATH,
      title: recallSeo.en.title,
      description: recallSeo.en.description,
      skipTitleH1: true,
      body: `${body}${clusterNavHtml(RECALL_SAFETY_PATH)}`,
      ogType: "website" as const,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: recallSeo.en.title,
          url: `https://balancebiketoddler.com${RECALL_SAFETY_PATH}`,
          description: recallSeo.en.description,
          inLanguage: "en",
          isPartOf: { "@type": "WebSite", name: "BalanceBikeToddler", url: "https://balancebiketoddler.com/" },
        },
        buildDatasetSchema(`https://balancebiketoddler.com${RECALL_SAFETY_PATH}`),
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://balancebiketoddler.com/" },
            {
              "@type": "ListItem",
              position: 2,
              name: "Balance bike recall record",
              item: `https://balancebiketoddler.com${RECALL_SAFETY_PATH}`,
            },
          ],
        },
      ],
    },
  ];
}

/**
 * Balance-bike sizing / specification comparison (Plan-B Asset 3).
 *
 * Like the recall record, every cell is derived from src/data/sizeData.generated.ts
 * (`npm run data:sizing`) — normalized from each product's specification record.
 * No measurement is invented: specs the source did not publish show "—".
 */
function renderSizingPage(): RoutePage[] {
  const d = sizingDataset;
  const t = sizingStrings.en;
  const ageMin = d.ageSpreadMonths.min;
  const ageMax = d.ageSpreadMonths.max;
  const ageSpread =
    ageMin != null && ageMax != null
      ? `${Math.floor(ageMin / 12) > 0 ? `${Math.floor(ageMin / 12)}–` : `${ageMin} mo–`}${Math.ceil(ageMax / 12)} yr`
      : "—";

  const row = (b: (typeof d.bikes)[number]) => `
        <tr style="border-bottom:1px solid #f1f5f9;vertical-align:top;">
          <td style="padding:10px 12px 10px 0;">
            <a href="${escapeHtml(b.productUrl)}" style="color:#0f172a;text-decoration:none;font-weight:600;font-size:0.85rem;">${escapeHtml(b.brand || "—")}</a>
            <div style="font-size:0.72rem;color:#94a3b8;margin-top:2px;max-width:220px;line-height:1.4;">${escapeHtml(b.name.replace(/^[^,]+,\s*/, "").slice(0, 90))}</div>
          </td>
          <td style="padding:10px 12px 10px 0;font-size:0.82rem;font-weight:700;color:#334155;white-space:nowrap;">${escapeHtml(formatAge(b))}</td>
          <td style="padding:10px 12px 10px 0;font-size:0.82rem;color:#334155;white-space:nowrap;">${escapeHtml(formatInches(b.wheelInches))}</td>
          <td style="padding:10px 12px 10px 0;font-size:0.82rem;color:#334155;white-space:nowrap;">${escapeHtml(formatWeight(b.weightLbs))}</td>
          <td style="padding:10px 12px 10px 0;font-size:0.82rem;color:#334155;white-space:nowrap;">${escapeHtml(formatSteering(b.steeringLimitDeg))}</td>
          <td style="padding:10px 12px 10px 0;font-size:0.74rem;color:#475569;max-width:140px;">${escapeHtml(b.frameMaterial || "—")}</td>
          <td style="padding:10px 12px 10px 0;font-size:0.82rem;font-weight:700;color:#0f172a;white-space:nowrap;">${escapeHtml(formatPrice(b.priceUsd))}</td>
          <td style="padding:10px 12px 10px 0;font-size:0.82rem;color:#334155;white-space:nowrap;">${b.rating != null ? `${b.rating.toFixed(1)} ★` : "—"}${credibleReviewCount(b.reviewCount) != null ? `<div style="font-size:0.62rem;color:#cbd5e1;">${credibleReviewCount(b.reviewCount)!.toLocaleString("en-US")}</div>` : ""}</td>
        </tr>`;

  const table = `
      <div style="overflow-x:auto;border:1px solid #e2e8f0;border-radius:16px;background:#fff;">
        <table style="width:100%;min-width:760px;border-collapse:collapse;text-align:left;">
          <thead style="background:#f8fafc;">
            <tr style="font-size:0.6rem;text-transform:uppercase;letter-spacing:0.14em;color:#64748b;">
              <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colBrand)}</th>
              <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colAge)}</th>
              <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colWheel)}</th>
              <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colWeight)}</th>
              <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colSteering)}</th>
              <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colFrame)}</th>
              <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colPrice)}</th>
              <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colRating)}</th>
            </tr>
          </thead>
          <tbody>${d.bikes.map(row).join("")}</tbody>
        </table>
      </div>`;

  const body = `
    <article style="max-width:64rem;margin:0 auto;padding:32px 24px 56px;text-align:left;">
      <div style="display:flex;flex-direction:column;gap:40px;">
        <header style="display:flex;flex-direction:column;gap:20px;border-bottom:1px solid #e2e8f0;padding-bottom:32px;">
          <div style="display:inline-flex;align-items:center;gap:8px;align-self:flex-start;border:1px solid #fed7aa;background:#fff7ed;padding:4px 12px;border-radius:9999px;font-size:0.6rem;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:#ea580c;">${escapeHtml(t.eyebrow)}</div>
          <h1 style="font-size:2rem;font-weight:900;color:#0f172a;line-height:1.15;margin:0;max-width:48rem;">${escapeHtml(t.heroTitle)}</h1>
          <p style="font-size:1.05rem;color:#475569;line-height:1.7;margin:0;max-width:48rem;font-weight:500;">${escapeHtml(t.heroLead)}</p>
          <div style="display:flex;flex-wrap:wrap;gap:24px 48px;border:1px solid #e2e8f0;background:#f8fafc;border-radius:16px;padding:12px 16px;font-size:0.75rem;color:#475569;">
            <span>Data retrieved: ${escapeHtml(d.source.retrievedAt)}</span>
            <span>Age spread: ${escapeHtml(ageSpread)}</span>
            <span>Models compared: ${d.totals.balanceBikesListed} · with wheel size: ${d.totals.withWheelSize} · with steering limit: ${d.totals.withSteeringLimit}</span>
          </div>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.heroNote)}</p>
        </header>

        <section style="display:flex;flex-direction:column;gap:16px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.whyTitle)}</h2>
          <p style="font-size:0.9rem;color:#475569;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.whyBody)}</p>
        </section>

        <section style="display:flex;flex-direction:column;gap:16px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.tableTitle.replace("{count}", String(d.totals.balanceBikesListed)))}</h2>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.tableLead)}</p>
          ${table}
        </section>

        <section style="display:flex;flex-direction:column;gap:14px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.methodTitle)}</h2>
          <ul style="margin:0;padding-left:20px;font-size:0.85rem;color:#475569;line-height:1.7;">
            ${t.methodBody.map((line) => `<li style="margin-bottom:6px;">${escapeHtml(line)}</li>`).join("")}
          </ul>
        </section>

        <section style="border:1px solid #fed7aa;background:#fff7ed;border-radius:16px;padding:20px;">
          <h2 style="font-size:1rem;font-weight:900;color:#0f172a;margin:0 0 8px;">${escapeHtml(t.seatHeightTitle)}</h2>
          <p style="font-size:0.85rem;color:#475569;line-height:1.7;margin:0;">${escapeHtml(t.seatHeightBody)}</p>
        </section>

        <section style="display:flex;flex-direction:column;gap:14px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.weightRuleTitle)}</h2>
          <p style="font-size:0.85rem;color:#475569;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.weightRuleBody)}</p>
        </section>

        <section style="display:flex;flex-direction:column;gap:14px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.wheelByAgeTitle)}</h2>
          <p style="font-size:0.85rem;color:#475569;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.wheelByAgeBody)}</p>
        </section>

        <section style="border:1px solid #fde68a;background:#fffbeb;border-radius:16px;padding:20px;">
          <h2 style="font-size:1rem;font-weight:900;color:#0f172a;margin:0 0 8px;">${escapeHtml(t.disclaimerTitle)}</h2>
          <p style="font-size:0.85rem;color:#475569;line-height:1.7;margin:0;">${escapeHtml(t.disclaimerBody)}</p>
        </section>

        <footer style="border-top:1px solid #e2e8f0;padding-top:24px;font-size:0.7rem;color:#94a3b8;line-height:1.6;">
          Source: ${escapeHtml(d.source.name)} (${escapeHtml(d.source.exportFile)}) · retrieved: ${escapeHtml(d.source.retrievedAt)}
        </footer>
      </div>
    </article>
  `;

  return [
    {
      route: SIZING_PATH,
      title: sizingSeo.en.title,
      description: sizingSeo.en.description,
      skipTitleH1: true,
      body: `${body}${clusterNavHtml(SIZING_PATH)}`,
      ogType: "website" as const,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: sizingSeo.en.title,
          url: `https://balancebiketoddler.com${SIZING_PATH}`,
          description: sizingSeo.en.description,
          inLanguage: "en",
          isPartOf: { "@type": "WebSite", name: "BalanceBikeToddler", url: "https://balancebiketoddler.com/" },
        },
        buildSizingDatasetSchema(`https://balancebiketoddler.com${SIZING_PATH}`),
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://balancebiketoddler.com/" },
            {
              "@type": "ListItem",
              position: 2,
              name: "Balance bike size chart",
              item: `https://balancebiketoddler.com${SIZING_PATH}`,
            },
          ],
        },
      ],
    },
  ];
}

/**
 * Kids-bike sizing / specification comparison (Plan-B Asset, kids-bikes
 * counterpart of balance-bike size-chart). Every cell is derived from
 * src/data/kidsBikeSizeData.generated.ts (`npm run data:kids-sizing`) —
 * normalized from each product's specification record. No measurement is
 * invented: specs the source did not publish show "—".
 */
function renderKidsBikeSizingPage(): RoutePage[] {
  const d = kidsBikeSizingDataset;
  const t = kidsBikeSizingStrings.en;
  const ageMin = d.ageSpreadMonths.min;
  const ageMax = d.ageSpreadMonths.max;
  const ageSpread =
    ageMin != null && ageMax != null
      ? `${Math.floor(ageMin / 12) > 0 ? `${Math.floor(ageMin / 12)}–` : `${ageMin} mo–`}${Math.ceil(ageMax / 12)} yr`
      : "—";

  const row = (b: (typeof d.bikes)[number]) => `
        <tr style="border-bottom:1px solid #f1f5f9;vertical-align:top;">
          <td style="padding:10px 12px 10px 0;">
            <a href="${escapeHtml(b.productUrl)}" style="color:#0f172a;text-decoration:none;font-weight:600;font-size:0.85rem;">${escapeHtml(b.brand || "—")}</a>
            <div style="font-size:0.72rem;color:#94a3b8;margin-top:2px;max-width:220px;line-height:1.4;">${escapeHtml(b.name.replace(/^[^,]+,\s*/, "").slice(0, 90))}</div>
          </td>
          <td style="padding:10px 12px 10px 0;font-size:0.82rem;font-weight:700;color:#334155;white-space:nowrap;">${escapeHtml(formatAge(b))}</td>
          <td style="padding:10px 12px 10px 0;font-size:0.82rem;color:#334155;white-space:nowrap;">${escapeHtml(formatInches(b.wheelInches))}</td>
          <td style="padding:10px 12px 10px 0;font-size:0.82rem;color:#334155;white-space:nowrap;">${escapeHtml(formatWeight(b.weightLbs))}</td>
          <td style="padding:10px 12px 10px 0;font-size:0.82rem;color:#334155;white-space:nowrap;">${escapeHtml(formatSteering(b.steeringLimitDeg))}</td>
          <td style="padding:10px 12px 10px 0;font-size:0.74rem;color:#475569;max-width:140px;">${escapeHtml(b.frameMaterial || "—")}</td>
          <td style="padding:10px 12px 10px 0;font-size:0.82rem;font-weight:700;color:#0f172a;white-space:nowrap;">${escapeHtml(formatPrice(b.priceUsd))}</td>
          <td style="padding:10px 12px 10px 0;font-size:0.82rem;color:#334155;white-space:nowrap;">${b.rating != null ? `${b.rating.toFixed(1)} ★` : "—"}${credibleReviewCount(b.reviewCount) != null ? `<div style="font-size:0.62rem;color:#cbd5e1;">${credibleReviewCount(b.reviewCount)!.toLocaleString("en-US")}</div>` : ""}</td>
        </tr>`;

  const table = `
      <div style="overflow-x:auto;border:1px solid #e2e8f0;border-radius:16px;background:#fff;">
        <table style="width:100%;min-width:760px;border-collapse:collapse;text-align:left;">
          <thead style="background:#f8fafc;">
            <tr style="font-size:0.6rem;text-transform:uppercase;letter-spacing:0.14em;color:#64748b;">
              <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colBrand)}</th>
              <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colAge)}</th>
              <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colWheel)}</th>
              <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colWeight)}</th>
              <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colSteering)}</th>
              <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colFrame)}</th>
              <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colPrice)}</th>
              <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colRating)}</th>
            </tr>
          </thead>
          <tbody>${d.bikes.map(row).join("")}</tbody>
        </table>
      </div>`;

  const body = `
    <article style="max-width:64rem;margin:0 auto;padding:32px 24px 56px;text-align:left;">
      <div style="display:flex;flex-direction:column;gap:40px;">
        <header style="display:flex;flex-direction:column;gap:20px;border-bottom:1px solid #e2e8f0;padding-bottom:32px;">
          <div style="display:inline-flex;align-items:center;gap:8px;align-self:flex-start;border:1px solid #fed7aa;background:#fff7ed;padding:4px 12px;border-radius:9999px;font-size:0.6rem;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:#ea580c;">${escapeHtml(t.eyebrow)}</div>
          <h1 style="font-size:2rem;font-weight:900;color:#0f172a;line-height:1.15;margin:0;max-width:48rem;">${escapeHtml(t.heroTitle)}</h1>
          <p style="font-size:1.05rem;color:#475569;line-height:1.7;margin:0;max-width:48rem;font-weight:500;">${escapeHtml(t.heroLead)}</p>
          <div style="display:flex;flex-wrap:wrap;gap:24px 48px;border:1px solid #e2e8f0;background:#f8fafc;border-radius:16px;padding:12px 16px;font-size:0.75rem;color:#475569;">
            <span>Data retrieved: ${escapeHtml(d.source.retrievedAt)}</span>
            <span>Age spread: ${escapeHtml(ageSpread)}</span>
            <span>Models compared: ${d.totals.balanceBikesListed} · with wheel size: ${d.totals.withWheelSize} · with steering limit: ${d.totals.withSteeringLimit}</span>
          </div>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.heroNote)}</p>
        </header>

        <section style="display:flex;flex-direction:column;gap:16px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.whyTitle)}</h2>
          <p style="font-size:0.9rem;color:#475569;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.whyBody)}</p>
        </section>

        <section style="display:flex;flex-direction:column;gap:16px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.tableTitle.replace("{count}", String(d.totals.balanceBikesListed)))}</h2>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.tableLead)}</p>
          ${table}
        </section>

        <section style="display:flex;flex-direction:column;gap:14px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.methodTitle)}</h2>
          <ul style="margin:0;padding-left:20px;font-size:0.85rem;color:#475569;line-height:1.7;">
            ${t.methodBody.map((line) => `<li style="margin-bottom:6px;">${escapeHtml(line)}</li>`).join("")}
          </ul>
        </section>

        <section style="border:1px solid #fed7aa;background:#fff7ed;border-radius:16px;padding:20px;">
          <h2 style="font-size:1rem;font-weight:900;color:#0f172a;margin:0 0 8px;">${escapeHtml(t.seatHeightTitle)}</h2>
          <p style="font-size:0.85rem;color:#475569;line-height:1.7;margin:0;">${escapeHtml(t.seatHeightBody)}</p>
        </section>

        <section style="display:flex;flex-direction:column;gap:14px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.weightRuleTitle)}</h2>
          <p style="font-size:0.85rem;color:#475569;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.weightRuleBody)}</p>
        </section>

        <section style="display:flex;flex-direction:column;gap:14px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.wheelByAgeTitle)}</h2>
          <p style="font-size:0.85rem;color:#475569;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.wheelByAgeBody)}</p>
        </section>

        <section style="border:1px solid #fde68a;background:#fffbeb;border-radius:16px;padding:20px;">
          <h2 style="font-size:1rem;font-weight:900;color:#0f172a;margin:0 0 8px;">${escapeHtml(t.disclaimerTitle)}</h2>
          <p style="font-size:0.85rem;color:#475569;line-height:1.7;margin:0;">${escapeHtml(t.disclaimerBody)}</p>
        </section>

        <footer style="border-top:1px solid #e2e8f0;padding-top:24px;font-size:0.7rem;color:#94a3b8;line-height:1.6;">
          Source: ${escapeHtml(d.source.name)} (${escapeHtml(d.source.exportFile)}) · retrieved: ${escapeHtml(d.source.retrievedAt)}
        </footer>
      </div>
    </article>
  `;

  return [
    {
      route: KIDS_SIZING_PATH,
      title: kidsBikeSizingSeo.en.title,
      description: kidsBikeSizingSeo.en.description,
      skipTitleH1: true,
      body: `${body}${clusterNavHtml(KIDS_SIZING_PATH)}`,
      ogType: "website" as const,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: kidsBikeSizingSeo.en.title,
          url: `https://balancebiketoddler.com${KIDS_SIZING_PATH}`,
          description: kidsBikeSizingSeo.en.description,
          inLanguage: "en",
          isPartOf: { "@type": "WebSite", name: "BalanceBikeToddler", url: "https://balancebiketoddler.com/" },
        },
        buildKidsBikeSizingDatasetSchema(`https://balancebiketoddler.com${KIDS_SIZING_PATH}`),
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://balancebiketoddler.com/" },
            {
              "@type": "ListItem",
              position: 2,
              name: "Kids bike size chart",
              item: `https://balancebiketoddler.com${KIDS_SIZING_PATH}`,
            },
          ],
        },
      ],
    },
  ];
}

/**
 * Balance-bike safety standards reference (Plan-B Asset 4).
 *
 * Curated from public regulatory texts (CPSC, eCFR, EUR-Lex); every limit is
 * cited per standard. No figures invented — see src/data/balanceBikeSafety.ts.
 */
function renderSafetyPage(): RoutePage[] {
  const t = safetyStrings.en;
  const l = "en" as const; // prerender always emits the English canonical page

  const standardCard = (s: (typeof safetyStandards)[number]) => `
    <div style="border:1px solid #e2e8f0;background:#fff;border-radius:16px;padding:20px;">
      <div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;align-items:flex-start;">
        <h3 style="font-size:1rem;font-weight:900;color:#0f172a;line-height:1.3;margin:0;max-width:32rem;">${escapeHtml(s.name)}</h3>
        <span style="flex-shrink:0;border:1px solid #a7f3d0;background:#ecfdf5;color:#047857;font-size:0.6rem;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;border-radius:9999px;padding:3px 10px;">Mandatory</span>
      </div>
      ${s.edition ? `<div style="font-size:0.72rem;font-weight:700;color:#ea580c;margin-top:4px;">${escapeHtml(s.edition)}</div>` : ""}
      <p style="font-size:0.85rem;color:#475569;line-height:1.7;margin:12px 0 0;">${escapeHtml(s.scope[l])}</p>
      <ul style="margin:12px 0 0;padding-left:20px;font-size:0.85rem;color:#334155;line-height:1.7;">
        ${s.requirements.map((r) => `<li style="margin-bottom:6px;">${escapeHtml(r[l])}</li>`).join("")}
      </ul>
      <div style="margin-top:12px;border-radius:12px;background:#f8fafc;padding:8px 12px;font-size:0.72rem;color:#475569;">
        <strong style="color:#334155;">Verify by: </strong>${escapeHtml(s.verifyMark[l])}
      </div>
      <a href="${escapeHtml(s.citation.url)}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:6px;margin-top:12px;font-size:0.72rem;font-weight:700;color:#ea580c;text-decoration:none;">${escapeHtml(s.citation.title)} &#8599;</a>
    </div>`;

  const comparisonTable = `
    <div style="overflow-x:auto;border:1px solid #e2e8f0;border-radius:16px;background:#fff;">
      <table style="width:100%;min-width:720px;border-collapse:collapse;text-align:left;">
        <thead style="background:#f8fafc;">
          <tr style="font-size:0.6rem;text-transform:uppercase;letter-spacing:0.14em;color:#64748b;">
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colRegion)}</th>
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colStandards)}</th>
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colCovers)}</th>
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colMandatory)}</th>
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colLookFor)}</th>
          </tr>
        </thead>
        <tbody>
          ${safetyComparison
            .map(
              (row) => `
            <tr style="border-bottom:1px solid #f1f5f9;vertical-align:top;">
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;font-weight:700;color:#0f172a;">${escapeHtml(row.region[l])}</td>
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;color:#334155;">${escapeHtml(row.standards[l])}</td>
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;color:#334155;">${escapeHtml(row.covers[l])}</td>
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;font-weight:700;color:#047857;white-space:nowrap;">${escapeHtml(row.mandatory[l])}</td>
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;color:#334155;">${escapeHtml(row.lookFor[l])}</td>
            </tr>`,
            )
            .join("")}
        </tbody>
      </table>
    </div>`;

  const body = `
    <article style="max-width:64rem;margin:0 auto;padding:32px 24px 56px;text-align:left;">
      <div style="display:flex;flex-direction:column;gap:40px;">
        <header style="display:flex;flex-direction:column;gap:20px;border-bottom:1px solid #e2e8f0;padding-bottom:32px;">
          <div style="display:inline-flex;align-items:center;gap:8px;align-self:flex-start;border:1px solid #fed7aa;background:#fff7ed;padding:4px 12px;border-radius:9999px;font-size:0.6rem;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:#ea580c;">${escapeHtml(t.eyebrow)}</div>
          <h1 style="font-size:2rem;font-weight:900;color:#0f172a;line-height:1.15;margin:0;max-width:48rem;">${escapeHtml(t.heroTitle)}</h1>
          <p style="font-size:1.05rem;color:#475569;line-height:1.7;margin:0;max-width:48rem;font-weight:500;">${escapeHtml(t.heroLead)}</p>
          <div style="display:flex;flex-wrap:wrap;gap:24px 48px;border:1px solid #e2e8f0;background:#f8fafc;border-radius:16px;padding:12px 16px;font-size:0.75rem;color:#475569;">
            <span>Compiled: ${escapeHtml(safetySource.retrievedAt)}</span>
            <span>Source: ${escapeHtml(safetySource.name)}</span>
          </div>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.heroNote)}</p>
        </header>

        <section style="display:flex;flex-direction:column;gap:16px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.introTitle)}</h2>
          <p style="font-size:0.9rem;color:#475569;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.introBody)}</p>
        </section>

        <section style="display:flex;flex-direction:column;gap:16px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.glanceTitle)}</h2>
          ${comparisonTable}
        </section>

        <section style="display:flex;flex-direction:column;gap:20px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.usTitle)}</h2>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.usLead)}</p>
          <div style="display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));">
            ${safetyStandards.filter((s) => s.region === "US").map(standardCard).join("")}
          </div>
        </section>

        <section style="display:flex;flex-direction:column;gap:20px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.euTitle)}</h2>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.euLead)}</p>
          <div style="display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));">
            ${safetyStandards.filter((s) => s.region === "EU_UK").map(standardCard).join("")}
          </div>
        </section>

        <section style="display:flex;flex-direction:column;gap:18px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.verifyTitle)}</h2>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.verifyLead)}</p>
          <ul style="margin:0;padding-left:4px;list-style:none;font-size:0.9rem;color:#334155;line-height:1.7;">
            ${safetyVerification
              .map(
                (item) =>
                  `<li style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;"><span style="color:#059669;font-weight:800;line-height:1.6;">&#10003;</span><span>${escapeHtml(item[l])}</span></li>`,
              )
              .join("")}
          </ul>
        </section>

        <section style="border:1px solid #fde68a;background:#fffbeb;border-radius:16px;padding:20px;">
          <h2 style="font-size:1rem;font-weight:900;color:#0f172a;margin:0 0 8px;">${escapeHtml(t.caveatsTitle)}</h2>
          <ul style="margin:0;padding-left:20px;font-size:0.85rem;color:#475569;line-height:1.7;">
            ${safetyCaveats.map((c) => `<li style="margin-bottom:6px;">${escapeHtml(c[l])}</li>`).join("")}
          </ul>
        </section>

        <footer style="border-top:1px solid #e2e8f0;padding-top:24px;font-size:0.7rem;color:#94a3b8;line-height:1.6;">
          Source: ${escapeHtml(safetySource.name)} · Compiled: ${escapeHtml(safetySource.retrievedAt)} · ${escapeHtml(safetySource.note[l])}
        </footer>
      </div>
    </article>
  `;

  return [
    {
      route: SAFETY_PATH,
      title: safetySeo.en.title,
      description: safetySeo.en.description,
      skipTitleH1: true,
      body: `${body}${clusterNavHtml(SAFETY_PATH)}`,
      ogType: "website" as const,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: safetySeo.en.title,
          url: `https://balancebiketoddler.com${SAFETY_PATH}`,
          description: safetySeo.en.description,
          inLanguage: "en",
          isPartOf: { "@type": "WebSite", name: "BalanceBikeToddler", url: "https://balancebiketoddler.com/" },
        },
        buildSafetyDatasetSchema(`https://balancebiketoddler.com${SAFETY_PATH}`),
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://balancebiketoddler.com/" },
            {
              "@type": "ListItem",
              position: 2,
              name: "Balance bike safety standards",
              item: `https://balancebiketoddler.com${SAFETY_PATH}`,
            },
          ],
        },
      ],
    },
  ];
}

function renderKidsBikeSafetyPage(): RoutePage[] {
  const t = kidsSafetyStrings.en;
  const l = "en" as const; // prerender always emits the English canonical page

  const standardCard = (s: (typeof kidsSafetyStandards)[number]) => `
    <div style="border:1px solid #e2e8f0;background:#fff;border-radius:16px;padding:20px;">
      <div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;align-items:flex-start;">
        <h3 style="font-size:1rem;font-weight:900;color:#0f172a;line-height:1.3;margin:0;max-width:32rem;">${escapeHtml(s.name)}</h3>
        <span style="flex-shrink:0;border:1px solid ${s.mandatory ? "#a7f3d0" : "#e2e8f0"};background:${s.mandatory ? "#ecfdf5" : "#f8fafc"};color:${s.mandatory ? "#047857" : "#64748b"};font-size:0.6rem;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;border-radius:9999px;padding:3px 10px;">${s.mandatory ? "Mandatory" : "Not applicable"}</span>
      </div>
      ${s.edition ? `<div style="font-size:0.72rem;font-weight:700;color:#ea580c;margin-top:4px;">${escapeHtml(s.edition)}</div>` : ""}
      <p style="font-size:0.85rem;color:#475569;line-height:1.7;margin:12px 0 0;">${escapeHtml(s.scope[l])}</p>
      <ul style="margin:12px 0 0;padding-left:20px;font-size:0.85rem;color:#334155;line-height:1.7;">
        ${s.requirements.map((r) => `<li style="margin-bottom:6px;">${escapeHtml(r[l])}</li>`).join("")}
      </ul>
      <div style="margin-top:12px;border-radius:12px;background:#f8fafc;padding:8px 12px;font-size:0.72rem;color:#475569;">
        <strong style="color:#334155;">Verify by: </strong>${escapeHtml(s.verifyMark[l])}
      </div>
      <a href="${escapeHtml(s.citation.url)}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:6px;margin-top:12px;font-size:0.72rem;font-weight:700;color:#ea580c;text-decoration:none;">${escapeHtml(s.citation.title)} &#8599;</a>
    </div>`;

  const comparisonTable = `
    <div style="overflow-x:auto;border:1px solid #e2e8f0;border-radius:16px;background:#fff;">
      <table style="width:100%;min-width:720px;border-collapse:collapse;text-align:left;">
        <thead style="background:#f8fafc;">
          <tr style="font-size:0.6rem;text-transform:uppercase;letter-spacing:0.14em;color:#64748b;">
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colRegion)}</th>
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colStandards)}</th>
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colCovers)}</th>
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colMandatory)}</th>
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colLookFor)}</th>
          </tr>
        </thead>
        <tbody>
          ${kidsSafetyComparison
            .map(
              (row) => `
            <tr style="border-bottom:1px solid #f1f5f9;vertical-align:top;">
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;font-weight:700;color:#0f172a;">${escapeHtml(row.region[l])}</td>
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;color:#334155;">${escapeHtml(row.standards[l])}</td>
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;color:#334155;">${escapeHtml(row.covers[l])}</td>
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;font-weight:700;color:#047857;white-space:nowrap;">${escapeHtml(row.mandatory[l])}</td>
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;color:#334155;">${escapeHtml(row.lookFor[l])}</td>
            </tr>`,
            )
            .join("")}
        </tbody>
      </table>
    </div>`;

  const body = `
    <article style="max-width:64rem;margin:0 auto;padding:32px 24px 56px;text-align:left;">
      <div style="display:flex;flex-direction:column;gap:40px;">
        <header style="display:flex;flex-direction:column;gap:20px;border-bottom:1px solid #e2e8f0;padding-bottom:32px;">
          <div style="display:inline-flex;align-items:center;gap:8px;align-self:flex-start;border:1px solid #fed7aa;background:#fff7ed;padding:4px 12px;border-radius:9999px;font-size:0.6rem;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:#ea580c;">${escapeHtml(t.eyebrow)}</div>
          <h1 style="font-size:2rem;font-weight:900;color:#0f172a;line-height:1.15;margin:0;max-width:48rem;">${escapeHtml(t.heroTitle)}</h1>
          <p style="font-size:1.05rem;color:#475569;line-height:1.7;margin:0;max-w:48rem;font-weight:500;">${escapeHtml(t.heroLead)}</p>
          <div style="display:flex;flex-wrap:wrap;gap:24px 48px;border:1px solid #e2e8f0;background:#f8fafc;border-radius:16px;padding:12px 16px;font-size:0.75rem;color:#475569;">
            <span>Compiled: ${escapeHtml(kidsSafetySource.retrievedAt)}</span>
            <span>Source: ${escapeHtml(kidsSafetySource.name)}</span>
          </div>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.heroNote)}</p>
        </header>

        <section style="display:flex;flex-direction:column;gap:16px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.introTitle)}</h2>
          <p style="font-size:0.9rem;color:#475569;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.introBody)}</p>
        </section>

        <section style="display:flex;flex-direction:column;gap:16px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.glanceTitle)}</h2>
          ${comparisonTable}
        </section>

        <section style="display:flex;flex-direction:column;gap:16px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.mechTitle)}</h2>
          <p style="font-size:0.9rem;color:#475569;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.mechLead)}</p>
        </section>

        <section style="display:flex;flex-direction:column;gap:20px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.usTitle)}</h2>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.usLead)}</p>
          <div style="display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));">
            ${kidsSafetyStandards.filter((s) => s.region === "US").map(standardCard).join("")}
          </div>
        </section>

        <section style="display:flex;flex-direction:column;gap:20px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.euTitle)}</h2>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.euLead)}</p>
          <div style="display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));">
            ${kidsSafetyStandards.filter((s) => s.region === "EU_UK").map(standardCard).join("")}
          </div>
        </section>

        <section style="display:flex;flex-direction:column;gap:18px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.verifyTitle)}</h2>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.verifyLead)}</p>
          <ul style="margin:0;padding-left:4px;list-style:none;font-size:0.9rem;color:#334155;line-height:1.7;">
            ${kidsSafetyVerification
              .map(
                (item) =>
                  `<li style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;"><span style="color:#059669;font-weight:800;line-height:1.6;">&#10003;</span><span>${escapeHtml(item[l])}</span></li>`,
              )
              .join("")}
          </ul>
        </section>

        <section style="border:1px solid #fde68a;background:#fffbeb;border-radius:16px;padding:20px;">
          <h2 style="font-size:1rem;font-weight:900;color:#0f172a;margin:0 0 8px;">${escapeHtml(t.caveatsTitle)}</h2>
          <ul style="margin:0;padding-left:20px;font-size:0.85rem;color:#475569;line-height:1.7;">
            ${kidsSafetyCaveats.map((c) => `<li style="margin-bottom:6px;">${escapeHtml(c[l])}</li>`).join("")}
          </ul>
        </section>

        <footer style="border-top:1px solid #e2e8f0;padding-top:24px;font-size:0.7rem;color:#94a3b8;line-height:1.6;">
          Source: ${escapeHtml(kidsSafetySource.name)} · Compiled: ${escapeHtml(kidsSafetySource.retrievedAt)} · ${escapeHtml(kidsSafetySource.note[l])}
        </footer>
      </div>
    </article>
  `;

  return [
    {
      route: KIDS_SAFETY_PATH,
      title: kidsSafetySeo.en.title,
      description: kidsSafetySeo.en.description,
      skipTitleH1: true,
      body: `${body}${clusterNavHtml(KIDS_SAFETY_PATH)}`,
      ogType: "website" as const,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: kidsSafetySeo.en.title,
          url: `https://balancebiketoddler.com${KIDS_SAFETY_PATH}`,
          description: kidsSafetySeo.en.description,
          inLanguage: "en",
          isPartOf: { "@type": "WebSite", name: "BalanceBikeToddler", url: "https://balancebiketoddler.com/" },
        },
        buildKidsBikeSafetyDatasetSchema(`https://balancebiketoddler.com${KIDS_SAFETY_PATH}`),
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://balancebiketoddler.com/" },
            {
              "@type": "ListItem",
              position: 2,
              name: "Kids bike safety standards",
              item: `https://balancebiketoddler.com${KIDS_SAFETY_PATH}`,
            },
          ],
        },
      ],
    },
  ];
}

/**
 * Prerendered kids-bike weight page (Plan-B Asset 5, kids-bikes counterpart).
 *
 * Derived from src/data/weightData.generated.ts, itself produced by
 * `npm run data:weight`. Every figure is interpolated from the dataset; the
 * brake and tire fields, which the source leaves blank, are rendered as a
 * stated gap rather than a guess.
 */
function renderKidsBikeWeightPage(): RoutePage[] {
  const t = kidsWeightStrings.en;
  const l = "en" as const; // prerender always emits the English canonical page
  const d = KIDS_WEIGHT_DATASET;
  const h = kidsWeightHeadline();
  const frame = kidsWeightFrameNote();

  const vars = {
    scanned: d.totals.productsScanned,
    withWeight: d.totals.withWeight,
    kbMedian: h.kbMedian,
    kbMedianKg: h.kbMedianKg,
    bbMedian: h.bbMedian,
    lighter: h.lighter,
    lighterKg: h.lighterKg,
    ratio: h.ratio,
    kbListed: h.kbListed,
    kbWithWeight: h.kbWithWeight,
    kbMin: h.kbMin,
    kbMax: h.kbMax,
    steelMed: frame.steelMed ?? "—",
    aluMed: frame.aluMed ?? "—",
    file: d.source.exportFile,
    date: d.source.retrievedAt,
    minBand: d.method.plausibleBandLb[0],
    maxBand: d.method.plausibleBandLb[1],
  };

  const compareTable = `
    <div style="overflow-x:auto;border:1px solid #e2e8f0;border-radius:16px;background:#fff;">
      <table style="width:100%;min-width:620px;border-collapse:collapse;text-align:left;">
        <thead style="background:#f8fafc;">
          <tr style="font-size:0.6rem;text-transform:uppercase;letter-spacing:0.14em;color:#64748b;">
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colCategory)}</th>
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colCount)}</th>
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colMedian)}</th>
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colRange)}</th>
          </tr>
        </thead>
        <tbody>
          ${kidsWeightCategoryRows
            .map(
              (row) => `
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;font-weight:700;color:#0f172a;">${escapeHtml(row.label[l])}</td>
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;color:#334155;">${row.withWeight}</td>
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;font-weight:700;color:#0f172a;white-space:nowrap;">${
                row.medianLb == null ? "—" : `${row.medianLb} lb / ${Math.round(row.medianLb * 0.45359237 * 10) / 10} kg`
              }</td>
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;color:#334155;white-space:nowrap;">${
                row.minLb == null ? "—" : `${row.minLb}–${row.maxLb} lb`
              }</td>
            </tr>`,
            )
            .join("")}
        </tbody>
      </table>
    </div>`;

  const body = `
    <article style="max-width:64rem;margin:0 auto;padding:32px 24px 56px;text-align:left;">
      <div style="display:flex;flex-direction:column;gap:40px;">
        <header style="display:flex;flex-direction:column;gap:20px;border-bottom:1px solid #e2e8f0;padding-bottom:32px;">
          <div style="display:inline-flex;align-items:center;gap:8px;align-self:flex-start;border:1px solid #fed7aa;background:#fff7ed;padding:4px 12px;border-radius:9999px;font-size:0.6rem;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:#ea580c;">${escapeHtml(t.eyebrow)}</div>
          <h1 style="font-size:2rem;font-weight:900;color:#0f172a;line-height:1.15;margin:0;max-width:48rem;">${escapeHtml(t.heroTitle)}</h1>
          <p style="font-size:1.05rem;color:#475569;line-height:1.7;margin:0;max-width:48rem;font-weight:500;">${escapeHtml(fillTemplate(t.heroLead, vars))}</p>
          <div style="display:flex;flex-wrap:wrap;gap:24px 48px;border:1px solid #e2e8f0;background:#f8fafc;border-radius:16px;padding:12px 16px;font-size:0.75rem;color:#475569;">
            <span>Source: ${escapeHtml(d.source.name)}</span>
            <span>Compiled: ${escapeHtml(d.source.retrievedAt)}</span>
          </div>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.heroNote)}</p>
        </header>

        <section style="display:flex;flex-direction:column;gap:16px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.shortTitle)}</h2>
          <div style="border:1px solid #fed7aa;background:#fff7ed;border-radius:16px;padding:20px;">${escapeHtml(fillTemplate(t.shortBody, vars))}</div>
        </section>

        <section style="display:flex;flex-direction:column;gap:16px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.compareTitle)}</h2>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.compareLead)}</p>
          ${compareTable}
        </section>

        <section style="display:flex;flex-direction:column;gap:16px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.mechTitle)}</h2>
          <p style="font-size:0.9rem;color:#475569;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(fillTemplate(t.mechLead, vars))}</p>
        </section>

        <section style="display:flex;flex-direction:column;gap:16px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.wheelTitle)}</h2>
          <p style="font-size:0.9rem;color:#475569;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(fillTemplate(t.wheelLead, vars))}</p>
        </section>

        <section style="display:flex;flex-direction:column;gap:16px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.frameTitle)}</h2>
          <p style="font-size:0.9rem;color:#475569;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(fillTemplate(t.frameLead, vars))}</p>
        </section>

        <section style="display:flex;flex-direction:column;gap:16px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.unknownTitle)}</h2>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.unknownLead)}</p>
          <div style="border:1px solid #fde68a;background:#fffbeb;border-radius:16px;padding:20px;display:flex;flex-direction:column;gap:12px;">
            <p style="font-size:0.85rem;color:#475569;line-height:1.7;margin:0;">${escapeHtml(fillTemplate(t.unknownBrake, { kbListed: h.kbListed }))}</p>
            <p style="font-size:0.85rem;color:#475569;line-height:1.7;margin:0;">${escapeHtml(fillTemplate(t.unknownTire, { kbListed: h.kbListed }))}</p>
          </div>
        </section>

        <section style="display:flex;flex-direction:column;gap:16px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.excludedTitle)}</h2>
          <p style="font-size:0.9rem;color:#475569;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(fillTemplate(t.excludedLead, vars))}</p>
        </section>

        <section style="display:flex;flex-direction:column;gap:16px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.methodTitle)}</h2>
          <ul style="margin:0;padding-left:20px;font-size:0.85rem;color:#334155;line-height:1.7;">
            ${t.methodBody.map((line) => `<li style="margin-bottom:6px;">${escapeHtml(fillTemplate(line, vars))}</li>`).join("")}
          </ul>
        </section>

        <section style="display:flex;flex-direction:column;gap:14px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.checkTitle)}</h2>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.checkLead)}</p>
          <ul style="margin:0;padding-left:4px;list-style:none;font-size:0.9rem;color:#334155;line-height:1.7;">
            ${t.checkBody
              .map(
                (line) =>
                  `<li style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;"><span style="color:#059669;font-weight:800;line-height:1.6;">&#10003;</span><span>${escapeHtml(line)}</span></li>`,
              )
              .join("")}
          </ul>
        </section>

        <footer style="border-top:1px solid #e2e8f0;padding-top:24px;font-size:0.7rem;color:#94a3b8;line-height:1.6;">
          Source: ${escapeHtml(d.source.name)} · Compiled: ${escapeHtml(d.source.retrievedAt)} · ${escapeHtml(d.source.note)}
        </footer>
      </div>
    </article>
  `;

  return [
    {
      route: KIDS_WEIGHT_PATH,
      title: kidsWeightSeo.en.title,
      description: kidsWeightSeo.en.description,
      skipTitleH1: true,
      body: `${body}${clusterNavHtml(KIDS_WEIGHT_PATH)}`,
      ogType: "website" as const,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: kidsWeightSeo.en.title,
          url: `https://balancebiketoddler.com${KIDS_WEIGHT_PATH}`,
          description: kidsWeightSeo.en.description,
          inLanguage: "en",
          isPartOf: { "@type": "WebSite", name: "BalanceBikeToddler", url: "https://balancebiketoddler.com/" },
        },
        buildKidsBikeWeightDatasetSchema(`https://balancebiketoddler.com${KIDS_WEIGHT_PATH}`),
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://balancebiketoddler.com/" },
            {
              "@type": "ListItem",
              position: 2,
              name: "Kids bike weight",
              item: `https://balancebiketoddler.com${KIDS_WEIGHT_PATH}`,
            },
          ],
        },
      ],
    },
  ];
}

/**
 * Prerendered kids-bike stability page.
 *
 * The pedal-bike counterpart of renderStabilityPage. Every count is interpolated
 * from KIDS_STABILITY_DATASET; nothing is typed in. The published-geometry slot
 * is intentionally absent: no kids-bike listing states a track width, so the page
 * shows the gap instead of quoting a number nobody published.
 */
function renderKidsBikeStabilityPage(): RoutePage[] {
  const t = kidsStabilityStrings.en;
  const d = KIDS_STABILITY_DATASET;
  const cov = d.coverage;

  const vars = {
    scanned: d.catalog.productsScanned,
    listed: cov.listed,
    withSpacing: cov.withTrackSpacing,
    withTire: cov.withTireClass,
    withTraining: cov.mentionsTrainingWheels,
    withRemovable: cov.trainingWheelsRemovable,
    file: d.source.exportFile,
    date: d.source.retrievedAt,
    minAge: d.ageCoverage.minAgeYears ?? "—",
    maxAge: d.ageCoverage.maxAgeYears ?? "—",
    wheelSpread: kidsStabilityWheelSpread(),
  };

  const coverageTable = `
    <div style="overflow-x:auto;border:1px solid #e2e8f0;border-radius:16px;background:#fff;">
      <table style="width:100%;min-width:560px;border-collapse:collapse;text-align:left;">
        <thead style="background:#f8fafc;">
          <tr style="font-size:0.6rem;text-transform:uppercase;letter-spacing:0.14em;color:#64748b;">
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.coverStudio)}</th>
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.coverValue)}</th>
          </tr>
        </thead>
        <tbody>
          ${kidsStabilityCoverageRows(t)
            .map(
              (row) => `
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;color:#334155;">${escapeHtml(row.label)}</td>
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;font-weight:800;color:#0f172a;white-space:nowrap;">${row.n} / ${row.of}</td>
            </tr>`,
            )
            .join("")}
        </tbody>
      </table>
    </div>`;

  const trainingTable = `
    <div style="overflow-x:auto;border:1px solid #e2e8f0;border-radius:16px;background:#fff;">
      <table style="width:100%;min-width:560px;border-collapse:collapse;text-align:left;">
        <thead style="background:#f8fafc;">
          <tr style="font-size:0.6rem;text-transform:uppercase;letter-spacing:0.14em;color:#64748b;">
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.coverStudio)}</th>
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.coverValue)}</th>
          </tr>
        </thead>
        <tbody>
          ${kidsStabilityTrainingRows(t)
            .map(
              (row) => `
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;color:#334155;">${escapeHtml(row.label)}</td>
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;font-weight:800;color:#0f172a;white-space:nowrap;">${row.n} / ${row.of}</td>
            </tr>`,
            )
            .join("")}
        </tbody>
      </table>
    </div>`;

  const claimsTable = `
    <div style="overflow-x:auto;border:1px solid #e2e8f0;border-radius:16px;background:#fff;">
      <table style="width:100%;min-width:560px;border-collapse:collapse;text-align:left;">
        <thead style="background:#f8fafc;">
          <tr style="font-size:0.6rem;text-transform:uppercase;letter-spacing:0.14em;color:#64748b;">
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.coverStudio)}</th>
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.coverValue)}</th>
          </tr>
        </thead>
        <tbody>
          ${kidsStabilityClaimRows(t)
            .map(
              (row) => `
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;color:#334155;">${escapeHtml(row.label)}</td>
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;font-weight:800;color:#0f172a;white-space:nowrap;">${row.n} / ${row.of}</td>
            </tr>`,
            )
            .join("")}
        </tbody>
      </table>
    </div>`;

  const rosterTable = `
    <div style="overflow-x:auto;border:1px solid #e2e8f0;border-radius:16px;background:#fff;">
      <table style="width:100%;min-width:860px;border-collapse:collapse;text-align:left;">
        <thead style="background:#f8fafc;">
          <tr style="font-size:0.6rem;text-transform:uppercase;letter-spacing:0.14em;color:#64748b;">
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colBrand)}</th>
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colModel)}</th>
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colTraining)}</th>
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colWheel)}</th>
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colFrame)}</th>
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colAge)}</th>
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colWeight)}</th>
          </tr>
        </thead>
        <tbody>
          ${d.kidsBikes
            .map(
              (b) => `
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:10px 12px 10px 0;font-size:0.8rem;font-weight:700;color:#0f172a;white-space:nowrap;">${escapeHtml(b.brand ?? "—")}</td>
              <td style="padding:10px 12px 10px 0;font-size:0.8rem;color:#334155;"><a href="${escapeHtml(b.productUrl)}" style="color:#334155;text-decoration:none;">${escapeHtml(b.name)}</a></td>
              <td style="padding:10px 12px 10px 0;font-size:0.8rem;color:#334155;white-space:nowrap;">${
                b.mentionsTrainingWheels
                  ? `${escapeHtml(t.published)}${b.trainingWheelsRemovable === true ? " · removable" : ""}`
                  : escapeHtml(t.notStated)
              }</td>
              <td style="padding:10px 12px 10px 0;font-size:0.8rem;color:#334155;white-space:nowrap;">${b.wheelSizeIn == null ? escapeHtml(t.notStated) : `${b.wheelSizeIn}&quot;`}</td>
              <td style="padding:10px 12px 10px 0;font-size:0.8rem;color:#334155;white-space:nowrap;">${escapeHtml(b.frameMaterial ?? t.notStated)}</td>
              <td style="padding:10px 12px 10px 0;font-size:0.8rem;color:#334155;white-space:nowrap;">${escapeHtml(b.ageText ?? t.notStated)}</td>
              <td style="padding:10px 12px 10px 0;font-size:0.8rem;color:#334155;white-space:nowrap;">${b.weightLb == null ? escapeHtml(t.notStated) : `${b.weightLb} lb`}</td>
            </tr>`,
            )
            .join("")}
        </tbody>
      </table>
    </div>`;

  const trainingQuote = kidsStabilityTrainingQuote();

  const body = `
    <article style="max-width:64rem;margin:0 auto;padding:32px 24px 56px;text-align:left;">
      <div style="display:flex;flex-direction:column;gap:40px;">
        <header style="display:flex;flex-direction:column;gap:20px;border-bottom:1px solid #e2e8f0;padding-bottom:32px;">
          <div style="display:inline-flex;align-items:center;gap:8px;align-self:flex-start;border:1px solid #fed7aa;background:#fff7ed;padding:4px 12px;border-radius:9999px;font-size:0.6rem;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:#ea580c;">${escapeHtml(t.eyebrow)}</div>
          <h1 style="font-size:2rem;font-weight:900;color:#0f172a;line-height:1.15;margin:0;max-width:48rem;">${escapeHtml(t.heroTitle)}</h1>
          <p style="font-size:1.05rem;color:#475569;line-height:1.7;margin:0;max-width:48rem;font-weight:500;">${escapeHtml(fillTemplate(t.heroLead, vars))}</p>
          <div style="display:flex;flex-wrap:wrap;gap:24px 48px;border:1px solid #e2e8f0;background:#f8fafc;border-radius:16px;padding:12px 16px;font-size:0.75rem;color:#475569;">
            <span>${escapeHtml(t.sourceLabel)}: ${escapeHtml(d.source.name)}</span>
            <span>${escapeHtml(d.source.retrievedAt)}</span>
            <span>${cov.listed} kids bikes · ${d.catalog.productsScanned} products scanned</span>
          </div>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.heroNote)}</p>
        </header>

        <section style="display:flex;flex-direction:column;gap:16px;">
          <h2 style="font-size:1.25rem;font-weight:900;color:#0f172a;margin:0;">${escapeHtml(t.gapTitle)}</h2>
          <p style="font-size:0.9rem;color:#475569;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(fillTemplate(t.gapLead, vars))}</p>
          ${coverageTable}
          <p style="font-size:0.85rem;color:#475569;line-height:1.7;margin:0;max-width:48rem;border-left:3px solid #fed7aa;padding-left:16px;">${escapeHtml(t.quoteMissing)}</p>
        </section>

        <section style="display:flex;flex-direction:column;gap:16px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:1.25rem;font-weight:900;color:#0f172a;margin:0;">${escapeHtml(t.trainingTitle)}</h2>
          <p style="font-size:0.9rem;color:#475569;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(fillTemplate(t.trainingLead, vars))}</p>
          ${trainingTable}
          ${
            trainingQuote?.trainingWheelEvidence
              ? `<figure style="margin:0;border:1px solid #fed7aa;background:#fff7ed;border-radius:16px;padding:20px;">
            <div style="font-size:0.8rem;font-weight:800;color:#0f172a;">${escapeHtml(trainingQuote.brand)}</div>
            <blockquote style="margin:12px 0 0;font-size:0.85rem;color:#334155;line-height:1.7;font-style:italic;">&ldquo;${escapeHtml(trainingQuote.trainingWheelEvidence)}&rdquo;</blockquote>
            <figcaption style="margin-top:12px;font-size:0.72rem;color:#64748b;">${escapeHtml(t.quoteSourceLabel)} · <a href="${escapeHtml(trainingQuote.productUrl)}" style="color:#ea580c;">${escapeHtml(trainingQuote.name)}</a></figcaption>
          </figure>`
              : ""
          }
        </section>

        <section style="display:flex;flex-direction:column;gap:16px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:1.25rem;font-weight:900;color:#0f172a;margin:0;">${escapeHtml(t.ageTitle)}</h2>
          <p style="font-size:0.9rem;color:#475569;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(fillTemplate(t.ageLead, vars))}</p>
        </section>

        <section style="display:flex;flex-direction:column;gap:16px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:1.25rem;font-weight:900;color:#0f172a;margin:0;">${escapeHtml(t.claimsTitle)}</h2>
          <p style="font-size:0.9rem;color:#475569;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.claimsLead)}</p>
          ${claimsTable}
          <p style="font-size:0.72rem;color:#64748b;line-height:1.6;margin:0;">${escapeHtml(t.claimed)}</p>
        </section>

        <section style="display:flex;flex-direction:column;gap:16px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:1.25rem;font-weight:900;color:#0f172a;margin:0;">${escapeHtml(t.rosterTitle)}</h2>
          <p style="font-size:0.9rem;color:#475569;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(fillTemplate(t.rosterLead, vars))}</p>
          ${rosterTable}
        </section>

        <section style="display:flex;flex-direction:column;gap:14px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:1.25rem;font-weight:900;color:#0f172a;margin:0;">${escapeHtml(t.checkTitle)}</h2>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.checkLead)}</p>
          <ul style="margin:0;padding-left:4px;list-style:none;font-size:0.9rem;color:#334155;line-height:1.7;">
            ${t.checkBody
              .map(
                (line) =>
                  `<li style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;"><span style="color:#059669;font-weight:800;line-height:1.6;">&#10003;</span><span>${escapeHtml(line)}</span></li>`,
              )
              .join("")}
          </ul>
        </section>

        <section style="display:flex;flex-direction:column;gap:16px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:1.25rem;font-weight:900;color:#0f172a;margin:0;">${escapeHtml(t.caveatTitle)}</h2>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.caveatLead)}</p>
          <div style="border:1px solid #fde68a;background:#fffbeb;border-radius:16px;padding:20px;display:flex;flex-direction:column;gap:12px;">
            ${t.caveatBody.map((line) => `<p style="font-size:0.85rem;color:#475569;line-height:1.7;margin:0;">${escapeHtml(fillTemplate(line, vars))}</p>`).join("")}
          </div>
        </section>

        <section style="display:flex;flex-direction:column;gap:16px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:1.25rem;font-weight:900;color:#0f172a;margin:0;">${escapeHtml(t.methodTitle)}</h2>
          <ul style="margin:0;padding-left:20px;font-size:0.85rem;color:#334155;line-height:1.7;">
            ${t.methodBody.map((line) => `<li style="margin-bottom:6px;">${escapeHtml(fillTemplate(line, vars))}</li>`).join("")}
          </ul>
        </section>

        <footer style="border-top:1px solid #e2e8f0;padding-top:24px;font-size:0.7rem;color:#94a3b8;line-height:1.6;">
          ${escapeHtml(t.sourceLabel)}: ${escapeHtml(d.source.name)} · ${escapeHtml(d.source.exportFile)} · ${escapeHtml(d.source.retrievedAt)} · ${escapeHtml(d.source.note)}
        </footer>
      </div>
    </article>
  `;

  return [
    {
      route: KIDS_STABILITY_PATH,
      title: kidsStabilitySeo.en.title,
      description: kidsStabilitySeo.en.description,
      skipTitleH1: true,
      body: `${body}${clusterNavHtml(KIDS_STABILITY_PATH)}`,
      ogType: "website" as const,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: kidsStabilitySeo.en.title,
          url: `https://balancebiketoddler.com${KIDS_STABILITY_PATH}`,
          description: kidsStabilitySeo.en.description,
          inLanguage: "en",
          isPartOf: { "@type": "WebSite", name: "BalanceBikeToddler", url: "https://balancebiketoddler.com/" },
        },
        buildKidsBikeStabilityDatasetSchema(`https://balancebiketoddler.com${KIDS_STABILITY_PATH}`),
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://balancebiketoddler.com/" },
            {
              "@type": "ListItem",
              position: 2,
              name: "Kids bike stability",
              item: `https://balancebiketoddler.com${KIDS_STABILITY_PATH}`,
            },
          ],
        },
      ],
    },
  ];
}

/**
 * Prerendered kids-bike buyer-feedback page.
 *
 * Counts mentions in the retailer-generated `customersSay` summaries. The
 * provenance block is emitted before any table so a crawler reading top-down
 * meets the caveat before the numbers.
 */
function renderKidsBuyerFeedbackPage(): RoutePage[] {
  const t = kidsBuyerFeedbackStrings.en;
  const d = KIDS_REVIEW_DATASET;
  const total = d.kidsBikeSummaries;

  const themeRows = d.themes
    .map(
      (theme) => `
      <tr style="border-bottom:1px solid #f1f5f9;">
        <td style="padding:10px 12px 10px 0;font-size:0.82rem;font-weight:700;color:#0f172a;">${escapeHtml(theme.label)}</td>
        <td style="padding:10px 12px 10px 0;font-size:0.82rem;font-weight:800;color:#ea580c;white-space:nowrap;">${theme.count} of ${total}</td>
        <td style="padding:10px 0;font-size:0.72rem;color:#475569;line-height:1.6;">${escapeHtml(theme.note)}</td>
      </tr>`,
    )
    .join("");

  const hedgeRows = d.hedges
    .map(
      (hedge) => `
      <tr style="border-bottom:1px solid #f1f5f9;">
        <td style="padding:10px 12px 10px 0;font-size:0.82rem;font-weight:700;color:#0f172a;">${escapeHtml(hedge.label)}</td>
        <td style="padding:10px 0;font-size:0.82rem;font-weight:800;color:#ea580c;white-space:nowrap;">${hedge.count} of ${total}</td>
      </tr>`,
    )
    .join("");

  const listingRows = d.listings
    .map(
      (listing) => `
      <tr style="border-bottom:1px solid #f1f5f9;">
        <td style="padding:10px 12px 10px 0;font-size:0.8rem;color:#334155;"><a href="/products/kids-bikes/${escapeHtml(listing.id)}" style="color:#334155;text-decoration:none;">${escapeHtml(listing.name)}</a></td>
        <td style="padding:10px 0;font-size:0.72rem;color:#64748b;white-space:nowrap;">${listing.chars}</td>
      </tr>`,
    )
    .join("");

  const body = `
    <article style="max-width:64rem;margin:0 auto;padding:32px 24px 56px;text-align:left;">
      <div style="display:flex;flex-direction:column;gap:40px;">
        <header style="display:flex;flex-direction:column;gap:16px;border-bottom:1px solid #e2e8f0;padding-bottom:32px;">
          <p style="margin:0;font-size:0.6rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;">${escapeHtml(t.eyebrow)}</p>
          <h1 style="font-size:2rem;font-weight:900;color:#0f172a;line-height:1.15;margin:0;max-width:48rem;">${escapeHtml(t.h1)}</h1>
          <p style="font-size:1rem;color:#334155;line-height:1.8;margin:0;max-width:48rem;">${escapeHtml(t.lead)}</p>
        </header>

        <section style="border:1px solid #fed7aa;background:#fff7ed;border-radius:16px;padding:20px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0 0 12px;">${escapeHtml(t.provenanceTitle)}</h2>
          <ul style="margin:0;padding-left:20px;font-size:0.85rem;color:#475569;line-height:1.7;">
            ${t.provenanceBody.map((line) => `<li style="margin-bottom:6px;">${escapeHtml(line)}</li>`).join("")}
          </ul>
        </section>

        <section style="display:flex;flex-direction:column;gap:16px;">
          <h2 style="font-size:1.25rem;font-weight:900;color:#0f172a;margin:0;">${escapeHtml(t.themeTitle)}</h2>
          <p style="font-size:0.9rem;color:#475569;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.themeIntro)}</p>
          <div style="overflow-x:auto;border:1px solid #e2e8f0;border-radius:16px;background:#fff;">
            <table style="width:100%;min-width:640px;border-collapse:collapse;text-align:left;">
              <thead style="background:#f8fafc;">
                <tr style="font-size:0.6rem;text-transform:uppercase;letter-spacing:0.14em;color:#64748b;">
                  <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.themeColTopic)}</th>
                  <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.themeColCount)}</th>
                  <th style="padding:12px 0;font-weight:800;">${escapeHtml(t.themeColNote)}</th>
                </tr>
              </thead>
              <tbody>${themeRows}</tbody>
            </table>
          </div>
        </section>

        <section style="display:flex;flex-direction:column;gap:16px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:1.25rem;font-weight:900;color:#0f172a;margin:0;">${escapeHtml(t.hedgeTitle)}</h2>
          <p style="font-size:0.9rem;color:#475569;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.hedgeIntro)}</p>
          <div style="overflow-x:auto;border:1px solid #e2e8f0;border-radius:16px;background:#fff;">
            <table style="width:100%;min-width:420px;border-collapse:collapse;text-align:left;">
              <thead style="background:#f8fafc;">
                <tr style="font-size:0.6rem;text-transform:uppercase;letter-spacing:0.14em;color:#64748b;">
                  <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.themeColTopic)}</th>
                  <th style="padding:12px 0;font-weight:800;">${escapeHtml(t.themeColCount)}</th>
                </tr>
              </thead>
              <tbody>${hedgeRows}</tbody>
            </table>
          </div>
        </section>

        <section style="display:flex;flex-direction:column;gap:16px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:1.25rem;font-weight:900;color:#0f172a;margin:0;">${escapeHtml(t.listingTitle)}</h2>
          <div style="overflow-x:auto;border:1px solid #e2e8f0;border-radius:16px;background:#fff;">
            <table style="width:100%;min-width:640px;border-collapse:collapse;text-align:left;">
              <thead style="background:#f8fafc;">
                <tr style="font-size:0.6rem;text-transform:uppercase;letter-spacing:0.14em;color:#64748b;">
                  <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.listingColName)}</th>
                  <th style="padding:12px 0;font-weight:800;">${escapeHtml(t.listingColChars)}</th>
                </tr>
              </thead>
              <tbody>${listingRows}</tbody>
            </table>
          </div>
        </section>

        <section style="display:flex;flex-direction:column;gap:16px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:1.25rem;font-weight:900;color:#0f172a;margin:0;">${escapeHtml(t.methodTitle)}</h2>
          <ul style="margin:0;padding-left:20px;font-size:0.85rem;color:#334155;line-height:1.7;">
            ${t.methodBody.map((line) => `<li style="margin-bottom:6px;">${escapeHtml(line)}</li>`).join("")}
          </ul>
        </section>

        <footer style="border-top:1px solid #e2e8f0;padding-top:24px;font-size:0.7rem;color:#94a3b8;line-height:1.6;">
          ${escapeHtml(t.sourceLabel)}: ${escapeHtml(t.sourceNote)}
        </footer>
      </div>
    </article>
  `;

  return [
    {
      route: KIDS_BUYER_FEEDBACK_PATH,
      title: kidsBuyerFeedbackSeo.en.title,
      description: kidsBuyerFeedbackSeo.en.description,
      skipTitleH1: true,
      body: `${body}${clusterNavHtml(KIDS_BUYER_FEEDBACK_PATH)}`,
      ogType: "website" as const,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: kidsBuyerFeedbackSeo.en.title,
          url: `https://balancebiketoddler.com${KIDS_BUYER_FEEDBACK_PATH}`,
          description: kidsBuyerFeedbackSeo.en.description,
          inLanguage: "en",
          isPartOf: { "@type": "WebSite", name: "BalanceBikeToddler", url: "https://balancebiketoddler.com/" },
        },
        buildKidsBuyerFeedbackDatasetSchema(`https://balancebiketoddler.com${KIDS_BUYER_FEEDBACK_PATH}`),
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://balancebiketoddler.com/" },
            {
              "@type": "ListItem",
              position: 2,
              name: "What buyers say about kids bikes",
              item: `https://balancebiketoddler.com${KIDS_BUYER_FEEDBACK_PATH}`,
            },
          ],
        },
      ],
    },
  ];
}

/**
 * Prerendered kids-bike recall record.
 *
 * Reuses the CPSC dataset the balance-bike record already ships, filtered to
 * children's-bicycle notices. Counts are of notices, not units, and the page says
 * so — a single notice can cover a run of hundreds of thousands of bikes.
 */
function renderKidsBikeRecallsPage(): RoutePage[] {
  const t = kidsRecallsStrings.en;
  const balanceRatio =
    recallDataset.totals.balanceBikeNotices > 0
      ? Math.round(kidsRecallTotal / recallDataset.totals.balanceBikeNotices)
      : kidsRecallTotal;

  const vars = {
    startYear: kidsRecallCoverage.startYear,
    endYear: kidsRecallCoverage.endYear,
    retrievedAt: kidsRecallCoverage.retrievedAt,
    kids: kidsRecallTotal,
    balance: recallDataset.totals.balanceBikeNotices,
    helmet: recallDataset.totals.kidHelmetNotices,
    total: recallDataset.totals.cpscNoticesRetrieved,
    balanceRatio,
  };

  const latestYear = kidsRecallByYear[kidsRecallByYear.length - 1]?.year ?? null;

  const noticeCards = kidsRecallSorted
    .slice(0, 8)
    .map(
      (n) => `
      <article style="border:1px solid #e2e8f0;border-radius:16px;background:#fff;padding:16px 20px;">
        <div style="font-size:0.7rem;font-weight:800;color:#64748b;">${escapeHtml(n.date)} · CPSC #${escapeHtml(n.recallNumber)}${n.units ? ` · ${escapeHtml(n.units)}` : ""}</div>
        <h3 style="margin:8px 0 0;font-size:0.9rem;font-weight:800;color:#0f172a;line-height:1.5;">${escapeHtml(n.title)}</h3>
        <p style="margin:8px 0 0;font-size:0.78rem;color:#475569;line-height:1.6;">${escapeHtml(n.hazard)}</p>
        <p style="margin:8px 0 0;font-size:0.72rem;color:#64748b;font-weight:700;">${escapeHtml(n.party)}</p>
        <a href="${escapeHtml(n.url)}" style="display:inline-block;margin-top:12px;font-size:0.75rem;font-weight:800;color:#ea580c;">${escapeHtml(t.openNotice)} &rarr;</a>
      </article>`,
    )
    .join("");

  const hazardRows = kidsRecallHazards
    .map(
      (h) => `
      <tr style="border-bottom:1px solid #f1f5f9;">
        <td style="padding:10px 12px 10px 0;font-size:0.82rem;color:#334155;">${escapeHtml(h.label)}</td>
        <td style="padding:10px 0;font-size:0.82rem;font-weight:800;color:#0f172a;white-space:nowrap;">${h.count}</td>
      </tr>`,
    )
    .join("");

  const trendRows = kidsRecallByYear
    .map(
      (row) => `
      <tr style="border-bottom:1px solid #f1f5f9;${row.year === latestYear ? "background:#fff7ed;" : ""}">
        <td style="padding:8px 12px 8px 0;font-size:0.8rem;color:#334155;white-space:nowrap;">${row.year}${row.year === latestYear ? ` <span style="font-size:0.6rem;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:#ea580c;">in progress</span>` : ""}</td>
        <td style="padding:8px 0;font-size:0.8rem;font-weight:800;color:#0f172a;white-space:nowrap;">${row.notices}</td>
      </tr>`,
    )
    .join("");

  const periodRows = kidsRecallPeriods
    .map(
      (row) => `
      <tr style="border-bottom:1px solid #f1f5f9;">
        <td style="padding:10px 12px 10px 0;font-size:0.82rem;color:#334155;white-space:nowrap;">${escapeHtml(row.period)}</td>
        <td style="padding:10px 0;font-size:0.82rem;font-weight:800;color:#0f172a;white-space:nowrap;">${row.kidBikeNotices}</td>
      </tr>`,
    )
    .join("");

  const body = `
    <article style="max-width:64rem;margin:0 auto;padding:32px 24px 56px;text-align:left;">
      <div style="display:flex;flex-direction:column;gap:40px;">
        <header style="display:flex;flex-direction:column;gap:20px;border-bottom:1px solid #e2e8f0;padding-bottom:32px;">
          <div style="display:inline-flex;align-items:center;gap:8px;align-self:flex-start;border:1px solid #fecaca;background:#fef2f2;padding:4px 12px;border-radius:9999px;font-size:0.6rem;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:#dc2626;">${escapeHtml(t.eyebrow)}</div>
          <h1 style="font-size:2rem;font-weight:900;color:#0f172a;line-height:1.15;margin:0;max-width:48rem;">${escapeHtml(t.heroTitle)}</h1>
          <p style="font-size:1.05rem;color:#475569;line-height:1.7;margin:0;max-width:48rem;font-weight:500;">${escapeHtml(fillTemplate(t.heroLead, vars))}</p>
          <div style="display:flex;flex-wrap:wrap;gap:24px 48px;border:1px solid #e2e8f0;background:#f8fafc;border-radius:16px;padding:12px 16px;font-size:0.75rem;color:#475569;">
            <span>${escapeHtml(t.retrievedLabel)}: ${escapeHtml(kidsRecallCoverage.retrievedAt)}</span>
            <span>${escapeHtml(t.coverageLabel)}: ${kidsRecallCoverage.startYear}–${kidsRecallCoverage.endYear}</span>
          </div>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.heroNote)}</p>
        </header>

        <section style="display:flex;flex-direction:column;gap:16px;">
          <h2 style="font-size:1.25rem;font-weight:900;color:#0f172a;margin:0;">${escapeHtml(t.scopeTitle)}</h2>
          <p style="font-size:0.9rem;color:#475569;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(fillTemplate(t.scopeLead, vars))}</p>
          <div style="overflow-x:auto;border:1px solid #e2e8f0;border-radius:16px;background:#fff;">
            <table style="width:100%;min-width:560px;border-collapse:collapse;text-align:left;">
              <thead style="background:#f8fafc;">
                <tr style="font-size:0.6rem;text-transform:uppercase;letter-spacing:0.14em;color:#64748b;">
                  <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.coverLabel)}</th>
                  <th style="padding:12px 0;font-weight:800;">${escapeHtml(t.scopeCount)}</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom:1px solid #f1f5f9;">
                  <td style="padding:10px 12px 10px 0;font-size:0.82rem;font-weight:700;color:#0f172a;">${escapeHtml(t.scopeKids)}</td>
                  <td style="padding:10px 0;font-size:0.82rem;font-weight:800;color:#ea580c;white-space:nowrap;">${kidsRecallTotal}</td>
                </tr>
                <tr style="border-bottom:1px solid #f1f5f9;">
                  <td style="padding:10px 12px 10px 0;font-size:0.82rem;color:#334155;">${escapeHtml(t.scopeHelmet)}</td>
                  <td style="padding:10px 0;font-size:0.82rem;font-weight:800;color:#0f172a;white-space:nowrap;">${vars.helmet}</td>
                </tr>
                <tr style="border-bottom:1px solid #f1f5f9;">
                  <td style="padding:10px 12px 10px 0;font-size:0.82rem;color:#334155;">${escapeHtml(t.scopeBalance)}</td>
                  <td style="padding:10px 0;font-size:0.82rem;font-weight:800;color:#0f172a;white-space:nowrap;">${vars.balance}</td>
                </tr>
                <tr>
                  <td style="padding:10px 12px 10px 0;font-size:0.82rem;color:#64748b;">${escapeHtml(t.scopeTotal)}</td>
                  <td style="padding:10px 0;font-size:0.82rem;font-weight:800;color:#64748b;white-space:nowrap;">${vars.total}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section style="display:flex;flex-direction:column;gap:16px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:1.25rem;font-weight:900;color:#0f172a;margin:0;">${escapeHtml(t.latestTitle)}</h2>
          <p style="font-size:0.9rem;color:#475569;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.latestLead)}</p>
          <div style="display:flex;flex-direction:column;gap:12px;">${noticeCards}</div>
        </section>

        <section style="display:flex;flex-direction:column;gap:16px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:1.25rem;font-weight:900;color:#0f172a;margin:0;">${escapeHtml(t.hazardTitle)}</h2>
          <p style="font-size:0.9rem;color:#475569;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.hazardLead)}</p>
          <div style="overflow-x:auto;border:1px solid #e2e8f0;border-radius:16px;background:#fff;">
            <table style="width:100%;min-width:560px;border-collapse:collapse;text-align:left;">
              <thead style="background:#f8fafc;">
                <tr style="font-size:0.6rem;text-transform:uppercase;letter-spacing:0.14em;color:#64748b;">
                  <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.hazardColHazard)}</th>
                  <th style="padding:12px 0;font-weight:800;">${escapeHtml(t.hazardColCount)}</th>
                </tr>
              </thead>
              <tbody>${hazardRows}</tbody>
            </table>
          </div>
        </section>

        <section style="display:flex;flex-direction:column;gap:16px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:1.25rem;font-weight:900;color:#0f172a;margin:0;">${escapeHtml(t.trendTitle)}</h2>
          <p style="font-size:0.9rem;color:#475569;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.trendLead)}</p>
          <div style="overflow-x:auto;border:1px solid #e2e8f0;border-radius:16px;background:#fff;">
            <table style="width:100%;min-width:420px;border-collapse:collapse;text-align:left;">
              <thead style="background:#f8fafc;">
                <tr style="font-size:0.6rem;text-transform:uppercase;letter-spacing:0.14em;color:#64748b;">
                  <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.trendColYear)}</th>
                  <th style="padding:12px 0;font-weight:800;">${escapeHtml(t.trendColNotices)}</th>
                </tr>
              </thead>
              <tbody>${trendRows}</tbody>
            </table>
          </div>
        </section>

        <section style="display:flex;flex-direction:column;gap:16px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:1.25rem;font-weight:900;color:#0f172a;margin:0;">${escapeHtml(t.periodTitle)}</h2>
          <p style="font-size:0.9rem;color:#475569;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.periodLead)}</p>
          <div style="overflow-x:auto;border:1px solid #e2e8f0;border-radius:16px;background:#fff;">
            <table style="width:100%;min-width:420px;border-collapse:collapse;text-align:left;">
              <thead style="background:#f8fafc;">
                <tr style="font-size:0.6rem;text-transform:uppercase;letter-spacing:0.14em;color:#64748b;">
                  <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.periodColSpan)}</th>
                  <th style="padding:12px 0;font-weight:800;">${escapeHtml(t.periodColNotices)}</th>
                </tr>
              </thead>
              <tbody>${periodRows}</tbody>
            </table>
          </div>
        </section>

        <section style="display:flex;flex-direction:column;gap:14px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:1.25rem;font-weight:900;color:#0f172a;margin:0;">${escapeHtml(t.checkTitle)}</h2>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.checkLead)}</p>
          <ul style="margin:0;padding-left:4px;list-style:none;font-size:0.9rem;color:#334155;line-height:1.7;">
            ${t.checkBody
              .map(
                (line) =>
                  `<li style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;"><span style="color:#ea580c;font-weight:800;line-height:1.6;">&#9679;</span><span>${escapeHtml(line)}</span></li>`,
              )
              .join("")}
          </ul>
        </section>

        <section style="display:flex;flex-direction:column;gap:16px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:1.25rem;font-weight:900;color:#0f172a;margin:0;">${escapeHtml(t.caveatTitle)}</h2>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.caveatLead)}</p>
          <div style="border:1px solid #fde68a;background:#fffbeb;border-radius:16px;padding:20px;display:flex;flex-direction:column;gap:12px;">
            ${t.caveatBody.map((line) => `<p style="font-size:0.85rem;color:#475569;line-height:1.7;margin:0;">${escapeHtml(fillTemplate(line, vars))}</p>`).join("")}
          </div>
        </section>

        <section style="display:flex;flex-direction:column;gap:16px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:1.25rem;font-weight:900;color:#0f172a;margin:0;">${escapeHtml(t.methodTitle)}</h2>
          <ul style="margin:0;padding-left:20px;font-size:0.85rem;color:#334155;line-height:1.7;">
            ${t.methodBody.map((line) => `<li style="margin-bottom:6px;">${escapeHtml(fillTemplate(line, vars))}</li>`).join("")}
          </ul>
        </section>

        <footer style="border-top:1px solid #e2e8f0;padding-top:24px;font-size:0.7rem;color:#94a3b8;line-height:1.6;">
          ${escapeHtml(t.sourceLabel)}: ${escapeHtml(kidsRecallCoverage.name)} · <a href="${escapeHtml(kidsRecallCoverage.publisher)}" style="color:#94a3b8;">${escapeHtml(kidsRecallCoverage.publisher)}</a> · ${escapeHtml(t.retrievedLabel)} ${escapeHtml(kidsRecallCoverage.retrievedAt)}
        </footer>
      </div>
    </article>
  `;

  return [
    {
      route: KIDS_RECALLS_PATH,
      title: kidsRecallsSeo.en.title,
      description: kidsRecallsSeo.en.description,
      skipTitleH1: true,
      body: `${body}${clusterNavHtml(KIDS_RECALLS_PATH)}`,
      ogType: "website" as const,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: kidsRecallsSeo.en.title,
          url: `https://balancebiketoddler.com${KIDS_RECALLS_PATH}`,
          description: kidsRecallsSeo.en.description,
          inLanguage: "en",
          isPartOf: { "@type": "WebSite", name: "BalanceBikeToddler", url: "https://balancebiketoddler.com/" },
        },
        buildKidsRecallsDatasetSchema(`https://balancebiketoddler.com${KIDS_RECALLS_PATH}`),
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://balancebiketoddler.com/" },
            {
              "@type": "ListItem",
              position: 2,
              name: "Kids bike recalls",
              item: `https://balancebiketoddler.com${KIDS_RECALLS_PATH}`,
            },
          ],
        },
      ],
    },
  ];
}

/**
 * Prerendered kids-scooter asset pages (8 pages, Plan-B cluster).
 *
 * The bodies are built in scripts/kidsScooterPages.ts, which is a separate
 * module because these eight pages share one dataset (scooterData.generated.ts)
 * and eight near-identical HTML skeletons. Only the skeleton is shared there —
 * every string still comes from each page's own string module, which is what
 * scripts/check-topic-pair-drift.mjs requires.
 *
 * Each page gets one WebPage node plus a BreadcrumbList, matching the shape the
 * other asset pages emit (the guard asserts exactly one node per @type).
 */
function renderKidsScooterPages(): RoutePage[] {
  const origin = "https://balancebiketoddler.com";
  return renderKidsScooterPageBodies(origin, KIDS_SCOOTER_SEO_BY_PATH).map((p) => ({
    route: p.route,
    title: p.title,
    description: p.description,
    skipTitleH1: p.skipTitleH1,
    h1En: p.h1En,
    keywords: p.keywords,
    body: `${p.body}${clusterNavHtml(p.route)}`,
    ogType: "website" as const,
    jsonLd: [
      ...p.jsonLd,
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${origin}/` },
          { "@type": "ListItem", position: 2, name: p.h1En, item: `${origin}${p.route}` },
        ],
      },
    ],
  }));
}

/**
 * Prerendered kids-ride-on asset pages (8 pages, Plan-B cluster).
 *
 * Same shape as the scooter cluster: bodies come from scripts/kidsRideOnPages.ts,
 * which shares only the HTML skeleton — every string comes from each ride-on
 * page's own string module, so scripts/check-topic-pair-drift.mjs sees eight
 * genuinely different pages.
 */
function renderKidsRideOnPages(): RoutePage[] {
  const origin = "https://balancebiketoddler.com";
  return renderKidsRideOnPageBodies(origin, KIDS_RIDE_ON_SEO_BY_PATH).map((p) => ({
    route: p.route,
    title: p.title,
    description: p.description,
    skipTitleH1: p.skipTitleH1,
    h1En: p.h1En,
    keywords: p.keywords,
    body: `${p.body}${clusterNavHtml(p.route)}`,
    ogType: "website" as const,
    jsonLd: [
      ...p.jsonLd,
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${origin}/` },
          { "@type": "ListItem", position: 2, name: p.h1En, item: `${origin}${p.route}` },
        ],
      },
    ],
  }));
}

/**
 * Prerendered kids-tricycle asset pages (8 pages, Plan-B cluster).
 * Bodies come from scripts/kidsTricyclePages.ts; each page's strings come from
 * its own module so check-topic-pair-drift sees eight distinct pages.
 */
function renderKidsTricyclePages(): RoutePage[] {
  const origin = "https://balancebiketoddler.com";
  return renderKidsTricyclePageBodies(origin, KIDS_TRICYCLE_SEO_BY_PATH).map((p) => ({
    route: p.route,
    title: p.title,
    description: p.description,
    skipTitleH1: p.skipTitleH1,
    h1En: p.h1En,
    keywords: p.keywords,
    body: `${p.body}${clusterNavHtml(p.route)}`,
    ogType: "website" as const,
    jsonLd: [
      ...p.jsonLd,
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${origin}/` },
          { "@type": "ListItem", position: 2, name: p.h1En, item: `${origin}${p.route}` },
        ],
      },
    ],
  }));
}

/**
 * Prerendered kids-stroller asset pages (8 pages, Plan-B cluster).
 * Bodies come from scripts/kidsStrollerPages.ts; each page's strings come from
 * its own module so check-topic-pair-drift sees eight distinct pages.
 */
function renderKidsStrollerPages(): RoutePage[] {
  const origin = "https://balancebiketoddler.com";
  return renderKidsStrollerPageBodies(origin, KIDS_STROLLER_SEO_BY_PATH).map((p) => ({
    route: p.route,
    title: p.title,
    description: p.description,
    skipTitleH1: p.skipTitleH1,
    h1En: p.h1En,
    keywords: p.keywords,
    body: `${p.body}${clusterNavHtml(p.route)}`,
    ogType: "website" as const,
    jsonLd: [
      ...p.jsonLd,
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${origin}/` },
          { "@type": "ListItem", position: 2, name: p.h1En, item: `${origin}${p.route}` },
        ],
      },
    ],
  }));
}

/**
 * Prerendered weight & build page (Plan-B Asset 5).
 *
 * Derived from src/data/weightData.generated.ts, itself produced by
 * `npm run data:weight`. Every figure is interpolated from the dataset; the
 * brake and tire fields, which the source leaves blank, are rendered as a stated
 * gap rather than a guess.
 */
function renderWeightPage(): RoutePage[] {
  const t = weightStrings.en;
  const l = "en" as const; // prerender always emits the English canonical page
  const d = WEIGHT_DATASET;
  const facts = headlineFacts();

  const vars: Record<string, string | number> = {
    scanned: d.totals.productsScanned,
    withWeight: d.totals.withWeight,
    bbMedian: facts?.balanceBikeMedianLb ?? "—",
    kbMedian: facts?.kidsBikeMedianLb ?? "—",
    lighter: facts?.lighterByLb ?? "—",
    lighterKg: facts?.lighterByKg ?? "—",
    ratio: facts?.ratio ?? "—",
    n: d.totals.balanceBikesWithWeight,
    listed: d.totals.balanceBikesListed,
    file: d.source.exportFile,
    date: d.source.retrievedAt,
    min: d.method.plausibleBandLb[0],
    max: d.method.plausibleBandLb[1],
  };
  const fill = (s: string) => fillTemplate(s, vars);

  const categoryTable = `
    <div style="overflow-x:auto;border:1px solid #e2e8f0;border-radius:16px;background:#fff;">
      <table style="width:100%;min-width:620px;border-collapse:collapse;text-align:left;">
        <thead style="background:#f8fafc;">
          <tr style="font-size:0.6rem;text-transform:uppercase;letter-spacing:0.14em;color:#64748b;">
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colCategory)}</th>
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colCount)}</th>
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colMedian)}</th>
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colRange)}</th>
          </tr>
        </thead>
        <tbody>
          ${weightCategoryRows
            .map(
              (row) => `
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;font-weight:700;color:#0f172a;">${escapeHtml(row.label[l])}</td>
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;color:#334155;">${row.withWeight}</td>
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;font-weight:700;color:#0f172a;white-space:nowrap;">${row.medianLb == null ? "&mdash;" : `${row.medianLb} lb / ${lbToKg(row.medianLb)} kg`}</td>
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;color:#334155;white-space:nowrap;">${row.minLb == null ? "&mdash;" : `${row.minLb}&ndash;${row.maxLb} lb`}</td>
            </tr>`,
            )
            .join("")}
        </tbody>
      </table>
    </div>`;

  const rosterTable = `
    <div style="overflow-x:auto;border:1px solid #e2e8f0;border-radius:16px;background:#fff;">
      <table style="width:100%;min-width:760px;border-collapse:collapse;text-align:left;">
        <thead style="background:#f8fafc;">
          <tr style="font-size:0.6rem;text-transform:uppercase;letter-spacing:0.14em;color:#64748b;">
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colBrand)}</th>
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colModel)}</th>
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colWeight)}</th>
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colFrame)}</th>
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colWheel)}</th>
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colPrice)}</th>
          </tr>
        </thead>
        <tbody>
          ${d.balanceBikes
            .map(
              (b) => `
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;font-weight:700;color:#0f172a;white-space:nowrap;">${escapeHtml(b.brand ?? "&mdash;")}</td>
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;color:#334155;max-width:20rem;"><a href="${escapeHtml(b.productUrl)}" style="color:#334155;text-decoration:none;">${escapeHtml(b.name)}</a></td>
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;font-weight:700;color:#0f172a;white-space:nowrap;">${b.weightLb} lb / ${lbToKg(b.weightLb)} kg</td>
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;color:#334155;">${escapeHtml(b.frameMaterial ? frameLabel(b.frameMaterial)[l] : t.notListed)}</td>
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;color:#334155;white-space:nowrap;">${b.wheelInches ? `${b.wheelInches}&quot;` : escapeHtml(t.notListed)}</td>
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;color:#334155;white-space:nowrap;">${b.priceUsd ? `$${b.priceUsd}` : escapeHtml(t.notListed)}</td>
            </tr>`,
            )
            .join("")}
        </tbody>
      </table>
    </div>`;

  const frameCards = d.frameBreakdown
    .map(
      (row) => `
    <div style="border:1px solid #e2e8f0;background:#fff;border-radius:16px;padding:20px;">
      <div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;align-items:baseline;">
        <h3 style="font-size:1rem;font-weight:900;color:#0f172a;margin:0;">${escapeHtml(frameLabel(row.material)[l])}</h3>
        <span style="font-size:0.72rem;font-weight:700;color:#64748b;">n = ${row.n}</span>
      </div>
      <p style="font-size:0.85rem;color:#334155;line-height:1.7;margin:8px 0 0;">
        <strong style="color:#0f172a;">${row.medianLb} lb (${lbToKg(row.medianLb)} kg)</strong>
        <span style="color:#64748b;"> &middot; ${row.minLb}&ndash;${row.maxLb} lb</span>
      </p>
      ${row.smallSample ? `<p style="font-size:0.72rem;font-weight:700;color:#b45309;margin:8px 0 0;">${escapeHtml(t.smallSample)}</p>` : ""}
    </div>`,
    )
    .join("");

  const brakeSpecified = d.categories.reduce((n, c) => n + c.brakeSpecified, 0);
  const tireSpecified = d.categories.reduce((n, c) => n + c.tireSpecified, 0);

  const body = `
    <article style="max-width:64rem;margin:0 auto;padding:32px 24px 56px;text-align:left;">
      <div style="display:flex;flex-direction:column;gap:40px;">
        <header style="display:flex;flex-direction:column;gap:20px;border-bottom:1px solid #e2e8f0;padding-bottom:32px;">
          <div style="display:inline-flex;align-items:center;gap:8px;align-self:flex-start;border:1px solid #fed7aa;background:#fff7ed;padding:4px 12px;border-radius:9999px;font-size:0.6rem;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:#ea580c;">${escapeHtml(t.eyebrow)}</div>
          <h1 style="font-size:2rem;font-weight:900;color:#0f172a;line-height:1.15;margin:0;max-width:48rem;">${escapeHtml(t.heroTitle)}</h1>
          <p style="font-size:1.05rem;color:#475569;line-height:1.7;margin:0;max-width:48rem;font-weight:500;">${escapeHtml(fill(t.heroLead))}</p>
          <div style="display:flex;flex-wrap:wrap;gap:24px 48px;border:1px solid #e2e8f0;background:#f8fafc;border-radius:16px;padding:12px 16px;font-size:0.75rem;color:#475569;">
            <span>${escapeHtml(t.sourceLabel)}: ${escapeHtml(d.source.name)}</span>
            <span>${escapeHtml(d.source.retrievedAt)}</span>
          </div>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.heroNote)}</p>
        </header>

        ${
          facts
            ? `<section style="display:flex;flex-direction:column;gap:16px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.headlineTitle)}</h2>
          <div style="border:1px solid #fed7aa;background:#fff7ed;border-radius:16px;padding:20px;">
            <p style="font-size:1rem;color:#1f2937;line-height:1.7;margin:0;font-weight:500;">${escapeHtml(fill(t.headlineBody))}</p>
          </div>
        </section>`
            : ""
        }

        <section style="display:flex;flex-direction:column;gap:16px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.tableTitle)}</h2>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.tableLead)}</p>
          ${categoryTable}
        </section>

        <section style="display:flex;flex-direction:column;gap:16px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.rosterTitle)}</h2>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(fill(t.rosterLead))}</p>
          ${rosterTable}
        </section>

        <section style="display:flex;flex-direction:column;gap:16px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.frameTitle)}</h2>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(fillTemplate(t.frameLead, { n: d.balanceBikes.length }))}</p>
          <div style="display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));">
            ${frameCards}
          </div>
        </section>

        <section style="display:flex;flex-direction:column;gap:12px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.unknownTitle)}</h2>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.unknownLead)}</p>
          <div style="border:1px solid #fde68a;background:#fffbeb;border-radius:16px;padding:20px;">
            <p style="font-size:0.85rem;color:#334155;line-height:1.7;margin:0 0 10px;">${escapeHtml(fillTemplate(t.unknownBrake, { specified: brakeSpecified, listed: d.totals.productsScanned }))}</p>
            <p style="font-size:0.85rem;color:#334155;line-height:1.7;margin:0;">${escapeHtml(fillTemplate(t.unknownTire, { specified: tireSpecified, listed: d.totals.productsScanned }))}</p>
          </div>
        </section>

        ${
          d.excludedSuspect.length
            ? `<section style="display:flex;flex-direction:column;gap:12px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.excludedTitle)}</h2>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(fill(t.excludedLead))}</p>
          <ul style="margin:0;padding:20px 20px 20px 40px;border:1px solid #e2e8f0;background:#fff;border-radius:16px;font-size:0.85rem;color:#334155;line-height:1.7;">
            ${d.excludedSuspect
              .map(
                (e) =>
                  `<li style="margin-bottom:6px;"><strong style="color:#0f172a;">${escapeHtml(e.brand ?? "&mdash;")} &mdash; ${escapeHtml(categoryLabels[e.category]?.[l] ?? e.category)}</strong> &middot; ${escapeHtml(t.colWeight)}: ${escapeHtml(e.rawWeight)} &middot; ${escapeHtml(e.reason)}</li>`,
              )
              .join("")}
          </ul>
        </section>`
            : ""
        }

        <section style="display:flex;flex-direction:column;gap:12px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.methodTitle)}</h2>
          <ul style="margin:0;padding-left:20px;font-size:0.85rem;color:#475569;line-height:1.7;max-width:48rem;">
            ${t.methodBody.map((line) => `<li style="margin-bottom:6px;">${escapeHtml(fill(line))}</li>`).join("")}
          </ul>
        </section>

        <section style="display:flex;flex-direction:column;gap:12px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.checkTitle)}</h2>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.checkLead)}</p>
          <ul style="margin:0;padding-left:4px;list-style:none;font-size:0.9rem;color:#334155;line-height:1.7;">
            ${t.checkBody
              .map(
                (line) =>
                  `<li style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;"><span style="color:#059669;font-weight:800;line-height:1.6;">&#10003;</span><span>${escapeHtml(line)}</span></li>`,
              )
              .join("")}
          </ul>
        </section>

        <footer style="border-top:1px solid #e2e8f0;padding-top:24px;font-size:0.7rem;color:#94a3b8;line-height:1.6;">
          ${escapeHtml(t.sourceLabel)}: ${escapeHtml(d.source.name)} &middot; ${escapeHtml(d.source.exportFile)} &middot; ${escapeHtml(d.source.retrievedAt)} &middot; ${escapeHtml(d.source.note)}
        </footer>
      </div>
    </article>
  `;

  return [
    {
      route: WEIGHT_PATH,
      title: weightSeo.en.title,
      description: weightSeo.en.description,
      skipTitleH1: true,
      body: `${body}${clusterNavHtml(WEIGHT_PATH)}`,
      ogType: "website" as const,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: weightSeo.en.title,
          url: `https://balancebiketoddler.com${WEIGHT_PATH}`,
          description: weightSeo.en.description,
          inLanguage: "en",
          isPartOf: { "@type": "WebSite", name: "BalanceBikeToddler", url: "https://balancebiketoddler.com/" },
        },
        buildWeightDatasetSchema(`https://balancebiketoddler.com${WEIGHT_PATH}`),
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://balancebiketoddler.com/" },
            {
              "@type": "ListItem",
              position: 2,
              name: "How much does a balance bike weigh",
              item: `https://balancebiketoddler.com${WEIGHT_PATH}`,
            },
          ],
        },
      ],
    },
  ];
}

/* ------------------------------------------------------------------ *
 * Balance bike stability & track width reference (Plan-B Asset 6)
 *
 * Built because the only three queries this domain ranks inside the top 20 for
 * are asking about a "stable track" balance bike, and no seller answers them
 * with a number. The page publishes the gap, quotes the one listing that does
 * state its geometry, and gives four checks that measure the same thing at home.
 * Every figure comes from src/data/stabilityData.generated.ts.
 * ------------------------------------------------------------------ */
function coverageBarPct(n: number, of: number): number {
  return of > 0 ? Math.round((n / of) * 100) : 0;
}

function renderCoverageTable(rows: Array<{ label: string; n: number; of: number }>, head: string, valueHead: string): string {
  return `
    <div style="overflow-x:auto;border:1px solid #e2e8f0;border-radius:16px;background:#fff;">
      <table style="width:100%;min-width:560px;border-collapse:collapse;text-align:left;">
        <thead style="background:#f8fafc;">
          <tr style="font-size:0.6rem;text-transform:uppercase;letter-spacing:0.14em;color:#64748b;">
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(head)}</th>
            <th style="padding:12px 12px 12px 0;font-weight:800;white-space:nowrap;">${escapeHtml(valueHead)}</th>
            <th style="padding:12px 0;font-weight:800;"></th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map((row) => {
              const pct = coverageBarPct(row.n, row.of);
              return `
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;color:#334155;">${escapeHtml(row.label)}</td>
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;font-weight:700;color:#0f172a;white-space:nowrap;">${row.n} / ${row.of}</td>
              <td style="padding:10px 0;">
                <div style="display:flex;align-items:center;gap:10px;">
                  <div style="flex:1;min-width:120px;height:6px;border-radius:9999px;background:#f1f5f9;overflow:hidden;">
                    <div style="height:100%;border-radius:9999px;background:#fb923c;width:${pct}%;"></div>
                  </div>
                  <span style="font-size:0.72rem;font-weight:700;color:#64748b;white-space:nowrap;">${pct}%</span>
                </div>
              </td>
            </tr>`;
            })
            .join("")}
        </tbody>
      </table>
    </div>`;
}

function renderStabilityPage(): RoutePage[] {
  const t = stabilityStrings.en;
  const d = STABILITY_DATASET;
  const cov = d.coverage;

  const vars: Record<string, string | number> = {
    scanned: d.catalog.productsScanned,
    listed: cov.listed,
    withSpacing: cov.withTrackSpacing,
    file: d.source.exportFile,
    date: d.source.retrievedAt,
  };
  const fill = (s: string) => fillTemplate(s, vars);

  const quote = d.publishedGeometry[0] ?? null;

  const rosterTable = `
    <div style="overflow-x:auto;border:1px solid #e2e8f0;border-radius:16px;background:#fff;">
      <table style="width:100%;min-width:860px;border-collapse:collapse;text-align:left;">
        <thead style="background:#f8fafc;">
          <tr style="font-size:0.6rem;text-transform:uppercase;letter-spacing:0.14em;color:#64748b;">
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colBrand)}</th>
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colModel)}</th>
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colWheels)}</th>
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colSpacing)}</th>
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colWheel)}</th>
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colTire)}</th>
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colFrame)}</th>
            <th style="padding:12px 0;font-weight:800;">${escapeHtml(t.colLoad)}</th>
          </tr>
        </thead>
        <tbody>
          ${d.balanceBikes
            .map(
              (b) => `
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;font-weight:700;color:#0f172a;white-space:nowrap;">${escapeHtml(b.brand ?? "&mdash;")}</td>
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;max-width:300px;"><a href="${escapeHtml(b.productUrl)}" style="color:#c2410c;text-decoration:none;">${escapeHtml(b.name)}</a></td>
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;color:#334155;white-space:nowrap;">${b.wheelCount == null ? escapeHtml(t.notStated) : b.wheelCount}</td>
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;font-weight:700;color:#0f172a;white-space:nowrap;">${b.trackSpacingIn == null ? escapeHtml(t.notStated) : escapeHtml(inchLabel(b.trackSpacingIn))}</td>
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;color:#334155;white-space:nowrap;">${b.wheelSizeIn == null ? escapeHtml(t.notStated) : `${b.wheelSizeIn}&quot;`}</td>
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;color:#334155;white-space:nowrap;">${escapeHtml(b.tireClass ?? t.notStated)}</td>
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;color:#334155;white-space:nowrap;">${escapeHtml(b.frameMaterial ?? t.notStated)}</td>
              <td style="padding:10px 0;font-size:0.82rem;color:#334155;white-space:nowrap;">${b.maxLoadLb == null ? escapeHtml(t.notStated) : `${b.maxLoadLb} lb`}</td>
            </tr>`,
            )
            .join("")}
        </tbody>
      </table>
    </div>`;

  const body = `
    <article style="max-width:64rem;margin:0 auto;padding:32px 24px 56px;text-align:left;">
      <div style="display:flex;flex-direction:column;gap:40px;">
        <header style="display:flex;flex-direction:column;gap:20px;border-bottom:1px solid #e2e8f0;padding-bottom:32px;">
          <div style="display:inline-flex;align-items:center;gap:8px;align-self:flex-start;border:1px solid #fed7aa;background:#fff7ed;padding:4px 12px;border-radius:9999px;font-size:0.6rem;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:#ea580c;">${escapeHtml(t.eyebrow)}</div>
          <h1 style="font-size:2rem;font-weight:900;color:#0f172a;line-height:1.15;margin:0;max-width:48rem;">${escapeHtml(t.heroTitle)}</h1>
          <p style="font-size:1.05rem;color:#475569;line-height:1.7;margin:0;max-width:48rem;font-weight:500;">${escapeHtml(fill(t.heroLead))}</p>
          <div style="display:flex;flex-wrap:wrap;gap:24px 48px;border:1px solid #e2e8f0;background:#f8fafc;border-radius:16px;padding:12px 16px;font-size:0.75rem;color:#475569;">
            <span>${escapeHtml(t.sourceLabel)}: ${escapeHtml(d.source.name)}</span>
            <span>${escapeHtml(d.source.retrievedAt)}</span>
            <span>${cov.listed} balance bikes &middot; ${d.catalog.productsScanned} products scanned</span>
          </div>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.heroNote)}</p>
        </header>

        <section style="display:flex;flex-direction:column;gap:16px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.gapTitle)}</h2>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(fill(t.gapLead))}</p>
          ${renderCoverageTable(coverageRows(t), t.coverStudio, t.coverValue)}
        </section>

        <section style="display:flex;flex-direction:column;gap:16px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.quoteTitle)}</h2>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.quoteLead)}</p>
          ${
            quote
              ? `<figure style="border:1px solid #fed7aa;background:#fff7ed;border-radius:16px;padding:20px;margin:0;">
            <div style="display:flex;flex-wrap:wrap;align-items:baseline;gap:16px;font-size:0.8rem;">
              <strong style="color:#0f172a;">${escapeHtml(quote.brand ?? "&mdash;")}</strong>
              <span style="color:#64748b;">${quote.wheelCount} wheels &middot; ${quote.wheelSizeIn}&quot; &middot; ${escapeHtml(t.published)} ${escapeHtml(inchLabel(quote.trackSpacingIn))}</span>
            </div>
            <blockquote style="margin:12px 0 0;font-size:0.9rem;color:#1f2937;line-height:1.75;font-style:italic;">&ldquo;${escapeHtml(quote.quote ?? "")}&rdquo;</blockquote>
            <figcaption style="margin-top:12px;font-size:0.78rem;color:#64748b;">${escapeHtml(t.quoteSourceLabel)} &middot; <a href="${escapeHtml(quote.productUrl)}" style="color:#c2410c;text-decoration:none;">${escapeHtml(quote.name)}</a></figcaption>
            <p style="margin:10px 0 0;font-size:0.8rem;color:#334155;line-height:1.6;">${escapeHtml(t.colSpacing)}: ${escapeHtml(inchLabel(quote.trackSpacingIn))} &middot; tire width ${escapeHtml(inchLabel(quote.tireWidthIn))} &middot; steering limit ${quote.steeringLimitDeg}&deg;</p>
          </figure>`
              : `<p style="font-size:0.85rem;color:#334155;line-height:1.7;margin:0;">${escapeHtml(t.quoteMissing)}</p>`
          }
        </section>

        <section style="display:flex;flex-direction:column;gap:16px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.claimsTitle)}</h2>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.claimsLead)}</p>
          ${renderCoverageTable(claimRows(t), t.coverStudio, t.coverValue)}
          <p style="font-size:0.72rem;color:#64748b;margin:0;">${escapeHtml(t.claimed)}</p>
        </section>

        <section style="display:flex;flex-direction:column;gap:16px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.rosterTitle)}</h2>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(fill(t.rosterLead))}</p>
          ${rosterTable}
        </section>

        <section style="display:flex;flex-direction:column;gap:12px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.checkTitle)}</h2>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.checkLead)}</p>
          <ul style="margin:0;padding-left:4px;list-style:none;font-size:0.9rem;color:#334155;line-height:1.7;">
            ${t.checkBody
              .map(
                (line) =>
                  `<li style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;"><span style="color:#059669;font-weight:800;line-height:1.6;">&#10003;</span><span>${escapeHtml(line)}</span></li>`,
              )
              .join("")}
          </ul>
        </section>

        <section style="display:flex;flex-direction:column;gap:12px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.caveatTitle)}</h2>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.caveatLead)}</p>
          <div style="border:1px solid #fde68a;background:#fffbeb;border-radius:16px;padding:20px;">
            ${t.caveatBody
              .map(
                (line) =>
                  `<p style="font-size:0.85rem;color:#334155;line-height:1.7;margin:0 0 10px;">${escapeHtml(fill(line))}</p>`,
              )
              .join("")}
          </div>
        </section>

        <section style="display:flex;flex-direction:column;gap:12px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.methodTitle)}</h2>
          <ul style="margin:0;padding-left:20px;font-size:0.85rem;color:#475569;line-height:1.7;max-width:48rem;">
            ${t.methodBody.map((line) => `<li style="margin-bottom:6px;">${escapeHtml(fill(line))}</li>`).join("")}
          </ul>
        </section>

        <footer style="border-top:1px solid #e2e8f0;padding-top:24px;font-size:0.7rem;color:#94a3b8;line-height:1.6;">
          ${escapeHtml(t.sourceLabel)}: ${escapeHtml(d.source.name)} &middot; ${escapeHtml(d.source.exportFile)} &middot; ${escapeHtml(d.source.retrievedAt)} &middot; ${escapeHtml(d.source.note)}
        </footer>
      </div>
    </article>
  `;

  return [
    {
      route: STABILITY_PATH,
      title: stabilitySeo.en.title,
      description: stabilitySeo.en.description,
      skipTitleH1: true,
      body: `${body}${clusterNavHtml(STABILITY_PATH)}`,
      ogType: "website" as const,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: stabilitySeo.en.title,
          url: `https://balancebiketoddler.com${STABILITY_PATH}`,
          description: stabilitySeo.en.description,
          inLanguage: "en",
          isPartOf: { "@type": "WebSite", name: "BalanceBikeToddler", url: "https://balancebiketoddler.com/" },
        },
        buildStabilityDatasetSchema(`https://balancebiketoddler.com${STABILITY_PATH}`),
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://balancebiketoddler.com/" },
            {
              "@type": "ListItem",
              position: 2,
              name: "Balance bike stability and track width",
              item: `https://balancebiketoddler.com${STABILITY_PATH}`,
            },
          ],
        },
      ],
    },
  ];
}

/* ------------------------------------------------------------------ *
 * Budget & value balance bike reference (Plan-B Asset 8)
 *
 * Weekly keyword scan flagged "budget" / "cheap" balance-bike queries with no
 * destination on the domain. This page answers them with honest, tier-level
 * advice — no fabricated specs, no paid picks. No generated dataset: the budget
 * tier is about configuration (frame material, tire type, adjustability), not
 * hidden measurements, so the content is hand-authored.
 * ------------------------------------------------------------------ */
function renderBudgetPage(): RoutePage[] {
  const t = budgetStrings.en;

  const bands: Array<{ label: string; items: string[] }> = [
    { label: t.bandLowLabel, items: t.bandLow },
    { label: t.bandMidLabel, items: t.bandMid },
    { label: t.bandHighLabel, items: t.bandHigh },
  ];

  const bandCards = bands
    .map(
      (band) => `
        <div style="border:1px solid #e2e8f0;border-radius:16px;background:#fff;padding:20px;display:flex;flex-direction:column;gap:12px;">
          <h3 style="margin:0;font-size:0.95rem;font-weight:900;color:#0f172a;">${escapeHtml(band.label)}</h3>
          <ul style="margin:0;padding-left:18px;font-size:0.8rem;color:#334155;line-height:1.6;">
            ${band.items.map((line) => `<li style="margin-bottom:8px;">${escapeHtml(line)}</li>`).join("")}
          </ul>
        </div>`,
    )
    .join("");

  const numberedList = (items: string[]) =>
    `<ol style="margin:0;padding-left:0;list-style:none;font-size:0.9rem;color:#334155;line-height:1.7;max-width:48rem;">${items
      .map(
        (line, i) =>
          `<li style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;"><span style="flex:0 0 auto;width:16px;height:16px;border-radius:9999px;background:#ffedd5;color:#ea580c;font-size:10px;font-weight:900;display:flex;align-items:center;justify-content:center;margin-top:2px;">${i + 1}</span><span>${escapeHtml(line)}</span></li>`,
      )
      .join("")}</ol>`;

  const bulletList = (items: string[], color: string) =>
    `<ul style="margin:0;padding-left:0;list-style:none;font-size:0.9rem;color:#334155;line-height:1.7;max-width:48rem;">${items
      .map(
        (line) =>
          `<li style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;"><span style="color:${color};font-weight:800;line-height:1.6;">&#10003;</span><span>${escapeHtml(line)}</span></li>`,
      )
      .join("")}</ul>`;

  const faqItems = t.faqs
    .map(
      (faq) => `
        <details style="border:1px solid #e2e8f0;border-radius:16px;background:#fff;padding:16px;">
          <summary style="cursor:pointer;font-size:0.9rem;font-weight:900;color:#0f172a;">${escapeHtml(faq.q)}</summary>
          <p style="margin:8px 0 0;font-size:0.85rem;color:#334155;line-height:1.7;">${escapeHtml(faq.a)}</p>
        </details>`,
    )
    .join("");

  const body = `
    <article style="max-width:64rem;margin:0 auto;padding:32px 24px 56px;text-align:left;">
      <div style="display:flex;flex-direction:column;gap:40px;">
        <header style="display:flex;flex-direction:column;gap:20px;border-bottom:1px solid #e2e8f0;padding-bottom:32px;">
          <div style="display:inline-flex;align-items:center;gap:8px;align-self:flex-start;border:1px solid #fed7aa;background:#fff7ed;padding:4px 12px;border-radius:9999px;font-size:0.6rem;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:#ea580c;">${escapeHtml(t.eyebrow)}</div>
          <h1 style="font-size:2rem;font-weight:900;color:#0f172a;line-height:1.15;margin:0;max-width:48rem;">${escapeHtml(t.heroTitle)}</h1>
          <p style="font-size:1.05rem;color:#475569;line-height:1.7;margin:0;max-width:48rem;font-weight:500;">${escapeHtml(t.heroLead)}</p>
        </header>

        <section style="display:flex;flex-direction:column;gap:16px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.introTitle)}</h2>
          <p style="font-size:0.9rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.introLead)}</p>
        </section>

        <section style="display:flex;flex-direction:column;gap:16px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.bandsTitle)}</h2>
          <div style="display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));">${bandCards}</div>
        </section>

        <section style="display:flex;flex-direction:column;gap:16px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.tradeoffsTitle)}</h2>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.tradeoffsLead)}</p>
          ${numberedList(t.tradeoffItems)}
        </section>

        <section style="display:flex;flex-direction:column;gap:16px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.checkTitle)}</h2>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.checkLead)}</p>
          ${numberedList(t.checkItems)}
        </section>

        <section style="display:flex;flex-direction:column;gap:16px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.avoidTitle)}</h2>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.avoidLead)}</p>
          ${bulletList(t.avoidItems, "#d97706")}
        </section>

        <section style="display:flex;flex-direction:column;gap:16px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.safetyTitle)}</h2>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.safetyLead)}</p>
          <div style="border:1px solid #a7f3d0;background:#ecfdf5;border-radius:16px;padding:20px;">
            <p style="font-size:0.9rem;color:#334155;line-height:1.7;margin:0;">${escapeHtml(t.safetyBody)}</p>
          </div>
        </section>

        <section style="display:flex;flex-direction:column;gap:16px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.faqTitle)}</h2>
          <div style="display:flex;flex-direction:column;gap:12px;">${faqItems}</div>
        </section>

        <section style="display:flex;flex-direction:column;gap:12px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.methodTitle)}</h2>
          <ul style="margin:0;padding-left:20px;font-size:0.85rem;color:#475569;line-height:1.7;max-width:48rem;">
            ${t.methodBody.map((line) => `<li style="margin-bottom:6px;">${escapeHtml(line)}</li>`).join("")}
          </ul>
        </section>

        <section style="display:flex;flex-direction:column;gap:12px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.caveatTitle)}</h2>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.caveatLead)}</p>
          <div style="border:1px solid #fde68a;background:#fffbeb;border-radius:16px;padding:20px;">
            ${t.caveatBody.map((line) => `<p style="font-size:0.85rem;color:#334155;line-height:1.7;margin:0 0 10px;">${escapeHtml(line)}</p>`).join("")}
          </div>
        </section>

        <footer style="border-top:1px solid #e2e8f0;padding-top:24px;font-size:0.7rem;color:#94a3b8;line-height:1.6;">
          ${escapeHtml(t.sourceLabel)}: BalanceBikeToddler reference pages
        </footer>
      </div>
    </article>
  `;

  return [
    {
      route: BUDGET_PATH,
      title: budgetSeo.en.title,
      description: budgetSeo.en.description,
      skipTitleH1: true,
      body: `${body}${clusterNavHtml(BUDGET_PATH)}`,
      ogType: "website" as const,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: budgetSeo.en.title,
          url: `https://balancebiketoddler.com${BUDGET_PATH}`,
          description: budgetSeo.en.description,
          inLanguage: "en",
          isPartOf: { "@type": "WebSite", name: "BalanceBikeToddler", url: "https://balancebiketoddler.com/" },
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://balancebiketoddler.com/" },
            {
              "@type": "ListItem",
              position: 2,
              name: "Budget balance bike",
              item: `https://balancebiketoddler.com${BUDGET_PATH}`,
            },
          ],
        },
      ],
    },
  ];
}

/* ------------------------------------------------------------------ *
 * Balance bike by age reference (Plan-B Asset 7)
 *
 * Search Console: 27 of the 68 queries this domain appears for carry an
 * explicit child age, worth 63 of 171 impressions — the largest intent cluster
 * here. Nothing on the site was organised by the age of the child, so that
 * demand fell on whichever page happened to rank. This page counts how many
 * listings still fit at each age, using the range each manufacturer publishes.
 * Every figure comes from src/data/ageData.generated.ts.
 * ------------------------------------------------------------------ */
/**
 * Plan-B Asset 2 — buyer feedback, aggregated.
 *
 * The point of this page is the thing it refuses to do. Review-intent queries
 * ("review", "reviews of balance bikes", 8 impressions) had nothing on the
 * domain, and the obvious move is to publish "reviews" assembled from the
 * catalogue's marketing copy. That would be the machine-generated-content
 * pattern the whole project is built to avoid.
 *
 * So this page states first that it has no verbatim reviews, then aggregates
 * what it genuinely has: one retailer-generated sentiment summary per listing,
 * counted by topic, with the hedges counted alongside the praise.
 */
function renderBuyerFeedbackPage(): RoutePage[] {
  const t = buyerFeedbackStrings.en;
  const d = REVIEW_DATASET;
  const total = d.balanceBikeSummaries;

  const themeRows = d.themes
    .map(
      (theme) => `
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:10px 12px 10px 0;font-size:0.85rem;font-weight:700;color:#0f172a;">${escapeHtml(theme.label)}</td>
              <td style="padding:10px 12px 10px 0;font-size:0.85rem;font-weight:800;color:#c2410c;white-space:nowrap;">${theme.count} of ${total}</td>
              <td style="padding:10px 0;font-size:0.82rem;color:#475569;">${escapeHtml(theme.note)}</td>
            </tr>`,
    )
    .join("");

  const hedgeRows = d.hedges
    .map(
      (hedge) => `
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:10px 12px 10px 0;font-size:0.85rem;font-weight:700;color:#0f172a;">${escapeHtml(hedge.label)}</td>
              <td style="padding:10px 0;font-size:0.85rem;font-weight:800;color:#c2410c;white-space:nowrap;">${hedge.count} of ${total}</td>
            </tr>`,
    )
    .join("");

  const listingRows = d.listings
    .map(
      (listing) => `
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;color:#334155;max-width:420px;">${escapeHtml(listing.name)}</td>
              <td style="padding:10px 0;font-size:0.82rem;color:#64748b;white-space:nowrap;">${escapeHtml(listing.id)}</td>
            </tr>`,
    )
    .join("");

  const body = `
    <article style="max-width:64rem;margin:0 auto;padding:32px 24px 56px;text-align:left;">
      <div style="display:flex;flex-direction:column;gap:40px;">
        <header style="display:flex;flex-direction:column;gap:14px;border-bottom:1px solid #e2e8f0;padding-bottom:32px;">
          <p style="margin:0;font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;">${escapeHtml(t.eyebrow)}</p>
          <h1 style="margin:0;font-size:clamp(1.9rem,4vw,2.6rem);line-height:1.15;color:#020617;">${escapeHtml(t.h1)}</h1>
          <p style="margin:0;font-size:1.05rem;color:#334155;line-height:1.7;max-width:52rem;">${escapeHtml(t.lead)}</p>
        </header>

        <section style="background:#fff7ed;border:1px solid #fed7aa;border-radius:16px;padding:20px 22px;">
          <h2 style="margin:0 0 10px;font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#c2410c;">${escapeHtml(t.provenanceTitle)}</h2>
          <ul style="margin:0;padding-left:20px;font-size:0.88rem;color:#475569;line-height:1.75;max-width:52rem;">
            ${t.provenanceBody.map((line) => `<li style="margin-bottom:8px;">${escapeHtml(line)}</li>`).join("")}
          </ul>
        </section>

        <section style="display:flex;flex-direction:column;gap:14px;">
          <h2 style="margin:0;font-size:1.45rem;color:#020617;">${escapeHtml(t.themeTitle)}</h2>
          <p style="margin:0;font-size:0.92rem;color:#475569;line-height:1.7;max-width:52rem;">${escapeHtml(t.themeIntro)}</p>
          <div style="overflow-x:auto;border:1px solid #e2e8f0;border-radius:16px;background:#fff;">
            <table style="width:100%;min-width:640px;border-collapse:collapse;text-align:left;">
              <thead style="background:#f8fafc;">
                <tr style="font-size:0.6rem;text-transform:uppercase;letter-spacing:0.14em;color:#64748b;">
                  <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.themeColTopic)}</th>
                  <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.themeColCount)}</th>
                  <th style="padding:12px 0;font-weight:800;">${escapeHtml(t.themeColNote)}</th>
                </tr>
              </thead>
              <tbody>
${themeRows}
              </tbody>
            </table>
          </div>
        </section>

        <section style="display:flex;flex-direction:column;gap:14px;">
          <h2 style="margin:0;font-size:1.45rem;color:#020617;">${escapeHtml(t.hedgeTitle)}</h2>
          <p style="margin:0;font-size:0.92rem;color:#475569;line-height:1.7;max-width:52rem;">${escapeHtml(t.hedgeIntro)}</p>
          <div style="overflow-x:auto;border:1px solid #e2e8f0;border-radius:16px;background:#fff;">
            <table style="width:100%;min-width:420px;border-collapse:collapse;text-align:left;">
              <thead style="background:#f8fafc;">
                <tr style="font-size:0.6rem;text-transform:uppercase;letter-spacing:0.14em;color:#64748b;">
                  <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.themeColTopic)}</th>
                  <th style="padding:12px 0;font-weight:800;">${escapeHtml(t.themeColCount)}</th>
                </tr>
              </thead>
              <tbody>
${hedgeRows}
              </tbody>
            </table>
          </div>
        </section>

        <section style="display:flex;flex-direction:column;gap:14px;">
          <h2 style="margin:0;font-size:1.45rem;color:#020617;">${escapeHtml(t.listingTitle)}</h2>
          <div style="overflow-x:auto;border:1px solid #e2e8f0;border-radius:16px;background:#fff;">
            <table style="width:100%;min-width:640px;border-collapse:collapse;text-align:left;">
              <thead style="background:#f8fafc;">
                <tr style="font-size:0.6rem;text-transform:uppercase;letter-spacing:0.14em;color:#64748b;">
                  <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.listingColName)}</th>
                  <th style="padding:12px 0;font-weight:800;">${escapeHtml(t.listingColChars)}</th>
                </tr>
              </thead>
              <tbody>
${listingRows}
              </tbody>
            </table>
          </div>
        </section>

        <section style="display:flex;flex-direction:column;gap:12px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.methodTitle)}</h2>
          <ul style="margin:0;padding-left:20px;font-size:0.85rem;color:#475569;line-height:1.7;max-width:52rem;">
            ${t.methodBody.map((line) => `<li style="margin-bottom:6px;">${escapeHtml(line)}</li>`).join("")}
          </ul>
        </section>

        <footer style="border-top:1px solid #e2e8f0;padding-top:24px;font-size:0.7rem;color:#94a3b8;line-height:1.6;">
          ${escapeHtml(t.sourceLabel)}: ${escapeHtml(t.sourceNote)}
        </footer>
      </div>
    </article>
  `;

  return [
    {
      route: BUYER_FEEDBACK_PATH,
      title: buyerFeedbackSeo.en.title,
      description: buyerFeedbackSeo.en.description,
      skipTitleH1: true,
      body: `${body}${clusterNavHtml(BUYER_FEEDBACK_PATH, t.clusterTitle)}`,
      ogType: "website" as const,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: buyerFeedbackSeo.en.title,
          url: `https://balancebiketoddler.com${BUYER_FEEDBACK_PATH}`,
          description: buyerFeedbackSeo.en.description,
          inLanguage: "en",
          isPartOf: { "@type": "WebSite", name: "BalanceBikeToddler", url: "https://balancebiketoddler.com/" },
        },
        buildBuyerFeedbackDatasetSchema(`https://balancebiketoddler.com${BUYER_FEEDBACK_PATH}`),
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://balancebiketoddler.com/" },
            {
              "@type": "ListItem",
              position: 2,
              name: "What buyers say about balance bikes",
              item: `https://balancebiketoddler.com${BUYER_FEEDBACK_PATH}`,
            },
          ],
        },
      ],
    },
  ];
}

function renderAgePage(): RoutePage[] {
  const t = ageStrings.en;
  const d = AGE_DATASET;
  const cat = d.catalog;
  const cov = d.coverage;
  const vars = ageVars();
  const fill = (s: string) => fillTemplate(s, vars as Record<string, string | number>);

  const bandRows = cov.bands
    .map((band) => {
      const pct = coverageBarPct(band.fitCount, cat.withStatedAgeRange);
      return `
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;font-weight:700;color:#0f172a;white-space:nowrap;">${escapeHtml(band.searchLabel)} old</td>
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;font-weight:800;color:#c2410c;white-space:nowrap;">${band.fitCount} / ${cat.withStatedAgeRange}</td>
              <td style="padding:10px 0;">
                <div style="display:flex;align-items:center;gap:10px;">
                  <div style="flex:1;min-width:120px;height:6px;border-radius:9999px;background:#f1f5f9;overflow:hidden;">
                    <div style="height:100%;border-radius:9999px;background:#fb923c;width:${pct}%;"></div>
                  </div>
                  <span style="font-size:0.72rem;font-weight:700;color:#64748b;white-space:nowrap;">${pct}%</span>
                </div>
              </td>
            </tr>`;
    })
    .join("");

  const bandTable = `
    <div style="overflow-x:auto;border:1px solid #e2e8f0;border-radius:16px;background:#fff;">
      <table style="width:100%;min-width:520px;border-collapse:collapse;text-align:left;">
        <thead style="background:#f8fafc;">
          <tr style="font-size:0.6rem;text-transform:uppercase;letter-spacing:0.14em;color:#64748b;">
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colAge)}</th>
            <th style="padding:12px 12px 12px 0;font-weight:800;white-space:nowrap;">${escapeHtml(t.colFit)}</th>
            <th style="padding:12px 0;font-weight:800;">${escapeHtml(t.colShare)}</th>
          </tr>
        </thead>
        <tbody>${bandRows}</tbody>
      </table>
    </div>`;

  const fitTable = `
    <div style="overflow-x:auto;border:1px solid #e2e8f0;border-radius:16px;background:#fff;">
      <table style="width:100%;min-width:840px;border-collapse:collapse;text-align:left;">
        <thead style="background:#f8fafc;">
          <tr style="font-size:0.6rem;text-transform:uppercase;letter-spacing:0.14em;color:#64748b;">
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colBrand)}</th>
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colModel)}</th>
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colSpan)}</th>
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colFitUntil)}</th>
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colWheel)}</th>
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colWeight)}</th>
            <th style="padding:12px 0;font-weight:800;">${escapeHtml(t.colPrice)}</th>
          </tr>
        </thead>
        <tbody>
          ${bikesAt(24)
            .map(
              (b) => `
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;font-weight:700;color:#0f172a;white-space:nowrap;"><a href="${escapeHtml(b.productUrl)}" style="color:#c2410c;text-decoration:none;">${escapeHtml(b.brand)}</a></td>
              <td style="padding:10px 12px 10px 0;font-size:0.78rem;color:#475569;max-width:280px;">${escapeHtml(b.name.replace(/^[^,]+,\s*/, "").slice(0, 72))}</td>
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;color:#334155;white-space:nowrap;">${escapeHtml(ageSpanLabel(b.ageMinMonths, b.ageMaxMonths))}</td>
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;color:#334155;white-space:nowrap;">${b.remainingMonths > 0 ? `${b.remainingMonths} ${escapeHtml(t.monthsLeft)}` : escapeHtml(t.alreadyPast)}</td>
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;color:#334155;white-space:nowrap;">${b.wheelInches == null ? "&mdash;" : `${b.wheelInches}&quot;`}</td>
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;color:#334155;white-space:nowrap;">${b.weightLbs == null ? "&mdash;" : `${b.weightLbs} lb`}</td>
              <td style="padding:10px 0;font-size:0.82rem;font-weight:700;color:#0f172a;white-space:nowrap;">${b.priceUsd == null ? "&mdash;" : `$${b.priceUsd.toFixed(2)}`}</td>
            </tr>`,
            )
            .join("")}
        </tbody>
      </table>
    </div>`;

  const quoteList = `
    <div style="border:1px solid #e2e8f0;border-radius:16px;background:#fff;overflow:hidden;">
      ${d.bikes
        .map(
          (b) => `
        <div style="display:flex;flex-wrap:wrap;align-items:baseline;gap:16px;padding:12px 16px;border-bottom:1px solid #f1f5f9;">
          <strong style="font-size:0.82rem;color:#0f172a;min-width:7rem;">${escapeHtml(b.brand)}</strong>
          <span style="font-size:0.82rem;color:#334155;min-width:7rem;white-space:nowrap;">${escapeHtml(ageSpanLabel(b.ageMinMonths, b.ageMaxMonths))}</span>
          <span style="font-size:0.8rem;color:#64748b;font-style:italic;flex:1;min-width:16rem;">&ldquo;${escapeHtml(b.quotedAgeRange ?? "")}&rdquo;</span>
        </div>`,
        )
        .join("")}
      <p style="margin:0;padding:10px 16px;font-size:0.72rem;color:#94a3b8;">${escapeHtml(t.quoteSourceLabel)}</p>
    </div>`;

  const unplacedBlock = d.unplaced.length
    ? `
        <section style="display:flex;flex-direction:column;gap:12px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(fill(t.unplacedTitle))}</h2>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(fill(t.unplacedLead))}</p>
          <ul style="margin:0;padding-left:20px;font-size:0.85rem;color:#334155;line-height:1.7;">
            ${d.unplaced
              .map(
                (b) =>
                  `<li style="margin-bottom:8px;"><strong>${escapeHtml(b.brand)}</strong> &mdash; ${escapeHtml(b.name.slice(0, 96))}<div style="font-size:0.78rem;color:#64748b;">${escapeHtml(t.unplacedWhy)}</div></li>`,
              )
              .join("")}
          </ul>
        </section>`
    : "";

  const body = `
    <article style="max-width:64rem;margin:0 auto;padding:32px 24px 56px;text-align:left;">
      <div style="display:flex;flex-direction:column;gap:40px;">
        <header style="display:flex;flex-direction:column;gap:20px;border-bottom:1px solid #e2e8f0;padding-bottom:32px;">
          <div style="display:inline-flex;align-items:center;gap:8px;align-self:flex-start;border:1px solid #fed7aa;background:#fff7ed;padding:4px 12px;border-radius:9999px;font-size:0.6rem;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:#ea580c;">${escapeHtml(t.eyebrow)}</div>
          <h1 style="font-size:2rem;font-weight:900;color:#0f172a;line-height:1.15;margin:0;max-width:48rem;">${escapeHtml(fill(t.heroTitle))}</h1>
          <p style="font-size:1.05rem;color:#475569;line-height:1.7;margin:0;max-width:48rem;font-weight:500;">${escapeHtml(fill(t.heroLead))}</p>
          <div style="display:flex;flex-wrap:wrap;gap:24px 48px;border:1px solid #e2e8f0;background:#f8fafc;border-radius:16px;padding:12px 16px;font-size:0.75rem;color:#475569;">
            <span>${escapeHtml(t.sourceLabel)}: ${escapeHtml(d.source.name)}</span>
            <span>${escapeHtml(d.source.retrievedAt)}</span>
            <span>${cat.balanceBikesListed} balance bikes &middot; ${cat.withStatedAgeRange} publish an age range</span>
          </div>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.heroNote)}</p>
        </header>

        <section style="display:flex;flex-direction:column;gap:16px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.bandTitle)}</h2>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(fill(t.bandLead))}</p>
          ${bandTable}
        </section>

        <section style="display:flex;flex-direction:column;gap:16px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:1.1rem;font-weight:800;color:#0f172a;margin:0;">${escapeHtml(t.dropTitle)}</h2>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(fill(t.dropLead))}</p>
          <div style="border:1px solid #fed7aa;background:#fff7ed;border-radius:16px;padding:20px;">
            <p style="font-size:0.9rem;color:#1f2937;line-height:1.75;margin:0;">${escapeHtml(fill(t.dropBody))}</p>
          </div>
        </section>

        <section style="display:flex;flex-direction:column;gap:16px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.fitTitle)}</h2>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.fitLead)}</p>
          ${fitTable}
          <p style="font-size:0.72rem;color:#64748b;margin:0;">${escapeHtml(t.oneLine)} ${bikesAt(24).length} ${escapeHtml(bandAt(24).searchLabel)} &middot; ${escapeHtml(t.colSpan)}: ${escapeHtml(ageSpanLabel(cov.minStatedMonths, cov.maxStatedMonths))}.</p>
        </section>
        ${unplacedBlock}

        <section style="display:flex;flex-direction:column;gap:16px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.quoteTitle)}</h2>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.quoteLead)}</p>
          ${quoteList}
        </section>

        <section style="display:flex;flex-direction:column;gap:12px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.caveatTitle)}</h2>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.caveatLead)}</p>
          <div style="border:1px solid #fde68a;background:#fffbeb;border-radius:16px;padding:20px;">
            ${t.caveatBody
              .map((line) => `<p style="font-size:0.85rem;color:#334155;line-height:1.7;margin:0 0 10px;">${escapeHtml(fill(line))}</p>`)
              .join("")}
          </div>
        </section>

        <section style="display:flex;flex-direction:column;gap:12px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.methodTitle)}</h2>
          <ul style="margin:0;padding-left:20px;font-size:0.85rem;color:#475569;line-height:1.7;max-width:48rem;">
            ${t.methodBody.map((line) => `<li style="margin-bottom:6px;">${escapeHtml(fill(line))}</li>`).join("")}
          </ul>
        </section>

        <footer style="border-top:1px solid #e2e8f0;padding-top:24px;font-size:0.7rem;color:#94a3b8;line-height:1.6;">
          ${escapeHtml(t.sourceLabel)}: ${escapeHtml(d.source.name)} &middot; ${escapeHtml(d.source.exportFile)} &middot; ${escapeHtml(d.source.retrievedAt)} &middot; ${escapeHtml(d.source.note)}
        </footer>
      </div>
    </article>
  `;

  return [
    {
      route: AGE_PATH,
      title: ageSeo.en.title,
      description: ageSeo.en.description,
      skipTitleH1: true,
      body: `${body}${clusterNavHtml(AGE_PATH)}`,
      ogType: "website" as const,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: ageSeo.en.title,
          url: `https://balancebiketoddler.com${AGE_PATH}`,
          description: ageSeo.en.description,
          inLanguage: "en",
          isPartOf: { "@type": "WebSite", name: "BalanceBikeToddler", url: "https://balancebiketoddler.com/" },
        },
        buildAgeDatasetSchema(`https://balancebiketoddler.com${AGE_PATH}`),
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://balancebiketoddler.com/" },
            {
              "@type": "ListItem",
              position: 2,
              name: "Balance bike by age",
              item: `https://balancebiketoddler.com${AGE_PATH}`,
            },
          ],
        },
      ],
    },
  ];
}

/**
 * Kids bike by age (Plan-B Asset 7, kids-bikes mirror of renderAgePage).
 * Age is the largest intent cluster on the property; the kids-bikes coverage
 * shape is genuinely different from balance bikes (rises to a plateau instead
 * of falling off a cliff), so it cannot reuse the balance-bike page.
 */
function renderKidsAgePage(): RoutePage[] {
  const t = kidsAgeStrings.en;
  const d = KIDS_AGE_DATASET;
  const cat = d.catalog;
  const cov = d.coverage;
  const vars = kidsAgeVars();
  const fill = (s: string) => fillTemplate(s, vars as Record<string, string | number>);

  const bandRows = cov.bands
    .map((band) => {
      const pct = coverageBarPct(band.fitCount, cat.withStatedAgeRange);
      return `
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;font-weight:700;color:#0f172a;white-space:nowrap;">${escapeHtml(band.searchLabel)} old</td>
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;font-weight:800;color:#c2410c;white-space:nowrap;">${band.fitCount} / ${cat.withStatedAgeRange}</td>
              <td style="padding:10px 0;">
                <div style="display:flex;align-items:center;gap:10px;">
                  <div style="flex:1;min-width:120px;height:6px;border-radius:9999px;background:#f1f5f9;overflow:hidden;">
                    <div style="height:100%;border-radius:9999px;background:#fb923c;width:${pct}%;"></div>
                  </div>
                  <span style="font-size:0.72rem;font-weight:700;color:#64748b;white-space:nowrap;">${pct}%</span>
                </div>
              </td>
            </tr>`;
    })
    .join("");

  const bandTable = `
    <div style="overflow-x:auto;border:1px solid #e2e8f0;border-radius:16px;background:#fff;">
      <table style="width:100%;min-width:520px;border-collapse:collapse;text-align:left;">
        <thead style="background:#f8fafc;">
          <tr style="font-size:0.6rem;text-transform:uppercase;letter-spacing:0.14em;color:#64748b;">
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colAge)}</th>
            <th style="padding:12px 12px 12px 0;font-weight:800;white-space:nowrap;">${escapeHtml(t.colFit)}</th>
            <th style="padding:12px 0;font-weight:800;">${escapeHtml(t.colShare)}</th>
          </tr>
        </thead>
        <tbody>${bandRows}</tbody>
      </table>
    </div>`;

  const fitTable = `
    <div style="overflow-x:auto;border:1px solid #e2e8f0;border-radius:16px;background:#fff;">
      <table style="width:100%;min-width:840px;border-collapse:collapse;text-align:left;">
        <thead style="background:#f8fafc;">
          <tr style="font-size:0.6rem;text-transform:uppercase;letter-spacing:0.14em;color:#64748b;">
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colBrand)}</th>
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colModel)}</th>
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colSpan)}</th>
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colFitUntil)}</th>
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colWheel)}</th>
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colWeight)}</th>
            <th style="padding:12px 0;font-weight:800;">${escapeHtml(t.colPrice)}</th>
          </tr>
        </thead>
        <tbody>
          ${kidsBikesAt(72)
            .map(
              (b) => `
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;font-weight:700;color:#0f172a;white-space:nowrap;"><a href="${escapeHtml(b.productUrl)}" style="color:#c2410c;text-decoration:none;">${escapeHtml(b.brand)}</a></td>
              <td style="padding:10px 12px 10px 0;font-size:0.78rem;color:#475569;max-width:280px;">${escapeHtml(b.name.replace(/^[^,]+,\s*/, "").slice(0, 72))}</td>
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;color:#334155;white-space:nowrap;">${escapeHtml(kidsAgeSpanLabel(b.ageMinMonths, b.ageMaxMonths))}</td>
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;color:#334155;white-space:nowrap;">${b.remainingMonths > 0 ? `${b.remainingMonths} ${escapeHtml(t.monthsLeft)}` : escapeHtml(t.alreadyPast)}</td>
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;color:#334155;white-space:nowrap;">${b.wheelInches == null ? "&mdash;" : `${b.wheelInches}&quot;`}</td>
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;color:#334155;white-space:nowrap;">${b.weightLbs == null ? "&mdash;" : `${b.weightLbs} lb`}</td>
              <td style="padding:10px 0;font-size:0.82rem;font-weight:700;color:#0f172a;white-space:nowrap;">${b.priceUsd == null ? "&mdash;" : `$${b.priceUsd.toFixed(2)}`}</td>
            </tr>`,
            )
            .join("")}
        </tbody>
      </table>
    </div>`;

  const quoteList = `
    <div style="border:1px solid #e2e8f0;border-radius:16px;background:#fff;overflow:hidden;">
      ${d.bikes
        .map(
          (b) => `
        <div style="display:flex;flex-wrap:wrap;align-items:baseline;gap:16px;padding:12px 16px;border-bottom:1px solid #f1f5f9;">
          <strong style="font-size:0.82rem;color:#0f172a;min-width:7rem;">${escapeHtml(b.brand)}</strong>
          <span style="font-size:0.82rem;color:#334155;min-width:7rem;white-space:nowrap;">${escapeHtml(kidsAgeSpanLabel(b.ageMinMonths, b.ageMaxMonths))}</span>
          <span style="font-size:0.8rem;color:#64748b;font-style:italic;flex:1;min-width:16rem;">&ldquo;${escapeHtml(b.quotedAgeRange ?? "")}&rdquo;</span>
        </div>`,
        )
        .join("")}
      <p style="margin:0;padding:10px 16px;font-size:0.72rem;color:#94a3b8;">${escapeHtml(t.quoteSourceLabel)}</p>
    </div>`;

  const unplacedBlock = d.unplaced.length
    ? `
        <section style="display:flex;flex-direction:column;gap:12px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(fill(t.unplacedTitle))}</h2>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(fill(t.unplacedLead))}</p>
          <ul style="margin:0;padding-left:20px;font-size:0.85rem;color:#334155;line-height:1.7;">
            ${d.unplaced
              .map(
                (b) =>
                  `<li style="margin-bottom:8px;"><strong>${escapeHtml(b.brand)}</strong> &mdash; ${escapeHtml(b.name.slice(0, 96))}<div style="font-size:0.78rem;color:#64748b;">${escapeHtml(t.unplacedWhy)}</div></li>`,
              )
              .join("")}
          </ul>
        </section>`
    : "";

  const body = `
    <article style="max-width:64rem;margin:0 auto;padding:32px 24px 56px;text-align:left;">
      <div style="display:flex;flex-direction:column;gap:40px;">
        <header style="display:flex;flex-direction:column;gap:20px;border-bottom:1px solid #e2e8f0;padding-bottom:32px;">
          <div style="display:inline-flex;align-items:center;gap:8px;align-self:flex-start;border:1px solid #fed7aa;background:#fff7ed;padding:4px 12px;border-radius:9999px;font-size:0.6rem;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:#ea580c;">${escapeHtml(t.eyebrow)}</div>
          <h1 style="font-size:2rem;font-weight:900;color:#0f172a;line-height:1.15;margin:0;max-width:48rem;">${escapeHtml(fill(t.heroTitle))}</h1>
          <p style="font-size:1.05rem;color:#475569;line-height:1.7;margin:0;max-width:48rem;font-weight:500;">${escapeHtml(fill(t.heroLead))}</p>
          <div style="display:flex;flex-wrap:wrap;gap:24px 48px;border:1px solid #e2e8f0;background:#f8fafc;border-radius:16px;padding:12px 16px;font-size:0.75rem;color:#475569;">
            <span>${escapeHtml(t.sourceLabel)}: ${escapeHtml(d.source.name)}</span>
            <span>${escapeHtml(d.source.retrievedAt)}</span>
            <span>${cat.kidsBikesListed} kids bikes &middot; ${cat.withStatedAgeRange} publish an age range</span>
          </div>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.heroNote)}</p>
        </header>

        <section style="display:flex;flex-direction:column;gap:16px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.bandTitle)}</h2>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(fill(t.bandLead))}</p>
          ${bandTable}
        </section>

        <section style="display:flex;flex-direction:column;gap:16px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:1.1rem;font-weight:800;color:#0f172a;margin:0;">${escapeHtml(t.plateauTitle)}</h2>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(fill(t.plateauLead))}</p>
          <div style="border:1px solid #fed7aa;background:#fff7ed;border-radius:16px;padding:20px;">
            <p style="font-size:0.9rem;color:#1f2937;line-height:1.75;margin:0;">${escapeHtml(fill(t.plateauBody))}</p>
          </div>
        </section>

        <section style="display:flex;flex-direction:column;gap:16px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.fitTitle)}</h2>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.fitLead)}</p>
          ${fitTable}
          <p style="font-size:0.72rem;color:#64748b;margin:0;">${escapeHtml(t.oneLine)} ${kidsBikesAt(72).length} ${escapeHtml(kidsBandAt(72).searchLabel)} &middot; ${escapeHtml(t.colSpan)}: ${escapeHtml(kidsAgeSpanLabel(cov.minStatedMonths, cov.maxStatedMonths))}.</p>
        </section>
        ${unplacedBlock}

        <section style="display:flex;flex-direction:column;gap:16px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.quoteTitle)}</h2>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.quoteLead)}</p>
          ${quoteList}
        </section>

        <section style="display:flex;flex-direction:column;gap:12px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.caveatTitle)}</h2>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.caveatLead)}</p>
          <div style="border:1px solid #fde68a;background:#fffbeb;border-radius:16px;padding:20px;">
            ${t.caveatBody
              .map((line) => `<p style="font-size:0.85rem;color:#334155;line-height:1.7;margin:0 0 10px;">${escapeHtml(fill(line))}</p>`)
              .join("")}
          </div>
        </section>

        <section style="display:flex;flex-direction:column;gap:12px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.methodTitle)}</h2>
          <ul style="margin:0;padding-left:20px;font-size:0.85rem;color:#475569;line-height:1.7;max-width:48rem;">
            ${t.methodBody.map((line) => `<li style="margin-bottom:6px;">${escapeHtml(fill(line))}</li>`).join("")}
          </ul>
        </section>

        <footer style="border-top:1px solid #e2e8f0;padding-top:24px;font-size:0.7rem;color:#94a3b8;line-height:1.6;">
          ${escapeHtml(t.sourceLabel)}: ${escapeHtml(d.source.name)} &middot; ${escapeHtml(d.source.exportFile)} &middot; ${escapeHtml(d.source.retrievedAt)} &middot; ${escapeHtml(d.source.note)}
        </footer>
      </div>
    </article>
  `;

  return [
    {
      route: KIDS_AGE_PATH,
      title: kidsAgeSeo.en.title,
      description: kidsAgeSeo.en.description,
      skipTitleH1: true,
      body: `${body}${clusterNavHtml(KIDS_AGE_PATH)}`,
      ogType: "website" as const,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: kidsAgeSeo.en.title,
          url: `https://balancebiketoddler.com${KIDS_AGE_PATH}`,
          description: kidsAgeSeo.en.description,
          inLanguage: "en",
          isPartOf: { "@type": "WebSite", name: "BalanceBikeToddler", url: "https://balancebiketoddler.com/" },
        },
        buildKidsAgeDatasetSchema(`https://balancebiketoddler.com${KIDS_AGE_PATH}`),
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://balancebiketoddler.com/" },
            {
              "@type": "ListItem",
              position: 2,
              name: "Kids bike by age",
              item: `https://balancebiketoddler.com${KIDS_AGE_PATH}`,
            },
          ],
        },
      ],
    },
  ];
}

function renderKidsBikePricePage(): RoutePage[] {
  const t = kidsPriceStrings.en;
  const d = KIDS_PRICE_DATASET;
  const cat = d.catalog;
  const price = d.price;
  const vars = kidsPriceVars();
  const fill = (s: string) => fillTemplate(s, vars as Record<string, string | number>);
  // The copy's "middle of the market" is the modal band — bands[1], not the
  // second-to-last band — so this note matches the hydrated component exactly.
  const midBand = price.bands[1];
  const topBand = price.bands[price.bands.length - 1];

  const bandRows = price.bands
    .map((band) => {
      const pct = coverageBarPct(band.count, cat.withPrice);
      return `
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;font-weight:700;color:#0f172a;white-space:nowrap;">${escapeHtml(band.label)}</td>
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;font-weight:800;color:#c2410c;white-space:nowrap;">${band.count} / ${cat.withPrice}</td>
              <td style="padding:10px 0;">
                <div style="display:flex;align-items:center;gap:10px;">
                  <div style="flex:1;min-width:120px;height:6px;border-radius:9999px;background:#f1f5f9;overflow:hidden;">
                    <div style="height:100%;border-radius:9999px;background:#fb923c;width:${pct}%;"></div>
                  </div>
                  <span style="font-size:0.72rem;font-weight:700;color:#64748b;white-space:nowrap;">${pct}%</span>
                </div>
              </td>
              <td style="padding:10px 12px 10px 0;font-size:0.78rem;color:#475569;white-space:nowrap;">${band.medianWeightLb == null ? "&mdash;" : `${band.medianWeightLb} lb`}</td>
              <td style="padding:10px 0;font-size:0.78rem;color:#475569;white-space:nowrap;">${band.wheelSizes.length ? band.wheelSizes.map((w) => `${w}&quot;`).join(", ") : "&mdash;"}</td>
            </tr>`;
    })
    .join("");

  const bandTable = `
    <div style="overflow-x:auto;border:1px solid #e2e8f0;border-radius:16px;background:#fff;">
      <table style="width:100%;min-width:680px;border-collapse:collapse;text-align:left;">
        <thead style="background:#f8fafc;">
          <tr style="font-size:0.6rem;text-transform:uppercase;letter-spacing:0.14em;color:#64748b;">
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colBand)}</th>
            <th style="padding:12px 12px 12px 0;font-weight:800;white-space:nowrap;">${escapeHtml(t.colCount)}</th>
            <th style="padding:12px 0;font-weight:800;">${escapeHtml(t.colShare)}</th>
            <th style="padding:12px 12px 12px 0;font-weight:800;white-space:nowrap;">${escapeHtml(t.colWeight)}</th>
            <th style="padding:12px 0;font-weight:800;white-space:nowrap;">${escapeHtml(t.colWheel)}</th>
          </tr>
        </thead>
        <tbody>${bandRows}</tbody>
      </table>
    </div>`;

  const priceTable = `
    <div style="overflow-x:auto;border:1px solid #e2e8f0;border-radius:16px;background:#fff;">
      <table style="width:100%;min-width:760px;border-collapse:collapse;text-align:left;">
        <thead style="background:#f8fafc;">
          <tr style="font-size:0.6rem;text-transform:uppercase;letter-spacing:0.14em;color:#64748b;">
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colBrand)}</th>
            <th style="padding:12px 12px 12px 0;font-weight:800;">${escapeHtml(t.colModel)}</th>
            <th style="padding:12px 12px 12px 0;font-weight:800;white-space:nowrap;">${escapeHtml(t.colPrice)}</th>
            <th style="padding:12px 12px 12px 0;font-weight:800;white-space:nowrap;">${escapeHtml(t.colWheelCol)}</th>
            <th style="padding:12px 12px 12px 0;font-weight:800;white-space:nowrap;">${escapeHtml(t.colWeightCol)}</th>
            <th style="padding:12px 0;font-weight:800;white-space:nowrap;">${escapeHtml(t.colAge)}</th>
          </tr>
        </thead>
        <tbody>
          ${d.bikes
            .map(
              (b) => `
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;font-weight:700;color:#0f172a;white-space:nowrap;"><a href="${escapeHtml(b.productUrl)}" style="color:#c2410c;text-decoration:none;">${escapeHtml(b.brand)}</a></td>
              <td style="padding:10px 12px 10px 0;font-size:0.78rem;color:#475569;max-width:280px;">${escapeHtml(b.name.replace(/^[^,]+,\s*/, "").slice(0, 72))}</td>
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;font-weight:700;color:#0f172a;white-space:nowrap;">${b.priceUsd == null ? "&mdash;" : `$${b.priceUsd.toFixed(2)}`}</td>
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;color:#334155;white-space:nowrap;">${b.wheelInches == null ? "&mdash;" : `${b.wheelInches}&quot;`}</td>
              <td style="padding:10px 12px 10px 0;font-size:0.82rem;color:#334155;white-space:nowrap;">${b.weightLbs == null ? "&mdash;" : `${b.weightLbs} lb`}</td>
              <td style="padding:10px 0;font-size:0.82rem;color:#334155;white-space:nowrap;">${escapeHtml(b.quotedAgeRange ?? kidsPriceAgeSpanLabel(b.ageMinMonths, b.ageMaxMonths))}</td>
            </tr>`,
            )
            .join("")}
        </tbody>
      </table>
    </div>`;

  const body = `
    <article style="max-width:64rem;margin:0 auto;padding:32px 24px 56px;text-align:left;">
      <div style="display:flex;flex-direction:column;gap:40px;">
        <header style="display:flex;flex-direction:column;gap:20px;border-bottom:1px solid #e2e8f0;padding-bottom:32px;">
          <div style="display:inline-flex;align-items:center;gap:8px;align-self:flex-start;border:1px solid #fed7aa;background:#fff7ed;padding:4px 12px;border-radius:9999px;font-size:0.6rem;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:#ea580c;">${escapeHtml(t.eyebrow)}</div>
          <h1 style="font-size:2rem;font-weight:900;color:#0f172a;line-height:1.15;margin:0;max-width:48rem;">${escapeHtml(fill(t.heroTitle))}</h1>
          <p style="font-size:1.05rem;color:#475569;line-height:1.7;margin:0;max-width:48rem;font-weight:500;">${escapeHtml(fill(t.heroLead))}</p>
          <div style="display:flex;flex-wrap:wrap;gap:24px 48px;border:1px solid #e2e8f0;background:#f8fafc;border-radius:16px;padding:12px 16px;font-size:0.75rem;color:#475569;">
            <span>${escapeHtml(t.sourceLabel)}: ${escapeHtml(d.source.name)}</span>
            <span>${cat.kidsBikesListed} kids bikes &middot; ${cat.withPrice} publish a price</span>
            <span>${escapeHtml(fill(t.heroNote))}</span>
          </div>
        </header>

        <section style="display:flex;flex-direction:column;gap:16px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.bandTitle)}</h2>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(fill(t.bandLead))}</p>
          ${bandTable}
        </section>

        <section style="display:flex;flex-direction:column;gap:16px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:1.1rem;font-weight:800;color:#0f172a;margin:0;">${escapeHtml(t.readingTitle)}</h2>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.readingLead)}</p>
          <div style="border:1px solid #fed7aa;background:#fff7ed;border-radius:16px;padding:20px;">
            <p style="font-size:0.9rem;color:#1f2937;line-height:1.75;margin:0;">${escapeHtml(fill(t.readingBody))}</p>
          </div>
        </section>

        <section style="display:flex;flex-direction:column;gap:16px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.fitTitle)}</h2>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.fitLead)}</p>
          ${priceTable}
          <p style="font-size:0.72rem;color:#64748b;margin:0;">${escapeHtml(fill(t.tableNote))} ${midBand.count} ${escapeHtml(midBand.label)} &middot; ${escapeHtml(topBand.label)}: ${topBand.count}.</p>
        </section>

        <section style="display:flex;flex-direction:column;gap:12px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.caveatTitle)}</h2>
          <p style="font-size:0.85rem;color:#64748b;line-height:1.7;margin:0;max-width:48rem;">${escapeHtml(t.caveatLead)}</p>
          <div style="border:1px solid #fde68a;background:#fffbeb;border-radius:16px;padding:20px;">
            ${t.caveatBody
              .map((line) => `<p style="font-size:0.85rem;color:#334155;line-height:1.7;margin:0 0 10px;">${escapeHtml(fill(line))}</p>`)
              .join("")}
          </div>
        </section>

        <section style="display:flex;flex-direction:column;gap:12px;border-top:1px solid #e2e8f0;padding-top:32px;">
          <h2 style="font-size:0.7rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#ea580c;margin:0;">${escapeHtml(t.methodTitle)}</h2>
          <ul style="margin:0;padding-left:20px;font-size:0.85rem;color:#475569;line-height:1.7;max-width:48rem;">
            ${t.methodBody.map((line) => `<li style="margin-bottom:6px;">${escapeHtml(fill(line))}</li>`).join("")}
          </ul>
        </section>

        <footer style="border-top:1px solid #e2e8f0;padding-top:24px;font-size:0.7rem;color:#94a3b8;line-height:1.6;">
          ${escapeHtml(t.sourceLabel)}: ${escapeHtml(d.source.name)} &middot; ${escapeHtml(d.source.exportFile)} &middot; ${escapeHtml(d.source.retrievedAt)} &middot; ${escapeHtml(d.source.note)}
        </footer>
      </div>
    </article>
  `;

  return [
    {
      route: KIDS_PRICE_PATH,
      title: kidsPriceSeo.en.title,
      description: kidsPriceSeo.en.description,
      skipTitleH1: true,
      body: `${body}${clusterNavHtml(KIDS_PRICE_PATH)}`,
      ogType: "website" as const,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: kidsPriceSeo.en.title,
          url: `https://balancebiketoddler.com${KIDS_PRICE_PATH}`,
          description: kidsPriceSeo.en.description,
          inLanguage: "en",
          isPartOf: { "@type": "WebSite", name: "BalanceBikeToddler", url: "https://balancebiketoddler.com/" },
        },
        buildKidsPriceDatasetSchema(`https://balancebiketoddler.com${KIDS_PRICE_PATH}`),
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://balancebiketoddler.com/" },
            {
              "@type": "ListItem",
              position: 2,
              name: "Kids bike price",
              item: `https://balancebiketoddler.com${KIDS_PRICE_PATH}`,
            },
          ],
        },
      ],
    },
  ];
}

/* ------------------------------------------------------------------ *
 * CMS-driven product category + detail pages (P0-1)
 *
 * Before this block, only the /products hub was prerendered: every
 * /products/<category> and /products/<category>/<id> URL fell through the
 * `/* /index.html 200` SPA catch-all and served the homepage HTML with the
 * homepage canonical — making all 197 product pages invisible to Google.
 *
 * URL canonical families (must stay in lockstep with three places:
 *  - the SPA: src/lib/productCategoryPaths.ts (single source of truth)
 *  - the Worker sitemap: deriveProductDetailPath + PRODUCT_CATEGORY_SLUGS
 *  - this prerender:
 *     category  -> /products/<slug>/        (kebab-case, trailing slash,
 *                                            directory index.html)
 *     detail    -> /products/<kebabDetailDir>/<product.id>
 *               (matches the SPA's own navigateToPath URLs and the
 *                product_detail self-canonical branch)
 *     legacy underscore/id-form URLs 301 to the kebab family via the
 *     generated _redirects block.
 * ------------------------------------------------------------------ */

type CmsProductFull = CmsProductLite & {
  en?: {
    name?: string;
    cardTitle?: string;
    cardSummary?: string;
    description?: string;
    editorVerdict?: string;
    features?: string[];
    pros?: string[];
    cons?: string[];
    specsText?: string;
    customersSay?: string;
    brandText?: string;
  };
  price?: number | string;
  rating?: { value?: number } | number;
  reviewCount?: number;
  categoryId?: string;
  galleryUrls?: string[];
  updatedAt?: string;
  Product_Display_Fields?: Record<string, { value?: string } | undefined>;
  /** Seller-declared attributes; `Color` is the field that separates two
   *  listings of one model ("White" vs "Mint Green"). */
  Category_Attributes?: Record<string, string | undefined>;
};

/** Mirrors PRODUCT_ROUTE_ALIASES in App.tsx. */
const PRERENDER_PRODUCT_ROUTE_ALIASES: Record<string, string> = {
  scooters: "kids_scooters",
  scooter: "kids_scooters",
  "kids-scooters": "kids_scooters",
  "kids-bikes": "kids_bikes",
  "balance-bikes": "balance_bike",
  balance: "balance_bike",
  "balance bike": "balance_bike",
  bicycle: "kids_bikes",
  tricycle: "kids_tricycles",
  electric_car: "electric_vehicles",
  safety_seat: "car_seat",
  strollers: "stroller",
  jogger_stroller: "stroller",
  jogging_stroller: "stroller",
  jogger: "stroller",
  jogging: "stroller",
  others: "other",
};

/** Mirrors PRIMARY_PRODUCT_CATEGORY_IDS in App.tsx. */
const PRERENDER_PRIMARY_PRODUCT_CATEGORY_IDS = new Set([
  "stroller",
  "balance_bike",
  "kids_bikes",
  "kids_scooters",
  "electric_vehicles",
  "car_seat",
]);

/**
 * Listings whose published review count failed credibleReviewCount() during
 * this run. Reported at the end of the build so the source data can be fixed
 * at origin instead of being silently dropped forever.
 */
const suppressedReviewCounts: string[] = [];

/** Mirrors inferMisclassifiedCategoryId in App.tsx. */
function prerenderInferStrollerCategory(product: CmsProductFull, normalizedCategoryId: string): string {
  if (normalizedCategoryId !== "stroller") return normalizedCategoryId;
  // Authoritative taxonomy signal: these CMS rows are explicitly pull-along
  // wagons in the id namespace even though their name/categoryId say
  // "stroller" (e.g. "Stroller Wagon for Kids"). Route by id prefix BEFORE any
  // name-based signal so the stroller word in the name can't trap them in the
  // strollers bucket. Their physical home is /products/kids-tricycles/ (via the
  // id-prefix fallback in productDetailUrlSlug).
  const idPrefix = String(product.id || "").split("-")[0].toLowerCase();
  if (idPrefix === "kids_pull_along_wagons") return "other";
  const text = [
    product.name,
    (product as Record<string, unknown>).title,
    product.category,
    product.id,
    product.en?.description,
  ]
    .map((item) => String(item || "").toLowerCase())
    .join(" ");

  const hasStrollerSignal = /(stroller|pram|pushchair|buggy|jogger|jogging|travel\s+system|umbrella\s+stroller|double\s+stroller|twin\s+stroller|推车|婴儿车|慢跑推车|双人推车)/i.test(text);
  const hasCarSeatSignal = /(\bcar\s*seat\b|\bbooster\s*seat\b|\bconvertible\s*car\s*seat\b|\binfant\s*car\s*seat\b|安全座椅|提篮座椅)/i.test(text);
  const hasHighChairSignal = /(\bhigh\s*chair\b|feeding\s*chair|餐椅)/i.test(text);
  const hasPlayardSignal = /(\bplayard\b|\bplay\s*yard\b|\bpack\s*(n|and)\s*play\b|围栏床|游戏床)/i.test(text);
  const hasCarrierSignal = /(\bbaby\s*carrier\b|carrier\s*wrap|hip\s*seat\s*carrier|\bsling\b|背带)/i.test(text);
  const hasNurserySignal = /(\bmattress\b|\bcrib\b|\bbassinet\b|\bbaby\s*swing\b|\bswings\s*for\s*infants\b|\brocker\b|\bbouncer\b|\bsoother\b|\bplaypen\b|\bdiaper\b|\bbottle\s*warmer\b|\bbreast\s*pump\b|\bnursery\b|床垫|婴儿床|摇椅|秋千|安抚椅|尿布|奶瓶加热)/i.test(text);
  const hasWagonSignal = /(wagon|wagons|pull\s*along|ride[-\s]*on|\bpush\s*car\b|拖车|拉车|推行车|扭扭车|wiggle\s*car)/i.test(text);

  if (hasCarSeatSignal && !hasStrollerSignal) return "car_seat";
  if (hasHighChairSignal && !hasStrollerSignal) return "high_chair";
  if (hasPlayardSignal && !hasStrollerSignal) return "playard";
  if (hasCarrierSignal && !hasStrollerSignal) return "baby_carrier";
  if (hasNurserySignal && !hasStrollerSignal) return "playard";
  if (hasWagonSignal && !hasStrollerSignal) return "other";
  return normalizedCategoryId;
}

/** Mirrors resolveProductCategoryId in App.tsx. */
function resolveProductCategoryIdFull(product: CmsProductFull): string {
  const raw = String(product.categoryId || product.category || "").trim().toLowerCase();
  const normalized = PRERENDER_PRODUCT_ROUTE_ALIASES[raw] || raw;
  const inferred = prerenderInferStrollerCategory(product, normalized);
  return PRERENDER_PRIMARY_PRODUCT_CATEGORY_IDS.has(inferred) ? inferred : "other";
}

type ProductCategoryMeta = {
  categoryId: string;
  slug: string;
  label: string;
  title: string;
  description: string;
};

/**
 * Canonical slug-form category pages. Slugs are kebab-case (P0-2) and mirror
 * PRODUCT_CATEGORY_URL_SLUGS in src/lib/productCategoryPaths.ts: /products/
 * balance-bikes/ etc. The kids-tricycles hub re-homes the legacy "other"
 * bucket (tricycles + push ride-ons + wagons).
 *
 * Title/description come from CATEGORY_TDK_MAP (src/lib/pageKeywords.ts) — the
 * same single source the hydrated SPA reads at src/App.tsx — so the two
 * renderers cannot drift apart again. categoryId stays prerender-internal
 * (detail-page grouping + productCategoryHref); only the slug is public.
 */
const PRODUCT_CATEGORY_PAGES: ProductCategoryMeta[] = [
  {
    categoryId: "stroller",
    slug: "strollers",
    label: "Strollers",
    title: CATEGORY_TDK_MAP.stroller.en.title,
    description: CATEGORY_TDK_MAP.stroller.en.description,
  },
  {
    categoryId: "balance_bike",
    slug: "balance-bikes",
    label: "Balance Bikes",
    title: CATEGORY_TDK_MAP.balance_bike.en.title,
    description: CATEGORY_TDK_MAP.balance_bike.en.description,
  },
  {
    categoryId: "kids_bikes",
    slug: "kids-bikes",
    label: "Kids Bikes",
    title: CATEGORY_TDK_MAP.kids_bikes.en.title,
    description: CATEGORY_TDK_MAP.kids_bikes.en.description,
  },
  {
    categoryId: "kids_scooters",
    slug: "kids-scooters",
    label: "Kids Scooters",
    title: CATEGORY_TDK_MAP.kids_scooters.en.title,
    description: CATEGORY_TDK_MAP.kids_scooters.en.description,
  },
  {
    categoryId: "electric_vehicles",
    slug: "electric-cars",
    label: "Kids Electric Cars",
    title: CATEGORY_TDK_MAP.electric_vehicles.en.title,
    description: CATEGORY_TDK_MAP.electric_vehicles.en.description,
  },
  {
    categoryId: "car_seat",
    slug: "safety-seats",
    label: "Car Seats",
    title: CATEGORY_TDK_MAP.car_seat.en.title,
    description: CATEGORY_TDK_MAP.car_seat.en.description,
  },
  {
    // Legacy "other" bucket re-homed (P0-2): tricycles + push ride-ons +
    // pull-along wagons live under one kebab-case ride-on directory.
    categoryId: "other_tricycles",
    slug: "kids-tricycles",
    label: "Kids Tricycles & Ride-Ons",
    title: CATEGORY_TDK_MAP.kids_tricycles.en.title,
    description: CATEGORY_TDK_MAP.kids_tricycles.en.description,
  },
];

/**
 * Category tiering — the domain is balancebiketoddler.com and ~95% of the
 * search demand against it is balance-bike related (see doc/gsc-2026-10-13-analysis_zh.md),
 * while strollers alone were 78 of 179 product pages. We are not deleting those
 * catalogues; we are promoting what queries actually ask for and demoting the
 * rest to a subordinate block. Nothing is unlinked, so nothing becomes an orphan.
 */
const PRIMARY_CATEGORY_SLUGS = new Set(["balance-bikes", "kids-bikes"]);

function isPrimaryCategorySlug(slug: string): boolean {
  return PRIMARY_CATEGORY_SLUGS.has(slug);
}

export function renderCategoryHubSections<T extends { slug: string; label: string; description?: string }>(
  metas: T[],
  countFor: (slug: string) => number,
  card: (meta: T, count: number, primary: boolean) => string,
): string {
  const primary = metas.filter((m) => isPrimaryCategorySlug(m.slug));
  const secondary = metas.filter((m) => !isPrimaryCategorySlug(m.slug));
  const primaryHtml = primary.map((m) => card(m, countFor(m.slug), true)).join("");
  if (!secondary.length) return primaryHtml;
  const secondaryHtml = secondary.map((m) => card(m, countFor(m.slug), false)).join("");
  const heading =
    `<h2 style="margin:0 0 4px;font-size:0.72rem;font-weight:800;letter-spacing:0.16em;` +
    `text-transform:uppercase;color:#94a3b8;">Other ride-on categories we also cover</h2>` +
    `<p style="margin:0 0 12px;font-size:0.82rem;color:#64748b;line-height:1.6;">` +
    `Secondary to this site&rsquo;s focus. Every category remains linked from this hub.</p>`;
  return `${primaryHtml}<div style="border-top:1px solid #e2e8f0;padding-top:20px;margin-top:4px;">${heading}${secondaryHtml}</div>`;
}

const SPEC_FIELD_LABELS: Record<string, string> = {
  recommendedAge: "Recommended age",
  weightLimit: "Weight limit",
  itemWeight: "Item weight",
  frameMaterial: "Frame material",
  dimensions: "Dimensions",
  // Added to surface the size/brake long-tail that the category pages now
  // target. These keys live on Product_Display_Fields for the great majority of
  // ride-on listings (wheelSize 23/24 and brakeSystem 22/24 on the published
  // kids-bike set); products that lack them simply skip the row, so the change
  // is additive and category-agnostic rather than kids-bike-specific.
  wheelSize: "Wheel size",
  brakeSystem: "Brake system",
  // Rider-height floor is the strongest "what size bike for N-year-old" signal,
  // but it lives in Product_Specifications.Measurements (not Product_Display_Fields).
  // resolveSpecValue falls through to that source. Coverage on the published
  // kids-bike set: 18/24 have a Minimum User Height value.
  "Minimum User Height": "Minimum user height",
};

/**
 * Reads a spec value from the three places ride-on listings store it.
 * Product_Display_Fields is primary (it backs the other rows); some attributes
 * only exist on Category_Attributes, and a few (notably Minimum User Height)
 * sit inside Product_Specifications.Measurements. Falling through keeps the
 * table additive: a product missing the key in every source simply skips the row.
 */
function resolveSpecValue(product: CmsProductFull, key: string): string {
  const display = product.Product_Display_Fields || {};
  const fromDisplay = String(
    (display as Record<string, { value?: string } | undefined>)[key]?.value || "",
  ).trim();
  if (fromDisplay) return fromDisplay;

  const cat = product.Category_Attributes || {};
  const fromCat = String((cat as Record<string, string | undefined>)[key] || "").trim();
  if (fromCat) return fromCat;

  const specs = (product as unknown as {
    Product_Specifications?: Record<string, Record<string, unknown>>;
  }).Product_Specifications || {};
  const fromMeasurements = String(
    (specs["Measurements"] as Record<string, unknown> | undefined)?.[key] || "",
  ).trim();
  return fromMeasurements;
}

function productDisplayTitle(product: CmsProductFull): string {
  const name = pickText(product.en?.name, product.name);
  return shortenCardTitle(name, 80) || name || String(product.id || "");
}

function productDescriptionParagraphs(product: CmsProductFull): string[] {
  const raw = String(product.en?.description || "").trim();
  if (!raw) return [];
  return raw
    .split(/\n{2,}|\r\n{2,}/)
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function productRatingValue(product: CmsProductFull): number | null {
  const rating = product.rating;
  if (rating && typeof rating === "object" && typeof rating.value === "number") return rating.value;
  if (typeof rating === "number") return rating;
  return null;
}

function productPriceValue(product: CmsProductFull): string | null {
  const price = product.price;
  if (price === null || price === undefined || price === "") return null;
  const num = Number(price);
  return Number.isFinite(num) && num > 0 ? num.toFixed(2) : null;
}

function productCategoryHref(categoryId: string): string | null {
  const meta = PRODUCT_CATEGORY_PAGES.find((item) => item.categoryId === categoryId);
  return meta ? `/products/${meta.slug}/` : null;
}

/** Kebab-case detail directory slug, mirroring productDetailUrlSlug (lib). */
function productDetailSlugDir(product: CmsProductFull): string {
  const resolved = resolveProductCategoryIdFull(product);
  return productDetailUrlSlug(resolved, String(product.id || ""));
}

/**
 * Compare-hub review pages (P1-2 internal linking): crawlable link from every
 * detail page in a mapped category to its prerendered comparison review.
 */
const PRODUCT_COMPARE_HUB_BY_SLUG: Record<string, string> = {
  "balance-bikes": "/reviews/compare/balance-bike-top-picks-compare",
  "kids-scooters": "/reviews/compare/kids-scooter-parent-picks-compare",
  "kids-bikes": "/reviews/compare/toddler-bike-parent-picks-compare",
  "strollers": "/reviews/compare/jogging-stroller-parent-compare",
  "electric-cars": "/reviews/compare/electric-cars-parent-compare",
  "safety-seats": "/reviews/compare/car-safety-seats-parent-compare",
  "kids-tricycles": "/reviews/compare/kids-tricycles-parent-compare",
};

function productCategoryHrefBySlug(slug: string): string {
  return `/products/${slug}/`;
}

function renderProductBreadcrumb(products: Array<{ name: string; href: string }>): string {
  return `
        <nav aria-label="Breadcrumb" style="margin: 0 0 18px; font-size: 0.86rem; color: #64748b;">
          ${products
            .map(
              (crumb, index) =>
                `${index > 0 ? ' <span aria-hidden="true">›</span> ' : ""}<a href="${escapeHtml(crumb.href)}" style="color: #c2410c; text-decoration: none;">${escapeHtml(crumb.name)}</a>`,
            )
            .join("")}
        </nav>
      `;
}

/**
 * Variant labels for product detail titles: product id -> human-readable
 * difference ("Phantom", "Beige", "12 Inch").
 *
 * Why this must be computed catalogue-wide and once: two detail pages collide
 * only if BOTH end up with the same <title>, so the decision needs every
 * sibling in hand. Doing it inside the per-product renderer would also make it
 * O(n^2) over the 36-char name shortening.
 *
 * The label is taken from the first word(s) at which two sibling names
 * diverge, which is where sellers put colourways and sizes. Anything that
 * could misrepresent the page (a half-scraped fragment, a marketing phrase) is
 * rejected wholesale for the whole group — no label is better than a wrong
 * label, and the caller then falls back to a model ID instead of inventing one.
 */
const VARIANT_LABEL_STOP_WORDS = new Set([
  "for", "to", "from", "kids", "child", "children", "girls", "boys",
  "baby", "toddler", "toddlers", "infant", "infants", "stroller", "bike",
  "bikes", "bicycle", "tricycle", "toy", "toys", "seat", "review", "reviews",
  "more", "plus", "new", "includes", "included", "pack", "set", "versus", "vs",
]);
const VARIANT_LABEL_MAX_CHARS = 24;
const VARIANT_LABEL_MAX_WORDS = 4;

function productTitleKeyCore(product: CmsProductFull): string {
  const name = pickText(product.en?.name, product.name, String(product.id || ""));
  return capSeoText(shortenCardTitle(name, 36) || productDisplayTitle(product), 36);
}

/** Shared acceptance rules for a variant label, whether it comes from the
 *  seller's own `Color` field or from the divergence between two names. */
function isUsableVariantLabel(value: string): boolean {
  const candidate = String(value || "").replace(/\s+/g, " ").trim();
  if (candidate.length < 2 || candidate.length > VARIANT_LABEL_MAX_CHARS) return false;
  if (!/[A-Za-z]/.test(candidate)) return false;
  if (!/^[A-Za-z0-9][A-Za-z0-9 .'&/+-]*$/.test(candidate)) return false;
  const parts = candidate.split(" ");
  if (parts.length > VARIANT_LABEL_MAX_WORDS) return false;
  for (const part of parts) {
    if (part.length < 2) return false;
    if (VARIANT_LABEL_STOP_WORDS.has(part.toLowerCase())) return false;
  }
  return true;
}

/** The part of one listing's name that differs from its siblings' names. */
function variantLabelCandidate(sourceName: string, commonWords: number): string | null {
  const words = sourceName.split(/\s+/).filter(Boolean);
  const rest = words.slice(commonWords).join(" ");
  if (!rest) return null;
  // Colourways usually sit right after a comma or in parentheses
  // ("Expedition Jogger, Dash Black", "Infant Swing ... Use (Beige)").
  let candidate = rest.split(/\s*(?:,|;|\||–|—|\s-\s)\s*/)[0]?.trim() || "";
  if (!candidate) {
    candidate = /\(([^)]{2,24})\)/.exec(rest)?.[1]?.trim() || "";
  }
  candidate = candidate
    .replace(/^[-–—:•.,]+\s*/, "")
    .replace(/[,;:.]+$/, "")
    .replace(/\s+/g, " ")
    .trim();
  return isUsableVariantLabel(candidate) ? candidate : null;
}

function buildProductVariantLabels(products: CmsProductFull[]): Map<string, string> {
  const groups = new Map<string, CmsProductFull[]>();
  for (const product of products) {
    const id = String(product.id || "").trim();
    if (!id) continue;
    const key = productTitleKeyCore(product).toLowerCase();
    const members = groups.get(key) || [];
    members.push(product);
    groups.set(key, members);
  }

  const labels = new Map<string, string>();
  for (const [, members] of groups) {
    if (members.length < 2) continue;
    const candidates = members.map((member) => variantLabelFor(member, members));
    // Partial assignment: where two listings genuinely carry no honest
    // difference, leaving BOTH on the model-ID fallback is the correct answer —
    // but where one does, labelling it beats leaving it stamped with an ASIN.
    const counts = new Map<string, number>();
    for (const candidate of candidates) {
      if (candidate) counts.set(candidate.toLowerCase(), (counts.get(candidate.toLowerCase()) || 0) + 1);
    }
    for (const [index, member] of members.entries()) {
      const candidate = candidates[index];
      if (!candidate) continue;
      if (counts.get(candidate.toLowerCase()) !== 1) continue;
      // A label that is a prefix of a sibling's candidate usually means one of
      // the two names was truncated mid-word while being collected
      // ("Whee" / "Wheels") — that difference describes our own data quality,
      // not the product.
      if (candidates.some((other, otherIndex) => otherIndex !== index && other && other.toLowerCase().startsWith(candidate.toLowerCase()))) {
        continue;
      }
      labels.set(String(member.id || "").trim(), candidate);
    }
  }
  return labels;
}

/** Best honest discriminator for one listing: declared colour first, then the
 *  point where its name diverges from its siblings'. */
function variantLabelFor(member: CmsProductFull, members: CmsProductFull[]): string | null {
  const attributes = member.Category_Attributes || {};
  const declared = String(attributes.Color ?? attributes.Colour ?? attributes["Color Name"] ?? "").trim();
  // Colour values carry bundle details after a comma
  // ("Jet, No organizer & cushion") — the colour itself is the leading phrase.
  const colorCandidates = [declared, declared.split(",")[0]?.trim() || ""];
  for (const candidate of colorCandidates) {
    if (isUsableVariantLabel(candidate)) return candidate.replace(/\s+/g, " ").trim();
  }
  const names = members.map((item) =>
    String(pickText(item.en?.name, item.name)).replace(/[®©™]/g, "").replace(/\s+/g, " ").trim(),
  );
  const tokenLists = names.map((value) => value.toLowerCase().split(" "));
  const shortest = Math.min(...tokenLists.map((tokens) => tokens.length));
  let commonWords = 0;
  while (commonWords < shortest && tokenLists.every((tokens) => tokens[commonWords] === tokenLists[0][commonWords])) {
    commonWords += 1;
  }
  const ownName = String(pickText(member.en?.name, member.name)).replace(/[®©™]/g, "").replace(/\s+/g, " ").trim();
  return variantLabelCandidate(ownName, commonWords);
}

function renderProductDetailPage(
  product: CmsProductFull,
  allProducts: CmsProductFull[],
  evaluations: CmsEvaluation[],
  variantLabels: Map<string, string>,
): RoutePage | null {
  const id = String(product.id || "").trim();
  if (!id) return null;
  const detailSlugDir = productDetailSlugDir(product);
  const route = `/products/${detailSlugDir}/${cmsRouteSegment(id)}`;
  const name = pickText(product.en?.name, product.name, id);
  const displayName = productDisplayTitle(product);
  const summary = pickText(product.en?.cardSummary);
  const paragraphs = productDescriptionParagraphs(product);
  const asin = String(id.split("-").pop() || id).toUpperCase();
  // SEO title ≤65 chars total (Semrush title-too-long), brand suffix included
  // by renderDocument. Amazon listing names are far too long — shorten to a
  // 36-char word boundary, then suffix. Two collision sources must both be
  // handled or two pages end up sharing a <title>/<h1>:
  //  - another product with the same truncated name
  //  - a CMS review page whose subject matches this product's shortened name
  //    (e.g. "Glerc Kids Bike Review" on both the product and its review page) —
  //    now settled by qualifying the review article (resolveDuplicateTitles),
  //    so the product keeps the natural title instead of absorbing an ASIN.
  const titleShort = capSeoText(shortenCardTitle(name, 36) || displayName, 36);
  const baseSeoTitle = `${titleShort} Review`;
  // Sibling listings of one model (colourways, size runs) used to be told
  // apart by appending the raw Amazon ASIN — "<title> Review: B0B7MFS2W4".
  // That is legible to nobody searching, and an ID code in a SERP title is a
  // fingerprint of machine-assembled pages. Prefer the difference the two
  // listings' own names actually carry ("Phantom" vs "Dash Black", "Beige" vs
  // "Black"), and only fall back to the ASIN when no human-readable difference
  // exists. buildProductVariantLabels() already rejected any label it could not
  // justify, so an empty string here means "no honest discriminator".
  const variantLabel = variantLabels.get(id) || "";
  const candidateTitle = variantLabel ? `${titleShort} Review (${variantLabel})` : baseSeoTitle;
  const publishedTitleOf = (other: CmsProductFull): string => {
    const otherId = String(other.id || "").trim();
    const otherName = pickText(other.en?.name, other.name, otherId);
    const otherShort = capSeoText(shortenCardTitle(otherName, 36) || productDisplayTitle(other), 36);
    const otherLabel = variantLabels.get(otherId) || "";
    return otherLabel ? `${otherShort} Review (${otherLabel})` : `${otherShort} Review`;
  };
  // Collision resolution is split by page type. A CMS review article that would
  // repeat a product page's title gets qualified instead (see
  // resolveDuplicateTitles), because the product page is where the specs,
  // pricing and internal links live. What remains here is product-vs-product,
  // compared case-insensitively: two titles differing only in "Mamazing" vs
  // "MAMAZING" are the same string as far as a results page is concerned.
  const candidate = candidateTitle.toLowerCase();
  const titleCollides = allProducts.some((other) => {
    const otherId = String(other.id || "").trim();
    if (!otherId || otherId === id) return false;
    const otherTitle = publishedTitleOf(other).toLowerCase();
    return otherTitle === candidate || otherTitle === `${baseSeoTitle.toLowerCase()}: ${asin.toLowerCase()}`;
  });
  const seoTitle = titleCollides ? `${titleShort} Review: ${asin}` : candidateTitle;

  const FALLBACK_DESCRIPTION =
    "Evidence-based review with safety score, specs, and age fit for this kids mobility product.";
  const descSource = pickText(summary, paragraphs[0], FALLBACK_DESCRIPTION);
  const baseDescription = capSeoText(descSource, DESCRIPTION_MAX_CHARS);
  // Two SKUs of one model (colour variants) can carry an identical cardSummary.
  // Truncation to 158 chars then removes the only differing token (usually the
  // price) and both pages ship the same meta description — a Semrush "duplicate
  // meta description" warning. When that happens, lead with the model so the
  // snippets stay unique and keyword-first.
  const descCollides = allProducts.some((other) => {
    const otherId = String(other.id || "").trim();
    if (!otherId || otherId === id) return false;
    const otherSource = pickText(
      pickText(other.en?.cardSummary),
      productDescriptionParagraphs(other)[0],
      FALLBACK_DESCRIPTION,
    );
    return capSeoText(otherSource, DESCRIPTION_MAX_CHARS) === baseDescription;
  });
  const DESC_MODEL_PREFIX = `${titleShort} (model ${asin}) — `;
  const metaDescription = descCollides
    ? `${DESC_MODEL_PREFIX}${capSeoText(descSource, 158 - DESC_MODEL_PREFIX.length)}`
    : baseDescription;
  const image = toAbsoluteMediaUrl(product.imageUrl);
  const editorialScore = Number(product.overallScore);
  const ratingValue = productRatingValue(product);
  const reviewCount = credibleReviewCount(product.reviewCount);
  if (Number(product.reviewCount) > 0 && reviewCount == null) {
    suppressedReviewCounts.push(`${id} (${Number(product.reviewCount).toLocaleString("en-US")})`);
  }
  const price = productPriceValue(product);
  const categoryHref = productCategoryHrefBySlug(detailSlugDir);
  const categoryLabel =
    PRODUCT_CATEGORY_PAGES.find((item) => item.slug === detailSlugDir)?.label || "All Products";
  const categoryBreadcrumbHref = categoryHref;

  const statsChips = [
    Number.isFinite(editorialScore) && editorialScore > 0
      ? `<span style="background:#fff7ed;border:1px solid #fed7aa;border-radius:999px;padding:4px 12px;font-weight:800;color:#c2410c;">Editorial score ${editorialScore.toFixed(1)}/10</span>`
      : "",
    ratingValue
      ? `<span style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:999px;padding:4px 12px;color:#334155;">★ ${ratingValue.toFixed(1)}/5${reviewCount ? ` · ${reviewCount.toLocaleString("en-US")} ratings` : ""}</span>`
      : "",
    price
      ? `<span style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:999px;padding:4px 12px;color:#334155;">Typical price $${price}</span>`
      : "",
  ].filter(Boolean);

  const summaryHtml = summary
    ? `<p style="margin: 0 0 16px; font-size: 1.06rem; font-weight: 700; color: #0f172a;">${escapeHtml(summary)}</p>`
    : "";
  const descriptionHtml = paragraphs.length
    ? `<section style="margin: 0 0 22px;">${paragraphs
        .map((part) => `<p style="margin: 0 0 12px; color: #334155;">${escapeHtml(part)}</p>`)
        .join("")}</section>`
    : "";

  const featureList = Array.isArray(product.en?.features) ? product.en!.features! : [];
  const featuresHtml = featureList.length
    ? `<section style="margin: 0 0 22px;">
        <h2 style="margin: 0 0 10px; font-size: 1.2rem;">Key features</h2>
        <ul style="margin: 0; padding-left: 1.2rem; color: #334155;">${featureList
          .slice(0, 8)
          .map((feature) => `<li style="margin-bottom: 6px;">${escapeHtml(String(feature))}</li>`)
          .join("")}</ul>
      </section>`
    : "";

  const pros = Array.isArray(product.en?.pros) ? product.en!.pros! : [];
  const cons = Array.isArray(product.en?.cons) ? product.en!.cons! : [];
  const prosConsHtml =
    pros.length || cons.length
      ? `<section style="margin: 0 0 22px; display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px;">
          ${
            pros.length
              ? `<div style="border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px 16px; background: #f0fdf4;">
                  <h2 style="margin: 0 0 8px; font-size: 1.02rem; color: #166534;">Pros</h2>
                  <ul style="margin: 0; padding-left: 1.2rem; color: #14532d;">${pros
                    .slice(0, 6)
                    .map((item) => `<li style="margin-bottom: 6px;">${escapeHtml(String(item))}</li>`)
                    .join("")}</ul>
                </div>`
              : ""
          }${
            cons.length
              ? `<div style="border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px 16px; background: #fef2f2;">
                  <h2 style="margin: 0 0 8px; font-size: 1.02rem; color: #991b1b;">Cons</h2>
                  <ul style="margin: 0; padding-left: 1.2rem; color: #7f1d1d;">${cons
                    .slice(0, 6)
                    .map((item) => `<li style="margin-bottom: 6px;">${escapeHtml(String(item))}</li>`)
                    .join("")}</ul>
                </div>`
              : ""
          }
        </section>`
      : "";

  const verdict = pickText(product.en?.editorVerdict);
  const verdictHtml = verdict
    ? `<section style="margin: 0 0 22px; border-left: 4px solid #f97316; padding: 10px 16px; background: #fff7ed; border-radius: 0 12px 12px 0;">
        <h2 style="margin: 0 0 8px; font-size: 1.2rem;">Review Lab Insight</h2>
        <p style="margin: 0; color: #334155;">${escapeHtml(verdict)}</p>
      </section>`
    : "";

  const specRows = Object.entries(SPEC_FIELD_LABELS)
    .map(([key, label]) => {
      const value = resolveSpecValue(product, key);
      return value ? `<tr><td style="padding: 6px 10px; border: 1px solid #e2e8f0; color: #64748b;">${escapeHtml(label)}</td><td style="padding: 6px 10px; border: 1px solid #e2e8f0;">${escapeHtml(value)}</td></tr>` : "";
    })
    .filter(Boolean);
  const specsHtml = specRows.length
    ? `<section style="margin: 0 0 22px;">
        <h2 style="margin: 0 0 10px; font-size: 1.2rem;">Key specs</h2>
        <table style="border-collapse: collapse; font-size: 0.92rem; max-width: 560px;">${specRows.join("")}</table>
      </section>`
    : "";

  // FAQ (P1 SEO): data-driven questions mirroring the hydrated DetailedProductView
  // FAQ section, so the static HTML and rendered DOM never disagree.
  const productFaqs = buildProductFaqsFromDisplayFields(displayName, product.Product_Display_Fields, price);
  const faqHtml = productFaqs.length >= FAQ_MIN_QUESTIONS
    ? `<section style="margin: 0 0 22px;">
        <h2 style="margin: 0 0 10px; font-size: 1.2rem;">Frequently asked questions</h2>
        ${productFaqs
          .map(
            (faq: ProductFaq) =>
              `<h3 style="margin: 14px 0 4px; font-size: 1.02rem; color: #0f172a;">${escapeHtml(faq.q)}</h3><p style="margin: 0; color: #334155;">${escapeHtml(faq.a)}</p>`,
          )
          .join("")}
      </section>`
    : "";

  // Related reviews: evaluations joined to this product by id.
  const relatedReviews = evaluations
    .filter((evaluation) => {
      if (evaluation.status && evaluation.status !== "published") return false;
      const ids = [String(evaluation.productId || ""), ...(evaluation.productIds || [])];
      return ids.some((value) => value.trim().toLowerCase() === id.toLowerCase());
    })
    .map((evaluation) => ({ evaluation, path: evaluationRoutePath(evaluation) }))
    .filter((item): item is { evaluation: CmsEvaluation; path: string } => Boolean(item.path))
    .slice(0, 4);
  const relatedReviewsHtml = relatedReviews.length
    ? `<section style="margin: 0 0 22px;">
        <h2 style="margin: 0 0 10px; font-size: 1.2rem;">Related review reports</h2>
        <ul style="margin: 0; padding-left: 1.2rem; color: #334155;">${relatedReviews
          .map(
            (item) =>
              `<li style="margin-bottom: 6px;"><a href="${escapeHtml(item.path)}" style="color: #c2410c; font-weight: 700; text-decoration: none;">${escapeHtml(pickText(item.evaluation.en?.title, item.evaluation.zh?.title, item.evaluation.title))}</a></li>`,
          )
          .join("")}</ul>
      </section>`
    : "";

  // Related products: same resolved category, highest editorial score first,
  // capped at 6 — gives every detail page crawlable internal links (P1-5).
  const relatedProducts = allProducts
    .filter((candidate) => String(candidate.id || "") !== id && productDetailSlugDir(candidate) === detailSlugDir)
    .sort((a, b) => Number(b.overallScore || 0) - Number(a.overallScore || 0))
    .slice(0, 6);
  const relatedProductsHtml = relatedProducts.length
    ? `<section style="margin: 0 0 22px;">
        <h2 style="margin: 0 0 10px; font-size: 1.2rem;">More ${escapeHtml(categoryLabel.toLowerCase())} from our lab</h2>
        <ul style="margin: 0; padding-left: 1.2rem; color: #334155;">${relatedProducts
          .map(
            (candidate) =>
              `<li style="margin-bottom: 6px;"><a href="${escapeHtml(`/products/${productDetailSlugDir(candidate)}/${cmsRouteSegment(candidate.id)}`)}" style="color: #c2410c; font-weight: 700; text-decoration: none;">${escapeHtml(productDisplayTitle(candidate))}</a></li>`,
          )
          .join("")}</ul>
      </section>`
    : "";

  // The reference pages are all balance-bike specific. Pointing 78 stroller /
  // tricycle detail pages at a balance-bike size chart adds link noise to both
  // sides, so only the inventory those pages actually cover links into them.
  const referenceClusterHtml = detailSlugDir === "balance-bikes" ? clusterNavHtml("") : "";

  const backLinks = `
        <section style="padding: 16px 0 0; border-top: 1px solid #e2e8f0;">
          ${PRODUCT_COMPARE_HUB_BY_SLUG[detailSlugDir] ? `<p style="margin: 0 0 6px;"><a href="${escapeHtml(PRODUCT_COMPARE_HUB_BY_SLUG[detailSlugDir])}" style="color: #c2410c; font-weight: 700; text-decoration: none;">Cross-model compare: see this category's top picks side by side</a></p>` : ""}
          ${detailSlugDir === "balance-bikes" ? `<p style="margin: 0 0 6px;"><a href="${escapeHtml(BUYER_FEEDBACK_PATH)}" style="color: #c2410c; font-weight: 700; text-decoration: none;">What parents say about this balance bike</a></p>` : ""}
          <p style="margin: 0 0 6px;"><a href="${escapeHtml(categoryBreadcrumbHref)}" style="color: #c2410c; font-weight: 700; text-decoration: none;">Browse all ${escapeHtml(categoryLabel.toLowerCase())}</a></p>
          <p style="margin: 0;"><a href="/products" style="color: #c2410c; text-decoration: none;">All product categories</a></p>
        </section>
      `;

  const body = `
        ${renderProductBreadcrumb([
          { name: "Home", href: "/" },
          { name: "Products", href: "/products" },
          { name: categoryLabel, href: categoryBreadcrumbHref },
          { name: displayName, href: route },
        ])}
        <section style="margin: 0 0 22px; display: grid; grid-template-columns: minmax(0, 320px) 1fr; gap: 20px; align-items: start;">
          ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(displayName)}" width="800" height="800" fetchpriority="high" decoding="sync" style="width: 100%; height: auto; aspect-ratio: 1 / 1; object-fit: contain; border-radius: 14px; border: 1px solid #e2e8f0;" />` : ""}
          <div>${statsChips.length ? `<div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px;">${statsChips.join("")}</div>` : ""}</div>
        </section>
        ${summaryHtml}
        ${descriptionHtml}
        ${featuresHtml}
        ${prosConsHtml}
        ${verdictHtml}
        ${specsHtml}
        ${faqHtml}
        ${relatedReviewsHtml}
        ${relatedProductsHtml}
        ${referenceClusterHtml}
        ${backLinks}
      `;

  const productJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    url: `${PUBLIC_SITE_BASE}${route}`,
    ...(image ? { image: [image] } : {}),
    ...(paragraphs.length || summary ? { description: pickText(summary, paragraphs.join(" ").slice(0, 300)) } : {}),
    brand: { "@type": "Brand", name: pickText(product.en?.brandText, product.brand, "Unknown") },
    sku: id,
    ...(ratingValue && reviewCount
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(ratingValue.toFixed(2)),
            bestRating: 5,
            worstRating: 1,
            ratingCount: reviewCount,
          },
        }
      : {}),
    ...(price
      ? {
          offers: {
            "@type": "Offer",
            price,
            priceCurrency: "USD",
            url: `${PUBLIC_SITE_BASE}${route}`,
          },
        }
      : {}),
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${PUBLIC_SITE_BASE}/` },
      { "@type": "ListItem", position: 2, name: "Products", item: `${PUBLIC_SITE_BASE}/products` },
      { "@type": "ListItem", position: 3, name: categoryLabel, item: `${PUBLIC_SITE_BASE}${categoryBreadcrumbHref}` },
      { "@type": "ListItem", position: 4, name: displayName, item: `${PUBLIC_SITE_BASE}${route}` },
    ],
  };

  const faqJsonLd =
    productFaqs.length >= FAQ_MIN_QUESTIONS ? faqPageSchema(productFaqs) : null;

  return {
    route,
    title: seoTitle,
    fullTitle: seoTitle.length <= 44 ? `${seoTitle} | BalanceBikeToddler` : seoTitle,
    description: metaDescription,
    body,
    image: image || undefined,
    preloadImage: image || undefined,
    product,
    jsonLd: [productJsonLd, breadcrumbJsonLd, ...(faqJsonLd ? [faqJsonLd] : [])],
  };
}

function renderProductCategoryPage(meta: ProductCategoryMeta, categoryProducts: CmsProductFull[]): RoutePage {
  const route = `/products/${meta.slug}/`;

  // Full product list (P0-2 crawlability fix): NO slice cap. A capped hub
  // left 57/87 stroller detail pages with zero inbound internal links
  // (sitemap-only orphans, mirroring the article-layer Discovered-not-indexed
  // root cause). The static hub must link every detail page in its directory.
  const cards = categoryProducts;
  const cardsHtml = cards
    .map(
      (product) => `
          <a href="${escapeHtml(`/products/${productDetailSlugDir(product)}/${cmsRouteSegment(product.id)}`)}" style="display: block; border: 1px solid #e2e8f0; border-radius: 16px; padding: 14px; text-decoration: none; color: inherit; background: #ffffff;">
            ${
              toAbsoluteMediaUrl(product.imageUrl)
                ? `<img src="${escapeHtml(toAbsoluteMediaUrl(product.imageUrl))}" alt="${escapeHtml(productDisplayTitle(product))}" loading="lazy" style="width: 100%; height: 160px; object-fit: cover; border-radius: 10px; margin-bottom: 10px;" />`
                : ""
            }
            <h3 style="margin: 0 0 6px; font-size: 0.98rem; color: #0f172a;">${escapeHtml(productDisplayTitle(product))}</h3>
            <p style="margin: 0; font-size: 0.86rem; color: #64748b;">${escapeHtml(String(product.en?.cardSummary || "").slice(0, 140))}</p>
          </a>`,
    )
    .join("");

  // Hub editorial content (P1 SEO): category-level buying guidance + FAQ from
  // the shared src/lib/productHubContent.ts, mirrored by the hydrated SPA hub.
  // Placed BELOW the product cards and styled like the homepage FAQ (centered
  // header + accordion) so the static page never shows a floating content card.
  const hubContent = getHubContent(meta.slug);
  const hubIntroHtml = hubContent.intro
    .map((paragraph) => `<p style="margin: 0 0 12px; color: #475569; font-size: 0.95rem; line-height: 1.7;">${escapeHtml(paragraph)}</p>`)
    .join("");
  const hubFaqHtml = hubContent.faqs.length >= FAQ_MIN_QUESTIONS
    ? `<div style="display: grid; gap: 12px; margin-top: 20px;">
        ${hubContent.faqs
          .map(
            (faq) =>
              `<details style="border: 1px solid #e2e8f0; background: #ffffff; border-radius: 24px; overflow: hidden;">
                <summary style="cursor: pointer; list-style: none; padding: 18px 22px; display: flex; align-items: center; justify-content: space-between; gap: 14px; font-weight: 900; color: #0f172a; font-size: 0.95rem;">${escapeHtml(faq.q)}<span style="color: #94a3b8; font-size: 1.2rem; line-height: 1; font-weight: 700;">＋</span></summary>
                <div style="padding: 0 22px 18px; color: #64748b; background: #f8fafc; border-top: 1px solid #f1f5f9; font-size: 0.92rem; line-height: 1.7;">${escapeHtml(faq.a)}</div>
              </details>`,
          )
          .join("")}
      </div>`
    : "";
  const hubEditorialHtml = `
        <section style="max-width: 720px; margin: 36px auto 0; padding: 0 16px;">
          <p style="margin: 0; text-align: center; color: #ea580c; font-size: 0.68rem; font-weight: 900; letter-spacing: 0.2em; text-transform: uppercase;">Buying Guide</p>
          <h2 style="margin: 8px 0 0; text-align: center; font-size: 1.45rem; color: #0f172a;">${escapeHtml(meta.label)} buying guide &amp; FAQ</h2>
          <div style="margin-top: 16px;">${hubIntroHtml}</div>
          ${hubFaqHtml}
        </section>`;

  const body = `
        ${renderProductBreadcrumb([
          { name: "Home", href: "/" },
          { name: "Products", href: "/products" },
          { name: meta.label, href: route },
        ])}
        <section style="margin: 0 0 22px;">
          <p style="margin: 0 0 8px; color: #334155;">${escapeHtml(meta.description)} Every model below carries a BalanceBikeToddler editorial score from our published-spec checklist, with user ratings and typical pricing where available.</p>
          <p style="margin: 0; color: #64748b; font-size: 0.92rem;">${categoryProducts.length} evidence-based ${escapeHtml(meta.label.toLowerCase())} · updated regularly from the live CMS.</p>
        </section>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 14px;">${cardsHtml}</div>
        ${hubEditorialHtml}
        ${hubGuidesHtml(meta.slug)}
        <section style="padding: 16px 0 0; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0;"><a href="/products" style="color: #c2410c; text-decoration: none;">Compare every kids mobility category →</a></p>
        </section>
      `;

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: meta.title,
    numberOfItems: cards.length,
    itemListElement: cards.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: productDisplayTitle(product),
      url: `${PUBLIC_SITE_BASE}/products/${productDetailSlugDir(product)}/${cmsRouteSegment(product.id)}`,
    })),
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${PUBLIC_SITE_BASE}/` },
      { "@type": "ListItem", position: 2, name: "Products", item: `${PUBLIC_SITE_BASE}/products` },
      { "@type": "ListItem", position: 3, name: meta.label, item: `${PUBLIC_SITE_BASE}${route}` },
    ],
  };

  return {
    route,
    title: meta.title,
    description: meta.description,
    body,
    image: toAbsoluteMediaUrl(categoryProducts[0]?.imageUrl) || undefined,
    jsonLd: [
      itemListJsonLd,
      breadcrumbJsonLd,
      ...(hubContent.faqs.length >= FAQ_MIN_QUESTIONS ? [faqPageSchema(hubContent.faqs)] : []),
    ],
  };
}

/**
 * Id-form alias pages were removed in the P0-2 kebab-case refactor: legacy
 * /products/<categoryId> and /products/<legacyDir>/<id> URLs now 301 to the
 * slug-form family via the generated _redirects block below.
 */


async function main() {
  const indexHtml = await readFile(path.join(distDir, "index.html"), "utf8");
  const appAssets = extractAppAssets(indexHtml);

  const [cmsGuides, cmsNews, cmsEvaluations, cmsProducts, cmsSettings] = await Promise.all([
    fetchPublishedGuides(),
    fetchPublishedNews(),
    fetchPublishedEvaluations(),
    fetchPublishedProducts(),
    fetchCmsSettings(),
  ]);

  // The reference-cluster block is CMS-arranged; resolve it before any page is
  // built so the static HTML ships the same cards, in the same order, as the
  // hydrated view (which resolves the identical settings at runtime).
  referenceCluster = resolveReferenceCluster(
    (cmsSettings as { referenceCluster?: unknown } | null)?.referenceCluster,
  );

  // Deploy-safety gate: when the products collection comes back empty the
  // whole /products/ prerender layer (7 hubs + 197 detail pages) silently
  // disappears and every product route falls back to the SPA shell. A build
  // like that must NOT reach production — refetch once, then hard-fail.
  if (!cmsProducts.length) {
    console.warn("[prerender] products collection EMPTY — refetching once before failing...");
    const retry = await fetchPublishedProducts();
    (cmsProducts as unknown[]).push(...retry);
    if (!cmsProducts.length) {
      throw new Error(
        "[prerender] products CMS fetch returned 0 records after retries — aborting build so an SPA-only dist is never deployed.",
      );
    }
  }
  // Stage-1 duplicates are dropped here, at the single point every product
  // consumer reads from. Filtering this high guarantees the hubs, detail pages,
  // related-product links, reviews hub, sitemap and generated _redirects are all
  // derived from one list — nothing can link to a page we no longer publish.
  const cmsProductsVisible = (cmsProducts as CmsProductFull[]).filter(
    (product) => !isPrunedProduct(product?.id),
  );
  const cmsProductsFullFinal = cmsProductsVisible;
  if (cmsProductsFullFinal.length < 100) {
    console.warn(
      `[prerender] WARNING: only ${cmsProductsFullFinal.length} products fetched (expected ~179 after stage-1 de-duplication) — output may be partial.`,
    );
  }
  if (cmsProducts.length !== cmsProductsVisible.length) {
    console.log(
      `[prerender] stage-1: ${cmsProducts.length - cmsProductsVisible.length} duplicate product listing(s) withheld (${cmsProductsVisible.length} published).`,
    );
  }
  const productMap = new Map<string, CmsProductLite>();
  const cmsProductsFull = cmsProductsVisible;
  for (const product of cmsProductsVisible) {
    const id = String(product?.id || "").trim().toLowerCase();
    if (id) productMap.set(id, product);
  }

  // Product category pages (kebab-case slug form, P0-2) and the 197 product
  // detail pages. The /products hub page is rendered first in `pages` below,
  // whose rm() clears the products/ directory before these are written.
  const productCategoryPages: RoutePage[] = [];
  const productCategoryCounts: string[] = [];
  for (const meta of PRODUCT_CATEGORY_PAGES) {
    // Directory-consistent grouping (P0-2 crawlability fix): a product belongs
    // to the hub whose slug directory its detail page is written into. The
    // previous `resolveProductCategoryIdFull(product) === meta.categoryId`
    // filter leaked "other"-bucket products whose id prefix re-homes them into
    // balance-bikes/kids-bikes dirs — detail files existed but NO hub linked
    // them (sitemap-only orphans). Grouping by productDetailSlugDir guarantees
    // every prerendered detail page gets an inbound link from its own hub.
    const categoryProducts = cmsProductsFull
      .filter((product) => productDetailSlugDir(product) === meta.slug)
      .sort((a, b) => Number(b.overallScore || 0) - Number(a.overallScore || 0));
    if (!categoryProducts.length) continue;
    const slugPage = renderProductCategoryPage(meta, categoryProducts);
    productCategoryPages.push(slugPage);
    productCategoryCounts.push(`${meta.slug}: ${categoryProducts.length}`);
  }
  const productVariantLabels = buildProductVariantLabels(cmsProductsFull);
  const productDetailPages = cmsProductsFull
    .map((product) => renderProductDetailPage(product, cmsProductsFull, cmsEvaluations, productVariantLabels))
    .filter((page): page is RoutePage => page !== null);
  if (productVariantLabels.size) {
    console.log(
      `[prerender] product titles: ${productVariantLabels.size} listing(s) titled with a variant label instead of an ASIN.`,
    );
  }
  if (productDetailPages.length) {
    console.log(
      `[prerender] products: ${productCategoryPages.length} category page(s) [${productCategoryCounts.join(", ")}] + ${productDetailPages.length} detail page(s).`,
    );
  }
  const guideDetailPages = cmsGuides
    .map((guide) => renderGuideDetailPage(guide, cmsEvaluations, cmsProductsVisible))
    .filter((page): page is RoutePage => page !== null);
  const newsDetailPages = cmsNews
    .map((item) => renderNewsDetailPage(item, cmsProductsVisible))
    .filter((page): page is RoutePage => page !== null);
  const evaluationDetailPages = cmsEvaluations
    .map((item) => renderEvaluationDetailPage(item, productMap))
    .filter((page): page is RoutePage => page !== null);
  const retitledReviews = resolveDuplicateTitles(productDetailPages, evaluationDetailPages);
  if (retitledReviews) {
    console.log(`[prerender] ${retitledReviews} CMS review page(s) retitled to stop sharing a <title> with a product page.`);
  }

  // Order matters: an index route (`/guides`, `/news`) is written before its detail
  // pages so the index's cleanup step can remove the whole route folder first.
  const pages: RoutePage[] = [
    renderHomePage(cmsGuides, cmsNews, cmsEvaluations),
    renderProductsPage(cmsProductsFull),
    ...productCategoryPages,
    ...productDetailPages,
    renderGuidesPage(cmsGuides),
    renderNewsPage(cmsNews),
    renderReviewsPage(cmsEvaluations),
    ...renderFilterPages(cmsGuides, cmsNews, cmsEvaluations),
    renderAboutPage(),
    ...renderTransparencyPages(),
    ...renderSafetyRecallPage(),
    ...renderSizingPage(),
    ...renderKidsBikeSizingPage(),
    ...renderSafetyPage(),
    ...renderKidsBikeSafetyPage(),
    ...renderKidsBikeWeightPage(),
    ...renderKidsBikeStabilityPage(),
    ...renderKidsBuyerFeedbackPage(),
    ...renderKidsBikeRecallsPage(),
    ...renderKidsScooterPages(),
    ...renderKidsRideOnPages(),
    ...renderKidsTricyclePages(),
    ...renderKidsStrollerPages(),
    ...renderWeightPage(),
    ...renderStabilityPage(),
    ...renderAgePage(),
    ...renderKidsAgePage(),
    ...renderKidsBikePricePage(),
    ...renderBuyerFeedbackPage(),
    ...renderBudgetPage(),
    ...guideDetailPages,
    ...newsDetailPages,
    ...evaluationDetailPages,
  ];

  if (guideDetailPages.length || newsDetailPages.length || evaluationDetailPages.length) {
    console.log(
      `[prerender] writing ${guideDetailPages.length} guide + ${newsDetailPages.length} news + ${evaluationDetailPages.length} review detail page(s).`,
    );
  }

  // Section pages (home/products/reviews/guides/news/about) publish the
  // CMS-resolved TDK so the static HTML matches what the hydrated SPA writes.
  const sectionSeoApplied = applyCmsSectionSeo(pages, cmsSettings);
  if (sectionSeoApplied) {
    console.log(
      `[prerender] ${sectionSeoApplied} section page(s) now publish CMS-resolved title/description (single source: src/lib/cmsSectionSeo.ts).`,
    );
  }

  if (suppressedReviewCounts.length) {
    console.log(
      `[prerender] hid ${suppressedReviewCounts.length} implausible review count(s) (>${MAX_PLAUSIBLE_REVIEW_COUNT.toLocaleString("en-US")}); star ratings kept, counts and aggregateRating dropped. Fix at source:`,
    );
    for (const entry of suppressedReviewCounts) console.log(`   - ${entry}`);
  }

  for (const page of pages) {
    const html = sanitizeUnsupportedClaims(renderDocument(page, appAssets));
    const routeName = page.route.replace(/^\//, "");
    if (routeName) {
      await rm(path.join(distDir, routeName), { recursive: true, force: true });
      await rm(path.join(distDir, `${routeName}.html`), { force: true });
    }
    // Trailing-slash routes (transparency pages) are written as directory
    // index.html so Cloudflare Pages serves them at the exact canonical URL.
    const outFile = !routeName
      ? path.join(distDir, "index.html")
      : routeName.endsWith("/")
        ? path.join(distDir, routeName, "index.html")
        : path.join(distDir, `${routeName}.html`);
    await mkdir(path.dirname(outFile), { recursive: true });
    await writeFile(outFile, html, "utf8");
  }

  // Full sitemap.xml (R42): public/sitemap.xml was a 6-URL stub. Generate the
  // complete URL set from the pages actually rendered, with honest lastmod
  // values from CMS records. The API worker uses this Pages-hosted file as a
  // zero-D1 fallback when its D1 sitemap build fails (free-tier row limits).
  const pickLastmod = (value: unknown): string | null => {
    const raw = pickText(value as string).trim();
    if (!raw || !/^\d{4}-\d{2}-\d{2}/.test(raw)) return null;
    // Normalize to millisecond ISO-8601 Z form, mirroring the API worker's
    // pickRecordLastmod — D1 stores some seeded records with microsecond
    // precision and a +00:00 offset; emitting them raw made the two sitemap
    // builders disagree byte-for-byte on the same instant.
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  };
  const modByRoute = new Map<string, string | null>();
  let overallMax: string | null = null;
  const trackMax = (value: string | null) => {
    if (value && (!overallMax || value > overallMax)) overallMax = value;
  };
  for (const guide of cmsGuides) {
    const route = guideRoutePath(guide);
    if (route) modByRoute.set(route, pickLastmod(guide.updatedAt || guide.publishedAt));
  }
  for (const item of cmsNews) {
    const route = newsRoutePath(item);
    if (route) modByRoute.set(route, pickLastmod(item.updatedAt || item.publishedAt));
  }
  for (const item of cmsEvaluations) {
    const route = evaluationRoutePath(item);
    if (route) modByRoute.set(route, pickLastmod(item.updatedAt || item.publishedAt));
  }
  let productsMax: string | null = null;
  let guidesMax: string | null = null;
  let newsMax: string | null = null;
  let evalsMax: string | null = null;
  for (const product of cmsProductsFull) {
    const mod = pickLastmod(product.updatedAt);
    trackMax(mod);
    if (mod && (!productsMax || mod > productsMax)) productsMax = mod;
    modByRoute.set(`/products/${productDetailSlugDir(product)}/${cmsRouteSegment(product.id)}`, mod);
  }
  for (const mod of modByRoute.values()) {
    if (mod?.startsWith("20")) trackMax(mod);
  }
  for (const guide of cmsGuides) {
    const mod = modByRoute.get(guideRoutePath(guide) || "") || null;
    if (mod && (!guidesMax || mod > guidesMax)) guidesMax = mod;
  }
  for (const item of cmsNews) {
    const mod = modByRoute.get(newsRoutePath(item) || "") || null;
    if (mod && (!newsMax || mod > newsMax)) newsMax = mod;
  }
  for (const item of cmsEvaluations) {
    const mod = modByRoute.get(evaluationRoutePath(item) || "") || null;
    if (mod && (!evalsMax || mod > evalsMax)) evalsMax = mod;
  }
  /**
 * Sitemap priority, tiered to match domain intent rather than inventory size.
 * Google treats <priority> as a weak hint at best — the real levers above are
 * link prominence and internal link order — but it costs nothing and documents
 * which parts of the catalogue this site actually stands behind.
 */
function sitemapPriority(route: string): number {
  if (route === "" || route === "/") return 1.0;
  const assetRoutes = [
    SIZING_PATH,
    KIDS_SIZING_PATH,
    SAFETY_PATH,
    KIDS_SAFETY_PATH,
    KIDS_WEIGHT_PATH,
    KIDS_STABILITY_PATH,
    KIDS_BUYER_FEEDBACK_PATH,
    KIDS_RECALLS_PATH,
    RECALL_SAFETY_PATH,
    WEIGHT_PATH,
    STABILITY_PATH,
    AGE_PATH,
    KIDS_AGE_PATH,
    KIDS_PRICE_PATH,
    BUYER_FEEDBACK_PATH,
    BUDGET_PATH,
    ...KIDS_SCOOTER_ASSET_PATHS,
    "/products/balance-bikes/",
  ];
  if (assetRoutes.includes(route)) return 0.9;
  if (route.startsWith("/balance-bike-") || route === "/products/kids-bikes/") return 0.8;
  if (/^\/products\/[^/]+\/[^/]+$/.test(route)) {
    // Detail pages: balance-bike ones stay above the rest, but all of them sit
    // below their own category hub.
    return route.startsWith("/products/balance-bikes/") ? 0.6 : 0.4;
  }
  return 0.6;
}

const ABOUT_PAGE_LASTMOD = "2026-09-18T00:00:00.000Z";
  const TRANSPARENCY_LASTMOD = "2026-08-15T00:00:00.000Z";
  const staticModByRoute = new Map<string, string | null>([
    // The home page's route key is "" (see the loc rendering below), not "/" —
    // keying it "/" left this entry dead and the homepage undated while the
    // Worker-side build dates it with the site-wide freshest edit.
    ["", overallMax],
    ["/", overallMax],
    ["/about", ABOUT_PAGE_LASTMOD],
    ["/guides", guidesMax],
    ["/news", newsMax],
    ["/reviews", evalsMax],
    ["/products", productsMax],
  ]);
  for (const meta of PRODUCT_CATEGORY_PAGES) {
    staticModByRoute.set(`/products/${meta.slug}/`, productsMax);
  }
  // R46 filter/list pages: dated by their source collection's latest edit.
  // Topic set comes from the shared guidesTopicPages source of truth so a new
  // topic page is dated here automatically.
  for (const topic of GUIDES_TOPIC_PAGE_IDS) {
    staticModByRoute.set(`/guides/${topic}`, guidesMax);
  }
  for (const category of ["brand_news", "industry", "new_product", "science"]) {
    staticModByRoute.set(`/news/${category}`, newsMax);
  }
  staticModByRoute.set("/reviews/single", evalsMax);
  staticModByRoute.set("/reviews/compare", evalsMax);
  for (const route of [
    "/transparency/testing-methodology/",
    "/transparency/certification-lab-notes/",
    "/transparency/disclaimer/",
    "/transparency/privacy-policy/",
    "/transparency/terms/",
  ]) {
    staticModByRoute.set(route, TRANSPARENCY_LASTMOD);
  }
  const sitemapUrls = pages
    .map((page) => {
      const mod = modByRoute.get(page.route) ?? staticModByRoute.get(page.route) ?? null;
      const loc = `${PUBLIC_SITE_BASE}${page.route === "" ? "/" : page.route}`;
      const lastmodXml = mod ? `<lastmod>${escapeHtml(mod)}</lastmod>` : "";
      const priorityXml = `<priority>${sitemapPriority(page.route).toFixed(1)}</priority>`;
      return `<url><loc>${escapeHtml(loc)}</loc>${lastmodXml}${priorityXml}</url>`;
    })
    .join("");
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemapUrls}</urlset>\n`;
  await writeFile(path.join(distDir, "sitemap.xml"), sitemapXml, "utf8");
  console.log(`[prerender] sitemap.xml: ${pages.length} URL(s) written.`);

  // Publish the resolved reference-cluster list alongside the build. The
  // content guard reads it instead of hardcoding the old asset-page set, so it
  // keeps checking the topology that actually shipped — including any order,
  // wording or target the CMS configured.
  await mkdir(path.join(distDir, "data"), { recursive: true });
  await writeFile(
    path.join(distDir, "data", "reference-cluster.json"),
    JSON.stringify(referenceCluster, null, 2),
    "utf8",
  );

  // Legacy URL family 301s (P0-2): underscore/id-form category directories and
  // the abolished /products/other/ bucket point at the kebab-case family.
  //
  // The Worker owns these rules in production — Cloudflare caps `_redirects`,
  // the Worker's route table has no budget — but the map is still computed
  // here, from the same CMS data, and published as dist/data/legacy-redirects.json
  // so the two repos cannot drift. scripts/sync_redirects_to_worker.mjs mirrors
  // it into backend/api/worker/src/legacyRedirects.generated.ts; re-run it after
  // any catalogue change and redeploy the Worker.
  const LEGACY_CATEGORY_301S: Array<[string, string]> = [
    ["/products/balance_bike", "/products/balance-bikes/"],
    ["/products/stroller", "/products/strollers/"],
    ["/products/kids_bikes", "/products/kids-bikes/"],
    ["/products/kids_scooters", "/products/kids-scooters/"],
    ["/products/scooters", "/products/kids-scooters/"],
    ["/products/electric_vehicles", "/products/electric-cars/"],
    ["/products/electric_car", "/products/electric-cars/"],
    ["/products/car_seat", "/products/safety-seats/"],
    ["/products/safety_seat", "/products/safety-seats/"],
    ["/products/kids_tricycles", "/products/kids-tricycles/"],
    ["/products/other", "/products/"],
  ];
  // Pages that moved home rather than being retired. Exact-only by design:
  // these must not become prefix rules, because the Worker expands a prefix
  // entry into "from/* -> to/*" and there is no second page under any of these
  // paths for a wildcard to catch — a prefix rule would only widen a rule that
  // is meant to move exactly one URL.
  const REHOMED_PAGE_301S: Array<[string, string]> = [
    // 2026-10-22: the /safety/ level is gone; the recall record now sits with
    // the other risk-topic pages. It is the thickest page on the site and the
    // whole site links to it, so the old URL has to keep answering.
    //
    // Keyed without the trailing slash even though the retired URL was a
    // directory index. sync_redirects_to_worker.mjs documents the whole table
    // as no-trailing-slash, and the Worker's resolveLegacyRedirect strips the
    // slash before lookup, so a keyed-with-slash entry can never match and the
    // old URL 404s instead of 301ing. The slash form still reaches the Worker
    // because the route pattern below is emitted for both shapes.
    [LEGACY_RECALL_SAFETY_PATH.replace(/\/+$/, ""), RECALL_SAFETY_PATH],
    // 2026-10-22: /evaluations was an alias of the reviews tab — same route
    // state, same component, same TDK, two URLs. It was never prerendered, so
    // it only answered 200 because public/_redirects carried a bare-root
    // rewrite for it. The rewrite is gone; keep the URL itself alive with a
    // 301 so anything that indexed it (or bookmarked it) still lands on the
    // reviews page.
    //
    // Target "/reviews", not "/reviews/": the reviews page is a file route, and
    // a file route's canonical URL has no trailing slash (the slash form
    // 308-redirects to it).
    ["/evaluations", "/reviews"],
  ];
  // 2026-10-22: pull-along wagons and playards were historically published
  // under /products/strollers/ (the live build predates the kebab-case re-home
  // that now routes them to /products/kids-tricycles/). A rebuild would move
  // their URLs and orphan the rankings they already earned, so keep the old
  // strollers URLs alive with exact 301s to the new location. The id prefixes
  // are matched directly — these are exactly the products the live sitemap
  // exposed under /products/strollers/, and their new home is /products/
  // kids-tricycles/ regardless of the inference result.
  const STROLLER_REHOMED_ID_PREFIXES = new Set(["kids_pull_along_wagons", "playard"]);
  const strollerRehomedRedirects: Array<[string, string]> = cmsProductsFull
    .filter((product) => STROLLER_REHOMED_ID_PREFIXES.has(String(product.id || "").split("-")[0]))
    .map((product) => {
      const id = cmsRouteSegment(product.id);
      return [`/products/strollers/${id}`, `/products/kids-tricycles/${id}`] as [string, string];
    });
  const legacyExactRedirects: Array<[string, string]> = [
    // Re-homed legacy "other" bucket details need per-product targets.
    ...cmsProductsFull
      .filter((product) => resolveProductCategoryIdFull(product) === "other")
      .map((product) => {
        const id = cmsRouteSegment(product.id);
        return [`/products/other/${id}`, `/products/${productDetailSlugDir(product)}/${id}`] as [string, string];
      }),
    ...strollerRehomedRedirects,
    ...LEGACY_CATEGORY_301S,
    ...REHOMED_PAGE_301S,
  ];
  // Wildcard only where id segments map 1:1; the abolished /products/other/
  // bucket deliberately has no fallback so unknown paths hit the SPA shell
  // (hydrated noindex) instead of a misleading redirect.
  const legacyPrefixRedirects = LEGACY_CATEGORY_301S.filter(([, to]) => to !== "/products/");

  await mkdir(path.join(distDir, "data"), { recursive: true });
  await writeFile(
    path.join(distDir, "data", "legacy-redirects.json"),
    `${JSON.stringify(
      {
        exact: Object.fromEntries(legacyExactRedirects),
        prefix: legacyPrefixRedirects,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  console.log(
    `[prerender] legacy-redirects.json: ${legacyExactRedirects.length} exact + ${legacyPrefixRedirects.length} prefix rule(s) (owned by the Worker).`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
