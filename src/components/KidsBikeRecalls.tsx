import {
  ShieldAlert,
  Info,
  ListOrdered,
  LineChart,
  Scale,
  AlertTriangle,
  BookOpen,
  ExternalLink,
  FileCheck,
} from "lucide-react";
import {
  KIDS_RECALLS_PATH,
  kidsRecallsStrings,
  kidsRecallCoverage,
  kidsRecallHazards,
  kidsRecallByYear,
  kidsRecallPeriods,
  kidsRecallSorted,
  kidsRecallTotal,
  type KidsRecallsStrings,
} from "../data/kidsBikeRecalls";
import { fillTemplate } from "../data/safetyRecallRecord";
import { recallDataset } from "../data/safetyRecallRecord";
import ReferenceClusterNav from "./ReferenceClusterNav";

type Props = { lang?: "zh" | "en" };

/** "2025-03-14" -> "2025-03-14" for the card, "14 Mar 2025" for the caption. */
function formatDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : iso;
}

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
 * Mirrors the prerendered /kids-bike-recalls/ page.
 *
 * Ordering is deliberate: the scope table comes before the notice list, so a
 * reader learns how big the category is in the feed before they see individual
 * entries, and every notice links out to the CPSC rather than being summarised
 * here — we do not restate a regulator's hazard wording in our own voice.
 */
