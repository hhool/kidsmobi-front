/**
 * Prerender bodies for the eight /kids-stroller-* asset pages.
 *
 * Lives in its own module rather than inline in scripts/prerender-pages.ts for
 * the same reason the React pages share ClusterAssetPage.tsx: these eight are
 * eight views over one dataset, and writing them as eight hand-built HTML blobs
 * inside a file that is already thousands of lines would make the cluster
 * unreadable.
 *
 * WHAT IS NOT SHARED: every string still comes from the page's own string
 * module. This file only supplies the HTML skeleton and the table plumbing, so
 * the visible prose of the eight pages stays as distinct as it is in the React
 * components. scripts/check-topic-pair-drift.mjs compares the rendered body
 * 8-grams and <h2> word-bags of these pages against each other and against the
 * balance-bike, kids-bike, kids-scooter and ride-on equivalents — shared
 * SKELETON is fine, shared PROSE is not.
 *
 * The English strings are used here because the static HTML is the English
 * build; the hydrated SPA swaps in `zh` client-side, same as every other asset
 * page in this repo.
 */
import {
  kidsStrollerSizeStrings,
  kidsStrollerSizeVars,
  kidsStrollerSizeColumns,
  KIDS_STROLLER_SIZE_PATH,
} from "../src/data/kidsStrollerSize";
import {
  kidsStrollerAgeStrings,
  kidsStrollerAgeVars,
  kidsStrollerAgeColumns,
  KIDS_STROLLER_AGE_PATH,
} from "../src/data/kidsStrollerAge";
import {
  kidsStrollerPriceStrings,
  kidsStrollerPriceVars,
  kidsStrollerPriceColumns,
  KIDS_STROLLER_PRICE_PATH,
} from "../src/data/kidsStrollerPrice";
import {
  kidsStrollerWeightStrings,
  kidsStrollerWeightVars,
  kidsStrollerWeightColumns,
  KIDS_STROLLER_WEIGHT_PATH,
} from "../src/data/kidsStrollerWeight";
import {
  kidsStrollerTypesStrings,
  kidsStrollerTypesVars,
  kidsStrollerTypesColumns,
  KIDS_STROLLER_TYPES_PATH,
} from "../src/data/kidsStrollerTypes";
import {
  kidsStrollerSafetyStrings,
  kidsStrollerSafetyVars,
  kidsStrollerSafetyColumns,
  KIDS_STROLLER_SAFETY_PATH,
} from "../src/data/kidsStrollerSafety";
import {
  kidsStrollerFeedbackStrings,
  kidsStrollerFeedbackVars,
  kidsStrollerFeedbackColumns,
  KIDS_STROLLER_FEEDBACK_PATH,
} from "../src/data/kidsStrollerFeedback";
import {
  kidsStrollerRecallStrings,
  kidsStrollerRecallVars,
  kidsStrollerRecallColumns,
  KIDS_STROLLER_RECALLS_PATH,
} from "../src/data/kidsStrollerRecalls";
import { STROLLER_DATASET } from "../src/data/strollerData.generated";
import { fillTemplate } from "../src/data/safetyRecallRecord";

const d = STROLLER_DATASET;
const total = d.totals.strollers;

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

type Col = { key: string; header: string; render: (row: never) => unknown; numeric?: boolean };

/** Generic roster table driven by the same column descriptors the React
 *  components use, so the static HTML and the hydrated DOM show the same
 *  columns in the same order. */
