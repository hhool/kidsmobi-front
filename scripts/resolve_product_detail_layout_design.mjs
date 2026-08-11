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

function copySections(sections) {
  return (sections || []).map((section) => ({
    sectionId: section.sectionId,
    sectionTitleZh: section.sectionTitleZh,
    order: Number(section.order || 0),
    items: [...(section.items || [])],
  }));
}

function resolveFieldItem(fieldDictionary, fieldValueMap, key) {
  const dict = fieldDictionary[key] || {};
  const value = fieldValueMap[key] || {};
  return {
    key,
    labelEn: dict.labelEn || key,
    labelZh: dict.labelZh || dict.labelEn || key,
    type: dict.type || "text",
    keepBrandUntranslated: dict.keepBrandUntranslated === true,
    valueEn: value.valueEn || "",
    valueZh: value.valueZh || "",
    source: value.source || "",
  };
}

function resolveDesign(design) {
  const fieldDictionary = design.fieldDictionary || {};
  const baseSections = copySections(design.baseTemplate?.sections);
  const outputProducts = {};

  for (const [productId, node] of Object.entries(design.products || {})) {
    const category = node.category;
    const categorySections = copySections(design.categoryTemplates?.[category]?.sectionsPatch);
    const extraSections = copySections(node.overrides?.extraSections);
    const hidden = new Set(node.overrides?.hiddenItems || []);
    const fieldValueMap = node.overrides?.fieldValueMap || {};

    const sections = [...baseSections, ...categorySections, ...extraSections].sort((a, b) => a.order - b.order);
    const resolvedSections = [];

    for (const section of sections) {
      const keys = (section.items || []).filter((key) => !hidden.has(key) && fieldValueMap[key]);
      if (keys.length === 0) continue;
      resolvedSections.push({
        sectionId: section.sectionId,
        sectionTitleZh: section.sectionTitleZh,
        order: section.order,
        items: keys.map((key) => resolveFieldItem(fieldDictionary, fieldValueMap, key)),
      });
    }

    outputProducts[productId] = {
      category,
      layoutRef: node.layoutRef,
      sections: resolvedSections,
    };
  }

  return {
    version: design.version,
    locale: design.locale,
    generatedAt: new Date().toISOString(),
    sourceFile: "product_detail_layout_design_all.json",
    totalProducts: Object.keys(outputProducts).length,
    products: outputProducts,
  };
}

function main() {
  const args = parseArgs(process.argv);
  const repoRoot = path.resolve(process.cwd(), "..");
  const input = args.input
    ? path.resolve(process.cwd(), args.input)
    : path.resolve(repoRoot, "env/process/product_detail_layout_design_all.json");
  const output = args.output
    ? path.resolve(process.cwd(), args.output)
    : path.resolve(repoRoot, "env/process/product_detail_layout_resolved_all.json");

  const design = readJson(input);
  const resolved = resolveDesign(design);
  writeJson(output, resolved);

  console.log(
    JSON.stringify(
      {
        input: path.relative(repoRoot, input),
        output: path.relative(repoRoot, output),
        totalProducts: resolved.totalProducts,
      },
      null,
      2,
    ),
  );
}

main();