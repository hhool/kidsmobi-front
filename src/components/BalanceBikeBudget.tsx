import {
  Wallet,
  Layers,
  Scale,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  HelpCircle,
  BookOpen,
} from "lucide-react";
import { BUDGET_PATH, budgetStrings, type BudgetStrings } from "../data/balanceBikeBudget";
import ReferenceClusterNav from "./ReferenceClusterNav";

type BalanceBikeBudgetProps = {
  lang?: "zh" | "en";
};

const shell = "max-w-5xl mx-auto py-8 sm:py-14 text-left px-4 sm:px-6";

function SectionHeading({
  icon: Icon,
  title,
  lead,
}: {
  icon: typeof Wallet;
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

export default function BalanceBikeBudget({ lang = "en" }: BalanceBikeBudgetProps) {
  const t: BudgetStrings = budgetStrings[lang];

  const bands: Array<{ label: string; items: string[] }> = [
    { label: t.bandLowLabel, items: t.bandLow },
    { label: t.bandMidLabel, items: t.bandMid },
    { label: t.bandHighLabel, items: t.bandHigh },
  ];

  return (
    <article className={shell}>
      <div className="space-y-10">
        <header className="space-y-5 border-b border-slate-200 pb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-orange-600">
            <Wallet className="w-3.5 h-3.5" />
            {t.eyebrow}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-950 leading-tight max-w-4xl">
            {t.heroTitle}
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-8 font-medium max-w-3xl">
            {t.heroLead}
          </p>
        </header>

        <section className="space-y-4">
          <SectionHeading icon={BookOpen} title={t.introTitle} lead={t.introLead} />
        </section>

        <section className="space-y-5 border-t border-slate-200 pt-8">
          <SectionHeading icon={Layers} title={t.bandsTitle} />
          <div className="grid gap-4 md:grid-cols-3">
            {bands.map((band) => (
              <div
                key={band.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3"
              >
                <h3 className="text-sm font-black text-slate-950">{band.label}</h3>
                <ul className="space-y-2">
                  {band.items.map((line, i) => (
                    <li key={i} className="flex gap-2 text-xs text-slate-700 leading-6">
                      <span className="mt-0.5 text-orange-500">•</span>
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4 border-t border-slate-200 pt-8">
          <SectionHeading icon={Scale} title={t.tradeoffsTitle} lead={t.tradeoffsLead} />
          <ul className="space-y-3">
            {t.tradeoffItems.map((line, i) => (
              <li key={i} className="flex gap-3 text-sm text-slate-700 leading-7 max-w-3xl">
                <span className="mt-1 w-4 h-4 shrink-0 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-[10px] font-black">
                  {i + 1}
                </span>
                {line}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-4 border-t border-slate-200 pt-8">
          <SectionHeading icon={CheckCircle2} title={t.checkTitle} lead={t.checkLead} />
          <ol className="space-y-3">
            {t.checkItems.map((line, i) => (
              <li key={i} className="flex gap-3 text-sm text-slate-700 leading-7 max-w-3xl">
                <CheckCircle2 className="mt-1 w-4 h-4 shrink-0 text-emerald-600" />
                <span>
                  <span className="font-bold text-slate-900">{i + 1}. </span>
                  {line}
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className="space-y-4 border-t border-slate-200 pt-8">
          <SectionHeading icon={AlertTriangle} title={t.avoidTitle} lead={t.avoidLead} />
          <ul className="space-y-3">
            {t.avoidItems.map((line, i) => (
              <li key={i} className="flex gap-3 text-sm text-slate-700 leading-7 max-w-3xl">
                <AlertTriangle className="mt-1 w-4 h-4 shrink-0 text-amber-500" />
                {line}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-4 border-t border-slate-200 pt-8">
          <SectionHeading icon={ShieldCheck} title={t.safetyTitle} lead={t.safetyLead} />
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-sm text-slate-800 leading-7">{t.safetyBody}</p>
          </div>
        </section>

        <section className="space-y-4 border-t border-slate-200 pt-8">
          <SectionHeading icon={HelpCircle} title={t.faqTitle} />
          <div className="space-y-3">
            {t.faqs.map((faq, i) => (
              <details
                key={i}
                className="rounded-2xl border border-slate-200 bg-white p-4 open:bg-slate-50"
              >
                <summary className="cursor-pointer text-sm font-black text-slate-950">
                  {faq.q}
                </summary>
                <p className="mt-2 text-sm text-slate-700 leading-7">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="space-y-3 border-t border-slate-200 pt-8">
          <SectionHeading icon={BookOpen} title={t.methodTitle} lead="" />
          <ul className="space-y-2 text-sm text-slate-600 leading-7 max-w-3xl list-disc pl-5">
            {t.methodBody.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </section>

        <section className="space-y-3 border-t border-slate-200 pt-8">
          <SectionHeading icon={AlertTriangle} title={t.caveatTitle} lead={t.caveatLead} />
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-3">
            {t.caveatBody.map((line, i) => (
              <p key={i} className="text-sm text-slate-800 leading-7">
                {line}
              </p>
            ))}
          </div>
        </section>

        <ReferenceClusterNav currentPath={BUDGET_PATH} lang={lang} />
        <footer className="border-t border-slate-200 pt-6 text-[11px] text-slate-400 leading-6">
          {t.sourceLabel}: BalanceBikeToddler reference pages
        </footer>
      </div>
    </article>
  );
}
