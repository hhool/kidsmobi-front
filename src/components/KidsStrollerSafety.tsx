/**
 * /kids-stroller-safety-standards/ — component. See KidsStrollerSize.tsx for the
 * guard rationale; prose is per-page and not shared.
 */
import { ShieldCheck, BadgeCheck, Lock, Umbrella, TriangleAlert, Table2 } from "lucide-react";
import {
  SectionHeading,
  CoverageRow,
  ClusterTable,
  GapNote,
  AssetPage,
} from "./ClusterAssetPage";
import {
  kidsStrollerSafetyStrings,
  kidsStrollerSafetyColumns,
  kidsStrollerSafetyVars,
  KIDS_STROLLER_SAFETY_PATH,
  STROLLER_DATASET,
} from "../data/kidsStrollerSafety";

const d = STROLLER_DATASET;
const total = d.totals.strollers;

export default function KidsStrollerSafety({ lang = "en" }: { lang?: "zh" | "en" }) {
  const t = kidsStrollerSafetyStrings[lang];
  const vars: Record<string, unknown> = { ...kidsStrollerSafetyVars, total };

  return (
    <AssetPage
      eyebrow={t.eyebrow}
      title={t.h1}
      lead={t.lead}
      vars={vars}
      provenance={{ title: t.methodTitle, body: t.methodBody }}
    >
      <section className="space-y-4">
        <SectionHeading icon={ShieldCheck} title={t.markTitle} lead={t.markLead} />
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <tbody>
              <CoverageRow label="EN 1888 claimed" n={d.complianceTally.EN1888} of={total} />
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={BadgeCheck} title={t.coverTitle} lead={t.coverLead} />
        <div className="space-y-3 text-sm text-slate-700 leading-7">
          <p>{t.coverBody}</p>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Lock} title={t.harnessTitle} lead={t.harnessLead} />
        <div className="space-y-3 text-sm text-slate-700 leading-7">
          <p>{t.harnessBody}</p>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Umbrella} title={t.featuresTitle} lead={t.featuresLead} />
        <div className="space-y-3 text-sm text-slate-700 leading-7">
          <p>{t.featuresBrake}</p>
          <p>{t.featuresCanopy}</p>
          <p>{t.featuresBasket}</p>
          <p>{t.featuresCarSeat}</p>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={TriangleAlert} title={t.gapTitle} lead={t.gapLead} />
        <GapNote>
          <p>
            <strong>{t.gapProve}</strong>
          </p>
          <p>
            <strong>{t.gapTest}</strong>
          </p>
          <p>
            <strong>{t.gapRegion}</strong>
          </p>
        </GapNote>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Table2} title={t.rosterTitle} lead={t.rosterLead} />
        <ClusterTable
          columns={kidsStrollerSafetyColumns(t)}
          rows={d.rows as never}
          emptyCell={t.notStated}
          caption={t.rosterTitle}
        />
      </section>
    </AssetPage>
  );
}

export { KIDS_STROLLER_SAFETY_PATH };
