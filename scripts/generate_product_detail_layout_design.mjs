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

function slug(text) {
  return normalizeText(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function humanizeKey(key) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

const LABEL_ZH = {
  ageRange: "适龄范围",
  recommendedAge: "推荐年龄",
  weightLimit: "承重上限",
  itemWeight: "产品重量",
  frameMaterial: "车架材质",
  dimensions: "产品尺寸",
  wheelSize: "轮径",
  tireType: "轮胎材质",
  harnessType: "安全带类型",
  harness: "安全带",
  storage: "收纳配置",
  seatRecline: "座椅调节",
  canopy: "遮阳篷",
  foldability: "折叠尺寸",
  brakeType: "制动方式",
  suspension: "避震系统",
  material: "材质",
  manufacturer: "制造商",
  brandName: "品牌名称",
  subBrand: "子品牌",
  asin: "ASIN",
  customerReviews: "用户评分",
  bestSellersRank: "畅销排名",
};

const ITEM_TYPE_HINT = [
  { re: /review|rating|stars?/i, type: "rating_summary" },
  { re: /rank/i, type: "multiline" },
  { re: /asin|sku|model/i, type: "code" },
  { re: /dimension|size|weight|age|capacity/i, type: "text" },
  { re: /material|brand|manufacturer|harness|brake|suspension|canopy|recline|fold/i, type: "text" },
];

function inferType(key) {
  for (const hint of ITEM_TYPE_HINT) {
    if (hint.re.test(key)) return hint.type;
  }
  return "text";
}

function isBrandLike(key) {
  return /brand|manufacturer/i.test(key);
}

function hasValue(value) {
  const text = normalizeText(value);
  if (!text) return false;
  return !/^(unknown|n\/a|null|none|-+)$/i.test(text);
}

function autoZhValue(valueEn) {
  const text = normalizeText(valueEn);
  if (!text) return "";
  return text
    .replace(/\bMonths?\b/gi, "个月")
    .replace(/\bYears?\b/gi, "岁")
    .replace(/\bout of 5 stars?\b/gi, "/5")
    .replace(/\bPounds?\b/gi, "磅")
    .replace(/\bInches?\b/gi, "英寸")
    .replace(/\bTop\s*100\b/gi, "Top 100")
    .replace(/\s*,\s*/g, "；");
}

function getProducts(exportJson) {
  return exportJson?.data?.collections?.products || [];
}

function getDisplayFields(product) {
  const map = product?.Product_Display_Fields;
  if (!map || typeof map !== "object") return {};
  return map;
}

function getValueObject(raw) {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return { value: normalizeText(raw.value), source: normalizeText(raw.source) };
  }
  return { value: normalizeText(raw), source: "" };
}

function sectionTitleByCategory(category) {
  switch (normalizeText(category)) {
    case "stroller":
      return "推车关键参数";
    case "balance":
      return "平衡车关键参数";
    case "scooter":
      return "滑板车关键参数";
    case "tricycle":
      return "三轮车关键参数";
    case "bicycle":
      return "自行车关键参数";
    case "electric_car":
      return "电动车关键参数";
    case "safety_seat":
      return "安全座椅关键参数";
    default:
      return "核心规格";
  }
}

function topKeysByFrequency(counter, total, minPercent, limit) {
  return [...counter.entries()]
    .map(([key, count]) => ({ key, count, percent: total ? (count * 100) / total : 0 }))
    .filter((item) => item.percent >= minPercent)
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))
    .slice(0, limit)
    .map((item) => item.key);
}

