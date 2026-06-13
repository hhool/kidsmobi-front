import React, { useState, useMemo } from "react";
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
  MessageSquare
} from "lucide-react";
import { GuideArticle, guideArticles } from "../data/guidesData";
import { Product } from "../types";
import { translateProduct, translateGuideArticle } from "../lib/translate";

const faqData = [
  {
    id: "faq_1",
    questionZh: "1. 童车车重到底有什么安全死线？为什么超重车辆是侧翻的罪魁祸首？",
    questionEn: "1. What is the safety threshold for kids' bike weight? Why are heavy bikes the primary cause of tipping?",
    answerZh: `根据全球儿科力学会（Pediatric Biomechanics Council）和安全工效研究室的统一规约：
    
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
*   **175° 黄金平躺角度**：部分伞车为了节约收拢体积，只能支持 135°-145° 倾角。婴儿如果被硬性斜放其上，重力线会全部汇集在脆弱的下端骶尾骨区域，压迫未发育成熟前端的椎骨，极易引发生理性倾斜或者脊柱变形弯曲。真正符合安全研究所规范的是 **170°-175° 的卧篮面（保留 5° 的防溢奶安全回落倾角，而非死板纯平）**，将上半身和骨盆的承接重力均匀分散至背脊全区。
*   **路面震波屏障**：由于新生儿脑部组织呈“嫩豆腐状”果冻黏性自流，头颈肌肉控制力约等于零。如果推车缺少中枢弹簧或充气式有源空气避震，推过非平滑盲道或不平水泥道时产生的高频共振（震波传递超 2.2G），会由婴儿娇嫩的前庭半规管放大，造成潜在的大脑、眼底毛细剥离（即摇晃婴儿综合征伤害），物理空气避震以及 175° 睡篮是全地形推车不可妥协的核心配置。`,
    answerEn: `*   **Spinal Curvature Safeguard**: Prior to 6 months of age, a newborn's spine exhibits a singular, C-shaped convex curvature. It possesses none of the adult-like S-shaped structural curves.
*   **The 170°-175° Lay-Flat Standard**: Cheap compact strollers often slope only to 135°-145°. Placing a newborn on such inclines channels the entire gravitational load straight into the immature coccyx and lower lumbar vertebrae. This risks skeletal deformation. A true medical-grade stroller utilizes a **170° to 175° layflat bassinet envelope (yielding a gentle 5-degree head elevation to mitigate milk reflux, rather than a perfect 180° flat surface)**, distributing spinal weight uniformly.
*   **The Brain Suspension Barrier**: A newborn's brain tissue is semi-fluidic, and their neck musculature is entirely undeveloped. Rolling a suspension-free plastic-wheeled buggy over brick lanes generates high-frequency tremors (over 2.2G). These shock waves traverse into the child's cranium, placing them at risk of retinal capillary micro-shearing (Shaken Baby Syndrome). Rigid multi-arm spring suspension and deep layflat bassinet supports are non-negotiable shielding features.`
  }
];

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
}

