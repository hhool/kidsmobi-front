#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_INPUT = "backend/env/cms-export-1784063779.full.after-rerun.json";
const DEFAULT_REFERENCE = "env/cms-export-1784056120.before-full-reset.json";
const DEFAULT_OUTPUT = "env/cms-export-1784063779.converted.before-full-reset.json";

function parseArgs(argv) {
  const out = {
    input: DEFAULT_INPUT,
    reference: DEFAULT_REFERENCE,
    output: DEFAULT_OUTPUT,
    emptyTaxonomyCollections: true,
  };

  for (const arg of argv) {
    if (arg.startsWith("--input=")) out.input = arg.slice("--input=".length);
    else if (arg.startsWith("--reference=")) out.reference = arg.slice("--reference=".length);
    else if (arg.startsWith("--output=")) out.output = arg.slice("--output=".length);
    else if (arg === "--keep-taxonomy") out.emptyTaxonomyCollections = false;
  }

  return out;
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function dedupeStrings(items) {
  const set = new Set();
  const out = [];
  for (const item of items) {
    const text = String(item || "").trim();
    if (!text) continue;
    const key = text.toLowerCase();
    if (set.has(key)) continue;
    set.add(key);
    out.push(text);
  }
  return out;
}

function asText(value, fallback = "") {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || fallback;
  }
  return fallback;
}

function pickFirstText(...values) {
  for (const value of values) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) return trimmed;
    }
  }
  return "";
}

