/**
 * /kids-ride-on-size/ — component.
 *
 * Copy lives in src/data/kidsRideOnSize.ts; see KidsRideOnVoltage.tsx for why
 * no prose is shared between these pages.
 */
import { Ruler, DoorOpen, SquareStack, AlertTriangle, Table2 } from "lucide-react";
import { SectionHeading, CoverageRow, RideOnTable, GapNote, AssetPage } from "./RideOnAssetPage";
import {
  kidsRideOnSizeStrings,
  kidsRideOnSizeColumns,
  kidsRideOnSizeVars,
  KIDS_RIDE_ON_SIZE_PATH,
  RIDE_ON_DATASET,
} from "../data/kidsRideOnSize";

const d = RIDE_ON_DATASET;
const total = d.totals.rideOnCars;

export default function KidsRideOnSize({ lang = "en" }: { lang?: "zh" | "en" }) {
  const t = kidsRideOnSizeStrings[lang];
  const vars: Record<string, unknown> = { ...kidsRideOnSizeVars, total };

  return (
    <AssetPage
      eyebrow={t.eyebrow}
      title={t.h1}
      lead={t.lead}
      vars={vars}
      provenance={{ title: t.methodTitle, body: t.methodBody }}
    >
      <section className="space-y-4">
        <SectionHeading icon={Ruler} title={t.fieldTitle} lead={t.fieldLead} />
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <tbody>
              <CoverageRow label="Length stated" n={d.totals.withDimensions} of={total} />
              <CoverageRow label="Size field held a voltage" n={kidsRideOnSizeVars.fieldKinds.voltage} of={total} tone="amber" />
              <CoverageRow label="Size field held a dimension" n={kidsRideOnSizeVars.fieldKinds.dimensions} of={total} tone="amber" />
              <CoverageRow label="Size field held a word" n={kidsRideOnSizeVars.fieldKinds.adjective} of={total} tone="amber" />
              <CoverageRow label="Size field was empty" n={kidsRideOnSizeVars.fieldKinds.empty} of={total} tone="amber" />
            </tbody>
          </table>
        </div>
        <div className="space-y-3 text-sm text-slate-700 leading-7">
          <p>{t.fieldVoltage}</p>
          <p>{t.fieldDimensions}</p>
          <p>{t.fieldAdjective}</p>
          <p>{t.fieldEmpty}</p>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={SquareStack} title={t.rangeTitle} lead={t.rangeLead} />
        <div className="space-y-3 text-sm text-slate-700 leading-7">
          <p>{t.rangeLongest}</p>
          <p>{t.rangeWidest}</p>
          <p>{t.rangeTallest}</p>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={DoorOpen} title={t.doorTitle} lead={t.doorLead} />
        <SectionHeading icon={SquareStack} title={t.tierTitle} lead={t.tierLead} />
      </section>

      <section className="space-y-4">
        <SectionHeading icon={AlertTriangle} title={t.gapTitle} lead={t.gapLead} />
        <GapNote>
          <p>
            <strong>{t.gapAssembly}</strong>
          </p>
          <p>
            <strong>{t.gapFold}</strong>
          </p>
          <p>
            <strong>{t.gapTires}</strong>
          </p>
        </GapNote>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Table2} title={t.rosterTitle} lead={t.rosterLead} />
        <RideOnTable
          columns={kidsRideOnSizeColumns(t)}
          rows={d.rows}
          emptyCell={t.notStated}
          caption={t.rosterTitle}
        />
      </section>
    </AssetPage>
  );
}

export { KIDS_RIDE_ON_SIZE_PATH };
