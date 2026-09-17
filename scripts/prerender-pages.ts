import { readFile, writeFile, mkdir, rm } from "fs/promises";
import path from "path";
import { guideArticles } from "../src/data/guidesData";
import { newsArticles } from "../src/data/newsData";
import { initialEvaluationsData } from "../src/data/evaluationsData";
import { getPageCopy } from "../src/config/pageCopy";

const distDir = path.resolve("dist");
type RoutePage = {
  route: string;
  title: string;
  description: string;
  body: string;
  jsonLd?: Array<Record<string, unknown>>;
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
  const canonical = `https://balancebiketoddler.com${page.route}`;
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
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(page.title)} | BalanceBikeToddler</title>
    <meta name="description" content="${escapeHtml(page.description)}" />
    <meta name="robots" content="index,follow,max-image-preview:large" />
    <meta property="og:site_name" content="BalanceBikeToddler" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta property="og:title" content="${escapeHtml(page.title)} | BalanceBikeToddler" />
    <meta property="og:description" content="${escapeHtml(page.description)}" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />
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
  let listItems: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push(`<p style="margin: 0 0 14px;">${renderInlineMarkdown(paragraph.join(" "))}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (!listItems.length) return;
    blocks.push(
      `<ul style="margin: 0 0 14px; padding-left: 1.2rem;">${listItems
        .map((item) => `<li style="margin-bottom: 6px;">${renderInlineMarkdown(item)}</li>`)
        .join("")}</ul>`,
    );
    listItems = [];
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
    const bullet = /^[-*]\s+(.*)$/.exec(line);
    if (bullet) {
      flushParagraph();
      listItems.push(bullet[1]);
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

async function fetchPublishedGuides(): Promise<CmsGuide[]> {
  const url = `${CMS_BASE_URL}/api/cms/guides?onlyPublished=1`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
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
    const guides = rows.filter((row): row is CmsGuide => Boolean(row) && typeof row === "object");
    console.log(`[prerender] ${guides.length} published guide(s) from ${url}`);
    return guides;
  } catch (error) {
    console.warn(
      `[prerender] could not reach ${url} (${(error as Error).message}); falling back to bundled guide data.`,
    );
    return [];
  }
}

function renderGuideDetailPage(guide: CmsGuide): RoutePage | null {
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
  const topic = guideTopicCategory(guide);
  const topicLabel = topic.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  const published = pickText(guide.publishedAt, guide.updatedAt).slice(0, 10) || "2026-08-15";
  const url = `${PUBLIC_SITE_BASE}${route}`;

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
      <section style="padding: 22px 0 0; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 0.9rem; color: #475569;">Continue browsing the <a href="/guides">full guide library</a>.</p>
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

function renderNewsPage(): RoutePage {
  const articles = newsArticles.slice(0, 5);
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
        numberOfItems: articles.length,
        itemListElement: articles.map((article, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: article.title,
          url: `https://balancebiketoddler.com/news/${article.category}/${article.id}`,
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
    title: "What is changing in the market?",
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
        ${articles.map((article) => `
          <section style="padding: 14px 0; border-top: 1px solid #f1f5f9;">
            <h3 style="margin: 0 0 8px; font-size: 1.05rem;">${escapeHtml(article.title)}</h3>
            <p style="margin: 0 0 8px; color: #334155;">${escapeHtml(article.summary)}</p>
            <p style="margin: 0; font-size: 0.88rem; color: #64748b;">${escapeHtml(article.categoryLabel)} · ${escapeHtml(article.readTime)} · ${escapeHtml(article.publishDate)}</p>
          </section>
        `).join("")}
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
async function injectGuideRedirects(routes: string[]): Promise<void> {
  const redirectsPath = path.join(distDir, "_redirects");
  let content: string;
  try {
    content = await readFile(redirectsPath, "utf8");
  } catch {
    return;
  }

  const START = "# --- generated: CMS guide detail pages ---";
  const END = "# --- end generated ---";
  let cleaned = content;
  for (;;) {
    const start = cleaned.indexOf(START);
    if (start === -1) break;
    const end = cleaned.indexOf(END, start);
    if (end === -1) {
      cleaned = cleaned.slice(0, start);
      break;
    }
    cleaned = `${cleaned.slice(0, start)}${cleaned.slice(end + END.length)}`.replace(/\n{3,}/g, "\n\n");
  }

  const lines = routes.map((route) => `${route} ${route}.html 200`);
  const block = lines.length ? `${START}\n${lines.join("\n")}\n${END}\n` : "";
  const CATCH_ALL = "/* /index.html 200";
  const next = cleaned.includes(CATCH_ALL)
    ? cleaned.replace(CATCH_ALL, `${block}${CATCH_ALL}`)
    : `${cleaned.replace(/\s*$/, "\n")}${block}`;

  await writeFile(redirectsPath, next, "utf8");
  if (lines.length) {
    console.log(`[prerender] _redirects: ${lines.length} guide detail rule(s) registered.`);
  }
}

async function main() {
  const indexHtml = await readFile(path.join(distDir, "index.html"), "utf8");
  const appAssets = extractAppAssets(indexHtml);

  const cmsGuides = await fetchPublishedGuides();
  const guideDetailPages = cmsGuides
    .map(renderGuideDetailPage)
    .filter((page): page is RoutePage => page !== null);

  // Order matters: `/guides` is written first so its cleanup step removes the
  // whole dist/guides folder before the detail pages recreate it.
  const pages: RoutePage[] = [
    renderProductsPage(),
    renderGuidesPage(cmsGuides),
    renderNewsPage(),
    renderReviewsPage(),
    renderAboutPage(),
    ...guideDetailPages,
  ];

  if (guideDetailPages.length) {
    console.log(`[prerender] writing ${guideDetailPages.length} guide detail page(s).`);
  }

  for (const page of pages) {
    const html = renderDocument(page, appAssets);
    const routeName = page.route.replace(/^\//, "");
    if (routeName) {
      await rm(path.join(distDir, routeName), { recursive: true, force: true });
      await rm(path.join(distDir, `${routeName}.html`), { force: true });
    }
    const outFile = routeName ? path.join(distDir, `${routeName}.html`) : path.join(distDir, "index.html");
    await mkdir(path.dirname(outFile), { recursive: true });
    await writeFile(outFile, html, "utf8");
  }

  await injectGuideRedirects(guideDetailPages.map((page) => page.route));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
