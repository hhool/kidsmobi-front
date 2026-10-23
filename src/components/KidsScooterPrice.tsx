/**
 * /kids-scooter-price/ — component.
 *
 * Copy lives in src/data/kidsScooterPrice.ts; see KidsScooterWheels.tsx for why
 * no prose is shared between these pages.
 */
import { Tags, TrendingUp, AlertTriangle, Table2, CircleDollarSign } from "lucide-react";
import { SectionHeading, ScooterTable, GapNote, AssetPage } from "./ScooterAssetPage";
import {
  kidsScooterPriceStrings,
  kidsScooterPriceColumns,
  kidsScooterPriceVars,
  KIDS_SCOOTER_PRICE_PATH,
  SCOOTER_DATASET,
} from "../data/kidsScooterPrice";

const d = SCOOTER_DATASET;
const total = d.totals.kidsScooters;

export default function KidsScooterPrice({ lang = "en" }: { lang?: "zh" | "en" }) {
  const t = kidsScooterPriceStrings[lang];
  const vars: Record<string, unknown> = { ...kidsScooterPriceVars, total };

  return (
    <AssetPage
      eyebrow={t.eyebrow}
      title={t.h1}
      lead={t.lead}
      vars={vars}
      provenance={{ title: t.methodTitle, body: t.methodBody }}
    >
      <section className="space-y-4">
        <SectionHeading icon={Tags} title={t.bandTitle} lead={t.bandLead} />
      </section>

      <section className="space-y-4">
        <SectionHeading icon={TrendingUp} title={t.wheelsTitle} lead={t.wheelsLead} />
      </section>

      <section className="space-y-4">
        <SectionHeading icon={CircleDollarSign} title={t.featureTitle} lead={t.featureLead} />
      </section>

      <section className="space-y-4">
        <SectionHeading icon={AlertTriangle} title={t.caveatTitle} />
        <GapNote>
          {t.caveatBody.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </GapNote>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Table2} title={t.rosterTitle} lead={t.rosterLead} />
        <ScooterTable
          columns={kidsScooterPriceColumns(t)}
          rows={d.rows}
          emptyCell={t.notStated}
          caption={t.rosterTitle}
        />
      </section>
    </AssetPage>
  );
}

export { KIDS_SCOOTER_PRICE_PATH };