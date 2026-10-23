/**
 * /kids-stroller-by-age/ — component. See KidsStrollerSize.tsx for the guard
 * rationale; prose is per-page and not shared.
 */
import { Baby, CalendarDays, ArrowUpRight, TriangleAlert, Table2 } from "lucide-react";
import {
  SectionHeading,
  CoverageRow,
  ClusterTable,
  GapNote,
  AssetPage,
} from "./ClusterAssetPage";
import {
  kidsStrollerAgeStrings,
  kidsStrollerAgeColumns,
  kidsStrollerAgeVars,
  KIDS_STROLLER_AGE_PATH,
  STROLLER_DATASET,
} from "../data/kidsStrollerAge";

const d = STROLLER_DATASET;
const total = d.totals.strollers;

export default function KidsStrollerAge({ lang = "en" }: { lang?: "zh" | "en" }) {
  const t = kidsStrollerAgeStrings[lang];
  const vars: Record<string, unknown> = { ...kidsStrollerAgeVars, total };

  return (
    <AssetPage
      eyebrow={t.eyebrow}
      title={t.h1}
      lead={t.lead}
      vars={vars}
      provenance={{ title: t.methodTitle, body: t.methodBody }}
    >
      <section className="space-y-4">
        <SectionHeading icon={Baby} title={t.labelTitle} lead={t.labelLead} />
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <tbody>
              <CoverageRow label="Usable age floor stated" n={d.totals.withAgeLabel} of={total} />
              <CoverageRow label="Number printed in label" n={d.totals.withNumericAge} of={total} tone="amber" />
              <CoverageRow label="Label is a word only" n={total - d.totals.withAgeLabel} of={total} tone="amber" />
              <CoverageRow label="Upper age limit stated" n={0} of={total} tone="amber" />
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={CalendarDays} title={t.floorTitle} lead={t.floorLead} />
        <div className="space-y-3 text-sm text-slate-700 leading-7">
          <p>{t.labelLabelled}</p>
          <p>{t.labelNumeric}</p>
          <p>{t.labelWord}</p>
          <p>{t.floorZero}</p>
          <p>{t.floorSix}</p>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={ArrowUpRight} title={t.ceilingTitle} lead={t.ceilingLead} />
        <div className="space-y-3 text-sm text-slate-700 leading-7">
          <p>{t.ceilingAbsent}</p>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={TriangleAlert} title={t.gapTitle} lead={t.gapLead} />
        <GapNote>
          <p>
            <strong>{t.gapCeiling}</strong>
          </p>
          <p>
            <strong>{t.gapWord}</strong>
          </p>
          <p>
            <strong>{t.gapWeight}</strong>
          </p>
        </GapNote>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Table2} title={t.rosterTitle} lead={t.rosterLead} />
        <ClusterTable
          columns={kidsStrollerAgeColumns(t)}
          rows={d.rows as never}
          emptyCell={t.notStated}
          caption={t.rosterTitle}
        />
      </section>
    </AssetPage>
  );
}

export { KIDS_STROLLER_AGE_PATH };
