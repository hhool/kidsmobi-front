/**
 * /kids-scooter-by-age/ — component.
 *
 * Copy lives in src/data/kidsScooterAge.ts; see KidsScooterWheels.tsx for why
 * no prose is shared between these pages.
 */
import { Baby, CalendarRange, Split, AlertTriangle, Table2 } from "lucide-react";
import { SectionHeading, CoverageRow, ScooterTable, GapNote, StatedNote, AssetPage } from "./ScooterAssetPage";
import {
  kidsScooterAgeStrings,
  kidsScooterAgeColumns,
  kidsScooterAgeVars,
  KIDS_SCOOTER_AGE_PATH,
  SCOOTER_DATASET,
} from "../data/kidsScooterAge";

const d = SCOOTER_DATASET;
const total = d.totals.kidsScooters;
const labels = kidsScooterAgeVars;

export default function KidsScooterAge({ lang = "en" }: { lang?: "zh" | "en" }) {
  const t = kidsScooterAgeStrings[lang];
  const vars: Record<string, unknown> = { ...kidsScooterAgeVars, total };

  return (
    <AssetPage
      eyebrow={t.eyebrow}
      title={t.h1}
      lead={t.lead}
      vars={vars}
      provenance={{ title: t.methodTitle, body: t.methodBody }}
    >
      <section className="space-y-4">
        <SectionHeading icon={CalendarRange} title={t.labelsTitle} lead={t.labelsLead} />
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <tbody>
              <CoverageRow label="Any age wording" n={d.totals.withAgeLabel} of={total} />
              <CoverageRow
                label="Carries a number"
                n={d.totals.withNumericAge}
                of={total}
                tone="amber"
              />
              <CoverageRow
                label="Words only, no number"
                n={total - d.totals.withNumericAge}
                of={total}
                tone="amber"
              />
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Split} title={t.crossTitle} lead={t.crossLead} />
        <StatedNote>
          <p>{t.crossThree}</p>
          <p>{t.crossTwo}</p>
        </StatedNote>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={AlertTriangle} title={t.gapTitle} lead={t.gapLead} />
        <GapNote>
          <p>
            <strong>{t.gapNumeric}</strong>
          </p>
          <p>
            <strong>{t.gapUpper}</strong>
          </p>
          <p>
            <strong>{t.gapOverlap}</strong>
          </p>
        </GapNote>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Baby} title={t.rosterTitle} lead={t.rosterLead} />
        <ScooterTable
          columns={kidsScooterAgeColumns(t)}
          rows={d.rows}
          emptyCell={t.notStated}
          caption={t.rosterTitle}
        />
      </section>
    </AssetPage>
  );
}

export { KIDS_SCOOTER_AGE_PATH };