/**
 * /kids-stroller-types/ — component. See KidsStrollerSize.tsx for the guard
 * rationale; prose is per-page and not shared.
 */
import { LayoutGrid, Footprints, Users, Plane, CircleDot, Table2 } from "lucide-react";
import {
  SectionHeading,
  ClusterTable,
  AssetPage,
} from "./ClusterAssetPage";
import {
  kidsStrollerTypesStrings,
  kidsStrollerTypesColumns,
  kidsStrollerTypesVars,
  KIDS_STROLLER_TYPES_PATH,
  STROLLER_DATASET,
} from "../data/kidsStrollerTypes";

const d = STROLLER_DATASET;
const total = d.totals.strollers;

export default function KidsStrollerTypes({ lang = "en" }: { lang?: "zh" | "en" }) {
  const t = kidsStrollerTypesStrings[lang];
  const vars: Record<string, unknown> = { ...kidsStrollerTypesVars, total };

  return (
    <AssetPage
      eyebrow={t.eyebrow}
      title={t.h1}
      lead={t.lead}
      vars={vars}
      provenance={{ title: t.methodTitle, body: t.methodBody }}
    >
      <section className="space-y-4">
        <SectionHeading icon={LayoutGrid} title={t.formsTitle} lead={t.formsLead} />
        <div className="space-y-3 text-sm text-slate-700 leading-7">
          <p>{t.formsSplit}</p>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Footprints} title={t.joggerTitle} lead={t.joggerLead} />
        <div className="space-y-3 text-sm text-slate-700 leading-7">
          <p>{t.joggerNote}</p>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Users} title={t.doubleTitle} lead={t.doubleLead} />
        <div className="space-y-3 text-sm text-slate-700 leading-7">
          <p>{t.doubleNote}</p>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Plane} title={t.travelTitle} lead={t.travelLead} />
        <div className="space-y-3 text-sm text-slate-700 leading-7">
          <p>{t.travelNote}</p>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={CircleDot} title={t.wheelsTitle} lead={t.wheelsLead} />
        <div className="space-y-3 text-sm text-slate-700 leading-7">
          <p>{t.wheelsNote}</p>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Table2} title={t.rosterTitle} lead={t.rosterLead} />
        <ClusterTable
          columns={kidsStrollerTypesColumns(t)}
          rows={d.rows as never}
          emptyCell={t.notStated}
          caption={t.rosterTitle}
        />
      </section>
    </AssetPage>
  );
}

export { KIDS_STROLLER_TYPES_PATH };