function rosterTable(
  columns: Col[],
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

export interface StrollerRoutePage {
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

function sizePage(origin: string, seo: { title: string; description: string; keywords: string[] }): StrollerRoutePage {
  const t = kidsStrollerSizeStrings.en;
  const vars: Record<string, unknown> = { ...kidsStrollerSizeVars, total };
  const body = [
    header(t.eyebrow, t.h1, t.lead, vars),
    section(t.eyebrow, t.coverTitle, t.coverLead,
      coverageTable([
        ["Open dimensions stated", total],
        ["Folded dimensions stated", d.totals.withFolded],
        ["Doorway clearance stated", 0],
      ])),
    section(t.eyebrow, t.foldTitle, t.foldLead, ""),
    section(t.eyebrow, t.bodyTitle, t.bodyLead,
      `<div style="font-size:14px;line-height:1.75;color:#334155;">
        <p style="margin:0 0 10px;">${esc(t.bodyLongest)}</p>
        <p style="margin:0 0 10px;">${esc(t.bodyWidest)}</p>
        <p style="margin:0;">${esc(t.bodyTallest)}</p>
      </div>`),
    section(t.eyebrow, t.doorTitle, t.doorLead, ""),
    section(t.eyebrow, t.gapTitle, t.gapLead,
      gapBox([t.gapFold, t.gapClearance, t.gapSeat])),
    section(t.eyebrow, t.rosterTitle, t.rosterLead,
      rosterTable(kidsStrollerSizeColumns(t) as Col[], d.rows as never, t.notStated, t.rosterTitle)),
    provenance(t.methodTitle, t.methodBody, vars),
  ].join("\n");

  return {
    route: KIDS_STROLLER_SIZE_PATH,
    title: seo.title,
    description: seo.description,
    body,
    jsonLd: webPageJsonLd(seo.title, seo.description, KIDS_STROLLER_SIZE_PATH, origin),
    skipTitleH1: true,
    keywords: seo.keywords,
    h1En: t.h1,
  };
}

function agePage(origin: string, seo: { title: string; description: string; keywords: string[] }): StrollerRoutePage {
  const t = kidsStrollerAgeStrings.en;
  const vars: Record<string, unknown> = { ...kidsStrollerAgeVars, total };
  const body = [
    header(t.eyebrow, t.h1, t.lead, vars),
    section(t.eyebrow, t.labelTitle, t.labelLead,
      coverageTable([
        ["Usable age floor stated", d.totals.withAgeLabel],
        ["Number printed in label", d.totals.withNumericAge],
        ["Label is a word only", total - d.totals.withAgeLabel],
        ["Upper age limit stated", 0],
      ]) +
      `<div style="height:12px;"></div>
      <div style="font-size:14px;line-height:1.75;color:#334155;">
        <p style="margin:0 0 10px;">${esc(t.labelLabelled)}</p>
        <p style="margin:0 0 10px;">${esc(t.labelNumeric)}</p>
        <p style="margin:0 0 10px;">${esc(t.labelWord)}</p>
        <p style="margin:0 0 10px;">${esc(t.floorZero)}</p>
        <p style="margin:0;">${esc(t.floorSix)}</p>
      </div>`),
    section(t.eyebrow, t.ceilingTitle, t.ceilingLead,
      `<div style="font-size:14px;line-height:1.75;color:#334155;">
        <p style="margin:0;">${esc(t.ceilingAbsent)}</p>
      </div>`),
    section(t.eyebrow, t.gapTitle, t.gapLead,
      gapBox([t.gapCeiling, t.gapWord, t.gapWeight])),
    section(t.eyebrow, t.rosterTitle, t.rosterLead,
      rosterTable(kidsStrollerAgeColumns(t) as Col[], d.rows as never, t.notStated, t.rosterTitle)),
    provenance(t.methodTitle, t.methodBody, vars),
  ].join("\n");

  return {
    route: KIDS_STROLLER_AGE_PATH,
    title: seo.title,
    description: seo.description,
    body,
    jsonLd: webPageJsonLd(seo.title, seo.description, KIDS_STROLLER_AGE_PATH, origin),
    skipTitleH1: true,
    keywords: seo.keywords,
    h1En: t.h1,
  };
}

function pricePage(origin: string, seo: { title: string; description: string; keywords: string[] }): StrollerRoutePage {
  const t = kidsStrollerPriceStrings.en;
  const vars: Record<string, unknown> = { ...kidsStrollerPriceVars, total };
  const body = [
    header(t.eyebrow, t.h1, t.lead, vars),
    section(t.eyebrow, t.coverTitle, t.coverLead,
      coverageTable([["Price stated", total]])),
    section(t.eyebrow, t.bandsTitle, t.bandsLead,
      coverageTable([
        ["Under $100", kidsStrollerPriceVars.bandUnder],
        ["$100–$200", kidsStrollerPriceVars.band100],
        ["$200–$300", kidsStrollerPriceVars.band200],
        ["$300 and over", kidsStrollerPriceVars.band300],
      ]) +
      `<div style="height:12px;"></div>
      <div style="font-size:14px;line-height:1.75;color:#334155;">
        <p style="margin:0 0 10px;">${esc(t.bandUnder)}</p>
        <p style="margin:0 0 10px;">${esc(t.band100)}</p>
        <p style="margin:0 0 10px;">${esc(t.band200)}</p>
        <p style="margin:0;">${esc(t.band300)}</p>
      </div>`),
    section(t.eyebrow, t.ratingTitle, t.ratingLead,
      `<div style="font-size:14px;line-height:1.75;color:#334155;">
        <p style="margin:0 0 10px;">${esc(t.ratingSpread)}</p>
        <p style="margin:0;">${esc(t.ratingApart)}</p>
      </div>`),
    section(t.eyebrow, t.gapTitle, t.gapLead,
      gapBox([t.gapShipping, t.gapWarranty, t.gapHistory])),
    section(t.eyebrow, t.rosterTitle, t.rosterLead,
      rosterTable(kidsStrollerPriceColumns(t) as Col[], d.rows as never, t.notStated, t.rosterTitle)),
    provenance(t.methodTitle, t.methodBody, vars),
  ].join("\n");

  return {
    route: KIDS_STROLLER_PRICE_PATH,
    title: seo.title,
    description: seo.description,
    body,
    jsonLd: webPageJsonLd(seo.title, seo.description, KIDS_STROLLER_PRICE_PATH, origin),
    skipTitleH1: true,
    keywords: seo.keywords,
    h1En: t.h1,
  };
}

function weightPage(origin: string, seo: { title: string; description: string; keywords: string[] }): StrollerRoutePage {
  const t = kidsStrollerWeightStrings.en;
  const vars: Record<string, unknown> = { ...kidsStrollerWeightVars, total };
  const body = [
    header(t.eyebrow, t.h1, t.lead, vars),
    section(t.eyebrow, t.ownTitle, t.ownLead,
      coverageTable([
        ["Item weight stated", d.totals.withItemWeight],
        ["Rated weight limit stated", d.totals.withWeightLimit],
      ]) +
      `<div style="height:12px;"></div>
      <div style="font-size:14px;line-height:1.75;color:#334155;">
        <p style="margin:0 0 10px;">${esc(t.ownStated)}</p>
        <p style="margin:0;">${esc(t.ownRange)}</p>
      </div>`),
    section(t.eyebrow, t.limitTitle, t.limitLead,
      `<div style="font-size:14px;line-height:1.75;color:#334155;">
        <p style="margin:0 0 10px;">${esc(t.limitCount)}</p>
        <p style="margin:0;">${esc(t.limitGap)}</p>
      </div>`),
    section(t.eyebrow, t.lightTitle, t.lightLead,
      `<div style="font-size:14px;line-height:1.75;color:#334155;">
        <p style="margin:0 0 10px;">${esc(t.lightCount)}</p>
        <p style="margin:0;">${esc(t.lightForm)}</p>
      </div>`),
    section(t.eyebrow, t.gapTitle, t.gapLead,
      gapBox([t.gapLimit, t.gapMissing, t.gapUnit])),
    section(t.eyebrow, t.rosterTitle, t.rosterLead,
      rosterTable(kidsStrollerWeightColumns(t) as Col[], d.rows as never, t.notStated, t.rosterTitle)),
    provenance(t.methodTitle, t.methodBody, vars),
  ].join("\n");

  return {
    route: KIDS_STROLLER_WEIGHT_PATH,
    title: seo.title,
    description: seo.description,
    body,
    jsonLd: webPageJsonLd(seo.title, seo.description, KIDS_STROLLER_WEIGHT_PATH, origin),
    skipTitleH1: true,
    keywords: seo.keywords,
    h1En: t.h1,
  };
}

function typesPage(origin: string, seo: { title: string; description: string; keywords: string[] }): StrollerRoutePage {
  const t = kidsStrollerTypesStrings.en;
  const vars: Record<string, unknown> = { ...kidsStrollerTypesVars, total };
  const body = [
    header(t.eyebrow, t.h1, t.lead, vars),
    section(t.eyebrow, t.formsTitle, t.formsLead,
      `<div style="font-size:14px;line-height:1.75;color:#334155;">
        <p style="margin:0;">${esc(t.formsSplit)}</p>
      </div>`),
    section(t.eyebrow, t.joggerTitle, t.joggerLead,
      `<div style="font-size:14px;line-height:1.75;color:#334155;">
        <p style="margin:0;">${esc(t.joggerNote)}</p>
      </div>`),
    section(t.eyebrow, t.doubleTitle, t.doubleLead,
      `<div style="font-size:14px;line-height:1.75;color:#334155;">
        <p style="margin:0;">${esc(t.doubleNote)}</p>
      </div>`),
    section(t.eyebrow, t.travelTitle, t.travelLead,
      `<div style="font-size:14px;line-height:1.75;color:#334155;">
        <p style="margin:0;">${esc(t.travelNote)}</p>
      </div>`),
    section(t.eyebrow, t.wheelsTitle, t.wheelsLead,
      `<div style="font-size:14px;line-height:1.75;color:#334155;">
        <p style="margin:0;">${esc(t.wheelsNote)}</p>
      </div>`),
    section(t.eyebrow, t.rosterTitle, t.rosterLead,
      rosterTable(kidsStrollerTypesColumns(t) as Col[], d.rows as never, t.notStated, t.rosterTitle)),
    provenance(t.methodTitle, t.methodBody, vars),
  ].join("\n");

  return {
    route: KIDS_STROLLER_TYPES_PATH,
    title: seo.title,
    description: seo.description,
    body,
    jsonLd: webPageJsonLd(seo.title, seo.description, KIDS_STROLLER_TYPES_PATH, origin),
    skipTitleH1: true,
    keywords: seo.keywords,
    h1En: t.h1,
  };
}

function safetyPage(origin: string, seo: { title: string; description: string; keywords: string[] }): StrollerRoutePage {
  const t = kidsStrollerSafetyStrings.en;
  const vars: Record<string, unknown> = { ...kidsStrollerSafetyVars, total };
  const body = [
    header(t.eyebrow, t.h1, t.lead, vars),
    section(t.eyebrow, t.markTitle, t.markLead,
      coverageTable([["EN 1888 claimed", d.complianceTally.EN1888]])),
    section(t.eyebrow, t.coverTitle, t.coverLead,
      `<div style="font-size:14px;line-height:1.75;color:#334155;">
        <p style="margin:0;">${esc(t.coverBody)}</p>
      </div>`),
    section(t.eyebrow, t.harnessTitle, t.harnessLead,
      `<div style="font-size:14px;line-height:1.75;color:#334155;">
        <p style="margin:0;">${esc(t.harnessBody)}</p>
      </div>`),
    section(t.eyebrow, t.featuresTitle, t.featuresLead,
      `<div style="font-size:14px;line-height:1.75;color:#334155;">
        <p style="margin:0 0 10px;">${esc(t.featuresBrake)}</p>
        <p style="margin:0 0 10px;">${esc(t.featuresCanopy)}</p>
        <p style="margin:0 0 10px;">${esc(t.featuresBasket)}</p>
        <p style="margin:0;">${esc(t.featuresCarSeat)}</p>
      </div>`),
    section(t.eyebrow, t.gapTitle, t.gapLead,
      gapBox([t.gapProve, t.gapTest, t.gapRegion])),
    section(t.eyebrow, t.rosterTitle, t.rosterLead,
      rosterTable(kidsStrollerSafetyColumns(t) as Col[], d.rows as never, t.notStated, t.rosterTitle)),
    provenance(t.methodTitle, t.methodBody, vars),
  ].join("\n");

  return {
    route: KIDS_STROLLER_SAFETY_PATH,
    title: seo.title,
    description: seo.description,
    body,
    jsonLd: webPageJsonLd(seo.title, seo.description, KIDS_STROLLER_SAFETY_PATH, origin),
    skipTitleH1: true,
    keywords: seo.keywords,
    h1En: t.h1,
  };
}

function feedbackPage(origin: string, seo: { title: string; description: string; keywords: string[] }): StrollerRoutePage {
  const t = kidsStrollerFeedbackStrings.en;
  const vars: Record<string, unknown> = { ...kidsStrollerFeedbackVars, total };
  const body = [
    header(t.eyebrow, t.h1, t.lead, vars),
    section(t.eyebrow, t.ratingTitle, t.ratingLead,
      `<div style="font-size:14px;line-height:1.75;color:#334155;">
        <p style="margin:0;">${esc(t.ratingBody)}</p>
      </div>`),
    section(t.eyebrow, t.themeTitle, t.themeIntro,
      `<div style="font-size:14px;line-height:1.75;color:#334155;">
        <p style="margin:0 0 10px;">${esc(t.themeFold)}</p>
        <p style="margin:0 0 10px;">${esc(t.themeLight)}</p>
        <p style="margin:0 0 10px;">${esc(t.themeManeuver)}</p>
        <p style="margin:0 0 10px;">${esc(t.themeTravel)}</p>
        <p style="margin:0 0 10px;">${esc(t.themeDurability)}</p>
        <p style="margin:0;">${esc(t.themeValue)}</p>
      </div>`),
    section(t.eyebrow, t.hedgeTitle, t.hedgeLead,
      `<div style="font-size:14px;line-height:1.75;color:#334155;">
        <p style="margin:0;">${esc(t.hedgeBody)}</p>
      </div>`),
    section(t.eyebrow, t.gapTitle, t.gapLead,
      gapBox([t.gapEmpty, t.gapVerbatim, t.gapSelection])),
    section(t.eyebrow, t.rosterTitle, t.rosterLead,
      rosterTable(kidsStrollerFeedbackColumns(t) as Col[], d.rows as never, t.notStated, t.rosterTitle)),
    provenance(t.methodTitle, t.methodBody, vars),
  ].join("\n");

  return {
    route: KIDS_STROLLER_FEEDBACK_PATH,
    title: seo.title,
    description: seo.description,
    body,
    jsonLd: webPageJsonLd(seo.title, seo.description, KIDS_STROLLER_FEEDBACK_PATH, origin),
    skipTitleH1: true,
    keywords: seo.keywords,
    h1En: t.h1,
  };
}

function recallsPage(origin: string, seo: { title: string; description: string; keywords: string[] }): StrollerRoutePage {
  const t = kidsStrollerRecallStrings.en;
  const vars: Record<string, unknown> = { ...kidsStrollerRecallVars, total };
  const body = [
    header(t.eyebrow, t.h1, t.lead, vars),
    section(t.eyebrow, t.absentTitle, t.absentLead,
      `<div style="font-size:14px;line-height:1.75;color:#334155;">
        <p style="margin:0;">${esc(t.absentBody)}</p>
      </div>`),
    section(t.eyebrow, t.enTitle, t.enLead,
      `<div style="font-size:14px;line-height:1.75;color:#334155;">
        <p style="margin:0;">${esc(t.enBody)}</p>
      </div>`),
    section(t.eyebrow, t.whereTitle, t.whereLead,
      `<div style="font-size:14px;line-height:1.75;color:#334155;">
        <p style="margin:0;">${esc(t.whereBody)}</p>
      </div>`),
    section(t.eyebrow, t.gapTitle, t.gapLead,
      gapBox([t.gapField, t.gapScope, t.gapVerify])),
    section(t.eyebrow, t.rosterTitle, t.rosterLead,
      rosterTable(kidsStrollerRecallColumns(t) as Col[], d.rows as never, t.notStated, t.rosterTitle)),
    provenance(t.methodTitle, t.methodBody, vars),
  ].join("\n");

  return {
    route: KIDS_STROLLER_RECALLS_PATH,
    title: seo.title,
    description: seo.description,
    body,
    jsonLd: webPageJsonLd(seo.title, seo.description, KIDS_STROLLER_RECALLS_PATH, origin),
    skipTitleH1: true,
    keywords: seo.keywords,
    h1En: t.h1,
  };
}

/**
 * All eight pages, in the order they should appear in the sitemap cluster.
 * `origin` is used only to build absolute JSON-LD URLs.
 */
export function renderKidsStrollerPages(
  origin: string,
  seoByPath: Record<string, { en: { title: string; description: string; keywords: string[] } }>
): StrollerRoutePage[] {
  const seo = (p: string) => seoByPath[p].en;
  return [
    sizePage(origin, seo(KIDS_STROLLER_SIZE_PATH)),
    agePage(origin, seo(KIDS_STROLLER_AGE_PATH)),
    pricePage(origin, seo(KIDS_STROLLER_PRICE_PATH)),
    weightPage(origin, seo(KIDS_STROLLER_WEIGHT_PATH)),
    typesPage(origin, seo(KIDS_STROLLER_TYPES_PATH)),
    safetyPage(origin, seo(KIDS_STROLLER_SAFETY_PATH)),
    feedbackPage(origin, seo(KIDS_STROLLER_FEEDBACK_PATH)),
    recallsPage(origin, seo(KIDS_STROLLER_RECALLS_PATH)),
  ];
}
