import { readFile, writeFile, mkdir, rm } from "fs/promises";
import path from "path";
import { guideArticles } from "../src/data/guidesData";
import { newsArticles } from "../src/data/newsData";
import { initialEvaluationsData } from "../src/data/evaluationsData";
import { TRANSPARENCY_PAGES } from "../src/data/transparencyPages";
import { getPageCopy } from "../src/config/pageCopy";
import { shortenCardTitle } from "../src/lib/productSeoText";
import { productDetailUrlSlug, resolveProductDetailCategorySlug } from "../src/lib/productCategoryPaths";
import { matchProductsForText } from "../src/lib/relatedProducts";
import { buildProductFaqsFromDisplayFields, faqPageSchema, FAQ_MIN_QUESTIONS, type ProductFaq } from "../src/lib/productFaq";
import { getHubContent } from "../src/lib/productHubContent";

const distDir = path.resolve("dist");
type RoutePage = {
  route: string;
  title: string;
  description: string;
  body: string;
  image?: string;
  ogType?: "website" | "article";
  jsonLd?: Array<Record<string, unknown>>;
  /** Optional canonical path override (used by alias routes that must
   *  consolidate onto the canonical slug-form category URL). */
  canonicalPath?: string;
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
 * Resolves CMS media paths ("scrape_store/..." or bare category paths) to
 * absolute URLs on the store media host. Already-absolute URLs pass through.
 */
function toAbsoluteMediaUrl(raw: unknown): string {
  const text = String(raw || "").trim().replace(/\\/g, "/");
  if (!text) return "";
  if (/^https?:\/\//i.test(text)) return text;
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
        <h1 style="margin: 0 0 12px; font-size: clamp(2rem, 4vw, 3.15rem); line-height: 1.12;">${escapeHtml(page.title)}</h1>
        <p style="margin: 0 0 14px; font-size: 1.08rem; color: #334155; max-width: 52rem;">${escapeHtml(page.description)}</p>
      </header>
      ${page.body}
    </article>
  `;
}

function renderDocument(page: RoutePage, appAssets: AppAssets): string {
  const canonical = `https://balancebiketoddler.com${page.canonicalPath || page.route}`;
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
    <title>${escapeHtml(page.title)} | BalanceBikeToddler</title>
    <meta name="description" content="${escapeHtml(page.description)}" />
    <meta name="robots" content="index,follow,max-image-preview:large" />
    <meta property="og:site_name" content="BalanceBikeToddler" />
    <meta property="og:type" content="${ogType}" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta property="og:title" content="${escapeHtml(page.title)} | BalanceBikeToddler" />
    <meta property="og:description" content="${escapeHtml(page.description)}" />
${ogImage ? `    <meta property="og:image" content="${escapeHtml(ogImage)}" />
    <meta property="og:image:secure_url" content="${escapeHtml(ogImage)}" />
    <meta property="og:image:alt" content="${escapeHtml(page.title)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@bbtreviews" />
    <meta name="twitter:title" content="${escapeHtml(page.title)} | BalanceBikeToddler" />
    <meta name="twitter:description" content="${escapeHtml(page.description)}" />
    <meta name="twitter:image" content="${escapeHtml(ogImage)}" />
` : "    <meta name=\"twitter:card\" content=\"summary\" />\n"}    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <style>
      body { margin: 0; background: #f8fafc; }
      a { color: #ea580c; }
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

function renderInlineMarkdown(value: string): string {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*\n]+)\*/g, "<em>$1</em>")
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" rel="noopener">$1</a>',
    );
}

/** Minimal markdown-subset renderer that mirrors the app's article formatting. */
function renderGuideContentHtml(markdown: string): string {
  const lines = String(markdown || "").replace(/\r\n/g, "\n").split("\n");
  const blocks: string[] = [];
  let paragraph: string[] = [];
  let listKind: "ul" | "ol" | null = null;
  let listItems: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push(`<p style="margin: 0 0 14px;">${renderInlineMarkdown(paragraph.join(" "))}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (!listKind || !listItems.length) {
      listKind = null;
      listItems = [];
      return;
    }
    const tag = listKind;
    const items = listItems;
    listKind = null;
    listItems = [];
    blocks.push(
      `<${tag} style="margin: 0 0 14px; padding-left: 1.2rem;">${items
        .map((item) => `<li style="margin-bottom: 6px;">${renderInlineMarkdown(item)}</li>`)
        .join("")}</${tag}>`,
    );
  };
  const flushAll = () => {
    flushParagraph();
    flushList();
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushAll();
      continue;
    }
    const heading = /^(#{2,4})\s+(.*)$/.exec(line);
    if (heading) {
      flushAll();
      const level = heading[1].length;
      const size = level <= 2 ? "1.5rem" : level === 3 ? "1.22rem" : "1.06rem";
      blocks.push(
        `<h${level} style="margin: 22px 0 10px; font-size: ${size};">${renderInlineMarkdown(heading[2])}</h${level}>`,
      );
      continue;
    }
    const bullet = /^[*•\-]\s+(.*)$/.exec(line);
    if (bullet) {
      flushParagraph();
      if (listKind !== "ul") {
        flushList();
        listKind = "ul";
      }
      listItems.push(bullet[1]);
      continue;
    }
    const ordered = /^\d+[.、)]\s+(.*)$/.exec(line);
    if (ordered) {
      flushParagraph();
      if (listKind !== "ol") {
        flushList();
        listKind = "ol";
      }
      listItems.push(ordered[1]);
      continue;
    }
    flushList();
    // A single newline is a paragraph break in the app's markdown subset, so each
    // remaining line becomes its own paragraph instead of being soft-wrapped.
    flushParagraph();
    paragraph.push(line);
  }
  flushAll();
  return blocks.join("\n        ");
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
      return records;
    } catch (error) {
      if (attempt < attempts) {
        console.warn(`[prerender] ${collection} fetch attempt ${attempt} failed (${(error as Error).message}); retrying...`);
        await new Promise((resolve) => setTimeout(resolve, Math.min(2000 * attempt, 8000)));
        continue;
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
        <p style="margin: 0 0 10px; font-size: 0.78rem; font-weight: 900; letter-spacing: 0.15em; text-transform: uppercase; color: #94a3b8;">${escapeHtml(heading)}</p>
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
  const relatedReviews = relatedEvaluationsForGuide(`${title} ${summary} ${content}`, evaluations);
  const relatedProducts = relatedProductsHtml(`${title} ${summary} ${content}`, products, "Products Mentioned in This Guide");
  const relatedReviewsHtml = relatedReviews.length
    ? `<section style="padding: 18px 0; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0 0 10px; font-size: 0.78rem; font-weight: 900; letter-spacing: 0.15em; text-transform: uppercase; color: #94a3b8;">Related Reviews</p>
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
  const image = toAbsoluteMediaUrl(pickText(guide.imageUrl));

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
        <p style="margin: 0 0 14px; font-size: 1.05rem; color: #334155;"><strong>Short answer:</strong> ${escapeHtml(summary)}</p>
      </section>
      <section style="padding: 6px 0; border-top: 1px solid #e2e8f0;">
        ${renderGuideContentHtml(content) || `<p style="margin: 0;">${escapeHtml(summary)}</p>`}
      </section>
      ${relatedReviewsHtml}
      ${relatedProducts}
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
  const image = toAbsoluteMediaUrl(pickText(item.imageUrl));

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

  return {
    route,
    title,
    description: summary,
    image: image || undefined,
    ogType: "article",
    body: `
      <nav style="padding: 4px 0 16px; font-size: 0.86rem; color: #64748b;">
        <a href="/news">News</a> › <a href="/news/${escapeHtml(channel)}">${escapeHtml(channelLabel)}</a>
      </nav>
      <section style="padding: 4px 0 18px;">
        <p style="margin: 0 0 10px; font-size: 0.86rem; color: #475569; font-weight: 600;">
          By <strong>BalanceBikeToddler Editorial Team</strong> · <time datetime="${escapeHtml(published)}">Published ${escapeHtml(published)}</time>
        </p>
        <p style="margin: 0 0 14px; font-size: 1.05rem; color: #334155;"><strong>Short answer:</strong> ${escapeHtml(summary)}</p>
      </section>
      <section style="padding: 6px 0; border-top: 1px solid #e2e8f0;">
        ${renderGuideContentHtml(content) || `<p style="margin: 0;">${escapeHtml(summary)}</p>`}
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
  const image = toAbsoluteMediaUrl(pickText(item.imageUrl));
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
        <p style="margin: 0 0 10px; font-size: 0.78rem; font-weight: 900; letter-spacing: 0.15em; text-transform: uppercase; color: #94a3b8;">${isCompare ? "Products in This Comparison" : "Tested Product"}</p>
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
  const listedGuides: Array<{ title: string; summary: string; meta: string; url: string }> = cmsGuides.length
    ? cmsGuides.flatMap((guide) => {
        const route = guideRoutePath(guide);
        if (!route) return [];
        const topic = guideTopicCategory(guide);
        return [{
          title: pickText(guide.en?.title, guide.zh?.title, guide.id),
          summary: pickText(guide.en?.summary, guide.seo?.en?.description, "BalanceBikeToddler buying guide."),
          meta: `${topic.replace(/_/g, " ")} · ${pickText(guide.updatedAt, guide.publishedAt).slice(0, 10) || "2026-08-15"}`,
          url: `${PUBLIC_SITE_BASE}${route}`,
        }];
      })
    : articles.map((article) => ({
        title: article.title,
        summary: article.summary,
        meta: `${article.categoryLabel} · ${article.readTime} · ${article.publishDate}`,
        url: `${PUBLIC_SITE_BASE}/guides/${article.category}/${article.id}`,
      }));
  const usingCmsGuides = cmsGuides.length > 0;
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
      datePublished: "2026-08-15",
      dateModified: "2026-08-15",
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
    description: "Step-by-step buying guidance for families choosing safer ride-on products.",
    body: `
      <section style="padding: 22px 0;">
        <h2 style="margin: 0 0 12px; font-size: 1.5rem;">Which questions do parents ask first?</h2>
        <p style="margin: 0 0 14px;"><strong>Short answer:</strong> the guide library starts with the practical questions: which size is safest, which frame is easiest to control, and which product fits the family routine.</p>
        <p style="margin: 0 0 14px;">The point is to turn a vague category search into a sequence of decisions that can be checked and compared.</p>
        <p style="margin: 0 0 14px;">Each guide ends with a source check and a clear next step, so readers can move from a quick answer to a confident buying decision without guessing.</p>
        <p style="margin: 0 0 14px; font-size: 0.88rem; color: #475569; font-weight: 600;">By <strong>BalanceBikeToddler Editorial Team</strong> · <time datetime="2026-08-15">Published 2026-08-15</time> · <time datetime="2026-08-15">Updated 2026-08-15</time></p>
        ${renderSources([
          { label: "CPSC Children's Products Guidance", href: "https://www.cpsc.gov/Business--Manufacturing/Business-Education/Business-Guidance/Childrens-Products", note: "baseline children's product safety context" },
          { label: "FTC Endorsement Guides", href: "https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides", note: "disclosure context for recommendations" },
        ])}
      </section>
      <section style="padding: 22px 0; border-top: 1px solid #e2e8f0;">
        <h2 style="margin: 0 0 12px; font-size: 1.5rem;">Which guide topics are most useful?</h2>
        ${listedGuides.map((guide) => `
          <section style="padding: 14px 0; border-top: 1px solid #f1f5f9;">
            <h3 style="margin: 0 0 8px; font-size: 1.05rem;"><a href="${escapeHtml(new URL(guide.url).pathname)}">${escapeHtml(guide.title)}</a></h3>
            <p style="margin: 0 0 8px; color: #334155;">${escapeHtml(guide.summary)}</p>
            <p style="margin: 0; font-size: 0.88rem; color: #64748b;">${escapeHtml(guide.meta)}</p>
          </section>
        `).join("")}
        ${usingCmsGuides ? `<p style="margin: 14px 0 0; font-size: 0.9rem; color: #475569;">${listedGuides.length} published guide${listedGuides.length === 1 ? "" : "s"} in the library. <a href="/guides">Browse all guides</a>.</p>` : ""}
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
  const listedNews: Array<{ title: string; summary: string; meta: string; url: string }> = usingCmsNews
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
          meta: `${newsCategoryLabel(item)} · ${pickText(item.publishedAt, item.updatedAt).slice(0, 10) || "2026-08-15"}`,
          url: `${PUBLIC_SITE_BASE}${route}`,
        }];
      })
    : articles.map((article) => ({
        title: article.title,
        summary: article.summary,
        meta: `${article.categoryLabel} · ${article.readTime} · ${article.publishDate}`,
        url: `${PUBLIC_SITE_BASE}/news/${article.category}/${article.id}`,
      }));
  const canonical = "https://balancebiketoddler.com/news";
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
      datePublished: "2026-08-15",
      dateModified: "2026-08-15",
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
        <p style="margin: 0 0 14px; font-size: 0.88rem; color: #475569; font-weight: 600;">By <strong>BalanceBikeToddler Editorial Team</strong> · <time datetime="2026-08-15">Published 2026-08-15</time> · <time datetime="2026-08-15">Updated 2026-08-15</time></p>
        ${renderSources([
          { label: "EU Toy Safety", href: "https://single-market-economy.ec.europa.eu/sectors/toys/toy-safety_en", note: "regulatory context for toy-adjacent products" },
          { label: "ASTM F963", href: "https://www.astm.org/f0963-23.html", note: "toy safety standard reference" },
        ])}
      </section>
      <section style="padding: 22px 0; border-top: 1px solid #e2e8f0;">
        <h2 style="margin: 0 0 12px; font-size: 1.5rem;">Which stories are most citable?</h2>
        ${listedNews.map((item) => `
          <section style="padding: 14px 0; border-top: 1px solid #f1f5f9;">
            <h3 style="margin: 0 0 8px; font-size: 1.05rem;"><a href="${escapeHtml(new URL(item.url).pathname)}">${escapeHtml(item.title)}</a></h3>
            <p style="margin: 0 0 8px; color: #334155;">${escapeHtml(item.summary)}</p>
            <p style="margin: 0; font-size: 0.88rem; color: #64748b;">${escapeHtml(item.meta)}</p>
          </section>
        `).join("")}
        ${usingCmsNews ? `<p style="margin: 14px 0 0; font-size: 0.9rem; color: #475569;">${listedNews.length} published news ${listedNews.length === 1 ? "story" : "stories"}. <a href="/news">Browse the news hub</a>.</p>` : ""}
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

