/**
 * Prerender bodies for the eight /kids-tricycle-* asset pages.
 *
 * Mirrors scripts/kidsRideOnPages.ts: its own HTML skeleton (section, coverageTable,
 * gapBox, statedBox, rosterTable, provenance, header) and the column descriptors
 * from each page's data module. Every string still comes from the page's own
 * string module, so the visible prose of the eight pages stays as distinct as it
 * is in the React components. scripts/check-topic-pair-drift.mjs compares the
 * rendered body 8-grams and <h2> word-bags of these pages against each other and
 * against the balance-bike, kids-bike, kids-scooter and ride-on equivalents —
 * shared SKELETON is fine, shared PROSE is not.
 *
 * The English strings are used here because the static HTML is the English build;
 * the hydrated SPA swaps in `zh` client-side, same as every other asset page.
 */
import {
  kidsTricycleSizeStrings,
  kidsTricycleSizeVars,
  kidsTricycleSizeColumns,
  KIDS_TRICYCLE_SIZE_PATH,
} from "../src/data/kidsTricycleSize";
import {
  kidsTricycleAgeStrings,
  kidsTricycleAgeVars,
  kidsTricycleAgeColumns,
  KIDS_TRICYCLE_AGE_PATH,
} from "../src/data/kidsTricycleAge";
import {
  kidsTricyclePriceStrings,
  kidsTricyclePriceVars,
  kidsTricyclePriceColumns,
  KIDS_TRICYCLE_PRICE_PATH,
} from "../src/data/kidsTricyclePrice";
import {
  kidsTricycleWeightStrings,
  kidsTricycleWeightVars,
  kidsTricycleWeightColumns,
  KIDS_TRICYCLE_WEIGHT_PATH,
} from "../src/data/kidsTricycleWeight";
import {
  kidsTricycleTypesStrings,
  kidsTricycleTypesVars,
  kidsTricycleTypesColumns,
  KIDS_TRICYCLE_TYPES_PATH,
} from "../src/data/kidsTricycleTypes";
import {
  kidsTricycleSafetyStrings,
  kidsTricycleSafetyVars,
  kidsTricycleSafetyColumns,
  KIDS_TRICYCLE_SAFETY_PATH,
} from "../src/data/kidsTricycleSafety";
import {
  kidsTricycleFeedbackStrings,
  kidsTricycleFeedbackVars,
  kidsTricycleFeedbackColumns,
  KIDS_TRICYCLE_FEEDBACK_PATH,
} from "../src/data/kidsTricycleFeedback";
import {
  kidsTricycleRecallStrings,
  kidsTricycleRecallVars,
  kidsTricycleRecallColumns,
  KIDS_TRICYCLE_RECALLS_PATH,
} from "../src/data/kidsTricycleRecalls";
import { TRICYCLE_DATASET } from "../src/data/tricycleData.generated";
import { fillTemplate } from "../src/data/safetyRecallRecord";
import type { ClusterColumn } from "../src/components/ClusterAssetPage";

const d = TRICYCLE_DATASET;
const total = d.totals.tricycles;

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Keeps only the scalars fillTemplate can interpolate; page vars also carry
 *  arrays and nested objects for JSX use, which must never reach a template. */
function scalars(vars: Record<string, unknown>): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(vars)) {
    if (typeof v === "string" || typeof v === "number") out[k] = v;
    else if (typeof v === "boolean") out[k] = v ? "yes" : "no";
  }
  return out;
}

const fill = (s: string, vars: Record<string, unknown>) => fillTemplate(s, scalars(vars));

/** Section wrapper with the eyebrow label + optional lead paragraph. */
function section(eyebrow: string, title: string, lead: string, inner: string) {
  return `
  <section style="margin-top:40px;">
    <div style="font-size:10px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;color:#0284c7;margin-bottom:8px;">${esc(eyebrow)}</div>
    <h2 style="font-size:20px;font-weight:900;color:#0f172a;margin:0 0 10px;line-height:1.3;">${esc(title)}</h2>
    ${lead ? `<p style="font-size:14px;line-height:1.75;color:#475569;margin:0 0 14px;">${esc(lead)}</p>` : ""}
    ${inner}
  </section>`;
}

