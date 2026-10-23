// Kids Bike Safety Standards — curated, source-cited reference data.
//
// Kids-bikes mirror of src/data/balanceBikeSafety.ts (Plan-B Asset 4, which
// only covers balance_bike). The regulatory posture is genuinely different and
// is the whole point of this page:
//
//   * A balance bike is usually sold and tested as a TOY, so ASTM F963 (US) and
//     EN 71 (EU) DO apply to it, and 16 CFR 1512 treats it as a reduced
//     "sidewalk bike".
//   * A pedal kids' bike is a BICYCLE, not a toy: 16 CFR 1512 (mechanical) and
//     CPSIA (children's-product chemical) apply, while ASTM F963 / EN 71 do NOT
//     (the Toy Safety Directive excludes bicycles). EN ISO 8098 is its EU
//     standard, not EN 71.
//
// Every limit below is traced to an authoritative public source (CPSC, eCFR,
// ISO, EUR-Lex). This is a plain-language summary for parents, NOT compliance
// or legal advice. Editions current as of the `retrievedAt` date; confirm the
// in-force edition against the linked official texts.

export const KIDS_SAFETY_PATH = "/kids-bike-safety-standards/";

export interface KidsSafetyCitation {
  title: string;
  url: string;
}

export interface KidsSafetyStandard {
  id: string;
  region: "US" | "EU_UK";
  name: string;
  edition?: string;
  mandatory: boolean;
  scope: { en: string; zh: string };
  requirements: { en: string; zh: string }[];
  verifyMark: { en: string; zh: string };
  citation: KidsSafetyCitation;
}

export interface KidsComparisonRow {
  region: { en: string; zh: string };
  standards: { en: string; zh: string };
  covers: { en: string; zh: string };
  mandatory: { en: string; zh: string };
  lookFor: { en: string; zh: string };
}

export const kidsSafetySeo = {
  en: {
    title: "Kids Bike Safety: 16 CFR 1512, EN ISO 8098",
    description:
      "Which safety rules actually apply to a pedal kids' bike in the US and EU — and which do not. 16 CFR 1512 and CPSIA govern it as a bicycle and a children's product; ASTM F963 and EN 71 do not, because a pedal bike is not a toy. What each requires, and how to verify a bike is compliant.",
    canonical: KIDS_SAFETY_PATH,
    keywords: [
      "kids bike safety standards",
      "16 CFR 1512 kids bike",
      "CPSIA kids bike",
      "EN ISO 8098 kids bike",
      "kids bike not a toy",
      "ASTM F963 does not apply",
      "kids bike compliance",
      "children bicycle regulations",
    ],
  },
  zh: {
    title: "儿童自行车安全标准：CPSIA、16 CFR 1512 与 EN ISO 8098",
    description:
      "美国与欧盟分别对儿童脚踏车适用哪些安全规则——以及哪些不适用。16 CFR 1512 与 CPSIA 把它作为「自行车」和「儿童产品」来管；ASTM F963 与 EN 71 不适用，因为脚踏车不是玩具。各自要求什么，以及如何核验一辆儿童自行车是否合规。",
    canonical: KIDS_SAFETY_PATH,
    keywords: [
      "儿童自行车安全标准",
      "16 CFR 1512 儿童自行车",
      "CPSIA 儿童自行车",
      "EN ISO 8098 儿童自行车",
      "儿童自行车不是玩具",
      "ASTM F963 不适用",
      "儿童自行车合规",
      "儿童自行车法规",
    ],
  },
} as const;

export interface KidsSafetyStrings {
  eyebrow: string;
  heroTitle: string;
  heroLead: string;
  heroNote: string;
  retrievedLabel: string;
  introTitle: string;
  introBody: string;
  glanceTitle: string;
  colRegion: string;
  colStandards: string;
  colCovers: string;
  colMandatory: string;
  colLookFor: string;
  mechTitle: string;
  mechLead: string;
  usTitle: string;
  usLead: string;
  euTitle: string;
  euLead: string;
  verifyTitle: string;
  verifyLead: string;
  caveatsTitle: string;
  sourceLabel: string;
}

