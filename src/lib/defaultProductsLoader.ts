import type { Product } from "../types";

let defaultProductsDataPromise: Promise<Product[]> | null = null;

const SHARD_IMPORTERS = {
  baby_carrier: () => import("../data/modelsDataShards/baby_carrier.json"),
  balance_bike: () => import("../data/modelsDataShards/balance_bike.json"),
  car_seat: () => import("../data/modelsDataShards/car_seat.json"),
  double_stroller: () => import("../data/modelsDataShards/double_stroller.json"),
  electric_vehicles: () => import("../data/modelsDataShards/electric_vehicles.json"),
  high_chair: () => import("../data/modelsDataShards/high_chair.json"),
  kids_bikes: () => import("../data/modelsDataShards/kids_bikes.json"),
  kids_scooters: () => import("../data/modelsDataShards/kids_scooters.json"),
  kids_tricycles: () => import("../data/modelsDataShards/kids_tricycles.json"),
  playard: () => import("../data/modelsDataShards/playard.json"),
  stroller: () => import("../data/modelsDataShards/stroller.json"),
} as const;

type ShardKey = keyof typeof SHARD_IMPORTERS;

const normalizeProducts = (products: unknown[]): Product[] => {
  const source = Array.isArray(products) ? products : [];
  return source.map((product) => ({
    ...(product as Product),
    status: (String((product as any)?.status || "published").trim().toLowerCase() || "published") as "draft" | "published" | "archived",
  }));
};

export function loadDefaultProductsData(selectedShards?: ShardKey[]): Promise<Product[]> {
  defaultProductsDataPromise ??= Promise.all(
    Object.values(SHARD_IMPORTERS).map((loadShard) => loadShard())
  )
    .then((modules) => modules.flatMap((module) => (Array.isArray(module.default) ? module.default : [])))
    .then((products) => normalizeProducts(products))
    .catch((error) => {
      console.warn("Shard-based default products load failed, returning empty fallback.", error);
      return [] as Product[];
    });

  if (!selectedShards || selectedShards.length === 0) {
    return defaultProductsDataPromise;
  }

  return Promise.all(selectedShards.map((key) => SHARD_IMPORTERS[key]()))
    .then((modules) => modules.flatMap((module) => (Array.isArray(module.default) ? module.default : [])))
    .then((products) => normalizeProducts(products))
    .catch(() => defaultProductsDataPromise!);
}