/** "N of M" coverage table, matching the React CoverageRow semantics. */
function coverageTable(rows: Array<[string, number, number?]>) {
  const body = rows
    .map(([label, n, of]) => {
      const denom = of ?? total;
      const pct = denom > 0 ? Math.round((n / denom) * 100) : 0;
      return `
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#334155;">${esc(label)}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:800;color:#0f172a;white-space:nowrap;">${n} / ${denom}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:12px;color:#64748b;white-space:nowrap;">${pct}%</td>
      </tr>`;
    })
    .join("");
  return `<table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
    <tbody>${body}</tbody>
  </table>`;
}

/** Amber "stated vs unstated" callout. */
function gapBox(lines: string[]) {
  const body = lines
    .map(
      (l) =>
        `<p style="margin:0 0 8px;font-size:13px;line-height:1.75;color:#78350f;"><strong>${esc(l)}</strong></p>`
    )
    .join("");
  return `<div style="border:1px solid #fde68a;background:#fffbeb;border-radius:12px;padding:16px 18px;">${body}</div>`;
}

/** Sky "here is what is established" callout. */
function statedBox(lines: string[]) {
  const body = lines
    .map(
      (l) =>
        `<p style="margin:0 0 8px;font-size:13px;line-height:1.75;color:#0c4a6e;">${esc(l)}</p>`
    )
    .join("");
  return `<div style="border:1px solid #bae6fd;background:#f0f9ff;border-radius:12px;padding:16px 18px;">${body}</div>`;
}

/**
 * Generic roster table driven by the same column descriptors the React
 * components use, so the static HTML and the hydrated DOM show the same columns.
 */
function rosterTable(
  columns: ClusterColumn[],
  rows: ReadonlyArray<Record<string, unknown>>,
  emptyCell: string,
  caption: string,
) {
  const head = columns
    .map(
      (c) =>
        `<th scope="col" style="padding:10px 14px;background:#f8fafc;font-size:10px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#64748b;${c.numeric ? "text-align:right;" : ""}">${esc(c.header)}</th>`
    )
    .join("");
  const body = rows
    .map((row) => {
      const cells = columns
        .map((c) => {
          const v = c.render(row as never);
          const missing = v === null || v === undefined || v === "" || v === emptyCell;
          return `<td style="padding:10px 14px;border-top:1px solid #f1f5f9;font-size:13px;vertical-align:top;${c.numeric ? "text-align:right;" : ""}${missing ? "color:#94a3b8;" : "color:#334155;"}">${missing ? esc(emptyCell) : esc(v)}</td>`;
        })
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");
  return `<table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
    <caption style="sr-only">${esc(caption)}</caption>
    <thead><tr>${head}</tr></thead>
    <tbody>${body}</tbody>
  </table>`;
}

/** Provenance footer, rendered identically to the React AssetPage footer. */
function provenance(title: string, body: string[], vars: Record<string, unknown>) {
  return `
  <footer style="margin-top:40px;padding-top:24px;border-top:1px solid #e2e8f0;">
    <h2 style="font-size:13px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;color:#64748b;margin:0 0 12px;">${esc(title)}</h2>
    ${body
      .map(
        (p) =>
          `<p style="font-size:13px;line-height:1.75;color:#475569;margin:0 0 10px;max-width:48rem;">${esc(fill(p, vars))}</p>`
      )
      .join("")}
  </footer>`;
}

function header(eyebrow: string, h1: string, lead: string, vars: Record<string, unknown>) {
  return `
  <header style="padding-bottom:28px;border-bottom:1px solid #e2e8f0;">
    <div style="display:inline-block;border:1px solid #bae6fd;background:#f0f9ff;border-radius:999px;padding:4px 12px;font-size:10px;font-weight:900;letter-spacing:.2em;text-transform:uppercase;color:#0284c7;margin-bottom:14px;">${esc(eyebrow)}</div>
    <h1 style="font-size:30px;font-weight:900;color:#020617;line-height:1.2;margin:0 0 14px;max-width:48rem;">${esc(h1)}</h1>
    <p style="font-size:16px;line-height:1.8;color:#475569;font-weight:500;margin:0;max-width:48rem;">${esc(fill(lead, vars))}</p>
  </header>`;
}

export interface TricycleRoutePage {
  route: string;
  title: string;
  description: string;
  body: string;
  jsonLd: Array<Record<string, unknown>>;
  skipTitleH1: boolean;
  keywords: string[];
  h1En: string;
}

/** WebPage JSON-LD, one node per page (guard: one node per @type). */
function webPageJsonLd(title: string, description: string, route: string, origin: string) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: title,
      url: `${origin}${route}`,
      description,
      inLanguage: "en",
    },
  ];
}

