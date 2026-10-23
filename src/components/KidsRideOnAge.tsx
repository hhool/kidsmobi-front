/**
 * /kids-ride-on-by-age/ — component.
 *
 * Copy lives in src/data/kidsRideOnAge.ts; see KidsRideOnVoltage.tsx for why no
 * prose is shared between these pages.
 */
import { Baby, CalendarRange, Users, AlertTriangle, Table2 } from "lucide-react";
import { SectionHeading, CoverageRow, RideOnTable, GapNote, AssetPage } from "./RideOnAssetPage";
import {
  kidsRideOnAgeStrings,
  kidsRideOnAgeColumns,
  kidsRideOnAgeVars,
  KIDS_RIDE_ON_AGE_PATH,
  RIDE_ON_DATASET,
} from "../data/kidsRideOnAge";

const d = RIDE_ON_DATASET;
const total = d.totals.rideOnCars;

export default function KidsRideOnAge({ lang = "en" }: { lang?: "zh" | "en" }) {
  const t = kidsRideOnAgeStrings[lang];
  const vars: Record<string, unknown> = { ...kidsRideOnAgeVars, total };

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
              <CoverageRow label="Carries an age label" n={kidsRideOnAgeVars.labels.labelled} of={total} />
              <CoverageRow label="Label contains a number" n={kidsRideOnAgeVars.labels.numeric} of={total} />
              <CoverageRow label="Label is a word only" n={kidsRideOnAgeVars.labels.wordOnly} of={total} tone="amber" />
              <CoverageRow label="No label at all" n={kidsRideOnAgeVars.labels.unlabelled} of={total} tone="amber" />
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
        <SectionHeading icon={CalendarRange} title={t.floorTitle} lead={t.floorLead} />
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <tbody>
              {kidsRideOnAgeVars.floors.buckets.map((b) => (
                <CoverageRow
                  key={b.months}
                  label={`${b.months} months`}
                  n={b.count}
                  of={total}
                  tone={b.months === 36 ? "sky" : "amber"}
                />
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
        <SectionHeading icon={Users} title={t.ceilingTitle} lead={t.ceilingLead} />
        <div className="space-y-3 text-sm text-slate-700 leading-7">
          <p>{t.ceilingTwelve}</p>
          <p>{t.ceilingImplausible}</p>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={CalendarRange} title={t.tierTitle} lead={t.tierLead} />
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
          <p>
            <strong>{t.gapWeight}</strong>
          </p>
        </GapNote>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Table2} title={t.rosterTitle} lead={t.rosterLead} />
        <RideOnTable
          columns={kidsRideOnAgeColumns(t)}
          rows={d.rows}
          emptyCell={t.notStated}
          caption={t.rosterTitle}
        />
      </section>
    </AssetPage>
  );
}

export { KIDS_RIDE_ON_AGE_PATH };
