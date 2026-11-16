/**
 * HTML renderer for the editorial enrichment blocks on the two thinnest news
 * articles. Pure string output — no JSX — so scripts/prerender-pages.ts (tsx,
 * no React) and the hydrated SPA can use the EXACT same markup.
 *
 * Every number in the copy below is copied from that article's CMS body. Do
 * not add figures, dates or standards that the article does not state.
 */
const esc = (value: string): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

interface Fact {
  value: string;
  label: string;
}
interface Row {
  cells: string[];
}
/** A wheel-size band drawn on an 18–24 in scale (all values from CMS body). */
interface RangeItem {
  label: string;
  start: number;
  end: number;
}
/** A labelled bar on a 0..max axis; `display` is the CMS-quoted value text. */
interface BarItem {
  label: string;
  value: number;
  display: string;
}
interface BarSeries {
  caption: string;
  max: number;
  items: BarItem[];
}
interface Question {
  q: string;
  a: string;
}
interface Block {
  heading: string;
  facts?: Fact[];
  tableHead?: string[];
  rows?: Row[];
  steps?: { title: string; detail: string }[];
  ranges?: RangeItem[];
  bars?: BarSeries[];
  questions?: Question[];
  note?: string;
}

interface Treatment {
  eyebrow: string;
  title: string;
  intro: string;
  blocks: Block[];
  sourceNote: string;
}

