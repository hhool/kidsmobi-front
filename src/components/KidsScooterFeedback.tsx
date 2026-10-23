/**
 * /kids-scooter-what-buyers-say/ — component.
 *
 * Copy lives in src/data/kidsScooterFeedback.ts; see KidsScooterWheels.tsx for
 * why no prose is shared between these pages.
 */
import { Megaphone, Quote, ThumbsUp, Table2, ShieldQuestion } from "lucide-react";
import { SectionHeading, ScooterTable, StatedNote, AssetPage } from "./ScooterAssetPage";
import {
  kidsScooterFeedbackStrings,
  kidsScooterFeedbackColumns,
  kidsScooterFeedbackVars,
  KIDS_SCOOTER_FEEDBACK_PATH,
  SCOOTER_DATASET,
} from "../data/kidsScooterFeedback";

const d = SCOOTER_DATASET;
const total = d.totals.kidsScooters;
const { themes, hedges } = kidsScooterFeedbackVars;

/** Hedge row labels come from the string module so the copy stays in one file. */
const hedgeRows = (t: typeof kidsScooterFeedbackStrings.en) => [
  { key: "qualified", kind: t.hedgeQualified, ...hedges.qualified },
  { key: "mixed", kind: t.hedgeMixed, ...hedges.mixed },
  { key: "drawback", kind: t.hedgeDrawback, ...hedges.drawback },
];

export default function KidsScooterFeedback({ lang = "en" }: { lang?: "zh" | "en" }) {
  const t = kidsScooterFeedbackStrings[lang];
  const vars: Record<string, unknown> = { ...kidsScooterFeedbackVars, total };
  const hedgesByKind = hedgeRows(t);

  return (
    <AssetPage
      eyebrow={t.eyebrow}
      title={t.h1}
      lead={t.lead}
      vars={vars}
      provenance={{ title: t.provenanceTitle, body: t.provenanceBody }}
    >
      <section className="space-y-4">
        <SectionHeading icon={Quote} title={t.ratingTitle} lead={t.ratingLead} />
        <StatedNote>
          <p>{t.ratingNote}</p>
        </StatedNote>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Megaphone} title={t.themeTitle} lead={t.themeIntro} />
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="py-3 px-4 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                  {t.themeColTopic}
                </th>
                <th className="py-3 px-4 text-right text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                  {t.themeColCount}
                </th>
                <th className="py-3 px-4 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                  {t.themeColWho}
                </th>
              </tr>
            </thead>
            <tbody>
              {themes.map((row) => (
                <tr key={row.theme} className="border-t border-slate-100">
                  <td className="py-3 px-4 text-sm capitalize text-slate-700">{row.theme}</td>
                  <td className="py-3 px-4 text-sm tabular-nums text-right font-bold text-slate-900">
                    {row.count} / {d.totals.kidsScooters}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600">{row.brands.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={ShieldQuestion} title={t.hedgeTitle} lead={t.hedgeLead} />
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="py-3 px-4 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                  {t.hedgeColKind}
                </th>
                <th className="py-3 px-4 text-right text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                  {t.hedgeColCount}
                </th>
                <th className="py-3 px-4 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                  {t.hedgeColWho}
                </th>
              </tr>
            </thead>
            <tbody>
              {hedgesByKind.map((row) => (
                <tr key={row.key} className="border-t border-slate-100">
                  <td className="py-3 px-4 text-sm text-slate-700">{row.kind}</td>
                  <td className="py-3 px-4 text-sm tabular-nums text-right font-bold text-slate-900">
                    {row.count} / {d.totals.kidsScooters}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600">
                    {row.brands.length ? row.brands.join(", ") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Table2} title={t.listingTitle} />
        <ScooterTable
          columns={kidsScooterFeedbackColumns(t)}
          rows={d.rows}
          emptyCell="—"
          caption={t.listingTitle}
        />
      </section>

      <section className="space-y-3">
        <SectionHeading icon={ThumbsUp} title={t.methodTitle} />
        <div className="space-y-3 text-sm text-slate-600 leading-7 max-w-3xl">
          {t.methodBody.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </section>
    </AssetPage>
  );
}

export { KIDS_SCOOTER_FEEDBACK_PATH };