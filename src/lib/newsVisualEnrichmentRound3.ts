/**
 * Round-3 editorial enrichment — five previously zero-impression news details.
 *
 * Same contract as the first four treatments (newsVisualEnrichmentHtml.ts):
 * every figure below is a restatement of a fact ALREADY in that article's own
 * published CMS body. If it is not in the body, it is not here. The dedicated
 * guard scripts/check-news-enrichment.ts asserts each quoted anchor is present
 * in scripts/cms-snapshots/news.json before the build can ship.
 *
 * FREEZE-SAFE: body markup only. No title, description, canonical, og tag or
 * JSON-LD is touched. Rendered by ONE renderer from ONE HTML string, injected
 * into both the prerendered static HTML and the hydrated SPA.
 */
import type { Treatment } from "./newsVisualEnrichmentHtml";

const NEW_BIKES_2026: Record<"en" | "zh", Treatment> = {
  en: {
    eyebrow: "AT A GLANCE",
    title: "Two 2026 launches, and what each one actually changed",
    intro:
      "This roundup covers two launches with public, dated spec sheets. The grid keeps their published numbers together and leaves open the fields the announcements never filled in.",
    blocks: [
      {
        heading: "The published numbers",
        facts: [
          { value: "4.9 lb", label: "Strider 12 Comp, complete (2.2 kg)" },
          { value: "3.2 kg", label: "Micro Ultra, listed weight" },
          { value: "$139.99", label: "12 Comp MSRP" },
          { value: "2017", label: "Strider's previous new model" },
        ],
      },
      {
        heading: "Launch by launch",
        tableHead: ["Model", "Frame / wheels", "Seat range", "Stated age / rider limit"],
        rows: [
          {
            cells: [
              "Strider 12 Comp",
              "Nylon composite; 12-inch EVA foam wheels",
              "11–15 in (27.9–38.1 cm)",
              "1–3 years; max 45 lb (20 kg)",
            ],
          },
          {
            cells: [
              "Micro Ultra LED Neochrome",
              "Magnesium; 12-inch PU foam, puncture-free",
              "33.5–40 cm from the ground",
              "From 18 months; max 50 kg",
            ],
          },
        ],
        note: "The two weights are different measures: 4.9 lb is the complete 12 Comp; the Micro's 3.2 kg is the listed bike weight.",
      },
      {
        heading: "The material ladder in this lineup",
        steps: [
          { title: "Steel", detail: "The 12 Sport, about 6.7 lb — the model the 12 Comp slots under." },
          { title: "Aluminum", detail: "The 12 Pro, about 5.6 lb." },
          { title: "Nylon composite", detail: "The 12 Comp at 4.9 lb — the lightest 12-inch Strider to date." },
          { title: "Magnesium", detail: "The Micro Ultra at 3.2 kg, paired with a low step-through frame." },
        ],
      },
      {
        heading: "Questions this roundup answers",
        questions: [
          {
            q: "Which launch is meant for a younger rider?",
            a: "The 12 Comp is stated at 1–3 years with an inseam of 12–16 in; the Micro is listed from 18 months, with retailers describing a 2–5 year target and a saddle up to 40 cm.",
          },
          {
            q: "What does the 12 Comp's composite frame change?",
            a: "It lowers the complete weight to 4.9 lb and slots under the steel 12 Sport and aluminum 12 Pro at a mid price. The trade-off is a fixed handlebar and a shorter 11–15 in seat range; the article notes no long-term durability data exists yet.",
          },
          {
            q: "What is the dynamo LED feature on the Micro?",
            a: "Dynamo-powered LED wheel rims that light up as the bike rolls — no batteries. The frame is magnesium and the 12-inch PU foam wheels are listed as puncture-free.",
          },
        ],
      },
    ],
    sourceNote:
      "Source: the launch figures published in this article. Weights, seat ranges and prices are manufacturers' or retailers' published numbers; no independent measurement is claimed.",
  },
  zh: {
    eyebrow: "要点速览",
    title: "2026 两款新品，各自改变了什么",
    intro: "本文盘点两款有公开、可查日期规格表的新品。下表把已公布的数字放在一起，公告没有给出的字段照实留空。",
    blocks: [
      {
        heading: "已公布的数字",
        facts: [
          { value: "4.9 磅", label: "12 Comp 整车（2.2 公斤）" },
          { value: "3.2 公斤", label: "Micro Ultra 公布重量" },
          { value: "139.99 美元", label: "12 Comp 建议零售价" },
          { value: "2017 年", label: "Strider 上一款新车" },
        ],
      },
      {
        heading: "逐款对照",
        tableHead: ["车型", "车架 / 车轮", "座高范围", "标称年龄 / 承重上限"],
        rows: [
          {
            cells: [
              "Strider 12 Comp",
              "尼龙复合；12 寸 EVA 发泡轮",
              "11–15 英寸（27.9–38.1 厘米）",
              "1–3 岁；最大 45 磅（20 公斤）",
            ],
          },
          {
            cells: [
              "Micro Ultra LED Neochrome",
              "镁合金；12 寸 PU 发泡，防扎",
              "离地 33.5–40 厘米",
              "18 个月起；最大 50 公斤",
            ],
          },
        ],
        note: "两个重量的口径不同：4.9 磅是 12 Comp 整车，3.2 公斤是 Micro 的公布车重。",
      },
      {
        heading: "这条产品线的材质阶梯",
        steps: [
          { title: "钢架", detail: "12 Sport，约 6.7 磅——12 Comp 就定位在它之下。" },
          { title: "铝架", detail: "12 Pro，约 5.6 磅。" },
          { title: "尼龙复合", detail: "4.9 磅的 12 Comp，Strider 迄今最轻的 12 英寸车。" },
          { title: "镁合金", detail: "3.2 公斤的 Micro Ultra，配低横梁车架。" },
        ],
      },
      {
        heading: "这篇盘点能回答什么",
        questions: [
          {
            q: "哪款面向更小的骑手？",
            a: "12 Comp 标称 1–3 岁、腿长 12–16 英寸；Micro 列明 18 个月起，零售商描述的目标为 2–5 岁，座垫最高 40 厘米。",
          },
          {
            q: "12 Comp 的复合车架改变了什么？",
            a: "整车重量降到 4.9 磅，以中档价格卡在钢架 12 Sport 与铝架 12 Pro 之间。代价是车把固定、座高范围缩短到 11–15 英寸；原文指出长期耐久数据尚不存在。",
          },
          {
            q: "Micro 的花鼓发电 LED 是什么？",
            a: "车轮滚动时点亮的发电 LED 轮圈，不用电池。车架为镁合金，12 寸 PU 发泡轮被列明防扎。",
          },
        ],
      },
    ],
    sourceNote: "来源：本文公布的发布数据。重量、座高与价格均为厂商或零售商公布值，不声称做过同条件测量。",
  },
};

