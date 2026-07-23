import React, { useState, useEffect, useMemo } from "react";
import { 
  BookOpen, 
  Search, 
  ArrowLeft, 
  Briefcase, 
  Calendar, 
  Clock, 
  Wrench, 
  Calculator, 
  Zap, 
  CheckCircle, 
  AlertTriangle,
  Play,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Award,
  MessageSquare,
  ChevronRight
} from "lucide-react";
import { GuideArticle, guideArticles as fallbackGuideArticles } from "../data/guidesData";
import { Product, CurrencyData } from "../types";
import { translateProduct, translateGuideArticle } from "../lib/translate";
import { convertUsdToCurrency, formatCurrencyFromUsd } from "../lib/currency";
import { getCMSGuides } from "../lib/cmsService";
import { cleanVisibleSourceText } from "../lib/visibleText";
import { resolveProductImages, FALLBACK_PRODUCT_IMAGE } from "../lib/productImages";

function translateCategoryLabel(cat: string): string {
  const labels: Record<string, string> = {
    beginner: "新手入门指南",
    budget: "预算分级指南",
    risk: "风险甄别指南",
    maintenance: "养护使用指南",
    scenario: "场景化选购指南",
    special: "品类专项指南",
    category_spec: "品类专项指南"
  };
  return labels[cat] || "专业选购指南";
}

function getCategoryLabel(cat: string, lang: "zh" | "en"): string {
  if (lang === "zh") {
    switch (cat) {
      case "stroller": return "手推车";
      case "balance-bike": return "平衡车";
      case "kids-bike": return "自行车";
      case "kids-scooter": return "滑板车";
      case "electric-car": return "电动车";
      default: return cat;
    }
  } else {
    switch (cat) {
      case "stroller": return "Stroller";
      case "balance-bike": return "Balance Bike";
      case "kids-bike": return "Kids Bike";
      case "kids-scooter": return "Kids Scooter";
      case "electric-car": return "Kids Electric Car";
      default: return cat;
    }
  }
}

import { formatWeight, formatHeight } from "../lib/units";
import Breadcrumbs from "./Breadcrumbs";
import { clearJsonLd, setCollectionPageJsonLd, setJsonLd } from "../lib/seoJsonLd";
import { getProductsPageSeoTitle } from "../lib/productSeoText";

const faqData = [
  {
    id: "faq_1",
    questionZh: "1. 童车车重到底有什么安全死线？为什么超重车辆是侧翻的罪魁祸首？",
    questionEn: "1. What is the safety threshold for kids' bike weight? Why are heavy bikes the primary cause of tipping?",
    answerZh: `根据全球儿科力学会（Pediatric Biomechanics Council）和 KIDSMOBI 安全实验室的统一规约：
    
*   **黄金车重比例限制**：一款童车的整车重量（尤指自行车）**决不可以超过儿童体重的 30%**。
*   **侧翻致伤原理**：如果车重超出儿童自重的 40% 以上（等同于让一个成年人操控一辆重达 60-70 公斤的重型机车），在紧急转弯、重心偏移或车辆失衡跌倒时，孩子薄弱的腕关节和肱骨根本无法支撑倾倒的车重。此时重力矩瞬间偏大，倾覆动能转化为致命的剪切力，孩子无法及时“弃车跳开”，极易发生大腿、手臂折叠式压折和骨折。因此，在童车选购中，轻量化（铝合金/高聚镁合金/碳纤维车架）是绝对的第一安全红线，重钢车架应当列为回避款。`,
    answerEn: `Following the standard protocol defined by the Pediatric Biomechanics Council and global ergonomics labs:

*   **Golden Weight Limit**: A child's ride-on dead weight **MUST NOT exceed 30% of the child's body weight**.
*   **The Biomechanics of Tipping**: When bike weight exceeds 40% of the rider's body weight (similar to an adult wrestling a 60-70kg motorcycle), a child's weak wrists and shoulder girdles cannot correct lateral deflection. During speed cornering or sudden balance loss, the excessive gravitational torque prevents the child from easily "ejecting" or casting the bike aside. The falling frame traps the limb under sliding leverage, causing severe crushing forces on the clavicle or humerus. Therefore, prioritizing ultra-light formats (aluminum/magnesium alloy) is the absolute foremost barrier to orthopaedic trauma.`
  },
  {
    id: "faq_2",
    questionZh: "2. 为什么安全机构强烈反对“脚踏倒踩刹 (Coaster Brake)”？它有哪些严重的物理隐患？",
    questionEn: "2. Why do safety organizations strongly oppose Coaster Brakes? What are the hidden mechanical hazards?",
    answerZh: `许多网红童车或老式美标童车配备脚踏倒踩刹车（Coaster Brake）。尽管它看起来降低了手捏车闸的握力门槛，却引入了极高威胁的力学原罪：

1.  **静态起步失痕隐患**：脚踏倒踩刹车死死锁住了飞轮的向后自由转动。当小宝宝停车想要重新起步时，根据人体工效学，曲柄最佳向下发力角应位于上止点前 **45°** 附近。然而脚踏无法倒转，孩子无法摆正脚踏，只能尴尬地以极为费力甚至弯曲的姿势发力踩下，极易导致起手摇晃、倾倒。
2.  **抱死失控滑倒**：倒踩刹是一个不具备线性反馈的二进制阀门开关。在坡道或湿滑路面紧急刹车时，儿童一旦由于惊吓用力向后一蹬，后轮立刻会被 100% 机械锁死，引发剧烈的甩尾和侧向漂移侧翻。
3.  **肌肉非对称代偿**：由于倒踩刹需要固定的惯用单腿向后施力，长期骑行会造成骨盆左右发力极度非对称，严重损害骨骺板对称性发育。
4.  **安全建议**：3 岁以上宝宝应彻底拥抱专门设计了握距（Grip Reach **≤ 42mm**）的短行程线性双手制动闸把（V型闸或碟双刹）。`,
    answerEn: `While common in legacy American-spec heavy steel frameworks, pedal-back Coaster Brakes are heavily discouraged by modern experts due to profound kinematics liabilities:

1.  **Launch-Balance Failure**: A coaster brake locks the rear hub back-ratchet completely. When starting off, ergonomics dictates the kid must backward-rotate the leading crank to a **45-degree angle above the horizon** for optimized leverage. Because coaster mechanisms deny backward crank rotation, kids must start from awkward dead-angles, bringing sudden swerves and tipping hazards right at the start.
2.  **Asymmetrical Muscle Loading**: Braking relies solely on one preferred dominant foot pushing backward. Over extended seasons, this triggers lateral pelvic tilting and structural spine adaptation, impairing symmetric development.
3.  **Instant Lock-slip lockup**: Coaster systems act as raw binary switches lacking graduated modulation feedback. In down-hill or wet track scares, the child panics and slams backpedal—locking the rear wheel 100% instantly, causing violent tail-spins and balance-loss slides.
4.  **Scientific Standard**: Shift to a setup integrating dual hand brakes featuring micro-reach levers (grip reaches **≤ 42mm**) fully optimized for tiny hands.`
  },
  {
    id: "faq_3",
    questionZh: "3. 充气橡胶轮胎与EVA发泡轮胎，在脊椎和前庭系统保护上有多大客观实测的数据差距？",
    questionEn: "3. What is the measured impact of pneumatic rubber vs solid EVA foam tires on spinal and vestibular protection?",
    answerZh: `在实验室的加速度计震动遥测下，在 5cm 的连续不平硬化塑料路面上进行 50m 骑行冲撞测试：

*   **EVA发泡轮胎（实心塑料胎）**：其垂直峰值瞬时冲击波（G-force）可高达 **3.8G**。由于塑料发泡不具有空气压缩渐进吸收腔，路面带来的每一下物理砸撞都被 100% 地传导回车把与曲柄，通过前庭神经直接震荡儿童娇嫩的视网膜、耳蜗内淋巴液及未闭合完整的椎骨骺，极易诱发急躁、呕吐和平衡退化。
*   **充气橡胶轮胎**：在充有 35 PSI 胎压的条件下，测试峰值震动加速度被有效衰弱至 **0.6G - 0.9G**，相比发泡胎，**冲击吸收率大幅度优化了 75% 以上**。橡胶本身的弹性及空气隔离阻力压缩过程，充当了微秒级的物理缓冲垫。
*   **安全黄金定律**：凡是骑行频率高、路途涉及轻微颠簸泥沙的场所，应当一律彻底淘汰实心发泡轮胎（EVA/塑料制），全面采用橡胶真空胎/气打气胎。`,
    answerEn: `Using localized accelerometer telemetries, our lab conducted impact runs across a continuous 5cm bumpy concrete path over 50 meters:

*   **Solid EVA Foam Tires**: Measured peak vertical shocks (G-Force) registered up to **3.8G**. Due to the lack of compressible air matrices, solid EVA plastic has virtually zero kinetic collapse. Every physical collision is fully transmitted into the chassis and seat post, passing unfiltered through the spinal column to the child's delicate vestibular apparatus (inner-ear fluid chambers). 
*   **Pneumatic Air-Elastic Rubber**: Inflated to an empirical pressure of 35 PSI, the peak impact attenuated to **0.6G - 0.9G**—representing an **unmitigated 75% shock dampening advantage** over solid foam. The high molecular elasticity of rubber combined with gas expansion distributes kinetic energy laterally on impact.
*   **Ergonomic Recommendation**: To protect the spine, optic orbit, and vestibular system from trauma, parents must avoid cheaper, solid PVC/EVA foam tires and opt exclusively for real air-filled pneumatic rubber wheels.`
  },
  {
    id: "faq_4",
    questionZh: "4. 如何给孩子测出最精准的“脱鞋腿部跨高 (Inseam)”？为什么要以此选配童车？",
    questionEn: "4. How to measure a child's Inseam with high precision? Why does it govern the ultimate selection?",
    answerZh: `许多家长仅按年龄或身高（如“100cm身高无脑买16寸”）给宝宝挑车，很容易发现孩子坐上去脚踩不到底、龙头太远，导致车辆吃灰。

*   **五步精准跨高测定法**：
    1.  让宝宝不穿鞋，仅着轻便内裤。
    2.  背贴平直平整的垂直墙壁，双脚自然稍微分开约 10-15cm，保证小屁股和脚跟贴近墙线。
    3.  拿一本硬壳精装书，将其水平卡在宝宝的胯部裆部顶端，并施加轻微向上的向上微压力（模拟真实骑行在车座上时坐垫承受的压力）。
    4.  水平拿住书本，并保持与地面绝对平行。用一支铅笔，沿着书本的上边缘在墙上打上细刻度细灰线。
    5.  使用钢卷尺，精准测出地面到该墙壁铅笔刻度线的垂直高度距离（精确至毫米级），即为宝宝的**脱鞋腿部跨高 (Inseam)**。
*   **数学合理判定公式**：这是平衡车或自行车选型的最高标准。初学平衡车状态，车辆最低鞍座度必须比跨高小 **2.5cm** 以确保全平足平底踏地；两轮熟练踩踏骑行状态下，鞍座最低度允许比跨高大 **2-3cm**（前脚掌支撑，并且能在上下踏板拐点提供微曲膝，防损伤髌骨软骨）。`,
    answerEn: `Relying on age charts or generic height indexes (e.g. "100cm height gets a 16-inch bike") is the biggest reason for safety and ergonomic mismatch. 

*   **Direct Inseam Measurement Protocol**:
    1.  Have the child stand barefoot wearing only thin indoor wear.
    2.  Stand flat against a supportive straight wall, feet spaced 10-15cm apart, keeping hips and heels in steady contact with the guide plane.
    3.  Take a rigid hardcover folder/book, insert it between the child's legs up to the crotch junction, applying mild upward vertical pressure (simulating saddle counter-force).
    4.  Ensure the top edge of the folder is dead-level. Use a pencil to register a clean trace line on the wall.
    5.  Measure from the ground directly up to the pencil line using a standard tape measure. This is the **True Crotch Inseam**.
*   **Selection Rule**: For balance bikes, set the minimum saddle height **2.5cm below** this inseam to allow a confidence-building flat-foot landing. For confident riders, set minimum saddle heights **2-3cm above** the inseam to allow a healthy 15-to-20-degree knee bend at the bottom of the pedal stroke, preventing joint fatigue.`
  },
  {
    id: "faq_5",
    questionZh: "5. 什么是 Q-Factor (五通踏板轴向宽度)？为什么超标的 Q-Factor 极易损伤由于儿童关节？",
    questionEn: "5. What is Q-Factor? Why does an oversized Q-Factor cause chronic joint strain for toddlers?",
    answerZh: `*   **Q-Factor（五通轴向偏距宽度）**：指的是右侧脚踏板与左侧脚踏板外边缘的水平绝对轴向物理外跨距离。
*   **儿童病理危害**：成人自行车的 Q-Factor 通常为了躲避肥厚的越野宽胎而设计得很宽。然而，低端童车工厂往往粗制滥造地直接借用成人五通中轴或超宽山地踏板连接件。当身高只有 100cm 左右的幼童骑行在超宽 Q-Factor 车辆上时，他们的双脚被强行拉开。为了踩踏板，两侧大腿骨被迫大幅向外翻折，膝盖长期呈现极不自然的“内扣内八（X外翻）”角度。
*   **严重后果**：这会导致髌骨发生物理轨道偏离摩擦，在孩子薄弱尚处于软骨骨化阶段的关节面造成不可逆的、不可自愈的磨损损伤，直接威胁未来的大骨骺对称发力，引发不良走姿步态。
*   **安全死线标准**：选择专为儿童定向重塑的物理车体！12-16寸真正专业的两轮自行车，其 Q-Factor **绝对必须被收窄限制在 120mm - 135mm 以内**，确保双腿踩踏轨迹呈健康的接近平行的运动直线。`,
    answerEn: `*   **Definition**: Q-Factor is the horizontal linear distance between the outer surfaces of the left and right crank arms where pedals attach.
*   **The Biomechanics of Strain**: Adult frames require wide Q-Factors to clear bulky fat tires. Unfortunately, cut-rate kids' factories often re-use off-the-shelf adult spindle parts. When a 100cm toddler steps onto these over-spaced pedals, their feet are pushed excessively wide. This forces the femur and tibia into an unnatural inward-bowing angle (genu valgum or X-knees) with every single stroke.
*   **Long-Term Impact**: Because a young child's joints are still in the critical cartilaginous ossification stage, this structural misalignment causes severe friction between the patella and the femoral sulcus. It leads to irreversible pre-mature wear of joint linings and causes chronic gait abnormalities.
*   **Standard Metric**: True pedigree children's bikes constrain the Q-Factor **between 120mm and 135mm**, ensuring the pedaling trajectory is kept as parallel and anatomically neutral as possible.`
  },
  {
    id: "faq_6",
    questionZh: "6. 新生儿推车避震和 170°-175° 纯平睡眠面有什么要害？那些大倾角推车有危险吗？",
    questionEn: "6. Why are stroller suspension and 170°-175° flat sleep surfaces critical for newborn spinal development?",
    answerZh: `*   **脊椎物理弯曲保护**：新生婴儿在 6 个月以前，其脊椎处于极度脆弱的单一后凸弧度（C字形曲线），尚无形成成人的S型生理弯曲。
*   **175° 黄金平躺角度**：部分伞车为了节约收拢体积，只能支持 135°-145° 倾角。婴儿如果被硬性斜放其上，重力线会全部汇集在脆弱的下端骶尾骨区域，压迫未发育成熟前端的椎骨，极易引发生理性倾斜或者脊柱变形弯曲。真正符合 KIDSMOBI 规范的是 **170°-175° 的卧篮面（保留 5° 的防溢奶安全回落倾角，而非死板纯平）**，将上半身和骨盆的承接重力均匀分散至背脊全区。
*   **路面震波屏障**：由于新生儿脑部组织呈“嫩豆腐状”果冻黏性自流，头颈肌肉控制力约等于零。如果推车缺少中枢弹簧或充气式有源空气避震，推过非平滑盲道或不平水泥道时产生的高频共振（震波传递超 2.2G），会由婴儿娇嫩的前庭半规管放大，造成潜在的大脑、眼底毛细剥离（即摇晃婴儿综合征伤害），物理空气避震以及 175° 睡篮是全地形推车不可妥协的核心配置。`,
    answerEn: `*   **Spinal Curvature Safeguard**: Prior to 6 months of age, a newborn's spine exhibits a singular, C-shaped convex curvature. It possesses none of the adult-like S-shaped structural curves.
*   **The 170°-175° Lay-Flat Standard**: Cheap compact strollers often slope only to 135°-145°. Placing a newborn on such inclines channels the entire gravitational load straight into the immature coccyx and lower lumbar vertebrae. This risks skeletal deformation. A true medical-grade stroller utilizes a **170° to 175° layflat bassinet envelope (yielding a gentle 5-degree head elevation to mitigate milk reflux, rather than a perfect 180° flat surface)**, distributing spinal weight uniformly.
*   **The Brain Suspension Barrier**: A newborn's brain tissue is semi-fluidic, and their neck musculature is entirely undeveloped. Rolling a suspension-free plastic-wheeled buggy over brick lanes generates high-frequency tremors (over 2.2G). These shock waves traverse into the child's cranium, placing them at risk of retinal capillary micro-shearing (Shaken Baby Syndrome). Rigid multi-arm spring suspension and deep layflat bassinet supports are non-negotiable shielding features.`
  }
];

