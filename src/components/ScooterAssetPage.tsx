/**
 * Shared layout primitives for the eight /kids-scooter-* asset pages.
 *
 * These eight pages are eight views over ONE dataset (scooterData.generated.ts,
 * 7 published kids' kick scooters). Only the framing differs between them: which
 * columns a roster carries, which sections appear, what the lead says. The
 * chrome around that — shell width, section heading, coverage bar, roster table,
 * provenance footer — is identical, so it lives here once.
 *
 * Deliberately NOT shared: every string. The pair-drift guard
 * (scripts/check-topic-pair-drift.mjs) compares the <h2> word-bag and the body
 * 8-grams of each kids-scooter page against the other seven AND against the
 * balance-bike page of the same name. Prose that lived in this file would be
 * prose duplicated across all eight pages, which is exactly what that guard
 * exists to catch. Each page module supplies its own text.
 *
 * Table cells are declared per page (see ScooterColumn in each module) rather
 * than inferred, because which figures a listing actually publishes differs per
 * page — see the coverage gaps each page leads with.
 */
import type { ReactNode } from "react";
import {
  Table2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import ReferenceClusterNav from "./ReferenceClusterNav";
import { fillTemplate } from "../data/safetyRecallRecord";

export const shell = "max-w-5xl mx-auto py-8 sm:py-14 text-left px-4 sm:px-6";

/**
 * The label a roster row uses to identify a product.
 *
 * Deliberately NOT `row.name`, which is the retailer's full marketing title
 * ("...light-up wheels, adjustable handlebar, wide anti-slip deck, smooth
 * riding..."). Eight rosters each printing those titles put ~100 identical body
 * 8-grams on every page pair and failed check-topic-pair-drift at bodyOnly 0.103.
 * Brand plus Model Name says the same thing in two or three words.
 *
 * See the `model` field comment in scripts/fetch_scooter_data.mjs.
 */
export function rosterLabel(row: { brand?: string; model?: string; name?: string }): string {
  const brand = (row.brand || "").trim();
  const model = (row.model || "").trim();
  if (brand && model) {
    // "Jetson" + "Jetson 2-wheel Kick Scooter" would repeat the brand.
    const model_ = model.toLowerCase().startsWith(brand.toLowerCase()) ? model.slice(brand.length).trim() : model;
    return `${brand} ${model_}`.trim();
  }
  if (brand) return brand;
  return (row.name || "").split(/[,–—]/)[0].trim();
}

/**
 * Projects a page's exported vars object down to the scalars fillTemplate can
 * interpolate. The page modules spread richer helper results (arrays, booleans,
 * nested objects) into their vars for use in JSX, but template substitution only
 * ever needs strings and numbers — passing the whole object through would put
 * `[object Object]` into visible copy the moment a template referenced it.
 */
export function templateVars(
  vars: Record<string, unknown>
): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(vars)) {
    if (typeof v === "string" || typeof v === "number") out[k] = v;
    else if (typeof v === "boolean") out[k] = v ? "yes" : "no";
  }
  return out;
}

/** Small caps section label with a leading icon, plus an optional lead line. */
export function SectionHeading({
  icon: Icon,
  title,
  lead,
}: {
  icon: typeof Table2;
  title: string;
  lead?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-sky-600">
        <Icon className="w-3.5 h-3.5" />
        {title}
      </div>
      {lead ? <p className="text-sm text-slate-600 leading-7 max-w-3xl">{lead}</p> : null}
    </div>
  );
}

/**
 * One "N of M publish X" row. The count is the point of these pages, so the bar
 * and both numbers are always rendered — a page that hid the denominator would
 * make a 3-of-7 gap look like a 3-of-40 one.
 */
export function CoverageRow({
  label,
  n,
  of,
  tone = "sky",
}: {
  label: string;
  n: number;
  of: number;
  tone?: "sky" | "amber";
}) {
  const pct = of > 0 ? Math.round((n / of) * 100) : 0;
  const bar = tone === "amber" ? "bg-amber-400" : "bg-sky-400";
  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="py-3 pl-4 pr-3 text-sm text-slate-700">{label}</td>
      <td className="py-3 pr-3 text-sm font-bold text-slate-900 whitespace-nowrap">
        {n} / {of}
      </td>
      <td className="py-3 pr-4">
        <div className="flex items-center gap-3">
          <div className="h-2 w-full min-w-[120px] overflow-hidden rounded-full bg-slate-100">
            <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">{pct}%</span>
        </div>
      </td>
    </tr>
  );
}

