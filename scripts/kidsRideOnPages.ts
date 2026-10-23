/**
 * Prerender bodies for the eight /kids-ride-on-* asset pages.
 *
 * Lives in its own module rather than inline in scripts/prerender-pages.ts for
 * the same reason the React pages share RideOnAssetPage.tsx: these eight are
 * eight views over one dataset, and writing them as eight hand-built HTML blobs
 * inside a file that is already 8,000 lines would make the cluster unreadable.
 *
 * WHAT IS NOT SHARED: every string still comes from the page's own string
 * module. This file only supplies the HTML skeleton and the table plumbing, so
 * the visible prose of the eight pages stays as distinct as it is in the React
 * components. scripts/check-topic-pair-drift.mjs compares the rendered body
 * 8-grams and <h2> word-bags of these pages against each other and against the
 * balance-bike, kids-bike and kids-scooter equivalents — shared SKELETON is fine,
 * shared PROSE is not.
 *
 * The English strings are used here because the static HTML is the English
 * build; the hydrated SPA swaps in `zh` client-side, same as every other asset
 * page in this repo.
 */
import {
  kidsRideOnVoltageStrings,
  kidsRideOnVoltageVars,
  kidsRideOnVoltageColumns,
  KIDS_RIDE_ON_VOLTAGE_PATH,
} from "../src/data/kidsRideOnVoltage";
import {
  kidsRideOnWeightStrings,
  kidsRideOnWeightVars,
  kidsRideOnWeightColumns,
  KIDS_RIDE_ON_WEIGHT_PATH,
} from "../src/data/kidsRideOnWeight";
import {
  kidsRideOnSizeStrings,
  kidsRideOnSizeVars,
  kidsRideOnSizeColumns,
  KIDS_RIDE_ON_SIZE_PATH,
} from "../src/data/kidsRideOnSize";
import {
  kidsRideOnPriceStrings,
  kidsRideOnPriceVars,
  kidsRideOnPriceColumns,
  KIDS_RIDE_ON_PRICE_PATH,
} from "../src/data/kidsRideOnPrice";
import {
  kidsRideOnAgeStrings,
  kidsRideOnAgeVars,
  kidsRideOnAgeColumns,
  KIDS_RIDE_ON_AGE_PATH,
} from "../src/data/kidsRideOnAge";
import {
  kidsRideOnSafetyStrings,
  kidsRideOnSafetyVars,
  kidsRideOnSafetyColumns,
  KIDS_RIDE_ON_SAFETY_PATH,
} from "../src/data/kidsRideOnSafety";
import {
  kidsRideOnFeedbackStrings,
  kidsRideOnFeedbackVars,
  kidsRideOnFeedbackColumns,
  KIDS_RIDE_ON_FEEDBACK_PATH,
} from "../src/data/kidsRideOnFeedback";
import {
  kidsRideOnRecallStrings,
  kidsRideOnRecallVars,
  kidsRideOnRecallColumns,
  KIDS_RIDE_ON_RECALLS_PATH,
} from "../src/data/kidsRideOnRecalls";
import { RIDE_ON_DATASET } from "../src/data/rideOnData.generated";
import { fillTemplate } from "../src/data/safetyRecallRecord";

const d = RIDE_ON_DATASET;
const total = d.totals.rideOnCars;

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
 * components use, so the static HTML and the hydrated DOM show the same
 * columns in the same order.
 */