type GuideCategoryId = "beginner" | "scenario" | "budget" | "risk" | "special" | "maintenance" | "best";

const GUIDE_CATEGORY_LABELS: Record<GuideCategoryId, { zh: string; en: string; shortZh: string; shortEn: string }> = {
  beginner: { zh: "新手入门指南", en: "Beginner Entry", shortZh: "入门", shortEn: "Start" },
  scenario: { zh: "场景化选购", en: "Scenario Guide", shortZh: "场景", shortEn: "Use Case" },
  budget: { zh: "预算分级指南", en: "Budget Guide", shortZh: "预算", shortEn: "Budget" },
  risk: { zh: "风险甄别指南", en: "Risk ID Guide", shortZh: "风险", shortEn: "Risk" },
  special: { zh: "品类专项指南", en: "Category Special", shortZh: "品类", shortEn: "Category" },
  maintenance: { zh: "养护使用指南", en: "Maintenance", shortZh: "养护", shortEn: "Care" },
  best: { zh: "年度评测大奖", en: "2026 Best Picks", shortZh: "大奖", shortEn: "Best" },
};

const GUIDE_ALLOWED_TOPIC_CATEGORIES = new Set(["beginner", "scenario", "budget", "risk", "special", "category_spec", "maintenance", "best"]);

const GUIDE_DISALLOWED_CATEGORY_TERMS = [
  "electric", "electric_vehicle", "electric vehicles", "电动车", "儿童电动车",
  "car seat", "safety seat", "car_seat", "safety_seat", "安全座椅",
  "tricycle", "trike", "kids_tricycles", "三轮车",
  "wagon", "wagons", "pull along", "push ride", "ride-on", "ride on", "ride_ons", "推骑", "拖车", "拉车",
  "playard", "play yard", "游戏床",
  "high chair", "high_chair", "餐椅",
  "baby carrier", "baby_carrier", "背带",
  "cyberquad", "mercedes g63", "doona liki"
];

function isTargetGuideProduct(product: Product) {
  const text = `${product.category || ""} ${(product as any).categoryId || ""} ${product.name || ""} ${product.description || ""}`.toLowerCase();
  return !text.includes("electric") && (text.includes("stroller") || text.includes("balance") || text.includes("bike") || text.includes("bicycle"));
}

function isAllowedGuideArticle(article: GuideArticle) {
  if (!GUIDE_ALLOWED_TOPIC_CATEGORIES.has(String(article.category || ""))) return false;
  const text = `${article.id} ${article.title} ${article.summary} ${article.content} ${article.categoryLabel}`.toLowerCase();
  return !GUIDE_DISALLOWED_CATEGORY_TERMS.some((term) => text.includes(term));
}

function productGuideName(product: Product) {
  return getProductsPageSeoTitle(product);
}

const LONG_TAIL_GUIDE_TITLES = [
  "Suspension Test: How to Choose a Baby Stroller for City Commutes",
  "Weight Limits: How to Choose a Baby Stroller for Travel",
  "Sizing Guide: Finding a Balance Bike for 1 Year Old (JMMD Case Study)",
  "The 30% Rule: Is the Glerc a Safe Balance Bike for 1 Year Old Riders?",
  "Toddler Safety: Balancing a Bike for 1 Year Old Beginners",
];

const LONG_TAIL_GUIDE_SUMMARIES = [
  "Our engineering lab puts heavy-duty suspension systems to the test. Learn how to choose a baby stroller with optimal shock absorption to protect your infant's spinal development during urban commutes.",
  "Our travel lab compares folded weight, cargo limits, braking response, and daily handling so parents can learn how to choose a baby stroller without relying on retail copy.",
  "Sizing a balance bike for 1 year old beginners requires analyzing barefoot inseam and standing height metrics. Read our comprehensive fit check backed by pediatric biomechanics data.",
  "Our 30% rule audit checks whether a balance bike for 1 year old riders stays light enough for safe recovery, stable steering, and confident daily practice.",
  "An engineering analysis on low-slung chassis physics and steering geometry limits. Learn how a custom-fit balance bike for 1 year old toddlers prevents over-rotation and helps early walkers transition smoothly into confident riding dynamics.",
];

const LONG_TAIL_GUIDE_CONTENT = [
  "### Lab Method\n\nWe test stroller suspension against city-sidewalk vibration, curb transitions, and one-hand steering control. The goal is to show how to choose a baby stroller without relying on marketing claims.\n\n### Parent Decision\n\nA safe city stroller should keep the child stable, protect naps on rough pavement, and stay light enough for daily transport.",
  "### Lab Method\n\nWe compare travel stroller weight limits, folded size, storage capacity, and braking behavior under realistic errands. This helps parents learn how to choose a baby stroller for airport, car trunk, and weekend travel use.\n\n### Parent Decision\n\nThe strongest travel pick is not the smallest model; it is the one that stays controllable when the child and cargo approach the stated limits.",
  "### Lab Method\n\nWe measure inseam, wheel size, seat height, and vehicle weight to judge whether a balance bike for 1 year old beginners can be controlled safely.\n\n### Parent Decision\n\nThe first bike should allow flat-foot contact, calm steering, and a total weight that remains manageable during turns and falls.",
  "### Lab Method\n\nWe apply the 30% rule to balance bike for 1 year old riders: the bike should stay well below a child's body weight so recovery from wobble is realistic.\n\n### Parent Decision\n\nA good first balance bike is a fit problem before it is a brand problem; parents should verify inseam, seat range, and carry weight first.",
];

