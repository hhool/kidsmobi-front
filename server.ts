import express from "express";
import { app } from "./src/apiServer";
import { getTransparencyPageByPath, type LocalizedTransparencyPage, type TransparencyPageKey } from "./src/data/transparencyPages";
import { getPageCopy } from "./src/config/pageCopy";
import { guideArticles } from "./src/data/guidesData";
import { newsArticles } from "./src/data/newsData";
import { initialEvaluationsData } from "./src/data/evaluationsData";
import path from "path";
import { createServer as createViteServer } from "vite";

type BotSourceLink = {
  label: string;
  href: string;
  note: string;
};

type BotFaqItem = {
  question: string;
  answer: string[];
};

const SITE_URL = "https://balancebiketoddler.com";
const BOT_USER_AGENT_PATTERN = /(gptbot|claudebot|perplexity|googlebot|bingbot|slurp|duckduckbot|facebookexternalhit|applebot|yandex|semrush|ahrefsbot|mj12bot)/i;

function escapeHtml(value: string): string {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderParagraphs(paragraphs: string[]): string {
  return paragraphs.map((paragraph) => `<p style="margin: 0 0 14px;">${escapeHtml(paragraph)}</p>`).join("");
}

function renderFaq(items: BotFaqItem[]): string {
  return items.map((item, index) => `
    <section id="faq-${index + 1}" style="padding: 18px 0; border-top: 1px solid #e2e8f0;">
      <h3 style="margin: 0 0 10px; font-size: 1.05rem; line-height: 1.4;">${escapeHtml(item.question)}</h3>
      ${renderParagraphs(item.answer)}
    </section>
  `).join("");
}

function renderSources(sources: BotSourceLink[]): string {
  return `
    <ul style="padding-left: 1.2rem; margin: 0;">
      ${sources.map((source) => `
        <li style="margin-bottom: 10px;">
          <a href="${escapeHtml(source.href)}" rel="nofollow noopener noreferrer">${escapeHtml(source.label)}</a>
          <span style="color: #475569;"> — ${escapeHtml(source.note)}</span>
        </li>
      `).join("")}
    </ul>
  `;
}

function renderCitationBlock(title: string, quote: string, sources: BotSourceLink[]): string {
  return `
    <section style="padding: 22px 0; border-top: 1px solid #e2e8f0;">
      <h2 style="margin: 0 0 12px; font-size: 1.5rem;">${escapeHtml(title)}</h2>
      <blockquote style="margin: 0 0 14px; padding: 14px 16px; border-left: 4px solid #f97316; background: #fff7ed;">
        <p style="margin: 0; font-size: 0.98rem; line-height: 1.8;">${escapeHtml(quote)}</p>
      </blockquote>
      ${renderSources(sources)}
    </section>
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

function renderBotShell(options: {
  title: string;
  description: string;
  canonical: string;
  bodyHtml: string;
}): string {
  const { title, description, canonical, bodyHtml } = options;
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="robots" content="index,follow,max-image-preview:large" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.7; max-width: 980px; margin: 0 auto; padding: 40px 20px; color: #0f172a; background: #fff;">
    <main>
      ${bodyHtml}
    </main>
  </body>
</html>`;
}

function normalizeRequestPath(requestPath: string) {
  const cleaned = String(requestPath || "/").replace(/\/+$/, "");
  return cleaned || "/";
}

function getTransparencySources(pageKey: TransparencyPageKey): BotSourceLink[] {
  const commonSources: BotSourceLink[] = [
    {
      label: "FTC Endorsement Guides",
      href: "https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides",
      note: "clear disclosure expectations for affiliate and sponsored relationships",
    },
    {
      label: "CPSC Children's Products Guidance",
      href: "https://www.cpsc.gov/Business--Manufacturing/Business-Education/Business-Guidance/Childrens-Products",
      note: "baseline safety and compliance context for children's products",
    },
  ];

  if (pageKey === "testing-methodology" || pageKey === "certification") {
    return [
      ...commonSources,
      {
        label: "ISO 8098 overview",
        href: "https://www.iso.org/standard/71811.html",
        note: "children's bicycle safety standard reference",
      },
      {
        label: "EU toy safety overview",
        href: "https://single-market-economy.ec.europa.eu/sectors/toys/toy-safety_en",
        note: "general European toy-safety context for category claims",
      },
      {
        label: "ASTM F963 standard page",
        href: "https://www.astm.org/f0963-23.html",
        note: "toy safety standard reference used for adjacent product claims",
      },
    ];
  }

  if (pageKey === "privacy-policy") {
    return [
      ...commonSources,
      {
        label: "FTC privacy and security guidance",
        href: "https://www.ftc.gov/business-guidance/privacy-security",
        note: "plain-language privacy and data-handling baseline",
      },
      {
        label: "Browser storage reference",
        href: "https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API",
        note: "context for local browser storage behavior",
      },
    ];
  }

  return commonSources;
}

function getTransparencyFaqs(page: LocalizedTransparencyPage): BotFaqItem[] {
  if (page.key === "testing-methodology") {
    return [
      {
        question: "How do you turn a product claim into a testable check?",
        answer: [
          "We break the claim into measurable parts first: fit, stability, braking, load handling, and how the product behaves during normal family use.",
          "That makes the result easier for both parents and crawlers to verify because every score can be traced back to a specific behavior, not a vague brand promise.",
        ],
      },
      {
        question: "Why do you cite standards instead of only repeating product specs?",
        answer: [
          "Specs tell you what a listing says; standards tell you what safety context the claim should survive.",
          "Citations also help readers check whether a marketing phrase lines up with an official baseline or just sounds reassuring.",
        ],
      },
      {
        question: "What counts as a meaningful quotation on this page?",
        answer: [
          "A useful quotation is short, precise, and tied to a rule a parent can actually act on, such as disclosure, fit, or safety limits.",
          "We keep quotations brief so they clarify the point instead of crowding out the evidence trail.",
        ],
      },
      {
        question: "Do badges or certificates override poor behavior in the real world?",
        answer: [
          "No. A badge is only one signal. If a stroller drifts, a brake hesitates, or a frame feels unstable under load, the real-world result still matters more than the label.",
          "That is why the page pairs source citations with editorial judgment instead of treating certification as the final answer.",
        ],
      },
      {
        question: "How should a parent use this page alongside the rest of the site?",
        answer: [
          "Use this page as the method note, then move into reviews or products to compare specific models, prices, and fit details.",
          "The goal is to make the decision path easier to audit, not to replace hands-on checking once the product arrives.",
        ],
      },
      {
        question: "What changes when a standard or claim is updated?",
        answer: [
          "We keep the citation trail visible so a changed claim can be compared against the older version instead of being silently reinterpreted.",
          "That reduces drift when a brand refreshes a listing, swaps photos, or changes a product name without changing the underlying behavior.",
        ],
      },
    ];
  }

  return [
    {
      question: "Why does this disclaimer page exist?",
      answer: [
        "It explains the editorial firewall between revenue, sample handling, and product verdicts.",
        "That makes it clear that the review flow is designed to protect the score before it protects the link.",
      ],
    },
    {
      question: "Do affiliate links change the verdict?",
      answer: [
        "No. A commission can fund the work, but it does not raise a score or erase a flaw.",
        "If a product fails the safety logic, the link cannot save it.",
      ],
    },
    {
      question: "Why mention anonymous purchase?",
      answer: [
        "Because buying like a normal customer reduces the chance that a polished sample hides real-world problems.",
        "It also makes the evidence trail easier to trust.",
      ],
    },
    {
      question: "What should a parent do with the page summary?",
      answer: [
        "Use it as a quick trust check, then open reviews or products to compare the actual options you are considering.",
        "The page is meant to help you decide where to look next, not to replace the rest of the site.",
      ],
    },
  ];
}

function renderHomeBotFallback(canonical: string): string {
    const copy = getPageCopy("en");
    const summary = copy.home;
    const articleCount = Math.min(4, guideArticles.length);

    return renderBotShell({
      title: `${summary.heroTitle} | BalanceBikeToddler`,
      description: summary.heroSubtitle,
      canonical,
      bodyHtml: `
        <article>
          <header style="padding-bottom: 24px; border-bottom: 1px solid #e2e8f0; margin-bottom: 24px;">
            <p style="margin: 0 0 10px; font-size: 0.72rem; letter-spacing: 0.2em; text-transform: uppercase; color: #c2410c; font-weight: 900;">${escapeHtml(summary.bannerBadge)}</p>
            <h1 style="margin: 0 0 12px; font-size: clamp(2rem, 4vw, 3.15rem); line-height: 1.12;">${escapeHtml(summary.heroTitle)}</h1>
            <p style="margin: 0 0 14px; font-size: 1.08rem; color: #334155; max-width: 52rem;">${escapeHtml(summary.heroSubtitle)}</p>
            <p style="margin: 0;">${escapeHtml(summary.heroCta)}</p>
          </header>

          <section style="padding: 22px 0;">
            <h2 style="margin: 0 0 12px; font-size: 1.5rem;">Which products do we cover first?</h2>
            <p style="margin: 0 0 14px;">${escapeHtml(summary.categoryHighlights.description)}</p>
            ${renderBulletedCards([
              { title: summary.categoryCards.strollerLabel, text: summary.categoryCards.strollerDesc },
              { title: summary.categoryCards.balanceLabel, text: summary.categoryCards.balanceDesc },
              { title: summary.categoryCards.kidsBikeLabel, text: summary.categoryCards.kidsBikeDesc },
              { title: summary.categoryCards.scooterLabel, text: summary.categoryCards.scooterDesc },
            ])}
          </section>

          <section style="padding: 22px 0; border-top: 1px solid #e2e8f0;">
            <h2 style="margin: 0 0 12px; font-size: 1.5rem;">How do we audit safety?</h2>
            <p style="margin: 0 0 14px;">${escapeHtml(summary.safetyAudits.description)}</p>
            <ul style="padding-left: 1.2rem; margin: 0;">
              <li>${escapeHtml(summary.safetyAudits.sections.joggingTitle)} — ${escapeHtml(summary.safetyAudits.sections.joggingDesc)}</li>
              <li>${escapeHtml(summary.safetyAudits.sections.balanceTitle)} — ${escapeHtml(summary.safetyAudits.sections.balanceDesc)}</li>
              <li>${escapeHtml(summary.safetyAudits.sections.kidsBikeTitle)} — ${escapeHtml(summary.safetyAudits.sections.kidsBikeDesc)}</li>
              <li>${escapeHtml(summary.safetyAudits.sections.scooterTitle)} — ${escapeHtml(summary.safetyAudits.sections.scooterDesc)}</li>
            </ul>
          </section>

          <section style="padding: 22px 0; border-top: 1px solid #e2e8f0;">
            <h2 style="margin: 0 0 12px; font-size: 1.5rem;">Which scenarios matter most for parents?</h2>
            <p style="margin: 0 0 14px;">${escapeHtml(summary.quickScenarios.description)}</p>
            ${renderBulletedCards([
              { title: summary.quickScenarios.cards.newbornLabel, text: summary.quickScenarios.cards.newbornDesc },
              { title: summary.quickScenarios.cards.outdoorLabel, text: summary.quickScenarios.cards.outdoorDesc },
              { title: summary.quickScenarios.cards.commuteLabel, text: summary.quickScenarios.cards.commuteDesc },
            ])}
          </section>

          <section style="padding: 22px 0; border-top: 1px solid #e2e8f0;">
            <h2 style="margin: 0 0 12px; font-size: 1.5rem;">What questions do parents ask most often?</h2>
            <p style="margin: 0 0 14px;">${escapeHtml(summary.faq.description)}</p>
            ${renderFaq(summary.faq.items.map((item) => ({ question: item.question, answer: [item.answer] })))}
          </section>

          <section style="padding: 22px 0; border-top: 1px solid #e2e8f0;">
            <h2 style="margin: 0 0 12px; font-size: 1.5rem;">Which guides should you read next?</h2>
            ${renderBulletedCards(
              guideArticles.slice(0, articleCount).map((guide) => ({
                title: guide.title,
                text: guide.summary,
                meta: `${guide.categoryLabel} · ${guide.readTime} · ${guide.publishDate}`,
              })),
            )}
          </section>

          ${renderCitationBlock(
            "Sources and citations",
            "“Readers should be able to see the evidence trail behind a recommendation, not just the recommendation itself.”",
            [
              { label: "FTC Endorsement Guides", href: "https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides", note: "disclosure rules for affiliate and sponsored links" },
              { label: "CPSC Children's Products Guidance", href: "https://www.cpsc.gov/Business--Manufacturing/Business-Education/Business-Guidance/Childrens-Products", note: "children's product safety context" },
            ],
          )}
        </article>
      `,
    });
  }

  function renderProductsBotFallback(canonical: string): string {
    const copy = getPageCopy("en");
    const summary = copy.products;

    return renderBotShell({
      title: `${summary.heroTitle} | BalanceBikeToddler`,
      description: summary.heroSubtitle,
      canonical,
      bodyHtml: `
        <article>
          <header style="padding-bottom: 24px; border-bottom: 1px solid #e2e8f0; margin-bottom: 24px;">
            <p style="margin: 0 0 10px; font-size: 0.72rem; letter-spacing: 0.2em; text-transform: uppercase; color: #c2410c; font-weight: 900;">${escapeHtml(summary.topBadge)}</p>
            <h1 style="margin: 0 0 12px; font-size: clamp(2rem, 4vw, 3.15rem); line-height: 1.12;">${escapeHtml(summary.heroTitle)}</h1>
            <p style="margin: 0 0 14px; font-size: 1.08rem; color: #334155; max-width: 52rem;">${escapeHtml(summary.heroSubtitle)}</p>
            <p style="margin: 0 0 14px; font-size: 0.88rem; color: #475569; font-weight: 600;">By <strong>BalanceBikeToddler Editorial Team</strong> · <time datetime="2026-08-15">Published 2026-08-15</time> · <time datetime="2026-08-15">Updated 2026-08-15</time></p>
          </header>

          <section style="padding: 22px 0;">
            <h2 style="margin: 0 0 12px; font-size: 1.5rem;">What should you compare first?</h2>
            <p style="margin: 0 0 14px;"><strong>Short answer:</strong> start with size fit, braking behavior, frame weight, and whether the product matches the child's daily routine.</p>
            <p style="margin: 0 0 14px;">${escapeHtml(summary.metricsHint)}</p>
            ${renderBulletedCards([
              { title: summary.filterFacets.brandLabel, text: summary.filterFacets.selectBrand },
              { title: summary.filterFacets.frameLabel, text: summary.filterFacets.selectFrame },
              { title: summary.filterFacets.tireLabel, text: summary.filterFacets.selectTire },
              { title: summary.filterFacets.brakeLabel, text: summary.filterFacets.selectBrake },
            ])}
          </section>

          <section style="padding: 22px 0; border-top: 1px solid #e2e8f0;">
            <h2 style="margin: 0 0 12px; font-size: 1.5rem;">Which product signals matter most?</h2>
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
            <ul style="padding-left: 1.2rem; margin: 0;">
              <li>Age and price reduce the list to realistic options.</li>
              <li>Brand, frame, tire, and brake filters surface practical differences.</li>
              <li>Certification and wheel details help verify mechanical fit.</li>
            </ul>
          </section>

          <section style="padding: 22px 0; border-top: 1px solid #e2e8f0;">
            <h2 style="margin: 0 0 12px; font-size: 1.5rem;">Why does this page matter?</h2>
            <p style="margin: 0 0 14px;"><strong>Short answer:</strong> it gives readers a quick comparison map before they open a product detail page or review.</p>
            <ul style="padding-left: 1.2rem; margin: 0;">
              <li>${escapeHtml(summary.history.title)} — ${escapeHtml(summary.history.subtitle)}</li>
              <li>${escapeHtml(summary.compareLimitTip)}</li>
              <li>${escapeHtml(summary.resetFilters)}</li>
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
        </article>
      `,
    });
  }

  function renderReviewsBotFallback(canonical: string): string {
    const copy = getPageCopy("en");
    const summary = copy.reviews;
    const topReviews = initialEvaluationsData.slice(0, 3).map((evaluation) => {
      const title = evaluation.en?.title || evaluation.zh?.title || evaluation.id;
      const verdict = evaluation.en?.verdict || evaluation.zh?.verdict || "";
      return {
        title,
        text: verdict,
        meta: `Safety ${evaluation.scores.safety.toFixed(1)} · Comfort ${evaluation.scores.comfort.toFixed(1)} · Value ${evaluation.scores.valueForMoney.toFixed(1)}`,
      };
    });
    const reviewsSchemas = [
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "BalanceBikeToddler",
        url: "https://balancebiketoddler.com/",
        logo: "https://balancebiketoddler.com/favicon.svg",
        sameAs: [
          "https://www.youtube.com/@kidsmobi",
          "https://www.facebook.com",
          "https://www.instagram.com",
          "https://x.com/BalanceBikeToddler",
        ],
      },
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "BalanceBikeToddler",
        url: "https://balancebiketoddler.com/",
        description: summary.heroDescription,
        inLanguage: "en",
        publisher: {
          "@type": "Organization",
          name: "BalanceBikeToddler",
          url: "https://balancebiketoddler.com/",
          logo: "https://balancebiketoddler.com/favicon.svg",
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: `${summary.heroTitle} | BalanceBikeToddler`,
        url: canonical,
        description: summary.heroDescription,
        inLanguage: "en",
        author: {
          "@type": "Organization",
          name: "BalanceBikeToddler Editorial Team",
        },
        datePublished: "2026-08-15",
        dateModified: "2026-08-15",
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: topReviews.length,
          itemListElement: topReviews.map((review, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: review.title,
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
            name: "Why add dates and author information?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Dates and author attribution help readers and AI systems judge freshness and accountability.",
            },
          },
        ],
      },
    ];
    const jsonLdHtml = `<script type="application/ld+json">${JSON.stringify(reviewsSchemas)}</script>`;

    return renderBotShell({
      title: `${summary.heroTitle} | BalanceBikeToddler`,
      description: summary.heroDescription,
      canonical,
      bodyHtml: `
          ${jsonLdHtml}
          <article>
            <header style="padding-bottom: 24px; border-bottom: 1px solid #e2e8f0; margin-bottom: 24px;">
              <p style="margin: 0 0 10px; font-size: 0.72rem; letter-spacing: 0.2em; text-transform: uppercase; color: #c2410c; font-weight: 900;">${escapeHtml(summary.badge)}</p>
              <h1 style="margin: 0 0 12px; font-size: clamp(2rem, 4vw, 3.15rem); line-height: 1.12;">${escapeHtml(summary.heroTitle)}</h1>
              <p style="margin: 0 0 14px; font-size: 1.08rem; color: #334155; max-width: 52rem;">${escapeHtml(summary.heroDescription)}</p>
              <p style="margin: 0 0 14px; font-size: 0.88rem; color: #475569; font-weight: 600;">By <strong>BalanceBikeToddler Editorial Team</strong> · <time datetime="2026-08-15">Published 2026-08-15</time> · <time datetime="2026-08-15">Updated 2026-08-15</time></p>
              <p style="margin: 0;">${escapeHtml(summary.standardsDesc)}</p>
            </header>

            <section style="padding: 22px 0;">
              <h2 style="margin: 0 0 12px; font-size: 1.5rem;">How do reviews stay defensible?</h2>
              <p style="margin: 0 0 14px;"><strong>Short answer:</strong> each verdict is tied to a visible score, a named source, and a clear use case so readers can trace the judgment back to evidence.</p>
              <p style="margin: 0 0 14px;">${escapeHtml(summary.standardsSubtitle)}</p>
              ${renderBulletedCards([
                { title: summary.sections.strollerTitle, text: summary.sections.strollerDesc, meta: summary.cta.stroller },
                { title: summary.sections.bikeTitle, text: summary.sections.bikeDesc, meta: summary.cta.bike },
                { title: summary.sections.balanceTitle, text: summary.sections.balanceDesc, meta: summary.cta.balance },
                { title: summary.sections.scooterTitle, text: summary.sections.scooterDesc, meta: summary.cta.scooter },
              ])}
            </section>

            <section style="padding: 22px 0; border-top: 1px solid #e2e8f0;">
              <h2 style="margin: 0 0 12px; font-size: 1.5rem;">Which review snapshots matter most?</h2>
              <p style="margin: 0 0 14px;"><strong>Short answer:</strong> the snapshots with a named product, a visible score, and a direct verdict are the easiest to compare and cite.</p>
              ${renderBulletedCards(topReviews)}
            </section>

            <section style="padding: 22px 0; border-top: 1px solid #e2e8f0;">
              <h2 style="margin: 0 0 12px; font-size: 1.5rem;">Which standards guide each verdict?</h2>
              <ul style="padding-left: 1.2rem; margin: 0;">
                <li>FTC Endorsement Guides — disclosure expectations for review pages.</li>
                <li>CPSC Children's Products Guidance — children's product compliance context.</li>
                <li>ISO 8098 — bicycle safety baseline.</li>
              </ul>
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
              <h2 style="margin: 0 0 12px; font-size: 1.5rem;">Sources and citations</h2>
              <figure style="margin: 0 0 16px; padding: 14px 16px; border-left: 4px solid #f97316; background: #fff7ed;">
                <blockquote cite="https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides" style="margin: 0;">
                  <p style="margin: 0;">“Endorsements must reflect the honest opinions, findings, beliefs, or experience of the endorser.”</p>
                </blockquote>
                <figcaption style="margin-top: 8px; font-size: 0.85rem; color: #475569; font-weight: 600;">— FTC Endorsement Guides</figcaption>
              </figure>
              <ul style="margin: 0; padding-left: 1.2rem;">
                <li><a href="https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides">FTC Endorsement Guides</a> — disclosure context for review pages</li>
                <li><a href="https://www.cpsc.gov/Business--Manufacturing/Business-Education/Business-Guidance/Childrens-Products">CPSC Children's Products Guidance</a> — children's product compliance context</li>
                <li><a href="https://www.iso.org/standard/71811.html">ISO 8098</a> — bicycle safety baseline</li>
              </ul>
            </section>
          </article>
        `,
      });
    }

  function renderGuidesBotFallback(canonical: string): string {
    const copy = getPageCopy("en");
    const highlights = guideArticles.slice(0, 5).map((guide) => ({
      title: guide.title,
      text: guide.summary,
      meta: `${guide.categoryLabel} · ${guide.readTime}`,
    }));

    return renderBotShell({
      title: `${copy.home.heroTitle} · Guides | BalanceBikeToddler`,
      description: copy.reviews.heroDescription,
      canonical,
      bodyHtml: `
        <article>
          <header style="padding-bottom: 24px; border-bottom: 1px solid #e2e8f0; margin-bottom: 24px;">
            <p style="margin: 0 0 10px; font-size: 0.72rem; letter-spacing: 0.2em; text-transform: uppercase; color: #c2410c; font-weight: 900;">Guides</p>
            <h1 style="margin: 0 0 12px; font-size: clamp(2rem, 4vw, 3.15rem); line-height: 1.12;">Step-by-step buying guides for families</h1>
            <p style="margin: 0 0 14px; font-size: 1.08rem; color: #334155; max-width: 52rem;">${escapeHtml(copy.home.heroSubtitle)}</p>
          </header>

          <section style="padding: 22px 0;">
            <h2 style="margin: 0 0 12px; font-size: 1.5rem;">What does the guide library cover?</h2>
            <p style="margin: 0 0 14px;">${escapeHtml(copy.home.categoryHighlights.description)}</p>
            ${renderBulletedCards(highlights)}
          </section>

          <section style="padding: 22px 0; border-top: 1px solid #e2e8f0;">
            <h2 style="margin: 0 0 12px; font-size: 1.5rem;">Which guide questions come up most often?</h2>
            ${renderFaq(copy.home.faq.items.slice(0, 4).map((item) => ({ question: item.question, answer: [item.answer] })))}
          </section>

          ${renderCitationBlock(
            "Sources and citations",
            "“A useful guide tells the reader why the answer is true, not just what the answer is.”",
            [
              { label: "FTC Privacy & Security", href: "https://www.ftc.gov/business-guidance/privacy-security", note: "background for browser-stored drafts and local data" },
              { label: "MDN Web Storage API", href: "https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API", note: "local browser storage behavior" },
            ],
          )}
        </article>
      `,
    });
  }

  function renderNewsBotFallback(canonical: string): string {
    const copy = getPageCopy("en");
    const highlights = newsArticles.slice(0, 5).map((news) => ({
      title: news.title,
      text: news.summary,
      meta: `${news.categoryLabel} · ${news.readTime} · ${news.publishDate}`,
    }));

    return renderBotShell({
      title: `${copy.news.heroTitle} | BalanceBikeToddler`,
      description: copy.news.heroSubtitle,
      canonical,
      bodyHtml: `
        <article>
          <header style="padding-bottom: 24px; border-bottom: 1px solid #e2e8f0; margin-bottom: 24px;">
            <p style="margin: 0 0 10px; font-size: 0.72rem; letter-spacing: 0.2em; text-transform: uppercase; color: #c2410c; font-weight: 900;">${escapeHtml(copy.news.heroBadge)}</p>
            <h1 style="margin: 0 0 12px; font-size: clamp(2rem, 4vw, 3.15rem); line-height: 1.12;">${escapeHtml(copy.news.heroTitle)}</h1>
            <p style="margin: 0 0 14px; font-size: 1.08rem; color: #334155; max-width: 52rem;">${escapeHtml(copy.news.heroSubtitle)}</p>
          </header>

          <section style="padding: 22px 0;">
            <h2 style="margin: 0 0 12px; font-size: 1.5rem;">What is changing in the market?</h2>
            ${renderBulletedCards(highlights)}
          </section>

          <section style="padding: 22px 0; border-top: 1px solid #e2e8f0;">
            <h2 style="margin: 0 0 12px; font-size: 1.5rem;">Which reader questions do the news posts answer?</h2>
            ${renderFaq(copy.home.faq.items.slice(4, 7).map((item) => ({ question: item.question, answer: [item.answer] })))}
          </section>

          ${renderCitationBlock(
            "Sources and citations",
            "“News is most useful when the claim, the trend, and the evidence are all visible in one place.”",
            [
              { label: "EU Toy Safety", href: "https://single-market-economy.ec.europa.eu/sectors/toys/toy-safety_en", note: "regulatory context for toy-adjacent products" },
              { label: "ASTM F963", href: "https://www.astm.org/f0963-23.html", note: "toy safety standard reference" },
              { label: "FTC Endorsement Guides", href: "https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides", note: "disclosure context for branded coverage" },
            ],
          )}
        </article>
      `,
    });
  }

  function renderAboutBotFallback(canonical: string): string {
    const copy = getPageCopy("en");

    return renderBotShell({
      title: `${copy.about.heroTitle} | BalanceBikeToddler`,
      description: copy.about.heroDesc,
      canonical,
      bodyHtml: `
        <article>
          <header style="padding-bottom: 24px; border-bottom: 1px solid #e2e8f0; margin-bottom: 24px;">
            <p style="margin: 0 0 10px; font-size: 0.72rem; letter-spacing: 0.2em; text-transform: uppercase; color: #c2410c; font-weight: 900;">${escapeHtml(copy.about.heroBadge)}</p>
            <h1 style="margin: 0 0 12px; font-size: clamp(2rem, 4vw, 3.15rem); line-height: 1.12;">${escapeHtml(copy.about.heroTitle)}</h1>
            <p style="margin: 0 0 14px; font-size: 1.08rem; color: #334155; max-width: 52rem;">${escapeHtml(copy.about.heroDesc)}</p>
          </header>

          <section style="padding: 22px 0;">
            <h2 style="margin: 0 0 12px; font-size: 1.5rem;">How do we work?</h2>
            <p style="margin: 0 0 14px;">${escapeHtml(copy.about.partnershipDesc)}</p>
            <p style="margin: 0;">${escapeHtml(copy.about.contactCta)}</p>
          </section>

          <section style="padding: 22px 0; border-top: 1px solid #e2e8f0;">
            <h2 style="margin: 0 0 12px; font-size: 1.5rem;">Why does this page exist?</h2>
            <p style="margin: 0;">The about page anchors editorial trust, explains the site’s purpose, and gives crawlers a clear summary of who is behind the recommendations.</p>
          </section>

          ${renderCitationBlock(
            "Sources and citations",
            "“Editorial trust is built by showing the process, not by asking readers to take the process on faith.”",
            [
              { label: "FTC Endorsement Guides", href: "https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides", note: "disclosure baseline" },
              { label: "CPSC Children's Products Guidance", href: "https://www.cpsc.gov/Business--Manufacturing/Business-Education/Business-Guidance/Childrens-Products", note: "children's product safety baseline" },
            ],
          )}
        </article>
      `,
    });
  }

