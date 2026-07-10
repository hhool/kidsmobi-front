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

export const getProductsPageSeoTitle = (productOrName?: Product | string | null) => {
  const source = typeof productOrName === "string"
    ? productOrName
    : [productOrName?.brand, productOrName?.name].filter(Boolean).join(" ");
  const normalized = normalizeSearchText(source);

  if (normalized.includes("baby trend") && normalized.includes("passport") && normalized.includes("switch")) return "Baby Trend Passport Switch Modular Stroller";
  if (normalized.includes("baby trend") && normalized.includes("ez lift") && normalized.includes("stroller")) return "Baby Trend EZ-Lift Stroller Travel System";
  if (normalized.includes("baby trend") && (normalized.includes("double") || normalized.includes("twin"))) return "Baby Trend Double Twin Stroller";
  if (normalized.includes("chicco") && normalized.includes("bravo")) return "Chicco Bravo Duo Twin Stroller";
  if (normalized.includes("glerc") && normalized.includes("kids bike")) return "Glerc Kids Bike";
  if (normalized.includes("dream on me") && normalized.includes("coast rider")) return "Dream On Me Coast Rider Travel Stroller";
  if (normalized.includes("dream on me") && normalized.includes("scooter")) return "Dream On Me Kids Electric Scooter";
  if (normalized.includes("mompush") && normalized.includes("nexis") && normalized.includes("carbon")) return "Mompush Nexis Carbon Travel Stroller";
  if (normalized.includes("jmmd")) return "JMMD 6-in-1 Convertible Toddler Bike";
  if (normalized.includes("kriddo")) return "KRIDDO Toddler Balance Bike";
  if (normalized.includes("sereed")) return "SEREED Toddler Balance Bike";
  if (normalized.includes("gamfeiny")) return "Gamfeiny Illuminated Toddler Balance Bike";
  if (normalized.includes("colorful lighting") && normalized.includes("balance bike")) return "Colorful LED Toddler Balance Bike";
  if (normalized.includes("umatoll")) return "Umatoll Illuminated Toddler Balance Bike";
  if (normalized.includes("retrospec") && normalized.includes("cricket")) return "Retrospec Cricket Toddler Balance Bike";

  return getProductSeoTitle(productOrName);
};