const VOLTAGE_LADDER: Record<"en" | "zh", Treatment> = {
  en: {
    eyebrow: "AT A GLANCE",
    title: "Sixteen listings, four voltage tiers, one publication gap",
    intro:
      "This article counts the electric ride-on catalog rather than inventing an e-bike trend. The panels keep those counts together and mark where the spec sheet stops.",
    blocks: [
      {
        heading: "Listings by stated voltage",
        bars: [
          {
            caption: "Title-stated voltage, out of the 15 of 16 listings that give one",
            max: 8,
            items: [
              { label: "6V", value: 1, display: "1 listing" },
              { label: "12V", value: 8, display: "8 listings" },
              { label: "24V", value: 5, display: "5 listings" },
              { label: "36V", value: 1, display: "1 listing" },
            ],
          },
        ],
        note: "The one listing with no stated voltage is a wiggle car. Counts cover the 16 catalog listings, not the 25 shown on the category page.",
      },
      {
        heading: "What the spec sheet states, and what it does not",
        tableHead: ["Field", "Where the article found it"],
        rows: [
          { cells: ["Top speed", "0 of 16 spec sheets; 1.5, 3.5, 4 and 5-8 MPH are title copy on four listings"] },
          { cells: ["Braking / tire type / motor wattage", "0 of 16 spec sheets each; 400W, 4x100W and twin-35W are title copy"] },
          { cells: ["Parental remote", "11 of 16 titles, but only 3 of 16 spec sheets"] },
          { cells: ["Battery life / weight capacity", "10 and 14 spec sheets; capacity runs 55 lb to 264 lb"] },
        ],
        note: "Titles are retailer copy and change without notice; the article treats a figure as published only when the spec sheet repeats it.",
      },
      {
        heading: "Voltage tiers and the ages they actually state",
        tableHead: ["Tier", "Published detail"],
        rows: [
          { cells: ["6V — one listing", "Three-wheel motorcycle; 36-60 months, 55 lb capacity"] },
          { cells: ["12V — eight listings", "Minimum ages 12-36 months; stated capacity 61-132 lb; six mention a remote"] },
          { cells: ["24V — five listings", "Capacity 65-264 lb; the 264 lb figure is a four-seater; all five mention a remote"] },
          { cells: ["36V — one listing", "Two-seater UTV, 400W motor, 132 lb capacity, 37-120 months"] },
        ],
      },
      {
        heading: "Three checks that transfer",
        steps: [
          { title: "Age floor before voltage", detail: "The 12V tier alone spans minimum ages of 12 to 36 months — the same badge sits on a toddler ride-on and a 132 lb car." },
          { title: "Capacity for rider plus passenger", detail: "Two-seaters state 65-264 lb; the tightest capacity in the category is 55 lb on the 6V motorcycle." },
          { title: "Treat title figures as marketing", detail: "Voltage, speed, motor power and remote presence all appear in titles at rates the spec sheets do not match." },
        ],
      },
    ],
    sourceNote:
      "Source: this site's published electric ride-on catalog, October 2026. Nothing here is measured by us; where a listing does not state a spec, it is reported as not stated.",
  },
  zh: {
    eyebrow: "要点速览",
    title: "16 个车型、四档电压，一处公布落差",
    intro: "本文不臆测行业趋势，而是清点本站电动骑乘目录。下面把清点结果放在一起，并标出规格表到哪里停止。",
    blocks: [
      {
        heading: "按标称电压分组的车型数",
        bars: [
          {
            caption: "标题标了电压的 16 个车型中的 15 个",
            max: 8,
            items: [
              { label: "6V", value: 1, display: "1 个车型" },
              { label: "12V", value: 8, display: "8 个车型" },
              { label: "24V", value: 5, display: "5 个车型" },
              { label: "36V", value: 1, display: "1 个车型" },
            ],
          },
        ],
        note: "唯一没标电压的是一辆扭扭车。统计口径是 16 个车型，不是品类页展示的 25 个产品。",
      },
      {
        heading: "规格表写了什么，没写什么",
        tableHead: ["字段", "原文的发现位置"],
        rows: [
          { cells: ["最高时速", "0/16 个规格表；1.5、3.5、4 与 5-8 MPH 是四个车型标题文案"] },
          { cells: ["制动 / 轮胎类型 / 电机功率", "各 0/16 个规格表；400W、4x100W、双 35W 都是标题文案"] },
          { cells: ["家长遥控", "11/16 个标题提到，但只有 3/16 个规格表写了"] },
          { cells: ["电池寿命 / 承重", "分别为 10 与 14 个规格表；承重从 55 磅到 264 磅"] },
        ],
        note: "标题是零售商文案，会随时变动；原文只在规格表复述时才把数字算作已公布。",
      },
      {
        heading: "各电压档真正标出的年龄",
        tableHead: ["档位", "公布的信息"],
        rows: [
          { cells: ["6V——一个车型", "三轮摩托车；36-60 个月，承重 55 磅"] },
          { cells: ["12V——八个车型", "最低年龄 12-36 个月；承重 61-132 磅；六个提到遥控"] },
          { cells: ["24V——五个车型", "承重 65-264 磅；264 磅属于四座车；五个都提到遥控"] },
          { cells: ["36V——一个车型", "双座 UTV，400W 电机，承重 132 磅，37-120 个月"] },
        ],
      },
      {
        heading: "三项可以带走的核对",
        steps: [
          { title: "先对年龄下限，再对电压", detail: "单是 12V 一档，最低年龄就从 12 个月横跨到 36 个月——同一个电压既贴在幼儿车上，也贴在 132 磅的车上。" },
          { title: "承重要罩住骑手加乘客", detail: "双座车标称 65-264 磅；全品类最紧的标称承重是 6V 摩托车的 55 磅。" },
          { title: "标题数字先当营销看", detail: "电压、速度、电机功率和遥控在标题里出现的频率，与规格表完全对不上。" },
        ],
      },
    ],
    sourceNote: "来源：本站 2026 年 10 月已发布的电动骑乘目录。没有任何一项是我们测量的；Listing 没标的规格，本页就报未标。",
  },
};

