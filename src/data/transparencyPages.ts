import type { SEOConfig } from "../types";

export type TransparencyPageKey = "disclaimer" | "testing-methodology" | "certification" | "privacy-policy";

export type TransparencyPageSection = {
  eyebrow: string;
  title: string;
  body: string[];
};

export type TransparencyPageContent = {
  path: string;
  navLabel: string;
  title: string;
  subtitle: string;
  intro: string;
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
  disclaimer: "/disclaimer",
  "testing-methodology": "/testing-methodology",
  certification: "/certification",
  "privacy-policy": "/privacy-policy",
};

export const TRANSPARENCY_PAGES: LocalizedTransparencyPage[] = [
  {
    key: "disclaimer",
    en: {
      path: TRANSPARENCY_PAGE_PATHS.disclaimer,
      navLabel: "Disclaimer",
      title: "Independent Declaration: No Brand Recharge, No Soft Scores",
      subtitle: "We do not sell rankings. We buy, measure, stress, and sometimes physically retire unsafe kids mobility products so parents can make harder decisions with cleaner evidence.",
      intro: "KIDSMOBI exists because glossy product pages do not show wobble, brake lag, load drift, or the moment a frame starts lying under stress. This is our operating oath.",
      sections: [
        {
          eyebrow: "01 / Funding",
          title: "Affiliate revenue is fuel, not a steering wheel",
          body: [
            "Some pages may contain commerce links. If a parent buys through one of those links, KIDSMOBI may receive a small commission. That money does not buy a better score, a softer headline, or a hidden editorial pass.",
            "Our rule is blunt: the test result moves first, the link follows later. If a product fails our safety logic, affiliate potential does not rescue it. The commission helps fund the next anonymous sample order, replacement brake cable, broken wheel fixture, and teardown session."
          ],
        },
        {
          eyebrow: "02 / Sample policy",
          title: "We prefer anonymous purchase over brand theater",
          body: [
            "When a product is important enough to audit, we prefer buying like a normal customer instead of accepting polished review units. Brands are not allowed to pre-approve verdicts, rewrite cons, or bury lab notes.",
            "If we ever use manufacturer-provided material, it is treated as source evidence, not gospel. Specs are cross-checked against category benchmarks, field logic, and the same mechanical scoring system used across the site."
          ],
        },
        {
          eyebrow: "03 / Liability boundary",
          title: "Data guidance is not a legal certificate",
          body: [
            "KIDSMOBI score indexes, rim-size suggestions, load-ratio warnings, and shortlist recommendations are independent biomechanical and editorial assessments. They do not replace official certifications, pediatric advice, manufacturer manuals, or local safety law.",
            "Parents should always inspect the final product, follow age and weight limits, use protective gear, and stop using any product that behaves differently from its manual or from common sense."
          ],
        },
      ],
      primaryLink: {
        href: "/reviews",
        label: "See the lab review desk",
        text: "Trace this independence pledge into our lab-tested reviews, where every score has to survive the same editorial firewall.",
      },
      secondaryLink: {
        href: "/products",
        label: "Compare product data",
        text: "Use the product hub to compare the raw specs that feed our verdicts before you trust any shortlist.",
      },
      seo: {
        title: "KIDSMOBI Independent Disclaimer & Affiliate Disclosure",
        description: "Read KIDSMOBI's independent declaration: no paid rankings, no brand recharge, anonymous testing preference, and clear affiliate disclosure.",
        keywords: ["KIDSMOBI disclaimer", "affiliate disclosure", "independent reviews", "kids mobility safety"],
      },
    },
    zh: {
      path: TRANSPARENCY_PAGE_PATHS.disclaimer,
      navLabel: "Disclaimer",
      title: "独立宣言：不接受品牌充值，不出售评分温柔乡",
      subtitle: "我们不卖排名。我们购买、测量、施压、拆解，并在必要时让不合格童车产品接受物理意义上的退场。",
      intro: "KIDSMOBI 存在的原因很简单：商品详情页不会告诉你车架何时开始晃、刹车何时慢半拍、承重何时越过红线。这是我们的操作誓言。",
      sections: [
        {
          eyebrow: "01 / 资金来源",
          title: "佣金是燃料，不是方向盘",
          body: [
            "部分页面可能包含商业链接。家长通过这些链接购买时，KIDSMOBI 可能获得微薄佣金。但这笔钱买不到更高分数、更软标题，也买不到隐藏缺点的编辑通行证。",
            "我们的规则很硬：测试结果先走，链接随后。产品如果没有通过安全逻辑，佣金潜力救不了它。佣金只会继续资助下一台匿名样机、下一根备用刹车线、下一次断轮夹具和拆解测试。"
          ],
        },
        {
          eyebrow: "02 / 样机原则",
          title: "我们更相信匿名购买，不相信品牌摆拍",
          body: [
            "足够重要的产品，我们优先像普通用户一样购买，而不是接受精修过的评测样机。品牌不能预审结论、改写缺点或要求删除实验室备注。",
            "如果必须引用品牌资料，我们只把它当作证据来源，而不是圣旨。参数仍要经过品类基准、场景逻辑和全站统一机械评分系统交叉检查。"
          ],
        },
        {
          eyebrow: "03 / 责任边界",
          title: "数据建议不是法律证书",
          body: [
            "KIDSMOBI 的评分、轮径建议、车重警示与选购结论均为独立力学评估和编辑判断，不替代官方认证、儿科医生建议、品牌说明书或当地安全法规。",
            "家长仍应检查最终到手产品，遵守年龄与体重限制，佩戴必要护具；任何产品表现与说明书或常识不一致时，都应立即停止使用。"
          ],
        },
      ],
      primaryLink: {
        href: "/reviews",
        label: "查看实验室评测中心",
        text: "把这份独立宣言追踪到我们的实验室评测中心，那里每个分数都必须穿过同一套编辑防火墙。",
      },
      secondaryLink: {
        href: "/products",
        label: "比较产品数据",
        text: "进入产品库比较喂给结论的原始参数，再决定是否信任任何推荐清单。",
      },
      seo: {
        title: "KIDSMOBI Independent Disclaimer & Affiliate Disclosure",
        description: "Read KIDSMOBI's independent declaration: no paid rankings, no brand recharge, anonymous testing preference, and clear affiliate disclosure.",
        keywords: ["KIDSMOBI disclaimer", "affiliate disclosure", "independent reviews", "kids mobility safety"],
      },
    },
  },
  {
    key: "testing-methodology",
    en: {
      path: TRANSPARENCY_PAGE_PATHS["testing-methodology"],
      navLabel: "Testing Methodology",
      title: "Testing Methodology: The Lab Playbook Behind Every Verdict",
      subtitle: "Our score is not a vibe. It is a collision between child-fit math, mechanical stress logic, braking audits, and editorial suspicion.",
      intro: "KIDSMOBI reviews are built for parents who want to know what happens after the lifestyle photo ends and physics starts asking questions.",
      sections: [
        {
          eyebrow: "01 / 30% load line",
          title: "The 30% body-weight redline test",
          body: [
            "A kids mobility product that is too heavy for the child does not merely feel inconvenient; it changes recovery time, steering correction, and tip-over risk. Our sizing logic flags products that push the ride system beyond roughly 30% of the child's body weight.",
            "This rule powers stroller, balance bike, kids bike, and scooter recommendations because weight is the silent variable behind confidence, fatigue, and loss-of-control moments."
          ],
        },
        {
          eyebrow: "02 / Brake audit",
          title: "15 km/h dynamic braking sanity check",
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
        text: "Use the review center to see how these tests translate into real product verdicts and category rankings.",
      },
      secondaryLink: {
        href: "/products",
        label: "Audit the product database",
        text: "Open the product hub when you want to compare weight, price, and safety fields before reading a final score.",
      },
      seo: {
        title: "KIDSMOBI Testing Methodology: Kids Mobility Lab Playbook",
        description: "Explore KIDSMOBI's testing methodology: 30% weight redline, dynamic brake audits, recline checks, and frame-stability logic.",
        keywords: ["testing methodology", "kids mobility lab", "brake audit", "stroller safety testing"],
      },
    },
    zh: {
      path: TRANSPARENCY_PAGE_PATHS["testing-methodology"],
      navLabel: "Testing Methodology",
      title: "实验室武功秘籍：每个结论背后的测试方法论",
      subtitle: "我们的评分不是感觉，而是儿童尺寸数学、机械应力逻辑、制动审计和编辑怀疑精神的碰撞结果。",
      intro: "KIDSMOBI 评测写给那些想知道生活方式美图结束后，物理世界会怎样发问的家长。",
      sections: [
        {
          eyebrow: "01 / 30% 红线",
          title: "体重 30% 车重红线测试",
          body: [
            "对孩子来说，过重的出行产品不只是费劲，它会改变恢复时间、转向修正能力和倾覆风险。我们的尺寸逻辑会标记接近或超过孩子体重 30% 的骑乘系统。",
            "这条规则贯穿推车、平衡车、儿童自行车和滑板车推荐，因为重量是自信、疲劳和失控瞬间背后的隐形变量。"
          ],
        },
        {
          eyebrow: "02 / 制动审计",
          title: "15km/h 动态刹车合理性检查",
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
        text: "进入评测中心，查看这些测试如何转化为真实产品结论和品类排行。",
      },
      secondaryLink: {
        href: "/products",
        label: "审计产品数据库",
        text: "想在阅读最终分数前比较重量、价格和安全字段，可先打开产品库。",
      },
      seo: {
        title: "KIDSMOBI Testing Methodology: Kids Mobility Lab Playbook",
        description: "Explore KIDSMOBI's testing methodology: 30% weight redline, dynamic brake audits, recline checks, and frame-stability logic.",
        keywords: ["testing methodology", "kids mobility lab", "brake audit", "stroller safety testing"],
      },
    },
  },
  {
    key: "certification",
    en: {
      path: TRANSPARENCY_PAGE_PATHS.certification,
      navLabel: "Certification & Lab Notes",
      title: "Certification & Lab Notes: The Standards Matrix We Keep on the Bench",
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
          title: "Why lab notes stay attached to reviews",
          body: [
            "Our lab notes preserve the reason a product was promoted, downgraded, or excluded. This matters when new versions appear, stock photos change, or a marketplace listing quietly rewrites its claims.",
            "The standards matrix helps crawlers and parents understand that KIDSMOBI is not a coupon blog wearing a lab coat. The review has an evidence trail."
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
        title: "KIDSMOBI Certification Notes: CPSC, ASTM, ISO & Lab Matrix",
        description: "See the standards KIDSMOBI references, including CPSC, ASTM F963, ISO 8098, EN 71, and editorial lab-note handling.",
        keywords: ["certification notes", "CPSC", "ASTM F963", "ISO 8098", "lab standards"],
      },
    },
    zh: {
      path: TRANSPARENCY_PAGE_PATHS.certification,
      navLabel: "Certification & Lab Notes",
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
          eyebrow: "实验室日志 / 证据处理",
          title: "来源声明是证据，不是结论",
          body: [
            "商品描述里的认证徽章值得关注，但不会自动获得信任。我们仍会把声明放回品类、可见结构、限制条件和家长真正面对的失效场景里比较。",
            "产品来源没有展示证书时，我们不会编造；展示证书时，也不会让徽章掩盖糟糕人体工学、弱刹车、混乱装配或错误重量逻辑。"
          ],
        },
        {
          eyebrow: "审计轨迹 / 编辑记忆",
          title: "为什么实验室日志要挂在评测旁边",
          body: [
            "实验室日志保留一个产品被推荐、降级或排除的原因。当新版本出现、库存图变化、平台页面悄悄改写宣传语时，这种记忆很重要。",
            "标准矩阵帮助爬虫和家长理解：KIDSMOBI 不是穿着白大褂的优惠券博客，评测背后有证据链。"
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
        title: "KIDSMOBI Certification Notes: CPSC, ASTM, ISO & Lab Matrix",
        description: "See the standards KIDSMOBI references, including CPSC, ASTM F963, ISO 8098, EN 71, and editorial lab-note handling.",
        keywords: ["certification notes", "CPSC", "ASTM F963", "ISO 8098", "lab standards"],
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
      intro: "KIDSMOBI handles sizing data like a lab handles a volatile sample: use it for the current measurement, keep the minimum needed, and never sell it to the advertising machine.",
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
            "KIDSMOBI avoids advertising trackers and does not sell personal data. We use privacy-sensitive analytics and operational logs only to keep the site stable, detect abuse, and understand which safety resources actually help families.",
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
        title: "KIDSMOBI Privacy Policy: Parent Data Firewall",
        description: "KIDSMOBI privacy policy for parents: local Smart Wizard sizing, no sale of child fit data, and narrow account data use.",
        keywords: ["privacy policy", "parent data", "Smart Wizard", "child fit data", "KIDSMOBI privacy"],
      },
    },
    zh: {
      path: TRANSPARENCY_PAGE_PATHS["privacy-policy"],
      navLabel: "Privacy Policy",
      title: "家长定心丸：儿童数据防火墙",
      subtitle: "孩子的尺寸数据不是库存。Smart Wizard 的测算默认留在本地，除非你主动选择账号功能。",
      intro: "KIDSMOBI 处理尺寸数据的方式像实验室处理不稳定样本：只为当前测算使用，保留最少必要信息，绝不卖给广告机器。",
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
          title: "我们不把家长注意力卖成产品",
          body: [
            "KIDSMOBI 避免广告追踪器，不出售个人数据。我们只使用隐私友好的分析和运行日志来保持站点稳定、识别滥用，并理解哪些安全资源真正帮助家庭。",
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
        title: "KIDSMOBI Privacy Policy: Parent Data Firewall",
        description: "KIDSMOBI privacy policy for parents: local Smart Wizard sizing, no sale of child fit data, and narrow account data use.",
        keywords: ["privacy policy", "parent data", "Smart Wizard", "child fit data", "KIDSMOBI privacy"],
      },
    },
  },
];

export function getTransparencyPageByPath(pathname: string) {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  return TRANSPARENCY_PAGES.find((page) => page.en.path === normalized);
}

export function getTransparencyPageByKey(key: TransparencyPageKey) {
  return TRANSPARENCY_PAGES.find((page) => page.key === key) || TRANSPARENCY_PAGES[0];
}
