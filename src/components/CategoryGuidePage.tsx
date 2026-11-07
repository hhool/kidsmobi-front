/**
 * Renders one of the 20 new category guide pages (pillar / cluster /
 * comparison). Driven entirely by data/categoryGuides.ts so the SPA and the
 * prerender script share one source of truth.
 *
 * English-only draft content for now (the data module carries en copy; a zh
 * variant is a later phase). The footer carries class="byline" so the R-424
 * author audit passes on the hydrated page as well as the prerendered HTML.
 */
import type { CategoryGuide } from "../data/categoryGuides";

export function CategoryGuidePage({
  guide,
  lang,
}: {
  guide: CategoryGuide;
  lang: "zh" | "en";
}) {
  // Content is English-only in this phase; lang is accepted for parity with the
  // other page components but the draft copy is en.
  void lang;

  return (
    <article className="max-w-5xl mx-auto py-8 sm:py-14 text-left px-4 sm:px-6">
      <div className="space-y-10">
        <header className="space-y-5 border-b border-slate-200 pb-8">
          <a href="/" className="block text-[11px] font-bold tracking-[0.04em] text-orange-600 no-underline mb-2.5">
            Toddler first-wheels family
          </a>
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-sky-600">
            {guide.eyebrow}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-950 leading-tight max-w-4xl">
            {guide.h1}
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-8 font-medium max-w-3xl">
            {guide.lead}
          </p>
        </header>

        <p className="text-base text-slate-700 leading-8 max-w-3xl">{guide.intro}</p>

        {guide.sections.map((s, i) => (
          <section key={i} className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">{s.heading}</h2>
            {s.paragraphs.map((p, j) => (
              <p key={j} className="text-base text-slate-700 leading-8 max-w-3xl">
                {p}
              </p>
            ))}
          </section>
        ))}

        <nav aria-label="Related guides" className="rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-500 mb-3">
            Related guides
          </h2>
          <ul className="flex flex-wrap gap-2">
            {guide.internalLinks.map((href) => (
              <li key={href}>
                <a
                  href={href}
                  className="inline-block rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-orange-600 hover:underline"
                >
                  {href}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <footer className="space-y-3 border-t border-slate-200 pt-8">
          <p className="byline text-sm text-slate-500">
            Content by{" "}
            <a href="/transparency/editorial-team/" className="text-orange-600 hover:underline">
              BalanceBikeToddler Editorial Team
            </a>
          </p>
          {guide.draft ? (
            <p className="text-xs text-amber-600">
              Draft copy — authored by {guide.author}, pending editorial review.
            </p>
          ) : null}
        </footer>
      </div>
    </article>
  );
}
