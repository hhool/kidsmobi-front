/**
 * /kids-ride-on-price/ — component.
 *
 * Copy lives in src/data/kidsRideOnPrice.ts; see KidsRideOnVoltage.tsx for why
 * no prose is shared between these pages.
 */
import { DollarSign, Wallet, TrendingUp, AlertTriangle, Table2 } from "lucide-react";
import { SectionHeading, CoverageRow, RideOnTable, GapNote, AssetPage } from "./RideOnAssetPage";
import {
  kidsRideOnPriceStrings,
  kidsRideOnPriceColumns,
  kidsRideOnPriceVars,
  KIDS_RIDE_ON_PRICE_PATH,
  RIDE_ON_DATASET,
} from "../data/kidsRideOnPrice";

const d = RIDE_ON_DATASET;
const total = d.totals.rideOnCars;

export default function KidsRideOnPrice({ lang = "en" }: { lang?: "zh" | "en" }) {
  const t = kidsRideOnPriceStrings[lang];
  const vars: Record<string, unknown> = { ...kidsRideOnPriceVars, total };

  return (
    <AssetPage
      eyebrow={t.eyebrow}
      title={t.h1}
      lead={t.lead}
      vars={vars}
      provenance={{ title: t.methodTitle, body: t.methodBody }}
    >
      <section className="space-y-4">
        <SectionHeading icon={DollarSign} title={t.gapTitle} lead={t.gapLead} />
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
        <SectionHeading icon={Wallet} title={t.bandsTitle} lead={t.bandsLead} />
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <tbody>
              {kidsRideOnPriceVars.bands.map((band) => (
                <CoverageRow
                  key={band.key}
                  label={band.label}
                  n={band.count}
                  of={total}
                  tone={band.key === "over250" ? "amber" : "sky"}
                />
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-3 text-sm text-slate-700 leading-7">
          <p>{t.bandUnder}</p>
          <p>{t.band100to150}</p>
          <p>{t.band150to250}</p>
          <p>{t.bandOver250}</p>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={TrendingUp} title={t.ratingTitle} lead={t.ratingLead} />
        <div className="space-y-3 text-sm text-slate-700 leading-7">
          <p>{t.ratingBest}</p>
          <p>{t.ratingPopular}</p>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={AlertTriangle} title={t.gapNoteTitle} lead={t.gapNoteLead} />
        <GapNote>
          <p>
            <strong>{t.gapNoteShipping}</strong>
          </p>
          <p>
            <strong>{t.gapNoteWarranty}</strong>
          </p>
          <p>
            <strong>{t.gapNoteHistory}</strong>
          </p>
        </GapNote>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Table2} title={t.rosterTitle} lead={t.rosterLead} />
        <RideOnTable
          columns={kidsRideOnPriceColumns(t)}
          rows={d.rows}
          emptyCell={t.notStated}
          caption={t.rosterTitle}
        />
      </section>
    </AssetPage>
  );
}

export { KIDS_RIDE_ON_PRICE_PATH };
