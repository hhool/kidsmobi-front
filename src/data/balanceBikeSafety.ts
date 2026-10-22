// Balance Bike Safety Standards — curated, source-cited reference data.
//
// Discipline (Plan-B): every regulatory limit below is traced to an authoritative
// public source (CPSC, eCFR, EUR-Lex). This is a plain-language summary for parents,
// NOT compliance or legal advice. Editions current as of the `retrievedAt` date;
// confirm the in-force edition against the linked official texts.

export const SAFETY_PATH = "/balance-bike-safety-standards/";

export interface SafetyCitation {
  title: string;
  url: string;
}

export interface SafetyStandard {
  id: string;
  region: "US" | "EU_UK";
  name: string;
  edition?: string;
  mandatory: boolean;
  scope: { en: string; zh: string };
  requirements: { en: string; zh: string }[];
  verifyMark: { en: string; zh: string };
  citation: SafetyCitation;
}

export interface ComparisonRow {
  region: { en: string; zh: string };
  standards: { en: string; zh: string };
  covers: { en: string; zh: string };
  mandatory: { en: string; zh: string };
  lookFor: { en: string; zh: string };
}

export const safetySeo = {
  en: {
    title: "Balance Bike Safety: CPSC, ASTM F963, EN 71",
    description:
      "Which safety standards apply to toddler balance bikes in the US and EU — 16 CFR 1512, CPSIA, ASTM F963, EN 71 — what each requires, and how to verify a bike is compliant.",
    canonical: SAFETY_PATH,
    keywords: [
      "balance bike safety standards",
      "CPSC 16 CFR 1512",
      "CPSIA lead phthalates",
      "ASTM F963-23",
      "EN 71 toy safety",
      "toddler bike compliance",
      "balance bike regulations",
    ],
  },
  zh: {
    title: "平衡车安全标准：CPSC、ASTM F963 与 EN 71",
    description:
      "美国与欧盟的儿童平衡车分别适用哪些安全标准——16 CFR 1512、CPSIA、ASTM F963、EN 71——各自要求什么，以及如何核验一辆平衡车是否合规。",
    canonical: SAFETY_PATH,
    keywords: [
      "平衡车安全标准",
      "CPSC 16 CFR 1512",
      "CPSIA 铅 邻苯",
      "ASTM F963-23",
      "EN 71 玩具安全",
      "平衡车合规",
      "儿童自行车法规",
    ],
  },
} as const;

export interface SafetyStrings {
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
  usTitle: string;
  usLead: string;
  euTitle: string;
  euLead: string;
  verifyTitle: string;
  verifyLead: string;
  caveatsTitle: string;
  sourceLabel: string;
}

export const safetyStrings: Record<"en" | "zh", SafetyStrings> = {
  en: {
    eyebrow: "Safety reference",
    heroTitle: "Balance Bike Safety Standards, Explained",
    heroLead:
      "Which rules actually apply to a toddler's first bike in the US and EU — and how to check, in plain language, that a bike is compliant.",
    heroNote:
      "This page summarizes public safety regulations for parents, not compliance professionals. It is not legal or certification advice — always confirm the current edition and the specific certificate with the manufacturer or seller.",
    retrievedLabel: "Compiled",
    introTitle: "What this page covers",
    introBody:
      "A balance bike (also called a push bike, running bike, or training bike) is sold worldwide, but the safety rules differ by region. Below we separate what is mandatory in the United States from what is mandatory in the European Union and United Kingdom, then show a practical first-pass compliance check you can do without a lab.",
    glanceTitle: "Standards at a glance",
    colRegion: "Region",
    colStandards: "Core standard(s)",
    colCovers: "What it covers",
    colMandatory: "Mandatory?",
    colLookFor: "Look for",
    usTitle: "United States",
    usLead:
      "In the US, the CPSC generally treats a balance bike as a “sidewalk bike” under 16 CFR Part 1512 when its seat height is 25 inches (63.5 cm) or less. That status reduces — but does not remove — requirements, and CPSIA chemical and tracking rules apply to every children's product regardless.",
    euTitle: "European Union & United Kingdom",
    euLead:
      "In the EU, a balance bike is a “toy” under the Toy Safety Directive 2009/48/EC and must meet the EN 71 series. The UK applies the same EN 71 tests with a UKCA mark (CE is still accepted during the transition).",
    verifyTitle: "How to check a balance bike is compliant",
    verifyLead:
      "You do not need a laboratory for a first-pass check. Look for these on the product, packaging, or listing:",
    caveatsTitle: "Honest caveats",
    sourceLabel: "Sources",
  },
  zh: {
    eyebrow: "安全参考",
    heroTitle: "平衡车安全标准，讲清楚",
    heroLead:
      "美国与欧盟分别对幼儿第一辆车适用哪些规则——以及如何用大白话核验一辆平衡车是否合规。",
    heroNote:
      "本页面向家长总结公开的安全法规，而非面向合规专业人士。它不是法律或认证建议——请始终与制造商或卖家确认当前版本与具体证书。",
    retrievedLabel: "整理于",
    introTitle: "本页内容",
    introBody:
      "平衡车（也叫滑步车、推行车、训练车）在全球销售，但各地区的安规不同。下面我们区分美国与欧盟/英国的强制要求，并给出无需实验室即可做的初步合规自查。",
    glanceTitle: "标准一览",
    colRegion: "地区",
    colStandards: "核心标准",
    colCovers: "覆盖内容",
    colMandatory: "是否强制",
    colLookFor: "认准",
    usTitle: "美国",
    usLead:
      "在美国，当座椅高度 ≤ 25 英寸（63.5 厘米）时，CPSC 通常将平衡车归为 16 CFR Part 1512 下的「人行道自行车（sidewalk bike）」。这一归类会减免、但**不会免除**相关要求；而 CPSIA 的化学与追踪标签规则对所有儿童产品一律适用。",
    euTitle: "欧盟与英国",
    euLead:
      "在欧盟，平衡车属于 2009/48/EC《玩具安全指令》下的「玩具」，须满足 EN 71 系列。英国采用同样的 EN 71 测试并加贴 UKCA 标志（过渡期内 CE 仍被接受）。",
    verifyTitle: "如何核验一辆平衡车是否合规",
    verifyLead: "初步自查不需要实验室。请在产品、包装或商品页上查找以下内容：",
    caveatsTitle: "诚实说明",
    sourceLabel: "资料来源",
  },
};

