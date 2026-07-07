#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");
const dataRoot = path.join(repoRoot, "backend", "scrape_store");
const outFile = path.join(repoRoot, "front", "src", "data", "modelsData.ts");

const CATEGORY_MAP = {
  stroller: { category: "stroller", categoryId: "stroller", ageRange: "0-4 years", heightRange: [50, 110], compliance: ["EN1888"] },
  double_stroller: { category: "stroller", categoryId: "double_stroller", ageRange: "0-4 years", heightRange: [50, 110], compliance: ["EN1888"] },
  jogger_stroller: { category: "stroller", categoryId: "jogger_stroller", ageRange: "0-4 years", heightRange: [50, 110], compliance: ["EN1888"] },
  balance_bike: { category: "balance", categoryId: "balance_bike", ageRange: "1-5 years", heightRange: [70, 120], compliance: ["ASTM F963", "CPSC"] },
  kids_bikes: { category: "bicycle", categoryId: "kids_bikes", ageRange: "3-12 years", heightRange: [90, 155], compliance: ["CPSC"] },
  kids_tricycles: { category: "tricycle", categoryId: "kids_tricycles", ageRange: "1-6 years", heightRange: [70, 130], compliance: ["ASTM F963"] },
  scooters: { category: "scooter", categoryId: "kids_scooters", ageRange: "2-12 years", heightRange: [80, 140], compliance: ["ASTM F963", "CPSC"] },
  electric_vehicles: { category: "electric_car", categoryId: "electric_vehicles", ageRange: "3-10 years", heightRange: [90, 150], compliance: ["ASTM F963", "CPSC"] },
  car_seat: { category: "safety_seat", categoryId: "car_seat", ageRange: "0-8 years", heightRange: [45, 135], compliance: ["CPC", "CE"] },
  baby_carrier: { category: "stroller", categoryId: "baby_carrier", ageRange: "0-2 years", heightRange: [45, 95], compliance: ["CE"] },
  high_chair: { category: "stroller", categoryId: "high_chair", ageRange: "0-4 years", heightRange: [45, 105], compliance: ["CE"] },
  playard: { category: "stroller", categoryId: "playard", ageRange: "0-3 years", heightRange: [45, 100], compliance: ["CE"] },
  kids_push_ride_ons: { category: "electric_car", categoryId: "kids_push_ride_ons", ageRange: "1-5 years", heightRange: [70, 120], compliance: ["ASTM F963"] },
  kids_pull_along_wagons: { category: "stroller", categoryId: "kids_pull_along_wagons", ageRange: "1-8 years", heightRange: [70, 140], compliance: ["ASTM F963"] },
};

const MATERIAL_PATTERNS = [
  [/carbon|碳/, "Carbon Fiber"],
  [/aluminum|aluminium|铝/, "Aluminum"],
  [/steel|stainless|碳钢|钢/, "Steel"],
  [/magnesium|镁/, "Magnesium Alloy"],
  [/plastic|pp\b|abs\b|树脂|塑料/, "Engineering Plastic"],
  [/wood|木/, "Wood"],
];

const TIRE_PATTERNS = [
  [/pneumatic|air[- ]?filled|inflatable|充气/, "Pneumatic"],
  [/honeycomb/, "Honeycomb Solid"],
  [/eva/, "EVA Solid"],
  [/pu\b|polyurethane/, "PU"],
  [/rubber|橡胶/, "Rubber"],
  [/solid/, "Solid"],
];

const BRAKE_PATTERNS = [
  [/disc brake|碟刹/, "Disc Brake"],
  [/hand brake|手刹/, "Hand Brake"],
  [/coaster|倒刹/, "Coaster Brake"],
  [/foot brake|脚刹|rear fender brake/, "Foot Brake"],
  [/electronic brake|e-?brake/, "Electronic Brake"],
  [/5[- ]?point|5 point/, "5-Point Harness"],
  [/3[- ]?point|3 point/, "3-Point Harness"],
];

function asText(value) {
  return String(value || "").trim();
}

