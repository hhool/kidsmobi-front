/**
 * /kids-stroller-what-buyers-say/ — component. See KidsStrollerSize.tsx for the
 * guard rationale; prose is per-page and not shared.
 */
import { MessageSquareText, Star, ThumbsUp, TriangleAlert, Table2 } from "lucide-react";
import {
  SectionHeading,
  ClusterTable,
  GapNote,
  AssetPage,
} from "./ClusterAssetPage";
import {
  kidsStrollerFeedbackStrings,
  kidsStrollerFeedbackColumns,
  kidsStrollerFeedbackVars,
  KIDS_STROLLER_FEEDBACK_PATH,
  STROLLER_DATASET,
} from "../data/kidsStrollerFeedback";

const d = STROLLER_DATASET;
const total = d.totals.strollers;

export default function KidsStrollerFeedback({ lang = "en" }: { lang?: "zh" | "en" }) {
  const t = kidsStrollerFeedbackStrings[lang];
  const vars: Record<string, unknown> = { ...kidsStrollerFeedbackVars, total };

  return (
    <AssetPage
      eyebrow={t.eyebrow}
      title={t.h1}
      lead={t.lead}
      vars={vars}
      provenance={{ title: t.methodTitle, body: t.methodBody }}
    >
      <section className="space-y-4">
        <SectionHeading icon={Star} title={t.ratingTitle} lead={t.ratingLead} />
        <div className="space-y-3 text-sm text-slate-700 leading-7">
          <p>{t.ratingBody}</p>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={MessageSquareText} title={t.themeTitle} lead={t.themeIntro} />
        <div className="space-y-3 text-sm text-slate-700 leading-7">
          <p>{t.themeFold}</p>
          <p>{t.themeLight}</p>
          <p>{t.themeManeuver}</p>
          <p>{t.themeTravel}</p>
          <p>{t.themeDurability}</p>
          <p>{t.themeValue}</p>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={ThumbsUp} title={t.hedgeTitle} lead={t.hedgeLead} />
        <div className="space-y-3 text-sm text-slate-700 leading-7">
          <p>{t.hedgeBody}</p>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={TriangleAlert} title={t.gapTitle} lead={t.gapLead} />
        <GapNote>
          <p>
            <strong>{t.gapEmpty}</strong>
          </p>
          <p>
            <strong>{t.gapVerbatim}</strong>
          </p>
          <p>
            <strong>{t.gapSelection}</strong>
          </p>
        </GapNote>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Table2} title={t.rosterTitle} lead={t.rosterLead} />
        <ClusterTable
          columns={kidsStrollerFeedbackColumns(t)}
          rows={d.rows as never}
          emptyCell={t.notStated}
          caption={t.rosterTitle}
        />
      </section>
    </AssetPage>
  );
}

export { KIDS_STROLLER_FEEDBACK_PATH };
