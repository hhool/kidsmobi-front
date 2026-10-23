/**
 * /kids-scooter-weight/ — component.
 *
 * Copy lives in src/data/kidsScooterWeight.ts; see KidsScooterWheels.tsx for why
 * no prose is shared between these pages.
 */
import { Weight, Gauge, AlertTriangle, Table2 } from "lucide-react";
import { SectionHeading, CoverageRow, ScooterTable, GapNote, AssetPage } from "./ScooterAssetPage";
import {
  kidsScooterWeightStrings,
  kidsScooterWeightColumns,
  kidsScooterWeightVars,
  KIDS_SCOOTER_WEIGHT_PATH,
  SCOOTER_DATASET,
} from "../data/kidsScooterWeight";

const d = SCOOTER_DATASET;
const total = d.totals.kidsScooters;

export default function KidsScooterWeight({ lang = "en" }: { lang?: "zh" | "en" }) {
  const t = kidsScooterWeightStrings[lang];
  const vars: Record<string, unknown> = { ...kidsScooterWeightVars, total };

  return (
    <AssetPage
      eyebrow={t.eyebrow}
      title={t.h1}
      lead={t.lead}
      vars={vars}
      provenance={{ title: t.methodTitle, body: t.methodBody }}
    >
      <section className="space-y-4">
        <SectionHeading icon={Weight} title={t.ownTitle} lead={t.ownLead} />
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <tbody>
              <CoverageRow label="Scooter weight stated" n={d.totals.withItemWeight} of={total} />
              <CoverageRow
                label="Rider limit stated"
                n={d.totals.withWeightLimit}
                of={total}
                tone="amber"
              />
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Gauge} title={t.limitTitle} lead={t.limitLead} />
      </section>

      <section className="space-y-4">
        <SectionHeading icon={AlertTriangle} title={t.gapTitle} lead={t.gapLead} />
        <GapNote>
          <p>
            <strong>{t.gapAge}</strong>
          </p>
          <p>
            <strong>{t.gapUnits}</strong>
          </p>
          <p>
            <strong>{t.gapMissing}</strong>
          </p>
        </GapNote>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Table2} title={t.rosterTitle} lead={t.rosterLead} />
        <ScooterTable
          columns={kidsScooterWeightColumns(t)}
          rows={d.rows}
          emptyCell={t.notStated}
          caption={t.rosterTitle}
        />
      </section>
    </AssetPage>
  );
}

export { KIDS_SCOOTER_WEIGHT_PATH };