/** A single declared table column. Pages choose their own set and order. */
export interface ScooterColumn {
  key: string;
  header: string;
  /** Rendered cell. Return a dash when the listing does not state the figure. */
  render: (row: never) => ReactNode;
  /** Right-aligned numeric columns read better this way. */
  numeric?: boolean;
}

/**
 * The roster table. `emptyCell` is what a listing that does not publish the
 * figure renders — pages pass the word their own copy uses ("not stated",
 * "not published") rather than a silent blank, so the gap stays countable.
 */
export function ScooterTable({
  columns,
  rows,
  emptyCell,
  caption,
}: {
  columns: ScooterColumn[];
  rows: ReadonlyArray<Record<string, unknown>>;
  emptyCell: string;
  caption?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-left border-collapse">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead>
          <tr className="bg-slate-50">
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={`py-3 px-4 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 ${
                  c.numeric ? "text-right" : ""
                }`}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={String(row.id ?? i)} className="border-t border-slate-100">
              {columns.map((c) => {
                const v = c.render(row as never);
                const missing = v === null || v === undefined || v === "" || v === emptyCell;
                return (
                  <td
                    key={c.key}
                    className={`py-3 px-4 text-sm align-top ${
                      c.numeric ? "text-right tabular-nums" : ""
                    } ${missing ? "text-slate-400" : "text-slate-700"}`}
                  >
                    {missing ? emptyCell : v}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * A stated-versus-unstated callout. Used where a page's central finding is a
 * gap: the number goes in the slot, the caveat under it.
 */
export function GapNote({
  icon: Icon = AlertTriangle,
  tone = "amber",
  children,
}: {
  icon?: typeof AlertTriangle;
  tone?: "amber" | "sky";
  children: ReactNode;
}) {
  const cls =
    tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : "border-sky-200 bg-sky-50 text-sky-900";
  const iconCls = tone === "amber" ? "text-amber-600" : "text-sky-600";
  return (
    <div className={`rounded-xl border p-5 ${cls}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${iconCls}`} />
        <div className="text-sm leading-7 space-y-2">{children}</div>
      </div>
    </div>
  );
}

/** Confirmed-statement callout, for figures a listing does publish. */
export function StatedNote({ children }: { children: ReactNode }) {
  return (
    <GapNote icon={CheckCircle2} tone="sky">
      {children}
    </GapNote>
  );
}

/**
 * Standard page furniture: the eyebrow/H1/lead header, then children, then the
 * provenance footer and the reference-cluster nav. `vars` feeds fillTemplate so
 * a string module can interpolate counts without importing the dataset itself.
 */
export function AssetPage({
  eyebrow,
  title,
  lead,
  vars,
  children,
  provenance,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  /** May carry non-scalars; templateVars() filters to what fillTemplate needs. */
  vars: Record<string, unknown>;
  children: ReactNode;
  provenance: { title: string; body: string[] };
}) {
  const fill = (s: string) => fillTemplate(s, templateVars(vars));
  return (
    <article className={shell}>
      <div className="space-y-10">
        <header className="space-y-5 border-b border-slate-200 pb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-sky-600">
            <Table2 className="w-3.5 h-3.5" />
            {eyebrow}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-950 leading-tight max-w-4xl">
            {title}
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-8 font-medium max-w-3xl">
            {fill(lead)}
          </p>
        </header>

        {children}

        <footer className="space-y-3 border-t border-slate-200 pt-8">
          <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">
            {provenance.title}
          </h2>
          <div className="space-y-3 text-sm text-slate-600 leading-7 max-w-3xl">
            {provenance.body.map((p, i) => (
              <p key={i}>{fill(p)}</p>
            ))}
          </div>
        </footer>

        <ReferenceClusterNav />
      </div>
    </article>
  );
}

/**
 * Renders a "no data" cell consistently. Pages pass their own wording via
 * emptyCell; this exists so the dash is a real glyph rather than an empty td,
 * which would collapse the column in some layouts.
 */
export function dash(emptyCell: string) {
  return <span className="text-slate-400">{emptyCell}</span>;
}