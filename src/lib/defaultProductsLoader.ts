import type { Product } from "../types";

let defaultProductsDataPromise: Promise<Product[]> | null = null;

export function loadDefaultProductsData(): Promise<Product[]> {
  defaultProductsDataPromise ??= import("../data/modelsData").then(({ productsData }) => {
    const source = Array.isArray(productsData) ? productsData : [];
    return source.map((product) => ({
      ...product,
      status: (String((product as any)?.status || "published").trim().toLowerCase() || "published") as "draft" | "published" | "archived",
    }));
  });

  return defaultProductsDataPromise;
}
