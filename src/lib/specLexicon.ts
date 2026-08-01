export type SpecLang = "zh" | "en";

type BilingualLabel = {
  en: string;
  zh: string;
};

export const SPEC_FIELD_LEXICON: Record<string, BilingualLabel> = {
  item_weight: { en: "Item Weight", zh: "商品重量" },
  price: { en: "Price", zh: "价格" },
  brand: { en: "Brand", zh: "品牌" },
  category: { en: "Category", zh: "类目" },
  age_range: { en: "Age Range", zh: "适龄范围" },
  wheel_size: { en: "Wheel Size", zh: "轮径" },
  harness_type: { en: "Harness Type", zh: "安全带类型" },
  brake: { en: "Brake", zh: "制动类型" },
  frame_material: { en: "Frame Material", zh: "车架材质" },
  seat_material: { en: "Seat Material", zh: "座椅材质" },
  material: { en: "Material", zh: "材质" },
  canopy_material: { en: "Canopy Material", zh: "顶篷材质" },
  tire: { en: "Tire", zh: "轮胎" },
  tire_type: { en: "Tire Type", zh: "轮胎类型" },
};

const CATEGORY_VALUE_ZH: Record<string, string> = {
  stroller: "婴儿推车",
  balance: "平衡车",
  balance_bike: "平衡车",
  bicycle: "儿童自行车",
  kids_bikes: "儿童自行车",
  scooter: "儿童滑板车",
  kids_scooters: "儿童滑板车",
  electric_car: "儿童电动车",
  electric_vehicles: "儿童电动车",
  safety_seat: "安全座椅",
  car_seat: "安全座椅",
};

function humanizeEnglishKey(rawKey: string): string {
  return String(rawKey || "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

export function toSpecKey(rawKey: string): string {
  return String(rawKey || "")
    .trim()
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

export function getSpecFieldLabel(rawKey: string, lang: SpecLang): string {
  const key = toSpecKey(rawKey);
  const entry = SPEC_FIELD_LEXICON[key];
  if (entry) {
    return lang === "zh" ? entry.zh : entry.en;
  }
  return humanizeEnglishKey(rawKey);
}

export function normalizeSpecDisplayValue(rawValue: string, rawKey: string, lang: SpecLang): string {
  const key = toSpecKey(rawKey);
  const text = String(rawValue || "").trim();
  if (!text) return "";

  if (lang !== "zh") {
    return text;
  }

  const lower = text.toLowerCase();
  if (lower === "n/a" || lower === "na" || lower === "none") {
    return "暂无";
  }
  if (lower === "unknown") {
    return "未知";
  }

  if (key === "category") {
    const normalized = text.toLowerCase();
    return CATEGORY_VALUE_ZH[normalized] || text;
  }

  if (key === "age_range") {
    const items = text
      .split("|")
      .map((item) => item.trim())
      .filter(Boolean);
    const uniqueItems = [...new Set(items)];
    return uniqueItems.join(" / ");
  }

  if (/^\d+(?:\.\d+)?\s*pounds?$/i.test(text)) {
    return text.replace(/\s*pounds?$/i, " 磅");
  }

  if (/^\d+(?:\.\d+)?\s*inch(?:es)?$/i.test(text)) {
    return text.replace(/\s*inch(?:es)?$/i, " 英寸");
  }

  return text;
}