/* ------------------------------------------------------------------ *
 * The eight page builders. Each supplies its OWN strings; only the
 * skeleton above is shared.
 * ------------------------------------------------------------------ */

function sizePage(origin: string, seo: { title: string; description: string; keywords: string[] }): TricycleRoutePage {
  const t = kidsTricycleSizeStrings.en;
  const vars: Record<string, unknown> = { ...kidsTricycleSizeVars, total };
  const body = [
    header(t.eyebrow, t.h1, t.lead, vars),
    section(t.eyebrow, t.sourceTitle, t.sourceLead,
      coverageTable([
        ["Dimensions stated", d.totals.withDimensions],
        ["Size label stated", kidsTricycleSizeVars.withSizeLabel],
        ["Size field holds a word", kidsTricycleSizeVars.sizeLabelWord],
        ["Size field holds a dimension string", kidsTricycleSizeVars.sizeLabelDim],
      ]) +
      `<div style="height:12px;"></div>
      <p style="font-size:14px;line-height:1.75;color:#334155;margin:0;">${esc(t.sourceBody)}</p>`),
    section(t.eyebrow, t.fieldTitle, t.fieldLead,
      `<div style="font-size:14px;line-height:1.75;color:#334155;">
        <p style="margin:0 0 10px;">${esc(t.fieldWord)}</p>
        <p style="margin:0 0 10px;">${esc(t.fieldDim)}</p>
        <p style="margin:0;">${esc(t.fieldEmpty)}</p>
      </div>`),
    section(t.eyebrow, t.rangeTitle, t.rangeLead,
      `<div style="font-size:14px;line-height:1.75;color:#334155;">
        <p style="margin:0 0 10px;">${esc(t.rangeLongest)}</p>
        <p style="margin:0 0 10px;">${esc(t.rangeWidest)}</p>
        <p style="margin:0;">${esc(t.rangeTallest)}</p>
      </div>`),
    section(t.eyebrow, t.gapTitle, t.gapLead, gapBox([t.gapMissing, t.gapLabel])),
    section(t.eyebrow, t.rosterTitle, t.rosterLead,
      rosterTable(kidsTricycleSizeColumns(t), d.rows as never, t.notStated, t.rosterTitle)),
    provenance(t.methodTitle, t.methodBody, vars),
  ].join("\n");

  return {
    route: KIDS_TRICYCLE_SIZE_PATH,
    title: seo.title,
    description: seo.description,
    body,
    jsonLd: webPageJsonLd(seo.title, seo.description, KIDS_TRICYCLE_SIZE_PATH, origin),
    skipTitleH1: true,
    keywords: seo.keywords,
    h1En: t.h1,
  };
}

