import type { Product } from "../types";

const normalizeSearchText = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const compactMarketingTitle = (value: string) => {
  const cleaned = value
    .replace(/【[^】]*】/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const firstSegment = cleaned.split(/\s*(?:,|–|—|\|| - )\s*/)[0]?.trim() || cleaned;
  if (firstSegment.length <= 82) return firstSegment;
  return `${firstSegment.slice(0, 79).trim()}...`;
};

export const getProductSeoTitle = (productOrName?: Product | string | null) => {
  const source = typeof productOrName === "string"
    ? productOrName
    : [productOrName?.brand, productOrName?.name].filter(Boolean).join(" ");
  const normalized = normalizeSearchText(source);

  if (normalized.includes("infans")) return "INFANS All-Terrain Jogging Stroller";
  if (normalized.includes("jmmd")) return "JMMD Convertible Balance Bike";
  if (normalized.includes("glerc") && normalized.includes("rover")) return "Glerc Rover 12\" Kids Bike";
  if (normalized.includes("green mini") || (normalized.includes("green") && normalized.includes("scooter"))) return "Green Mini 3-Wheel Kids Scooter";

  return compactMarketingTitle(source) || "KIDSMOBI product image";
};

export const getProductImageAlt = (productOrName?: Product | string | null) => getProductSeoTitle(productOrName);