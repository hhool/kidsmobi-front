import type { SEOConfig } from "../types";

export type TransparencyPageKey =
  | "disclaimer"
  | "testing-methodology"
  | "certification"
  | "terms"
  | "privacy-policy"
  | "search-data"
  | "review-count-integrity";

/** A headline figure rendered as a card above the body copy. */
export type TransparencyPageMetric = {
  value: string;
  label: string;
  note: string;
};

/** A small static table inside a section. Rows are already display strings. */
export type TransparencyPageTable = {
  caption?: string;
  columns: string[];
  rows: string[][];
};

export type TransparencyPageSection = {
  eyebrow: string;
  title: string;
  body: string[];
  table?: TransparencyPageTable;
};

export type TransparencyPageContent = {
  path: string;
  navLabel: string;
  title: string;
  subtitle: string;
  intro: string;
  measuredLine?: string;
  metrics?: TransparencyPageMetric[];
  sections: TransparencyPageSection[];
  primaryLink: {
    href: string;
    label: string;
    text: string;
  };
  secondaryLink: {
    href: string;
    label: string;
    text: string;
  };
  seo: SEOConfig;
};

export type LocalizedTransparencyPage = {
  key: TransparencyPageKey;
  en: TransparencyPageContent;
  zh: TransparencyPageContent;
};

export const TRANSPARENCY_PAGE_PATHS: Record<TransparencyPageKey, string> = {
  disclaimer: "/transparency/disclaimer/",
  "testing-methodology": "/transparency/testing-methodology/",
  certification: "/transparency/certification-lab-notes/",
  terms: "/transparency/terms/",
  "privacy-policy": "/transparency/privacy-policy/",
  "search-data": "/transparency/search-data/",
  "review-count-integrity": "/transparency/review-count-integrity/",
};