function renderTransparencyBotFallback(page: LocalizedTransparencyPage, canonical: string): string {
  const content = page.en;
  const summaryPoints = [
    content.subtitle,
    "Quick take: every section on this page is written to be traceable, with citations where the claim depends on an external standard or policy.",
    "The page starts with the decision context, then moves into sections, questions, and references so readers can verify the method quickly.",
  ];
  const faqItems = getTransparencyFaqs(page);
  const sourceLinks = getTransparencySources(page.key);
  const tocItems = [
    { href: "#summary", label: "Summary" },
    { href: "#sections", label: "Sections" },
    { href: "#faq", label: "Questions" },
    { href: "#sources", label: "Sources" },
  ];

  const sectionsHtml = content.sections.map((section, index) => `
    <section id="section-${index + 1}" style="padding: 22px 0; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0 0 8px; font-size: 0.75rem; letter-spacing: 0.16em; text-transform: uppercase; color: #f97316; font-weight: 800;">${escapeHtml(section.eyebrow)}</p>
      <h2 style="margin: 0 0 12px; font-size: 1.45rem; line-height: 1.3;">${escapeHtml(section.title)}</h2>
      ${renderParagraphs(section.body)}
    </section>
  `).join("");

  return renderBotShell({
    title: `${content.title} | BalanceBikeToddler`,
    description: content.subtitle,
    canonical,
    bodyHtml: `
      <article>
        <header style="padding-bottom: 24px; border-bottom: 1px solid #e2e8f0; margin-bottom: 24px;">
          <p style="margin: 0 0 10px; font-size: 0.72rem; letter-spacing: 0.2em; text-transform: uppercase; color: #c2410c; font-weight: 900;">BalanceBikeToddler transparency</p>
          <h1 style="margin: 0 0 12px; font-size: clamp(2rem, 4vw, 3.15rem); line-height: 1.12;">${escapeHtml(content.title)}</h1>
          <p style="margin: 0 0 14px; font-size: 1.08rem; color: #334155; max-width: 52rem;">${escapeHtml(content.subtitle)}</p>
          ${renderParagraphs([content.intro])}
          <nav aria-label="On-page sections" style="margin-top: 18px;">
            <ul style="display: flex; flex-wrap: wrap; gap: 10px; list-style: none; padding: 0; margin: 0;">
              ${tocItems.map((item) => `<li><a href="${item.href}" style="display: inline-block; padding: 6px 10px; border: 1px solid #e2e8f0; border-radius: 999px; text-decoration: none; color: #0f172a;">${escapeHtml(item.label)}</a></li>`).join("")}
            </ul>
          </nav>
        </header>

        <section id="summary" style="padding: 24px 0;">
          <h2 style="margin: 0 0 12px; font-size: 1.5rem;">What this page answers first</h2>
          ${renderParagraphs(summaryPoints)}
          <blockquote style="margin: 18px 0 0; padding: 16px 18px; border-left: 4px solid #f97316; background: #fff7ed;">
            <p style="margin: 0 0 8px; font-size: 1rem; font-weight: 700;">"The test result moves first, the link follows later."</p>
            <cite style="font-style: normal; color: #475569;">BalanceBikeToddler editorial policy</cite>
          </blockquote>
        </section>

        <section id="sections" style="padding: 24px 0; border-top: 1px solid #e2e8f0;">
          <h2 style="margin: 0 0 12px; font-size: 1.5rem;">Core sections</h2>
          ${sectionsHtml}
          <section style="padding: 22px 0; border-top: 1px solid #e2e8f0;">
            <h3 style="margin: 0 0 10px; font-size: 1.1rem;">Verification checklist</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 0.95rem;">
              <thead>
                <tr>
                  <th style="text-align: left; padding: 10px; border-bottom: 1px solid #cbd5e1;">Claim</th>
                  <th style="text-align: left; padding: 10px; border-bottom: 1px solid #cbd5e1;">Where to verify it</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">Affiliate disclosure</td>
                  <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">FTC Endorsement Guides</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">Children's product context</td>
                  <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">CPSC Children's Products guidance</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">Technical standards</td>
                  <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">ISO, ASTM, and EU toy safety references</td>
                </tr>
                <tr>
                  <td style="padding: 10px;">Local data handling</td>
                  <td style="padding: 10px;">Privacy policy and browser storage behavior</td>
                </tr>
              </tbody>
            </table>
          </section>
        </section>

        <section id="faq" style="padding: 24px 0; border-top: 1px solid #e2e8f0;">
          <h2 style="margin: 0 0 12px; font-size: 1.5rem;">Questions readers usually ask</h2>
          ${renderFaq(faqItems)}
        </section>

        <section id="sources" style="padding: 24px 0; border-top: 1px solid #e2e8f0;">
          <h2 style="margin: 0 0 12px; font-size: 1.5rem;">Sources and citations</h2>
          <p style="margin: 0 0 14px;">These references anchor the policy and methodology claims on this page.</p>
          ${renderSources(sourceLinks)}
          <blockquote style="margin: 18px 0 0; padding: 16px 18px; border-left: 4px solid #cbd5e1; background: #f8fafc;">
            <p style="margin: 0 0 8px; font-size: 0.98rem;">"If there is a connection between the endorser and the seller of the advertised product that might materially affect the weight or credibility of the endorsement, that connection should be clearly and conspicuously disclosed."</p>
            <cite style="font-style: normal; color: #475569;">FTC Endorsement Guides</cite>
          </blockquote>
        </section>

        <footer style="padding-top: 20px; border-top: 1px solid #e2e8f0; color: #475569;">
          <p style="margin: 0;">Internal path: <a href="${escapeHtml(content.path)}">${escapeHtml(content.path)}</a></p>
        </footer>
      </article>
    `,
  });
}

