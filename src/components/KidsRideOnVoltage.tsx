/**
 * /kids-ride-on-voltage/ — component.
 *
 * Prose lives in src/data/kidsRideOnVoltage.ts. Layout primitives come from
 * RideOnAssetPage.tsx. Neither is shared with the other seven ride-on pages,
 * which is deliberate: check-topic-pair-drift.mjs compares each page's <h2>
 * word-bag and body 8-grams against its seven siblings and against the
 * balance-bike, kids-bike and kids-scooter pages of the same name, and hoisting
 * copy into a shared module is precisely what would trip it.
 */
import { BatteryCharging, Zap, Armchair, AlertTriangle, Table2 } from "lucide-react";
import { SectionHeading, CoverageRow, RideOnTable, GapNote, AssetPage } from "./RideOnAssetPage";
import {
  kidsRideOnVoltageStrings,
  kidsRideOnVoltageColumns,
  kidsRideOnVoltageVars,
  KIDS_RIDE_ON_VOLTAGE_PATH,
  RIDE_ON_DATASET,
} from "../data/kidsRideOnVoltage";

const d = RIDE_ON_DATASET;
const total = d.totals.rideOnCars;

export default function KidsRideOnVoltage({ lang = "en" }: { lang?: "zh" | "en" }) {
  const t = kidsRideOnVoltageStrings[lang];
  const vars: Record<string, unknown> = { ...kidsRideOnVoltageVars, total };

  return (
    <AssetPage
      eyebrow={t.eyebrow}
      title={t.h1}
      lead={t.lead}
      vars={vars}
      provenance={{ title: t.methodTitle, body: t.methodBody }}
    >
      <section className="space-y-4">
        <SectionHeading icon={BatteryCharging} title={t.sourceTitle} lead={t.sourceLead} />
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <tbody>
              <CoverageRow label="Voltage stated" n={d.totals.withVoltage} of={total} />
              <CoverageRow label="In the specification field" n={d.totals.voltageFromSpec} of={total} />
              <CoverageRow label="In the product title only" n={d.totals.voltageFromTitle} of={total} tone="amber" />
              <CoverageRow label="Seat count stated" n={d.totals.withSeats} of={total} tone="amber" />
              <CoverageRow label="Battery life stated" n={d.totals.withBatteryLife} of={total} tone="amber" />
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Zap} title={t.tierTitle} lead={t.tierLead} />
        <div className="space-y-3 text-sm text-slate-700 leading-7">
          <p>{t.tierSix}</p>
          <p>{t.tierTwelve}</p>
          <p>{t.tierTwentyFour}</p>
          <p>{t.tierThirtySix}</p>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Armchair} title={t.seatsTitle} lead={t.seatsLead} />
      </section>

      <section className="space-y-4">
        <SectionHeading icon={AlertTriangle} title={t.gapTitle} lead={t.gapLead} />
        <GapNote>
          <p>
            <strong>{t.gapSource}</strong>
          </p>
          <p>
            <strong>{t.gapPrice}</strong>
          </p>
          <p>
            <strong>{t.gapRuntime}</strong>
          </p>
        </GapNote>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Table2} title={t.rosterTitle} lead={t.rosterLead} />
        <RideOnTable
          columns={kidsRideOnVoltageColumns(t)}
          rows={d.rows}
          emptyCell={t.notStated}
          caption={t.rosterTitle}
        />
      </section>
    </AssetPage>
  );
}

export { KIDS_RIDE_ON_VOLTAGE_PATH };