function agePage(origin: string, seo: { title: string; description: string; keywords: string[] }): TricycleRoutePage {
  const t = kidsTricycleAgeStrings.en;
  const vars: Record<string, unknown> = { ...kidsTricycleAgeVars, total };
  const body = [
    header(t.eyebrow, t.h1, t.lead, vars),
    section(t.eyebrow, t.labelTitle, t.labelLead,
      coverageTable([
        ["Carries an age label", kidsTricycleAgeVars.labelled],
        ["Label carries a number", kidsTricycleAgeVars.numeric],
        ["Label is a word only", kidsTricycleAgeVars.wordOnly],
        ["No age label", kidsTricycleAgeVars.unlabelled],
      ]) +
      `<div style="height:12px;"></div>
      <div style="font-size:14px;line-height:1.75;color:#334155;">
        <p style="margin:0 0 10px;">${esc(t.labelNumeric)}</p>
        <p style="margin:0 0 10px;">${esc(t.labelWord)}</p>
        <p style="margin:0;">${esc(t.labelNone)}</p>
      </div>`),
    section(t.eyebrow, t.floorTitle, t.floorLead,
      coverageTable(
        kidsTricycleAgeVars.minBuckets.map((b) => [`Starts at ${b.months} months`, b.count] as [string, number])
      ) +
      `<div style="height:12px;"></div>
      <div style="font-size:14px;line-height:1.75;color:#334155;">
        <p style="margin:0 0 10px;">${esc(t.floorModal)}</p>
        <p style="margin:0;">${esc(t.floorSpread)}</p>
      </div>`),
    section(t.eyebrow, t.ceilingTitle, t.ceilingLead,
      coverageTable(
        kidsTricycleAgeVars.maxBuckets.map((b) => [`Ends at ${b.months} months`, b.count] as [string, number])
      ) +
      `<div style="height:12px;"></div>
      <div style="font-size:14px;line-height:1.75;color:#334155;">
        <p style="margin:0 0 10px;">${esc(t.ceilingModal)}</p>
        <p style="margin:0;">${esc(t.ceilingGap)}</p>
      </div>`),
    section(t.eyebrow, t.gapTitle, t.gapLead, gapBox([t.gapNoLabel, t.gapCeiling])),
    section(t.eyebrow, t.rosterTitle, t.rosterLead,
      rosterTable(kidsTricycleAgeColumns(t), d.rows as never, t.notStated, t.rosterTitle)),
    provenance(t.methodTitle, t.methodBody, vars),
  ].join("\n");

  return {
    route: KIDS_TRICYCLE_AGE_PATH,
    title: seo.title,
    description: seo.description,
    body,
    jsonLd: webPageJsonLd(seo.title, seo.description, KIDS_TRICYCLE_AGE_PATH, origin),
    skipTitleH1: true,
    keywords: seo.keywords,
    h1En: t.h1,
  };
}

function pricePage(origin: string, seo: { title: string; description: string; keywords: string[] }): TricycleRoutePage {
  const t = kidsTricyclePriceStrings.en;
  const vars: Record<string, unknown> = { ...kidsTricyclePriceVars, total };
  const body = [
    header(t.eyebrow, t.h1, t.lead, vars),
    section(t.eyebrow, t.gapTitle, t.gapLead, gapBox([t.gapWide, t.gapTier, t.gapReview])),
    section(t.eyebrow, t.bandsTitle, t.bandsLead,
      coverageTable([
        ["Under $50", kidsTricyclePriceVars.bandCounts.under50],
        ["$50–$75", kidsTricyclePriceVars.bandCounts["50to75"]],
        ["$75–$100", kidsTricyclePriceVars.bandCounts["75to100"]],
        ["Over $100", kidsTricyclePriceVars.bandCounts.over100],
      ]) +
      `<div style="height:12px;"></div>
      <div style="font-size:14px;line-height:1.75;color:#334155;">
        <p style="margin:0 0 10px;">${esc(t.bandUnder)}</p>
        <p style="margin:0 0 10px;">${esc(t.band50to75)}</p>
        <p style="margin:0 0 10px;">${esc(t.band75to100)}</p>
        <p style="margin:0;">${esc(t.bandOver100)}</p>
      </div>`),
    section(t.eyebrow, t.ratingTitle, t.ratingLead,
      statedBox([t.ratingNote]) +
      `<div style="height:12px;"></div>
      <div style="font-size:14px;line-height:1.75;color:#334155;">
        <p style="margin:0 0 10px;">${esc(t.ratingBest)}</p>
        <p style="margin:0;">${esc(t.ratingPopular)}</p>
      </div>`),
    section(t.eyebrow, t.rosterTitle, t.rosterLead,
      rosterTable(kidsTricyclePriceColumns(t), d.rows as never, t.notStated, t.rosterTitle)),
    provenance(t.methodTitle, t.methodBody, vars),
  ].join("\n");

  return {
    route: KIDS_TRICYCLE_PRICE_PATH,
    title: seo.title,
    description: seo.description,
    body,
    jsonLd: webPageJsonLd(seo.title, seo.description, KIDS_TRICYCLE_PRICE_PATH, origin),
    skipTitleH1: true,
    keywords: seo.keywords,
    h1En: t.h1,
  };
}

