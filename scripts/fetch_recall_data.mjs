/**
 * Fetch US CPSC recall notices and emit src/data/recallData.generated.ts.
 *
 * Why this exists: plan-B asset #1 is a verifiable, first-party-built safety
 * record instead of claims we cannot support. Every number published on
 * /guides/risk/balance-bike-recall-record must be reproducible by re-running this script,
 * so the whole pipeline (query -> classification -> aggregates) lives here.
 *
 * Source: US Consumer Product Safety Commission, SaferProducts.gov
 *         Recall REST endpoint  /RestWebServices/Recall?format=json
 *
 * Usage: npm run data:recalls
 *
 * Corpus handling
 * ---------------
 * The live CPSC feed keeps growing, so re-running this script against the live
 * API silently changes every total the published pages quote — the 2026 window
 * alone had already drifted by 11 notices between two runs. To keep published
 * numbers reproducible, the default source is the PINNED corpus in
 * scripts/cache/cpsc-pinned.json, fetched once by scripts/cache/fetch_cpsc_pinned.mjs
 * with RecallDateEnd pinned to the published retrieval date. It reproduces the
 * published corpus exactly (8,335 notices). Pass --live to query the API
 * instead, or --corpus=<path> to point at another snapshot.
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import path from "node:path";

const API = "https://www.saferproducts.gov/RestWebServices/Recall";
const START_YEAR = Number(process.argv.find((a) => a.startsWith("--start="))?.split("=")[1] || 2000);
const OUT_FILE = path.resolve("src/data/recallData.generated.ts");
const USE_LIVE = process.argv.includes("--live");
const CORPUS_ARG = process.argv.find((a) => a.startsWith("--corpus="))?.split("=")[1];
const CORPUS_FILE = path.resolve(CORPUS_ARG || "scripts/cache/cpsc-pinned.json");
const CORPUS_META_FILE = path.resolve("scripts/cache/cpsc-pinned.meta.json");

/** Product taxonomy values CPSC uses for wheeled children's products. */
const VEHICLE_TYPES = new Set([
  "Bicycles & Accessories",
  "Bicycles and Bicycle Accessories",
  "Scooters / Mini bikes",
  "Powered Scooters or Skateboards",
  "Toy Ride-on",
  "Tricycles",
  "Cycling and Scooters and Skateboards and Skates",
  "Wagons",
]);

/** Protective-gear taxonomy kept separate: helmets are not vehicles. */
const GEAR_TYPES = new Set(["Bicycle Helmets"]);

const VEHICLE_TEXT = ["bicycle", "bike", "tricycle", "trike", "scooter", "ride-on", "ride on", "wagon"];
const CHILD_TEXT = ["children", "child", "kids", "kid", "toddler", "youth", "juvenile", "infant", "preschool"];

/**
 * Adult and agricultural vehicles that share the "ride-on" wording.
 *
 * CPSC uses "Toy Ride-on" as a product type for children's battery cars, but
 * the same title shape covers lawn tractors, mowers and UTVs sold to adults.
 * These are excluded by name rather than by a voltage test, because the
 * exclusion has to be auditable: a reader can look up the name and see why the
 * notice is not on the page.
 */
const ADULT_RIDE_NAMES =
  /mahindra|john deere|kubota|riding lawn|garden tractor|compact tractor|utility tractor|lawn mower|riding mower|\btractor\b|\bmower\b|go-kart|gokart/i;

/** Adult recreational trikes (recumbent, pedal-powered, branded). */
const ADULT_TRICYCLE_NAMES = /terra\s?trike|currie|wizwheelz|pedego|green\s?speed|recumbent/i;

/** "Ride-on" or "riding toy" in a notice title. */
const RIDE_ON_TITLE = /ride.?on|riding (?:toy|vehicle)|power wheels|kiddie car/i;

/** "Ride-on" or "riding toy" in a CPSC product type. */
const RIDE_ON_TYPE = /ride.on|riding toy|toy vehicles/i;

/**
 * Evidence that the vehicle is powered rather than pushed.
 *
 * The voltage branch matters: several ride-on notices never say "battery" and
 * only state "12 volt" or "24-volt" in the title, so a word-only test would
 * misfile them as pedal toys.
 */
const POWERED_PATTERN =
  /battery[- ]?(?:operated|powered)|electrically powered|\b\d{1,3}[- ]?v(?:olt)?\b|\brecharg/i;

/** A notice about a children's tricycle. */
function isChildrensTricycle(recall) {
  const title = text(recall.Title);
  if (ADULT_TRICYCLE_NAMES.test(title)) return false;
  if (/acetrike/i.test(title)) return false;
  return /\btricycles?\b|\btrikes\b/i.test(title);
}

