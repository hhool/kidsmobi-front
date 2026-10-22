import {
  Tags,
  BookOpen,
  Table2,
  Info,
  FileCheck,
  AlertTriangle,
  ScanSearch,
  ExternalLink,
} from "lucide-react";
import {
  KIDS_PRICE_DATASET,
  KIDS_PRICE_PATH,
  kidsBikesInBand,
  kidsPriceAgeSpanLabel,
  kidsPriceBandAt,
  kidsPriceStrings,
  kidsPriceVars,
  buildKidsPriceDatasetSchema,
  type KidsPriceStrings,
} from "../data/kidsBikePrice";
import { fillTemplate } from "../data/safetyRecallRecord";
import ReferenceClusterNav from "./ReferenceClusterNav";

type KidsBikePriceProps = {
  lang?: "zh" | "en";
};

const shell = "max-w-5xl mx-auto py-8 sm:py-14 text-left px-4 sm:px-6";
const d = KIDS_PRICE_DATASET;
const cat = d.catalog;
const price = d.price;

function SectionHeading({
  icon: Icon,
  title,
  lead,
}: {
  icon: typeof Tags;
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

/** One row of the price-band table. The bar is the share of the catalogue. */
function BandRow({ band, of }: { band: (typeof price.bands)[number]; of: number; key?: string }) {
  const pct = of > 0 ? Math.round((band.count / of) * 100) : 0;
  return (
    <div className="flex items-center gap-4 border-b border-slate-100 px-4 py-3 last:border-0">
      <span className="w-28 shrink-0 text-sm font-bold text-slate-900">{band.label}</span>
      <span className="w-16 shrink-0 text-sm font-black text-orange-600">
        {band.count}
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
      <span className="w-24 shrink-0 text-xs text-slate-600 whitespace-nowrap">
        {band.medianWeightLb == null ? "—" : `${band.medianWeightLb} lb median`}
      </span>
      <span className="w-32 shrink-0 text-xs text-slate-600 whitespace-nowrap">
        {band.wheelSizes.length ? band.wheelSizes.map((w) => `${w}"`).join(", ") : "—"}
      </span>
    </div>
  );
}

export default function KidsBikePrice({ lang = "en" }: KidsBikePriceProps) {
  const l = lang;
  const t: KidsPriceStrings = kidsPriceStrings[l];
  const vars = kidsPriceVars(l);
  const fill = (s: string) => fillTemplate(s, vars as Record<string, string | number>);

  return (
    <article className={shell}>
      <div className="space-y-10">
        <header className="space-y-5 border-b border-slate-200 pb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-orange-600">
            <Tags className="w-3.5 h-3.5" />
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
              {cat.kidsBikesListed} kids bikes · {cat.withPrice} publish a price
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              {fill(t.heroNote)}
            </span>
          </div>
        </header>

        <section className="space-y-4">
          <SectionHeading icon={Table2} title={t.bandTitle} lead={fill(t.bandLead)} />
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center gap-4 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-[11px] font-black uppercase tracking-wider text-slate-500">
              <span className="w-28 shrink-0">{t.colBand}</span>
              <span className="w-16 shrink-0">{t.colCount}</span>
              <span className="flex-1">{t.colShare}</span>
              <span className="w-24 shrink-0">{t.colWeight}</span>
              <span className="w-32 shrink-0">{t.colWheel}</span>
            </div>
            {price.bands.map((band) => (
              <BandRow key={band.id} band={band} of={cat.withPrice} />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-black text-slate-950">
            <Info className="w-4 h-4 text-orange-500" />
            {t.readingTitle}
          </h2>
          <p className="text-sm text-slate-600 leading-7">{t.readingLead}</p>
          <p className="text-sm text-slate-700 leading-7">{fill(t.readingBody)}</p>
        </section>

        <section className="space-y-4">
          <SectionHeading icon={Tags} title={t.fitTitle} lead={t.fitLead} />
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 pl-4 pr-3 text-left font-black">{t.colBrand}</th>
                  <th className="py-2.5 pr-3 text-left font-black">{t.colModel}</th>
                  <th className="py-2.5 pr-3 text-left font-black">{t.colPrice}</th>
                  <th className="py-2.5 pr-3 text-left font-black">{t.colWheelCol}</th>
                  <th className="py-2.5 pr-3 text-left font-black">{t.colWeightCol}</th>
                  <th className="py-2.5 pr-4 text-left font-black">{t.colAge}</th>
                </tr>
              </thead>
              <tbody>
                {d.bikes.map((b) => (
                  <tr key={b.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="py-3 pl-4 pr-3 text-sm font-bold text-slate-900 whitespace-nowrap">
                      <a href={b.productUrl} className="inline-flex items-center gap-1 text-orange-600 hover:underline">
                        {b.brand}
                        <ExternalLink className="h-3 w-3 opacity-60" />
                      </a>
                    </td>
                    <td className="py-3 pr-3 text-xs text-slate-500 max-w-[240px]">
                      {b.name.replace(/^[^,]+,\s*/, "").slice(0, 64)}
                    </td>
                    <td className="py-3 pr-3 text-sm font-bold text-slate-900 whitespace-nowrap">
                      {b.priceUsd == null ? "—" : `$${b.priceUsd.toFixed(2)}`}
                      <span className="ml-1 text-[10px] font-semibold text-slate-400">
                        {kidsPriceBandAt(b.priceUsd ?? 0).label}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-sm text-slate-700 whitespace-nowrap">
                      {b.wheelInches == null ? "—" : `${b.wheelInches}"`}
                    </td>
                    <td className="py-3 pr-3 text-sm text-slate-700 whitespace-nowrap">
                      {b.weightLbs == null ? "—" : `${b.weightLbs} lb`}
                    </td>
                    <td className="py-3 pr-4 text-sm text-slate-700 whitespace-nowrap">
                      {b.quotedAgeRange ?? kidsPriceAgeSpanLabel(b.ageMinMonths, b.ageMaxMonths)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500 leading-6">
            {fill(t.tableNote)} {kidsBikesInBand(price.bands[1].id).length} {price.bands[1].label} ·{" "}
            {price.bands[price.bands.length - 1].label}: {price.bands[price.bands.length - 1].count}.
          </p>
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

        <ReferenceClusterNav currentPath={KIDS_PRICE_PATH} lang={lang} />
        <footer className="border-t border-slate-200 pt-6 text-xs text-slate-500 leading-6">
          {d.source.note}
          <span className="sr-only"> {KIDS_PRICE_PATH}</span>
        </footer>
      </div>
    </article>
  );
}

export { buildKidsPriceDatasetSchema };