export const TRANSPARENCY_PAGES: LocalizedTransparencyPage[] = [
  {
    key: "disclaimer",
    en: {
      path: TRANSPARENCY_PAGE_PATHS.disclaimer,
      navLabel: "Disclaimer",
      title: "Independent Declaration: No Brand Recharge, No Soft Scores",
      subtitle: "We do not sell rankings. We buy, measure, stress, and sometimes physically retire unsafe kids mobility products so parents can make harder decisions with cleaner evidence.",
      intro: "BalanceBikeToddler exists because glossy product pages do not show wobble, brake lag, load drift, or the moment a frame starts lying under stress. This is our operating oath.",
      sections: [
        {
          eyebrow: "01 / Funding",
          title: "Affiliate revenue is fuel, not a steering wheel",
          body: [
            "Some pages may contain commerce links. If a parent buys through one of those links, BalanceBikeToddler may receive a small commission. That money does not buy a better score, a softer headline, or a hidden editorial pass.",
            "Our rule is blunt: the evidence moves first, the link follows later. If a product fails our safety logic, affiliate potential does not rescue it. The commission funds the research work: reading specification sheets, checking recall databases, and analysing owner feedback."
          ],
        },
        {
          eyebrow: "02 / Sample policy",
          title: "We prefer anonymous purchase over brand theater",
          body: [
            "When a product is important enough to audit, we do not accept review units, pre-approved verdicts, or paid edits. Brands cannot rewrite our reasoning, and every ranking decision keeps the sources behind it attached to the page.",
            "If we ever use manufacturer-provided material, it is treated as source evidence, not gospel. Specs are cross-checked against category benchmarks, field logic, and the same mechanical scoring system used across the site."
          ],
        },
        {
          eyebrow: "03 / Liability boundary",
          title: "Data guidance is not a legal certificate",
          body: [
            "BalanceBikeToddler score indexes, rim-size suggestions, load-ratio warnings, and shortlist recommendations are independent, evidence-based editorial assessments. They do not replace official certifications, pediatric advice, manufacturer manuals, or local safety law.",
            "Parents should always inspect the final product, follow age and weight limits, use protective gear, and stop using any product that behaves differently from its manual or from common sense."
          ],
        },
      ],
      primaryLink: {
        href: "/reviews",
        label: "See the review desk",
        text: "Trace this independence pledge into our evidence-based reviews, where every score has to survive the same editorial firewall.",
      },
      secondaryLink: {
        href: "/products",
        label: "Compare product data",
        text: "Use the product hub to compare the raw specs that feed our verdicts before you trust any shortlist.",
      },
      seo: {
        title: "BalanceBikeToddler Independent Disclaimer & Affiliate Disclosure",
        description: "Read BalanceBikeToddler's independent declaration: no paid rankings, no brand recharge, anonymous testing preference, and clear affiliate disclosure.",
        keywords: ["BalanceBikeToddler disclaimer", "affiliate disclosure", "independent reviews", "kids mobility safety"],
      },
    },
    zh: {
      path: TRANSPARENCY_PAGE_PATHS.disclaimer,
      navLabel: "Disclaimer",
      title: "独立宣言：不接受品牌充值，不出售评分温柔乡",
      subtitle: "我们不卖排名。我们购买、测量、施压、拆解，并在必要时让不合格童车产品接受物理意义上的退场。",
      intro: "BalanceBikeToddler 存在的原因很简单：商品详情页不会告诉你车架何时开始晃、刹车何时慢半拍、承重何时越过红线。这是我们的操作誓言。",
      sections: [
        {
          eyebrow: "01 / 资金来源",
          title: "佣金是燃料，不是方向盘",
          body: [
            "部分页面可能包含商业链接。家长通过这些链接购买时，BalanceBikeToddler 可能获得微薄佣金。但这笔钱买不到更高分数、更软标题，也买不到隐藏缺点的编辑通行证。",
            "我们的规则很硬：测试结果先走，链接随后。产品如果没有通过安全逻辑，佣金潜力救不了它。佣金只会继续资助下一台匿名样机、下一根备用刹车线、下一次断轮夹具和拆解测试。"
          ],
        },
        {
          eyebrow: "02 / 样机原则",
          title: "我们拒绝样机置换与付费改稿",
          body: [
            "我们不接受样机置换、付费改稿或预先审稿；品牌不能预审结论、改写缺点或要求删除来源备注。",
            "如果必须引用品牌资料，我们只把它当作证据来源，而不是圣旨。参数仍要经过品类基准、场景逻辑和全站统一机械评分系统交叉检查。"
          ],
        },
        {
          eyebrow: "03 / 责任边界",
          title: "数据建议不是法律证书",
          body: [
            "BalanceBikeToddler 的评分、轮径建议、车重警示与选购结论均为独立力学评估和编辑判断，不替代官方认证、儿科医生建议、品牌说明书或当地安全法规。",
            "家长仍应检查最终到手产品，遵守年龄与体重限制，佩戴必要护具；任何产品表现与说明书或常识不一致时，都应立即停止使用。"
          ],
        },
      ],
      primaryLink: {
        href: "/reviews",
        label: "查看评测中心",
        text: "把这份独立宣言追踪到我们的评测中心，那里每个分数都必须穿过同一套编辑防火墙。",
      },
      secondaryLink: {
        href: "/products",
        label: "比较产品数据",
        text: "进入产品库比较喂给结论的原始参数，再决定是否信任任何推荐清单。",
      },
      seo: {
        title: "BalanceBikeToddler Independent Disclaimer & Affiliate Disclosure",
        description: "Read BalanceBikeToddler's independent declaration: no paid rankings, no brand recharge, anonymous testing preference, and clear affiliate disclosure.",
        keywords: ["BalanceBikeToddler disclaimer", "affiliate disclosure", "independent reviews", "kids mobility safety"],
      },
    },
  },
  {
    key: "testing-methodology",
    en: {
      path: TRANSPARENCY_PAGE_PATHS["testing-methodology"],
      navLabel: "Testing Methodology",
      title: "Evaluation Methodology: The Evidence Behind Every Verdict",
      subtitle: "Our score is not a vibe. It is a collision between child-fit math, mechanical stress logic, braking audits, and editorial suspicion.",
      intro: "BalanceBikeToddler reviews are built for parents who want to know what happens after the lifestyle photo ends and physics starts asking questions.",
      sections: [
        {
          eyebrow: "01 / 30% load line",
          title: "The 30% body-weight rule",
          body: [
            "A kids mobility product that is too heavy for the child does not merely feel inconvenient; it changes recovery time, steering correction, and tip-over risk. Our sizing logic flags products that push the ride system beyond roughly 30% of the child's body weight.",
            "This rule powers stroller, balance bike, kids bike, and scooter recommendations because weight is the silent variable behind confidence, fatigue, and loss-of-control moments."
          ],
        },
        {
          eyebrow: "02 / Brake audit",
          title: "Braking sanity check",
          body: [
            "For scooters, bikes, and jogging stroller scenarios, we treat braking as a system, not a marketing bullet. Lever reach, wheel grip, deck stance, frame flex, and caregiver reaction window all matter.",
            "Our editorial model penalizes vague brake claims and rewards designs that make stopping predictable for smaller hands, tired parents, and imperfect pavement."
          ],
        },
        {
          eyebrow: "03 / Geometry and recline",
          title: "170-degree recline and frame-stability geometry review",
          body: [
            "For stroller and sleep-oriented products, recline angle, basket flatness, suspension response, and center-of-gravity movement are inspected as one mechanical story. A 170-degree claim is only useful if the structure remains stable and the child is not forced into a compromised posture.",
            "For bikes and scooters, geometry review shifts toward Q-factor, handlebar reach, deck width, wheelbase, and the way those variables behave when the child is still learning."
          ],
        },
      ],
      primaryLink: {
        href: "/reviews",
        label: "Read methodology-backed reviews",
        text: "Use the review center to see how these rules translate into real product verdicts and category rankings.",
      },
      secondaryLink: {
        href: "/products",
        label: "Audit the product database",
        text: "Open the product hub when you want to compare weight, price, and safety fields before reading a final score.",
      },
      seo: {
        title: "BalanceBikeToddler Evaluation Methodology: Kids Mobility Evidence Playbook",
        description: "Explore BalanceBikeToddler's testing methodology: the 30% weight rule, brake-setup reviews, recline checks, and frame-stability logic.",
        keywords: ["testing methodology", "kids mobility lab", "brake audit", "stroller safety testing"],
      },
    },
    zh: {
      path: TRANSPARENCY_PAGE_PATHS["testing-methodology"],
      navLabel: "Testing Methodology",
      title: "每个结论背后的评估方法论",
      subtitle: "我们的评分不是感觉，而是儿童尺寸数学、机械应力逻辑、制动审计和编辑怀疑精神的碰撞结果。",
      intro: "BalanceBikeToddler 评测写给那些想知道生活方式美图结束后，物理世界会怎样发问的家长。",
      sections: [
        {
          eyebrow: "01 / 30% 红线",
          title: "体重 30% 车重红线规则",
          body: [
            "对孩子来说，过重的出行产品不只是费劲，它会改变恢复时间、转向修正能力和倾覆风险。我们的尺寸逻辑会标记接近或超过孩子体重 30% 的骑乘系统。",
            "这条规则贯穿推车、平衡车、儿童自行车和滑板车推荐，因为重量是自信、疲劳和失控瞬间背后的隐形变量。"
          ],
        },
        {
          eyebrow: "02 / 制动审计",
          title: "刹车系统合理性审查",
          body: [
            "对滑板车、自行车和慢跑推车场景，我们把制动视为系统，而不是广告卖点。把距、轮胎抓地、踏板站姿、车架形变和家长反应窗口都要一起看。",
            "模型会惩罚含糊的刹车宣传，奖励那些让小手、疲惫家长和非完美路面都能获得可预期制动感的设计。"
          ],
        },
        {
          eyebrow: "03 / 几何与躺角",
          title: "170° 睡篮平整度与车架稳定几何审查",
          body: [
            "对推车和睡眠相关产品，躺角、睡篮平整度、悬挂响应和重心移动必须作为同一个机械故事来判断。170° 宣称只有在结构仍然稳定、孩子姿态不被迫妥协时才有意义。",
            "对自行车和滑板车，几何审查转向 Q-factor、把横距离、踏板宽度、轴距，以及这些变量在孩子仍处于学习期时的表现。"
          ],
        },
      ],
      primaryLink: {
        href: "/reviews",
        label: "阅读方法论支撑的评测",
        text: "进入评测中心，查看这些规则如何转化为真实产品结论和品类排行。",
      },
      secondaryLink: {
        href: "/products",
        label: "审计产品数据库",
        text: "想在阅读最终分数前比较重量、价格和安全字段，可先打开产品库。",
      },
      seo: {
        title: "BalanceBikeToddler Evaluation Methodology: Kids Mobility Evidence Playbook",
        description: "Explore BalanceBikeToddler's testing methodology: the 30% weight rule, brake-setup reviews, recline checks, and frame-stability logic.",
        keywords: ["testing methodology", "kids mobility lab", "brake audit", "stroller safety testing"],
      },
    },
  },
  {
    key: "certification",
    en: {
      path: TRANSPARENCY_PAGE_PATHS.certification,
      navLabel: "Certification & Standards Notes",
      title: "Certification & Standards Notes: The Benchmarks Every Model Is Checked Against",
      subtitle: "We are not a certification body. We are a hostile reader of standards, manuals, claims, and product behavior.",
      intro: "Every product category has a safety vocabulary. We use international standards as the floor, then ask whether the product still makes sense in a real family workflow.",
      sections: [
        {
          eyebrow: "Matrix / Public standards",
          title: "The baseline references",
          body: [
            "CPSC safety frameworks guide how we read mandatory consumer-product risk language in the United States. ASTM F963 informs toy-adjacent material and heavy-metal caution logic. ISO 8098 gives structure to children's bicycle safety expectations.",
            "EN 71, GB 14746, stroller-category guidance, and brand manuals are used as context when a product crosses borders or mixes categories. We cite these frameworks as editorial references, not as proof that every listed product is certified."
          ],
        },
        {
          eyebrow: "Lab notes / Evidence handling",
          title: "Source claims are evidence, not verdicts",
          body: [
            "A certification badge in a product description earns attention, not automatic trust. We still compare the claim against product category, visible construction, documented limits, and the failure modes parents actually face.",
            "When a product source does not show a certificate, we do not invent one. When it does show one, we do not let the badge erase poor ergonomics, weak brakes, confusing assembly, or bad weight math."
          ],
        },
        {
          eyebrow: "Audit trail / Editorial memory",
          title: "Why source notes stay attached to reviews",
          body: [
            "Our source notes preserve the reason a product was promoted, downgraded, or excluded. This matters when new versions appear, stock photos change, or a marketplace listing quietly rewrites its claims.",
            "The standards matrix helps crawlers and parents understand that BalanceBikeToddler is not a coupon blog wearing a lab coat. The review has an evidence trail."
          ],
        },
      ],
      primaryLink: {
        href: "/reviews",
        label: "Open standards-aware reviews",
        text: "Read the review center to see where certification context meets hands-on category judgment.",
      },
      secondaryLink: {
        href: "/products",
        label: "Inspect listed products",
        text: "Use the product hub to compare product fields before trusting any certificate badge or marketing claim.",
      },
      seo: {
        title: "BalanceBikeToddler Certification Notes: CPSC, ASTM, ISO & Lab Matrix",
        description: "See the standards BalanceBikeToddler references, including CPSC, ASTM F963, ISO 8098, EN 71, and editorial lab-note handling.",
        keywords: ["certification notes", "CPSC", "ASTM F963", "ISO 8098", "lab standards"],
      },
    },
    zh: {
      path: TRANSPARENCY_PAGE_PATHS.certification,
      navLabel: "Certification & Standards Notes",
      title: "权威护身符：我们放在实验台边上的标准矩阵",
      subtitle: "我们不是认证机构。我们是标准、说明书、宣传语和产品行为的敌意阅读者。",
      intro: "每个品类都有自己的安全语法。我们把国际标准当作地板，再追问这个产品放进真实家庭流程里是否仍然合理。",
      sections: [
        {
          eyebrow: "矩阵 / 公开标准",
          title: "底层参考框架",
          body: [
            "CPSC 安全框架帮助我们阅读美国强制消费品风险语言。ASTM F963 支撑玩具相邻材料与重金属风险判断。ISO 8098 为儿童自行车安全期待提供结构。",
            "EN 71、GB 14746、推车品类指南和品牌说明书会在跨境或混合品类产品中作为语境参考。我们引用这些框架作为编辑参考，而不是宣称每个列出产品都已获得认证。"
          ],
        },
        {
          eyebrow: "来源日志 / 证据处理",
          title: "来源声明是证据，不是结论",
          body: [
            "商品描述里的认证徽章值得关注，但不会自动获得信任。我们仍会把声明放回品类、可见结构、限制条件和家长真正面对的失效场景里比较。",
            "产品来源没有展示证书时，我们不会编造；展示证书时，也不会让徽章掩盖糟糕人体工学、弱刹车、混乱装配或错误重量逻辑。"
          ],
        },
        {
          eyebrow: "审计轨迹 / 编辑记忆",
          title: "为什么来源日志要挂在评测旁边",
          body: [
            "来源日志保留一个产品被推荐、降级或排除的原因。当新版本出现、库存图变化、平台页面悄悄改写宣传语时，这种记忆很重要。",
            "标准矩阵帮助爬虫和家长理解：BalanceBikeToddler 不是穿着白大褂的优惠券博客，评测背后有证据链。"
          ],
        },
      ],
      primaryLink: {
        href: "/reviews",
        label: "打开带标准语境的评测",
        text: "进入评测中心，查看认证语境如何与真实品类判断碰撞。",
      },
      secondaryLink: {
        href: "/products",
        label: "检查产品字段",
        text: "进入产品库，在相信任何认证徽章或营销话术前先比较产品字段。",
      },
      seo: {
        title: "BalanceBikeToddler Certification Notes: CPSC, ASTM, ISO & Lab Matrix",
        description: "See the standards BalanceBikeToddler references, including CPSC, ASTM F963, ISO 8098, EN 71, and editorial lab-note handling.",
        keywords: ["certification notes", "CPSC", "ASTM F963", "ISO 8098", "lab standards"],
      },
    },
  },
  {
    key: "terms",
    en: {
      path: TRANSPARENCY_PAGE_PATHS.terms,
      navLabel: "Terms",
      title: "Terms of Use: Safety Guidance, Not a Substitute for Judgment",
      subtitle: "This site provides research-backed product guidance for families, not legal, medical, or product-certification advice.",
      intro: "BalanceBikeToddler exists to help parents compare child mobility products using clear safety logic, frictionless search, and evidence-based editorial notes. These terms explain the scope of that help and the limits of our responsibility.",
      sections: [
        {
          eyebrow: "01 / Scope",
          title: "Content is educational and decision-support oriented",
          body: [
            "The reviews, guides, comparison tools, and pages on BalanceBikeToddler are intended to help families evaluate product fit, risk, usability, and comparative safety. They are not legal advice, medical advice, or a formal product certification.",
            "Parents remain responsible for verifying the exact product they purchase, following age and weight limits, checking local regulations, and supervising children during use."
          ],
        },
        {
          eyebrow: "02 / Editorial independence",
          title: "We are not a marketing channel, and we do not sell rankings",
          body: [
            "BalanceBikeToddler may earn a small commission from qualifying purchases when a parent clicks a product link and buys. That does not change the underlying editorial standard, which remains based on safety evidence, testing logic, and product behavior.",
            "We do not guarantee that any product is risk-free, universally suitable, or compliant in every jurisdiction. We do not accept payment to alter a verdict or suppress a safety concern."
          ],
        },
        {
          eyebrow: "03 / Access and data",
          title: "We provide a service, not a guarantee of perfection",
          body: [
            "Site features such as saved compares, view history, Smart Wizard hints, and bookmarks may depend on browser storage and account features. We aim for utility and security, but availability can vary with browser settings, connectivity, or product updates.",
            "If a parent relies on guidance from this site, the parent should exercise judgment, confirm current specs, and keep a healthy skepticism toward marketing claims, model revisions, and outdated listings."
          ],
        },
      ],
      primaryLink: {
        href: "/reviews",
        label: "Read the evidence base",
        text: "Open the review desk to see how product verdicts are built, challenged, and traced back to real safety logic.",
      },
      secondaryLink: {
        href: "/transparency/privacy-policy/",
        label: "Review the privacy policy",
        text: "See how measured fit data and local browser drafts are treated before you choose account features or share account-level data.",
      },
      seo: {
        title: "BalanceBikeToddler Terms of Use: Safety Guidance, Not Legal or Medical Advice",
        description: "Read BalanceBikeToddler’s terms of use: independent editorial guidance, affiliate disclosure, parent responsibility, and safety limits.",
        keywords: ["terms of use", "BalanceBikeToddler terms", "safety guidance", "parent review policy"],
      },
    },
    zh: {
      path: TRANSPARENCY_PAGE_PATHS.terms,
      navLabel: "Terms",
      title: "使用条款：安全指导，不是替代判断的结论",
      subtitle: "本网站为家庭提供研究支持型产品指导，不构成法律、医疗或正式认证建议。",
      intro: "BalanceBikeToddler 旨在帮助家长通过清晰安全逻辑、便捷筛选和证据导向编辑说明比较童车产品。这些条款说明了我们的帮助范围和责任边界。",
      sections: [
        {
          eyebrow: "01 / 范围",
          title: "内容是教育与决策支持性质",
          body: [
            "本网站的评测、指南、比较工具和页面，旨在帮助家庭评估产品适配度、风险、可用性和安全比对。它们不构成法律建议、医疗建议，也不是正式产品认证。",
            "家长仍需自行核实实际购买产品，遵守年龄和重量限制，检查当地法规，并在使用过程中对孩子进行必要监护。"
          ],
        },
        {
          eyebrow: "02 / 编辑独立性",
          title: "我们不是营销渠道，也不出售排名",
          body: [
            "当家长点击并购买合格商品时，BalanceBikeToddler 可能获得少量佣金。这不会改变底层编辑标准，因为评分仍然依据安全证据、测试逻辑和产品表现。",
            "我们不保证任何产品零风险、适用于所有人，或在每个司法辖区都完全合规。我们也不会接受支付来修改结论或压制安全问题。"
          ],
        },
        {
          eyebrow: "03 / 访问与数据",
          title: "我们提供服务，不保证完美",
          body: [
            "对比列表、浏览记录、Smart Wizard 提示和收藏等功能可能依赖浏览器存储和账号功能。我们致力于实用与安全，但可用性可能受浏览器设置、网络连接或产品更新影响。",
            "如果家长依赖本网站的指导，应自行判断并确认当前产品参数，并保持对营销话术、型号更新和过期信息的健康怀疑。"
          ],
        },
      ],
      primaryLink: {
        href: "/reviews",
        label: "阅读证据基础",
        text: "打开评测中心，查看产品结论如何形成、被挑战，并如何回溯到实际的安全逻辑。",
      },
      secondaryLink: {
        href: "/transparency/privacy-policy/",
        label: "查看隐私政策",
        text: "在选择账号功能或共享账号级数据前，先了解尺寸数据和本地草稿的处理方式。",
      },
      seo: {
        title: "BalanceBikeToddler Terms of Use: Safety Guidance, Not Legal or Medical Advice",
        description: "Read BalanceBikeToddler’s terms of use: independent editorial guidance, affiliate disclosure, parent responsibility, and safety limits.",
        keywords: ["terms of use", "BalanceBikeToddler terms", "safety guidance", "parent review policy"],
      },
    },
  },
  {
    key: "privacy-policy",
    en: {
      path: TRANSPARENCY_PAGE_PATHS["privacy-policy"],
      navLabel: "Privacy Policy",
      title: "Privacy Policy: The Parent Data Firewall",
      subtitle: "Your child's fit data is not inventory. Smart Wizard measurements stay local unless you deliberately choose account features.",
      intro: "BalanceBikeToddler handles sizing data like a lab handles a volatile sample: use it for the current measurement, keep the minimum needed, and never sell it to the advertising machine.",
      sections: [
        {
          eyebrow: "01 / Smart Wizard",
          title: "Height, inseam, and fit math burn locally",
          body: [
            "The Smart Wizard on the Guides page may ask for child height, age, weight, inseam-like fit clues, and riding context. Those calculations are performed in the browser to return sizing guidance and category suggestions.",
            "We do not package, sell, or broker children's biomechanical data. The point is to help the parent choose a safer product, not to build a child-profile commodity."
          ],
        },
        {
          eyebrow: "02 / Local drafts",
          title: "Browsing history and comparisons begin in your browser",
          body: [
            "Recent views, comparison drafts, and unauthenticated shortlist behavior are stored in local browser storage so the site can feel useful without forcing a login. Clear the browser storage and those drafts disappear.",
            "When a user signs in, account features may support bookmarks, saved reports, and admin access. We keep that scope narrow and tied to site utility."
          ],
        },
        {
          eyebrow: "03 / No ad marketplace",
          title: "We do not sell parent attention as a product",
          body: [
            "BalanceBikeToddler avoids advertising trackers and does not sell personal data. We use privacy-sensitive analytics and operational logs only to keep the site stable, detect abuse, and understand which safety resources actually help families.",
            "If we ever expand data use, the rule remains simple: explain it plainly, keep it proportional, and never turn a child's measurements into a growth-hacking asset."
          ],
        },
      ],
      primaryLink: {
        href: "/reviews",
        label: "Read privacy-aware reviews",
        text: "Use the review center to see how privacy-light research, safety evidence, and product verdicts connect without selling child-fit data.",
      },
      secondaryLink: {
        href: "/products",
        label: "Compare products privately",
        text: "Move from local sizing logic into the product hub when you are ready to compare safer candidates.",
      },
      seo: {
        title: "BalanceBikeToddler Privacy Policy: Parent Data Firewall",
        description: "BalanceBikeToddler privacy policy for parents: local Smart Wizard sizing, no sale of child fit data, and narrow account data use.",
        keywords: ["privacy policy", "parent data", "Smart Wizard", "child fit data", "BalanceBikeToddler privacy"],
      },
    },
    zh: {
      path: TRANSPARENCY_PAGE_PATHS["privacy-policy"],
      navLabel: "Privacy Policy",
      title: "家长定心丸：儿童数据防火墙",
      subtitle: "孩子的尺寸数据不是库存。Smart Wizard 的测算默认留在本地，除非你主动选择账号功能。",
      intro: "BalanceBikeToddler 只在当前测算中使用尺寸数据：只为当前测算使用，保留最少必要信息，绝不卖给广告机器。",
      sections: [
        {
          eyebrow: "01 / Smart Wizard",
          title: "身高、腿长与适配公式在本地测完即焚",
          body: [
            "指南页 Smart Wizard 可能会询问孩子身高、年龄、体重、腿长线索和骑行场景。这些计算在浏览器本地完成，用来返回尺寸建议和品类选择。",
            "我们不打包、出售或转卖儿童生物力学数据。它的目的只是帮助家长选择更安全的产品，而不是把孩子画像变成商品。"
          ],
        },
        {
          eyebrow: "02 / 本地草稿",
          title: "最近浏览和对比从浏览器开始",
          body: [
            "最近浏览、对比草稿和未登录候选清单会保存在本地浏览器存储中，让网站在不强迫登录的前提下仍然有用。清理浏览器存储，这些草稿就会消失。",
            "用户登录后，账号功能可能支持收藏、保存报告和管理权限。我们会把范围限制在站点实用功能之内。"
          ],
        },
        {
          eyebrow: "03 / 无广告市场",
          title: "不把家长注意力卖成产品",
          body: [
            "BalanceBikeToddler 避免广告追踪器，不出售个人数据。只使用隐私友好的分析和运行日志来保持站点稳定、识别滥用，并理解哪些安全资源真正帮助家庭。",
            "如果未来扩展数据使用，规则仍然简单：讲清楚、保持比例、绝不把孩子尺寸变成增长黑客资产。"
          ],
        },
      ],
      primaryLink: {
        href: "/reviews",
        label: "阅读隐私友好的评测",
        text: "进入评测中心，查看轻数据研究、安全证据和产品结论如何连接，而不是把儿童尺寸数据卖出去。",
      },
      secondaryLink: {
        href: "/products",
        label: "私密比较产品",
        text: "完成本地尺寸判断后，再进入产品库比较更安全的候选产品。",
      },
      seo: {
        title: "BalanceBikeToddler Privacy Policy: Parent Data Firewall",
        description: "BalanceBikeToddler privacy policy for parents: local Smart Wizard sizing, no sale of child fit data, and narrow account data use.",
        keywords: ["privacy policy", "parent data", "Smart Wizard", "child fit data", "BalanceBikeToddler privacy"],
      },
    },
  },
  {
    key: "search-data",
    en: {
      path: TRANSPARENCY_PAGE_PATHS["search-data"],
      navLabel: "Search Data",
      title: "Search Performance Note: Publishing Our Own Baseline, Including the Bad Parts",
      subtitle:
        "Across 59 days this site earned 171 search impressions and zero external clicks. Here is that export read honestly, what it made us build, and what it cannot be used to claim.",
      intro:
        "Most sites publish their wins. Publishing a pre-traffic baseline is cheaper than pretending, and it makes every future number checkable against a figure anyone can return to. Every number below comes from one export file for this property alone.",
      measuredLine:
        "Export: balancebiketoddler.com-Performance-on-Search-2026-10-13.zip · window 13 Aug - 10 Oct 2026 (59 days) · analysed 13 Oct 2026 · next re-measurement due mid-November 2026",
      metrics: [
        {
          value: "171",
          label: "Impressions in 59 days",
          note: "query report — roughly 1.9 a day, noise-level",
        },
        {
          value: "0",
          label: "External clicks",
          note: "all 14 logged clicks were visits by this site's own operator",
        },
        {
          value: "94.7%",
          label: "Of impressions are balance-bike terms",
          note: "162 of 171, across 59 queries",
        },
        {
          value: "8.9%",
          label: "Of product pages are balance bikes",
          note: "16 of 179 — the mismatch driving everything below",
        },
      ],
      sections: [
        {
          eyebrow: "01 / Caveat",
          title: "Read this before trusting any single total",
          body: [
            "The export contains four tables that disagree with each other. The query report totals 0 clicks and 171 impressions, the page report totals 27 clicks and 1,061 impressions, and the daily chart totals 14 clicks and 348 impressions. At this volume Search Console thresholds and suppresses rows, so none of the three can be treated as the real total.",
            "What remains usable is relative structure: which queries exist, which countries appear, and how those group into intents. Everything on this page is drawn from the query report, which is internally consistent row by row. Nothing here supports a traffic forecast.",
            "A second caution: every one of those 14 clicks came from China (10), Hong Kong (2), the United Kingdom (1) and Japan (1), almost all at an average position near 1. A site's own operator checking its rankings produces that signature, so clicks were excluded from the analysis entirely — they say nothing about audience demand.",
          ],
          table: {
            columns: ["Table in the export", "Clicks", "Impressions", "What it can be used for"],
            rows: [
              ["Query report", "0", "171", "Intent structure — the source of every figure here"],
              ["Page report", "27", "1,061", "Which URLs Google associates with this domain"],
              ["Daily chart", "14", "348", "Shape of the trend, never absolute totals"],
              ["Search appearance", "0", "70", "Product snippets parsed but surfaced nowhere useful"],
            ],
          },
        },
        {
          eyebrow: "02 / Demand",
          title: "Almost all of it is balance bikes",
          body: [
            "68 distinct queries appeared. Grouped by theme the split is lopsided: balance-bike terms — including walking bike and balancing bicycle — account for 59 queries and 162 impressions, or 94.7% of everything we were shown. The remaining 6 queries and 6 impressions in that comparison are all stroller terms.",
            "The largest single row is balance bike toddler at 19 impressions, average position 55.26. Every major row sits past page five: best balance bike for toddlers at 56.91, balance bike for 2 year old at 68.36, balance bikes for 2 year olds at 72.00.",
            "Zero clicks at position 55 is not a headline problem. It is a depth problem — nothing ranked in the sixties is being read by anyone.",
          ],
          table: {
            columns: ["Theme", "Queries", "Impressions", "Share"],
            rows: [
              ["Balance bike (includes walking bike)", "59", "162", "94.7%"],
              ["Stroller / playard", "6", "6", "3.5%"],
              ["Other — electric and brand-name rows", "3", "3", "1.8%"],
            ],
          },
        },
        {
          eyebrow: "03 / Mismatch",
          title: "The domain promises balance bikes; the inventory says otherwise",
          body: [
            "Joining the query data against our own sitemap produces the most decision-relevant number in this export. Balance-bike demand is 94.7% of impressions, but only 16 of 179 published product pages are balance bikes. Strollers are 78 pages; electric cars, tricycles, scooters and car seats add 61 more.",
            "This does not make those other catalogues bad products. It means a crawler meeting this domain spends most of its budget having a question answered that nobody asked.",
            "The correction we shipped removed prominence rather than content. From 30 September and again on 13 October, every category except balance bikes and kids bikes moved below a labelled subordinate divider on the product hub and the homepage, and their sitemap priority dropped to 0.4 against 0.6 for a balance-bike page. Off-domain demand is 6 impressions across 6 queries, so the data gives no reason to roll that back.",
          ],
          table: {
            columns: ["Signal", "Value"],
            rows: [
              ["Balance-bike share of query impressions", "94.7%"],
              ["Product pages that are balance bikes", "16 of 179 (8.9%)"],
              ["Product pages that are strollers", "78 of 179 (43.6%)"],
              ["Other ride-on / nursery pages", "61"],
              ["Impressions from stroller-family queries", "6"],
            ],
          },
        },
        {
          eyebrow: "04 / Response",
          title: "Five assets, each aimed at a cluster this export proved exists",
          body: [
            "Age was the largest single intent and had no home. 27 of 68 queries carry an explicit age — for 2 year old, 18 month old, for 2-3 year old — together 63 impressions, 37% of the total. 15 of those 27 contain no word best, which makes this a fit question rather than a shopping-list question. The by-age page answers it from each manufacturer's own published age range and refuses to fill gaps: one KRIDDO model carries an age claim in its title but publishes no numeric spec, so it is listed separately rather than estimated.",
            "The only three queries this domain has ever ranked inside the top 20 all contain the phrase stable track, at positions 10.71, 11.00 and 20.00. The stability and track-width page was built from that signal, though it shipped on the final day of the export window, so attribution for those three rows remains unconfirmed.",
            "The rest of the sequence — size chart and spec comparison, safety standards with EU Safety Gate recall data, and weight and build — targets the same 95% cluster from different angles. None has enough history inside this window to be judged by it.",
            "One deliberate refusal: brand long tails such as baaltto, haweek and avenor balance bike total roughly 10 impressions at 1–2 each, and several are not in our catalogue at all. Building single-brand pages to chase single-impression rows is how thin affiliate sites are made, so we did not build them.",
          ],
          table: {
            caption:
              "Age coverage as actually published by each manufacturer — 14 of 15 balance bikes publish a numeric age range",
            columns: ["Child's age", "Models still rated for it"],
            rows: [
              ["18 months", "11 of 14"],
              ["2 years", "14 of 14"],
              ["2.5 years", "7 of 14"],
              ["3 years", "7 of 14"],
              ["4 years", "4 of 14"],
              ["Beyond 60 months", "0 of 14"],
            ],
          },
        },
        {
          eyebrow: "05 / Limits",
          title: "What this page is not allowed to mean",
          body: [
            "This is 59 days on a domain nobody knows yet. It is not a trend, not a penalty diagnosis, and not evidence that any individual page deserves protection — including pages we built and like.",
            "The one number worth re-measuring is the United States row: 156 impressions, 0 clicks, average position 52.83. If that has not moved within about 30 days, after five original dataset pages have shipped, then the constraint is not page-level. In that case the honest answer is to say so rather than ship a sixth page into the same wall.",
            "Finally, we publish these figures about our own property only in aggregate. Individual rows of the export are summarised into the tables above rather than reproduced verbatim.",
          ],
        },
      ],
      primaryLink: {
        href: "/balance-bike-by-age/",
        label: "Balance bikes by age",
        text: "The page built from the largest intent cluster in this export: 27 queries carrying an explicit child's age.",
      },
      secondaryLink: {
        href: "/balance-bike-stability/",
        label: "Stability & track width",
        text: "The page built to serve this domain's only top-20 queries, all three of which contain stable track.",
      },
      seo: {
        title: "Search Performance Note: Our Own Baseline, Published in Full",
        description:
          "Our Google Search Console baseline for balancebiketoddler.com: 171 impressions, 0 external clicks, 94.7% balance-bike demand against 8.9% balance-bike inventory — and what we changed because of it.",
        keywords: ["search performance note", "balance bike search demand", "site transparency report", "balancebiketoddler data"],
      },
    },
    zh: {
      path: TRANSPARENCY_PAGE_PATHS["search-data"],
      navLabel: "Search Data",
      title: "搜索表现说明：公开我们自己的基线，包括难看的那部分",
      subtitle: "在 59 天里，本站共获得 171 次搜索展示、0 次外部点击。这是对那份导出文件的诚实解读，包括它促使我们做了什么，以及它不能被用来证明什么。",
      intro: "大多数网站只公开自己的胜利。公开一份零流量基线比假装体面更便宜，而且它让以后每个数字都能回到这里被核对。以下每个数字都来自同一份本站专属导出文件。",
      measuredLine:
        "导出文件：balancebiketoddler.com-Performance-on-Search-2026-10-13.zip · 时间窗 2026-08-13 至 2026-10-10（59 天）· 分析日期 2026-10-13 · 下次复测 2026 年 11 月中旬",
      metrics: [
        { value: "171", label: "59 天展示量", note: "查询报告口径，约每天 1.9 次，属于噪声级" },
        { value: "0", label: "外部点击", note: "记录到的 14 次点击全部来自本站运营者自己" },
        { value: "94.7%", label: "展示量来自平衡车词", note: "171 次中 162 次，覆盖 59 个查询词" },
        { value: "8.9%", label: "产品页是平衡车", note: "179 个中 16 个——下面所有结论都源于这个错位" },
      ],
      sections: [
        {
          eyebrow: "01 / 前提",
          title: "在相信任何一个总数之前，先读这段",
          body: [
            "导出文件里四张表互相矛盾。查询报告是 0 点击 / 171 展示，页面报告是 27 点击 / 1,061 展示，日趋势图是 14 点击 / 348 展示。在这个量级上，Search Console 会做阈值化处理并隐藏行，因此三者都不能被当作真实总量。",
            "仍然可用的是相对结构：哪些词出现、哪些国家出现、它们如何聚合成意图。本页所有数字取自查询报告——它逐行自洽。这里没有任何内容可以用于预测流量。",
            "第二个提醒：那 14 次点击全部来自中国（10）、中国香港（2）、英国（1）和日本（1），平均排名几乎都在第 1 位附近。运营者自己查排名的典型特征就是这种分布，所以点击被完全排除在分析之外——它无法说明受众需求。",
          ],
          table: {
            columns: ["导出中的表", "点击", "展示", "能用来做什么"],
            rows: [
              ["查询报告", "0", "171", "意图结构——本页所有数字的来源"],
              ["页面报告", "27", "1,061", "谷歌把哪些 URL 与本域名关联"],
              ["日趋势图", "14", "348", "趋势形状，绝不能用作总量"],
              ["搜索外观", "0", "70", "Product 摘要被解析了，但没出现在有用位置"],
            ],
          },
        },
        {
          eyebrow: "02 / 需求",
          title: "几乎全部是平衡车",
          body: [
            "一共出现 68 个查询词。按主题分组后结果非常偏：平衡车类词（含 walking bike、balancing bicycle）占 59 个词、162 次展示，即全部展示量的 94.7%。剩下同一口径里的 6 个词、6 次展示全部是推车类词。",
            "最大单行是 balance bike toddler，19 次展示，平均排名 55.26。所有主要词条都落在第五页之后：best balance bike for toddlers 为 56.91，balance bike for 2 year old 为 68.36，balance bikes for 2 year olds 为 72.00。",
            "排在第 55 位的零点击不是标题写得不好，而是深度问题——排在六十多名的东西，根本没有人会看到。",
          ],
          table: {
            columns: ["主题", "词数", "展示", "占比"],
            rows: [
              ["平衡车（含 walking bike）", "59", "162", "94.7%"],
              ["推车 / 游戏床", "6", "6", "3.5%"],
              ["其他——电动与品牌行", "3", "3", "1.8%"],
            ],
          },
        },
        {
          eyebrow: "03 / 错位",
          title: "域名承诺平衡车，库存说的却是另一回事",
          body: [
            "把查询数据和我们自己的 sitemap 关联起来，就得到这份导出里最有决策价值的数字。平衡车需求占展示量 94.7%，但 179 个产品页里只有 16 个是平衡车。推车 78 个，电动车、三轮车、滑板车和安全座椅再占 61 个。",
            "这不代表这些产品线本身不好。它意味着：爬虫访问本域名时，大部分抓取预算被用在回答一个没人问的问题上。",
            "我们上线的修正方式是降低权重，而不是删除内容。自 9 月 30 日、并在 10 月 13 日再度调整之后，除平衡车与儿童自行车以外的所有品类在产品聚合页和首页都被移到一条明确标注的从属分隔线之下，sitemap 优先级降到 0.4（平衡车产品页为 0.6）。这些偏题需求只有 6 个词、6 次展示，数据里没有任何理由回滚这一步。",
          ],
          table: {
            columns: ["信号", "数值"],
            rows: [
              ["平衡车占查询展示量比例", "94.7%"],
              ["平衡车产品页", "179 个里 16 个（8.9%）"],
              ["推车产品页", "179 个里 78 个（43.6%）"],
              ["其他骑乘 / 育儿产品页", "61"],
              ["来自推车类词的展示量", "6"],
            ],
          },
        },
        {
          eyebrow: "04 / 应对",
          title: "五个数据资产，各对应一个被证明存在的聚类",
          body: [
            "年龄是最大的单一意图，而且此前没有任何页面承接它。68 个词中有 27 个带明确年龄（for 2 year old、18 month old、for 2-3 year old），合计 63 次展示、占比 37%。这 27 个词里有 15 个不含 best，因此这是合不合适的问题，而不是买哪个最划算的问题。按年龄页用每个厂家自己公布的年龄区间作答，并拒绝补空：有一款 KRIDDO 的标题里写了适用年龄，却没有公布数字参数，于是被单独列出，而不是估算。",
            "本域名唯一进过前 20 名的三个词全部包含 stable track，排名分别为 10.71、11.00 和 20.00。稳定性与轮距页就是依据这个信号建的，只是它在导出窗口的最后一天才上线，因此这三行数据到底归给哪个页面仍未验证。",
            "其余几项——尺寸与参数对照、含欧盟 Safety Gate 召回数据的安全标准页、以及车重与结构页——从另外几个角度瞄准同一个 95% 聚类。它们在这个时间窗内的历史都不足以被它评价。",
            "还有一处刻意不为：baaltto、haweek、avenor 等品牌长尾词合计约 10 次展示，每个 1–2 次，其中几个在本站目录里根本不存在。为了追逐单次展示去做单品牌页面，正是制造一堆薄内容联盟站的做法，所以我们没有做。",
          ],
          table: {
            caption: "厂家实际公布的年龄覆盖范围——15 款平衡车中有 14 款公布了数字年龄区间",
            columns: ["孩子年龄", "仍在适用范围内的车型"],
            rows: [
              ["18 个月", "11 / 14"],
              ["2 岁", "14 / 14"],
              ["2.5 岁", "7 / 14"],
              ["3 岁", "7 / 14"],
              ["4 岁", "4 / 14"],
              ["超过 60 个月", "0 / 14"],
            ],
          },
        },
        {
          eyebrow: "05 / 边界",
          title: "本页不允许被用来证明什么",
          body: [
            "这是一个没人认识的域名上 59 天的数据。它不是趋势，不是惩罚诊断，也不能证明任何单个页面应当被保留——包括我们自己做的、自己喜欢的那些页面。",
            "唯一值得复测的是美国那一行：156 次展示、0 次点击、平均排名 52.83。如果在五份原创数据页面上线之后约 30 天它仍然没有变化，那么限制就不在页面层面。到那时，诚实的做法是直说出来，而不是向同一堵墙再丢第六个页面。",
            "最后，我们只以合计形式公开自己站点的这些数字。导出文件中的单行数据在上面被汇总成表格，而不是逐字复制。",
          ],
        },
      ],
      primaryLink: {
        href: "/balance-bike-by-age/",
        label: "按年龄看平衡车",
        text: "依据本导出中最大的意图聚落构建的页面：27 个查询词带有明确的儿童年龄。",
      },
      secondaryLink: {
        href: "/balance-bike-stability/",
        label: "稳定性与轮距",
        text: "为本域名唯一进入前 20 名的三个查询词而建的页面，这三个词都包含 stable track。",
      },
      seo: {
        title: "Search Performance Note: Our Own Baseline, Published in Full",
        description:
          "Our Google Search Console baseline for balancebiketoddler.com: 171 impressions, 0 external clicks, 94.7% balance-bike demand against 8.9% balance-bike inventory — and what we changed because of it.",
        keywords: ["search performance note", "balance bike search demand", "site transparency report", "balancebiketoddler data"],
      },
    },
  },
  {
    key: "review-count-integrity",
    en: {
      path: TRANSPARENCY_PAGE_PATHS["review-count-integrity"],
      navLabel: "Review Count Integrity",
      title: "The Review Counts We Refuse to Publish",
      subtitle:
        "Ten listings in this catalogue carried review counts reaching 47 million. We deleted them rather than round them, and anything above 200,000 is now blocked automatically.",
      intro:
        "A review count is a claim about how many families bought something. Publishing a number we cannot defend is worse than publishing no number at all — especially when that same number silently changes how we rank products.",
      measuredLine: "Detected 13 Oct 2026 · gated the same day · 10 records affected · all in the stroller family",
      metrics: [
        { value: "47,475,530", label: "Largest count suppressed", note: "on a stroller listing" },
        { value: "200,000", label: "Credibility ceiling", note: "any count above this is dropped, not published" },
        { value: "10", label: "Records affected", note: "pages publishing a count went 176 → 166" },
        { value: "16 of 16", label: "Balance-bike pages clean", note: "no balance-bike listing ever carried a bad count" },
      ],
      sections: [
        {
          eyebrow: "01 / Defect",
          title: "What was actually wrong",
          body: [
            "A review-count field arrives with each catalogue record. Ten records carried values that cannot be true — up to 47,475,530 on a stroller listing and 47,475,117 on a Baby Trend playard. For scale, the highest credible figure anywhere in this catalogue is roughly 59,000 on a convertible car seat, and one of the biggest sellers on the site, the Radio Flyer wagon, shows 14,471.",
            "Forty-seven million ratings on a toddler playard exceeds plausible unit sales for that category by orders of magnitude.",
            "These are values inside our own catalogue as our collector recorded them. They are not figures published by any brand, and they have never appeared in a brand's own materials. The defect is in our pipeline, not in anyone's product.",
          ],
          table: {
            columns: ["Surface affected", "What happened"],
            rows: [
              ["Visible page copy", "Pages read star-rated copy followed by tens of millions of ratings"],
              ["Product structured data", "aggregateRating.ratingCount was emitted with the impossible value"],
              ["Internal ranking maths", "reviewCount / 100,000 in our scoring added up to +475 to a single row, silently reordering top-pick lists"],
            ],
          },
        },
        {
          eyebrow: "02 / Response",
          title: "Deleted rather than estimated",
          body: [
            "The count is dropped, not replaced with a plausible guess. Where the source supports it the star rating stays; the count and the entire aggregateRating block go with it.",
            "An aggregateRating whose ratingCount is fabricated is a structured-data violation. Losing the rich result is the lesser cost — a search result built on a number we invented would not be a small mistake, it would be this site's credibility spent on one field.",
            "One function now gates every path: credibleReviewCount() in src/lib/reviewSignal.ts. Prerendering, client-side structured data, API responses and our own scoring all route through it, so a future output surface cannot quietly bypass the rule.",
          ],
        },
        {
          eyebrow: "03 / Calibration",
          title: "Why the ceiling sits at 200,000",
          body: [
            "The threshold is deliberately an order of magnitude above anything credible in this catalogue. The largest defensible count we hold is about 59,000. Setting the gate far above that means legitimate movers cannot trip it — and empirically they did not: exactly ten records were suppressed, pages publishing a count fell from 176 to 166, and nothing else moved.",
            "If a real product ever does clear 200,000 ratings, that is a case worth noticing by hand rather than a case worth optimising for in advance.",
          ],
        },
        {
          eyebrow: "04 / Records",
          title: "The ten suppressed records",
          body: [
            "All ten sit in the stroller family, which the search data had already demoted to a subordinate section. Not one balance-bike page was affected.",
            "The values cluster suspiciously — several share leading digits (47,475,530 and 47,475,117; 4,444,511 and 4,444,515) — which points at a scraper or field-concatenation defect rather than ten independent typos. The fix belongs in the collector, not in ten hand-edited fields.",
          ],
          table: {
            columns: ["Page", "Published count", "Brand"],
            rows: [
              ["/products/strollers/stroller-b07pjmb6gf", "47,475,530", "—"],
              ["/products/strollers/playard-b07964sfw4", "47,475,117", "Baby Trend"],
              ["/products/strollers/stroller-b09jls8lsr", "46,465,563", "Mompush"],
              ["/products/strollers/playard-b08bt16th5", "45,455,104", "Dream On Me"],
              ["/products/strollers/stroller-b07g55y3dp", "44,445,715", "—"],
              ["/products/strollers/stroller-b008u4mku6", "4,646,593", "Baby Trend"],
              ["/products/strollers/stroller-b00gjixp5o", "4,545,537", "—"],
              ["/products/strollers/stroller-b07bb5vxbw", "4,545,528", "Baby Trend"],
              ["/products/strollers/stroller-b07kr61jvd", "4,444,511", "BABY JOY"],
              ["/products/strollers/stroller-b07b7qc8dv", "464,652", "Jeep"],
            ],
          },
        },
        {
          eyebrow: "05 / Guard",
          title: "How it stays fixed",
          body: [
            "npm run check:reviewcounts walks every HTML file in dist/, checking both the visible copy and the JSON-LD, and fails the run if any count exceeds the ceiling. The ceiling itself is read out of reviewSignal.ts by regex, so the guard cannot drift away from the rule it guards.",
            "If the collector is fixed at source, these ten rows leave the suppression list and their counts return automatically. Until then the correct answer for those pages is no number at all.",
          ],
        },
      ],
      primaryLink: {
        href: "/products/balance-bikes/",
        label: "Browse balance bikes",
        text: "Every balance-bike page passed this check clean — start where the inventory and the evidence agree.",
      },
      secondaryLink: {
        href: "/transparency/testing-methodology/",
        label: "How we score products",
        text: "See the rest of the scoring model, and why a corrupted count mattered more than a cosmetic defect.",
      },
      seo: {
        title: "Review Count Integrity: The Numbers We Refuse to Publish",
        description:
          "Ten catalogue listings carried review counts reaching 47 million. We suppressed them rather than estimate, set a hard credibility ceiling of 200,000, and added a build-time guard.",
        keywords: ["review count integrity", "data transparency", "structured data accuracy", "review credibility"],
      },
    },
    zh: {
      path: TRANSPARENCY_PAGE_PATHS["review-count-integrity"],
      navLabel: "Review Count Integrity",
      title: "我们拒绝公开的评论数量",
      subtitle: "本目录中十条商品记录携带了高达 4,700 万的评论数。我们没有把它四舍五入，而是直接删除，并自动拦截任何超过 200,000 的数字。",
      intro: "评论数量是在宣称有多少家庭买过某件东西。公开一个我们无法为其辩护的数字，比什么都不公开更糟——尤其当这个数字还会悄悄改变我们自己产品的排序结果。",
      measuredLine: "2026-10-13 发现并当日上线拦截 · 10 条记录受影响 · 全部位于推车品类",
      metrics: [
        { value: "47,475,530", label: "被拦截的最大数字", note: "出现在一条推车记录上" },
        { value: "200,000", label: "可信度上限", note: "超过这个值的评论数一律丢弃，不做展示" },
        { value: "10", label: "受影响记录数", note: "展示评论数的页面由 176 降至 166" },
        { value: "16 / 16", label: "平衡车页面全部干净", note: "没有任何平衡车记录携带异常数字" },
      ],
      sections: [
        {
          eyebrow: "01 / 缺陷",
          title: "到底哪里错了",
          body: [
            "每条目录记录都会带一个评论数字段。其中十条携带了不可能为真的数值——推车记录最高到 47,475,530，Baby Trend 游戏床记录为 47,475,117。作为参照：本目录中可信的最高数值约为 59,000（一款可转换安全座椅），而本站销量最大的商品之一 Radio Flyer 拖车为 14,471。",
            "给一款幼儿游戏床标 4,700 万条评分，比该品类可能的销量高出几个数量级。",
            "这些数字存在于我们自己的目录中，由我们的采集器写入。它们不是任何品牌公开的数字，也从未出现在任何品牌自己的材料里。缺陷在我们的数据管道里，而不是任何人的产品里。",
          ],
          table: {
            columns: ["受影响的输出面", "发生了什么"],
            rows: [
              ["页面可见文案", "页面出现星级文案后面跟着数千万条评分"],
              ["商品结构化数据", "aggregateRating.ratingCount 输出了这个不可能的数值"],
              ["内部排序算法", "评分公式中的 reviewCount / 100,000 给单条记录加了最多 +475 分，悄悄重排了推荐榜"],
            ],
          },
        },
        {
          eyebrow: "02 / 处置",
          title: "删除，而不是估算",
          body: [
            "数字被丢弃，而不是替换成一个看起来合理的猜测。来源支持的星级保留，评论数和整个 aggregateRating 块一起删除。",
            "一个 ratingCount 是捏造值的 aggregateRating 属于结构化数据违规。丢掉富媒体结果是更小的代价——建立在一个我们编造的数字之上的搜索结果，不是一个小错误，而是把全站信誉花在一个字段上。",
            "现在所有出口都经过同一个函数：src/lib/reviewSignal.ts 中的 credibleReviewCount()。预渲染、前端结构化数据、API 响应和我们自己的评分逻辑全部走这一处，因此将来任何新增输出口都无法悄悄绕过这条规则。",
          ],
        },
        {
          eyebrow: "03 / 标定",
          title: "为什么上限设在 200,000",
          body: [
            "这个阈值刻意设为本目录可信值的一个数量级以上。我们持有的可信最大值约为 59,000。把闸门设在远高于此的位置，正常热销品就不可能触碰到它——事实也确实如此：恰好只有十条记录被拦截，展示评论数的页面从 176 降到 166，其余没有任何副作用。",
            "如果将来真有产品突破 200,000 条评分，那也值得人工去注意，而不是提前为它做优化。",
          ],
        },
        {
          eyebrow: "04 / 记录",
          title: "被拦截的十条记录",
          body: [
            "十条全部位于推车品类——搜索数据早已把该品类降为从属板块。平衡车页面一条都没有受影响。",
            "这些数值聚簇得非常可疑——多条共享前几位数字（47,475,530 与 47,475,117；4,444,511 与 4,444,515）——指向采集器缺陷或字段拼接错误，而不是十次独立的手误。修复应该做在采集端，而不是手工改十个字段。",
          ],
          table: {
            columns: ["页面", "曾展示的数字", "品牌"],
            rows: [
              ["/products/strollers/stroller-b07pjmb6gf", "47,475,530", "—"],
              ["/products/strollers/playard-b07964sfw4", "47,475,117", "Baby Trend"],
              ["/products/strollers/stroller-b09jls8lsr", "46,465,563", "Mompush"],
              ["/products/strollers/playard-b08bt16th5", "45,455,104", "Dream On Me"],
              ["/products/strollers/stroller-b07g55y3dp", "44,445,715", "—"],
              ["/products/strollers/stroller-b008u4mku6", "4,646,593", "Baby Trend"],
              ["/products/strollers/stroller-b00gjixp5o", "4,545,537", "—"],
              ["/products/strollers/stroller-b07bb5vxbw", "4,545,528", "Baby Trend"],
              ["/products/strollers/stroller-b07kr61jvd", "4,444,511", "BABY JOY"],
              ["/products/strollers/stroller-b07b7qc8dv", "464,652", "Jeep"],
            ],
          },
        },
        {
          eyebrow: "05 / 守卫",
          title: "怎么保证不再发生",
          body: [
            "npm run check:reviewcounts 会遍历 dist/ 中每个 HTML 文件，同时检查可见文案与 JSON-LD，一旦出现超过上限的数字就让构建失败。上限值本身由正则表达式从 reviewSignal.ts 读出，因此守卫不可能与被它守卫的规则脱节。",
            "如果采集端在源头修好了，这十条就会离开拦截名单，它们的评论计数也会自动恢复。在那之前，对这些页面来说最正确的答案就是不显示任何数字。",
          ],
        },
      ],
      primaryLink: {
        href: "/products/balance-bikes/",
        label: "浏览平衡车",
        text: "每一页平衡车都干净通过了这项检查——从库存与证据一致的地方开始看。",
      },
      secondaryLink: {
        href: "/transparency/testing-methodology/",
        label: "我们如何给产品打分",
        text: "查看评分模型的其余部分，以及为什么一个被污染的数字比外观缺陷更严重。",
      },
      seo: {
        title: "Review Count Integrity: The Numbers We Refuse to Publish",
        description:
          "Ten catalogue listings carried review counts reaching 47 million. We suppressed them rather than estimate, set a hard credibility ceiling of 200,000, and added a build-time guard.",
        keywords: ["review count integrity", "data transparency", "structured data accuracy", "review credibility"],
      },
    },
  },
];

export function getTransparencyPageByPath(pathname: string) {
  const normalized = pathname.replace(/\/+$/, "").toLowerCase() || "/";
  return TRANSPARENCY_PAGES.find((page) => {
    const pagePathNormalized = String(page.en.path || "").replace(/\/+$/, "").toLowerCase() || "/";
    return pagePathNormalized === normalized;
  });
}

export function getTransparencyPageByKey(key: TransparencyPageKey) {
  return TRANSPARENCY_PAGES.find((page) => page.key === key) || TRANSPARENCY_PAGES[0];
}
