import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { productsData } from "../src/data/modelsData";

type ProductLike = Record<string, any>;

const normalizeCategory = (item: ProductLike): string => {
  const raw = String(item?.categoryId || item?.category || "other").trim().toLowerCase();
  const aliases: Record<string, string> = {
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
  return aliases[raw] || raw || "other";
};

const outDir = resolve(process.cwd(), "src/data/modelsDataShards");
mkdirSync(outDir, { recursive: true });

const groups = new Map<string, ProductLike[]>();
for (const item of Array.isArray(productsData) ? productsData : []) {
  const key = normalizeCategory(item as ProductLike);
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key)!.push(item as ProductLike);
}

const sortedKeys = Array.from(groups.keys()).sort();
for (const key of sortedKeys) {
  const items = groups.get(key) || [];
  writeFileSync(resolve(outDir, `${key}.json`), JSON.stringify(items));
}

const manifest = {
  generatedAt: new Date().toISOString(),
  totalItems: Array.isArray(productsData) ? productsData.length : 0,
  groups: sortedKeys.map((key) => ({ key, count: (groups.get(key) || []).length })),
};
writeFileSync(resolve(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));

console.log(`Generated ${sortedKeys.length} shards, total items=${manifest.totalItems}`);
for (const row of manifest.groups) {
  console.log(`${row.key}: ${row.count}`);
}
