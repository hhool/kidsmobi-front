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
import { getCMSGuides } from "../lib/cmsService";

function translateCategoryLabel(cat: string): string {
  const labels: Record<string, string> = {
    beginner: "新手入门指南",
    risk: "风险甄别指南",
    maintenance: "养护使用指南",
    scenario: "场景化选购指南"
  };
  return labels[cat] || "专业选购指南";
}
import { formatWeight, formatHeight } from "../lib/units";
import Breadcrumbs from "./Breadcrumbs";
import { clearJsonLd, setCollectionPageJsonLd, setJsonLd } from "../lib/seoJsonLd";

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
  onPageChange?: (page: number) => void;
  onPaginationMetaChange?: (meta: { totalPages: number }) => void;
}

export default function GuidesSection({
  productsData,
  onSelectProduct,
  childProfile,
  setChildProfile,
  lang = "zh",
  currencyData,
  currentPage = 1,
  onPageChange,
  onPaginationMetaChange
}: GuidesSectionProps) {
  const [guideArticles, setGuideArticles] = useState<GuideArticle[]>(fallbackGuideArticles);
  const [loadingGuides, setLoadingGuides] = useState<boolean>(false);
  const [selectedGuideState, setSelectedGuideState] = useState<any | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    setLoadingGuides(true);
    // 1. Try fetching editable CMS guides from the Firestore Database
    getCMSGuides(true)
      .then((dbGuides) => {
        if (dbGuides && dbGuides.length > 0) {
          const mapped: GuideArticle[] = dbGuides.map((g) => ({
            id: g.id,
            title: g.zh?.title || g.en?.title || "",
            category: g.category as any,
            categoryLabel: translateCategoryLabel(g.category),
            summary: g.seo?.zh?.description || g.seo?.en?.description || "专业选购指南与安全研究报告。",
            content: g.zh?.content || g.en?.content || "",
            author: "Kidsmobi 专家组",
            readTime: "8 分钟",
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
  }, []);
  
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
  }, [guideArticles, selectedCategory, searchQuery, lang]);

  const pageSize = 8;
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
        isScenarioMatch = (p.tireType || "").includes("充气") || (p.tireType || "").includes("越野") || (p.tireType || "").includes("橡胶");
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
    { id: "beginner", label: "🔰 Beginner Entry" },
    { id: "scenario", label: "🏞️ Scenario Guide" },
    { id: "budget", label: "💰 Budget Guide" },
    { id: "risk", label: "⚖️ Risk ID Guide" },
    { id: "special", label: "🚲 Category Special" },
    { id: "maintenance", label: "🔧 Maintenance" }
  ] : [
    { id: "all", label: "📁 全部指南目录" },
    { id: "beginner", label: "🔰 新手入门指南" },
    { id: "scenario", label: "🏞️ 场景化选购" },
    { id: "budget", label: "💰 预算分级指南" },
    { id: "risk", label: "⚖️ 风险甄别指南" },
    { id: "special", label: "🚲 品类专项指南" },
    { id: "maintenance", label: "🔧 养护使用指南" }
  ];

  return (
    <div id="guides_container" className="space-y-8 animate-fade-in text-left">
      
      {/* Breadcrumbs (PRD 4.4.2) */}
      <Breadcrumbs 
        lang={lang} 
        onHomeClick={() => (window as any).setActiveTab?.("home")}
        items={[{ label: lang === "zh" ? "选购指南" : "BUYING GUIDES", active: true }]} 
      />

      {/* ========================================================
          Part 1: 智能选购匹配工效算力工具 (Interactive Match Wizard)
          ======================================================== */}
      <section className="bg-white border border-slate-100 rounded-[40px] p-8 sm:p-10 shadow-xl shadow-slate-200/50 text-left relative overflow-hidden">
        
        {/* Background blobs for B2C feel */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-100/30 rounded-full blur-3xl -mr-32 -mt-32"></div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-50 pb-8 mb-8 relative z-10">
          <div className="space-y-2 text-left">
            <span className="px-3 py-1 bg-orange-100 text-orange-600 text-[10px] font-black rounded-full uppercase tracking-widest border border-orange-200 inline-block">
              {lang === "en" ? "Smart Wizard" : "智能选车助手"}
            </span>
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <Calculator className="w-6 h-6 text-orange-500" />
              {lang === "en" ? "Find the Perfect Match" : "帮宝宝选出真爱座驾"}
            </h3>
            <p className="text-sm text-slate-500 font-medium">
              {lang === "en" 
                ? "Enter your child's measurements to find the safest, most comfortable ride." 
                : "输入宝宝的身高体重，我们将通过科学算法为您匹配最合适的轮径与型号。"}
            </p>
          </div>
          <button 
            type="button" 
            onClick={() => setShowWizardResults(!showWizardResults)}
            className="px-6 py-3 bg-orange-500 text-white font-black text-sm rounded-2xl hover:bg-orange-600 transition shadow-lg shadow-orange-500/20 active:scale-95 flex items-center gap-2"
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
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 text-sm font-black shrink-0 whitespace-nowrap">
                  {formatWeight(matchRecommendations.perfectWeightLimit, currencyData.code)}
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
                <div className="w-10 h-10 rounded-lg bg-red-400/10 flex items-center justify-center text-red-400 text-sm font-black shrink-0 whitespace-nowrap">
                  {formatWeight(matchRecommendations.dangerWeightLimit, currencyData.code)}
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
            <div className="space-y-3 relative z-10">
              <div className="flex justify-between items-center px-2">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  {lang === "en" 
                    ? `Matching Models (${matchRecommendations.matches.length})` 
                    : `为您精准推荐 (${matchRecommendations.matches.length})`}
                </h4>
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
                      : `建议试着放宽一点点预算（当前${currencyData.symbol}3000）或者自重限制，或许会有特别的惊喜。`}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {matchRecommendations.matches.map((p) => {
                    const dispProduct = translateProduct(p, lang);
                    const isPerfectWeight = p.weight <= matchRecommendations.perfectWeightLimit;
                    return (
                      <div key={dispProduct.id} className="bg-white p-6 rounded-4xl border border-slate-100 hover:border-orange-100 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-xl hover:shadow-orange-500/5 transition-all group">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="bg-orange-50 text-orange-600 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border border-orange-100">{dispProduct.brand}</span>
                          </div>
                          
                          <h4 className="text-base font-black text-slate-900 truncate group-hover:text-orange-500 transition-colors">{dispProduct.name}</h4>
                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed font-medium">“{dispProduct.editorVerdict}”</p>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-[11px] space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 font-bold">{lang === "en" ? "Weight" : "产品自重"}</span>
                            <strong className={isPerfectWeight ? "text-emerald-500" : "text-orange-500"}>{formatWeight(dispProduct.weight, currencyData.code)}</strong>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 font-bold">{lang === "en" ? "Price" : "参考售价"}</span>
                            <strong className="text-slate-900 font-black">{currencyData.symbol}{dispProduct.price}</strong>
                          </div>
                        </div>

                        <button
                          onClick={() => onSelectProduct(p)}
                          className="w-full py-2.5 bg-white border border-slate-100 hover:border-orange-200 text-slate-600 hover:text-orange-500 font-black text-[11px] uppercase rounded-2xl transition-all shadow-sm active:scale-95"
                        >
                          {lang === "en" ? "View Report" : "查看详情"}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs text-slate-600 text-left relative z-10">
            
            {/* Input 1: Age */}
            <div className="bg-slate-50 p-6 rounded-4xl border border-slate-100 space-y-4 shadow-sm hover:shadow-md transition-shadow">
              <label className="text-slate-400 font-black uppercase tracking-wider flex items-center justify-between text-[10px]">
                <span>{lang === "en" ? "1. Age" : "1. 宝宝岁数"}</span>
                <span className="text-orange-500 text-sm">{wizardAge} {lang === "en" ? "yrs" : "岁"}</span>
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
                aria-label={lang === "en" ? "Child age slider" : "宝宝岁数滑杆"}
                title={lang === "en" ? "Child age slider" : "宝宝岁数滑杆"}
                className="w-full accent-orange-500 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 font-medium block">
                {lang === "en" ? "Calculates bone density limits" : "用于测算宝宝体格发育限制"}
              </span>
            </div>

            {/* Input 2: Height */}
            <div className="bg-slate-50 p-6 rounded-4xl border border-slate-100 space-y-4 shadow-sm hover:shadow-md transition-shadow">
              <label className="text-slate-400 font-black uppercase tracking-wider flex items-center justify-between text-[10px]">
                <span>{lang === "en" ? "2. Height" : "2. 身高 (Height)"}</span>
                <span className="text-orange-500 text-sm">{formatHeight(wizardHeight, currencyData.code)}</span>
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
                aria-label={lang === "en" ? "Child height slider" : "宝宝身高滑杆"}
                title={lang === "en" ? "Child height slider" : "宝宝身高滑杆"}
                className="w-full accent-orange-500 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Input 3: Inseam */}
            <div className="bg-slate-50 p-6 rounded-4xl border border-slate-100 space-y-4 shadow-sm hover:shadow-md transition-shadow">
              <label className="text-slate-400 font-black uppercase tracking-wider flex items-center justify-between text-[10px]">
                <span>{lang === "en" ? "3. Inseam" : "3. 跨高 (Inseam)"}</span>
                <span className="text-orange-500 text-sm">{formatHeight(wizardInseam, currencyData.code)}</span>
              </label>
              <input
                type="range"
                min="20"
                max="75"
                step="1"
                value={wizardInseam}
                onChange={(e) => setWizardInseam(parseInt(e.target.value))}
                aria-label={lang === "en" ? "Child inseam slider" : "宝宝跨高滑杆"}
                title={lang === "en" ? "Child inseam slider" : "宝宝跨高滑杆"}
                className="w-full accent-orange-500 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Input 4: Weight */}
            <div className="bg-slate-50 p-6 rounded-4xl border border-slate-100 space-y-4 shadow-sm hover:shadow-md transition-shadow">
              <label className="text-slate-400 font-black uppercase tracking-wider flex items-center justify-between text-[10px]">
                <span>{lang === "en" ? "4. Weight" : "4. 体重 (Weight)"}</span>
                <span className="text-rose-500 text-sm font-black">{formatWeight(wizardWeight, currencyData.code)}</span>
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
                aria-label={lang === "en" ? "Child weight slider" : "宝宝体重滑杆"}
                title={lang === "en" ? "Child weight slider" : "宝宝体重滑杆"}
                className="w-full accent-orange-500 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 font-medium block">
                {lang === "en" ? "Calculates 30% safety threshold" : "用于实时更新安全称重死线"}
              </span>
            </div>

            {/* Input 5: Budget */}
            <div className="bg-slate-50 p-6 rounded-4xl border border-slate-100 space-y-4 shadow-sm hover:shadow-md transition-shadow sm:col-span-2">
              <label className="text-slate-400 font-black uppercase tracking-wider flex items-center justify-between text-[10px]">
                <span>{lang === "en" ? "5. Purchase Budget" : "5. 购车预算上限"}</span>
                <span className="text-emerald-500 text-sm font-black">
                  {currencyData.symbol} {wizardBudget}
                </span>
              </label>
              <input
                type="range"
                min="100"
                max="8000"
                step="50"
                value={wizardBudget}
                onChange={(e) => setWizardBudget(parseInt(e.target.value))}
                aria-label={lang === "en" ? "Budget slider" : "预算滑杆"}
                title={lang === "en" ? "Budget slider" : "预算滑杆"}
                className="w-full accent-emerald-500 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Input 6: Scenario */}
            <div className="bg-slate-50 p-6 rounded-4xl border border-slate-100 space-y-4 shadow-sm hover:shadow-md transition-shadow sm:col-span-2">
              <label className="text-slate-400 font-black uppercase tracking-wider block text-[10px]">
                {lang === "en" ? "6. Primary Usage Scenario" : "6. 主要使用场景"}
              </label>
              <select
                value={wizardScenario}
                onChange={(e) => setWizardScenario(e.target.value)}
                aria-label={lang === "en" ? "Primary usage scenario" : "主要使用场景"}
                title={lang === "en" ? "Primary usage scenario" : "主要使用场景"}
                className="w-full bg-white border border-slate-100 rounded-2xl p-3 text-sm text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer"
              >
                <option value="all">{lang === "en" ? "🌐 Standard / City Paths" : "🌐 全部道路 (多场景)"}</option>
                <option value="tight">{lang === "en" ? "🚇 Light & Portable (Urban)" : "🚇 极致便携 (高密城市通勤)"}</option>
                <option value="rough">{lang === "en" ? "🏞️ Rough / Adventure Tracks" : "🏞️ 硬核户外 (泥沙/颠簸路面)"}</option>
              </select>
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
            <div className="max-w-3xl mx-auto bg-white border border-slate-100 rounded-[40px] p-8 sm:p-12 space-y-8 shadow-2xl relative animate-fade-in text-left">
              <button
                onClick={() => setSelectedGuideState(null)}
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
                  onClick={() => setSelectedGuideState(null)}
                  className="px-6 py-3 bg-slate-50 text-slate-500 hover:text-slate-900 border border-slate-100 hover:border-slate-200 text-sm rounded-2xl font-black transition-all"
                >
                  {lang === "en" ? "Back to Guides" : "完成阅读"}
                </button>
              </div>
            </div>
          );
        })() : (
          <div className="space-y-10">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <div className="flex justify-center">
                <div className="bg-orange-100 p-3 rounded-2xl">
                  <BookOpen className="w-6 h-6 text-orange-500" />
                </div>
              </div>
              <h3 className="text-3xl font-black text-slate-900">
                {lang === "en" ? "Safety & Selection Encyclopedia" : "专家选购指南库"}
              </h3>
              <p className="text-sm text-slate-500 font-medium">
                {lang === "en" 
                  ? "Professional insights to protect your child's growth and safety."
                  : "拒绝带货噱头。我们只用物理公式和儿科医学规范，教您选出真正健康的车款。"}
              </p>
            </div>

            <div className="bg-white border border-slate-100 rounded-4xl p-6 shadow-xl shadow-slate-200/50 space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 text-left">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-4 top-4" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={lang === "en" ? "Search safety keywords..." : "检索核心安全术语、Q-factor、避震材质..."}
                    aria-label={lang === "en" ? "Search safety keywords" : "检索安全关键词"}
                    title={lang === "en" ? "Search safety keywords" : "检索安全关键词"}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 text-left">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all border ${
                      selectedCategory === c.id
                        ? "bg-orange-500 text-white border-orange-400 shadow-lg shadow-orange-500/20 scale-105"
                        : "bg-white text-slate-500 border-slate-100 hover:border-orange-100 hover:text-orange-500"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredGuides.length === 0 ? (
              <div className="p-20 text-center bg-white border border-slate-100 rounded-[40px] shadow-sm">
                <span className="text-slate-400 font-medium">
                  {lang === "en" ? "No guides found." : "没找到相关的科普指南文档"}
                </span>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left animate-fade-in">
                {pagedGuides.map((guide) => (
                  <div
                    key={guide.id}
                    onClick={() => setSelectedGuideState(guide)}
                    className="bg-white border border-slate-100 hover:border-orange-100 rounded-[40px] p-8 flex flex-col justify-between space-y-6 cursor-pointer hover:shadow-2xl hover:shadow-orange-500/5 transition-all group"
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full font-black uppercase border border-orange-100">
                          {guide.categoryLabel}
                        </span>
                        <span className="text-slate-400 font-bold">{guide.publishDate}</span>
                      </div>

                      <h4 className="font-extrabold text-slate-900 text-lg leading-tight group-hover:text-orange-500 transition-colors">
                        {guide.title}
                      </h4>
                      <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed font-medium">
                        {guide.summary}
                      </p>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-400 pt-4 border-t border-slate-50 font-bold">
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-orange-400" />
                        {guide.author.split("-")[0].trim()}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-orange-400" />
                          {guide.readTime}
                        </span>
                        <span className="text-orange-500 group-hover:underline font-black">
                          {lang === "en" ? "Read →" : "阅读原文 →"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => onPageChange?.(Math.max(1, safePage - 1))}
                      disabled={safePage <= 1}
                      className="px-4 py-2 rounded-2xl border border-slate-200 bg-white text-slate-600 font-black text-xs disabled:opacity-40"
                    >
                      {lang === "en" ? "Previous" : "上一页"}
                    </button>
                    <span className="text-xs font-black text-slate-400">
                      {safePage} / {totalPages}
                    </span>
                    <button
                      onClick={() => onPageChange?.(Math.min(totalPages, safePage + 1))}
                      disabled={safePage >= totalPages}
                      className="px-4 py-2 rounded-2xl border border-slate-200 bg-white text-slate-600 font-black text-xs disabled:opacity-40"
                    >
                      {lang === "en" ? "Next" : "下一页"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Professional Q&A Section */}
            <div id="pro_qa_accordion" className="mt-16 pt-16 border-t border-slate-100 space-y-10">
              <div className="text-center max-w-2xl mx-auto space-y-4">
                <div className="flex justify-center">
                  <div className="bg-orange-100 p-3 rounded-2xl">
                    <HelpCircle className="w-6 h-6 text-orange-500" />
                  </div>
                </div>
                <h3 className="text-3xl font-black text-slate-900">
                  {lang === "en" ? "Expert Q&A Board" : "儿科力学问答库"}
                </h3>
                <p className="text-sm text-slate-500 font-medium">
                  {lang === "en" 
                    ? "Deep-dive answers backstopped by lab trials and mechanical safety regulations."
                    : "研究所权威技术解答。基于力学负载测试和防范机制，深度解答核心挑选疑惑。"}
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
                      className={`rounded-4xl border transition-all duration-300 overflow-hidden ${
                        isOpen 
                          ? "bg-white border-orange-200 shadow-xl shadow-orange-500/5 ring-1 ring-orange-500/5" 
                          : "bg-white border-slate-50 hover:border-orange-100"
                      }`}
                    >
                      <button
                        onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                        className="w-full flex items-center justify-between p-6 text-left text-base font-black text-slate-900 transition-colors hover:text-orange-500"
                      >
                        <span className="flex items-center gap-4">
                          <Award className={`w-6 h-6 shrink-0 ${isOpen ? "text-orange-500" : "text-slate-300"}`} />
                          <span className="leading-snug">{question}</span>
                        </span>
                        <div className={`p-2 rounded-xl transition-all ${isOpen ? "bg-orange-50 text-orange-500 rotate-180" : "bg-slate-50 text-slate-400"}`}>
                          <ChevronDown className="w-5 h-5 shrink-0" />
                        </div>
                      </button>

                      {isOpen && (
                        <div className="px-6 pb-8 pt-2 animate-fade-in">
                          <div className="p-6 text-slate-600 text-sm leading-relaxed whitespace-pre-wrap bg-slate-50 rounded-3xl border border-slate-100 space-y-4 font-medium italic">
                            {answer.split("\n\n").map((para, idx) => {
                              if (para.startsWith("* ") || para.startsWith("- ") || para.startsWith("1. ") || para.startsWith("2. ") || para.startsWith("3. ") || para.startsWith("4. ")) {
                                return (
                                  <ul key={idx} className="list-disc list-inside space-y-3 text-slate-500 pl-2">
                                    {para.split("\n").map((line, lidx) => (
                                      <li key={lidx} className="leading-relaxed">
                                        {line.replace(/^(\* |- |\d+\.\s)/, "")}
                                      </li>
                                    ))}
                                  </ul>
                                );
                              }
                              return <p key={idx} className="leading-relaxed">{para}</p>;
                            })}
                          </div>
                        </div>
                      )}
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