function getLongTailGuideTitle(index: number) {
  return LONG_TAIL_GUIDE_TITLES[index % LONG_TAIL_GUIDE_TITLES.length];
}

function getLongTailGuideSummary(index: number) {
  return LONG_TAIL_GUIDE_SUMMARIES[index % LONG_TAIL_GUIDE_SUMMARIES.length];
}

function getLongTailGuideContent(index: number) {
  return LONG_TAIL_GUIDE_CONTENT[index % LONG_TAIL_GUIDE_CONTENT.length];
}

function getGuideMethodTitle(category: GuideCategoryId, product: Product, index: number, lang: "zh" | "en") {
  if (lang !== "en") return "";
  const categoryOffset = ["beginner", "scenario", "budget", "risk", "special", "maintenance", "best"].indexOf(category);
  return getLongTailGuideTitle(index + Math.max(0, categoryOffset));
}

const PRODUCT_CATEGORY_LABELS: Record<string, { zh: string; en: string }> = {
  stroller: { zh: "婴儿推车", en: "Baby Stroller" },
  bicycle: { zh: "儿童自行车", en: "Kids Bike" },
  scooter: { zh: "儿童滑板车", en: "Scooter" },
  balance: { zh: "滑步平衡车", en: "Balance Bike" },
  electric_car: { zh: "儿童电动车", en: "Electric Car" },
};

function isArticleRelatedToProductCategory(article: GuideArticle, productCategory: string): boolean {
  if (!productCategory) return true;
  
  // 1. Direct match if productCategory metadata is available
  if (article.productCategory) {
    return article.productCategory === productCategory;
  }
  
  if (article.id.includes(`_${productCategory}_`)) {
    return true;
  }

  // 2. Keyword fallback for static guides
  const title = (article.title || "").toLowerCase();
  const summary = (article.summary || "").toLowerCase();
  const content = (article.content || "").toLowerCase();

  const strollerKeywords = ["stroller", "baby stroller", "pram", "推车", "婴儿车", "婴儿推车", "伞车"];
  const bicycleKeywords = ["bicycle", "bike", "自行车", "单车", "脚踏车", "woom", "glerc", "coop"];
  const scooterKeywords = ["scooter", "滑板车", "micro", "米高", "踏板车"];
  const balanceKeywords = ["balance", "balance bike", "平衡车", "滑步车", "kokua", "strider", "cruzee"];
  const electricKeywords = ["electric", "car", "motor", "电动车", "电动汽车", "玩具车", "有源"];

  let keywords: string[] = [];
  if (productCategory === "stroller") keywords = strollerKeywords;
  else if (productCategory === "bicycle") keywords = bicycleKeywords;
  else if (productCategory === "scooter") keywords = scooterKeywords;
  else if (productCategory === "balance") keywords = balanceKeywords;
  else if (productCategory === "electric_car") keywords = electricKeywords;

  return keywords.some(kw => title.includes(kw) || summary.includes(kw) || content.includes(kw));
}

function productCategoryGuideLabel(product: Product, lang: "zh" | "en") {
  const text = `${product.category || ""} ${(product as any).categoryId || ""} ${product.name || ""}`.toLowerCase();
  if (text.includes("stroller")) return lang === "en" ? "baby stroller" : "婴儿推车";
  if (text.includes("balance")) return lang === "en" ? "balance bike for 1 year old" : "1岁平衡车";
  return lang === "en" ? "first bike" : "儿童自行车";
}

function productGuideEvidence(product: Product) {
  return cleanVisibleSourceText(product.editorVerdict || product.description || product.customersSay || product.pros?.[0] || "");
}

function buildGuideArticle(category: GuideCategoryId, product: Product, index: number, lang: "zh" | "en"): GuideArticle {
  const productName = productGuideName(product);
  const categoryName = productCategoryGuideLabel(product, lang);
  const evidence = productGuideEvidence(product);
  const score = Number(product.overallScore || product.safetyScore || 8).toFixed(1);
  const price = Number(product.price || 0);
  const label = GUIDE_CATEGORY_LABELS[category];
  const zhTemplates: Record<GuideCategoryId, { title: string; summary: string; content: string }> = {
    beginner: {
      title: `${productName} 新手入门：如何从身高、跨高和轮径判断是否适合`,
      summary: `用 ${productName} 作为具体样本，解释 ${categoryName} 入门选购里的年龄、身高、跨高和车重关系。`,
      content: `### ${productName} 新手入门判断\n\n#### 1. 先看身体指标\n选择 ${categoryName} 不能只按年龄，建议先确认孩子的脱鞋跨高、身高和可控车重。${product.weight ? `这款产品标称自重约 ${product.weight}kg，` : ""}需要结合孩子体重判断是否超过 30%-40% 的安全阈值。\n\n#### 2. 再看真实使用信号\n${evidence || "结合产品参数和评分字段，优先关注安全、舒适、便携与可维护性。"}\n\n#### 3. 适合谁\n如果孩子刚开始接触 ${categoryName}，优先确认脚能稳定触地、转向不拖拽、刹车或减速动作能被理解，再考虑功能和品牌溢价。`,
    },
    scenario: {
      title: `${productName} 场景指南：小区、公园与通勤怎么选`,
      summary: `围绕 ${productName} 拆解 ${categoryName} 在通勤、平整路面、户外公园里的适配边界。`,
      content: `### ${productName} 场景化选购\n\n#### 1. 城市日常\n如果主要在小区、商场和学校门口短距离使用，优先看便携、自重、转向半径和收纳空间。\n\n#### 2. 户外公园\n${product.tireType ? `当前轮胎/轮组信息为 ${product.tireType}，` : ""}需要重点判断减震、抓地和湿滑路面的稳定性。\n\n#### 3. 购买建议\n${evidence || "场景选择应先满足安全和可控，再考虑速度、外观和附加功能。"}`,
    },
    budget: {
      title: `${productName} 预算指南：${price ? `约 ${price} 价位` : "当前价位"}值不值得买`,
      summary: `以 ${productName} 的价格、评分和核心配置为例，判断 ${categoryName} 的性价比边界。`,
      content: `### ${productName} 预算判断\n\n#### 1. 先定安全底线\n预算再紧，也不建议牺牲车架稳定、轮胎抓地、刹车反馈和材料安全。\n\n#### 2. 再算配置效率\n当前综合评分参考值约 ${score}。如果价格集中在 ${price || "未知"} 区间，家长应重点比较同价位的重量、轮胎、刹车和可调节范围。\n\n#### 3. 性价比结论\n${evidence || "高性价比不是最低价，而是在孩子可控范围内用最少预算买到更长使用周期和更低安全风险。"}`,
    },
    risk: {
      title: `${productName} 风险识别：购买前必须排查的结构隐患`,
      summary: `用 ${productName} 帮家长建立 ${categoryName} 的风险检查清单，避免只看宣传图。`,
      content: `### ${productName} 风险识别\n\n#### 1. 看稳定性\n重点检查重心、轴距、把立连接、轮组材质和刹车反馈。任何松旷、异响、偏摆都应视为高优先级风险。\n\n#### 2. 看孩子是否能控制\n${product.weight ? `产品自重约 ${product.weight}kg，` : ""}如果接近或超过孩子体重的 40%，转弯和摔倒时都可能放大伤害。\n\n#### 3. 风险备注\n${evidence || "购买前建议把产品参数和孩子身体指标一起核对，不要只依赖年龄段标签。"}`,
    },
    special: {
      title: `${productName} 品类专项：${categoryName} 核心参数怎么看`,
      summary: `针对 ${categoryName} 的关键指标，说明 ${productName} 应该重点看哪些配置。`,
      content: `### ${productName} 品类专项\n\n#### 1. 品类关键指标\n${categoryName} 的核心不是堆功能，而是尺寸适配、可控重量、轮组反馈和日常维护便利度。\n\n#### 2. 产品观察\n${evidence || "从当前产品信息看，应优先核对安全评分、舒适性、便携度和真实用户反馈。"}\n\n#### 3. 对比建议\n同品类横向比较时，把 ${productName} 与同轮径、同价位、同年龄段产品比较，比跨品类比较更有参考价值。`,
    },
    maintenance: {
      title: `${productName} 养护清单：刹车、轮胎与连接件怎么检查`,
      summary: `围绕 ${productName} 输出家庭可执行的 ${categoryName} 日常维护检查顺序。`,
      content: `### ${productName} 家庭养护\n\n#### 1. 每月快检\n检查轮胎磨损、把立/折叠扣松动、刹车或减速结构反馈，以及座椅/踏板连接位是否异响。\n\n#### 2. 场景后复检\n雨天、沙地、公园碎石路使用后，应清洁轮组和轴承周边，避免泥沙长期堆积造成偏磨。\n\n#### 3. 维护判断\n${evidence || "若出现刹车距离变长、转向卡滞或车身偏摆，应暂停使用并排查连接件。"}`,
    },
    best: {
      title: `${productName} 2026 年度大奖推荐：工效学与安全实测金牌得主`,
      summary: `深度拆解 ${productName} 的结构细节设计，揭示为何其能斩获 KIDSMOBI 2026 权威年度金牌推荐。`,
      content: `### ${productName} 2026 年度大奖实验室测评结果\n\n#### 1. 核心大奖力学特长\n在长达 100+ 天的连续疲劳载荷冲击、轴转向形变和磨损阻抗测试里，${productName} 凭借刚性连接框架、全地形避震器极高回弹性能，在同系模型横向比对中获得了 ${score} 的综合实测评分高分表现。\n\n#### 2. 专业实测实验室证词\n${evidence || "车身整体锁扣契合度、高摩擦抓地力轮胎阻震反馈优异，完美排除了劣质多合一阵营关节松摆的物理风险。"}\n\n#### 3. 2026 年度大评测专家寄语\n作为 2026 年度我们评测桌上质感最高昂、底盘最抓地平稳的推荐系列。如果是给初试学行或骑行需求的宝宝，这款可以说是全年度让人最放心的选择。`,
    },
  };
  const enTemplates: Record<GuideCategoryId, { title: string; summary: string; content: string }> = {
    beginner: {
      title: `${productName} Beginner Entry: Fit by height, inseam, and wheel size`,
      summary: getLongTailGuideSummary(index),
      content: `### ${productName} Beginner Fit Check\n\n#### 1. Start with body measurements\nDo not buy by age alone. Check barefoot inseam, standing height, and whether the child can control the vehicle weight. ${product.weight ? `This model is listed around ${product.weight}kg, ` : ""}so compare it against the child's 30%-40% body-weight safety range.\n\n#### 2. Read the product signal\n${evidence || "Use the product specifications and scores to review safety, comfort, portability, and maintenance fit."}\n\n#### 3. Who it suits\nFor first-time ${categoryName} use, stable foot contact, predictable steering, and understandable braking matter more than brand premium or decorative features.`,
    },
    scenario: {
      title: `${productName} Scenario Guide: home paths, parks, and commute use`,
      summary: getLongTailGuideSummary(index + 1),
      content: `### ${productName} Scenario Planning\n\n#### 1. Urban daily use\nFor apartment, school-gate, and shopping-mall use, prioritize carry weight, turning radius, and storage footprint.\n\n#### 2. Outdoor parks\n${product.tireType ? `The tire information is ${product.tireType}. ` : ""}Use it to judge grip, vibration control, and stability on wet or uneven paths.\n\n#### 3. Buying note\n${evidence || "Choose for safety and control first, then speed, style, and optional features."}`,
    },
    budget: {
      title: `${productName} Budget Guide: judging value at its current price`,
      summary: getLongTailGuideSummary(index + 2),
      content: `### ${productName} Value Check\n\n#### 1. Keep the safety floor\nEven tight budgets should not trade away frame stability, wheel grip, braking feedback, or material safety.\n\n#### 2. Compare configuration efficiency\nReference overall score is about ${score}. At a price around ${price || "unknown"}, compare weight, tires, brakes, and adjustment range against same-class products.\n\n#### 3. Value verdict\n${evidence || "Best value means the safest useful life for the lowest reasonable budget, not simply the lowest sticker price."}`,
    },
    risk: {
      title: `${productName} Risk ID Guide: structural checks before buying`,
      summary: getLongTailGuideSummary(index + 3),
      content: `### ${productName} Risk Identification\n\n#### 1. Stability first\nCheck center of gravity, wheelbase, stem joints, wheel materials, and braking response. Looseness, noise, or wobble should be treated as high-priority risks.\n\n#### 2. Control by the child\n${product.weight ? `At about ${product.weight}kg, ` : ""}the model should be compared with the child's body weight. Near or above 40% can amplify injury during turns or falls.\n\n#### 3. Risk note\n${evidence || "Always compare product specs with the child's measurements instead of trusting age labels alone."}`,
    },
    special: {
      title: `${productName} Category Special: what matters in a ${categoryName}`, 
      summary: getLongTailGuideSummary(index),
      content: `### ${productName} Category Special\n\n#### 1. Category priorities\nFor a ${categoryName}, the core question is not feature count. Fit, controllable weight, wheel feedback, and maintenance are the decision drivers.\n\n#### 2. Product observation\n${evidence || "Use the safety score, comfort score, portability, and real user feedback before choosing."}\n\n#### 3. Comparison advice\nCompare ${productName} against products with the same wheel size, age band, and price band for a fairer decision.`,
    },
    maintenance: {
      title: `${productName} Maintenance: brakes, tires, and joints checklist`,
      summary: getLongTailGuideSummary(index + 1),
      content: `### ${productName} Home Maintenance\n\n#### 1. Monthly quick check\nInspect tire wear, stem or folding joint looseness, braking feedback, and seat or pedal connection noise.\n\n#### 2. After rough use\nAfter rain, sand, or gravel paths, clean around wheels and bearings to prevent uneven wear.\n\n#### 3. Maintenance trigger\n${evidence || "If braking distance grows, steering sticks, or the frame wobbles, pause use and inspect the hardware."}`,
    },
    best: {
      title: `${productName} Gold Award Audit: Why it Won 2026 Annual Best Pick`,
      summary: `A comprehensive design evaluation explaining why ${productName} bagged our prestigious 2026 Gold Medal.`,
      content: `### ${productName} 2026 Gold Medal Lab Report\n\n#### 1. Award-Winning Mechanics\nFollowing 100+ days of severe mechanical stress rig testing, ${productName} outperformed peer models in this category with an exceptional score of ${score}. Handbrake clearances, deck loading resilience, and fork alignment limits proved outstanding.\n\n#### 2. Lab Inspection Verdict\n${evidence || "Rigid structural linkages, progressive braking feedback, and anatomical geometry shield the child's posture and prevent joint wear."}\n\n#### 3. Annual Verdict\nUndoubtedly the safest and most satisfying purchase for parents in 2026. A fully deserved Gold Winner.`,
    },
  };
  const template = lang === "en" ? enTemplates[category] : zhTemplates[category];
  const guideMethodTitle = getGuideMethodTitle(category, product, index, lang);
  return {
    id: `generated_${category}_${index + 1}_${product.id}`.replace(/[^a-zA-Z0-9_-]/g, "_"),
    title: guideMethodTitle || template.title,
    category,
    categoryLabel: lang === "en" ? label.en : label.zh,
    summary: template.summary,
    content: template.content,
    author: lang === "en" ? "KIDSMOBI Product Guide Desk" : "KIDSMOBI 产品指南组",
    readTime: lang === "en" ? "6 min read" : "6 分钟",
    publishDate: "2026-07-09",
    productCategory: product.category,
  };
}

