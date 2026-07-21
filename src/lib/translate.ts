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
    topBanner: "KIDSMOBI · 全球高端童车品牌垂直导购平台 · 专注安全、工效与健康骑行",
    brandTitle: "KIDSMOBI",
    versionStamp: "2026 PREMIUM",
    subTitle: "高端垂直童车评测平台",
    navHome: "首页",
    navProducts: "产品中心",
    navEvaluations: "评测中心",
    navGuides: "选购指南 (含 Smart Finder 🔍)",
    navNews: "全球资讯",
    navAbout: "关于我们",
    navLanguage: "🌐 简体中文",
    closeAdvisor: "关闭顾问",
    connectAdvisor: "连线专家",
    advisorTitle: "KIDSMOBI 高端童车安全顾问",
    advisorLoading: "正在为您进行多维度工效匹配...",

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
    sloganBadge: "高端童车甄选标准 · 儿科医生推荐推荐准则",
    sloganHeading1: "高端垂直",
    sloganHeading2: "童车评测",
    sloganHeading3: "平台",
    sloganDesc: "KIDSMOBI 致力于通过严苛的儿科医学参数、力学安全评估与智能工效匹配，在海量冗余信息中，为精英家庭选出更健康、更安全的专业座驾。拒绝平庸，只为成长。",
    btnWizard: "智能选车助手 🔬",
    btnDatabase: "品牌全系列库 📂",
    radarTitle: "物理安全雷达公示区",
    radarWeight: "1. 全自研称重设备精密：",
    radarShock: "2. 避震颠震疲劳测试：",
    radarTraction: "3. 重载防爆抓地摩擦：",
    radarTested: "4. 已公示第三方检测：",
    radarTestedVal: "12 款爆品",
    recallTitle: "行业突发安全快讯 (Real-time Recall Alert)",
    recallDesc: "美国 CPSC 已对4款高碳钢重合金自行车发布倾斜侧翻砸碰警告。请家长计算车重比。",
    recallBtn: "查看合规报告 →",
    goldRankings: "2026 年度物理勋章金榜 (Annual Gold Rankings)",
    goldRankingsDesc: "历时百天连续疲劳测试，筛选出各细分品类的安全优胜标兵",
    safetyScoreLabel: "安全得分:",
    promoTitle: "实验室主推：实测对比报告展示区",
    promoDesc: "深入揭露低端变形拼接车材料弊病，宣扬正向工效学设计",
    promoItem1Tag: "实测甄别亮点",
    promoItem1Title: "儿童前庭颈椎安全：为什么我们坚决抵制发泡实心轮胎？",
    promoItem1Desc: "在我们使用台式超高频颠震滚筒仪测量中，EVA实心发泡车胎的颠阻过滤率不足橡胶打气胎的 20%。多余的颤动震力将直接沿龙头骨架钻入幼童娇嫩的在耳蜗前庭系统，引发眩晕和抗拒骑车行为。",
    promoItem2Tag: "选购评估要点",
    promoItem2Title: "解密拼贴式「多合一变形滑滑车」的结构性平衡隐患",
    promoItem2Desc: "多功能拼接变形车存在着大量快速装配插销，在使用3个月后空滑公差会严重松脱，公厘偏转大于 12mm。重心设置过于迁就，过弯拐角极容易发生失稳侧翻。",

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
    topBanner: "Global Kids Bike Testing Platform · Based on ISO 8098 Braking & Gravity Standards · 100% Self-funded & Unbiased",
    brandTitle: "KIDSMOBI",
    versionStamp: "LAB VERIFIED",
    subTitle: "KIDSMOBI · Global Buyer's Decision Portal",
    navHome: "Home",
    navProducts: "Products",
    navEvaluations: "Reviews",
    navGuides: "Buyer's Guide (with Smart Finder 🔍)",
    navNews: "Global News",
    navAbout: "About Us",
    navLanguage: "🌐 English",
    closeAdvisor: "Close AI Advisor",
    connectAdvisor: "Advisor",
    advisorTitle: "Physics safety & Ergonomics AI Advisor",
    advisorLoading: "Analyzing multi-dimensional structural tolerances...",

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
    sloganBadge: "Global Maternity Test Standards · ISO 8098 Braking Calibrated",
    sloganHeading1: "Global Kids Bike",
    sloganHeading2: "Independent Review",
    sloganHeading3: "Portal",
    sloganDesc: "Conforming to strict safety frameworks (BabyGearLab), providing hardcore multi-dimensional metrics such as brake reach, Q-factor, and frame structural fatigue. Unbiased, unsponsored testing to protect your child's spinal health and safe riding!",
    btnWizard: "Smart Wizard 🔬",
    btnDatabase: "All Products 📂",
    radarTitle: "Safety Metrics Live",
    radarWeight: "1. Precision Weighting Tech:",
    radarShock: "2. Vibration Rig Fatigue Test:",
    radarTraction: "3. Heavy-Duty Grip Traction:",
    radarTested: "4. Verified Products Listed:",
    radarTestedVal: "12 Top Models",
    recallTitle: "Critical Safety Alert (Real-time Recall)",
    recallDesc: "US CPSC has issued tipping/recall warnings for heavy carbon-steel kid bikes as excessive bike-to-child weight ratio leads to severe injuries.",
    recallBtn: "View Safety Report →",
    goldRankings: "2026 Annual Physics Gold Medal Winners",
    goldRankingsDesc: "After 100+ days of continuous mechanical stress testing, we present winning products in each class.",
    safetyScoreLabel: "Safety Score:",
    promoTitle: "Lab Exclusive: Testing & Comparative Insights",
    promoDesc: "Exposing the hidden material design flaws in cheap, multi-functional kid bikes, and championing ergonomic engineering.",
    promoItem1Tag: "Lab Insight",
    promoItem1Title: "Spine & Senses Protection: Why We Decidedly Object to Solid EVA Foam Tires?",
    promoItem1Desc: "In high-frequency vibration rig tests, solid EVA foam tires filtered out less than 20% of the micro-vibrations filtered by pneumatic rubber tires. Extra shock translates directly into child's neck and vestibular nerves, causing dizziness and aversion.",
    promoItem2Tag: "Technical Alert",
    promoItem2Title: "Analyzing the 'All-in-One Multi-functional Scooter / Walker'",
    promoItem2Desc: "Multi-functional transformer bikes rely on high-clearance quick-release pins. After 3 months, clearances expand over 12mm, causing loose steering, off-center weight gravity blocks, and potential tip-overs.",

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
      case "balance": return "滑步/平衡车";
      case "bicycle": return "儿童脚踏自行车";
      case "scooter": return "滑板车";
      case "stroller": return "高景观/双向推车";
      case "electric_car": return "电动越野车";
      case "tricycle": return "多功能三轮车";
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
    editorVerdict: "A premium product from a world-class mountain biking brand. Outstanding weld-fatigue limits and rugged paint protection. The massive 2.3'' tires conquer sand and tree tracks with ease, but the heavy high carbon-steel frame requires strong pedaling.",
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
      "All-wheel mechanical suspensions and tubeless air-tires absorb up to 98% of shocks.",
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
    editorVerdict: "A mini electric beast in kart style. With exceptionally low physical centers of gravity, tilt tests show a high 42% rollover margin under sharp 180-degree drift turns. Highly recommended for empty paved courts.",
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
    editorVerdict: "A true fortress for vehicle protection. It surpasses the stringent EU ECE R129 side-collision testing, reducing cervical pull forces by 25%. Its high-absorbent foam pads immediately disperse crash impacts.",
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

