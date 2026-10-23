/**
 * /kids-tricycle-by-age/ — component. H2 wording is tricycle-specific and
 * differs from the ride-on age page on purpose (pair-drift guard).
 */
import { CalendarDays, Baby, ArrowUpRight, AlertTriangle, Table2 } from "lucide-react";
import {
  SectionHeading,
  CoverageRow,
  ClusterTable,
  GapNote,
  StatedNote,
  AssetPage,
  templateVars,
  clusterLabel,
} from "./ClusterAssetPage";
import {
  kidsTricycleAgeStrings,
  kidsTricycleAgeColumns,
  kidsTricycleAgeVars,
  KIDS_TRICYCLE_AGE_PATH,
  TRICYCLE_DATASET,
} from "../data/kidsTricycleAge";

const d = TRICYCLE_DATASET;
const total = d.totals.tricycles;

export default function KidsTricycleAge({ lang = "en" }: { lang?: "zh" | "en" }) {
  const t = kidsTricycleAgeStrings[lang];
  const vars: Record<string, unknown> = { ...kidsTricycleAgeVars, total };

  return (
    <AssetPage
      eyebrow={t.eyebrow}
      title={t.h1}
      lead={t.lead}
      vars={vars}
      provenance={{ title: t.methodTitle, body: t.methodBody }}
    >
      <section className="space-y-4">
        <SectionHeading icon={CalendarDays} title={t.labelTitle} lead={t.labelLead} />
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <tbody>
              <CoverageRow label="Carries an age label" n={kidsTricycleAgeVars.labelled} of={total} />
              <CoverageRow
                label="Label carries a number"
                n={kidsTricycleAgeVars.numeric}
                of={total}
                tone="amber"
              />
              <CoverageRow
                label="Label is a word only"
                n={kidsTricycleAgeVars.wordOnly}
                of={total}
                tone="amber"
              />
              <CoverageRow
                label="No age label"
                n={kidsTricycleAgeVars.unlabelled}
                of={total}
                tone="amber"
              />
            </tbody>
          </table>
        </div>
        <div className="space-y-3 text-sm text-slate-700 leading-7">
          <p>{t.labelNumeric}</p>
          <p>{t.labelWord}</p>
          <p>{t.labelNone}</p>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Baby} title={t.floorTitle} lead={t.floorLead} />
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <tbody>
              {kidsTricycleAgeVars.minBuckets.map((b) => (
                <CoverageRow key={b.months} label={`Starts at ${b.months} months`} n={b.count} of={total} />
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-3 text-sm text-slate-700 leading-7">
          <p>{t.floorModal}</p>
          <p>{t.floorSpread}</p>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={ArrowUpRight} title={t.ceilingTitle} lead={t.ceilingLead} />
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <tbody>
              {kidsTricycleAgeVars.maxBuckets.map((b) => (
                <CoverageRow key={b.months} label={`Ends at ${b.months} months`} n={b.count} of={total} />
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-3 text-sm text-slate-700 leading-7">
          <p>{t.ceilingModal}</p>
          <p>{t.ceilingGap}</p>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={AlertTriangle} title={t.gapTitle} lead={t.gapLead} />
        <GapNote>
          <p>
            <strong>{t.gapNoLabel}</strong>
          </p>
          <p>
            <strong>{t.gapCeiling}</strong>
          </p>
        </GapNote>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Table2} title={t.rosterTitle} lead={t.rosterLead} />
        <ClusterTable
          columns={kidsTricycleAgeColumns(t)}
          rows={d.rows as never}
          emptyCell={t.notStated}
          caption={t.rosterTitle}
        />
      </section>
    </AssetPage>
  );
}

export { KIDS_TRICYCLE_AGE_PATH };
