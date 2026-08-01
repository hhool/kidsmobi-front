#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_GLOSSARY = path.join(SCRIPT_DIR, "config/product_zh_glossary.v1.json");
const TARGET_FIELDS = ["name", "cardTitle", "cardSummary", "description", "pros", "cons", "editorVerdict", "brandText", "specsText"];

function parseArgs(argv) {
  const args = { input: "", output: "", report: "", glossary: DEFAULT_GLOSSARY, limit: 0, force: false };
  for (const arg of argv) {
    if (arg.startsWith("--input=")) args.input = arg.slice(8);
    else if (arg.startsWith("--output=")) args.output = arg.slice(9);
    else if (arg.startsWith("--report=")) args.report = arg.slice(9);
    else if (arg.startsWith("--glossary=")) args.glossary = arg.slice(11);
    else if (arg.startsWith("--limit=")) args.limit = Math.max(0, Number(arg.slice(8)) || 0);
    else if (arg === "--force") args.force = true;
    else if (arg === "--help" || arg === "-h") args.help = true;
  }
  return args;
}

function printHelp() {
  console.log(`Usage: node scripts/product_enrich_zh_from_export.mjs --input=<cms-export.json> [options]\n\nOptions:\n  --output=<path>      Enriched CMS export (default: tmp/<input>.zh-enriched.json)\n  --report=<path>      Review report (default: tmp/<input>.zh-report.json)\n  --glossary=<path>    Versioned glossary JSON\n  --limit=<n>          Enrich only the first n products\n  --force              Replace existing non-placeholder Chinese copy\n  --help               Show this help\n`);
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
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
  return normalizeText(product.categoryId || product.Category_Attributes?.categoryId || product.category).toLowerCase();
}

function categoryLabel(product, glossary) {
  const categoryId = categoryIdFor(product);
  return glossary.categories[categoryId] || glossary.categories[normalizeText(product.category).toLowerCase()] || "儿童出行产品";
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
  const brand = normalizeText(product.brand || product.en?.brandText || product.zh?.brandText);
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
  const name = buildDisplayName(product, glossary);
  const features = termMatches(product, glossary);
  const generated = {
    name,
    cardTitle: trimText(name, 56),
    cardSummary: firstSentence(buildCardSummary(name, features)),
    description: buildDescription(product, glossary, name, features),
    pros: buildPros(features),
    cons: buildCons(product),
    editorVerdict: buildVerdict(product, name, features),
    brandText: normalizeText(product.brand || product.en?.brandText || sourceZh.brandText),
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
  return { product: { ...product, zh }, diffs, features };
}

function preservationFailures(before, after) {
  const failures = [];
  for (const key of ["id", "brand", "name", "category", "categoryId"]) {
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
  for (const product of products) {
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
  return { placeholderResidue, mixedLanguageNoise };
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
  const processCount = args.limit > 0 ? Math.min(args.limit, sourceProducts.length) : sourceProducts.length;
  const changes = [];
  const blocked = [];
  for (let index = 0; index < processCount; index += 1) {
    const before = sourceProducts[index];
    const enriched = enrichProduct(before, glossary, args.force);
    outputProducts[index] = enriched.product;
    const preservation = preservationFailures(before, enriched.product);
    if (preservation.length) blocked.push({ id: before.id, reasons: preservation.map((key) => `source-field-changed:${key}`) });
    if (!normalizeText(enriched.product.zh?.brandText) || !normalizeText(enriched.product.zh?.name).includes(normalizeText(before.brand))) {
      blocked.push({ id: before.id, reasons: ["brand-not-preserved-in-zh-name"] });
    }
    if (enriched.diffs.length) changes.push({ id: before.id, categoryId: categoryIdFor(before), fields: enriched.diffs, matchedTerms: enriched.features });
  }

  const processedProducts = outputProducts.slice(0, processCount);
  const issues = qualityIssues(processedProducts, glossary);
  const report = {
    schemaVersion: "product-zh-enrichment-report/v1",
    generatedAt: new Date().toISOString(),
    input: inputPath,
    output: outputPath,
    glossaryVersion: glossary.version,
    force: args.force,
    totalProducts: sourceProducts.length,
    processedProducts: processCount,
    changedProducts: changes.length,
    blockedProducts: unique(blocked.map((item) => item.id)).length,
    fieldCoverage: Object.fromEntries(TARGET_FIELDS.map((field) => [field, fieldCoverage(processedProducts, field)])),
    cjkNameCoverage: {
      filled: processedProducts.filter((product) => containsCjk(product.zh?.name)).length,
      total: processedProducts.length,
      percent: processedProducts.length
        ? Number((processedProducts.filter((product) => containsCjk(product.zh?.name)).length * 100 / processedProducts.length).toFixed(1))
        : 0,
    },
    placeholderResidue: issues.placeholderResidue,
    mixedLanguageNoise: issues.mixedLanguageNoise,
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
  await Promise.all([
    fs.writeFile(outputPath, `${JSON.stringify(resultExport, null, 2)}\n`, "utf8"),
    fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8"),
  ]);
  console.log(`[zh-enrich] processed=${processCount}/${sourceProducts.length} changed=${changes.length} blocked=${report.blockedProducts}`);
  console.log(`[zh-enrich] output=${outputPath}`);
  console.log(`[zh-enrich] report=${reportPath}`);
  if (report.blockedProducts > 0) process.exitCode = 2;
}

main().catch((error) => {
  console.error(`[zh-enrich] ${error.message}`);
  process.exitCode = 1;
});