const STRIDER_KELLYS: Record<"en" | "zh", Treatment> = {
  en: {
    eyebrow: "AT A GLANCE",
    title: "The three Kellys models, in one grid",
    intro:
      "Strider's announcement names three children's bike models and their published wheel sizes. Everything below is stated in the announcement itself — the spec fields it leaves open are shown as open, not filled in.",
    blocks: [
      {
        heading: "What the announcement states",
        facts: [
          { value: "3", label: "Kellys models named" },
          { value: "18–24 in", label: "wheel sizes across the range" },
          { value: "7-speed", label: "drivetrain on one model" },
          { value: "1991", label: "Kellys founded in Slovakia" },
        ],
      },
      {
        heading: "Model-by-model grid",
        tableHead: ["Model", "Wheel sizes", "Drivetrain / brake detail", "Other specs"],
        rows: [
          { cells: ["NAGA Air Belt", "18 in, 20 in", "Not stated", "Not stated"] },
          { cells: ["NAGA Air 50", "20 in, 24 in", "7-speed", "Not stated"] },
          { cells: ["NAGA Air 70 Disc", "20 in, 24 in", "Disc (name only)", "Not stated"] },
        ],
        note: "A model name is not a spec sheet: only the Air 50's 7-speed drivetrain and the wheel sizes are stated in the source.",
      },
      {
        heading: "Wheel-size coverage",
        ranges: [
          { label: "NAGA Air Belt", start: 18, end: 20 },
          { label: "NAGA Air 50", start: 20, end: 24 },
          { label: "NAGA Air 70 Disc", start: 20, end: 24 },
        ],
        note: "Bars show published wheel sizes only — 18 in at the left, 24 in at the right. No age or rider-height band was published.",
      },
      {
        heading: "How the range is described",
        steps: [
          {
            title: "Exclusive US retailer",
            detail:
              "Strider is the exclusive authorized retailer for Kellys children's bikes in the United States.",
          },
          {
            title: "No wholesaling",
            detail:
              "A Strider spokesperson told BRAIN that Strider will not wholesale Kellys models.",
          },
          {
            title: "Brand fit claim",
            detail:
              "CEO Ryan McFarland describes the line as lightweight, dependable, low-maintenance, with kid-specific components.",
          },
        ],
      },
      {
        heading: "Questions this announcement answers",
        questions: [
          {
            q: "Which Kellys model fits an 18-inch rider?",
            a: "The NAGA Air Belt — the only model the announcement lists at 18 inches. It is also offered at 20 inches.",
          },
          {
            q: "Which model has gears?",
            a: "The NAGA Air 50, described in the announcement with a 7-speed drivetrain and 20-inch and 24-inch wheels.",
          },
          {
            q: "Will other US shops stock these bikes?",
            a: "Not through wholesale: a Strider spokesperson said Strider will not be wholesaling Kellys models.",
          },
        ],
      },
    ],
    sourceNote:
      "Source: the Strider / Kellys announcement reproduced in this article. No price, weight or geometry figures were published in it, so none are added here.",
  },
  zh: {
    eyebrow: "要点速览",
    title: "三款 Kellys 儿童自行车，一表看清",
    intro:
      "Strider 的公告公布了三款儿童自行车型号及其轮径。下表全部来自公告本身；公告没有给出的规格，一律留空标注，不做补齐。",
    blocks: [
      {
        heading: "公告明确写出的事实",
        facts: [
          { value: "3 款", label: "公布的 Kellys 型号" },
          { value: "18–24 英寸", label: "全系轮径范围" },
          { value: "7 速", label: "其中一款的变速系统" },
          { value: "1991 年", label: "Kellys 在斯洛伐克创立" },
        ],
      },
      {
        heading: "逐款对照表",
        tableHead: ["型号", "轮径", "传动 / 刹车信息", "其它规格"],
        rows: [
          { cells: ["NAGA Air Belt", "18、20 英寸", "未公布", "未公布"] },
          { cells: ["NAGA Air 50", "20、24 英寸", "7 速", "未公布"] },
          { cells: ["NAGA Air 70 Disc", "20、24 英寸", "碟刹（仅型号名）", "未公布"] },
        ],
        note: "型号名不等于规格表：原文只明确给出 Air 50 的 7 速变速与各款轮径。",
      },
      {
        heading: "轮径覆盖范围",
        ranges: [
          { label: "NAGA Air Belt", start: 18, end: 20 },
          { label: "NAGA Air 50", start: 20, end: 24 },
          { label: "NAGA Air 70 Disc", start: 20, end: 24 },
        ],
        note: "色带只表示原文公布的轮径：左端 18 英寸，右端 24 英寸。原文没有公布年龄或身高区间。",
      },
      {
        heading: "这次合作的三个要点",
        steps: [
          {
            title: "美国独家授权零售商",
            detail: "Strider 现在是 Kellys 儿童自行车在美国的独家授权零售商。",
          },
          {
            title: "不做批发",
            detail: "Strider 发言人告诉《BRAIN》，Strider 不会批发 Kellys 的车型。",
          },
          {
            title: "品牌方的适配说法",
            detail:
              "创始人兼首席执行官 Ryan McFarland 称其轻便、可靠、易维护，并配备专为儿童设计的部件。",
          },
        ],
      },
      {
        heading: "公告回答了哪些问题",
        questions: [
          {
            q: "18 英寸轮径是哪一款？",
            a: "NAGA Air Belt——公告中唯一列出 18 英寸的型号，同时也提供 20 英寸版本。",
          },
          {
            q: "哪一款带变速？",
            a: "NAGA Air 50，公告写明 7 速变速系统，提供 20 英寸和 24 英寸两种轮径。",
          },
          {
            q: "美国其他门店会进货吗？",
            a: "不走批发渠道：Strider 发言人表示不会批发 Kellys 的车型。",
          },
        ],
      },
    ],
    sourceNote:
      "来源：本文转载的 Strider / Kellys 公告。原文未公布价格、重量或车架几何数据，因此此处也不补充。",
  },
};

