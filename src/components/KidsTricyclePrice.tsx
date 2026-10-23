/**
 * /kids-tricycle-price/ — component. H2 wording is tricycle-specific and differs
 * from the ride-on price page on purpose (pair-drift guard).
 */
import { DollarSign, BarChart3, Star, AlertTriangle, Table2 } from "lucide-react";
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
  kidsTricyclePriceStrings,
  kidsTricyclePriceColumns,
  kidsTricyclePriceVars,
  KIDS_TRICYCLE_PRICE_PATH,
  TRICYCLE_DATASET,
} from "../data/kidsTricyclePrice";

const d = TRICYCLE_DATASET;
const total = d.totals.tricycles;

export default function KidsTricyclePrice({ lang = "en" }: { lang?: "zh" | "en" }) {
  const t = kidsTricyclePriceStrings[lang];
  const vars: Record<string, unknown> = { ...kidsTricyclePriceVars, total };

  return (
    <AssetPage
      eyebrow={t.eyebrow}
      title={t.h1}
      lead={t.lead}
      vars={vars}
      provenance={{ title: t.methodTitle, body: t.methodBody }}
    >
      <section className="space-y-4">
        <SectionHeading icon={AlertTriangle} title={t.gapTitle} lead={t.gapLead} />
        <GapNote>
          <p>
            <strong>{t.gapWide}</strong>
          </p>
          <p>
            <strong>{t.gapTier}</strong>
          </p>
          <p>
            <strong>{t.gapReview}</strong>
          </p>
        </GapNote>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={BarChart3} title={t.bandsTitle} lead={t.bandsLead} />
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <tbody>
              <CoverageRow label="Under $50" n={kidsTricyclePriceVars.bandCounts.under50} of={total} />
              <CoverageRow label="$50–$75" n={kidsTricyclePriceVars.bandCounts["50to75"]} of={total} />
              <CoverageRow label="$75–$100" n={kidsTricyclePriceVars.bandCounts["75to100"]} of={total} />
              <CoverageRow label="Over $100" n={kidsTricyclePriceVars.bandCounts.over100} of={total} />
            </tbody>
          </table>
        </div>
        <div className="space-y-3 text-sm text-slate-700 leading-7">
          <p>{t.bandUnder}</p>
          <p>{t.band50to75}</p>
          <p>{t.band75to100}</p>
          <p>{t.bandOver100}</p>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Star} title={t.ratingTitle} lead={t.ratingLead} />
        <StatedNote>
          <p>{t.ratingNote}</p>
        </StatedNote>
        <div className="space-y-3 text-sm text-slate-700 leading-7">
          <p>{t.ratingBest}</p>
          <p>{t.ratingPopular}</p>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Table2} title={t.rosterTitle} lead={t.rosterLead} />
        <ClusterTable
          columns={kidsTricyclePriceColumns(t)}
          rows={d.rows as never}
          emptyCell={t.notStated}
          caption={t.rosterTitle}
        />
      </section>
    </AssetPage>
  );
}

export { KIDS_TRICYCLE_PRICE_PATH };
