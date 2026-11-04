import { sectionFaqsFor, type PageFaq } from "../lib/pageFaq";

/**
 * The visible Q&A for a section page.
 *
 * The site has two renderers for the same URL: scripts/prerender-pages.ts
 * writes the static HTML a crawler fetches, and this component is what a
 * reader sees after hydration (the app mounts with createRoot(), so the SPA
 * IS the live page — the prerendered markup is discarded).
 *
 * The FAQPage schema those pages publish is built from the same pairs
 * (src/lib/pageFaq.ts), so a question in the schema is a question a reader
 * can find on the page. G4 row 17 asks exactly that.
 */
export default function SectionFaq({
  route,
  lang,
  faqs,
}: {
  route: string;
  lang: "en" | "zh";
  /** Explicit list; defaults to the whole set for the route. */
  faqs?: PageFaq[];
}) {
  const list = faqs ?? sectionFaqsFor(route, lang);
  if (!list || !list.length) return null;
  return (
    <section className="space-y-4" aria-label={lang === "zh" ? "常见问题" : "Frequently asked questions"}>
      {list.map((faq) => (
        <div
          key={faq.q}
          className="rounded-[32px] border border-slate-100 bg-white p-7 sm:p-8 shadow-sm space-y-2"
        >
          <h3 className="km-section-title text-slate-900">{faq.q}</h3>
          <p className="km-body-copy text-sm text-slate-500 font-medium leading-relaxed">{faq.a}</p>
        </div>
      ))}
    </section>
  );
}