function slugify(input) {
  return asText(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function truncateText(value, max = 110) {
  const text = asText(value);
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}...`;
}

function matchPattern(texts, patterns, fallback = "N/A") {
  const merged = texts.filter(Boolean).join(" ").toLowerCase();
  for (const [pattern, value] of patterns) {
    if (pattern.test(merged)) return value;
  }
  return fallback;
}

function parseWheelSize(title, classification, categoryAttrs) {
  const explicit = [
    classification.Wheel_Size,
    classification.Wheel_Diameter,
    categoryAttrs?.wheelSize?.[0],
  ]
    .map(asText)
    .find((value) => value && value.toLowerCase() !== "unknown" && value.toLowerCase() !== "n/a");
  if (explicit) return explicit;

  const inchMatch = asText(title).match(/(\d{1,2}(?:\.\d+)?)\s*(?:inch|inches|\")/i);
  if (inchMatch) return `${inchMatch[1]} in`;

  const wheelConfig = asText(classification.Wheel_Configuration);
  if (/^\d$/.test(wheelConfig)) return `${wheelConfig}-wheel`;
  return "N/A";
}

function normalizeCompliance(values, defaults) {
  const out = [];
  const raw = asText(values);
  if (raw) {
    for (const item of raw.split(/[+,/|;]/)) {
      const token = asText(item);
      if (token && token.toLowerCase() !== "unknown" && !out.includes(token)) {
        out.push(token);
      }
    }
  }
  for (const item of defaults || []) {
    if (!out.includes(item)) out.push(item);
  }
  return out.slice(0, 5);
}

function scoreBySignals(rankRaw, ratingRaw, weightLbs) {
  const rank = toNumber(String(rankRaw).replace(/[^0-9.]/g, ""), 10);
  const rating = toNumber(String(ratingRaw).replace(/[^0-9.]/g, ""), 4.2);
  const safetyScore = Math.max(7.2, Math.min(9.9, rating * 1.9));
  const weightScore = weightLbs > 0 ? Math.max(6.6, Math.min(10, 10 - weightLbs / 8)) : 8.0;
  const geometryScore = Math.max(7.0, Math.min(9.8, 9.6 - (rank - 1) * 0.08));
  return {
    safetyScore: Number(safetyScore.toFixed(1)),
    weightScore: Number(weightScore.toFixed(1)),
    geometryScore: Number(geometryScore.toFixed(1)),
    overallScore: Number(((safetyScore + weightScore + geometryScore) / 3).toFixed(1)),
  };
}

async function readJson(filePath, fallback = []) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function buildFeatureList(row) {
  const cards = Array.isArray(row?.Feature_Cards) ? row.Feature_Cards : [];
  const list = cards
    .map((card) => asText(card?.featureLabel || card?.featureValue))
    .filter(Boolean)
    .slice(0, 4);
  if (list.length > 0) return list;

  const fallback = [
    asText(row?.Classification?.Bike_Type),
    asText(row?.Classification?.Scooter_Type),
    asText(row?.Classification?.Price_Tier),
    asText(row?.Classification?.Weight_Class),
  ].filter((item) => item && item.toLowerCase() !== "unknown");
  return fallback.slice(0, 4);
}

async function gatherProducts() {
  const entries = await fs.readdir(dataRoot, { withFileTypes: true });
  const products = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const categoryKey = entry.name;
    const categoryDir = path.join(dataRoot, categoryKey);
    const files = await fs.readdir(categoryDir);
    const classificationFile = files.find((name) => name.endsWith("_classification.json"));
    const reportFile = files.find((name) => name.endsWith("_report.json"));
    if (!classificationFile) continue;

    const config = CATEGORY_MAP[categoryKey] || {
      category: "stroller",
      categoryId: categoryKey,
      ageRange: "0-4 years",
      heightRange: [50, 120],
      compliance: ["CE"],
    };

    const rows = await readJson(path.join(categoryDir, classificationFile), []);
    const reports = reportFile ? await readJson(path.join(categoryDir, reportFile), []) : [];
    const reportByAsin = new Map(reports.map((item) => [asText(item?.ASIN), item]));

    for (const row of rows) {
      const classification = row?.Classification || {};
      const attrs = row?.Category_Attributes || {};
      const report = reportByAsin.get(asText(row?.ASIN)) || {};

      const title = truncateText(row?.Title || report?.Title || `${categoryKey} product`);
      const brand = asText(row?.Brand_Raw || classification.Brand || report?.Brand) || "Unknown";
      const textSignals = [
        title,
        asText(report?.Features),
        asText(classification.Bike_Type),
        asText(classification.Scooter_Type),
        ...((attrs?.features || []).map(asText).slice(0, 8)),
      ];

      const material = matchPattern([asText(classification.Frame_Material), ...textSignals], MATERIAL_PATTERNS, "N/A");
      const tireType = matchPattern([asText(classification.Tire_Type), ...textSignals], TIRE_PATTERNS, "N/A");
      const brakeType = matchPattern([asText(classification.Braking_System), asText(classification.Harness_Type), ...textSignals], BRAKE_PATTERNS, "N/A");
      const wheelSize = parseWheelSize(title, classification, attrs);

      const compliance = normalizeCompliance(classification.Certifications, config.compliance);
      const imageUrl = asText(report?.Listing_Image_URL);
      const videos = Array.isArray(report?.Product_Videos) ? report.Product_Videos.map(asText).filter(Boolean).slice(0, 3) : [];
      const price = toNumber(row?.Price_Value, 0);
      const weight = toNumber(row?.Weight_Lbs, 0);
      const scores = scoreBySignals(row?.Rank, report?.Rating || report?.Reviews || "", weight);
      const ageRange = asText(classification.User_Age) || config.ageRange;
      const features = buildFeatureList(row);
      const asin = asText(row?.ASIN);

      products.push({
        id: asin ? `${categoryKey}-${asin.toLowerCase()}` : `${categoryKey}-${slugify(title)}`,
        name: title,
        brand,
        category: config.category,
        categoryId: config.categoryId,
        wheelSize,
        weight,
        material,
        brakeType,
        tireType,
        price,
        ageRange,
        heightRange: config.heightRange,
        compliance,
        safetyCertification: compliance,
        imageUrl,
        galleryUrls: imageUrl ? [imageUrl] : [],
        videoUrl: videos[0] || "",
        videos: videos.map((url, index) => ({
          url,
          title: `video-${index + 1}`,
          source: "scraped",
          order: index,
        })),
        features,
        scenarios: [config.categoryId],
        relatedProductIds: [],
        status: "published",
        ...scores,
        editorVerdict: `${brand} ${title} is indexed from backend classification and used as a static fallback product.`,
      });
    }
  }

  const seen = new Set();
  const deduped = [];
  for (const product of products) {
    if (!product.id || seen.has(product.id)) continue;
    seen.add(product.id);
    deduped.push(product);
  }

  deduped.sort((a, b) => {
    const categoryDiff = String(a.categoryId || "").localeCompare(String(b.categoryId || ""));
    if (categoryDiff !== 0) return categoryDiff;
    return String(a.name || "").localeCompare(String(b.name || ""));
  });

  return deduped;
}

const products = await gatherProducts();
const content = `import { Product } from "../types";\n\nexport const productsData: Product[] = ${JSON.stringify(products, null, 2)};\n`;
await fs.writeFile(outFile, content, "utf8");

console.log(`Generated ${products.length} products into front/src/data/modelsData.ts`);
