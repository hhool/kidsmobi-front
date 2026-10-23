/**
 * /kids-tricycle-what-buyers-say/ — component. H2 wording is tricycle-specific
 * and differs from the ride-on feedback page on purpose (pair-drift guard).
 */
import { MessageSquare, Star, Tags, AlertTriangle, Table2 } from "lucide-react";
import {
  SectionHeading,
  ClusterTable,
  GapNote,
  StatedNote,
  AssetPage,
  templateVars,
  clusterLabel,
} from "./ClusterAssetPage";
import {
  kidsTricycleFeedbackStrings,
  kidsTricycleFeedbackColumns,
  kidsTricycleFeedbackVars,
  KIDS_TRICYCLE_FEEDBACK_PATH,
  TRICYCLE_DATASET,
} from "../data/kidsTricycleFeedback";

const d = TRICYCLE_DATASET;
const total = d.totals.tricycles;

export default function KidsTricycleFeedback({ lang = "en" }: { lang?: "zh" | "en" }) {
  const t = kidsTricycleFeedbackStrings[lang];
  const vars: Record<string, unknown> = { ...kidsTricycleFeedbackVars, total };

  return (
    <AssetPage
      eyebrow={t.eyebrow}
      title={t.h1}
      lead={t.lead}
      vars={vars}
      provenance={{ title: t.methodTitle, body: t.methodBody }}
    >
      <section className="space-y-4">
        <SectionHeading icon={Star} title={t.ratingTitle} lead={t.ratingLead} />
        <StatedNote>
          <p>{t.ratingNote}</p>
        </StatedNote>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Tags} title={t.themeTitle} lead={t.themeIntro} />
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="py-3 px-4 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                  {t.themeColTopic}
                </th>
                <th className="py-3 px-4 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 text-right">
                  {t.themeColCount}
                </th>
                <th className="py-3 px-4 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                  {t.themeColWho}
                </th>
              </tr>
            </thead>
            <tbody>
              {kidsTricycleFeedbackVars.themes.map((row) => (
                <tr key={row.theme} className="border-t border-slate-100">
                  <td className="py-3 px-4 text-sm text-slate-700">{row.theme}</td>
                  <td className="py-3 px-4 text-sm font-bold text-slate-900 text-right tabular-nums">
                    {row.count} / {total}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-500">{row.labels}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Tags} title={t.hedgeTitle} lead={t.hedgeLead} />
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="py-3 px-4 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                  {t.hedgeColKind}
                </th>
                <th className="py-3 px-4 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 text-right">
                  {t.hedgeColCount}
                </th>
                <th className="py-3 px-4 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                  {t.hedgeColWho}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-slate-100">
                <td className="py-3 px-4 text-sm text-slate-700">{t.hedgeMixed}</td>
                <td className="py-3 px-4 text-sm font-bold text-slate-900 text-right tabular-nums">
                  {kidsTricycleFeedbackVars.mixedCount} / {total}
                </td>
                <td className="py-3 px-4 text-sm text-slate-500">{t.hedgeColWho}</td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="py-3 px-4 text-sm text-slate-700">{t.hedgeMissing}</td>
                <td className="py-3 px-4 text-sm font-bold text-slate-900 text-right tabular-nums">
                  {total - kidsTricycleFeedbackVars.withSummary} / {total}
                </td>
                <td className="py-3 px-4 text-sm text-slate-500">{t.hedgeColWho}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={AlertTriangle} title={t.gapTitle} lead={t.gapLead} />
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
        <SectionHeading icon={Table2} title={t.listingTitle} lead={t.listingLead} />
        <ClusterTable
          columns={kidsTricycleFeedbackColumns(t)}
          rows={d.rows as never}
          emptyCell={t.notStated}
          caption={t.listingTitle}
        />
      </section>
    </AssetPage>
  );
}

export { KIDS_TRICYCLE_FEEDBACK_PATH };
