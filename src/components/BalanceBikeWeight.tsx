import {
  Weight,
  Scale,
  Layers,
  Info,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
} from "lucide-react";
import {
  WEIGHT_DATASET,
  categoryLabels,
  frameLabel,
  headlineFacts,
  lbToKg,
  weightCategoryRows,
  weightStrings,
  type WeightStrings,
  WEIGHT_PATH,
} from "../data/balanceBikeWeight";
import { fillTemplate } from "../data/safetyRecallRecord";
import ReferenceClusterNav from "./ReferenceClusterNav";

type BalanceBikeWeightProps = {
  lang?: "zh" | "en";
};

const shell = "max-w-5xl mx-auto py-8 sm:py-14 text-left px-4 sm:px-6";
const d = WEIGHT_DATASET;

function SectionHeading({
  icon: Icon,
  title,
  lead,
}: {
  icon: typeof Weight;
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

function FrameRow({
  row,
  t,
  l,
}: {
  row: (typeof d.frameBreakdown)[number];
  t: WeightStrings;
  l: "en" | "zh";
  key?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-black text-slate-950">{frameLabel(row.material)[l]}</h3>
        <span className="text-xs font-semibold text-slate-500">n = {row.n}</span>
      </div>
      <p className="mt-2 text-sm text-slate-700 leading-7">
        <span className="font-bold text-slate-900">
          {row.medianLb} lb ({lbToKg(row.medianLb)} kg)
        </span>{" "}
        <span className="text-slate-500">
          · {row.minLb}–{row.maxLb} lb
        </span>
      </p>
      {row.smallSample ? (
        <p className="mt-2 text-xs font-semibold text-amber-700">{t.smallSample}</p>
      ) : null}
    </div>
  );
}

export function BalanceBikeWeight({ lang = "en" }: BalanceBikeWeightProps) {
  const t = weightStrings[lang ?? "en"];
  const l = lang === "zh" ? "zh" : "en";
  const facts = headlineFacts();

  const vars = {
    scanned: d.totals.productsScanned,
    withWeight: d.totals.withWeight,
    bbMedian: facts?.balanceBikeMedianLb ?? "—",
    kbMedian: facts?.kidsBikeMedianLb ?? "—",
    lighter: facts?.lighterByLb ?? "—",
    lighterKg: facts?.lighterByKg ?? "—",
    ratio: facts?.ratio ?? "—",
    n: d.totals.balanceBikesWithWeight,
    listed: d.totals.balanceBikesListed,
    file: d.source.exportFile,
    date: d.source.retrievedAt,
    min: d.method.plausibleBandLb[0],
    max: d.method.plausibleBandLb[1],
  };

  return (
    <article className={shell}>
      <div className="space-y-10">
        <header className="space-y-5 border-b border-slate-200 pb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-orange-600">
            <Weight className="w-3.5 h-3.5" />
            {t.eyebrow}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-950 leading-tight max-w-4xl">
            {t.heroTitle}
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-8 font-medium max-w-3xl">
            {fillTemplate(t.heroLead, vars)}
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
          </div>
          <p className="text-sm text-slate-500 leading-7 max-w-3xl">{t.heroNote}</p>
        </header>

        {facts ? (
          <section className="space-y-4">
            <SectionHeading icon={Info} title={t.headlineTitle} lead="" />
            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5 sm:p-6">
              <p className="text-base sm:text-lg text-slate-800 leading-8 font-medium">
                {fillTemplate(t.headlineBody, vars)}
              </p>
            </div>
          </section>
        ) : null}

        <section className="space-y-4">
          <SectionHeading icon={Scale} title={t.tableTitle} lead={t.tableLead} />
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[620px] text-left">
              <thead className="bg-slate-50">
                <tr className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                  <th className="py-3 pl-4 pr-3 font-black">{t.colCategory}</th>
                  <th className="py-3 pr-3 font-black">{t.colCount}</th>
                  <th className="py-3 pr-3 font-black">{t.colMedian}</th>
                  <th className="py-3 pr-4 font-black">{t.colRange}</th>
                </tr>
              </thead>
              <tbody>
                {weightCategoryRows.map((row) => (
                  <tr
                    key={row.key}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-3 pl-4 pr-3 text-sm font-bold text-slate-900">
                      {row.label[l]}
                    </td>
                    <td className="py-3 pr-3 text-sm text-slate-600">{row.withWeight}</td>
                    <td className="py-3 pr-3 text-sm font-semibold text-slate-900 whitespace-nowrap">
                      {row.medianLb == null ? "—" : `${row.medianLb} lb`}
                      {row.medianLb == null ? null : (
                        <span className="text-slate-500 font-normal">
                          {" "}
                          / {lbToKg(row.medianLb)} kg
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-sm text-slate-700 whitespace-nowrap">
                      {row.minLb == null ? "—" : `${row.minLb}–${row.maxLb} lb`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4 border-t border-slate-200 pt-8">
          <SectionHeading
            icon={Weight}
            title={t.rosterTitle}
            lead={fillTemplate(t.rosterLead, vars)}
          />
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-slate-50">
                <tr className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                  <th className="py-3 pl-4 pr-3 font-black">{t.colBrand}</th>
                  <th className="py-3 pr-3 font-black">{t.colModel}</th>
                  <th className="py-3 pr-3 font-black">{t.colWeight}</th>
                  <th className="py-3 pr-3 font-black">{t.colFrame}</th>
                  <th className="py-3 pr-3 font-black">{t.colWheel}</th>
                  <th className="py-3 pr-4 font-black">{t.colPrice}</th>
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
                    <td className="py-3 pr-3 text-sm text-slate-600 max-w-[320px]">
                      <a
                        href={b.productUrl}
                        className="hover:text-orange-600 transition-colors"
                      >
                        {b.name}
                      </a>
                    </td>
                    <td className="py-3 pr-3 text-sm font-semibold text-slate-900 whitespace-nowrap">
                      {b.weightLb} lb
                      <span className="text-slate-500 font-normal"> / {lbToKg(b.weightLb)} kg</span>
                    </td>
                    <td className="py-3 pr-3 text-sm text-slate-700">
                      {b.frameMaterial ? frameLabel(b.frameMaterial)[l] : t.notListed}
                    </td>
                    <td className="py-3 pr-3 text-sm text-slate-700 whitespace-nowrap">
                      {b.wheelInches ? `${b.wheelInches}"` : t.notListed}
                    </td>
                    <td className="py-3 pr-4 text-sm text-slate-700 whitespace-nowrap">
                      {b.priceUsd ? `$${b.priceUsd}` : t.notListed}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4 border-t border-slate-200 pt-8">
          <SectionHeading
            icon={Layers}
            title={t.frameTitle}
            lead={fillTemplate(t.frameLead, { n: d.balanceBikes.length })}
          />
          <div className="grid gap-4 sm:grid-cols-3">
            {d.frameBreakdown.map((row) => (
              <FrameRow key={row.material} row={row} t={t} l={l} />
            ))}
          </div>
        </section>

        <section className="space-y-4 border-t border-slate-200 pt-8">
          <SectionHeading icon={AlertTriangle} title={t.unknownTitle} lead={t.unknownLead} />
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-3">
            <p className="text-sm text-slate-800 leading-7">
              {fillTemplate(t.unknownBrake, {
                specified: d.categories.reduce((n, c) => n + c.brakeSpecified, 0),
                listed: d.totals.productsScanned,
              })}
            </p>
            <p className="text-sm text-slate-800 leading-7">
              {fillTemplate(t.unknownTire, {
                specified: d.categories.reduce((n, c) => n + c.tireSpecified, 0),
                listed: d.totals.productsScanned,
              })}
            </p>
          </div>
        </section>

        {d.excludedSuspect.length ? (
          <section className="space-y-4 border-t border-slate-200 pt-8">
            <SectionHeading
              icon={AlertTriangle}
              title={t.excludedTitle}
              lead={fillTemplate(t.excludedLead, vars)}
            />
            <ul className="space-y-2 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700">
              {d.excludedSuspect.map((e, i) => (
                <li key={i} className="leading-7">
                  <span className="font-bold text-slate-900">
                    {e.brand ?? "—"} — {categoryLabels[e.category]?.[l] ?? e.category}
                  </span>{" "}
                  · {t.colWeight}: {e.rawWeight} · {e.reason}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="space-y-4 border-t border-slate-200 pt-8">
          <SectionHeading icon={BookOpen} title={t.methodTitle} lead="" />
          <ul className="space-y-2 pl-5 text-sm text-slate-700 leading-7 list-disc max-w-3xl">
            {t.methodBody.map((line, i) => (
              <li key={i}>{fillTemplate(line, vars)}</li>
            ))}
          </ul>
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
        <ReferenceClusterNav currentPath={WEIGHT_PATH} lang={lang} />
      </div>
    </article>
  );
}

// React.lazy in App.tsx resolves the module default export; without this line
// the lazy chunk resolves to undefined and React throws #306 ("Element type
// is invalid") at hydration. The named export above is kept for direct imports.
export default BalanceBikeWeight;
