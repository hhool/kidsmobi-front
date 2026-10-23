// Generate src/data/kidsStabilityData.generated.ts from the site's CMS product snapshot.
//
// Plan-B Asset (stability & "stable track") for the kids-bikes category. The
// balance-bike version of this page answered the "stable track" question with a
// measurement and found almost nobody publishes one. This kids-bikes variant
// runs the same reproducible pipeline against the kids_bikes category so the two
// pages stay comparable and the honesty is preserved: parents search for a
// measurable, and we report whether the listings make it public.
//
// This is a category-filtered variant of scripts/fetch_stability_data.mjs (which
// produces the balance-bike dataset). Keeping the two scripts separate avoids
// touching the already-shipping balance-bike pipeline.
//
// Usage:  npm run data:kids-stability   (or: node scripts/fetch_kids_stability_data.mjs [export.json] [out.ts])
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { publishedProducts } from "./lib/publishedProducts.mjs";
import { dirname, resolve } from "node:path";

const repoRoot = resolve(process.cwd());
const exportPath = resolve(repoRoot, process.argv[2] || "doc/cms-export-1784286890682.json");
const OUT_FILE = resolve(repoRoot, process.argv[3] || "src/data/kidsStabilityData.generated.ts");

const CATEGORY_SLUG = {
  balance_bike: "balance-bikes",
  kids_bikes: "kids-bikes",
  kids_tricycles: "kids-tricycles",
  kids_push_ride_ons: "ride-ons",
  kids_pull_along_wagons: "wagons",
  electric_vehicles: "electric-cars",
  scooters: "kids-scooters",
  car_seat: "safety-seats",
};

const EMPTY = new Set(["", "n/a", "na", "none", "null", "-", "0", "unknown", "unspecified"]);
const isEmpty = (v) => !v || EMPTY.has(String(v).trim().toLowerCase());

const round1 = (n) => Math.round(n * 10) / 10;
/** Geometry figures keep their stated precision — 1.45 in must not become 1.5. */
const round2 = (n) => Math.round(n * 100) / 100;

function shortName(name, max = 78) {
  const s = String(name || "").trim();
  return s.length <= max ? s : s.slice(0, max - 1).trimEnd() + "…";
}

const M = (p) => p?.Product_Specifications?.Measurements || {};
const F = (p) => p?.Product_Specifications?.Features_Specs || {};
const C = (p) => p?.Product_Specifications?.Materials_Care || {};
const D = (p) => p?.Product_Specifications?.Item_Details || {};

/** Inches, from values like "12 Inch". */
function parseInches(text) {
  if (isEmpty(text)) return null;
  const m = String(text).match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : null;
}

function parsePounds(text) {
  if (isEmpty(text)) return null;
  const raw = String(text).trim();
  const num = parseFloat(raw.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(num) || num <= 0) return null;
  return /kilo|\bkg\b/i.test(raw) ? round1(num * 2.20462) : round1(num);
}

function parsePrice(text) {
  if (isEmpty(text)) return null;
  const m = String(text).match(/(\d+(?:\.\d{1,2})?)/);
  return m ? parseFloat(m[1]) : null;
}

/** Individual copy fragments, before joining — the unit a real sentence lives in. */
function listingSegments(p) {
  const spec = p?.Product_Specifications || {};
  const parts = [p?.name];
  for (const key of ["Top Features", "Decision Signals"]) {
    const v = spec.Additional_Details?.[key];
    if (Array.isArray(v)) parts.push(...v.map(String));
    // Some records store these as one pipe-delimited string rather than a list;
    // splitting keeps every clause its own unit for citation.
    else if (v) parts.push(...String(v).split("|"));
  }
  const feats = spec.Category_Attributes?.features;
  if (Array.isArray(feats)) parts.push(...feats.map(String));
  return parts.filter(Boolean);
}

function listingText(p) {
  return listingSegments(p).join(" | ");
}