/** A notice about a children's battery- or electric-powered ride-on vehicle. */
function isElectricRideOn(recall) {
  const title = text(recall.Title);
  const haystack = `${title} ${text(recall.Description)}`;
  if (ADULT_RIDE_NAMES.test(title)) return false;
  if (isChildrensTricycle(recall)) return false;
  if (/bicycle brake|road bike/i.test(haystack)) return false;
  if (!RIDE_ON_TITLE.test(title) && !RIDE_ON_TYPE.test([...productTypes(recall)].join(" "))) return false;
  return POWERED_PATTERN.test(haystack);
}

/**
 * Hazard groupings derived from CPSC free-text hazard statements.
 * A single notice can match several groups, so these counts are explicitly
 * non-exclusive and are labelled that way on the page.
 */
const HAZARD_GROUPS = [
  { label: "Structural failure or part breakage", keywords: ["break", "fracture", "crack", "separat", "detach", "collapse", "fail"] },
  { label: "Fall hazard / loss of control", keywords: ["fall", "lose control", "loss of control", "steering"] },
  { label: "Crash or collision risk", keywords: ["crash", "collision"] },
  { label: "Tip-over / stability", keywords: ["tip over", "tip-over", "tipover", "stability", "unstable"] },
  { label: "Lead / regulated substances", keywords: ["lead", "phthalate", "cadmium", "toxic"] },
  { label: "Entrapment, pinch or amputation", keywords: ["entrap", "pinch", "amputat", "strap"] },
  { label: "Fire, heat or battery", keywords: ["fire", "burn", "battery", "overheat", "lithium", "charg"] },
  { label: "Laceration / sharp edge", keywords: ["laceration", "sharp", "cut"] },
  { label: "Choking / small parts", keywords: ["choking", "small part", "magnet", "ingestion"] },
];

const text = (v) => (v === null || v === undefined ? "" : String(v));
const clean = (v) => text(v).replace(/\s+/g, " ").trim();

async function fetchYear(year) {
  const url = `${API}?format=json&RecallDateStart=${year}-01-01&RecallDateEnd=${year}-12-31`;
  const res = await fetch(url, { headers: { "User-Agent": "balancebiketoddler-recall-research/1.0" } });
  if (!res.ok) throw new Error(`CPSC ${year} -> HTTP ${res.status}`);
  return res.json();
}

function productTypes(recall) {
  return new Set((recall.Products || []).map((p) => text(p.Type)));
}

function blob(recall) {
  const parts = [text(recall.Title), text(recall.Description)];
  for (const p of recall.Products || []) parts.push(text(p.Name), text(p.Description), text(p.Type));
  return parts.join(" ").toLowerCase();
}

/** Primary named responsible party, if the notice lists one. */
function primaryParty(recall) {
  for (const key of ["Manufacturers", "Importers", "Distributors"]) {
    const list = recall[key] || [];
    if (list.length) {
      const name = clean(list[0].Name).split(",")[0];
      if (name) return name;
    }
  }
  return "";
}