function pickFirstArray(...values) {
  for (const value of values) {
    if (Array.isArray(value) && value.length > 0) return value;
  }
  return [];
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeHeightRange(value, fallback = [0, 120]) {
  if (Array.isArray(value) && value.length >= 2) {
    const first = toNumber(value[0], fallback[0]);
    const second = toNumber(value[1], fallback[1]);
    return [first, second];
  }
  return [...fallback];
}

function mapCategoryCode(categoryId) {
  switch (categoryId) {
    case "balance_bike":
      return "balance";
    case "scooters":
      return "scooter";
    case "electric_vehicles":
      return "electric_car";
    case "kids_bikes":
      return "bicycle";
    case "kids_tricycles":
    case "kids_push_ride_ons":
    case "kids_pull_along_wagons":
      return "tricycle";
    case "car_seat":
      return "safety_seat";
    case "high_chair":
    case "playard":
    case "baby_carrier":
    case "stroller":
    case "double_stroller":
    case "jogger_stroller":
    default:
      return "stroller";
  }
}

function mapDefaultAgeRange(categoryId) {
  switch (categoryId) {
    case "balance_bike":
      return "18 months-5 years";
    case "scooters":
      return "2-8 years";
    case "electric_vehicles":
      return "3-8 years";
    case "kids_bikes":
      return "3-10 years";
    case "kids_tricycles":
    case "kids_push_ride_ons":
    case "kids_pull_along_wagons":
      return "1-5 years";
    case "car_seat":
      return "0-2 years";
    default:
      return "0-4 years";
  }
}

function mapDefaultHeightRange(categoryId) {
  switch (categoryId) {
    case "balance_bike":
      return [70, 115];
    case "scooters":
      return [80, 140];
    case "electric_vehicles":
      return [90, 145];
    case "kids_bikes":
      return [90, 155];
    case "kids_tricycles":
    case "kids_push_ride_ons":
    case "kids_pull_along_wagons":
      return [65, 120];
    case "car_seat":
      return [45, 90];
    default:
      return [0, 120];
  }
}

function inferCategoryId(product) {
  const current = asText(product?.categoryId);
  if (current) return current;

  const fromScenario = asText(toArray(product?.scenarios)[0]);
  if (fromScenario) return fromScenario;

  const fromCategory = asText(product?.category);
  if (fromCategory) return fromCategory;

  const fromId = asText(product?.id).split("-")[0];
  return fromId || "stroller";
}

function normalizeProducts(products) {
  const rows = toArray(products);
  return rows.map((product) => {
    const categoryId = inferCategoryId(product);
    const mappedCategory = mapCategoryCode(categoryId);

    const description = pickFirstText(
      product?.description,
      product?.zh?.description,
      product?.en?.description,
      product?.editorVerdict,
      product?.zh?.editorVerdict,
      product?.en?.editorVerdict,
    );

    const pros = pickFirstArray(product?.pros, product?.zh?.pros, product?.en?.pros);
    const cons = pickFirstArray(product?.cons, product?.zh?.cons, product?.en?.cons);
    const customersSay = pickFirstText(
      product?.customers_say,
      product?.customersSay,
      product?.zh?.customersSay,
      product?.en?.customersSay,
      product?.zh?.editorVerdict,
      product?.en?.editorVerdict,
    );

    const overallScore = toNumber(product?.overallScore, 0);
    const safetyScore = toNumber(product?.safetyScore, overallScore || 8.4);
    const weightScore = toNumber(product?.weightScore, overallScore || 8.2);
    const geometryScore = toNumber(product?.geometryScore, overallScore || 8.6);

    return {
      id: asText(product?.id),
      name: pickFirstText(product?.name, product?.zh?.name, product?.en?.name, asText(product?.id)),
      brand: pickFirstText(product?.brand, product?.zh?.brandText, product?.en?.brandText, "Unknown"),
      category: mappedCategory,
      categoryId,
      wheelSize: asText(product?.wheelSize, "N/A"),
      weight: toNumber(product?.weight, 0),
      material: asText(product?.material, "N/A"),
      brakeType: asText(product?.brakeType, "N/A"),
      tireType: asText(product?.tireType, "N/A"),
      price: toNumber(product?.price, 0),
      ageRange: asText(product?.ageRange, mapDefaultAgeRange(categoryId)),
      heightRange: normalizeHeightRange(product?.heightRange, mapDefaultHeightRange(categoryId)),
      compliance: dedupeStrings(toArray(product?.compliance)),
      safetyCertification: dedupeStrings(
        pickFirstArray(product?.safetyCertification, product?.compliance, product?.zh?.safetyCertification),
      ),
      imageUrl: asText(product?.imageUrl),
      galleryUrls: dedupeStrings(toArray(product?.galleryUrls)),
      videoUrl: asText(product?.videoUrl),
      videos: toArray(product?.videos),
      features: toArray(product?.features),
      description,
      pros: toArray(pros),
      cons: toArray(cons),
      scenarios: toArray(product?.scenarios),
      relatedProductIds: toArray(product?.relatedProductIds),
      status: asText(product?.status, "published"),
      safetyScore,
      weightScore,
      geometryScore,
      overallScore,
      editorVerdict: pickFirstText(product?.editorVerdict, product?.zh?.editorVerdict, product?.en?.editorVerdict, description),
      scrapedEvidence: toArray(product?.scrapedEvidence),
      scoringStandards: toArray(product?.scoringStandards),
      customers_say: customersSay,
      zh: product?.zh || {},
      en: product?.en || {},
      seo: product?.seo || {},
      updatedAt: asText(product?.updatedAt),
    };
  }).filter((row) => row.id);
}

function mergeSettings(referenceSetting, sourceSetting) {
  const ref = referenceSetting && typeof referenceSetting === "object" ? referenceSetting : {};
  const src = sourceSetting && typeof sourceSetting === "object" ? sourceSetting : {};

  return {
    id: asText(src.id, asText(ref.id, "global")),
    opsCenter: ref.opsCenter || {},
    updatedAt: asText(src.updatedAt, asText(ref.updatedAt)),
    hero: src.hero || ref.hero || {},
    seo: ref.seo || {},
    homeSlots: Array.isArray(src.homeSlots) ? src.homeSlots : (Array.isArray(ref.homeSlots) ? ref.homeSlots : []),
  };
}

function buildOutput(source, reference, emptyTaxonomyCollections) {
  const srcCollections = source?.data?.collections || {};
  const refCollections = reference?.data?.collections || {};

  const products = normalizeProducts(srcCollections.products);
  const settings = [mergeSettings(toArray(refCollections.settings)[0], toArray(srcCollections.settings)[0])];

  return {
    data: {
      meta: {
        ...(source?.data?.meta || {}),
        convertedAt: new Date().toISOString(),
        convertedFrom: "full.after-rerun",
        convertedTo: "before-full-reset-semantics",
      },
      collections: {
        products,
        categories: emptyTaxonomyCollections ? [] : toArray(srcCollections.categories),
        scenarios: emptyTaxonomyCollections ? [] : toArray(srcCollections.scenarios),
        evaluations: toArray(srcCollections.evaluations),
        guides: toArray(srcCollections.guides),
        news: toArray(srcCollections.news),
        pages: [],
        settings,
      },
    },
  };
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cwd = process.cwd();
  const inputPath = path.resolve(cwd, args.input);
  const referencePath = path.resolve(cwd, args.reference);
  const outputPath = path.resolve(cwd, args.output);

  const sourceJson = await readJson(inputPath);
  const referenceJson = await readJson(referencePath);
  const outputJson = buildOutput(sourceJson, referenceJson, args.emptyTaxonomyCollections);

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(outputJson, null, 2)}\n`, "utf8");

  const collections = outputJson?.data?.collections || {};
  const summary = Object.fromEntries(
    Object.entries(collections).map(([name, rows]) => [name, Array.isArray(rows) ? rows.length : 0]),
  );

  console.log("[cms-convert-before-reset] input=", inputPath);
  console.log("[cms-convert-before-reset] reference=", referencePath);
  console.log("[cms-convert-before-reset] output=", outputPath);
  console.log("[cms-convert-before-reset] emptyTaxonomyCollections=", args.emptyTaxonomyCollections);
  console.log("[cms-convert-before-reset] counts=", JSON.stringify(summary));
}

main().catch((error) => {
  console.error("[cms-convert-before-reset] failed:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