export default function KidsBikeRecalls({ lang = "en" }: Props) {
  const t: KidsRecallsStrings = (kidsRecallsStrings[lang] ??
    kidsRecallsStrings.en) as KidsRecallsStrings;

  const balanceRatio =
    recallDataset.totals.balanceBikeNotices > 0
      ? Math.round(kidsRecallTotal / recallDataset.totals.balanceBikeNotices)
      : kidsRecallTotal;

  const vars: Record<string, string | number> = {
    startYear: kidsRecallCoverage.startYear,
    endYear: kidsRecallCoverage.endYear,
    retrievedAt: kidsRecallCoverage.retrievedAt,
    kids: kidsRecallTotal,
    balance: recallDataset.totals.balanceBikeNotices,
    helmet: recallDataset.totals.kidHelmetNotices,
    total: recallDataset.totals.cpscNoticesRetrieved,
    balanceRatio,
  };
  const fill = (s: string) => fillTemplate(s, vars);

  const latestYear = kidsRecallByYear[kidsRecallByYear.length - 1]?.year ?? null;

  return (
    <article className="max-w-5xl mx-auto py-8 sm:py-14 text-left px-4 sm:px-6">
      <div className="space-y-10">
        <header className="space-y-5 border-b border-slate-200 pb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-red-600">
            <ShieldAlert className="w-3.5 h-3.5" />
            {t.eyebrow}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-950 leading-tight max-w-4xl">
            {t.heroTitle}
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-8 font-medium max-w-3xl">
            {fill(t.heroLead)}
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-slate-400" />
              {t.retrievedLabel}: {kidsRecallCoverage.retrievedAt}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              {t.coverageLabel}: {kidsRecallCoverage.startYear}–{kidsRecallCoverage.endYear}
            </span>
          </div>
          <p className="text-sm text-slate-500 leading-7 max-w-3xl">{t.heroNote}</p>
        </header>

        <section className="space-y-4">
          <Heading icon={Scale} title={t.scopeTitle} lead={fill(t.scopeLead)} />
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[560px] text-left">
              <thead className="bg-slate-50">
                <tr className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                  <th className="py-3 pl-4 pr-3 font-black">{t.coverLabel}</th>
                  <th className="py-3 pr-4 font-black">{t.scopeCount}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="py-3 pl-4 pr-3 text-sm font-bold text-slate-900">{t.scopeKids}</td>
                  <td className="py-3 pr-4 text-sm font-black text-orange-600 whitespace-nowrap">
                    {kidsRecallTotal}
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 pl-4 pr-3 text-sm text-slate-700">{t.scopeHelmet}</td>
                  <td className="py-3 pr-4 text-sm font-black text-slate-900 whitespace-nowrap">
                    {vars.helmet}
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 pl-4 pr-3 text-sm text-slate-700">{t.scopeBalance}</td>
                  <td className="py-3 pr-4 text-sm font-black text-slate-900 whitespace-nowrap">
                    {vars.balance}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 pl-4 pr-3 text-sm text-slate-500">{t.scopeTotal}</td>
                  <td className="py-3 pr-4 text-sm font-black text-slate-500 whitespace-nowrap">
                    {vars.total}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4 border-t border-slate-200 pt-8">
          <Heading icon={ListOrdered} title={t.latestTitle} lead={t.latestLead} />
          <div className="space-y-3">
            {kidsRecallSorted.slice(0, 8).map((n) => (
              <article
                key={n.recallNumber}
                className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <span className="text-xs font-black text-slate-500">
                    {formatDate(n.date)} · CPSC #{n.recallNumber}
                  </span>
                  {n.units ? (
                    <span className="text-xs text-slate-400">{n.units}</span>
                  ) : null}
                </div>
                <h3 className="mt-2 text-sm font-black text-slate-950 leading-6">{n.title}</h3>
                <p className="mt-2 text-xs text-slate-600 leading-6">{n.hazard}</p>
                <p className="mt-2 text-xs text-slate-500 leading-6">
                  <span className="font-bold text-slate-700">{n.party}</span>
                </p>
                <a
                  href={n.url}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-black text-orange-600 hover:underline"
                >
                  {t.openNotice}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-4 border-t border-slate-200 pt-8">
          <Heading icon={ShieldAlert} title={t.hazardTitle} lead={t.hazardLead} />
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[560px] text-left">
              <thead className="bg-slate-50">
                <tr className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                  <th className="py-3 pl-4 pr-3 font-black">{t.hazardColHazard}</th>
                  <th className="py-3 pr-4 font-black">{t.hazardColCount}</th>
                </tr>
              </thead>
              <tbody>
                {kidsRecallHazards.map((h) => {
                  const pct = kidsRecallTotal ? Math.round((h.count / kidsRecallTotal) * 100) : 0;
                  return (
                    <tr key={h.label} className="border-b border-slate-100 last:border-0">
                      <td className="py-3 pl-4 pr-3 text-sm text-slate-700">{h.label}</td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-black text-slate-900 whitespace-nowrap">
                            {h.count}
                          </span>
                          <div className="h-2 w-full min-w-[100px] overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-red-400"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                            {pct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4 border-t border-slate-200 pt-8">
          <Heading icon={LineChart} title={t.trendTitle} lead={t.trendLead} />
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[420px] text-left">
              <thead className="bg-slate-50">
                <tr className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                  <th className="py-3 pl-4 pr-3 font-black">{t.trendColYear}</th>
                  <th className="py-3 pr-4 font-black">{t.trendColNotices}</th>
                </tr>
              </thead>
              <tbody>
                {kidsRecallByYear.map((row) => (
                  <tr
                    key={row.year}
                    className={`border-b border-slate-100 last:border-0 ${
                      row.year === latestYear ? "bg-orange-50/60" : ""
                    }`}
                  >
                    <td className="py-2.5 pl-4 pr-3 text-sm text-slate-700 whitespace-nowrap">
                      {row.year}
                      {row.year === latestYear ? (
                        <span className="ml-2 text-[10px] font-black uppercase tracking-wider text-orange-600">
                          {lang === "zh" ? "进行中" : "in progress"}
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2.5 pr-4 text-sm font-black text-slate-900 whitespace-nowrap">
                      {row.notices}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4 border-t border-slate-200 pt-8">
          <Heading icon={Scale} title={t.periodTitle} lead={t.periodLead} />
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[420px] text-left">
              <thead className="bg-slate-50">
                <tr className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                  <th className="py-3 pl-4 pr-3 font-black">{t.periodColSpan}</th>
                  <th className="py-3 pr-4 font-black">{t.periodColNotices}</th>
                </tr>
              </thead>
              <tbody>
                {kidsRecallPeriods.map((row) => (
                  <tr key={row.period} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 pl-4 pr-3 text-sm text-slate-700 whitespace-nowrap">
                      {row.period}
                    </td>
                    <td className="py-3 pr-4 text-sm font-black text-slate-900 whitespace-nowrap">
                      {row.kidBikeNotices}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4 border-t border-slate-200 pt-8">
          <Heading icon={ListOrdered} title={t.checkTitle} lead={t.checkLead} />
          <ul className="space-y-3">
            {t.checkBody.map((line, i) => (
              <li key={i} className="flex gap-3 text-sm text-slate-700 leading-7 max-w-3xl">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                {line}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-4 border-t border-slate-200 pt-8">
          <Heading icon={AlertTriangle} title={t.caveatTitle} lead={t.caveatLead} />
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-3">
            {t.caveatBody.map((line, i) => (
              <p key={i} className="text-sm text-slate-800 leading-7">
                {fill(line)}
              </p>
            ))}
          </div>
        </section>

        <section className="space-y-3 border-t border-slate-200 pt-8">
          <Heading icon={BookOpen} title={t.methodTitle} lead="" />
          <ul className="space-y-2 text-sm text-slate-600 leading-7 max-w-3xl list-disc pl-5">
            {t.methodBody.map((line, i) => (
              <li key={i}>{fill(line)}</li>
            ))}
          </ul>
        </section>

        <ReferenceClusterNav
          currentPath={KIDS_RECALLS_PATH}
          lang={lang}
          heading={t.clusterTitle}
        />
        <footer className="border-t border-slate-200 pt-6 text-[11px] text-slate-400 leading-6">
          {t.sourceLabel}: {kidsRecallCoverage.name} ·{" "}
          <a href={kidsRecallCoverage.publisher} className="hover:underline">
            {kidsRecallCoverage.publisher}
          </a>{" "}
          · {t.retrievedLabel} {kidsRecallCoverage.retrievedAt}
        </footer>
      </div>
    </article>
  );
}