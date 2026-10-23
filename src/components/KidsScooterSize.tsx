/**
 * /kids-scooter-size/ — component.
 *
 * Copy lives in src/data/kidsScooterSize.ts; see KidsScooterWheels.tsx for why
 * no prose is shared between these pages.
 */
import { Ruler, Move3d, AlertTriangle, Table2 } from "lucide-react";
import { SectionHeading, ScooterTable, GapNote, AssetPage } from "./ScooterAssetPage";
import {
  kidsScooterSizeStrings,
  kidsScooterSizeColumns,
  kidsScooterHandleHeights,
  kidsScooterSizeVars,
  KIDS_SCOOTER_SIZE_PATH,
  SCOOTER_DATASET,
} from "../data/kidsScooterSize";

const d = SCOOTER_DATASET;
const total = d.totals.kidsScooters;

export default function KidsScooterSize({ lang = "en" }: { lang?: "zh" | "en" }) {
  const t = kidsScooterSizeStrings[lang];
  const vars: Record<string, unknown> = { ...kidsScooterSizeVars, total };
  const heights = kidsScooterHandleHeights();

  return (
    <AssetPage
      eyebrow={t.eyebrow}
      title={t.h1}
      lead={t.lead}
      vars={vars}
      provenance={{ title: t.methodTitle, body: t.methodBody }}
    >
      <section className="space-y-4">
        <SectionHeading icon={Ruler} title={t.handleTitle} lead={t.handleLead} />
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="py-3 px-4 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                  {t.colBrand}
                </th>
                <th className="py-3 px-4 text-right text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                  {t.colHandle}
                </th>
                <th className="py-3 px-4 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                  {t.colAdjustable}
                </th>
              </tr>
            </thead>
            <tbody>
              {heights.map((h) => (
                <tr key={h.brand} className="border-t border-slate-100">
                  <td className="py-3 px-4 text-sm text-slate-700">{h.brand}</td>
                  <td className="py-3 px-4 text-sm tabular-nums text-right text-slate-900 font-bold">
                    {h.inches} in
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-700">
                    {h.adjustable ? t.yes : t.notStated}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Move3d} title={t.adjustTitle} lead={t.adjustLead} />
      </section>

      <section className="space-y-4">
        <SectionHeading icon={AlertTriangle} title={t.gapTitle} lead={t.gapLead} />
        <GapNote>
          <p>
            <strong>{t.gapDeck}</strong>
          </p>
          <p>
            <strong>{t.gapHandle}</strong>
          </p>
          <p>
            <strong>{t.gapUnits}</strong>
          </p>
        </GapNote>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Table2} title={t.rosterTitle} lead={t.rosterLead} />
        <ScooterTable
          columns={kidsScooterSizeColumns(t)}
          rows={d.rows}
          emptyCell={t.notStated}
          caption={t.rosterTitle}
        />
      </section>
    </AssetPage>
  );
}

export { KIDS_SCOOTER_SIZE_PATH };