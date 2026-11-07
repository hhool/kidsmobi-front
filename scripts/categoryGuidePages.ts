/**
 * Prerender bodies for the 20 new category guide pages (pillar / cluster /
 * comparison). Mirrors the family-page pattern: one module returns the static
 * HTML for every page, and the prose lives in src/data/categoryGuides.ts so the
 * SPA component and this script read from one source.
 *
 * The HTML skeleton is shared (eyebrow chip, h1, lead, sections, related-guides
 * nav, byline footer). The prose inside is NOT shared — each guide carries its
 * own topic text, which is what keeps check-topic-pair-drift quiet across the
 * 20 pages and against the existing 442.
 *
 * The byline footer carries class="byline" so the R-424 author audit passes on
 * the prerendered HTML (the same rule the SPA footer follows).
 */
import { CATEGORY_GUIDE_LIST, type CategoryGuide } from "../src/data/categoryGuides";

const ORIGIN = "https://balancebiketoddler.com";

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export interface CategoryGuideRoutePage {
  route: string;
  title: string;
  description: string;
  body: string;
  keywords: string[];
  h1En: string;
  skipTitleH1: boolean;
  jsonLd: Array<Record<string, unknown>>;
}

function bodyFor(g: CategoryGuide): string {
  const sections = g.sections
    .map(
      (s) => `
      <section style="margin-top:32px;">
        <h2 style="font-size:22px;font-weight:900;color:#0f172a;margin:0 0 12px;line-height:1.3;">${esc(s.heading)}</h2>
        ${s.paragraphs
          .map(
            (p) =>
              `<p style="font-size:15px;line-height:1.8;color:#334155;margin:0 0 12px;max-width:48rem;">${esc(p)}</p>`,
          )
          .join("\n")}
      </section>`,
    )
    .join("\n");

  const links = g.internalLinks
    .map(
      (href) =>
        `<li style="margin:0;"><a href="${esc(href)}" style="display:inline-block;border:1px solid #e2e8f0;background:#fff;border-radius:999px;padding:4px 12px;font-size:13px;color:#ea580c;text-decoration:none;">${esc(href)}</a></li>`,
    )
    .join("\n");

  return `
  <header style="padding-bottom:28px;border-bottom:1px solid #e2e8f0;">
    <a href="/" style="display:block;font-size:11px;font-weight:700;letter-spacing:.04em;color:#ea580c;text-decoration:none;margin-bottom:10px;">Toddler first-wheels family</a>
    <div style="display:inline-block;border:1px solid #bae6fd;background:#f0f9ff;border-radius:999px;padding:4px 12px;font-size:10px;font-weight:900;letter-spacing:.2em;text-transform:uppercase;color:#0284c7;margin-bottom:14px;">${esc(g.eyebrow)}</div>
    <h1 style="font-size:30px;font-weight:900;color:#020617;line-height:1.2;margin:0 0 14px;max-width:48rem;">${esc(g.h1)}</h1>
    <p style="font-size:16px;line-height:1.8;color:#475569;font-weight:500;margin:0;max-width:48rem;">${esc(g.lead)}</p>
  </header>
  <p style="font-size:15px;line-height:1.8;color:#334155;margin:28px 0 0;max-width:48rem;">${esc(g.intro)}</p>
  ${sections}
  <nav aria-label="Related guides" style="margin-top:36px;padding:20px;border:1px solid #e2e8f0;border-radius:16px;background:#fff;">
    <h2 style="font-size:12px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;color:#64748b;margin:0 0 12px;">Related guides</h2>
    <ul style="list-style:none;display:flex;flex-wrap:wrap;gap:8px;margin:0;padding:0;">${links}</ul>
  </nav>
  <footer style="margin-top:36px;padding-top:24px;border-top:1px solid #e2e8f0;">
    <p class="byline" style="font-size:13px;color:#64748b;margin:0;">
      Content by <a href="/transparency/editorial-team/" style="color:#ea580c;text-decoration:none;">BalanceBikeToddler Editorial Team</a>
    </p>
    ${
      g.draft
        ? `<p style="font-size:12px;color:#b45309;margin:8px 0 0;">Draft copy — authored by ${esc(g.author)}, pending editorial review.</p>`
        : ""
    }
  </footer>`;
}

export function renderCategoryGuidePages(): CategoryGuideRoutePage[] {
  return CATEGORY_GUIDE_LIST.map((g) => ({
    route: g.route,
    title: g.title,
    description: g.description,
    keywords: g.keywords,
    h1En: g.h1,
    skipTitleH1: true,
    body: bodyFor(g),
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: g.title,
        url: `${ORIGIN}${g.route}`,
        description: g.description,
        inLanguage: "en",
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${ORIGIN}/` },
          { "@type": "ListItem", position: 2, name: g.h1, item: `${ORIGIN}${g.route}` },
        ],
      },
    ],
  }));
}