export const kidsSafetyStrings: Record<"en" | "zh", KidsSafetyStrings> = {
  en: {
    eyebrow: "Safety reference",
    heroTitle: "Kids Bike Safety Standards, Explained",
    heroLead:
      "A pedal kids' bike is regulated as a bicycle and a children's product — not as a toy. That one distinction decides which rules apply in the US and EU, and which well-known marks (ASTM F963, EN 71) quietly do not. Here is the plain-language split, with the official texts linked.",
    heroNote:
      "This page summarizes public safety regulations for parents, not compliance professionals. It is not legal or certification advice — always confirm the current edition and the specific certificate with the manufacturer or seller.",
    retrievedLabel: "Compiled",
    introTitle: "What a pedal kids bike is regulated as",
    introBody:
      "A balance bike is usually sold and tested as a toy, so toy-safety rules (ASTM F963 in the US, EN 71 in the EU) reach it. A pedal kids' bike is different: it has a drivetrain and is a vehicle, so it is a bicycle under 16 CFR 1512 and a children's product under CPSIA, and it is excluded from the toy standards. Below, the US and EU rules are separated, then a practical first-pass compliance check you can do without a lab.",
    glanceTitle: "How the rules split by region",
    colRegion: "Region",
    colStandards: "Core standard(s)",
    colCovers: "What it covers",
    colMandatory: "Mandatory?",
    colLookFor: "Look for",
    mechTitle: "The mechanical checks that actually differ",
    mechLead:
      "Because a pedal bike has a chain, pedals and brakes that a balance bike lacks, the checks that matter for it are mechanical, not chemical. The parts a parent can actually see on the bike: a working brake (a rear brake at minimum; both wheels if the seat sits above 25 in / 635 mm), reflectors front, rear and on the pedals, a guard over the top of the chain, no sharp metal edges, and a permanent mark on the seat post showing how far it may be lowered. The formal standards below are where each of those duties is written down.",
    usTitle: "United States — 16 CFR 1512, not a toy",
    usLead:
      "In the US a pedal kids' bike is a bicycle under 16 CFR Part 1512 (federal mechanical safety) and a children's product under CPSIA. It is not a toy, so ASTM F963's mandatory toy rules generally do not extend to it. The 1512 duties scale with seat height: at or below 25 in (635 mm) at its lowest the bike is the reduced 'sidewalk bicycle' class; above that, the full bicycle requirements apply.",
    euTitle: "European Union & United Kingdom — EN ISO 8098, not a toy standard",
    euLead:
      "In the EU and UK a pedal kids' bike with a maximum saddle height of 435–635 mm is a 'bicycle for young children' under EN ISO 8098 — the bicycle standard, not the toy standard. EN ISO 8098 is cited in the Official Journal under the General Product Safety Regulation (EU) 2023/988, so conforming to it gives a presumption of conformity. The Toy Safety Directive (EN 71) does not generally apply to it.",
    verifyTitle: "A five-minute compliance check before you buy",
    verifyLead:
      "You do not need a laboratory for a first-pass check. Look for these on the product, packaging, or listing:",
    caveatsTitle: "What the standards cannot guarantee",
    sourceLabel: "Sources",
  },
  zh: {
    eyebrow: "安全参考",
    heroTitle: "儿童自行车安全标准，讲清楚",
    heroLead:
      "儿童脚踏车被当作「自行车」和「儿童产品」来监管，而不是玩具。这一个区分决定了美国与欧盟分别适用哪些规则，以及哪些常见标识（ASTM F963、EN 71）其实并不适用。下面是大白话的拆分，并附上官方文本链接。",
    heroNote:
      "本页面向家长总结公开的安全法规，而非面向合规专业人士。它不是法律或认证建议——请始终与制造商或卖家确认当前版本与具体证书。",
    retrievedLabel: "整理于",
    introTitle: "儿童脚踏车被当作什么来监管",
    introBody:
      "平衡车通常作为玩具销售与测试，所以玩具安全规则（美国 ASTM F963、欧盟 EN 71）覆盖它。儿童脚踏车不同：它有传动系统、是车辆，因此属于 16 CFR 1512 下的「自行车」与 CPSIA 下的「儿童产品」，并被排除在玩具标准之外。下面区分美国与欧盟的规则，并给出无需实验室即可做的初步合规自查。",
    glanceTitle: "规则如何按地区拆分",
    colRegion: "地区",
    colStandards: "核心标准",
    colCovers: "覆盖内容",
    colMandatory: "是否强制",
    colLookFor: "认准",
    mechTitle: "真正不同的机械检查",
    mechLead:
      "因为脚踏车有平衡车所没有的链条、踏板和刹车，对它真正重要的检查是机械的，而非化学的。家长在车上能直接看到的部件包括：可用的刹车（至少后刹；座高超过 25 英寸／635 毫米则前后轮都要）、前/后及踏板上的反光片、链条上部的护罩、无锋利金属边缘，以及座管上标明最大下调量的永久标记。下面这些正式标准，正是把这每一项职责写下来的地方。",
    usTitle: "美国——16 CFR 1512，而非玩具",
    usLead:
      "在美国，儿童脚踏车是 16 CFR Part 1512（联邦机械安全）下的自行车，也是 CPSIA 下的儿童产品。它不是玩具，所以 ASTM F963 的强制性玩具规则通常不适用于它。1512 的职责随座高分级：最低座高 ≤ 25 英寸（635 毫米）时为减免的「人行道自行车」类；超过该值则适用完整自行车要求。",
    euTitle: "欧盟与英国——EN ISO 8098，而非玩具标准",
    euLead:
      "在欧盟与英国，最大座高 435–635 毫米的儿童脚踏车属于 EN ISO 8098 下的「儿童自行车」——是自行车标准，而非玩具标准。EN ISO 8098 经《通用产品安全法规》（EU 2023/988）在官方公报中引用，因此符合即推定安全。《玩具安全指令》（EN 71）通常不适用于它。",
    verifyTitle: "购买前的五分钟合规自查",
    verifyLead: "初步自查不需要实验室。请在产品、包装或商品页上查找以下内容：",
    caveatsTitle: "标准无法保证的事",
    sourceLabel: "资料来源",
  },
};

