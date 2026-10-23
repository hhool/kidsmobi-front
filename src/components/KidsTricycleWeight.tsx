/**
 * /kids-tricycle-weight/ — component. H2 wording is tricycle-specific and differs
 * from the ride-on weight page on purpose (pair-drift guard).
 */
import { Weight, Scale, Divide, AlertTriangle, Table2 } from "lucide-react";
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
  kidsTricycleWeightStrings,
  kidsTricycleWeightColumns,
  kidsTricycleWeightVars,
  KIDS_TRICYCLE_WEIGHT_PATH,
  TRICYCLE_DATASET,
} from "../data/kidsTricycleWeight";

const d = TRICYCLE_DATASET;
const total = d.totals.tricycles;

export default function KidsTricycleWeight({ lang = "en" }: { lang?: "zh" | "en" }) {
  const t = kidsTricycleWeightStrings[lang];
  const vars: Record<string, unknown> = { ...kidsTricycleWeightVars, total };

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
              <CoverageRow label="Own weight stated" n={d.totals.withItemWeight} of={total} />
              <CoverageRow label="Rider limit stated" n={d.totals.withWeightLimit} of={total} />
              <CoverageRow label="Both published" n={kidsTricycleWeightVars.pairs} of={total} />
              <CoverageRow
                label="Own weight only"
                n={kidsTricycleWeightVars.ownOnly}
                of={total}
                tone="amber"
              />
              <CoverageRow
                label="Rider limit only"
                n={kidsTricycleWeightVars.limitOnly}
                of={total}
                tone="amber"
              />
              <CoverageRow
                label="Implausible own weight"
                n={d.totals.withImplausibleItemWeight}
                of={total}
                tone="amber"
              />
            </tbody>
          </table>
        </div>
        <p className="text-sm text-slate-700 leading-7">{t.ownBody}</p>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Divide} title={t.ratioTitle} lead={t.ratioLead} />
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
            <strong>{t.gapImplausible}</strong>
          </p>
        </GapNote>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Table2} title={t.rosterTitle} lead={t.rosterLead} />
        <ClusterTable
          columns={kidsTricycleWeightColumns(t)}
          rows={d.rows as never}
          emptyCell={t.notStated}
          caption={t.rosterTitle}
        />
      </section>
    </AssetPage>
  );
}

export { KIDS_TRICYCLE_WEIGHT_PATH };
