/**
 * /kids-ride-on-what-buyers-say/ — component.
 *
 * Copy lives in src/data/kidsRideOnFeedback.ts; see KidsRideOnVoltage.tsx for
 * why no prose is shared between these pages.
 */
import { Megaphone, Quote, ThumbsUp, Table2, ShieldQuestion } from "lucide-react";
import { SectionHeading, RideOnTable, StatedNote, GapNote, AssetPage } from "./RideOnAssetPage";
import {
  kidsRideOnFeedbackStrings,
  kidsRideOnFeedbackColumns,
  kidsRideOnFeedbackVars,
  KIDS_RIDE_ON_FEEDBACK_PATH,
  RIDE_ON_DATASET,
} from "../data/kidsRideOnFeedback";

const d = RIDE_ON_DATASET;
const total = d.totals.rideOnCars;
const { themes, hedges } = kidsRideOnFeedbackVars;

/** Hedge row labels come from the string module so the copy stays in one file. */
const hedgeRows = (t: typeof kidsRideOnFeedbackStrings.en) => [
  { key: "qualified", kind: t.hedgeQualified, ...hedges.qualified },
  { key: "mixed", kind: t.hedgeMixed, ...hedges.mixed },
  { key: "drawback", kind: t.hedgeDrawback, ...hedges.drawback },
];

export default function KidsRideOnFeedback({ lang = "en" }: { lang?: "zh" | "en" }) {
  const t = kidsRideOnFeedbackStrings[lang];
  const vars: Record<string, unknown> = { ...kidsRideOnFeedbackVars, total };
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
        <SectionHeading icon={ThumbsUp} title={t.ratingTitle} lead={t.ratingLead} />
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
                    {row.count} / {total}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600">{row.labels.join(", ")}</td>
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
                    {row.count} / {total}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600">
                    {row.labels.length ? row.labels.join(", ") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Quote} title={t.gapTitle} lead={t.gapLead} />
        <GapNote>
          <p>
            <strong>{t.gapNoSummary}</strong>
          </p>
          <p>
            <strong>{t.gapNoText}</strong>
          </p>
        </GapNote>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Table2} title={t.listingTitle} />
        <RideOnTable
          columns={kidsRideOnFeedbackColumns(t)}
          rows={d.rows}
          emptyCell="—"
          caption={t.listingTitle}
        />
      </section>
    </AssetPage>
  );
}

export { KIDS_RIDE_ON_FEEDBACK_PATH };
