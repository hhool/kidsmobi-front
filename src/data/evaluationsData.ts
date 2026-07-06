import { Evaluation } from "../types";

export const initialEvaluationsData: Evaluation[] = [
  {
    id: "eval_bal_comp",
    type: "compare",
    productIds: ["bal_1", "bal_2"],
    productId: "bal_1",
    status: "published",
    version: "V1.2",
    scores: {
      safety: 9.6,
      comfort: 9.7,
      portability: 9.5,
      features: 8.8,
      valueForMoney: 8.5
    },
    imageUrl: "https://images.unsplash.com/photo-1596417601242-658249673967?auto=format&fit=crop&q=80&w=800",
    zh: {
      title: "Woom 1 对决 Kokua Jumper：高端滑步平衡车竞技与防护全方位评测",
      verdict: "两款均属平衡车天花板级别。Woom 1 以3.0kg超轻身躯与独步群雄的安全限位、微距手刹，成为1.5-3.5岁幼儿入门不二之选；而 Kokua Jumper 凭借高分子后避震与全地形宽抓地胎，是3-5岁热衷跃台阶、飞坡竞速和户外全地形玩家的绝对运动神器。",
      pros: [
        "Woom 1 整体重量仅3.0kg，对力量薄弱的小婴儿极度友好，利于快速掌握无感控制",
        "Kokua 弹性Elastomer避震器对幼童尾椎与脊柱有着顶级的抗震缓冲性能",
        "Woom 1 标配小握距手刹，刹车反馈点清脆安全，原厂带有可靠龙头转向限位"
      ],
      cons: [
        "Woom 1 单价比普通平衡车贵出数倍，1年半左右的黄金过渡期结束后面临闲置",
        "Kokua Jumper 未配原厂手刹，在高速俯冲或湿滑地面等特定骑行场景中较踩鞋底制动摩擦抗滑力受限"
      ],
      changelog: "2026/06：更新了Kokua Jumper高分子后避震橡胶在极端寒冷天气下的阻尼硬度衰减实测数据。"
    },
    en: {
      title: "Woom 1 vs Kokua Jumper: The Ultimate Luxury Balance Bike Shootout",
      verdict: "Both represent the absolute peak of premium balance bikes. Woom 1 dominates for ages 1.5-3.5 with its ultra-lightweight 3.0kg frame, safety steering limiter, and custom handbrake. Kokua Jumper rules for aggressive riders ages 3-5 who crave trail performance and high-impact rear elastomer suspension.",
      pros: [
        "Woom 1 is incredibly light at 3.0kg, easing control and reducing fatigue for very young toddlers",
        "Kokua features a marvelous rear elastomer suspension block that softens vertical impact on a child's spine",
        "Woom 1 includes custom baby V-brakes and a safety steering ring to prevent sudden knifejack tumbles"
      ],
      cons: [
        "Woom 1 is highly expensive for a vehicle that typically serves a 1.5-year developmental buffer",
        "Kokua Jumper lacks a handbrake out of the box, forcing rely on shoes friction in wet and technical descents"
      ],
      changelog: "June 2026: Updated cold weather elastomer structural compliance metrics."
    },
    updatedAt: new Date()
  },
  {
    id: "eval_scoot_value",
    type: "value",
    productIds: ["scoot_1", "scoot_2"],
    productId: "scoot_1",
    status: "published",
    version: "V1.0",
    scores: {
      safety: 8.8,
      comfort: 8.5,
      portability: 9.0,
      features: 8.2,
      valueForMoney: 9.5
    },
    imageUrl: "https://images.unsplash.com/photo-1572111504021-40afd4f62e35?auto=format&fit=crop&q=80&w=800",
    zh: {
      title: "Micro Maxi 对决 迪卡侬 Play 5：重力转向轮式玩具的性价比博弈",
      verdict: "瑞士 Micro Maxi 拥有行业首屈一指的玻纤强化塑料踏板回弹和出色的无级抗震，但迪卡侬 Play 5 的自带双重避震结合前置微手弯刹，搭配只有前者三分之一售价的价格，在追求长效陪伴与日常小区人行道骑行中展现出不可抵挡的超高物理性价比。",
      pros: [
        "迪卡侬 Play 5 引入了罕有的前轮弹簧避震与物理手刹，为刚步入重力滑行的新生降低学习坡度",
        "Micro 标志性强化玻纤踏板能化解九成柏油路面的沙砾碎震，滑行丝爽顺滑",
        "Micro Maxi 拥有一流的抗老化ABS部件，耐候防水，在多年风吹日晒下保持韧性"
      ],
      cons: [
        "Micro Maxi 价格几乎等于3台迪卡侬，且车把高度在快速成长下可能在5岁以后触顶",
        "迪卡侬 Play 5 实测整车重了接近0.9kg，幼儿提拎上台阶时偶尔略感笨重"
      ],
      changelog: "2026/06：初版发布。涵盖 Micro Maxi Deluxe 与迪卡侬 Play 5 双重物理路面阻力滚阻对比测试。"
    },
    en: {
      title: "Micro Maxi vs Decathlon Play 5: Premium Swisstech vs Utilitarian Value",
      verdict: "Switzerland's Micro Maxi excels in fiberglass resonance absorption and build quality, but Decathlon's Play 5 counters with handbrakes, front dual-spring dampening, and a price tag 70% cheaper, delivering unmatched real-world product utility for price-conscious households.",
      pros: [
        "Decathlon Play 5 offers an auxiliary front brake handle and dual front suspensions for beginner comfort",
        "Micro provides unparalleled road feedback and high-grade PU casting wheels for noiseless gliding",
        "Micro Maxi holds exceptionally strong resale value owing to its premium non-corrosive plastics"
      ],
      cons: [
        "Micro cost easily matches multiple entry competitors with no front frame brake controls included",
        "Decathlon Play 5 carries 0.9kg of supplementary weight making portability slightly less convenient"
      ],
      changelog: "June 2026: First systematic track evaluations and rolling resistance index test."
    },
    updatedAt: new Date()
  },
  {
    id: "eval_stroll_single",
    type: "single",
    productId: "stroll_1",
    status: "published",
    version: "V2.1",
    scores: {
      safety: 9.5,
      comfort: 9.2,
      portability: 9.8,
      features: 9.4,
      valueForMoney: 8.0
    },
    imageUrl: "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&q=80&w=800",
    zh: {
      title: "Bugaboo Butterfly 极速一键重力收车轻便推车深度评测",
      verdict: "这是真正解放双手的高景观重力秒收神车。在同等重量级别（约7.3kg）中做到了极其硬朗的无虚位避震和完全单手展开，完美解决了普通伞车通过性差和软塌塌的脊背支撑问题。",
      pros: [
        "重力秒收放：轻轻双扣一按自然速折，单手抱娃的同时可以用脚或另一只手流畅展开",
        "配备极其高昂的四轮特制弹簧避震与双前叉联动，坑洼、树根路段几乎无感通过",
        "高刚性坐垫支撑：告别普通折叠伞车坐着凹软、损害宝宝娇嫩颈脊骨的发育隐患"
      ],
      cons: [
        "收纳折叠后无法完全独自树立，重力位置变化容易导致遮阳棚与水泥地面摩擦导致划伤",
        "价格定位较高，且各种防雨罩、杯架等配件均需溢价购买"
      ],
      changelog: "2026/05：更新了遮阳罩在海边强紫外线高空紫外爆晒下的褪色速率，及轮滑轴套的海沙侵蚀性能评测数据。"
    },
    en: {
      title: "Bugaboo Butterfly Deep Dive Review: The Gravity-Fold Masterpiece",
      verdict: "Bugaboo Butterfly sets the gold standard for high-end lightweight travel strollers. At 7.3kg, it delivers rigid spinal support and genuine one-second gravity folding, correcting the flimsy posture and poor curbside suspension typical of older cabin aircraft-compatible competitors.",
      pros: [
        "Instant structural lock: Truly hands-off collapsing with one decisive click and a gravity drop",
        "Incredible four-wheel premium independent suspension paired with wear-resistant rubber tyres",
        "Ultra-supportive padded backing helps prevent back sagging and aligns child posture elegantly"
      ],
      cons: [
        "Does not reliably free-stand on all surfaces once folded, occasionally scratching canopy on gravel",
        "Premium baseline cost, with everyday utility items like bumpers and weather shields sold separately"
      ],
      changelog: "May 2026: Added prolonged UV colorfastness tracking metrics and salt-water axle corrosion reports."
    },
    updatedAt: new Date()
  },
  {
    id: "eval_elec_annual",
    type: "ranking",
    productIds: ["elec_1", "elec_2"],
    productId: "elec_2",
    status: "published",
    version: "V1.5",
    scores: {
      safety: 9.2,
      comfort: 9.4,
      portability: 7.0,
      features: 9.9,
      valueForMoney: 8.0
    },
    imageUrl: "https://images.unsplash.com/photo-1531315630201-bb15abeb1653?auto=format&fit=crop&q=80&w=800",
    zh: {
      title: "Mercedes G63 对决 Tesla Cyberquad：儿童大功率电动玩具车终极争霸",
      verdict: "两款均为豪华儿童玩具越野之巅。奔驰 G63 是高仿真、高安全防护的双侧开门式声光电游园经典皮卡车，而特斯拉 Cyberquad 则更像一具真正拥有24V大电芯、空气充气胎、最大能飙至16km/h的硬核金属机甲猛兽皮卡，适合拥有开阔庭院或林道的大动作高手儿童。",
      pros: [
        "Tesla Cyberquad 拥有高刚度全精钢弯管车尾悬架以及独立咬齿碟刹，机械运动性能顶级",
        "奔驰G63 原厂配备专为长辈设计的防走失数传蓝牙无线遥控器，可一键接管强制驻车制动",
        "奔驰G63 极其平缓的起滑机制与四轮环保超弹软质胶胎阻尼，彻底克制了起步惯性眩晕"
      ],
      cons: [
        "Tesla Cyberquad 速度在2档时较快，不适宜不戴全盔、护肘、无大人近身随跑防护的空地游玩",
        "Cyberquad 整备净重高达48kg，一般私家车后备箱完全塞不下，不适合公寓和公共街区"
      ],
      changelog: "2026/06：修订了特斯拉 Cyberquad 电池仓在极端多水涉坑路段涉水作业后的动力总成安全防护评测结论。"
    },
    en: {
      title: "Mercedes G63 vs Tesla Cyberquad: The Heavy-Duty Ride-On Showdown",
      verdict: "Top-tier child ride-ons facing off in luxury styling. Mercedes G63 offers realistic licensed SUV design, soft rubber tires, and strict parent-override remote brakes, while Tesla's Cyberquad is a beastly 24V steel-framed mini ATV capable of climbing real gravel roads at up to 16km/h.",
      pros: [
        "Tesla Cyberquad's sturdy welded-steel frame and rear brake discs deliver top kart athletics",
        "Mercedes G63 provides complete peace of mind through long-range high-frequency wireless safety controls",
        "Mercedes utilizes soft slow-start circuitry to completely eliminate acceleration whiplash vertigo"
      ],
      cons: [
        "Tesla Cyberquad goes quite fast at high speeds; safety helmet, pads, and active parental guidance are mandatory",
        "At 48kg heavy mass, Cyberquad is incredibly difficult to transport and won't fit inside common trunks"
      ],
      changelog: "June 2026: Included structural submersion and IPX4 motor compartment sealing resistance logs."
    },
    updatedAt: new Date()
  },
  {
    id: "eval_safety_tri",
    type: "safety",
    productId: "tri_1",
    status: "published",
    version: "V1.1",
    scores: {
      safety: 9.8,
      comfort: 9.0,
      portability: 9.7,
      features: 9.5,
      valueForMoney: 8.5
    },
    imageUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800",
    zh: {
      title: "Doona Liki Trike S5 婴儿折叠三轮车高刚度重心及倾覆临界安全测试",
      verdict: "Doona Liki 是折叠三轮车界的工程学奇迹。本次专项安全评估重点考察其在多档位调节下的重心横向偏移率与高速下坡倾覆防线，得得益于飞机级高刚铝航空合金车架及三重物理五点式防滑织带，它在30度侧向倾斜试验中依然能够保持令人惊叹的附着稳定性，极大程度杜绝幼童侧翻隐患。",
      pros: [
        "通过欧盟 EN-71 与化学物质 SVHC 严格环保毒物检测，安全织带与扶手泡沫完全可啃咬",
        "创纪录的超小折叠体积下，保留了极其厚重的双盘式咬合前轮一键离合插销，防止卡脚扭伤",
        "采用专利纤维增强聚合物制作的车轮，抗侧翻轴距分布极为合理，大幅优于杂牌仿制品"
      ],
      cons: [
        "作为多阶段折叠车，在第IV阶段全拆卸遛娃模式下由于没有高围栏靠背，无法为2岁以下好动婴儿提供完整环形侧向保护",
        "原装静音避震圈在砂石土路上的摩擦磨损耗损率较高，需常备前叉配件"
      ],
      changelog: "2026/06：更新了第IV阶段越野推行状态下前轮转向锁定阀的机械疲劳摩擦力与打滑角度度量报告。"
    },
    en: {
      title: "Doona Liki Trike S5 Anti-Tip and Lateral Slide Safety Stress Report",
      verdict: "Doona Liki is an absolute engineering marvel in the folding trike category. This safety evaluation focuses on its center of gravity lateral displacement coefficient. Equipped with premium aircraft-grade aluminum components and a secure 5-point webbing system, it retained strong anti-slide properties even during 30-degree tilt limit experiments, successfully preventing tipping accidents.",
      pros: [
        "Fully Compliant with EU EN-71 chemical and toy safety protocols, using completely toxin-free plastics",
        "Keeps a very tidy hand-operable layout with dual front-wheel clutch buttons to completely avoid foot jamming",
        "Woven-fiber reinforced high density polymer wheels deliver dynamic traction and strong slip resistance"
      ],
      cons: [
        "In Stage IV (full freedom trike configuration), the lower backrest offers minimal ribside fencing for restless toddlers",
        "Quiet-ride rubberized wheel bands wear out faster on coarse rural pebbles, requiring routine cleaning and maintenance"
      ],
      changelog: "June 2026: Included dynamic tipping tests and component fatigue threshold metrics."
    },
    updatedAt: new Date()
  },
  {
    id: "eval_durability_bike",
    type: "safety",
    productId: "bike_2",
    status: "published",
    version: "V1.0",
    scores: {
      safety: 9.7,
      comfort: 9.2,
      portability: 8.0,
      features: 8.8,
      valueForMoney: 9.0
    },
    imageUrl: "https://images.unsplash.com/photo-1541625602330-2277a4c46182?auto=format&fit=crop&q=80&w=800",
    zh: {
      title: "Specialized Riprock 12 高强度金属耐久及抗撞击抗暴力服役深度评测",
      verdict: "闪电 Riprock 堪称儿童自行车里的坦克级硬汉。在经过长达100小时的液压疲劳振动、高空抛掷车架、传动链条盐雾抗锈蚀以及轴承泥沙浸润测试后，此车依旧保持了极低形变与完美顺畅的传动反馈。专为乱扔童车、野外重度折腾的运动系「破坏王」小车手贴身量制。",
      pros: [
        "采用 Premium A1 级别管壁加厚航空铝材车架，液压一体成型，正面抗撞击强度是非标准焊缝车架的2.4倍",
        "链条全包裹防沙罩即使在沙滩暴晒、水洼洗礼后依旧不会卡齿跳链，机械动力流失极低",
        "宽大抓地胎和超大密封轴承能彻底抵挡重细尘沙侵蚀，无需频繁频繁上油维保"
      ],
      cons: [
        "为了极致抗暴力车身刚度，全车车圈及齿盘用料十分扎买，导致总整备重量略高于同尺寸轻量竞赛碳纤平衡车",
        "辅助轮一字金属支撑臂在承载过重体重侧滑时，存在轻微弹性弯折偏斜趋势"
      ],
      changelog: "2026/06：初版发布。增加了在1.2米自由落体撞击地缘测试中后变速爪和轮毂防震扭矩变形的激光测量参数。"
    },
    en: {
      title: "Specialized Riprock 12 Dynamic Durability and High-Impact Fatigue Report",
      verdict: "Specialized Riprock behaves like an invincible armor on junior tracks. Through 100 hours of continuous hydraulic vibration, salt spray anti-rust trials, and beach coarse-sand testing, the frame exhibited zero structural strain and maintained crisp performance. Perfect for sporty, energetic young riders who push gears to the absolute limit.",
      pros: [
        "Handcrafted with thickened Premium A1 alloy, achieving head-on crash survivability 2.4x higher than standard tubing",
        "Fully enclosed durable chain cover stays grit-free and slip-proof even after heavy mud and puddle splashing",
        "Oversized dirt-sealed ball bearings retain smooth hub momentum with minimal lubrication cycles required"
      ],
      cons: [
        "Structural rigidity adds noticeable density, making it heavier than race-specific carbon balance bikes",
        "Heavy-duty steel support rods of training wheels can distort slightly under excessive lateral slide drag forces"
      ],
      changelog: "June 2026: First publication covering metal distortion and wheel drop impact ratios."
    },
    updatedAt: new Date()
  },
  {
    id: "eval_ergonomics_seat",
    type: "single",
    productId: "seat_1",
    status: "published",
    version: "V1.3",
    scores: {
      safety: 9.9,
      comfort: 9.9,
      portability: 6.5,
      features: 9.5,
      valueForMoney: 8.5
    },
    imageUrl: "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&q=80&w=800",
    zh: {
      title: "Britax Romer Dualfix i-Size 新生儿儿童安全座椅医学工效与脊骨深度护托测试",
      verdict: "宝得适双面骑士是医学级婴幼儿护脊座椅领域的殿堂代表。其标志性 360 度顺滑旋转轴承中嵌入了针对新生儿娇软脊骨研发的 Ergo-Insert 人体工学内衬夹，在最大倾斜躺角状态下，经由电子模拟脊柱传感器测算，能使头颈负荷平缓消解至极限安全线以内，完美守护头颈和稚嫩胸臀骨骼发育。",
      pros: [
        "专利 SICT inside 隐藏侧向防撞吸能模块极大消除外展侧翻瞬时冲击力，工效学受力传压极佳",
        "Ergo-Padding 超软竹纤维亲肤透气垫具有极佳 of premium 吸湿吸汗性能，避免闷热导致的背部湿疹或乘坐烦躁",
        "可多档调校的防回弹底座能充分吻合不同豪华家用车的倾斜角度，提供顶级的脊背服帖承托"
      ],
      cons: [
        "因为底盘装载了沉重的防撞钢梁结构和360度不锈钢大齿盘，整机净重接近 15kg，移动跨车搬运极不省力",
        "顶棚软性折叠防晒罩在收合时两侧松紧带容易产生阻尼摩擦卡扣，需要稍微用力理顺"
      ],
      changelog: "2026/06：更新了模拟四个月低龄婴儿在145度极限舒躺挡位下，长途乘车4小时对血氧含氧量变化和颈椎曲度的评估。"
    },
    en: {
      title: "Britax Romer Dualfix i-Size Medical Ergonomics and Pediatric Spine Support Review",
      verdict: "Britax Dualfix stands at the medical-grade pinnacle of spinal development support. In co-development with premium therapists, its 360-degree swing chassis features a customized Ergo-Insert cradle. Continuous high-precision spine sensors show that even at sleep angles, head-neck impact pressures are evenly dispersed to safe zones, avoiding back hunches.",
      pros: [
        "SICT Inside integrated steel winglets absorb intense side forces, creating a balanced shell pressure gradient",
        "Bamboo-fiber Ergo-Padding channels hot air away continuously, avoiding skin friction and heat irritation",
        "Adjustable anti-rebound bar meshes safely against back car bench seats, optimizing real leg clearance"
      ],
      cons: [
        "Enclosing premium thick cast-iron roll cages, this high-mass seat is extremely heavy at almost 15kg",
        "Elastic tension seams on the shade canopy can bind against the swivel pivot during tight retraction"
      ],
      changelog: "June 2026: Updated long-haul oxygen saturation compatibility log and seat cushion angle adjustments."
    },
    updatedAt: new Date()
  }
];
