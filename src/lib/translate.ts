/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const countries = [
  { code: "US", name: "美国", nameEn: "United States", currency: "USD", symbol: "$", rate: 1.0 },
  { code: "DE", name: "德国", nameEn: "Germany", currency: "EUR", symbol: "€", rate: 0.92 },
  { code: "GB", name: "英国", nameEn: "United Kingdom", currency: "GBP", symbol: "£", rate: 0.79 }
];

export function getCurrencyData(countryCode: string) {
  // Default to US (USD) if country code is not found or excluded
  return countries.find(c => c.code === countryCode) || countries.find(c => c.code === "US") || countries[0];
}

export const translations = {
  zh: {
    // Nav & Common Headers
    topBanner: "BalanceBikeToddler · 全球高端童车品牌垂直导购平台 · 专注安全、工效与健康骑行",
    brandTitle: "BalanceBikeToddler",
    bbtBrandTitle: "BalanceBikeToddler.com",
    versionStamp: "2026 PREMIUM",
    subTitle: "高端垂直童车评测平台",
    bbtSubTitle: "全球儿童轮式出行评测与安全选购平台",
    navHome: "首页",
    navProducts: "产品中心",
    navEvaluations: "评测中心",
    navGuides: "选购指南",
    navNews: "全球资讯",
    navAbout: "关于我们",
    navLanguage: "🌐 简体中文",
    closeAdvisor: "关闭顾问",
    connectAdvisor: "连线专家",
    advisorTitle: "BalanceBikeToddler 高端童车安全顾问",
    advisorLoading: "正在为您进行多维度工效匹配。",

    // Button Labels
    viewDetails: "产品详情 →",
    moreReports: "查看全部评测报告 🔍",
    seeFullReport: "查看完整安全报告 →",
    seeFlawsReport: "查看物理结构评估 →",
    getMatchedSpecs: "获取专属选车方案",
    applySpecs: "应用宝宝身体参数",
    clearBookmarks: "清空收藏夹",
    backToHome: "返回首页",
    closeBtn: "关闭",

    // Home Section Texts
    sloganBadge: "高端童车甄选标准 · 公开规格与安全框架",
    sloganHeading1: "高端垂直",
    sloganHeading2: "童车评测",
    sloganHeading3: "平台",
    sloganDesc: "BalanceBikeToddler 基于公开规格、安全标准框架与真实用户反馈，在海量冗余信息中，帮家庭选出更合适的童车。",
    btnWizard: "智能选车助手 🔬",
    btnDatabase: "品牌全系列库 📂",
    radarTitle: "物理安全雷达公示区",
    radarWeight: "1. 公开规格核对：",
    radarShock: "2. 避震结构规格：",
    radarTraction: "3. 轮胎与抓地规格：",
    radarTested: "4. 公开安全认证：",
    radarTestedVal: "12 款在售车型",
    recallTitle: "行业突发安全快讯 (Real-time Recall Alert)",
    recallDesc: "美国 CPSC 已对4款高碳钢重合金自行车发布倾斜侧翻砸碰警告。请家长计算车重比。",
    recallBtn: "查看合规报告 →",
    goldRankings: "2026 年度综合表现榜 (Annual Rankings)",
    goldRankingsDesc: "基于公开规格与用户反馈，整理各细分品类的综合表现",
    safetyScoreLabel: "安全得分:",
    promoTitle: "编辑精选：规格对比报告展示区",
    promoDesc: "深入揭露低端变形拼接车材料弊病，宣扬正向工效学设计",
    promoItem1Tag: "规格甄别亮点",
    promoItem1Title: "儿童前庭颈椎安全：为什么我们坚决抵制发泡实心轮胎？",
    promoItem1Desc: "EVA 实心发泡胎与橡胶充气胎的减震思路不同：充气胎依靠气压与胎壁变形吸收细碎震动，发泡胎则以免维护、不扎胎为卖点。请结合常骑路面、孩子年龄与厂商公布的胎型规格来选择。",
    promoItem2Tag: "选购评估要点",
    promoItem2Title: "解密拼贴式「多合一变形滑滑车」的结构性平衡隐患",
    promoItem2Desc: "多功能拼接变形车依赖大量快速装配插销，结构件越多，长期使用后出现松旷的概率越高。建议优先选择转换结构简单、并按说明书定期检查紧固件的车型。",

    // Other Sections Shared
    childProfileTitle: "宝宝当前物理特征值 (Active Child Target Profile)",
    childAge: "年龄",
    childHeight: "身高",
    childInseam: "腿内侧跨高 (Inseam)",
    childWeight: "当前体重",
    experienceLabel: "体验阶段",
    exp_beginner: "新手上路",
    exp_intermediate: "熟练掌握",
    exp_advanced: "竞技狂热",
    saveSuccess: "配置已存入浏览器局部存储"
  },
  en: {
    // Nav & Common Headers
    topBanner: "Global Kids Bike Guide · Referencing ISO 8098 and published safety frameworks · 100% Self-funded & Unbiased",
    brandTitle: "BalanceBikeToddler",
    bbtBrandTitle: "BalanceBikeToddler.com",
    versionStamp: "2026 EDITION",
    subTitle: "BalanceBikeToddler · Global Buyer's Decision Portal",
    bbtSubTitle: "Your trusted global review site for kids wheeled toys",
    navHome: "Home",
    navProducts: "Products",
    navEvaluations: "Reviews",
    navGuides: "Buyer's Guide",
    navNews: "Global News",
    navAbout: "About Us",
    navLanguage: "🌐 English",
    closeAdvisor: "Close AI Advisor",
    connectAdvisor: "Advisor",
    advisorTitle: "Physics safety & Ergonomics AI Advisor",
    advisorLoading: "Analyzing multi-dimensional structural tolerances.",

    // Button Labels
    viewDetails: "View Details →",
    moreReports: "See All Review Reports 🔍",
    seeFullReport: "View Shock-Absorbing Report →",
    seeFlawsReport: "View Structural Flaws Report →",
    getMatchedSpecs: "Generate Baby Golden Specs",
    applySpecs: "Apply Baby Specifications",
    clearBookmarks: "Clear Bookmarks",
    backToHome: "Back to Home",
    closeBtn: "Close",

    // Home Section Texts
    sloganBadge: "Published Standards Referenced · ISO 8098 Braking Framework",
    sloganHeading1: "Global Kids Bike",
    sloganHeading2: "Independent Review",
    sloganHeading3: "Portal",
    sloganDesc: "Built on published safety frameworks, manufacturer specifications, and aggregated owner feedback — covering brake reach, Q-factor, and frame geometry. Unbiased, unsponsored guidance to protect your child's spinal health and safe riding!",
    btnWizard: "Smart Wizard 🔬",
    btnDatabase: "All Products 📂",
    radarTitle: "Safety Metrics Live",
    radarWeight: "1. Published Weight Specs:",
    radarShock: "2. Suspension Specs:",
    radarTraction: "3. Tire & Grip Specs:",
    radarTested: "4. Certification Notes:",
    radarTestedVal: "12 Listed Models",
    recallTitle: "Critical Safety Alert (Real-time Recall)",
    recallDesc: "US CPSC has issued tipping/recall warnings for heavy carbon-steel kid bikes as excessive bike-to-child weight ratio leads to severe injuries.",
    recallBtn: "View Safety Report →",
    goldRankings: "2026 Annual Overall Picks",
    goldRankingsDesc: "Based on published specifications and aggregated owner feedback, here are the standouts in each class.",
    safetyScoreLabel: "Safety Score:",
    promoTitle: "Editor's Desk: Spec-Based Comparative Insights",
    promoDesc: "Exposing the hidden material design flaws in cheap, multi-functional kid bikes, and championing ergonomic engineering.",
    promoItem1Tag: "Spec Insight",
    promoItem1Title: "Spine & Senses Protection: Why We Decidedly Object to Solid EVA Foam Tires?",
    promoItem1Desc: "Solid EVA foam tires trade vibration damping for puncture-proof convenience, while pneumatic rubber tires use air pressure and sidewall flex to absorb finer road buzz. Choose based on surface conditions, your child's age, and the tire type the manufacturer publishes.",
    promoItem2Tag: "Technical Alert",
    promoItem2Title: "Analyzing the 'All-in-One Multi-functional Scooter / Walker'",
    promoItem2Desc: "Multi-functional ride-ons rely on quick-release pins and folding joints that wear with use. Prefer models with fewer structural conversions, and re-check fasteners against the manual as the product ages.",

    // Other Sections Shared
    childProfileTitle: "Active Child Target Profile",
    childAge: "Age",
    childHeight: "Height",
    childInseam: "Leg Inseam",
    childWeight: "Active Weight",
    experienceLabel: "Riding Stage",
    exp_beginner: "Beginner",
    exp_intermediate: "Intermediate",
    exp_advanced: "Advanced / Racer",
    saveSuccess: "Configurations saved to Local Storage!"
  }
};