function translateMaterialToEn(mat: string): string {
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

function translateSafetyCertificationToEn(certifications: string[]): string[] {
  if (!certifications) return [];
  return certifications.map(cert => {
    return cert
      .replace("(美标)", "(US Standard)")
      .replace("(欧标)", "(EU Standard)")
      .replace("(国标)", "(CN Standard)")
      .replace("(美标电摩安全)", "(US E-Moto Safety)")
      .replace("(欧标电能性)", "(EU Electrical)")
      .replace("(中国强制玩具等效等规)", "(CN Toy Equiv.)")
      .replace("(欧盟最新i-Size高标认证)", "(EU i-Size latest)")
      .replace("(欧标顶级)", "(EU Top Standard)");
  });
}

function cleanVisibleProductText(value: unknown) {
  return String(value || "")
    .replace(/^editor\s+verdict\s*[:：-]\s*/i, "")
    .replace(/\s*\(\s*Features\[\d+\]\s*\)\s*/gi, " ")
    .replace(/\s*\(\s*Product\s+Feature\s*\)\s*/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
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
    description: cleanVisibleProductText(product.description),
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

export function translateProduct(p: any, lang: "zh" | "en") {
  const categoryLabel = translateCategory(p.category, lang);
  
  // Use localized data from CMS if available
  const localData = p[lang] || {};
  const name = localData.name || p.name;
  const localizedDescription = String(localData.description || "").trim();
  const description =
    localizedDescription && !isPlaceholderLocalizedDescription(localizedDescription)
      ? localizedDescription
      : p.description;
  const pros = localData.pros || p.pros || [];
  const cons = localData.cons || p.cons || [];
  const editorVerdict = localData.editorVerdict || p.editorVerdict || "";
  const brandText = localData.brandText || p.brand;
  const specsText = localData.specsText || p.specsText || "";

  if (lang === "zh") {
    return sanitizeVisibleProductFields({ 
      ...p, 
      name,
      description,
      pros,
      cons,
      editorVerdict,
      brand: brandText,
      specsText,
      categoryLabel 
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
      brand: brandMap[p.brand] || brandText || p.brand,
      categoryLabel,
      material: translateMaterialToEn(p.material),
      tireType: translateTireToEn(p.tireType),
      brakeType: translateBrakeToEn(p.brakeType),
      wheelSize: p.wheelSize === "无" ? "None" : p.wheelSize.replace("寸", " in."),
      safetyCertification: translateSafetyCertificationToEn(p.safetyCertification),
      pros: enOverride.pros,
      cons: enOverride.cons,
      ageRange: p.ageRange.replace("岁", " Years").replace("个", " ").replace("月", " Months"),
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
      pros: localData.pros || pros || [],
      cons: localData.cons || cons || [],
      editorVerdict: localData.editorVerdict || editorVerdict || "",
      brand: brandMap[p.brand] || brandText || p.brand,
      specsText: localData.specsText || specsText || "",
      categoryLabel,
      material: translateMaterialToEn(p.material),
      tireType: translateTireToEn(p.tireType),
      brakeType: translateBrakeToEn(p.brakeType),
      wheelSize: p.wheelSize === "无" ? "None" : p.wheelSize.replace("寸", " in."),
      safetyCertification: translateSafetyCertificationToEn(p.safetyCertification),
      ageRange: p.ageRange.replace("岁", " Years").replace("个", " ").replace("月", " Months")
    });
  }

  // Extreme fallback
  return sanitizeVisibleProductFields({
    ...p,
    name,
    description,
    brand: brandMap[p.brand] || p.brand,
    categoryLabel,
    material: translateMaterialToEn(p.material),
    tireType: translateTireToEn(p.tireType),
    brakeType: translateBrakeToEn(p.brakeType),
    wheelSize: p.wheelSize === "无" ? "None" : p.wheelSize.replace("寸", " in."),
    safetyCertification: translateSafetyCertificationToEn(p.safetyCertification),
    pros,
    cons,
    ageRange: p.ageRange,
    editorVerdict: editorVerdict ? editorVerdict : "Independently verified kids stroller or bicycle setup.",
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
      title: "EU Updates EN 1888-1:2026 Stricter Rollover Safety Standard for Strollers",
      summary: "The European Committee for Standardization has refined safety standards updates, forcing rigid posture boards and dynamic roll vibration absorption controls to protect infant vestibular health.",
      author: "Regulatory Division - Min-Hua Wei",
      readTime: "5 min read",
      content: `### EU EN 1888-1:2026 Kids Bicycle & Stroller Standard Overhaul

The European Union met in Brussels to formalize strict structural and posture standards:

#### 1. Crucial Regulatory Upgrades
*   **Rigid Posture Support Mandate**: Newborn lay-back carriages must provide rigid physical backing boards between 170° and 175° limit bounds to avoid spinal curves.
*   **Active Multi-Axis Vibrations**: Secondary wheels are tested to assess micro-vibrations transmission directly into children's heads and vestibular nerves.

#### 2. Strategic Advising for Parents
When buying baby strollers, please decidedly avoid fabric meshes with no hard underlying support. Solid posture plates protect vertebrae and breathing paths.`
    },
    news_2: {
      title: "Lightweight Kids Mobility Becomes the 2026 Family Buying Theme",
      summary: "Across strollers, balance bikes, kids bikes, and scooters, families are shifting toward products that are light, easy to store, and easier to maintain.",
      author: "KIDSMOBI Market Desk",
      readTime: "4 min read",
      content: `### 2026 Industry Trend: Lighter, Easier, More Family-Friendly

    For years, children’s mobility products were sold with bigger frames, thicker tubes, and heavier-duty claims. In real family use, though, parents feel value through a different lens: can one adult carry it, can the child control it, and does it fit stairs, elevators, and car trunks?

    #### 1. Lightweight is household efficiency
    A good stroller, balance bike, kids bike, or scooter should reduce friction for both child and caregiver. Lightweight frames, predictable wheels, adjustable touchpoints, and stable folding systems are becoming the new purchase language.

    #### 2. Parents now buy by scenario
    Commuting families care about fold size and carry weight. Park families care about grip and vibration. School-age families care about brake feedback and maintenance cost. Brands that explain where a product fits are easier to trust.

    #### 3. KIDSMOBI view
    The next durable brands will not simply shout specifications. They will explain who the product suits, which roads it fits, which budget band it occupies, and how often it needs care.`
    },
    news_3: {
      title: "2026 Kids Bike Global Launch: Woom Explore & Specialized Riprock Pro Carbon Release",
      summary: "Pioneering premium kids cycling brands release carbon composition frameworks and responsive micro-reach custom oil disc brakes to save toddler palms.",
      author: "Hardware Analyst - Junjie Xiao",
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
      author: "Supply Chain Expert - Chen Ye",
      readTime: "7 min read",
      content: `### Industrial Leaps: The Integrated Magnesium Shell Boom

Chinese casting foundries transition away from heavy weld joints into high-tensile seamless bodies:

#### 1. 45-Second Casting Cycles
High tonnage hydraulic presses stamp 0.9kg aerodynamic kid bike frames with flawless mechanical density and zero hazardous welds.

#### 2. Lab Testing Consensus
Our lab stress metrics show magnesium composite frameworks withstand up to 30% higher cyclic loads compared to old steel alloys, maintaining excellent weight boundaries.`
    },
    news_5: {
      title: "Shoring Up Children's Vestibular Health: Pneumatic Tires vs. EVA Foam Wheels",
      summary: "Clinical physical therapists and biomechanics specialists evaluate long-term micro-vibrations impact on developing toddler brains and cervical spines.",
      author: "Consultant Pediatric Therapist - Dr. Zheng",
      readTime: "5 min read",
      content: `### Vestibular Protection: Pneumatic Tires vs. Cheap Solid EVA Foam

Cheap balance bikes often tout 'maintenance-free, puncture-safe flat-free tires.' But in pediatric medicine, EVA foam wheels represent a massive spine hazard.

#### 1. Severe Micro-Vibration Impact
EVA foam does not contract like air-filled compartments. When kids ride over pavement blind sidewalks, the solid vibrations translate directly up wrists and neck lines into vestibular nerves, causing balance fatigue, vertigo, and ride-refusing behavior.

#### 2. True Pneumatic Dampening Performance
Air tires ingest and dissolve up to 95% of micro-vibrations via gas deflection, preserving delicate joints and ensuring excellent side-traction during tight turns.`
    },
    news_6: {
      title: "2026 Industry Trend: Families Move From Single Products to Scenario Bundles",
      summary: "Strollers, balance bikes, kids bikes, and scooters are increasingly bought as connected mobility setups for commuting, weekends, parks, and growth stages.",
      author: "KIDSMOBI Industry Desk",
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
      author: "KIDSMOBI Market Research",
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
      author: "KIDSMOBI Compliance Desk",
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
      author: "KIDSMOBI Risk Review",
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
      author: "KIDSMOBI Brand Desk",
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
      author: "KIDSMOBI Brand Research",
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
      author: "KIDSMOBI Ergonomics Lab",
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
      author: "KIDSMOBI Motor Development Lab",
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
    guide_1: {
      title: "First Kid Bike Buyer's Bible: Age & Metric Calculation Calculator Guide",
      summary: "Understand how age, shoe-less leg inseam distance, weight, and wheel dimensions correlate to prevent joint fatigue.",
      author: "Ergonomics Lead - Prof. Ge",
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
      author: "Material Risk Auditor - Marios",
      readTime: "6 min read",
      content: `### Risk Audit: The Engineering Traps of 'Multi-in-One' Toys

Multi-functional conversions appear economical but routinely carry severe mechanical stability flaws:

#### 1. Elastic Fatigue of Multi-Axis Joints
To accommodate multi-use states (stroller pusher, balance saddle, kick scooter), factories introduce numerous plastic joints, lock hooks, and click tabs.
*   **Tolerance Wear**: Frequent conversions lead to sliding bolt gaps, altering frame geometry up to 12.5mm and triggering high-speed yaw.
*   **High Center of Gravity**: Balanced bikes require narrow, rear-loaded geometry, whereas scooters require forward weight distribution. Multi-functional frames compromise both, frequently tipping over.

#### 2. Self-Check Safety Bounds
*   Purchase dedicated single-purpose equipment.
*   For scooters, prefer lean-to-steer mechanisms with magnetic rebound forces, exemplified by the Swiss Micro scooter.`
    },
    guide_3: {
      title: "CE, CPSC, ISO 8098: De-shrouding Global Regulatory Standard Frameworks",
      summary: "A breakdown of ASTM F963-17, EN 1888, and CPSIA heavy metal thresholds for international importers and buyers.",
      author: "Compliance Specialist - Jane Jia",
      readTime: "7 min read",
      content: `### Global Regulatory Standards for Child Mobility

Decoded compliance acronyms commonly required for pediatric devices:

#### 1. US Consumer Product Safety Commission (CPSC)
*   **Coaster Brakes**: Heavily mandates coaster (pedal-back) hub brakes on 12-16 in. kid bikes.
*   **CPSIA (Chemical Limits)**: Governs cadmium, lead, and 8P phthalate plasticizers in handlebars.

#### 2. European Union CE Mark Directive (EN 71, EN 1888)
*   **EN 71-1/-2/-3**: Rigorous physical durability checks. Bans small plastic pieces (<3.17cm diameter) from shearing or separating under tension.
*   **EN 1888 (Strollers)**: The undisputed peak of multi-axis fatigue and roll-over angle testing.`
    },
    guide_4: {
      title: "5-Step Routine Safety Maintenance Checklist for Strollers & Bikes",
      summary: "Routine safety calibrations for handbrake clearances, hub quick-release tightness, cold pressure inflation, and correct lubrication of metal chains.",
      author: "Master Mechanic - Yang Lu",
      readTime: "9 min read",
      content: `### Routine 5-Point Structural Inspection

Even the finest Woom or Bugaboo designs fail if lubrication and brake wire adjustments are neglected. Follow this 5-minute schedule every quarter:

#### 1. Handbrake Clearance Adjustment (Safe Red Line)
Squeeze the brake lever with two fingers. At 20-25mm from the handlebar grip, the V-brake pads must contact the rim completely, stopping the wheel. If the lever goes close to the grip, the wire tension is insufficient.

#### 2. Stem Screw Check
Securing the vertical stem alignment. Ensure that clamp bolts remain tightly torqued to prevent sudden misalignment on downslopes.

#### 3. Quick-Release Anchors
Check the wheel axle clamps. Hand clamps must require significant palm pressure (leaving a brief mark) to snap fully shut.`
    },
    guide_5: {
      title: "Scenario-Driven Guide: Urban Mass Transit vs. Rough Country Terrain Setups",
      summary: "Match your child's vehicle profile to subways, small lifts, or outdoor campsites to avoid closet-dust collection.",
      author: "Parenting Coach - Mom Emma",
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
