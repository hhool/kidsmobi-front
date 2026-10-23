/**
 * /kids-stroller-size-chart/ — component.
 *
 * Prose lives in src/data/kidsStrollerSize.ts. Layout primitives come from
 * ClusterAssetPage.tsx. Neither is shared with the other seven stroller pages,
 * which is deliberate: check-topic-pair-drift.mjs compares each page's <h2>
 * word-bag and body 8-grams against its seven siblings and against the
 * balance-bike, kids-bike, kids-scooter and ride-on pages of the same name, and
 * hoisting copy into a shared module is precisely what would trip it.
 */
import { Ruler, Package, DoorOpen, TriangleAlert, Table2 } from "lucide-react";
import {
  SectionHeading,
  CoverageRow,
  ClusterTable,
  GapNote,
  AssetPage,
} from "./ClusterAssetPage";
import {
  kidsStrollerSizeStrings,
  kidsStrollerSizeColumns,
  kidsStrollerSizeVars,
  KIDS_STROLLER_SIZE_PATH,
  STROLLER_DATASET,
} from "../data/kidsStrollerSize";

const d = STROLLER_DATASET;
const total = d.totals.strollers;

export default function KidsStrollerSize({ lang = "en" }: { lang?: "zh" | "en" }) {
  const t = kidsStrollerSizeStrings[lang];
  const vars: Record<string, unknown> = { ...kidsStrollerSizeVars, total };

  return (
    <AssetPage
      eyebrow={t.eyebrow}
      title={t.h1}
      lead={t.lead}
      vars={vars}
      provenance={{ title: t.methodTitle, body: t.methodBody }}
    >
      <section className="space-y-4">
        <SectionHeading icon={Ruler} title={t.coverTitle} lead={t.coverLead} />
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <tbody>
              <CoverageRow label="Open dimensions stated" n={total} of={total} />
              <CoverageRow label="Folded dimensions stated" n={d.totals.withFolded} of={total} tone="amber" />
              <CoverageRow label="Doorway clearance stated" n={0} of={total} tone="amber" />
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Package} title={t.foldTitle} lead={t.foldLead} />
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Ruler} title={t.bodyTitle} lead={t.bodyLead} />
        <div className="space-y-3 text-sm text-slate-700 leading-7">
          <p>{t.bodyLongest}</p>
          <p>{t.bodyWidest}</p>
          <p>{t.bodyTallest}</p>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={DoorOpen} title={t.doorTitle} lead={t.doorLead} />
      </section>

      <section className="space-y-4">
        <SectionHeading icon={TriangleAlert} title={t.gapTitle} lead={t.gapLead} />
        <GapNote>
          <p>
            <strong>{t.gapFold}</strong>
          </p>
          <p>
            <strong>{t.gapClearance}</strong>
          </p>
          <p>
            <strong>{t.gapSeat}</strong>
          </p>
        </GapNote>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Table2} title={t.rosterTitle} lead={t.rosterLead} />
        <ClusterTable
          columns={kidsStrollerSizeColumns(t)}
          rows={d.rows as never}
          emptyCell={t.notStated}
          caption={t.rosterTitle}
        />
      </section>
    </AssetPage>
  );
}

export { KIDS_STROLLER_SIZE_PATH };
