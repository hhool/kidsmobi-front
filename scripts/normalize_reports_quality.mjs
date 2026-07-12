#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const dryRun = !args.includes("--write");

const reportsDir = path.resolve("./public/data/reports");
const reportFiles = fs
  .readdirSync(reportsDir)
  .filter((name) => name.endsWith("_report.json"))
  .sort();

const GENERIC_BRANDS = new Set(["", "baby", "unknown", "n/a", "na", "none", "null"]);

const CATEGORY_SIGNALS = {
  baby_carrier: /\b(baby\s*carrier|infant\s*carrier|wrap\s*carrier|sling\s*carrier)\b/i,
  balance_bike: /\b(balance\s*bike|no[-\s]*pedal\s*bike|push\s*bike|glider\s*bike)\b/i,
  car_seat: /\b(car\s*seat|booster\s*seat|infant\s*seat|convertible\s*car\s*seat)\b/i,
  electric_vehicles: /\b(electric\s*(bike|scooter|car|vehicle)|ride[-\s]*on|battery[-\s]*powered|powered\s*ride)\b/i,
  high_chair: /\b(high\s*chair|feeding\s*chair|booster\s*chair)\b/i,
  kids_bikes: /\b(kids?\s*bike|children'?s\s*bike|bmx|mountain\s*bike|bike\s*for\s*kids?)\b/i,
  kids_pull_along_wagons: /\b(wagon|stroller\s*wagon|pull[-\s]*along|pull\s*wagon|utility\s*wagon)\b/i,
  kids_push_ride_ons: /\b(push\s*ride[-\s]*on|ride[-\s]*on\s*toy|ride\s*on|walker\s*ride\s*on|foot[-\s]*to[-\s]*floor|cozy\s*coupe|busy\s*buggy|tractor)\b/i,
  kids_tricycles: /\b(tricycle|trike|3[-\s]*wheel\s*bike|three[-\s]*wheel\s*bike)\b/i,
  playard: /\b(playard|playpen|pack\s*n\s*play|portable\s*crib|nursery\s*center)\b/i,
  scooters: /\b(scooter|kick\s*scooter|electric\s*scooter|folding\s*scooter)\b/i,
  strollers: /\b(stroller|pushchair|pram|travel\s*system|buggy|jogger|umbrella\s*stroller|stroller\s*wagon)\b/i,
};

const BRAND_HINTS = [
  { regex: /\bbaby\s+trend\b/i, brand: "Baby Trend" },
  { regex: /\bhagaday\b/i, brand: "Hagaday" },
  { regex: /\bmonamii\b/i, brand: "Monamii" },
  { regex: /\bbaby\s+delight\b/i, brand: "Baby Delight" },
  { regex: /\bradio\s+flyer\b/i, brand: "Radio Flyer" },
  { regex: /\blittle\s+tikes\b/i, brand: "Little Tikes" },
  { regex: /\bdream\s+on\s+me\b/i, brand: "Dream On Me" },
];

function inferBrand(record) {
  const haystack = [
    String(record?.Title || ""),
    String(record?.Features || ""),
    JSON.stringify(record?.Category_Attributes || {}),
    JSON.stringify(record?.Product_Specifications || {}),
    JSON.stringify(record?.Item_Details || {}),
  ].join(" ");

  for (const hint of BRAND_HINTS) {
    if (hint.regex.test(haystack)) return hint.brand;
  }
  return null;
}

function normalizeRecordBrand(record) {
  const current = String(record?.Brand || "").trim();
  if (!GENERIC_BRANDS.has(current.toLowerCase())) return false;

  const inferred = inferBrand(record);
  if (!inferred) return false;

  record.Brand = inferred;

  if (record.Category_Attributes && typeof record.Category_Attributes === "object") {
    record.Category_Attributes.Brand = inferred;
  }

  if (record.Expert_Review_Inputs && typeof record.Expert_Review_Inputs === "object") {
    record.Expert_Review_Inputs.brand = inferred;
  }

  return true;
}

function isOutOfCategory(entry, signal) {
  if (!signal) return false;
  const text = `${entry?.Title || ""} ${entry?.Features || ""}`;
  return !signal.test(text);
}

function getCategoryKey(fileName) {
  return fileName.replace(/_report\.json$/, "");
}

const summary = {
  dryRun,
  files: reportFiles.length,
  brandNormalized: 0,
  topLevelSimilarRemoved: 0,
  nestedSimilarRemoved: 0,
  perFile: {},
};

for (const fileName of reportFiles) {
  const filePath = path.join(reportsDir, fileName);
  const categoryKey = getCategoryKey(fileName);
  const signal = CATEGORY_SIGNALS[categoryKey];
  const records = JSON.parse(fs.readFileSync(filePath, "utf8"));

  let fileBrandNormalized = 0;
  let fileTopLevelRemoved = 0;
  let fileNestedRemoved = 0;

  for (const record of records) {
    if (normalizeRecordBrand(record)) {
      summary.brandNormalized += 1;
      fileBrandNormalized += 1;
    }

    if (signal && Array.isArray(record?.Similar_Items_Quick_Delivery)) {
      const before = record.Similar_Items_Quick_Delivery.length;
      record.Similar_Items_Quick_Delivery = record.Similar_Items_Quick_Delivery.filter(
        (item) => !isOutOfCategory(item, signal)
      );
      const removed = before - record.Similar_Items_Quick_Delivery.length;

      if (removed > 0) {
        summary.nestedSimilarRemoved += removed;
        fileNestedRemoved += removed;

        if (record.Similar_Items_Quick_Delivery_Audit && typeof record.Similar_Items_Quick_Delivery_Audit === "object") {
          const audit = record.Similar_Items_Quick_Delivery_Audit;
          audit.excluded_count = Number(audit.excluded_count || 0) + removed;
          audit.retained_count = Math.max(0, Number(audit.retained_count || before) - removed);
        }
      }
    }
  }

  let nextRecords = records;
  if (signal) {
    nextRecords = records.filter((record) => {
      const rank = String(record?.Rank || "").trim().toLowerCase();
      if (rank !== "similar") return true;
      if (!isOutOfCategory(record, signal)) return true;
      summary.topLevelSimilarRemoved += 1;
      fileTopLevelRemoved += 1;
      return false;
    });
  }

  summary.perFile[fileName] = {
    brandNormalized: fileBrandNormalized,
    topLevelSimilarRemoved: fileTopLevelRemoved,
    nestedSimilarRemoved: fileNestedRemoved,
    rowsAfter: nextRecords.length,
  };

  if (!dryRun) {
    fs.writeFileSync(filePath, `${JSON.stringify(nextRecords, null, 2)}\n`, "utf8");
  }
}

console.log(JSON.stringify(summary, null, 2));
if (dryRun) {
  console.log("Dry run complete. Re-run with --write to apply changes.");
}