const RIDE_ON_STANDARDS: Record<"en" | "zh", Treatment> = {
  en: {
    eyebrow: "AT A GLANCE",
    title: "One new European clause, five new tests, one transition window",
    intro:
      "The 2026 standards update is easy to misread. The panels separate what EN 71-1:2026 actually adds from what stays the same in the United States.",
    blocks: [
      {
        heading: "The numbers in the update",
        facts: [
          { value: "8.21", label: "clause gathering ride-on toys" },
          { value: "5", label: "new tests inside that clause" },
          { value: "10 N·m", label: "stem torque, held for one minute" },
          { value: "31 Jul 2026", label: "national adoption deadline" },
        ],
      },
      {
        heading: "The five new tests",
        tableHead: ["Test", "Published condition"],
        rows: [
          { cells: ["Handlebar end impact", "Each end struck against a hard surface ten times"] },
          { cells: ["Brake performance", "Input forces of 40, 50 and 60 N applied step by step"] },
          { cells: ["Handlebar stem security", "10 N·m torque held for one minute"] },
          { cells: ["Stabilizer strength", "300 N load on each wheel, with deflection and permanent-set limits"] },
          { cells: ["Saddle and seat-post security", "200 N vertical load on the saddle"] },
        ],
      },
      {
        heading: "Europe and the United States, side by side",
        tableHead: ["Market", "What the article says"],
        rows: [
          {
            cells: [
              "European Union",
              "EN 71-1:2026 distributed 28 January 2026, replacing EN 71-1:2014+A1:2018; conflicting national standards withdrawn by 31 July 2027; harmonized status expected roughly twelve months after publication under Directive 2009/48/EC.",
            ],
          },
          {
            cells: [
              "United States",
              "No federal overhaul in 2026. Seat height of 25 inches (63.5 cm) or less is generally a sidewalk bike under 16 CFR 1512; CPSIA lead limits of 90 ppm in paint and 100 ppm in substrate apply; ASTM F963 is mandatory via 16 CFR 1250 since April 2024.",
            ],
          },
        ],
        note: "Until EU harmonized approval, CE marking still runs through the previous edition and its amendments.",
      },
      {
        heading: "Verify a bike in five minutes",
        steps: [
          { title: "Find the tracking label", detail: "Manufacturer, location, date and batch — required on every children's product." },
          { title: "Ask for the certificate", detail: "Children's Product Certificate in the US, Declaration of Conformity in the EU — and check which standard edition it cites." },
          { title: "Check both recall databases", detail: "CPSC in the US and Safety Gate in the EU." },
        ],
      },
    ],
    sourceNote:
      "Source: the standards and dates cited in this article. This is a reading guide, not legal advice; always check the current rule and the bike's own certificate.",
  },
  zh: {
    eyebrow: "要点速览",
    title: "一条欧洲新条款、五项新测试、一个过渡窗口",
    intro: "2026 年的标准更新很容易被误读。下面把 EN 71-1:2026 真正新增的内容，与美国保持不变的规则分开。",
    blocks: [
      {
        heading: "这次更新的关键数字",
        facts: [
          { value: "8.21", label: "汇总乘骑玩具的条款" },
          { value: "5 项", label: "该条款中的新测试" },
          { value: "10 N·m", label: "把立扭矩，保持一分钟" },
          { value: "2026 年 7 月 31 日", label: "各国采纳截止日" },
        ],
      },
      {
        heading: "五项新测试",
        tableHead: ["测试", "公布的条件"],
        rows: [
          { cells: ["把端冲击", "每一端对硬表面撞击十次"] },
          { cells: ["刹车性能", "分步施加 40、50、60 牛的输入力"] },
          { cells: ["把立安全性", "10 N·m 扭矩保持一分钟"] },
          { cells: ["辅轮强度", "每个辅轮承压 300 牛，并有限定形变量"] },
          { cells: ["鞍座与座管安全性", "鞍座承受 200 牛垂直载荷"] },
        ],
      },
      {
        heading: "欧洲与美国，并排看",
        tableHead: ["市场", "原文的说法"],
        rows: [
          {
            cells: [
              "欧盟",
              "EN 71-1:2026 于 2026 年 1 月 28 日分发，替代 EN 71-1:2014+A1:2018；冲突的旧国标最晚 2027 年 7 月 31 日废止；预计发布约十二个月后按 2009/48/EC 指令成为协调标准。",
            ],
          },
          {
            cells: [
              "美国",
              "2026 年联邦规则无大修。座高 25 英寸（63.5 厘米）以内通常按 16 CFR 1512 视为人行道自行车；CPSIA 铅限值为涂层 90 ppm、基材 100 ppm；ASTM F963 自 2024 年 4 月经 16 CFR 1250 强制适用。",
            ],
          },
        ],
        note: "在欧盟协调标准获批之前，CE 标志仍依据旧版及其修订案。",
      },
      {
        heading: "五分钟核查一辆车",
        steps: [
          { title: "找追溯标签", detail: "厂商、地点、日期、批次——所有儿童产品都必须有。" },
          { title: "索要证书", detail: "美国要儿童产品证书（CPC），欧盟要符合性声明，并核对其引用的标准版本。" },
          { title: "查两个召回库", detail: "美国 CPSC 与欧盟 Safety Gate。" },
        ],
      },
    ],
    sourceNote: "来源：本文引用的标准与日期。本页是阅读指引，不是法律意见；请以现行规则和车辆证书为准。",
  },
};

