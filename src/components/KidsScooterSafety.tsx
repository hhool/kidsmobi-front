/**
 * /kids-scooter-safety-standards/ — component.
 *
 * Copy lives in src/data/kidsScooterSafety.ts; see KidsScooterWheels.tsx for why
 * no prose is shared between these pages.
 */
import { ShieldCheck, FileCheck, AlertTriangle, Table2 } from "lucide-react";
import { SectionHeading, CoverageRow, ScooterTable, GapNote, StatedNote, AssetPage } from "./ScooterAssetPage";
import {
  kidsScooterSafetyStrings,
  kidsScooterSafetyColumns,
  kidsScooterSafetyVars,
  KIDS_SCOOTER_SAFETY_PATH,
  SCOOTER_DATASET,
} from "../data/kidsScooterSafety";

const d = SCOOTER_DATASET;
const total = d.totals.kidsScooters;

export default function KidsScooterSafety({ lang = "en" }: { lang?: "zh" | "en" }) {
  const t = kidsScooterSafetyStrings[lang];
  const vars: Record<string, unknown> = { ...kidsScooterSafetyVars, total };

  return (
    <AssetPage
      eyebrow={t.eyebrow}
      title={t.h1}
      lead={t.lead}
      vars={vars}
      provenance={{ title: t.methodTitle, body: t.methodBody }}
    >
      <section className="space-y-4">
        <SectionHeading icon={ShieldCheck} title={t.coverageTitle} lead={t.coverageLead} />
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <tbody>
              <CoverageRow label="ASTM F963 stated" n={vars.astm as number} of={total} />
              <CoverageRow label="CPSC stated" n={vars.cpsc as number} of={total} />
              <CoverageRow label="Any compliance entry" n={d.totals.withCompliance} of={total} />
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={FileCheck} title={t.proveTitle} lead={t.proveLead} />
        <StatedNote>
          <p>{t.proveDoes}</p>
        </StatedNote>
        <GapNote>
          <p>{t.proveDoesnt}</p>
        </GapNote>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={ShieldCheck} title={t.specsTitle} lead={t.specsLead} />
        <StatedNote>
          <p>{t.specsBrake}</p>
          <p>{t.specsWheel}</p>
          <p>{t.specsFrame}</p>
        </StatedNote>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={AlertTriangle} title={t.gapTitle} lead={t.gapLead} />
        <GapNote>
          <p>
            <strong>{t.gapCert}</strong>
          </p>
          <p>
            <strong>{t.gapTest}</strong>
          </p>
          <p>
            <strong>{t.gapHelmet}</strong>
          </p>
        </GapNote>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Table2} title={t.rosterTitle} lead={t.rosterLead} />
        <ScooterTable
          columns={kidsScooterSafetyColumns(t)}
          rows={d.rows}
          emptyCell={t.notStated}
          caption={t.rosterTitle}
        />
      </section>
    </AssetPage>
  );
}

export { KIDS_SCOOTER_SAFETY_PATH };