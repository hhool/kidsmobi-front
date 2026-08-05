#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_BASE = "https://store.balancebiketoddler.com";
const DEFAULT_INPUT = "../backend/.deploy/worker-api-data/api-data/kids_bikes/kids_bikes_report.json";

const CATEGORY_MAP = {
  balance_bike: "balance",
  kids_bikes: "bicycle",
  kids_tricycles: "tricycle",
  scooters: "scooter",
  electric_vehicles: "electric_car",
  car_seat: "safety_seat",
};

const COMPLIANCE_MAP = {
  balance_bike: ["ASTM F963", "CPSC"],
  kids_bikes: ["CPSC"],
  kids_tricycles: ["ASTM F963"],
  scooters: ["ASTM F963", "CPSC"],
  electric_vehicles: ["ASTM F963", "CPSC"],
  car_seat: ["CPC", "CE"],
  stroller: ["EN1888"],
  double_stroller: ["EN1888"],
  jogger_stroller: ["EN1888"],
};

function parseArgs(argv) {
  const result = {
    base: DEFAULT_BASE,
    input: DEFAULT_INPUT,
    categoryId: "",
    apply: false,
    timeoutMs: 15000,
    retries: 4,
  };

  for (const arg of argv) {
    if (arg.startsWith("--base=")) result.base = arg.slice("--base=".length);
    else if (arg.startsWith("--input=")) result.input = arg.slice("--input=".length);
    else if (arg.startsWith("--categoryId=")) result.categoryId = arg.slice("--categoryId=".length);
    else if (arg === "--apply") result.apply = true;
    else if (arg.startsWith("--timeoutMs=")) result.timeoutMs = Number(arg.slice("--timeoutMs=".length)) || 15000;
    else if (arg.startsWith("--retries=")) result.retries = Number(arg.slice("--retries=".length)) || 4;
  }

  return result;
}

function normalizeBase(base) {
  return String(base || "").trim().replace(/\/+$/, "");
}

function inferCategoryId(inputPath) {
  const basename = path.basename(String(inputPath || "")).toLowerCase();
  if (basename.endsWith("_report.json")) {
    return basename.slice(0, -"_report.json".length);
  }
  return "";
}

function isInvalidString(value) {
  const text = String(value || "").trim().toLowerCase();
  return !text || text === "n/a" || text === "none" || text === "null" || text.startsWith("about:blank");
}

