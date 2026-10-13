import {
  Ruler,
  ShieldCheck,
  Quote,
  Table2,
  Megaphone,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  FileCheck,
  ScanSearch,
} from "lucide-react";
import {
  STABILITY_DATASET,
  claimRows,
  coverageRows,
  inchLabel,
  stabilityStrings,
  type StabilityStrings,
  STABILITY_PATH,
} from "../data/balanceBikeStability";
import { fillTemplate } from "../data/safetyRecallRecord";
import ReferenceClusterNav from "./ReferenceClusterNav";

type BalanceBikeStabilityProps = {
  lang?: "zh" | "en";
};

const shell = "max-w-5xl mx-auto py-8 sm:py-14 text-left px-4 sm:px-6";
const d = STABILITY_DATASET;
const cov = d.coverage;

function SectionHeading({
  icon: Icon,
  title,
  lead,
}: {
  icon: typeof Ruler;
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

/** One coverage row: the count is the story, so the bar and numbers carry it. */
function CoverageRow({
  label,
  n,
  of,
  t,
}: {
  label: string;
  n: number;
  of: number;
  t: StabilityStrings;
  key?: string;
}) {
  const pct = of > 0 ? Math.round((n / of) * 100) : 0;
  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="py-3 pl-4 pr-3 text-sm text-slate-700">{label}</td>
      <td className="py-3 pr-3 text-sm font-bold text-slate-900 whitespace-nowrap">
        {n} / {of}
      </td>
      <td className="py-3 pr-4">
        <div className="flex items-center gap-3">
          <div className="h-2 w-full min-w-[120px] overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-orange-400"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">{pct}%</span>
        </div>
      </td>
    </tr>
  );
}

export default function BalanceBikeStability({ lang = "en" }: BalanceBikeStabilityProps) {
  const l = lang;
  const t = stabilityStrings[l];

  const vars: Record<string, string | number> = {
    scanned: d.catalog.productsScanned,
    listed: cov.listed,
    withSpacing: cov.withTrackSpacing,
    file: d.source.exportFile,
    date: d.source.retrievedAt,
  };
  const fill = (s: string) => fillTemplate(s, vars);

  const quote = d.publishedGeometry[0] ?? null;

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
          <p className="text-base sm:text-lg text-slate-600 leading-8 font-medium max-w-3xl">
            {fill(t.heroLead)}
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              {t.sourceLabel}: {d.source.name}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-slate-400" />
              {d.source.retrievedAt}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ScanSearch className="w-3.5 h-3.5 text-slate-400" />
              {cov.listed} balance bikes · {d.catalog.productsScanned} products scanned
            </span>
          </div>
          <p className="text-sm text-slate-500 leading-7 max-w-3xl">{t.heroNote}</p>
        </header>

        <section className="space-y-4">
          <SectionHeading icon={Ruler} title={t.gapTitle} lead={fill(t.gapLead)} />
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[560px] text-left">
              <thead className="bg-slate-50">
                <tr className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                  <th className="py-3 pl-4 pr-3 font-black">{t.coverStudio}</th>
                  <th className="py-3 pr-3 font-black">{t.coverValue}</th>
                  <th className="py-3 pr-4 font-black" />
                </tr>
              </thead>
              <tbody>
                {coverageRows(t).map((row) => (
                  <CoverageRow key={row.label} label={row.label} n={row.n} of={row.of} t={t} />
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {quote ? (
          <section className="space-y-4 border-t border-slate-200 pt-8">
            <SectionHeading icon={Quote} title={t.quoteTitle} lead={t.quoteLead} />
            <figure className="rounded-2xl border border-orange-200 bg-orange-50 p-5 sm:p-6">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="text-sm font-black text-slate-950">{quote.brand}</span>
                <span className="text-xs text-slate-500">
                  {quote.wheelCount} wheels · {quote.wheelSizeIn}" · {t.published}{" "}
                  {quote.trackSpacingIn} in ({Math.round(quote.trackSpacingIn * 2.54 * 10) / 10} cm){" "}
                  {t.colSpacing.toLowerCase()}
                </span>
              </div>
              <blockquote className="mt-3 text-sm text-slate-800 leading-7 italic">
                “{quote.quote}”
              </blockquote>
              <figcaption className="mt-3 text-xs text-slate-500">
                {t.quoteSourceLabel} ·{" "}
                <a href={quote.productUrl} className="text-orange-600 hover:underline">
                  {quote.name}
                </a>
              </figcaption>
              <p className="mt-3 text-xs text-slate-600 leading-6">
                {t.colSpacing}: {inchLabel(quote.trackSpacingIn)} · tire width{" "}
                {inchLabel(quote.tireWidthIn)} · steering limit {quote.steeringLimitDeg}°
              </p>
            </figure>
          </section>
        ) : (
          <section className="border-t border-slate-200 pt-8">
            <p className="text-sm text-slate-600 leading-7">{t.quoteMissing}</p>
          </section>
        )}

        <section className="space-y-4 border-t border-slate-200 pt-8">
          <SectionHeading icon={Megaphone} title={t.claimsTitle} lead={t.claimsLead} />
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[560px] text-left">
              <thead className="bg-slate-50">
                <tr className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                  <th className="py-3 pl-4 pr-3 font-black">{t.coverStudio}</th>
                  <th className="py-3 pr-3 font-black">{t.coverValue}</th>
                  <th className="py-3 pr-4 font-black" />
                </tr>
              </thead>
              <tbody>
                {claimRows(t).map((row) => (
                  <CoverageRow key={row.label} label={row.label} n={row.n} of={row.of} t={t} />
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500 leading-6">{t.claimed}</p>
        </section>

        <section className="space-y-4 border-t border-slate-200 pt-8">
          <SectionHeading icon={Table2} title={t.rosterTitle} lead={fill(t.rosterLead)} />
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[860px] text-left">
              <thead className="bg-slate-50">
                <tr className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                  <th className="py-3 pl-4 pr-3 font-black">{t.colBrand}</th>
                  <th className="py-3 pr-3 font-black">{t.colModel}</th>
                  <th className="py-3 pr-3 font-black">{t.colWheels}</th>
                  <th className="py-3 pr-3 font-black">{t.colSpacing}</th>
                  <th className="py-3 pr-3 font-black">{t.colWheel}</th>
                  <th className="py-3 pr-3 font-black">{t.colTire}</th>
                  <th className="py-3 pr-3 font-black">{t.colFrame}</th>
                  <th className="py-3 pr-4 font-black">{t.colLoad}</th>
                </tr>
              </thead>
              <tbody>
                {d.balanceBikes.map((b) => (
                  <tr
                    key={b.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-3 pl-4 pr-3 text-sm font-bold text-slate-900 whitespace-nowrap">
                      {b.brand ?? "—"}
                    </td>
                    <td className="py-3 pr-3 text-sm text-slate-600 max-w-[300px]">
                      <a href={b.productUrl} className="hover:text-orange-600 transition-colors">
                        {b.name}
                      </a>
                    </td>
                    <td className="py-3 pr-3 text-sm text-slate-700 whitespace-nowrap">
                      {b.wheelCount ? `${b.wheelCount}` : t.notStated}
                    </td>
                    <td className="py-3 pr-3 text-sm font-semibold text-slate-900 whitespace-nowrap">
                      {b.trackSpacingIn == null ? t.notStated : inchLabel(b.trackSpacingIn)}
                    </td>
                    <td className="py-3 pr-3 text-sm text-slate-700 whitespace-nowrap">
                      {b.wheelSizeIn == null ? t.notStated : `${b.wheelSizeIn}"`}
                    </td>
                    <td className="py-3 pr-3 text-sm text-slate-700 whitespace-nowrap">
                      {b.tireClass ?? t.notStated}
                    </td>
                    <td className="py-3 pr-3 text-sm text-slate-700 whitespace-nowrap">
                      {b.frameMaterial ?? t.notStated}
                    </td>
                    <td className="py-3 pr-4 text-sm text-slate-700 whitespace-nowrap">
                      {b.maxLoadLb == null ? t.notStated : `${b.maxLoadLb} lb`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4 border-t border-slate-200 pt-8">
          <SectionHeading icon={CheckCircle2} title={t.checkTitle} lead={t.checkLead} />
          <ul className="space-y-3">
            {t.checkBody.map((line, i) => (
              <li key={i} className="flex gap-3 text-sm text-slate-700 leading-7 max-w-3xl">
                <CheckCircle2 className="mt-1 w-4 h-4 shrink-0 text-emerald-600" />
                {line}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-4 border-t border-slate-200 pt-8">
          <SectionHeading icon={AlertTriangle} title={t.caveatTitle} lead={t.caveatLead} />
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-3">
            {t.caveatBody.map((line, i) => (
              <p key={i} className="text-sm text-slate-800 leading-7">
                {fill(line)}
              </p>
            ))}
          </div>
        </section>

        <section className="space-y-3 border-t border-slate-200 pt-8">
          <SectionHeading icon={BookOpen} title={t.methodTitle} lead="" />
          <ul className="space-y-2 text-sm text-slate-600 leading-7 max-w-3xl list-disc pl-5">
            {t.methodBody.map((line, i) => (
              <li key={i}>{fill(line)}</li>
            ))}
          </ul>
        </section>

        <ReferenceClusterNav currentPath={STABILITY_PATH} lang={lang} />
        <footer className="border-t border-slate-200 pt-6 text-[11px] text-slate-400 leading-6">
          {t.sourceLabel}: {d.source.name} · {d.source.exportFile} · {d.source.retrievedAt} ·{" "}
          {d.source.note}
        </footer>
      </div>
    </article>
  );
}