export const safetyStandards: SafetyStandard[] = [
  {
    id: "us-1512",
    region: "US",
    name: "16 CFR Part 1512 — Bicycles (sidewalk-bike classification)",
    edition: "Sidewalk bike",
    mandatory: true,
    scope: {
      en: "Federal mechanical safety for bicycles. A balance bike with seat height 25 in (63.5 cm) or less is a “sidewalk bike” with reduced — not removed — requirements.",
      zh: "自行车的联邦机械安全法规。座椅高度 ≤ 25 英寸（63.5 厘米）的平衡车属于「人行道自行车」，要求被减免而非免除。",
    },
    requirements: [
      {
        en: "General safety still applies: no unfinished/sheared metal edges, no hazardous protrusions, and frame/steering/wheel must not show a visible break in testing.",
        zh: "通用安全仍适用：不得有未处理的剪切金属边缘、不得有危险突出物，车架/转向/车轮在测试中不得出现可见断裂。",
      },
      {
        en: "The seat post must carry a permanent minimum-insertion-depth mark.",
        zh: "座管须有永久性的「最小插入深度」标记。",
      },
      {
        en: "A permanent label naming the manufacturer/importer, country of origin, and model or batch ID is required.",
        zh: "须有永久性标签，标明制造商/进口商、原产国、型号或批次。",
      },
      {
        en: "Brakes: a sidewalk bike with seat height under 22 in (lowest position) needs no brake only if it has no freewheeling feature AND carries a permanent “No brakes” label; at or above 22 in it must have a foot brake.",
        zh: "刹车：座椅最低高度 < 22 英寸的人行道自行车，只有在「无惯性滑行机构」且永久标注「无刹车（No brakes）」时才可无刹车；≥ 22 英寸则须有脚刹。",
      },
      {
        en: "Reflectors are NOT required on sidewalk bikes (they may still be present on units for sale).",
        zh: "人行道自行车不强制要求反光片（在售车型仍可能配备）。",
      },
    ],
    verifyMark: {
      en: "Reflected in the CPC; check the bike's Children's Product Certificate.",
      zh: "体现在 CPC 中；请核对该车的《儿童产品证书》。",
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
      en: "Applies to ALL children's products, including balance bikes — independent of the bicycle standard.",
      zh: "对所有儿童产品（含平衡车）一律适用——独立于自行车标准。",
    },
    requirements: [
      {
        en: "Lead in paint/surface coatings ≤ 90 ppm (16 CFR 1303, “lead-free”).",
        zh: "油漆/表面涂层铅含量 ≤ 90 ppm（16 CFR 1303，「无铅」）。",
      },
      {
        en: "Lead in base/substrate materials ≤ 100 ppm (100 mg/kg) (15 U.S.C. 2057c).",
        zh: "基材铅含量 ≤ 100 ppm（100 mg/kg）（15 U.S.C. 2057c）。",
      },
      {
        en: "Eight specified phthalates, each < 0.1% (1,000 ppm) in accessible components (16 CFR 1307).",
        zh: "8 种指定邻苯二甲酸酯，在可接触部件中每种 < 0.1%（1,000 ppm）（16 CFR 1307）。",
      },
      {
        en: "A permanent tracking label with manufacturer, location, date, and batch/run.",
        zh: "永久性追踪标签，含制造商、产地、日期与批次。",
      },
    ],
    verifyMark: {
      en: "Tracking label on the product; CPC certificate.",
      zh: "产品上的追踪标签；CPC 证书。",
    },
    citation: {
      title: "CPSC — Regulatory Information / CPSIA",
      url: "https://www.cpsc.gov/Regulatory-Information/CPSIA",
    },
  },
  {
    id: "us-astm-f963",
    region: "US",
    name: "ASTM F963 — Toy Safety (mandatory via 16 CFR 1250)",
    edition: "F963-23 (effective 2024-04-20)",
    mandatory: true,
    scope: {
      en: "Mandatory toy-safety standard; often applies to balance bikes marketed as toddler toys.",
      zh: "强制性玩具安全标准；常用于作为幼儿玩具销售的平衡车。",
    },
    requirements: [
      {
        en: "No small parts that can detach from toys intended for children under 3 (choking risk).",
        zh: "供 3 岁以下儿童的玩具不得含有可脱落的小部件（窒息风险）。",
      },
      {
        en: "Accessible edges must be smooth; functional sharp points require warnings.",
        zh: "可接触边缘须光滑；功能性尖点须加警示。",
      },
      {
        en: "Lead in coatings ≤ 90 ppm; substrate ≤ 100 ppm.",
        zh: "涂层铅 ≤ 90 ppm；基材 ≤ 100 ppm。",
      },
      {
        en: "Eight phthalates < 0.1% in accessible materials.",
        zh: "可接触材料中 8 种邻苯 < 0.1%。",
      },
      {
        en: "Requires a Children's Product Certificate (CPC) based on a CPSC-accepted lab test.",
        zh: "须基于 CPSC 认可实验室的测试出具《儿童产品证书》（CPC）。",
      },
    ],
    verifyMark: {
      en: "CPC certificate.",
      zh: "CPC 证书。",
    },
    citation: {
      title: "CPSC — ASTM F963 Requirements Chart",
      url: "https://www.cpsc.gov/Business--Manufacturing/Business-Education/Toy-Safety/ASTM-F-963-Chart",
    },
  },
  {
    id: "eu-en71",
    region: "EU_UK",
    name: "Toy Safety Directive 2009/48/EC + EN 71 (1 / 2 / 3)",
    edition: "EN 71-3:2019+A1:2021",
    mandatory: true,
    scope: {
      en: "Balance bikes are “toys”; EN 71 is the harmonized standard cited by the Toy Safety Directive.",
      zh: "平衡车属于「玩具」；EN 71 是《玩具安全指令》引用的协调标准。",
    },
    requirements: [
      {
        en: "EN 71-1 (mechanical/physical): small-part ban for under-36-months, sharp edges/points, cords, and stability for ride-on toys.",
        zh: "EN 71-1（机械/物理）：36 个月以下的小部件禁令、利边利尖、绳索，以及骑乘玩具的稳定性。",
      },
      {
        en: "EN 71-2 (flammability): material flame-spread limits.",
        zh: "EN 71-2（易燃性）：材料火焰蔓延限值。",
      },
      {
        en: "EN 71-3 (chemical migration): 19 restricted elements — lead ≤ 13.5 mg/kg and cadmium ≤ 1.9 mg/kg in scraped-off material (limits vary by material category).",
        zh: "EN 71-3（元素迁移）：19 种受限元素——刮取材料中的铅 ≤ 13.5 mg/kg、镉 ≤ 1.9 mg/kg（限值随材料类别而异）。",
      },
      {
        en: "Phthalates: 6 types restricted to ≤ 0.1% in accessible plastic materials.",
        zh: "邻苯二甲酸酯：6 种在可接触塑料材料中 ≤ 0.1%。",
      },
      {
        en: "CE marking required; the technical file must be retained 10 years.",
        zh: "须加贴 CE 标志；技术文件须留存 10 年。",
      },
    ],
    verifyMark: {
      en: "CE mark on product/packaging (UKCA for the UK).",
      zh: "产品/包装上的 CE 标志（英国为 UKCA）。",
    },
    citation: {
      title: "EUR-Lex — Toy Safety Directive 2009/48/EC",
      url: "https://eur-lex.europa.eu/eli/dir/2009/48/oj",
    },
  },
];

