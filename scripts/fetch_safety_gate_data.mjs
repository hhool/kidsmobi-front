/**
 * Fetch EU Safety Gate (formerly RAPEX) alerts and emit src/data/safetyGateData.generated.ts.
 *
 * Why this exists: plan-B asset #1 was scoped as "CPSC / Safety Gate" but the
 * first pass only shipped the US side. This fills the EU half so
 * /safety/balance-bike-recalls/ stops saying "EU Safety Gate alerts are not
 * included". Every number on that page must be reproducible by re-running this
 * script, so the whole pipeline (query -> classification -> aggregates) lives
 * here.
 *
 * Source: European Commission, Safety Gate rapid alert system for dangerous
 *         non-food products (formerly RAPEX).
 *         Official portal: https://ec.europa.eu/safety-gate-alerts/
 *
 * Retrieval: the Commission's own JSON API answers "not authorized" to
 * unauthenticated callers, so we read the same official weekly-report data
 * through the OpenDataSoft open-data mirror
 * (dataset `healthref-europe-rapex-en`, built from the Commission's weekly
 * reports since 2015). Every row keeps its official `rapex_url`, so each alert
 * can be clicked through and verified against the Commission's own record.
 *
 * Usage: npm run data:safetygate
 */
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const ODS_BASE =
  "https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/healthref-europe-rapex-en/records";
const PUBLISHER_URL = "https://ec.europa.eu/safety-gate-alerts/";
const OUT_FILE = path.resolve("src/data/safetyGateData.generated.ts");

/** Only these two categories can contain a child's ride-on product. */
const CATEGORIES = ["Toys", "Childcare articles and children's equipment"];

/**
 * Ride-on vehicle terms. Deliberately broad and multilingual: EU alerts are
 * filed in the notifying country's language, so a balance bike may appear as
 * "run bike" (EN), "Laufrad" (DE), "draisienne" (FR), "loopfiets" (NL).
 */
const RIDE_ON_TERMS = [
  "bike",
  "bicycle",
  "tricycle",
  "trike",
  "ride on",
  "ride-on",
  "laufrad",
  "draisienne",
  "loopfiets",
];

/** Terms that identify a balance bike (a pedal-less bike) specifically. */
const BALANCE_TERMS = [
  "balance bike",
  "balance-bike",
  "balancebike",
  "run bike",
  "run-bike",
  "runbike",
  "laufrad",
  "draisienne",
  "loopfiets",
  "bici senza pedali",
];

/**
 * Seats, saddles and protective gear are accessories for a bike the child does
 * not ride by itself. They match "bike" but are out of scope for a page about
 * ride-on vehicles, so they are dropped — and the count is published so the
 * exclusion is visible rather than silent.
 */
const ACCESSORY_TERMS = [
  "seat",
  "saddle",
  "chair",
  "helmet",
  "trailer",
  "carrier",
  "knee pad",
  "elbow pad",
];

const SELECT = [
  "alert_number",
  "alert_date",
  "alert_country",
  "product_name",
  "product_brand",
  "product_category",
  "alert_type",
  "alert_description",
  "measures_country",
  "rapex_url",
  "product_model_type",
].join(",");

const text = (v) => (v === null || v === undefined ? "" : String(v));
const clean = (v) => text(v).replace(/\s+/g, " ").trim();
const lower = (v) => clean(v).toLowerCase();
const hits = (hay, terms) => terms.some((t) => hay.includes(t));

async function ods(params) {
  const url = new URL(ODS_BASE);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Safety Gate query failed: HTTP ${res.status}`);
  return res.json();
}

const quote = (s) => `"${s.replace(/"/g, '\\"')}"`;

