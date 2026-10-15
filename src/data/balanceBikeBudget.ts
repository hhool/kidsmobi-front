// Budget & value balance bike — Plan-B Asset 8.
//
// Why this page exists: the weekly keyword-opportunity scan shows "budget" and
// "cheap" balance-bike queries with zero pages on this domain answering them.
// 94.7% of this site's impressions are balance-bike queries, so the gap is real
// demand with no destination. This page answers it with honest, configuration-
// level advice — no fabricated specs, no paid picks, no invented price quotes.
//
// Unlike the stability asset, this one is not backed by a generated dataset: the
// budget tier is about configuration (frame material, tire type, adjustability),
// not hidden measurements, so the content is hand-authored and stays honest by
// describing tiers rather than scoring individual models.

export const BUDGET_PATH = "/balance-bike-budget/";

export interface BudgetStrings {
  eyebrow: string;
  heroTitle: string;
  heroLead: string;
  introTitle: string;
  introLead: string;
  bandsTitle: string;
  bandLowLabel: string;
  bandLow: string[];
  bandMidLabel: string;
  bandMid: string[];
  bandHighLabel: string;
  bandHigh: string[];
  tradeoffsTitle: string;
  tradeoffsLead: string;
  tradeoffItems: string[];
  checkTitle: string;
  checkLead: string;
  checkItems: string[];
  avoidTitle: string;
  avoidLead: string;
  avoidItems: string[];
  safetyTitle: string;
  safetyLead: string;
  safetyBody: string;
  faqTitle: string;
  faqs: Array<{ q: string; a: string }>;
  methodTitle: string;
  methodBody: string[];
  caveatTitle: string;
  caveatLead: string;
  caveatBody: string[];
  sourceLabel: string;
}