export const safetyComparison: ComparisonRow[] = [
  {
    region: { en: "United States", zh: "美国" },
    standards: {
      en: "16 CFR 1512 (sidewalk bike) + CPSIA + ASTM F963",
      zh: "16 CFR 1512（人行道自行车）+ CPSIA + ASTM F963",
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
      en: "Toy Safety Directive 2009/48/EC + EN 71 (1/2/3)",
      zh: "《玩具安全指令》2009/48/EC + EN 71（1/2/3）",
    },
    covers: {
      en: "Mechanical + flammability + chemical migration",
      zh: "机械安全 + 易燃性 + 化学迁移",
    },
    mandatory: { en: "Yes", zh: "是" },
    lookFor: {
      en: "CE (EU) / UKCA (UK) mark",
      zh: "CE（欧盟）/ UKCA（英国）标志",
    },
  },
];

export const safetyVerification: { en: string; zh: string }[] = [
  {
    en: "A CPC (US) or CE/UKCA (EU/UK) mark on the product, packaging, or listing.",
    zh: "产品、包装或商品页上的 CPC（美国）或 CE/UKCA（欧盟/英国）标志。",
  },
  {
    en: "A permanent tracking label naming the manufacturer/importer, country of origin, and batch.",
    zh: "标明制造商/进口商、原产国与批次的永久性追踪标签。",
  },
  {
    en: "An age grade and any required warnings (e.g., helmet use, adult supervision).",
    zh: "适用年龄分级与必要警示（如佩戴头盔、成人监护）。",
  },
  {
    en: "A test report from a CPSC-accepted lab (US) or an EU notified body.",
    zh: "来自 CPSC 认可实验室（美国）或欧盟公告机构（欧盟）的测试报告。",
  },
  {
    en: "When in doubt, ask the seller for the actual certificate — a “CPSC compliant” claim is not the same as the certificate.",
    zh: "有疑问时向卖家索要真实证书——「符合 CPSC」之类宣传语并不等于证书本身。",
  },
];