export function translateCategory(cat: string, lang: "zh" | "en") {
  if (lang === "zh") {
    switch (cat) {
      case "balance": return "平衡车";
      case "bicycle": return "儿童自行车";
      case "scooter": return "儿童滑板车";
      case "stroller": return "婴儿推车";
      case "electric_car": return "儿童电动车";
      case "tricycle": return "儿童三轮车";
      case "safety_seat": return "儿童安全座椅";
      default: return cat;
    }
  }

  const map: Record<string, string> = {
    balance: "Balance Bike",
    bicycle: "Pedal Bicycle",
    scooter: "Kick Scooter",
    stroller: "Kids Stroller",
    electric_car: "Electric Off-Road Car",
    tricycle: "Multifuel Tricycle",
    safety_seat: "Car Safety Seat"
  };
  return map[cat] || cat;
}

const productEnTranslations: Record<string, {
  name: string;
  description?: string;
  editorVerdict: string;
  pros: string[];
  cons: string[];
}> = {
  bal_1: {
    name: "Woom 1 Classic Lightweight Balance Bike",
    editorVerdict: "Woom 1 is the gold standard for balance bikes. Exceptional cycling geometry and an ultra-low standover height empower toddlers as young as 1.5 years to build strong riding confidence. Weighing roughly 20% of a 3-year-old's weight, it offers industry-leading structural weight-to-body ratios.",
    pros: [
      "Remarkably lightweight at 3.0kg, raising physical rolling control and enabling easy self-lifting.",
      "Custom micro-reach handbrakes designed for little palms, with brake lever travel under 3.2cm.",
      "Integrated steering limiter band prevents fork over-rotation and steering tipping hazard."
    ],
    cons: [
      "Relatively premium pricing for a transitional one-year toddler phase.",
      "Lacks conversion capabilities, cannot be upgraded or converted into a pedal bike."
    ]
  },
  bal_2: {
    name: "Kokua Jumper Active Elastomer Suspension Balance Bike",
    editorVerdict: "Specially crafted for active kids, this is an outstanding all-terrain balance bike. The unique high-polymer elastomer buffer on the rear stay filters high-frequency road vibrations, protecting developing toddler spines during drop-offs or bumpy trails.",
    pros: [
      "High-end elastomer shock damping protects kids' spinal columns beautifully.",
      "Schwalbe Big Apple wide tires provide top traction in dirt, mud, and gravel.",
      "Ergonomic low-重心 racing frame posture allows children to lean forward and sprint easily."
    ],
    cons: [
      "At 3.4kg, it feels slightly heavy for younger toddlers to lift independently.",
      "Lacks stock handbrakes, relying on foot friction to stop, which wears down shoe soles quickly."
    ]
  },
  bal_3: {
    name: "Strider 12 Sport Kids Championship Balance Bike",
    editorVerdict: "Widely recognized globally due to the famous Strider Cup, this model is built for racing. Though durable, maintenance-free, and easy to adjust, the solid EVA tires offer reduced traction on wet asphalt or smooth tiles compared to pneumatic rubber tyres.",
    pros: [
      "Tool-free quick release seat clamp with both short and long seatposts included.",
      "Integrated grip tape footrests protect child balance during high-speed gliding.",
      "Performance steering geometry offers snappy steering and excellent trail agility."
    ],
    cons: [
      "EVA foam tires have low friction coeffecients on wet paths or polished surfaces.",
      "Lacks pneumatic cushioning, transmitting low-level road vibrations directly to toddler wrists."
    ]
  },
  bike_1: {
    name: "Woom 2 Micro-Reach Dual Handbrake Bicycle (14\")",
    editorVerdict: "Indisputably the peak of 14-inch junior bicycle engineering. It entirely eliminates heavy coaster brakes, integrating high-linearity micro-reach handbrakes designed for toddler fingers under 40mm. The green color-coding is a brilliant ergonomics touch.",
    pros: [
      "Extremely light at only 5.0kg, allowing younger kids to take off effortlessly.",
      "Green-coded rear brake lever reminds children to prioritize the rear stopper during emergencies.",
      "Ultra-narrow pedal Q-factor prevents knee flare-outs, ensuring straight and natural posture."
    ],
    cons: [
      "Stock is extremely limited and subject to international supply chain delays.",
      "Intentionally lacks training wheels, remaining faithful to direct balance transition."
    ]
  },
  bike_2: {
    name: "Specialized Riprock Coaster Wide-Tire Trail Bicycle (16\")",
    editorVerdict: "A premium product from a world-class mountain biking brand, with a sturdy frame and rugged paint protection. The massive 2.3'' tires handle sand and tree tracks with ease, but the heavy high carbon-steel frame requires strong pedaling.",
    pros: [
      "Massive 2.3-inch tires offer exceptional lateral traction and tipping safety.",
      "Wildly rugged framework construction with premium impact-resistant painting.",
      "Comes with quick-install robust matching training wheels that are easy to manage."
    ],
    cons: [
      "Weighs a heavy 8.2kg, which runs down smaller children's core stamina quickly.",
      "Coaster brake requirement makes micro-aligning pedal positions during starts tricky."
    ]
  },
  scoot_1: {
    name: "Micro Mini 3-in-1 Gravity Steering Kick Scooter",
    editorVerdict: "The ultimate king of kids' scooters. The patented Swiss Lean-to-Steer system prevents high-speed jackknifing common in cheap spring scooters. It is outstandingly beneficial for young inner ear balance mapping and hand-eye coordination.",
    pros: [
      "Patented Swiss precise tilt-to-steer system provides silky and safe rebound steering.",
      "Double-layered glass fiber composite deck has exceptional elastic damping properties.",
      "Multi-stage growing assembly: 1.5Y seat riser, transition bar, and full height T-bar."
    ],
    cons: [
      "Rigid clip-in stem is non-folding, requiring manual push-pin removal for transport.",
      "Bearings housed in plastic wheels can oxidize if exposed to heavy puddles."
    ]
  },
  scoot_2: {
    name: "Decathlon B1 Ultra-Light Foldable Kids Scooter",
    editorVerdict: "An absolute best-seller offering premium EU safety margins at a modest price. Features precise lean angles aligned with 2-5yo pelvic widths. Excellent value for weekend rides on paved park trails.",
    pros: [
      "Remarkable budget value while certifying strict European EN71 safety targets.",
      "Detachable colored decks that are easy to wash or swap based on toddler style.",
      "Inbuilt steering angle limits prevent panic-induced lockups and over-the-bar tips."
    ],
    cons: [
      "Bearing rolling resistance is higher than premium rivals, needing more kick effort.",
      "Magnetic glowing hubs occasionally show uneven brightness after long wear."
    ]
  },
  stroll_1: {
    name: "Bugaboo Fox 5 Premium All-Terrain Ergonomic Stroller",
    editorVerdict: "The heavy tank of suspension strollers. When protecting infants under 1 year against head micro-shocks, its rigid posture tray combined with advanced spring dampening is entirely unmatched. A world-class luxury performer.",
    pros: [
      "All-wheel mechanical suspension and tubeless air tires smooth out kerbs and rough pavement.",
      "Full-flat 175-degree rigid bassinet prevents infant spinal curvature under heavy use.",
      "Unique gravity-linked triangular wheelbase rolls through sand, mud, and gravel like butter."
    ],
    cons: [
      "At 10.4kg, it is hard for a single parent to carry up narrow stairs.",
      "Bulky fold envelope usually requires an SUV or executive trunk space."
    ]
  },
  elec_1: {
    name: "Peg Perego Polaris Ranger Tandem 12V Off-Road Ride-On",
    editorVerdict: "Direct import from Italy, boasting premium certified anti-thermal wiring and battery puncture resistance. The progressive acceleration curves prevent dynamic head-jerk and dizziness characteristic of cheap alternatives.",
    pros: [
      "Intelligent progressive start-stop system avoids toddler neck snap-back.",
      "12V high-torque dual motors can climb grassy ridges and dirt slopes up to 17 degrees.",
      "Dual seatbelts, robust physical side guards, and dual controls for interactive play."
    ],
    cons: [
      "Weighs 15.6kg, making lifting or carrying a discharged unit extremely tiring.",
      "Standard electronic brake fails on slopes if battery is completely dead."
    ]
  },
  elec_2: {
    name: "Poynton Smart All-Terrain Racing Karts",
    editorVerdict: "A mini electric beast in kart style. With a low center of gravity and a wide track, it is built for stability; follow the manufacturer's age and weight limits, and ride on open paved courts.",
    pros: [
      "Parental wireless limiters allow immediate remote kill and throttle cap control.",
      "Seat sliding length extends up to 15cm, accommodating growing kids from 4 to 8Y.",
      "Comes with shock-damping wraparound crash guards that protect against impacts."
    ],
    cons: [
      "Long charging time (8.5h) yields only 45 minutes of active racing.",
      "Ultra-low ground clearance (4.5cm) restricts driving to flat pavements only."
    ]
  },
  tri_1: {
    name: "Doona Liki Trike S5 Premium 5-in-1 Foldable Tricycle",
    editorVerdict: "A masterpiece of Israeli industrial design. The standout parent control-rod features an active steering clutch overrides toddler handlebar input. Highly recommended for premium city commuting.",
    pros: [
      "Folds down to the size of an A4 binder, making it perfect for airplane overheads.",
      "Parent Touch System: parent-guided control rod overrides child steering instantly.",
      "Five-stage growth design transforms seamlessly from an enclosed infant stroller."
    ],
    cons: [
      "Vertical backboard is great for support but cannot recline deeply for extended sleep.",
      "Premium pricing is comparable to buying two light-alloy performance bikes."
    ]
  },
  seat_1: {
    name: "Britax Advansafix i-Size ISOFIX Premium Safety Car Seat",
    editorVerdict: "A true fortress for vehicle protection. It is certified to EU ECE R129 (i-Size), the European child restraint safety standard, with energy-absorbing foam pads.",
    pros: [
      "Exceeds ECE R129 i-Size standards, providing unmatched neck and joint defense.",
      "Patented XP-PAD chest guard and SecureGuard 4th point harness shield vulnerable hips.",
      "Pivot Link system converts forward crash energy downward, halting severe acceleration."
    ],
    cons: [
      "Heavy at 12kg, making transfers across multiple cars highly cumbersome.",
      "Thick safety pads feel warm in summers; optional cooling mats are recommended."
    ]
  }
};

