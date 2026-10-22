import { Ruler, Database, Calendar, Scale, ShieldCheck, Info, ExternalLink } from "lucide-react";
import {
  formatAge,
  formatInches,
  formatPrice,
  formatSteering,
  formatWeight,
  kidsBikeSizingDataset,
  kidsBikeSizingStrings,
  type KidsBikeSizingBike,
  KIDS_SIZING_PATH,
} from "../data/kidsBikeSizing";
import { credibleReviewCount } from "../lib/reviewSignal";
import ReferenceClusterNav from "./ReferenceClusterNav";

type KidsBikeSizingProps = {
  lang?: "zh" | "en";
};

const shell = "max-w-5xl mx-auto py-8 sm:py-14 text-left px-4 sm:px-6";

function SectionHeading({ icon: Icon, title, lead }: { icon: typeof Ruler; title: string; lead: string }) {
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

function SpecRow({ bike }: { bike: KidsBikeSizingBike; key?: string }) {
  return (
    <tr className="border-b border-slate-100 align-top hover:bg-slate-50 transition-colors">
      <td className="py-3 pl-4 pr-3">
        <a
          href={bike.productUrl}
          className="text-sm font-semibold text-slate-900 hover:text-orange-600 transition-colors"
        >
          {bike.brand || "—"}
        </a>
        <div className="mt-0.5 max-w-[220px] text-xs text-slate-500 leading-5">
          {bike.name.replace(/^[^,]+,\s*/, "").slice(0, 90)}
        </div>
      </td>
      <td className="py-3 pr-3 whitespace-nowrap text-sm font-bold text-slate-700">{formatAge(bike)}</td>
      <td className="py-3 pr-3 whitespace-nowrap text-sm text-slate-700">{formatInches(bike.wheelInches)}</td>
      <td className="py-3 pr-3 whitespace-nowrap text-sm text-slate-700">{formatWeight(bike.weightLbs)}</td>
      <td className="py-3 pr-3 whitespace-nowrap text-sm text-slate-700">{formatSteering(bike.steeringLimitDeg)}</td>
      <td className="py-3 pr-3 text-xs text-slate-600 max-w-[140px]">{bike.frameMaterial || "—"}</td>
      <td className="py-3 pr-3 whitespace-nowrap text-sm font-bold text-slate-900">{formatPrice(bike.priceUsd)}</td>
      <td className="py-3 pr-4 whitespace-nowrap text-sm text-slate-700">
        {bike.rating != null ? `${bike.rating.toFixed(1)} ★` : "—"}
        <div className="text-[10px] font-normal text-slate-400">
          {credibleReviewCount(bike.reviewCount)?.toLocaleString("en-US") ?? ""}
        </div>
      </td>
    </tr>
  );
}

export function KidsBikeSizing({ lang = "en" }: KidsBikeSizingProps) {
  const d = kidsBikeSizingDataset;
  const t = kidsBikeSizingStrings[lang || "en"];
  const ageMin = d.ageSpreadMonths.min;
  const ageMax = d.ageSpreadMonths.max;
  const ageSpread =
    ageMin != null && ageMax != null
      ? `${Math.floor(ageMin / 12) > 0 ? `${Math.floor(ageMin / 12)}–` : `${ageMin} mo–`}${Math.ceil(ageMax / 12)} yr`
      : "—";

  return (
    <article className={shell}>
      <div className="space-y-10">
        <header className="space-y-5 border-b border-slate-200 pb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-orange-600">
            <Ruler className="w-3.5 h-3.5" />
            {t.eyebrow}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-950 leading-tight max-w-4xl">{t.heroTitle}</h1>
          <p className="text-base sm:text-lg text-slate-600 leading-8 font-medium max-w-3xl">{t.heroLead}</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-slate-400" />
              {t.retrievedLabel}: {d.source.retrievedAt}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {t.ageSpreadLabel}: {ageSpread}
            </span>
            <span>
              {lang === "zh" ? "对比型号" : "Models compared"}: {d.totals.balanceBikesListed} ·{" "}
              {lang === "zh" ? "有轮径" : "with wheel size"}: {d.totals.withWheelSize} ·{" "}
              {lang === "zh" ? "有转向限制" : "with steering limit"}: {d.totals.withSteeringLimit}
            </span>
          </div>
          <p className="text-sm text-slate-500 leading-7 max-w-3xl">{t.heroNote}</p>
        </header>

        <section className="space-y-4">
          <SectionHeading icon={ShieldCheck} title={t.whyTitle} lead={t.whyBody} />
        </section>

        <section className="space-y-4">
          <SectionHeading
            icon={Ruler}
            title={t.tableTitle.replace("{count}", String(d.totals.balanceBikesListed))}
            lead={t.tableLead}
          />
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-slate-50">
                <tr className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                  <th className="py-3 pl-4 pr-3 font-black">{t.colBrand}</th>
                  <th className="py-3 pr-3 font-black">{t.colAge}</th>
                  <th className="py-3 pr-3 font-black">{t.colWheel}</th>
                  <th className="py-3 pr-3 font-black">{t.colWeight}</th>
                  <th className="py-3 pr-3 font-black">{t.colSteering}</th>
                  <th className="py-3 pr-3 font-black">{t.colFrame}</th>
                  <th className="py-3 pr-3 font-black">{t.colPrice}</th>
                  <th className="py-3 pr-4 font-black">{t.colRating}</th>
                </tr>
              </thead>
              <tbody>
                {d.bikes.map((bike) => (
                  <SpecRow key={bike.id} bike={bike} />
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4 border-t border-slate-200 pt-8">
          <SectionHeading icon={Database} title={t.methodTitle} lead="" />
          <ul className="space-y-2 pl-5 text-sm text-slate-600 leading-7 list-disc max-w-3xl">
            {t.methodBody.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-orange-200 bg-orange-50 p-5">
          <h2 className="flex items-center gap-2 text-base font-black text-slate-950">
            <Ruler className="w-4 h-4 text-orange-600" />
            {t.seatHeightTitle}
          </h2>
          <p className="mt-2 text-sm text-slate-700 leading-7">{t.seatHeightBody}</p>
        </section>

        <section className="space-y-4">
          <SectionHeading icon={Scale} title={t.weightRuleTitle} lead={t.weightRuleBody} />
        </section>

        <section className="space-y-4">
          <SectionHeading icon={Info} title={t.wheelByAgeTitle} lead={t.wheelByAgeBody} />
        </section>

        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="text-base font-black text-slate-950">{t.disclaimerTitle}</h2>
          <p className="mt-2 text-sm text-slate-700 leading-7">{t.disclaimerBody}</p>
        </section>

        <ReferenceClusterNav currentPath={KIDS_SIZING_PATH} lang={lang} />
        <footer className="border-t border-slate-200 pt-6 text-xs text-slate-400 leading-6">
          {lang === "zh" ? "数据来源" : "Source"}: {d.source.name} ({d.source.exportFile}) ·{" "}
          {t.retrievedLabel.toLowerCase()}: {d.source.retrievedAt}
        </footer>
      </div>
    </article>
  );
}

// React.lazy in App.tsx resolves the module default export; without this line
// the lazy chunk resolves to undefined and React throws #306 ("Element type
// is invalid") at hydration. The named export above is kept for direct imports.
export default KidsBikeSizing;
