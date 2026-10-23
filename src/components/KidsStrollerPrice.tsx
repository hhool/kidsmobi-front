/**
 * /kids-stroller-price/ — component. See KidsStrollerSize.tsx for the guard
 * rationale; prose is per-page and not shared.
 */
import { DollarSign, BarChart3, Star, TriangleAlert, Table2 } from "lucide-react";
import {
  SectionHeading,
  CoverageRow,
  ClusterTable,
  GapNote,
  AssetPage,
} from "./ClusterAssetPage";
import {
  kidsStrollerPriceStrings,
  kidsStrollerPriceColumns,
  kidsStrollerPriceVars,
  KIDS_STROLLER_PRICE_PATH,
  STROLLER_DATASET,
} from "../data/kidsStrollerPrice";

const d = STROLLER_DATASET;
const total = d.totals.strollers;

export default function KidsStrollerPrice({ lang = "en" }: { lang?: "zh" | "en" }) {
  const t = kidsStrollerPriceStrings[lang];
  const vars: Record<string, unknown> = { ...kidsStrollerPriceVars, total };

  return (
    <AssetPage
      eyebrow={t.eyebrow}
      title={t.h1}
      lead={t.lead}
      vars={vars}
      provenance={{ title: t.methodTitle, body: t.methodBody }}
    >
      <section className="space-y-4">
        <SectionHeading icon={DollarSign} title={t.coverTitle} lead={t.coverLead} />
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <tbody>
              <CoverageRow label="Price stated" n={total} of={total} />
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={BarChart3} title={t.bandsTitle} lead={t.bandsLead} />
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <tbody>
              <CoverageRow label="Under $100" n={kidsStrollerPriceVars.bandUnder} of={total} />
              <CoverageRow label="$100–$200" n={kidsStrollerPriceVars.band100} of={total} />
              <CoverageRow label="$200–$300" n={kidsStrollerPriceVars.band200} of={total} />
              <CoverageRow label="$300 and over" n={kidsStrollerPriceVars.band300} of={total} />
            </tbody>
          </table>
        </div>
        <div className="space-y-3 text-sm text-slate-700 leading-7">
          <p>{t.bandUnder}</p>
          <p>{t.band100}</p>
          <p>{t.band200}</p>
          <p>{t.band300}</p>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Star} title={t.ratingTitle} lead={t.ratingLead} />
        <div className="space-y-3 text-sm text-slate-700 leading-7">
          <p>{t.ratingSpread}</p>
          <p>{t.ratingApart}</p>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={TriangleAlert} title={t.gapTitle} lead={t.gapLead} />
        <GapNote>
          <p>
            <strong>{t.gapShipping}</strong>
          </p>
          <p>
            <strong>{t.gapWarranty}</strong>
          </p>
          <p>
            <strong>{t.gapHistory}</strong>
          </p>
        </GapNote>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Table2} title={t.rosterTitle} lead={t.rosterLead} />
        <ClusterTable
          columns={kidsStrollerPriceColumns(t)}
          rows={d.rows as never}
          emptyCell={t.notStated}
          caption={t.rosterTitle}
        />
      </section>
    </AssetPage>
  );
}

export { KIDS_STROLLER_PRICE_PATH };