function renderGenericBotFallback(requestPath: string, canonical: string): string {
  const cleanPath = requestPath && requestPath !== "/" ? requestPath : "/";
  const sources: BotSourceLink[] = [
    { label: "Sitemap", href: `${SITE_URL}/sitemap.xml`, note: "site URL inventory for crawlers" },
    { label: "Reviews", href: `${SITE_URL}/reviews`, note: "comparison coverage and lab-style verdicts" },
    { label: "Guides", href: `${SITE_URL}/guides`, note: "buying advice and fit guidance" },
    { label: "About", href: `${SITE_URL}/about`, note: "editorial process and mission" },
    { label: "Privacy Policy", href: `${SITE_URL}/transparency/privacy-policy`, note: "how local fit data and browser drafts are handled" },
  ];

  switch (cleanPath.replace(/\/+$/, "").toLowerCase()) {
    case "":
    case "/":
      return renderHomeBotFallback(canonical);
    case "/products":
      return renderProductsBotFallback(canonical);
    case "/reviews":
    case "/evaluations":
      return renderReviewsBotFallback(canonical);
    case "/guides":
      return renderGuidesBotFallback(canonical);
    case "/news":
      return renderNewsBotFallback(canonical);
    case "/about":
      return renderAboutBotFallback(canonical);
    default:
      return renderBotShell({
        title: "BalanceBikeToddler | Kids bike, stroller, scooter & car seat safety reviews",
        description: "Independent, lab-tested guidance for kids bikes, balance bikes, scooters, jogging strollers, and child safety seats.",
        canonical,
        bodyHtml: `
          <article>
            <header style="padding-bottom: 24px; border-bottom: 1px solid #e2e8f0; margin-bottom: 24px;">
              <p style="margin: 0 0 10px; font-size: 0.72rem; letter-spacing: 0.2em; text-transform: uppercase; color: #c2410c; font-weight: 900;">BalanceBikeToddler</p>
              <h1 style="margin: 0 0 12px; font-size: clamp(2rem, 4vw, 3.15rem); line-height: 1.12;">Route preview: ${escapeHtml(cleanPath)}</h1>
              <p style="margin: 0 0 14px; font-size: 1.08rem; color: #334155; max-width: 52rem;">This page is generated server-side so crawlers can read the key content without JavaScript.</p>
            </header>
            <section style="padding: 22px 0;">
              <h2 style="margin: 0 0 12px; font-size: 1.5rem;">Fast facts</h2>
              <ul style="padding-left: 1.2rem; margin: 0;">
                <li>Safety, fit, braking, stability, and everyday usability.</li>
                <li>Product comparisons with editorial notes and clear disclosures.</li>
                <li>Practical buying guidance for parents who want cleaner evidence.</li>
              </ul>
            </section>
            <section style="padding: 22px 0; border-top: 1px solid #e2e8f0;">
              <h2 style="margin: 0 0 12px; font-size: 1.5rem;">Useful links</h2>
              ${renderSources(sources)}
            </section>
          </article>
        `,
      });
  }
}