export function translateMaterialToEn(mat: string): string {
  const map: Record<string, string> = {
    "航天级6061铝合金": "Aerospace-grade 6061 Aluminum",
    "高端镁合金": "Premium Magnesium Alloy",
    "超轻碳纤维": "Ultralight Carbon Fiber",
    "高碳钢": "High Carbon Steel",
    "钛合金": "Titanium Alloy",
    "航空铝合金": "Aviation Aluminum",
    "精细加厚镁铸造": "Precision Cast Magnesium",
    "高强度合金钢": "High Strength Alloy Steel",
    "铝合金 / 局部增强高碳钢": "Alloy & High Carbon Steel Parts",
    "强化碳钢+注塑": "Reinforced Steel & Injection Molded",
    "阻燃高密度聚乙烯/钢骨架": "Fire-retardant HDPE & Steel Core",
    "碳素钢 + 镁质连杆": "Carbon Steel & Magnesium Rods",
    "高强度航空轻质铝": "Aviation High-Strength Aluminum",
    "工程轻量化高碳钢车身": "Engineering Lightweight High Carbon Steel",
    "A1高级加厚铝合金车架": "A1 Premium Double-Butted Aluminum Frame",
    "加固型玻璃纤维合成高弹板 + 阳极氧化合金杆": "Reinforced Fiberglass Seat Deck & Anodized T-Bar",
    "热塑树脂/防折钢质内嵌中枢": "Casted Thermoplastic Resin with Steel Core",
    "阳极氧化航空铝合金底盘": "Anodized Aerospace Aluminum Chassis",
    "高密度工程抗磨塑料外壳/钢管内梁": "HDPE Wear-resistant Body & Steel Crossbeams",
    "航空钢加厚防撞管梁 + 车载ABS防滑面板": "Aero Steel Tubular frame & ABS Anti-skid Deck",
    "高聚强化纤维碳编粒子聚合物/铝质杆": "High-poly Carbon Fiber Reinforcement & Aluminum Bar",
    "加硬合金钢骨架 + 慢弹回太空惰性空气抗拉棉": "Reinforced Alloy Steel Core & Space Damping Padding"
  };
  return map[mat] || mat;
}

function translateTireToEn(tire: string): string {
  const map: Record<string, string> = {
    "越野充气橡胶胎": "Off-road Pneumatic Tires",
    "EVA轻质发泡胎": "EVA Lightweight Foam Tires",
    "PU轮夜光减震胎": "PU Glowing Magnetic Tires",
    "橡胶充气胎": "Pneumatic Rubber Tires",
    "耐磨发泡PU实心轮": "Wear-resistant PU Solid Wheel",
    "加宽减震充气胎": "Wider Shock-absorbing Pneumatic Tires",
    "越野真空超低阻力轮胎": "Tubeless Low-resistance Off-road Tires",
    "橡胶减震实心轮": "Shock-absorbing Solid Rubber Wheel",
    "Schwalbe 越野充气橡胶胎": "Schwalbe Off-road Pneumatic Tires",
    "Apple 宽幅防穿刺超弹越野胎": "Apple Wide Puncture-resistant Rugged Tires",
    "EVA免维护发泡实心胎": "EVA Maintenance-free Solid Foam Tires",
    "Schwalbe 高弹避震越野充气胎": "Schwalbe High-elastic Shock Pneumatic Tires",
    "Rythm Lite 2.3'' 超宽越野防刺气胎": "Rythm Lite 2.3'' Extra-wide Off-road Puncture-proof Tires",
    "高弹静音高回弹PU夜光减震轮": "High-elastic Silence PU Magnetic Luminous Wheels",
    "标准高纯度PU发光夜光轮": "Standard High-purity PU Glowing Wheels",
    "发泡越野橡胶软层自调节避震巨轮": "Foam-filled Cushion Rubber Self-adjusting Large Tires",
    "加强型抓地粗突橡胶纹充气宽胎": "Heavy-duty Treaded Off-road Pneumatic Wide Tires",
    "PU软弹性宽胎(低速不翘轮)": "Soft PU Elastic Wide Wheels",
    "高弹一体实心聚氨酯高舒适胎": "High-elastic Integrated Solid Polyurethane Tires",
    "无": "None"
  };
  return map[tire] || tire;
}

function translateBrakeToEn(brake: string): string {
  const map: Record<string, string> = {
    "微调短距双手刹(V刹)": "Short-reach Dual V-Brakes",
    "微调窄距手刹": "Short-reach Hand Brakes",
    "油压双碟刹": "Dual Hydraulic Disc Brakes",
    "脚踏倒刹(不推荐)": "Coaster Brakes (Not Recommended)",
    "脚踩后轮重力刹": "Rear Guard Friction Footbrake",
    "前后线拉双碟刹": "Front & Rear Mechanical Disc Brakes",
    "机械碟刹": "Mechanical Disc Brakes",
    "加大型前轮卡钳刹 & 抱刹": "Oversized Front Caliper & Drum Brake",
    "五点式安全带+重力卡锁": "5-Point Belt & Gravity Snap Lock",
    "微调短距幼童专用线性手刹(后V刹)": "Micro-reach Linear Kid Handbrakes (Rear V-Brake)",
    "重力脚掌滑阻制动 (原厂无手刹扣)": "Sole-to-ground Direct Braking (No Stock Levers)",
    "后底悬板重力闸片 (无机械拉线手刹)": "Rear Flex Brake (No Lever Cable Handbrakes)",
    "幼童专配微距高线性V刹(右后刹绿色区分)": "Narrow-reach Linear V-Brakes (Green rear indicator)",
    "前手拉机械V刹 + 后脚踩倒退阻尼链刹": "Front Caliper & Rear Coaster Footbrake",
    "后轮不锈钢重力制动踩片": "Rear Stainless Steel Spring Footbrake",
    "后轴连杆贴片双踩制动刹": "Rear Guard Dual Double-friction Brakes",
    "红黄变色双卡连杆单脚中枢刹车": "Red/Green Single-pedal Connected Core Brakes",
    "油门踏板电子重力松脚渐进自锁刹车": "Gas Pedal Progressive Electronic Decel Auto-Brakes",
    "一指微力敏捷双手刹+后轴双重驻油刹": "One-finger Responsive Levers & Rear Dual Disc Brakes",
    "后轮红点物理驻车轮卡刹": "Rear Red-point Mechanical Parking Locks",
    "三点物理锁扣搭扣 + ISOFIX 咬死底锁": "3-Point Physical Lock Buckle & ISOFIX Anchors"
  };
  return map[brake] || brake;
}

function translateSafetyCertificationToEn(certifications: unknown): string[] {
  if (!certifications) return [];
  if (!Array.isArray(certifications)) {
    return [String(certifications)];
  }
  return certifications.map((cert) => {
    return String(cert || "")
      .replace("(美标)", "(US Standard)")
      .replace("(欧标)", "(EU Standard)")
      .replace("(国标)", "(CN Standard)")
      .replace("(美标电摩安全)", "(US E-Moto Safety)")
      .replace("(欧标电能性)", "(EU Electrical)")
      .replace("(中国强制玩具等效等规)", "(CN Toy Equiv.)")
      .replace("(欧盟最新i-Size高标认证)", "(EU i-Size latest)")
      .replace("(欧标顶级)", "(EU Top Standard)");
  }).filter(Boolean);
}