function buildDesign(products, sourceFile) {
  const allFieldCounter = new Map();
  const categoryCounter = new Map();
  const fieldDictionary = {};

  for (const product of products) {
    const category = normalizeText(product.category || "unknown");
    const display = getDisplayFields(product);
    if (!categoryCounter.has(category)) categoryCounter.set(category, { products: 0, fields: new Map() });
    categoryCounter.get(category).products += 1;

    for (const [rawKey] of Object.entries(display)) {
      const key = normalizeText(rawKey);
      if (!key) continue;
      allFieldCounter.set(key, (allFieldCounter.get(key) || 0) + 1);
      const catStats = categoryCounter.get(category);
      catStats.fields.set(key, (catStats.fields.get(key) || 0) + 1);

      if (!fieldDictionary[key]) {
        fieldDictionary[key] = {
          labelEn: humanizeKey(key),
          labelZh: LABEL_ZH[key] || humanizeKey(key),
          type: inferType(key),
          keepBrandUntranslated: isBrandLike(key) || undefined,
        };
        if (!fieldDictionary[key].keepBrandUntranslated) delete fieldDictionary[key].keepBrandUntranslated;
      }
    }
  }

  const baseKeys = topKeysByFrequency(allFieldCounter, products.length, 45, 8);
  const baseTemplate = {
    layoutId: "product_detail_default_v1",
    grid: { desktopColumns: 2, mobileColumns: 1, cardStyle: "outlined" },
    sections: [
      {
        sectionId: "basic_info",
        sectionTitleZh: "基础信息",
        order: 10,
        items: baseKeys.slice(0, Math.ceil(baseKeys.length / 2)),
      },
      {
        sectionId: "core_specs",
        sectionTitleZh: "核心规格",
        order: 20,
        items: baseKeys.slice(Math.ceil(baseKeys.length / 2)),
      },
    ].filter((section) => section.items.length > 0),
  };

  const categoryTemplates = {};
  for (const [category, stats] of categoryCounter.entries()) {
    const frequent = topKeysByFrequency(stats.fields, stats.products, 35, 10);
    const patchItems = frequent.filter((key) => !baseKeys.includes(key));
    categoryTemplates[category] = {
      extends: "product_detail_default_v1",
      sectionsPatch: patchItems.length
        ? [
            {
              sectionId: `${slug(category)}_core`,
              sectionTitleZh: sectionTitleByCategory(category),
              order: 30,
              items: patchItems,
            },
          ]
        : [],
    };
  }

  const productsNode = {};
  for (const product of products) {
    const category = normalizeText(product.category || "unknown");
    const display = getDisplayFields(product);
    const categoryPatchItems =
      categoryTemplates[category]?.sectionsPatch?.flatMap((section) => section.items || []) || [];
    const expectedKeys = new Set([...baseKeys, ...categoryPatchItems]);

    const fieldValueMap = {};
    const presentKeys = [];
    for (const [key, rawValue] of Object.entries(display)) {
      const entry = getValueObject(rawValue);
      if (!hasValue(entry.value)) continue;
      presentKeys.push(key);
      const keepBrand = fieldDictionary[key]?.keepBrandUntranslated === true;
      fieldValueMap[key] = {
        valueEn: entry.value,
        valueZh: keepBrand ? entry.value : autoZhValue(entry.value),
        source: entry.source || "Product_Display_Fields",
      };
    }

    const hiddenItems = [...expectedKeys].filter((key) => !presentKeys.includes(key));
    const extraItems = presentKeys.filter((key) => !expectedKeys.has(key));

    productsNode[product.id] = {
      category,
      layoutRef: category,
      overrides: {
        hiddenItems,
        extraSections: extraItems.length
          ? [
              {
                sectionId: "extended_specs",
                sectionTitleZh: "扩展参数",
                order: 40,
                items: extraItems,
              },
            ]
          : [],
        fieldValueMap,
      },
    };
  }

  return {
    version: "1.0.0",
    locale: "zh-CN",
    generatedAt: new Date().toISOString(),
    sourceFile,
    totalProducts: products.length,
    strategy: {
      baseTemplateFirst: true,
      categoryTemplateSecond: true,
      productOverrideLast: true,
    },
    fieldDictionary,
    baseTemplate,
    categoryTemplates,
    products: productsNode,
    renderRules: {
      fallbackOrder: [
        "products.{id}.overrides.fieldValueMap",
        "categoryTemplates.{category}",
        "baseTemplate",
      ],
      dropIfEmpty: true,
      brandTranslationRule: "never_translate_brand",
      multilineJoinerZh: "；",
    },
  };
}

function findLatestExport(repoRoot) {
  const envDir = path.resolve(repoRoot, "env");
  const names = fs.readdirSync(envDir).filter((name) => /^cms-export-post-\d+\.json$/i.test(name));
  names.sort((a, b) => {
    const ta = Number(a.match(/(\d+)/)?.[1] || 0);
    const tb = Number(b.match(/(\d+)/)?.[1] || 0);
    return tb - ta;
  });
  if (names.length === 0) throw new Error("No cms-export-post-*.json found under env/");
  return path.join(envDir, names[0]);
}

function main() {
  const args = parseArgs(process.argv);
  const repoRoot = path.resolve(process.cwd(), "..");
  const input = args.input ? path.resolve(process.cwd(), args.input) : findLatestExport(repoRoot);
  const output = args.output
    ? path.resolve(process.cwd(), args.output)
    : path.resolve(repoRoot, "env/process/product_detail_layout_design_all.json");

  const exportJson = readJson(input);
  const products = getProducts(exportJson);
  const design = buildDesign(products, path.relative(repoRoot, input));

  writeJson(output, design);
  const stats = {
    input: path.relative(repoRoot, input),
    output: path.relative(repoRoot, output),
    products: products.length,
    fields: Object.keys(design.fieldDictionary).length,
    categories: Object.keys(design.categoryTemplates).length,
  };
  console.log(JSON.stringify(stats, null, 2));
}

main();