export const kidsSafetyStandards: KidsSafetyStandard[] = [
  {
    id: "us-1512",
    region: "US",
    name: "16 CFR Part 1512 — Bicycles (federal mechanical safety)",
    mandatory: true,
    scope: {
      en: "Federal mechanical safety for every pedal bicycle sold in the US. A kids' bike with its seat at the lowest position 635 mm (25 in) or below is the reduced 'sidewalk bicycle' class; above that it is a full bicycle. Either way it is a bicycle under 1512, not a toy.",
      zh: "在美国销售的所有脚踏车的联邦机械安全法规。最低座高 ≤ 635 毫米（25 英寸）的儿童车属减免的「人行道自行车」类；超过该值则为完整自行车。无论如何，它在 1512 下是自行车，不是玩具。",
    },
    requirements: [
      {
        en: "Brakes: a full bicycle (seat height above 635 mm / 25 in at its lowest) must have a system that can skid the front wheel and the rear wheel. A sidewalk bicycle at or below that height may use a rear brake alone (1512.5).",
        zh: "刹车：完整自行车（最低座高 > 635 毫米／25 英寸）须有能让前轮与后轮都打滑的制动系统；该高度及以下的人行道自行车可仅用后刹（1512.5）。",
      },
      {
        en: "Reflectors: a white front reflector, red rear reflector, amber reflectors on both pedals, and side reflectors are required on a full bicycle; a sidewalk bicycle needs at least a rear reflector and one side reflector per wheel (1512.6).",
        zh: "反光片：完整自行车须有白色前反光片、红色后反光片、两侧踏板的琥珀色反光片及侧反光片；人行道自行车至少须有后反光片与每个轮子一片侧反光片（1512.6）。",
      },
      {
        en: "Chain guard: the top run of the chain and the chainring must be covered so a rider cannot contact them (1512.9).",
        zh: "链条护罩：链条上沿与链轮须被遮护，使骑乘者无法接触到（1512.9）。",
      },
      {
        en: "No sharp edges or hazardous protrusions; the seat post must carry a permanent minimum-insertion-depth mark, and a permanent label names the maker, origin and model (1512.12, 1512.15, 1512.18).",
        zh: "不得有锋利边缘或危险突出物；座管须有永久性的最小插入深度标记，并须有永久标签标明制造者、原产国与型号（1512.12、1512.15、1512.18）。",
      },
    ],
    verifyMark: {
      en: "Visible on the bike: the brake and reflector layout, the chain guard, and the permanent frame label. Backed by the CPC.",
      zh: "在车上可见：刹车与反光片布局、链条护罩，以及永久性车架标签。由 CPC 背书。",
    },
    citation: {
      title: "CPSC — Bicycle Requirements Business Guidance",
      url: "https://www.cpsc.gov/content/bicycle-requirements-business-guidance",
    },
  },
  {
    id: "us-cpsia",
    region: "US",
    name: "CPSIA — Consumer Product Safety Improvement Act",
    mandatory: true,
    scope: {
      en: "Applies to every children's product, including pedal kids' bikes — they are made for a child 12 or under, independent of the bicycle standard.",
      zh: "对所有儿童产品（含儿童脚踏车）一律适用——因其为 12 岁及以下儿童设计，独立于自行车标准。",
    },
    requirements: [
      {
        en: "Lead in paint and surface coatings is capped at 90 ppm (16 CFR 1303).",
        zh: "油漆及表面涂层铅含量上限 90 ppm（16 CFR 1303）。",
      },
      {
        en: "Lead in the base material is capped at 100 ppm, or 100 mg/kg (15 U.S.C. 2057c).",
        zh: "基材铅含量上限 100 ppm（即 100 mg/kg）（15 U.S.C. 2057c）。",
      },
      {
        en: "Eight specified phthalates are each limited to under 0.1% (1,000 ppm) in parts a child can touch (16 CFR 1307).",
        zh: "8 种指定邻苯二甲酸酯，在儿童可接触部件中每种 < 0.1%（1,000 ppm）（16 CFR 1307）。",
      },
      {
        en: "A permanent tracking label and a Children's Product Certificate from a CPSC-accepted lab are required.",
        zh: "须有永久性追踪标签，以及来自 CPSC 认可实验室的《儿童产品证书》（CPC）。",
      },
    ],
    verifyMark: {
      en: "Tracking label on the frame; the CPC certificate on file.",
      zh: "车架上的追踪标签；备案的 CPC 证书。",
    },
    citation: {
      title: "CPSC — Regulatory Information / CPSIA",
      url: "https://www.cpsc.gov/Regulatory-Information/CPSIA",
    },
  },
  {
    id: "us-toy-exclusion",
    region: "US",
    name: "ASTM F963 toy safety — does not apply to pedal bikes",
    mandatory: false,
    scope: {
      en: "A pedal kids' bike is regulated as a bicycle (16 CFR 1512) and as a children's product (CPSIA). It is not a toy, so the mandatory ASTM F963 toy-safety standard generally does not extend to it — even though some listings still show the mark.",
      zh: "儿童脚踏车作为自行车（16 CFR 1512）与儿童产品（CPSIA）来监管，不是玩具，因此强制性的 ASTM F963 玩具安全标准通常不适用于它——尽管有些商品页仍标注该标识。",
    },
    requirements: [
      {
        en: "This is the opposite of a balance bike, which is usually sold and tested as a toy, so ASTM F963 does apply to it.",
        zh: "这与平衡车相反：平衡车通常作为玩具销售与测试，因此 ASTM F963 确实适用于它。",
      },
      {
        en: "If you see 'ASTM F963 compliant' on a pedal-bike box, treat it as a bonus chemical/test claim, not the rule that governs the bike.",
        zh: "若在脚踏车包装上看到「ASTM F963 compliant」，应把它当作额外的化学/测试声明，而非管束这辆车的规则。",
      },
    ],
    verifyMark: {
      en: "No ASTM F963 certificate is expected; the CPC (above) is the document that matters.",
      zh: "不要求 ASTM F963 证书；重要的是上面的 CPC。",
    },
    citation: {
      title: "CPSC — Toy Safety Business Guidance",
      url: "https://www.cpsc.gov/Business--Manufacturing/Business-Education/Toy-Safety",
    },
  },
  {
    id: "eu-iso8098",
    region: "EU_UK",
    name: "EN ISO 8098:2023 — Bicycles for young children",
    edition: "Saddle height 435–635 mm",
    mandatory: true,
    scope: {
      en: "The EU and UK harmonised standard for pedal bikes with a maximum saddle height between 435 mm and 635 mm. It is the bicycle standard, not the toy standard, and is cited in the Official Journal under the General Product Safety Regulation (EU) 2023/988, so conforming gives a presumption of conformity.",
      zh: "欧盟与英国协调标准，适用于最大座高 435–635 毫米的儿童脚踏车。它是自行车标准而非玩具标准，并经由《通用产品安全法规》（EU 2023/988）在官方公报中引用，符合即推定安全。",
    },
    requirements: [
      {
        en: "Braking: the bicycle must have at least one brake acting on the rear wheel, and braking and stability must suit a child rider (ISO 8098).",
        zh: "制动：自行车须至少有一个作用于后轮的刹车，且制动与稳定性须适合儿童骑乘者（ISO 8098）。",
      },
      {
        en: "No derailleur gears: a young-children's bicycle shall not be fitted with a derailleur gear — only single-speed or hub gears are allowed.",
        zh: "不得装拨链器：儿童自行车不得配备拨链器变速，只允许单速或内变速花鼓。",
      },
      {
        en: "Sharp edges, protrusions and accessible small parts are controlled; the saddle-height range must be marked on the frame.",
        zh: "锋利边缘、突出物与可接触小部件受控；座高范围须在车架上标明。",
      },
      {
        en: "Assembly instructions and warnings must ship with the bike, and it must stay stable when a child sits on it.",
        zh: "装配说明与警示须随车提供，且儿童骑乘时须保持稳定。",
      },
    ],
    verifyMark: {
      en: "CE mark (EU) or UKCA mark (UK); the technical file is kept for 10 years.",
      zh: "CE 标志（欧盟）或 UKCA 标志（英国）；技术文件须留存 10 年。",
    },
    citation: {
      title: "ISO — EN ISO 8098:2023 (Cycles, safety requirements for bicycles for young children)",
      url: "https://www.iso.org/standard/81978.html",
    },
  },
  {
    id: "eu-toy-exclusion",
    region: "EU_UK",
    name: "Toy Safety Directive 2009/48/EC + EN 71 — does not apply to pedal bikes",
    mandatory: false,
    scope: {
      en: "A pedal kids' bike is a vehicle, not a toy, under EU rules — so the Toy Safety Directive and the EN 71 series generally do not apply to it. (The one edge case: a bike whose saddle height is below 435 mm can fall under the toy rules.)",
      zh: "在欧盟规则下，儿童脚踏车是车辆而非玩具——因此《玩具安全指令》与 EN 71 系列通常不适用于它。（唯一例外：座高低于 435 毫米的车可能落入玩具规则。）",
    },
    requirements: [
      {
        en: "This is the mirror image of the balance-bike page, where EN 71 is the standard that applies.",
        zh: "这与平衡车页面正好相反——在那一页，EN 71 才是适用的标准。",
      },
      {
        en: "If a pedal-bike listing shows 'EN 71', read it as a chemical/physical bonus claim, not the regulation covering the bike.",
        zh: "若脚踏车商品页标注「EN 71」，应把它当作化学/物理的额外声明，而非覆盖这辆车的法规。",
      },
    ],
    verifyMark: {
      en: "EN 71 is not expected; the CE/UKCA mark against EN ISO 8098 is the one that matters.",
      zh: "不要求 EN 71；重要的是依据 EN ISO 8098 的 CE/UKCA 标志。",
    },
    citation: {
      title: "EUR-Lex — Toy Safety Directive 2009/48/EC",
      url: "https://eur-lex.europa.eu/eli/dir/2009/48/oj",
    },
  },
];

