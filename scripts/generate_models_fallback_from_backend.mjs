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
};

const EXCLUDED_CATEGORY_KEYS = new Set(["kids_push_ride_ons", "kids_pull_along_wagons"]);

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

function cleanEvidenceText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/^Parent's Tip:\s*/i, "")
    .trim();
}

function truncateEvidence(value, max = 180) {
  const text = cleanEvidenceText(value);
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trim()}...`;
}

function pushEvidence(out, source, text) {
  const evidenceText = truncateEvidence(text);
  if (!evidenceText) return;
  const sourceText = String(source || "Scraped content").trim();
  const key = `${sourceText}:${evidenceText}`.toLowerCase();
  if (out.some((item) => `${item.source}:${item.text}`.toLowerCase() === key)) return;
  out.push({ source: sourceText, text: evidenceText });
}

function collectScrapedEvidence(report) {
  const out = [];
  for (const item of report?.Expert_Review_Inputs?.evidenceHighlights || []) {
    pushEvidence(out, item.source, item.text);
  }
  const features = String(report?.Features || "").split("|").map((item) => item.trim()).filter(Boolean);
  features.forEach((text, index) => pushEvidence(out, `Features[${index + 1}]`, text));
  pushEvidence(out, "Product_Description", report?.Product_Description);
  for (const standard of Object.values(report?.Scoring_Standards_Logic || {})) {
    for (const item of standard?.evidence || []) {
      pushEvidence(out, item.source, item.text);
    }
  }
  for (const [key, field] of Object.entries(report?.Product_Display_Fields || {})) {
    if (field?.value) pushEvidence(out, field.source || `Product_Display_Fields.${key}`, `${key}: ${field.value}`);
  }
  return out;
}

function formatEvidenceLine(item) {
  return `${item.text} (${item.source})`;
}

function buildEvidencePros(evidence) {
  const preferred = evidence.filter((item) => /feature|description|comfort|safety|harness|fold|storage|battery|seat|wheel|suspension|brake/i.test(`${item.source} ${item.text}`));
  return [...preferred, ...evidence].slice(0, 4).map(formatEvidenceLine);
}

function buildEvidenceCons(report, evidence) {
  const cautionSignals = evidence.filter((item) => /\bno\b|not|without|weight|heavy|capacity|warranty|folded|battery|assembly|brake|harness|height|limit/i.test(`${item.source} ${item.text}`));
  const displayChecks = Object.entries(report?.Product_Display_Fields || {}).map(([key, field]) => ({
    source: String(field?.source || `Product_Display_Fields.${key}`),
    text: truncateEvidence(`${key}: ${field?.value || "Confirm from source"}`),
  }));
  const out = [];
  for (const item of [...cautionSignals, ...displayChecks, ...evidence]) {
    const line = formatEvidenceLine(item);
    if (!out.includes(line)) out.push(line);
    if (out.length >= 4) break;
  }
  return out;
}

function filterEvidenceForScoring(rawKey, evidence) {
  const keywordMap = {
    safetyFirst: /safe|safety|secure|harness|brake|lock|cert|protect|limit|capacity|weight recommendation|weight capacity|seat belt|isofix/i,
    ridingComfort: /comfort|padded|seat|cushion|suspension|shock|smooth|adjustable|recline|ergonomic|wheel|tire/i,
    lightAndEasy: /light|weight|fold|portable|carry|storage|compact|assembly|easy|install|height|adjustable/i,
  };
  const matcher = keywordMap[rawKey];
  const matched = matcher ? evidence.filter((item) => matcher.test(`${item.source} ${item.text}`)) : [];
  const out = [];
  for (const item of [...matched, ...evidence]) {
    const key = `${item.source}:${item.text}`;
    if (!out.some((candidate) => `${candidate.source}:${candidate.text}` === key)) out.push(item);
    if (out.length >= 4) break;
  }
  return out;
}

function buildScoringStandards(report, evidence) {
  const logic = report?.Scoring_Standards_Logic || {};
  return [
    ["safetyFirst", "safety", "Safety First"],
    ["ridingComfort", "comfort", "Riding Comfort"],
    ["lightAndEasy", "portability", "Light & Easy"],
  ].map(([rawKey, key, fallbackLabel]) => {
    const item = logic[rawKey] || {};
    const itemEvidence = [];
    for (const evidenceItem of item.evidence || []) {
      pushEvidence(itemEvidence, evidenceItem.source, evidenceItem.text);
    }
    const resolvedEvidence = itemEvidence.length > 0 ? itemEvidence.slice(0, 4) : filterEvidenceForScoring(rawKey, evidence);
    return {
      key,
      label: String(item.label || fallbackLabel),
      parentTip: truncateEvidence(item.parentTip || report?.Parent_Tips?.[rawKey] || resolvedEvidence[0]?.text || "Derived from scraped product metadata."),
      evidence: resolvedEvidence,
    };
  });
}

function buildEditorVerdict(report, evidence) {
  const highlights = evidence.slice(0, 3).map((item) => item.text).filter(Boolean);
  if (highlights.length > 0) return `${highlights.join(" ")}`;
  return truncateEvidence(report?.Product_Description || report?.Features || "");
}

function encodeUrlPathSegment(value) {
  return encodeURIComponent(String(value || "")).replace(/%2F/g, "/");
}

async function buildMirrorImageIndex() {
  const index = new Map();
  const assetsRoot = path.join(repoRoot, "backend", "assets");
  const categoryDirs = await fs.readdir(assetsRoot, { withFileTypes: true }).catch(() => []);

  for (const categoryEntry of categoryDirs) {
    if (!categoryEntry.isDirectory()) continue;
    const categoryKey = categoryEntry.name;
    if (EXCLUDED_CATEGORY_KEYS.has(categoryKey)) continue;
    const categoryPath = path.join(assetsRoot, categoryKey);
    const brandDirs = await fs.readdir(categoryPath, { withFileTypes: true }).catch(() => []);
    const asinMap = new Map();

    for (const brandDir of brandDirs) {
      if (!brandDir.isDirectory()) continue;
      const brandPath = path.join(categoryPath, brandDir.name);
      const rankDirs = await fs.readdir(brandPath, { withFileTypes: true }).catch(() => []);

      for (const rankDir of rankDirs) {
        if (!rankDir.isDirectory()) continue;
        const dirName = rankDir.name;
        const asinMatch = dirName.match(/ASIN_([A-Z0-9]{10})/i);
        if (!asinMatch) continue;
        const asin = String(asinMatch[1] || "").toUpperCase();
        if (!asin) continue;

        const primaryLocalPath = path.join(brandPath, dirName, "images", "primary.jpg");
        try {
          await fs.access(primaryLocalPath);
        } catch {
          continue;
        }

        const existing = asinMap.get(asin);
        const isSimilar = dirName.toLowerCase().includes("rank_similar");
        if (!existing || (existing.isSimilar && !isSimilar)) {
          const encodedBrand = encodeUrlPathSegment(brandDir.name);
          const encodedDir = encodeUrlPathSegment(dirName);
          asinMap.set(asin, {
            isSimilar,
            url: `https://store.poki2.online/${encodeUrlPathSegment(categoryKey)}/${encodedBrand}/${encodedDir}/images/primary.jpg`,
          });
        }
      }
    }

    index.set(categoryKey, asinMap);
  }

  return index;
}

