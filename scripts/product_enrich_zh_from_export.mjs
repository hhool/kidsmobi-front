#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_GLOSSARY = path.join(SCRIPT_DIR, "config/product_zh_glossary.v1.json");
const TARGET_FIELDS = ["name", "cardTitle", "cardSummary", "description", "pros", "cons", "editorVerdict", "brandText", "specsText"];
const TITLE_VERSION = "v1";

const CATEGORY_ALIASES = {
  stroller: "stroller",
  strollers: "stroller",
  jogger_stroller: "stroller",
  double_stroller: "stroller",
  balance_bike: "balance_bike",
  balance: "balance_bike",
  kids_bikes: "kids_bikes",
  bicycle: "kids_bikes",
  bike: "kids_bikes",
  scooters: "scooters",
  kids_scooters: "scooters",
  scooter: "scooters",
  electric_vehicles: "electric_vehicles",
  electric_car: "electric_vehicles",
  car_seat: "car_seat",
  safety_seat: "car_seat",
  baby_carrier: "baby_carrier",
  high_chair: "high_chair",
  playard: "playard",
  kids_tricycles: "kids_tricycles",
  tricycle: "kids_tricycles",
  kids_push_ride_ons: "kids_push_ride_ons",
  kids_pull_along_wagons: "kids_pull_along_wagons",
};

const CATEGORY_LABELS_EN = {
  stroller: "Stroller",
  balance_bike: "Balance Bike",
  kids_bikes: "Kids Bike",
  scooters: "Kids Scooter",
  electric_vehicles: "Kids Electric Vehicle",
  car_seat: "Car Seat",
  baby_carrier: "Baby Carrier",
  high_chair: "High Chair",
  playard: "Playard",
  kids_tricycles: "Kids Tricycle",
  kids_push_ride_ons: "Push Ride-On",
  kids_pull_along_wagons: "Pull-Along Wagon",
  other: "Other",
};