export const kidsSafetyComparison: KidsComparisonRow[] = [
  {
    region: { en: "United States", zh: "美国" },
    standards: {
      en: "16 CFR 1512 + CPSIA (not ASTM F963)",
      zh: "16 CFR 1512 + CPSIA（非 ASTM F963）",
    },
    covers: {
      en: "Mechanical + chemical + tracking label",
      zh: "机械安全 + 化学限量 + 追踪标签",
    },
    mandatory: { en: "Yes (federal)", zh: "是（联邦强制）" },
    lookFor: {
      en: "CPC certificate, tracking label",
      zh: "CPC 证书、追踪标签",
    },
  },
  {
    region: { en: "EU & UK", zh: "欧盟与英国" },
    standards: {
      en: "EN ISO 8098 (not EN 71)",
      zh: "EN ISO 8098（非 EN 71）",
    },
    covers: {
      en: "Mechanical + stability + marking",
      zh: "机械安全 + 稳定性 + 标记",
    },
    mandatory: { en: "Yes", zh: "是" },
    lookFor: {
      en: "CE (EU) / UKCA (UK) mark",
      zh: "CE（欧盟）/ UKCA（英国）标志",
    },
  },
];

export const kidsSafetyVerification: { en: string; zh: string }[] = [
  {
    en: "A CPC (US) or a CE/UKCA declaration (EU/UK) for the bike itself — not just a generic 'compliant' line on the listing.",
    zh: "针对车本身的 CPC（美国）或 CE/UKCA 符合性声明（欧盟/英国）——而非商品页上一句笼统的「合规」。",
  },
  {
    en: "A permanent tracking label naming the maker or importer, the country of origin and the batch.",
    zh: "标明制造者或进口商、原产国与批次的永久性追踪标签。",
  },
  {
    en: "An age grade and any required warnings (helmet use, adult assembly, brake type).",
    zh: "适用年龄分级与必要警示（佩戴头盔、成人装配、刹车类型）。",
  },
  {
    en: "A test report from a CPSC-accepted lab (US) or an EU notified body — ask the seller for it if it is not on the product page.",
    zh: "来自 CPSC 认可实验室（美国）或欧盟公告机构（欧盟）的测试报告——若商品页没有，向卖家索要。",
  },
  {
    en: "When in doubt, ask for the actual certificate; a 'CPSC compliant' or 'EN 71 tested' tag is marketing, not the document.",
    zh: "有疑问时索要真实证书——「符合 CPSC」或「EN 71 测试」之类标签是营销话术，并非凭证本身。",
  },
];

