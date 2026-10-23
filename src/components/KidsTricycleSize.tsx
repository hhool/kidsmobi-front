/**
 * /kids-tricycle-size-chart/ — component.
 *
 * Prose lives in src/data/kidsTricycleSize.ts; layout primitives come from
 * ClusterAssetPage.tsx. Neither is shared with the other seven tricycle pages:
 * check-topic-pair-drift.mjs compares each page's <h2> word-bag and body
 * 8-grams against its seven siblings and against the other clusters' size pages,
 * so hoisting copy into a shared module would trip it. The H2 wording below is
 * tricycle-specific and differs from the ride-on size page on purpose.
 */
import { Ruler, Box, MoveHorizontal, AlertTriangle, Table2 } from "lucide-react";
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
  kidsTricycleSizeStrings,
  kidsTricycleSizeColumns,
  kidsTricycleSizeVars,
  KIDS_TRICYCLE_SIZE_PATH,
  TRICYCLE_DATASET,
} from "../data/kidsTricycleSize";

const d = TRICYCLE_DATASET;
const total = d.totals.tricycles;

export default function KidsTricycleSize({ lang = "en" }: { lang?: "zh" | "en" }) {
  const t = kidsTricycleSizeStrings[lang];
  const vars: Record<string, unknown> = { ...kidsTricycleSizeVars, total };

  return (
    <AssetPage
      eyebrow={t.eyebrow}
      title={t.h1}
      lead={t.lead}
      vars={vars}
      provenance={{ title: t.methodTitle, body: t.methodBody }}
    >
      <section className="space-y-4">
        <SectionHeading icon={Ruler} title={t.sourceTitle} lead={t.sourceLead} />
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <tbody>
              <CoverageRow label="Dimensions stated" n={d.totals.withDimensions} of={total} />
              <CoverageRow label="Size label stated" n={kidsTricycleSizeVars.withSizeLabel} of={total} />
              <CoverageRow
                label="Size field holds a word"
                n={kidsTricycleSizeVars.sizeLabelWord}
                of={total}
                tone="amber"
              />
              <CoverageRow
                label="Size field holds a dimension string"
                n={kidsTricycleSizeVars.sizeLabelDim}
                of={total}
                tone="amber"
              />
            </tbody>
          </table>
        </div>
        <p className="text-sm text-slate-700 leading-7">{t.sourceBody}</p>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Box} title={t.fieldTitle} lead={t.fieldLead} />
        <div className="space-y-3 text-sm text-slate-700 leading-7">
          <p>{t.fieldWord}</p>
          <p>{t.fieldDim}</p>
          <p>{t.fieldEmpty}</p>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={MoveHorizontal} title={t.rangeTitle} lead={t.rangeLead} />
        <div className="space-y-3 text-sm text-slate-700 leading-7">
          <p>{t.rangeLongest}</p>
          <p>{t.rangeWidest}</p>
          <p>{t.rangeTallest}</p>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={AlertTriangle} title={t.gapTitle} lead={t.gapLead} />
        <GapNote>
          <p>
            <strong>{t.gapMissing}</strong>
          </p>
          <p>
            <strong>{t.gapLabel}</strong>
          </p>
        </GapNote>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Table2} title={t.rosterTitle} lead={t.rosterLead} />
        <ClusterTable
          columns={kidsTricycleSizeColumns(t)}
          rows={d.rows as never}
          emptyCell={t.notStated}
          caption={t.rosterTitle}
        />
      </section>
    </AssetPage>
  );
}

export { KIDS_TRICYCLE_SIZE_PATH };
