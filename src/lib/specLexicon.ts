export type SpecLang = "zh" | "en";

type BilingualLabel = {
  en: string;
  zh: string;
};

export const SPEC_FIELD_LEXICON: Record<string, BilingualLabel> = {
  item_weight: { en: "Item Weight", zh: "商品重量" },
  price: { en: "Price", zh: "价格" },
  brand: { en: "Brand", zh: "品牌" },
  color: { en: "Color", zh: "颜色" },
  category: { en: "Category", zh: "类目" },
  age_range: { en: "Age Range", zh: "适龄范围" },
  age_range_description: { en: "Age Range Description", zh: "适龄描述" },
  number_of_wheels: { en: "Number of Wheels", zh: "轮子个数" },
  wheel_size: { en: "Wheel Size", zh: "轮径" },
  wheel_type: { en: "Wheel Type", zh: "车轮类型" },
  grip_type: { en: "Grip Type", zh: "握把类型" },
  handlebar_type: { en: "Handlebar Type", zh: "车把类型" },
  handlebar_height: { en: "Handlebar Height", zh: "车把高度" },
  adjustable_handlebar_height: { en: "Adjustable Handlebar Height", zh: "可调节车把高度" },
  harness_type: { en: "Harness Type", zh: "安全带类型" },
  brake: { en: "Brake", zh: "制动类型" },
  frame_material: { en: "Frame Material", zh: "车架材质" },
  seat_material: { en: "Seat Material", zh: "座椅材质" },
  material: { en: "Material", zh: "材质" },
  canopy_material: { en: "Canopy Material", zh: "顶篷材质" },
  tire: { en: "Tire", zh: "轮胎" },
  tire_type: { en: "Tire Type", zh: "轮胎类型" },
  folded_size: { en: "Folded Size", zh: "折叠尺寸" },
  rear_facing_stroller_maximum_height: { en: "Rear Facing Stroller Maximum Height", zh: "后向推车最大身高" },
  frame_weight: { en: "Frame Weight", zh: "车架重量" },
  stroller_seat_weight: { en: "Stroller Seat Weight", zh: "推车座椅重量" },
  basket_weight_capacity_maximum: { en: "Basket Weight Capacity Maximum", zh: "置物篮最大承重" },
  item_dimensions_l_x_w_x_h: { en: "Item Dimensions L x W x H", zh: "外形尺寸（长x宽x高）" },
  back_wheel_diameter: { en: "Back Wheel Diameter", zh: "后轮直径" },
  front_wheel_diameter: { en: "Front Wheel Diameter", zh: "前轮直径" },
  car_seat_weight_capacity_maximum: { en: "Car Seat Weight Capacity Maximum", zh: "安全座椅最大承重" },
  stroller_type: { en: "Stroller Type", zh: "推车类型" },
  is_car_seat_compatible: { en: "Is Car Seat Compatible", zh: "是否兼容安全座椅" },
  harness_feature: { en: "Harness Feature", zh: "安全带特性" },
  seating_capacity: { en: "Seating Capacity", zh: "座位容量" },
  seat_capacity: { en: "Seat Capacity", zh: "座位容量" },
  additional_features: { en: "Additional Features", zh: "附加功能" },
  built_in_light: { en: "Built-in Light", zh: "内置照明" },
  is_electric: { en: "Is Electric", zh: "是否电动" },
  has_stroller_brake_system: { en: "Has Stroller Brake System", zh: "是否配备推车制动系统" },
  has_stroller_braking_system: { en: "Has Stroller Braking System", zh: "是否配备推车制动系统" },
  compatible_car_seat_models: { en: "Compatible Car Seat Models", zh: "兼容安全座椅型号" },
  material_type: { en: "Material Type", zh: "材质类型" },
  care_instructions: { en: "Care Instructions", zh: "护理说明" },
  tire_material: { en: "Tire Material", zh: "轮胎材质" },
  fabric_type: { en: "Fabric Type", zh: "面料类型" },
  included_components: { en: "Included Components", zh: "包装内组件" },
  import_designation: { en: "Import Designation", zh: "进口标识" },
  unit_count: { en: "Unit Count", zh: "单位数量" },
  weight_capacity_maximum: { en: "Weight Capacity Maximum", zh: "最大承重" },
  item_dimensions: { en: "Item Dimensions", zh: "外形尺寸" },
  sub_brand: { en: "Sub Brand", zh: "子品牌" },
  asin: { en: "ASIN", zh: "ASIN 编号" },
  model_number: { en: "Model Number", zh: "型号" },
  manufacturer_warranty_description: { en: "Manufacturer Warranty Description", zh: "厂商保修信息" },
  wheel_material: { en: "Wheel Material", zh: "轮材质" },
  frame_material_type: { en: "Frame Material Type", zh: "车架材质类型" },
  suspension_type: { en: "Suspension Type", zh: "避震类型" },
  brake_style: { en: "Brake Style", zh: "刹车样式" },
  brake_system: { en: "Brake System", zh: "制动系统" },
  adjusable_seat: { en: "Adjustable Seat", zh: "可调节座椅" },
  adjustable_seat: { en: "Adjustable Seat", zh: "可调节座椅" },
  kick_scooter: { en: "Kick Scooter", zh: "滑板车" },
  colorful_lighting_toys: { en: "Colorful Lighting Toys", zh: "彩灯玩具" },
  set_name: { en: "Set Name", zh: "套装名称" },
  item_type_name: { en: "Item Type Name", zh: "商品类型名称" },
  theme: { en: "Theme", zh: "主题" },
  manufacturer_minimum_age_months: { en: "Manufacturer Minimum Age (Months)", zh: "制造商建议最小月龄" },
  manufacturer_maximum_age_months: { en: "Manufacturer Maximum Age (Months)", zh: "制造商建议最大月龄" },
  model_name: { en: "Model Name", zh: "型号名称" },
  special_feature: { en: "Special Feature", zh: "特殊功能" },
  bike_type: { en: "Bike Type", zh: "自行车类型" },
  power_source: { en: "Power Source", zh: "动力来源" },
  skill_level: { en: "Skill Level", zh: "技能等级" },
  bicycle_drivetrain_type: { en: "Bicycle Drivetrain Type", zh: "自行车传动类型" },
  warranty_type: { en: "Warranty Type", zh: "保修类型" },
  minimum_user_height: { en: "Minimum User Height", zh: "最小适用身高" },
  size: { en: "Size", zh: "尺寸" },
  number_of_speeds: { en: "Number of Speeds", zh: "变速档位数" },
  number_of_handles: { en: "Number of Handles", zh: "把手数量" },
  specific_uses_for_product: { en: "Specific Uses for Product", zh: "产品适用场景" },
  recommended_uses_for_product: { en: "Recommended Uses for Product", zh: "推荐使用场景" },
  other_special_features_of_the_product: { en: "Other Special Features of the Product", zh: "产品其他特殊功能" },
  warranty_description: { en: "Warranty Description", zh: "保修说明" },
  is_autographed: { en: "Is Autographed", zh: "是否签名款" },
  is_assembly_required: { en: "Is Assembly Required", zh: "是否需要组装" },
  assembly_instructions_description: { en: "Assembly Instructions Description", zh: "组装说明" },
  rear_facing_maximum_weight: { en: "Rear Facing Maximum Weight", zh: "后向最大承重" },
  maximum_weight_recommendation: { en: "Maximum Weight Recommendation", zh: "建议最大承重" },
  specification_met: { en: "Specification Met", zh: "符合标准" },
  installation_type: { en: "Installation Type", zh: "安装类型" },
  brand_name: { en: "Brand Name", zh: "品牌名称" },
  manufacturer: { en: "Manufacturer", zh: "制造商" },
  best_sellers_rank: { en: "Best Sellers Rank", zh: "畅销排名" },
  customer_reviews: { en: "Customer Reviews", zh: "用户评价" },
  seat_type: { en: "Seat Type", zh: "座椅类型" },
  seat_recline: { en: "Seat Recline", zh: "座椅调节" },
  foldability: { en: "Foldability", zh: "折叠方式" },
  weight_limit: { en: "Weight Limit", zh: "承重上限" },
  recommended_age: { en: "Recommended Age", zh: "推荐年龄" },
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
  "material_type",
  "fabric_type",
  "canopy_material",
  "tire",
  "tire_material",
  "tire_type",
  "wheel_material",
  "frame_material_type",
]);