const SAFETY_SEATS: Record<"en" | "zh", Treatment> = {
  en: {
    eyebrow: "AT A GLANCE",
    title: "Three stages, and the two mistakes to avoid",
    intro:
      "This article gives one set of mortality estimates, three seat groups and two installation errors. The panels below restate them in the order a parent actually uses: pick the stage, then fit it correctly.",
    blocks: [
      {
        heading: "The published numbers",
        facts: [
          { value: "> 70%", label: "infant mortality reduction with correct use (NHTSA)" },
          { value: "> 50%", label: "toddler mortality reduction with correct use (NHTSA)" },
          { value: "3", label: "seat groups described" },
          { value: "2–3 cm", label: "maximum movement at the fitting" },
        ],
      },
      {
        heading: "Stage ladder",
        steps: [
          {
            title: "Rear-facing infant seat — newborn to about 15 months",
            detail:
              "Rear-facing disperses impact forces across an infant's neck and head.",
          },
          {
            title: "Convertible seat — toddlers to 4 years and older",
            detail:
              "Keep the child rear-facing as long as possible, until the seat's limit is exceeded.",
          },
          {
            title: "High-back booster — ages 4 to 12",
            detail:
              "Only once the height requirement is met, so the belt crosses the shoulder and pelvis.",
          },
        ],
      },
      {
        heading: "The two mistakes named in the article",
        tableHead: ["Mistake", "What the article says"],
        rows: [
          {
            cells: [
              "Holding the child in the back seat",
              "A parent's arms cannot withstand crash forces; the child can be thrown.",
            ],
          },
          {
            cells: [
              "Loose fitting or loose harness",
              "Secure with ISOFIX or the seatbelt; movement must not exceed 2–3 cm.",
            ],
          },
        ],
      },
      {
        heading: "Questions parents actually ask",
        questions: [
          {
            q: "How long should a child stay rear-facing?",
            a: "The article's rule: keep the child rear-facing as long as possible, until they exceed the seat's limit. Its convertible group covers toddlers to 4 years and older.",
          },
          {
            q: "How tight is tight enough?",
            a: "Secure the seat with ISOFIX or the seatbelt, with no more than 2–3 cm of movement.",
          },
          {
            q: "When is a booster seat appropriate?",
            a: "Ages 4 to 12, and only once the height requirement is met so the belt crosses the shoulder and pelvis.",
          },
        ],
      },
    ],
    sourceNote:
      "Source: the child-safety-seat guidance in this article, including its cited NHTSA estimates. Age bands are the article's own groupings — always check the seat's label and local rules.",
  },
  zh: {
    eyebrow: "要点速览",
    title: "三个阶段，两个必须避开的错误",
    intro:
      "原文给出了一组死亡率数据、三类座椅和两个安装误区。下面按家长的实际使用顺序重排：先选阶段，再把安装做对。",
    blocks: [
      {
        heading: "原文中的数字",
        facts: [
          { value: "> 70%", label: "正确使用时婴儿死亡率降幅（NHTSA）" },
          { value: "> 50%", label: "正确使用时幼儿死亡率降幅（NHTSA）" },
          { value: "3 类", label: "文中提到的座椅分组" },
          { value: "2–3 厘米", label: "安装时允许的最大晃动" },
        ],
      },
      {
        heading: "阶段阶梯",
        steps: [
          {
            title: "婴儿提篮式（反向）— 新生儿至约 15 个月",
            detail: "反向安装能最有效地分散撞击时对婴儿颈椎和头部的冲击。",
          },
          {
            title: "成长型座椅 — 幼儿至 4 岁或更大",
            detail: "尽量让孩子保持反向乘坐，直到超出座椅的反向限值。",
          },
          {
            title: "增高垫配合安全带 — 4 至 12 岁",
            detail: "需先达到身高要求，让安全带正确跨过肩膀与骨盆。",
          },
        ],
      },
      {
        heading: "原文点名的两个误区",
        tableHead: ["误区", "原文说明"],
        rows: [
          {
            cells: [
              "抱着孩子坐在后排",
              "事故发生瞬间家长的手臂无法承受冲击力，孩子极易飞出。",
            ],
          },
          {
            cells: [
              "只装不固定或安全带过松",
              "必须使用 ISOFIX 接口或安全带固定牢固，晃动不超过 3 厘米。",
            ],
          },
        ],
      },
      {
        heading: "家长最常问的三个问题",
        questions: [
          {
            q: "反向安装要坐到什么时候？",
            a: "原文的原则是尽量保持反向乘坐，直到超出座椅限值；成长型座椅覆盖幼儿至 4 岁或更大。",
          },
          {
            q: "装到多紧才算合格？",
            a: "必须使用 ISOFIX 接口或安全带固定，晃动幅度不超过 2–3 厘米。",
          },
          {
            q: "什么时候可以用增高垫？",
            a: "4 岁至 12 岁，并且达到身高要求，让安全带正确跨过肩膀与骨盆。",
          },
        ],
      },
    ],
    sourceNote:
      "来源：本文的儿童安全座椅说明及其引用的 NHTSA 数据。年龄分组为原文口径，实际请核对座椅标签与当地规定。",
  },
};

