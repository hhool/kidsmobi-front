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

function findLatestPostExport(repoRoot) {
  const envDir = path.resolve(repoRoot, "env");
  const names = fs
    .readdirSync(envDir)
    .filter((name) => /^cms-export-post-\d+\.json$/i.test(name))
    .sort((a, b) => {
      const ta = Number(a.match(/(\d+)/)?.[1] || 0);
      const tb = Number(b.match(/(\d+)/)?.[1] || 0);
      return tb - ta;
    });
  if (names.length === 0) throw new Error("No cms-export-post-*.json found in env/");
  return path.join(envDir, names[0]);
}

function applyPatchToProducts(products, patchRows) {
  const patchById = new Map((patchRows || []).map((row) => [row.id, row.patch || {}]));
  let changed = 0;
  let missing = 0;

  const nextProducts = (products || []).map((product) => {
    const patch = patchById.get(product.id);
    if (!patch) return product;

    const next = {
      ...product,
      zh: {
        ...(product.zh && typeof product.zh === "object" ? product.zh : {}),
        ...(patch.zh && typeof patch.zh === "object" ? patch.zh : {}),
      },
    };
    changed += 1;
    return next;
  });

  for (const id of patchById.keys()) {
    if (!nextProducts.some((product) => product.id === id)) {
      missing += 1;
    }
  }

  return { nextProducts, changed, missing };
}

function main() {
  const args = parseArgs(process.argv);
  const repoRoot = path.resolve(process.cwd(), "..");
  const inputExport = args.export
    ? path.resolve(process.cwd(), args.export)
    : findLatestPostExport(repoRoot);
  const inputPatch = args.patch
    ? path.resolve(process.cwd(), args.patch)
    : path.resolve(repoRoot, "env/process/product_detail_layout_cms_patch.json");
  const output = args.output
    ? path.resolve(process.cwd(), args.output)
    : path.resolve(repoRoot, `env/process/cms-export-with-layout-patch-${Date.now()}.json`);

  const exportJson = readJson(inputExport);
  const patchJson = readJson(inputPatch);

  const products = exportJson?.data?.collections?.products;
  if (!Array.isArray(products)) {
    throw new Error("Invalid export file: data.collections.products not found");
  }

  const patchRows = patchJson?.patches;
  if (!Array.isArray(patchRows)) {
    throw new Error("Invalid patch file: patches array not found");
  }

  const { nextProducts, changed, missing } = applyPatchToProducts(products, patchRows);

  const nextExport = {
    ...exportJson,
    data: {
      ...(exportJson.data || {}),
      collections: {
        ...(exportJson.data?.collections || {}),
        products: nextProducts,
      },
    },
    meta: {
      ...(exportJson.meta && typeof exportJson.meta === "object" ? exportJson.meta : {}),
      productDetailLayoutPatch: {
        appliedAt: new Date().toISOString(),
        patchFile: path.relative(repoRoot, inputPatch),
        changed,
        missing,
      },
    },
  };

  writeJson(output, nextExport);

  console.log(
    JSON.stringify(
      {
        exportFile: path.relative(repoRoot, inputExport),
        patchFile: path.relative(repoRoot, inputPatch),
        outputFile: path.relative(repoRoot, output),
        changed,
        missing,
        totalProducts: nextProducts.length,
      },
      null,
      2,
    ),
  );
}

main();