async function main() {
  const retrievedAt = new Date().toISOString().slice(0, 10);
  const whereCategory = `(${CATEGORIES.map((c) => `product_category=${quote(c)}`).join(" or ")})`;
  const whereRideOn = `(${RIDE_ON_TERMS.map((t) => `product_name like "%${t}%"`).join(" or ")})`;

  // 1. How big is the corpus we are drawing a conclusion from?
  const all = await ods({ limit: 1 });
  const alertsInDatabase = all.total_count ?? 0;

  // 1b. Earliest alert in the whole database — derived, never hand-written, so
  // the page can state a coverage window it can actually defend.
  const earliest = await ods({ select: "alert_date", order_by: "alert_date asc", limit: 1 });
  const earliestDate = text(earliest.results?.[0]?.alert_date).slice(0, 10);
  const databaseStartYear = Number(earliestDate.slice(0, 4)) || null;

  // 2. How many alerts sit in the two categories that could hold a ride-on?
  const inCategory = await ods({ where: whereCategory, limit: 1 });
  const alertsInCategories = inCategory.total_count ?? 0;

  // 3. The candidate set: a ride-on term in the product name.
  const matched = await ods({
    where: `${whereCategory} and ${whereRideOn}`,
    select: SELECT,
    order_by: "alert_date desc",
    limit: 100,
  });
  const rows = matched.results || [];

  const balance = [];
  const rideOn = [];
  let excludedAccessories = 0;

  for (const r of rows) {
    const name = lower(r.product_name);
    if (hits(name, ACCESSORY_TERMS)) {
      excludedAccessories += 1;
      continue;
    }
    const row = {
      alertNumber: clean(r.alert_number),
      date: text(r.alert_date).slice(0, 10),
      country: clean(r.alert_country),
      brand: clean(r.product_brand) || "—",
      productName: clean(r.product_name),
      category: clean(r.product_category),
      riskTypes: Array.isArray(r.alert_type) ? r.alert_type.map(clean) : [],
      riskDescription: hits(name, BALANCE_TERMS) ? clean(r.alert_description).slice(0, 320) : "",
      measures: Array.isArray(r.measures_country) ? r.measures_country.map(clean) : [],
      url: clean(r.rapex_url),
    };
    if (hits(name, BALANCE_TERMS)) balance.push(row);
    else rideOn.push(row);
  }

  // Risk-type breakdown across the ride-on set (non-exclusive: one alert can
  // carry several risk types).
  const riskCounts = new Map();
  for (const row of [...balance, ...rideOn]) {
    for (const risk of row.riskTypes) riskCounts.set(risk, (riskCounts.get(risk) || 0) + 1);
  }
  const riskBreakdown = [...riskCounts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  const years = [...balance, ...rideOn]
    .map((r) => Number(r.date.slice(0, 4)))
    .filter((y) => Number.isFinite(y));

  const dataset = {
    source: {
      name: "European Commission — Safety Gate rapid alert system (formerly RAPEX)",
      api: ODS_BASE,
      publisherUrl: PUBLISHER_URL,
      retrievedAt,
      note:
        "Read through the OpenDataSoft open-data mirror of the Commission's official weekly reports; the Commission's own JSON API rejects unauthenticated calls. Each alert links back to the official Safety Gate record.",
    },
    totals: {
      alertsInDatabase,
      alertsInCategories,
      nameMatches: rows.length,
      excludedAccessories,
      rideOnAlerts: balance.length + rideOn.length,
      balanceBikeAlerts: balance.length,
    },
    coverage: {
      databaseStartYear,
      startYear: years.length ? Math.min(...years) : null,
      endYear: years.length ? Math.max(...years) : null,
    },
    balanceBikeAlerts: balance,
    rideOnAlerts: rideOn,
    riskBreakdown,
  };

  mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  const body =
    `// AUTO-GENERATED by scripts/fetch_safety_gate_data.mjs — do not edit by hand.\n` +
    `// Run \`npm run data:safetygate\` to refresh.\n` +
    `export const SAFETY_GATE_DATASET = ${JSON.stringify(dataset, null, 2)};\n`;
  writeFileSync(OUT_FILE, body, "utf8");

  console.log(
    `[safety-gate] wrote ${OUT_FILE}: scanned ${alertsInDatabase} alerts, ` +
      `${alertsInCategories} in toy/childcare categories, ${rows.length} name matches, ` +
      `${excludedAccessories} accessories excluded, ${balance.length} balance-bike, ` +
      `${rideOn.length} other children's ride-on.`,
  );
}

main().catch((err) => {
  console.error("[safety-gate] failed:", err);
  process.exit(1);
});
