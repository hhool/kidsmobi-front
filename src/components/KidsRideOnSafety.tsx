/**
 * /kids-ride-on-safety-standards/ — component.
 *
 * Copy lives in src/data/kidsRideOnSafety.ts; see KidsRideOnVoltage.tsx for why
 * no prose is shared between these pages.
 */
import { ShieldCheck, FileCheck, AlertTriangle, Table2 } from "lucide-react";
import { SectionHeading, CoverageRow, RideOnTable, GapNote, AssetPage } from "./RideOnAssetPage";
import {
  kidsRideOnSafetyStrings,
  kidsRideOnSafetyColumns,
  kidsRideOnSafetyVars,
  KIDS_RIDE_ON_SAFETY_PATH,
  RIDE_ON_DATASET,
} from "../data/kidsRideOnSafety";

const d = RIDE_ON_DATASET;
const total = d.totals.rideOnCars;

export default function KidsRideOnSafety({ lang = "en" }: { lang?: "zh" | "en" }) {
  const t = kidsRideOnSafetyStrings[lang];
  const vars: Record<string, unknown> = { ...kidsRideOnSafetyVars, total };
  const topicLabels: Record<string, string> = {
    remote: t.topicLabelRemote,
    topSpeed: t.topicLabelSpeed,
    seatbelt: t.topicLabelSeatbelt,
    supervision: t.topicLabelSupervision,
    notOnRoads: t.topicLabelRoads,
    antiRollover: t.topicLabelRollover,
    helmet: t.topicLabelHelmet,
  };

  return (
    <AssetPage
      eyebrow={t.eyebrow}
      title={t.h1}
      lead={t.lead}
      vars={vars}
      provenance={{ title: t.methodTitle, body: t.methodBody }}
    >
      <section className="space-y-4">
        <SectionHeading icon={ShieldCheck} title={t.coverageTitle} lead={t.coverageLead} />
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <tbody>
              <CoverageRow label="ASTM F963" n={kidsRideOnSafetyVars.astm} of={total} />
              <CoverageRow label="CPSC listing" n={kidsRideOnSafetyVars.cpsc} of={total} />
              <CoverageRow label="Certificate or test report named" n={0} of={total} tone="amber" />
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={FileCheck} title={t.controlsTitle} lead={t.controlsLead} />
        <div className="space-y-3 text-sm text-slate-700 leading-7">
          <p>{t.controlBrake}</p>
          <p>{t.controlReverse}</p>
          <p>{t.controlCharger}</p>
          <p>{t.controlSpeedLimiter}</p>
          <p>{t.controlBattery}</p>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={ShieldCheck} title={t.topicsTitle} lead={t.topicsLead} />
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <tbody>
              {kidsRideOnSafetyVars.topics.map((topic) => (
                <CoverageRow
                  key={topic.topic}
                  label={topicLabels[topic.topic] ?? topic.topic}
                  n={topic.count}
                  of={total}
                  tone={topic.count === 0 ? "amber" : "sky"}
                />
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-3 text-sm text-slate-700 leading-7">
          <p>{t.topicRemote}</p>
          <p>{t.topicSpeed}</p>
          <p>{t.topicSeatbelt}</p>
          <p>{t.topicSupervision}</p>
          <p>{t.topicRoads}</p>
          <p>{t.topicRollover}</p>
          <p>{t.topicHelmet}</p>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={FileCheck} title={t.materialsTitle} lead={t.materialsLead} />
        <p className="text-sm text-slate-600 leading-7 max-w-3xl">{t.materialsBody}</p>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={AlertTriangle} title={t.gapTitle} lead={t.gapLead} />
        <GapNote>
          <p>
            <strong>{t.gapCert}</strong>
          </p>
          <p>
            <strong>{t.gapHelmet}</strong>
          </p>
          <p>
            <strong>{t.gapSpeed}</strong>
          </p>
          <p>
            <strong>{t.gapAssembly}</strong>
          </p>
        </GapNote>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Table2} title={t.rosterTitle} lead={t.rosterLead} />
        <RideOnTable
          columns={kidsRideOnSafetyColumns(t)}
          rows={d.rows}
          emptyCell={t.notStated}
          caption={t.rosterTitle}
        />
      </section>
    </AssetPage>
  );
}

export { KIDS_RIDE_ON_SAFETY_PATH };