const BRAND_NEWS: Record<"en" | "zh", Treatment> = {
  en: {
    eyebrow: "AT A GLANCE",
    title: "Four 2026 brand moves, one comparison grid",
    intro:
      "This roundup reports four launches and the material choice behind each. The grid keeps the published figures together and marks the fields the announcements leave open.",
    blocks: [
      {
        heading: "The published numbers",
        facts: [
          { value: "$139.99", label: "12 Comp list price" },
          { value: "4.9 lb", label: "12 Comp, complete" },
          { value: "3.2 kg", label: "Micro magnesium frame, approximate" },
          { value: "3 kg", label: "woom GO 1 frame" },
        ],
      },
      {
        heading: "What each brand changed",
        tableHead: ["Brand / model", "Published move", "Buyer-relevant detail"],
        rows: [
          {
            cells: [
              "Strider 12 Comp",
              "First new model since 2017",
              "Nylon composite, 4.9 lb complete, fixed handlebar, shorter seat range",
            ],
          },
          {
            cells: [
              "Micro Balance Bike Ultra LED Neochrome",
              "Listed as new for 2026",
              "Dynamo LED rims, no batteries; magnesium frame about 3.2 kg, low step-through",
            ],
          },
          {
            cells: [
              "woom GO 1",
              "Neon lime and neon pink limited editions",
              "Aluminum, 3 kg, 12-inch wheels, roughly 1.5 to 3.5 years, 82–100 cm",
            ],
          },
          {
            cells: [
              "woom EXPLORE e",
              "Global launch in March",
              "Pedal-assist e-bike for ages 7–14 with a MAHLE drive — not a balance bike",
            ],
          },
        ],
        note: "The launches are not a like-for-like comparison: some figures describe a complete bike, others a frame only.",
      },
      {
        heading: "Age-led searches, mapped to published facts",
        tableHead: ["What shoppers search", "What this article publishes", "What it does not"],
        rows: [
          {
            cells: ["Balance bike for a 2 year old", "12-inch class: Strider 12 Comp and woom GO 1", "No rider-height band for the 12 Comp"],
          },
          {
            cells: ["Best balance bike for a 3 year old", "woom GO 1: 12-inch, 82–100 cm, roughly 1.5 to 3.5 years", "No ranking of the four launches"],
          },
          {
            cells: ["Stable track balance bike", "Wheel size, step-through and weight are published for three of the four", "No stability score or measured result"],
          },
        ],
        note: "Search phrases are reported as observed demand, not as product claims by any brand in this article.",
      },
      {
        heading: "The frame-material shift, in order",
        steps: [
          { title: "Steel", detail: "The 12 Sport — the model the 12 Comp slots under." },
          { title: "Aluminum", detail: "The 12 Pro and the woom GO 1 at 3 kg." },
          { title: "Nylon composite", detail: "The 12 Comp at 4.9 lb, the lightest 12-inch Strider to date." },
          { title: "Magnesium", detail: "The Micro at about 3.2 kg, paired with a low step-through frame." },
        ],
      },
      {
        heading: "Questions this roundup answers",
        questions: [
          {
            q: "Which 2026 launch is the lightest?",
            a: "The published figures are not like-for-like: 4.9 lb is the Strider's complete weight, while 3 kg and about 3.2 kg describe the woom and Micro frames. This article gives no comparable complete-weight table.",
          },
          {
            q: "Do limited editions change the woom GO 1?",
            a: "No. Neon lime and neon pink are color options; the specs stay the same, but current-season stock rotates quickly.",
          },
          {
            q: "Which launch states an age range?",
            a: "The woom GO 1 — roughly 1.5 to 3.5 years with an 82–100 cm rider height. The Strider 12 Comp's announcement gives no rider-height band.",
          },
        ],
      },
    ],
    sourceNote:
      "Source: the launch reports reproduced in this article. Prices, weights and dimensions are the manufacturers' published figures; no measured comparison is claimed.",
  },
  zh: {
    eyebrow: "要点速览",
    title: "2026 年四次品牌动作，一表看清",
    intro: "本文报道四次新品发布，以及各自的车架材质选择。下表把已公布的数字放在一起，没有公布的字段照实标注。",
    blocks: [
      {
        heading: "已公布的数字",
        facts: [
          { value: "139.99 美元", label: "12 Comp 标价" },
          { value: "4.9 磅", label: "12 Comp 整车重量" },
          { value: "3.2 公斤", label: "Micro 镁合金车架，约数" },
          { value: "3 公斤", label: "woom GO 1 车架" },
        ],
      },
      {
        heading: "各品牌改变了什么",
        tableHead: ["品牌 / 车型", "公布的动作", "与买家相关的细节"],
        rows: [
          {
            cells: ["Strider 12 Comp", "2017 年以来首款新车", "尼龙复合车架、整车 4.9 磅、车把固定、座高范围更短"],
          },
          {
            cells: ["Micro Balance Bike Ultra LED Neochrome", "被零售商列为 2026 年新款", "花鼓发电 LED 轮圈、不用电池；镁合金车架约 3.2 公斤、低横梁"],
          },
          {
            cells: ["woom GO 1", "荧光青绿与荧光粉限量配色", "铝架、3 公斤、12 英寸轮，约 1.5 至 3.5 岁、82–100 厘米"],
          },
          {
            cells: ["woom EXPLORE e", "3 月全球发布", "面向 7 至 14 岁的电助力脚踏车，配 MAHLE 驱动——不是平衡车"],
          },
        ],
        note: "这几次发布并非同条件比较：部分数字是整车重量，另一些只描述车架。",
      },
      {
        heading: "年龄热词对应到哪些已公布事实",
        tableHead: ["搜索表述", "本文公布的信息", "本文没有的信息"],
        rows: [
          {
            cells: ["两岁平衡车", "12 英寸级别：Strider 12 Comp 与 woom GO 1", "12 Comp 没有公布骑手身高区间"],
          },
          {
            cells: ["三岁最佳平衡车", "woom GO 1：12 英寸、82–100 厘米、约 1.5 至 3.5 岁", "没有对四款发布做排名"],
          },
          {
            cells: ["强调骑行稳定的平衡车", "四款中有三款公布了轮径、跨步设计与重量", "没有稳定性评分或测量结果"],
          },
        ],
        note: "搜索表述只作为被观察到的需求列出，不代表文中任何品牌的产品宣称。",
      },
      {
        heading: "车架材质的变化顺序",
        steps: [
          { title: "钢架", detail: "12 Sport——12 Comp 就定位在它之下。" },
          { title: "铝架", detail: "12 Pro，以及 3 公斤的 woom GO 1。" },
          { title: "尼龙复合", detail: "4.9 磅的 12 Comp，Strider 迄今最轻的 12 英寸车。" },
          { title: "镁合金", detail: "约 3.2 公斤的 Micro，配低横梁车架。" },
        ],
      },
      {
        heading: "这篇盘点能回答什么",
        questions: [
          {
            q: "2026 年哪款最轻？",
            a: "公布的数字不是同一口径：4.9 磅是 Strider 的整车重量，3 公斤与约 3.2 公斤分别描述 woom 与 Micro 的车架。本文没有可比的整车重量表。",
          },
          {
            q: "限量配色会改规格吗？",
            a: "不会。荧光青绿与荧光粉只是配色，规格不变；但当季库存轮换很快。",
          },
          {
            q: "哪款给出了年龄区间？",
            a: "woom GO 1：约 1.5 至 3.5 岁，骑手身高 82–100 厘米。Strider 12 Comp 的公告没有给出骑手身高区间。",
          },
        ],
      },
    ],
    sourceNote:
      "来源：本文转载的发布报道。价格、重量与尺寸均为厂商公布值，不声称做过同条件测量。",
  },
};