function weightPage(origin: string, seo: { title: string; description: string; keywords: string[] }): TricycleRoutePage {
  const t = kidsTricycleWeightStrings.en;
  const vars: Record<string, unknown> = { ...kidsTricycleWeightVars, total };
  const body = [
    header(t.eyebrow, t.h1, t.lead, vars),
    section(t.eyebrow, t.ownTitle, t.ownLead,
      coverageTable([
        ["Own weight stated", d.totals.withItemWeight],
        ["Rider limit stated", d.totals.withWeightLimit],
        ["Both published", kidsTricycleWeightVars.pairs],
        ["Own weight only", kidsTricycleWeightVars.ownOnly],
        ["Rider limit only", kidsTricycleWeightVars.limitOnly],
        ["Implausible own weight", d.totals.withImplausibleItemWeight],
      ]) +
      `<div style="height:12px;"></div>
      <p style="font-size:14px;line-height:1.75;color:#334155;margin:0;">${esc(t.ownBody)}</p>`),
    section(t.eyebrow, t.ratioTitle, t.ratioLead,
      `<div style="font-size:14px;line-height:1.75;color:#334155;">
        <p style="margin:0 0 10px;">${esc(t.ratioTight)}</p>
        <p style="margin:0;">${esc(t.ratioWide)}</p>
      </div>`),
    section(t.eyebrow, t.gapTitle, t.gapLead,
      gapBox([t.gapPairs, t.gapHalves, t.gapUnits, t.gapImplausible])),
    section(t.eyebrow, t.rosterTitle, t.rosterLead,
      rosterTable(kidsTricycleWeightColumns(t), d.rows as never, t.notStated, t.rosterTitle)),
    provenance(t.methodTitle, t.methodBody, vars),
  ].join("\n");

  return {
    route: KIDS_TRICYCLE_WEIGHT_PATH,
    title: seo.title,
    description: seo.description,
    body,
    jsonLd: webPageJsonLd(seo.title, seo.description, KIDS_TRICYCLE_WEIGHT_PATH, origin),
    skipTitleH1: true,
    keywords: seo.keywords,
    h1En: t.h1,
  };
}

function typesPage(origin: string, seo: { title: string; description: string; keywords: string[] }): TricycleRoutePage {
  const t = kidsTricycleTypesStrings.en;
  const vars: Record<string, unknown> = { ...kidsTricycleTypesVars, total };
  const body = [
    header(t.eyebrow, t.h1, t.lead, vars),
    section(t.eyebrow, t.formTitle, t.formLead,
      coverageTable([
        ["Classic trike", d.forms.classic],
        ["Convertible trike", d.forms.convertible],
        ["Push-only trike", d.forms.push],
        ["Stroller-only trike", d.forms.stroller],
      ]) +
      `<div style="height:12px;"></div>
      <div style="font-size:14px;line-height:1.75;color:#334155;">
        <p style="margin:0 0 10px;">${esc(t.formClassic)}</p>
        <p style="margin:0 0 10px;">${esc(t.formConvertible)}</p>
        <p style="margin:0;">${esc(t.formAbsent)}</p>
      </div>`),
    section(t.eyebrow, t.featureTitle, t.featureLead,
      coverageTable(
        kidsTricycleTypesVars.featureDefs.map(
          (f) => [f.label, d.features[f.key]] as [string, number]
        )
      )),
    section(t.eyebrow, t.gapTitle, t.gapLead, gapBox([t.gapPush, t.gapBike])),
    section(t.eyebrow, t.rosterTitle, t.rosterLead,
      rosterTable(kidsTricycleTypesColumns(t), d.rows as never, t.notStated, t.rosterTitle)),
    provenance(t.methodTitle, t.methodBody, vars),
  ].join("\n");

  return {
    route: KIDS_TRICYCLE_TYPES_PATH,
    title: seo.title,
    description: seo.description,
    body,
    jsonLd: webPageJsonLd(seo.title, seo.description, KIDS_TRICYCLE_TYPES_PATH, origin),
    skipTitleH1: true,
    keywords: seo.keywords,
    h1En: t.h1,
  };
}