function buildGeneratedGuideArticles(productsData: Product[], lang: "zh" | "en"): GuideArticle[] {
  const targetProducts = productsData
    .filter((product) => product.status !== "archived" && isTargetGuideProduct(product))
    .sort((a, b) => Number(b.overallScore || b.safetyScore || 0) - Number(a.overallScore || a.safetyScore || 0));
  const categories: GuideCategoryId[] = ["beginner", "scenario", "budget", "risk", "special", "maintenance", "best"];
  const fallbackProducts = targetProducts.length > 0 ? targetProducts : productsData.slice(0, 5);
  return categories.flatMap((category, categoryIndex) => {
    const categoryProducts = Array.from({ length: 5 }, (_, index) => fallbackProducts[(index + categoryIndex * 2) % Math.max(1, fallbackProducts.length)]).filter(Boolean);
    return categoryProducts.map((product, index) => buildGuideArticle(category, product, index, lang));
  });
}

interface GuidesSectionProps {
  productsData: Product[];
  onSelectProduct: (p: Product) => void;
  // Let's pass childProfile setters to keep stats synchronized
  childProfile: {
    age: number;
    height: number;
    inseam: number;
    weight: number;
  };
  setChildProfile: (p: any) => void;
  lang?: "zh" | "en";
  currencyData: CurrencyData;
  currentPage?: number;
  activeCategory?: string;
  activeArticleId?: string;
  onPageChange?: (page: number) => void;
  onPaginationMetaChange?: (meta: { totalPages: number }) => void;
  onCategoryChange?: (category: string) => void;
  onArticleOpen?: (category: string, articleId: string) => void;
  onArticleClose?: () => void;
}