const SAFETY_VALUE_ZH: Record<string, string> = {
  "3 point": "三点式安全带",
  "3 point harness": "三点式安全带",
  "3-point": "三点式安全带",
  "3-point harness": "三点式安全带",
  "5 point": "五点式安全带",
  "5 point harness": "五点式安全带",
  "5-point": "五点式安全带",
  "5-point harness": "五点式安全带",
  "five-point harness": "五点式安全带",
  no: "否",
  "no brake": "无刹车",
  "no brakes": "无刹车",
  brake: "刹车",
  adjustable: "可调节",
  caliper: "钳式刹车",
  coaster: "回踩刹车",
  "disc brake": "碟刹",
  "hand brake": "手刹",
  "hand brakes": "手刹",
  "rim brake": "圈刹",
  "v brake": "V 刹",
  "no stroller brake system": "无推车制动系统",
  "parking / foot brake": "驻车制动 / 脚刹",
  "rear wheel brake / lock": "后轮制动 / 锁止",
  "stroller brake system": "推车制动系统",
};

const COMMON_SPEC_VALUE_ZH: Record<string, string> = {
  yes: "是",
  no: "否",
  true: "是",
  false: "否",
  small: "小号",
  medium: "中号",
  large: "大号",
  "standard stroller": "标准推车",
  "easy to clean": "易于清洁",
  "colorful lighted rear wheels": "彩色发光后轮",
  "lighted rear wheels": "发光后轮",
  "no batteries required": "无需电池",
  "glow wheel": "发光轮",
  "for balance and an adjustable seat to grow with your child": "用于帮助平衡，并配有可随成长调节的座椅",
  "instruction manual": "说明书",
  "kick scooter": "滑板车",
  bike: "自行车",
  "adjustable handle": "可调节把手",
  "adjustable handlebar": "可调节车把",
  "adjustable handlebar height": "可调节车把高度",
  adjustable: "可调节",
  "adjustable straps": "可调节绑带",
  "lightweight design": "轻量化设计",
  "compact size": "紧凑尺寸",
  "one-handed folding mechanism": "单手折叠机制",
  "one handed folding mechanism": "单手折叠机制",
  "one‑handed folding mechanism": "单手折叠机制",
  "uv-protective canopy": "防紫外线顶篷",
  "uv protective canopy": "防紫外线顶篷",
  "ample storage space": "充足储物空间",
  "spacious under-seat basket": "宽敞座下储物篮",
  "spacious under seat basket": "宽敞座下储物篮",
  "no organizer & cushion": "无收纳包与坐垫",
  "no organizer": "无收纳包",
  cushion: "坐垫",
  "wipe clean with a damp cloth. for more detailed cleaning, refer to the manufacturer instructions.": "可用湿布擦拭清洁。更详细的清洁方法请参考制造商说明。",
  "wipe clean with a damp cloth. for more detailed cleaning，refer to the manufacturer instructions.": "可用湿布擦拭清洁。更详细的清洁方法请参考制造商说明。",
  "doll bike seat": "玩偶座椅",
  "extra-wide tires": "加宽轮胎",
  kickstand: "脚撑",
  "pre-assembled with manual tools": "附手动工具并预装配",
  foldable: "可折叠",
  collapsible: "可折叠",
  imported: "进口",
  "infant car seat compatible": "兼容婴儿安全座椅",
  rigid: "硬式",
  beginner: "初学者",
  "pedal power": "脚踏驱动",
  "single-speed": "单速",
  "limited lifetime": "有限终身保修",
  coaster: "回踩刹车",
  "kids bike": "儿童自行车",
  toddler: "幼儿",
  "off-road": "越野",
  bmx: "BMX",
  "training wheel": "辅助轮",
  reflectors: "反光片",
  "chain guard": "链条防护罩",
  "wide tires": "宽胎",
  "adjustable seat": "可调节座椅",
  "bmx style": "BMX 风格",
  "carbon steel": "碳钢",
  "alloy steel": "合金钢",
  "little kid": "幼童",
  "big kid": "大童",
  infant: "婴儿",
  "built for young riders": "为年轻骑行者设计",
  "designed for beginners": "为初学者设计",
  "easy to assemble": "易于组装",
  "easy assembly": "易于组装",
  "adult assembly required": "需成人组装",
  "tools not provided": "不含工具",
  "no tools needed": "无需工具",
  "no assembly required": "无需组装",
  "install the rear": "安装后部",
  "wheels onto the stroller until they click into place": "将后轮推入推车，直到卡扣到位",
  "simply unfold the stroller and adjust the canopy and footrest as needed": "只需展开推车，并按需调整遮阳篷和脚踏",
  "rear wheel": "后轮",
  "rear wheels": "后轮",
  "front wheel": "前轮",
  "front wheels": "前轮",
  "handlebar type": "车把类型",
  "wheel type": "车轮类型",
  "grip type": "握把类型",
  "recommended uses for product": "推荐使用场景",
  "children transportation": "儿童出行",
  "recreational activities for kids": "儿童休闲活动",
  "kid's recreational riding": "儿童休闲骑行",
  "kids recreational riding": "儿童休闲骑行",
  "is electric": "是否电动",
  safety: "安全",
  rating: "评分",
  ergonomic: "人体工学",
  solid: "硬式",
  limited: "有限",
};