export const budgetStrings: Record<"en" | "zh", BudgetStrings> = {
  en: {
    eyebrow: "Budget & value",
    heroTitle: "Budget Balance Bike: Cheap Picks That Last",
    heroLead:
      "A budget balance bike can still teach a child to balance — the cheap ones just ask more of you at the curb. This guide breaks down what each price tier actually buys, the frame, tire and weight trade-offs nobody prints on the box, and the five checks that separate a cheap bike worth keeping from one to skip.",
    introTitle: "What “budget” means for a first bike",
    introLead:
      "A balance bike has no pedals, chain or drivetrain, so the cheap end of the market is genuinely usable — unlike a cheap pedal bike, a low-price balance bike still does the one job it exists for. The trade-offs show up in weight, adjustability and tire grip, not in whether it rolls.",
    bandsTitle: "What each price tier actually buys",
    bandLowLabel: "Entry tier — roughly under $30",
    bandLow: [
      "A steel frame and EVA foam wheels: light on the wallet, heavy in the hand.",
      "Fixed or minimal seat height, so it fits a narrower age window.",
      "Few or no steering limiters and basic bearings.",
      "Often the only tier where the bike outgrows the child before it wears out.",
    ],
    bandMidLabel: "Middle tier — roughly $30 to $60",
    bandMid: [
      "Lighter steel or entry aluminium, with a height-adjustable seat and sometimes bars.",
      "Better foam or introduced air-tired options for grip on grass.",
      "A steering limiter becomes common, which matters for first-time riders.",
      "The sweet spot for most toddlers, and resold easily once outgrown.",
    ],
    bandHighLabel: "Upper budget tier — roughly $60 to $90",
    bandHigh: [
      "Aluminium frames a small child can actually lift and carry.",
      "Air or premium foam tires, real bearings, and a wider adjustability range.",
      "Often the tier where a brand warranty and spare parts appear.",
      "Still a fraction of a premium wooden or composite bike.",
    ],
    tradeoffsTitle: "The trade-offs nobody prints on the box",
    tradeoffsLead:
      "Cheap is not unsafe, but it is a different ownership experience. Know which corners were cut before you buy.",
    tradeoffItems: [
      "Weight: a heavy bike is harder for a toddler to right after a tip and harder for you to carry home. At this age, grams matter more than they should.",
      "Tires: EVA foam rolls fine on pavement but slides on grass and gravel. Air tires grip better but add weight and can puncture. Neither is wrong — match it to where they ride.",
      "Adjustability: a fixed seat means the bike is useful for perhaps six months. An adjustable one can span two years and a second child.",
      "Bearings and finish: cheap hubs can develop play and thin paint chips. These are annoyances, not hazards — but they decide whether the bike survives to be handed down.",
    ],
    checkTitle: "Five checks before you buy on a budget",
    checkLead:
      "You do not need tools or a scale. These take two minutes from the listing photos or in the store.",
    checkItems: [
      "Seat-to-ground height: with the seat at its lowest, your child's feet should sit flat with a slight knee bend. This one number predicts whether they will use the bike at all.",
      "Adjustment range: count the seat positions. More positions mean longer useful life and a lower real cost per month.",
      "Tire type versus surface: if they will ride on anything but pavement, prioritise grip over the lowest price.",
      "Steering limiter: a 30 to 40 degree stop prevents the low-speed tip-overs that scare beginners off balance bikes entirely.",
      "Standards mark: look for EN 71, ASTM F963 or CPSC on the listing. Budget does not mean untested — see our safety standards reference.",
    ],
    avoidTitle: "What to skip",
    avoidLead:
      "A low price is only a deal if the bike gets used. A few patterns reliably end with the bike gathering dust.",
    avoidItems: [
      "Fixed seat with no adjustment — outgrown in a season, the worst cost per use of any option.",
      "No recognizable standards mark and no brand you can name — you are guessing on lead-safe finishes.",
      "Tiny 10-inch plastic wheels marketed as all-terrain — they bog down on the first patch of grass.",
      "Anything so heavy your child cannot pick it up — independence is the whole point of a balance bike.",
    ],
    safetyTitle: "Budget does not mean unsafe",
    safetyLead:
      "A balance bike has no motor, no pedals and no speed. The real safety questions are about materials and edges, not performance.",
    safetyBody:
      "Reputable budget brands still meet the same toy-safety standards as premium ones — EN 71 in Europe, ASTM F963 and CPSC in the US. What you lose at low prices is adjustability and finish, not compliance. Before trusting a no-name listing, confirm a standards mark and read our safety standards reference for what each one actually requires.",
    faqTitle: "Budget balance bike FAQs",
    faqs: [
      {
        q: "Is a $30 balance bike worth it?",
        a: "For a child just starting who may outgrow it in a year, yes — provided the seat adjusts and the tires suit your surface. Spend more only if you need it to last through a second child.",
      },
      {
        q: "Are cheap balance bikes safe?",
        a: "Safety depends on standards compliance and materials, not price. A budget bike with an EN 71, ASTM or CPSC mark is held to the same baseline as an expensive one.",
      },
      {
        q: "Should I buy foam or air tires on a budget?",
        a: "Foam is lighter and fine for pavement; air grips better off-road but is heavier and can puncture. Match the tire to where they will actually ride, not to the spec sheet.",
      },
      {
        q: "What is the best budget balance bike for a 1-year-old?",
        a: "Look for the lowest seat-to-ground height you can find, a light frame and a steering limiter. At this age the bike must be small and light enough for them to control — adjustability matters less than fit.",
      },
    ],
    methodTitle: "How we wrote this",
    methodBody: [
      "Source: public retailer and manufacturer listing copy for budget-tier balance bikes, read against the same CMS snapshot used across this site's reference pages.",
      "We describe typical tier characteristics — frame material, tire type, adjustability — not individual model scores. At this price band the differences are about configuration, not hidden performance.",
      "No product on this page was provided free or paid for placement. The checks reflect what a parent can verify in two minutes.",
      "Price bands are approximations of common market tiers and shift with sales; treat them as orientation, not a quote.",
    ],
    caveatTitle: "What this guide cannot tell you",
    caveatLead: "Two limits worth knowing before you rely on it:",
    caveatBody: [
      "We did not weigh or ride these bikes ourselves. The trade-offs described come from listing specifications and category norms, not from measurements we took.",
      "Prices move constantly with promotions. A middle-tier bike on sale can undercut the entry tier for a week — always check the seat height and tire type at the price you actually pay.",
    ],
    sourceLabel: "Source",
  },
  zh: {
    eyebrow: "预算与性价比",
    heroTitle: "平价平衡车：便宜也能用得久",
    heroLead:
      "便宜的平衡车照样能教会孩子平衡——只不过入门款在细节上对你要求更高。本页拆解每个价位段真正买到的是什么、车体、轮胎与重量上那些包装盒上不会印的取舍，以及五条能区分「值得买的便宜车」和「该跳过」的检查。",
    introTitle: "「预算」对第一台车意味着什么",
    introLead:
      "平衡车没有脚踏、链条和传动，所以低价端是真正能用的——不像便宜的脚踏车，低价平衡车依然完成了它存在的唯一任务。取舍体现在重量、可调节性和轮胎抓地上，而不是它能不能滚。",
    bandsTitle: "每个价位段真正买到什么",
    bandLowLabel: "入门段——约 30 美元以下",
    bandLow: [
      "钢架 + EVA 发泡轮：钱包轻松，手上沉。",
      "座高固定或调节极少，适用年龄窗口更窄。",
      "几乎没有转向限位，轴承也基础。",
      "往往是唯一一个「孩子没长大便被车甩在身后」的段位。",
    ],
    bandMidLabel: "中段——约 30 至 60 美元",
    bandMid: [
      "更轻的钢架或入门铝合金，座高（有时连车把）可调。",
      "更好的发泡轮，或开始出现充气胎以提升草地抓地。",
      "转向限位开始常见，对初次骑行者很关键。",
      "大多数 toddler 的甜点区，淘汰后也容易转手。",
    ],
    bandHighLabel: "高预算段——约 60 至 90 美元",
    bandHigh: [
      "孩子真能自己拎得动、扛得走的铝合金车架。",
      "充气胎或高级发泡胎、真轴承、更广的调节范围。",
      "往往开始出现品牌保修与备件。",
      "仍只相当于高端木质或复合材质车的一小部分价格。",
    ],
    tradeoffsTitle: "包装盒上不会印的取舍",
    tradeoffsLead: "便宜不等于不安全，但拥有体验确实不同。买之前先弄清砍掉了哪些地方。",
    tradeoffItems: [
      "重量：重的车，孩子侧翻后更难自己扶起，你也更难拎回家。这个年纪，克数比想象中更重要。",
      "轮胎：EVA 发泡在铺装路面顺滑，但在草地和碎石上打滑；充气胎抓地更好却更重、还可能扎破。没有谁「错」，只取决于他们实际在哪骑。",
      "可调节性：座高固定意味着车可能只用半年；可调的能跨两年、甚至第二个孩子。",
      "轴承与漆面：便宜的轮毂可能出旷量，薄漆会掉。这些是烦人，不是危险——但它们决定车能不能传到下一代。",
    ],
    checkTitle: "预算购买前的五项检查",
    checkLead: "不需要工具，也不需要秤。看商品图或到店，两分钟就能完成。",
    checkItems: [
      "座高到地面：座高调到最低时，孩子的脚应平踩、膝盖略弯。这一个数字决定了他们到底会不会用这台车。",
      "调节档位：数一数座高有几档。档位越多，可用时间越长，每月真实成本越低。",
      "轮胎类型 vs 路面：只要不在纯铺装路面骑，优先抓地而非最低价。",
      "转向限位：30–40 度的限位能挡住低速侧翻——那正是新手放弃平衡车的主因。",
      "认证标识：认准 EN 71、ASTM F963 或 CPSC。便宜不等于没检测——见我们的安全标准参考页。",
    ],
    avoidTitle: "哪些该跳过",
    avoidLead: "低价只有在车被用起来时才是划算。下面几种模式往往以吃灰收场。",
    avoidItems: [
      "座高固定、不可调——一个季度就被淘汰，是所有选项里每用一次成本最高的。",
      "没有任何可辨识的认证标识、也叫不出品牌的——你是在赌铅安全漆面。",
      "标榜「全地形」的 10 英寸小塑料轮——遇到第一片草地就陷住。",
      "重到孩子自己拎不动的——独立骑行本就是平衡车的全部意义。",
    ],
    safetyTitle: "便宜不等于不安全",
    safetyLead: "平衡车没有马达、没有脚踏、也没有速度。真正的安全问题在材料和边角，不在性能。",
    safetyBody:
      "靠谱的平价品牌同样满足高端车的安全玩具标准——欧洲 EN 71、美国 ASTM F963 与 CPSC。低价丢掉的是可调性和漆面，不是合规。信任无名Listing 之前，先确认认证标识，并阅读我们的安全标准参考页，看每项标准到底要求什么。",
    faqTitle: "平价平衡车常见问题",
    faqs: [
      {
        q: "30 美元的平衡车值得买吗？",
        a: "对刚起步、可能一年就淘汰的孩子来说，值得——前提是座高可调、轮胎匹配你的路面。只有在需要它撑过第二个孩子时才值得多花。",
      },
      {
        q: "便宜的平衡车安全吗？",
        a: "安全取决于标准合规与材料，而非价格。带 EN 71、ASTM 或 CPSC 标识的平价车，与贵价车执行的是同一基线。",
      },
      {
        q: "预算有限该买发泡胎还是充气胎？",
        a: "发泡更轻、铺装路面够用；充气抓地更好但更重、可能扎破。按他们实际骑行的路面选，而不是按参数表。",
      },
      {
        q: "1 岁宝宝最好的平价平衡车是什么？",
        a: "找你能找到的最低座高、轻车架和转向限位。这个年纪车必须小到、轻到他们能掌控——适配比可调性更重要。",
      },
    ],
    methodTitle: "本页是怎么写出来的",
    methodBody: [
      "来源：平价段平衡车的公开零售商与品牌方商品页文案，对照本站参考页共用的同一份 CMS 快照读取。",
      "我们描述的是典型段位特征——车架材质、轮胎类型、可调节性——而非单款打分。这个价位段的差异在于配置，而非隐藏性能。",
      "本页没有任何产品是免费或付费投放的。检查项反映的是家长两分钟能自行核对的要点。",
      "价位段是对常见市场档位的近似，会随促销变动；请当作方向，而非报价。",
    ],
    caveatTitle: "本指南无法告诉你的",
    caveatLead: "依赖它之前，有两条限制值得知道：",
    caveatBody: [
      "这些车我们没有亲手称重或试骑。所描述的取舍来自商品规格与品类常规，不是我们实测的数据。",
      "价格随促销不断变化。中段车大促时可能一周内比入门段还便宜——永远以你实际支付价格下的座高与轮胎类型为准。",
    ],
    sourceLabel: "来源",
  },
};

export const budgetSeo = {
  en: {
    title: "Budget Balance Bike: Cheap Picks That Last",
    description:
      "A budget balance bike can still teach balance. Here are the price tiers, the frame, tire and weight trade-offs, and the checks that separate a cheap bike worth keeping from one to skip.",
    canonical: BUDGET_PATH,
    keywords: [
      "budget balance bike",
      "cheap balance bike",
      "balance bike under $50",
      "affordable balance bike for toddlers",
      "best budget toddler bike",
      "balance bike price",
      "cheap first bike for 1 year old",
      "value balance bike for 2 year old",
    ],
  },
  zh: {
    title: "平价平衡车：便宜也能用得久",
    description:
      "便宜的平衡车照样能教会孩子平衡。这里讲清价位段、车架/轮胎/重量的取舍，以及区分「值得买的便宜车」与「该跳过」的检查。",
    canonical: BUDGET_PATH,
    keywords: [
      "平价平衡车",
      "便宜平衡车",
      "50美元以下平衡车",
      "幼儿平价平衡车",
      "性价比平衡车",
      "平衡车价格",
      "一岁宝宝入门平衡车",
      "两岁宝宝平衡车",
    ],
  },
};
