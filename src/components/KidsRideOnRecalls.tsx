/**
 * /kids-ride-on-recalls/ — component.
 *
 * Copy lives in src/data/kidsRideOnRecalls.ts; see KidsRideOnVoltage.tsx for
 * why no prose is shared between these pages.
 */
import { AlertOctagon, Flame, Scale, CalendarRange, Table2 } from "lucide-react";
import { SectionHeading, CoverageRow, RideOnTable, GapNote, AssetPage } from "./RideOnAssetPage";
import {
  kidsRideOnRecallStrings,
  kidsRideOnRecallColumns,
  kidsRideOnRecallVars,
  KIDS_RIDE_ON_RECALLS_PATH,
} from "../data/kidsRideOnRecalls";

const notices = kidsRideOnRecallVars;

export default function KidsRideOnRecalls({ lang = "en" }: { lang?: "zh" | "en" }) {
  const t = kidsRideOnRecallStrings[lang];
  const vars: Record<string, unknown> = { ...kidsRideOnRecallVars };

  return (
    <AssetPage
      eyebrow={t.eyebrow}
      title={t.h1}
      lead={t.lead}
      vars={vars}
      provenance={{ title: t.methodTitle, body: t.methodBody }}
    >
      <section className="space-y-4">
        <SectionHeading icon={Flame} title={t.hazardTitle} lead={t.hazardLead} />
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <tbody>
              {notices.breakdown.map((h) => (
                <CoverageRow key={h.label} label={h.label} n={h.count} of={notices.notices} />
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-3 text-sm text-slate-700 leading-7">
          <p>{t.hazardFire}</p>
          <p>{t.hazardOverlap}</p>
          <p>{t.hazardUnits}</p>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={CalendarRange} title={t.euTitle} lead={t.euLead} />
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <tbody>
              <CoverageRow label="Alerts in the ride-on bucket" n={notices.gate.total} of={notices.gate.total} />
              <CoverageRow label="Naming a ride-on or trike" n={notices.gate.named} of={notices.gate.total} />
              <CoverageRow label="Children's bicycles" n={notices.gate.bikeCount} of={notices.gate.total} tone="amber" />
            </tbody>
          </table>
        </div>
        <div className="space-y-3 text-sm text-slate-700 leading-7">
          <p>{t.euNamed}</p>
          <p>{t.euBikes}</p>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Scale} title={t.compareTitle} lead={t.compareLead} />
      </section>

      <section className="space-y-4">
        <SectionHeading icon={AlertOctagon} title={t.rosterTitle} lead={t.rosterLead} />
        <RideOnTable
          columns={kidsRideOnRecallColumns(t)}
          rows={notices.noticesList as unknown as Array<Record<string, unknown>>}
          emptyCell={t.notStated}
          caption={t.rosterTitle}
        />
      </section>
    </AssetPage>
  );
}

export { KIDS_RIDE_ON_RECALLS_PATH };