const GENERIC_VALUE_ZH_PATTERNS: Array<[RegExp, string]> = [
  [/\bkilograms?\b/gi, "公斤"],
  [/\bkg\b/gi, "公斤"],
  [/\blbs?\b/gi, "磅"],
  [/\bmonths?\b/gi, "个月"],
  [/\byears?\b/gi, "岁"],
  [/\binches?\b/gi, "英寸"],
  [/\bnumber\s+of\s+wheels\b/gi, "轮子数量"],
  [/\bnumber\s+of\s+speeds\b/gi, "变速档位数"],
  [/\bnumber\s+of\s+handles\b/gi, "把手数量"],
  [/\bpower\s+source\b/gi, "动力来源"],
  [/\bspecial\s+feature\b/gi, "特殊功能"],
  [/\bother\s+special\s+features\s+of\s+the\s+product\b/gi, "产品其他特殊功能"],
  [/\brecommended\s+uses\s+for\s+product\b/gi, "推荐使用场景"],
  [/\bkid'?s\s+recreational\s+riding\b/gi, "儿童休闲骑行"],
  [/\bkids\s+recreational\s+riding\b/gi, "儿童休闲骑行"],
  [/\bwarranty\s+description\b/gi, "保修说明"],
  [/\bgrip\s+type\b/gi, "握把类型"],
  [/\bwheel\s+type\b/gi, "车轮类型"],
  [/\bframe\s+weight\b/gi, "车架重量"],
  [/\bstroller\s+seat\s+weight\b/gi, "推车座椅重量"],
  [/\bbasket\s+weight\s+capacity\s+maximum\b/gi, "置物篮最大承重"],
  [/\bassembly\s+instructions\s+description\b/gi, "组装说明"],
  [/\bmaximum\s+weight\s+recommendation\b/gi, "建议最大承重"],
  [/\bspecification\s+met\b/gi, "符合标准"],
  [/\brear\s+facing\s+maximum\s+weight\b/gi, "后向最大承重"],
  [/\binstallation\s+type\b/gi, "安装类型"],
  [/\bimport\s+designation\b/gi, "进口标识"],
  [/\bis\s+electric\b/gi, "是否电动"],
  [/\bsafety\b/gi, "安全"],
  [/\brating\b/gi, "评分"],
  [/\bsuspension\s+type\b/gi, "避震类型"],
  [/\bbrake\s+style\b/gi, "刹车样式"],
  [/\btoddler\s+boys\b/gi, "幼儿男孩"],
  [/\bbaby\s+balance\s+bike\b/gi, "婴儿平衡车"],
  [/\bcolorful\s+lighting\s+toys\b/gi, "彩灯玩具"],
  [/\binstruction\s+manual\b/gi, "说明书"],
  [/\bkick\s+scooter\b/gi, "滑板车"],
  [/\bbike\b/gi, "自行车"],
  [/\bwheel\s+material\b/gi, "轮材质"],
  [/\bframe\s+material\s+type\b/gi, "车架材质类型"],
  [/\bhandlebar\s+type\b/gi, "车把类型"],
  [/\badjustable\s+handlebar\s+height\b/gi, "可调节车把高度"],
  [/\beasy\s+to\s+assemble\b/gi, "易于组装"],
  [/\binstall\s+the\s+rear\b/gi, "安装后部"],
  [/\brear\s+wheels?\b/gi, "后轮"],
  [/\bfront\s+wheels?\b/gi, "前轮"],
  [/\badjustable\s+straps\b/gi, "可调节绑带"],
  [/\blightweight\s+design\b/gi, "轻量化设计"],
  [/\bcompact\s+size\b/gi, "紧凑尺寸"],
  [/\bone[-\s\u2010-\u2015\u2212]?hand(?:ed)?\s+folding\s+mechanism\b/gi, "单手折叠机制"],
  [/\buv[-\s\u2010-\u2015\u2212]?protective\s+canopy\b/gi, "防紫外线顶篷"],
  [/\bample\s+storage\s+space\b/gi, "充足储物空间"],
  [/\bspacious\s+under[-\s\u2010-\u2015\u2212]?seat\s+basket\b/gi, "宽敞座下储物篮"],
];

const UNIT_VALUE_ZH_PATTERNS: Array<[RegExp, string]> = [
  [/(\d+(?:\.\d+)?)\s*["”]/g, "$1 英寸"],
  [/(\d+(?:\.\d+)?)\s*(?:in|inch|inches)\b/gi, "$1 英寸"],
  [/(\d+(?:\.\d+)?)\s*(?:ft|feet)\b/gi, "$1 英尺"],
  [/(\d+(?:\.\d+)?)\s*(?:lb|lbs|pound|pounds)\b/gi, "$1 磅"],
  [/(\d+(?:\.\d+)?)\s*oz\b/gi, "$1 盎司"],
  [/(\d+(?:\.\d+)?)\s*(?:mph|mi\/h)\b/gi, "$1 英里/小时"],
  [/(\d+(?:\.\d+)?)\s*(?:km\/h|kph)\b/gi, "$1 公里/小时"],
  [/(\d+(?:\.\d+)?)\s*cm\b/gi, "$1 厘米"],
  [/(\d+(?:\.\d+)?)\s*mm\b/gi, "$1 毫米"],
  [/(\d+(?:\.\d+)?)\s*kg\b/gi, "$1 公斤"],
  [/(\d+(?:\.\d+)?)\s*g\b/gi, "$1 克"],
];

function normalizeMeasurementUnitsForZh(rawValue: string): string {
  let text = String(rawValue || "")
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return "";

  for (const [pattern, replacement] of UNIT_VALUE_ZH_PATTERNS) {
    text = text.replace(pattern, replacement);
  }

  return text.replace(/\s+/g, " ").trim();
}

function localizeCommonToken(rawToken: string): string {
  const token = String(rawToken || "")
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  if (!token) return "";
  const direct = COMMON_SPEC_VALUE_ZH[token.toLowerCase()];
  if (direct) return direct;
  let localized = normalizeMeasurementUnitsForZh(token);
  for (const [pattern, replacement] of GENERIC_VALUE_ZH_PATTERNS) {
    localized = localized.replace(pattern, replacement);
  }
  return localized;
}

function localizeBestSellersRank(rawValue: string): string {
  let text = String(rawValue || "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  const replacements: Array<[RegExp, string]> = [
    [/sports\s*&\s*outdoors/gi, "运动与户外"],
    [/toys\s*&\s*games/gi, "玩具与游戏"],
    [/\bbaby\b/gi, "母婴"],
    [/kids'?\s*bicycles/gi, "儿童自行车"],
    [/kids'?\s*balance\s*bikes/gi, "儿童平衡车"],
    [/kids'?\s*scooters/gi, "儿童滑板车"],
    [/kids'?\s*strollers/gi, "儿童推车"],
    [/lightweight\s+baby\s+strollers/gi, "轻便婴儿推车"],
    [/lightweight\s+母婴\s+strollers/gi, "轻便婴儿推车"],
    [/see\s+top\s*100\s+in\s+/gi, "查看 "],
    [/\(\s*查看\s+([^)]*?)\s*\)/gi, "（查看 $1 Top 100）"],
    [/\bin\b/gi, "在"],
  ];
  for (const [pattern, replacement] of replacements) {
    text = text.replace(pattern, replacement);
  }
  return text
    .replace(/\s*#\s*/g, " #")
    .replace(/\s*,\s*/g, "，")
    .replace(/\s*\(\s*/g, "（")
    .replace(/\s*\)\s*/g, "）")
    .replace(/\bTop\s*100\b/gi, "前 100")
    .replace(/\s+/g, " ")
    .trim();
}

function localizeCustomerReviews(rawValue: string): string {
  let text = String(rawValue || "").replace(/\s+/g, " ").trim();
  if (!text) return "";

  // Collapse obvious duplicated sequence like "4.6 4.6 out of 5 stars (737) 4.6 out of 5 stars"
  text = text.replace(/^(\d(?:\.\d+)?)\s+\1\s+out\s+of\s+5\s+stars\s*\((\d+)\)\s*\1\s+out\s+of\s+5\s+stars$/i, "$1 out of 5 stars ($2)");

  const scoreMatch = text.match(/(\d(?:\.\d+)?)\s*out\s*of\s*5\s*stars?/i);
  const countMatch = text.match(/\((\d+[\d,]*)\)/);

  if (scoreMatch) {
    const score = scoreMatch[1];
    const count = countMatch?.[1];
    return count ? `${score}/5 星（${count}条评价）` : `${score}/5 星`;
  }

  return localizeCommonToken(text)
    .replace(/customer\s+reviews?/gi, "用户评价")
    .replace(/stars?/gi, "星")
    .replace(/\s+/g, " ")
    .trim();
}

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
  [/carbon\s+steel/gi, "碳钢"],
  [/stainless\s+steel/gi, "不锈钢"],
  [/alloy\s+steel/gi, "合金钢"],
  [/steel\s+frame/gi, "钢制车架"],
  [/iron\s+frame/gi, "铁制车架"],
  [/aluminum\s+alloy/gi, "铝合金"],
  [/aluminium\s+alloy/gi, "铝合金"],
  [/carbon\s+fiber/gi, "碳纤维"],
  [/engineering\s+plastic/gi, "工程塑料"],
  [/polyurethane\s*\(\s*pu\s*\)/gi, "聚氨酯（PU）"],
  [/polyurethane/gi, "聚氨酯"],
  [/aluminum/gi, "铝合金"],
  [/instruction manual/gi, "说明书"],
  [/baby balance bike/gi, "婴儿平衡车"],
  [/toddler boys/gi, "幼儿男孩"],
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
  const direct = SAFETY_VALUE_ZH[text.toLowerCase()];
  if (direct) return direct;

  const localizedParts = text
    .split(/[,;/|；，]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => SAFETY_VALUE_ZH[part.toLowerCase()] || localizeCommonToken(part))
    .filter(Boolean);

  if (localizedParts.length > 1) {
    return localizedParts.join("，");
  }

  return localizeCommonToken(text);
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
  const fallback = humanizeEnglishKey(rawKey);
  return lang === "zh" ? localizeCommonToken(fallback) : fallback;
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

  if (key === "number_of_wheels") {
    const count = text.match(/\d+/)?.[0];
    return count ? `${count} 轮` : text;
  }

  if (key === "manufacturer_minimum_age_months" || key === "manufacturer_maximum_age_months") {
    const count = text.match(/\d+/)?.[0];
    return count ? `${count}个月` : text;
  }

  if (key === "size") {
    const sizeMap: Record<string, string> = {
      small: "小号",
      medium: "中号",
      large: "大号",
      "one size": "均码",
      "one size fits all": "均码",
    };
    return sizeMap[lower] || localizeCommonToken(text);
  }

  if (key === "best_sellers_rank") {
    return localizeBestSellersRank(text);
  }

  if (key === "customer_reviews") {
    return localizeCustomerReviews(text);
  }

  if (key === "unit_count") {
    const count = text.match(/^\d+(?:\.\d+)?/)?.[0];
    if (count) return `${count} 件`;
    return localizeCommonToken(text).replace(/\bcount\b/gi, "件");
  }

  if (key === "seating_capacity" || key === "seat_capacity") {
    const count = text.match(/^\d+(?:\.\d+)?/)?.[0];
    if (count) return `${count.replace(/\.0+$/, "")} 位`;
  }

  if (key === "harness_feature" || key === "additional_features" || key === "special_feature") {
    const normalizedText = text.replace(/[\u2010-\u2015\u2212]/g, "-");
    const localizedParts = normalizedText
      .split(/[,，;/|；]/)
      .map((part) => localizeCommonToken(part))
      .map((part) => part.trim())
      .filter(Boolean);
    if (localizedParts.length > 0) {
      return Array.from(new Set(localizedParts)).join("，");
    }
  }

  if (key === "item_dimensions_l_x_w_x_h") {
    const compact = text.replace(/\s+/g, " ").trim();
    const localizedDimension = compact
      .replace(/([0-9.]+)\s*["”']?\s*L\b/gi, "$1 长")
      .replace(/([0-9.]+)\s*["”']?\s*W\b/gi, "$1 宽")
      .replace(/([0-9.]+)\s*["”']?\s*H\b/gi, "$1 高")
      .replace(/\s*x\s*/gi, " x ")
      .replace(/\s+/g, " ")
      .trim();
    if (localizedDimension !== compact) return localizedDimension;
  }

  if (key === "folded_size") {
    const compact = text.replace(/\s+/g, " ").trim();
    const localizedFolded = compact
      .replace(/\bH\s*([0-9.]+)/gi, "高$1")
      .replace(/\bW\s*([0-9.]+)/gi, "宽$1")
      .replace(/\bD\s*([0-9.]+)/gi, "深$1")
      .replace(/\binch(?:es)?\b/gi, "英寸")
      .replace(/\s*x\s*/gi, " x ")
      .replace(/\s+/g, " ")
      .trim();
    if (localizedFolded !== compact) return localizedFolded;
  }

  if (key === "color") {
    const colorMap: Record<string, string> = {
      "dash sage": "鼠尾草绿",
      "black": "黑色",
      "white": "白色",
      "grey": "灰色",
      "gray": "灰色",
      "blue": "蓝色",
      "red": "红色",
      "green": "绿色",
      "pink": "粉色",
      "beige": "米色",
    };
    if (colorMap[lower]) return colorMap[lower];
    if (/[,，;&/]/.test(text)) {
      const parts = text
        .split(/[,，;&/]/)
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => {
          const token = part.toLowerCase();
          return colorMap[token] || COMMON_SPEC_VALUE_ZH[token] || localizeCommonToken(part);
        })
        .filter(Boolean);
      if (parts.length > 1) return parts.join("，");
    }
    return localizeCommonToken(text);
  }

  if (MATERIAL_SPEC_KEYS.has(key)) {
    return localizeMaterialDisplayValue(text, lang);
  }

  if (key === "harness_type" || key === "brake" || key === "brake_system") {
    return localizeSafetyDisplayValue(text, lang);
  }

  if (COMMON_SPEC_VALUE_ZH[lower]) {
    return COMMON_SPEC_VALUE_ZH[lower];
  }

  if (/[,，;/|；]/.test(text)) {
    const localizedParts = text
      .split(/[,，;/|；]/)
      .map((part) => localizeCommonToken(part))
      .map((part) => part.trim())
      .filter(Boolean);
    if (localizedParts.length > 1) {
      const uniqueParts = Array.from(new Set(localizedParts));
      return uniqueParts.join("，");
    }
  }

  if (/^\d+(?:\.\d+)?\s*pounds?$/i.test(text)) {
    return text.replace(/\s*pounds?$/i, " 磅");
  }

  if (/^\d+(?:\.\d+)?\s*inch(?:es)?$/i.test(text)) {
    return text.replace(/\s*inch(?:es)?$/i, " 英寸");
  }

  if (/\binch(?:es)?\b/i.test(text)) {
    return text.replace(/\binch(?:es)?\b/gi, "英寸");
  }

  const unitNormalized = normalizeMeasurementUnitsForZh(text);
  const fallbackTokenLocalized = localizeCommonToken(unitNormalized);
  if (fallbackTokenLocalized && fallbackTokenLocalized !== text) {
    return fallbackTokenLocalized;
  }

  return unitNormalized;
}