function safetyPage(origin: string, seo: { title: string; description: string; keywords: string[] }): TricycleRoutePage {
  const t = kidsTricycleSafetyStrings.en;
  const vars: Record<string, unknown> = { ...kidsTricycleSafetyVars, total };
  const body = [
    header(t.eyebrow, t.h1, t.lead, vars),
    section(t.eyebrow, t.coverageTitle, t.coverageLead,
      coverageTable([
        ["ASTM F963 declared", kidsTricycleSafetyVars.astm],
        ["Any compliance declared", d.totals.withCompliance],
        ["No compliance declared", kidsTricycleSafetyVars.noCompliance],
        ["Certificate or report named", 0],
        ["Category id mismatch", d.totals.categoryIdMismatch],
      ])),
    section(t.eyebrow, t.featureTitle, t.featureLead,
      `<div style="font-size:14px;line-height:1.75;color:#334155;">
        <p style="margin:0 0 10px;">${esc(t.featPush)}</p>
        <p style="margin:0 0 10px;">${esc(t.featCanopy)}</p>
        <p style="margin:0 0 10px;">${esc(t.featEva)}</p>
        <p style="margin:0;">${esc(t.featBalance)}</p>
      </div>`),
    section(t.eyebrow, t.gapTitle, t.gapLead,
      gapBox([t.gapCert, t.gapNoMark, t.gapMismatch])),
    section(t.eyebrow, t.rosterTitle, t.rosterLead,
      rosterTable(kidsTricycleSafetyColumns(t), d.rows as never, t.notStated, t.rosterTitle)),
    provenance(t.methodTitle, t.methodBody, vars),
  ].join("\n");

  return {
    route: KIDS_TRICYCLE_SAFETY_PATH,
    title: seo.title,
    description: seo.description,
    body,
    jsonLd: webPageJsonLd(seo.title, seo.description, KIDS_TRICYCLE_SAFETY_PATH, origin),
    skipTitleH1: true,
    keywords: seo.keywords,
    h1En: t.h1,
  };
}

function feedbackPage(origin: string, seo: { title: string; description: string; keywords: string[] }): TricycleRoutePage {
  const t = kidsTricycleFeedbackStrings.en;
  const vars: Record<string, unknown> = { ...kidsTricycleFeedbackVars, total };

  const themeTable = `<table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
    <thead><tr>
      <th style="padding:10px 14px;background:#f8fafc;font-size:10px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#64748b;">${esc(t.themeColTopic)}</th>
      <th style="padding:10px 14px;background:#f8fafc;font-size:10px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#64748b;text-align:right;">${esc(t.themeColCount)}</th>
      <th style="padding:10px 14px;background:#f8fafc;font-size:10px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#64748b;">${esc(t.themeColWho)}</th>
    </tr></thead>
    <tbody>${kidsTricycleFeedbackVars.themes
      .map(
        (row) => `<tr>
        <td style="padding:10px 14px;border-top:1px solid #f1f5f9;font-size:13px;color:#334155;">${esc(row.theme)}</td>
        <td style="padding:10px 14px;border-top:1px solid #f1f5f9;font-size:13px;font-weight:800;color:#0f172a;text-align:right;">${row.count} / ${total}</td>
        <td style="padding:10px 14px;border-top:1px solid #f1f5f9;font-size:13px;color:#475569;">${esc(row.labels)}</td>
      </tr>`
      )
      .join("")}</tbody>
  </table>`;

  const hedgeTable = `<table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
    <thead><tr>
      <th style="padding:10px 14px;background:#f8fafc;font-size:10px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#64748b;">${esc(t.hedgeColKind)}</th>
      <th style="padding:10px 14px;background:#f8fafc;font-size:10px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#64748b;text-align:right;">${esc(t.hedgeColCount)}</th>
      <th style="padding:10px 14px;background:#f8fafc;font-size:10px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#64748b;">${esc(t.hedgeColWho)}</th>
    </tr></thead>
    <tbody>
      <tr>
        <td style="padding:10px 14px;border-top:1px solid #f1f5f9;font-size:13px;color:#334155;">${esc(t.hedgeMixed)}</td>
        <td style="padding:10px 14px;border-top:1px solid #f1f5f9;font-size:13px;font-weight:800;color:#0f172a;text-align:right;">${kidsTricycleFeedbackVars.mixedCount} / ${total}</td>
        <td style="padding:10px 14px;border-top:1px solid #f1f5f9;font-size:13px;color:#475569;">${esc(t.hedgeColWho)}</td>
      </tr>
      <tr>
        <td style="padding:10px 14px;border-top:1px solid #f1f5f9;font-size:13px;color:#334155;">${esc(t.hedgeMissing)}</td>
        <td style="padding:10px 14px;border-top:1px solid #f1f5f9;font-size:13px;font-weight:800;color:#0f172a;text-align:right;">${total - kidsTricycleFeedbackVars.withSummary} / ${total}</td>
        <td style="padding:10px 14px;border-top:1px solid #f1f5f9;font-size:13px;color:#475569;">${esc(t.hedgeColWho)}</td>
      </tr>
    </tbody>
  </table>`;

  const body = [
    header(t.eyebrow, t.h1, t.lead, vars),
    section(t.eyebrow, t.ratingTitle, t.ratingLead,
      statedBox([t.ratingNote])),
    section(t.eyebrow, t.themeTitle, t.themeIntro, themeTable),
    section(t.eyebrow, t.hedgeTitle, t.hedgeLead, hedgeTable),
    section(t.eyebrow, t.gapTitle, t.gapLead, gapBox([t.gapNoSummary, t.gapNoText])),
    section(t.eyebrow, t.listingTitle, t.listingLead,
      rosterTable(kidsTricycleFeedbackColumns(t), d.rows as never, t.notStated, t.listingTitle)),
    provenance(t.methodTitle, t.methodBody, vars),
  ].join("\n");

  return {
    route: KIDS_TRICYCLE_FEEDBACK_PATH,
    title: seo.title,
    description: seo.description,
    body,
    jsonLd: webPageJsonLd(seo.title, seo.description, KIDS_TRICYCLE_FEEDBACK_PATH, origin),
    skipTitleH1: true,
    keywords: seo.keywords,
    h1En: t.h1,
  };
}

