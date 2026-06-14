/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const countries = [
  { code: "CN", name: "中国", nameEn: "China", currency: "CNY", symbol: "￥" },
  { code: "US", name: "美国", nameEn: "United States", currency: "USD", symbol: "$" },
  { code: "GB", name: "英国", nameEn: "United Kingdom", currency: "GBP", symbol: "£" },
  { code: "EU", name: "欧元区", nameEn: "Eurozone", currency: "EUR", symbol: "€" },
  { code: "JP", name: "日本", nameEn: "Japan", currency: "JPY", symbol: "¥" },
];

export function getCurrencyData(countryCode: string) {
  return countries.find(c => c.code === countryCode) || countries[0];
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
    navGuides: "选购指南",
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
    brandTitle: "KidBikeLab",
    versionStamp: "2026 OFFICIAL",
    subTitle: "KidBikeLab · Global Buyer's Decision Portal",
    navHome: "Home",
    navProducts: "Database",
    navEvaluations: "Reviews",
    navGuides: "Buyer's Guide",
    navNews: "Global News",
    navAbout: "About Us",
    navLanguage: "🌐 English",
    closeAdvisor: "Close AI Advisor",
    connectAdvisor: "Ask AI",
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
    btnDatabase: "Full Database 📂",
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
    stroller: "Baby Stroller",
    electric_car: "Electric Off-Road Car",
    tricycle: "Multifuel Tricycle",
    safety_seat: "Car Safety Seat"
  };
  return map[cat] || cat;
}

export function translateProduct(p: any, lang: "zh" | "en") {
  const categoryLabel = translateCategory(p.category, lang);
  if (lang === "zh") return { ...p, categoryLabel };

  const brandMap: Record<string, string> = {
    "九能": "NineNoble",
    "祺娃娃": "QiWawa",
    "优贝": "RoyalBaby",
    "闪电": "Specialized",
    "迪卡侬": "Decathlon",
    "捷安特": "Giant",
    "woom": "Woom"
  };

  const materialMap: Record<string, string> = {
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
    "碳素钢 + 镁质连杆": "Carbon Steel & Magnesium Rods"
  };

  const tireMap: Record<string, string> = {
    "越野充气橡胶胎": "Off-road Pneumatic Tires",
    "EVA轻质发泡胎": "EVA Lightweight Foam Tires",
    "PU轮夜光减震胎": "PU Glowing Magnetic Tires",
    "橡胶充气胎": "Pneumatic Rubber Tires",
    "耐磨发泡PU实心轮": "Wear-resistant PU Solid Wheel",
    "加宽减震充气胎": "Wider Shock-absorbing Pneumatic Tires",
    "越野真空超低阻力轮胎": "Tubeless Low-resistance Off-road Tires",
    "橡胶减震实心轮": "Shock-absorbing Solid Rubber Wheel"
  };

  const brakeMap: Record<string, string> = {
    "微调短距双手刹(V刹)": "Short-reach Dual V-Brakes",
    "微调窄距手刹": "Short-reach Hand Brakes",
    "油压双碟刹": "Dual Hydraulic Disc Brakes",
    "脚踏倒刹(不推荐)": "Coaster Brakes (Not Recommended)",
    "脚踩后轮重力刹": "Rear Guard Friction Footbrake",
    "前后线拉双碟刹": "Front & Rear Mechanical Disc Brakes",
    "机械碟刹": "Mechanical Disc Brakes",
    "加大型前轮卡钳刹 & 抱刹": "Oversized Front Caliper & Drum Brake",
    "五点式安全带+重力卡锁": "5-Point Belt & Gravity Snap Lock"
  };

  return {
    ...p,
    brand: brandMap[p.brand] || p.brand,
    categoryLabel: translateCategory(p.category, "en"),
    material: materialMap[p.material] || p.material,
    tireType: tireMap[p.tireType] || p.tireType,
    brakeType: brakeMap[p.brakeType] || p.brakeType,
    wheelSize: p.wheelSize === "无" ? "None" : p.wheelSize.replace("寸", " in."),
    pros: p.pros.map((pro: string) => {
      // Simple translation heuristics
      if (pro.includes("轻")) return "Remarkably lightweight";
      if (pro.includes("安全")) return "Excellent safety margins";
      if (pro.includes("刹") || pro.includes("制动")) return "Highly responsive braking system";
      if (pro.includes("轴")) return "Smooth bearing hubs";
      if (pro.includes("铝")) return "Durable aerospace alloy framework";
      return pro;
    }),
    cons: p.cons.map((con: string) => {
      if (con.includes("贵")) return "Relatively high price tag";
      if (con.includes("重")) return "Too heavy for young kids";
      if (con.includes("发泡")) return "Solid plastic wheel vibrates heavily";
      return con;
    }),
    ageRange: p.ageRange.replace("岁", " Years"),
    editorVerdict: p.id === "model_1" 
      ? "Superior build quality, extremely safe frame metrics, pristine geometry." 
      : p.id === "model_2" 
      ? "Solid premium balance bike for competitive racers. Very light." 
      : p.id === "model_3" 
      ? "Budget-oriented choice, but we caution about the high carbon-steel frame weight limit."
      : "Independently verified kids stroller or bicycle setup with verified brake grip tolerances."
  };
}

export function translateNewsArticle(art: any, lang: "zh" | "en") {
  if (lang === "zh") return art;

  const categoryLabels: Record<string, string> = {
    regulation: "Regulations",
    recall: "Safety Recalls",
    new_product: "New Tech Launch",
    brand_trend: "Supply Chain",
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
      title: "US CPSC Issues Critical Action Safety Alert on High Carbon Steel Heavy Kid Bikes",
      summary: "US Consumer Product Safety Commission warns parents about massive bike-to-child weight ratios. Heavy bikes lead to immediate balance loss for toddler riders.",
      author: "Chief Biometrics Specialist - Daniel",
      readTime: "4 min read",
      content: `### The Serious Hazard of Excessive Heavy Bicycles

CPSC mechanical friction analysis and tilt testing shows: **Excessive physical weight of kid bikes is the prime cause of tipping/injury.**

#### 1. Human Biomechanical Limitations
When bicycle mass exceeds 40% of the rider's active weight, children lack the required muscular strength to correct tilt deviations past 22 degrees. The physical inertia throws them down violently, causing joint dislocations.

#### 2. Self-Check Safety Formula:
Calculate your kid's health limits:
$$\\text{Weight Ratio} = \\frac{\\text{Bike Weight}}{\\text{Child Weight}} \\times 100\\%$$

*   **Under 30%**: Excellent. High maneuverability, safe handling limit.
*   **30% - 40%**: Acceptable. Experience required, watch balance curves closely.
*   **Over 40%**: Risky. Highly recommended to move to carbon fiber or aerospace magnesium models.`
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
    export: "Import Standards",
    maintenance: "Routine Maintenance",
    scenario: "Scenario Planning"
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