const CATEGORY_OVERRIDE_RULES = [
  { categoryId: "stroller", test: /(stroller|pram|buggy|pushchair|travel system|jogging stroller|cargo stroller|umbrella stroller)/i },
  { categoryId: "car_seat", test: /(car\s*seat|infant\s*seat|booster\s*seat|convertible\s*seat|rear[- ]facing seat)/i },
  { categoryId: "baby_carrier", test: /(baby\s*carrier|carrier|wrap|sling|hip\s*seat)/i },
  { categoryId: "high_chair", test: /(high\s*chair|highchair|feeding\s*chair|booster\s*seat)/i },
  { categoryId: "playard", test: /(playard|play\s*yard|pack[' ]?n\s*play|nursery\s*center|crib|bassinet|mattress\s*protector|baby\s*swing|baby\s*swings|swings?\s*for\s*infants)/i },
  { categoryId: "kids_pull_along_wagons", test: /(wagon|pull[- ]along|pull\s*cart|pull\s*wagon)/i },
  { categoryId: "kids_tricycles", test: /(tricycle|trike|tri[- ]cycle)/i },
  { categoryId: "kids_bikes", test: /(pedal\s*bike|bmx|children'?s?\s*bike|kids?\s*bike|bike\s+and\s+ez-lift)/i },
  { categoryId: "balance_bike", test: /(balance\s*bike|toddler\s*bike|push\s*handle|6\s*in\s*1|5\s*in\s*1|4\s*in\s*1)/i },
  { categoryId: "electric_vehicles", test: /(ride[- ]on|electric|vehicle|battery|volt)/i },
];

const SUBCATEGORY_RULES = [
  { key: "jogging_stroller", categoryId: "stroller", en: "Jogging Stroller", zh: "慢跑推车", test: /(jogging|jogger|all[- ]terrain)/i },
  { key: "travel_stroller", categoryId: "stroller", en: "Travel Stroller", zh: "旅行推车", test: /(travel\s*stroller|travel|umbrella|compact|carry[- ]on|airplane|lightweight\s*stroller)/i },
  { key: "double_stroller", categoryId: "stroller", en: "Double Stroller", zh: "双人推车", test: /(double|twin|duo)/i },
  { key: "full_size_stroller", categoryId: "stroller", en: "Full-Size Stroller", zh: "全尺寸推车", test: /(full[- ]size|modular|pram|system)/i },
  { key: "toddler_balance_bike", categoryId: "balance_bike", en: "Toddler Balance Bike", zh: "幼儿平衡车", test: /(balance\s*bike|walker|12\s*inch)/i },
  { key: "kids_pedal_bike", categoryId: "kids_bikes", en: "Kids Pedal Bike", zh: "儿童脚踏自行车", test: /(kids?\s*bike|bicycle|pedal|bmx)/i },
  { key: "kids_kick_scooter", categoryId: "scooters", en: "Kids Kick Scooter", zh: "儿童滑板车", test: /(scooter|kick)/i },
  { key: "ride_on_car", categoryId: "electric_vehicles", en: "Ride-On Car", zh: "儿童骑乘车", test: /(ride[- ]on|electric|vehicle|battery|volt)/i },
  { key: "convertible_car_seat", categoryId: "car_seat", en: "Convertible Car Seat", zh: "可转换安全座椅", test: /(convertible|infant|booster|car\s*seat)/i },
  { key: "baby_carrier_wrap", categoryId: "baby_carrier", en: "Baby Carrier Wrap", zh: "婴儿背带", test: /(carrier|baby\s*carrier|wrap|sling|hip\s*seat)/i },
  { key: "portable_playard", categoryId: "playard", en: "Portable Playard", zh: "便携游戏床", test: /(playard|play\s*yard|pack[' ]?n\s*play|nursery\s*center)/i },
  { key: "convertible_high_chair", categoryId: "high_chair", en: "Convertible High Chair", zh: "可转换餐椅", test: /(high\s*chair|highchair|booster\s*seat|feeding\s*chair|2[- ]in[- ]1|3[- ]in[- ]1)/i },
  { key: "push_ride_on", categoryId: "kids_push_ride_ons", en: "Push Ride-On", zh: "推行骑乘玩具", test: /(push\s*handle|push\s*ride[- ]on|ride[- ]on\s*toy|walker|push\s*car)/i },
  { key: "pull_along_wagon", categoryId: "kids_pull_along_wagons", en: "Pull-Along Wagon", zh: "拖拉车", test: /(wagon|pull[- ]along|pull\s*cart|pull\s*wagon)/i },
  { key: "kids_trike", categoryId: "kids_tricycles", en: "Kids Tricycle", zh: "儿童三轮车", test: /(tricycle|trike|tri[- ]cycle)/i },
  { key: "kids_bike_6_in_1", categoryId: "kids_bikes", en: "Kids Bike", zh: "儿童自行车", test: /(6[- ]in[- ]1|5[- ]in[- ]1|4[- ]in[- ]1|kids?\s*bike|children'?s?\s*bike|pedal\s*bike)/i },
  { key: "cargo_stroller", categoryId: "stroller", en: "Cargo Stroller", zh: "货运推车", test: /(cargo\s*stroller|utility\s*stroller|wagon\s*stroller)/i },
  { key: "umbrella_stroller", categoryId: "stroller", en: "Umbrella Stroller", zh: "伞车", test: /(umbrella\s*stroller)/i },
  { key: "toy_ride_on", categoryId: "kids_push_ride_ons", en: "Toy Ride-On", zh: "骑乘玩具", test: /(wiggle\s*car|busy\s*buggy|roller\s*coaster|push\s*toy|ride[- ]on\s*toy|tractor\s*&\s*cart)/i },
  { key: "playpen_playard", categoryId: "playard", en: "Playpen Playard", zh: "围栏游戏床", test: /(playpen|play\s*pen|baby\s*playpen|playard|play\s*yard)/i },
  { key: "crib_playard", categoryId: "playard", en: "Crib Playard", zh: "婴儿床/游戏床", test: /(crib|bassinet|nursery\s*center|mattress\s*protector)/i },
  { key: "sport_balance_bike", categoryId: "balance_bike", en: "Balance Bike", zh: "平衡车", test: /(strider|balance\s*bike|toddler\s*bike|push\s*handle)/i },
  { key: "kids_cruiser_bike", categoryId: "kids_bikes", en: "Kids Cruiser Bike", zh: "儿童休闲自行车", test: /(cruiser|mountain\s*bike|retro\s*cruiser|girls?\s*bike|boys?\s*bike)/i },
];

const BRAND_TITLE_HINTS = [
  "Baby Trend",
  "BOB Gear",
  "Delta Children",
  "Mompush",
  "Chicco",
  "Graco",
  "Jeep",
  "ANPABO",
  "Retrospec",
  "SEREED",
  "Umatoll",
  "Gotrax",
  "JMMD",
  "KRIDDO",
  "Gamfeiny",
  "Infantino",
  "Momcozy",
  "Woom",
  "Strider",
  "Specialized",
  "Decathlon",
  "Doona",
  "Britax",
];

const GENERIC_BRAND_VALUES = new Set(["baby", "kids", "children", "unknown", "sponsored"]);

function parseArgs(argv) {
  const args = {
    input: "",
    output: "",
    report: "",
    glossary: DEFAULT_GLOSSARY,
    limit: 0,
    start: 1,
    count: 0,
    dryRun: false,
    force: false,
  };
  for (const arg of argv) {
    if (arg.startsWith("--input=")) args.input = arg.slice(8);
    else if (arg.startsWith("--output=")) args.output = arg.slice(9);
    else if (arg.startsWith("--report=")) args.report = arg.slice(9);
    else if (arg.startsWith("--glossary=")) args.glossary = arg.slice(11);
    else if (arg.startsWith("--limit=")) args.limit = Math.max(0, Number(arg.slice(8)) || 0);
    else if (arg.startsWith("--start=")) args.start = Math.max(1, Number(arg.slice(8)) || 1);
    else if (arg.startsWith("--count=")) args.count = Math.max(0, Number(arg.slice(8)) || 0);
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--force") args.force = true;
    else if (arg === "--help" || arg === "-h") args.help = true;
  }
  return args;
}

function printHelp() {
  console.log(`Usage: node scripts/product_enrich_zh_from_export.mjs --input=<cms-export.json> [options]\n\nOptions:\n  --output=<path>      Enriched CMS export (default: tmp/<input>.zh-enriched.json)\n  --report=<path>      Review report (default: tmp/<input>.zh-report.json)\n  --glossary=<path>    Versioned glossary JSON\n  --start=<n>          1-based start index for batch processing (default: 1)\n  --count=<n>          Number of products to process from --start\n  --limit=<n>          Backward-compatible alias when --start=1 (same as --count)\n  --dry-run            Do not write enriched export, only write report summary\n  --force              Replace existing non-placeholder Chinese copy\n  --help               Show this help\n`);
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function slug(text) {
  return normalizeText(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function containsCjk(value) {
  return /[\u3400-\u9fff]/.test(normalizeText(value));
}

function clone(value) {
  return structuredClone(value);
}

function unique(items) {
  return [...new Set(items.map(normalizeText).filter(Boolean))];
}

function trimText(value, maxLength) {
  const text = normalizeText(value);
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/[\s,，;；:：.!！?？|/-]+$/g, "").trim();
}

function firstSentence(value) {
  const text = normalizeText(value);
  if (!text) return "";
  const match = text.match(/^.*?[。！？!?]|^.*?\.(?:\s|$)/);
  return normalizeText(match?.[0] || text);
}

function categoryIdFor(product) {
  const raw = normalizeText(product.categoryId || product.Category_Attributes?.categoryId || product.category).toLowerCase();
  return CATEGORY_ALIASES[raw] || raw;
}

function baseCategoryIdFor(product) {
  return normalizeText(product.categoryId || product.Category_Attributes?.categoryId || product.category).toLowerCase();
}

function categoryLabel(product, glossary) {
  const categoryId = categoryIdFor(product);
  return glossary.categories[categoryId] || glossary.categories[normalizeText(product.category).toLowerCase()] || "儿童出行产品";
}

function categoryLabelEn(product) {
  const categoryId = categoryIdFor(product);
  return CATEGORY_LABELS_EN[categoryId] || "Kids Mobility Product";
}

function inferCategoryFromTitle(product, baseCategoryId, titleText) {
  const title = normalizeText(titleText || "");
  const base = normalizeText(baseCategoryId || "").toLowerCase();
  const lower = title.toLowerCase();

  const matchedOverride = CATEGORY_OVERRIDE_RULES.find((rule) => rule.test.test(lower));
  if (matchedOverride) {
    return matchedOverride.categoryId;
  }

  if (base === "stroller" && /stroller/i.test(title)) {
    return "stroller";
  }

  return CATEGORY_ALIASES[base] || base || "stroller";
}

function extractScenarioCandidates(product) {
  const scenarios = Array.isArray(product.scenarios) ? product.scenarios : [];
  const attrScenario = Array.isArray(product.Category_Attributes?.scenario)
    ? product.Category_Attributes.scenario
    : [];
  return unique([...scenarios, ...attrScenario]).map((item) => slug(item));
}

function rawTitleFor(product) {
  return normalizeText(product.source?.rawTitle || product.en?.name || product.name || product.zh?.name);
}

function cleanTitle(rawTitle, brand) {
  let text = normalizeText(rawTitle);
  if (!text) return text;
  const brandText = normalizeText(brand);
  if (brandText) {
    const escaped = brandText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    text = text.replace(new RegExp(`^(?:${escaped}\\s+){2,}`, "i"), `${brandText} `).trim();
  }
  text = text
    .replace(/\b(?:amazon\s+exclusive|gift(?:s)?\s+for\s+[^,;|]+|for\s+boys?\s+and\s+girls?|best\s+seller)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  const first = text.split(/[,;|]/)[0].trim();
  return first.length >= 12 ? first : text;
}

function findBrandHintFromTitle(rawTitle) {
  const title = normalizeText(rawTitle);
  if (!title) return "";
  const lower = title.toLowerCase();
  for (const brand of BRAND_TITLE_HINTS) {
    if (lower.includes(brand.toLowerCase())) return brand;
  }
  return "";
}

function resolveSourceBrand(product) {
  const candidates = [
    product.brand,
    product.en?.brandText,
    product.zh?.brandText,
    product.Category_Attributes?.Brand,
    product.Category_Attributes?.["Brand Name"],
    product.Product_Specifications?.Category_Attributes?.Brand,
    product.Product_Display_Fields?.brand?.value,
  ].map((value) => normalizeText(value)).filter(Boolean);

  let brand = candidates[0] || "";
  const brandLower = brand.toLowerCase();
  if (!brand || GENERIC_BRAND_VALUES.has(brandLower)) {
    const hinted = findBrandHintFromTitle(rawTitleFor(product));
    if (hinted) brand = hinted;
  }

  return brand || candidates.find((item) => !GENERIC_BRAND_VALUES.has(item.toLowerCase())) || "";
}

function inferSubcategory(product, categoryId, titleText, glossary) {
  const candidates = extractScenarioCandidates(product);
  const direct = candidates.find((item) => item && item !== "unknown");
  if (direct) {
    const mapped = glossary.subcategoryAliases?.[direct] || direct;
    const cfg = glossary.subcategories?.[mapped];
    if (cfg) return { key: mapped, zh: cfg.zh, en: cfg.en, source: "scenario" };
  }

  const scopedRules = SUBCATEGORY_RULES.filter((item) => item.categoryId === categoryId);
  const rule = scopedRules.find((item) => item.test.test(titleText));
  if (rule) return { key: rule.key, zh: rule.zh, en: rule.en, source: "title-rule" };

  if (categoryId === "stroller" && /stroller/i.test(titleText)) {
    return { key: "full_size_stroller", zh: "全尺寸推车", en: "Full-Size Stroller", source: "title-default" };
  }

  const fallbackKey = "other";
  return {
    key: fallbackKey,
    zh: glossary.subcategories?.[fallbackKey]?.zh || "其他",
    en: glossary.subcategories?.[fallbackKey]?.en || "Other",
    source: "other",
  };
}

function buildTaxonomy(product, glossary) {
  const baseCategoryId = categoryIdFor(product);
  const titleText = cleanTitle(rawTitleFor(product), product.brand || product.en?.brandText || product.zh?.brandText);
  const categoryId = inferCategoryFromTitle(product, baseCategoryId, titleText);
  const displayCategoryZh = glossary.categories[categoryId] || categoryLabel(product, glossary);
  const displayCategoryEn = CATEGORY_LABELS_EN[categoryId] || categoryLabelEn(product);
  const subcategory = inferSubcategory(product, categoryId, titleText, glossary);
  const isOther = subcategory.source === "other";
  return {
    baseCategoryId,
    categoryId: isOther ? "other" : categoryId,
    subcategoryId: subcategory.key,
    displayCategoryZh: isOther ? (glossary.categories.other || "其他") : displayCategoryZh,
    displaySubcategoryZh: subcategory.zh,
    displayCategoryEn: isOther ? (CATEGORY_LABELS_EN.other || "Other") : displayCategoryEn,
    displaySubcategoryEn: subcategory.en,
    source: subcategory.source,
    systemUse: !isOther,
  };
}

function isPlaceholder(value, glossary) {
  const text = normalizeText(value).toLowerCase();
  return !text || glossary.placeholders.some((item) => text.includes(String(item).toLowerCase()));
}

function isEnglishMirror(zhValue, sourceValue) {
  const zh = normalizeText(zhValue).toLowerCase();
  const source = normalizeText(sourceValue).toLowerCase();
  return Boolean(zh && source && zh === source && !containsCjk(zhValue));
}

function shouldReplace(current, source, glossary, force) {
  if (force) return true;
  if (Array.isArray(current)) {
    return current.length === 0 || current.every((item) => !containsCjk(item));
  }
  return isPlaceholder(current, glossary) || isEnglishMirror(current, source) || !containsCjk(current);
}

function extractModel(product) {
  const brand = normalizeText(product.brand || product.en?.brandText || product.zh?.brandText);
  let text = normalizeText(product.en?.name || product.name || product.zh?.name);
  if (brand && text.toLowerCase().startsWith(brand.toLowerCase())) text = text.slice(brand.length).trim();
  text = text.split(/[,;|]|\s[-–—]\s/)[0].trim();
  const categoryNoise = /\b(?:kids?|children|toddler|baby|infant|jogging|jogger|travel|double|foldable|folding|stroller|balance|bike|bicycle|scooter|tricycle|electric|vehicle|car|seat|carrier|high chair|playard|walker)\b/gi;
  const stopWords = new Set(["and", "with", "for", "of", "the", "year", "years", "old", "mode", "inch", "inches"]);
  const tokens = text
    .replace(categoryNoise, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((token) => token.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9-]+$/g, ""))
    .filter((token) => token && !stopWords.has(token.toLowerCase()))
    .filter((token) => /[A-Za-z]/.test(token) && (/[0-9]/.test(token) || /^[A-Z][A-Za-z0-9-]*$/.test(token)));
  return trimText(tokens.slice(0, 3).join(" "), 42);
}

function buildDisplayName(product, glossary) {
  const brand = resolveSourceBrand(product);
  const model = extractModel(product);
  return normalizeText(`${brand} ${model} ${categoryLabel(product, glossary)}`);
}

function termMatches(product, glossary) {
  const source = [
    product.name,
    product.description,
    product.Product_Description,
    ...(Array.isArray(product.features) ? product.features : []),
    ...(Array.isArray(product.pros) ? product.pros : []),
    ...(Array.isArray(product.en?.pros) ? product.en.pros : []),
  ].join(" ");
  const matches = [];
  for (const item of glossary.terms) {
    if (new RegExp(item.pattern, "i").test(source)) matches.push(item.zh);
  }
  return unique(matches).slice(0, 5);
}

function signalFromTerm(item) {
  const key = normalizeText(item.key) || slug(item.zh) || slug(item.en) || "feature_signal";
  return {
    key,
    zh: normalizeText(item.zh) || key,
    en: normalizeText(item.en) || normalizeText(item.zh) || key,
    confidence: Number(item.confidence) || 0.85,
  };
}

function buildFeatureSignals(product, glossary, cleanedTitle) {
  const titleText = normalizeText(cleanedTitle).toLowerCase();
  const specText = [product.specsText, product.en?.specsText, product.Product_Description, product.description]
    .map((value) => normalizeText(value).toLowerCase())
    .join(" ");
  const sourceTexts = [
    ...(Array.isArray(product.features) ? product.features : []),
    ...(Array.isArray(product.pros) ? product.pros : []),
    ...(Array.isArray(product.en?.pros) ? product.en.pros : []),
  ]
    .map((value) => normalizeText(value).toLowerCase())
    .join(" ");

  const signals = [];
  for (const term of glossary.terms || []) {
    const regex = new RegExp(term.pattern, "i");
    const hitTitle = regex.test(titleText);
    const hitSpec = regex.test(specText);
    const hitSource = regex.test(sourceTexts);
    if (!hitTitle && !hitSpec && !hitSource) continue;
    const normalized = signalFromTerm(term);
    const source = hitTitle ? "title" : hitSpec ? "spec" : "feature";
    const confidence = hitTitle ? Math.max(0.9, normalized.confidence) : normalized.confidence;
    signals.push({ key: normalized.key, labelZh: normalized.zh, labelEn: normalized.en, source, confidence });
  }

  return unique(signals.map((item) => `${item.key}|${item.labelZh}|${item.labelEn}|${item.source}|${item.confidence}`))
    .map((entry) => {
      const [key, labelZh, labelEn, source, confidence] = entry.split("|");
      return { key, labelZh, labelEn, source, confidence: Number(confidence) };
    })
    .slice(0, 8);
}

function hasUsableFeatures(features) {
  if (!Array.isArray(features) || features.length === 0) return false;
  const cleaned = features.map((item) => normalizeText(item)).filter(Boolean);
  if (cleaned.length === 0) return false;
  const avgLen = cleaned.reduce((sum, item) => sum + item.length, 0) / cleaned.length;
  return avgLen <= 56;
}

function translateSpecPart(part, glossary) {
  let text = normalizeText(part);
  for (const item of glossary.specTerms) text = text.replace(new RegExp(item.pattern, "gi"), item.zh);
  return normalizeText(text);
}

function buildSpecsText(product, glossary) {
  const raw = normalizeText(product.en?.specsText || product.specsText);
  const translated = unique(raw.split("|").map((part) => translateSpecPart(part, glossary)).filter((part) => part && !/^unknown|n\/a$/i.test(part)));
  const certifications = unique([...(product.compliance || []), ...(product.safetyCertification || [])]);
  return unique([...translated, ...certifications]).join(" | ");
}

function buildDescription(product, glossary, name, features) {
  const specs = buildSpecsText(product, glossary);
  const featureText = features.length ? `已记录的主要配置包括${features.slice(0, 3).join("、")}。` : "具体配置请以产品规格与适用范围为准。";
  const specText = specs ? `规格信息：${specs}。` : "";
  return trimText(`${name}，适用于相应年龄和使用场景。${featureText}${specText}`, 260);
}

function buildCardSummary(name, features) {
  if (features.length === 0) return `${name}，具体配置与适用范围请查看产品详情。`;
  return trimText(`${name}，主要配置包括${features.slice(0, 3).join("、")}。`, 120);
}

function buildPros(features) {
  return features.slice(0, 3).map((feature) => `配备${feature}，便于结合实际使用场景评估。`);
}

function buildCons(product) {
  const items = [];
  if (!normalizeText(product.wheelSize) || /unknown|n\/a/i.test(normalizeText(product.wheelSize))) items.push("轮径信息不完整，购买前需核对尺寸。 ");
  if (!normalizeText(product.weight) || Number(product.weight) <= 0) items.push("产品重量信息不完整，便携性需进一步确认。 ");
  if (!Array.isArray(product.compliance) || product.compliance.length === 0) items.push("认证信息未完整列出，购买前需核对适用标准。 ");
  return items.map(normalizeText).slice(0, 3);
}

function buildVerdict(product, name, features) {
  const score = Number(product.overallScore || 0);
  const scoreText = score > 0 ? `现有结构化评分为 ${score.toFixed(1)} 分。` : "";
  const featureText = features.length ? `重点可核对${features.slice(0, 2).join("与")}。` : "";
  return trimText(`${name}的资料适合用于初步筛选。${scoreText}${featureText}购买前仍应结合儿童年龄、身高、实际尺寸和使用环境确认适配性。`, 260);
}

function enrichProduct(product, glossary, force) {
  const sourceZh = product.zh && typeof product.zh === "object" ? product.zh : {};
  const zh = { ...sourceZh };
  const rawTitle = rawTitleFor(product);
  const sourceBrand = resolveSourceBrand(product);
  const cleanedTitle = cleanTitle(rawTitle, sourceBrand || product.brand || product.en?.brandText || sourceZh.brandText);
  const taxonomy = buildTaxonomy(product, glossary);
  const featureSignals = buildFeatureSignals(product, glossary, cleanedTitle);
  const derivedFeaturesZh = featureSignals.map((item) => item.labelZh).filter(Boolean);
  const derivedFeaturesEn = featureSignals.map((item) => item.labelEn).filter(Boolean);
  const shouldReplaceFeatures = force || !hasUsableFeatures(product.features);

  const name = buildDisplayName(product, glossary);
  const features = derivedFeaturesZh.length > 0 ? derivedFeaturesZh : termMatches(product, glossary);
  const generated = {
    name,
    cardTitle: trimText(name, 56),
    cardSummary: firstSentence(buildCardSummary(name, features)),
    description: buildDescription(product, glossary, name, features),
    pros: buildPros(features),
    cons: buildCons(product),
    editorVerdict: buildVerdict(product, name, features),
    // Preserve source brand text exactly; never translate brand names.
    brandText: sourceBrand,
    specsText: buildSpecsText(product, glossary),
  };
  const diffs = [];
  for (const field of TARGET_FIELDS) {
    const source = product.en?.[field] ?? product[field];
    if (!shouldReplace(sourceZh[field], source, glossary, force)) continue;
    if (Array.isArray(generated[field]) && generated[field].length === 0 && Array.isArray(sourceZh[field]) && sourceZh[field].length > 0) continue;
    if (!Array.isArray(generated[field]) && !normalizeText(generated[field])) continue;
    if (JSON.stringify(sourceZh[field]) === JSON.stringify(generated[field])) continue;
    zh[field] = generated[field];
    diffs.push({ field, before: sourceZh[field] ?? null, after: generated[field] });
  }
  const enrichedProduct = {
    ...product,
    categoryId: taxonomy.categoryId,
    zh,
    taxonomy,
    source: {
      ...(product.source && typeof product.source === "object" ? product.source : {}),
      rawTitle,
      cleanedTitle,
      titleVersion: TITLE_VERSION,
      rawCategoryId: baseCategoryIdFor(product),
      rawCategory: normalizeText(product.category || ""),
    },
    featureSignals,
    subcategoryId: taxonomy.subcategoryId,
  };

  if (shouldReplaceFeatures && derivedFeaturesEn.length > 0) {
    enrichedProduct.features = derivedFeaturesEn;
  }

  return { product: enrichedProduct, diffs, features, taxonomy, featureSignals, featuresReplaced: shouldReplaceFeatures && derivedFeaturesEn.length > 0 };
}

function preservationFailures(before, after) {
  const failures = [];
  for (const key of ["id", "brand", "name", "category"]) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) failures.push(key);
  }
  return failures;
}

function fieldCoverage(products, field) {
  const filled = products.filter((product) => {
    const value = product.zh?.[field];
    return Array.isArray(value) ? value.length > 0 : Boolean(normalizeText(value));
  }).length;
  return { filled, total: products.length, percent: products.length ? Number((filled * 100 / products.length).toFixed(1)) : 0 };
}

function duplicateCopy(products, field) {
  const idsByText = new Map();
  for (const product of products) {
    const value = normalizeText(product.zh?.[field]);
    if (!value) continue;
    const ids = idsByText.get(value) || [];
    ids.push(product.id);
    idsByText.set(value, ids);
  }
  return [...idsByText.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([value, ids]) => ({ value, ids }));
}

function qualityIssues(products, glossary) {
  const placeholderResidue = [];
  const mixedLanguageNoise = [];
  const unknownSubcategory = [];
  for (const product of products) {
    const subcategoryId = normalizeText(product.taxonomy?.subcategoryId || product.subcategoryId).toLowerCase();
    if (!subcategoryId || subcategoryId.startsWith("unknown_")) {
      unknownSubcategory.push({ id: product.id, categoryId: categoryIdFor(product), subcategoryId: subcategoryId || "missing" });
    }
    for (const field of TARGET_FIELDS) {
      const raw = product.zh?.[field];
      const values = Array.isArray(raw) ? raw : [raw];
      for (const value of values) {
        const text = normalizeText(value);
        if (!text) continue;
        if (glossary.placeholders.some((item) => text.toLowerCase().includes(String(item).toLowerCase()))) {
          placeholderResidue.push({ id: product.id, field, value: text });
        }
        const latinWords = text.match(/[A-Za-z]{3,}/g) || [];
        if (containsCjk(text) && latinWords.length >= 5) mixedLanguageNoise.push({ id: product.id, field, value: text });
      }
    }
  }
  return { placeholderResidue, mixedLanguageNoise, unknownSubcategory };
}

function coreZhCompletenessIssues(products) {
  const missing = [];
  for (const product of products) {
    const zhName = normalizeText(product?.zh?.name);
    const zhDescription = normalizeText(product?.zh?.description);
    const zhVerdict = normalizeText(product?.zh?.editorVerdict);
    const reasons = [];
    if (!containsCjk(zhName)) reasons.push("missing-zh-name");
    if (!containsCjk(zhDescription)) reasons.push("missing-zh-description");
    if (!containsCjk(zhVerdict)) reasons.push("missing-zh-editorVerdict");
    if (reasons.length) {
      missing.push({ id: product.id, categoryId: categoryIdFor(product), reasons });
    }
  }
  return missing;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) return printHelp();
  if (!args.input) throw new Error("Missing required --input=<cms-export.json>");

  const inputPath = path.resolve(args.input);
  const baseName = path.basename(inputPath, path.extname(inputPath));
  const outputPath = path.resolve(args.output || path.join("tmp", `${baseName}.zh-enriched.json`));
  const reportPath = path.resolve(args.report || path.join("tmp", `${baseName}.zh-report.json`));
  const [exportRaw, glossaryRaw] = await Promise.all([fs.readFile(inputPath, "utf8"), fs.readFile(path.resolve(args.glossary), "utf8")]);
  const sourceExport = JSON.parse(exportRaw);
  const glossary = JSON.parse(glossaryRaw);
  const resultExport = clone(sourceExport);
  const sourceProducts = sourceExport?.data?.collections?.products;
  if (!Array.isArray(sourceProducts)) throw new Error("Invalid CMS export: missing data.collections.products");

  const outputProducts = resultExport.data.collections.products;
  const startIndex = Math.min(Math.max(0, args.start - 1), Math.max(0, sourceProducts.length - 1));
  const requestedCount = args.count > 0 ? args.count : args.limit;
  const processCount = requestedCount > 0
    ? Math.min(requestedCount, Math.max(0, sourceProducts.length - startIndex))
    : Math.max(0, sourceProducts.length - startIndex);
  const endExclusive = Math.min(sourceProducts.length, startIndex + processCount);
  const changes = [];
  const blocked = [];
  let taxonomyFilledCount = 0;
  let featureSignalProducts = 0;
  let topFeaturesReplacedCount = 0;
  let otherCount = 0;
  for (let index = startIndex; index < endExclusive; index += 1) {
    const before = sourceProducts[index];
    const enriched = enrichProduct(before, glossary, args.force);
    outputProducts[index] = enriched.product;
    if (normalizeText(enriched.product.taxonomy?.categoryId) && normalizeText(enriched.product.taxonomy?.subcategoryId)) {
      taxonomyFilledCount += 1;
    }
    if (enriched.product.taxonomy?.categoryId === "other" || enriched.product.taxonomy?.systemUse === false) {
      otherCount += 1;
    }
    if (Array.isArray(enriched.featureSignals) && enriched.featureSignals.length > 0) {
      featureSignalProducts += 1;
    }
    if (enriched.featuresReplaced) {
      topFeaturesReplacedCount += 1;
    }
    const preservation = preservationFailures(before, enriched.product);
    if (preservation.length) blocked.push({ id: before.id, reasons: preservation.map((key) => `source-field-changed:${key}`) });
    const expectedBrand = resolveSourceBrand(before);
    if (!normalizeText(enriched.product.zh?.brandText) || (expectedBrand && normalizeText(enriched.product.zh?.brandText) !== normalizeText(expectedBrand))) {
      blocked.push({ id: before.id, reasons: ["brand-not-preserved-in-zh-brandText"] });
    }
    if (expectedBrand && !normalizeText(enriched.product.zh?.name).includes(normalizeText(expectedBrand))) {
      blocked.push({ id: before.id, reasons: ["brand-not-preserved-in-zh-name"] });
    }
    if (enriched.diffs.length) {
      changes.push({
        id: before.id,
        index,
        categoryId: categoryIdFor(before),
        taxonomy: enriched.taxonomy,
        fields: enriched.diffs,
        matchedTerms: enriched.features,
        featureSignals: enriched.featureSignals,
      });
    }
  }

  const processedProducts = outputProducts.slice(startIndex, endExclusive);
  const issues = qualityIssues(processedProducts, glossary);
  const missingCoreZh = coreZhCompletenessIssues(processedProducts);
  const report = {
    schemaVersion: "product-zh-enrichment-report/v1",
    generatedAt: new Date().toISOString(),
    input: inputPath,
    output: outputPath,
    glossaryVersion: glossary.version,
    force: args.force,
    dryRun: args.dryRun,
    totalProducts: sourceProducts.length,
    processedProducts: processCount,
    batchRange: {
      start: startIndex + 1,
      end: endExclusive,
    },
    changedProducts: changes.length,
    blockedProducts: unique(blocked.map((item) => item.id)).length,
    fieldCoverage: Object.fromEntries(TARGET_FIELDS.map((field) => [field, fieldCoverage(processedProducts, field)])),
    taxonomyCoverage: {
      filled: taxonomyFilledCount,
      total: processedProducts.length,
      percent: processedProducts.length ? Number((taxonomyFilledCount * 100 / processedProducts.length).toFixed(1)) : 0,
    },
    otherCount,
    featureSignalCoverage: {
      filled: featureSignalProducts,
      total: processedProducts.length,
      percent: processedProducts.length ? Number((featureSignalProducts * 100 / processedProducts.length).toFixed(1)) : 0,
    },
    topFeaturesReplacedCount,
    cjkNameCoverage: {
      filled: processedProducts.filter((product) => containsCjk(product.zh?.name)).length,
      total: processedProducts.length,
      percent: processedProducts.length
        ? Number((processedProducts.filter((product) => containsCjk(product.zh?.name)).length * 100 / processedProducts.length).toFixed(1))
        : 0,
    },
    placeholderResidue: issues.placeholderResidue,
    mixedLanguageNoise: issues.mixedLanguageNoise,
    unknownSubcategory: issues.unknownSubcategory,
    missingCoreZh,
    duplicateCopy: {
      cardSummary: duplicateCopy(processedProducts, "cardSummary"),
      description: duplicateCopy(processedProducts, "description"),
      editorVerdict: duplicateCopy(processedProducts, "editorVerdict"),
    },
    blocked,
    changes,
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  const writeJobs = [
    fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8"),
  ];
  if (!args.dryRun) {
    writeJobs.push(fs.writeFile(outputPath, `${JSON.stringify(resultExport, null, 2)}\n`, "utf8"));
  }
  await Promise.all(writeJobs);
  console.log(`[zh-enrich] processed=${processCount}/${sourceProducts.length} range=${startIndex + 1}-${endExclusive} changed=${changes.length} blocked=${report.blockedProducts}`);
  if (!args.dryRun) {
    console.log(`[zh-enrich] output=${outputPath}`);
  } else {
    console.log(`[zh-enrich] dry-run enabled, enriched export not written`);
  }
  console.log(`[zh-enrich] report=${reportPath}`);
  if (report.blockedProducts > 0) process.exitCode = 2;
}

main().catch((error) => {
  console.error(`[zh-enrich] ${error.message}`);
  process.exitCode = 1;
});
