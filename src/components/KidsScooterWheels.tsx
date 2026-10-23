/**
 * /kids-scooter-wheels/ — component.
 *
 * Prose lives in src/data/kidsScooterWheels.ts. Layout primitives come from
 * ScooterAssetPage.tsx. Neither is shared with the other seven scooter pages,
 * which is deliberate: check-topic-pair-drift.mjs compares each page's <h2>
 * word-bag and body 8-grams against its seven siblings and against the
 * balance-bike page of the same name, and hoisting copy into the shared module
 * is precisely what would trip it.
 */
import {
  Table2,
  Split,
  CircleDot,
  Bike,
  AlertTriangle,
} from "lucide-react";
import {
  SectionHeading,
  CoverageRow,
  ScooterTable,
  GapNote,
  AssetPage,
} from "./ScooterAssetPage";
import {
  kidsScooterWheelsStrings,
  kidsScooterWheelsColumns,
  kidsScooterWheelsVars,
  KIDS_SCOOTER_WHEELS_PATH,
  SCOOTER_DATASET,
} from "../data/kidsScooterWheels";

const d = SCOOTER_DATASET;
const total = d.totals.kidsScooters;

export default function KidsScooterWheels({ lang = "en" }: { lang?: "zh" | "en" }) {
  const t = kidsScooterWheelsStrings[lang];
  const vars: Record<string, unknown> = { ...kidsScooterWheelsVars, total };

  return (
    <AssetPage
      eyebrow={t.eyebrow}
      title={t.h1}
      lead={t.lead}
      vars={vars}
      provenance={{ title: t.methodTitle, body: t.methodBody }}
    >
      <section className="space-y-4">
        <SectionHeading icon={Split} title={t.splitTitle} lead={t.splitLead} />
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <tbody>
              <CoverageRow label="Two wheels" n={d.wheels.two} of={total} />
              <CoverageRow label="Three wheels" n={d.wheels.three} of={total} />
              <CoverageRow label="Not stated" n={d.wheels.unstated} of={total} tone="amber" />
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={CircleDot} title={t.twoTitle} lead={t.twoLead} />
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Bike} title={t.threeTitle} lead={t.threeLead} />
      </section>

      <section className="space-y-4">
        <SectionHeading icon={AlertTriangle} title={t.gapTitle} lead={t.gapLead} />
        <GapNote>
          <p>
            <strong>{t.gapWheelCount}</strong>
          </p>
          <p>
            <strong>{t.gapBrake}</strong>
          </p>
          <p>
            <strong>{t.gapSuspension}</strong>
          </p>
        </GapNote>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Table2} title={t.rosterTitle} lead={t.rosterLead} />
        <ScooterTable
          columns={kidsScooterWheelsColumns(t)}
          rows={d.rows}
          emptyCell={t.notStated}
          caption={t.rosterTitle}
        />
      </section>
    </AssetPage>
  );
}

export { KIDS_SCOOTER_WHEELS_PATH };