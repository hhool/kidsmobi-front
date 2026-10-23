import { MessagesSquare, Info, BarChart3, ListChecks, BookOpen } from "lucide-react";
import {
  KIDS_BUYER_FEEDBACK_PATH,
  KIDS_REVIEW_DATASET,
  kidsBuyerFeedbackStrings,
  type KidsBuyerFeedbackStrings,
} from "../data/kidsBuyerFeedback";
import ReferenceClusterNav from "./ReferenceClusterNav";

type Props = { lang?: "zh" | "en" };

const d = KIDS_REVIEW_DATASET;
const total = d.kidsBikeSummaries;

function Heading({
  icon: Icon,
  title,
  lead,
}: {
  icon: typeof Info;
  title: string;
  lead?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-orange-500">
        <Icon className="w-3.5 h-3.5" />
        {title}
      </div>
      {lead ? <p className="text-sm text-slate-600 leading-7 max-w-3xl">{lead}</p> : null}
    </div>
  );
}

/**
 * Mirrors the prerendered /kids-bike-what-buyers-say/ page.
 *
 * The provenance block comes first, before any number, because the honest
 * reading order matters: a reader who only gets as far as the first table
 * should already know these are second-hand retailer summaries and not quotes.
 */
export default function KidsBuyerFeedback({ lang = "en" }: Props) {
  const t: KidsBuyerFeedbackStrings = (kidsBuyerFeedbackStrings[lang] ??
    kidsBuyerFeedbackStrings.en) as KidsBuyerFeedbackStrings;

  return (
    <article className="max-w-5xl mx-auto py-8 sm:py-14 text-left px-4 sm:px-6">
      <div className="space-y-10">
        <header className="space-y-4 border-b border-slate-200 pb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-500">
            {t.eyebrow}
          </p>
          <h1 className="text-[clamp(1.9rem,4vw,2.6rem)] font-black leading-tight text-slate-950">
            {t.h1}
          </h1>
          <p className="text-base text-slate-700 leading-8 max-w-3xl">{t.lead}</p>
        </header>

        <section className="rounded-2xl border border-orange-200 bg-orange-50 p-5 sm:p-6">
          <Heading icon={Info} title={t.provenanceTitle} />
          <ul className="mt-3 space-y-2 list-disc pl-5 text-sm text-slate-700 leading-7 max-w-3xl">
            {t.provenanceBody.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </section>

        <section className="space-y-4">
          <Heading icon={BarChart3} title={t.themeTitle} lead={t.themeIntro} />
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[640px] text-left">
              <thead className="bg-slate-50">
                <tr className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                  <th className="py-3 pl-4 pr-3 font-black">{t.themeColTopic}</th>
                  <th className="py-3 pr-3 font-black">{t.themeColCount}</th>
                  <th className="py-3 pr-4 font-black">{t.themeColNote}</th>
                </tr>
              </thead>
              <tbody>
                {d.themes.map((theme) => (
                  <tr key={theme.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 pl-4 pr-3 text-sm font-bold text-slate-900">{theme.label}</td>
                    <td className="py-3 pr-3 text-sm font-black text-orange-600 whitespace-nowrap">
                      {theme.count} {lang === "zh" ? `/ ${total}` : `of ${total}`}
                    </td>
                    <td className="py-3 pr-4 text-xs text-slate-600 leading-6">{theme.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4 border-t border-slate-200 pt-8">
          <Heading icon={MessagesSquare} title={t.hedgeTitle} lead={t.hedgeIntro} />
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[420px] text-left">
              <thead className="bg-slate-50">
                <tr className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                  <th className="py-3 pl-4 pr-3 font-black">{t.themeColTopic}</th>
                  <th className="py-3 pr-4 font-black">{t.themeColCount}</th>
                </tr>
              </thead>
              <tbody>
                {d.hedges.map((hedge) => (
                  <tr key={hedge.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 pl-4 pr-3 text-sm font-bold text-slate-900">{hedge.label}</td>
                    <td className="py-3 pr-4 text-sm font-black text-orange-600 whitespace-nowrap">
                      {hedge.count} {lang === "zh" ? `/ ${total}` : `of ${total}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4 border-t border-slate-200 pt-8">
          <Heading icon={ListChecks} title={t.listingTitle} />
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[640px] text-left">
              <thead className="bg-slate-50">
                <tr className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                  <th className="py-3 pl-4 pr-3 font-black">{t.listingColName}</th>
                  <th className="py-3 pr-4 font-black">{t.listingColChars}</th>
                </tr>
              </thead>
              <tbody>
                {d.listings.map((listing) => (
                  <tr key={listing.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 pl-4 pr-3 text-sm text-slate-700 max-w-[420px]">
                      <a
                        href={`/products/kids-bikes/${listing.id}`}
                        className="hover:text-orange-600 transition-colors"
                      >
                        {listing.name}
                      </a>
                    </td>
                    {/* chars, not id — the column header promises a length. */}
                    <td className="py-3 pr-4 text-xs text-slate-500 whitespace-nowrap">
                      {listing.chars}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3 border-t border-slate-200 pt-8">
          <Heading icon={BookOpen} title={t.methodTitle} />
          <ul className="space-y-2 text-sm text-slate-600 leading-7 max-w-3xl list-disc pl-5">
            {t.methodBody.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </section>

        <ReferenceClusterNav
          currentPath={KIDS_BUYER_FEEDBACK_PATH}
          lang={lang}
          heading={t.clusterTitle}
        />
        <footer className="border-t border-slate-200 pt-6 text-[11px] text-slate-400 leading-6">
          {t.sourceLabel}: {t.sourceNote}
        </footer>
      </div>
    </article>
  );
}