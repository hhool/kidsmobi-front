import type { Product } from "../types";

const stripEnglishArticles = (value: string) => String(value || "").replace(/\b(?:a|an|the)\b/gi, " ").replace(/\s+/g, " ").trim();
const normalizeSearchText = (value: string) => stripEnglishArticles(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const compactText = (value: string) => String(value || "").replace(/\s+/g, " ").trim();

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function collapseDuplicatedLeadingPhrase(value: string): string {
  let text = compactText(value);
  if (!text) return text;

  // Prefer longer phrase matches first, then single-token fallback.
  const phraseSizes = [3, 2, 1];
  for (const size of phraseSizes) {
    const words = text.split(" ");
    if (words.length < size * 2) continue;
    const candidate = words.slice(0, size).join(" ");
    const escaped = escapeRegExp(candidate);
    const duplicatedPattern = new RegExp(`^(${escaped})(\\s+\\1)+\\b\\s*`, "i");
    const next = text.replace(duplicatedPattern, "$1 ").trim();
    if (next !== text) {
      text = next;
    }
  }
  return text;
}

function buildDisplaySource(brand?: string | null, name?: string | null): string {
  const brandText = compactText(brand || "");
  let nameText = collapseDuplicatedLeadingPhrase(name || "");

  if (brandText && nameText) {
    const repeatedLeadingBrand = new RegExp(`^(?:${escapeRegExp(brandText)}\\s+){1,3}`, "i");
    nameText = nameText.replace(repeatedLeadingBrand, "").trim() || brandText;
  }

  if (!brandText) return nameText;
  if (!nameText) return brandText;

  const brandPattern = new RegExp(`^${escapeRegExp(brandText)}(?:\\b|\\s)`, "i");
  if (brandPattern.test(nameText)) {
    return collapseDuplicatedLeadingPhrase(nameText);
  }
  return collapseDuplicatedLeadingPhrase(`${brandText} ${nameText}`);
}

const compactMarketingTitle = (value: string) => {
  const cleaned = stripEnglishArticles(value)
    .replace(/【[^】]*】/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const firstSegment = cleaned.split(/\s*(?:,|–|—|\|| - )\s*/)[0]?.trim() || cleaned;
  if (firstSegment.length <= 82) return firstSegment;
  return firstSegment.slice(0, 82).trim();
};

export const getProductSeoTitle = (productOrName?: Product | string | null) => {
  const source = typeof productOrName === "string"
    ? collapseDuplicatedLeadingPhrase(productOrName)
    : buildDisplaySource(productOrName?.brand, productOrName?.name);
  const normalized = normalizeSearchText(source);

  if (normalized.includes("infans")) return "INFANS All-Terrain Jogging Stroller";
  if (normalized.includes("jmmd")) return "JMMD Convertible Balance Bike";
  if (normalized.includes("glerc") && normalized.includes("rover")) return "Glerc Rover 12\" Kids Bike";
  if (normalized.includes("green mini") || (normalized.includes("green") && normalized.includes("scooter"))) return "Green Mini 3-Wheel Kids Scooter";

  return compactMarketingTitle(source) || "BalanceBikeToddler product image";
};

export const getProductImageAlt = (productOrName?: Product | string | null) => getProductSeoTitle(productOrName);

export const getProductsPageSeoTitle = (productOrName?: Product | string | null) => {
  const source = typeof productOrName === "string"
    ? productOrName
    : buildDisplaySource(productOrName?.brand, productOrName?.name);
  const normalized = normalizeSearchText(source);

  if (normalized.includes("baby trend") && normalized.includes("passport") && normalized.includes("switch")) return "Baby Trend Passport Switch Modular Stroller";
  if (normalized.includes("baby trend") && normalized.includes("ez lift") && normalized.includes("stroller")) return "Baby Trend EZ-Lift Stroller Travel System";
  if (normalized.includes("baby trend") && (normalized.includes("double") || normalized.includes("twin"))) return "Baby Trend Twin Stroller";
  if (normalized.includes("chicco") && normalized.includes("bravo")) return "Chicco Bravo Duo Twin Stroller";
  if (normalized.includes("glerc") && normalized.includes("rover")) return "Glerc Rover 12\" Kids Bike";
  if (normalized.includes("glerc") && normalized.includes("bmx")) return "Glerc BMX Style Kids Bike";
  if (normalized.includes("glerc") && (normalized.includes("petal") || normalized.includes("princess"))) return "Glerc Petal Princess Bike";
  if (normalized.includes("weize")) return "Weize Dual Suspension Kids Bike";
  if (normalized.includes("glerc") && normalized.includes("kids bike")) return "Glerc Kids Bike";
  if (normalized.includes("dream on me") && normalized.includes("coast rider")) return "Dream On Me Coast Rider Travel Stroller";
  if (normalized.includes("dream on me") && normalized.includes("scooter")) return "Dream On Me Kids Electric Scooter";
  if (normalized.includes("mompush") && normalized.includes("nexis") && normalized.includes("carbon")) return "Mompush Nexis Carbon Travel Stroller";
  if (normalized.includes("jmmd")) return "JMMD 6-in-1 Convertible Toddler Bike";
  if (normalized.includes("kriddo")) return "KRIDDO Toddler Balance Bike";
  if (normalized.includes("sereed")) return "SEREED Toddler Balance Bike";
  if (normalized.includes("gamfeiny")) return "Gamfeiny Toddler Balance Bike";
  if (normalized.includes("colorful") && normalized.includes("glow") && normalized.includes("balance bike")) return "Colorful Glow Wheel Toddler Balance Bike";
  if (normalized.includes("colorful lighting") && normalized.includes("balance bike")) return "Toddler Balance Bike";
  if (normalized.includes("umatoll")) return "Umatoll Toddler Balance Bike";
  if (normalized.includes("retrospec") && normalized.includes("cricket")) return "Retrospec Cricket Toddler Balance Bike";

  return getProductSeoTitle(productOrName);
};

function resolveMinimumTargetAge(product: Product): number | null {
  const sources = [compactText(product.name), compactText(product.ageRange)];

  for (const source of sources) {
    const monthMatch = source.match(/(\d+(?:\.\d+)?)\s*(?:-|–|—|to)\s*\d+(?:\.\d+)?\s*months?/i)
      || source.match(/(?:ages?\s*)?(\d+(?:\.\d+)?)\s*months?/i);
    if (monthMatch) return Number(monthMatch[1]) / 12;

    const yearRangeMatch = source.match(/(?:ages?\s*)?(\d+(?:\.\d+)?)\s*(?:-|–|—|to)\s*\d+(?:\.\d+)?\s*(?:years?|yrs?|y\b)/i);
    if (yearRangeMatch) return Number(yearRangeMatch[1]);

    const yearMatch = source.match(/(?:ages?\s*)?(\d+(?:\.\d+)?)\s*(?:years?|yrs?|year[ -]?olds?|y\b)/i);
    if (yearMatch) return Number(yearMatch[1]);
  }

  return null;
}

function resolveZhCategoryTitle(category: string, text: string): string {
  if (category === "balance" || category === "balance_bike" || category === "balance_bikes") return "平衡车";
  if (category === "bicycle" || category === "kids_bikes") return "儿童自行车";
  if (category === "electric_car" || category === "electric_vehicles") return "儿童电动车";
  if (category === "car_seat" || category === "car_seats" || category === "safety_seat") return "儿童安全座椅";
  if (category === "tricycle") return "儿童三轮车";
  if (category === "scooter" || category === "scooters" || category === "kids_scooters") {
    return /\belectric\b/.test(text) ? "儿童电动滑板车" : "儿童滑板车";
  }
  if (category === "stroller" || category === "jogger_stroller" || category === "double_stroller") {
    if (/\b(?:jogger|jogging|runner)\b/.test(text)) return "慢跑推车";
    if (/\b(?:double|twin)\b/.test(text)) return "双人推车";
    if (/\b(?:travel|compact|lightweight|umbrella|portable|cabin)\b/.test(text)) return "旅行推车";
    return "婴儿推车";
  }
  return "儿童出行装备";
}

/**
 * Physical power-type detection for scooters, based strictly on identity
 * fields (product names + explicit specs). Never consults marketing copy.
 * Returns true only for battery/motor-powered scooters.
 */
export function isElectricScooterProduct(product: Product, identityTextOverride?: string): boolean {
  const identityText = identityTextOverride !== undefined
    ? identityTextOverride
    : [
        product.name,
        (product as Product & { en?: { name?: string } }).en?.name,
        (product as Product & { zh?: { name?: string } }).zh?.name,
        String((product as Product & { Product_Specifications?: Record<string, unknown> })?.Product_Specifications?.is_electric ?? ""),
      ]
        .map((value) => compactText(value || "").toLowerCase())
        .join(" ");
  return isElectricScooter(product, identityText);
}

function isElectricScooter(product: Product, identityText: string): boolean {
  // Explicit spec flag wins when present.
  const specFlag = (product as Product & { Product_Specifications?: Record<string, unknown> })?.Product_Specifications?.is_electric;
  if (typeof specFlag === "boolean") return specFlag;
  if (specFlag === "true" || specFlag === "1" || specFlag === 1) return true;
  if (specFlag === "false" || specFlag === "0" || specFlag === 0) return false;
  if (typeof specFlag === "string" && /^(yes|y|是)$/i.test(specFlag.trim())) return true;
  if (typeof specFlag === "string" && /^(no|n|否)$/i.test(specFlag.trim())) return false;

  return /\belectric\b|\be-?\s?scooter\b|\b\d{1,4}\s*(?:v|volt)s?\b|\b\d{2,4}\s*w(?:att)?s?\b/.test(identityText);
}

export function getProductDisplayTitle(product: Product, lang: "zh" | "en"): string {
  const localized = product as Product & {
    categoryId?: string;
    zh?: { name?: string };
    en?: { name?: string };
  };
  // Identity fields only: names and explicit specs. Descriptions/verdicts are
  // excluded here because scraped copy can mention "electric" incidentally
  // (cross-sell text, safety notes), which used to mislabel kick scooters.
  const identityText = [
    localized.name,
    localized.en?.name,
    localized.zh?.name,
    String((localized as Product & { Product_Specifications?: Record<string, unknown> })?.Product_Specifications?.is_electric ?? ""),
  ]
    .map((value) => compactText(value || "").toLowerCase())
    .join(" ");
  const text = [
    localized.name,
    localized.en?.name,
    localized.zh?.name,
    (localized as Product & { description?: string }).description,
    (localized as Product & { zh?: { description?: string } }).zh?.description,
    (localized as Product & { en?: { description?: string } }).en?.description,
    (localized as Product & { editorVerdict?: string }).editorVerdict,
    (localized as Product & { zh?: { editorVerdict?: string } }).zh?.editorVerdict,
    (localized as Product & { en?: { editorVerdict?: string } }).en?.editorVerdict,
  ]
    .map((value) => compactText(value || "").toLowerCase())
    .join(" ");
  const category = compactText(String(localized.categoryId || localized.category)).toLowerCase();
  const brand = compactText(localized.brand);
  const isStroller = category === "stroller" || category === "jogger_stroller" || category === "double_stroller";
  const isBalanceBike = category === "balance" || category === "balance_bike" || category === "balance_bikes";
  const isScooter = category === "scooter" || category === "scooters" || category === "kids_scooters";
  const isKidsBike = category === "bicycle" || category === "kids_bikes";
  const isKidsElectricCar = category === "electric_car" || category === "electric_vehicles";
  const isKidsCarSeat = category === "car_seat" || category === "car_seats" || category === "safety_seat";

  if (isBalanceBike && lang === "zh") {
    return [brand, "儿童平衡车"].filter(Boolean).join(" ");
  }

  if (isScooter) {
    if (isElectricScooter(localized, identityText)) {
      return [brand, lang === "zh" ? "儿童电动滑板车" : "Kids Electric Scooter"].filter(Boolean).join(" ");
    }
    return lang === "zh" ? "儿童滑板车" : "Kids Scooter";
  }

  if (isKidsBike) {
    const isToddlerBike = (resolveMinimumTargetAge(localized) ?? Number.POSITIVE_INFINITY) < 4;
    const type = isToddlerBike
      ? (lang === "zh" ? "儿童自行车" : "Toddler Bike")
      : (lang === "zh" ? "儿童自行车" : "Kids Bike");
    return [brand, type].filter(Boolean).join(" ");
  }

  if (isKidsElectricCar) {
    return [brand, lang === "zh" ? "儿童电动车" : "Kids Electric Car"].filter(Boolean).join(" ");
  }

  if (isKidsCarSeat) {
    return [brand, lang === "zh" ? "儿童安全座椅" : "Kids Car Seat"].filter(Boolean).join(" ");
  }

  if (!isStroller) {
    if (lang === "zh") {
      const zhType = resolveZhCategoryTitle(category, text);
      return [brand, zhType].filter(Boolean).join(" ") || zhType;
    }
    return getProductsPageSeoTitle(localized);
  }

  const strollerBrand = brand;
  let type: string;
  if (/\b(?:jogger|jogging|runner)\b/.test(text)) {
    type = lang === "zh" ? "慢跑推车" : "Jogging Stroller";
  } else if (/\b(?:double|twin)\b/.test(text)) {
    type = lang === "zh" ? "双人推车" : "Twin Stroller";
  } else if (/\btravel(?:\s+system)?\b/.test(text) || /\b(?:lightweight|umbrella|compact|portable|cabin)\b/.test(text)) {
    type = lang === "zh" ? "旅行推车" : "Travel Stroller";
  } else {
    type = lang === "zh" ? "标准推车" : "Standard Stroller";
  }

  return [strollerBrand, type].filter(Boolean).join(" ");
}

/**
 * SKU-level display title built from the product's own name, e.g.
 * "Baby Trend Expedition Race Tec PLUS Jogger Stroller" instead of the
 * generic "<Brand> Jogging Stroller" / "<Brand> Kids Electric Scooter"
 * placeholders. Generic category titles repeat across cards (header
 * cannibalization) and hide the exact model keywords real shoppers search.
 * Falls back to the curated/generic display title when the record has no
 * usable product name.
 */
export function getProductSkuTitle(product: Product, lang: "zh" | "en"): string {
  const localized = product as Product & {
    zh?: { name?: string };
    en?: { name?: string };
  };
  const brand = compactText(localized.brand);
  // zh keeps using the localized name only — falling back to the raw English
  // scrape on a Chinese page is worse than the generic category title.
  const rawName = lang === "zh"
    ? compactText(localized.zh?.name || "")
    : compactText(localized.en?.name || localized.name);
  if (!rawName) {
    return getProductDisplayTitle(product, lang);
  }
  // First marketing segment only: Amazon-style names append color/size/
  // bundle tails after commas, pipes and dashes ("Razor A Kick Scooter for
  // Kids - Lightweight, Foldable, ...") — keep "Razor A Kick Scooter for Kids".
  let core = rawName.split(/\s*(?:[,，|]|\s+-\s+|\s+–\s+|\s+—\s+)\s*/)[0]?.trim() || rawName;
  if (brand) {
    // Drop a duplicated leading brand so the normalized brand is prepended once.
    const leadingBrand = new RegExp(`^(?:${escapeRegExp(brand)}\\s+){1,3}`, "i");
    core = core.replace(leadingBrand, "").trim() || core;
  }
  core = core.replace(/[®©™]/g, "").replace(/\s+/g, " ").trim();
  const title = [brand, core].filter(Boolean).join(" ").trim();
  return title || getProductDisplayTitle(product, lang);
}