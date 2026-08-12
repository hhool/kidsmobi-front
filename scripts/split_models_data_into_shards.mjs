import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";

const root = process.cwd();
const srcPath = resolve(root, "src/data/modelsData.ts");
const outDir = resolve(root, "src/data/modelsDataShards");

const source = readFileSync(srcPath, "utf8");
const startMark = "export const productsData";
const startIdx = source.indexOf(startMark);
if (startIdx < 0) {
  throw new Error("Cannot find productsData export in modelsData.ts");
}

const equalsIdx = source.indexOf("=", startIdx);
const endMark = "\n\nexport";
let endIdx = source.indexOf(endMark, equalsIdx);
if (endIdx < 0) endIdx = source.length;

const expr = source.slice(equalsIdx + 1, endIdx).trim().replace(/;\s*$/, "");

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(`productsData = (${expr});`, sandbox, { timeout: 10_000 });

const productsData = Array.isArray(sandbox.productsData) ? sandbox.productsData : [];

const aliases = {
  scooters: "kids_scooters",
  scooter: "kids_scooters",
  "kids-scooters": "kids_scooters",
  "kids-bikes": "kids_bikes",
  "balance-bikes": "balance_bike",
  balance: "balance_bike",
  bicycle: "kids_bikes",
  tricycle: "kids_tricycles",
  electric_car: "electric_vehicles",
  safety_seat: "car_seat",
  strollers: "stroller",
  jogger_stroller: "stroller",
  jogging_stroller: "stroller",
  others: "other",
};

const normalizeCategory = (item) => {
  const raw = String(item?.categoryId || item?.category || "other").trim().toLowerCase();
  return aliases[raw] || raw || "other";
};

mkdirSync(outDir, { recursive: true });

const groups = new Map();
for (const item of productsData) {
  const key = normalizeCategory(item);
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(item);
}

const sortedKeys = Array.from(groups.keys()).sort();
for (const key of sortedKeys) {
  writeFileSync(resolve(outDir, `${key}.json`), JSON.stringify(groups.get(key)));
}

const manifest = {
  generatedAt: new Date().toISOString(),
  totalItems: productsData.length,
  groups: sortedKeys.map((key) => ({ key, count: groups.get(key).length })),
};
writeFileSync(resolve(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));

console.log(`Generated ${sortedKeys.length} shards, total items=${manifest.totalItems}`);
for (const row of manifest.groups) {
  console.log(`${row.key}: ${row.count}`);
}
