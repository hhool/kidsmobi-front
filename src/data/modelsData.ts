import { Product } from "../types";

export const productsData: Product[] = [
  // ==================== Balance Bikes (平衡车) ====================
  {
    id: "bal_1",
    name: "Woom 1 经典超轻气胎滑步平衡车",
    brand: "Woom (奥地利)",
    category: "balance",
    wheelSize: "12寸",
    weight: 3.0,
    material: "航天级6061铝合金",
    brakeType: "微调短距幼童专用线性手刹(后V刹)",
    tireType: "Schwalbe 越野充气橡胶胎",
    price: 1899,
    ageRange: "1.5 - 3 岁",
    heightRange: [82, 100],
    safetyCertification: ["CPSC (美标)", "EN71 (欧标)", "GB 14746 (国标)"],
    safetyScore: 9.8,
    geometryScore: 9.9,
    weightScore: 10.0,
    overallScore: 9.9,
    pros: [
      "自重仅3.0kg，行业顶级轻量化平衡，极大增强自主爬坡能力",
      "专为幼龄幼儿手掌定制的小握距手刹，刹车受阻行程小于3.2cm",
      "集成式安全限位橡皮保护扣，杜绝龙头死弯过度扭转倾翻"
    ],
    cons: [
      "单价略高，对于仅用一年的过渡期有些昂贵",
      "产品拓展性弱，无法作为两轮带踏板自行车使用"
    ],
    editorVerdict: "Woom 1 是平衡车领域的黄金标准。极佳的骑行几何与极低跨点，能让1.5岁以上的幼童建立无感操控自信。其轻车比控制在3岁幼儿体重的20%左右，安全掌控的皇冠选手。",
    imageUrl: "https://images.unsplash.com/photo-1596417601242-658249673967?auto=format&fit=crop&q=80&w=800",
    galleryUrls: [
      "https://images.unsplash.com/photo-1601362840469-51e4d8d59085?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1582234372722-50d7ccc30ebd?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1594738596001-3e0e18dbcfce?auto=format&fit=crop&q=80&w=800"
    ],
    videoUrl: "https://www.youtube.com/embed/S_8qM8Q77H0"
  },
  {
    id: "bal_2",
    name: "Kokua Jumper 橡胶Elastomer避震平衡车",
    brand: "Kokua (德国)",
    category: "balance",
    wheelSize: "12寸",
    weight: 3.4,
    material: "高强度航空轻质铝",
    brakeType: "重力脚掌滑阻制动 (原厂无手刹扣)",
    tireType: "Apple 宽幅防穿刺超弹越野胎",
    price: 2480,
    ageRange: "2 - 5 岁",
    heightRange: [90, 115],
    safetyCertification: ["EN71 (欧标)"],
    safetyScore: 9.2,
    geometryScore: 9.5,
    weightScore: 9.2,
    overallScore: 9.3,
    pros: [
      "带有后叉弹性避震高分子橡胶(Elastomer)，颠震护脊功能顶级",
      "Schwalbe Big Apple 胖胎低压抓地强，轻松征服碎石野外泥地",
      "大跨度斜管几何，利于孩子全身趴伏冲刺，竞技性十足"
    ],
    cons: [
      "自重3.4kg对较小年龄（如1.5岁）而言提拎时稍显吃重",
      "未配原厂手刹，高速俯冲时必须耗尽孩子的鞋底进行人工摩擦，雨天极易打滑"
    ],
    editorVerdict: "专门为了运动派活泼调皮孩子打造的全地形神器。后轮轴处独特的阻尼避震块是其灵魂，可以有效滤去台阶跌落或盲道过障对儿童骨架椎体的瞬间高频压迫。",
    imageUrl: "https://images.unsplash.com/photo-1596417601138-095904f58c7e?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "bal_3",
    name: "Strider 12 Sport 儿童锦标赛发泡平衡车",
    brand: "Strider (美国)",
    category: "balance",
    wheelSize: "12寸",
    weight: 3.0,
    material: "工程轻量化高碳钢车身",
    brakeType: "后底悬板重力闸片 (无机械拉线手刹)",
    tireType: "EVA免维护发泡实心胎",
    price: 898,
    ageRange: "1.5 - 5 岁",
    heightRange: [80, 110],
    safetyCertification: ["CPSC (美标)", "GB 14746 (国标)"],
    safetyScore: 8.0,
    geometryScore: 8.8,
    weightScore: 9.8,
    overallScore: 8.5,
    pros: [
      "全速快拆座管手扭螺丝，随配长短两根钢装鞍座杆",
      "重力底底板有专门的一体防滑砂贴，单脚离地滑行时站立极稳",
      "竞速用短拖曳前叉，转弯敏捷、避障敏锐度极佳"
    ],
    cons: [
      "发泡EVA塑料胎抓地摩擦系数低（湿滑沥青、商场瓷砖容易打滑）",
      "缺乏气胎的形变微细吸震，颠簸感知会100%硬反馈至幼童双手"
    ],
    editorVerdict: "因风靡全球的Strider杯竞技赛而成为大部分家庭眼中的熟面孔。虽然极其经骑耐磨且无需气筒，但也需关注EVA胎在某些路面（如湿滑沥青、商场瓷砖）的抓地力限制，建议在晴天且平滑干燥的塑胶道使用。",
    imageUrl: "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=800",
    galleryUrls: [
      "https://images.unsplash.com/photo-1510200871549-96de23219fdf?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&q=80&w=800"
    ],
    videoUrl: "https://www.youtube.com/embed/yF8f_m1aGzQ"
  },

  // ==================== Bicycles (儿童自行车) ====================
  {
    id: "bike_1",
    name: "Woom 2 轻量双手刹绿色后防卫自行车 (14寸)",
    brand: "Woom (奥地利)",
    category: "bicycle",
    wheelSize: "14寸",
    weight: 5.0,
    material: "航天级6061铝合金",
    brakeType: "幼童专配微距高线性V刹(右后刹绿色区分)",
    tireType: "Schwalbe 高弹避震越野充气胎",
    price: 3699,
    ageRange: "3 - 5 岁",
    heightRange: [95, 110],
    safetyCertification: ["CPSC (美标)", "EN14765 (欧标)", "GB 14746"],
    safetyScore: 10.0,
    geometryScore: 10.0,
    weightScore: 10.0,
    overallScore: 10.0,
    pros: [
      "整备重量只有5.0kg，极佳的轻量，使力弱的小朋友起步不憋气",
      "后刹车手柄特意用绿色醒目亮光漆标注，提醒宝宝危险时先捏绿色刹",
      "脚踏横距极窄，不偏髋，不代偿发力，骑行身姿笔挺"
    ],
    cons: [
      "市场货源极度紧张，经常因跨境供货限制而面临几个月断货",
      "原厂不设计任何辅助侧轮，贯彻无侧轮直接过渡骑行的理念"
    ],
    editorVerdict: "无庸置疑的14寸童车工业顶峰。它不仅彻底抛弃了不属于现代交通安全的‘倒脚刹’，更为幼儿的小手提供低于40mm间距的微型刹手柄。绿色标志是人类安全工学设计的杰出注脚。",
    imageUrl: "https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&q=80&w=800",
    galleryUrls: [
      "https://images.unsplash.com/photo-1571333250630-f0230c320b6d?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=800"
    ],
    videoUrl: "https://www.youtube.com/embed/S_8qM8Q77H0"
  },
  {
    id: "bike_2",
    name: "Specialized Riprock Coaster 闪电越野宽胎车 (16寸)",
    brand: "Specialized (美国)",
    category: "bicycle",
    wheelSize: "16寸",
    weight: 8.2,
    material: "A1高级加厚铝合金车架",
    brakeType: "前手拉机械V刹 + 后脚踩倒退阻尼链刹",
    tireType: "Rythm Lite 2.3'' 超宽越野防刺气胎",
    price: 1990,
    ageRange: "4 - 6 岁",
    heightRange: [105, 120],
    safetyCertification: ["CPSC (美标)", "GB 14746"],
    safetyScore: 8.2,
    geometryScore: 9.0,
    weightScore: 7.2,
    overallScore: 8.1,
    pros: [
      "2.3in巨无霸越野山地越野充气宽胎，带来极度平稳的侧倾摩擦抗偏",
      "车架管型极为狂野结实，烤漆工艺抗击打抗擦碰极好",
      "车座带有快拆型一架钢结构辅助轮，安装容易不费力"
    ],
    cons: [
      "车重达到了惊人的8.2kg！对于娇小柔弱的儿童体能消耗太快",
      "后轮由于美强制脚踏倒刹设计，宝宝在单车静止起跑时，脚掌倒拨曲柄极难调整位置"
    ],
    editorVerdict: "美国顶级山地车大牌出品，做工与抗摔度都是世界顶尖。2.3英寸的大轮宽让孩子能在泥沙林道里找到冲坡乐趣。但由于法律导致的Coaster倒踩刹锁死以及自重偏高，需要强壮的小车手来驭动。",
    imageUrl: "https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&q=80&w=800"
  },

  // ==================== Scooters (滑板车) ====================
  {
    id: "scoot_1",
    name: "Micro 米高 Mini 三合一重力转向滑板车",
    brand: "m-cro (瑞士)",
    category: "scooter",
    wheelSize: "无",
    weight: 1.9,
    material: "加固型玻璃纤维合成高弹板 + 阳极氧化合金杆",
    brakeType: "后轮不锈钢重力制动踩片",
    tireType: "高弹静音高回弹PU夜光减震轮",
    price: 798,
    ageRange: "1.5 - 5 岁",
    heightRange: [80, 115],
    safetyCertification: ["EN71", "ASTM", "GB 20096"],
    safetyScore: 9.6,
    geometryScore: 9.7,
    weightScore: 9.7,
    overallScore: 9.6,
    pros: [
      "首创瑞士精密重力转向倾斜感应系统，拐弯回弹力矩极其温润",
      "玻璃纤维双层高回弹踏板底座，韧性极佳吸收硬质碎地波纹震",
      "多功能座驾组件：1.5岁矮圆把小鞍座，2岁半升起T把独立滑"
    ],
    cons: [
      "一体式高刚度插死主吊杆，折叠稍微不便，必须按压金属插栓连轴拔出",
      "塑料轮毂中的轴承一旦长期涉水（如带孩子过喷水泉），极易氧化生涩"
    ],
    editorVerdict: "滑板车界当之无愧的皇冠。物理重力倾斜转向机制（Lean-to-Steer）不仅杜绝了低端弹簧滑退车发生的“高速摆动翻车”，更对幼龄儿童小脑动作调谐和肢体配合有非常重要的医疗康复级提升作用。",
    imageUrl: "https://images.unsplash.com/photo-1596417601242-658249673967?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "scoot_2",
    name: "Decathlon 迪卡侬 B1 超轻折叠炫彩色滑板车",
    brand: "Decathlon (法国)",
    category: "scooter",
    wheelSize: "无",
    weight: 2.3,
    material: "热塑树脂/防折钢质内嵌中枢",
    brakeType: "后轴连杆贴片双踩制动刹",
    tireType: "标准高纯度PU发光夜光轮",
    price: 199,
    ageRange: "2 - 5 岁",
    heightRange: [85, 120],
    safetyCertification: ["EN71", "GB 20096"],
    safetyScore: 8.5,
    geometryScore: 8.5,
    weightScore: 9.0,
    overallScore: 8.6,
    pros: [
      "国民良心爆款，199的高单价提供最顶级的欧盟安全硬骨质保证",
      "多色快拆彩色外壳面板可以随时更替，抗脏易水洗",
      "转弯限制偏转盘，防止幼龄惊慌时摆向打死导致整车栽跟头"
    ],
    cons: [
      "轮轴滚珠顺滑阻力略逊于瑞士米高，滑滑两米后衰退略快，较耗腿部发力",
      "发光由于需要磁感铜线，摩擦损耗后偶尔发光亮度有不均匀死灯现象"
    ],
    editorVerdict: "迪卡侬的经典儿童运动成果。极具安全防倾倾斜角，底盘宽窄完全符合2-5岁大骨盆间距。性价比高得无可挑剔，适合周末去公园草坪边缘水泥路的初学者。",
    imageUrl: "https://images.unsplash.com/photo-1594738596001-3e0e18dbcfce?auto=format&fit=crop&q=80&w=800"
  },

  // ==================== Strollers (婴儿推车) ====================
  {
    id: "stroll_1",
    name: "Bugaboo Fox 5 豪华四驱全地形护脊顶配推车",
    brand: "Bugaboo (荷兰)",
    category: "stroller",
    wheelSize: "无",
    weight: 10.4,
    material: "阳极氧化航空铝合金底盘",
    brakeType: "红黄变色双卡连杆单脚中枢刹车",
    tireType: "发泡越野橡胶软层自调节避震巨轮",
    price: 10990,
    ageRange: "0 - 4 岁",
    heightRange: [50, 110],
    safetyCertification: ["EN1888 (欧标顶级)", "ASTMF833", "GB 14748"],
    safetyScore: 9.9,
    geometryScore: 10.0,
    weightScore: 8.0,
    overallScore: 9.3,
    pros: [
      "车桥和四个无内胎充气外胎全部嵌入轻簧高阻阻尼空气避震，吸震率达98%",
      "配置全平躺175度纯无脊受力骨盘硬睡篮，完美抗窒息棉罩保护新生儿天门",
      "独特的防沙重力三角单轴连动设计，在海滩碎砂石以及烂泥地如奶油滑行"
    ],
    cons: [
      "自重高达10.4kg。对于单独一人的宝妈面临无法自如提出二楼阳台的困惑",
      "装载睡篮后整体收折体积庞大，通常需要SUV或者行政座驾宽深后备箱方可平整塞入"
    ],
    editorVerdict: "避震界的重装坦克。在针对1岁以内脆弱婴儿头部与眼底视网膜避震伤害防护上，它的硬底托板与阻尼弹簧结合是无可替代的高墙，当之无愧的奢华中立高分选手。",
    imageUrl: "https://images.unsplash.com/photo-1601362840469-51e4d8d59085?auto=format&fit=crop&q=80&w=800"
  },

  // ==================== Kids Electric Cars (儿童电动车) ====================
  {
    id: "elec_1",
    name: "Peg Perego Polaris Ranger 越野双座12V爬坡电摩",
    brand: "Peg Perego (意大利)",
    category: "electric_car",
    wheelSize: "14寸",
    weight: 15.6,
    material: "高密度工程抗磨塑料外壳/钢管内梁",
    brakeType: "油门踏板电子重力松脚渐进自锁刹车",
    tireType: "加强型抓地粗突橡胶纹充气宽胎",
    price: 6899,
    ageRange: "3 - 8 岁",
    heightRange: [95, 130],
    safetyCertification: ["ASTM F963 (美标电摩安全)", "EN62115 (欧标电能性)"],
    safetyScore: 9.4,
    geometryScore: 9.2,
    weightScore: 6.5,
    overallScore: 8.4,
    pros: [
      "配备智能渐进缓启缓停中枢，起步绝对不会让幼童大脑过度后甩产生眩晕",
      "12V大扭矩双电驱电瓶，爬行坡度能力高达17度，野外草地如履平滑",
      "双安全带卡扣、集成物理高阻护栏以及双人驾控，乘载乐趣首选"
    ],
    cons: [
      "自重达15.6kg。任何小区上楼如果断电会变成地狱级别的沉重死铁",
      "电子自锁系统在彻底断电时若处于下坡，手刹物理连杆稍短，对人工驻车提防不足"
    ],
    editorVerdict: "来自意大利大牌原装，通过最严苛的儿童电学防发热 and 电池阻抗穿刺认证。其起步的重力缓扭曲线极富工效学，有效降低了低端车型‘瞬时加速度过大导致幼童颈部不适’的潜在风险。",
    imageUrl: "https://images.unsplash.com/photo-1596417601138-095904f58c7e?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "elec_2",
    name: "Poynton 智能全地形卡丁竞技电能车",
    brand: "Poynton",
    category: "electric_car",
    wheelSize: "10寸",
    weight: 12.0,
    material: "航空钢加厚防撞管梁 + 车载ABS防滑面板",
    brakeType: "一指微力敏捷双手刹+后轴双重驻油刹",
    tireType: "PU软弹性宽胎(低速不翘轮)",
    price: 2680,
    ageRange: "4 - 8 岁",
    heightRange: [100, 135],
    safetyCertification: ["GB 6675 (中国强制玩具等效等规)"],
    safetyScore: 9.0,
    geometryScore: 9.1,
    weightScore: 7.2,
    overallScore: 8.5,
    pros: [
      "具有遥控级全波段防倾翻限制，家长能通过手机一键强制熄火限流",
      "车体座椅高度、长跨距可延推15cm，适配4岁到8岁全成长阶段",
      "原厂配置防撞高刚抗撕大包围防护栏，意外碰撞时有效抗吸震缓冲"
    ],
    cons: [
      "充电时间过长，满充需耗时8.5小时而只能开滑滑45分钟左右",
      "由于是竞技卡丁造型，离地底盘仅有4.5cm，彻底告别林地碎石"
    ],
    editorVerdict: "卡丁电能界的微型怪兽。非常科学的物理重心布置，即便在5公里极限速度下进行180度漂弯，横向离心翻覆测试表明仍有42%的抗滑翻倾角宽。强烈推荐在私属封闭塑胶道驾驶。",
    imageUrl: ""
  },

  // ==================== Tricycles (儿童三轮车) ====================
  {
    id: "tri_1",
    name: "Doona Liki Trike S5 豪华免工具折叠五合一三轮车",
    brand: "Doona (以色列)",
    category: "tricycle",
    wheelSize: "无",
    weight: 6.7,
    material: "高聚强化纤维碳编粒子聚合物/铝质杆",
    brakeType: "后轮红点物理驻车轮卡刹",
    tireType: "高弹一体实心聚氨酯高舒适胎",
    price: 2480,
    ageRange: "10 个月 - 3 岁",
    heightRange: [75, 100],
    safetyCertification: ["EN71", "ASTM F963", "GB 14746"],
    safetyScore: 9.5,
    geometryScore: 9.6,
    weightScore: 9.0,
    overallScore: 9.4,
    pros: [
      "行业天花板折叠收折体积。一键收拢等同一本A4厚度，完美登机入库",
      "双向重力控杆（Parent Touch System）：家长通过背杆操控前轮倾摆优先阻回力，随时切断宝宝瞎拐龙头",
      "拥有免拆五阶段成长，自婴儿围栏直接蜕化到自主蹬踏式独立三轮"
    ],
    cons: [
      "靠背虽然符合工效学的垂直护腰，但在全平躺倾斜幅度上不及专业推车（仅能斜110度），不宜一岁以下宝宝作长途睡眠",
      "价格足以购买两辆轻合金高安全自行车"
    ],
    editorVerdict: "以色列天才工业成果。其最亮眼的设计在于‘前轮联动离合器手把’，按下离合器后，即使孩子拼命蹬转踏板前轮也不会突然狂飙，完全由家长在后方长推手柄中立控制重力防线。高资产家庭溜娃首选神车。",
    imageUrl: ""
  },

  // ==================== Car Safety Seats (儿童安全座椅) ====================
  {
    id: "seat_1",
    name: "Britax 双向防御 ISOFIX 极致抗扭安全舱 (Advansafix i-Size)",
    brand: "Britax (宝得适)",
    category: "safety_seat",
    wheelSize: "无",
    weight: 12.0,
    material: "加硬合金钢骨架 + 慢弹回太空惰性空气抗拉棉",
    brakeType: "三点物理锁扣搭扣 + ISOFIX 咬死底锁",
    tireType: "无",
    price: 3380,
    ageRange: "9 个月 - 12 岁",
    heightRange: [75, 150],
    safetyCertification: ["ECE R129 (欧盟最新i-Size高标认证)", "GB 27887"],
    safetyScore: 10.0,
    geometryScore: 9.8,
    weightScore: 7.5,
    overallScore: 9.2,
    pros: [
      "通过了最新极其暴力的ECE R129欧盟重力防暴侧撞实测，颈部翻拉重力峰下降低25%",
      "XP-PAD专利加硬胸腔防勒阻阻块、结合SecureGuard腹股安全第四受力点稳定下胯",
      "Pivot Link专利防侧翻抗摆拉钢制连接杆，意外颠翻时瞬间抗沉重向下力阻挠"
    ],
    cons: [
      "自重高达12kg，在多台车之间互搬费力",
      "内部护翼在夏天通风率稍显沉重，对于汗腺极其发达或不耐热小宝宝建议加配独立通风冷感垫"
    ],
    editorVerdict: "汽车安全座椅界的巅峰长城款。通过了侧装重力台车的高频偏侧翻砸毁灭性测试，其采用的超低回弹阻抗PU侧撞块能在事故发生时第一毫秒有效击散吸收暴烈拉拉，给宝宝最铁壁的防御保护。",
    imageUrl: ""
  }
];