const RESEARCH: Record<"en" | "zh", Treatment> = {
  en: {
    eyebrow: "AT A GLANCE",
    title: "What the two studies measured — and what they did not",
    intro:
      "One survey and one small intervention do most of the work behind the research-backed claim. The figures below are the ones reported in the two papers linked in this article.",
    blocks: [
      {
        heading: "The reported figures",
        facts: [
          { value: "2,005", label: "parent responses in the 2022 survey" },
          { value: "50", label: "children in the 2025 intervention" },
          { value: "100%", label: "balance-bike group success in 2025" },
          { value: "77%", label: "training-wheels group, approximate" },
        ],
      },
      {
        heading: "Mean age at independent cycling, by first bike",
        bars: [
          {
            caption: "2022 survey — years; average with a wide spread",
            max: 8,
            items: [
              { label: "Balance bike first", value: 4.16, display: "4.16 years" },
              { label: "Training wheels first", value: 5.97, display: "5.97 years" },
              { label: "Pedal bike first", value: 7.27, display: "7.27 years" },
            ],
          },
        ],
        note: "These are group averages for when independent cycling happened, not a recommended starting age for a balance bike.",
      },
      {
        heading: "Two studies, two designs",
        tableHead: ["Study", "Design", "Sample", "Reported result"],
        rows: [
          {
            cells: ["2022", "Parent survey", "2,005 responses in Portugal", "Learning age: 4.16 / 5.97 / 7.27 years"],
          },
          {
            cells: ["2025", "Six-session intervention", "50 children who could not yet cycle", "100% vs about 77% independent-cycling success"],
          },
        ],
        note: "A self-reported survey and a small intervention are different kinds of evidence; neither is a product comparison.",
      },
      {
        heading: "What the evidence supports — and what it does not",
        tableHead: ["Claim", "Status in these two papers"],
        rows: [
          { cells: ["Starting on a balance bike precedes independent cycling sooner", "Supported as a narrow claim"] },
          { cells: ["Better balance or coordination later", "Not measured"] },
          { cells: ["Fewer crashes or safer riding years later", "Not measured"] },
          { cells: ["A defined number of practice hours", "Not measured"] },
          { cells: ["Independent replication across research groups", "Limited — both papers share one group"] },
        ],
      },
      {
        heading: "Questions the studies actually answer",
        questions: [
          {
            q: "At what age do children ride independently?",
            a: "In the 2022 survey the averages were 4.16, 5.97 and 7.27 years by first bike. Those are group averages with a wide spread, not a promise for one child.",
          },
          {
            q: "Do balance bikes make children safer cyclists?",
            a: "Neither paper followed children beyond the learning period, so there is no long-term safety or crash result to report.",
          },
          {
            q: "Should a 2-year-old start on a balance bike?",
            a: "The studies do not set an introduction age. Fit is a separate question they did not test — the inseam-to-seat measurement in our balance bike by age guide is the practical check.",
          },
        ],
      },
    ],
    sourceNote:
      "Source: the two peer-reviewed papers linked in this article. Age bands and sample sizes are theirs; no product or brand conclusion is drawn.",
  },
  zh: {
    eyebrow: "要点速览",
    title: "两项研究测了什么，没有测什么",
    intro: "有研究背书这个说法，主要来自一项问卷和一项小样本干预实验。下面的数字都出自本文链接的两篇论文。",
    blocks: [
      {
        heading: "论文报告的数字",
        facts: [
          { value: "2005", label: "2022 年问卷的家长回复数" },
          { value: "50", label: "2025 年干预实验的孩子数" },
          { value: "100%", label: "2025 年平衡车组成功率" },
          { value: "77%", label: "训练轮组成功率，约数" },
        ],
      },
      {
        heading: "按第一辆车分组的独立骑行平均年龄",
        bars: [
          {
            caption: "2022 年问卷，单位：岁；群体均值，个体差异很大",
            max: 8,
            items: [
              { label: "先骑平衡车", value: 4.16, display: "4.16 岁" },
              { label: "先用训练轮", value: 5.97, display: "5.97 岁" },
              { label: "直接上脚踏车", value: 7.27, display: "7.27 岁" },
            ],
          },
        ],
        note: "这些是何时学会独立骑行的群体平均值，不是建议几岁开始骑平衡车。",
      },
      {
        heading: "两项研究，两种设计",
        tableHead: ["研究", "设计", "样本", "报告结果"],
        rows: [
          {
            cells: ["2022 年", "家长问卷", "葡萄牙的 2005 份回复", "学会年龄：4.16 / 5.97 / 7.27 岁"],
          },
          {
            cells: ["2025 年", "六个课时干预实验", "50 名还不会骑车的孩子", "独立骑行成功率 100% 与约 77%"],
          },
        ],
        note: "自报问卷与小样本干预不是同一种证据；两者都不是产品对比。",
      },
      {
        heading: "证据支持什么，没有支持什么",
        tableHead: ["说法", "在这两篇论文中的状态"],
        rows: [
          { cells: ["从平衡车起步更早学会独立骑行", "支持，但仅限这一狭窄结论"] },
          { cells: ["以后平衡感或协调性更好", "没有测量"] },
          { cells: ["以后摔车更少、骑得更安全", "没有测量"] },
          { cells: ["需要练习多少小时", "没有测量"] },
          { cells: ["不同团队独立复现", "有限——两篇出自同一团队"] },
        ],
      },
      {
        heading: "研究真正回答了哪些问题",
        questions: [
          {
            q: "孩子几岁能独立骑车？",
            a: "2022 年问卷按第一辆车分组的均值分别是 4.16 岁、5.97 岁和 7.27 岁。这是群体均值，个体差异很大，不是对某个孩子的承诺。",
          },
          {
            q: "平衡车会让孩子骑得更安全吗？",
            a: "两项研究都没有在学习期之后继续追踪孩子，因此没有长期安全或摔车结果可讲。",
          },
          {
            q: "两岁该不该开始骑平衡车？",
            a: "研究没有给出开始年龄。适配是另一回事，两篇论文都没有测量；实用做法是量腿长对座高，见我们的《平衡车按年龄选》指南。",
          },
        ],
      },
    ],
    sourceNote:
      "来源：本文链接的两篇同行评审论文。年龄区间与样本量均出自原文，不由此推出任何品牌或产品结论。",
  },
};