export const safetyCaveats: { en: string; zh: string }[] = [
  {
    en: "Balance bikes are NOT exempt from 16 CFR 1512 — they are “sidewalk bikes” with reduced requirements. CPSIA always applies.",
    zh: "平衡车并非豁免于 16 CFR 1512——它们是「要求被减免」的人行道自行车。CPSIA 始终适用。",
  },
  {
    en: "“CPSC compliant” or “EN 71 tested” on a listing is marketing language; the real proof is the CPC (US) or the CE/UKCA declaration (EU/UK).",
    zh: "商品页上的「符合 CPSC」或「EN 71 测试」是营销话术；真正的凭证是 CPC（美国）或 CE/UKCA 符合性声明（欧盟/英国）。",
  },
  {
    en: "Standards are revised (e.g., ASTM F963-23 replaced F963-17 in April 2024). Confirm the edition in force.",
    zh: "标准会修订（例如 ASTM F963-23 于 2024 年 4 月取代 F963-17）。请确认现行版本。",
  },
  {
    en: "This page summarizes public regulations for parents; it is not compliance or legal advice. Verify the current official text before making decisions.",
    zh: "本页面向家长总结公开法规，并非合规或法律建议。做决定前请核对现行官方文本。",
  },
];

export const safetySource = {
  name: "Public regulatory texts (CPSC, eCFR, EUR-Lex)",
  retrievedAt: "2026-10-13",
  note: {
    en: "Curated from the authoritative sources linked per standard; no figures invented.",
    zh: "整理自各标准下方链接的权威来源；无杜撰数据。",
  },
};

export function buildSafetyDatasetSchema(pageUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Balance Bike Safety Standards — US (16 CFR 1512, CPSIA, ASTM F963) and EU/UK (EN 71, CE/UKCA)",
    description:
      "Plain-language compilation of the safety standards applicable to toddler balance bikes, with source citations to CPSC, eCFR, and EUR-Lex.",
    url: pageUrl,
    creator: {
      "@type": "Organization",
      name: "BalanceBikeToddler",
      url: "https://balancebiketoddler.com",
    },
    dateCreated: "2026-10-13",
    dateModified: "2026-10-13",
    license: "https://creativecommons.org/licenses/by/4.0/",
    citation: safetyStandards.map((s) => ({
      "@type": "CreativeWork",
      name: s.name,
      url: s.citation.url,
    })),
  };
}