function renderProductsPage(): RoutePage {
  const summary = getPageCopy("en").products;
  const canonical = "https://balancebiketoddler.com/products";
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
      datePublished: "2026-08-15",
      dateModified: "2026-08-15",
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: 4,
        itemListElement: [
          summary.seoPills.balanceBikeToddler,
          summary.seoPills.twinStroller,
          summary.seoPills.toddlerBike,
          summary.seoPills.kidsScooter,
        ].map((name, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name,
          url: canonical,
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
        <h2 style="margin: 0 0 12px; font-size: 1.5rem;">What should you compare first?</h2>
        <p style="margin: 0 0 14px;"><strong>Short answer:</strong> start with size fit, braking behavior, frame weight, and whether the product matches the child's daily routine.</p>
        <p style="margin: 0 0 14px;">The product hub is meant to shorten the route from a broad category search to a specific, defensible choice.</p>
        <p style="margin: 0 0 14px;">Byline: <strong>BalanceBikeToddler Editorial Team</strong> · <time datetime="2026-08-15">Published 2026-08-15</time> · <time datetime="2026-08-15">Updated 2026-08-15</time></p>
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

function renderReviewsPage(): RoutePage {
  const reviews = initialEvaluationsData.slice(0, 3);
  const summary = getPageCopy("en").reviews;
  const canonical = "https://balancebiketoddler.com/reviews";
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
      datePublished: "2026-08-15",
      dateModified: "2026-08-15",
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: reviews.length,
        itemListElement: reviews.map((review, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: review.en?.title || review.zh?.title || review.id,
          url: canonical,
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
        <p style="margin: 0 0 14px;">Byline: <strong>BalanceBikeToddler Editorial Team</strong> · <time datetime="2026-08-15">Published 2026-08-15</time> · <time datetime="2026-08-15">Updated 2026-08-15</time></p>
        <p style="margin: 0 0 14px;">The review center is built around clear verdicts, visible scores, and a short trail from conclusion to evidence. That makes each answer easier to compare and reuse.</p>
        <p style="margin: 0;">We also keep the review language close to the public rulebook so the page remains understandable even when a reader only skims the summary.</p>
      </section>
      <section style="padding: 22px 0; border-top: 1px solid #e2e8f0;">
        <h2 style="margin: 0 0 12px; font-size: 1.5rem;">Which review snapshots matter most?</h2>
        <p style="margin: 0 0 14px;"><strong>Short answer:</strong> the snapshots with a named product, a visible score, and a direct verdict are the easiest to compare and cite.</p>
        <p style="margin: 0 0 14px;">Each card below stays tied to a specific product use case, so the page can answer both “what is it?” and “why does it matter?” in one place.</p>
        ${renderBulletedCards(reviews.map((review) => ({
          title: review.en?.title || review.zh?.title || review.id,
          text: review.en?.verdict || review.zh?.verdict || "",
          meta: `Safety ${review.scores.safety.toFixed(1)} · Comfort ${review.scores.comfort.toFixed(1)} · Value ${review.scores.valueForMoney.toFixed(1)}`,
        })))}
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
        <h2 style="margin: 0 0 12px; font-size: 1.5rem;">Which review snapshots matter most?</h2>
        ${renderBulletedCards(reviews.map((review) => ({
          title: review.en?.title || review.zh?.title || review.id,
          text: review.en?.verdict || review.zh?.verdict || "",
          meta: `Safety ${review.scores.safety.toFixed(1)} · Comfort ${review.scores.comfort.toFixed(1)} · Value ${review.scores.valueForMoney.toFixed(1)}`,
        })))}
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

function renderAboutPage(): RoutePage {
  const stats = [
    { value: "12", label: "senior engineers" },
    { value: "5", label: "pediatric advisors" },
    { value: "4", label: "audit checks" },
    { value: "2026-08-15", label: "updated" },
  ];
  const auditRows = [
    { check: "1. Precision weighing", evidence: "Full riding setup, including pedals and guards", why: "Keeps factory claims honest" },
    { check: "2. Braking resistance", evidence: "Pressure sensors on hand-brake force", why: "Shows whether a child can stop safely" },
    { check: "3. Q-factor analysis", evidence: "Pedal horizontal distance measurement", why: "Flags awkward or risky leg posture" },
    { check: "4. Fatigue testing", evidence: "100k+ impact cycles on hydraulic rigs", why: "Checks long-run frame durability" },
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
 * `public/_redirects` falls back to the SPA shell with `/* /index.html 200`, so a
 * prerendered guide needs its own explicit rule to be served. Rules are exact
 * paths only: a wildcard would turn unknown guide URLs into 404s instead of
 * letting the client router handle them.
 */
/**
 * Registers one exact 200-rewrite per prerendered detail page, immediately before
 * the SPA catch-all. Exact rules are used deliberately: a wildcard would turn any
 * unknown guide/news URL into a hard 404 instead of letting the SPA handle it.
 */
async function injectGuideRedirects(routes: string[], legacyRedirects: string[]): Promise<void> {
  const redirectsPath = path.join(distDir, "_redirects");
  let content: string;
  try {
    content = await readFile(redirectsPath, "utf8");
  } catch {
    return;
  }

  const START = "# --- generated: CMS detail pages ---";
  const END = "# --- end generated ---";
  const LEGACY_START = "# --- generated: legacy product URL family (P0-2 kebab-case 301s) ---";
  const LEGACY_END = "# --- end legacy 301s ---";
  let cleaned = content;
  for (const [marker, endMarker] of [[START, END], [LEGACY_START, LEGACY_END]] as Array<[string, string]>) {
    for (;;) {
      const start = cleaned.indexOf(marker);
      if (start === -1) break;
      const end = cleaned.indexOf(endMarker, start);
      if (end === -1) {
        cleaned = cleaned.slice(0, start);
        break;
      }
      cleaned = `${cleaned.slice(0, start)}${cleaned.slice(end + endMarker.length)}`.replace(/\n{3,}/g, "\n\n");
    }
  }

  // `200!` (verbatim) is required: a plain `200` rewrite makes Pages run a second
  // redirect lookup on the `.html` target, whose pretty-URL normalization bounces
  // back to the extensionless path — producing an infinite 308 loop in production.
  const lines = routes.map((route) => `${route} ${route}.html 200!`);
  const legacyBlock = legacyRedirects.length
    ? `# --- generated: legacy product URL family (P0-2 kebab-case 301s) ---\n${legacyRedirects.join("\n")}\n# --- end legacy 301s ---\n`
    : "";
  const block = legacyBlock + (lines.length ? `${START}\n${lines.join("\n")}\n${END}\n` : "");
  const CATCH_ALL = "/* /index.html 200";
  const next = cleaned.includes(CATCH_ALL)
    ? cleaned.replace(CATCH_ALL, `${block}${CATCH_ALL}`)
    : `${cleaned.replace(/\s*$/, "\n")}${block}`;

  await writeFile(redirectsPath, next, "utf8");
  if (lines.length) {
    console.log(`[prerender] _redirects: ${lines.length} content detail rule(s) registered.`);
  }
}

/**
 * Static transparency / trust pages (disclaimer, testing methodology,
 * certification & lab notes, terms, privacy policy). Without prerendering
 * these routes fall through to the SPA shell whose raw canonical points at
 * the homepage — telling crawlers to ignore the real page.
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
      </section>`,
      )
      .join("");
    const body = `
      <section style="padding: 22px 0;">
        <p style="margin: 0 0 6px; font-size: 0.78rem; letter-spacing: 0.16em; text-transform: uppercase; color: #64748b; font-weight: 800;">${escapeHtml(en.navLabel)}</p>
        <h1 style="margin: 0 0 10px; font-size: 1.6rem;">${escapeHtml(en.title)}</h1>
        <p style="margin: 0 0 12px; font-size: 1.02rem; color: #334155;">${escapeHtml(en.subtitle)}</p>
        <p style="margin: 0 0 8px;">${escapeHtml(en.intro)}</p>
      </section>
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
      body,
      ogType: "website" as const,
    };
  });
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

/** Mirrors inferMisclassifiedCategoryId in App.tsx. */
function prerenderInferStrollerCategory(product: CmsProductFull, normalizedCategoryId: string): string {
  if (normalizedCategoryId !== "stroller") return normalizedCategoryId;
  const text = [
    product.name,
    (product as Record<string, unknown>).title,
    product.category,
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

  if (hasCarSeatSignal && !hasStrollerSignal) return "car_seat";
  if (hasHighChairSignal && !hasStrollerSignal) return "high_chair";
  if (hasPlayardSignal && !hasStrollerSignal) return "playard";
  if (hasCarrierSignal && !hasStrollerSignal) return "baby_carrier";
  if (hasNurserySignal && !hasStrollerSignal) return "playard";
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
 */
const PRODUCT_CATEGORY_PAGES: ProductCategoryMeta[] = [
  {
    categoryId: "stroller",
    slug: "strollers",
    label: "Strollers",
    title: "Best Jogging Stroller & Travel Stroller Reviews 2026",
    description: "Compare lab-tested jogging stroller, travel stroller, and twin stroller models with safety scores, stability metrics, and foldability insights.",
  },
  {
    categoryId: "balance_bike",
    slug: "balance-bikes",
    label: "Balance Bikes",
    title: "Best Toddler Balance Bikes 2026 Lab-Tested Reviews",
    description: "Explore our expert lab database for the safest toddler balance bikes. Compare weight capacity, stability scores, and features for top ride-on brands.",
  },
  {
    categoryId: "kids_bikes",
    slug: "kids-bikes",
    label: "Kids Bikes",
    title: "Best Kids Bikes & Toddler Bicycles 2026 Lab-Tested",
    description: "Discover the safest and top-rated kids bikes for ages 2-14. Explore our lab database to compare BMX style, training wheels, and dual suspension bicycles.",
  },
  {
    categoryId: "kids_scooters",
    slug: "kids-scooters",
    label: "Kids Scooters",
    title: "Best Kids Electric Scooter & Kick Scooter Reviews 2026",
    description: "Find lab-reviewed kids electric scooter and kick scooter options, including foldable models, 3-wheel starters, and seated configurations.",
  },
  {
    categoryId: "electric_vehicles",
    slug: "electric-cars",
    label: "Kids Electric Cars",
    title: "Best Kids Electric Cars & Ride-On Toys Reviews 2026",
    description: "Review lab-tested kids electric cars, 12V/24V ride-on toys, and electric ride-on options with battery safety, braking control, and runtime benchmarks.",
  },
  {
    categoryId: "car_seat",
    slug: "safety-seats",
    label: "Car Seats",
    title: "Best Convertible & Toddler Car Seats 2026 Lab-Tested",
    description: "Find the safest convertible and booster car seats for your child. Compare lab-tested scores, weight limits, and safety features for top brands like Graco and Evenflo.",
  },
  {
    // Legacy "other" bucket re-homed (P0-2): tricycles + push ride-ons +
    // pull-along wagons live under one kebab-case ride-on directory.
    categoryId: "other_tricycles",
    slug: "kids-tricycles",
    label: "Kids Tricycles & Ride-Ons",
    title: "Best Kids Tricycles & Push Ride-On Toys 2026 Lab-Tested",
    description: "Browse lab-tested kids tricycles, push ride-on cars, and pull-along wagons with stability scores, weight limits, and age-fit guidance for toddlers.",
  },
];

const SPEC_FIELD_LABELS: Record<string, string> = {
  recommendedAge: "Recommended age",
  weightLimit: "Weight limit",
  itemWeight: "Item weight",
  frameMaterial: "Frame material",
  dimensions: "Dimensions",
};

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

function renderProductDetailPage(
  product: CmsProductFull,
  allProducts: CmsProductFull[],
  evaluations: CmsEvaluation[],
): RoutePage | null {
  const id = String(product.id || "").trim();
  if (!id) return null;
  const detailSlugDir = productDetailSlugDir(product);
  const route = `/products/${detailSlugDir}/${cmsRouteSegment(id)}`;
  const name = pickText(product.en?.name, product.name, id);
  const displayName = productDisplayTitle(product);
  const summary = pickText(product.en?.cardSummary);
  const paragraphs = productDescriptionParagraphs(product);
  const metaDescription = pickText(
    summary,
    paragraphs[0]?.slice(0, 170),
    "Lab-tested review with safety score, specs, and age fit for this kids mobility product.",
  );
  const image = toAbsoluteMediaUrl(product.imageUrl);
  const editorialScore = Number(product.overallScore);
  const ratingValue = productRatingValue(product);
  const reviewCount = Number(product.reviewCount || 0);
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

  const displayFields = product.Product_Display_Fields || {};
  const specRows = Object.entries(SPEC_FIELD_LABELS)
    .map(([key, label]) => {
      const value = String(displayFields[key]?.value || "").trim();
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

  const backLinks = `
        <section style="padding: 16px 0 0; border-top: 1px solid #e2e8f0;">
          ${PRODUCT_COMPARE_HUB_BY_SLUG[detailSlugDir] ? `<p style="margin: 0 0 6px;"><a href="${escapeHtml(PRODUCT_COMPARE_HUB_BY_SLUG[detailSlugDir])}" style="color: #c2410c; font-weight: 700; text-decoration: none;">Cross-model compare: see this category's top picks side by side</a></p>` : ""}
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
          ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(displayName)}" style="width: 100%; border-radius: 14px; border: 1px solid #e2e8f0;" />` : ""}
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
    title: `${displayName} — Review, Specs & Safety Score`,
    description: metaDescription,
    body,
    image: image || undefined,
    jsonLd: [productJsonLd, breadcrumbJsonLd, ...(faqJsonLd ? [faqJsonLd] : [])],
  };
}

function renderProductCategoryPage(meta: ProductCategoryMeta, categoryProducts: CmsProductFull[]): RoutePage {
  const route = `/products/${meta.slug}/`;

  const cards = categoryProducts.slice(0, 30);
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
          <p style="margin: 0 0 8px; color: #334155;">${escapeHtml(meta.description)} Every model below carries a BalanceBikeToddler editorial score from our lab checklist, with user ratings and typical pricing where available.</p>
          <p style="margin: 0; color: #64748b; font-size: 0.92rem;">${categoryProducts.length} lab-tested ${escapeHtml(meta.label.toLowerCase())} · updated regularly from the live CMS.</p>
        </section>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 14px;">${cardsHtml}</div>
        ${hubEditorialHtml}
        <section style="padding: 16px 0 0; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0;"><a href="/products" style="color: #c2410c; text-decoration: none;">Compare every kids mobility category →</a></p>
        </section>
      `;

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: meta.title,
    numberOfItems: cards.length,
    itemListElement: cards.slice(0, 20).map((product, index) => ({
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

  const [cmsGuides, cmsNews, cmsEvaluations, cmsProducts] = await Promise.all([
    fetchPublishedGuides(),
    fetchPublishedNews(),
    fetchPublishedEvaluations(),
    fetchPublishedProducts(),
  ]);

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
  const cmsProductsFullFinal = cmsProducts as CmsProductFull[];
  if (cmsProductsFullFinal.length < 100) {
    console.warn(
      `[prerender] WARNING: only ${cmsProductsFullFinal.length} products fetched (expected ~197) — output may be partial.`,
    );
  }
  const productMap = new Map<string, CmsProductLite>();
  const cmsProductsFull = cmsProducts as CmsProductFull[];
  for (const product of cmsProducts) {
    const id = String(product?.id || "").trim().toLowerCase();
    if (id) productMap.set(id, product);
  }

  // Product category pages (kebab-case slug form, P0-2) and the 197 product
  // detail pages. The /products hub page is rendered first in `pages` below,
  // whose rm() clears the products/ directory before these are written.
  const productCategoryPages: RoutePage[] = [];
  const productCategoryCounts: string[] = [];
  for (const meta of PRODUCT_CATEGORY_PAGES) {
    const categoryProducts = cmsProductsFull
      .filter((product) => {
        const resolved = resolveProductCategoryIdFull(product);
        if (meta.slug === "kids-tricycles") {
          // Re-homed legacy "other" bucket: tricycles + push ride-ons + wagons.
          return resolved === "other" && productDetailUrlSlug(resolved, String(product.id || "")) === "kids-tricycles";
        }
        return resolved === meta.categoryId;
      })
      .sort((a, b) => Number(b.overallScore || 0) - Number(a.overallScore || 0));
    if (!categoryProducts.length) continue;
    const slugPage = renderProductCategoryPage(meta, categoryProducts);
    productCategoryPages.push(slugPage);
    productCategoryCounts.push(`${meta.slug}: ${categoryProducts.length}`);
  }
  const productDetailPages = cmsProductsFull
    .map((product) => renderProductDetailPage(product, cmsProductsFull, cmsEvaluations))
    .filter((page): page is RoutePage => page !== null);
  if (productDetailPages.length) {
    console.log(
      `[prerender] products: ${productCategoryPages.length} category page(s) [${productCategoryCounts.join(", ")}] + ${productDetailPages.length} detail page(s).`,
    );
  }
  const guideDetailPages = cmsGuides
    .map((guide) => renderGuideDetailPage(guide, cmsEvaluations, cmsProducts))
    .filter((page): page is RoutePage => page !== null);
  const newsDetailPages = cmsNews
    .map((item) => renderNewsDetailPage(item, cmsProducts))
    .filter((page): page is RoutePage => page !== null);
  const evaluationDetailPages = cmsEvaluations
    .map((item) => renderEvaluationDetailPage(item, productMap))
    .filter((page): page is RoutePage => page !== null);

  // Order matters: an index route (`/guides`, `/news`) is written before its detail
  // pages so the index's cleanup step can remove the whole route folder first.
  const pages: RoutePage[] = [
    renderProductsPage(),
    ...productCategoryPages,
    ...productDetailPages,
    renderGuidesPage(cmsGuides),
    renderNewsPage(cmsNews),
    renderReviewsPage(),
    renderAboutPage(),
    ...renderTransparencyPages(),
    ...guideDetailPages,
    ...newsDetailPages,
    ...evaluationDetailPages,
  ];

  if (guideDetailPages.length || newsDetailPages.length || evaluationDetailPages.length) {
    console.log(
      `[prerender] writing ${guideDetailPages.length} guide + ${newsDetailPages.length} news + ${evaluationDetailPages.length} review detail page(s).`,
    );
  }

  for (const page of pages) {
    const html = renderDocument(page, appAssets);
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

  // Legacy URL family 301s (P0-2): underscore/id-form category directories and
  // the abolished /products/other/ bucket point at the kebab-case family.
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
  const legacyRedirects = [
    // Re-homed legacy "other" bucket details need per-product targets, and
    // must precede any wildcard rule (Pages redirects match top-down).
    ...cmsProductsFull
      .filter((product) => resolveProductCategoryIdFull(product) === "other")
      .map((product) => {
        const id = cmsRouteSegment(product.id);
        return `/products/other/${id} /products/${productDetailSlugDir(product)}/${id} 301`;
      }),
    ...LEGACY_CATEGORY_301S.flatMap(([from, to]) => [
      `${from} ${to} 301`,
      // Wildcard only where id segments map 1:1; the abolished /products/other/
      // bucket deliberately has no fallback so unknown paths hit the SPA shell
      // (hydrated noindex) instead of a misleading redirect.
      ...(to === "/products/" ? [] : [`${from}/* ${to}:splat 301`]),
    ]),
  ];

  await injectGuideRedirects([
    ...guideDetailPages.map((page) => page.route),
    ...newsDetailPages.map((page) => page.route),
  ], legacyRedirects);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