const SCOOTER_BRANDS: Record<"en" | "zh", Treatment> = {
  en: {
    eyebrow: "AT A GLANCE",
    title: "Three tiers of foldable scooter brands, as the article groups them",
    intro:
      "This roundup is a brand map, not a test. The panels keep its tiers, named brands and weight-based buying bands together so the positioning is readable at a glance.",
    blocks: [
      {
        heading: "The shape of the market",
        facts: [
          { value: "3", label: "positioning tiers" },
          { value: "10", label: "brands named across the tiers" },
          { value: "50 km/h", label: "threshold for the performance tier" },
          { value: "3", label: "weight bands in the buying guide" },
        ],
      },
      {
        heading: "Tier by tier",
        tableHead: ["Tier", "Brands named", "Positioning stated"],
        rows: [
          {
            cells: [
              "International leaders",
              "Segway-Ninebot, Xiaomi, NIU",
              "Mass commuting: durability and app integration; cost-to-performance; wide deck, wide tires and battery management",
            ],
          },
          {
            cells: [
              "Western premium",
              "Apollo, Unagi, Gotrax",
              "Design and power: dual motors and suspension; carbon fiber and one-click folding; budget-first models",
            ],
          },
          {
            cells: [
              "High-speed / off-road",
              "Dualtron, Kaabo, Vsett, NAMI",
              "Over 50 km/h, dual motors, off-road suspension — still foldable into a car trunk",
            ],
          },
        ],
        note: "Tier names and positioning are the article's own. No brand is ranked and no scooter is measured here.",
      },
      {
        heading: "The buying bands by weight",
        tableHead: ["Use case", "Weight band", "Examples named"],
        rows: [
          { cells: ["Portability, subway, desk storage", "12–15 kg", "Xiaomi Electric Scooter, Unagi Model One"] },
          { cells: ["Daily commuting, rough roads", "18–24 kg with suspension", "Segway-Ninebot MAX G2, NIU KQi3 Pro"] },
          { cells: ["Steep hills, high speed, long range", "30 kg+ dual-motor", "Apollo City Dual, Kaabo Mantis, Dualtron"] },
        ],
      },
      {
        heading: "How to read this roundup",
        questions: [
          {
            q: "Does a higher tier mean a better scooter?",
            a: "No. The tiers describe positioning — commuting, premium design, high-speed off-road — not a quality ranking. The article names no measured comparison.",
          },
          {
            q: "Which band suits a subway commute?",
            a: "The article points to the portable 12–15 kg band, naming the Xiaomi Electric Scooter and Unagi Model One.",
          },
          {
            q: "What separates the performance tier?",
            a: "Speeds over 50 km/h, dual-motor drives and heavy-duty off-road suspension, with models that still fold for a car trunk: Dualtron, Kaabo, Vsett and NAMI.",
          },
        ],
      },
    ],
    sourceNote:
      "Source: the brand positioning and buying bands stated in this article. Brand claims are reproduced as written; this page adds no ranking, price or measured figure.",
  },
  zh: {
    eyebrow: "要点速览",
    title: "折叠电动滑板车的三个梯队",
    intro: "这是一份品牌地图，不是评测。下面把原文划分的梯队、点名的品牌和按重量给的选购区间放在一起，便于快速读懂定位。",
    blocks: [
      {
        heading: "市场的基本结构",
        facts: [
          { value: "3 个", label: "定位梯队" },
          { value: "10 个", label: "文中点名的品牌" },
          { value: "50km/h", label: "性能档的速度门槛" },
          { value: "3 档", label: "选购建议中的重量区间" },
        ],
      },
      {
        heading: "逐梯队看",
        tableHead: ["梯队", "点名品牌", "原文给出的定位"],
        rows: [
          {
            cells: [
              "国际一线与主导品牌",
              "Segway-Ninebot、Xiaomi、NIU",
              "大众通勤：耐用性与智能互联、性价比、宽踏板宽胎与电池管理",
            ],
          },
          {
            cells: [
              "欧美高端与性能品牌",
              "Apollo、Unagi、Gotrax",
              "设计与动力：双电机与悬挂、碳纤维与一键折叠、平民价位",
            ],
          },
          {
            cells: [
              "极速与越野性能品牌",
              "Dualtron、Kaabo、Vsett、NAMI",
              "50km/h 以上、双电机、越野悬挂，且仍可折进后备箱",
            ],
          },
        ],
        note: "梯队名称与定位均来自原文。本文不对品牌排名，也没有测量任何车型。",
      },
      {
        heading: "按重量划分的选购区间",
        tableHead: ["使用场景", "重量区间", "原文举例"],
        rows: [
          { cells: ["便携、进地铁、办公室放脚下", "12–15 公斤左右", "Xiaomi Electric Scooter、Unagi"] },
          { cells: ["日常通勤、破损路面", "18–24 公斤且带避震", "Segway-Ninebot MAX G2、NIU KQi3 Pro"] },
          { cells: ["爬陡坡、极速与远航程", "30 公斤以上双电机", "Apollo City Dual、Kaabo Mantis、Dualtron"] },
        ],
      },
      {
        heading: "怎么读这份盘点",
        questions: [
          {
            q: "梯队越高代表车越好吗？",
            a: "不是。梯队描述的是定位——通勤、高端设计、极速越野——不是质量排名，原文也没有给出可比的测量结果。",
          },
          {
            q: "进地铁通勤该看哪个区间？",
            a: "原文指向 12–15 公斤的便携档，并点名 Xiaomi Electric Scooter 与 Unagi。",
          },
          {
            q: "性能档的区别是什么？",
            a: "50km/h 以上的速度、双电机驱动和强悍越野悬挂，同时仍可折叠放进后备箱：Dualtron、Kaabo、Vsett 与 NAMI。",
          },
        ],
      },
    ],
    sourceNote: "来源：本文列出的品牌定位与选购建议。品牌说法按原文转述，本页不补充排名、价格或测量结果。",
  },
};

