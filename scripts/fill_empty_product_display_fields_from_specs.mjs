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

function normalizeText(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\s+/g, " ").trim();
}

function hasValue(value) {
  const text = normalizeText(value);
  if (!text) return false;
  return !/^(unknown|n\/a|null|none|-+)$/i.test(text);
}

function formatZh(value) {
  const text = normalizeText(value);
  return text
    .replace(/\bmonths?\b/gi, "个月")
    .replace(/\byears?\b/gi, "岁")
    .replace(/\bpounds?\b/gi, "磅")
    .replace(/\binches?\b/gi, "英寸")
    .replace(/\bkg\b/gi, "公斤");
}

function pick(...values) {
  for (const value of values) {
    if (hasValue(value)) return normalizeText(value);
  }
  return "";
}

function buildField(labelEn, labelZh, type, valueEn, source) {
  if (!hasValue(valueEn)) return null;
  return {
    labelEn,
    labelZh,
    type,
    valueEn: normalizeText(valueEn),
    valueZh: formatZh(valueEn),
    source,
  };
}

function buildFallbackDisplayFields(product) {
  const measure = product?.Product_Specifications?.Measurements || {};
  const attrs = product?.Category_Attributes || {};
  const fields = {};

  const recommendedAge = pick(attrs["Age Range Description"], product.ageRange);
  const itemWeight = pick(measure["Item Weight"], attrs["Item Weight"], product.weight ? `${product.weight}` : "");
  const frameMaterial = pick(attrs["Frame Material"], product.material);
  const dimensions = pick(measure["Item Dimensions L x W x H"]);
  const foldability = pick(measure["Folded Size"]);
  const tireType = pick(product.tireType);
  const frontWheel = pick(measure["Front Wheel Diameter"]);
  const rearWheel = pick(measure["Back Wheel Diameter"]);
  const wheelSize = pick(frontWheel && rearWheel ? `Front ${frontWheel}; Rear ${rearWheel}` : frontWheel || rearWheel || product.wheelSize);

  const candidates = {
    recommendedAge: buildField("Recommended Age", "推荐年龄", "text", recommendedAge, "Category_Attributes.Age Range Description"),
    itemWeight: buildField("Item Weight", "产品重量", "text", itemWeight, "Product_Specifications.Measurements.Item Weight"),
    frameMaterial: buildField("Frame Material", "车架材质", "text", frameMaterial, "Category_Attributes.Frame Material"),
    dimensions: buildField("Dimensions", "产品尺寸", "text", dimensions, "Product_Specifications.Measurements.Item Dimensions L x W x H"),
    foldability: buildField("Foldability", "折叠尺寸", "text", foldability, "Product_Specifications.Measurements.Folded Size"),
    tireType: buildField("Tire Type", "轮胎材质", "text", tireType, "classification.Tire_Type"),
    wheelSize: buildField("Wheel Size", "轮径", "text", wheelSize, "Product_Specifications.Measurements.Wheel Diameter"),
  };

  for (const [key, value] of Object.entries(candidates)) {
    if (value) fields[key] = value;
  }

  return fields;
}

function findLatestVerifyExport(repoRoot) {
  const envDir = path.resolve(repoRoot, "env");
  const names = fs
    .readdirSync(envDir)
    .filter((name) => /^cms-export-post-layout-verify-\d+\.json$/i.test(name))
    .sort((a, b) => {
      const ta = Number(a.match(/(\d+)/)?.[1] || 0);
      const tb = Number(b.match(/(\d+)/)?.[1] || 0);
      return tb - ta;
    });
  if (names.length === 0) throw new Error("No cms-export-post-layout-verify-*.json found in env/");
  return path.join(envDir, names[0]);
}

function main() {
  const args = parseArgs(process.argv);
  const repoRoot = path.resolve(process.cwd(), "..");
  const input = args.input ? path.resolve(process.cwd(), args.input) : findLatestVerifyExport(repoRoot);
  const output = args.output
    ? path.resolve(process.cwd(), args.output)
    : path.resolve(repoRoot, `env/process/cms-export-with-layout-fill-${Date.now()}.json`);

  const json = readJson(input);
  const rows = json?.data?.collections?.products;
  if (!Array.isArray(rows)) {
    throw new Error("Invalid export file: data.collections.products not found");
  }

  let filled = 0;
  const touchedIds = [];

  const nextRows = rows.map((product) => {
    const zh = product?.zh && typeof product.zh === "object" ? product.zh : {};
    const current = zh.Product_Display_Fields;
    const isEmptyObject = current && typeof current === "object" && !Array.isArray(current) && Object.keys(current).length === 0;
    if (!isEmptyObject) return product;

    const fallback = buildFallbackDisplayFields(product);
    if (Object.keys(fallback).length === 0) return product;

    filled += 1;
    touchedIds.push(product.id);
    return {
      ...product,
      zh: {
        ...zh,
        Product_Display_Fields: fallback,
      },
    };
  });

  const nextJson = {
    ...json,
    data: {
      ...(json.data || {}),
      collections: {
        ...(json.data?.collections || {}),
        products: nextRows,
      },
    },
    meta: {
      ...(json.meta && typeof json.meta === "object" ? json.meta : {}),
      layoutFallbackFill: {
        appliedAt: new Date().toISOString(),
        sourceFile: path.relative(repoRoot, input),
        filled,
        touchedIds,
      },
    },
  };

  writeJson(output, nextJson);

  console.log(
    JSON.stringify(
      {
        input: path.relative(repoRoot, input),
        output: path.relative(repoRoot, output),
        totalProducts: nextRows.length,
        filled,
        touchedIds,
      },
      null,
      2,
    ),
  );
}

main();