function rosterTable(
  columns: ReturnType<typeof kidsRideOnVoltageColumns>,
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

export interface RideOnRoutePage {
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

function voltagePage(origin: string, seo: { title: string; description: string; keywords: string[] }): RideOnRoutePage {
  const t = kidsRideOnVoltageStrings.en;
  const vars: Record<string, unknown> = { ...kidsRideOnVoltageVars, total };
  const body = [
    header(t.eyebrow, t.h1, t.lead, vars),
    section(t.eyebrow, t.sourceTitle, t.sourceLead,
      coverageTable([
        ["Voltage stated", d.totals.withVoltage],
        ["In the specification field", d.totals.voltageFromSpec],
        ["In the product title only", d.totals.voltageFromTitle],
        ["Seat count stated", d.totals.withSeats],
        ["Battery life stated", d.totals.withBatteryLife],
      ])),
    section(t.eyebrow, t.tierTitle, t.tierLead,
      `<div style="font-size:14px;line-height:1.75;color:#334155;">
        <p style="margin:0 0 10px;">${esc(t.tierSix)}</p>
        <p style="margin:0 0 10px;">${esc(t.tierTwelve)}</p>
        <p style="margin:0 0 10px;">${esc(t.tierTwentyFour)}</p>
        <p style="margin:0;">${esc(t.tierThirtySix)}</p>
      </div>`),
    section(t.eyebrow, t.seatsTitle, t.seatsLead, ""),
    section(t.eyebrow, t.gapTitle, t.gapLead,
      gapBox([t.gapSource, t.gapPrice, t.gapRuntime])),
    section(t.eyebrow, t.rosterTitle, t.rosterLead,
      rosterTable(kidsRideOnVoltageColumns(t), d.rows as never, t.notStated, t.rosterTitle)),
    provenance(t.methodTitle, t.methodBody, vars),
  ].join("\n");

  return {
    route: KIDS_RIDE_ON_VOLTAGE_PATH,
    title: seo.title,
    description: seo.description,
    body,
    jsonLd: webPageJsonLd(seo.title, seo.description, KIDS_RIDE_ON_VOLTAGE_PATH, origin),
    skipTitleH1: true,
    keywords: seo.keywords,
    h1En: t.h1,
  };
}

function weightPage(origin: string, seo: { title: string; description: string; keywords: string[] }): RideOnRoutePage {
  const t = kidsRideOnWeightStrings.en;
  const vars: Record<string, unknown> = { ...kidsRideOnWeightVars, total };
  const body = [
    header(t.eyebrow, t.h1, t.lead, vars),
    section(t.eyebrow, t.ownTitle, t.ownLead,
      coverageTable([
        ["Car weight stated", d.totals.withItemWeight],
        ["Rider limit stated", d.totals.withWeightLimit],
        ["Both published", kidsRideOnWeightVars.pairs.length],
        ["Car weight only", kidsRideOnWeightVars.halves.weightOnly.length],
        ["Rider limit only", kidsRideOnWeightVars.halves.limitOnly.length],
      ])),
    section(t.eyebrow, t.ratioTitle, t.ratioLead,
      `<div style="font-size:14px;line-height:1.75;color:#334155;">
        <p style="margin:0 0 10px;">${esc(t.ratioTight)}</p>
        <p style="margin:0;">${esc(t.ratioWide)}</p>
      </div>`),
    section(t.eyebrow, t.gapTitle, t.gapLead,
      gapBox([t.gapPairs, t.gapHalves, t.gapUnits, t.gapStorage])),
    section(t.eyebrow, t.rosterTitle, t.rosterLead,
      rosterTable(kidsRideOnWeightColumns(t), d.rows as never, t.notStated, t.rosterTitle)),
    provenance(t.methodTitle, t.methodBody, vars),
  ].join("\n");

  return {
    route: KIDS_RIDE_ON_WEIGHT_PATH,
    title: seo.title,
    description: seo.description,
    body,
    jsonLd: webPageJsonLd(seo.title, seo.description, KIDS_RIDE_ON_WEIGHT_PATH, origin),
    skipTitleH1: true,
    keywords: seo.keywords,
    h1En: t.h1,
  };
}

function sizePage(origin: string, seo: { title: string; description: string; keywords: string[] }): RideOnRoutePage {
  const t = kidsRideOnSizeStrings.en;
  const vars: Record<string, unknown> = { ...kidsRideOnSizeVars, total };
  const body = [
    header(t.eyebrow, t.h1, t.lead, vars),
    section(t.eyebrow, t.fieldTitle, t.fieldLead,
      coverageTable([
        ["Length stated", d.totals.withDimensions],
        ["Size field held a voltage", kidsRideOnSizeVars.fieldKinds.voltage],
        ["Size field held a dimension", kidsRideOnSizeVars.fieldKinds.dimensions],
        ["Size field held a word", kidsRideOnSizeVars.fieldKinds.adjective],
        ["Size field was empty", kidsRideOnSizeVars.fieldKinds.empty],
      ]) +
      `<div style="height:12px;"></div>
      <div style="font-size:14px;line-height:1.75;color:#334155;">
        <p style="margin:0 0 10px;">${esc(t.fieldVoltage)}</p>
        <p style="margin:0 0 10px;">${esc(t.fieldDimensions)}</p>
        <p style="margin:0 0 10px;">${esc(t.fieldAdjective)}</p>
        <p style="margin:0;">${esc(t.fieldEmpty)}</p>
      </div>`),
    section(t.eyebrow, t.rangeTitle, t.rangeLead,
      `<div style="font-size:14px;line-height:1.75;color:#334155;">
        <p style="margin:0 0 10px;">${esc(t.rangeLongest)}</p>
        <p style="margin:0 0 10px;">${esc(t.rangeWidest)}</p>
        <p style="margin:0;">${esc(t.rangeTallest)}</p>
      </div>`),
    section(t.eyebrow, t.doorTitle, t.doorLead, ""),
    section(t.eyebrow, t.tierTitle, t.tierLead, ""),
    section(t.eyebrow, t.gapTitle, t.gapLead,
      gapBox([t.gapAssembly, t.gapFold, t.gapTires])),
    section(t.eyebrow, t.rosterTitle, t.rosterLead,
      rosterTable(kidsRideOnSizeColumns(t), d.rows as never, t.notStated, t.rosterTitle)),
    provenance(t.methodTitle, t.methodBody, vars),
  ].join("\n");

  return {
    route: KIDS_RIDE_ON_SIZE_PATH,
    title: seo.title,
    description: seo.description,
    body,
    jsonLd: webPageJsonLd(seo.title, seo.description, KIDS_RIDE_ON_SIZE_PATH, origin),
    skipTitleH1: true,
    keywords: seo.keywords,
    h1En: t.h1,
  };
}

function pricePage(origin: string, seo: { title: string; description: string; keywords: string[] }): RideOnRoutePage {
  const t = kidsRideOnPriceStrings.en;
  const vars: Record<string, unknown> = { ...kidsRideOnPriceVars, total };
  const bandRows = kidsRideOnPriceVars.bands.map(
    (band) => [band.label, band.count] as [string, number]
  );
  const body = [
    header(t.eyebrow, t.h1, t.lead, vars),
    section(t.eyebrow, t.gapTitle, t.gapLead,
      gapBox([t.gapWide, t.gapTier, t.gapReview])),
    section(t.eyebrow, t.bandsTitle, t.bandsLead,
      coverageTable(bandRows) +
      `<div style="height:12px;"></div>
      <div style="font-size:14px;line-height:1.75;color:#334155;">
        <p style="margin:0 0 10px;">${esc(t.bandUnder)}</p>
        <p style="margin:0 0 10px;">${esc(t.band100to150)}</p>
        <p style="margin:0 0 10px;">${esc(t.band150to250)}</p>
        <p style="margin:0;">${esc(t.bandOver250)}</p>
      </div>`),
    section(t.eyebrow, t.ratingTitle, t.ratingLead,
      `<div style="font-size:14px;line-height:1.75;color:#334155;">
        <p style="margin:0 0 10px;">${esc(t.ratingBest)}</p>
        <p style="margin:0;">${esc(t.ratingPopular)}</p>
      </div>`),
    section(t.eyebrow, t.gapNoteTitle, t.gapNoteLead,
      gapBox([t.gapNoteShipping, t.gapNoteWarranty, t.gapNoteHistory])),
    section(t.eyebrow, t.rosterTitle, t.rosterLead,
      rosterTable(kidsRideOnPriceColumns(t), d.rows as never, t.notStated, t.rosterTitle)),
    provenance(t.methodTitle, t.methodBody, vars),
  ].join("\n");

  return {
    route: KIDS_RIDE_ON_PRICE_PATH,
    title: seo.title,
    description: seo.description,
    body,
    jsonLd: webPageJsonLd(seo.title, seo.description, KIDS_RIDE_ON_PRICE_PATH, origin),
    skipTitleH1: true,
    keywords: seo.keywords,
    h1En: t.h1,
  };
}

function agePage(origin: string, seo: { title: string; description: string; keywords: string[] }): RideOnRoutePage {
  const t = kidsRideOnAgeStrings.en;
  const vars: Record<string, unknown> = { ...kidsRideOnAgeVars, total };
  const body = [
    header(t.eyebrow, t.h1, t.lead, vars),
    section(t.eyebrow, t.labelTitle, t.labelLead,
      coverageTable([
        ["Carries an age label", kidsRideOnAgeVars.labels.labelled],
        ["Label contains a number", kidsRideOnAgeVars.labels.numeric],
        ["Label is a word only", kidsRideOnAgeVars.labels.wordOnly],
        ["No label at all", kidsRideOnAgeVars.labels.unlabelled],
      ]) +
      `<div style="height:12px;"></div>
      <div style="font-size:14px;line-height:1.75;color:#334155;">
        <p style="margin:0 0 10px;">${esc(t.labelNumeric)}</p>
        <p style="margin:0 0 10px;">${esc(t.labelWord)}</p>
        <p style="margin:0;">${esc(t.labelNone)}</p>
      </div>`),
    section(t.eyebrow, t.floorTitle, t.floorLead,
      coverageTable(
        kidsRideOnAgeVars.floors.buckets.map((b) => [`${b.months} months`, b.count] as [string, number])
      ) +
      `<div style="height:12px;"></div>
      <div style="font-size:14px;line-height:1.75;color:#334155;">
        <p style="margin:0 0 10px;">${esc(t.floorModal)}</p>
        <p style="margin:0;">${esc(t.floorSpread)}</p>
      </div>`),
    section(t.eyebrow, t.ceilingTitle, t.ceilingLead,
      `<div style="font-size:14px;line-height:1.75;color:#334155;">
        <p style="margin:0 0 10px;">${esc(t.ceilingTwelve)}</p>
        <p style="margin:0;">${esc(t.ceilingImplausible)}</p>
      </div>`),
    section(t.eyebrow, t.tierTitle, t.tierLead, ""),
    section(t.eyebrow, t.gapTitle, t.gapLead,
      gapBox([t.gapNoLabel, t.gapCeiling, t.gapWeight])),
    section(t.eyebrow, t.rosterTitle, t.rosterLead,
      rosterTable(kidsRideOnAgeColumns(t), d.rows as never, t.notStated, t.rosterTitle)),
    provenance(t.methodTitle, t.methodBody, vars),
  ].join("\n");

  return {
    route: KIDS_RIDE_ON_AGE_PATH,
    title: seo.title,
    description: seo.description,
    body,
    jsonLd: webPageJsonLd(seo.title, seo.description, KIDS_RIDE_ON_AGE_PATH, origin),
    skipTitleH1: true,
    keywords: seo.keywords,
    h1En: t.h1,
  };
}

function safetyPage(origin: string, seo: { title: string; description: string; keywords: string[] }): RideOnRoutePage {
  const t = kidsRideOnSafetyStrings.en;
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
  const body = [
    header(t.eyebrow, t.h1, t.lead, vars),
    section(t.eyebrow, t.coverageTitle, t.coverageLead,
      coverageTable([
        ["ASTM F963", kidsRideOnSafetyVars.astm],
        ["CPSC listing", kidsRideOnSafetyVars.cpsc],
        ["Certificate or test report named", 0],
      ])),
    section(t.eyebrow, t.controlsTitle, t.controlsLead,
      `<div style="font-size:14px;line-height:1.75;color:#334155;">
        <p style="margin:0 0 10px;">${esc(t.controlBrake)}</p>
        <p style="margin:0 0 10px;">${esc(t.controlReverse)}</p>
        <p style="margin:0 0 10px;">${esc(t.controlCharger)}</p>
        <p style="margin:0 0 10px;">${esc(t.controlSpeedLimiter)}</p>
        <p style="margin:0;">${esc(t.controlBattery)}</p>
      </div>`),
    section(t.eyebrow, t.topicsTitle, t.topicsLead,
      coverageTable(
        kidsRideOnSafetyVars.topics.map(
          (topic) => [topicLabels[topic.topic] ?? topic.topic, topic.count] as [string, number]
        )
      ) +
      `<div style="height:12px;"></div>
      <div style="font-size:14px;line-height:1.75;color:#334155;">
        <p style="margin:0 0 10px;">${esc(t.topicRemote)}</p>
        <p style="margin:0 0 10px;">${esc(t.topicSpeed)}</p>
        <p style="margin:0 0 10px;">${esc(t.topicSeatbelt)}</p>
        <p style="margin:0 0 10px;">${esc(t.topicSupervision)}</p>
        <p style="margin:0 0 10px;">${esc(t.topicRoads)}</p>
        <p style="margin:0 0 10px;">${esc(t.topicRollover)}</p>
        <p style="margin:0;">${esc(t.topicHelmet)}</p>
      </div>`),
    section(t.eyebrow, t.materialsTitle, t.materialsLead,
      `<p style="font-size:14px;line-height:1.75;color:#475569;margin:0;max-width:48rem;">${esc(t.materialsBody)}</p>`),
    section(t.eyebrow, t.gapTitle, t.gapLead,
      gapBox([t.gapCert, t.gapHelmet, t.gapSpeed, t.gapAssembly])),
    section(t.eyebrow, t.rosterTitle, t.rosterLead,
      rosterTable(kidsRideOnSafetyColumns(t), d.rows as never, t.notStated, t.rosterTitle)),
    provenance(t.methodTitle, t.methodBody, vars),
  ].join("\n");

  return {
    route: KIDS_RIDE_ON_SAFETY_PATH,
    title: seo.title,
    description: seo.description,
    body,
    jsonLd: webPageJsonLd(seo.title, seo.description, KIDS_RIDE_ON_SAFETY_PATH, origin),
    skipTitleH1: true,
    keywords: seo.keywords,
    h1En: t.h1,
  };
}

function feedbackPage(origin: string, seo: { title: string; description: string; keywords: string[] }): RideOnRoutePage {
  const t = kidsRideOnFeedbackStrings.en;
  const vars: Record<string, unknown> = { ...kidsRideOnFeedbackVars, total };
  const { themes, hedges } = kidsRideOnFeedbackVars;

  const themeTable = `<table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
    <thead><tr>
      <th style="padding:10px 14px;background:#f8fafc;font-size:10px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#64748b;">${esc(t.themeColTopic)}</th>
      <th style="padding:10px 14px;background:#f8fafc;font-size:10px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#64748b;text-align:right;">${esc(t.themeColCount)}</th>
      <th style="padding:10px 14px;background:#f8fafc;font-size:10px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#64748b;">${esc(t.themeColWho)}</th>
    </tr></thead>
    <tbody>${themes
      .map(
        (row) => `<tr>
        <td style="padding:10px 14px;border-top:1px solid #f1f5f9;font-size:13px;text-transform:capitalize;color:#334155;">${esc(row.theme)}</td>
        <td style="padding:10px 14px;border-top:1px solid #f1f5f9;font-size:13px;font-weight:800;color:#0f172a;text-align:right;">${row.count} / ${total}</td>
        <td style="padding:10px 14px;border-top:1px solid #f1f5f9;font-size:13px;color:#475569;">${esc(row.labels.join(", "))}</td>
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
      ${[
        [t.hedgeQualified, hedges.qualified],
        [t.hedgeMixed, hedges.mixed],
        [t.hedgeDrawback, hedges.drawback],
      ]
        .map(
          ([label, h]) => `<tr>
        <td style="padding:10px 14px;border-top:1px solid #f1f5f9;font-size:13px;color:#334155;">${esc(label)}</td>
        <td style="padding:10px 14px;border-top:1px solid #f1f5f9;font-size:13px;font-weight:800;color:#0f172a;text-align:right;">${(h as { count: number }).count} / ${total}</td>
        <td style="padding:10px 14px;border-top:1px solid #f1f5f9;font-size:13px;color:#475569;">${esc((h as { labels: string[] }).labels.join(", ") || "—")}</td>
      </tr>`
        )
        .join("")}
    </tbody>
  </table>`;

  const body = [
    header(t.eyebrow, t.h1, t.lead, vars),
    section(t.eyebrow, t.ratingTitle, t.ratingLead, statedBox([t.ratingNote])),
    section(t.eyebrow, t.themeTitle, t.themeIntro, themeTable),
    section(t.eyebrow, t.hedgeTitle, t.hedgeLead, hedgeTable),
    section(t.eyebrow, t.gapTitle, t.gapLead, gapBox([t.gapNoSummary, t.gapNoText])),
    section(t.eyebrow, t.listingTitle, "",
      rosterTable(kidsRideOnFeedbackColumns(t), d.rows as never, "—", t.listingTitle)),
    provenance(t.provenanceTitle, t.provenanceBody, vars),
  ].join("\n");

  return {
    route: KIDS_RIDE_ON_FEEDBACK_PATH,
    title: seo.title,
    description: seo.description,
    body,
    jsonLd: webPageJsonLd(seo.title, seo.description, KIDS_RIDE_ON_FEEDBACK_PATH, origin),
    skipTitleH1: true,
    keywords: seo.keywords,
    h1En: t.h1,
  };
}

function recallsPage(origin: string, seo: { title: string; description: string; keywords: string[] }): RideOnRoutePage {
  const t = kidsRideOnRecallStrings.en;
  const vars: Record<string, unknown> = { ...kidsRideOnRecallVars };
  const body = [
    header(t.eyebrow, t.h1, t.lead, vars),
    section(t.eyebrow, t.hazardTitle, t.hazardLead,
      coverageTable(
        kidsRideOnRecallVars.breakdown.map((h) => [h.label, h.count] as [string, number])
      ) +
      `<div style="height:12px;"></div>
      <div style="font-size:14px;line-height:1.75;color:#334155;">
        <p style="margin:0 0 10px;">${esc(t.hazardFire)}</p>
        <p style="margin:0 0 10px;">${esc(t.hazardOverlap)}</p>
        <p style="margin:0;">${esc(t.hazardUnits)}</p>
      </div>`),
    section(t.eyebrow, t.euTitle, t.euLead,
      coverageTable([
        ["Alerts in the ride-on bucket", kidsRideOnRecallVars.gate.total],
        ["Naming a ride-on or trike", kidsRideOnRecallVars.gate.named],
        ["Children's bicycles", kidsRideOnRecallVars.gate.bikeCount],
      ]) +
      `<div style="height:12px;"></div>
      <div style="font-size:14px;line-height:1.75;color:#334155;">
        <p style="margin:0 0 10px;">${esc(t.euNamed)}</p>
        <p style="margin:0;">${esc(t.euBikes)}</p>
      </div>`),
    section(t.eyebrow, t.compareTitle, t.compareLead, ""),
    section(t.eyebrow, t.rosterTitle, t.rosterLead,
      rosterTable(
        kidsRideOnRecallColumns(t),
        kidsRideOnRecallVars.noticesList as unknown as Array<Record<string, unknown>>,
        t.notStated,
        t.rosterTitle
      )),
    provenance(t.methodTitle, t.methodBody, vars),
  ].join("\n");

  return {
    route: KIDS_RIDE_ON_RECALLS_PATH,
    title: seo.title,
    description: seo.description,
    body,
    jsonLd: webPageJsonLd(seo.title, seo.description, KIDS_RIDE_ON_RECALLS_PATH, origin),
    skipTitleH1: true,
    keywords: seo.keywords,
    h1En: t.h1,
  };
}

/**
 * All eight pages, in the order they should appear in the sitemap cluster.
 * `origin` is used only to build absolute JSON-LD URLs.
 */
export function renderKidsRideOnPages(
  origin: string,
  seoByPath: Record<string, { en: { title: string; description: string; keywords: string[] } }>
): RideOnRoutePage[] {
  const seo = (p: string) => seoByPath[p].en;
  return [
    voltagePage(origin, seo(KIDS_RIDE_ON_VOLTAGE_PATH)),
    weightPage(origin, seo(KIDS_RIDE_ON_WEIGHT_PATH)),
    sizePage(origin, seo(KIDS_RIDE_ON_SIZE_PATH)),
    pricePage(origin, seo(KIDS_RIDE_ON_PRICE_PATH)),
    agePage(origin, seo(KIDS_RIDE_ON_AGE_PATH)),
    safetyPage(origin, seo(KIDS_RIDE_ON_SAFETY_PATH)),
    feedbackPage(origin, seo(KIDS_RIDE_ON_FEEDBACK_PATH)),
    recallsPage(origin, seo(KIDS_RIDE_ON_RECALLS_PATH)),
  ];
}