const DIRT_BIKE: Record<"en" | "zh", Treatment> = {
  en: {
    eyebrow: "AT A GLANCE",
    title: "Four off-road-shaped listings, and the five checks to run",
    intro:
      "The catalog has no dirt bike in it. The panels show the four off-road-shaped listings it does publish, the fields it leaves blank, and the checks the article recommends.",
    blocks: [
      {
        heading: "The four off-road-shaped listings",
        tableHead: ["Listing", "Stated power / capacity", "Stated age", "Other stated detail"],
        rows: [
          {
            cells: [
              "6V three-wheel motorcycle",
              "6V; 55 lb capacity",
              "3-5 years",
              "16.8 lb, police decals, reverse, headlights",
            ],
          },
          {
            cells: ["24V Bronco Raptor, two-seater", "24V; 132 lb capacity", "3-8 years", "Licensed; metal and PP plastic"],
          },
          {
            cells: [
              "36V two-seater UTV",
              "36V, 400W; 132 lb capacity",
              "37-120 months",
              "Title states 5-8 MPH and 14-inch EVA wheels",
            ],
          },
          {
            cells: [
              "24V F-150, two-seater",
              "24V, 4x100W; 65 lb capacity",
              "3-8 years",
              "60.6 lb; 122 minutes of stated battery life",
            ],
          },
        ],
        note: "None of the four is a dirt bike; no pedal-assist e-bike appears in the catalog.",
      },
      {
        heading: "The publication gap, counted over 16 listings",
        facts: [
          { value: "4", label: "off-road-shaped listings" },
          { value: "0 of 16", label: "spec sheets stating top speed" },
          { value: "11 of 16", label: "titles mentioning a parental remote" },
          { value: "55–264 lb", label: "range of stated capacities" },
        ],
      },
      {
        heading: "Where a claimed spec actually lives",
        tableHead: ["Field", "What the article counted"],
        rows: [
          { cells: ["Top speed", "0 of 16 spec sheets; 1.5, 3.5, 4 and 5-8 MPH are title copy"] },
          { cells: ["Braking / tire type / motor wattage", "0 of 16 spec sheets each"] },
          { cells: ["Parental remote", "11 of 16 titles, but only 3 of 16 spec sheets"] },
          { cells: ["Battery life / charging time", "10 spec sheets state life; no listing states charging time"] },
        ],
      },
      {
        heading: "Five checks before it goes off-road",
        steps: [
          { title: "Read voltage as a speed class", detail: "Two 12V titles state 1.5 and 3.5 MPH; the 36V UTV states 5-8 MPH. Voltage sets a ceiling, not the shipped limit." },
          { title: "Tires before terrain", detail: "EVA foam cannot puncture; pneumatic tires grip and need air. The only stated tire material in the category is the UTV's EVA, in its title." },
          { title: "Verify the remote as hardware", detail: "Eleven titles mention one; three spec sheets state one. Ask what it controls and its range." },
          { title: "Capacity for rider plus gear", detail: "The off-road cluster states 55-132 lb; the 6V motorcycle's 55 lb is the tightest in the category." },
          { title: "Age floor against your child", detail: "All sixteen state a minimum age; fourteen start at 36 months or later." },
        ],
      },
    ],
    sourceNote:
      "Source: this site's published electric ride-on catalog, October 2026. Nothing here is measured by us; a spec the listing does not state is reported as not stated.",
  },
  zh: {
    eyebrow: "要点速览",
    title: "四款越野造型车型，与五项该做的核对",
    intro: "这个目录里没有越野摩托车。下面列出它真正公布的四款越野造型车型、留空的字段，以及原文建议的核对步骤。",
    blocks: [
      {
        heading: "四款越野造型车型",
        tableHead: ["车型", "公布的功率 / 承重", "标称年龄", "其它公布信息"],
        rows: [
          {
            cells: ["6V 三轮儿童电动摩托车", "6V；承重 55 磅", "3-5 岁", "16.8 磅，警用贴花、倒挡、车灯"],
          },
          { cells: ["24V 双座 Bronco Raptor", "24V；承重 132 磅", "3-8 岁", "授权款；金属与 PP 塑料"] },
          {
            cells: [
              "36V 双座 UTV",
              "36V、400W；承重 132 磅",
              "37-120 个月",
              "标题写 5-8 MPH、14 英寸 EVA 轮",
            ],
          },
          {
            cells: [
              "24V 双座 F-150",
              "24V、4x100W；承重 65 磅",
              "3-8 岁",
              "60.6 磅；标称续航 122 分钟",
            ],
          },
        ],
        note: "四款都不是越野摩托车，目录里也没有踏板助力电动自行车。",
      },
      {
        heading: "按 16 个车型清点的公布落差",
        facts: [
          { value: "4 款", label: "越野造型车型" },
          { value: "0/16", label: "标了最高时速的规格表" },
          { value: "11/16", label: "提到家长遥控的标题" },
          { value: "55–264 磅", label: "标称承重范围" },
        ],
      },
      {
        heading: "被宣称的规格究竟写在哪里",
        tableHead: ["字段", "原文的清点结果"],
        rows: [
          { cells: ["最高时速", "0/16 个规格表；1.5、3.5、4 与 5-8 MPH 是标题文案"] },
          { cells: ["制动 / 轮胎类型 / 电机功率", "各 0/16 个规格表"] },
          { cells: ["家长遥控", "11/16 个标题提到，但只有 3/16 个规格表写了"] },
          { cells: ["电池寿命 / 充电时间", "10 个规格表写了寿命；没有任何车型标充电时间"] },
        ],
      },
      {
        heading: "上非铺装路面前的五项核对",
        steps: [
          { title: "把电压当速度档读", detail: "两辆 12V 标题分别写 1.5 与 3.5 MPH，36V UTV 写 5-8 MPH。电压定的是上限，不告诉你会发什么限速。" },
          { title: "先看轮胎再看地形", detail: "EVA 发泡扎不破；充气胎抓地但要打气。全品类唯一标出的轮胎材质，是 UTV 标题里的 EVA。" },
          { title: "把遥控当硬件核实", detail: "16 个标题里 11 个提到，规格表里只有 3 个写了。问清它控制什么、距离多远。" },
          { title: "承重罩住骑手加装备", detail: "越野簇标称 55-132 磅，其中 6V 摩托车的 55 磅是全品类最紧的。" },
          { title: "最低年龄对照自家孩子", detail: "16 个车型全部标了最低年龄，其中 14 个从 36 个月起。" },
        ],
      },
    ],
    sourceNote: "来源：本站 2026 年 10 月已发布的电动骑乘目录。没有任何一项是我们测量的；Listing 没标的规格，本页就报未标。",
  },
};

export const ROUND3_TREATMENTS: Record<string, Record<"en" | "zh", Treatment>> = {
  "new-balance-bikes-2026": NEW_BIKES_2026,
  "kids-electric-bike-development-trends-2026": VOLTAGE_LADDER,
  "ride-on-safety-standards-2026": RIDE_ON_STANDARDS,
  "foldable-electric-scooter-brands-worldwide": SCOOTER_BRANDS,
  "electric-dirt-bikes-for-kids": DIRT_BIKE,
};
