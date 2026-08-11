#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const value = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : "true";
    args[key] = value;
    if (value !== "true") i += 1;
  }
  return args;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function normalize(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function hasEnglish(text) {
  return /[A-Za-z]/.test(text || "");
}

function looksLikeAllowedText(text, key = "") {
  if (!text) return true;
  const lower = text.toLowerCase();
  if (/^b0[a-z0-9]{8}$/i.test(text)) return true;
  if (/^[a-z0-9\-]+$/i.test(text) && text.length <= 18) return true;
  if (/^[\d\s./,'"()\-–—]+$/.test(text)) return true;
  if (/^\d+(?:\.\d+)?\s*(?:kg|g|lb|lbs|pounds?|inch(?:es)?|cm|mm|m)$/i.test(text)) return true;
  if (/^(?:yes|no|true|false|unknown|n\/a|na)$/i.test(lower)) return true;
  if (/^(?:brand|manufacturer|model|model name|asin|sku)$/i.test(lower)) return true;
  if (key === "brandText" || key === "manufacturer" || key === "brand") return true;
  if (/\b(cubsala|mamazing|costzon|baby trend|mompush|graco|doselie|starry)\b/i.test(text)) return true;
  return false;
}

function recordHit(product, section, key, value, reason) {
  const text = normalize(value);
  if (!text || !hasEnglish(text) || looksLikeAllowedText(text, key)) return null;
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    subcategoryId: product.subcategoryId,
    section,
    key,
    value: text,
    reason,
  };
}

function scanProduct(product) {
  const hits = [];
  const add = (section, key, value, reason) => {
    const hit = recordHit(product, section, key, value, reason);
    if (hit) hits.push(hit);
  };

  add("root", "zh.description", product?.zh?.description, "contains English tokens");
  add("root", "zh.cardSummary", product?.zh?.cardSummary, "contains English tokens");
  add("root", "zh.editorVerdict", product?.zh?.editorVerdict, "contains English tokens");
  add("root", "zh.specsText", product?.zh?.specsText, "contains English tokens");

  const displayFields = product?.zh?.Product_Display_Fields || {};
  for (const [key, field] of Object.entries(displayFields)) {
    add("zh.Product_Display_Fields", `${key}.labelZh`, field?.labelZh, "contains English tokens");
    add("zh.Product_Display_Fields", `${key}.valueZh`, field?.valueZh, "contains English tokens");
    add("zh.Product_Display_Fields", `${key}.valueEn`, field?.valueEn, "contains English tokens");
  }

  const categoryAttributes = product?.Category_Attributes || {};
  for (const [key, value] of Object.entries(categoryAttributes)) {
    add("Category_Attributes", key, value, "contains English tokens");
  }

  const specifications = product?.Product_Specifications || {};
  for (const [sectionKey, sectionValue] of Object.entries(specifications)) {
    if (!sectionValue || typeof sectionValue !== "object") continue;
    for (const [key, value] of Object.entries(sectionValue)) {
      add(`Product_Specifications.${sectionKey}`, key, value, "contains English tokens");
    }
  }

  if (Array.isArray(product?.zh?.pros)) {
    product.zh.pros.forEach((item, index) => add("zh.pros", `pros[${index}]`, item, "contains English tokens"));
  }
  if (Array.isArray(product?.zh?.cons)) {
    product.zh.cons.forEach((item, index) => add("zh.cons", `cons[${index}]`, item, "contains English tokens"));
  }

  return hits;
}

function main() {
  const args = parseArgs(process.argv);
  const repoRoot = path.resolve(process.cwd(), "..");
  const input = args.input ? path.resolve(process.cwd(), args.input) : path.resolve(repoRoot, "env/cms-export-detail-audit-latest.json");
  const output = args.output ? path.resolve(process.cwd(), args.output) : path.resolve(repoRoot, `env/process/detail-leak-audit-${Date.now()}.json`);

  const json = readJson(input);
  const products = (((json || {}).data || {}).collections || {}).products || [];
  const hits = products.flatMap((product) => scanProduct(product));

  const byProduct = new Map();
  for (const hit of hits) {
    const bucket = byProduct.get(hit.id) || {
      id: hit.id,
      name: hit.name,
      category: hit.category,
      subcategoryId: hit.subcategoryId,
      hitCount: 0,
      hits: [],
    };
    bucket.hitCount += 1;
    if (bucket.hits.length < 10) bucket.hits.push(hit);
    byProduct.set(hit.id, bucket);
  }

  const report = {
    sourceFile: path.relative(repoRoot, input),
    totalProducts: products.length,
    productCountWithHits: byProduct.size,
    totalHits: hits.length,
    productsWithoutHits: Math.max(0, products.length - byProduct.size),
    byCategory: (() => {
      const summary = new Map();
      for (const product of products) {
        const key = String(product?.category || "unknown");
        const row = summary.get(key) || {
          category: key,
          totalProducts: 0,
          productsWithHits: 0,
          totalHits: 0,
        };
        row.totalProducts += 1;
        const bucket = byProduct.get(product?.id);
        if (bucket) {
          row.productsWithHits += 1;
          row.totalHits += bucket.hitCount;
        }
        summary.set(key, row);
      }
      return [...summary.values()].sort((a, b) => b.totalHits - a.totalHits || b.totalProducts - a.totalProducts);
    })(),
    topLeakSections: (() => {
      const counts = new Map();
      for (const hit of hits) {
        const key = String(hit.section || "unknown");
        counts.set(key, (counts.get(key) || 0) + 1);
      }
      return [...counts.entries()]
        .map(([section, count]) => ({ section, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);
    })(),
    topLeakKeys: (() => {
      const counts = new Map();
      for (const hit of hits) {
        const key = `${String(hit.section || "unknown")}.${String(hit.key || "unknown")}`;
        counts.set(key, (counts.get(key) || 0) + 1);
      }
      return [...counts.entries()]
        .map(([key, count]) => ({ key, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 30);
    })(),
    topProducts: [...byProduct.values()].sort((a, b) => b.hitCount - a.hitCount).slice(0, 20),
    allProducts: products
      .map((product) => {
        const bucket = byProduct.get(product.id);
        return {
          id: product.id,
          name: product.name,
          category: product.category,
          subcategoryId: product.subcategoryId,
          hitCount: bucket ? bucket.hitCount : 0,
          hits: bucket ? bucket.hits : [],
        };
      })
      .sort((a, b) => b.hitCount - a.hitCount || String(a.id || "").localeCompare(String(b.id || ""))),
  };

  writeJson(output, report);
  console.log(JSON.stringify({
    input: path.relative(repoRoot, input),
    output: path.relative(repoRoot, output),
    totalProducts: report.totalProducts,
    productCountWithHits: report.productCountWithHits,
    totalHits: report.totalHits,
    productsWithoutHits: report.productsWithoutHits,
    topProducts: report.topProducts.slice(0, 5),
  }, null, 2));
}

main();