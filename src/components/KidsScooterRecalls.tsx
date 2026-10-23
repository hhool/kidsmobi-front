/**
 * /kids-scooter-recalls/ — component.
 *
 * Copy lives in src/data/kidsScooterRecalls.ts; see KidsScooterWheels.tsx for
 * why no prose is shared between these pages.
 */
import { AlertOctagon, Scale, Table2 } from "lucide-react";
import { SectionHeading, ScooterTable, GapNote, AssetPage } from "./ScooterAssetPage";
import {
  kidsScooterRecallsStrings,
  kidsScooterRecallColumns,
  kidsScooterRecallVars,
  KIDS_SCOOTER_RECALLS_PATH,
} from "../data/kidsScooterRecalls";

const notices = kidsScooterRecallVars.notices;

export default function KidsScooterRecalls({ lang = "en" }: { lang?: "zh" | "en" }) {
  const t = kidsScooterRecallsStrings[lang];
  const vars: Record<string, unknown> = { ...kidsScooterRecallVars };

  return (
    <AssetPage
      eyebrow={t.eyebrow}
      title={t.h1}
      lead={t.lead}
      vars={vars}
      provenance={{ title: t.methodTitle, body: t.methodBody }}
    >
      <section className="space-y-4">
        <SectionHeading icon={AlertOctagon} title={t.splitTitle} lead={t.splitLead} />
        <GapNote>
          <p>{t.splitElectric}</p>
          <p>{t.splitManual}</p>
        </GapNote>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Scale} title={t.compareTitle} lead={t.compareLead} />
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Table2} title={t.rosterTitle} lead={t.rosterLead} />
        <ScooterTable
          columns={kidsScooterRecallColumns(t)}
          rows={notices as unknown as Array<Record<string, unknown>>}
          emptyCell={t.notStated}
          caption={t.rosterTitle}
        />
      </section>
    </AssetPage>
  );
}

export { KIDS_SCOOTER_RECALLS_PATH };