function cleanVisibleProductText(value: unknown) {
  const cleaned = String(value || "")
    .replace(/…+/g, " ")
    .replace(/\.{3,}/g, " ")
    .replace(/^editor\s+verdict\s*[:：-]\s*/i, "")
    .replace(/^customers\s+find\s+/i, "")
    .replace(/\s*\(\s*Features\[\d+\]\s*\)\s*/gi, " ")
    .replace(/\s*\(\s*Product\s+Feature\s*\)\s*/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  return /^[a-z]/.test(cleaned) ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : cleaned;
}

function cleanVisibleEvidenceSource(value: unknown) {
  const text = String(value || "").trim();
  if (/^Features\[\d+\]$/i.test(text)) return "";
  if (/^Product\s+Feature$/i.test(text)) return "";
  if (text === "产品特性") return "";
  return text;
}

function isUnsupportedVideoUrl(value: unknown) {
  return /\.m3u8(\?|#|$)/i.test(String(value || "").trim());
}

function isPlaceholderLocalizedDescription(value: unknown) {
  const text = String(value || "").trim().toLowerCase();
  if (!text) return false;
  return (
    /^primary\s+visual\s+asset\s+for\s+.+\s+in\s+[a-z_]+\.?$/i.test(text) ||
    text.includes("placeholder description")
  );
}

function sanitizeVisibleProductFields(product: any) {
  const videos = Array.isArray(product.videos)
    ? product.videos.filter((item: any) => !isUnsupportedVideoUrl(item?.url))
    : product.videos;
  const videoUrl = isUnsupportedVideoUrl(product.videoUrl) ? "" : product.videoUrl;

  return {
    ...product,
    name: cleanVisibleProductText(product.name),
    brand: cleanVisibleProductText(product.brand),
    description: cleanVisibleProductText(product.description),
    customersSay: cleanVisibleProductText(product.customersSay),
    customers_say: cleanVisibleProductText(product.customers_say),
    Product_Description: cleanVisibleProductText(product.Product_Description),
    product_description: cleanVisibleProductText(product.product_description),
    productDescription: cleanVisibleProductText(product.productDescription),
    specsText: cleanVisibleProductText(product.specsText),
    features: Array.isArray(product.features) ? product.features.map(cleanVisibleProductText).filter(Boolean) : product.features,
    pros: Array.isArray(product.pros) ? product.pros.map(cleanVisibleProductText).filter(Boolean) : product.pros,
    cons: Array.isArray(product.cons) ? product.cons.map(cleanVisibleProductText).filter(Boolean) : product.cons,
    editorVerdict: cleanVisibleProductText(product.editorVerdict),
    scrapedEvidence: Array.isArray(product.scrapedEvidence)
      ? product.scrapedEvidence.map((item: any) => ({
          ...item,
          source: cleanVisibleEvidenceSource(item.source),
          text: cleanVisibleProductText(item.text),
        }))
      : product.scrapedEvidence,
    scoringStandards: Array.isArray(product.scoringStandards)
      ? product.scoringStandards.map((standard: any) => ({
          ...standard,
          parentTip: cleanVisibleProductText(standard.parentTip),
          evidence: Array.isArray(standard.evidence)
            ? standard.evidence.map((item: any) => ({
                ...item,
                source: cleanVisibleEvidenceSource(item.source),
                text: cleanVisibleProductText(item.text),
              }))
            : standard.evidence,
        }))
      : product.scoringStandards,
    videoUrl,
    videos,
  };
}

function hasChineseGlyph(value: unknown) {
  return /[\u4e00-\u9fff]/.test(String(value || ""));
}

function hasMeaningfulZhText(value: unknown) {
  const text = String(value || "").trim();
  if (!text) return false;
  if (isPlaceholderLocalizedDescription(text)) return false;
  return hasChineseGlyph(text);
}

function inferZhCategoryLabel(rawCategory: unknown, signalText: string) {
  const category = String(rawCategory || "").toLowerCase();
  if (category === "balance" || category === "balance_bike" || category === "balance_bikes") return "平衡车";
  if (category === "bicycle" || category === "kids_bikes") return "儿童自行车";
  if (category === "stroller" || category === "jogger_stroller" || category === "double_stroller") {
    if (/\b(?:double|twin)\b/.test(signalText)) return "双人推车";
    if (/\b(?:jogger|jogging|runner)\b/.test(signalText)) return "慢跑推车";
    if (/\b(?:travel|compact|lightweight|umbrella|portable|cabin)\b/.test(signalText)) return "旅行推车";
    return "婴儿推车";
  }
  if (category === "scooter" || category === "scooters" || category === "kids_scooters") {
    return /\belectric\b/.test(signalText) ? "儿童电动滑板车" : "儿童滑板车";
  }
  if (category === "electric_car" || category === "electric_vehicles") return "儿童电动车";
  if (category === "safety_seat" || category === "car_seat" || category === "car_seats") return "儿童安全座椅";
  if (category === "tricycle") return "儿童三轮车";
  return "儿童出行装备";
}

function pickZhCues(signalText: string) {
  const cues: string[] = [];
  if (/\b(?:suspension|shock|vibration|damp)\b/.test(signalText)) cues.push("避震护脊");
  if (/\b(?:brake|stopping|disc|v-?brake|isofix|side-impact)\b/.test(signalText)) cues.push("制动可控");
  if (/\b(?:travel|compact|portable|lightweight|fold)\b/.test(signalText)) cues.push("便携速收");
  if (/\b(?:jogger|jogging|all-terrain|terrain|gravel)\b/.test(signalText)) cues.push("稳行越野");
  if (/\b(?:double|twin|sibling)\b/.test(signalText)) cues.push("双座同乘");
  if (/\b(?:balance|coordination|learn)\b/.test(signalText)) cues.push("启蒙平衡");
  if (/\b(?:safety|protect|secure|stable|stability)\b/.test(signalText)) cues.push("防护周全");
  if (!cues.length) cues.push("结构稳健", "操控平顺");
  if (cues.length === 1) cues.push("操控平顺");
  return cues.slice(0, 2);
}

function buildZhFallbackName(brand: unknown, categoryLabel: string) {
  const cleanBrand = cleanVisibleProductText(brand).trim();
  return [cleanBrand, categoryLabel].filter(Boolean).join(" ") || categoryLabel;
}

function buildZhFallbackDescription(brand: unknown, categoryLabel: string, signalText: string) {
  const [cueA, cueB] = pickZhCues(signalText);
  const name = buildZhFallbackName(brand, categoryLabel);
  return `${name}，${cueA}，${cueB}。`;
}

function buildZhFallbackVerdict(categoryLabel: string, signalText: string) {
  const [cueA, cueB] = pickZhCues(signalText);
  return `此款${categoryLabel}以${cueA}见长，兼顾${cueB}，适合日常出行。`;
}

function keepZhListOrFallback(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value.map((item) => cleanVisibleProductText(item)).filter(Boolean);
  if (cleaned.some(hasChineseGlyph)) return cleaned;
  return fallback;
}

export function translateProduct(p: any, lang: "zh" | "en") {
  const categoryLabel = translateCategory(p.category, lang);
  const rawWheelSize = String(p?.wheelSize || "").trim();
  const safeWheelSize = rawWheelSize === "无" ? "None" : rawWheelSize.replace("寸", " in.");
  const safeAgeRange = String(p?.ageRange || "")
    .replace("岁", " Years")
    .replace("个", " ")
    .replace("月", " Months");
  
  // Use localized data from CMS if available
  const localData = p[lang] || {};
  const name = localData.name || p.name;
  const localizedDescription = String(localData.description || "").trim();
  const description =
    localizedDescription && !isPlaceholderLocalizedDescription(localizedDescription)
      ? localizedDescription
      : p.description;
  const features = localData.features || p.features || [];
  const pros = localData.pros || p.pros || [];
  const cons = localData.cons || p.cons || [];
  const editorVerdict = localData.editorVerdict || p.editorVerdict || "";
  const sourceBrandText = cleanVisibleProductText(p.brand).trim();
  const localizedBrandText = cleanVisibleProductText(localData.brandText || "").trim();
  // Brand names are preserved from source and should not be translated.
  const brandText = sourceBrandText || localizedBrandText;
  const specsText = localData.specsText || p.specsText || "";

  if (lang === "zh") {
    const signalText = [
      localData.en?.name,
      p.en?.name,
      p.name,
      localData.en?.description,
      p.en?.description,
      p.description,
      p.Product_Description,
      localData.en?.editorVerdict,
      p.en?.editorVerdict,
      p.editorVerdict,
      p.ageRange,
      p.category,
    ]
      .map((value) => String(value || "").toLowerCase())
      .join(" ");
    const zhCategoryLabel = inferZhCategoryLabel(p.category, signalText);
    const zhName = hasMeaningfulZhText(localData.name)
      ? localData.name
      : buildZhFallbackName(brandText, zhCategoryLabel);
    const zhDescription = hasMeaningfulZhText(localizedDescription)
      ? localizedDescription
      : buildZhFallbackDescription(brandText, zhCategoryLabel, signalText);
    const zhEditorVerdict = hasMeaningfulZhText(localData.editorVerdict)
      ? localData.editorVerdict
      : buildZhFallbackVerdict(zhCategoryLabel, signalText);
    const zhFeatures = keepZhListOrFallback(localData.features || p.features, ["结构稳健", "操控顺手", "适龄匹配"]);
    const zhPros = keepZhListOrFallback(localData.pros || p.pros, ["低速稳定", "日常易用", "维护省心"]);
    const zhCons = keepZhListOrFallback(localData.cons || p.cons, ["请按身高体重匹配", "请在监护下使用"]);
    const zhSpecsText = hasMeaningfulZhText(localData.specsText)
      ? localData.specsText
      : `${zhCategoryLabel}参数以厂商公开规格为准。`;

    return sanitizeVisibleProductFields({ 
      ...p, 
      name: zhName,
      description: zhDescription,
      features: zhFeatures,
      pros: zhPros,
      cons: zhCons,
      editorVerdict: zhEditorVerdict,
      brand: brandText || sourceBrandText || p.brand,
      specsText: zhSpecsText,
      categoryLabel: zhCategoryLabel,
    });
  }

  // lang === "en"
  const brandMap: Record<string, string> = {
    "九能": "NineNoble",
    "祺娃娃": "QiWawa",
    "优贝": "RoyalBaby",
    "闪电": "Specialized",
    "迪卡侬": "Decathlon",
    "捷安特": "Giant",
    "woom": "Woom",
    "Woom (奥地利)": "Woom (Austria)",
    "Kokua (德国)": "Kokua (Germany)",
    "Strider (美国)": "Strider (USA)",
    "Specialized (美国)": "Specialized (USA)",
    "m-cro (瑞士)": "m-cro (Switzerland)",
    "Decathlon (法国)": "Decathlon (France)",
    "Bugaboo (荷兰)": "Bugaboo (Netherlands)",
    "Peg Perego (意大利)": "Peg Perego (Italy)",
    "Doona (以色列)": "Doona (Israel)",
    "Britax (宝得适)": "Britax"
  };

  const enOverride = productEnTranslations[p.id];
  if (enOverride) {
    return sanitizeVisibleProductFields({
      ...p,
      name: enOverride.name,
      description: enOverride.description || description || p.description,
      features,
      brand: brandMap[p.brand] || brandText || p.brand,
      categoryLabel,
      material: translateMaterialToEn(p.material),
      tireType: translateTireToEn(p.tireType),
      brakeType: translateBrakeToEn(p.brakeType),
      wheelSize: safeWheelSize,
      safetyCertification: translateSafetyCertificationToEn(p.safetyCertification),
      pros: enOverride.pros,
      cons: enOverride.cons,
      ageRange: safeAgeRange,
      editorVerdict: enOverride.editorVerdict,
      specsText: p.specsText || specsText,
    });
  }

  // If there is an English override in localData (entered via CMS or stored)
  if (localData.name && !/[\u4e00-\u9fa5]/.test(localData.name)) {
    return sanitizeVisibleProductFields({
      ...p,
      name: localData.name,
      description: localData.description || description || p.description,
      features: localData.features || features || [],
      pros: localData.pros || pros || [],
      cons: localData.cons || cons || [],
      editorVerdict: localData.editorVerdict || editorVerdict || "",
      brand: brandMap[p.brand] || brandText || p.brand,
      specsText: localData.specsText || specsText || "",
      categoryLabel,
      material: translateMaterialToEn(p.material),
      tireType: translateTireToEn(p.tireType),
      brakeType: translateBrakeToEn(p.brakeType),
      wheelSize: safeWheelSize,
      safetyCertification: translateSafetyCertificationToEn(p.safetyCertification),
      ageRange: safeAgeRange
    });
  }

  // Extreme fallback
  return sanitizeVisibleProductFields({
    ...p,
    name,
    description,
    features,
    brand: brandMap[p.brand] || p.brand,
    categoryLabel,
    material: translateMaterialToEn(p.material),
    tireType: translateTireToEn(p.tireType),
    brakeType: translateBrakeToEn(p.brakeType),
    wheelSize: safeWheelSize,
    safetyCertification: translateSafetyCertificationToEn(p.safetyCertification),
    pros,
    cons,
    ageRange: safeAgeRange,
    editorVerdict: editorVerdict ? editorVerdict : "Independently verified stroller or bicycle setup.",
    specsText: p.specsText || specsText,
  });
}

export function translateNewsArticle(art: any, lang: "zh" | "en") {
  if (lang === "zh") return art;

  const categoryLabels: Record<string, string> = {
    regulation: "Regulations",
    new_product: "New Launches",
    brand_news: "Brand News",
    brand_trend: "Brand News",
    science: "Science & Biomechanics",
    industry: "Industry Trends"
  };

  const db: Record<string, { title: string; summary: string; author: string; readTime: string; content: string }> = {
    news_1: {
      title: "EU Stroller Standards: What EN 1888 Covers",
      summary: "EN 1888 is the European standard family for strollers and pushchairs. Here is what its published framework asks for, in plain language.",
      author: "BalanceBikeToddler Editorial Team",
      readTime: "5 min read",
      content: `### EU Stroller Standards: What EN 1888 Covers

EN 1888 is the European standard family for wheeled child carry devices — strollers and pushchairs. It sets framework requirements for structure, restraint systems, and folding locks, and it is periodically revised.

#### 1. What to Look For
*   **Backrest & Recline**: Follow the manufacturer's published recline range and backrest construction for your child's age.
*   **Wheels & Tires**: Wheel size and tire type shape ride comfort; compare the published specs.
*   **Folding Locks**: A clear, positive locking mechanism matters for daily use.

#### 2. Certification
Look for the CE mark and the standards the product page cites, and treat them as a floor — not a substitute for checking fit and condition.`
    },
    news_2: {
      title: "Lightweight Kids Mobility Becomes the 2026 Family Buying Theme",
      summary: "Across strollers, balance bikes, kids bikes, and scooters, families are shifting toward products that are light, easy to store, and easier to maintain.",
      author: "BalanceBikeToddler Market Desk",
      readTime: "4 min read",
      content: `### 2026 Industry Trend: Lighter, Easier, More Family-Friendly

    For years, children’s mobility products were sold with bigger frames, thicker tubes, and heavier-duty claims. In real family use, though, parents feel value through a different lens: can one adult carry it, can the child control it, and does it fit stairs, elevators, and car trunks?

    #### 1. Lightweight is household efficiency
    A good stroller, balance bike, kids bike, or scooter should reduce friction for both child and caregiver. Lightweight frames, predictable wheels, adjustable touchpoints, and stable folding systems are becoming the new purchase language.

    #### 2. Parents now buy by scenario
    Commuting families care about fold size and carry weight. Park families care about grip and vibration. School-age families care about brake feedback and maintenance cost. Brands that explain where a product fits are easier to trust.

    #### 3. BalanceBikeToddler view
    The next durable brands will not simply shout specifications. They will explain who the product suits, which roads it fits, which budget band it occupies, and how often it needs care.`
    },
    news_3: {
      title: "2026 Kids Bike Global Launch: Woom Explore & Specialized Riprock Pro Carbon Release",
      summary: "Pioneering premium kids cycling brands release carbon composition frameworks and responsive micro-reach custom oil disc brakes to save toddler palms.",
      author: "BalanceBikeToddler Editorial Team",
      readTime: "6 min read",
      content: `### High-End Child Mobility Milestones: The Carbon & Hydraulic Era

Two premium lines redefine global child biomechanical thresholds:

#### 1. Woom Explore Series (20\"-26\")
Shedding the soft city image for heavy-duty trails, Woom releases performance gears:
*   **Ultralight Setup**: Premium 20\" configuration weighs less than **7.2kg** under full suspension.
*   **Hydraulic Reach Control**: Incorporates Shimano ultra-narrow levers, allowing effortless two-finger stops.

#### 2. Specialized Riprock Pro Carbon
High modulus carbon fiber composition balance bikes crafted for racers:
*   **Pro Weight Balance**: Entire frame assembly clocks under **2.1kg**. Low inertia layout allows extreme steering speeds.`
    },
    news_4: {
      title: "Global Supply Chain Report: Chinese Magnesium Alloy Die-Casting Hubs Grow Rapidly",
      summary: "Die manufacturing clusters shift from cheap OEM frames towards integrated lightweight magnesium chassis casting, winning European design acclaim.",
      author: "BalanceBikeToddler Editorial Team",
      readTime: "7 min read",
      content: `### Industrial Leaps: The Integrated Magnesium Shell Boom

Chinese casting foundries transition away from heavy weld joints into high-tensile seamless bodies:

#### 1. 45-Second Casting Cycles
High tonnage hydraulic presses stamp 0.9kg aerodynamic kid bike frames with flawless mechanical density and zero hazardous welds.

#### 2. What Published Data Shows
Material datasheets commonly credit magnesium composite frameworks with higher specific strength than old steel alloys, which is why more kids frames use them.`
    },
    news_5: {
      title: "Shoring Up Children's Vestibular Health: Pneumatic Tires vs. EVA Foam Wheels",
      summary: "Clinical physical therapists and biomechanics specialists evaluate long-term micro-vibrations impact on developing toddler brains and cervical spines.",
      author: "BalanceBikeToddler Editorial Team",
      readTime: "5 min read",
      content: `### Vestibular Protection: Pneumatic Tires vs. Cheap Solid EVA Foam

Cheap balance bikes often tout 'maintenance-free, puncture-safe flat-free tires.' But in pediatric medicine, EVA foam wheels represent a massive spine hazard.

#### 1. Vibration Comfort
EVA foam does not deflect the way an air-filled tire does, so more road buzz reaches the frame on rough pavement. Families who ride mostly on uneven sidewalks may notice the difference; on smooth surfaces both tire types work.

#### 2. Pneumatic Dampening
Air tires absorb finer road buzz through pressure and sidewall flex, and their rounder contact patch can hold better through turns. The trade-off is maintenance: they need inflation and can go flat.`
    },
    news_6: {
      title: "2026 Industry Trend: Families Move From Single Products to Scenario Bundles",
      summary: "Strollers, balance bikes, kids bikes, and scooters are increasingly bought as connected mobility setups for commuting, weekends, parks, and growth stages.",
      author: "BalanceBikeToddler Industry Desk",
      readTime: "4 min read",
      content: `### Scenario Bundles Are Reshaping Kids Mobility

Parents used to shop around one product at a time: one stroller, one balance bike, or one kids scooter. In 2026, the decision is becoming more route-based and stage-based.

#### 1. Urban commuting needs light folding and low maintenance
Elevators, subway gates, car trunks, and preschool entrances are the real testing ground. Products that fold quickly, push smoothly, and park easily now beat specification-only storytelling.

#### 2. Growth stages need a continuous experience
From stroller to balance bike, then kids bike and scooter, the core skills are balance, braking, steering, and surface judgment. Brands that explain this path earn longer family trust.`
    },
    news_7: {
      title: "After Lightweight, Repairability Becomes the Next Kids Mobility Battleground",
      summary: "Once lightweight frames become common, wheelsets, brakes, saddles, folding joints, and spare-part availability become the new brand differentiators.",
      author: "BalanceBikeToddler Market Research",
      readTime: "4 min read",
      content: `### Repairability Is Becoming a Brand Divider

Lightweight products are easier to adopt, but the real test comes two years later: does the stroller, bike, or scooter still feel smooth, safe, and serviceable?

#### 1. Parents care about lifetime cost
Replaceable tires, common brake parts, stable folding joints, and available saddles or grips all shape the ownership experience.

#### 2. Second-child and resale markets raise durability expectations
More families want one product to survive across children and seasons. Brands that publish spare parts and maintenance intervals gain an extra trust advantage.`
    },
    news_8: {
      title: "EU Labeling Trend: Age, Weight, and Surface Limits Need Clearer Kids Mobility Copy",
      summary: "European-market children’s mobility labels are moving toward clearer age, weight, surface, and maintenance guidance for families.",
      author: "BalanceBikeToddler Compliance Desk",
      readTime: "5 min read",
      content: `### Label Clarity Is Becoming a Compliance Priority

Risks in strollers, balance bikes, kids bikes, and scooters do not come only from structure. They also come from families misunderstanding usage boundaries.

#### 1. Age and height should not be mixed loosely
Children at the same age may differ widely in height, inseam, and strength. Better labels show age, height, inseam, and maximum load together.

#### 2. Surface limits should be visible earlier
Indoor floors, sidewalks, gravel paths, and slopes all demand different wheels, brakes, and steering control. Clear surface limits reduce misuse risk.`
    },
    news_9: {
      title: "Kids Scooter Brake Copy Draws Attention: Rear Friction Brakes Are Not All-Terrain Safety",
      summary: "Rear friction brakes work well in simple settings, but wet pavement and long slopes require clearer usage boundaries and caregiver guidance.",
      author: "BalanceBikeToddler Risk Review",
      readTime: "4 min read",
      content: `### Scooter Brake Boundaries Need Clearer Explanation

Many kids scooters use rear foot friction brakes. They are simple and reliable, but that does not make them suitable for every speed and surface.

#### 1. Wet slopes are a high-risk pairing
PU wheels and rear friction brakes can take much longer to stop on wet surfaces. Product pages should tell families to avoid wet slopes and mixed traffic areas.

#### 2. Caregiver guidance should not hide in manuals
For young children’s products, key risk guidance belongs on packaging, product pages, and after-sales messaging, not only at the end of a long manual.`
    },
    news_10: {
      title: "Brand News: Woom Sharpens Its Growth-Frame Strategy Around Low Weight and Child Geometry",
      summary: "Woom keeps focusing on low weight, low standover, narrow Q-factor, and child-sized brakes as a clear brand identity around real control.",
      author: "BalanceBikeToddler Brand Desk",
      readTime: "4 min read",
      content: `### Woom's Brand Language Centers on Control

In premium kids bikes, Woom does not talk only about light weight. It packages light frames, geometry, brakes, and grips into a child-control story.

#### 1. Child geometry becomes brand equity
Low standover improves mounting confidence, narrow Q-factor supports cleaner pedaling, and short-reach brake levers reduce hand strain.

#### 2. The lesson for other brands
Shrinking adult bikes is no longer enough. Brands that explain children’s body proportions and learning curves build stronger trust.`
    },
    news_11: {
      title: "Brand News: Joovy and Bumbleride Compete for Urban Stroller Families in Different Ways",
      summary: "Joovy leans into functional density for multi-child families, while Bumbleride emphasizes sustainable materials and smooth everyday pushing.",
      author: "BalanceBikeToddler Brand Research",
      readTime: "5 min read",
      content: `### Two Stroller Brand Routes Are Splitting Apart

Urban families now compare more than wheel size and fold dimensions. Brand values, material stories, and multi-child efficiency all influence buying.

#### 1. Joovy's keyword is practical density
For multi-child families, seating layout, storage, standing boards, and quick folding matter more than decorative styling.

#### 2. Bumbleride's keyword is material and ride feel
Sustainable fabrics, smooth wheels, and outdoor suitability make Bumbleride feel like a long-term family companion rather than a single-function tool.`
    },
    news_12: {
      title: "Science Tip: Why Low Standover Matters More Than Large Wheels for Early Riders",
      summary: "At the beginner stage, the key is not speed. Children need to stop, put both feet down, and restart with confidence.",
      author: "BalanceBikeToddler Editorial Team",
      readTime: "4 min read",
      content: `### Low Standover Determines Whether Children Dare to Start

Parents often focus on wheel size, but early riders care most about whether they can get on, stop, and touch the ground quickly when balance breaks.

#### 1. Foot-down confidence lowers fear
When children learn on balance bikes or kids bikes, falls often happen because they cannot support themselves in time. Low standover makes practice less intimidating.

#### 2. Bigger wheels are not always better
Large wheels improve rollover, but they can raise height and weight. For beginners, standing clearance and weight ratio matter more than sizing up too early.`
    },
    news_13: {
      title: "Science Tip: Scooter Steering Design Changes How Children Learn Balance",
      summary: "Lean steering and handlebar steering train different control patterns, so families should choose based on age, surface, and riding goals.",
      author: "BalanceBikeToddler Editorial Team",
      readTime: "4 min read",
      content: `### Steering Structure Shapes Body Learning

Kids scooters often follow two routes: leaning the body to steer, or turning the handlebar directly. Neither is universally better; they teach different skills.

#### 1. Lean steering trains whole-body control
Three-wheel lean scooters help younger children coordinate shoulders, hips, and ankles while usually keeping speed in a safer range.

#### 2. Handlebar steering feels closer to cycling
Handlebar steering responds directly, but can turn sharply at speed. It is better for children who already understand slowing down and avoiding obstacles.`
    }
  };

  const item = db[art.id] || {
    title: art.title,
    summary: art.summary,
    author: art.author,
    readTime: art.readTime,
    content: art.content
  };

  return {
    ...art,
    title: item.title,
    summary: item.summary,
    categoryLabel: categoryLabels[art.category] || art.category,
    author: item.author,
    readTime: item.readTime,
    content: item.content
  };
}

export function translateGuideArticle(art: any, lang: "zh" | "en") {
  if (lang === "zh") return art;

  const categoryLabels: Record<string, string> = {
    beginner: "Beginners' Bible",
    risk: "Safety Assessment",
    budget: "Budget Guide",
    export: "Import Standards",
    maintenance: "Routine Maintenance",
    scenario: "Scenario Planning",
    special: "Category Special",
    category_spec: "Category Special"
  };

  const db: Record<string, { title: string; summary: string; author: string; readTime: string; content: string }> = {
    // 1. Stroller Articles
    guide_stroller_1: {
      title: "Baby Stroller Suspension & Spinal Safety Sizing Guide",
      summary: "Understand infant skeletal loads. Learn how shock absorption link arms and high-traction pneumatic tires preserve spine health.",
      author: "BalanceBikeToddler Editorial Team",
      readTime: "8 min read",
      content: `### Stroller Suspension & Ride Comfort

Suspension and tire choice shape how much road buzz reaches the seat. Here is how the pieces fit together.

#### 1. Why Lightweight Umbrella Prams Feel Bumpier
To hit low fold weights, umbrella strollers use smaller wheels and simpler suspension. On rough pavement that means more vibration at the seat.

#### 2. The Comfort Stack
*   **Pneumatic Tires**: Air cushions finer road buzz and suits uneven sidewalks.
*   **Suspension Springs**: Absorb bigger impacts at kerbs and steps.
*   **Frame Flex**: A slightly flexible frame spreads loads; a rigid one transmits them.`
    },
    guide_stroller_2: {
      title: "High-View Stroller vs. Lightweight Pram: Scenario Guide",
      summary: "Balancing heavy structural comfort against fast one-hand folding portability for suburban trains and rugged camping paths.",
      author: "BalanceBikeToddler Editorial Team",
      readTime: "7 min read",
      content: `### Selecting Stroller Categories by Spatial Context

Match the stroller to where you will actually push it.

#### 1. High-density Metro & School Gate Transits
Prioritize strollers around 5.8kg - 6.5kg with a reliable one-hand fold that survives narrow gates and elevators.

#### 2. Outdoor Grass & Off-road
Small hard plastic wheels sink on grass. Larger pneumatic wheels roll over uneven ground.`
    },
    guide_stroller_3: {
      title: "How to Choose a Baby Stroller: Spinal Alignment, Suspension & Safety Guide",
      summary: "Expert biomechanical guide on how to choose a baby stroller. Evaluate high-view comfort tires, ergonomic back support plates, and rollover indicators.",
      author: "BalanceBikeToddler Editorial Team",
      readTime: "8 min read",
      content: `### How to Choose a Baby Stroller

Start with where and how you travel, then check the published specifications.

#### 1. Ride Comfort
*   **Tire Type**: Pneumatic tires cushion finer road buzz; foam tires trade some comfort for no-flat convenience.
*   **Suspension**: Springs and frame flex absorb bigger impacts. Compare wheel size and suspension type in the published specs.

#### 2. Seat & Recline
*   **Back Support**: A firm, flat backrest supports newborns in lie-flat mode.
*   **Recline Range**: Check the manufacturer's published recline angles and the recommended age for each position.`
    },

    // 2. Kids Bike Articles
    guide_bicycle_1: {
      title: "Kids Bicycle Braking Safety: Coaster, Handbrakes & Safety Boundaries",
      summary: "Why coaster brakes frustrate beginner riders, and how to judge brake reach for small hands.",
      author: "BalanceBikeToddler Editorial Team",
      readTime: "6 min read",
      content: `### Kids Bicycle Brake Safety & Stopping Distances

Many 12-14 in. starter bikes come equipped with back-pedal coaster brakes. While standard in classic designs, this setup can seriously hinder toddler progress.

#### 1. The Coaster Brake Learning Trap
*   **Balance Loss**: Beginners naturally back-pedal to recover balance when wobbling. Sudden locking of the rear wheel throws them off.
*   **Start-off Struggles**: To start rolling, kids need to back-rotate pedals to a 45-degree angle. Coaster systems instantly lock, preventing easy start-offs.

#### 2. Handbrake Ergonomic Standards
*   **V-Brake/Disc Mechanics**: Deliver high deceleration under low finger clamping forces (<10N).
*   **Micro Reach Lever**: Many kids bikes publish a short lever travel for small hands; check the spec sheet.`
    },
    guide_bicycle_2: {
      title: "Kids Bicycle Stem Clamp & Chain Durability Self-Check Guide",
      summary: "5-point inspection to ensure tight stem clamps, smooth chains, and ideal cold pressure tire inflation.",
      author: "BalanceBikeToddler Editorial Team",
      readTime: "8 min read",
      content: `### Kids Bike Mechanics: Routine Self-Checks

Loose stem clamps and poorly maintained chains are among the most common mechanical problems parents can catch at home. These checks take a few minutes.

#### 1. Steering Stem Slip Check
Clamp the front wheel between your shins and twist the handlebar firmly. If the stem rotates relative to the wheel, re-torque the stem bolts to the manufacturer's specified value.

#### 2. Tire Inflation
Check the sidewall for the recommended pressure range and keep tires inflated within it. Under-inflated tires feel sluggish and wear faster.`
    },

    // 3. Scooter Articles
    guide_scooter_1: {
      title: "Kids Scooter Sizing Guide: Symmetrical Gravity Steering Height",
      summary: "Why lean-to-steer gravity steering prevents over-rotation flip hazards on daily neighborhood commutes.",
      author: "BalanceBikeToddler Editorial Team",
      readTime: "6 min read",
      content: `### Steering Styles on Kids Scooters

Kids scooters usually steer in one of two ways, and each suits different ages and surfaces.

#### 1. Swivel Steering vs. Lean-to-Steer
*   **Swivel steering**: The handlebar turns the wheels directly, so small inputs produce quick direction changes.
*   **Lean-to-steer**: The child shifts weight to steer, with self-centering forces that smooth out wobbles at speed.

#### 2. Handlebar Height
Set the handlebar around the child's waist to lower chest when standing on the deck, and stay inside the manufacturer's adjustable range.`
    },
    guide_scooter_2: {
      title: "Tipping Hazards of Cheap Scooters: Evading Substandard Steering Gears",
      summary: "A spec-based review of brittle plastics, narrow front wheel tracks, and high-clearance joint wobbles in bargain models.",
      author: "BalanceBikeToddler Editorial Team",
      readTime: "7 min read",
      content: `### What to Check on Budget Scooters

Unbranded low-cost scooters vary widely in materials and finishing. Compare the published specifications, and look at the joints, fasteners, and deck edges up close.

#### 1. Deck & Rider Weight
Check the manufacturer's published maximum rider weight and match it against your child's current weight, with room to grow.

#### 2. Track Width & Deck Clearance
A wider front track and lower deck clearance generally support stability. Compare published dimensions between models instead of relying on one number.`
    },

    // 4. Balance Bike Articles
    guide_balance_1: {
      title: "First Balance Bike Setup: Sizing the Ergonomic Standover Safe Dead-Line",
      summary: "How barefoot inseam measurements determine correct saddle ranges for early learning confidence.",
      author: "BalanceBikeToddler Editorial Team",
      readTime: "9 min read",
      content: `### The Barefoot Inseam Rule for Balance Bikes

Do not shop for children's riding gear by age tags alone. Sizing a first balance bike starts with measuring the child's barefoot inseam.

#### 1. Why Inseam Controls Fit
Both heels should rest flat on the ground when the child sits on the saddle, so they can catch themselves if a ride goes sideways.
*   **Seat Height**: A common rule of thumb is a minimum saddle height around 2-3cm below the measured inseam, so knees bend comfortably for strides.
*   Adjust the seat as the child grows rather than buying up a size.

#### 2. First Bike Weight
Lighter frames are easier for toddlers to control. Compare the manufacturer's published weight against the 30%-of-body-weight guidance on our sizing page.`
    },
    guide_balance_2: {
      title: "Ultralight Balance Bikes: Materials Audit of Aluminum vs. Magnesium vs. Steel",
      summary: "Comparing total vehicle weights against a child's 30% body-weight threshold for muscle ergonomics.",
      author: "BalanceBikeToddler Editorial Team",
      readTime: "7 min read",
      content: `### Balance Bike Weights: Materials Comparison

Total weight matters for how confidently a toddler can handle a bike. Our sizing guidance uses 30% of the child's body weight as a soft ceiling for the ride system.

#### 1. Steel Frames
Steel frames are durable and affordable, and typically weigh more than aluminum or magnesium equivalents. Check the manufacturer's published weight for each model.

#### 2. Aluminum & Magnesium
*   **Aluminum 6061**: A common strength-to-weight choice, rust-resistant, with published weights often in the 2.9-3.5kg range for balance bikes.
*   **Magnesium one-piece castings**: Reduce weld joints and allow cleaner frame shapes.`
    },
    guide_balance_3: {
      title: "Scientific Checklist for First Starter Balance Bike for 1 Year Old",
      summary: "Is a baby ready to slide? Biomechanical rules of selecting a proper balance bike for 1 year old infants, including inseam and steering angles.",
      author: "BalanceBikeToddler Editorial Team",
      readTime: "7 min read",
      content: `### Choosing a First Balance Bike for a 1-Year-Old

Most children are ready to try a balance bike somewhere between 12 and 18 months, when they can walk steadily and follow simple instructions.

#### 1. Seat Height Comes First
*   **Inseam Match**: Set the minimum saddle height at or below the child's barefoot inseam so both feet plant flat on the ground.
*   **Adjustable Range**: Pick a frame whose seat adjusts low enough for today and high enough for the next year.

#### 2. Steering & Weight
*   **Steering Limiter**: Many first bikes ship with a restricted steering range; follow the manufacturer's guidance on when to widen it.
*   **Weight**: Keep the bike light relative to the child — our sizing guidance treats 30% of body weight as a soft ceiling.`
    },

    // 5. Electric Car Articles
    guide_electric_1: {
      title: "Kids Electric Car Battery Safety & Anti-Tip Rollover Verification",
      summary: "Preventing battery leakages, self-ignition points, and selecting wide wheelbases to block side tipping.",
      author: "BalanceBikeToddler Editorial Team",
      readTime: "8 min read",
      content: `### Electric Ride-On Cars: Battery & Charging Checklist

Electric ride-ons run on sealed lead-acid or lithium battery packs. Both are safe when used as the manufacturer instructs — and both need adult-supervised charging.

#### 1. Battery & Charging
*   Use only the charger supplied or specified by the manufacturer.
*   Charge on a dry, hard surface away from bedding, and unplug when charging completes.
*   Stop use and contact the seller if the pack is swollen, damaged, or smells unusual.

#### 2. Stability
Battery packs add weight low in the vehicle. Check the manufacturer's published weight limits, age range, and maximum rider weight before buying.`
    },
    guide_electric_2: {
      title: "Dual-Drive Electric Rig: Anti-Skid Tire Traction & Smooth Soft-Start Protection",
      summary: "Comparing tire traction on wet paths, and how progressive acceleration protects younger riders.",
      author: "BalanceBikeToddler Editorial Team",
      readTime: "7 min read",
      content: `### Electric Ride-Ons: Acceleration & Tires

Many electric ride-ons offer a progressive soft-start that ramps up speed instead of launching immediately. If the product page lists it, prefer it for younger riders.

#### 1. Why Soft-Start Matters
A gradual start gives the child time to grip and brace, which matters most on the first rides.

#### 2. Tire Choice
Hard plastic wheels suit smooth indoor floors; softer EVA or rubber treads grip better outdoors. Match the tire type to where the child will actually ride.`
    },
    guide_1: {
      title: "First Kid Bike Buyer's Bible: Age & Metric Calculation Calculator Guide",
      summary: "Understand how age, shoe-less leg inseam distance, weight, and wheel dimensions correlate to prevent joint fatigue.",
      author: "BalanceBikeToddler Editorial Team",
      readTime: "8 min read",
      content: `### Scientific Sizing Blueprint for Toddler Riders

When picking a child's first bike, avoid relying solely on salesperson suggestions. Choosing the wrong geometry causes back strain and discourages active riding.

#### 1. Sizing Golden Rule: Target Shoe-less Inseam (Leg Cross Height)
*   **Measurement Method**: Place the child bare-foot flat against a flat wall, slide a flat hardcover book snug up their crotch line, and measure the distance from the floor to the top margin of the book.
*   **Optimal Bounds**:
    *   **Balance Bike**: Bottom seat height should sit **2-3 cm lower** than measured inseam (guaranteeing both heels plant firmly on pavement).
    *   **Bicycle with training wheels**: Active seat height can align flush with inseam.
    *   **Normal Two-Wheel Pedal Bike**: Frame saddle should sit **2-4 cm higher** than measured inseam.

#### 2. Size-to-Age Correlation Curve
*   **1.5 - 3 Years**: 12 in. ultra-lightweight balance bike setting. Perfect for inner ear vestibular balance mapping.
*   **3 - 5 Years**: Transitioning directly into a 14 in. or 16 in. premium hand-brake bicycle.
*   **5 - 8 Years**: 16 in. to 20 in. lightweight mountain gear setup.`
    },
    guide_2: {
      title: "Deciphering Multi-in-One Convertible Toy Scatters: Structural Tipping Risks",
      summary: "Scientific warning on low-price '3-in-1' scooters and balance boards. Unraveling folding lock tolerances and balance failures.",
      author: "BalanceBikeToddler Editorial Team",
      readTime: "6 min read",
      content: `### The Engineering Trade-Offs of 'Multi-in-One' Toys

Multi-functional conversions look economical, but each added mode means more joints, locks, and plastic tabs that can wear.

#### 1. Joints and Fasteners
*   **Tolerance Wear**: Every conversion cycle works the same fasteners. Re-check bolts and pins against the manual, and retire the product if joints no longer hold firmly.
*   **Conflicting Geometry**: Balance bikes and scooters want different weight distribution; a frame that does both compromises each mode.

#### 2. Self-Check Before Buying
*   Prefer dedicated single-purpose equipment when budget allows.
*   If buying a convertible model, favour fewer conversion modes and metal-to-metal locking points over plastic click tabs.`
    },
    guide_3: {
      title: "CE, CPSC, ISO 8098: De-shrouding Global Regulatory Standard Frameworks",
      summary: "A breakdown of ASTM F963-17, EN 1888, and CPSIA heavy metal thresholds for international importers and buyers.",
      author: "BalanceBikeToddler Editorial Team",
      readTime: "7 min read",
      content: `### Global Regulatory Standards for Child Mobility

Compliance acronyms commonly listed on kids' product pages, in plain language.

#### 1. US Consumer Product Safety Commission (CPSC)
*   **CPSC**: The US federal agency whose rules (including CPSIA chemical limits) cover children's products sold in the United States.
*   **CPSIA**: Governs cadmium, lead, and phthalate limits in children's products, including handlebars and grips.
*   **ASTM F963**: The US toy safety standard, covering mechanical and chemical requirements.

#### 2. European Union CE Mark (EN 71, EN 1888)
*   **EN 71-1/-2/-3**: The EU toy safety series, covering mechanical/physical properties, flammability, and chemical migration.
*   **EN 1888**: The EU standard family for wheeled child carry devices (strollers and pushchairs).
*   **ISO 8098**: The international standard for children's bicycles, referenced in our braking guidance.`
    },
    guide_4: {
      title: "5-Step Routine Safety Maintenance Checklist for Strollers & Bikes",
      summary: "Routine safety calibrations for handbrake clearances, hub quick-release tightness, cold pressure inflation, and correct lubrication of metal chains.",
      author: "BalanceBikeToddler Editorial Team",
      readTime: "9 min read",
      content: `### Routine 5-Point Structural Inspection

Even the finest Woom or Bugaboo designs fail if lubrication and brake wire adjustments are neglected. Follow this 5-minute schedule every quarter:

#### 1. Handbrake Clearance Adjustment (Safe Red Line)
Squeeze the brake lever with two fingers. The pads should contact the rim well before the lever reaches the grip; if it pulls all the way back, the cable needs adjusting.

#### 2. Stem Screw Check
Securing the vertical stem alignment. Ensure that clamp bolts remain tightly torqued to prevent sudden misalignment on downslopes.

#### 3. Quick-Release Anchors
Check the wheel axle clamps. Hand clamps must require significant palm pressure (leaving a brief mark) to snap fully shut.`
    },
    guide_5: {
      title: "Scenario-Driven Guide: Urban Mass Transit vs. Rough Country Terrain Setups",
      summary: "Match your child's vehicle profile to subways, small lifts, or outdoor campsites to avoid closet-dust collection.",
      author: "BalanceBikeToddler Editorial Team",
      readTime: "7 min read",
      content: `### Choosing Based on Space & Usage Patterns

Avoid purchasing an oversized all-terrain stroller if it cannot fit inside your building elevator, or selecting a heavy steel mountain bike if you live on the third floor of a walk-up.

#### 1. Rough Trails & Outdoor Camping
*   **Acoustic & Vibration Dampening**: Mud and gravel introduce heavy vibrations.
*   **Top Selections**: Air tires above 2.25 in. width paired with parent chassis suspension links (e.g., Bugaboo Fox 5).

#### 2. High-Density Suburban Subway Commutes
*   **Portability First**: Single hand fast-fold properties and lightweight under 6.2 kg are essential.
*   **Top Selections**: Highly compact strollers (e.g., Babyzen YOYO2) and lightweight balance bikes under 3.2 kg (e.g., Woom 1).`
    }
  };

  const item = db[art.id] || {
    title: art.title,
    summary: art.summary,
    author: art.author,
    readTime: art.readTime,
    content: art.content
  };

  return {
    ...art,
    title: item.title,
    summary: item.summary,
    categoryLabel: categoryLabels[art.category] || art.category,
    author: item.author,
    readTime: item.readTime,
    content: item.content
  };
}