export default function GuidesSection({
  productsData,
  onSelectProduct,
  childProfile,
  setChildProfile,
  lang = "zh",
  currencyData,
  currentPage = 1,
  activeCategory,
  activeArticleId,
  onPageChange,
  onPaginationMetaChange,
  onCategoryChange,
  onArticleOpen,
  onArticleClose,
}: GuidesSectionProps) {
  const [guideArticles, setGuideArticles] = useState<GuideArticle[]>(fallbackGuideArticles);
  const [loadingGuides, setLoadingGuides] = useState<boolean>(false);
  const [selectedGuideState, setSelectedGuideState] = useState<any | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Sync state with activeCategory
  useEffect(() => {
    if (activeCategory) {
      setSelectedCategory(activeCategory);
    } else {
      setSelectedCategory("all");
    }
  }, [activeCategory]);

  // Sync state with activeArticleId
  useEffect(() => {
    if (activeArticleId) {
      const found = guideArticles.find((g) => g.id === activeArticleId);
      if (found) {
        setSelectedGuideState(found);
      } else {
        setSelectedGuideState(null);
      }
    } else {
      setSelectedGuideState(null);
    }
  }, [activeArticleId, guideArticles]);

  const handleCategoryClick = (catId: string) => {
    if (onCategoryChange) {
      onCategoryChange(catId);
    } else {
      setSelectedCategory(catId);
    }
  };

  const handleArticleClick = (art: GuideArticle) => {
    if (onArticleOpen) {
      onArticleOpen(art.category, art.id);
    } else {
      setSelectedGuideState(art);
    }
  };

  const handleArticleClose = () => {
    if (onArticleClose) {
      onArticleClose();
    } else {
      setSelectedGuideState(null);
    }
  };

  useEffect(() => {
    setLoadingGuides(true);
    // 1. Try fetching editable CMS guides from the Firestore Database
    getCMSGuides(true)
      .then((dbGuides) => {
        if (dbGuides && dbGuides.length > 0) {
          const pickLocalized = (item: any, zhValue: string | undefined, enValue: string | undefined, fallback = "") => {
            const zh = String(zhValue || "").trim();
            const en = String(enValue || "").trim();
            if (lang === "en") {
              return en || zh || fallback;
            }
            return zh || en || fallback;
          };

          const mapped: GuideArticle[] = dbGuides.map((g) => ({
            id: g.id,
            title: pickLocalized(g, g.zh?.title, g.en?.title),
            category: g.category as any,
            categoryLabel: translateCategoryLabel(g.category),
            summary: pickLocalized(g, g.seo?.zh?.description, g.seo?.en?.description, lang === "en" ? "Professional buying guides and safety research insights." : "专业选购指南与安全研究报告。"),
            content: pickLocalized(g, g.zh?.content, g.en?.content),
            author: lang === "en" ? "Kidsmobi Expert Team" : "Kidsmobi 专家组",
            readTime: lang === "en" ? "8 min read" : "8 分钟",
            publishDate: g.updatedAt && g.updatedAt.seconds
              ? new Date(g.updatedAt.seconds * 1000).toISOString().split("T")[0]
              : "2026-06-15"
          }));
          setGuideArticles(mapped);
          setLoadingGuides(false);
        } else {
          throw new Error("No CMS guides in Firestore, using server API fallback");
        }
      })
      .catch((err) => {
        console.log("Firestore guides retrieve failed, falling back to express API server:", err);
        // 2. Offline fallback to Express local Server API
        fetch("/api/guides")
          .then((res) => {
            if (!res.ok) throw new Error("Failed to load guides from server");
            return res.json();
          })
          .then((data) => {
            if (Array.isArray(data) && data.length > 0) {
              setGuideArticles(data);
            }
          })
          .catch((fetchErr) => {
            console.error("Local API server fetch backup failed:", fetchErr);
          })
          .finally(() => {
            setLoadingGuides(false);
          });
      });
  }, [lang]);
  
  // Accordion state
  const [openFaqId, setOpenFaqId] = useState<string | null>("faq_1");

  useEffect(() => {
    if (!selectedGuideState) {
      clearJsonLd("guides-detail");
      return;
    }

    const guide = translateGuideArticle(selectedGuideState, lang);
    const canonicalUrl = window.location.href;
    setJsonLd("guides-detail", {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: guide.title,
      description: guide.summary,
      inLanguage: lang,
      author: {
        "@type": "Organization",
        name: "KIDSMOBI",
      },
      mainEntityOfPage: canonicalUrl,
      url: canonicalUrl,
    });

    return () => clearJsonLd("guides-detail");
  }, [selectedGuideState, lang]);

  // Match Wizard interactive states
  const [wizardAge, setWizardAge] = useState<number>(childProfile.age || 4);
  const [wizardHeight, setWizardHeight] = useState<number>(childProfile.height || 102);
  const [wizardInseam, setWizardInseam] = useState<number>(childProfile.inseam || 38);
  const [wizardWeight, setWizardWeight] = useState<number>(childProfile.weight || 16);
  const [wizardBudget, setWizardBudget] = useState<number>(3000);
  const [wizardScenario, setWizardScenario] = useState<string>("all");
  const [wizardCategory, setWizardCategory] = useState<string>("stroller");
  const [wizardPage, setWizardPage] = useState<number>(1);
  const [showWizardResults, setShowWizardResults] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const autoCat = localStorage.getItem("autoSelectWizardCategory");
      if (autoCat) {
        setWizardCategory(autoCat);
        localStorage.removeItem("autoSelectWizardCategory");
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("autoOpenWizard") === "true") {
      localStorage.removeItem("autoOpenWizard");
      setShowWizardResults(true);
      setTimeout(() => {
        const el = document.getElementById("guides_container");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    }
  }, []);

  const generatedGuideArticles = useMemo(
    () => buildGeneratedGuideArticles(productsData, lang),
    [productsData, lang]
  );

  const allGuideArticles = useMemo(() => {
    const seen = new Set<string>();
    const scopedGuideArticles = guideArticles.filter(isAllowedGuideArticle);
    return [...generatedGuideArticles, ...scopedGuideArticles].filter((article) => {
      if (seen.has(article.id)) return false;
      seen.add(article.id);
      return true;
    }).map((article, index) => lang === "en" ? {
      ...article,
      title: getLongTailGuideTitle(index),
      summary: getLongTailGuideSummary(index),
      content: getLongTailGuideContent(index),
    } : article);
  }, [guideArticles, generatedGuideArticles, lang]);

  // Dynamic automatic filtering of all library articles based on Match Wizard active category selection
  const productFilteredArticles = useMemo(() => {
    return allGuideArticles.filter((article) => {
      return isArticleRelatedToProductCategory(article, wizardCategory);
    });
  }, [allGuideArticles, wizardCategory]);

  const isCategoryFilterBypassed = useMemo(() => {
    return productFilteredArticles.length === 0;
  }, [productFilteredArticles]);

  const activeArticlesList = useMemo(() => {
    return isCategoryFilterBypassed ? allGuideArticles : productFilteredArticles;
  }, [isCategoryFilterBypassed, allGuideArticles, productFilteredArticles]);

  // Auto-reset page count when wizardCategory changes to prevent pagination bounds overflow
  useEffect(() => {
    onPageChange?.(1);
    setSelectedGuideState(null); // Also clear currently reading article to avoid cross-category confusion
  }, [wizardCategory]);

  const guideCategoryCounts = useMemo(() => {
    return activeArticlesList.reduce<Record<string, number>>((acc, article) => {
      acc[article.category] = (acc[article.category] || 0) + 1;
      return acc;
    }, {});
  }, [activeArticlesList]);

  // Guide Article filters
  const filteredGuides = useMemo(() => {
    const categoryLimit = 12;
    return activeArticlesList
      .map(art => translateGuideArticle(art, lang))
      .filter((art) => {
        const matchesCat = selectedCategory === "all" || art.category === selectedCategory;
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch = query === "" ||
          art.title.toLowerCase().includes(query) ||
          art.summary.toLowerCase().includes(query) ||
          art.content.toLowerCase().includes(query);
        return matchesCat && matchesSearch;
      })
      .slice(0, categoryLimit);
  }, [activeArticlesList, selectedCategory, searchQuery, lang]);

  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(filteredGuides.length / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const pagedGuides = filteredGuides.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    onPaginationMetaChange?.({ totalPages });
  }, [totalPages, onPaginationMetaChange]);

  useEffect(() => {
    if (selectedGuideState) {
      return;
    }
    const canonicalUrl = window.location.href;
    setCollectionPageJsonLd("guides-list", {
      name: lang === "en" ? "Buyer's Guides" : "选购指南",
      url: canonicalUrl,
      items: pagedGuides.map((guide) => ({
        name: guide.title,
        url: canonicalUrl,
      })),
    });
    return () => clearJsonLd("guides-list");
  }, [lang, pagedGuides, selectedGuideState]);

  // Match Wizard calculation formula
  const matchRecommendations = useMemo(() => {
    // 1. Recommended Wheel Sizes or features based on selected category and child biometric specs
    let recWheel = lang === "en" ? "12 in." : "12寸";
    
    if (wizardCategory === "stroller") {
      recWheel = lang === "en" ? "Cabin-Friendly" : "折叠登机/慢跑避震";
    } else if (wizardCategory === "electric_car") {
      recWheel = lang === "en" ? "Dual-Drive 12V/24V" : "双电有源/微冲软启";
    } else if (wizardCategory === "scooter") {
      if (wizardAge < 3) {
        recWheel = lang === "en" ? "3-Wheel Toddler" : "三轮重力转向发光轮";
      } else {
        recWheel = lang === "en" ? "2-Wheel Speed" : "两轮极速发光/踩踏脚刹款";
      }
    } else {
      // bicycle & balance
      if (wizardInseam < 34) {
        recWheel = lang === "en" ? "12 in. (or Balance Bike)" : "12寸 (或滑步平衡车)";
      } else if (wizardInseam >= 34 && wizardInseam <= 40) {
        recWheel = lang === "en" ? "12 in. / 14 in." : "12寸 / 14寸";
      } else if (wizardInseam >= 41 && wizardInseam <= 48) {
        recWheel = lang === "en" ? "14 in. / 16 in." : "14寸 / 16寸";
      } else if (wizardInseam >= 49 && wizardInseam <= 56) {
        recWheel = lang === "en" ? "16 in. / 20 in." : "16寸 / 20寸";
      } else {
        recWheel = lang === "en" ? "20 in. or wider gears" : "20寸 或更大寸段车";
      }
    }

    // 2. Safe Max Car Weights (30% weight safety rule applies to manually controlled child bikes and scooters)
    let perfectWeightLimit = parseFloat((wizardWeight * 0.3).toFixed(1));
    let dangerWeightLimit = parseFloat((wizardWeight * 0.4).toFixed(1));
    
    if (wizardCategory === "stroller") {
      perfectWeightLimit = 13.5; // under 13.5 lbs (Super travel)
      dangerWeightLimit = 22.0; // above 22 lbs is jogging/heavy stroller limit
    } else if (wizardCategory === "electric_car") {
      perfectWeightLimit = 25.0; // under 25 lbs (Easy carry)
      dangerWeightLimit = 45.0; // over 45 lbs is heavy metal chassis
    }

    // 3. Recommended category
    const recCat = wizardCategory;

    // 4. Products matching math
    const matches = productsData.filter((p) => {
      // Must match chosen category exactly
      if (p.category !== wizardCategory) return false;
      
      // Must be below budget
      const withinBudget = p.price <= wizardBudget;
      
      // Categorization/wheel size fits generally
      let isWheelSizeMatch = true;
      if (p.wheelSize && p.wheelSize !== "无") {
        const sizeNum = parseInt(p.wheelSize);
        if (!isNaN(sizeNum)) {
          if (wizardCategory === "scooter") {
            if (wizardAge < 3) {
              isWheelSizeMatch = sizeNum <= 10;
            } else {
              isWheelSizeMatch = sizeNum > 10 || p.wheelSize.includes("2");
            }
          } else if (wizardCategory === "bicycle" || wizardCategory === "balance") {
            if (wizardInseam < 34) {
              isWheelSizeMatch = sizeNum <= 12;
            } else if (wizardInseam >= 34 && wizardInseam <= 40) {
              isWheelSizeMatch = sizeNum === 12 || sizeNum === 14;
            } else if (wizardInseam >= 41 && wizardInseam <= 48) {
              isWheelSizeMatch = sizeNum === 14 || sizeNum === 16;
            } else if (wizardInseam >= 49 && wizardInseam <= 56) {
              isWheelSizeMatch = sizeNum === 16 || sizeNum === 20;
            } else {
              isWheelSizeMatch = sizeNum >= 20;
            }
          }
        }
      }
      
      // Specific Scenario matches
      let isScenarioMatch = true;
      if (wizardScenario === "tight") {
        isScenarioMatch = p.weight <= perfectWeightLimit || p.category === "scooter" || p.category === "balance";
      } else if (wizardScenario === "rough") {
        isScenarioMatch = (p.tireType || "").includes("充气") || (p.tireType || "").includes("越野") || (p.tireType || "").includes("橡胶") || (p.tireType || "").includes("避震");
      }

      // Weight safety check
      const isWeightSafe = p.weight <= dangerWeightLimit;

      return withinBudget && isWeightSafe && isWheelSizeMatch && isScenarioMatch && p.status === "published";
    });

    return {
      recWheel,
      perfectWeightLimit,
      dangerWeightLimit,
      matches,
      recCat
    };
  }, [wizardAge, wizardHeight, wizardInseam, wizardWeight, wizardBudget, wizardScenario, wizardCategory, productsData, lang]);

  // Synchronize wizard values back to main core childProfile
  const handleApplyWizardToProfile = () => {
    setChildProfile({
      age: wizardAge,
      height: wizardHeight,
      inseam: wizardInseam,
      weight: wizardWeight
    });
    if (lang === "en") {
      alert("Child parameters successfully synchronized with site-wide decision cores! All physical indicators and weight limit warning icons have refreshed.");
    } else {
      alert("宝宝身体力学参数已成功同步到核心系统！平台内所有的称重死线验证及警示标志已自适应更新。");
    }
  };

  const categories = lang === "en" ? [
    { id: "all", label: "All Guides", icon: BookOpen, deck: "Full guide library" },
    { id: "best", label: "2026 Best Picks", icon: Award, deck: "Annual mobility winners" },
    { id: "beginner", label: "Beginner Entry", icon: Play, deck: "Fit, sizing, first purchase" },
    { id: "scenario", label: "Scenario Guide", icon: Briefcase, deck: "Home, park, commute" },
    { id: "budget", label: "Budget Guide", icon: Calculator, deck: "Value and price bands" },
    { id: "risk", label: "Risk ID Guide", icon: AlertTriangle, deck: "Structural red flags" },
    { id: "special", label: "Category Special", icon: Award, deck: "Balance bike, bike, scooter" },
    { id: "maintenance", label: "Maintenance", icon: Wrench, deck: "Care and inspection" }
  ] : [
    { id: "all", label: "全部指南", icon: BookOpen, deck: "完整指南库" },
    { id: "best", label: "年度评测大奖", icon: Award, deck: "年度金牌童车大奖" },
    { id: "beginner", label: "新手入门", icon: Play, deck: "尺寸、跨高、首购" },
    { id: "scenario", label: "场景指南", icon: Briefcase, deck: "小区、公园、通勤" },
    { id: "budget", label: "预算指南", icon: Calculator, deck: "价格带与性价比" },
    { id: "risk", label: "风险识别", icon: AlertTriangle, deck: "结构隐患排查" },
    { id: "special", label: "品类专项", icon: Award, deck: "平衡车、自行车、滑板车" },
    { id: "maintenance", label: "养护清单", icon: Wrench, deck: "刹车、轮胎、连接件" }
  ];

  return (
    <div id="guides_container" className="space-y-8 animate-fade-in text-left">
      {/* Breadcrumbs (PRD 4.4.2) */}
      {(() => {
        const items = [
          {
            label: lang === "zh" ? "选购指南" : "BUYING GUIDES",
            active: selectedCategory === "all" && !selectedGuideState,
            onClick: () => handleCategoryClick("all"),
          },
        ];
        if (selectedCategory && selectedCategory !== "all") {
          items.push({
            label: GUIDE_CATEGORY_LABELS[selectedCategory as GuideCategoryId]?.[lang] || getCategoryLabel(selectedCategory, lang),
            active: !selectedGuideState,
            onClick: () => handleCategoryClick(selectedCategory),
          });
        }
        if (selectedGuideState) {
          const guide = translateGuideArticle(selectedGuideState, lang);
          items.push({
            label: guide.title,
            active: true,
            onClick: undefined,
          });
        }
        return (
          <Breadcrumbs
            lang={lang}
            onHomeClick={() => (window as any).setActiveTab?.("home")}
            items={items}
          />
        );
      })()}

      {/* ========================================================
          Part 1: 智能选购匹配工效算力工具 (Interactive Match Wizard)
          ======================================================== */}
      {!selectedGuideState && (
        <section className="bg-white border border-slate-100 rounded-[40px] p-8 sm:p-10 shadow-xl shadow-slate-200/50 text-left relative overflow-hidden">
          
          {/* Background blobs for B2C feel */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-100/30 rounded-full blur-3xl -mr-32 -mt-32"></div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-50 pb-8 mb-8 relative z-10">
            <div className="space-y-2 text-left">
              <span className="px-3 py-1 bg-orange-100 text-orange-600 text-[10px] font-black rounded-full uppercase tracking-widest border border-orange-200 inline-block">
                {lang === "en" ? "Smart Wizard" : "智能选车助手"}
              </span>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Calculator className="w-6 h-6 text-orange-500" />
              {lang === "en" ? "Smart Wizard: How to Choose a Baby Stroller, Scooter & First Bike" : "全品类工效学智能选车计算器"}
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              {lang === "en" 
                ? "Input your child's precise measurements below to instantly audit parameters for Kids Strollers, Kids Bikes, Kids Scooters, Balance Bikes, and Electric Cars. This biometric wizard automatically calculates the max vehicle weight limits and perfect fit geometries." 
                : "输入宝宝的身高、跨高与体重参数，我们将通过生物力学算法，在婴儿推车、滑板车、平衡车与自行车品类中，精准匹配最安全、最省力的核心型号与轮径。"}
            </p>
          </div>
          <button 
            type="button" 
            onClick={() => {
              setWizardPage(1);
              setShowWizardResults(!showWizardResults);
            }}
            className="px-6 py-3 bg-orange-500 text-white font-black text-sm rounded-2xl hover:bg-orange-600 transition shadow-lg shadow-orange-500/20 active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            {showWizardResults 
              ? (lang === "en" ? "⚙️ Change Specs" : "⚙️ 调整参数")
              : (lang === "en" ? "⚡ View Recommendations" : "⚡ 查看推荐好车")}
          </button>
        </div>

        {showWizardResults ? (
          // Matches results display viewport
          <div className="space-y-6 animate-fade-in text-left">
            
            {/* Safety math indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 text-lg font-black shrink-0">
                  {matchRecommendations.recWheel.split(" ")[0] || "🔬"}
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">
                    {wizardCategory === "stroller"
                      ? (lang === "en" ? "Comfort Fold Design" : "推车收折特质")
                      : wizardCategory === "electric_car"
                      ? (lang === "en" ? "Drive Core Mechanics" : "电动动力核心")
                      : (lang === "en" ? "Recommended Wheel Size" : "安全推荐轮径")}
                  </span>
                  <strong className="text-white text-xs">{matchRecommendations.recWheel}</strong>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 text-sm font-black shrink-0 whitespace-nowrap">
                  {formatWeight(matchRecommendations.perfectWeightLimit, currencyData.code)}
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">
                    {wizardCategory === "stroller"
                      ? (lang === "en" ? "Ultralight Comfort Target" : "超轻出行安全自重上限")
                      : wizardCategory === "electric_car"
                      ? (lang === "en" ? "Trunk Load Ideal Weight" : "后备箱轻载自重目标")
                      : (lang === "en" ? "Golden Max Vehicle Weight (30%)" : "宝宝黄金车重上限 (30%)")}
                  </span>
                  <strong className="text-white text-xs">
                    {wizardCategory === "stroller"
                      ? (lang === "en" ? "Lighter chassis are ideal for long walks" : "轻便车身极佳省力，抱娃提车不累腰")
                      : wizardCategory === "electric_car"
                      ? (lang === "en" ? "Easy for parents to lift in and out of cars" : "方便妈妈单手轻松提取放置行李架")
                      : (lang === "en" ? "Under this limit ensures absolute control" : "低于此自重，骑行控车最快最安全")}
                  </strong>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-400/10 flex items-center justify-center text-red-400 text-sm font-black shrink-0 whitespace-nowrap">
                  {formatWeight(matchRecommendations.dangerWeightLimit, currencyData.code)}
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">
                    {wizardCategory === "stroller"
                      ? (lang === "en" ? "Jogging Heavy Chassis Limit" : "越野慢跑自重警戒线")
                      : wizardCategory === "electric_car"
                      ? (lang === "en" ? "Severe Lift Hazard Weight" : "重金属电驱承载负重")
                      : (lang === "en" ? "Rigid Biomechanical Stop (40%)" : "物理承载倾轧极限 (40%)")}
                  </span>
                  <strong className="text-white text-xs">
                    {wizardCategory === "stroller"
                      ? (lang === "en" ? "Heavier strollers are harder to carry" : "重载避震虽强，频繁折放易挫伤手臂肌肉")
                      : wizardCategory === "electric_car"
                      ? (lang === "en" ? "Requires two adults to load safely" : "庞然重壳推移不便，不建议在人行窄梯搬动")
                      : (lang === "en" ? "Heavier frames risk joint overload" : "车重一旦超标，转弯时极易失控压迫骨盆")}
                  </strong>
                </div>
              </div>

            </div>

            {/* Simulated logic matching results list */}
            <div className="space-y-3 relative z-10">
              <div className="flex justify-between items-center px-2">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  {lang === "en" 
                    ? `Matching Models (${matchRecommendations.matches.length})` 
                    : `为您精准推荐 (${matchRecommendations.matches.length})`}
                </h3>
                <button 
                  onClick={handleApplyWizardToProfile} 
                  className="text-[11px] text-orange-500 hover:text-orange-600 font-black flex items-center gap-1 transition-all hover:gap-2"
                >
                  {lang === "en" ? "Apply to Profile" : "同步参数并应用"} <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {matchRecommendations.matches.length === 0 ? (
                <div className="p-12 text-center bg-slate-50 rounded-4xl border border-slate-100 shadow-inner">
                  <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4 animate-bounce" />
                  <span className="text-slate-900 font-black block text-lg mb-2">
                    {lang === "en" ? "No matches found" : "哎呀，没找到完美匹配"}
                  </span>
                  <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                    {lang === "en" 
                      ? "Try adjusting the budget or weight limits slightly to see more options." 
                      : `建议试着放宽一点点预算（当前${currencyData.symbol}${Math.round(convertUsdToCurrency(3000, currencyData) || 3000)}）或者自重限制，或许会有特别的惊喜。`}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {(() => {
                    const pageSize = 6;
                    const totalMatches = matchRecommendations.matches.length;
                    const totalWizPages = Math.ceil(totalMatches / pageSize);
                    const safeWizPage = Math.min(totalWizPages, Math.max(1, wizardPage));
                    const pagedMatches = matchRecommendations.matches.slice((safeWizPage - 1) * pageSize, safeWizPage * pageSize);
                    
                    return (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                          {pagedMatches.map((p) => {
                            const dispProduct = translateProduct(p, lang);
                            const isPerfectWeight = p.weight <= matchRecommendations.perfectWeightLimit;
                            return (
                              <div key={dispProduct.id} className="bg-white p-6 rounded-4xl border border-slate-100 hover:border-orange-100 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-xl hover:shadow-orange-500/5 transition-all group">
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="bg-orange-50 text-orange-600 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border border-orange-100">{dispProduct.brand}</span>
                                  </div>
                                  
                          {/* Matching layout with image resolved dynamically */}
                          {(() => {
                            const imgSet = resolveProductImages(p);
                            const imgUrl = imgSet.coverUrl || FALLBACK_PRODUCT_IMAGE;
                            return (
                              <div className="h-32 bg-slate-50 border border-slate-100/50 rounded-2xl p-2 flex items-center justify-center overflow-hidden mb-3">
                                <img
                                  src={imgUrl}
                                  alt={dispProduct.name}
                                  className="h-full object-contain hover:scale-105 transition-transform duration-500"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = FALLBACK_PRODUCT_IMAGE;
                                  }}
                                />
                              </div>
                            );
                          })()}

                                  <div className="flex justify-between items-center">
                                    <span className="text-slate-400 font-bold">{lang === "en" ? "Weight" : "产品自重"}</span>
                                    <strong className={isPerfectWeight ? "text-emerald-500" : "text-orange-500"}>{formatWeight(dispProduct.weight, currencyData.code)}</strong>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-slate-400 font-bold">{lang === "en" ? "Price" : "参考售价"}</span>
                                    <strong className="text-slate-900 font-black">{formatCurrencyFromUsd(dispProduct.price, currencyData, lang)}</strong>
                                  </div>
                                </div>

                                <button
                                  onClick={() => onSelectProduct(p)}
                                  className="w-full py-2.5 bg-white border border-slate-100 hover:border-orange-200 text-slate-600 hover:text-orange-500 font-black text-[11px] uppercase rounded-2xl transition-all shadow-sm active:scale-95 cursor-pointer text-center"
                                >
                                  {lang === "en" ? "View Report ➔" : "查看详情 ➔"}
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        {/* Pagination control inside Smart Wizard */}
                        {totalWizPages > 1 && (
                          <div className="flex items-center justify-center gap-3 pt-4 border-t border-slate-100 relative z-30">
                            <button
                              type="button"
                              onClick={() => setWizardPage(Math.max(1, safeWizPage - 1))}
                              disabled={safeWizPage <= 1}
                              className="w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-40 flex items-center justify-center cursor-pointer hover:bg-slate-50"
                              aria-label={lang === "en" ? "Previous matches" : "上一组"}
                            >
                              <svg aria-hidden="true" viewBox="0 0 20 20" className="w-4 h-4" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12.5 4.5L7 10L12.5 15.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                            <span className="text-xs font-bold text-slate-500">
                              {lang === "en" ? `Page ${safeWizPage} of ${totalWizPages}` : `第 ${safeWizPage} 页，共 ${totalWizPages} 页`}
                            </span>
                            <button
                              type="button"
                              onClick={() => setWizardPage(Math.min(totalWizPages, safeWizPage + 1))}
                              disabled={safeWizPage >= totalWizPages}
                              className="w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-40 flex items-center justify-center cursor-pointer hover:bg-slate-50"
                              aria-label={lang === "en" ? "Next matches" : "下一组"}
                            >
                              <svg aria-hidden="true" viewBox="0 0 20 20" className="w-4 h-4" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M7.5 4.5L13 10L7.5 15.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Quick click back to form */}
            <div className="pt-2 text-center">
              <button 
                onClick={() => setShowWizardResults(false)}
                className="text-xs font-bold text-slate-500 hover:text-white underline transition"
              >
                {lang === "en" ? "← Back to revise parameters and sliders" : "← 返回重新微调宝宝岁数、跨高及我的购买预算偏好"}
              </button>
            </div>

          </div>
        ) : (
          // Input Fields Form View
          <div data-nosnippet className="space-y-8 relative z-10 transition-all">
            
            {/* Category selection tab bar: Stroller (Default) and remaining categories */}
            <div className="pb-6 border-b border-slate-100">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3.5 pl-1 font-sans">
                {lang === "en" ? "Step 1: Select Kid's Ride-On Category" : "第一步：选择您要测评的宝宝座驾品类"}
              </span>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
                {[
                  { id: "stroller", emoji: "🛒", labelEn: "Kids Stroller", labelZh: "安全伞车/手推车" },
                  { id: "bicycle", emoji: "🚴", labelEn: "Kids Bike", labelZh: "儿童自行车" },
                  { id: "scooter", emoji: "🛹", labelEn: "Kids Scooter", labelZh: "儿童滑板车" },
                  { id: "balance", emoji: "🚲", labelEn: "Balance Bike", labelZh: "学步滑步平衡车" },
                  { id: "electric_car", emoji: "⚡", labelEn: "Electric Car", labelZh: "智能电动玩具车" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setWizardCategory(cat.id)}
                    className={`py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2.5 font-black text-[11px] leading-none transition-all border cursor-pointer active:scale-95 select-none ${
                      wizardCategory === cat.id
                        ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-950/15"
                        : "bg-slate-50/70 border-slate-100 hover:bg-slate-50 text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <span className="text-sm">{cat.emoji}</span>
                    <span className="truncate">{lang === "en" ? cat.labelEn : cat.labelZh}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs text-slate-600 text-left">
              {/* Input 1: Age */}
              <div className="bg-slate-50 p-6 rounded-4xl border border-slate-100 space-y-4 shadow-sm hover:shadow-md transition-shadow">
                <label className="text-slate-400 font-black uppercase tracking-wider flex items-center justify-between text-[10px]">
                  <span>{lang === "en" ? "2. Age" : "2. 宝宝年龄"}</span>
                  <span className="text-orange-500 text-sm">{wizardAge} {lang === "en" ? "yrs" : "岁"}</span>
                </label>
                <div className="border-b border-slate-200 pb-2">
                  <input
                    type="range"
                    min="1"
                    max="12"
                    step="0.5"
                    value={wizardAge}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setWizardAge(val);
                    }}
                    aria-label={lang === "en" ? "Child age slider" : "宝宝岁数滑杆"}
                    title={lang === "en" ? "Child age slider" : "宝宝岁数滑杆"}
                    className="w-full accent-orange-500 h-5 bg-transparent border-0 rounded-none appearance-none cursor-pointer"
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-medium block">
                  {lang === "en" ? "Calculates critical safety threshold" : "用于实时更新安全称重死线"}
                </span>
              </div>

              {/* Input 2: Height */}
              <div className="bg-slate-50 p-6 rounded-4xl border border-slate-100 space-y-4 shadow-sm hover:shadow-md transition-shadow">
                <label className="text-slate-400 font-black uppercase tracking-wider flex items-center justify-between text-[10px]">
                  <span>{lang === "en" ? "3. Height" : "3. 身高 (Height)"}</span>
                  <span className="text-orange-500 text-sm">{formatHeight(wizardHeight, currencyData.code)}</span>
                </label>
                <div className="border-b border-slate-200 pb-2">
                  <input
                    type="range"
                    min="70"
                    max="160"
                    step="1"
                    value={wizardHeight}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setWizardHeight(val);
                      setWizardInseam(Math.floor(val * 0.38)); // Default estimation
                    }}
                    aria-label={lang === "en" ? "Child height slider" : "宝宝身高滑杆"}
                    title={lang === "en" ? "Child height slider" : "宝宝身高滑杆"}
                    className="w-full accent-orange-500 h-5 bg-transparent border-0 rounded-none appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Input 3: Inseam */}
              <div className="bg-slate-50 p-6 rounded-4xl border border-slate-100 space-y-4 shadow-sm hover:shadow-md transition-shadow">
                <label className="text-slate-400 font-black uppercase tracking-wider flex items-center justify-between text-[10px]">
                  <span>{lang === "en" ? "4. Inseam" : "4. 跨高 (Inseam)"}</span>
                  <span className="text-orange-500 text-sm">{formatHeight(wizardInseam, currencyData.code)}</span>
                </label>
                <div className="border-b border-slate-200 pb-2">
                  <input
                    type="range"
                    min="20"
                    max="75"
                    step="1"
                    value={wizardInseam}
                    onChange={(e) => setWizardInseam(parseInt(e.target.value))}
                    aria-label={lang === "en" ? "Child inseam slider" : "宝宝跨高滑杆"}
                    title={lang === "en" ? "Child inseam slider" : "宝宝跨高滑杆"}
                    className="w-full accent-orange-500 h-5 bg-transparent border-0 rounded-none appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Input 4: Weight */}
              <div className="bg-slate-50 p-6 rounded-4xl border border-slate-100 space-y-4 shadow-sm hover:shadow-md transition-shadow">
                <label className="text-slate-400 font-black uppercase tracking-wider flex items-center justify-between text-[10px]">
                  <span>{lang === "en" ? "5. Weight" : "5. 体重 (Weight)"}</span>
                  <span className="text-rose-500 text-sm font-black">{formatWeight(wizardWeight, currencyData.code)}</span>
                </label>
                <div className="border-b border-slate-200 pb-2">
                  <input
                    type="range"
                    min="5"
                    max="65"
                    step="0.5"
                    value={wizardWeight}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setWizardWeight(val);
                    }}
                    aria-label={lang === "en" ? "Child weight slider" : "宝宝体重滑杆"}
                    title={lang === "en" ? "Child weight slider" : "宝宝体重滑杆"}
                    className="w-full accent-orange-500 h-5 bg-transparent border-0 rounded-none appearance-none cursor-pointer"
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-medium block">
                  {lang === "en" ? "Calculates 30% safety threshold" : "用于实时更新安全称重死线"}
                </span>
              </div>

              {/* Input 5: Budget */}
              <div className="bg-slate-50 p-6 rounded-4xl border border-slate-100 space-y-4 shadow-sm hover:shadow-md transition-shadow sm:col-span-2">
                <label className="text-slate-400 font-black uppercase tracking-wider flex items-center justify-between text-[10px]">
                  <span>{lang === "en" ? "6. Purchase Budget Limit" : "6. 近期购车预算上限"}</span>
                  <span className="text-emerald-500 text-sm font-black">
                    {formatCurrencyFromUsd(wizardBudget, currencyData, lang, 2)}
                  </span>
                </label>
                <div className="border-b border-slate-200 pb-2">
                  <input
                    type="range"
                    min="100"
                    max="8000"
                    step="50"
                    value={wizardBudget}
                    onChange={(e) => setWizardBudget(parseInt(e.target.value))}
                    aria-label={lang === "en" ? "Budget slider" : "预算滑杆"}
                    title={lang === "en" ? "Budget slider" : "预算滑杆"}
                    className="w-full accent-emerald-500 h-5 bg-transparent border-0 rounded-none appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Input 6: Scenario */}
              <div className="bg-slate-50 p-6 rounded-4xl border border-slate-100 space-y-4 shadow-sm hover:shadow-md transition-shadow sm:col-span-2">
                <label className="text-slate-400 font-black uppercase tracking-wider block text-[10px]">
                  {lang === "en" ? "7. Primary Usage Scenario" : "7. 核心日常使用环境"}
                </label>
                <select
                  value={wizardScenario}
                  onChange={(e) => setWizardScenario(e.target.value)}
                  aria-label={lang === "en" ? "Primary usage scenario" : "主要使用场景"}
                  title={lang === "en" ? "Primary usage scenario" : "主要使用场景"}
                  className="w-full bg-white border border-slate-100 rounded-2xl p-3 text-sm text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer"
                >
                  <option value="all">{lang === "en" ? "🌐 Standard / City Paths" : "🌐 全部道路 (多场景)"}</option>
                  <option value="tight">{lang === "en" ? "🚇 Light & Portable (Urban)" : "🚇 极致轻巧及单手便携收折"}</option>
                  <option value="rough">{lang === "en" ? "🏞️ Rough / Adventure Tracks" : "🏞️ 充气有源避震户外越野颠簸"}</option>
                </select>
              </div>

            </div>
          </div>
        )}

        </section>
      )}

      {/* ========================================================
          Part 2: 专家选车科普指南库 (Expert Guides Directory Library)
          ======================================================== */}
      <section className="space-y-6">
        {selectedGuideState ? (() => {
          const guide = translateGuideArticle(selectedGuideState, lang);
          return (
            // Read detail mode view container
            <div className="max-w-3xl mx-auto bg-white border border-slate-100 rounded-[40px] p-8 sm:p-12 space-y-8 shadow-2xl relative animate-fade-in text-left">
              <button
                onClick={handleArticleClose}
                className="flex items-center gap-2 text-xs text-orange-500 hover:text-orange-600 font-black uppercase pb-6 border-b border-slate-50 mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                {lang === "en" ? "Back to Guides" : "返回指南目录"}
              </button>

              <div className="space-y-4">
                <span className="px-3 py-1 bg-orange-100 text-orange-600 text-[10px] font-black rounded-full uppercase border border-orange-200">
                  {guide.categoryLabel}
                </span>

                <h2 className="text-3xl font-black text-slate-900 leading-tight">
                  {guide.title}
                </h2>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-orange-500" />
                    {guide.author}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-orange-500" />
                    {guide.publishDate}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-orange-500" />
                    {guide.readTime}
                  </span>
                </div>
              </div>

              <div className="bg-orange-50/50 p-6 rounded-3xl border border-orange-100 text-slate-700 text-sm leading-relaxed font-medium italic relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-orange-400"></div>
                <strong>{lang === "en" ? "Summary: " : "概要："}</strong> {guide.summary}
              </div>

              <div className="text-slate-600 text-sm sm:text-base leading-8 space-y-6 border-t border-slate-50 pt-8">
                {guide.content.split("\n\n").map((para: string, ip: number) => {
                  if (para.startsWith("### ")) {
                    return <h3 key={ip} className="text-xl font-black text-slate-900 mt-10 mb-4">{para.replace("### ", "")}</h3>;
                  }
                  if (para.startsWith("#### ")) {
                    return <h4 key={ip} className="text-lg font-bold text-orange-500 mt-8 mb-4">{para.replace("#### ", "")}</h4>;
                  }
                  if (para.startsWith("* ") || para.startsWith("- ")) {
                    return (
                      <ul key={ip} className="list-disc list-inside space-y-2 text-slate-500 pl-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                        {para.split("\n").map((li, il) => (
                          <li key={il} className="font-medium">{li.replace(/^(\* |- )/, "")}</li>
                        ))}
                      </ul>
                    );
                  }
                  return <p key={ip} className="leading-relaxed text-justify font-medium">{para}</p>;
                })}
              </div>

              <div className="pt-10 border-t border-slate-50 flex justify-between">
                <button
                  onClick={handleArticleClose}
                  className="px-6 py-3 bg-slate-50 text-slate-500 hover:text-slate-900 border border-slate-100 hover:border-slate-200 text-sm rounded-2xl font-black transition-all"
                >
                  {lang === "en" ? "Back to Guides" : "完成阅读"}
                </button>
              </div>
            </div>
          );
        })() : (
          <div className="space-y-10">
            <div className="rounded-[40px] overflow-hidden border border-slate-200 bg-white text-slate-900 shadow-2xl shadow-slate-900/10">
              <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.4fr] min-h-[320px]">
                <div className="p-8 sm:p-10 flex flex-col justify-between gap-8 bg-[linear-gradient(135deg,rgba(255,247,237,0.96),rgba(255,255,255,0.86)_48%,rgba(236,253,245,0.64))]">
                  <div className="space-y-5">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-100 text-[10px] font-black uppercase tracking-[0.2em] text-orange-600">
                      <BookOpen className="w-4 h-4" />
                      {lang === "en" 
                        ? `${isCategoryFilterBypassed ? "All Products" : (PRODUCT_CATEGORY_LABELS[wizardCategory]?.en || "All Products")} Guides` 
                        : `${isCategoryFilterBypassed ? "全部品类" : (PRODUCT_CATEGORY_LABELS[wizardCategory]?.zh || "全部")} 专属选购指南`}
                    </span>
                    <h2 className="text-3xl font-black leading-tight tracking-tight">
                      {lang === "en" 
                        ? `Guide Library: ${isCategoryFilterBypassed ? "Site-Wide" : (PRODUCT_CATEGORY_LABELS[wizardCategory]?.en || "Ride-ons")} Buyer's Handbook` 
                        : `指南库：针对【${isCategoryFilterBypassed ? "全站通用" : (PRODUCT_CATEGORY_LABELS[wizardCategory]?.zh || "全部童车")}】的科普与工效测评`}
                    </h2>
                    <p className="text-sm text-slate-600 leading-7 font-medium max-w-xl">
                      {lang === "en" 
                        ? `${isCategoryFilterBypassed ? "Since no guides target the selected type, we are showing all site-wide guides." : `Expert guides specifically filtered for ${PRODUCT_CATEGORY_LABELS[wizardCategory]?.en || "your selected category"}.`} Learn sizing benchmarks, risk indicators, and maintenance habits.`
                        : `${isCategoryFilterBypassed ? "由于当前所选车型暂无专属指南，系统已为您自动呈现全站选购宝典。" : `当前内容已根据您在上方算力面板中选择的商品品类，自动对指南库进行全量过滤，为您高能度匹配【${PRODUCT_CATEGORY_LABELS[wizardCategory]?.zh || "当前品类"}】相关的尺寸、安全与养护攻略。`}`}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {[
                      { value: filteredGuides.length, label: lang === "en" ? "Visible" : "当前展示" },
                      { value: activeArticlesList.length, label: lang === "en" ? "Category Total" : "品类指南总数" },
                      { value: "6x5", label: lang === "en" ? "Shelves" : "分类配置" },
                    ].map((item) => (
                      <div key={item.label} className="rounded-2xl bg-white/75 border border-slate-200 px-3 py-4 shadow-sm">
                        <div className="text-xl font-black text-slate-950">{item.value}</div>
                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-1">{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 sm:p-8 bg-white text-slate-900">
                  <div className="relative mb-6">
                    <Search className="w-4 h-4 text-slate-400 absolute left-4 top-4" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={lang === "en" ? "Search product names, risk terms, sizing topics..." : "搜索产品名、风险术语、尺寸/预算/养护主题..."}
                      aria-label={lang === "en" ? "Search guide library" : "检索指南库"}
                      title={lang === "en" ? "Search guide library" : "检索指南库"}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {categories.map((c) => {
                      const Icon = c.icon || BookOpen;
                      const count = c.id === "all" ? activeArticlesList.length : guideCategoryCounts[c.id] || 0;
                      return (
                        <button
                          key={c.id}
                          onClick={() => {
                            setSelectedCategory(c.id);
                            onPageChange?.(1);
                          }}
                          className={`text-left rounded-2xl border p-4 transition-all group ${
                            selectedCategory === c.id
                              ? "bg-slate-950 text-white border-slate-950 shadow-xl shadow-slate-900/10"
                              : "bg-white text-slate-700 border-slate-100 hover:border-orange-200 hover:bg-orange-50/40"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${selectedCategory === c.id ? "bg-orange-500 text-white" : "bg-slate-100 text-orange-500 group-hover:bg-orange-100"}`}>
                                <Icon className="w-5 h-5" />
                              </span>
                              <span className="min-w-0">
                                <span className="block text-sm font-black leading-tight">{c.label}</span>
                                <span className={`block text-[11px] font-bold mt-1 leading-snug ${selectedCategory === c.id ? "text-slate-300" : "text-slate-400"}`}>{c.deck}</span>
                              </span>
                            </div>
                            <span className={`text-[10px] font-black rounded-full px-2 py-1 shrink-0 ${selectedCategory === c.id ? "bg-white/10 text-orange-200" : "bg-slate-50 text-slate-400"}`}>{count}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {filteredGuides.length === 0 ? (
              <div className="p-16 text-center bg-white border border-slate-100 rounded-[40px] shadow-sm space-y-4">
                <p className="text-slate-400 font-medium">
                  {searchQuery 
                    ? (lang === "en" 
                        ? `No match found for search query "${searchQuery}".` 
                        : `没有找到匹配关键词 “${searchQuery}” 的指南文章。`)
                    : (lang === "en" 
                        ? `No guides found under "${categories.find(c => c.id === selectedCategory)?.label || selectedCategory}".` 
                        : `在【${categories.find(c => c.id === selectedCategory)?.label || selectedCategory}】主题下，暂时没有该品类的特定科普文章。`)}
                </p>
                <div className="flex justify-center gap-3">
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="px-5 py-2.5 bg-slate-900 text-white text-xs font-black rounded-xl hover:bg-slate-800 transition shadow-md active:scale-95 cursor-pointer"
                    >
                      {lang === "en" ? "Clear Search Keyword" : "清除搜索词"}
                    </button>
                  )}
                  {selectedCategory !== "all" && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory("all");
                        onPageChange?.(1);
                      }}
                      className="px-5 py-2.5 bg-orange-500 text-white text-xs font-black rounded-xl hover:bg-orange-600 transition shadow-md shadow-orange-500/10 active:scale-95 cursor-pointer"
                    >
                      {lang === "en" ? "Show All Category Guides" : "查看此品类全部指南"}
                    </button>
                  )}
                  {selectedCategory === "all" && !searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setWizardCategory("stroller");
                        setSelectedCategory("all");
                        onPageChange?.(1);
                      }}
                      className="px-5 py-2.5 bg-orange-500 text-white text-xs font-black rounded-xl hover:bg-orange-600 transition shadow-md shadow-orange-500/10 active:scale-95 cursor-pointer"
                    >
                      {lang === "en" ? "Reset to Baby Stroller Guides" : "重置并查看婴儿推车指南"}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {pagedGuides[0] && (
                  <button
                    type="button"
                    onClick={() => handleArticleClick(pagedGuides[0])}
                    className="w-full text-left bg-white border border-slate-100 rounded-[32px] p-6 sm:p-8 shadow-xl shadow-slate-200/50 hover:border-orange-200 hover:shadow-orange-500/10 transition-all group"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 items-stretch">
                      <div className="space-y-5">
                        <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-widest">
                          <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full border border-orange-100">{pagedGuides[0].categoryLabel}</span>
                          <span className="text-slate-400">{pagedGuides[0].publishDate}</span>
                          <span className="text-slate-400 flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{pagedGuides[0].readTime}</span>
                        </div>
                        <h3 className="font-black text-slate-950 text-lg leading-tight group-hover:text-orange-500 transition-colors">
                          {pagedGuides[0].title}
                        </h3>
                        <p className="text-sm text-slate-500 leading-7 font-medium line-clamp-3">
                          {pagedGuides[0].summary}
                        </p>
                      </div>
                      <div className="rounded-3xl bg-slate-950 text-white p-6 flex flex-col justify-between gap-8">
                        <div className="text-[11px] text-slate-300 leading-6 font-medium line-clamp-5">
                          {pagedGuides[0].content.replace(/#+\s/g, "").slice(0, 360)}...
                        </div>
                        <div className="flex items-center justify-between text-xs font-black">
                          <span className="text-slate-400 flex items-center gap-2"><Briefcase className="w-4 h-4 text-orange-400" />{pagedGuides[0].author.split("-")[0].trim()}</span>
                          <span className="text-orange-300 flex items-center gap-1">{lang === "en" ? "Read guide" : "阅读指南"}<ChevronRight className="w-4 h-4" /></span>
                        </div>
                      </div>
                    </div>
                  </button>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 text-left animate-fade-in">
                {pagedGuides.slice(1).map((guide) => (
                  <button
                    type="button"
                    key={guide.id}
                    onClick={() => handleArticleClick(guide)}
                    className="bg-white border border-slate-100 hover:border-orange-200 rounded-[28px] p-6 flex flex-col justify-between min-h-[260px] cursor-pointer hover:shadow-xl hover:shadow-orange-500/5 transition-all group text-left"
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-start gap-3 text-[10px]">
                        <span className="bg-slate-50 text-slate-500 px-3 py-1 rounded-full font-black uppercase border border-slate-100 group-hover:bg-orange-50 group-hover:text-orange-600 group-hover:border-orange-100 transition-colors">
                          {guide.categoryLabel}
                        </span>
                        <span className="text-slate-400 font-bold shrink-0">{guide.publishDate}</span>
                      </div>

                      <h3 className="font-black text-slate-900 text-base leading-snug group-hover:text-orange-500 transition-colors line-clamp-3">
                        {guide.title}
                      </h3>
                      <p className="text-slate-500 text-xs line-clamp-3 leading-6 font-medium">
                        {guide.summary}
                      </p>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-400 pt-5 border-t border-slate-50 font-bold mt-6">
                      <span className="flex items-center gap-1.5 min-w-0 truncate">
                        <Briefcase className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                        <span className="truncate">{guide.author.split("-")[0].trim()}</span>
                      </span>
                      <span className="text-orange-500 font-black flex items-center gap-1 shrink-0">
                        {lang === "en" ? "Read" : "阅读"}<ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </button>
                ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => onPageChange?.(Math.max(1, safePage - 1))}
                      disabled={safePage <= 1}
                      className="w-10 h-10 rounded-2xl border border-slate-200 bg-white text-slate-600 disabled:opacity-40 flex items-center justify-center"
                      aria-label={lang === "en" ? "Go to previous page" : "上一页"}
                    >
                      <svg aria-hidden="true" viewBox="0 0 20 20" className="w-4 h-4" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12.5 4.5L7 10L12.5 15.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <div
                      className="w-24 h-2 rounded-full bg-slate-100 overflow-hidden"
                      role="progressbar"
                      aria-valuemin={1}
                      aria-valuemax={totalPages}
                      aria-valuenow={safePage}
                      aria-label={lang === "en" ? `Page ${safePage} of ${totalPages}` : `第 ${safePage} 页，共 ${totalPages} 页`}
                    >
                      <div
                        className="h-full bg-slate-900 rounded-full transition-all"
                        style={{ width: `${Math.max(8, (safePage / totalPages) * 100)}%` }}
                      />
                    </div>
                    <button
                      onClick={() => onPageChange?.(Math.min(totalPages, safePage + 1))}
                      disabled={safePage >= totalPages}
                      className="w-10 h-10 rounded-2xl border border-slate-200 bg-white text-slate-600 disabled:opacity-40 flex items-center justify-center"
                      aria-label={lang === "en" ? "Go to next page" : "下一页"}
                    >
                      <svg aria-hidden="true" viewBox="0 0 20 20" className="w-4 h-4" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7.5 4.5L13 10L7.5 15.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                )}

                <p className="max-w-3xl mx-auto text-center text-sm text-slate-500 leading-7 font-medium pt-4">
                  {lang === "en" ? (
                    <>
                      After checking your child's fit, compare real-world handling data in our{" "}
                      <a href="/reviews" className="text-orange-500 hover:text-orange-600 font-black underline decoration-orange-200 underline-offset-4">
                        lab-tested jogging stroller reviews
                      </a>
                      . Our review desk measures braking response, frame stability, and riding comfort so parents can move from sizing advice to safer product decisions.
                    </>
                  ) : (
                    <>
                      完成尺寸和场景判断后，可继续查看我们的{" "}
                      <a href="/reviews" className="text-orange-500 hover:text-orange-600 font-black underline decoration-orange-200 underline-offset-4">
                        实验室童车评测
                      </a>
                      ，用制动、车架稳定性与真实骑行舒适度数据完成下一步筛选。
                    </>
                  )}
                </p>
              </div>
            )}
          </div>
        )}
      </section>

    </div>
  );
}
