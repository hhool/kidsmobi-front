/**
 * /kids-tricycle-recalls/ — component. H2 wording is tricycle-specific and differs
 * from the ride-on recalls page on purpose (pair-drift guard). The dataset holds
 * no recall field, so this page reports the recall-relevant compliance signal it
 * can verify and names the silence, rather than inventing hazards.
 */
import { ScrollText, ShieldAlert, Ban, AlertTriangle, Table2 } from "lucide-react";
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
  kidsTricycleRecallStrings,
  kidsTricycleRecallColumns,
  kidsTricycleRecallVars,
  KIDS_TRICYCLE_RECALLS_PATH,
  TRICYCLE_DATASET,
} from "../data/kidsTricycleRecalls";

const d = TRICYCLE_DATASET;
const total = d.totals.tricycles;

export default function KidsTricycleRecalls({ lang = "en" }: { lang?: "zh" | "en" }) {
  const t = kidsTricycleRecallStrings[lang];
  const vars: Record<string, unknown> = { ...kidsTricycleRecallVars, total };

  return (
    <AssetPage
      eyebrow={t.eyebrow}
      title={t.h1}
      lead={t.lead}
      vars={vars}
      provenance={{ title: t.methodTitle, body: t.methodBody }}
    >
      <section className="space-y-4">
        <SectionHeading icon={ShieldAlert} title={t.coverageTitle} lead={t.coverageLead} />
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <tbody>
              <CoverageRow label="ASTM F963 declared" n={kidsTricycleRecallVars.astm} of={total} />
              <CoverageRow label="Any compliance declared" n={d.totals.withCompliance} of={total} />
              <CoverageRow
                label="No compliance declared"
                n={kidsTricycleRecallVars.noCompliance}
                of={total}
                tone="amber"
              />
              <CoverageRow
                label="Category id mismatch"
                n={d.totals.categoryIdMismatch}
                of={total}
                tone="amber"
              />
              <CoverageRow
                label="Recall notices matched"
                n={kidsTricycleRecallVars.notices}
                of={total}
                tone="amber"
              />
            </tbody>
          </table>
        </div>
        <p className="text-sm text-slate-700 leading-7">{t.coverageBody}</p>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={AlertTriangle} title={t.gapTitle} lead={t.gapLead} />
        <GapNote>
          <p>
            <strong>{t.gapNoField}</strong>
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
          columns={kidsTricycleRecallColumns(t)}
          rows={d.rows as never}
          emptyCell={t.notStated}
          caption={t.rosterTitle}
        />
      </section>
    </AssetPage>
  );
}

export { KIDS_TRICYCLE_RECALLS_PATH };