export const kidsSafetyCaveats: { en: string; zh: string }[] = [
  {
    en: "A pedal kids' bike is a bicycle (16 CFR 1512) and a children's product (CPSIA); it is not a toy, so ASTM F963's toy rules generally do not apply to it.",
    zh: "儿童脚踏车是自行车（16 CFR 1512）也是儿童产品（CPSIA）；它不是玩具，因此 ASTM F963 的玩具规则通常不适用。",
  },
  {
    en: "In the EU the same split holds: EN ISO 8098 covers the bike, not the EN 71 toy standard — unless the saddle height is below 435 mm, where the toy rules can apply.",
    zh: "欧盟同样如此：覆盖车的是 EN ISO 8098，而非 EN 71 玩具标准——除非座高低于 435 毫米，此时玩具规则可能适用。",
  },
  {
    en: "'CPSC compliant' or 'EN 71 tested' on a listing is a marketing phrase; the proof is the CPC (US) or the CE/UKCA declaration (EU/UK).",
    zh: "商品页上的「符合 CPSC」或「EN 71 测试」是营销话术；真正的凭证是 CPC（美国）或 CE/UKCA 符合性声明（欧盟/英国）。",
  },
  {
    en: "Standards are revised (for example ASTM F963-23 took effect in 2024). Confirm the edition in force. This page summarises public regulations for parents; it is not compliance or legal advice.",
    zh: "标准会修订（例如 ASTM F963-23 于 2024 年生效）。请确认现行版本。本页面向家长总结公开法规，并非合规或法律建议。",
  },
];