// The measurement parents are actually searching for. Matched against listing
// copy only — no field in the CMS snapshot carries a track width.
const TRACK_SPACING_RE = /(\d+(?:\.\d+)?)\s*(?:inch|in\b|")\s*(?:front\s+)?wheel\s+spacing/i;
const TIRE_WIDTH_RE = /(\d+(?:\.\d+)?)\s*(?:inch|in\b|")\s*wheel\s+width/i;
const STEERING_LIMIT_RE = /(\d+(?:\.\d+)?)\s*°\s*(?:limited|limit)\s*steering/i;
const MAX_LOAD_RE = /supports?\s+up\s+to\s+(\d+(?:\.\d+)?)\s*lbs/i;

// Four wheels is the single biggest stability decision a first-bike maker takes,
// and it is stated in copy rather than in any spec field. Anything we cannot
// read out stays null — we never assume a two-wheeler.
const FOUR_WHEEL_RE = /\b4[\s-]?wheels?\b|four[\s-]?wheels?\b/i;
const TWO_WHEEL_RE = /\b2[\s-]?wheels?\b|two[\s-]?wheels?\b|\bdual[\s-]?wheels?\b/i;

// Training wheels are the stability question a pedal kids' bike actually raises.
// The balance-bike dataset has no equivalent signal because a balance bike has
// no third wheel to remove; here it is the first thing a parent asks about, so
// it gets its own read rather than being folded into the wheel count.
const TRAINING_WHEEL_RE =
  /training\s+wheels?|stabili[sz](?:er|ing)\s+wheels?|support\s+wheels?|auxiliary\s+wheels?|outrigger\s+wheels?/i;
// Whether they come off matters as much as whether they exist: a convertible
// bike that ships with them is a different purchase from a fixed one.
const REMOVABLE_TRAINING_RE =
  /(?:remove|detach|adjust|fold)[a-z]{0,12}\s+(?:the\s+)?training\s+wheels?|training\s+wheels?\s+(?:are\s+)?(?:removable|detachable|adjustable)/i;

// Claims, kept separately from measurements: the page must be able to say
// "X of Y listings *claim* stability" without implying anyone verified it.
const SIGNAL_PATTERNS = [
  { key: "anti_tip", re: /anti[- ]?tip|no[- ]?tipp|tip[- ]resistant|prevent[s]? (?:the )?tipping/i },
  { key: "low_center_of_gravity", re: /low(?:er)? center of gravity|centre of gravity/i },
  { key: "limited_steering", re: /limited steering|steer(?:ing)? limit/i },
  { key: "wide_stance", re: /wide (?:and )?(?:tough |sturdy )?(?:carbon steel |steel )?frame|wide wheel|wider wheel/i },
  { key: "stable", re: /\bstable\b|\bstability\b/i },
];

/** "EVA foam wheel | EVA Foam / Flat-free" -> "EVA foam (flat-free)". null when unspecified. */
function tireClass(raw) {
  if (isEmpty(raw)) return null;
  let text = String(raw);
  if (text.includes("|")) text = text.split("|").pop();
  if (/^[\d.\s]+$/.test(text)) return null; // the field sometimes leaks a wheel count
  if (/eva|foam|flat[- ]free/i.test(text)) return "EVA foam (flat-free)";
  if (/rubber/i.test(text)) return "Rubber";
  if (/plastic/i.test(text)) return "Plastic";
  return null;
}

function frameClass(raw) {
  if (isEmpty(raw)) return null;
  const text = String(raw).trim();
  if (/^(ultra lightweight|lightweight)$/i.test(text)) return "Not specified";
  return text;
}

function firstNumber(text, re, keepPrecision = false) {
  const m = String(text).match(re);
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (!Number.isFinite(n) || n <= 0) return null;
  return keepPrecision ? round2(n) : round1(n);
}

/**
 * The copy fragment a measurement came from, so a reader can check the extraction
 * instead of trusting our regex. Sentences are taken whole from the source list —
 * splitting on "." here would happily cut "5.1-inch" in half.
 */
function evidenceSentence(p, re) {
  const hit = listingSegments(p)
    .map((s) => s.trim())
    .filter((s) => re.test(s))
    .sort((a, b) => b.length - a.length)[0];
  if (!hit) return null;
  return hit.length <= 320 ? hit : `${hit.slice(0, 319).trimEnd()}…`;
}

async function main() {
  const raw = JSON.parse(readFileSync(exportPath, "utf8"));
  // Same Stage-1 prune filter as fetch_age_data.mjs — see scripts/lib/publishedProducts.mjs.
  const { products } = publishedProducts(raw?.data?.collections?.products || []);
  const retrievedAt = new Date().toISOString().slice(0, 10);

  // Catalog-wide context: across every product we track, how many publish a
  // wheel-spacing figure at all. This is the sentence the whole page rests on.
  let catalogTrackSpacing = 0;
  for (const p of products) {
    if (firstNumber(listingText(p), TRACK_SPACING_RE) != null) catalogTrackSpacing += 1;
  }

  const kidsBikes = [];
  for (const p of products.filter((x) => x.category === "kids_bikes")) {
    const copy = listingText(p);
    const trackSpacingIn = firstNumber(copy, TRACK_SPACING_RE, true);
    const tireWidthIn = firstNumber(copy, TIRE_WIDTH_RE, true);
    const steeringLimitDeg = firstNumber(copy, STEERING_LIMIT_RE, true);
    const maxLoadLb = firstNumber(copy, MAX_LOAD_RE);

    let wheelCount = null;
    let wheelCountEvidence = null;
    if (FOUR_WHEEL_RE.test(copy)) {
      wheelCount = 4;
      wheelCountEvidence = (copy.match(FOUR_WHEEL_RE) || [])[0];
    } else if (TWO_WHEEL_RE.test(copy)) {
      wheelCount = 2;
      wheelCountEvidence = (copy.match(TWO_WHEEL_RE) || [])[0];
    }

    const stabilitySignals = SIGNAL_PATTERNS.filter((s) => s.re.test(copy)).map((s) => s.key);

    // Training wheels: presence, and whether the listing says they come off.
    // Both are read from copy only, and both stay null when unstated.
    const mentionsTrainingWheels = TRAINING_WHEEL_RE.test(copy);
    const trainingWheelsRemovable = mentionsTrainingWheels
      ? REMOVABLE_TRAINING_RE.test(copy)
        ? true
        : null
      : false;

    // The raw sentence a measurement came from, so a reader can check the maths
    // instead of trusting our regex. Only kept for rows that publish geometry.
    const quotedEvidence = trackSpacingIn != null ? evidenceSentence(p, TRACK_SPACING_RE) : null;
    const trainingWheelEvidence = mentionsTrainingWheels ? evidenceSentence(p, TRAINING_WHEEL_RE) : null;

    kidsBikes.push({
      id: p.id,
      brand: p.brand || null,
      name: shortName(p.name),
      wheelCount,
      wheelCountEvidence,
      wheelSizeIn: parseInches(M(p)["Wheel Size"]),
      trackSpacingIn,
      tireWidthIn,
      steeringLimitDeg,
      maxLoadLb,
      hasNumericGeometry: trackSpacingIn != null || tireWidthIn != null || steeringLimitDeg != null,
      tireClass: tireClass(C(p)["Tire"]),
      frameMaterial: frameClass(F(p)["Frame Material"]),
      weightLb: parsePounds(M(p)["Item Weight"]),
      priceUsd: parsePrice(M(p)["Price"] ?? p.price),
      stabilitySignals,
      mentionsTrainingWheels,
      trainingWheelsRemovable,
      trainingWheelEvidence,
      rating: isEmpty(D(p)["Rating"]) ? null : parseFloat(D(p)["Rating"]),
      reviewCount: isEmpty(D(p)["Review Count"])
        ? null
        : parseInt(String(D(p)["Review Count"]).replace(/[^0-9]/g, ""), 10) || null,
      ageText: isEmpty(F(p)["Age Range"]) ? null : String(F(p)["Age Range"]).split("|").pop().trim(),
      productUrl: `/products/${CATEGORY_SLUG[p.category] || "kids-bikes"}/${p.id}`,
      quotedEvidence,
    });
  }

  kidsBikes.sort((a, b) => {
    if (a.hasNumericGeometry !== b.hasNumericGeometry) return a.hasNumericGeometry ? -1 : 1;
    if ((a.wheelCount ?? 0) !== (b.wheelCount ?? 0)) return (b.wheelCount ?? 0) - (a.wheelCount ?? 0);
    return (a.brand || "").localeCompare(b.brand || "");
  });

  const listed = kidsBikes.length;
  const count = (fn) => kidsBikes.filter(fn).length;

  const coverage = {
    listed,
    withTrackSpacing: count((b) => b.trackSpacingIn != null),
    withTireWidth: count((b) => b.tireWidthIn != null),
    withSteeringLimit: count((b) => b.steeringLimitDeg != null),
    withNumericGeometry: count((b) => b.hasNumericGeometry),
    withWheelSize: count((b) => b.wheelSizeIn != null),
    withWheelCount: count((b) => b.wheelCount != null),
    withTireClass: count((b) => b.tireClass != null),
    withFrameMaterial: count((b) => b.frameMaterial != null && b.frameMaterial !== "Not specified"),
    withMaxLoad: count((b) => b.maxLoadLb != null),
    withStabilityClaim: count((b) => b.stabilitySignals.length > 0),
    fourWheel: count((b) => b.wheelCount === 4),
    // Training wheels are stated positively or not at all; absence of the words
    // is reported as "not stated" rather than as "does not come with them".
    mentionsTrainingWheels: count((b) => b.mentionsTrainingWheels === true),
    trainingWheelsRemovable: count((b) => b.trainingWheelsRemovable === true),
    withAgeRange: count((b) => b.ageText != null),
    withWeight: count((b) => b.weightLb != null),
    withPrice: count((b) => b.priceUsd != null),
  };

  // The one listing that publishes geometry, surfaced for the page to quote.
  const published = kidsBikes.filter((b) => b.hasNumericGeometry);

  const wheelSizeGroups = {};
  for (const b of kidsBikes) {
    const key = b.wheelSizeIn == null ? "not listed" : `${b.wheelSizeIn}"`;
    wheelSizeGroups[key] = (wheelSizeGroups[key] || 0) + 1;
  }

  /**
   * A pedal kids' bike's stability question is a function of size: a 12-inch
   * bike and a 20-inch bike are not asking the same question of the floor. The
   * age range is the field this category publishes reliably, so it is summarised
   * here as the axis a reader can actually reason along.
   */
  function ageYears(text) {
    if (!text) return null;
    const nums = String(text).match(/\d+(?:\.\d+)?/g);
    if (!nums || !nums.length) return null;
    const vals = nums.map(Number).filter((n) => n >= 0 && n <= 18);
    if (!vals.length) return null;
    return { min: Math.min(...vals), max: Math.max(...vals) };
  }

  const ageParsed = kidsBikes.map((b) => ({ b, a: ageYears(b.ageText) }));
  const ageMins = ageParsed.filter((x) => x.a).map((x) => x.a.min);
  const ageMaxs = ageParsed.filter((x) => x.a).map((x) => x.a.max);
  const ageCoverage = {
    withAgeText: ageParsed.filter((x) => x.a).length,
    minAgeYears: ageMins.length ? Math.min(...ageMins) : null,
    maxAgeYears: ageMaxs.length ? Math.max(...ageMaxs) : null,
  };

  const dataset = {
    source: {
      name: "BalanceBikeToddler CMS product specification snapshot",
      exportFile: "cms-export-1784286890682.json",
      retrievedAt,
      note:
        "Wheel counts, stability claims and every geometry figure are read out of listing copy in the site's CMS, synced from retailer and manufacturer pages. Nothing here is measured by us. Verify against the manufacturer before purchase.",
    },
    method: {
      categoryIncluded: "kids_bikes",
      fields: {
        wheelSize: "Product_Specifications.Measurements['Wheel Size']",
        itemWeight: "Product_Specifications.Measurements['Item Weight']",
        tire: "Product_Specifications.Materials_Care['Tire']",
        frame: "Product_Specifications.Features_Specs['Frame Material']",
      },
      textMinedFields: [
        "trackSpacingIn — \\d+(?:\\.\\d+)?\\s*(?:inch|in)\\s*(?:front\\s+)?wheel\\s+spacing",
        "tireWidthIn — \\d+(?:\\.\\d+)?\\s*(?:inch|in)\\s*wheel\\s+width",
        "steeringLimitDeg — \\d+(?:\\.\\d+)?\\s*°\\s*(?:limited|limit)\\s*steering",
        "maxLoadLb — supports? up to \\d+ lbs",
        "wheelCount — \\b4[\\s-]?wheels?\\b|four[\\s-]?wheels?\\b (then the two-wheel equivalent)",
        "mentionsTrainingWheels — training|stabiliser|support|auxiliary|outrigger wheels",
        "trainingWheelsRemovable — remove|detach|adjust|fold … training wheels",
      ],
      unknownPolicy: "anything the listing does not state stays null and is reported as unspecified",
      minutesPolicy:
        'values such as "Ultra Lightweight" in the frame field are treated as a missing material, not as a real one',
    },
    catalog: {
      productsScanned: products.length,
      withTrackSpacing: catalogTrackSpacing,
    },
    coverage,
    ageCoverage,
    kidsBikes,
    publishedGeometry: published.map((b) => ({
      brand: b.brand,
      name: b.name,
      trackSpacingIn: b.trackSpacingIn,
      tireWidthIn: b.tireWidthIn,
      steeringLimitDeg: b.steeringLimitDeg,
      wheelCount: b.wheelCount,
      wheelSizeIn: b.wheelSizeIn,
      productUrl: b.productUrl,
      quote: b.quotedEvidence,
    })),
    wheelSizeGroups,
  };

  mkdirSync(dirname(OUT_FILE), { recursive: true });
  writeFileSync(
    OUT_FILE,
    `// AUTO-GENERATED by scripts/fetch_kids_stability_data.mjs — do not edit by hand.\n` +
      `// Run \`npm run data:kids-stability\` to refresh from the CMS snapshot.\n` +
      `export const KIDS_STABILITY_DATASET = ${JSON.stringify(dataset, null, 2)};\n`,
    "utf8",
  );

  console.log(
    `[kids-stability] wrote ${OUT_FILE}: ${listed} kids bikes, ` +
      `${coverage.withTrackSpacing} publish a wheel spacing, ` +
      `${coverage.withNumericGeometry} publish any numeric geometry, ` +
      `${coverage.withWheelSize} publish a wheel size, ${coverage.withTireClass} publish a tire material.`,
  );
  console.log(
    `[kids-stability] catalog-wide: ${catalogTrackSpacing} of ${products.length} products publish a wheel-spacing figure.`,
  );
  console.log(
    `[kids-stability] training wheels mentioned in ${coverage.mentionsTrainingWheels}/${listed}; ` +
      `${coverage.trainingWheelsRemovable} say they come off; ${coverage.withAgeRange} publish an age range.`,
  );
}

main().catch((err) => {
  console.error("[kids-stability] failed:", err);
  process.exit(1);
});
