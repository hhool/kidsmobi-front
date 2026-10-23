/**
 * /kids-stroller-recalls/ — component. See KidsStrollerSize.tsx for the guard
 * rationale; prose is per-page and not shared. This page reports the absence of
 * a recall field rather than inventing one.
 */
import { FileX2, ShieldCheck, ExternalLink, TriangleAlert, Table2 } from "lucide-react";
import {
  SectionHeading,
  ClusterTable,
  GapNote,
  AssetPage,
} from "./ClusterAssetPage";
import {
  kidsStrollerRecallStrings,
  kidsStrollerRecallColumns,
  kidsStrollerRecallVars,
  KIDS_STROLLER_RECALLS_PATH,
  STROLLER_DATASET,
} from "../data/kidsStrollerRecalls";

const d = STROLLER_DATASET;
const total = d.totals.strollers;

export default function KidsStrollerRecalls({ lang = "en" }: { lang?: "zh" | "en" }) {
  const t = kidsStrollerRecallStrings[lang];
  const vars: Record<string, unknown> = { ...kidsStrollerRecallVars, total };

  return (
    <AssetPage
      eyebrow={t.eyebrow}
      title={t.h1}
      lead={t.lead}
      vars={vars}
      provenance={{ title: t.methodTitle, body: t.methodBody }}
    >
      <section className="space-y-4">
        <SectionHeading icon={FileX2} title={t.absentTitle} lead={t.absentLead} />
        <div className="space-y-3 text-sm text-slate-700 leading-7">
          <p>{t.absentBody}</p>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={ShieldCheck} title={t.enTitle} lead={t.enLead} />
        <div className="space-y-3 text-sm text-slate-700 leading-7">
          <p>{t.enBody}</p>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={ExternalLink} title={t.whereTitle} lead={t.whereLead} />
        <div className="space-y-3 text-sm text-slate-700 leading-7">
          <p>{t.whereBody}</p>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={TriangleAlert} title={t.gapTitle} lead={t.gapLead} />
        <GapNote>
          <p>
            <strong>{t.gapField}</strong>
          </p>
          <p>
            <strong>{t.gapScope}</strong>
          </p>
          <p>
            <strong>{t.gapVerify}</strong>
          </p>
        </GapNote>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Table2} title={t.rosterTitle} lead={t.rosterLead} />
        <ClusterTable
          columns={kidsStrollerRecallColumns(t)}
          rows={d.rows as never}
          emptyCell={t.notStated}
          caption={t.rosterTitle}
        />
      </section>
    </AssetPage>
  );
}

export { KIDS_STROLLER_RECALLS_PATH };
