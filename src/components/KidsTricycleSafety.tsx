/**
 * /kids-tricycle-safety-standards/ — component. H2 wording is tricycle-specific
 * and differs from the ride-on safety page on purpose (pair-drift guard).
 */
import { ShieldCheck, BadgeCheck, Umbrella, AlertTriangle, Table2 } from "lucide-react";
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
  kidsTricycleSafetyStrings,
  kidsTricycleSafetyColumns,
  kidsTricycleSafetyVars,
  KIDS_TRICYCLE_SAFETY_PATH,
  TRICYCLE_DATASET,
} from "../data/kidsTricycleSafety";

const d = TRICYCLE_DATASET;
const total = d.totals.tricycles;

export default function KidsTricycleSafety({ lang = "en" }: { lang?: "zh" | "en" }) {
  const t = kidsTricycleSafetyStrings[lang];
  const vars: Record<string, unknown> = { ...kidsTricycleSafetyVars, total };

  return (
    <AssetPage
      eyebrow={t.eyebrow}
      title={t.h1}
      lead={t.lead}
      vars={vars}
      provenance={{ title: t.methodTitle, body: t.methodBody }}
    >
      <section className="space-y-4">
        <SectionHeading icon={BadgeCheck} title={t.coverageTitle} lead={t.coverageLead} />
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <tbody>
              <CoverageRow label="ASTM F963 declared" n={kidsTricycleSafetyVars.astm} of={total} />
              <CoverageRow label="Any compliance declared" n={d.totals.withCompliance} of={total} />
              <CoverageRow
                label="No compliance declared"
                n={kidsTricycleSafetyVars.noCompliance}
                of={total}
                tone="amber"
              />
              <CoverageRow
                label="Certificate or report named"
                n={0}
                of={total}
                tone="amber"
              />
              <CoverageRow
                label="Category id mismatch"
                n={d.totals.categoryIdMismatch}
                of={total}
                tone="amber"
              />
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Umbrella} title={t.featureTitle} lead={t.featureLead} />
        <div className="space-y-3 text-sm text-slate-700 leading-7">
          <p>{t.featPush}</p>
          <p>{t.featCanopy}</p>
          <p>{t.featEva}</p>
          <p>{t.featBalance}</p>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={AlertTriangle} title={t.gapTitle} lead={t.gapLead} />
        <GapNote>
          <p>
            <strong>{t.gapCert}</strong>
          </p>
          <p>
            <strong>{t.gapNoMark}</strong>
          </p>
          <p>
            <strong>{t.gapMismatch}</strong>
          </p>
        </GapNote>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Table2} title={t.rosterTitle} lead={t.rosterLead} />
        <ClusterTable
          columns={kidsTricycleSafetyColumns(t)}
          rows={d.rows as never}
          emptyCell={t.notStated}
          caption={t.rosterTitle}
        />
      </section>
    </AssetPage>
  );
}

export { KIDS_TRICYCLE_SAFETY_PATH };
