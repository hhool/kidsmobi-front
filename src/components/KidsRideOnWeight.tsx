/**
 * /kids-ride-on-weight/ — component.
 *
 * Copy lives in src/data/kidsRideOnWeight.ts; see KidsRideOnVoltage.tsx for why
 * no prose is shared between these pages.
 */
import { Scale, Users, AlertTriangle, Table2 } from "lucide-react";
import { SectionHeading, CoverageRow, RideOnTable, GapNote, AssetPage } from "./RideOnAssetPage";
import {
  kidsRideOnWeightStrings,
  kidsRideOnWeightColumns,
  kidsRideOnWeightVars,
  KIDS_RIDE_ON_WEIGHT_PATH,
  RIDE_ON_DATASET,
} from "../data/kidsRideOnWeight";

const d = RIDE_ON_DATASET;
const total = d.totals.rideOnCars;

export default function KidsRideOnWeight({ lang = "en" }: { lang?: "zh" | "en" }) {
  const t = kidsRideOnWeightStrings[lang];
  const vars: Record<string, unknown> = { ...kidsRideOnWeightVars, total };

  return (
    <AssetPage
      eyebrow={t.eyebrow}
      title={t.h1}
      lead={t.lead}
      vars={vars}
      provenance={{ title: t.methodTitle, body: t.methodBody }}
    >
      <section className="space-y-4">
        <SectionHeading icon={Scale} title={t.ownTitle} lead={t.ownLead} />
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <tbody>
              <CoverageRow label="Car weight stated" n={d.totals.withItemWeight} of={total} />
              <CoverageRow label="Rider limit stated" n={d.totals.withWeightLimit} of={total} />
              <CoverageRow label="Both published" n={kidsRideOnWeightVars.pairs.length} of={total} />
              <CoverageRow label="Car weight only" n={kidsRideOnWeightVars.halves.weightOnly.length} of={total} tone="amber" />
              <CoverageRow label="Rider limit only" n={kidsRideOnWeightVars.halves.limitOnly.length} of={total} tone="amber" />
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Users} title={t.ratioTitle} lead={t.ratioLead} />
        <div className="space-y-3 text-sm text-slate-700 leading-7">
          <p>{t.ratioTight}</p>
          <p>{t.ratioWide}</p>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={AlertTriangle} title={t.gapTitle} lead={t.gapLead} />
        <GapNote>
          <p>
            <strong>{t.gapPairs}</strong>
          </p>
          <p>
            <strong>{t.gapHalves}</strong>
          </p>
          <p>
            <strong>{t.gapUnits}</strong>
          </p>
          <p>
            <strong>{t.gapStorage}</strong>
          </p>
        </GapNote>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Table2} title={t.rosterTitle} lead={t.rosterLead} />
        <RideOnTable
          columns={kidsRideOnWeightColumns(t)}
          rows={d.rows}
          emptyCell={t.notStated}
          caption={t.rosterTitle}
        />
      </section>
    </AssetPage>
  );
}

export { KIDS_RIDE_ON_WEIGHT_PATH };
