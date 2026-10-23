/**
 * /kids-stroller-weight/ — component. See KidsStrollerSize.tsx for the guard
 * rationale; prose is per-page and not shared.
 */
import { Weight, Scale, Feather, TriangleAlert, Table2 } from "lucide-react";
import {
  SectionHeading,
  CoverageRow,
  ClusterTable,
  GapNote,
  AssetPage,
} from "./ClusterAssetPage";
import {
  kidsStrollerWeightStrings,
  kidsStrollerWeightColumns,
  kidsStrollerWeightVars,
  KIDS_STROLLER_WEIGHT_PATH,
  STROLLER_DATASET,
} from "../data/kidsStrollerWeight";

const d = STROLLER_DATASET;
const total = d.totals.strollers;

export default function KidsStrollerWeight({ lang = "en" }: { lang?: "zh" | "en" }) {
  const t = kidsStrollerWeightStrings[lang];
  const vars: Record<string, unknown> = { ...kidsStrollerWeightVars, total };

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
              <CoverageRow label="Item weight stated" n={d.totals.withItemWeight} of={total} />
              <CoverageRow label="Rated weight limit stated" n={d.totals.withWeightLimit} of={total} tone="amber" />
            </tbody>
          </table>
        </div>
        <div className="space-y-3 text-sm text-slate-700 leading-7">
          <p>{t.ownStated}</p>
          <p>{t.ownRange}</p>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Scale} title={t.limitTitle} lead={t.limitLead} />
        <div className="space-y-3 text-sm text-slate-700 leading-7">
          <p>{t.limitCount}</p>
          <p>{t.limitGap}</p>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Feather} title={t.lightTitle} lead={t.lightLead} />
        <div className="space-y-3 text-sm text-slate-700 leading-7">
          <p>{t.lightCount}</p>
          <p>{t.lightForm}</p>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={TriangleAlert} title={t.gapTitle} lead={t.gapLead} />
        <GapNote>
          <p>
            <strong>{t.gapLimit}</strong>
          </p>
          <p>
            <strong>{t.gapMissing}</strong>
          </p>
          <p>
            <strong>{t.gapUnit}</strong>
          </p>
        </GapNote>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Table2} title={t.rosterTitle} lead={t.rosterLead} />
        <ClusterTable
          columns={kidsStrollerWeightColumns(t)}
          rows={d.rows as never}
          emptyCell={t.notStated}
          caption={t.rosterTitle}
        />
      </section>
    </AssetPage>
  );
}

export { KIDS_STROLLER_WEIGHT_PATH };