const TREATMENTS: Record<string, Record<"en" | "zh", Treatment>> = {
  "strider-bikes-kellys-juvenile-models": STRIDER_KELLYS,
  "choosing-and-using-child-safety-seats": SAFETY_SEATS,
  "balance-bike-brand-news-october-2026": BRAND_NEWS,
  "balance-bike-research": RESEARCH,
};

function renderFacts(facts: Fact[]): string {
  return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:0 0 22px;">${facts
    .map(
      (f) =>
        `<div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:14px 16px;"><div style="font-size:1.3rem;font-weight:800;color:#c2410c;line-height:1.2;">${esc(f.value)}</div><div style="font-size:0.78rem;color:#475569;line-height:1.5;margin-top:6px;">${esc(f.label)}</div></div>`,
    )
    .join("")}</div>`;
}

function renderTable(head: string[], rows: Row[]): string {
  return `<div style="overflow-x:auto;margin:0 0 16px;"><table style="width:100%;border-collapse:collapse;font-size:0.86rem;background:#fff;"><thead><tr>${head
    .map(
      (h) =>
        `<th style="text-align:left;padding:10px 12px;background:#fff7ed;color:#7c2d12;font-weight:800;border:1px solid #fed7aa;white-space:nowrap;">${esc(h)}</th>`,
    )
    .join("")}</tr></thead><tbody>${rows
    .map(
      (r) =>
        `<tr>${r.cells
          .map(
            (c) =>
              `<td style="padding:10px 12px;border:1px solid #e2e8f0;color:#334155;vertical-align:top;line-height:1.55;">${esc(c)}</td>`,
          )
          .join("")}</tr>`,
    )
    .join("")}</tbody></table></div>`;
}

/** Wheel-size bands on a fixed 18–24 in axis; widths are pure presentation. */
function renderRanges(items: RangeItem[], lang: "en" | "zh"): string {
  const MIN = 18;
  const MAX = 24;
  const unit = lang === "zh" ? "英寸" : "in";
  const pct = (n: number) => Math.max(0, Math.min(100, ((n - MIN) / (MAX - MIN)) * 100));
  return `<div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:14px 16px;margin-bottom:14px;">${items
    .map(
      (r) =>
        `<div style="margin-bottom:12px;"><div style="display:flex;justify-content:space-between;gap:10px;font-size:0.8rem;color:#334155;margin-bottom:5px;"><strong>${esc(r.label)}</strong><span style="color:#64748b;">${r.start}–${r.end} ${unit}</span></div><div style="position:relative;height:10px;border-radius:999px;background:#f1f5f9;overflow:hidden;"><span style="position:absolute;left:${pct(r.start)}%;width:${pct(r.end) - pct(r.start)}%;top:0;bottom:0;border-radius:999px;background:#f97316;"></span></div></div>`,
    )
    .join("")}<div style="display:flex;justify-content:space-between;font-size:0.7rem;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:6px;"><span>18 ${unit}</span><span>24 ${unit}</span></div></div>`;
}

/** Labelled bars on a 0..max axis. Every display string is CMS-quoted copy. */
function renderBars(series: BarSeries[]): string {
  return series
    .map(
      (s) =>
        `<div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:14px 16px;margin-bottom:14px;"><p style="margin:0 0 12px;font-size:0.78rem;color:#64748b;">${esc(s.caption)}</p>${s.items
          .map(
            (item) =>
              `<div style="margin-bottom:11px;"><div style="display:flex;justify-content:space-between;gap:10px;font-size:0.82rem;color:#334155;margin-bottom:5px;"><strong>${esc(item.label)}</strong><span style="color:#c2410c;font-weight:800;">${esc(item.display)}</span></div><div style="height:12px;border-radius:999px;background:#f1f5f9;overflow:hidden;"><span style="display:block;height:100%;width:${Math.max(0, Math.min(100, (item.value / s.max) * 100))}%;border-radius:999px;background:#f97316;"></span></div></div>`,
          )
          .join("")}</div>`,
    )
    .join("");
}

function renderQuestions(items: Question[]): string {
  return `<div style="margin-bottom:14px;">${items
    .map(
      (qa) =>
        `<details style="background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:12px 14px;margin-bottom:8px;"><summary style="cursor:pointer;font-weight:700;font-size:0.9rem;color:#0f172a;">${esc(qa.q)}</summary><p style="margin:10px 0 0;font-size:0.85rem;line-height:1.65;color:#475569;">${esc(qa.a)}</p></details>`,
    )
    .join("")}</div>`;
}

function renderSteps(steps: NonNullable<Block["steps"]>): string {
  return `<ol style="list-style:none;margin:0 0 16px;padding:0;">${steps
    .map(
      (s, i) =>
        `<li style="display:flex;gap:12px;align-items:flex-start;padding:12px 14px;border:1px solid #e2e8f0;border-radius:14px;background:#fff;margin-bottom:8px;"><span style="flex:0 0 26px;height:26px;border-radius:50%;background:#c2410c;color:#fff;font-size:0.8rem;font-weight:800;display:flex;align-items:center;justify-content:center;">${i + 1}</span><span><strong style="display:block;color:#0f172a;font-size:0.92rem;">${esc(s.title)}</strong><span style="display:block;color:#475569;font-size:0.85rem;line-height:1.6;margin-top:4px;">${esc(s.detail)}</span></span></li>`,
    )
    .join("")}</ol>`;
}

/**
 * Build the enrichment section. Returns "" for any slug without a treatment
 * and for an unsupported language, so callers can invoke it unconditionally.
 */
export function renderNewsVisualEnrichmentHtml(slug: string, lang: "en" | "zh"): string {
  const treatment = TREATMENTS[slug]?.[lang];
  if (!treatment) return "";

  const blocks = treatment.blocks
    .map((b) => {
      let body = "";
      if (b.facts?.length) body += renderFacts(b.facts);
      if (b.tableHead && b.rows?.length) body += renderTable(b.tableHead, b.rows);
      if (b.ranges?.length) body += renderRanges(b.ranges, lang);
      if (b.bars?.length) body += renderBars(b.bars);
      if (b.steps?.length) body += renderSteps(b.steps);
      if (b.questions?.length) body += renderQuestions(b.questions);
      if (b.note) {
        body += `<p style="font-size:0.78rem;color:#64748b;line-height:1.6;margin:0 0 14px;">${esc(b.note)}</p>`;
      }
      return `<div style="margin:0 0 26px;"><h3 style="margin:0 0 12px;font-size:1.05rem;font-weight:800;color:#0f172a;">${esc(b.heading)}</h3>${body}</div>`;
    })
    .join("");

  return `<section data-news-enrichment="${esc(slug)}" lang="${lang === "zh" ? "zh-CN" : "en"}" style="margin:26px 0 0;padding:20px 18px 8px;border-top:2px solid #fed7aa;border-radius:20px;background:#fff7ed;">
      <p style="margin:0 0 6px;font-size:0.7rem;font-weight:800;letter-spacing:0.14em;color:#c2410c;text-transform:uppercase;">${esc(treatment.eyebrow)}</p>
      <h2 style="margin:0 0 10px;font-size:1.4rem;font-weight:900;color:#0f172a;line-height:1.3;">${esc(treatment.title)}</h2>
      <p style="margin:0 0 22px;font-size:0.92rem;color:#475569;line-height:1.7;">${esc(treatment.intro)}</p>
      ${blocks}
      <p style="margin:0;padding:12px 0 8px;border-top:1px solid #fed7aa;font-size:0.76rem;color:#64748b;line-height:1.65;">${esc(treatment.sourceNote)}</p>
    </section>`;
}
