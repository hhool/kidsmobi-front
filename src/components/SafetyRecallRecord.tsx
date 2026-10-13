import { AlertTriangle, Calendar, Database, ExternalLink, Search, ShieldCheck, Wrench } from "lucide-react";
import {
  fillTemplate,
  formatCount,
  formatRecallDate,
  latestTrendRow,
  latestTrendYear,
  recallDataset,
  recallStrings,
  topHazard,
  type RecallNotice,
} from "../data/safetyRecallRecord";

type SafetyRecallRecordProps = {
  lang?: "zh" | "en";
};

const shell = "max-w-5xl mx-auto py-8 sm:py-14 text-left px-4 sm:px-6";

function SectionHeading({ icon: Icon, title, lead }: { icon: typeof Search; title: string; lead: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-orange-500">
        <Icon className="w-3.5 h-3.5" />
        Public safety record
      </div>
      <h2 className="text-xl sm:text-2xl font-black text-slate-950 leading-snug">{title}</h2>
      <p className="text-sm text-slate-600 leading-7 max-w-3xl">{lead}</p>
    </div>
  );
}

function NoticeRow({ notice, label }: { notice: RecallNotice; label: string; key?: string }) {
  return (
    <tr className="border-b border-slate-100 align-top">
      <td className="py-3 pr-3 whitespace-nowrap text-xs font-bold text-slate-500">
        {formatRecallDate(notice.date)}
      </td>
      <td className="py-3 pr-3">
        <a
          href={notice.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-slate-900 hover:text-orange-600 transition-colors"
        >
          {notice.title}
        </a>
        <div className="mt-1 text-xs text-slate-500">{notice.party || notice.recallNumber}</div>
      </td>
      <td className="py-3 pr-3 text-xs text-slate-600 max-w-[240px]">
        {notice.hazard ? `${notice.hazard.slice(0, 130)}${notice.hazard.length > 130 ? "…" : ""}` : "—"}
      </td>
      <td className="py-3 text-right whitespace-nowrap">
        <a
          href={notice.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[11px] font-black text-orange-600 hover:bg-orange-100 transition-colors"
        >
          {label}
          <ExternalLink className="w-3 h-3" />
        </a>
      </td>
    </tr>
  );
}

function NoticeTable({ rows, label }: { rows: RecallNotice[]; label: string }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full min-w-[720px] text-left">
        <thead className="bg-slate-50">
          <tr className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
            <th className="py-3 pl-4 pr-3 font-black">Date</th>
            <th className="py-3 pr-3 font-black">Notice</th>
            <th className="py-3 pr-3 font-black">Reported hazard</th>
            <th className="py-3 pr-4 text-right font-black">Source</th>
          </tr>
        </thead>
        <tbody className="px-4">
          {rows.map((row) => (
            <NoticeRow key={row.recallNumber + row.title} notice={row} label={label} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SafetyRecallRecord({ lang = "en" }: SafetyRecallRecordProps) {
  const t = recallStrings[lang] || recallStrings.en;
  const d = recallDataset;
  const vals = {
    start: d.source.coverageStartYear,
    total: formatCount(d.totals.cpscNoticesRetrieved),
    bb: d.totals.balanceBikeNotices,
    bikes: latestTrendRow?.kidBikeNotices ?? 0,
    helmets: latestTrendRow?.kidHelmetNotices ?? 0,
    year: latestTrendYear,
    hazard: topHazard ? topHazard.label.toLowerCase() : "mechanical failure",
  };

  return (
    <article className={shell}>
      <div className="space-y-10">
        <header className="space-y-5 border-b border-slate-200 pb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-orange-600">
            <ShieldCheck className="w-3.5 h-3.5" />
            {t.eyebrow}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-950 leading-tight max-w-4xl">
            {t.heroTitle}
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-8 font-medium max-w-3xl">{t.heroLead}</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-slate-400" />
              {t.retrievedLabel}: {d.source.retrievedAt}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {t.coverageLabel}: {d.source.coverageStartYear}–{latestTrendYear}
            </span>
            <span>
              CPSC: {formatCount(d.totals.cpscNoticesRetrieved)} · {lang === "zh" ? "童车" : "kids' bikes"}:{" "}
              {d.totals.kidsBikeNotices} · {lang === "zh" ? "头盔护具" : "helmets"}:{" "}
              {d.totals.kidHelmetNotices} · {lang === "zh" ? "平衡车" : "balance bikes"}:{" "}
              {d.totals.balanceBikeNotices}
            </span>
          </div>
          <p className="text-sm text-slate-500 leading-7 max-w-3xl">{t.heroNote}</p>
        </header>

        <section className="space-y-4">
          <SectionHeading icon={Search} title={t.findingsTitle} lead="" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[t.finding1, t.finding2, t.finding3].map((text, index) => (
              <div
                key={index}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-orange-500">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <p className="text-sm text-slate-700 leading-7 font-medium">{fillTemplate(text, vals)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-5">
          <SectionHeading
            icon={AlertTriangle}
            title={fillTemplate(t.balanceTitle, { count: d.totals.balanceBikeNotices })}
            lead={t.balanceLead}
          />
          <div className="grid grid-cols-1 gap-4">
            {d.balanceBikeNotices.map((notice) => (
              <div key={notice.recallNumber} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5">{formatRecallDate(notice.date)}</span>
                  <span className="rounded-full bg-orange-50 px-2 py-0.5 text-orange-600">
                    CPSC #{notice.recallNumber}
                  </span>
                  {notice.units ? (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 normal-case tracking-normal">
                      {notice.units}
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 text-base font-black text-slate-950 leading-snug">{notice.title}</p>
                {notice.party ? (
                  <p className="mt-1 text-xs font-bold text-slate-500">{notice.party}</p>
                ) : null}
                <p className="mt-3 text-sm text-slate-700 leading-7">{notice.hazard}</p>
                {notice.remedy ? (
                  <div className="mt-3 flex gap-2 rounded-xl bg-slate-50 p-3">
                    <Wrench className="mt-0.5 w-4 h-4 shrink-0 text-slate-400" />
                    <p className="text-xs text-slate-600 leading-6">{notice.remedy}</p>
                  </div>
                ) : null}
                <a
                  href={notice.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-black text-orange-600 hover:text-orange-500 transition-colors"
                >
                  {t.openNotice}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeading
            icon={Database}
            title={fillTemplate(t.bikeTableTitle, { count: d.totals.kidsBikeNotices })}
            lead={t.bikeTableLead}
          />
          <NoticeTable rows={d.kidBikeNotices} label={lang === "zh" ? "原文" : "CPSC"} />
        </section>

        <section className="space-y-4">
          <SectionHeading
            icon={ShieldCheck}
            title={fillTemplate(t.helmetTableTitle, { count: d.totals.kidHelmetNotices })}
            lead={t.helmetTableLead}
          />
          <NoticeTable rows={d.kidHelmetNotices} label={lang === "zh" ? "原文" : "CPSC"} />
        </section>

        <section className="space-y-4">
          <SectionHeading icon={Calendar} title={t.trendTitle} lead={t.trendLead} />
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[520px] text-left">
              <thead className="bg-slate-50">
                <tr className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                  <th className="py-3 pl-4 pr-3 font-black">Year</th>
                  <th className="py-3 pr-3 text-right font-black">
                    {lang === "zh" ? "童车" : "Kids' bikes"}
                  </th>
                  <th className="py-3 pr-3 text-right font-black">{lang === "zh" ? "头盔护具" : "Helmets"}</th>
                  <th className="py-3 pr-3 text-right font-black">{lang === "zh" ? "CPSC 全部" : "All CPSC"}</th>
                  <th className="py-3 pr-4 text-right font-black">{lang === "zh" ? "占比" : "Share"}</th>
                </tr>
              </thead>
              <tbody>
                {[...d.yearlyTrend].reverse().map((row) => (
                  <tr key={row.year} className="border-b border-slate-100 text-sm">
                    <td className="py-2.5 pl-4 pr-3 font-bold text-slate-900">{row.year}</td>
                    <td className="py-2.5 pr-3 text-right text-slate-700">{row.kidBikeNotices}</td>
                    <td className="py-2.5 pr-3 text-right text-slate-700">{row.kidHelmetNotices}</td>
                    <td className="py-2.5 pr-3 text-right text-slate-500">{row.totalNotices}</td>
                    <td className="py-2.5 pr-4 text-right font-bold text-slate-900">{row.sharePct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeading icon={AlertTriangle} title={t.hazardTitle} lead={t.hazardLead} />
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {d.hazardBreakdown.map((hazard) => (
              <li
                key={hazard.label}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
              >
                <span className="text-sm text-slate-700">{hazard.label}</span>
                <span className="text-sm font-black text-orange-600">{hazard.count}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-4">
          <SectionHeading icon={Wrench} title={t.checkTitle} lead={t.checkLead} />
          <ol className="space-y-3">
            {t.checkSteps.map((step, index) => (
              <li key={index} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-50 text-xs font-black text-orange-600">
                  {index + 1}
                </span>
                <p className="text-sm text-slate-700 leading-7">{step}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="space-y-4 border-t border-slate-200 pt-8">
          <SectionHeading
            icon={Database}
            title={t.methodTitle}
            lead={fillTemplate(t.methodBody[0], { start: d.source.coverageStartYear, api: d.source.api })}
          />
          <ul className="space-y-2 pl-5 text-sm text-slate-600 leading-7 list-disc max-w-3xl">
            {t.methodBody.slice(1).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="text-base font-black text-slate-950">{t.disclaimerTitle}</h2>
          <p className="mt-2 text-sm text-slate-700 leading-7">{t.disclaimerBody}</p>
        </section>
      </div>
    </article>
  );
}