export const kidsSafetySource = {
  name: "Public regulatory texts (CPSC, eCFR, ISO, EUR-Lex)",
  retrievedAt: "2026-10-23",
  note: {
    en: "Curated from the authoritative sources linked per standard; no figures invented.",
    zh: "整理自各标准下方链接的权威来源；无杜撰数据。",
  },
};

export function buildKidsBikeSafetyDatasetSchema(pageUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Kids Bike Safety Standards — US (16 CFR 1512, CPSIA) and EU/UK (EN ISO 8098, CE/UKCA)",
    description:
      "Plain-language compilation of the safety standards applicable to pedal kids' bikes, with source citations to CPSC, eCFR, ISO and EUR-Lex. Clarifies that ASTM F963 and EN 71 do not generally apply because a pedal bike is a bicycle, not a toy.",
    url: pageUrl,
    creator: {
      "@type": "Organization",
      name: "BalanceBikeToddler",
      url: "https://balancebiketoddler.com",
    },
    dateCreated: "2026-10-23",
    dateModified: "2026-10-23",
    license: "https://creativecommons.org/licenses/by/4.0/",
    citation: kidsSafetyStandards.map((s) => ({
      "@type": "CreativeWork",
      name: s.name,
      url: s.citation.url,
    })),
  };
}
