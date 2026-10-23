/**
 * /kids-tricycle-types/ — component. H2 wording is tricycle-specific and differs
 * from the ride-on types/forms page on purpose (pair-drift guard).
 */
import { Layers, Shapes, ListChecks, AlertTriangle, Table2 } from "lucide-react";
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
  kidsTricycleTypesStrings,
  kidsTricycleTypesColumns,
  kidsTricycleTypesVars,
  KIDS_TRICYCLE_TYPES_PATH,
  TRICYCLE_DATASET,
} from "../data/kidsTricycleTypes";

const d = TRICYCLE_DATASET;
const total = d.totals.tricycles;

export default function KidsTricycleTypes({ lang = "en" }: { lang?: "zh" | "en" }) {
  const t = kidsTricycleTypesStrings[lang];
  const vars: Record<string, unknown> = { ...kidsTricycleTypesVars, total };

  return (
    <AssetPage
      eyebrow={t.eyebrow}
      title={t.h1}
      lead={t.lead}
      vars={vars}
      provenance={{ title: t.methodTitle, body: t.methodBody }}
    >
      <section className="space-y-4">
        <SectionHeading icon={Shapes} title={t.formTitle} lead={t.formLead} />
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <tbody>
              <CoverageRow label="Classic trike" n={d.forms.classic} of={total} />
              <CoverageRow label="Convertible trike" n={d.forms.convertible} of={total} />
              <CoverageRow label="Push-only trike" n={d.forms.push} of={total} tone="amber" />
              <CoverageRow label="Stroller-only trike" n={d.forms.stroller} of={total} tone="amber" />
            </tbody>
          </table>
        </div>
        <div className="space-y-3 text-sm text-slate-700 leading-7">
          <p>{t.formClassic}</p>
          <p>{t.formConvertible}</p>
          <p>{t.formAbsent}</p>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={ListChecks} title={t.featureTitle} lead={t.featureLead} />
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <tbody>
              {kidsTricycleTypesVars.featureDefs.map((f) => (
                <CoverageRow
                  key={f.key}
                  label={f.label}
                  n={d.features[f.key]}
                  of={total}
                  tone={d.features[f.key] === 0 ? "amber" : "sky"}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={AlertTriangle} title={t.gapTitle} lead={t.gapLead} />
        <GapNote>
          <p>
            <strong>{t.gapPush}</strong>
          </p>
          <p>
            <strong>{t.gapBike}</strong>
          </p>
        </GapNote>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Table2} title={t.rosterTitle} lead={t.rosterLead} />
        <ClusterTable
          columns={kidsTricycleTypesColumns(t)}
          rows={d.rows as never}
          emptyCell={t.notStated}
          caption={t.rosterTitle}
        />
      </section>
    </AssetPage>
  );
}

export { KIDS_TRICYCLE_TYPES_PATH };