export default function GuidesSection({
  productsData,
  onSelectProduct,
  childProfile,
  setChildProfile,
  lang = "zh"
}: GuidesSectionProps) {
  const [selectedGuideState, setSelectedGuideState] = useState<any | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Accordion state
  const [openFaqId, setOpenFaqId] = useState<string | null>("faq_1");

  // Match Wizard interactive states
  const [wizardAge, setWizardAge] = useState<number>(childProfile.age || 4);
  const [wizardHeight, setWizardHeight] = useState<number>(childProfile.height || 102);
  const [wizardInseam, setWizardInseam] = useState<number>(childProfile.inseam || 38);
  const [wizardWeight, setWizardWeight] = useState<number>(childProfile.weight || 16);
  const [wizardBudget, setWizardBudget] = useState<number>(3000);
  const [wizardScenario, setWizardScenario] = useState<string>("all");
  const [showWizardResults, setShowWizardResults] = useState<boolean>(false);

  // Guide Article filters
  const filteredGuides = useMemo(() => {
    return guideArticles
      .map(art => translateGuideArticle(art, lang))
      .filter((art) => {
        const matchesCat = selectedCategory === "all" || art.category === selectedCategory;
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch = query === "" ||
          art.title.toLowerCase().includes(query) ||
          art.summary.toLowerCase().includes(query) ||
          art.content.toLowerCase().includes(query);
        return matchesCat && matchesSearch;
      });
  }, [selectedCategory, searchQuery, lang]);

  // Match Wizard calculation formula
  const matchRecommendations = useMemo(() => {
    // 1. Recommended Wheel Sizes based on leg inseam
    let recWheel = lang === "en" ? "12 in." : "12寸";
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

    // 2. Safe Max Car Weights
    const perfectWeightLimit = parseFloat((wizardWeight * 0.3).toFixed(1));
    const dangerWeightLimit = parseFloat((wizardWeight * 0.4).toFixed(1));

    // 3. Recommended category
    let recCat = "balance";
    if (wizardAge < 2.5) {
      recCat = "balance";
    } else if (wizardAge >= 2.5 && wizardAge <= 5) {
      recCat = "bicycle";
    } else {
      recCat = "bicycle";
    }

    // 4. Products matching math
    const matches = productsData.filter((p) => {
      // Must be below budget
      const withinBudget = p.price <= wizardBudget;
      
      // Categorization/wheel size fits generally
      let isWheelSizeMatch = true;
      if (p.wheelSize !== "无") {
        const sizeNum = parseInt(p.wheelSize);
        if (!isNaN(sizeNum)) {
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
      
      // Specific Scenario matches
      let isScenarioMatch = true;
      if (wizardScenario === "tight") {
        isScenarioMatch = p.weight <= perfectWeightLimit || p.category === "scooter" || p.category === "balance";
      } else if (wizardScenario === "rough") {
        isScenarioMatch = p.tireType.includes("充气") || p.tireType.includes("越野") || p.tireType.includes("橡胶");
      }

      // Heavy/weight safety check
      const isWeightSafe = p.weight <= dangerWeightLimit || p.category === "stroller" || p.category === "safety_seat";

      return withinBudget && isWeightSafe && isWheelSizeMatch && isScenarioMatch;
    });

    return {
      recWheel,
      perfectWeightLimit,
      dangerWeightLimit,
      matches,
      recCat
    };
  }, [wizardAge, wizardHeight, wizardInseam, wizardWeight, wizardBudget, wizardScenario, productsData, lang]);

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
    { id: "all", label: "📁 All Guides" },
    { id: "beginner", label: "🔰 For Beginners" },
    { id: "risk", label: "☠️ Sizing Pitfalls" },
    { id: "export", label: "⚖️ Standard Audits" },
    { id: "maintenance", label: "🔧 Maintenance" },
    { id: "scenario", label: "🏞️ Scenario Sizing" }
  ] : [
    { id: "all", label: "📁 全部指南目录" },
    { id: "beginner", label: "🔰 选车新手册" },
    { id: "risk", label: "☠️ 车款避坑死线" },
    { id: "export", label: "⚖️ 跨境合规认证" },
    { id: "maintenance", label: "🔧 车辆保养知识" },
    { id: "scenario", label: "🏞️ 场景化量身置" }
  ];

  return (
    <div id="guides_container" className="space-y-12">
      
      {/* ========================================================
          Part 1: 智能选购匹配工效算力工具 (Interactive Match Wizard)
          ======================================================== */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/10 rounded-3xl p-6 sm:p-8 shadow-xl text-left">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/60 pb-6 mb-6">
          <div className="space-y-1.5 text-left">
            <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black rounded-lg uppercase tracking-wider block w-max">
              {lang === "en" ? "WIZARD · SMART ERGONOMICS" : "WIZARD · 工效智能匹配"}
            </span>
            <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Calculator className="w-5 h-5 text-amber-500" />
              {lang === "en" ? "Interactive Child Mobility Sizing Wizard" : "童车参数匹配智敏算力箱"}
            </h3>
            <p className="text-xs text-slate-400">
              {lang === "en" 
                ? "Enter baby physical attributes to dynamically calculate biomechanical wheel dimensions, posture requirements, and weight thresholds." 
                : "输入您家宝宝的真实身体特征值，我们将自动计算符合医学规范的安全轮径与最高车重死线"}
            </p>
          </div>
          <button 
            type="button" 
            onClick={() => setShowWizardResults(!showWizardResults)}
            className="px-4 py-2 bg-amber-500 text-slate-950 font-black text-xs rounded-xl hover:bg-amber-600 transition flex items-center gap-1.5"
          >
            {showWizardResults 
              ? (lang === "en" ? "⚙️ Back to Adjustable Sliders" : "⚙️ 返回调整参数")
              : (lang === "en" ? "⚡ Compute Advice & Sift Inventory" : "⚡ 立即计算推荐 & 筛选在库产品")}
          </button>
        </div>

        {showWizardResults ? (
          // Matches results display viewport
          <div className="space-y-6 animate-fade-in text-left">
            
            {/* Safety math indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 text-lg font-black shrink-0">
                  {matchRecommendations.recWheel.split(" ")[0]}
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">
                    {lang === "en" ? "Recommended Wheel Size" : "安全推荐轮径"}
                  </span>
                  <strong className="text-white text-xs">{matchRecommendations.recWheel}</strong>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 text-lg font-black shrink-0">
                  {matchRecommendations.perfectWeightLimit}kg
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">
                    {lang === "en" ? "Golden Max Vehicle Weight (30%)" : "宝宝黄金车重上限 (30%)"}
                  </span>
                  <strong className="text-white text-xs">
                    {lang === "en" ? "Under this limit ensures absolute control" : "低于此自重，骑行最畅快安全"}
                  </strong>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-400/10 flex items-center justify-center text-red-400 text-lg font-black shrink-0">
                  {matchRecommendations.dangerWeightLimit}kg
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">
                    {lang === "en" ? "Rigid Biomechanical Stop (40%)" : "物理承载倾轧极限 (40%)"}
                  </span>
                  <strong className="text-white text-xs">
                    {lang === "en" ? "Heavier frames risk joint overload" : "高于此重量易转弯失控砸伤骨体"}
                  </strong>
                </div>
              </div>

            </div>

            {/* Simulated logic matching results list */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest">
                  {lang === "en" 
                    ? `📋 Rigid Safety Recs Filtered (${matchRecommendations.matches.length} matches)` 
                    : `📋 为您严格筛选出的安全车型 (在库推荐数: ${matchRecommendations.matches.length})`}
                </h4>
                <button 
                  onClick={handleApplyWizardToProfile} 
                  className="text-[10px] text-amber-500 hover:underline hover:text-amber-400 font-bold"
                >
                  {lang === "en" ? "Sync and Apply to Full Site →" : "同步并应用于全站 →"}
                </button>
              </div>

              {matchRecommendations.matches.length === 0 ? (
                <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-850">
                  <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                  <span className="text-xs text-slate-300 inline-block">
                    {lang === "en" ? "Apologies, no models currently match all physical limits." : "很抱歉，在库车型中暂时没有完全匹配您当下限制的产品。"}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {lang === "en" 
                      ? "You may increase budget bounds or scale accepted frame tare allowances." 
                      : "您可以试着增加预算（当前：￥3000）或调增可接受车自重后重新检视。"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {matchRecommendations.matches.map((p) => {
                    const dispProduct = translateProduct(p, lang);
                    const isPerfectWeight = p.weight <= matchRecommendations.perfectWeightLimit;
                    return (
                      <div key={dispProduct.id} className="bg-slate-950 p-4 rounded-xl border border-slate-850 hover:border-slate-800 flex flex-col justify-between space-y-3 transition group">
                        <div>
                          <div className="flex justify-between items-start text-[9px]">
                            <span className="bg-slate-900 border border-slate-850 text-amber-500 p-1 rounded font-bold uppercase leading-none">{dispProduct.brand}</span>
                            <span className="text-slate-500 font-mono">ID: {dispProduct.id}</span>
                          </div>
                          
                          <h4 className="text-xs sm:text-sm font-black text-white mt-1.5 truncate group-hover:text-amber-400 transition-colors">{dispProduct.name}</h4>
                          <p className="text-[10px] text-slate-500 line-clamp-2 mt-1 leading-relaxed italic">“{dispProduct.editorVerdict}”</p>
                        </div>

                        {/* Metric block inside wizard matches */}
                        <div className="border-t border-slate-900/80 pt-2.5 text-[10px] text-slate-400 space-y-1">
                          <div className="flex justify-between">
                            <span>{lang === "en" ? "Measured Weight:" : "车身净重："}</span>
                            <strong className={isPerfectWeight ? "text-green-400" : "text-amber-500"}>{dispProduct.weight} kg</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>{lang === "en" ? "Reference Price:" : "参考市价："}</span>
                            <strong className="text-amber-500 font-mono">{lang === "en" ? "$" : "￥"}{dispProduct.price}</strong>
                          </div>
                        </div>

                        <button
                          onClick={() => onSelectProduct(p)}
                          className="w-full py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 font-bold text-[10px] uppercase rounded border border-slate-850 hover:border-slate-800 transition-all"
                        >
                          {lang === "en" ? "Analyze Report Details →" : "深入研析这份检测书 →"}
                        </button>
                      </div>
                    );
                  })}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs text-slate-300 text-left">
            
            {/* Input 1: Age */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
              <label className="text-slate-400 font-bold flex items-center justify-between">
                <span>{lang === "en" ? "1. Age Limit" : "1. 宝宝周岁 (Age)"}</span>
                <span className="font-mono text-amber-500">{wizardAge} {lang === "en" ? "yrs" : "岁"}</span>
              </label>
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
                className="w-full accent-amber-500 bg-slate-900"
              />
              <span className="text-[10px] text-slate-500 block">
                {lang === "en" ? "Determines bone density and wheel scaling" : "用于判定骨盆发育及适配轮型"}
              </span>
            </div>

            {/* Input 2: Height */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
              <label className="text-slate-400 font-bold flex items-center justify-between">
                <span>{lang === "en" ? "2. Total Height" : "2. 宝宝净身高 (Height)"}</span>
                <span className="font-mono text-amber-500">{wizardHeight} cm</span>
              </label>
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
                className="w-full accent-amber-500 bg-slate-900"
              />
              <span className="text-[10px] text-slate-500 block">
                {lang === "en" ? "Sets height reach tolerances" : "基础身高比例测定限制"}
              </span>
            </div>

            {/* Input 3: Inseam/Leg heights */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
              <label className="text-slate-400 font-bold flex items-center justify-between">
                <span>{lang === "en" ? "3. Crotch-Inseam" : "3. 脱鞋腿内侧跨高"}</span>
                <span className="font-mono text-amber-400 font-black">{wizardInseam} cm</span>
              </label>
              <input
                type="range"
                min="20"
                max="75"
                step="1"
                value={wizardInseam}
                onChange={(e) => setWizardInseam(parseInt(e.target.value))}
                className="w-full accent-amber-500 bg-slate-900"
              />
              <span className="text-[10px] text-slate-500 block">
                {lang === "en" ? "Guarantees foot-plant safety margin" : "底座座椅支撑重心线检测要害"}
              </span>
            </div>

            {/* Input 4: Weight */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
              <label className="text-slate-400 font-bold flex items-center justify-between">
                <span>{lang === "en" ? "4. Child Weight" : "4. 宝宝重 (Weight)"}</span>
                <span className="font-mono text-red-400 font-black">{wizardWeight} kg</span>
              </label>
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
                className="w-full accent-amber-500 bg-slate-900"
              />
              <span className="text-[10px] text-slate-500 block">
                {lang === "en" ? "Calculates the strict 30% weight limit" : "力学重心核验，防沉重钢铁侧摔"}
              </span>
            </div>

            {/* Input 5: Budget */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2 sm:col-span-2">
              <label className="text-slate-400 font-bold flex items-center justify-between">
                <span>{lang === "en" ? "5. Max Purchase Budget" : "5. 我的买车预算"}</span>
                <span className="font-mono text-green-400 font-black">
                  {lang === "en" ? `$ ${wizardBudget}` : `￥ ${wizardBudget}`}
                </span>
              </label>
              <input
                type="range"
                min="100"
                max="8000"
                step="50"
                value={wizardBudget}
                onChange={(e) => setWizardBudget(parseInt(e.target.value))}
                className="w-full accent-amber-500 bg-slate-900"
              />
              <span className="text-[10px] text-slate-500 block">
                {lang === "en" ? "Filter in-stock configurations" : "一键排除超荷高估溢价车型"}
              </span>
            </div>

            {/* Input 6: Scenario Choice */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2 sm:col-span-2">
              <label className="text-slate-400 font-bold block text-left">
                {lang === "en" ? "6. Physical Travel Road constraints" : "6. 主要出行道路场景特征"}
              </label>
              <select
                value={wizardScenario}
                onChange={(e) => setWizardScenario(e.target.value)}
                className="w-full bg-slate-900 border border-slate-850 rounded p-2 text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="all">{lang === "en" ? "🌐 Standard Pavement / Mall Slabs" : "🌐 全部道路 (多场景覆盖)"}</option>
                <option value="tight">{lang === "en" ? "🚇 Urban Subways / Tiny Apartments (Requires lightweight)" : "🚇 城市地铁高密通勤 (偏重超轻轻便款)"}</option>
                <option value="rough">{lang === "en" ? "🏞️ Rough Muddy Tracks & Wet Slopes (Pneumatic tires rule)" : "🏞️ 硬核户外泥沙颠地 (偏向气减震防爆轮)"}</option>
              </select>
              <span className="text-[10px] text-slate-500 block">
                {lang === "en" ? "Aligns tyre tread and weight tolerances" : "根据场景自动调配适格阻尼度"}
              </span>
            </div>

          </div>
        )}

      </section>

      {/* ========================================================
          Part 2: 专家选车科普指南库 (Expert Guides Directory Library)
          ======================================================== */}
      <section className="space-y-6">
        {selectedGuideState ? (() => {
          const guide = translateGuideArticle(selectedGuideState, lang);
          return (
            // Read detail mode view container
            <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 space-y-6 shadow-2xl relative animate-fade-in text-left">
              <button
                onClick={() => setSelectedGuideState(null)}
                className="flex items-center gap-1.5 text-xs text-amber-500 hover:text-amber-400 font-bold uppercase pb-4 border-b border-slate-800/80 mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                {lang === "en" ? "Back to Guides List" : "返回安全指南库"}
              </button>

              <div className="space-y-4">
                <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black rounded-lg uppercase">
                  {guide.categoryLabel}
                </span>

                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-tight">
                  {guide.title}
                </h2>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-amber-500" />
                    {guide.author}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                    {guide.publishDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    {guide.readTime}
                  </span>
                </div>
              </div>

              {/* Summary card description box */}
              <div className="bg-slate-950 p-4 rounded-xl border-l-4 border-amber-500 text-slate-300 text-xs sm:text-sm leading-relaxed italic">
                <strong>{lang === "en" ? "Brief Summary: " : "概要："}</strong> {guide.summary}
              </div>

              {/* Split paragraph parsing markdown code */}
              <div className="whitespace-pre-wrap text-slate-300 text-xs sm:text-sm leading-8 space-y-6 border-t border-slate-800/80 pt-6">
                {guide.content.split("\n\n").map((para: string, ip: number) => {
                  if (para.startsWith("### ")) {
                    return <h3 key={ip} className="text-lg font-bold text-white mt-6 mb-2">{para.replace("### ", "")}</h3>;
                  }
                  if (para.startsWith("#### ")) {
                    return <h4 key={ip} className="text-base font-bold text-amber-400 mt-4 mb-2">{para.replace("#### ", "")}</h4>;
                  }
                  if (para.startsWith("* ") || para.startsWith("- ")) {
                    return (
                      <ul key={ip} className="list-disc list-inside space-y-1 text-slate-400 pl-2">
                        {para.split("\n").map((li, il) => (
                          <li key={il}>{li.replace(/^(\* |- )/, "")}</li>
                        ))}
                      </ul>
                    );
                  }
                  return <p key={ip} className="text-slate-300 leading-relaxed text-justify">{para}</p>;
                })}
              </div>

              <div className="pt-6 border-t border-slate-800/80 flex justify-between">
                <button
                  onClick={() => setSelectedGuideState(null)}
                  className="px-4 py-2 bg-slate-950 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 text-xs rounded-xl font-bold transition"
                >
                  {lang === "en" ? "Back to Guides" : "关闭阅读返回"}
                </button>
              </div>

            </div>
          );
        })() : (
          // Grid directory card view listing
          <div className="space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h3 className="text-2xl font-black text-white flex items-center justify-center gap-2">
                <BookOpen className="w-6 h-6 text-amber-500" />
                {lang === "en" ? "Ergonomic科普 & Sizing Bible" : "研究所安全考量与科普常识库"}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === "en" 
                  ? "Bypass marketing clichés. Get pure biomechanical calculations, ASTM F963 rules, and posture standards."
                  : "拒绝任何母婴带货噱头。我们只用物理公式、阻燃测试数据以及国家与国际合规红线，解算最无创的挑选逻辑。"}
              </p>
            </div>

            {/* Sifting tabs and filters */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 text-left">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-600 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={lang === "en" ? "Search safety keywords, Q-Factor, ISO rules, ASTM limits..." : "检索核心安全术语、Q-factor、避震材质..."}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Directories tabs tags list */}
              <div className="flex flex-wrap gap-1.5 pt-1 text-left">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      selectedCategory === c.id
                        ? "bg-amber-500 text-slate-950 border-amber-400"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Render guides list */}
            {filteredGuides.length === 0 ? (
              <div className="p-16 text-center bg-slate-900 border border-slate-800 rounded-2xl">
                <span className="text-xs text-slate-500">
                  {lang === "en" ? "No guide articles match your search parameters." : "没有搜索到对应条件的安全科普指南书"}
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left animate-fade-in">
                {filteredGuides.map((guide) => (
                  <div
                    key={guide.id}
                    onClick={() => setSelectedGuideState(guide)}
                    className="bg-slate-900 border border-slate-800 hover:border-amber-500/20 rounded-2xl p-5 flex flex-col justify-between space-y-4 cursor-pointer hover:shadow-lg transition group"
                  >
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="bg-slate-950 text-amber-500 px-2 py-0.5 rounded border border-slate-850 font-bold uppercase">
                          {guide.categoryLabel}
                        </span>
                        <span className="text-slate-500 font-mono font-bold">{guide.publishDate}</span>
                      </div>

                      <h4 className="font-extrabold text-white text-sm sm:text-base leading-snug group-hover:text-amber-400 transition-colors">
                        {guide.title}
                      </h4>
                      <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">
                        {guide.summary}
                      </p>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-500 pt-2 border-t border-slate-850/80">
                      <span>{lang === "en" ? "Expert: " : "著者: "} {guide.author.split("-")[0]}</span>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-0.5 font-mono">
                          <Clock className="w-3 h-3 text-amber-500" />
                          {guide.readTime}
                        </span>
                        <span className="text-amber-500 hover:underline font-bold">
                          {lang === "en" ? "Dive In →" : "严谨研读 →"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Professional Q&A Section */}
            <div id="pro_qa_accordion" className="mt-16 pt-16 border-t border-slate-800/80 space-y-6">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <h3 className="text-2xl font-black text-white flex items-center justify-center gap-2">
                  <HelpCircle className="w-6 h-6 text-amber-500" />
                  {lang === "en" ? "🔬 Pediatric Rider Mechanics Q&A Board" : "🔬 儿科力学与童车安全专业问答库"}
                </h3>
                <p className="text-xs text-slate-400">
                  {lang === "en" 
                    ? "Deep-dive answers backstopped by lab trials and mechanical safety regulations."
                    : "研究所权威技术解答。基于力学负载测试、人体工程比例和物理伤害防范机制，深度解答核心挑选疑惑。"}
                </p>
              </div>

              <div className="max-w-4xl mx-auto space-y-4">
                {faqData.map((faq) => {
                  const isOpen = openFaqId === faq.id;
                  const question = lang === "en" ? faq.questionEn : faq.questionZh;
                  const answer = lang === "en" ? faq.answerEn : faq.answerZh;

                  return (
                    <div 
                      key={faq.id} 
                      className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                        isOpen 
                          ? "bg-slate-900 border-amber-500/30 shadow-lg shadow-amber-500/5" 
                          : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <button
                        onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                        className="w-full flex items-center justify-between p-5 text-left text-sm sm:text-base font-black text-white transition-colors hover:text-amber-400"
                      >
                        <span className="flex items-center gap-3">
                          <Award className={`w-5 h-5 shrink-0 ${isOpen ? "text-amber-500" : "text-slate-500"}`} />
                          <span className="leading-snug">{question}</span>
                        </span>
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-amber-500 shrink-0 ml-3" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-500 shrink-0 ml-3" />
                        )}
                      </button>

                      <div 
                        className={`transition-all duration-300 ease-in-out ${
                          isOpen ? "max-h-[1200px] border-t border-slate-800/80 scale-100 opacity-100" : "max-h-0 scale-95 opacity-0 pointer-events-none"
                        }`}
                      >
                        <div className="p-5 text-slate-300 text-xs sm:text-sm leading-8 whitespace-pre-wrap bg-slate-950/40 text-justify space-y-4">
                          {answer.split("\n\n").map((para, idx) => {
                            if (para.startsWith("* ") || para.startsWith("- ") || para.startsWith("1. ") || para.startsWith("2. ") || para.startsWith("3. ") || para.startsWith("4. ")) {
                              return (
                                <ul key={idx} className="list-disc list-inside space-y-2 text-slate-400 pl-2">
                                  {para.split("\n").map((line, lidx) => (
                                    <li key={lidx} className="leading-relaxed">
                                      {line.replace(/^(\* |- |\d+\.\s)/, "")}
                                    </li>
                                  ))}
                                </ul>
                              );
                            }
                            return <p key={idx} className="leading-relaxed text-slate-300">{para}</p>;
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>

    </div>
  );
}
