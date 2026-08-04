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

const MATERIAL_SPEC_KEYS = new Set([
  "frame_material",
  "seat_material",
  "material",
  "canopy_material",
  "tire",
  "tire_material",
  "tire_type",
]);

const SAFETY_VALUE_ZH: Record<string, string> = {
  "3 point": "三点式安全带",
  "3-point": "三点式安全带",
  "3-point harness": "三点式安全带",
  "5 point": "五点式安全带",
  "5-point": "五点式安全带",
  "5-point harness": "五点式安全带",
  "five-point harness": "五点式安全带",
  "no stroller brake system": "无推车制动系统",
  "parking / foot brake": "驻车制动 / 脚刹",
  "rear wheel brake / lock": "后轮制动 / 锁止",
  "stroller brake system": "推车制动系统",
};

const MATERIAL_VALUE_ZH: Array<[RegExp, string]> = [
  [/fabric\s*,\s*specifically\s+polyester/gi, "面料，具体为聚酯纤维"],
  [/fabric"\s+or\s+"breathable\s+mesh/gi, "面料或透气网布"],
  [/pine\s+wood\s*,\s*engineered\s+wood\s*,?\s*and\s+wood\s+composites/gi, "松木、工程木和木质复合材料"],
  [/ethylene\s+vinyl\s+acetate\s*\(eva\)/gi, "乙烯-醋酸乙烯酯（EVA）"],
  [/polyester\s+with\s+sun-protective\s+coating/gi, "带防晒涂层的聚酯纤维"],
  [/a\s+fabric\s+with\s+uv\s+protection\s+properties/gi, "具有防紫外线性能的面料"],
  [/high-density\s+breathable\s+linen\s+materialand/gi, "高密度透气亚麻材质"],
  [/plastic\s+and\/or\s+rubber/gi, "塑料和/或橡胶"],
  [/rubber\s+or\s+plastic/gi, "橡胶或塑料"],
  [/metal\s+and\s+plastic/gi, "金属和塑料"],
  [/eva\s+foam\s+wheel/gi, "EVA 发泡轮"],
  [/eva\s+foam\s*\/\s*flat-free/gi, "EVA 发泡免充气轮胎"],
  [/high[\s-]*carbon\s+steel/gi, "高碳钢"],
  [/stainless\s+steel/gi, "不锈钢"],
  [/alloy\s+steel/gi, "合金钢"],
  [/steel\s+frame/gi, "钢制车架"],
  [/iron\s+frame/gi, "铁制车架"],
  [/aluminum\s+alloy/gi, "铝合金"],
  [/aluminium\s+alloy/gi, "铝合金"],
  [/carbon\s+fiber/gi, "碳纤维"],
  [/engineering\s+plastic/gi, "工程塑料"],
  [/100%\s*polyester/gi, "100% 聚酯纤维"],
  [/300d\s+polyester/gi, "300D 聚酯纤维"],
  [/black\s+polyester/gi, "黑色聚酯纤维"],
  [/breathable\s+mesh/gi, "透气网布"],
  [/oxford\s+cloth/gi, "牛津布"],
  [/linen\s+type/gi, "亚麻类面料"],
  [/faux\s+leather/gi, "人造革"],
  [/sun-protective\s+coating/gi, "防晒涂层"],
  [/flat[\s-]*free/gi, "免充气"],
  [/all[\s-]*terrain/gi, "全地形"],
  [/composite/gi, "复合材料"],
  [/thermoplastic/gi, "热塑性塑料"],
  [/polyethylene/gi, "聚乙烯"],
  [/polypropylene/gi, "聚丙烯"],
  [/\bhdpe\b/gi, "高密度聚乙烯"],
  [/\bpolyester\b/gi, "聚酯纤维"],
  [/\baluminum\b/gi, "铝合金"],
  [/\baluminium\b/gi, "铝合金"],
  [/\bfabric\b/gi, "面料"],
  [/\brubber\b/gi, "橡胶"],
  [/\bplastic\b/gi, "塑料"],
  [/\bmetal\b/gi, "金属"],
  [/\bsteel\b/gi, "钢"],
  [/\biron\b/gi, "铁"],
  [/\blinen\b/gi, "亚麻"],
  [/\bmesh\b/gi, "网布"],
  [/\boxford\b/gi, "牛津布"],
  [/\bfoam\b/gi, "泡棉"],
  [/\bcotton\b/gi, "棉"],
  [/\bresin\b/gi, "树脂"],
  [/\bpneumatic\b/gi, "充气轮胎"],
  [/\bsolid\b/gi, "实心"],
  [/\bheavy\s+duty\b/gi, "重型"],
  [/\bultra\s+lightweight\b/gi, "超轻量"],
  [/\bstandard\b/gi, "标准"],
];

export function localizeMaterialDisplayValue(rawValue: string, lang: SpecLang): string {
  const text = String(rawValue || "").trim();
  if (lang !== "zh" || !text) return text;
  return MATERIAL_VALUE_ZH.reduce(
    (localized, [pattern, replacement]) => localized.replace(pattern, replacement),
    text
  );
}

export function localizeSafetyDisplayValue(rawValue: string, lang: SpecLang): string {
  const text = String(rawValue || "").trim();
  if (lang !== "zh" || !text) return text;
  return SAFETY_VALUE_ZH[text.toLowerCase()] || text;
}

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

  const lower = text.toLowerCase();
  if (["n/a", "na", "none", "null", "undefined", "unknown", "not applicable", "not available"].includes(lower)) {
    return "";
  }

  if (lang !== "zh") {
    return text;
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

  if (MATERIAL_SPEC_KEYS.has(key)) {
    return localizeMaterialDisplayValue(text, lang);
  }

  if (key === "harness_type" || key === "brake") {
    return localizeSafetyDisplayValue(text, lang);
  }

  if (/^\d+(?:\.\d+)?\s*pounds?$/i.test(text)) {
    return text.replace(/\s*pounds?$/i, " 磅");
  }

  if (/^\d+(?:\.\d+)?\s*inch(?:es)?$/i.test(text)) {
    return text.replace(/\s*inch(?:es)?$/i, " 英寸");
  }

  return text;
}