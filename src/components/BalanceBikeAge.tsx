import { useState } from "react";
import {
  Calendar,
  BookOpen,
  TrendingDown,
  Table2,
  Quote,
  FileCheck,
  AlertTriangle,
  ScanSearch,
  ExternalLink,
} from "lucide-react";
import {
  AGE_DATASET,
  AGE_PATH,
  ageSpanLabel,
  ageStrings,
  ageVars,
  bandAt,
  bikesAt,
  buildAgeDatasetSchema,
  type AgeStrings,
} from "../data/balanceBikeAge";
import { credibleReviewCount } from "../lib/reviewSignal";
import { fillTemplate } from "../data/safetyRecallRecord";

type BalanceBikeAgeProps = {
  lang?: "zh" | "en";
};

const shell = "max-w-5xl mx-auto py-8 sm:py-14 text-left px-4 sm:px-6";
const d = AGE_DATASET;
const cat = d.catalog;
const cov = d.coverage;

function SectionHeading({
  icon: Icon,
  title,
  lead,
}: {
  icon: typeof Calendar;
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

/** One row of the age table. The bar is the whole point, hence no decimal noise. */
function BandRow({
  band,
  of,
  selected,
  onSelect,
}: {
  band: (typeof cov.bands)[number];
  of: number;
  selected: boolean;
  onSelect: () => void;
  key?: string;
}) {
  const pct = of > 0 ? Math.round((band.fitCount / of) * 100) : 0;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full border-b border-slate-100 last:border-0 text-left transition-colors ${
        selected ? "bg-orange-50" : "hover:bg-slate-50"
      }`}
    >
      <div className="flex items-center gap-4 px-4 py-3">
        <span className="w-24 shrink-0 text-sm font-bold text-slate-900">{band.searchLabel}</span>
        <span className="w-16 shrink-0 text-sm font-black text-orange-600">
          {band.fitCount}
          <span className="text-xs font-semibold text-slate-400"> / {of}</span>
        </span>
        <span className="flex-1">
          <span className="flex items-center gap-3">
            <span className="h-2 w-full min-w-[100px] overflow-hidden rounded-full bg-slate-100">
              <span className="block h-full rounded-full bg-orange-400" style={{ width: `${pct}%` }} />
            </span>
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">{pct}%</span>
          </span>
        </span>
      </div>
    </button>
  );
}

export default function BalanceBikeAge({ lang = "en" }: BalanceBikeAgeProps) {
  const l = lang;
  const t: AgeStrings = ageStrings[l];
  const vars = ageVars();
  const fill = (s: string) => fillTemplate(s, vars as Record<string, string | number>);

  // Default to two years: the single most-searched age in our own query data.
  const [selectedMonths, setSelectedMonths] = useState(24);
  const selectedBand = bandAt(selectedMonths);
  const fit = bikesAt(selectedMonths);

  return (
    <article className={shell}>
      <div className="space-y-10">
        <header className="space-y-5 border-b border-slate-200 pb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-orange-600">
            <Calendar className="w-3.5 h-3.5" />
            {t.eyebrow}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-950 leading-tight max-w-4xl">
            {fill(t.heroTitle)}
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-8 font-medium max-w-3xl">{fill(t.heroLead)}</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              {t.sourceLabel}: {d.source.name}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ScanSearch className="w-3.5 h-3.5 text-slate-400" />
              {cat.balanceBikesListed} balance bikes · {d.catalog.productsScanned} products scanned
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-slate-400" />
              {t.heroNote}
            </span>
          </div>
        </header>

        <section className="space-y-4">
          <SectionHeading icon={Table2} title={t.bandTitle} lead={fill(t.bandLead)} />
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center gap-4 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-[11px] font-black uppercase tracking-wider text-slate-500">
              <span className="w-24 shrink-0">{t.colAge}</span>
              <span className="w-16 shrink-0">{t.colFit}</span>
              <span className="flex-1">{t.colShare}</span>
            </div>
            <div>
              {cov.bands.map((band) => (
                <BandRow
                  key={String(band.months)}
                  band={band}
                  of={cat.withStatedAgeRange}
                  selected={band.months === selectedBand.months}
                  onSelect={() => setSelectedMonths(band.months)}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-black text-slate-950">
            <TrendingDown className="w-4 h-4 text-orange-500" />
            {t.dropTitle}
          </h2>
          <p className="text-sm text-slate-600 leading-7">{fill(t.dropLead)}</p>
          <p className="text-sm text-slate-700 leading-7">{fill(t.dropBody)}</p>
        </section>

        <section className="space-y-4">
          <SectionHeading icon={Calendar} title={t.fitTitle} lead={t.fitLead} />
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 pl-4 pr-3 text-left font-black">{t.colBrand}</th>
                  <th className="py-2.5 pr-3 text-left font-black">{t.colModel}</th>
                  <th className="py-2.5 pr-3 text-left font-black">{t.colSpan}</th>
                  <th className="py-2.5 pr-3 text-left font-black">{t.colFitUntil}</th>
                  <th className="py-2.5 pr-3 text-left font-black">{t.colWheel}</th>
                  <th className="py-2.5 pr-3 text-left font-black">{t.colWeight}</th>
                  <th className="py-2.5 pr-4 text-left font-black">{t.colPrice}</th>
                </tr>
              </thead>
              <tbody>
                {fit.map((b) => (
                  <tr key={b.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="py-3 pl-4 pr-3 text-sm font-bold text-slate-900 whitespace-nowrap">
                      <a
                        href={b.productUrl}
                        className="inline-flex items-center gap-1 text-orange-600 hover:underline"
                      >
                        {b.brand}
                        <ExternalLink className="h-3 w-3 opacity-60" />
                      </a>
                    </td>
                    <td className="py-3 pr-3 text-xs text-slate-500 max-w-[260px]">
                      {b.name.replace(/^[^,]+,\s*/, "").slice(0, 68)}
                    </td>
                    <td className="py-3 pr-3 text-sm text-slate-700 whitespace-nowrap">
                      {ageSpanLabel(b.ageMinMonths, b.ageMaxMonths)}
                    </td>
                    <td className="py-3 pr-3 text-sm text-slate-700 whitespace-nowrap">
                      {b.remainingMonths > 0 ? `${b.remainingMonths} ${t.monthsLeft}` : t.alreadyPast}
                    </td>
                    <td className="py-3 pr-3 text-sm text-slate-700 whitespace-nowrap">
                      {b.wheelInches ? `${b.wheelInches}"` : "—"}
                    </td>
                    <td className="py-3 pr-3 text-sm text-slate-700 whitespace-nowrap">
                      {b.weightLbs ? `${b.weightLbs} lb` : "—"}
                    </td>
                    <td className="py-3 pr-4 text-sm font-bold text-slate-900 whitespace-nowrap">
                      {b.priceUsd ? `$${b.priceUsd.toFixed(2)}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500 leading-6">
            {t.oneLine} {fit.length} {selectedBand.searchLabel} ·{" "}
            {credibleReviewCount(fit[0]?.reviewCount)?.toLocaleString("en-US") ?? "—"} reviews on the top listing.
          </p>
        </section>

        {d.unplaced.length ? (
          <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 sm:p-6 space-y-3">
            <h2 className="text-base font-black text-slate-950">{fill(t.unplacedTitle)}</h2>
            <p className="text-sm text-slate-700 leading-7">{fill(t.unplacedLead)}</p>
            <ul className="space-y-2">
              {d.unplaced.map((b) => (
                <li key={b.id} className="text-sm text-slate-700 leading-7">
                  <span className="font-bold">{b.brand}</span> — {b.name.slice(0, 90)}
                  <div className="text-xs text-slate-500">{t.unplacedWhy}</div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="space-y-4">
          <SectionHeading icon={Quote} title={t.quoteTitle} lead={t.quoteLead} />
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100">
            {d.bikes.map((b) => (
              <div key={b.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3">
                <span className="text-sm font-bold text-slate-900 w-28 shrink-0">{b.brand}</span>
                <span className="text-sm text-slate-500 w-28 shrink-0">
                  {ageSpanLabel(b.ageMinMonths, b.ageMaxMonths)}
                </span>
                <span className="text-xs text-slate-500 flex-1 min-w-[240px]">“{b.quotedAgeRange}”</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400">{t.quoteSourceLabel}</p>
        </section>

        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-black text-slate-950">
            <FileCheck className="w-4 h-4 text-orange-500" />
            {t.methodTitle}
          </h2>
          <ol className="space-y-2">
            {t.methodBody.map((step) => (
              <li key={step} className="text-sm text-slate-600 leading-7">
                — {fill(step)}
              </li>
            ))}
          </ol>
        </section>

        <section className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-black text-slate-950">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            {t.caveatTitle}
          </h2>
          <p className="text-sm text-slate-600 leading-7">{t.caveatLead}</p>
          <ol className="space-y-2">
            {t.caveatBody.map((step) => (
              <li key={step} className="text-sm text-slate-600 leading-7">
                — {fill(step)}
              </li>
            ))}
          </ol>
        </section>

        <footer className="border-t border-slate-200 pt-6 text-xs text-slate-500 leading-6">
          {d.source.note}
          <span className="sr-only"> {AGE_PATH}</span>
        </footer>
      </div>
    </article>
  );
}

export { buildAgeDatasetSchema };