function recallsPage(origin: string, seo: { title: string; description: string; keywords: string[] }): TricycleRoutePage {
  const t = kidsTricycleRecallStrings.en;
  const vars: Record<string, unknown> = { ...kidsTricycleRecallVars, total };
  const body = [
    header(t.eyebrow, t.h1, t.lead, vars),
    section(t.eyebrow, t.coverageTitle, t.coverageLead,
      coverageTable([
        ["ASTM F963 declared", kidsTricycleRecallVars.astm],
        ["Any compliance declared", d.totals.withCompliance],
        ["No compliance declared", kidsTricycleRecallVars.noCompliance],
        ["Category id mismatch", d.totals.categoryIdMismatch],
        ["Recall notices matched", kidsTricycleRecallVars.notices],
      ]) +
      `<div style="height:12px;"></div>
      <p style="font-size:14px;line-height:1.75;color:#334155;margin:0;">${esc(t.coverageBody)}</p>`),
    section(t.eyebrow, t.gapTitle, t.gapLead,
      gapBox([t.gapNoField, t.gapNoMark, t.gapMismatch])),
    section(t.eyebrow, t.rosterTitle, t.rosterLead,
      rosterTable(kidsTricycleRecallColumns(t), d.rows as never, t.notStated, t.rosterTitle)),
    provenance(t.methodTitle, t.methodBody, vars),
  ].join("\n");

  return {
    route: KIDS_TRICYCLE_RECALLS_PATH,
    title: seo.title,
    description: seo.description,
    body,
    jsonLd: webPageJsonLd(seo.title, seo.description, KIDS_TRICYCLE_RECALLS_PATH, origin),
    skipTitleH1: true,
    keywords: seo.keywords,
    h1En: t.h1,
  };
}

/**
 * All eight pages, in the order they should appear in the sitemap cluster.
 * `origin` is used only to build absolute JSON-LD URLs.
 */
export function renderKidsTricyclePages(
  origin: string,
  seoByPath: Record<string, { en: { title: string; description: string; keywords: string[] } }>
): TricycleRoutePage[] {
  const seo = (p: string) => seoByPath[p].en;
  return [
    sizePage(origin, seo(KIDS_TRICYCLE_SIZE_PATH)),
    agePage(origin, seo(KIDS_TRICYCLE_AGE_PATH)),
    pricePage(origin, seo(KIDS_TRICYCLE_PRICE_PATH)),
    weightPage(origin, seo(KIDS_TRICYCLE_WEIGHT_PATH)),
    typesPage(origin, seo(KIDS_TRICYCLE_TYPES_PATH)),
    safetyPage(origin, seo(KIDS_TRICYCLE_SAFETY_PATH)),
    feedbackPage(origin, seo(KIDS_TRICYCLE_FEEDBACK_PATH)),
    recallsPage(origin, seo(KIDS_TRICYCLE_RECALLS_PATH)),
  ];
}