function parseNumber(value) {
  const parsed = Number(String(value ?? "").replace(/[^0-9.]+/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function splitFeatures(value) {
  return String(value || "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function normalizeCategoryName(categoryId) {
  return CATEGORY_MAP[categoryId] || "stroller";
}

function toCmsProduct(item, categoryId) {
  const asin = String(item?.ASIN || "").trim().toUpperCase();
  if (!asin) return null;

  const imageCandidates = [item?.Listing_Image_URL, item?.Image_URL, item?.Local_Image_Path]
    .map((value) => String(value || "").trim())
    .filter((value) => value && !isInvalidString(value));

  const features = splitFeatures(item?.Features);
  const ratingValue = parseNumber(item?.Rating);
  const reviewCount = parseNumber(item?.Reviews);
  const price = parseNumber(item?.Price);
  const weightLbs = parseNumber(item?.Category_Attributes?.["Item Weight"]);
  const now = new Date().toISOString();

  const name = String(item?.Title || `${categoryId} ${asin}`).trim();
  const brand = String(item?.Brand || "Unknown").trim() || "Unknown";
  const customersSay = String(item?.customers_say || "").trim();
  const productDescription = String(item?.Product_Description || "").trim();
  const productSpecifications = item?.Product_Specifications && typeof item.Product_Specifications === "object"
    ? item.Product_Specifications
    : {};
  const categoryAttributes = item?.Category_Attributes && typeof item.Category_Attributes === "object"
    ? item.Category_Attributes
    : {};
  const displayFields = item?.Product_Display_Fields && typeof item.Product_Display_Fields === "object"
    ? item.Product_Display_Fields
    : {};

  const score = ratingValue > 0 ? Math.max(6.5, Math.min(10, ratingValue * 1.9)) : 8.0;

  return {
    id: `${categoryId}-${asin.toLowerCase()}`,
    name,
    brand,
    category: normalizeCategoryName(categoryId),
    categoryId,
    status: "published",
    price,
    weight: weightLbs,
    imageUrl: imageCandidates[0] || "",
    productImageUrls: imageCandidates,
    galleryUrls: imageCandidates,
    featureImageUrls: imageCandidates,
    videoUrl: "",
    features,
    scenarios: [categoryId],
    relatedProductIds: [],
    compliance: COMPLIANCE_MAP[categoryId] || [],
    overallScore: score,
    safetyScore: score,
    weightScore: weightLbs > 0 ? Math.max(6.5, Math.min(10, 10 - weightLbs / 8)) : 8.0,
    geometryScore: 8.2,
    pros: features.slice(0, 3),
    cons: [],
    customers_say: customersSay,
    customersSay,
    Product_Description: productDescription,
    Product_Specifications: productSpecifications,
    Category_Attributes: categoryAttributes,
    Product_Display_Fields: displayFields,
    rating: { value: ratingValue, display: String(item?.Rating || "").trim() },
    reviews: { count: reviewCount, display: String(item?.Reviews || "").trim() },
    userRating: ratingValue,
    reviewCount,
    editorVerdict: customersSay || `${brand} ${name}`,
    updatedAt: now,
    zh: {
      name,
      description: productDescription || `${brand} ${name}`,
      customersSay,
      brandText: brand,
      specsText: "",
      Product_Specifications: productSpecifications,
      pros: features.slice(0, 3),
      cons: [],
      editorVerdict: customersSay || `${brand} ${name}`,
    },
    en: {
      name,
      description: productDescription || `${brand} ${name}`,
      customersSay,
      brandText: brand,
      specsText: "",
      Product_Specifications: productSpecifications,
      pros: features.slice(0, 3),
      cons: [],
      editorVerdict: customersSay || `${brand} ${name}`,
    },
  };
}

function uniqueById(products) {
  const seen = new Set();
  const output = [];
  for (const item of products) {
    if (!item?.id || seen.has(item.id)) continue;
    seen.add(item.id);
    output.push(item);
  }
  return output;
}

async function requestJsonWithRetry(url, body, retries, timeoutMs, label) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timer);

      const text = await response.text();
      if (!response.ok) {
        const preview = text.slice(0, 180).replace(/\s+/g, " ");
        throw new Error(`${response.status} ${preview}`);
      }

      return;
    } catch (error) {
      clearTimeout(timer);
      if (attempt >= retries) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`${label}: ${message}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const base = normalizeBase(args.base);
  const inputPath = String(args.input || DEFAULT_INPUT).trim();
  const inferredCategoryId = inferCategoryId(inputPath);
  const categoryId = String(args.categoryId || inferredCategoryId).trim();

  if (!/^https?:\/\//i.test(base)) {
    throw new Error(`Invalid --base: ${base}`);
  }
  if (!inputPath) {
    throw new Error("Missing --input");
  }
  if (!categoryId) {
    throw new Error("Missing --categoryId and cannot infer from input filename (expected *_report.json)");
  }

  const raw = await fs.readFile(inputPath, "utf8");
  const parsed = JSON.parse(raw);
  const rows = Array.isArray(parsed) ? parsed : [];
  const mapped = rows
    .map((item) => toCmsProduct(item, categoryId))
    .filter((item) => Boolean(item));
  const products = uniqueById(mapped);

  console.log(`[cms-sync-category-report] base=${base}`);
  console.log(`[cms-sync-category-report] input=${inputPath}`);
  console.log(`[cms-sync-category-report] categoryId=${categoryId}`);
  console.log(`[cms-sync-category-report] apply=${args.apply}`);
  console.log(`[cms-sync-category-report] sourceRows=${rows.length}`);
  console.log(`[cms-sync-category-report] targetRows=${products.length}`);

  if (!args.apply) {
    console.log("[cms-sync-category-report] dry-run only, pass --apply to write");
    return;
  }

  let success = 0;
  const failures = [];

  for (let index = 0; index < products.length; index += 1) {
    const product = products[index];
    try {
      await requestJsonWithRetry(
        `${base}/api/cms/products/save`,
        product,
        Math.max(1, Number(args.retries || 4)),
        Math.max(1000, Number(args.timeoutMs || 15000)),
        `save ${product.id}`,
      );
      success += 1;
    } catch (error) {
      failures.push({ id: product.id, message: error instanceof Error ? error.message : String(error) });
    }

    console.log(`[cms-sync-category-report] progress ${index + 1}/${products.length} success=${success} failed=${failures.length}`);
  }

  console.log(`[cms-sync-category-report] completed success=${success} failed=${failures.length}`);
  if (failures.length > 0) {
    for (const failure of failures.slice(0, 20)) {
      console.log(`[cms-sync-category-report] failed ${failure.id}: ${failure.message}`);
    }
    process.exitCode = 2;
  }
}

main().catch((error) => {
  console.error(`[cms-sync-category-report] failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