async function gatherProducts() {
  const mirrorImageIndex = await buildMirrorImageIndex();
  const entries = await fs.readdir(dataRoot, { withFileTypes: true });
  const products = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const categoryKey = entry.name;
    if (EXCLUDED_CATEGORY_KEYS.has(categoryKey)) continue;
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
      const asin = asText(row?.ASIN);
      const listingImageUrl = asText(report?.Listing_Image_URL);
      const mirrorImageUrl = mirrorImageIndex.get(categoryKey)?.get(asin.toUpperCase())?.url || "";
      const imageUrl = mirrorImageUrl || listingImageUrl;
      const videos = Array.isArray(report?.Product_Videos) ? report.Product_Videos.map(asText).filter(Boolean).slice(0, 3) : [];
      const price = toNumber(row?.Price_Value, 0);
      const weight = toNumber(row?.Weight_Lbs, 0);
      const scores = scoreBySignals(row?.Rank, report?.Rating || report?.Reviews || "", weight);
      const ageRange = asText(classification.User_Age) || config.ageRange;
      const features = buildFeatureList(row);
      const scrapedEvidence = collectScrapedEvidence(report);
      const pros = buildEvidencePros(scrapedEvidence);
      const cons = buildEvidenceCons(report, scrapedEvidence);
      const scoringStandards = buildScoringStandards(report, scrapedEvidence);

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
        description: asText(report?.Product_Description || report?.Features),
        pros,
        cons,
        scenarios: [config.categoryId],
        relatedProductIds: [],
        status: "published",
        ...scores,
        editorVerdict: buildEditorVerdict(report, scrapedEvidence),
        scrapedEvidence: scrapedEvidence.slice(0, 8),
        scoringStandards,
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