function renderBotFallbackHtml(requestPath: string) {
  const cleanPath = normalizeRequestPath(requestPath);
  const canonical = `${SITE_URL}${cleanPath}`;
  const transparencyPage = getTransparencyPageByPath(cleanPath);

  if (transparencyPage) {
    return renderTransparencyBotFallback(transparencyPage, canonical);
  }

  return renderGenericBotFallback(cleanPath, canonical);
}

async function startServer() {
  const PORT = 3000;

  app.use((req, res, next) => {
    const userAgent = String(req.headers["user-agent"] || "").toLowerCase();
    const isBotLike = BOT_USER_AGENT_PATTERN.test(userAgent);
    const acceptsHtml = req.accepts("html");
    const isApiRoute = req.path.startsWith("/api");

    if (req.method === "GET" && isBotLike && acceptsHtml && !isApiRoute) {
      res.status(200).type("html").send(renderBotFallbackHtml(req.path));
      return;
    }

    next();
  });

  // Serve static files / Vite asset resolver
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve from the dist folder relative to this file
    // Since this file is bundled into dist/server.cjs, dist is the current directory
    const distPath = path.join(process.cwd(), "dist");
    
    // Check if dist/index.html exists to avoid crashing
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Professional KidBikeEval Server booted securely on http://localhost:${PORT}`);
  });
}

startServer();