function firstUnitCount(recall) {
  for (const p of recall.Products || []) {
    const units = clean(p.NumberOfUnits);
    if (units) return units.replace(/\s*\(.*$/, "").trim();
  }
  return "";
}

function hazardStatement(recall) {
  const fromList = (recall.Hazards || []).map((h) => clean(h.Name)).filter(Boolean);
  if (fromList.length) return fromList.join(" ");
  const fromTitle = text(recall.Title).match(/Due to (.+?)(?: Hazard|\(|$)/i);
  return fromTitle ? clean(fromTitle[1]) : "";
}

function remedyStatement(recall) {
  const fromList = (recall.RemedyOptions || []).map((r) => clean(r.Option)).filter(Boolean);
  const options = fromList.length ? fromList.join(", ") : "";
  const detail = (recall.Remedies || []).map((r) => clean(r.Name)).filter(Boolean)[0] || "";
  return options ? `${options}${detail ? `: ${detail.slice(0, 220)}` : ""}` : detail.slice(0, 220);
}

function main() {
  const today = new Date();
  const endYear = today.getUTCFullYear();

  // Sequential on purpose: SaferProducts throttles bursts and silently drops them.
  return (async () => {
    const corpus = new Map();
    const perYear = [];

    if (USE_LIVE) {
      for (let y = START_YEAR; y <= endYear; y += 1) {
        const rows = await fetchYear(y);
        perYear.push({ year: y, notices: rows.length });
        for (const r of rows) corpus.set(r.RecallID, r);
        console.log(`[recalls] ${y}: ${rows.length} notices (unique so far ${corpus.size})`);
      }
    } else {
      if (!existsSync(CORPUS_FILE)) {
        throw new Error(
          `Pinned corpus missing at ${CORPUS_FILE}. Run scripts/cache/fetch_cpsc_pinned.mjs first, ` +
            `or pass --live to query the API directly.`,
        );
      }
      const rows = JSON.parse(readFileSync(CORPUS_FILE, "utf8"));
      for (const r of rows) corpus.set(r.RecallID, r);
      console.log(`[recalls] pinned corpus ${CORPUS_FILE}: ${corpus.size} notices`);
    }

    // The retrieval date must describe the corpus actually used, not the day
    // the script happened to run, or the published page would claim a
    // freshness the underlying data does not have.
    let retrievedAt = today.toISOString().slice(0, 10);
    if (!USE_LIVE && existsSync(CORPUS_META_FILE)) {
      const meta = JSON.parse(readFileSync(CORPUS_META_FILE, "utf8"));
      if (meta.retrievedAt) retrievedAt = meta.retrievedAt;
    }

    const all = [...corpus.values()];
    const balanceBike = [];
    const kidBike = [];
    const kidHelmet = [];
    /**
     * Notices describing a wheeled children's product that none of the three
     * published buckets claim. The two new buckets below are carved from this
     * pool and nowhere else, so the published counts for balance bikes
     * (2), children's bicycles (44) and children's helmets (59) cannot change
     * when this file is re-run.
     */
    const unclaimed = [];

    for (const recall of all) {
      const types = productTypes(recall);
      const text_ = blob(recall);
      const isWheeled =
        [...types].some((t) => VEHICLE_TYPES.has(t)) || VEHICLE_TEXT.some((k) => text_.includes(k));
      if (!isWheeled) continue;
      const mentionsChild = CHILD_TEXT.some((k) => text_.includes(k));
      const mentionsBike = text_.includes("bicycle") || text_.includes("bike");
      const isBalanceBike =
        text_.includes("balance bike") || text_.includes("balance-bike") || text_.includes("no pedals");

      // Helmets and pad sets are protective gear, not children's vehicles.
      // Keeping them inside the bike set made the recent "surge" an artefact of
      // rising helmet recalls, so they are counted as their own population.
      const isGear =
        [...types].some((t) => GEAR_TYPES.has(t)) ||
        (text_.includes("helmet") && !/\bbicycles?\b(?! (helmet|helmets))/i.test(text(recall.Title)));

      if (isBalanceBike) balanceBike.push(recall);
      else if (isGear) kidHelmet.push(recall);
      else if (mentionsChild && mentionsBike) kidBike.push(recall);
      else unclaimed.push(recall);
    }

    // Carved strictly from the unclaimed pool, so the three published buckets
    // above keep their exact counts.
    const tricycle = unclaimed.filter(isChildrensTricycle);
    const rideOn = unclaimed.filter(isElectricRideOn);

    const sortNewest = (a, b) => (a.RecallDate < b.RecallDate ? 1 : -1);
    balanceBike.sort(sortNewest);
    kidBike.sort(sortNewest);
    tricycle.sort(sortNewest);
    rideOn.sort(sortNewest);

    const toRow = (recall) => ({
      recallNumber: text(recall.RecallNumber),
      date: text(recall.RecallDate).slice(0, 10),
      title: clean(recall.Title),
      url: text(recall.URL),
      party: primaryParty(recall),
      units: firstUnitCount(recall),
      hazard: hazardStatement(recall).slice(0, 300),
      remedy: remedyStatement(recall),
    });

    // Hazard groups across the kids'-bike set (non-exclusive).
    const hazardCounts = HAZARD_GROUPS.map((group) => {
      const count = kidBike.filter((r) => {
        const hay = `${blob(r)} ${hazardStatement(r)}`.toLowerCase();
        return group.keywords.some((k) => hay.includes(k));
      }).length;
      return { label: group.label, count };
    })
      .filter((row) => row.count > 0)
      .sort((a, b) => b.count - a.count);

    // Same hazard grouping applied to the two newer buckets. Kept as separate
    // arrays so the published kids'-bike breakdown keeps its exact ordering.
    const hazardCountsFor = (rows) =>
      HAZARD_GROUPS.map((group) => {
        const count = rows.filter((r) => {
          const hay = `${blob(r)} ${hazardStatement(r)}`.toLowerCase();
          return group.keywords.some((k) => hay.includes(k));
        }).length;
        return { label: group.label, count };
      })
        .filter((row) => row.count > 0)
        .sort((a, b) => b.count - a.count);

    // Share of all CPSC recall volume: without normalising, a rising count could
    // simply reflect CPSC publishing more notices overall.
    const year = (r) => Number(text(r.RecallDate).slice(0, 4));
    const totalByYear = new Map();
    for (const r of all) totalByYear.set(year(r), (totalByYear.get(year(r)) || 0) + 1);
    const kidByYear = new Map();
    for (const r of kidBike) kidByYear.set(year(r), (kidByYear.get(year(r)) || 0) + 1);
    const gearByYear = new Map();
    for (const r of kidHelmet) gearByYear.set(year(r), (gearByYear.get(year(r)) || 0) + 1);

    const yearlyTrend = [];
    for (let y = START_YEAR; y <= endYear; y += 1) {
      const total = totalByYear.get(y) || 0;
      const kids = kidByYear.get(y) || 0;
      const gear = gearByYear.get(y) || 0;
      yearlyTrend.push({
        year: y,
        kidBikeNotices: kids,
        kidHelmetNotices: gear,
        totalNotices: total,
        sharePct: total ? Number(((kids / total) * 100).toFixed(2)) : 0,
      });
    }

    /**
     * Per-year notice counts for one bucket, every year in range including
     * zero years, so a page can draw a complete trend without deciding which
     * years to skip.
     */
    const yearlyTrendFor = (rows) => {
      const byYear = new Map();
      for (const r of rows) byYear.set(year(r), (byYear.get(year(r)) || 0) + 1);
      const out = [];
      for (let y = START_YEAR; y <= endYear; y += 1) {
        out.push({ year: y, notices: byYear.get(y) || 0 });
      }
      return out;
    };

    const periodShare = (from, to) => {
      const rows = yearlyTrend.filter((row) => row.year >= from && row.year <= to);
      const kids = rows.reduce((sum, row) => sum + row.kidBikeNotices, 0);
      const gear = rows.reduce((sum, row) => sum + row.kidHelmetNotices, 0);
      const total = rows.reduce((sum, row) => sum + row.totalNotices, 0);
      return {
        period: `${from}-${to}`,
        kidBikeNotices: kids,
        kidHelmetNotices: gear,
        totalNotices: total,
        sharePct: total ? Number(((kids / total) * 100).toFixed(2)) : 0,
      };
    };

    const dataset = {
      source: {
        name: "U.S. Consumer Product Safety Commission — SaferProducts.gov recall notices",
        api: `${API}?format=json&RecallDateStart=<year>-01-01&RecallDateEnd=<year>-12-31`,
        publisherUrl: "https://www.cpsc.gov/Recalls",
        retrievedAt,
        coverageStartYear: START_YEAR,
        coverageEndYear: endYear,
      },
      totals: {
        cpscNoticesRetrieved: all.length,
        kidsBikeNotices: kidBike.length,
        kidHelmetNotices: kidHelmet.length,
        balanceBikeNotices: balanceBike.length,
        rideOnNotices: rideOn.length,
        tricycleNotices: tricycle.length,
      },
      balanceBikeNotices: balanceBike.map(toRow),
      kidBikeNotices: kidBike.map(toRow),
      kidHelmetNotices: kidHelmet.map(toRow),
      rideOnNotices: rideOn.map(toRow),
      tricycleNotices: tricycle.map(toRow),
      hazardBreakdown: hazardCounts,
      rideOnHazardBreakdown: hazardCountsFor(rideOn),
      tricycleHazardBreakdown: hazardCountsFor(tricycle),
      rideOnYearlyTrend: yearlyTrendFor(rideOn),
      tricycleYearlyTrend: yearlyTrendFor(tricycle),
      yearlyTrend,
      periodTrend: [
        periodShare(START_YEAR, Math.max(START_YEAR, endYear - 9)),
        periodShare(endYear - 4, endYear),
      ],
    };

    mkdirSync(path.dirname(OUT_FILE), { recursive: true });
    const body = `// AUTO-GENERATED by scripts/fetch_recall_data.mjs — do not edit by hand.\n// Run \`npm run data:recalls\` to refresh.\nexport const RECALL_DATASET = ${JSON.stringify(dataset, null, 2)};\n`;
    writeFileSync(OUT_FILE, body, "utf8");

    console.log(
      `[recalls] wrote ${OUT_FILE}: ${dataset.totals.cpscNoticesRetrieved} CPSC notices, ` +
        `${dataset.totals.kidsBikeNotices} kids'-bike, ${dataset.totals.balanceBikeNotices} balance-bike.`,
    );
  })();
}

main().catch((err) => {
  console.error("[recalls] failed:", err);
  process.exit(1);
});
